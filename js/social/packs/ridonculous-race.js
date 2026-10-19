// js/social/packs/ridonculous-race.js
// The Ridonculous Race, as its fandom talks about it.
//
// THERE IS NO VOTE ON THIS SHOW. Teams of two race around the world; the last
// team to reach the Chill Zone may be eliminated, and the first team to the
// finale's finish line wins. Nobody nominates anybody, there is no house and
// no jury. Measured 2026-10-19 before this pack existed: the race's feed was
// written by the shared library and talked about the veto, the jury and "this
// house" over a season of airports and Don Boxes. What its fans argue about is
// who won the leg, who came last, a team falling apart, a team sabotaging
// another, a romance between two teams, somebody facing a fear, and who won.
//
// ONE READER. A played row carries `rr` (rows from js/rr-run.js raceRows): the
// check-in order with both names of every team, the leg's kind (elim, non,
// final), who went home and how, and the scenes that aired.
import { RACE_FORMAT } from '../../shows.js';
import { PHRASINGS, CHAT_TAKES, PERSONAS } from './ridonculous-race-words.js';
import { HOST_TAKES } from './ridonculous-race-voices.js';

const slugOf = name => String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** The moments this show produces, in the order an episode airs them. */
const KINDS = {
  'fear-faced':    { label: 'Faced a fear', volume: 1.1, at: 0.35 },
  'race-romance':  { label: 'Romance on the race', volume: 1.3, at: 0.5, implies: ['romantic-spark'] },
  'team-meltdown': { label: 'Team meltdown', volume: 1.5, at: 0.55, implies: ['argument'] },
  'race-sabotage': { label: 'Sabotage', volume: 1.7, at: 0.6, implies: ['betrayal'] },
  'leg-won':       { label: 'Won the leg', volume: 1.4, at: 0.92, implies: ['comp-win'] },
  'safe-last':     { label: 'Last, and still in', volume: 1.4, at: 0.96 },
  'race-out':      { label: 'Eliminated', volume: 2.0, at: 0.97, implies: ['eviction'] },
};

