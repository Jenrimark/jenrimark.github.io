import { useRef, type MouseEvent } from 'react';
import { Home, ArrowUpRight } from 'lucide-react';
import { profile } from '../data/profile';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4';

const EMAIL = '2303532728@qq.com';

export default function LandingPage() {
  const bgRef = useRef<HTMLVideoElement>(null);

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
