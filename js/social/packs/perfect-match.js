// js/social/packs/perfect-match.js
// Perfect Match, as its fandom talks about it.
//
// THE PUBLIC VOTES ON THIS SHOW, AND THE ISLANDERS DO NOT. Nobody here is
// nominated, put on the block or voted out by a tribe: couples are dumped
// from the island, singles are left standing at a recoupling, and the
// country decides who wins. What its fans argue about is who is with whom —
// the bombshell who walked in, the steal, the stick or twist at Casa Amor,
// the couple the public put in the bottom, and the couple who won.
//
// ONE READER, TWO SHAPES. A played row carries `pm` (the scenes, the couples,
// the public's shares); a published round carries the same facts flattened
// (js/pm/export.js `pmVotingHistory`): `exits`, `steals`, `bottom`, `votes`
// on channels, `returned`, `challenge`. Both arrive at `events`, and the
// season-level facts — the winning couple, the envelope — come through
// `context()`.
import { PERFECT_MATCH_FORMAT } from '../../shows.js';
import { PHRASINGS, CHAT_TAKES, PERSONAS } from './perfect-match-words.js';
import { HOST_TAKES } from './perfect-match-voices.js';

const slugOf = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** The moments this show produces, in the order an episode airs them. */
const KINDS = {
  'villa-challenge': { label: 'Villa challenge', volume: 0.8, at: 0.3 },
  'made-official':   { label: 'Made it official', volume: 1.2, at: 0.4, implies: ['showmance-formed'] },
  'bombshell':       { label: 'Bombshell', volume: 1.6, at: 0.55, implies: ['twist'] },
  'returned':        { label: 'Back in the villa', volume: 1.6, at: 0.55, implies: ['twist'] },
  'casa-stick':      { label: 'Stuck', volume: 1.2, at: 0.7 },
  'casa-twist':      { label: 'Twisted', volume: 2.0, at: 0.72, implies: ['betrayal'] },
  'steal':           { label: 'Steal', volume: 1.8, at: 0.75, implies: ['betrayal'] },
  'bottom-couples':  { label: 'Bottom couples', volume: 1.3, at: 0.8 },
  'dumped':          { label: 'Dumped', volume: 2.0, at: 0.9, implies: ['eviction'] },
  'walked':          { label: 'Walked', volume: 1.8, at: 0.9 },
  'envelope':        { label: 'The envelope', volume: 1.5, at: 0.97 },
};

