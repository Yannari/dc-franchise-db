// scratch: play a Pairs season of each method and print what happened
import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';

const METHODS = (process.env.CH_PAIRING || 'rivals,ties,fresh-meat,pick').split(',');
const SHAPE = process.env.CH_SHAPE || 'mixed';

it('plays pairs seasons', () => {
  for (const pairing of METHODS) {
    const seed = Number(process.env.CH_SEED || 11);
    const { cast, names, background } = challengeCast(24, seed);
    if (pairing === 'fresh-meat') {
      const m = names.filter(n => background[n].gender === 'm'), f = names.filter(n => background[n].gender === 'f');
      for (const [i, n] of m.entries()) background[n].rookie = i < 6;
      for (const [i, n] of f.entries()) background[n].rookie = i >= 6;
    }
    setPlayers(cast);
    const res = playChallengeSeason({ cast: names, background, seed, options: { pairs: { pairing, shape: SHAPE } } });
    const { state } = res;
    console.log(`\n=== ${pairing} / ${SHAPE} — ${state.episodes.length} episodes`);
    console.log('pairs at start:', (state.pairHistory || []).filter(h => h.from <= 1).map(h => `${h.a}&${h.b}(${h.how})`).join(', '));
    for (const e of state.episodes) {
      const v = e.votes.map(x => x.votedIn).join(',');
      const ar = e.arena.map(d => `${d.winners?.join('&')} beat ${d.losers?.join('&')} [${d.gameName}]`).join(' | ');
      const ex = e.exits.map(x => `${x.name}:${x.how}`).join(',');
      console.log(`ep${e.ep} div=${e.division} daily=${e.daily?.name} win=${e.daily?.winners?.join('&')} votedIn=${v} co=${e.callouts.map(c => `${c.decider}->${c.about}(${c.reason}${c.agreed ? '' : ', overruled ' + c.overruled})`).join(',')} :: ${ar}${ex ? ' exits ' + ex : ''}${e.swap ? ' SWAP' : ''}`);
    }
    console.log('pairs left:', state.pairs.map(p => `${p.a}&${p.b}`).join(', '), '| active', state.active.length, '| lone', state.lone);
    console.log('gone:', state.gone.map(g => `${g.name}#${g.place}:${g.how}`).join(', '));
    console.log('champions:', res.champions, 'placements:', JSON.stringify(res.final.placements));
    for (const c of res.final.choices || []) console.log(`  #${c.place} ${c.chooser} ${c.keep ? 'KEEPS' : c.hesitate ? 'shares (hesitated)' : 'shares'} ${c.prize} with ${c.partner} — ${c.why} (${c.total}) ${JSON.stringify(c.terms)}`);
  }
}, 120000);
