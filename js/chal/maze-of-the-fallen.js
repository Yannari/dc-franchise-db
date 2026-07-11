// js/chal/maze-of-the-fallen.js — "Maze of the Fallen" — post-merge trivia hedge-maze race.
// DC "Carnival of Chaos". The seven-or-so survivors race a moonlit corn/hedge maze. At every crossroad a
// lantern reveals a question about an ELIMINATED MERGE CAMPER (one of the jury) — "Is Marissa's brother
// Eric or Marc?" A wrong turn is a dead-end backtrack and a STRIKE. Two strikes and you're pulled to the
// PIT. First runner to reach the exit wins immunity. If EVERYONE strikes out before anyone escapes, no
// immunity is given and the vote becomes a free-for-all.
//
// SIGNATURE MECHANIC — KNOWLEDGE IS BOND. Whether you know the answer depends on how well you actually knew
// that fallen camper: your BOND with them, plus social/intuition/mental. High bond → you just KNOW ("Marissa
// told me it was Eric"). No bond → you guess 50/50, or you FOLLOW the herd. Runners cluster into PODS that
// hit the same crossroad together; a confident knower leads, others follow — right or wrong. A villain who
// knows the answer can BROADCAST THE WRONG WAY to sink a rival (Zaid misleading Isabel). Meanwhile the PIT
// runs its own parallel arc: reconciliations, comfort, gloating, and eavesdropped intel that feeds the vote.
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
function cohost() { return seasonConfig?.cohostName || 'Chef'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function pickUniq(arr, used) {
  const fresh = arr.filter(x => !used.has(x));
  const chosen = (fresh.length ? fresh : arr)[Math.floor(Math.random() * (fresh.length || arr.length))];
  used.add(chosen); return chosen;
}
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + delta; }
function arch(name) { return players.find(p => p.name === name)?.archetype || 'floater'; }
function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function two(arr) { const a = pick(arr); let b = pick(arr); let g = 0; while (b === a && g++ < 8) b = pick(arr); return [a, b]; }
const VILLAINY = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function canScheme(name) {
  const a = arch(name);
  if (VILLAINY.includes(a)) return true;
  if (NICE.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function allyOf(name, pool) {
  const al = (gs.namedAlliances || []).find(a => a.active && a.members.includes(name) && a.members.some(m => m !== name && pool.includes(m)));
  if (al) { const m = al.members.filter(x => x !== name && pool.includes(x)).sort((a, b) => getBond(name, b) - getBond(name, a)); if (m.length) return m[0]; }
  const friends = pool.filter(m => m !== name && getBond(name, m) >= 3).sort((a, b) => getBond(name, b) - getBond(name, a));
  return friends[0] || null;
}
function rivalOf(name, pool) {
  const foes = pool.filter(m => m !== name && getBond(name, m) <= -1).sort((a, b) => getBond(name, a) - getBond(name, b));
  return foes[0] || null;
}
// scope-gated heat: a pit-runner who learns something about an active player hunts them at the vote.
function _epScope() { return (gs.episode || 0) + 2; }
function _mazeHeat(target, amount) {
  if (!gs._mazeHeat) gs._mazeHeat = {};
  const prev = gs._mazeHeat[target]?.amount || 0;
  gs._mazeHeat[target] = { amount: Math.max(prev, amount), expiresEp: _epScope() };
}

// ══════════════════════════════════════════════════════════════
// THE FALLEN — questions about eliminated merge campers. The "truth" is cosmetic dressing; whether a runner
// GETS it right is driven by knowledge (bond + stats), not the fact itself.
// Universe-safe: no real countries. Personal, fun, binary.
// ══════════════════════════════════════════════════════════════
const SIB_NAMES = ['Eric', 'Marc', 'Devon', 'Cole', 'Tobias', 'Kwame', 'Diego', 'Priya', 'Lena', 'Reese', 'Kelsea', 'Nadia', 'Bram', 'Otto'];
const PETS = ['golden retriever', 'grumpy tabby cat', 'pot-bellied pig', 'talkative cockatiel', 'ball python', 'lop-eared rabbit', 'sneaky ferret', 'goldfish named Captain'];
const FOODS = ['spicy noodle soup', 'triple-stacked grilled cheese', 'mango sticky rice', 'loaded nachos', 'garlic butter shrimp', 'cold sesame noodles', 'deep-dish veggie pie', 'honey fried chicken'];
const JOBS = ['a marine biologist', 'an accountant', 'a self-defense instructor', 'a pastry chef', 'a paramedic', 'a game designer', 'a court stenographer', 'a stunt coordinator'];
const MUSIC = ['K-pop', 'J-pop', 'synthwave', 'bluegrass', 'death metal', 'lo-fi hip hop', 'sea shanties', 'opera'];
const AILMENTS = ['seasickness', 'motion sickness', 'a peanut allergy', 'chronic hiccups', 'a fear of clowns', 'sleepwalking', 'a shellfish allergy', 'stage fright'];
const TEAMS = ['Beavertails', 'Moosehorns', 'Timber Wolves', 'Mud Hens', 'Screaming Otters', 'Iron Pigeons', 'Frostbites', 'Jackalopes'];
const LANDMARKS = ['giant pierogi statue', "world's longest boardwalk", 'haunted lighthouse', 'annual cheese roll', 'singing bridge', 'glow-worm caves', 'floating night market', 'clockwork museum'];
const COLLECTS = ['vintage stamps', 'enamel pins', 'trading cards', 'pressed flowers', 'ticket stubs', 'rare vinyl', 'antique keys', 'sea glass'];
const KARAOKE = ['power ballad', 'disco anthem', 'breakup country song', 'boy-band classic', 'one-hit wonder', 'showtune', 'punk single', 'slow jam'];
const COFFEE = ['black as tar', 'drowned in oat milk', 'with six sugars', 'as a triple espresso', 'iced year-round', 'only ever tea'];
const FEARS = ['deep water', 'heights', 'spiders', 'the dark', 'being forgotten', 'public speaking', 'clowns', 'tight spaces'];
const TATTOOS = ['tiny anchor', 'wolf howling at the moon', "grandma's handwriting", 'small constellation', 'koi fish', 'bar of sheet music', 'single semicolon', 'pair of dice'];
const VACAY = ['a silent meditation retreat', 'a chaotic theme-park marathon', 'a backcountry canoe trip', 'a rooftop-bar city crawl', 'a haunted-castle tour', 'a beachfront hammock and nothing else'];
const DESSERTS = ['molten lava cake', 'a banana split', 'key lime pie', 'a churro tower', 'an affogato', 'a cotton-candy burrito'];

const Q_TEMPLATES = [
  (F, pr) => { const [a, b] = two(SIB_NAMES); const sib = Math.random() < 0.5 ? 'brother' : 'sister'; return { text: `Is ${F}'s ${sib} named ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(PETS); return { text: `Was ${F}'s childhood pet a ${a} or a ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(FOODS); return { text: `Did ${F} say ${pr.posAdj} favorite food was ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(JOBS); return { text: `Was ${F} training to be ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(MUSIC); return { text: `Is ${F}'s favorite music genre ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(AILMENTS); return { text: `Does ${F} suffer from ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(TEAMS); return { text: `Was ${F}'s old team the ${a} or the ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(LANDMARKS); return { text: `Is ${F}'s hometown known for its ${a} or its ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(COLLECTS); return { text: `Did ${F} collect ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(KARAOKE); return { text: `Was ${F}'s go-to karaoke number a ${a} or a ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(COFFEE); return { text: `Does ${F} take ${pr.posAdj} coffee ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(FEARS); return { text: `Was ${F}'s biggest fear ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(TATTOOS); return { text: `Did ${F} have a ${a} tattoo or a ${b} tattoo?`, a, b }; },
  (F, pr) => { const [a, b] = two(VACAY); return { text: `Was ${F}'s dream vacation ${a} or ${b}?`, a, b }; },
  (F, pr) => { const [a, b] = two(DESSERTS); return { text: `Did ${F} always order ${a} or ${b}?`, a, b }; },
];
function buildQuestion(F, usedTpl) {
  const pr = pronouns(F);
  const idxPool = Q_TEMPLATES.map((_, i) => i).filter(i => !usedTpl.has(i));
  const idx = (idxPool.length ? pick(idxPool) : Math.floor(Math.random() * Q_TEMPLATES.length));
  usedTpl.add(idx);
  const q = Q_TEMPLATES[idx](F, pr);
  const truthA = Math.random() < 0.5;            // which door is correct (cosmetic)
  return { subject: F, text: q.text, optA: q.a, optB: q.b, truthA };
}

// ══════════════════════════════════════════════════════════════
// NARRATION POOLS
// ══════════════════════════════════════════════════════════════
const HOST_OPEN = [
  (h) => `${h} spreads an arm toward a towering moonlit hedge maze, lanterns glowing at every fork. "Simple. Race the maze. At each crossroad a question about someone we've already sent home. Wrong turn's a dead end — and a strike. Two strikes, you're out. First one to the exit wins immunity."`,
  (h) => `${h} taps a lantern hanging over the maze mouth. "Tonight you find out how well you actually LISTENED to the people you voted off. Every crossroad, a question about a fallen camper. Two wrong answers and the maze eats you. Reach the far side first — immunity."`,
  (h) => `${h} gestures at the fog rolling off the hedges. "In you go. Answer right, keep moving. Answer wrong, backtrack — that's a strike. Two and you're done. And if NOBODY makes it out? No immunity. Free-for-all at the vote. Sleep tight."`,
  (h) => `${h} grins under the harvest moon. "You've watched a lot of people leave this game. Paid attention? We'll see. Questions about the fallen at every fork, two strikes and out, first to escape takes immunity. Good luck remembering."`,
];
const RULE_ADD = [
  () => `A camper asks what happens if the whole field wipes out before anyone escapes. The host shrugs: no immunity, and the night ends on a free-for-all vote. Nobody loves that answer.`,
  () => `"And if we all strike out?" someone calls. "Then nobody's safe and you vote it out cold," the host says cheerfully. The runners exchange looks and hurry to the entrance.`,
];
const POD_FORM = [
  (names) => `${names} fall in together at the mouth of the maze — safety in numbers, or so they hope.`,
  (names) => `${names} stick close as the hedges swallow the moonlight, moving as a pack.`,
  (names) => `A cluster forms: ${names}, trading glances, betting that someone among them knows the answers.`,
];
const SOLO_START = [
  (n) => `${n} peels away from everyone and takes the maze alone — no dead weight, no one to blame.`,
  (n) => `${n} doesn't wait for a pack. ${pronouns(n).Sub === 'They' ? 'They plunge' : pronouns(n).Sub + ' plunges'} in solo, trusting ${pronouns(n).posAdj} own head.`,
];
const KNEW = [
  (n, f, opt) => `${n} doesn't hesitate — heads for ${opt}. "${f} told me that ${pronouns(n).ref === 'themself' ? 'themselves' : 'straight up'}." Dead right.`,
  (n, f, opt) => `${n} knows this cold and swings toward ${opt}. Time spent listening to ${f} pays off. Correct.`,
  (n, f, opt) => `No pause from ${n} — straight to ${opt}. ${pronouns(n).Sub} and ${f} used to talk for hours. Right answer.`,
  (n, f, opt) => `${n} smiles, takes ${opt} without breaking stride. "${f} never shut up about that." Nailed it.`,
];
const FOLLOWED_OK = [
  (n, l, opt) => `${n} has no idea — but ${l} looks sure, so ${n} tucks in behind and takes ${opt}. Lucky faith: it's right.`,
  (n, l, opt) => `${n} shrugs and follows ${l} toward ${opt}. The herd bets on the smart one, and this time the bet pays. Correct.`,
  (n, l, opt) => `Clueless, ${n} watches ${l} commit to ${opt} and copies. Right call — ${l} carried them through.`,
];
const GUESS_RIGHT = [
  (n, opt) => `${n} flips a mental coin and picks ${opt}. Pure luck — it's right.`,
  (n, opt) => `${n} has nothing to go on, guesses ${opt}, and gets away with it. Correct.`,
  (n, opt) => `A total shrug from ${n}, a step toward ${opt} — and somehow, right.`,
];
const GUESS_WRONG = [
  (n, opt) => `${n} guesses ${opt} on a hunch. Wrong turn — into a dead end, and a strike.`,
  (n, opt) => `${n} picks ${opt} with zero certainty. The hedge closes on a wall. Strike.`,
  (n, opt) => `${n} takes ${opt} and immediately regrets it — backtracking out of a dead end. That's a strike.`,
];
const FOLLOWED_BAD = [
  (n, l, opt) => `${n} trusts ${l} and follows toward ${opt} — but ${l} was bluffing confidence. Dead end. Strike for ${n}.`,
  (n, l, opt) => `${n} copies ${l} to ${opt}. Bad bet: ${l} had no clue either. Both eat a wall. Strike.`,
];
const FOLLOWED_MISS = [
  (n, l, opt) => `${n} follows ${l} to ${opt} in good faith — but even ${l} got this one wrong. Both hit the wall. Strike for ${n}.`,
  (n, l, opt) => `${n} trusts ${l} toward ${opt}. Honest mistake, shared: ${l} misremembered, and ${n} pays for it. Strike.`,
  (n, l, opt) => `${n} rides ${l}'s call to ${opt} — and ${l} was wrong for once. Dead end. Strike.`,
];
const KNEW_WRONG = [
  (n, f, opt) => `${n} is SURE it's ${opt} — "I'd stake my game on it" — and stakes it wrong. Even ${pronouns(n).sub} misremembered ${f}. Strike, and a stunned look.`,
  (n, f, opt) => `${n} commits confidently to ${opt}... and hits a wall. Turns out ${pronouns(n).sub} didn't know ${f} as well as ${pronouns(n).sub} thought. Strike.`,
  (n, f, opt) => `${n} takes ${opt} without a second thought — and it's the dead end. A rare blank on ${f}. Strike.`,
];
const REASONED = [
  (n, opt) => `${n} doesn't know it cold, but reasons through both doors and commits to ${opt}. Solid deduction — right.`,
  (n, opt) => `${n} narrows it down, weighs the odds, and picks ${opt}. Pieced it together. Correct.`,
  (n, opt) => `${n} trusts a careful gut read toward ${opt}. Good instinct — right.`,
  (n, opt) => `${n} eliminates the unlikely one and steps toward ${opt}. Smart process. Correct.`,
];
const SPLIT = [
  (a, b, oa, ob) => `The pod splits at the fork — ${a} goes for ${oa}, ${b} breaks the other way toward ${ob}. Only one hedge leads onward.`,
  (a, b, oa, ob) => `Disagreement at the crossroad: ${a} commits to ${oa}, ${b} to ${ob}. They part ways into the fog.`,
];
const SABOTAGE = [
  (s, v, opt) => `${s} knows the answer — and loudly "realizes" it's ${opt}, selling it hard to ${v}. It's a lie. ${s} slips quietly the right way while ${v} marches confidently into a dead end.`,
  (s, v, opt) => `${s} points ${v} toward ${opt} with total conviction. Total fiction. ${v} buys it and backtracks out of a wall a moment later, fuming. ${s} is already gone.`,
  (s, v, opt) => `"It's ${opt}, trust me," ${s} tells ${v} — steering ${pronouns(v).obj} wrong on purpose to keep ${pronouns(v).obj} off the podium. ${v} takes the bait. Strike.`,
];
const SAB_CONF = [
  (s, v) => `${s}: "Getting ${v} out of my way matters more than my own time here. If ${pronouns(v).sub} wins immunity, that plan's dead. So... sorry not sorry."`,
  (s, v) => `${s}: "${v} thinks I'm helping. I am helping — myself. Wrong door, ${pronouns(v).obj} goes."`,
  (s, v) => `${s}: "Mess with my friends, you mess with me. ${v} messed with my friends."`,
];
const SUSPECT_CONF = [
  (w, s) => `${w}: "Even I know that one, and I barely knew them. Why is ${s} sending people the wrong way? ...Oh. Oh, that's clever."`,
  (w, s) => `${w}: "${s} is up to something in there. That was NOT an honest mistake."`,
];
const FOLLOW_CONF = [
  (w, l) => `${w}: "If anyone in here knows this stuff, it's ${l}. Why is nobody else just following ${pronouns(l).obj}?"`,
  (w, l) => `${w}: "I'm sticking to ${l} like glue. ${pronouns(l).Sub} actually talked to these people."`,
];
const BREAKOFF = [
  (n) => `${n} has pulled clear of the pack — and breaks off alone, trusting ${pronouns(n).posAdj} own memory the rest of the way.`,
  (n) => `Confident now, ${n} abandons the group and sprints ahead solo. No more waiting on anyone.`,
];
const ELIM = [
  (n) => `Second strike. ${n} hits a dead end with nowhere left to go and is pulled from the maze — off to the pit.`,
  (n) => `That's two. ${n} takes the wrong hedge one time too many and is out, marched down to the pit to watch the rest.`,
  (n) => `${n}'s second wrong turn ends it. Out of the challenge, into the pit — but still very much in the game.`,
  (n) => `The maze claims ${n}: two strikes, done. ${pronouns(n).Sub} trudges to the pit, replaying every fork.`,
];
const ELIM_GLOAT = [
  (r, f) => `${r}, still in the maze, hears ${f} get pulled and can't help a grin. "One down." ${f}, in the pit, files it away.`,
  (r, f) => `"Bye," ${r} calls toward the pit as ${f} goes out. The kind of thing that gets remembered at the vote.`,
];
const PROGRESS_FLAV = [
  (n) => `${n} threads a tight corner and presses deeper into the hedges.`,
  (n) => `${n} pauses at a lantern, gets ${pronouns(n).posAdj} bearings, and pushes on.`,
  (n) => `${n} jogs a long straight, breath fogging in the cold, gaining ground.`,
  (n) => `Fog swirls around ${n} as ${pronouns(n).sub} rounds another blind turn.`,
];
// PIT — parallel social arc
const PIT_RECONCILE = [
  (a, b) => `Down in the pit, ${a} offers ${b} a hand up out of the mud. Old friction melts — the two finally talk it out, quiet and real. Whatever was broken between them mends here.`,
  (a, b) => `${a} and ${b}, both out, end up shoulder to shoulder in the pit. ${a} admits ${pronouns(a).sub === 'they' ? "they've" : "they've"} been unfair. They hash it out and, to everyone's surprise, hug it out.`,
  (a, b) => `In the pit, ${a} tells ${b} the truth: the anger was never really about ${pronouns(b).obj}. ${b} softens. A grudge dies in the mud tonight.`,
];
const PIT_COMFORT = [
  (a, b) => `${a} slides down next to a gutted ${b} in the pit. "You played it right, the maze just didn't love you." ${b} manages a laugh. Something like an alliance flickers.`,
  (a, b) => `${a} talks ${b} down off the ledge in the pit — reassuring, steady. ${b} won't forget who showed up when it went wrong.`,
];
const PIT_GLOAT = [
  (a, b) => `${a} needles ${b} across the pit about how it all fell apart. ${b} goes cold. That's a bridge charred, not burned.`,
  (a, b) => `${a} can't resist twisting the knife on ${b} down in the pit. ${b} says nothing — and remembers everything.`,
];
const PIT_INTEL = [
  (w, x, y) => `From the pit, ${w} overhears ${x} bragging about steering the last vote onto ${y} — and files the confession away like gold. "Now what to DO with that," ${w} muses. ${x} just made an enemy who knows too much.`,
  (w, x) => `${w}, stuck in the pit, catches ${x} letting slip exactly who ${pronouns(x).sub}'s been playing. ${w} smiles slow. That secret's a weapon now.`,
  (w, x) => `The pit has ears. ${w} clocks ${x}'s whole game in one careless sentence — and tucks it away for the vote to come.`,
];
const PIT_CONF = [
  (w) => `${w}: "Fascinating, what you overhear when everyone thinks you're out of it. I'm rather excited to find out what to do with it."`,
  (w) => `${w}: "They forget the pit can hear. Their loss. My leverage."`,
];
const WIN_TXT = [
  (n) => `${n} steps out of the last hedge into open moonlight — the exit. Immunity, and a very smug walk back.`,
  (n) => `The maze spits ${n} out at the far side first. Arms up, immunity clinched. Nobody else even close.`,
  (n) => `${n} reaches the exit lantern and rings the bell. Individual immunity — earned by actually listening.`,
];
const FREE_FOR_ALL = [
  () => `The last runner hits a second strike with the exit still unreached. Nobody escaped. No immunity tonight — the vote is a free-for-all, and everyone can feel the floor drop out.`,
  () => `And then there are none — every runner struck out short of the exit. The maze wins. No immunity, and a wide-open, anyone-goes vote to close the night.`,
];

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateMazeOfTheFallen(ep) {
  const active = [...gs.activePlayers].filter(p => p !== ep.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  const usedTxt = new Set();
  const usedTpl = new Set();
  const hostOpener = pick(HOST_OPEN)(host());

  // THE FALLEN pool — jury (post-merge boots) preferred; fall back to all eliminated; last resort each other
  let fallen = (gs.jury && gs.jury.length >= 2) ? [...gs.jury]
    : (gs.eliminated && gs.eliminated.length ? [...gs.eliminated] : []);
  if (!fallen.length) fallen = active.slice(); // degenerate: no one gone yet → quiz about each other
  const fallenPool = () => pick(fallen);

  // MAZE geometry — nodes 0..LEN (LEN = exit). Longer field → slightly longer maze.
  const LEN = clamp(active.length - 1, 5, 8);

  // per-runner state
  const st = {};
  active.forEach((n, i) => {
    const s = pStats(n);
    st[n] = {
      idx: i, progress: 0, strikes: 0, status: 'maze', pod: null, time: 0,
      // how independently a runner trusts their own head (loner tendency)
      loner: s.intuition * 0.35 + s.strategic * 0.3 - s.social * 0.15 + (arch(n) === 'mastermind' ? 2 : 0) + noise(2),
    };
  });

  // knowledge = ATTENTIVENESS (does this runner actually pay attention to people?) + BOND with the subject.
  // A people-reader knows facts about everyone; a bonded friend knows THIS person cold; a self-absorbed
  // player is a coin-flip. ownCorrect() turns knowledge into a hit chance — sharp/bonded runners reliably
  // clear the maze, dim ones strike out, so a winner usually emerges but the free-for-all stays possible.
  // bond already carries the relationship, so recall is driven mostly by MENTAL (memory), then INTUITION
  // (reading people), then a light SOCIAL touch (were they even paying attention to others).
  function attn(P) {
    const s = pStats(P); const a = arch(P);
    let base = s.mental * 0.42 + s.intuition * 0.34 + s.social * 0.14;
    if (a === 'perceptive-player') base += 2;
    else if (a === 'mastermind' || a === 'social-butterfly' || a === 'schemer') base += 1;
    return base;
  }
  const EXPERT = 9; // a clear knower — leads the pod, narrated "KNEW IT"
  function knowledge(P, F) {
    if (P === F) return 24;
    return clamp(attn(P) + getBond(P, F) * 1.3 + noise(2.2), 0, 22);
  }
  const ownCorrect = (kn) => Math.random() < clamp(0.5 + (kn - 4.0) * 0.085, 0.38, 0.95);

  // ── POD FORMATION — affinity clusters; loners split off solo ──
  const beats = [];   // flat, chronological; each tagged with .phase and .snap
  let stepCounter = 0;
  const snap = () => {
    const m = {};
    active.forEach(n => { m[n] = { progress: st[n].progress, strikes: st[n].strikes, status: st[n].status, pod: st[n].pod }; });
    return m;
  };
  let curPhase = 'early';
  const push = (ev) => { ev.step = stepCounter++; ev.phase = curPhase; ev.snap = snap(); beats.push(ev); };

  // build pods
  let pods = [];
  const unassigned = [...active].sort((a, b) => st[b].loner - st[a].loner);
  // strongest loners start solo (Jade-style), capped so there's still herd drama
  const soloCount = clamp(Math.round(active.length * 0.18), 1, 2);
  const soloStarters = unassigned.filter(n => st[n].loner > 2).slice(0, soloCount);
  soloStarters.forEach(n => { const id = pods.length; pods.push({ id, members: [n] }); st[n].pod = id; });
  let rest = unassigned.filter(n => !soloStarters.includes(n)).sort((a, b) => pStats(b).social - pStats(a).social);
  while (rest.length) {
    const seed = rest.shift();
    const id = pods.length;
    const podM = [seed];
    // attach up to 2 best-bonded remaining (herd around the social seed)
    const buddies = rest.filter(x => getBond(seed, x) >= -1).sort((a, b) => getBond(seed, b) - getBond(seed, a)).slice(0, 2);
    buddies.forEach(b => { podM.push(b); rest = rest.filter(x => x !== b); });
    podM.forEach(m => st[m].pod = id);
    pods.push({ id, members: podM });
  }
  // STALKER — a scheming player may deliberately fall in with a RIVAL's pod, to steer them wrong from
  // within (Zaid sticking to Isabel). This is what makes sabotage possible: friends cluster, so a villain
  // has to CHOOSE to shadow the person they want out.
  active.filter(n => canScheme(n)).forEach(s => {
    const r = rivalOf(s, active);
    if (!r || st[s].pod === st[r].pod) return;
    const rp = pods.find(p => p.id === st[r].pod), sp = pods.find(p => p.id === st[s].pod);
    if (!rp || !sp || rp.members.length >= 4) return;
    if (Math.random() < 0.5) { sp.members = sp.members.filter(x => x !== s); rp.members.push(s); st[s].pod = rp.id; }
  });
  pods = pods.filter(p => p.members.length); // drop any pod emptied by relocation

  push({ type: 'intro', text: hostOpener, badge: '🌽 THE MAZE OF THE FALLEN', badgeClass: 'gold' });
  push({ type: 'rule', text: pick(RULE_ADD)(), badge: '❓ FREE-FOR-ALL RULE', badgeClass: 'purple' });
  pods.forEach(p => {
    if (p.members.length === 1) push({ type: 'podForm', players: [p.members[0]], text: pick(SOLO_START)(p.members[0]), badge: '🏃 SOLO RUN', badgeClass: 'teal', pod: p.id });
    else push({ type: 'podForm', players: [...p.members], text: pick(POD_FORM)(p.members.join(', ')), badge: '👥 POD', badgeClass: 'teal', pod: p.id });
  });

  // ── romance hooks (downtime + danger inside the maze) ──
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || (ep.chalMemberScores = {}), 'danger', null);
  for (let i = 0; i < active.length && i < 2; i++) {
    const a = active[i], b = active[(i + 1) % active.length];
    if (a && b && a !== b) _challengeRomanceSpark(a, b, ep, null, null, ep.chalMemberScores, 'the maze');
  }

  const inMaze = () => active.filter(n => st[n].status === 'maze');
  const pitFolk = () => active.filter(n => st[n].status === 'pit');
  let winner = null;
  const sabUsed = {};       // saboteur → count (cap 2/game each)
  const pitUsed = { reconcile: false };
  let round = 0;

  // resolve ONE pod's crossroad
  const runPodCrossroad = (pod) => {
    const members = pod.members.filter(n => st[n].status === 'maze');
    if (!members.length || winner) return;
    const F = fallenPool();
    const q = buildQuestion(F, usedTpl.size >= Q_TEMPLATES.length ? new Set() : usedTpl);
    const optOf = a => a ? q.optA : q.optB;
    const correctIsA = q.truthA;

    // knowledge across the pod
    const kmap = {}; members.forEach(n => kmap[n] = knowledge(n, F));
    const experts = members.filter(n => kmap[n] >= EXPERT);

    // SABOTAGE — a scheming pod-mate who KNOWS this answer (rolls it right) steers a less-sure rival the
    // wrong way on purpose, then slips off correctly themselves (Zaid misleading Isabel). Gated on the
    // schemer actually getting THIS question right, not an absolute knowledge bar — so it tracks who's
    // confident this crossroad. Mid frequency.
    let saboteur = null, sabVictim = null, sabKnows = false;
    const schemerCand = members.filter(n => canScheme(n) && (sabUsed[n] || 0) < 2 && kmap[n] >= 6);
    for (const s of schemerCand) {
      const pool = members.filter(m => m !== s && kmap[m] < kmap[s] - 1); // someone plausibly less sure
      let tgt = rivalOf(s, pool);
      if (!tgt && ['mastermind', 'schemer', 'villain'].includes(arch(s)) && pool.length)
        tgt = pool.slice().sort((a, b) => (pStats(b).strategic + pStats(b).social) - (pStats(a).strategic + pStats(a).social))[0];
      if (tgt && ownCorrect(kmap[s]) && Math.random() < 0.42) { saboteur = s; sabVictim = tgt; sabKnows = true; break; }
    }

    // honest leader = strongest NON-saboteur knower (followers trust them, not the liar)
    const honestLeader = members.filter(n => n !== saboteur).slice().sort((a, b) => kmap[b] - kmap[a])[0];
    const leaderKnows = honestLeader && kmap[honestLeader] >= EXPERT;
    const leaderRight = leaderKnows ? ownCorrect(kmap[honestLeader]) : false;

    const choices = [];
    const outcomes = {};   // name → {wentA, correct, mode, leader}
    members.forEach(n => {
      const kn = kmap[n];
      let wentA, correct, mode, ldr = null;
      if (n === saboteur) { correct = true; mode = 'sabotaging'; wentA = correctIsA; }
      else if (n === sabVictim && saboteur) { correct = false; mode = 'sabotaged'; ldr = saboteur; wentA = !correctIsA; }
      else if (n === honestLeader && kn >= EXPERT) { correct = ownCorrect(kn); mode = 'knew'; wentA = correct ? correctIsA : !correctIsA; }
      else if (leaderKnows && n !== honestLeader && kn < EXPERT && getBond(n, honestLeader) >= -1 && Math.random() < 0.7) {
        correct = leaderRight; mode = 'followed'; ldr = honestLeader; wentA = correct ? correctIsA : !correctIsA;
      } else {
        correct = ownCorrect(kn); mode = kn >= EXPERT ? 'knew' : (kn >= 6 ? 'reasoned' : 'guessed');
        wentA = correct ? correctIsA : !correctIsA;
      }
      outcomes[n] = { wentA, correct, mode, leader: ldr };
      choices.push({ name: n, wentA, correct, mode, leader: ldr });
    });

    // emit the crossroad flashcard
    push({
      type: 'crossroad', pod: pod.id, subject: F, question: q,
      optA: q.optA, optB: q.optB, correctIsA, choices,
      badge: `❓ CROSSROAD · ${F.toUpperCase()}`, badgeClass: 'blue',
    });

    // per-member narration + apply consequences
    // a confessional if someone is following a clear knower, or suspects a saboteur
    let firedConf = false;
    members.forEach(n => {
      const o = outcomes[n];
      const opt = optOf(o.wentA);
      if (o.mode === 'sabotaging' || o.mode === 'sabotaged') return; // narrated by the sabotage beat
      let txt, badge, bc, players = [n];
      if (o.mode === 'knew') {
        if (o.correct) { txt = pick(KNEW)(n, F, opt); badge = '✅ KNEW IT'; bc = 'green'; }
        else { txt = pick(KNEW_WRONG)(n, F, opt); badge = '❌ BLANKED'; bc = 'red'; }
      } else if (o.mode === 'followed') {
        players = [n, o.leader];
        if (o.correct) { txt = pick(FOLLOWED_OK)(n, o.leader, opt); badge = '🐑 FOLLOWED'; bc = 'green'; }
        else { txt = pick(FOLLOWED_MISS)(n, o.leader, opt); badge = '🐑 MISLED'; bc = 'red'; }
      } else if (o.mode === 'reasoned') {
        if (o.correct) { txt = pick(REASONED)(n, opt); badge = '🧠 REASONED'; bc = 'green'; }
        else { txt = pick(GUESS_WRONG)(n, opt); badge = '❌ WRONG TURN'; bc = 'red'; }
      } else { // guessed
        if (o.correct) { txt = pick(GUESS_RIGHT)(n, opt); badge = '🎲 LUCKY GUESS'; bc = 'green'; }
        else { txt = pick(GUESS_WRONG)(n, opt); badge = '❌ WRONG TURN'; bc = 'red'; }
      }
      // apply
      applyAnswer(n, o.correct);
      push({ type: 'answer', players, text: txt, badge, badgeClass: bc, correct: o.correct, mode: o.mode });
      // follow-confessional (once per crossroad)
      if (!firedConf && o.mode === 'followed' && leaderKnows && Math.random() < 0.5) {
        firedConf = true;
        push({ type: 'confessional', players: [n], text: pick(FOLLOW_CONF)(n, o.leader), badge: '🎥 CONFESSIONAL', badgeClass: 'grey' });
      }
    });

    // SABOTAGE beat + consequences (after the honest answers, so the wrong turn reads clean)
    if (saboteur && sabVictim) {
      sabUsed[saboteur] = (sabUsed[saboteur] || 0) + 1;
      const opt = optOf(!correctIsA);
      applyAnswer(saboteur, true);
      applyAnswer(sabVictim, false);
      push({ type: 'sabotage', players: [saboteur, sabVictim], subject: F, text: pick(SABOTAGE)(saboteur, sabVictim, opt), badge: '🗡️ SABOTAGE', badgeClass: 'red' });
      push({ type: 'confessional', players: [saboteur], text: pick(SAB_CONF)(saboteur, sabVictim), badge: '🎥 CONFESSIONAL', badgeClass: 'grey' });
      addBond(sabVictim, saboteur, -2.5); popDelta(saboteur, canScheme(saboteur) ? -1 : 0);
      // discovery: a sharp victim (or witness) realizes the lie → extra heat + suspicion confessional
      const witness = members.find(m => m !== saboteur && m !== sabVictim && pStats(m).intuition >= 6);
      const detector = pStats(sabVictim).intuition >= 6 ? sabVictim : witness;
      if (detector && Math.random() < clamp(0.35 + pStats(detector).intuition * 0.05, 0.3, 0.9)) {
        _mazeHeat(saboteur, 2.0);
        push({ type: 'confessional', players: [detector], text: pick(SUSPECT_CONF)(detector, saboteur), badge: '🎥 CONFESSIONAL', badgeClass: 'grey' });
      } else {
        _mazeHeat(saboteur, 1.2);
      }
      // camp event
      (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
        type: 'mazeSabotage', players: [sabVictim, saboteur], tag: 'maze-of-the-fallen',
        text: `${saboteur} deliberately steered ${sabVictim} into a dead end in the maze — sabotaging ${pronouns(sabVictim).posAdj} shot at immunity. ${sabVictim} isn't going to forget it at the vote.`,
        badgeText: 'SABOTAGED', badgeClass: 'red',
      });
    }

    // SPLIT color — if a pod of guessers genuinely diverged, note it
    if (members.length >= 2 && !saboteur) {
      const goers = members.filter(n => ['guessed'].includes(outcomes[n].mode));
      if (goers.length >= 2 && new Set(goers.map(n => outcomes[n].wentA)).size === 2 && Math.random() < 0.5) {
        const a = goers.find(n => outcomes[n].wentA), b = goers.find(n => !outcomes[n].wentA);
        if (a && b) push({ type: 'split', players: [a, b], text: pick(SPLIT)(a, b, optOf(true), optOf(false)), badge: '🔀 POD SPLITS', badgeClass: 'amber' });
      }
    }
  };

  // apply an answer's mechanical effect
  function applyAnswer(n, correct) {
    if (st[n].status !== 'maze') return;
    if (correct) {
      st[n].progress += 1; st[n].time += 4 + Math.abs(noise(1.5));
      if (st[n].progress >= LEN && !winner) { winner = n; st[n].status = 'done'; }
    } else {
      st[n].strikes += 1; st[n].time += 10 + Math.abs(noise(2)); // dead-end backtrack costs real time
      if (st[n].strikes >= 2) { st[n].status = 'pit'; }
    }
  }

  // process eliminations that just happened this round → narration + gloat + pit intake
  const flushEliminations = (justOut) => {
    justOut.forEach(f => {
      push({ type: 'elim', players: [f], text: pick(ELIM)(f), badge: '💀 TWO STRIKES · OUT', badgeClass: 'grey' });
      const gloater = inMaze().find(x => getBond(x, f) <= -2 && (canScheme(x) || Math.random() < 0.5));
      if (gloater && Math.random() < 0.5) {
        addBond(gloater, f, -1); popDelta(gloater, -1);
        push({ type: 'gloat', players: [gloater, f], text: pick(ELIM_GLOAT)(gloater, f), badge: '😏 GLOATS', badgeClass: 'red' });
      }
    });
  };

  // PIT parallel arc — one (rarely two) beat per round once the pit has bodies
  const runPit = () => {
    const pit = pitFolk();
    if (pit.length < 1) return;
    // RECONCILE — two pit-mates with friction who finally talk it out (Amelie/Hannah)
    if (pit.length >= 2 && !pitUsed.reconcile && Math.random() < 0.5) {
      const pairs = [];
      for (let i = 0; i < pit.length; i++) for (let j = i + 1; j < pit.length; j++) {
        const b = getBond(pit[i], pit[j]); if (b <= 2) pairs.push([pit[i], pit[j], b]);
      }
      if (pairs.length) {
        pitUsed.reconcile = true;
        const [a, b] = pairs.sort((x, y) => x[2] - y[2])[0];
        addBond(a, b, 4); popDelta(a, 1); popDelta(b, 1);
        push({ type: 'pit', players: [a, b], text: pick(PIT_RECONCILE)(a, b), badge: '🕊️ THE PIT · MENDED', badgeClass: 'pit' });
        (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
          type: 'mazePitMend', players: [a, b], tag: 'maze-of-the-fallen',
          text: `Stuck in the maze pit together, ${a} and ${b} finally squashed their beef — a real reconciliation. They're on better terms heading into the vote.`,
          badgeText: 'RECONCILED', badgeClass: 'green',
        });
        return;
      }
    }
    // INTEL — a perceptive pit-runner overhears an active schemer's game (Amelie overhears Logan)
    if (Math.random() < 0.5) {
      const watcher = pit.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      const schemer = inMaze().find(x => canScheme(x) && x !== watcher);
      if (watcher && schemer && pStats(watcher).intuition >= 5) {
        const y = rivalOf(schemer, active) || active.find(x => x !== schemer && x !== watcher);
        _mazeHeat(schemer, 1.6); popDelta(schemer, -1);
        const txt = y ? pick([PIT_INTEL[0]])(watcher, schemer, y) : pick(PIT_INTEL.slice(1))(watcher, schemer);
        push({ type: 'pit', players: [watcher, schemer], text: txt, badge: '👂 THE PIT · OVERHEARD', badgeClass: 'pit' });
        if (Math.random() < 0.6) push({ type: 'confessional', players: [watcher], text: pick(PIT_CONF)(watcher), badge: '🎥 CONFESSIONAL', badgeClass: 'grey' });
        (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
          type: 'mazePitIntel', players: [watcher, schemer], tag: 'maze-of-the-fallen',
          text: `${watcher} overheard ${schemer} letting slip real strategy from the maze pit — and now holds it over ${pronouns(schemer).obj} going into the vote.`,
          badgeText: 'INTEL', badgeClass: 'amber',
        });
        return;
      }
    }
    // COMFORT / GLOAT fallback
    if (pit.length >= 2) {
      const [a, b] = [pit[Math.floor(Math.random() * pit.length)], pit[Math.floor(Math.random() * pit.length)]];
      if (a !== b) {
        if (getBond(a, b) >= 0 && !canScheme(a)) {
          addBond(a, b, 2); popDelta(a, 1);
          push({ type: 'pit', players: [a, b], text: pick(PIT_COMFORT)(a, b), badge: '🤝 THE PIT · COMFORT', badgeClass: 'pit' });
          (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
            type: 'mazePitComfort', players: [a, b], tag: 'maze-of-the-fallen',
            text: `${a} looked out for ${b} down in the maze pit after ${pronouns(b).sub} struck out — a bond forged in the mud.`,
            badgeText: 'HAD THEIR BACK', badgeClass: 'green',
          });
        } else if (canScheme(a) && getBond(a, b) < 0) {
          addBond(a, b, -1.5); popDelta(a, -1);
          push({ type: 'pit', players: [a, b], text: pick(PIT_GLOAT)(a, b), badge: '🔥 THE PIT · GLOAT', badgeClass: 'pit' });
        }
      }
    }
  };

  // decide phase from how thinned the field is
  const setPhase = () => {
    const out = pitFolk().length + (winner ? 1 : 0);
    curPhase = out < active.length / 3 ? 'early' : out < (active.length * 2) / 3 ? 'mid' : 'final';
  };

  // ── ROUND LOOP ──
  let guard = 0;
  while (!winner && inMaze().length > 0 && guard++ < 20) {
    round++;
    setPhase();
    // a light progress-flavor beat at the top of a round (not every round)
    if (round > 1 && Math.random() < 0.5) {
      const mover = pick(inMaze());
      if (mover) push({ type: 'flavor', players: [mover], text: pick(PROGRESS_FLAV)(mover), badge: '🌫️ DEEPER IN', badgeClass: 'grey' });
    }
    const before = new Set(inMaze());
    // process every pod (order: those with a knower/loner first for drama variety — shuffle lightly)
    const order = pods.filter(p => p.members.some(n => st[n].status === 'maze')).sort(() => Math.random() - 0.5);
    for (const pod of order) { if (winner) break; runPodCrossroad(pod); }
    // eliminations this round
    const justOut = [...before].filter(n => st[n].status === 'pit');
    if (justOut.length) flushEliminations(justOut);
    // BREAK-OFF — a confident runner clearly ahead of a podmate splits to solo
    if (!winner) {
      pods.forEach(pod => {
        const m = pod.members.filter(n => st[n].status === 'maze');
        if (m.length >= 2) {
          const lead = m.slice().sort((a, b) => st[b].progress - st[a].progress)[0];
          const lag = m.slice().sort((a, b) => st[a].progress - st[b].progress)[0];
          if (st[lead].progress - st[lag].progress >= 2 && st[lead].loner > 1 && Math.random() < 0.6) {
            const nid = pods.length; pods.push({ id: nid, members: [lead] });
            pod.members = pod.members.filter(x => x !== lead); st[lead].pod = nid;
            push({ type: 'breakoff', players: [lead], text: pick(BREAKOFF)(lead), badge: '🏃 BREAKS OFF', badgeClass: 'teal' });
          }
        }
      });
    }
    // PIT arc
    if (!winner) runPit();
  }

  // ══ RESULT ══
  curPhase = 'final';
  const freeForAll = !winner;
  // ranking: winner first; then still-in-maze by progress (desc) then time; then pit by reverse elimination
  const stillIn = inMaze().sort((a, b) => (st[b].progress - st[a].progress) || (st[a].time - st[b].time));
  const pitByLate = pitFolk().sort((a, b) => (st[b].progress - st[a].progress) || (st[b].strikes - st[a].strikes));
  const ranking = [...(winner ? [winner] : []), ...stillIn.filter(n => n !== winner), ...pitByLate];
  // scores: escape >> progress >> survival
  const N = active.length;
  active.forEach(n => {
    let sc = st[n].progress * 2.2 + (2 - st[n].strikes) * 1.0 + noise(0.6);
    if (n === winner) sc += 40;
    else if (st[n].status === 'maze') sc += 6;
    st[n].score = +sc.toFixed(2);
  });
  const chalMemberScores = {};
  active.forEach(n => chalMemberScores[n] = st[n].score);
  if (winner) chalMemberScores[winner] = Math.max(...active.map(n => st[n].score)) + 5;
  ep.chalMemberScores = chalMemberScores;
  ep.chalPlacements = ranking.slice();

  let resultText = '';
  if (winner) {
    ep.immunityWinner = winner;
    popDelta(winner, 3);
    resultText = pick(WIN_TXT)(winner);
    push({ type: 'result', players: [winner], text: resultText, badge: '🏆 IMMUNITY', badgeClass: 'gold' });
  } else {
    ep.immunityWinner = null;
    ep.mazeFreeForAll = true;
    resultText = pick(FREE_FOR_ALL)();
    push({ type: 'result', text: resultText, badge: '⚠️ FREE-FOR-ALL VOTE', badgeClass: 'red' });
  }
  ep.tribalPlayers = [...active];

  updateChalRecord(ep);

  ep.challengeLabel = 'Maze of the Fallen';
  ep.challengeCategory = 'challenge';
  ep.challengeType = 'maze-of-the-fallen';
  ep.isMazeOfTheFallen = true;
  ep.mazeData = {
    hostOpener, resultText, freeForAll, winner, LEN,
    fallen: fallen.slice(),
    roster: active.map(n => ({ name: n, pod: st[n].pod })),
    ranking, scores: chalMemberScores,
    beats,
    finalSnap: snap(),
  };
}

// ══════════════════════════════════════════════════════════════════════
// VP — THE AERIAL HEDGE MAZE (moonlit top-down map, lantern crossroads, flip-flashcards, the pit)
// ══════════════════════════════════════════════════════════════════════
function portrait(name, size = 26) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:6px;object-fit:cover;flex-shrink:0" onerror="this.style.visibility='hidden'">`;
}
const MTF_PODCOLORS = ['#5aa9ff', '#ff6a6a', '#7affb0', '#ffd35a', '#c78aff', '#ff9f5a'];
function podColor(id) { return MTF_PODCOLORS[(id || 0) % MTF_PODCOLORS.length]; }

