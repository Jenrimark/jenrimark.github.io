import { sampleBookmarkTree, type ViewBookmarkNode } from '../data/view-bookmarks.sample';

let tree: ViewBookmarkNode[] = sampleBookmarkTree;
let folderFilter = new Set<string>();
const listeners = new Set<() => void>();

export function getBookmarkTree(): ViewBookmarkNode[] {
  return tree;
}

export function getFolderFilter(): Set<string> {
  return folderFilter;
}

export function updateBookmarks(nextTree: ViewBookmarkNode[], filter: Set<string>): void {
  tree = nextTree;
  folderFilter = filter;
  listeners.forEach((fn) => fn());
}

export function onBookmarksChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
