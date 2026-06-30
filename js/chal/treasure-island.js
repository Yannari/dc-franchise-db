// ══════════════════════════════════════════════════════════════════════
// treasure-island.js — "The Treasure Island of Dr. McLean" (both-phase)
// A paired underwater treasure hunt. Castaways pair off (bond-driven),
// cut their lifeboats loose and paddle to the dive checkpoint, then one
// dives while the other guides from the surface with a chart. Down in the
// sunken cave the chest is fought over hand-to-hand — until a diver gets
// wedged and runs out of air, forcing the leading crew to choose between
// the win and a rescue. CPR on the deck. Pirate dive VP.
//
// Pre-merge:  pairs form WITHIN each tribe; tribe ranked by avg crew score
//             (per-member, never raw sums). Odd member = solo diver w/ handicap.
//             Losing tribe → tribal.
// Post-merge: the winning crew earns immunity for BOTH + keepsakes. A
//             dominant, tightly-bonded crew may gift extra immunity to an ally.
//
// Source inspiration: TDRI "The Treasure Island of Dr. McLean" (idol in the
// chest, buried teammates, mutant lake hazards) + the DC4 merge dive (pairs,
// diver/guide, chest steal cascade, Logan's near-drowning + CPR, keepsakes,
// giftable immunity).
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── helpers ──
function host() { return seasonConfig?.hostName || 'Derek'; }
function host2() { return seasonConfig?.hostName2 || 'Trevor'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const noise = (n = 2.5) => (Math.random() - 0.5) * 2 * n;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }

// Deterministic-ish text picker so re-renders of the same VP stay stable
function _pick(arr, seed) {
  if (!arr || !arr.length) return '';
  let h = 0; const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return arr[h % arr.length];
}

