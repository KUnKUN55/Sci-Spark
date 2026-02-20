/**
 * API Client Library for Student Portal v2
 * Integrated with CacheLayer (IndexedDB) and RequestQueue (Background Sync)
 */

// Global config fallback — uses window assignment to avoid var/const collision with config.js
if (typeof window.CONFIG === 'undefined') {
  window.CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbxWXh9NVnfFPI6AcbWmAEgk_O8x9sa9MY41dz8bQl8-4E-kiy0wJg7cf4OQb1ZPe9LL/exec',
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    TIMEOUT: 30000
  };
}

// ========================================
// CORE API FUNCTIONS (Direct Network Fetch)
// ========================================

/**
 * Make GET request with timeout
 */
async function apiGet(action, params = {}) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const url = `${CONFIG.API_URL}?${query}`;
  
  console.log('[API] GET:', action);

  let res;
  try {
    res = await fetchWithTimeout(url, { method: 'GET', redirect: 'follow' });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[API] Timeout:', action);
      throw new Error('Request timed out. Please try again.');
    }
    console.error('[API] Network Error:', err);
    throw new Error('Connection failed: ' + err.message);
  }

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!data.success) throw new Error(data.error || 'Server responded with error');
    return data;
  } catch (parseErr) {
    if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
    console.error('[API] Parse Error:', text.substring(0, 200));
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * Make POST request with timeout + offline queue fallback
 */
async function apiPost(action, payload = {}) {
  const body = { action, ...payload };
  const url = CONFIG.API_URL;
  const fetchOpts = {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  };

  console.log('[API] POST:', action);

  // If offline, queue the request for later
  if (!navigator.onLine && typeof RequestQueue !== 'undefined') {
    RequestQueue.add(url, fetchOpts, { action: action });
    return { success: true, queued: true };
  }

  let res;
  try {
    res = await fetchWithTimeout(url, fetchOpts);
  } catch (err) {
    // Network/timeout failure — queue for retry
    if (typeof RequestQueue !== 'undefined') {
      RequestQueue.add(url, fetchOpts, { action: action });
      return { success: true, queued: true };
    }
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    console.error('[API] Network Error:', err);
    throw new Error('Connection failed: ' + err.message);
  }

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!data.success) throw new Error(data.error || 'Server responded with error');
    return data;
  } catch (parseErr) {
    if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
    console.error('[API] Parse Error:', text.substring(0, 200));
    throw new Error('Invalid JSON response from server');
  }
}

// Helper: Fetch with timeout
async function fetchWithTimeout(url, options = {}) {
  const timeout = options.timeout || CONFIG.TIMEOUT;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Global error handler
// ========================================
// API WRAPPERS (Compatibility Layer)
// These functions are used by student.js and admin.js
// ========================================

/**
 * GET wrappers with CacheLayer integration
 * Uses stale-while-revalidate: return cached data instantly, refresh in background
 */
async function getFiles() {
  if (typeof CacheLayer !== 'undefined') {
    const result = await CacheLayer.fetchWithCache('api_files', async () => {
      const res = await apiGet('getFiles');
      return res.data;
    }, { ttl: 5 * 60 * 1000 });
    return result.data;
  }
  const res = await apiGet('getFiles');
  return res.data;
}

async function getExams() {
  if (typeof CacheLayer !== 'undefined') {
    const result = await CacheLayer.fetchWithCache('api_exams', async () => {
      const res = await apiGet('getExams');
      return res.data;
    }, { ttl: 3 * 60 * 1000 });
    return result.data;
  }
  const res = await apiGet('getExams');
  return res.data;
}

async function getScores(examId) {
  const res = await apiGet('getScores', { examId: examId });
  return res.data;
}

async function addFile(payload) {
  const res = await apiPost('addFile', payload);
  if (typeof CacheLayer !== 'undefined') CacheLayer.remove('api_files');
  return res;
}

async function deleteItem(sheetName, idColIndex, idValue) {
  const res = await apiPost('deleteItem', { sheetName, idColIndex, idValue });
  if (typeof CacheLayer !== 'undefined') {
    CacheLayer.remove('api_files');
    CacheLayer.remove('api_exams');
  }
  return res;
}

async function createExam(payload) {
  const res = await apiPost('createExam', payload);
  if (typeof CacheLayer !== 'undefined') CacheLayer.remove('api_exams');
  return res;
}

async function updateExamStatus(examId, newStatus) {
  const res = await apiPost('updateExamStatus', { examId, newStatus });
  if (typeof CacheLayer !== 'undefined') CacheLayer.remove('api_exams');
  return res;
}

async function submitExam(payload) {
  const res = await apiPost('submitExam', payload);
  return res;
}

// ========================================
// UI HELPERS (Global)
// ========================================

function showLoading(msg = 'Loading...') {
  let overlay = document.getElementById('global-loading');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-loading';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="loading-spinner"></div><div id="loading-text" style="font-weight:500; letter-spacing:0.5px; font-family:'Plus Jakarta Sans', sans-serif;">${msg}</div>`;
    document.body.appendChild(overlay);
    // Force reflow
    void overlay.offsetWidth;
  } else {
    const txt = document.getElementById('loading-text');
    if(txt) txt.innerText = msg;
  }
  overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.getElementById('global-loading');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      if (!overlay.classList.contains('active')) overlay.remove();
    }, 300);
  }
}

function showError(msg) {
  if (window.Toast) Toast.error(msg);
  else alert('❌ ' + msg);
}

function showSuccess(msg) {
  if (window.Toast) Toast.success(msg);
  else alert('✅ ' + msg);
}

// HTML escape utility to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Global Export
window.apiGet = apiGet;
window.apiPost = apiPost;
window.getFiles = getFiles;
window.getExams = getExams;
window.getScores = getScores;
window.addFile = addFile;
window.deleteItem = deleteItem;
window.createExam = createExam;
window.updateExamStatus = updateExamStatus;
window.submitExam = submitExam;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.showSuccess = showSuccess;
window.escapeHtml = escapeHtml;
