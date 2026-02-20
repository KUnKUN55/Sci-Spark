/**
 * Ambient Effects — Aurora Dark Theme v2
 * Floating particles + mouse glow
 * (Card animations handled by CSS, no pausing)
 */

(function() {
  'use strict';

  // ========================================
  // AURORA PARTICLE CANVAS
  // ========================================
  const canvas = document.createElement('canvas');
  canvas.id = 'aurora-canvas';
  canvas.style.cssText =
    'position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0.6;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;
  const particles = [];
  const PARTICLE_COUNT = 35;

  const COLORS = [
    'rgba(6,214,160,',
    'rgba(123,97,255,',
    'rgba(255,107,157,',
    'rgba(0,194,255,',
    'rgba(255,217,61,'
  ];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeP() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.5 + 0.8,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.15,
      ad: (Math.random() - 0.5) * 0.005,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
  }

  function initP() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(makeP());
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.dx;
      p.y += p.dy;
      p.a += p.ad;
      if (p.a > 0.65 || p.a < 0.1) p.ad *= -1;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      ctx.globalAlpha = p.a * 0.25;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = p.c + '0.3)';
      ctx.fill();

      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c + '0.8)';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  // ========================================
  // MOUSE GLOW (Desktop only)
  // ========================================
  function initGlow() {
    if (window.innerWidth < 768) return;
    var g = document.createElement('div');
    g.style.cssText =
      'position:fixed;width:300px;height:300px;' +
      'background:radial-gradient(circle,rgba(123,97,255,0.06) 0%,transparent 70%);' +
      'border-radius:50%;pointer-events:none;z-index:2;' +
      'transform:translate(-50%,-50%);transition:opacity 0.3s;opacity:0;';
    document.body.appendChild(g);
    document.addEventListener('mousemove', function(e) {
      g.style.left = e.clientX + 'px';
      g.style.top = e.clientY + 'px';
      g.style.opacity = '1';
    });
    document.addEventListener('mouseleave', function() {
      g.style.opacity = '0';
    });
  }

  // ========================================
  // INIT
  // ========================================
  function init() {
    resize();
    initP();
    draw();
    initGlow();
    window.addEventListener('resize', function() { resize(); initP(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
