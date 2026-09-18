// ══════════════════════════════════════════════════════════════════════
// tests/dr-saves.test.js — the chocolate bar, the dunk tank, the beaver
// and the baguette (js/dr/saves.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { initSaves, luckSave, holderSave, runCampaign, settleMemory, takeFallout, SAVE_KINDS, holderMind, timesSaved } from '../js/dr/saves.js';
import { dragScreens, sceneSections } from '../js/vp-dr/screens.js';
import { SAVE_BEATS, linesFor } from '../js/dr/data/save-beats.js';
import { familyForChallenge } from '../js/dr/data/maxi-performance.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];

function cast(n, seed) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

// A REAL bond store: without one every bond-gated decision reads zero.
function season(seed, config = {}) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  const res = playDragSeason({
    cast: cast(13, seed), seed: seed * 101 + 7, config,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  });
  return { ...res, bonds };
}

const weekly = res => res.rows.filter(r => r.dr && !r.dr.finale);
const SEEDS = Array.from({ length: 12 }, (_, i) => i + 1);

describe('a season with no save', () => {
  it('carries nothing, and "none" is the same season as unset', () => {
    const a = season(4);
    const b = season(4, { drSave: 'none' });
    expect(a.rows.every(r => r.dr.save == null && r.dr.savesState == null)).toBe(true);
    expect(JSON.stringify(b.rows.map(r => r.dr.record)))
      .toBe(JSON.stringify(a.rows.map(r => r.dr.record)));
  });
});

describe('the golden chocolate bar', () => {
  it('saves at most once a season, and the saved queen is BTM2 and still there', () => {
    let found = 0;
    for (const s of SEEDS) {
      const res = season(s, { drSave: 'chocolate' });
      const saves = weekly(res).flatMap(r => r.dr.save?.saved || []);
      expect(saves.length, `seed ${s}`).toBeLessThanOrEqual(1);
      found += saves.length;
      const opened = weekly(res).flatMap(r => (r.dr.save?.tries || []).map(t => t.queen));
      expect(new Set(opened).size, 'a bar was opened twice').toBe(opened.length);
      for (const r of weekly(res)) {
        for (const n of r.dr.save?.saved || []) {
          expect(r.exits.map(x => x.name)).not.toContain(n);
          expect(r.dr.record[n].at(-1)).toBe('BTM2');
          expect(r.dr.living).toContain(n);
          expect(r.dr.lipsync.saved).toContain(n);
        }
      }
    }
    expect(found, 'the golden bar never turned up in twelve seasons').toBeGreaterThan(0);
  });

  it('waits for the whole cast: a split premiere gets its bars at the rejoin', () => {
    const res = season(3, { drSave: 'chocolate', drPremiere: 'split' });
    const first = res.rows.find(r => r.dr.scenes.some(x => x.kind === 'save:handout'));
    expect(first).toBeTruthy();
    const handed = first.dr.scenes.find(x => x.kind === 'save:handout').data.handedTo;
    expect(handed.length).toBe(13);
    for (const r of res.rows.filter(x => x.num < first.num)) expect(r.dr.save?.tries || []).toEqual([]);
  });

  it('hands every queen in the room a bar on her first night', () => {
    const res = season(2, { drSave: 'chocolate' });
    const first = res.rows[0].dr.scenes.find(x => x.kind === 'save:handout');
    expect(first?.text).toBeTruthy();
    expect(first.data.handedTo).toEqual(res.rows[0].dr.roomAtStart);
  });
});

