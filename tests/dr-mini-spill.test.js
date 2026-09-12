// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-mini-spill.test.js — Spill the T: the room answers a question about itself
// ══════════════════════════════════════════════════════════════════════
//
// Every other mini in this show is a queen doing a thing and being scored on
// how well she did it. This one is not. The host asks a superlative — who is
// the next to go home — every queen answers, and the queens who answered with
// the MAJORITY take the round. Being right is not the game; knowing what
// everybody else thinks is the game, and that is the only place on this show
// where reading the room is the skill being tested.
//
// The drama is the read-out. A queen finds out, in front of everybody and
// before she has sewn a stitch, that most of her sisters expect her to go
// home. That is what `sting` is for, per question, and it is why the segment
// must reach a screen: a mini that scores correctly and renders nothing is
// this repo's oldest bug class.
import { describe, expect, it } from 'vitest';
import { runMini } from '../js/dr/mini.js';
import { miniById, MINI_TYPES } from '../js/dr/data/minis.js';
import { SPILL_QUESTIONS, spillRounds } from '../js/dr/data/spill.js';
import { MAXI_EVENTS } from '../js/dr/data/maxi-events.js';
import { CHALLENGE_BEATS } from '../js/dr/data/challenge-beats.js';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens, sceneSections } from '../js/vp-dr/screens.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const castOf = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'floater', age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};
const asMap = list => Object.fromEntries(list.map(p => [p.name, p]));
const play = (seed = 77) => playDragSeason({
  cast: castOf(12, 555), seed,
  config: { drSchedule: [{ episode: 3, miniId: 'spill-the-t' }] },
  bond: () => 0, addBond: () => {}, popDelta: () => {},
});
const spillRow = (seed = 77) =>
  play(seed).rows.find(r => r.dr?.mini?.id === 'spill-the-t') || null;

describe('the questions', () => {
  it('every question reads the room off something the room can see', () => {
    const players = asMap(castOf(8, 5));
    const living = Object.keys(players);
    const ctx = { record: { Q1: ['WIN'], Q3: ['BTM2'] }, players,
      bond: () => 0, living, voter: 'Q1' };
    for (const q of SPILL_QUESTIONS) {
      expect(typeof q.prompt, q.id).toBe('string');
      expect(q.prompt.endsWith('?'), `${q.id} is not a question`).toBe(true);
      expect(q.sting >= 0 && q.sting <= 1, `${q.id} sting out of range`).toBe(true);
      /* A read must SEPARATE the room. A question that scores everybody the
         same is not a read, it is a coin flip wearing one — and it would make
         the round's plurality an artefact of the noise draw. */
      const seen = living.filter(o => o !== 'Q1').map(o => q.reads(o, ctx));
      for (const v of seen) expect(Number.isFinite(v), `${q.id} scored NaN`).toBe(true);
      expect(new Set(seen).size, `${q.id} cannot tell the room apart`).toBeGreaterThan(1);
    }
  });

  it('asks a different set every time and never repeats inside one game', () => {
    const players = asMap(castOf(10, 9));
    const living = Object.keys(players);
    const seen = new Set();
    for (let s = 1; s <= 12; s++) {
      const res = runMini({ living, mini: miniById('spill-the-t'), players,
        rng: rngFor(s * 13), bond: () => 0, record: {} });
      const ids = res.spill.map(r => r.question);
      expect(ids.length, 'wrong round count').toBe(spillRounds(living.length));
      expect(new Set(ids).size, 'asked the same question twice').toBe(ids.length);
      seen.add(ids.join('/'));
    }
    expect(seen.size, 'every game asks the same four questions').toBeGreaterThan(1);
  });
});

