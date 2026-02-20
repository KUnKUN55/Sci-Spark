/**
 * Student Portal Logic
 * Handles UI interactions and data rendering
 */

// ========================================
// CONSTANTS & STATE
// ========================================

const SUB_STYLE = {
  'Mathematics': { icon: '📐', bg: '#FFFBEB', color: '#B45309' },
  'Physics': { icon: '⚡', bg: '#EFF6FF', color: '#1D4ED8' },
  'Chemistry': { icon: '🧪', bg: '#FDF2F8', color: '#BE185D' },
  'Biology': { icon: '🧬', bg: '#ECFDF5', color: '#047857' },
  'Astronomy': { icon: '🪐', bg: '#F5F3FF', color: '#6D28D9' },
  'Earth & Space': { icon: '🌍', bg: '#F0F9FF', color: '#0369A1' }
};

const TYPE_STYLE = {
  'Sheet': { color: '#0EA5E9', bg: '#E0F2FE' },
  'Note': { color: '#EAB308', bg: '#FEF9C3' },
  'Video': { color: '#EF4444', bg: '#FEE2E2' },
  'Default': { color: '#64748B', bg: '#F1F5F9' }
};

function getStyle(cat) {
  return SUB_STYLE[cat] || { icon: '📝', bg: '#F3F4F6', color: '#374151' };
}

function getTypeStyle(type) {
  return TYPE_STYLE[type] || TYPE_STYLE['Default'];
}

// State
let allMaterials = [];
let allExams = [];
let curExam = null;
let mcAns = {};

// Filter State
let activeSubject = 'All';
let activeType = 'All';
let searchTerm = '';

// ========================================
// INITIALIZATION
// ========================================

window.onload = function() {
  go('home');
};

// ========================================
// NAVIGATION
// ========================================

function go(page) {
  document.querySelectorAll('#view-home, #view-materials, #view-exam, #view-paper').forEach(e => e.classList.add('hidden'));
  document.getElementById('view-' + page).classList.remove('hidden');
  
  const titles = {
    'home': 'Dashboard',
    'materials': 'Library',
    'exam': 'Examinations',
    'paper': 'Exam Paper'
  };
  if (titles[page]) document.getElementById('page-header').innerText = titles[page];
  
  // Update sidebar nav state (Desktop)
  document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
  const navs = { 'home': 0, 'materials': 1, 'exam': 2 };
  if (navs[page] !== undefined && document.querySelectorAll('.nav-item')[navs[page]]) {
    document.querySelectorAll('.nav-item')[navs[page]].classList.add('active');
  }

  // Update bottom nav state (Mobile)
  document.querySelectorAll('.b-nav-item').forEach(e => e.classList.remove('active'));
  const bNavs = { 'home': 0, 'materials': 1, 'exam': 2 };
  if (bNavs[page] !== undefined && document.querySelectorAll('.b-nav-item')[bNavs[page]]) {
    document.querySelectorAll('.b-nav-item')[bNavs[page]].classList.add('active');
  }

  if (page === 'materials') loadMaterials();
  if (page === 'exam') loadExams();
}

// ========================================
// SEARCH
// ========================================

function handleSearch(val) {
  searchTerm = val.toLowerCase().trim();
  
  // Auto-switch to materials library if user searches from another page
  const isVisible = !document.getElementById('view-materials').classList.contains('hidden');
  if (!isVisible && searchTerm.length > 0) {
    go('materials');
  } else {
    renderMaterials();
  }
}

// ========================================
// MATERIALS
// ========================================

