// Anonymous funnel counting for thetinycrisis.com. No cookies, no names, no emails: just "how far did people get".
// PostHog project token (write-only, safe in public pages). Empty = nothing is sent.
(() => {
  const KEY = 'phc_pSBB748uBVXiEJvDhrjMxeZUy5ccFj6DptBRFaGAKGsV';
  const HOST = 'https://us.i.posthog.com';   // Mohamed's project is US Cloud (27 Oct)
  let vid;
  try { vid = sessionStorage.getItem('tcv'); if (!vid) { vid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); sessionStorage.setItem('tcv', vid); } }
  catch (e) { vid = String(Math.random()).slice(2); }
  const seen = {};
  window.tcTrack = (ev, props, once) => {
    if (!KEY) return;
    if (once) { if (seen[ev]) return; seen[ev] = 1; }
    const body = JSON.stringify({ api_key: KEY, event: ev, distinct_id: vid,
      properties: Object.assign({ $current_url: location.href, $host: location.host, width: innerWidth, $process_person_profile: false }, props || {}) });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(HOST + '/capture/', new Blob([body], { type: 'text/plain' }));
      else fetch(HOST + '/capture/', { method: 'POST', body, keepalive: true });
    } catch (e) { /* never break the page for stats */ }
  };
})();
