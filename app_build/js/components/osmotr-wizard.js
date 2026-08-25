/**
 * ═══════════════════════════════════════════════════════════
 * АКСИОМА — Онлайн-осмотр: мастер заявки
 *
 * Отдельный модуль (не часть ИИ-стека). Чтобы снять услугу —
 * убрать этот файл, css/osmotr-wizard.css и блок #ai-panel-wizard
 * в js/components/shared-components.js. Больше нигде не завязано.
 *
 * Бэкенда нет: заявка уходит через Web Share API (мобильные —
 * вместе с фотографиями), почту или MAX. Персональные данные
 * на сторонние серверы не отправляются — только в канал,
 * который клиент выбирает сам.
 *
 * Чек-листы съёмки — из docs/photo_instructions.md
 * (DOCX Ксении Чуевой, утверждено заказчиком).
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  var MAIL = 'aksiomaok@mail.ru';
  var DRAFT_KEY = 'aksioma_osmotr_draft';
  var MAX_FILE_MB = 20;
  var MAX_PHOTOS = 30;
  var MIN_WIDTH = 800;

  /* ─── Подготовка фото к отправке ───
     Замеры на тест-кадре (волосяная трещина 2 px на снимке 4000 px):
     контраст трещины 94 → 83 при 3200 px → 66 при 2560 px → 46 при 1920 px.
     То есть детали убивает УМЕНЬШЕНИЕ, а не степень сжатия: при одном и том
     же размере качество 0.82 и 0.90 дали одинаковый результат (66 и 67).
     Отсюда правило: сначала жмём качеством при исходном разрешении,
     уменьшаем только если иначе не отправить, и никогда ниже 2560 px —
     на этом рубеже трещины, VIN и показания одометра ещё читаются. */
  var KEEP_AS_IS_MB = 4;      // до этого размера файл не трогаем вовсе
  var BUDGET_MB = 45;         // разумный потолок одного отправления
  var MIN_LONG_SIDE = 2560;   // ниже не опускаемся ни при каких условиях
  var JPEG_QUALITY = 0.85;

  /* ─── Типы объектов: подписи, чек-листы, минимум фото ─── */
  var TYPES = {
    apartment: {
      label: 'Квартира',
      areaLabel: 'Площадь (м²)',
      areaPlaceholder: 'Например, 65',
      areaMode: 'decimal',
      addressPlaceholder: 'Город, улица, дом, квартира',
      minPhotos: 8,
      checklist: [
        'Дом снаружи с угла — виден весь дом и этажность',
        'Фасад с адресной табличкой',
        'Подъезд снаружи — дверь, перпендикулярно входу',
        'Подъезд внутри — лестничный пролёт',
        'Дверь в квартиру: закрытая и открытая',
        'Каждая комната — 2 фото с противоположных сторон',
        'Кухня, санузел и ванная',
        'Балкон и вид с него',
        'Двор и детская площадка'
      ]
    },
    house: {
      label: 'Дом',
      areaLabel: 'Площадь дома и участка',
      areaPlaceholder: 'Например, 120 м² дом, 8 соток участок',
      addressPlaceholder: 'Город или район, улица, номер дома',
      minPhotos: 8,
      checklist: [
        'Дом со всех сторон — видна этажность',
        'Фасад с адресной табличкой',
        'Подъездные пути — дорога к дому',
        'Дверь в дом: закрытая и открытая',
        'Каждое помещение — 2 фото с противоположных сторон',
        'Кухня, санузел и ванная',
        'Вид из окон',
        'Территория и хозяйственные постройки'
      ]
    },
    commercial: {
      label: 'Коммерческая недвижимость',
      areaLabel: 'Площадь (м²)',
      areaPlaceholder: 'Например, 240',
      areaMode: 'decimal',
      addressPlaceholder: 'Город, улица, дом, помещение',
      minPhotos: 6,
      checklist: [
        'Здание снаружи с угла',
        'Фасад с вывеской и адресом',
        'Входная группа',
        'Каждое помещение — 2 фото с противоположных сторон',
        'Санузлы и подсобные помещения',
        'Прилегающая территория и парковка'
      ]
    },
    land: {
      label: 'Земельный участок',
      areaLabel: 'Площадь участка',
      areaPlaceholder: 'Например, 10 соток',
      addressPlaceholder: 'Район, населённый пункт, кадастровый номер',
      minPhotos: 4,
      checklist: [
        'Участок со всех сторон',
        'Границы и ограждение',
        'Подъездные пути',
        'Постройки на участке, если есть',
        'Коммуникации на границе участка'
      ]
    },
    equipment: {
      label: 'Оборудование',
      areaLabel: 'Модель и год выпуска',
      areaPlaceholder: 'Например, токарный станок 1К62, 2015 г.',
      addressPlaceholder: 'Город, где находится оборудование',
      minPhotos: 4,
      checklist: [
        'Общий вид с нескольких ракурсов',
        'Шильдик с заводским номером',
        'Основные узлы и агрегаты',
        'Счётчик моточасов или наработки',
        'Дефекты и следы износа, если есть'
      ]
    },
    car: {
      label: 'Транспорт',
      areaLabel: 'Марка, модель, год выпуска',
      areaPlaceholder: 'Например, Toyota Camry, 2019',
      addressPlaceholder: 'Город, где находится автомобиль',
      minPhotos: 6,
      checklist: [
        'Вид с четырёх сторон по диагонали, с углов',
        'Салон — несколько фото',
        'Двигатель',
        'VIN-номер',
        'Пробег на одометре',
        'Повреждения, если есть'
      ]
    }
  };

  var PURPOSES = {
    mortgage: 'Ипотека',
    sale: 'Купля-продажа',
    inheritance: 'Наследство',
    court: 'Суд / раздел имущества',
    insurance: 'Страхование',
    other: 'Другое'
  };

  var STEP_TITLES = [
    'Выберите тип объекта',
    'Данные об объекте',
    'Фотографии',
    'Контактные данные',
    'Отправка заявки'
  ];

  /* ─── Состояние ─── */
  var sidebar, steps, btnNext, btnBack;
  var current = 0;
  var selectedType = null;
  var photos = [];           // { file, url, ok, warn, w, h }
  var checked = {};          // индекс пункта чек-листа → true
  var photoWarningShown = false;
  var photosReady = null;
  var requestText = '';
  var shareFiles = [];

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    sidebar = document.getElementById('ai-sidebar');
    if (!sidebar) return;
    btnNext = document.getElementById('wizard-next');
    btnBack = document.getElementById('wizard-back');
    steps = sidebar.querySelectorAll('.ai-wizard__step');
    if (!btnNext || !btnBack || !steps.length) return;

    bindTypes();
    bindNav();
    bindUpload();
    bindSend();
    restoreDraft();
    ['wizard-address', 'wizard-area', 'wizard-purpose', 'wizard-name', 'wizard-phone', 'wizard-comment']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', saveDraft);
      });
  }

  /* ─── Шаг 1: тип объекта ─── */
  function bindTypes() {
    sidebar.querySelectorAll('.ai-wizard__type-card').forEach(function (card) {
      card.addEventListener('click', function () {
        sidebar.querySelectorAll('.ai-wizard__type-card').forEach(function (c) {
          c.classList.remove('is-selected');
        });
        card.classList.add('is-selected');
        // Площадь квартиры не должна остаться в поле «Марка, модель, год»
        if (selectedType && selectedType !== card.dataset.type) {
          var area = document.getElementById('wizard-area');
          if (area) area.value = '';
        }
        selectedType = card.dataset.type;
        checked = {};
        photoWarningShown = false;
        applyType();
        updatePhotoStatus();
        btnNext.disabled = false;
        saveDraft();
      });
    });
  }

  function applyType() {
    var t = TYPES[selectedType];
    if (!t) return;

    setText('wizard-area-label', t.areaLabel);
    setAttr('wizard-area', 'placeholder', t.areaPlaceholder);
    // Цифровая клавиатура — только там, где ответ действительно число:
    // для дома и участка человек пишет «120 м² дом, 8 соток».
    setAttr('wizard-area', 'inputmode', t.areaMode || 'text');
    setAttr('wizard-address', 'placeholder', t.addressPlaceholder);
    setText('wizard-checklist-title', 'Что снять: ' + t.label.toLowerCase());
    setText('wizard-upload-hint',
      'JPG, PNG, WEBP · до ' + MAX_FILE_MB + ' МБ · нужно минимум ' + t.minPhotos + ' фото');

    var box = document.getElementById('wizard-checklist');
    if (!box) return;
    box.innerHTML = '';
    t.checklist.forEach(function (item, i) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'ai-wizard__check-item';
      row.setAttribute('aria-pressed', 'false');
      row.innerHTML = '<span class="ai-wizard__check-icon">○</span><span>' + escapeHtml(item) + '</span>';
      row.addEventListener('click', function () {
        checked[i] = !checked[i];
        row.classList.toggle('is-done', !!checked[i]);
        row.setAttribute('aria-pressed', checked[i] ? 'true' : 'false');
        row.querySelector('.ai-wizard__check-icon').textContent = checked[i] ? '✓' : '○';
        updateChecklistCount();
        saveDraft();
      });
      box.appendChild(row);
    });
    updateChecklistCount();
  }

  function updateChecklistCount() {
    var t = TYPES[selectedType];
    if (!t) return;
    var done = t.checklist.filter(function (_, i) { return checked[i]; }).length;
    setText('wizard-checklist-count', done + ' из ' + t.checklist.length);
  }

  /* ─── Навигация ─── */
  function bindNav() {
    btnNext.addEventListener('click', function () {
      if (!validateStep(current)) return;
      if (current === 2) startPhotoPrep();
      if (current === steps.length - 2) prepareRequest();
      if (current < steps.length - 1) goTo(current + 1);
    });
    btnBack.addEventListener('click', function () {
      if (current > 0) goTo(current - 1);
    });
  }

  function validateStep(step) {
    if (step === 0) return !!selectedType;

    if (step === 1) {
      var addr = val('wizard-address');
      if (!addr) {
        flash('wizard-address');
        return false;
      }
      return true;
    }

    if (step === 2) {
      var t = TYPES[selectedType];
      if (photos.some(function (p) { return p.pending; })) {
        showPhotoStatus('Проверяем снимки, секунду…', 'warn');
        return false;
      }
      var good = photos.filter(function (p) { return p.ok; }).length;
      // Предупреждаем один раз, но не запираем: неполный комплект лучше,
      // чем потерянная заявка — недостающее попросим на консультации.
      if (good < t.minPhotos && !photoWarningShown) {
        photoWarningShown = true;
        showPhotoStatus('Подходящих фото ' + good + ' из ' + t.minPhotos +
          '. Лучше добавить недостающие — так оценка будет точнее. Нажмите «Далее» ещё раз, если хотите продолжить как есть.', 'warn');
        return false;
      }
      return true;
    }

    if (step === 3) {
      var err = document.getElementById('wizard-contact-error');
      var name = val('wizard-name');
      var phone = val('wizard-phone');
      var consent = document.getElementById('wizard-consent');
      var digits = phone.replace(/\D/g, '');

      if (!name) return contactError(err, 'Напишите, как к вам обращаться.', 'wizard-name');
      if (digits.length < 10) return contactError(err, 'Проверьте номер телефона — нужно 10 цифр или больше.', 'wizard-phone');
      if (consent && !consent.checked) return contactError(err, 'Поставьте галочку согласия — без неё мы не вправе обрабатывать ваши данные.', null);

      if (err) err.hidden = true;
      return true;
    }

    return true;
  }

  function contactError(box, msg, focusId) {
    if (box) {
      box.textContent = msg;
      box.hidden = false;
    }
    if (focusId) flash(focusId);
    return false;
  }

  function goTo(step) {
    steps.forEach(function (s) { s.classList.remove('is-active'); });
    steps[step].classList.add('is-active');

    sidebar.querySelectorAll('.ai-wizard__progress-step').forEach(function (p, i) {
      p.classList.remove('is-current', 'is-complete');
      if (i < step) p.classList.add('is-complete');
      if (i === step) p.classList.add('is-current');
    });

    setText('wizard-step-label', 'Шаг ' + (step + 1) + ' из ' + steps.length);
    var label = sidebar.querySelector('.ai-wizard__step-label');
    var title = sidebar.querySelector('.ai-wizard__step-title');
    if (label) label.textContent = 'Шаг ' + (step + 1) + ' из ' + steps.length;
    if (title) title.textContent = STEP_TITLES[step] || '';

    btnBack.style.display = step > 0 ? '' : 'none';

    if (step === steps.length - 1) {
      btnNext.style.display = 'none';
      btnBack.style.display = '';
      btnBack.textContent = 'Назад';
    } else {
      btnNext.style.display = '';
      btnNext.textContent = step === steps.length - 2 ? 'Собрать заявку' : 'Далее';
      btnNext.disabled = step === 0 ? !selectedType : false;
    }

    current = step;
    var scroll = sidebar.querySelector('#ai-panel-wizard .ai-panel__scroll');
    if (scroll) scroll.scrollTop = 0;
  }

  /* ─── Шаг 3: фотографии ─── */
  function bindUpload() {
    var zone = document.getElementById('wizard-upload-zone');
    var input = document.getElementById('wizard-file-input');
    if (!zone || !input) return;

    // Зона загрузки должна открываться и с клавиатуры: без этого человек
    // без мыши не может приложить фото вообще — а ради фото мастер и сделан.
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('role', 'button');
    zone.setAttribute('aria-label', 'Выбрать фотографии объекта');
    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        input.click();
      }
    });
    input.addEventListener('change', function (e) {
      addFiles(e.target.files);
      input.value = '';
    });
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone.addEventListener('dragleave', function () { zone.classList.remove('is-dragover'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      addFiles(e.dataTransfer.files);
    });
  }

  function addFiles(files) {
    if (!files) return;
    var skippedType = 0, skippedLimit = 0, skippedDup = 0;
    Array.from(files).forEach(function (file) {
      // В Chrome на Windows у файла .heic пустой тип — раньше снимок с айфона
      // попадал в «это не картинки», что человека только запутывало.
      var isHeic = /\.hei[cf]$/i.test(file.name);
      if (!file.type.startsWith('image/') && !isHeic) { skippedType++; return; }

      var key = file.name + '|' + file.size + '|' + (file.lastModified || 0);
      if (photos.some(function (p) { return p.key === key; })) { skippedDup++; return; }
      if (photos.length >= MAX_PHOTOS) { skippedLimit++; return; }

      // pending: снимок ещё не проверен. Считать его пригодным заранее нельзя —
      // иначе быстрый клик «Далее» пропустит непроверенные кадры.
      var entry = { file: file, key: key, isHeic: isHeic, url: URL.createObjectURL(file),
                    ok: true, pending: true, warn: '' };

      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        entry.ok = false;
        entry.pending = false;
        entry.warn = 'Больше ' + MAX_FILE_MB + ' МБ';
      }

      photos.push(entry);
      renderPhotos();

      readExif(file).then(function (ex) {
        entry.exif = ex;
        renderPhotos();
      });

      var img = new Image();
      img.onload = function () {
        entry.w = img.naturalWidth;
        entry.h = img.naturalHeight;
        entry.pending = false;
        // Вертикальный кадр — это подсказка, а не отказ: VIN, одометр,
        // шильдик и адресную табличку снимают именно так, и раньше они
        // молча не уходили оценщику.
        if (entry.ok && entry.h > entry.w) {
          entry.warn = 'Лучше горизонтально';
        }
        if (entry.ok && entry.w < MIN_WIDTH) {
          entry.ok = false;
          entry.warn = 'Слишком мелкое';
        }
        renderPhotos();
      };
      // Браузер не открыл файл — например, HEIC с айфона вне Safari.
      // Без этой ветки такой снимок считался бы пригодным и ушёл бы в заявку.
      img.onerror = function () {
        entry.pending = false;
        entry.ok = false;
        entry.warn = 'Не открылось';
        renderPhotos();
      };
      img.src = entry.url;
    });

    // Молча терять файлы нельзя: человек решит, что приложил всё.
    if (skippedLimit || skippedType || skippedDup) {
      var msg = [];
      if (skippedLimit) msg.push('больше ' + MAX_PHOTOS + ' фото за раз не принимаем — ' +
        skippedLimit + ' не добавили');
      if (skippedDup) msg.push('повторов пропущено: ' + skippedDup);
      if (skippedType) msg.push(skippedType + ' файл(а) не картинки — пропустили');
      showPhotoStatus(msg.join('; ') + '.', 'warn');
    }
  }

  function renderPhotos() {
    var grid = document.getElementById('wizard-photos-grid');
    if (!grid) return;
    grid.innerHTML = '';

    photos.forEach(function (p, i) {
      var thumb = document.createElement('div');
      thumb.className = 'ai-wizard__photo-thumb' + (p.ok ? '' : ' is-bad');

      var img = document.createElement('img');
      img.src = p.url;
      img.alt = '';
      thumb.appendChild(img);

      if (!p.ok) {
        var badge = document.createElement('span');
        badge.className = 'ai-wizard__photo-warn';
        badge.textContent = p.warn;
        thumb.appendChild(badge);
      }

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'ai-wizard__photo-del';
      del.setAttribute('aria-label', 'Убрать фото');
      del.textContent = '×';
      del.addEventListener('click', function () {
        URL.revokeObjectURL(p.url);
        photos.splice(i, 1);
        renderPhotos();
      });
      thumb.appendChild(del);

      grid.appendChild(thumb);
    });

    photosReady = null;
    updatePhotoStatus();
  }

  function updatePhotoStatus() {
    var t = TYPES[selectedType];
    if (!t) return;
    var good = photos.filter(function (p) { return p.ok; }).length;
    var bad = photos.length - good;

    if (!photos.length) {
      showPhotoStatus('', 'hide');
      return;
    }
    if (bad) {
      showPhotoStatus('Годных фото: ' + good + ' из ' + t.minPhotos +
        '. Отмеченные ' + bad + ' не отправятся — удалите их или переснимите.', 'warn');
      return;
    }
    var vertical = photos.filter(function (p) { return p.warn === 'Лучше горизонтально'; }).length;
    if (vertical) {
      showPhotoStatus('Фото готовы: ' + good + '. Вертикальных кадров: ' + vertical +
        ' — они уйдут, но горизонтальные читаются лучше.', 'warn');
      return;
    }
    showPhotoStatus(
      (good >= t.minPhotos
        ? 'Фотографии в порядке: ' + good + ' шт. Можно двигаться дальше.'
        : 'Загружено ' + good + ' из ' + t.minPhotos + ' — добавьте ещё.') + exifHint(),
      good >= t.minPhotos ? 'ok' : 'warn'
    );
  }

  /** Подсказка о данных съёмки: их отсутствие обычно значит пересылку через мессенджер. */
  function exifHint() {
    var checked = photos.filter(function (p) { return p.exif; });
    if (checked.length < photos.length) return '';
    var without = checked.filter(function (p) { return !p.exif.present; }).length;
    if (!without) return '';
    return without === photos.length
      ? ' У снимков нет данных о съёмке — похоже, их пересылали через мессенджер. Лучше взять оригиналы из галереи: дата и место съёмки пригодятся, если дело дойдёт до суда.'
      : ' У ' + without + ' снимков нет данных о съёмке — возможно, они пересланы через мессенджер. Оригиналы из галереи надёжнее.';
  }

  function showPhotoStatus(msg, kind) {
    var box = document.getElementById('wizard-photo-status');
    if (!box) return;
    if (kind === 'hide' || !msg) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.textContent = msg;
    box.className = 'ai-wizard__photo-status is-' + kind;
  }

  /* ═══ EXIF ═══
     Дата съёмки и геометка — доказательственная информация: в споре
     они подтверждают, когда и где сделан кадр. Поэтому:
       · оригиналы по возможности не трогаем вовсе;
       · если всё же пережимаем — переносим блок APP1 в новый файл;
       · если EXIF нет вовсе (кадр прогнали через мессенджер или это
         скриншот) — честно предупреждаем клиента.
     Разбираем минимум: DateTimeOriginal и координаты GPS. */

  function readExif(file) {
    return file.slice(0, 256 * 1024).arrayBuffer().then(function (buf) {
      try { return parseExif(buf); } catch (e) { return { present: false }; }
    }).catch(function () { return { present: false }; });
  }

  function parseExif(buf) {
    var v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return { present: false };   // не JPEG

    // Ищем сегмент APP1 с сигнатурой "Exif\0\0"
    var p = 2, app1 = null;
    while (p + 4 < v.byteLength) {
      if (v.getUint8(p) !== 0xFF) break;
      var marker = v.getUint8(p + 1);
      var len = v.getUint16(p + 2);
      if (marker === 0xE1 && v.getUint32(p + 4) === 0x45786966) {
        app1 = { start: p, length: len + 2, tiff: p + 10 };
        break;
      }
      if (marker === 0xDA) break;                                // начались данные
      p += 2 + len;
    }
    if (!app1) return { present: false };

    var t = app1.tiff;
    var le = v.getUint16(t) === 0x4949;                          // II — little endian
    if (v.getUint16(t + 2, le) !== 0x2A) return { present: false };

    var out = { present: true, block: new Uint8Array(buf, app1.start, app1.length) };
    var ifd0 = t + v.getUint32(t + 4, le);
    var exifPtr = null, gpsPtr = null;

    eachEntry(v, ifd0, t, le, function (tag, type, count, valOff) {
      if (tag === 0x8769) exifPtr = t + v.getUint32(valOff, le);
      if (tag === 0x8825) gpsPtr = t + v.getUint32(valOff, le);
    });

    if (exifPtr) {
      eachEntry(v, exifPtr, t, le, function (tag, type, count, valOff) {
        if (tag === 0x9003 || tag === 0x9004) {                  // DateTimeOriginal / DateTimeDigitized
          if (out.date) return;
          var off = count > 4 ? t + v.getUint32(valOff, le) : valOff;
          var s = '';
          for (var i = 0; i < Math.min(count, 19); i++) s += String.fromCharCode(v.getUint8(off + i));
          out.date = s.replace(/\0/g, '').trim() || null;
        }
      });
    }

    if (gpsPtr) {
      var lat = null, lon = null, latRef = 'N', lonRef = 'E';
      eachEntry(v, gpsPtr, t, le, function (tag, type, count, valOff) {
        if (tag === 0x0001) latRef = String.fromCharCode(v.getUint8(valOff));
        if (tag === 0x0003) lonRef = String.fromCharCode(v.getUint8(valOff));
        if (tag === 0x0002) lat = dms(v, t + v.getUint32(valOff, le), le);
        if (tag === 0x0004) lon = dms(v, t + v.getUint32(valOff, le), le);
      });
      if (lat !== null && lon !== null) {
        out.lat = (latRef === 'S' ? -lat : lat);
        out.lon = (lonRef === 'W' ? -lon : lon);
      }
    }

    return out;
  }

  function eachEntry(v, ifd, tiff, le, fn) {
    if (ifd + 2 > v.byteLength) return;
    var n = v.getUint16(ifd, le);
    for (var i = 0; i < n; i++) {
      var e = ifd + 2 + i * 12;
      if (e + 12 > v.byteLength) return;
      fn(v.getUint16(e, le), v.getUint16(e + 2, le), v.getUint32(e + 4, le), e + 8);
    }
  }

  function dms(v, off, le) {
    if (off + 24 > v.byteLength) return null;
    var d = v.getUint32(off, le) / v.getUint32(off + 4, le);
    var m = v.getUint32(off + 8, le) / v.getUint32(off + 12, le);
    var s = v.getUint32(off + 16, le) / v.getUint32(off + 20, le);
    return d + m / 60 + s / 3600;
  }

  /** Вставить исходный EXIF-блок в пересжатый JPEG (сразу после SOI). */
  function spliceExif(block, blob) {
    if (!block) return Promise.resolve(blob);
    return blob.arrayBuffer().then(function (buf) {
      var src = new Uint8Array(buf);
      if (src[0] !== 0xFF || src[1] !== 0xD8) return blob;
      var out = new Uint8Array(2 + block.length + (src.length - 2));
      out.set(src.subarray(0, 2), 0);
      out.set(block, 2);
      out.set(src.subarray(2), 2 + block.length);
      return new Blob([out], { type: 'image/jpeg' });
    }).catch(function () { return blob; });
  }

  function formatExifDate(s) {
    var m = /^(\d{4}):(\d{2}):(\d{2})/.exec(s || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : null;
  }

  /* ─── Подготовка снимков: качеством, а не размером ─── */
  function preparePhotos(files) {
    var total = files.reduce(function (s, f) { return s + f.size; }, 0);
    var budget = BUDGET_MB * 1024 * 1024;

    if (total <= budget) {
      return Promise.resolve({ files: files, untouched: files.length, resized: 0, overBudget: false });
    }

    // Проход 1: тяжёлые файлы пережимаем качеством, разрешение не трогаем.
    return mapSeries(files, function (f) {
      return f.size <= KEEP_AS_IS_MB * 1024 * 1024 ? Promise.resolve(f) : reencode(f, Infinity);
    }).then(function (pass1) {
      var t1 = pass1.reduce(function (s, f) { return s + f.size; }, 0);
      if (t1 <= budget) {
        return { files: pass1, untouched: countSame(files, pass1), resized: 0, overBudget: false };
      }
      // Проход 2: только теперь уменьшаем — и не ниже порога читаемости.
      return mapSeries(pass1, function (f) { return reencode(f, MIN_LONG_SIDE); })
        .then(function (pass2) {
          var t2 = pass2.reduce(function (s, f) { return s + f.size; }, 0);
          return {
            files: pass2,
            untouched: 0,
            resized: pass2.length,
            overBudget: t2 > budget
          };
        });
    });
  }

  function countSame(before, after) {
    return after.filter(function (f, i) { return f === before[i]; }).length;
  }

  function mapSeries(items, fn) {
    var out = [];
    return items.reduce(function (chain, item) {
      return chain.then(function () {
        return fn(item).then(function (r) {
          out.push(r);
          onProgress(out.length, items.length);
        });
      });
    }, Promise.resolve()).then(function () { return out; });
  }

  function onProgress(done, total) {
    setText('wizard-photo-note', 'Готовим фотографии: ' + done + ' из ' + total + '…');
  }

  /* Запускаем подготовку заранее — пока человек заполняет контакты,
     снимки успевают пережаться, и на шаге отправки ждать уже нечего. */
  function startPhotoPrep() {
    var good = photos.filter(function (p) { return p.ok; }).map(function (p) { return p.file; });
    shareFiles = good;
    if (!good.length) {
      photosReady = Promise.resolve({ files: [], untouched: 0, resized: 0, overBudget: false });
      return;
    }
    setText('wizard-photo-note', 'Готовим фотографии…');
    photosReady = preparePhotos(good).then(function (res) {
      shareFiles = res.files;
      setText('wizard-photo-note', photoNote(res));   // счётчик не должен зависнуть
      return res;
    });
  }

  function reencode(file, maxLongSide) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var long = Math.max(img.naturalWidth, img.naturalHeight);
        var scale = maxLongSide === Infinity || long <= maxLongSide ? 1 : maxLongSide / long;
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.naturalWidth * scale);
        cv.height = Math.round(img.naturalHeight * scale);
        var ctx = cv.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob(function (blob) {
          URL.revokeObjectURL(url);
          if (!blob || blob.size >= file.size) return resolve(file);   // не стало легче — оставляем оригинал
          // canvas выбрасывает EXIF — возвращаем исходный блок на место
          spliceExif(exifBlock(file), blob).then(function (withExif) {
            resolve(new File([withExif], file.name, {
              type: 'image/jpeg',
              lastModified: file.lastModified
            }));
          });
        }, 'image/jpeg', JPEG_QUALITY);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  }

  /** EXIF-блок исходного файла — по нему потом восстанавливаем данные съёмки. */
  function exifBlock(file) {
    var entry = photos.filter(function (p) { return p.file === file; })[0];
    return entry && entry.exif ? entry.exif.block : null;
  }

  /* ─── Шаг 5: сборка и отправка ─── */
  function prepareRequest() {
    var t = TYPES[selectedType] || { label: '—', checklist: [] };
    var purposeSel = document.getElementById('wizard-purpose');
    var purpose = purposeSel && purposeSel.value ? (PURPOSES[purposeSel.value] || purposeSel.value) : '';
    var good = photos.filter(function (p) { return p.ok; });
    var doneItems = t.checklist.filter(function (_, i) { return checked[i]; });

    var lines = [
      'Заявка на онлайн-осмотр',
      '',
      'Тип объекта: ' + t.label,
      'Адрес: ' + val('wizard-address')
    ];
    if (val('wizard-area')) lines.push(t.areaLabel + ': ' + val('wizard-area'));
    if (purpose) lines.push('Цель оценки: ' + purpose);
    lines.push('');
    lines.push('Имя: ' + val('wizard-name'));
    lines.push('Телефон: ' + val('wizard-phone'));
    if (val('wizard-comment')) lines.push('Комментарий: ' + val('wizard-comment'));
    lines.push('');
    lines.push('Фотографий подготовлено: ' + good.length);
    if (doneItems.length) {
      lines.push('Отснято по списку: ' + doneItems.length + ' из ' + t.checklist.length);
    }
    var shot = shootingInfo(good);
    if (shot.dates) lines.push('Дата съёмки: ' + shot.dates);
    if (shot.coords) lines.push('Координаты съёмки: ' + shot.coords);
    if (shot.without) lines.push('Без данных съёмки: ' + shot.without + ' фото');
    lines.push('');
    lines.push('Согласие на обработку персональных данных получено.');

    requestText = lines.join('\n');
    setText('wizard-preview-text', requestText);

    if (!photosReady) startPhotoPrep();
    // Пока снимки готовятся, отправлять нечего: иначе уйдут неподготовленные
    // оригиналы и вся работа по сжатию пропадёт.
    var shareBtnEarly = document.getElementById('wizard-send-share');
    if (shareBtnEarly && shareFiles.length) {
      shareBtnEarly.disabled = true;
      shareBtnEarly.textContent = 'Готовим фотографии…';
    }
    photosReady.then(function (res) {
      shareFiles = res.files;
      var readyBtn = document.getElementById('wizard-send-share');
      if (readyBtn) {
        readyBtn.hidden = !canShareFiles();
        readyBtn.disabled = false;
        readyBtn.textContent = 'Отправить с фотографиями';
      }
      setText('wizard-photo-note', photoNote(res));
    });

    var mail = document.getElementById('wizard-send-mail');
    if (mail) {
      mail.href = 'mailto:' + MAIL +
        '?subject=' + encodeURIComponent('Заявка на онлайн-осмотр — ' + t.label) +
        '&body=' + encodeURIComponent(requestText + '\n\n(Фотографии приложу к письму отдельно.)');
    }

    var shareBtn = document.getElementById('wizard-send-share');
    var canShare = canShareFiles();
    if (shareBtn) shareBtn.hidden = !canShare;

    setText('wizard-send-desc', canShare
      ? 'Осталось отправить её нам — фотографии уйдут вместе с текстом.'
      : 'Осталось отправить её нам. Текст заявки скопируется сам — вставьте его в сообщение и приложите фотографии.');

    var fileHint = good.length
      ? ' В мессенджере выбирайте отправку файлом, а не «как фото»: так снимки дойдут в исходном качестве, с датой и местом съёмки.'
      : '';

    setText('wizard-send-note', (canShare
      ? 'Если удобнее — можно написать в MAX или на почту: текст заявки при этом копируется в буфер обмена.'
      : 'Снимки лежат у вас на устройстве — выберите их в письме или в чате. С телефона отправить получится одним касанием.') + fileHint);

  }

  /** Сводка по данным съёмки для текста заявки. Принимает записи из photos. */
  function shootingInfo(items) {
    var entries = items.filter(function (p) { return p.exif; });
    var dates = entries.map(function (p) { return formatExifDate(p.exif.date); }).filter(Boolean);
    var uniq = dates.filter(function (d, i) { return dates.indexOf(d) === i; }).sort();
    var withGps = entries.filter(function (p) { return p.exif.lat !== undefined; });
    var without = entries.filter(function (p) { return !p.exif.present; }).length;

    var coords = null;
    if (withGps.length) {
      var g = withGps[0].exif;
      coords = g.lat.toFixed(5) + ', ' + g.lon.toFixed(5) +
        (withGps.length < entries.length ? ' (есть у ' + withGps.length + ' из ' + entries.length + ' фото)' : '');
    }

    return {
      dates: uniq.length ? (uniq.length === 1 ? uniq[0] : uniq[0] + ' — ' + uniq[uniq.length - 1]) : null,
      coords: coords,
      without: without || null
    };
  }

  function photoNote(res) {
    if (!res.files.length) return '';
    var mb = Math.round(res.files.reduce(function (s, f) { return s + f.size; }, 0) / 1024 / 1024);
    if (res.resized) {
      return 'Снимки уменьшены до ' + MIN_LONG_SIDE + ' px — на этом размере трещины, ' +
        'номера и показания приборов ещё читаются. Итого ' + mb + ' МБ.' +
        (res.overBudget ? ' Файлов много: отправьте их в два приёма.' : '');
    }
    if (res.untouched === res.files.length) {
      return 'Фотографии отправятся в исходном качестве (' + mb + ' МБ).';
    }
    return 'Тяжёлые снимки пережаты без потери разрешения — детали на месте. Итого ' + mb + ' МБ.';
  }

  function canShareFiles() {
    return !!(navigator.canShare && shareFiles.length &&
      navigator.canShare({ files: shareFiles.slice(0, 10) }));
  }

  function bindSend() {
    var shareBtn = document.getElementById('wizard-send-share');
    if (shareBtn) {
      var sentUpTo = 0;
      shareBtn.addEventListener('click', function () {
        var batch = shareFiles.slice(sentUpTo, sentUpTo + 10);
        if (!batch.length) return;
        shareBtn.disabled = true;
        navigator.share({
          title: 'Заявка на онлайн-осмотр — Аксиома',
          // Текст заявки идёт только с первой партией, дальше — одни фото.
          text: sentUpTo ? 'Фотографии к заявке — Аксиома' : requestText,
          files: batch
        }).then(function () {
          sentUpTo += batch.length;
          var left = shareFiles.length - sentUpTo;
          if (left > 0) {
            shareBtn.textContent = 'Отправить ещё ' + Math.min(left, 10) + ' фото';
            setText('wizard-send-note', 'Отправлено ' + sentUpTo + ' из ' + shareFiles.length +
              '. Нажмите ещё раз — уйдут следующие.');
          } else {
            clearDraft();
            shareBtn.textContent = 'Отправлено';
            setText('wizard-send-desc', 'Заявка отправлена. Мы свяжемся с вами в рабочее время.');
            setText('wizard-send-note', 'Все фотографии ушли.');
          }
        }).catch(function (e) {
          // Отмену человеком не показываем, а настоящий сбой раньше тоже
          // проходил в тишине — человек жал кнопку и не понимал, что не так.
          if (e && e.name === 'AbortError') return;
          setText('wizard-send-note',
            'Отправить не получилось — попробуйте почту или «Скопировать заявку».');
        }).then(function () {
          shareBtn.disabled = false;
        });
      });
    }

    var copyBtn = document.getElementById('wizard-send-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        copyText(requestText, function (ok) {
          // Чистим черновик только по подтверждённому успеху: если копирование
          // не удалось, человеку придётся вводить всё заново.
          if (ok) clearDraft();
          copyBtn.textContent = ok ? 'Заявка скопирована' : 'Не удалось скопировать';
          setTimeout(function () { copyBtn.textContent = 'Скопировать заявку'; }, 2500);
        });
      });
    }

    ['wizard-send-max', 'wizard-send-mail'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function () {
        clearDraft();                       // человек ушёл отправлять — черновик отработал
        copyText(requestText, function (ok) {
          setText('wizard-send-note', ok
            ? 'Текст заявки скопирован — вставьте его в сообщение и приложите фотографии.'
            : 'Скопировать текст не получилось. Откройте «Посмотреть текст заявки» ниже и скопируйте вручную.');
        });
      });
    });
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');   // может вернуть false без исключения
      document.body.removeChild(ta);
      done(ok);
    } catch (e) {
      done(false);
    }
  }

  /* ─── Черновик ─── */
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        type: selectedType,
        checked: checked,
        fields: {
          address: val('wizard-address'),
          area: val('wizard-area'),
          purpose: val('wizard-purpose'),
          name: val('wizard-name'),
          phone: val('wizard-phone'),
          comment: val('wizard-comment')
        }
      }));
    } catch (e) { /* приватный режим — просто не сохраняем */ }
  }

  function restoreDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;

    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d || !d.type || !TYPES[d.type]) return;

    selectedType = d.type;
    checked = d.checked || {};

    var card = sidebar.querySelector('.ai-wizard__type-card[data-type="' + d.type + '"]');
    if (card) card.classList.add('is-selected');
    applyType();

    sidebar.querySelectorAll('#wizard-checklist .ai-wizard__check-item').forEach(function (row, i) {
      if (!checked[i]) return;
      row.classList.add('is-done');
      row.setAttribute('aria-pressed', 'true');
      row.querySelector('.ai-wizard__check-icon').textContent = '✓';
    });
    updateChecklistCount();

    var f = d.fields || {};
    setVal('wizard-address', f.address);
    setVal('wizard-area', f.area);
    setVal('wizard-purpose', f.purpose);
    setVal('wizard-name', f.name);
    setVal('wizard-phone', f.phone);
    setVal('wizard-comment', f.comment);

    btnNext.disabled = false;
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* нечего чистить */ }
  }

  /* ─── Мелочи ─── */
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setVal(id, v) {
    var el = document.getElementById(id);
    if (el && v) el.value = v;
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setAttr(id, attr, v) {
    var el = document.getElementById(id);
    if (el) el.setAttribute(attr, v);
  }

  function flash(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add('is-invalid');
    el.focus();
    setTimeout(function () { el.classList.remove('is-invalid'); }, 1600);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

})();
