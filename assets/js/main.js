/* aef realty — global behaviour */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* page enter */
  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('ready');
  });

  /* page-leave fade on internal links */
  if (!reduced) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (a.target === '_blank' || e.metaKey || e.ctrlKey) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(function () { window.location.href = href; }, 320);
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) document.body.classList.remove('leaving');
    });
  }

  /* header: solid on scroll, hide on scroll down */
  var header = document.querySelector('header.site');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('solid', y > 60);
      if (y > 260 && y > lastY && !document.body.classList.contains('menu-open')) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }

  /* staggered menu items */
  document.querySelectorAll('.mobile-menu a.mm').forEach(function (a, i) {
    a.style.transitionDelay = (0.05 + i * 0.045) + 's';
  });

  /* reveals */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el, i) {
    var d = el.getAttribute('data-reveal');
    if (d) el.style.transitionDelay = d + 'ms';
    io.observe(el);
  });

  /* counters */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var dur = 1600;
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = target % 1 === 0 ? String(Math.round(val)).padStart(2, '0') : val.toFixed(1);
      if (p < 1) requestAnimationFrame(step);
    }
    if (reduced) {
      el.textContent = target % 1 === 0 ? String(target).padStart(2, '0') : target;
    } else {
      requestAnimationFrame(step);
    }
  }
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        animateCount(en.target);
        cio.unobserve(en.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  /* hero slider */
  var slider = document.querySelector('.hero-slider');
  if (slider) {
    var slides = slider.querySelectorAll('.slide');
    var dots = slider.querySelectorAll('.dots button');
    var count = slider.querySelector('.hero-count');
    var SLIDE_MS = 8000;
    slider.style.setProperty('--slide-ms', SLIDE_MS + 'ms');
    var idx = 0;
    var timer = null;
    function go(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      dots.forEach(function (d, i) {
        d.classList.remove('on');
        if (i === idx) {
          void d.offsetWidth; /* restart fill animation */
          d.classList.add('on');
        }
      });
      if (count) count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (!reduced) timer = setTimeout(function () { go(idx + 1); }, SLIDE_MS);
    }
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    /* click on the image advances to the next city immediately */
    slider.addEventListener('click', function (e) {
      if (e.target.closest('a, button, .dots, .hero-ui')) return;
      go(idx + 1);
    });
    go(0);
  }

  /* parallax on hero media — base scale applied at load (no jump), zoom grows gently with scroll */
  if (!reduced) {
    var pm = document.querySelectorAll('.page-hero .media');
    if (pm.length) {
      var heroParallax = function () {
        var y = window.scrollY;
        var s = 1.06 + Math.min(y * 0.00008, 0.05);
        pm.forEach(function (m) { m.style.transform = 'translateY(' + y * 0.18 + 'px) scale(' + s.toFixed(4) + ')'; });
      };
      window.addEventListener('scroll', heroParallax, { passive: true });
      heroParallax();
    }
  }

  /* portfolio filters */
  var filterBar = document.querySelector('.filters');
  if (filterBar) {
    var cards = document.querySelectorAll('.grid-port .card');
    filterBar.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        filterBar.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var f = b.getAttribute('data-filter');
        cards.forEach(function (c) {
          var show = f === 'all' || (c.getAttribute('data-cat') || '').indexOf(f) !== -1;
          c.classList.toggle('hide', !show);
        });
      });
    });
  }

  /* active nav item */
  var path = window.location.pathname;
  document.querySelectorAll('nav.main a.top').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href !== '/' && path.indexOf(href) === 0) a.classList.add('active');
    if (href === '/' && (path === '/' || path === '/index.html')) a.classList.add('active');
  });
})();
