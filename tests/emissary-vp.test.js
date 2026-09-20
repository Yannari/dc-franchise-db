// ══════════════════════════════════════════════════════════════════════
// emissary-vp.test.js — the Emissary Vote screens render at all
// ══════════════════════════════════════════════════════════════════════
//
// Reported from the published site, playing Total Drama:
//
//     Uncaught ReferenceError: accent is not defined
//         rpBuildEmissaryScouting  js/vp-screens.js:1610
//         buildVPScreens
//         openVisualPlayer
//
// The screen opened with a Big Brother room header pasted in whole —
// `class="rp-page bb-room ${accent === '#f85149' ? …}"` — and `accent` is a
// local of the BB screen it was copied from. Nothing in Total Drama declares
// it, so the FIRST episode of any season running the Emissary Vote twist took
// the whole visual player down with it, on a line of CSS class selection.
//
// A screen that throws is invisible to every test that checks what a screen
// SAYS, so this one only asks that both emissary screens produce html. That is
// the assertion the bug would have failed.
import { beforeAll, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { pStats, pronouns, tribeColor, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { rpBuildEmissaryScouting, rpBuildEmissaryChoice } from '../js/vp-screens.js';
import { seedGs, seedPlayers } from './helpers/setup.js';

// the screens read these off window, the way js/main.js puts them there
beforeAll(() => {
  seedGs({ episodeHistory: [] });
  seedPlayers({ name: 'Heather', gender: 'f' }, { name: 'Duncan' }, { name: 'Gwen', gender: 'f' }, { name: 'Owen' });
  core.players.forEach(p => { p.tribe = p.name === 'Heather' ? 'Gophers' : 'Bass'; });
  Object.assign(globalThis, { gs: core.gs, players: core.players, seasonConfig: core.seasonConfig,
    pStats, pronouns, tribeColor, ordinal, getBond, getPerceivedBond });
});

const EP = {
  num: 3,
  emissary: { name: 'Heather', tribe: 'Gophers', targetTribe: 'Bass' },
  emissaryScoutEvents: [
    { type: 'emissaryPitch', players: ['Heather', 'Duncan'], text: 'Heather makes her case at the fire.',
      pitcher: 'Duncan', pitchTarget: 'Owen', consequences: 'Duncan is playing both sides.' },
    { type: 'emissaryObservation', players: ['Heather'], text: 'She counts the sleeping bags.' },
    { type: 'emissaryDeal', players: ['Heather', 'Gwen'], text: 'A cross-tribe deal, whispered.' },
  ],
  emissaryPick: { name: 'Owen', reason: 'the strongest one left' },
  campEvents: {},
};

describe('the Emissary Vote screens', () => {
  it('renders the scouting screen instead of throwing', () => {
    const html = rpBuildEmissaryScouting(EP);
    expect(html).toContain('THE EMISSARY');
    expect(html).toContain('Heather');
    // the header is Total Drama's own time-of-day skin, not a Big Brother room
    expect(html).toContain('rp-page tod-');
    expect(html).not.toContain('bb-room');
  });

  it('renders the choice screen instead of throwing', () => {
    expect(rpBuildEmissaryChoice(EP)).toBeTruthy();
  });

  it('draws nothing when the season is not running the twist', () => {
    expect(rpBuildEmissaryScouting({ num: 1 })).toBe('');
  });
});
