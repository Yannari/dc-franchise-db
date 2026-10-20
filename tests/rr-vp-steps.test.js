// The Ridonculous Race viewer (js/vp-rr-ep): the steps are pure, every aired line is one
// click, the order never shows before the mat, nobody talks from off screen, nobody stands
// in water, and every plate is a file that exists. Spec §9.7; ADDING-A-SHOW §18.4.
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { castFromRoster, rosterPlayers } from '../js/vp-rr-ep/cast.js';
import { episodeScreens, flatSteps, intelAt, extentOf, BAR, crowdAt, boxOf, inView, attemptAt, CROWD_SCALE } from '../js/vp-rr-ep/steps.js';
import { PLACE_PLATES, RACE, placeFiles, propFiles, plateUrl, raceUrl, propUrl, slugFile } from '../js/vp-rr-ep/plates.js';
import { PLACES } from '../js/rr/places.js';
import { PLACE_MUSIC, MOMENTS, RACE_SOUNDS, placeFile, raceFile } from '../js/vp-rr-ep/music.js';
import { HAVE } from '../js/vp-rr-ep/music-have.js';
import { soundAt } from '../js/vp-rr-ep/sound.js';

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

const each = fn => { for (const p of played) p.built.forEach((ep, i) => fn(ep, p, i)); };

