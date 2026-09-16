// js/social/packs/drag-race.js
// Drag Race, as its fandom talks about it.
//
// THERE IS NO VOTE ON THIS SHOW. A panel ranks the week and the host decides
// alone, so nothing here is a ballot, a nomination or an eviction — the shared
// library's game topics are all three, which is why this show needs a pack and
// not a thesaurus.
//
// THE CHART HAS SIX RESULTS AND BTM2 IS NOT LOW. `BTM2` lip synced and
// survived; `LOW` was in the bottom and NOT up for elimination, which covers
// the queen just above the bottom two and the queen named in a bottom three
// and saved on the stage. Collapsing the two writes a lip sync that never
// happened — the repo's own rule, and it has shipped twice. So `bottom-two` is
// drawn from the lip sync itself wherever there is one, never from a placement.
//
// ONE READER, TWO SHAPES. A played row carries `dr.call` (the panel's own four
// lists) and `dr.lipsync`; a published episode carries `placements[].result`
// and a flattened `lipsync`. Both arrive at `events`, and the season-level
// facts neither puts on the row — Miss Congeniality, who took the crown —
// come through `context()`.
import { DRAG_FORMAT } from '../../shows.js';
import { PHRASINGS, CHAT_TAKES, PERSONAS } from './drag-race-words.js';
import { HOST_TAKES } from './drag-race-voices.js';

const slugOf = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * The moments this show produces.
 *
 * `at` walks the episode: the mini early, the maxi and the runway in the
 * middle, the critiques after them, the lip sync and the exit at the end.
 */
const KINDS = {
  'mini-win':        { label: 'Mini win', volume: 0.8, at: 0.18 },
  'runway-category': { label: 'Runway', volume: 0.7, at: 0.45 },
  'maxi-win':        { label: 'Maxi win', volume: 1.8, at: 0.5, implies: ['comp-win'] },
  'high-praise':     { label: 'High', volume: 0.8, at: 0.55 },
  'low-placement':   { label: 'Low', volume: 1.0, at: 0.58 },
  'bottom-two':      { label: 'Bottom two', volume: 1.6, at: 0.7 },
  'lipsync-win':     { label: 'Lip sync', volume: 1.6, at: 0.85 },
  'sashay':          { label: 'Sashay', volume: 2.2, at: 0.9, implies: ['eviction'] },
  'double-shantay':  { label: 'Double shantay', volume: 1.8, at: 0.9 },
  'congeniality':    { label: 'Miss Congeniality', volume: 1.0, at: 0.97 },
};

/** What this fandom argues about. Words in drag-race-words.js. */
const TOPICS = [
  { id: 'maxi-reaction', stream: 'both', weight: 1.1,
    triggers: ['maxi-win'], reads: ['call', 'challenge'],
    shapes: ['live-reaction', 'hot-take', 'stat-drop'] },
  { id: 'robbed-watch', stream: 'both', weight: 1.2,
    triggers: ['high-praise', 'low-placement', 'bottom-two'], reads: ['call', 'panelRank'],
    shapes: ['complaint', 'hot-take', 'defence'] },
  { id: 'critique-court', stream: 'both', weight: 0.9,
    triggers: ['low-placement', 'high-praise', 'episode-aired'], reads: ['critiques', 'judges'],
    shapes: ['hot-take', 'quote-dunk', 'thread-opener'] },
  { id: 'lipsync-reaction', stream: 'both', weight: 1.1,
    triggers: ['lipsync-win'], reads: ['lipsync'],
    shapes: ['live-reaction', 'gloating', 'respect'] },
  { id: 'sashay-reaction', stream: 'both', weight: 1.2,
    triggers: ['sashay'], reads: ['exits'],
    shapes: ['live-reaction', 'sympathy', 'hot-take'] },
  { id: 'double-shantay-talk', stream: 'both', weight: 1.0,
    triggers: ['double-shantay'], reads: ['lipsync'],
    shapes: ['live-reaction', 'complaint'] },
  { id: 'runway-talk', stream: 'both', weight: 0.8,
    triggers: ['runway-category', 'episode-aired'], reads: ['runway'],
    shapes: ['gushing', 'dunk', 'hot-take'] },
  { id: 'mini-talk', stream: 'timeline', weight: 0.6,
    triggers: ['mini-win'], reads: ['mini'],
    shapes: ['live-reaction', 'dunk'] },
  { id: 'edit-watch', stream: 'both', weight: 0.8,
    triggers: ['episode-aired', 'maxi-win', 'high-praise'], reads: ['storylines', 'call'],
    shapes: ['call-out', 'hot-take'] },
  { id: 'track-record', stream: 'both', weight: 0.7,
    triggers: ['maxi-win', 'sashay', 'episode-aired'], reads: ['record', 'call'],
    shapes: ['stat-drop', 'hot-take', 'dunk'] },
  { id: 'crown-verdict', stream: 'both', weight: 1.3,
    triggers: ['finale'], reads: ['finale', 'winners'],
    shapes: ['live-reaction', 'hot-take', 'complaint'] },
  { id: 'congeniality-talk', stream: 'timeline', weight: 0.6,
    triggers: ['congeniality'], reads: ['congeniality'],
    shapes: ['gushing', 'dunk'] },
];

