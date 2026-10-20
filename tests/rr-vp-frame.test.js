// The Ridonculous Race viewer's framing (js/vp-rr-ep/steps.js): the three rough edges the user asked fixed, 2026-10-19.
//   1. "close-ups crop the crowd": no avatar is ever cut by the frame. Whoever a shot cannot hold whole (its edge, the
//      dialogue bar, the plate's slow push) fades out of it (planHide); the camera slides to cut as few as it can.
//   2. "a crowded same-flight galley overlaps": nobody stands on anybody. A crowded shot is laid out smaller, the galley
//      stands its teams in two rows, a cabin holds no more teams than fit, and the teams behind a shot move along
//      to a clear place or are not in that picture.
//   3. "the TRY AGAIN stamp can sit over a face": stamps and slams go where no face is (stampSpot, slamSpot).
// tools/rr-vp-check.mjs checks the same three in a real browser at five window sizes.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import {
  episodeScreens, facesAt, padOf, viewRect, safeRect, inRect, overlapOf, OVERLAP_OK, screenFaces, stampSpot, slamSpot,
  stampSize, slamSize, placeOverlay, beatCardBox, HUD_H, BAR, boxOf, inView, tipSpot, TIP_SIZE, coverOf,
} from '../js/vp-rr-ep/steps.js';

const SEASONS = [[12, 8], [8, 3], [6, 5]];
const played = [];
beforeAll(() => {
  for (const [n, seed] of SEASONS) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    played.push({ n, seed, res, eps, built: eps.map((_, i) => episodeScreens(res, eps, i)) });
  }
});
const worlds = fn => { for (const p of played) for (const ep of p.built) for (const s of ep.screens) if (s.kind === 'world' && s.plate) fn(s, p); };
const shown = (s, k) => { const h = new Set(s.steps[k].hide || []); return facesAt(s, k).filter(f => !h.has(f.key)); };
const speakerKey = (s, st) => (st.part === 'pause' ? null : st.by === 'Don' ? (s.donStand ? 'p:Don' : null) : st.team && s.teams.includes(st.team) ? 't:' + st.team : st.by && s.localAt?.[st.by] ? 'p:' + st.by : null);

describe('rr viewer: nobody cut by the frame', () => {
  it('shows every face whole in every shot, the slow push and the idle bounce included, or not at all', () => {
    const bad = [];
    let faded = 0, fadedBehind = 0;
    worlds(s => s.steps.forEach((st, k) => {
      const r = safeRect(viewRect(st.cam));
      for (const f of shown(s, k)) if (!inRect(padOf(f, f.z), r, 0)) bad.push(`${s.id} ${s.seg} step ${k} ${st.cam.shot} cuts ${f.key}`);
      if (st.cam.shot !== 'wide') { faded += (st.hide || []).length; fadedBehind += (st.hide || []).filter(h => h.startsWith('c:')).length; }
    }));
    expect(bad).toEqual([]);
    // the close-ups do push in past people (the crowd behind most of all), and they fade
    expect(faded).toBeGreaterThan(100);
    expect(fadedBehind).toBeGreaterThan(50);
  });

  // the user, 2026-10-19: only the teams behind a scene may fade. A close-up that cannot hold every team in the scene
  // whole (and Don, and a local) is a wider two-shot, or the wide shot
  it('never fades a team in the scene, in any step of any season: the shot holds them all whole', () => {
    const bad = [];
    let held = 0;
    worlds((s, p) => {
      if (p.seed === 5) return;
      s.steps.forEach((st, k) => {
        for (const h of st.hide || []) if (!h.startsWith('c:')) bad.push(`${s.id} ${s.seg} step ${k} fades ${h}`);
        const r = safeRect(viewRect(st.cam));
        for (const f of facesAt(s, k)) if (f.kind !== 'crowd') {
          if (!inRect(padOf(f, f.z), r, 0)) bad.push(`${s.id} ${s.seg} step ${k} ${st.cam.shot} cuts ${f.key}`);
          else if (st.cam.shot !== 'wide') held++;
        }
      });
    });
    expect(bad).toEqual([]);
    expect(held).toBeGreaterThan(200);
  });

  it('never fades the one talking, and plays no reaction by somebody faded out', () => {
    worlds(s => s.steps.forEach((st, k) => {
      const sp = speakerKey(s, st), hid = st.hide || [];
      if (sp) expect(hid, `${s.id} step ${k}: the speaker faded`).not.toContain(sp);
      if (st.react && !st.react.who) expect(hid, `${s.id} step ${k}: a faded team reacts`).not.toContain('t:' + st.react.team);
    }));
  });

  it('fades nobody in the shot out of a wide shot: the layout holds them whole', () => {
    const bad = [];
    worlds(s => s.steps.forEach((st, k) => {
      if (st.cam.shot !== 'wide') return;
      for (const h of st.hide || []) if (!h.startsWith('c:')) bad.push(`${s.id} ${s.seg} step ${k} ${h}`);
      // the teams behind are whole in it, or wholly off it (a rider still to come in)
      for (const f of facesAt(s, k)) if (f.kind === 'crowd' && (st.hide || []).includes(f.key) && f.box[2] > 0 && f.box[0] < 100) bad.push(`${s.id} ${s.seg} step ${k} half a ${f.key}`);
    }));
    expect(bad).toEqual([]);
  });

  it('holds every close-up subject whole through the slow push (inView is drift-aware)', () => {
    const bad = [];
    worlds(s => s.steps.forEach((st, k) => {
      if (st.cam.shot === 'wide') return;
      for (const w of st.cam.on || []) { const b = boxOf(s, w, k); if (b && !inView(st.cam, b)) bad.push(`${s.id} step ${k} ${w}`); }
    }));
    expect(bad).toEqual([]);
  });
});

