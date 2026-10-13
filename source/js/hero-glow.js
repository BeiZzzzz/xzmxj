/*!
 * 小镇梦想家 · 首页 hero 增强
 * 1) 圆形头像（点击进入关于页）
 * 2) 头像与标题悬停时产生随机配色的渐变辉光
 * 3) 「心路历程」入口（点击进入关于页的竖向时间线）
 * 4) 仿终端窗口，置于 hero 右侧，与左侧信息区组成左右两栏
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
  var TERM_HOST = 'xzmxj';
  var TERM_USER = 'bei';

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

  // ---- 心路历程入口：放在头像与标题之间，点击进入关于页 ----
  if (!info.querySelector('.hero-journey')) {
    var chip = document.createElement('a');
    chip.className = 'hero-journey';
    chip.href = ABOUT_PATH;
    chip.title = '关于我 · 心路历程';
    chip.innerHTML = '心路历程 <span class="hj-arrow">&rsaquo;</span>';
    info.insertBefore(chip, title);
  }

  // ---- 仿终端窗口 ----
  // 内容从侧栏卡片迁到这里，字符用 --i 控制逐行淡入的节奏
  var TERM_LINES = [
    { t: 'cmd', cmd: 'whoami' },
    { t: 'out', text: '小镇梦想家 · 安全学习者' },
    { t: 'cmd', cmd: 'cat README.md' },
    { t: 'out', text: '记录技术笔记与安全学习，构建自己的知识栈。' },
    { t: 'cmd', cmd: 'ls ~/categories' },
    {
      t: 'out',
      text: 'CTF各类比赛/&nbsp;&nbsp;&nbsp;网络渗透课程/&nbsp;&nbsp;SRC与渗透测试/&nbsp;&nbsp;随笔/'
    },
    { t: 'cmd', cmd: './status.sh' },
    { t: 'out', text: '[SYS]&nbsp;&nbsp;站点状态 ......... ONLINE' },
    { t: 'out', text: '[ENV]&nbsp;&nbsp;Hexo + Butterfly' },
    { t: 'prompt' }
  ];

  function promptHTML(cmd) {
    return (
      '<span class="p-user">' + TERM_USER + '</span>' +
      '<span class="p-host">@' + TERM_HOST + '</span>' +
      '<span class="p-path">:~</span>' +
      '<span class="p-sign">$</span>' +
      (cmd ? '<span class="term-cmd">' + cmd + '</span>' : '<span class="term-cursor"></span>')
    );
  }

  function buildTerminal() {
    var body = TERM_LINES.map(function (line, i) {
      var cls = 'term-line ' + (line.t === 'out' ? 'term-line--out' : 'term-prompt');
      var inner = line.t === 'out' ? line.text : promptHTML(line.cmd);
      return '<div class="' + cls + '" style="--i:' + i + '">' + inner + '</div>';
    }).join('');

    var win = document.createElement('div');
    win.className = 'term-window';
    win.innerHTML =
      '<div class="term-bar">' +
      '<span class="term-dot term-dot-r"></span>' +
      '<span class="term-dot term-dot-y"></span>' +
      '<span class="term-dot term-dot-g"></span>' +
      '<span class="term-title">' + TERM_USER + '@' + TERM_HOST + ': ~</span>' +
      '</div>' +
      '<div class="term-body">' + body + '</div>';
    return win;
  }

  // ---- 两栏布局：左（头像 + 入口 + 标题 + 副标题）｜右（终端）----
  if (!info.querySelector('.hero-grid')) {
    var grid = document.createElement('div');
    grid.className = 'hero-grid';

    var left = document.createElement('div');
    left.className = 'hero-left';

    var right = document.createElement('div');
    right.className = 'hero-right';

    grid.appendChild(left);
    grid.appendChild(right);

    // 把已有内容按视觉顺序搬进左栏
    function moveToLeft(el) {
      if (el && el.parentNode === info) left.appendChild(el);
    }
    moveToLeft(info.querySelector('.hero-avatar'));
    moveToLeft(info.querySelector('.hero-journey'));
    moveToLeft(title);
    moveToLeft(document.getElementById('site-subtitle'));

    right.appendChild(buildTerminal());
    info.appendChild(grid);
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
