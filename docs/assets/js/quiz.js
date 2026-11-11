/* ZOOMANIA — Cat Soulmate Quiz
   Deterministic weighted scoring:
   1) For each dimension, average the values from the answers that touch it (2 = neutral if none).
   2) Stretch around the neutral midpoint (× 1.5, clamped to 0–4) so leanings stand out.
   3) Distance to each breed = mean absolute difference over the six dimensions.
   4) Closest breed wins (ties keep breed-list order). Match % = round(100 − distance × 25). */
(() => {
  'use strict';
  const D = JSON.parse(document.getElementById('quiz-data').textContent);
  const S = D.s, N = D.questions.length, STRETCH = 1.5;
  const $ = (s) => document.querySelector(s);
  const intro = $('[data-quiz-intro]'), panel = $('[data-quiz-panel]'), result = $('[data-quiz-result]');
  const form = $('[data-quiz-form]'), qText = $('[data-question-text]'), answersEl = $('[data-answers]');
  const prevBtn = $('[data-prev]'), nextBtn = $('[data-next]');
  const progress = $('[data-progress]'), progressLabel = $('[data-progress-label]');
  const status = $('[data-status]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const answers = new Array(N).fill(null);
  let i = 0, last = null;
  const letters = D.lang === 'ar' ? ['أ', 'ب', 'ج', 'د'] : ['A', 'B', 'C', 'D'];
  const fmt = (n) => String(n); // Western digits, as commonly used in the UAE

  function show(el) { [intro, panel, result].forEach((x) => { x.hidden = x !== el; }); }

  function renderQuestion(focus = true) {
    const q = D.questions[i];
    qText.textContent = q.q;
    answersEl.innerHTML = q.a.map((a, j) => `
      <label class="answer${answers[i] === j ? ' is-checked' : ''}">
        <input type="radio" name="q${i}" value="${j}"${answers[i] === j ? ' checked' : ''}>
        <span class="letter" aria-hidden="true">${letters[j]}</span>
        <span class="answer-text">${a.t}</span>
        <span class="check" aria-hidden="true">✓</span>
      </label>`).join('');
    const label = `${S.question} ${fmt(i + 1)} ${S.of} ${fmt(N)}`;
    progressLabel.textContent = label;
    progress.setAttribute('aria-valuenow', String(i + 1));
    progress.setAttribute('aria-valuetext', label);
    progress.firstElementChild.style.width = `${((i + 1) / N) * 100}%`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = answers[i] === null;
    nextBtn.textContent = i === N - 1 ? S.finish : S.next;
    const fs = $('[data-question]');
    fs.classList.remove('q-anim'); void fs.offsetWidth; if (!reduce.matches) fs.classList.add('q-anim');
    if (focus) qText.focus({ preventScroll: true });
    nudgeCompanion();
  }

  answersEl.addEventListener('change', (e) => {
    if (e.target.name !== `q${i}`) return;
    answers[i] = Number(e.target.value);
    answersEl.querySelectorAll('.answer').forEach((l) => { const on = l.contains(e.target); l.classList.toggle('is-checked', on); l.classList.remove('pop'); if (on && !reduce.matches) { void l.offsetWidth; l.classList.add('pop'); } });
    nextBtn.disabled = false;
  });
  // Double-click / double-tap shortcut on an answer card advances.
  answersEl.addEventListener('dblclick', () => { if (answers[i] !== null) form.requestSubmit(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (answers[i] === null) return;
    if (i < N - 1) { i++; renderQuestion(); } else finish();
  });
  prevBtn.addEventListener('click', () => { if (i > 0) { i--; renderQuestion(); } });

  $('[data-quiz-start]').addEventListener('click', () => { i = 0; show(panel); renderQuestion(); panel.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' }); });
  $('[data-restart]').addEventListener('click', () => { answers.fill(null); i = 0; status.textContent = ''; show(panel); renderQuestion(); panel.scrollIntoView({ block: 'start' }); });

  function nudgeCompanion() {
    const svg = document.querySelector('[data-companion] svg');
    if (!svg || reduce.matches) return;
    svg.classList.add('is-blinking', i % 2 ? 'twitch-l' : 'twitch-r');
    setTimeout(() => svg.classList.remove('is-blinking', 'twitch-l', 'twitch-r'), 520);
  }

  /* ---------- Scoring ---------- */
  function score() {
    const sum = {}, cnt = {};
    answers.forEach((a, qi) => {
      const v = D.questions[qi].a[a].v;
      for (const k in v) { sum[k] = (sum[k] || 0) + v[k]; cnt[k] = (cnt[k] || 0) + 1; }
    });
    const user = {};
    D.dims.forEach((d) => {
      const avg = cnt[d] ? sum[d] / cnt[d] : 2;
      user[d] = Math.max(0, Math.min(4, 2 + (avg - 2) * STRETCH));
    });
    const ranked = D.breeds.map((b, order) => {
      const diffs = D.dims.map((d) => Math.abs(user[d] - b.profile[d]));
      const dist = diffs.reduce((x, y) => x + y, 0) / D.dims.length;
      return { b, order, dist, pct: Math.round(100 - dist * 25), diffs };
    }).sort((x, y) => (x.dist - y.dist) || (x.order - y.order));
    return { user, ranked };
  }

  function finish() {
    const { user, ranked } = score();
    const top = ranked[0];
    last = { user, top };
    const b = top.b;
    $('[data-result-name]').textContent = b.name;
    $('[data-result-pct]').textContent = `${fmt(top.pct)}%`;
    $('[data-result-personality]').textContent = b.personality;
    $('[data-result-explore]').href = `breeds.html#breed-${b.slug}`;
    $('[data-result-breed-col]').textContent = b.name;
    const media = $('[data-result-media]');
    media.innerHTML = '';
    media.appendChild(document.getElementById(`portrait-${b.slug}`).content.cloneNode(true));
    const svg = media.querySelector('svg.cat');
    if (svg && window.ZoomaniaCats) window.ZoomaniaCats.register(svg);

    // Closest three dimensions = shared traits
    const close = D.dims.map((d, k) => ({ d, diff: top.diffs[k] })).sort((x, y) => x.diff - y.diff).slice(0, 3).map((x) => x.d);
    $('[data-result-traits]').innerHTML = close.map((d) => `<li>${D.dimLabels[d]}</li>`).join('');
    $('[data-result-runners]').textContent = ranked.slice(1, 3).map((r) => `${r.b.name} (${fmt(r.pct)}%)`).join(D.lang === 'ar' ? '، ' : ', ');
    $('[data-result-table]').innerHTML = D.dims.map((d) => `<tr class="${close.includes(d) ? 'close' : ''}"><th scope="row">${D.dimLabels[d]}</th><td>${fmt(+user[d].toFixed(1))}</td><td>${fmt(b.profile[d])}</td></tr>`).join('');

    $('[data-share]').hidden = !navigator.share;
    show(result);
    result.focus({ preventScroll: true });
    result.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
    setTimeout(() => { const r = media.getBoundingClientRect(); if (window.ZoomaniaBurst && r.width) window.ZoomaniaBurst(r.left + r.width / 2, r.top + r.height / 2, 14); }, 650);
  }

  /* ---------- Share / copy / download ---------- */
  const shareText = () => S.shareTpl.replace('{b}', last.top.b.name).replace('{p}', fmt(last.top.pct));
  const pageUrl = () => location.href.split('#')[0];

  $('[data-share]').addEventListener('click', async () => {
    try { await navigator.share({ title: 'ZOOMANIA', text: shareText(), url: pageUrl() }); } catch { /* cancelled */ }
  });
  $('[data-copy]').addEventListener('click', async () => {
    const text = `${shareText()} ${pageUrl()}`;
    try { await navigator.clipboard.writeText(text); status.textContent = S.shared; }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); status.textContent = S.shared; } catch { status.textContent = text; }
      ta.remove();
    }
  });

  $('[data-download]').addEventListener('click', async () => {
    try {
      const blob = await drawCard();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `zoomania-cat-soulmate-${last.top.b.slug}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      status.textContent = S.downloaded;
    } catch (err) { status.textContent = S.downloadFail; }
  });

  function loadImg(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }

  async function drawCard() {
    const W = 1080, H = 1350, rtl = D.lang === 'ar';
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#FFF4DE'); g.addColorStop(.5, '#FFE8C4'); g.addColorStop(1, '#FFCED8');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#FFDDDD'; x.beginPath(); x.arc(W / 2, 520, 330, 0, Math.PI * 2); x.fill();
    // Portrait: photo if present, otherwise the SVG illustration
    const media = $('[data-result-media]');
    const img = media.querySelector('img');
    let pic;
    if (img) pic = await loadImg(img.src);
    else {
      const svg = media.querySelector('svg').cloneNode(true);
      svg.setAttribute('width', '600'); svg.setAttribute('height', '720');
      svg.querySelectorAll('.cat-lid').forEach((l) => l.setAttribute('transform', 'scale(1 0)'));
      const s = new XMLSerializer().serializeToString(svg);
      pic = await loadImg(URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })));
    }
    if (img) { x.save(); x.beginPath(); x.arc(W / 2, 520, 320, 0, Math.PI * 2); x.clip(); x.drawImage(pic, W / 2 - 320, 200, 640, 640); x.restore(); }
    else x.drawImage(pic, W / 2 - 250, 210, 500, 600);
    await document.fonts?.ready;
    const ff = rtl ? 'Tajawal, sans-serif' : '"Plus Jakarta Sans", sans-serif';
    x.textAlign = 'center'; x.direction = rtl ? 'rtl' : 'ltr'; x.fillStyle = '#30292D';
    x.font = `800 64px "Plus Jakarta Sans", sans-serif`; x.fillText('zoomania', W / 2, 120);
    x.fillStyle = '#8A3550'; x.font = `700 40px ${ff}`; x.fillText(S.cardTitle, W / 2, 940);
    x.fillStyle = '#30292D'; x.font = `800 96px ${ff}`; x.fillText(last.top.b.name, W / 2, 1050);
    x.font = `700 44px ${ff}`; x.fillText(`${fmt(last.top.pct)}% · ${S.match}`, W / 2, 1130);
    x.font = `500 30px ${ff}`; x.fillStyle = '#4E4449'; x.fillText(location.host || 'zoomania', W / 2, 1270);
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png'));
  }
})();
