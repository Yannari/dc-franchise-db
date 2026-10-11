// ══════════════════════════════════════════════════════════════════════
// td/past.js — what happened to a returnee last time, as the scenes need it
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-09: "we don't have returnee dialogue, only first timer". A returnee season read
// as a cast of strangers: of 184 scenes with a returnee in them, 7 mentioned that they had played
// before, and those seven said "last time" and nothing else. Everything here comes from the ledger
// (franchise-meta.js lastSeasonOf): the record of a season that was really played. Nothing is
// invented: a returnee with no record has no past here, and their scenes are a first-timer's.
//
// pastOf(name) -> null | {
//   where 'Season 1', place 4, placeWord '4th', total 16, seasons (how many before),
//   kind: 'won' | 'final' (finalist, lost) | 'early' (one of the first three out) |
//         'blindsided' (out without seeing it) | 'mid' (anything else),
//   by    the one who blindsided them, or who betrayed them (a name, or null),
//   partner, partnerEnded ('intact' | 'breakup'), wins (challenge wins)
// }
import { players } from '../core.js';
import { lastSeasonOf, careerOf } from '../franchise-meta.js';
import { pronouns } from '../players.js';

const ORD = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

export const isReturnee = name => !!name && !!players.find(p => p.name === name)?.isReturnee;

export function pastOf(name, any = false) {
  // any: read the ledger whatever the flag says (a coach is back, but not as a returning contestant)
  if (!any && !isReturnee(name)) return null;
  let last = null;
  try { last = lastSeasonOf(name); } catch { last = null; }
  const r = last?.rec;
  if (!r || !(r.placement > 0)) return null;
  const total = last.total || r.placement;
  // a past champion is introduced as one, whatever happened since: {lastSeason} is then the season they won
  const champ = !r.winner && !!last.wonWhere;
  const kind = r.winner || champ ? 'won'
    : r.finalist ? 'final'
      : r.placement > total - 3 ? 'early'
        : r.blindsided ? 'blindsided'
          : 'mid';
  const by = (r.blindsidedBy || [])[0] || (r.betrayedBy || [])[0] || null;
  const sh = (r.showmances || [])[0] || null;
  return {
    where: champ ? last.wonWhere : last.where, place: r.placement, champ, placeWord: ORD(r.placement), total, seasons: last.seasons,
    kind, by, partner: sh?.partner || null, partnerEnded: sh?.ended || null, wins: r.chalWins || 0,
    // how a final they lost was decided (null when they weren't a losing finalist last time)
    end: r.finalist && !r.winner ? endOf(name, last.finale) : null,
  };
}

// ── how a final was decided ──
// The user, 2026-10-11: a runner-up was "one vote from winning" after a final challenge. A season record
// carries its finale (franchise-meta.js: format, and the jury's votes when a jury voted); a season recorded
// before that knows neither, and its lines say only that they got to the end.
//   'jury1' lost the jury vote by one   'jury' lost the jury vote   'fans' lost the fan vote
//   'challenge' lost the final challenge   'unknown' an older record
const CHALLENGE_FINALES = new Set(['final-challenge', 'olympic-relay', 'hawaiian-punch', 'rescue-mission']);
export function endOf(name, finale) {
  const f = finale?.format || null;
  if (f && CHALLENGE_FINALES.has(f)) return 'challenge';
  if (f === 'fan-vote') return 'fans';
  const v = finale?.votes;
  if (v && Object.keys(v).length) {
    const top = Math.max(...Object.values(v).map(Number));
    return top - (Number(v[name]) || 0) === 1 ? 'jury1' : 'jury';
  }
  return 'unknown';
}