async function loadMaterials() {
  try {
    showLoading('Loading documents...');
    console.log('[Student] Fetching files...');
    
    // Use CacheLayer with onUpdate callback for instant load + background refresh
    if (typeof CacheLayer !== 'undefined') {
      const result = await CacheLayer.fetchWithCache('api_files', async () => {
        console.log('[Student] Network fetch: getFiles');
        const res = await apiGet('getFiles');
        console.log('[Student] API response:', JSON.stringify(res).substring(0, 200));
        return res.data;
      }, {
        ttl: 5 * 60 * 1000,
        onUpdate: function(freshData) {
          console.log('[Student] Background refresh: files updated, count:', freshData ? freshData.length : 0);
          allMaterials = Array.isArray(freshData) ? freshData : [];
          renderMaterials();
        }
      });
      allMaterials = Array.isArray(result.data) ? result.data : [];
    } else {
      const files = await getFiles();
      allMaterials = Array.isArray(files) ? files : [];
    }
    
    console.log('[Student] Files received:', allMaterials.length, 'items');
    if (allMaterials.length > 0) {
      console.log('[Student] Sample file:', JSON.stringify(allMaterials[0]));
    }
    renderMaterials();
    hideLoading();
  } catch (error) {
    console.error('[Student] Load error:', error);
    hideLoading();
    showError('Failed to load documents: ' + error.message);
  }
}

function setSubject(cat) {
  activeSubject = cat;
  document.querySelectorAll('.cat-tab').forEach(e => {
    e.classList.remove('active');
    if (e.innerText.includes(cat) || (cat === 'All' && e.innerText === 'All Subjects')) {
      e.classList.add('active');
    }
  });
  renderMaterials();
}

function setType(type) {
  activeType = type;
  document.querySelectorAll('.type-tab').forEach(e => {
    e.classList.remove('active');
    const txt = e.innerText;
    if ((type === 'All' && txt === 'All') ||
      (type === 'Sheet' && txt === 'Sheets') ||
      (type === 'Note' && txt === 'Notes') ||
      (type === 'Video' && txt === 'Videos')) {
      e.classList.add('active');
    }
  });
  renderMaterials();
}

function renderMaterials() {
  const grid = document.getElementById('mat-grid');
  if (!allMaterials || !allMaterials.length) return grid.innerHTML = '<div style="color:var(--text-sub); grid-column:1/-1; text-align:center; padding:60px;">No documents available.</div>';

  const filtered = allMaterials.filter(x => {
    const matchSub = activeSubject === 'All' || x.Category === activeSubject;
    const matchType = activeType === 'All' || x.Type === activeType;
    const matchSearch = searchTerm === '' ||
      x.Title.toLowerCase().includes(searchTerm) ||
      x.Category.toLowerCase().includes(searchTerm);
    return matchSub && matchType && matchSearch;
  });

  if (!filtered.length) {
    if (searchTerm) {
      return grid.innerHTML = '<div style="color:#999; grid-column:1/-1; text-align:center; padding:60px;">No documents found for "' + escapeHtml(searchTerm) + '".</div>';
    }
    return grid.innerHTML = '<div style="color:#999; grid-column:1/-1; text-align:center; padding:60px;">No documents found in this category.</div>';
  }

  grid.innerHTML = filtered.map(x => {
    const s = getStyle(x.Category);
    const t = getTypeStyle(x.Type);
    const safeTitle = escapeHtml(x.Title);
    const safeCat = escapeHtml(x.Category);
    const safeType = escapeHtml(x.Type);
    const safeLink = encodeURI(x.Link || '#');
    return `
    <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="card" style="text-decoration:none;">
      <div class="card-meta">
        <div class="icon-box" style="background:${s.bg}; color:${s.color};">${s.icon}</div>
        <div class="type-badge" style="background:${t.bg}; color:${t.color}">${safeType}</div>
      </div>
      <div style="margin-top:auto;">
        <div class="card-title">${safeTitle}</div>
        <div class="card-sub">${safeCat}</div>
      </div>
    </a>`;
  }).join('');

  initScrollAnimations();
}

// ========================================
// EXAMS
// ========================================

