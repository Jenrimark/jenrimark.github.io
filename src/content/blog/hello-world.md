---
title: 第一篇文章 — MVP 已上线
description: 先上线一篇文章，比纠结主题颜色重要一万倍。
pubDate: 2026-05-24
tags: [astro, mvp]
---

欢迎来到我的个人站点 **1.0 版本**。

这套架构很轻：

- **Astro** 生成纯静态页面，默认零客户端 JavaScript
- **Git push** 触发 GitHub Actions，再 curl 家里 Webhook
- 家里 **git pull + npm run build**，Nginx 直接托管 `dist/`
- **frp** 把公网流量穿透到本地

## 下一步

1. 在 `src/content/blog/` 下继续加 Markdown
2. 有公开仓库的项目链接已在 `src/data/profile.ts` 维护，其余待开源后补上

写就完事了。
