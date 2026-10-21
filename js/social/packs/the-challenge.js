// js/social/packs/the-challenge.js
// The Challenge, as its fandom talks about it.
//
// A DAILY, A HOUSE VOTE, THE ARENA. Every episode the players compete in a
// daily challenge; the winners are safe and hold power, the house votes people
// into the Arena, an opponent is called out or picked, and whoever loses the
// Arena goes home. The season ends on a final, a race, with champions (often
// more than one). TJ hosts. There is no jury, no tribe and no idol.
// The user, 2026-10-21: "do the social feed for the other shows like we did for
// big brother and total drama". Before this pack the Challenge's feed was the
// shared library, written for a jury show: "jury", "voted out", "the merge".
//
// What its fans argue about: who won the daily, who the house threw into the
// Arena and who flipped to do it, the call-out, the Arena itself (the
// elimination beasts and the giants who fall), somebody walking out, the house
// fights, the hookups, an alliance cracking, and the champions.
//
// TWO READERS, ONE NIGHT. A played row carries `ch` (js/ch-run.js
// challengeRows): the daily's winners, who was voted in, every ballot (a flip
// is marked), the call-outs, the Arena games, and the scenes that aired. A
// published row (js/ch/export.js chVotingHistory) carries the same facts flat,
// without the scenes. Both carry `exits`.
import { CHALLENGE_FORMAT } from '../../shows.js';
import { PHRASINGS, CHAT_TAKES, PERSONAS } from './the-challenge-words.js';
import { HOST_TAKES } from './the-challenge-voices.js';

const slugOf = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** The moments this show produces, in the order an episode airs them. */
const KINDS = {
  'house-hookup':    { label: 'Hooked up', volume: 1.3, at: 0.2, implies: ['romantic-spark'] },
  'house-fight':     { label: 'House fight', volume: 1.4, at: 0.25, implies: ['argument'] },
  'daily-won':       { label: 'Won the daily', volume: 1.3, at: 0.35, implies: ['comp-win'] },
  'alliance-broken': { label: 'Alliance cracked', volume: 1.4, at: 0.45, implies: ['betrayal'] },
  'voted-in':        { label: 'Voted into the Arena', volume: 1.5, at: 0.6 },
  'house-flip':      { label: 'Flipped the vote', volume: 1.3, at: 0.62, implies: ['betrayal'] },
  'called-out':      { label: 'The call-out', volume: 1.4, at: 0.7, implies: ['argument'] },
  'left-game':       { label: 'Left the game', volume: 1.6, at: 0.75 },
  'arena-won':       { label: 'Won the Arena', volume: 1.4, at: 0.92, implies: ['comp-win'] },
  'arena-out':       { label: 'Eliminated', volume: 2.0, at: 0.95, implies: ['eviction'] },
};

