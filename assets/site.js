(() => {
  'use strict';
  const root = document.documentElement;
  let language = 'en';
  try { language = localStorage.getItem('qmd-language') === 'zh' ? 'zh' : 'en'; } catch (_) {}
  const controls = {
    search: document.getElementById('paper-search'),
    year: document.getElementById('year-filter'),
    count: document.getElementById('publication-count'),
    empty: document.getElementById('empty-state'),
    pagination: document.getElementById('pub-pagination'),
    previous: document.getElementById('previous-page'),
    next: document.getElementById('next-page'),
    page: document.getElementById('page-description'),
    topic: document.getElementById('clear-topic')
  };
  const papers = [...document.querySelectorAll('#paper-list .paper')];
  const topics = {
    resources: ['Quantum resources', '量子资源'],
    algorithms: ['Algorithms & computing', '量子算法与计算'],
    chemistry: ['Chemistry & discovery', '量子化学与应用']
  };
  let mode = 'all', topic = null, currentPage = 1;
  const pageSize = 6;
  const isZh = () => language === 'zh';
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollToPapers = () => document.getElementById('publications').scrollIntoView({behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start'});

  function filterPapers() {
    const query = controls.search.value.trim().toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    const year = controls.year.value;
    const matches = papers.filter(p => {
      const status = p.dataset.status;
      const modeMatch = mode === 'preprint' ? status === 'preprint' : status === 'published' && (mode !== 'lead' || p.dataset.lead === 'true');
      return modeMatch && (!topic || p.dataset.topic === topic) && (year === 'all' || p.dataset.year === year) && words.every(w => p.dataset.search.includes(w));
    });
    const maxPage = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(currentPage, maxPage);
    const start = (currentPage - 1) * pageSize;
    const shown = new Set(matches.slice(start, start + pageSize));
    papers.forEach(p => { p.hidden = !shown.has(p); });
    controls.count.textContent = isZh() ? `共 ${matches.length} 篇${matches.length ? ` · 显示 ${start + 1}–${Math.min(start + pageSize, matches.length)}` : ''}` : `${matches.length} ${matches.length === 1 ? 'paper' : 'papers'}${matches.length ? ` · showing ${start + 1}–${Math.min(start + pageSize, matches.length)}` : ''}`;
    controls.empty.hidden = matches.length > 0;
    controls.pagination.hidden = matches.length <= pageSize;
    controls.previous.disabled = currentPage === 1;
    controls.next.disabled = currentPage === maxPage;
    controls.page.textContent = isZh() ? `${currentPage} / ${maxPage} 页` : `PAGE ${currentPage} / ${maxPage}`;
    controls.topic.hidden = !topic;
    if (topic) controls.topic.textContent = topics[topic][isZh() ? 1 : 0] + ' ×';
    document.querySelectorAll('.filter-tab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === mode)));
  }

  function setLanguage(value) {
    language = value;
    root.lang = isZh() ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.textContent = isZh() ? el.dataset.zh : el.dataset.en; });
    const langButton = document.getElementById('language-toggle');
    langButton.textContent = isZh() ? 'EN' : '中文';
    langButton.setAttribute('aria-label', isZh() ? 'Switch to English' : '切换到中文');
    controls.search.placeholder = isZh() ? '搜索题名、作者、研究主题…' : 'Search title, author, topic…';
    controls.search.setAttribute('aria-label', isZh() ? '按题名、作者或研究主题搜索论文' : 'Search papers by title, author, or topic');
    controls.year.setAttribute('aria-label', isZh() ? '按年份筛选' : 'Filter by year');
    try { localStorage.setItem('qmd-language', language); } catch (_) {}
    filterPapers();
  }

  document.getElementById('language-toggle').addEventListener('click', () => setLanguage(isZh() ? 'en' : 'zh'));
  document.querySelectorAll('.filter-tab').forEach(b => b.addEventListener('click', () => { mode = b.dataset.filter; currentPage = 1; filterPapers(); }));
  controls.search.addEventListener('input', () => { currentPage = 1; filterPapers(); });
  controls.year.addEventListener('change', () => { currentPage = 1; filterPapers(); });
  controls.previous.addEventListener('click', () => { if (currentPage > 1) { currentPage--; filterPapers(); scrollToPapers(); } });
  controls.next.addEventListener('click', () => { currentPage++; filterPapers(); scrollToPapers(); });
  controls.topic.addEventListener('click', () => { topic = null; currentPage = 1; filterPapers(); });
  document.querySelectorAll('.research-filter').forEach(b => b.addEventListener('click', () => {
    topic = b.dataset.topic; mode = 'all'; currentPage = 1; controls.search.value = ''; controls.year.value = 'all'; filterPapers(); scrollToPapers();
  }));

  const theta = document.getElementById('theta');
  const phi = document.getElementById('phi');
  const radius = document.getElementById('radius');
  const fixed = n => (Math.abs(n) < 0.0005 ? 0 : n).toFixed(3);
  function updateQubit() {
    const a = Number(theta.value) * Math.PI / 180;
    const b = Number(phi.value) * Math.PI / 180;
    const r = Number(radius.value) / 100;
    const x = r * Math.sin(a) * Math.cos(b), y = r * Math.sin(a) * Math.sin(b), z = r * Math.cos(a);
    // Orthographic camera: orthonormal rows keep every state inside the sphere.
    const azimuth = Math.PI / 6, elevation = 25 * Math.PI / 180, scale = 103;
    const ex = 160 + scale * (Math.cos(azimuth) * x - Math.sin(azimuth) * y);
    const ey = 136 + scale * Math.sin(elevation) * (Math.sin(azimuth) * x + Math.cos(azimuth) * y);
    const sx = ex, sy = ey - scale * Math.cos(elevation) * z;
    const line = document.getElementById('state-vector');
    line.setAttribute('x2', sx.toFixed(2)); line.setAttribute('y2', sy.toFixed(2));
    line.setAttribute('marker-end', r < .015 ? '' : 'url(#vector-arrow)');
    const dot = document.getElementById('state-point'); dot.setAttribute('cx', sx.toFixed(2)); dot.setAttribute('cy', sy.toFixed(2));
    document.getElementById('state-projection').setAttribute('d', `M160 136 L${ex.toFixed(2)} ${ey.toFixed(2)} L${sx.toFixed(2)} ${sy.toFixed(2)}`);
    document.getElementById('coherence-value').textContent = fixed(r * Math.sin(a));
    document.getElementById('theta-value').value = theta.value + '°';
    document.getElementById('phi-value').value = phi.value + '°';
    document.getElementById('radius-value').value = r.toFixed(2);
    document.getElementById('rho00').textContent = fixed((1 + z) / 2);
    document.getElementById('rho11').textContent = fixed((1 - z) / 2);
    const re = x / 2, im = y / 2;
    document.getElementById('rho01').textContent = `${fixed(re)} ${im >= 0 ? '−' : '+'} ${fixed(Math.abs(im))}i`;
    document.getElementById('rho10').textContent = `${fixed(re)} ${im >= 0 ? '+' : '−'} ${fixed(Math.abs(im))}i`;
  }
  [theta, phi, radius].forEach(el => el.addEventListener('input', updateQubit));
  document.querySelectorAll('[data-state]').forEach(b => b.addEventListener('click', () => {
    const states = {plus: [90, 0, 100], zero: [0, 0, 100], mixed: [90, 0, 0]};
    [theta.value, phi.value, radius.value] = states[b.dataset.state]; updateQubit();
  }));

  let toastTimer;
  function toast(message) {
    const el = document.getElementById('toast'); clearTimeout(toastTimer); el.textContent = message; el.hidden = false;
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }
  document.querySelectorAll('.copy-bib').forEach(button => button.addEventListener('click', async () => {
    const text = (window.QMD_BIBLIOGRAPHY || {})[button.dataset.key];
    if (!text) { toast(isZh() ? '请使用栏目顶部的BibTeX下载链接。' : 'Use the bibliography download link above.'); return; }
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select();
        const ok = document.execCommand('copy'); area.remove(); if (!ok) throw new Error('Clipboard unavailable');
      }
      toast(isZh() ? 'BibTeX已复制。' : 'BibTeX copied.');
    } catch (_) { toast(isZh() ? '浏览器未允许复制，可下载完整BibTeX。' : 'Copy was not permitted. Download the full bibliography instead.'); }
  }));

  function updateProgress() {
    const length = document.documentElement.scrollHeight - window.innerHeight;
    document.querySelector('.reading-progress').style.width = (length > 0 ? Math.min(100, window.scrollY / length * 100) : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, {passive: true});
  window.addEventListener('resize', updateProgress);
  setLanguage(language); updateQubit(); updateProgress();
})();
