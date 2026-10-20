// The Ridonculous Race's music changes (js/vp-rr-ep/sound.js planBeds; js/audio.js's opt-in crossfade). The user,
// 2026-10-19: "the music switch the transition is not good". The moment of a step changes every few clicks; played as
// it stood, the bed flipped back and forth and each flip started a track from its intro, over a short linear fade that
// could leave a gap while the next file loaded. So: a plan per leg (hard moments change the music, soft ones only when
// they last, confessionals duck instead of switching, no A-B-A), and an engine that overlaps, eases and resumes.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens, flatSteps, chaptersOf } from '../js/vp-rr-ep/steps.js';
import { planBeds, soundAt, SOFT_MIN, DUCK, RACE_BED_OPTS, registerBed } from '../js/vp-rr-ep/sound.js';
import { AudioEngine, BED_CATALOG } from '../js/audio.js';
import { FakeAudioContext, fakeStorage } from './helpers/fakeAudioContext.js';

const SEASONS = [[12, 8], [8, 3]];
const legs = [];
beforeAll(() => {
  for (const [n, seed] of SEASONS) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    eps.forEach((_, i) => { const ep = { ...episodeScreens(res, eps, i), res }; legs.push({ n, seed, i, ep, plan: planBeds(ep), flat: flatSteps(ep.screens) }); });
  }
});
const key = b => (b ? b.file : 'none');

