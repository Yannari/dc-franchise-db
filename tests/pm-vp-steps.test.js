// ══════════════════════════════════════════════════════════════════════
// pm-vp-steps.test.js — Plan 5: an episode as screens of clicks
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { episodeScreens, villaAt, startOfEpisode, MAX_STEPS } from '../js/vp-pm/steps.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const seasons = {};
function season(seed) {
  if (seasons[seed]) return seasons[seed];
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return (seasons[seed] = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }).rows);
}
const allLines = e => [...(e.script?.lines || []), ...(e.narrator?.lines || []), ...(e.hut?.script?.lines || [])];

describe('every word the engine wrote is a click', () => {
  it('each scene line, voiceover and beach-hut line appears exactly once, in the order of the scene', () => {
    for (const seed of [1, 2]) for (const row of season(seed)) {
      const steps = episodeScreens(row).flatMap(s => s.steps).filter(s => s.ev >= 0);
      row.pm.events.forEach((e, i) => {
        const mine = steps.filter(s => s.ev === i);
        expect(mine.length, `s${seed} e${row.num} ${e.kind}`).toBeGreaterThan(0);
        const said = mine.filter(s => s.part !== 'stage').map(s => s.text);
        expect(said, `s${seed} e${row.num} ${e.kind}`).toEqual(allLines(e).map(l => l.text));
        // …and the staging and the beat, on its first and last click.
        if (e.script?.stage && e.script.lines?.length) expect(mine[0].caption).toBe(e.script.stage);
        if (e.script?.beat) expect(mine.filter(s => s.beat).map(s => s.beat)).toEqual([e.script.beat]);
      });
      // Every scene is on screen once: no step for a scene belongs to two screens.
      const byEv = new Map();
      episodeScreens(row).forEach((s, si) => s.steps.forEach(st => { if (st.ev >= 0) (byEv.get(st.ev) || byEv.set(st.ev, new Set()).get(st.ev)).add(si); }));
      for (const [ev, on] of byEv) expect(on.size, `s${seed} e${row.num} scene ${ev}`).toBe(1);
    }
  });
});

describe('an episode is a dozen or more screens', () => {
  it('villa episodes have 10 to 22 screens, none far past the step budget', () => {
    const counts = [];
    for (const seed of [1, 2, 3]) for (const row of season(seed)) {
      if (row.moment === 'reunion') continue;
      const screens = episodeScreens(row);
      counts.push(screens.length);
      for (const s of screens) {
        // One scene can be longer than a screen on its own; a screen of several is not.
        const scenes = new Set(s.steps.map(x => x.ev)).size;
        // Night one's parts are one screen each by design (the user's call), however long.
        if (scenes > 1 && !['arrival', 'arrival-2', 'coupling', 'debrief', 'cinema'].includes(s.phase)) expect(s.steps.length, `s${seed} e${row.num} ${s.label}`).toBeLessThanOrEqual(MAX_STEPS * 1.6);
      }
    }
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    expect(mean).toBeGreaterThanOrEqual(10);
    expect(mean).toBeLessThanOrEqual(22);
  });
  it('the final ends on the board and the winners', () => {
    const final = season(1).find(r => r.moment === 'final');
    const screens = episodeScreens(final);
    const last = screens[screens.length - 1];
    expect(last.label).toBe('The winners');
    const top = [...final.pm.shares].sort((a, b) => b.share - a.share)[0].couple;
    expect(last.steps.find(s => s.headline === 'Your Perfect Match').text).toContain(top[0]);
  });
});

describe('the Heart Map never gets ahead of the reveal', () => {
  it('at rest it is how the villa stood when the episode began; at the last click, how it ended', () => {
    for (const seed of [1, 2]) {
      const rows = season(seed);
      rows.forEach((row, i) => {
        const prev = rows[i - 1] || null, screens = episodeScreens(row);
        if (!screens.length) return;
        const rest = villaAt(row, prev, screens, 0, -1);
        const start = startOfEpisode(row, prev);
        expect(rest.couples.map(c => c.join('+')).sort()).toEqual(start.couples.map(c => c.join('+')).sort());
        const last = screens.length - 1;
        const end = villaAt(row, prev, screens, last, screens[last].steps.length - 1);
        expect(end.couples.map(c => [...c].sort().join('+')).sort()).toEqual(row.pm.couples.map(c => [...c].sort().join('+')).sort());
      });
    }
  });
  it('a dumped islander is still on the map until the verdict is clicked', () => {
    let checked = 0;
    for (const seed of [1, 2]) {
      const rows = season(seed);
      rows.forEach((row, i) => {
        const screens = episodeScreens(row);
        screens.forEach((s, si) => s.steps.forEach((st, k) => {
          const leave = (st.rel || []).find(o => o[0] === 'leave');
          if (!leave || k === 0) return;
          checked++;
          expect(villaAt(row, rows[i - 1], screens, si, k - 1).villa).toContain(leave[1]);
          expect(villaAt(row, rows[i - 1], screens, si, k).villa).not.toContain(leave[1]);
        }));
      });
    }
    expect(checked).toBeGreaterThan(5);
  });
});

