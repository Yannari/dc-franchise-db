// Avatars are committed to the repository, so their size is a build cost.
//
// GitHub Pages clones this repo for every build. In August 2026 that build was
// taking FIFTEEN MINUTES and could not finish, because Studio saves push three
// commits each and every push cancels the build in flight. The clone was slow
// because assets/avatars held 152 MB of art: `don.png` was 4700x4700 and 9.8 MB
// for a portrait the site never draws above 300 CSS px.
//
// The Studio was not the culprit and this guard is not aimed at it —
// `_imgToAvatar` has always capped uploads at 512px. Every oversized file
// arrived by hand, in commits named "test", "r" and "t", dragged straight into
// assets/avatars. This catches the next one.
//
// ── WHY THESE NUMBERS ──
//
// The largest avatar the site renders is the wiki infobox portrait at roughly
// 300 CSS px, which is 600px on a retina display. 1024 leaves 1.7x headroom for
// a future larger layout, and going further was declined deliberately: the art
// matters more than the megabytes, and 1024 is already a 46% cut.
//
// Raising a limit here is a real decision, not a formality. A 5 MB portrait is
// paid for on every clone by every build, forever — git cannot delta-compress
// PNGs, so replacing one adds the whole new file to history rather than a diff.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = resolve(process.cwd(), 'assets/avatars');
const MAX_PX = 1024;
const MAX_BYTES = 1_800_000;
const MAX_TOTAL_MB = 100;

/** PNG dimensions, straight out of the IHDR chunk — no image library needed. */
function pngSize(buf) {
  const isPng = buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47;
  if (!isPng) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const files = readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.png'));

describe('the avatars stay a sensible size', () => {
  it('has avatars to check', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('none is larger than the site can use', () => {
    const over = [];
    for (const f of files) {
      const size = pngSize(readFileSync(resolve(DIR, f)));
      if (size && Math.max(size.w, size.h) > MAX_PX) {
        over.push(`${f} ${size.w}x${size.h}`);
      }
    }
    expect(over, `these exceed ${MAX_PX}px. The largest the site renders is `
      + '300 CSS px (600px retina), so anything bigger is paid for on every '
      + 'clone and shown to nobody. Resize before committing.').toEqual([]);
  });

  it('none is heavy even at a legal size', () => {
    // Dimensions alone do not bound the bytes: a 1024px image full of gradients
    // is an order of magnitude larger than a 1024px flat cartoon.
    const heavy = files
      .map(f => [f, statSync(resolve(DIR, f)).size])
      .filter(([, s]) => s > MAX_BYTES)
      .map(([f, s]) => `${f} ${(s / 1e6).toFixed(1)} MB`);
    expect(heavy, `these exceed ${(MAX_BYTES / 1e6).toFixed(1)} MB each`).toEqual([]);
  });

  it('the directory as a whole stays under the build budget', () => {
    // The number that actually decides whether Pages can finish a build.
    const total = files.reduce((t, f) => t + statSync(resolve(DIR, f)).size, 0);
    expect(total / 1e6, `assets/avatars is ${(total / 1e6).toFixed(1)} MB. Every `
      + 'megabyte here is cloned by every Pages build; at 152 MB the build took '
      + '15 minutes and never completed.').toBeLessThan(MAX_TOTAL_MB);
  });
});
