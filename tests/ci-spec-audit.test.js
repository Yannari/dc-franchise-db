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
import { POOLS } from '../js/ci/lines/index.js';
import { GAMES } from '../js/ci/games-data.js';

const SEASONS = 100;
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const mean = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 'n/a');

describe('The Circle spec audit', () => {
  it('measures a hundred seasons', () => {
    const m = { finished: 0, days: [], blocks: [], catfish: 0, profiles: 0, catfishWin: 0, catfishTotal: 0,
      catfishExposed: 0, finalCatfish: 0, finalSuspected: 0, influencer3: 0, wrongFake: [], inferred: [], inferredRight: 0, inferredAll: 0,
      visitsCatfish: 0, visits: 0, newcomerFinal: 0, scenesPerDay: [], chatsPerDay: [], intents: {},
      probes: {}, slips: [], misreads: [], slipsNoticed: 0, slipsAll: 0, ffIsWinner: 0, pacts: [], pactKept: 0, pactChecks: 0,
      reports: [], unused: [], editedShare: [],
      pools: {}, pairRepeats: 0, missing: {}, airedPerDay: [], blocksPerScene: [], lines: 0,
      games: [], families: {}, purposes: {}, prizes: {}, immuneSaved: 0, gameSlips: 0, chatSlips: 0, partySlips: 0, parties: [], homeVideos: [] };
    for (let s = 1; s <= SEASONS; s++) {
      const cast = makePlayers(13, s);
      setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows, state, result } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }),
        pool: makePool(6, s), seed: s });
      if (state.active.length === state.options.finalists) m.finished++;
      // Games, parties, home videos (Plan 3a).
      const games = state.scenes.filter(x => x.kind === 'game');
      m.games.push(games.length);
      for (const g of games) {
        m.families[g.data.family] = (m.families[g.data.family] || 0) + 1;
        const pur = GAMES.find(x => x.id === g.data.gameId)?.purpose;
        m.purposes[pur] = (m.purposes[pur] || 0) + 1;
        if (g.data.prize) m.prizes[g.data.prize.kind] = (m.prizes[g.data.prize.kind] || 0) + 1;
        m.gameSlips += (g.data.slips || []).filter(x => !x.misread).length;
      }
      m.chatSlips += state.scenes.filter(x => x.kind === 'chat').reduce((a, x) => a + (x.data.slips || []).filter(y => !y.misread).length, 0);
      m.partySlips += state.scenes.filter(x => x.kind === 'party').reduce((a, x) => a + (x.data.slips || []).filter(y => !y.misread).length, 0);
      m.parties.push(state.scenes.filter(x => x.kind === 'party').length);
      m.homeVideos.push(state.scenes.filter(x => x.kind === 'home-video').length);
      for (const g of games.filter(x => x.data.prize?.kind === 'immunity')) {
        const hang = state.scenes.find(x => x.kind === 'hangout' && x.day >= g.day);
        if (hang) m.immuneSaved += g.data.prize.to.filter(h => !hang.data.atRisk.includes(h) && !hang.who.includes(h)).length;
      }
      // The writing (Plan 2 Task 11): how often each pool plays, how many of
      // its entries a season uses, and the worst repeat of one entry.
      const u = state.usedLines || { uses: {}, pairs: {} };
      for (const [k, list] of Object.entries(POOLS)) {
        const uses = list.map(e => u.uses[e.id] || 0);
        const plays = uses.reduce((a, b) => a + b, 0);
        if (!plays) continue;
        const w = (m.pools[k] ||= { plays: 0, distinct: 0, worst: 0, seasons: 0, size: list.length });
        w.plays += plays; w.distinct += uses.filter(Boolean).length; w.worst = Math.max(w.worst, ...uses); w.seasons++;
      }
      for (const ps of Object.values(u.pairs)) m.pairRepeats += ps.length - new Set(ps).size;
      for (const [k, n] of Object.entries(state.missingPools || {})) m.missing[k] = (m.missing[k] || 0) + n;
      const airedAll = state.scenes.filter(x => x.aired);
      m.airedPerDay.push(airedAll.length / rows.length);
      m.blocksPerScene.push(airedAll.reduce((a, x) => a + (x.script?.blocks?.length || 0), 0) / Math.max(1, airedAll.length));
      m.lines += airedAll.reduce((a, x) => a + (x.script?.blocks || []).reduce((b, bl) => b + bl.lines.length, 0), 0);
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
      m.misreads.push(slips.filter(x => x.misread).length);
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
      ['…of which misreads (an honest answer read as a tell)', mean(m.misreads), 'a handful'],
      ['visit lies per season', mean(m.reports), 'rare'],
      ['Fan Favorite is the winner', pct(m.ffIsWinner, SEASONS), 'sometimes (US 1: no)'],
    ];
    console.log('\nTHE CIRCLE — spec audit, ' + SEASONS + ' seasons\n');
    for (const [k, v, t] of lines) console.log(`  ${k.padEnd(48)} ${String(v).padStart(16)}   target: ${t}`);
    console.log('\n  intents:', JSON.stringify(m.intents));
    console.log('  probes: ', JSON.stringify(m.probes), '\n');
    const r1 = x => Math.round(x * 10) / 10;
    const tot = o => Object.values(o).reduce((a, b) => a + b, 0);
    const share = o => JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, pct(v, tot(o))])));
    console.log('  GAMES');
    console.log(`  games per season ${mean(m.games)} (target 7-10) · parties ${mean(m.parties)} · home videos ${mean(m.homeVideos)}`);
    console.log('  families:', JSON.stringify(m.families));
    console.log('  purposes:', share(m.purposes), '(no purpose over 40%)');
    console.log('  prizes:', JSON.stringify(m.prizes), `· immunity that kept someone off the block: ${m.immuneSaved}`);
    console.log(`  slips — in chats ${m.chatSlips}, in games ${m.gameSlips}, at parties ${m.partySlips} (100 seasons)`);
    console.log('');
    console.log('  WRITING');
    console.log(`  aired scenes per day ${r1(mean(m.airedPerDay))} · blocks per aired scene ${r1(mean(m.blocksPerScene))} · lines per season ${Math.round(m.lines / SEASONS)}`);
    console.log(`  same entry, same pair, again (pool exhausted for that pair): ${m.pairRepeats} over ${SEASONS} seasons`);
    console.log('  missing pools:', JSON.stringify(m.missing));
    const worst = Object.entries(m.pools).map(([k, w]) => ({ k, size: w.size, plays: r1(w.plays / w.seasons),
      distinct: r1(w.distinct / w.seasons), worst: w.worst, load: w.plays / w.seasons / w.size }))
      .sort((a, b) => b.load - a.load).slice(0, 20);
    console.log('  twenty hardest-worked pools (plays per season / entries):');
    for (const w of worst) console.log(`    ${w.k.padEnd(28)} ${String(w.size).padStart(3)} entries · ${String(w.plays).padStart(5)} plays · ${String(w.distinct).padStart(4)} distinct · worst repeat ${w.worst}`);
    console.log('');
    expect(m.finished).toBe(SEASONS);
    // Catfish won 5 of 10 real seasons (spec 2.2); 22% before the Plan 3b
    // calibration. A band, not a point: 100 seasons carry about 5 points of noise.
    expect(m.catfishWin / SEASONS).toBeGreaterThan(0.35);
    expect(m.catfishWin / SEASONS).toBeLessThan(0.65);
  });
});
