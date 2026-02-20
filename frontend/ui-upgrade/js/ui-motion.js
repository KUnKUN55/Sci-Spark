/**
 * 🌌 UI-MOTION.JS — World-Class Particle Canvas + Motion Effects
 * ═══════════════════════════════════════════════════════════════
 * Features: Canvas particle network, scroll reveal, 3D card tilt,
 *           mouse parallax, cursor glow, adaptive scroll-blur header.
 * ZERO FRAMEWORK. ZERO LOGIC TOUCH. Wrapped in try/catch.
 * Removable: delete file + script tag.
 * ═══════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  /* ── Config ── */
  const CFG = {
    particles: {
      count:       window.innerWidth > 1024 ? 52 : window.innerWidth > 768 ? 30 : 0,
      radius:      { min: 1.2, max: 2.8 },
      speed:       { min: 0.12, max: 0.45 },
      connectDist: 120,
      colors:      ['#0A84FF', '#5AC8FA', '#BF5AF2', '#30D5C8', '#32D74B'],
      alpha:       { base: 0.32, line: 0.12 },
    },
    tilt:      { maxDeg: 3.0, perspective: 900, resetMs: 400 },
    parallax:  { depth: 0.025 },
    reveal:    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    cursor:    { size: 320, alpha: 0.06 },
    scrollBlur:{ max: 28 },
    waves:     { count: 3 },
  };

  const isTouchDevice = 'ontouchstart' in window;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ════════════════════════════════════════════
     UTIL — rAF throttle
     ════════════════════════════════════════════ */
  function throttleRAF(fn) {
    let pending = false;
    return function (...args) {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { fn.apply(this, args); pending = false; });
    };
  }

  /* ════════════════════════════════════════════
     1. PARTICLE NETWORK — Canvas floating dots
     ════════════════════════════════════════════ */
  function initParticles() {
    if (isReducedMotion || CFG.particles.count === 0) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.id = 'up-particles';
      Object.assign(canvas.style, {
        position: 'fixed',
        top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: '1',
      });
      document.body.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      let W, H, particles = [];
      let mouse = { x: -999, y: -999 };
      let animId;

      function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });

      /* Particle class */
      function Particle() {
        this.reset();
      }
      Particle.prototype.reset = function () {
        this.x  = Math.random() * W;
        this.y  = Math.random() * H;
        this.r  = CFG.particles.radius.min + Math.random() * (CFG.particles.radius.max - CFG.particles.radius.min);
        this.vx = (Math.random() - 0.5) * CFG.particles.speed.max * 2;
        this.vy = (Math.random() - 0.5) * CFG.particles.speed.max * 2;
        this.color = CFG.particles.colors[Math.floor(Math.random() * CFG.particles.colors.length)];
        this.a  = CFG.particles.alpha.base * (0.5 + Math.random() * 0.5);
      };
      Particle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) this.reset();
      };
      Particle.prototype.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.a;
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      /* Init particles */
      for (let i = 0; i < CFG.particles.count; i++) {
        particles.push(new Particle());
      }

      /* Draw lines */
      function drawLines() {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CFG.particles.connectDist) {
              const a = CFG.particles.alpha.line * (1 - dist / CFG.particles.connectDist);
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = particles[i].color;
              ctx.globalAlpha = a;
              ctx.lineWidth = 0.8;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
          /* Mouse connection */
          const mdx = particles[i].x - mouse.x;
          const mdy = particles[i].y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 160) {
            const ma = 0.18 * (1 - mdist / 160);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = '#0A84FF';
            ctx.globalAlpha = ma;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      /* Animation loop */
      function loop() {
        animId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        drawLines();
      }
      loop();

      /* Mouse tracking */
      if (!isTouchDevice) {
        window.addEventListener('mousemove', throttleRAF(e => {
          mouse.x = e.clientX;
          mouse.y = e.clientY;
        }), { passive: true });
      }

      /* Pause when tab hidden */
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(animId);
          canvas.style.display = 'none';
        } else {
          canvas.style.display = '';
          loop();
        }
      });

      /* Pause on resize */
      let resizePause;
      window.addEventListener('resize', () => {
        cancelAnimationFrame(animId);
        clearTimeout(resizePause);
        resizePause = setTimeout(loop, 200);
      }, { passive: true });

    } catch (e) { /* silent */ }
  }


  /* ════════════════════════════════════════════
     2. SCROLL REVEAL — IntersectionObserver
     ════════════════════════════════════════════ */
  function initScrollReveal() {
    if (isReducedMotion) return;
    try {
      const revealClass = 'up-reveal';
      const revealDone  = 'up-revealed';

      /* Add base CSS once */
      if (!document.getElementById('up-reveal-style')) {
        const s = document.createElement('style');
        s.id = 'up-reveal-style';
        s.textContent = `
          .${revealClass} {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(4px);
            transition:
              opacity 0.55s cubic-bezier(0.22,1,0.36,1),
              transform 0.55s cubic-bezier(0.22,1,0.36,1),
              filter 0.55s cubic-bezier(0.22,1,0.36,1);
            will-change: transform, opacity;
          }
          .${revealClass}.${revealDone} {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        `;
        document.head.appendChild(s);
      }

      const observer = new IntersectionObserver(entries => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            setTimeout(() => {
              el.classList.add(revealDone);
            }, Math.min(idx * 60, 240));
            observer.unobserve(el);
          }
        });
      }, {
        threshold: CFG.reveal.threshold,
        rootMargin: CFG.reveal.rootMargin,
      });

      /* Observe post-render */
      function observeElements() {
        const targets = document.querySelectorAll(
          '.card:not(.up-reveal), .admin-card:not(.up-reveal), ' +
          '.score-card:not(.up-reveal), .stat-card:not(.up-reveal), ' +
          '.result-card:not(.up-reveal), .exam-paper:not(.up-reveal), ' +
          '.question-box:not(.up-reveal)'
        );
        targets.forEach(el => {
          el.classList.add(revealClass);
          observer.observe(el);
        });
      }

      /* Observe once DOM stable */
      if (document.readyState === 'complete') {
        setTimeout(observeElements, 500);
      } else {
        window.addEventListener('load', () => setTimeout(observeElements, 300));
      }

      /* Re-observe on dynamic content (mutation) */
      const mutObs = new MutationObserver(throttleRAF(() => {
        setTimeout(observeElements, 200);
      }));
      mutObs.observe(document.body, { childList: true, subtree: true });

    } catch (e) { /* silent */ }
  }


  /* ════════════════════════════════════════════
     3. 3D CARD TILT — rAF-throttled, touch-off
     ════════════════════════════════════════════ */
  function initCardTilt() {
    if (isReducedMotion || isTouchDevice) return;
    try {
      function applyTilt(card, e) {
        const rect = card.getBoundingClientRect();
        const cx   = rect.left + rect.width / 2;
        const cy   = rect.top  + rect.height / 2;
        const rx   = ((e.clientY - cy) / (rect.height / 2)) * CFG.tilt.maxDeg;
        const ry   = ((e.clientX - cx) / (rect.width  / 2)) * CFG.tilt.maxDeg;
        card.style.transform   = `perspective(${CFG.tilt.perspective}px) rotateX(${-rx}deg) rotateY(${ry}deg) translateZ(6px)`;
        card.style.transition  = 'transform 0.12s ease';
      }

      function resetTilt(card) {
        card.style.transition  = `transform ${CFG.tilt.resetMs}ms cubic-bezier(0.22,1,0.36,1)`;
        card.style.transform   = '';
      }

      function attach(selector) {
        document.querySelectorAll(selector).forEach(card => {
          const handler = throttleRAF(e => applyTilt(card, e));
          card.addEventListener('mousemove', handler, { passive: true });
          card.addEventListener('mouseleave', () => resetTilt(card), { passive: true });
        });
      }

      if (document.readyState === 'complete') {
        attach('.card:not([data-no-tilt]), .admin-card');
      } else {
        window.addEventListener('load', () => attach('.card:not([data-no-tilt]), .admin-card'));
      }
    } catch (e) { /* silent */ }
  }


  /* ════════════════════════════════════════════
     4. MOUSE PARALLAX — background orbs
     ════════════════════════════════════════════ */
  function initParallax() {
    if (isReducedMotion || isTouchDevice) return;
    try {
      let lx = 0, ly = 0;
      const LERP = 0.06;

      function frame() {
        requestAnimationFrame(frame);
        lx += (window._upMx - lx) * LERP;
        ly += (window._upMy - ly) * LERP;
        document.body.style.setProperty('--up-px', `${lx.toFixed(2)}px`);
        document.body.style.setProperty('--up-py', `${ly.toFixed(2)}px`);
      }

      window._upMx = 0; window._upMy = 0;
      window.addEventListener('mousemove', e => {
        const nx = (e.clientX / window.innerWidth  - 0.5) * 28;
        const ny = (e.clientY / window.innerHeight - 0.5) * 18;
        window._upMx = nx;
        window._upMy = ny;
      }, { passive: true });

      /* Apply parallax via CSS transform on body::before */
      if (!document.getElementById('up-parallax-style')) {
        const s = document.createElement('style');
        s.id = 'up-parallax-style';
        s.textContent = `
          body::before {
            transform: translate(var(--up-px, 0px), var(--up-py, 0px)) !important;
          }
        `;
        document.head.appendChild(s);
      }

      frame();
    } catch (e) { /* silent */ }
  }


  /* ════════════════════════════════════════════
     5. CURSOR GLOW — ambient light orb
     ════════════════════════════════════════════ */
  function initCursorGlow() {
    if (isReducedMotion || isTouchDevice) return;
    try {
      const glow = document.createElement('div');
      glow.id = 'up-cursor-glow';
      Object.assign(glow.style, {
        position: 'fixed',
        width: `${CFG.cursor.size}px`,
        height: `${CFG.cursor.size}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(10,132,255,${CFG.cursor.alpha}) 0%, transparent 70%)`,
        pointerEvents: 'none',
        zIndex: '1',
        transform: 'translate(-50%,-50%)',
        transition: 'opacity 0.3s ease',
        opacity: '0',
      });
      document.body.appendChild(glow);

      let gx = 0, gy = 0, glx = 0, gly = 0;
      const GLRP = 0.12;

      function frame() {
        requestAnimationFrame(frame);
        glx += (gx - glx) * GLRP;
        gly += (gy - gly) * GLRP;
        glow.style.left = `${glx}px`;
        glow.style.top  = `${gly}px`;
      }

      window.addEventListener('mousemove', e => {
        gx = e.clientX; gy = e.clientY;
        glow.style.opacity = '1';
      }, { passive: true });

      window.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });

      frame();
    } catch (e) { /* silent */ }
  }


  /* ════════════════════════════════════════════
     6. ADAPTIVE SCROLL-BLUR HEADER
     ════════════════════════════════════════════ */
  function initScrollBlurHeader() {
    if (isReducedMotion) return;
    try {
      const main = document.querySelector('.main, .content');
      if (!main) return;

      function onScroll() {
        const scrollPct = Math.min(main.scrollTop / 200, 1);
        const blur  = (scrollPct * CFG.scrollBlur.max).toFixed(1);
        const bg    = `rgba(${245 - scrollPct * 10},${248 - scrollPct * 12},${255},${0.55 + scrollPct * 0.30})`;
        const shadow = `0 1px 0 rgba(255,255,255,${0.40 + scrollPct * 0.30})`;

        const header = document.querySelector('.header');
        if (header) {
          header.style.backdropFilter = `blur(${blur}px) saturate(${160 + scrollPct * 60}%)`;
          header.style.webkitBackdropFilter = `blur(${blur}px) saturate(${160 + scrollPct * 60}%)`;
          header.style.background = bg;
          header.style.boxShadow = shadow;
        }
      }

      main.addEventListener('scroll', throttleRAF(onScroll), { passive: true });
    } catch (e) { /* silent */ }
  }


  /* ════════════════════════════════════════════
     7. SVG WAVE LINES (science bottom decoration)
     ════════════════════════════════════════════ */
  function initWaveLines() {
    if (isReducedMotion) return;
    try {
      if (!document.querySelector('.main, .content')) return;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'up-waves';
      Object.assign(svg.style, {
        position: 'fixed',
        bottom: '0', left: '0',
        width: '100vw', height: '200px',
        pointerEvents: 'none',
        zIndex: '1',
        opacity: '0.55',
      });
      svg.setAttribute('viewBox', '0 0 1440 200');
      svg.setAttribute('preserveAspectRatio', 'none');

      const colors = ['#0A84FF22', '#5AC8FA18', '#BF5AF215'];
      colors.forEach((color, i) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('d',
          `M0,${80 + i * 30}C240,${40 + i * 20} 480,${120 + i * 20} 720,${80 + i * 30}` +
          `S1200,${40 + i * 20} 1440,${80 + i * 30}`
        );

        /* Animate offset drift */
        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim.setAttribute('attributeName', 'transform');
        anim.setAttribute('type', 'translate');
        anim.setAttribute('from', '0 0');
        anim.setAttribute('to', `${-120 + i * 40} ${-10 + i * 8}`);
        anim.setAttribute('dur', `${22 + i * 8}s`);
        anim.setAttribute('repeatCount', 'indefinite');
        anim.setAttribute('additive', 'sum');
        const anim2 = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        anim2.setAttribute('attributeName', 'transform');
        anim2.setAttribute('type', 'translate');
        anim2.setAttribute('from', `${-120 + i * 40} ${-10 + i * 8}`);
        anim2.setAttribute('to', '0 0');
        anim2.setAttribute('dur', `${22 + i * 8}s`);
        anim2.setAttribute('repeatCount', 'indefinite');
        anim2.setAttribute('additive', 'sum');
        anim2.setAttribute('begin', `${(22 + i * 8) / 2}s`);

        path.appendChild(anim);
        svg.appendChild(path);
      });

      document.body.appendChild(svg);

      /* Pause when hidden */
      document.addEventListener('visibilitychange', () => {
        svg.style.display = document.hidden ? 'none' : '';
      });
    } catch (e) { /* silent */ }
  }


  /* ════════════════════════════════════════════
     BOOT — delayed after page interactive
     ════════════════════════════════════════════ */
  function boot() {
    setTimeout(() => {
      initParticles();
      initScrollReveal();
      initCardTilt();
      initParallax();
      initCursorGlow();
      initScrollBlurHeader();
      initWaveLines();
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
