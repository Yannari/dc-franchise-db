// The Challenge's stepped viewer (js/vp-ch-ep), on played seasons: every step of every screen paints,
// nothing is shown before the step that says it, and the screens tell the episode the engine played.
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens, chStepText, clockOf } from '../js/vp-ch-ep/steps.js';
import { chStepVpScreens } from '../js/vp-ch-ep/screens.js';
import { ChxStage } from '../js/vp-ch-ep/stage.js';
import { CH_MARKS } from '../js/vp-ch-ep/marks.js';
import { challengeCast } from './helpers/ch-cast.js';

let seasons;
beforeAll(() => {
  // and one season with both twists on (the Red Skull, Redemption House: ch/stakes.js, ch/redemption.js)
  // ...and a Teams season with a team final (ch/teams.js)
  seasons = [[5], [9], [21, { finalPass: 'skull', redemption: true }], [7, { teams: { teaming: 'draft', count: 2, end: 'team-final' } }]].map(([seed, options = {}]) => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed, options });
    airSeason(r.state);
    return { r, rows: challengeRows(r) };
  });
});

describe('The Challenge stepped viewer: a Teams season', () => {
  it('names the teams, colours every player by team, explains the team vote, and stages a switch', () => {
    const { rows } = seasons[3];
    const first = chStepScreens(rows[0]);
    expect(first.some(s => s.label === 'The teams')).toBe(true);
    expect(first.flatMap(s => s.steps).some(st => st.card?.t === 'Teams')).toBe(true);
    // each team's card shows the whole team, not the four who speak (the user, 2026-10-17: "only showed 4 players")
    const teamCards = first.flatMap(s => s.steps).filter(st => st.card && st.card.k !== 'This season' && rows[0].ch.teams.start.some(t => t.name === st.card.t));
    expect(teamCards.length).toBe(rows[0].ch.teams.start.length);
    for (const st of teamCards) expect(st.card.faces.length, st.card.t).toBe(rows[0].ch.teams.start.find(t => t.name === st.card.t).members.length);
    const teamWeeks = rows.filter(r => (r.ch?.votes || []).some(v => v.team));
    expect(teamWeeks.length).toBeGreaterThan(3);
    for (const r of teamWeeks) {
      const steps = chStepScreens(r).flatMap(s => s.steps);
      expect(steps.some(st => st.rules?.n === 'Out loud, by team'), `ep ${r.num}`).toBe(true);
      const sc = steps.find(st => st.scene?.cast && Object.keys(st.scene.cast).length > 2)?.scene;
      expect(Object.keys(sc?.teams || {}).length, `ep ${r.num}`).toBeGreaterThan(0);
    }
    const sw = rows.filter(r => r.ch?.teams?.switches?.length);
    for (const r of sw) expect(chStepScreens(r).flatMap(s => s.steps).some(st => st.slam?.spray === 'SWITCHED SIDES'), `ep ${r.num}`).toBe(true);
  });
});

const allSteps = rows => rows.flatMap(row => chStepScreens(row).flatMap(s => s.steps.map((st, i) => ({ row, s, st, i }))));

