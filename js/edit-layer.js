// ══════════════════════════════════════════════════════════════════════
// edit-layer.js — production & editing layer (realism roadmap #6, insight v1).
//
// The game determines what happened; the edit determines what the audience
// sees. After each episode this engine converts recorded events into
// screen-time units + tones + confessional slots, keeps a LIVE per-player
// edit read (winner edit, decoy favorite, villain edit, growth arc, comic
// relief, invisible, steady presence — no peeking at future results), and
// nudges fan perception (gs.popularity) only. It NEVER touches bonds,
// alliances, votes, or jury logic — the edit affects the audience, not the
// island.
//
// SELF-CONTAINED: reads ep + stable gs fields, writes only gs.edit and
// gs.popularity. Consumers use the read API (editRead / editSummary /
// editArc), never the internals. Spec: docs/superpowers/specs/
// 2026-07-24-edit-layer-design.md
// ══════════════════════════════════════════════════════════════════════
import { gs, seasonConfig } from './core.js';
import { players } from './core.js';

export const EDIT_LABELS = {
  winner:   'Winner edit',
  decoy:    'Decoy favorite',
  villain:  'Villain edit',
  growth:   'Growth arc',
  comic:    'Comic relief',
  invisible:'Invisible',
  steady:   'Steady presence',
};
const TONES = ['heroic', 'villainous', 'comic', 'strategic', 'emotional', 'neutral'];

// Fan-perception drift per episode by current read — the edit layer's ONLY consequence.
const FAN_DRIFT = { growth: 0.3, winner: 0.25, decoy: 0.2, comic: 0.15, villain: 0.1, steady: 0, invisible: -0.2 };

const EMA_ALPHA = 0.4;        // how fast the running read absorbs a new episode
const HYSTERESIS = 1.15;      // challenger must beat incumbent read by 15%

function _ensureEdit() {
  if (!gs.edit) gs.edit = { episodes: [], totals: {}, reads: {}, final: null };
  return gs.edit;
}

// ── Tone classification: keyword map over event type + badge text.
// Unknown content degrades to neutral — never throws on new event types.
const TONE_RULES = [
  ['villainous', /sabot|scheme|lie|liar|betray|steal|blindside|villain|frame|forge|manipul|taunt|threat|ambush|rat\b|snake/i],
  ['heroic',     /help|comfort|bond|encourag|hero|rescue|protect|praise|carr|defend|loyal|generous|share|provider/i],
  ['emotional',  /romance|spark|showmance|kiss|date|breakup|cry|homesick|miss|heart|jealous|love/i],
  ['comic',      /prank|joke|funny|chaos|slacker|clumsy|fail|food|eat|vomit|silly|goof|blooper|panic/i],
  ['strategic',  /alliance|vote|plan|strategy|strateg|intel|whisper|pitch|deal|target|numbers|swing|idol|advantage|confessional/i],
];
function _tone(ev) {
  const hay = `${ev?.type || ''} ${ev?.badgeText || ''} ${ev?.badgeClass || ''}`;
  for (const [tone, re] of TONE_RULES) if (re.test(hay)) return tone;
  return 'neutral';
}

function _blank() { return { units: 0, tones: Object.fromEntries(TONES.map(t => [t, 0])) }; }

// ── Screen-time derivation from what the episode already recorded.
function _deriveScreenTime(ep, active) {
  const st = {};
  const add = (name, units, tone = 'neutral') => {
    if (!name || !active.includes(name)) return;
    if (!st[name]) st[name] = _blank();
    st[name].units += units;
    st[name].tones[tone] += units;
  };

  Object.values(ep.campEvents || {}).forEach(camp => {
    [...(camp?.pre || []), ...(camp?.post || [])].forEach(ev => {
      const tone = _tone(ev);
      (ev?.players || []).forEach(p => add(p, 2, tone));
    });
  });

  if (typeof ep.immunityWinner === 'string') add(ep.immunityWinner, 3, 'strategic');
  (ep.chalPlacements || []).slice(0, 3).forEach(p => { if (typeof p === 'string') add(p, 2); });
  Object.keys(ep.chalMemberScores || {}).forEach(p => add(p, 1));

  [...(ep.votingLog || []), ...(ep.votingLog2 || [])].forEach(v => {
    add(v?.voter, 0.5, 'strategic');
    add(v?.voted, 0.3, 'emotional');
  });

  (ep.idolFinds || []).forEach(f => add(typeof f === 'string' ? f : f?.player, 2, 'strategic'));
  (ep.idolPlays || []).forEach(p => add(p?.player, 2, 'strategic'));

  [ep.eliminated, ep.eliminated2].forEach(n => {
    if (n && !st[n]) st[n] = _blank();
    if (n) { st[n].units += 4; st[n].tones.emotional += 4; }
  });
  return st;
}

