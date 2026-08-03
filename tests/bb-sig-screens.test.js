// The six signature competitions each have a themed VP screen, dispatched on
// the result's `variant` tag. These tests guard the shared contract every
// themed screen owes the viewer, whatever its DOM looks like: it actually
// renders (the dispatch is wired, not merely written), the full field appears
// once fully revealed, who sat out is named, an Invisible HOH falls back to
// the sealed generic board, and a rebuild at the same idx is byte-identical —
// the reveal machinery repaints the whole screen on every click, so any
// nondeterminism flickers new text at the viewer.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS, SIGNATURE_COMPS } from '../js/bb-comps/index.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';
import { players } from '../js/core.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = (seed) => Object.fromEntries(
  STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));

const CAST = [
  ['Ada', 'mastermind', 'f'], ['Bo', 'social-butterfly', 'm'], ['Cy', 'challenge-beast', 'm'],
  ['Dee', 'schemer', 'f'], ['Eli', 'hero', 'm'], ['Flo', 'floater', 'f'],
  ['Gus', 'villain', 'm'], ['Haf', 'loyal-soldier', 'f'], ['Ike', 'underdog', 'm'],
  ['Jo', 'goat', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));
const HOUSE = CAST.map(p => p.name);

const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// variant tag → the screen's own state-key prefix and CSS prefix. A themed
// screen is recognised by its CSS prefix showing up in the html — and the
// generic board by `bbc-board`, which no themed screen uses.
const SCREENS = {
  'otev': { key: 'bb_sig_otev', css: 'sgo-' },
  'the-wall': { key: 'bb_sig_wall', css: 'sgw-' },
  'pressure-cooker': { key: 'bb_sig_cooker', css: 'sgc-' },
  'hide-and-go-veto': { key: 'bb_sig_hide', css: 'sgh-' },
  'bb-comics': { key: 'bb_sig_comics', css: 'sgx-' },
  'before-or-after': { key: 'bb_sig_boa', css: 'sgb-' },
};

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

const primaryType = comp => (comp.types.includes('hoh') ? 'hoh' : comp.types[0] === 'return' ? 'hoh' : comp.types[0]);

// One real simulated result, wrapped in the same act shape week.js pushes.
function makeEp(comp, { seed = 5, secret = false } = {}) {
  const type = primaryType(comp);
  const satOut = HOUSE[HOUSE.length - 1];
  const participants = HOUSE.filter(n => n !== satOut);
  const result = runBBCompetition({
    type, participants, excluded: [satOut], house: HOUSE,
    library: BB_COMPETITIONS, forcedId: comp.id, rng: seededRng(seed),
    week: { num: 4, houseAtStart: HOUSE },
  });
  const results = result.placements.map(name => ({
    name, score: result.scores[name], threw: !!result.debug.scoreBreakdown?.[name]?.threw,
  }));
  const act = { type, winner: result.winner, results, competition: result, participants };
  if (type === 'hoh') { act.outgoingHoh = satOut; act.secret = secret; }
  return { ep: { num: 4, acts: [act], houseAtStart: HOUSE }, act, type, satOut };
}

describe('signature competition screens', () => {
  beforeEach(reset);

  for (const comp of SIGNATURE_COMPS) {
    describe(comp.id, () => {
      it('dispatches to its themed screen and shows the whole field when revealed', () => {
        const { ep, act, type } = makeEp(comp);
        const variant = act.competition.variant;
        const screen = SCREENS[variant];
        expect(screen, `unknown variant tag '${variant}'`).toBeTruthy();

        const key = `${screen.key}_${ep.num}_${type}`;
        _tvState[key] = { idx: 999 };
        const html = rpBuildBBComp(ep, type);

        expect(html, `${comp.id} fell through to the generic board`).toContain(screen.css);
        expect(html).not.toContain('bbc-board');
        for (const r of act.results) expect(html, `${comp.id} dropped ${r.name}`).toContain(r.name);
      });

      it('names who sat out, and the outgoing HOH who cannot defend', () => {
        const { ep, act, type, satOut } = makeEp(comp);
        const key = `${SCREENS[act.competition.variant].key}_${ep.num}_${type}`;
        // Pre-competition information: it must be on screen BEFORE the first
        // click, not gated behind the reveal.
        for (const idx of [-1, 999]) {
          _tvState[key] = { idx };
          const html = rpBuildBBComp(ep, type);
          expect(html, `sat-out hidden at idx ${idx}`).toContain('Sat out');
          expect(html).toContain(satOut);
          if (type === 'hoh') expect(html).toContain('cannot defend the room');
        }
      });

      it('renders byte-identically on rebuild at the same idx', () => {
        const { ep, act, type } = makeEp(comp);
        const key = `${SCREENS[act.competition.variant].key}_${ep.num}_${type}`;
        for (const idx of [-1, 2, 999]) {
          _tvState[key] = { idx };
          const a = rpBuildBBComp(ep, type);
          const b = rpBuildBBComp(ep, type);
          expect(a, `${comp.id} nondeterministic at idx ${idx}`).toBe(b);
        }
      });

      if (comp.types.includes('hoh')) {
        it('declines a sealed Invisible HOH and leaves it to the generic board', () => {
          const { ep, type } = makeEp(comp, { secret: true });
          _tvState[`bb_comp_${ep.num}_${type}`] = { idx: 999 };
          const html = rpBuildBBComp(ep, type);
          expect(html).toContain('bbc-board');
        });
      }
    });
  }
});