describe('the scoring is consensus, not correctness', () => {
  it('pays the queens who voted with the room', () => {
    const players = asMap(castOf(9, 21));
    const living = Object.keys(players);
    const res = runMini({ living, mini: miniById('spill-the-t'), players,
      rng: rngFor(404), bond: () => 0, record: { Q2: ['BTM2', 'LOW'], Q5: ['WIN'] } });
    /* The winner is whoever matched the room most often. Not the most
       popular, not the best read — the closest to the majority, every time. */
    const best = Math.max(...living.map(n => res.detail[n].matched));
    expect(res.detail[res.winner].matched, 'the winner did not match the room most')
      .toBe(best);
    for (const n of living) {
      expect(res.detail[n].of, `${n} was scored over the wrong round count`)
        .toBe(res.spill.length);
      expect(res.detail[n].matched).toBeLessThanOrEqual(res.spill.length);
    }
    /* And the tally has to agree with the ballots it came from — the two are
       computed once each and drawn separately, so a screen can show a bar
       chart that disagrees with who was named. */
    for (const r of res.spill) {
      const counted = {};
      for (const t of Object.values(r.votes)) counted[t] = (counted[t] || 0) + 1;
      expect(r.tally, 'the tally is not the ballots').toEqual(counted);
      expect(r.count, 'the named count is not her tally').toBe(r.tally[r.named]);
      expect(Math.max(...Object.values(r.tally)), 'the room named a runner-up')
        .toBe(r.count);
    }
  });
});

describe('being named costs something', () => {
  it('charges a stinging question and lets a kind one go', () => {
    const players = asMap(castOf(10, 31));
    const living = Object.keys(players);
    const res = runMini({ living, mini: miniById('spill-the-t'), players,
      rng: rngFor(88), bond: (a, b) => ((a.length + b.length) % 7) - 3,
      record: { Q3: ['BTM2', 'BTM2'], Q7: ['WIN', 'HIGH'] } });
    const byQ = Object.fromEntries(SPILL_QUESTIONS.map(q => [q.id, q]));
    const named = res.events.filter(e => e.type === 'named-by-the-room');
    for (const e of named) {
      expect(byQ[e.data.question].sting, 'a compliment was charged for')
        .toBeGreaterThanOrEqual(0.5);
      expect(Object.values(e.pop)[0], 'being named cost nothing').toBeLessThan(0);
      /* The accusers are on the same event as the bond hits, one card for
         one round — six identical cards is the beat printed six times. */
      expect(e.players.length - 1, 'the accusers are not on the event')
        .toBe(e.bond.length);
      for (const [, to] of e.bond) expect(to).toBe(e.players[0]);
    }
    for (const r of res.spill) {
      if (byQ[r.question].sting >= 0.5) {
        expect(named.some(e => e.data.question === r.question),
          `${r.question} stings and charged nobody`).toBe(true);
      }
    }
  });

  it('gives a card only to the friend who said it', () => {
    /* Every accuser pays a bond; only one of them is a SCENE, and only when
       she was actually close. A stranger naming her is the room, which the
       event above already is. */
    const players = asMap(castOf(10, 41));
    const living = Object.keys(players);
    const far = runMini({ living, mini: miniById('spill-the-t'), players,
      rng: rngFor(5), bond: () => -4, record: {} });
    expect(far.events.some(e => e.type === 'named-her-to-her-face'),
      'a room that hates her produced a betrayal card').toBe(false);
    const close = runMini({ living, mini: miniById('spill-the-t'), players,
      rng: rngFor(5), bond: () => 6, record: {} });
    const faces = close.events.filter(e => e.type === 'named-her-to-her-face');
    expect(faces.length, 'nobody was close enough to hurt her').toBeGreaterThan(0);
    for (const r of close.spill) {
      expect(faces.filter(e => e.data.question === r.question).length,
        'more than one betrayal card in one round').toBeLessThanOrEqual(1);
    }
  });
});

