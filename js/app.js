/* CineVerse 3.0 — JavaScript thuần, không cần npm hoặc API key. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const poster = (path) => `https://image.tmdb.org/t/p/w780${path}`;

  // Ảnh được ánh xạ rõ ràng theo từng phim; nếu ảnh không tải, card vẫn có nền đồ họa.
  const MOVIES = [
    { id: 'blade', title: 'Blade Runner 2049', year: 2017, minutes: 164, rating: 8.0, genres: ['Sci-Fi', 'Tâm lý'], tag: 'NEO-NOIR', palette: ['#f18e5f', '#5926a6'], img: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', desc: 'Sĩ quan K khám phá một bí mật có thể làm đảo lộn trật tự xã hội, đưa anh vào hành trình tìm kiếm Rick Deckard giữa một tương lai đầy bất định.' },
    { id: 'dune', title: 'Dune: Part Two', year: 2024, minutes: 166, rating: 8.5, genres: ['Sci-Fi', 'Phiêu lưu'], tag: 'EPIC SCI-FI', palette: ['#ecab78', '#8b3b87'], img: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', desc: 'Paul Atreides liên minh với người Fremen, tìm kiếm số phận của mình giữa chiến tranh, tình yêu và những lời tiên tri trên hành tinh Arrakis.' },
    { id: 'interstellar', title: 'Interstellar', year: 2014, minutes: 169, rating: 8.7, genres: ['Sci-Fi', 'Phiêu lưu'], tag: 'SPACE ODYSSEY', palette: ['#7fa5bc', '#35416e'], img: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', desc: 'Một nhóm phi hành gia đi xuyên qua hố sâu không gian để tìm nơi sinh sống mới khi Trái Đất dần không còn khả năng nuôi dưỡng con người.' },
    { id: 'inception', title: 'Inception', year: 2010, minutes: 148, rating: 8.8, genres: ['Sci-Fi', 'Hành động', 'Tâm lý'], tag: 'MIND-BENDING', palette: ['#5489b2', '#342169'], img: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', desc: 'Một chuyên gia xâm nhập giấc mơ nhận nhiệm vụ cấy một ý tưởng vào tiềm thức — nơi ranh giới giữa thực tại và ảo giác trở nên mong manh.' },
    { id: 'batman', title: 'The Batman', year: 2022, minutes: 176, rating: 7.8, genres: ['Hành động', 'Tâm lý'], tag: 'DARK DETECTIVE', palette: ['#ed526b', '#31192b'], img: '/74xTEgt7R36Fpooo50r9T25onhq.jpg', desc: 'Người Dơi lần theo chuỗi manh mối của kẻ sát nhân bí ẩn và đối mặt với những góc tối sâu nhất của thành phố Gotham.' },
    { id: 'opp', title: 'Oppenheimer', year: 2023, minutes: 180, rating: 8.6, genres: ['Tâm lý'], tag: 'BIOGRAPHICAL', palette: ['#f1a45d', '#492834'], img: '/ptpr0kGAckfQkJeJIt8st5dglvd.jpg', desc: 'Chân dung J. Robert Oppenheimer cùng những quyết định khoa học, đạo đức và chính trị đã làm thay đổi lịch sử nhân loại.' },
    { id: 'spider', title: 'Across the Spider-Verse', year: 2023, minutes: 140, rating: 8.6, genres: ['Hành động', 'Phiêu lưu'], tag: 'ANIMATED', palette: ['#f258ae', '#403bd1'], img: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', desc: 'Miles Morales du hành qua đa vũ trụ và gặp những người Nhện khác, đối mặt câu hỏi về trách nhiệm và bản sắc cá nhân.' },
    { id: 'everything', title: 'Everything Everywhere All at Once', year: 2022, minutes: 139, rating: 7.8, genres: ['Sci-Fi', 'Phiêu lưu', 'Tâm lý'], tag: 'MULTIVERSE', palette: ['#e1d38c', '#a34098'], img: '/w3LxiVYdWWRvEVdn5j6xK5MgbiT.jpg', desc: 'Một người phụ nữ bình thường bất ngờ phải kết nối với vô số phiên bản của chính mình để cứu những người cô yêu thương.' }
  ];

  const FEATURED_IDS = ['blade', 'dune', 'interstellar', 'inception'];
  let query = '';
  let genre = 'all';
  let favoritesOnly = false;
  let selectedMovie = null;
  let featuredIndex = 0;
  let pausedByUser = prefersReducedMotion;
  let autoTimer = null;
  let toastTimer = null;
  let favorites = new Set();

  try {
    const saved = JSON.parse(localStorage.getItem('cineverse-favorites') || '[]');
    if (Array.isArray(saved)) favorites = new Set(saved.filter(id => MOVIES.some(m => m.id === id)));
  } catch (_) { /* Trình duyệt có thể vô hiệu hóa lưu trữ. */ }

  function saveFavorites() {
    try { localStorage.setItem('cineverse-favorites', JSON.stringify([...favorites])); } catch (_) {}
    $('#favorite-count').textContent = favorites.size;
  }

  function showToast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 2900);
  }

  function renderPoster(movie, extraClass = '') {
    const [a, b] = movie.palette;
    return `<div class="poster-art ${extraClass}" style="--poster-a:${a};--poster-b:${b}">
      <span class="poster-fallback-art" aria-hidden="true">◈</span>
      <span class="poster-fallback-name">${movie.title}</span>
      <img src="${poster(movie.img)}" alt="Poster ${movie.title}" loading="lazy" decoding="async" onerror="this.remove()">
    </div>`;
  }

  function card(movie, index = 0, compact = false) {
    const loved = favorites.has(movie.id);
    return `<article class="movie-card reveal" style="--delay:${Math.min(index, 7) * 55}ms" data-id="${movie.id}">
      <div class="card-poster">${renderPoster(movie)}
        <span class="card-label">${movie.tag}</span>
        <button class="card-heart ${loved ? 'loved' : ''}" type="button" data-fav="${movie.id}" aria-label="${loved ? 'Bỏ yêu thích' : 'Thêm yêu thích'} ${movie.title}" aria-pressed="${loved}">${loved ? '♥' : '♡'}</button>
        <button class="card-open" type="button" data-open="${movie.id}" aria-label="Xem chi tiết ${movie.title}">CHI TIẾT ↗</button>
      </div>
      <div class="card-info"><div class="card-title-row"><h3>${movie.title}</h3><span>★ ${movie.rating.toFixed(1)}</span></div><p>${movie.year} <span>·</span> ${movie.genres.join(' / ')}</p></div>
    </article>`;
  }

  function revealNewElements() {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      $$('.reveal').forEach(el => el.classList.add('is-visible'));
      return;
    }
    $$('.reveal:not(.is-visible)').forEach(el => revealObserver.observe(el));
  }

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px -18px 0px' })
    : null;

  function filteredMovies() {
    return MOVIES.filter(movie => {
      if (favoritesOnly && !favorites.has(movie.id)) return false;
      if (genre !== 'all' && !movie.genres.includes(genre)) return false;
      const searchable = `${movie.title} ${movie.year} ${movie.genres.join(' ')} ${movie.desc}`.toLocaleLowerCase('vi');
      return searchable.includes(query.toLocaleLowerCase('vi'));
    });
  }

  function renderCatalog() {
    const result = filteredMovies();
    $('#movie-grid').innerHTML = result.map((m, i) => card(m, i)).join('');
    $('#results-note').textContent = `${result.length} / ${MOVIES.length} BỘ PHIM${favoritesOnly ? ' · DANH SÁCH YÊU THÍCH' : ''}`;
    $('#empty-state').hidden = result.length > 0;
    $$('.filter-chip').forEach(btn => {
      const selected = btn.dataset.genre === genre;
      btn.classList.toggle('selected', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    const favButton = $('#favorites-trigger');
    favButton.classList.toggle('active', favoritesOnly);
    favButton.setAttribute('aria-pressed', String(favoritesOnly));
    revealNewElements();
  }

  function renderLatest() {
    $('#latest-grid').innerHTML = [...MOVIES].sort((a, b) => b.year - a.year).slice(0, 4).map((m, i) => card(m, i, true)).join('');
    revealNewElements();
  }

  function setGenre(nextGenre, jump = false) {
    genre = nextGenre;
    favoritesOnly = false;
    renderCatalog();
    if (jump) $('#catalog').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  function toggleFavorite(id) {
    const movie = MOVIES.find(m => m.id === id);
    if (!movie) return;
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    saveFavorites(); renderCatalog(); renderLatest();
    if (selectedMovie?.id === id) updateDialogFavorite();
    showToast(favorites.has(id) ? `Đã lưu ${movie.title} vào yêu thích` : `Đã bỏ ${movie.title} khỏi yêu thích`);
  }

  function updateDialogFavorite() {
    const loved = !!selectedMovie && favorites.has(selectedMovie.id);
    $('#dialog-favorite').textContent = loved ? '♥ ĐÃ LƯU YÊU THÍCH' : '♡ LƯU YÊU THÍCH';
  }

  function openDetails(id) {
    const movie = MOVIES.find(m => m.id === id);
    if (!movie) return;
    selectedMovie = movie;
    $('#dialog-title').textContent = movie.title;
    $('#dialog-meta').textContent = `${movie.year}  ·  ${Math.floor(movie.minutes / 60)}h ${String(movie.minutes % 60).padStart(2, '0')}m  ·  ★ ${movie.rating.toFixed(1)} / 10  ·  ${movie.genres.join(' / ')}`;
    $('#dialog-overview').textContent = movie.desc;
    $('#dialog-poster').innerHTML = renderPoster(movie);
    updateDialogFavorite();
    const dialog = $('#movie-dialog');
    if (!dialog.open) dialog.showModal();
  }

  // Click delegation đảm bảo các card sinh ra bởi JavaScript hoạt động.
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open]');
    if (open) { openDetails(open.dataset.open); return; }
    const fav = e.target.closest('[data-fav]');
    if (fav) { toggleFavorite(fav.dataset.fav); return; }
    const filter = e.target.closest('[data-genre]');
    if (filter) { setGenre(filter.dataset.genre, filter.classList.contains('genre-tile')); return; }
  });

  $('#dialog-close').addEventListener('click', () => $('#movie-dialog').close());
  $('#dialog-done').addEventListener('click', () => $('#movie-dialog').close());
  $('#dialog-favorite').addEventListener('click', () => { if (selectedMovie) toggleFavorite(selectedMovie.id); });
  $('#movie-dialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  $('#favorites-trigger').addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;
    renderCatalog();
    $('#catalog').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    if (favoritesOnly && !favorites.size) showToast('Hãy nhấn ♡ trên poster để lưu phim nhé!');
  });
  $('#clear-filters').addEventListener('click', () => {
    query = ''; genre = 'all'; favoritesOnly = false; $('#search-input').value = ''; renderCatalog();
  });

  $('#search-input').addEventListener('input', e => {
    query = e.target.value.trim();
    favoritesOnly = false;
    renderCatalog();
  });
  $('#search-form').addEventListener('submit', e => {
    e.preventDefault();
    $('#catalog').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !$('#movie-dialog').open) {
      e.preventDefault(); $('#search-input').focus();
    }
  });

  const featured = FEATURED_IDS.map(id => MOVIES.find(m => m.id === id));
  $('#hero-dots').innerHTML = featured.map((m, i) => `<button type="button" class="hero-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Chọn ${m.title}" aria-current="${i === 0}"></button>`).join('');

  function showSlide(index) {
    featuredIndex = (index + featured.length) % featured.length;
    const movie = featured[featuredIndex];
    const content = $('#hero-content');
    const art = $('#hero-art');
    content.classList.remove('hero-enter');
    void content.offsetWidth;
    $('#hero-title').textContent = movie.title;
    $('#hero-title').dataset.text = movie.title;
    $('#hero-tag').textContent = `✦ ${movie.tag}`;
    $('#hero-year').textContent = movie.year;
    $('#hero-length').textContent = `${Math.floor(movie.minutes / 60)}h ${String(movie.minutes % 60).padStart(2, '0')}m`;
    $('#hero-genre').textContent = movie.genres[0];
    $('#hero-rating').textContent = movie.rating.toFixed(1);
    $('#hero-description').textContent = movie.desc;
    $('.eyebrow').lastChild.textContent = ` ${String(featuredIndex + 1).padStart(3, '0')}/${String(featured.length).padStart(3, '0')}`;
    art.style.setProperty('--hero-a', movie.palette[0]);
    art.style.setProperty('--hero-b', movie.palette[1]);
    const image = new Image();
    image.onload = () => { if (featured[featuredIndex].id === movie.id) art.style.backgroundImage = `linear-gradient(90deg,rgba(10,11,33,.45),rgba(10,11,33,.05)),url("${image.src}")`; };
    image.onerror = () => { if (featured[featuredIndex].id === movie.id) art.style.backgroundImage = ''; };
    art.style.backgroundImage = '';
    image.src = poster(movie.img);
    $$('.hero-dot').forEach((dot, i) => { dot.classList.toggle('active', i === featuredIndex); dot.setAttribute('aria-current', String(i === featuredIndex)); });
    if (!prefersReducedMotion) content.classList.add('hero-enter');
    $('#hero-timer').classList.remove('running');
    void $('#hero-timer').offsetWidth;
    if (!pausedByUser && !prefersReducedMotion) $('#hero-timer').classList.add('running');
  }

  function restartAuto() {
    clearInterval(autoTimer);
    if (!pausedByUser && !prefersReducedMotion && !document.hidden) autoTimer = setInterval(() => showSlide(featuredIndex + 1), 7000);
    const pause = $('#hero-pause');
    pause.textContent = pausedByUser ? '▶' : 'Ⅱ';
    pause.setAttribute('aria-label', pausedByUser ? 'Tiếp tục trình chiếu' : 'Tạm dừng trình chiếu');
  }
  function moveSlide(delta) { showSlide(featuredIndex + delta); restartAuto(); }
  $('#hero-prev').addEventListener('click', () => moveSlide(-1));
  $('#hero-next').addEventListener('click', () => moveSlide(1));
  $('#hero-dots').addEventListener('click', e => {
    const dot = e.target.closest('[data-slide]'); if (dot) { showSlide(Number(dot.dataset.slide)); restartAuto(); }
  });
  $('#hero-pause').addEventListener('click', () => { pausedByUser = !pausedByUser; restartAuto(); showSlide(featuredIndex); });
  $('#hero-details').addEventListener('click', () => openDetails(featured[featuredIndex].id));
  document.addEventListener('visibilitychange', restartAuto);

  const menuTrigger = $('#menu-trigger');
  const mobileMenu = $('#mobile-menu');
  function closeMenu() { mobileMenu.hidden = true; menuTrigger.setAttribute('aria-expanded', 'false'); }
  menuTrigger.addEventListener('click', () => {
    mobileMenu.hidden = !mobileMenu.hidden;
    menuTrigger.setAttribute('aria-expanded', String(!mobileMenu.hidden));
  });
  $$('#mobile-menu a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const header = $('#header');
  const backTop = $('#back-top');
  const onScroll = () => {
    const scrolled = scrollY > 36;
    header.classList.toggle('scrolled', scrolled);
    backTop.classList.toggle('visible', scrollY > 560);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  backTop.addEventListener('click', () => scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  // 3D tilt nhẹ; chỉ áp dụng cho thiết bị con trỏ chính xác.
  if (!prefersReducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointermove', e => {
      const el = e.target.closest('.card-poster');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--tilt-x', `${((e.clientY - rect.top) / rect.height - .5) * -5}deg`);
      el.style.setProperty('--tilt-y', `${((e.clientX - rect.left) / rect.width - .5) * 5}deg`);
      el.style.setProperty('--spot-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty('--spot-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      const el = e.target.closest('.card-poster');
      if (el && !el.contains(e.relatedTarget)) {
        el.style.setProperty('--tilt-x', '0deg'); el.style.setProperty('--tilt-y', '0deg');
      }
    });
  }

  // Canvas ambient: hạt neon chạy nền, giới hạn DPR và tốc độ khung hình.
  function startAmbient() {
    if (prefersReducedMotion) return;
    const canvas = $('#ambient');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width, height, dots = [], previous = 0;
    const colors = ['184,231,234', '227,80,168', '149,67,167'];
    const randomDot = () => ({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + .35, speed: Math.random() * .28 + .08, a: Math.random() * .42 + .12, color: colors[Math.floor(Math.random() * colors.length)] });
    function resize() {
      width = innerWidth; height = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = Array.from({ length: Math.min(42, Math.round(width / 24)) }, randomDot);
    }
    resize(); window.addEventListener('resize', resize, { passive: true });
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden || now - previous < 33) return;
      previous = now; ctx.clearRect(0, 0, width, height);
      dots.forEach(d => {
        d.y -= d.speed; if (d.y < -5) { d.y = height + 5; d.x = Math.random() * width; }
        ctx.fillStyle = `rgba(${d.color},${d.a})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      });
    }
    requestAnimationFrame(frame);
  }

  document.body.classList.add('js-enabled');
  $('#year-now').textContent = new Date().getFullYear();
  saveFavorites(); renderCatalog(); renderLatest(); showSlide(0); restartAuto(); onScroll(); startAmbient();
})();
