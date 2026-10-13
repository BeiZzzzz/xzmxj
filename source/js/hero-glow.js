/*!
 * 小镇梦想家 · 首页 hero 增强
 * 1) 在站点标题上方插入圆形头像，点击进入「关于」页
 * 2) 头像与标题悬停时产生随机配色的渐变辉光
 * 3) 头像下方插入「心路历程」入口，点击进入关于页的时间线
 * 只作用于首页的 #site-info，其他页面不受影响。
 */
(function () {
  'use strict';

  var info = document.getElementById('site-info');
  if (!info) return;

  var title = document.getElementById('site-title');
  if (!title) return;

  var AVATAR_SRC = '/xzmxj/img/avatar.jpg';
  var ABOUT_PATH = '/xzmxj/about/';

  // ---- 圆形头像 ----
  if (!info.querySelector('.hero-avatar')) {
    var link = document.createElement('a');
    link.className = 'hero-avatar';
    link.href = ABOUT_PATH;
    link.setAttribute('aria-label', '关于 小镇梦想家');
    link.title = '关于我';

    var img = document.createElement('img');
    img.src = AVATAR_SRC;
    img.alt = '小镇梦想家';
    img.decoding = 'async';

    link.appendChild(img);
    info.insertBefore(link, title);
  }

  // ---- 心路历程入口：放在头像与标题之间，同样进入关于页 ----
  if (!info.querySelector('.hero-journey')) {
    var chip = document.createElement('a');
    chip.className = 'hero-journey';
    chip.href = ABOUT_PATH;
    chip.title = '关于我 · 心路历程';
    chip.innerHTML = '心路历程 <span class="hj-arrow">&rsaquo;</span>';
    info.insertBefore(chip, title);
  }

  var avatar = info.querySelector('.hero-avatar');

  // ---- 随机渐变色：每次移入重新抽一组同色相的邻近色 ----
  function randomGlow(el) {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    var h = Math.floor(Math.random() * 360);
    var s = 62 + Math.floor(Math.random() * 20);
    // 浅色底上必须用更深的颜色，否则渐变字与光环几乎看不见
    var l = isDark
      ? 62 + Math.floor(Math.random() * 12)
      : 40 + Math.floor(Math.random() * 10);
    el.style.setProperty('--glow-1', 'hsl(' + h + ', ' + s + '%, ' + l + '%)');
    el.style.setProperty('--glow-2', 'hsl(' + ((h + 40) % 360) + ', ' + s + '%, ' + l + '%)');
    el.style.setProperty('--glow-3', 'hsl(' + ((h + 82) % 360) + ', ' + s + '%, ' + l + '%)');
  }

  [avatar, title].forEach(function (el) {
    if (!el) return;
    el.addEventListener('mouseenter', function () {
      randomGlow(el);
    });
    // 触屏设备没有 hover，点按也给一次辉光反馈
    el.addEventListener('touchstart', function () {
      randomGlow(el);
    }, { passive: true });
  });
})();