import { defineConfig } from 'vitest/config';

// Browser-backed Vitest suites run in their own CI job after Playwright's
// Chromium is installed. Keeping this separate prevents the ordinary shards
// from collecting a test their runner cannot launch.
export default defineConfig({
  test: {
    include: ['tests/show-pages.e2e.test.js'],
    environment: 'node',
    testTimeout: 90000,
    hookTimeout: 90000,
  },
});
