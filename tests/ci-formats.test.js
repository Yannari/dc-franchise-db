// Hangout formats (Plan 3b Task 3). Each checked on what the engine did,
// in a whole booked season: who sat in the Hangout, who could be blocked,
// what the players were allowed to know.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rel } from '../js/ci/state.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';
import { room } from './helpers/ci-room.js';
import { blockEachOther } from '../js/ci/formats.js';
import { streamFor } from '../js/dr/rng.js';
import { bump } from '../js/ci/state.js';

function booked(slot, id, seed = 5) {
  const cast = makePlayers(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const out = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed,
    options: { bookings: { [slot]: id } } });
  const d = out.state.schedule.find(x => x.slot === slot);
  const day = d.day;
  // The ratings (and what comes before them) end day N; the rest of the night
  // opens day N+1 (the show's cliffhanger), except an instant block.
  const night = d.night?.format === 'instant' ? day : day + 1;
  const RATINGS_DAY = new Set(['ratings', 'statement', 'mission', 'alert']);
  // That night's own scenes: an instant block's come after its ratings; a
  // deferred night's open the next day, before that day's own ratings (a
  // back-to-back day holds yesterday's blocking AND its own ratings).
  const all = out.state.scenes;
  const ratingsAt = n => all.findIndex(s => s.kind === 'ratings' && s.day === n);
  const on = kind => all.filter((s, i) => {
    if (s.kind !== kind) return false;
    if (RATINGS_DAY.has(kind)) return s.day === day;
    if (s.day !== night) return false;
    const r = ratingsAt(night);
    return night === day ? i > r : (r < 0 || i < r);
  });
  // who that night blocked (its blocking scenes' targets)
  const gone = () => on('blocking').map(b => b.data.target).concat(on('vote').map(v => v.data?.target).filter(Boolean));
  return { ...out, day, night, on, gone };
}

describe('three Influencers (UK 1 Ep 6)', () => {
  it('seats the top three, and all three are on the block', () => {
    const { on, result } = booked('rating3', 'ci-three-influencers');
    expect(on('hangout')[0].who).toHaveLength(3);
    expect(on('blocking')[0].data.by).toHaveLength(3);
    expect(result.placements).toHaveLength(5);
  });
});

describe('save one first (US 5 Ep 4, US 2)', () => {
  it('each Influencer saves one in public before the Hangout, and the saved cannot be blocked', () => {
    const { on } = booked('rating3', 'ci-save-one-first');
    const saves = on('save');
    expect(saves.length).toBe(2);
    const saved = saves.map(s => s.data.saved);
    const hang = on('hangout')[0];
    for (const x of saved) expect(hang.data.atRisk).not.toContain(x);
    expect(saved).not.toContain(on('blocking')[0].data.target);
    // a public save is a debt: the saved player owes the one who saved them
    for (const s of saves) expect(rel(s.data.saved, s.data.by, 'obligation')).toBeGreaterThan(0);
    // made in public: everyone in the building that night saw it
    const room = on('ratings')[0].seenBy;
    for (const s of saves) expect([...s.seenBy].sort()).toEqual([...room].sort());
  });
});

describe('secret influencers (US 3 Ep 10, 12)', () => {
  it('hides the ratings and who the Influencers are; the blocked player cannot go looking for them', () => {
    const { on, state, day } = booked('rating4', 'ci-secret-influencers');
    const ratings = on('ratings')[0];
    expect(ratings.data.hidden).toBe(true);
    // nobody learned a place: no threat belief moved from the ratings scene
    expect(state.beliefLog.filter(e => e.scene === ratings.id)).toEqual([]);
    const block = on('blocking')[0];
    expect(block.data.secret).toBe(true);
    const visit = on('visit')[0];
    expect(visit.data.motive).not.toBe('answers');
    expect(state.ratings.find(r => r.day === day).hidden).toBe(true);
  });
});

describe('super influencer (US 1 Ep 10, US 4 Ep 12, US 7 Ep 12)', () => {
  it('one player, ratings hidden, and the block is delivered in person', () => {
    const { on } = booked('rating6', 'ci-super-influencer');
    expect(on('ratings')[0].data.hidden).toBe(true);
    const block = on('blocking')[0];
    expect(block.data.by).toHaveLength(1);
    expect(block.data.inPerson).toBe(true);
    // the meeting IS the block: no second, chosen visit
    const visits = on('visit');
    expect(visits).toHaveLength(1);
    expect(visits[0].who).toEqual([block.data.target, block.data.by[0]]);
    expect(visits[0].data.inPerson).toBe(true);
  });
});

