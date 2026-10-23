// A race season's wiki article and its awards, drawn from the export's leg records (the user, 2026-10-23: "build
// the wiki and awards pages from it"). Until then the Wiki tab of a race season had nothing race-shaped in it: no
// leg-by-leg chart, no leg, no challenge, and a "Nothing identifies a twist" note over a season full of Boomerangs.
import { describe, it, expect, beforeAll } from 'vitest';
import { setPlayers, gs } from '../js/core.js';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { raceRows } from '../js/rr-run.js';
import { rrLedgerRecord } from '../js/rr/ledger-record.js';
import { buildRaceSeasonDocument } from '../js/rr/export.js';
import { buildWikiTab } from '../js/season-wiki-tab.js';
import { raceAwards, raceAwardsHtml } from '../js/rr/awards.js';
import { penaltyLabel } from '../js/rr/wiki.js';
import { raceCast } from './helpers/rr-cast.js';

const seasons = [];
beforeAll(() => {
  for (const seed of [41, 42]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const rows = raceRows(res, airSeason(res));
    const doc = JSON.parse(JSON.stringify(buildRaceSeasonDocument(rows,
      rrLedgerRecord(res.state, res, { popularity: { ...(gs.popularity || {}) } }), { seasonNumber: 1 })));
    seasons.push({ seed, res, doc, html: buildWikiTab(doc) });
  }
}, 600000);

