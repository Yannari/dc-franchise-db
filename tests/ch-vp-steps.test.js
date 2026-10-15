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
  seasons = [5, 9].map(seed => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed });
    airSeason(r.state);
    return { r, rows: challengeRows(r) };
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
        const named = daily.steps.findIndex(st => (row.ch.dailyWinners || []).some(w => (st.tj || st.dir || st.say?.[1] || '').includes(w) && /win|safe|untouchable|wrap|done|it!/i.test(st.tj || st.dir || st.say?.[1] || '')));
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
