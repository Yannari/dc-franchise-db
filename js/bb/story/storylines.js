// ══════════════════════════════════════════════════════════════════════
// bb/story/storylines.js — what each thing that happened in the house is a
// chapter of
// ══════════════════════════════════════════════════════════════════════
//
// Spec: docs/superpowers/specs/2026-10-05-bb-house-storylines-design.md §3.1.
//
// House life used to air as 22–30 unrelated snippets a stretch, each with its
// own two-to-five lines and no lead-in. The user, reading real seasons: "they
// just happen randomly for no reason". The events still decide everything the
// game does; this file only says what each one MEANS as a story, so the director
// (director.js) can air steps whose cause the viewer has seen or been told.
//
// A storyline is { id, type, key, people, steps: [...] } on gs.bb.storylines. A
// step is { step, outcome, week, stretch, roles: {a,b,c}, data, seenBy, room,
// aired }. classify(beat) reads a fired house beat (its scene kind and ending,
// who, data, eventId) and answers which storyline and which step, or null:
// a beat that is not a chapter of anything stays off camera, its consequences
// already applied.

import { gs, kinshipBetween, REL_KINSHIP } from '../../core.js';

// One rule per scene family (the part of the kind before the dot) or kind.
// `to(beat, who, data, ending)` returns { type, step, outcome, roles, data } or null.
const R = (type, step, outcome = 'any') => ({ type, step, outcome });

const FRICTION_KINDS = /^friction\.(dishes|food|noise|condescend|space|story|snap|joke)$/;