/** What this fandom argues about. Words in the-challenge-words.js. */
const TOPICS = [
  { id: 'daily-talk', stream: 'both', weight: 1.1,
    triggers: ['daily-won'], reads: ['daily'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'arena-vote-talk', stream: 'both', weight: 1.3,
    triggers: ['voted-in'], reads: ['votes'], shapes: ['live-reaction', 'complaint'] },
  { id: 'flip-talk', stream: 'timeline', weight: 1.1,
    triggers: ['house-flip'], reads: ['votes'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'callout-talk', stream: 'timeline', weight: 1.2,
    triggers: ['called-out'], reads: ['callouts'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'arena-result', stream: 'both', weight: 1.2,
    triggers: ['arena-won'], reads: ['arena'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'arena-exit', stream: 'both', weight: 1.3,
    triggers: ['arena-out'], reads: ['arena', 'exits'], shapes: ['live-reaction', 'sympathy'] },
  { id: 'walkout-talk', stream: 'timeline', weight: 1.1,
    triggers: ['left-game'], reads: ['exits'], shapes: ['live-reaction', 'sympathy'] },
  { id: 'house-fight-talk', stream: 'timeline', weight: 1.1,
    triggers: ['house-fight'], reads: ['aired'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'hookup-talk', stream: 'timeline', weight: 1.0,
    triggers: ['house-hookup'], reads: ['aired'], shapes: ['gushing', 'hot-take'] },
  { id: 'alliance-crack', stream: 'timeline', weight: 1.1,
    triggers: ['alliance-broken'], reads: ['aired'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'champions-talk', stream: 'both', weight: 1.3,
    triggers: ['finale'], reads: ['winners'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'challenge-edit', stream: 'timeline', weight: 0.6,
    triggers: ['episode-aired'], reads: ['aired'], shapes: ['hot-take'] },
];

/** Who a topic is aimed at, and whether it is for or against them. */
const TOPIC_AIM = {
  'daily-talk': { target: 'subject', stance: 0.5 },
  'arena-vote-talk': { target: 'subject', stance: 0.3 },
  'flip-talk': { target: 'subject', stance: -0.4 },
  'callout-talk': { target: 'subject', stance: 0 },
  'arena-result': { target: 'subject', stance: 0.6 },
  'arena-exit': { target: 'subject', stance: 0.5 },
  'walkout-talk': { target: 'subject', stance: 0 },
  'house-fight-talk': { target: 'subject', stance: -0.2 },
  'hookup-talk': { target: 'subject', stance: 0.5 },
  'alliance-crack': { target: 'subject', stance: -0.3 },
  'champions-talk': { target: 'subject', stance: 0.5 },
  // Aimed at the producers, not a player.
  'challenge-edit': { target: 'none', stance: -0.1 },
};

/** Which kind of fan reaches for which topic. 1 is indifferent. */
const ARCHETYPE_PULL = {
  analyst: { 'arena-vote-talk': 1.4, 'flip-talk': 1.3, 'daily-talk': 1.2 },
  stan: { 'arena-exit': 1.4, 'champions-talk': 1.3, 'arena-result': 1.2 },
  hater: { 'flip-talk': 1.4, 'alliance-crack': 1.3, 'walkout-talk': 1.2 },
  livefeeder: { 'callout-talk': 1.3, 'house-fight-talk': 1.3 },
  chaos: { 'house-fight-talk': 1.5, 'callout-talk': 1.3, 'alliance-crack': 1.2 },
  casual: { 'champions-talk': 1.2, 'daily-talk': 1.2 },
  shipper: { 'hookup-talk': 1.8 },
};

/** The episodes a season being played has aired. */
function records(gs) {
  return (gs?.episodeHistory || [])
    .filter(r => r && r.format === CHALLENGE_FORMAT && r.ch)
    .map(record => ({ record, episode: Number(record.num ?? record.episode) }))
    .filter(r => Number.isFinite(r.episode));
}

/** The champions, from `gs` (the final row) or a published document. */
function context(source) {
  const fromDoc = Array.isArray(source?.winners) && source.winners.length
    ? source.winners.map(w => w?.name || w).filter(Boolean) : null;
  const fin = (source?.episodeHistory || []).filter(r => r?.ch?.final).at(-1)?.ch?.final;
  return { winners: fromDoc || fin?.champions || (source?.final?.champions) || [] };
}

// the aired scenes that are each kind of moment (js/ch scene kinds)
const FIGHT = new Set(['fight', 'kitchen-blowup', 'party-callout', 'arena-eve-confront', 'ranking-beef']);
const HOOKUP = new Set(['showmance', 'party-kiss', 'beach-date', 'pda']);
const BROKEN = new Set(['alliance-betrayal', 'deal-broken']);
const LEFT = { quit: 'walked out', medevac: 'left on medical', medical: 'left on medical', dq: 'was disqualified', disqualified: 'was disqualified' };

/** One episode, as events. `make` is handed in by js/social/events.js. */
function events(record, meta, { make, ctx = context(null) } = {}) {
  if (!record || typeof make !== 'function') return [];
  const ch = record.ch || record;          // a played row nests it; a published row is flat
  const out = [];
  let n = 0;
  const jitter = () => (n++ % 5) * 0.01;
  const once = new Set();
  const first = key => { if (once.has(key)) return false; once.add(key); return true; };

  // ── the house, as it aired ──
  for (const s of ch.aired || []) {
    const [a, b] = s.who || [];
    if (!a) continue;
    if (FIGHT.has(s.kind) && b && first(`fight|${[a, b].sort().join('|')}`)) {
      out.push(make('house-fight', { subject: a, actor: b, jitter: jitter(), receipt: `${a} and ${b} went at it in the house` }));
    } else if (HOOKUP.has(s.kind) && b && first(`hook|${[a, b].sort().join('|')}`)) {
      out.push(make('house-hookup', { subject: a, actor: b, jitter: jitter(), receipt: `${a} and ${b} hooked up` }));
    } else if (BROKEN.has(s.kind) && b && first(`broke|${a}`)) {
      out.push(make('alliance-broken', { subject: a, actor: b, jitter: jitter(), receipt: `${a} broke a deal with ${b}` }));
    }
  }

  // ── the daily ──
  const winners = (ch.dailyWinners || []).filter(Boolean);
  const daily = ch.daily?.name ? ` ${ch.daily.name}` : ' the daily';
  if (winners.length) {
    const team = winners.length > 2;
    out.push(make('daily-won', { subject: winners[0], actor: winners[1] || null, jitter: jitter(),
      receipt: team ? `${winners[0]}'s team won${daily}` : `${winners.join(' and ')} won${daily}` }));
  }

  // ── the house vote, the flips, the call-out ──
  const ballots = (ch.votes || []).flatMap(v => (v.ballots ? v.ballots : [v]));
  for (const name of (ch.votedIn || []).filter(Boolean)) {
    const by = ballots.filter(b => b.target === name).length;
    out.push(make('voted-in', { subject: name, jitter: jitter(),
      receipt: by ? `the house voted ${name} into the Arena with ${by} votes` : `the house voted ${name} into the Arena` }));
  }
  // Two flips at most: a vote where half the house flipped is one story, not six.
  for (const b of ballots.filter(x => x.flip && x.voter && x.target).slice(0, 2)) {
    if (first(`flip|${b.voter}`)) {
      out.push(make('house-flip', { subject: b.voter, actor: b.target, jitter: jitter(), receipt: `${b.voter} flipped and wrote down ${b.target}` }));
    }
  }
  for (const c of ch.callouts || []) {
    if (c.by && c.opponent && first(`call|${c.by}`)) {
      out.push(make('called-out', { subject: c.by, actor: c.opponent, jitter: jitter(), receipt: `${c.by} called out ${c.opponent}` }));
    }
  }

  // ── somebody left without the Arena ──
  for (const x of record.exits || []) {
    const how = LEFT[x?.channel];
    if (x?.name && how) out.push(make('left-game', { subject: x.name, jitter: jitter(), receipt: `${x.name} ${how}` }));
  }

  // ── the Arena ──
  for (const d of ch.arena || []) {
    if (!d?.winner || !d?.loser) continue;
    const game = d.game ? ` in ${d.game}` : '';
    out.push(make('arena-won', { subject: d.winner, actor: d.loser, jitter: jitter(), receipt: `${d.winner} beat ${d.loser}${game}` }));
    out.push(make('arena-out', { subject: d.loser, actor: d.winner, jitter: jitter(), receipt: `${d.loser} lost${game} and went home` }));
  }

  // ── the final: a race, with champions ──
  const fin = ch.final || null;
  const champs = fin?.champions?.length ? fin.champions : (record.isFinale ? ctx.winners : []);
  if (champs?.length) {
    const ev = make('finale', { subject: champs[0], receipt: `${champs.join(' and ')} won the final` });
    ev.subjects = champs.map(slugOf);
    // A final race decides it: no jury, no vote.
    ev.decidedBy = 'challenge';
    out.push(ev);
  }
  return out;
}

export default {
  format: CHALLENGE_FORMAT,
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
