import { DestroyRef, ElementRef, Signal, afterNextRender, inject, signal } from '@angular/core';

/**
 * Tracks the host element width in px. It starts at `fallback` so server render and the
 * first client render agree (no hydration mismatch), measures after the first render and
 * then follows size changes through `ResizeObserver`. Call it in an injection context.
 */
export function observeWidth(fallback = 600): Signal<number> {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  const width = signal(fallback);

  afterNextRender(() => {
    const measure = () => {
      const measured = element.clientWidth;
      if (measured > 0) width.set(Math.round(measured));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    destroyRef.onDestroy(() => observer.disconnect());
  });

  return width.asReadonly();
}
