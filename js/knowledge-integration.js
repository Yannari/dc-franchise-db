// Bridges concrete game events into contestant-specific knowledge.
import { gs } from './core.js';
import { pronouns, pStats } from './players.js';
import { factId, learn, propagate, recordFact, believes } from './knowledge.js';
import { pitchTrust } from './relationships.js';
import { campKnowledgeContacts, currentCampAccessEpisode, findConversationAccess } from './camp-access.js';
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

function knowledgeCardText(event) {
  const { from, to, subject } = event;
  const trusted = pitchTrust(to, from) >= 2;
  const react = trusted
    ? `${to} listens closely and asks questions, but makes no promise about Tribal.`
    : `${to} takes it in, but the guarded response gives nothing away.`;
  // The fact's subject can BE the person being told — that's a heads-up, not a
  // vote pitch. And it can be the speaker themselves — that's confiding.
  if (subject === to) {
    return `${from} quietly warns ${to} that ${pronouns(to).posAdj} name is being floated for the next vote. ${react}`;
  }
  if (subject === from) {
    return `${from} confides in ${to} that ${pronouns(from).posAdj} own name is in play. ${react}`;
  }
  return `${from} quietly brings ${subject}'s name to ${to}. ${react}`;
}

// ── #5 Jury perception (foundation): who the jury BELIEVES controlled each vote ──
// A post-merge boot's architect is recorded as a knowledge fact the jury learns,
// distorted by stolen credit (the thief gets believed) and secrecy (a hidden
// move barely registers). Read by the finale jury vote, the jury-elimination
// twist, and — later — Ponderosa reconciliation and FTC correction. Belief, not
// truth, is what drives jury respect: secret games and stolen credit cost you.

// Best-effort read of who actually orchestrated a boot from the episode data.
function trueArchitectOf(ep) {
  const booted = ep?.eliminated;
  if (!booted) return null;
  // 1) The vote-pitch organizer who aimed the room at this person.
  const pitch = (ep.votePitches || []).find(p => p.pitchTarget === booted && p.pitcher && p.pitcher !== booted);
  if (pitch) return { name: pitch.pitcher, visibility: Math.min(0.85, 0.45 + (pitch.confirmedCoalition?.length || 1) * 0.08) };
  // 2) The alliance that named this target — credit its proposer.
  const plan = (gs.namedAlliances || []).find(a => a.active !== false && a.target === booted && (a.members || []).length);
  if (plan) return { name: plan.members[0], visibility: 0.55 };
  // 3) Fallback: the highest-profile mover who wrote the name.
  const voters = (ep.votingLog || []).filter(e => e.voted === booted && e.voter !== booted).map(e => e.voter);
  if (voters.length) {
    const mover = voters.slice().sort((a, b) => (gs.playerStates?.[b]?.bigMoves || 0) - (gs.playerStates?.[a]?.bigMoves || 0))[0];
    return { name: mover, visibility: 0.4 };
  }
  return null;
}

export function recordVoteArchitect(ep, epNum = currentEp()) {
  if (!gs.isMerged || !ep?.eliminated) return null;
  const truth = trueArchitectOf(ep);
  if (!truth?.name) return null;
  const booted = ep.eliminated;
  // Stolen credit: if a thief is actively taking THIS architect's credit, the
  // jury forms a FALSE belief crediting the thief instead.
  const theft = gs.stolenCredit && !gs.stolenCredit.confronted && gs.stolenCredit.architect === truth.name
    ? gs.stolenCredit.stealer : null;
  const credited = theft || truth.name;
  const accurate = credited === truth.name;
  const id = factId('architect', credited, booted);
  const fact = recordFact({ type: 'architect', subject: credited, object: booted,
    payload: { trueArchitect: truth.name, stolen: Boolean(theft) }, truth: accurate, ep: epNum });
  // The jury OBSERVED a boot happen and formed a belief about who ran it — set it
  // directly (not a persuasion roll): a stolen-credit belief is confidently FALSE,
  // and confidence tracks visibility so a secret move barely registers.
  const valence = accurate ? 'accurate' : 'false';
  const jurors = [...new Set([...(gs.jury || []), booted])].filter(Boolean);
  jurors.forEach(j => {
    if (j === credited) return;
    const conf = Math.min(0.9, (j === booted ? 0.15 : 0) + truth.visibility); // the target read the room a little better
    fact.beliefs[j] = { confidence: conf, source: theft ? 'the camp' : 'observation',
      sourceType: theft ? 'rumor' : 'observed', valence, learnedEp: epNum, knowsOthersKnow: [] };
  });
  fact.beliefs[credited] = { confidence: 0.95, source: 'self', sourceType: 'observed', valence, learnedEp: epNum, knowsOthersKnow: [] };
  return { credited, trueArchitect: truth.name, stolen: Boolean(theft) };
}

