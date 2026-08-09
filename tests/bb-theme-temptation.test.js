// Summer of Temptation, played.
//
// The theme is nearly pure composition — the Den, the powers shelf and the
// Halting Hex are all built — which is exactly why it is the first one. If the
// engine cannot assemble a season out of parts we already own, that is the
// cheapest possible week to find out.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { themeState, themeVoice, advanceThemeArc, BB_THEMES } from '../js/bb/themes.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(extra = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme: 'summer-of-temptation' }, extra);
  seasonConfig.twistSchedule = [];
}

const play = (seed = 2026) => withSeededRandom(seed, () => simulateBBEpisode());

const THEME = () => BB_THEMES['summer-of-temptation'];

describe('Summer of Temptation', () => {
  beforeEach(() => house());

  it('installs itself and books its arc on the first episode', () => {
    play();
    const st = themeState();
    expect(st.id).toBe('summer-of-temptation');
    expect(st.booked.length).toBeGreaterThan(0);
    expect(seasonConfig.twistSchedule.every(t => t.source === 'theme')).toBe(true);
  });

  it('books the Den, because that is what the season is', () => {
    play();
    expect(themeState().booked).toContain('bb-den-of-temptation');
  });

  it('speaks in the first week', () => {
    const ep = play();
    const said = (ep.acts || []).filter(a => a.type === 'theme-beat');
    expect(said.length).toBeGreaterThan(0);
    expect(said[0].speaker).toBe('The Den');
  });

  it('leaves a week you booked yourself alone', () => {
    house();
    seasonConfig.twistSchedule = [{ id: 'mine', episode: 2, type: 'bb-roadkill' }];
    play();
    const wk2 = seasonConfig.twistSchedule.filter(t => Number(t.episode) === 2);
    expect(wk2).toHaveLength(1);
    expect(wk2[0].type).toBe('bb-roadkill');
  });

  it('plays a full season without throwing', () => {
    withSeededRandom(31, () => {
      let guard = 0;
      while ((gs.activePlayers || []).length > 3 && guard++ < 40) {
        if (!simulateBBEpisode()) break;
      }
      expect(gs.activePlayers.length).toBe(3);
    });
  });

  it('replays identically from the same seed', () => {
    const a = JSON.stringify(play(909).acts.map(x => x.type));
    house();
    const b = JSON.stringify(play(909).acts.map(x => x.type));
    expect(a).toBe(b);
  });
});

// ── the arc, as an object ──
//
// The played tests above cannot see a booking that lands past week one, and a
// season only reaches week seven if nothing throws for six weeks first. These
// read the descriptor and the scheduler directly, so a mis-authored `at` is
// caught by name rather than by a distant season behaving oddly.
describe('the arc it actually books', () => {
  beforeEach(() => house());

  it('lays the whole arc onto a twelve-house season', () => {
    play();
    const mine = seasonConfig.twistSchedule
      .filter(t => t.source === 'theme')
      .map(t => [Number(t.episode), t.type])
      .sort((a, b) => a[0] - b[0]);
    // Twelve houseguests end at three, so nine weeks: fromEnd 4 is week 6 and
    // fromEnd 3 is week 7.
    expect(mine).toEqual([
      [2, 'bb-den-of-temptation'],
      [3, 'bb-have-nots'],
      [5, 'bb-den-of-temptation'],
      [6, 'bb-pandoras-box'],
      [7, 'bb-double-eviction'],
    ]);
  });

  // The Halting Hex is a POWER, not a twist card, so it can only reach a season
  // as a grant. Booking it directly would fail the registry test in
  // bb-themes.test.js; this pins the other half — that the arc still gets it
  // into the house, via the distributor that hands powers out.
  it('reaches the Halting Hex through Pandora rather than booking it', () => {
    play();
    const box = seasonConfig.twistSchedule.find(t => t.type === 'bb-pandoras-box');
    expect(box.prize).toBe('halting-hex');
    expect(seasonConfig.twistSchedule.some(t => t.type === 'halting-hex')).toBe(false);
    expect(TWIST_CATALOG.some(c => c.id === 'halting-hex')).toBe(false);
  });

  // A double eviction below a house of six is refused by the engine, and the
  // last weeks of a season run 5 -> 4 -> 3. An arc act that books one at
  // `fromEnd: 1` or `2` does not error — it silently never fires, which is the
  // worse failure and the one no other test in this repo would notice.
  it('books the double eviction where a double eviction can still happen', () => {
    const de = THEME().arc.find(a => a.book === 'bb-double-eviction');
    expect(de.at.fromEnd).toBeGreaterThanOrEqual(3);
  });

  it('books no twist that is not in the catalogue', () => {
    const ids = new Set(TWIST_CATALOG.map(c => c.id));
    for (const act of THEME().arc) {
      if (act.book) expect(ids, act.book).toContain(act.book);
    }
  });
});

