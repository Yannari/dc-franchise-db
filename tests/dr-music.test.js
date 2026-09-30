// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-music.test.js — music for the moment (js/vp-dr/music.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { musicOfKind, situationOf, songForFile, momentForFile, tagStep, lipsyncMusicOf, DRAG_SITUATIONS } from '../js/vp-dr/music.js';
import { WERK_EVENTS } from '../js/dr/data/werk-events.js';
import { UNTUCKED_EVENTS } from '../js/dr/data/untucked-events.js';
import { SONGS } from '../js/dr/data/songs.js';
import { readFileSync } from 'node:fs';

describe('the scenes are classified by hand', () => {
  it('names only events that exist — a typo would silently mute a scene', () => {
    const ids = new Set([...WERK_EVENTS, ...UNTUCKED_EVENTS].map(e => e.id));
    const src = readFileSync('js/vp-dr/music.js', 'utf8');
    const block = src.slice(src.indexOf('const MOOD = {'), src.indexOf('const BY_EVENT'));
    const listed = [...block.matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]);
    expect(listed.length).toBeGreaterThan(100);
    expect(listed.filter(id => !ids.has(id))).toEqual([]);
  });

  it('reads a scene by its kind, whichever room it is in', () => {
    expect(musicOfKind('werk:read-lands-wrong')).toBe('drama');
    expect(musicOfKind('untucked:threw-me-under')).toBe('drama');
    expect(musicOfKind('werk:the-bit')).toBe('comedy');
    expect(musicOfKind('untucked:it-all-arrives')).toBe('cry');
    expect(musicOfKind('werk:head-down-working')).toBe(null);   // an ordinary scene is silence
  });
});

describe('every screen knows what it is', () => {
  it('has a default for every section suffix (null counts: it means "its scenes decide")', () => {
    const src = readFileSync('js/vp-dr/music.js', 'utf8');
    const screen = src.slice(src.indexOf('const SCREEN = {'), src.indexOf('/** Every situation'));
    const suffixes = [...readFileSync('js/vp-dr/screens.js', 'utf8').matchAll(/suffix: '([a-z0-9-]+)'/g)].map(m => m[1]);
    expect(suffixes.length).toBeGreaterThan(30);
    for (const sfx of suffixes) expect(screen, `${sfx} has no music default`).toMatch(new RegExp(`\\b${sfx}:`));
  });

  it('a step\'s own tag beats its screen, and a challenge gets its own track', () => {
    document.body.innerHTML = `<div class="dr-chal dr-chal-rusical"><div id="a" class="dr-step"></div></div>
      <div id="b" class="dr-step" data-music="drama"></div><div id="c" class="dr-step" data-music="none"></div>`;
    expect(situationOf('maxi', document.getElementById('a'))).toBe('chal-rusical');
    expect(situationOf('runway', document.getElementById('b'))).toBe('drama');
    expect(situationOf('runway', document.getElementById('c'))).toBe(null);
    expect(situationOf('runway', document.createElement('div'))).toBe('runway');
  });

  it('tags a card with its moment and its song', () => {
    const html = tagStep('<div class="dr-step" id="x">hi</div>', 'winner', 'Toxic');
    expect(html).toContain('data-music="winner"');
    expect(html).toContain('data-song="Toxic"');
    expect(lipsyncMusicOf('stage:lipsync-shantay')).toBe('shantay');
    expect(lipsyncMusicOf('stage:sashay-words')).toBe('sashay');
    expect(lipsyncMusicOf('stage:lipsync-beat')).toBe(null);   // the performance is the song
  });
});

describe('uploading files by name', () => {
  it('files a moment track by its name', () => {
    expect(momentForFile('drama.mp3')).toBe('drama');
    expect(momentForFile('drama #2.mp3')).toBe('drama');
    expect(momentForFile('winner-3.mp3')).toBe('winner');
    expect(momentForFile('chal-rusical.mp3')).toBe('chal-rusical');
    expect(momentForFile('Toxic.mp3')).toBe(null);
    for (const s of DRAG_SITUATIONS) expect(momentForFile(`${s}.mp3`)).toBe(s);
  });

  it('files a song by its title, however the file is named', () => {
    expect(songForFile('Toxic.mp3')?.title).toBe('Toxic');
    expect(songForFile('Toxic - Britney Spears.mp3')?.title).toBe('Toxic');
    expect(songForFile('Britney Spears - Toxic.mp3')?.title).toBe('Toxic');
    expect(songForFile('Emotions.mp3')?.title).toBe('Emotions');
    expect(songForFile('Emotion.mp3')?.title).toBe('Emotion');
    expect(songForFile('holiday photos.mp3')).toBe(null);
  });

  it('never confuses a moment name with a song title', () => {
    for (const s of DRAG_SITUATIONS) expect(songForFile(`${s}.mp3`), s).toBe(null);
    for (const s of SONGS) expect(momentForFile(`${s.title}.mp3`), s.title).toBe(null);
  });
});
