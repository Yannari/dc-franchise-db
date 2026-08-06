// The audits, run deliberately.
//
// The main config EXCLUDES tests/**/*-audit.test.js, because those five files
// play whole seasons and print tables — eight tests that were taking about half
// the wall clock of the entire sixteen-hundred-test suite, on every run, for
// nobody to read. They are tools you reach for when changing something, not
// regressions that need checking on the way past.
//
// Excluding them there would have made them unrunnable here too: the exclude
// applies to any filter you pass, so `vitest run tests/event-rates-audit.test.js`
// matched nothing and exited 1. Hence a config of their own rather than a flag
// on each script.
//
//     npm run audit:all        every audit
//     npm run audit:events     how often each house event actually fires
//     npm run audit:season     a full season, start to finish
//     npm run audit:realism    voting realism
//     npm run audit:continuity season-to-season continuity
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*-audit.test.js'],
    environment: 'jsdom',
    // Same ceilings as the main config, and they matter more here: these are
    // the files that genuinely take a minute or two.
    testTimeout: 90000,
    hookTimeout: 90000,
  },
});
