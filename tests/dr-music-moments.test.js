// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-music-moments.test.js — each of the show's cues plays at its own moment
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { rpBuildSmackdown } from '../js/vp-dr/smackdown.js';
import { smackdownScenes } from '../js/dr/smackdown.js';
import { rngFor } from '../js/dr/rng.js';

describe("the show's cues", () => {
  it('play only at the moment each is named for', () => {
    /* Played in the viewer: "The Time Has Come" under every tear in the werk
       room and "Bottom Two" under every argument, because they had been reused
       for drama and cry. The user: "i still dont hear the soundtrack in the
       correct place". A cue may score the moments of ONE kind, no more. */
    const allowed = {
      'private/time-has-come.mp3': ['time-has-come', 'the-verdict', 'suspense', 'crowning'],
      'private/bottom-two.mp3': ['bottom-two'],
      'private/up-for-elimination.mp3': ['up-for-elimination'],
      'private/top-and-bottom.mp3': ['critiques', 'the-call'],
      'private/love-yourself.mp3': ['closing'],
      // The Last Sun is her goodbye, and nothing else (the user: the call "is using the sashay music").
      'private/decision.mp3': ['sashay'],
      'private/arrivals.mp3': ['entrances'],
      'private/werkroom.mp3': ['werkroom'],
      'private/untucked.mp3': ['untucked'],
      'private/rehearsal.mp3': ['prep'],
      'private/rehearsal-2.mp3': ['prep'],
      'private/challenge.mp3': ['challenge'],
      'private/challenge-2.mp3': ['challenge'],
      'private/chal-rusical.mp3': ['chal-rusical'],
    };
    const m = JSON.parse(readFileSync('assets/audio/drag/manifest.json', 'utf8'));
    for (const [sit, list] of Object.entries(m)) {
      if (!Array.isArray(list)) continue;
      for (const t of list) {
        if (!allowed[t.file]) continue;
        expect(allowed[t.file], `${t.file} is playing under "${sit}"`).toContain(sit);
      }
    }
  });
});

describe('the smackdown', () => {
  it('starts each song when the lip sync does, not on the ball draw', () => {
    const duel = (a, b, sa, sb, round = 1, song = `${a}${b} Song`) => ({
      round, a, b, song, artist: 'X', winner: sa >= sb ? a : b, loser: sa >= sb ? b : a,
      scores: { [a]: sa, [b]: sb }, adjusted: { [a]: sa, [b]: sb }, strategy: 'safe',
    });
    const duels = [duel('A', 'B', 7, 6), duel('C', 'D', 8, 5), duel('A', 'C', 6, 7, 2, 'Final Song')];
    const field = ['A', 'B', 'C', 'D'];
    const row = { num: 9, dr: { ep: 9, smackdown: { field, duels, winner: 'C' },
      scenes: smackdownScenes({ field, duels, rng: rngFor(1) }) } };
    document.body.innerHTML = rpBuildSmackdown(row);
    const steps = [...document.querySelectorAll('[id^="dr-step-smackdown-"]')]
      .map(e => ({ music: e.dataset.music || null, song: e.dataset.song || null }));
    expect(steps.length).toBeGreaterThan(10);
    // A song is only ever on a card that IS the lip sync...
    for (const s of steps) if (s.song) expect(s.music).toBe('lipsync');
    // ...each duel's song appears, and the card before it is the announcement.
    for (const d of duels) {
      const at = steps.findIndex(s => s.song === d.song);
      expect(at, d.song).toBeGreaterThan(0);
      expect(steps[at - 1].music, `before ${d.song}`).toBe('time-has-come');
    }
    // No card before the first announcement carries a song.
    const firstCall = steps.findIndex(s => s.music === 'time-has-come');
    expect(steps.slice(0, firstCall).some(s => s.song)).toBe(false);
  });
});
