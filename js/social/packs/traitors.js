// js/social/packs/traitors.js
// The Traitors, as its fandom talks about it.
//
// THE AUDIENCE KNOWS WHO THE TRAITORS ARE. They were shown the turret on night
// one, so every fan in this feed knows too, and the events here carry roles:
// "the table banished a Faithful, and a Traitor voted with them" is a fact a
// post may state. Nothing in the feed is ever read back by the game, so this is
// the audience's knowledge and never the castle's — the same argument
// js/tr/crowd.js makes for writing popularity off ground truth.
//
// ONE READER, TWO SHAPES. A played episode row (`gs.episodeHistory`, carrying a
// `tr` block) and a published `votingHistory` row both arrive at `events`. The
// facts only one of them has on the row — who wore the cloak that night, which
// mission and which relics fell on it — come through `context()`, built from
// `gs.tr` on a season being played and from the published document on a
// finished one.
//
// The words live in traitors-words.js and traitors-voices.js. This file is the
// part that knows what happened.
import { TRAITORS_FORMAT, SHOWS } from '../../shows.js';
import { PHRASINGS, CHAT_TAKES, PERSONAS } from './traitors-words.js';
import { HOST_TAKES } from './traitors-voices.js';

const slugOf = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/**
 * The moments this show produces.
 *
 * `at` is where in the episode it lands (the afternoon's mission early, the
 * Round Table late, the night at the very end, because a night runs after the
 * episode it belongs to). `volume` scales how many posts it draws. `implies`
 * names the shared kinds the fandom topics listen for, so a banishment still
 * reaches the pile-on and the roast without being emitted twice.
 */
const KINDS = {
  'mission-won':        { label: 'Mission', volume: 0.9, at: 0.22 },
  'shield-won':         { label: 'Shield won', volume: 1.0, at: 0.3 },
  'accused':            { label: 'Accused', volume: 1.0, at: 0.7 },
  'dagger-drawn':       { label: 'Dagger', volume: 1.2, at: 0.74 },
  'faithful-banished':  { label: 'Faithful banished', volume: 2.6, at: 0.82, implies: ['eviction'] },
  'traitor-caught':     { label: 'Traitor unmasked', volume: 2.8, at: 0.82, implies: ['eviction'] },
  'traitor-sacrificed': { label: 'Traitor on Traitor', volume: 2.0, at: 0.83 },
  'recruited':          { label: 'Recruitment', volume: 1.8, at: 0.9 },
  'murder':             { label: 'Murder', volume: 2.4, at: 0.93 },
  'murder-blocked':     { label: 'Shield held', volume: 1.6, at: 0.94 },
};

/* ── THE SHARED KINDS THIS SHOW ALSO EMITS ───────────────────────────
   The castle's day (see `events`) produces `kindness`, `argument` and
   `ganging-up` — the shared library's kinds, which therefore carry the shared
   library's ROOM TAKES: "a camp that never argues is a camp where somebody is
   being managed", said about a castle, fourteen times in four seasons.
   `chat.js` steps aside from the character, lens and general pools for any
   kind the pack speaks to, so speaking to these three is what keeps the other
   shows' words out of the alumni room on a night that is all day and no
   format. */
