/**
 * Smart Cache Layer — IndexedDB
 * Stores API data locally for instant load + background sync
 */

const CacheLayer = (function() {
  'use strict';

  const DB_NAME = 'SciSparkCache';
  const DB_VERSION = 1;
  const STORE_NAME = 'apiData';
  const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  let db = null;

  // ========================================
  // INIT IndexedDB
  // ========================================
  function init() {
    return new Promise(function(resolve, reject) {
      if (db) return resolve(db);
      if (!window.indexedDB) {
        console.warn('[Cache] IndexedDB not supported');
        return resolve(null);
      }

      var req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = function(e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains(STORE_NAME)) {
          d.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      req.onsuccess = function(e) {
        db = e.target.result;
        console.log('[Cache] IndexedDB ready');
        resolve(db);
      };

      req.onerror = function() {
        console.warn('[Cache] IndexedDB failed');
        resolve(null);
      };
    });
  }

  // ========================================
  // GET from cache
  // ========================================
  function get(key) {
    return new Promise(function(resolve) {
      if (!db) return resolve(null);
      try {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(key);

        req.onsuccess = function() {
          var result = req.result;
          if (!result) return resolve(null);

          // Check TTL
          if (result.expiry && Date.now() > result.expiry) {
            // Expired — delete and return null
            remove(key);
            return resolve(null);
          }

          resolve(result.data);
        };

        req.onerror = function() { resolve(null); };
      } catch (e) {
        resolve(null);
      }
    });
  }

  // ========================================
  // SET to cache
  // ========================================
  function set(key, data, ttl) {
    return new Promise(function(resolve) {
      if (!db) return resolve(false);
      try {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.put({
          key: key,
          data: data,
          expiry: Date.now() + (ttl || DEFAULT_TTL),
          timestamp: Date.now()
        });
        tx.oncomplete = function() { resolve(true); };
        tx.onerror = function() { resolve(false); };
      } catch (e) {
        resolve(false);
      }
    });
  }

  // ========================================
  // REMOVE from cache
  // ========================================
  function remove(key) {
    return new Promise(function(resolve) {
      if (!db) return resolve(false);
      try {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = function() { resolve(true); };
        tx.onerror = function() { resolve(false); };
      } catch (e) {
        resolve(false);
      }
    });
  }

  // ========================================
  // CLEAR all cache
  // ========================================
  function clear() {
    return new Promise(function(resolve) {
      if (!db) return resolve(false);
      try {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = function() { resolve(true); };
        tx.onerror = function() { resolve(false); };
      } catch (e) {
        resolve(false);
      }
    });
  }

  // ========================================
  // FETCH WITH CACHE (main API)
  // Load from cache → return instantly → fetch fresh → update cache + UI
  // ========================================
  function fetchWithCache(key, fetchFn, options) {
    var opts = options || {};
    var ttl = opts.ttl || DEFAULT_TTL;
    var onUpdate = opts.onUpdate || null; // callback when fresh data arrives

    return new Promise(function(resolve, reject) {
      // Ensure DB is initialized before any cache operation
      init().then(function() {
        // 1. Try cache first
        get(key).then(function(cached) {
          if (cached) {
            console.log('[Cache] HIT:', key);
            resolve({ data: cached, source: 'cache' });

            // 2. Fetch fresh in background
            fetchFn().then(function(fresh) {
              set(key, fresh, ttl);
              if (onUpdate && JSON.stringify(fresh) !== JSON.stringify(cached)) {
                console.log('[Cache] Updated:', key);
                onUpdate(fresh);
              }
            }).catch(function() {});

          } else {
            console.log('[Cache] MISS:', key);
            // 3. No cache — fetch from network
            fetchFn().then(function(fresh) {
              set(key, fresh, ttl);
              resolve({ data: fresh, source: 'network' });
            }).catch(function(err) {
              reject(err);
            });
          }
        });
      }).catch(function(err) {
        // DB init failed — fetch directly from network
        console.warn('[Cache] DB init failed, fetching directly');
        fetchFn().then(function(fresh) {
          resolve({ data: fresh, source: 'network' });
        }).catch(function(err2) {
          reject(err2);
        });
      });
    });
  }

  // ========================================
  // PUBLIC API
  // ========================================
  return {
    init: init,
    get: get,
    set: set,
    remove: remove,
    clear: clear,
    fetchWithCache: fetchWithCache
  };
})();

// Auto-init on load
CacheLayer.init();
