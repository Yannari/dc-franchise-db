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
  if (!Array.isArray(plan)) return raw;
  return plan.map(it => (it.story ? it : raw[it.ref])).filter(Boolean);
}

/** The engine's moments that did not air (the text backlog lists them under "Off camera"). */
export function offCamera(ep, camp, phase) {
  const raw = rawEvents(ep, camp, phase);
  const plan = ep?.campStory?.[camp]?.[phase];
  if (!Array.isArray(plan)) return [];
  const used = new Set(plan.filter(it => it.ref != null).map(it => it.ref));
  return raw.filter((ev, i) => ev && !used.has(i));
}
