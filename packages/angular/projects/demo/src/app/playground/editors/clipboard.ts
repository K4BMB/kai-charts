/**
 * Copies text with the async Clipboard API and falls back to a hidden textarea +
 * `execCommand('copy')` when the API is missing or rejects (insecure context, no focus).
 */
export function copyToClipboard(text: string): void {
  try {
    const clipboard = navigator.clipboard;
    if (clipboard?.writeText) {
      clipboard.writeText(text).catch(() => legacyCopy(text));
      return;
    }
  } catch {
    // Fall through to the legacy path.
  }
  legacyCopy(text);
}

function legacyCopy(text: string): void {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  } catch {
    // Nothing else to try: the user can still select the text by hand.
  }
}
