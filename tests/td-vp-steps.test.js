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
import { tdRiChoiceScreen, tdIslandLifeScreen, tdExileScreen, exileOf } from '../js/vp-td-ep/twists.js';
import { _textTdIslands } from '../js/text-backlog.js';

const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const cast = () => NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));

const seasons = {};
beforeAll(() => {
  for (const [i, setting] of Object.keys(VENUES).entries()) {
    seededRun(() => runOneSeason({ romance: 'enabled', setting }, 16, cast()), 4242 + i * 101);
    seasons[setting] = core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e)));
  }
  // the islands: Redemption (a choice, a duel), Rescue (everyone lands), Exile both sides of the merge
  for (const [i, fmt] of ['redemption', 'rescue'].entries()) {
    seededRun(() => runOneSeason({ romance: 'enabled', setting: 'hosted-camp', ri: true, riFormat: fmt, riReentryAt: 8,
      twistSchedule: [{ episode: 3, type: 'exile-island', id: 'x1' }, { episode: 11, type: 'exile-island', id: 'x2' }] }, 16, cast()), 777 + i);
    islands[fmt] = core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e)));
  }
}, 600000);
const islands = {};

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
      // measured on the people as drawn (a crowd is sized to fit, 2026-10-08): two of them clash when
      // their portraits cover most of each other, not when they merely stand near
      scr.steps.forEach((sc, idx) => {
        if (sc.k !== 'scene' || sc.ceremony) return;
        const toks = castAt(scr, ledgerAt(scr, idx)).filter(t => (sc.focus || []).includes(t.n));
        for (let i = 0; i < toks.length; i++) for (let j = i + 1; j < toks.length; j++) {
          const a = toks[i], b = toks[j], w = (a.h + b.h) / 2 * .5625 / 100, h = (a.h + b.h) / 2 / 100;
          if (Math.abs(a.u - b.u) < w * .7 && Math.abs(a.v - b.v) < h * .5) clash.push(`${setting} ep${ep.num} ${scr.id} ${sc.place}: ${a.n}/${b.n}`);
        }
      });
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
          if (!t.sit && !t.conf && !t.bg) expect(t.v, `${setting} ep${ep.num} ${scr.id} step ${i}: ${t.n} below the panel`).toBeLessThanOrEqual(.745);
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

