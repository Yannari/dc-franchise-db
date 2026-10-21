// The user (2026-10-21): "the music loop doesnt work well its weird at moment". Measured: every bed was the
// track's first 45-50 s, its tail blended for 3 s over its intro (two passages out of time with each other), and
// the mp3 carried the encoder's silence at both ends (1105 samples in, ~1127 out, no gapless header): a 50 ms
// hole every time it went round. A bed is now cut where the music repeats (tools/rr-vp-audio.py), with a run of
// music before and after the loop, and the engine loops between its loop points, never over the file's ends.
import { describe, it, expect, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { AudioEngine, BED_CATALOG } from '../js/audio.js';
import { registerBed, RACE_BED_OPTS } from '../js/vp-rr-ep/sound.js';
import { HAVE, LOOP } from '../js/vp-rr-ep/music-have.js';
import { RACE_SOUNDS } from '../js/vp-rr-ep/music.js';
import { FakeAudioContext, fakeStorage } from './helpers/fakeAudioContext.js';

class TimedCtx extends FakeAudioContext {
  decodeAudioData() { return Promise.resolve({ _decoded: true, duration: 44 }); }
  createBufferSource() { const n = super.createBufferSource(); n.started = []; n.start = (w, o) => n.started.push(o ?? 0); n.stop = () => {}; return n; }
}
const tick = () => new Promise(r => setTimeout(r, 0));
const engine = () => { const ctx = new TimedCtx(); const e = new AudioEngine({ ctxFactory: () => ctx, storage: fakeStorage() }); e.unlock(); return { e, ctx }; };

describe('rr music: a bed loops on its own loop points', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; delete BED_CATALOG['zz-l']; delete BED_CATALOG['zz-m']; });

  it('loops between its loop points and starts on the first, never at the file\'s silent edge', async () => {
    globalThis.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    BED_CATALOG['zz-l'] = { file: 'l.mp3', volume: 0.3, opts: RACE_BED_OPTS, loop: [1, 41] };
    const { e, ctx } = engine();
    e.ambient('zz-l'); await tick(); await tick();
    const src = ctx.created.filter(n => n.type === 'buffersource').at(-1);
    expect(src.loop).toBe(true);
    expect(src.loopStart).toBe(1);
    expect(src.loopEnd).toBe(41);
    expect(src.started[0]).toBeCloseTo(1, 5);
  });

  it('comes back where it left off inside the loop', async () => {
    globalThis.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
    BED_CATALOG['zz-l'] = { file: 'l.mp3', volume: 0.3, opts: RACE_BED_OPTS, loop: [1, 41] };
    BED_CATALOG['zz-m'] = { file: 'm.mp3', volume: 0.3, opts: RACE_BED_OPTS, loop: [1, 41] };
    const { e, ctx } = engine();
    e.ambient('zz-l'); await tick(); await tick();
    ctx.currentTime = 50;                          // 50 s from 1: once round the 40 s loop, 10 s in
    e.ambient('zz-m'); await tick(); await tick();
    ctx.currentTime = 60;
    e.ambient('zz-l'); await tick(); await tick();
    const src = ctx.created.filter(n => n.type === 'buffersource').at(-1);
    expect(src.started[0]).toBeCloseTo(11, 5);
  });

  it('every race bed on disk has its loop points, and the catalog carries them', () => {
    const stings = new Set(Object.keys(RACE_SOUNDS).filter(k => RACE_SOUNDS[k].kind === 'sting').map(k => `assets/audio/rr/race/${k}.mp3`));
    const beds = [...HAVE].filter(f => f.startsWith('assets/audio/rr/') && !stings.has(f) && existsSync(f));
    expect(beds.length).toBeGreaterThan(300);
    const missing = beds.filter(f => !(LOOP[f] && LOOP[f][0] > 0.2 && LOOP[f][1] - LOOP[f][0] >= 15));
    expect(missing).toEqual([]);
    const id = registerBed({ file: beds[0], vol: 0.3 });
    expect(BED_CATALOG[id].loop).toEqual(LOOP[beds[0]]);
  });
});