// ── Confessional allocation: proportional to screen time, biased by read.
const CONF_BIAS = { comic: 1.3, villain: 1.25, winner: 1.2, decoy: 1.2, growth: 1.1, steady: 1, invisible: 0.6 };
function _allocateConfessionals(st, active, reads) {
  const slots = Math.max(4, Math.min(10, Math.round(active.length * 0.6)));
  const weights = active.map(name => {
    const units = st[name]?.units || 0.25;
    const bias = CONF_BIAS[reads[name]?.key || 'steady'] || 1;
    return { name, w: units * bias * (0.85 + Math.random() * 0.3) };
  }).sort((a, b) => b.w - a.w);
  const total = weights.reduce((s, x) => s + x.w, 0) || 1;
  const conf = {};
  let given = 0;
  weights.forEach(({ name, w }) => {
    const n = Math.min(3, Math.round((w / total) * slots));
    if (n > 0 && given < slots) { conf[name] = Math.min(n, slots - given); given += conf[name]; }
  });
  // Guarantee the top-billed player at least one confessional.
  if (!given && weights[0]) conf[weights[0].name] = 1;
  return conf;
}

// ── Confessional quotes: tone-keyed pools, archetype-voiced, pre-rendered strings.
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const MEAN = new Set(['villain', 'mastermind', 'schemer']);
const QUOTE_POOLS = {
  strategic: [
    `Everybody out here is playing checkers. I'm three moves into a different game entirely.`,
    `The vote tonight isn't about who I like. It's about who's standing between me and the end.`,
    `You count your numbers twice, then you count them again. Then you still sleep with one eye open.`,
    `People think quiet means passive. Quiet means I'm listening to every single conversation at this camp.`,
    `There's a plan A, a plan B, and a plan nobody knows about. Guess which one we're on.`,
  ],
  villainous: [
    `Am I proud of it? No. Am I going to do it again tomorrow? Absolutely.`,
    `They handed me their trust like it was nothing. So I treated it like nothing.`,
    `Every season needs somebody willing to do the ugly thing. Congratulations, it's me.`,
    `I didn't come here to make friends. I came here to make jury members.`,
    `If lying were a challenge, I'd have immunity every single week.`,
  ],
  heroic: [
    `If helping people is a losing strategy, then I'll lose the right way.`,
    `Out here you find out fast who you are. Turns out I'm somebody who shows up for people.`,
    `I told them I'd have their back. Where I'm from, that still means something.`,
    `You can play this game with a knife or with your word. I only brought the one.`,
    `Somebody had to step up today. I just got there first.`,
  ],
  emotional: [
    `I didn't expect this place to get inside my chest like this. It has.`,
    `You spend every waking hour with these people. Of course it stops being just a game.`,
    `I keep telling myself not to care this much. It is not working.`,
    `Tonight hurt. Nobody warns you how much the torch part actually hurts.`,
    `There's what I planned to feel out here, and there's what I actually feel. They are not the same.`,
  ],
  comic: [
    `My strategy? Chaos. My backup strategy? Louder chaos.`,
    `I have no idea what happened out there today and honestly I think that's my superpower.`,
    `They said "play your own game," so I did. Nobody said it had to be a good game.`,
    `I'm not saying I'm the comic relief, but the cameras do find me every time I fall down.`,
    `Day whatever: still here. Scientists are baffled. So am I.`,
  ],
  neutral: [
    `One day at a time. That's the whole plan, and so far the plan is working.`,
    `You survive the vote, you get three more days. Out here that's a lifetime.`,
    `Camp life, challenge, tribal. Rinse, repeat, try not to be the headline.`,
    `I'm exactly where I want to be right now: not on anybody's radar.`,
    `Quiet week for me. Out here, a quiet week is a gift.`,
  ],
};
// ── Archetype voice families: layered ON TOP of the tone pools so a mastermind,
// a hothead, and a goat never sound alike in the same situation.
export const VOICE_FAMILY = {
  villain: 'villain', mastermind: 'villain', schemer: 'villain',
  hero: 'sunny', 'loyal-soldier': 'sunny', 'social-butterfly': 'sunny', showmancer: 'sunny', underdog: 'sunny', goat: 'sunny',
  'chaos-agent': 'chaotic', wildcard: 'chaotic',
  floater: 'observer', 'perceptive-player': 'observer',
  'challenge-beast': 'intense', hothead: 'intense',
};
export const VOICE_POOLS = {
  villain: {
    strategic: [
      `Step one: earn the room. Step two: own the room. Step three: they thank you while you rob them.`,
      `I don't need the numbers to like me. I need the numbers to be mine.`,
      `Everyone here has a price. My job is finding out which currency.`,
      `They call it paranoia. I call it inventory.`,
    ],
    villainous: [
      `Watch the tape back later. You'll see exactly when I decided you were expendable.`,
      `Guilt is a luxury item, and I packed light.`,
      `They think tonight was the betrayal. Tonight was the rehearsal.`,
      `I don't burn bridges. I sell tickets to the fire.`,
    ],
    emotional: [
      `Do I feel something? Sure. I feel ahead.`,
      `You're not supposed to get attached out here. I wrote that rule. I'm... revisiting it.`,
      `The one thing I didn't plan for was actually liking these idiots.`,
    ],
    comic: [
      `Evil laugh? No. This is just my laugh.`,
      `My villain arc has a blooper reel, apparently.`,
      `Even criminal masterminds slip on wet dock wood. Allegedly.`,
    ],
    neutral: [
      `A quiet week. Which means somebody else is finally doing something stupid without me.`,
      `No moves today. Even sharks nap.`,
      `Consider this the calm. You already know what comes after.`,
    ],
  },
  sunny: {
    strategic: [
      `My strategy is simple: be the person people want at the end... and hope nobody does the math.`,
      `I keep my promises. Turns out that's so rare out here it counts as a strategy.`,
      `I'm not playing chess. I'm playing "don't give anybody a reason." So far so good.`,
      `You can vote smart and still vote kind. I'm living proof. For now.`,
    ],
    heroic: [
      `If I go home for helping somebody, then send me home. I can live with that person.`,
      `My mom's watching this. I play like my mom's watching this.`,
      `Trust isn't a weakness. Trust is the whole reason anybody survives this place.`,
      `Today I got to be the reason somebody smiled at this camp. That's a win they can't vote out.`,
    ],
    emotional: [
      `These people started as competition. Somewhere around the campfire they became family.`,
      `I cried tonight. Not embarrassed about it. The torch thing gets everybody eventually.`,
      `Whatever happens at that vote, I want them to know it was real for me.`,
    ],
    comic: [
      `I tripped, I fell, I made everyone laugh, and honestly? Best social move of the week.`,
      `They keep saying I'm too nice for this game. Wait till you see me at the food table.`,
      `I hugged the host. Apparently you're not supposed to hug the host.`,
    ],
    neutral: [
      `Nothing dramatic today. Just sunshine, chores, and not getting voted out. Perfect.`,
      `A good day here is soup, no rain, and nobody whispering your name. Today was a good day.`,
      `Quiet days are when you write the letters home. So that's what I did.`,
    ],
  },
  chaotic: {
    strategic: [
      `My plan is that nobody can plan around me. Including me.`,
      `I flipped a coin for my vote. Then I ignored the coin. That's called an audible.`,
      `They can't read my game because there's nothing to read. I'm improvising the whole novel.`,
      `Predictable players go home. I am many things. That is not one of them.`,
    ],
    villainous: [
      `Was it sabotage or was it performance art? The jury can decide. Literally.`,
      `I lit the fuse mostly to see the colors, and WOW, the colors.`,
      `Somebody had to shake the snow globe. Tag yourself, I'm the blizzard.`,
    ],
    emotional: [
      `Big feelings day. I put them all in a jar and screamed into the jar. Healthy!`,
      `Turns out chaos is a great hiding place for a soft heart. Don't tell anyone.`,
      `I laughed so I wouldn't cry, and then I did both, which is very on brand.`,
    ],
    comic: [
      `The raccoon and I have an understanding now. That's all I can legally say.`,
      `Today's agenda: cause problems on purpose, snack, repeat.`,
      `I don't have a strategy, I have a vibe, and the vibe is ungovernable.`,
      `Somewhere out there is a version of this season where I behaved. Boring season.`,
    ],
    neutral: [
      `A normal day?? Here?? Suspicious. I'm keeping my eye on it.`,
      `Nothing exploded today. I consider that a personal failure.`,
      `Rest day. Even agents of chaos file paperwork sometimes.`,
    ],
  },
  observer: {
    strategic: [
      `Everybody's so busy performing that nobody notices who's watching. That's my whole game.`,
      `I know who's lying, who's cracking, and who's about to do something dumb. I just don't say it out loud.`,
      `The middle of the pack isn't hiding. It's the best seat in the house.`,
      `Loud players make lists. Quiet players make finals.`,
    ],
    emotional: [
      `Watching everyone this closely, you end up caring. That's the part the strategy books skip.`,
      `I noticed tonight who checked on the person crying, and who checked the vote first. I notice everything.`,
      `Being invisible is useful, but some days you'd like one person to really see you.`,
    ],
    comic: [
      `I've said maybe nine words this week and I'm somehow in three alliances. Efficiency.`,
      `People forget I'm in the room. Great for intel, terrible for getting soup passed to me.`,
      `My confessional count is low because I'm busy. Watching. Everything.`,
    ],
    neutral: [
      `Another episode where the storm went around me. That's not luck, that's positioning.`,
      `No votes on me, no heat on me, no headlines. Beautiful.`,
      `I'll speak up when it matters. Today it didn't.`,
    ],
  },
  intense: {
    strategic: [
      `I don't scheme. I win things, and winning things IS the scheme.`,
      `You want to beat me? Beat me out there. The whispering stuff is for people who can't.`,
      `Every challenge I win is a day they can't touch me. Simple math. My favorite math.`,
      `My game plan fits on a sticker: be undeniable.`,
    ],
    heroic: [
      `I carried them up that hill because that's what a team is. Vote me out for it, see if I care.`,
      `Strong is only worth something if somebody else gets to lean on it.`,
      `I don't leave people behind in challenges. Or anywhere.`,
    ],
    emotional: [
      `I train my body every day. Nobody told me to train for THIS.`,
      `I punched a tree today. The tree won. We're both processing.`,
      `Losing doesn't make me cry. Letting people down does. There's a difference.`,
    ],
    comic: [
      `I flexed at a seagull today and it worked. It left.`,
      `Apparently "calm down" is advice and not a personal attack. Growing!`,
      `I did one hundred push-ups so I wouldn't say something at camp. Camp is lucky.`,
    ],
    neutral: [
      `Rest day for the drama, training day for me. There are no rest days for me.`,
      `Quiet camp, full plates, early night. My kind of episode.`,
      `Nothing to report. The competition is Thursday. Everything else is waiting.`,
    ],
  },
};
function _quoteFor(name, tone) {
  const arch = players.find(p => p.name === name)?.archetype;
  let effectiveTone = tone;
  // Archetype voice guard: nice players never deliver villainous confessionals.
  if (tone === 'villainous' && NICE.has(arch)) effectiveTone = 'strategic';
  if (tone === 'heroic' && MEAN.has(arch)) effectiveTone = 'strategic';
  const base = QUOTE_POOLS[effectiveTone] || QUOTE_POOLS.neutral;
  const voice = VOICE_POOLS[VOICE_FAMILY[arch]]?.[effectiveTone] || [];
  // Voice lines lead (2x weight) so archetypes sound distinct; tone pool keeps variety up.
  const pool = [...voice, ...voice, ...base];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Edit reads: EMA features → archetype scores → hysteresis label.
function _updateReads(edit, st, active, ep) {
  const baseline = 1 / Math.max(1, active.length);
  const totalUnits = active.reduce((s, n) => s + (st[n]?.units || 0), 0) || 1;
  const votesRec = {};
  [...(ep.votingLog || []), ...(ep.votingLog2 || [])].forEach(v => { if (v?.voted) votesRec[v.voted] = (votesRec[v.voted] || 0) + 1; });

  active.forEach(name => {
    const s = st[name] || _blank();
    const share = (s.units || 0) / totalUnits;
    const toneShare = t => (s.tones[t] || 0) / Math.max(1, s.units);
    const prev = edit.reads[name]?.ema || { share: baseline, heroic: 0, villainous: 0, comic: 0, strategic: 0, emotional: 0, early: null, epochs: 0 };
    const ema = {
      share: prev.share + EMA_ALPHA * (share - prev.share),
      heroic: prev.heroic + EMA_ALPHA * (toneShare('heroic') - prev.heroic),
      villainous: prev.villainous + EMA_ALPHA * (toneShare('villainous') - prev.villainous),
      comic: prev.comic + EMA_ALPHA * (toneShare('comic') - prev.comic),
      strategic: prev.strategic + EMA_ALPHA * (toneShare('strategic') - prev.strategic),
      emotional: prev.emotional + EMA_ALPHA * (toneShare('emotional') - prev.emotional),
      // First-three-episode average share, frozen: the growth arc's "before" picture.
      early: prev.epochs < 3 ? ((prev.early ?? share) + share) / 2 : (prev.early ?? share),
      // Consecutive episodes clearly above the early-season picture — growth must be sustained.
      riseStreak: share > ((prev.early ?? share) * 1.4 + 0.01) ? (prev.riseStreak || 0) + 1 : 0,
      epochs: prev.epochs + 1,
    };
    const rel = ema.share / baseline;                 // 1 = exactly average presence
    const flawShown = (votesRec[name] || 0) > 0 || (ep.chalPlacements || []).slice(-1)[0] === name;
    const scores = {
      invisible: Math.max(0, 1.4 - rel * 1.4),
      villain:   ema.villainous * 2.4 * Math.min(rel, 1.5),
      comic:     ema.comic * 2.2 * Math.min(rel, 1.5),
      // Growth needs a SUSTAINED rise (2+ consecutive above-early episodes),
      // so one busy episode can't flip a long-invisible player straight to a growth arc.
      growth:    ema.epochs >= 4 && ema.riseStreak >= 2 ? Math.max(0, (ema.share - (ema.early ?? ema.share)) / baseline) * 1.6 : 0,
      winner:    (rel >= 1.05 ? 0.5 : 0) + (ema.heroic + ema.strategic) * 1.3 - ema.villainous * 1.5 - (votesRec[name] || 0) * 0.15,
      decoy:     rel >= 1.5 && flawShown ? 0.4 + (ema.heroic + ema.emotional) : 0,
      steady:    0.35,
    };
    const prevKey = edit.reads[name]?.key || 'steady';
    let bestKey = prevKey, bestScore = (scores[prevKey] || 0) * HYSTERESIS;
    Object.entries(scores).forEach(([k, v]) => { if (v > bestScore) { bestKey = k; bestScore = v; } });
    edit.reads[name] = { key: bestKey, label: EDIT_LABELS[bestKey], score: Math.round((scores[bestKey] || 0) * 100) / 100, ema, _scores: scores };
  });
  // A season cuts ONE winner edit at a time: only the top winner-scorer keeps it,
  // every other claimant falls back to their next-best non-winner read.
  const claimants = active.filter(n => edit.reads[n]?.key === 'winner').sort((a, b) => (edit.reads[b]?.score || 0) - (edit.reads[a]?.score || 0));
  claimants.slice(1).forEach(name => {
    const scores = edit.reads[name]._scores || {};
    const [fallbackKey] = Object.entries(scores).filter(([k]) => k !== 'winner').sort((a, b) => b[1] - a[1])[0] || ['steady'];
    edit.reads[name] = { ...edit.reads[name], key: fallbackKey, label: EDIT_LABELS[fallbackKey], score: Math.round((scores[fallbackKey] || 0) * 100) / 100 };
  });
  active.forEach(n => { if (edit.reads[n]) delete edit.reads[n]._scores; });
  Object.keys(edit.reads).forEach(n => { if (!active.includes(n) && n !== ep.eliminated && n !== ep.eliminated2) delete edit.reads[n]; });
}

// ── Main hook: runs after updateSocialStatus(ep) at every episode-complete site.
export function updateEditLayer(ep) {
  if (seasonConfig?.editLayer === false) return null;
  const active = [...(gs.activePlayers || [])];
  const watched = [...new Set([...active, ep?.eliminated, ep?.eliminated2].filter(Boolean))];
  if (!watched.length || !ep) return null;
  const edit = _ensureEdit();

  const st = _deriveScreenTime(ep, watched);
  const conf = _allocateConfessionals(st, watched, edit.reads);
  _updateReads(edit, st, watched, ep);

  // Quotes for the top-confessional players, voiced by their dominant tone this episode.
  const quotes = Object.entries(conf).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => {
    const tones = st[name]?.tones || {};
    const tone = TONES.reduce((best, t) => (tones[t] || 0) > (tones[best] || 0) ? t : best, 'neutral');
    return { name, tone, text: _quoteFor(name, tone) };
  });

  // Fan-perception drift — the ONLY consequence. Audience only; never the island.
  if (!gs.popularity) gs.popularity = {};
  active.forEach(name => {
    const drift = FAN_DRIFT[edit.reads[name]?.key || 'steady'] || 0;
    if (drift) gs.popularity[name] = (gs.popularity[name] || 0) + drift;
  });

  watched.forEach(name => {
    if (!edit.totals[name]) edit.totals[name] = { units: 0, conf: 0, tones: Object.fromEntries(TONES.map(t => [t, 0])) };
    edit.totals[name].units += st[name]?.units || 0;
    edit.totals[name].conf += conf[name] || 0;
    TONES.forEach(t => { edit.totals[name].tones[t] += st[name]?.tones[t] || 0; });
  });

  const record = {
    ep: ep.num ?? gs.episodeHistory?.length ?? 0,
    units: Object.fromEntries(Object.entries(st).map(([n, v]) => [n, Math.round(v.units * 10) / 10])),
    conf,
    quotes,
    reads: Object.fromEntries(watched.map(n => [n, edit.reads[n]?.key || 'steady'])),
  };
  edit.episodes.push(record);
  ep.editSnapshot = JSON.parse(JSON.stringify(record));
  return record;
}