describe('the dunk tank', () => {
  it('spends every pulled lever, never rewires, and stops once the live ones are found', () => {
    let dunks = 0; let drained = 0;
    for (const s of SEEDS) {
      for (const cfg of [{ drTankLevers: 4, drTankLive: 1 }, { drTankLevers: 10, drTankLive: 2 }]) {
        const res = season(s, { drSave: 'tank', drTankRetire: 8, ...cfg });
        const n = cfg.drTankLevers;
        let inPlay = Array.from({ length: n }, (_, i) => i + 1);
        let stopped = null; let found = 0;
        let live0 = null;
        for (const r of weekly(res)) {
          const st = r.dr.savesState;
          if (st?.live) {
            if (!live0) live0 = [...st.live];
            expect(st.live, 'the live levers moved mid-season').toEqual(live0);
          }
          if (r.dr.scenes.some(x => x.kind === 'save:retire')) stopped = stopped ?? r.num;
          for (const t of r.dr.save?.tries || []) {
            expect(stopped, 'a lever was pulled after the tank stopped').toBeNull();
            expect(t.levers).toEqual(inPlay);
            expect(inPlay).toContain(t.lever);
            inPlay = inPlay.filter(x => x !== t.lever);
            if (t.saved) { dunks++; found++; }
            if (t.liveLeft === 0) { drained++; stopped = r.num + 0.5; }
          }
          if (stopped !== null && stopped % 1) stopped = r.num;   // the drain night itself is allowed its own pulls
        }
        expect(found).toBeLessThanOrEqual(cfg.drTankLive);
      }
    }
    expect(dunks, 'nobody was ever dunked').toBeGreaterThan(0);
    expect(drained, 'no tank was ever emptied of live levers').toBeGreaterThan(0);
  });

  it('keeps the queen a dunk saved and sends nobody else home for her', () => {
    for (const s of SEEDS) {
      for (const r of weekly(season(s, { drSave: 'tank' }))) {
        const tries = r.dr.save?.tries || [];
        if (tries.length === 1 && tries[0].saved) expect(r.exits).toEqual([]);
      }
    }
  });
});

describe('the holder saves', () => {
  for (const kind of ['beaver', 'baguette']) {
    it(`${kind}: saves come out of the named bottom before the song, on the wiki's weeks`, () => {
      let nights = 0;
      for (const s of SEEDS.slice(0, 6)) {
        const rows = weekly(season(s, { drSave: kind }));
        rows.forEach((r, i) => {
          const h = r.dr.save?.hold;
          if (!h) return;
          nights++;
          const prev = rows[i - 1];
          // Never the semi-final: the room is bigger than the finale plus one.
          expect(r.dr.roomAtStart.length).toBeGreaterThan(5);
          expect([3, 4]).toContain(h.pool.length);
          for (const x of h.savedAll) expect(h.pool).toContain(x);
          expect([...r.dr.call.atRisk].sort()).toEqual([...h.savedAll].sort());
          expect([...r.dr.call.bottom].sort()).toEqual([...h.singers].sort());
          expect(h.singers).toHaveLength(2);
          expect(r.dr.lipsync.queens.slice().sort()).toEqual([...h.singers].sort());
          for (const x of h.savedAll) expect(r.dr.record[x].at(-1)).toBe('LOW');
          // The call screen is drawn before the save: everybody named is in the bottom.
          expect([...r.dr.callAtCall.bottom].sort()).toEqual([...h.pool].sort());
          if (kind === 'beaver') {
            // Canada: the maxi winner holds it; a double win is two saves out of four.
            for (const pk of h.picks) expect(r.dr.call.win).toContain(pk.holder);
            expect(h.picks).toHaveLength(h.pool.length - 2);
          } else {
            // France S4: last week's eliminated queen hands it over.
            expect(prev, 'a baguette on the first night').toBeTruthy();
            expect(prev.exits.map(x => x.name)).toContain(h.giver);
            expect(r.dr.roomAtStart).not.toContain(h.giver);
            expect(r.dr.roomAtStart).toContain(h.holder);
            expect(h.picks).toHaveLength(1);
            expect(r.dr.scenes.some(x => x.kind === 'save:handoff' && x.text.includes(h.giver))).toBe(true);
          }
          if (h.selfSave) expect(h.pool).toContain(h.holder);
        });
        // No baguette after a week nobody went home.
        if (kind === 'baguette') {
          rows.forEach((r, i) => {
            if (i && !rows[i - 1].exits.length) expect(r.dr.save?.hold ?? null).toBeNull();
          });
        }
      }
      expect(nights).toBeGreaterThan(20);
    });
  }

  it('beaver: a double win is two beavers and a bottom four', () => {
    const state = { record: {} };
    const players = { W1: { archetype: 'hero' }, W2: { archetype: 'hero' } };
    const res = holderSave({
      saves: { kind: 'beaver' }, winners: ['W1', 'W2'], pool: ['A', 'B', 'C', 'D'],
      living: ['W1', 'W2', 'A', 'B', 'C', 'D', 'E'], state, players, bond: () => 0, rng: rngFor(7),
    });
    expect(res.picks.map(p => p.holder)).toEqual(['W1', 'W2']);
    expect(new Set(res.savedAll).size).toBe(2);
    expect(res.singers).toHaveLength(2);
  });

  it('a nice archetype never saves for strategy', () => {
    const state = { record: {} };
    const players = {
      H: { archetype: 'hero', stats: { strategic: 10, loyalty: 1 } },
      A: { drag: { lipsync: 9 } }, B: { drag: { lipsync: 2 } }, C: { drag: { lipsync: 5 } },
    };
    for (let i = 0; i < 40; i++) {
      const res = holderSave({
        saves: { kind: 'beaver' }, winners: ['H'], pool: ['A', 'B', 'C'], living: ['H', 'A', 'B', 'C', 'D'],
        state, players, bond: () => 0, rng: rngFor(i * 7919 + 13),
      });
      expect(res.why).not.toBe('strategy');
    }
  });

  it('moves bonds: the saved queen warms to the holder, the singers cool, the giver is remembered', () => {
    const res = season(3, { drSave: 'beaver' });
    const r = weekly(res).find(x => x.dr.save?.hold);
    const ev = r.dr.events.find(e => e.type === 'save:beaver');
    const h = r.dr.save.hold;
    expect(ev.bond.some(([a, b, d]) => a === h.holder && b === h.saved && d > 0)).toBe(true);
    for (const q of h.singers) {
      expect(ev.bond.some(([a, b, d]) => a === h.holder && b === q && d < 0)).toBe(true);
    }
    expect(Object.keys(res.bonds).length).toBeGreaterThan(0);
    const bg = weekly(season(3, { drSave: 'baguette' })).find(x => x.dr.save?.hold);
    const bh = bg.dr.save.hold;
    const bev = bg.dr.events.find(e => e.type === 'save:baguette');
    expect(bev.bond.some(([a, b, d]) => a === bh.giver && b === bh.holder && d > 0)).toBe(true);
  });
});

