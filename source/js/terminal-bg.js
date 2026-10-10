/*!
 * 小镇梦想家 · 背景字符雨
 * 极低透明度、低帧率的终端字符雨，参考 n0ther3.github.io 的背景层实现思路。
 * 纯原生，无依赖；不修改页面结构，只追加一个 fixed 画布。
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (reduceMotion) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var CHARS = '01<>/{}[]#$%&*+=?;:~^';
  var FONT_SIZE = 13;
  var COL_GAP = 26;
  // 每帧下落 2 行（26px），让同列相邻字符之间留出空隙，
  // 否则 13px 字配 13px 步进会首尾相接、糊成竖直条纹
  var ROW_STEP = 2;
  var FRAME_MS = 1000 / 11;
  var FADE = 0.28;
  var ACCENT_RATIO = 0.02;

  var drops = [];
  var width = 0;
  var height = 0;

  function palette() {
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return dark
      ? { dim: '168,180,171', accent: '201,232,148', dimA: 0.16, accentA: 0.45 }
      : { dim: '60,70,62', accent: '71,121,43', dimA: 0.12, accentA: 0.38 };
  }

  var colors = palette();

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var cols = Math.ceil(width / COL_GAP);
    drops = new Array(cols);
    for (var i = 0; i < cols; i++) {
      drops[i] = -Math.floor(Math.random() * 30);
    }
  }

  function step() {
    // 用 destination-out 做渐隐，画布保持透明，底层光晕与底色得以透出
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,' + FADE + ')';
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';
    ctx.font = FONT_SIZE + "px 'JetBrains Mono', ui-monospace, Consolas, monospace";
    ctx.textBaseline = 'top';

    for (var i = 0; i < drops.length; i++) {
      var y = drops[i] * FONT_SIZE;

      if (y > -FONT_SIZE && y < height) {
        var isAccent = Math.random() < ACCENT_RATIO;
        ctx.fillStyle =
          'rgba(' +
          (isAccent ? colors.accent : colors.dim) +
          ',' +
          (isAccent ? colors.accentA : colors.dimA) +
          ')';
        ctx.fillText(CHARS[(Math.random() * CHARS.length) | 0], i * COL_GAP, y);
      }

      if (y > height && Math.random() > 0.975) {
        drops[i] = -Math.floor(Math.random() * 12);
      }
      drops[i] += ROW_STEP;
    }
  }

  var timer = null;

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
  ctx.clearRect(0, 0, width, height);
  start();

  window.addEventListener('resize', function () {
    resize();
    ctx.clearRect(0, 0, width, height);
  });

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
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
})();