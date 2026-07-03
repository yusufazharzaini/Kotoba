/* ============================================================ */
/*  js/app.js  -  Logika Utama (Async dengan lazy loading)      */
/* ============================================================ */

(function() {
  'use strict';

  // ================================================================
  //  KONSTANTA
  // ================================================================
  const ITEMS_PER_PAGE = 20;
  const DEFAULT_LEVEL = 'N5'; // Level default yang dimuat pertama kali

  // ================================================================
  //  STATE
  // ================================================================
  let vocabData = [];
  let currentFilterLevel = DEFAULT_LEVEL; // default N5
  let currentFilterType = 'all';
  let currentFilterTheme = 'all';
  let currentSearch = '';
  let currentPage = 1;
  let knownWords = JSON.parse(localStorage.getItem('knownWords') || '[]');
  let currentQuizWord = null;
  let isLoading = false;

  // ================================================================
  //  DOM REFS
  // ================================================================
  const cardGrid = document.getElementById('cardGrid');
  const paginationEl = document.getElementById('pagination');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const statTotal = document.getElementById('statTotal');
  const statKnown = document.getElementById('statKnown');
  const statLevels = document.getElementById('statLevels');
  const statThemes = document.getElementById('statThemes');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const quizWord = document.getElementById('quizWord');
  const quizFeedback = document.getElementById('quizFeedback');
  const quizOptions = document.getElementById('quizOptions');
  const nextQuizBtn = document.getElementById('nextQuizBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');

  // ================================================================
  //  HELPERS - FILTER & DATA
  // ================================================================
  function getFilteredData() {
    let result = [...vocabData];

    if (currentFilterLevel !== 'all') {
      result = result.filter(v => v.level === currentFilterLevel);
    }
    if (currentFilterType !== 'all') {
      result = result.filter(v => v.type === currentFilterType);
    }
    if (currentFilterTheme !== 'all') {
      result = result.filter(v => v.theme === currentFilterTheme);
    }

    const q = currentSearch.trim().toLowerCase();
    if (q !== '') {
      result = result.filter(v =>
        v.kanji.includes(q) ||
        v.hiragana.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q) ||
        v.example.toLowerCase().includes(q)
      );
    }

    return result;
  }

  // ================================================================
  //  RENDER - CARDS & PAGINATION
  // ================================================================
  function render() {
    const filtered = getFilteredData();
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filtered.slice(start, end);

    // --- Render cards ---
    cardGrid.innerHTML = '';

    if (pageItems.length === 0) {
      cardGrid.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <h3>Tidak ada kosakata ditemukan</h3>
          <p>Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      `;
    } else {
      pageItems.forEach(word => {
        const kanji = word.kanji || '---';
        const hiragana = word.hiragana || '---';
        const meaning = word.meaning || '---';
        const example = word.example || '---';
        const level = word.level || '---';
        const type = word.type || '---';
        const theme = word.theme || '---';
        const isKnown = knownWords.includes(kanji);

        const card = document.createElement('div');
        card.className = 'flip-card';
        card.dataset.kanji = kanji;
        card.innerHTML = `
          <div class="flip-inner">
            <div class="flip-front">
              <span class="level-tag">${level}</span>
              <span class="type-tag">${type}</span>
              <span class="theme-tag">${theme}</span>
              <div class="kanji jp">${kanji}</div>
              <div class="hint">Klik untuk melihat arti</div>
            </div>
            <div class="flip-back">
              <div class="reading jp">${hiragana}</div>
              <div class="meaning">${meaning}</div>
              <div class="example jp">${example}</div>
              <button class="know-btn ${isKnown ? 'known' : ''}" data-kanji="${kanji}">
                ${isKnown ? '✓ Dikuasai' : 'Tandai dikuasai'}
              </button>
            </div>
          </div>
        `;

        card.addEventListener('click', (e) => {
          if (e.target.closest('.know-btn')) return;
          card.classList.toggle('flipped');
        });

        cardGrid.appendChild(card);
      });
    }

    // --- Know buttons ---
    document.querySelectorAll('.know-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const kanji = btn.dataset.kanji;
        if (knownWords.includes(kanji)) {
          knownWords = knownWords.filter(k => k !== kanji);
        } else {
          knownWords.push(kanji);
        }
        localStorage.setItem('knownWords', JSON.stringify(knownWords));
        render();
        updateStats();
      });
    });

    renderPagination(totalPages, totalItems);
    updateStats();
  }

  // ================================================================
  //  PAGINATION UI
  // ================================================================
  function renderPagination(totalPages, totalItems) {
    paginationEl.innerHTML = '';

    if (totalPages <= 1) {
      paginationEl.innerHTML = `<span class="page-info">${totalItems} kosakata</span>`;
      return;
    }

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; render(); }
    });
    paginationEl.appendChild(prevBtn);

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      const first = document.createElement('button');
      first.textContent = '1';
      first.addEventListener('click', () => { currentPage = 1; render(); });
      paginationEl.appendChild(first);
      if (startPage > 2) {
        const dot = document.createElement('span');
        dot.textContent = '…';
        dot.style.color = 'var(--text-dim)';
        dot.style.padding = '0 4px';
        paginationEl.appendChild(dot);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.className = 'active';
      btn.addEventListener('click', () => { currentPage = i; render(); });
      paginationEl.appendChild(btn);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dot = document.createElement('span');
        dot.textContent = '…';
        dot.style.color = 'var(--text-dim)';
        dot.style.padding = '0 4px';
        paginationEl.appendChild(dot);
      }
      const last = document.createElement('button');
      last.textContent = totalPages;
      last.addEventListener('click', () => { currentPage = totalPages; render(); });
      paginationEl.appendChild(last);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) { currentPage++; render(); }
    });
    paginationEl.appendChild(nextBtn);

    const info = document.createElement('span');
    info.className = 'page-info';
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    info.textContent = `${startItem}–${endItem} dari ${totalItems}`;
    paginationEl.appendChild(info);
  }

  // ================================================================
  //  STATS & PROGRESS
  // ================================================================
  function updateStats() {
    const total = vocabData.length;
    const known = knownWords.filter(k => vocabData.some(v => v.kanji === k)).length;
    const pct = total > 0 ? Math.round((known / total) * 100) : 0;

    statTotal.textContent = total;
    statKnown.textContent = known;
    statLevels.textContent = window.getUniqueLevels().length;
    statThemes.textContent = window.getUniqueThemes().length;

    progressFill.style.width = pct + '%';
    progressText.textContent = `${known} dari ${total} kata dikuasai (dari level yang dimuat)`;
  }

  // ================================================================
  //  LOAD DATA & RE-RENDER (Asycn)
  // ================================================================
  async function loadAndRender(level) {
    if (isLoading) return;
    isLoading = true;
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
      if (level === 'all') {
        await window.loadAllData();
      } else {
        await window.loadLevelData(level);
      }
      // Ambil data terbaru dari global
      vocabData = window.getVocabData();
      render();
      loadQuiz();
    } catch (error) {
      console.error('Gagal memuat data:', error);
      if (loadingIndicator) {
        loadingIndicator.innerHTML = `
          <div style="text-align:center; padding:20px; color:var(--accent);">
            <h3>⚠️ Gagal memuat ${level}</h3>
            <p style="color:var(--text-dim);">${error.message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Muat Ulang</button>
          </div>
        `;
      }
    } finally {
      isLoading = false;
      if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
  }

  // ================================================================
  //  FILTER HANDLERS (dengan lazy loading)
  // ================================================================
  function setupFilters() {
    // --- Level ---
    document.querySelectorAll('[data-level]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const level = btn.dataset.level;

        // Jika data belum dimuat, muat dulu
        if (level !== 'all' && !window.isLevelLoaded(level)) {
          await loadAndRender(level);
        } else if (level === 'all') {
          // Cek apakah semua level sudah dimuat
          const allLevels = ['N5', 'N4', 'N3', 'N2', 'N1', 'Tambahan'];
          const allLoaded = allLevels.every(l => window.isLevelLoaded(l));
          if (!allLoaded) {
            await loadAndRender('all');
          }
        }

        // Update UI filter
        document.querySelectorAll('[data-level]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update state & render
        currentFilterLevel = level;
        currentPage = 1;
        render();
        loadQuiz(); // refresh kuis dengan data baru
      });
    });

    // --- Type ---
    document.querySelectorAll('[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilterType = btn.dataset.type;
        currentPage = 1;
        render();
      });
    });

    // --- Theme ---
    document.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilterTheme = btn.dataset.theme;
        currentPage = 1;
        render();
      });
    });

    // --- Search ---
    function doSearch() {
      currentSearch = searchInput.value;
      currentPage = 1;
      render();
    }
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
    searchInput.addEventListener('input', () => {
      if (searchInput.value === '') {
        currentSearch = '';
        currentPage = 1;
        render();
      }
    });
  }

  // ================================================================
  //  QUIZ
  // ================================================================
  function loadQuiz() {
    quizFeedback.textContent = '\u00A0';

    const pool = getFilteredData();
    if (pool.length === 0) {
      quizWord.textContent = '—';
      quizOptions.innerHTML = '<p style="color:var(--text-dim)">Tidak ada kosakata untuk kuis.</p>';
      return;
    }

    currentQuizWord = pool[Math.floor(Math.random() * pool.length)];
    quizWord.textContent = currentQuizWord.kanji;

    const allMeanings = vocabData.map(v => v.meaning);
    let options = [currentQuizWord.meaning];
    while (options.length < 4) {
      const rand = allMeanings[Math.floor(Math.random() * allMeanings.length)];
      if (!options.includes(rand)) options.push(rand);
    }
    options.sort(() => Math.random() - 0.5);

    quizOptions.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.onclick = () => {
        document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
        if (opt === currentQuizWord.meaning) {
          btn.classList.add('correct');
          quizFeedback.textContent = '✅ Benar! Kerja bagus.';
        } else {
          btn.classList.add('wrong');
          quizFeedback.textContent = `❌ Kurang tepat. Jawaban benar: ${currentQuizWord.meaning}`;
          document.querySelectorAll('.quiz-option').forEach(b => {
            if (b.textContent === currentQuizWord.meaning) b.classList.add('correct');
          });
        }
      };
      quizOptions.appendChild(btn);
    });
  }

  // ================================================================
  //  NAV HAMBURGER
  // ================================================================
  function setupNav() {
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('navLinks').classList.toggle('open');
    });
  }

  // ================================================================
  //  HERO PARALLAX
  // ================================================================
  function setupHeroParallax() {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return;
    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      document.querySelectorAll('.float-card').forEach((card) => {
        card.style.transform = `rotateY(${x * 15}deg) rotateX(${-y * 15}deg)`;
      });
    });
  }

  // ================================================================
  //  STORAGE SYNC
  // ================================================================
  function setupStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'knownWords') {
        knownWords = JSON.parse(e.newValue || '[]');
        render();
        updateStats();
      }
    });
  }

  // ================================================================
  //  DYNAMIC FILTER GENERATION (Theme)
  // ================================================================
  function generateThemeFilters() {
    const container = document.getElementById('themeFilterContainer');
    if (!container) return;

    // Hapus tombol yang ada (kecuali label)
    const label = container.querySelector('.group-label');
    container.innerHTML = '';
    if (label) container.appendChild(label);

    const themes = window.getUniqueThemes();
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn theme-all active';
    allBtn.dataset.theme = 'all';
    allBtn.textContent = 'Semua';
    container.appendChild(allBtn);

    themes.forEach(theme => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.theme = theme;
      btn.textContent = theme;
      container.appendChild(btn);
    });
  }

  // ================================================================
  //  INIT - ASYNC
  // ================================================================
  async function init() {
    try {
      // Tampilkan loading
      if (loadingIndicator) loadingIndicator.style.display = 'block';

      // Muat data default (N5)
      await window.loadLevelData(DEFAULT_LEVEL);
      vocabData = window.getVocabData();

      // Sembunyikan loading
      if (loadingIndicator) loadingIndicator.style.display = 'none';

      // Generate filter tema (harus setelah data siap)
      generateThemeFilters();

      // Setup komponen
      setupFilters();
      setupNav();
      setupHeroParallax();
      setupStorageSync();

      // Render awal
      render();
      updateStats();
      loadQuiz();

      // Event kuis
      nextQuizBtn.addEventListener('click', loadQuiz);

      console.log(`✅ GoiMaster siap! ${vocabData.length} kosakata dimuat (${DEFAULT_LEVEL})`);

    } catch (error) {
      console.error('Init error:', error);
      if (loadingIndicator) {
        loadingIndicator.innerHTML = `
          <div style="text-align:center; padding:40px; color:var(--accent);">
            <h3>⚠️ Gagal memuat data</h3>
            <p style="color:var(--text-dim);">Pastikan folder <strong>data/</strong> berisi file JSON yang sesuai.</p>
            <p style="color:var(--text-dim);font-size:0.85rem;">${error.message}</p>
          </div>
        `;
      }
    }
  }

  // Jalankan saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
