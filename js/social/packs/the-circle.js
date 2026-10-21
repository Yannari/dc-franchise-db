// js/social/packs/the-circle.js
// The Circle, as its fandom talks about it.
//
// THERE IS NO VOTE ON THIS SHOW AND NOBODY LIVES TOGETHER. The players are in
// separate apartments and only talk through the Circle: they rate each other,
// the top-rated become Influencers, and the Influencers block somebody, who
// leaves (and sometimes walks into one apartment on the way out). Some players
// are catfish, playing as somebody they are not, and the audience is told who.
// The user, 2026-10-21: "do the social feed for the other shows like we did for
// big brother and total drama". Measured that day before this pack existed: the
// Circle's feed was the shared library, and it talked about "the majority",
// "that beach" and "the bottom finding a spine" over a season of ratings and
// catfish, with one event per episode (the block, read as an eviction).
//
// What its fans argue about: who topped the ratings, what the Influencers will
// do with the power, who got blocked and who did it, the catfish reveal, who
// thinks whose profile is fake, the flirting over text, the group chats, a
// blocked player walking into somebody's apartment, and who won.
//
// TWO READERS, ONE NIGHT. A played row carries `ci` (js/ci/season.js): the
// rating with handles, the profiles map (handle -> shown name and the real
// people), the scenes that aired. A published row (data/seasons/ci-N-data.json
// votingHistory) carries `ratings` by profile name with the people, and the
// exits. Both carry `exits` in the shared shape.
import { CIRCLE_FORMAT } from '../../shows.js';
import { PHRASINGS, CHAT_TAKES, PERSONAS } from './the-circle-words.js';
import { HOST_TAKES } from './the-circle-voices.js';

const slugOf = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** The moments this show produces, in the order an episode airs them. */
const KINDS = {
  'new-arrival':       { label: 'New player', volume: 1.0, at: 0.15 },
  'circle-flirt':      { label: 'Flirting in the chat', volume: 1.3, at: 0.35, implies: ['romantic-spark'] },
  'group-chat-formed': { label: 'New group chat', volume: 1.0, at: 0.4, implies: ['alliance-formed'] },
  'fake-suspected':    { label: 'Called out as a catfish', volume: 1.2, at: 0.45 },
  'top-rated':         { label: 'Top of the ratings', volume: 1.3, at: 0.8, implies: ['comp-win'] },
  'bottom-rated':      { label: 'Bottom of the ratings', volume: 1.1, at: 0.82 },
  'made-influencer':   { label: 'Influencer', volume: 1.2, at: 0.84 },
  'blocked':           { label: 'Blocked', volume: 2.0, at: 0.9, implies: ['eviction'] },
  'catfish-caught':    { label: 'Catfish revealed', volume: 1.8, at: 0.93 },
  'blocked-visit':     { label: 'The visit', volume: 1.4, at: 0.96 },
};

