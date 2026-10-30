// ══════════════════════════════════════════════════════════════════════
// pm-vp-steps.test.js — Plan 5: an episode as screens of clicks
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { episodeScreens, villaAt, startOfEpisode, MAX_STEPS, placeFor } from '../js/vp-pm/steps.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const seasons = {};
function season(seed) {
  if (seasons[seed]) return seasons[seed];
  const cast = makeIslanders(22, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return (seasons[seed] = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed }).rows);
}
// A story beat's narrator leads into the scene (pm/script.js storyLead); the rest follow it.
const allLines = e => e.narrator?.before
  ? [...e.narrator.lines, ...(e.script?.lines || []), ...(e.hut?.script?.lines || [])]
  : [...(e.script?.lines || []), ...(e.narrator?.lines || []), ...(e.hut?.script?.lines || [])];

describe('every word the engine wrote is a click', () => {
  it('each scene line, voiceover and beach-hut line appears exactly once, in the order of the scene', () => {
    for (const seed of [1, 2]) for (const row of season(seed)) {
      const steps = episodeScreens(row).flatMap(s => s.steps).filter(s => s.ev >= 0);
      row.pm.events.forEach((e, i) => {
        const mine = steps.filter(s => s.ev === i);
        expect(mine.length, `s${seed} e${row.num} ${e.kind}`).toBeGreaterThan(0);
        const said = mine.filter(s => s.part !== 'stage' && s.part !== 'footage').map(s => s.text);
        expect(said, `s${seed} e${row.num} ${e.kind}`).toEqual(allLines(e).map(l => l.text));
        // …and the staging and the beat, on its first and last click. A film
        // chapter's staging is its footage line, played on screen (steps.js).
        const footage = mine.find(s => s.part === 'footage');
        if (footage) expect(e.script.stage).toBe(`${footage.who}: "${footage.text}"`);
        else if (e.script?.stage && e.script.lines?.length) expect(mine.find(s => s.part !== 'narr').caption).toBe(e.script.stage);
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
  // 10 to 22 before the 2026-10-22 rebuild; an episode is 600-900 clicks now
  // (the user's tiers: ~20 featured conversations), so up to 28 segments.
  it('villa episodes have 10 to 28 screens, none far past the step budget', () => {
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
    expect(mean).toBeLessThanOrEqual(28);
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
    const steps = episodeScreens(row, { prev: rows[5] });
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
  it('"Previously on" plays last episode\'s aired lines in full, and says who really left', async () => {
    const { roundExits, PERFECT_MATCH_FORMAT } = await import('../js/shows.js');
    let seen = 0, hooked = 0;
    const rows = season(1);
    rows.forEach((row, i) => {
      if (!i) return;
      const prev = rows[i - 1];
      const open = episodeScreens(row, { prev }).find(s => s.teaser === 'previously');
      if (!open) return;
      seen++;
      const before = episodeScreens(prev, { breaks: false }).flatMap(x => x.steps).filter(x => !x.raw && x.text);
      for (const st of open.steps.filter(s => s.voice !== 'narrator')) {
        expect(before.some(x => x.who === st.who && x.text === st.text), `e${row.num} "${st.text}"`).toBe(true);
      }
      const exit = open.steps.find(s => /left the villa/.test(s.text || ''));
      for (const x of roundExits(prev, PERFECT_MATCH_FORMAT)) expect(exit?.text, `e${row.num}`).toContain(x.name);
      // …and ends where the last episode left off: its hook (pm/stretch.js hookFor).
      const hook = prev.pm.events.find(e => e.kind === 'hook' && e.aired);
      const last = (hook?.script?.lines || []).filter(l => !l.action && l.who).pop();
      if (last) { hooked++; expect(open.steps.slice(-3).map(s => s.text), `e${row.num}`).toContain(last.text); }
    });
    expect(seen).toBeGreaterThan(5);
    expect(hooked).toBeGreaterThan(3);
  });

  it('a teaser cuts its line off, never shows how anything ends, and nothing that did not air', async () => {
    const { cutLine } = await import('../js/vp-pm/steps.js');
    // Cut before it lands: at a sentence when there is more to come, never mid-word.
    expect(cutLine("I've been wanting to tell you something for days now.")).toMatch(/…$/);
    expect(cutLine("I'm going to be honest with you. I'd pick you at the recoupling.")).toBe("I'm going to be honest with you…");
    let breaks = 0;
    for (const seed of [1, 2]) {
      const rows = season(seed);
      rows.forEach((row, i) => {
        const screens = episodeScreens(row, { next: rows[i + 1] ? { row: rows[i + 1] } : null });
        const teasers = screens.filter(s => s.teaser);
        breaks += teasers.length;
        // A break is never the first screen — only the cold open ("Previously",
        // "Tonight", 2026-10-25) comes before the episode — and the final has no "Next time".
        const firstReal = screens.findIndex(s => !s.teaser);
        expect(screens.slice(0, firstReal).every(s => s.teaser === 'previously' || s.teaser === 'tonight'), `e${row.num}`).toBe(true);
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

describe('a scene stands where its staging says it is', () => {
  const at = (stage, phase, ePhase = phase) => placeFor({ moment: 'villa' }, { phase: ePhase, script: { stage } }, phase);
  it('reads the room, and the time of day picks the light', () => {
    expect(at('They sit at the kitchen island.', 'day')).toBe('kitchen');
    expect(at('They sit at the kitchen island.', 'evening')).toBe('kitchen-night');
    expect(at('A slow kiss on the swing seat.', 'evening')).toBe('lawn-night');
    expect(at('Up on the roof terrace.', 'debrief')).toBe('roof-night');
    expect(at('In the dressing room, doing her lashes.', 'morning')).toBe('dressing');
    // "day beds" is the pool, not the bedroom
    expect(at('Waving from the day beds.', 'day')).toBe('daybeds');
    expect(at('Still in bed, whispering.', 'morning')).toBe('bedroom');
  });
  it('falls back by the part of the day, and leaves the ceremonies alone', () => {
    expect(at('They talk about the day.', 'morning')).toBe('bedroom');
    expect(at('They talk about the day.', 'evening')).toBe('pool-night');
    expect(at('The rules are read out.', 'day', 'challenge')).toBe('lawn');
    expect(at('By the fire pit.', 'firepit')).toBe(null);
    expect(placeFor({ moment: 'casa-nights' }, { phase: 'evening', script: { stage: 'In the kitchen.' } }, 'evening')).toBe(null);
  });
  it('over a season, the villa scenes stand in a rendered room, not the old gradients', () => {
    let named = 0, all = 0;
    for (const row of season(7)) for (const sc of episodeScreens(row, { breaks: false })) for (const st of sc.steps) {
      if (st.part === 'hut' || st.ev < 0) continue;
      all++;
      if (!['day', 'terrace'].includes(st.bg)) named++;
    }
    expect(named / all).toBeGreaterThan(0.95);
  });
});

describe('the episode plays under music', () => {
  // The storylines (pm/threads.js) played in silence when they landed (2026-10-25):
  // half an episode with no music under it.
  it('most of a season is scored, and no storyline beat is silent', () => {
    let steps = 0, scored = 0;
    const silentStory = new Set();
    for (const row of season(7)) for (const sc of episodeScreens(row, { breaks: false })) for (const st of sc.steps) {
      if (st.part === 'hut') continue;
      steps++;
      if (st.music) scored++;
      else if (st.story && st.voice !== 'text') silentStory.add(st.kind);
    }
    expect(scored / steps).toBeGreaterThan(0.9);
    expect([...silentStory]).toEqual([]);
  });
});
