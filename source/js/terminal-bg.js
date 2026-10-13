/*!
 * 小镇梦想家 · 背景代码流
 * 两层叠加：竖向命令流（原有）+ 横向渐变命令流（沿水平方向做 绿→蓝→青 渐变）。
 * 字符源为渗透测试 / 常用工具的命令行，不是随机符号：
 * 每条通道绑定一条命令，字符按顺序逐帧出现，配合渐隐形成可辨认的命令轨迹。
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
  var FRAME_MS = 1000 / 11;

  // 字符源：渗透测试与常用工具的命令
  var COMMANDS = [
    // 信息收集
    'nmap -sV -p- 10.10.10.1',
    'nmap --script vuln 10.10.10.1',
    'masscan -p1-65535 10.0.0.0/8 --rate=1000',
    'rustscan -a 10.10.10.1 -- -sV',
    'subfinder -d target.com -o sub.txt',
    'amass enum -passive -d target.com',
    'assetfinder --subs-only target.com',
    'dnsx -l sub.txt -a -resp',
    'httpx -l sub.txt -title -status-code -tech-detect',
    'whatweb -a 3 http://target.com',
    'wafw00f https://target.com',
    'nmap -p80,443 --script http-title 10.10.10.1',
    // 目录 / 文件
    'dirsearch -u http://target.com -e php,asp,js',
    'dirsearch -u http://target.com -w dict.txt -t 30',
    'dirsearch -u http://target.com -r -R 3',
    'ffuf -w wordlist.txt -u http://target.com/FUZZ',
    'ffuf -w sub.txt -u http://FUZZ.target.com',
    'gobuster dir -u http://target.com -w dir.txt',
    'gobuster vhost -u http://target.com -w vhost.txt',
    'feroxbuster -u http://target.com -w dir.txt -x php',
    'nikto -h http://target.com -Tuning 123',
    'wfuzz -c -w dict.txt http://target.com/FUZZ',
    'curl -I http://target.com/robots.txt',
    'subjs -i http://target.com -o js.txt',
    'katana -u http://target.com -d 3 -jc',
    'gau target.com | httpx -silent',
    'waybackurls target.com | sort -u',
    // 漏洞利用
    'sqlmap -u "http://target.com/?id=1" --dbs',
    'sqlmap -r req.txt --batch --level 5 --risk 3',
    'nuclei -l urls.txt -t cves/ -severity high',
    'searchsploit apache 2.4.49',
    'msfconsole -q -x "use exploit/multi/handler"',
    'msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.10.14.5',
    'hydra -l admin -P pass.txt ssh://10.10.10.1',
    'hashcat -m 1000 ntlm.txt rockyou.txt',
    'john --wordlist=rockyou.txt --format=raw-md5 hash.txt',
    'curl -X POST http://target.com/api -d @data.json',
    // 内网 / 权限维持
    'nc -lvnp 4444',
    'python3 -m http.server 8080',
    'chisel server -p 8080 --reverse',
    'socat TCP-LISTEN:4444,fork TCP:127.0.0.1:3389',
    'ssh -D 1080 -N -f user@10.10.10.1',
    'proxychains nmap -sT -Pn -p445 10.10.10.1',
    'bloodhound-python -c All -u user -d domain.local',
    'impacket-secretsdump domain/admin@10.10.10.1',
    'crackmapexec smb 10.10.10.0/24 -u user -p pass'
  ];

  // 竖向命令流
  var V_FONT = 13;
  var V_COL_GAP = 26;
  // 每帧下落 2 行（26px），让同列相邻字符之间留出空隙，
  // 否则 13px 字配 13px 步进会首尾相接、糊成竖直条纹
  var V_ROW_STEP = 2;
  var V_FADE = 0.2;
  var V_ACCENT_RATIO = 0.02;

  // 横向命令流
  var H_FONT = 13;
  var H_ROW_GAP = 38;
  // 同上：步进 18px > 字号 13px，保证横向相邻字符不粘连
  var H_STEP = 18;
  var H_FADE = 0.24;

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
        // 横向命令流：绿 → 蓝 → 青，两端透明淡出
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

  // 一条通道 = 一条命令 + 当前推进到命令的第几个字符
  function newLane(startPos) {
    var cmd = COMMANDS[(Math.random() * COMMANDS.length) | 0];
    return {
      pos: startPos,
      cmd: cmd,
      ci: Math.floor(Math.random() * cmd.length)
    };
  }

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
      drops[i] = newLane(-Math.floor(Math.random() * 30));
    }
    vertical.ctx.clearRect(0, 0, vertical.w, vertical.h);

    fit(horizontal);
    var rows = Math.ceil(horizontal.h / H_ROW_GAP);
    heads = new Array(rows);
    for (var j = 0; j < rows; j++) {
      heads[j] = newLane(-Math.floor(Math.random() * 40) * H_STEP);
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
      var lane = drops[i];
      var y = lane.pos * V_FONT;

      // 落到屏幕外后择机换一条新命令，重新从命令开头走
      if (y > h && Math.random() > 0.97) {
        lane = drops[i] = newLane(-Math.floor(Math.random() * 14));
        y = lane.pos * V_FONT;
      }

      if (y > -V_FONT && y < h) {
        var isAccent = Math.random() < V_ACCENT_RATIO;
        ctx.fillStyle =
          'rgba(' +
          (isAccent ? colors.accent : colors.dim) +
          ',' +
          (isAccent ? colors.accentA : colors.dimA) +
          ')';
        ctx.fillText(lane.cmd.charAt(lane.ci % lane.cmd.length), i * V_COL_GAP, y);
      }

      lane.pos += V_ROW_STEP;
      lane.ci += 1;
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
      var lane = heads[i];
      var x = lane.pos;

      if (x > w && Math.random() > 0.96) {
        lane = heads[i] = newLane(-Math.floor(Math.random() * 30) * H_STEP);
        x = lane.pos;
      }

      if (x > -H_FONT && x < w) {
        ctx.fillText(lane.cmd.charAt(lane.ci % lane.cmd.length), x, i * H_ROW_GAP);
      }

      lane.pos += H_STEP;
      lane.ci += 1;
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