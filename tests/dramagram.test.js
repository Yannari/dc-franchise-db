// Dramagram's directory, and the number under every face.
//
// Design: docs/superpowers/specs/2026-08-18-dramagram-design.md
//
// The follower model is the thing to measure rather than trust — a plausible
// curve in a document is exactly how the competition-domination rates and the
// relationship rates both went wrong before anybody counted them. So most of
// this file runs the model over the real franchise and reads the shape out.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  directory, followerHistory, followersOf, statusOf, short, FOLLOWERS, VERIFIED_AT, postsFor,
} from '../js/dramagram.js';
import { careersIn } from '../js/records.js';

const SEASONS = Array.from({ length: 8 }, (_, i) => ({
  seasonId: `s-${i + 1}`, seasonNumber: i + 1,
  airYear: 2020 + Math.floor(i / 2), airSlot: i % 2 ? 'fall' : 'spring',
}));

const career = (id, details) => ({
  id, name: id[0].toUpperCase() + id.slice(1),
  seasonsPlayed: details.length,
  wins: details.filter(d => d.placement === 1).length,
  bestPlacement: Math.min(...details.map(d => d.placement)),
  details,
});

describe('the number is built from the record', () => {
  it('nobody who has never played has any followers', () => {
    const c = career('ghost', []);
    expect(followersOf('ghost', { careers: [c], seasons: SEASONS })).toBe(0);
  });

  it('winning is the cliff', () => {
    const won = career('a', [{ seasonId: 's-8', placement: 1 }]);
    const lost = career('b', [{ seasonId: 's-8', placement: 9 }]);
    const ctx = { careers: [won, lost], seasons: SEASONS };
    expect(followersOf('a', ctx)).toBeGreaterThan(followersOf('b', ctx) * 5);
  });

  it('explains itself, step by step', () => {
    // A number nobody can explain is one nobody trusts, and the profile shows
    // the delta — so the history is the return value, not just the total.
    const c = career('a', [{ seasonId: 's-1', placement: 1 }]);
    const h = followerHistory('a', { careers: [c], seasons: SEASONS });
    expect(h.steps.some(s => s.why === 'debut')).toBe(true);
    expect(h.steps.some(s => s.why === 'won')).toBe(true);
    expect(h.steps.filter(s => s.why === 'quiet').length, 'seven later seasons, no decay')
      .toBe(7);
    expect(h.total).toBe(followersOf('a', { careers: [c], seasons: SEASONS }));
  });
});

// ── the decay is the point ──
//
// Growth alone makes the count a fame score with commas, where whoever won
// first outranks a current star forever.
describe('a quiet career bleeds', () => {
  const early = career('early', [{ seasonId: 's-1', placement: 1 }]);
  const late = career('late', [{ seasonId: 's-8', placement: 1 }]);
  const ctx = { careers: [early, late], seasons: SEASONS };

  it('the same achievement is worth less the longer ago it was', () => {
    expect(followersOf('early', ctx), 'an old win is worth as much as a new one')
      .toBeLessThan(followersOf('late', ctx));
  });

  it('and returning wins it back', () => {
    const back = career('back', [{ seasonId: 's-1', placement: 1 }, { seasonId: 's-8', placement: 4 }]);
    const ctx2 = { careers: [early, back], seasons: SEASONS };
    expect(followersOf('back', ctx2), 'coming back is worth nothing')
      .toBeGreaterThan(followersOf('early', ctx2));
  });

  it('never falls to nothing — the account still exists', () => {
    const long = Array.from({ length: 40 }, (_, i) => ({
      seasonId: `s-${i + 1}`, seasonNumber: i + 1, airYear: 2000 + i, airSlot: 'spring',
    }));
    const c = career('old', [{ seasonId: 's-1', placement: 14 }]);
    expect(followersOf('old', { careers: [c], seasons: long })).toBeGreaterThanOrEqual(FOLLOWERS.floor);
  });

  it('does not decay somebody who has not debuted yet', () => {
    // You cannot drift out of a public life you never had. A season before
    // their debut must not put them below zero.
    const c = career('late', [{ seasonId: 's-8', placement: 6 }]);
    const h = followerHistory('late', { careers: [c], seasons: SEASONS });
    expect(h.steps.some(s => s.why === 'quiet' && s.delta < 0)).toBe(false);
  });
});

