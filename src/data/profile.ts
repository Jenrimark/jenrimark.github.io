/** 个人资料 — 简介 / 简历 / 项目页共用 */
export const profile = {
  fullName: '吴汉东',
  tagline: '软件工程 · 全栈开发 · 竞赛实践',
  subtitle: '地大在读 · 专业前 10% · 前后端与工程化',
  intro:
    '中国地质大学（武汉）软件工程专业本科在读，综合排名专业前 10%。在校担任班长、学院学生会主席、党支部书记，具备团队协作与项目组织经验。主修 Java、数据库、Go、C++、数据结构、计算机网络、操作系统、算法分析与设计、软件工程基础、离散数学等课程。关注 Vue3/React 现代前端与 SpringBoot/Go 后端，持续实践组件化开发与性能优化。',
  info: [
    { label: '姓名', value: '吴汉东' },
    { label: '生日', value: '2004 年 11 月 19 日' },
    { label: '城市', value: '武汉' },
    { label: '邮箱', value: '2303532728@qq.com', href: 'mailto:2303532728@qq.com' },
    { label: '电话', value: '18471609769' },
    { label: '政治面貌', value: '中共党员' },
    { label: 'GitHub', value: 'github.com/Jenrimark', href: 'https://github.com/Jenrimark' },
    { label: '状态', value: '本科在读 · 寻求实习机会' },
  ],
  features: [
    {
      icon: 'stack',
      title: '全栈开发',
      description:
        '熟悉 Vue3、React、TypeScript 与 SpringBoot、Go/Gin，具备前后端分离架构与 RESTful 接口联调经验。',
    },
    {
      icon: 'bolt',
      title: '实时通信',
      description:
        'WebSocket 即时通讯、Redis 缓存、JWT 鉴权，在 IM 与健康管理系统中落地低延迟与高并发场景。',
    },
    {
      icon: 'chart',
      title: '性能优化',
      description:
        'SQL 索引优化、Redis 缓存、代码分割与虚拟滚动，核心接口与页面响应均有可量化提升。',
    },
    {
      icon: 'award',
      title: '竞赛与工程',
      description:
        'MathorCup 全国一等奖等多项竞赛荣誉，能将竞赛经验转化为可交付的全栈项目实践。',
    },
  ],
  featuredProject: {
    name: 'Little-Wechat',
    badge: '代表作',
    description: '即时通讯系统 — WebSocket 实时消息 · Redis 在线状态 · Electron 桌面端',
    href: 'https://github.com/Jenrimark',
    stars: '—',
    forks: '—',
    meta: 'SpringBoot + Vue3 + Electron',
  },
  skills: [
    { name: '前端开发（Vue3 / React / TS / ArkTS）', level: 88 },
    { name: '后端开发（SpringBoot / MyBatis / Go / Gin）', level: 82 },
    { name: '实时通信与鉴权（WebSocket / JWT）', level: 80 },
    { name: '数据库与缓存（MySQL / Redis）', level: 80 },
    { name: '工程化与部署（Git / Maven / Docker / Nginx / Linux）', level: 75 },
    { name: '英语（CET-4）', level: 70 },
  ],
  timeline: {
    education: [
      {
        role: '软件工程 · 本科',
        org: '中国地质大学（武汉）',
        period: '2023.09 — 至今',
        desc: '综合排名专业前 10%；班长、学院学生会主席、党支部书记。主修 Java、数据库、Go、C++、数据结构、计算机网络、操作系统、算法分析与设计、软件工程基础、离散数学等。',
      },
    ],
    work: [
      {
        role: '前端 / 交互开发实习生',
        org: '武汉美和易思 · 智慧就业 PDT',
        period: '2025.11 — 2026.04',
        desc: '参与「AI 智慧就业系统」迭代，负责「AI 数字人模拟面试」模块前端交互与视觉优化。Vue3 状态路由与答题流程、Canvas 口型与表情动画、CSS3 过渡与懒加载/虚拟滚动，页面响应提升约 30%。',
      },
    ],
    awards: [
      {
        role: 'MathorCup 数学应用挑战赛',
        org: '全国一等奖',
        period: '2025',
        desc: '大数据竞赛方向。',
      },
      {
        role: '电子商务「三创」挑战赛',
        org: '省赛一等奖',
        period: '2025',
        desc: '创新、创意及创业赛道。',
      },
      {
        role: 'RoboCup 中国赛先进视觉赛',
        org: '省赛二等奖 · 全国三等奖',
        period: '2025',
        desc: '3D 识别项目。',
      },
      {
        role: '全国大学生英语翻译大赛（NETCCS）',
        org: '省级二等奖',
        period: '2024',
        desc: '英语翻译类竞赛。',
      },
      {
        role: '校级及以上荣誉',
        org: '个人与团队奖项 10 余项',
        period: '2023 — 2025',
        desc: '含个人与团队类校级以上荣誉。',
      },
    ],
  },
  selfEval:
    '工作积极认真，细心负责，勇于迎接新挑战；具备良好的工程化开发意识，熟悉 Vue3/React 等现代前端技术栈，能够完成组件化与模块化开发。关注前端技术演进与 AI 辅助开发（Vibe Coding），在项目中持续实践代码复用与开发效率优化，具备快速学习新技术并落地到实际项目的能力。',
  projectSections: [
    {
      id: 'deployed',
      title: '已部署项目',
      icon: 'rocket',
      projects: [
        {
          title: '合租管家',
          description:
            '费用分摊、值日排班、囤货登记、室友公约，把最容易吵架的几件事变成清清楚楚的小工具。已部署 GitHub Pages。',
          href: 'https://jenrimark.github.io/',
          live: true,
          meta: 'Vite · React · TypeScript · Express',
          color: '#4f9de0',
        },
        {
          title: 'Jenrimark 个人门户',
          description:
            '当前所在站点：Astro 静态站，聚合个人项目、作品集与知识库，Git push 触发 Webhook 自动部署。',
          href: 'http://120.24.93.79:23332/',
          live: true,
          meta: 'Astro · CI/CD',
          color: '#e07a4f',
        },
      ],
    },
    {
      id: 'opensource',
      title: '开源项目',
      icon: 'code',
      projects: [
        {
          title: 'Little-Wechat',
          description:
            '独立完成登录、聊天、好友列表等核心模块；WebSocket 实时通信（延迟 <100ms），Redis 缓存在线状态与聊天数据，数据库查询压力降约 60%，Electron 跨平台桌面端。',
          href: 'https://github.com/Jenrimark',
          meta: 'SpringBoot · Vue3 · WebSocket · Redis',
          color: '#e07a4f',
        },
        {
          title: 'Greenhouse-AI',
          description:
            'AI Agent 系统：多 Agent 基建与编排，自动化闭环，构建通过 + 28 项测试覆盖。',
          href: 'https://github.com/Jenrimark/Greenhouse-AI',
          meta: 'TypeScript · Agent',
          color: '#5aab8c',
        },
        {
          title: '蝶启新生 · 健康管理',
          description:
            'Vue3 + Go/Gin 全栈，JWT 无状态鉴权；Redis 缓存使查询效率提升约 50%，核心接口由 900ms 降至 400ms；ECharts 多维健康分析，Nginx 反向代理部署。',
          href: 'https://github.com/Jenrimark/Health-Management',
          meta: 'Gin · Vue3 · JWT · GORM',
          color: '#b07ad9',
        },
        {
          title: '灵犀旅行',
          description:
            'AI 旅游平台，独立开发路线推荐与景点展示；百度地图 + ECharts 可视化，Redis 缓存与 MySQL 查询优化，接口响应 300ms 内。',
          href: 'https://github.com/Jenrimark/LynxTrip-AI',
          meta: 'SpringBoot · Vue3 · ECharts',
          color: '#5aab8c',
        },
        {
          title: 'ChronosForHarmony',
          description: 'HarmonyOS 应用开发实践，鸿蒙原生能力探索。',
          href: 'https://github.com/Jenrimark/ChronosForHarmony',
          meta: 'ArkTS · HarmonyOS',
          color: '#4f9de0',
        },
        {
          title: 'tabmark-organizer',
          description:
            'Chrome 扩展：浏览器书签同步整理，支持 AI 优化结构与命名。',
          href: 'https://github.com/Jenrimark/tabmark-organizer',
          meta: 'JavaScript · Chrome 扩展',
          color: '#d4a843',
        },
      ],
    },
    {
      id: 'tools',
      title: '工具与实验',
      icon: 'tool',
      projects: [
        {
          title: 'AI 数字人模拟面试',
          description: '实习期间负责的交互模块，Canvas 表情动画、题库虚拟滚动与面试流程状态机。',
          href: 'https://github.com/Jenrimark',
          meta: 'Vue3 · Canvas',
          color: '#d4a843',
        },
        {
          title: 'MapDemo',
          description: '地图能力演示与交互实验（Kotlin）。',
          href: 'https://github.com/Jenrimark/MapDemo',
          meta: 'Kotlin · Map',
          color: '#5aab8c',
        },
        {
          title: 'Geologic-Age-Calculation',
          description:
            '地质年代数据处理工具：匹配与插值年代值，对齐 IUGS 2023.9 标准地质时间尺度。',
          href: 'https://github.com/Jenrimark/Geologic-Age-Calculation',
          meta: 'R · data-analysis',
          color: '#b07ad9',
        },
      ],
    },
  ],
} as const;
