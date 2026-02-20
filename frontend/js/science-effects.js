/* ═══════════════════════════════════════════════════════════════════
   🍎🔬 SCIENCE EFFECTS — science-effects.js v4.0
   ═══════════════════════════════════════════════════════════════════
   
   ✅ Pure decoration — no business logic
   ✅ Uses IIFE — no global scope pollution
   ✅ Respects prefers-reduced-motion
   ✅ Stable — no z-index or pointer-events conflicts
   
   Systems:
   1. Particle network — calm, molecule-like
   2. Scroll reveal — IntersectionObserver, staggered
   3. Card tilt — subtle 3D perspective
   4. Mouse parallax — gentle background shift
   ═══════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // Respect user preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ═══════════════════════════════════════
  // 1. PARTICLE NETWORK
  // Soft molecule-like floating dots
  // ═══════════════════════════════════════
  
  function initParticles() {
    var canvas = document.createElement('canvas');
    canvas.id = 'sci-particles';
    document.body.insertBefore(canvas, document.body.firstChild);
    
    var ctx = canvas.getContext('2d');
    var particles = [];
    var raf;
    // Fewer particles on mobile for performance
    var COUNT = window.innerWidth < 768 ? 18 : 38;
    var CONNECT = 130;
    
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    function mkParticle() {
      return {
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r:  Math.random() * 2 + 0.8,
        opacity: Math.random() * 0.3 + 0.08,
        // Calm science palette: blue, cyan, violet
        color: [
          '59,139,255',
          '0,192,232',
          '124,111,240',
          '16,185,129'
        ][Math.floor(Math.random() * 4)]
      };
    }
    
    function init() {
      resize();
      particles = [];
      for (var i = 0; i < COUNT; i++) particles.push(mkParticle());
    }
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections first
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT) {
            var o = (1 - d / CONNECT) * 0.1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(59,139,255,' + o + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      
      // Draw particles
      for (var k = 0; k < particles.length; k++) {
        var p = particles[k];
        
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < -10) p.x = canvas.width  + 10;
        if (p.x > canvas.width  + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
        
        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color + ',' + p.opacity + ')';
        ctx.fill();
        
        // Soft halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.color + ',' + (p.opacity * 0.12) + ')';
        ctx.fill();
      }
      
      raf = requestAnimationFrame(draw);
    }
    
    // Resize debounced
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 250);
    });
    
    // Pause when tab hidden to save CPU
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { draw(); }
    });
    
    init();
    draw();
  }
  

  // ═══════════════════════════════════════
  // 2. SCROLL REVEAL
  // IntersectionObserver — adds .revealed
  // ═══════════════════════════════════════
  
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    
    // Auto-mark cards
    var cards = document.querySelectorAll('.card, .admin-card, .score-card, .stat-card');
    cards.forEach(function(card, i) {
      if (!card.hasAttribute('data-animate')) {
        card.setAttribute('data-animate', '');
        card.setAttribute('data-delay', String((i % 4) + 1));
      }
    });
    
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    
    document.querySelectorAll('[data-animate]').forEach(function(el) {
      obs.observe(el);
    });
  }
  

  // ═══════════════════════════════════════
  // 3. CARD TILT — Gentle 3D perspective
  // Max 3deg — calm, Apple-like
  // ═══════════════════════════════════════
  
  function initCardTilt() {
    var cards = document.querySelectorAll('.card');
    
    cards.forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var cx = rect.width  / 2;
        var cy = rect.height / 2;
        
        // Max ±3 degrees — subtle
        var rx = ((y - cy) / cy) * -3;
        var ry = ((x - cx) / cx) *  3;
        
        card.style.transform = [
          'translateY(-5px)',
          'perspective(700px)',
          'rotateX(' + rx + 'deg)',
          'rotateY(' + ry + 'deg)'
        ].join(' ');
        
        // Light reflection follows cursor
        var px = (x / rect.width  * 100).toFixed(1);
        var py = (y / rect.height * 100).toFixed(1);
        card.style.setProperty('--light-x', px + '%');
        card.style.setProperty('--light-y', py + '%');
      });
      
      card.addEventListener('mouseleave', function() {
        card.style.transform = '';
        card.style.removeProperty('--light-x');
        card.style.removeProperty('--light-y');
      });
    });
  }
  

  // ═══════════════════════════════════════
  // 4. PARALLAX — Gentle background shift
  // ═══════════════════════════════════════
  
  function initParallax() {
    if (window.innerWidth < 768) return; // Desktop only
    
    var ticking = false;
    
    window.addEventListener('mousemove', function(e) {
      if (!ticking) {
        requestAnimationFrame(function() {
          var x = ((e.clientX / window.innerWidth)  - 0.5) * 15;
          var y = ((e.clientY / window.innerHeight) - 0.5) * 15;
          document.body.style.setProperty('--px', x + 'px');
          document.body.style.setProperty('--py', y + 'px');
          
          // Apply to orbs via custom properties used in CSS
          var before = document.querySelector('#sci-particles');
          if (before) {
            before.style.transform = 'translate(calc(var(--px, 0) * 0.3), calc(var(--py, 0) * 0.3))';
          }
          
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  

  // ═══════════════════════════════════════
  // INIT — All systems with safety delay
  // ═══════════════════════════════════════
  
  function boot() {
    try { initParticles(); } catch(e) {}
    try { initScrollReveal(); } catch(e) {}
    
    // Only tilt on desktop
    if (window.innerWidth >= 768) {
      try { initCardTilt(); } catch(e) {}
      try { initParallax(); } catch(e) {}
    }
  }
  
  // 150ms delay: runs after existing scripts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(boot, 150);
    });
  } else {
    setTimeout(boot, 150);
  }

})();
