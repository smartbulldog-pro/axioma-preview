/**
 * Header & Navigation Controller v3
 * 
 * Premium Refokus-style: floating panel, fly-text animation,
 * 3×3 service grid, icon wobble, stagger entrance
 */
(function () {
  'use strict';

  /* ─── DOM refs ─── */
  const header    = document.getElementById('site-header');
  const menuBtn   = document.getElementById('menu-toggle');
  const overlay   = document.getElementById('menu-overlay');
  const dimmer    = document.getElementById('menu-dimmer');
  const closeBtn  = document.getElementById('menu-close');
  const navLinks  = overlay ? overlay.querySelectorAll('.menu-nav__link') : [];

  if (!header || !overlay) return;

  /* ─── Scroll → glassmorphism ─── */
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─── Menu Open / Close ─── */
  function openMenu() {
    overlay.classList.add('is-open');
    dimmer.classList.add('is-active');
    document.body.classList.add('menu-is-open');
    menuBtn.setAttribute('aria-expanded', 'true');

    // Stagger entrance for nav links
    navLinks.forEach((link, i) => {
      link.style.transitionDelay = `${0.06 + i * 0.05}s`;
    });
  }

  function closeMenu() {
    overlay.classList.remove('is-open');
    dimmer.classList.remove('is-active');
    document.body.classList.remove('menu-is-open');
    menuBtn.setAttribute('aria-expanded', 'false');

    // Reset stagger delays
    navLinks.forEach((link) => {
      link.style.transitionDelay = '0s';
    });

    // Close all accordions
    document.querySelectorAll('.menu-nav__item.is-expanded').forEach((item) => {
      item.classList.remove('is-expanded');
    });
  }

  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  dimmer.addEventListener('click', closeMenu);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeMenu();
    }
  });

  /* ─── Accordion ─── */
  document.querySelectorAll('.menu-accordion__toggle').forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const item = toggle.closest('.menu-nav__item');
      const wasExpanded = item.classList.contains('is-expanded');

      // Close all others
      document.querySelectorAll('.menu-nav__item.is-expanded').forEach((el) => {
        if (el !== item) el.classList.remove('is-expanded');
      });

      // Toggle current
      item.classList.toggle('is-expanded', !wasExpanded);
    });
  });

  /* ─── Active page highlight ─── */
  const currentPath = window.location.pathname;
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.replace(/^\.\/|^\.\.\//, ''))) {
      link.classList.add('is-active');
    }
  });

  // Also check service grid links
  document.querySelectorAll('.menu-service-card').forEach((card) => {
    const href = card.getAttribute('href');
    if (href && currentPath.includes(href.replace(/^\.\/|^\.\.\//, ''))) {
      card.style.borderColor = 'var(--color-accent, #15AFD1)';
      card.classList.add('is-current');
      // Auto-expand parent accordion
      const parentItem = card.closest('.menu-nav__item');
      if (parentItem) parentItem.classList.add('is-expanded');
    }
  });

})();
