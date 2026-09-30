// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-music.test.js — music for the moment (js/vp-dr/music.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { musicOfKind, situationOf, songForFile, momentForFile, tagStep, lipsyncMusicOf, DRAG_SITUATIONS, pickPreview } from '../js/vp-dr/music.js';
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
    // The verdict is one moment under one cue; her goodbye after it is the Last Sun's.
    expect(lipsyncMusicOf('stage:lipsync-shantay')).toBe('the-verdict');
    expect(lipsyncMusicOf('stage:lipsync-sashay')).toBe('the-verdict');
    expect(lipsyncMusicOf('stage:sashay-words')).toBe('sashay');
    // The speech: the tension bed, then "The Time Has Come".
    expect(lipsyncMusicOf('stage:lipsync-speech', { part: 'stakes' })).toBe('bottom-two');
    expect(lipsyncMusicOf('stage:lipsync-speech', { part: 'time' })).toBe('time-has-come');
    // "The time has come" has its own cue; the song starts on the first move.
    expect(lipsyncMusicOf('stage:lipsync-intro')).toBe('time-has-come');
    expect(lipsyncMusicOf('stage:lipsync-beat')).toBe('lipsync');
    expect(lipsyncMusicOf('stage:lipsync-stunt')).toBe('lipsync');
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

  it('plays the record\'s clip, never a cover or a remix', () => {
    const r = (trackName, artistName) => ({ trackName, artistName, previewUrl: `${trackName}|${artistName}` });
    const results = [
      r('Toxic (Karaoke Version)', 'Karaoke Stars'), r('Toxic', 'Toxic Tribute Band'),
      r('Toxic (Y2K & Alexander Lewis Remix)', 'Britney Spears'), r('Toxic', 'Britney Spears'),
    ];
    expect(pickPreview(results, 'Toxic', 'Britney Spears')?.previewUrl).toBe('Toxic|Britney Spears');
    expect(pickPreview([r('Toxic', 'Toxic Tribute Band')], 'Toxic', 'Britney Spears')).toBe(null);
    expect(pickPreview([r('Emotions', 'Mariah Carey')], 'Emotion', 'Carly Rae Jepsen')).toBe(null);
    expect(pickPreview([r('Single Ladies (Put a Ring on It)', 'Beyoncé')], 'Single Ladies (Put a Ring on It)', 'Beyonce')).toBeTruthy();
    // Found by searching all 132 songs: each of these was picked over the record.
    expect(pickPreview([r('Telephone (Kaskade Mix)', 'Lady Gaga'), r('Telephone (feat. Beyoncé)', 'Lady Gaga')], 'Telephone', 'Lady Gaga')?.trackName)
      .toBe('Telephone (feat. Beyoncé)');
    expect(pickPreview([r('Last Dance (Live)', 'Donna Summer'), r('Last Dance (Single Version)', 'Donna Summer'), r('Last Dance', 'Donna Summer')], 'Last Dance', 'Donna Summer')?.trackName)
      .toBe('Last Dance');
    expect(pickPreview([r('Last Dance (Live)', 'Donna Summer')], 'Last Dance', 'Donna Summer')).toBeTruthy();   // the singer, live, beats a generic track
    expect(pickPreview([r('Stupid Girls', 'P!nk')], 'Stupid Girls', 'Pink')).toBeTruthy();
    expect(pickPreview([r('And All That Jazz', 'Catherine Zeta-Jones, Renée Zellweger & Taye Diggs')], 'All That Jazz', 'Catherine Zeta-Jones')).toBeTruthy();
  });

  it('never confuses a moment name with a song title', () => {
    for (const s of DRAG_SITUATIONS) expect(songForFile(`${s}.mp3`), s).toBe(null);
    for (const s of SONGS) expect(momentForFile(`${s.title}.mp3`), s.title).toBe(null);
  });
});
