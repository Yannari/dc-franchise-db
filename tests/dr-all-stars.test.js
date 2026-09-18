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

  /* ── THEY USED TO BE ALL STARS ONLY, AND THAT WAS HALF RIGHT ──────
     All Stars brings the HISTORY; the circles themselves are derived from
     bonds, which every season has by about week three. A flagship season
     with the Beaver in it is exactly the room they matter in — somebody is
     holding a save and the queens in danger have friends — and it was
     getting an Untucked where being in a circle meant nothing.
     So they are derived everywhere now, and what they REACH is what stays
     gated: on a season with no save and no lipstick there is no campaign for
     them to change, and nothing about the night moves. */
  it('are derived on an ordinary season too, and change nothing on a plain night', () => {
    const rows = weekly(season(60));
    expect(rows.some(r => (r.dr.alliances || []).length)).toBe(true);
    for (const r of rows) {
      expect((r.dr.scenes || []).some(sc => String(sc.kind).includes('circle-'))).toBe(false);
    }
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

describe('the save rule', () => {
  it('actually deals a save', () => {
    const res = season(130, { drAllStars: true, drAllStarsRule: 'save' });
    expect(res.state.allStars.rule).toBe('save');
    expect(res.state.saves?.kind).toBe('beaver');
    // ...and it is a save season, not a legacy one.
    for (const r of weekly(res)) expect(r.dr.lipsync?.legacy).toBeFalsy();
  });

  it('keeps the save the author actually picked', () => {
    const res = season(130, { drAllStars: true, drAllStarsRule: 'save', drSave: 'baguette' });
    expect(res.state.saves?.kind).toBe('baguette');
  });

  it('deals none on the legacy rule', () => {
    expect(season(130, { drAllStars: true }).state.saves?.kind ?? null).toBe(null);
  });
});

describe('the alliance rail', () => {
  it('shows on the call and the critiques, not only the werk room', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = weekly(season(61, { drAllStars: true })).find(r => (r.dr.alliances || []).length);
    expect(row).toBeTruthy();
    const screens = Object.fromEntries(dragScreens(row).map(s => [s.id, s.html]));
    for (const id of ['dr-results', 'dr-critiques', 'dr-untucked']) {
      expect(screens[id], id).toContain('Aligned');
    }
  });
});

describe('Revenge of the Queens', () => {
  const rev = seed => season(seed, { drAllStars: true, drAllStarsTwist: 'revenge' });
  const night = res => res.rows.find(r => r.dr?.revenge);

  it('is a WEEK, not a side event: it still has a call and still sends somebody home', () => {
    for (let s = 300; s < 306; s++) {
      const res = rev(s);
      const n = night(res);
      expect(n, `seed ${s}`).toBeTruthy();
      // The ordinary night happened around it.
      expect(n.dr.challenge).toBeTruthy();
      expect(n.dr.call).toBeTruthy();
      expect(n.dr.lipsync).toBeTruthy();
      expect(res.rows.filter(r => r.dr?.revenge)).toHaveLength(1);
    }
  });

  it('brings the whole eliminated cast back and pairs them with the room', () => {
    const res = rev(300);
    const n = night(res);
    const gone = res.rows.slice(0, res.rows.indexOf(n)).flatMap(r => (r.exits || []).map(x => x.name));
    // COPY before sorting: `.sort()` is in place, and the order assertion
    // below reads the same array.
    expect([...n.dr.revenge.returners].sort()).toEqual([...new Set(gone)].sort());
    /* The room as it stood THAT NIGHT — `living` on the row is after the
       elimination, and one of the queens who partnered a returner can be the
       one who went home. */
    const room = n.dr.roomAtStart?.length ? n.dr.roomAtStart : n.dr.living;
    for (const p of n.dr.revenge.pairs) {
      expect(n.dr.revenge.returners).toContain(p.back);
      expect(room).toContain(p.with);
    }
    /* Everybody who can be partnered is: a returner is left over only when
       there are more of them than there are queens still competing. */
    /* EVERY QUEEN IN THE ROOM IS IN A COUPLE. Booked away from the halfway
       point the two groups are not the same size, and the queens left over
       were performing alone on a night the panel judges couples — so a
       returner takes a second queen rather than anybody standing there
       unpaired. */
    expect(n.dr.revenge.pairs.map(p => p.with).sort()).toEqual([...room].sort());
    for (const p of n.dr.revenge.pairs) expect(n.dr.revenge.returners).toContain(p.back);
    // Last out walks in first.
    expect(n.dr.revenge.returners[0]).toBe(gone[gone.length - 1]);
  });

  it('names two couples and puts their returning halves on the song', () => {
    const res = rev(300);
    const n = night(res);
    expect(n.dr.revenge.couples).toHaveLength(2);
    expect(n.dr.revenge.singers).toHaveLength(2);
    for (const c of n.dr.revenge.couples) expect(n.dr.revenge.singers).toContain(c.back);
  });

  it('sings the returners, not the competing queens — one song for the night', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      const back = n.dr.revenge.returners;
      expect(n.dr.lipsync.queens.every(q => back.includes(q)), `seed ${seed}`).toBe(true);
      expect([...n.dr.lipsync.queens].sort()).toEqual([...n.dr.revenge.singers].sort());
      // And nobody in the competition sang: there is no lip sync for the win.
      expect(n.dr.call.singers.every(q => back.includes(q))).toBe(true);
    }
  });

  it('never names a returner on the call — her couple carries her', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      const c = n.dr.call;
      const called = [...c.win, ...c.high, ...c.low, ...(c.atRisk || []), ...c.bottom, ...c.safe];
      expect(called.filter(q => n.dr.revenge.returners.includes(q)), `seed ${seed}`).toEqual([]);
    }
  });

  it('gives the week to the competing half of the winning couple', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      const won = n.dr.revenge.couples.find(c => c.back === n.dr.revenge.winner);
      expect(won, `seed ${seed}`).toBeTruthy();
      expect(n.dr.revenge.weekWinner).toBe(won.with);
      expect(n.dr.call.win).toEqual([won.with]);
    }
  });

  it('hands the lipstick to the queen who won her way back in', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      expect(n.dr.lipsync.chosenBy, `seed ${seed}`).toBe(n.dr.revenge.winner);
      // And she spends it out of the bottom the host named, on somebody still in it.
      expect(n.dr.call.bottom).toContain(n.dr.lipsync.eliminated);
    }
  });

  it('sends the bottom to lobby the two queens it already sent home', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      if (!n.dr.legacyCampaign) continue;
      expect([...n.dr.legacyCampaign.targets].sort(), `seed ${seed}`)
        .toEqual([...n.dr.revenge.singers].sort());
    }
  });

  it('puts the winner back in with her record intact', () => {
    const res = rev(300);
    const n = night(res);
    const who = n.dr.revenge.winners[0];
    expect(who).toBeTruthy();
    const before = res.rows[res.rows.indexOf(n) - 1];
    expect(before.dr.living).not.toContain(who);
    const after = res.rows.slice(res.rows.indexOf(n) + 1).find(r => r.dr?.living);
    expect(after.dr.living).toContain(who);
    // Her chart row continued rather than restarting.
    expect((res.state.record[who] || []).length).toBeGreaterThan(3);
  });

  it('narrates the door, the pairing and the song', () => {
    const res = rev(300);
    const kinds = new Set((night(res).dr.scenes || []).map(x => x.kind));
    for (const k of ['revenge:open', 'revenge:walk', 'revenge:rule', 'revenge:pair',
      'revenge:couples', 'revenge:song']) {
      expect(kinds.has(k), k).toBe(true);
    }
    // Every one of them says something.
    for (const sc of (night(res).dr.scenes || []).filter(x => String(x.kind).startsWith('revenge:'))) {
      expect(sc.text.length, sc.kind).toBeGreaterThan(10);
      expect(sc.text).not.toMatch(/\{/);
    }
  });

  it('and she walks through the werk room door the week after', () => {
    const res = rev(300);
    const at = res.rows.indexOf(night(res));
    const who = res.rows[at].dr.revenge.winners[0];
    const next = res.rows[at + 1];
    expect(next.dr.returned?.name).toBe(who);
    expect(next.dr.returned.revenge).toBe(true);
    expect(next.dr.lipsync?.eliminated).not.toBe(who);
  });

  it('never runs without the mode or the twist', () => {
    for (const cfg of [{}, { drAllStars: true }, { drAllStarsTwist: 'revenge' }]) {
      expect(season(301, cfg).rows.filter(r => r.dr?.revenge)).toHaveLength(0);
    }
  });
});

