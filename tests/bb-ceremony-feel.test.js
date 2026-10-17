// Big Brother's ceremonies as a game (the user's #9, 2026-10-16). The veto player pick draws chips out of a bag
// with the drawer's face after each one, and says what the chip was (your own name is not "houseguest's choice");
// the night of the HOH competition the room opens, with the engine's own moments from that room (bb/hoh-room.js)
// playing there instead of being dropped from House Life.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { hasHohRoom, hohRoomBeats } from '../js/bb/hoh-room.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1) }));

function play(cfg, weeks, seed) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'none', twistSchedule: [],
    bbTwins: 'off', bbRivals: 'off', bbSaboteur: 'off', bbDuos: 'off', bbDepartures: 'off' }, cfg);
  const out = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    out.push(JSON.parse(JSON.stringify(ep)));
  }
  return out;
}
const SEASONS = [play({}, 7, 11), play({}, 7, 23)].flat();
const INVISIBLE = play({ twistSchedule: [{ episode: 2, type: 'bb-invisible-hoh' }] }, 2, 11);
const ROOM_IDS = /^(power-hoh-room-reveal|phase-hoh-room|texture-hoh-letter)$/;
const text = S => S.steps.map(st => st.t || '').join(' ');

describe('the HOH room opens', () => {
  it('comes straight after the competition, on the HOH room plate, with the whole house walking in', () => {
    let n = 0;
    for (const ep of SEASONS) {
      const screens = bbWeekSteps(ep);
      const hoh = (ep.acts || []).find(a => a.type === 'hoh');
      const at = screens.findIndex(S => S.id === 'bb-hohroom-v');
      if (!hasHohRoom(hoh)) { expect(at, `week ${ep.num}`).toBe(-1); continue; }
      n++;
      expect(screens[at - 1]?.id, `week ${ep.num}`).toBe('bb-hoh-v');
      const S = screens[at];
      expect(S.set).toBe('hoh');
      expect(S.steps.some(st => st.turnKey && st.door && (st.at || []).length >= 3)).toBe(true);
      expect(text(S)).not.toMatch(/\{|\}|undefined|null/);
      for (let i = 0; i < S.steps.length; i++) expect(stageHtml(screens, at, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/);
    }
    expect(n).toBeGreaterThanOrEqual(10);
  });

  it('plays the engine’s moments from that night, and House Life does not play them again', () => {
    let shown = 0;
    for (const ep of SEASONS) {
      const acts = ep.acts || [];
      const i = acts.findIndex(a => a.type === 'hoh');
      const room = hohRoomBeats(acts, i);
      const S = bbWeekSteps(ep).find(x => x.id === 'bb-hohroom-v');
      for (const b of room) {
        expect(b.aired, b.eventId).toBe(true);
        // its first spoken line is on the screen
        const first = (b.lines || []).find(l => l.kind !== 'beat')?.text;
        if (first) { expect(S.steps.some(st => st.t === first), `${ep.num} ${b.eventId}`).toBe(true); shown++; }
      }
      // and no House Life scene in that stretch is one of them
      const stretch = [acts[i], acts[i + 1]].filter(Boolean);
      const again = stretch.flatMap(a => a.scenes || []).filter(sc => room.some(b => b.eventId === sc.step));
      expect(again.map(sc => sc.step), `week ${ep.num}`).toEqual([]);
    }
    expect(shown).toBeGreaterThanOrEqual(8);
  });

  it('never opens on an Invisible HOH: the house does not know whose room it is', () => {
    const ep = INVISIBLE.find(e => (e.acts || []).some(a => a.type === 'hoh' && a.secret));
    expect(ep).toBeTruthy();
    expect(bbWeekSteps(ep).some(S => S.id === 'bb-hohroom-v')).toBe(false);
    expect(hasHohRoom({ type: 'hoh', winner: 'Zee', secret: true })).toBe(false);
    expect(hasHohRoom({ type: 'hoh', winner: 'Zee', preCrowned: true })).toBe(false);
    expect(hasHohRoom({ type: 'hoh', winner: 'Zee' })).toBe(true);
  });
});

describe('the veto player pick', () => {
  it('draws every chip out of the bag, fills the field, and the drawer reacts to who came out', () => {
    let faces = 0, draws = 0;
    for (const ep of SEASONS) {
      const veto = (ep.acts || []).find(a => a.type === 'veto');
      const S = bbWeekSteps(ep).find(x => x.id === 'bb-vdraw-v');
      if (!veto?.draw?.length) continue;
      expect(S.vfield).toBeGreaterThanOrEqual(6);
      for (const d of veto.draw) {
        draws++;
        expect(Number.isFinite(d.feel), 'the drawer’s feeling is recorded at the draw').toBe(true);
        expect(S.steps.some(st => st.chip?.drawer === d.drawer)).toBe(true);
      }
      // what came out of the bag is what the chip was: your own name is your own chip, not a blank
      for (const d of veto.draw.filter(x => x.chipWas === 'own')) expect(text(S)).toContain(`${d.drawer}'s own chip`);
      for (const d of veto.draw.filter(x => x.chipWas === 'playing')) expect(text(S)).toContain(`${d.drawer} draws ${d.drew}, who is already playing`);
      const said = S.steps.filter(st => !st.chip && !st.vetoPlay && st.k !== 'bb').map(st => st.t);
      expect(new Set(said).size, `week ${ep.num}: a face twice`).toBe(said.length);
      faces += S.steps.filter(st => st.focus?.length === 2 || (st.k === 'say' && !st.vetoPlay && veto.draw.some(d => d.drew === st.by || d.drawer === st.by))).length;
    }
    expect(draws).toBeGreaterThanOrEqual(20);
    expect(faces).toBeGreaterThanOrEqual(draws / 2);
  });
});