// ── the heel turn ──
describe('the Den stops asking', () => {
  beforeEach(() => house());

  it('escalates to the literal mood the reader styles on', () => {
    // Not any old truthy string: rpBuildBBThemeBeat keys `is-hostile` off
    // exactly `'hostile'`, so a renamed mood loses the styling in silence.
    const turn = THEME().arc.find(a => a.mood);
    expect(turn.mood).toBe('hostile');
  });

  it('is neutral before the turn and hostile after it', () => {
    play();
    expect(themeState().mood).toBe('neutral');
    // Nine weeks in a twelve-house season, so week 6 is the arc's turn.
    advanceThemeArc(5, 9);
    expect(themeState().mood).toBe('neutral');
    advanceThemeArc(6, 9);
    expect(themeState().mood).toBe('hostile');
    // And it stays turned — a heel turn is not a one-week costume.
    advanceThemeArc(7, 9);
    expect(themeState().mood).toBe('hostile');
  });

  it('changes what the Den says when it turns', () => {
    play();
    const calm = themeVoice('open', { week: 6 }).line;
    advanceThemeArc(6, 9);
    const said = themeVoice('open', { week: 6 });
    expect(said.line).not.toBe(calm);
    expect(said.mood).toBe('hostile');
    // Really from the hostile pool, not merely a different neutral draw.
    const fill = t => t.replace('{week}', '6');
    expect(THEME().antagonist.voice.open.hostile.map(fill)).toContain(said.line);
  });

  it('does nothing at all on a season with no theme', () => {
    seasonConfig.theme = 'none';
    expect(advanceThemeArc(6, 9)).toBeNull();
  });
});

// ── the voice ──
//
// The pools are the thing that makes the roster bug below observable, and they
// have their own failure mode: a pool whose every line carries a token can go
// silent on a week that cannot fill it.
describe('the Den has something to say every week', () => {
  beforeEach(() => { house(); play(); });

  const HOOKS = ['open', 'noms', 'veto', 'vote'];

  it('carries at least four variants per hook and mood', () => {
    const voice = THEME().antagonist.voice;
    for (const hook of HOOKS) {
      for (const [mood, pool] of Object.entries(voice[hook])) {
        expect(pool.length, `${hook}/${mood}`).toBeGreaterThanOrEqual(4);
        expect(new Set(pool).size, `${hook}/${mood} repeats itself`).toBe(pool.length);
      }
    }
  });

  // The pool walk needs somewhere to land. A sealed HOH, a week nobody accepted
  // an offer and a skipped veto all hand the hook nulls, and if every line in
  // the pool needs a name the antagonist simply goes quiet.
  //
  // `vote` is exempt on purpose and is the one hook that SHOULD go quiet: a
  // night nobody left — the Halting Hex un-evicts somebody after the count — is
  // a night with no departure to announce, and bb-themes.test.js pins exactly
  // that behaviour.
  it('always has a line that needs no name at all', () => {
    const voice = THEME().antagonist.voice;
    for (const hook of ['open', 'noms', 'veto']) {
      for (const [mood, pool] of Object.entries(voice[hook])) {
        const nameless = pool.filter(l => !/\{(hoh|nominees|veto|cursed|evicted)\}/.test(l));
        expect(nameless.length, `${hook}/${mood} can be silenced`).toBeGreaterThan(0);
      }
    }
  });

  it('speaks at every hook on a week that hands it nothing but a number', () => {
    for (const hook of HOOKS) {
      const said = themeVoice(hook, { week: 4, hoh: null, nominees: [], evicted: 'Chase' });
      expect(said, hook).not.toBeNull();
    }
  });

  it('says nothing at the count on a night the Hex kept everybody in', () => {
    expect(themeVoice('vote', { week: 4, evicted: null, hoh: null })).toBeNull();
  });

  // The season's thesis, mechanised: the chair belongs to somebody who was
  // never in the room, and the Den is the only voice in the building that can
  // say so.
  it('names the cursed houseguest when a curse actually seated one', () => {
    const said = themeVoice('noms', { week: 5, hoh: 'Bowie', nominees: ['Chase', 'Ripper'],
      cursed: 'Scary', house: NAMES });
    expect(said).not.toBeNull();
    // Not asserting WHICH line — the draw is seeded — only that the token
    // resolves rather than being refused or left as a brace.
    expect(said.line).not.toContain('{');
  });

  it('refuses to name a cursed houseguest who is not in the house', () => {
    const cursedLine = THEME().antagonist.voice.noms.neutral.find(l => l.includes('{cursed}'));
    expect(cursedLine, 'no line reads the curse at all').toBeTruthy();
    // Directly: the pool walk would otherwise hide this behind a fallback.
    const said = themeVoice('noms', { week: 5, hoh: 'Bowie', nominees: ['Chase'],
      cursed: 'Ghost', house: NAMES });
    expect(said.line).not.toContain('Ghost');
  });
});

