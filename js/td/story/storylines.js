// ══════════════════════════════════════════════════════════════════════
// td/story/storylines.js — what each camp moment is a chapter of
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-07-td-storylines-design.md §2.1, ported
// from js/bb/story/storylines.js. The engine has already decided every camp
// event and applied its consequences; this only says what each one MEANS as a
// story, so the director (director.js) can air a season of connected threads
// instead of forty unrelated sketches an episode.
//
// A storyline is { id, type, key, people, steps } on gs.tdStory.lines. A step is
// { step, outcome, ep, phase, camp, roles: {a,b,c}, data, aired }.
// classify(ev) reads a camp event (its type, scene kind and ending, who) and
// answers { type, step, outcome, roles, key } or null (texture, not a chapter).
import { gs } from '../../core.js';

const R = (type, step, outcome = 'any') => ({ type, step, outcome });

// The event's type is the engine's own name for what happened; the scene kind
// (family.subkind) and its ending say how it went.
function ruleOf(ev) {
  const t = ev.type || '';
  const kind = ev.scene?.kind || '';
  const e = ev.scene?.data?.ending || '';
  // ── alliances ──
  if (t === 'allianceForm') return R('alliance', 'formed', e || 'pitch');
  if (t === 'allianceRecruit') return R('alliance', 'recruit');
  if (t === 'allianceRefusal') return R('alliance', 'refused');
  if (t === 'soldierCheckin' || t === 'tdStrategy' && /talk\.plan/.test(kind)) return R('alliance', 'checkin');
  if (t === 'allianceCrack') return R('alliance', 'crack', /quit/.test(kind) ? 'quit' : 'doubt');
  if (t === 'allianceDissolved' || t === 'allianceExpelled') return R('alliance', 'end', t === 'allianceExpelled' ? 'expelled' : 'collapsed');
  if (t === 'secretFlip' || t === 'betrayalReckoning' || t === 'betrayalDenial') return R('alliance', 'betrayal', t === 'betrayalReckoning' ? 'faced' : t === 'betrayalDenial' ? 'hidden' : 'flip');
  if (t === 'sideDeal' || t === 'endgameDealBroken' || t === 'endgameDealDissolved' || t === 'conflictingDeals') return R('alliance', 'deal', t === 'conflictingDeals' ? 'double' : /broken|Dissolved/.test(t) ? 'broken' : 'made');
  // ── rivalries ──
  if (/^(socialBomb|dispute|leadershipClash|foodConflict|messHallDrama|passiveAggressive|showboat|intimidation|jealousy)$/.test(t)) return R('rivalry', 'friction');
  if (/^(fight|hotheadExplosion|meltdown)$/.test(t) || t === 'socialBombReaction') return R('rivalry', t === 'socialBombReaction' ? 'friction' : 'blowup');
  if (/^(apology|forgiveness|rivalThaw)$/.test(t)) return R('rivalry', 'truce', /refus|cold/.test(e) ? 'refused' : 'made');
  if (t === 'nemesis') return R('rivalry', 'cold');
  // ── showmances ──
  if (/^(flirtation|showmanceSpark|showmancerMoment|crossTeam)$/.test(t) && (t !== 'crossTeam' || /flirt/.test(kind))) return R('showmance', 'spark');
  if (t === 'nightGame') return R('showmance', e === 'kiss' ? 'kiss' : 'spark');
  if (t === 'showmanceHoneymoon' || t === 'showmanceRekindle') return R('showmance', 'official');
  if (/^(showmanceJealousy|triangleTension|triangleConfrontation|affairRumor|affairSecret|showmanceNoticed)$/.test(t)) return R('showmance', 'jealous');
  if (/^(showmanceBreakup|affairExposed|affairChoice)$/.test(t)) return R('showmance', 'breakup');
  if (t === 'showmanceTarget') return R('showmance', 'targeted');
  // ── on the bottom ──
  if (/^(paranoia|paranoiaSpiral|exclusion|sitOutHeat|floaterInvisible)$/.test(t)) return R('bottom', 'noticed');
  if (/^(scramble|votePitchFailed|votePitch|strategicApproach|bigMoveThoughts)$/.test(t)) return R('bottom', 'scramble', t === 'votePitchFailed' ? 'failed' : 'any');
  if (/^(chalThreatReaction|gamePlanConfessional|tdBond)$/.test(t) && /threat\.notice|plan\.private\.target/.test(kind)) return R('bottom', 'targeted');
  // ── schemes ──
  if (/^(spreadLies|forgeNote|whisperCampaign|falseMajority|schemerManipulates|mastermindOrchestrates|chaosAgentStirsUp|lie|stolenCredit|villainIntimidate|villainPower|villainLoyalty)$/.test(t)) return R('scheme', 'move');
  if (/^(whisperCampaignExposed|stolenCreditConfrontation|loyaltyTestCaught|challengeThrowCaught)$/.test(t)) return R('scheme', 'caught');
  // ── friendships ──
  if (/^(bond|comfort|rideOrDie|secretShared|vulnerability|mentorBond|teachingMoment|gratitude|insideJoke|sunriseTalk|protectiveInstinct|silentSolidarity|loyaltyProof|rekindle|sharedStruggle|sharedMeal|celebrateTogether|groupLaugh)$/.test(t)) return R('friendship', 'bond');
  if (t === 'breakup') return R('friendship', 'drift');
  // ── the underdog ──
  if (/^(underdogMoment|unexpectedCompetence|socialBoost|moraleBoost)$/.test(t)) return R('underdog', 'rise');
  // ── idols ──
  if (/^(idolSearch|idolFound|idolShare|idolConfession|idolExposureRead|idolBetrayal|voteStealFound|voteStealSnooped|infoTrade)$/.test(t)) return R('idol', t === 'idolFound' || t === 'voteStealFound' ? 'found' : t === 'idolShare' || t === 'idolConfession' ? 'shared' : t === 'idolSearch' ? 'search' : 'known');
  return null;
}

