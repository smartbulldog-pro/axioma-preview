/**
 * theme.js — Аксиома. Переключатель светлой/тёмной темы.
 * Светлая — по умолчанию (ТЗ заказчика 2026-07-03), выбор хранится в localStorage.
 * Атрибут data-theme ставится инлайн-скриптом в <head> ДО отрисовки (без вспышки);
 * здесь — только кнопка. Кнопка добавляется шаблоном шапки (#theme-toggle).
 */
(function () {
  'use strict';

  var KEY = 'axioma-theme';
  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  // Свап сцен по теме: scene-*.jpg (день) ↔ scene-*-dark.jpg (вечер)
  function swapScenes(theme) {
    var dark = theme === 'dark';
    var imgs = document.querySelectorAll('img.sp-scene__img, img[data-dark]');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var dd = img.getAttribute('data-dark');
      if (dd) {
        if (!img.getAttribute('data-light')) img.setAttribute('data-light', img.getAttribute('src'));
        var t = dark ? dd : img.getAttribute('data-light');
        if (t && img.getAttribute('src') !== t) img.setAttribute('src', t);
        continue;
      }
      // Запасное правило для страниц, где пара не размечена атрибутом.
      // Расширение не фиксируем: фотосцены переведены из PNG в JPEG.
      var s = img.getAttribute('src');
      if (!s || !/scene-(family|business|court)/.test(s)) continue;
      if (dark) {
        if (!/-dark\.(png|jpe?g|webp)$/.test(s)) {
          img.setAttribute('src', s.replace(/\.(png|jpe?g|webp)$/, '-dark.$1'));
        }
      } else if (/-dark\.(png|jpe?g|webp)$/.test(s)) {
        img.setAttribute('src', s.replace(/-dark\.(png|jpe?g|webp)$/, '.$1'));
      }
    }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    swapScenes(theme);
    try { localStorage.setItem(KEY, theme); } catch (e) { /* приватный режим */ }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#080f10' : '#FAF9F7');
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
  }

  function init() {
    apply(current());
    // Разметка помощника/мастера вставляется скриптами позже DOMContentLoaded —
    // досвапливаем картинки новых узлов под уже действующую тему.
    if (window.MutationObserver && document.body) {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (muts[i].addedNodes.length) { swapScenes(current()); break; }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      apply(current() === 'dark' ? 'light' : 'dark');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