describe('rr music: the plan', () => {
  it('changes the music far less often than the moments change', () => {
    let raw = 0, planned = 0;
    for (const { ep, plan, flat } of legs) {
      let prev = null;
      for (const f of flat) { const k = key(soundAt(ep, f.si, f.idx).bed); if (k !== prev) raw++; prev = k; }
      planned += plan.filter(x => x.change).length;
    }
    expect(planned).toBeLessThan(raw * 0.6);
  });

  it('never goes A, B, A within a few steps', () => {
    const bad = [];
    for (const { n, i, plan } of legs) {
      const ch = plan.map((x, j) => ({ j, b: key(x.bed) })).filter((x, j) => plan[x.j].change && j >= 0);
      for (let c = 2; c < ch.length; c++) {
        if (ch[c].b === ch[c - 2].b && ch[c].j - ch[c - 1].j < SOFT_MIN) bad.push(`season ${n} leg ${i + 1}: ${ch[c - 2].b} -> ${ch[c - 1].b} -> back after ${ch[c].j - ch[c - 1].j} steps (step ${ch[c].j})`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('changes it a sensible number of times in a chapter', () => {
    const bad = [];
    for (const { n, i, ep, plan } of legs) for (const c of chaptersOf(ep, ep.place)) {
      const here = plan.filter(x => x.si >= c.from && x.si <= c.to);
      const changes = here.filter(x => x.change).length;
      if (changes > 2 + here.length / SOFT_MIN) bad.push(`season ${n} leg ${i + 1} ${c.name}: ${changes} changes in ${here.length} steps`);
    }
    expect(bad).toEqual([]);
  });

  it('still changes on every hard moment: a chapter, the Don Box, the elimination, the end', () => {
    for (const { ep, plan } of legs) {
      const starts = new Set(chaptersOf(ep, ep.place).map(c => c.from));
      plan.forEach(x => {
        const s = ep.screens[x.si], raw = soundAt(ep, x.si, x.k).bed;
        const where = `${s.id} ${s.seg || s.kind} step ${x.k}`;
        if (x.k === 0 && starts.has(x.si)) expect(key(x.bed), `${where}: a chapter opens on its own music`).toBe(key(raw));
        if (x.k === 0 && s.mode === 'demo' && starts.has(x.si)) expect(x.moment.moment).toBe('challenge');
        if (x.moment?.moment === 'elimination' && s.seg === 'don-elim') expect(key(x.bed), where).toBe(key(raw));
        if (s.kind === 'end' || s.kind === 'logo') expect(key(x.bed), where).toBe(key(raw));
      });
    }
  });

  it('keeps the music on under a short run of confessionals, eased down under the words', () => {
    let ducked = 0, own = 0;
    for (const { ep, plan } of legs) plan.forEach((x, j) => {
      const s = ep.screens[x.si];
      // (an interview scene's stage directions are part of the interview)
      if (s.kind !== 'iv' && s.mode !== 'iv') { expect(x.level).toBe(1); return; }
      if (x.level === DUCK) { ducked++; expect(x.change).toBe(false); expect(key(x.bed)).toBe(key(plan[j - 1]?.bed)); }
      else own++;
    });
    expect(ducked).toBeGreaterThan(50);
    expect(own).toBeGreaterThan(0);
  });
});

// ── the engine: only a bed that asks for it (the race's) crosses over this way; every other show is as it was ──
class TimedCtx extends FakeAudioContext {
  decodeAudioData() { return Promise.resolve({ _decoded: true, duration: 120 }); }
  createBufferSource() { const n = super.createBufferSource(); n.started = []; n.stopped = []; n.start = (w, o) => n.started.push(o ?? 0); n.stop = t => n.stopped.push(t); return n; }
}
const tick = () => new Promise(r => setTimeout(r, 0));
describe('rr music: the engine (opt-in)', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });
  const engine = () => { const ctx = new TimedCtx(); const e = new AudioEngine({ ctxFactory: () => ctx, storage: fakeStorage() }); e.unlock(); return { e, ctx }; };

  it('registers the race beds with the slow, smooth, resuming crossfade', () => {
    const id = registerBed({ file: 'assets/audio/rr/home-city/travel.mp3', vol: 0.3 });
    expect(BED_CATALOG[id].opts).toEqual(RACE_BED_OPTS);
    expect(RACE_BED_OPTS.fade).toBeGreaterThanOrEqual(2);
  });

  it('plays the old bed on until the new one is ready: no gap of silence', async () => {
    let release;
    globalThis.fetch = url => (/b\.mp3/.test(url) ? new Promise(r => { release = () => r({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }); }) : Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }));
    BED_CATALOG['zz-a'] = { file: 'a.mp3', volume: 0.3, opts: RACE_BED_OPTS };
    BED_CATALOG['zz-b'] = { file: 'b.mp3', volume: 0.3, opts: RACE_BED_OPTS };
    const { e } = engine();
    e.ambient('zz-a'); await tick(); await tick();
    const a = e._bedNodes;
    expect(a?.name).toBe('zz-a');
    e.ambient('zz-b'); await tick();
    expect(e._bedNodes).toBe(a);                 // b is still loading: a plays on
    release(); await tick(); await tick(); await tick();
    expect(e._bedNodes.name).toBe('zz-b');
    expect(e._fading).toContain(a);              // and fades out under b
    delete BED_CATALOG['zz-a']; delete BED_CATALOG['zz-b'];
  });

  it('comes back to a bed where it left off, and preloads a bed once', async () => {
    let fetches = 0;
    globalThis.fetch = () => { fetches++; return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }); };
    BED_CATALOG['zz-a'] = { file: 'a.mp3', volume: 0.3, opts: RACE_BED_OPTS };
    BED_CATALOG['zz-b'] = { file: 'b.mp3', volume: 0.3, opts: RACE_BED_OPTS };
    const { e, ctx } = engine();
    e.preloadBed('zz-b'); e.preloadBed('zz-b');
    e.ambient('zz-a'); await tick(); await tick();
    expect(fetches).toBe(2);                     // a, and b once
    ctx.currentTime = 30;
    e.ambient('zz-b'); await tick(); await tick();
    expect(fetches).toBe(2);                     // b came from the cache
    ctx.currentTime = 50;
    e.ambient('zz-a'); await tick(); await tick();
    const src = ctx.created.filter(n => n.type === 'buffersource').at(-1);
    expect(src.started[0]).toBeCloseTo(30, 5);   // a resumes 30 s in, not at its intro
    delete BED_CATALOG['zz-a']; delete BED_CATALOG['zz-b'];
  });

  it('leaves every other bed exactly as before: stopped at once, the new one from its top', async () => {
    globalThis.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    const { e, ctx } = engine();
    e.ambient('camp-day'); await tick(); await tick();
    expect(e._bedNodes.opts).toBeFalsy();
    ctx.currentTime = 40;
    e.ambient('victory');
    expect(e._bedNodes).toBeNull();              // the old one stopped as soon as the new one was asked for
    await tick(); await tick();
    e.ambient('camp-day'); await tick(); await tick();
    const src = ctx.created.filter(n => n.type === 'buffersource').at(-1);
    expect(src.started[0]).toBe(0);
  });
});
