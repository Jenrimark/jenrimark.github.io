const MSG_SOURCE_PAGE = 'jenrimark-view';
const MSG_SOURCE_EXT = 'jenrimark-view-ext';

/** 与 manifest host_permissions 保持一致 */
const ALLOWED_ORIGIN_PREFIXES = [
  'http://localhost:',
  'http://127.0.0.1:',
  'http://gd02.frp0.cc:23332',
  'http://120.24.93.79:23332',
];

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGIN_PREFIXES.some((p) => origin.startsWith(p));
}

function pushBookmarks(tree) {
  window.postMessage(
    {
      source: MSG_SOURCE_EXT,
      type: 'BOOKMARKS',
      tree,
    },
    window.location.origin,
  );
}

function fetchAndPush() {
  chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' }, (response) => {
    if (chrome.runtime.lastError || !response?.ok || !Array.isArray(response.tree)) return;
    pushBookmarks(response.tree);
  });
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!isAllowedOrigin(event.origin)) return;

  const data = event.data;
  if (!data || data.source !== MSG_SOURCE_PAGE) return;
  if (data.type === 'REQUEST_BOOKMARKS') fetchAndPush();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'PUSH_BOOKMARKS' && Array.isArray(message.tree)) {
    pushBookmarks(message.tree);
  }
});

fetchAndPush();
