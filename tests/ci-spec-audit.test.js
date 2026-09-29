// ══════════════════════════════════════════════════════════════════════
// ci-spec-audit.test.js — a hundred seasons, every rate beside the real show
// ══════════════════════════════════════════════════════════════════════
//
// Run it and READ it: npm run audit:ci-spec. Targets are spec §2.2 and §21.1.
// Measurements are taken INSIDE the loop (after it, only the last season is
// left — ADDING-A-SHOW §11.5 T).
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

const SEASONS = 100;
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const mean = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 'n/a');

describe('The Circle spec audit', () => {
  it('measures a hundred seasons', () => {
    const m = { finished: 0, days: [], blocks: [], catfish: 0, profiles: 0, catfishWin: 0, catfishTotal: 0,
      catfishExposed: 0, finalCatfish: 0, finalSuspected: 0, influencer3: 0, wrongFake: [], inferred: [], inferredRight: 0, inferredAll: 0,
      visitsCatfish: 0, visits: 0, newcomerFinal: 0, scenesPerDay: [], chatsPerDay: [], intents: {},
      probes: {}, slips: [], slipsNoticed: 0, slipsAll: 0, ffIsWinner: 0, pacts: [], pactKept: 0, pactChecks: 0,
      reports: [], unused: [], editedShare: [] };
    for (let s = 1; s <= SEASONS; s++) {
      const cast = makePlayers(13, s);
      setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows, state, result } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }),
        pool: makePool(6, s), seed: s });
      if (state.active.length === state.options.finalists) m.finished++;
      m.days.push(rows.length);
      m.blocks.push(state.blocked.length);
      const profs = Object.values(state.profiles);
      m.profiles += profs.length;
      m.catfish += profs.filter(p => p.mode === 'catfish').length;
      m.editedShare.push(profs.filter(p => p.mode === 'edited').length / profs.length);
      m.unused.push(state.unused.length);
      if (state.profiles[result.winner.profile].mode === 'catfish') m.catfishWin++;
      // Exposed = the room learned the truth before the final: blocked (the
      // goodbye video) or confessed. Measured this way because after the
      // finale meet every finalist has been revealed to every other.
      const finalRow = state.ratings.find(r => r.final);
      for (const p of profs.filter(x => x.mode === 'catfish')) {
        m.catfishTotal++;
        const blocked = state.blocked.some(b => b.handle === p.handle);
        const confessed = state.scenes.some(x => x.kind === 'chat' && x.data.confessed && x.who[0] === p.handle);
        if (blocked || confessed) m.catfishExposed++;
        if (!blocked && finalRow) {
          m.finalCatfish++;
          const why = finalRow.ballots.map(b => b.reasons[b.order.indexOf(p.handle)]).filter(Boolean);
          if (why.filter(w => w === 'suspicion').length * 2 >= why.length) m.finalSuspected++;
        }
      }
      if (Object.values(state.influencerCount).some(n => n >= 3)) m.influencer3++;
      m.wrongFake.push(state.scenes.filter(x => x.kind === 'blocking' && x.data.reason === 'fake'
        && state.profiles[x.data.target].mode !== 'catfish').length);
      const inf = state.ratings.flatMap(r => r.inferred || []);
      m.inferred.push(inf.length);
      m.inferredAll += inf.length;
      m.inferredRight += inf.filter(x => x.right).length;
      for (const v of state.scenes.filter(x => x.kind === 'visit')) {
        m.visits++;
        if (v.who.some(h => state.profiles[h].mode === 'catfish')) m.visitsCatfish++;
      }
      if (state.active.some(h => state.joinedDay[h] > 1)) m.newcomerFinal++;
      for (let d = 1; d <= rows.length; d++) {
        const day = state.scenes.filter(x => x.day === d);
        m.scenesPerDay.push(day.length);
        m.chatsPerDay.push(day.filter(x => x.kind === 'chat').length);
      }
      for (const c of state.scenes.filter(x => x.kind === 'chat')) {
        m.intents[c.data.intent] = (m.intents[c.data.intent] || 0) + 1;
        for (const p of c.data.probes || []) m.probes[p.result] = (m.probes[p.result] || 0) + 1;
      }
      const slips = state.scenes.flatMap(x => x.data.slips || []);
      m.slips.push(slips.length);
      m.slipsAll += slips.length;
      m.slipsNoticed += slips.filter(x => x.noticedBy.length).length;
      if (result.fanFavorite === result.winner.people[0]) m.ffIsWinner++;
      m.pacts.push(state.pacts.length);
      for (const p of state.pacts) for (const k of p.kept) { m.pactChecks++; if (k.kept) m.pactKept++; }
      m.reports.push(state.scenes.filter(x => x.kind === 'report').length);
    }
    const lines = [
      ['seasons finished with the finalists', `${m.finished}/${SEASONS}`, 'all'],
      ['days / blockings (mean)', `${mean(m.days)} / ${mean(m.blocks)}`, '11-15 / 6-8'],
      ['catfish share of profiles', pct(m.catfish, m.profiles), '~33%'],
      ['edited share of profiles', mean(m.editedShare), 'some'],
      ['personas left unused (mean, pool of 6)', mean(m.unused), 'some'],
      ['catfish winners', pct(m.catfishWin, SEASONS), '~50% (5 of 10 real)'],
      ['catfish exposed before the final (blocked or confessed)', pct(m.catfishExposed, m.catfishTotal), 'most, not all'],
      ['finalist catfish ranked mostly on suspicion', pct(m.finalSuspected, m.finalCatfish), 'some (US 1 "Rebecca")'],
      ['seasons with an influencer 3+ times', pct(m.influencer3, SEASONS), 'common (US 1 Shubham: 4)'],
      ['honest players blocked as "fake" (per season)', mean(m.wrongFake), '> 0 (US 1 Alana)'],
      ['pact betrayals inferred (per season)', mean(m.inferred), 'several'],
      ['…of which right', pct(m.inferredRight, m.inferredAll), 'not all'],
      ['rating pacts kept', pct(m.pactKept, m.pactChecks), 'most'],
      ['visits involving a catfish', pct(m.visitsCatfish, m.visits), 'a meaningful share'],
      ['seasons with a newcomer in the final', pct(m.newcomerFinal, SEASONS), 'common (US 4 "Imani")'],
      ['scenes per day / chats per day', `${mean(m.scenesPerDay)} / ${mean(m.chatsPerDay)}`, 'dense'],
      ['slips per season (noticed)', `${mean(m.slips)} (${pct(m.slipsNoticed, m.slipsAll)})`, 'a few, some noticed'],
      ['visit lies per season', mean(m.reports), 'rare'],
      ['Fan Favorite is the winner', pct(m.ffIsWinner, SEASONS), 'sometimes (US 1: no)'],
    ];
    console.log('\nTHE CIRCLE — spec audit, ' + SEASONS + ' seasons\n');
    for (const [k, v, t] of lines) console.log(`  ${k.padEnd(48)} ${String(v).padStart(16)}   target: ${t}`);
    console.log('\n  intents:', JSON.stringify(m.intents));
    console.log('  probes: ', JSON.stringify(m.probes), '\n');
    expect(m.finished).toBe(SEASONS);
  });
});
