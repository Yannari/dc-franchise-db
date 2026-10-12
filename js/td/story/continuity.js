// Editorial memory only: never supplies character knowledge or invents an event.
// Keys use the anchor pair and authored scene topic, independently of script IDs.
const keyOf = m => m.roles?.a && m.roles?.b
  ? JSON.stringify([m.type, ...[m.roles.a, m.roles.b].sort()]) : null;
const stateOf = m => JSON.stringify([m.step, m.outcome || 'any']);
const topicOf = m => m.topic || m.step;
export function continuityScore(memory, moment, at) {
  const key = keyOf(moment);
  const prior = key && memory[key];
  if (!prior || at.ep < prior.ep || at.ep - prior.ep > 4) return 0;
  // A truce, escalation, breakup or other engine-recorded change deserves its chapter.
  if (prior.state !== stateOf(moment)) return 4;
  if (prior.topic === 'friend.defend' && /^friend\.(bond|gratitude|solidarity|vulnerable)$/.test(topicOf(moment))) return 4;
  const topic = prior.topics[topicOf(moment)];
  return topic != null && at.ep - topic < 3 ? -4 : 0;
}
export function rememberMoment(memory, moment, at) {
  const key = keyOf(moment);
  if (!key) return;
  const prior = memory[key];
  memory[key] = { ep: at.ep, camp: at.camp, phase: at.phase || null,
    state: stateOf(moment), topic: topicOf(moment), topics: { ...(prior?.topics || {}), [topicOf(moment)]: at.ep } };
}
