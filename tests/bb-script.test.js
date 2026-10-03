// The Big Brother dialogue layer (spec 2026-10-01 §4.2-4.4, Phase 1).
//
// An event decides its scene (who, what ending, who saw it); the words are
// picked afterwards from pools keyed on the ending, through the picker shared
// with The Circle (js/script/pick.js). These tests hold the pools to their
// contract and play real seasons to check what airs.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { BB_FACT_KEYS } from '../js/bb/script/facts.js';
import { makeScene, witness, learnFrom } from '../js/bb/script/scene.js';
import { fill } from '../js/bb/script/write.js';
import { withSeededRandom } from './helpers/rng.js';

const ROLES = new Set(['a', 'b', 'c', 'hoh']);
const FLOOR = 6;   // spec §3: an occasional pool keeps at least six entries per ending

describe('the pools keep their contract', () => {
  const all = Object.entries(POOLS);

  it('every entry id is unique across every pool', () => {
    const ids = all.flatMap(([, pool]) => pool.map(e => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('filters only on facts the writer knows', () => {
    for (const [key, pool] of all) {
      for (const e of pool) {
        for (const k of Object.keys(e.when || {})) expect(BB_FACT_KEYS, `${key} ${e.id} filters on '${k}'`).toContain(k);
      }
    }
  });

  it('is big enough, and always has something that fits', () => {
    for (const [key, pool] of all) {
      expect(pool.length, `${key} is under the floor`).toBeGreaterThanOrEqual(FLOOR);
      expect(pool.filter(e => !e.when).length, `${key} has too few unconditional entries`).toBeGreaterThanOrEqual(3);
    }
  });

  it('never writes an entry that is only narration', () => {
    // A scene is people talking. An entry of stage directions alone aired as a
    // caption with nobody in it (eight of them in power.js before this guard).
    for (const [key, pool] of Object.entries(POOLS)) {
      for (const e of pool) expect(e.turns.some(t => t.say || t.dr), `${key} ${e.id} has nobody speaking`).toBe(true);
    }
  });

  it('gives every turn a known speaker and exactly one kind of line', () => {
    for (const [key, pool] of all) {
      for (const e of pool) {
        for (const t of e.turns) {
          const kinds = ['say', 'dr', 'beat'].filter(k => t[k]);
          expect(kinds.length, `${key} ${e.id}: a turn must be one of say / dr / beat`).toBe(1);
          if (t.say || t.dr) expect(ROLES.has(t.by), `${key} ${e.id}: speaker '${t.by}'`).toBe(true);
        }
      }
    }
  });

  it('only writes the third houseguest into a scene that has one', () => {
    // c exists only where the scene always has one: the 'smoothed' friction
    // ending, a nomination speech (the second nominee), and the talk families
    // about somebody who is not in the room. Anywhere else an entry may only
    // speak of c behind `when: { third: true }`; otherwise it prints a raw slot.
    const WITH_C = [/\.smoothed$/, /^noms\.speech\./, /^talk\.(gossip|pitch-target|hoh-decide)\./, /^social\.rumour\./, /^deals\.(exposed|final-three|competing|hedged)\./, /^alliance\.(inner|overlap|protect|recruited|formed)\./, /^power\.(pawn|replaced-reacts|veto-fallout|veto-promise|spy|backdoor|queue|reveal)\./, /^life\.(table|game|inside-joke)\./, /^friction\.(condescend|story)\./, /^phase\.(prepos|last-equal|hoh-room|targets)\./, /^bloc\.(noticed|votes|blowup)\./, /^reign\.both\./, /^scheme\.kiss\.setup$/, /^scheme\.collapse\./, /^texture\.(backyard|trial|namedrop)\./, /^editorial\.(bedroom|whisper|latenight|spill|orbit|flip|roast|meeting)\./, /^arc\.(court|debt)\./, /^couple\.(hiding|leak|jealous|underground)\./, /^plan\.seen\./, /^cer\.(nomgame|nompersonal)\./, /^romance\.(showmanceNoticed|showmanceTarget|showmanceJealousy|friendshipJealousy|triangle\w+|affairCaught|affairChoice|showmanceSabotage)\./, /^engine\.block\./];
    for (const [key, pool] of all) {
      if (WITH_C.some(re => re.test(key))) continue;
      for (const e of pool) {
        if (e.when?.third === true) continue;
        const text = JSON.stringify(e.turns);
        expect(/\{c[}.]|"by":"c"/.test(text), `${key} ${e.id} speaks for a third houseguest who is not there`).toBe(false);
      }
    }
  });
});

describe('the pools read for every houseguest', () => {
  it('never puts a verb that only agrees with he or she after a pronoun slot', () => {
    // "{b.sub} has" prints "they has" for a houseguest who uses they/them.
    // ("{b.sub} didn't" and "{b.sub}'d" are fine: they agree with they.)
    const bad = /\{[a-z]+\.[sS]ub\}('s\b|\s+(has|is|was|does|doesn't|isn't|wasn't|hasn't|[a-z]+[^s']s)\b)/;
    for (const [key, pool] of Object.entries(POOLS)) {
      for (const e of pool) for (const t of e.turns) {
        const text = t.say || t.dr || t.beat;
        expect(bad.test(text), `${key} ${e.id}: ${text}`).toBe(false);
      }
    }
  });
});

describe('knowledge has a witness', () => {
  it('lets the people in the room learn, and refuses anyone who was not', () => {
    const scene = makeScene('friction.dishes', { a: 'Gwen', b: 'Heather' }, { ending: 'snipe' }, ['Scott']);
    expect(witness(scene, 'Scott')).toBe(true);
    expect(learnFrom(scene, 'Gwen', () => 'learned')).toBe('learned');
    expect(() => witness(scene, 'Duncan')).toThrow(/not in/);
  });
});

// ── real seasons ───────────────────────────────────────────────────────
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const CONVERTED = new Set(['friction-dishes', 'friction-food']);
let scripted = [];

beforeAll(() => {
  for (const seed of [3, 11, 23, 41, 57]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
      gender: i % 3 === 0 ? 'f' : i % 3 === 1 ? 'm' : 'nb', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
      pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
    seasonConfig.twistSchedule = [];
    initGameState();
    globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 8; i++) simulateBBEpisode(); });
    for (const w of gs.bb.weeks) {
      for (const act of (w.acts || [])) {
        for (const b of (act.socialBeats || [])) if (CONVERTED.has(b.eventId)) scripted.push({ ...b, week: w.num, seed });
      }
    }
  }
}, 900000);