const DAY_TAKES = {
  kindness: [
    ({ s }) => `${s} did something decent today, and in here that is worth noticing out loud.`,
    ({ s }) => `Kindness in that castle is never only kindness. It is also a vote you might get later.`,
    () => `Somebody was gentle with somebody else today, and half that room clocked it as strategy.`,
    ({ s }) => `I would take ${s} at face value. Not everybody in there is playing every minute.`,
    () => `The small kindnesses are what people remember at the final table, for better and worse.`,
    () => `You need one person in there who is not working an angle. Today they had one.`,
    ({ s }) => `That will read as sincere to the room, and it probably was. Both can be true.`,
    () => `Being liked is protection in this game, and the ones who are liked honestly last longest.`,
  ],
  argument: [
    ({ s }) => `${s} lost patience today, and everybody in that room wrote it down.`,
    () => `An argument in there is never about the thing it is about.`,
    ({ s }) => `Snapping does not make ${s} a Traitor. It does make ${s} memorable at the wrong moment.`,
    () => `Tempers go at this stage. Too many people, not enough sleep, nobody telling the truth.`,
    () => `Honestly? Good. A castle where nobody argues is a castle where somebody is running the room.`,
    ({ s }) => `The room will read that as guilt. It is usually exhaustion.`,
    () => `The ones who keep their voice down are the ones I would be watching.`,
    ({ s }) => `That is the kind of flare-up that gets a name said at the table two days later.`,
  ],
  'ganging-up': [
    ({ s }) => `The room turned on ${s} today, and it did not need much to get going.`,
    () => `A pile-on tells you nothing about who is lying and everything about who is frightened.`,
    ({ s }) => `Once a room decides, defending yourself sounds like confessing. ${s} is finding that out.`,
    () => `Watch who started it and then went quiet. That is the one worth your attention.`,
    ({ s }) => `I have been the name everybody agreed on. You do not sleep much after that.`,
    () => `A castle that hunts as a pack is a castle doing the Traitors' work for them.`,
    () => `Nobody in that group is thinking. They are all just relieved it is not them.`,
    ({ s }) => `If ${s} survives tonight, that is the moment the season turns for somebody.`,
  ],
};

/** What each topic is about, and when it fires. Words in traitors-words.js. */
const TOPICS = [
  { id: 'murder-reaction', stream: 'both', weight: 1.1,
    triggers: ['murder'], reads: ['exits', 'roleHistory'],
    shapes: ['live-reaction', 'hot-take', 'sympathy'] },
  { id: 'wrong-read', stream: 'both', weight: 1.2,
    triggers: ['faithful-banished'], reads: ['exits', 'ballots', 'roleHistory'],
    shapes: ['live-reaction', 'hot-take', 'thread-opener'] },
  { id: 'traitor-hiding', stream: 'both', weight: 0.9,
    triggers: ['accused', 'faithful-banished', 'episode-aired'], reads: ['ballots', 'roleHistory'],
    shapes: ['call-out', 'live-reaction'] },
  { id: 'unmasked', stream: 'both', weight: 1.2,
    triggers: ['traitor-caught'], reads: ['exits', 'roleHistory'],
    shapes: ['live-reaction', 'gloating', 'respect'] },
  { id: 'cold-blooded', stream: 'both', weight: 1.1,
    triggers: ['traitor-sacrificed'], reads: ['ballots', 'roleHistory'],
    shapes: ['hot-take', 'live-reaction', 'grudging-respect'] },
  { id: 'recruitment-talk', stream: 'both', weight: 1.0,
    triggers: ['recruited'], reads: ['roleHistory', 'recruitment'],
    shapes: ['live-reaction', 'hot-take', 'prediction'] },
  { id: 'shield-talk', stream: 'both', weight: 0.8,
    triggers: ['murder-blocked', 'shield-won'], reads: ['shields'],
    shapes: ['live-reaction', 'hot-take'] },
  { id: 'dagger-talk', stream: 'timeline', weight: 0.8,
    triggers: ['dagger-drawn'], reads: ['daggers'],
    shapes: ['live-reaction', 'hot-take'] },
  { id: 'mission-pot', stream: 'both', weight: 0.6,
    triggers: ['mission-won'], reads: ['missions', 'pot'],
    shapes: ['hot-take', 'stat-drop', 'complaint'] },
  { id: 'traitor-rating', stream: 'both', weight: 0.7,
    triggers: ['accused', 'murder', 'episode-aired'], reads: ['roleHistory', 'ballots'],
    shapes: ['hot-take', 'grudging-respect', 'dunk'] },
  { id: 'endgame-verdict', stream: 'both', weight: 1.3,
    triggers: ['finale'], reads: ['endgame', 'pot'],
    shapes: ['live-reaction', 'hot-take', 'complaint'] },
  { id: 'accusation-defence', stream: 'both', weight: 0.8,
    triggers: ['accused'], reads: ['ballots'],
    shapes: ['defence', 'call-out'] },
];

