// The setup screen's show dropdown (simulator.html #cfg-format) is written out by hand, so a show added to the registry
// is runnable and still nowhere to be picked: The Ridonculous Race was, until the user went looking for it (2026-10-19,
// "i still dont see it in the dropdown"). Every registered show has its option, and no option is a show that isn't one.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS } from '../js/shows.js';

describe('the setup show dropdown', () => {
  it('offers every registered show, and nothing else', () => {
    const html = readFileSync('simulator.html', 'utf8');
    const select = html.match(/<select id="cfg-format"[\s\S]*?<\/select>/)?.[0] || '';
    const values = [...select.matchAll(/<option value="([^"]+)"/g)].map(m => m[1]);
    expect(values.sort()).toEqual(Object.keys(SHOWS).sort());
  });
});
