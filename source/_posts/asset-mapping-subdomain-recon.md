---
title: 网络渗透课程作业2：网络空间测绘与子域名收集
date: 2026-09-29 10:00:00
updated: 2026-09-29 10:00:00
categories:
  - 网络渗透课程
tags:
  - 网络空间测绘
  - ZoomEye
  - FOFA
  - 子域名收集
  - 资产打点
  - 红队
cover: /img/mhwgon-banner.svg
description: 梳理与 ZoomEye 同类的网络空间测绘引擎（FOFA、零零信安、Quake、Hunter、Shodan、Censys、BinaryEdge）的定位、语法与选型，并总结子域名收集与资产打点的四条思路和标准红队实战流程。
---

> 本文为网络渗透课程作业 2 的学习记录，分两部分：一是与 ZoomEye 功能类似的网络空间测绘搜索引擎对比，二是子域名收集与资产打点的思路与实战流程。

作业要求如下：

{% asset_img img1.png "作业要求：同类测绘引擎检索、结合 ZoomEye 检索截图、子域名收集截图并发布到 Blog" %}

## 写在前面：什么是网络空间测绘引擎

**ZoomEye（钟馗之眼）**，和 FOFA 齐名，都是**网络空间测绘引擎**：主动扫描全网 IP，保存端口、banner、服务、证书、组件信息，用于资产发现、旁站、漏洞测绘。

## 国内主流

- **FOFA（最常用）**
  特点：语法丰富，API 成熟，资产更新快；支持 `ip`、`domain`、`title`、`body`、`cert`、`port` 等字段；SRC / 红队首选。
  语法示例：`ip="1.1.1.1"`、`app="SpringBoot"`
- **零零信安（0.zone）**
  特点：轻量，免费额度，适合批量域名 / 站点资产查询，有 API，即 0.zone。
- **Quake（360 quake，360 测绘）**
  特点：360 出品，主机测绘，侧重国内资产；支持 `service`、`app`、`cert`；区分主机和网站；有 API。
- **Hunter 鹰图（奇安信）**
  特点：奇安信，国内资产量大，支持证书检索、关联域名，适合政企资产测绘。

## 国外测绘引擎

- **Shodan（全球老牌，测绘鼻祖）**
  特点：全球 IoT、服务器设备测绘，侧重端口和服务 banner；适合境外资产；国内资产覆盖不如 FOFA / ZoomEye。
- **Censys**
  特点：偏向证书、TLS、IP 层信息，适合证书碰撞、Host 碰撞；对 https 站点证书检索很强。
- **BinaryEdge**
  特点：端口扫描 + 域名 + 证书，API 友好，海外资产。

## 对比简表

| 引擎 | 厂商 | 侧重点 | 适合场景 |
| --- | --- | --- | --- |
| ZoomEye | 知道创宇 | 网站 + 主机，web 组件识别 | 旁站、web 资产测绘 |
| FOFA | 白帽汇 | Web 站点强，语法灵活 | SRC 挖洞，批量资产 |
| Quake | 360 | 主机维度，端口服务 | 内网边界设备测绘 |
| Hunter | 奇安信 | 政企、国内资产 | 护网、政企资产搜集 |
| Shodan | 国外 | IoT、全球设备 | 境外设备 |
| Censys | 国外 | SSL 证书、TLS 信息 | 证书 host 碰撞 |

## 补充知识点（面试 / 实战）

- **核心原理**：这类测绘引擎本质是**分布式端口扫描器**，持续对全网 IP 进行扫描，抓取服务返回的 banner、http 响应头、网页标题、证书信息，存入数据库，提供查询 API。
- **ZoomEye / FOFA**：偏向 **Web 应用识别**，优先抓 80 / 443 网页内容。
- **Shodan**：偏向底层设备（摄像头、路由器、工控机）。

### 工具选型建议

- 国内 Web 资产挖 SRC：FOFA > ZoomEye > Hunter
- 找主机、端口、设备：Quake
- 证书检索、Host 碰撞：Censys
- 境外 IoT 设备：Shodan

## 一些搜索语法

各家引擎的字段命名不完全一样，下面是常见字段的语法对照：

{% asset_img img2.png "FOFA、Hunter、Quake、ZoomEye、Shodan、Censys、零零信安、DaydayMap 语法对照表" %}

总体来说 FOFA 的搜索广度我觉得是比较大一点，语法也比较简单。

比如我们要打 EDU SRC，可以挑选的脆弱资产，可以从一些登录框、系统下手：

```text
title="系统" && host="edu.cn" && status=200
```

支持 `||`、`&&` 等逻辑符号。检索效果如下：

{% asset_img img3.png "FOFA 检索 title=系统 && host=edu.cn，命中 19533 条结果" %}

