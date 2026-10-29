import { useSyncExternalStore } from 'react';

export type Route = 'showcase' | 'playground';

/** `#/playground` → playground; anything else (`#/`, empty, unknown) → showcase. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0].replace(/\/$/, '');
  return path === 'playground' ? 'playground' : 'showcase';
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function snapshot(): Route {
  return parseRoute(window.location.hash);
}

/** Tiny hash router: no dependency, works from any base path (GitHub Pages sub-folder). */
export function useHashRoute(): Route {
  return useSyncExternalStore(subscribe, snapshot, () => 'showcase');
}