/** Which storyline and step a camp event is, or null (texture: it plays as a quick cut or off camera). */
export function classify(ev) {
  const rule = ruleOf(ev || {});
  if (!rule) return null;
  const who = ev.scene?.who || {};
  const a = who.a || ev.players?.[0] || null;
  const b = who.b || ev.players?.[1] || null;
  const c = who.c || ev.players?.[2] || null;
  if (!a) return null;
  // two-person threads need two people; the bottom, a scheme, an idol and the underdog may be one
  if (['alliance', 'rivalry', 'showmance', 'friendship'].includes(rule.type) && !b) return null;
  const data = { ...(ev.scene?.data || {}) };
  if (ev.alliance && !data.alliance) data.alliance = ev.alliance;
  if (data.group && !data.alliance) data.alliance = data.group;
  let key;
  if (rule.type === 'alliance') key = data.alliance ? `name:${data.alliance}` : `pair:${[a, b].sort().join('|')}`;
  else if (['bottom', 'underdog', 'scheme', 'idol'].includes(rule.type)) key = a;
  else key = [a, b].sort().join('|');
  return { ...rule, key, roles: { a, b, c }, data };
}

/** The season's storylines. Plain data: it saves with the season. */
export function storylines() {
  gs.tdStory ||= {};
  return (gs.tdStory.lines ||= []);
}

/** File one classified moment; returns { line, step }. */
export function file(c, at) {
  const all = storylines();
  const id = `${c.type}:${c.key}`;
  let line = all.find(s => s.id === id && s.status !== 'resolved');
  if (!line) {
    line = { id, type: c.type, key: c.key, people: [], steps: [], status: 'live', since: at.ep };
    all.push(line);
  }
  for (const n of [c.roles.a, c.roles.b, c.roles.c]) if (n && !line.people.includes(n)) line.people.push(n);
  // an alliance forms once; forming it "again" is checking it still holds
  if (c.type === 'alliance' && c.step === 'formed' && line.steps.some(s => s.step === 'formed')) c = { ...c, step: 'checkin', outcome: 'any' };
  const step = { step: c.step, outcome: c.outcome, ep: at.ep, phase: at.phase, camp: at.camp, order: at.order, roles: c.roles, data: c.data, aired: false };
  line.steps.push(step);
  if (c.type === 'rivalry' && c.step === 'truce' && c.outcome === 'made') line.status = 'resolved';
  if (c.type === 'showmance' && c.step === 'breakup') line.status = 'resolved';
  if (c.type === 'alliance' && c.step === 'end') line.status = 'resolved';
  return { line, step };
}

/** The last step of this storyline that aired before `step`, or null. */
export function prevAired(line, step) {
  const i = line.steps.indexOf(step);
  return line.steps.slice(0, i).reverse().find(s => s.aired) || null;
}
