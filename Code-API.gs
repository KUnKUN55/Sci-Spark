var SS_ID = '1xuC4Hq5O1GiWmuHvWlkcYRLXE1OUOipTlnzQf7HR4Vw';

// ========================================
// API ROUTING (Headless Architecture)
// ========================================

/**
 * GET Handler - Returns JSON data
 * Supports: getFiles, getExams, getScores
 */
function doGet(e) {
  // Handle case when called without parameters
  if (!e || !e.parameter) {
    return createJsonResponse({
      success: false,
      error: 'Missing parameters. Usage: ?action=getFiles or ?action=getExams or ?action=getScores&examId=XXX'
    });
  }
  
  var action = e.parameter.action;
  
  try {
    var response;
    
    switch(action) {
      case 'getFiles':
        response = { success: true, data: getData('Files') };
        break;
        
      case 'getExams':
        response = { success: true, data: getData('Exams') };
        break;
        
      case 'getScores': {
        var examId = e.parameter.examId;
        if (!examId) {
          response = { success: false, error: 'examId required' };
        } else {
          response = { success: true, data: getExamScores(examId) };
        }
        break;
      }
      
      // === Score Announcement Routes ===
      case 'getStudentScore': {
        var sid = e.parameter.studentId;
        if (!sid) {
          response = { success: false, error: 'studentId required' };
        } else {
          response = getStudentScoreData(sid);
        }
        break;
      }
        
      case 'getAllScores':
        response = getAllScoreData();
        break;
      
      case 'saveScore': {
        var saveId = e.parameter.studentId;
        if (!saveId) {
          response = { success: false, error: 'studentId required' };
        } else {
          var itemsRaw = e.parameter.items || '[]';
          var parsedItems = [];
          try { parsedItems = JSON.parse(itemsRaw); } catch(ex) { parsedItems = []; }
          response = saveScoreData({
            studentId: saveId,
            mode: e.parameter.mode || 'total',
            items: parsedItems,
            total: Number(e.parameter.total) || 0
          });
        }
        break;
      }
      
      case 'deleteScore': {
        var delId = e.parameter.studentId;
        if (!delId) {
          response = { success: false, error: 'studentId required' };
        } else {
          response = deleteScoreData(delId);
        }
        break;
      }
      
      case 'deleteAllScores':
        response = deleteAllScoreData();
        break;
        
      default:
        response = { success: false, error: 'Invalid action' };
    }
    
    return createJsonResponse(response);
    
  } catch (error) {
    return createJsonResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

/**
 * POST Handler - Receives data and performs actions
 * IMPORTANT: Uses text/plain to avoid CORS preflight
 */
function doPost(e) {
  try {
    // Handle case when called without data
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        success: false,
        error: 'Missing POST data'
      });
    }
    
    // Parse JSON from text/plain content (CORS workaround)
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    var response;
    
    switch(action) {
      case 'addFile':
        addFile(data.category, data.type, data.title, data.link);
        response = { success: true };
        break;
        
      case 'createExam':
        createExam(data.title, data.category, data.mcKey, data.writtenQuestions, data.examType);
        response = { success: true };
        break;
        
      case 'submitExam':
        response = submitExam(data.studentName, data.examId, data.mcAnswers, data.writtenAnswers);
        break;
        
      case 'deleteItem':
        deleteItem(data.sheetName, data.idColIndex, data.idValue);
        response = { success: true };
        break;
        
      case 'updateExamStatus':
        updateExamStatus(data.examId, data.newStatus);
        response = { success: true };
        break;
        
      case 'uploadFile': {
        var fileUrl = uploadBase64File(data.fileName, data.fileData, data.folderId);
        response = { success: true, fileUrl: fileUrl };
        break;
      }
      
      // === Score Announcement Routes ===
      case 'saveScore':
        response = saveScoreData(data);
        break;
        
      case 'deleteScore':
        response = deleteScoreData(data.studentId);
        break;
        
      case 'deleteAllScores':
        response = deleteAllScoreData();
        break;
        
      default:
        response = { success: false, error: 'Invalid action' };
    }
    
    return createJsonResponse(response);
    
  } catch (error) {
    return createJsonResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

/**
 * Create JSON response with CORS headers
 * NOTE: Google Apps Script automatically handles CORS for ContentService
 * No need for manual headers - GAS adds them automatically!
 */
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  // GAS automatically adds CORS headers when deployed as Web App
  // with "Anyone" access - no manual configuration needed!
  
  return output;
}

