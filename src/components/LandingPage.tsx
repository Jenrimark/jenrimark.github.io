import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Home, ArrowUpRight } from 'lucide-react';
import { profile } from '../data/profile';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4';

const EMAIL = '2303532728@qq.com';

/* ─── 导航菜单槽：图标态 ↔ 文字态 同位置渐变（由导航条 --p 进度驱动） ─── */

function MenuSlot({ href, label, text, newTab = false, children }: { href: string; label: string; text?: string; newTab?: boolean; children: ReactNode }) {
  const external = Boolean(newTab);
  const iconLayer = (color: string, opacity: string) => (
    <span className="absolute inset-0 flex items-center justify-center" style={{ color, opacity }} aria-hidden="true">
      {children}
    </span>
  );
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="menu-slot relative flex items-center justify-center h-9 min-w-9 rounded-xl transition-colors duration-300 hover:bg-white/15"
      style={
        text
          ? { width: 'calc(36px + (var(--tw, 36px) - 36px) * var(--p, 0))' } // 格子宽：图标态 36px → 文字态文字宽，随进度连续缩放
          : undefined
      }
    >
      {text ? (
        <>
          {/* 图标层：随格子一起收缩 + 淡出 + 变黑 */}
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{
              color: 'color-mix(in srgb, #f5f0e6 calc((1 - var(--p)) * 100%), #000)',
              opacity: 'calc(1 - var(--p))',
              transform: 'scale(calc(1 - 0.3 * var(--p)))',
            }}
            aria-hidden="true"
          >
            {children}
          </span>
          {/* 文字层：居中悬浮（不占位），从中心放大显现 + 奶白→黑 */}
          <span
            className="menu-slot-text absolute top-1/2 left-1/2 whitespace-nowrap text-sm font-medium px-1.5"
            style={{
              opacity: 'var(--p)',
              color: 'color-mix(in srgb, #f5f0e6 calc((1 - var(--p)) * 100%), #000)',
              transform: 'translate(-50%, -50%) scale(calc(0.7 + 0.3 * var(--p)))',
            }}
          >
            {text}
          </span>
        </>
      ) : (
        <>
          {iconLayer('#f5f0e6', 'calc(1 - var(--p))')}
          {iconLayer('#000', 'var(--p)')}
        </>
      )}
    </a>
  );
}

function SearchSvg({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m22 22-5.3-5.3" />
    </svg>
  );
}

