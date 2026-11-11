/* ZOOMANIA — shared behaviour: navigation, reveal, animated cats, anchors */
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Header shadow on scroll */
  const header = document.querySelector('[data-header]');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile navigation */
  const toggle = document.querySelector('.nav-toggle');
  const list = document.getElementById('nav-list');
  if (toggle && list) {
    const label = toggle.querySelector('.nav-toggle-text');
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      list.classList.toggle('is-open', open);
      if (label) label.textContent = open ? toggle.dataset.closeLabel : toggle.dataset.openLabel;
    };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && list.classList.contains('is-open')) { set(false); toggle.focus(); } });
    document.addEventListener('click', (e) => { if (list.classList.contains('is-open') && !e.target.closest('.main-nav')) set(false); });
    list.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  }

  /* Reveal on scroll */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('is-visible'));

  /* Accessible anchor navigation: move focus to the target section */
  const focusHash = () => {
    if (!location.hash) return;
    let el; try { el = document.querySelector(decodeURIComponent(location.hash)); } catch { return; }
    if (!el) return;
    el.classList.add('is-visible');
    el.querySelectorAll('.reveal').forEach((r) => r.classList.add('is-visible'));
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };
  window.addEventListener('hashchange', focusHash);
  if (location.hash) window.addEventListener('load', focusHash);

  /* Active TOC link (Dubai page) */
  const tocLinks = [...document.querySelectorAll('.toc a')];
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const tio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { tocLinks.forEach((a) => a.classList.remove('is-active')); map.get(en.target.id)?.classList.add('is-active'); }
    }), { rootMargin: '-30% 0px -60% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) tio.observe(s); });
  }

  /* Animated cats: blinking, ear twitches, cursor-aware head and eyes */
  const cats = [...document.querySelectorAll('[data-cat] svg.cat')];
  window.ZoomaniaCats = { register: (svg) => { cats.push(svg); schedule(svg); } };

  function schedule(svg) {
    if (reduce.matches) return;
    const blink = () => {
      if (document.visibilityState === 'visible') {
        svg.classList.add('is-blinking');
        setTimeout(() => svg.classList.remove('is-blinking'), 340);
      }
      setTimeout(blink, 2600 + Math.random() * 4200);
    };
    const twitch = () => {
      const c = Math.random() > 0.5 ? 'twitch-l' : 'twitch-r';
      svg.classList.add(c);
      setTimeout(() => svg.classList.remove(c), 520);
      setTimeout(twitch, 4000 + Math.random() * 7000);
    };
    setTimeout(blink, 800 + Math.random() * 2500);
    setTimeout(twitch, 2000 + Math.random() * 5000);
  }
  cats.forEach(schedule);

  let raf = 0, mx = 0, my = 0;
  const track = () => {
    raf = 0;
    cats.forEach((svg) => {
      const r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.4;
      const dx = Math.max(-1, Math.min(1, (mx - cx) / (innerWidth / 2)));
      const dy = Math.max(-1, Math.min(1, (my - cy) / (innerHeight / 2)));
      svg.style.setProperty('--px', `${dx * 3.2}px`);
      svg.style.setProperty('--py', `${dy * 2.6}px`);
      svg.style.setProperty('--hr', `${dx * 5}deg`);
      svg.style.setProperty('--hx', `${dx * 2.5}px`);
      svg.style.setProperty('--hy', `${dy * 1.5}px`);
    });
  };
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      if (reduce.matches) return;
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(track);
    }, { passive: true });
  }

  /* Hover: hero cat perks up */
  document.querySelectorAll('.hero-cat').forEach((el) => {
    el.addEventListener('pointerenter', () => { if (!reduce.matches) el.style.transform = 'translateY(-8px) scale(1.03)'; });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- v2 motion layer (skipped entirely with reduced motion) ---------- */
  // Stagger: give each revealed child an index for a cascading delay
  document.querySelectorAll('.stagger').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--d', String(i % 6))));

  if (!reduce.matches && 'IntersectionObserver' in window) {
    // Section headings draw their kicker line when they appear
    const hio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); hio.unobserve(e.target); } }), { threshold: 0.3 });
    document.querySelectorAll('.section-head').forEach((h) => hio.observe(h));

    // Count-up for hero stats
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, to = Number(el.dataset.countTo), t0 = performance.now(), dur = 1200;
      const step = (now) => { const p = Math.min(1, (now - t0) / dur); el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
      el.textContent = '0'; requestAnimationFrame(step);
    }), { threshold: 0.6 });
    document.querySelectorAll('[data-count-to]').forEach((el) => cio.observe(el));
  } else document.querySelectorAll('.section-head').forEach((h) => h.classList.add('is-visible'));

  // Hero stage parallax + About timeline progress, on one rAF-throttled scroll handler
  const stage = document.querySelector('.hero-stage');
  const timeline = document.querySelector('[data-timeline]');
  let ticking = false;
  const onScrollFx = () => {
    ticking = false;
    if (stage) { const r = stage.getBoundingClientRect(); if (r.bottom > 0) stage.style.setProperty('--parallax', `${Math.max(-30, Math.min(30, -r.top * 0.06))}px`); }
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / r.height));
      timeline.style.setProperty('--progress', p.toFixed(3));
    }
  };
  if (!reduce.matches && (stage || timeline)) {
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScrollFx); } }, { passive: true });
    onScrollFx();
  } else if (timeline) timeline.style.setProperty('--progress', '1');

  // Soft 3D tilt on cards (mouse / trackpad only)
  if (!reduce.matches && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.card, .preview-card').forEach((el) => {
      el.classList.add('tilt');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
    });
  }

  // Small heart burst helper (used by the quiz result)
  window.ZoomaniaBurst = (x, y, n = 12) => {
    if (reduce.matches) return;
    for (let k = 0; k < n; k++) {
      const h = document.createElement('span');
      h.className = 'heart-burst'; h.textContent = k % 3 ? '♥' : '✦'; h.setAttribute('aria-hidden', 'true');
      const a = (Math.PI * 2 * k) / n, d = 70 + Math.random() * 70;
      h.style.left = `${x}px`; h.style.top = `${y}px`;
      h.style.setProperty('--bx', `${Math.cos(a) * d}px`); h.style.setProperty('--by', `${Math.sin(a) * d - 30}px`); h.style.setProperty('--br', `${(Math.random() - 0.5) * 60}deg`);
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1500);
    }
  };

  /* Current year */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