describe('the stage at rest names nobody, and each click shows exactly its line', () => {
  it('in the page: rest, one click, reveal all', async () => {
    window.matchMedia ||= () => ({ matches: false, addEventListener() {}, addListener() {} });
    globalThis.requestAnimationFrame ||= fn => setTimeout(fn, 0);
    globalThis.CSS ||= { escape: s => s };
    const { perfectMatchVpScreens, pmRevealNext, pmRevealAll } = await import('../js/vp-pm/screens.js');
    const rows = season(1), row = rows[6];
    const screens = perfectMatchVpScreens(row, rows[5]);
    const steps = episodeScreens(row);
    for (const [si, s] of screens.entries()) {
      document.body.innerHTML = s.html;
      const uid = `${row.num}-${si}`;
      // At rest: no bust, no line, no card, the counter at zero.
      expect(document.querySelectorAll('.pmv-bust').length, s.label).toBe(0);
      expect(document.querySelectorAll('.pmv-vis').length, s.label).toBe(0);
      expect(document.querySelector('.pmv-dlg').classList.contains('pmv-hide')).toBe(true);
      const total = steps[si].steps.length;
      expect(document.querySelector('.pmv-count').textContent).toBe(`0 / ${total}`);
      // Every step has its line on a card.
      const marks = new Set([...document.querySelectorAll('[data-s]')].map(el => Number(el.dataset.s)));
      expect(marks.size, s.label).toBe(total);
      pmRevealNext(uid);
      expect([...document.querySelectorAll('.pmv-ln.pmv-vis')].every(el => Number(el.dataset.s) === 0)).toBe(true);
      expect(document.querySelectorAll('.pmv-bust').length).toBe(steps[si].steps[0].cast.length);
      pmRevealAll(uid);
      expect(document.querySelectorAll('.pmv-ln:not(.pmv-vis)').length, s.label).toBe(0);
      expect(document.querySelector('.pmv-count').textContent).toBe(`${total} / ${total}`);
    }
  });
});

describe('the breaks: "Coming up" and "Next time"', () => {
  it('a teaser cuts its line off, never shows how anything ends, and nothing that did not air', async () => {
    const { cutLine } = await import('../js/vp-pm/steps.js');
    expect(cutLine("I've been wanting to tell you something for days now.")).toMatch(/—$/);
    let breaks = 0;
    for (const seed of [1, 2]) {
      const rows = season(seed);
      rows.forEach((row, i) => {
        const screens = episodeScreens(row, { next: rows[i + 1] ? { row: rows[i + 1] } : null });
        const teasers = screens.filter(s => s.teaser);
        breaks += teasers.length;
        // A break is never the first screen, and the final has no "Next time".
        expect(screens[0].teaser, `e${row.num}`).toBeFalsy();
        if (row.moment === 'final' || row.moment === 'reunion') expect(teasers.some(s => s.teaser === 'nexttime')).toBe(false);
        for (const s of teasers) for (const st of s.steps) {
          expect(st.ev, `e${row.num}`).toBe(-1);
          if (st.voice === 'narrator') continue;
          // Every clip is a line from a scene that aired, cut before it lands.
          const said = screens.flatMap(x => x.steps).concat(rows[i + 1] ? episodeScreens(rows[i + 1], { breaks: false }).flatMap(x => x.steps) : [])
            .filter(x => !x.fx?.teaser && x.who === st.who && x.text && cutLine(x.text) === st.text);
          expect(said.length, `e${row.num} "${st.text}"`).toBeGreaterThan(0);
          expect(said.some(x => !x.raw), `e${row.num} "${st.text}"`).toBe(true);
        }
      });
    }
    expect(breaks).toBeGreaterThan(10);
  });
});