function FolderSvg({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function MailSvg({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function FileTextSvg({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function BookOpenSvg({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function GitHubSvg({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 98 96" fill="currentColor" aria-hidden="true">
      <path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-06 48.9043 4.309e-06C21.8203 1.92261e-06 -1.9479e-06 22.1074 -4.3343e-06 49.1914C-6.20631e-06 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" />
    </svg>
  );
}

export default function LandingPage() {
  const bgRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const leftGroupRef = useRef<HTMLDivElement>(null);
  const rightGroupRef = useRef<HTMLDivElement>(null);

  /** 滚动进度联动：初始 6 图标分列左右（格子=图标宽），滚动后格子随进度放大为文字宽，两侧向中间收拢 */
  useEffect(() => {
    const bar = barRef.current;
    const row = rowRef.current;
    const leftGroup = leftGroupRef.current;
    const rightGroup = rightGroupRef.current;

    // 测量每个文字槽的文字宽度，写入 --tw（格子宽 = 36px → 文字宽 连续插值）
    const measureText = () => {
      bar?.querySelectorAll<HTMLElement>('.menu-slot-text').forEach((el) => {
        const host = el.closest<HTMLElement>('.menu-slot');
        if (host) host.style.setProperty('--tw', `${el.getBoundingClientRect().width}px`);
      });
    };
    measureText();
    // 字体加载完成后文字宽度可能变化，重测一次
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measureText).catch(() => {});
    }
    window.addEventListener('resize', measureText);

    const update = () => {
      // 0 ~ 130px 滚动距离内完成全部变化（原 200px 减约 1/3）
      const t = Math.min(Math.max(window.scrollY / 130, 0), 1);
      if (bar) {
        // 初始宽 1120px → 收拢宽 800px
        bar.style.maxWidth = `${1120 - 320 * t}px`;
        bar.style.borderRadius = `${9999 * t}px`;
        bar.style.backgroundColor = `rgba(255,255,255,${0.6 * t})`;
        bar.style.backdropFilter = `blur(${12 * t}px)`;
        (bar.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = `blur(${12 * t}px)`;
        bar.style.borderColor = `rgba(229,231,235,${0.7 * t})`;
        bar.style.boxShadow = t > 0 ? `0 4px 16px rgba(0,0,0,${0.12 * t})` : 'none';
        // 进度变量：驱动菜单槽 格子宽度/图标↔文字/颜色 渐变
        bar.style.setProperty('--p', String(t));
      }
      // 两侧图标组：向中间收拢（滑向聚合位置；格子宽度随进度变化，组宽实时实测）
      if (row && leftGroup && rightGroup) {
        const W = row.offsetWidth;
        const leftW = leftGroup.offsetWidth;
        const rightW = rightGroup.offsetWidth;
        // 聚合时两组并排居中、组间留 24px
        const target = Math.max(0, (W - leftW - rightW - 24) / 2);
        const a = target * t;
        leftGroup.style.transform = `translateX(${a}px)`;
        rightGroup.style.transform = `translateX(${-a}px)`;
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', measureText);
    };
  }, []);

  /** 视差全景：背景跟随鼠标轻微平移，营造纵深全景感 */
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 ~ 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    if (bgRef.current) {
      bgRef.current.style.transform = `scale(1.1) translate(${x * 28}px, ${y * 18}px)`;
    }
  };

  const resetParallax = () => {
    if (bgRef.current) {
      bgRef.current.style.transform = 'scale(1.1) translate(0, 0)';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div
        className="relative overflow-hidden min-h-screen lg:h-screen"
        onMouseMove={handleMouseMove}
        onMouseLeave={resetParallax}
      >
        {/* Background video with parallax panorama */}
        <video
          ref={bgRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scale(1.1) translate(0, 0)', transition: 'transform 0.35s ease-out', willChange: 'transform' }}
          src={VIDEO_URL}
        />

        {/* Content layer */}
        <div className="relative z-10 flex flex-col min-h-screen lg:h-full p-4 sm:p-6 md:p-8 gap-6">
          {/* 悬浮导航壳：初始 6 图标分列左右，滚动后向中间收拢，图标原地渐变为文字 */}
          <nav className="fixed top-0 left-0 right-0 z-[1000] px-4 py-3">
            <div
              ref={barRef}
              style={{ maxWidth: '1120px' }}
              className="relative mx-auto px-4 sm:px-6 py-1.5 border border-transparent"
            >
              <div ref={rowRef} className="flex items-center justify-between">
                {/* 左组：搜索 / 作品集 / 联系我 */}
                <div ref={leftGroupRef} className="flex items-center gap-2 sm:gap-3">
                  <MenuSlot href="/view/" label="快捷搜索">
                    <SearchSvg />
                  </MenuSlot>
                  <MenuSlot href="/" label="作品集" text="作品集">
                    <FolderSvg />
                  </MenuSlot>
                  <MenuSlot href="#contact" label="联系我" text="联系我">
                    <MailSvg />
                  </MenuSlot>
                </div>

                {/* 右组：简历 / 知识库 / GitHub */}
                <div ref={rightGroupRef} className="flex items-center gap-2 sm:gap-3">
                  <MenuSlot href="https://jenrimark.github.io/acad-homepage/" label="履历书" text="履历书">
                    <FileTextSvg />
                  </MenuSlot>
                  <MenuSlot href="https://fcn9od35aepq.feishu.cn/wiki/R1R3wPuzTioFtNkOnELcUJJLnBh?from=from_copylink" label="知识库" text="知识库" newTab>
                    <BookOpenSvg />
                  </MenuSlot>
                  <MenuSlot href="https://github.com/Jenrimark" label="GitHub" newTab>
                    <GitHubSvg />
                  </MenuSlot>
                </div>
              </div>
            </div>
          </nav>

          {/* Hero 字标 */}
          <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[2rem]">
            {/* TEMP-面试作业：临时悬浮窗，点击跳转合租助手（http://8.163.10.100/），演示结束后删除 */}
            <div className="mb-6 flex flex-col items-center gap-2.5">
              <a
                href="http://8.163.10.100/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-3 font-bold text-white text-base shadow-2xl shadow-orange-500/40 animate-pulse hover:scale-105 hover:shadow-orange-500/60 transition-all duration-300"
              >
                <Home size={20} strokeWidth={2.5} />
                合租助手 · 点击体验
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </a>
            </div>
            <img
              src="/jenrimark-logo.svg"
              alt="Jenrimark"
              className="w-full max-w-3xl drop-shadow-lg"
              style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))' }}
            />
          </div>

          {/* Scroll hint */}
          <div className="flex flex-col items-center gap-1.5 pb-1 text-white/80">
            <span className="text-xs tracking-wide drop-shadow">下滑查看更多</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* 下拉内容区：作品集 + 联系我 + 底部备案空间 */}
      <div className="bg-white">
        {/* 作品集 */}
        <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">作品集</h2>
              <p className="text-sm text-gray-500 mt-1">已部署项目、开源仓库与实用工具</p>
            </div>
          </div>

          {profile.projectSections.map((section) => (
            <div key={section.id} className="mb-10 last:mb-0">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-4">
                <span aria-hidden="true">{section.icon}</span>
                {section.title}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.projects.map((p) => (
                  <a
                    key={p.title}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-3 p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="flex items-center justify-center w-11 h-11 rounded-xl text-white font-bold text-base"
                        style={{ backgroundColor: p.color }}
                        aria-hidden="true"
                      >
                        {p.title.charAt(0)}
                      </span>
                      {'live' in p && p.live && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-orange-300 text-orange-500 bg-orange-50">
                          在线
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-black">
                        {p.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-auto">{p.meta}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* 联系我 */}
        <section id="contact" className="bg-gray-50 border-y border-gray-100 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight mb-8">联系我</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <a
                href={`mailto:${EMAIL}`}
                className="flex flex-col gap-1 p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-400 hover:-translate-y-0.5 transition-all"
              >
                <span className="text-xs text-gray-400">邮箱</span>
                <span className="text-sm font-medium text-gray-900 break-all">{EMAIL}</span>
              </a>
              <a
                href="https://github.com/Jenrimark"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1 p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-400 hover:-translate-y-0.5 transition-all"
              >
                <span className="text-xs text-gray-400">GitHub</span>
                <span className="text-sm font-medium text-gray-900">github.com/Jenrimark</span>
              </a>
              <a
                href="tel:18471609769"
                className="flex flex-col gap-1 p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-400 hover:-translate-y-0.5 transition-all"
              >
                <span className="text-xs text-gray-400">电话</span>
                <span className="text-sm font-medium text-gray-900">18471609769</span>
              </a>
              <a
                href="https://jenrimark.github.io/acad-homepage/"
                className="flex flex-col gap-1 p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-400 hover:-translate-y-0.5 transition-all"
              >
                <span className="text-xs text-gray-400">履历书</span>
                <span className="text-sm font-medium text-gray-900">在线履历书 →</span>
              </a>
            </div>
          </div>
        </section>

        {/* 底部：品牌徽章 + 备案号空间 */}
        <footer className="py-10 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/jenrimark-emblem.svg"
              alt="Jenrimark 徽章"
              className="w-12 h-12 opacity-60 hover:opacity-90 transition-opacity"
            />
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} 吴汉东 ·{' '}
            <span className="text-gray-400">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
                蜀ICP备2026055157号
              </a>
            </span>
          </p>
          <p className="mt-1 text-sm text-gray-400">
            <a href="https://github.com/Jenrimark" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
              GitHub
            </a>
            <span className="mx-2">·</span>
            <a href="mailto:2303532728@qq.com" className="hover:text-gray-600">
              2303532728@qq.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
