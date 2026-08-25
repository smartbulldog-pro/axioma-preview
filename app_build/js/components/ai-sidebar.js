/**
 * ═══════════════════════════════════════════════════════════
 * АКСИОМА — AI Sidebar Controller v3
 * Tabs (Эксперт / Онлайн-осмотр), neural brain canvas,
 * off-topic detection. Мастер осмотра — osmotr-wizard.js
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Путь от корня app_build/; страницы услуг лежат на уровень глубже.
  // Версия в конце обязательна: без неё браузер держит старую базу в кеше,
  // и помощник продолжает называть прежние цены после обновления данных.
  var KB_VERSION = '20260825c';
  var KB_PATH = (location.pathname.indexOf('/uslugi/') > -1 ? '../' : '') +
    'ai/knowledge-base.json?v=' + KB_VERSION;
  var TYPING_DELAY = 300;
  var TYPING_DURATION = 800;
  var currentPageId = document.body.getAttribute('data-page-id') || 'home';
  var kbData = null;
  var hasMessages = false;

  /* ─── DOM ─── */
  var sidebar, dimmer, toggleBtn, closeBtn;
  var chatScroll, chatInput, chatSend, greeting;
  var tabs, panels;

  /* ─── FRIENDLY OFF-TOPIC RESPONSES ─── */
  var offTopicReplies = [
    'Увы, это выходит за мою компетенцию 😊 Я специализируюсь на оценке имущества. Попробуйте спросить о стоимости оценки или необходимых документах!',
    'Интересный вопрос, но я разбираюсь только в оценке имущества. Давайте поговорим об этом? Спросите, например, «сколько стоит оценка квартиры?»',
    'Хм, это не совсем моя тема. Зато я отлично знаю всё про оценку недвижимости, бизнеса и оборудования! Чем помочь?',
    'Я бы с радостью помог, но умею только в оценку 🏠 Зато в этом я эксперт! Спросите про сроки, документы или стоимость.'
  ];

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  var neuralInited = false;

  function boot() {
    sidebar   = document.getElementById('ai-sidebar');
    dimmer    = document.getElementById('ai-dimmer');
    toggleBtn = document.getElementById('ai-toggle');
    closeBtn  = document.getElementById('ai-close');
    chatScroll = document.getElementById('ai-chat-messages');
    chatInput = document.getElementById('ai-chat-input');
    chatSend  = document.getElementById('ai-chat-send');
    greeting  = document.getElementById('ai-greeting');

    if (!sidebar || !toggleBtn) return;

    bindEvents();
    loadKnowledgeBase();
  }

  /* ─── EVENTS ─── */
  function bindEvents() {
    toggleBtn.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    dimmer.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
        closeSidebar();
      }
    });

    // Chat
    if (chatInput && chatSend) {
      chatSend.addEventListener('click', sendMessage);
      chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      chatInput.addEventListener('input', function () {
        chatSend.disabled = !chatInput.value.trim();
      });
    }

    // Topic starters
    sidebar.querySelectorAll('.ai-starters__link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var question = btn.dataset.question;
        if (question) {
          chatInput.value = question;
          sendMessage();
        }
      });
    });

    // Tabs
    sidebar.querySelectorAll('.ai-tabs__card').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var panelId = tab.dataset.panel;
        sidebar.querySelectorAll('.ai-tabs__card').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        sidebar.querySelectorAll('.ai-panel').forEach(function (p) { p.classList.remove('is-active'); });
        var panel = document.getElementById(panelId);
        if (panel) panel.classList.add('is-active');
      });
    });

    // Wizard
  }

  /* ─── SIDEBAR TOGGLE ─── */
  function toggleSidebar() {
    sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
  }

  function openSidebar() {
    sidebar.classList.add('is-open');
    dimmer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    toggleBtn.setAttribute('aria-expanded', 'true');
    setTimeout(function () { chatInput && chatInput.focus(); }, 600);

    // Init neural canvas on first open (needs visible dimensions)
    if (!neuralInited) {
      setTimeout(function () {
        var neuralCanvas = document.getElementById('neural-canvas');
        if (neuralCanvas && typeof NeuralBrain !== 'undefined') {
          NeuralBrain.init(neuralCanvas);
          neuralInited = true;
        }
      }, 100);
    }
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    dimmer.classList.remove('is-open');
    document.body.style.overflow = '';
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  /* ─── KB LOADING ─── */
  function loadKnowledgeBase() {
    fetch(KB_PATH)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        kbData = data;
        if (typeof AxiomaRAG !== 'undefined' && data.pages) {
          AxiomaRAG.init(data.pages);
        }
      })
      .catch(function (err) {
        console.warn('AI Knowledge Base not loaded:', err);
      });
  }

  /* ─── MESSAGES ─── */
  function hideGreeting() {
    if (greeting && !hasMessages) {
      greeting.classList.add('is-hidden');
      hasMessages = true;
      // Fly brain orb to mini position
      var orb = document.getElementById('ai-brain-orb');
      if (orb) {
        orb.classList.add('is-mini');
        // Re-init canvas after resize transition
        setTimeout(function () {
          if (typeof NeuralBrain !== 'undefined') {
            NeuralBrain.resize();
          }
        }, 850);
      }
      // Add padding class for messages
      var panel = document.getElementById('ai-panel-chat');
      if (panel) panel.classList.add('ai-panel--has-messages');
    }
  }

  function addBotMessage(text, suggestions, isOffTopic) {
    if (!chatScroll) return;
    hideGreeting();

    var msg = document.createElement('div');
    msg.className = 'ai-msg ai-msg--bot';
    msg.textContent = text;

    if (suggestions && suggestions.length) {
      var sugDiv = document.createElement('div');
      sugDiv.className = 'ai-msg__suggestions';
      suggestions.forEach(function (s) {
        var btn = document.createElement('button');
        btn.className = 'ai-msg__suggestion';
        btn.textContent = s;
        btn.addEventListener('click', function () {
          chatInput.value = s;
          sendMessage();
        });
        sugDiv.appendChild(btn);
      });
      msg.appendChild(sugDiv);
    }

    chatScroll.appendChild(msg);
    scrollChat();
  }

  function addUserMessage(text) {
    if (!chatScroll) return;
    hideGreeting();
    var msg = document.createElement('div');
    msg.className = 'ai-msg ai-msg--user';
    msg.textContent = text;
    chatScroll.appendChild(msg);
    scrollChat();
  }

  function showTyping() {
    if (!chatScroll) return;
    var typing = document.createElement('div');
    typing.className = 'ai-msg ai-msg--bot ai-msg--typing';
    typing.id = 'ai-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatScroll.appendChild(typing);
    scrollChat();
  }

  function hideTyping() {
    var typing = document.getElementById('ai-typing');
    if (typing) typing.remove();
  }

  function scrollChat() {
    if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
  }

  /* ─── SEND ─── */
  function sendMessage() {
    var text = chatInput.value.trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = '';
    chatSend.disabled = true;

    var orb = document.getElementById('ai-brain-orb');

    // Neural brain → thinking mode (CSS class + canvas)
    if (orb) {
      orb.classList.remove('is-error');
      orb.classList.add('is-thinking');
    }
    if (typeof NeuralBrain !== 'undefined') {
      NeuralBrain.setMode('thinking');
    }

    setTimeout(function () {
      showTyping();
      setTimeout(function () {
        hideTyping();
        var answer = findAnswer(text);

        // Neural brain → success or error
        if (orb) {
          orb.classList.remove('is-thinking');
          if (answer.isOffTopic) {
            orb.classList.add('is-error');
            orb.classList.add('neural-shake');
            setTimeout(function () {
              orb.classList.remove('neural-shake');
            }, 600);
            // Clear error after 3s
            setTimeout(function () {
              orb.classList.remove('is-error');
            }, 3000);
          }
        }
        if (typeof NeuralBrain !== 'undefined') {
          NeuralBrain.setMode(answer.isOffTopic ? 'error' : 'success', 2000);
        }

        addBotMessage(answer.text, answer.suggestions, answer.isOffTopic);
      }, TYPING_DURATION);
    }, TYPING_DELAY);
  }

  /* ─── RAG SEARCH + OFF-TOPIC DETECTION ─── */
  function findAnswer(query) {
    // RAG first
    if (typeof AxiomaRAG !== 'undefined' && AxiomaRAG.isReady()) {
      var results = AxiomaRAG.search(query, currentPageId, 3);
      if (results.length > 0 && results[0].score > 0.05) {
        var top = results[0].doc;
        var suggestions = results.slice(1, 3).map(function (r) { return r.doc.question; });
        return { text: top.answer, suggestions: suggestions, isOffTopic: false };
      }
    }

    // Keyword fallback
    if (kbData && kbData.pages) {
      var lowerQ = query.toLowerCase();
      var bestMatch = null;
      var bestScore = 0;

      kbData.pages.forEach(function (page) {
        (page.faq || []).forEach(function (item) {
          var combined = (item.question + ' ' + item.answer + ' ' + (item.keywords || []).join(' ')).toLowerCase();
          var words = lowerQ.split(/\s+/).filter(function (w) { return w.length > 2; });
          var score = 0;
          words.forEach(function (w) {
            if (combined.indexOf(w) > -1) score++;
          });
          if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
          }
        });
      });

      if (bestMatch && bestScore >= 2) {
        return { text: bestMatch.answer, suggestions: [], isOffTopic: false };
      }
    }

    // Off-topic → friendly response + red neural flash
    var isRelated = isQueryRelated(query);

    if (isRelated) {
      var company = (kbData && kbData.company) || {};
      var phone = company.phone || '+7 913 099-88-81';
      return {
        text: (kbData && kbData.escalation && kbData.escalation.message)
          || 'Хороший вопрос! Для точного ответа лучше поговорить с нашим специалистом. Позвоните: ' + phone,
        suggestions: ['Сколько стоит оценка?', 'Какие документы нужны?'],
        isOffTopic: false
      };
    }

    // Totally off-topic
    var randomReply = offTopicReplies[Math.floor(Math.random() * offTopicReplies.length)];
    return {
      text: randomReply,
      suggestions: ['Сколько стоит оценка?', 'Какие документы нужны?', 'Какие сроки?'],
      isOffTopic: true
    };
  }

  function isQueryRelated(query) {
    var keywords = [
      'оценк', 'оцен', 'стоимост', 'цен', 'ценка', 'сколько',
      'документ', 'справк', 'отчёт', 'отчет', 'срок', 'быстр', 'дней',
      'квартир', 'дом', 'недвижимост', 'земл', 'участок', 'коммерч',
      'бизнес', 'оборудован', 'транспорт', 'машин', 'авто',
      'ипотек', 'банк', 'наследств', 'суд', 'разд', 'страхов',
      'осмотр', 'фото', 'онлайн', 'дистанц',
      'аксиома', 'контакт', 'телефон', 'адрес', 'связ',
      'юрид', 'правов', 'ущерб', 'нотариус'
    ];
    var lower = query.toLowerCase();
    return keywords.some(function (k) { return lower.indexOf(k) > -1; });
  }

  /* Мастер «Онлайн-осмотр» вынесен в js/components/osmotr-wizard.js */

})();
