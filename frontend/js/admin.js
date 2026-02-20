/**
 * Admin Portal Logic
 * Handles document management, exam creation, and gradebook
 */

// ========================================
// INITIALIZATION
// ========================================

window.onload = function() {
  loadFiles();
  loadExams();
  renderKeys();
};

// ========================================
// TAB NAVIGATION
// ========================================

function tab(id, el) {
  ['files','exam','score'].forEach(x => document.getElementById('tab-'+x).classList.add('hidden'));
  document.getElementById('tab-'+id).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  if (el) el.classList.add('active');
}

// ========================================
// KEY GENERATOR
// ========================================

function renderKeys() {
  const c = document.getElementById('e-mc-count').value;
  const d = document.getElementById('key-container');
  let h = '';
  for(let i=1; i<=c; i++) {
    h += `<div class="key-item"><span>${i}</span><select id="k-${i}"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>`;
  }
  d.innerHTML = h || '<div style="color:#aaa; font-style:italic;">No multiple choice questions</div>';
}

function getKeyStr() {
  const c = document.getElementById('e-mc-count').value;
  if(c<=0) return "";
  let arr = [];
  for(let i=1; i<=c; i++) arr.push(i + ":" + document.getElementById('k-'+i).value);
  return arr.join(', ');
}

// ========================================
// EXAM TYPE UI CONTROL
// ========================================

function updateExamTypeUI() {
  const examType = document.getElementById('e-type').value;
  const mcSection = document.getElementById('mc-section');
  const writtenSection = document.getElementById('written-section');
  
  if (examType === 'MC') {
    mcSection.style.display = 'block';
    writtenSection.style.display = 'none';
    document.getElementById('e-written-count').value = '0';
  } else if (examType === 'Written') {
    mcSection.style.display = 'none';
    writtenSection.style.display = 'block';
    document.getElementById('e-mc-count').value = '0';
    renderKeys();
  } else {
    mcSection.style.display = 'block';
    writtenSection.style.display = 'block';
  }
}

// ========================================
// FILE MANAGEMENT
// ========================================

