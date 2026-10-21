// How a place is presented before its leg (the user, 2026-10-21: "the presentation of the place could be better more
// text showing more images more descriptions"; then "yes do all 4, keep the challenges a surprise"):
//   1. more shots: five or six a place, its own views and a look at where its challenges are;
//   2. a caption on every shot, the way a travel show says what you're looking at;
//   3. an opening card: the name big, a pin on the race map, a line about it and three facts;
//   4. more of Don, a line a shot, in whole sentences.
// The challenges stay a surprise: nothing on the card or the shots names one or says how it works.
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { ABOUT, aboutOf, cardOf } from '../js/vp-rr-ep/about.js';
import { PLACE_PLATES, plateUrl, stretchPlates } from '../js/vp-rr-ep/plates.js';
import { PLACES } from '../js/rr/places.js';
import { donFlowProblem } from '../js/rr/script/don-flow.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';

const TASKS = new Set(['either', 'botch', 'allin', 'route', 'superteam']);
// the words that would give a challenge away: its kind, and its own name on the board
const KINDS = /either\s*\/?\s*or|botch|all-in|superteam|route info/i;
const giveaway = (place, text) => {
  if (KINDS.test(text)) return 'a challenge kind';
  for (const s of PLACES[place].stretches.filter(x => TASKS.has(x.kind))) {
    const name = String(s.label || '').replace(/^(All-In|Botch or Watch|Superteam):\s*/i, '').trim();
    if (name.length > 6 && text.toLowerCase().includes(name.toLowerCase())) return `the challenge's name "${name}"`;
    for (const side of s.sides || []) if (new RegExp(`\\b${side.label}\\b`, 'i').test(text) && side.label.length > 4) return `the side "${side.label}"`;
  }
  return null;
};

describe('rr places: how each one is presented', () => {
  it('gives every place an opening card: a line about it and three facts', () => {
    for (const id of Object.keys(PLACE_PLATES)) {
      const c = cardOf(id);
      expect(c, id).toBeTruthy();
      expect(c.tag.length, `${id} tag`).toBeGreaterThan(14);
      expect(c.facts.length, `${id} facts`).toBe(3);
      for (const f of c.facts) expect(f.length, `${id} fact: ${f}`).toBeGreaterThan(18);
      expect(c.say.length, `${id} card line`).toBeGreaterThan(20);
      expect(existsSync(plateUrl(id, c.plate.f)), `${id} card plate`).toBe(true);
    }
  });

  it('shows five or six shots of every place, each with a caption and a line of Don\'s', () => {
    for (const id of Object.keys(PLACE_PLATES)) {
      const shots = aboutOf(id);
      expect(shots.length, id).toBeGreaterThanOrEqual(5);
      expect(shots.length, id).toBeLessThanOrEqual(6);
      expect(new Set(shots.map(s => s.plate.f)).size, `${id}: a shot each`).toBe(shots.length);
      for (const s of shots) {
        expect(existsSync(plateUrl(id, s.plate.f)), `${id} ${s.plate.f}`).toBe(true);
        expect(s.cap.length, `${id} caption ${s.cap}`).toBeGreaterThan(3);
        expect(s.cap.length, `${id} caption ${s.cap}`).toBeLessThanOrEqual(44);
        expect(s.text.length, `${id} ${s.plate.f}`).toBeGreaterThan(20);
      }
    }
  });

  it('looks at where the challenges are, at least two of them a place, without naming one', () => {
    for (const id of Object.keys(PLACE_PLATES)) {
      const shots = aboutOf(id);
      const teasers = shots.filter(s => s.tease);
      expect(teasers.length, id).toBeGreaterThanOrEqual(Math.min(2, PLACES[id].stretches.filter(x => TASKS.has(x.kind)).length));
      // a teaser is at a challenge: one of its plates
      const at = new Set();
      for (const st of PLACES[id].stretches.filter(x => TASKS.has(x.kind))) {
        const sp = stretchPlates(id, st.id, null) || {};
        for (const p of [...(sp.talk || []), sp.act, sp.act2, ...(sp.wide || []), ...(sp.alt || [])].filter(Boolean)) at.add(p.f);
        for (const side of st.sides || []) { const sd = stretchPlates(id, st.id, side.id) || {}; for (const p of [...(sd.talk || []), sd.act].filter(Boolean)) at.add(p.f); }
        for (const sg of Object.values(sp.stages || {})) for (const p of [sg.plate, sg.fail, ...(sg.alt || [])].filter(Boolean)) at.add(p.f);
      }
      for (const s of teasers) expect(at.has(s.plate.f), `${id} teaser ${s.plate.f} is at a challenge`).toBe(true);
    }
  });

  it('keeps the challenges a surprise: no card, caption or line names one', () => {
    const bad = [];
    for (const id of Object.keys(PLACE_PLATES)) {
      const c = cardOf(id);
      for (const t of [c.tag, c.say, ...c.facts, ...aboutOf(id).flatMap(s => [s.cap, s.text])]) {
        const why = giveaway(id, t);
        if (why) bad.push(`${id}: ${why} in "${t}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('has Don speak in whole sentences on every card and shot', () => {
    const bad = [];
    for (const id of Object.keys(ABOUT)) for (const t of [cardOf(id).say, ...aboutOf(id).map(s => s.text)]) if (donFlowProblem(t)) bad.push(`${id}: ${t}`);
    expect(bad).toEqual([]);
  });
});

describe('rr viewer: the place, presented', () => {
  const eps = [];
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 8);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 8 });
    const aired = airSeason(res);
    for (let i = 0; i < 3; i++) eps.push({ leg: res.legs[i], ep: episodeScreens(res, aired, i) });
  }, 300000);

  it('opens on the card, then the captioned shots, before Don opens the leg', () => {
    for (const { leg, ep } of eps) {
      const card = ep.screens.findIndex(s => s.seg === 'place-card');
      const shots = ep.screens.filter(s => s.seg === 'place-present');
      const opener = ep.screens.findIndex(s => s.seg === 'don-opener');
      expect(card, `leg ${leg.n}`).toBeGreaterThan(-1);
      expect(ep.screens[card].card.facts.length).toBe(3);
      expect(ep.screens[card].card.map).toEqual(PLACES[leg.place].map);
      expect(shots.length, `leg ${leg.n}`).toBeGreaterThanOrEqual(5);
      for (const s of shots) {
        expect(ep.screens.indexOf(s)).toBeGreaterThan(card);
        expect(s.caption, s.id).toBeTruthy();
      }
      if (opener >= 0) expect(opener).toBeGreaterThan(ep.screens.indexOf(shots.at(-1)));
    }
  });
});
