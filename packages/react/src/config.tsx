import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { KC_DEFAULTS, type KaiChartsDefaults } from 'kai-charts-core';

/** Global defaults shared by every chart (locale and texts). Same shape as the Angular config. */
export type KaiChartsConfig = KaiChartsDefaults;

const KaiChartsContext = createContext<KaiChartsConfig>(KC_DEFAULTS);

export interface KaiChartsProviderProps {
  /** Overrides merged over the parent provider (or `KC_DEFAULTS`). */
  config: Partial<KaiChartsConfig>;
  children?: ReactNode;
}

/**
 * Registers app-wide defaults for kai-charts. Providers nest: each one merges over its parent.
 *
 * ```tsx
 * <KaiChartsProvider config={{ locale: 'en-US', emptyText: 'No data' }}>
 *   <App />
 * </KaiChartsProvider>
 * ```
 */
export function KaiChartsProvider({ config, children }: KaiChartsProviderProps) {
  const parent = useContext(KaiChartsContext);
  const { locale, emptyText, loadingText, categoryHeader } = config;
  const value = useMemo<KaiChartsConfig>(
    () => ({
      locale: locale ?? parent.locale,
      emptyText: emptyText ?? parent.emptyText,
      loadingText: loadingText ?? parent.loadingText,
      categoryHeader: categoryHeader ?? parent.categoryHeader,
    }),
    [parent, locale, emptyText, loadingText, categoryHeader],
  );
  return <KaiChartsContext.Provider value={value}>{children}</KaiChartsContext.Provider>;
}

/** Current kai-charts defaults: the nearest provider, or `KC_DEFAULTS` when there is none. */
export function useKaiChartsConfig(): KaiChartsConfig {
  return useContext(KaiChartsContext);
}
