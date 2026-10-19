// ══════════════════════════════════════════════════════════════════════
// rr/episode.js — a played season, aired: one episode per leg
// ══════════════════════════════════════════════════════════════════════
//
// The director (story/director.js) chooses and writes each leg's scenes, in order, so the
// season's line ledger spends words the way a viewer hears them. episodeText prints an episode
// as a viewer would read it (manual §19.3 step 1: the place and the hour beside the words), with
// the scenes that have no words yet marked, so the read finds them.
import { airLeg } from './story/director.js';
import { previouslyFor } from './story/previously.js';
import { stableRng } from '../script/rng.js';
import { PLACES } from './places.js';

const hhmm = m => { const d = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`; };

export function airSeason(result) {
  const st = result.state;
  st.lineLedger = null;            // a fresh season of words
  st.kitLedger = null;
  st.quickCount = {};
  st.storyAired = {};
  const eps = [];
  for (const [i, l] of result.legs.entries()) {
    // "previously on", from what aired last time (before this leg's words spend the ledger)
    const previously = i ? previouslyFor(st, eps[i - 1], stableRng(st.seed, 'previously', l.n)) : null;
    // what the next episode's recap needs from this one: where it was, how many raced, who won and who went
    eps.push({ ...airLeg(st, l), previously, placeName: l.placeName, teams: l.order.length, order: l.order,
      eliminated: l.eliminated, how: l.how });
  }
  return eps;
}

export function episodeText(state, leg, ep) {
  const name = id => state.teams[id]?.name || id;
  const clock = leg.clockStart ?? 420;
  const out = [`LEG ${ep.n} · ${leg.placeName || PLACES[leg.place]?.name || '?'} · ${leg.kind}${leg.twist ? ' · ' + leg.twist : ''}`];
  if (ep.previously) for (const l of ep.previously.lines) out.push(`   ${l.by}: ${l.text}`);
  for (const seg of ep.segments) {
    const where = seg.stretch ? ` @${seg.stretch}` : '';
    out.push(`-- [${hhmm(clock + (seg.t || 0))}] ${seg.kind}${seg.ending ? '/' + seg.ending : ''}${where} (${seg.teams.map(name).join(' / ')})`);
    if (!seg.lines) { out.push('   [no words yet]'); continue; }
    for (const l of seg.lines) {
      out.push(l.kind === 'beat' ? `   (${l.text})` : l.kind === 'conf' ? `   ${l.by} [interview]: ${l.text}` : `   ${l.by}: ${l.text}`);
    }
  }
  out.push('   MAT: ' + (leg.order || []).map((id, i) => `${i + 1}. ${name(id)}`).join('  ·  '));
  for (const id of leg.eliminated || []) out.push(`   OUT: ${name(id)} (${leg.how?.[id] || 'out'})`);
  return out.join('\n');
}
