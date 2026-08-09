// The competition that is secretly three competitions.
//
// BB27's Secret Power Competition, and the reason it is not another
// Whacktivity: a Whacktivity is a separate room you walk into and risk nothing
// to enter. This one IS the week's Head of Household. The wiki's own sentence
// is the design — "everyone else was able to go for a power OR the HOH" — so
// chasing a secret means not chasing the crown, decided blind, in a yard where
// everybody can see which way you are facing.
//
// The cost has to be real or the twist is decoration: somebody must be able to
// post the best score of the afternoon and not be Head of Household.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig, setGs, setPlayers } from '../js/core.js';
import { BB_POWER_DEFINITIONS, expiryFor } from '../js/bb/powers.js';
import { runSecretPowerComp, SECRET_POWER_DOORS } from '../js/bb/secret-power.js';

const HOUSE = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay', 'gus', 'hana'];
const DOORS = ['hoh-interrogation', 'mystery-competitor', 'mystery-veto'];

/** A finished Head of Household board, best first. */
const board = (order = HOUSE) => order.map(name => ({ name, score: 10 - order.indexOf(name) }));

const seeded = seed => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

beforeEach(() => {
  setPlayers(HOUSE.map((name, i) => ({
    name, archetype: 'floater',
    stats: {
      physical: i < 3 ? 8 : 3, endurance: i < 3 ? 8 : 3,
      mental: 5, social: 5, strategic: i < 3 ? 3 : 8, loyalty: 5,
      boldness: 5, intuition: i < 3 ? 3 : 8, temperament: 5,
    },
  })));
  setGs({ bb: { weeks: [], powers: [], outgoingHoh: null }, activePlayers: [...HOUSE] });
  seasonConfig.jurySize = 7;
});

describe('the three powers exist and expire', () => {
  it('added the ones the season did not already have', () => {
    for (const id of DOORS) {
      expect(BB_POWER_DEFINITIONS[id], `${id} is not on the shelf`).toBeTruthy();
      expect(BB_POWER_DEFINITIONS[id].blurb.length).toBeGreaterThan(30);
    }
  });

  it('kills them when the jury opens, not after a fixed count', () => {
    // The expiry is why they are allowed to be this strong: a power that
    // rewrites a Head of Household is a fun week in week three and decides a
    // season in week ten.
    const def = BB_POWER_DEFINITIONS['hoh-interrogation'];
    expect(def.windowUntil).toBe('jury');
    // WHICHEVER COMES FIRST, which is the actual rule and not what this test
    // said on its first draft. Jury opens at jurySize + 2 = 9.
    //
    // Early, the six-week window is the tighter of the two: a house of 16 has
    // seven evictions to go, so the jury clause is not yet doing anything.
    gs.activePlayers = Array.from({ length: 16 }, (_, i) => `p${i}`);
    expect(expiryFor(def, 2)).toBe(2 + def.windowWeeks - 1);
    // Late, the jury is what bites — one eviction from the line, the power is
    // good for this week and no further, six-week window or not.
    gs.activePlayers = Array.from({ length: 10 }, (_, i) => `p${i}`);
    expect(expiryFor(def, 5)).toBe(5);
    // And granted after the jury has already opened, it is dead on arrival.
    gs.activePlayers = Array.from({ length: 8 }, (_, i) => `p${i}`);
    expect(expiryFor(def, 9)).toBeLessThan(9);
  });

  it('leaves a power with no jury clause alone', () => {
    const def = BB_POWER_DEFINITIONS['coup-d-etat'];
    expect(def.windowUntil).toBeUndefined();
    expect(expiryFor(def, 3)).toBe(3 + def.windowWeeks - 1);
  });
});

describe('running it inside the Head of Household', () => {
  const run = (over = {}) => runSecretPowerComp({
    week: { num: 2 }, house: HOUSE, results: board(), offered: DOORS,
    rng: seeded(11), ...over,
  });

  it('hands out the powers behind the doors that were entered', () => {
    const out = run();
    expect(out, 'the competition declined to run').toBeTruthy();
    expect(out.granted.length, 'nobody won anything').toBeGreaterThan(0);
    for (const g of out.granted) expect(DOORS).toContain(g.power);
    // Granted in secret: the whole twist is that the house is told nothing.
    for (const p of gs.bb.powers) expect(p.visibility).toBe('secret');
  });

  it('crowns somebody who was actually running for the crown', () => {
    const out = run();
    if (!out.winner) return; // a week where everybody gambled is legal
    expect(out.chased.map(c => c.name), 'the Head of Household was chasing a door')
      .not.toContain(out.winner);
  });

  it('lets the best score in the yard lose the week', () => {
    // The cost, and the only thing that makes the choice a choice. Forced by
    // making the top finisher the outgoing HOH — barred from the crown, so
    // playing for a power is all they can do.
    const out = run({ outgoingHoh: 'ana' });
    expect(out.chased.map(c => c.name), 'the barred player was not chasing anything')
      .toContain('ana');
    expect(out.winner, 'the best finisher still took the crown').not.toBe('ana');
  });

  it('puts an unentered power back in the box', () => {
    // One door and a house that mostly wants the crown: the rooms that nobody
    // walked into produce no winner and no grant.
    const out = run({ offered: DOORS, rng: seeded(3) });
    for (const room of out.rooms) {
      if (!room.entrants.length) expect(room.winner).toBe(null);
    }
    expect(gs.bb.powers.length).toBe(out.granted.length);
  });

  it('never opens more doors than the show did', () => {
    const out = run({ offered: [...DOORS, 'the-cloud', 'diamond-veto'] });
    expect(out.doors.length).toBeLessThanOrEqual(SECRET_POWER_DOORS);
  });

  it('declines rather than half-running', () => {
    expect(runSecretPowerComp({ week: { num: 2 }, house: HOUSE, offered: [] })).toBe(null);
    expect(runSecretPowerComp({ week: { num: 2 }, house: ['a', 'b'], offered: DOORS })).toBe(null);
    // An unknown id is not a door.
    expect(runSecretPowerComp({ week: { num: 2 }, house: HOUSE, offered: ['nonsense'] })).toBe(null);
  });

  it('says out loud what the gamble cost', () => {
    const out = run({ outgoingHoh: 'ana' });
    const text = out.beats.map(b => b.text).join(' ');
    expect(text).toMatch(/not the Head of Household|nothing to lose|private win/i);
  });
});

describe('the week wires it into the crown', () => {
  it('reads the winner off the secret competition when it ran', () => {
    const src = require('node:fs').readFileSync('js/bb/week.js', 'utf8');
    // The crown comes from the people who wanted it, not from the raw board.
    expect(src).toMatch(/\|\| \(secretPowers\?\.winner\)/);
    // And it runs off the board that already exists rather than a second comp.
    expect(src).toMatch(/results: hohResults/);
  });

  it('is authored with the same door control as the Whacktivity', () => {
    // Two channels asking one authoring question. A second, slightly different
    // dropdown is how two channels drift apart.
    const ui = require('node:fs').readFileSync('js/run-ui.js', 'utf8');
    expect(ui).toMatch(/t\.type === 'bb-whacktivity' \|\| t\.type === 'bb-secret-power-comp'/);
  });
});