/** What this fandom argues about. Words in perfect-match-words.js. */
const TOPICS = [
  { id: 'bombshell-watch', stream: 'both', weight: 1.2,
    triggers: ['bombshell'], reads: ['arrivals', 'couples'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'return-talk', stream: 'both', weight: 1.1,
    triggers: ['returned'], reads: ['returned', 'couples'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'steal-reaction', stream: 'both', weight: 1.3,
    triggers: ['steal'], reads: ['steals', 'couples'], shapes: ['live-reaction', 'complaint', 'defence'] },
  { id: 'dumping-reaction', stream: 'both', weight: 1.2,
    triggers: ['dumped', 'walked'], reads: ['exits'], shapes: ['live-reaction', 'sympathy', 'hot-take'] },
  { id: 'public-vote-talk', stream: 'both', weight: 1.0,
    triggers: ['bottom-couples'], reads: ['bottom', 'shares'], shapes: ['complaint', 'hot-take'] },
  { id: 'casa-verdict', stream: 'both', weight: 1.3,
    triggers: ['casa-twist', 'casa-stick'], reads: ['votes', 'couples'], shapes: ['live-reaction', 'complaint', 'gushing'] },
  { id: 'couple-watch', stream: 'both', weight: 0.9,
    // Only when a couple DID make it official: its lines say so. The shared
    // shipping topic covers every other night.
    triggers: ['made-official'], reads: ['couples'], shapes: ['gushing', 'hot-take'] },
  { id: 'challenge-talk', stream: 'timeline', weight: 0.6,
    triggers: ['villa-challenge'], reads: ['challenge'], shapes: ['live-reaction', 'dunk'] },
  { id: 'envelope-talk', stream: 'both', weight: 1.0,
    triggers: ['envelope'], reads: ['envelope'], shapes: ['live-reaction'] },
  { id: 'winners-verdict', stream: 'both', weight: 1.3,
    triggers: ['finale'], reads: ['finalVote', 'winners'], shapes: ['live-reaction', 'hot-take', 'complaint'] },
  { id: 'villa-edit', stream: 'both', weight: 0.8,
    triggers: ['episode-aired'], reads: ['couples', 'exits'], shapes: ['call-out', 'hot-take'] },
];

/** Who a topic is aimed at, and whether it is for or against them. */
const TOPIC_AIM = {
  'bombshell-watch': { target: 'subject', stance: 0.3 },
  'return-talk': { target: 'subject', stance: 0.2 },
  'steal-reaction': { target: 'subject', stance: -0.4 },
  'dumping-reaction': { target: 'subject', stance: 0.6 },
  'public-vote-talk': { target: 'subject', stance: 0.3 },
  'casa-verdict': { target: 'subject', stance: -0.2 },
  'couple-watch': { target: 'subject', stance: 0.7 },
  'challenge-talk': { target: 'subject', stance: 0.3 },
  'envelope-talk': { target: 'subject', stance: 0.4 },
  'winners-verdict': { target: 'subject', stance: 0.5 },
  // Aimed at the producers, not an islander.
  'villa-edit': { target: 'none', stance: -0.2 },
};

/** Which kind of fan reaches for which topic. 1 is indifferent. */
const ARCHETYPE_PULL = {
  analyst: { 'public-vote-talk': 1.5, 'villa-edit': 1.3, 'winners-verdict': 1.2 },
  stan: { 'dumping-reaction': 1.4, 'public-vote-talk': 1.3 },
  hater: { 'steal-reaction': 1.4, 'villa-edit': 1.3 },
  livefeeder: { 'bombshell-watch': 1.4, 'challenge-talk': 1.3 },
  chaos: { 'casa-verdict': 1.5, 'steal-reaction': 1.3, 'envelope-talk': 1.3 },
  casual: { 'winners-verdict': 1.2, 'challenge-talk': 1.2 },
  shipper: { 'couple-watch': 1.8, 'casa-verdict': 1.3 },
};

/** The episodes a season being played has aired. */
function records(gs) {
  return (gs?.episodeHistory || [])
    .filter(r => r && r.pm)
    .map(record => ({ record, episode: Number(record.num) }))
    .filter(r => Number.isFinite(r.episode));
}

/** The winning couple and the envelope, from `gs` or a published document. */
function context(source) {
  const winners = Array.isArray(source?.winners) && source.winners.length
    ? source.winners.map(w => w?.name || w).filter(Boolean)
    : (Array.isArray(source?.pmWinners) ? [...source.pmWinners] : []);
  return { winners, envelope: source?.envelope || null };
}

const pair = c => (Array.isArray(c) ? c : [c]).filter(Boolean);

/** One night, as events. `make` is handed in by js/social/events.js. */
function events(record, meta, { make, ctx = context(null) } = {}) {
  if (!record || typeof make !== 'function') return [];
  const out = [];
  let n = 0;
  const jitter = () => (n++ % 5) * 0.01;
  const pm = record.pm || null;
  const scenes = (pm?.events || []).filter(e => e.aired);
  const moment = record.moment || null;

  // ── the challenge ──
  const challenge = pm?.challenge || record.challenge?.id || null;
  if (challenge) out.push(make('villa-challenge', { jitter: jitter(),
    receipt: record.challenge?.name ? `the challenge was ${record.challenge.name}` : null }));

  // ── made it official (the ladder's yes) ──
  for (const e of scenes.filter(x => x.kind === 'exclusive-ask' || x.kind === 'official-ask')) {
    out.push(make('made-official', { subject: e.players[0], actor: e.players[1], jitter: jitter(),
      receipt: `${e.players[0]} and ${e.players[1]} made it ${e.kind === 'official-ask' ? 'official' : 'exclusive'}` }));
  }

  // ── arrivals: a bombshell's entrance, never night one's line-up ──
  const arrived = pm ? scenes.filter(e => e.kind === 'entrance' || e.kind === 'group-entrance').flatMap(e => e.players)
    : record.arrivals || [];
  const returned = pm?.returned || record.returned || null;
  for (const name of [...new Set(arrived)].filter(x => x !== returned)) {
    out.push(make('bombshell', { subject: name, jitter: jitter(), receipt: `${name} walked into the villa` }));
  }
  if (returned) out.push(make('returned', { subject: returned, jitter: jitter(), receipt: `${returned} came back into the villa` }));

  // ── Casa Amor: stick or twist ──
  const casa = pm ? scenes.filter(e => e.kind === 'casa-return').map(e => ({ voter: e.players[0], choice: e.extra?.choice, with: e.players[1] }))
    : (record.votes || []).filter(v => v.channel === 'casa').map(v => ({ voter: v.voter, choice: v.choice, with: v.target }));
  for (const c of casa) {
    if (c.choice === 'twist') out.push(make('casa-twist', { subject: c.voter, actor: c.with, jitter: jitter(), receipt: `${c.voter} twisted at Casa Amor` }));
    else if (c.choice === 'stick') out.push(make('casa-stick', { subject: c.voter, jitter: jitter(), receipt: `${c.voter} stuck` }));
  }

  // ── the steal ──
  const steals = pm ? scenes.filter(e => e.kind === 'steal' || (e.kind === 'recouple-pick' && e.extra?.stole))
    .map(e => ({ by: e.players[0], took: e.players[1], from: e.kind === 'steal' ? e.players[2] : e.extra.stole }))
    : (record.steals || []);
  for (const s of steals) {
    out.push(make('steal', { subject: s.by, actor: s.from, jitter: jitter(), receipt: `${s.by} stole ${s.took} from ${s.from}` }));
  }

  // ── the public's bottom ──
  for (const c of (pm?.bottom || record.bottom || []).map(pair).filter(x => x.length)) {
    out.push(make('bottom-couples', { subject: c[0], actor: c[1] || null, jitter: jitter(),
      receipt: c.length > 1 ? `${c[0]} and ${c[1]} were in the bottom` : `${c[0]} was in the bottom` }));
  }

  // ── who left, and by which door ──
  for (const x of (record.exits || []).filter(e => e && e.name)) {
    const walked = x.channel === 'walk' || /walk/.test(x.verb || '');
    out.push(make(walked ? 'walked' : 'dumped', { subject: x.name, jitter: jitter(),
      receipt: `${x.name} ${x.verb || (walked ? 'walked' : 'was dumped')}` }));
  }

  // ── the final ──
  if (moment === 'final' || record.isFinale) {
    const shares = pm?.shares || record.shares || [];
    const top = [...shares].sort((a, b) => b.share - a.share)[0]?.couple || ctx.winners;
    const fin = make('finale', { subject: top?.[0] || null, actor: top?.[1] || null,
      receipt: top?.length ? `${top.join(' and ')} won` : null });
    fin.subjects = (top || []).map(slugOf);
    // The public decided it: no jury, and no final challenge.
    fin.decidedBy = 'public';
    out.push(fin);
    const env = pm?.envelope || ctx.envelope;
    if (env?.holder) out.push(make('envelope', { subject: env.holder, jitter: jitter(),
      receipt: `${env.holder} chose to ${env.choice === 'steal' ? 'steal' : 'split'}` }));
  }
  return out;
}

export default {
  format: PERFECT_MATCH_FORMAT,
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