const legsOf = doc => [...doc.votingHistory, doc.final];
const text = html => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
const cell = (html, team, leg) => {
  const esc = team.replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<td[^>]*data-team="${esc}"[^>]*data-leg="${leg}"[^>]*>([\\s\\S]*?)</td>`))?.[1] ?? null;
};

describe('rr wiki: the race as an article', () => {
  it('the race summary has every team on every leg it ran, at the place it checked in', () => {
    for (const { seed, doc, html } of seasons) {
      expect(html, `seed ${seed}`).toContain('id="wk-race-summary"');
      legsOf(doc).forEach((h, i) => {
        const leg = i + 1;
        for (const o of h.order) {
          const c = cell(html, o.team, leg);
          expect(c, `seed ${seed} leg ${leg} ${o.team}`).not.toBeNull();
          expect(text(c)).toMatch(new RegExp(`\\b${o.place}\\b`));
        }
      });
      // the team that went home is marked on the leg it went home
      for (const h of doc.votingHistory) for (const t of new Set(h.exits.map(x => x.team).filter(Boolean))) {
        expect(cell(html, t, h.leg), `seed ${seed} leg ${h.leg} ${t}`).toBeTruthy();
        expect(html).toMatch(new RegExp(`data-team="${t.replace(/&/g, '&amp;')}"[^>]*data-leg="${h.leg}"[^>]*class="[^"]*rrw-out`));
      }
    }
  });

  it('every leg has its own section: the place, every challenge, the check-in order and who went home', () => {
    for (const { seed, doc, html } of seasons) {
      legsOf(doc).forEach((h, i) => {
        const leg = i + 1;
        const sec = html.match(new RegExp(`<section class="rrw-leg" id="wk-leg-${leg}">([\\s\\S]*?)</section>`))?.[1];
        expect(sec, `seed ${seed} leg ${leg}`).toBeTruthy();
        const t = text(sec);
        expect(t).toContain(h.place);
        for (const c of h.challenges) expect(t, `${leg} ${c.name}`).toContain(c.name.replace(/^./, x => x.toUpperCase()));
        for (const o of h.order) expect(t).toContain(o.team);
        for (const x of h.exits || []) expect(t).toContain(x.name);
        // an Either/Or names the side each team took
        for (const c of h.challenges.filter(c => c.sides)) for (const s of c.sides) {
          if (c.runs.some(r => r.side === s.id)) expect(t, `${leg} ${s.name}`).toContain(s.name);
        }
      });
    }
  });

  it('says penalties in words, and never prints a machine id, undefined or an object', () => {
    for (const { seed, doc, html } of seasons) {
      const t = text(html);
      expect(t, `seed ${seed}`).not.toMatch(/undefined|\[object|NaN|\bnull\b/);
      for (const h of legsOf(doc)) for (const o of h.order) for (const r of o.penaltyReasons || []) {
        expect(t).not.toContain(r.reason.includes(':') ? r.reason : '\u0000');
        expect(t).toContain(penaltyLabel(r.reason));
      }
    }
    expect(penaltyLabel('refuse:holds')).toBe('refusing a challenge');
    expect(penaltyLabel('ditch-a-cab:seen')).toBe('being caught sabotaging another team');
  });

  it('a season exported before the leg records still draws its summary and legs', () => {
    const { doc } = seasons[0];
    const old = JSON.parse(JSON.stringify(doc));
    for (const h of legsOf(old)) {
      for (const k of ['challenges', 'route', 'passes', 'sabotage', 'fears', 'hurt', 'reward', 'boomerangVote', 'clockStart']) delete h[k];
      h.order = h.order.map(o => ({ team: o.team, members: o.members, place: o.place }));
    }
    const html = buildWikiTab(old);
    expect(html).toContain('id="wk-race-summary"');
    expect(html).toContain('id="wk-leg-1"');
    expect(text(html)).not.toMatch(/undefined|\[object|NaN/);
  });
});

describe('rr awards: from the record, not from a writer', () => {
  it('the team with the most legs won takes Most Legs Won, with the number', () => {
    for (const { seed, doc } of seasons) {
      const a = raceAwards(doc).find(x => x.id === 'leg-wins');
      const top = Math.max(...doc.placements.map(p => p.rr.legWins));
      expect(a.value, `seed ${seed}`).toBe(top);
      expect(doc.placements.filter(p => a.members.includes(p.name)).every(p => p.rr.legWins === top)).toBe(true);
    }
  });

  it('Closest Escape is the smallest margin a team beat the eliminated team by', () => {
    for (const { seed, doc } of seasons) {
      let best = Infinity;
      for (const h of doc.votingHistory) {
        if (h.nonElimination || !h.exits.length) continue;
        const out = h.order.find(o => h.exits.some(x => o.members.includes(x.name)));
        const above = h.order.filter(o => o.place === out.place - 1)[0];
        if (out?.time != null && above?.time != null) best = Math.min(best, out.time - above.time);
      }
      const a = raceAwards(doc).find(x => x.id === 'closest-escape');
      expect(a.value, `seed ${seed}`).toBe(best);
    }
  });

  it('every award names racers of this season, carries a sentence, and none is won with nothing', () => {
    for (const { seed, doc } of seasons) {
      const names = new Set(doc.placements.map(p => p.name));
      const list = raceAwards(doc);
      expect(list.length, `seed ${seed}`).toBeGreaterThanOrEqual(8);
      for (const a of list) {
        expect(a.members.length, a.id).toBeGreaterThan(0);
        for (const n of a.members) expect(names.has(n), `${a.id} ${n}`).toBe(true);
        expect(a.value, a.id).toBeGreaterThanOrEqual(a.id === 'closest-escape' ? 0 : 1);
        expect(a.detail, a.id).toMatch(/^[A-Z].*\.$/);
        expect(a.detail).not.toMatch(/undefined|NaN|null/);
      }
      const html = raceAwardsHtml(doc);
      for (const a of list) expect(html).toContain(a.title);
    }
  });

  it('the export carries the card the awards index reads', () => {
    for (const { doc } of seasons) {
      const a = raceAwards(doc).find(x => x.id === 'leg-wins');
      expect(doc.awards.mostChallengeWins.name).toBe(a.team);
      expect(doc.awards.mostChallengeWins.detail).toMatch(/legs?$/);
    }
  });
});
