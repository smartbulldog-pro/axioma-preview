/**
 * cookie-banner.js — Аксиома. Cookie-согласие (152-ФЗ / ФЗ-420 / ФЗ-156, ред. 2025–2026).
 * Требования: две равнозаметные кнопки (принять все / только необходимые),
 * реальный выбор по нефункциональным cookie, запоминание выбора, ссылка на политику.
 * Технические cookie нужны для работы сайта; аналитические/рекламные — только после «Принять все».
 * Гейтинг аналитики: window.axiomaCookieConsent === 'all' → можно грузить счётчики (Метрика и т.п.).
 * Самодостаточный: инжектит разметку + стили. Светлая тема по умолчанию + оверрайд тёмной.
 */
(function () {
  'use strict';
  var KEY = 'axioma-cookie-consent';

  // Экспонируем текущий выбор для гейтинга аналитики (грузить счётчики только при 'all')
  try { window.axiomaCookieConsent = localStorage.getItem(KEY) || null; } catch (e) { /* приватный режим */ }
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* приватный режим */ }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var css =
      '.cookie-bar{position:fixed;left:0;right:0;bottom:0;z-index:150;transform:translateY(130%);' +
      'transition:transform .45s cubic-bezier(.16,.84,.44,1);padding:0 16px 16px;padding-bottom:calc(env(safe-area-inset-bottom,0px) + 14px);pointer-events:none}' +
      '.cookie-bar.is-visible{transform:translateY(0)}' +
      '.cookie-bar__inner{max-width:1120px;margin:0 auto;pointer-events:auto;background:#fff;' +
      'border:1px solid rgba(16,25,26,.1);box-shadow:0 20px 60px rgba(16,25,26,.14);border-radius:16px;' +
      'padding:16px 20px;display:flex;align-items:center;gap:16px 24px;flex-wrap:wrap}' +
      '.cookie-bar__text{margin:0;font-size:.86rem;line-height:1.6;color:rgba(16,25,26,.75);flex:1;min-width:240px}' +
      '.cookie-bar__text a{color:#0B7A94;text-decoration:underline}' +
      '.cookie-bar__actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '.cookie-bar__btn{border-radius:10px;padding:.7rem 1.4rem;font-weight:600;font-size:.88rem;' +
      'font-family:inherit;cursor:pointer;white-space:nowrap;transition:background .25s,border-color .25s,transform .2s}' +
      '.cookie-bar__btn:hover{transform:translateY(-1px)}' +
      '.cookie-bar__btn--accept{background:#0B7A94;color:#fff;border:1px solid #0B7A94}' +
      '.cookie-bar__btn--accept:hover{background:#0A6E85;border-color:#0A6E85}' +
      '.cookie-bar__btn--decline{background:transparent;color:rgba(16,25,26,.8);border:1px solid rgba(16,25,26,.2)}' +
      '.cookie-bar__btn--decline:hover{border-color:rgba(16,25,26,.45)}' +
      ':root[data-theme="dark"] .cookie-bar__inner{background:#0f1215;border-color:rgba(255,255,255,.12)}' +
      ':root[data-theme="dark"] .cookie-bar__text{color:rgba(255,255,255,.72)}' +
      ':root[data-theme="dark"] .cookie-bar__text a{color:#1FD1F9}' +
      ':root[data-theme="dark"] .cookie-bar__btn--decline{color:rgba(255,255,255,.8);border-color:rgba(255,255,255,.25)}' +
      // На 360 px кнопки не вставали в строку и переносились друг под друга,
      // баннер занимал почти половину первого экрана.
      '@media (max-width:640px){' +
      '.cookie-bar__inner{padding:14px 16px;gap:12px}' +
      '.cookie-bar__text{font-size:.82rem;line-height:1.5;min-width:0}' +
      '.cookie-bar__actions{width:100%;gap:8px}' +
      '.cookie-bar__btn{flex:1;padding:.7rem .5rem;white-space:normal}}';
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var inUslugi = location.pathname.indexOf('/uslugi/') !== -1;
    var policy = (inUslugi ? '../' : '') + 'politika-konfidencialnosti.html';

    var bar = document.createElement('div');
    bar.className = 'cookie-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Согласие на использование cookie');
    bar.innerHTML =
      '<div class="cookie-bar__inner">' +
      '<p class="cookie-bar__text">Мы используем cookie. Технические файлы необходимы для работы сайта, ' +
      'аналитические — только с вашего согласия. Подробнее — в <a href="' + policy + '">политике конфиденциальности</a>.</p>' +
      '<div class="cookie-bar__actions">' +
      '<button class="cookie-bar__btn cookie-bar__btn--accept" type="button">Принять все</button>' +
      '<button class="cookie-bar__btn cookie-bar__btn--decline" type="button">Только необходимые</button>' +
      '</div>' +
      '</div>';
    document.body.appendChild(bar);

    requestAnimationFrame(function () { bar.classList.add('is-visible'); });

    function choose(val) {
      try { localStorage.setItem(KEY, val); } catch (e) { /* приватный режим */ }
      try { window.axiomaCookieConsent = val; } catch (e) {}
      bar.classList.remove('is-visible');
      setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 450);
      // Хук: при согласии на всё — здесь можно инициализировать аналитику (Яндекс.Метрика и т.п.)
      // if (val === 'all') { /* init counters */ }
    }
    bar.querySelector('.cookie-bar__btn--accept').addEventListener('click', function () { choose('all'); });
    bar.querySelector('.cookie-bar__btn--decline').addEventListener('click', function () { choose('essential'); });
  });
})();