describe('what airs from a real season', () => {
  it('the converted events fire and come out as scripts', () => {
    expect(scripted.length, 'no converted scene fired in five seasons').toBeGreaterThan(5);
    for (const b of scripted) {
      expect(Array.isArray(b.lines) && b.lines.length >= 3, `${b.eventId} has no script`).toBe(true);
      expect(b.text).toBeTruthy();
    }
  });

  it('fills every slot, and nobody speaks who is not in the scene', () => {
    for (const b of scripted) {
      expect(b.text, `${b.lineId}: ${b.text}`).not.toMatch(/\{|\}|undefined|null/);
      for (const l of b.lines) if (l.by) expect(b.players.includes(l.by), `${l.by} speaks in ${b.lineId} but is not in it`).toBe(true);
    }
  });

  it('airs more than one ending', () => {
    const endings = new Set(scripted.map(b => b.lineId.split('.')[1][0]));
    expect(endings.size, 'every scene ended the same way').toBeGreaterThan(1);
  });

  it('never airs the same exchange twice in a week', () => {
    const seen = new Set();
    for (const b of scripted) {
      const k = `${b.seed}|${b.week}|${b.lineId}`;
      expect(seen.has(k), `${b.lineId} aired twice in week ${b.week} (seed ${b.seed})`).toBe(false);
      seen.add(k);
    }
  });
});

describe('fill', () => {
  it('fills names, pronouns and the head-count', () => {
    setGs(null);
    setPlayers([{ name: 'Ann', gender: 'f' }, { name: 'Bo', gender: 'm' }]);
    initGameState();
    gs.activePlayers = ['Ann', 'Bo'];
    expect(fill('{a} told {b} that {a.sub} had had enough. There are {count} of us.', { a: 'Ann', b: 'Bo' }))
      .toBe(`Ann told Bo that ${pronouns('Ann').sub} had had enough. There are two of us.`);
  });
});
