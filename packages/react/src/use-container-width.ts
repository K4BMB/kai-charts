import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

// `useLayoutEffect` measures before the first paint (no 600px flash); on the server it would
// only warn (React 18), so fall back to `useEffect` there.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Tracks the width in px of the element behind `ref`. It starts at `fallback` so server and
 * first client render agree, measures `clientWidth` once mounted and then follows size changes
 * through `ResizeObserver`. A zero measurement (hidden element, jsdom) keeps the fallback.
 */
export function useContainerWidth(ref: RefObject<HTMLElement | null>, fallback = 600): number {
  const [width, setWidth] = useState(fallback);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => {
      const measured = element.clientWidth;
      if (measured > 0) setWidth(Math.round(measured));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
