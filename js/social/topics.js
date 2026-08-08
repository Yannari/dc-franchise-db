// js/social/topics.js
// What the audience talks about.
//
// Taken from observed discourse rather than invented. Two entries here exist
// because real seasons produced them: fans defended Taylor Hale against how
// production EDITED her in Big Brother 24, and fans raised alarm over a Big
// Brother 27 showmance that read as love-bombing rather than romance. The second
// is why `showmance-concern` is separate from `showmance-hate` — they are
// different feelings pointed at different targets.
//
// EVERY TOPIC DECLARES WHAT IT READS. A topic with no data source behind it can
// never fire, and reads as breadth in this file while appearing nowhere on
// screen.

/** The events project 2 will hand us. A topic may only trigger on these. */
export const EVENT_KINDS = [
  'blindside', 'eviction', 'comp-win', 'nomination', 'veto-used',
  'showmance-formed', 'showmance-broken', 'romantic-spark',
  'alliance-formed', 'betrayal', 'argument', 'kindness',
  'ganging-up', 'domination', 'twist', 'finale', 'episode-aired',
];

/**
 * A topic.
 *
 *   id        stable identifier
 *   stream    'timeline' (public) | 'chat' (hosted) | 'both'
 *   triggers  which EVENT_KINDS produce it
 *   reads     which simulator data it needs — documentation AND a promise that
 *             project 2 must supply it
 *   weight    0..1, relative likelihood before persona feelings are applied
 *   shapes    the post forms this topic can take
 */
