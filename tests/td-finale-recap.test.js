// @vitest-environment jsdom
// The finale's cold open (td/story/finale-recap.js): the whole season and each finalist's road, played by the stepped
// "previously on" screen. The user, 2026-10-19: "the total drama finale in stepped viewer is kinda underwhelming".
import { describe, expect, it } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdPreviouslyScreen } from '../js/vp-td-ep/twist-screens.js';
import { tdFinalImmunityScreen, tdFinaleWalkScreen, tdWinnerScreen, tdFinalTribalScreen } from '../js/vp-td-ep/finale.js';

describe('the finale recap', () => {
  it('recaps the season, then each finalist in turn, and plays as the road to the finale', () => {
    seededRun(() => {
      runOneSeason({}, 16);
      const fin = core.gs.episodeHistory.find(h => h.isFinale);
      expect(fin, 'no finale').toBeTruthy();
      const lines = fin.tdPreviously || [];
      expect(lines.length).toBeGreaterThan(8);
      const text = lines.map(l => l.text).join('\n');
      expect(text).toMatch(/finale of/);
      expect(text).toMatch(/sixteen/);
      // every finalist gets a beat of their own, in the order they are introduced
      const order = (fin.finaleEntrants || fin.finaleFinalists).map(f => text.indexOf(f));
      order.forEach(i => expect(i).toBeGreaterThan(-1));
      // a clip is the player's own line, and a host line never names a vote count of zero as a close call
      lines.filter(l => l.clip).forEach(l => expect(l.by).not.toBe('Chris'));
      expect(text).not.toMatch(/nearly ended it: (one|two) votes/);
      const scr = tdPreviouslyScreen(fin, { host: 'Chris', history: core.gs.episodeHistory });
      expect(scr.label).toBe('The Road to the Finale');
      // ...and the text backlog carries the finale's new screens, as they air
      for (const sec of ['THE ROAD TO THE FINALE', 'THE WALK', 'FINAL IMMUNITY — AS IT AIRS']) expect(fin.summaryText).toContain(sec);
      expect(scr.steps.some(s => s.k === 'title' && s.name === 'The Road to the Finale')).toBe(true);
    });
  }, 180000);

  // the last immunity of the season on the stage (vp-td-ep/finale.js), not a results table
  it('plays final immunity: the rules, every drop with the dropper\'s own words, the winner, and no line twice', () => {
    seededRun(() => {
      runOneSeason({}, 16);
      const fin = core.gs.episodeHistory.find(h => h.isFinale);
      const scr = tdFinalImmunityScreen(fin, { host: 'Chris' });
      expect(scr?.id).toBe('finale-challenge');
      const said = scr.steps.filter(s => s.text).map(s => s.text);
      expect(said.join('\n')).toMatch(/last one standing wins|first one to finish wins/);
      const stages = fin.immunityNarrationStages;
      for (const d of stages.filter(x => x.type === 'drop').map(x => x.dropper)) {
        expect(said).toContain(`${d} is out!`);
        expect(scr.steps.some(s => s.k === 'say' && s.by === d)).toBe(true);
      }
      expect(said).toContain(`${fin.immunityWinner} wins final immunity!`);
      expect(new Set(said).size).toBe(said.length);
    });
  }, 180000);

  // the winner: the whole cast on the set, and the season counted with everybody it sent home in order
  it('puts the whole cast on the winner\'s set and counts the season with the boot order', () => {
    seededRun(() => {
      runOneSeason({}, 16);
      const fin = core.gs.episodeHistory.find(h => h.isFinale);
      const scr = tdWinnerScreen(fin, { host: 'Chris', history: core.gs.episodeHistory });
      const crowd = scr.steps.filter(s => s.k === 'scene').map(s => Object.keys(s.places || {}).length);
      expect(Math.max(...crowd)).toBeGreaterThanOrEqual(Math.min(20, 16));
      const order = scr.steps.find(s => s.k === 'title' && s.kicker === 'Voted out, in order');
      expect(order.faces.length).toBe(16 - (fin.finaleFinalists || []).length);
    });
  }, 180000);

  // the coaches voted out before the merge watch the finale from the stands with the jury (the user, 2026-10-19)
  it('seats the coaches voted out with the jury at Final Tribal, without a vote', () => {
    const ep = { num: 9, isFinale: true, finaleFinalists: ['Ann', 'Bea'], winner: 'Ann',
      juryResult: { votes: { Ann: 2, Bea: 1 }, reasoning: [{ juror: 'Cal', votedFor: 'Ann', reason: 'x' }, { juror: 'Dee', votedFor: 'Ann', reason: 'y' }, { juror: 'Eli', votedFor: 'Bea', reason: 'z' }] },
      ftcData: { finalistStatements: { Ann: ['I played.'], Bea: ['So did I.'] }, jurorQA: [] },
      finaleCoaches: [{ name: 'Coach Zed', tribe: 'Red', trained: ['Ann'], firedEp: 3 }], gsSnapshot: { bonds: {}, jury: ['Cal', 'Dee', 'Eli'] } };
    const scr = tdFinalTribalScreen(ep, { host: 'Chris', setting: 'hosted-camp' });
    const stands = scr.steps.filter(s => s.k === 'scene' && s.spot === 'jury-bleachers');
    expect(stands.some(s => 'Coach Zed' in s.places)).toBe(true);
    expect(scr.steps.some(s => s.k === 'beat' && /coach who never made the merge: Coach Zed/.test(s.text))).toBe(true);
    // the coach of a finalist gets a word before the vote; the coach never votes
    expect(scr.steps.some(s => s.k === 'say' && s.by === 'Coach Zed')).toBe(true);
    expect(scr.steps.filter(s => s.k === 'read').length).toBe(3);
  });

  // the walk past everyone the season sent home: a card for each, in the order they went, and a finalist's words
  it('walks past every boot in order, each with a finalist speaking, and no line twice', () => {
    seededRun(() => {
      runOneSeason({}, 16);
      const fin = core.gs.episodeHistory.find(h => h.isFinale);
      const scr = tdFinaleWalkScreen(fin, { host: 'Chris', history: core.gs.episodeHistory });
      expect(scr?.id).toBe('finale-walk');
      const cards = scr.steps.filter(s => s.k === 'title' && s.tone === 'out').map(s => s.name);
      const boots = core.gs.episodeHistory.filter(h => h.num < fin.num).flatMap(h => [h.firstEliminated, h.eliminated]).filter(Boolean);
      expect(cards).toEqual([...new Set(boots)].filter(n => !(fin.finaleEntrants || []).includes(n)));
      // after every card, a finalist speaks
      const entrants = fin.finaleEntrants || fin.finaleFinalists;
      scr.steps.forEach((s, i) => { if (s.k === 'title' && s.tone === 'out') expect(entrants).toContain(scr.steps[i + 1].by); });
      const said = scr.steps.filter(s => s.k === 'say').map(s => s.text);
      expect(new Set(said).size).toBe(said.length);
    });
  }, 180000);
});
