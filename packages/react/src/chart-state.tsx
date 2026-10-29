export interface ChartStateProps {
  kind: 'loading' | 'empty';
  /** Height in px, so the placeholder occupies the same space as the chart it replaces. */
  height?: number;
  /** Visible text (empty state) or screen-reader text (loading state). */
  text?: string;
}

/** Loading skeleton or empty placeholder, sized like the chart it replaces. */
export function ChartState({ kind, height = 240, text = '' }: ChartStateProps) {
  if (kind === 'loading') {
    return (
      <div
        className="kc-state kc-state--loading"
        role="status"
        aria-busy="true"
        style={{ height: `${height}px` }}
      >
        <span className="kc-state__shimmer" />
        <span className="kc-sr-only">{text}</span>
      </div>
    );
  }
  return (
    <div className="kc-state kc-state--empty" role="status" style={{ height: `${height}px` }}>
      {text}
    </div>
  );
}