describe('the segment reaches a screen', () => {
  it('renders the question, the count and the queen the room named', () => {
    const row = spillRow();
    expect(row, 'the mini was never scheduled').toBeTruthy();
    const rounds = row.dr.mini.rounds || [];
    expect(rounds.length, 'the rounds never reached the row').toBeGreaterThan(0);
    const votes = row.dr.scenes.filter(s => s.kind === 'chal:mini-vote');
    expect(votes.length, 'the rounds reached no scene').toBe(rounds.length);
    /* NOBODY PERFORMS IN THIS ONE. The per-queen attempt loop is what every
       other mini renders, and running it here would print thirteen cards
       about a performance that did not happen. */
    expect(row.dr.scenes.filter(s => s.kind === 'chal:mini-attempt').length,
      'a vote mini rendered performance cards').toBe(0);
    window._tvState = {};
    const screen = dragScreens(row).find(s => /Mini/i.test(s.label || ''));
    expect(screen, 'no mini screen').toBeTruthy();
    for (const r of rounds) {
      expect(screen.html.includes(r.prompt.slice(0, 28)),
        `the screen never asked "${r.prompt}"`).toBe(true);
      expect(screen.html)
        .toContain(`${r.count} of ${Object.keys(r.votes).length} said her name`);
    }
    /* The bar chart is drawn from the engine's own tally, so one bar per
       queen who got a vote and no invented rows. */
    // The ATTRIBUTE, not the class name: the stylesheet is in the same
    // string and mentions the selector five times.
    const bars = (screen.html.match(/class="dr-tal-b"/g) || []).length;
    expect(bars, 'the tally drew the wrong number of bars')
      .toBe(rounds.reduce((a, r) => a + Object.keys(r.tally).length, 0));
  });

  it('files the whole segment on the mini screen and nowhere else', () => {
    const row = spillRow();
    if (!row) return;
    const sections = sceneSections(row);
    const mini = new Set((sections.get('dr-mini') || []).map(s => s.kind));
    expect(mini.has('chal:mini-vote'), 'the vote cards left the mini screen').toBe(true);
    for (const [id, list] of sections) {
      if (id === 'dr-mini') continue;
      expect(list.some(s => s.kind === 'chal:mini-vote'),
        `a vote card leaked onto ${id}`).toBe(false);
    }
  });

  it('still announces the mini and still names the winner', () => {
    const row = spillRow();
    if (!row) return;
    const kinds = row.dr.scenes.filter(s => s.step === 'mini').map(s => s.kind);
    expect(kinds).toContain('chal:mini-announce');
    expect(kinds).toContain('chal:mini-win');
    expect(kinds.indexOf('chal:mini-announce'), 'the rounds ran before the announcement')
      .toBeLessThan(kinds.indexOf('chal:mini-vote'));
    expect(kinds.lastIndexOf('chal:mini-vote'), 'the winner was named mid-game')
      .toBeLessThan(kinds.indexOf('chal:mini-win'));
  });
});

describe('the pieces the writing still needs', () => {
  /* These ship EMPTY on purpose — an unwritten pool emits no scene, so the
     segment is smaller today rather than broken. This checks they are
     REGISTERED, which is the half that cannot be added later without somebody
     noticing the events fire into nothing. */
  it('registers the three consequences as events', () => {
    for (const id of ['named-by-the-room', 'named-her-to-her-face',
      'nobody-said-her-name']) {
      const spec = MAXI_EVENTS.find(e => e.id === id);
      expect(spec, `${id} fires and is not in the catalogue`).toBeTruthy();
      expect(spec.from, `${id} is not filed with the mini`).toBe('mini');
      expect(spec.note.length, `${id} has no brief for the writer`).toBeGreaterThan(40);
    }
  });

  it('registers the reaction beat with a tier per level of sting', () => {
    const beat = CHALLENGE_BEATS.find(b => b.id === 'mini-named');
    expect(beat, 'the reaction beat is missing').toBeTruthy();
    expect(beat.tiers.map(t => t.id)).toEqual(['brutal', 'pointed', 'harmless']);
    for (const t of beat.tiers) {
      expect(t.note.length, `${t.id} has no brief`).toBeGreaterThan(40);
    }
  });

  it('is in the catalogue with a description that explains the game', () => {
    const m = MINI_TYPES.find(x => x.id === 'spill-the-t');
    expect(m, 'the mini is not registered').toBeTruthy();
    expect(m.interaction).toBe('vote');
    expect(m.desc.length, 'the desc does not explain how it works')
      .toBeGreaterThan(200);
    /* The win condition, said outright — the rule CLAUDE.md holds every
       challenge to, and the one a consensus game most needs, because
       "whoever voted with the majority wins" is not what anybody assumes. */
    expect(/majority|with the room|most rounds/i.test(m.desc),
      'the desc never says how you win it').toBe(true);
  });
});
