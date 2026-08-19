// Reading and writing a character's gallery, in one place.
//
// player.html had done all of this since the gallery was built, and Dramagram
// needed the same four operations. Writing them twice would have meant two slot
// allocators, two encoders, and — the expensive part — two chances to relearn
// the listing-cache trap that this module documents and that cost a bug report
// the first time.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { freeSlots, imageUrl, GALLERY_MAX, GALLERY_API } from '../js/gallery-io.js';

const taken = files => files.map(file => ({ file, size: 1 }));

describe('slot allocation', () => {
  it('fills the gaps rather than appending', () => {
    // The Worker's key whitelist is <slug>/<digits>.<ext>, so a slot is a
    // number and a freed one should be reused.
    expect(freeSlots(taken(['1.png', '3.png']), 2)).toEqual([2, 4]);
  });

  it('stops at the bucket limit', () => {
    const full = taken(Array.from({ length: GALLERY_MAX }, (_, i) => `${i + 1}.png`));
    expect(freeSlots(full, 3)).toEqual([]);
  });

  it('gives back only as many as were asked for', () => {
    expect(freeSlots([], 3)).toEqual([1, 2, 3]);
    expect(freeSlots([], 1)).toEqual([1]);
  });

  it('ignores anything that is not a numbered slot', () => {
    expect(freeSlots(taken(['cover.png', '2.png']), 2)).toEqual([1, 3]);
  });

  it('survives an empty or missing listing', () => {
    expect(freeSlots(null, 2)).toEqual([1, 2]);
    expect(freeSlots(undefined, 1)).toEqual([1]);
  });
});

describe('urls', () => {
  it('escapes the slug', () => {
    expect(imageUrl('a b', '1.png')).toContain('a%20b');
    expect(imageUrl('alejandro', '3.webp')).toBe(`${GALLERY_API}/gallery/alejandro/3.webp`);
  });
});

describe('there is one implementation, not two', () => {
  const player = readFileSync('player.html', 'utf8');
  const gram = readFileSync('dramagram.html', 'utf8');

  it('neither page writes to the bucket directly', () => {
    // A second PUT or DELETE built by hand is a second place to get the auth
    // header, the content type or the key shape wrong.
    for (const [name, src] of [['player.html', player], ['dramagram.html', gram]]) {
      expect(src, `${name} builds its own gallery write`)
        .not.toMatch(/method:\s*'PUT'[\s\S]{0,200}gallery\//);
      expect(src, `${name} builds its own gallery delete`)
        .not.toMatch(/method:\s*'DELETE'[\s\S]{0,120}gallery\//);
    }
  });

  it('both pages import the shared module', () => {
    expect(player).toMatch(/from '\.\/js\/gallery-io\.js'/);
    expect(gram).toMatch(/from '\.\/js\/gallery-io\.js'/);
  });

  it('keeps the cache rule in the module rather than in a page', () => {
    // Everything that WRITES must list with fresh:true, or a second upload
    // inside thirty seconds computes its free slots from a stale list and
    // overwrites the first one.
    const io = readFileSync('js/gallery-io.js', 'utf8');
    expect(io).toMatch(/fresh \? `\?t=\$\{Date\.now\(\)\}` : ''/);
    expect(io).toMatch(/cache: 'no-store'/);
    expect(io, 'uploadMany lists without skipping the cache')
      .toMatch(/listGallery\(slug, \{ fresh: true/);
  });

  it('passes an animation through instead of flattening it', () => {
    // Re-encoding a gif to webp on a canvas keeps the first frame and throws
    // the rest away.
    const io = readFileSync('js/gallery-io.js', 'utf8');
    expect(io).toMatch(/ext === 'gif' \|\| file\.type === 'image\/gif'/);
  });

  it('guards the classic script against the deferred module', () => {
    // player.html's gallery functions are in a classic script and the module
    // that provides them is deferred, so a clear message beats "cannot read
    // properties of undefined".
    expect(player).toMatch(/function _io\(\)/);
    expect(player).toMatch(/gallery module has not loaded yet/);
  });
});

describe('the profile picture is a fact about the photo, not a preference', () => {
  const gram = readFileSync('dramagram.html', 'utf8');

  // The first design kept the pin in localStorage, and these guards used to
  // hold it there — which is exactly the bug the author reported: pinned in one
  // browser, unpinned everywhere else, and the grid never saw it at all. The
  // pin is R2 metadata on the photograph now, and the guards hold THAT down.
  it('never keeps the pin in this browser', () => {
    expect(gram).not.toMatch(/dc_dramagram_pics/);
    expect(gram).not.toMatch(/setProfilePic\(/);
  });

  it('reads the face off the gallery document and writes it as metadata', () => {
    expect(gram).toMatch(/function pinnedOf\(gal\)/);
    expect(gram).toMatch(/setImageMeta\(slug, b\.dataset\.pin, \{ pinned: /);
  });

  it('falls back to the avatar when nothing is pinned', () => {
    expect(gram).toMatch(/pinnedOf\(gal\)\s*\n?\s*\?\s*imageUrl\(slug, pinnedOf\(gal\)\)/);
    expect(gram).toMatch(/assets\/avatars\//);
  });

  it('gives the grid the same face, in one request for the whole directory', () => {
    // 152 tiles must not mean 152 listings; the pins map is one endpoint.
    expect(gram).toMatch(/pinsBySlug = await fetchPins\(\)/);
    expect(gram).toMatch(/pinsBySlug\[d\.slug\]/);
  });
});
