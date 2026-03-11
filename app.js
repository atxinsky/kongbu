// ========== APP STATE ==========
const state = {
  currentCategory: 'all',
  searchQuery: ''
}

// ========== CATEGORY CONFIG ==========
const CATEGORIES = {
  'body-horror': { title: 'Body Horror', subtitle: '肉体恐怖 · 1980-2025 每年一部', icon: '🧬' },
  'cthulhu': { title: 'Cosmic Horror', subtitle: '克苏鲁 · 洛夫克拉夫特式宇宙恐怖', icon: '🐙' },
  'rob-zombie': { title: 'Rob Zombie', subtitle: '罗伯·赞比导演作品', icon: '🎬' },
  'tim-burton': { title: 'Tim Burton', subtitle: '蒂姆·波顿导演作品', icon: '🎭' },
  'john-carpenter': { title: 'John Carpenter', subtitle: '约翰·卡朋特导演作品', icon: '🔪' },
  'stephen-king': { title: 'Stephen King', subtitle: '斯蒂芬·金小说改编电影', icon: '📖' },
  'del-toro': { title: 'Guillermo del Toro', subtitle: '吉尔莫·德尔·托罗导演作品', icon: '👹' }
}

// ========== HELPERS ==========
function getCategoryLabel(cat) {
  const labels = {
    'body-horror': '肉体恐怖', 'cthulhu': '克苏鲁', 'rob-zombie': 'Rob Zombie',
    'tim-burton': 'Tim Burton', 'john-carpenter': 'John Carpenter',
    'stephen-king': '斯蒂芬金', 'del-toro': '德尔托罗'
  }
  return labels[cat] || cat
}

function getFilteredMovies() {
  let movies = []
  if (state.currentCategory === 'all') {
    Object.keys(MOVIES).forEach(cat => {
      MOVIES[cat].forEach(m => movies.push({ ...m, category: cat }))
    })
  } else if (MOVIES[state.currentCategory]) {
    movies = MOVIES[state.currentCategory].map(m => ({ ...m, category: state.currentCategory }))
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase()
    movies = movies.filter(m =>
      (m.title_cn && m.title_cn.toLowerCase().includes(q)) ||
      (m.title_en && m.title_en.toLowerCase().includes(q)) ||
      (m.year && String(m.year).includes(q)) ||
      (m.country && m.country.toLowerCase().includes(q)) ||
      (m.desc && m.desc.toLowerCase().includes(q))
    )
  }
  return movies.sort((a, b) => (a.year || 0) - (b.year || 0))
}

// ========== RENDER CARD ==========
function renderMovieCard(movie) {
  const titleEn = movie.title_en ? `<div class="movie-title-en">${movie.title_en}</div>` : ''
  const country = movie.country ? `<span class="meta-tag country">${movie.country}</span>` : ''
  const category = movie.category ? `<span class="meta-tag category">${getCategoryLabel(movie.category)}</span>` : ''
  const rating = movie.rating ? `<span class="meta-tag rating">★ ${movie.rating}</span>` : ''
  const desc = movie.desc ? `<div class="card-desc">${movie.desc}</div>` : ''
  const year = movie.year ? movie.year : '—'
  let links = ''
  if (movie.douban) {
    links = `<div class="card-links"><a class="card-link" href="${movie.douban}" target="_blank" rel="noopener">豆瓣 ↗</a></div>`
  }
  const poster = movie.poster
    ? `<img src="${movie.poster}" alt="${movie.title_cn}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=poster-placeholder>🎬</div>'">`
    : '<div class="poster-placeholder">🎬</div>'
  return `
    <div class="movie-card">
      <div class="card-poster">${poster}</div>
      <div class="card-body">
        <div class="card-top">
          <span class="card-year">${year}</span>
          <span class="movie-title-cn">${movie.title_cn}</span>
        </div>
        ${titleEn}
        <div class="card-meta">${rating}${country}${category}</div>
        ${desc}
        ${links}
      </div>
    </div>`
}

// ========== RENDER GRID ==========
function renderContent() {
  const container = document.getElementById('timeline')
  const movies = getFilteredMovies()

  if (movies.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">💀</div><p>没有找到匹配的电影</p></div>'
    return
  }

  // Show all categories
  if (state.currentCategory === 'all' && !state.searchQuery) {
    renderAllCategories(container)
    return
  }

  let html = ''
  // Section header for single category
  if (state.currentCategory !== 'all' && CATEGORIES[state.currentCategory]) {
    const cat = CATEGORIES[state.currentCategory]
    html += `<div class="section-header">
      <div class="section-title">${cat.icon} ${cat.title}</div>
      <div class="section-subtitle">${cat.subtitle}</div>
      <div class="section-count">${movies.length} 部</div>
    </div>`
  }

  html += '<div class="movie-grid">'
  movies.forEach(m => { html += renderMovieCard(m) })
  html += '</div>'

  container.innerHTML = html
}

function renderAllCategories(container) {
  let html = ''
  const order = ['body-horror', 'cthulhu', 'rob-zombie', 'john-carpenter', 'tim-burton', 'stephen-king', 'del-toro']
  order.forEach(catKey => {
    const movies = MOVIES[catKey]
    if (!movies || movies.length === 0) return
    const cat = CATEGORIES[catKey]
    html += `<div class="section-header">
      <div class="section-title">${cat.icon} ${cat.title}</div>
      <div class="section-subtitle">${cat.subtitle}</div>
      <div class="section-count">${movies.length} 部</div>
    </div>`
    html += '<div class="movie-grid">'
    const sorted = [...movies].sort((a, b) => (a.year || 0) - (b.year || 0))
    sorted.forEach(m => { html += renderMovieCard({ ...m, category: catKey }) })
    html += '</div>'
  })
  container.innerHTML = html
}

// ========== STATS ==========
function renderStats() {
  let totalMovies = 0, categories = 0, yearSpan = { min: 9999, max: 0 }
  Object.keys(MOVIES).forEach(cat => {
    const movies = MOVIES[cat]
    if (movies && movies.length > 0) {
      categories++
      totalMovies += movies.length
      movies.forEach(m => {
        if (m.year) {
          yearSpan.min = Math.min(yearSpan.min, m.year)
          yearSpan.max = Math.max(yearSpan.max, m.year)
        }
      })
    }
  })
  const statsHtml = `
    <div class="stats-bar">
      <div class="stat-item"><div class="stat-num">${totalMovies}</div><div class="stat-label">FILMS</div></div>
      <div class="stat-item"><div class="stat-num">${categories}</div><div class="stat-label">CATEGORIES</div></div>
      <div class="stat-item"><div class="stat-num">${yearSpan.min}-${yearSpan.max}</div><div class="stat-label">YEARS</div></div>
    </div>
    <div class="search-box">
      <input type="text" class="search-input" id="searchInput" placeholder="搜索电影名、年份、国家...">
    </div>`
  document.getElementById('mainContent').insertAdjacentHTML('afterbegin', statsHtml)
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim()
    renderContent()
  })
}

// ========== NAV ==========
function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.currentCategory = btn.dataset.category
      state.searchQuery = ''
      const si = document.getElementById('searchInput')
      if (si) si.value = ''
      renderContent()
    })
  })
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  renderStats()
  renderContent()
  initNav()
})