// ── the whole career, for an introduction ──
// The user, 2026-10-11: "explore the track record before just saying he was 13th last season: maybe he was
// 1st in his first season, won a lot of challenges, was strategic, super social... and if they flopped, a
// comedic moment". Everything here is from the ledger, season by season; nothing is invented.
export function careerSummary(name) {
  let seasons = [];
  try { seasons = careerOf(name); } catch { seasons = []; }
  seasons = seasons.filter(x => x.rec && x.rec.placement > 0);
  if (!seasons.length) return null;
  const sum = k => seasons.reduce((t, x) => t + (Number(x.rec[k]) || 0), 0);
  const last = seasons[seasons.length - 1];
  return {
    seasons, n: seasons.length,
    won: seasons.filter(x => x.rec.winner).map(x => x.where),
    finals: seasons.filter(x => x.rec.finalist && !x.rec.winner).map(x => ({ where: x.where, end: endOf(name, x.finale) })),
    firstOut: seasons.filter(x => x.total && x.rec.placement === x.total).map(x => x.where),
    early: seasons.filter(x => x.total && x.rec.placement > x.total - 3),
    chalWins: sum('chalWins'), blindsides: sum('blindsidesAuthored'), idols: sum('idolsPlayed'),
    showmance: (last.rec.showmances || [])[0]?.partner || null,
    last,
  };
}
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => NUM[n] || String(n);
const listOf = a => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const LOST = { jury1: w => `lost the final of ${w} by one vote`, jury: w => `lost the final of ${w} at the jury vote`, fans: w => `lost the fan vote at the end of ${w}`,
  challenge: w => `lost the final challenge of ${w}`, unknown: w => `made the final of ${w}` };
/**
 * The host's introduction from the whole career: "Won Season 1, came 13th in Season 3, and won six challenges
 * along the way. Watch your backs." Or the joke, for somebody it never went well for. null with no record.
 */
export function resumeOf(name, salt = 0) {
  const c = careerSummary(name);
  if (!c) return null;
  const p = pronouns(name);
  const parts = [];
  if (c.won.length) parts.push(`won ${listOf(c.won)}`);
  for (const f of c.finals.slice(-1)) parts.push(LOST[f.end] ? LOST[f.end](f.where) : LOST.unknown(f.where));
  // the last season, when it isn't one of the above: the comedown is part of the story
  const L = c.last;
  if (!L.rec.winner && !L.rec.finalist) parts.push(L.total && L.rec.placement === L.total ? `was the first one out of ${L.where}` : `came ${ORD(L.rec.placement)} in ${L.where}`);
  // what they were known for, from what they did
  if (c.chalWins >= 3) parts.push(`took ${num(c.chalWins)} challenges along the way`);
  else if (c.blindsides >= 2) parts.push(`blindsided ${num(c.blindsides)} people`);
  else if (c.idols >= 2) parts.push(`played ${num(c.idols)} idols`);
  else if (c.showmance && parts.length < 2) parts.push(`left with a showmance, ${c.showmance}`);
  const body = parts.slice(0, 3);
  let line = body.length ? `${body[0].charAt(0).toUpperCase()}${body[0].slice(1)}${body.length > 1 ? `${body.length > 2 ? ', ' + body.slice(1, -1).join(', ') + ',' : ''} and ${body[body.length - 1]}` : ''}.` : '';
  // and the tag: the champion, the strategist, the challenge machine, or the joke
  const flop = !c.won.length && !c.finals.length && c.early.length === c.n && c.chalWins < 2;
  const TAG = c.won.length ? [`Some of you have the poster.`, `Yes, that ${name}.`]
    : c.blindsides >= 2 ? [`Watch your backs.`, `Keep your friends close, and ${name} closer.`]
      : c.chalWins >= 5 ? [`Good luck keeping up.`, `Challenges are going to be a problem for the rest of you.`]
        : flop ? (c.firstOut.length ? [`We brought ${p.obj} back anyway. Mostly for the ratings.`, `It went great. Well. It went quickly.`] : [`Honestly? It didn't go well. But we like ${p.obj}.`, `Let's just say there's room to improve.`])
          : c.n >= 2 ? [`This is ${p.posAdj} ${['', 'first', 'second', 'third', 'fourth', 'fifth'][c.n + 1] || 'next'} time here.`] : [];
  if (TAG.length) line = `${line} ${TAG[salt % TAG.length]}`.trim();
  return line || null;
}

// The words a scene fills in for the returnee in a part (role 'a' -> lastSeason, lastPlace, lastBy;
// role 'b' -> lastSeasonB...). Only the keys that have a value: a scene that needs {lastBy} is gated
// on the fact that says there is one (past: 'blindsided'), and fill() leaves nothing half-written.
export function pastData(name, suffix = '') {
  const p = pastOf(name);
  if (!p) return {};
  const out = { [`lastSeason${suffix}`]: p.where, [`lastPlace${suffix}`]: p.placeWord };
  if (p.by) out[`lastBy${suffix}`] = p.by;
  if (p.partner) out[`lastPartner${suffix}`] = p.partner;
  return out;
}
