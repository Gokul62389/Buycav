/* CAV site script · shared by every page. Page scripts run after it and can use its helpers. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
const mqMobile = matchMedia('(max-width: 900px)');
const reduced = () => mqReduce.matches;

/* ---- products (names, colours and links from buycav.in) ---- */
const P = {
  '279A': ['CT 5431', 'Brown violet', '#7a5470', 'ct-5431-brown-violet-gr', 'female'],
  '278A': ['CT 5431', 'Blue', '#23407e', 'ct-5431-blue', 'female'],
  '277A': ['CT 5431', 'Peach black', '#e3a98d', 'ct-5431-peach-black', 'female'],
  '276A': ['CT 5431', 'Violet black', '#4b3f78', 'ct-5431-violet-black', 'female'],
  '275A': ['CT 5431', 'Blue black', '#1f2e4f', 'ct-5431-blue-black', 'female'],
  '32A':  ['CL 2015', 'Green brown', '#4c5a3a', 'cl-2015-green-brown', 'kids'],
  '64A':  ['CC 606', 'Red black', '#8e2a2a', 'cc-606-red-black', 'female'],
  '96A':  ['CC 056', 'Brown', '#5a3a22', 'cc-056-brown', 'unisex'],
  '128A': ['CC 059', 'Brown', '#5a3a22', 'cc-059-brown', 'unisex'],
  '160A': ['CE 003', 'Wellow wine', '#7d2233', 'ce-003-wellow-wine', 'kids'],
  '192A': ['CS27G', 'Gun metal', '#55595a', 'cs27g-gun-metal', 'male'],
};
const SHOP_AT = 'locate.html';
const url = id => `product.html?p=${P[id][3]}`;
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// colour name from the catalogue ("Black Blue", "Clear Pink", "Wine Red") -> CSS swatch; two colours split in half
const HUE = { black: '#141414', balck: '#141414', blue: '#2456b3', indigo: '#3b3f8f', brown: '#6b4426', copper: '#b06a3b', clear: 'linear-gradient(135deg,#fff 45%,#cfd6da)',
  green: '#2f7d46', grn: '#2f7d46', violet: '#6b3fa0', purple: '#7a2f8e', wine: '#7d2233', red: '#c4161c', pink: '#e58fb0', peach: '#f2b38f', gray: '#7b7f82',
  gun: '#55595a', gold: '#c9a050', sliver: '#c4c7c9', silver: '#c4c7c9', white: '#f5f5f5', wellow: '#e2c043', yellow: '#e2c043', mjentha: '#c2307a', camouflage: '#5b5f3a',
  assorted: 'conic-gradient(#c4161c,#e2c043,#2f7d46,#2456b3,#7a2f8e,#c4161c)' };
const swatch = name => {
  const cs = (name || '').toLowerCase().split(/\s+/).map(w => HUE[w]).filter(Boolean);
  if (!cs.length) return '#9a9a9a';
  if (cs.length === 1 || cs[0].includes('gradient')) return cs[0];
  const [a, b] = cs.map(c => c.includes('gradient') ? '#eef1f2' : c);
  return `linear-gradient(135deg,${a} 50%,${b} 50%)`;
};
const card = (id, btn, feat) => {
  const [code, colour, c] = P[id];
  return `<article class="card">
    <a class="ph" href="${url(id)}" tabindex="-1" aria-hidden="true"><img src="img/p/${id}.jpg" alt="" loading="lazy" width="640" height="640"></a>
    <div class="row"><div><h3><a href="${url(id)}">${code}</a></h3><p class="sw"><i style="--c:${swatch(colour)}"></i>${colour}</p></div>
    <a class="btn ${feat ? 'btn-red' : btn} btn-sm" href="${SHOP_AT}" aria-label="Shop At: find ${code} ${colour} at a CAV shop">Shop At</a></div>
  </article>`;
};

