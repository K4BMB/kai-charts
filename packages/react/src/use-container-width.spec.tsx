import { act, render } from '@testing-library/react';
import { useRef } from 'react';
import { useContainerWidth } from './use-container-width';

function Probe({ fallback }: { fallback?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(ref, fallback);
  return (
    <div ref={ref} data-testid="box">
      {width}
    </div>
  );
}

describe('useContainerWidth', () => {
  const proto = HTMLElement.prototype;
  const original = Object.getOwnPropertyDescriptor(proto, 'clientWidth');

  function mockClientWidth(value: number) {
    Object.defineProperty(proto, 'clientWidth', { configurable: true, get: () => value });
  }

  afterEach(() => {
    if (original) Object.defineProperty(proto, 'clientWidth', original);
    else delete (proto as { clientWidth?: number }).clientWidth;
    vi.unstubAllGlobals();
  });

  it('keeps the fallback when the element has no layout (jsdom, hidden)', () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('box').textContent).toBe('600');
  });

  it('accepts a custom fallback', () => {
    const { getByTestId } = render(<Probe fallback={400} />);
    expect(getByTestId('box').textContent).toBe('400');
  });

  it('measures the element once mounted', () => {
    mockClientWidth(812.4);
    const { getByTestId } = render(<Probe />);
    expect(getByTestId('box').textContent).toBe('812');
  });

  it('follows ResizeObserver notifications', () => {
    let callback: ResizeObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          callback = cb;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
      },
    );
    mockClientWidth(500);
    const { getByTestId, unmount } = render(<Probe />);
    expect(getByTestId('box').textContent).toBe('500');
    expect(observe).toHaveBeenCalledTimes(1);

    mockClientWidth(760);
    act(() => callback?.([], {} as ResizeObserver));
    expect(getByTestId('box').textContent).toBe('760');

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