/** What this fandom argues about. Words in ridonculous-race-words.js. */
const TOPICS = [
  { id: 'leg-win-talk', stream: 'both', weight: 1.1,
    triggers: ['leg-won'], reads: ['order'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'race-elimination', stream: 'both', weight: 1.3,
    triggers: ['race-out'], reads: ['eliminated', 'order'], shapes: ['live-reaction', 'sympathy'] },
  { id: 'last-but-safe', stream: 'timeline', weight: 1.0,
    triggers: ['safe-last'], reads: ['order'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'meltdown-watch', stream: 'both', weight: 1.2,
    triggers: ['team-meltdown'], reads: ['aired'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'sabotage-reaction', stream: 'both', weight: 1.3,
    triggers: ['race-sabotage'], reads: ['aired'], shapes: ['live-reaction', 'complaint'] },
  { id: 'race-romance-talk', stream: 'timeline', weight: 1.0,
    triggers: ['race-romance'], reads: ['aired'], shapes: ['gushing', 'hot-take'] },
  { id: 'fear-talk', stream: 'timeline', weight: 0.8,
    triggers: ['fear-faced'], reads: ['aired'], shapes: ['live-reaction', 'gushing'] },
  { id: 'race-winners', stream: 'both', weight: 1.3,
    triggers: ['finale'], reads: ['order', 'winners'], shapes: ['live-reaction', 'hot-take'] },
  { id: 'race-edit', stream: 'timeline', weight: 0.6,
    triggers: ['episode-aired'], reads: ['place', 'aired'], shapes: ['hot-take'] },
];

/** Who a topic is aimed at, and whether it is for or against them. */
const TOPIC_AIM = {
  'leg-win-talk': { target: 'subject', stance: 0.5 },
  'race-elimination': { target: 'subject', stance: 0.5 },
  'last-but-safe': { target: 'subject', stance: 0.3 },
  'meltdown-watch': { target: 'subject', stance: -0.2 },
  'sabotage-reaction': { target: 'subject', stance: -0.5 },
  'race-romance-talk': { target: 'subject', stance: 0.6 },
  'fear-talk': { target: 'subject', stance: 0.7 },
  'race-winners': { target: 'subject', stance: 0.5 },
  // Aimed at the producers and the route, not a racer.
  'race-edit': { target: 'none', stance: -0.1 },
};

/** Which kind of fan reaches for which topic. 1 is indifferent. */
const ARCHETYPE_PULL = {
  analyst: { 'leg-win-talk': 1.3, 'race-edit': 1.3, 'race-winners': 1.2 },
  stan: { 'race-elimination': 1.4, 'fear-talk': 1.3 },
  hater: { 'sabotage-reaction': 1.4, 'meltdown-watch': 1.3 },
  livefeeder: { 'last-but-safe': 1.3, 'fear-talk': 1.2 },
  chaos: { 'meltdown-watch': 1.5, 'sabotage-reaction': 1.3 },
  casual: { 'race-winners': 1.2, 'leg-win-talk': 1.2 },
  shipper: { 'race-romance-talk': 1.8 },
};

/** The legs a season being played has aired. */
function records(gs) {
  return (gs?.episodeHistory || [])
    .filter(r => r && r.rr)
    .map(record => ({ record, episode: Number(record.num) }))
    .filter(r => Number.isFinite(r.episode));
}

/** The winning team, from `gs` or a published document. */
function context(source) {
  const last = (source?.episodeHistory || []).filter(r => r?.rr?.kind === 'final').at(-1);
  const top = last?.rr?.order?.[0];
  const winners = Array.isArray(source?.winners) && source.winners.length ? source.winners.map(w => w?.name || w).filter(Boolean)
    : top ? [top.a, top.b].filter(Boolean) : [];
  return { winners };
}

// the aired scenes that are each kind of moment (js/rr scene kinds)
const MELTDOWN = new Set(['snap', 'blame', 'silent-treatment']);
const SABOTAGE = new Set(['course-sabotage', 'push', 'shove', 'ram', 'steal', 'kidnap-pet', 'fake-shortcut', 'admin-sabotage', 'mind-game']);
const ROMANCE = new Set(['flirt', 'near-kiss', 'kiss', 'confession', 'showmance', 'date']);
const FEAR = new Set(['phobia', 'fear-through']);
const FEAR_DONE = new Set(['overcomes', 'talked-down', 'panic-break', 'swap']);

/** One leg, as events. `make` is handed in by js/social/events.js. */
function events(record, meta, { make, ctx = context(null) } = {}) {
  const rr = record?.rr;
  if (!rr || typeof make !== 'function') return [];
  const out = [];
  let n = 0;
  const jitter = () => (n++ % 5) * 0.01;
  const order = rr.order || [];
  const team = id => order.find(t => t.team === id) || null;
  const both = t => (t ? [t.a, t.b].filter(Boolean).join(' and ') : '');
  const where = rr.placeName ? ` in ${rr.placeName}` : '';
  const segs = rr.aired?.segments || [];
  const once = new Set();
  const first = (kind, key) => { const k = `${kind}|${key}`; if (once.has(k)) return false; once.add(k); return true; };

  // ── the leg's moments, in the order they aired ──
  for (const s of segs) {
    const t = team(s.teams?.[0]);
    if (!t) continue;
    if (FEAR.has(s.kind) && FEAR_DONE.has(s.ending) && first('fear', t.team)) {
      const who = s.lines?.find(l => l.by && l.by !== 'Don')?.by || t.a;
      out.push(make('fear-faced', { subject: who, jitter: jitter(), receipt: `${who} faced a fear${where}` }));
    } else if (MELTDOWN.has(s.kind) && first('melt', t.team)) {
      out.push(make('team-meltdown', { subject: t.a, actor: t.b, jitter: jitter(), receipt: `${both(t)} fell out${where}` }));
    } else if (SABOTAGE.has(s.kind) && s.teams?.[1] && first('sab', `${t.team}|${s.teams[1]}`)) {
      const v = team(s.teams[1]);
      out.push(make('race-sabotage', { subject: t.a, actor: v?.a || null, jitter: jitter(),
        receipt: v ? `${both(t)} went after ${both(v)}` : `${both(t)} played dirty${where}` }));
    } else if (ROMANCE.has(s.kind) && s.teams?.[1] && first('rom', [s.teams[0], s.teams[1]].sort().join('|'))) {
      const names = [...new Set((s.lines || []).map(l => l.by).filter(x => x && x !== 'Don'))];
      const [x, y] = names.length >= 2 ? names : [t.a, team(s.teams[1])?.a];
      if (x && y) out.push(make('race-romance', { subject: x, actor: y, jitter: jitter(), receipt: `${x} and ${y} had a moment` }));
    }
  }

  // ── the mat ──
  const winners = order[0];
  if (rr.kind !== 'final' && winners) {
    out.push(make('leg-won', { subject: winners.a, actor: winners.b, jitter: jitter(), receipt: `${both(winners)} won the leg${where}` }));
  }
  if (rr.kind === 'non' && order.length) {
    const last = order.at(-1);
    out.push(make('safe-last', { subject: last.a, actor: last.b, jitter: jitter(), receipt: `${both(last)} came last and stayed in` }));
  }
  for (const id of rr.kind === 'final' ? [] : rr.eliminated || []) {
    const t = team(id);
    if (!t) continue;
    out.push(make('race-out', { subject: t.a, actor: t.b, jitter: jitter(), receipt: `${both(t)} were eliminated${where}` }));
  }

  // ── the finale ──
  if (rr.kind === 'final' && winners) {
    const fin = make('finale', { subject: winners.a, actor: winners.b, receipt: `${both(winners)} won the race` });
    fin.subjects = [winners.a, winners.b].map(slugOf);
    // A race: the first team across the line wins. No jury, no vote.
    fin.decidedBy = 'challenge';
    out.push(fin);
  }
  return out;
}

export default {
  format: RACE_FORMAT,
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
