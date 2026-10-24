// One tab bar for the four apps, identical in place and markup on every page
// that hosts one -- clicking between apps must never redraw the bar itself.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { appTabsHtml } from '../js/media-brands.js';
import { PAGES, withTabs, withCss } from '../tools/app-tabs.mjs';

const read = f => fs.readFileSync(f, 'utf8');

describe('the app bar', () => {
  for (const [file, page] of Object.entries(PAGES)) {
    it(`${file} carries the bar as tools/app-tabs.mjs writes it, straight after the header`, () => {
      const src = read(file);
      expect(src, 'run node tools/app-tabs.mjs').toContain(appTabsHtml(page));
      expect(withTabs(src, page), 'the page has drifted from the tool').toBe(src);
      const after = src.slice(src.indexOf('</header>') + '</header>'.length).trimStart();
      expect(after.startsWith('<!-- APP TABS')).toBe(true);
    });
  }

  it('is the same four tabs in the same order everywhere; only which one is current changes', () => {
    const strip = h => h.replace(/ aria-current="page"| aria-pressed="(true|false)"/g, '')
      .replace(/<(a|button)[^>]*?(?:id="[^"]*")[^>]*>/g, m => m.replace(/ id="[^"]*"| href="[^"]*"| type="button"/g, '').replace(/^<button/, '<a'))
      .replace(/<\/button>/g, '</a>');
    const [a, b, c] = Object.values(PAGES).map(p => strip(appTabsHtml(p)));
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('marks the page\'s own app, and keeps the ids the pages use', () => {
    expect(appTabsHtml('kristal')).toMatch(/id="pick-kristal"[^>]* aria-current="page" href="kristal\.html"/);
    expect(appTabsHtml('dramagram')).toMatch(/<a class="app-tab" id="dg-here"[^>]* aria-current="page" href="dramagram\.html">/);
    const social = appTabsHtml('social');
    expect(social).toMatch(/<button type="button" class="app-tab" id="pick-birdie"[^>]*aria-pressed="true"/);
    expect(social).toMatch(/<button type="button" class="app-tab" id="pick-chat"[^>]*aria-pressed="false"/);
    expect(social).not.toMatch(/aria-current/);
  });

  it('styles.css holds the bar\'s styles', () => {
    const css = read('styles.css');
    expect(withCss(css)).toBe(css);
    expect(css).toMatch(/\.app-tab\[aria-pressed="true"\],\.app-tab\[aria-current="page"\]/);
  });
});
