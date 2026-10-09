# Jenrimark 个人站点

Astro 静态站：首页作品集 + `/view/` 快捷工作台。  
线上：https://www.jenrimark.cn · 备用：https://jenrimark.github.io

## 快速开始

```bash
npm install
npm run dev        # 本地开发
npm run check      # 类型检查
npm run build      # 构建到 dist/
```

## 项目结构

```
jenrimark.github.io/
├── package.json / package-lock.json   # 依赖与 npm 脚本（dev/build/check）
├── astro.config.mjs                   # Astro 构建配置（站点 URL、集成）
├── tsconfig.json                      # TypeScript 配置
│
├── src/                               ★ 源码主目录
│   ├── pages/                         # 路由页面（文件即 URL）
│   │   ├── index.astro                #   首页 / 作品集落地页
│   │   └── view.astro                 #   快捷工作台 /view/
│   │
│   ├── layouts/
│   │   └── ViewLayout.astro           # view 页外壳（HTML 骨架、容灾脚本）
│   │
│   ├── components/                    # 可复用 UI 组件
│   │   ├── LandingPage.tsx            #   首页 React 组件
│   │   ├── CursorFX.astro             #   鼠标拖尾光效
│   │   └── SearchIcon / ClearIcon     #   小图标组件
│   │
│   ├── data/                          # 静态配置数据（改内容主要改这里）
│   │   ├── profile.ts                 #   个人资料
│   │   ├── view-search.ts             #   搜索引擎列表
│   │   ├── view-links.ts              #   默认快捷链接
│   │   └── view-backgrounds.ts        #   背景图配置
│   │
│   ├── scripts/                       # view 页前端逻辑（TS）
│   │   ├── view-page.ts               #   总入口，装配各小组件
│   │   ├── view-clock.ts              #   时钟
│   │   ├── view-autocomplete.ts       #   搜索联想（最近记录 + 百度）
│   │   ├── view-todo.ts               #   待办
│   │   ├── view-notepad.ts            #   记事本（本地保存 / 打开 / 另存为）
│   │   ├── view-widgets.ts            #   音乐 / IP信息 / 翻译 / 二维码
│   │   ├── view-layout.ts             #   组件拖拽布局
│   │   ├── view-theme.ts              #   主题切换
│   │   ├── view-background.ts         #   背景图
│   │   ├── view-quote.ts              #   一言
│   │   ├── view-weather.ts            #   天气（Open-Meteo）
│   │   ├── view-links-state.ts        #   快捷链接状态
│   │   └── favicon-cache.ts           #   站点图标缓存
│   │
│   ├── styles/
│   │   ├── landing.css                #   首页样式
│   │   └── view.css                   #   view 页样式（大头）
│   │
│   ├── content/blog/                  # 博客 Markdown
│   │   └── hello-world.md
│   ├── content.config.ts              # Astro 内容集合定义
│   └── site.config.ts                 # 站点标题 / 描述 / URL
│
├── public/                            # 原样发布到网站根目录的静态资源
│   ├── favicon.svg / favicon.ico
│   ├── jenrimark-logo.svg / jenrimark-emblem.svg
│   ├── healthz                        # 健康检查端点
│   ├── view/backgrounds/              # view 背景图
│   └── downloads/                     # 浏览器扩展 zip
│
├── extension/                         # Chrome 扩展源码
│   ├── manifest.json
│   ├── background.js / content.js
│   └── README.md
│
├── deploy/                            # 部署相关
│   ├── nginx/ip-api-proxy.conf        #   IP-API 同源反代（Nginx）
│   ├── scripts/                       #   Windows 部署 / SSH / Webhook 脚本
│   ├── windows/                       #   .bat 启动器
│   └── frp/                           #   内网穿透示例
│
├── scripts/zip-extension.mjs          # 打包扩展 zip 的构建脚本
│
├── .github/workflows/
│   ├── ci.yml                         # 推送 / PR 类型检查
│   ├── deploy.yml                     # 部署到 GitHub Pages
│   └── deploy-server.yml              # rsync 部署到 VPS
│
└── dist/                              # npm run build 产物（发布用，不手改）
```

## 常见改动入口

| 你想改… | 去哪 |
|---|---|
| 页面结构 / 卡片 HTML | `src/pages/view.astro` |
| 交互逻辑 | `src/scripts/view-*.ts` |
| 样式 / 布局 | `src/styles/view.css` |
| 搜索引擎 / 快捷链接等配置 | `src/data/` |
| 服务器反代（IP-API 等） | `deploy/nginx/` |
| 自动部署 | `.github/workflows/` |

## 部署

| 通道 | 说明 |
|---|---|
| GitHub Pages | push `main` → `deploy.yml` |
| VPS（www.jenrimark.cn） | push `main` → `deploy-server.yml` rsync 到服务器 |

服务器 Nginx 反代片段见 `deploy/nginx/ip-api-proxy.conf`（IP 信息组件走 IP-API.com 免费版）。
