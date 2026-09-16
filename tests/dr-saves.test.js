// ══════════════════════════════════════════════════════════════════════
// tests/dr-saves.test.js — the chocolate bar, the dunk tank, the beaver
// and the baguette (js/dr/saves.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { initSaves, luckSave, holderSave, runCampaign, settleMemory, SAVE_KINDS } from '../js/dr/saves.js';
import { dragScreens, sceneSections } from '../js/vp-dr/screens.js';

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
  it('removes a missed lever, refills on a dunk, and stops once retired', () => {
    let dunks = 0;
    for (const s of SEEDS) {
      const res = season(s, { drSave: 'tank', drTankLevers: 4, drTankRetire: 8 });
      let inPlay = [1, 2, 3, 4];
      let retiredAt = null;
      for (const r of weekly(res)) {
        if (r.dr.scenes.some(x => x.kind === 'save:retire')) retiredAt = r.num;
        for (const t of r.dr.save?.tries || []) {
          expect(retiredAt, 'a lever was pulled after the tank retired').toBeNull();
          expect(t.levers).toEqual(inPlay);
          expect(inPlay).toContain(t.lever);
          if (t.saved) { dunks++; inPlay = [1, 2, 3, 4]; } else inPlay = inPlay.filter(x => x !== t.lever);
        }
        if (retiredAt === r.num) expect(r.dr.roomAtStart.length).toBeLessThanOrEqual(8);
      }
    }
    expect(dunks, 'nobody was ever dunked').toBeGreaterThan(0);
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
      const own = events.filter(e => ['V', 'H', 'N'].includes(e.a) && e.b === 'W');
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
  });

  it('a deal nobody took is void', () => {
    const saves = initSaves({ kind: 'beaver' });
    saves.promises.push({ from: 'V', to: 'W', ep: 4, open: true });
    settleMemory(saves, { picks: [{ holder: 'W', saved: 'H', selfSave: false }], savedAll: ['H'], pool: ['V', 'H', 'N'], singers: ['V', 'N'] }, 4);
    expect(saves.promises[0]).toMatchObject({ open: false, void: true });
  });

  it('the season carries it: campaign scenes, and a fallout cold open when a promise breaks', () => {
    let campaigns = 0; let fallout = 0; let repaid = 0;
    for (const s of SEEDS) {
      for (const r of weekly(season(s, { drSave: 'beaver' }))) {
        if (r.dr.save?.hold) {
          const camp = r.dr.scenes.filter(x => x.step === 'save-campaign');
          if (camp.length) campaigns++;
          expect(r.dr.save.hold.campaign.length).toBeGreaterThan(0);
          repaid += r.dr.scenes.filter(x => x.kind === 'save:repaid').length;
        }
        fallout += r.dr.scenes.filter(x => x.kind === 'save:fallout' && x.step === 'cold-open').length;
      }
    }
    expect(campaigns).toBeGreaterThan(40);
    expect(repaid, 'no debt was ever repaid in twelve seasons').toBeGreaterThan(0);
    expect(fallout, 'no broken promise ever reached a cold open').toBeGreaterThan(0);
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

  it('live levers: 1 to 3, one pull each, and a hit rewires the same number', () => {
    const s = initSaves({ kind: 'tank', rng: rngFor(3), levers: 6, live: 3 });
    expect(s.live).toHaveLength(3);
    const tries = luckSave({ saves: s, losers: ['A', 'B', 'C', 'D', 'E'], rng: rngFor(11) });
    expect(tries).toHaveLength(5);
    expect(new Set(tries.map(t => t.queen)).size).toBe(5);
    expect(s.live).toHaveLength(3);
    expect(initSaves({ kind: 'tank', rng: rngFor(3), levers: 2, live: 3 }).live).toHaveLength(1);
  });
});

describe('the engine pieces', () => {
  it('a tank with one lever left always dunks', () => {
    const saves = initSaves({ kind: 'tank', rng: rngFor(5), levers: 3 });
    saves.left = [saves.live[0]];
    const [t] = luckSave({ saves, losers: ['Q'], rng: rngFor(9) });
    expect(t.saved).toBe(true);
    expect(saves.left).toHaveLength(3);
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
