// js/chal/merry-go-round-up.js — "Merry-Go-Round-Up" spinning-carousel endurance challenge (both-phase)
// DC "Carnival of Chaos". Contestants mount painted carnival animals on a big-top carousel and hold on as
// it spins faster and faster. Two things drain you: GRIP (physical + your animal's grip + endurance) and
// STOMACH (temperament + intuition — the inner-ear that decides whether spinning wrecks you). A tough
// challenge-beast with a weak stomach loses to a calm floater. The host escalates with sudden stops
// (collisions knock neighbours off too), direction reverses (concentration strain), and pure speed. Fall
// off your animal and you're flung into the mud. Pre-merge: last team with anyone still riding wins.
// Post-merge: last soul on the ride wins immunity.
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
const VILLAINY = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function canScheme(name) {
  const a = arch(name);
  if (VILLAINY.includes(a)) return true;
  if (NICE.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function tribeOf(n) { const t = gs.tribes?.find(t => t.members.includes(n)); return t ? (t.tribeName || t.name) : null; }
function allyOf(name, alive) {
  const al = (gs.namedAlliances || []).find(a => a.active && a.members.includes(name) && a.members.some(m => m !== name && alive.includes(m)));
  if (al) {
    const m = al.members.filter(x => x !== name && alive.includes(x)).sort((a, b) => getBond(name, b) - getBond(name, a));
    if (m.length) return m[0];
  }
  const friends = alive.filter(m => m !== name && getBond(name, m) >= 3).sort((a, b) => getBond(name, b) - getBond(name, a));
  return friends[0] || null;
}
function rivalOf(name, alive) {
  const foes = alive.filter(m => m !== name && getBond(name, m) <= -1).sort((a, b) => getBond(name, a) - getBond(name, b));
  return foes[0] || null;
}
function recentBoots(k = 2) { const e = gs.eliminated || []; return e.slice(-k).reverse(); }

// ══════════════════════════════════════════════════════════════
// CARNIVAL MOUNTS — grip rating drives how long you stay on
// ══════════════════════════════════════════════════════════════
// Each mount has a BASE grip AND a stat FIT: it helps a rider whose strength matches and HURTS one whose
// doesn't. bear calms a high-temperament rider but lulls a nervy one to sleep; the elephant suits a
// powerhouse but is too much animal for a small rider; the giraffe rewards stamina but its dizzy height
// rattles a scattered mind. mountEffect() turns the rider's stats into grip/stomach swings, so the DRAFT
// is a real decision: pick the animal that fits YOUR strength, or blunder onto one that fights you.
// fit: { stat, gPer, sPer }  bonus = (stat-5)*per  (positive stat → help, low stat → hurt)
// sec: optional second stat with its own gPer/sPer (often an ANTI-fit, e.g. ostrich punishing physical)
const ANIMALS = [
  { kind:'bear',     emoji:'🐻', grip:2.3, flash:1, fit:{stat:'temperament', gPer:0.30, sPer:0.40},
    good:'the cozy saddle settles a calm rider', bad:'but a jittery rider gets lulled sleepy and slides off' },
  { kind:'elephant', emoji:'🐘', grip:2.7, flash:2, fit:{stat:'physical', gPer:0.55},
    good:'a powerhouse wraps the huge frame like nothing', bad:'but a slight rider has far too much animal to hold' },
  { kind:'giraffe',  emoji:'🦒', grip:2.1, flash:1, fit:{stat:'endurance', gPer:0.45}, sec:{stat:'mental', sPer:0.22},
    good:'a workhorse clings to the long neck for days', bad:'but the dizzy height scrambles a scattered mind' },
  { kind:'tiger',    emoji:'🐯', grip:1.8, flash:3, fit:{stat:'boldness', gPer:0.38, sPer:0.15},
    good:'a daredevil rides the fierce cat gleefully', bad:'but a timid rider panics and loses the seat' },
  { kind:'owl',      emoji:'🦉', grip:1.6, flash:2, fit:{stat:'intuition', sPer:0.50},
    good:'a sharp head reads the spin and never loses up from down', bad:'but poor balance turns the swivel-seat into torture' },
  { kind:'fox',      emoji:'🦊', grip:1.7, flash:2, fit:{stat:'mental', gPer:0.26, sPer:0.24},
    good:'a clever rider times every lean', bad:'but a slow read mistimes the turns and slips' },
  { kind:'horse',    emoji:'🐴', grip:2.0, flash:2, fit:{stat:'endurance', gPer:0.14, sPer:0.10},
    good:'the dependable classic — no surprises, no excuses', bad:'the dependable classic — no surprises, no excuses' },
  { kind:'ostrich',  emoji:'🪶', grip:1.1, flash:1, fit:{stat:'intuition', gPer:0.28}, sec:{stat:'physical', gPer:-0.32},
    good:'the twitchy bird suits a light, nimble rider', bad:'but it is far too flimsy to hold a powerhouse' },
  { kind:'swan',     emoji:'🦢', grip:1.4, flash:2, fit:{stat:'temperament', sPer:0.30}, sec:{stat:'physical', gPer:-0.28},
    good:'poise keeps a graceful rider perfectly seated', bad:'but the slick neck slides a heavy rider right off' },
  { kind:'dragon',   emoji:'🐉', grip:1.9, flash:3, fit:{stat:'boldness', gPer:0.34}, sec:{stat:'temperament', sPer:0.24},
    good:'a fearless rider tames the beast', bad:'but the fearsome mount shreds weak nerves' },
  { kind:'tortoise', emoji:'🐢', grip:2.9, flash:1, fit:{stat:'endurance', gPer:0.36}, sec:{stat:'boldness', sPer:-0.18},
    good:'rock-steady shell for a patient grinder', bad:'but a thrill-seeker fidgets, drifts, and turns green' },
  { kind:'peacock',  emoji:'🦚', grip:1.3, flash:3, fit:{stat:'social', sPer:0.42},
    good:'the crowd\'s roar buoys a showman', bad:'but stage fright churns a shy rider\'s stomach' },
];
// grip/stomach swing this mount gives THIS rider (positive = help, negative = hurt)
function mountEffect(a, s) {
  let g = 0, st = 0;
  if (a.fit) { const d = (s[a.fit.stat] ?? 5) - 5; g += d * (a.fit.gPer || 0); st += d * (a.fit.sPer || 0); }
  if (a.sec) { const d = (s[a.sec.stat] ?? 5) - 5; g += d * (a.sec.gPer || 0); st += d * (a.sec.sPer || 0); }
  return { g, st, net: g + st };
}
function mountPool(size) {
  // 12 unique mounts first (draft scarcity); repeats only once the field is bigger than the roster
  const pool = [];
  let i = 0;
  while (pool.length < size) { pool.push({ ...ANIMALS[i % ANIMALS.length] }); i++; }
  return pool;
}
// short reason a mount fits (or fights) a rider, for narration
function fitReason(a, s, positive) { return positive ? a.good : a.bad; }

// ── CONSEQUENCE HELPERS (scope-gated heat, like the other Carnival challenges) ──
function _epScope() { return (gs.episode || 0) + 2; }
function _spinHeat(name, amount) {
  if (!gs._spinHeat) gs._spinHeat = {};
  const prev = gs._spinHeat[name]?.amount || 0;
  gs._spinHeat[name] = { amount: Math.max(prev, amount), expiresEp: _epScope() };
}
function _spinBetrayHeat(victim, target, amount) {
  if (!gs._spinBetrayHeat) gs._spinBetrayHeat = {};
  gs._spinBetrayHeat[victim] = { target, amount, expiresEp: _epScope() };
}
// The advantage types a sighting can expose (matches the leak mapping in twists.js).
const SPOTTABLE_ADV = ['idol', 'legacy', 'amulet', 'secondLife', 'teamSwap', 'voteBlock', 'voteSteal', 'safetyNoPower', 'soleVote'];
function _heldSpottableAdv(name) {
  return (gs.advantages || []).find(a => (a.holder === name || a.owner === name) && !a.used && SPOTTABLE_ADV.includes(a.type));
}
// Turn a dropped-advantage sighting into REAL intel: the holder joins the cast's known-holder set for
// that advantage type — so it raises heat (a known idol holder gets +2.0 in computeHeat) and flows into
// voting / idol-steal targeting, and persists for idols. Returns the spotted type, or null.
function _spotAdvantage(holder) {
  const adv = _heldSpottableAdv(holder);
  if (!adv) return null;
  const addTo = (k) => { if (!gs[k]) gs[k] = new Set(); gs[k].add(holder); };
  if (adv.type === 'teamSwap') addTo('knownTeamSwapHolders');
  else if (adv.type === 'voteBlock') addTo('knownVoteBlockHolders');
  else if (adv.type === 'voteSteal') addTo('knownVoteStealHolders');
  else if (adv.type === 'safetyNoPower') addTo('knownSafetyNoPowerHolders');
  else if (adv.type === 'soleVote') addTo('knownSoleVoteHolders');
  else if (adv.type === 'amulet') addTo('knownAmuletHoldersThisEp');
  else { addTo('knownIdolHoldersThisEp'); addTo('knownIdolHoldersPersistent'); }
  return adv.type;
}

// ══════════════════════════════════════════════════════════════
// NARRATION POOLS
// ══════════════════════════════════════════════════════════════
const HOST_OPEN = [
  (h) => `${h} throws an arm toward a gleaming big-top carousel, calliope music wheezing to life. "Climb on, grab an animal, and hold tight. This thing spins faster and faster. Fall off your critter and you're out. Last team still riding wins immunity."`,
  (h) => `${h} sweeps a hand at the ride as string lights flicker overhead. "Behold — the Demon's Merry-Go-Round. Pick a mount, hang on, and pray. I speed it up, you fall off, simple as that. Survive everyone else and you win."`,
  (h) => `${h} pats a chipped painted horse. "Everybody loves a carousel, right? Wrong. This one goes to eleven. When you slip off your animal, into the mud you go. Last one spinning takes immunity."`,
  (h) => `A grinning ${h} spins a lever. "Welcome to the ride that's eaten grown adults. Choose your beast, lock your grip, and hold your lunch. I control the speed. You control nothing. Last one on wins."`,
];
const DRAFT_INTRO_PRE = [
  () => `The teams draft their mounts one at a time, trading picks back and forth — pick the animal that fits your strengths, or watch a rival snatch it first.`,
  () => `Alternating picks: one rider per team, turn by turn. Every choice is a bet on your own body — grab the mount that suits you before the other side does.`,
  () => `They'll choose in turns, one from each team at a time. The smart ones know their own strengths. The rest are about to learn.`,
];
// a rider who KNOWS their strength and picks a mount that FITS it (good outcome)
const DRAFT_SMART = [
  (n, a, why) => `${n} studies the lineup and locks in the ${a.emoji} ${a.kind} — ${why}. A shrewd read of ${pronouns(n).posAdj} own strengths.`,
  (n, a, why) => `${n} knows exactly what ${pronouns(n).sub === 'they' ? 'they need' : pronouns(n).sub + ' needs'} and takes the ${a.emoji} ${a.kind}: ${why}. Smart pick.`,
  (n, a, why) => `${n} passes over the flashy mounts for the ${a.emoji} ${a.kind} — ${why}. Playing to type.`,
];
// a decent-but-unremarkable pick
const DRAFT_OK = [
  (n, a, why) => `${n} climbs onto the ${a.emoji} ${a.kind}. ${why[0].toUpperCase() + why.slice(1)} — a workable draw.`,
  (n, a, why) => `${n} settles for the ${a.emoji} ${a.kind}. Not a disaster: ${why}.`,
];
// a rider who picks WRONG for their body — flashy or careless, and it'll cost them (bad outcome)
const DRAFT_BLUNDER = [
  (n, a, why) => `${n} grabs the ${a.emoji} ${a.kind} for the look of it — bad idea. ${why[0].toUpperCase() + why.slice(1)}. A pick ${pronouns(n).sub === 'they' ? 'they' : pronouns(n).sub}'ll regret.`,
  (n, a, why) => `${n} doesn't think it through and takes the ${a.emoji} ${a.kind}. ${why[0].toUpperCase() + why.slice(1)}. Wrong animal, wrong rider.`,
  (n, a, why) => `${n} swings a leg over the ${a.emoji} ${a.kind} without reading the fine print — ${why}. That's going to sting.`,
];
const LEVEL_BANNER = {
  1: ['The calliope starts up and the carousel eases into a lazy first turn.', 'A gentle warm-up spin — almost pleasant, if you ignore the mud pit below.', 'The wheel creaks into motion, slow and smooth. Everyone breathes easy. For now.'],
  2: ['The host cranks it up a notch. The world starts to blur at the edges.', 'Faster now — the painted animals whip past and stomachs begin to protest.', 'The carousel picks up real speed. Knuckles go white across the board.'],
  3: ['TOP SPEED. The whole rig howls and the horizon smears into a single streak.', 'The host slams it to maximum. The carousel becomes a centrifuge.', 'Full blur. The animals are a screaming carousel comet and everyone is just cargo now.'],
  4: ['Overtime. The host refuses to let it end and finds another gear that shouldn\'t exist.', 'Still riders left? The wheel spins harder, past reason.', 'The host wrenches the speed even higher out of pure spite.'],
};
const SPIN_FLAVOR = [
  (n) => `${n} leans into the turn, hair flat against the wind.`,
  (n) => `${n} locks both elbows and rides it out, jaw set.`,
  (n) => `${n} whoops on the way past the cameras — still having fun.`,
  (n) => `${n} closes ${pronouns(n).posAdj} eyes and focuses on not looking down.`,
  (n) => `${n} adjusts ${pronouns(n).posAdj} grip on the pole, riding low and tight.`,
  (n) => `The wind pins ${n} back against the animal's neck.`,
];
const QUEASY_FORFEIT = [
  (n) => `${n} can take a paintball to the face and eat bugs for breakfast — but spinning is a different beast. Two turns in, ${pronouns(n).sub === 'they' ? 'they go' : pronouns(n).sub + ' goes'} green, throws up a hand, and climbs off before anyone even wobbles. Stomach, not strength, beaten.`,
  (n) => `${n} makes it about thirty seconds before the color drains out entirely. "I'm done, I'm done—" and ${pronouns(n).sub === 'they' ? 'they bail' : pronouns(n).sub + ' bails'} voluntarily, hand over mouth, to the mud below.`,
  (n) => `The gentlest spin in the world and ${n}'s inner ear taps out. ${pronouns(n).Sub === 'They' ? 'They dismount' : pronouns(n).Sub + ' dismounts'} early rather than lose ${pronouns(n).posAdj} breakfast on live camera. A tough player felled by a kiddie ride.`,
];
const GRIP_SLIP = [
  (n, a) => `${n}'s hands finally give — the ${a} is too slick and centrifugal force wins. ${pronouns(n).Sub === 'They' ? 'They peel' : pronouns(n).Sub + ' peels'} off and sail into the mud.`,
  (n, a) => `${n} fights the pull as long as ${pronouns(n).sub === 'they' ? 'they' : pronouns(n).sub} can, but the grip's gone. Off the ${a} and gone.`,
  (n, a) => `One hand, then the other — ${n} loses the ${a} and gets flung wide, arms windmilling.`,
  (n, a) => `${n}'s fingers slide off the pole. The ${a} bucks ${pronouns(n).obj} loose and the mud rushes up.`,
];
const DIZZY_FALL = [
  (n) => `${n}'s head can't follow anymore — the world tilts sideways and ${pronouns(n).sub === 'they' ? 'they slide' : pronouns(n).sub + ' slides'} straight off, dizzy and done.`,
  (n) => `${n} goes cross-eyed, loses which way is up, and topples off the animal into the muck.`,
  (n) => `The spinning finally scrambles ${n} — no grip problem, just a brain that quit. Off ${pronouns(n).sub === 'they' ? 'they' : pronouns(n).sub} go.`,
  (n) => `${n} turns a delicate shade of green, wobbles, and lets go rather than be sick. Splat.`,
];
const REVERSE_TEXT = [
  () => `The host throws the carousel into REVERSE. The whole world lurches the other way and every rider's stomach files a formal complaint.`,
  () => `Without warning the wheel screams to a halt and spins BACKWARDS. Concentration shatters across the board.`,
  () => `Direction flip. The animals reverse mid-gallop and everyone's inner ear revolts at once.`,
];
const SUDDEN_STOP = [
  () => `The host stomps the brake. The carousel DEAD STOPS and momentum does the rest.`,
  () => `No warning — a full emergency stop. Bodies keep going even when the ride doesn't.`,
  () => `The wheel slams to a halt. Physics collects its debt immediately.`,
];
const COLLISION = [
  (a, b) => `${a} pitches forward off the mount and crashes straight into ${b} — and takes ${pronouns(b).obj} down too. Two for one, both into the mud.`,
  (a, b) => `${a} can't hold the sudden stop, flies sideways, and bowls ${b} clean off ${pronouns(b).posAdj} animal. A double elimination.`,
  (a, b) => `${a} slams into ${b} on the way off. They hit the mud in a tangled heap, both out.`,
];
const SAVE_OK = [
  (r, v) => `${v} slips — and ${r} lunges across the gap, catches a fistful of ${pronouns(v).posAdj} shirt, and HAULS ${pronouns(v).obj} back onto the animal. Burned real grip to do it.`,
  (r, v) => `${v} is halfway to the mud when ${r} grabs ${pronouns(v).obj} arm and drags ${pronouns(v).obj} back up. A genuine save at top speed.`,
  (r, v) => `${r} sees ${v} going and doesn't think — just clamps a hand on ${pronouns(v).obj} and yanks ${pronouns(v).obj} back into the saddle. The crowd roars.`,
];
const SAVE_FAIL = [
  (r, v) => `${r} reaches for the falling ${v} — fingertips, nothing more. ${v} goes into the mud anyway, but ${pronouns(v).sub === 'they' ? 'they know' : pronouns(v).sub + ' knows'} ${r} tried.`,
  (r, v) => `${r} grabs for ${v} and misses by an inch. ${v} is gone, but the effort counts.`,
];
const SIDE_BET = [
  (a, b) => `Mid-spin, ${a} shouts a wager at ${b}: whoever falls first sleeps outside the shelter tonight. ${b} takes it. Now it's personal.`,
  (a, b) => `${a} bets ${b} a night in the good bunk that ${pronouns(a).sub} can outlast ${pronouns(b).obj}. Pride's on the ride now.`,
  (a, b) => `"Loser does dishes for a week," ${a} yells at ${b} over the calliope. ${b} grins and shakes on it, one-handed.`,
];
const BET_RESULT = [
  (w, l) => `The bet's settled: ${l} hit the mud before ${w}, so ${l}'s the one sleeping outside the shelter tonight. ${w} is insufferable about it.`,
  (w, l) => `${l} fell first — bet lost. ${w} collects, grinning. ${l} groans, already dreading the cold bunk.`,
  (w, l) => `${w} outlasted ${l}, so the wager goes ${w}'s way. ${l} owes up, muttering the whole walk to the mud.`,
];
const OVERHEARD = [
  (a, b, tgt) => `${a} leans toward ${b} on the next animal over and floats a plan: blindside ${tgt} at the next vote. What ${a} forgets is that ${tgt} is riding within earshot — and hears every word.`,
  (a, b, tgt) => `Two mounts apart, ${a} whispers to ${b} about cutting ${tgt} loose. The carousel carries the words right past ${tgt}, who says nothing and files it away.`,
  (a, b, tgt) => `${a} uses the noise as cover to pitch ${b} on flipping the vote onto ${tgt}. Bad cover — ${tgt} catches enough to know exactly what's coming.`,
];
const SEAT_HOP_YES = [
  (a, b) => `${a} risks a seat-hop mid-ride, scrambling one animal closer to ${b}: "Smart move is working with me." ${b} nods along — something clicks. They've got the start of a number.`,
  (a, b) => `${a} clambers over to ${b}'s mount and plays the teammate card hard. ${b} bites: "...Okay. Talk after this." A quiet deal, struck at speed.`,
  (a, b) => `${a} pitches ${b} on joining forces over the calliope's wail. ${b} likes what ${pronouns(b).sub} hears and shakes on it, one-handed. A new alliance, born mid-spin.`,
];
const SEAT_HOP_NO = [
  (a, b) => `${a} seat-hops over to lobby ${b} — "we should work together" — but ${b} isn't buying it and inches away. Cold shoulder at forty RPM.`,
  (a, b) => `${a} clambers across to pitch ${b} and gets a flat "no thanks." The play flops, and now ${b} is watching ${a} a little closer.`,
  (a, b) => `${a} makes the teammate pitch; ${b} just raises an eyebrow and holds tight. Rebuffed — and slightly annoyed at the attempt.`,
];
const DROPPED_ADV = [
  (a, w) => `Something slips out of ${a}'s pocket mid-spin — and ${w} clocks it. An advantage, plain as day, tumbling into the mud. ${w} banks the sighting for later.`,
  (a, w) => `${w} spots ${a} frantically pocketing something that fell loose during a hard turn. Whatever it was, ${w} now knows ${a} has it.`,
];
const NEAR_MISS = [
  (n) => `${n} loses a hand, dangles by one arm for a horrifying second — and claws back on. Too close.`,
  (n) => `${n} nearly goes on the reverse, saves it with a knee hooked over the animal's neck.`,
  (n) => `${n} slips, catches the pole with both legs, and hauls back upright. The crowd gasps.`,
  (n) => `${n}'s whole body swings out sideways — held on by two fingers and pure spite — and reels back in.`,
  (n) => `${n} goes grey, gags once, swallows hard, and somehow keeps ${pronouns(n).posAdj} lunch and ${pronouns(n).posAdj} seat.`,
  (n) => `${n} bounces half out of the saddle on a jolt, lands wrong, and clamps down before gravity can finish the job.`,
];
const HOST_TAUNT = [
  (h) => `"Nobody falling? Rude," ${h} sighs, and reaches for the lever again.`,
  (h) => `${h} checks a watch. "We can do this all day. Faster it is."`,
  (h) => `"Getting comfy up there?" ${h} calls. "Let's fix that."`,
  (h) => `${h} cups a hand to ${h === (seasonConfig?.hostName||'Chris') ? 'his' : 'their'} mouth. "You're all having WAY too much fun. Time to earn it."`,
  (h) => `"I've seen kindergartners last longer," ${h} lies cheerfully, cranking the dial.`,
  (h) => `${h} pretends to yawn. "Boring. Let's see some mud."`,
];
// a still-riding player REACTS to someone wiping out — a rival gloats, an ally winces. Consequence: bond/pop.
const FALL_TAUNT = [
  (r, f) => `${r}, still spinning, watches ${f} hit the mud and can't help a laugh. "One down." ${f}, spitting mud, marks it.`,
  (r, f) => `${r} whoops as ${f} goes flying. "Bye!" It's the kind of thing that gets remembered at tribal.`,
  (r, f) => `"Called it," ${r} smirks as ${f} wipes out. Rubbing it in from atop a spinning ostrich is a choice.`,
];
const FALL_CARE = [
  (r, f) => `${r} cranes around to check on ${f} in the mud, nearly losing ${pronouns(r).posAdj} own seat to do it. "You good?!" ${f} gives a muddy thumbs-up.`,
  (r, f) => `${r} winces as ${f} falls — a friend gone. "Ah, no—" ${pronouns(r).Sub === 'They' ? 'They ride' : pronouns(r).Sub + ' rides'} on with one fewer ally up there.`,
  (r, f) => `${r} shouts an apology down to ${f} for not being able to catch ${pronouns(f).obj}. The bond holds even from the mud.`,
];
const WIN_INDIV = [
  (n) => `The last animals stop spinning and only ${n} is still on — swaying, green, triumphant. Immunity, and a very long walk to solid ground.`,
  (n) => `${n} outlasts the entire field, peels one hand off the pole, and gives a dizzy thumbs-up. Individual immunity.`,
  (n) => `Everyone else is in the mud. ${n} rode the Demon's Merry-Go-Round to the bitter end and wins immunity.`,
];
const WIN_TEAM = [
  (t, a, b) => `The last rival rider hits the mud and ${t} erupts — they've still got someone spinning. ${a}${b ? ` and ${b}` : ''} dizzily dismount to a mobbing. ${t} wins immunity.`,
  (t, a, b) => `${t}'s ${a}${b ? ` and ${b}` : ''} outlast the other side and clinch it. Immunity to ${t}.`,
];

// ══════════════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════════════
export function simulateMerryGoRoundUp(ep) {
  const active = [...gs.activePlayers].filter(p => p !== ep.exileDuelPlayer);
  const isMerged = gs.isMerged;
  const campKey = isMerged ? (gs.mergeName || 'merge') : null;
  const usedTxt = new Set();
  const _p = (arrOrFn) => arrOrFn; // marker

  const hostOpener = pick(HOST_OPEN)(host());

  // ── per-player state ──
  const st = {};
  active.forEach((n, i) => {
    const s = pStats(n);
    st[n] = {
      idx: i, animal: null, up: true, fallStep: null, fallReason: null,
      grip: 0, stomach: 0, score: 0, seatIQ: s.strategic * 0.5 + s.intuition * 0.4 + s.boldness * 0.1 + noise(2),
    };
  });

  // ══ SEAT DRAFT — one rider per team per turn (pre-merge), alternating; each pick's QUALITY depends on
  //    the rider's mental+strategic (do they read their own body right?). A sharp mind grabs the mount that
  //    FITS their strengths; a dim one blunders onto a flashy mismatch that will fight them all ride. ══
  const draftEvents = [];
  const pool = mountPool(active.length);
  // pick QUALITY: high mental/strategic → picks the best-fit remaining; low → flashy or worst-fit blunder
  const doPick = (n) => {
    const s = pStats(n);
    const a = arch(n);
    const skill = s.mental * 0.5 + s.strategic * 0.5 + noise(3);
    // flashy-mount chasers ignore fit entirely and grab the showiest thing — often a bad match
    const flashLean = (a === 'hothead' || a === 'wildcard' || a === 'chaos-agent') && Math.random() < 0.6;
    const ranked = [...pool].map(m => ({ m, net: mountEffect(m, s).net })).sort((x, y) => y.net - x.net);
    const L = ranked.length;
    let mount;
    if (flashLean) mount = [...pool].sort((x, y) => y.flash - x.flash)[0];               // chase flash, fit be damned
    else if (skill >= 6.5) mount = ranked[0].m;                                            // sharp read: best fit
    else if (skill >= 4 && Math.random() > 0.22) mount = ranked[Math.floor(Math.random() * Math.max(1, Math.ceil(L * 0.45)))].m; // decent: upper half
    else mount = ranked[Math.min(L - 1, Math.floor(L / 2 + Math.random() * (L / 2 + 0.5)))].m; // poor read / misjudge: lower half → real mismatches
    const pi = pool.indexOf(mount); if (pi >= 0) pool.splice(pi, 1);
    st[n].animal = mount;
    // NARRATION reflects the actual OUTCOME: a good fit reads as a shrewd pick, a bad one as a blunder
    const net = mountEffect(mount, s).net;
    const positive = net >= 0;
    const why = fitReason(mount, s, positive);
    const quality = net >= 0.5 ? 'smart' : net <= -0.5 ? 'blunder' : 'ok';
    let txt, bc;
    if (quality === 'smart') { txt = pick(DRAFT_SMART)(n, mount, why); bc = 'green'; }
    else if (quality === 'blunder') { txt = pick(DRAFT_BLUNDER)(n, mount, why); bc = 'red'; }
    else { txt = pick(DRAFT_OK)(n, mount, why); bc = positive ? 'blue' : 'amber'; }
    const fitBadge = net >= 0.5 ? 'GOOD FIT' : net <= -0.5 ? 'BAD FIT' : 'EVEN';
    draftEvents.push({ type: 'draft', player: n, animal: mount.kind,
      text: txt, badge: `${mount.emoji} ${mount.kind.toUpperCase()} · ${fitBadge}`, badgeClass: bc });
  };

  if (!isMerged && gs.tribes?.length >= 2) {
    // ALTERNATING team draft: blue → red → blue → red ...  (each team's sharpest minds pick earliest)
    draftEvents.push({ type: 'draftIntro', text: pick(DRAFT_INTRO_PRE)(), badge: '🎠 TEAM DRAFT', badgeClass: 'amber' });
    const queues = gs.tribes.map(t => t.members.filter(m => active.includes(m)).sort((a, b) => st[b].seatIQ - st[a].seatIQ));
    let ti = 0, guard = 0;
    while (queues.some(q => q.length) && guard++ < active.length + 5) {
      const q = queues[ti % queues.length];
      if (q.length) doPick(q.shift());
      ti++;
    }
  } else {
    // post-merge: individual draft, sharpest minds pick first
    [...active].sort((a, b) => st[b].seatIQ - st[a].seatIQ).forEach(doPick);
  }

  // ── starting meters (grip vs stomach) — the ANIMAL FIT swings both, so the draft choice matters ──
  active.forEach(n => {
    const s = pStats(n);
    const eff = mountEffect(st[n].animal, s); // grip/stomach bonus from how well the mount fits this rider
    st[n].fitNet = eff.net;
    // GRIP and STOMACH deplete at comparable rates so BOTH act as the limiting factor across the field
    // (grip a touch faster so slips — the catchable falls — happen mid-ride, not only at the finish).
    // low flat base + strong stat weighting → a WIDE spread of capacity, so weak riders gas out early
    // (Levels 1-2) and strong ones grind to the end (Level 3), rather than everyone crossing zero at once.
    st[n].grip = 3.5 + s.physical * 1.15 + s.endurance * 0.7 + st[n].animal.grip * 1.6 + s.boldness * 0.15 + eff.g * 1.8 + noise(2.6);
    st[n].stomach = 3.5 + s.temperament * 1.25 + s.intuition * 0.7 + s.endurance * 0.4 + eff.st * 1.8 + noise(2.6);
    st[n].grip0 = st[n].grip; st[n].stomach0 = st[n].stomach;
  });

  // ── build phases (VP screens) ──
  const phaseDraft = { key: 'draft', title: 'THE SEAT DRAFT', level: 0, events: draftEvents };
  const phase1 = { key: 'l1', title: 'LEVEL 1 · THE WARM-UP', level: 1, events: [] };
  const phase2 = { key: 'l2', title: 'LEVEL 2 · THE PUSH', level: 2, events: [] };
  const phase3 = { key: 'l3', title: 'LEVEL 3 · THE BLUR', level: 3, events: [] };
  const levelPhases = { 1: phase1, 2: phase2, 3: phase3, 4: phase3 }; // OT folds into phase3 screen

  const fallOrder = []; // names in order they fell (first out first)
  let stepCounter = 0;
  const snapMeters = () => {
    const m = {};
    active.forEach(n => { m[n] = { grip: Math.max(0, +st[n].grip.toFixed(1)), stomach: Math.max(0, +st[n].stomach.toFixed(1)), grip0: st[n].grip0, stomach0: st[n].stomach0, up: st[n].up, animal: st[n].animal.kind }; });
    return m;
  };
  const initMeters = snapMeters(); // everyone up, full meters — the pre-ride state
  const upNames = () => active.filter(n => st[n].up);
  const teamsAlive = () => {
    const set = new Set();
    upNames().forEach(n => set.add(tribeOf(n)));
    return set;
  };
  // WIN DECIDED: post-merge = one rider left; pre-merge = only one team still has anyone riding.
  const winCond = () => isMerged ? upNames().length <= 1 : teamsAlive().size <= 1;
  const pushEv = (phase, ev) => {
    ev.step = stepCounter++;
    ev.snap = snapMeters();
    ev.dir = curDir; ev.spinLevel = curLevel;
    ev.upCount = upNames().length;
    phase.events.push(ev);
  };
  const fall = (phase, n, reason, badge) => {
    if (!st[n].up) return;
    st[n].up = false; st[n].fallStep = stepCounter; st[n].fallReason = reason;
    fallOrder.push(n);
    const a = st[n].animal.kind;
    const txt = reason === 'grip' ? pick(GRIP_SLIP)(n, a)
      : reason === 'dizzy' ? pick(DIZZY_FALL)(n)
      : reason === 'queasy' ? pick(QUEASY_FORFEIT)(n)
      : `${n} is knocked clean off and into the mud.`;
    pushEv(phase, { type: 'fall', player: n, reason, animal: a,
      text: txt, badge: badge || (reason === 'grip' ? '💥 SLIPPED OFF' : reason === 'dizzy' ? '💫 TOO DIZZY' : reason === 'queasy' ? '🤢 FORFEIT' : '💥 OUT'),
      badgeClass: 'grey', placeFromBottom: fallOrder.length });
  };

  let curLevel = 0, curDir = 1;

  // QUEASY FORFEIT — a tough player (good grip potential) with a genuinely weak stomach bails at Level 1
  const forfeiters = active.filter(n => {
    const s = pStats(n);
    const toughEnough = (s.physical + s.boldness) / 2 >= 5.5; // could physically hold on
    return toughEnough && st[n].stomach0 < 10.5 && st[n].stomach0 <= (active.reduce((a, m) => a + st[m].stomach0, 0) / active.length) - 1.5;
  }).sort((a, b) => st[a].stomach0 - st[b].stomach0).slice(0, active.length >= 8 ? 1 : 0);

  // ── ONE WAVE — a burst of speed that drains meters and knocks whoever crosses zero into the mud.
  //    Each level runs SEVERAL waves so the field thins STEADILY across the whole ride instead of
  //    everyone tumbling off in one Level-3 batch. Every wave carries its own beats (flavor / save /
  //    near-miss / falls / reactions) so the early levels aren't dead air. ──
  let savesThisGame = 0;
  const runWave = (phase, lvl, intensity, waveIdx) => {
    curLevel = lvl;
    if (winCond()) return;

    // a beat of spin flavor so the wave isn't silent (scales with the field, capped)
    const upNow = upNames();
    if (upNow.length > 1) {
      const flavCap = clamp(Math.ceil(upNow.length * 0.35), 1, 3);
      upNow.filter(() => Math.random() < 0.5).slice(0, flavCap)
        .forEach(n => pushEv(phase, { type: 'flavor', player: n, text: pickUniq(SPIN_FLAVOR, usedTxt)(n) }));
    }

    // drain everyone still up — grip a touch faster than stomach so slips stay catchable mid-ride
    const pending = [];
    for (const n of upNames()) {
      const s = pStats(n);
      const gripDrain = intensity * 1.12 * (1 + (6 - s.physical) * 0.045) + Math.abs(noise(1.5));
      const stomDrain = intensity * 0.98 * (1 + (6 - s.temperament) * 0.05) + Math.abs(noise(1.5));
      st[n].grip -= gripDrain;
      st[n].stomach -= stomDrain;
      if (st[n].grip <= 0 && st[n].stomach <= 0) pending.push({ n, reason: st[n].grip <= st[n].stomach ? 'grip' : 'dizzy' });
      else if (st[n].grip <= 0) pending.push({ n, reason: 'grip' });
      else if (st[n].stomach <= 0) pending.push({ n, reason: 'dizzy' });
    }

    // SAVE opportunity — a bonded ally lunges and catches someone lurching off (Anastasia-catches-Logan).
    // Only while the field is healthy enough to have a rescuer; one save per wave, ~3 per game max.
    let savedThisWave = 0;
    for (const cand of pending) {
      if (savedThisWave >= 1 || savesThisGame >= 3) break;
      if (lvl < 2 || upNames().length <= 3) continue;
      if (Math.random() > 0.6) continue;
      const v = cand.n;
      const rescuers = upNames().filter(r => r !== v && !pending.find(x => x.n === r) &&
        getBond(r, v) >= 3 && pStats(r).boldness >= 5 && (isMerged || tribeOf(r) === tribeOf(v)));
      if (!rescuers.length) continue;
      const r = rescuers.sort((a, b) => getBond(b, v) - getBond(a, v))[0];
      const rs = pStats(r);
      const ok = Math.random() < clamp(rs.boldness * 0.07 + rs.physical * 0.04 + getBond(r, v) * 0.04, 0.25, 0.9);
      if (ok) {
        st[v].grip = Math.max(st[v].grip, 2.2 + rs.physical * 0.15);
        st[v].stomach = Math.max(st[v].stomach, 2.0);
        st[r].grip -= 2.5;
        addBond(r, v, 2); popDelta(r, 2);
        cand.saved = true; savedThisWave++; savesThisGame++;
        pushEv(phase, { type: 'save', player: r, target: v, text: pick(SAVE_OK)(r, v), badge: '🤝 CLUTCH SAVE', badgeClass: 'green' });
        if (campKey && ep.campEvents) {
          (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
            type: 'spinSave', players: [r, v], tag: 'merry-go-round-up',
            text: `${r} caught ${v} at top speed on the carousel and hauled ${pronouns(v).obj} back on. ${v} owes ${pronouns(r).obj} one.`,
            badgeText: 'CLUTCH SAVE', badgeClass: 'green' });
        }
      } else {
        addBond(r, v, 1); popDelta(r, 1);
        pushEv(phase, { type: 'saveFail', player: r, target: v, text: pick(SAVE_FAIL)(r, v), badge: '↯ JUST MISSED', badgeClass: 'amber' });
      }
    }

    // near-miss color — a rider who lurched but held on. In the warm-up, target anyone (a green-gilled
    // wobble sells the danger even before the field thins); later, the genuinely low-metered riders.
    const lowRider = lvl >= 2
      ? upNames().filter(n => !pending.find(x => x.n === n) && (st[n].grip < 4 || st[n].stomach < 4))
      : upNames().filter(n => !pending.find(x => x.n === n));
    if (lowRider.length && Math.random() < (lvl >= 2 ? 0.55 : 0.75)) {
      const nm = pick(lowRider);
      pushEv(phase, { type: 'nearMiss', player: nm, text: pick(NEAR_MISS)(nm), badge: '😰 CLOSE CALL', badgeClass: 'amber' });
    }

    // actual falls (skip the saved). Order the side nearest elimination first, then STOP the instant the
    // win is decided — the winning team (or last rider) stays ON the carousel.
    const teamUp = {};
    if (!isMerged) upNames().forEach(n => { const t = tribeOf(n); teamUp[t] = (teamUp[t] || 0) + 1; });
    const toFall = pending.filter(c => !c.saved).sort((a, b) => {
      if (!isMerged) { const ta = teamUp[tribeOf(a.n)] || 0, tb = teamUp[tribeOf(b.n)] || 0; if (ta !== tb) return ta - tb; }
      return (st[a.n].grip + st[a.n].stomach) - (st[b.n].grip + st[b.n].stomach);
    });
    const justFell = [];
    for (const cand of toFall) {
      fall(phase, cand.n, cand.reason);
      justFell.push(cand.n);
      if (winCond()) break;
    }

    // FALL REACTIONS — a still-riding rival gloats or an ally winces (consequence: bond/pop)
    let reacts = 0;
    for (const f of justFell) {
      if (reacts >= 2) break;
      const up = upNames();
      if (up.length < 2) break;
      const rival = up.filter(x => getBond(x, f) <= -2 && (canScheme(x) || Math.random() < 0.5)).sort((a, b) => getBond(a, f) - getBond(b, f))[0];
      const friend = up.filter(x => getBond(x, f) >= 4).sort((a, b) => getBond(b, f) - getBond(a, f))[0];
      if (rival && Math.random() < 0.6) {
        addBond(rival, f, -1); popDelta(rival, -1);
        pushEv(phase, { type: 'fallTaunt', players: [rival, f], text: pick(FALL_TAUNT)(rival, f), badge: '😏 GLOATS', badgeClass: 'red' });
        reacts++;
      } else if (friend && Math.random() < 0.55) {
        addBond(friend, f, 1); popDelta(friend, 1);
        pushEv(phase, { type: 'fallCare', players: [friend, f], text: pick(FALL_CARE)(friend, f), badge: '💛 REACHES OUT', badgeClass: 'green' });
        reacts++;
      }
    }
  };

  // per-level wave schedule — escalating intensity WITHIN each level, and across levels. More, smaller
  // waves = a steady drip of falls (a real endurance grind) instead of a single Level-3 wipeout.
  const WAVE_SCHED = { 1: [1.2, 1.55], 2: [1.8, 2.1, 2.4], 3: [2.6, 3.0, 3.4] };

  // ── LEVEL LOOP ──
  const runLevel = (lvl) => {
    curLevel = lvl;
    const phase = levelPhases[lvl] || phase3;
    // banner
    pushEv(phase, { type: 'banner', level: lvl, text: pick(LEVEL_BANNER[Math.min(lvl, 4)]), badge: lvl >= 4 ? '⚙️ OVERTIME' : `LEVEL ${lvl}`, badgeClass: lvl >= 3 ? 'red' : lvl === 2 ? 'amber' : 'blue' });
    // host taunt to raise the stakes (levels 2+)
    if (lvl >= 2 && upNames().length > 2 && Math.random() < 0.7) {
      pushEv(phase, { type: 'taunt', text: pickUniq(HOST_TAUNT, usedTxt)(host()), badge: '🎙️ HOST', badgeClass: 'social' });
    }
    // Level 1: queasy forfeits fire first (before any wave)
    if (lvl === 1) forfeiters.forEach(n => { if (st[n].up) fall(phase, n, 'queasy'); });
    // run this level's waves (overtime = ever-escalating single waves)
    const waves = WAVE_SCHED[lvl] || [3.1 + 0.5 * (lvl - 4), 3.5 + 0.5 * (lvl - 4)];
    for (let w = 0; w < waves.length; w++) {
      if (winCond()) break;
      runWave(phase, lvl, waves[w], w);
    }
  };

  // ── social beat scheduler — fires BETWEEN levels ──
  const socialUsed = { bet: false, overheard: false, seathop: false, dropped: false };
  let betPair = null; // [a, b] side-bet wager — resolved after the ride (loser sleeps outside)
  const runSocial = (phase) => {
    const up = upNames();
    if (up.length < 3) return;
    // SIDE BET — two rivals or bantery pair still riding
    if (!socialUsed.bet && Math.random() < 0.55) {
      const a = pick(up);
      const b = up.find(x => x !== a && (getBond(a, x) <= 1) && (isMerged || tribeOf(x) === tribeOf(a)));
      if (b) {
        socialUsed.bet = true;
        betPair = [a, b]; // resolved after the ride — the one who falls first loses the wager
        addBond(a, b, 1); // competitive respect
        pushEv(phase, { type: 'sidebet', players: [a, b], text: pick(SIDE_BET)(a, b), badge: '🎲 SIDE BET', badgeClass: 'social' });
        if (campKey && ep.campEvents) {
          (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
            type: 'spinBet', players: [a, b], tag: 'merry-go-round-up',
            text: `${a} and ${b} made a bet on the carousel about who'd fall first. Loser's on the hook — a little rivalry with teeth.`,
            badgeText: 'WAGER', badgeClass: 'social' });
        }
      }
    }
    // OVERHEARD scheme — a schemer pitches a blindside within earshot of the target
    if (!socialUsed.overheard && Math.random() < 0.5) {
      const a = up.find(x => canScheme(x));
      if (a) {
        const b = up.find(x => x !== a && getBond(a, x) >= 1);
        const tgt = up.find(x => x !== a && x !== b && getBond(a, x) < 1 && (isMerged || tribeOf(x) === tribeOf(a)));
        if (b && tgt) {
          socialUsed.overheard = true;
          addBond(tgt, a, -2); popDelta(a, -1);
          _spinBetrayHeat(tgt, a, 1.6); // target now hunts the schemer at the vote
          pushEv(phase, { type: 'overheard', players: [a, tgt], text: pick(OVERHEARD)(a, b, tgt), badge: '🎡 OVERHEARD', badgeClass: 'social' });
          if (campKey && ep.campEvents) {
            (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
              type: 'spinOverheard', players: [a, tgt], tag: 'merry-go-round-up',
              text: `${tgt} overheard ${a} pitching a blindside on the carousel — ${pronouns(tgt).sub === 'they' ? 'they aren\'t' : pronouns(tgt).sub + " isn't"} going to forget it.`,
              badgeText: 'OVERHEARD', badgeClass: 'red' });
          }
        }
      }
    }
    // SEAT-HOP pitch — a strategist scrambles over to lobby someone into working together.
    // The MORE STRATEGIC the schemer, the more likely they seize the chaos to build a number: the attempt
    // chance scales with the best available schemer's strategic stat (a 9-strategic mastermind almost
    // always tries; a barely-eligible 6 rarely does). Outcome then depends on the target's receptivity.
    if (!socialUsed.seathop) {
      const a = up.filter(x => canScheme(x) && pStats(x).social >= 4)
        .sort((x, y) => pStats(y).strategic - pStats(x).strategic)[0]; // the sharpest schemer takes the shot
      const attemptChance = a ? clamp(0.08 + pStats(a).strategic * 0.085, 0.12, 0.92) : 0; // ∝ strategic
      const b = a && Math.random() < attemptChance &&
        up.find(x => x !== a && Math.abs(getBond(a, x)) <= 2 && (isMerged || tribeOf(x) === tribeOf(a)));
      if (a && b) {
        socialUsed.seathop = true;
        const bs = pStats(b);
        const receptive = (bs.strategic * 0.45 + (getBond(a, b) + 5) * 0.4 - bs.loyalty * 0.15 + noise(3)) > 4.2;
        if (receptive) {
          addBond(a, b, 3); popDelta(a, 1); // the pitch lands — a real working relationship forms
          pushEv(phase, { type: 'seathop', players: [a, b], text: pick(SEAT_HOP_YES)(a, b), badge: '🎠 SEAT-HOP · IN', badgeClass: 'social' });
          if (campKey && ep.campEvents) {
            (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
              type: 'spinSeatHop', players: [a, b], tag: 'merry-go-round-up',
              text: `${a} recruited ${b} on the carousel — the two of them are working together now. A new number to watch heading into the vote.`,
              badgeText: 'NEW DEAL', badgeClass: 'green' });
          }
        } else {
          addBond(a, b, -2); popDelta(a, -1); // rebuffed — B trusts A a little less for trying
          pushEv(phase, { type: 'seathopFail', players: [a, b], text: pick(SEAT_HOP_NO)(a, b), badge: '🎠 SEAT-HOP · REBUFFED', badgeClass: 'red' });
          if (campKey && ep.campEvents) {
            (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
              type: 'spinSeatHopFail', players: [b, a], tag: 'merry-go-round-up',
              text: `${a} tried to pull ${b} into a deal mid-ride and got shut down. ${b} is warier of ${pronouns(a).obj} now.`,
              badgeText: 'REBUFFED', badgeClass: 'amber' });
          }
        }
      }
    }
    // DROPPED ADVANTAGE sighting — only if someone actually holds a (spottable, unused) advantage.
    // A sharp-eyed rider clocks it → the holder becomes KNOWN to the cast (real intel: raises heat and
    // flows into voting / idol-steal targeting), not just flavor.
    if (!socialUsed.dropped && Math.random() < 0.45) {
      const holder = up.find(x => _heldSpottableAdv(x));
      // prefer a non-close watcher (someone who'd actually weaponise it), else any intuitive rider
      const watcher = holder && (
        up.find(x => x !== holder && pStats(x).intuition >= 5 && getBond(x, holder) < 4) ||
        up.find(x => x !== holder && pStats(x).intuition >= 5));
      if (holder && watcher) {
        socialUsed.dropped = true;
        const spotted = _spotAdvantage(holder); // ← the real consequence: holder is now a known-holder
        const advWord = spotted === 'idol' || spotted === 'legacy' || spotted === 'amulet' || spotted === 'secondLife'
          ? 'a hidden immunity idol' : 'an advantage';
        pushEv(phase, { type: 'dropped', players: [holder, watcher], text: pick(DROPPED_ADV)(holder, watcher),
          badge: '👀 SPOTTED', badgeClass: 'social' });
        popDelta(holder, -1); // the target now carries a bullseye
        if (campKey && ep.campEvents) {
          (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
            type: 'spinDropped', players: [watcher, holder], tag: 'merry-go-round-up',
            text: `${watcher} caught ${holder} nearly dropping ${advWord} on the carousel. The secret's out — ${holder} is a marked player now.`,
            badgeText: 'ADVANTAGE EXPOSED', badgeClass: 'red' });
        }
      }
    }
  };

  // CHAOS event injector (sudden stop collision / direction reverse)
  const runChaos = (phase, kind) => {
    if (kind === 'reverse') {
      curDir *= -1;
      pushEv(phase, { type: 'reverse', text: pick(REVERSE_TEXT)(), badge: '↺ REVERSE', badgeClass: 'red' });
      // extra stomach strain to everyone still up
      for (const n of upNames()) { st[n].stomach -= 2.4 + Math.abs(noise(1.5)); }
      // drop the sickest first, stop the instant the win is decided (keep the winning side riding)
      const dropped = upNames().filter(n => st[n].stomach <= 0).sort((a, b) => st[a].stomach - st[b].stomach);
      for (const n of dropped) { fall(phase, n, 'dizzy'); if (winCond()) break; }
    } else if (kind === 'stop') {
      const up = upNames();
      if (up.length < 3) return;
      // the most-vulnerable rider pitches into a ring neighbour
      const faller = [...up].sort((a, b) => (st[a].grip + st[a].stomach) - (st[b].grip + st[b].stomach))[0];
      const nbrs = up.filter(x => x !== faller).sort((a, b) => Math.abs(st[a].idx - st[faller].idx) - Math.abs(st[b].idx - st[faller].idx));
      const victim = nbrs[0];
      pushEv(phase, { type: 'suddenstop', text: pick(SUDDEN_STOP)(), badge: '🛑 SUDDEN STOP', badgeClass: 'red' });
      // faller always goes; victim taken down too if their grip is shaky, else near-miss
      fall(phase, faller, 'grip', '💥 THROWN OFF');
      const victimGoes = st[victim].grip < 6 || Math.random() < 0.5;
      if (victimGoes && st[victim].up) {
        st[victim].up = false; st[victim].fallStep = stepCounter; st[victim].fallReason = 'collision'; fallOrder.push(victim);
        pushEv(phase, { type: 'collision', players: [faller, victim], text: pick(COLLISION)(faller, victim),
          badge: '💥 DOUBLE OUT', badgeClass: 'grey', placeFromBottom: fallOrder.length });
        if (campKey && ep.campEvents) {
          (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
            type: 'spinCollision', players: [faller, victim], tag: 'merry-go-round-up',
            text: `${faller} wiped out ${victim} in the carousel pileup. Nobody's fault, but ${victim} took it personally.`,
            badgeText: 'PILEUP', badgeClass: 'amber' });
          addBond(faller, victim, -1);
        }
      } else if (st[victim].up) {
        pushEv(phase, { type: 'nearMiss', player: victim, text: `${victim} eats the impact from ${faller}'s wipeout but somehow stays on.`, badge: '😰 HELD ON', badgeClass: 'amber' });
      }
    }
  };

  // ── romance hooks (downtime + danger) ──
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || (ep.chalMemberScores = {}), 'danger', null);
  const upForRomance = active.slice();
  for (let i = 0; i < upForRomance.length && i < 2; i++) {
    const a = upForRomance[i], b = upForRomance[(i + 1) % upForRomance.length];
    if (a && b && a !== b && (isMerged || tribeOf(a) === tribeOf(b))) {
      _challengeRomanceSpark(a, b, ep, null, null, ep.chalMemberScores, 'the carousel');
    }
  }

  // ── RUN THE RIDE ──
  runLevel(1);
  runSocial(phase1);

  if (!winCond()) { runSocial(phase2); runLevel(2); if (!winCond()) runChaos(phase2, 'stop'); runSocial(phase2); }
  if (!winCond()) { runSocial(phase3); runLevel(3); }
  if (!winCond()) runChaos(phase3, 'reverse');
  if (!winCond()) runSocial(phase3);
  // OVERTIME — keep spinning until a winner; escalate to force falls
  let ot = 4, guard = 0;
  while (!winCond() && guard < 8) {
    runLevel(ot);
    if (!winCond() && ot % 2 === 0) runChaos(phase3, 'reverse');
    ot++; guard++;
  }
  // safety: if somehow multiple tied still up, force lowest to fall
  while (!winCond()) {
    const up = upNames();
    const weakest = [...up].sort((a, b) => (st[a].grip + st[a].stomach) - (st[b].grip + st[b].stomach))[0];
    fall(phase3, weakest, 'dizzy');
  }

  // ── SETTLE THE SIDE BET — whoever fell first loses (a survivor beats a fallen rival) ──
  if (betPair) {
    const [ba, bb] = betPair;
    const ai = fallOrder.indexOf(ba), bi = fallOrder.indexOf(bb);
    let winner = null, loser = null;
    if (st[ba].up && !st[bb].up) { winner = ba; loser = bb; }
    else if (st[bb].up && !st[ba].up) { winner = bb; loser = ba; }
    else if (!st[ba].up && !st[bb].up) { loser = ai < bi ? ba : bb; winner = ai < bi ? bb : ba; }
    if (winner && loser) {
      popDelta(winner, 1); popDelta(loser, -1); addBond(winner, loser, -0.5);
      pushEv(phase3, { type: 'betResult', players: [winner, loser], text: pick(BET_RESULT)(winner, loser), badge: '🎲 BET SETTLED', badgeClass: 'social' });
      if (campKey && ep.campEvents) {
        (ep.campEvents[campKey] = ep.campEvents[campKey] || { pre: [], post: [] }).post.push({
          type: 'spinBetResult', players: [loser, winner], tag: 'merry-go-round-up',
          text: `${loser} lost the carousel bet to ${winner} — ${loser} is sleeping outside the shelter tonight.`,
          badgeText: 'LOST THE BET', badgeClass: 'amber' });
      }
    }
  }

  // ══ RESULT ══
  const survivors = upNames(); // still riding at the end
  // survival ranking: still-up first, then reverse fall order (last to fall = better)
  const ranking = [
    ...survivors.sort((a, b) => (st[b].grip + st[b].stomach) - (st[a].grip + st[a].stomach)),
    ...[...fallOrder].reverse(),
  ];
  // score: later survival = higher
  const N = active.length;
  ranking.forEach((n, i) => { st[n].score = (N - i) * 2 + (st[n].up ? 6 : 0) + clamp(st[n].grip0 + st[n].stomach0, 0, 40) * 0.05; });

  const chalMemberScores = {};
  active.forEach(n => { chalMemberScores[n] = +st[n].score.toFixed(2); });
  ep.chalMemberScores = chalMemberScores;
  ep.chalPlacements = ranking.slice();

  let immunityWinner = null, tribeScores = null, winnerTribe = null, resultText = '';
  if (isMerged) {
    immunityWinner = survivors[0] || ranking[0] || active[0];
    // guarantee top score
    if (st[immunityWinner]) st[immunityWinner].score = Math.max(...active.map(n => st[n].score)) + 5;
    chalMemberScores[immunityWinner] = +st[immunityWinner].score.toFixed(2);
    ep.immunityWinner = immunityWinner;
    ep.tribalPlayers = [...active];
    popDelta(immunityWinner, 3);
    resultText = pick(WIN_INDIV)(immunityWinner);
  } else {
    tribeScores = {};
    for (const tribe of gs.tribes) {
      const members = tribe.members.filter(m => active.includes(m));
      if (!members.length) continue;
      tribeScores[tribe.tribeName || tribe.name] = members.reduce((s, m) => s + st[m].score, 0) / members.length;
    }
    const sorted = Object.entries(tribeScores).sort(([, a], [, b]) => b - a);
    if (sorted.length) {
      winnerTribe = gs.tribes.find(t => (t.tribeName || t.name) === sorted[0][0]);
      const loserTribe = gs.tribes.find(t => (t.tribeName || t.name) === sorted[sorted.length - 1][0]);
      ep.winner = winnerTribe;
      ep.loser = loserTribe;
      ep.safeTribes = gs.tribes.filter(t => t !== loserTribe && t !== winnerTribe);
      ep.challengePlacements = sorted.map(([name]) => {
        const t = gs.tribes.find(tr => (tr.tribeName || tr.name) === name);
        return { name, members: [...(t?.members || [])] };
      });
      ep.tribalPlayers = [...(loserTribe?.members || [])];
      const wSurv = survivors.filter(n => tribeOf(n) === (winnerTribe.tribeName || winnerTribe.name));
      resultText = pick(WIN_TEAM)(winnerTribe.tribeName || winnerTribe.name, wSurv[0] || 'their last rider', wSurv[1]);
    }
  }

  updateChalRecord(ep);

  ep.challengeLabel = 'Merry-Go-Round-Up';
  ep.challengeCategory = 'challenge';
  ep.challengeType = 'merry-go-round-up';
  ep.isMerryGoRound = true;
  ep.merryData = {
    isMerged, hostOpener, resultText,
    phases: [phaseDraft, phase1, phase2, phase3],
    ranking, scores: chalMemberScores, immunityWinner,
    tribeScores, winnerTribe: winnerTribe ? (winnerTribe.tribeName || winnerTribe.name) : null,
    fallOrder: fallOrder.slice(), survivors: survivors.slice(),
    seatMap: active.map(n => ({ name: n, animal: st[n].animal.kind, grip: st[n].animal.grip, tribe: tribeOf(n) })),
    initMeters, finalMeters: snapMeters(),
  };
}

