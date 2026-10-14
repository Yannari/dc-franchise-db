// ══════════════════════════════════════════════════════════════════════
// ch-spec-audit.test.js — a hundred seasons of The Challenge, every rate printed
// ══════════════════════════════════════════════════════════════════════
//
// Run it and READ it: npm run audit:ch-spec. Spec §9. Measurements are taken
// INSIDE the loop (manual §11.5 T: after it, only the last season is left).
// An outcome rate is a read-out, not a target (§17.5): fix a broken
// mechanism, never tune a constant toward a number.
import { describe, expect, it } from 'vitest';
import { setPlayers, players } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';
import { EVENTS } from '../js/ch/events.js';

const SEASONS = Number(process.env.CH_SEASONS) || 100;
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const mean = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 'n/a');
const inc = (o, k, d = 1) => { o[k] = (o[k] || 0) + d; };

describe('The Challenge spec audit', () => {
  it('plays a hundred seasons and prints every rate', () => {
    const m = { kinds: {}, castArch: {}, evFires: {}, evPairMax: 0, evPairRepeats: 0, evPairs: 0, unseen: [], minShare: [], chanceDailyShare: [], eps: [], finalists: [], balanced: 0, topDailyShare: [], maxVotedIn: [], arenas: 0, votedInWins: 0,
      upsets: 0, comebacks: 0, reasons: {}, quits: [], medicals: [], dqs: [], overnightQuits: [], instant: 0,
      fights: [], physical: [], showmances: [], breakups: [], volunteers: [], volunteerWins: 0, volunteerAll: 0,
      throws: [], caught: [], flips: [], ballots: 0, falseYes: [], outings: [], pleas: 0, pleasMoved: 0,
      threats: [], alliances: [], allianceEnd: {}, sameOrigin: [0, 0], lateSameOrigin: [0, 0], rookieFinal: 0, rookieAll: 0, castAll: 0, finalAll: 0,
      champArch: {}, champRank: [], beasts: [], disagree: 0, multiMeet: 0, noElim: [], mornings: 0, blamedCaller: 0, blamed: 0,
      votesLandslide: 0, votesClose: 0, votes: 0, tiebreaks: 0, scenes: [] };
    for (let s = 1; s <= SEASONS; s++) {
      const { cast, names, background } = challengeCast(24, s);
      setPlayers(cast);
      const r = playChallengeSeason({ cast: names, background, seed: s });
      const st = r.state;
      m.eps.push(r.episodes.length);
      m.finalists.push(r.final.finalists.length);
      const fm = r.final.finalists.filter(n => st.division[n] === 'm').length;
      if (Math.abs(fm - (r.final.finalists.length - fm)) <= 1) m.balanced++;
      // Dailies: the most solo daily wins by one player, as a share of solo dailies.
      const solo = r.episodes.filter(e => e.daily.mode === 'solo');
      const wins = {};
      for (const e of solo) for (const w of e.daily.winners) inc(wins, w);
      if (solo.length) m.topDailyShare.push(Math.max(...Object.values(wins)) / solo.length);
      // The chance line: the same dailies won by a random player of each division.
      if (solo.length) {
        const rw = {};
        let x = s * 2654435761 >>> 0;
        const rnd = () => ((x = (Math.imul(x ^ (x >>> 15), 2246822519) + 12345) >>> 0) / 4294967296);
        for (const e of solo) for (const d of ['m', 'f']) {
          const pool = names.filter(n => st.division[n] === d);
          inc(rw, pool[Math.floor(rnd() * pool.length)]);
        }
        m.chanceDailyShare.push(Math.max(...Object.values(rw)) / solo.length);
      }
      const votedIn = {};
      for (const e of r.episodes) {
        for (const v of e.votedIn) inc(votedIn, v);
        for (const a of e.arena) {
          m.arenas++;
          const co = e.callouts.find(c => (c.by === a.a && c.opponent === a.b) || (c.by === a.b && c.opponent === a.a));
          if (co && a.winner === co.by) m.votedInWins++;
          if (a.upset) m.upsets++;
          if (a.comeback) m.comebacks++;
          if (a.volunteer) { m.volunteerAll++; if (a.winner === a.a) m.volunteerWins++; }
        }
        for (const c of e.callouts) inc(m.reasons, c.reason);
        for (const v of e.votes) {
          m.votes++;
          const counts = Object.values(v.tally).sort((a, b) => b - a);
          if (counts[0] >= 0.75 * v.ballots.length) m.votesLandslide++;
          if (counts.length > 1 && counts[0] - counts[1] <= 2) m.votesClose++;
          if (v.tiebreak) m.tiebreaks++;
          m.ballots += v.ballots.length;
        }
        if (e.delib) {
          const tg = new Set(Object.values(e.delib.targets));
          if (Object.keys(e.delib.targets).length >= 2) { m.multiMeet++; if (tg.size >= 2) m.disagree++; }
          for (const c of e.delib.campaigns || []) if (c.kind === 'plea') { m.pleas++; if (c.moved) m.pleasMoved++; }
        }
        if (e.elims === 0) m.noElim.push(e.ep);
        for (const f of e.fallout || []) { if (f.hurt.length) m.mornings++; m.blamed += f.blamed.length; }
      }
      m.maxVotedIn.push(Math.max(0, ...Object.values(votedIn)));
      const gone = how => st.gone.filter(g => g.how === how).length;
      m.quits.push(gone('quit')); m.medicals.push(gone('medical')); m.dqs.push(gone('disqualified'));
      m.overnightQuits.push(gone('final-quit')); m.instant += gone('final-instant');
      const sc = k => st.scenes.filter(x => x.kind === k).length;
      m.fights.push(sc('fight') + sc('fight-physical')); m.physical.push(sc('fight-physical'));
      m.showmances.push(sc('showmance')); m.breakups.push(sc('breakup'));
      m.volunteers.push(sc('volunteer')); m.throws.push(sc('throw') + sc('throw-caught')); m.caught.push(sc('throw-caught'));
      m.falseYes.push(st.scenes.filter(x => x.kind === 'meeting').reduce((a, x) => a + Object.values(x.data.responses).filter(v => v === 'false-yes').length, 0));
      m.outings.push(sc('outing')); m.threats.push(sc('leverage-threat'));
      m.flips.push(r.episodes.flatMap(e => e.votes).flatMap(v => v.ballots).filter(b => b.flip).length);
      m.scenes.push(st.scenes.length);
      for (const x of st.scenes) inc(m.kinds, x.kind);
      // House events: fires per kind, the same event between the same people,
      // and who never gets a beat of their own.
      const evIds = new Set(EVENTS.map(e => e.id));
      const pairCount = {};
      const appear = Object.fromEntries(names.map(n => [n, 0]));
      for (const x of st.scenes) {
        if (!evIds.has(x.kind)) continue;
        inc(m.evFires, x.kind);
        const k = x.kind + '|' + [...x.who].slice(0, 2).sort().join('|');
        pairCount[k] = (pairCount[k] || 0) + 1;
        for (const w of x.who) if (w in appear) appear[w]++;
      }
      for (const n of Object.values(pairCount)) { m.evPairs++; if (n > 1) m.evPairRepeats++; m.evPairMax = Math.max(m.evPairMax, n); }
      m.unseen.push(Object.values(appear).filter(v => v === 0).length);
      m.alliances.push(st.alliances.length);
      for (const a of st.alliances) {
        inc(m.allianceEnd, a.ended ? (a.why || 'ended') : 'lasted');
        const early = a.formedEp <= 2 ? 'sameOrigin' : 'lateSameOrigin';
        m[early][1]++; if (a.origin) m[early][0]++;
      }
      for (const n of names) inc(m.castArch, players.find(p => p.name === n)?.archetype || '?');
      m.castAll += names.length; m.finalAll += r.final.finalists.length;
      m.rookieAll += names.filter(n => st.rookie[n]).length;
      m.rookieFinal += r.final.finalists.filter(n => st.rookie[n]).length;
      for (const c of r.champions) {
        inc(m.champArch, players.find(p => p.name === c)?.archetype || '?');
        // Where the champion's raw stat total ranked in their division at the start.
        const div = names.filter(n => st.division[n] === st.division[c]);
        const tot = n => Object.values(players.find(p => p.name === n)?.stats || {}).reduce((a, b) => a + b, 0);
        m.champRank.push(div.sort((a, b) => tot(b) - tot(a)).indexOf(c) + 1);
      }
      m.beasts.push(Object.values(st.rec).filter(x => x.arenaW >= 3).length);
    }
    const out = [];
    const line = (k, v, note = '') => out.push(`${k.padEnd(42)} ${String(v).padEnd(14)} ${note}`);
    line('seasons', SEASONS);
    line('episodes per season', mean(m.eps), 'real: 14-18');
    line('finalists', mean(m.finalists), `balanced ${pct(m.balanced, SEASONS)}`);
    line('top player share of solo dailies', mean(m.topDailyShare), `chance line ${mean(m.chanceDailyShare)} (random winners, same dailies)`);
    line('most times one player voted in', mean(m.maxVotedIn));
    line('voted-in player wins the Arena', pct(m.votedInWins, m.arenas), 'they chose the fight: >50% expected');
    line('upsets / comebacks', `${pct(m.upsets, m.arenas)} / ${pct(m.comebacks, m.arenas)}`);
    line('call-out reasons', JSON.stringify(m.reasons));
    line('elimination beasts (3+ Arena wins)', mean(m.beasts));
    line('quits / medicals / DQs per season', `${mean(m.quits)} / ${mean(m.medicals)} / ${mean(m.dqs)}`, 'real: ~1 / ~1 / ~0.5');
    line('overnight quits, instant elims', `${mean(m.overnightQuits)} / ${(m.instant / SEASONS).toFixed(2)}`);
    line('episodes with no elimination', (m.noElim.length / SEASONS).toFixed(2));
    line('fights / physical per season', `${mean(m.fights)} / ${mean(m.physical)}`);
    line('showmances / breakups per season', `${mean(m.showmances)} / ${mean(m.breakups)}`);
    line('volunteers per season', mean(m.volunteers), `volunteer wins ${pct(m.volunteerWins, m.volunteerAll)}`);
    line('throws / caught per season', `${mean(m.throws)} / ${mean(m.caught)}`);
    line('alliances per season', mean(m.alliances), JSON.stringify(m.allianceEnd));
    line('same-show alliances early / late', `${pct(m.sameOrigin[0], m.sameOrigin[1])} / ${pct(m.lateSameOrigin[0], m.lateSameOrigin[1])}`, 'cliques should fade');
    line('alliances disagree on the target', pct(m.disagree, m.multiMeet));
    line('false yeses / outings / threats per season', `${mean(m.falseYes)} / ${mean(m.outings)} / ${mean(m.threats)}`);
    line('pleas that moved a vote', pct(m.pleasMoved, m.pleas));
    line('flips per season / per ballot', `${mean(m.flips)} / ${pct(m.flips.reduce((a, b) => a + b, 0), m.ballots)}`);
    line('landslides / close votes / tiebreaks', `${pct(m.votesLandslide, m.votes)} / ${pct(m.votesClose, m.votes)} / ${pct(m.tiebreaks, m.votes)}`);
    line('mornings after with mourners; blames', `${(m.mornings / SEASONS).toFixed(2)} / ${(m.blamed / SEASONS).toFixed(1)}`);
    line('rookies: share of cast / of final', `${pct(m.rookieAll, m.castAll)} / ${pct(m.rookieFinal, m.finalAll)}`);
    line('champion stat rank in division', mean(m.champRank), 'of 12; 6.5 = stats do not matter');
    const champs = Object.values(m.champArch).reduce((a, b) => a + b, 0);
    line('champion archetypes: share of champions vs share of casts', Object.entries(m.castArch).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${pct(m.champArch[k] || 0, champs)} vs ${pct(v, m.castAll)}`).join(', '));
    line('scenes per season', mean(m.scenes));
    for (const k of ['partner-blame', 'partner-carried', 'team-blame', 'arena-eve-pep', 'arena-eve-alone', 'arena-eve-confront',
      'tj-house-meeting', 'overnight-sabotage', 'final-pact-help', 'final-pact-broken']) line(`  ${k} per season`, (m.kinds[k] / SEASONS || 0).toFixed(2));
    line('house events per season', (Object.values(m.evFires).reduce((a, b) => a + b, 0) / SEASONS).toFixed(1));
    line('same event, same pair, twice in a season', pct(m.evPairRepeats, m.evPairs), `worst ${m.evPairMax}x`);
    line('cast with no house event at all', mean(m.unseen));
    line('event fires per season', Object.entries(m.evFires).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / SEASONS).toFixed(1)}`).join(', '));
    console.log('\n' + out.join('\n'));
    expect(m.finalists.every(n => n >= 4)).toBe(true);
  });
});
