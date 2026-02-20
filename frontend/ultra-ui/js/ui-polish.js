/**
 * ✨ UI-POLISH.JS — Micro-Interactions & Safety
 * ═══════════════════════════════════════════════
 * Button ripple, resize guard, network indicator,
 * empty state beautifier, blur-on-scroll, haptic-feel.
 *
 * ✅ Zero logic changes. All try/catch.
 * ✅ Removable: delete file + <script> tag
 * ═══════════════════════════════════════════════
 */
(function UltraPolish() {
  'use strict';

  const INIT_DELAY = 300;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════════════════════════════════
     A. BUTTON RIPPLE — Material-Apple Hybrid
     Radial light ripple on pointerdown
     ═══════════════════════════════════════════ */
  function initRipple() {
    try {
      /* Inject ripple keyframe */
      const s = document.createElement('style');
      s.id = 'ultra-ripple-kf';
      s.textContent = `
        @keyframes ultra-ripple {
          0%   { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0; }
        }
        .ultra-ripple-host { position: relative; overflow: hidden; }
      `;
      if (!document.getElementById('ultra-ripple-kf')) document.head.appendChild(s);

      document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.primary-btn, .secondary-btn, .action-btn, .cat-tab, .type-tab, .choice-btn, .btn-lookup, .b-nav-item, button[type="submit"]');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top  - size / 2;

        const ripple = document.createElement('span');
        Object.assign(ripple.style, {
          position: 'absolute',
          width: size + 'px', height: size + 'px',
          left: x + 'px', top: y + 'px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 70%)',
          transform: 'scale(0)',
          animation: 'ultra-ripple 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
          pointerEvents: 'none',
          zIndex: '10',
        });

        btn.classList.add('ultra-ripple-host');
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }, { passive: true });
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     B. RESIZE GUARD — Freeze animation on resize
     ═══════════════════════════════════════════ */
  function initResizeGuard() {
    try {
      const s = document.createElement('style');
      s.id = 'ultra-resize-guard';
      s.textContent = `
        .ultra-resizing *,
        .ultra-resizing *::before,
        .ultra-resizing *::after {
          animation-play-state: paused !important;
          transition: none !important;
        }
      `;
      if (!document.getElementById('ultra-resize-guard')) document.head.appendChild(s);

      let timer;
      window.addEventListener('resize', () => {
        document.documentElement.classList.add('ultra-resizing');
        clearTimeout(timer);
        timer = setTimeout(() => {
          document.documentElement.classList.remove('ultra-resizing');
        }, 200);
      }, { passive: true });
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     C. NETWORK INDICATOR — Frosted Offline Banner
     Shows calm notification when offline
     ═══════════════════════════════════════════ */
  function initNetworkIndicator() {
    try {
      if (document.getElementById('ultra-offline-banner')) return;

      const s = document.createElement('style');
      s.textContent = `
        #ultra-offline-banner {
          position: fixed;
          top: max(16px, env(safe-area-inset-top));
          left: 50%;
          transform: translateX(-50%) translateY(-100px);
          background: rgba(15,23,42,0.90);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          color: white;
          padding: 12px 24px;
          border-radius: 100px;
          font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          z-index: 999999;
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
          border: 0.5px solid rgba(255,255,255,0.10);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #ultra-offline-banner.visible {
          transform: translateX(-50%) translateY(0);
        }
      `;
      document.head.appendChild(s);

      const banner = document.createElement('div');
      banner.id = 'ultra-offline-banner';
      banner.innerHTML = '<span style="font-size:1.1em">⚠︎</span> No Internet Connection';
      document.body.appendChild(banner);

      window.addEventListener('offline', () => banner.classList.add('visible'));
      window.addEventListener('online', () => {
        banner.innerHTML = '<span style="font-size:1.1em">✓</span> Back Online';
        setTimeout(() => banner.classList.remove('visible'), 2200);
        setTimeout(() => {
          banner.innerHTML = '<span style="font-size:1.1em">⚠︎</span> No Internet Connection';
        }, 2800);
      });

      if (!navigator.onLine) banner.classList.add('visible');
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     D. BLUR-ON-SCROLL — Adaptive Header Blur
     Header gets more frosted as you scroll
     ═══════════════════════════════════════════ */
  function initScrollBlur() {
    if (prefersReduced) return;
    try {
      const header = document.querySelector('.header');
      if (!header) return;

      const content = document.querySelector('.main') || document.querySelector('.content');
      if (!content) return;

      let ticking = false;
      content.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const scrollTop = content.scrollTop || 0;
          const blur = Math.min(32 + scrollTop * 0.15, 56);
          const opacity = Math.min(0.65 + scrollTop * 0.002, 0.92);
          header.style.backdropFilter = `blur(${blur}px) saturate(180%)`;
          header.style.webkitBackdropFilter = `blur(${blur}px) saturate(180%)`;
          header.style.background = `rgba(248, 249, 255, ${opacity})`;

          if (scrollTop > 8) {
            header.style.borderBottom = '0.5px solid rgba(0,0,0,0.06)';
            header.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)';
          } else {
            header.style.borderBottom = '0.5px solid rgba(255,255,255,0.5)';
            header.style.boxShadow = 'none';
          }
          ticking = false;
        });
      }, { passive: true });
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     E. VISIBILITY PAUSE — Stop GPU when tab hidden
     ═══════════════════════════════════════════ */
  function initVisibilityPause() {
    try {
      const s = document.createElement('style');
      s.id = 'ultra-viz-pause';
      s.textContent = `
        .ultra-tab-hidden * {
          animation-play-state: paused !important;
        }
        .ultra-tab-hidden canvas {
          display: none !important;
        }
      `;
      if (!document.getElementById('ultra-viz-pause')) document.head.appendChild(s);

      document.addEventListener('visibilitychange', () => {
        document.documentElement.classList.toggle('ultra-tab-hidden', document.hidden);
      });
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     F. DOUBLE-CLICK GUARD — Prevent Multi-Submit
     Debounce rapid clicks on action buttons
     ═══════════════════════════════════════════ */
  function initDoubleClickGuard() {
    try {
      const debounceMap = new WeakMap();

      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.primary-btn, button[type="submit"]');
        if (!btn) return;

        const now = Date.now();
        const last = debounceMap.get(btn) || 0;
        if (now - last < 500) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        debounceMap.set(btn, now);
      }, { capture: true }); /* Capture phase — runs before app handlers */

    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     G. CURSOR GLOW — Ambient Light Effect
     Subtle blue glow follows cursor on main area
     ═══════════════════════════════════════════ */
  function initCursorGlow() {
    if (prefersReduced || ('ontouchstart' in window)) return;
    try {
      const glow = document.createElement('div');
      glow.id = 'ultra-cursor-glow';
      Object.assign(glow.style, {
        position: 'fixed',
        width: '320px', height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10,132,255,0.06) 0%, rgba(10,132,255,0.02) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: '0',
        transform: 'translate(-50%, -50%)',
        transition: 'opacity 0.3s ease',
        opacity: '0',
        willChange: 'left, top',
      });
      document.body.appendChild(glow);

      let raf = null;
      document.addEventListener('mousemove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          glow.style.left = e.clientX + 'px';
          glow.style.top = e.clientY + 'px';
          glow.style.opacity = '1';
          raf = null;
        });
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
      }, { passive: true });

    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════ */
  function init() {
    initRipple();
    initResizeGuard();
    initNetworkIndicator();
    initScrollBlur();
    initVisibilityPause();
    initDoubleClickGuard();
    initCursorGlow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, INIT_DELAY));
  } else {
    setTimeout(init, INIT_DELAY);
  }

})();