/** What this fandom argues about. Words in the-circle-words.js. */
const TOPICS = [
  { id: 'ratings-reaction', stream: 'both', weight: 1.2,
    triggers: ['top-rated'], reads: ['ratings'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'influencer-power', stream: 'both', weight: 1.1,
    triggers: ['made-influencer'], reads: ['ratings'], shapes: ['hot-take'] },
  { id: 'bottom-ratings', stream: 'timeline', weight: 1.0,
    triggers: ['bottom-rated'], reads: ['ratings'], shapes: ['live-reaction', 'sympathy'] },
  { id: 'block-reaction', stream: 'both', weight: 1.4,
    triggers: ['blocked'], reads: ['exits'], shapes: ['live-reaction', 'sympathy'] },
  { id: 'catfish-reveal', stream: 'both', weight: 1.4,
    triggers: ['catfish-caught'], reads: ['exits'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'catfish-suspicion', stream: 'timeline', weight: 1.1,
    triggers: ['fake-suspected'], reads: ['aired'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'circle-flirt-talk', stream: 'timeline', weight: 1.1,
    triggers: ['circle-flirt'], reads: ['aired'], shapes: ['gushing', 'hot-take'] },
  { id: 'group-chat-talk', stream: 'timeline', weight: 0.9,
    triggers: ['group-chat-formed'], reads: ['aired'], shapes: ['hot-take'] },
  { id: 'visit-talk', stream: 'timeline', weight: 1.1,
    triggers: ['blocked-visit'], reads: ['aired'], shapes: ['live-reaction'] },
  { id: 'new-player-talk', stream: 'timeline', weight: 0.9,
    triggers: ['new-arrival'], reads: ['arrivals'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'circle-winner', stream: 'both', weight: 1.3,
    triggers: ['finale'], reads: ['winners'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'circle-edit', stream: 'timeline', weight: 0.6,
    triggers: ['episode-aired'], reads: ['aired'], shapes: ['hot-take'] },
];

/** Who a topic is aimed at, and whether it is for or against them. */
const TOPIC_AIM = {
  'ratings-reaction': { target: 'subject', stance: 0.5 },
  'influencer-power': { target: 'subject', stance: 0.1 },
  'bottom-ratings': { target: 'subject', stance: 0.2 },
  'block-reaction': { target: 'subject', stance: 0.4 },
  'catfish-reveal': { target: 'subject', stance: 0.1 },
  'catfish-suspicion': { target: 'subject', stance: -0.1 },
  'circle-flirt-talk': { target: 'subject', stance: 0.6 },
  'group-chat-talk': { target: 'subject', stance: 0 },
  'visit-talk': { target: 'subject', stance: 0.4 },
  'new-player-talk': { target: 'subject', stance: 0.2 },
  'circle-winner': { target: 'subject', stance: 0.5 },
  // Aimed at the producers, not a player.
  'circle-edit': { target: 'none', stance: -0.1 },
};

/** Which kind of fan reaches for which topic. 1 is indifferent. */
const ARCHETYPE_PULL = {
  analyst: { 'ratings-reaction': 1.3, 'influencer-power': 1.4, 'catfish-suspicion': 1.2 },
  stan: { 'block-reaction': 1.4, 'circle-winner': 1.3, 'bottom-ratings': 1.2 },
  hater: { 'catfish-reveal': 1.3, 'influencer-power': 1.2, 'circle-edit': 1.2 },
  livefeeder: { 'visit-talk': 1.4, 'new-player-talk': 1.3 },
  chaos: { 'catfish-reveal': 1.5, 'catfish-suspicion': 1.4, 'visit-talk': 1.2 },
  casual: { 'circle-winner': 1.2, 'ratings-reaction': 1.2 },
  shipper: { 'circle-flirt-talk': 1.8 },
};

/** The episodes a season being played has aired. */
function records(gs) {
  return (gs?.episodeHistory || [])
    .filter(r => r && r.ci)
    .map(record => ({ record, episode: Number(record.num ?? record.episode) }))
    .filter(r => Number.isFinite(r.episode));
}

/** Who won, from `gs` (the run keeps them on gs.ci) or a published document. */
function context(source) {
  const fromDoc = Array.isArray(source?.winners) && source.winners.length
    ? source.winners.map(w => w?.name || w).filter(Boolean) : null;
  const fromRun = Array.isArray(source?.ci?.winners) ? source.ci.winners.filter(Boolean) : null;
  return { winners: fromDoc || fromRun || [] };
}

// What the aired scripts say (js/ci/lines block keys).
const hasBlock = (scene, prefix) => (scene?.script?.blocks || []).some(b => String(b.key || '').startsWith(prefix));
const blockOf = (scene, prefix) => (scene?.script?.blocks || []).find(b => String(b.key || '').startsWith(prefix)) || null;

/** One episode, as events. `make` is handed in by js/social/events.js. */
function events(record, meta, { make, ctx = context(null) } = {}) {
  if (!record || typeof make !== 'function') return [];
  const out = [];
  let n = 0;
  const jitter = () => (n++ % 5) * 0.01;
  const live = record.ci || null;
  const profiles = live?.profiles || {};
  const rating = live?.rating || record.ratings || null;
  const results = (rating?.results || []).slice().sort((a, b) => (a.place ?? 99) - (b.place ?? 99));
  // A handle (played) or a profile name (published) -> the profile's shown name and the real person behind it.
  const shownOf = p => profiles[p]?.name || p;
  const personOf = p => profiles[p]?.people?.[0]
    || results.find(r => r.profile === p)?.people?.[0] || shownOf(p);
  // "Brooke" when Brooke is Brooke; "Brooke (really Derek)" when the audience knows better.
  const said = p => { const shown = shownOf(p); const real = personOf(p); return shown && real && shown !== real ? `${shown} (really ${real})` : shown; };

  // ── the day's scenes, in the order they aired ──
  const once = new Set();
  const first = key => { if (once.has(key)) return false; once.add(key); return true; };
  for (const h of live?.arrivals || []) {
    if (first(`arr|${h}`)) out.push(make('new-arrival', { subject: personOf(h), jitter: jitter(), receipt: `${said(h)} joined the Circle` }));
  }
  for (const s of live?.aired || []) {
    const [a, b] = s.who || [];
    if ((hasBlock(s, 'chat.flirt') || hasBlock(s, 'aside.romantic') || hasBlock(s, 'party.flirt')) && a && b
      && first(`flirt|${[a, b].sort().join('|')}`)) {
      out.push(make('circle-flirt', { subject: personOf(a), actor: personOf(b), jitter: jitter(),
        receipt: `${shownOf(a)} and ${shownOf(b)} flirted in a private chat` }));
    } else if (s.kind === 'group-chat' && hasBlock(s, 'group.form') && a && b && first(`group|${a}`)) {
      out.push(make('group-chat-formed', { subject: personOf(a), actor: personOf(b), jitter: jitter(),
        receipt: `${shownOf(a)} started a group chat with ${shownOf(b)}` }));
    } else if (hasBlock(s, 'style.mismatch')) {
      const on = blockOf(s, 'style.mismatch')?.on || {};
      const who = on.a || a, about = on.b || b;
      if (who && about && first(`sus|${about}`)) {
        out.push(make('fake-suspected', { subject: personOf(about), actor: personOf(who), jitter: jitter(),
          receipt: `${shownOf(who)} thinks ${shownOf(about)} is a catfish` }));
      }
    } else if (s.kind === 'visit' && a && b && first('visit')) {
      out.push(make('blocked-visit', { subject: personOf(a), actor: personOf(b), jitter: jitter(),
        receipt: `${shownOf(a)} walked into ${shownOf(b)}'s apartment` }));
    }
  }

  // ── the ratings ──
  if (results.length && !rating?.final) {
    const top = results[0];
    out.push(make('top-rated', { subject: personOf(top.profile), jitter: jitter(), receipt: `${said(top.profile)} came first in the ratings` }));
    const last = results.at(-1);
    if (last && last !== top) out.push(make('bottom-rated', { subject: personOf(last.profile), jitter: jitter(), receipt: `${said(last.profile)} came last in the ratings` }));
    const infl = (rating.influencers || []).filter(Boolean);
    for (const [i, p] of infl.slice(0, 2).entries()) {
      const other = infl[1 - i];
      out.push(make('made-influencer', { subject: personOf(p), actor: other ? personOf(other) : null, jitter: jitter(),
        receipt: other ? `${shownOf(p)} and ${shownOf(other)} are the Influencers` : `${shownOf(p)} is the Influencer` }));
    }
  }

  // ── who left, and who they really were ──
  for (const x of record.exits || []) {
    if (!x?.name) continue;
    const by = (x.by || []).filter(Boolean);
    const how = by.length ? `${by.join(' and ')} blocked ${x.profile || x.name}`
      : x.channel === 'audience' ? `the audience blocked ${x.profile || x.name}` : `${x.profile || x.name} was blocked`;
    out.push(make('blocked', { subject: x.name, actor: by[0] || null, jitter: jitter(), receipt: how }));
    if (x.profile && x.profile !== x.name) {
      out.push(make('catfish-caught', { subject: x.name, actor: by[0] || null, jitter: jitter(),
        receipt: `${x.profile} was really ${x.name} all along` }));
    }
  }

  // ── the finale: the final ratings, not a vote ──
  const isFinale = !!(record.isFinale || record.slot === 'finale' || rating?.final);
  if (isFinale && ctx.winners?.length) {
    const fin = make('finale', { subject: ctx.winners[0], receipt: `${ctx.winners.join(' and ')} won the Circle` });
    fin.subjects = ctx.winners.map(slugOf);
    // Decided by the players' final ratings: neither a jury nor a final challenge.
    fin.decidedBy = 'endgame';
    out.push(fin);
  }
  return out;
}

export default {
  format: CIRCLE_FORMAT,
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
