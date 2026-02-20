/**
 * 🌌 MOTION-ENGINE.JS — World-Class Motion & Particle Physics
 * ═══════════════════════════════════════════════════════════════
 * IntersectionObserver scroll reveals, floating particles,
 * wave lines, parallax depth, card 3D perspective.
 *
 * ✅ Zero logic changes. All try/catch. Falls silent if error.
 * ✅ Respects prefers-reduced-motion
 * ✅ Removable: delete file + <script> tag
 * ═══════════════════════════════════════════════════════════════
 */
(function UltraMotionEngine() {
  'use strict';

  const INIT_DELAY = 250;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const isLowEnd       = isTouchDevice && (navigator.hardwareConcurrency <= 4);

  /* ═══════════════════════════════════════════
     A. SCROLL REVEAL — IntersectionObserver
     Elements fade/slide in as they enter view
     ═══════════════════════════════════════════ */
  function initScrollReveal() {
    if (prefersReduced) return;
    try {
      const targets = document.querySelectorAll(
        '.card, .admin-card, .score-card, .stat-card, .score-item-row, .exam-paper, .admin-card h3'
      );
      if (!targets.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0) scale(1)';
          el.style.filter = 'blur(0)';
          observer.unobserve(el);
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

      targets.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.85) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(18px) scale(0.98)';
          el.style.filter = 'blur(3px)';
          el.style.transition = `opacity 0.5s cubic-bezier(0.22,1,0.36,1),
                                  transform 0.5s cubic-bezier(0.22,1,0.36,1),
                                  filter 0.5s cubic-bezier(0.22,1,0.36,1)`;
          observer.observe(el);
        }
      });
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     B. FLOATING PARTICLES — Physics Dots
     Very subtle, drifting science particles
     ═══════════════════════════════════════════ */
  function initParticles() {
    if (prefersReduced || isLowEnd) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.id = 'ultra-particles';
      Object.assign(canvas.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: '0',
        opacity: '0.35',
      });
      document.body.insertBefore(canvas, document.body.firstChild);

      const ctx = canvas.getContext('2d');
      let w, h, particles = [], animId;
      const PARTICLE_COUNT = isTouchDevice ? 18 : 35;

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });

      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * w;
          this.y = Math.random() * h;
          this.size = Math.random() * 2.2 + 0.5;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.speedY = (Math.random() - 0.5) * 0.25 - 0.08;
          this.opacity = Math.random() * 0.4 + 0.1;
          this.hue = Math.random() > 0.5 ? 210 : 260;
        }
        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          if (this.x < -10 || this.x > w + 10 || this.y < -10 || this.y > h + 10) {
            this.reset();
            this.y = h + 5;
          }
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`;
          ctx.fill();
        }
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }

      /* Draw connections between nearby particles */
      function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(10,132,255,${0.06 * (1 - dist / 140)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      function animate() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });
        if (!isTouchDevice) drawConnections();
        animId = requestAnimationFrame(animate);
      }

      animate();

      /* Pause when hidden */
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(animId); }
        else { animate(); }
      });

    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     C. WAVE LINES — Abstract Science Waveform
     SVG wave overlay that drifts slowly
     ═══════════════════════════════════════════ */
  function initWaveLines() {
    if (prefersReduced || isTouchDevice) return;
    try {
      const wave = document.createElement('div');
      wave.id = 'ultra-wave';
      wave.innerHTML = `
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;width:200%;height:100%;">
          <path d="M0,50 C120,20 240,80 360,50 C480,20 600,80 720,50 C840,20 960,80 1080,50 C1200,20 1320,80 1440,50 C1560,20 1680,80 1800,50 C1920,20 2040,80 2160,50 C2280,20 2400,80 2520,50 C2640,20 2760,80 2880,50"
                fill="none" stroke="rgba(10,132,255,0.06)" stroke-width="1.5"/>
          <path d="M0,55 C130,30 260,75 390,55 C520,35 650,75 780,55 C910,35 1040,75 1170,55 C1300,35 1430,75 1560,55 C1690,35 1820,75 1950,55 C2080,35 2210,75 2340,55 C2470,35 2600,75 2730,55 C2860,35 2880,55 2880,55"
                fill="none" stroke="rgba(191,90,242,0.04)" stroke-width="1"/>
        </svg>
      `;
      Object.assign(wave.style, {
        position: 'fixed', bottom: '0', left: '0',
        width: '100%', height: '80px',
        pointerEvents: 'none', zIndex: '0',
        overflow: 'hidden', opacity: '0.7',
      });

      const svg = wave.querySelector('svg');
      svg.style.animation = 'ultra-wave 35s linear infinite';

      /* Inject keyframe */
      if (!document.getElementById('ultra-wave-kf')) {
        const s = document.createElement('style');
        s.id = 'ultra-wave-kf';
        s.textContent = `
          @keyframes ultra-wave { to { transform: translateX(-50%); } }
        `;
        document.head.appendChild(s);
      }

      document.body.insertBefore(wave, document.body.firstChild);
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     D. CARD 3D TILT — Perspective on Hover
     Max ±3°, GPU-only, rAF-throttled
     ═══════════════════════════════════════════ */
  function initCardTilt() {
    if (prefersReduced || isTouchDevice) return;
    try {
      const cards = document.querySelectorAll('.card, .admin-card');
      if (!cards.length) return;

      cards.forEach(card => {
        card.style.perspective = '800px';
        card.style.transformStyle = 'preserve-3d';

        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = (e.clientX - cx) / (rect.width / 2);
          const dy = (e.clientY - cy) / (rect.height / 2);
          const tiltX = -(dy * 3);
          const tiltY =  (dx * 3);

          requestAnimationFrame(() => {
            card.style.transform = `translateY(-4px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          });
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
          requestAnimationFrame(() => {
            card.style.transform = '';
            card.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
            setTimeout(() => { card.style.transition = ''; }, 400);
          });
        }, { passive: true });
      });
    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     E. PARALLAX DEPTH — Mouse-reactive
     Background depth layers react to cursor
     ═══════════════════════════════════════════ */
  function initParallax() {
    if (prefersReduced || isTouchDevice || isLowEnd) return;
    try {
      let px = 0, py = 0, tx = 0, ty = 0;
      const lerp = 0.04;

      function tick() {
        px += (tx - px) * lerp;
        py += (ty - py) * lerp;
        document.documentElement.style.setProperty('--ultra-px', `${px}px`);
        document.documentElement.style.setProperty('--ultra-py', `${py}px`);
        requestAnimationFrame(tick);
      }

      document.addEventListener('mousemove', (e) => {
        tx = (e.clientX / window.innerWidth  - 0.5) * 24;
        ty = (e.clientY / window.innerHeight - 0.5) * 16;
      }, { passive: true });

      tick();

      /* Apply parallax to body::before */
      const s = document.createElement('style');
      s.textContent = `
        body::before {
          transform: translate(var(--ultra-px, 0px), var(--ultra-py, 0px)) scale(1.05) !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(s);

    } catch (e) { /* silent */ }
  }


  /* ═══════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════ */
  function init() {
    initScrollReveal();
    initParticles();
    initWaveLines();
    initCardTilt();
    initParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, INIT_DELAY));
  } else {
    setTimeout(init, INIT_DELAY);
  }

})();