// ── Finale pass: season tallies + edit awards (live reads stay untouched).
export function finalizeEditSeason() {
  if (seasonConfig?.editLayer === false) return null;
  const edit = _ensureEdit();
  const counts = {};   // { name: { key: episodesHoldingThatRead } }
  edit.episodes.forEach(rec => Object.entries(rec.reads || {}).forEach(([n, k]) => {
    if (!counts[n]) counts[n] = {};
    counts[n][k] = (counts[n][k] || 0) + 1;
  }));
  const mostOf = key => Object.entries(counts).map(([n, c]) => [n, c[key] || 0]).sort((a, b) => b[1] - a[1]).find(x => x[1] > 0)?.[0] || null;
  edit.final = {
    editWinner: mostOf('winner'),
    biggestVillain: mostOf('villain'),
    mostInvisible: mostOf('invisible'),
    comicRelief: mostOf('comic'),
    decoyFavorite: mostOf('decoy'),
    growthArc: mostOf('growth'),
  };
  return edit.final;
}

// ── Read API (UI consumers use these, never the internals) ──
export function editRead(name) { return gs.edit?.reads?.[name] ? { key: gs.edit.reads[name].key, label: gs.edit.reads[name].label } : null; }
export function editArc(name) {
  const arc = [];
  (gs.edit?.episodes || []).forEach(rec => {
    const k = rec.reads?.[name];
    if (k && arc[arc.length - 1] !== k) arc.push(k);
  });
  return arc.map(k => EDIT_LABELS[k] || k);
}
export function editSummary() {
  if (!gs.edit) return null;
  const last = gs.edit.episodes[gs.edit.episodes.length - 1] || null;
  return { reads: gs.edit.reads, totals: gs.edit.totals, latest: last, final: gs.edit.final };
}