/** Who a topic is aimed at, and whether it is for or against them. */
const TOPIC_AIM = {
  'maxi-reaction': { target: 'subject', stance: 0.5 },
  'robbed-watch': { target: 'subject', stance: 0.7 },
  // Aimed at the panel, not at a queen — the same way production-critique is.
  'critique-court': { target: 'none', stance: -0.3 },
  'lipsync-reaction': { target: 'subject', stance: 0.6 },
  'sashay-reaction': { target: 'subject', stance: 0.7 },
  'double-shantay-talk': { target: 'none', stance: 0 },
  'runway-talk': { target: 'subject', stance: 0.4 },
  'mini-talk': { target: 'subject', stance: 0.3 },
  'edit-watch': { target: 'subject', stance: -0.2 },
  'track-record': { target: 'subject', stance: 0.1 },
  'crown-verdict': { target: 'subject', stance: 0.5 },
  'congeniality-talk': { target: 'subject', stance: 0.8 },
};

/** Which kind of fan reaches for which topic. 1 is indifferent. */
const ARCHETYPE_PULL = {
  analyst: { 'track-record': 1.5, 'critique-court': 1.4, 'edit-watch': 1.3 },
  stan: { 'robbed-watch': 1.6, 'congeniality-talk': 1.3 },
  hater: { 'critique-court': 1.3, 'edit-watch': 1.3 },
  livefeeder: { 'runway-talk': 1.2, 'mini-talk': 1.3 },
  chaos: { 'double-shantay-talk': 1.4, 'lipsync-reaction': 1.3 },
  casual: { 'crown-verdict': 1.2, 'runway-talk': 1.2 },
  shipper: {},
};

/** The episodes a season being played has aired. */
function records(gs) {
  return (gs?.episodeHistory || [])
    .filter(r => r && r.dr)
    .map(record => ({ record, episode: Number(record.dr.ep ?? record.num) }))
    .filter(r => Number.isFinite(r.episode));
}

/**
 * The season-level facts a single episode does not carry.
 *
 * `source` is `gs` (its `dr` block) or a published document: the sash, and who
 * ended up wearing the crown.
 */
function context(source) {
  const s = source && source.dr && typeof source.dr === 'object' && !Array.isArray(source.dr)
    ? source.dr : (source || {});
  const winners = Array.isArray(source?.winners) && source.winners.length
    ? source.winners.map(w => w?.name || w).filter(Boolean)
    : (source?.winner?.name ? [source.winner.name] : []);
  return {
    congeniality: s.congeniality || source?.congeniality || null,
    finale: s.finale || source?.finale || null,
    winners,
  };
}

/** The four lists the night was called in, from either shape. */
function callOf(record) {
  const raw = record.dr?.call;
  if (raw) {
    return {
      win: [...(raw.win || [])],
      high: [...(raw.high || [])],
      // A bottom THREE names `atRisk` as well, and both are LOW on the chart:
      // in the bottom, and not up for elimination.
      low: [...(raw.low || []), ...(raw.atRisk || [])],
      bottom: [...(raw.bottom || [])],
    };
  }
  const out = { win: [], high: [], low: [], bottom: [] };
  for (const p of record.placements || []) {
    if (p.result === 'WIN') out.win.push(p.name);
    else if (p.result === 'HIGH') out.high.push(p.name);
    else if (p.result === 'LOW') out.low.push(p.name);
    else if (p.result === 'BTM2') out.bottom.push(p.name);
  }
  return out;
}

