// ══════════════════════════════════════════════════════════════════════
// td/story/feed.js — the camp scenes a viewer plays, in order
// ══════════════════════════════════════════════════════════════════════
//
// ep.campStory (director.js) holds, per camp and phase, either a written scene or a
// { ref } to one of that phase's engine events. This resolves it into the list a
// screen plays. An episode with no campStory (an old save, BB) plays every event.
// Pure: reads the episode, writes nothing.

const rawEvents = (ep, camp, phase) => {
  const block = ep?.campEvents?.[camp];
  return phase === 'pre' ? (Array.isArray(block) ? block : (block?.pre || [])) : (Array.isArray(block) ? [] : (block?.post || []));
};

/** The events a camp phase airs. */
export function campFeed(ep, camp, phase) {
  const raw = rawEvents(ep, camp, phase);
  const plan = ep?.campStory?.[camp]?.[phase];
  const coaches = new Set(Object.values(ep?.coachData || {}).flatMap(t => t?.coaches || []));
  const fits = ev => !coaches.size || coachSense(ev, coaches);
  if (!Array.isArray(plan)) return raw.filter(fits);
  // an engine moment that airs as itself keeps its storyline tag (the map locks a scene until the
  // earlier scene of the same storyline has been watched)
  return plan.map(it => (it.story ? it : raw[it.ref] && (it.storyline ? { ...raw[it.ref], storyline: it.storyline } : raw[it.ref]))).filter(Boolean).filter(fits);
}

// ── A coach is not a player ──
// The user, 2026-10-10: in a coach season the camp had a coach begged "can you not vote for me?", thanked
// for carrying somebody "in that challenge", bragging that the team would have lost every challenge
// without them, and sold as "the cheapest vote in the game". A coach lives at camp and can have any
// moment a person can have (a friendship, a fight, a joke, lobbying, being on the block), but never one
// that needs a ballot or a place in a challenge. A scene that casts a coach in such a part, or has a coach
// claim one, does not air (what it did to bonds still happened).
const COACH_PART = [[/^talk\.scramble/, 'b'], [/^drama\.showboat/, 'a'], [/^friend\.thanks/, 'a'], [/^read\.played/, 'b'], [/^plot\.majority/, 'b']];
const COACH_SAYS = /\b(my vote|my ballot|I'?ll vote|I will vote|I voted|I'm voting|carried me|I won (the|that) challenge)\b/i;
const TO_COACH = /\b(can you not vote|your vote\b|you'?re (the|my) (last|swing) vote|you (did|won|lost|carried|nailed|crushed) (the|that|this) ([\w-]+ )?challenge)/i;
function coachSense(ev, coaches) {
  const kind = ev.scene?.kind || ev.kind || '';
  const who = ev.scene?.who || ev.who || {};
  for (const [re, part] of COACH_PART) if (re.test(kind) && coaches.has(who[part])) return false;
  const lines = (ev.lines || []).filter(l => l.kind === 'say' || l.kind === 'conf');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (coaches.has(l.by) && COACH_SAYS.test(l.text || '')) return false;
    const next = lines[i + 1]?.by, prev = lines[i - 1]?.by;
    if (l.kind === 'say' && TO_COACH.test(l.text || '') && [next, prev].some(x => x && x !== l.by && coaches.has(x))) return false;
  }
  return true;
}

/** The engine's moments that did not air (the text backlog lists them under "Off camera"). */
export function offCamera(ep, camp, phase) {
  const raw = rawEvents(ep, camp, phase);
  const plan = ep?.campStory?.[camp]?.[phase];
  if (!Array.isArray(plan)) return [];
  const used = new Set(plan.filter(it => it.ref != null).map(it => it.ref));
  return raw.filter((ev, i) => ev && !used.has(i));
}
