// ══════════════════════════════════════════════════════════════════════
// mine-over-matter.js — "Mine Over Matter" (both-phase)
// A radioactive abandoned mine. Players descend, dig gems under a Geiger
// countdown, run the cart tunnels while mutant gophers drag and scorpions
// swarm, then scramble out before detonation — and find out at the exit
// whether their gem bag actually held.
//
// Pre-merge:  tribes ranked by avg (gems-out + escape). Losing tribe → tribal.
// Post-merge: highest gems-out + escape wins individual immunity. The
//             hole-in-the-bag check at the exit can dethrone the leader.
//
// Source inspiration: "A Mine Is a Terrible Thing to Waste" (radioactive mine,
// Geiger timers, mystery backpack bombs, mutant gophers, mine carts, fireflies,
// throwing the challenge) + "What's Mine Is Mine" (mine 10 gems, climb out,
// giant scorpions, the hole-in-the-bag elimination).
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── helpers ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const noise = (n = 2.5) => (Math.random() - 0.5) * 2 * n;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }

// Deterministic-ish text picker so re-renders of the same VP are stable
function _pick(arr, seed) {
  if (!arr || !arr.length) return '';
  let h = 0; const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return arr[h % arr.length];
}

// Schemer eligibility (per project rules)
const VILLAIN_ARCH = ['villain', 'mastermind', 'schemer'];
const NICE_ARCH = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function canScheme(name) {
  const a = arch(name);
  if (VILLAIN_ARCH.includes(a)) return true;
  if (NICE_ARCH.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

const HOST_OPENERS = [
  "Welcome to the most radioactive challenge in franchise history! Hope nobody's attached to their hair.",
  "Today you're going underground. Way underground. Into a mine that the government technically still denies exists.",
  "Grab a Geiger counter, grab a backpack, and whatever you do — don't read the warning labels. There's too many.",
  "Behind me is an abandoned mine full of glowing gems and very illegal levels of radiation. Dig in!",
];
const HOST_CLOSERS = [
  "And that's a wrap! Somebody hose them down before they start glowing in the dark.",
  "Beautiful work, everyone. Mostly. The lawyers will be in touch.",
  "Another flawless challenge with zero long-term health consequences that we're aware of yet.",
  "Pack it up! The mine's sealed, the gems are counted, and Chef's already lost the cart keys.",
];

// ══════════════════════════════════════════════════════════════════════
// TEXT POOLS — every social beat carries a gameplay consequence
// ══════════════════════════════════════════════════════════════════════

// PHASE 1 — descent down the cables
const DESCENT_OK = [
  (n, p) => `${n} grips the elevator cable and slides down hand over hand, boots braced against the shaft wall. Clean descent.`,
  (n, p) => `The lift cage is wrecked at the bottom, so ${n} shimmies down the cable like a pro, dropping the last stretch into the dark.`,
  (n, p) => `${n} wraps ${p.posAdj} legs around the cable and lowers ${p.ref} steadily, never once looking down. Smooth.`,
  (n, p) => `${n} takes the cable fast and controlled, landing in a crouch at the shaft floor. The headlamp beam swings up the rock face.`,
];
const DESCENT_STUMBLE = [
  (n, p) => `${n} loses ${p.posAdj} grip halfway down and rides the cable the rest of the way, palms screaming. Rough landing.`,
  (n, p) => `The cable's slick with mineral grease. ${n} drops too fast, hits the bottom hard, and sits there blinking at the ceiling.`,
  (n, p) => `${n} freezes a third of the way down, then half-falls the rest, landing in a heap of dust and dignity.`,
  (n, p) => `${n} miscounts the distance and lands flat-footed with a yelp that echoes through three tunnels.`,
];

// PHASE 1 — digging
const DIG_BIG = [
  (n, p, g) => `${n} reads the seam like a map and swings into it — ${g} gems pried loose and stuffed in the bag. A glowing haul.`,
  (n, p, g) => `Pick, twist, pry. ${n} works the rock with frightening efficiency and pockets ${g} gems before the dust settles.`,
  (n, p, g) => `${n} finds a pocket of crystal nobody else spotted and cracks it wide — ${g} gems, easy.`,
  (n, p, g) => `Backpack be damned, ${n} digs like the timer's personal — ${g} gems clatter into the bag.`,
];
const DIG_MID = [
  (n, p, g) => `${n} chips away steadily and comes up with ${g} gems. Not flashy, but it counts.`,
  (n, p, g) => `${n} works a soft vein near the cart track, prying out ${g} gems before moving on.`,
  (n, p, g) => `Sweat and grit. ${n} bags ${g} gems from a stubborn wall.`,
  (n, p, g) => `${n} keeps a steady rhythm and adds ${g} gems to the bag.`,
];
const DIG_POOR = [
  (n, p, g) => `${n} swings at the wrong wall for ages and only manages ${g} gems. The radiation's not helping ${p.posAdj} focus.`,
  (n, p, g) => `The heavy backpack throws ${n} off balance with every swing. Just ${g} gems to show for it.`,
  (n, p, g) => `${n} can barely see in the gloom and scrapes together a measly ${g} gems.`,
  (n, p, g) => `${n} hits a dead seam, curses, and salvages only ${g} gems before giving up on it.`,
];

// PHASE 1 — LIGHT ECONOMY
const LIGHT_FOUND = [
  (n, p) => `${n} spots an old jar of glow-bugs wedged in a crevice and snatches it. Suddenly the seam lights up gold.`,
  (n, p) => `A forgotten miner's flashlight, still half-charged. ${n} claims it and the dark peels back.`,
  (n, p) => `${n} cups a swarm of mine fireflies into a jar — instant headlamp, and a much better dig.`,
];
const LIGHT_SHARE = [
  (n, t, p) => `${n} sees ${t} fumbling blind and tosses over the firefly jar. "Take it, I've got the seam memorized." ${t} can finally see.`,
  (n, t, p) => `${n} splits the glow-bugs into a second jar and hands it to ${t}. Two lights now where there was one.`,
  (n, t, p) => `${n} wedges the flashlight so it lights both ${p.posAdj} wall and ${t}'s. A quiet kindness in the dark.`,
];
const LIGHT_STEAL = [
  (n, t, p) => `${n} waits until ${t} sets the firefly jar down, then palms it and slips into the next tunnel. ${t} is left digging blind.`,
  (n, t, p) => `In the dark nobody sees ${n} snatch ${t}'s flashlight. By the time ${t} notices, ${n} is three seams away.`,
  (n, t, p) => `${n} "borrows" ${t}'s glow-bugs and never gives them back. ${t} loses half a bag's worth of dig time scrabbling in the black.`,
];

// PHASE 2 — cart navigation
const CART_OK = [
  (n, p) => `${n} reads the rails by lamplight, leaning the cart through a hairpin bend at full clatter. Perfect line.`,
  (n, p) => `${n} works the brake lever like a tram driver, threading the cart past a collapsed support without losing speed.`,
  (n, p) => `${n} calls the turns a beat early and rides the cart clean through the junction. Gems intact.`,
  (n, p) => `The track forks three ways. ${n} picks right on instinct and it pays off — open tunnel ahead.`,
];
const CART_BAD = [
  (n, p, lost) => `${n} takes the bend too hot, the cart bucks, and ${lost} gems bounce out into the dark. No time to grab them.`,
  (n, p, lost) => `${n} misreads the junction and slams a dead-end wall. The jolt spills ${lost} gems across the floor.`,
  (n, p, lost) => `A wheel jumps the rail. ${n} wrestles it back but ${lost} gems are gone over the side.`,
  (n, p, lost) => `${n} can't find the brake in time. The cart rattles so hard ${lost} gems leap clean out of the bag.`,
];

// PHASE 2 — GOPHER ambush
const GOPHER_DRAG = [
  (n, p) => `The floor erupts. A mutant gopher the size of a fridge clamps ${n}'s pack and hauls ${p.obj} half into a burrow.`,
  (n, p) => `Claws burst up through the rock. A gopher drags ${n} backward by the boot, snarling.`,
  (n, p) => `${n} steps on what looks like dirt. It isn't. A gopher's paw rockets up and yanks ${p.obj} under.`,
  (n, p) => `Two glowing eyes, then teeth. The gopher gets ${n} by the bag strap and starts reeling ${p.obj} in.`,
];
const GOPHER_ESCAPE_SELF = [
  (n, p) => `${n} kicks free, leaves the gopher with a mouthful of boot, and scrambles back to the cart.`,
  (n, p) => `${n} twists out of the pack straps, lets the gopher have the empty backpack, and bolts.`,
  (n, p) => `${n} jabs the headlamp right in the gopher's eyes. It recoils, ${p.sub} runs.`,
];
const GOPHER_RESCUE = [
  (r, t, p) => `${r} grabs ${t}'s wrist and hauls back against the gopher in a tug of war over the rock. The beast lets go — both go sprawling, free.`,
  (r, t, p) => `${r} swings a pickaxe handle at the gopher's snout. It releases ${t} with a furious squeal and ${r} drags ${p.obj} clear.`,
  (r, t, p) => `${r} jams a support beam into the burrow mouth and levers ${t} loose. "Go, GO!" They both run.`,
];
const GOPHER_RESCUE_FAIL = [
  (r, t, p) => `${r} dives for ${t}'s hand and misses by inches — the gopher drags ${t} deeper before spitting ${p.obj} out a tunnel over, scattered and gemless.`,
  (r, t, p) => `${r} pulls with everything, but the gopher's stronger. ${t} loses the bag in the struggle before tearing free.`,
];

// PHASE 2 — SCORPION swarm (escalation)
const SCORPION_RELEASE = [
  () => `A rusted hatch in the wall bursts open and Chef's voice crackles over a speaker: "Round two!" Out pour the giant mine scorpions, tails high.`,
  () => `Somewhere above, a lever throws. Steel grates slide back and the tunnels fill with the dry skitter of scorpions the size of go-karts.`,
  () => `The radiation must have done something to the bug population. Truck-sized scorpions flood the lower galleries, pincers clacking.`,
];
const SCORPION_HIT = [
  (n, p, lost) => `A scorpion's tail cracks past ${n}'s head. ${n} flinches, drops ${lost} gems, and sprints for higher ground.`,
  (n, p, lost) => `${n} vaults a scorpion but clips the bag on its pincer — ${lost} gems gone in the scramble.`,
  (n, p, lost) => `Pinned against a wall by a scorpion, ${n} has to dump ${lost} gems to wriggle past.`,
];
const SCORPION_DODGE = [
  (n, p) => `${n} reads the tail-strike a half-second early and rolls clean under the scorpion, bag clutched tight.`,
  (n, p) => `${n} baits the scorpion into the wall and slips by while it's stuck, not a gem lost.`,
  (n, p) => `${n} hops pincer to pincer like stepping stones and keeps moving. Cold-blooded.`,
];
const SCORPION_SAVE = [
  (r, t, p) => `${r} yanks ${t} out from under a descending stinger at the last instant. The tail buries in rock where ${t} was standing.`,
  (r, t, p) => `${r} body-checks ${t} clear of a scorpion's charge. Both hit the ground; both keep their gems.`,
];

// PHASE 3 — drop the backpack (bomb reveal)
const PACK_DROP = [
  (n, p) => `"DROP YOUR PACKS!" ${n} shrugs the backpack off instantly — and the second it hits the floor it starts ticking. A bomb. ${n} runs lighter and faster.`,
  (n, p) => `${n} doesn't ask twice. The pack comes off, and the timer inside it lights red. ${n} is already climbing, weightless now.`,
  (n, p) => `${n} flings the backpack into a side tunnel just as it begins to whine. Free of the deadweight, ${p.sub} attacks the climb.`,
];
const PACK_KEEP = [
  (n, p) => `${n} refuses to ditch the pack — there might be gems in there, right? The detonation behind ${p.obj} answers that. ${n} is blown off ${p.posAdj} feet and loses ground.`,
  (n, p) => `${n} clings to the backpack out of pure stubbornness and lugs the dead weight up the slope, falling behind the lighter climbers.`,
  (n, p) => `${n} hesitates one beat too long. The pack's still on ${p.posAdj} back when the charge goes, and the blast wave shoves ${p.obj} into the wall.`,
];

// PHASE 3 — the climb
const CLIMB_FAST = [
  (n, p) => `${n} attacks the slope like it owes ${p.obj} money, headlamp bouncing, gravel spraying. Pure speed.`,
  (n, p) => `${n} finds every handhold in the dark and rockets up the shaft. The Geiger counter is screaming and ${p.sub} doesn't care.`,
  (n, p) => `${n} takes the climb three rungs at a time. Daylight, finally, cracking at the top.`,
];
const CLIMB_SLOW = [
  (n, p) => `${n} grinds up the slope on fumes, the bag of gems dragging at ${p.posAdj} shoulder the whole way.`,
  (n, p) => `Every meter is a fight. ${n} hauls ${p.ref} up by inches as the radiation alarm shrieks.`,
  (n, p) => `${n} slips twice on the scree and loses precious seconds clawing back to the rope.`,
];

// PHASE 3 — HOLE IN THE BAG
const BAG_HOLE = [
  (n, p, was) => `${n} crosses the line first and dumps the bag out for the count — and it's almost empty. A scorpion's pincer had torn a hole, and ${was} gems leaked out somewhere in the tunnels. Devastating.`,
  (n, p, was) => `${n} bursts into daylight triumphant, upends the bag... and a single sad gem rolls out. The rest of the ${was} drained through a rip nobody noticed.`,
  (n, p, was) => `The host counts ${n}'s gems and stops at almost zero. The bag's seam split hours ago. All but a handful of ${was} gems are scattered back in the dark. Finishing first means nothing now.`,
];
const BAG_INTACT = [
  (n, p, g) => `${n} pours the bag out and the count holds — ${g} gems, every one accounted for. The bag held.`,
  (n, p, g) => `${n} tips ${p.posAdj} haul onto the scale: ${g} gems, intact. No leaks, no losses.`,
];

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateMineOverMatter(ep) {
  const active = [...gs.activePlayers].filter(p => p !== ep.exileDuelPlayer);
  const isMerged = gs.isMerged;
  const campKey = isMerged ? (gs.mergeName || 'merge') : null;

  const hostOpener = _pick(HOST_OPENERS, ep.num);
  const hostCloser = _pick(HOST_CLOSERS, ep.num + 1);
  const GEM_QUOTA = 10;

  // per-player state
  const st = {};
  active.forEach(n => {
    st[n] = { gems: 0, light: 0, lostUnder: false, packDropped: false, escapeTime: 0,
              bagHole: false, gemsOut: 0, gemsCarried: 0, score: 0, caughtFinal: false };
  });

  const phaseDescent = { key: 'descent', title: 'DESCENT & DIG', themeClass: 'mn-theme-descent', events: [] };
  const phaseTunnels = { key: 'tunnels', title: 'THE CART TUNNELS', themeClass: 'mn-theme-tunnels', events: [] };
  const phaseEscape  = { key: 'escape',  title: 'THE ESCAPE',      themeClass: 'mn-theme-escape',  events: [] };

  const push = (phase, ev) => phase.events.push(ev);

  // ─────────────────────────────────────────────────────────────────
  // PHASE 1 — DESCENT & DIG (physical/endurance + light economy)
  // ─────────────────────────────────────────────────────────────────
  // assign light: roughly the more intuitive/lucky half find a light source
  const lightRanked = [...active].sort((a, b) =>
    (pStats(b).intuition + pStats(b).boldness + noise(4)) - (pStats(a).intuition + pStats(a).boldness + noise(4)));
  const litCount = Math.ceil(active.length * 0.45);
  const litSet = new Set(lightRanked.slice(0, litCount));

  for (const n of active) {
    const p = pronouns(n), s = pStats(n);
    // descent
    const stumbleChance = clamp(0.45 - (s.boldness + s.physical) * 0.03, 0.08, 0.5);
    if (Math.random() < stumbleChance) {
      push(phaseDescent, { type: 'descent', player: n, bad: true, text: _pick(DESCENT_STUMBLE, n + ep.num)(n, p),
        badge: 'ROUGH DROP', badgeClass: 'amber' });
      st[n].escapeTime += 0.4; // a little fatigue carried forward
    } else {
      push(phaseDescent, { type: 'descent', player: n, text: _pick(DESCENT_OK, n + ep.num)(n, p) });
    }
    // light source
    if (litSet.has(n)) { st[n].light = 1; }
  }

  // light found beats (a few flavor reveals)
  for (const n of lightRanked.slice(0, Math.min(3, litCount))) {
    push(phaseDescent, { type: 'lightFound', player: n, text: _pick(LIGHT_FOUND, n + 'lf')(n, pronouns(n)),
      badge: 'LIGHT FOUND', badgeClass: 'green' });
  }

  // light sharing & stealing (social, with consequences)
  const dark = active.filter(n => !litSet.has(n));
  // SHARE: a lit, loyal/social player helps a dark one
  const sharers = lightRanked.slice(0, litCount).filter(n => {
    const s = pStats(n); return (s.loyalty >= 6 || s.social >= 6) && !canScheme(n);
  });
  const sharePairs = [];
  for (const giver of sharers) {
    if (!dark.length) break;
    if (Math.random() < 0.5) {
      const taker = dark.find(d => getBond(giver, d) >= 0 && !sharePairs.some(sp => sp.t === d));
      if (taker) {
        sharePairs.push({ g: giver, t: taker });
        st[taker].light = 1;
        addBond(giver, taker, 2);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[giver] = (gs.popularity[giver] || 0) + 2;
        push(phaseDescent, { type: 'lightShare', player: giver, target: taker,
          text: _pick(LIGHT_SHARE, giver + taker)(giver, taker, pronouns(giver)),
          badge: 'LIGHT SHARED', badgeClass: 'green' });
      }
    }
  }
  // STEAL: a schemer swipes someone's light
  const thieves = active.filter(n => canScheme(n) && litSet.has(n) === false ? false : canScheme(n));
  for (const thief of active.filter(canScheme)) {
    if (Math.random() < 0.4) {
      const victim = active.find(v => v !== thief && litSet.has(v) &&
        !sharePairs.some(sp => sp.t === v) && getBond(thief, v) < 4);
      if (victim) {
        st[victim].light = 0;
        st[thief].light = 1;
        addBond(thief, victim, -3);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[thief] = (gs.popularity[thief] || 0) - 2;
        gs.popularity[victim] = (gs.popularity[victim] || 0) + 1;
        push(phaseDescent, { type: 'lightSteal', player: thief, target: victim, bad: true,
          text: _pick(LIGHT_STEAL, thief + victim)(thief, victim, pronouns(thief)),
          badge: 'LIGHT STOLEN', badgeClass: 'red' });
        // camp event consequence
        if (campKey && ep.campEvents) {
          (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
            type: 'mineSteal', players: [thief, victim], tag: 'mine-over-matter',
            text: `${thief} swiped ${victim}'s light source in the mine and left ${pronouns(victim).obj} digging blind. ${victim} hasn't forgotten.`,
            badgeText: 'GRUDGE', badgeClass: 'red' });
        }
        break; // one steal max keeps it special
      }
    }
  }

  // dig: gems based on physical/endurance, light bonus, backpack malus, noise
  for (const n of active) {
    const s = pStats(n), p = pronouns(n);
    let g = 3 + s.physical * 0.32 + s.endurance * 0.30 + st[n].light * 2.4 - 1.0 /*pack weight*/ + noise(2.2);
    g = Math.round(clamp(g, 0, GEM_QUOTA + 2));
    st[n].gems = g;
    const poolBeat = g >= 9 ? DIG_BIG : g >= 5 ? DIG_MID : DIG_POOR;
    push(phaseDescent, { type: 'dig', player: n, gemDelta: g,
      text: _pick(poolBeat, n + 'dig' + ep.num)(n, p, g) });
  }

  // ─────────────────────────────────────────────────────────────────
  // PHASE 2 — CART TUNNELS (mental/intuition + gophers + scorpions)
  // ─────────────────────────────────────────────────────────────────
  for (const n of active) {
    const s = pStats(n), p = pronouns(n);
    const navOk = (s.mental * 0.4 + s.intuition * 0.4 + noise(3)) > 4.2;
    if (navOk) {
      push(phaseTunnels, { type: 'cart', player: n, text: _pick(CART_OK, n + 'cart')(n, p) });
    } else {
      const lost = clamp(Math.round(1 + Math.random() * 2), 1, st[n].gems);
      st[n].gems = Math.max(0, st[n].gems - lost);
      push(phaseTunnels, { type: 'cart', player: n, bad: true, gemDelta: -lost,
        text: _pick(CART_BAD, n + 'cartb')(n, p, lost), badge: `-${lost} GEMS`, badgeClass: 'amber' });
    }
  }

  // GOPHER ambushes — ~35% of players get dragged; rescuers can intervene
  const ambushOrder = [...active].sort(() => Math.random() - 0.5);
  const ambushed = ambushOrder.filter(() => Math.random() < 0.45);
  for (const n of ambushed) {
    const p = pronouns(n), s = pStats(n);
    push(phaseTunnels, { type: 'gopher', player: n, bad: true, text: _pick(GOPHER_DRAG, n + 'gd')(n, p),
      badge: 'DRAGGED UNDER', badgeClass: 'red' });

    // rescue candidates: loyal teammates with a bond
    const rescuers = active.filter(r => {
      if (r === n) return false;
      const rs = pStats(r);
      // pre-merge prefer same-tribe; post-merge anyone with bond
      const sameTribe = isMerged || gs.tribes?.some(t => t.members.includes(r) && t.members.includes(n));
      return rs.loyalty >= 5 && getBond(r, n) >= 3 && sameTribe;
    });

    let resolved = false;
    if (rescuers.length && Math.random() < 0.55) {
      const r = pick(rescuers);
      const rs = pStats(r);
      const success = Math.random() < clamp(rs.loyalty * 0.08 + rs.boldness * 0.04 + getBond(r, n) * 0.04, 0.2, 0.92);
      if (success) {
        addBond(r, n, 3);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[r] = (gs.popularity[r] || 0) + 2;
        st[r].escapeTime += 0.5; // cost the rescuer time
        push(phaseTunnels, { type: 'rescue', player: r, target: n,
          text: _pick(GOPHER_RESCUE, r + n + 'gr')(r, n, p), badge: 'RESCUE!', badgeClass: 'green' });
        resolved = true;
      } else {
        const lost = clamp(Math.round(2 + Math.random() * 3), 1, st[n].gems);
        st[n].gems = Math.max(0, st[n].gems - lost);
        addBond(r, n, 1);
        push(phaseTunnels, { type: 'rescueFail', player: r, target: n, bad: true, gemDelta: -lost,
          text: _pick(GOPHER_RESCUE_FAIL, r + n + 'grf')(r, n, p), badge: `-${lost} GEMS`, badgeClass: 'amber' });
        resolved = true;
      }
    }
    if (!resolved) {
      // self-escape but lose gems in the burrow
      const lost = clamp(Math.round(2 + Math.random() * 3), 1, st[n].gems);
      st[n].gems = Math.max(0, st[n].gems - lost);
      st[n].lostUnder = true;
      push(phaseTunnels, { type: 'gopherEscape', player: n, bad: true, gemDelta: -lost,
        text: _pick(GOPHER_ESCAPE_SELF, n + 'ge')(n, p) + ` (${lost} gems lost in the burrow)`,
        badge: `-${lost} GEMS`, badgeClass: 'amber' });
    }
  }

  // THROW THE CHALLENGE — a high cross-line bond player sabotages own run to save a friend
  // pre-merge: across tribes; post-merge: across alliances. Bond + nice/neutral archetype driven.
  let threwChallenge = null;
  const throwCandidates = active.filter(n => {
    if (canScheme(n)) return false; // schemers don't sacrifice for others
    const s = pStats(n);
    if (s.loyalty < 6) return false;
    // find a cross-line friend (different tribe pre-merge)
    const crossFriend = active.find(o => {
      if (o === n) return false;
      const sameTribe = gs.tribes?.some(t => t.members.includes(o) && t.members.includes(n));
      const crossLine = isMerged ? true : !sameTribe;
      return crossLine && getBond(n, o) >= 6;
    });
    return !!crossFriend;
  });
  if (throwCandidates.length && Math.random() < 0.5) {
    const n = pick(throwCandidates);
    const p = pronouns(n);
    const friend = active.find(o => {
      if (o === n) return false;
      const sameTribe = gs.tribes?.some(t => t.members.includes(o) && t.members.includes(n));
      const crossLine = isMerged ? true : !sameTribe;
      return crossLine && getBond(n, o) >= 6;
    });
    if (friend) {
      const sac = clamp(Math.round(2 + Math.random() * 3), 2, st[n].gems);
      st[n].gems = Math.max(0, st[n].gems - sac);
      st[friend].gems += sac;
      addBond(n, friend, 2);
      st[n].escapeTime += 1.0;
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[n] = (gs.popularity[n] || 0) + 2; // crowd loves the martyr
      const _throwTexts = [
        `${n} can't do it. ${friend} is ${p.sub === 'they' ? 'a' : 'an'} old friend, and when ${friend} comes up short, ${n} quietly tips ${sac} gems into ${friend}'s bag and eats the loss. The cameras catch all of it.`,
        `Halfway through the tunnels ${n} makes a choice that has nothing to do with winning: ${sac} gems pressed into ${friend}'s hands. "You need this more than me." A challenge thrown for loyalty.`,
        `${n} slows up, lets ${friend} catch the better cart, and hands over ${sac} gems on the way past. It'll cost ${p.obj} dearly — and ${p.sub} ${p.sub === 'they' ? "don't" : "doesn't"} hesitate.`,
      ];
      threwChallenge = { player: n, friend, gems: sac };
      push(phaseTunnels, { type: 'throw', player: n, target: friend,
        text: _pick(_throwTexts, n + friend + 'throw'), badge: 'THREW IT FOR A FRIEND', badgeClass: 'gold' });
      if (campKey && ep.campEvents) {
        (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
          type: 'mineThrow', players: [n, friend], tag: 'mine-over-matter',
          text: `${n} threw part of the mine challenge to keep ${friend} safe. Loyalty like that gets noticed — by allies and by anyone hunting for a number.`,
          badgeText: 'LOYALTY', badgeClass: 'gold' });
      }
    }
  }

  // SCORPION RELEASE (escalation) — affects everyone still in the tunnels
  push(phaseTunnels, { type: 'scorpionRelease', text: _pick(SCORPION_RELEASE, ep.num + 'sc')(),
    badge: 'SCORPIONS RELEASED', badgeClass: 'red' });
  for (const n of active) {
    const s = pStats(n), p = pronouns(n);
    const dodge = (s.boldness * 0.35 + s.intuition * 0.35 + s.physical * 0.2 + noise(3)) > 5.4;
    if (dodge) {
      // chance for a save of a teammate
      const saveTarget = active.find(o => o !== n && pStats(o).boldness < 5 && getBond(n, o) >= 4);
      if (saveTarget && pStats(n).boldness >= 6 && Math.random() < 0.4) {
        addBond(n, saveTarget, 2);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[n] = (gs.popularity[n] || 0) + 1;
        push(phaseTunnels, { type: 'scorpionSave', player: n, target: saveTarget,
          text: _pick(SCORPION_SAVE, n + saveTarget + 'ss')(n, saveTarget, p), badge: 'CLUTCH SAVE', badgeClass: 'green' });
      } else {
        push(phaseTunnels, { type: 'scorpion', player: n, text: _pick(SCORPION_DODGE, n + 'sd')(n, p) });
      }
    } else {
      const lost = clamp(Math.round(1 + Math.random() * 2), 0, st[n].gems);
      st[n].gems = Math.max(0, st[n].gems - lost);
      push(phaseTunnels, { type: 'scorpion', player: n, bad: true, gemDelta: -lost,
        text: _pick(SCORPION_HIT, n + 'sh')(n, p, lost), badge: lost ? `-${lost} GEMS` : 'NEAR MISS', badgeClass: 'amber' });
    }
  }

  // romance hooks — the mine is dangerous + has cart downtime
  if (seasonConfig.romance !== 'disabled') {
    _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || (ep.chalMemberScores = {}), 'danger', null);
    // try a spark among a couple of high-bond eligible pairs
    const sparkTried = new Set();
    for (let i = 0; i < active.length && sparkTried.size < 2; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j];
        if (getBond(a, b) >= 4 && !sparkTried.has(a + b)) {
          sparkTried.add(a + b);
          const sparked = _challengeRomanceSpark(a, b, ep, null, null, ep.chalMemberScores, 'mine collapse');
          if (sparked) {
            push(phaseTunnels, { type: 'spark', player: a, target: b,
              text: `In the pitch dark of a cart tunnel, ${a} and ${b} end up sharing a single lamp — and something else catches.`,
              badge: 'ROMANCE SPARK', badgeClass: 'gold' });
            break;
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // PHASE 3 — THE ESCAPE (drop pack bomb + climb + hole in bag)
  // ─────────────────────────────────────────────────────────────────
  for (const n of active) {
    const s = pStats(n), p = pronouns(n);
    st[n].gemsCarried = st[n].gems;
    // drop-the-pack decision: bolder players ditch faster
    const drop = (s.boldness * 0.4 + s.intuition * 0.3 + noise(3)) > 3.6;
    st[n].packDropped = drop;
    if (drop) {
      push(phaseEscape, { type: 'pack', player: n, text: _pick(PACK_DROP, n + 'pd')(n, p), badge: 'PACK DROPPED', badgeClass: 'green' });
    } else {
      st[n].escapeTime += 2.2; // big penalty for keeping the bomb pack
      push(phaseEscape, { type: 'pack', player: n, bad: true, text: _pick(PACK_KEEP, n + 'pk')(n, p), badge: 'KEPT THE PACK', badgeClass: 'red' });
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[n] = (gs.popularity[n] || 0) - 1; // looks foolish / greedy
    }
    // climb
    const climbBase = 10 - s.boldness * 0.25 - s.endurance * 0.30 + (st[n].packDropped ? 0 : 0) + noise(2.0);
    st[n].escapeTime += clamp(climbBase, 2, 12);
    const fast = (s.boldness + s.endurance) >= 12 && st[n].packDropped;
    push(phaseEscape, { type: 'climb', player: n, text: (fast ? _pick(CLIMB_FAST, n + 'cf') : _pick(CLIMB_SLOW, n + 'cs'))(n, p) });
  }

  // escape order (lower escapeTime = earlier out)
  const escapeOrder = [...active].sort((a, b) => st[a].escapeTime - st[b].escapeTime);
  escapeOrder.forEach((n, i) => { st[n].escapeRank = i + 1; });

  // HOLE IN THE BAG — integrity check at the exit
  // higher intuition + fewer gopher/scorpion hits = safer bag; capped so it stays an upset, not a coin flip
  for (const n of active) {
    const s = pStats(n), p = pronouns(n);
    const hitPenalty = st[n].lostUnder ? 0.12 : 0;
    let holeChance = clamp(0.18 - s.intuition * 0.012 + hitPenalty, 0.04, 0.30);
    const had = st[n].gemsCarried;
    if (had > 0 && Math.random() < holeChance) {
      st[n].bagHole = true;
      const leaked = Math.max(0, Math.round(had * (Math.random() * 0.22))); // keeps 0–22%
      st[n].gemsOut = leaked;
      push(phaseEscape, { type: 'bagHole', player: n, bad: true,
        text: _pick(BAG_HOLE, n + 'bh')(n, p, had), badge: 'BAG LEAKED!', badgeClass: 'red' });
    } else {
      st[n].gemsOut = had;
      if (had >= 8) {
        push(phaseEscape, { type: 'bagIntact', player: n, text: _pick(BAG_INTACT, n + 'bi')(n, p, had), badge: 'BAG HELD', badgeClass: 'green' });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SCORING
  // score = gemsOut*3 + escape bonus (earlier out = more) + small survival
  // ─────────────────────────────────────────────────────────────────
  const N = active.length;
  for (const n of active) {
    const escBonus = (N - (st[n].escapeRank - 1)) * 0.6; // first out gets the most
    st[n].score = st[n].gemsOut * 3 + escBonus + 1;
  }

  const leaderboard = active.map(n => ({
    name: n, gemsOut: st[n].gemsOut, gemsCarried: st[n].gemsCarried, bagHole: st[n].bagHole,
    escapeRank: st[n].escapeRank, packDropped: st[n].packDropped, score: st[n].score,
  })).sort((a, b) => b.score - a.score || b.gemsOut - a.gemsOut || a.escapeRank - b.escapeRank);

  const chalMemberScores = {};
  active.forEach(n => { chalMemberScores[n] = st[n].score; });
  ep.chalMemberScores = chalMemberScores;
  ep.chalPlacements = leaderboard.map(e => e.name);

  // ── win conditions ──
  let immunityWinner = null;
  let tribeScores = null;

  if (isMerged) {
    immunityWinner = leaderboard[0].name;
    ep.immunityWinner = immunityWinner;
    ep.tribalPlayers = [...active];
    ep.challengeType = 'mine-over-matter';
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 3;
  } else {
    // pre-merge: rank tribes by avg score
    tribeScores = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (!members.length) continue;
      tribeScores[tribe.name] = members.reduce((s, m) => s + st[m].score, 0) / members.length;
    }
    const sorted = Object.entries(tribeScores).sort(([, a], [, b]) => b - a);
    if (sorted.length) {
      const winnerTribe = gs.tribes.find(t => t.name === sorted[0][0]);
      const loserTribe = gs.tribes.find(t => t.name === sorted[sorted.length - 1][0]);
      ep.winner = winnerTribe;
      ep.loser = loserTribe;
      ep.safeTribes = gs.tribes.filter(t => t !== loserTribe && t !== winnerTribe);
      ep.challengePlacements = sorted.map(([name]) => {
        const t = gs.tribes.find(tr => tr.name === name);
        return { name, members: [...(t?.members || [])] };
      });
      ep.tribalPlayers = [...(loserTribe?.members || [])];
    }
    ep.challengeType = 'mine-over-matter';
  }

  updateChalRecord(ep);

  ep.challengeLabel = 'Mine Over Matter';
  ep.challengeCategory = 'challenge';
  ep.isMineOverMatter = true;
  ep.mineData = {
    isMerged, hostOpener, hostCloser, gemQuota: GEM_QUOTA,
    phases: [phaseDescent, phaseTunnels, phaseEscape],
    leaderboard, scores: chalMemberScores,
    immunityWinner, tribeScores, threwChallenge,
    escapeOrder: escapeOrder.map(n => ({ name: n, rank: st[n].escapeRank, gemsOut: st[n].gemsOut, bagHole: st[n].bagHole })),
    st,
  };
}

// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG — complete retranscription of the VP narration
// ══════════════════════════════════════════════════════════════════════
export function _textMineOverMatter(ep, ln, sec) {
  const md = ep.mineData;
  if (!md) return;
  sec('MINE OVER MATTER');
  ln(`Radioactive Mine Challenge — collect ${md.gemQuota} gems and escape before detonation.`);
  ln(`${host()}: "${md.hostOpener}"`);
  ln('');

  for (const phase of md.phases) {
    ln(`═══ ${phase.title} ═══`);
    ln('');
    for (const ev of phase.events) {
      const tag = ev.badge ? `[${ev.badge}] ` : '';
      ln(`${tag}${ev.text}`);
    }
    ln('');
  }

  ln('═══ FINAL GEM COUNT ═══');
  md.leaderboard.forEach((e, i) => {
    const flags = [];
    if (e.bagHole) flags.push('BAG LEAKED');
    if (e.packDropped) flags.push('pack dropped');
    ln(`${i + 1}. ${e.name} — ${e.gemsOut} gems out (carried ${e.gemsCarried}), escaped #${e.escapeRank}${flags.length ? ' — ' + flags.join(', ') : ''} [score ${e.score.toFixed(1)}]`);
  });
  ln('');
  if (md.threwChallenge) ln(`Note: ${md.threwChallenge.player} threw part of the challenge, handing ${md.threwChallenge.gems} gems to ${md.threwChallenge.friend}.`);
  if (md.isMerged && md.immunityWinner) {
    ln(`IMMUNITY: ${md.immunityWinner}`);
  } else if (md.tribeScores) {
    ln('TRIBE SCORES (avg):');
    Object.entries(md.tribeScores).sort(([, a], [, b]) => b - a).forEach(([name, s]) => ln(`  ${name}: ${s.toFixed(1)}`));
  }
  ln('');
  ln(`${host()}: "${md.hostCloser}"`);
}

// ══════════════════════════════════════════════════════════════════════
// VP SCREENS — radioactive mine theme (self-contained CSS)
// ══════════════════════════════════════════════════════════════════════
function _portrait(name, size = 46) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid #3a2f1a;background:#120e08;object-fit:cover;" onerror="this.style.visibility='hidden'">`;
}

function _gemIcon(size = 14) {
  return `<span style="display:inline-block;width:${size}px;height:${size}px;background:linear-gradient(135deg,#7CFFB2,#19c37d);clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%);box-shadow:0 0 6px rgba(25,195,125,0.7);vertical-align:middle;"></span>`;
}

function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Share+Tech+Mono&display=swap');
  .mn-shell{--rock:#1a140c;--rock2:#0e0a06;--amber:#f0a830;--glow:#19c37d;--glow2:#7CFFB2;--alert:#ff3b30;--dust:#c9a86a;
    font-family:'Oswald',sans-serif;color:#e8ddc8;max-width:1100px;margin:0 auto;position:relative;min-height:420px;
    background:radial-gradient(circle at 50% -10%,#2a1f10,#140e07 60%,#0a0704);overflow:clip;border:3px solid #3a2c14;
    box-shadow:inset 0 0 80px rgba(0,0,0,0.7),0 0 22px rgba(25,195,125,0.12);padding:0;}
  /* rock grain + radioactive haze */
  .mn-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.5;
    background:repeating-linear-gradient(115deg,rgba(0,0,0,0.18) 0 3px,transparent 3px 7px),
      radial-gradient(circle at 20% 80%,rgba(25,195,125,0.10),transparent 30%),
      radial-gradient(circle at 80% 30%,rgba(25,195,125,0.08),transparent 35%);}
  .mn-theme-descent{background:radial-gradient(circle at 50% -10%,#16233a,#0b1322 60%,#05080f);border-color:#1c2c44;}
  .mn-theme-tunnels{background:radial-gradient(circle at 50% -10%,#2e2310,#170f06 60%,#0b0703);border-color:#3a2c14;}
  .mn-theme-escape{background:radial-gradient(circle at 50% -10%,#3a1410,#1c0805 60%,#0c0302);border-color:#5a1410;
    animation:mn-alertpulse 1.6s ease-in-out infinite;}
  @keyframes mn-alertpulse{0%,100%{box-shadow:inset 0 0 80px rgba(0,0,0,0.7),0 0 18px rgba(255,59,48,0.15);}50%{box-shadow:inset 0 0 80px rgba(0,0,0,0.7),0 0 34px rgba(255,59,48,0.45);}}
  .mn-inner{position:relative;z-index:2;padding:6px 16px 60px;}
  .mn-hazbar{display:flex;align-items:center;gap:10px;background:repeating-linear-gradient(45deg,#1a1407 0 14px,#241a08 14px 28px);
    border-top:2px solid #f0a830;border-bottom:2px solid #f0a830;padding:6px 12px;font-family:'Share Tech Mono',monospace;
    font-size:11px;letter-spacing:2px;color:#f0a830;text-transform:uppercase;}
  .mn-hazbar .mn-rad{width:18px;height:18px;border-radius:50%;border:2px solid #f0a830;position:relative;flex-shrink:0;}
  .mn-hazbar .mn-rad::before{content:'';position:absolute;inset:3px;border-radius:50%;background:
    conic-gradient(#f0a830 0 60deg,transparent 60deg 120deg,#f0a830 120deg 180deg,transparent 180deg 240deg,#f0a830 240deg 300deg,transparent 300deg);
    animation:mn-spin 4s linear infinite;}
  @keyframes mn-spin{to{transform:rotate(360deg);}}
  .mn-title{text-align:center;padding:26px 16px;}
  .mn-title-big{font-size:42px;font-weight:700;letter-spacing:3px;color:#f0a830;text-shadow:0 0 18px rgba(240,168,48,0.5);line-height:1.05;}
  .mn-title-sub{font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--glow2);letter-spacing:3px;margin-top:8px;}
  .mn-phase-head{font-size:22px;font-weight:700;letter-spacing:4px;color:#f0a830;text-align:center;margin:6px 0 2px;
    text-shadow:0 0 12px rgba(240,168,48,0.4);}
  .mn-geiger{font-family:'Share Tech Mono',monospace;display:flex;gap:14px;justify-content:center;font-size:12px;
    color:#bda77a;letter-spacing:1px;margin:6px 0;}
  .mn-geiger b{color:var(--glow2);}
  .mn-card{display:flex;gap:12px;align-items:center;background:linear-gradient(180deg,rgba(40,30,14,0.9),rgba(20,14,7,0.92));
    border:1px solid #3a2c14;border-left:3px solid #6b5526;border-radius:7px;padding:10px 12px;margin:7px 0;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);}
  .mn-card .mn-txt{flex:1;font-size:13.5px;line-height:1.5;color:#e8ddc8;}
  .mn-card.bad{border-left-color:var(--alert);background:linear-gradient(180deg,rgba(50,18,14,0.85),rgba(22,8,6,0.92));}
  .mn-card.good{border-left-color:var(--glow);background:linear-gradient(180deg,rgba(14,40,26,0.7),rgba(7,18,12,0.9));}
  .mn-card.gold{border-left-color:#ffd24a;background:linear-gradient(180deg,rgba(48,38,10,0.8),rgba(22,16,4,0.92));}
  .mn-card.event{justify-content:center;text-align:center;border-left:none;border:1px dashed #6b5526;background:rgba(20,14,7,0.7);}
  .mn-card.event.alert{border-color:var(--alert);color:#ffb0a8;animation:mn-shake 0.5s;}
  @keyframes mn-shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-6px);}40%{transform:translateX(6px);}60%{transform:translateX(-4px);}80%{transform:translateX(4px);}}
  .mn-badge{display:inline-block;font-family:'Share Tech Mono',monospace;font-size:9px;font-weight:700;letter-spacing:1px;
    padding:2px 7px;border-radius:3px;margin-bottom:4px;text-transform:uppercase;}
  .mn-badge.green{background:rgba(25,195,125,0.2);color:#7CFFB2;border:1px solid rgba(25,195,125,0.4);}
  .mn-badge.amber{background:rgba(240,168,48,0.18);color:#f0c060;border:1px solid rgba(240,168,48,0.4);}
  .mn-badge.red{background:rgba(255,59,48,0.2);color:#ff8a80;border:1px solid rgba(255,59,48,0.4);}
  .mn-badge.gold{background:rgba(255,210,74,0.2);color:#ffd24a;border:1px solid rgba(255,210,74,0.5);}
  .mn-portraits{display:flex;flex-shrink:0;}
  .mn-portraits img:nth-child(2){margin-left:-14px;}
  .mn-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:50;background:rgba(8,5,3,0.94);
    border:1px solid #3a2c14;border-bottom:none;border-radius:8px 8px 0 0;padding:10px 14px;box-shadow:0 -4px 14px rgba(0,0,0,0.6);}
  .mn-controls button{font-family:'Oswald',sans-serif;}
  .mn-next{padding:10px 26px;background:linear-gradient(180deg,#f0a830,#c47e18);color:#1a1206;border:none;border-radius:6px;
    cursor:pointer;font-weight:700;letter-spacing:1px;font-size:13px;}
  .mn-all{padding:8px 14px;background:#241a0c;color:#bda77a;border:1px solid #4a3a1c;border-radius:6px;cursor:pointer;margin-left:8px;font-size:11px;}
  .mn-result-row{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;margin:3px 0;background:rgba(30,22,10,0.5);}
  .mn-result-row .mn-gems{font-family:'Share Tech Mono',monospace;font-weight:700;}
  .mn-winner-wrap{text-align:center;padding:28px 16px;}
  .mn-glow-pill{display:inline-block;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:3px;
    color:var(--glow2);border:1px solid rgba(25,195,125,0.4);background:rgba(25,195,125,0.08);padding:5px 14px;border-radius:20px;}
  @media(prefers-reduced-motion:reduce){.mn-theme-escape,.mn-rad::before,.mn-card.event.alert{animation:none!important;}}
  </style>`;
}

function _shell(content, ep, themeClass, stateKey) {
  const radWord = themeClass === 'mn-theme-escape' ? 'CRITICAL' : themeClass === 'mn-theme-tunnels' ? 'ELEVATED' : 'RISING';
  return `<div class="rp-page" style="padding:0;background:#05060a;">
    ${_css()}
    <div class="mn-shell ${themeClass || ''}">
      <div class="mn-inner">
        <div class="mn-hazbar"><span class="mn-rad"></span><span>RADIATION ${radWord}</span><span style="flex:1;text-align:center;">⚠ ABANDONED MINE — DO NOT ENTER ⚠</span><span>GEIGER ACTIVE</span></div>
        ${content}
      </div>
    </div>
  </div>`;
}

export function rpBuildMineTitleCard(ep) {
  const md = ep.mineData;
  if (!md) return '';
  const total = md.leaderboard.length;
  const content = `
    <div class="mn-title">
      <div class="mn-title-sub">⚠ EMERGENCY MINING DIRECTIVE ⚠</div>
      <div class="mn-title-big">MINE OVER MATTER</div>
      <div class="mn-title-sub">${total} CONTESTANTS · ${md.gemQuota} GEM QUOTA · ${md.isMerged ? 'INDIVIDUAL IMMUNITY' : 'TRIBE IMMUNITY'}</div>
      <div style="font-size:13px;color:#cbb98c;max-width:460px;margin:16px auto 0;line-height:1.6;">
        Descend into the radioactive mine, dig out your gems before the Geiger timer runs out, run the cart tunnels past the mutant gophers and giant scorpions — and pray your bag doesn't have a hole when you reach the surface.
      </div>
      <div style="margin-top:16px;font-size:13px;color:var(--glow2);font-weight:600;">"${md.hostOpener}"</div>
      <div style="margin-top:18px;font-family:'Share Tech Mono',monospace;font-size:11px;color:#7a6840;letter-spacing:2px;">DESCENT &amp; DIG → CART TUNNELS → THE ESCAPE</div>
    </div>`;
  return _shell(content, ep, 'mn-theme-descent', null);
}

// ── generic phase reveal screen ──
function _phaseScreen(ep, phaseIdx, screenSuffix) {
  const md = ep.mineData;
  if (!md) return '';
  const phase = md.phases[phaseIdx];
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = String(ep.num || 0) + '_mn' + screenSuffix;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const steps = phase.events.map(ev => {
    const cls = ev.type === 'scorpionRelease' || ev.type === 'spark' ? 'event' + (ev.bad ? ' alert' : '') :
                ev.bad ? 'bad' : (ev.badgeClass === 'green' || ev.badgeClass === 'gold') ? (ev.badgeClass === 'gold' ? 'gold' : 'good') : '';
    const isEvent = ev.type === 'scorpionRelease';
    const badge = ev.badge ? `<span class="mn-badge ${ev.badgeClass || 'amber'}">${ev.badge}</span>` : '';
    if (isEvent) {
      return { html: `<div class="mn-card event alert"><div class="mn-txt"><div style="font-size:16px;font-weight:700;letter-spacing:3px;color:var(--alert);margin-bottom:4px;">⚠ ${ev.badge} ⚠</div>${ev.text}</div></div>` };
    }
    const ports = ev.player ? `<div class="mn-portraits">${_portrait(ev.player)}${ev.target ? _portrait(ev.target) : ''}</div>` : '';
    return { html: `<div class="mn-card ${cls}">${ports}<div class="mn-txt">${badge ? badge + '<br>' : ''}${ev.text}</div></div>` };
  });

  let inner = `<div class="mn-phase-head">${phase.title}</div>`;
  inner += `<div class="mn-geiger"><span>SECTOR: <b>${phase.title.split(' ').slice(-1)[0]}</b></span><span>STEPS: <b id="mn-ctr-${stateKey}">${Math.max(0, state.idx + 1)}/${steps.length}</b></span><span>STATUS: <b>${phaseIdx === 2 ? 'EVACUATING' : 'ACTIVE'}</b></span></div>`;

  steps.forEach((step, i) => {
    const visible = i <= state.idx;
    inner += `<div id="mn-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">${step.html}</div>`;
  });

  inner += `<div id="mn-controls-${stateKey}" class="mn-controls"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button id="mn-btn-${stateKey}" class="mn-next" onclick="window.mineRevealNext('${stateKey}', ${steps.length})">NEXT ▶ (${state.idx + 2}/${steps.length})</button>
    <button class="mn-all" onclick="window.mineRevealAll('${stateKey}', ${steps.length})">Reveal All</button>
  </div>`;

  return _shell(inner, ep, phase.themeClass, stateKey);
}

export function rpBuildMinePhase1(ep) { return _phaseScreen(ep, 0, 'p1'); }
export function rpBuildMinePhase2(ep) { return _phaseScreen(ep, 1, 'p2'); }
export function rpBuildMinePhase3(ep) { return _phaseScreen(ep, 2, 'p3'); }

export function mineRevealNext(stateKey, totalSteps) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const nextIdx = state.idx + 1;
  if (nextIdx >= totalSteps) return;
  const el = document.getElementById(`mn-step-${stateKey}-${nextIdx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  state.idx = nextIdx;
  const ctr = document.getElementById(`mn-ctr-${stateKey}`);
  if (ctr) ctr.textContent = `${nextIdx + 1}/${totalSteps}`;
  if (nextIdx >= totalSteps - 1) {
    const controls = document.getElementById(`mn-controls-${stateKey}`);
    if (controls) controls.style.display = 'none';
  } else {
    const btn = document.getElementById(`mn-btn-${stateKey}`);
    if (btn) btn.textContent = `NEXT ▶ (${nextIdx + 2}/${totalSteps})`;
  }
}

export function mineRevealAll(stateKey, totalSteps) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`mn-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  _tvState[stateKey].idx = totalSteps - 1;
  const controls = document.getElementById(`mn-controls-${stateKey}`);
  if (controls) controls.style.display = 'none';
  const ctr = document.getElementById(`mn-ctr-${stateKey}`);
  if (ctr) ctr.textContent = `${totalSteps}/${totalSteps}`;
}

export function rpBuildMineResults(ep) {
  const md = ep.mineData;
  if (!md) return '';
  if (md.isMerged && md.immunityWinner) {
    const w = md.immunityWinner;
    const ws = pStats(w), wp = pronouns(w);
    const entry = md.leaderboard.find(e => e.name === w);
    let flavor;
    if (ws.endurance >= 8) flavor = `${w} outlasted the radiation, the gophers, and the climb. When the dust cleared, ${wp.sub} had the heaviest bag on the surface.`;
    else if (ws.physical >= 8) flavor = `${w} dug like a machine and never slowed. The mine couldn't keep up.`;
    else if (ws.intuition >= 7) flavor = `${w} guarded that bag like it was gold — because it was. Not a single gem leaked. Smart to the end.`;
    else flavor = `${w} kept a cool head in the dark and brought every gem to the surface. Immunity, earned.`;
    const content = `
      <div class="mn-winner-wrap">
        <div class="mn-glow-pill">SURFACE REACHED — BAG VERIFIED</div>
        <div style="margin:16px 0 6px;display:inline-block;position:relative;">${_portrait(w, 96)}<div style="position:absolute;bottom:-4px;right:-4px;background:var(--glow);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:16px;">🛡️</div></div>
        <div style="font-size:24px;font-weight:700;letter-spacing:2px;color:#f0a830;">${w}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--glow2);margin-top:4px;">${_gemIcon()} ${entry?.gemsOut} GEMS · OUT #${entry?.escapeRank} · SCORE ${entry?.score.toFixed(1)}</div>
        <div style="font-size:13.5px;color:#cbb98c;max-width:420px;margin:16px auto 0;line-height:1.6;">${flavor}</div>
      </div>`;
    return _shell(content, ep, 'mn-theme-tunnels', null);
  }
  // pre-merge tribe results
  if (md.tribeScores) {
    const sorted = Object.entries(md.tribeScores).sort(([, a], [, b]) => b - a);
    let rows = '';
    sorted.forEach(([name, score], i) => {
      const isWin = i === 0, isLose = i === sorted.length - 1;
      const color = isWin ? 'var(--glow)' : isLose ? 'var(--alert)' : 'var(--amber)';
      const label = isWin ? 'IMMUNE — RICHEST HAUL' : isLose ? 'TO TRIBAL' : 'SAFE';
      const tribe = gs.tribes?.find(t => t.name === name);
      const ports = (tribe?.members || []).slice(0, 8).map(m => _portrait(m, 34)).join('');
      rows += `<div style="padding:13px;margin:9px 0;border:2px solid ${color};border-radius:8px;background:rgba(20,14,7,0.6);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-size:16px;font-weight:700;color:#f0a830;">${name}</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:11px;font-weight:700;color:${color};letter-spacing:1px;">${label}</div>
        </div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:#bda77a;margin-bottom:8px;">Avg haul score: ${score.toFixed(1)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${ports}</div>
      </div>`;
    });
    const content = `<div style="padding:18px;"><div class="mn-phase-head">GEM TALLY — TRIBE RESULTS</div>
      <div style="text-align:center;font-size:13px;color:#cbb98c;margin-bottom:12px;">The tribe that hauled the most gems to the surface takes immunity. The lightest bag goes to tribal council.</div>${rows}</div>`;
    return _shell(content, ep, 'mn-theme-tunnels', null);
  }
  return '';
}

export function rpBuildMineLeaderboard(ep) {
  const md = ep.mineData;
  if (!md) return '';
  let rows = '';
  const tribes = ep.tribesAtStart || gs.tribes || [];
  md.leaderboard.forEach((e, i) => {
    const isWinner = md.isMerged && e.name === md.immunityWinner;
    const tribe = tribes.find(t => t.members?.includes(e.name));
    const dot = tribe ? `<span style="width:8px;height:8px;border-radius:50%;background:var(--tribe-${tribe.name?.toLowerCase()?.replace(/\s+/g, '-')},#666);flex-shrink:0;"></span>` : '';
    const bagFlag = e.bagHole ? `<span class="mn-badge red" style="margin:0;">LEAKED</span>` : '';
    const gemColor = e.gemsOut >= 8 ? 'var(--glow2)' : e.gemsOut >= 4 ? 'var(--amber)' : '#a07840';
    rows += `<div class="mn-result-row" style="${isWinner ? 'background:rgba(25,195,125,0.12);' : ''}">
      <span style="font-size:11px;color:#7a6840;width:20px;text-align:right;">${i + 1}.</span>${dot}${_portrait(e.name, 34)}
      <span style="flex:1;font-size:13px;color:#e8ddc8;font-weight:${isWinner ? '700' : '400'};">${e.name} ${isWinner ? '🛡️' : ''} ${bagFlag}</span>
      <span style="font-size:11px;color:#8a7450;width:54px;text-align:center;font-family:'Share Tech Mono',monospace;">OUT #${e.escapeRank}</span>
      <span class="mn-gems" style="color:${gemColor};width:56px;text-align:right;">${_gemIcon(11)} ${e.gemsOut}</span>
      <span style="font-size:12px;font-weight:700;color:#f0c060;width:46px;text-align:right;">${e.score.toFixed(1)}</span>
    </div>`;
  });
  let tribeSection = '';
  if (md.tribeScores) {
    tribeSection = `<div style="margin-top:14px;text-align:center;font-family:'Share Tech Mono',monospace;font-size:12px;color:#bda77a;letter-spacing:2px;">TRIBE AVERAGES</div>`;
    Object.entries(md.tribeScores).sort(([, a], [, b]) => b - a).forEach(([name, s], i) => {
      tribeSection += `<div style="text-align:center;font-size:13px;color:${i === 0 ? 'var(--glow2)' : 'var(--alert)'};margin:3px 0;">${i === 0 ? '🏆' : '⛏️'} ${name}: ${s.toFixed(1)} avg</div>`;
    });
  }
  const leaked = md.leaderboard.filter(e => e.bagHole).length;
  const content = `<div style="padding:16px;">
    <div class="mn-phase-head">GEM HAUL REPORT</div>
    <div style="text-align:center;font-family:'Share Tech Mono',monospace;font-size:11px;color:#8a7450;letter-spacing:1px;margin-bottom:12px;">${md.leaderboard.length} SURFACED · ${leaked} BAG${leaked === 1 ? '' : 'S'} LEAKED · QUOTA ${md.gemQuota}</div>
    ${rows}
    ${tribeSection}
    ${md.threwChallenge ? `<div style="text-align:center;margin-top:12px;font-size:12px;color:#ffd24a;">🤝 ${md.threwChallenge.player} threw it for ${md.threwChallenge.friend} (${md.threwChallenge.gems} gems gifted)</div>` : ''}
    <div style="text-align:center;margin-top:16px;font-size:11px;color:#6a5836;font-style:italic;">"${md.hostCloser}"</div>
  </div>`;
  return _shell(content, ep, 'mn-theme-tunnels', null);
}