// How strongly a juror credits `player` with controlling the game — summed over
// the boots they believe that player architected. Caps to avoid runaway.
export function juryArchitectCredit(juror, player) {
  const facts = gs.knowledge || {};
  let credit = 0;
  Object.values(facts).forEach(f => {
    if (f?.type !== 'architect' || f.subject !== player) return;
    const b = f.beliefs?.[juror];
    if (b) credit += Number(b.confidence || 0);
  });
  return Math.min(3, credit);
}

// Does this juror believe `player` orchestrated the juror's OWN boot?
export function juryBelievesBooter(juror, player) {
  return Number(believes(juror, factId('architect', player, juror))?.effectiveConfidence || 0);
}

// Ponderosa: the jury compares stories. A distorted belief (stolen credit) can
// be SEEN THROUGH by a sharp juror — who then reattributes the move to the real
// architect — or ENTRENCHED by group agreement. Returns the reconciliations so
// callers can narrate "the jury pieced it together" beats.
export function reconcileJuryPerception(jurors = gs.jury, epNum = currentEp(), rng = Math.random) {
  const panel = [...new Set(jurors || [])].filter(Boolean);
  if (panel.length < 2) return [];
  const facts = gs.knowledge || {};
  const out = [];
  Object.values(facts).forEach(fact => {
    if (fact?.type !== 'architect') return;
    const trueArch = fact.payload?.trueArchitect;
    const distorted = trueArch && trueArch !== fact.subject; // only stolen/false credit can flip
    panel.forEach(j => {
      const b = fact.beliefs?.[j];
      if (!b) return;
      const jS = pStats(j);
      if (distorted && b.valence === 'false') {
        // Sharp jurors see through it, more easily when the belief is shaky.
        const seeThrough = Math.min(0.7, (jS.intuition + jS.strategic) * 0.025) * (1 - Math.min(0.9, b.confidence) * 0.55);
        if (rng() < seeThrough) {
          const trueId = factId('architect', trueArch, fact.object);
          const trueFact = facts[trueId] || recordFact({ type: 'architect', subject: trueArch, object: fact.object,
            payload: { trueArchitect: trueArch }, truth: true, ep: epNum });
          trueFact.beliefs[j] = { confidence: 0.6, source: 'ponderosa', sourceType: 'deduced', valence: 'accurate', learnedEp: epNum, knowsOthersKnow: [] };
          b.confidence = Math.max(0, b.confidence - 0.5);
          b.valence = 'stale';
          out.push({ juror: j, from: fact.subject, to: trueArch, kind: 'corrected', object: fact.object });
          return;
        }
      }
      // Otherwise the roundtable just reinforces what they already believe.
      b.confidence = Math.min(0.95, b.confidence + 0.08);
      if (distorted && b.valence === 'false') out.push({ juror: j, subject: fact.subject, kind: 'entrenched', object: fact.object });
    });
  });
  return out;
}

