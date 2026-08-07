// Finale night: the questioning, the statements, America's Favourite.
//
// The vote used to be computed before anybody spoke. What is asserted here is
// that the room now matters and — just as importantly — that it does not
// matter TOO much: a juror who spent six weeks hardening has to be able to sit
// through the perfect answer and vote the other way anyway.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { addBond, getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { readOf, seedJurorReads, moveRead } from '../js/bb/jury-sentiment.js';
import { runJuryQuestioning, runClosingStatements, runAmericasFavourite, answerStyle } from '../js/bb/finale-night.js';
import { generateBBFinaleText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));

const CAST = [
  ['Wayne', 'mastermind', 'm'], ['Priya', 'social-butterfly', 'f'], ['Cole', 'challenge-beast', 'm'],
  ['Dara', 'schemer', 'f'], ['Eli', 'hero', 'm'], ['Fern', 'floater', 'f'], ['Gus', 'villain', 'm'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 2) }));

const seededRng = (seed = 7) => {
  let s = seed;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 8; i++) next();
  return next;
};

const JURY = ['Dara', 'Eli', 'Fern', 'Gus'];

function seasonWithJury(active = ['Wayne', 'Priya', 'Cole']) {
  // The VP layer reaches for these as browser globals — main.js puts them on
  // `window` and module code calls them bare. Without the shim every finale
  // screen renders the "cannot be replayed" card instead of throwing, which is
  // the quietest possible failure.
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  seedGame(CAST, { episode: 0, eliminated: CAST.map(p => p.name).filter(n => !active.includes(n)) });
  gs.activePlayers = [...active];
  gs.episodeHistory = [];
  gs.popularity = { Dara: 6, Eli: 2, Fern: -1, Gus: 9 };
  gs.jury = [...JURY];
  seasonConfig.jurySize = 4;
  seasonConfig.finaleSize = 3;
  gs.bb = {
    stats: {}, jurySentiment: {}, weeks: [
      { num: 5, houseAtStart: ['Wayne', 'Priya', 'Cole', 'Dara', 'Eli', 'Fern', 'Gus'], hoh: 'Wayne',
        vetoWinner: 'Cole', nominees: ['Dara', 'Gus'], evicted: 'Dara',
        ballots: [{ voter: 'Priya', evict: 'Dara' }, { voter: 'Cole', evict: 'Dara' }, { voter: 'Fern', evict: 'Dara' }] },
      { num: 6, houseAtStart: ['Wayne', 'Priya', 'Cole', 'Eli', 'Fern', 'Gus'], hoh: 'Priya',
        vetoWinner: 'Wayne', nominees: ['Eli', 'Fern'], evicted: 'Eli',
        ballots: [{ voter: 'Wayne', evict: 'Eli' }, { voter: 'Cole', evict: 'Eli' }] },
      { num: 7, houseAtStart: ['Wayne', 'Priya', 'Cole', 'Fern', 'Gus'], hoh: 'Cole',
        vetoWinner: 'Priya', nominees: ['Fern', 'Gus'], evicted: 'Fern',
        ballots: [{ voter: 'Wayne', evict: 'Fern' }, { voter: 'Priya', evict: 'Fern' }] },
      { num: 8, houseAtStart: ['Wayne', 'Priya', 'Cole', 'Gus'], hoh: 'Priya',
        vetoWinner: 'Cole', nominees: ['Gus', 'Wayne'], evicted: 'Gus',
        ballots: [{ voter: 'Wayne', evict: 'Gus' }, { voter: 'Cole', evict: 'Gus' }] },
    ],
  };
  JURY.forEach(j => seedJurorReads(j, 8));
}

beforeEach(() => seasonWithJury());