const VILLAIN_ARCH = ['villain', 'mastermind', 'schemer'];
const NICE_ARCH = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function isVillain(name) { return VILLAIN_ARCH.includes(arch(name)); }
function isNice(name) { return NICE_ARCH.includes(arch(name)); }
function canScheme(name) {
  const a = arch(name);
  if (VILLAIN_ARCH.includes(a)) return true;
  if (NICE_ARCH.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function _pop(name, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; }

// keepsake items — flavored by archetype (no real-world brands)
const KEEPSAKES = {
  villain:'a cracked hand mirror', mastermind:'a worn chess knight', schemer:'a deck of marked cards',
  hothead:'a dented harmonica', 'challenge-beast':'a championship whistle', 'social-butterfly':'a friendship-bead bracelet',
  'loyal-soldier':'a folded letter from home', wildcard:'a rubber chicken', 'chaos-agent':'a single firecracker',
  floater:'a pocket-worn coin', underdog:'a lucky bottle cap', hero:'a faded comic book',
  villain2:'', goat:'a stuffed goat plush', 'perceptive-player':'a magnifying glass', showmancer:'a pressed flower',
};
function keepsake(name) { return KEEPSAKES[arch(name)] || 'a small keepsake from home'; }

// ══════════════════════════════════════════════════════════════════════
// TEXT POOLS — every social beat carries a gameplay consequence
// ══════════════════════════════════════════════════════════════════════
const HOST_OPENERS = [
  "Welcome aboard, ye landlubbers! Today the teams are scrapped — you're pairing off and diving for buried treasure.",
  "Somewhere at the bottom of this lake sits Dr. McLean's lost chest. Pick a partner, grab a chart, and pray your lungs hold.",
  "Pajamas courtesy of our sponsor, and a one-way ticket to the bottom of the lake. Pair up — one dives, one guides.",
  "Two to a lifeboat, one chest below, and only one crew surfaces with immunity. Try not to drown out there.",
];
const HOST_CLOSERS = [
  "Chest's recovered, lungs are mostly intact, and somebody's getting voted off tonight. Beautiful.",
  "And that's a wrap! Towel off, you soggy pirates. The Elimination Trial waits for no one.",
  "Another flawless dive with only one near-death experience. New record!",
  "Haul it in, crew. The treasure's claimed and the boat of losers is fueled up.",
];

// Pairing flavor by archPair
const PAIR_FLAVOR = {
  showmance:[ `The showmance gets to share a lifeboat. Romance and treasure — what could go wrong below the surface?`,
    `Already inseparable, now literally in the same boat. They beam at each other.`,
    `A couple's dive. They split the roles before anyone even asks.` ],
  rivals:[ `Two castaways who can't stand each other, lashed to one tiny lifeboat. This will be loud.`,
    `Perfect. The two people most likely to "accidentally" capsize each other.`,
    `A grudge with a paddle. They glare, grab opposite oars, and refuse to sync.` ],
  villain_hero:[ `A schemer and a saint share a boat. One's calculating, the other's just happy to be here.`,
    `Nobody would have picked this. That's exactly why the draw did.`,
    `The villain eyes the guide tablet like a weapon. The hero just wants to help.` ],
  strangers:[ `They've barely spoken all season. Now they're a crew of two, eighty feet of water below them.`,
    `Two near-strangers forced to trust each other underwater. Acquaintance by necessity.`,
    `A first real conversation, struck up over a shared paddle. Awkward, then not.` ],
  allies:[ `Two allies, one boat — they already finish each other's sentences. Dangerous in the water and at tribal.`,
    `The tightest pair in the draw. They lock eyes, nod, and have a plan before the horn.`,
    `Built-in trust. They divvy diver and guide in three seconds flat.` ],
  default:[ `A workable crew. They shake on it and grab the oars.`,
    `Two names, one lifeboat, one chest to chase.`,
    `Not friends, not enemies. Just a crew with a job to do.` ],
};

// Role split
const ROLE_SPLIT = [
  (d, g) => `${d} takes the dive — stronger lungs — while ${g} reads the chart up top. "Don't steer me into a wall." "No promises."`,
  (d, g) => `${g} can read a current map in ${pronouns(g).posAdj} sleep, so ${g} guides and ${d} goes under.`,
  (d, g) => `They split it the obvious way: ${d} dives, ${g} navigates. A handshake seals it.`,
  (d, g) => `${d} volunteers for the deep end before ${g} can argue. ${g} takes the tablet and the responsibility.`,
];

// PHASE 1 — CUT & PADDLE
const CUT_OK = [
  (c) => `${c} saws the lifeboat ropes clean and shoves off in one smooth motion. Off the mark first.`,
  (c) => `${c} cuts the mooring fast and digs the paddles in hard. The little boat leaps forward.`,
  (c) => `Ropes cut, boat loose, oars churning — ${c} hits a rhythm immediately.`,
];
const PADDLE_SYNC = [
  (a, b) => `${a} and ${b} find a stroke rhythm right away, the lifeboat skipping across the chop. In sync.`,
  (a, b) => `"Stroke — stroke — stroke." ${a} calls it, ${b} matches it, and they pull away from the pack.`,
  (a, b) => `Paddles dipping as one, ${a} and ${b} read the water like they've crewed together for years.`,
];
const PADDLE_CLASH = [
  (a, b) => `${a} pulls left, ${b} pulls right, and the lifeboat spins a lazy circle. "You're paddling backwards!" "YOU are!"`,
  (a, b) => `${a} catches a crab and splashes ${b} square in the face. The boat slows to a wobble while they bicker.`,
  (a, b) => `No rhythm at all — ${a} and ${b} fight the current and each other, losing ground with every clumsy stroke.`,
];
const PADDLE_NEARTIP = [
  (a, b) => `${a} leans too far and nearly flips the boat; ${b} throws their weight the other way just in time. White-knuckle balance.`,
  (a, b) => `A wake rocks the lifeboat. ${a} grabs ${b}'s arm, they steady it together, and keep going — hearts pounding.`,
];

// PHASE 2 — THE DIVE (descent)
const DESCEND = [
  (d, p) => `${d} jackknifes off the lifeboat and knifes down into the green dark, bubbles trailing.`,
  (d, p) => `${d} takes one huge breath and drops, kicking hard for the cave glow below.`,
  (d, p) => `Down ${d} goes, equalizing on the way, headed for the sunken cave mouth.`,
  (d, p) => `${d} slips under without a splash and fins toward the chest's faint glint.`,
];
const GUIDE_OK = [
  (g, d, p) => `Topside, ${g} reads the current chart and taps the tablet — "left tunnel, ${d}, LEFT" — and ${d} threads it perfectly.`,
  (g, d, p) => `${g} calls the route clean from the surface. ${d} follows the directions straight to the cave.`,
  (g, d, p) => `${g} keeps the map steady and the calls calm. Below, ${d} never loses the line.`,
];
const GUIDE_BAD = [
  (g, d, p) => `${g} fumbles the chart and sends ${d} into a dead-end gallery. Precious air wasted backtracking.`,
  (g, d, p) => `The tablet glare blinds ${g} for a second and ${d} drifts off-route, burning lungfuls finding the way back.`,
  (g, d, p) => `${g}'s directions come a beat too late; ${d} overshoots the tunnel and has to double back.`,
];

// PHASE 2 — chest contest (steal cascade)
const CHEST_GRAB = [
  (n, p) => `${n} reaches the chest first and wraps both arms around it, kicking for the exit.`,
  (n, p) => `${n} pries the chest off the cave floor and powers toward open water with it.`,
  (n, p) => `${n} gets a hand on the chest in the silt cloud and starts hauling it out.`,
];
const CHEST_STEAL = [
  (n, t, p) => `${n} collides with ${t} in the cave and rips the chest clean out of ${pronouns(t).posAdj} grip, kicking ahead.`,
  (n, t, p) => `${n} times it perfectly — as ${t} squeezes through the gap, ${n} snatches the chest and shoves ${pronouns(t).obj} aside.`,
  (n, t, p) => `${n} wrenches the chest from ${t} in a cloud of bubbles. ${t} is left grabbing at water.`,
];
const CHEST_BLOCK = [
  (n, t, p) => `${n} headbutts ${t}'s mask and the chest tumbles free, spinning down toward another diver in the current.`,
  (n, t, p) => `${n} body-checks ${t} off the chest. It slips loose and drifts deeper into the contest.`,
  (n, t, p) => `${n} jams a fin against the gap so ${t} can't pass with the chest. It squirts from ${pronouns(t).posAdj} hands.`,
];

// PHASE 3 — THE CRISIS (wedged / out of air)
const WEDGE = [
  (v, p) => `${v} swipes the chest and bolts for a gap that's just too small — and jams fast, wedged in the rock with the chest pinned beneath ${p.obj}.`,
  (v, p) => `Going for a shortcut, ${v} forces into a narrow tunnel and gets stuck at the hips. The chest slips away; ${p.sub} can't reverse out.`,
  (v, p) => `${v} takes the reckless line, squeezes into a crevice — and stops dead, pinned. The exit's inches away and impossible.`,
];
const AIR_CRITICAL = [
  (v, p) => `${v}'s air gauge spins into the red. Bubbles stream from the regulator. ${p.Sub} thrashes, but the rock won't give.`,
  (v, p) => `The last of ${v}'s breath leaks out in a silver rush. ${p.posAdj.charAt(0).toUpperCase()+p.posAdj.slice(1)} kicks go weak. This is bad.`,
  (v, p) => `${v} is out of air and out of room. The struggling slows. Somebody has to get to ${p.obj} NOW.`,
];
const CHOICE_FRAME = [
  (l, v) => `${l} is two kicks from the surface with a clear shot at the chest. Below, ${v} has stopped fighting. Win it — or drop everything and dive back.`,
  (l, v) => `The chest is right there for ${l}. So is ${v}, pinned and going still in the dark. There's only time for one.`,
  (l, v) => `${l} freezes at the fork: glory at the surface, or ${v} drowning below. The whole lake seems to hold its breath.`,
];
const RESCUE_DO = [
  (l, v, p) => `${l} lets the chest go. ${pronouns(l).Sub} powers down, jams a shoulder against the rock, and wrenches ${v} free in a cloud of silt. They rocket up together.`,
  (l, v, p) => `No hesitation — ${l} abandons the win and dives. ${pronouns(l).Sub} braces both feet and hauls ${v} out of the crevice, dragging ${p.obj} toward the light.`,
  (l, v, p) => `${l} turns away from the chest and back toward ${v}. One huge pull, the rock releases, and ${l} kicks for the surface with ${p.obj} in tow.`,
];
const KEEP_DIVING = [
  (l, v) => `${l} looks at ${v}, looks at the chest — and chooses the chest. ${pronouns(l).Sub} kicks for daylight with the prize while someone else has to go back.`,
  (l, v) => `Cold-blooded. ${l} surfaces with the chest and lets the others deal with ${v}. The crowd on the boat goes quiet.`,
  (l, v) => `${l} doesn't slow down. The win is the win. ${v} is somebody else's problem, and everybody watching clocks it.`,
];
const RESCUE_OTHER = [
  (r, v, p) => `${r} sees ${v} go still and doesn't think twice — straight down, both hands on the rock, prying ${v} loose and kicking for the top.`,
  (r, v, p) => `${r} ditches ${pronouns(r).posAdj} own run and dives for ${v}, wrenching ${p.obj} free of the crevice with a desperate heave.`,
];
const CPR = [
  (r, v, p) => `On the deck — no breath. ${r} tilts ${v}'s head back and starts compressions. One, two, three... ${v} coughs up half the lake and gasps awake.`,
  (r, v, p) => `${r} drags ${v} over the gunwale and gives CPR right there on the boards. A cough, a sputter, and ${v} is breathing. Alive.`,
  (r, v, p) => `${r} pumps ${v}'s chest, counts, breathes for ${p.obj} — and ${v} jolts back to life, water spilling from ${p.posAdj} lips.`,
];
const CPR_WAKE = [
  (v, r) => `"...Did ${r} just kiss me, or was that lake water?" ${v} mumbles, dazed and grinning.`,
  (v, r) => `${v} blinks up at ${r}. "You came back for me." Nobody on the boat is dry-eyed.`,
  (v, r) => `${v} grabs ${r}'s wrist. "I owe you one. A big one." ${r} just nods, soaked and shaking.`,
];

// PHASE 4 — surfacing with the chest
const CHEST_WIN = [
  (a, b) => `With every other diver scrambling for the rescue, ${a} and ${b} quietly surface with the chest held high. Immunity.`,
  (a, b) => `${a} breaks the surface, chest first, ${b} whooping on the lifeboat. The crew claims the prize.`,
  (a, b) => `${a} and ${b} haul the chest onto their boat and pop the lid — Dr. McLean's lost treasure, and immunity, are theirs.`,
];

// SOCIAL DRAMA (between beats — surface and below)
const SOC_BOND = [
  (a, b) => `Treading water at the checkpoint, ${a} steadies ${b}'s air line a beat too long. A quiet trust forms between them.`,
  (a, b) => `${a} shares ${pronouns(a).posAdj} spare mask strap with ${b} without being asked. Small kindness, banked.`,
  (a, b) => `${a} and ${b} compare chart notes and realize they think the same way. Something clicks.`,
];
const SOC_RESPECT = [
  (a, b) => `${a} watches ${b} free-dive deeper than anyone and surface calm as glass. "Okay, that was impressive," ${a} admits.`,
  (a, b) => `Even ${a} has to nod at how cool ${b} stays in the cave. Respect, earned underwater.`,
];
const SOC_ALLIANCE = [
  (a, b) => `Topside while the divers fight below, ${a} floats an alliance to ${b}. By the time the bubbles clear, they've shaken on it.`,
  (a, b) => `${a} pitches ${b} a final-handful deal between dives. ${b}'s in — and somebody nearby narrows their eyes.`,
  (a, b) => `${a} and ${b} use the downtime on the boat to lock numbers for the next vote. Strategy in the spray.`,
];
const SOC_RIVALRY = [
  (a, b) => `${a} and ${b} both surface claiming the same lane and nearly come to blows on the lifeboat. The grudge deepens.`,
  (a, b) => `${a} "accidentally" splashes ${b}'s chart off the boat. ${b} doesn't buy the accident for a second.`,
];
const SOC_TAUNT = [
  (a, b) => `${a} can't resist mocking ${b}'s belly-flop entry for the cameras. ${b} says nothing — and remembers everything.`,
  (a, b) => `"Nice dive, did you find the bottom with your face?" ${a} jeers. ${b}'s jaw tightens.`,
];
const SOC_PARANOIA = [
  (a, b) => `${a} catches ${b} whispering to a rival crew between dives and immediately assumes the worst. The suspicion spreads across the boats.`,
  (a, b) => `${a} can't shake the feeling ${b} is steering allies toward a blindside. True or not, ${a} is telling people.`,
];
const SOC_BANTER = [
  (a, b) => `${a} and ${b} spend a whole surface interval debating whether the lake has a monster. ${b} swears ${pronouns(b).sub} saw a tentacle. Morale climbs anyway.`,
  (a, b) => `${a} narrates ${b}'s dive like a nature documentary until ${b} surfaces laughing too hard to argue.`,
];

function _socialBeats(phase, active, count, sidebarTribeOf) {
  if (active.length < 2) return;
  for (let i = 0; i < count; i++) {
    const a = pick(active);
    const b = pick(active.filter(m => m !== a));
    if (!b) continue;
    const r = Math.random();
    if (r < 0.14) {
      _pop(a, 1); _pop(b, 1);
      phase.events.push({ type:'banter', player:a, target:b, text:pick(SOC_BANTER)(a, b), badge:'BANTER', badgeClass:'green', icon:'bottle' });
    } else if (r < 0.30 && (canScheme(a) || pStats(a).social >= 6)) {
      addBond(a, b, 1.5);
      phase.events.push({ type:'alliance', player:a, target:b, text:pick(SOC_ALLIANCE)(a, b), badge:'ALLIANCE', badgeClass:'cyan', icon:'spyglass', social:true });
    } else if (getBond(a, b) + noise(4) >= 0) {
      const t = Math.random() < 0.5 ? 'bond' : 'respect';
      addBond(a, b, 0.8);
      if (t === 'respect') _pop(b, 1);
      phase.events.push({ type:t, player:a, target:b, text:pick(t === 'bond' ? SOC_BOND : SOC_RESPECT)(a, b),
        badge:t === 'respect' ? 'RESPECT' : 'TRUST', badgeClass:'green', icon:'anchor', social:true });
    } else {
      const t = pick(['rivalry', 'taunt', 'paranoia']);
      addBond(a, b, t === 'paranoia' ? -0.5 : -0.8);
      if (t === 'taunt') _pop(a, -1);
      if (t === 'paranoia') _pop(b, -1);
      phase.events.push({ type:t, player:a, target:b, bad:true,
        text:pick(t === 'rivalry' ? SOC_RIVALRY : t === 'taunt' ? SOC_TAUNT : SOC_PARANOIA)(a, b),
        badge:t === 'paranoia' ? 'SUSPICION' : 'FRICTION', badgeClass:t === 'taunt' ? 'red' : 'amber', icon:'skull', social:true });
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// PAIRING (bond-driven). Post-merge: whole cast, one forced awkward pair.
// Pre-merge: pairs WITHIN each tribe; odd member = solo (handicapped).
// ══════════════════════════════════════════════════════════════════════
function _pairGroup(group) {
  // Greedy highest-bond matching, then force the final leftover pair (often awkward).
  const pool = [...group];
  const pairs = [];
  // sort a stable-ish order by total drama so high-drama players anchor pairs
  pool.sort((a, b) =>
    group.reduce((s, p) => p === b ? s : s + Math.abs(getBond(b, p)), 0) -
    group.reduce((s, p) => p === a ? s : s + Math.abs(getBond(a, p)), 0));
  const used = new Set();
  for (const a of pool) {
    if (used.has(a)) continue;
    // best partner by bond (prefer allies/showmance; otherwise nearest)
    let best = null, bestScore = -Infinity;
    for (const b of pool) {
      if (b === a || used.has(b)) continue;
      const sc = getBond(a, b) + noise(1.5);
      if (sc > bestScore) { bestScore = sc; best = b; }
    }
    if (best) { used.add(a); used.add(best); pairs.push([a, best]); }
  }
  const solo = pool.find(p => !used.has(p)) || null;
  return { pairs, solo };
}

function _archPair(a, b) {
  const av = isVillain(a), bv = isVillain(b), an = isNice(a), bn = isNice(b);
  if ((av && bn) || (bv && an)) return 'villain_hero';
  const bond = getBond(a, b);
  const sh = (gs.showmances || []).find(s => s.phase !== 'broken-up' && s.players?.every(p => [a, b].includes(p)));
  if (sh) return 'showmance';
  if (bond <= -3) return 'rivals';
  if (bond >= 5) return 'allies';
  if (bond <= 1) return 'strangers';
  return 'default';
}

// choose diver (better physical/endurance) + guide (better mental/intuition/strategic)
function _assignRoles(a, b) {
  const sa = pStats(a), sb = pStats(b);
  const diveA = sa.physical + sa.endurance + noise(2);
  const diveB = sb.physical + sb.endurance + noise(2);
  const diver = diveA >= diveB ? a : b;
  const guide = diver === a ? b : a;
  return { diver, guide };
}

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateTreasureIsland(ep) {
  const active = [...gs.activePlayers].filter(p => p !== ep.exileDuelPlayer);
  const isMerged = gs.isMerged;
  const campKey = isMerged ? (gs.mergeName || 'merge') : null;
  const hostOpener = _pick(HOST_OPENERS, ep.num);
  const hostCloser = _pick(HOST_CLOSERS, ep.num + 1);

  // tribe lookup for pre-merge
  const tribeOf = (n) => gs.tribes?.find(t => t.members.includes(n))?.name || null;

  // ── build crews ──
  let crews = [];
  let soloNames = [];
  if (isMerged) {
    const { pairs, solo } = _pairGroup(active);
    pairs.forEach(p => crews.push(p));
    if (solo) { crews.push([solo]); soloNames.push(solo); }
  } else {
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (!members.length) continue;
      const { pairs, solo } = _pairGroup(members);
      pairs.forEach(p => crews.push(p));
      if (solo) { crews.push([solo]); soloNames.push(solo); }
    }
  }

  // crew state
  const C = crews.map((members, id) => {
    const solo = members.length === 1;
    const a = members[0], b = solo ? null : members[1];
    const { diver, guide } = solo ? { diver:a, guide:a } : _assignRoles(a, b);
    return {
      id, members, solo, diver, guide,
      tribe: isMerged ? null : tribeOf(a),
      bond: solo ? 0 : getBond(a, b),
      archPair: solo ? 'solo' : _archPair(a, b),
      paddleScore: 0, diveScore: 0, air: 100, finalAir: 100,
      status: 'paddling', won: false, rescued: false, drowned: false,
      gotChest: false, score: 0,
    };
  });
  const crewOf = {}; active.forEach(n => { crewOf[n] = C.find(c => c.members.includes(n)); });

  const phasePaddle = { key:'paddle', title:'CUT & PADDLE', events:[] };
  const phaseDive   = { key:'dive',   title:'THE DIVE',    events:[] };
  const phaseCrisis = { key:'crisis', title:'THE CRISIS',  events:[] };

  // duo designation label (human-readable pairing type)
  const DUO_LABEL = { showmance:'SHOWMANCE DUO', allies:'ALLIED DUO', rivals:'RIVAL DUO',
    villain_hero:'ODD COUPLE', strangers:'STRANGER DUO', default:'DUO', solo:'SOLO DIVER' };

  // ── PHASE 1: CUT & PADDLE (physical/endurance pair-avg + bond chemistry) ──
  for (const c of C) {
    const memNames = c.solo ? c.members[0] : `${c.members[0]} & ${c.members[1]}`;
    // DUO DESIGNATION — formally name the pair before they shove off
    phasePaddle.events.push({ type:'formation', crewId:c.id, players:c.members, solo:c.solo,
      duo:DUO_LABEL[c.solo ? 'solo' : c.archPair] || 'DUO', tribe:c.tribe,
      text:c.solo
        ? `${c.members[0]} draws the short straw — no partner. A solo diver from the first horn.`
        : _pick(PAIR_FLAVOR[c.archPair] || PAIR_FLAVOR.default, memNames + 'f'),
      badge:c.solo ? 'SOLO CREW' : 'DUO FORMED', badgeClass:c.archPair === 'rivals' ? 'amber' : 'cyan', icon:'anchor' });
    phasePaddle.events.push({ type:'cut', crewId:c.id, players:c.members, duo:DUO_LABEL[c.solo ? 'solo' : c.archPair], text:_pick(CUT_OK, memNames + ep.num)(memNames), icon:'paddle' });
    const sd = pStats(c.diver), sg = pStats(c.guide);
    const avgPE = c.solo ? (sd.physical + sd.endurance) : ((sd.physical + sd.endurance + sg.physical + sg.endurance) / 2);
    // bond chemistry: allies/showmance sync, rivals clash
    let chem = 0;
    if (c.archPair === 'showmance' || c.archPair === 'allies') chem = 2.2;
    else if (c.archPair === 'rivals') chem = -2.4;
    else chem = c.bond * 0.18;
    c.paddleScore = avgPE * 0.5 + chem + (c.solo ? -2.5 : 0) /* solo handicap */ + noise(2.5);
    if (!c.solo) {
      const duoTag = DUO_LABEL[c.archPair] || 'DUO';
      if (c.archPair === 'rivals' || (chem < -1 && Math.random() < 0.6)) {
        phasePaddle.events.push({ type:'paddleClash', crewId:c.id, players:c.members, bad:true, duo:duoTag,
          text:pick(PADDLE_CLASH)(c.members[0], c.members[1]), badge:'OUT OF SYNC', badgeClass:'amber', icon:'wave' });
        addBond(c.members[0], c.members[1], -0.5);
      } else if (chem > 1 || Math.random() < 0.5) {
        phasePaddle.events.push({ type:'paddleSync', crewId:c.id, players:c.members, duo:duoTag,
          text:pick(PADDLE_SYNC)(c.members[0], c.members[1]), badge:'IN SYNC', badgeClass:'green', icon:'wave' });
        addBond(c.members[0], c.members[1], 0.5);
      } else if (Math.random() < 0.3) {
        phasePaddle.events.push({ type:'nearTip', crewId:c.id, players:c.members, duo:duoTag,
          text:pick(PADDLE_NEARTIP)(c.members[0], c.members[1]), badge:'CLOSE CALL', badgeClass:'amber', icon:'wave' });
        addBond(c.members[0], c.members[1], 0.4);
      }
    }
  }
  // dive order = paddle ranking (first to checkpoint dives with priority)
  const diveOrder = [...C].sort((a, b) => b.paddleScore - a.paddleScore);
  diveOrder.forEach((c, i) => { c.divePriority = i; });
  phasePaddle.events.push({ type:'checkpoint',
    text:`${host2()} hands out the dive charts at the buoy. First crews in get first crack at the cave.`,
    badge:'CHECKPOINT', badgeClass:'gold', icon:'wheel' });

  _socialBeats(phasePaddle, active, clamp(Math.round(active.length / 4), 1, 3));

  // ── PHASE 2: THE DIVE (diver phys/end + guide mental/int/strat + air econ) ──
  for (const c of C) {
    c.status = 'diving';
    const sd = pStats(c.diver), sg = pStats(c.guide), pd = pronouns(c.diver), pg = pronouns(c.guide);
    phaseDive.events.push({ type:'roleSplit', crewId:c.id, players:c.members,
      text:c.solo ? `${c.diver} dives solo — no guide, no safety net. Brave or foolish.` : _pick(ROLE_SPLIT, c.diver + c.guide)(c.diver, c.guide),
      badge:'ROLES SET', badgeClass:'cyan', icon:'helmet' });
    phaseDive.events.push({ type:'descend', crewId:c.id, player:c.diver, text:_pick(DESCEND, c.diver + 'd')(c.diver, pd), icon:'helmet',
      airSnap:_airSnap(C), statusSnap:_statusSnap(C) });

    // guide quality (proportional): good guidance saves air
    const guideQ = c.solo ? (sd.intuition * 0.5 + noise(3)) : (sg.mental * 0.34 + sg.intuition * 0.33 + sg.strategic * 0.33 + noise(3));
    const goodGuide = guideQ > 4.5;
    if (goodGuide) {
      phaseDive.events.push({ type:'guide', crewId:c.id, players:c.members, text:_pick(GUIDE_OK, c.guide + 'g')(c.guide, c.diver, pg), badge:'CLEAN LINE', badgeClass:'green', icon:'spyglass' });
    } else {
      c.air -= 14;
      phaseDive.events.push({ type:'guide', crewId:c.id, players:c.members, bad:true, text:_pick(GUIDE_BAD, c.guide + 'gb')(c.guide, c.diver, pg), badge:'−14% AIR', badgeClass:'amber', icon:'spyglass',
        airSnap:_airSnap(C), statusSnap:_statusSnap(C) });
    }
    // air consumption: weaker endurance burns more
    c.air -= clamp(22 - sd.endurance * 1.4 + noise(4), 6, 30);
    // dive score: diver power + guide nav + priority edge
    c.diveScore = sd.physical * 0.5 + sd.endurance * 0.45 + guideQ * 0.7 + (C.length - c.divePriority) * 0.5 + (c.solo ? -3 : 0) + noise(3);
    c.air = clamp(c.air, 5, 100); c.finalAir = c.air;
  }

  // chest contest cascade among the top divers by diveScore
  const contenders = [...C].sort((a, b) => b.diveScore - a.diveScore).slice(0, Math.min(4, C.length));
  if (contenders.length >= 2) {
    const grabber = contenders[0];
    phaseDive.events.push({ type:'chestGrab', crewId:grabber.id, player:grabber.diver, text:_pick(CHEST_GRAB, grabber.diver)(grabber.diver, pronouns(grabber.diver)), badge:'ON THE CHEST', badgeClass:'gold', icon:'chest' });
    for (let i = 1; i < contenders.length; i++) {
      const a = contenders[i], t = contenders[i - 1];
      if (Math.random() < 0.7) {
        const block = isNice(a.diver) || Math.random() < 0.4;
        if (block) {
          addBond(a.diver, t.diver, -0.6); _pop(a.diver, 1);
          phaseDive.events.push({ type:'chestBlock', crewId:a.id, player:a.diver, target:t.diver, text:pick(CHEST_BLOCK)(a.diver, t.diver, pronouns(a.diver)), badge:'BOARDED', badgeClass:'red', icon:'skull' });
        } else {
          addBond(a.diver, t.diver, -1); _pop(a.diver, isVillain(a.diver) ? -1 : 0);
          phaseDive.events.push({ type:'chestSteal', crewId:a.id, player:a.diver, target:t.diver, text:pick(CHEST_STEAL)(a.diver, t.diver, pronouns(a.diver)), badge:'PLUNDER', badgeClass:'gold', icon:'coin' });
        }
        t.diveScore -= 0.8; // lost the chest grip = small score hit
        a.diveScore += 1.0;
      }
    }
  }

  _socialBeats(phaseDive, active, clamp(Math.round(active.length / 3), 2, 4));

  // romance hooks (tethered partners + danger)
  if (seasonConfig.romance !== 'disabled') {
    _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || (ep.chalMemberScores = {}), 'danger', null);
    const tried = new Set();
    for (const c of C) {
      if (c.solo || tried.size >= 2) continue;
      const [a, b] = c.members;
      if (romanticCompat(a, b) > 0 && getBond(a, b) >= 3 && !tried.has(a + b)) {
        tried.add(a + b);
        const sparked = _challengeRomanceSpark(a, b, ep, null, null, ep.chalMemberScores, 'the dive');
        if (sparked) {
          phaseDive.events.push({ type:'spark', crewId:c.id, player:a, target:b,
            text:`Tethered together at the checkpoint, ${a} steadies ${b}'s air line a beat too long — and neither lets go right away.`,
            badge:'SHOWMANCE', badgeClass:'pink', icon:'bottle', social:true });
        }
      }
    }
  }

  // ── PHASE 3: THE CRISIS (sacrifice dilemma) ──
  const diveRank = [...C].sort((a, b) => b.diveScore - a.diveScore);
  const leader = diveRank[0];
  // victim: a diver NOT in the leading crew — reckless (bold) + low air weighting
  const victimPool = diveRank.slice(1).filter(c => !c.drowned);
  let victimCrew = null;
  // The near-drowning is the signature beat, but not every dive ends in crisis —
  // ~70% of the time someone goes down hard; otherwise everyone surfaces clean.
  if (victimPool.length && Math.random() < 0.70) {
    victimCrew = victimPool
      .map(c => ({ c, w: pStats(c.diver).boldness * 0.5 + (100 - c.finalAir) * 0.06 - pStats(c.diver).endurance * 0.2 + noise(2.5) }))
      .sort((a, b) => b.w - a.w)[0].c;
  }
  const crisis = { victim:null, victimCrew:null, leader:leader?.members, leaderChoseRescue:false, rescuer:null, cprShowmance:false };

  if (victimCrew) {
    const victim = victimCrew.diver, vp = pronouns(victim);
    victimCrew.drowned = true; victimCrew.status = 'crisis'; victimCrew.finalAir = 4; victimCrew.air = 4;
    crisis.victim = victim; crisis.victimCrew = victimCrew.members;
    phaseCrisis.events.push({ type:'wedge', crewId:victimCrew.id, player:victim, bad:true, text:_pick(WEDGE, victim + 'w')(victim, vp), badge:'WEDGED', badgeClass:'red', icon:'skull',
      airSnap:_airSnap(C), statusSnap:_statusSnap(C) });
    phaseCrisis.events.push({ type:'airCritical', crewId:victimCrew.id, player:victim, bad:true, text:_pick(AIR_CRITICAL, victim + 'a')(victim, vp), badge:'AIR CRITICAL', badgeClass:'red', icon:'skull',
      airSnap:_airSnap(C), statusSnap:_statusSnap(C) });

    // the leader's choice
    const ld = leader.diver, lp = pronouns(ld);
    phaseCrisis.events.push({ type:'choice', crewId:leader.id, player:ld, text:_pick(CHOICE_FRAME, ld + 'c')(ld, victim), badge:'WIN or RESCUE', badgeClass:'gold', icon:'wheel' });
    // rescue inclination (proportional, archetype + loyalty + bond + boldness)
    let incl = 0.45;
    if (isNice(ld)) incl += 0.35; if (isVillain(ld)) incl -= 0.30;
    incl += (pStats(ld).loyalty - 5) * 0.05;
    incl += clamp(getBond(ld, victim), -5, 8) * 0.03;
    incl += (pStats(ld).boldness - 5) * 0.02;
    const leaderRescues = Math.random() < clamp(incl, 0.05, 0.95);

    if (leaderRescues) {
      crisis.leaderChoseRescue = true; crisis.rescuer = ld;
      addBond(ld, victim, 4); _pop(ld, 3);
      phaseCrisis.events.push({ type:'rescue', crewId:leader.id, player:ld, target:victim, text:_pick(RESCUE_DO, ld + victim)(ld, victim, vp), badge:'HERO +3 POP', badgeClass:'green', icon:'anchor',
        airSnap:_airSnap(C), statusSnap:_statusSnap(C) });
      leader.diveScore -= 100; // forfeits the chest
      leader.status = 'surfaced';
    } else {
      _pop(ld, -3);
      phaseCrisis.events.push({ type:'keepDiving', crewId:leader.id, player:ld, bad:true, text:_pick(KEEP_DIVING, ld + 'k')(ld, victim), badge:'COLD-BLOODED −3 POP', badgeClass:'red', icon:'coin' });
      // someone nice rescues instead
      const rescuers = active.filter(n => n !== victim && !victimCrew.members.includes(n) && (isNice(n) || pStats(n).loyalty >= 6 || getBond(n, victim) >= 4));
      const rescuer = rescuers.sort((x, y) => (pStats(y).loyalty + getBond(y, victim)) - (pStats(x).loyalty + getBond(x, victim)) + noise(1))[0] || active.find(n => n !== victim && !victimCrew.members.includes(n));
      if (rescuer) {
        crisis.rescuer = rescuer;
        addBond(rescuer, victim, 4); _pop(rescuer, 3);
        const rc = crewOf[rescuer]; if (rc && rc !== leader) { rc.diveScore -= 3; rc.status = 'surfaced'; }
        phaseCrisis.events.push({ type:'rescueOther', player:rescuer, target:victim, text:_pick(RESCUE_OTHER, rescuer + victim)(rescuer, victim, vp), badge:'RESCUE!', badgeClass:'green', icon:'anchor',
          airSnap:_airSnap(C), statusSnap:_statusSnap(C) });
      }
    }
    victimCrew.rescued = true; victimCrew.status = 'rescued';

    // CPR + wake (+ possible showmance)
    const rescuer = crisis.rescuer;
    if (rescuer) {
      phaseCrisis.events.push({ type:'cpr', player:rescuer, target:victim, text:_pick(CPR, rescuer + victim)(rescuer, victim, vp), badge:'REVIVED', badgeClass:'green', icon:'anchor' });
      phaseCrisis.events.push({ type:'cprWake', player:victim, target:rescuer, text:_pick(CPR_WAKE, victim + rescuer)(victim, rescuer), badge:'ALIVE', badgeClass:'cyan', icon:'bottle' });
      if (seasonConfig.romance !== 'disabled' && romanticCompat(rescuer, victim) > 0) {
        const sparked = _challengeRomanceSpark(rescuer, victim, ep, null, null, ep.chalMemberScores, 'the rescue');
        if (sparked) {
          crisis.cprShowmance = true;
          phaseCrisis.events.push({ type:'spark', player:rescuer, target:victim,
            text:`${rescuer} pulled ${victim} back from the edge — and on that deck, soaked and shaking, something neither of them expected catches fire.`,
            badge:'SHOWMANCE', badgeClass:'pink', icon:'bottle', social:true });
        }
      }
    }
  } else {
    phaseCrisis.events.push({ type:'noCrisis', text:`Every diver surfaces clean — no near-drownings today. ${host()} looks almost disappointed.`, badge:'ALL CLEAR', badgeClass:'green', icon:'wave' });
  }

  // ── SCORING ──
  // base: dive performance + paddle edge + small survival
  for (const c of C) {
    const base = c.diveScore * 2.4 + c.paddleScore * 0.6 + 5;
    c.score = base;
    c.members.forEach(() => {});
  }
  // winner crew = highest score that isn't forfeited/drowned (post-merge chest holder)
  const standings = [...C].sort((a, b) => b.score - a.score);
  const winnerCrew = standings.find(c => !c.drowned && c.score > -50) || standings[0];
  winnerCrew.won = true; winnerCrew.gotChest = true; winnerCrew.status = 'won';
  phaseCrisis.events.push({ type:'chestWin', crewId:winnerCrew.id, players:winnerCrew.members,
    text:winnerCrew.solo ? `${winnerCrew.members[0]} surfaces alone with the chest held high. A solo haul — immunity earned the hard way.` : _pick(CHEST_WIN, winnerCrew.members[0])(winnerCrew.members[0], winnerCrew.members[1]),
    badge:'CHEST CLAIMED', badgeClass:'gold', icon:'chest' });

  // member scores for chal record (proportional, both members share crew score)
  const chalMemberScores = {};
  C.forEach(c => c.members.forEach(n => { chalMemberScores[n] = c.score; }));

  // ── WIN CONDITIONS ──
  let immune = [], immunityWinner = null, tribeScores = null, gifted = null;

  if (isMerged) {
    immune = [...winnerCrew.members];
    immunityWinner = immune[0];
    // inflate winner crew scores to guarantee top ranks
    const maxOther = Math.max(...C.filter(c => c !== winnerCrew).map(c => c.score), 0);
    winnerCrew.members.forEach(n => { chalMemberScores[n] = maxOther + active.length + 6; });
    ep.immunityWinner = immunityWinner;
    ep.extraImmune = ep.extraImmune || [];
    immune.forEach(n => { if (!ep.extraImmune.includes(n)) ep.extraImmune.push(n); });
    ep.tribalPlayers = [...active];
    winnerCrew.members.forEach(n => _pop(n, 2));

    // GIFTABLE IMMUNITY — dominant, tightly-bonded crew can pass extra immunity to a close ally
    if (!winnerCrew.solo && (winnerCrew.archPair === 'showmance' || winnerCrew.bond >= 7)) {
      const [a, b] = winnerCrew.members;
      const allyPool = active.filter(n => !immune.includes(n))
        .map(n => ({ n, b: getBond(a, n) + getBond(b, n) }))
        .filter(x => x.b >= 8).sort((x, y) => y.b - x.b);
      if (allyPool.length && Math.random() < 0.6) {
        gifted = allyPool[0].n;
        if (!ep.extraImmune.includes(gifted)) ep.extraImmune.push(gifted);
        _pop(a, 1); _pop(b, 1);
        phaseCrisis.events.push({ type:'gift', players:[...winnerCrew.members, gifted],
          text:`${a} and ${b} are both safe — so they pass the spare immunity to ${gifted}. A gift like that buys a lot of loyalty.`,
          badge:'IMMUNITY GIFTED', badgeClass:'gold', icon:'coin' });
      }
    }
    ep.challengeType = 'treasure-island';
  } else {
    // pre-merge: tribe immunity by AVG crew score per member (fair across sizes)
    tribeScores = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (!members.length) continue;
      tribeScores[tribe.name] = members.reduce((s, m) => s + chalMemberScores[m], 0) / members.length;
    }
    const sorted = Object.entries(tribeScores).sort(([, a], [, b]) => b - a);
    if (sorted.length) {
      const winnerTribe = gs.tribes.find(t => t.name === sorted[0][0]);
      const loserTribe = gs.tribes.find(t => t.name === sorted[sorted.length - 1][0]);
      ep.winner = winnerTribe; ep.loser = loserTribe;
      ep.safeTribes = gs.tribes.filter(t => t !== loserTribe && t !== winnerTribe);
      ep.challengePlacements = sorted.map(([name]) => {
        const t = gs.tribes.find(tr => tr.name === name);
        return { name, members:[...(t?.members || [])] };
      });
      ep.tribalPlayers = [...(loserTribe?.members || [])];
    }
    ep.challengeType = 'treasure-island';
  }

  ep.chalMemberScores = chalMemberScores;
  ep.chalPlacements = standings.flatMap(c => c.members);
  updateChalRecord(ep);

  // keepsakes for winners (flavor, persists narratively)
  const keepsakes = winnerCrew.members.map(n => ({ name:n, item:keepsake(n) }));

  ep.challengeLabel = 'The Treasure Island of Dr. McLean';
  ep.challengeCategory = 'challenge';
  ep.isTreasureIsland = true;
  ep.treasureData = {
    isMerged, hostOpener, hostCloser,
    phases:[phasePaddle, phaseDive, phaseCrisis],
    crews:C.map(c => ({ id:c.id, members:c.members, solo:c.solo, diver:c.diver, guide:c.guide, tribe:c.tribe,
      bond:c.bond, archPair:c.archPair, status:c.status, won:c.won, rescued:c.rescued, drowned:c.drowned,
      finalAir:Math.round(c.finalAir), score:c.score, divePriority:c.divePriority })),
    diveOrder:diveOrder.map(c => c.id),
    standings:standings.map(c => ({ id:c.id, members:c.members, score:c.score, status:c.status, finalAir:Math.round(c.finalAir), solo:c.solo, won:c.won })),
    winnerCrew:{ id:winnerCrew.id, members:winnerCrew.members, solo:winnerCrew.solo },
    immune, immunityWinner, gifted, tribeScores, crisis, keepsakes,
    scores:chalMemberScores,
  };
  return ep.treasureData;
}

// air/status snapshots for the live sidebar
function _airSnap(C) { const o = {}; C.forEach(c => { o[c.id] = Math.round(clamp(c.air, 0, 100)); }); return o; }
function _statusSnap(C) { const o = {}; C.forEach(c => { o[c.id] = c.status; }); return o; }

// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG — complete retranscription of the VP narration
// ══════════════════════════════════════════════════════════════════════
export function _textTreasureIsland(ep, ln, sec) {
  const td = ep.treasureData;
  if (!td) return;
  sec('THE TREASURE ISLAND OF DR. McLEAN');
  ln('Paired underwater treasure dive — one crew surfaces with the chest.');
  ln(`${host()}: "${td.hostOpener}"`);
  ln('');
  ln('CREWS:');
  td.crews.forEach(c => {
    ln(c.solo ? `  ${c.members[0]} (SOLO diver)` : `  ${c.members[0]} & ${c.members[1]} — diver ${c.diver}, guide ${c.guide}${c.tribe ? ' ['+c.tribe+']' : ''}`);
  });
  ln('');
  for (const phase of td.phases) {
    ln(`═══ ${phase.title} ═══`);
    ln('');
    for (const ev of phase.events) {
      const tag = ev.badge ? `[${ev.badge}] ` : '';
      ln(`${tag}${ev.text}`);
    }
    ln('');
  }
  ln('═══ FINAL STANDINGS ═══');
  td.standings.forEach((c, i) => {
    const who = c.solo ? c.members[0] : `${c.members[0]} & ${c.members[1]}`;
    ln(`${i + 1}. ${who} — score ${c.score.toFixed(1)}, air ${c.finalAir}%${c.won ? ' — CHEST/IMMUNITY' : ''}`);
  });
  ln('');
  if (td.crisis?.victim) {
    ln(`CRISIS: ${td.crisis.victim} was wedged and out of air. ${td.crisis.leaderChoseRescue ? `${td.crisis.rescuer} abandoned the win to rescue ${td.crisis.victim}.` : `The leader kept diving; ${td.crisis.rescuer || 'a teammate'} performed the rescue.`}`);
    if (td.crisis.cprShowmance) ln(`A showmance sparked on the deck after the CPR.`);
  }
  if (td.isMerged && td.immune?.length) {
    ln(`IMMUNITY: ${td.immune.join(' & ')}${td.gifted ? ` (extra immunity gifted to ${td.gifted})` : ''}`);
    if (td.keepsakes?.length) ln(`Keepsakes kept: ${td.keepsakes.map(k => `${k.name} — ${k.item}`).join(', ')}`);
  } else if (td.tribeScores) {
    ln('TRIBE SCORES (avg per member):');
    Object.entries(td.tribeScores).sort(([, a], [, b]) => b - a).forEach(([name, s]) => ln(`  ${name}: ${s.toFixed(1)}`));
  }
  ln('');
  ln(`${host()}: "${td.hostCloser}"`);
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREENS — pirate dive theme (self-contained)
// ══════════════════════════════════════════════════════════════════════
function _portrait(name, size = 40) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid #5b3a20;background:#0a1018;object-fit:cover;" onerror="this.style.visibility='hidden'">`;
}

function _svgDefs() {
  return `<svg width="0" height="0" style="position:absolute"><defs>
  <symbol id="ti-chest" viewBox="0 0 24 24"><path d="M3 9a3 3 0 013-3h12a3 3 0 013 3v2H3z" fill="#7a5224"/><path d="M3 11h18v8a1 1 0 01-1 1H4a1 1 0 01-1-1z" fill="#5b3a20"/><rect x="2" y="9" width="20" height="2.4" fill="#e7b53c"/><rect x="10.6" y="11" width="2.8" height="9" fill="#e7b53c"/><circle cx="12" cy="15" r="1.3" fill="#3a2611"/></symbol>
  <symbol id="ti-skull" viewBox="0 0 24 24"><path d="M12 3c-5 0-8 3.4-8 7.6 0 2.6 1.3 4.3 2.8 5.2V19a1 1 0 001 1h1.2v-2h1.4v2h2.8v-2h1.4v2H17a1 1 0 001-1v-3.2c1.5-.9 2.8-2.6 2.8-5.2C20 6.4 17 3 12 3z" fill="#f2e6c8"/><circle cx="8.6" cy="11" r="1.9" fill="#3a2611"/><circle cx="15.4" cy="11" r="1.9" fill="#3a2611"/><path d="M12 13.5l-1 2.2h2z" fill="#3a2611"/></symbol>
  <symbol id="ti-anchor" viewBox="0 0 24 24"><circle cx="12" cy="4" r="2.2" fill="none" stroke="#caa468" stroke-width="1.8"/><path d="M12 6v13" stroke="#caa468" stroke-width="1.8"/><path d="M7 11h10" stroke="#caa468" stroke-width="1.8"/><path d="M4 14a8 8 0 008 5 8 8 0 008-5" fill="none" stroke="#caa468" stroke-width="1.8"/></symbol>
  <symbol id="ti-helmet" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#3a6a4f" stroke="#caa468" stroke-width="1.4"/><circle cx="12" cy="12" r="4.4" fill="#0a2c3c"/><circle cx="10.4" cy="10.4" r="1.4" fill="#9fe6d6" opacity=".7"/><path d="M12 4v-2M4 12h-2M20 12h2" stroke="#caa468" stroke-width="1.4"/></symbol>
  <symbol id="ti-spyglass" viewBox="0 0 24 24"><rect x="3" y="13" width="9" height="4" rx="2" transform="rotate(-30 7.5 15)" fill="#5b3a20" stroke="#caa468" stroke-width="1.2"/><rect x="12" y="7" width="9" height="5" rx="2.5" transform="rotate(-30 16.5 9.5)" fill="#7a5224" stroke="#e7b53c" stroke-width="1.2"/></symbol>
  <symbol id="ti-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#e7b53c" stroke="#a07818" stroke-width="1.6"/><path d="M12 7v10M9 9h4.5a1.8 1.8 0 010 3.6H9.5m0 0H14" stroke="#7a5a10" stroke-width="1.4" fill="none"/></symbol>
  <symbol id="ti-wheel" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="none" stroke="#caa468" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="#5b3a20"/><g stroke="#caa468" stroke-width="1.6"><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19"/></g></symbol>
  <symbol id="ti-bottle" viewBox="0 0 24 24"><path d="M10 3h4v3l1.5 2v11a2 2 0 01-2 2h-3a2 2 0 01-2-2V8L10 6z" fill="#3a6a4f" stroke="#caa468" stroke-width="1.2"/><rect x="9.5" y="2" width="5" height="2" rx="1" fill="#7a5224"/></symbol>
  <symbol id="ti-paddle" viewBox="0 0 24 24"><rect x="11" y="3" width="2" height="13" fill="#7a5224"/><ellipse cx="12" cy="18" rx="3.4" ry="4" fill="#5b3a20" stroke="#caa468" stroke-width="1"/></symbol>
  <symbol id="ti-wave" viewBox="0 0 24 24"><path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" fill="none" stroke="#56d8ff" stroke-width="1.6"/></symbol>
  <symbol id="ti-bell" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0112 0v7H6z" fill="#7a5224" stroke="#caa468" stroke-width="1.2"/><rect x="5" y="15" width="14" height="2.4" rx="1" fill="#5b3a20"/><circle cx="12" cy="9" r="2" fill="#9fe6d6" opacity=".6"/></symbol>
  </defs></svg>`;
}

function _icon(type, size = 24) {
  const id = { chest:'ti-chest', skull:'ti-skull', anchor:'ti-anchor', helmet:'ti-helmet', spyglass:'ti-spyglass',
    coin:'ti-coin', wheel:'ti-wheel', bottle:'ti-bottle', paddle:'ti-paddle', wave:'ti-wave', bell:'ti-bell' }[type] || 'ti-wave';
  return `<svg width="${size}" height="${size}" style="vertical-align:middle"><use href="#${id}"/></svg>`;
}

function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Pirata+One&family=IM+Fell+English:ital@0;1&family=Share+Tech+Mono&display=swap');
  .ti-shell{--abyss:#04111a;--sea:#0a2c3c;--sea2:#0e3a4f;--parch:#e7d3a1;--parch-d:#cdb47a;--ink:#3a2611;--wood:#5b3a20;--wood-d:#3a2412;
    --gold:#e7b53c;--gold-l:#ffd877;--teal:#2bd0b0;--cyan:#56d8ff;--blood:#d63a3a;--bone:#f2e6c8;
    font-family:'IM Fell English',serif;color:var(--bone);max-width:1100px;margin:0 auto;position:relative;min-height:420px;overflow:hidden;
    background:radial-gradient(800px 420px at 50% -6%,rgba(86,216,255,.10),transparent 60%),linear-gradient(180deg,#06202c,#05131c 50%,#02080d);
    border:3px solid var(--wood);box-shadow:inset 0 0 70px rgba(0,0,0,.7);}
  .ti-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;
    background-image:radial-gradient(2px 2px at 18% 92%,rgba(180,235,255,.5),transparent),radial-gradient(1.5px 1.5px at 62% 94%,rgba(180,235,255,.45),transparent),radial-gradient(1.5px 1.5px at 84% 90%,rgba(180,235,255,.4),transparent);
    animation:ti-bub 9s linear infinite;}
  @keyframes ti-bub{from{transform:translateY(0);opacity:.7}to{transform:translateY(-90vh);opacity:0}}
  .ti-inner{position:relative;z-index:3;padding:0 0 14px;}
  /* HUD */
  .ti-hud{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 14px;
    background:repeating-linear-gradient(90deg,rgba(0,0,0,.12) 0 2px,transparent 2px 26px),linear-gradient(180deg,#6b4426,#4a2d16);
    border-bottom:3px solid var(--gold);box-shadow:0 6px 16px rgba(0,0,0,.5);}
  .ti-hud .title{font-family:'Pirata One';font-size:22px;letter-spacing:1px;color:var(--gold-l);text-shadow:0 0 12px rgba(231,181,60,.4);line-height:.9;}
  .ti-hud .title small{display:block;font-family:'Share Tech Mono';font-size:8px;letter-spacing:2px;color:var(--parch-d);}
  .ti-readout{margin-left:auto;display:flex;gap:10px;}
  .ti-gauge{display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,.28);border:1px solid rgba(231,181,60,.3);border-radius:5px;padding:3px 8px;}
  .ti-gauge b{font-family:'Share Tech Mono';font-size:14px;color:var(--gold-l);}
  .ti-gauge span{font-size:8px;letter-spacing:1px;color:var(--parch-d);}
  /* phases */
  .ti-phases{display:flex;gap:5px;padding:9px 14px 3px;}
  .ti-pchip{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:6px 3px;border-radius:5px;font-family:'Share Tech Mono';font-size:9px;letter-spacing:1px;border:1px solid var(--sea2);color:var(--parch-d);background:rgba(10,44,60,.5);}
  .ti-pchip.active{border-color:var(--gold);color:var(--gold-l);background:rgba(231,181,60,.1);box-shadow:0 0 12px rgba(231,181,60,.25);}
  .ti-pchip.crisis.active{border-color:var(--blood);color:#ff8a8a;background:rgba(214,58,58,.12);box-shadow:0 0 14px rgba(214,58,58,.4);}
  /* body — sonar map runs full width on top, then log + manifest sidebar side-by-side */
  .ti-body{display:block;padding:12px 14px;}
  .ti-cols{display:grid;grid-template-columns:minmax(0,1fr) 272px;gap:14px;align-items:start;}
  .ti-logcol{min-width:0;}
  @media(max-width:720px){.ti-cols{grid-template-columns:1fr;}}
  /* scope */
  .ti-scope{position:relative;aspect-ratio:1/.58;border-radius:9px;overflow:hidden;margin-bottom:12px;border:3px solid var(--wood);
    background:radial-gradient(circle at 50% 60%,rgba(43,208,176,.10),transparent 58%),repeating-radial-gradient(circle at 50% 60%,rgba(43,208,176,.10) 0 1px,transparent 1px 38px),linear-gradient(180deg,#073040,#041820);box-shadow:inset 0 0 50px rgba(0,0,0,.75);}
  .ti-scope .cross{position:absolute;inset:0;background:linear-gradient(90deg,transparent 49.7%,rgba(43,208,176,.16) 50%,transparent 50.3%),linear-gradient(0deg,transparent 49.7%,rgba(43,208,176,.13) 50%,transparent 50.3%);}
  .ti-scope .sweep{position:absolute;left:50%;top:60%;width:50%;height:50%;transform-origin:0 0;background:conic-gradient(from 0deg,rgba(43,208,176,.38),transparent 30%);animation:ti-swp 4.5s linear infinite;mix-blend-mode:screen;}
  @keyframes ti-swp{to{transform:rotate(360deg)}}
  .ti-scope .stag{position:absolute;font-family:'Share Tech Mono';font-size:9px;letter-spacing:1px;}
  .ti-chestping{position:absolute;left:50%;bottom:8%;transform:translateX(-50%);width:34px;height:34px;border:2px solid var(--gold);border-radius:50%;animation:ti-ping 2s ease-out infinite;}
  @keyframes ti-ping{0%{transform:translateX(-50%) scale(.4);opacity:.9}100%{transform:translateX(-50%) scale(1.7);opacity:0}}
  .ti-diver{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px;transition:all .6s ease;}
  .ti-diver .ic{filter:drop-shadow(0 0 5px var(--cyan));}
  .ti-diver.crisis .ic{filter:drop-shadow(0 0 7px var(--blood));animation:ti-blink .6s steps(2) infinite;}
  .ti-diver .nm{font-family:'Share Tech Mono';font-size:8px;background:rgba(2,12,16,.85);padding:1px 4px;border-radius:3px;border:1px solid rgba(43,208,176,.3);}
  @keyframes ti-blink{50%{opacity:.3}}
  /* log */
  .ti-loghead{font-family:'Pirata One';font-size:20px;letter-spacing:1px;color:var(--gold-l);margin:2px 0 9px;display:flex;align-items:center;gap:8px;}
  .ti-card{position:relative;border:1px solid var(--sea2);border-left:4px solid var(--teal);border-radius:6px;padding:10px 12px;margin-bottom:8px;animation:ti-rise .5s ease both;background:linear-gradient(180deg,rgba(9,40,55,.78),rgba(4,20,28,.72));}
  @keyframes ti-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .ti-card .cic{position:absolute;left:10px;top:11px;}
  .ti-card .who{display:flex;align-items:center;gap:8px;font-family:'Pirata One';font-size:15px;letter-spacing:.4px;color:var(--bone);flex-wrap:wrap;}
  .ti-card .who .whotx{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .ti-card .who em{color:var(--gold-l);font-style:normal;}
  .ti-evport{display:inline-flex;}
  .ti-evport img{margin-right:-9px;box-shadow:0 0 0 2px #04111a;position:relative;}
  .ti-evport img:last-child{margin-right:0;}
  .ti-duo{display:inline-flex;align-items:center;gap:3px;font-family:'Share Tech Mono';font-size:8px;letter-spacing:1px;color:var(--cyan);border:1px solid rgba(86,216,255,.4);background:rgba(86,216,255,.07);padding:2px 6px;border-radius:10px;}
  .ti-card.formation{border-left-color:var(--cyan);background:linear-gradient(180deg,rgba(9,40,55,.82),rgba(4,24,34,.72));}
  .ti-card.formation .who{font-size:16px;}
  .ti-card .bd{font-size:13.5px;line-height:1.5;color:#cfe2e0;margin-top:2px;}
  .ti-badge{position:absolute;top:9px;right:10px;font-family:'Share Tech Mono';font-size:8px;letter-spacing:1px;padding:2px 6px;border-radius:3px;border:1px solid;}
  .ti-badge.green{color:var(--teal);border-color:rgba(43,208,176,.5);background:rgba(43,208,176,.08);}
  .ti-badge.gold{color:var(--gold-l);border-color:rgba(231,181,60,.5);background:rgba(231,181,60,.08);}
  .ti-badge.red{color:#ff8a8a;border-color:rgba(214,58,58,.5);background:rgba(214,58,58,.1);}
  .ti-badge.cyan{color:var(--cyan);border-color:rgba(86,216,255,.5);background:rgba(86,216,255,.08);}
  .ti-badge.amber{color:var(--gold-l);border-color:rgba(231,181,60,.4);background:rgba(231,181,60,.06);}
  .ti-badge.pink{color:#ff9ecb;border-color:rgba(255,158,203,.5);background:rgba(255,158,203,.08);}
  .ti-card.steal{border-left-color:var(--gold);background:linear-gradient(180deg,rgba(44,32,8,.72),rgba(18,12,4,.66));}
  .ti-card.social{border-style:dashed;border-left-color:var(--cyan);}
  .ti-card.romance{border-left-color:#ff9ecb;background:linear-gradient(180deg,rgba(48,16,34,.6),rgba(20,8,16,.6));}
  .ti-card.crisis{border:1px solid var(--blood);border-left:4px solid var(--blood);background:linear-gradient(180deg,rgba(54,10,18,.85),rgba(22,4,8,.8));box-shadow:0 0 20px rgba(214,58,58,.25);animation:ti-rise .5s ease both,ti-pr 1.4s ease-in-out infinite;}
  @keyframes ti-pr{50%{box-shadow:0 0 34px rgba(214,58,58,.5)}}
  .ti-card.crisis .who{color:#ff8a8a;}
  .ti-card.cpr{border-left-color:var(--teal);background:linear-gradient(180deg,rgba(8,44,34,.8),rgba(4,20,16,.7));}
  .ti-card.cpr .who{color:var(--teal);}
  .ti-card.event{justify-content:center;text-align:center;border-left:none;border:1px dashed var(--gold);padding-left:12px;background:rgba(20,14,7,.6);}
  .ti-crisisbanner{text-align:center;font-family:'Pirata One';letter-spacing:4px;font-size:22px;color:#ff8a8a;border:2px dashed var(--blood);border-radius:6px;padding:7px;margin:5px 0 11px;background:rgba(214,58,58,.08);animation:ti-pr 1.4s infinite;}
  .ti-chatter{font-size:11px;color:var(--teal);text-align:center;margin:5px 0 8px;font-style:italic;opacity:.85;}
  /* manifest — a true sticky sidebar beside the log; cards keep the rest of the width.
     Pre-merge each tribe gets its own banner band of crew rows. */
  .ti-side{position:sticky;top:6px;align-self:start;max-height:calc(100vh - 24px);overflow:auto;border:3px solid var(--wood);border-radius:8px;color:var(--ink);
    background:repeating-linear-gradient(0deg,rgba(0,0,0,.03) 0 14px,transparent 14px 28px),linear-gradient(180deg,#e7d3a1,#d3ba83);box-shadow:0 0 18px rgba(0,0,0,.5),inset 0 0 36px rgba(90,58,32,.3);}
  .ti-side h3{position:sticky;top:0;z-index:2;font-family:'Pirata One';letter-spacing:2px;font-size:16px;padding:8px 11px;display:flex;align-items:center;gap:7px;color:var(--bone);background:linear-gradient(90deg,var(--wood),#6b4426);border-bottom:2px solid var(--gold);}
  .ti-side .upd{position:sticky;top:35px;z-index:1;font-family:'Share Tech Mono';font-size:8px;color:var(--wood-d);text-align:center;padding:3px;letter-spacing:1px;background:#ddc187;}
  .ti-rows{padding:7px;}
  .ti-tribehd{font-family:'Pirata One';font-size:13px;letter-spacing:1px;color:var(--wood-d);margin:4px 0 5px;padding:3px 8px;border-left:3px solid var(--gold);background:rgba(90,58,32,.14);display:flex;align-items:center;gap:5px;}
  .ti-prow{padding:7px;border-radius:5px;margin-bottom:6px;background:rgba(255,250,235,.4);border:1px solid var(--parch-d);}
  .ti-prow .ptop{display:flex;align-items:center;gap:6px;}
  .ti-prow .pfaces{display:flex;}
  .ti-prow .pfaces img{margin-right:-8px;box-shadow:0 0 0 2px #e7d3a1;}
  .ti-prow .pfaces img:last-child{margin-right:0;}
  .ti-prow .pnm{font-size:12.5px;font-weight:bold;line-height:1.1;flex:1;color:var(--ink);}
  .ti-prow .role{font-family:'Share Tech Mono';font-size:7.5px;color:var(--wood);letter-spacing:.4px;font-weight:normal;display:flex;align-items:center;gap:3px;margin-top:2px;}
  .ti-prow .role img{vertical-align:middle;}
  .ti-st{font-family:'Share Tech Mono';font-size:8px;letter-spacing:.4px;padding:2px 5px;border-radius:3px;display:flex;align-items:center;gap:3px;white-space:nowrap;}
  .ti-st.dive{color:#0a4a5a;background:rgba(86,216,255,.25);border:1px solid #2a90a8;}
  .ti-st.surf{color:var(--wood-d);background:rgba(90,58,32,.12);border:1px solid var(--parch-d);}
  .ti-st.won{color:#5a3a08;background:var(--gold);border:1px solid #8a6420;font-weight:bold;}
  .ti-st.crisis{color:#fff;background:var(--blood);border:1px solid #8d2424;animation:ti-blink .7s steps(2) infinite;}
  .ti-st.paddle{color:#0a4a5a;background:rgba(43,208,176,.2);border:1px solid #2a8a78;}
  .ti-air{margin-top:5px;display:flex;align-items:center;gap:5px;}
  .ti-air .bar{flex:1;height:8px;border-radius:5px;background:rgba(90,58,32,.25);overflow:hidden;border:1px solid var(--wood-d);}
  .ti-air .bar i{display:block;height:100%;background:linear-gradient(90deg,var(--teal),var(--cyan));border-radius:5px;transition:width .5s;}
  .ti-air.low .bar i{background:linear-gradient(90deg,var(--blood),var(--gold));}
  .ti-air b{font-family:'Share Tech Mono';font-size:8px;min-width:26px;text-align:right;color:var(--wood-d);}
  /* controls */
  /* sticky (NOT fixed): .rp-page keeps a persisted transform from its entry animation,
     which would trap position:fixed inside the page. Sticky pins to the scroll viewport. */
  .ti-controls{position:sticky;bottom:0;width:100%;max-width:1100px;margin:0 auto;z-index:50;display:flex;align-items:center;gap:9px;padding:9px 14px;background:linear-gradient(0deg,#3a2412,#5b3a20);border-top:3px solid var(--gold);box-shadow:0 -6px 22px rgba(0,0,0,.6);}
  .ti-controls button{font-family:'Pirata One';font-size:15px;letter-spacing:2px;cursor:pointer;padding:6px 18px;border-radius:5px;border:1px solid var(--gold);background:rgba(231,181,60,.12);color:var(--gold-l);}
  .ti-controls .ctr{margin-left:auto;font-family:'Share Tech Mono';font-size:10px;letter-spacing:2px;color:var(--parch);}
  @media(prefers-reduced-motion:reduce){.ti-shell::before,.ti-scope .sweep,.ti-card.crisis,.ti-crisisbanner,.ti-chestping,.ti-diver.crisis .ic,.ti-st.crisis{animation:none!important;}}
  </style>`;
}

function _hud(ep, phaseIdx) {
  const td = ep.treasureData;
  const depth = [12, 38, 41, 0][phaseIdx] || 0;
  const phases = ['CUT & PADDLE', 'THE DIVE', 'THE CRISIS', 'THE HAUL'];
  const chips = phases.map((p, i) => {
    const icons = ['paddle', 'helmet', 'skull', 'chest'];
    const cls = (i === phaseIdx ? 'active' : '') + (i === 2 ? ' crisis' : '');
    return `<div class="ti-pchip ${cls}">${_icon(icons[i], 14)}${'①②③④'[i]} ${p}</div>`;
  }).join('');
  return `<div class="ti-hud">
    ${_icon('wheel', 30)}
    <div class="title">THE TREASURE ISLAND OF DR. McLEAN<small>PIRATE DIVE · ${td.isMerged ? 'POST-MERGE' : 'PRE-MERGE'}</small></div>
    <div class="ti-readout">
      <div class="ti-gauge"><b>−${depth}m</b><span>DEPTH</span></div>
      <div class="ti-gauge"><b>${td.crews.length}</b><span>CREWS</span></div>
    </div></div>
    <div class="ti-phases">${chips}</div>`;
}

// single crew row — player portraits for the duo + live status/air
function _crewRow(c, air, statusMap, phaseIdx) {
  const a = air ? air[c.id] : (phaseIdx === 0 ? 100 : c.finalAir);
  const stRaw = statusMap ? statusMap[c.id] : (phaseIdx === 0 ? 'paddling' : c.status);
  const stMap = { paddling:['paddle', 'paddle', 'PADDLING'], diving:['dive', 'wave', 'DIVING'], surfaced:['surf', 'anchor', 'SURFACED'],
    crisis:['crisis', 'skull', 'CRISIS'], rescued:['crisis', 'skull', 'RESCUED'], won:['won', 'coin', 'CHEST'] };
  const [stCls, stIcon, stTxt] = stMap[stRaw] || ['surf', 'anchor', 'STANDBY'];
  const faces = c.members.map(m => _portrait(m, 26)).join('');
  const lowAir = a <= 25;
  const roleLine = c.solo
    ? `${_portrait(c.diver, 14)} ${c.diver} · SOLO`
    : `${_portrait(c.diver, 14)} ${c.diver} <span style="opacity:.6">dives</span> · ${_portrait(c.guide, 14)} ${c.guide} <span style="opacity:.6">guides</span>`;
  return `<div class="ti-prow">
      <div class="ptop">
        <div class="pfaces">${faces}</div>
        <div class="pnm">${c.solo ? c.members[0] : c.members[0] + ' & ' + c.members[1]}
          <div class="role">${roleLine}</div>
        </div>
        <div class="ti-st ${stCls}">${_icon(stIcon, 11)}${stTxt}</div>
      </div>
      <div class="ti-air ${lowAir ? 'low' : ''}">${_icon('bell', 13)}<div class="bar"><i style="width:${clamp(a, 0, 100)}%"></i></div><b>${Math.round(a)}%</b></div>
    </div>`;
}

// crew sidebar — live, gated by reveal idx via airSnap on the latest revealed event
function _buildCrewSidebar(ep, phaseIdx, revealedIdx) {
  const td = ep.treasureData;
  const phase = td.phases[phaseIdx];
  // find the latest revealed event carrying snapshots
  let air = null, statusMap = null;
  for (let i = Math.min(revealedIdx, phase.events.length - 1); i >= 0; i--) {
    if (phase.events[i].airSnap) { air = phase.events[i].airSnap; statusMap = phase.events[i].statusSnap; break; }
  }
  const phaseName = ['PADDLE', 'THE DIVE', 'THE CRISIS', 'THE HAUL'][phaseIdx];
  let rows = '';
  if (!td.isMerged) {
    // PRE-MERGE: group crews under their tribe banner
    const tribes = [];
    td.crews.forEach(c => { const t = c.tribe || 'CREWS'; if (!tribes.includes(t)) tribes.push(t); });
    tribes.forEach(t => {
      const crewsHere = td.crews.filter(c => (c.tribe || 'CREWS') === t);
      rows += `<div class="ti-tribehd">${_icon('anchor', 12)}${t}</div>`;
      crewsHere.forEach(c => { rows += _crewRow(c, air, statusMap, phaseIdx); });
    });
  } else {
    td.crews.forEach(c => { rows += _crewRow(c, air, statusMap, phaseIdx); });
  }
  return `<div class="ti-side" id="ti-side-${ep.num}">
    <h3>${_icon('bottle', 18)}CREW MANIFEST</h3>
    <div class="upd">↻ UPDATES EACH REVEAL · ${phaseName}</div>
    <div class="ti-rows" id="ti-side-inner-${ep.num}">${rows}</div></div>`;
}

// portrait strip for an event's involved players
function _evPortraits(ev) {
  let names = [];
  if (ev.players && ev.players.length === 2 && !ev.target) names = ev.players;
  else if (ev.player && ev.target) names = [ev.player, ev.target];
  else if (ev.player) names = [ev.player];
  else if (ev.players && ev.players.length) names = ev.players.slice(0, 3);
  if (!names.length) return '';
  return `<span class="ti-evport">${names.map(n => _portrait(n, 30)).join('')}</span>`;
}

function _cardHtml(ev) {
  const cls = ev.type === 'spark' ? 'romance' : ev.social ? 'social' :
    ev.type === 'chestSteal' || ev.type === 'chestBlock' || ev.type === 'chestGrab' || ev.type === 'gift' ? 'steal' :
    ev.type === 'cpr' || ev.type === 'cprWake' || ev.type === 'rescue' || ev.type === 'rescueOther' ? 'cpr' :
    ev.bad && (ev.type === 'wedge' || ev.type === 'airCritical' || ev.type === 'choice' || ev.type === 'keepDiving') ? 'crisis' :
    ev.type === 'formation' ? 'formation' :
    ev.type === 'checkpoint' || ev.type === 'noCrisis' ? 'event' : '';
  const badge = ev.badge ? `<span class="ti-badge ${ev.badgeClass || 'amber'}">${ev.badge}</span>` : '';
  const ports = _evPortraits(ev);
  const duo = ev.duo ? `<span class="ti-duo">${_icon('anchor', 9)}${ev.duo}</span>` : '';
  let who = '';
  if (ev.players && ev.players.length === 2 && !ev.target) who = `<em>${ev.players[0]} &amp; ${ev.players[1]}</em>`;
  else if (ev.player && ev.target) who = `<em>${ev.player}</em> → ${ev.target}`;
  else if (ev.player) who = `<em>${ev.player}</em>`;
  if (cls === 'event') return `<div class="ti-card event">${badge}<div class="bd" style="font-family:'Pirata One';font-size:15px;color:var(--gold-l)">${ev.text}</div></div>`;
  const head = (ports || who || duo)
    ? `<div class="who">${ports}<span class="whotx">${who}${duo}</span></div>` : '';
  return `<div class="ti-card ${cls} ${ports ? 'hasport' : ''}">${badge}${head}<div class="bd">${ev.text}</div></div>`;
}

function _phaseScreen(ep, phaseIdx, suffix) {
  const td = ep.treasureData;
  if (!td) return '';
  const phase = td.phases[phaseIdx];
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = String(ep.num || 0) + '_ti' + suffix;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx:-1 };
  const state = _tvState[stateKey];
  // store phase ref for reveal handlers
  (window._tiVP = window._tiVP || {})[stateKey] = { epNum:ep.num, phaseIdx };

  const steps = phase.events.map(_cardHtml);

  // scope (only for paddle/dive/crisis) with icon markers
  let scope = '';
  if (phaseIdx <= 2) {
    const positions = [[42, 42], [53, 64], [33, 54], [62, 47], [58, 33], [46, 58], [38, 70], [66, 60]];
    const markers = td.crews.slice(0, 8).map((c, i) => {
      const [l, t] = positions[i % positions.length];
      const crisisCls = c.drowned ? ' crisis' : '';
      return `<div class="ti-diver${crisisCls}" style="left:${l}%;top:${t}%"><span class="ic">${_portrait(c.diver, 26)}</span><div class="nm">${c.diver}${c.drowned ? ' ⚠' : c.won ? ' ✦' : ''}</div></div>`;
    }).join('');
    scope = `<div class="ti-scope"><div class="cross"></div><div class="sweep"></div>
      <div class="stag" style="top:7px;left:9px;color:var(--teal)">SOUNDING · ACTIVE</div>
      <div class="stag" style="top:7px;right:9px;color:var(--gold-l)">✕ CHEST: SUNKEN CAVE</div>
      <div class="ti-chestping"></div>${markers}</div>`;
  }

  let log = `<div class="ti-loghead">${_icon('bottle', 20)}SHIP'S LOG — ${phase.title}</div>`;
  if (phaseIdx === 2 && td.crisis?.victim) log += `<div class="ti-crisisbanner">☠ DIVER DOWN ☠</div>`;
  steps.forEach((html, i) => {
    const visible = i <= state.idx;
    log += `<div id="ti-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">${html}</div>`;
  });

  const controls = `<div id="ti-controls-${stateKey}" class="ti-controls"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button id="ti-btn-${stateKey}" onclick="window.treasureRevealNext('${stateKey}', ${steps.length})">▷ REVEAL NEXT</button>
    <button onclick="window.treasureRevealAll('${stateKey}', ${steps.length})">⊕ REVEAL ALL</button>
    <div class="ctr" id="ti-ctr-${stateKey}">${Math.max(0, state.idx + 1)} / ${steps.length} LOGGED</div></div>`;

  const body = `<div class="ti-body">${scope}<div class="ti-cols"><div class="ti-logcol">${log}</div>${_buildCrewSidebar(ep, phaseIdx, state.idx)}</div></div>`;

  return `<div class="rp-page" style="padding:0;background:#02080d;">${_svgDefs()}${_css()}
    <div class="ti-shell"><div class="ti-inner">${_hud(ep, phaseIdx)}${body}</div></div>${controls}</div>`;
}

export function rpBuildTreasureTitleCard(ep) {
  const td = ep.treasureData;
  if (!td) return '';
  const content = `<div class="rp-page" style="padding:0;background:#02080d;">${_svgDefs()}${_css()}
    <div class="ti-shell"><div class="ti-inner">
      <section style="position:relative;min-height:480px;color:var(--ink);overflow:hidden;
        background:radial-gradient(circle at 50% 42%,rgba(231,181,60,.12),transparent 55%),repeating-linear-gradient(46deg,rgba(0,0,0,.04) 0 12px,transparent 12px 24px),linear-gradient(160deg,#e9d6a6,#d8bf86 55%,#c7a96b);
        box-shadow:inset 0 0 90px rgba(90,58,32,.55);">
        <!-- sailing ship -->
        <div style="position:absolute;top:40px;left:-160px;animation:ti-sail 16s linear infinite;">
          <svg width="150" height="100" viewBox="0 0 150 100"><path d="M20 70 L130 70 L118 86 L32 86 Z" fill="#5b3a20" stroke="#3a2412" stroke-width="2"/><rect x="73" y="14" width="4" height="56" fill="#3a2412"/><path d="M77 18 q34 8 30 30 l-30 2 Z" fill="#f2e6c8" stroke="#caa468"/><path d="M73 22 q-30 6 -26 26 l26 2 Z" fill="#e7d3a1" stroke="#caa468"/><path d="M75 8 l18 6 -18 6 z" fill="#d63a3a"/><use href="#ti-skull" x="40" y="56" width="14" height="14"/></svg>
        </div>
        <!-- spinning compass -->
        <div style="position:absolute;right:44px;bottom:36px;width:110px;height:110px;opacity:.9;">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="rgba(58,38,18,.12)" stroke="#5b3a20" stroke-width="3"/><g style="animation:ti-spin 22s linear infinite;transform-origin:50% 50%;" stroke="#5b3a20" stroke-width="1.4"><path d="M60 10v100M10 60h100M25 25l70 70M95 25l-70 70"/></g><g style="animation:ti-wob 3.5s ease-in-out infinite;transform-origin:50% 50%;"><path d="M60 18 L67 60 L60 102 L53 60 Z" fill="#d63a3a" stroke="#3a2412"/><path d="M60 18 L67 60 L53 60 Z" fill="#3a2412"/></g><circle cx="60" cy="60" r="5" fill="#e7b53c" stroke="#3a2412"/></svg>
        </div>
        <!-- bobbing chest -->
        <div style="position:absolute;left:50%;top:55%;transform:translateX(-50%);animation:ti-bob 3s ease-in-out infinite;">
          <svg width="120" height="96" viewBox="0 0 120 96"><ellipse cx="60" cy="88" rx="46" ry="7" fill="rgba(58,38,18,.25)"/><path d="M16 44a44 24 0 0188 0v4H16z" fill="#7a5224" stroke="#3a2412" stroke-width="2"/><rect x="14" y="46" width="92" height="36" rx="4" fill="#5b3a20" stroke="#3a2412" stroke-width="2"/><rect x="12" y="44" width="96" height="7" fill="#e7b53c"/><rect x="53" y="46" width="14" height="36" fill="#e7b53c"/><circle cx="60" cy="64" r="5" fill="#3a2611"/></svg>
        </div>
        <!-- pulsing X -->
        <div style="position:absolute;left:23%;top:28%;font-family:'Pirata One';font-size:50px;color:#d63a3a;text-shadow:2px 2px 0 rgba(58,38,18,.5);animation:ti-xp 2s ease-in-out infinite;">✕</div>
        <div style="position:relative;z-index:4;text-align:center;padding-top:96px;">
          <div style="font-family:'Share Tech Mono';font-size:12px;letter-spacing:5px;color:#3a2412;">◆ DR. McLEAN'S LOST EXPEDITION ◆</div>
          <div style="font-family:'Pirata One';font-size:62px;line-height:.9;color:#3a2611;text-shadow:3px 3px 0 #e7b53c,5px 5px 0 rgba(90,58,32,.4);margin:6px 0;">THE TREASURE ISLAND<br>OF DR. McLEAN</div>
          <div style="font-style:italic;color:#3a2412;font-size:16px;">Pair off. Dive deep. Only one crew surfaces with the chest.</div>
          <div style="display:inline-block;margin-top:16px;padding:7px 24px;background:#d63a3a;color:#f2e6c8;font-family:'Pirata One';font-size:18px;letter-spacing:3px;box-shadow:0 4px 0 #8d2424;clip-path:polygon(6% 0,94% 0,100% 50%,94% 100%,6% 100%,0 50%);">⚔ X MARKS THE SPOT ⚔</div>
          <div style="margin-top:18px;font-size:14px;color:#3a2412;max-width:440px;margin-left:auto;margin-right:auto;">"${td.hostOpener}"</div>
          <div style="margin-top:10px;font-family:'Share Tech Mono';font-size:10px;letter-spacing:2px;color:#5b3a20;">CUT &amp; PADDLE → THE DIVE → THE CRISIS → THE HAUL</div>
        </div>
      </section>
    </div></div></div>
    <style>@keyframes ti-sail{0%{transform:translateX(0) rotate(-2deg)}50%{transform:translateX(680px) rotate(2deg)}100%{transform:translateX(1300px) rotate(-2deg)}}@keyframes ti-spin{to{transform:rotate(360deg)}}@keyframes ti-wob{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(20deg)}}@keyframes ti-bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-10px)}}@keyframes ti-xp{0%,100%{transform:scale(1) rotate(-8deg);opacity:.85}50%{transform:scale(1.16) rotate(-8deg);opacity:1}}@media(prefers-reduced-motion:reduce){[style*=ti-sail],[style*=ti-spin],[style*=ti-wob],[style*=ti-bob],[style*=ti-xp]{animation:none!important}}</style>`;
  return content;
}

export function rpBuildTreasurePaddle(ep) { return _phaseScreen(ep, 0, 'p1'); }
export function rpBuildTreasureDive(ep)   { return _phaseScreen(ep, 1, 'p2'); }
export function rpBuildTreasureCrisis(ep) { return _phaseScreen(ep, 2, 'p3'); }

export function treasureRevealNext(stateKey, total) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx:-1 };
  const state = _tvState[stateKey];
  const nextIdx = state.idx + 1;
  if (nextIdx >= total) return;
  const el = document.getElementById(`ti-step-${stateKey}-${nextIdx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior:'smooth', block:'center' }); }
  state.idx = nextIdx;
  const ctr = document.getElementById(`ti-ctr-${stateKey}`);
  if (ctr) ctr.textContent = `${nextIdx + 1} / ${total} LOGGED`;
  if (nextIdx >= total - 1) { const c = document.getElementById(`ti-controls-${stateKey}`); if (c) c.style.display = 'none'; }
  _updateTreasureSidebar(stateKey);
}

export function treasureRevealAll(stateKey, total) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx:-1 };
  for (let i = 0; i < total; i++) { const el = document.getElementById(`ti-step-${stateKey}-${i}`); if (el) el.style.display = ''; }
  _tvState[stateKey].idx = total - 1;
  const c = document.getElementById(`ti-controls-${stateKey}`); if (c) c.style.display = 'none';
  const ctr = document.getElementById(`ti-ctr-${stateKey}`); if (ctr) ctr.textContent = `${total} / ${total} LOGGED`;
  _updateTreasureSidebar(stateKey);
}

function _updateTreasureSidebar(stateKey) {
  try {
    const meta = (window._tiVP || {})[stateKey];
    if (!meta) return;
    const ep = (gs.episodeHistory || [])[meta.epNum - 1] || window._vpEp;
    if (!ep || !ep.treasureData) return;
    const idx = (window._tvState[stateKey] || {}).idx ?? -1;
    const inner = document.getElementById(`ti-side-inner-${meta.epNum}`);
    if (!inner) return;
    const full = _buildCrewSidebar(ep, meta.phaseIdx, idx);
    const m = full.match(/<div class="ti-rows"[^>]*>([\s\S]*)<\/div>\s*<\/div>$/);
    inner.innerHTML = m ? m[1] : inner.innerHTML;
  } catch (e) { /* sidebar update is non-critical */ }
}

export function rpBuildTreasureResults(ep) {
  const td = ep.treasureData;
  if (!td) return '';
  let content;
  if (td.isMerged && td.immune?.length) {
    const [a, b] = td.immune;
    const ports = td.immune.map(n => _portrait(n, 80)).join('');
    const keeps = (td.keepsakes || []).map(k => `${k.name} keeps ${k.item}`).join(' · ');
    content = `<div style="text-align:center;padding:26px 16px;">
      <div style="display:inline-block;font-family:'Share Tech Mono';font-size:11px;letter-spacing:3px;color:var(--gold-l);border:1px solid rgba(231,181,60,.5);background:rgba(231,181,60,.08);padding:5px 14px;border-radius:20px;">CHEST RECOVERED — IMMUNITY CLAIMED</div>
      <div style="margin:16px 0 6px;display:flex;justify-content:center;gap:6px;">${ports}</div>
      <div style="font-family:'Pirata One';font-size:26px;color:var(--gold-l);">${td.winnerCrew.solo ? a : a + ' &amp; ' + b}</div>
      <div style="font-family:'Share Tech Mono';font-size:11px;color:var(--cyan);margin-top:4px;">${_icon('chest', 14)} CHEST CLAIMED · IMMUNITY${td.gifted ? ' · +1 GIFTED → ' + td.gifted : ''}</div>
      ${keeps ? `<div style="font-size:13px;color:#cbb98c;margin-top:12px;">${_icon('coin', 14)} Keepsakes: ${keeps}</div>` : ''}
      ${td.crisis?.victim ? `<div style="font-size:13px;color:#cfe2e0;max-width:440px;margin:14px auto 0;line-height:1.6;">${td.crisis.leaderChoseRescue ? `${td.crisis.rescuer} gave up a clear shot at the chest to drag ${td.crisis.victim} back from the dark — and ${a}${td.winnerCrew.solo ? '' : ' & ' + b} slipped past to claim it.` : `${td.crisis.rescuer || 'A teammate'} revived ${td.crisis.victim} on the deck while ${a}${td.winnerCrew.solo ? '' : ' & ' + b} surfaced with the prize.`}${td.crisis.cprShowmance ? ` A showmance caught fire after the rescue.` : ''}</div>` : ''}
    </div>`;
  } else if (td.tribeScores) {
    const sorted = Object.entries(td.tribeScores).sort(([, a], [, b]) => b - a);
    let rows = '';
    sorted.forEach(([name, score], i) => {
      const isWin = i === 0, isLose = i === sorted.length - 1;
      const color = isWin ? 'var(--gold-l)' : isLose ? 'var(--blood)' : 'var(--teal)';
      const label = isWin ? 'IMMUNE — RICHEST HAUL' : isLose ? 'TO TRIBAL' : 'SAFE';
      const tribe = gs.tribes?.find(t => t.name === name);
      const ports = (tribe?.members || []).slice(0, 8).map(m => _portrait(m, 32)).join('');
      rows += `<div style="padding:12px;margin:8px 0;border:2px solid ${color};border-radius:8px;background:rgba(9,40,55,.5);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
          <div style="font-family:'Pirata One';font-size:17px;color:var(--gold-l);">${name}</div>
          <div style="font-family:'Share Tech Mono';font-size:10px;color:${color};letter-spacing:1px;">${label}</div></div>
        <div style="font-family:'Share Tech Mono';font-size:11px;color:#bda77a;margin-bottom:7px;">Avg crew score: ${score.toFixed(1)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${ports}</div></div>`;
    });
    content = `<div style="padding:16px;"><div style="font-family:'Pirata One';font-size:22px;color:var(--gold-l);text-align:center;margin-bottom:6px;">THE HAUL — TRIBE RESULTS</div>
      <div style="text-align:center;font-size:13px;color:#cbb98c;margin-bottom:10px;">Richest average haul takes immunity. The lightest goes to the Elimination Trial.</div>
      ${td.crisis?.victim ? `<div style="text-align:center;font-size:12px;color:var(--cyan);margin-bottom:10px;">${td.crisis.rescuer || 'A teammate'} revived ${td.crisis.victim} after the near-drowning.${td.crisis.cprShowmance ? ' A showmance sparked on the deck.' : ''}</div>` : ''}
      ${rows}</div>`;
  } else content = '';
  return `<div class="rp-page" style="padding:0;background:#02080d;">${_svgDefs()}${_css()}
    <div class="ti-shell"><div class="ti-inner">${content}
    <div style="text-align:center;margin:10px 0 20px;font-size:11px;color:#6a5836;font-style:italic;">"${td.hostCloser}"</div></div></div></div>`;
}

export function rpBuildTreasureLeaderboard(ep) {
  const td = ep.treasureData;
  if (!td) return '';
  let rows = '';
  td.standings.forEach((c, i) => {
    const isWin = c.won;
    const who = c.solo ? c.members[0] : `${c.members[0]} & ${c.members[1]}`;
    const ports = c.members.map(m => _portrait(m, 30)).join('');
    const airColor = c.finalAir >= 50 ? 'var(--cyan)' : c.finalAir >= 25 ? 'var(--gold-l)' : '#ff8a8a';
    rows += `<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:6px;margin:3px 0;background:${isWin ? 'rgba(231,181,60,.12)' : 'rgba(9,40,55,.45)'};border:1px solid ${isWin ? 'rgba(231,181,60,.4)' : 'transparent'};">
      <span style="font-size:11px;color:#8a7450;width:18px;text-align:right;">${i + 1}.</span>
      <div style="display:flex;">${ports}</div>
      <span style="flex:1;font-size:13px;color:var(--bone);font-weight:${isWin ? '700' : '400'};">${who} ${isWin ? _icon('chest', 13) : ''}</span>
      <span style="font-family:'Share Tech Mono';font-size:10px;color:${airColor};width:46px;text-align:right;">${_icon('bell', 11)} ${c.finalAir}%</span>
      <span style="font-size:12px;font-weight:700;color:var(--gold-l);width:42px;text-align:right;">${c.score.toFixed(1)}</span></div>`;
  });
  let tribeSection = '';
  if (td.tribeScores) {
    tribeSection = `<div style="margin-top:12px;text-align:center;font-family:'Share Tech Mono';font-size:11px;color:#bda77a;letter-spacing:2px;">TRIBE AVERAGES</div>`;
    Object.entries(td.tribeScores).sort(([, a], [, b]) => b - a).forEach(([name, s], i) => {
      tribeSection += `<div style="text-align:center;font-size:13px;color:${i === 0 ? 'var(--gold-l)' : 'var(--blood)'};margin:2px 0;">${i === 0 ? '🏆' : '⚓'} ${name}: ${s.toFixed(1)} avg</div>`;
    });
  }
  const content = `<div style="padding:16px;">
    <div style="font-family:'Pirata One';font-size:22px;color:var(--gold-l);text-align:center;">CREW HAUL REPORT</div>
    <div style="text-align:center;font-family:'Share Tech Mono';font-size:10px;color:#8a7450;letter-spacing:1px;margin-bottom:10px;">${td.crews.length} CREWS · ${td.crisis?.victim ? '1 NEAR-DROWNING' : 'NO CASUALTIES'}</div>
    ${rows}${tribeSection}
    ${td.gifted ? `<div style="text-align:center;margin-top:10px;font-size:12px;color:var(--gold-l);">${_icon('coin', 13)} ${td.immune[0]}${td.winnerCrew.solo ? '' : ' & ' + td.immune[1]} gifted extra immunity to ${td.gifted}</div>` : ''}
    <div style="text-align:center;margin-top:14px;font-size:11px;color:#6a5836;font-style:italic;">"${td.hostCloser}"</div></div>`;
  return `<div class="rp-page" style="padding:0;background:#02080d;">${_svgDefs()}${_css()}
    <div class="ti-shell"><div class="ti-inner">${content}</div></div></div>`;
}
