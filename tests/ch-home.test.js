// Somebody at home (life events: a partner who is not in the cast) on The Challenge: franchise-carry atHome,
// romance.js homeFactor, events.js home-talk / home-gossip / home-guilt, the intro card, the ledger record.
// The user, 2026-10-16: "if they are not clearly celibate from life events outside reality shows, does it
// count as cheating? does it have real life consequences?"
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { chLedgerRecord } from '../js/ch/ledger-record.js';
import { carriedFor } from '../js/franchise-carry.js';
import { challengeCast } from './helpers/ch-cast.js';

const STAGES = ['married', 'engaged', 'living-together', 'dating'];
let runs;
beforeAll(() => {
  runs = [11, 12, 13, 14, 15, 16, 17, 18].map(seed => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const atHome = names.filter((_, i) => i % 3 === seed % 3).map((n, i) => ({ name: n, whom: `Partner${i}`, stage: STAGES[(i + seed) % 4] }));
    const r = playChallengeSeason({ cast: names, background, seed, carried: { kin: [], bonds: [], sums: [], atHome }, options: { romance: true } });
    airSeason(r.state);
    return { r, names, atHome: new Set(atHome.map(x => x.name)) };
  });
});

describe('The Challenge: somebody at home', () => {
  it('the carry hands a partner who is not in the cast to the season', () => {
    const out = carriedFor([], {}, { lifeLog: [], lifeSeasons: [] });
    expect(Array.isArray(out.atHome)).toBe(true);
    for (const { r, atHome } of runs) expect(Object.keys(r.state.atHome).sort()).toEqual([...atHome].sort());
  });

  it('somebody spoken for starts a showmance less often than somebody single', () => {
    let att = 0, attN = 0, single = 0, singleN = 0;
    for (const { r, names, atHome } of runs) for (const n of names) {
      const had = r.state.couples.some(c => c.a === n || c.b === n);
      if (atHome.has(n)) { attN++; att += had; } else { singleN++; single += had; }
    }
    expect(att / attN).toBeLessThan(single / singleN * 0.75);
  });

  it('a showmance with somebody at home is marked, and the record carries it out', () => {
    let marked = 0;
    for (const { r, atHome } of runs) {
      for (const c of r.state.couples) {
        const who = [c.a, c.b].filter(n => atHome.has(n));
        expect([...(c.overlapping || [])].sort()).toEqual(who.sort());
        if (who.length) marked++;
      }
      const rec = chLedgerRecord(r.state, r);
      for (const [n, p] of Object.entries(rec.players)) for (const s of p.showmances) expect(!!s.overlapping, `${n} with ${s.partner}`).toBe(atHome.has(n));
    }
    expect(marked).toBeGreaterThan(0);
  });

  it('the scenes air, name the partner, and only gossip about somebody the house was told about', () => {
    const kinds = new Set();
    for (const { r } of runs) {
      const st = r.state;
      for (const e of st.episodes) for (const a of e.aired || []) {
        if (!/^home-/.test(a.kind)) continue;
        kinds.add(a.kind);
        const text = (a.script?.lines || []).map(l => l.text).join(' ');
        expect(text, `${a.kind} ep ${e.ep}`).not.toMatch(/\{\w+(\.\w+)?\}|undefined/);
        expect(text, `${a.kind} ep ${e.ep}: names the partner`).toContain(st.atHome[a.kind === 'home-gossip' ? a.scene.who[2] : a.scene.who[0]].name);
      }
      for (const sc of st.scenes.filter(s => s.kind === 'home-gossip')) {
        const told = st.scenes.find(s => (s.kind === 'home-talk' || (s.kind === 'home-guilt' && s.data.confess)) && s.who[0] === sc.who[2]);
        expect(told && told.id < sc.id, `gossip about ${sc.who[2]} before anybody was told`).toBe(true);
      }
    }
    expect([...kinds].sort()).toEqual(['home-gossip', 'home-guilt', 'home-talk']);
  });

  it('the intro card says who is waiting at home', () => {
    const { r, atHome } = runs[0];
    const n = [...atHome][0];
    expect(r.state.atHome[n].name).toBeTruthy();
  });
});
