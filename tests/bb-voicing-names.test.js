// Big Brother's own voices are voiced like everybody else's (the user, 2026-10-25: "cant find how to voice the big
// brother and the mastermind"): the house as "Big Brother", a season's voice (The Mastermind, AINSLEY...) by its
// name; and the voice is found by the name the user gave it in Inworld, exactly or near enough.
import { describe, expect, it } from 'vitest';
import { voiceName, resolveVoices } from '../js/vp-bb-ep/voicing.js';

describe('who speaks, as a voice', () => {
  it('names the house and a season\'s own voice, and keeps the stage directions silent', () => {
    expect(voiceName({ k: 'bb', t: 'Houseguests, please gather in the living room.' })).toBe('Big Brother');
    expect(voiceName({ k: 'voice', by: 'The Mastermind', t: 'Good evening.' })).toBe('The Mastermind');
    expect(voiceName({ k: 'say', by: 'Bowie', t: 'Hi.' })).toBe('Bowie');
    expect(voiceName({ k: 'beat', t: 'The lights go out.' })).toBeNull();
  });
});

describe('finding the voice', () => {
  const account = { 'Big Brother': 'ws__bb', 'The-Mastermind': 'ws__mm', bowie: 'ws__bowie', Chase: 'ws__chase' };
  it('takes the exact name first, then the same name typed differently', () => {
    expect(resolveVoices(['Big Brother', 'The Mastermind', 'Bowie', 'Chase', 'Zee'], account))
      .toEqual({ 'Big Brother': 'ws__bb', 'The Mastermind': 'ws__mm', Bowie: 'ws__bowie', Chase: 'ws__chase' });
  });
  it('never gives one speaker somebody else\'s voice', () => {
    expect(resolveVoices(['Big Brother'], { 'Big Brother 2': 'x', Brother: 'y' })).toEqual({});
  });
});

// Resetting a Secret Story test season deleted the Big Brother season of the same number's paid voices: the two
// shows shared the bb-<number> folder, and a reset emptied the folder (the user, 2026-10-29: "thats dumb there are 2
// different show", "it cost me to generate voice i dont wanna lose it").
import { readFileSync } from 'node:fs';
import { bbVoiceSeason } from '../js/vp-bb-ep/voicing.js';

describe('each show keeps its own voices', () => {
  const at = (format, seasonNumber) => {
    const was = { cfg: globalThis.seasonConfig, gs: globalThis.gs };
    globalThis.seasonConfig = { format, seasonNumber }; globalThis.gs = {};
    try { return bbVoiceSeason(); } finally { globalThis.seasonConfig = was.cfg; globalThis.gs = was.gs; }
  };
  it('gives Secret Story its own folder, and leaves Big Brother\'s where its clips are', () => {
    expect(at('big-brother', 2)).toBe('bb-2');
    expect(at('secret-story', 2)).toBe('ss-2');
    expect(at(undefined, 2)).toBe('bb-2');
  });
  it('never deletes a clip on a reset, a re-run or a voicing', () => {
    const reset = readFileSync('js/savestate.js', 'utf8');
    const body = reset.slice(reset.indexOf('export function resetSeason'), reset.indexOf('setGs(null)', reset.indexOf('export function resetSeason')));
    expect(body).not.toMatch(/ClearVoices/);
    for (const f of ['js/vp-bb-ep/voicing.js', 'js/vp-ci/voicing.js', 'js/vp-td-ep/voicing.js']) {
      const src = readFileSync(f, 'utf8');
      // the clear function is still there for a deliberate use; nothing in the file calls it
      const calls = src.match(/await (bb|ci)?[cC]learVoices\(/g) || [];
      expect(calls, `${f} deletes clips`).toEqual([]);
    }
  });
});