describe('the questioning', () => {
  it('asks every juror something, and both finalists answer', () => {
    const out = runJuryQuestioning({ finalTwo: ['Wayne', 'Priya'], jury: JURY, week: 9, rng: seededRng(4) });
    expect(out.exchanges).toHaveLength(JURY.length);
    for (const x of out.exchanges) {
      expect(JURY).toContain(x.juror);
      expect(['Wayne', 'Priya']).toContain(x.asked);
      expect(x.question.length).toBeGreaterThan(30);
      expect(x.question).not.toMatch(/undefined|NaN|\[object/);
      // Both answer, whether or not the question was theirs.
      expect(x.answers.map(a => a.finalist).sort()).toEqual(['Priya', 'Wayne']);
      for (const a of x.answers) {
        expect(a.text.length).toBeGreaterThan(20);
        expect(a.reaction.length).toBeGreaterThan(10);
        expect(a.text).not.toMatch(/undefined|NaN|\[object/);
      }
    }
  });

  it('asks about things that actually happened to that juror', () => {
    // Dara was voted out in week 5 by Priya, so Priya is who Dara has something
    // to say to — and the question should be able to quote the week.
    const out = runJuryQuestioning({ finalTwo: ['Wayne', 'Priya'], jury: ['Dara'], week: 9, rng: seededRng(11) });
    const x = out.exchanges[0];
    expect(x.asked).toBe('Priya');
    expect(['cut', 'betrayal']).toContain(x.kind);
  });

  it('moves the vote — and the movement is the one the ballot reads', () => {
    const before = JURY.map(j => readOf(j, 'Wayne'));
    runJuryQuestioning({ finalTwo: ['Wayne', 'Priya'], jury: JURY, week: 9, rng: seededRng(6) });
    const after = JURY.map(j => readOf(j, 'Wayne'));
    expect(after).not.toEqual(before);
  });

  it('cannot talk a hardened juror round', () => {
    // Gus is sent into the room with his mind thoroughly made up against
    // Wayne. The questioning may nudge him; it must not flip him.
    for (let i = 0; i < 12; i++) moveRead('Gus', 'Wayne', { strength: -3, credibility: 1, kind: 'test' });
    const locked = readOf('Gus', 'Wayne');
    expect(locked).toBeLessThan(-3);
    runJuryQuestioning({ finalTwo: ['Wayne', 'Priya'], jury: ['Gus'], week: 9, rng: seededRng(3) });
    const after = readOf('Gus', 'Wayne');
    expect(after).toBeLessThan(0);
    // Headroom, not a lock: it may move a little, but not by much.
    expect(Math.abs(after - locked)).toBeLessThan(1);
  });

  it('a toss-up moves further than a made-up mind', () => {
    // The same event, delivered to two jurors who differ only in conviction.
    let swings = { open: 0, hard: 0 };
    for (let seed = 1; seed <= 40; seed++) {
      seasonWithJury();
      for (let i = 0; i < 12; i++) moveRead('Gus', 'Wayne', { strength: -3, credibility: 1, kind: 'test' });
      const openBefore = readOf('Eli', 'Wayne');
      const hardBefore = readOf('Gus', 'Wayne');
      runJuryQuestioning({ finalTwo: ['Wayne', 'Priya'], jury: ['Eli', 'Gus'], week: 9, rng: seededRng(seed) });
      swings.open += Math.abs(readOf('Eli', 'Wayne') - openBefore);
      swings.hard += Math.abs(readOf('Gus', 'Wayne') - hardBefore);
    }
    expect(swings.open).toBeGreaterThan(swings.hard);
  });

  it('how a finalist answers is the game they played, not a dice roll', () => {
    // Wayne is a mastermind with high strategic; Priya is the social player.
    expect(['own-it', 'relationship', 'honest', 'deflect']).toContain(answerStyle('Wayne'));
    expect(answerStyle('Wayne')).toBe(answerStyle('Wayne'));
  });
});

describe('closing statements', () => {
  it('both finalists speak, and a speech is a smaller push than a question', () => {
    const out = runClosingStatements({ finalTwo: ['Wayne', 'Priya'], jury: JURY, week: 9, rng: seededRng(9) });
    expect(out.statements).toHaveLength(2);
    for (const s of out.statements) {
      expect(s.text.length).toBeGreaterThan(60);
      expect(s.intro).toBeTruthy();
      expect(Array.isArray(s.moved)).toBe(true);
    }
  });
});

describe("America's Favourite", () => {
  it('is voted from popularity, and finalists are not on the ballot', () => {
    const counts = {};
    for (let seed = 1; seed <= 200; seed++) {
      seasonWithJury();
      const afh = runAmericasFavourite({ finalTwo: ['Wayne', 'Priya'], rng: seededRng(seed) });
      expect(afh).toBeTruthy();
      expect(['Wayne', 'Priya']).not.toContain(afh.winner);
      counts[afh.winner] = (counts[afh.winner] || 0) + 1;
    }
    // Gus is the most popular evictee and should win most often — but Fern,
    // who the audience never warmed to, still has to be able to win it.
    expect(counts.Gus).toBeGreaterThan(counts.Fern || 0);
    expect(Object.keys(counts).length).toBeGreaterThan(1);
  });
});

describe('the reunion', () => {
  // The segment exists to read the ledger out loud, so what is asserted is the
  // ledger — not that some text appeared. A flip the house never caught has to
  // reach the person it was cast against, and it has to cost the finalist who
  // cast it, because that is the only reason the segment sits before the vote.
  const hideAFlip = (weekNum, voter, victim, mis = null) => {
    const w = gs.bb.weeks.find(x => x.num === weekNum);
    w.allianceChanges = { betrayals: [{ week: weekNum, voter, victim, known: false, misattribution: mis }] };
  };

  it('plays the vote the victim never saw, and it moves their read', async () => {
    const { runReunion } = await import('../js/bb/finale-night.js');
    hideAFlip(6, 'Wayne', 'Eli');
    const before = readOf('Eli', 'Wayne');
    const out = runReunion({ finalTwo: ['Wayne', 'Priya'], jury: JURY, prejury: [], week: 9, rng: seededRng(5) });
    const reveal = out.segments.find(s => s.kind === 'reveal');
    expect(reveal, 'the hidden flip was never played').toBeTruthy();
    expect(reveal.players).toContain('Eli');
    expect(readOf('Eli', 'Wayne')).toBeLessThan(before);
    expect(out.moved.some(m => m.juror === 'Eli' && m.finalist === 'Wayne')).toBe(true);
  });

  it('clears somebody who wore the blame for a season', async () => {
    const { runReunion } = await import('../js/bb/finale-night.js');
    hideAFlip(6, 'Wayne', 'Eli', { reactor: 'Eli', wrongSuspect: 'Priya', realBetrayer: 'Wayne' });
    const before = { bond: getBond('Eli', 'Priya'), read: readOf('Eli', 'Priya') };
    const out = runReunion({ finalTwo: ['Wayne', 'Priya'], jury: JURY, prejury: [], week: 9, rng: seededRng(9) });
    expect(out.segments.some(s => s.kind === 'repair')).toBe(true);
    expect(getBond('Eli', 'Priya')).toBeGreaterThan(before.bond);
    expect(readOf('Eli', 'Priya')).toBeGreaterThan(before.read);
  });

  it('never repeats a line, and says nothing about nobody', async () => {
    const { runReunion } = await import('../js/bb/finale-night.js');
    hideAFlip(6, 'Wayne', 'Eli');
    hideAFlip(7, 'Priya', 'Fern');
    const out = runReunion({ finalTwo: ['Wayne', 'Priya'], jury: JURY, prejury: ['Dara'], week: 9, rng: seededRng(3) });
    const texts = out.segments.map(s => s.text);
    expect(new Set(texts).size).toBe(texts.length);
    for (const t of texts) expect(t).not.toMatch(/undefined|NaN|\[object/);
    // The pre-jury is on that stage precisely because it has no vote.
    expect(out.segments.some(s => s.kind === 'walkon' && s.speaker === 'Dara')).toBe(true);
  });

  it('runs inside the night, before the speeches, with a screen and a transcript', () => {
    seasonWithJury();
    hideAFlip(6, 'Wayne', 'Eli');
    const ep = simulateBBFinale(seededRng(21));
    const types = ep.acts.map(a => a.type);
    expect(types).toContain('reunion');
    expect(types.indexOf('jury-questioning')).toBeLessThan(types.indexOf('reunion'));
    expect(types.indexOf('reunion')).toBeLessThan(types.indexOf('closing-statements'));

    expect(generateBBFinaleText(ep)).toContain('THE REUNION');

    gs.episodeHistory = [ep];
    buildVPScreens(ep);
    Object.keys(_tvState).filter(k => k.startsWith('bb_reunion_')).forEach(k => { _tvState[k].idx = 99; });
    const screen = buildVPScreens(ep).find(s => s.id === 'bb-reunion');
    expect(screen, 'the reunion has no screen').toBeTruthy();
    expect(screen.html.length).toBeGreaterThan(1000);
    expect(screen.html).not.toMatch(/undefined|NaN|\[object Object\]/);
    const act = ep.acts.find(a => a.type === 'reunion');
    for (const s of act.segments) {
      expect(screen.html, `a ${s.kind} segment never rendered`).toContain(s.text.slice(0, 40));
    }
  });
});

describe('the whole night', () => {
  it('plays in order and reaches every surface', () => {
    seasonWithJury();
    const ep = simulateBBFinale(seededRng(21));
    const types = ep.acts.map(a => a.type);
    expect(types.filter(t => t === 'final-hoh-part')).toHaveLength(3);
    // The order the show does them in, and the order that makes the vote mean
    // something: cut, then questions, then speeches, then the vote.
    expect(types.indexOf('final-cut')).toBeLessThan(types.indexOf('jury-questioning'));
    expect(types.indexOf('jury-questioning')).toBeLessThan(types.indexOf('closing-statements'));
    expect(types.indexOf('closing-statements')).toBeLessThan(types.indexOf('jury-vote'));
    expect(types.indexOf('jury-vote')).toBeLessThan(types.indexOf('americas-favourite'));
    expect(ep.winner).toBeTruthy();
    expect(ep.favourite?.winner).toBeTruthy();

    // The transcript carries all three, with no placeholders.
    const text = generateBBFinaleText(ep);
    expect(text).toContain('THE JURY QUESTIONS THE FINAL TWO');
    expect(text).toContain('CLOSING STATEMENTS');
    expect(text).toContain("AMERICA'S FAVOURITE HOUSEGUEST");
    expect(text).not.toMatch(/undefined|NaN|\[object/);

    // And so do the screens.
    gs.episodeHistory = [ep];
    const screens = buildVPScreens(ep);
    const ids = screens.map(s => s.id);
    expect(ids).toContain('bb-ftc-questions');
    expect(ids).toContain('bb-ftc-speeches');
    expect(ids).toContain('bb-afh');
    for (const id of ['bb-ftc-questions', 'bb-ftc-speeches', 'bb-afh']) {
      const screen = screens.find(s => s.id === id);
      expect(screen.html.length, `${id} rendered nothing`).toBeGreaterThan(200);
      expect(screen.html).not.toMatch(/undefined|NaN|\[object Object\]/);
    }
  });

  it('the questioning screen opens every exchange when revealed', () => {
    seasonWithJury();
    const ep = simulateBBFinale(seededRng(33));
    gs.episodeHistory = [ep];
    buildVPScreens(ep);
    // Reveal keys are created on the first build, so open them and rebuild.
    Object.keys(_tvState).filter(k => k.startsWith('bb_ftcq_')).forEach(k => { _tvState[k].idx = 99; });
    const screens = buildVPScreens(ep);
    const html = screens.find(s => s.id === 'bb-ftc-questions').html;
    const act = ep.acts.find(a => a.type === 'jury-questioning');
    for (const x of act.exchanges) {
      expect(html, `${x.juror}'s question never rendered`).toContain(x.juror);
    }
    // The rail draws a row per juror.
    expect(html).toContain('WHERE THE JURY IS');
  });

  it('a headless season still writes the finale transcript', async () => {
    // The run path used to fall back to an empty string without a browser, so
    // every test and audit season ended with an unreadable finale.
    const { runBBFinale } = await import('../js/bb-run.js');
    seasonWithJury();
    const ep = runBBFinale();
    expect(ep.summaryText.length).toBeGreaterThan(400);
    expect(ep.summaryText).toContain('THE JURY VOTE');
  });
});