describe('the week where nobody goes home', () => {
  // `cancelEviction` has been in BASE_WEEK_RULES since the contract was
  // written and the Halting Hex has been declaring it ever since — and nothing
  // had ever read it. So the Hex was a power that granted, expired, and did
  // nothing, and there was no way to author a no-eviction week at all.
  const fs = require('node:fs');

  it('is a rule the week actually reads now', () => {
    const src = fs.readFileSync('js/bb/week.js', 'utf8');
    expect(src, 'cancelEviction is still declared and never consulted')
      .toMatch(/week\.twistState\?\.rules\?\.cancelEviction/);
  });

  it('stops before the ceremony rather than after the vote', () => {
    // It cancels nominations, the veto AND the eviction. Stopping later would
    // run a block and a veto for a week that cannot evict anybody.
    const src = fs.readFileSync('js/bb/week.js', 'utf8');
    const gate = src.indexOf('week.twistState?.rules?.cancelEviction');
    const noms = src.indexOf('let duoWeekNoms = null;');
    expect(gate).toBeGreaterThan(-1);
    expect(gate, 'the gate runs after nominations have already happened')
      .toBeLessThan(noms);
  });

  it('leaves the crown standing, so it can pair with the power competition', () => {
    // The whole point of pairing them: an episode whose only outcome is who
    // walked away holding something. If the gate ran before the Head of
    // Household, there would be nothing to hide the powers inside.
    const src = fs.readFileSync('js/bb/week.js', 'utf8');
    const hoh = src.indexOf("runBBCompetition({ type:'hoh'");
    const secret = src.indexOf('runSecretPowerComp({');
    const gate = src.indexOf('week.twistState?.rules?.cancelEviction');
    expect(hoh).toBeLessThan(gate);
    expect(secret).toBeLessThan(gate);
  });

  it('declares the rules in the vocabulary the rest of the week reads', () => {
    const contract = fs.readFileSync('js/bb/twist-contract.js', 'utf8');
    const at = contract.indexOf("'bb-no-eviction'");
    expect(at, 'the twist does not exist').toBeGreaterThan(-1);
    const block = contract.slice(at, at + 900);
    expect(block).toMatch(/cancelEviction: true/);
    expect(block).toMatch(/nomineeCount: 0/);
    expect(block).toMatch(/vetoCount: 0/);
  });

  it('is counted by the timeline as a week nobody leaves', () => {
    // Or the projection is wrong from that week to the finale, which is the
    // fault this season's timeline has already had twice.
    const run = fs.readFileSync('js/run-ui.js', 'utf8');
    expect(run).toMatch(/_allTypes\.includes\('bb-no-eviction'\)\) elims = 0;/);
  });

  it('cannot be scheduled with a week that evicts twice', () => {
    const core = fs.readFileSync('js/core.js', 'utf8');
    const at = core.indexOf("id:'bb-no-eviction'");
    const block = core.slice(at, at + 1600);
    expect(block).toMatch(/bb-double-eviction/);
    expect(block).toMatch(/bb-instant-eviction/);
  });
});

describe('both new acts reach both transcripts', () => {
  // The act-coverage guard plays seasons and reports acts that fire and are
  // never written down — but it can only see twists its seasons actually
  // scheduled, so a new one is UNTESTED there rather than passing. Asserted
  // directly instead of waiting to find out.
  const fs = require('node:fs');
  const run = fs.readFileSync('js/bb-run.js', 'utf8');
  const backlog = fs.readFileSync('js/text-backlog.js', 'utf8');

  for (const act of ['secret-power-comp', 'no-eviction']) {
    it(`${act} is written by summariseWeek`, () => {
      expect(run, `summariseWeek drops ${act}`).toMatch(new RegExp(`case '${act}'`));
    });
    it(`${act} is written by the text backlog`, () => {
      expect(backlog, `the backlog drops ${act}`).toMatch(new RegExp(`case '${act}'`));
    });
  }

  it('says who won what in the secret competition', () => {
    // A transcript that records "a competition happened" and not its result is
    // the same as not recording it.
    const at = run.indexOf("case 'secret-power-comp'");
    expect(run.slice(at, at + 900)).toMatch(/r\.winner/);
    const bAt = backlog.indexOf("case 'secret-power-comp'");
    expect(backlog.slice(bAt, bAt + 1200)).toMatch(/r\.winner/);
  });
});

describe('who knows who is holding what', () => {
  // This is not the first twist to hand out a power in secret — the
  // Whacktivity, Pandora's Box, the Den of Temptation and Something In This
  // House have all been doing it — and none of them recorded who knew. So "who
  // has the power" was not a fact the house could hold, be wrong about, or find
  // out. It was nowhere at all.
  //
  // Recorded on `grantPower` rather than in any one module: five callers
  // granting secretly is five places to forget, and the sixth would have too.
  it('records every grant, whichever twist made it', async () => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { believesPowerHeld } = await import('../js/bb/knowledge.js');
    setGs({ bb: { weeks: [], powers: [] }, activePlayers: [...HOUSE] });
    grantPower('the-cloud', 'ana', { week: 2, visibility: 'secret', source: 'bb-whacktivity' });
    expect(believesPowerHeld('ana', 'ana', 'the-cloud'), 'the holder does not know')
      .toBe(true);
  });

  it('tells nobody when the grant was secret', async () => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { believesPowerHeld } = await import('../js/bb/knowledge.js');
    setGs({ bb: { weeks: [], powers: [] }, activePlayers: [...HOUSE] });
    grantPower('the-cloud', 'ana', { week: 2, visibility: 'secret', source: 'x' });
    for (const other of HOUSE.filter(n => n !== 'ana')) {
      expect(believesPowerHeld(other, 'ana', 'the-cloud'), `${other} should not know`)
        .toBe(false);
    }
  });

  it('tells the house when the grant was public', async () => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { believesPowerHeld } = await import('../js/bb/knowledge.js');
    setGs({ bb: { weeks: [], powers: [] }, activePlayers: [...HOUSE] });
    grantPower('the-cloud', 'ben', { week: 2, visibility: 'public', source: 'x' });
    expect(believesPowerHeld('ana', 'ben', 'the-cloud'), 'a public grant was kept secret')
      .toBe(true);
  });

  it('keeps the holder secret when only the POWER is public', async () => {
    // `holder-secret` means the house knows something is out there and not who
    // has it — which is a different fact, and the distinction the Hacker and
    // the Invisible HOH are built on.
    const { grantPower } = await import('../js/bb/powers.js');
    const { believesPowerHeld } = await import('../js/bb/knowledge.js');
    setGs({ bb: { weeks: [], powers: [] }, activePlayers: [...HOUSE] });
    grantPower('the-cloud', 'cleo', { week: 2, visibility: 'holder-secret', source: 'x' });
    expect(believesPowerHeld('ana', 'cleo', 'the-cloud')).toBe(false);
    expect(believesPowerHeld('cleo', 'cleo', 'the-cloud')).toBe(true);
  });

  it('can be told, and the listener can fail to believe it', async () => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { learnBBPower, believesPowerHeld } = await import('../js/bb/knowledge.js');
    setGs({ bb: { weeks: [], powers: [] }, activePlayers: [...HOUSE] });
    grantPower('the-cloud', 'ana', { week: 2, visibility: 'secret', source: 'x' });
    learnBBPower('ben', 'ana', 'the-cloud', { from: 'ana', week: 2, confidence: 1, rng: () => 0 });
    expect(believesPowerHeld('ben', 'ana', 'the-cloud')).toBe(true);
    // And a rumour about a power nobody holds does not become one.
    expect(learnBBPower('ben', 'cleo', 'diamond-veto', { week: 2 })).toBe(false);
  });

  it('is not load-bearing for the grant itself', () => {
    // A power that fails to record who knows is still a power. The grant must
    // not be lost to a knowledge-store problem.
    const src = require('node:fs').readFileSync('js/bb/powers.js', 'utf8');
    expect(src).toMatch(/try \{ recordBBPower\(/);
  });
});

