/** 每日一句：hitokoto API + 本地 fallback */

const STORAGE_QUOTE = 'view:quote';
const STORAGE_QUOTE_DATE = 'view:quote-date';

const FALLBACK_QUOTES = [
  { text: '今日事，今日毕。', from: '胡适' },
  { text: '路漫漫其修远兮，吾将上下而求索。', from: '屈原' },
  { text: '千里之行，始于足下。', from: '老子' },
  { text: '天行健，君子以自强不息。', from: '周易' },
  { text: '书山有路勤为径，学海无涯苦作舟。', from: '韩愈' },
  { text: '不积跬步，无以至千里。', from: '荀子' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', from: '警世贤文' },
  { text: '业精于勤，荒于嬉。', from: '韩愈' },
];

function todayStr(): string {
  return new Date().toDateString();
}

function loadStoredQuote(): { text: string; from: string } | null {
  try {
    if (localStorage.getItem(STORAGE_QUOTE_DATE) !== todayStr()) return null;
    const raw = localStorage.getItem(STORAGE_QUOTE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveQuote(text: string, from: string) {
  try {
    localStorage.setItem(STORAGE_QUOTE, JSON.stringify({ text, from }));
    localStorage.setItem(STORAGE_QUOTE_DATE, todayStr());
  } catch { /* ignore */ }
}

function render(text: string, from: string) {
  const el = document.getElementById('view-quote');
  if (!el) return;
  el.textContent = `“${text}” —— ${from}`;
  el.hidden = false;
}

async function fetchHitokoto(): Promise<{ text: string; from: string }> {
  const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k');
  if (!res.ok) throw new Error('hitokoto failed');
  const json = await res.json();
  return { text: json.hitokoto, from: json.from || '佚名' };
}

export async function initViewQuote() {
  // 先显示今日已缓存的
  const stored = loadStoredQuote();
  if (stored) {
    render(stored.text, stored.from);
    return;
  }

  try {
    const quote = await fetchHitokoto();
    saveQuote(quote.text, quote.from);
    render(quote.text, quote.from);
  } catch {
    // fallback 到本地随机一条
    const q = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    saveQuote(q.text, q.from);
    render(q.text, q.from);
  }
}
