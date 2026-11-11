/* ZOOMANIA — breed filtering and two-breed comparison */
(() => {
  'use strict';
  const form = document.querySelector('[data-filters]');
  const cards = [...document.querySelectorAll('.breed-card')];
  const count = document.querySelector('[data-count]');

  const apply = () => {
    const f = new FormData(form);
    let shown = 0;
    cards.forEach((c) => {
      const ok = ['coat', 'activity', 'size'].every((k) => { const v = f.get(k); return !v || v === 'all' || c.dataset[k] === v; });
      c.hidden = !ok;
      if (ok) { shown++; c.classList.add('is-visible'); }
    });
    if (count) count.textContent = String(shown);
  };
  if (form) {
    form.addEventListener('change', apply);
    form.addEventListener('reset', () => setTimeout(apply, 0));
    form.addEventListener('submit', (e) => e.preventDefault());
  }

  /* Compare */
  const dataEl = document.getElementById('compare-data');
  if (!dataEl) return;
  const data = JSON.parse(dataEl.textContent);
  const selA = document.querySelector('[data-compare-a]');
  const selB = document.querySelector('[data-compare-b]');
  const rows = ['temperament', 'coat', 'grooming', 'activity', 'size', 'health'];
  const meter = (v) => `<span class="meter" aria-hidden="true"><span style="--v:${v / 4}"></span></span> <span class="num">${v}</span>`;

  const render = (side, slug) => {
    const d = data[slug];
    if (!d) return;
    const th = document.querySelector(`[data-col="${side}"]`);
    th.textContent = d.name;
    rows.forEach((k) => { const td = document.querySelector(`[data-${side}="${k}"]`); td.textContent = d[k]; td.classList.remove('flash'); void td.offsetWidth; td.classList.add('flash'); });
    Object.keys(d.profile).forEach((k) => { const td = document.querySelector(`[data-${side}-dim="${k}"]`); if (td) td.innerHTML = meter(d.profile[k]); });
  };
  selA.addEventListener('change', () => render('a', selA.value));
  selB.addEventListener('change', () => render('b', selB.value));

  /* "Compare" buttons on cards: fill the next slot, then scroll to the table */
  let next = 'b';
  document.querySelectorAll('[data-compare-add]').forEach((btn) => btn.addEventListener('click', () => {
    const slug = btn.dataset.compareAdd;
    const sel = next === 'a' ? selA : selB;
    const other = next === 'a' ? selB : selA;
    if (other.value === slug) { next = next === 'a' ? 'b' : 'a'; }
    else { sel.value = slug; render(next, slug); next = next === 'a' ? 'b' : 'a'; }
    const target = document.getElementById('compare-title');
    target.setAttribute('tabindex', '-1');
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  }));
})();
