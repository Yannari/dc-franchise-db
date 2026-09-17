// ══════════════════════════════════════════════════════════════════════
// tests/dr-all-stars.test.js — the All Stars mode
// (docs/superpowers/specs/2026-09-08-drag-race-all-stars-design.md)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { buildDragSeasonDocument } from '../js/dr/export.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];

// Deliberately WITHOUT a drag block: this is the unauthored roster queen the
// mode has to be able to cast.
function bareCast(n, seed) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
  }));
}

function season(seed, config = {}, cast = null) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return Object.assign({ bonds }, playDragSeason({
    cast: cast || bareCast(10, seed), seed: seed * 101 + 7, config,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  }));
}

describe('the mode', () => {
  it('is off unless asked for, and off changes nothing', () => {
    const a = season(4);
    const b = season(4, { drAllStars: false });
    expect(JSON.stringify(a.rows)).toBe(JSON.stringify(b.rows));
  });

  it('gives every queen a past, frozen on the season', () => {
    const res = season(4, { drAllStars: true });
    const pasts = res.state.allStars.pasts;
    expect(Object.keys(pasts)).toHaveLength(10);
    for (const p of Object.values(pasts)) {
      expect(p.rank).toBeGreaterThan(0);
      expect(typeof p.business).toBe('string');
    }
    expect(season(4, { drAllStars: true }).state.allStars.pasts).toEqual(pasts);
  });

  it('never casts a queen with the flat default craft block', () => {
    const res = season(4, { drAllStars: true });
    const crafts = res.state.allStars.craft;
    expect(Object.keys(crafts)).toHaveLength(10);
    for (const c of Object.values(crafts)) {
      expect(new Set(Object.values(c)).size).toBeGreaterThan(1);
    }
  });

  it('records the rule it ran', () => {
    expect(season(4, { drAllStars: true }).state.allStars.rule).toBe('legacy');
    expect(season(4, { drAllStars: true, drAllStarsRule: 'save' }).state.allStars.rule).toBe('save');
  });
});

const weekly = res => res.rows.filter(r => r.dr && !r.dr.finale);

describe('the legacy rule', () => {
  it('runs on every week with a room big enough for it', () => {
    const res = season(9, { drAllStars: true });
    const wide = weekly(res).filter(r => r.dr.lipsync && (r.dr.living?.length ?? 0) >= 5);
    expect(wide.length).toBeGreaterThan(3);
    for (const r of wide) expect(r.dr.lipsync.legacy).toBe(true);
  });

  it('nobody in the bottom ever sings on a legacy night', () => {
    const res = season(9, { drAllStars: true });
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const singers = r.dr.lipsync.singers || [r.dr.lipsync.a, r.dr.lipsync.b].filter(Boolean);
      for (const q of (r.dr.call?.bottom || [])) expect(singers).not.toContain(q);
    }
  });

  it('falls back to an ordinary bottom-two song once the room is too small', () => {
    const res = season(9, { drAllStars: true });
    const small = weekly(res).filter(r => (r.dr.living?.length ?? 0) < 4 && r.dr.lipsync);
    for (const r of small) expect(r.dr.lipsync.legacy).toBeFalsy();
  });
});

