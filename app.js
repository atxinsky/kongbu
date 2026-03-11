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

// ========== RENDER ==========
function getFilteredMovies() {
  let movies = []

  if (state.currentCategory === 'all') {
    Object.keys(MOVIES).forEach(cat => {
      MOVIES[cat].forEach(m => movies.push({ ...m, category: cat }))
    })
  } else if (MOVIES[state.currentCategory]) {
    movies = MOVIES[state.currentCategory].map(m => ({
      ...m,
      category: state.currentCategory
    }))
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

function getCategoryLabel(cat) {
  const labels = {
    'body-horror': '肉体恐怖',
    'cthulhu': '克苏鲁',
    'rob-zombie': 'Rob Zombie',
    'tim-burton': 'Tim Burton',
    'john-carpenter': 'John Carpenter',
    'stephen-king': '斯蒂芬金',
    'del-toro': '德尔托罗'
  }
  return labels[cat] || cat
}

function renderTimeline() {
  const container = document.getElementById('timeline')
  const movies = getFilteredMovies()

  if (movies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">💀</div>
        <p>没有找到匹配的电影</p>
      </div>`
    return
  }

  // Group by year
  const grouped = {}
  movies.forEach(m => {
    const year = m.year || '未知'
    if (!grouped[year]) grouped[year] = []
    grouped[year].push(m)
  })

  // If showing all, add section headers per category
  if (state.currentCategory === 'all' && !state.searchQuery) {
    renderAllCategories(container)
    return
  }

  // Single category or search results
  let html = ''

  // Section header for single category
  if (state.currentCategory !== 'all' && CATEGORIES[state.currentCategory]) {
    const cat = CATEGORIES[state.currentCategory]
    html += `
      <div class="section-header">
        <div class="section-title">${cat.icon} ${cat.title}</div>
        <div class="section-subtitle">${cat.subtitle}</div>
        <div class="section-count">${movies.length} 部</div>
      </div>`
  }

  const years = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
  years.forEach(year => {
    html += renderYearGroup(year, grouped[year])
  })

  container.innerHTML = html
}

function renderAllCategories(container) {
  let html = ''
  const categoryOrder = ['body-horror', 'cthulhu', 'rob-zombie', 'john-carpenter', 'tim-burton', 'stephen-king', 'del-toro']

  categoryOrder.forEach(catKey => {
    const movies = MOVIES[catKey]
    if (!movies || movies.length === 0) return

    const cat = CATEGORIES[catKey]
    html += `
      <div class="section-header">
        <div class="section-title">${cat.icon} ${cat.title}</div>
        <div class="section-subtitle">${cat.subtitle}</div>
        <div class="section-count">${movies.length} 部</div>
      </div>`

    const grouped = {}
    movies.forEach(m => {
      const year = m.year || '未知'
      if (!grouped[year]) grouped[year] = []
      grouped[year].push({ ...m, category: catKey })
    })

    const years = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
    years.forEach(year => {
      html += renderYearGroup(year, grouped[year])
    })
  })

  container.innerHTML = html
}

function renderYearGroup(year, movies) {
  const cards = movies.map(m => renderMovieCard(m)).join('')
  return `
    <div class="year-group">
      <div class="year-label">${year}</div>
      ${cards}
    </div>`
}

function renderMovieCard(movie) {
  const titleEn = movie.title_en ? `<span class="movie-title-en">${movie.title_en}</span>` : ''
  const country = movie.country ? `<span class="meta-tag country">${movie.country}</span>` : ''
  const category = movie.category ? `<span class="meta-tag category">${getCategoryLabel(movie.category)}</span>` : ''
  const desc = movie.desc ? `<div class="card-desc">${movie.desc}</div>` : ''

  let links = ''
  if (movie.douban) {
    links = `<div class="card-links"><a class="card-link" href="${movie.douban}" target="_blank" rel="noopener">豆瓣 ↗</a></div>`
  }

  return `
    <div class="movie-card">
      <div class="card-header">
        <span class="movie-title-cn">${movie.title_cn}</span>
        ${titleEn}
      </div>
      <div class="card-meta">
        ${country}
        ${category}
      </div>
      ${desc}
      ${links}
    </div>`
}

// ========== STATS ==========
function renderStats() {
  let totalMovies = 0
  let categories = 0
  let yearSpan = { min: 9999, max: 0 }

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
      <div class="stat-item">
        <div class="stat-num">${totalMovies}</div>
        <div class="stat-label">FILMS</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">${categories}</div>
        <div class="stat-label">CATEGORIES</div>
      </div>
      <div class="stat-item">
        <div class="stat-num">${yearSpan.min}-${yearSpan.max}</div>
        <div class="stat-label">YEARS</div>
      </div>
    </div>
    <div class="search-box">
      <input type="text" class="search-input" id="searchInput" placeholder="搜索电影名、导演、年份...">
    </div>`

  const mainContent = document.getElementById('mainContent')
  mainContent.insertAdjacentHTML('afterbegin', statsHtml)

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim()
    renderTimeline()
  })
}

// ========== NAV EVENTS ==========
function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.currentCategory = btn.dataset.category
      state.searchQuery = ''
      const searchInput = document.getElementById('searchInput')
      if (searchInput) searchInput.value = ''
      renderTimeline()
    })
  })
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  renderStats()
  renderTimeline()
  initNav()
})