/**
 * Who a topic is aimed at, and whether it is for or against them. Read the same
 * way as TOPIC_AIM in phrasings.js: `actor` topics are about the Traitor in the
 * story, `subject` topics about the person it happened to.
 */
const TOPIC_AIM = {
  'murder-reaction': { target: 'subject', stance: 0.6 },
  'wrong-read': { target: 'subject', stance: 0.7 },
  'traitor-hiding': { target: 'actor', stance: -0.6 },
  'unmasked': { target: 'subject', stance: -0.5 },
  'cold-blooded': { target: 'actor', stance: -0.2 },
  'recruitment-talk': { target: 'subject', stance: 0 },
  'shield-talk': { target: 'subject', stance: 0.3 },
  'dagger-talk': { target: 'subject', stance: 0 },
  'mission-pot': { target: 'none', stance: 0 },
  'traitor-rating': { target: 'actor', stance: 0.1 },
  'endgame-verdict': { target: 'subject', stance: 0.4 },
  'accusation-defence': { target: 'subject', stance: 0.8 },
};

/** Which kind of fan reaches for which topic. 1 is indifferent. */
const ARCHETYPE_PULL = {
  analyst: { 'traitor-rating': 1.5, 'wrong-read': 1.3, 'mission-pot': 1.2 },
  stan: { 'accusation-defence': 1.6, 'murder-reaction': 1.3 },
  hater: { 'traitor-hiding': 1.4, 'cold-blooded': 1.3 },
  livefeeder: { 'unmasked': 1.3, 'recruitment-talk': 1.2 },
  chaos: { 'cold-blooded': 1.5, 'dagger-talk': 1.4 },
  casual: { 'endgame-verdict': 1.2 },
  shipper: {},
};

/**
 * The episodes a season being played has AIRED.
 *
 * The registry points this show's rounds at `tr.rounds`, and the live feed used
 * to read those: the round records of a season `playTraitorsSeason` played to
 * the end in one call, so the feed could react to nights that had not aired,
 * and night one — which holds no Round Table and writes no round — had no feed
 * at all. The episode rows are what aired, one per night, including the first.
 */
function records(gs) {
  return (gs?.episodeHistory || [])
    .filter(r => r && r.tr)
    .map(record => ({ record, episode: Number(record.tr.ep ?? record.num) }))
    .filter(r => Number.isFinite(r.episode));
}

/**
 * The season-level facts a row does not carry, from either source.
 *
 * `source` is `gs` (its `tr` block is used) or a published document. Roles
 * follow js/tr/roles.js `alignmentAt`: an era counts from its own episode on.
 * With no role history at all — a document published before it was — `roleAt`
 * answers null and the reader falls back to the one reveal a row records.
 */
function context(source) {
  const s = source && source.tr && typeof source.tr === 'object' && !Array.isArray(source.tr)
    ? source.tr : (source || {});
  const flips = (s.roleHistory || []).filter(f => f && f.name)
    .slice().sort((a, b) => a.ep - b.ep);
  const onEp = (list, ep, key = 'ep') =>
    (list || []).filter(x => x && Number(x[key]) === Number(ep));
  return {
    roleAt(name, ep) {
      if (!flips.length) return null;
      let role = 'faithful';
      for (const f of flips) if (f.name === name && f.ep <= ep) role = f.to;
      return role;
    },
    missionAt: ep => onEp(s.missions, ep)[0] || null,
    shieldsWonAt: ep => onEp(s.shields, ep),
    shieldBlockAt: ep => onEp(s.shields, ep, 'playedEp').find(x => x.outcome === 'blocked') || null,
    daggersDrawnAt: ep => onEp(s.daggers, ep, 'playedEp').filter(d => d.outcome === 'played'),
    recruitsAt: ep => flips.filter(f => f.ep === ep && f.to === 'traitor'
      && (f.via === 'recruitment' || f.via === 'ultimatum')),
  };
}

/**
 * One night, as events.
 *
 * `make(kind, { subject, actor, receipt, jitter })` is handed in by
 * js/social/events.js so every event, from every show, is stamped by one
 * function.
 */