function kindRule(kind, ending, beat) {
  const e = ending || 'any';
  // ── feud: two people who rub each other the wrong way ──
  // friction by what it was ABOUT, so a later scene never contradicts it:
  // chores (dishes, food, noise, mess), a joke that cut, or somebody snapping
  if (FRICTION_KINDS.test(kind)) {
    const what = kind.split('.')[1];
    if (['dishes', 'food', 'noise'].includes(what)) return R('feud', 'friction', e === 'blowup' ? 'snap' : 'chores');
    if (['joke', 'condescend', 'story'].includes(what)) return R('feud', 'friction', 'joke');
    return R('feud', 'friction', 'snap');
  }
  if (kind === 'bond.petty' || kind === 'slop.argument') return R('feud', 'friction', 'chores');
  if (kind === 'editorial.roast' && e === 'cuts' || kind === 'texture.trial' && e === 'bad') return R('feud', 'friction', 'joke');
  if (kind === 'slop.snap' || kind === 'drinks.grievance' || kind === 'drinks.sharp') return R('feud', 'friction', 'snap');
  if (kind === 'talk.confront' || kind === 'editorial.standoff' || kind === 'arc.wronged' || kind === 'followup.overheard') return R('feud', 'argument');
  if (kind === 'bond.apology') return R('feud', 'apology', e === 'refused' ? 'refused' : 'accepted');
  if (kind === 'editorial.apology') return R('feud', 'apology', e === 'fails' ? 'refused' : 'accepted');
  if (kind === 'arc.apology') return R('feud', 'apology', e === 'cold' ? 'refused' : 'accepted');
  if (kind === 'kin.apology') return R('feud', 'apology', e === 'fails' ? 'refused' : 'accepted');
  if (kind === 'bond.cold-war' || kind === 'kin.coldwar') return R('feud', 'cold');

  // ── alliance: a group or a pair working together ──
  if (beat.eventId === 'alliance-formed' && beat.newAlliance) return R('alliance', 'formed', beat.evidence || 'close-pair');
  if (kind === 'social.alliance' || kind === 'talk.final-two' || kind === 'deals.final-three' || kind === 'deals.jury-pact') return R('alliance', 'formed', 'pact');
  if (beat.eventId === 'alliance-recruited') return R('alliance', 'recruit');
  if (kind === 'talk.reaffirm' || kind === 'talk.debrief') return R('alliance', 'checkin', /doubt|shaky|cut/.test(e) ? 'doubt' : 'solid');
  if (kind === 'alliance.missed' || kind === 'alliance.inner') return R('alliance', 'leftout');
  if (kind === 'deals.defection') return R('alliance', 'poach', e === 'tempted' ? 'tempted' : 'refused');
  if (kind === 'deals.exposed') return R('alliance', 'exposed');
  if (kind === 'alliance.betrayal') return R('alliance', 'betrayal', 'alliance');
  if (kind === 'deals.vote-flip' && e === 'flipped' || kind === 'deals.broken') return R('alliance', 'betrayal', 'vote');
  if (kind === 'alliance.repair') return R('alliance', 'repair', e === 'rejected' ? 'rejected' : 'forgiven');

  // ── showmance ──
  if (kind === 'social.spark' || kind === 'editorial.spark' || /^romance\.(firstMove|showmanceSpark|showmanceRekindle)$/.test(kind)) return R('showmance', 'spark');
  if (kind === 'bond.kiss') return R('showmance', 'kiss', e === 'couple' ? 'couple' : 'first');
  if (kind === 'couple.defined' || /^romance\.(showmanceHoneymoon|showmanceRideOrDie)$/.test(kind)) return R('showmance', 'declare');
  if (/^couple\.(hiding|underground|apart)$/.test(kind)) return R('showmance', 'hiding');
  if (/^couple\.(jealous|third)$/.test(kind) || /^romance\.(showmanceJealousy|triangle\w+)$/.test(kind)) return R('showmance', 'jealous');
  if (kind === 'couple.fight' || kind === 'life.couple' && e === 'strained') return R('showmance', 'fight');
  if (kind === 'romance.showmanceBreakup') return R('showmance', 'breakup');

  // ── target: who somebody wants gone, and the people on the block ──
  if (kind === 'talk.pitch-target' || kind === 'jury.bury') return R('target', 'pitch', e === 'overplayed' ? 'overplayed' : 'lands');
  if (kind === 'talk.gossip' || kind === 'social.rumour') return R('target', 'gossip');
  if (kind === 'campaign.case' || kind === 'talk.campaign' || kind === 'phase.reckons') return R('target', 'lobby', e === 'refused' ? 'refused' : 'lands');
  if (kind === 'talk.comfort') return R('target', 'block');
  if (kind === 'power.backdoor' || kind === 'plan.backdoor') return R('target', 'backdoor');
  if (kind === 'plan.count') return R('target', 'count', e === 'short' ? 'short' : 'holds');

  // ── schemes: a lie, and the day it comes out ──
  if (kind === 'scheme.lie' && e === 'confront' || kind === 'scheme.exposed' || kind === 'scheme.whisper' && e === 'exposed') return R('scheme', 'caught');
  if (kind === 'scheme.lie' && e !== 'warned' || kind === 'scheme.whisper') return R('scheme', 'lie', e === 'rejected' ? 'rejected' : 'believed');

  // ── everyday life: self-contained, no cause needed ──
  if (kind === 'life.prank') return R('life', 'prank', e === 'misfire' ? 'misfire' : 'funny');
  if (kind === 'life.chores') return R('life', 'chores');
  if (kind === 'life.sleepless' || /^editorial\.(latenight|bedroom|orbit)$/.test(kind) || kind === 'drinks.confess') return R('life', 'latenight');
  if (kind === 'life.homesick' || kind === 'bond.bad-day') return R('life', 'homesick', e === 'alone' ? 'alone' : 'helped');
  if (kind === 'editorial.breakdown') return R('life', 'breakdown');
  if (kind === 'bond.friends' || kind === 'social.trust') return R('life', 'friends');
  if (/^life\.(table|cook|workout|game|real|grooming|home-talk|boredom|inside-joke)$/.test(kind)
    || /^texture\.(kitchen|backyard|snoring|haircut|rant)$/.test(kind) || kind === 'texture.trial' || kind === 'drinks.open') return R('life', 'banter');
  return null;
}