// ========================================
// DATA OPERATIONS
// ========================================

/**
 * Generic data retrieval from any sheet
 */
function getData(sheetName) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

/**
 * Add file/document with LockService for concurrency
 */
function addFile(category, type, title, link) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Wait up to 30 seconds
    
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName('Files');
    const id = 'F-' + Date.now();
    sheet.appendRow([id, category, type, title, link, new Date()]);
    
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete item from any sheet
 */
function deleteItem(sheetName, idColIndex, idValue) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    
    // Loop backwards to avoid index shifting
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][idColIndex] == idValue) {
        sheet.deleteRow(i + 1);
        return "Deleted";
      }
    }
  } finally {
    lock.releaseLock();
  }
}

// ========================================
// EXAM OPERATIONS
// ========================================

/**
 * Create exam with LockService
 */
function createExam(title, category, mcKey, writtenQuestionsArray, examType) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName('Exams');
    const id = 'EX-' + Date.now();
    const writtenJSON = JSON.stringify(writtenQuestionsArray);
    const type = examType || 'Mixed';
    
    sheet.appendRow([id, title, category, mcKey, writtenJSON, 'Open', type]);
    
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update exam status
 */
function updateExamStatus(examId, newStatus) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName('Exams');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == examId) {
        sheet.getRange(i + 1, 6).setValue(newStatus);
        return;
      }
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Get scores for specific exam
 */
function getExamScores(examId) {
  const allResp = getData('Responses');
  const filtered = allResp.filter(r => String(r.ExamID).trim() === String(examId).trim());
  return filtered;
}

/**
 * Submit exam with LockService (CRITICAL for concurrency)
 */
function submitExam(studentName, examId, mcAnswers, writtenAnswersObj) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Critical for handling simultaneous submissions
    
    const ss = SpreadsheetApp.openById(SS_ID);
    const examSheet = ss.getSheetByName('Exams');
    const exams = examSheet.getDataRange().getValues();
    
    let answerKeyStr = "";
    let totalMC = 0;
    let status = "Closed";
    
    // Find exam and answer key
    for(let i = 1; i < exams.length; i++) {
      if(exams[i][0] == examId) {
        answerKeyStr = exams[i][3];
        status = exams[i][5];
        break;
      }
    }
    
    // Prevent submission if exam is closed
    if(status === 'Closed') {
      return { success: false, error: "ข้อสอบปิดแล้ว ไม่สามารถส่งคำตอบได้" };
    }
    
    // Grade multiple choice
    let keyMap = {};
    if(answerKeyStr) {
      let parts = answerKeyStr.split(',');
      parts.forEach(p => {
        let k = p.split(':');
        if(k.length == 2) {
          keyMap[k[0].trim()] = k[1].trim().toUpperCase();
          totalMC++;
        }
      });
    }
    
    let score = 0;
    for (const [qNum, ans] of Object.entries(mcAnswers)) {
      if(keyMap[qNum] && keyMap[qNum] === ans) score++;
    }
    
    // Save to Responses sheet
    const respSheet = ss.getSheetByName('Responses');
    const timestamp = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    
    respSheet.appendRow([
      studentName,
      examId,
      score,
      JSON.stringify(mcAnswers),
      JSON.stringify(writtenAnswersObj),
      timestamp
    ]);
    
    return { success: true, score: score, total: totalMC };
    
  } finally {
    lock.releaseLock();
  }
}

// ========================================
// FILE UPLOAD (Base64)
// ========================================

/**
 * Upload Base64 encoded file to Google Drive
 * @param {string} fileName - Name of the file
 * @param {string} fileData - Base64 encoded file data
 * @param {string} folderId - Optional folder ID
 * @return {string} File URL
 */
