// Bridges concrete game events into contestant-specific knowledge.
import { gs } from './core.js';
import { factId, learn, propagate, recordFact } from './knowledge.js';
import { pitchTrust } from './relationships.js';
import { campKnowledgeContacts, currentCampAccessEpisode } from './camp-access.js';
const currentEp = () => (gs.episode || 0) + 1;

export function recordVotingPlanKnowledge(tribalPlayers, alliances, ep = currentEp()) {
  const attending = new Set(tribalPlayers || []), recorded = [];
  (alliances || []).forEach(plan => {
    if (!plan?.target) return;
    const members = (plan.members || []).filter(member => attending.has(member));
    if (!members.length) return;
    const id = factId('target', plan.target);
    const existing = recordFact({ type: 'target', subject: plan.target,
      payload: { plans: [plan.label], proposedBy: members[0] }, ep });
    const plans = new Set(existing.payload?.plans || []);
    if (plan.label) plans.add(plan.label);
    existing.payload = { ...(existing.payload || {}), plans: [...plans],
      proposedBy: existing.payload?.proposedBy || members[0] };
    members.forEach((member, index) => learn(member, id, {
      source: index ? members[0] : 'observation', sourceType: 'observed',
      from: index ? members[0] : null, ep,
    }));
    recorded.push(id);
  });
  return [...new Set(recorded)];
}

export function recordPitchKnowledge(pitches, ep = currentEp()) {
  const recorded = [];
  (pitches || []).forEach(pitch => {
    if (!pitch?.pitcher || !pitch?.pitchTarget) return;
    const id = factId('pitch', pitch.pitcher, pitch.pitchTarget);
    recordFact({ type: 'pitch', subject: pitch.pitcher, object: pitch.pitchTarget,
      payload: { claimedSupport: pitch.claimedSupport,
        liedAboutNumbers: Boolean(pitch.liedAboutNumbers) }, ep });
    learn(pitch.pitcher, id, { sourceType: 'observed', ep });
    (pitch.responses || []).filter(response => response.access?.possible !== false).forEach(response => learn(response.voter, id, {
      source: pitch.pitcher, sourceType: 'observed', from: pitch.pitcher, ep,
    }));
    (pitch.overheardBy || []).forEach(overhear => learn(overhear.knower || overhear, id, {
      source:pitch.pitcher, sourceType:'overheard', from:pitch.pitcher,
      confidence:overhear.confidence || 0.62, ep,
    }));
    recorded.push(id);
  });
  return recorded;
}

export function recordDetectedBetrayalKnowledge({ traitor, votedFor, witnesses = [], ep = currentEp() }) {
  if (!traitor || !votedFor) return null;
  const id = factId('betrayal', traitor, votedFor);
  recordFact({ type: 'betrayal', subject: traitor, object: votedFor, ep });
  witnesses.filter(name => name && name !== traitor).forEach(name =>
    learn(name, id, { sourceType: 'observed', ep }));
  return id;
}

// Idol/advantage finds → the finder knows they hold it (directly observed).
// Others stay unaware until it leaks/spreads or is played.
export function recordAdvantageFinds(ep, epNum = currentEp()) {
  const finds = ep?.idolFinds || [];
  const recorded = [];
  finds.forEach(f => {
    if (!f?.finder) return;
    const isIdol = ['idol', 'legacy', 'amulet', 'super-idol', 'beware'].includes(f.type);
    const type = isIdol ? 'idol' : 'advantage';
    const id = factId(type, f.finder);
    recordFact({ type, subject: f.finder, payload: { advType: f.type }, ep: epNum });
    learn(f.finder, id, { sourceType: 'observed', ep: epNum });
    recorded.push(id);
  });
  return recorded;
}

// A planted lie (forged note / whispered smear) → a FALSE fact that the victim
// either swallows (fooled: believes accused is against them) or sees through
// (and pins on the liar). social-manipulation already resolved the outcome, so
// we set the belief to match rather than re-rolling the belief check.
export function recordPlantedLie({ liar, victim, accused, believed, ep = currentEp() }) {
  if (!liar || !victim || !accused || victim === accused) return null;
  const id = factId('bond-read', accused, victim);
  const fact = recordFact({ type: 'bond-read', subject: accused, object: victim, payload: { plantedBy: liar }, truth: false, ep });
  fact.beliefs[victim] = believed
    ? { confidence: 0.75, source: liar, sourceType: 'told', valence: 'accurate', learnedEp: ep, knowsOthersKnow: [] }
    : { confidence: 0.7, source: liar, sourceType: 'deduced', valence: 'false', learnedEp: ep, knowsOthersKnow: [liar] };
  return id;
}

// A DETECTED challenge throw → only the players who saw through it know.
// (Undetected throws seed nothing — that's the point.)
export function recordChallengeThrowKnowledge(thrower, epNum = currentEp(), witnesses = []) {
  if (!thrower) return null;
  const id = factId('throw', thrower, epNum);
  recordFact({ type: 'throw', subject: thrower, object: epNum, ep: epNum });
  witnesses.filter(w => w && w !== thrower).forEach(w => learn(w, id, { sourceType: 'observed', ep: epNum }));
  return id;
}

export function spreadKnowledgeForRound(tribalPlayers, ep = currentEp(), rng = Math.random) {
  if (!gs._knowledgeSpreadRounds) gs._knowledgeSpreadRounds = [];
  const round = `${ep}:${[...(tribalPlayers || [])].sort().join('|')}`;
  if (gs._knowledgeSpreadRounds.includes(round)) return [];
  gs._knowledgeSpreadRounds.push(round);
  const hasSchedule = Boolean(currentCampAccessEpisode());
  return propagate(ep, { rng, maxPerFact: 2,
    ...(hasSchedule ? { contacts:knower => campKnowledgeContacts(knower, 'post') } : {}) });
}

export function knowledgeCampCards(events) {
  return (events || []).slice(0, 3).map(event => {
    const trusted = pitchTrust(event.to, event.from) >= 2;
    return { type: 'informationFlow', players: [event.from, event.to],
      badgeText: event.sourceType === 'rumor' ? 'WORD TRAVELS' : 'PRIVATE WORD',
      badgeClass: 'purple',
      text: trusted
        ? `${event.from} quietly brings ${event.subject}'s name to ${event.to}. ${event.to} listens closely and asks questions, but makes no promise about Tribal.`
        : `${event.from} quietly brings ${event.subject}'s name to ${event.to}. ${event.to} hears the pitch, but the guarded response gives nothing away.` };
  });
}