describe('The Challenge stepped viewer: the steps', () => {
  it('every plate a step asks for exists, and every cast spec names a mark the plate has', () => {
    for (const { rows } of seasons) for (const { row, s, st } of allSteps(rows)) {
      if (!st.scene) continue;
      expect(CH_MARKS[st.scene.plate], `ep ${row.num} ${s.label}: plate ${st.scene.plate}`).toBeTruthy();
      for (const [n, spec] of Object.entries(st.scene.cast || {})) {
        if (!Array.isArray(spec)) continue;
        const [kind, , group] = spec;
        const ok = CH_MARKS[st.scene.plate].m.some(m => m.kind === kind && (kind === 'podium' || kind === 'duel' ? m.side === group : group ? m.group === group : true));
        expect(ok, `ep ${row.num} ${s.label}: ${n} on ${spec.join(':')} of ${st.scene.plate}`).toBe(true);
      }
    }
  });

  it('every aired line is on a screen, in order, exactly once', () => {
    for (const { rows } of seasons) for (const row of rows) {
      const said = chStepScreens(row).flatMap(s => s.steps).flatMap(st => [st.say?.[1], st.tj, st.conf?.[1], st.dir].filter(Boolean));
      const aired = row.ch.aired.flatMap(a => a.lines.map(l => l.text));
      let at = 0;
      for (const t of aired) {
        const k = said.indexOf(t, at);
        expect(k, `ep ${row.num}: "${t}" is missing or out of order`).toBeGreaterThanOrEqual(0);
        at = k + 1;
      }
    }
  });

  it('never prints an unfilled slot or an undefined', () => {
    for (const { rows } of seasons) for (const row of rows) {
      const text = chStepText(row);
      expect(text, `ep ${row.num}`).not.toMatch(/\{\w+\}|undefined|NaN|\[object/);
    }
  });

  it('the clock never runs backwards within a day', () => {
    for (const { rows } of seasons) for (const row of rows) {
      const c = clockOf(row.ch.aired);
      for (let i = 1; i < c.length; i++) if (c[i].day === c[i - 1].day) expect(c[i].min, `ep ${row.num} scene ${i}`).toBeGreaterThan(c[i - 1].min);
    }
  });

  it('the result is never on screen before its step: the daily winners, the one voted in, the one called out, the Arena winner', () => {
    for (const { rows } of seasons) for (const row of rows) {
      if (row.ch.final) continue;
      const screens = chStepScreens(row);
      const daily = screens.find(s => s.key === 'daily');
      if (daily) {
        const first = daily.steps.findIndex(st => st.win || st.power?.length);
        const named = daily.steps.findIndex(st => (row.ch.dailyWinners || []).some(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(st.tj || st.dir || st.say?.[1] || '') && /\b(wins?|won|safe|untouchable|wrap)\b/i.test(st.tj || st.dir || st.say?.[1] || '')));
        if (first >= 0 && named >= 0) expect(first, `ep ${row.num}: SAFE before the winners are called`).toBeLessThanOrEqual(named);
      }
      const vote = screens.find(s => s.key === 'vote');
      if (vote) {
        // each vote of the night on its own (a second vote resets the board)
        const cuts = [0, ...vote.steps.map((st, i) => (st.boardReset ? i : -1)).filter(i => i > 0), vote.steps.length];
        for (let k = 0; k + 1 < cuts.length; k++) {
          const seg = vote.steps.slice(cuts[k], cuts[k + 1]);
          const chip = seg.findIndex(st => st.chip?.[1] === 'VOTED IN');
          const lastBallot = seg.map(st => !!st.vote).lastIndexOf(true);
          if (chip >= 0) expect(chip, `ep ${row.num}: VOTED IN before the last ballot`).toBeGreaterThan(lastBallot);
        }
      }
      for (const ar of screens.filter(s => s.key === 'arena')) {
        const called = ar.steps.findIndex(st => st.chip?.[1] === 'CALLED OUT');
        const podR = ar.steps.findIndex(st => st.enter && Object.values(st.enter).some(sp => Array.isArray(sp) && sp[0] === 'podium' && sp[2] === 'R'));
        if (called >= 0 && podR >= 0) expect(podR, `ep ${row.num}: the opponent walks to the podium before being called out`).toBeGreaterThan(called);
        const win = ar.steps.findIndex(st => st.slam?.winner);
        const lastRound = ar.steps.map(st => !!(st.duel && !st.duel.done)).lastIndexOf(true);
        if (win >= 0) expect(win, `ep ${row.num}: the winner before the last round`).toBeGreaterThan(lastRound);
      }
    }
  });

  it('the Arena and the vote show what the engine decided', () => {
    for (const { rows } of seasons) for (const row of rows) {
      if (row.ch.final) continue;
      const steps = chStepScreens(row).flatMap(s => s.steps);
      for (const v of row.ch.votes) {
        const voted = steps.filter(st => st.vote).map(st => st.vote);
        for (const b of v.ballots) expect(voted.some(([vv, t]) => vv === b.voter && t === b.target), `ep ${row.num}: ${b.voter} -> ${b.target}`).toBe(true);
      }
      for (const d of row.ch.duels) expect(steps.some(st => st.slam?.winner === `${d.winner} wins`), `ep ${row.num}: ${d.winner} wins`).toBe(true);
    }
  });

  it('the house argues before the vote and somebody finds the one voted in after it, and both air', () => {
    for (const { r, rows } of seasons) {
      const voted = rows.filter(row => !row.ch.final && row.ch.votes.some(v => !v.volunteer));
      const kinds = row => new Set(row.ch.aired.map(x => x.kind));
      // (a Teams season's debate is the losing team's huddle, and its after-vote the team's: ch/teams.js)
      const debates = voted.filter(row => kinds(row).has('house-debate') || kinds(row).has('team-huddle')).length;
      const after = voted.filter(row => kinds(row).has('after-vote') || kinds(row).has('team-after-vote')).length;
      expect(r.state.scenes.some(s => s.kind === 'house-debate' || s.kind === 'team-huddle'), 'the engine files a debate').toBe(true);
      expect(debates, `debates aired on ${debates} of ${voted.length} vote nights`).toBeGreaterThanOrEqual(voted.length / 2);
      expect(after, `after-vote aired on ${after} of ${voted.length} vote nights`).toBeGreaterThanOrEqual(voted.length / 2);
    }
  });
});

describe('The Challenge stepped viewer: painting', () => {
  it('paints every step of every screen of a season, forward and back, without throwing', () => {
    const { rows } = seasons[0];
    for (const row of rows) {
      const vp = chStepVpScreens(row, { history: rows });
      expect(vp.length).toBeGreaterThan(0);
      const screens = chStepScreens(row);
      screens.forEach((scr, si) => {
        document.body.innerHTML = vp[si].html;
        const root = document.querySelector('.chx');
        const st = new ChxStage(root, {});
        const ctx = { names: row.ch.house, game: ['Arena'], roleOf: () => null };
        scr.steps.forEach((s, i) => {
          if (i === 0 && !s.scene) st.setScene({ plate: 'villa-day', cast: {} });
          st.apply(s, true);
          st.present(s, true, ctx);
        });
        // back to the first step: a rebuild from the screen's start
        st.ST = null;
        if (!scr.steps[0].scene) st.setScene({ plate: 'villa-day', cast: {} });
        st.apply(scr.steps[0], false); st.present(scr.steps[0], false, ctx);
        expect(root.querySelector('.chx-platebox img'), `ep ${row.num} ${scr.label}`).toBeTruthy();
      });
    }
  });
});

// Intel's Votes tab opens on a vote only once that vote has been read to the end (the user, 2026-10-17: "the votes
// tab shows every vote even before I read them"): doneScenes, at every step of the vote's screen.
describe('The Challenge viewer: Intel never gets ahead of the screen', () => {
  it('a ceremony is not done until its screen has been read to the end, and done after', async () => {
    const { doneScenes } = await import('../js/vp-ch-ep/screens.js');
    let checked = 0;
    for (const { rows } of seasons) for (const row of rows.slice(0, 6)) {
      const screens = chStepScreens(row);
      const aired = row.ch?.aired || [];
      const cer = aired.findIndex(a => a.kind === 'ceremony');
      if (cer < 0) continue;
      const si = screens.findIndex(s => s.key === 'vote' && s.steps.some(st => st.sceneIdx === cer));
      const E = { screens, row };
      for (let idx = 0; idx < screens[si].steps.length; idx++) {
        const done = doneScenes({ E, si, idx }).has(cer);
        const lastOfIt = !screens[si].steps.slice(idx + 1).some(() => true);
        if (!lastOfIt) expect(done, `ep ${row.num}: vote counted as read at step ${idx} of ${screens[si].steps.length}`).toBe(false);
      }
      expect(doneScenes({ E, si: si + 1, idx: 0 }).has(cer), `ep ${row.num}: vote not counted after its screen`).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });
});
