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
    var SLIDE_MS = 4000;
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

  /* "write to" chooser: a mailto: link depends on the visitor's device having a mail app set up,
     which many people (Gmail-in-the-browser users above all) do not — so offer the ways explicitly */
  var mailtos = document.querySelectorAll('a[href^="mailto:"]');
  if (mailtos.length) {
    var pick = document.createElement('div');
    pick.className = 'mailpick';
    pick.setAttribute('role', 'dialog');
    pick.setAttribute('aria-modal', 'true');
    pick.setAttribute('aria-label', 'Write to the firm');
    pick.innerHTML =
      '<div class="mp-panel">' +
        '<button class="mp-close" type="button" aria-label="Close">&times;</button>' +
        '<div class="mp-eyebrow">write to the firm</div>' +
        '<div class="mp-addr"></div>' +
        '<div class="mp-opts">' +
          '<a class="mp-opt" data-mp="gmail" target="_blank" rel="noopener">Open in Gmail <span class="arr">→</span></a>' +
          '<a class="mp-opt" data-mp="outlook" target="_blank" rel="noopener">Open in Outlook <span class="arr">→</span></a>' +
          '<a class="mp-opt" data-mp="app">Use my mail app <span class="arr">→</span></a>' +
          '<button class="mp-opt" data-mp="copy" type="button"><span class="mp-copy-label">Copy the address</span> <span class="arr">⧉</span></button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(pick);
    var mpPanel = pick.querySelector('.mp-panel');
    mpPanel.setAttribute('tabindex', '-1');
    var mpAddr = pick.querySelector('.mp-addr');
    var mpGmail = pick.querySelector('[data-mp="gmail"]');
    var mpOutlook = pick.querySelector('[data-mp="outlook"]');
    var mpApp = pick.querySelector('[data-mp="app"]');
    var mpCopy = pick.querySelector('[data-mp="copy"]');
    var mpCopyLabel = pick.querySelector('.mp-copy-label');
    var mpLastFocus = null;
    var mpCurrent = '';

    function openPick(addr, subject) {
      var enc = encodeURIComponent;
      mpCurrent = addr;
      mpAddr.textContent = addr;
      mpGmail.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(addr) + (subject ? '&su=' + enc(subject) : '');
      mpOutlook.href = 'https://outlook.office.com/mail/deeplink/compose?to=' + enc(addr) + (subject ? '&subject=' + enc(subject) : '');
      mpApp.href = 'mailto:' + addr + (subject ? '?subject=' + enc(subject) : '');
      mpCopyLabel.textContent = 'Copy the address';
      mpLastFocus = document.activeElement;
      pick.classList.add('open');
      document.body.classList.add('mailpick-open');
      setTimeout(function () { mpPanel.focus(); }, 40);
    }
    function closePick() {
      pick.classList.remove('open');
      document.body.classList.remove('mailpick-open');
      if (mpLastFocus && mpLastFocus.focus) mpLastFocus.focus();
    }

    mailtos.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href') || '';
        var addr = href.replace(/^mailto:/, '').split('?')[0];
        if (!addr) return;
        e.preventDefault();
        var subject = '';
        var m = href.match(/[?&]subject=([^&]*)/);
        if (m) { try { subject = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (err) { subject = ''; } }
        openPick(addr, subject);
      });
    });

    pick.querySelector('.mp-close').addEventListener('click', closePick);
    pick.addEventListener('click', function (e) { if (e.target === pick) closePick(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pick.classList.contains('open')) closePick();
    });
    mpGmail.addEventListener('click', function () { setTimeout(closePick, 150); });
    mpOutlook.addEventListener('click', function () { setTimeout(closePick, 150); });
    mpApp.addEventListener('click', function () { setTimeout(closePick, 400); });
    mpCopy.addEventListener('click', function () {
      function done(ok) {
        mpCopyLabel.textContent = ok ? 'Copied — ' + mpCurrent : mpCurrent;
        setTimeout(closePick, 1400);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mpCurrent).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
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
