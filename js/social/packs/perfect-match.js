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
import { VILLA_PHRASINGS, VILLA_CHAT_TAKES } from './perfect-match-villa-words.js';
import { feedScenes } from '../../pm/feed-scenes.js';

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
  // ── the villa itself, between the ceremonies (js/pm/feed-scenes.js) ──
  'row':             { label: 'Fight', volume: 0.9, at: 0.35, implies: ['argument'] },
  'jealous':         { label: 'Jealousy', volume: 0.8, at: 0.38, implies: ['argument'] },
  'gossip':          { label: 'Gossip', volume: 0.7, at: 0.42 },
  'had-it-out':      { label: 'Had it out', volume: 1.1, at: 0.45, implies: ['argument'] },
  'called-off':      { label: 'Called it off', volume: 1.9, at: 0.47, implies: ['showmance-broken'] },
  'first-kiss':      { label: 'First kiss', volume: 1.0, at: 0.5, implies: ['romantic-spark'] },
  'blowup':          { label: 'Villa blow-up', volume: 1.7, at: 0.52, implies: ['argument'] },
  'movie-night':     { label: 'Movie Night', volume: 1.8, at: 0.6, implies: ['argument'] },
  'love-said':       { label: 'I love you', volume: 1.3, at: 0.62, implies: ['romantic-spark'] },
  'tears':           { label: 'Tears', volume: 0.8, at: 0.4 },
  'back-together':   { label: 'Back together', volume: 1.3, at: 0.65, implies: ['romantic-spark'] },
  // the storylines (js/pm/threads.js): what most of an episode is now
  'grafting':        { label: 'Grafting', volume: 1.1, at: 0.37, implies: ['twist'] },
  'head-turned':     { label: 'Head turned', volume: 1.6, at: 0.5, implies: ['betrayal'] },
  'shut-down':       { label: 'Shut down', volume: 1.0, at: 0.44 },
  'cracks':          { label: 'Cracks', volume: 1.2, at: 0.46, implies: ['argument'] },
};

/* ── A NIGHT'S DRAMA, CHOSEN ─────────────────────────────────────────────
   A season airs fifty rows, thirty tellings and dozens of kisses; a timeline
   that reacted to every one would be the same few posts on a loop. Each kind
   has a cap, a couple is talked about once a night (its biggest moment), and
   the night keeps the loudest few — `fame` is how hard the scene aired. */
const DRAMA_CAP = { 'called-off': 2, blowup: 1, 'movie-night': 2, 'had-it-out': 2, 'made-official': 2,
  'love-said': 1, 'back-together': 1, 'first-kiss': 2, jealous: 1, tears: 1, row: 1, gossip: 1,
  'head-turned': 1, cracks: 1, grafting: 1, 'shut-down': 1 };
const DRAMA_RANK = { 'called-off': 6, blowup: 5, 'movie-night': 5, 'head-turned': 5, 'had-it-out': 4, 'made-official': 4,
  'love-said': 4, 'back-together': 4, cracks: 3, 'first-kiss': 3, grafting: 2, 'shut-down': 2, jealous: 2, tears: 2, row: 1, gossip: 1 };
const DRAMA_PER_NIGHT = 7;

/** The moments of one night the timeline reacts to, in airing order. */
export function nightDrama(scenes = []) {
  const ranked = scenes.map((x, i) => ({ ...x, i }))
    .filter(x => DRAMA_CAP[x.feed])
    .sort((a, b) => DRAMA_RANK[b.feed] - DRAMA_RANK[a.feed] || b.fame - a.fame || a.i - b.i);
  const taken = [], pairs = new Set(), per = {};
  for (const x of ranked) {
    const pair = x.players.slice(0, 2).sort().join('|');
    if (pairs.has(pair) || (per[x.feed] || 0) >= DRAMA_CAP[x.feed]) continue;
    // A couple going official is always news; everything else fights for room.
    if (taken.length >= DRAMA_PER_NIGHT && x.feed !== 'made-official') continue;
    pairs.add(pair); per[x.feed] = (per[x.feed] || 0) + 1; taken.push(x);
  }
  return taken.sort((a, b) => a.i - b.i);
}

const ROW_ABOUT = { 'casa-row': ' about Casa Amor', 'photo-row': ' over the photos', 'lie-row': ' after the lie detector',
  'snogger-row': ' after the kissing challenge', 'couple-goals-row': ' after the couples challenge',
  'visit-confront': ' in front of the families' };

