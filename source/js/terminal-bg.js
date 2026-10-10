/*!
 * 小镇梦想家 · 背景代码流
 * 两层叠加：竖向字符雨（原有）+ 横向渐变代码流（沿水平方向做 绿→蓝→青 渐变）。
 * 纯原生，无依赖；不修改页面结构，只追加两个 fixed 画布。
 * 参考 n0ther3.github.io 的背景层实现思路。
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (reduceMotion) return;

  var MONO = "'JetBrains Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace";
  var CHARS = '01<>/{}[]#$%&*+=?;:~^';
  var FRAME_MS = 1000 / 11;

  // 竖向字符雨
  var V_FONT = 13;
  var V_COL_GAP = 26;
  // 每帧下落 2 行（26px），让同列相邻字符之间留出空隙，
  // 否则 13px 字配 13px 步进会首尾相接、糊成竖直条纹
  var V_ROW_STEP = 2;
  var V_FADE = 0.28;
  var V_ACCENT_RATIO = 0.02;

  // 横向代码流
  var H_FONT = 13;
  var H_ROW_GAP = 38;
  // 同上：步进 18px > 字号 13px，保证横向相邻字符不粘连
  var H_STEP = 18;
  var H_FADE = 0.32;

  function isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  function palette() {
    if (isDark()) {
      return {
        dim: '168,180,171',
        dimA: 0.16,
        accent: '201,232,148',
        accentA: 0.45,
        // 横向代码流：绿 → 蓝 → 青，两端透明淡出
        stops: [
          [0, 'rgba(201,232,148,0)'],
          [0.2, 'rgba(201,232,148,0.32)'],
          [0.55, 'rgba(138,180,255,0.3)'],
          [0.82, 'rgba(95,215,199,0.3)'],
          [1, 'rgba(95,215,199,0)']
        ]
      };
    }
    return {
      dim: '60,70,62',
      dimA: 0.12,
      accent: '71,121,43',
      accentA: 0.38,
      stops: [
        [0, 'rgba(71,121,43,0)'],
        [0.2, 'rgba(71,121,43,0.28)'],
        [0.55, 'rgba(59,111,212,0.24)'],
        [0.82, 'rgba(40,140,125,0.24)'],
        [1, 'rgba(40,140,125,0)']
      ]
    };
  }

  var colors = palette();

  function createLayer(id) {
    var el = document.createElement('canvas');
    el.id = id;
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    var context = el.getContext('2d', { alpha: true });
    if (!context) return null;
    return { el: el, ctx: context, w: 0, h: 0 };
  }

  var vertical = createLayer('bg-canvas');
  var horizontal = createLayer('bg-canvas-h');
  if (!vertical || !horizontal) return;

  var drops = [];
  var heads = [];
  var headGradient = null;

  function fit(layer) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    layer.w = window.innerWidth;
    layer.h = window.innerHeight;
    layer.el.width = Math.floor(layer.w * dpr);
    layer.el.height = Math.floor(layer.h * dpr);
    layer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildHeadGradient() {
    var g = horizontal.ctx.createLinearGradient(0, 0, horizontal.w, 0);
    for (var i = 0; i < colors.stops.length; i++) {
      g.addColorStop(colors.stops[i][0], colors.stops[i][1]);
    }
    headGradient = g;
  }

  function resize() {
    fit(vertical);
    var cols = Math.ceil(vertical.w / V_COL_GAP);
    drops = new Array(cols);
    for (var i = 0; i < cols; i++) {
      drops[i] = -Math.floor(Math.random() * 30);
    }
    vertical.ctx.clearRect(0, 0, vertical.w, vertical.h);

    fit(horizontal);
    var rows = Math.ceil(horizontal.h / H_ROW_GAP);
    heads = new Array(rows);
    for (var j = 0; j < rows; j++) {
      heads[j] = -Math.floor(Math.random() * 40);
    }
    buildHeadGradient();
    horizontal.ctx.clearRect(0, 0, horizontal.w, horizontal.h);
  }

  function stepVertical() {
    var ctx = vertical.ctx;
    var w = vertical.w;
    var h = vertical.h;

    // 用 destination-out 做渐隐，画布保持透明，底层光晕与底色得以透出
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,' + V_FADE + ')';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
    ctx.font = V_FONT + 'px ' + MONO;
    ctx.textBaseline = 'top';

    for (var i = 0; i < drops.length; i++) {
      var y = drops[i] * V_FONT;

      if (y > -V_FONT && y < h) {
        var isAccent = Math.random() < V_ACCENT_RATIO;
        ctx.fillStyle =
          'rgba(' +
          (isAccent ? colors.accent : colors.dim) +
          ',' +
          (isAccent ? colors.accentA : colors.dimA) +
          ')';
        ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], i * V_COL_GAP, y);
      }

      if (y > h && Math.random() > 0.975) {
        drops[i] = -Math.floor(Math.random() * 12);
      }
      drops[i] += V_ROW_STEP;
    }
  }

  function stepHorizontal() {
    var ctx = horizontal.ctx;
    var w = horizontal.w;
    var h = horizontal.h;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,' + H_FADE + ')';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
    ctx.font = H_FONT + 'px ' + MONO;
    ctx.textBaseline = 'top';
    // 用水平线性渐变当填充色，字符颜色随 x 变化
    ctx.fillStyle = headGradient;

    for (var i = 0; i < heads.length; i++) {
      var x = heads[i];

      if (x > -H_FONT && x < w) {
        ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], x, i * H_ROW_GAP);
      }

      if (x > w && Math.random() > 0.96) {
        heads[i] = -Math.floor(Math.random() * 30);
      }
      heads[i] += H_STEP;
    }
  }

  var timer = null;

  function step() {
    stepVertical();
    stepHorizontal();
  }

  function start() {
    if (timer) return;
    timer = window.setInterval(step, FRAME_MS);
  }

  function stop() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }

  resize();
  start();

  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  // 跟随主题切换换色
  var observer = new MutationObserver(function () {
    colors = palette();
    buildHeadGradient();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
})();