describe('when Revenge happens', () => {
  const night = res => res.rows.find(r => r.dr?.revenge);

  it('is the show and not the author placing it, by default', () => {
    for (let s = 310; s < 314; s++) {
      const res = season(s, { drAllStars: true, drAllStarsTwist: 'revenge' });
      expect(night(res).dr.living.length).toBeLessThanOrEqual(6);
    }
  });

  it('or the episode the author asks for', () => {
    for (const ep of [5, 6]) {
      const res = season(311, { drAllStars: true, drAllStarsTwist: 'revenge', drAllStarsTwistEp: ep });
      expect(night(res)?.num, `episode ${ep}`).toBe(ep);
    }
  });

  it('and is refused while nobody has gone home', () => {
    const res = season(311, { drAllStars: true, drAllStarsTwist: 'revenge', drAllStarsTwistEp: 1 });
    expect(res.rows.filter(r => r.dr?.revenge)).toHaveLength(0);
  });
});

describe('the call screen names the top two', () => {
  it('reads HIGH, TOP2, TOP2 rather than three HIGHs', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const res = season(120, { drAllStars: true });
    const row = weekly(res).find(r => r.dr.lipsync?.legacy
      && (r.dr.callAtCall || r.dr.call).high?.length >= 3);
    expect(row).toBeTruthy();
    const html = Object.fromEntries(dragScreens(row).map(s => [s.id, s.html]))['dr-results'];
    const stamps = [...html.matchAll(/class="dr-stamp[^"]*"[^>]*>([A-Z0-9]+)</g)].map(m => m[1]);
    expect(stamps.filter(x => x === 'TOP2')).toHaveLength(2);
    expect(stamps.filter(x => x === 'HIGH').length).toBeGreaterThan(0);
  });
});