## 如何进行子域名收集，进行资产打点？

子域名收集与资产打点，主要有四大收集思路。

### 1. 被动收集（不直接发包给目标，无流量，不会触发 WAF / 告警）

原理：查询第三方公开数据库，获取已经被别人爬取 / 记录过的子域名，**不向目标 DNS 服务器发任何请求**，隐蔽性最强。

#### 常用数据源 & 工具

- **网络空间测绘引擎**
  - FOFA：`domain="company.com"`
  - ZoomEye：`domain:company.com`
  - Hunter、Quake
  - 原理：测绘引擎全网扫描时记录域名，批量导出子域名 + 对应 IP。
  - 像这样直接搜索主机 `host="sjtu.edu.cn"` 就能搜集更多子域名，当然是不完整的。

    {% asset_img img4.png "FOFA 检索 host=sjtu.edu.cn，命中 7146 条结果" %}

- **DNS 历史记录**：Virustotal、SecurityTrails、DNSDumpster
  - VT 原理：全球大量用户访问域名，VT 会采集所有解析记录，可直接导出子域名列表。
- **证书透明度日志（CT 日志）**
  - 原理：HTTPS 域名申请 SSL 证书时会提交到 CT 公共日志，证书会写入所有绑定的子域名。
  - 工具：crt.sh，查询语句 `%.company.com`
- **搜索引擎语法**：如谷歌语法，经常能在上面搜集到一些泄漏的身份证信息，当然也可以用来做子域名收集。

  ```text
  site:company.com -www
  ```

  谷歌 / 百度 / Bing 爬虫收录页面，挖掘公开子域名。

  {% asset_img img5.png "Google 检索 site:sjtu.edu.cn，收录出多个子域名" %}

优点：无流量、无告警；缺点：只能拿到**已经被记录的域名**，新的、未上线的测试域名拿不到。

### 2. DNS 枚举（主动查询，分字典爆破 + 域传送漏洞）

#### ① 字典爆破（子域名暴力破解）

原理：准备子域名字典（常见：admin、test、dev、api、vpn、mail、oa、portal），循环向 DNS 服务器发起解析请求，**能返回 IP = 存在该子域名**。常用工具：

- **subfinder**（go 开发，速度快，被动 + 主动一体，红队首选）
- **amass**（OWASP 出品，被动 + 主动 + 递归爆破，结果最全）
- **dnsx**（配合字典做 DNS 解析，快速验证存活）

```bash
# subfinder 示例
subfinder -d company.com -o sub.txt
```

坑：字典质量决定结果；很多冷门子域名字典没有，会漏掉。

#### ② 域传送漏洞（AXFR，老漏洞）

原理：DNS 服务器配置错误，允许任何人执行域传送，一次性返回该域名**全部 DNS 记录（所有子域名）**，不需要字典。

```bash
# dig 测试域传送
dig @ns1.company.com company.com AXFR
```

现状：现在绝大多数 DNS 服务商默认禁止域传送，只有老旧自建 DNS 才会存在，属于碰运气。

### 3. 递归 / 证书枚举（泛域名处理）

**重点概念：泛域名解析（`*.company.com`）**——任意 `xxx.company.com` 都会解析到同一个 IP，直接字典爆破会返回大量假域名。

处理方式：工具自动识别泛域名，过滤掉无效的假解析结果。

### 4. 主动爬虫 / JS 源码挖掘

原理：访问主站页面，爬网页源码、JS 文件，JS 代码里经常硬编码写入子域名、接口域名。工具：**subjs**、**LinkFinder**，爬 JS 提取域名。

场景：开发人员写前端 JS 时写死了测试环境域名，外部公开但不在 CT 日志 / 测绘库中。

## 完整实战流程（标准红队资产收集）

1. 根域名输入，先用 **subfinder / amass** 做被动收集（FOFA、VT、crt.sh 一次性拉取），拿到基础子域名列表。
2. 用 **dnsx** 批量解析所有子域名，去重、过滤泛域名，筛选出能解析出 IP 的存活子域。
3. 对存活子域名批量 HTTP 探测（工具：httpx）：判断 http / https，获取 title、状态码、响应头、web 指纹。
   输出形如：`https://admin.company.com [200] [Admin后台系统]`
4. 清洗资产：剔除 404、403 无效站点，合并去重，得到最终资产清单。
5. 后续：对每个子域名，做端口扫描、旁站、漏洞探测。

利用一些工具进行子域名爆破，主要是看字典够不够大。这里用的是无影（WuYing）：

{% asset_img img6.png "无影 v3.4.3 域名枚举结果：命中 146 个子域名，存活 110 个" %}