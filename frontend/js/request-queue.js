/**
 * Request Queue — Auto-retry failed API calls
 * Queues POST/PUT/DELETE when offline, retries when back online
 */

var RequestQueue = (function() {
  'use strict';

  var STORAGE_KEY = 'scispark_request_queue';
  var MAX_RETRIES = 3;
  var RETRY_DELAY = 3000;
  var processing = false;

  // ========================================
  // QUEUE STORAGE (localStorage)
  // ========================================
  function getQueue() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) { return []; }
  }

  function saveQueue(queue) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); }
    catch (e) {}
  }

  // ========================================
  // ADD to queue
  // ========================================
  function add(url, options, meta) {
    var queue = getQueue();
    queue.push({
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      url: url,
      options: options || {},
      meta: meta || {},
      retries: 0,
      createdAt: Date.now()
    });
    saveQueue(queue);
    console.log('[Queue] Added request:', meta.action || url);

    // Show toast
    if (window.Toast) {
      Toast.info('📤 บันทึกรอส่ง — จะส่งอัตโนมัติเมื่อออนไลน์');
    }

    // Try processing immediately
    processQueue();
    return queue.length;
  }

  // ========================================
  // PROCESS queue
  // ========================================
  function processQueue() {
    if (processing) return;
    var queue = getQueue();
    if (queue.length === 0) return;

    processing = true;
    console.log('[Queue] Processing', queue.length, 'pending requests');

    processNext(queue, 0);
  }

  function processNext(queue, index) {
    if (index >= queue.length) {
      processing = false;
      var remaining = getQueue();
      if (remaining.length > 0) {
        console.log('[Queue]', remaining.length, 'requests still pending');
      }
      return;
    }

    var item = queue[index];

    fetch(item.url, item.options)
      .then(function(response) {
        if (response.ok || response.status < 500) {
          // Success — remove from queue
          console.log('[Queue] ✅ Sent:', item.meta.action || item.url);
          removeFromQueue(item.id);

          if (window.Toast) {
            Toast.success('✅ ส่งข้อมูลสำเร็จ: ' + (item.meta.action || 'request'));
          }

          processNext(queue, index + 1);
        } else {
          retryItem(item, queue, index);
        }
      })
      .catch(function() {
        retryItem(item, queue, index);
      });
  }

  function retryItem(item, queue, index) {
    item.retries++;
    if (item.retries >= MAX_RETRIES) {
      console.log('[Queue] ❌ Max retries reached:', item.meta.action || item.url);
      removeFromQueue(item.id);

      if (window.Toast) {
        Toast.error('❌ ส่งข้อมูลไม่สำเร็จ: ' + (item.meta.action || 'request'));
      }

      processNext(queue, index + 1);
    } else {
      // Update retry count
      updateInQueue(item);
      console.log('[Queue] Retry', item.retries + '/' + MAX_RETRIES, item.meta.action);

      setTimeout(function() {
        processNext(queue, index);
      }, RETRY_DELAY * item.retries);
    }
  }

  function removeFromQueue(id) {
    var queue = getQueue().filter(function(item) { return item.id !== id; });
    saveQueue(queue);
  }

  function updateInQueue(item) {
    var queue = getQueue();
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].id === item.id) {
        queue[i] = item;
        break;
      }
    }
    saveQueue(queue);
  }

  // ========================================
  // ONLINE/OFFLINE listeners
  // ========================================
  window.addEventListener('online', function() {
    console.log('[Queue] Back online — processing queue');
    if (window.Toast) Toast.success('🌐 กลับมาออนไลน์แล้ว');
    setTimeout(processQueue, 1000);
  });

  window.addEventListener('offline', function() {
    console.log('[Queue] Went offline');
    if (window.Toast) Toast.warning('📴 ออฟไลน์ — ข้อมูลจะถูกส่งเมื่อกลับมาออนไลน์');
  });

  // Process any pending items on page load
  if (navigator.onLine) {
    setTimeout(processQueue, 2000);
  }

  // ========================================
  // PUBLIC API
  // ========================================
  return {
    add: add,
    process: processQueue,
    getPending: getQueue,
    clear: function() { saveQueue([]); }
  };
})();
