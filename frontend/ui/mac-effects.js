/**
 * 🍎 MAC-EFFECTS.JS — macOS Interactive Effects
 * ═══════════════════════════════════════════════
 * ✅ Purely decorative — zero changes to business logic
 * ✅ All wrapped in try/catch — if something breaks, it fails silently
 * ✅ Respects prefers-reduced-motion
 * ✅ Uses requestAnimationFrame + IntersectionObserver
 * ✅ Removable: delete file + <script> tag
 * ═══════════════════════════════════════════════
 */

(function MacEffects() {
  'use strict';

  /* ── Safety: delay to avoid racing with existing scripts ── */
  const INIT_DELAY = 200; // ms

  /* ── Motion preference ── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Device capability check ── */
  const isTouchDevice   = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isLowEndMobile  = isTouchDevice && (navigator.hardwareConcurrency <= 4);


  /* ════════════════════════════════════════
     A. SCROLL REVEAL — IntersectionObserver
     Cards fade in as they enter viewport
     ════════════════════════════════════════ */
  function initScrollReveal() {
    if (prefersReduced) return;

    try {
      const targets = document.querySelectorAll(
        '.card, .admin-card, .score-card, .stat-card, .score-item-row'
      );
      if (!targets.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -20px 0px'
      });

      targets.forEach((el, i) => {
        /* Only apply to elements below the fold */
        const rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(14px)';
          el.style.transition = `opacity 0.38s cubic-bezier(0.22,1,0.36,1) ${i * 0.03}s,
                                  transform 0.38s cubic-bezier(0.22,1,0.36,1) ${i * 0.03}s`;
          observer.observe(el);
        }
      });
    } catch (e) {
      /* fail silently */
    }
  }


  /* ════════════════════════════════════════
     B. CARD 3D TILT — cursor parallax
     Subtle 3D perspective tilt on hover
     Max ±2.5° — very Apple-like
     Only on non-touch devices
     ════════════════════════════════════════ */
  function initCardTilt() {
    if (prefersReduced || isTouchDevice) return;

    try {
      const cards = document.querySelectorAll('.card, .admin-card');
      if (!cards.length) return;

      cards.forEach(card => {
        card.addEventListener('mousemove', handleTilt, { passive: true });
        card.addEventListener('mouseleave', resetTilt, { passive: true });
      });

      function handleTilt(e) {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);

        const tiltX = -(dy * 2.5); /* max 2.5° */
        const tiltY =  (dx * 2.5);

        requestAnimationFrame(() => {
          card.style.transform = `translateY(-3px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          card.style.transition = 'transform 0.08s linear';
        });
      }

      function resetTilt(e) {
        const card = e.currentTarget;
        requestAnimationFrame(() => {
          card.style.transform = '';
          card.style.transition = 'transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease';
        });
      }
    } catch (e) { /* fail silently */ }
  }


  /* ════════════════════════════════════════
     C. MOUSE PARALLAX — background depth
     Subtle wallpaper shift using CSS vars
     ════════════════════════════════════════ */
  function initParallax() {
    if (prefersReduced || isTouchDevice || isLowEndMobile) return;

    try {
      let raf = null;
      let lastX = 0, lastY = 0;

      document.addEventListener('mousemove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const nx = (e.clientX / window.innerWidth  - 0.5) * 20; /* px shift */
          const ny = (e.clientY / window.innerHeight - 0.5) * 12;

          /* Lerp for smooth movement */
          lastX += (nx - lastX) * 0.06;
          lastY += (ny - lastY) * 0.06;

          document.documentElement.style.setProperty('--mac-parallax-x', `${lastX}px`);
          document.documentElement.style.setProperty('--mac-parallax-y', `${lastY}px`);
          raf = null;
        });
      }, { passive: true });
    } catch (e) { /* fail silently */ }
  }


  /* ════════════════════════════════════════
     D. BUTTON RIPPLE — iOS/macOS tap effect
     Paints a radial ripple on click origin
     ════════════════════════════════════════ */
  function initRipple() {
    try {
      const rippleTargets = document.querySelectorAll(
        '.primary-btn, .secondary-btn, .cat-tab, .type-tab, .btn-lookup'
      );

      rippleTargets.forEach(btn => {
        btn.addEventListener('pointerdown', spawnRipple, { passive: true });
      });

      function spawnRipple(e) {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top  - size / 2;

        const ripple = document.createElement('span');
        Object.assign(ripple.style, {
          position:     'absolute',
          width:        `${size}px`,
          height:       `${size}px`,
          top:          `${y}px`,
          left:         `${x}px`,
          borderRadius: '50%',
          background:   'rgba(255,255,255,0.28)',
          transform:    'scale(0)',
          animation:    'mac-ripple-expand 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
          pointerEvents:'none',
          zIndex:       '1',
        });

        /* Inject ripple keyframe once */
        if (!document.getElementById('mac-ripple-style')) {
          const s = document.createElement('style');
          s.id = 'mac-ripple-style';
          s.textContent = `
            @keyframes mac-ripple-expand {
              to { transform: scale(1); opacity: 0; }
            }
          `;
          document.head.appendChild(s);
        }

        btn.style.overflow = 'hidden';
        btn.style.position = btn.style.position || 'relative';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 520);
      }
    } catch (e) { /* fail silently */ }
  }


  /* ════════════════════════════════════════
     E. RESIZE GUARD — prevent layout thrash
     Debounced resize handler, no body resize
     ════════════════════════════════════════ */
  function initResizeGuard() {
    try {
      let resizeTimer = null;

      window.addEventListener('resize', () => {
        /* Freeze animations during resize (prevents jank) */
        document.documentElement.classList.add('mac-resizing');
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          document.documentElement.classList.remove('mac-resizing');
        }, 180);
      }, { passive: true });

      /* Inject style once */
      if (!document.getElementById('mac-resize-style')) {
        const s = document.createElement('style');
        s.id = 'mac-resize-style';
        s.textContent = `
          .mac-resizing *,
          .mac-resizing *::before,
          .mac-resizing *::after {
            animation-play-state: paused !important;
            transition: none !important;
          }
        `;
        document.head.appendChild(s);
      }
    } catch (e) { /* fail silently */ }
  }


  /* ════════════════════════════════════════
     F. NETWORK FAIL SAFETY
     Detect offline and show calm indicator
     (decorative only — no re-fetch logic)
     ════════════════════════════════════════ */
  function initNetworkIndicator() {
    try {
      const style = document.createElement('style');
      style.textContent = `
        #mac-offline-banner {
          position: fixed;
          top: max(12px, env(safe-area-inset-top));
          left: 50%; transform: translateX(-50%) translateY(-80px);
          background: rgba(40,40,44,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: white;
          padding: 10px 20px;
          border-radius: 100px;
          font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          z-index: 99999;
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1);
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 8px 28px rgba(0,0,0,0.18);
          border: 0.5px solid rgba(255,255,255,0.12);
        }
        #mac-offline-banner.visible {
          transform: translateX(-50%) translateY(0);
        }
      `;
      document.head.appendChild(style);

      const banner = document.createElement('div');
      banner.id = 'mac-offline-banner';
      banner.textContent = '⚠︎ No Internet Connection';
      document.body.appendChild(banner);

      window.addEventListener('offline', () => {
        banner.classList.add('visible');
      });
      window.addEventListener('online', () => {
        banner.textContent = '✓ Back Online';
        setTimeout(() => banner.classList.remove('visible'), 2000);
      });

      if (!navigator.onLine) banner.classList.add('visible');
    } catch (e) { /* fail silently */ }
  }


  /* ════════════════════════════════════════
     G. VISIBILITY CHANGE — pause heavy effects
     Saves CPU/GPU when tab is hidden
     ════════════════════════════════════════ */
  function initVisibilityPause() {
    try {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          document.documentElement.classList.add('mac-tab-hidden');
        } else {
          document.documentElement.classList.remove('mac-tab-hidden');
        }
      });

      if (!document.getElementById('mac-visibility-style')) {
        const s = document.createElement('style');
        s.id = 'mac-visibility-style';
        s.textContent = `
          .mac-tab-hidden * {
            animation-play-state: paused !important;
          }
        `;
        document.head.appendChild(s);
      }
    } catch (e) { /* fail silently */ }
  }


  /* ════════════════════════════════════════
     H. PARALLAX CSS VARS — apply to ::before
     Only if parallax is active
     ════════════════════════════════════════ */
  function applyParallaxCSS() {
    if (prefersReduced || isTouchDevice) return;
    try {
      const s = document.createElement('style');
      s.textContent = `
        .main::before,
        .content::before {
          transform: translate(var(--mac-parallax-x, 0px), var(--mac-parallax-y, 0px)) scale(1.04);
          transition: transform 0.12s linear;
        }
      `;
      document.head.appendChild(s);
    } catch (e) { /* fail silently */ }
  }


  /* ════════════════════════════════════════
     INIT — delayed to avoid race with existing scripts
     ════════════════════════════════════════ */
  function init() {
    initScrollReveal();
    initCardTilt();
    initParallax();
    applyParallaxCSS();
    initRipple();
    initResizeGuard();
    initNetworkIndicator();
    initVisibilityPause();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, INIT_DELAY));
  } else {
    setTimeout(init, INIT_DELAY);
  }

})(); /* end MacEffects IIFE */