/** Who a moment is about, who else, and the one fact that makes it this night's. */
function dramaEvent(x) {
  const [a, b, c] = x.players;
  switch (x.feed) {
    case 'row': return { subject: a, actor: b, receipt: x.kind === 'stirrer-confront'
      ? `${a} went after ${b} for telling ${c} everything` : `${a} and ${b} had a fight${ROW_ABOUT[x.kind] || ''}` };
    case 'jealous': return { subject: a, actor: b, receipt: c ? `${a} had a go at ${b} about ${c}` : `${a} had a go at ${b}` };
    case 'blowup': return { subject: a, actor: b, receipt: `${a} and ${b} split the whole villa` };
    case 'gossip': return { subject: a, actor: b, receipt: c ? `${a} told ${b} what ${c} has been up to` : `${a} told ${b} everything` };
    case 'had-it-out': return { subject: a, actor: b, receipt: x.verdict === 'forgive'
      ? `${a} had it out with ${b} and let it go` : `${a} had it out with ${b} and gave them one last chance` };
    case 'called-off': return { subject: a, actor: b, receipt: `${a} ended it with ${b}` };
    case 'grafting': return { subject: a, actor: b, receipt: `${a} pulled ${b} for a chat, and ${b} is coupled up` };
    case 'head-turned': return { subject: a, actor: b, receipt: c ? `${a} told ${b} their head has been turned by ${c}` : `${a} told ${b} their head has been turned` };
    case 'shut-down': return { subject: a, actor: b, receipt: `${a} told ${b} to back off` };
    case 'cracks': return x.kind === 'tower-q'
      ? { subject: a, actor: b, receipt: c ? `asked who they would go for, ${a} said ${c}, with ${b} sitting right there` : `${a} gave ${b} an answer at the tower nobody wanted` }
      : { subject: b, actor: a, receipt: x.of === 'deflect' ? `${b} could not give ${a} a straight answer about where their head is at`
        : `${b} told ${a} their head is not all the way in it` };
    case 'first-kiss': return { subject: a, actor: b, receipt: `${a} and ${b} kissed for the first time` };
    case 'movie-night': {
      const partner = (x.audience || []).find(n => n !== a) || null;
      return { subject: a, actor: partner, receipt: partner
        ? `the clip of ${a} with ${b} played at Movie Night in front of ${partner}`
        : `the clip of ${a} with ${b} played at Movie Night` };
    }
    case 'love-said': return { subject: a, actor: b, receipt: `${a} told ${b} "I love you"` };
    case 'tears': return { subject: a, receipt: `${a} broke down in the beach hut` };
    case 'back-together': return { subject: a, actor: b, receipt: `${a} and ${b} got back together` };
    case 'made-official': return { subject: a, actor: b,
      receipt: `${a} and ${b} made it ${x.kind === 'official-ask' ? 'official' : 'exclusive'}` };
    default: return null;
  }
}

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
  // The villa between the ceremonies. Birdie only: the alumni room has takes.
  // Weighted well above the fandom topics every night carries (the edit,
  // shipping, the pile-on), or a row is three posts in fifty about the row.
  { id: 'row-talk', stream: 'timeline', weight: 7,
    triggers: ['row'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'defence'] },
  { id: 'jealousy-talk', stream: 'timeline', weight: 7,
    triggers: ['jealous'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'blowup-talk', stream: 'timeline', weight: 9,
    triggers: ['blowup'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'call-out'] },
  { id: 'stirring-talk', stream: 'timeline', weight: 8,
    triggers: ['gossip'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'defence'] },
  { id: 'confront-talk', stream: 'timeline', weight: 8,
    triggers: ['had-it-out'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'complaint'] },
  { id: 'called-off-talk', stream: 'timeline', weight: 10,
    triggers: ['called-off'], reads: ['scenes'], shapes: ['live-reaction', 'sympathy', 'gloating'] },
  { id: 'first-kiss-talk', stream: 'timeline', weight: 8,
    triggers: ['first-kiss'], reads: ['scenes'], shapes: ['gushing', 'ship', 'hot-take'] },
  { id: 'movie-night-talk', stream: 'timeline', weight: 10,
    triggers: ['movie-night'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'call-out'] },
  { id: 'love-talk', stream: 'timeline', weight: 8,
    triggers: ['love-said'], reads: ['scenes'], shapes: ['gushing', 'hot-take'] },
  { id: 'tears-talk', stream: 'timeline', weight: 7,
    triggers: ['tears'], reads: ['scenes'], shapes: ['sympathy', 'live-reaction'] },
  { id: 'reunite-talk', stream: 'timeline', weight: 8,
    triggers: ['back-together'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'gushing'] },
  // The storylines: a graft, a turned head, a shut-down, the cracks.
  { id: 'graft-talk', stream: 'timeline', weight: 7,
    triggers: ['grafting'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'defence'] },
  { id: 'head-turned-talk', stream: 'timeline', weight: 10,
    triggers: ['head-turned'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'call-out'] },
  { id: 'shut-down-talk', stream: 'timeline', weight: 7,
    triggers: ['shut-down'], reads: ['scenes'], shapes: ['live-reaction', 'gushing', 'hot-take'] },
  { id: 'cracks-talk', stream: 'timeline', weight: 8,
    triggers: ['cracks'], reads: ['scenes'], shapes: ['live-reaction', 'hot-take', 'sympathy'] },
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
  'row-talk': { target: 'subject', stance: -0.1 },
  'jealousy-talk': { target: 'subject', stance: -0.1 },
  'blowup-talk': { target: 'subject', stance: -0.3 },
  'stirring-talk': { target: 'subject', stance: -0.2 },
  'confront-talk': { target: 'subject', stance: 0.4 },
  'called-off-talk': { target: 'subject', stance: 0.5 },
  'first-kiss-talk': { target: 'subject', stance: 0.6 },
  'movie-night-talk': { target: 'subject', stance: -0.5 },
  'love-talk': { target: 'subject', stance: 0.6 },
  'tears-talk': { target: 'subject', stance: 0.7 },
  'reunite-talk': { target: 'subject', stance: 0.3 },
  'graft-talk': { target: 'subject', stance: -0.2 },
  'head-turned-talk': { target: 'subject', stance: -0.5 },
  'shut-down-talk': { target: 'subject', stance: 0.6 },
  'cracks-talk': { target: 'subject', stance: -0.2 },
  // Aimed at the producers, not an islander.
  'villa-edit': { target: 'none', stance: -0.2 },
};

