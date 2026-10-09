/** 天气组件：顶栏 pill + 详情卡片，Open-Meteo 免费 API */

const STORAGE_WEATHER_CACHE = 'view:weather-cache';
const STORAGE_GEO = 'view:geo-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟缓存

interface WeatherData {
  temp: number;
  code: number;
  city?: string;
  fetchedAt: number;
}

function weatherCodeToIcon(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫';
  if (code >= 51 && code <= 57) return '🌦';
  if (code >= 61 && code <= 67) return '🌧';
  if (code >= 71 && code <= 77) return '🌨';
  if (code >= 80 && code <= 82) return '🌧';
  if (code >= 95) return '⛈';
  return '🌡';
}

function loadCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(STORAGE_WEATHER_CACHE);
    if (!raw) return null;
    const data = JSON.parse(raw) as WeatherData;
    if (Date.now() - data.fetchedAt > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function saveCache(data: WeatherData) {
  try {
    localStorage.setItem(STORAGE_WEATHER_CACHE, JSON.stringify(data));
  } catch { /* ignore */ }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
  if (!res.ok) throw new Error('weather fetch failed');
  const json = await res.json();
  return {
    temp: Math.round(json.current.temperature_2m),
    code: json.current.weather_code,
    fetchedAt: Date.now(),
  };
}

function getPosition(): Promise<{ lat: number; lon: number }> {
  // 先读缓存的定位
  try {
    const raw = localStorage.getItem(STORAGE_GEO);
    if (raw) {
      const geo = JSON.parse(raw);
      if (typeof geo.lat === 'number' && typeof geo.lon === 'number') {
        return Promise.resolve({ lat: geo.lat, lon: geo.lon });
      }
    }
  } catch { /* ignore */ }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // 默认武汉
      const fallback = { lat: 30.59, lon: 114.31 };
      localStorage.setItem(STORAGE_GEO, JSON.stringify(fallback));
      resolve(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        localStorage.setItem(STORAGE_GEO, JSON.stringify(geo));
        resolve(geo);
      },
      () => {
        // 拒绝定位用武汉，缓存下来
        const fallback = { lat: 30.59, lon: 114.31 };
        localStorage.setItem(STORAGE_GEO, JSON.stringify(fallback));
        resolve(fallback);
      },
      { timeout: 5000 }
    );
  });
}

function render(data: WeatherData) {
  const pill = document.getElementById('view-weather-pill');
  const icon = document.getElementById('view-weather-icon');
  const temp = document.getElementById('view-weather-temp');
  if (pill && icon && temp) {
    icon.textContent = weatherCodeToIcon(data.code);
    temp.textContent = `${data.temp}°`;
    pill.hidden = false;
  }
}

export async function initViewWeather() {
  // 先显示缓存
  const cached = loadCache();
  if (cached) render(cached);

  try {
    const { lat, lon } = await getPosition();
    const data = await fetchWeather(lat, lon);
    saveCache(data);
    render(data);
  } catch {
    // 静默失败，pill 不显示
  }
}
