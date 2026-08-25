/**
 * mobile-call.js — Аксиома. Липкая полоса связи на телефоне.
 *
 * Зачем: номера не было ни в шапке, ни на первых экранах. На главной телефон
 * впервые встречался на ~8860 px прокрутки при высоте страницы 10454 px,
 * на «Ценах» — на 6404 из 8072 px. Человек с телефона до него не доходил.
 *
 * Полоса показывается только на узких экранах и только когда она уместна:
 * после первого экрана, вне подвала (там номер и так есть), при закрытом меню
 * и панели помощника, и не поверх cookie-баннера.
 *
 * Снимается одним движением: удалить файл и тег <script> на страницах.
 */
(function () {
  'use strict';

  var TEL_HREF = 'tel:+79130998881';
  var TEL_TEXT = '+7 913 099-88-81';
  var MAX_URL  = 'https://max.ru/u/f9LHodD0cOL0n-mRdnryGsw7EJZ7Zxtw55dK3RKrty99-5P9BsmoWjZU3_8';
  var SHOW_AFTER = 560;          // px прокрутки — примерно первый экран
  var NARROW = '(max-width: 640px)';

  var bar = null;
  var footer = null;
  var ticking = false;

  function styles() {
    var css =
      '.call-bar{position:fixed;left:0;right:0;bottom:0;z-index:150;display:none;' +
      'padding:10px 12px calc(10px + env(safe-area-inset-bottom));gap:10px;' +
      'transform:translateY(130%);visibility:hidden;' +
      'transition:transform .45s cubic-bezier(.165,.84,.44,1),visibility 0s linear .45s;' +
      'background:linear-gradient(to top,rgba(250,249,247,.98) 55%,rgba(250,249,247,0));' +
      'pointer-events:none}' +
      '.call-bar.is-mounted{display:flex}' +
      '.call-bar.is-visible{transform:translateY(0);pointer-events:auto;visibility:visible;transition:transform .45s cubic-bezier(.165,.84,.44,1),visibility 0s}' +
      '.call-bar__btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;' +
      'height:52px;border-radius:14px;font-family:var(--font-display,inherit);font-size:15px;' +
      'font-weight:600;text-decoration:none;letter-spacing:.01em;' +
      'transition:transform .2s ease,background .2s ease}' +
      '.call-bar__btn:active{transform:scale(.98)}' +
      '.call-bar__btn--tel{flex:1;background:#15AFD1;color:#fff;' +
      'box-shadow:0 6px 18px rgba(21,175,209,.28)}' +
      '.call-bar__btn--max{width:76px;flex:none;background:rgba(16,25,26,.06);color:#16191A;' +
      'border:1px solid rgba(16,25,26,.12);font-size:13px;letter-spacing:.08em}' +
      '.call-bar__btn svg{width:18px;height:18px;flex-shrink:0}' +
      '.call-bar__btn:focus-visible{outline:2px solid #0B7A94;outline-offset:3px}' +
      ':root[data-theme="dark"] .call-bar{background:linear-gradient(to top,rgba(10,13,15,.98) 55%,rgba(10,13,15,0))}' +
      ':root[data-theme="dark"] .call-bar__btn--max{background:rgba(255,255,255,.08);color:rgba(255,255,255,.9);' +
      'border-color:rgba(255,255,255,.18)}' +
      '@media (min-width:641px){.call-bar{display:none!important}}' +
      '@media (prefers-reduced-motion:reduce){.call-bar{transition:none}}';
    var tag = document.createElement('style');
    tag.setAttribute('data-call-bar', '');
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function build() {
    bar = document.createElement('div');
    bar.className = 'call-bar is-mounted';
    bar.id = 'call-bar';
    bar.innerHTML =
      '<a class="call-bar__btn call-bar__btn--tel" href="' + TEL_HREF + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6' +
      ' 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81' +
      'a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.34 1.85.57' +
      ' 2.81.7A2 2 0 0122 16.92z"/></svg>' +
      '<span>' + TEL_TEXT + '</span></a>' +
      '<a class="call-bar__btn call-bar__btn--max" href="' + MAX_URL + '" target="_blank" ' +
      'rel="noopener" aria-label="Написать в MAX">MAX</a>';
    document.body.appendChild(bar);
  }

  function footerInView() {
    // В подвале номер и так на виду — полоса там лишняя.
    if (!footer) footer = document.querySelector('.s-footer');
    if (!footer) return false;
    return footer.getBoundingClientRect().top < window.innerHeight * 0.85;
  }

  function blocked() {
    // cookie-баннер занимает то же место; меню и помощник открыты — полоса лишняя
    if (document.querySelector('.cookie-bar.is-visible')) return true;
    // Человек печатает: на телефоне полоса встала бы прямо над клавиатурой,
    // поверх поля, в которое он пишет.
    var ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return true;
    if (document.body.classList.contains('menu-is-open')) return true;
    var ai = document.getElementById('ai-sidebar');
    if (ai && ai.classList.contains('is-open')) return true;
    return false;
  }

  function update() {
    if (!bar) return;
    var show = window.matchMedia(NARROW).matches &&
               window.scrollY > SHOW_AFTER &&
               !footerInView() &&
               !blocked();
    bar.classList.toggle('is-visible', show);
  }

  function onScroll() {
    // Троттлинг по таймеру, а не по requestAnimationFrame: в фоновой вкладке
    // кадры замораживаются, и переключение классом залипало бы до возврата.
    if (ticking) return;
    ticking = true;
    setTimeout(function () { ticking = false; update(); }, 80);
  }

  function watchClass(el) {
    if (!el) return;
    new MutationObserver(update).observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  function init() {
    if (document.getElementById('call-bar')) return;
    styles();
    build();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', function () { setTimeout(update, 120); });
    // Меню, помощник и cookie-баннер меняют классы — следим точечно.
    // Общий наблюдатель по всему поддереву здесь недопустим: ScrollTrigger
    // переключает классы десятками в кадр, это съело бы прокрутку.
    watchClass(document.body);
    watchClass(document.getElementById('ai-sidebar'));
    var cookie = document.querySelector('.cookie-bar');
    if (cookie) {
      watchClass(cookie);
    } else {
      // баннер вставляется своим скриптом позже — дождёмся появления
      var wait = new MutationObserver(function () {
        var bar2 = document.querySelector('.cookie-bar');
        if (!bar2) return;
        watchClass(bar2);
        wait.disconnect();
        update();
      });
      wait.observe(document.body, { childList: true });
    }
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
