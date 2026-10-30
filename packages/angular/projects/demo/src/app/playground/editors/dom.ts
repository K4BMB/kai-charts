import { WritableSignal } from '@angular/core';

/** Value of the input/select/textarea that fired `event`. */
export function inputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
}

/** Number typed in an `<input type="number">`, `undefined` when blank or not a number. */
export function inputNumber(event: Event): number | undefined {
  const raw = inputValue(event).trim();
  if (raw === '') return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * True while the user is half-way through a number (`0.`, `-`, `1e`): Chrome reports `value`
 * as `''` with `validity.badInput`. Writing that `''` back through `[value]` would wipe the
 * text being typed, so editors skip the update until the number is complete.
 */
export function isIncompleteNumber(event: Event): boolean {
  return (event.target as HTMLInputElement).validity?.badInput === true;
}

/** `target.set(number | undefined)` from a number input, ignoring incomplete input. */
export function setOptionalNumber(target: WritableSignal<number | undefined>, event: Event): void {
  if (isIncompleteNumber(event)) return;
  target.set(inputNumber(event));
}

/** `target.set(number)` from a number input; blank or incomplete input keeps the current value. */
export function setNumber(target: WritableSignal<number>, event: Event): void {
  const value = inputNumber(event);
  if (value !== undefined) target.set(value);
}
