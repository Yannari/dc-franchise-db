import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'jsdom',
    // Several suites here play whole seasons rather than asserting on a
    // fixture — the season audits, and the Big Brother libraries, which are
    // checked by running 8-20 seasons and counting what actually fired. That
    // is deliberate: it is the only thing that catches events which are
    // written, registered and still unreachable.
    //
    // Those runs sit around 5-10s, so the 5s default failed them on any
    // machine slower than the one they were written on. It looked like
    // flakiness locally and failed reliably in CI, which is the same bug
    // wearing two hats.
    // The two dead-code checks play twenty seasons each and take about 23s on
    // a developer machine. A CI runner is routinely half the speed, so the
    // ceiling is set well above the measured worst case rather than just above
    // it — a timeout tuned to the fast machine is how this failed in the first
    // place.
    testTimeout: 90000,
    hookTimeout: 90000,
  },
});
