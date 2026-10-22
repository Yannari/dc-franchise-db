// Scratch: play one season of The Challenge and print what happened.
import { it } from 'vitest';
import { appendFileSync, writeFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';

it('plays a season', () => {
  const out = 'transcripts/ch-smoke.txt';
  writeFileSync(out, '');
  const say = s => appendFileSync(out, s + '\n');
  const seed = Number(process.env.CH_SEED) || 3;
  const { cast, names, background } = challengeCast(24, seed);
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed });
  const byEp = {};
  for (const x of r.state.scenes) (byEp[x.ep] ||= []).push(x);
  for (const e of r.episodes) {
    const evs = (byEp[e.ep] || []).filter(x => x.data?.eventKind || ['alliance-form','meeting','recruit','outing','plea','leverage-threat','volunteer','morning-after','deal','deal-broken','alliance-betrayal','alliance-end','showmance','breakup','fight','fight-physical','throw-caught','picked-last','rookie-uprising','apology','meeting-spotted'].includes(x.kind));
    say(`-- ep ${e.ep} house: ` + evs.map(x => `${x.kind}(${x.who.join('/')}${x.data?.laughs === false ? ' WAR' : ''}${x.data?.believed === false ? ' SEEN-THROUGH' : ''}${x.data?.answer ? ' ' + x.data.answer : ''}${x.data?.responses ? ' ' + Object.entries(x.data.responses).filter(([,v]) => v !== 'yes' && v !== 'organiser').map(([k,v]) => k + ':' + v).join(',') + ' -> ' + x.data.target + (x.data.reason ? ' [' + x.data.reason + ']' : '') : ''})`).join('; '));
    say(`EP ${e.ep} [${e.division}] daily ${e.daily.name} (${e.daily.mode}) winners ${e.daily.winners.join(', ')}${e.daily.throws.length ? ' throws ' + e.daily.throws.map(t => t.name).join(',') : ''}`);
    if (e.party) say(`  party fights: ${e.party.fights.map(f => `${f.a} v ${f.b}${f.physical ? ' PHYSICAL' : ''}`).join('; ') || 'none'}`);
    if (e.delib) say(`  targets ${JSON.stringify(e.delib.targets)} threats ${e.delib.threats.map(t => `${t.from}->${t.at}`).join(',')} volunteer ${e.delib.volunteer?.name || '-'}`);
    for (const v of e.votes) say(`  vote: ${Object.entries(v.tally).map(([k, n]) => `${k} ${n}`).join(', ')} -> ${v.votedIn}${v.tiebreak ? ' (tie)' : ''} flips ${v.ballots.filter(b => b.flip).length}`);
    for (const c of e.callouts) say(`  callout: ${c.by} -> ${c.opponent} (${c.reason})`);
    for (const a of e.arena) say(`  arena ${a.gameName}: ${a.winner} beats ${a.loser}${a.upset ? ' UPSET' : ''}${a.comeback ? ' comeback' : ''}`);
    for (const x of e.exits) say(`  exit: ${x.name} ${x.how}`);
  }
  say(`FINAL: ${r.final.finalists.join(', ')}`);
  say(`instant: ${r.final.instant.map(d => `${d.winner} beats ${d.loser}`).join('; ')}; overnight quits: ${r.final.overnight.filter(o => o.quit).map(o => o.name).join(',') || 'none'}`);
  say(`CHAMPIONS: ${r.champions.join(' & ')}`);
  say(`alliances: ${r.state.alliances.map(a => `${a.name}(${a.members.length}${a.ended ? ', ended ' + a.why : ''})`).join('; ')}`);
  say(`couples: ${r.state.couples.map(c => `${c.a}+${c.b}${c.ended ? ' ended' : ''}`).join('; ')}`);
  say(`scenes: ${r.state.scenes.length}`);
});