describe('the screen', () => {
  // Rendered with real data rather than asserted about, because a VP builder
  // that throws produces an empty screen and every structural test still
  // passes. Built to mockup-secret-power.html, which stays in the repo as the
  // visual target.
  const ACT = {
    type: 'secret-power-comp', week: 2,
    doors: ['hoh-interrogation', 'mystery-veto', 'mystery-competitor'],
    rooms: [
      { power: 'hoh-interrogation', name: 'The Interrogation', entrants: ['Ripper', 'Scary'], winner: 'Ripper' },
      { power: 'mystery-veto', name: 'The Mystery Veto', entrants: ['Zee'], winner: 'Zee' },
      { power: 'mystery-competitor', name: 'The Mystery Competitor', entrants: [], winner: null },
    ],
    winner: 'Nichelle',
    granted: [{ name: 'Ripper', power: 'hoh-interrogation' }, { name: 'Zee', power: 'mystery-veto' }],
    chased: [{ name: 'Ripper', power: 'hoh-interrogation' },
      { name: 'Scary', power: 'hoh-interrogation' }, { name: 'Zee', power: 'mystery-veto' }],
    results: [{ name: 'Ripper', score: 412 }, { name: 'Nichelle', score: 388 },
      { name: 'Scary', score: 371 }, { name: 'Axel', score: 344 }, { name: 'Zee', score: 330 }],
    house: ['Ripper', 'Nichelle', 'Scary', 'Axel', 'Zee', 'Brightly'],
    outgoingHoh: 'Zee',
    // Door-tagged, because a door now opens on its own card — a beat with no
    // door opens nothing, which is what the first version of these tests was
    // silently asserting about.
    beats: [
      { text: 'The yard is not what it looks like.', players: ['Ripper'],
        badgeText: 'SOMETHING ELSE', badgeClass: 'gold' },
      { text: 'Ripper took it.', players: ['Ripper'], badgeText: 'A PRIVATE WIN',
        badgeClass: 'gold', door: 'hoh-interrogation' },
      { text: 'Zee took it.', players: ['Zee'], badgeText: 'A PRIVATE WIN',
        badgeClass: 'gold', door: 'mystery-veto' },
      { text: 'Nobody took the third.', players: [], badgeText: 'UNCLAIMED',
        badgeClass: 'grey', door: 'mystery-competitor' },
    ],
  };
  const render = idx => {
    const tv = {};
    const deps = { tvState: tv, reveal: () => 'x', esc: v => String(v ?? ''),
      avatar: (n, px) => `<img alt="" data-n="${n}" width="${px}">` };
    const { rpBuildBBSecretPowerComp } = require('../js/vp-bb-secret-power.js');
    const first = rpBuildBBSecretPowerComp({ num: 2 }, ACT, deps);
    if (idx == null) return first;
    tv['bb_spc_2'].idx = idx;
    return rpBuildBBSecretPowerComp({ num: 2 }, ACT, deps);
  };

  it('opens sealed, so the screen is a competition and not its answer', () => {
    const html = render(null);
    // Every door shut, and no stamp anywhere, until something is revealed.
    expect((html.match(/class="bbsp-door is-sealed"/g) || []).length).toBe(3);
    expect(html, 'the doors were open before anybody revealed anything')
      .not.toContain('Void when');
  });

  it('strikes through everybody who was never running for the crown', () => {
    // The twist in one visual: the best afternoon in the yard, and not the
    // Head of Household.
    const html = render(99);
    expect(html).toContain('is-elsewhere');
    expect(html).toContain('not running');
  });

  it('stamps the expiry on the documents', () => {
    expect(render(99)).toContain('Void when');
  });

  it('shows the door nobody walked to', () => {
    const html = render(99);
    expect(html).toContain('is-unclaimed');
    expect(html).toMatch(/without ever knowing it was out there/);
  });

  it('says who knows and who only walked past', () => {
    const html = render(99);
    expect(html).toContain('Holds');
    expect(html, 'a suspicion is drawn the same as knowledge')
      .toContain('Walked a door');
  });

  it('puts faces on it', () => {
    // Asked for directly, and the reason `avatar` is threaded through deps.
    expect((render(99).match(/<img/g) || []).length).toBeGreaterThan(8);
  });

  it('is registered, or it renders nowhere', () => {
    const src = require('node:fs').readFileSync('js/vp-screens.js', 'utf8');
    expect(src).toMatch(/case 'secret-power-comp':/);
    expect(src).toMatch(/rpBuildBBSecretPowerComp\(view, act, spDeps\)/);
  });
});