describe('the third queen in the top is not told she is in the top two', () => {
  it('gives the stakes line to the two who sing, and an ordinary high to the rest', () => {
    let checked = 0;
    for (let s = 120; s < 126; s++) {
      const res = season(s, { drAllStars: true });
      for (const r of weekly(res)) {
        if (!r.dr.lipsync?.legacy) continue;
        const c = r.dr.callAtCall || r.dr.call;
        const singers = new Set(r.dr.call.singers || []);
        const extra = (c.high || []).filter(n => !singers.has(n));
        if (!extra.length) continue;
        for (const n of extra) {
          const said = (r.dr.scenes || []).find(x => x.kind === 'stage:result-high'
            && (x.data?.players || []).includes(n));
          if (!said) continue;
          expect(said.text.toLowerCase(), `${n} was told she is in the top two`)
            .not.toMatch(/top two|hold the power|lip sync tonight/);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(2);
  });
});

describe('an elimination twist booked on an All Stars episode', () => {
  const play = sched => season(414, { drAllStars: true, drSchedule: sched });

  it('owns its own night, and the legacy rule resumes after it', () => {
    const res = play([{ episode: 4, doubleElimination: true }]);
    const rows = weekly(res);
    const four = rows.find(r => r.num === 4);
    expect(four.dr.lipsync?.legacy).toBeFalsy();
    // An author who books a double elimination is owed two queens.
    expect((four.exits || []).length).toBe(2);
    // ...and the week after is a legacy night again.
    const five = rows.find(r => r.num === 5);
    if (five && (five.dr.living?.length ?? 0) >= 5) expect(five.dr.lipsync?.legacy).toBe(true);
  });

  it('so a legacy night never loses its LOW to a widened bottom', () => {
    const res = play([{ episode: 4, doubleElimination: true }]);
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      expect(r.dr.call.bottom).toHaveLength(2);
      expect((r.dr.call.low || []).length).toBeGreaterThan(0);
    }
  });

  it('and a no-elimination week is not a legacy week either', () => {
    const res = play([{ episode: 4, noElimination: true }]);
    const four = weekly(res).find(r => r.num === 4);
    expect(four.dr.lipsync?.legacy).toBeFalsy();
    expect((four.exits || []).length).toBe(0);
  });
});

describe('the campaign feels like the era', () => {
  it('runs a dozen beats, not four', () => {
    let nights = 0; let beats = 0;
    for (let s = 1; s <= 6; s++) {
      for (const r of weekly(season(s * 331, { drAllStars: true }))) {
        if (!r.dr.lipsync?.legacy) continue;
        nights++;
        beats += (r.dr.scenes || []).filter(x => x.kind === 'legacy:pitch').length;
      }
    }
    expect(nights).toBeGreaterThan(20);
    // Measured at 12.6 a night; four was the bug.
    expect(beats / nights).toBeGreaterThan(8);
  });

  it('has the room lobbying and somebody playing both sides', () => {
    const moves = new Set();
    for (let s = 1; s <= 6; s++) {
      for (const r of weekly(season(s * 331, { drAllStars: true }))) {
        for (const x of (r.dr.scenes || []).filter(y => y.kind === 'legacy:pitch')) moves.add(x.data.move);
      }
    }
    for (const m of ['lobby-against', 'lobby-for', 'played-both']) expect(moves.has(m), m).toBe(true);
  });

  it('and the pinned campaign stage draws on it', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = weekly(season(777, { drAllStars: true })).find(r => r.dr.legacyCampaign);
    expect(row).toBeTruthy();
    const html = Object.fromEntries(dragScreens(row).map(s => [s.id, s.html]))['dr-untucked'];
    expect(html).toContain('svx-pod');
    expect(html).toContain('might hold it');
    expect(html).toContain('the campaign');
  });
});

describe('one stage for the whole campaign night', () => {
  it('animates every card, not only the pitches', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = weekly(season(777, { drAllStars: true })).find(r => r.dr.legacyCampaign);
    dragScreens(row);
    const states = (globalThis.window?._svx || {}).untucked;
    expect(states?.steps?.length).toBeGreaterThan(20);
    // Every step says something and lights somebody: the lounge scenes used
    // to return a dead frame, so the stage sat frozen through half the night.
    expect(states.steps.filter(s => s.caption).length).toBe(states.steps.length);
    expect(states.steps.filter(s => s.talk).length).toBe(states.steps.length);
  });

  it('puts the room on the stage behind the two sides of it', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = weekly(season(777, { drAllStars: true })).find(r => r.dr.legacyCampaign);
    const html = Object.fromEntries(dragScreens(row).map(s => [s.id, s.html]))['dr-untucked'];
    expect((html.match(/svx-bystander/g) || []).length).toBeGreaterThan(2);
    /* BOTH stages are on the page now: the night starts as an ordinary
       Untucked and becomes the campaign when the campaigning starts, and the
       reveal hook swaps them. */
    expect(html).toContain('rmx-cards');
    expect(html).toContain('svx-untucked');
  });
});

describe('a legacy bottom is two, and three only on a real tie', () => {
  /* Two paths widened it and both ate the LOW: a booked double elimination,
     and the season-wide "triple lip sync on a tie", which fired on nearly
     every week because the queen it compares against is the LOW — the one
     immediately above the bottom, so they are always close. Reported twice
     as "three BTM2 and no LOW". A genuine dead heat naming three is a real
     night and still happens; it is meant to be rare. */
  it('is two unless the panel genuinely cannot split them', () => {
    let nights = 0; let wide = 0;
    for (const extra of [{}, { drTripleLipsync: true }, { drTripleLipsync: true, drImmunity: true }]) {
      for (let s = 1; s <= 5; s++) {
        for (const r of weekly(season(s * 77, { drAllStars: true, ...extra }))) {
          if (!r.dr.lipsync?.legacy) continue;
          nights++;
          const n = r.dr.call.bottom.length;
          expect([2, 3]).toContain(n);
          if (n === 3) wide++;
          // The LOW only disappears when the tie took her.
          if (n === 2) expect((r.dr.call.low || []).length).toBeGreaterThan(0);
        }
      }
    }
    expect(nights).toBeGreaterThan(40);
    // Rare: it was over half of every season with the box ticked.
    expect(wide / nights).toBeLessThan(0.15);
  });
});

