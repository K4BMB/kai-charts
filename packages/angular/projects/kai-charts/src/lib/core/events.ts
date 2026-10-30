/**
 * Payload of the `itemClick` output of the list components (`kc-progress-list`,
 * `kc-ranking-list`). Angular outputs carry a single value, so the `(item, index)` pair of
 * the renderer contract travels as one object.
 */
export interface ItemClickEvent<T> {
  /** The original item exactly as it was given in `items`. */
  item: T;
  /** Position of `item` in the `items` input (not the rendered position). */
  index: number;
}