describe('the powers actually fire', () => {
  // They were granted, tracked, expiring at the jury — and doing nothing. A
  // houseguest could trade the best week of their game for one and no rule
  // would change, which is the same "written and unreachable" fault the Halting
  // Hex sat in for months.
  const BIG = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay', 'gus', 'hana', 'iris', 'jo'];
  const arm = async powerId => {
    const { grantPower } = await import('../js/bb/powers.js');
    setPlayers(BIG.map(name => ({
      name, archetype: 'floater', gender: 'f',
      stats: { physical: 6, endurance: 6, mental: 6, social: 6, strategic: 6,
        loyalty: 5, boldness: 9, intuition: 8, temperament: 5 },
    })));
    // Jury opens at jurySize + 2, so a ten-house with a five-jury is safely
    // pre-jury. The first version of this used a house of six against a jury of
    // seven — already PAST the line — and every power expired on the day it was
    // granted. Nothing fired, and the rule was right.
    seasonConfig.jurySize = 5;
    setGs({ bb: { powers: [], weeks: [], stats: {} }, activePlayers: [...BIG], bonds: {} });
    return grantPower(powerId, 'ben', { week: 3, visibility: 'secret', source: 'test' });
  };

  it('the Interrogation takes the crown, and can lose it again', async () => {
    const { playInterrogation } = await import('../js/bb/secret-power-plays.js');
    await arm('hoh-interrogation');
    // A deposed HOH who guesses right keeps the week and the power is wasted.
    const caught = playInterrogation({ week: { num: 3 }, house: BIG, hoh: 'ana', rng: () => 0.01 });
    expect(caught).toBeTruthy();
    expect(caught.caught).toBe(true);
    expect(caught.hoh, 'the deposed HOH did not keep their week').toBe('ana');

    await arm('hoh-interrogation');
    // A deposed HOH who guesses wrong loses it, and never finds out.
    const missed = playInterrogation({ week: { num: 3 }, house: BIG, hoh: 'ana', rng: () => 0.99 });
    expect(missed === null || missed.hoh === 'ben').toBe(true);
  });

  it('the Mystery Competitor only works from the block', async () => {
    const { playMysteryCompetitor } = await import('../js/bb/secret-power-plays.js');
    await arm('mystery-competitor');
    const off = playMysteryCompetitor({ week: { num: 3 }, nominees: ['cleo', 'dev'],
      players: ['cleo', 'dev'], alumni: ['Alejandro'], rng: () => 0.2 });
    expect(off, 'it fired for somebody who was not nominated').toBe(null);

    await arm('mystery-competitor');
    const on = playMysteryCompetitor({ week: { num: 3 }, nominees: ['ben', 'dev'],
      players: ['ben', 'dev', 'eli', 'fay'], alumni: ['Alejandro'], rng: () => 0.2 });
    expect(on).toBeTruthy();
    expect(on.guest).toBe('Alejandro');
    // Buys a body, not a win — and when it wins, the veto goes to the payer.
    expect(on.won ? on.vetoTo : null).toBe(on.won ? 'ben' : null);
  });

  it('the Mystery Veto runs alone, and can be lost alone', async () => {
    const { playMysteryVeto } = await import('../js/bb/secret-power-plays.js');
    await arm('mystery-veto');
    // A win is now a score above par rather than a lucky roll, so the roll only
    // has to be a GOOD run rather than a winning one: `posted` is the holder's
    // own number plus a swing, and par is what the room would have posted.
    const won = playMysteryVeto({ week: { num: 3 }, nominees: ['ben', 'eli'], house: BIG, rng: () => 0.9 });
    expect(won).toBeTruthy();
    expect(won.won).toBe(true);
    expect(won.saves).toBe('ben');

    // Losing is no longer an rng threshold — it is a score against a par, so a
    // loss has to be EARNED by being worse than the room. `ben` is rebuilt weak
    // and everybody else strong.
    await arm('mystery-veto');
    setPlayers(BIG.map(name => ({
      name, archetype: 'floater', gender: 'f',
      stats: {
        physical: name === 'ben' ? 1 : 9, endurance: name === 'ben' ? 1 : 9,
        mental: name === 'ben' ? 1 : 9, social: 5, strategic: 5, loyalty: 5,
        boldness: 5, intuition: 5, temperament: name === 'ben' ? 1 : 9,
      },
    })));
    const lost = playMysteryVeto({ week: { num: 3 }, nominees: ['ben', 'eli'], house: BIG,
      library: [{ id: 'w', name: 'The Wall', types: ['veto'], stats: { endurance: 1 } }],
      rng: () => 0.1 });
    expect(lost).toBeTruthy();
    expect(lost.won, 'the worst player in the house beat the whole house').toBe(false);
    expect(lost.saves).toBe(null);
  });

  it('spends the power whether it worked or not', async () => {
    const { playMysteryVeto } = await import('../js/bb/secret-power-plays.js');
    await arm('mystery-veto');
    playMysteryVeto({ week: { num: 3 }, nominees: ['ben'], house: BIG, rng: () => 0.8 });
    expect(gs.bb.powers[0].used, 'a losing play left the power on the shelf').toBe(true);
  });

  it('is wired into the week at all three timings', () => {
    const src = require('node:fs').readFileSync('js/bb/week.js', 'utf8');
    expect(src).toMatch(/playInterrogation\(\{/);
    expect(src).toMatch(/playMysteryCompetitor\(\{/);
    expect(src).toMatch(/playMysteryVeto\(\{/);
    // And the results are acted on, not just narrated.
    expect(src, 'the usurper never actually becomes HOH').toMatch(/hoh = usurp\.hoh/);
    // Read off the REAL competition now, rather than a private simulation.
    expect(src, 'the alumnus wins and the veto goes nowhere').toMatch(/mysteryCompetitorResult\(\{/);
    expect(src, 'the guest is announced and then never enters the yard')
      .toMatch(/vetoPlayers = \[\.\.\.vetoPlayers, mysteryGuest\.guest\]/);
    // Was pinned to the exact filter expression, which broke the moment the
    // second veto learned to take a whole duo down instead of one name. The
    // record it writes is the stabler contract: it is only ever set on the
    // line after the block actually changes.
    expect(src, 'the second veto never takes anybody off the block')
      .toMatch(/week\.mysteryVetoSaved = solo\.saves/);
    expect(src, 'the second veto still fills its chair out of a hat')
      .toMatch(/chooseReplacement\(hoh, house, protectedNames2/);
  });

  for (const act of ['interrogation', 'mystery-competitor', 'mystery-veto']) {
    it(`${act} reaches both transcripts`, () => {
      const fs = require('node:fs');
      expect(fs.readFileSync('js/bb-run.js', 'utf8')).toMatch(new RegExp(`case '${act}'`));
      expect(fs.readFileSync('js/text-backlog.js', 'utf8')).toMatch(new RegExp(`case '${act}'`));
    });
  }
});

describe('a scheduled twist actually reaches the week', () => {
  // `BB_TWIST_IDS` was a hand-maintained Set, and `bbTwistsForWeek` filters the
  // schedule through it. A twist missing from that list is dropped with no
  // error, no warning and no twist: you schedule it, play the week, and
  // nothing happens — no screen, no power, no line in the transcript, and
  // nothing anywhere saying why.
  //
  // Both twists added this week were invisible for exactly that reason. The
  // set is derived from the catalogue now, which already declares `format`.
  it('lists every Big Brother twist the catalogue has', async () => {
    const { BB_TWIST_IDS } = await import('../js/bb-run.js');
    const { TWIST_CATALOG } = await import('../js/core.js');
    const catalogue = TWIST_CATALOG.filter(c => c?.format === 'big-brother').map(c => c.id);
    expect(catalogue.length).toBeGreaterThan(20);
    for (const id of catalogue) {
      expect(BB_TWIST_IDS.has(id), `${id} is in the catalogue and cannot be scheduled`)
        .toBe(true);
    }
  });

  it('survives being scheduled, which is the thing that was broken', async () => {
    const { bbTwistsForWeek } = await import('../js/bb-run.js');
    seasonConfig.twistSchedule = [
      { id: 'a', episode: 2, type: 'bb-secret-power-comp' },
      { id: 'b', episode: 2, type: 'bb-no-eviction' },
    ];
    seasonConfig.bbHaveNots = 'off';
    const twists = bbTwistsForWeek(2);
    expect(twists).toContain('bb-secret-power-comp');
    expect(twists).toContain('bb-no-eviction');
    seasonConfig.twistSchedule = [];
  });
});

describe('the night runs in the order it happened', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync('js/bb/week.js', 'utf8');

  it('shows the crown before what was hiding inside it', () => {
    // Acts render in push order, and this was pushed where it was COMPUTED —
    // so the powers went on screen before the Head of Household competition
    // that hid them, and a viewer watched people win doors in a competition
    // they had not been shown yet. The coup has a comment about this exact
    // mistake three thousand lines down; it is easy to make and invisible
    // until somebody watches it.
    const crown = src.indexOf("type: 'hoh', winner: hoh");
    const powers = src.indexOf('addBeats(secretPowers');
    expect(crown).toBeGreaterThan(-1);
    expect(powers, 'the powers are still shown before the crown').toBeGreaterThan(crown);
  });

  it('tells the house there are powers in the competition', () => {
    // They have to be told, or nobody could choose which one they were playing
    // for. `secret` suppressed the announcement entirely and the twist ran with
    // the house apparently picking doors nobody had mentioned.
    const contract = fs.readFileSync('js/bb/twist-contract.js', 'utf8');
    const at = contract.indexOf("'bb-secret-power-comp'");
    const block = contract.slice(at, at + 1400);
    expect(block).toMatch(/secrecy: 'holder-secret'/);
    expect(block, 'there is no announcement to read out').toMatch(/announcement: \{/);
  });

  it('is announced, since holder-secret twists are', async () => {
    // The rule the resolver applies: public and holder-secret are announced,
    // fully secret ones are not.
    const { resolveWeekTwistState } = await import('../js/bb/twist-contract.js');
    const state = resolveWeekTwistState(['bb-secret-power-comp']);
    expect(state.announcements.map(a => a.twist)).toContain('bb-secret-power-comp');
  });
});

describe('the doors open one at a time', () => {
  // The whole right-hand column used to arrive on the LAST card, so there was
  // nothing to watch: reveal, reveal, reveal, and then the answer lands in one
  // block. Each door beat carries the door it belongs to, so a door opens on
  // its own card and the board fills in as you go.
  const ACT = {
    type: 'secret-power-comp', week: 2, doors: ['a', 'b', 'c'],
    rooms: [
      { power: 'a', name: 'The Interrogation', entrants: ['Priya'], winner: 'Priya' },
      { power: 'b', name: 'The Mystery Competitor', entrants: ['MK', 'Zee'], winner: 'MK' },
      { power: 'c', name: 'The Mystery Veto', entrants: [], winner: null },
    ],
    winner: 'Raj',
    granted: [{ name: 'Priya', power: 'a' }, { name: 'MK', power: 'b' }],
    chased: [{ name: 'Priya', power: 'a' }, { name: 'MK', power: 'b' }, { name: 'Zee', power: 'b' }],
    results: [{ name: 'Raj', score: 74 }, { name: 'MK', score: 57 },
      { name: 'Zee', score: 50 }, { name: 'Priya', score: 29 }],
    house: ['Raj', 'MK', 'Zee', 'Priya'], outgoingHoh: null,
    beats: [
      { text: 'The yard is not what it looks like.', players: [], badgeText: 'X', badgeClass: 'gold' },
      { text: 'Priya won door a.', players: ['Priya'], badgeText: 'A PRIVATE WIN', badgeClass: 'gold', door: 'a' },
      { text: 'MK won door b.', players: ['MK'], badgeText: 'A PRIVATE WIN', badgeClass: 'gold', door: 'b' },
      { text: 'Nobody took door c.', players: [], badgeText: 'UNCLAIMED', badgeClass: 'grey', door: 'c' },
    ],
  };
  const at = idx => {
    const tv = {};
    const deps = { tvState: tv, reveal: () => 'x', esc: v => String(v ?? ''),
      avatar: n => `<img data-n="${n}">` };
    const { rpBuildBBSecretPowerComp } = require('../js/vp-bb-secret-power.js');
    rpBuildBBSecretPowerComp({ num: 2 }, ACT, deps);
    tv['bb_spc_2'].idx = idx;
    return rpBuildBBSecretPowerComp({ num: 2 }, ACT, deps);
  };
  // Counted on the ELEMENT, not the string: the stylesheet mentions the class
  // three times and a naive count reports three sealed doors on a screen with
  // none.
  const sealed = html => (html.match(/class="bbsp-door is-sealed"/g) || []).length;

  it('starts with every door shut', () => expect(sealed(at(0))).toBe(3));
  it('opens them as their cards are revealed', () => {
    expect(sealed(at(1))).toBe(3);
    expect(sealed(at(2)), 'the first door did not open on its own card').toBe(2);
    expect(sealed(at(3))).toBe(1);
    expect(sealed(at(9))).toBe(0);
  });

  it('strikes a name the moment its door opens, not at the end', () => {
    // Counted on the ELEMENT again. `.bbsp-row.is-elsewhere` is in the
    // stylesheet, so a substring search finds it on a screen with nothing
    // struck — the same trap as the sealed doors, two tests apart.
    const struck = html => (html.match(/class="bbsp-row is-elsewhere"/g) || []).length;
    expect(struck(at(1)), 'struck before the door opened').toBe(0);
    expect(struck(at(2)), 'the board did not answer the door').toBeGreaterThan(0);
  });

  it('does not print the same sentence on all three doors', () => {
    const html = at(9);
    const lines = [...html.matchAll(/class="bbsp-took">(.*?)<\/div>/g)].map(m => m[1]);
    expect(lines.length).toBeGreaterThan(1);
    expect(new Set(lines).size, 'every door says the same thing').toBe(lines.length);
  });

  it('does not print the same beat three times either', async () => {
    // Three doors open on one night, so a single line in the engine printed
    // three near-identical paragraphs with only the name changed — the most
    // obvious tell a room is generated.
    const { runSecretPowerComp } = await import('../js/bb/secret-power.js');
    const flat = Object.fromEntries(['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'].map(k => [k, 5]));
    setPlayers(HOUSE.map(name => ({ name, archetype: 'floater', gender: 'f', stats: { ...flat } })));
    setGs({ bb: { weeks: [], powers: [] }, activePlayers: [...HOUSE] });
    seasonConfig.jurySize = 2;
    const out = runSecretPowerComp({
      week: { num: 2 }, house: HOUSE, results: HOUSE.map((n, i) => ({ name: n, score: 90 - i })),
      offered: ['hoh-interrogation', 'mystery-competitor', 'mystery-veto'],
      // A VARYING rng. A constant one gives every chaser the same door-appeal
      // roll, so the whole yard walks to the same door and exactly one power is
      // won — which measures nothing about repeated sentences.
      rng: (seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; })(9),
    });
    const wins = (out?.beats || []).filter(b => b.badgeText === 'A PRIVATE WIN')
      .map(b => b.text);
    expect(wins.length, 'no doors were won, so this proves nothing').toBeGreaterThan(1);
    expect(new Set(wins).size, 'the same sentence, more than once, with the name changed')
      .toBe(wins.length);
  });
});

describe('the interrogation is a scene, and a decision', () => {
  // The wiki's rule: the deposed Head of Household interrogates EVERY other
  // houseguest, and if they name the right person they keep the week. The
  // drama is in those rooms and not in the verdict, and the first version had
  // three beats and no rooms at all.
  const H = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay', 'gus', 'hana', 'iris', 'jo'];
  const seat = () => {
    setPlayers(H.map((n, i) => ({
      name: n, archetype: 'floater', gender: 'f',
      stats: { physical: 5, endurance: 5, mental: 5, social: 5,
        strategic: i % 3 ? 7 : 4, loyalty: 5, boldness: 8,
        intuition: i % 2 ? 8 : 3, temperament: 5 },
    })));
    seasonConfig.jurySize = 3;
    setGs({ bb: { powers: [], weeks: [], stats: {} }, activePlayers: [...H], bonds: {} });
  };
  const seeded = seed => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const run = async (week = 3, seed = 5) => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { playInterrogation } = await import('../js/bb/secret-power-plays.js');
    seat();
    grantPower('hoh-interrogation', 'ben', { week: 3, visibility: 'secret', source: 'test' });
    return playInterrogation({ week: { num: week }, house: H, hoh: 'ana', rng: seeded(seed) });
  };

  it('asks everybody, which is the rule', async () => {
    const out = await run();
    expect(out, 'it did not fire at all').toBeTruthy();
    expect(out.interviews.map(i => i.name).sort())
      .toEqual(H.filter(n => n !== 'ana').sort());
  });

  it('gets more than one kind of answer out of the house', async () => {
    // Some tell, some cover for a friend, some read it off body language, some
    // guess, some refuse to hand anybody to a Head of Household who might be
    // back in power in ten minutes. One kind of answer is a formality.
    const out = await run();
    const kinds = new Set(out.interviews.map(i => i.kind));
    expect(kinds.size, 'the whole house answered the same way').toBeGreaterThan(2);
    expect(kinds.has('denies'), 'the person who did it was not asked').toBe(true);
  });

  it('plays the rooms, not just the verdict', async () => {
    const out = await run();
    // Dethroned, several interviews, the name, and the outcome.
    expect(out.beats.length).toBeGreaterThan(5);
    const badges = out.beats.map(b => b.badgeText);
    expect(badges).toContain('DETHRONED');
    expect(badges).toContain('THE NAME');
  });

  it('reads the board rather than rolling against boldness', async () => {
    // "Is it good for my game to use this now, or should I wait." The first
    // version rolled against boldness and threw the biggest thing on the shelf
    // at weeks the holder was never in danger in.
    //
    // This used to grep the source for `const safe = worse >= 2`, and that is
    // why it broke the moment the step became a curve: a test that pins the
    // IMPLEMENTATION of a decision fails on every improvement to it and passes
    // on every change that leaves the line intact. What it should have pinned
    // is that being in danger moves the answer, which is what it does now.
    const { grantPower } = await import('../js/bb/powers.js');
    const { playInterrogation } = await import('../js/bb/secret-power-plays.js');
    const { addBond } = await import('../js/bonds.js');
    const rate = async hated => {
      let fired = 0;
      for (let s = 1; s <= 40; s++) {
        seat();
        // Everybody in this house is identical, so the only way to be the
        // likeliest target is to be disliked — which is what nominationScore
        // reads, and what the gate then reads out of it.
        for (const n of H) {
          if (n === 'ben' || n === 'ana') continue;
          addBond('ana', n, hated ? 4 : -4);
        }
        grantPower('hoh-interrogation', 'ben', { week: 3, visibility: 'secret', source: 'test' });
        if (playInterrogation({ week: { num: 3 }, house: H, hoh: 'ana', rng: seeded(s * 31) })) fired++;
      }
      return fired / 40;
    };
    const inDanger = await rate(true);
    const safe = await rate(false);
    expect(inDanger, 'the holder sat on it while being the likeliest name on the board')
      .toBeGreaterThan(0.6);
    expect(inDanger - safe, 'the board makes no difference to the decision')
      .toBeGreaterThan(0.15);
  });

  it('takes the week off somebody to protect an ally, not only itself', async () => {
    // It asked "am I about to go up" and stopped there — so an alliance could
    // watch its own strongest member walk toward the block with a power in the
    // room that takes the whole ceremony away, and nothing in the code reached
    // for it. Taking the crown is the ONE move that protects somebody who is
    // not you: the Cloud cannot, and the veto is one chair.
    const { grantPower } = await import('../js/bb/powers.js');
    const { playInterrogation } = await import('../js/bb/secret-power-plays.js');
    const { addBond } = await import('../js/bonds.js');

    const rate = async sworn => {
      let fired = 0; let forAlly = 0;
      for (let sd = 1; sd <= 40; sd++) {
        seat();
        // ben is safe — ana likes him. cleo is the name on the board.
        addBond('ana', 'ben', 6);
        for (const n of H) if (n !== 'ben' && n !== 'ana') addBond('ana', n, -4);
        addBond('ben', 'cleo', 5);
        gs.namedAlliances = sworn
          ? [{ name: 'The Committee', members: ['ben', 'cleo', 'dev', 'eli'], active: true }]
          : [];
        grantPower('hoh-interrogation', 'ben', { week: 3, visibility: 'secret', source: 'test' });
        const out = playInterrogation({ week: { num: 3 }, house: H, hoh: 'ana', rng: seeded(sd * 71) });
        if (out) { fired++; if (out.protecting) forAlly++; }
      }
      return { fired: fired / 40, forAlly: forAlly / 40 };
    };

    const withAlliance = await rate(true);
    const alone = await rate(false);
    expect(withAlliance.forAlly, 'it never once spent the power on somebody else')
      .toBeGreaterThan(0.3);
    expect(withAlliance.fired - alone.fired,
      'being sworn to the person in danger changed nothing').toBeGreaterThan(0.15);
    // And it says so. A power spent on somebody else is the only version of
    // this that costs the holder anything, and it read as self-preservation.
    seat();
    addBond('ana', 'ben', 6);
    for (const n of H) if (n !== 'ben' && n !== 'ana') addBond('ana', n, -4);
    gs.namedAlliances = [{ name: 'The Committee', members: ['ben', 'cleo', 'dev', 'eli'], active: true }];
    grantPower('hoh-interrogation', 'ben', { week: 3, visibility: 'secret', source: 'test' });
    let named = null;
    for (let sd = 1; sd <= 60 && !named; sd++) {
      const out = playInterrogation({ week: { num: 3 }, house: H, hoh: 'ana', rng: seeded(sd * 71) });
      if (out?.protecting) named = out;
      if (!out) { seat(); addBond('ana', 'ben', 6);
        for (const n of H) if (n !== 'ben' && n !== 'ana') addBond('ana', n, -4);
        gs.namedAlliances = [{ name: 'The Committee', members: ['ben', 'cleo', 'dev', 'eli'], active: true }];
        grantPower('hoh-interrogation', 'ben', { week: 3, visibility: 'secret', source: 'test' }); }
    }
    expect(named, 'no seed produced an ally save to read the beats of').toBeTruthy();
    expect(named.beats.map(b => b.badgeText)).toContain('NOT FOR THEMSELVES');
  });

  it('weighs the names rather than counting them', async () => {
    // A name from somebody the deposed HOH trusts is worth more than a name
    // from somebody who has been wrong before.
    const src = require('node:fs').readFileSync('js/bb/secret-power-plays.js', 'utf8');
    expect(src).toMatch(/weights\.set\(points, \(weights\.get\(points\) \|\| 0\) \+ w\)/);
    expect(src).toMatch(/clamp\(bond\(hoh, name\) \/ 4/);
  });

  it('costs the wrongly accused something', async () => {
    // Rooms remember accusations better than corrections.
    const src = require('node:fs').readFileSync('js/bb/secret-power-plays.js', 'utf8');
    expect(src).toMatch(/addBond\(n, accused, -0\.5\)/);
  });
});

describe('the second veto is an actual competition', () => {
  // It said "beats it alone" and there was no competition anywhere: no name,
  // no score, nothing to beat. The house was told somebody won something and
  // the audience was asked to take it on faith.
  const H = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay', 'gus', 'hana', 'iris', 'jo'];
  const LIB = [{ id: 'wall', name: 'The Wall', types: ['veto'],
    stats: { endurance: 0.6, temperament: 0.4 } }];
  const seeded = seed => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const run = async (over = {}) => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { playMysteryVeto } = await import('../js/bb/secret-power-plays.js');
    setPlayers(H.map(n => ({ name: n, archetype: 'floater', gender: 'f',
      stats: { physical: 7, endurance: 6, mental: 6, social: 5, strategic: 5,
        loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } })));
    seasonConfig.jurySize = 3;
    setGs({ bb: { powers: [], weeks: [], stats: {} }, activePlayers: [...H], bonds: {} });
    grantPower('mystery-veto', 'ben', { week: 3, visibility: 'secret', source: 'test' });
    return playMysteryVeto({ week: { num: 3 }, nominees: ['ben', 'eli'], house: H,
      library: LIB, rng: seeded(3), ...over });
  };

  it('plays a competition the season actually has', async () => {
    const out = await run();
    expect(out.competition, 'no competition was played at all').toBeTruthy();
    expect(out.competition.name).toBe('The Wall');
  });

  it('has a number to beat and a number posted', async () => {
    // Alone is not unopposed. The par is what this house would have posted
    // between them, which is the only opponent out there.
    const out = await run();
    expect(typeof out.competition.par).toBe('number');
    expect(typeof out.competition.posted).toBe('number');
    expect(out.won).toBe(out.competition.posted >= out.competition.par);
  });

  it('says both numbers out loud', async () => {
    const out = await run();
    const text = out.beats.map(b => `${b.badgeText} ${b.text}`).join(' ');
    expect(text).toContain(String(out.competition.par.toFixed(1)));
    expect(text).toContain(String(out.competition.posted.toFixed(1)));
    expect(text, 'the competition is never named').toContain('The Wall');
  });

  it('falls back to something rather than nothing', async () => {
    // A season whose library has no veto competition still gets a scene.
    const out = await run({ library: [] });
    expect(out.competition.name.length).toBeGreaterThan(3);
  });

  it('holds a second ceremony when it is won', () => {
    // A veto that is won has to be USED somewhere, in front of everybody, or it
    // is a rule change announced by caption.
    //
    // With its OWN act type. It was a second `veto-ceremony`, which replayed
    // the entire meeting — speeches, pleading, adjournment — for a scene that
    // is three beats long and happens after everybody had gone to bed, so the
    // viewer got the same ceremony twice.
    const src = require('node:fs').readFileSync('js/bb/week.js', 'utf8');
    expect(src).toMatch(/type: 'second-veto-ceremony'/);
    const vp = require('node:fs').readFileSync('js/vp-screens.js', 'utf8');
    expect(vp, 'the second meeting has no screen').toMatch(/case 'second-veto-ceremony':/);
  });

  it('shows it AFTER the meeting it comes after', () => {
    // Pushed where it was computed, it rendered before the veto meeting it
    // follows. Third time this file has taught the same lesson: acts render in
    // push order, and where a thing is decided is not where it happened.
    const src = require('node:fs').readFileSync('js/bb/week.js', 'utf8');
    const ceremony = src.indexOf("type: 'veto-ceremony', used: !!vetoDecision.use");
    const mystery = src.indexOf('week.acts.push(addBeats(solo,');
    const second = src.indexOf("type: 'second-veto-ceremony'");
    expect(ceremony).toBeGreaterThan(-1);
    expect(mystery, 'the mystery veto still shows before the ceremony')
      .toBeGreaterThan(ceremony);
    expect(second).toBeGreaterThan(mystery);
  });

  it('is handed the week\'s own competition library', () => {
    const src = require('node:fs').readFileSync('js/bb/week.js', 'utf8');
    expect(src).toMatch(/library: competitionLibrary \}\);/);
  });
});

describe('the mystery competitor is a real alumnus, in a real draw', () => {
  const H = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay'];
  const LIB = [{ id: 'w', name: 'The Wall', types: ['veto'],
    stats: { endurance: 0.6, physical: 0.4 } }];
  const ALUMNI = [
    { name: 'Alejandro', seasonName: 'TD 4', winner: true, finalist: true, chalWins: 5 },
    { name: 'Quiet', seasonName: 'TD 2', winner: false, finalist: false, chalWins: 0 },
  ];
  const seeded = seed => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const run = async (over = {}, seed = 21) => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { playMysteryCompetitor } = await import('../js/bb/secret-power-plays.js');
    setPlayers(H.map(n => ({ name: n, archetype: 'floater', gender: 'f',
      stats: { physical: 6, endurance: 6, mental: 6, social: 5, strategic: 5,
        loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } })));
    seasonConfig.jurySize = 2;
    setGs({ bb: { powers: [], weeks: [], stats: {} }, activePlayers: [...H], bonds: {} });
    grantPower('mystery-competitor', 'ben', { week: 3, visibility: 'secret', source: 'test' });
    return playMysteryCompetitor({
      week: { num: 3 }, nominees: ['ben', 'eli'],
      players: ['ana', 'ben', 'eli', 'cleo', 'dev'],
      alumni: ALUMNI, library: LIB, hoh: 'ana', rng: seeded(seed), ...over,
    });
  };

  it('takes one of the DRAWN spots, never the HOH or a nominee', async () => {
    // The wiki is specific: "one of the two randomly selected Veto spots".
    // The Head of Household and the nominees are in that yard by right and
    // cannot be sent out of it by somebody else's power.
    for (const seed of [3, 21, 77, 404]) {
      const out = await run({}, seed);
      if (!out?.displaced) continue;
      expect(out.displaced, 'the Head of Household was bumped').not.toBe('ana');
      expect(['ben', 'eli'], 'a nominee was bumped').not.toContain(out.displaced);
    }
  });

  it('leaves the holder in the competition, which is the second chance', async () => {
    // "Doubles their chances at winning POV" — the holder still plays and can
    // win it themselves. This is a SECOND route, not a replacement.
    const out = await run();
    expect(out.displaced, 'the power bumped the person who paid for it').not.toBe('ben');
  });

  it('is scored by the real competition, not beside it', async () => {
    // The guest used to post a number against a PAR in a private simulation
    // running alongside the real thing — so the draw screen listed six players,
    // the competition screen showed five, and the shelf at the end had no line
    // for the person the whole twist is about.
    //
    // This used to grep for `const field = players.filter(...)`, which is the
    // fault it was written to catch, in test form: it pinned the private
    // simulation in place and would have failed on the fix.
    const { mysteryCompetitorResult } = await import('../js/bb/secret-power-plays.js');
    const out = await run();
    expect(out.competition, 'a result existed before the competition had run').toBeNull();

    // The engine hands it the finished competition. A win belongs to whoever
    // paid for them to be there.
    mysteryCompetitorResult({ act: out, winner: out.guest,
      competition: { id: 'the-wall', name: 'The Wall', scores: { [out.guest]: 8.2, ben: 6.1, cleo: 5.4 } } });
    expect(out.won).toBe(true);
    expect(out.vetoTo).toBe('ben');
    expect(out.competition.name).toBe('The Wall');
    expect(out.competition.posted).toBe(8.2);
    // ON THE VETO SCREEN, NOT THE ARRIVAL ONE. The result beats used to be
    // appended to the Mystery Competitor act, which is drawn at the veto
    // ceremony — so the twist's own screen opened by announcing the outcome of
    // a competition the viewer had not watched yet.
    expect(out.resultBeats.map(b => b.text).join(' ')).toContain('8.2');
    expect(out.beats.map(b => b.text).join(' '),
      'the arrival card gives the result away').not.toContain('8.2');
    // And they leave from the yard, which is where they actually leave from.
    expect(out.resultBeats.map(b => b.badgeText)).toContain('AND THEN THEY GO');
  });

  it('loses it to the room like anybody else', async () => {
    const { mysteryCompetitorResult } = await import('../js/bb/secret-power-plays.js');
    const out = await run();
    mysteryCompetitorResult({ act: out, winner: 'cleo',
      competition: { id: 'the-wall', name: 'The Wall', scores: { [out.guest]: 3.1, ben: 6.1, cleo: 9.9 } } });
    expect(out.won).toBe(false);
    expect(out.vetoTo).toBeNull();
    expect(out.resultBeats.map(b => b.text).join(' ')).toContain('9.9');
    expect(out.beats.map(b => b.text).join(' ')).not.toContain('9.9');
  });

  it('calls somebody who can actually win the competition standing in the yard', async () => {
    // Reported from a real season: a competitor was summoned into a veto and
    // finished LAST in it. A soft weight spread across a hundred and fifty
    // alumni barely concentrates at all, and nobody spends the biggest thing in
    // their pocket on a name they like the sound of.
    //
    // This used to grep the source for `chalWins || 0) * 0.9`, which pinned one
    // coefficient of the weight and said nothing whatsoever about who gets
    // called — it passed happily through the season that produced the report.
    const strong = { name: 'Ringer', seasonName: 'TD 1', chalWins: 0,
      stats: { physical: 10, endurance: 10, mental: 10, social: 5, strategic: 5,
        loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } };
    const weak = { name: 'Passenger', seasonName: 'TD 2', chalWins: 0,
      stats: { physical: 2, endurance: 2, mental: 2, social: 5, strategic: 5,
        loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } };
    // Fifteen filler alumni, so the shortlist has to do real work.
    const filler = Array.from({ length: 15 }, (_, i) => ({
      name: `Mid${i}`, seasonName: 'TD 3', chalWins: 0,
      stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
        loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } }));

    let ringer = 0; let passenger = 0;
    for (let sd = 1; sd <= 40; sd++) {
      const out = await run({ alumni: [weak, ...filler, strong] }, sd * 13);
      if (out?.guest === 'Ringer') ringer++;
      if (out?.guest === 'Passenger') passenger++;
    }
    expect(ringer, 'the best player available was almost never called').toBeGreaterThan(6);
    expect(passenger, 'the worst player available kept getting the call').toBe(0);
  });

  it('names where they came from', async () => {
    const out = await run();
    expect(out.beats[0].text).toMatch(/TD \d/);
  });

  it('draws from finished seasons, not from this one', () => {
    // The first version filtered the current cast for anybody not in the house
    // — which is not an alumnus, it is somebody this season evicted three weeks
    // ago, sitting in the jury, who cannot walk back in for an afternoon.
    const week = require('node:fs').readFileSync('js/bb/week.js', 'utf8');
    expect(week, 'still reading the current cast').not.toMatch(/alumni = \(players \|\| \[\]\)/);
    expect(week, 'the franchise ledger is not consulted').toMatch(/activeSeasons\(\)/);
  });
});

describe('the second veto is used ON somebody, deliberately', () => {
  // `saves` was `nominees[0]` — whoever happened to be listed first. So a
  // holder who was not on the block took somebody off it at random, for no
  // reason, and the week rearranged itself around a choice nobody made. That
  // is what produced a nominee coming down with no meeting to explain it.
  const H = ['ana', 'ben', 'cleo', 'dev', 'eli', 'fay'];
  const seeded = seed => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const setup = async (bonds = {}) => {
    const { grantPower } = await import('../js/bb/powers.js');
    const { addBond } = await import('../js/bonds.js');
    setPlayers(H.map(n => ({ name: n, archetype: 'floater', gender: 'f',
      stats: { physical: 8, endurance: 8, mental: 8, social: 5, strategic: 5,
        loyalty: 5, boldness: 5, intuition: 5, temperament: 8 } })));
    seasonConfig.jurySize = 2;
    setGs({ bb: { powers: [], weeks: [], stats: {} }, activePlayers: [...H], bonds: {} });
    for (const [pair, v] of Object.entries(bonds)) {
      const [a, b] = pair.split('|');
      addBond(a, b, v);
    }
    grantPower('mystery-veto', 'ben', { week: 3, visibility: 'secret', source: 'test' });
  };
  const play = async (nominees, seed = 5) => {
    const { playMysteryVeto } = await import('../js/bb/secret-power-plays.js');
    return playMysteryVeto({ week: { num: 3 }, nominees, house: H,
      library: [{ id: 'w', name: 'The Wall', types: ['veto'], stats: { endurance: 1 } }],
      rng: seeded(seed) });
  };

  it('saves the ally, not whoever is listed first', async () => {
    // `cleo` is first on the block; `eli` is the friend.
    await setup({ 'ben|eli': 6 });
    const out = await play(['cleo', 'eli']);
    expect(out, 'it did not fire').toBeTruthy();
    if (out.won) expect(out.saves, 'it saved the first name on the list').toBe('eli');
  });

  it('saves itself when it is the one sitting there', async () => {
    await setup();
    const out = await play(['ben', 'cleo'], 2);
    expect(out).toBeTruthy();
    if (out.won) expect(out.saves).toBe('ben');
  });

  it('stays in the pocket when there is nobody worth using it on', async () => {
    // Not on the block, nobody up there they care about. Using it here is how
    // you spend the biggest thing you had on a stranger.
    await setup();
    let fired = 0;
    for (let seed = 1; seed <= 40; seed += 1) {
      const out = await play(['cleo', 'dev'], seed);
      if (out) fired += 1;
      await setup();
    }
    expect(fired, 'it fires almost every week on a block it has no stake in')
      .toBeLessThan(12);
  });

  it('says who it was for', async () => {
    await setup({ 'ben|eli': 6 });
    const out = await play(['cleo', 'eli']);
    if (out?.won) {
      expect(out.beats.map(b => b.text).join(' ')).toContain('eli');
    }
  });
});
