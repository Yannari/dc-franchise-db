// A Big Brother episode remembers where its viewer left it: the screen, the line reached, and the
// house-map conversations watched, across coming back to a screen, closing the viewer and a reload.
// The user, 2026-10-24: "the episode keep returning to the first frame even after i skip" and "it
// should persist read conversations even after i close".
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbStepScreens, bbxJump, bbxResumeAt, bbxNext } from '../js/vp-bb-ep/screens.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
let row;

beforeAll(() => {
  setGs(null);
  setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
    stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3) % 10)])) })));
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
  seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = gs;
  withSeededRandom(5, () => { for (let i = 0; i < 2; i++) simulateBBEpisode(); });
  row = gs.episodeHistory.filter(r => r.format === 'big-brother' && !r.isFinale)[1];
  globalThis._bbxFast = true; window._bbxFast = true;
}, 300000);

// what the Viewing Party does: put a screen's html in the page, and say it opened
function show(out, id) {
  let box = document.getElementById('vp-screen-content');
  if (!box) { box = document.createElement('div'); box.id = 'vp-screen-content'; document.body.appendChild(box); }
  box.innerHTML = out.find(x => x.id === id).html;
  document.dispatchEvent(new CustomEvent('vp:screen', { detail: { id } }));
  return box.querySelector('.bbx[data-uid]')?.dataset.uid;
}
const stepped = out => out.filter(x => typeof x.html === 'string' && x.html.includes('class="bbx"') && !/houselife|^bb-house/.test(x.id));

describe('the episode remembers where it was left', () => {
  it('a screen played into, left and reopened is where it was, and so is the episode', () => {
    localStorage.clear();
    const out = bbStepScreens(row, [], { host: 'Valeria' });
    const [a, b] = stepped(out);
    expect(a && b).toBeTruthy();
    // play four lines into the second screen
    const uid = show(out, b.id);
    bbxJump(uid, 4);
    expect(window._bbx[uid].idx).toBe(3);
    // away to another screen and back: still on line four, and the next click is line five
    show(out, a.id);
    show(out, b.id);
    expect(document.querySelector(`.bbx[data-uid="${uid}"]`).dataset.idx).toBe('3');
    bbxNext(uid);
    expect(window._bbx[uid].idx).toBe(4);
    // closed, and built again from nothing (a reload): the episode opens on that screen, at that line
    const again = bbStepScreens(row, [], { host: 'Valeria' });
    expect(bbxResumeAt(row)).toBe(b.id);
    expect(window._bbx[uid].idx).toBe(4);
    show(again, b.id);
    expect(document.querySelector(`.bbx[data-uid="${uid}"]`).dataset.idx).toBe('4');
  });

  it('a house-map conversation watched stays watched after closing', () => {
    localStorage.clear();
    const out = bbStepScreens(row, [], { host: 'Valeria' });
    const mapUid = Object.keys(window._bbx).find(u => window._bbx[u]?.map && window._bbx[u].num === row.num);
    expect(mapUid, 'this week has a house map').toBeTruthy();
    const R = window._bbx[mapUid];
    const screenId = out.find(x => typeof x.html === 'string' && x.html.includes(`data-uid="${mapUid}"`)).id;
    show(out, screenId);
    const c = R.map.convs[0];
    // watch the first conversation to its end
    bbxJump(mapUid, c.from + 1);
    while (window._bbx[mapUid].idx < c.to) bbxNext(mapUid);
    bbxNext(mapUid);
    expect([...window._bbx[mapUid].map.watched]).toContain(c.k);
    bbStepScreens(row, [], { host: 'Valeria' });
    expect([...window._bbx[mapUid].map.watched]).toContain(c.k);
  });

  it('keeps one record per episode, named by its season, its number and its screens', () => {
    localStorage.clear();
    const out = bbStepScreens(row, [], { host: 'Valeria' });
    bbxJump(show(out, stepped(out)[1].id), 3);
    const keys = Object.keys(JSON.parse(localStorage.getItem('bb-watched')));
    expect(keys).toHaveLength(1);
    expect(keys[0].split('|').slice(-2)).toEqual([String(row.num), expect.stringMatching(/^[0-9a-z]+$/)]);
  });
});
