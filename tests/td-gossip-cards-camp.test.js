// @vitest-environment jsdom
// The vote's gossip (knowledgeEvents) becomes 'informationFlow' camp cards. They used to be
// filed under the tribe going to Tribal, in its PRE-challenge feed — so on seed 4242 ep 3,
// Gwen and Harold (Gophers) talked in the Bass camp before a challenge they had not lost yet.
// A card belongs to the camp both people live in, after the challenge.
import { it, expect } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

const NAMES = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra',
  'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];

it('files every gossip card in the camp both people live in, after the challenge', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const cast = NAMES.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
  let cards = 0;
  const wrong = [];
  for (const seed of [4242, 777]) {
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16, cast.map(p => ({ ...p }))), seed);
    for (const ep of core.gs.episodeHistory) {
      const tribes = Object.fromEntries((ep.tribesAtStart || []).map(t => [t.name, t.members]));
      for (const [camp, feed] of Object.entries(ep.campEvents || {})) {
        if (Array.isArray(feed)) continue;
        for (const phase of ['pre', 'post']) {
          for (const e of feed?.[phase] || []) {
            if (e.type !== 'informationFlow') continue;
            cards++;
            if (phase === 'pre') wrong.push(`s${seed} ep${ep.num} ${camp}: card in the pre-challenge feed`);
            const members = tribes[camp];
            if (members && e.players.some(p => !members.includes(p))) {
              wrong.push(`s${seed} ep${ep.num} ${camp}: ${e.players.join('+')} not both in ${camp}`);
            }
          }
        }
      }
    }
  }
  expect(cards).toBeGreaterThan(10);
  expect(wrong).toEqual([]);
}, 300000);
