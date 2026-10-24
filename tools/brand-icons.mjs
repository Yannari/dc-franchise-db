// Renders the PNG icons from the SVGs tools/brand-pages.mjs wrote.
//
//   node tools/brand-pages.mjs && node tools/brand-icons.mjs
//
// favicon-32 keeps the rounded tile (a browser tab shows it as drawn); the
// touch and app icons are full-bleed squares, because iOS and Android round
// them themselves and a pre-rounded tile would show plum corners.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ICONS = [
  { svg: 'assets/brand/favicon.svg',        out: 'assets/brand/favicon-32.png',        size: 32 },
  { svg: 'assets/brand/favicon-square.svg', out: 'assets/brand/apple-touch-icon.png',  size: 180 },
  { svg: 'assets/brand/favicon-square.svg', out: 'assets/brand/icon-192.png',          size: 192 },
  { svg: 'assets/brand/favicon-square.svg', out: 'assets/brand/icon-512.png',          size: 512 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { svg, out, size } of ICONS) {
  const markup = readFileSync(svg, 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${markup}`);
  await page.locator('svg').first().screenshot({ path: out, omitBackground: true });
  console.log(out, size);
}
await browser.close();