describe('the campaign night starts as an ordinary Untucked', () => {
  it('shows the lounge stage until the campaigning starts, then the campaign', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = weekly(season(777, { drAllStars: true })).find(r => r.dr.legacyCampaign);
    document.body.innerHTML = Object.fromEntries(
      dragScreens(row).map(s => [s.id, s.html]))['dr-untucked'];
    const hook = window._drRevealExtra?.untucked;
    expect(hook).toBeTypeOf('function');
    const camp = () => document.getElementById('svx-untucked');
    const lounge = () => document.getElementById(`rmx-u${row.num}`);
    const firstCamp = (row.dr.scenes || []).filter(sc => sc.step === 'untucked')
      .findIndex(sc => sc.data?.campaign);
    expect(firstCamp).toBeGreaterThan(0);
    hook(0);
    expect(lounge().hidden, 'the lounge should open the night').toBe(false);
    expect(camp().hidden).toBe(true);
    hook(firstCamp + 4);
    expect(camp().hidden, 'the campaign should take over').toBe(false);
    expect(lounge().hidden).toBe(true);
  });
});

describe('the panel judges the couple', () => {
  it('moves a queen with the partner she was handed', async () => {
    const { pairJudging } = await import('../js/dr/revenge.js');
    const ranking = [
      { name: 'A', meanRank: 1 }, { name: 'B', meanRank: 2 },
      { name: 'C', meanRank: 3 }, { name: 'D', meanRank: 4 },
    ];
    const pairs = [{ with: 'A', back: 'W' }, { with: 'B', back: 'X' },
      { with: 'C', back: 'Y' }, { with: 'D', back: 'Z' }];
    // B was handed the best returner of the four; A the worst.
    const craft = { W: 1, X: 9, Y: 2, Z: 3 };
    const out = pairJudging({ ranking, pairs, craftOf: n => craft[n] });
    expect(out.map(r => r.name)).toEqual(['B', 'A', 'C', 'D']);
    // Every row says who she stood with, and remembers what she was alone.
    for (const r of out) {
      expect(r.mate).toBeTruthy();
      expect(r.soloRank).toBeTypeOf('number');
    }
  });

  it('leaves an ordinary night exactly as the panel ranked it', async () => {
    const { pairJudging } = await import('../js/dr/revenge.js');
    const ranking = [{ name: 'A', meanRank: 1 }, { name: 'B', meanRank: 2 }];
    expect(pairJudging({ ranking, pairs: [] })).toBe(ranking);
  });
});

describe('one song, one screen', () => {
  const rev = seed => season(seed, { drAllStars: true, drAllStarsTwist: 'revenge' });
  const night = res => res.rows.find(r => r.dr?.revenge);

  it('draws the couples, the song and the return on the lip sync screen', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = night(rev(300));
    const ids = dragScreens(row).map(x => x.id);
    // The night has ONE lip sync, so it has one lip sync screen.
    expect(ids).not.toContain('dr-revenge-song');
    const html = Object.fromEntries(dragScreens(row).map(x => [x.id, x.html]))['dr-lipsync'];
    const kindsOn = (row.dr.scenes || [])
      .filter(sc => ['revenge-song', 'lipsync', 'revenge-back'].includes(sc.step) && sc.text);
    expect(kindsOn.some(sc => sc.kind === 'revenge:couples')).toBe(true);
    expect(kindsOn.some(sc => sc.step === 'lipsync')).toBe(true);
    expect(kindsOn.some(sc => sc.kind === 'revenge:power')).toBe(true);
    /* The screen escapes quotes and dashes, so compare on letters alone.
       Only the beats that are not reveal-gated: the verdict and the lines
       around it are withheld until the reader clicks, which is the spoiler
       rule this screen has always had. */
    /* ENTITIES FIRST. Stripping punctuation alone leaves the NAME of the
       entity behind — `&quot;` becomes the letters "quot" in the middle of
       the sentence — so a line that is on the screen reads as missing. */
    const plain = t => String(t).replace(/&[a-z]+;/g, ' ')
      .toLowerCase().replace(/[^a-z0-9]+/g, '');
    const page = plain(html);
    /* The opening of the screen, which is never reveal-gated: the couples
       being called and the two of them taking the stage. How far down the
       column the at-rest render reaches depends on the season's own dice, so
       asserting on the closing beats makes the test a seed check. */
    const shown = kindsOn.filter(sc => /^revenge:(couples|song)$/.test(sc.kind));
    expect(shown.length).toBe(2);
    for (const sc of shown) expect(page, sc.kind).toContain(plain(sc.text).slice(0, 40));
    // And it says, in as many words, that these two are not in the competition.
    expect(html).toContain('Lip Sync For Her Place');
  });

  it('never tells an eliminated queen she is the top two', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      const said = (n.dr.scenes || []).filter(sc => sc.step === 'results' && sc.text)
        .map(sc => sc.text).join(' ');
      // The stakes line is addressed to the two returners; it must not call
      // them the top two, and it must not promise either of them a life.
      const stakes = (n.dr.scenes || [])
        .find(sc => sc.kind === 'stage:call-stakes')?.text || '';
      expect(stakes, `seed ${seed}`).toBeTruthy();
      expect(/lip sync for your life|you are the top two/i.test(stakes)).toBe(false);
      // And the queens who ARE in the top are told it is their couple.
      expect(/couple/i.test(said), `seed ${seed}`).toBe(true);
    }
  });

  it('announces the return before it announces the power', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      const order = (n.dr.scenes || [])
        .filter(sc => ['lipsync', 'revenge-back'].includes(sc.step) && sc.text);
      const backAt = order.findIndex(sc => sc.kind === 'stage:lipsync-win-name');
      const powerAt = order.findIndex(sc => sc.kind === 'revenge:power');
      expect(backAt, `seed ${seed}`).toBeGreaterThan(-1);
      expect(powerAt).toBeGreaterThan(backAt);
      expect(order[backAt].text).toMatch(/back|returning|not any more|pack your things/i);
    }
  });
});

