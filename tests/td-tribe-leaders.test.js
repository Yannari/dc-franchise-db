// @vitest-environment jsdom
// First Impressions: Tribe Leaders (twists.js executeTribeLeaders), played on the TD16 cast: every tribe
// gets a leader and a named weakest, the named choose a clue or the rice, and the day reaches all three
// screens (the classic page, the text backlog, the stepped viewer) with every one of its scenes spoken.
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { rpBuildTribeLeaders, _tvState } from '../js/vp-screens.js';
import { _textTribeLeaders, _textTwistStory } from '../js/text-backlog.js';
import { tdMiscTwistScreen } from '../js/vp-td-ep/twist-screens.js';

const TRIBES = { Brains: ['hailee', 'malo', 'mina', 'paolo', 'simone'], Beauty: ['beau', 'daniela', 'kendra', 'luca', 'quentin'], Brawns: ['nadia', 'rama', 'santi', 'tino', 'topaz'] };
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const seasons = [];

beforeAll(() => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const cast = Object.entries(TRIBES).flatMap(([tribe, slugs]) => slugs.map(s => ({ ...roster.find(r => r.slug === s), tribe })));
  for (const seed of [1, 3, 5]) {
    seededRun(() => runOneSeason({ teams: 3, tribes: Object.keys(TRIBES).map(name => ({ name })), mergeAt: 9,
      twistSchedule: [{ id: 'tl1', episode: 1, type: 'tribe-leaders' }] }, 15, cast), seed);
    const ep = core.gs.episodeHistory.find(h => h.num === 1);
    seasons.push({ seed, ep, tw: (ep.twists || []).find(t => t.type === 'tribe-leaders'), players: [...core.players] });
  }
  // a season with idols switched off: the rice is simply waiting, and nothing may mention a clue
  seededRun(() => runOneSeason({ teams: 3, tribes: Object.keys(TRIBES).map(name => ({ name })), mergeAt: 9,
    advantages: { ...core.seasonConfig.advantages, idol: { enabled: false } },
    twistSchedule: [{ id: 'tl1', episode: 1, type: 'tribe-leaders' }] }, 15, cast), 7);
  const ep = core.gs.episodeHistory.find(h => h.num === 1);
  seasons.push({ seed: 7, noIdols: true, ep, tw: (ep.twists || []).find(t => t.type === 'tribe-leaders'), players: [...core.players] });
}, 600000);

describe('Tribe Leaders', () => {
  it('gives every tribe a leader and a weakest, who is somebody else on the same tribe', () => {
    for (const { tw } of seasons) {
      expect(tw.tribeLeaders.map(r => r.tribe).sort()).toEqual(Object.keys(TRIBES).sort());
      for (const r of tw.tribeLeaders) {
        expect(r.members).toContain(r.leader);
        expect(r.members).toContain(r.picked);
        expect(r.picked).not.toBe(r.leader);
        expect(r.log.length).toBe(r.members.length);
        expect(['clue', 'rice']).toContain(r.choice);
      }
    }
  });

  it('never has a nice archetype lie about the clue', () => {
    for (const { tw, players } of seasons) for (const r of tw.tribeLeaders.filter(x => x.told === 'lie'))
      expect(NICE).not.toContain(players.find(p => p.name === r.picked)?.archetype);
  });

  it('airs on the classic page and in the text backlog, the leader, the weakest and the choice', () => {
    for (const { ep, tw } of seasons) {
      _tvState[`${ep.num}_tl`] = { idx: 999 };
      const html = rpBuildTribeLeaders(ep, tw);
      const text = []; _textTribeLeaders(ep, l => text.push(l), s => text.push(s));
      for (const r of tw.tribeLeaders) for (const page of [html, text.join('\n')]) {
        expect(page).toContain(`${r.leader}`);
        expect(page).toContain(r.choice === 'rice' ? 'extra bag of rice' : 'idol clue');
      }
      expect(text.join('\n')).toMatch(/names \w+ the weakest of/);
    }
  });

  it('speaks every scene of the day (no moment airs empty)', () => {
    for (const { ep } of seasons) {
      const T = ep.tdTribeLeaders;
      expect(T?.chopper?.length, 'the helicopter').toBeGreaterThan(0);
      for (const r of T.tribes) for (const part of ['huddle', 'lead', 'weak', 'namedConf', 'choose', 'tell', 'after'])
        expect(r[part]?.length, `seed ${ep.num} ${r.tribe} ${part}`).toBeGreaterThan(0);
      const told = []; _textTwistStory(ep, l => told.push(l), s => told.push(s));
      expect(told.join('\n')).toContain('TRIBE LEADERS — THE HELICOPTER');
      expect(JSON.stringify(T)).not.toMatch(/\{[a-z]+(\.[a-zA-Z]+)?\}/);
    }
  });

  it('with idols off, offers only the rice and never mentions a clue', () => {
    const { ep, tw } = seasons.find(x => x.noIdols);
    for (const r of tw.tribeLeaders) { expect(r.riceOnly).toBe(true); expect(r.choice).toBe('rice'); }
    _tvState[`${ep.num}_tl`] = { idx: 999 };
    const text = []; _textTribeLeaders(ep, l => text.push(l), s => text.push(s));
    const spoken = ep.tdTribeLeaders.tribes.flatMap(r => [...r.choose, ...r.tell]).map(l => l.text).join(' ');
    for (const page of [rpBuildTribeLeaders(ep, tw), text.join('\n'), spoken]) expect(page).not.toMatch(/\bclue\b/i);
  });

  it('plays as stepped screens: the rules, one per tribe, the helicopter, one per camp', () => {
    for (const { ep, tw } of seasons) {
      const sc = tdMiscTwistScreen(ep, 'tribe-leaders', {});
      expect(sc.parts.length).toBe(2 + tw.tribeLeaders.length * 2);
      expect(sc.steps.some(s => s.act?.kind === 'ride' && s.act.ride === 'helicopter')).toBe(true);
      for (const r of tw.tribeLeaders) expect(sc.steps.some(s => s.act?.kind === 'arrive' && s.act.who?.[0] === r.picked && s.act.ride === 'helicopter')).toBe(true);
    }
  });
});
