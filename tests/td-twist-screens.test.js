// @vitest-environment jsdom
// The other twists and the merge on the stepped stage (vp-td-ep/twist-screens.js), on played seasons.
//
// Guards: a twist that plays as a card with nobody announcing it; a new tribe that never gets its
// own card; a reaction from somebody who is not on the set; a reaction that changes on replay; a
// screen that throws; the merge without its host.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdTwistBlocksScreen, tdMergeScreen, ANNOUNCE } from '../js/vp-td-ep/twist-screens.js';
import { preTwistBlocks, mergeData, buildVPScreens } from '../js/vp-screens.js';
import { stageHtml, ledgerAt, castAt } from '../js/vp-td-ep/stage.js';
import { tdStepTranscript } from '../js/vp-td-ep/steps.js';

const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const cast = () => NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));

let eps = [];
beforeAll(() => {
  seededRun(() => runOneSeason({ romance: 'enabled', setting: 'hosted-camp', twistSchedule: [
    { episode: 3, type: 'tribe-swap', id: 's1' }, { episode: 5, type: 'mutiny', id: 's2' },
    { episode: 7, type: 'double-elim', id: 's3' }, { episode: 11, type: 'the-feast', id: 's4' },
  ] }, 16, cast()), 4242);
  eps = core.gs.episodeHistory.map(e => JSON.parse(JSON.stringify(e)));
  for (const k of ['_reunionRevealed', '_gcRevealed']) if (!(k in window)) window[k] = {};
}, 600000);

const screensOf = () => eps.flatMap(ep => {
  const out = [];
  const t = tdTwistBlocksScreen(ep, preTwistBlocks(ep), { host: 'Chris' });
  if (t) out.push([ep, t]);
  if (ep.isMerge) { const m = tdMergeScreen(ep, mergeData(ep), { host: 'Chris' }); if (m) out.push([ep, m]); }
  return out;
});

describe('TD stepped viewer: the other twists and the merge', () => {
  it('scheduled twists and the merge build stepped screens', () => {
    const all = screensOf();
    expect(all.filter(([, s]) => s.id === 'twist').length).toBeGreaterThanOrEqual(3);
    expect(all.filter(([, s]) => s.id === 'merge').length).toBe(1);
  });

  it('the host announces every twist in the host\'s own words, and is on the set', () => {
    for (const [ep, scr] of screensOf()) {
      expect(scr.steps[0].k).toBe('scene');
      expect(scr.steps[0].places.Chris?.host, `ep${ep.num} ${scr.id}: no host on the set`).toBe(true);
      expect(scr.steps.some(s => s.k === 'say' && s.host), `ep${ep.num} ${scr.id}: never announced`).toBe(true);
    }
    for (const t of ['tribe-swap', 'mutiny', 'double-elim', 'the-feast']) expect(ANNOUNCE[t]).toBeTruthy();
  });

  it('every speaker is on the set, and every step paints', () => {
    const off = [];
    for (const [ep, scr] of screensOf()) scr.steps.forEach((s, i) => {
      const toks = castAt(scr, ledgerAt(scr, i)).map(t => t.n);
      if (s.k === 'say' && !toks.includes(s.by)) off.push(`ep${ep.num} ${scr.id} ${i}: ${s.by}`);
      expect(stageHtml(scr, i, true).html.length).toBeGreaterThan(50);
      expect(String(s.text || '')).not.toMatch(/\{\w+(\.\w+)?\}/);
    });
    expect(off).toEqual([]);
    for (const [, scr] of screensOf()) expect(tdStepTranscript(scr).length).toBe(scr.steps.length);
  });

  it('two people react, and the reaction is the same on every replay', () => {
    const one = screensOf().map(([, s]) => s.steps.filter(x => x.k === 'say' && !x.host).map(x => x.text).join('|'));
    const two = screensOf().map(([, s]) => s.steps.filter(x => x.k === 'say' && !x.host).map(x => x.text).join('|'));
    expect(one).toEqual(two);
    expect(one.filter(Boolean).length).toBeGreaterThanOrEqual(3);
  });

  it('a swap shows each new tribe as its own card', () => {
    const [ep, scr] = screensOf().find(([e, s]) => s.id === 'twist' && (e.twists || []).some(t => t.type === 'tribe-swap')) || [];
    expect(scr).toBeTruthy();
    const tribes = (ep.twists.find(t => t.type === 'tribe-swap').newTribes || []).map(t => t.name);
    for (const t of tribes) expect(scr.steps.some(s => s.k === 'title' && s.name === t), `no card for ${t}`).toBe(true);
  });

  it('buildVPScreens puts the stepped twist and merge screens in their slots', () => {
    core.setGs({ ...core.gs, episodeHistory: eps });
    window.gs = core.gs;
    const swapEp = eps.find(e => (e.twists || []).some(t => t.type === 'tribe-swap'));
    expect(buildVPScreens(swapEp).find(s => s.id === 'twist')?.stepped).toBe(true);
    const mergeEp = eps.find(e => e.isMerge);
    expect(buildVPScreens(mergeEp).find(s => s.id === 'merge')?.stepped).toBe(true);
  });
});