describe('the pairing is on the screen, not only in the prose', () => {
  const rev = seed => season(seed, { drAllStars: true, drAllStarsTwist: 'revenge' });
  const night = res => res.rows.find(r => r.dr?.revenge);

  it('draws a board of couples in the rail of every screen that night', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = night(rev(300));
    const byId = Object.fromEntries(dragScreens(row).map(s => [s.id, s.html]));
    for (const id of ['dr-revenge', 'dr-critiques', 'dr-results']) {
      expect(byId[id], id).toBeTruthy();
      expect(byId[id], `${id} has no pairing board`).toContain('dr-pairs');
      // Both halves of every couple are named on it.
      for (const p of row.dr.revenge.pairs) {
        expect(byId[id], `${id} drops ${p.with} + ${p.back}`).toContain(p.back);
      }
    }
  });

  it('keeps the board through every reveal, not just the first', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = night(rev(300));
    dragScreens(row);
    for (const key of ['critiques', 'results']) {
      const panels = (window._drSidebar || {})[key] || [];
      expect(panels.length, key).toBeGreaterThan(0);
      for (const html of panels) expect(html, `${key} loses the board on reveal`).toContain('dr-pairs');
    }
  });

  it('stamps the two top couples TOP2 rather than a third HIGH', () => {
    for (const seed of [300, 42, 77]) {
      const n = night(rev(seed));
      const tops = n.dr.revenge.couples.map(c => c.with);
      const rec = n.dr.results || {};
      const resultOf = q => rec[q] || null;
      // One of them took the week; the other is the top two.
      const other = tops.find(q => !n.dr.call.win.includes(q));
      if (!other || !resultOf(other)) continue;
      expect(resultOf(other), `seed ${seed}`).toBe('TOP2');
    }
  });
});

describe('a queen whose portrait file is missing', () => {
  it('gets her initials rather than a broken image', async () => {
    const { _portrait } = await import('../js/vp-dr/style.js');
    const html = _portrait('Scary Girl', { format: 'drag-race', num: 3 }, { size: 42 });
    if (html.includes('<img')) {
      // The img removes itself and the wrapper draws the initials in its place.
      expect(html).toContain('onerror=');
      expect(html).toContain('dr-bust-off');
      expect(html).toMatch(/data-in="[^"]+"/);
    } else {
      expect(html).toContain('dr-initials');
    }
  });
});

