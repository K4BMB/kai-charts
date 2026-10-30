import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Last event of a sandbox: the output name and a one-line summary of its payload. */
export interface SandboxEvent {
  name: string;
  summary: string;
}

/**
 * Status line of the stage, applied to the `<p class="status">` itself so the DOM stays
 * `.stage > p.status`. Shows `Último evento: <name> · <summary>` or, before any event, the
 * projected hint.
 */
@Component({
  selector: 'p[appStatus]',
  template: `
    @if (event(); as e) {
      Último evento: <code>{{ e.name }}</code> · {{ e.summary }}
    } @else {
      <ng-content />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventStatus {
  readonly event = input<SandboxEvent | null>(null);
}
