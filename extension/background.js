/** @type {import('chrome').Bookmarks.BookmarkTreeNode[]} */

function simplify(nodes) {
  if (!Array.isArray(nodes)) return [];
  const out = [];
  for (const node of nodes) {
    const item = { id: String(node.id), title: node.title || '' };
    if (node.url) item.url = node.url;
    if (node.children?.length) {
      const children = simplify(node.children);
      if (children.length) item.children = children;
    }
    if (item.url || item.children?.length) out.push(item);
  }
  return out;
}

function getBookmarkTree() {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((tree) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(simplify(tree));
    });
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'GET_BOOKMARKS') {
    getBookmarkTree()
      .then((tree) => sendResponse({ ok: true, tree }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});

async function pushBookmarksToViewTabs() {
  let tree;
  try {
    tree = await getBookmarkTree();
  } catch {
    return;
  }

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    try {
      const { pathname } = new URL(tab.url);
      if (!pathname.startsWith('/view')) continue;
      chrome.tabs.sendMessage(tab.id, { type: 'PUSH_BOOKMARKS', tree }).catch(() => {});
    } catch {
      /* ignore invalid tab urls */
    }
  }
}

for (const event of ['onCreated', 'onRemoved', 'onChanged', 'onMoved']) {
  chrome.bookmarks[event].addListener(() => {
    pushBookmarksToViewTabs();
  });
}