/** Which kind of fan reaches for which topic. 1 is indifferent. */
const ARCHETYPE_PULL = {
  analyst: { 'public-vote-talk': 1.5, 'villa-edit': 1.3, 'winners-verdict': 1.2, 'confront-talk': 1.2 },
  stan: { 'dumping-reaction': 1.4, 'public-vote-talk': 1.3, 'tears-talk': 1.4, 'called-off-talk': 1.3 },
  hater: { 'steal-reaction': 1.4, 'villa-edit': 1.3, 'movie-night-talk': 1.4, 'stirring-talk': 1.3 },
  livefeeder: { 'bombshell-watch': 1.4, 'challenge-talk': 1.3, 'row-talk': 1.4, 'blowup-talk': 1.3 },
  chaos: { 'casa-verdict': 1.5, 'steal-reaction': 1.3, 'envelope-talk': 1.3, 'blowup-talk': 1.5,
    'movie-night-talk': 1.4, 'jealousy-talk': 1.3 },
  casual: { 'winners-verdict': 1.2, 'challenge-talk': 1.2, 'first-kiss-talk': 1.2 },
  shipper: { 'couple-watch': 1.8, 'casa-verdict': 1.3, 'first-kiss-talk': 1.8, 'love-talk': 1.7, 'reunite-talk': 1.5,
    'shut-down-talk': 1.4, 'cracks-talk': 1.3 },
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

  // ── the villa's own drama, and the ladder's yes: the same scenes either way ──
  for (const x of nightDrama(pm ? feedScenes(pm.events || []) : (record.scenes || []))) {
    const d = dramaEvent(x);
    if (d) out.push(make(x.feed, { ...d, jitter: jitter() }));
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
  phrasings: { ...PHRASINGS, ...VILLA_PHRASINGS },
  topicAim: TOPIC_AIM,
  archetypePull: ARCHETYPE_PULL,
  personas: PERSONAS,
  hostTakes: HOST_TAKES,
  chatTakes: { ...CHAT_TAKES, ...VILLA_CHAT_TAKES },
};
