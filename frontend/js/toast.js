/**
 * Toast Notification System — Sci-Spark
 * Beautiful dark glass toast notifications
 */

var Toast = (function() {
  'use strict';

  var container = null;
  var DURATION = 3500;

  function getContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:99999;' +
      'display:flex;flex-direction:column;gap:10px;' +
      'pointer-events:none;max-width:380px;width:calc(100% - 40px);';
    document.body.appendChild(container);
    return container;
  }

  function show(message, type, duration) {
    var c = getContainer();
    var el = document.createElement('div');

    var colors = {
      success: { bg: 'rgba(6,214,160,0.15)', border: 'rgba(6,214,160,0.4)', accent: '#06D6A0' },
      error:   { bg: 'rgba(255,107,157,0.15)', border: 'rgba(255,107,157,0.4)', accent: '#FF6B9D' },
      warning: { bg: 'rgba(255,217,61,0.15)', border: 'rgba(255,217,61,0.4)', accent: '#FFD93D' },
      info:    { bg: 'rgba(123,97,255,0.15)', border: 'rgba(123,97,255,0.4)', accent: '#7B61FF' }
    };

    var clr = colors[type] || colors.info;

    el.style.cssText =
      'background:' + clr.bg + ';' +
      'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);' +
      'border:1px solid ' + clr.border + ';' +
      'border-left:3px solid ' + clr.accent + ';' +
      'border-radius:16px;padding:14px 20px;' +
      'color:#E8ECF4;font-family:"Plus Jakarta Sans","Sarabun",sans-serif;' +
      'font-size:0.875rem;font-weight:500;line-height:1.5;' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.4);' +
      'pointer-events:auto;cursor:pointer;' +
      'transform:translateX(110%);opacity:0;' +
      'transition:transform 0.35s cubic-bezier(0.22,1,0.36,1),opacity 0.35s ease;';

    el.textContent = message;

    // Click to dismiss
    el.addEventListener('click', function() { dismiss(el); });

    c.appendChild(el);

    // Slide in
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        el.style.transform = 'translateX(0)';
        el.style.opacity = '1';
      });
    });

    // Auto dismiss
    var dur = duration || DURATION;
    setTimeout(function() { dismiss(el); }, dur);

    return el;
  }

  function dismiss(el) {
    if (!el || !el.parentNode) return;
    el.style.transform = 'translateX(110%)';
    el.style.opacity = '0';
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 350);
  }

  return {
    show: show,
    success: function(msg, dur) { return show(msg, 'success', dur); },
    error:   function(msg, dur) { return show(msg, 'error', dur); },
    warning: function(msg, dur) { return show(msg, 'warning', dur); },
    info:    function(msg, dur) { return show(msg, 'info', dur); }
  };
})();
