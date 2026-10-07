// @vitest-environment jsdom
// Total Drama's stepped viewer (js/vp-td-ep), checked on played seasons in every venue
// (spec 2026-10-06 §8, ADDING-A-SHOW §18.2 "render every step of real seasons").
//
// The bugs these guard: a person who disappears when they talk (they had no place in the
// scene), a scene on a plate that was never rendered, a ceremony without its host, a boot
// called before the safe ones, somebody handed two marshmallows or none, a step that throws.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdCampScreen, tdTribalScreen, tdTribalStepped, tdStepTranscript, VENUES } from '../js/vp-td-ep/steps.js';
import { stageHtml, ledgerAt, castAt } from '../js/vp-td-ep/stage.js';
import { buildVPScreens } from '../js/vp-screens.js';

const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const cast = () => NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));

const seasons = {};
beforeAll(() => {
  for (const [i, setting] of Object.keys(VENUES).entries()) {
    seededRun(() => runOneSeason({ romance: 'enabled', setting }, 16, cast()), 4242 + i * 101);
    seasons[setting] = core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e)));
  }
}, 600000);

const membersOf = (ep, camp) => ep.campAccess?.groups?.[camp]?.members || [];
function screensOf(ep, setting) {
  const out = [];
  for (const camp of Object.keys(ep.campEvents || {})) for (const phase of ['pre', 'post']) {
    const s = tdCampScreen(ep, camp, phase, membersOf(ep, camp), { setting });
    if (s) out.push(s);
  }
  const t = tdTribalScreen(ep, { host: 'Chris', setting });
  if (t) out.push(t);
  return out;
}

describe('TD stepped viewer on played seasons, every venue', () => {
  it('every venue season played and built stepped screens', () => {
    for (const [setting, eps] of Object.entries(seasons)) {
      const n = eps.flatMap(ep => screensOf(ep, setting)).length;
      expect(n, setting).toBeGreaterThan(10);
      expect(eps.some(ep => tdTribalStepped(ep)), `${setting}: no Tribal played on the stepped stage`).toBe(true);
    }
  });

  it('every screen opens on a scene, every scene has a rendered plate', () => {
    for (const [setting, eps] of Object.entries(seasons)) for (const ep of eps) for (const scr of screensOf(ep, setting)) {
      expect(scr.steps[0].k, `${setting} ep${ep.num} ${scr.id}`).toBe('scene');
      for (const s of scr.steps.filter(x => x.k === 'scene')) {
        expect(s.plate, `${setting} ep${ep.num} ${scr.id} ${s.spot}`).toBeTruthy();
        expect(fs.existsSync(`assets/sets/td/${s.plate}.webp`), `missing plate ${s.plate}`).toBe(true);
      }
    }
  });

  it('nobody disappears when they talk: every speaker is placed in the scene on screen', () => {
    const misses = [];
    for (const [setting, eps] of Object.entries(seasons)) for (const ep of eps) for (const scr of screensOf(ep, setting)) {
      scr.steps.forEach((s, i) => {
        if (s.k !== 'say') return;
        const L = ledgerAt(scr, i);
        const toks = castAt(scr, L);
        if (!toks.some(t => t.n === s.by)) misses.push(`${setting} ep${ep.num} ${scr.id} step ${i}: ${s.by}`);
      });
    }
    expect(misses.slice(0, 10), `${misses.length} speakers off stage`).toEqual([]);
  });

  it('people in a conversation never stand on top of each other', () => {
    const clash = [];
    for (const [setting, eps] of Object.entries(seasons)) for (const ep of eps) for (const scr of screensOf(ep, setting)) {
      for (const sc of scr.steps.filter(x => x.k === 'scene' && !x.ceremony)) {
        const f = (sc.focus || []).map(n => sc.places[n]).filter(Boolean);
        for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++)
          if (Math.abs(f[i].u - f[j].u) < .09 && Math.abs(f[i].v - f[j].v) < .12) clash.push(`${setting} ep${ep.num} ${scr.id} ${sc.place}: ${sc.focus.join('/')}`);
      }
    }
    expect(clash.slice(0, 8), `${clash.length} overlaps`).toEqual([]);
  });

  it('every step paints without throwing, and people stay inside the frame', () => {
    for (const [setting, eps] of Object.entries(seasons)) for (const ep of eps) for (const scr of screensOf(ep, setting)) {
      scr.steps.forEach((s, i) => {
        const out = stageHtml(scr, i, true);
        expect(out.html.length).toBeGreaterThan(50);
        for (const t of out.toks) {
          expect(t.u, `${scr.id} ${t.n}`).toBeGreaterThan(0); expect(t.u).toBeLessThan(1);
          expect(t.v, `${scr.id} ${t.n}`).toBeGreaterThan(0); expect(t.v).toBeLessThanOrEqual(1);
        }
      });
    }
  });

  it('the host is on screen at every ceremony, and the ceremony is in order', () => {
    for (const [setting, eps] of Object.entries(seasons)) for (const ep of eps) {
      const t = tdTribalScreen(ep, { host: 'Chris', setting });
      if (!t) continue;
      const sc = t.steps[0];
      expect(sc.places.Chris?.host, `${setting} ep${ep.num}: no host mark`).toBe(true);
      for (const n of ep.tribalPlayers) expect(sc.places[n], `${setting} ep${ep.num}: ${n} not seated`).toBeTruthy();
      const out = t.steps.findIndex(s => s.k === 'out');
      expect(out).toBeGreaterThan(0);
      expect(t.steps[out].who).toBe(ep.eliminated);
      if (VENUES[setting].style === 'handout') {
        const safe = t.steps.filter(s => s.k === 'safe').map(s => s.who);
        expect(new Set(safe).size, 'someone got two').toBe(safe.length);
        expect(safe).not.toContain(ep.eliminated);
        expect(safe.length).toBe(ep.tribalPlayers.length - 1);
        expect(t.steps.findLastIndex(s => s.k === 'safe')).toBeLessThan(out);
      } else {
        const reads = t.steps.filter(s => s.k === 'read');
        expect(reads.length).toBeGreaterThan(0);
        expect(t.steps.findLastIndex(s => s.k === 'read')).toBeLessThan(out);
      }
    }
  });

  it('the transcript carries every step', () => {
    for (const [setting, eps] of Object.entries(seasons)) for (const ep of eps) for (const scr of screensOf(ep, setting)) {
      expect(tdStepTranscript(scr).length).toBe(scr.steps.length);
    }
  });

  it('buildVPScreens swaps the camp and Tribal screens in their slots', () => {
    const eps = seasons['hosted-camp'];
    core.setGs({ ...core.gs, episodeHistory: eps });
    window.gs = core.gs;
    // the classic builder's reveal registries are window globals in the app (vp-ui.js)
    for (const k of ['_reunionRevealed', '_gcRevealed']) if (!(k in window)) window[k] = {};
    const ep = eps.find(e => tdTribalStepped(e));
    const screens = buildVPScreens(ep);
    const ids = screens.map(s => s.id);
    expect(ids.some(id => id.startsWith('camp-pre-'))).toBe(true);
    expect(screens.filter(s => s.stepped).length).toBeGreaterThan(1);
    expect(ids).toContain('tribal');
    expect(ids).not.toContain('votes');
    expect(screens.find(s => s.id === 'tribal').stepped).toBe(true);
  });
});
