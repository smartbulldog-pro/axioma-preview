/**
 * ═══════════════════════════════════════════════════════════
 * Obsidian Neural Lattice — кристаллическая решётка
 * 
 * Метафора: обсидиан → нанокуб. Острые грани, точные линии,
 * геометрия кристалла, не органика. Сигналы бегут по рёбрам
 * кристаллической решётки как электричество по скальпелю.
 *
 * Режимы:
 *  - idle:     мягкое teal мерцание узлов, редкие импульсы по граням
 *  - thinking: решётка пульсирует, сигналы бегут по всем рёбрам,
 *              узлы вспыхивают каскадом, геометрия вращается
 *  - success:  emerald flash, кристалл "огранён" — все грани ярко
 *  - error:    красные разломы, грани дрожат, осколки разлетаются
 * ═══════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  var NeuralBrain = {};
  var canvas, ctx;
  var nodes = [];
  var edges = [];
  var sparks = [];      // летящие осколки
  var W, H, cx, cy;
  var raf;
  var mode = 'idle';
  var modeTimer = null;
  var time = 0;
  var rotation = 0;

  var TEAL   = { r: 21,  g: 175, b: 209 };
  var GREEN  = { r: 16,  g: 185, b: 129 };
  var RED    = { r: 239, g: 68,  b: 68  };
  var AMBER  = { r: 245, g: 158, b: 11  };

  NeuralBrain.init = function (canvasEl) {
    canvas = canvasEl;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    buildLattice();
    tick();
    window.addEventListener('resize', function () {
      resize();
      buildLattice();
    });
  };

  NeuralBrain.setMode = function (newMode, duration) {
    mode = newMode;
    if (modeTimer) clearTimeout(modeTimer);
    if (duration) {
      modeTimer = setTimeout(function () {
        mode = 'idle';
        modeTimer = null;
      }, duration);
    }
    if (newMode === 'error') {
      spawnShards(RED, 16);
      if (canvas) {
        canvas.classList.add('neural-shake');
        setTimeout(function () { canvas.classList.remove('neural-shake'); }, 600);
      }
    }
    if (newMode === 'success') {
      spawnShards(GREEN, 10);
    }
  };

  NeuralBrain.destroy = function () {
    if (raf) cancelAnimationFrame(raf);
  };

  NeuralBrain.resize = function () {
    if (!canvas) return;
    resize();
    buildLattice();
  };

  /* ─── RESIZE ─── */
  function resize() {
    var parent = canvas.parentElement;
    if (!parent) return;
    var rect = parent.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    if (W < 1 || H < 1) return;  // panel not visible yet
    cx = W / 2;
    cy = H / 2;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ─── BUILD CRYSTALLINE LATTICE ─── */
  function buildLattice() {
    nodes = [];
    edges = [];
    var layers = 3;
    var radius = Math.min(W, H) * 0.38;

    // Внутреннее кольцо — "ядро кристалла"
    addRing(5, radius * 0.22, 0);
    // Среднее кольцо
    addRing(8, radius * 0.52, Math.PI / 8);
    // Внешнее кольцо — "грани"
    addRing(12, radius * 0.85, 0);
    // Центральный узел
    nodes.push({
      x: 0, y: 0,
      baseX: 0, baseY: 0,
      r: 2.5, layer: 0,
      pulse: 0, speed: 0.02,
      brightness: 0
    });

    // Соединяем рёбрами — структура кристалла
    var coreStart = 0, coreEnd = 5;
    var midStart = 5, midEnd = 13;
    var outStart = 13, outEnd = 25;
    var centerIdx = 25;

    // Центр → ядро
    for (var i = coreStart; i < coreEnd; i++) {
      addEdge(centerIdx, i);
    }
    // Ядро → среднее (каждый к двум ближайшим)
    for (var a = coreStart; a < coreEnd; a++) {
      for (var b = midStart; b < midEnd; b++) {
        var d = dist(nodes[a], nodes[b]);
        if (d < radius * 0.45) addEdge(a, b);
      }
    }
    // Среднее → внешнее
    for (var m = midStart; m < midEnd; m++) {
      for (var o = outStart; o < outEnd; o++) {
        var d2 = dist(nodes[m], nodes[o]);
        if (d2 < radius * 0.5) addEdge(m, o);
      }
    }
    // Ядро между собой — пентагон
    for (var p = coreStart; p < coreEnd; p++) {
      addEdge(p, coreStart + (p - coreStart + 1) % 5);
    }
    // Среднее — октагон
    for (var q = midStart; q < midEnd; q++) {
      addEdge(q, midStart + (q - midStart + 1) % 8);
    }
    // Внешнее — додекагон
    for (var r = outStart; r < outEnd; r++) {
      addEdge(r, outStart + (r - outStart + 1) % 12);
    }
  }

  function addRing(count, radius, offset) {
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2 + offset;
      var x = Math.cos(angle) * radius;
      var y = Math.sin(angle) * radius;
      nodes.push({
        x: x, y: y,
        baseX: x, baseY: y,
        r: 1.2 + Math.random() * 1.2,
        layer: nodes.length < 5 ? 0 : (nodes.length < 13 ? 1 : 2),
        pulse: Math.random() * Math.PI * 2,
        speed: 0.012 + Math.random() * 0.015,
        brightness: 0
      });
    }
  }

  function addEdge(a, b) {
    if (a === b || a >= nodes.length || b >= nodes.length) return;
    // Проверяем дубликаты
    for (var i = 0; i < edges.length; i++) {
      if ((edges[i].a === a && edges[i].b === b) ||
          (edges[i].a === b && edges[i].b === a)) return;
    }
    edges.push({
      a: a, b: b,
      signal: -1,        // -1 = нет сигнала, 0..1 = прогресс
      signalDir: 1,
      cooldown: 30 + Math.random() * 100,
      glow: 0
    });
  }

  function dist(a, b) {
    var dx = a.baseX - b.baseX;
    var dy = a.baseY - b.baseY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ─── SPAWN SHARDS (осколки при error/success) ─── */
  function spawnShards(col, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var spd = 2 + Math.random() * 4;
      // Осколки — треугольные, не круглые
      sparks.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
        size: 3 + Math.random() * 5,
        col: col
      });
    }
  }

  /* ─── MAIN LOOP ─── */
  function tick() {
    raf = requestAnimationFrame(tick);
    time += 0.016;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(cx, cy);

    // Медленное вращение в thinking
    if (mode === 'thinking') {
      rotation += 0.003;
    } else {
      rotation *= 0.98; // затухание
    }
    ctx.rotate(rotation);

    var col = mode === 'error' ? RED : (mode === 'success' ? GREEN : TEAL);
    var isActive = mode === 'thinking';
    var isError = mode === 'error';
    var fireChance = isActive ? 0.06 : (isError ? 0.1 : 0.008);

    // ─── РЁБРА (грани кристалла) ─── 
    for (var e = 0; e < edges.length; e++) {
      var edge = edges[e];
      var na = nodes[edge.a];
      var nb = nodes[edge.b];

      // Запуск сигнала
      edge.cooldown--;
      if (edge.cooldown <= 0 && edge.signal < 0) {
        if (Math.random() < fireChance) {
          edge.signal = 0;
          edge.signalDir = Math.random() > 0.5 ? 1 : -1;
          edge.glow = 1;
        }
        edge.cooldown = isActive ? (8 + Math.random() * 20) : (50 + Math.random() * 150);
      }

      // Продвигаем сигнал
      if (edge.signal >= 0) {
        edge.signal += isActive ? 0.035 : 0.02;
        if (edge.signal >= 1) {
          edge.signal = -1;
          // Зажигаем целевой узел
          var target = edge.signalDir > 0 ? edge.b : edge.a;
          if (nodes[target]) nodes[target].brightness = 1;
        }
      }
      edge.glow *= 0.95;

      // Базовая грань
      var baseAlpha = 0.04 + edge.glow * 0.15;
      if (isActive) baseAlpha += 0.03;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.strokeStyle = rgba(col, baseAlpha);
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Сигнал бежит по грани
      if (edge.signal >= 0) {
        var t = edge.signalDir > 0 ? edge.signal : (1 - edge.signal);
        var sx = na.x + (nb.x - na.x) * t;
        var sy = na.y + (nb.y - na.y) * t;
        var intensity = 1 - Math.abs(edge.signal - 0.5) * 2;

        // Точка-сигнал с glow
        var grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
        grd.addColorStop(0, rgba(col, intensity * 0.7));
        grd.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(sx - 8, sy - 8, 16, 16);

        // Яркий сегмент грани
        var seg = 0.12;
        var t1 = Math.max(0, t - seg);
        var t2 = Math.min(1, t + seg);
        ctx.beginPath();
        ctx.moveTo(na.x + (nb.x - na.x) * t1, na.y + (nb.y - na.y) * t1);
        ctx.lineTo(na.x + (nb.x - na.x) * t2, na.y + (nb.y - na.y) * t2);
        ctx.strokeStyle = rgba(col, intensity * 0.45);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // ─── УЗЛЫ (вершины кристалла) ───
    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n];
      node.pulse += node.speed;
      node.brightness *= 0.93;

      // Микро-дрожание в thinking (вибрация кристалла)
      if (isActive) {
        node.x = node.baseX + (Math.random() - 0.5) * 1.2;
        node.y = node.baseY + (Math.random() - 0.5) * 1.2;
      } else if (isError) {
        node.x = node.baseX + (Math.random() - 0.5) * 3;
        node.y = node.baseY + (Math.random() - 0.5) * 3;
      } else {
        node.x = node.baseX;
        node.y = node.baseY;
      }

      var alpha = 0.12 + Math.sin(node.pulse) * 0.08 + node.brightness * 0.5;
      if (isActive) alpha = Math.min(alpha * 1.8, 0.9);
      var nr = node.r + node.brightness * 2;

      // Ромб вместо круга — грань кристалла
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(Math.PI / 4 + node.pulse * 0.3);

      ctx.beginPath();
      ctx.moveTo(0, -nr);
      ctx.lineTo(nr, 0);
      ctx.lineTo(0, nr);
      ctx.lineTo(-nr, 0);
      ctx.closePath();
      ctx.fillStyle = rgba(col, alpha);
      ctx.fill();

      // Glow
      if (node.brightness > 0.1) {
        var ngrd = ctx.createRadialGradient(0, 0, 0, 0, 0, nr * 5);
        ngrd.addColorStop(0, rgba(col, node.brightness * 0.25));
        ngrd.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = ngrd;
        ctx.fillRect(-nr * 5, -nr * 5, nr * 10, nr * 10);
      }

      ctx.restore();
    }

    ctx.restore();

    // ─── ОСКОЛКИ (вне вращения) ───
    for (var s = sparks.length - 1; s >= 0; s--) {
      var sp = sparks[s];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vx *= 0.96;
      sp.vy *= 0.96;
      sp.angle += sp.spin;
      sp.life -= sp.decay;

      if (sp.life <= 0) { sparks.splice(s, 1); continue; }

      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(sp.angle);
      var sz = sp.size * sp.life;

      // Треугольный осколок — острый как обсидиан
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.6, sz * 0.5);
      ctx.lineTo(-sz * 0.6, sz * 0.5);
      ctx.closePath();
      ctx.fillStyle = rgba(sp.col, sp.life * 0.5);
      ctx.fill();

      ctx.restore();
    }
  }

  function rgba(c, a) {
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + Math.max(0, Math.min(1, a)) + ')';
  }

  window.NeuralBrain = NeuralBrain;
})();