describe('the badge moves with the number', () => {
  it('is earned, and losable', () => {
    const winner = career('w', [{ seasonId: 's-8', placement: 1 }]);
    const boot = career('b', [{ seasonId: 's-8', placement: 15 }]);
    const dir = directory({ careers: [winner, boot], seasons: SEASONS });
    expect(dir.find(d => d.slug === 'w').verified).toBe(true);
    expect(dir.find(d => d.slug === 'b').verified).toBe(false);
    // The point of losable: the same win, long enough ago, is below the line.
    const old = career('o', [{ seasonId: 's-1', placement: 1 }]);
    const long = Array.from({ length: 40 }, (_, i) => ({
      seasonId: `s-${i + 1}`, seasonNumber: i + 1, airYear: 2000 + i, airSlot: 'spring',
    }));
    expect(followersOf('o', { careers: [old], seasons: long }))
      .toBeLessThan(VERIFIED_AT);
  });
});

describe('the dot', () => {
  const c = career('a', [{ seasonId: 's-8', placement: 3 }]);
  const base = { careers: [c], seasons: SEASONS, events: [] };

  it('is sequestered while they are in the house', () => {
    const live = { players: [{ slug: 'a' }] };
    expect(statusOf('a', { ...base, live }).state, 'a houseguest has a phone').toBe('sequestered');
  });

  it('is quiet when nothing has happened in a long time', () => {
    expect(statusOf('a', base).state).toBe('quiet');
  });

  it('is active just after something happened', () => {
    const events = [{ player: 'a', kind: 'new-job', afterSeason: 's-8', seq: 1, status: 'approved' }];
    expect(statusOf('a', { ...base, events }).state).toBe('active');
  });

  it('counts only approved events — a proposal is not activity', () => {
    const events = [{ player: 'a', kind: 'new-job', afterSeason: 's-8', seq: 1, status: 'proposed' }];
    expect(statusOf('a', { ...base, events }).state).toBe('quiet');
  });
});

describe('one account, seen from every show', () => {
  it('lists the shows somebody played rather than splitting them', () => {
    const both = career('x', [
      { seasonId: 's-1', placement: 4, format: 'total-drama' },
      { seasonId: 's-8', placement: 2, format: 'big-brother' },
    ]);
    const dir = directory({ careers: [both], seasons: SEASONS });
    expect(dir, 'a two-show player became two profiles').toHaveLength(1);
    expect(dir[0].shows.sort()).toEqual(['big-brother', 'total-drama']);
  });
});

describe('shortening a number', () => {
  it('reads the way a person would say it', () => {
    expect(short(840)).toBe('840');
    expect(short(9400)).toBe('9.4k');
    expect(short(256000)).toBe('256k');
    expect(short(1200000)).toBe('1.2m');
  });
});

describe('over the real franchise', () => {
  const db = JSON.parse(readFileSync('players_database.json', 'utf8'));
  const seasons = JSON.parse(readFileSync('seasons_database.json', 'utf8')).seasons;
  const dir = directory({ careers: careersIn(db, 'all'), seasons, events: [] });

  it('gives everybody who has played a profile', () => {
    expect(dir.length).toBeGreaterThan(100);
    expect(dir.every(d => d.followers > 0), 'somebody who played has no followers').toBe(true);
  });

  it('keeps the verified tier small', () => {
    const pct = dir.filter(d => d.verified).length / dir.length;
    expect(pct, 'everybody is verified, so the badge says nothing').toBeLessThan(0.2);
    expect(pct, 'nobody is verified, so the badge never appears').toBeGreaterThan(0.01);
  });

  it('does not let one number swamp the rest', () => {
    // A top that is orders of magnitude above the median makes every other
    // profile read as zero.
    const sorted = dir.map(d => d.followers).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    expect(sorted[sorted.length - 1] / median).toBeLessThan(60);
  });

  it('is ordered by followers', () => {
    for (let i = 1; i < dir.length; i++) {
      expect(dir[i - 1].followers).toBeGreaterThanOrEqual(dir[i].followers);
    }
  });
});

