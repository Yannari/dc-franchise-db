import { it, expect } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { knowsVote } from '../js/bb/knowledge.js';
import { factId, believes, isAccurate } from '../js/knowledge.js';
import { seedGame } from './helpers/setup.js';
const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks','Emmah','Millie','Caleb','Wayne','Raj'];
it('knowledge audit', () => {
  const t = { weeks: 0, coverageByAge: {}, falseBeliefs: 0, totalBeliefs: 0, lieFacts: 0,
    spreadEvents: [], voterKnownByAnyone: 0, ballotsTracked: 0, fullHouseKnows: 0 };
  for (let i = 0; i < 6; i++) {
    const CAST = NAMES.map((n, j) => ({ name: n, gender: j % 2 ? 'm' : 'f', sexuality: 'straight',
      archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][(j + i) % 7] }));
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal,
      getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [],
      bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
    const ballotLog = [];   // {voter, evict, week}
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 12) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      t.weeks++;
      t.spreadEvents.push((ep.knowledgeEvents || gs.bb?.weeks?.[gs.bb.weeks.length-1]?.knowledgeEvents || []).length || 0);
      const act = (ep.acts || []).find(a => a.type === 'eviction');
      for (const b of act?.ballots || []) ballotLog.push({ voter: b.voter, evict: b.evict, week: ep.num, evicted: ep.eliminated });
      // coverage: for each logged ballot, how many living non-voters know it, by fact age
      for (const rec of ballotLog) {
        if (!gs.activePlayers.includes(rec.voter)) continue;
        const age = ep.num - rec.week;
        if (age > 4) continue;
        const others = gs.activePlayers.filter(n => n !== rec.voter);
        const knowers = others.filter(n => knowsVote(n, rec.voter, rec.evicted)).length;
        const key = age;
        (t.coverageByAge[key] ||= { know: 0, possible: 0 });
        t.coverageByAge[key].know += knowers;
        t.coverageByAge[key].possible += others.length;
        if (age === 2) {
          t.ballotsTracked++;
          if (knowers > 0) t.voterKnownByAnyone++;
          if (knowers >= others.length * 0.8) t.fullHouseKnows++;
        }
      }
    }
    // false beliefs + lie facts at season end
    const facts = gs.knowledge?.facts || gs.knowledge || {};
    const factList = Object.values(facts.facts || facts).filter(f => f && f.beliefs);
    for (const f of factList) {
      if (f.type === 'lie') t.lieFacts++;
      for (const [who, belief] of Object.entries(f.beliefs)) {
        t.totalBeliefs++;
        if (belief.valence === 'false' || (f.truth === false && belief.valence !== 'skeptical')) t.falseBeliefs++;
      }
    }
  }
  for (const k of Object.keys(t.coverageByAge)) {
    const c = t.coverageByAge[k];
    t.coverageByAge[k] = +(c.know / Math.max(1, c.possible)).toFixed(3);
  }
  t.avgSpread = +(t.spreadEvents.reduce((a, b) => a + b, 0) / Math.max(1, t.spreadEvents.length)).toFixed(1);
  t.spreadEvents = undefined;
  console.log(JSON.stringify(t));
  expect(true).toBe(true);
});
