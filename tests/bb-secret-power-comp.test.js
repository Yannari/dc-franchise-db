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
    beats: [{ text: 'The yard is not what it looks like.', players: ['Ripper'],
      badgeText: 'SOMETHING ELSE', badgeClass: 'gold' }],
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
    expect(html).toContain('Sealed until');
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
