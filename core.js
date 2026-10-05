export const companyOf = r => r.co === 'CTB' ? 'CTB' : 'KMB';
export const companyLabel = r => companyOf(r) === 'CTB' ? '城巴' : '九巴／龍運';
export const routeKey = r => [companyOf(r), r.route, r.bound, r.service_type || '1'].join('|');
export const favouriteKey = (r, s) => `${routeKey(r)}|${s.stop}|${s.seq}`;

export function normalizeRoutes(data, company) {
  if (company === 'KMB') return data.map(r => ({...r, co: 'KMB', service_type: String(r.service_type)}));
  return data.flatMap(r => [
    {...r, co: 'CTB', bound: 'O', service_type: '1'},
    {...r, co: 'CTB', bound: 'I', service_type: '1', orig_tc: r.dest_tc, dest_tc: r.orig_tc, orig_en: r.dest_en, dest_en: r.orig_en}
  ]);
}

export function filterRoutes(routes, query, company = 'ALL') {
  const q = query.trim().toUpperCase();
  return routes.filter(r => (company === 'ALL' || companyOf(r) === company) && (!q || r.route.toUpperCase().startsWith(q)))
    .sort((a,b) => (a.route.toUpperCase() === q ? -1 : 0) - (b.route.toUpperCase() === q ? -1 : 0)
      || a.route.localeCompare(b.route, 'en', {numeric: true}) || companyOf(a).localeCompare(companyOf(b))
      || a.bound.localeCompare(b.bound) || Number(a.service_type) - Number(b.service_type));
}

export function matchesEta(e, r, stop) {
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