async function loadExams() {
  try {
    showLoading('Loading exams...');
    console.log('[Student] Fetching exams...');
    const examsData = await getExams();
    allExams = Array.isArray(examsData) ? examsData : [];
    console.log('[Student] Exams received:', allExams.length, 'items');
    const grid = document.getElementById('exam-grid');
    
    if (!allExams.length) {
      grid.innerHTML = '<div style="color:#999">No exams found.</div>';
      hideLoading();
      return;
    }
    
    grid.innerHTML = allExams.map(x => {
      const s = getStyle(x.Category);
      const isOpen = x.Status !== 'Closed';
      const safeId = escapeHtml(x.ExamID);
      const safeTitle = escapeHtml(x.Title);
      const safeCat = escapeHtml(x.Category);
      return `
      <div class="card" onclick="startExam('${safeId}')" style="${!isOpen ? 'opacity:0.6; filter:grayscale(1);' : ''}">
         <div class="card-meta">
           <div class="icon-box" style="background:${s.bg}; color:${s.color};">${s.icon}</div>
           ${!isOpen ? '<span class="type-badge" style="background:#F3F4F6; color:#666;">Closed</span>' : '<span class="type-badge" style="background:#DCFCE7; color:#166534;">Active</span>'}
         </div>
         <div>
            <div class="card-title">${safeTitle}</div>
            <div class="card-sub">${safeCat} • ${isOpen ? 'Ready' : 'Locked'}</div>
         </div>
      </div>`;
    }).join('');
    
    initScrollAnimations();
    hideLoading();
  } catch (error) {
    hideLoading();
    showError('Failed to load exams: ' + error.message);
  }
}

function startExam(id) {
  const e = allExams.find(x => x.ExamID === id);
  if (!e || e.Status === 'Closed') return alert("This exam is closed.");
  
  curExam = e;
  mcAns = {};

  const s = getStyle(e.Category);
  document.getElementById('paper-icon').innerText = s.icon;
  document.getElementById('paper-title').innerText = e.Title;
  document.getElementById('paper-cat').innerText = e.Category;

  const examType = e.ExamType || 'Mixed';

  // MC Section
  const mcDiv = document.getElementById('paper-mc');
  mcDiv.innerHTML = '';

  if (examType === 'MC' || examType === 'Mixed') {
    let k = e.AnswerKey || "";
    if (k && k.trim() !== "") {
      let count = k.split(',').length;
      for (let i = 1; i <= count; i++) {
        mcDiv.innerHTML += `
        <div class="question-box">
           <div class="q-num">Question ${i}</div>
           <div class="choice-grid">
             ${['A', 'B', 'C', 'D'].map(c => `<div class="choice-btn" onclick="pick(this, ${i}, '${c}')">${c}</div>`).join('')}
           </div>
        </div>`;
      }
    }
  }

  // Written Section
  const wDiv = document.getElementById('paper-written');
  wDiv.innerHTML = '';

  if (examType === 'Written' || examType === 'Mixed') {
    try {
      const w = JSON.parse(e.WrittenData);
      if (w.length) {
        if (examType === 'Mixed') {
          wDiv.innerHTML = '<div style="margin:40px 0; height:1px; background:#eee;"></div>';
        }
        wDiv.innerHTML += w.map((_, idx) => `
        <div class="question-box">
          <div class="q-num">Written Answer #${idx + 1}</div>
          <textarea id="w-${idx}" class="input-line" rows="3" placeholder="Type your answer here..."></textarea>
        </div>`).join('');
      }
    } catch (err) { }
  }

  go('paper');
}

function pick(el, q, val) {
  el.parentElement.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  mcAns[q] = val;
}

async function submitExamHandler() {
  const n = document.getElementById('std-name').value;
  if (!n) return alert("Please enter your name.");

  const btn = document.querySelector('.primary-btn');
  btn.innerText = "Submitting...";
  btn.disabled = true;

  let wAns = [];
  document.querySelectorAll('[id^="w-"]').forEach(t => wAns.push(t.value));

  try {
    const res = await submitExam({
      studentName: n,
      examId: curExam.ExamID,
      mcAnswers: mcAns,
      writtenAnswers: wAns
    });

    btn.innerText = "Submit Answers";
    btn.disabled = false;

    document.getElementById('res-score').innerText = res.score + " / " + res.total;
    document.getElementById('res-modal').classList.add('active');

  } catch (error) {
    btn.innerText = "Submit Answers";
    btn.disabled = false;
    showError(error.message);
  }
}

function closeModal() {
  document.getElementById('res-modal').classList.remove('active');
  go('home');
}

// ========================================
// ANIMATIONS
// ========================================

function initScrollAnimations() {
  const cards = document.querySelectorAll('.card');

  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  cards.forEach(card => {
    card.style.animationPlayState = 'paused';
    observer.observe(card);
  });
}
