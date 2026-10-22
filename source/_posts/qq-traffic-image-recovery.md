---
title: 网络渗透课程作业3：QQ 流量分析与明文图片还原
date: 2026-10-22 14:00:00
updated: 2026-10-22 14:00:00
categories:
  - 网络渗透课程
tags:
  - Wireshark
  - 流量分析
  - QQ
  - 010Editor
  - 图片还原
  - 网络渗透
cover: /img/mhwgon-banner.svg
description: 用 Wireshark 抓取 QQ 在 PC 与手机之间传输图片的流量，通过 HTTP 追踪流导出原始数据，再用 010Editor 修正 JPEG 文件头，还原出明文传输的图片，并回答作业中关于协议、加密与文件恢复的问题。
---

> 本文为网络渗透课程作业 3 的实验记录：在同一 WiFi 下抓取手机与电脑之间 QQ 传图的流量，把 HTTP 流中的原始数据导出，修正文件头后还原出原始图片。

作业要求如下：

{% asset_img img1.jpg "作业要求：QQ 流量分析（PC-PC 端、PC-手机端），需要回答 UDP 还是 TCP、加密还是明文、能否恢复明文传输的文件" %}

本次使用到的工具有：**QQ、Wireshark、010Editor**。

## 1. 保证两端处于同一网络

首先确保电脑与手机都登录了 QQ，并且连接同一个 WiFi。

{% asset_img img2.png "手机端连接 GUET-WiFi" %}

{% asset_img img3.jpg "电脑端同样连接该 WiFi" %}

## 2. 选择 WiFi 网卡开始抓包

打开 Wireshark，选择 WiFi 网卡，开始抓包。

{% asset_img img4.png "选择 WiFi 接口后开始捕获" %}

## 3. 查看手机的 IP 地址

可以在手机的 WiFi 设置里查看当前分配的 IP 地址，用来做后续过滤。

{% asset_img img5.jpg "手机 WiFi 详情中的 IP 地址" %}

## 4. 用 ip.addr 过滤目标流量

在显示过滤器中使用：

```text
ip.addr==你的手机IP
```

{% asset_img img6.jpg "过滤后只剩与该 IP 相关的流量" %}

> 注意：如果你要发送的图片在电脑上已经存在，QQ 传输时会直接走本地已有的文件，这种情况下是抓不到图片数据的。

## 5. 追踪 HTTP 流

右键任意一条 HTTP 报文 → **追踪流** → **HTTP**，可以看到下面的界面。

{% asset_img img7.png "追踪 HTTP 流" %}

在追踪流窗口里，把方向从「整个对话」改为「从你 IP 地址发出的」，并把「显示为 ASCII」改为「显示原始数据」。

{% asset_img img8.jpg "改为显示原始数据" %}

{% asset_img img9.jpg "原始数据中出现图片的二进制内容" %}

## 6. 导出为图片文件

把这段原始数据另存为任意图像文件（比如 `.jpg`）放到桌面上。

{% asset_img img10.jpg "另存为图片文件" %}

此时双击是打不开的——因为它还不是一个完整的图片文件。

{% asset_img img11.jpg "图片无法打开" %}

## 7. 用 010Editor 修复文件头

用 010Editor 打开探查一下，可以看到文件开头多了一些字节。

{% asset_img img12.jpg "010Editor 中的十六进制视图" %}

JPEG 文件一般以 `FF D8` 开头，把 `FF D8` 前面多余的字节删掉。

{% asset_img img13.png "删除 FF D8 之前的冗余字节" %}

## 8. 保存后重新打开

保存后再打开，发现原始传输的图片被成功抓取到了。

{% asset_img img14.jpg "还原出来的原始图片" %}

## 结论

- **UDP 还是 TCP**：抓到的图片流量是 HTTP 协议，HTTP 基于 TCP，因此属于 TCP。
- **加密还是明文**：图片数据以明文形式出现在 HTTP 响应体中，未做加密，可以直接看到图片内容。
- **文件恢复**：HTTP 流里的图片是「裸」的图片数据，开头缺少标准文件头。不同文件类型有各自的头部特征码（JPEG 为 `FF D8`），删掉前面的多余字节后即可正常打开。