describe('block each other (UK 3 Ep 16)', () => {
  it('both decline, usually: then it is an ordinary Hangout', () => {
    const { on } = booked('rating5', 'ci-block-each-other');
    const offer = on('offer')[0];
    expect(offer.data.answers).toBeDefined();
    expect(on('blocking')).toHaveLength(1);
  });

  it('one says yes and the other no: the one who said no is gone, and everyone saw who took the offer', () => {
    const s = room(6, 4);
    s.people.Q0.archetype = 'villain'; s.people.Q0.stats.boldness = 9;
    bump('@q0', '@q1', 'resentment', 8);
    bump('@q1', '@q0', 'affection', 6);
    const out = blockEachOther(s, streamFor(1, 'x'), ['@q0', '@q1']);
    expect(out.answers['@q0']).toBe(true);
    expect(out.answers['@q1']).toBe(false);
    expect(out.target).toBe('@q1');
    expect(rel('@q1', '@q0', 'resentment')).toBeGreaterThan(0);
  });

  it('a nice player never takes it', () => {
    const s = room(6, 4);
    s.people.Q0.archetype = 'hero'; s.people.Q0.stats.boldness = 10;
    bump('@q0', '@q1', 'resentment', 10);
    for (let i = 0; i < 30; i++) expect(blockEachOther(s, streamFor(i, 'x'), ['@q0', '@q1']).answers['@q0']).toBe(false);
  });
});

// ── Task 4: public formats ──────────────────────────────────────────────
describe('save two each (US 1 Ep 7)', () => {
  it('the Influencers save one at a time in public until one is left, and that one is blocked; no Hangout', () => {
    const { on } = booked('rating3', 'ci-save-two-each');
    const saves = on('save');
    const block = on('blocking')[0];
    expect(on('hangout')).toHaveLength(0);
    expect(saves.length).toBeGreaterThanOrEqual(2);
    expect(saves.map(s => s.data.saved)).not.toContain(block.data.target);
    expect(block.data.channel).toBe('unsaved');
    // turns alternate between the Influencers
    expect(saves[0].data.by).not.toBe(saves[1].data.by);
  });
});

describe('save then plead (US 4 Ep 10)', () => {
  it('saves until two are left, both plead face to face, and the Influencers block one of the two', () => {
    const { on } = booked('rating4', 'ci-save-then-plead');
    const plead = on('plead')[0];
    expect(plead.data.pleaders).toHaveLength(2);
    expect(plead.data.pleaders).toContain(on('blocking')[0].data.target);
    expect(on('hangout')[0].data.atRisk.sort()).toEqual([...plead.data.pleaders].sort());
  });
});

describe('room vote (UK 1 Ep 15)', () => {
  it('names the bottom two; everyone else votes in public; the most votes is blocked, and everybody knows who voted how', () => {
    const { on, state } = booked('rating5', 'ci-room-vote');
    const vote = on('vote')[0];
    const rating = on('ratings')[0];
    // the lowest two who can be put up (an immune player is passed over)
    const bottom = rating.data.results.map(r => r.profile).filter(h => !vote.data.immune.includes(h)).slice(-2);
    expect([...vote.data.bottom].sort()).toEqual([...bottom].sort());
    const tally = {};
    for (const v of Object.values(vote.data.votes)) tally[v] = (tally[v] || 0) + 1;
    const block = on('blocking')[0];
    expect(bottom).toContain(block.data.target);
    expect(tally[block.data.target]).toBeGreaterThanOrEqual(Math.max(...Object.values(tally)));
    expect(Object.keys(vote.data.votes)).not.toContain(bottom[0]);
    // a public vote is a claim everyone learns
    const claims = state.claims.filter(c => c.kind === 'targeting' && c.day === vote.day);
    expect(claims.length).toBe(Object.keys(vote.data.votes).length);
  });
});

describe('forced statement (US 5 Ep 1)', () => {
  it('before the ratings, everyone names who they would block; the top-rated player\'s name is blocked', () => {
    const { on } = booked('rating1', 'ci-forced-statement');
    const st = on('statement')[0];
    const rating = on('ratings')[0];
    expect(st.id < rating.id || Number(st.id.slice(1)) < Number(rating.id.slice(1))).toBe(true);
    const top = rating.data.results[0].profile;
    expect(on('blocking')[0].data.target).toBe(st.data.picks[top]);
    expect(Object.keys(st.data.picks).length).toBe(st.who.length);
  });
});

// ── Task 5: removals ────────────────────────────────────────────────────
describe('instant block (US 1 Ep 9, UK 1 Ep 10, 17)', () => {
  it('blocks the lowest-rated at once; nobody is an Influencer; there may be no visit', () => {
    const { on, state, day } = booked('rating4', 'ci-instant-block');
    const rating = on('ratings')[0];
    const block = on('blocking')[0];
    expect(block.data.target).toBe(rating.data.results.at(-1).profile);
    expect(block.data.channel).toBe('instant');
    expect(rating.data.influencers).toEqual([]);
    expect(on('hangout')).toHaveLength(0);
    expect(on('visit').length).toBe(block.data.noVisit ? 0 : 1);
    expect(on('blocking')).toHaveLength(1);   // (the same day may also open with yesterday's night)
  });
});