describe('why she chose that lipstick', () => {
  const as = seed => season(seed, { drAllStars: true });

  it('says it in her own voice, naming the queen she did not write', () => {
    const res = as(7);
    const rows = res.rows.filter(r => (r.dr.scenes || [])
      .some(sc => sc.kind === 'legacy:confessional'));
    expect(rows.length).toBeGreaterThan(3);
    for (const row of rows) {
      const c = row.dr.scenes.find(sc => sc.kind === 'legacy:confessional');
      expect(c.data.confessional).toBe(true);
      expect(c.data.who).toBe(row.dr.lipsync.chosenBy);
      expect(c.text.length).toBeGreaterThan(40);
      // It is her talking, not narration about her.
      expect(c.text).toMatch(/"/);
    }
    /* MOST of them name the queen she ended — not all, because the card sits
       directly under the reveal that just said the name, and a line forced to
       repeat it reads like a form being filled in. */
    /* Over several seasons, not one: which lines get drawn is the season's
       dice, and a floor measured on a single draw goes red the moment an
       unrelated change moves the rng. */
    let named = 0; let total = 0;
    for (const seed of [7, 19, 42, 77, 300]) {
      for (const r of as(seed).rows) {
        const c = (r.dr.scenes || []).find(sc => sc.kind === 'legacy:confessional');
        if (!c || !r.dr.lipsync?.eliminated) continue;
        total += 1;
        if (c.text.includes(r.dr.lipsync.eliminated)) named += 1;
      }
    }
    expect(named / total).toBeGreaterThan(0.4);
  });

  it('draws it as a piece to camera, not as a scene in the room', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = as(7).rows.find(r => (r.dr.scenes || [])
      .some(sc => sc.kind === 'legacy:confessional'));
    const html = Object.fromEntries(dragScreens(row).map(x => [x.id, x.html]))['dr-legacy'];
    expect(html).toContain('dr-conf');
    expect(html).toContain('confessional');
  });

  it('does not say the same thing twice in one season', () => {
    for (const seed of [7, 19, 42]) {
      const seen = new Map();
      for (const row of as(seed).rows) {
        for (const sc of (row.dr.scenes || [])) {
          if (sc.step !== 'legacy-choice' && !String(sc.kind).startsWith('shadow:')) continue;
          if (!sc.text) continue;
          const sig = `${sc.kind}|${sc.text.replace(/Q\d+/g, 'Q')}`;
          seen.set(sig, (seen.get(sig) || 0) + 1);
        }
      }
      const total = [...seen.values()].reduce((a, b) => a + b, 0);
      const repeats = [...seen.values()].reduce((a, b) => a + (b - 1), 0);
      /* The pools draw without replacement across the season, so what is left
         is a pool genuinely running out — not the same line three times in
         five episodes, which is what this was. */
      expect(repeats / total, `seed ${seed}`).toBeLessThan(0.2);
    }
  });

  it('is written the way the show speaks', async () => {
    const { LEGACY_BEATS } = await import('../js/dr/data/legacy-beats.js');
    for (const [why, pool] of Object.entries(LEGACY_BEATS.confessional)) {
      expect(pool.length, `${why} has too few variants`).toBeGreaterThan(4);
      expect(pool.some(l => l.includes('{x}')), `${why} never names the queen she chose`).toBe(true);
      for (const line of pool) {
        // Spoken, not written: it is in quotes and it is not a paragraph.
        expect(line, line.slice(0, 40)).toMatch(/"/);
        expect(line.length, `too long: ${line.slice(0, 50)}`).toBeLessThan(330);
      }
      // No two lines open the same way.
      const opens = pool.map(l => l.slice(0, 22));
      expect(new Set(opens).size, `${why} repeats an opening`).toBe(pool.length);
    }
  });

  it('gives the decision more than one reason across a season', () => {
    const whys = new Set();
    /* A WIDER SWEEP THAN FIVE SEASONS. The spread is a property of the rule,
       not of a seed: measured across forty seasons it is panel 68%,
       competition 18%, friendship 7%, a promise 3%, then fairness, history
       and her circle. Five seeds can miss the tail entirely, and did the
       first time an unrelated change moved the rng stream. */
    for (const seed of [7, 19, 42, 77, 300, 101, 202, 303, 404, 505, 606, 707]) {
      for (const row of as(seed).rows) if (row.dr.lipsync?.why) whys.add(row.dr.lipsync.why);
    }
    /* It used to be three labels and 82% of nights came back `panel`. The
       protective half of the score — a friend, her circle, a promise made in
       Untucked — now has names of its own. */
    expect(whys.size).toBeGreaterThan(3);
    expect([...whys].some(w => ['friend', 'bloc', 'plea', 'turn'].includes(w))).toBe(true);
  });

  it('only blames the panel when the panel actually had her last', () => {
    let panel = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 19, 42, 77, 300]) {
      for (const row of as(seed).rows) {
        const ls = row.dr.lipsync;
        if (ls?.why !== 'panel') continue;
        panel += 1;
        /* The call as the host made it, worst LAST. `panel` selects prose
           that says "they told us" and "she was the weakest of them" — said
           about a queen the judges had ranked ABOVE the other one in 6% of
           ceremonies, which a reader caught by comparing it with the
           critiques on the same screen. A queen who goes against the room is
           a better story than a queen who lies about it: that case is
           `own-read` now, or the real term that carried it. */
        const bottom = row.dr.callAtCall?.bottom?.length
          ? row.dr.callAtCall.bottom : (row.dr.call?.bottom || []);
        expect(ls.eliminated, `${seed}/${row.num}: the panel had ${bottom[bottom.length - 1]} last`)
          .toBe(bottom[bottom.length - 1]);
      }
    }
    expect(panel).toBeGreaterThan(20);
  });

  it('has a reason for going against the room, and uses it', () => {
    const whys = [];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 19, 42, 77, 300]) {
      for (const row of as(seed).rows) if (row.dr.lipsync?.why) whys.push(row.dr.lipsync.why);
    }
    // Written and reachable: the pool exists because this night happens.
    expect(whys).toContain('own-read');
  });

  it('names the queen she protected when one was protected', () => {
    for (const seed of [7, 19, 42, 77, 300]) {
      for (const row of as(seed).rows) {
        const ls = row.dr.lipsync;
        if (!ls?.why || !['friend', 'bloc', 'plea'].includes(ls.why)) continue;
        expect(ls.spared, `${seed}/${row.num}`).toBeTruthy();
        expect(ls.spared).not.toBe(ls.eliminated);
        // And the bottom she was standing in contained both of them.
        expect(row.dr.call.bottom).toContain(ls.spared);
      }
    }
  });
});