function uploadBase64File(fileName, fileData, folderId) {
  try {
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Data = fileData.split(',')[1] || fileData;
    
    // Decode Base64
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      getMimeType(fileName),
      fileName
    );
    
    // Upload to Drive
    let file;
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      file = folder.createFile(blob);
    } else {
      file = DriveApp.createFile(blob);
    }
    
    // Make file publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
    
  } catch (error) {
    throw new Error('File upload failed: ' + error.toString());
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ========================================
// SCORE ANNOUNCEMENT SYSTEM
// (Storage via Google Sheet: ScoreAnnounce)
// ========================================

/**
 * Get or create the ScoreAnnounce sheet
 */
function _getScoreSheet() {
  var ss = SpreadsheetApp.openById(SS_ID);
  var sheet = ss.getSheetByName('ScoreAnnounce');
  if (!sheet) {
    sheet = ss.insertSheet('ScoreAnnounce');
    sheet.getRange(1, 1, 1, 5)
         .setValues([['StudentID', 'Mode', 'ItemsJSON', 'Total', 'Timestamp']])
         .setFontWeight('bold')
         .setBackground('#f0f0f0');
  }
  return sheet;
}

/**
 * Find row index for a studentId (returns -1 if not found)
 */
function _findStudentRow(sheet, studentId) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(studentId).trim()) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1;
}

/**
 * Get score for a single student (student-facing)
 */
function getStudentScoreData(studentId) {
  try {
    var sheet = _getScoreSheet();
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(studentId).trim()) {
        var items = [];
        try { items = JSON.parse(data[i][2] || '[]'); } catch(e) { items = []; }
        
        return {
          success: true,
          found: true,
          data: {
            studentId: String(data[i][0]).trim(),
            mode: data[i][1] || 'total',
            items: items,
            total: Number(data[i][3]) || 0
          }
        };
      }
    }
    
    return { success: true, found: false, message: 'ยังไม่มีการประกาศคะแนน' };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Get all scores (admin-facing)
 */
function getAllScoreData() {
  try {
    var sheet = _getScoreSheet();
    var data = sheet.getDataRange().getValues();
    var list = [];
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue; // skip empty rows
      var items = [];
      try { items = JSON.parse(data[i][2] || '[]'); } catch(e) { items = []; }
      
      list.push({
        studentId: String(data[i][0]).trim(),
        mode: data[i][1] || 'total',
        items: items,
        total: Number(data[i][3]) || 0
      });
    }
    
    return { success: true, data: list };
  } catch(err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Save or update a student's score (upsert)
 */
function saveScoreData(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sheet = _getScoreSheet();
    var studentId = String(payload.studentId).trim();
    var mode = payload.mode || 'total';
    var items = payload.items || [];
    var total = Number(payload.total) || 0;
    var timestamp = new Date().toISOString();
    var itemsJson = JSON.stringify(items);
    
    var rowIndex = _findStudentRow(sheet, studentId);
    
    if (rowIndex > 0) {
      // Update existing row
      sheet.getRange(rowIndex, 1, 1, 5).setValues([[studentId, mode, itemsJson, total, timestamp]]);
    } else {
      // Append new row
      sheet.appendRow([studentId, mode, itemsJson, total, timestamp]);
    }
    
    return { success: true };
  } catch(err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete score for a single student
 */
function deleteScoreData(studentId) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sheet = _getScoreSheet();
    var rowIndex = _findStudentRow(sheet, studentId);
    
    if (rowIndex > 0) {
      sheet.deleteRow(rowIndex);
    }
    
    return { success: true };
  } catch(err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete ALL scores (reset for new announcement round)
 */
function deleteAllScoreData() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sheet = _getScoreSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    return { success: true };
  } catch(err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ========================================
// SETUP FUNCTION
// ========================================

/**
 * Initialize database structure
 */
function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var structure = {
    'Files': ['ID', 'Category', 'Type', 'Title', 'Link', 'Timestamp'],
    'Exams': ['ExamID', 'Title', 'Category', 'AnswerKey', 'WrittenData', 'Status', 'ExamType'],
    'Responses': ['StudentName', 'ExamID', 'Score', 'MC_Answers', 'Written_Answers', 'Timestamp']
  };

  for (var sheetName in structure) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, structure[sheetName].length)
           .setValues([structure[sheetName]])
           .setFontWeight("bold")
           .setBackground("#f0f0f0");
    }
  }

}
