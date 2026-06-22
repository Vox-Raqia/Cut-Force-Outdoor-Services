/* ── Cookie Consent & Analytics Controller ── */
/* Centers all tracking logic in one place */

(function () {
  'use strict';

  const CONSENT_KEY = 'cutforce_consent_v1';
  const CLARITY_ID = 'xai594ujfy';

  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  }

  function setConsent(value) {
    localStorage.setItem(CONSENT_KEY, value);
  }

  /* ── Clarity Loader ── */
  function loadClarity() {
    if (window.__clarity_loaded) return;
    window.__clarity_loaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function trackEvent(name, props) {
    if (!window.clarity) return;
    if (props) {
      window.clarity('event', name, props);
    } else {
      window.clarity('event', name);
    }
  }

  /* ── Track page view ── */
  function trackPage(page) {
    if (hasConsent()) {
      trackEvent('page_view', { page: page });
    }
  }

  /* ── Cookie Banner ── */
  function buildBanner() {
    if (document.getElementById('cf-consent-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'cf-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML =
      '<div class="cf-consent-inner">' +
        '<p class="cf-consent-text">' +
          'This site uses Microsoft Clarity and Microsoft Advertising to understand how visitors use the site. ' +
          'No personal data is stored. You can change your preference anytime in the footer.' +
        '</p>' +
        '<div class="cf-consent-actions">' +
          '<button id="cf-accept" class="cf-btn cf-btn-accept">Accept</button>' +
          '<button id="cf-essential" class="cf-btn cf-btn-essential">Essential Only</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
  }

  function showBanner() {
    buildBanner();
    var banner = document.getElementById('cf-consent-banner');
    if (banner) banner.classList.add('cf-visible');
  }

  function hideBanner() {
    var banner = document.getElementById('cf-consent-banner');
    if (banner) banner.classList.remove('cf-visible');
  }

  function acceptAll() {
    setConsent('accepted');
    loadClarity();
    hideBanner();
    trackPage(getPageName());
  }

  function acceptEssential() {
    setConsent('essential');
    hideBanner();
    trackPage('essential_consent_' + getPageName());
  }

  function getPageName() {
    var path = window.location.pathname;
    var name = path.replace(/\/$/, '') || 'home';
    if (name.startsWith('/')) name = name.slice(1);
    return name;
  }

  /* ── Auto-wire CTA links ── */
  var CTA_MAP = {
    'tel:604-206-8586': 'cta_call_click',
    'sms:604-206-8586': 'cta_text_click',
    'mailto:carl@cutforceoutdoorservices.ca': 'cta_email_click'
  };

  function wireLinks() {
    var links = document.querySelectorAll('a[data-track], a[href^="tel:"], a[href^="sms:"], a[href^="mailto:"]');
    links.forEach(function (link) {
      if (link._cf_wired) return;
      link._cf_wired = true;

      var eventName = link.getAttribute('data-track');

      if (!eventName) {
        var href = link.getAttribute('href');
        eventName = CTA_MAP[href] || null;
      }

      if (!eventName) return;

      link.addEventListener('click', function (e) {
        if (hasConsent()) {
          trackEvent(eventName, {
            page: getPageName(),
            text: (link.textContent || '').trim().slice(0, 40)
          });
        }
      });
    });
  }

  /* ── Wire form submit buttons ── */
  function wireForms() {
    var buttons = document.querySelectorAll('button[data-track], button[type="submit"][data-track]');
    buttons.forEach(function (btn) {
      if (btn._cf_wired) return;
      btn._cf_wired = true;
      var eventName = btn.getAttribute('data-track');
      btn.addEventListener('click', function () {
        if (hasConsent()) {
          trackEvent(eventName, { page: getPageName() });
        }
      });
    });
  }

  /* ── Footer consent toggle ── */
  function addFooterToggle() {
    var footers = document.querySelectorAll('footer');
    footers.forEach(function (footer) {
      if (footer.querySelector('.cf-consent-toggle')) return;
      var toggle = document.createElement('button');
      toggle.className = 'cf-consent-toggle';
      toggle.textContent = 'Cookie Settings';
      toggle.setAttribute('aria-label', 'Open cookie consent settings');
      toggle.addEventListener('click', function () {
        if (hasConsent()) {
          if (confirm('Reset cookie consent? Tracking will be paused until you choose again.')) {
            localStorage.removeItem(CONSENT_KEY);
            window.location.reload();
          }
        } else {
          showBanner();
        }
      });
      footer.appendChild(toggle);
    });
  }

  /* ── Init ── */
  function init() {
    var page = getPageName();

    if (hasConsent()) {
      loadClarity();
      trackPage(page);
    }

    buildBanner();

    /* Wire up buttons */
    document.getElementById('cf-accept').addEventListener('click', acceptAll);
    document.getElementById('cf-essential').addEventListener('click', acceptEssential);

    if (!hasConsent()) {
      showBanner();
    }

    wireLinks();
    wireForms();
    addFooterToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
