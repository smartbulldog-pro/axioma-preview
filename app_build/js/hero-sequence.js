/**
 * ═══════════════════════════════════════════════════════════
 * АКСИОМА — Hero Scroll-Bound Frame Sequence Engine
 * ═══════════════════════════════════════════════════════════
 *
 * Renders a 240-frame JPG sequence on <canvas>, driven by
 * scroll position with lerp smoothing. Zero external deps.
 *
 * Architecture:
 *   scroll event (passive) → updates targetFrame
 *   rAF loop → lerps currentFrame toward target → draws nearest frame
 *
 * Canvas drawing emulates CSS `object-fit: cover`.
 */

(function () {
  'use strict';

  /* ─── Configuration ─── */
  const CONFIG = {
    FRAME_COUNT:  240,
    FRAME_PATH:   '../assets/sequences/hero',
    FRAME_PREFIX: 'frame_',
    FRAME_EXT:    '.jpg',
    LERP_FACTOR:  0.06,    // Smoother scrolling
    RENDER_THRESHOLD: 0.3, // Min delta to trigger a canvas repaint
    OVERLAY_FADE_START: 0.0,  // Scroll fraction where overlay starts sliding out
    OVERLAY_FADE_END:   0.18, // Scroll fraction where overlay is fully gone
    MOUSE_PARALLAX_STRENGTH: 12, // Max px shift per letter on mouse move
  };

  /* ─── DOM References ─── */
  const canvas     = document.getElementById('hero-canvas');
  const ctx        = canvas.getContext('2d');
  const heroEl     = document.getElementById('hero');
  const overlayEl  = document.getElementById('hero-overlay');
  const scrollCue  = document.getElementById('hero-scroll-cue');
  const loaderEl   = document.getElementById('hero-loader');
  const loaderBar  = document.getElementById('hero-loader-bar');
  const loaderText = document.getElementById('hero-loader-text');
  const letters    = document.querySelectorAll('.hero__letter');

  /* ─── State ─── */
  const images   = new Array(CONFIG.FRAME_COUNT);
  const isLoaded = new Array(CONFIG.FRAME_COUNT).fill(false);
  let loadedCount     = 0;
  let currentFrame    = 0;    // Float — lerp-interpolated
  let targetFrame     = 0;    // Integer — derived from scroll
  let lastRenderedIdx = -1;   // Avoids redundant drawImage calls
  let canvasW         = 0;
  let canvasH         = 0;
  let isScrolling     = false; // Disables parallax when user scrolls
  let mouseX          = 0.5;   // Normalized mouse position (0-1)
  let mouseY          = 0.5;

  /* ─── Utility: Linear Interpolation ─── */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* ─── Utility: Zero-padded frame filename ─── */
  function framePath(index) {
    const num = String(index + 1).padStart(4, '0');
    return `${CONFIG.FRAME_PATH}/${CONFIG.FRAME_PREFIX}${num}${CONFIG.FRAME_EXT}`;
  }

  /* ─── Canvas Sizing (DPR-aware) ─── */
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for perf
    const rect = canvas.getBoundingClientRect();
    canvasW = rect.width * dpr;
    canvasH = rect.height * dpr;
    canvas.width  = canvasW;
    canvas.height = canvasH;

    // Force redraw after resize
    lastRenderedIdx = -1;
  }

  /* ═══════════════════════════════════════════════════════════
     DRAWING: object-fit: cover emulation
     ═══════════════════════════════════════════════════════════ */
  function drawFrame(index) {
    // Guard: clamp index and check availability
    const idx = Math.max(0, Math.min(index, CONFIG.FRAME_COUNT - 1));

    // If requested frame isn't loaded, find nearest loaded frame
    let drawIdx = idx;
    if (!isLoaded[idx]) {
      // Search outward for nearest loaded frame
      for (let offset = 1; offset < CONFIG.FRAME_COUNT; offset++) {
        if (idx - offset >= 0 && isLoaded[idx - offset]) {
          drawIdx = idx - offset;
          break;
        }
        if (idx + offset < CONFIG.FRAME_COUNT && isLoaded[idx + offset]) {
          drawIdx = idx + offset;
          break;
        }
      }
      // If absolutely nothing is loaded, bail
      if (!isLoaded[drawIdx]) return;
    }

    // Skip if same frame already on screen
    if (drawIdx === lastRenderedIdx) return;

    const img = images[drawIdx];
    if (!img) return;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // object-fit: cover math
    // Scale so image fills the canvas entirely (may crop edges)
    const scale = Math.max(canvasW / iw, canvasH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (canvasW - dw) * 0.5;
    const dy = (canvasH - dh) * 0.5;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);

    lastRenderedIdx = drawIdx;
  }

  /* ═══════════════════════════════════════════════════════════
     SCROLL → FRAME MAPPING
     ═══════════════════════════════════════════════════════════ */
  function updateTargetFrame() {
    const rect = heroEl.getBoundingClientRect();
    const scrollable = heroEl.offsetHeight - window.innerHeight;
    if (scrollable <= 0) {
      targetFrame = 0;
      return;
    }
    const fraction = Math.max(0, Math.min(1, -rect.top / scrollable));
    targetFrame = Math.floor(fraction * (CONFIG.FRAME_COUNT - 1));

    // Update overlay opacity based on scroll fraction
    updateOverlay(fraction);
  }

  /* ─── Overlay Slide-Out Logic (right-to-left, smooth) ─── */
  function updateOverlay(fraction) {
    if (fraction > 0.01) {
      isScrolling = true;
    }

    if (fraction <= CONFIG.OVERLAY_FADE_START) {
      overlayEl.style.opacity = '1';
      overlayEl.style.transform = 'translateX(0)';
    } else if (fraction >= CONFIG.OVERLAY_FADE_END) {
      overlayEl.style.opacity = '0';
      overlayEl.style.transform = 'translateX(-110%)';
    } else {
      const t = (fraction - CONFIG.OVERLAY_FADE_START) /
                (CONFIG.OVERLAY_FADE_END - CONFIG.OVERLAY_FADE_START);
      // Smooth ease-out quintic for premium feel
      const eased = 1 - Math.pow(1 - t, 4);
      overlayEl.style.opacity = String(1 - eased);
      overlayEl.style.transform = 'translateX(' + (-eased * 110) + '%)';
    }

    // Reset parallax transforms when scrolling
    if (isScrolling) {
      letters.forEach(function (letter) {
        letter.style.transform = '';
      });
    }

    // Fade out scroll cue immediately
    if (scrollCue) {
      scrollCue.style.opacity = fraction > 0.02 ? '0' : '0.5';
    }
  }

  /* ═══════════════════════════════════════════════════════════
     MOUSE PARALLAX (active only before scrolling)
     ═══════════════════════════════════════════════════════════ */
  function onMouseMove(e) {
    if (isScrolling) return;

    // Normalize mouse to (-0.5 … +0.5) range
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;

    letters.forEach(function (letter, idx) {
      // Each letter reacts with slightly different intensity
      // Center letters move less, edge letters move more (convex curve)
      var center = (letters.length - 1) / 2;
      var distFromCenter = Math.abs(idx - center) / center; // 0…1
      var intensity = 0.5 + distFromCenter * 0.5; // 0.5…1.0
      var strength = CONFIG.MOUSE_PARALLAX_STRENGTH;

      var offsetX = mouseX * strength * intensity * (idx % 2 === 0 ? 1 : -0.7);
      var offsetY = mouseY * strength * intensity * 0.5;

      letter.style.transform =
        'translateX(' + offsetX.toFixed(2) + 'px) ' +
        'translateY(' + offsetY.toFixed(2) + 'px)';
    });
  }

  /* ═══════════════════════════════════════════════════════════
     rAF RENDER LOOP
     ═══════════════════════════════════════════════════════════ */
  function animate() {
    // Lerp toward target
    currentFrame = lerp(currentFrame, targetFrame, CONFIG.LERP_FACTOR);

    // Only repaint if the frame visually changed
    const roundedFrame = Math.round(currentFrame);
    if (Math.abs(currentFrame - lastRenderedIdx) > CONFIG.RENDER_THRESHOLD) {
      drawFrame(roundedFrame);
    }

    requestAnimationFrame(animate);
  }

  /* ═══════════════════════════════════════════════════════════
     PRELOADING
     ═══════════════════════════════════════════════════════════ */
  function preloadImages() {
    for (let i = 0; i < CONFIG.FRAME_COUNT; i++) {
      const img = new Image();

      img.onload = function () {
        isLoaded[i] = true;
        loadedCount++;

        // Draw first frame immediately
        if (i === 0) {
          resizeCanvas();
          drawFrame(0);
        }

        // Update loading progress
        updateLoadingProgress();

        // Hide loader when all frames are loaded
        if (loadedCount === CONFIG.FRAME_COUNT) {
          onAllFramesLoaded();
        }
      };

      img.onerror = function () {
        // Mark as "loaded" to prevent stalls; frame will be skipped
        isLoaded[i] = true;
        loadedCount++;
        updateLoadingProgress();
        if (loadedCount === CONFIG.FRAME_COUNT) {
          onAllFramesLoaded();
        }
      };

      img.src = framePath(i);
      images[i] = img;
    }
  }

  function updateLoadingProgress() {
    const pct = Math.round((loadedCount / CONFIG.FRAME_COUNT) * 100);
    if (loaderBar) {
      loaderBar.style.setProperty('--progress', pct + '%');
    }
    if (loaderText) {
      loaderText.textContent = pct + '%';
    }
  }

  function onAllFramesLoaded() {
    // Hide loader
    if (loaderEl) {
      loaderEl.classList.add('is-hidden');
    }

    // Ensure current scroll position is reflected
    updateTargetFrame();
    drawFrame(Math.round(currentFrame));
  }

  /* ═══════════════════════════════════════════════════════════
     RESIZE HANDLER (debounced)
     ═══════════════════════════════════════════════════════════ */
  let resizeTimer = null;

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCanvas();
      drawFrame(Math.round(currentFrame));
    }, 100);
  }

  /* ═══════════════════════════════════════════════════════════
     INITIALIZATION
     ═══════════════════════════════════════════════════════════ */
  function init() {
    // Size canvas before anything else
    resizeCanvas();

    // Start preloading all frames
    preloadImages();

    // Scroll listener — passive, only updates target
    window.addEventListener('scroll', updateTargetFrame, { passive: true });

    // Resize listener
    window.addEventListener('resize', onResize, { passive: true });

    // Mouse parallax listener
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Kick off the render loop
    requestAnimationFrame(animate);

    // Set initial state from current scroll position (in case of page reload mid-scroll)
    updateTargetFrame();
  }

  // Fire when DOM is ready (script has `defer`, so DOM is already parsed)
  init();

})();