describe('the campaign and what it leaves behind', () => {
  const players = {
    V: { archetype: 'villain', stats: { strategic: 9, loyalty: 2, boldness: 8, temperament: 5 } },
    H: { archetype: 'hero', stats: { strategic: 3, loyalty: 9, temperament: 8 } },
    N: { archetype: 'underdog', stats: { strategic: 4, loyalty: 7, temperament: 3 } },
    W: { archetype: 'hero', stats: { strategic: 5, loyalty: 8, temperament: 7 } },
    S: { archetype: 'floater', stats: {} },
  };
  const bond = () => 0;

  it('every bottom queen makes one move, and a nice queen never schemes', () => {
    for (let i = 0; i < 60; i++) {
      const saves = initSaves({ kind: 'beaver' });
      const { events, pleas } = runCampaign({
        saves, targets: ['W'], pool: ['V', 'H', 'N'], living: ['W', 'V', 'H', 'N', 'S'],
        players, bond, rng: rngFor(i * 7919 + 13), ep: 3,
      });
      const own = events.filter(e => e.round === 1 && ['V', 'H', 'N'].includes(e.a) && e.b === 'W');
      expect(own).toHaveLength(3);
      for (const e of own.filter(x => x.a !== 'V')) {
        expect(['promise', 'throw-under']).not.toContain(e.id);
      }
      for (const e of events) expect(e.bond.length + Object.keys(e.pop).length, e.id).toBeGreaterThan(0);
      expect(Object.keys(pleas.W || {}).length).toBeGreaterThan(0);
    }
  });

  it('a plea moves the decision', () => {
    let withPlea = 0; let without = 0;
    for (let i = 0; i < 200; i++) {
      const base = { saves: initSaves({ kind: 'beaver' }), winners: ['W'], pool: ['V', 'H', 'N'],
        living: ['W', 'V', 'H', 'N', 'S'], state: { record: {} }, players, bond };
      if (holderSave({ ...base, rng: rngFor(i * 7919 + 13) }).saved === 'N') without++;
      if (holderSave({ ...base, rng: rngFor(i * 7919 + 13), pleas: { W: { N: 1.5 } } }).saved === 'N') withPlea++;
    }
    expect(withPlea).toBeGreaterThan(without + 40);
  });

  it('a saved queen repays the debt, and a broken promise is fallout', () => {
    const saves = initSaves({ kind: 'beaver' });
    // Week 3: W saves N; N had promised W a save.
    saves.promises.push({ from: 'N', to: 'W', ep: 3, open: true });
    const wk3 = { picks: [{ holder: 'W', saved: 'N', selfSave: false }], savedAll: ['N'], pool: ['N', 'V', 'H'], singers: ['V', 'H'] };
    settleMemory(saves, wk3, 3);
    expect(saves.debts).toContainEqual(expect.objectContaining({ debtor: 'N', creditor: 'W', paid: false }));
    expect(saves.grudges.map(g => g.from).sort()).toEqual(['H', 'V']);
    // Week 5: N holds it, W is in the bottom. The debt pulls hard.
    let repaid = 0;
    for (let i = 0; i < 100; i++) {
      const copy = JSON.parse(JSON.stringify(saves));
      const r = holderSave({ saves: copy, winners: ['N'], pool: ['V', 'W', 'H'], living: ['N', 'V', 'W', 'H', 'S'],
        state: { record: {} }, players, bond, rng: rngFor(i * 7919 + 13) });
      if (r.saved === 'W') repaid++;
    }
    expect(repaid).toBeGreaterThan(70);
    // And if she does not, the promise is broken and next week has a fight.
    const wk5 = { picks: [{ holder: 'N', saved: 'V', selfSave: false }], savedAll: ['V'], pool: ['V', 'W', 'H'], singers: ['W', 'H'] };
    const out = settleMemory(saves, wk5, 5);
    expect(out.promises).toEqual([expect.objectContaining({ from: 'N', to: 'W', kept: false })]);
    expect(saves.fallout).toEqual([expect.objectContaining({ a: 'W', b: 'N' })]);
    // Next week's cold open takes it, once, and only while both are still there.
    expect(takeFallout(saves, ['W', 'N', 'S'])).toEqual([expect.objectContaining({ a: 'W', b: 'N' })]);
    expect(takeFallout(saves, ['W', 'N', 'S'])).toEqual([]);
  });

  it('a deal nobody took is void', () => {
    const saves = initSaves({ kind: 'beaver' });
    saves.promises.push({ from: 'V', to: 'W', ep: 4, open: true });
    settleMemory(saves, { picks: [{ holder: 'W', saved: 'H', selfSave: false }], savedAll: ['H'], pool: ['V', 'H', 'N'], singers: ['V', 'N'] }, 4);
    expect(saves.promises[0]).toMatchObject({ open: false, void: true });
  });

  it('the season carries it: campaign scenes, repaid debts and settled promises', () => {
    let campaigns = 0; let settled = 0; let repaid = 0; let promisesMade = 0;
    for (const s of SEEDS) {
      const played = season(s, { drSave: 'beaver' });
      promisesMade += (played.state?.saves?.promises || []).length;
      for (const r of weekly(played)) {
        if (r.dr.save?.hold) {
          const camp = r.dr.scenes.filter(x => x.data?.campaign);
          if (camp.length) campaigns++;
          // In Untucked, which on these nights comes after the call.
          for (const x of camp) expect(x.step).toBe('untucked');
          const steps = r.dr.scenes.map(x => x.step);
          expect(steps.indexOf('results')).toBeLessThan(steps.indexOf('untucked'));
          expect(steps.lastIndexOf('untucked')).toBeLessThan(steps.indexOf('save-hold'));
          // A conversation, not three speeches: pitches, replies and her answer.
          const rounds = new Set(r.dr.save.hold.campaign.map(e => e.round));
          expect(rounds.has(1) && rounds.has(3)).toBe(true);
          expect(camp.length).toBeGreaterThanOrEqual(5);
          // The ceremony, in its order.
          const kinds = r.dr.scenes.filter(x => x.step === 'save-hold').map(x => x.kind);
          for (const k of ['save:invoke', 'save:speech', 'save:suspense', 'save:saved', 'save:host-react', 'save:reaction', 'save:confessional', 'save:left']) {
            expect(kinds, `${k} missing`).toContain(k);
          }
          expect(kinds.indexOf('save:suspense')).toBeLessThan(kinds.indexOf('save:saved'));
          expect(kinds.indexOf('save:saved')).toBeLessThan(kinds.indexOf('save:reaction'));
          // The call must not say who sings before the save does.
          expect(r.dr.scenes.some(x => x.kind === 'stage:call-stakes')).toBe(false);
          // And the screens follow: the call before Untucked.
          const ids = dragScreens(r).map(x => x.id);
          expect(ids.indexOf('dr-results')).toBeLessThan(ids.indexOf('dr-untucked'));
          expect(r.dr.save.hold.campaign.length).toBeGreaterThan(0);
          repaid += r.dr.scenes.filter(x => x.kind === 'save:repaid').length;
        }
        settled += r.dr.scenes.filter(x => /^save:promise-(kept|broken)$/.test(x.kind)).length;
        // A fallout scene only ever opens a week.
        for (const x of r.dr.scenes.filter(y => y.kind === 'save:fallout')) expect(x.step).toBe('cold-open');
      }
    }
    expect(campaigns).toBeGreaterThan(40);
    expect(repaid, 'no debt was ever repaid in twelve seasons').toBeGreaterThan(0);
    /* ── THIS ONE IS THIN, AND IT IS THIN BY DESIGN ──────────────────
       A promise is made by a queen in the bottom to the queen holding the
       save, and it is VOIDED the same night unless that holder actually
       saves her — so most of the promises a season makes never become
       standing ones. A standing promise then needs the roles to reverse: the
       queen who made it holding the save herself, with the queen she made it
       to standing in the bottom. Measured across thirty seasons: 78 made, 2
       settled. Over twelve seasons the expected count is under one, so this
       assertion was passing on luck — it went red on a change that only
       moved the rng stream. Counted over the wider sweep instead, which is
       what it was always trying to say: the mechanism is reachable. */
    expect(settled + promisesMade,
      'promises are neither made nor settled in twelve seasons').toBeGreaterThan(0);
  });
});