function events(record, meta, { make, ctx = context(null) } = {}) {
  if (!record || typeof make !== 'function') return [];
  const ep = Number(record.tr?.ep ?? record.episode ?? record.num ?? meta?.episode);
  const out = [];
  let n = 0;
  const jitter = () => (n++ % 5) * 0.01;
  const priv = SHOWS[TRAITORS_FORMAT].privateBallotChannels || [];
  const exits = (record.exits || []).filter(x => x && x.name);
  // The table's ballots only: the conclave's are on the same list, and a fan
  // knowing who the Traitors are is not a fan who sat in the turret.
  const ballots = (record.tr?.table?.votes || record.votes || [])
    .filter(v => v && v.voter && (v.target || v.voted) && !priv.includes(v.channel));
  const targetOf = v => v.target || v.voted;
  const roleOf = name => ctx.roleAt(name, ep);
  const traitorsVotingOut = name => ballots
    .filter(v => targetOf(v) === name && v.voter !== name && roleOf(v.voter) === 'traitor')
    .map(v => v.voter);

  // ── the afternoon ──
  const mission = record.tr?.mission || ctx.missionAt(ep);
  if (mission?.bestTeam) {
    const team = (mission.teams || []).find(t => t.name === mission.bestTeam);
    const members = team?.members || [];
    const who = members.length
      ? `${members.slice(0, 3).join(', ')}${members.length > 3 ? ' and the rest of their team' : ''}`
      : mission.bestTeam;
    const money = Number(mission.earned) || 0;
    out.push(make('mission-won', { jitter: jitter(),
      receipt: `${who} carried ${mission.name || 'the mission'}`
        + (money ? ` and put ${money.toLocaleString('en-US')} in the pot` : '') }));
  }
  for (const s of ctx.shieldsWonAt(ep)) {
    if (s.holder) out.push(make('shield-won', { subject: s.holder, jitter: jitter(),
      receipt: `${s.holder} came out of the mission with a Shield` }));
  }

  // ── the Round Table ──
  for (const d of ctx.daggersDrawnAt(ep)) {
    if (d.holder) out.push(make('dagger-drawn', { subject: d.holder, jitter: jitter(),
      receipt: d.target ? `${d.holder} drew the Dagger against ${d.target}` : `${d.holder} drew the Dagger` }));
  }
  const banished = exits.filter(x => x.channel === 'banishment');
  const gone = new Set(banished.map(x => x.name));
  const tally = new Map();
  for (const v of ballots) {
    if (v.channel && v.channel !== 'banishment') continue;
    tally.set(targetOf(v), (tally.get(targetOf(v)) || 0) + 1);
  }
  for (const [name, count] of tally) {
    if (gone.has(name) || count < 2) continue;
    out.push(make('accused', { subject: name, actor: traitorsVotingOut(name)[0] || null,
      jitter: jitter(), receipt: `${name} took ${count} votes at the Round Table and survived it` }));
  }
  for (const x of banished) {
    let role = roleOf(x.name);
    // No role history: only the mandated table's own reveal is known.
    if (role == null && !x.endgame && x.name === record.eliminated) {
      const shown = record.banishedWasTraitor ?? (record.tr?.table?.chosenAlignment
        ? record.tr.table.chosenAlignment === 'traitor' : null);
      role = shown == null ? null : (shown ? 'traitor' : 'faithful');
    }
    if (role == null) continue;
    const traitorVoters = traitorsVotingOut(x.name);
    if (role === 'traitor') {
      // The endgame reveals nothing, so nothing there is an unmasking.
      if (!x.endgame) {
        out.push(make('traitor-caught', { subject: x.name, jitter: jitter(),
          receipt: `${x.name} was a Traitor` }));
      }
      if (traitorVoters.length) {
        out.push(make('traitor-sacrificed', { subject: x.name, actor: traitorVoters[0],
          jitter: jitter(), receipt: `${traitorVoters[0]} voted out ${x.name}, a fellow Traitor` }));
      }
    } else {
      out.push(make('faithful-banished', { subject: x.name, actor: traitorVoters[0] || null,
        jitter: jitter(),
        receipt: `the table banished ${x.name}, a Faithful`
          + (traitorVoters.length ? `, with ${traitorVoters[0]} voting against them` : '') }));
    }
  }

  // ── the night ──
  const rec = record.tr?.recruitment || null;
  if (rec?.target) {
    const receipt = rec.mode === 'ultimatum'
      ? (rec.accepted ? `${rec.target} took the ultimatum and joined the Traitors`
        : `${rec.target} refused the ultimatum`)
      : (rec.accepted ? `${rec.target} accepted the Traitors' offer`
        : `${rec.target} turned the Traitors' offer down`);
    out.push(make('recruited', { subject: rec.target, actor: rec.recruiter || null,
      jitter: jitter(), receipt }));
  } else {
    for (const f of ctx.recruitsAt(ep)) {
      out.push(make('recruited', { subject: f.name, jitter: jitter(),
        receipt: f.via === 'ultimatum' ? `${f.name} took the ultimatum and joined the Traitors`
          : `${f.name} accepted the Traitors' offer` }));
    }
  }
  for (const x of exits.filter(e => e.channel === 'murder')) {
    const refused = rec?.executed === x.name;
    out.push(make('murder', { subject: x.name, jitter: jitter(),
      receipt: refused ? `${x.name} refused the Traitors and was killed for it`
        : `${x.name} was murdered in the night` }));
  }
  if (record.murderBlocked ?? record.tr?.conclave?.blocked) {
    const shield = ctx.shieldBlockAt(ep);
    out.push(make('murder-blocked', { subject: shield?.holder || null, jitter: jitter(),
      receipt: shield?.holder ? `the Traitors went for ${shield.holder} and the Shield held`
        : 'the Traitors struck and a Shield held' }));
  }

  /* ── THE DAY THE CASTLE SPENT, as the audience read it ───────────────
     Everything above is the format: the table, the night, the money. This is
     the rest of the show — a defence, a pile-on, somebody caught sweating —
     and it reaches the shared FANDOM topics (kindness noticed, the
     personality clash, the harassment defence) which otherwise had nothing to
     fire on but `episode-aired`.
     The tone is the event's OWN declaration, carried on the scene by
     `_castleRecord`; nothing here reads the prose. `masterful` is deliberately
     unmapped — a Traitor being good at being a Traitor is this show's own
     subject and `traitor-rating` already has it — and so is `wronged`, which
     is paid at a banishment rather than in a scene.
     CAPPED, because a castle night fires a dozen scenes and the feed would
     spend the episode on them: the loudest few, one per person. */
  const TONE_KIND = {
    kind: 'kindness', selfless: 'kindness', heroic: 'kindness',
    cruel: 'ganging-up',
    selfish: 'argument', exposed: 'argument', cowardly: 'argument',
  };
  const seen = new Set();
  let scenesUsed = 0;
  for (const scene of record.tr?.castle?.scenes || []) {
    if (scenesUsed >= 4) break;
    for (const decl of scene.crowd || []) {
      const kind = TONE_KIND[decl.colour];
      if (!kind || seen.has(decl.name)) continue;
      seen.add(decl.name);
      scenesUsed++;
      // The other person in the scene, where there was one: a defence and a
      // pile-on are both about a pair, and a phrasing that can name both is
      // the half of the library worth reading.
      const other = [scene.speaker, scene.respondent, ...(scene.actors || [])]
        .find(n => n && n !== decl.name) || null;
      out.push(make(kind, { subject: decl.name, actor: other, jitter: jitter() }));
      break;
    }
  }

  // ── the end ──
  const endgame = record.tr?.endgame;
  if (record.tr?.finale || endgame) {
    const takers = endgame?.takers || [];
    const fin = make('finale', { subject: takers.length === 1 ? takers[0] : null,
      receipt: endgame?.line || null });
    fin.subjects = takers.map(slugOf);
    fin.decidedBy = 'endgame';
    out.push(fin);
  }
  return out;
}

export default {
  format: TRAITORS_FORMAT,
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
  // The format's own moments, plus the three shared kinds the castle's day
  // emits — see DAY_TAKES. Without those three the room reaches past the pack
  // for them and speaks another show.
  chatTakes: { ...CHAT_TAKES, ...DAY_TAKES },
};
