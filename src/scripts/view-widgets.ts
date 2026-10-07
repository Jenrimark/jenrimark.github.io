/** 新增小组件：音乐播放器、IP信息、快捷翻译、二维码生成 */

// 云服务器 Nginx 反向代理前缀（解决国内访问国外 API 的跨域和网络问题）
const PROXY_BASE = '/proxy';
function proxyUrl(targetPath: string): string {
  return `${PROXY_BASE}${targetPath}`;
}

// ==================== 音乐播放器 ====================
function initMusicPlayer() {
  const audio = document.getElementById('view-music-audio') as HTMLAudioElement | null;
  const fileInput = document.getElementById('view-music-file') as HTMLInputElement | null;
  const playBtn = document.getElementById('view-music-play');
  const prevBtn = document.getElementById('view-music-prev');
  const nextBtn = document.getElementById('view-music-next');
  const titleEl = document.getElementById('view-music-title');
  const currentEl = document.getElementById('view-music-current');
  const durationEl = document.getElementById('view-music-duration');
  const barFill = document.getElementById('view-music-bar-fill');
  const bar = document.getElementById('view-music-bar');
  const playIcon = document.getElementById('view-music-play-icon');
  if (!audio || !fileInput || !playBtn || !prevBtn || !nextBtn || !titleEl) return;

  let playlist: { name: string; url: string }[] = [];
  let currentIdx = -1;

  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const loadTrack = (idx: number) => {
    if (idx < 0 || idx >= playlist.length) return;
    currentIdx = idx;
    audio.src = playlist[idx].url;
    titleEl.textContent = playlist[idx].name;
    audio.play().catch(() => {});
  };

  fileInput.addEventListener('change', () => {
    const files = fileInput.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      playlist.push({ name: file.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(file) });
    });
    if (currentIdx === -1 && playlist.length > 0) {
      loadTrack(0);
    }
    fileInput.value = '';
  });

  playBtn.addEventListener('click', () => {
    if (playlist.length === 0) { fileInput.click(); return; }
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    loadTrack((currentIdx - 1 + playlist.length) % playlist.length);
  });

  nextBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    loadTrack((currentIdx + 1) % playlist.length);
  });

  audio.addEventListener('play', () => {
    if (playIcon) playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
  });

  audio.addEventListener('pause', () => {
    if (playIcon) playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  });

  audio.addEventListener('timeupdate', () => {
    if (currentEl) currentEl.textContent = formatTime(audio.currentTime);
    if (barFill && audio.duration) {
      barFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    if (playlist.length > 0) {
      loadTrack((currentIdx + 1) % playlist.length);
    }
  });

  bar?.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });
}

// ==================== IP信息 ====================
function initIPInfo() {
  const content = document.getElementById('view-ipinfo-content');
  const refreshBtn = document.getElementById('view-ipinfo-refresh');
  if (!content) return;

  const CACHE_KEY = 'view:ipinfo';
  const CACHE_TTL = 24 * 60 * 60 * 1000;

  const render = (data: any) => {
    content.innerHTML = `
      <div class="view-ipinfo__row"><span class="view-ipinfo__label">IP</span><span class="view-ipinfo__value">${data.ip || '--'}</span></div>
      <div class="view-ipinfo__row"><span class="view-ipinfo__label">地区</span><span class="view-ipinfo__value">${data.pro || ''} ${data.city || ''}</span></div>
      <div class="view-ipinfo__row"><span class="view-ipinfo__label">运营商</span><span class="view-ipinfo__value">${data.isp || '--'}</span></div>
    `;
  };

  const fetchIP = () => {
    content.innerHTML = '<span style="font-size:0.82rem;color:var(--view-text-muted);">加载中…</span>';
    // 用搜狐 JSONP 接口，不受跨域限制
    const script = document.createElement('script');
    script.src = 'https://pv.sohu.com/cityjson?ie=utf-8';
    script.onload = () => {
      try {
        const data = (window as any).returnCitySN;
        if (data && data.cip) {
          const result = {
            ip: data.cip,
            pro: '',
            city: data.cname || '',
            isp: '--',
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, time: Date.now() }));
          render(result);
        } else {
          content.innerHTML = '<span style="font-size:0.82rem;color:#ff453a;">获取失败</span>';
        }
      } catch {
        content.innerHTML = '<span style="font-size:0.82rem;color:#ff453a;">解析失败</span>';
      }
      script.remove();
    };
    script.onerror = () => {
      content.innerHTML = '<span style="font-size:0.82rem;color:#ff453a;">网络请求失败</span>';
      script.remove();
    };
    document.body.appendChild(script);
  };

  // 先读缓存
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, time } = JSON.parse(cached);
      if (Date.now() - time < CACHE_TTL) {
        render(data);
      } else {
        fetchIP();
      }
    } else {
      fetchIP();
    }
  } catch {
    fetchIP();
  }

  refreshBtn?.addEventListener('click', fetchIP);
}

