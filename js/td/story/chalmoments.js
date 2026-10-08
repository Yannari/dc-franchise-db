// ══════════════════════════════════════════════════════════════════════
// td/story/chalmoments.js — what happened inside the challenge, brought back to camp
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "events during the challenge are super important... use them to feed and
// deepen the simulation, not just performance". Every twist challenge (js/chal/*.js) records its own
// moments on its own data (a save, a sabotage, a taunt, a wipeout, a spark...), each with the people
// in it and a badge. They differ challenge to challenge, so this reads them all the same way: any
// record on the episode's own data with players, a badge or type, and narration. The badge says
// what kind of moment it was, and the camp scene after the challenge (director.js) picks it up.
// Kinds: saved, sabotage, clash, taunt, panic, wipeout, quit, hurt, spark, bond, pact, comedy,
// comeback, betray. Words only: the challenge already moved the bonds.
import { players } from '../../core.js';

const KINDS = [
  ['betray', /betray|lie[- ]caught|backstab/],
  ['sabotage', /sabotag|cheat|oil[- ]caught|theft|steal|swip|stole|snack theft|castle sabotage/],
  ['spark', /showmance|spark|seduc|romance|flirt|💕/],
  ['saved', /\bsave|heroic|support|teamwork|encourag|defends?|clutch|catch|carr(y|ied)|shield|olive branch|partner boost|helped|sled puller|provider/],
  ['clash', /blame|argument|clash|friction|rivalry|side[- ]eye|disrespect|captain[- ]blame|sore ?loss|complaint/],
  ['taunt', /trash ?talk|taunt|heckle|show[- ]?off|showboat|cocky|gloat/],
  ['panic', /panic|froze|frozen|shaken|scared|nightmare|fright|fear/],
  ['wipeout', /wipeout|water fall|stumble|slip|bad slide|fell|fall\b|dragged|drop/],
  ['quit', /\bquit|rang the bell|refuse|almost quit|bench/],
  ['hurt', /injur|scorpion|bear attack|boar attack|stung|bitten|sprain|twisted ankle/],
  ['pact', /pact|alliance|war council|strategy huddle|duo formed|hero pact|truce/],
  ['comeback', /redemption|prove them wrong|underdog ?rally|surge|comeback|recovery/],
  ['comedy', /comedy|gross|prank|funny|host roast/],
  ['bond', /bond|respect|in sync|cellmate|trust|reunion|pair moment|fireside/],
];
const SKIP_BADGE = /^(blindside|credible-pitch|pitch-|confessional|clue|advance|climb|dig|event|search|reset|stuck|descent|cart|clean|phase|round|entrance|costume|demo|crowd|judge|winner|cut|descend|boarded|tier-up|track-fail|hazard|obstacle|navigation|delivery|evasion|hide|run$|reaction|survive)/i;
const SKIP = new Set(['campEvents', 'gsSnapshot', 'tribalStory', 'campStory', 'twistStory', 'votingLog', 'campAccess', 'tribesAtStart', 'alliances', 'votePitches',
  'pitchIntel', 'pitchCounterplay', 'tdFirstImp', 'tdAuction', 'tdPreviously', 'exileStory', 'twists', 'adaptationEvents', 'idolPlays', 'chalMemberScores']);

export function kindOfBadge(badge, type = '') {
  const s = `${badge || ''} ${type || ''}`.toLowerCase();
  if (SKIP_BADGE.test(String(badge || type || '').trim())) return null;
  return (KINDS.find(([, re]) => re.test(s)) || [])[0] || null;
}

/** Every social moment of this episode's challenge: [{ kind, players, badge }] (cached on the episode, not saved). */
export function chalMoments(ep) {
  if (!ep) return [];
  if (ep._chalMoments) return ep._chalMoments;
  const names = new Set((players || []).map(p => p.name));
  const out = [];
  const walk = (o, d) => {
    if (!o || typeof o !== 'object' || d > 6) return;
    if (Array.isArray(o)) { for (const x of o) walk(x, d + 1); return; }
    const who = (Array.isArray(o.players) ? o.players : typeof o.player === 'string' ? [o.player] : []).filter(x => names.has(x));
    if (who.length && (o.badge || o.badgeText || o.type) && (o.text || o.desc)) {
      const kind = kindOfBadge(o.badge || o.badgeText, o.type);
      if (kind) out.push({ kind, players: [...new Set(who)].slice(0, 3), badge: String(o.badge || o.badgeText || o.type) });
      return;
    }
    for (const [k, v] of Object.entries(o)) if (!SKIP.has(k) && v && typeof v === 'object') walk(v, d + 1);
  };
  for (const [k, v] of Object.entries(ep)) if (!SKIP.has(k) && !k.startsWith('_') && v && typeof v === 'object') walk(v, 0);
  Object.defineProperty(ep, '_chalMoments', { value: out, enumerable: false, configurable: true });
  return out;
}