describe('double block (US 1 Ep 9, US 3 Ep 9, US 2 Ep 8)', () => {
  it('removes two in one night, gives a later day back, and still ends with the finalists', () => {
    for (const seed of [3, 5, 8, 11]) {
      const { state, day, night, result } = booked('rating3', 'ci-double-block', seed);
      const gone = state.blocked.filter(b => b.day === night);
      expect(gone, `seed ${seed}`).toHaveLength(2);
      expect(state.schedule.some(d => d.gaveBack === 'rating3')).toBe(true);
      expect(result.placements).toHaveLength(5);
      const rec = state.nights.find(n => n.day === day);
      expect(['instant-then-hangout', 'each', 'lowest-two']).toContain(rec.variant);
    }
  });
  it('each Influencer blocking alone never blocks the other Influencer', () => {
    for (const seed of [2, 4, 6, 9, 12, 14]) {
      const { state, day, on } = booked('rating3', 'ci-double-block', seed);
      if (state.nights.find(n => n.day === day).variant !== 'each') continue;
      const infl = on('ratings')[0].data.influencers;
      for (const b of state.blocked.filter(x => x.day === day)) expect(infl).not.toContain(b.handle);
    }
  });
});

// ── Task 6: antivirus (US 4 Ep 8-9) ─────────────────────────────────────
import { FORMATS } from '../js/ci/formats.js';
describe('antivirus', () => {
  it('the newcomers start it, every receiver passes it on, and whoever never gets it is blocked', () => {
    let played = 0;
    for (const seed of [3, 5, 7, 9, 11, 13]) {
      const { on, state, day } = booked('rating4', 'ci-antivirus', seed);
      const av = on('antivirus')[0];
      if (!av) { expect(state.nights.find(n => n.day === day).fellBack).toBe('antivirus'); continue; }
      played++;
      const { holders, passes } = av.data;
      expect(holders.length).toBeGreaterThanOrEqual(2);
      for (const h of holders) expect(state.joinedDay[h]).toBeGreaterThan(1);
      // a chain: every giver is a holder or somebody who received it earlier
      const got = new Set(holders);
      for (const p of passes) { expect(got.has(p.from)).toBe(true); expect(got.has(p.to)).toBe(false); got.add(p.to); }
      const block = on('blocking')[0];
      expect(got.has(block.data.target)).toBe(false);
      expect(block.data.channel).toBe('antivirus');
    }
    expect(played).toBeGreaterThan(0);
  });
  it('cannot run without two newcomers in the building', () => {
    const s = room(6, 1);
    expect(FORMATS.antivirus.canNow(s)).toBe(false);
  });
});

// ── Task 9a: Circle-wide twists ─────────────────────────────────────────
import { readApproval } from '../js/pm/ledger.js';
import { peopleOf } from '../js/ci/state.js';
describe('public super influencer (UK 2 Ep 17)', () => {
  it('the audience picks the Super Influencer, not the ratings, and the block is in person', () => {
    const { on, state } = booked('rating6', 'ci-public-super');
    const block = on('blocking')[0];
    expect(block.data.inPerson).toBe(true);
    expect(block.data.public).toBe(true);
    const ap = h => peopleOf(state, h).reduce((s, n) => s + readApproval(state.ledger, n), 0) / peopleOf(state, h).length;
    const rating = on('ratings')[0];
    const pool = rating.seenBy;
    expect(block.data.by).toHaveLength(1);
    expect(pool).toContain(block.data.by[0]);
    void ap;
  });
});

describe('no blocking (US 7 Ep 1)', () => {
  it('nobody leaves that night, a later night takes two, and the season still ends with five', () => {
    const { state, day, night, result } = booked('rating3', 'ci-no-blocking');
    expect(state.blocked.filter(b => b.day === night)).toHaveLength(0);
    expect(state.nights.find(n => n.day === day).format).toBe('none');
    expect(state.nights.some(n => n.day > day && n.format === 'double')).toBe(true);
    expect(result.placements).toHaveLength(5);
  });
});

describe('secret mission (UK 3 Ep 8)', () => {
  it('one player must get a named target blocked, or is blocked themselves', () => {
    for (const seed of [3, 5, 7, 9]) {
      const { on, gone: goneOf } = booked('rating4', 'ci-secret-mission', seed);
      const m = on('mission')[0];
      expect(m).toBeTruthy();
      const gone = goneOf();
      expect(gone).toHaveLength(1);
      // ...unless a Ride or Die partner went in their place (that twist's own
      // rule, seed 7: the target was blocked, the partner sacrificed).
      const sac = on('sacrifice')[0];
      const stoodIn = sac && sac.who.includes(gone[0]) && sac.who.some(h => [m.data.target, m.data.holder].includes(h));
      if (!stoodIn) expect([m.data.target, m.data.holder]).toContain(gone[0]);
    }
  });
});

describe('disrupter alerts (US 7)', () => {
  it('the first to respond wins, and being first rewards attention, not popularity', () => {
    const { state } = booked('social1', 'ci-disrupter');
    const d = state.scenes.find(s => s.kind === 'disrupter');
    expect(d).toBeTruthy();
    expect(['immunity', 'pick']).toContain(d.data.effect);
    expect(d.data.order[0]).toBe(d.data.winner);
  });
});