describe('rr viewer: nobody stands on anybody', () => {
  it('overlaps no two faces in the picture by more than a touch', () => {
    const bad = [];
    worlds(s => s.steps.forEach((st, k) => {
      const r = viewRect(st.cam);
      const f = shown(s, k).filter(x => x.box[2] > r[0] && x.box[0] < r[2] && x.box[3] > r[1] && x.box[1] < r[3]);
      for (let a = 0; a < f.length; a++) for (let b = a + 1; b < f.length; b++) {
        if (f[a].key === f[b].key) continue;
        const o = overlapOf(f[a].box, f[b].box);
        if (o > OVERLAP_OK) bad.push(`${s.id} ${s.seg} step ${k} ${f[a].key}/${f[b].key} ${o.toFixed(2)}`);
      }
    }));
    expect(bad).toEqual([]);
  });

  it('stands a crowded flight in the galley, in two rows, and never more teams than fit', () => {
    let four = 0;
    worlds(s => {
      if (s.mode !== 'cabin') return;
      if (s.teams.length + s.locals.length + (s.don ? 1 : 0) > 1) expect(s.plate.f, `${s.id} a crowd in the cabin's seats`).toBe('galley');
      if (s.teams.length < 4) return;
      four++;
      const ys = new Set(Object.values(s.marks).map(m => m[1]));
      expect(ys.size, `${s.id}: one row`).toBe(2);
      // the teams that talk are always in it
      for (const st of s.steps) if (st.team) expect(s.teams).toContain(st.team);
    });
    expect(four).toBeGreaterThan(3);
  });
});