// ══════════════════════════════════════════════════════════════════════
// VP — THE SPIN DECK (a live, genuinely-spinning big-top carousel)
// ══════════════════════════════════════════════════════════════════════
function portrait(name, size = 30) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:6px;object-fit:cover;flex-shrink:0" onerror="this.style.visibility='hidden'">`;
}
const MGR_SPEED = { 1: 0.34, 2: 0.8, 3: 1.55, 4: 1.9, 5: 2.2 };
const MGR_CX = 320, MGR_CY = 95, MGR_RX = 300, MGR_RY = 76;

function mgrCss() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Rajdhani:wght@500;700&family=Share+Tech+Mono&display=swap');
  .mgr-shell{--gold:#ffd35a;--red:#e0344b;--cream:#fbe9c4;--teal:#3fb6c4;--ink:#160c1c;
    max-width:1100px;margin:0 auto;font-family:'Rajdhani',sans-serif;color:var(--cream);background:#160c1c;padding:6px 4px 90px}
  .mgr-shell *{box-sizing:border-box}
  .mgr-deck{position:sticky;top:46px;z-index:14;height:330px;border:5px solid #2a1330;border-radius:12px;overflow:hidden;
    background:radial-gradient(ellipse at 50% 8%,#3a1f52 0%,#2a1540 34%,#1a0e2a 62%,#0f0818 100%)}
  .mgr-stars{position:absolute;inset:0;z-index:1;pointer-events:none;
    background-image:radial-gradient(1.5px 1.5px at 12% 14%,#fff8 40%,transparent),radial-gradient(1.5px 1.5px at 76% 9%,#fff6 40%,transparent),
      radial-gradient(1px 1px at 44% 20%,#ffe9,transparent),radial-gradient(1.5px 1.5px at 88% 24%,#fff7,transparent),
      radial-gradient(1px 1px at 28% 6%,#fff6,transparent),radial-gradient(1.5px 1.5px at 62% 16%,#fff5,transparent)}
  .mgr-lights{position:absolute;top:0;left:-2%;right:-2%;height:60px;z-index:6;pointer-events:none}
  .mgr-bulb{position:absolute;width:9px;height:9px;border-radius:50%;box-shadow:0 0 8px 2px currentColor;animation:mgrTwk 1.6s ease-in-out infinite}
  @keyframes mgrTwk{0%,100%{opacity:1}50%{opacity:.35}}
  .mgr-finial{position:absolute;top:6px;left:50%;transform:translateX(-50%);z-index:9;width:9px;height:30px;
    background:linear-gradient(180deg,#fff2b0,var(--gold));border-radius:5px;box-shadow:0 0 10px var(--gold)}
  .mgr-finial::before{content:'';position:absolute;top:-11px;left:50%;transform:translateX(-50%);width:13px;height:13px;border-radius:50%;background:var(--gold);box-shadow:0 0 12px var(--gold)}
  .mgr-canopy{position:absolute;top:14px;left:50%;transform:translateX(-50%);z-index:8;filter:drop-shadow(0 8px 10px rgba(0,0,0,.5))}
  .mgr-pole{position:absolute;top:96px;left:50%;transform:translateX(-50%);width:20px;height:176px;z-index:4;border-radius:6px;
    background:linear-gradient(90deg,#7a5a2a,#ffe6a0 45%,#fff 50%,#ffe6a0 55%,#7a5a2a);box-shadow:0 0 14px rgba(255,220,140,.4)}
  .mgr-pole::after{content:'';position:absolute;inset:0;border-radius:6px;
    background:repeating-linear-gradient(180deg,rgba(224,52,75,.85) 0 16px,transparent 16px 32px);animation:mgrBarber 1.1s linear infinite}
  @keyframes mgrBarber{to{background-position:0 32px}}
  .mgr-platform{position:absolute;top:112px;left:50%;transform:translateX(-50%);width:700px;height:200px;z-index:2}
  .mgr-disc{position:absolute;left:30px;right:30px;top:20px;height:150px;border-radius:50%;
    background:radial-gradient(ellipse at 50% 38%,#7a4a24,#4a2a12 60%,#2a1608);border:5px solid #2a1608;
    box-shadow:0 16px 32px rgba(0,0,0,.6),inset 0 0 44px rgba(0,0,0,.55)}
  .mgr-disc::before{content:'';position:absolute;inset:20px;border-radius:50%;border:3px dashed rgba(255,211,90,.35)}
  .mgr-disc::after{content:'';position:absolute;inset:6px;border-radius:50%;border:2px solid rgba(255,211,90,.55);box-shadow:0 0 14px rgba(255,211,90,.3)}
  .mgr-sweep{position:absolute;left:30px;right:30px;top:20px;height:150px;border-radius:50%;z-index:6;pointer-events:none;mix-blend-mode:screen;
    background:conic-gradient(from 0deg,transparent 0 42%,rgba(255,240,200,.18) 55%,transparent 68%);animation:mgrSpin .5s linear infinite}
  @keyframes mgrSpin{to{transform:rotate(360deg)}}
  .mgr-ring{position:absolute;inset:0;z-index:5}
  .mgr-seat{position:absolute;z-index:5;transform:translate(-50%,-90%)}
  .mgr-seat .mgr-face{position:absolute;top:-2px;left:50%;transform:translateX(-50%);width:34px;height:34px;border-radius:8px;object-fit:cover;border:2px solid #1c120a;z-index:3;background:#241018}
  .mgr-seat .mgr-nm{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono';font-size:9px;white-space:nowrap;color:#fff;background:rgba(22,12,28,.75);padding:1px 5px;border-radius:3px;z-index:6}
  .mgr-seat.wob .mgr-streak{position:absolute;top:40%;left:-40px;width:38px;height:6px;border-radius:3px;background:linear-gradient(90deg,transparent,rgba(255,240,200,.55))}
  .mgr-fling{position:absolute;z-index:22;width:40px;height:40px;border-radius:8px;object-fit:cover;border:2px solid #1c120a;animation:mgrFling 1.15s cubic-bezier(.4,-.2,.85,.5) forwards}
  @keyframes mgrFling{0%{transform:translate(-50%,-90%) scale(1) rotate(0);opacity:1}
    45%{transform:translate(50px,-130px) scale(.92) rotate(300deg);opacity:1}
    100%{transform:translate(210px,190px) scale(.5) rotate(700deg);opacity:.12}}
  .mgr-trace{position:absolute;z-index:21;pointer-events:none;opacity:.7;animation:mgrTrace 1.1s ease-out forwards}
  @keyframes mgrTrace{0%{opacity:.85}100%{opacity:0}}
  .mgr-mud{position:absolute;left:0;right:0;bottom:0;height:66px;z-index:7;background:linear-gradient(180deg,rgba(60,42,24,.2),#3c2a18 40%,#241708);border-top:3px solid #5a3d20}
  .mgr-mud::before{content:'';position:absolute;top:-2px;left:0;right:0;height:10px;background:repeating-linear-gradient(90deg,transparent 0 20px,rgba(120,86,48,.5) 20px 26px);animation:mgrMud 5s linear infinite}
  @keyframes mgrMud{to{background-position:52px 0}}
  .mgr-splat{position:absolute;bottom:16px;width:40px;height:40px;border-radius:8px;object-fit:cover;filter:grayscale(1) brightness(.55) sepia(.3);border:2px solid #241708;z-index:8}
  .mgr-hud{position:absolute;top:10px;left:14px;right:14px;display:flex;justify-content:space-between;align-items:flex-start;z-index:12}
  .mgr-lvl{font-family:'Bangers';letter-spacing:1px;color:var(--gold);text-shadow:2px 2px 0 #000;font-size:21px;line-height:1}
  .mgr-lvl small{display:block;font-family:'Share Tech Mono';font-size:10px;color:var(--teal);letter-spacing:0;margin-top:3px}
  .mgr-gauge{width:130px;text-align:right}
  .mgr-gauge .lab{font-family:'Share Tech Mono';font-size:10px;color:var(--cream);opacity:.8}
  .mgr-gbar{height:12px;border-radius:6px;background:#2a1330;border:1px solid #4a2a52;overflow:hidden;margin-top:3px}
  .mgr-gbar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#3fb6c4,var(--gold) 60%,var(--red));animation:mgrPulse 1.1s ease-in-out infinite}
  @keyframes mgrPulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}
  .mgr-dir{margin-top:6px;font-family:'Bangers';font-size:16px;color:#fff;text-shadow:1px 1px 0 #000}
  .mgr-dir span{display:inline-block;animation:mgrSpin 1s linear infinite}
  .mgr-layout{display:grid;grid-template-columns:1fr 340px;gap:12px;align-items:start;margin-top:12px}
  .mgr-feed{min-width:0}
  .mgr-side{position:sticky;top:384px;background:linear-gradient(180deg,#241134,#180b26);border:2px solid #3f2352;border-radius:12px;padding:11px 11px;max-height:calc(100vh-120px);overflow:auto;z-index:6}
  .mgr-shdr{font-family:'Bangers';letter-spacing:1px;margin:9px 0 5px;font-size:16px;display:flex;align-items:center;gap:7px}
  .mgr-shdr .ct{font-family:'Share Tech Mono';font-size:11px;opacity:.8}
  .mgr-leg{display:flex;gap:12px;justify-content:center;font-family:'Share Tech Mono';font-size:9px;margin-bottom:6px;letter-spacing:.5px}
  .mgr-leg b{font-weight:400}
  .mgr-grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}
  .mgr-chip{display:flex;align-items:center;gap:7px;min-width:0;padding:2px 0}
  .mgr-chip img{width:26px;height:26px;border-radius:6px;object-fit:cover;border:1px solid #3f2352;flex-shrink:0}
  .mgr-chip.out{opacity:.4;filter:grayscale(1)}
  .mgr-cn{min-width:0;flex:1}
  .mgr-cn .nn{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px;line-height:1.15}
  .mgr-meter{height:6px;border-radius:3px;background:#2a1330;overflow:hidden;margin-top:3px}
  .mgr-meter i{display:block;height:100%;border-radius:3px;transition:width .3s}
  .m-grip i{background:linear-gradient(90deg,#e0344b,var(--gold))}
  .m-stom i{background:linear-gradient(90deg,#7a4ac4,var(--teal))}
  .mgr-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0}
  .mgr-card{background:linear-gradient(180deg,#241134,#1a0d28);border:1px solid #3f2352;border-left:4px solid #6a3fa0;border-radius:8px;padding:9px 12px;margin:9px 0}
  .mgr-card .who{display:flex;align-items:center;gap:8px;margin-bottom:4px}
  .mgr-card .who img{width:24px;height:24px;border-radius:5px;object-fit:cover}
  .mgr-card p{margin:0;font-size:14px;line-height:1.4;color:#e9d8f2}
  .mgr-badge{display:inline-block;font-family:'Share Tech Mono';font-size:9px;padding:2px 7px;border-radius:10px;margin-left:auto;letter-spacing:.5px;white-space:nowrap}
  .mgr-card.draft{border-left-color:#c98a2a}.b-amber{background:#4a3410;color:#ffd35a}.b-blue{background:#123a4a;color:#8af0f7}.b-green{background:#0d3820;color:#8affb0}.b-red{background:#4a0f1c;color:#ff8a9c}.b-grey{background:#333;color:#ccc}.b-social{background:#2e1c42;color:#c9a9e4}
  .mgr-card.level{border-left-color:#3fb6c4;background:linear-gradient(180deg,#123038,#0d2028)}
  .mgr-card.chaos{border-left-color:#e0344b;background:linear-gradient(180deg,#3a1220,#280c16)}
  .mgr-card.save{border-left-color:#4ac47a;background:linear-gradient(180deg,#12321f,#0c2416)}
  .mgr-card.social{border-left-color:#a98cc4;border-left-style:dashed}
  .mgr-card.fall{border-left-color:#888;background:linear-gradient(180deg,#241a1a,#1a1212)}
  .mgr-card.win{border-left-color:var(--gold);background:linear-gradient(180deg,#3a2e08,#241c04);box-shadow:0 0 20px rgba(255,211,90,.25)}
  .mgr-card.flavor{border-left-color:#5a4a6a;opacity:.94}
  .mgr-ctrl{position:fixed;bottom:0;left:0;right:0;background:rgba(22,12,28,.94);border-top:2px solid #3f2352;padding:9px;display:flex;justify-content:center;gap:10px;z-index:40}
  .mgr-btn{font-family:'Bangers';letter-spacing:1px;font-size:16px;padding:5px 20px;border:2px solid var(--gold);background:#2a1330;color:var(--gold);border-radius:8px;cursor:pointer}
  .mgr-cnt{font-family:'Share Tech Mono';color:var(--cream);align-self:center;font-size:12px}
  .mgr-done{text-align:center;font-family:'Share Tech Mono';color:#a98cc4;font-size:12px;padding:8px}
  .mgr-cover{position:relative;z-index:2;padding:26px 20px;text-align:center}
  .mgr-title{font-family:'Bangers';font-size:52px;letter-spacing:2px;color:var(--gold);text-shadow:3px 3px 0 #000,0 0 26px rgba(255,211,90,.4);line-height:.95;margin:6px 0}
  .mgr-sub{font-family:'Share Tech Mono';font-size:12px;color:var(--teal);letter-spacing:1px}
  .mgr-tag{max-width:640px;margin:12px auto;font-size:14px;color:#e9d8f2;line-height:1.5}
  .mgr-grid{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px}
  .mgr-seatcard{width:96px;background:#241134;border:1px solid #3f2352;border-radius:8px;padding:7px 5px;text-align:center}
  .mgr-seatcard img{width:40px;height:40px;border-radius:7px;object-fit:cover;border:2px solid #3f2352}
  .mgr-seatcard .nm{font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mgr-seatcard .an{font-family:'Share Tech Mono';font-size:9px;color:var(--gold)}
  @media(prefers-reduced-motion:reduce){
    .mgr-sweep,.mgr-pole::after,.mgr-bulb,.mgr-gbar i,.mgr-mud::before,.mgr-dir span,.mgr-fling{animation:none!important}
  }
  </style>`;
}

// each mount gets its own silhouette — the head/neck reads to the right, avatar sits on the saddle up top
function mgrAnimal(kind) {
  const S = 'stroke="#2a1608" stroke-width="2"';
  const legs = '<path d="M16 50 v6 M28 50 v6 M42 50 v6 M54 50 v6" stroke="#2a1608" stroke-width="3"/>';
  const strap = '<path d="M16 32 Q32 26 46 32" fill="none" stroke="#7a4a22" stroke-width="6" stroke-linecap="round"/>';
  const body = (c) => `<path d="M6 50 Q4 30 14 26 Q18 16 30 17 Q42 10 50 20 Q60 22 58 36 L58 50 Z" fill="${c}" ${S}/>`;
  const wrap = (inner) => `<svg width="66" height="58" viewBox="0 0 66 58">${inner}${legs}${strap}</svg>`;
  switch (kind) {
    case 'bear': return wrap(`${body('#6a4a2a')}<circle cx="50" cy="16" r="8" fill="#6a4a2a" ${S}/><circle cx="45" cy="9" r="3" fill="#6a4a2a"/><circle cx="55" cy="9" r="3" fill="#6a4a2a"/><circle cx="52" cy="17" r="2" fill="#160c0c"/><circle cx="49" cy="15" r="1.4" fill="#160c0c"/>`);
    case 'elephant': return wrap(`<path d="M4 50 Q2 26 18 24 Q30 14 46 20 Q60 24 58 40 L58 50 Z" fill="#8a8f96" ${S}/><path d="M14 30 Q6 34 8 46 Q10 52 16 48" fill="none" stroke="#6d7278" stroke-width="6" stroke-linecap="round"/><path d="M50 20 Q64 22 62 40 Q60 52 52 50" fill="#8a8f96" ${S}/><path d="M52 28 q-6 4 -3 12" fill="none" stroke="#f0ead8" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="24" r="1.6" fill="#160c0c"/>`);
    case 'giraffe': return wrap(`${body('#e0c05a')}<path d="M46 22 L54 2" stroke="#e0c05a" stroke-width="8" stroke-linecap="round"/><circle cx="55" cy="3" r="4" fill="#e0c05a" ${S}/><path d="M53 -1 v-3 M57 -1 v-3" stroke="#5a3a10" stroke-width="2"/><g fill="#a6791f"><circle cx="24" cy="30" r="2.6"/><circle cx="34" cy="36" r="2.6"/><circle cx="18" cy="42" r="2.6"/><circle cx="48" cy="14" r="2.2"/></g><circle cx="56" cy="2" r="1.3" fill="#160c0c"/>`);
    case 'tiger': return wrap(`${body('#e08a2a')}<circle cx="50" cy="16" r="7" fill="#e08a2a" ${S}/><path d="M44 8 l3 4 M56 8 l-3 4" stroke="#e08a2a" stroke-width="3" stroke-linecap="round"/><path d="M20 30 h6 M32 26 h6 M14 40 h5 M40 40 h5" stroke="#3a1e0a" stroke-width="3"/><circle cx="52" cy="16" r="1.5" fill="#160c0c"/>`);
    case 'owl': return wrap(`<path d="M14 50 Q10 22 34 20 Q58 22 54 50 Z" fill="#8a6a44" ${S}/><circle cx="26" cy="30" r="6" fill="#f0ead8"/><circle cx="42" cy="30" r="6" fill="#f0ead8"/><circle cx="26" cy="30" r="2.4" fill="#160c0c"/><circle cx="42" cy="30" r="2.4" fill="#160c0c"/><path d="M34 34 l-3 4 h6 Z" fill="#e0a020"/><path d="M18 22 l4 -6 M50 22 l-4 -6" stroke="#8a6a44" stroke-width="4" stroke-linecap="round"/>`);
    case 'fox': return wrap(`${body('#e07a2a')}<path d="M44 20 l-6 -12 l10 6 Z" fill="#e07a2a" ${S}/><path d="M56 22 l8 -10 l-2 12 Z" fill="#e07a2a" ${S}/><path d="M50 18 Q60 20 62 30" fill="none" stroke="#e07a2a" stroke-width="7" stroke-linecap="round"/><path d="M6 46 Q-2 40 4 30" fill="none" stroke="#f0ead8" stroke-width="7" stroke-linecap="round"/><circle cx="54" cy="20" r="1.4" fill="#160c0c"/>`);
    case 'horse': return wrap(`${body('#c98a4a')}<path d="M48 18 Q56 6 52 2 Q60 6 58 16" fill="#c98a4a" ${S}/><path d="M30 16 Q40 6 50 12" fill="none" stroke="#5a3a10" stroke-width="4" stroke-linecap="round"/><circle cx="55" cy="12" r="1.6" fill="#160c0c"/>`);
    case 'ostrich': return wrap(`<ellipse cx="30" cy="38" rx="18" ry="13" fill="#3a2c3a" ${S}/><path d="M42 34 Q54 30 54 10" fill="none" stroke="#c8a0b8" stroke-width="5" stroke-linecap="round"/><circle cx="55" cy="7" r="4" fill="#c8a0b8" ${S}/><path d="M57 7 l6 -1" stroke="#e0a020" stroke-width="3" stroke-linecap="round"/><path d="M14 34 q-6 -4 -2 -10 M18 30 q-6 -6 0 -12" fill="none" stroke="#2a1c2a" stroke-width="3"/><circle cx="56" cy="6" r="1.2" fill="#160c0c"/>`);
    case 'swan': return wrap(`<path d="M10 50 Q8 34 28 34 Q44 34 46 48 Z" fill="#eef0f4" ${S}/><path d="M42 38 Q60 34 52 10 Q50 4 46 8" fill="none" stroke="#eef0f4" stroke-width="6" stroke-linecap="round"/><circle cx="47" cy="9" r="3.4" fill="#eef0f4" ${S}/><path d="M49 9 l6 1" stroke="#e0a020" stroke-width="3" stroke-linecap="round"/><path d="M12 40 q10 -6 22 0" fill="none" stroke="#cdd2da" stroke-width="2"/><circle cx="48" cy="8" r="1.2" fill="#160c0c"/>`);
    case 'dragon': return wrap(`${body('#4a8a52')}<path d="M12 26 l4 -7 l4 7 l5 -8 l4 8 l6 -8 l4 8" fill="none" stroke="#2e5e34" stroke-width="3" stroke-linejoin="round"/><circle cx="52" cy="16" r="7" fill="#4a8a52" ${S}/><path d="M48 9 l2 5 M56 9 l-2 5" stroke="#2e5e34" stroke-width="3"/><path d="M28 22 Q40 6 60 14 Q46 20 44 30 Z" fill="#6bbf74" ${S} opacity="0.9"/><path d="M4 48 Q-4 42 6 34" fill="none" stroke="#4a8a52" stroke-width="6" stroke-linecap="round"/><circle cx="54" cy="16" r="1.5" fill="#160c0c"/>`);
    case 'tortoise': return wrap(`<path d="M10 48 Q10 26 34 24 Q58 26 56 48 Z" fill="#5a7a3a" ${S}/><path d="M22 30 l8 0 M34 27 l0 8 M40 30 l8 2" stroke="#3e5a26" stroke-width="2.5"/><path d="M56 40 Q66 36 62 28" fill="none" stroke="#8a9a5a" stroke-width="7" stroke-linecap="round"/><circle cx="62" cy="30" r="1.4" fill="#160c0c"/><path d="M12 48 q-4 4 0 8 M52 48 q4 4 0 8" stroke="#8a9a5a" stroke-width="5" stroke-linecap="round"/>`);
    case 'peacock': return wrap(`<g fill="none" stroke="#1f7a86" stroke-width="3"><path d="M40 30 Q64 6 62 40"/><path d="M40 30 Q60 14 58 44"/><path d="M40 30 Q54 10 50 46"/></g><g fill="#2fb8c8"><circle cx="62" cy="20" r="3"/><circle cx="58" cy="14" r="3"/><circle cx="50" cy="12" r="3"/></g><path d="M14 50 Q12 30 30 30 Q44 30 42 50 Z" fill="#175e8a" ${S}/><path d="M30 30 Q38 18 34 10" fill="none" stroke="#175e8a" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="9" r="3" fill="#175e8a"/><path d="M33 4 v-3 M36 5 v-3" stroke="#2fb8c8" stroke-width="1.6"/><circle cx="34" cy="9" r="1.2" fill="#160c0c"/>`);
    default: return wrap(body('#c98a4a'));
  }
}

const MGR_CANOPY = `<svg class="mgr-canopy" width="320" height="112" viewBox="0 0 320 112">
  <defs><clipPath id="mgrcc"><path d="M160 6 L314 86 Q240 112 160 112 Q80 112 6 86 Z"/></clipPath></defs>
  <g clip-path="url(#mgrcc)"><rect width="320" height="112" fill="#e0344b"/>
    <g fill="#fbe9c4"><path d="M6 86 L44 0 L76 0 L54 96 Z"/><path d="M102 0 L134 0 L128 110 L108 108 Z"/><path d="M192 0 L220 0 L212 108 L190 110 Z"/><path d="M248 0 L280 0 L314 86 L272 98 Z"/></g></g>
  <path d="M160 6 L314 86 Q240 112 160 112 Q80 112 6 86 Z" fill="none" stroke="#ffd35a" stroke-width="3.5"/>
  <path d="M6 86 Q80 112 160 112 Q240 112 314 86" fill="none" stroke="#ffd35a" stroke-width="5"/>
  <g fill="#ffd35a"><circle cx="6" cy="86" r="5"/><circle cx="58" cy="102" r="5"/><circle cx="110" cy="110" r="5"/><circle cx="160" cy="112" r="5"/><circle cx="210" cy="110" r="5"/><circle cx="262" cy="102" r="5"/><circle cx="314" cy="86" r="5"/></g></svg>`;

function mgrLights() {
  const LC = ['#ffd35a', '#e0344b', '#3fb6c4', '#fff'];
  let h = '';
  for (let i = 0; i < 26; i++) h += `<div class="mgr-bulb" style="left:${i * 4}%;top:${14 + Math.round(Math.sin(i * 0.6) * 10)}px;color:${LC[i % 4]};animation-delay:${-i * 0.13}s"></div>`;
  return h;
}

// ── the deck (arena) built from a snapshot ──
function mgrSeat(name, animal, baseAng, wob) {
  return `<div class="mgr-seat ${wob ? 'wob' : ''}" data-name="${name.replace(/"/g, '&quot;')}" data-ang="${baseAng}">
    <div class="mgr-nm">${name}</div>${mgrAnimal(animal)}<img class="mgr-face" src="assets/avatars/${slugOf(name)}.png" onerror="this.style.visibility='hidden'">${wob ? '<div class="mgr-streak"></div>' : ''}</div>`;
}
function mgrSplat(name, left) { return `<img class="mgr-splat" data-name="${name.replace(/"/g, '&quot;')}" src="assets/avatars/${slugOf(name)}.png" style="left:${left}%;transform:rotate(${(name.length % 2 ? -1 : 1) * 8}deg)" onerror="this.style.visibility='hidden'">`; }

function _mgrDeckHTML(r, snap, level, dir, label) {
  const seatOrder = r.seatMap.map(s => s.name);
  const N = seatOrder.length;
  const upRiders = seatOrder.filter(n => snap[n]?.up);
  const fallen = seatOrder.filter(n => snap[n] && !snap[n].up);
  const seats = upRiders.map(n => {
    const baseAng = (seatOrder.indexOf(n) / Math.max(1, N)) * 360;
    const m = snap[n];
    const wob = m && (m.grip < 4 || m.stomach < 4);
    return mgrSeat(n, m?.animal || 'horse', baseAng.toFixed(1), wob);
  }).join('');
  const splats = fallen.map((n, i) => mgrSplat(n, 10 + (i % 8) * 11)).join('');
  const gauge = { 1: 30, 2: 60, 3: 90, 4: 98, 5: 100 }[Math.min(level, 5)] || 60;
  const lvlName = level <= 1 ? 'WARM-UP' : level === 2 ? 'THE PUSH' : level === 3 ? 'THE BLUR' : 'OVERTIME';
  const dirArrow = dir > 0 ? '↻' : '↺';
  return `<div class="mgr-stars"></div><div class="mgr-lights">${mgrLights()}</div>
    <div class="mgr-hud">
      <div class="mgr-lvl">${lvlName}<small>${label}</small></div>
      <div class="mgr-gauge"><div class="lab">STILL RIDING · ${upRiders.length}</div><div class="mgr-gbar"><i style="width:${gauge}%"></i></div>
        <div class="mgr-dir">SPIN <span>${dirArrow}</span></div></div>
    </div>
    ${MGR_CANOPY}<div class="mgr-finial"></div><div class="mgr-pole"></div>
    <div class="mgr-platform"><div class="mgr-disc"></div><div class="mgr-sweep"></div>
      <div class="mgr-ring" data-level="${level}" data-dir="${dir}" data-spin="0">${seats}</div></div>
    <div class="mgr-mud">${splats}</div>`;
}

// ── live spinner: rotates every visible ring each frame; per-level speed from data-level ──
function mgrTick() {
  const rings = document.querySelectorAll('.mgr-ring');
  rings.forEach(ring => {
    const level = +ring.dataset.level || 1, dir = +ring.dataset.dir || 1;
    let spin = +ring.dataset.spin || 0;
    spin += (MGR_SPEED[Math.min(level, 5)] || 1.5) * dir;
    ring.dataset.spin = spin;
    ring.querySelectorAll('.mgr-seat').forEach(seat => {
      const base = +seat.dataset.ang || 0;
      const rad = (base + spin) * Math.PI / 180;
      const x = MGR_CX + MGR_RX * Math.cos(rad), y = MGR_CY + MGR_RY * Math.sin(rad);
      const depth = (Math.sin(rad) + 1) / 2;
      const sc = (0.6 + depth * 0.55).toFixed(2);
      seat.style.left = x + 'px'; seat.style.top = y + 'px';
      seat.style.zIndex = 5 + Math.round(depth * 10);
      seat.style.transform = `translate(-50%,-90%) scale(${sc})`;
      seat.style.filter = level >= 3 ? 'blur(.6px)' : 'none';
    });
  });
  window._mgrRAF = requestAnimationFrame(mgrTick);
}
function mgrStartSpin() {
  if (typeof window === 'undefined') return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduce) {
    // static layout: spread seats around the ring once
    setTimeout(() => document.querySelectorAll('.mgr-ring').forEach(ring => {
      ring.querySelectorAll('.mgr-seat').forEach(seat => {
        const rad = (+seat.dataset.ang || 0) * Math.PI / 180;
        const x = MGR_CX + MGR_RX * Math.cos(rad), y = MGR_CY + MGR_RY * Math.sin(rad);
        const depth = (Math.sin(rad) + 1) / 2;
        seat.style.left = x + 'px'; seat.style.top = y + 'px';
        seat.style.transform = `translate(-50%,-90%) scale(${(0.6 + depth * 0.55).toFixed(2)})`;
      });
    }), 30);
    return;
  }
  if (window._mgrRAF) return;
  window._mgrRAF = requestAnimationFrame(mgrTick);
}

// ── sidebar (dual grip/stomach meters) from a snapshot; PRE-MERGE splits riders by team ──
const MGR_TEAMCOLORS = ['#5aa9ff', '#ff6a6a', '#7affb0', '#ffd35a'];
function _mgrTeamColor(r, tribe) {
  const tribes = [...new Set(r.seatMap.map(s => s.tribe).filter(Boolean))];
  return MGR_TEAMCOLORS[tribes.indexOf(tribe) % MGR_TEAMCOLORS.length] || '#c9a9e4';
}
function _animalEmoji(kind) { return (ANIMALS.find(a => a.kind === kind) || {}).emoji || '🎠'; }
function _mgrSidebar(r, snap) {
  const seatOrder = r.seatMap.map(s => s.name);
  const up = seatOrder.filter(n => snap[n]?.up);
  const out = seatOrder.filter(n => snap[n] && !snap[n].up);
  const tribeOfName = n => r.seatMap.find(s => s.name === n)?.tribe || null;
  const chip = (n, riding) => {
    const m = snap[n] || { grip: 0, stomach: 0, grip0: 20, stomach0: 20, animal: 'horse' };
    const gpct = clamp((m.grip / Math.max(1, m.grip0)) * 100, 0, 100).toFixed(0);
    const spct = clamp((m.stomach / Math.max(1, m.stomach0)) * 100, 0, 100).toFixed(0);
    const tb = tribeOfName(n);
    const dot = (!r.isMerged && tb) ? `<span class="mgr-dot" style="background:${_mgrTeamColor(r, tb)}"></span>` : '';
    return `<div class="mgr-chip ${riding ? '' : 'out'}"><img src="assets/avatars/${slugOf(n)}.png" onerror="this.style.visibility='hidden'">
      <div class="mgr-cn"><div class="nn">${dot}${riding ? _animalEmoji(m.animal) : '💥'} ${n}</div>
        ${riding ? `<div class="mgr-meter m-grip"><i style="width:${gpct}%"></i></div><div class="mgr-meter m-stom"><i style="width:${spct}%"></i></div>` : ''}
      </div></div>`;
  };
  const grid = (names, riding) => `<div class="mgr-grid2">${names.map(n => chip(n, riding)).join('')}</div>`;
  const legend = `<div class="mgr-leg"><span style="color:#e0344b">▬</span><b>GRIP</b><span style="color:#3fb6c4">▬</span><b>STOMACH</b></div>`;

  let html = legend;
  if (!r.isMerged && r.seatMap.some(s => s.tribe)) {
    // PRE-MERGE: a compact block per team so both sides are visible at once
    const tribes = [...new Set(r.seatMap.map(s => s.tribe).filter(Boolean))];
    tribes.forEach(t => {
      const col = _mgrTeamColor(r, t);
      const riders = up.filter(n => tribeOfName(n) === t);
      html += `<div class="mgr-shdr" style="color:${col}"><span class="mgr-dot" style="background:${col}"></span>${t}<span class="ct">RIDING ${riders.length}</span></div>` +
        (riders.length ? grid(riders, true) : `<div class="mgr-leg" style="opacity:.6">all in the mud</div>`);
    });
  } else {
    html += `<div class="mgr-shdr" style="color:var(--gold)">🎠 STILL RIDING<span class="ct">${up.length}</span></div>${grid(up, true)}`;
  }
  if (out.length) html += `<div class="mgr-shdr" style="color:#ff8a9c">💥 IN THE MUD<span class="ct">${out.length}</span></div>${grid(out, false)}`;
  return html;
}

// ── transcript card ──
function _mgrCard(ev) {
  const avs = (ev.players && ev.players.length) ? `<div class="who">${ev.players.map(n => portrait(n, 24)).join('')}</div>`
    : (ev.player ? `<div class="who">${portrait(ev.player, 24)}</div>` : '');
  const badge = ev.badge ? `<span class="mgr-badge b-${ev.badgeClass || 'amber'}">${ev.badge}</span>` : '';
  const cls = ev.type === 'draft' || ev.type === 'draftIntro' ? 'draft'
    : ev.type === 'banner' ? 'level'
      : ev.type === 'reverse' || ev.type === 'suddenstop' || ev.type === 'fallTaunt' || ev.type === 'seathopFail' ? 'chaos'
        : ev.type === 'save' || ev.type === 'saveFail' || ev.type === 'fallCare' ? 'save'
          : ['sidebet', 'betResult', 'overheard', 'seathop', 'dropped', 'taunt'].includes(ev.type) ? 'social'
            : ev.type === 'fall' || ev.type === 'collision' ? 'fall'
              : ev.type === 'result' ? 'win'
                : ev.type === 'flavor' || ev.type === 'nearMiss' ? 'flavor' : '';
  const head = (badge || avs) ? `<div class="who">${ev.players ? ev.players.map(n => portrait(n, 24)).join('') : (ev.player ? portrait(ev.player, 24) : '')}${badge}</div>` : '';
  return `<div class="mgr-card ${cls}">${head}<p>${ev.text}</p></div>`;
}

function _mgrSteps(suffix, evs, revIdx) {
  return evs.map((ev, i) => `<div class="mgr-step" id="mgr-step-${suffix}-${i}" style="display:${i <= revIdx ? '' : 'none'}">${_mgrCard(ev)}</div>`).join('');
}
function _mgrCtrl(suffix, total, revIdx) {
  const done = revIdx >= total - 1;
  return `<div class="mgr-ctrl" id="mgr-ctrl-${suffix}" style="${done ? 'display:none' : ''}">
      <button class="mgr-btn" onclick="merryRevealNext('mgr-${suffix}',${total})">REVEAL ▶</button>
      <span class="mgr-cnt" id="mgr-cnt-${suffix}">${Math.max(0, revIdx + 1)} / ${total}</span>
      <button class="mgr-btn" onclick="merryRevealAll('mgr-${suffix}',${total})">ALL ⏭</button>
    </div>
    <div class="mgr-done" id="mgr-done-${suffix}" style="${done ? '' : 'display:none'}">— the calliope winds down —</div>`;
}

function _mgrShell(inner) { return `<div class="mgr-shell">${mgrCss()}${inner}</div>`; }

// ── screen builders ──
function rpBuildMerryTitleCard(ep) {
  const r = ep.merryData; if (!r) return '';
  const cards = r.seatMap.map(s =>
    `<div class="mgr-seatcard"><img src="assets/avatars/${slugOf(s.name)}.png" onerror="this.style.visibility='hidden'"><div class="nm">${s.name}</div><div class="an">${s.animal}</div></div>`).join('');
  return _mgrShell(`<div class="mgr-cover">
    <div class="mgr-sub">STAWAKI CARNIVAL · THE DEMON'S MERRY-GO-ROUND</div>
    <div class="mgr-title">MERRY-GO-<br>ROUND-UP</div>
    <div class="mgr-sub">${r.seatMap.length} RIDERS · ONE CAROUSEL · ${r.isMerged ? 'LAST ONE ON WINS IMMUNITY' : 'LAST TEAM RIDING WINS'}</div>
    <div class="mgr-tag">"${r.hostOpener}"</div>
    <div class="mgr-tag" style="color:var(--teal)">Two things drain you up there: your <b>GRIP</b> (muscle + your animal) and your <b>STOMACH</b> (whether the spinning scrambles your brain). A soldier with a weak stomach loses to a calm floater. Fall off your animal and it's into the mud.</div>
    <div class="mgr-grid">${cards}</div>
  </div>`);
}

function _renderLevel(ep, suffix, screenEvents, screenLabel, level) {
  const r = ep.merryData; if (!r) return '';
  const key = `mgr-${suffix}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[key]) window._tvState[key] = { idx: -1 };
  const revIdx = window._tvState[key].idx;
  window.mgrData = r;
  window[`mgr_${suffix}_events`] = screenEvents;
  window[`mgr_${suffix}_label`] = screenLabel;

  // ENTRY snapshot = the state ENTERING this screen (first event carrying a snap). Its `up` flags already
  // reflect riders who fell in EARLIER phases, so they stay in the mud instead of respawning on the ring.
  // Draft cards carry no snap → for the Level-1 screen this resolves to the warm-up banner (everyone up).
  const entryEv = screenEvents.find(e => e.snap);
  const entrySnap = entryEv?.snap || r.initMeters || r.finalMeters;
  window[`mgr_${suffix}_entry`] = entrySnap;
  // snapshot at the current reveal — walk back to the most recent revealed event carrying a snap;
  // before any reveal (revIdx < 0), show the entry state (prior-phase fallers already in the mud).
  let curSnap = entrySnap, curLevel = entryEv?.spinLevel || level, curDir = entryEv?.dir || 1;
  for (let i = Math.min(revIdx, screenEvents.length - 1); i >= 0; i--) {
    if (screenEvents[i]?.snap) { curSnap = screenEvents[i].snap; curLevel = screenEvents[i].spinLevel || level; curDir = screenEvents[i].dir || 1; break; }
  }

  mgrStartSpin();

  return _mgrShell(`
    <div class="mgr-deck" id="mgr-deck-${suffix}" data-suffix="${suffix}">${_mgrDeckHTML(r, curSnap, curLevel, curDir, screenLabel)}</div>
    <div class="mgr-layout">
      <div class="mgr-feed">${_mgrSteps(suffix, screenEvents, revIdx)}${_mgrCtrl(suffix, screenEvents.length, revIdx)}</div>
      <div class="mgr-side" id="mgr-side-${suffix}">${_mgrSidebar(r, curSnap)}</div>
    </div>`);
}

function rpBuildMerryLevel1(ep) {
  const r = ep.merryData; if (!r) return '';
  const draft = r.phases[0].events;
  const lvl1 = r.phases[1].events;
  return _renderLevel(ep, 'l1', [...draft, ...lvl1], 'THE SEAT DRAFT & WARM-UP', 1);
}
function rpBuildMerryLevel2(ep) {
  const r = ep.merryData; if (!r) return '';
  return _renderLevel(ep, 'l2', r.phases[2].events, 'LEVEL 2 · THE PUSH', 2);
}
function rpBuildMerryFinal(ep) {
  const r = ep.merryData; if (!r) return '';
  const evs = [...r.phases[3].events];
  // append a synthetic result card (final standings)
  evs.push({ type: 'result', text: r.resultText, badge: r.isMerged ? '🏆 IMMUNITY' : '🏆 TEAM WINS', badgeClass: 'green', snap: r.finalMeters, spinLevel: 3, dir: 1 });
  return _renderLevel(ep, 'final', evs, 'LEVEL 3 · THE BLUR', 3);
}

// ── live deck update on reveal: fling the faller, then resync the ring ──
function _mgrDeckStep(suffix, ev) {
  const deck = document.getElementById(`mgr-deck-${suffix}`); if (!deck || !ev) return;
  const ring = deck.querySelector('.mgr-ring');
  // update speed/direction for this beat
  if (ring && ev.spinLevel) { ring.dataset.level = ev.spinLevel; ring.dataset.dir = ev.dir || 1; }
  const fallers = ev.type === 'fall' ? [ev.player] : ev.type === 'collision' ? (ev.players || []) : [];
  fallers.forEach(name => {
    if (!ring) return;
    const seat = ring.querySelector(`.mgr-seat[data-name="${(name || '').replace(/"/g, '&quot;')}"]`);
    if (seat) {
      // fling projection: spawn a ghost from the seat's current spot arcing into the mud
      const plat = deck.querySelector('.mgr-platform');
      const left = parseFloat(seat.style.left) || MGR_CX, top = parseFloat(seat.style.top) || MGR_CY;
      if (plat) {
        const ghost = document.createElement('img');
        ghost.className = 'mgr-fling'; ghost.src = `assets/avatars/${slugOf(name)}.png`;
        ghost.style.left = left + 'px'; ghost.style.top = top + 'px';
        ghost.onerror = function () { this.style.visibility = 'hidden'; };
        plat.appendChild(ghost);
        // when the fling lands, drop a greyed splat into the mud (persists like the hung-challenge bobs)
        setTimeout(() => {
          try {
            ghost.remove();
            const mud = deck.querySelector('.mgr-mud');
            if (mud && !mud.querySelector(`.mgr-splat[data-name="${(name || '').replace(/"/g, '&quot;')}"]`)) {
              const idx = mud.querySelectorAll('.mgr-splat').length;
              const sp = document.createElement('img');
              sp.className = 'mgr-splat'; sp.src = `assets/avatars/${slugOf(name)}.png`;
              sp.dataset.name = name; sp.style.left = (8 + (idx % 9) * 10) + '%';
              sp.style.transform = `rotate(${(name.length % 2 ? -1 : 1) * 8}deg)`;
              sp.onerror = function () { this.style.visibility = 'hidden'; };
              mud.appendChild(sp);
            }
          } catch (e) {}
        }, 1050);
      }
      seat.remove();
    }
  });
  // update HUD count from the ring's live seats (DOM truth) + direction arrow
  const lab = deck.querySelector('.mgr-gauge .lab');
  if (lab && ring) lab.textContent = `STILL RIDING · ${ring.querySelectorAll('.mgr-seat').length}`;
  if (ev.dir) { const dirSpan = deck.querySelector('.mgr-dir span'); if (dirSpan) dirSpan.textContent = ev.dir > 0 ? '↻' : '↺'; }
}

function _mgrUpdateSidebar(screenKey, revIdx) {
  const suffix = screenKey.replace('mgr-', '');
  const sideEl = document.getElementById(`mgr-side-${suffix}`);
  const r = window.mgrData; if (!sideEl || !r) return;
  const evs = window[`mgr_${suffix}_events`] || [];
  let snap = window[`mgr_${suffix}_entry`] || r.initMeters || r.finalMeters; // entry state = prior-phase fallers stay in the mud
  for (let i = Math.min(revIdx, evs.length - 1); i >= 0; i--) { if (evs[i]?.snap) { snap = evs[i].snap; break; } }
  sideEl.innerHTML = _mgrSidebar(r, snap);
}

function merryRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  if (st.idx >= total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('mgr-', '');
  const el = document.getElementById(`mgr-step-${suffix}-${st.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`mgr-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${st.idx + 1} / ${total}`;
  if (st.idx >= total - 1) {
    const c = document.getElementById(`mgr-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const d = document.getElementById(`mgr-done-${suffix}`); if (d) d.style.display = '';
  }
  const evs = window[`mgr_${suffix}_events`] || [];
  try { _mgrDeckStep(suffix, evs[st.idx]); } catch (e) {}
  _mgrUpdateSidebar(screenKey, st.idx);
}

function merryRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  const suffix = screenKey.replace('mgr-', '');
  const evs = window[`mgr_${suffix}_events`] || [];
  for (let i = st.idx + 1; i < total; i++) {
    const el = document.getElementById(`mgr-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  st.idx = total - 1;
  const cnt = document.getElementById(`mgr-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`mgr-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const d = document.getElementById(`mgr-done-${suffix}`); if (d) d.style.display = '';
  // resync the deck to the final snapshot of this screen
  try {
    const deck = document.getElementById(`mgr-deck-${suffix}`);
    const last = evs[total - 1];
    if (deck && last?.snap) deck.innerHTML = _mgrDeckHTML(window.mgrData, last.snap, last.spinLevel || 3, last.dir || 1, window[`mgr_${suffix}_label`] || '');
  } catch (e) {}
  _mgrUpdateSidebar(screenKey, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG — complete retranscription of the VP narration
// ══════════════════════════════════════════════════════════════════════
function _textMerryGoRoundUp(ep, ln, sec) {
  const r = ep.merryData; if (!r) return;
  sec('MERRY-GO-ROUND-UP');
  ln(`"${r.hostOpener}"`);
  ln('');
  r.phases.forEach(phase => {
    if (!phase.events.length) return;
    ln(`— ${phase.title} —`);
    phase.events.forEach(ev => {
      const who = ev.players ? ev.players.join(' & ') : ev.player;
      const tag = ev.badge ? ` [${ev.badge.replace(/^[^\w]+\s*/, '')}]` : '';
      ln(`${who ? who + ': ' : ''}${ev.text}${tag}`);
    });
    ln('');
  });
  ln(r.resultText);
  if (r.isMerged && r.immunityWinner) ln(`IMMUNITY: ${r.immunityWinner}`);
  else if (r.winnerTribe) ln(`CHALLENGE WON BY: ${r.winnerTribe}`);
  ln('');
}

export { rpBuildMerryTitleCard, rpBuildMerryLevel1, rpBuildMerryLevel2, rpBuildMerryFinal,
         merryRevealNext, merryRevealAll, _textMerryGoRoundUp };
