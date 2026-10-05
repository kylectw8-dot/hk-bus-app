export const companyOf = r => ['CTB','GMB'].includes(r.co) ? r.co : 'KMB';
export const regionLabel = region => ({HKI:'香港島',KLN:'九龍',NT:'新界'}[region] || region || '');
export const companyLabel = r => ({KMB:'九巴／龍運',CTB:'城巴',GMB:'專線小巴'}[companyOf(r)]);
export const routeKey = r => companyOf(r)==='GMB' ? ['GMB',r.region,r.route,r.route_id||'index',r.route_seq||''].join('|') : [companyOf(r), r.route, r.bound, r.service_type || '1'].join('|');
export const favouriteKey = (r, s) => `${routeKey(r)}|${s.stop}|${s.seq}`;

export function normalizeRoutes(data, company) {
  if (company === 'KMB') return data.map(r => ({...r, co: 'KMB', service_type: String(r.service_type)}));
  return data.flatMap(r => [
    {...r, co: 'CTB', bound: 'O', service_type: '1'},
    {...r, co: 'CTB', bound: 'I', service_type: '1', orig_tc: r.dest_tc, dest_tc: r.orig_tc, orig_en: r.dest_en, dest_en: r.orig_en}
  ]);
}

export function filterRoutes(routes, query, company = 'ALL', region = 'ALL') {
  const q = query.trim().toUpperCase();
  return routes.filter(r => (company === 'ALL' || companyOf(r) === company) && (companyOf(r)!=='GMB'||region==='ALL'||r.region===region) && (!q || r.route.toUpperCase().startsWith(q)))
    .sort((a,b) => (a.route.toUpperCase() === q ? -1 : 0) - (b.route.toUpperCase() === q ? -1 : 0)
      || a.route.localeCompare(b.route, 'en', {numeric: true}) || companyOf(a).localeCompare(companyOf(b))
      || a.bound.localeCompare(b.bound) || Number(a.service_type) - Number(b.service_type));
}

export function matchesEta(e, r, stop) {
  if(companyOf(r)==='GMB') return e.co==='GMB' && String(e.route_id)===String(r.route_id) && String(e.route_seq)===String(r.route_seq) && Number(e.seq)===Number(stop.seq) && String(e.stop)===String(stop.stop);
  return e.route === r.route && e.dir === r.bound && Number(e.seq) === Number(stop.seq)
    && (!e.co || e.co.toUpperCase() === companyOf(r))
    && (companyOf(r) === 'CTB'
      ? (!e.stop || e.stop === stop.stop)
      : String(e.service_type) === String(r.service_type));
}

export function selectEtas(data, r, stop, now = Date.now()) {
  return data.filter(e => matchesEta(e,r,stop) && e.eta && Number.isFinite(Date.parse(e.eta)) && Date.parse(e.eta) >= now - 30000)
    .sort((a,b) => Date.parse(a.eta) - Date.parse(b.eta)).slice(0,3);
}
export function selectRemarks(data, r, stop) {
  return [...new Set(data.filter(e => matchesEta(e,r,stop)).map(e => e.rmk_tc).filter(Boolean))];
}
export function arrivalLabel(eta, now = Date.now()) {
  const diff = Date.parse(eta) - now;
  return diff <= 60000 ? '即將到站' : String(Math.ceil(diff / 60000));
}

export function normalizeGmbRoutes(data,region,code) {
  return data.flatMap(r => (r.directions || []).map(d => ({
    ...d, co:'GMB', region:r.region||region, route:r.route_code||code,
    route_id:String(r.route_id), route_seq:String(d.route_seq), bound:String(d.route_seq),
    service_type:String(r.route_id), description_tc:r.description_tc||''
  })));
}
export function normalizeGmbEtas(data,r,s) {
  const identity={co:'GMB',route:r.route,route_id:r.route_id,route_seq:r.route_seq,seq:s.seq,stop:String(s.stop)};
  if(String(data.stop_id)!==String(s.stop)) throw Error('Unexpected GMB stop');
  if(data.enabled===false) return [{...identity,eta:null,rmk_tc:data.description_tc||'此站到站預報暫停'}];
  if(data.enabled!==true||!Array.isArray(data.eta)) throw Error('Invalid GMB ETA');
  return data.eta.map(e=>({...identity,eta:e.timestamp,eta_seq:e.eta_seq,rmk_tc:e.remarks_tc||''}));
}