const takenElsewhere = (x, other) => {
  try {
    return (gs.activePlayers || []).some(p => p !== x && p !== other && REL_KINSHIP[kinshipBetween(x, p)]?.group === 'Together');
  } catch { return false; }
};

/** Which storyline and step a fired house beat is, or null (it stays off camera). */
export function classify(beat) {
  const kind = beat?.scene?.kind || '';
  const ending = beat?.scene?.data?.ending || beat?.scene?.data?.result || null;
  const rule = kindRule(kind, ending, beat || {});
  if (!rule) return null;
  const who = beat.scene?.who || {};
  const a = who.a || beat.players?.[0] || null;
  const b = who.b || beat.players?.[1] || null;
  const c = who.c || null;
  const data = { ...(beat.scene?.data || {}) };
  if (beat.allianceName) data.alliance = beat.allianceName;
  if (beat.against && !data.target) data.target = beat.against;
  let roles = { a, b, c };
  // In a friction step a is always the one who DID it and b the one it was done to. The
  // old pools disagree (in a dishes row a is the one who has had enough; in a joke a is
  // the joker), so the chores and snapping families are turned round here.
  if (rule.type === 'feud' && rule.step === 'friction'
    && (/^friction\.(dishes|food|noise|space|snap)$/.test(kind) || kind === 'drinks.grievance' || kind === 'slop.argument')) roles = { a: b, b: a, c };
  // alliance steps: leftout a = the one left out, b = the one who ran it; betrayal a = the
  // one wronged, b = the one who did it
  if (rule.type === 'alliance' && rule.step === 'leftout') roles = kind === 'alliance.inner' ? { a: c, b: a, c: b } : { a: b, b: a, c };
  if (rule.type === 'alliance' && rule.step === 'betrayal' && kind === 'deals.vote-flip') roles = { a: b, b: a, c };
  // target and scheme: who is talking about whom
  if (kind === 'talk.comfort') roles = { a: b, b: a, c };                       // a is the nominee, b sits with them
  if ((kind === 'talk.gossip' || kind === 'social.rumour' || kind === 'power.backdoor' || kind === 'talk.campaign') && c && !data.target) data.target = c;
  if (rule.type === 'target' && data.target && [roles.a, roles.b].includes(data.target)) return null;
  // the person being talked about is never in the room for it
  if ((rule.type === 'target' || rule.type === 'scheme') && roles.c && roles.c === data.target) roles = { ...roles, c: null };
  if (!roles.a) return null;
  // Two-person storylines need two people; life may be one person alone.
  if (rule.type !== 'life' && !roles.b) return null;
  // A couple who came in together does not flirt like strangers: their spark and their
  // "what are we" are the stolen moments of a couple keeping a secret.
  if (rule.type === 'showmance' && ['spark', 'declare'].includes(rule.step)
    && REL_KINSHIP[kinshipBetween(roles.a, roles.b)]?.group === 'Together') rule.outcome = 'couple';
  // ...and somebody secretly with someone else does not get a romance with a third person on
  // screen: it would read as cheating nobody wrote. It stays off camera.
  if (rule.type === 'showmance' && rule.outcome !== 'couple' && [roles.a, roles.b].some(x => takenElsewhere(x, x === roles.a ? roles.b : roles.a))) return null;
  let key;
  const { a: ra, b: rb, c: rc } = roles;
  if (rule.type === 'alliance') key = data.alliance ? `name:${data.alliance}` : `pair:${[ra, rb].sort().join('|')}`;
  else if (rule.type === 'target') key = `${ra}>${data.target || rc || rb}`;
  // a scheme is the liar's: being caught (where the liar is b) finds the lie (where the liar is a)
  else if (rule.type === 'scheme') key = `liar:${rule.step === 'caught' ? rb : ra}`;
  else if (rule.type === 'life') key = `life:${beat.eventId}:${ra}`;
  else key = [ra, rb].sort().join('|');
  return { ...rule, key, roles, data, seenBy: beat.scene?.seenBy || beat.players || [], room: beat.scene?.room || beat.location || null };
}