async function addFileHandler() {
  const g = (id) => document.getElementById(id).value;
  
  try {
    showLoading('Adding file...');
    await addFile({
      category: g('f-cat'),
      type: g('f-type'),
      title: g('f-title'),
      link: g('f-link')
    });
    
    document.getElementById('f-title').value = '';
    document.getElementById('f-link').value = '';
    await loadFiles();
    hideLoading();
    showSuccess('File added successfully!');
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

async function loadFiles() {
  try {
    console.log('[Admin] Fetching files...');
    const d = await getFiles();
    const files = Array.isArray(d) ? d : [];
    console.log('[Admin] Files received:', files.length, 'items');
    
    if (!files.length) {
      document.getElementById('file-list').innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-sub);">No files found</div>';
      return;
    }
    
    let h = `<table><thead><tr><th>Title</th><th>Subject</th><th>Type</th><th>Action</th></tr></thead><tbody>`;
    files.forEach(x => h+=`<tr><td><a href="${encodeURI(x.Link || '#')}" target="_blank" rel="noopener noreferrer" style="color:var(--text-main); font-weight:600; text-decoration:none;">${escapeHtml(x.Title)}</a></td><td><span class="badge">${escapeHtml(x.Category)}</span></td><td>${escapeHtml(x.Type)}</td><td><button class="del" onclick="delFile('${escapeHtml(x.ID)}')">Delete</button></td></tr>`);
    document.getElementById('file-list').innerHTML = h+'</tbody></table>';
  } catch (error) {
    console.error('[Admin] Load files error:', error);
    document.getElementById('file-list').innerHTML = '<div style="padding:20px; text-align:center; color:#FF6B9D;">Error loading files: ' + escapeHtml(error.message) + '</div>';
  }
}

async function delFile(id) {
  if(!confirm('Delete this file?')) return;
  
  try {
    showLoading('Deleting...');
    await deleteItem('Files', 0, id);
    await loadFiles();
    hideLoading();
    showSuccess('File deleted!');
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

// ========================================
// EXAM MANAGEMENT
// ========================================

async function createExamHandler() {
  const ti = document.getElementById('e-title').value;
  const examType = document.getElementById('e-type').value;
  const mcCount = parseInt(document.getElementById('e-mc-count').value) || 0;
  const writtenCount = parseInt(document.getElementById('e-written-count').value) || 0;
  
  // Validation
  if(!ti) return alert("Title required");
  
  if(examType === 'MC' && mcCount === 0) {
    return alert("Multiple Choice Only exam must have at least 1 MC question");
  }
  if(examType === 'Written' && writtenCount === 0) {
    return alert("Written Only exam must have at least 1 written question");
  }
  if(examType === 'Mixed' && mcCount === 0 && writtenCount === 0) {
    return alert("Mixed exam must have at least 1 question (MC or Written)");
  }
  
  let wArr = [];
  for(let i=0; i<writtenCount; i++) wArr.push("Q");
  
  try {
    showLoading('Creating exam...');
    await createExam({
      title: ti,
      category: document.getElementById('e-cat').value,
      mcKey: getKeyStr(),
      writtenQuestions: wArr,
      examType: examType
    });
    
    await loadExams();
    hideLoading();
    showSuccess('Exam created successfully!');
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

async function loadExams() {
  try {
    console.log('[Admin] Fetching exams...');
    const d = await getExams();
    const exams = Array.isArray(d) ? d : [];
    console.log('[Admin] Exams received:', exams.length, 'items');
    
    let h = `<table><thead><tr><th>Status</th><th>Exam Name</th><th>Type</th><th>Questions</th><th>Action</th></tr></thead><tbody>`;
    const sel = document.getElementById('score-filter');
    sel.innerHTML = '<option value="">-- Select Exam --</option>';
    
    if (!exams.length) {
      document.getElementById('exam-list').innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-sub);">No exams found</div>';
      return;
    }
    
    exams.forEach(x => {
      let isOpen = x.Status !== 'Closed';
      const examType = x.ExamType || 'Mixed';
      const mcCount = (x.AnswerKey && x.AnswerKey.trim()) ? x.AnswerKey.split(',').length : 0;
      let writtenCount = 0;
      try { writtenCount = JSON.parse(x.WrittenData || '[]').length; } catch(e){}
      
      let typeLabel = examType === 'MC' ? '📝 MC' : examType === 'Written' ? '✍️ Written' : '📋 Mixed';
      let questInfo = examType === 'MC' ? `${mcCount} MC` : examType === 'Written' ? `${writtenCount} Written` : `${mcCount} MC, ${writtenCount} Written`;
      
      h += `<tr><td><button class="toggle ${isOpen?'active':''}" onclick="toggleStatus('${escapeHtml(x.ExamID)}', '${isOpen?'Closed':'Open'}')">${isOpen?'OPEN':'CLOSED'}</button></td><td><div style="font-weight:700">${escapeHtml(x.Title)}</div><div style="font-size:0.8rem; color:var(--text-sub)">${escapeHtml(x.Category)}</div></td><td><span class="badge">${typeLabel}</span></td><td>${questInfo}</td><td><button class="del" onclick="delExam('${escapeHtml(x.ExamID)}')">Delete</button></td></tr>`;
      sel.innerHTML += `<option value="${escapeHtml(x.ExamID)}">${escapeHtml(x.Title)}</option>`;
    });
    
    document.getElementById('exam-list').innerHTML = h+'</tbody></table>';
  } catch (error) {
    console.error('Load exams error:', error);
  }
}

async function toggleStatus(id, st) {
  try {
    showLoading('Updating status...');
    await updateExamStatus(id, st);
    await loadExams();
    hideLoading();
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

async function delExam(id) {
  if(!confirm('Delete this exam?')) return;
  
  try {
    showLoading('Deleting...');
    await deleteItem('Exams', 0, id);
    await loadExams();
    hideLoading();
    showSuccess('Exam deleted!');
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

// ========================================
// GRADEBOOK
// ========================================

async function loadScoresHandler() {
  const id = document.getElementById('score-filter').value;
  if(!id) return;
  
  try {
    showLoading('Loading scores...');
    const d = await getScores(id);
    
    if(!d.length) {
      document.getElementById('score-table').innerHTML = '<div style="padding:20px; text-align:center; color:gray;">No responses yet</div>';
      hideLoading();
      return;
    }
    
    let h = `<table><thead><tr><th>Time</th><th>Student</th><th>Score</th><th>Written</th></tr></thead><tbody>`;
    d.reverse().forEach(r => {
       let w = "-";
       try { w = JSON.parse(r.Written_Answers).map((a,i)=>`<div><b>Q${i+1}:</b> ${escapeHtml(a)}</div>`).join(''); } catch(e){}
       h += `<tr><td style="font-size:0.8rem; color:var(--text-sub)">${escapeHtml(r.Timestamp)}</td><td style="font-weight:600">${escapeHtml(r.StudentName)}</td><td><span class="badge" style="background:#ECFDF5; color:#065F46;">${escapeHtml(String(r.Score))}</span></td><td style="font-size:0.85rem">${w}</td></tr>`;
    });
    
    document.getElementById('score-table').innerHTML = h+'</tbody></table>';
    hideLoading();
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}
