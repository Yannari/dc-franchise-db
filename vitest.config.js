import { defineConfig, defaultExclude } from 'vitest/config';
import { SLOW_GLOBS } from './vitest.slow.js';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    // ── The audits are tools, not guards, and they were being run as both ──
    //
    // The five *-audit.test.js files each already have their own npm command
    // (audit:events, audit:season, audit:realism, audit:continuity) because
    // they are things you RUN AND READ when changing something — they play
    // whole seasons and print tables. They were also running on every `npm
    // test`, where nobody reads the tables.
    //
    // Measured: eight tests, 153 seconds, about half the wall clock of the
    // entire suite of sixteen hundred. Excluding them takes the ordinary run
    // from roughly three minutes to well under two, and loses nothing — the
    // regression guards that actually catch things (the dead-event sweep, the
    // replay checks, the render completeness sweep) are not audits and still
    // run every time.
    //
    // Run them deliberately: npm run audit:events / audit:season / etc.
    // ── AND THE SEASON-PLAYING TESTS, FOR THE SAME REASON ──
    //
    // The exclusion above was made for the audits and the argument extends
    // exactly: 42 files play whole seasons and cost 103 of the 119 minutes this
    // suite takes on CI. The other 176 run in 16. They are not deleted or
    // trimmed — trimming them would weaken the sweeps that catch events which
    // are written, registered and still unreachable, which is the reason they
    // exist. They run nightly, and on demand: npm run test:sim
    //
    // The list lives in vitest.slow.js so this file and vitest.sim.config.js
    // cannot drift apart.
    // ── BOTH EXCLUSIONS ARE WATCHED ──
    //
    // Anything named below is collected by no default job, and that is
    // invisible from inside the file: an `*-audit.test.js` looks like a test,
    // passes when you run it by hand, and guards nothing. Three times a
    // load-bearing band has been written into one anyway.
    //
    // `tests/unrun-assertions.test.js` runs on every `npm test`, MEASURES what
    // this config actually collects, and fails if an excluded file asserts
    // without a named runner. If you add an exclusion here, it stays covered.
    exclude: [...defaultExclude, 'tests/**/*-audit.test.js', ...SLOW_GLOBS],
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
