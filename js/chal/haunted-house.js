// js/chal/haunted-house.js — Haunted House escape challenge (post-merge, individual immunity)
// DC4 "Carnival of Chaos". 3 rooms: Library combo lock → Three Keys split rooms → Ordinary Girl Doll boss.
// Last-one-standing race: eliminations knock players OUT of the challenge; first to cut the rope escapes = immunity.
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function pickUniq(arr, used) {
  const fresh = arr.filter(x => !used.has(x));
  const chosen = (fresh.length ? fresh : arr)[Math.floor(Math.random() * (fresh.length || arr.length))];
  used.add(chosen);
  return chosen;
}
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function portrait(name, size = 38) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:5px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
const VILLAINY = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function canScheme(name) {
  const a = arch(name);
  if (VILLAINY.includes(a)) return true;
  if (NICE.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function _names(arr) {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

// ══════════════════════════════════════════════════════════════
// TEXT POOLS
// ══════════════════════════════════════════════════════════════
const OPEN_TEXT = [
  (h) => `${h} lifts a lantern to the mansion's rotted door. "Three rooms. First one out wins immunity. The rest of you..." The door groans open on its own.`,
  (h) => `A frightened Trevor hides behind ${h}. "Th-three rooms of the haunted mansion. Escape, and you're safe. Simple." It is not simple.`,
  (h) => `${h} grins beneath a full moon. "Welcome to the Haunted House. Get through all three rooms and out the front door. First to escape can't be voted off."`,
  (h) => `The carnival's haunted mansion looms. ${h}: "First one to claw their way out the far side wins immunity. Everyone else — see you at the vote."`,
];
const NOSTALGIA_TEXT = [
  (n) => `${n} cracks knuckles. "I LOVE haunted houses. Grew up on 'em." Bold words for someone about to scream.`,
  (n) => `${n} eyes the mansion fondly. "Been waiting all season for a challenge like this."`,
  (n) => `${n} rolls ${pronouns(n).posAdj} shoulders. "Ghosts don't scare me. People scare me. Ghosts are fine."`,
];
const FEAR_TEXT = [
  (n) => `${n} freezes at the threshold. "I do NOT do demonic presences. Nope."`,
  (n) => `${n} clutches ${pronouns(n).posAdj} chest. "This place feels wrong. Like, breakup-level wrong."`,
  (n) => `${n} whispers a prayer. "If something in here has a face, I'm out."`,
  (n) => `${n} shivers. "I heard a bell ring. Who rang the bell? WHY is there a bell?"`,
];

const LIB_INTRO = [
  `Candles ignite one by one and lift off their holders, drifting like burning ghosts. A heavy door at the far end wears a four-digit combination lock. The numbers are hidden in the room.`,
  `The floor tilts. Books rain from the shelves and hover mid-air. The only exit is bolted with a numbered lock — and the digits are scattered across the library.`,
  `The library breathes. Floating candles circle overhead as the house shudders. Bolted shut: a door with a four-number combo. Find the numbers, unlock it, run.`,
];
const DIGIT_FIND = [
  (n, pr, d) => `${n} rips open a mildewed tome — the number <b>${d}</b> is scrawled inside. "GOT ONE!"`,
  (n, pr, d) => `${n} spots <b>${d}</b> carved into a candlestick as it floats past. Quick hands. "There!"`,
  (n, pr, d) => `A portrait's eyes follow ${n}; behind it, the digit <b>${d}</b>. ${pr.Sub} yanks it free.`,
  (n, pr, d) => `${n} presses an ear to the wall, hears a click, and finds <b>${d}</b> etched under the sconce.`,
  (n, pr, d) => `Dodging a swooping candle, ${n} pries a floorboard loose. Number <b>${d}</b>. "Come to mama."`,
];
const UNLOCK_TEXT = [
  (n, combo) => `${n} spins the dial — <b>${combo}</b> — and the lock CLUNKS open. "GO GO GO!"`,
  (n, combo) => `Hands shaking, ${n} enters <b>${combo}</b>. The bolt slams back. The door swings wide.`,
  (n, combo) => `${n} threads the combination <b>${combo}</b> as the house screams. Click. "It's open!"`,
];
const LOCKED_IN = [
  (s, t) => `${s} sees a chance — and slams the door on ${t}, twisting the lock. ${t} pounds the wood, trapped. "${s}! Are you SERIOUS?!"`,
  (s, t) => `As everyone bolts, ${s} shoves ${t} back into the library and jams the door. Immunity means no mercy.`,
  (s, t) => `${s} lets ${t} pass first — then yanks the door shut behind them, locking ${t} inside with the floating candles.`,
];
const KNOCKED_OUT = [
  (n, pr) => `A tower of books avalanches onto ${n}, burying ${pr.obj}. By the time ${pr.sub} digs out, the door's sealed. Out of the challenge.`,
  (n, pr) => `${n} trips on the buckling floor and a candelabra clips ${pr.obj} on the temple. Lights out — challenge over.`,
  (n, pr) => `The floor gives way under ${n} and ${pr.sub} drops through into the dark. No coming back from that one.`,
];
const LEAVE_BEHIND = [
  (s, t) => `${t} wants to dig ${s} out, but ${s} — thinking only of the win — hisses "Leave ${pronouns(t).obj}!" and drags ${t} onward.`,
  (s, t) => `${s} grabs ${t}'s arm. "We don't have time. Move." ${t} looks back once, then keeps running.`,
];
const HELP_OUT = [
  (h, t) => `${h} skids back and hauls ${t} clear of the falling shelves just in time. "I've GOT you — go!"`,
  (h, t) => `${h} refuses to leave ${t} behind, shouldering the books aside. Both make it to the door.`,
];

const ROOMS = [
  { key: 'toy', name: 'The Toy Room', emoji: '🧸', hazard: 'a swarm of rats', icon: 'rat',
    entry: (names) => `${names} creep into a nursery of cracked porcelain dolls. A key dangles from the ceiling — then the floorboards seethe with rats.`,
    survive: [
      (n, pr) => `${n} kicks through the rat swarm and snatches the key. "GET OFF ME!" — but ${pr.sub} holds on.`,
      (n, pr) => `${n} wades through the squealing tide, one hand up, and comes out clutching the key.`,
      (n, pr) => `Rats swarm ${pr.posAdj} legs but ${n} just grits ${pr.posAdj} teeth and rips the key loose.`,
    ],
    fall: [
      (n, pr) => `The rats overwhelm ${n}; ${pr.sub} goes down thrashing and loses the room.`,
      (n, pr) => `${n} panics as the swarm surges up ${pr.posAdj} arms and stumbles back, out of it.`,
      (n, pr) => `A rat runs up ${n}'s sleeve — ${pr.sub} shrieks, drops, and doesn't get up in time.`,
    ] },
  { key: 'chandelier', name: 'The Chandelier Hall', emoji: '🕯️', hazard: 'a rotted chandelier', icon: 'chandelier',
    entry: (names) => `${names} enter a grand hall. The key hangs from a colossal chandelier swaying forty feet up.`,
    survive: [
      (n, pr) => `${n} climbs the drapes hand over hand and swipes the key from the chandelier's arm.`,
      (n, pr) => `${n} shimmies up a support chain, boots slipping, and snags the key at the top.`,
      (n, pr) => `${n} rides the chandelier's swing and grabs the key at the peak of the arc.`,
    ],
    fall: [
      (n, pr) => `${n} reaches too far; the chandelier lurches and ${pr.sub} plummets through a trapdoor.`,
      (n, pr) => `The chain snaps under ${n} and ${pr.sub} rides the falling drape into the dark.`,
      (n, pr) => `${n} loses ${pr.posAdj} grip near the top and drops out of the running.`,
    ] },
  { key: 'egyptian', name: 'The Cursed Tomb', emoji: '⚱️', hazard: 'glass panels over a pit', icon: 'tomb',
    entry: (names) => `${names} step into a sand-strewn tomb. The key sits across a floor of identical glass panels — some hold, some don't.`,
    survive: [
      (n, pr) => `${n} tests each panel, breathing slow, and threads a path across to the key.`,
      (n, pr) => `${n} reads the dust patterns and picks the solid panels one by one to reach the key.`,
      (n, pr) => `Whispering a prayer, ${n} crosses the glass gauntlet and lifts the key clear.`,
    ],
    fall: [
      (n, pr) => `${n} trusts the wrong panel; it shatters and ${pr.sub} drops through into blackness.`,
      (n, pr) => `A hairline crack spiders out under ${n} and the glass gives way beneath ${pr.obj}.`,
      (n, pr) => `${n} hesitates a beat too long; the panel splinters and ${pr.sub} is gone.`,
    ] },
  { key: 'mirror', name: 'The Mirror Maze', emoji: '🪞', hazard: 'shattering mirrors', icon: 'mirror',
    entry: (names) => `${names} vanish into a maze of mirrors, a hundred reflections grinning back. The real key is somewhere in the glass.`,
    survive: [
      (n, pr) => `${n} keeps a hand on one wall and finds the true key among a thousand fakes.`,
      (n, pr) => `${n} ignores the reflections, trusts ${pr.posAdj} gut, and closes on the real key.`,
      (n, pr) => `${n} tracks the one reflection that moves wrong — and grabs the key behind it.`,
    ],
    fall: [
      (n, pr) => `${n} punches a mirror that isn't a mirror; the floor tips and ${pr.sub} slides out.`,
      (n, pr) => `${n} chases a fake key into the glass and gets hopelessly turned around, out of the room.`,
      (n, pr) => `The mirrors close in on ${n}; ${pr.sub} panics and loses the path entirely.`,
    ] },
  { key: 'clock', name: 'The Clockwork Attic', emoji: '⚙️', hazard: 'grinding gears', icon: 'gear',
    entry: (names) => `${names} climb into an attic of turning gears. The key rides a rotating cog above a grinding drop.`,
    survive: [
      (n, pr) => `${n} times the gears and rides a cog to pluck the key mid-turn.`,
      (n, pr) => `${n} counts the rhythm of the machine and steps between the teeth to the key.`,
      (n, pr) => `${n} vaults from gear to gear like clockwork and lands the key.`,
    ],
    fall: [
      (n, pr) => `${n} mistimes the leap; a gear catches ${pr.posAdj} sleeve and yanks ${pr.obj} out.`,
      (n, pr) => `The cog spins faster than ${n} expects and throws ${pr.obj} clear of the room.`,
      (n, pr) => `${n} slips on the greased teeth and tumbles off the machine, done.`,
    ] },
];
const KEY_GRAB = [
  (n) => `${n} rips the key free and holds it high. One of three.`,
  (n) => `The lock needs three keys — ${n} just claimed one. "That's ours!"`,
  (n) => `${n} pockets the key and sprints for the reunion door.`,
];

const BOSS_WAKE = [
  `In the final room — voodoo dolls, skulls, a fire licking up a rotten throne — a discarded Ordinary Girl doll lies broken in the corner. The last survivors reach for the knife lashing the exit rope... and the doll's head snaps up. It's ALIVE.`,
  `The escape rope is bound tight, and only the doll's rusted knife can cut it. As hands close on the blade, the ragged Ordinary Girl doll rises, cackling, and hurls voodoo dolls at the room.`,
  `Skulls, black candles, and one knife between the finalists and freedom. The moment someone grabs it, the throne bursts into flame and the broken doll lurches upright. "Nobody... leaves."`,
];
const BOSS_ATTACK = [
  (n, pr) => `The doll flings ${n} across the room; ${pr.sub} slams into the skull pile, dazed and out of the scramble for a beat.`,
  (n, pr) => `A voodoo doll pierces the air and ${n} drops the knife, clutching ${pr.posAdj} arm. "IT MOVED!"`,
  (n, pr) => `${n} lunges recklessly and the doll tosses ${pr.obj} aside like a rag. Sarcastic slow-clap from the others.`,
  (n, pr) => `The Ordinary Girl doll shrieks and hurls ${n} into the burning throne's shadow. ${pr.Sub} rolls clear, singed.`,
  (n, pr) => `A skull whips off the shelf and cracks ${n} in the ribs; ${pr.sub} folds over, wheezing.`,
  (n, pr) => `The doll's stitched grin widens as it yanks the rug from under ${n}. Down ${pr.sub} goes.`,
];
const BOSS_TACKLE = [
  (s, t) => `${s} tackles ${t} off the knife. "Sorry — not sorry." ${t} hits the floor.`,
  (s, t) => `${s} rips the blade from ${t}'s hands mid-cut. "I need this more than you."`,
  (s, t) => `${s} throws a voodoo doll to stagger ${t}, then dives for the rope.`,
];
const BOSS_ASSIST = [
  (h, t, w) => `${h} slams into ${t}, knocking them clear so ${w} can reach the rope. Loyalty over the win.`,
  (h, w) => `${h} wrestles the doll long enough for ${w} to grab the knife. "GO! I've got the ugly thing!"`,
];
const ESCAPE_TEXT = [
  (n) => `${n} saws the rope in one desperate stroke, kicks the front door open, and stumbles into the moonlight — IMMUNITY.`,
  (n) => `The rope snaps under ${n}'s blade. ${n} bolts through the door and collapses on the lawn, safe. The doll's shriek dies behind ${pronouns(n).obj}.`,
  (n) => `${n} cuts free, shoulders the door, and escapes the mansion first. Immunity, and a heartbeat to spare.`,
];

// Social beats between phases
const SOCIAL_BEATS = {
  apology: [
    (a, b) => ({ t: `${a} pulls ${b} aside in the dark. "About that vote — I'm sorry. You were the first person who actually saw me here." ${b} softens. Something mends.`, d: () => { addBond(a, b, 2); popDelta(a, 0.4); } }),
    (a, b) => ({ t: `${a} finally owns it. "I blindsided you and it wasn't personal — it was the only way to keep us safe." ${b} nods slowly. Bridge rebuilt.`, d: () => { addBond(a, b, 2); } }),
  ],
  target: [
    (a, b, tgt) => ({ t: `${a} murmurs to ${b} between screams: "${tgt} is the next target. Whatever it takes, they don't win this." A plan hardens.`, d: () => { addBond(a, b, 1); addBond(a, tgt, -1); } }),
    (a, b, tgt) => ({ t: `${a} and ${b} trade a look. "${tgt}'s getting too comfortable. After tonight, they go." The alliance tightens.`, d: () => { addBond(a, b, 1); addBond(a, tgt, -1); } }),
  ],
  blame: [
    (a, b) => ({ t: `${a} rounds on ${b}. "You LEFT me back there!" ${b} shrugs it off, but the resentment sticks.`, d: () => { addBond(a, b, -2); popDelta(b, -0.3); } }),
    (a, b) => ({ t: `${a} won't let it go. "You'd have walked over my body for that key." ${b}: "...Yeah. I would." Cold.`, d: () => { addBond(a, b, -2); } }),
  ],
  olive: [
    (a, b) => ({ t: `${a} catches ${b} shaking and steadies ${pronouns(b).obj}. "Breathe. We get out of here together." A small trust forms.`, d: () => { addBond(a, b, 2); popDelta(a, 0.3); } }),
  ],
  cheer: [
    (a, b) => ({ t: `${a} whoops as ${b} clears a hazard. "THAT'S how you do it!" ${b} grins despite the terror.`, d: () => { addBond(a, b, 1); } }),
  ],
};

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
function _libScore(n) { const s = pStats(n); return s.mental * 0.5 + s.intuition * 0.4 + s.boldness * 0.1 + noise(2.5); }
function _escapeScore(n) { const s = pStats(n); return s.endurance * 0.5 + s.boldness * 0.3 + s.physical * 0.2 + noise(2.5); }
function _roomScore(n) { const s = pStats(n); return s.physical * 0.4 + s.endurance * 0.3 + s.boldness * 0.3 + noise(3.0); }
function _knifeScore(n) { const s = pStats(n); return s.boldness * 0.4 + s.physical * 0.4 + s.strategic * 0.2 + noise(3.0); }

function _addSocial(events, active, done, kind, tgtPool) {
  // pick a compatible pair from `active` not already used this beat
  const pool = active.filter(n => !done.has(n));
  if (pool.length < 2) return;
  const a = pick(pool);
  const rest = pool.filter(n => n !== a);
  if (!rest.length) return;
  const b = pick(rest);
  done.add(a); done.add(b);
  let beat;
  if (kind === 'target') {
    const tgts = (tgtPool || active).filter(n => n !== a && n !== b);
    if (!tgts.length) { kind = 'apology'; }
    else { beat = pick(SOCIAL_BEATS.target)(a, b, pick(tgts)); }
  }
  if (!beat) {
    const fn = pick(SOCIAL_BEATS[kind] || SOCIAL_BEATS.cheer);
    beat = fn(a, b);
  }
  beat.d();
  events.push({ type: 'social', kind, players: [a, b], icon: '🗣️', text: beat.t });
}

export function simulateHauntedHouse(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    combo: '',
    phase1: { intro: pick(LIB_INTRO), events: [], finders: [], unlocker: null },
    phase2: { groups: [] },
    phase3: { intro: pick(BOSS_WAKE), finalists: [], events: [], knife: {}, immunityWinner: null },
    outOrder: [],        // elimination order, worst first: {name, phase, reason}
    reachedBoss: [],
    immunityWinner: null,
  };

  let alive = [...active];
  const eliminate = (name, phase, reason) => {
    if (!result.outOrder.find(o => o.name === name)) result.outOrder.push({ name, phase, reason });
    alive = alive.filter(n => n !== name);
  };

  // ══ INTRO ══
  result.open = pick(OPEN_TEXT)(host());
  // one nostalgia, one fear (personality-driven)
  const bold = [...active].sort((a, b) => pStats(b).boldness - pStats(a).boldness);
  const timid = [...active].sort((a, b) => (pStats(a).boldness + pStats(a).temperament) - (pStats(b).boldness + pStats(b).temperament));
  result.nostalgia = bold[0] ? pick(NOSTALGIA_TEXT)(bold[0]) : '';
  result.fear = (timid[0] && timid[0] !== bold[0]) ? pick(FEAR_TEXT)(timid[0]) : (timid[1] ? pick(FEAR_TEXT)(timid[1]) : '');

  // ══ PHASE 1 — THE LIBRARY ══
  _simLibrary(active, alive, result, eliminate, ep, campKey);
  alive = active.filter(n => !result.outOrder.find(o => o.name === n));

  // ══ PHASE 2 — THREE KEYS ══
  _simKeys(alive, result, eliminate, ep, campKey);
  alive = active.filter(n => !result.outOrder.find(o => o.name === n));

  // ══ PHASE 3 — THE ORDINARY GIRL DOLL ══
  result.reachedBoss = [...alive];
  _simBoss(alive, result, ep, campKey);

  // ══ ROMANCE HOOKS ══
  const romActive = active;
  for (let i = 0; i < romActive.length; i++)
    for (let j = i + 1; j < romActive.length; j++)
      _challengeRomanceSpark(romActive[i], romActive[j], ep, null, null, ep.chalMemberScores || {}, 'haunted mansion escape');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'haunt', romActive);

  // ══ FINALIZE ══
  const winner = result.immunityWinner;
  ep.hauntedHouse = result;
  ep.isHauntedHouse = true;
  ep.challengeType = 'haunted-house';
  ep.challengeLabel = 'Haunted House';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = winner;
  ep.tribalPlayers = active;

  // placements: winner → other finalists by knife → eliminated (later = better)
  const finalistsRanked = result.reachedBoss
    .filter(n => n !== winner)
    .sort((a, b) => (result.phase3.knife[b] || 0) - (result.phase3.knife[a] || 0));
  const elimBetterFirst = result.outOrder.map(o => o.name).reverse();
  ep.chalPlacements = [winner, ...finalistsRanked, ...elimBetterFirst].filter(Boolean);

  // scores
  const N = active.length;
  ep.chalPlacements.forEach((name, idx) => {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.max(1, N - idx);
  });
  result.reachedBoss.forEach(name => {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(N * 0.5);
  });
  if (winner) ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + N + 5;

  updateChalRecord(ep);
  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = { type: 'haunted-house', label: 'Haunted House', winner };
  return ep;
}

function _simLibrary(active, aliveRef, result, eliminate, ep, campKey) {
  const p1 = result.phase1;
  const combo = String(Math.floor(1000 + Math.random() * 9000));
  result.combo = combo;

  // rank searchers
  const ranked = [...active].sort((a, b) => _libScore(b) - _libScore(a));
  const finders = ranked.slice(0, Math.min(4, ranked.length));
  const digits = combo.split('');
  finders.forEach((n, i) => {
    p1.finders.push({ name: n, digit: digits[i] });
    p1.events.push({ type: 'find', player: n, icon: '🔢', text: pick(DIGIT_FIND)(n, pronouns(n), digits[i]) });
    ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + 2;
  });
  // social beat mid-search
  const done = new Set();
  _addSocial(p1.events, active, done, Math.random() < 0.5 ? 'apology' : 'target', active);

  // unlocker = best finder present
  const unlocker = finders[0];
  p1.unlocker = unlocker;
  p1.events.push({ type: 'unlock', player: unlocker, icon: '🗝️', text: pick(UNLOCK_TEXT)(unlocker, combo) });
  ep.chalMemberScores[unlocker] = (ep.chalMemberScores[unlocker] || 0) + 2;

  // ── the scramble out: eliminate 1-2 ──
  const elimCount = active.length >= 9 ? 2 : 1;
  const schemers = active.filter(canScheme);
  const usedKO = new Set();
  let firstOut = null;

  // First elimination — locked-in (if a schemer can target a threat) else knocked-out
  if (schemers.length && Math.random() < 0.6) {
    const schemer = pick(schemers);
    // target: highest strategic threat that isn't the schemer
    const threats = active.filter(n => n !== schemer).sort((a, b) => pStats(b).strategic - pStats(a).strategic);
    const target = threats[0];
    if (target) {
      firstOut = target;
      p1.events.push({ type: 'lockin', player: target, by: schemer, icon: '🔒', text: pick(LOCKED_IN)(schemer, target) });
      addBond(target, schemer, -3); popDelta(schemer, -0.5); popDelta(target, 0.4);
      eliminate(target, 1, 'locked in');
    }
  }
  if (!firstOut) {
    const weakest = [...active].sort((a, b) => _escapeScore(a) - _escapeScore(b))[0];
    firstOut = weakest;
    p1.events.push({ type: 'knockout', player: weakest, icon: '📚', text: pickUniq(KNOCKED_OUT, usedKO)(weakest, pronouns(weakest)) });
    eliminate(weakest, 1, 'knocked out');
  }

  // Second elimination (knocked out) with a help / leave-behind beat
  if (elimCount >= 2) {
    const remaining = active.filter(n => !result.outOrder.find(o => o.name === n));
    const victim = [...remaining].sort((a, b) => _escapeScore(a) - _escapeScore(b))[0];
    if (victim) {
      // a nearby teammate may try to help
      const helpers = remaining.filter(n => n !== victim && getBond(n, victim) >= 3);
      const rescuer = helpers.length ? [...helpers].sort((a, b) => _escapeScore(b) - _escapeScore(a))[0] : null;
      if (rescuer && Math.random() < 0.45) {
        // rescue succeeds — victim survives, no elimination
        p1.events.push({ type: 'help', player: victim, by: rescuer, icon: '🤝', text: pick(HELP_OUT)(rescuer, victim) });
        addBond(rescuer, victim, 2); popDelta(rescuer, 0.6);
      } else {
        // knocked out; if a self-interested ally is near, leave-behind beat
        const abandoner = remaining.find(n => n !== victim && canScheme(n) && getBond(n, victim) >= 1);
        if (abandoner) {
          p1.events.push({ type: 'leave', player: victim, by: abandoner, icon: '🏃', text: pick(LEAVE_BEHIND)(abandoner, victim) });
          addBond(abandoner, victim, -2); popDelta(abandoner, -0.4);
        }
        p1.events.push({ type: 'knockout', player: victim, icon: '📚', text: pickUniq(KNOCKED_OUT, usedKO)(victim, pronouns(victim)) });
        eliminate(victim, 1, 'knocked out');
      }
    }
  }

  // camp event summarizing the sabotage (consequence-bearing)
  if (firstOut) {
    const ev = p1.events.find(e => e.type === 'lockin');
    if (ev) {
      ep.campEvents[campKey].post.push({
        icon: '🔒', badgeText: 'SABOTAGE', badgeClass: 'bad',
        players: [ev.by, ev.player],
        text: `${ev.by} locked ${ev.player} inside the haunted library to steal a shot at immunity. ${ev.player} won't forget it.`,
      });
    }
  }
}

function _simKeys(alive, result, eliminate, ep, campKey) {
  // split into up to 3 groups (one per key)
  const nGroups = alive.length >= 6 ? 3 : alive.length >= 4 ? 2 : 1;
  const shuffled = [...alive].sort(() => Math.random() - 0.5);
  const groups = Array.from({ length: nGroups }, () => []);
  shuffled.forEach((n, i) => groups[i % nGroups].push(n));

  const roomPool = [...ROOMS].sort(() => Math.random() - 0.5);
  const done = new Set();

  groups.forEach((members, gi) => {
    const room = roomPool[gi % roomPool.length];
    const g = { room, members: [...members], survivors: [], fell: [], keyHolder: null, events: [] };
    g.events.push({ type: 'entry', icon: room.emoji, room: room.key, text: room.entry(_names(members)) });

    // roll each member; ~40% fall (with upsets), but the top roller always survives to claim the key
    const rolls = members.map(n => ({ n, r: _roomScore(n) }));
    const topRoller = [...rolls].sort((a, b) => b.r - a.r)[0]?.n;
    const usedSurv = new Set(), usedFall = new Set();
    rolls.sort((a, b) => b.r - a.r).forEach(({ n, r }) => {
      const fallChance = Math.min(0.78, Math.max(0.12, 0.70 - r * 0.055));
      const survived = n === topRoller || Math.random() >= fallChance;
      if (survived) {
        g.survivors.push(n);
        g.events.push({ type: 'survive', player: n, icon: '✅', room: room.key, text: pickUniq(room.survive, usedSurv)(n, pronouns(n)) });
        ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + 3;
      } else {
        g.fell.push(n);
        g.events.push({ type: 'fall', player: n, icon: '🕳️', room: room.key, text: pickUniq(room.fall, usedFall)(n, pronouns(n)) });
        eliminate(n, 2, 'fell');
      }
    });

    // key claimed by best survivor
    g.keyHolder = topRoller;
    g.events.push({ type: 'key', player: topRoller, icon: '🔑', room: room.key, text: pick(KEY_GRAB)(topRoller) });
    ep.chalMemberScores[topRoller] = (ep.chalMemberScores[topRoller] || 0) + 2;

    // one social beat per group among survivors
    const survPool = g.survivors;
    if (survPool.length >= 2) {
      const kinds = ['cheer', 'blame', 'target', 'olive'];
      _addSocial(g.events, survPool, done, pick(kinds), alive);
    }

    result.phase2.groups.push(g);
  });
}

function _simBoss(alive, result, ep, campKey) {
  const p3 = result.phase3;
  p3.finalists = [...alive];

  if (alive.length <= 1) {
    // trivial escape
    const w = alive[0];
    p3.immunityWinner = w || null;
    result.immunityWinner = w || null;
    if (w) {
      p3.knife[w] = 99;
      p3.events.push({ type: 'wake', icon: '🎎', text: p3.intro });
      p3.events.push({ type: 'escape', player: w, icon: '🚪', text: pick(ESCAPE_TEXT)(w) });
      popDelta(w, 1.0);
    }
    return;
  }

  p3.events.push({ type: 'wake', icon: '🎎', text: p3.intro });

  // base knife scores
  const scores = {};
  alive.forEach(n => { scores[n] = _knifeScore(n); });

  // doll attacks the 1-2 most reckless (high boldness, low temperament)
  const reckless = [...alive].sort((a, b) => (pStats(b).boldness - pStats(b).temperament) - (pStats(a).boldness - pStats(a).temperament));
  const attackN = alive.length >= 4 ? 2 : 1;
  const usedAtk = new Set();
  reckless.slice(0, attackN).forEach(n => {
    scores[n] -= 1.6;
    p3.events.push({ type: 'attack', player: n, icon: '🎃', text: pickUniq(BOSS_ATTACK, usedAtk)(n, pronouns(n)) });
    popDelta(n, 0.2);
  });

  // villain tackles: a schemer knocks a rival off the knife
  const schemers = alive.filter(canScheme);
  if (schemers.length) {
    const s = [...schemers].sort((a, b) => scores[b] - scores[a])[0];
    const rivals = alive.filter(n => n !== s).sort((a, b) => scores[b] - scores[a]);
    const t = rivals[0];
    if (t) {
      scores[t] -= 1.8; scores[s] += 0.6;
      p3.events.push({ type: 'tackle', player: t, by: s, icon: '🤼', text: pick(BOSS_TACKLE)(s, t) });
      addBond(t, s, -2); popDelta(s, -0.3);
    }
  }

  // provisional leader
  let winner = [...alive].sort((a, b) => scores[b] - scores[a])[0];

  // loyal assist: a nice ally may knock the leader's rival aside to boost a bonded friend
  const runnerUp = [...alive].filter(n => n !== winner).sort((a, b) => scores[b] - scores[a])[0];
  const helpers = alive.filter(n => NICE.includes(arch(n)) && n !== winner);
  const helper = helpers.find(h => getBond(h, runnerUp) >= 4 && runnerUp);
  if (helper && runnerUp && Math.random() < 0.4) {
    scores[runnerUp] += 2.2; scores[helper] -= 0.5;
    p3.events.push({ type: 'assist', player: runnerUp, by: helper, icon: '🛡️', text: BOSS_ASSIST[0](helper, winner, runnerUp) });
    addBond(helper, runnerUp, 2); popDelta(helper, 0.7);
  }

  // resolve
  winner = [...alive].sort((a, b) => scores[b] - scores[a])[0];
  p3.knife = scores;
  p3.immunityWinner = winner;
  result.immunityWinner = winner;
  p3.events.push({ type: 'escape', player: winner, icon: '🚪', text: pick(ESCAPE_TEXT)(winner) });
  popDelta(winner, 1.2);
}

// ══════════════════════════════════════════════════════════════
// VP — HAUNTED MANSION
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Special+Elite&family=Cinzel:wght@600;800&display=swap');
  .hh-shell{--ink:#e8e0d0;--blood:#a11414;--candle:#8bd66a;--gold:#c9a227;--purple:#3a1f52;
    font-family:'Special Elite',serif;color:var(--ink);
    background:radial-gradient(ellipse at 50% 0%,#241435 0%,#120a1c 55%,#080510 100%);
    max-width:1100px;margin:0 auto;position:relative;min-height:440px;overflow:clip;
    border:5px solid #000;box-shadow:0 0 0 3px #2a1a3d,0 14px 40px rgba(0,0,0,0.7)}
  .hh-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(circle at 20% 15%,rgba(139,214,106,0.10),transparent 32%),
      radial-gradient(circle at 82% 22%,rgba(161,20,20,0.10),transparent 34%);
    animation:hh-flick 5s ease-in-out infinite alternate}
  @keyframes hh-flick{0%{opacity:.7}50%{opacity:1}100%{opacity:.55}}
  .hh-shell::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.5;
    background-image:radial-gradient(circle,rgba(0,0,0,0.5) 1px,transparent 1px);background-size:5px 5px}
  @media(prefers-reduced-motion:reduce){.hh-shell::before{animation:none}.hh-cand,.hh-web{animation:none!important}}

  .hh-web{position:absolute;width:70px;height:70px;z-index:2;pointer-events:none;opacity:.35}
  .hh-cand{position:absolute;width:8px;height:20px;border-radius:50% 50% 45% 45%;z-index:2;pointer-events:none;
    background:linear-gradient(180deg,#fff6c0,#f0a020);box-shadow:0 0 12px 4px rgba(240,180,60,0.55);animation:hh-float 6s ease-in-out infinite}
  @keyframes hh-float{0%{transform:translateY(0)}50%{transform:translateY(-16px)}100%{transform:translateY(0)}}

  .hh-cover{position:relative;z-index:5;text-align:center;padding:34px 22px 30px}
  .hh-title{font-family:'Creepster',cursive;font-size:64px;line-height:0.92;color:var(--ink);
    text-shadow:0 0 18px rgba(139,214,106,0.45),3px 3px 0 #000;letter-spacing:2px}
  .hh-sub{font-family:'Cinzel',serif;font-size:12px;letter-spacing:5px;color:var(--gold);margin-top:8px}
  .hh-tag{font-family:'Special Elite';font-size:13px;color:#c9bfae;margin-top:14px;font-style:italic;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.5}
  .hh-roster{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:20px}
  .hh-badge{width:56px;text-align:center;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.6))}
  .hh-badge img{width:48px;height:48px;object-fit:contain;border-radius:6px;border:2px solid var(--purple);background:#0d0715}
  .hh-badge span{display:block;font-size:9px;color:#b8ad9a;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  .hh-layout{display:flex;gap:0;position:relative;z-index:5;min-height:320px}
  .hh-feed{flex:1;padding:16px 18px 96px;min-width:0}
  .hh-side{width:224px;flex-shrink:0;padding:14px 12px;background:linear-gradient(180deg,#160d24,#0c0716);
    border-left:3px solid var(--purple);position:sticky;top:0;align-self:flex-start;max-height:82vh;overflow-y:auto}
  .hh-side-h{font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;color:var(--gold);
    border-bottom:1px solid rgba(201,162,39,0.3);padding-bottom:4px;margin:12px 0 8px}
  .hh-side-h:first-child{margin-top:0}
  .hh-srow{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px}
  .hh-srow img{width:20px;height:20px;object-fit:contain;border-radius:3px}
  .hh-srow.out{opacity:.4}.hh-srow.out img{filter:grayscale(1)}
  .hh-srow.out .hh-nm{text-decoration:line-through;color:#8a7f6e}
  .hh-srow.esc .hh-nm{color:var(--candle);font-weight:bold}
  .hh-nm{color:#ddd3c0}.hh-mini{font-size:8px;color:#7a7060;margin-left:auto}

  .hh-phase-h{font-family:'Creepster',cursive;font-size:30px;color:var(--candle);text-shadow:0 0 12px rgba(139,214,106,0.4),2px 2px 0 #000;margin:4px 0 10px;letter-spacing:1px}
  .hh-intro{font-style:italic;color:#c4baa8;font-size:13px;line-height:1.55;border-left:3px solid var(--purple);padding:6px 12px;margin-bottom:14px;background:rgba(58,31,82,0.2)}
  .hh-step{margin:9px 0;transition:opacity .3s;scroll-margin-top:20px}
  .hh-card{background:linear-gradient(180deg,rgba(24,16,36,0.92),rgba(14,9,22,0.92));border:1px solid #33224a;border-radius:8px;
    padding:10px 12px;display:flex;gap:10px;align-items:flex-start;box-shadow:0 4px 14px rgba(0,0,0,0.4)}
  .hh-card .hh-ico{font-size:20px;flex-shrink:0;filter:drop-shadow(0 0 4px rgba(139,214,106,0.4))}
  .hh-card .hh-txt{font-size:13px;line-height:1.5;color:#e2d8c6}
  .hh-card.find{border-left:4px solid var(--gold)}
  .hh-card.unlock{border-left:4px solid var(--candle);background:linear-gradient(180deg,rgba(40,60,30,0.6),rgba(14,9,22,0.9))}
  .hh-card.bad{border-left:4px solid var(--blood);background:linear-gradient(180deg,rgba(60,16,16,0.55),rgba(14,9,22,0.9))}
  .hh-card.key{border-left:4px solid var(--gold);background:linear-gradient(180deg,rgba(60,48,16,0.4),rgba(14,9,22,0.9))}
  .hh-card.social{border:1px dashed #5a4a72;background:rgba(40,26,58,0.5)}
  .hh-card.escape{border-left:5px solid var(--candle);background:linear-gradient(90deg,rgba(139,214,106,0.18),rgba(14,9,22,0.9));animation:hh-glow 1.4s ease-in-out infinite alternate}
  @keyframes hh-glow{from{box-shadow:0 0 8px rgba(139,214,106,0.3)}to{box-shadow:0 0 22px rgba(139,214,106,0.6)}}
  .hh-card.boss{border:2px solid var(--blood);background:linear-gradient(180deg,rgba(50,10,10,0.7),rgba(20,6,6,0.95));animation:hh-shake .5s}
  @keyframes hh-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
  .hh-pill{display:inline-block;font-family:'Cinzel',serif;font-size:9px;letter-spacing:1px;padding:1px 6px;border-radius:3px;margin-bottom:3px}
  .hh-room-h{font-family:'Cinzel',serif;font-size:15px;color:var(--gold);margin:16px 0 6px;border-bottom:1px solid rgba(201,162,39,0.25);padding-bottom:3px}
  .hh-avs{display:flex;gap:-6px}.hh-avs img{width:26px;height:26px;object-fit:contain;border-radius:4px;border:1px solid #000;margin-left:-6px;background:#0d0715}
  .hh-avs img:first-child{margin-left:0}

  .hh-ctrl{position:sticky;bottom:0;z-index:20;display:flex;gap:8px;align-items:center;justify-content:center;
    padding:10px;margin:0 -18px -96px;background:linear-gradient(0deg,#0a0512,rgba(10,5,18,0.85) 70%,transparent);backdrop-filter:blur(2px)}
  .hh-btn{font-family:'Cinzel',serif;font-size:12px;letter-spacing:1px;cursor:pointer;padding:8px 16px;border-radius:5px;
    border:1px solid var(--purple);background:linear-gradient(180deg,#2a1a3d,#160d24);color:var(--ink)}
  .hh-btn:hover{border-color:var(--candle);color:var(--candle)}
  .hh-btn.all{border-color:var(--blood)}
  .hh-cnt{font-family:'Special Elite';font-size:11px;color:#9a8f7e}
  .hh-done{font-family:'Cinzel',serif;font-size:12px;color:var(--candle);text-align:center;padding:10px}
  </style>`;
}

function _webs() {
  const w = (x, y, r) => `<svg class="hh-web" style="${x};${y};transform:rotate(${r}deg)" viewBox="0 0 100 100"><g stroke="#b8ad9a" stroke-width="1" fill="none"><path d="M0 0 L100 100 M0 0 L100 40 M0 0 L40 100 M0 0 L70 100 M0 0 L100 70"/><path d="M15 15 Q40 10 55 55 Q10 40 15 15"/><path d="M30 30 Q60 22 75 75 Q22 60 30 30"/></g></svg>`;
  return w('top:0', 'left:0', 0) + w('top:0', 'right:0', 90);
}

function _shell(content) {
  const cands = [
    'top:60px;left:40px', 'top:90px;right:70px', 'top:150px;left:120px', 'top:120px;right:180px', 'top:200px;right:40px',
  ].map((p, i) => `<div class="hh-cand" style="${p};animation-delay:${i * 0.7}s"></div>`).join('');
  return `${css()}<div class="hh-shell">${_webs()}${cands}${content}</div>`;
}

// ── Sidebar: escape status ──
function _sideStatus(result, revealedOut, escaped) {
  const active = result._active || [];
  const outNames = {};
  result.outOrder.forEach(o => { outNames[o.name] = o; });
  let h = `<div class="hh-side-h">👻 ESCAPE STATUS</div>`;
  const inside = active.filter(n => !revealedOut.has(n) && n !== escaped);
  if (escaped) {
    h += `<div class="hh-srow esc">${portrait(escaped, 20)}<span class="hh-nm">${escaped}</span><span class="hh-mini">ESCAPED ✦</span></div>`;
  }
  inside.forEach(n => {
    h += `<div class="hh-srow">${portrait(n, 20)}<span class="hh-nm">${n}</span></div>`;
  });
  const outList = [...revealedOut];
  if (outList.length) {
    h += `<div class="hh-side-h" style="color:var(--blood)">💀 OUT</div>`;
    outList.forEach(n => {
      const o = outNames[n];
      const tag = o ? (o.reason === 'locked in' ? 'LOCKED IN' : o.reason === 'fell' ? `FELL` : 'KO') : '';
      h += `<div class="hh-srow out">${portrait(n, 20)}<span class="hh-nm">${n}</span><span class="hh-mini">${tag}</span></div>`;
    });
  }
  return h;
}

function _ctrl(suffix, total, revIdx) {
  const done = revIdx >= total - 1;
  return `<div class="hh-ctrl" id="hh-ctrl-${suffix}" style="${done ? 'display:none' : ''}">
      <button class="hh-btn" onclick="hauntedRevealNext('hh-${suffix}',${total})">Next →</button>
      <span class="hh-cnt" id="hh-cnt-${suffix}">${Math.max(0, revIdx + 1)} / ${total}</span>
      <button class="hh-btn all" onclick="hauntedRevealAll('hh-${suffix}',${total})">Reveal all</button>
    </div>
    <div class="hh-done" id="hh-done-${suffix}" style="${done ? '' : 'display:none'}">— the house falls silent —</div>`;
}

function _steps(suffix, stepHtmls, revIdx) {
  return stepHtmls.map((html, i) =>
    `<div class="hh-step" id="hh-step-${suffix}-${i}" style="display:${i <= revIdx ? '' : 'none'}">${html}</div>`
  ).join('');
}

function _card(cls, ev) {
  const players = ev.players || (ev.player ? [ev.player] : []);
  const avs = players.length ? `<div class="hh-avs">${players.map(n => portrait(n, 26)).join('')}</div>` : `<span class="hh-ico">${ev.icon || ''}</span>`;
  return `<div class="hh-card ${cls}">${avs}<div class="hh-txt">${ev.text}</div></div>`;
}

export function rpBuildHauntedTitleCard(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const active = ep.tribalPlayers || [];
  const badges = active.map(n =>
    `<div class="hh-badge"><img src="assets/avatars/${slugOf(n)}.png" onerror="this.style.display='none'"><span>${n}</span></div>`
  ).join('');
  return _shell(`
    <div class="hh-cover">
      <div class="hh-sub">STAWAKI CARNIVAL PRESENTS</div>
      <div class="hh-title">Haunted<br>House</div>
      <div class="hh-sub" style="margin-top:10px">THREE ROOMS · ONE ESCAPE · ${host().toUpperCase()}'S MANSION</div>
      <div class="hh-tag">"${r.open}"</div>
      <div class="hh-tag" style="color:var(--candle)">First one out the front door wins immunity. Everyone else walks to the vote.</div>
      <div class="hh-roster">${badges}</div>
    </div>
  `);
}

export function rpBuildHauntedLibrary(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const suffix = 'library';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['hh-library']) window._tvState['hh-library'] = { idx: -1 };
  const revIdx = window._tvState['hh-library'].idx;
  window.hhData = r; r._active = ep.tribalPlayers || [];

  const steps = [];
  const meta = []; // cumulative out-set per step
  const outSet = new Set();
  if (r.nostalgia) { steps.push(`<div class="hh-intro">${r.nostalgia}</div>`); meta.push(new Set(outSet)); }
  if (r.fear) { steps.push(`<div class="hh-intro" style="border-color:var(--blood)">${r.fear}</div>`); meta.push(new Set(outSet)); }
  for (const ev of r.phase1.events) {
    let cls = 'find';
    if (ev.type === 'unlock') cls = 'unlock';
    else if (ev.type === 'lockin' || ev.type === 'knockout' || ev.type === 'leave') cls = 'bad';
    else if (ev.type === 'help') cls = 'unlock';
    else if (ev.type === 'social') cls = 'social';
    let extra = '';
    if (ev.type === 'lockin') extra = `<span class="hh-pill" style="background:var(--blood);color:#fff">SABOTAGE</span><br>`;
    else if (ev.type === 'knockout') extra = `<span class="hh-pill" style="background:#5a2020;color:#fff">KNOCKED OUT</span><br>`;
    else if (ev.type === 'social') extra = `<span class="hh-pill" style="background:var(--purple);color:#ddd">SOCIAL</span><br>`;
    steps.push(_card(cls, { ...ev, text: extra + ev.text }));
    if (ev.type === 'lockin' || ev.type === 'knockout') outSet.add(ev.player);
    meta.push(new Set(outSet));
  }
  window.hhLibMeta = meta.map(s => [...s]);

  return _shell(`
    <div class="hh-layout">
      <div class="hh-feed">
        <div class="hh-phase-h">Room I · The Library</div>
        <div class="hh-intro">${r.phase1.intro} The lock reads four digits: <b style="color:var(--gold)">? ? ? ?</b></div>
        ${_steps(suffix, steps, revIdx)}
        ${_ctrl(suffix, steps.length, revIdx)}
      </div>
      <div class="hh-side" id="hh-side-${suffix}">${_sideStatus(r, new Set((window.hhLibMeta[Math.max(0, revIdx)] || [])), null)}</div>
    </div>
  `);
}

export function rpBuildHauntedKeys(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const suffix = 'keys';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['hh-keys']) window._tvState['hh-keys'] = { idx: -1 };
  const revIdx = window._tvState['hh-keys'].idx;
  window.hhData = r; r._active = ep.tribalPlayers || [];

  // out from phase 1 already gone before this screen
  const preOut = new Set(r.outOrder.filter(o => o.phase === 1).map(o => o.name));
  const steps = [];
  const meta = [];
  const outSet = new Set(preOut);
  r.phase2.groups.forEach(g => {
    steps.push(`<div class="hh-room-h">${g.room.emoji} ${g.room.name}</div>`);
    meta.push(new Set(outSet));
    for (const ev of g.events) {
      let cls = 'find';
      if (ev.type === 'entry') cls = 'social';
      else if (ev.type === 'survive') cls = 'find';
      else if (ev.type === 'fall') cls = 'bad';
      else if (ev.type === 'key') cls = 'key';
      else if (ev.type === 'social') cls = 'social';
      let extra = '';
      if (ev.type === 'fall') extra = `<span class="hh-pill" style="background:#5a2020;color:#fff">FELL</span><br>`;
      else if (ev.type === 'key') extra = `<span class="hh-pill" style="background:var(--gold);color:#111">KEY ${'✦'}</span><br>`;
      else if (ev.type === 'social') extra = `<span class="hh-pill" style="background:var(--purple);color:#ddd">SOCIAL</span><br>`;
      steps.push(_card(cls, { ...ev, text: extra + ev.text }));
      if (ev.type === 'fall') outSet.add(ev.player);
      meta.push(new Set(outSet));
    }
  });
  window.hhKeysMeta = meta.map(s => [...s]);

  return _shell(`
    <div class="hh-layout">
      <div class="hh-feed">
        <div class="hh-phase-h">Room II · Three Keys</div>
        <div class="hh-intro">The next door needs three keys. The survivors split up — each team braves a different cursed room to bring one back. Fall through, and you're done.</div>
        ${_steps(suffix, steps, revIdx)}
        ${_ctrl(suffix, steps.length, revIdx)}
      </div>
      <div class="hh-side" id="hh-side-${suffix}">${_sideStatus(r, new Set((window.hhKeysMeta[Math.max(0, revIdx)] || preOut)), null)}</div>
    </div>
  `);
}

export function rpBuildHauntedBoss(ep) {
  const r = ep.hauntedHouse; if (!r) return '';
  const suffix = 'boss';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['hh-boss']) window._tvState['hh-boss'] = { idx: -1 };
  const revIdx = window._tvState['hh-boss'].idx;
  window.hhData = r; r._active = ep.tribalPlayers || [];

  const allOut = new Set(r.outOrder.map(o => o.name));
  const steps = [];
  const meta = []; // {out, escaped}
  r.phase3.events.forEach(ev => {
    let cls = 'boss';
    if (ev.type === 'wake') cls = 'boss';
    else if (ev.type === 'attack') cls = 'bad';
    else if (ev.type === 'tackle') cls = 'bad';
    else if (ev.type === 'assist') cls = 'unlock';
    else if (ev.type === 'escape') cls = 'escape';
    let extra = '';
    if (ev.type === 'escape') extra = `<span class="hh-pill" style="background:var(--candle);color:#111">IMMUNITY ✦</span><br>`;
    else if (ev.type === 'tackle') extra = `<span class="hh-pill" style="background:var(--blood);color:#fff">TACKLE</span><br>`;
    else if (ev.type === 'assist') extra = `<span class="hh-pill" style="background:var(--candle);color:#111">ASSIST</span><br>`;
    steps.push(_card(cls, { ...ev, text: extra + ev.text }));
    meta.push({ escaped: ev.type === 'escape' ? ev.player : null });
  });
  window.hhBossMeta = meta;

  const curEscaped = (revIdx >= 0 && meta[revIdx] && meta[revIdx].escaped) ||
    (meta.slice(0, revIdx + 1).find(m => m.escaped) || {}).escaped || null;

  // finalists shown as "at the boss"
  const finalists = r.reachedBoss || [];
  let finSide = `<div class="hh-side-h">🎎 FINALISTS</div>`;
  finalists.forEach(n => {
    const esc = n === curEscaped;
    finSide += `<div class="hh-srow ${esc ? 'esc' : ''}">${portrait(n, 20)}<span class="hh-nm">${n}</span>${esc ? '<span class="hh-mini">ESCAPED ✦</span>' : ''}</div>`;
  });
  finSide += _sideStatus(r, allOut, curEscaped);

  return _shell(`
    <div class="hh-layout">
      <div class="hh-feed">
        <div class="hh-phase-h" style="color:var(--blood)">Room III · The Ordinary Girl Doll</div>
        ${_steps(suffix, steps, revIdx)}
        ${_ctrl(suffix, steps.length, revIdx)}
      </div>
      <div class="hh-side" id="hh-side-${suffix}">${finSide}</div>
    </div>
  `);
}

// ── Reveal handlers ──
function _hhUpdateSidebar(screenKey, revIdx) {
  const suffix = screenKey.replace('hh-', '');
  const sideEl = document.getElementById(`hh-side-${suffix}`);
  const r = window.hhData;
  if (!sideEl || !r) return;
  if (suffix === 'library') {
    const out = new Set(window.hhLibMeta?.[Math.max(0, revIdx)] || []);
    sideEl.innerHTML = _sideStatus(r, out, null);
  } else if (suffix === 'keys') {
    const preOut = r.outOrder.filter(o => o.phase === 1).map(o => o.name);
    const out = new Set(window.hhKeysMeta?.[Math.max(0, revIdx)] || preOut);
    sideEl.innerHTML = _sideStatus(r, out, null);
  } else if (suffix === 'boss') {
    const meta = window.hhBossMeta || [];
    const escaped = (meta.slice(0, revIdx + 1).find(m => m.escaped) || {}).escaped || null;
    const allOut = new Set(r.outOrder.map(o => o.name));
    let h = `<div class="hh-side-h">🎎 FINALISTS</div>`;
    (r.reachedBoss || []).forEach(n => {
      const esc = n === escaped;
      h += `<div class="hh-srow ${esc ? 'esc' : ''}">${portrait(n, 20)}<span class="hh-nm">${n}</span>${esc ? '<span class="hh-mini">ESCAPED ✦</span>' : ''}</div>`;
    });
    h += _sideStatus(r, allOut, escaped);
    sideEl.innerHTML = h;
  }
}

export function hauntedRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  if (st.idx >= total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('hh-', '');
  const el = document.getElementById(`hh-step-${suffix}-${st.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`hh-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${st.idx + 1} / ${total}`;
  if (st.idx >= total - 1) {
    const c = document.getElementById(`hh-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const d = document.getElementById(`hh-done-${suffix}`); if (d) d.style.display = '';
  }
  _hhUpdateSidebar(screenKey, st.idx);
}

export function hauntedRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  const suffix = screenKey.replace('hh-', '');
  for (let i = st.idx + 1; i < total; i++) {
    const el = document.getElementById(`hh-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  st.idx = total - 1;
  const cnt = document.getElementById(`hh-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`hh-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const d = document.getElementById(`hh-done-${suffix}`); if (d) d.style.display = '';
  _hhUpdateSidebar(screenKey, st.idx);
}
