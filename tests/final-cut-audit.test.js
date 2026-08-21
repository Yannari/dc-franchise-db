// Does the final HOH's cut decision actually work?
//
// The user's claim, from twenty watched seasons: the final Head of Household
// always brings the person who then beats them. The cut code projects the
// jury for both possible final twos and keeps the beatable one — so if the
// claim holds, the projection must disagree with the vote systematically.
// This plays whole seasons and prints where the two models part company.
import { describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, seasonConfig } from '../js/core.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { seedGame } from './helpers/setup.js';

const ROSTER = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(ROSTER) ? ROSTER : ROSTER.players || Object.values(ROSTER)[0])
  .filter(p => p?.stats && p.name);
const castFor = seed => Array.from({ length: 16 }, (_, i) => POOL[(i * 7 + seed * 13 + 3) % POOL.length])
  .filter((p, i, a) => a.findIndex(q => q.name === p.name) === i)
  .slice(0, 14)
  .map(p => ({ name: p.name, archetype: p.archetype || 'floater', gender: p.gender || 'm',
    sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));

const seededRng = (seed = 7) => {
  let s = seed;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 8; i++) next();
  return next;
};

describe('final cut audit', () => {
  it('plays seasons and compares the cut projection with the actual verdict', () => {
    const rows = [];
    for (let seed = 1; seed <= 20; seed++) {
      const cast = castFor(seed);
      if (cast.length < 12) continue;
      seedGame(cast, { episode: 0, eliminated: [], namedAlliances: [] });
      gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
      gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
      gs.episodeHistory = []; gs.jury = [];
      seasonConfig.romance = 'enabled';
      seasonConfig.finaleSize = 3;
      const rng = seededRng(seed * 101);
      try {
        simulateBBSeason({ rng, finaleSize: 3, houseEvents: HOUSE_EVENTS, competitions: BB_COMPETITIONS });
      } catch (e) { rows.push({ seed, error: 'season: ' + e.message }); continue; }
      let ep;
      try { ep = simulateBBFinale(rng); } catch (e) { rows.push({ seed, error: 'finale: ' + String(e.stack || '').split('\n').slice(0, 4).join(' | ') }); continue; }
      if (!ep) { rows.push({ seed, error: 'no finale' }); continue; }
      const cutAct = (ep.acts || []).find(a => a.type === 'final-cut');
      const verdict = (ep.acts || []).find(a => a.type === 'jury-verdict') || ep;
      const winner = ep.winner || verdict.winner;
      const votes = ep.votes || verdict.votes || {};
      if (!cutAct) { rows.push({ seed, error: 'no cut act' }); continue; }
      const { finalHoh, kept, cut, projected, honoured, betrayal, hadPromise, margins } = cutAct;
      rows.push({
        seed, finalHoh, kept, cut,
        followedProjection: kept === projected,
        keptForPromise: !!honoured,
        projMarginKept: margins?.[kept],
        projMarginCut: margins?.[cut],
        winner, votes: JSON.stringify(votes),
        hohWon: winner === finalHoh,
      });
    }
    const played = rows.filter(r => !r.error);
    const hohWins = played.filter(r => r.hohWon).length;
    const projSaidWin = played.filter(r => (r.projMarginKept ?? 0) > 0);
    const projRight = projSaidWin.filter(r => r.hohWon).length;
    console.log('rows', JSON.stringify(rows, null, 1));
    console.log(`played=${played.length} hohWon=${hohWins}`);
    console.log(`projection said HOH wins in ${projSaidWin.length}; it was right ${projRight} times`);
    console.log(`kept for promise: ${played.filter(r => r.keptForPromise).length}; followed projection: ${played.filter(r => r.followedProjection).length}`);
  }, 600000);
});
