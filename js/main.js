/**
 * TeutoPlus – Bautrocknung OWL GmbH
 * main.js – Interaktivität: Mobile-Menü, Dropdown, Cookie-Banner, Formular
 */
(function () {
  'use strict';

  /* =========================================================================
     Helper: querySelector shorthand
     ========================================================================= */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }


  /* =========================================================================
     1. initMobileMenu
     ========================================================================= */
  function initMobileMenu() {
    var hamburger = $('#hamburger');
    var menu      = $('#mobile-menu');
    if (!hamburger || !menu) return;

    function openMenu() {
      hamburger.classList.add('is-active');
      hamburger.setAttribute('aria-expanded', 'true');
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        closeMenu();
        hamburger.focus();
      }
    });

    // Close when a mobile nav link is clicked
    $$('.mobile-nav-link, .mobile-sub-link', menu).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }


  /* =========================================================================
     2. initDropdowns
     ========================================================================= */
  function initDropdowns() {
    var dropdowns = $$('.nav-dropdown');
    if (!dropdowns.length) return;

    function closeAll() {
      dropdowns.forEach(function (dd) {
        dd.classList.remove('is-open');
        var toggle = $('[aria-expanded]', dd);
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    }

    dropdowns.forEach(function (dd) {
      var toggle = $('.nav-dropdown-toggle', dd);
      if (!toggle) return;

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = dd.classList.contains('is-open');
        closeAll();
        if (!isOpen) {
          dd.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
        }
      });

      // Close on Escape
      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeAll();
          toggle.focus();
        }
      });
    });

    // Click outside closes dropdowns
    document.addEventListener('click', closeAll);
  }


  /* =========================================================================
     3. initActiveNavLink
     ========================================================================= */
  function initActiveNavLink() {
    var page = window.location.pathname.split('/').pop() || 'index.html';

    $$('.nav-link, .dropdown-link, .mobile-nav-link, .mobile-sub-link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      // Normalize: strip leading "./" if present
      var normalized = href.replace(/^\.\//, '');
      if (normalized === page || (page === '' && normalized === 'index.html')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });

    // If on a service subpage, also mark the parent "Leistungen" toggle
    var servicePages = ['wasserschaden.html', 'bautrocknung.html', 'leckageortung.html', 'vermietung.html', 'schadstoffsanierung.html'];
    if (servicePages.indexOf(page) !== -1) {
      var toggle = $('.nav-dropdown-toggle');
      if (toggle) {
        toggle.style.color = 'var(--color-accent)';
        toggle.style.fontWeight = 'var(--font-weight-semibold)';
      }
    }
  }


  /* =========================================================================
     4. initScrollHeader
     ========================================================================= */
  function initScrollHeader() {
    var header = $('#site-header');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 50) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Run once on load
  }


  /* =========================================================================
     5. initCookieBanner
     ========================================================================= */
  function initCookieBanner() {
    var banner  = $('#cookie-banner');
    var btnAccept  = $('#cookie-accept');
    var btnDecline = $('#cookie-decline');

    if (!banner) return;

    var STORAGE_KEY = 'teutoplusCookieConsent';

    function hideBanner() {
      banner.setAttribute('hidden', '');
      banner.removeAttribute('aria-modal');
    }

    // Show only if no consent stored
    if (!localStorage.getItem(STORAGE_KEY)) {
      banner.removeAttribute('hidden');
    }

    if (btnAccept) {
      btnAccept.addEventListener('click', function () {
        localStorage.setItem(STORAGE_KEY, 'all');
        hideBanner();
        // TODO: initAnalytics() – Add analytics initialization here after consent
      });
    }

    if (btnDecline) {
      btnDecline.addEventListener('click', function () {
        localStorage.setItem(STORAGE_KEY, 'necessary');
        hideBanner();
      });
    }
  }


  /* =========================================================================
     6. initContactForm
     ========================================================================= */
  function initContactForm() {
    var form = $('#contact-form');
    if (!form) return;

    var statusEl = $('#form-status');

    // Validation rules: return true if valid, or an error string if invalid
    var rules = {
      'contact-name': function (v) {
        return v.trim().length >= 2 || 'Bitte geben Sie Ihren Namen ein (mind. 2 Zeichen).';
      },
      'contact-email': function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      },
      'contact-phone': function () { return true; }, // optional
      'contact-subject': function (v) {
        return v !== '' || 'Bitte wählen Sie ein Thema aus.';
      },
      'contact-message': function (v) {
        return v.trim().length >= 10 || 'Bitte geben Sie eine Nachricht ein (mind. 10 Zeichen).';
      },
      'contact-privacy': function (v, el) {
        return el.checked || 'Bitte stimmen Sie der Datenschutzerklärung zu.';
      }
    };

    function getErrorEl(field) {
      return document.getElementById(field.id + '-error');
    }

    function showError(field, message) {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
      var errEl = getErrorEl(field);
      if (errEl) {
        errEl.textContent = message;
        errEl.classList.add('is-visible');
      }
    }

    function clearError(field) {
      field.classList.remove('is-invalid');
      var errEl = getErrorEl(field);
      if (errEl) errEl.classList.remove('is-visible');
    }

    function markValid(field) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      var errEl = getErrorEl(field);
      if (errEl) errEl.classList.remove('is-visible');
    }

    function validateField(field) {
      var rule = rules[field.id];
      if (!rule) return true;
      var result = rule(field.value, field);
      if (result === true) {
        markValid(field);
        return true;
      } else {
        showError(field, result);
        return false;
      }
    }

    // Validate on blur
    Object.keys(rules).forEach(function (id) {
      var field = document.getElementById(id);
      if (!field) return;
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.classList.contains('is-invalid')) { validateField(field); }
      });
    });

    // Validate on submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var allValid = true;
      var firstInvalid = null;

      Object.keys(rules).forEach(function (id) {
        var field = document.getElementById(id);
        if (!field) return;
        var valid = validateField(field);
        if (!valid && !firstInvalid) firstInvalid = field;
        if (!valid) allValid = false;
      });

      if (!allValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // ── EmailJS Konfiguration ─────────────────────────────────────────────
      // ▼▼▼ HIER EINTRAGEN ▼▼▼
      var EMAILJS_SERVICE_ID  = 'DEIN_SERVICE_ID_HIER_EINTRAGEN';   // EmailJS → Email Services → Service ID
      var EMAILJS_TEMPLATE_ID = 'DEIN_TEMPLATE_ID_HIER_EINTRAGEN';  // EmailJS → Email Templates → Template ID
      // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
      // ─────────────────────────────────────────────────────────────────────

      // Submit-Button in Ladezustand versetzen
      var submitBtn = form.querySelector('[type="submit"]');
      var originalBtnHTML = submitBtn ? submitBtn.innerHTML : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true" style="animation:spin 1s linear infinite"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Wird gesendet\u2026';
      }
      if (statusEl) { statusEl.className = 'form-status'; statusEl.textContent = ''; }

      // E-Mail via EmailJS absenden
      emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
        .then(function () {
          // Erfolgsmeldung
          if (statusEl) {
            statusEl.className = 'form-status form-status--success is-visible';
            var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('width', '20'); icon.setAttribute('height', '20');
            icon.setAttribute('viewBox', '0 0 24 24');
            icon.setAttribute('fill', 'none');
            icon.setAttribute('stroke', 'currentColor');
            icon.setAttribute('stroke-width', '2');
            icon.setAttribute('stroke-linecap', 'round');
            icon.setAttribute('stroke-linejoin', 'round');
            icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
            statusEl.textContent = 'Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet. Wir melden uns so schnell wie m\u00f6glich bei Ihnen.';
            statusEl.insertBefore(icon, statusEl.firstChild);
          }
          form.reset();
          Object.keys(rules).forEach(function (id) {
            var field = document.getElementById(id);
            if (field) { field.classList.remove('is-valid', 'is-invalid'); }
          });
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
        })
        .catch(function (error) {
          // Fehlermeldung
          if (statusEl) {
            statusEl.className = 'form-status form-status--error is-visible';
            statusEl.textContent = 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an: 05231 9883005';
          }
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHTML; }
          console.error('EmailJS Fehler:', error);
        });
    });
  }


  /* =========================================================================
     7. initServicesCarousel – 3D Coverflow (slot-based, no clones)
     5-Slot-Halbkreis: 0=front  1=right-near  2=right-far  3=left-far  4=left-near
     Jede Karte hat immer eine definierte Position → keine Sprünge beim Rotieren
     ========================================================================= */
  function initServicesCarousel() {
    var carousel = $('#services-carousel');
    if (!carousel) return;

    var ring    = document.getElementById('carousel-ring');
    if (!ring) return;

    var slides  = $$('.carousel__slide', ring);
    var dots    = $$('.carousel__dot', carousel);
    var btnPrev = $('#carousel-prev');
    var btnNext = $('#carousel-next');
    var N       = slides.length;
    var current = 0;
    var timer;

    // 5-Slot-Halbkreis: jeder Slot hat eine feste Position im Raum
    function slotFor(slot, slideW) {
      switch (slot) {
        case 0: return { tx: 0,               tz: 0,    ry:   0, sc: 1.00, op: 1.00, zi: 10, pe: 'auto' }; // vorne
        case 1: return { tx:  slideW * 0.78,  tz: -220, ry: -30, sc: 0.72, op: 0.62, zi: 5,  pe: 'none' }; // rechts nah
        case 2: return { tx:  slideW * 1.15,  tz: -480, ry: -50, sc: 0.42, op: 0.18, zi: 2,  pe: 'none' }; // rechts weit
        case 3: return { tx: -slideW * 1.15,  tz: -480, ry:  50, sc: 0.42, op: 0.18, zi: 2,  pe: 'none' }; // links weit
        case 4: return { tx: -slideW * 0.78,  tz: -220, ry:  30, sc: 0.72, op: 0.62, zi: 5,  pe: 'none' }; // links nah
        default: return { tx: 0, tz: -700, ry: 0, sc: 0.2, op: 0, zi: 1, pe: 'none' };
      }
    }

    function applySlots(animated) {
      var slideW  = slides[0] ? slides[0].offsetWidth : 320;
      var trans   = animated
        ? 'transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.75s ease'
        : 'none';

      slides.forEach(function (slide, i) {
        var slot = ((i - current) % N + N) % N;
        var s    = slotFor(slot, slideW);
        slide.style.transition    = trans;
        slide.style.transform     = 'perspective(1200px) translateX(' + s.tx + 'px) translateZ(' + s.tz + 'px) rotateY(' + s.ry + 'deg) scale(' + s.sc + ')';
        slide.style.opacity       = s.op;
        slide.style.zIndex        = s.zi;
        slide.style.pointerEvents = s.pe;
      });
    }

    function updateDots() {
      dots.forEach(function (d, i) {
        var on = i === current;
        d.classList.toggle('is-active', on);
        d.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }

    function goTo(idx, animated) {
      current = ((idx % N) + N) % N;
      applySlots(animated !== false);
      updateDots();
    }

    function next() { goTo(current + 1, true); }
    function prev() { goTo(current - 1, true); }

    function startTimer() { timer = setInterval(next, 5000); }
    function resetTimer()  { clearInterval(timer); startTimer(); }

    if (btnNext) btnNext.addEventListener('click', function () { next(); resetTimer(); });
    if (btnPrev) btnPrev.addEventListener('click', function () { prev(); resetTimer(); });

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        goTo(parseInt(dot.getAttribute('data-index'), 10), true);
        resetTimer();
      });
    });

    // Touch / Swipe
    var touchX = 0;
    carousel.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      var diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); resetTimer(); }
    }, { passive: true });

    // Recalculate on resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { applySlots(false); }, 150);
    });

    // Init
    goTo(0, false);
    startTimer();
  }


  /* =========================================================================
     8. initGoogleRating – Lädt Bewertungsdaten aus google-rating.json
     Die JSON-Datei wird täglich per Cron-Job aktualisiert:
       Schritt 1: Google Cloud Console → Places API aktivieren
       Schritt 2: Place ID ermitteln (maps.google.com → Ihr Unternehmen → "Place ID kopieren")
       Schritt 3: Cron-Job einrichten (täglich), z. B.:
         curl "https://maps.googleapis.com/maps/api/place/details/json
               ?place_id=IHRE_PLACE_ID
               &fields=rating,user_ratings_total
               &key=IHR_API_KEY" \
         | python3 -c "
             import json,sys,datetime
             d=json.load(sys.stdin)['result']
             print(json.dumps({'rating':d['rating'],'total':d['user_ratings_total'],
                               'updated':str(datetime.date.today())}))" \
         > /pfad/zur/website/google-rating.json
     ========================================================================= */
  function initGoogleRating() {
    var badge    = document.getElementById('google-rating');
    if (!badge) return;

    var scoreEl = badge.querySelector('.google-rating__score');
    var starsEl = badge.querySelector('.google-rating__stars');
    var countEl = document.getElementById('g-rating-count');

    fetch('api/google-rating.php')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        if (!d || !d.rating) return;
        var rating = parseFloat(d.rating);
        if (scoreEl) scoreEl.textContent = rating.toFixed(1);
        if (starsEl) starsEl.style.setProperty('--fill', (rating / 5 * 100).toFixed(1) + '%');
        if (countEl && d.total != null) countEl.textContent = d.total;
      })
      .catch(function () { /* JSON nicht vorhanden – Fallback-Werte im HTML bleiben */ });
  }


  /* =========================================================================
     9. initAnchorScroll
     ========================================================================= */
  function initAnchorScroll() {
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var offset = 90; // approximate sticky header height
        var top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }


  /* =========================================================================
     10. initScrollReveal
     ========================================================================= */
  function initScrollReveal() {
    if (!window.IntersectionObserver) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var selector = [
      '.service-card', '.method-card', '.equipment-card', '.cert-card',
      '.process-step', '.usp-item', '.faq-item',
      '.hero-badge', '.trust-item', '.footer-col',
      '.cta-band__title', '.cta-band__sub', '.cta-band__actions',
      '.contact-form', '.contact-info-card', '.contact-info-item',
      '.highlight-box', '.detail-card',
      '.section-header', '.hero-inner__content',
      '.img-placeholder', '.area-grid__item'
    ].join(', ');

    var elements = $$(selector);

    // Stagger: Verzögerung für Geschwister mit gleicher Klasse im selben Parent
    var parentMap = new Map();
    elements.forEach(function (el) {
      el.classList.add('reveal');
      var key = el.parentElement;
      if (!parentMap.has(key)) parentMap.set(key, []);
      parentMap.get(key).push(el);
    });
    parentMap.forEach(function (siblings) {
      siblings.forEach(function (el, i) {
        if (i > 0) el.style.transitionDelay = (i * 0.12) + 's';
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }


  /* =========================================================================
     Init all on DOMContentLoaded
     ========================================================================= */
  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initDropdowns();
    initActiveNavLink();
    initScrollHeader();
    initCookieBanner();
    initContactForm();
    initServicesCarousel();
    initGoogleRating();
    initAnchorScroll();
    initScrollReveal();
  });

})();
