// ══════════════════════════════════════════════════════════════════════
// pm-arrival-rules.test.js — Plan 4.5 phase 2: how arrivals and night one play
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason, perfectMatchScheduleFor } from '../js/pm/season.js';
import { withBookings } from '../js/pm/schedule.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

function season(seed, bookings = {}) {
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed, bookings }).rows;
}
const couplesOf = row => row.pm.couples.map(c => [...c].sort().join('+'));

describe('the arrival rules, when they play', () => {
  it('stand up: the bombshell only ever couples with somebody who stood', () => {
    let played = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const rows = season(seed, { 3: { arrivalRule: 'stand-up' }, 6: { arrivalRule: 'stand-up' } });
      for (const r of rows.filter(x => x.pm.arrivalRule === 'stand-up')) {
        played++;
        const stood = new Set(r.pm.events.filter(e => e.kind === 'stand-up').map(e => e.players[0]));
        for (const pick of r.pm.events.filter(e => e.kind === 'stand-up-pick')) {
          expect(stood.has(pick.players[1]), `s${seed} e${r.num}`).toBe(true);
          expect(couplesOf(r)).toContain([pick.players[0], pick.players[1]].sort().join('+'));
        }
        // Nobody standing leaves the bombshell uncoupled tonight.
        for (const none of r.pm.events.filter(e => e.kind === 'nobody-stands')) {
          expect(r.pm.couples.some(c => c.includes(none.players[0])), `s${seed} e${r.num}`).toBe(false);
        }
      }
    }
    expect(played).toBeGreaterThan(5);
  });
  it('the bombshell saves one: the saved one is coupled with them, the others are dumped', () => {
    let played = 0;
    for (let seed = 1; seed <= 20 && played < 3; seed++) {
      const rows = season(seed, { 3: { arrivalRule: 'saves' }, 6: { arrivalRule: 'saves' } });
      for (const r of rows.filter(x => x.pm.arrivalRule === 'saves')) {
        played++;
        const save = r.pm.events.find(e => e.kind === 'bombshell-save');
        const [bomb, saved, other] = save.players;
        expect(couplesOf(r)).toContain([bomb, saved].sort().join('+'));
        if (r.exits.length) expect(r.exits.map(x => x.name)).toContain(other);
        expect(r.exits.every(x => x.channel === 'bombshell' || x.channel === 'walk')).toBe(true);
      }
    }
    expect(played).toBeGreaterThan(0);
  });
  it('a rule booked on a night it cannot play is not applied', () => {
    const s = perfectMatchScheduleFor(3, { bombshells: 6, casa: 6 });
    const booked = withBookings(s, { 2: { arrivalRule: 'stand-up' }, 5: { firstFormat: 'profiles' } });
    expect(booked[1].arrivalRule).toBeUndefined();     // ep 2 is a recoupling
    expect(booked[4].firstFormat).toBeUndefined();     // ep 5 is a vote
  });
});

describe('night one', () => {
  for (const format of ['profiles', 'public', 'ranking']) {
    it(`${format}: every starter is coupled, one scene a couple`, () => {
      const rows = season(4, { 1: { firstFormat: format } });
      const r = rows[0];
      expect(r.pm.firstFormat).toBe(format);
      const kind = { profiles: 'profile-pick', public: 'public-couple', ranking: 'ranking-couple' }[format];
      const scenes = r.pm.events.filter(e => e.kind === kind);
      expect(scenes.length).toBe(5);                     // ten starters
      for (const e of scenes) expect(e.script.id.endsWith('.0')).toBe(false);
    });
  }
});

describe('new arrivals choose first at the recoupling', () => {
  it('the first picks of a recoupling after an arrival are the new arrivals', () => {
    let checked = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const rows = season(seed, { 3: { arrivalRule: 'dates' } });
      const arrived = rows[2].pm.events.filter(e => e.kind === 'entrance').map(e => e.players[0]);
      const picks = rows[3].pm.events.filter(e => e.kind === 'recouple-pick');
      const stillHere = arrived.filter(n => rows[3].pm.villa.includes(n) || picks.some(p => p.players[0] === n));
      if (!stillHere.length || !picks.length) continue;
      checked++;
      const firstPickers = picks.slice(0, stillHere.length).map(p => p.players[0]);
      for (const n of stillHere) if (picks.some(p => p.players[0] === n)) expect(firstPickers, `s${seed}`).toContain(n);
    }
    expect(checked).toBeGreaterThan(3);
  });
});

describe('the one-offs (phase 3)', () => {
  it('a returning islander was dumped before, and walks back in single', () => {
    let played = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const rows = season(seed, { 7: { oneOff: 'return' } });
      const r = rows[6];
      if (r.pm.oneOff !== 'return') continue;
      played++;
      const back = r.pm.returned;
      expect(rows.slice(0, 6).some(x => x.exits.some(e => e.name === back)), `s${seed}`).toBe(true);
      expect(rows[5].pm.villa).not.toContain(back);
      expect(r.pm.events[r.pm.momentFrom].kind).toBe('return-entrance');
    }
    expect(played).toBeGreaterThan(4);
  });
  it('the secret task sends nobody home', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const r = season(seed, { 6: { oneOff: 'mission' } })[5];
      if (r.pm.oneOff !== 'mission') continue;
      const [, girl, boy] = r.pm.events.find(e => e.kind === 'mission-dump').players;
      // The mission sends nobody home. Walking out afterwards is the
      // islander's own choice (seed 5: Isl10 walked, heartbroken), not the task's.
      const walked = new Set(r.exits.filter(e => e.channel === 'walk').map(e => e.name));
      expect(r.pm.villa).toEqual(expect.arrayContaining([girl, boy].filter(n => !walked.has(n))));
      expect(r.exits.filter(e => [girl, boy].includes(e.name) && e.channel !== 'walk')).toEqual([]);
    }
  });
  it('the sleepover villa dumps only the new arrivals nobody chose', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const r = season(seed, { 6: { oneOff: 'sleepover' } })[5];
      if (r.pm.oneOff !== 'sleepover') continue;
      const arrived = r.pm.events.filter(e => e.kind === 'entrance').map(e => e.players[0]);
      for (const x of r.exits.filter(e => e.channel === 'sleepover')) expect(arrived).toContain(x.name);
    }
  });
  it('the immune couple is never at risk that night', () => {
    let played = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const r = season(seed, { 5: { immunity: true }, 12: { immunity: true } }).filter(x => x.pm.immune);
      for (const x of r) {
        played++;
        expect((x.pm.bottom || []).flat().some(n => x.pm.immune.includes(n)), `s${seed} e${x.num}`).toBe(false);
        expect(x.exits.some(e => x.pm.immune.includes(e.name) && e.channel !== 'walk')).toBe(false);
      }
    }
    expect(played).toBeGreaterThan(5);
  });
});