function mtfCss() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,600&family=Share+Tech+Mono&display=swap');
  .mtf-shell{--moon:#cfe3ff;--hedge:#1b3a24;--hedge2:#25502f;--lantern:#ffcf6a;--fog:#8fb0c8;--ink:#0a140e;--blood:#c0394b;
    max-width:1100px;margin:0 auto;font-family:'Cormorant Garamond',serif;color:#e9f2e6;background:#0a140e;padding:6px 4px 92px}
  .mtf-shell *{box-sizing:border-box}
  .mtf-map{position:sticky;top:46px;z-index:14;height:330px;border:4px solid #14261a;border-radius:12px;overflow:hidden;
    background:radial-gradient(ellipse at 50% -10%,#2a4a63 0%,#16304a 30%,#0c1c2c 60%,#081016 100%)}
  .mtf-moon{position:absolute;top:14px;right:40px;width:60px;height:60px;border-radius:50%;z-index:1;
    background:radial-gradient(circle at 38% 36%,#fff,#dfeaff 55%,#a9c4e0 80%,#7d9cc0);box-shadow:0 0 40px 10px rgba(190,215,255,.35)}
  .mtf-fog{position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.5;
    background:radial-gradient(60% 40% at 20% 80%,rgba(160,190,215,.28),transparent),radial-gradient(50% 40% at 80% 70%,rgba(160,190,215,.22),transparent);
    animation:mtfFog 14s ease-in-out infinite alternate}
  @keyframes mtfFog{0%{transform:translateX(-14px)}100%{transform:translateX(16px)}}
  .mtf-flies{position:absolute;inset:0;z-index:5;pointer-events:none}
  .mtf-fly{position:absolute;width:4px;height:4px;border-radius:50%;background:#ffe08a;box-shadow:0 0 7px 2px #ffcf6a;animation:mtfFly 6s ease-in-out infinite}
  @keyframes mtfFly{0%,100%{transform:translate(0,0);opacity:.3}50%{transform:translate(14px,-12px);opacity:1}}
  .mtf-hedges{position:absolute;inset:0;z-index:2}
  .mtf-route{position:absolute;inset:0;z-index:3;pointer-events:none}
  .mtf-node{position:absolute;width:12px;height:12px;border-radius:50%;transform:translate(-50%,-50%);z-index:4;
    background:radial-gradient(circle at 40% 40%,#fff2c0,var(--lantern));box-shadow:0 0 9px 2px rgba(255,207,106,.6)}
  .mtf-exit{position:absolute;transform:translate(-50%,-50%);z-index:4;font-family:'Cinzel Decorative';color:#ffe6a0;font-size:11px;text-align:center;text-shadow:0 0 8px #000}
  .mtf-tok{position:absolute;transform:translate(-50%,-60%);z-index:9;transition:left .5s ease,top .5s ease;width:30px}
  .mtf-tok img{width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid #fff;background:#16304a;box-shadow:0 2px 6px rgba(0,0,0,.6)}
  .mtf-tok .lbl{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono';font-size:8px;white-space:nowrap;color:#fff;background:rgba(10,20,14,.75);padding:0 4px;border-radius:3px}
  .mtf-tok.done img{border-color:var(--lantern);box-shadow:0 0 12px var(--lantern)}
  .mtf-tok.done::after{content:'♛';position:absolute;top:-16px;left:50%;transform:translateX(-50%);color:var(--lantern);font-size:13px}
  .mtf-tok.pit img{filter:grayscale(1) brightness(.6);border-color:#5a4a3a}
  .mtf-pit{position:absolute;left:0;right:0;bottom:0;height:64px;z-index:7;background:linear-gradient(180deg,rgba(40,30,20,.15),#2a1e12 45%,#1a1108);border-top:2px solid #4a3a24}
  .mtf-pit .cap{position:absolute;top:3px;left:10px;font-family:'Share Tech Mono';font-size:9px;color:#c9a978;letter-spacing:1px}
  .mtf-pit img{position:absolute;bottom:8px;width:34px;height:34px;border-radius:6px;object-fit:cover;filter:grayscale(1) brightness(.55);border:2px solid #1a1108}
  .mtf-hud{position:absolute;top:10px;left:14px;z-index:12}
  .mtf-title-hud{font-family:'Cinzel Decorative';font-size:19px;color:#ffe6a0;text-shadow:2px 2px 0 #000;line-height:1}
  .mtf-title-hud small{display:block;font-family:'Share Tech Mono';font-size:10px;color:var(--fog);letter-spacing:1px;margin-top:3px}
  .mtf-layout{display:grid;grid-template-columns:1fr 340px;gap:12px;align-items:start;margin-top:12px}
  .mtf-feed{min-width:0}
  .mtf-side{position:sticky;top:384px;background:linear-gradient(180deg,#12281a,#0b1a11);border:2px solid #23472e;border-radius:12px;padding:11px;max-height:calc(100vh - 120px);overflow:auto;z-index:6}
  .mtf-shdr{font-family:'Cinzel Decorative';letter-spacing:.5px;margin:9px 0 6px;font-size:14px;display:flex;align-items:center;gap:7px}
  .mtf-shdr .ct{font-family:'Share Tech Mono';font-size:11px;opacity:.8;margin-left:auto}
  .mtf-chip{display:flex;align-items:center;gap:8px;min-width:0;padding:3px 0}
  .mtf-chip img{width:28px;height:28px;border-radius:6px;object-fit:cover;border:2px solid #23472e;flex-shrink:0}
  .mtf-chip.out{opacity:.45;filter:grayscale(1)}
  .mtf-cn{min-width:0;flex:1}
  .mtf-cn .nn{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px;line-height:1.15}
  .mtf-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .mtf-prog{height:7px;border-radius:4px;background:#0a1c10;border:1px solid #23472e;overflow:hidden;margin-top:3px}
  .mtf-prog i{display:block;height:100%;background:linear-gradient(90deg,#3fb6c4,var(--lantern));transition:width .4s}
  .mtf-pips{font-family:'Share Tech Mono';font-size:11px;color:var(--blood);letter-spacing:2px;margin-left:4px}
  .mtf-card{background:linear-gradient(180deg,#12281a,#0d1e13);border:1px solid #23472e;border-left:4px solid #3f7a4e;border-radius:8px;padding:9px 12px;margin:9px 0}
  .mtf-card .who{display:flex;align-items:center;gap:8px;margin-bottom:4px}
  .mtf-card p{margin:0;font-size:16px;line-height:1.45;color:#eaf3e6}
  .mtf-badge{display:inline-block;font-family:'Share Tech Mono';font-size:9px;padding:2px 7px;border-radius:10px;margin-left:auto;letter-spacing:.5px;white-space:nowrap}
  .b-gold{background:#4a3410;color:#ffd35a}.b-blue{background:#123a4a;color:#8af0f7}.b-green{background:#0d3820;color:#8affb0}.b-red{background:#4a0f1c;color:#ff8a9c}.b-grey{background:#2a2a2a;color:#cfcfcf}.b-teal{background:#0e3540;color:#7fe6d0}.b-amber{background:#4a3410;color:#ffd35a}.b-purple{background:#2e1c42;color:#c9a9e4}.b-pit{background:#3a2a16;color:#e0b878}
  .mtf-card.intro{border-left-color:var(--lantern);background:linear-gradient(180deg,#2a2410,#1a1608)}
  .mtf-card.answer.green{border-left-color:#4ac47a}
  .mtf-card.answer.red{border-left-color:var(--blood);background:linear-gradient(180deg,#2a1214,#1a0d0e)}
  .mtf-card.sabotage{border-left-color:var(--blood);background:linear-gradient(180deg,#2c1116,#1c0b0f);animation:mtfShake .5s}
  @keyframes mtfShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  .mtf-card.confessional{border-left-color:#8a8a8a;border-left-style:dashed;background:linear-gradient(180deg,#181818,#101010);font-style:italic}
  .mtf-card.pit{border-left-color:#c9a978;background:linear-gradient(180deg,#241a10,#160f08)}
  .mtf-card.elim{border-left-color:#777;background:linear-gradient(180deg,#1e1616,#140f0f)}
  .mtf-card.result{border-left-color:var(--lantern);background:linear-gradient(180deg,#2c2408,#1a1404);box-shadow:0 0 22px rgba(255,207,106,.25)}
  /* FLASHCARD */
  .mtf-flash{background:radial-gradient(ellipse at 50% 0%,#1c3a49,#10222c);border:2px solid #2f6a7a;border-radius:10px;padding:11px 12px;margin:11px 0;box-shadow:0 4px 14px rgba(0,0,0,.4)}
  .mtf-flash .subj{font-family:'Share Tech Mono';font-size:10px;color:#7fe6d0;letter-spacing:1px;display:flex;align-items:center;gap:6px}
  .mtf-flash .subj img{width:22px;height:22px;border-radius:50%;object-fit:cover;border:1px solid #2f6a7a}
  .mtf-flash .q{font-family:'Cormorant Garamond';font-weight:700;font-size:19px;color:#eafcff;margin:6px 0 9px;line-height:1.25}
  .mtf-doors{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .mtf-door{border:2px solid #2f6a7a;border-radius:8px;padding:8px;text-align:center;background:linear-gradient(180deg,#12303c,#0d222c);position:relative}
  .mtf-door.correct{border-color:#4ac47a;background:linear-gradient(180deg,#123820,#0c2416);box-shadow:0 0 12px rgba(74,196,122,.35)}
  .mtf-door.wrong{opacity:.6}
  .mtf-door .dl{font-family:'Share Tech Mono';font-size:9px;color:#9fdccf;letter-spacing:1px}
  .mtf-door .dv{font-size:16px;font-weight:700;color:#eafcff;margin-top:2px}
  .mtf-door .goers{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:6px;min-height:22px}
  .mtf-door .goers img{width:20px;height:20px;border-radius:4px;object-fit:cover;border:1px solid rgba(255,255,255,.4)}
  .mtf-door .tick{position:absolute;top:5px;right:7px;color:#4ac47a;font-weight:900}
  .mtf-ctrl{position:fixed;bottom:0;left:0;right:0;background:rgba(10,20,14,.95);border-top:2px solid #23472e;padding:9px;display:flex;justify-content:center;gap:10px;z-index:40}
  .mtf-btn{font-family:'Cinzel Decorative';letter-spacing:1px;font-size:14px;padding:6px 20px;border:2px solid var(--lantern);background:#12281a;color:var(--lantern);border-radius:8px;cursor:pointer}
  .mtf-cnt{font-family:'Share Tech Mono';color:#cfe3d6;align-self:center;font-size:12px}
  .mtf-done{text-align:center;font-family:'Share Tech Mono';color:#c9a978;font-size:12px;padding:8px}
  .mtf-cover{position:relative;z-index:2;padding:26px 20px;text-align:center}
  .mtf-title{font-family:'Cinzel Decorative';font-size:46px;font-weight:900;letter-spacing:2px;color:#ffe6a0;text-shadow:3px 3px 0 #000,0 0 30px rgba(255,207,106,.4);line-height:1;margin:6px 0}
  .mtf-sub{font-family:'Share Tech Mono';font-size:12px;color:var(--fog);letter-spacing:1px}
  .mtf-tag{max-width:660px;margin:12px auto;font-size:17px;color:#eaf3e6;line-height:1.55}
  .mtf-fallen{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
  .mtf-fcard{width:88px;background:#12281a;border:1px solid #23472e;border-radius:8px;padding:7px 5px;text-align:center;opacity:.85}
  .mtf-fcard img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #4a3a24;filter:grayscale(.6)}
  .mtf-fcard .nm{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}
  .mtf-fcard .rip{font-family:'Share Tech Mono';font-size:8px;color:#c9a978}
  @media(prefers-reduced-motion:reduce){.mtf-fog,.mtf-fly,.mtf-tok,.mtf-card.sabotage{animation:none!important;transition:none!important}}
  </style>`;
}

// serpentine node layout across the map (percentages)
function mtfNodePos(i, total) {
  const rows = total > 6 ? 3 : 2;
  const perRow = Math.ceil((total + 1) / rows);
  const row = Math.min(rows - 1, Math.floor(i / perRow));
  let col = i - row * perRow;
  const leftToRight = row % 2 === 0;
  if (!leftToRight) col = (perRow - 1) - col;
  const x = 10 + (col / Math.max(1, perRow - 1)) * 80;
  const yTop = 18, yBot = 62; // keep above the pit strip
  const y = rows === 1 ? 40 : yTop + (row / (rows - 1)) * (yBot - yTop);
  return { left: x, top: y };
}

function mtfHedgesSVG() {
  // decorative top-down hedge blocks — atmosphere only
  return `<svg class="mtf-hedges" viewBox="0 0 640 330" preserveAspectRatio="none">
    <defs><pattern id="mtfhg" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#1b3a24"/><circle cx="3" cy="3" r="2.5" fill="#25502f"/><circle cx="8" cy="8" r="2" fill="#153018"/></pattern></defs>
    <g fill="url(#mtfhg)" opacity="0.9" stroke="#0e2214" stroke-width="1.5">
      <rect x="20" y="40" width="80" height="26" rx="6"/><rect x="150" y="30" width="26" height="90" rx="6"/>
      <rect x="230" y="70" width="120" height="24" rx="6"/><rect x="410" y="40" width="26" height="100" rx="6"/>
      <rect x="470" y="120" width="120" height="24" rx="6"/><rect x="70" y="150" width="130" height="24" rx="6"/>
      <rect x="270" y="150" width="26" height="90" rx="6"/><rect x="360" y="190" width="150" height="24" rx="6"/>
      <rect x="120" y="220" width="90" height="24" rx="6"/></g></svg>`;
}
function mtfFlies() { let h = ''; for (let i = 0; i < 7; i++) h += `<div class="mtf-fly" style="left:${8 + i * 12}%;top:${20 + (i * 17) % 55}%;animation-delay:${-i * 0.7}s"></div>`; return h; }

// build the map DOM from a snapshot
function _mtfMapHTML(r, snp, label) {
  const total = r.LEN;
  let nodes = '';
  for (let i = 0; i <= total; i++) {
    const p = mtfNodePos(i, total);
    if (i === total) nodes += `<div class="mtf-exit" style="left:${p.left}%;top:${p.top}%">🏁<br>EXIT</div>`;
    else nodes += `<div class="mtf-node" style="left:${p.left}%;top:${p.top}%"></div>`;
  }
  const pit = r.roster.filter(x => snp[x.name]?.status === 'pit');
  const toks = r.roster.map(x => {
    const n = x.name, m = snp[n] || { progress: 0, status: 'maze', pod: x.pod };
    if (m.status === 'pit') return '';
    const p = mtfNodePos(Math.min(m.progress, total), total);
    const cls = m.status === 'done' ? 'done' : '';
    const col = podColor(m.pod ?? x.pod);
    return `<div class="mtf-tok ${cls}" id="mtf-tok-${slugOf(n)}" style="left:${p.left}%;top:${p.top}%">
      <span class="lbl">${n}</span><img src="assets/avatars/${slugOf(n)}.png" style="border-color:${cls ? '' : col}" onerror="this.style.visibility='hidden'"></div>`;
  }).join('');
  const pitImgs = pit.map((x, i) => `<img id="mtf-pit-${slugOf(x.name)}" src="assets/avatars/${slugOf(x.name)}.png" style="left:${10 + (i % 9) * 10}%;transform:rotate(${(x.name.length % 2 ? -1 : 1) * 7}deg)" onerror="this.style.visibility='hidden'">`).join('');
  const stillIn = r.roster.filter(x => (snp[x.name]?.status || 'maze') === 'maze').length;
  return `<div class="mtf-moon"></div><div class="mtf-fog"></div><div class="mtf-flies">${mtfFlies()}</div>
    ${mtfHedgesSVG()}
    <div class="mtf-hud"><div class="mtf-title-hud">MAZE OF THE FALLEN<small>${label} · ${stillIn} STILL RUNNING</small></div></div>
    <div class="mtf-route" id="mtf-route">${nodes}${toks}</div>
    <div class="mtf-pit" id="mtf-pit"><span class="cap">THE PIT</span>${pitImgs}</div>`;
}

// live sidebar
function _mtfSidebar(r, snp) {
  const chip = (x) => {
    const n = x.name, m = snp[n] || { progress: 0, strikes: 0, status: 'maze', pod: x.pod };
    const pct = clamp((m.progress / Math.max(1, r.LEN)) * 100, 0, 100).toFixed(0);
    const pips = m.status === 'pit' ? '✕✕' : m.strikes === 1 ? '✕○' : '○○';
    const col = podColor(m.pod ?? x.pod);
    const done = m.status === 'done';
    return `<div class="mtf-chip ${m.status === 'pit' ? 'out' : ''}">
      <img src="assets/avatars/${slugOf(n)}.png" onerror="this.style.visibility='hidden'">
      <div class="mtf-cn"><div class="nn"><span class="mtf-dot" style="background:${done ? 'var(--lantern)' : col}"></span>${done ? '♛ ' : ''}${n}<span class="mtf-pips">${done ? '' : pips}</span></div>
        <div class="mtf-prog"><i style="width:${done ? 100 : pct}%"></i></div></div></div>`;
  };
  const inM = r.roster.filter(x => (snp[x.name]?.status || 'maze') === 'maze');
  const done = r.roster.filter(x => snp[x.name]?.status === 'done');
  const pit = r.roster.filter(x => snp[x.name]?.status === 'pit');
  let html = '';
  if (done.length) html += `<div class="mtf-shdr" style="color:var(--lantern)">🏁 ESCAPED<span class="ct">${done.length}</span></div>${done.map(chip).join('')}`;
  html += `<div class="mtf-shdr" style="color:#8affb0">🌿 IN THE MAZE<span class="ct">${inM.length}</span></div>${inM.length ? inM.map(chip).join('') : '<div class="mtf-done">— empty —</div>'}`;
  if (pit.length) html += `<div class="mtf-shdr" style="color:#e0b878">🕳️ THE PIT<span class="ct">${pit.length}</span></div>${pit.map(chip).join('')}`;
  return html;
}

// flashcard for a crossroad beat
function _mtfFlashcard(ev) {
  const doorImgs = (wantA) => ev.choices.filter(c => c.wentA === wantA).map(c => portrait(c.name, 20)).join('');
  const aCorrect = ev.correctIsA, bCorrect = !ev.correctIsA;
  return `<div class="mtf-flash">
    <div class="subj">${portrait(ev.subject, 22)} A QUESTION ABOUT ${ev.subject.toUpperCase()}</div>
    <div class="q">${ev.question.text}</div>
    <div class="mtf-doors">
      <div class="mtf-door ${aCorrect ? 'correct' : 'wrong'}">${aCorrect ? '<span class="tick">✓</span>' : ''}<div class="dl">← LEFT</div><div class="dv">${ev.optA}</div><div class="goers">${doorImgs(true)}</div></div>
      <div class="mtf-door ${bCorrect ? 'correct' : 'wrong'}">${bCorrect ? '<span class="tick">✓</span>' : ''}<div class="dl">RIGHT →</div><div class="dv">${ev.optB}</div><div class="goers">${doorImgs(false)}</div></div>
    </div></div>`;
}

function _mtfCard(ev) {
  if (ev.type === 'crossroad') return _mtfFlashcard(ev);
  const badge = ev.badge ? `<span class="mtf-badge b-${ev.badgeClass || 'grey'}">${ev.badge}</span>` : '';
  const avs = (ev.players && ev.players.length) ? ev.players.map(n => portrait(n, 24)).join('') : '';
  const head = (avs || badge) ? `<div class="who">${avs}${badge}</div>` : '';
  let cls = ev.type;
  if (ev.type === 'answer') cls = `answer ${ev.badgeClass === 'red' ? 'red' : 'green'}`;
  if (['flavor', 'rule', 'podForm', 'breakoff', 'split', 'gloat'].includes(ev.type)) cls = ev.type === 'gloat' ? 'answer red' : '';
  return `<div class="mtf-card ${cls}">${head}<p>${ev.text}</p></div>`;
}

function _mtfSteps(suffix, evs, revIdx) {
  return evs.map((ev, i) => `<div class="mtf-step" id="mtf-step-${suffix}-${i}" style="display:${i <= revIdx ? '' : 'none'}">${_mtfCard(ev)}</div>`).join('');
}
function _mtfCtrl(suffix, total, revIdx) {
  const done = revIdx >= total - 1;
  return `<div class="mtf-ctrl" id="mtf-ctrl-${suffix}" style="${done ? 'display:none' : ''}">
      <button class="mtf-btn" onclick="mazeRevealNext('mtf-${suffix}',${total})">STEP ▶</button>
      <span class="mtf-cnt" id="mtf-cnt-${suffix}">${Math.max(0, revIdx + 1)} / ${total}</span>
      <button class="mtf-btn" onclick="mazeRevealAll('mtf-${suffix}',${total})">ALL ⏭</button>
    </div>
    <div class="mtf-done" id="mtf-done-${suffix}" style="${done ? '' : 'display:none'}">— the lanterns gutter out —</div>`;
}
function _mtfShell(inner) { return `<div class="mtf-shell">${mtfCss()}${inner}</div>`; }

function _entrySnap(r) { const m = {}; r.roster.forEach(x => m[x.name] = { progress: 0, strikes: 0, status: 'maze', pod: x.pod }); return m; }

function _renderPhase(ep, suffix, evs, label) {
  const r = ep.mazeData; if (!r) return '';
  const key = `mtf-${suffix}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[key]) window._tvState[key] = { idx: -1 };
  const revIdx = window._tvState[key].idx;
  window.mazeData = r;
  window[`mtf_${suffix}_events`] = evs;
  window[`mtf_${suffix}_label`] = label;
  // entry snapshot = state entering this screen (first beat carrying a snap → the prior state)
  const firstSnap = evs.find(e => e.snap)?.snap;
  const entry = firstSnap ? _priorSnap(r, evs) : _entrySnap(r);
  window[`mtf_${suffix}_entry`] = entry;
  // current snapshot at reveal
  let cur = entry;
  for (let i = Math.min(revIdx, evs.length - 1); i >= 0; i--) { if (evs[i]?.snap) { cur = evs[i].snap; break; } }
  return _mtfShell(`
    <div class="mtf-map" id="mtf-map-${suffix}" data-suffix="${suffix}">${_mtfMapHTML(r, cur, label)}</div>
    <div class="mtf-layout">
      <div class="mtf-feed">${_mtfSteps(suffix, evs, revIdx)}${_mtfCtrl(suffix, evs.length, revIdx)}</div>
      <div class="mtf-side" id="mtf-side-${suffix}">${_mtfSidebar(r, cur)}</div>
    </div>`);
}
// the snapshot BEFORE this screen's first beat = the snap of the beat immediately preceding it in r.beats
function _priorSnap(r, evs) {
  const first = evs.find(e => e.snap);
  if (!first) return _entrySnap(r);
  const gi = r.beats.indexOf(first);
  for (let i = gi - 1; i >= 0; i--) { if (r.beats[i]?.snap) return r.beats[i].snap; }
  return _entrySnap(r);
}

// ── screen builders ──
function rpBuildMazeTitleCard(ep) {
  const r = ep.mazeData; if (!r) return '';
  const fallen = (r.fallen || []).map(n =>
    `<div class="mtf-fcard"><img src="assets/avatars/${slugOf(n)}.png" onerror="this.style.visibility='hidden'"><div class="nm">${n}</div><div class="rip">THE FALLEN</div></div>`).join('');
  const roster = r.roster.map(x =>
    `<div class="mtf-fcard" style="opacity:1"><img src="assets/avatars/${slugOf(x.name)}.png" style="filter:none;border-color:${podColor(x.pod)}" onerror="this.style.visibility='hidden'"><div class="nm">${x.name}</div><div class="rip" style="color:${podColor(x.pod)}">RUNNER</div></div>`).join('');
  return _mtfShell(`<div class="mtf-cover">
    <div class="mtf-sub">STAWAKI CARNIVAL · THE MOONLIT HEDGE MAZE</div>
    <div class="mtf-title">MAZE OF<br>THE FALLEN</div>
    <div class="mtf-sub">${r.roster.length} RUNNERS · QUESTIONS ABOUT THE ELIMINATED · TWO STRIKES AND YOU'RE OUT</div>
    <div class="mtf-tag">"${r.hostOpener}"</div>
    <div class="mtf-tag" style="color:var(--fog)">At every crossroad, a question about a camper you already sent home. If you <b>listened</b> to them — bonded with them — you'll <b>know</b>. If you didn't, you guess, or you follow the pack. First to the exit wins immunity. If <b>nobody</b> escapes, it's a free-for-all vote.</div>
    <div class="mtf-shdr" style="justify-content:center;color:#e0b878">🕯️ THE FALLEN — TONIGHT'S SUBJECTS</div>
    <div class="mtf-fallen">${fallen}</div>
    <div class="mtf-shdr" style="justify-content:center;color:#8affb0;margin-top:14px">🌿 THE RUNNERS</div>
    <div class="mtf-fallen">${roster}</div>
  </div>`);
}
function rpBuildMazeEarly(ep) {
  const r = ep.mazeData; if (!r) return '';
  const evs = r.beats.filter(b => b.phase === 'early');
  return _renderPhase(ep, 'early', evs.length ? evs : r.beats.slice(0, 4), 'INTO THE MAZE');
}
function rpBuildMazeMid(ep) {
  const r = ep.mazeData; if (!r) return '';
  const evs = r.beats.filter(b => b.phase === 'mid');
  return _renderPhase(ep, 'mid', evs.length ? evs : [], 'DEEPER IN');
}
function rpBuildMazeFinal(ep) {
  const r = ep.mazeData; if (!r) return '';
  const evs = r.beats.filter(b => b.phase === 'final');
  return _renderPhase(ep, 'final', evs.length ? evs : r.beats.slice(-4), 'THE FINAL STRETCH');
}

// ── live update on reveal ──
function _mtfUpdateMap(suffix, snp) {
  const map = document.getElementById(`mtf-map-${suffix}`); const r = window.mazeData;
  if (!map || !r) return;
  const total = r.LEN;
  const route = map.querySelector('#mtf-route');
  const pitEl = map.querySelector('#mtf-pit');
  r.roster.forEach(x => {
    const n = x.name, m = snp[n]; if (!m) return;
    const tok = map.querySelector(`#mtf-tok-${slugOf(n)}`);
    if (m.status === 'pit') {
      if (tok) tok.remove();
      if (pitEl && !pitEl.querySelector(`#mtf-pit-${slugOf(n)}`)) {
        const idx = pitEl.querySelectorAll('img').length;
        const im = document.createElement('img'); im.id = `mtf-pit-${slugOf(n)}`;
        im.src = `assets/avatars/${slugOf(n)}.png`; im.style.left = (10 + (idx % 9) * 10) + '%';
        im.style.transform = `rotate(${(n.length % 2 ? -1 : 1) * 7}deg)`;
        im.onerror = function () { this.style.visibility = 'hidden'; };
        pitEl.appendChild(im);
      }
      return;
    }
    if (tok) {
      const p = mtfNodePos(Math.min(m.progress, total), total);
      tok.style.left = p.left + '%'; tok.style.top = p.top + '%';
      if (m.status === 'done') tok.classList.add('done');
    }
  });
  const hud = map.querySelector('.mtf-title-hud small');
  if (hud) { const stillIn = r.roster.filter(x => (snp[x.name]?.status || 'maze') === 'maze').length; hud.textContent = hud.textContent.replace(/\d+ STILL RUNNING/, `${stillIn} STILL RUNNING`); }
}
function _mtfUpdateSidebar(suffix, snp) {
  const el = document.getElementById(`mtf-side-${suffix}`); const r = window.mazeData;
  if (el && r) el.innerHTML = _mtfSidebar(r, snp);
}
function _mtfSnapAt(suffix, idx) {
  const evs = window[`mtf_${suffix}_events`] || [];
  let snp = window[`mtf_${suffix}_entry`];
  for (let i = Math.min(idx, evs.length - 1); i >= 0; i--) { if (evs[i]?.snap) { snp = evs[i].snap; break; } }
  return snp;
}

function mazeRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const s = window._tvState[screenKey];
  if (s.idx >= total - 1) return;
  s.idx++;
  const suffix = screenKey.replace('mtf-', '');
  const el = document.getElementById(`mtf-step-${suffix}-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`mtf-cnt-${suffix}`); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  if (s.idx >= total - 1) {
    const c = document.getElementById(`mtf-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const d = document.getElementById(`mtf-done-${suffix}`); if (d) d.style.display = '';
  }
  const snp = _mtfSnapAt(suffix, s.idx);
  try { _mtfUpdateMap(suffix, snp); } catch (e) {}
  try { _mtfUpdateSidebar(suffix, snp); } catch (e) {}
}
function mazeRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const s = window._tvState[screenKey];
  const suffix = screenKey.replace('mtf-', '');
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`mtf-step-${suffix}-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById(`mtf-cnt-${suffix}`); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`mtf-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const d = document.getElementById(`mtf-done-${suffix}`); if (d) d.style.display = '';
  const snp = _mtfSnapAt(suffix, s.idx);
  try { _mtfUpdateMap(suffix, snp); } catch (e) {}
  try { _mtfUpdateSidebar(suffix, snp); } catch (e) {}
}

// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG — complete retranscription of the VP narration
// ══════════════════════════════════════════════════════════════════════
function _textMazeOfTheFallen(ep, ln, sec) {
  const r = ep.mazeData; if (!r) return;
  sec('MAZE OF THE FALLEN');
  ln(`"${r.hostOpener}"`);
  ln('');
  ln(`THE FALLEN (tonight's subjects): ${(r.fallen || []).join(', ')}`);
  ln('');
  const phaseTitles = { early: 'INTO THE MAZE', mid: 'DEEPER IN', final: 'THE FINAL STRETCH' };
  let lastPhase = null;
  r.beats.forEach(ev => {
    if (ev.phase !== lastPhase) { ln(''); ln(`— ${phaseTitles[ev.phase] || ev.phase.toUpperCase()} —`); lastPhase = ev.phase; }
    if (ev.type === 'crossroad') {
      ln(`CROSSROAD — ${ev.question.text}`);
      ln(`   LEFT: ${ev.optA}${ev.correctIsA ? '  (correct)' : ''}   |   RIGHT: ${ev.optB}${!ev.correctIsA ? '  (correct)' : ''}`);
      return;
    }
    const who = ev.players ? ev.players.join(' & ') : '';
    const tag = ev.badge ? ` [${ev.badge.replace(/^[^\w]+\s*/, '')}]` : '';
    ln(`${who ? who + ': ' : ''}${ev.text}${tag}`);
  });
  ln('');
  if (r.winner) ln(`IMMUNITY: ${r.winner}`);
  else ln(`NO IMMUNITY — FREE-FOR-ALL VOTE`);
  ln('');
}

export {
  rpBuildMazeTitleCard, rpBuildMazeEarly, rpBuildMazeMid, rpBuildMazeFinal,
  mazeRevealNext, mazeRevealAll, _textMazeOfTheFallen,
};