const P = n => ({ sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' });
function islandScreens(ep) {
  const o = { host: 'Chris', pronouns: P, stats: () => ({}) };
  return [tdRiChoiceScreen(ep, o), tdIslandLifeScreen(ep, false, o), tdIslandLifeScreen(ep, true, o),
    tdExileScreen(ep, exileOf(ep, false), o), tdExileScreen(ep, exileOf(ep, true), o)].filter(Boolean);
}

describe('TD stepped viewer: the islands', () => {
  it('Redemption and Rescue seasons put a choice, island days and an exile on the stage', () => {
    const red = islands.redemption.flatMap(islandScreens), res = islands.rescue.flatMap(islandScreens);
    expect(red.filter(s => s.id === 'ri-choice').length).toBeGreaterThan(2);
    expect(red.filter(s => s.id === 'ri-life').length).toBeGreaterThan(2);
    expect(res.filter(s => s.id === 'rescue-life').length).toBeGreaterThan(2);
    expect([...red, ...res].filter(s => s.id === 'exile-island').length).toBeGreaterThan(1);
  });

  it('every island scene is on a rendered plate, and everyone named in a moment is on it', () => {
    const misses = [];
    for (const eps of Object.values(islands)) for (const ep of eps) for (const scr of islandScreens(ep)) {
      expect(scr.steps[0].k, scr.id).toBe('scene');
      scr.steps.forEach((s, i) => {
        if (s.k === 'scene') expect(fs.existsSync(`assets/sets/td/${s.plate}.webp`), `missing plate ${s.plate}`).toBe(true);
        const toks = castAt(scr, ledgerAt(scr, i)).map(t => t.n);
        const named = s.k === 'say' ? [s.by] : s.k === 'found' ? [s.who] : (s.focus || []);
        for (const n of named) if (!toks.includes(n)) misses.push(`ep${ep.num} ${scr.id} step ${i} (${s.k}): ${n}`);
        const out = stageHtml(scr, i, true);
        for (const t of out.toks) { expect(t.u).toBeGreaterThan(0); expect(t.u).toBeLessThan(1); }
        // nobody standing sinks behind the dialogue panel (their name tag hidden under it)
        for (const t of out.toks) if (!t.sit && !t.conf && !t.bg) expect(t.v, `ep${ep.num} ${scr.id} step ${i}: ${t.n} below the panel`).toBeLessThanOrEqual(.745);
      });
      expect(tdStepTranscript(scr).length).toBe(scr.steps.length);
    }
    expect(misses.slice(0, 10), `${misses.length} people off stage`).toEqual([]);
  });

  it('the island days play every line the scenes wrote, and nothing after the duel', () => {
    let lines = 0;
    for (const [fmt, eps] of Object.entries(islands)) for (const ep of eps) {
      const rescue = fmt === 'rescue';
      const scr = tdIslandLifeScreen(ep, rescue, {});
      if (!scr) continue;
      const shown = scr.steps.filter(s => ['say', 'conf', 'beat'].includes(s.k)).map(s => s.text);
      const evs = (rescue ? ep.rescueIslandEvents : ep.riLifeEvents || []).filter(e => !/^(winner|loser)-/.test(e.type) && e.text);
      for (const e of evs) {
        expect(e.lines?.length, `ep${ep.num} ${e.type} was never written as a scene`).toBeGreaterThan(0);
        for (const l of e.lines) { expect(shown, `ep${ep.num} ${e.type}`).toContain(l.text); lines++; }
      }
      for (const e of (ep.riLifeEvents || []).filter(x => /^(winner|loser)-/.test(x.type))) expect(shown).not.toContain(e.text);
      if (!rescue && ep.riDuel) expect(scr.steps[scr.steps.length - 1].name).toBe('The Duel');
    }
    expect(lines).toBeGreaterThan(200);
  });

  it('an arrival is met before anything else happens to them', () => {
    for (const eps of Object.values(islands)) for (const ep of eps) for (const rescue of [false, true]) {
      const scr = tdIslandLifeScreen(ep, rescue, {});
      if (!scr) continue;
      const evs = rescue ? ep.rescueIslandEvents : ep.riLifeEvents || [];
      for (const arr of evs.filter(e => e.scene?.data?.ending === 'size')) {
        const newcomer = arr.scene.who.b;
        const firstMeet = scr.steps.findIndex(s => s.text === arr.lines[0].text);
        const before = scr.steps.slice(0, firstMeet).filter(s => s.k === 'say' && s.by === newcomer);
        expect(before, `ep${ep.num}: ${newcomer} talks before arriving`).toEqual([]);
      }
    }
  });

  it('a boot bound for an island is voted out, not eliminated, and never walks the Dock of Shame', () => {
    let n = 0;
    for (const ep of islands.redemption) {
      if (!ep.riChoice || !tdTribalStepped(ep)) continue;
      const t = tdTribalScreen(ep, { host: 'Chris' });
      expect(t.steps.some(s => s.exit)).toBe(false);
      expect(t.steps.find(s => s.k === 'out').island).toBe(true);
      n++;
    }
    expect(n).toBeGreaterThan(0);
  });

  it('the text backlog carries the choice and Exile Island as they air', () => {
    const lines = [];
    const ep = islands.redemption.find(e => e.riChoice === 'REDEMPTION ISLAND');
    window.pronouns = window.pronouns || P; window.pStats = window.pStats || (() => ({}));
    _textTdIslands(ep, l => lines.push(l), h => lines.push('## ' + h));
    expect(lines.join(' | ')).toContain('ONE FINAL CHOICE');
    expect(lines.join(' | ')).toContain(`${ep.eliminated} takes the path to the right.`);
  });
});
