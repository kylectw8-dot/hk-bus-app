import {companyOf, normalizeRoutes} from './core.js';
export const BASES = {
  KMB: 'https://data.etabus.gov.hk/v1/transport/kmb',
  CTB: 'https://rt.data.gov.hk/v2/transport/citybus'
};
const enc = encodeURIComponent;
export function routeStopPath(r) {
  const direction = r.bound === 'O' ? 'outbound' : 'inbound';
  return companyOf(r) === 'CTB' ? `/route-stop/CTB/${enc(r.route)}/${direction}`
    : `/route-stop/${enc(r.route)}/${direction}/${enc(r.service_type)}`;
}
export function etaPath(r,s) {
  return companyOf(r) === 'CTB' ? `/eta/CTB/${enc(s.stop)}/${enc(r.route)}`
    : `/eta/${enc(s.stop)}/${enc(r.route)}/${enc(r.service_type)}`;
}
export function createApi(fetcher = (...args) => fetch(...args)) {
  const stopCache = {KMB: new Map(), CTB: new Map()};
  let kmbStopRequest = null;
  async function request(company,path,array = true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetcher(BASES[company] + path, {signal: controller.signal});
      if (!res.ok) throw Error('HTTP ' + res.status);
      const json = await res.json();
      if (array ? !Array.isArray(json.data) : !json.data || Array.isArray(json.data) || typeof json.data !== 'object') throw Error('Invalid API response');
      return json.data;
    } finally {clearTimeout(timer);}
  }
  async function routes(company) {
    return normalizeRoutes(await request(company, company === 'CTB' ? '/route/CTB' : '/route/'), company);
  }
  async function stops(r) {
    const company = companyOf(r);
    const rows = (await request(company, routeStopPath(r))).sort((a,b) => Number(a.seq) - Number(b.seq));
    if (company === 'KMB') {
      if (!kmbStopRequest) kmbStopRequest = request('KMB','/stop').then(data => {
        for (const s of data) stopCache.KMB.set(s.stop,s);
      }).catch(error => {kmbStopRequest = null; throw error;});
      await kmbStopRequest;
    } else {
      // Citybus returns one stop object per request. Limit concurrency and reuse names.
      const ids = [...new Set(rows.map(s => s.stop))].filter(id => !stopCache.CTB.has(id));
      let cursor = 0;
      await Promise.all(Array.from({length: Math.min(4,ids.length)}, async () => {
        while (cursor < ids.length) {
          const id = ids[cursor++];
          try {
            const s = await request('CTB', `/stop/${enc(id)}`, false);
            if (s.stop === id && s.name_tc) stopCache.CTB.set(id,s);
          } catch { /* Show stop IDs if individual name lookups fail. */ }
        }
      }));
    }
    return rows.map(s => ({...s, name_tc: stopCache[company].get(s.stop)?.name_tc || s.stop, nameMissing: !stopCache[company].get(s.stop)?.name_tc}));
  }
  return {routes, stops, etas: (r,s) => request(companyOf(r),etaPath(r,s))};
}