describe('the other lipstick', () => {
  const as = seed => season(seed, { drAllStars: true });

  it('asks the runner-up the morning after, and she answers or she does not', () => {
    let asked = 0; const kinds = new Set();
    for (const seed of [7, 19, 42, 77, 300]) {
      for (const row of as(seed).rows) {
        const sh = (row.dr.scenes || []).filter(sc => String(sc.kind).startsWith('shadow:'));
        if (!sh.length) continue;
        asked += 1;
        expect(sh[0].kind).toBe('shadow:ask');
        expect(sh[0].step).toBe('cold-open');
        for (const x of sh) kinds.add(x.kind);
        // Exactly one of the three answers, never two.
        const answers = sh.filter(x => /shadow:(same|different|kept)$/.test(x.kind));
        expect(answers.length, `${seed}/${row.num}`).toBe(1);
      }
    }
    expect(asked).toBeGreaterThan(10);
    expect(kinds.has('shadow:same')).toBe(true);
    expect(kinds.has('shadow:kept')).toBe(true);
    expect(kinds.has('shadow:different')).toBe(true);
  });

  it('costs her when she names a queen who is still in the room', () => {
    let found = 0;
    for (const seed of [7, 19, 42, 77, 300, 101, 202]) {
      const res = as(seed);
      for (const row of res.rows) {
        const diff = (row.dr.scenes || []).find(sc => sc.kind === 'shadow:different');
        if (!diff) continue;
        found += 1;
        const named = (row.dr.events || []).find(e => e.type === 'shadow:named');
        if (!named) continue;
        // The bond goes, and the grudge is on the ledger for the next ceremony.
        expect(named.bond[0][2]).toBeLessThan(0);
        const [by, against] = [named.players[1], named.players[0]];
        expect(res.state.power.grudges.some(g => g.by === by && g.against === against)).toBe(true);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('refuses rarely, and never more than twice in a season', () => {
    const per = [];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 19, 42, 77, 300, 101]) {
      let kept = 0;
      for (const row of as(seed).rows) {
        kept += (row.dr.scenes || []).filter(sc => sc.kind === 'shadow:kept').length;
      }
      per.push(kept);
    }
    /* SHE ALMOST ALWAYS TELLS. It used to be 39% of mornings — four a season
       — and it refused hardest on the night worth hearing, because the name
       that differs is the expensive one. Telling is the default now: a queen
       only holds it back when she has something to hold back, and the season
       stops at two, because a room where somebody is always being mysterious
       is a room where nobody is. Measured over thirty seasons: mean 0.6, max
       2, and the interesting reveal more than doubled. */
    expect(Math.max(...per), 'a season refused more than twice').toBeLessThanOrEqual(2);
    const mean = per.reduce((a, b) => a + b, 0) / per.length;
    expect(mean, 'refusing is supposed to be rare').toBeLessThan(1.2);
  });

  it('never opens it on the night — it is next week or never', () => {
    for (const seed of [7, 19, 42]) {
      for (const row of as(seed).rows) {
        const sh = (row.dr.scenes || []).filter(sc => String(sc.kind).startsWith('shadow:'));
        const cer = (row.dr.scenes || []).filter(sc => sc.step === 'legacy-choice');
        if (!sh.length || !cer.length) continue;
        // Both can happen in one episode, but the shadow is the MORNING one.
        for (const x of sh) expect(x.step).toBe('cold-open');
      }
    }
  });
});

describe('the Jury of Queer Peers', () => {
  const jury = seed => season(seed, {
    drAllStars: true, drAllStarsJury: true, drFinale: 'perform-then-lipsync',
  });
  const fin = res => res.rows[res.rows.length - 1];

  it('lets the queens who went home decide who sings for the crown', () => {
    const res = jury(7);
    const row = fin(res);
    const ballots = (row.dr.scenes || []).filter(sc => sc.kind === 'jury:ballot');
    expect(ballots.length).toBeGreaterThan(2);
    // Every juror is a queen this season eliminated, and nobody votes twice.
    const jurors = ballots.map(b => b.data.juror);
    expect(new Set(jurors).size).toBe(jurors.length);
    for (const j of jurors) expect(res.state.out).toContain(j);
    // And every vote is for somebody who is actually in the finale.
    const finalists = row.dr.finale.placements;
    for (const b of ballots) expect(finalists).toContain(b.data.voted);
  });

  it('sends the two best-supported through, and the rest never sing', () => {
    for (const seed of [7, 19, 42]) {
      const row = fin(jury(seed));
      const ballots = (row.dr.scenes || []).filter(sc => sc.kind === 'jury:ballot');
      if (!ballots.length) continue;
      const tally = {};
      for (const b of ballots) tally[b.data.voted] = (tally[b.data.voted] || 0) + 1;
      const through = (row.dr.scenes || []).find(sc => sc.kind === 'jury:through').data.through;
      expect(through).toHaveLength(2);
      // Nobody outside the pair beat either of them on votes.
      const cut = row.dr.finale.placements.filter(n => !through.includes(n));
      for (const c of cut) {
        for (const t of through) {
          expect((tally[c] || 0), `seed ${seed}: ${c} outpolled ${t}`)
            .toBeLessThanOrEqual(tally[t] || 0);
        }
      }
      // And the crown came out of the pair the jury chose.
      expect(through).toContain(row.dr.finale.placements[0]);
    }
  });

  it('is off unless the season books it, and needs a finale with a cut', () => {
    const plain = fin(season(7, { drAllStars: true, drFinale: 'perform-then-lipsync' }));
    expect((plain.dr.scenes || []).some(sc => String(sc.kind).startsWith('jury:'))).toBe(false);
    // A bracket has no cut: every finalist sings, so there is nothing to vote on.
    const bracket = fin(season(7, { drAllStars: true, drAllStarsJury: true, drFinale: 'top4' }));
    expect((bracket.dr.scenes || []).some(sc => String(sc.kind).startsWith('jury:'))).toBe(false);
  });

  it('says why each juror voted, and remembers who sent her home', () => {
    const whys = new Set();
    for (const seed of [7, 19, 42, 77, 300]) {
      for (const b of (fin(jury(seed)).dr.scenes || []).filter(sc => sc.kind === 'jury:ballot')) {
        whys.add(b.data.why);
        expect(b.text.length).toBeGreaterThan(30);
      }
    }
    expect(whys.size).toBeGreaterThan(2);
  });

  it('draws it on a screen of its own, before the cut', async () => {
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const row = fin(jury(7));
    const ids = dragScreens(row).map(x => x.id);
    expect(ids).toContain('dr-finale-jury');
    expect(ids.indexOf('dr-finale-jury')).toBeLessThan(ids.indexOf('dr-finale-cut'));
  });
});

describe('the circles reach the lounge', () => {
  it('has her circle speak for her, on All Stars and on a save season', () => {
    for (const cfg of [{ drAllStars: true }, { drSave: 'beaver' }]) {
      let circle = 0;
      for (const seed of [3, 4, 5, 6, 7]) {
        for (const row of season(seed, cfg).rows) {
          const camp = row.dr.save?.hold?.campaign || row.dr.legacyCampaign?.campaign
            || (row.dr.scenes || []).filter(sc => sc.data?.campaign).map(sc => ({ id: sc.kind }));
          circle += camp.filter(e => String(e.id).includes('circle-')).length;
        }
      }
      expect(circle, JSON.stringify(cfg)).toBeGreaterThan(0);
    }
  });

  it('only calls a queen unspoken-for when somebody else was spoken for', async () => {
    const { runCampaign } = await import('../js/dr/saves.js');
    const players = Object.fromEntries(['A', 'B', 'C', 'H'].map(n => [n, {
      name: n, archetype: 'floater', stats: Object.fromEntries(STATS.map(k => [k, 5])),
    }]));
    const run = blocs => runCampaign({
      saves: { uses: [], debts: [], grudges: [], promises: [], hopes: [] },
      targets: ['H'], pool: ['A', 'B'], living: ['A', 'B', 'C', 'H'], players,
      bond: () => 0, rng: rngFor(4), ep: 3, state: { record: {} }, blocs,
    });
    // Nobody is in a circle: the silence is not a scene, it is just the night.
    expect(run([]).events.some(e => e.id === 'circle-alone')).toBe(false);
    // C stands up for A, and now B being alone means something.
    const withCircle = run([{ members: ['A', 'C'] }]).events;
    expect(withCircle.some(e => e.id === 'circle-vouch')).toBe(true);
    expect(withCircle.some(e => e.id === 'circle-alone' && e.a === 'B')).toBe(true);
  });
});

describe('the ceremony shows the weighing', () => {
  const as = seed => season(seed, { drAllStars: true });
  const cer = row => (row.dr.scenes || []).filter(sc => sc.step === 'legacy-choice' && sc.text);

  it('opens on whether it is hard, then holds each name in turn', () => {
    const row = as(7).rows.find(r => cer(r).length);
    const kinds = cer(row).map(sc => sc.kind);
    expect(kinds[0]).toMatch(/^legacy:weigh-(close|clear)$/);
    // One beat per queen the host named, before she decides.
    const bottom = row.dr.callAtCall?.bottom?.length
      ? row.dr.callAtCall.bottom : row.dr.call.bottom;
    const about = cer(row).filter(sc => sc.data?.about).map(sc => sc.data.about);
    expect(about).toEqual(bottom.slice(0, 3));
    expect(kinds.indexOf('legacy:deliberate')).toBeGreaterThan(kinds.indexOf(kinds[0]));
    // And what it costs her, after she has watched it land.
    expect(kinds).toContain('legacy:cost');
  });

  it('says something true about each queen it weighs', () => {
    for (const seed of [7, 19, 42]) {
      for (const row of as(seed).rows) {
        const weighed = row.dr.lipsync?.weighed || [];
        for (const sc of cer(row).filter(x => x.data?.about)) {
          const w = weighed.find(x => x.q === sc.data.about);
          if (!w) continue;
          /* The beat is chosen from what is actually on her ledger tonight,
             so a card calling somebody her friend has to be about a queen
             she is close to. */
          if (sc.data.salience === 'friend') expect(w.bond >= 5 || w.ally).toBe(true);
          if (sc.data.salience === 'cold') expect(w.bond).toBeLessThanOrEqual(-4);
          if (sc.data.salience === 'pleaded') expect(w.pleaded).toBeGreaterThan(0.4);
          if (sc.data.salience === 'threat') expect(w.threat).toBeGreaterThanOrEqual(0.75);
        }
      }
    }
  });

  it('is sometimes hard and sometimes not', () => {
    let close = 0; let clear = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 19, 42, 300]) {
      for (const row of as(seed).rows) {
        if (!row.dr.lipsync?.why) continue;
        if (row.dr.lipsync.close) close += 1; else clear += 1;
      }
    }
    /* THE FIRST VERSION SCALED THE GAP BY THE POOL'S OWN SPREAD, which on a
       bottom of TWO is the gap itself — every ordinary legacy night came
       back exactly 1.0 and "she agonised" never fired once. Both halves have
       to happen or the ceremony is telling one story. */
    expect(close, 'she never struggles').toBeGreaterThan(0);
    expect(clear, 'she always struggles').toBeGreaterThan(0);
    const rate = close / (close + clear);
    expect(rate).toBeGreaterThan(0.1);
    expect(rate).toBeLessThan(0.6);
  });

  it('does not say the same thing twice in a season', () => {
    for (const seed of [7, 19, 42]) {
      const seen = new Set();
      let dup = 0; let total = 0;
      for (const row of as(seed).rows) {
        for (const sc of cer(row)) {
          const sig = `${sc.kind}|${sc.text.replace(/Q\d+/g, 'Q')}`;
          total += 1;
          if (seen.has(sig)) dup += 1;
          seen.add(sig);
        }
      }
      expect(dup / total, `seed ${seed}`).toBeLessThan(0.15);
    }
  });
});