/* ---- search with suggestions (both desktop and phone copies) ---- */
const tpl = $('#search-tpl');
const GENDER = { male: 'Male', female: 'Female', unisex: 'Unisex', kids: 'Kids' };
[$('#search-desk'), $('#search-mob')].forEach((host, n) => {
  host.append(tpl.content.cloneNode(true));
  const input = $('input[type=search]', host), sel = $('select', host), box = $('.suggest', host), form = $('form', host);
  const ids = ['q' + n, 'c' + n, 'sg' + n];
  input.id = ids[0]; sel.id = ids[1]; box.id = ids[2];
  $$('label', host)[0].htmlFor = ids[0]; $$('label', host)[1].htmlFor = ids[1];
  input.setAttribute('aria-controls', ids[2]);
  let items = [], active = -1;
  const open = on => { box.classList.toggle('is-open', on); input.setAttribute('aria-expanded', on); if (!on) { active = -1; input.removeAttribute('aria-activedescendant'); } };
  const hi = (s, q) => q ? esc(s).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>') : esc(s);
  const update = () => {
    const q = input.value.trim().toLowerCase(), cat = sel.value;
    if (!q && !cat) return open(false);
    const norm = s => s.toLowerCase().replace(/\s+/g, '');
    items = CATALOG.filter(it => {
      if (cat && it.g !== GENDER[cat]) return false;
      return !q || norm(it.n).includes(norm(q)) || it.n.toLowerCase().includes(q);
    }).slice(0, 6);
    const qq = input.value.trim();
    box.innerHTML = items.length
      ? items.map((it, i) => `<li role="option" id="${ids[2]}-${i}" aria-selected="false" data-s="${it.s}"><span class="th"><img src="img/c/${it.s}-0.jpg" alt=""></span><span><b>${hi(it.m, qq)}</b><small>${hi(it.c, qq)} · ${it.g}</small></span></li>`).join('')
        + (qq ? `<li class="all" role="option" id="${ids[2]}-all" aria-selected="false">See all results for “${esc(qq)}” <span class="arrow">→</span></li>` : '')
      : `<li class="empty" role="presentation">No frames match “${esc(qq)}”${cat ? ' for ' + GENDER[cat].toLowerCase() : ''}. Try a model code such as CT 5431.</li>`;
    active = -1;
    open(true);
  };
  const opts = () => $$('[role=option]', box);
  const move = d => {
    const o = opts(); if (!o.length) return;
    active = (active + d + o.length) % o.length;
    o.forEach((el, i) => el.setAttribute('aria-selected', i === active));
    input.setAttribute('aria-activedescendant', o[active].id);
    o[active].scrollIntoView({ block: 'nearest' });
  };
  const choose = el => {
    if (!el) return;
    if (el.dataset.s) location.href = `product.html?p=${el.dataset.s}`;
    else form.submit();
  };
  input.addEventListener('input', update);
  input.addEventListener('focus', () => { if (input.value.trim() || sel.value) update(); });
  sel.addEventListener('change', () => { update(); input.focus(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!box.classList.contains('is-open')) update(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && active > -1) { e.preventDefault(); choose(opts()[active]); }
    else if (e.key === 'Escape') { if (box.classList.contains('is-open')) { e.preventDefault(); open(false); } else if (n === 1) toggleSearch(false, true); }
  });
  box.addEventListener('mousedown', e => e.preventDefault()); // keep focus in the input
  box.addEventListener('click', e => choose(e.target.closest('[role=option]')));
  form.addEventListener('submit', e => { if (!input.value.trim()) { e.preventDefault(); input.focus(); } });
  document.addEventListener('pointerdown', e => { if (!host.contains(e.target)) open(false); });
});
const sToggle = $('#search-toggle'), sMob = $('#search-mob');
function toggleSearch(on, refocus) {
  sMob.classList.toggle('is-open', on);
  sToggle.setAttribute('aria-expanded', on);
  if (on) setTimeout(() => $('input[type=search]', sMob).focus(), 60);
  else if (refocus) sToggle.focus();
}
sToggle.addEventListener('click', () => toggleSearch(!sMob.classList.contains('is-open')));

