import { cleanup } from '@testing-library/react';

// Unmount every rendered tree between tests (Testing Library also does this automatically when
// `afterEach` is global, but being explicit keeps the specs independent of that detail).
afterEach(() => cleanup());