// ── the profile ──
//
// A post is an approved life event. Photo when the folder has an unused one,
// designed card when not — the galleries are character art and there is no
// wedding photo of anybody.
describe('posts', () => {
  const ev = (kind, o = {}) => ({ player: 'a', kind, afterSeason: 's-4', seq: 1, status: 'approved', ...o });

  it('are approved events only', () => {
    const events = [ev('new-job'), ev('wedding', { whom: 'b', seq: 2, status: 'proposed' })];
    expect(postsFor('a', { events, seasons: SEASONS, photos: [] })).toHaveLength(1);
  });

  it('give the photographs to what matters most', () => {
    // One picture and three events: it belongs to the wedding, not the haircut.
    const events = [ev('haircut', { seq: 1 }), ev('wedding', { whom: 'b', seq: 2 }), ev('new-job', { seq: 3 })];
    const posts = postsFor('a', { events, seasons: SEASONS, photos: ['pic-1'] });
    const withPhoto = posts.filter(p => p.photo);
    expect(withPhoto).toHaveLength(1);
    expect(withPhoto[0].kind, 'a minor event took the only photograph').toBe('wedding');
  });

  it('keep the same photograph across renders', () => {
    // A feed that reshuffles its own pictures reads as broken.
    const events = [ev('wedding', { whom: 'b', seq: 1 }), ev('new-job', { seq: 2 })];
    const ctx = { events, seasons: SEASONS, photos: ['p1', 'p2'] };
    expect(postsFor('a', ctx).map(p => p.photo)).toEqual(postsFor('a', ctx).map(p => p.photo));
  });

  it('fall back to a card when there are no photographs at all', () => {
    const posts = postsFor('a', { events: [ev('new-job')], seasons: SEASONS, photos: [] });
    expect(posts[0].photo).toBeNull();
    expect(posts[0].significance).toBe('minor');
    expect(posts[0].track).toBe('career');
  });

  it('are newest first', () => {
    const events = [
      ev('new-job', { afterSeason: 's-1', seq: 1 }),
      ev('moved-city', { afterSeason: 's-6', seq: 2 }),
    ];
    expect(postsFor('a', { events, seasons: SEASONS, photos: [] }).map(p => p.kind))
      .toEqual(['moved-city', 'new-job']);
  });

  it('appear on both profiles of a two-person event', () => {
    const events = [ev('feud', { player: 'a', whom: 'b' })];
    expect(postsFor('a', { events, seasons: SEASONS, photos: [] })).toHaveLength(1);
    expect(postsFor('b', { events, seasons: SEASONS, photos: [] }),
      "the other half of a feud does not see it").toHaveLength(1);
  });
});

describe('the page tells a caption from the profile it is on', () => {
  const page = readFileSync('dramagram.html', 'utf8');

  it('passes the viewed slug as the reader, not the stored player', () => {
    // A two-person event is stored once and carries whichever half wrote it, so
    // passing event.player put "Bowie and Hicks fell out publicly" on HICKS'S
    // own page. Found by reading the rendered card, not the code.
    expect(page).toMatch(/lineFor\(p\.event, namesBySlug, viewing\)/);
    expect(page, 'a caption is still told from the stored side')
      .not.toMatch(/lineFor\(p\.event, namesBySlug, p\.event\.player\)/);
  });

  it('does not print the name twice in the opened post', () => {
    // WHY THIS CHANGED. In step two the caption WAS the wiki line, which opens
    // with the name, so the bold prefix produced "Alejandro Alejandro and
    // Lindsay broke up." In step three the caption is first person and contains
    // no name at all, so the prefix is the ordinary username-then-caption
    // convention and is required rather than forbidden.
    //
    // The invariant is the same either way: whatever fills the caption slot
    // must not repeat the name the prefix already printed.
    const modal = page.slice(page.indexOf('function openPost'), page.indexOf('let allEvents'));
    expect(modal, 'the caption slot is the encyclopedia sentence again')
      .toMatch(/const caption = captionFor\(/);
    expect(modal, 'the wiki line is being used as the caption')
      .not.toMatch(/const caption = lineFor\(/);
  });
});
