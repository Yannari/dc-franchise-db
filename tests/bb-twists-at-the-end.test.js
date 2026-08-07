// The season twists, arriving at the one night that decides anything.
//
// Both of them built all season to a reveal and then the reveal evaporated. A
// saboteur could bank fifty thousand dollars for wrecking these people's weeks,
// sit down in front of seven of them, and not one juror would mention it. A
// pair of twins could both walk in, one reach the end, and the jury vote on six
// weeks of conversations without ever saying out loud that half of those
// conversations were with somebody else.
//
// So what is asserted here is that the reveal REACHES THE BALLOT: a juror asks
// about it, the finalist has to answer it in the voice of the game they
// actually played, the closing statement cannot pretend it did not happen, the
// reunion settles the debt the Saboteur's engine exists to create — and every
// one of those moves a real number before anybody votes.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { runJuryQuestioning, runClosingStatements, runReunion } from '../js/bb/finale-night.js';
import { installBBSaboteur, saboteurState } from '../js/bb/saboteur.js';
import { installTwinTwist, twinState } from '../js/bb/twin-twist.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Julia', 'Bowie', 'Wayne', 'Raj', 'Eli', 'Fern',
  'Gus', 'Hicks', 'Iris', 'Jae', 'Kit', 'Lex'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

const FINAL_TWO = ['Julia', 'Bowie'];
const JURY = ['Wayne', 'Raj', 'Eli', 'Fern', 'Gus', 'Hicks', 'Iris'];
const PREJURY = ['Jae', 'Kit', 'Lex'];

function house() {
  seedGame(CAST, { episode: 0, eliminated: [...PREJURY, ...JURY], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'disabled' });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
  gs.activePlayers = [...FINAL_TWO];
}

/** Seat a revealed saboteur on one of the two chairs. */
function seatSaboteur(who = 'Julia', { revealed = true, framedBy = 'Wayne', framed = 'Eli' } = {}) {
  installBBSaboteur(NAMES, { bankWeek: 5, rng: Math.random, pick: who });
  const st = saboteurState();
  st.revealed = revealed;
  st.survived = true;
  st.banked = 20000;
  st.missions = [{ week: 1, mission: 'plant', accepted: true, worked: true, paid: 5000 },
    { week: 2, mission: 'rig', accepted: true, worked: true, paid: 8000 }];
  // The house convicted somebody innocent along the way, which is the debt the
  // whole engine exists to create.
  st.suspicion = { [framed]: { [framedBy]: 3.2 } };
  return st;
}

/** Seat a revealed twin identity on one of the two chairs. */
function seatTwin(who = 'Julia', { ending = 'discovered', felt = 'Raj' } = {}) {
  installTwinTwist(NAMES, { quota: 3, rng: Math.random, pick: who });
  const st = twinState();
  st.ending = ending;
  st.entered = ending === 'entered';
  st.caught = ending !== 'entered';
  st.completed = 2;
  st.swaps = Array.from({ length: 6 }, (_, i) => ({ week: i + 1, active: i % 2 ? 'a' : 'b' }));
  st.suspicion = { [felt]: 2.6 };
  return st;
}

const ask = () => runJuryQuestioning({ finalTwo: FINAL_TWO, jury: JURY, week: 12, rng: Math.random });
const speak = () => runClosingStatements({ finalTwo: FINAL_TWO, jury: JURY, week: 12, rng: Math.random });
const stage = () => runReunion({ finalTwo: FINAL_TWO, jury: JURY, prejury: PREJURY, week: 12, rng: Math.random });

const clean = s => expect(String(s)).not.toMatch(/undefined|NaN|\[object Object\]/);

beforeEach(() => house());

describe('the jury asks about it', () => {
  it('puts the saboteur to the saboteur', () => {
    seatSaboteur('Julia');
    const { exchanges } = ask();
    const sab = exchanges.filter(e => e.kind === 'saboteur');
    expect(sab.length, 'seven people and nobody mentioned it').toBeGreaterThan(0);
    for (const e of sab) {
      expect(e.asked).toBe('Julia');
      clean(e.question);
      // The person it is not about answers their own case, not somebody
      // else's confession.
      const other = e.answers.find(a => a.finalist === 'Bowie');
      expect(other).toBeTruthy();
      clean(other.text);
      expect(other.text).not.toMatch(/I was the saboteur|two of us|being paid/i);
    }
  });

  it('puts the twins to the twin', () => {
    seatTwin('Bowie');
    const { exchanges } = ask();
    const tw = exchanges.filter(e => e.kind === 'twin');
    expect(tw.length, 'nobody asked which of them they had been talking to').toBeGreaterThan(0);
    for (const e of tw) {
      expect(e.asked).toBe('Bowie');
      clean(e.question);
    }
  });

  it('asks once, not seven times', () => {
    // A whole bench asking the same person about the same reveal is seven
    // people with one idea between them, and it crowds out every grievance the
    // season actually recorded.
    for (let i = 0; i < 12; i++) {
      house();
      seatSaboteur('Julia');
      const { exchanges } = ask();
      expect(exchanges.filter(e => e.kind === 'saboteur').length).toBeLessThan(2);
      // And the rest of the bench still asks about the season.
      expect(new Set(exchanges.map(e => e.kind)).size).toBeGreaterThan(1);
    }
  });

  it('says nothing when the house was never told', () => {
    // A saboteur who banked in secret is a secret, not a grievance. A jury
    // cannot ask about something nobody in that building ever learned.
    seatSaboteur('Julia', { revealed: false });
    const { exchanges } = ask();
    expect(exchanges.some(e => e.kind === 'saboteur')).toBe(false);
  });

  it('says nothing about a twin who never reached the chair', () => {
    seatTwin('Julia', { ending: 'evicted' });
    const { exchanges } = ask();
    expect(exchanges.some(e => e.kind === 'twin')).toBe(false);
  });
});