// ==================== 快捷翻译 ====================
function initTranslate() {
  const input = document.getElementById('view-translate-input') as HTMLTextAreaElement | null;
  const fromSel = document.getElementById('view-translate-from') as HTMLSelectElement | null;
  const toSel = document.getElementById('view-translate-to') as HTMLSelectElement | null;
  const swapBtn = document.getElementById('view-translate-swap');
  const translateBtn = document.getElementById('view-translate-btn');
  const resultEl = document.getElementById('view-translate-result');
  const copyBtn = document.getElementById('view-translate-copy');
  if (!input || !fromSel || !toSel || !translateBtn || !resultEl) return;

  const langMap: Record<string, string> = {
    'auto': 'autodetect',
    'zh-CN': 'zh-CN',
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko',
  };

  swapBtn?.addEventListener('click', () => {
    if (fromSel.value === 'auto') return;
    const tmp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = tmp;
  });

  const doTranslate = async () => {
    const text = input.value.trim();
    if (!text) { resultEl.textContent = ''; if (copyBtn) copyBtn.hidden = true; return; }
    resultEl.textContent = '翻译中…';
    resultEl.style.color = 'var(--view-text-muted)';
    try {
      const from = langMap[fromSel.value] || 'autodetect';
      const to = langMap[toSel.value] || 'en';
      const res = await fetch(proxyUrl(`/translate/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`));
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData) {
        resultEl.textContent = data.responseData.translatedText;
        resultEl.style.color = 'var(--view-text)';
        copyBtn!.hidden = false;
      } else {
        resultEl.textContent = '翻译失败，请稍后重试';
        resultEl.style.color = '#ff453a';
      }
    } catch {
      resultEl.textContent = '网络请求失败';
      resultEl.style.color = '#ff453a';
    }
  };

  translateBtn.addEventListener('click', doTranslate);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doTranslate();
  });

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(resultEl.textContent || '').then(() => {
      copyBtn.textContent = '已复制';
      setTimeout(() => { copyBtn.textContent = '复制'; }, 1500);
    });
  });
}

// ==================== 二维码生成 ====================
function initQRCode() {
  const input = document.getElementById('view-qrcode-input') as HTMLInputElement | null;
  const canvas = document.getElementById('view-qrcode-canvas');
  const downloadBtn = document.getElementById('view-qrcode-download');
  if (!input || !canvas) return;

  // 动态加载 qrcode.js
  const loadQRCodeLib = () => {
    return new Promise<void>((resolve, reject) => {
      if ((window as any).QRCode) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('加载二维码库失败'));
      document.head.appendChild(script);
    });
  };

  let qrInstance: any = null;

  const generate = async () => {
    const text = input.value.trim();
    if (!text) {
      canvas.innerHTML = '<span style="font-size:0.8rem;color:var(--view-text-muted);">输入后生成</span>';
      downloadBtn!.hidden = true;
      qrInstance = null;
      return;
    }
    try {
      await loadQRCodeLib();
      canvas.innerHTML = '';
      qrInstance = new (window as any).QRCode(canvas, {
        text,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: (window as any).QRCode.CorrectLevel.H,
      });
      downloadBtn!.hidden = false;
    } catch {
      canvas.innerHTML = '<span style="font-size:0.8rem;color:#ff453a;">生成失败</span>';
    }
  };

  let timer: any;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(generate, 300);
  });

  downloadBtn?.addEventListener('click', () => {
    const img = canvas.querySelector('img') as HTMLImageElement | null;
    const canvasEl = canvas.querySelector('canvas') as HTMLCanvasElement | null;
    const dataUrl = img?.src || canvasEl?.toDataURL('image/png');
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qrcode.png';
    a.click();
  });
}

// ==================== 初始化 ====================
function initViewWidgets() {
  initMusicPlayer();
  initIPInfo();
  initTranslate();
  initQRCode();
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewWidgets);
} else {
  initViewWidgets();
}
