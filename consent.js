/* CAV cookie consent (shared by every page).
 * - Nothing optional runs before a choice: analytics/marketing tags must be added as
 *   <script type="text/plain" data-consent="analytics" src="…"></script> and are only switched on after opt-in.
 * - Accept and Reject are equally easy; no box is pre-ticked; the choice is dated and asked again after 12 months
 *   or when the categories change (VERSION).
 * - Google Consent Mode v2 defaults to "denied" so a GA/Ads tag added later respects the choice.
 * - "Cookie settings" ([data-cookie-settings]) reopens the choices at any time; withdrawing removes analytics cookies.
 */
(() => {
  'use strict';
  const NAME = 'cav_consent', VERSION = 1, MAX_AGE = 365 * 24 * 3600;
  const CATS = ['analytics', 'marketing'];

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 });

  const read = () => {
    const m = document.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
    if (!m) return null;
    try {
      const c = JSON.parse(decodeURIComponent(m[1]));
      if (c.v !== VERSION || Date.now() - c.ts > MAX_AGE * 1000) return null;
      return c;
    } catch { return null; }
  };
  const write = c => {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${NAME}=${encodeURIComponent(JSON.stringify(c))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  };
  // analytics cookies set by common tools; removed when consent is withdrawn
  const dropAnalytics = () => document.cookie.split('; ').map(s => s.split('=')[0])
    .filter(n => /^(_ga|_gid|_gat|_gcl|_fbp|_clck|_clsk)/.test(n))
    .forEach(n => {
      const host = location.hostname, parts = host.split('.');
      [host, '.' + parts.slice(-2).join('.'), ''].forEach(d => {
        document.cookie = `${n}=; Max-Age=0; Path=/${d ? '; Domain=' + d : ''}`;
      });
    });

  let current = read(), activated = new Set();
  const apply = c => {
    gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied',
    });
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(old => {
      const cat = old.dataset.consent;
      if (!c[cat] || old.dataset.done) return;
      const s = document.createElement('script');
      [...old.attributes].forEach(a => { if (a.name !== 'type' && a.name !== 'data-consent') s.setAttribute(a.name, a.value); });
      s.text = old.text;
      old.dataset.done = '1';
      old.after(s);
      activated.add(cat);
    });
    document.dispatchEvent(new CustomEvent('cav:consent', { detail: { ...c } }));
  };

  /* ---- UI ---- */
  const banner = document.createElement('section');
  banner.className = 'cc';
  banner.setAttribute('aria-label', 'Cookie choices');
  banner.innerHTML = `
    <h2>Cookies on this site</h2>
    <p>We use essential cookies to make this site work. With your permission, we would also like to use analytics cookies to learn which frames people look at, so we can improve the site. We never sell your data. Read our <a href="cookies.html">cookie policy</a> and <a href="privacy.html">privacy policy</a>.</p>
    <div class="cc-acts">
      <button type="button" class="cc-btn cc-solid" data-cc="accept">Accept all</button>
      <button type="button" class="cc-btn cc-solid" data-cc="reject">Reject non-essential</button>
    </div>
    <button type="button" class="cc-link" data-cc="customise">Choose cookies</button>`;

  const dlg = document.createElement('dialog');
  dlg.className = 'cc-dlg';
  dlg.setAttribute('aria-labelledby', 'cc-title');
  dlg.innerHTML = `
    <form method="dialog">
      <div class="cc-top"><h2 id="cc-title">Cookie settings</h2><button type="button" class="cc-x" data-cc="close" aria-label="Close">×</button></div>
      <p>Choose which cookies CAV may use. You can change this at any time from “Cookie settings” at the bottom of every page. More in our <a href="cookies.html">cookie policy</a>.</p>
      <div class="cc-cat"><b>Essential</b><span>Needed for the site to work and to remember your cookie choice. These cannot be switched off.</span><span class="cc-always">Always on</span></div>
      <label class="cc-cat"><b>Analytics</b><span>Counts visits and shows which pages and frames are viewed, so we can improve the site.</span><span class="cc-sw"><input type="checkbox" name="analytics" aria-label="Allow analytics cookies"><i></i></span></label>
      <label class="cc-cat"><b>Marketing</b><span>Lets us measure our adverts and show you relevant CAV adverts on other sites. Not used today.</span><span class="cc-sw"><input type="checkbox" name="marketing" aria-label="Allow marketing cookies"><i></i></span></label>
      <div class="cc-acts">
        <button type="button" class="cc-btn" data-cc="reject">Reject all</button>
        <button type="button" class="cc-btn" data-cc="save">Save my choices</button>
        <button type="button" class="cc-btn cc-red" data-cc="accept">Accept all</button>
      </div>
    </form>`;

  const toast = document.createElement('div');
  toast.className = 'cc-toast';
  toast.setAttribute('role', 'status');

  const showBanner = on => {
    banner.classList.toggle('is-open', on);
    document.body.classList.toggle('cc-up', on);
    banner.inert = !on;
  };
  const say = msg => { toast.textContent = msg; toast.classList.add('is-on'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('is-on'), 2600); };

  const decide = choice => {
    const prev = current;
    const c = { v: VERSION, ts: Date.now(), essential: true };
    CATS.forEach(k => { c[k] = choice === 'accept' ? true : choice === 'reject' ? false : dlg.querySelector(`[name=${k}]`).checked; });
    write(c);
    current = c;
    showBanner(false);
    if (dlg.open) dlg.close();
    // withdrawing consent: clear what was set and reload so already-running tags stop
    const withdrawn = prev && CATS.some(k => prev[k] && !c[k]);
    if (!c.analytics) dropAnalytics();
    apply(c);
    say(c.analytics || c.marketing ? 'Thanks. Your cookie choices are saved.' : 'Saved. Only essential cookies are used.');
    if (withdrawn && activated.size) setTimeout(() => location.reload(), 900);
  };

  const openSettings = () => {
    CATS.forEach(k => { dlg.querySelector(`[name=${k}]`).checked = !!(current && current[k]); });
    if (!dlg.open) dlg.showModal();
  };

  const init = () => {
    document.body.append(banner, dlg, toast);
    banner.addEventListener('click', e => {
      const a = e.target.closest('[data-cc]')?.dataset.cc;
      if (a === 'accept' || a === 'reject') decide(a);
      if (a === 'customise') openSettings();
    });
    dlg.addEventListener('click', e => {
      const a = e.target.closest('[data-cc]')?.dataset.cc;
      if (a === 'close') dlg.close();
      else if (a) decide(a);
      else if (e.target === dlg) dlg.close(); // click on the backdrop
    });
    document.addEventListener('click', e => { if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); openSettings(); } });
    if (current) { showBanner(false); apply(current); }
    else { banner.inert = true; setTimeout(() => showBanner(true), 700); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.CAVConsent = { get: () => (current ? { ...current } : null), open: openSettings };
})();