// ── the roster the antagonist is allowed to know ──
//
// `inHouse` read `gs.activePlayers` while the week engine plays its own
// roster-scoped `house`. On a Split House cycle those are two different lists,
// and the failure is silent in both directions: a legitimate `{nominees}` line
// is refused and the pool walk falls through to the least specific line in the
// pool, so the Den reads as thin writing for a whole side of the week. This was
// invisible while the only registered theme had one untokenised line.
describe('the Den knows which house it is talking about', () => {
  beforeEach(() => { house(); play(); });

  // Swept across twelve weeks rather than asserted on one, because the draw is
  // seeded: any single week may legitimately land on one of the pool's
  // untokenised lines. What cannot happen is that NONE of twelve weeks names
  // anybody — that is the refusal, and it reads as thin writing rather than as
  // a bug, which is exactly why it needs a test.
  const sweep = ctx => Array.from({ length: 12 }, (_, i) =>
    (themeVoice('noms', { ...ctx, week: i + 1 }) || {}).line || '');

  it('speaks about the half-house it was handed, not the whole roster', () => {
    const side = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle'];
    gs.activePlayers = ['Axel', 'Zee', 'Brightly', 'Hicks'];   // the OTHER side
    const lines = sweep({ hoh: 'Bowie', nominees: ['Chase', 'Ripper'], house: side });
    expect(lines.every(Boolean), 'the Den went silent on a side of the house').toBe(true);
    expect(lines.some(l => l.includes('Chase')),
      'every line naming the block was refused — the roster did not reach fillLine').toBe(true);
  });

  it('goes generic when the roster really does not have them', () => {
    // Same call, no `house`, and a live roster the block is not in: now the
    // refusals are correct and nobody is named.
    gs.activePlayers = ['Axel', 'Zee', 'Brightly', 'Hicks'];
    const lines = sweep({ hoh: 'Bowie', nominees: ['Chase', 'Ripper'] });
    expect(lines.some(l => l.includes('Chase'))).toBe(false);
    expect(lines.some(l => l.includes('Bowie'))).toBe(false);
  });

  it('still refuses somebody who is in neither', () => {
    const side = ['Bowie', 'Chase', 'Ripper'];
    gs.activePlayers = [...side];
    expect(sweep({ hoh: 'Ghost', nominees: ['Chase'], house: side })
      .some(l => l.includes('Ghost'))).toBe(false);
  });

  // The fallback is what keeps themeVoice callable with no roster at all, which
  // every unit test in bb-themes.test.js relies on.
  it('falls back to the live roster when the caller has no house', () => {
    gs.activePlayers = ['Bowie', 'Chase', 'Ripper'];
    const lines = sweep({ hoh: 'Bowie', nominees: ['Chase', 'Ripper'] });
    expect(lines.some(l => l.includes('Bowie'))).toBe(true);
  });

  it('never names a houseguest who left in an earlier week', () => {
    // Not a unit call: the wiring in _themeSay is the half that can rot, and
    // the guard's whole purpose is that the Den does not taunt the departed.
    house();
    let spoke = 0;
    withSeededRandom(404, () => {
      for (let w = 0; w < 4; w++) {
        const gone = [...(gs.eliminated || [])];
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const b of (ep.acts || []).filter(a => a.type === 'theme-beat')) {
          spoke++;
          for (const name of gone) {
            expect(b.line, `${name} was named after leaving`).not.toContain(name);
          }
        }
      }
    });
    expect(spoke, 'the Den never spoke at all').toBeGreaterThan(3);
  });
});