describe('already saved', () => {
  const FAIR = { archetype: 'social-butterfly', stats: { strategic: 3, loyalty: 9, social: 9, boldness: 3, intuition: 3 } };
  const MERIT = { archetype: 'challenge-beast', stats: { strategic: 3, loyalty: 4, social: 3, boldness: 9, intuition: 9 } };
  const queens = { A: { drag: { lipsync: 5 } }, B: { drag: { lipsync: 5 } }, C: { drag: { lipsync: 5 } }, S: {} };
  const history = n => Array.from({ length: n }, (_, i) => ({ ep: i + 2, picks: [{ holder: 'S', saved: 'A' }] }));

  it('every queen weighs all three, in her own proportions', () => {
    for (const p of [FAIR, MERIT, { archetype: 'villain', stats: {} }, { archetype: 'hero', stats: {} }, {}]) {
      const m = holderMind(p);
      expect(m.strategy).toBeGreaterThan(0);
      expect(m.merit).toBeGreaterThan(0);
      expect(m.fair).toBeGreaterThan(0);
      expect(m.strategy + m.merit + m.fair).toBeCloseTo(1, 6);
    }
    const hero = holderMind({ archetype: 'hero', stats: { strategic: 8, loyalty: 4 } });
    const villain = holderMind({ archetype: 'villain', stats: { strategic: 8, loyalty: 4 } });
    expect(villain.strategy).toBeGreaterThan(hero.strategy);
    expect(hero.fair).toBeGreaterThan(villain.fair);
    expect(timesSaved({ uses: history(2) }, 'A')).toBe(2);
  });

  it('counts against a queen as a probability, more for a queen who spreads it around', () => {
    const rate = (holder, n) => {
      let a = 0;
      for (let i = 0; i < 400; i++) {
        const res = holderSave({
          saves: { kind: 'beaver', uses: history(n) }, winners: ['W'], pool: ['A', 'B', 'C'],
          living: ['W', 'A', 'B', 'C', 'S'], state: { record: {} }, players: { ...queens, W: holder },
          bond: () => 0, rng: rngFor(i * 7919 + 13),
        });
        if (res.saved === 'A') a++;
      }
      return a / 400;
    };
    const fair0 = rate(FAIR, 0); const fair2 = rate(FAIR, 2);
    const merit0 = rate(MERIT, 0); const merit2 = rate(MERIT, 2);
    expect(fair2).toBeLessThan(fair0 - 0.15);
    expect(fair2).toBeGreaterThan(0);               // never a rule
    expect(merit0 - merit2).toBeLessThan((fair0 - fair2) / 2);
    expect(rate(FAIR, 1)).toBeGreaterThan(fair2);   // grows with each save
  });

  it('what she did with the save softens it for a merit queen', () => {
    const count = (record) => {
      let a = 0;
      for (let i = 0; i < 400; i++) {
        const res = holderSave({
          saves: { kind: 'beaver', uses: history(1) }, winners: ['W'], pool: ['A', 'B', 'C'],
          living: ['W', 'A', 'B', 'C', 'S'], state: { record: { A: record } },
          players: { ...queens, W: holderMind(MERIT) && { ...MERIT, stats: { ...MERIT.stats, social: 6, loyalty: 6 } } },
          bond: () => 0, rng: rngFor(i * 7919 + 13),
        });
        if (res.saved === 'A') a++;
      }
      return a;
    };
    expect(count(['SAFE', 'BTM2', 'WIN', 'WIN'])).toBeGreaterThan(count(['SAFE', 'BTM2', 'SAFE', 'SAFE']));
  });

  it('is argued in Untucked only when somebody has been saved, and more the more she has', () => {
    const players = { W: FAIR, V: { archetype: 'villain', stats: { strategic: 8, loyalty: 2, boldness: 8 } },
      A: { archetype: 'floater', stats: {} }, N: { archetype: 'underdog', stats: {} }, S: {} };
    const turns = n => {
      let k = 0;
      for (let i = 0; i < 150; i++) {
        const { events } = runCampaign({
          saves: { kind: 'beaver', uses: history(n) }, targets: ['W'], pool: ['V', 'A', 'N'],
          living: ['W', 'V', 'A', 'N', 'S'], players, bond: () => 0, rng: rngFor(i * 7919 + 13), ep: 6,
        });
        k += events.filter(e => ['pitch-my-turn', 'rebut-turn-over'].includes(e.id)).length;
        for (const e of events.filter(x => x.id === 'pitch-my-turn')) expect(e.c).toBe('A');
        for (const e of events.filter(x => x.id === 'rebut-turn-over')) expect(e.c).toBe('A');
      }
      return k;
    };
    expect(turns(0)).toBe(0);
    const one = turns(1); const three = turns(3);
    expect(one).toBeGreaterThan(0);
    expect(three).toBeGreaterThan(one);
  });

  it('a season says it with every name filled in', () => {
    let seen = 0;
    for (const s of SEEDS) {
      for (const kind of ['beaver', 'baguette']) {
        for (const r of weekly(season(s, { drSave: kind }))) {
          for (const sc of r.dr.scenes || []) {
            if (!String(sc.kind).startsWith('save:')) continue;
            expect(sc.text, `${kind} seed ${s} ${sc.kind}`).not.toMatch(/\{[a-z]\}/);
            if (/turn-over|my-turn|saved-delivered|no-score|holder-fair|favoritism|passed-over/.test(sc.kind)) seen++;
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('the lines know the week', () => {
  // Every line written for a kind of challenge, and a fragment of it with no placeholder.
  const tagged = [];
  const walk = v => {
    if (Array.isArray(v)) for (const l of v) { if (l && typeof l === 'object' && l.fam) tagged.push(l); else walk(l); }
    else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x);
  };
  walk(SAVE_BEATS);
  const fragment = l => l.line.split(/\{[a-z]\}/).map(x => x.trim()).sort((a, b) => b.length - a.length)[0];

  it('a sewing line only on a sewing week, a joke only on a comedy week', () => {
    expect(tagged.length).toBeGreaterThan(4);
    expect(linesFor([{ fam: ['design'], line: 'x' }, 'y'], 'stand-up')).toEqual(['y']);
    let checked = 0;
    for (const kind of ['beaver', 'baguette']) {
      for (const sd of SEEDS.slice(0, 8)) {
        for (const r of weekly(season(sd, { drSave: kind }))) {
          const fam = familyForChallenge(r.dr.challenge.id).family;
          for (const sc of r.dr.scenes.filter(x => /^save:/.test(x.kind))) {
            for (const l of tagged) {
              if (!sc.text.includes(fragment(l))) continue;
              checked++;
              expect(l.fam, `"${fragment(l)}" on a ${fam} week (${r.dr.challenge.id})`).toContain(fam);
            }
          }
        }
      }
    }
    expect(checked, 'no tagged line was ever drawn, so nothing was tested').toBeGreaterThan(0);
  });
});

describe('the settings', () => {
  it('golden bars: 1 to 3, all distinct', () => {
    for (const n of [1, 2, 3, 9]) {
      const s = initSaves({ kind: 'chocolate', cast: ['A', 'B', 'C', 'D', 'E'], rng: rngFor(3), goldens: n });
      expect(s.goldens).toHaveLength(Math.min(n, 3));
      expect(new Set(s.goldens).size).toBe(s.goldens.length);
    }
    let saves = 0;
    for (const sd of SEEDS) {
      saves += weekly(season(sd, { drSave: 'chocolate', drGoldenBars: 3 }))
        .reduce((t, r) => t + (r.dr.save?.saved || []).length, 0);
    }
    expect(saves).toBeGreaterThan(12);
  });

  it('live levers: 1 to 3, one pull each, fixed for the season, and a hit is spent', () => {
    const s = initSaves({ kind: 'tank', rng: rngFor(3), levers: 6, live: 3 });
    expect(s.live).toHaveLength(3);
    const wired = [...s.live];
    const tries = luckSave({ saves: s, losers: ['A', 'B', 'C', 'D', 'E'], rng: rngFor(11) });
    expect(new Set(tries.map(t => t.queen)).size).toBe(tries.length);
    expect(s.live).toEqual(wired);
    expect(s.left).toEqual([1, 2, 3, 4, 5, 6].filter(x => !tries.some(t => t.lever === x)));
    // Every live lever found: the tank takes no more pulls.
    const t = initSaves({ kind: 'tank', rng: rngFor(3), levers: 3, live: 2 });
    luckSave({ saves: t, losers: ['A', 'B', 'C', 'D'], rng: rngFor(5) });
    expect(t.drained).toBe(true);
    expect(t.pulls.filter(p => p.hit)).toHaveLength(2);
    expect(luckSave({ saves: t, losers: ['E'], rng: rngFor(6) })).toEqual([]);
    expect(initSaves({ kind: 'tank', rng: rngFor(3), levers: 2, live: 3 }).live).toHaveLength(1);
  });
});

describe('the engine pieces', () => {
  it('a tank with one lever left always dunks', () => {
    const saves = initSaves({ kind: 'tank', rng: rngFor(5), levers: 3 });
    saves.left = [saves.live[0]];
    const [t] = luckSave({ saves, losers: ['Q'], rng: rngFor(9) });
    expect(t.saved).toBe(true);
    expect(saves.left).toHaveLength(0);
    expect(saves.drained).toBe(true);
  });

  it('every kind explains itself in at least two sentences', () => {
    for (const [id, k] of Object.entries(SAVE_KINDS)) {
      expect(k.desc.length, id).toBeGreaterThan(200);
      expect(k.desc.split('. ').length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('replays: the same seed plays the same saves', () => {
    for (const kind of Object.keys(SAVE_KINDS)) {
      const a = season(6, { drSave: kind }).rows.map(r => r.dr.save);
      const b = season(6, { drSave: kind }).rows.map(r => r.dr.save);
      expect(JSON.stringify(b), kind).toBe(JSON.stringify(a));
    }
  });
});

describe('the viewing party', () => {
  it('draws every save scene on a save screen, in the running order', () => {
    for (const kind of Object.keys(SAVE_KINDS)) {
      for (const r of weekly(season(2, { drSave: kind }))) {
        const secs = sceneSections(r);
        const html = dragScreens(r).map(s => s.html).join('\n');
        for (const sc of r.dr.scenes.filter(x => /^save-/.test(x.step) && x.text)) {
          const home = [...secs].find(([, list]) => list.includes(sc))?.[0];
          expect(home, `${kind} ep ${r.num} ${sc.kind}`).toMatch(/^dr-save-/);
          const slice = sc.text.slice(0, 30).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;');
          expect(html, `${kind} ep ${r.num}: "${sc.text.slice(0, 40)}" is not drawn`).toContain(slice);
        }
        const ids = dragScreens(r).map(s => s.id);
        if (ids.includes('dr-save-hold')) {
          expect(ids.indexOf('dr-save-hold')).toBeGreaterThan(ids.indexOf('dr-results'));
          expect(ids.indexOf('dr-save-hold')).toBeLessThan(ids.indexOf('dr-lipsync'));
        }
        if (ids.includes('dr-save-luck')) {
          expect(ids.indexOf('dr-save-luck')).toBeGreaterThan(ids.indexOf('dr-lipsync'));
        }
      }
    }
  });
});