/* ---- nav underline follows hover ---- */
{
  const ul = $('#navlist'), ink = $('.ink', ul), cur = $('a[aria-current]', ul);
  // pages outside the menu (e.g. Shop At) have no current link: the underline only follows hover
  const to = a => { ink.style.opacity = a ? 1 : 0; if (!a) return; ink.style.setProperty('--x', a.offsetLeft + 'px'); ink.style.setProperty('--w', a.offsetWidth + 'px'); };
  $$('a', ul).forEach(a => { a.addEventListener('mouseenter', () => to(a)); a.addEventListener('focus', () => to(a)); });
  ul.addEventListener('mouseleave', () => to(cur));
  ul.addEventListener('focusout', e => { if (!ul.contains(e.relatedTarget)) to(cur); });
  to(cur); document.fonts && document.fonts.ready.then(() => to(cur));
}

/* ---- drawer menu ---- */
{
  const d = $('#drawer'), openBtn = $('#menu-open');
  const focusables = () => $$('a,button', d);
  const set = on => {
    d.classList.toggle('is-open', on);
    openBtn.setAttribute('aria-expanded', on);
    document.body.classList.toggle('lock', on);
    if (on) setTimeout(() => focusables()[0].focus(), 50); else openBtn.focus();
  };
  openBtn.addEventListener('click', () => set(true));
  d.addEventListener('click', e => { if (e.target.closest('[data-close]')) set(false); });
  d.addEventListener('keydown', e => {
    if (e.key === 'Escape') return set(false);
    if (e.key !== 'Tab') return;
    const f = focusables(), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  mqMobile.addEventListener('change', e => { if (!e.matches && d.classList.contains('is-open')) set(false); });
}

/* ---- page title bands: size the giant word to ~86% of the band (max 330px) ---- */
const fitTitles = () => $$('.pt .word').forEach(w => {
  w.style.setProperty('--fs', '100px');
  const fs = Math.min(330, 100 * w.parentElement.clientWidth * .86 / w.scrollWidth);
  w.style.setProperty('--fs', Math.round(fs) + 'px');
});
fitTitles(); addEventListener('resize', fitTitles); document.fonts && document.fonts.ready.then(fitTitles);

/* ---- reveal on scroll (pages call revealWatch() for content they add later) ---- */
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
const revealWatch = (root = document) => $$('.rv, .panel-img, .ab-photo', root).forEach(el => revealIO.observe(el));
revealWatch();
// at the very bottom of the page nothing can scroll further into view: reveal whatever is left
addEventListener('scroll', () => {
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) $$('.rv, .panel-img, .ab-photo').forEach(el => el.classList.add('in'));
}, { passive: true });

/* ---- scroll: smart sticky header, hero parallax, WhatsApp pill ---- */
{
  const mast = $('#masthead'), wa = $('#wa'), hero = $('#hero');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY, dy = y - lastY;
    const past = hero ? y > hero.offsetTop + hero.offsetHeight * .6 : y > 300;
    const busy = document.activeElement && mast.contains(document.activeElement) || $('.suggest.is-open');
    if (Math.abs(dy) > 4) {
      mast.classList.toggle('is-hidden', dy > 0 && past && !busy);
      wa.classList.toggle('is-min', dy > 0 && y > 200);
      lastY = y;
    }
    if (y < 200) wa.classList.remove('is-min');
    if (hero && !reduced() && y < hero.offsetTop + hero.offsetHeight) {
      const off = Math.max(0, y - hero.offsetTop) * .22;
      $$('.slide .media', hero).forEach(m => m.style.transform = `translate3d(0,${off}px,0)`);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  mast.addEventListener('focusin', () => mast.classList.remove('is-hidden'));
}

/* ---- a photo whose request drops (flaky network) is retried twice before giving up ---- */
document.addEventListener('error', e => {
  const im = e.target;
  if (im.tagName !== 'IMG') return;
  const n = +(im.dataset.retry || 0);
  if (n >= 2) return;
  im.dataset.retry = n + 1;
  setTimeout(() => { const u = new URL(im.src); u.searchParams.set('r', n + 1); im.src = u.href; }, 400 * (n + 1));
}, true);
