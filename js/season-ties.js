// ══════════════════════════════════════════════════════════════════════
// season-ties.js — who came into the season attached: a couple, family, exes, somebody at home
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-16: "do they actually acknowledge when they're in a relationship outside the game ... if their
// partner is in the game ... enemies and things like that". The season already knew (savestate.js seeds couples who
// arrived together as showmances, `partnerAtHome` on the player, the life log's exes in gs.lifeTies; kinship from the
// characters' ties), but the story layer asked kinshipBetween alone, which has none of the life log, so Duncan and
// Gwen arriving as a couple read as two strangers. One answer for the engine (camp-events.js), the vote (alliances.js)
// and the dialogue (td/story/director.js historyOf).
import { gs, players, kinshipBetween } from './core.js';
import { pronouns } from './players.js';

const FAMILY = new Set(['twins', 'siblings', 'step-siblings', 'parent-child', 'grandparent', 'aunt-uncle', 'cousins', 'in-laws']);
const COUPLE = new Set(['married', 'engaged', 'partners', 'dating']);
// a life stage as the kinship word for it (living together is still a boyfriend or girlfriend)
const STAGE = { married: 'married', engaged: 'engaged', 'living-together': 'dating', dating: 'dating', public: 'dating' };

const both = (x, a, b) => (x.a === a && x.b === b) || (x.a === b && x.b === a);

/** The couple who walked in together, as the season's showmance record (broken up here or not), or null. */
export function arrivedCouple(a, b) {
  return (gs?.showmances || []).find(sh => sh.origin === 'arrived-together' && sh.players?.includes(a) && sh.players?.includes(b)) || null;
}

/**
 * What a and b were to each other before the season: { kind: 'couple'|'family'|'exes'|'rivals', kin, together }.
 * `kin` is the kinship word (dating, married, siblings, exes...); `together` is whether a couple still is one.
 */
export function pairTie(a, b) {
  if (!a || !b || a === b || !gs) return null;
  const sh = arrivedCouple(a, b);
  if (sh) return { kind: 'couple', kin: STAGE[sh.lifeStage] || 'dating', together: sh.phase !== 'broken-up' };
  let kin = 'none';
  try { kin = kinshipBetween(a, b) || 'none'; } catch { kin = 'none'; }
  if (COUPLE.has(kin)) return { kind: 'couple', kin, together: true };
  if (FAMILY.has(kin)) return { kind: 'family', kin };
  const life = (gs.lifeTies || []).find(t => both(t, a, b));
  if (life?.kind === 'exes' || kin === 'exes') return { kind: 'exes', kin: 'exes' };
  if (life?.kind === 'couple') return { kind: 'couple', kin: 'dating', together: true };
  if (kin === 'estranged' || kin === 'ex-friends') return { kind: 'rivals', kin };
  return null;
}

/** Every tied pair among these names, each once. */
export function tiedPairs(names) {
  const out = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const t = pairTie(names[i], names[j]);
    if (t) out.push({ a: names[i], b: names[j], tie: t });
  }
  return out;
}

/** The partner left at home ({ name, stage, slug }), or null. */
export const homeOf = name => (players || []).find(p => p.name === name)?.partnerAtHome || null;
/** A home partner's stage as a kinship word. */
export const homeKin = stage => (stage === 'married' ? 'married' : stage === 'engaged' ? 'engaged' : 'dating');

/** What `name` is, said by their partner or family: kinWord('dating', 'Gwen') is "girlfriend". */
export function kinWord(kin, name) {
  const p = pronouns(name) || {}, she = p.sub === 'she', he = p.sub === 'he';
  if (kin === 'twins') return she ? 'twin sister' : he ? 'twin brother' : 'twin';
  if (kin === 'siblings' || kin === 'step-siblings') return she ? 'sister' : he ? 'brother' : 'sibling';
  if (kin === 'cousins') return 'cousin';
  if (kin === 'parent-child' || kin === 'grandparent' || kin === 'aunt-uncle' || kin === 'in-laws') return 'family';
  if (kin === 'married') return she ? 'wife' : he ? 'husband' : 'spouse';
  if (kin === 'engaged') return she ? 'fiancée' : 'fiancé';
  if (kin === 'dating' || kin === 'partners') return she ? 'girlfriend' : he ? 'boyfriend' : 'partner';
  if (kin === 'exes') return 'ex';
  return 'family';
}