/** One night, as events. `make` is handed in by js/social/events.js. */
function events(record, meta, { make, ctx = context(null) } = {}) {
  if (!record || typeof make !== 'function') return [];
  const out = [];
  let n = 0;
  const jitter = () => (n++ % 5) * 0.01;
  const dr = record.dr || {};
  const call = callOf(record);
  const challenge = dr.challenge || record.challenge || null;
  const mini = dr.mini || record.mini || null;
  const lipsync = dr.lipsync || record.lipsync || null;
  const category = dr.runway?.category || record.runwayCategory || null;
  const exits = (record.exits || []).filter(x => x && x.name);

  if (mini?.winner) {
    out.push(make('mini-win', { subject: mini.winner, jitter: jitter(),
      receipt: mini.name ? `won ${mini.name}` : null }));
  }
  if (category) {
    out.push(make('runway-category', { jitter: jitter(), receipt: `the category was ${category}` }));
  }
  for (const name of call.win) {
    out.push(make('maxi-win', { subject: name, jitter: jitter(),
      receipt: challenge?.name ? `won ${challenge.name}` : null }));
  }
  for (const name of call.high) out.push(make('high-praise', { subject: name, jitter: jitter() }));
  for (const name of call.low) out.push(make('low-placement', { subject: name, jitter: jitter() }));

  /* THE BOTTOM TWO IS BOTH HALVES OF THE SAME FACT, and neither source holds
     both. The queen who goes home is ELIM on the chart and never appears in
     the `bottom` list, so the list alone drops her; and a night whose singers
     were picked some other way — a bracket, a three-way — leaves a named BTM2
     queen out of the line-up. So: everybody the panel named in the bottom,
     plus everybody who sang, MINUS anyone the night placed elsewhere. A LOW
     queen who sang in a three-way is still LOW: she was in the bottom and not
     up for elimination, and saying she lip synced for her life is the
     collapse this show's chart rule exists to stop. */
  const placedElsewhere = new Set([...call.win, ...call.high, ...call.low]);
  const pair = [...new Set([...call.bottom, ...(lipsync?.queens || [])])]
    .filter(name => !placedElsewhere.has(name));
  for (const name of pair) out.push(make('bottom-two', { subject: name, jitter: jitter() }));

  if (lipsync?.winner) {
    out.push(make('lipsync-win', { subject: lipsync.winner, jitter: jitter(),
      receipt: lipsync.song ? `won the lip sync to "${lipsync.song}"` : null }));
  }
  for (const x of exits) {
    out.push(make('sashay', { subject: x.name, jitter: jitter(),
      receipt: `${x.name} ${x.verb || 'sashayed away'}` }));
  }
  // Nobody went home: the pair sang and the host kept them both.
  if (lipsync && !exits.length && (lipsync.call === 'double-shantay' || !lipsync.loser)) {
    out.push(make('double-shantay', { jitter: jitter(), receipt: 'the host saved them both' }));
  }

  // ── the last night ──
  const finale = dr.finale || null;
  const crowned = (record.placements || []).some(p => p.result === 'WINNER');
  if (finale || crowned) {
    const takers = (finale?.winners || []).filter(Boolean).length
      ? [...finale.winners]
      : (ctx.winners.length ? ctx.winners
        : (record.placements || []).filter(p => p.result === 'WINNER').map(p => p.name));
    const fin = make('finale', { subject: takers.length === 1 ? takers[0] : null,
      receipt: takers.length > 1 ? 'two queens took the crown' : null });
    fin.subjects = takers.map(slugOf);
    /* NEITHER A JURY NOR A FINAL CHALLENGE. `contradictsEvent` in feed.js
       licenses a claim only where the night's own record names that mechanic,
       so a value that is neither refuses both families — which is right here:
       nobody voted, and the crown is not won in a challenge. */
    fin.decidedBy = 'stage';
    out.push(fin);
    if (ctx.congeniality) {
      out.push(make('congeniality', { subject: ctx.congeniality, jitter: jitter(),
        receipt: `${ctx.congeniality} took Miss Congeniality` }));
    }
  }
  return out;
}

export default {
  format: DRAG_FORMAT,
  kinds: KINDS,
  records,
  context,
  events,
  topics: TOPICS,
  phrasings: PHRASINGS,
  topicAim: TOPIC_AIM,
  archetypePull: ARCHETYPE_PULL,
  personas: PERSONAS,
  hostTakes: HOST_TAKES,
  chatTakes: CHAT_TAKES,
};