/** The season's storylines. Plain data: it saves with the season. */
export function storylines() {
  gs.bb ||= {};
  return (gs.bb.storylines ||= []);
}

/** File one classified beat; returns { line, step }. */
export function file(c, { week, stretch, beatAt }) {
  const all = storylines();
  const id = `${c.type}:${c.key}`;
  let line = all.find(s => s.id === id && s.status !== 'resolved');
  if (!line) {
    line = { id, type: c.type, key: c.key, people: [], steps: [], status: 'live', since: week };
    all.push(line);
  }
  for (const n of [c.roles.a, c.roles.b, c.roles.c]) if (n && !line.people.includes(n)) line.people.push(n);
  // an alliance forms once; saying "final two" again is checking it still holds
  if (c.type === 'alliance' && c.step === 'formed' && line.steps.some(s => s.step === 'formed')) c = { ...c, step: 'checkin', outcome: 'solid' };
  const step = { step: c.step, outcome: c.outcome, week, stretch, at: beatAt, roles: c.roles, data: c.data,
    seenBy: c.seenBy, room: c.room, aired: false };
  line.steps.push(step);
  // a feud that made up, or an alliance whose pair is gone, closes; the next clash starts a new one
  if (c.type === 'feud' && c.step === 'apology' && c.outcome === 'accepted') line.status = 'resolved';
  if (c.type === 'showmance' && c.step === 'breakup') line.status = 'resolved';
  return { line, step };
}

// A step that answers an earlier one needs that earlier one in its storyline.
// The value lists the steps that count as its cause.
export const NEEDS = {
  'feud.argument': ['friction', 'argument', 'cold', 'apology'],
  'feud.apology': ['friction', 'argument', 'cold'],
  'feud.cold': ['friction', 'argument', 'apology'],
  'alliance.checkin': ['formed', 'recruit', 'checkin', 'leftout', 'repair'],
  'alliance.leftout': ['formed', 'recruit', 'checkin'],
  'alliance.betrayal.alliance': ['formed', 'recruit', 'checkin', 'leftout'],
  'alliance.betrayal.vote': null,
  'alliance.repair': ['betrayal'],
  'showmance.declare': ['spark', 'kiss'],
  'showmance.hiding': ['spark', 'kiss', 'declare'],
  'showmance.jealous': ['spark', 'kiss', 'declare', 'hiding'],
  'showmance.fight': ['kiss', 'declare', 'hiding', 'jealous'],
  'showmance.breakup': ['kiss', 'declare', 'hiding', 'jealous', 'fight'],
  'scheme.caught': ['lie'],
};
/** The earlier step this one answers, if it needs one; null if it needs none; false if its cause is missing. */
export function causeOf(line, step) {
  const k3 = `${line.type}.${step.step}.${step.outcome}`;
  const want = k3 in NEEDS ? NEEDS[k3] : NEEDS[`${line.type}.${step.step}`];
  // a first kiss answers the spark; a couple who came in together need none
  if (line.type === 'showmance' && step.step === 'kiss' && step.outcome === 'first') {
    const prior = line.steps.slice(0, line.steps.indexOf(step)).reverse().find(s => s.step === 'spark');
    return prior || null;
  }
  if (!want) return null;
  const before = line.steps.slice(0, line.steps.indexOf(step));
  // Inside an alliance, what the viewer needs is that the alliance EXISTS and who is in it:
  // the cause of being left out of a meeting is not that somebody else joined last week.
  if (line.type === 'alliance' && ['checkin', 'leftout', 'betrayal'].includes(step.step)) {
    const cast = [step.roles.a, step.roles.b, step.roles.c].filter(Boolean);
    const formed = before.find(s => s.step === 'formed');
    if (formed?.aired) return formed;
    const joined = before.find(s => s.step === 'recruit' && s.aired && cast.includes(s.roles.a));
    if (joined) return joined;
    if (formed) return formed;
  }
  const prior = before.reverse().find(s => want.includes(s.step));
  return prior || false;
}