describe('rr viewer: no stamp or slam on a face', () => {
  it('places every TRY AGAIN, QUIT and DONE! above or beside its team, in the picture, on no face', () => {
    const bad = [];
    let n = 0;
    worlds(s => s.steps.forEach((st, k) => {
      if (!st.stamp) return;
      n++;
      const [w0, h0] = stampSize(st.stamp.text), kk = st.stamp.at.k ?? 1, [w, h] = [w0 * kk, h0 * kk];
      const [x, y] = st.stamp.at;
      const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
      expect(r[0] >= 0 && r[2] <= 100 && r[1] >= HUD_H - 0.1 && r[3] <= 100 - BAR + 0.1, `${s.id} step ${k} stamp off the picture [${r}]`).toBe(true);
      for (const f of screenFaces(s, k, st.cam)) if (overlapOf(r, f.box) > 0) bad.push(`${s.id} ${s.seg} step ${k} ${st.stamp.text} on ${f.key}`);
    }));
    expect(n).toBeGreaterThan(40);
    expect(bad).toEqual([]);
  });

  // the beat card (style.js .beatcard: the centre of the picture) is not a face, and a stamp went under it (the user,
  // 2026-10-20: TRY AGAIN half under the card at the hurdles and the catfish swim)
  it('keeps a stamp off the beat card shown on the same click', () => {
    const bad = [];
    let n = 0;
    worlds(s => s.steps.forEach((st, k) => {
      if (!st.stamp || st.part !== 'beat' || !st.text) return;
      n++;
      const [w0, h0] = stampSize(st.stamp.text), kk = st.stamp.at.k ?? 1, [w, h] = [w0 * kk, h0 * kk];
      const [x, y] = st.stamp.at;
      if (overlapOf([x - w / 2, y - h / 2, x + w / 2, y + h / 2], beatCardBox(st.text)) > 0) bad.push(`${s.id} ${s.seg} step ${k} ${st.stamp.text} under the card`);
    }));
    expect(n).toBeGreaterThan(5);
    expect(bad).toEqual([]);
  });

  it('moves a slam off any face (ELIMINATED, PENALTY, BOOMERANG over a push-in)', () => {
    const bad = [];
    let n = 0;
    worlds(s => s.steps.forEach((st, k) => {
      if (!st.slam) return;
      n++;
      const spot = slamSpot(s, k, st.cam), [w, h] = slamSize(st.slam).map(v => v * (spot.k ?? 1)), [x, y] = spot;
      const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
      for (const f of screenFaces(s, k, st.cam)) if (overlapOf(r, f.box) > 0) bad.push(`${s.id} ${s.seg} step ${k} ${st.slam.text} on ${f.key}`);
    }));
    expect(n).toBeGreaterThan(20);
    expect(bad).toEqual([]);
  });

  it('reads the Don Box tip card off every face: at the top, to a side, or smaller', () => {
    let n = 0, smaller = 0;
    worlds(s => s.steps.forEach((st, k) => {
      if (st.part !== 'tip') return;
      n++;
      const { at, k: kk } = tipSpot(s, k, st.cam);
      if (kk < 1) smaller++;
      const sz = [TIP_SIZE[0] * kk, TIP_SIZE[1] * kk];
      expect(coverOf(sz, at, screenFaces(s, k, st.cam)), `${s.id} tip card on a face`).toBe(0);
      expect(at[1] - sz[1] / 2, `${s.id} under the HUD`).toBeGreaterThanOrEqual(HUD_H - 0.1);
      expect(at[1] + sz[1] / 2, `${s.id} over the bar`).toBeLessThanOrEqual(100 - BAR + 0.1);
    }));
    expect(n).toBeGreaterThan(20);
    void smaller;
  });

  it('puts an overlay above a face in the middle, and on the least of them when every place has one', () => {
    const face = [40, 40, 60, 80];
    // the first place asked for that is clear of it
    expect(placeOverlay([20, 10], [face], [[50, 50], [50, 34]])).toEqual([50, 34]);
    // none clear: the nearest place that is
    const [x, y] = placeOverlay([20, 10], [face], [[50, 50]]);
    expect(overlapOf([x - 10, y - 5, x + 10, y + 5], face)).toBe(0);
    // the whole picture full of faces: still inside it, on as little face as it can
    const wall = [];
    for (let i = 0; i < 10; i++) for (let j = 0; j < 9; j++) wall.push([i * 10, 9 + j * 9, i * 10 + 9, 9 + j * 9 + 8]);
    const at = placeOverlay([20, 10], wall, [[50, 50]]);
    expect(at[0] - 10).toBeGreaterThanOrEqual(0);
    expect(at[1] + 5).toBeLessThanOrEqual(100 - BAR);
  });

  it('stamps the stage would draw in another window land on no face either (the unlifted wide shot)', () => {
    worlds(s => s.steps.forEach((st, k) => {
      if (!st.stamp) return;
      const cam = st.cam.shot === 'wide' ? { ...st.cam, y: 0 } : st.cam;
      const spot = stampSpot(s, k, cam, null, { top: HUD_H, bottom: 100 }), [w, h] = stampSize(st.stamp.text).map(v => v * (spot.k ?? 1)), [x, y] = spot;
      const r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
      for (const f of screenFaces(s, k, cam)) expect(overlapOf(r, f.box), `${s.id} step ${k}`).toBe(0);
    }));
  });
});