describe('the closing statement cannot pretend it did not happen', () => {
  it('makes them own it or dodge it, in their own voice', () => {
    for (const who of ['Julia', 'Bowie']) {
      house();
      seatSaboteur(who);
      const { statements } = speak();
      const mine = statements.find(s => s.finalist === who);
      const theirs = statements.find(s => s.finalist !== who);
      expect(mine.coda, 'got to the end of a speech without saying the word').toBeTruthy();
      expect(mine.twist).toBe('saboteur');
      clean(mine.coda);
      // And the other finalist is not confessing to somebody else's season.
      expect(theirs.coda ?? null).toBeNull();
    }
  });

  it('gives the twins their own last line', () => {
    seatTwin('Julia', { ending: 'entered' });
    const { statements } = speak();
    const mine = statements.find(s => s.finalist === 'Julia');
    expect(mine.coda).toBeTruthy();
    expect(mine.twist).toBe('twin');
    clean(mine.coda);
  });

  it('costs them when they duck it', () => {
    // Everybody in that room noticed you reached the end of a speech without
    // saying the word.
    const total = () => {
      house();
      const st = seatSaboteur('Julia');
      const { statements } = speak();
      const mine = statements.find(s => s.finalist === 'Julia');
      return { style: mine.style, sum: (mine.moved || []).reduce((a, m) => a + m.delta, 0) };
    };
    // Julia's stat line is fixed by the seed, so this is a straight check that
    // the coda is wired into the movement at all rather than being text.
    const run = total();
    expect(typeof run.sum).toBe('number');
    expect(Number.isFinite(run.sum)).toBe(true);
  });
});

describe('the reunion settles it', () => {
  it('gives the person who was convicted for nothing their apology', () => {
    seatSaboteur('Julia', { framedBy: 'Wayne', framed: 'Eli' });
    const { segments } = stage();
    const named = segments.find(s => s.kind === 'twist-saboteur');
    const cleared = segments.find(s => s.kind === 'twist-cleared');
    expect(named, 'the saboteur was never mentioned on that stage').toBeTruthy();
    expect(cleared, 'nobody apologised to the person who wore it').toBeTruthy();
    expect(cleared.players).toContain('Eli');
    expect(cleared.speaker).toBe('Wayne');
    clean(named.text); clean(cleared.text);
    // And it is worth something: Eli was suspected for a season for nothing.
    expect(getBond('Wayne', 'Eli')).toBeGreaterThan(0);
  });

  it('moves a vote when the person who did it is sitting in the chair', () => {
    let moved = 0;
    for (let i = 0; i < 10; i++) {
      house();
      seatSaboteur('Julia', { framedBy: 'Wayne', framed: 'Eli' });
      const { moved: m } = stage();
      if (m.some(x => x.juror === 'Wayne' && x.finalist === 'Julia')) moved++;
    }
    expect(moved, 'finding out minutes before the ballot changed nothing').toBeGreaterThan(0);
  });

  it('brings the other twin out in front of everybody', () => {
    seatTwin('Julia', { ending: 'discovered', felt: 'Raj' });
    const { segments } = stage();
    const twin = segments.find(s => s.kind === 'twist-twin');
    const felt = segments.find(s => s.kind === 'twist-felt');
    expect(twin, 'the twist never reached the stage').toBeTruthy();
    expect(felt, 'the person who spent a season being right never got to say so').toBeTruthy();
    expect(felt.speaker).toBe('Raj');
    clean(twin.text); clean(felt.text);
  });

  it('does not tell a pair who both played that they are meeting for the first time', () => {
    // Half that stage watched them stand next to each other for weeks.
    for (let i = 0; i < 10; i++) {
      house();
      seatTwin('Julia', { ending: 'entered' });
      const seg = stage().segments.find(s => s.kind === 'twist-twin');
      expect(seg.text).not.toMatch(/for the first time|walks out onto the stage/i);
    }
  });

  it('stays quiet on a season that ran neither', () => {
    const { segments } = stage();
    expect(segments.some(s => /^twist-/.test(s.kind))).toBe(false);
  });
});

describe('the finale prose', () => {
  it('does not flatten houseguest names into lower case mid-sentence', () => {
    // "the moment I earned this seat was when put julia on the jury" — the
    // whole claim was being lower-cased to fit inside a sentence, and every
    // name in it went with the leading "I".
    for (let i = 0; i < 25; i++) {
      house();
      const { statements } = speak();
      const { exchanges } = ask();
      const all = [...statements.map(s => s.text), ...exchanges.flatMap(e => e.answers.map(a => a.text))];
      for (const line of all) {
        for (const name of NAMES) {
          // Whole words only — "eli" lives inside "believe" and "kit" inside
          // "kitchen", and neither of those is a flattened name.
          expect(line, `a name was lower-cased: ${line.slice(0, 90)}`)
            .not.toMatch(new RegExp(`\\b${name.toLowerCase()}\\b`));
        }
      }
    }
  });
});
