/** 新增小组件：音乐播放器、IP信息、快捷翻译、二维码生成 */

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
// 主数据源：IP-API.com 免费版
// https://ip-api.com/docs/api:json — 无 key，JSONP/CORS，45 次/分钟，仅 HTTP
// lang=zh-CN 输出中文省市；X-Rl / X-Ttl 用于客户端限流
// 线上 HTTPS 走 Nginx 同源反代 /proxy/ip-api/（见 deploy/nginx/ip-api-proxy.conf）
// 反代不可用时：HTTP 页直连免费 API，HTTPS 页回落国内接口
function initIPInfo() {
  const content = document.getElementById('view-ipinfo-content');
  const refreshBtn = document.getElementById('view-ipinfo-refresh');
  if (!content) return;

  const CACHE_KEY = 'view:ipinfo';
  const CACHE_TTL = 24 * 60 * 60 * 1000;
  const RL_KEY = 'view:ipinfo:rl';
  // 只请求展示用到的字段，降低体积
  const IP_API_FIELDS =
    'status,message,query,country,regionName,city,district,isp,lat,lon,timezone,mobile,proxy,hosting';
  // Nginx 反代前缀（与 view-autocomplete 的 /proxy 约定一致）
  const IP_API_PROXY = '/proxy/ip-api/json/';

  type IPInfo = {
    ip: string;
    region: string;
    isp: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    mobile?: boolean;
    proxy?: boolean;
    hosting?: boolean;
    source?: 'ip-api' | 'pconline' | 'ipify';
  };

  const escapeHtml = (s: string): string =>
    String(s ?? '').replace(/[&<>"']/g, (c) => {
      switch (c) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        default: return '&#39;';
      }
    });

  const formatLatLon = (lat?: number, lon?: number): string => {
    if (typeof lat !== 'number' || typeof lon !== 'number') return '';
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  };

  const yesNo = (v: boolean): string => (v ? '是' : '否');

  const render = (data: IPInfo) => {
    const rows: Array<[string, string]> = [
      ['IP', data.ip],
      ['地区', data.region],
      ['运营商', data.isp || '未知'],
    ];
    const latLon = formatLatLon(data.lat, data.lon);
    if (latLon) rows.push(['经纬度', latLon]);
    if (data.timezone) rows.push(['时区', data.timezone]);
    if (typeof data.mobile === 'boolean') rows.push(['移动网络', yesNo(data.mobile)]);
    if (typeof data.proxy === 'boolean') rows.push(['代理/VPN', yesNo(data.proxy)]);
    if (typeof data.hosting === 'boolean') rows.push(['机房', yesNo(data.hosting)]);

    content.innerHTML = rows
      .map(
        ([label, value]) =>
          `<div class="view-ipinfo__row"><span class="view-ipinfo__label">${label}</span><span class="view-ipinfo__value" title="${escapeHtml(value)}">${escapeHtml(value) || '--'}</span></div>`
      )
      .join('');
  };

  // 从完整地址 / ISP 文本中提取运营商（兼容中英文）
  const extractISP = (text: string): string => {
    if (!text) return '';
    const rules: Array<[RegExp, string]> = [
      [/电信|CHINANET|TELECOM|China Telecom/i, '电信'],
      [/联通|UNICOM|China Unicom/i, '联通'],
      [/移动|CMCC|China Mobile/i, '移动'],
      [/铁通|Tietong/i, '铁通'],
      [/广电|Broadcast|China Broadcasting/i, '广电'],
      [/长城宽带|GreatWall/i, '长城宽带'],
      [/鹏博士|Dr\.?\s*Peng/i, '鹏博士'],
      [/教育网|CERNET/i, '教育网'],
      [/科技网|CSTNET/i, '科技网'],
    ];
    for (const [re, name] of rules) {
      if (re.test(text)) return name;
    }
    return '';
  };

  // 从地址中去掉运营商，得到纯地区
  const extractRegion = (addr: string, isp: string): string => {
    if (!addr) return '';
    let region = addr.trim();
    if (isp) region = region.replace(isp, '').trim();
    return region;
  };

  // ---- 免费版限流：X-Rl=0 时按 X-Ttl 暂停请求 ----
  const isRateLimited = (): boolean => {
    try {
      const raw = localStorage.getItem(RL_KEY);
      if (!raw) return false;
      const { until } = JSON.parse(raw) as { until: number };
      return typeof until === 'number' && Date.now() < until;
    } catch {
      return false;
    }
  };

  const noteRateLimit = (res: Response) => {
    try {
      const rl = res.headers.get('X-Rl');
      const ttl = res.headers.get('X-Ttl');
      if (rl !== null && Number(rl) <= 0) {
        const seconds = Number(ttl) || 60;
        localStorage.setItem(RL_KEY, JSON.stringify({ until: Date.now() + seconds * 1000 }));
      } else {
        localStorage.removeItem(RL_KEY);
      }
    } catch { /* ignore */ }
  };

  const mapIpApi = (data: any): IPInfo => {
    const ispRaw = data.isp || data.org || '';
    return {
      ip: data.query,
      region: [data.country, data.regionName, data.city, data.district].filter(Boolean).join(' · '),
      isp: extractISP(ispRaw) || ispRaw,
      lat: typeof data.lat === 'number' ? data.lat : undefined,
      lon: typeof data.lon === 'number' ? data.lon : undefined,
      timezone: data.timezone || '',
      mobile: !!data.mobile,
      proxy: !!data.proxy,
      hosting: !!data.hosting,
      source: 'ip-api',
    };
  };

  // IP-API.com：先同源 Nginx 反代（HTTPS 线上可用），再免费版直连
  const ipApiEndpoints = (): string[] => {
    const qs = `lang=zh-CN&fields=${IP_API_FIELDS}`;
    const list = [`${IP_API_PROXY}?${qs}`];
    if (location.protocol === 'http:' || location.protocol === 'file:') {
      list.push(`http://ip-api.com/json/?${qs}`);
    }
    return list;
  };

  const fetchIpApiJson = async (url: string): Promise<IPInfo> => {
    const res = await fetch(url, { method: 'GET' });
    noteRateLimit(res);
    if (res.status === 429) throw new Error('rate limited');
    if (!res.ok) throw new Error(`http ${res.status}`);
    const data = await res.json();
    if (!data || data.status !== 'success' || !data.query) {
      throw new Error(data?.message || 'ip-api fail');
    }
    return mapIpApi(data);
  };

  const fetchIpApiJsonp = (url: string): Promise<IPInfo> => {
    return new Promise((resolve, reject) => {
      const cb = `_ipapicb_${Date.now().toString(36)}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => { cleanup(); reject(new Error('ip-api timeout')); }, 8000);

      const cleanup = () => {
        clearTimeout(timer);
        delete (window as any)[cb];
        script.remove();
      };

      (window as any)[cb] = (data: any) => {
        cleanup();
        if (!data || data.status !== 'success' || !data.query) {
          reject(new Error(data?.message || 'ip-api fail'));
          return;
        }
        resolve(mapIpApi(data));
      };

      const sep = url.includes('?') ? '&' : '?';
      script.src = `${url}${sep}callback=${cb}`;
      script.onerror = () => { cleanup(); reject(new Error('ip-api network')); };
      document.body.appendChild(script);
    });
  };

  const fetchIpApi = async (): Promise<IPInfo> => {
    let lastErr: unknown = new Error('ip-api unreachable');
    for (const url of ipApiEndpoints()) {
      try {
        return await fetchIpApiJson(url);
      } catch (err) {
        lastErr = err;
        try {
          return await fetchIpApiJsonp(url);
        } catch (err2) {
          lastErr = err2;
        }
      }
    }
    throw lastErr;
  };

  // 回落：太平洋电脑网 JSONP（国内 HTTPS，信息全）
  const fetchPconline = (): Promise<IPInfo> => {
    return new Promise((resolve, reject) => {
      const cb = `_ipcb_${Date.now().toString(36)}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 8000);

      const cleanup = () => {
        clearTimeout(timer);
        delete (window as any)[cb];
        script.remove();
      };

      (window as any)[cb] = (data: any) => {
        cleanup();
        if (data && data.ip) {
          const isp = extractISP(data.addr || '');
          resolve({
            ip: data.ip,
            region: extractRegion(data.addr || '', isp),
            isp,
            source: 'pconline',
          });
        } else {
          reject(new Error('no data'));
        }
      };

      script.src = `https://whois.pconline.com.cn/ipJson.jsp?json=true&callback=${cb}`;
      script.charset = 'GBK'; // 接口返回GBK编码，必须指定否则中文乱码
      script.onerror = () => { cleanup(); reject(new Error('network')); };
      document.body.appendChild(script);
    });
  };

  // 备用：ipify（仅获取 IP）
  const fetchIpify = (): Promise<IPInfo> => {
    return fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => ({ ip: d.ip, region: '', isp: '', source: 'ipify' as const }));
  };

  const fetchIP = () => {
    content.innerHTML = '<span style="font-size:0.82rem;color:var(--view-text-muted);">加载中…</span>';

    const doFetch = async () => {
      try {
        if (isRateLimited()) {
          // 限流窗口内不打接口，尽量用缓存顶一下
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            try {
              render(JSON.parse(raw).data);
              return;
            } catch { /* ignore */ }
          }
        }

        let result: IPInfo;
        try {
          result = await fetchIpApi();
        } catch {
          result = await fetchPconline();
        }
        if (isPrivateIP(result.ip)) {
          result = await fetchIpify();
        }
        if (isPrivateIP(result.ip)) {
          content.innerHTML = '<span style="font-size:0.82rem;color:#ff453a;">获取失败（内网环境）</span>';
          return;
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, time: Date.now() }));
        render(result);
      } catch {
        content.innerHTML = '<span style="font-size:0.82rem;color:#ff453a;">网络请求失败</span>';
      }
    };

    doFetch();
  };

  // 先读缓存（内网 IP 不缓存，直接重新获取）
  const isPrivateIP = (ip: string): boolean => {
    if (!ip) return true;
    return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|::1|fe80:)/i.test(ip);
  };

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, time } = JSON.parse(cached);
      if (isPrivateIP(data.ip)) {
        localStorage.removeItem(CACHE_KEY);
        fetchIP();
      } else if (Date.now() - time < CACHE_TTL) {
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
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
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
