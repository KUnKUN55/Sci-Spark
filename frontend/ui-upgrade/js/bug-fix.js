/**
 * 🛡️ BUG-FIX.JS — Safety, Stability & Micro-Polish
 * ═══════════════════════════════════════════════════
 * Fixes: overflow-x, resize animation freeze, iOS Safari viewport,
 *        double-submit guard, network fail banner, empty state,
 *        ripple effect, scroll jump, iOS input zoom prevention.
 * 100% additive — zero logic change. Removable is instant.
 * ═══════════════════════════════════════════════════
 */
(function () {
  'use strict';

  /* ════════════════════════════════════════════
     1. OVERFLOW-X GUARD
        Prevents horizontal scroll jail
     ════════════════════════════════════════════ */
  try {
    const s = document.createElement('style');
    s.id = 'up-overflow-fix';
    s.textContent = `
      html, body {
        overflow-x: hidden !important;
        max-width: 100vw !important;
      }
      img, video, iframe, table, pre {
        max-width: 100% !important;
      }
    `;
    document.head.appendChild(s);
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     2. iOS SAFARI VIEWPORT FIX
        Sets --vh to real viewport, updates on resize
     ════════════════════════════════════════════ */
  try {
    function setVH() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setVH();
    window.addEventListener('resize', setVH, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(setVH, 250), { passive: true });

    /* Apply to full-height layouts */
    const s2 = document.createElement('style');
    s2.id = 'up-vh-fix';
    s2.textContent = `
      body, .main, .content, .sidebar, .login-overlay {
        min-height: calc(var(--vh, 1vh) * 100) !important;
      }
    `;
    document.head.appendChild(s2);
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     3. iOS INPUT ZOOM PREVENTION
        Ensures font-size ≥ 16px on all inputs
     ════════════════════════════════════════════ */
  try {
    const iosZoomFix = document.createElement('style');
    iosZoomFix.id = 'up-ios-zoom-fix';
    iosZoomFix.textContent = `
      @media (max-width: 768px) {
        input, select, textarea, button {
          font-size: max(16px, 1em) !important;
        }
      }
    `;
    document.head.appendChild(iosZoomFix);
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     4. RESIZE ANIMATION FREEZE
        Prevents layout flash during window resize
     ════════════════════════════════════════════ */
  try {
    let resizeTimer;
    const freezeClass = 'up-resize-freeze';

    if (!document.getElementById('up-freeze-style')) {
      const s = document.createElement('style');
      s.id = 'up-freeze-style';
      s.textContent = `.${freezeClass} *, .${freezeClass} *::before, .${freezeClass} *::after { animation-play-state: paused !important; transition: none !important; }`;
      document.head.appendChild(s);
    }

    window.addEventListener('resize', () => {
      document.body.classList.add(freezeClass);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => document.body.classList.remove(freezeClass), 280);
    }, { passive: true });
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     5. BUTTON RIPPLE EFFECT
        Delegated on pointerdown — works on any button
     ════════════════════════════════════════════ */
  try {
    if (!document.getElementById('up-ripple-style')) {
      const rs = document.createElement('style');
      rs.id = 'up-ripple-style';
      rs.textContent = `
        .up-ripple-host { position: relative !important; overflow: hidden !important; }
        @keyframes up-ripple-anim {
          to { transform: scale(4); opacity: 0; }
        }
        .up-ripple-wave {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: up-ripple-anim 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
          pointer-events: none;
        }
      `;
      document.head.appendChild(rs);
    }

    document.addEventListener('pointerdown', function (e) {
      const btn = e.target.closest('button, [role="button"], .cat-tab, .type-tab, .nav-item');
      if (!btn) return;
      btn.classList.add('up-ripple-host');

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.4;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top  - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'up-ripple-wave';

      /* Color based on btn type */
      const isDark = window.getComputedStyle(btn).color === 'rgb(255, 255, 255)' ||
                     btn.classList.contains('active');
      ripple.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${x}px; top: ${y}px;
        background: ${isDark ? 'rgba(255,255,255,0.25)' : 'rgba(10,132,255,0.12)'};
      `;

      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }, { passive: true });
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     6. DOUBLE-SUBMIT GUARD
        Disables forms for 1s after submit
     ════════════════════════════════════════════ */
  try {
    document.addEventListener('submit', function (e) {
      const form = e.target;
      if (form._upGuarded) { e.preventDefault(); return; }
      form._upGuarded = true;

      const buttons = form.querySelectorAll('button[type="submit"], button:not([type])');
      buttons.forEach(b => {
        b.disabled = true;
        b.style.opacity = '0.65';
        b.style.cursor = 'not-allowed';
      });

      setTimeout(() => {
        form._upGuarded = false;
        buttons.forEach(b => {
          b.disabled = false;
          b.style.opacity = '';
          b.style.cursor = '';
        });
      }, 1500);
    }, true);
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     7. NETWORK STATUS BANNER
        Shows frosted pill on offline/online change
     ════════════════════════════════════════════ */
  try {
    let netBanner = null;
    let hideTimer;

    function showBanner(msg, color, duration) {
      if (!netBanner) {
        netBanner = document.createElement('div');
        netBanner.id = 'up-net-banner';
        Object.assign(netBanner.style, {
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%) translateY(80px)',
          zIndex: '99999',
          background: 'rgba(13,17,23,0.92)',
          color: 'white',
          backdropFilter: 'blur(40px)',
          webkitBackdropFilter: 'blur(40px)',
          borderRadius: '100px',
          padding: '12px 24px',
          fontSize: '0.875rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          fontWeight: '480',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          border: '0.5px solid rgba(255,255,255,0.08)',
          transition: 'transform 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.38s ease',
          opacity: '0',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        });
        document.body.appendChild(netBanner);
      }

      netBanner.textContent = msg;
      netBanner.style.borderColor = color;

      /* Show */
      requestAnimationFrame(() => {
        netBanner.style.transform = 'translateX(-50%) translateY(0)';
        netBanner.style.opacity = '1';
      });

      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        netBanner.style.transform = 'translateX(-50%) translateY(80px)';
        netBanner.style.opacity = '0';
      }, duration || 3000);
    }

    window.addEventListener('offline', () => {
      showBanner('⚠️  ไม่มีการเชื่อมต่ออินเทอร์เน็ต', 'rgba(255,59,92,0.35)', 5000);
    });

    window.addEventListener('online', () => {
      showBanner('✅  กลับมาออนไลน์แล้ว', 'rgba(50,215,75,0.35)', 2500);
    });
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     8. EMPTY STATE POLISH
        Injects beautiful empty state if no items
     ════════════════════════════════════════════ */
  try {
    function checkEmpty(grid) {
      if (!grid) return;
      const text = (grid.textContent || '').trim();
      const hasRealChildren = grid.querySelector('.card, .admin-card, tr, li');
      const isEmpty = !hasRealChildren && (text === '' || text === 'Loading...');

      if (isEmpty && !grid.dataset.upEmpty) {
        grid.dataset.upEmpty = 'true';
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
        grid.style.alignItems = 'center';
        grid.style.justifyContent = 'center';
        grid.style.padding = '60px 24px';
        grid.style.gap = '14px';
        grid.style.background = 'rgba(255,255,255,0.28)';
        grid.style.borderRadius = '20px';
        grid.style.border = '0.5px solid rgba(255,255,255,0.52)';
        grid.style.backdropFilter = 'blur(24px)';
        grid.style.minHeight = '180px';
        grid.innerHTML = `
          <div style="font-size:2.5em;opacity:0.35;filter:grayscale(0.5)">🔬</div>
          <div style="font-size:0.9rem;color:rgba(100,116,139,0.65);font-family:-apple-system,system-ui,sans-serif;font-weight:480;text-align:center;">
            ไม่มีข้อมูลในขณะนี้
          </div>
        `;
      } else if (!isEmpty) {
        grid.dataset.upEmpty = '';
        grid.style.display = '';
        grid.style.flexDirection = '';
        grid.style.alignItems = '';
        grid.style.justifyContent = '';
        grid.style.padding = '';
        grid.style.gap = '';
        grid.style.background = '';
        grid.style.borderRadius = '';
        grid.style.border = '';
        grid.style.backdropFilter = '';
        grid.style.minHeight = '';
      }
    }

    const targetGrids = document.querySelectorAll('#mat-grid, #resource-grid, .grid');
    const mutObs = new MutationObserver(() => {
      document.querySelectorAll('#mat-grid, #resource-grid, .grid').forEach(checkEmpty);
    });

    mutObs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      document.querySelectorAll('#mat-grid, #resource-grid, .grid').forEach(checkEmpty);
    }, 1000);
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     9. SCROLL JUMP PREVENTION
        Saves scroll position on reload
     ════════════════════════════════════════════ */
  try {
    const ms = document.querySelector('.main, .content');
    if (ms) {
      const KEY = `up-scroll-${location.pathname}`;
      const saved = sessionStorage.getItem(KEY);
      if (saved) ms.scrollTop = parseInt(saved, 10);

      ms.addEventListener('scroll', function () {
        sessionStorage.setItem(KEY, this.scrollTop);
      }, { passive: true });
    }
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     10. SMOOTH LOADING STATE
         Shimmer on images not yet loaded
     ════════════════════════════════════════════ */
  try {
    if (!document.getElementById('up-img-shimmer')) {
      const s = document.createElement('style');
      s.id = 'up-img-shimmer';
      s.textContent = `
        img:not([src]) {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.30) 25%,
            rgba(255,255,255,0.55) 50%,
            rgba(255,255,255,0.30) 75%
          );
          background-size: 400% 100%;
          animation: up-skeleton 1.6s ease-in-out infinite;
          border-radius: 10px;
        }
      `;
      document.head.appendChild(s);
    }
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     11. FOCUS TRAP (a11y) — for modals
     ════════════════════════════════════════════ */
  try {
    document.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const modal = document.querySelector('.modal:not(.hidden), .login-box');
      if (!modal) return;

      const focusables = modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  } catch (e) { /* silent */ }


  /* ════════════════════════════════════════════
     12. CONSOLE SIGNATURE
     ════════════════════════════════════════════ */
  try {
    console.info(
      '%c🌌 Sci-Spark UI-Upgrade v2.0',
      'background:linear-gradient(90deg,#0A84FF,#5AC8FA);color:white;padding:4px 12px;border-radius:100px;font-family:-apple-system,system-ui;font-weight:600;font-size:12px;'
    );
  } catch (e) { /* silent */ }

})();