describe('rr viewer steps', () => {
  it('builds the same cast in the browser as the test helper', () => {
    const roster = rosterPlayers(JSON.parse(readFileSync('franchise_roster.json', 'utf8')));
    for (const [n, seed] of SEASONS) expect(castFromRoster(roster, n, seed)).toEqual(raceCast(n, seed));
  });

  it('is pure: the same episode twice is the same screens', () => {
    const p = played[0];
    for (const i of [0, 3, p.eps.length - 1]) expect(JSON.stringify(episodeScreens(p.res, p.eps, i))).toBe(JSON.stringify(p.built[i]));
  });

  it('gives every aired line exactly one step, in order', () => {
    each((ep, p, i) => {
      const e = p.eps[i];
      const aired = [...(e.previously?.lines || []), ...e.segments.filter(s => s.lines?.length).flatMap(s => s.lines)].map(l => l.text);
      const shown = ep.screens.flatMap(s => s.steps).filter(s => ['say', 'beat', 'conf'].includes(s.part)).map(s => s.text);
      expect(shown).toEqual(aired);
    });
  });

  it('never shows a placement before that team reaches the mat', () => {
    each(ep => {
      const flat = flatSteps(ep.screens);
      const rankAt = {};
      flat.forEach((f, k) => { const r = ep.screens[f.si].steps[f.idx].rank; if (r && rankAt[r.team] == null) rankAt[r.team] = k; });
      flat.forEach((f, k) => {
        const it = intelAt(ep, f.si, f.idx);
        for (const team of Object.keys(it.placed)) expect(rankAt[team], `${team} placed at step ${k}`).toBeLessThanOrEqual(k);
      });
      // the side panel's order is where the leg started, not where it ends
      expect(ep.startOrder.slice().sort()).toEqual(ep.racing.slice().sort());
    });
  });

  it('puts every speaker on screen while they talk', () => {
    each((ep, p) => {
      const st = p.res.state;
      const teamOf = {};
      for (const id of st.order) { teamOf[st.teams[id].a] = id; teamOf[st.teams[id].b] = id; }
      for (const s of ep.screens) {
        s.steps.forEach((step, k) => {
          if (!step.by || step.part === 'pause') return;
          const where = `${s.id} ${s.seg} "${step.text.slice(0, 40)}"`;
          if (s.kind === 'iv') { expect(s.people, where).toContain(step.by); return; }
          if (s.kind === 'map') { expect(step.by === 'Don' || step.clip, where).toBe(true); return; }
          if (step.by === 'Don') { expect(s.don || s.narrator || s.kind === 'flight', where).toBe(true); return; }
          const team = teamOf[step.by];
          if (!team) { expect(s.localAt?.[step.by], where).toBeTruthy(); return; }
          expect(s.teams, where).toContain(team);
          expect(s.marks[team] || s.pos?.[k]?.[team], where).toBeTruthy();
          if (s.hiddenUntil?.[team] != null) expect(s.hiddenUntil[team], where).toBeLessThanOrEqual(k);
          // in the water a Botch's watcher is in the inset; the one doing it is in the shot
          if (s.swimmers?.[team] && !s.swimmers[team].includes(step.by)) expect(s.inset?.people, where).toContain(step.by);
        });
      }
    });
  });

  it('stands nobody in water, and keeps everybody in the frame', () => {
    const onGround = (plate, [x, y]) => {
      if (plate.spots?.some(sp => Math.abs(sp[0] - x) < 8 && Math.abs(sp[1] - y) < 2)) return true;
      for (const m of [plate.mat, plate.matPos]) if (m && Math.abs(m[0] - x) < 1 && Math.abs(m[1] - y) < 1) return true;
      const g = Array.isArray(plate.g) ? plate.g : [plate.g, plate.g];
      return y >= Math.min(...g) - 0.5 && y <= Math.max(...g) + 0.5 && x >= plate.x[0] - 0.5 && x <= plate.x[1] + 0.5;
    };
    each(ep => {
      for (const s of ep.screens) {
        if (!s.marks) continue;
        for (const [team, m] of Object.entries(s.marks)) {
          const as = s.as[team];
          if (as === 'stand') {
            expect(s.plate.water, `${s.id} ${team} stands on a water plate`).toBeFalsy();
            expect(onGround(s.plate, m), `${s.id} ${s.seg} ${team} at ${m} off the ground of ${s.plate.f}`).toBe(true);
          }
        }
        for (const d of [s.donStand, ...Object.values(s.localAt || {})].filter(Boolean)) {
          expect(s.plate.water, `${s.id} Don or a local in water`).toBeFalsy();
          expect(onGround(s.plate, d), `${s.id} Don/local at ${d}`).toBe(true);
        }
        // a pair is wider than its feet: the whole token inside the frame
        const half = (s.size || 8) * 0.775;
        for (const [team, m] of Object.entries(s.marks)) if (s.as[team] !== 'swim' && s.as[team] !== 'dive' && s.as[team] !== 'ride') {
          expect(m[0], `${s.id} ${s.seg} ${team} at x=${m[0]} half=${half} on ${s.plate.f}`).toBeGreaterThanOrEqual(half - 0.6);
          expect(m[0], `${s.id} ${s.seg} ${team} at x=${m[0]}`).toBeLessThanOrEqual(100 - half + 0.6);
        }
        for (const pos of s.pos || []) for (const [team, [x, y]] of Object.entries(pos)) if (!['swim', 'dive', 'ride'].includes(s.as[team])) {
          expect(y, `${s.id} ${team} too high: the faces leave the frame`).toBeGreaterThanOrEqual(s.size * 2.35 + 0.5);
          expect(x, `${s.id} ${team} too far to the side`).toBeGreaterThanOrEqual(half - 0.6);
        }
        for (const pos of s.pos || []) for (const [team, [, y]] of Object.entries(pos)) if (['swim', 'dive'].includes(s.as[team])) {
          expect(y, `${s.id} ${team}: a swimmer's head and name leave the bottom of the frame`).toBeLessThanOrEqual(100 - 1.2 * s.size - 0.5);
        }
        for (const pos of s.pos || []) for (const [x, y] of Object.values(pos)) {
          expect(x, s.id).toBeGreaterThanOrEqual(0); expect(x, s.id).toBeLessThanOrEqual(100);
          expect(y, s.id).toBeGreaterThanOrEqual(5); expect(y, s.id).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  it('lifts every shot so nobody stands behind the dialogue bar, and nobody leaves the top', () => {
    const behind = [];
    each(ep => {
      for (const s of ep.screens) {
        if (s.kind !== 'world' || !s.plate) continue;
        // a shot whose camera follows a climb is checked step by step
        const shots = s.liftAt ? s.pos.map((pos, k) => [extentOf({ ...s, marks: {}, pos: [pos], crowd: crowdAt(s, k), donStand: null, localAt: null, matAt: null }), s.liftAt[k]]) : [[extentOf(s), s.lift]];
        for (const [{ bottom, top }, lift] of shots) {
          expect(top - lift, `${s.id} lifted out of the top`).toBeGreaterThanOrEqual(1.9);
          if (bottom - lift > 100 - BAR + 0.1) behind.push(`${s.id} ${s.seg} ${s.plate.f} bottom ${bottom.toFixed(1)} lift ${lift}`);
        }
      }
    });
    expect(behind).toEqual([]);
  });

  it('shows every team at every task it ran', () => {
    each((ep, p, i) => {
      const leg = p.res.legs[i];
      const rows = (p.res.state.taskLog || []).filter(r => r.leg === leg.n && PLACES[leg.place]?.stretches.some(s => s.id === r.stretch));
      const seen = new Set(ep.screens.filter(s => s.stretch).flatMap(s => (s.teams || []).map(t => `${t}|${s.stretch}`)));
      const missing = rows.filter(r => !seen.has(`${r.team}|${r.stretch}`)).map(r => `${r.team}@${r.stretch}`);
      expect(missing, `leg ${leg.n}`).toEqual([]);
    });
  });

  // a place still being built (js/rr/places: draft: true) has its plates and music when its batch lands; every other
  // place has them, and so does a draft that has its plates already
  const built = id => !PLACES[id].draft || !!PLACE_PLATES[id];
  it('resolves every plate and cut-out to a file that exists', () => {
    for (const id of Object.keys(PLACES).filter(built)) {
      expect(PLACE_PLATES[id], id).toBeTruthy();
      for (const f of placeFiles(id)) expect(existsSync(plateUrl(id, f)), `${id}/${slugFile(f)}`).toBe(true);
      for (const { key } of propFiles(id)) expect(existsSync(propUrl(id, key)), `${id} prop ${key}`).toBe(true);
      for (const s of PLACES[id].stretches) expect(PLACE_PLATES[id].st[s.id], `${id}/${s.id} has no plates`).toBeTruthy();
    }
    for (const k of ['gate', 'cabin', 'galley', 'sky', 'runway']) expect(existsSync(raceUrl(RACE[k].f)), k).toBe(true);
    for (const f of [RACE.map, RACE.confess, RACE.logo, ...RACE.props]) expect(existsSync(raceUrl(f)), f).toBe(true);
    // borrowed props (taxi@red-sand-desert) exist where they are borrowed from
    for (const pl of Object.values(PLACE_PLATES)) for (const s of Object.values(pl.st)) for (const a of [s.act, ...Object.values(s.sides || {}).map(x => x.act)]) {
      if (a?.prop) expect(existsSync(propUrl(Object.keys(PLACE_PLATES).find(k => PLACE_PLATES[k] === pl), a.prop)), a.prop).toBe(true);
    }
  });

  it('shoots every screen on a plate of the place it says it is in', () => {
    each(ep => {
      for (const s of ep.screens) {
        if (!s.plate?.f || s.plate.race) continue;
        expect(placeFiles(s.plate.place), `${s.id} ${s.seg}: ${s.plate.f} is not a plate of ${s.plate.place}`).toContain(s.plate.f);
        expect(existsSync(plateUrl(s.plate.place, s.plate.f)), `${s.id} ${s.plate.place}/${s.plate.f}`).toBe(true);
      }
    });
  });

  it('names no real country or city on screen', () => {
    const REAL = /\b(japan|france|paris|china|beijing|egypt|brazil|mexico|canada|toronto|new york|london|australia|iceland|russia|hawaii|italy|spain|africa|america|europe|asia|finland|peru|kenya|thailand)\b/i;
    each(ep => {
      for (const s of ep.screens) {
        const t = [s.hud?.task, s.title?.big, s.title?.sub, s.title?.pre, s.timecard, ...s.steps.map(x => x.tip ? `${x.tip.label} ${x.tip.desc}` : '')].join(' ');
        expect(REAL.test(t), `${s.id}: ${t.match(REAL)?.[0]}`).toBe(false);
      }
    });
  });
  // ── the rest of the race behind the shot (the user, 2026-10-19: "we dont see them at the same zone") ──
  it('puts behind a shot only the teams the log has at that stretch at that moment', () => {
    let crowds = 0;
    each((ep, p, i) => {
      const leg = p.res.legs[i];
      const rankedBefore = new Set();
      for (const s of ep.screens) {
        for (const c of s.crowd || []) {
          expect(s.teams, `${s.id}: ${c.team} is both in the shot and behind it`).not.toContain(c.team);
          if (s.mode === 'mat') { expect(rankedBefore.has(c.team), `${s.id}: ${c.team} waits at the Chill Zone before its placement aired`).toBe(true); continue; }
          if (s.seg === 'don-opener' || s.seg === 'team-intro') continue;
          c.pos.forEach((at, k) => {
            if (!at) return;
            crowds++;
            const t = s.crowdT[k];
            const row = leg.log.find(r => r.id === c.team && r.stretch === s.stretch && t >= r.from - 1 && t <= r.to + 1);
            expect(row, `${s.id} ${s.stretch}: ${c.team} on screen at ${t} but the log has it elsewhere`).toBeTruthy();
          });
        }
        for (const x of s.steps) if (x.rank && !x.rank.out) rankedBefore.add(x.rank.team);
      }
    });
    expect(crowds).toBeGreaterThan(200);
  });

  it('stands nobody behind the shot in water, unless they swim, ride or climb it', () => {
    const half = s => (s.crowdSize || 6) * 0.775;
    each(ep => {
      for (const s of ep.screens) for (const c of s.crowd || []) c.pos.forEach(at => {
        if (!at || at[0] < 0 || at[0] > 100) return;
        if (['stand', 'run'].includes(c.as)) {
          expect(s.plate.water, `${s.id} ${c.team} stands on a water plate`).toBeFalsy();
          const g = Array.isArray(s.plate.g) ? s.plate.g : [s.plate.g, s.plate.g];
          const onSpot = s.plate.spots?.some(sp => Math.abs(sp[0] - at[0]) < 1 && Math.abs(sp[1] - at[1]) < 1);
          expect(onSpot || (at[1] >= Math.min(...g) - 0.5 && at[1] <= Math.max(...g) + 0.5), `${s.id} ${c.team} at ${at} off the ground of ${s.plate.f}`).toBe(true);
          expect(onSpot || (at[0] >= s.plate.x[0] - 0.5 && at[0] <= s.plate.x[1] + 0.5), `${s.id} ${c.team} at x=${at[0]} off the ground of ${s.plate.f}`).toBe(true);
          expect(at[0], `${s.id} ${c.team} cut by the frame`).toBeGreaterThanOrEqual(half(s) - 0.7);
        // (push: a carriage through the ankle-deep sewer)
        } else if (s.plate.water) expect(['swim', 'dive', 'ride', 'hop', 'zip', 'para', 'climb', 'swing', 'roll', 'push'], `${s.id} ${c.team} ${c.as} in water`).toContain(c.as);
      });
    });
  });

  it('never shows a rank on the crowd: a rank is only ever for a team in the shot', () => {
    each(ep => {
      for (const s of ep.screens) for (const x of s.steps) if (x.rank) expect(s.teams, `${s.id}: a rank for a team not in the shot`).toContain(x.rank.team);
    });
  });

  it('works out a task attempt by attempt: up, a slip back, and up again', () => {
    const row = { from: 0, to: 30, attempts: 3, fails: 2 };
    const at = [2, 8, 9.5, 14, 19.5, 25, 29.8].map(t => attemptAt(row, t));
    expect(at.map(a => a.st)).toEqual(['try', 'fail', 'fail', 'try', 'fail', 'try', 'done']);
    expect(at[3].p).toBeLessThan(at[2].p);              // the slip
    expect(at[6].p).toBeGreaterThan(0.95);
    expect(attemptAt({ from: 0, to: 10, attempts: 2, quit: true }, 9.8).st).toBe('quit');
  });

  // ── the camera: wide for the action, in where a line earns it, held, and never cutting the one talking ──
  it('frames every speaker whole and above the bar, in every shot', () => {
    const bad = [];
    let closes = 0;
    each(ep => {
      for (const s of ep.screens) {
        if (s.kind !== 'world' || !s.plate) continue;
        s.steps.forEach((st, k) => {
          const cam = st.cam;
          expect(cam, `${s.id} step ${k} has no shot`).toBeTruthy();
          if (cam.shot !== 'wide') closes++;
          expect(cam.s).toBeGreaterThanOrEqual(1);
          expect(cam.x).toBeGreaterThanOrEqual(0); expect(cam.x).toBeLessThanOrEqual(100 - 100 / cam.s + 0.01);
          const who = st.part === 'pause' ? null : st.by === 'Don' ? (s.donStand ? 'Don' : null) : st.team && s.teams.includes(st.team) ? st.team : st.by && s.localAt?.[st.by] ? st.by : null;
          if (who == null || cam.shot === 'wide') return;            // a wide shot is the lift, checked above
          const b = boxOf(s, who, k);
          if (!inView(cam, b, BAR)) bad.push(`${s.id} ${s.seg} step ${k} ${cam.shot} x${cam.s} cuts ${who} [${b.map(v => v.toFixed(1))}] view ${cam.x},${cam.y}`);
        });
      }
    });
    expect(bad).toEqual([]);
    expect(closes).toBeGreaterThan(100);
  });

  it('holds a shot: no cut on one click and another on the next, except a push-in on a pause or a slam', () => {
    const jumpy = [];
    each(ep => {
      for (const s of ep.screens) {
        if (s.kind !== 'world' || s.steps.some(x => x.cam?.shot === 'follow')) continue;
        const key = c => `${c.shot}|${c.s}|${c.x}|${c.y}`;
        for (let k = 2; k < s.steps.length; k++) {
          const [a, b, c] = [s.steps[k - 2], s.steps[k - 1], s.steps[k]];
          const forced = x => x.part === 'pause' || !!x.slam || !!x.rank;
          if (key(a.cam) !== key(b.cam) && key(b.cam) !== key(c.cam) && !forced(b) && !forced(c)) {
            // allowed only when the next speaker was out of the shot
            const who = c.by === 'Don' ? 'Don' : c.team || c.by;
            // or the shot before lost its own subject (a swimmer gone across the water)
            const lost = b.cam.shot !== 'wide' && (b.cam.on || []).some(x => !inView(b.cam, boxOf(s, x, k)));
            if (inView(b.cam, boxOf(s, who, k)) && !lost) jumpy.push(`${s.id} ${s.seg} steps ${k - 2}-${k}`);
          }
        }
      }
    });
    expect(jumpy).toEqual([]);
  });

  it('gives every reaction to somebody in the shot', () => {
    let n = 0;
    each(ep => {
      for (const s of ep.screens) for (const st of s.steps) if (st.react) {
        n++;
        if (s.kind === 'iv') { expect(s.people, `${s.id} a confessional reaction by somebody not in it`).toContain(st.react.who); expect(st.react.who).not.toBe(st.by); continue; }
        expect(s.teams, `${s.id} reaction by a team not in the shot`).toContain(st.react.team);
        expect(['nod', 'shake', 'jump', 'laugh', 'tilt', 'slump']).toContain(st.react.how);
      }
    });
    expect(n).toBeGreaterThan(300);
  });
});

// ── the sound: every place and moment its own track, the race's own stings, never a Total Drama bed ──
describe('rr viewer sound', () => {
  it('has a file for every place and every moment, with its credit', () => {
    const credits = JSON.parse(readFileSync('assets/audio/rr/credits.json', 'utf8'));
    for (const place of Object.keys(PLACE_MUSIC)) for (const m of Object.keys(MOMENTS)) {
      const f = placeFile(place, m);
      expect(existsSync(f), f).toBe(true);
      expect(HAVE.has(f), f).toBe(true);
      expect(credits[f.replace('assets/audio/rr/', '')]?.license, f).toMatch(/CC BY|CC0|Pixabay/);
    }
    for (const name of Object.keys(RACE_SOUNDS)) expect(existsSync(raceFile(name)), name).toBe(true);
    for (const f of HAVE) expect(existsSync(f), f).toBe(true);
    expect(Object.keys(PLACE_MUSIC).sort()).toEqual(Object.keys(PLACES).filter(id => !PLACES[id].draft || PLACE_MUSIC[id]).sort());
    // different music in each place: no track twice
    const titles = Object.values(credits).map(c => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('plays the place and the moment of every step, from a file the race owns', () => {
    each((ep, p, i) => {
      const placeId = p.res.legs[i].place;
      const seen = new Set();
      ep.screens.forEach((s, si) => s.steps.forEach((_, k) => {
        const { moment, bed, sting } = soundAt(ep, si, k);
        expect(moment, `${s.id} has no moment`).toBeTruthy();
        expect(bed?.file, `${s.id} ${s.seg} is silent`).toBeTruthy();
        expect(bed.file.startsWith('assets/audio/rr/'), `${s.id}: ${bed.file} is not the race's`).toBe(true);
        if (moment.place) seen.add(moment.moment);
        if (moment.place && s.kind === 'world' && !s.replay && !s.plate?.race) expect([placeId, p.res.legs[i - 1]?.place]).toContain(moment.place);
        if (sting) expect(existsSync(raceFile(sting)), sting).toBe(true);
      }));
      for (const m of ['opener', 'challenge', 'chill-zone', 'interview']) expect(seen.has(m), `leg ${i + 1} never plays ${m}`).toBe(true);
    });
  });

  it('marks the moments: a task going wrong, the Don Box, a placement, the elimination', () => {
    let struggle = 0, box = 0, place = 0, elim = 0;
    each(ep => ep.screens.forEach((s, si) => s.steps.forEach((st, k) => {
      const { moment, sting } = soundAt(ep, si, k);
      if (moment?.moment === 'struggle') struggle++;
      if (sting === 'donbox') { box++; expect(st.part).toBe('tip'); }
      if (sting === 'placement') { place++; expect(st.rank).toBeTruthy(); }
      if (moment?.moment === 'elimination') elim++;
    })));
    expect(struggle).toBeGreaterThan(20); expect(box).toBeGreaterThan(10); expect(place).toBeGreaterThan(20); expect(elim).toBeGreaterThan(3);
  });

  it('tells the simulator pane to play the race own bed, the one already on, never one of its own', () => {
    const src = readFileSync('js/vp-rr-ep/vp.js', 'utf8');
    expect(src).toMatch(/class="rrx"[^>]*data-ambient="\$\{esc\(bed\)\}"/);
    expect(src).toMatch(/soundAt\(e, c\.from, 0\)\.bed/);
  });
});


describe('rr viewer judge at a fixed spot', () => {
  // a judge who belongs somewhere on the plate (the launcher robot across the net) stands there, not beside the team
  it('puts a plate-placed judge where the plate says, on every act shot', () => {
    const { cast, teams } = raceCast(8, 5);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 5, options: { pins: { 2: 'glass-tower-gulf' } } });
    const eps = airSeason(res);
    const shots = eps.flatMap((_, i) => episodeScreens(res, eps, i).screens).filter(s => s.mode === 'act' && s.plate?.f === 'task-tennis-court');
    expect(shots.length).toBeGreaterThan(0);
    for (const s of shots) {
      expect(s.plate.judgeAt, 'the tennis plate places its robot').toBeTruthy();
      expect(s.judgeAt.at).toEqual(s.plate.judgeAt);
      expect(s.judgeAt.flip).toBe(false);
    }
  }, 240000);
});
