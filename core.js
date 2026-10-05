export const routeKey = r => [r.route,r.bound,r.service_type].join('|');
export function filterRoutes(routes,query){const q=query.trim().toUpperCase();return routes.filter(r=>!q||r.route.toUpperCase().startsWith(q)).sort((a,b)=>(a.route.toUpperCase()===q?-1:0)-(b.route.toUpperCase()===q?-1:0)||a.route.localeCompare(b.route,'en',{numeric:true})||a.bound.localeCompare(b.bound)||Number(a.service_type)-Number(b.service_type));}
export function selectEtas(data,r,stop,now=Date.now()){return data.filter(e=>e.route===r.route&&e.dir===r.bound&&String(e.service_type)===String(r.service_type)&&Number(e.seq)===Number(stop.seq)&&e.eta&&Number.isFinite(Date.parse(e.eta))&&Date.parse(e.eta)>=now-30000).sort((a,b)=>Date.parse(a.eta)-Date.parse(b.eta)).slice(0,3);}
export function arrivalLabel(eta,now=Date.now()){const diff=Date.parse(eta)-now;return diff<=60000?'即將到站':String(Math.ceil(diff/60000));}
export const favouriteKey = (r,s) => `${routeKey(r)}|${s.stop}|${s.seq}`;
