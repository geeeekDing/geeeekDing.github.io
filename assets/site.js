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
    chemistry: ['Chemistry & molecular computing', '量子化学与分子计算']
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
    controls.search.placeholder = isZh() ? '搜索论文、作者或关键词…' : 'Search title, author, topic…';
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
  setLanguage(language); updateProgress();
})();
