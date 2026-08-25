/**
 * shared-components.js — Аксиома
 * Единый файл для Header, Menu Overlay, Footer и AI Sidebar.
 * Подключается на КАЖДОЙ странице. Не дублируем HTML.
 *
 * Использование: на странице вставить пустые div-контейнеры:
 *   <div id="shared-header"></div>
 *   <div id="shared-footer"></div>
 *   <div id="shared-ai-sidebar"></div>
 *
 * Скрипт сам вставит HTML и подсветит текущую страницу в навигации.
 *
 * ⛔ НЕ РЕДАКТИРОВАТЬ hero-sequence.js, sections.js
 */

(function () {
  'use strict';

  // ─── Определяем текущую страницу ───
  const pageId = document.body.getAttribute('data-page-id') || '';

  // Помощник: добавить is-active для текущей страницы в меню
  function activeClass(targetPage) {
    return pageId === targetPage ? ' is-active' : '';
  }

  // ─── HEADER + MENU OVERLAY ───
  const headerHTML = `
  <a href="#main-content" class="skip-link">Перейти к содержимому</a>

  <!-- ═══ HEADER ═══ -->
  <header class="header" id="site-header">
    <button class="header__pill" id="menu-toggle" aria-label="Открыть меню" aria-expanded="false">
      <span>Меню</span>
    </button>

    <a href="index.html" class="header__logo" id="headerLogo">
      <span class="header__logo-pill">
        <img src="img/logo-mark.webp" alt="АКСИОМА" class="header__logo-img" width="32" height="32">
        <img src="img/logo-full.webp" alt="Аксиома — Оценочная компания" class="header__logo-full" width="120" height="85">
      </span>
    </a>

    <div class="header__right">
      <div class="header__dots" aria-hidden="true">
        <span class="header__dot"></span>
        <span class="header__dot"></span>
        <span class="header__dot"></span>
        <span class="header__dot"></span>
        <span class="header__dot"></span>
      </div>
      <button class="header__pill header__pill--theme" id="theme-toggle" aria-label="Переключить тему">
        <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      </button>
      <button class="header__pill header__pill--ai" id="ai-toggle" aria-label="AI-помощник" aria-expanded="false">
        <span class="header__pill-ai-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></span>
        <span class="header__pill-ai-label">Помощник</span>
        <span class="header__pill-ai-pulse"></span>
      </button>
    </div>
  </header>

  <!-- ═══ MENU OVERLAY ═══ -->
  <div class="menu-dimmer" id="menu-dimmer"></div>

  <nav class="menu-overlay" id="menu-overlay" aria-label="Главное меню">
    <button class="menu-overlay__close" id="menu-close" aria-label="Закрыть меню">
      <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </button>

    <div class="menu-overlay__scroll">
      <div class="menu-nav">
        <!-- Главная -->
        <div class="menu-nav__item">
          <a href="index.html" class="menu-nav__link${activeClass('home')}">
            <span class="menu-nav__link-wrap"><span class="menu-nav__link-text" data-text="Главная">Главная</span></span>
          </a>
        </div>

        <!-- О компании -->
        <div class="menu-nav__item">
          <a href="o-kompanii.html" class="menu-nav__link${activeClass('o-kompanii')}">
            <span class="menu-nav__link-wrap"><span class="menu-nav__link-text" data-text="О компании">О компании</span></span>
          </a>
        </div>

        <!-- Услуги (аккордеон → 3×3 grid) -->
        <div class="menu-nav__item">
          <a href="#" class="menu-nav__link menu-accordion__toggle${activeClass('uslugi')}">
            <span class="menu-nav__link-wrap"><span class="menu-nav__link-text" data-text="Услуги">Услуги</span></span>
            <span class="menu-accordion__icon">+</span>
          </a>
          <div class="menu-accordion__body">
            <div class="menu-services-grid">
              <a href="uslugi/ocenka-nedvizhimosti.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-nedvizhimost.webp" data-dark="assets/img/icons/obs-nedvizhimost.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-nedvizhimost.webp" data-dark="assets/img/icons/cry-nedvizhimost.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Недвижимость</span>
              </a>
              <a href="uslugi/kommercheskaya-nedvizhimost.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-commercial.webp" data-dark="assets/img/icons/obs-commercial.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-commercial.webp" data-dark="assets/img/icons/cry-commercial.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Коммерческая</span>
              </a>
              <a href="uslugi/ocenka-dlya-notariusa.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-notarius.webp" data-dark="assets/img/icons/obs-notarius.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-notarius.webp" data-dark="assets/img/icons/cry-notarius.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Для нотариуса</span>
              </a>
              <a href="uslugi/ocenka-dlya-suda.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-sud.webp" data-dark="assets/img/icons/obs-sud.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-sud.webp" data-dark="assets/img/icons/cry-sud.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Для суда</span>
              </a>
              <a href="uslugi/ocenka-ushherba.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-ushherb.webp" data-dark="assets/img/icons/obs-ushherb.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-ushherb.webp" data-dark="assets/img/icons/cry-ushherb.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Ущерб</span>
              </a>
              <a href="uslugi/ocenka-biznesa.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-biznes.webp" data-dark="assets/img/icons/obs-biznes.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-biznes.webp" data-dark="assets/img/icons/cry-biznes.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Бизнес</span>
              </a>
              <a href="uslugi/oborudovanie-i-transport.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-oborudovanie.webp" data-dark="assets/img/icons/obs-oborudovanie.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-oborudovanie.webp" data-dark="assets/img/icons/cry-oborudovanie.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Оборудование</span>
              </a>
              <a href="uslugi/yuridicheskie-uslugi.html" class="menu-service-card">
                <span class="menu-service-card__icon-wrap">
                  <img src="assets/img/icons/light-yuridicheskie.webp" data-dark="assets/img/icons/obs-yuridicheskie.webp" alt="" class="menu-service-card__icon menu-service-card__icon--obs" loading="lazy" decoding="async">
                  <img src="assets/img/icons/glow-yuridicheskie.webp" data-dark="assets/img/icons/cry-yuridicheskie.webp" alt="" class="menu-service-card__icon menu-service-card__icon--cry" loading="lazy" decoding="async">
                  <span class="menu-service-card__particles"></span>
                </span>
                <span class="menu-service-card__label">Юридические</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Цены -->
        <div class="menu-nav__item">
          <a href="ceny.html" class="menu-nav__link${activeClass('ceny')}">
            <span class="menu-nav__link-wrap"><span class="menu-nav__link-text" data-text="Цены">Цены</span></span>
          </a>
        </div>

        <!-- Контакты -->
        <div class="menu-nav__item">
          <a href="kontakty.html" class="menu-nav__link${activeClass('kontakty')}">
            <span class="menu-nav__link-wrap"><span class="menu-nav__link-text" data-text="Контакты">Контакты</span></span>
          </a>
        </div>
      </div>

      <!-- Logo — full logo in teal backdrop -->
      <div class="menu-logo" id="menuLogo">
        <div class="menu-logo__backdrop">
          <img src="img/logo-full.webp" alt="Аксиома — Оценочная компания" class="menu-logo__full" width="140" height="100">
        </div>
      </div>
    </div>

    <!-- Footer: pinned to bottom -->
    <div class="menu-footer">
      <div class="menu-footer__grid">
        <a href="tel:+79130998881" class="menu-footer__link menu-footer__link--tel">+7 913 099-88-81</a>
        <a href="https://max.ru/u/f9LHodD0cOL0n-mRdnryGsw7EJZ7Zxtw55dK3RKrty99-5P9BsmoWjZU3_8" class="menu-footer__link" target="_blank" rel="noopener">MAX</a>
        <a href="kontakty.html" class="menu-footer__link">Контакты</a>
        <a href="uslugi.html" class="menu-footer__link">Все услуги</a>
        <a href="mailto:aksiomaok@mail.ru" class="menu-footer__link">Email</a>
      </div>
    </div>
  </nav>
  `;

  // ─── FOOTER ───
  const footerHTML = `
  <!-- ═══ FOOTER — Premium Modern ═══ -->
  <footer class="s-footer" id="site-footer">

    <!-- Top: Large brand + mini CTA -->
    <div class="s-footer__hero">
      <div class="s-footer__hero-inner">
        <div class="s-footer__brand-block">
          <div class="s-footer__brand">АКСИОМА</div>
          <p class="s-footer__tagline">Помогаем сохранить важное — с заботой и точностью</p>
        </div>
        <div class="s-footer__cta-block">
          <p class="s-footer__cta-label">Бесплатная консультация</p>
          <a href="tel:+79130998881" class="s-footer__cta-phone">+7 913 099-88-81</a>
          <div class="s-footer__cta-messengers">
            <a href="https://max.ru/u/f9LHodD0cOL0n-mRdnryGsw7EJZ7Zxtw55dK3RKrty99-5P9BsmoWjZU3_8" class="s-footer__messenger" aria-label="MAX" target="_blank" rel="noopener">
              <img src="assets/img/icon-max.png" alt="MAX" width="18" height="18">
            </a>
            <a href="mailto:aksiomaok@mail.ru" class="s-footer__messenger" aria-label="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation columns -->
    <div class="s-footer__nav">
      <div class="s-footer__nav-inner">
        <div class="s-footer__col">
          <div class="s-footer__col-title">Услуги</div>
          <a href="uslugi/ocenka-nedvizhimosti.html" class="s-footer__link">Оценка недвижимости</a>
          <a href="uslugi/kommercheskaya-nedvizhimost.html" class="s-footer__link">Коммерческая недвижимость</a>
          <a href="uslugi/ocenka-dlya-suda.html" class="s-footer__link">Оценка для суда</a>
          <a href="uslugi/ocenka-biznesa.html" class="s-footer__link">Оценка бизнеса</a>
          <a href="uslugi/ocenka-dlya-notariusa.html" class="s-footer__link">Оценка для нотариуса</a>
          <a href="uslugi/ocenka-ushherba.html" class="s-footer__link">Оценка ущерба</a>
          <a href="uslugi/oborudovanie-i-transport.html" class="s-footer__link">Оборудование и транспорт</a>
          <a href="uslugi/yuridicheskie-uslugi.html" class="s-footer__link">Юридические услуги</a>
        </div>
        <div class="s-footer__col">
          <div class="s-footer__col-title">Компания</div>
          <a href="o-kompanii.html" class="s-footer__link">О компании</a>
          <a href="ceny.html" class="s-footer__link">Цены</a>
          <a href="kontakty.html" class="s-footer__link">Контакты</a>
        </div>
        <div class="s-footer__col">
          <div class="s-footer__col-title">Мы рядом</div>
          <div class="s-footer__city">
            <span class="s-footer__city-name">Барнаул</span>
            <span class="s-footer__city-detail">ул. Молодёжная, 26, 6 этаж, офис 618</span>
          </div>
          <div class="s-footer__city">
            <span class="s-footer__city-name">+7 913 099-88-81</span>
            <span class="s-footer__city-detail">aksiomaok@mail.ru</span>
          </div>
        </div>
        <div class="s-footer__col">
          <div class="s-footer__col-title">Документы</div>
          <a href="politika-konfidencialnosti.html" class="s-footer__link">Политика конфиденциальности</a>
          <div class="s-footer__legal-info">
            <span>ООО «Аксиома», ИНН 2222913647</span>
            <span>КПП 222201001</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="s-footer__bottom">
      <span class="s-footer__copy">© 2026 АКСИОМА — независимая оценка и юридическая помощь. Барнаул</span>
      <span class="s-footer__studio">
        <span>Сайт создан студией</span>
        <img src="assets/img/vkv-logo.png" alt="VKV — New Vision" class="s-footer__studio-logo" width="80" height="auto">
      </span>
    </div>
  </footer>
  `;

  // ─── AI SIDEBAR ───
  const aiSidebarHTML = `
  <!-- ═══ AI SIDEBAR ═══ -->
  <div class="ai-dimmer" id="ai-dimmer"></div>

  <aside class="ai-sidebar" id="ai-sidebar" aria-label="AI-эксперт">

    <!-- Tab Switcher -->
    <div class="ai-tabs">
      <button class="ai-tabs__card is-active" data-panel="ai-panel-chat">
        <span class="ai-tabs__icon-wrap">
          <img src="assets/img/icons/light-ai-brain.jpg" data-dark="assets/img/icons/obs-ai-brain.jpg" alt="" class="ai-tabs__icon ai-tabs__icon--obs" loading="lazy" decoding="async">
          <img src="assets/img/icons/glow-ai-brain.jpg" data-dark="assets/img/icons/cry-ai-brain.jpg" alt="" class="ai-tabs__icon ai-tabs__icon--cry" loading="lazy" decoding="async">
          <span class="ai-tabs__particles"></span>
        </span>
        <span class="ai-tabs__label">Эксперт</span>
      </button>
      <button class="ai-tabs__card" data-panel="ai-panel-wizard">
        <span class="ai-tabs__icon-wrap">
          <img src="assets/img/icons/light-inspection.jpg" data-dark="assets/img/icons/obs-inspection.jpg" alt="" class="ai-tabs__icon ai-tabs__icon--obs" loading="lazy" decoding="async">
          <img src="assets/img/icons/glow-inspection.jpg" data-dark="assets/img/icons/cry-inspection.jpg" alt="" class="ai-tabs__icon ai-tabs__icon--cry" loading="lazy" decoding="async">
          <span class="ai-tabs__particles"></span>
        </span>
        <span class="ai-tabs__label">Онлайн-осмотр</span>
      </button>
      <button class="ai-sidebar__close" id="ai-close" aria-label="Закрыть">
        <svg viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    </div>

    <!-- ═══ PANELS ═══ -->
    <div class="ai-panels">

      <!-- ─── CHAT PANEL ─── -->
      <div class="ai-panel is-active" id="ai-panel-chat">

        <!-- Brain Orb -->
        <div class="ai-brain-orb" id="ai-brain-orb">
          <canvas class="ai-brain-orb__canvas" id="neural-canvas"></canvas>
          <div class="ai-brain-orb__icon">
            <img src="assets/img/icons/light-ai-brain.jpg" data-dark="assets/img/icons/obs-ai-brain.jpg" alt="" class="ai-brain-orb__img ai-brain-orb__img--obs">
            <img src="assets/img/icons/glow-ai-brain.jpg" data-dark="assets/img/icons/cry-ai-brain.jpg" alt="" class="ai-brain-orb__img ai-brain-orb__img--cry">
          </div>
        </div>

        <div class="ai-panel__scroll" id="ai-chat-messages">

          <!-- Greeting -->
          <div class="ai-greeting" id="ai-greeting">
            <div class="ai-greeting__spacer"></div>
            <div class="ai-greeting__brand">Аксиома</div>
            <div class="ai-greeting__subtitle">Ваш эксперт по оценке</div>

            <nav class="ai-starters">
              <div class="ai-starters__item">
                <button class="ai-starters__link" data-question="Сколько стоит оценка квартиры?">
                  <span class="ai-starters__link-wrap">
                    <span class="ai-starters__link-text" data-text="Сколько стоит оценка?">Сколько стоит оценка?</span>
                  </span>
                  <span class="ai-starters__arrow">→</span>
                </button>
              </div>
              <div class="ai-starters__item">
                <button class="ai-starters__link" data-question="Какие документы нужны для оценки?">
                  <span class="ai-starters__link-wrap">
                    <span class="ai-starters__link-text" data-text="Какие документы нужны?">Какие документы нужны?</span>
                  </span>
                  <span class="ai-starters__arrow">→</span>
                </button>
              </div>
              <div class="ai-starters__item">
                <button class="ai-starters__link" data-question="Как быстро будет готов отчёт?">
                  <span class="ai-starters__link-wrap">
                    <span class="ai-starters__link-text" data-text="Сроки подготовки отчёта">Сроки подготовки отчёта</span>
                  </span>
                  <span class="ai-starters__arrow">→</span>
                </button>
              </div>
              <div class="ai-starters__item">
                <button class="ai-starters__link" data-question="Работаете ли вы с ипотекой?">
                  <span class="ai-starters__link-wrap">
                    <span class="ai-starters__link-text" data-text="Оценка для ипотеки">Оценка для ипотеки</span>
                  </span>
                  <span class="ai-starters__arrow">→</span>
                </button>
              </div>
              <div class="ai-starters__item">
                <button class="ai-starters__link" data-question="Где вы находитесь?">
                  <span class="ai-starters__link-wrap">
                    <span class="ai-starters__link-text" data-text="Контакты и адрес">Контакты и адрес</span>
                  </span>
                  <span class="ai-starters__arrow">→</span>
                </button>
              </div>
            </nav>
          </div>

        </div>

        <!-- Input area -->
        <div class="ai-chat__input-area">
          <div class="ai-chat__input-wrap">
            <input type="text" class="ai-chat__input" id="ai-chat-input" placeholder="Задайте вопрос…" autocomplete="off">
            <button class="ai-chat__send" id="ai-chat-send" disabled aria-label="Отправить">
              <svg viewBox="0 0 24 24"><path d="M22 2L11 13" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ─── WIZARD PANEL (Онлайн-осмотр) ─── -->
      <div class="ai-panel" id="ai-panel-wizard">
        <div class="ai-panel__scroll">
          <div class="ai-wizard">

            <!-- Progress bar -->
            <div class="ai-wizard__progress">
              <div class="ai-wizard__progress-step is-current"></div>
              <div class="ai-wizard__progress-step"></div>
              <div class="ai-wizard__progress-step"></div>
              <div class="ai-wizard__progress-step"></div>
              <div class="ai-wizard__progress-step"></div>
            </div>

            <!-- Step info -->
            <div class="ai-wizard__step-info">
              <div class="ai-wizard__step-label">Шаг 1 из 5</div>
              <div class="ai-wizard__step-title">Выберите тип объекта</div>
            </div>

            <div class="ai-wizard__content">

              <!-- Step 1: Object type -->
              <div class="ai-wizard__step is-active" data-wizard-step="0">
                <div class="ai-wizard__types">
                  <button class="ai-wizard__type-card" data-type="apartment">
                    <span class="ai-wizard__type-icon-wrap">
                      <img src="assets/img/icons/light-wiz-apartment.jpg" data-dark="assets/img/icons/obs-wiz-apartment.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--obs" loading="lazy" decoding="async">
                      <img src="assets/img/icons/glow-wiz-apartment.jpg" data-dark="assets/img/icons/cry-wiz-apartment.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--cry" loading="lazy" decoding="async">
                    </span>
                    <span class="ai-wizard__type-label">Квартира</span>
                  </button>
                  <button class="ai-wizard__type-card" data-type="house">
                    <span class="ai-wizard__type-icon-wrap">
                      <img src="assets/img/icons/light-wiz-house.jpg" data-dark="assets/img/icons/obs-wiz-house.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--obs" loading="lazy" decoding="async">
                      <img src="assets/img/icons/glow-wiz-house.jpg" data-dark="assets/img/icons/cry-wiz-house.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--cry" loading="lazy" decoding="async">
                    </span>
                    <span class="ai-wizard__type-label">Дом</span>
                  </button>
                  <button class="ai-wizard__type-card" data-type="commercial">
                    <span class="ai-wizard__type-icon-wrap">
                      <img src="assets/img/icons/light-wiz-commercial.jpg" data-dark="assets/img/icons/obs-wiz-commercial.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--obs" loading="lazy" decoding="async">
                      <img src="assets/img/icons/glow-wiz-commercial.jpg" data-dark="assets/img/icons/cry-wiz-commercial.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--cry" loading="lazy" decoding="async">
                    </span>
                    <span class="ai-wizard__type-label">Коммерция</span>
                  </button>
                  <button class="ai-wizard__type-card" data-type="land">
                    <span class="ai-wizard__type-icon-wrap">
                      <img src="assets/img/icons/light-wiz-land.jpg" data-dark="assets/img/icons/obs-wiz-land.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--obs" loading="lazy" decoding="async">
                      <img src="assets/img/icons/glow-wiz-land.jpg" data-dark="assets/img/icons/cry-wiz-land.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--cry" loading="lazy" decoding="async">
                    </span>
                    <span class="ai-wizard__type-label">Земля</span>
                  </button>
                  <button class="ai-wizard__type-card" data-type="equipment">
                    <span class="ai-wizard__type-icon-wrap">
                      <img src="assets/img/icons/light-wiz-equipment.jpg" data-dark="assets/img/icons/obs-wiz-equipment.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--obs" loading="lazy" decoding="async">
                      <img src="assets/img/icons/glow-wiz-equipment.jpg" data-dark="assets/img/icons/cry-wiz-equipment.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--cry" loading="lazy" decoding="async">
                    </span>
                    <span class="ai-wizard__type-label">Оборудование</span>
                  </button>
                  <button class="ai-wizard__type-card" data-type="car">
                    <span class="ai-wizard__type-icon-wrap">
                      <img src="assets/img/icons/light-wiz-car.jpg" data-dark="assets/img/icons/obs-wiz-car.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--obs" loading="lazy" decoding="async">
                      <img src="assets/img/icons/glow-wiz-car.jpg" data-dark="assets/img/icons/cry-wiz-car.jpg" alt="" class="ai-wizard__type-img ai-wizard__type-img--cry" loading="lazy" decoding="async">
                    </span>
                    <span class="ai-wizard__type-label">Транспорт</span>
                  </button>
                </div>
              </div>

              <!-- Step 2: Object details -->
              <div class="ai-wizard__step" data-wizard-step="1">
                <div class="ai-wizard__field">
                  <label class="ai-wizard__label" for="wizard-address" id="wizard-address-label">Адрес объекта</label>
                  <input type="text" class="ai-wizard__input" id="wizard-address" placeholder="Город, улица, дом, квартира">
                </div>
                <div class="ai-wizard__field">
                  <label class="ai-wizard__label" for="wizard-area" id="wizard-area-label">Площадь (м²)</label>
                  <input type="text" class="ai-wizard__input" id="wizard-area" placeholder="Например, 65">
                </div>
                <div class="ai-wizard__field">
                  <label class="ai-wizard__label" for="wizard-purpose">Цель оценки</label>
                  <select class="ai-wizard__select" id="wizard-purpose">
                    <option value="" disabled selected>Выберите цель</option>
                    <option value="mortgage">Ипотека</option>
                    <option value="sale">Купля-продажа</option>
                    <option value="inheritance">Наследство</option>
                    <option value="court">Суд / раздел имущества</option>
                    <option value="insurance">Страхование</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
              </div>

              <!-- Step 3: Photos -->
              <div class="ai-wizard__step" data-wizard-step="2">
                <div class="ai-wizard__rule">Снимайте <b>горизонтально</b> — так кадр охватывает помещение целиком.</div>

                <div class="ai-wizard__upload-zone" id="wizard-upload-zone">
                  <span class="ai-wizard__upload-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></span>
                  <div class="ai-wizard__upload-text">Перетащите фото или нажмите для выбора</div>
                  <div class="ai-wizard__upload-hint" id="wizard-upload-hint">JPG, PNG, WEBP · до 20 МБ каждое</div>
                </div>
                <input type="file" id="wizard-file-input" multiple accept="image/*" style="display:none">

                <div class="ai-wizard__photo-status" id="wizard-photo-status" hidden></div>
                <div class="ai-wizard__photos" id="wizard-photos-grid"></div>

                <div class="ai-wizard__checklist-head">
                  <span id="wizard-checklist-title">Что снять</span>
                  <span class="ai-wizard__checklist-count" id="wizard-checklist-count"></span>
                </div>
                <div class="ai-wizard__checklist" id="wizard-checklist"></div>
              </div>

              <!-- Step 4: Contact info -->
              <div class="ai-wizard__step" data-wizard-step="3">
                <div class="ai-wizard__field">
                  <label class="ai-wizard__label" for="wizard-name">Ваше имя</label>
                  <input type="text" class="ai-wizard__input" id="wizard-name" autocomplete="name" placeholder="Как к вам обращаться?">
                </div>
                <div class="ai-wizard__field">
                  <label class="ai-wizard__label" for="wizard-phone">Телефон</label>
                  <input type="tel" class="ai-wizard__input" id="wizard-phone" autocomplete="tel" inputmode="tel" placeholder="+7 (___) ___-__-__">
                </div>
                <div class="ai-wizard__field">
                  <label class="ai-wizard__label" for="wizard-comment">Комментарий</label>
                  <input type="text" class="ai-wizard__input" id="wizard-comment" placeholder="Дополнительные детали...">
                </div>

                <label class="ai-wizard__consent">
                  <input type="checkbox" id="wizard-consent">
                  <span class="ai-wizard__consent-box" aria-hidden="true"></span>
                  <span class="ai-wizard__consent-text">Согласен на обработку персональных данных в соответствии с <a href="politika-konfidencialnosti.html" target="_blank" rel="noopener">Политикой</a></span>
                </label>
                <div class="ai-wizard__error" id="wizard-contact-error" hidden></div>
              </div>

              <!-- Step 5: Отправка -->
              <div class="ai-wizard__step" data-wizard-step="4">
                <div class="ai-wizard__success">
                  <div class="ai-wizard__success-icon">
                    <img src="assets/img/icons/glow-inspection.jpg" data-dark="assets/img/icons/cry-inspection.jpg" alt="" style="width:48px;height:48px;object-fit:contain;">
                  </div>
                  <div class="ai-wizard__success-title">Заявка готова</div>
                  <div class="ai-wizard__success-desc" id="wizard-send-desc">Осталось отправить её нам — выберите удобный способ. Фотографии приложатся к сообщению.</div>
                </div>

                <div class="ai-wizard__send" id="wizard-send-actions">
                  <button class="ai-wizard__send-btn ai-wizard__send-btn--primary" id="wizard-send-share" hidden>
                    Отправить с фотографиями
                  </button>
                  <a class="ai-wizard__send-btn" id="wizard-send-max" href="https://max.ru/u/f9LHodD0cOL0n-mRdnryGsw7EJZ7Zxtw55dK3RKrty99-5P9BsmoWjZU3_8" target="_blank" rel="noopener">
                    Написать в MAX
                  </a>
                  <a class="ai-wizard__send-btn" id="wizard-send-mail" href="#">Отправить почтой</a>
                  <button class="ai-wizard__send-btn ai-wizard__send-btn--ghost" id="wizard-send-copy">Скопировать заявку</button>
                </div>

                <div class="ai-wizard__photo-note" id="wizard-photo-note"></div>

                <div class="ai-wizard__send-note" id="wizard-send-note">
                  В MAX и почте текст заявки уже скопирован — вставьте его в сообщение и приложите фотографии.
                </div>

                <details class="ai-wizard__preview">
                  <summary>Посмотреть текст заявки</summary>
                  <pre id="wizard-preview-text"></pre>
                </details>
              </div>
            </div>

            <!-- Wizard Navigation -->
            <div class="ai-wizard__nav">
              <button class="ai-wizard__btn ai-wizard__btn--back" id="wizard-back" style="display:none">Назад</button>
              <button class="ai-wizard__btn ai-wizard__btn--next" id="wizard-next" disabled>Далее</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </aside>
  `;

  // ─── ПУТИ ПОД ВЛОЖЕННОСТЬ СТРАНИЦЫ ───
  // Разметка ниже написана от корня app_build/. Страницы в /uslugi/ лежат
  // на уровень глубже, поэтому правим пути ДО вставки: если чинить их после,
  // браузер успевает запросить картинки по неверному адресу и ловит десятки
  // ненужных 404. Path-fixer на самих страницах остаётся подстраховкой —
  // он пропускает пути, которые уже начинаются с «../».
  const depth = (location.pathname.match(/\/uslugi\//) ? '../' : '');

  function withBase(html) {
    if (!depth) return html;
    return html.replace(/\b(src|href|srcset|data-dark)="([^"]*)"/g, function (m, attr, val) {
      var fixed = val.split(',').map(function (part) {
        var piece = part.trim();
        if (!piece) return piece;
        var bits = piece.split(/\s+/);
        var url = bits[0];
        if (/^(https?:|mailto:|tel:|javascript:|data:|#|\/|\.\.\/)/.test(url)) return piece;
        url = url.replace(/^\.\//, '');
        // «uslugi/xxx» из /uslugi/ превращается в «xxx» — иначе выйдет uslugi/uslugi/
        url = url.indexOf('uslugi/') === 0 ? url.slice(7) : depth + url;
        bits[0] = url;
        return bits.join(' ');
      }).join(', ');
      return attr + '="' + fixed + '"';
    });
  }

  // ─── INJECT COMPONENTS ───
  const headerRoot = document.getElementById('shared-header');
  const footerRoot = document.getElementById('shared-footer');
  const aiRoot = document.getElementById('shared-ai-sidebar');

  if (headerRoot) {
    headerRoot.outerHTML = withBase(headerHTML);
  }

  if (footerRoot) {
    footerRoot.outerHTML = withBase(footerHTML);
  }

  if (aiRoot) {
    aiRoot.outerHTML = withBase(aiSidebarHTML);
  }

})();