export const TOPICS = [
  // ── gameplay ────────────────────────────────────────────────────────────
  { id: 'strategy-critique', stream: 'both', weight: 0.8,
    triggers: ['eviction', 'nomination', 'veto-used', 'betrayal', 'alliance-formed'],
    reads: ['votes', 'nominations', 'alliances'],
    shapes: ['hot-take', 'thread-opener', 'quote-dunk'] },

  { id: 'blindside-reaction', stream: 'both', weight: 1.0,
    triggers: ['blindside'],
    reads: ['votes', 'perceivedBonds'],
    shapes: ['live-reaction', 'dunk', 'disbelief'] },

  { id: 'comp-talk', stream: 'both', weight: 0.6,
    triggers: ['comp-win'],
    reads: ['chalMemberScores', 'challengeRecord'],
    shapes: ['hot-take', 'stat-drop'] },

  { id: 'steamroll-fatigue', stream: 'both', weight: 0.7,
    triggers: ['domination', 'eviction', 'episode-aired'],
    reads: ['alliances', 'votes', 'seasonArc'],
    shapes: ['complaint', 'resigned', 'quote-dunk'] },

  { id: 'prediction', stream: 'chat', weight: 0.5,
    triggers: ['episode-aired', 'nomination', 'finale'],
    reads: ['alliances', 'placementOdds'],
    shapes: ['prediction', 'insider-read'] },

  { id: 'legacy-take', stream: 'both', weight: 0.4,
    triggers: ['finale', 'eviction'],
    reads: ['careerTotals', 'franchiseRecords'],
    shapes: ['hot-take', 'ranking'] },

  { id: 'production-critique', stream: 'timeline', weight: 0.5,
    triggers: ['twist', 'episode-aired'],
    reads: ['twists'],
    shapes: ['complaint', 'conspiracy'] },

  // ── social ──────────────────────────────────────────────────────────────
  { id: 'harassment-defence', stream: 'both', weight: 0.9,
    triggers: ['ganging-up', 'argument'],
    reads: ['campEvents', 'socialManipulation', 'bonds'],
    shapes: ['defence', 'call-out', 'pile-on-against-the-house'] },

  { id: 'edit-critique', stream: 'timeline', weight: 0.6,
    triggers: ['episode-aired', 'argument'],
    reads: ['screenTime', 'popularity'],
    shapes: ['call-out', 'complaint'] },

  { id: 'kindness-noticed', stream: 'both', weight: 0.5,
    triggers: ['kindness'],
    reads: ['campEvents', 'bonds'],
    shapes: ['appreciation', 'soft-take'] },

  { id: 'personality-clash', stream: 'timeline', weight: 0.5,
    triggers: ['argument'],
    reads: ['campEvents', 'bonds'],
    shapes: ['hot-take', 'dunk'] },

  { id: 'social-game-autopsy', stream: 'both', weight: 0.65,
    triggers: ['eviction', 'betrayal', 'argument', 'ganging-up'],
    reads: ['bonds', 'votes', 'campEvents', 'socialManipulation'],
    shapes: ['thread-opener', 'hot-take'] },

  { id: 'hypocrisy-watch', stream: 'timeline', weight: 0.65,
    triggers: ['betrayal', 'argument', 'nomination', 'eviction'],
    reads: ['votes', 'nominations', 'campEvents'],
    shapes: ['quote-dunk', 'call-out'] },

  // Cruelty has its own topic so it can be tested as a class rather than
  // leaking accidentally into every supportive pool. Personal, never bigoted:
  // ego, presentation, competence, personality and gameplay are fair targets.
  { id: 'personal-roast', stream: 'timeline', weight: 0.55,
    triggers: ['episode-aired', 'argument', 'comp-win', 'nomination', 'eviction'],
    reads: ['roster', 'popularity', 'campEvents'],
    shapes: ['dunk', 'hot-take'] },

  // ── romantic ────────────────────────────────────────────────────────────
  { id: 'shipping', stream: 'timeline', weight: 0.7,
    triggers: ['romantic-spark', 'episode-aired'],
    reads: ['romanticSparks', 'bonds'],
    shapes: ['ship', 'gushing'] },

  { id: 'thirst', stream: 'timeline', weight: 0.6,
    triggers: ['episode-aired', 'comp-win'],
    reads: ['roster'],
    shapes: ['thirst', 'gushing'] },

  { id: 'showmance-hate', stream: 'timeline', weight: 0.6,
    triggers: ['showmance-formed'],
    reads: ['showmances'],
    shapes: ['complaint', 'dunk'] },

  { id: 'showmance-concern', stream: 'both', weight: 0.6,
    triggers: ['showmance-formed', 'argument'],
    reads: ['showmances', 'bonds', 'campEvents'],
    shapes: ['concern', 'call-out'] },

  { id: 'breakup-reaction', stream: 'timeline', weight: 0.5,
    triggers: ['showmance-broken'],
    reads: ['showmances'],
    shapes: ['live-reaction', 'gloating', 'sympathy'] },

  // ── character ───────────────────────────────────────────────────────────
  { id: 'love-them-hate-their-game', stream: 'both', weight: 0.7,
    triggers: ['eviction', 'nomination', 'episode-aired'],
    reads: ['popularity', 'votes'],
    shapes: ['conflicted', 'soft-take'] },

  { id: 'hate-them-rate-their-game', stream: 'both', weight: 0.7,
    triggers: ['blindside', 'comp-win', 'betrayal'],
    reads: ['popularity', 'votes'],
    shapes: ['conflicted', 'grudging-respect'] },

  { id: 'favourite-declaration', stream: 'timeline', weight: 0.5,
    triggers: ['episode-aired', 'comp-win', 'kindness'],
    reads: ['popularity'],
    shapes: ['gushing', 'stan-post'] },

  // ── meta ────────────────────────────────────────────────────────────────
  { id: 'pile-on', stream: 'timeline', weight: 0.8,
    triggers: ['blindside', 'betrayal', 'argument', 'eviction'],
    reads: ['popularity'],
    shapes: ['dunk', 'ratio-bait', 'pile-on-reply'] },

  { id: 'fandom-infighting', stream: 'timeline', weight: 0.4,
    triggers: ['episode-aired', 'eviction'],
    reads: ['popularity'],
    shapes: ['quote-dunk', 'subtweet'] },
];

/** The topics that could fire for this event, on this stream. */
export function topicsFor(eventKind, stream) {
  return TOPICS.filter(t =>
    t.triggers.includes(eventKind) && (t.stream === stream || t.stream === 'both'));
}