describe('the chart on a legacy night', () => {
  it('records the size of the bottom she was named in', () => {
    const res = season(11, { drAllStars: true });
    let checked = 0;
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const bottom = r.dr.call?.bottom || [];
      if (bottom.length < 2) continue;
      const want = bottom.length >= 3 ? 'BTM3' : 'BTM2';
      for (const q of bottom) {
        const cell = (r.dr.record?.[q] || []).slice(-1)[0];
        if (!cell) continue;
        expect(['ELIM', want]).toContain(cell);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(4);
  });

  it('marks the row as All Stars so the chart can word itself', () => {
    const res = season(11, { drAllStars: true });
    for (const r of weekly(res)) expect(r.dr.allStars?.rule).toBe('legacy');
    expect(weekly(season(11)).every(r => !r.dr.allStars)).toBe(true);
  });
});

describe('the campaign on a legacy night', () => {
  it('happens, and it happens before the song', () => {
    const res = season(21, { drAllStars: true });
    const pitches = weekly(res).flatMap(r => (r.dr.scenes || []).filter(s => s.kind === 'legacy:pitch'));
    expect(pitches.length).toBeGreaterThan(0);
    for (const p of pitches) expect(p.text.length).toBeGreaterThan(0);
    for (const r of weekly(res)) {
      const list = r.dr.scenes || [];
      const iPitch = list.findIndex(s => s.kind === 'legacy:pitch');
      const iSong = list.findIndex(s => s.step === 'lipsync');
      if (iPitch >= 0 && iSong >= 0) expect(iPitch).toBeLessThan(iSong);
    }
  });

  it('works the queens the critiques favoured, not the bottom', () => {
    const res = season(21, { drAllStars: true });
    let seen = 0;
    for (const r of weekly(res)) {
      const pitches = (r.dr.scenes || []).filter(s => s.kind === 'legacy:pitch');
      if (!pitches.length) continue;
      const bottom = r.dr.call?.bottom || [];
      /* Only the PITCHES are aimed at the power. The pushback rounds are the
         bottom queens going at each other, so their target is one of them by
         design. */
      for (const p of pitches.filter(x => String(x.data.move || '').startsWith('pitch-'))) {
        expect(bottom).not.toContain(p.data.target);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('a queen who pleaded with the eventual winner is likelier to survive', () => {
    let pleaded = 0, spared = 0;
    for (let s = 40; s < 70; s++) {
      const res = season(s, { drAllStars: true });
      for (const r of weekly(res)) {
        if (!r.dr.lipsync?.legacy || !r.dr.lipsync.eliminated) continue;
        const winner = r.dr.lipsync.chosenBy;
        const worked = new Set((r.dr.scenes || [])
          .filter(x => x.kind === 'legacy:pitch' && x.data.target === winner)
          .flatMap(x => x.data.players || []));
        for (const q of (r.dr.call?.bottom || [])) {
          if (!worked.has(q)) continue;
          pleaded++;
          if (q !== r.dr.lipsync.eliminated) spared++;
        }
      }
    }
    expect(pleaded).toBeGreaterThan(10);
    // Not a rule, a lean: most queens in a bottom survive it anyway, so this
    // only asserts the campaign is not actively hurting them.
    expect(spared / pleaded).toBeGreaterThan(0.4);
  });
});

describe('the arrivals, on All Stars', () => {
  it('say what she already did', () => {
    const res = season(31, { drAllStars: true });
    const premiere = weekly(res)[0];
    const resumes = (premiere.dr.scenes || []).filter(s => s.kind === 'arrival:resume');
    expect(resumes.length).toBeGreaterThan(4);
    for (const s of resumes) {
      expect(s.text.length).toBeGreaterThan(10);
      expect(s.text).not.toMatch(/\{/);
      expect(s.text).toMatch(/^Season \d/);
    }
  });

  it('do not, on an ordinary season', () => {
    const premiere = weekly(season(31))[0];
    expect((premiere.dr.scenes || []).filter(s => s.kind === 'arrival:resume')).toHaveLength(0);
  });
});

describe('what the season leaves behind', () => {
  it('records the craft each queen actually played with', () => {
    const res = season(41, { drAllStars: true });
    const doc = buildDragSeasonDocument(res.rows, { seasonNumber: 2 });
    const rows = doc.placements || [];
    expect(rows.length).toBeGreaterThan(0);
    for (const p of rows) {
      expect(p.dr?.craft, p.name).toBeTruthy();
      // The derived block is never the flat default it exists to prevent.
      expect(new Set(Object.values(p.dr.craft)).size).toBeGreaterThan(1);
    }
  });

  it('records it on an ordinary season too', () => {
    const doc = buildDragSeasonDocument(season(41).rows, { seasonNumber: 1 });
    for (const p of doc.placements || []) expect(p.dr?.craft).toBeTruthy();
  });
});

describe('the night runs in the All Stars order', () => {
  it('names the top two and the bottom BEFORE the room goes to Untucked', () => {
    const res = season(21, { drAllStars: true });
    let checked = 0;
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const list = r.dr.scenes || [];
      const iCall = list.findIndex(s => s.step === 'results');
      const iUntucked = list.findIndex(s => s.step === 'untucked');
      if (iCall < 0 || iUntucked < 0) continue;
      expect(iCall).toBeLessThan(iUntucked);
      checked++;
    }
    expect(checked).toBeGreaterThan(2);
  });

  it('so the bottom works the two queens who were actually named', () => {
    const res = season(21, { drAllStars: true });
    let seen = 0;
    for (const r of weekly(res)) {
      const pitches = (r.dr.scenes || []).filter(s => s.kind === 'legacy:pitch'
        && String(s.data.move || '').startsWith('pitch-'));
      if (!pitches.length) continue;
      const named = [...(r.dr.callAtCall?.high || []), ...(r.dr.call?.high || []), ...(r.dr.call?.win || [])];
      for (const p of pitches) { expect(named).toContain(p.data.target); seen++; }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('puts the call screen ahead of Untucked too', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = weekly(season(21, { drAllStars: true })).find(r => r.dr.lipsync?.legacy);
    const ids = dragScreens(row).map(s => s.id);
    expect(ids.indexOf('dr-results')).toBeLessThan(ids.indexOf('dr-untucked'));
  });
});

describe('the room already knows each other', () => {
  it('walks in with a history, not as strangers', () => {
    const res = season(55, { drAllStars: true });
    const h = res.state.allStars.history;
    expect(h.length).toBeGreaterThan(0);
    for (const x of h) {
      expect(['friend', 'rival', 'sent-home', 'mates']).toContain(x.kind);
      expect(x.a).not.toBe(x.b);
    }
  });

  it('gives somebody a grudge worth carrying', () => {
    let withGrudge = 0;
    for (let s = 50; s < 70; s++) {
      const res = season(s, { drAllStars: true });
      if ((res.state.power?.grudges || []).length) withGrudge++;
    }
    expect(withGrudge).toBeGreaterThan(8);
  });

  it('starts those bonds off zero', () => {
    const res = season(55, { drAllStars: true });
    const friend = res.state.allStars.history.find(x => x.kind === 'friend');
    const rival = res.state.allStars.history.find(x => x.kind === 'rival');
    const key = (a, b) => [a, b].sort().join('|');
    if (friend) expect(res.bonds[key(friend.a, friend.b)]).toBeGreaterThan(0);
    if (rival) expect(res.bonds[key(rival.a, rival.b)]).toBeLessThan(0);
  });

  it('changes nothing on an ordinary season', () => {
    expect(season(55).state.allStars).toBeUndefined();
    expect((season(55).state.power?.grudges || []).length).toBe(0);
  });
});

describe('alliances', () => {
  it('form in the room and reach the row', () => {
    let withAny = 0, rows = 0;
    for (let s = 60; s < 72; s++) {
      for (const r of weekly(season(s, { drAllStars: true }))) {
        rows++;
        if ((r.dr.alliances || []).length) withAny++;
      }
    }
    expect(rows).toBeGreaterThan(20);
    // Not every week has a circle, but a season should not be empty of them.
    expect(withAny).toBeGreaterThan(5);
  });

  it('are circles, not the whole cast', () => {
    for (let s = 60; s < 66; s++) {
      for (const r of weekly(season(s, { drAllStars: true }))) {
        for (const b of r.dr.alliances || []) {
          expect(b.members.length).toBeGreaterThanOrEqual(2);
          expect(b.members.length).toBeLessThanOrEqual(3);
          // The circles are the room at the START of the night, so a queen
          // eliminated tonight is legitimately still in one.
          const room = r.dr.roomAtStart?.length ? r.dr.roomAtStart : r.dr.living;
          for (const n of b.members) expect(room).toContain(n);
        }
      }
    }
  });

  it('never appear on an ordinary season', () => {
    for (const r of weekly(season(60))) expect(r.dr.alliances).toBeUndefined();
  });

  it('show up in the sidebar', async () => {
    const { _allianceRail } = await import('../js/vp-dr/style.js');
    const row = weekly(season(61, { drAllStars: true })).find(r => (r.dr.alliances || []).length);
    expect(row).toBeTruthy();
    const html = _allianceRail(row);
    expect(html).toContain('Aligned');
    for (const n of row.dr.alliances[0].members) expect(html).toContain(n);
  });
});

describe('the season says its own name', () => {
  it('the host welcomes them to All Stars, explains the rule and names the prize', () => {
    const premiere = weekly(season(80, { drAllStars: true }))[0];
    const kinds = (premiere.dr.scenes || []).map(s => s.kind);
    for (const k of ['arrival:allstars-welcome', 'arrival:allstars-rule', 'arrival:allstars-prize']) {
      expect(kinds).toContain(k);
    }
    const rule = (premiere.dr.scenes || []).find(s => s.kind === 'arrival:allstars-rule');
    expect(rule.text.toLowerCase()).toMatch(/top two|top\b/);
  });

  it('says nothing of the kind on an ordinary season', () => {
    const premiere = weekly(season(80))[0];
    expect((premiere.dr.scenes || []).some(s => String(s.kind).startsWith('arrival:allstars'))).toBe(false);
  });

  it('and the screens wear the season, not the flagship', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = weekly(season(80, { drAllStars: true }))[1];
    const html = dragScreens(row).map(s => s.html).join('');
    expect(html).toContain('dr-as-chip');
    expect(html).toContain('>All Stars<');
    // ...and an ordinary season is untouched.
    const plain = dragScreens(weekly(season(80))[1]).map(s => s.html).join('');
    expect(plain).not.toContain('dr-as-chip');
  });
});

describe('the lipstick is not spoiled', () => {
  /* A card on an EARLIER screen naming the queen the winner is about to pick
     is the one thing this format cannot survive, and it shipped once: the old
     `lipsync-legacy-choice` beat fired on the lip sync step, which now comes
     before the ceremony, so the song's screen announced her. */
  it('nothing before the ceremony says who she picked', () => {
    let checked = 0;
    for (let s = 90; s < 96; s++) {
      for (const r of weekly(season(s, { drAllStars: true }))) {
        const lip = r.dr.lipsync;
        if (!lip?.legacy || !lip.eliminated) continue;
        const list = r.dr.scenes || [];
        const iCeremony = list.findIndex(x => x.step === 'legacy-choice');
        expect(iCeremony).toBeGreaterThan(-1);
        for (const sc of list.slice(0, iCeremony)) {
          /* STRUCTURAL, not prose. The room talking about "who is going home"
             in the abstract is correct and says nothing; what leaked was a
             SCENE that carried the decision — the old stage beat named the
             holder and her target in its own data, one screen early. */
          expect(sc.data?.chosen).toBeUndefined();
          expect(sc.data?.eliminated).toBeUndefined();
          /* A campaign scene legitimately puts the two of them in a room --
             she is lobbying the queen who may end up holding it, which is the
             whole point of the night. Only a scene that carries the DECISION
             is a leak, and that is the `data` check above. */
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('and the ceremony still names her exactly once', () => {
    let checked = 0;
    for (let s = 90; s < 96; s++) {
      for (const r of weekly(season(s, { drAllStars: true }))) {
        const lip = r.dr.lipsync;
        if (!lip?.legacy || !lip.eliminated) continue;
        const reveal = (r.dr.scenes || []).filter(x => x.kind === 'legacy:reveal');
        expect(reveal).toHaveLength(1);
        expect(reveal[0].text).toContain(lip.eliminated);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });
});

describe('the call on a legacy night is the format\'s own', () => {
  it('names six: the top two, a high, a low, and two up for elimination', () => {
    const res = season(120, { drAllStars: true });
    let wide = 0;
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const c = r.dr.callAtCall || r.dr.call;
      if ((r.dr.living?.length ?? 0) < 8) continue;
      const named = new Set([...(c.win || []), ...(c.high || []), ...(c.low || []), ...(c.bottom || [])]);
      expect(named.size).toBe(6);
      expect(c.singers).toHaveLength(2);
      expect(c.bottom).toHaveLength(2);
      expect(c.low).toHaveLength(1);
      wide++;
    }
    // A ten-queen season only has a few weeks with eight still in the room.
    expect(wide).toBeGreaterThan(1);
  });

  it('records the queen who sang and lost as TOP2, not HIGH', () => {
    const res = season(120, { drAllStars: true });
    let checked = 0;
    for (const r of weekly(res)) {
      const lip = r.dr.lipsync;
      if (!lip?.legacy || !lip.winner) continue;
      const loser = (r.dr.call.singers || []).find(n => n !== lip.winner);
      if (!loser) continue;
      expect((r.dr.record?.[loser] || []).slice(-1)[0]).toBe('TOP2');
      expect((r.dr.record?.[lip.winner] || []).slice(-1)[0]).toBe('WIN');
      checked++;
    }
    expect(checked).toBeGreaterThan(3);
  });

  it('and the queen the panel called LOW is never the one who goes', () => {
    const res = season(120, { drAllStars: true });
    for (const r of weekly(res)) {
      const lip = r.dr.lipsync;
      if (!lip?.legacy || !lip.eliminated) continue;
      expect(r.dr.call.low || []).not.toContain(lip.eliminated);
      expect(r.dr.call.bottom).toContain(lip.eliminated);
      for (const q of (r.dr.call.low || [])) {
        expect((r.dr.record?.[q] || []).slice(-1)[0]).toBe('LOW');
      }
    }
  });
});
