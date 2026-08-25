/**
 * ═══════════════════════════════════════════════════════════
 * АКСИОМА — GSAP Cinematic Engine
 * Lenis smooth scroll + GSAP ScrollTrigger
 * The exact stack used by Lusion, Refokus, Monopo
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     0. WAIT FOR GSAP + LENIS TO LOAD
     ───────────────────────────────────────────────────────── */
  function waitForLibs(cb, onFail) {
    var waited = 0;
    (function tick() {
      if (typeof gsap !== 'undefined' && typeof Lenis !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        cb();
        return;
      }
      waited += 50;
      // Библиотеки грузятся с CDN. Если он недоступен (корпоративная сеть,
      // блокировка, офлайн), ждать вечно нельзя: всё, что помечено .reveal,
      // так и останется прозрачным — то есть страница будет пустой.
      if (waited >= 3000) { onFail(); return; }
      setTimeout(tick, 50);
    })();
  }

  var faqBound = false;

  // Вкладки и раскрытие вопросов работают на голом DOM — GSAP тут нужен только
  // для необязательного проявления карточек.
  function bindFaq() {
    if (faqBound) return;
    faqBound = true;

    var tabs = document.querySelectorAll('.s-faq__tab');
    var categories = document.querySelectorAll('.s-faq__category');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var cat = tab.dataset.category;
        tabs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-pressed', 'true');

        categories.forEach(function (c) {
          if (c.dataset.category === cat) {
            c.classList.add('is-active');
            if (typeof gsap !== 'undefined') {
              gsap.fromTo(c.querySelectorAll('.s-faq__item'),
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: 'expo.out' });
            }
          } else {
            c.classList.remove('is-active');
            c.querySelectorAll('.s-faq__question[aria-expanded="true"]').forEach(function (btn) {
              btn.setAttribute('aria-expanded', 'false');
              var ans = btn.nextElementSibling;
              if (ans) ans.style.maxHeight = '0';
            });
          }
        });
      });
    });

    document.querySelectorAll('.s-faq__question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var answer = btn.nextElementSibling;
        if (!answer) return;
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        answer.style.maxHeight = expanded ? '0' : answer.scrollHeight + 'px';
      });
    });
  }

  function showWithoutAnimation() {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    document.querySelectorAll('.s-stat__num[data-target]').forEach(function (el) {
      el.textContent = el.dataset.target;
    });
    bindFaq();
  }

  waitForLibs(init, showWithoutAnimation);

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ─────────────────────────────────────────────────────────
       1. LENIS SMOOTH SCROLL — Silky 120fps feel
       ───────────────────────────────────────────────────────── */
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Connect Lenis → GSAP ticker for perfect sync
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    if (prefersReduced) {
      lenis.destroy();
    }


    /* ─────────────────────────────────────────────────────────
       2. SPLIT TEXT — Word-by-word reveals on titles
       ───────────────────────────────────────────────────────── */
    function splitWords(el) {
      const text = el.textContent.trim();
      // Preserve HTML spans like .s-accent
      el.innerHTML = text.split(/\s+/).map(word =>
        `<span class="word-wrap"><span class="word">${word}</span></span>`
      ).join(' ');
      return el.querySelectorAll('.word');
    }


    /* ─────────────────────────────────────────────────────────
       3. SCRUB TEXT — Intro scroll-driven reveal
       ───────────────────────────────────────────────────────── */
    const scrubTitle = document.getElementById('scrub-title');
    const scrubDesc = document.getElementById('scrub-desc');

    if (scrubTitle && scrubDesc) {
      [scrubTitle, scrubDesc].forEach(el => {
        const text = el.textContent.trim();
        el.innerHTML = text.split(/\s+/).map(w =>
          `<span class="s-intro__word">${w}</span>`
        ).join(' ');
      });

      const allWords = document.querySelectorAll('.s-intro__word');

      // GSAP scrub: each word fades in based on scroll position
      // Trigger earlier so text is visible when section is in view
      allWords.forEach((word, i) => {
        gsap.to(word, {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '#s-intro',
            start: `top+=${i * (80 / allWords.length)}% 90%`,
            end: `top+=${(i + 1) * (80 / allWords.length)}% 50%`,
            scrub: 0.3,
          }
        });
      });
    }


    /* ─────────────────────────────────────────────────────────
       4. SERVICE CARDS — Staggered reveal + magnetic tilt
       ───────────────────────────────────────────────────────── */
    const svcCards = gsap.utils.toArray('.s-svc-card');

    if (svcCards.length) {
      // Set initial state explicitly
      gsap.set(svcCards, { y: 60, opacity: 0 });
      
      // Reveal with stagger when grid enters viewport
      ScrollTrigger.create({
        trigger: '#svc-grid',
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(svcCards, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: { each: 0.06, from: 'start' },
            ease: 'expo.out',
          });
        }
      });

      // Magnetic 3D tilt on hover
      if (!prefersReduced) {
        svcCards.forEach(card => {
          card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
            gsap.to(card, {
              rotateY: x,
              rotateX: -y,
              translateZ: 10,
              duration: 0.4,
              ease: 'power2.out',
            });
          });

          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              rotateY: 0,
              rotateX: 0,
              translateZ: 0,
              duration: 0.7,
              ease: 'elastic.out(1, 0.5)',
            });
          });
        });
      }
    }





    /* ─────────────────────────────────────────────────────────
       6. TIMELINE — Scroll-driven progress fill
       ───────────────────────────────────────────────────────── */
    const tlFill = document.getElementById('tl-fill');
    const tlSteps = gsap.utils.toArray('.s-tl__step');

    if (tlFill && tlSteps.length) {
      // Progress bar scrub — animate height directly
      gsap.to(tlFill, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: '#s-timeline',
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 0.5,
        }
      });
      // Set initial height
      gsap.set(tlFill, { height: '0%' });

      // Steps entrance
      tlSteps.forEach((step, i) => {
        gsap.from(step, {
          x: -40,
          opacity: 0,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        });

        // Activate step number glow
        ScrollTrigger.create({
          trigger: step,
          start: 'top 65%',
          onEnter: () => step.classList.add('is-active'),
        });
      });
    }


    /* ─────────────────────────────────────────────────────────
       7. TRUST CARDS — Scale-in with spring
       ───────────────────────────────────────────────────────── */
    const trustCards = gsap.utils.toArray('.s-trust-card');

    if (trustCards.length) {
      // Set initial state explicitly
      gsap.set(trustCards, { opacity: 0, scale: 0.85, y: 40 });
      
      ScrollTrigger.create({
        trigger: '.s-trust__cards',
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(trustCards, {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'back.out(1.4)',
          });
        }
      });
    }


    /* ─────────────────────────────────────────────────────────
       8. STAT COUNTERS — GSAP counter animation
       ───────────────────────────────────────────────────────── */
    const statNums = gsap.utils.toArray('.s-stat__num[data-target]');

    if (statNums.length) {
      statNums.forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        const obj = { val: 0 };

        ScrollTrigger.create({
          trigger: el,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            if (prefersReduced) { el.textContent = target; return; }
            gsap.to(obj, {
              val: target,
              duration: 2.5,
              ease: 'expo.out',
              onUpdate: () => {
                el.textContent = Math.round(obj.val);
              }
            });
          }
        });
      });
    }


    /* ─────────────────────────────────────────────────────────
       9. FAQ — Category Tabs + Chevron Accordion
       ───────────────────────────────────────────────────────── */

    bindFaq();


    /* ─────────────────────────────────────────────────────────
       10. CTA — Parallax + magnetic button
       ───────────────────────────────────────────────────────── */
    const ctaInner = document.querySelector('.s-cta__inner');

    if (ctaInner) {
      // Subtle parallax
      gsap.to(ctaInner, {
        y: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.s-cta',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        }
      });

      // CTA button entrance
      gsap.from('.s-cta__btn', {
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.s-cta__btn',
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      });

      // Messenger channels stagger
      gsap.from(gsap.utils.toArray('.s-cta__channel'), {
        scale: 0,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'back.out(2)',
        scrollTrigger: {
          trigger: '.s-cta__channels',
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      });
    }

    // Magnetic button effect
    const ctaBtn = document.querySelector('.s-cta__btn');
    if (ctaBtn && !prefersReduced) {
      ctaBtn.addEventListener('mousemove', (e) => {
        const rect = ctaBtn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
        gsap.to(ctaBtn, { x, y, duration: 0.3, ease: 'power2.out' });
      });
      ctaBtn.addEventListener('mouseleave', () => {
        gsap.to(ctaBtn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      });
    }


    /* ─────────────────────────────────────────────────────────
       11. AMBIENT ORBS — Floating decorations
       ───────────────────────────────────────────────────────── */
    if (!prefersReduced) {
      const orbSections = document.querySelectorAll('.s-services, .s-timeline, .s-faq, .s-cta');
      orbSections.forEach(section => {
        for (let i = 0; i < 2; i++) {
          const orb = document.createElement('div');
          orb.className = 'ambient-orb';
          orb.style.cssText = `
            --orb-size: ${200 + Math.random() * 300}px;
            --orb-x: ${10 + Math.random() * 80}%;
            --orb-y: ${10 + Math.random() * 80}%;
            --orb-duration: ${15 + Math.random() * 20}s;
            --orb-delay: ${-Math.random() * 10}s;
            --orb-opacity: ${0.03 + Math.random() * 0.04};
          `;
          section.appendChild(orb);
        }
      });
    }


    /* ─────────────────────────────────────────────────────────
       12. HORIZONTAL SCROLL TEXT — Infinite marquee
       Creates a scrolling text bar between sections
       ───────────────────────────────────────────────────────── */
    const marquee = document.querySelector('.s-marquee__track');
    if (marquee && !prefersReduced) {
      gsap.to(marquee, {
        xPercent: -50,
        repeat: -1,
        duration: 30,
        ease: 'none',
      });

      // Speed up on scroll
      ScrollTrigger.create({
        trigger: '.s-marquee',
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          gsap.to(marquee, {
            timeScale: 1 + Math.abs(self.getVelocity()) / 2000,
            duration: 0.3,
          });
        }
      });
    }


    /* ─────────────────────────────────────────────────────────
       13. SCROLL PROGRESS BAR — Top of page
       ───────────────────────────────────────────────────────── */
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    gsap.to(progressBar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      }
    });


    /* ─────────────────────────────────────────────────────────
       14. GENERIC REVEAL — Catch-all for .reveal elements
       ───────────────────────────────────────────────────────── */
    const genericReveals = gsap.utils.toArray('.reveal');
    if (genericReveals.length) {
      genericReveals.forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0,
            duration: 1, ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              toggleActions: 'play none none none',
            }
          }
        );
      });
    }



  }

})();
