---
title: 红日靶场2 打靶日志
date: 2026-11-09 21:30:00
updated: 2026-11-09 21:30:00
categories:
  - 打靶日志
tags:
  - 内网渗透
  - 靶场
  - WebLogic
  - 内存马
  - Cobalt Strike
  - 域渗透
  - Fscan
cover: /img/mhwgon-banner.svg
description: 红日靶场2：从 7001 端口的 WebLogic 历史漏洞写入哥斯拉内存马，识别 360 后 CS 上线，抓取凭证提权，fscan 定位域控 10.10.10.10，最终横向拿下 DC。
---

开启靶机

{% asset_img img1.jpg %}

Nmap扫描一下断开

```text
Nmap -sV
```

发现7001存在web界面

```text
http://192.168.111.80:7001/
```

直接访问发现没啥东西

{% asset_img img2.jpg %}

目录扫描一下

{% asset_img img3.jpg %}

访问/console，发现是weblogic的框架，针对性的扫一下nday，因为版本比较老了

{% asset_img img4.jpg %}

发现存在多个历史RCE漏洞，写入内存马

{% asset_img img5.jpg %}

发现存在俩个网卡

```text
10.10.10.80
192.168.111.80
```

{% asset_img img6.jpg %}

这里存在一个问题是如果要上传shell的话我们不知道具体的web路径，那就直接打哥斯拉内存马

{% asset_img img7.jpg %}

连接内存马

{% asset_img img8.jpg %}

信息收集一下，在域内de1lay.com

{% asset_img img9.jpg %}

```text
de1ay.com
10.10.10.80
192.168.111.80
```

这里看到有360的

{% asset_img img10.jpg %}

Tasklist查看进程

{% asset_img img11.jpg %}

杀软识别

{% asset_img img12.jpg %}

上线一下CS先，话不多说，这里其实杀软感觉没啥用，不做免杀也可也直接上线的

注意kali和本机只能有一个连接VPN，不可能同时连接

依旧老一套打法，就不说了，感兴趣的上一篇红日1的上面有详细操作

成功上线

{% asset_img img13.jpg %}

Ping一下de1ay发现域控应该是这个10.10.10.10

{% asset_img img14.jpg %}

这里大保健直接一键收集全部信息

{% asset_img img15.jpg %}

{% asset_img img16.jpg %}

抓取一下哈希

{% asset_img img17.jpg %}

抓取的凭证

{% asset_img img18.jpg %}

利用凭证提取

{% asset_img img19.jpg %}

Cobalt Strike 的“凭证提权”功能，本质上是利用抓取到的账号和密码（或哈希），在目标机器上以该账号的身份直接登录，从而“继承”这个账号原本就拥有的高权限。

## 原理一：Windows 令牌（Token）的“借权”

Windows 系统通过“访问令牌”来识别用户。当你用 GOD\Administrator 的凭证进行“凭证提权”时，CS 实际上是在系统中进行了一次模拟登录（Logon）。登录成功后，系统会为该凭证生成一个对应的“访问令牌”。

CS 随即将这个令牌“注入”到自己的 Beacon 进程中。此后，Beacon 发出的所有操作，都会被 Windows 视为 GOD\Administrator 的行为。也就是说，Beacon 并没有变强，而是换了一个高权限的“身份证”去执行操作。

## 原理二：明文密码 vs NTLM 哈希

你抓到的 GOD\Administrator 明文密码 qwe@123，能让 CS 直接用 CreateProcessWithLogonW 等 API 完成完整的登录流程，这比单纯使用哈希（Pass the Hash）更“原生”且成功率高。无论用明文还是哈希，目的都是让你在没有实际登录到目标桌面的情况下，获得该账户的访问能力。

上传fscan

{% asset_img img20.jpg %}

扫描一下10.10.10.1/24这个网段

{% asset_img img21.jpg %}

发现10.10.10.10就是域控，那么接下来就是打域控了

{% asset_img img22.jpg %}

做一下端口扫描先，发现10.10.10.10这个域控目标

{% asset_img img23.jpg %}

让10.10.10.10出现在目标列表

{% asset_img img24.jpg %}

{% asset_img img25.jpg %}

接着来到目标这里，选择域控进行横向移动

{% asset_img img26.jpg %}

这样子就可以了

{% asset_img img27.jpg %}

注意这个域得选择刚刚看到的de1ay域，别弄成god了，god是红日1的，我这里做过红日1没删所以它这里有，然后监听器选择刚刚创建的smb监听器，会话就选择那个web服务器的那个,在弄完后点击运行，等待片刻便可以看到dc域控服务器已经上线了

{% asset_img img28.jpg %}

拿到flag

其实这个靶场弄的这个防火墙和360没啥用，正确的应该要关掉防火墙和免杀绕过360的

{% asset_img img29.jpg %}

这里其实有坑，这个靶场进去上线的主机本身就是域用户了，不需要去上线域用户从而去攻击域控