// The season-playing tests: the other half of `npm test`.
//
// These are the sweeps that play whole seasons and count what actually fired.
// They are the only thing in this project that catches an event which is
// written, registered, wired up and still unreachable — a bug class it has hit
// often enough to build tooling for. So they are not optional, and nothing here
// trims them to run faster.
//
// They are simply not something to run three times per character you create.
// `npm test` keeps the fast guards; this runs nightly and whenever you ask:
//
//   npm run test:sim
//
// The file list lives in vitest.slow.js, shared with vitest.config.js, so the
// two cannot disagree about which side a test is on. Its header explains how to
// re-derive it when it rots.
import { defineConfig } from 'vitest/config';
import { SLOW_GLOBS } from './vitest.slow.js';

export default defineConfig({
  test: {
    include: SLOW_GLOBS,
    environment: 'jsdom',
    // Matches vitest.config.js. Several of these play 8-20 seasons in a single
    // test; a timeout tuned to a fast machine is how this suite failed in CI
    // before.
    testTimeout: 90000,
    hookTimeout: 90000,
  },
});