// FTC correction: a finalist makes the case that a move a juror mis-credited was
// actually theirs. Succeeds with probability `persuasion`; on success the juror's
// false belief is dropped and an accurate one takes its place — so the jury vote
// (which reads beliefs) now rewards the true architect. Bounded persuasion keeps
// this from becoming a random flip.
export function ftcCorrectBelief(finalist, juror, persuasion, epNum = currentEp(), rng = Math.random) {
  const facts = gs.knowledge || {};
  let corrected = null;
  Object.values(facts).forEach(fact => {
    if (corrected || fact?.type !== 'architect') return;
    if (fact.payload?.trueArchitect !== finalist || fact.subject === finalist) return; // finalist really did it, but isn't credited
    const b = fact.beliefs?.[juror];
    if (!b || b.valence !== 'false') return;   // juror must currently hold the false story
    if (rng() >= persuasion) return;
    const trueId = factId('architect', finalist, fact.object);
    const trueFact = facts[trueId] || recordFact({ type: 'architect', subject: finalist, object: fact.object,
      payload: { trueArchitect: finalist }, truth: true, ep: epNum });
    trueFact.beliefs[juror] = { confidence: 0.7, source: 'ftc', sourceType: 'told', valence: 'accurate', learnedEp: epNum, knowsOthersKnow: [] };
    b.confidence = Math.max(0, b.confidence - 0.6);
    b.valence = 'stale';
    corrected = { juror, finalist, object: fact.object, stolenFrom: fact.subject };
  });
  return corrected;
}

export function knowledgeCampCards(events) {
  const accessEp = currentCampAccessEpisode();
  return (events || []).slice(0, 3).map(event => {
    const card = { type: 'informationFlow', players: [event.from, event.to],
      badgeText: event.sourceType === 'rumor' ? 'WORD TRAVELS' : 'PRIVATE WORD',
      badgeClass: 'purple',
      text: knowledgeCardText(event) };
    // These cards are created during vote simulation, after the post-phase
    // access annotation ran, so attach the real conversation location here too.
    if (accessEp) {
      const access = findConversationAccess(accessEp, event.from, event.to, { phase: 'post', privacy: 0.45, slipAway: true });
      if (access.possible) card.access = access;
    }
    return card;
  });
}

// How a listener came by the information — drives both narration and credibility.
const SOURCE_METHOD = { told: 'told directly', rumor: 'secondhand rumor', overheard: 'overheard',
  observed: 'saw it firsthand', public: 'said openly', deduced: 'pieced it together' };
export function infoFlowMethod(ev) { return SOURCE_METHOD[ev?.sourceType] || 'heard it'; }

// Stamp the real conversation location onto each propagation event while the
// schedule is still current, so the info-flow log renders the same place in the
// live episode and on replay. Called from episode.js as events are recorded.
export function attachInfoFlowLocations(events) {
  const accessEp = currentCampAccessEpisode();
  if (!accessEp) return events;
  (events || []).forEach(ev => {
    if (!ev?.from || !ev?.to || ev.location) return;
    const access = findConversationAccess(accessEp, ev.from, ev.to, { phase: 'post', privacy: 0.45, slipAway: true });
    if (access.possible) ev.location = access.location;
  });
  return events;
}

// Ordered, complete play-by-play of how information moved this episode — for the
// text backlog and the VP. Each entry carries who → whom, what, how (method),
// where (persisted location) and the resulting awareness count.
export function buildInfoFlowLog(ep) {
  const events = ep?.knowledgeEvents || [];
  const facts = ep?.knowledgeSnapshot || gs.knowledge || {};
  const roster = new Set(ep?.tribalPlayers || gs.activePlayers || []);
  return events.filter(ev => ev.from && ev.to).map(ev => {
    const fact = facts[ev.id] || {};
    const awareness = Object.entries(fact.beliefs || {})
      .filter(([n, b]) => (!roster.size || roster.has(n)) && Number(b?.confidence || 0) >= 0.35)
      .map(([n]) => n);
    const isExposure = ev.type === 'target' && ev.to === ev.subject;
    const kind = isExposure ? 'warning' : ev.type === 'pitch' ? 'pitch' : ev.sourceType === 'rumor' ? 'rumor' : 'leak';
    const object = fact.object;
    const sentence = isExposure
      ? `${ev.from} warned ${ev.to} that ${ev.to}'s name is live`
      : ev.type === 'pitch'
        ? `${ev.to} heard that ${ev.subject} pitched ${object || 'a target'}`
        : `${ev.from} passed ${ev.subject}'s name to ${ev.to}`;
    return { from: ev.from, to: ev.to, subject: ev.subject, kind, method: infoFlowMethod(ev),
      location: ev.location || null, awareness, sentence };
  });
}
