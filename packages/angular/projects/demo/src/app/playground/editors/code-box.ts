import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { copyToClipboard } from './clipboard';

/** Generated snippet with a "Copiar" button that confirms with "¡Copiado!" for 1.5 s. */
@Component({
  selector: 'app-code-box',
  template: `
    <pre><code>{{ code() }}</code></pre>
    <button type="button" (click)="copy()">{{ copied() ? '¡Copiado!' : 'Copiar' }}</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBox {
  readonly code = input.required<string>();

  protected readonly copied = signal(false);

  protected copy(): void {
    copyToClipboard(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
