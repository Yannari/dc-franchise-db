// ══════════════════════════════════════════════════════════════════════
// killer-clown.js — "Night of the Killer Clown" (DC4, post-merge individual)
// A night-forest immunity RACE with a stalking animatronic clown.
//
// Each player draws a backpack: half hold an (empty) DART GUN, half hold the
// DARTS. Only a LOADED player (gun + darts) can stun the clown for five
// minutes — so the whole challenge runs on a trust/ammo economy: barter,
// hand over your darts, or steal them. Players pick a ROUTE (river raft or
// mountain climb), grab a flag from the dark, and race back to camp. The
// clown drags off the exposed (heavy time penalty); the first flag home wins
// immunity.
//
//   RIVER  (raft/nerve)  = mental*0.4 + strategic*0.3 + physical*0.3
//   MOUNTAIN(climb/bridge)= physical*0.5 + endurance*0.4 + boldness*0.1
//   EVADE  (dodge clown) = intuition*0.45 + physical*0.3 + boldness*0.25
//   AIM    (stun clown)  = intuition*0.4 + mental*0.35 + boldness*0.15
//   RUN    (final sprint)= physical*0.45 + endurance*0.4 + boldness*0.15
//
// Every social beat has real consequences (bonds / popularity / heat /
// showmances). Scoring is a race: return time inverts to chalMemberScores,
// so the winner is already #1 — no immunity-score inflation.
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

function noise(m) { return (Math.random() - 0.5) * 2 * m; }
function archOf(n) { return players.find(p => p.name === n)?.archetype || 'floater'; }
function pick(a) { return a.length ? a[Math.floor(Math.random() * a.length)] : null; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function bumpPop(n, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; }
function mmss(s) { const m = Math.floor(s / 60), r = Math.round(s % 60); return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`; }

function riverScore(n) { const s = pStats(n); return s.mental * 0.4 + s.strategic * 0.3 + s.physical * 0.3; }
function mtnScore(n) { const s = pStats(n); return s.physical * 0.5 + s.endurance * 0.4 + s.boldness * 0.1; }
function evadeScore(n) { const s = pStats(n); return s.intuition * 0.45 + s.physical * 0.3 + s.boldness * 0.25; }
function aimScore(n) { const s = pStats(n); return s.intuition * 0.4 + s.mental * 0.35 + s.boldness * 0.15; }
function runScore(n) { const s = pStats(n); return s.physical * 0.45 + s.endurance * 0.4 + s.boldness * 0.15; }

function canScheme(n) {
  const a = archOf(n), s = pStats(n);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}
function isNice(n) { return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(archOf(n)); }

// name-stripped no-repeat text picker + per-run event-type usage (reset per run)
let _usedTpl, _typeUsed;
function draw(pool, ...ctx) {
  const built = pool.map(f => f(...ctx));
  const strip = (t) => (gs.activePlayers || []).reduce((s, n) => s.split(n).join('~'), t);
  const fresh = built.filter(t => !_usedTpl.has(strip(t)));
  const from = fresh.length ? fresh : built;
  const chosen = from[Math.floor(Math.random() * from.length)];
  _usedTpl.add(strip(chosen));
  return chosen;
}

// clown proximity meter
const PROX_STAGES = [
  { at: 0, name: 'Lurking', cls: 'lurk' },
  { at: 35, name: 'Circling', cls: 'circle' },
  { at: 65, name: 'Charging', cls: 'charge' },
  { at: 88, name: 'RAMPAGE', cls: 'rampage' },
];
function proxStage(p) { let s = PROX_STAGES[0]; for (const st of PROX_STAGES) if (p >= st.at) s = st; return s; }

const HOST_OPENERS = [
  "TREVOR: “Backpacks on. Map inside, flag out in the dark. Half of you have a gun with no darts, half of you have darts and no gun — figure it out. Oh, and…” EMILY: “…he's awake.”",
  "EMILY: “First one back to camp with a flag wins immunity. River or mountain, your call.” TREVOR presses a remote. Something huge and painted lurches up out of the tree line. “Five minutes. That's all a dart buys you.”",
  "TREVOR: “Simple challenge. Get a flag, come home first.” EMILY: “The catch is the seven-foot animatronic clown, and the fact that none of you can shoot it alone.” The forest goes very quiet.",
];
const HOST_CLOSERS = [
  "The clown lumbers back into the dark, dragging the last of the stragglers with it. One flag made it home. One player is safe. The rest are walking to tribal.",
  "Flag's in. Immunity's decided. Somewhere back in the trees a seven-foot clown is being powered down by a very tired intern.",
  "Camp fills back up one shaking, mud-caked player at a time. Only one of them is smiling — and safe.",
];

// ══════════════════════════════════════════════════════════════════════
export function simulateKillerClown(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (active.length < 2) return;
  _usedTpl = new Set(); _typeUsed = {};
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const camp = ep.campEvents[campKey];
  const personalScores = {}; active.forEach(n => personalScores[n] = 0);
  const bumpScore = (n, d) => { personalScores[n] = (personalScores[n] || 0) + d; };

  // ── PHASE A: THE BAGS — loadout + route choice ──
  const shuffled = active.slice().sort(() => Math.random() - 0.5);
  const P = {};
  shuffled.forEach((n, i) => {
    const item = (i % 2 === 0) ? 'gun' : 'dart';        // ~half guns, ~half darts
    const rv = riverScore(n) + noise(1.5), mt = mtnScore(n) + noise(1.5);
    const route = mt > rv ? 'mountain' : 'river';
    const routeFit = (route === 'mountain' ? mtnScore(n) : riverScore(n));
    P[n] = { name: n, item, loaded: false, route, routeFit, timePen: 0, progress: 4, grabbed: false, grabs: 0, alive: true };
  });
  // odd one out gets handed a loaded gun by the host
  if (shuffled.length % 2 === 1) { const lucky = shuffled[shuffled.length - 1]; P[lucky].item = 'gun'; P[lucky].loaded = true; }
  const river = active.filter(n => P[n].route === 'river');
  const mountain = active.filter(n => P[n].route === 'mountain');
  const loadout = active.map(n => ({ name: n, item: P[n].item, startLoaded: P[n].loaded, route: P[n].route }));

  // helpers over live state
  const isLoaded = (n) => P[n].loaded;
  const armState = (n) => P[n].grabbed ? 'grabbed' : (P[n].loaded ? 'loaded' : P[n].item === 'gun' ? 'gun' : 'dart');
  const armsSnap = () => { const o = {}; active.forEach(n => o[n] = armState(n)); return o; };
  const posSnap = () => { const o = {}; active.forEach(n => o[n] = Math.round(P[n].progress)); return o; };

  const beats = [];
  let clock = 20, prox = 22;
  const addBeat = (b) => {
    beats.push({ ...b, t: mmss(clock), prox: Math.round(prox), stage: proxStage(prox).name, arms: armsSnap(), pos: posSnap() });
  };

  // ── dart economy: barter / give / steal (drives the trust layer) ──
  const gunless = () => active.filter(n => P[n].item === 'gun' && !P[n].loaded && !P[n].grabbed);
  const dartless = () => active.filter(n => P[n].item === 'dart' && !P[n].loaded && !P[n].grabbed);
  const econMax = Math.max(2, Math.floor(active.length / 2));
  for (let e = 0; e < econMax; e++) {
    const guns = gunless(), darts = dartless();
    if (!guns.length || !darts.length) break;
    clock += 8 + Math.random() * 10;
    // pick a gun-holder + dart-holder, weighted a little by existing bond
    const g = guns.slice().sort((a, b) => (getBond(b, pick(darts)) || 0) - (getBond(a, pick(darts)) || 0))[0] || pick(guns);
    let d = darts.slice().sort((a, b) => getBond(g, b) - getBond(g, a))[0] || pick(darts);
    if (g === d) continue;
    const thief = active.find(n => n !== g && P[n].item === 'gun' && !P[n].loaded && !P[n].grabbed && canScheme(n) && getBond(n, d) < 3);

    if (thief && Math.random() < 0.4) {
      // STEAL darts — villain arms up at someone's expense
      P[thief].loaded = true; P[d].item = 'gun'; // victim's darts are gone
      addBond(thief, d, -2.5); bumpPop(thief, -1); bumpScore(thief, 0.5);
      if (!gs._clownHeat) gs._clownHeat = {};
      gs._clownHeat[thief] = { target: d, amount: (gs._clownHeat[thief]?.amount || 0) + 2, expiresEp: (gs.episode || 0) + 3 };
      camp.post.push({ type: 'clownSteal', players: [thief, d], badgeText: 'STOLE DARTS', badgeClass: 'red', tag: 'killer-clown',
        text: `${thief} lifted ${d}'s darts in the dark during Night of the Killer Clown and left ${pronouns(d).obj} holding an empty gun. "Survival of the fittest."` });
      addBeat({ phase: 'stalk', type: 'steal', players: [thief, d], badge: 'STOLE DARTS', badgeClass: 'bad',
        text: draw([
          (x, y) => `${x} bumps ${y} in the dark, all apologies — and walks off with ${pronouns(y).posAdj} darts. By the time ${y} checks the bag, ${x} is gone and loaded. "Every man for himself out here."`,
          (x, y) => `${y} turns ${pronouns(y).posAdj} back for one second. That's all ${x} needs. The darts vanish; ${x}'s empty gun is suddenly very much loaded. ${y} is going to remember this.`,
          (x, y) => `${x} offers to "hold" ${y}'s pack across a tricky stretch — then keeps the darts and hands the pack back light. Cold. Effective. ${y} is now unarmed AND furious.`,
        ], thief, d) });
    } else if (Math.random() < 0.45 && dartless().length >= 1) {
      // GIVE darts (Jade→Logan) — creates a debt, giver goes exposed
      P[g].loaded = true; P[d].item = 'gun'; // d gives away darts, now unarmed gun too — but the debt is real
      addBond(g, d, 2.5); bumpPop(d, 1); bumpScore(d, 0.5);
      addBeat({ phase: 'stalk', type: 'give', players: [d, g], badge: 'HANDED OVER DARTS', badgeClass: 'good',
        text: draw([
          (giver, gun) => `${giver} presses ${pronouns(giver).posAdj} only darts into ${gun}'s empty gun. "You're the better shot. I'll owe you nothing — you'll owe me." ${gun} nods, dead serious. "I've got you."`,
          (giver, gun) => `"Take them." ${giver} loads ${gun}'s gun with ${pronouns(giver).posAdj} own darts and steps back into the dark, defenseless. It's trust, and everyone watching knows the debt just got written.`,
          (giver, gun) => `${giver} could keep the darts and stay safe. Instead ${pronouns(giver).sub} ${pronouns(giver).sub === 'they' ? 'hand' : 'hands'} them to ${gun}. "Cover me when it counts." A bond just got a whole lot deeper.`,
        ], d, g) });
    } else {
      // BARTER — gun + dart pair up, both protected
      P[g].loaded = true; P[d].loaded = true;
      addBond(g, d, 2);
      addBeat({ phase: 'stalk', type: 'barter', players: [g, d], badge: 'ARMED PAIR', badgeClass: 'good',
        text: draw([
          (a, b) => `${a} has the gun, ${b} has the darts. Wary but cornered, they cut a deal — one loaded weapon between them, and they move as a pair. Neither turns their back all the way.`,
          (a, b) => `${a} and ${b} do the math: alone, they're both useless. Together they've got exactly one working dart gun. "Partners. For now." They shake on it in the dark.`,
          (a, b) => `A gun and a fistful of darts find each other. ${a} and ${b} snap the two halves together and grin — suddenly the scariest thing in the forest has something to fear too.`,
          (a, b) => `${a} holds up the empty gun; ${b} rattles the darts. A long look, a short nod, and the deal's done. "Cross me and we both get grabbed." "...Fair." One weapon, two nervous partners.`,
          (a, b) => `${a} and ${b} circle each other, then give in to the obvious: load up, team up, survive. It's not friendship. It's a trigger and a magazine agreeing to share a foxhole.`,
        ], g, d) });
    }
    prox = clamp(prox + 4, 0, 100);
  }

  // ── PHASE B: THE STALK — advance the field, clown hunts the exposed ──
  const waves = clamp(active.length + 4, 8, 14);
  const stunUntil = { v: -1 };  // wave index the field is safe until (after a stun)
  for (let w = 0; w < waves; w++) {
    clock += 10 + Math.random() * 8;
    // advance every un-grabbed player toward the flag
    active.forEach(n => {
      if (P[n].grabbed) return;
      const spd = 5 + (P[n].routeFit + runScore(n)) * 0.45 + noise(3);
      P[n].progress = clamp(P[n].progress + spd, 0, 100);
    });
    prox = clamp(prox + 6 + noise(3), 0, 100);

    // ── ROUTE TRAVERSAL — the river crew and mountain crew each get their own thread ──
    ['river', 'mountain'].forEach(rt => {
      const crew = active.filter(n => P[n].route === rt && !P[n].grabbed && P[n].progress < 95);
      if (crew.length && Math.random() < 0.72) _routeBeat(rt, crew, P, personalScores, addBeat, clock, w);
    });

    // ── clown targets the most exposed player (unloaded, no loaded ally, deep in) ──
    const fieldSafe = w <= stunUntil.v;
    if (!fieldSafe && prox >= 30) {
      const exposed = active.filter(n => !P[n].grabbed && !P[n].loaded && P[n].progress < 96);
      if (exposed.length) {
        // most exposed = lowest evade, weight by low progress
        const target = exposed.slice().sort((a, b) => (evadeScore(a) - P[a].progress * 0.04) - (evadeScore(b) - P[b].progress * 0.04))[0];
        // a loaded ally nearby (same route) can intervene and stun
        const rescuer = active.find(n => n !== target && P[n].loaded && !P[n].grabbed && P[n].route === P[target].route)
          || active.find(n => n !== target && P[n].loaded && !P[n].grabbed);
        const selfStun = P[target].loaded; // (shouldn't happen since target unloaded, but keep safe)
        const canStun = selfStun || (rescuer && (aimScore(rescuer) + noise(2.5) > 3.2));
        const evaded = evadeScore(target) + noise(3) > 7.5;

        if (canStun && rescuer) {
          // STUN — rescuer buries a dart, clears the field five minutes
          prox = 8; stunUntil.v = w + 1;
          bumpScore(rescuer, 2); bumpPop(rescuer, 2); addBond(rescuer, target, 2);
          if (Math.random() < 0.18) {
            // FRIENDLY FIRE — the dart goes wide and clips the person they meant to save
            P[target].timePen += 10; bumpPop(rescuer, -1.5); addBond(rescuer, target, -1.5);
            addBeat({ phase: 'stalk', type: 'friendlyfire', players: [rescuer, target], badge: 'FRIENDLY FIRE', badgeClass: 'bad',
              text: draw([
                (r, t) => `${r} lines up the shot to save ${t} — and the dart sails wide, smacking ${t} square in the head instead of the clown. ${t} goes down cursing; the clown just laughs. Ten seconds gone.`,
                (r, t) => `${r} fires in a panic. The dart clips ${t}, not the seven-foot animatronic bearing down on them. "SORRY — sorry — RUN!" ${t} is not okay. The stun still lands, barely.`,
                (r, t) => `Adrenaline ruins ${r}'s aim. ${t} takes the dart to the shoulder and yelps; the clown stumbles a half-second later on the ricochet. It works. ${t} is furious it worked.`,
              ], rescuer, target) });
          } else {
            addBeat({ phase: 'stalk', type: 'stun', players: rescuer === target ? [target] : [rescuer, target], badge: '5-MIN STUN', badgeClass: 'good',
              text: draw([
                (r, t) => `The clown's glove is inches from ${t} when ${r} steps up, steadies the short-range projector — close, not too close — and buries a dart in its chest. It seizes. Five minutes on the clock. "GO. GO NOW."`,
                (r, t) => `${r} doesn't hesitate: one clean shot to the clown's painted grin and it locks up mid-lunge. ${t} scrambles free. For five whole minutes the forest belongs to the campers again.`,
                (r, t) => `${r} pops up from cover, drops the clown with a dart to the ruff, and hauls ${t} up by the collar. "You owe me one." The stun timer starts ticking; everyone runs.`,
                (r, t) => `A dart thunks home and the animatronic freezes in a horrible half-crouch. ${r} exhales. ${t} is already sprinting. Five minutes — use them.`,
              ], rescuer, target) });
          }
        } else if (evaded) {
          // EVADE — target ducks into cover
          P[target].timePen += 4;
          addBeat({ phase: 'stalk', type: 'evade', players: [target], badge: 'HID', badgeClass: 'neutral',
            text: draw([
              (t) => `${t} drops flat into a bush as the clown sweeps past, close enough to smell the greasepaint. A twig cracks — ${pronouns(t).sub} freeze${pronouns(t).sub === 'they' ? '' : 's'} — and it lumbers on. That cost a few seconds and a year of ${pronouns(t).posAdj} life.`,
              (t) => `${t} presses into the hollow of a dead tree and holds ${pronouns(t).posAdj} breath while the clown's flashlight eyes rake the dark. It moves off. ${t} does not move for a while.`,
              (t) => `No gun, no darts, no chance — so ${t} does the only thing left and goes completely still behind a log. The clown steps over ${pronouns(t).obj} and keeps hunting. ${pronouns(t).Sub} live${pronouns(t).sub === 'they' ? '' : 's'}. Barely.`,
              (t) => `${t} rolls into a ditch and pulls leaves over ${pronouns(t).obj} just as the painted giant clomps by, honking softly to itself. When the honking fades, ${t} finally breathes. Precious seconds, gone.`,
              (t) => `The clown's flashlight-eyes swing ${t}'s way. ${pronouns(t).Sub} duck${pronouns(t).sub === 'they' ? '' : 's'} behind a fat oak, heart slamming, and circle${pronouns(t).sub === 'they' ? '' : 's'} it slowly to keep the trunk between them. It works. It costs.`,
              (t) => `${t} kills ${pronouns(t).posAdj} own flashlight and stands stone-still in the pitch dark, close enough to hear the servos whir. The clown pauses… sniffs the air like it can smell fear… and moves on.`,
            ], target) });
        } else {
          // GRABBED — dragged off, heavy time penalty, returns at the very end
          P[target].grabbed = true; P[target].grabs++;
          P[target].timePen += 42 + Math.random() * 14;
          bumpPop(target, -0.5);
          prox = clamp(prox - 12, 0, 100);
          camp.post.push({ type: 'clownGrab', players: [target], badgeText: 'GRABBED', badgeClass: 'purple', tag: 'killer-clown',
            text: `The clown hauled ${target} off into the dark during Night of the Killer Clown. ${pronouns(target).Sub} ${pronouns(target).sub === 'they' ? 'were' : 'was'} out of the race for a long, long time.` });
          addBeat({ phase: 'stalk', type: 'grab', players: [target], badge: 'GRABBED', badgeClass: 'bad',
            text: draw([
              (t) => `A gloved hand closes on ${t}'s backpack out of nowhere. No gun, no ally, no luck — the clown lifts ${pronouns(t).obj} clean off ${pronouns(t).posAdj} feet and carries ${pronouns(t).obj} off into the trees, boots kicking. ${pronouns(t).Sub}'ll be back. Eventually.`,
              (t) => `${t} never hears it coming. One second ${pronouns(t).sub} ${pronouns(t).sub === 'they' ? 'are' : 'is'} reaching for the map, the next ${pronouns(t).sub} ${pronouns(t).sub === 'they' ? 'are' : 'is'} slung over a giant painted shoulder, hollering into the dark. Race over — for now.`,
              (t) => `The clown steps out of a tree it absolutely should not have fit behind and scoops up ${t} mid-stride. ${pronouns(t).Sub} claw${pronouns(t).sub === 'they' ? '' : 's'} at the dirt for a second, then ${pronouns(t).sub} ${pronouns(t).sub === 'they' ? 'are' : 'is'} just… gone. A huge chunk of time, gone with ${pronouns(t).obj}.`,
              (t) => `${t} makes the mistake of looking back. The clown is already there. A honk, a lunge, and ${pronouns(t).sub} ${pronouns(t).sub === 'they' ? 'are' : 'is'} tucked under one massive arm and hauled off toward wherever it keeps the others. Long walk back from that.`,
              (t) => `It comes up out of the creek mud without a sound and has ${t} by the collar before ${pronouns(t).sub} can scream. ${pronouns(t).PosAdj} flag hits the dirt. So does ${pronouns(t).posAdj} shot at immunity — the clown's got ${pronouns(t).obj} now.`,
              (t) => `${t} trips on a root at exactly the wrong instant. The clown is on ${pronouns(t).obj} like it was waiting for it, folding ${pronouns(t).obj} over a shoulder and lumbering back into the black. Minutes and minutes, just erased.`,
            ], target) });
        }
      }
    }

    // ── 2-3 social beats per wave ──
    _clownSocial(P, active, personalScores, ep, camp, addBeat, prox, w, 2 + (Math.random() < 0.5 ? 1 : 0));
  }

  // ── showmance danger moments (existing couples) ──
  if (seasonConfig.romance !== 'disabled') {
    _checkShowmanceChalMoment(ep, null, null, personalScores, 'danger', [{ members: active }]);
  }

  // ── PHASE C: THE RUN — grab the flag, sprint home ──
  active.forEach(n => {
    const base = 150 - P[n].routeFit * 5;
    const runBack = clamp(40 - runScore(n) * 2.5 + noise(4), 10, 46);
    P[n].returnTime = base + P[n].timePen + runBack;
    P[n].progress = P[n].grabbed ? 70 : 100;
  });

  // a late leader-trap: a schemer near the front drops a branch on the front-runner (Logan→Amelie)
  const order0 = active.filter(n => !P[n].grabbed).sort((a, b) => P[a].returnTime - P[b].returnTime);
  if (order0.length >= 2) {
    const leader = order0[0], chaser = order0[1];
    if (canScheme(chaser) && getBond(chaser, leader) < 4 && Math.random() < 0.55) {
      P[leader].timePen += 26; P[leader].returnTime += 26; P[leader].trapped = true;
      addBond(chaser, leader, -2); bumpPop(chaser, -1); bumpScore(chaser, 1);
      if (!gs._clownHeat) gs._clownHeat = {};
      gs._clownHeat[chaser] = { target: leader, amount: (gs._clownHeat[chaser]?.amount || 0) + 2, expiresEp: (gs.episode || 0) + 3 };
      camp.post.push({ type: 'clownTrap', players: [chaser, leader], badgeText: 'TRAPPED A RIVAL', badgeClass: 'red', tag: 'killer-clown',
        text: `In sight of the finish, ${chaser} shot a branch down onto ${leader} and sprinted past during Night of the Killer Clown. "There's only one winner." ${leader} won't forget it.` });
      addBeat({ phase: 'run', type: 'sabotage', players: [chaser, leader], badge: 'TRAPPED A RIVAL', badgeClass: 'bad',
        text: draw([
          (c, l) => `The camp lights are right there. ${l} is a stride ahead — until ${c} fires a dart into a half-cut branch overhead and drops it square across ${l}'s path. ${l} goes down in a tangle; ${c} sprints past without looking back. "Only one winner."`,
          (c, l) => `${c} can't beat ${l} to the line honest, so ${c} doesn't. A single shot brings a limb crashing down, pinning ${l} ten feet from home. ${c} steps over ${pronouns(l).obj} and keeps running. Cold-blooded.`,
          (c, l) => `${l} has it won — and then a branch comes down out of nowhere, right where ${c}'s dart hit it. ${l} is trapped, screaming; ${c} is already gone. That's the kind of thing that gets a name written down.`,
        ], chaser, leader) });
      prox = clamp(prox + 8, 0, 100);
    }
  }

  // ── final standings ──
  const results = active.map(n => ({
    name: n, route: P[n].route, returnTime: Math.round(P[n].returnTime),
    grabbed: P[n].grabbed, trapped: !!P[n].trapped,
  })).sort((a, b) => a.returnTime - b.returnTime);
  const winnerName = results[0].name;
  const bestTime = results[0].returnTime, worstTime = results[results.length - 1].returnTime;
  results.forEach((r, i) => {
    r.status = i === 0 ? 'flag' : r.grabbed ? 'clown' : r.trapped ? 'trapped' : 'home';
    r.delta = i === 0 ? 0 : r.returnTime - bestTime;
  });

  // winner beat
  bumpScore(winnerName, 3); bumpPop(winnerName, 2);
  addBeat({ phase: 'run', type: 'win', players: [winnerName], badge: 'WINS IMMUNITY', badgeClass: 'good',
    text: draw([
      (n) => `${n} breaks the ring of flashlights first, flag high, chest heaving. Immunity. The clown lumbers out of the tree line behind ${pronouns(n).obj} with an armful of everyone else.`,
      (n) => `Out of the dark and into the light — ${n} slaps the flag down on the camp table before anyone else is even close. Safe. Untouchable. For one more night.`,
      (n) => `${n} doesn't stop running until the flag is home and the hosts are laughing. First back. Immunity won, fair and terrifying.`,
    ], winnerName) });

  camp.post.push({ type: 'clownWin', players: [winnerName], badgeText: 'IMMUNITY', badgeClass: 'green', tag: 'killer-clown',
    text: `${winnerName} was the first back to camp with a flag and won immunity in Night of the Killer Clown.` });

  // ── romance sparks between players thrown together (danger + downtime) ──
  if (seasonConfig.romance !== 'disabled') {
    // pairs that shared a beat get a shot at a spark
    const sharedPairs = [];
    beats.forEach(b => { if (b.players && b.players.length === 2) sharedPairs.push(b.players.slice()); });
    const tried = new Set();
    for (const [a, b] of sharedPairs) {
      const key = [a, b].sort().join('|');
      if (tried.has(key)) continue; tried.add(key);
      if (!romanticCompat(a, b)) continue;
      if (gs.showmances?.some(sh => sh.phase !== 'broken-up' && sh.players.includes(a) && sh.players.includes(b))) continue;
      if (Math.random() < 0.5) {
        const sparked = _challengeRomanceSpark(a, b, ep, null, null, personalScores, 'a near-death moment in the dark');
        if (sparked) {
          addBeat({ phase: 'stalk', type: 'spark', players: [a, b], badge: '💘 SPARKS', badgeClass: 'good',
            text: draw([
              (x, y) => `Pinned behind the same log with the clown ten feet away, ${x} and ${y} end up nose to nose, hearts hammering for two different reasons. When it lumbers off, neither of them moves. Something just started in the dark.`,
              (x, y) => `${x} pulls ${y} down out of the clown's sightline and just… doesn't let go. The stun timer runs. So does whatever this is. The camp is going to have OPINIONS.`,
              (x, y) => `Almost dying together does something to people. ${x} and ${y} come out of the trees muddy, breathless, and grinning at each other like idiots. A showmance, born under a killer clown.`,
            ], a, b) });
          break; // one spark per challenge is plenty
        }
      }
    }
  }

  // ── FINALIZE ──
  ep.killerClown = {
    immunityWinner: winnerName,
    hostOpen: pick(HOST_OPENERS), hostClose: pick(HOST_CLOSERS),
    loadout, routes: { river, mountain },
    beats, results,
    bestTime, worstTime,
  };
  ep.isKillerClown = true;
  ep.challengeType = 'killer-clown';
  ep.challengeLabel = 'Night of the Killer Clown';
  ep.challengeCategory = 'adventure';
  ep.immunityWinner = winnerName;
  ep.tribalPlayers = active;

  // scoring: race time inverts to score (faster = higher), plus social contributions
  ep.chalMemberScores = ep.chalMemberScores || {};
  active.forEach(n => {
    const race = (worstTime + 12 - P[n].returnTime) / 4;   // faster = higher; race dominates
    ep.chalMemberScores[n] = Math.round(((ep.chalMemberScores[n] || 0) + race + (personalScores[n] || 0)) * 10) / 10;
  });
  // the first player home (immunity) must rank #1 — minimal clamp above the field, no heavy inflation
  const maxOther = Math.max(0, ...active.filter(n => n !== winnerName).map(n => ep.chalMemberScores[n] || 0));
  ep.chalMemberScores[winnerName] = Math.max(ep.chalMemberScores[winnerName] || 0, Math.round((maxOther + 1) * 10) / 10);
  ep.chalPlacements = results.map(r => r.name);

  updateChalRecord(ep);
  return ep;
}

// ── ROUTE TRAVERSAL — distinct river (raft/oars/rapids) and mountain
// (climb/scree/broken log bridge/ridge) threads. 1-2 crew per beat, light
// consequences: progress, cooperation bonds, or a stumble. ──
const RIVER_OBST = [
  { badge: 'RIVER · RAFT', two: true, pool: [
    (a, b) => `${a} and ${b} lash driftwood and vines into a raft on the bank, working fast and low so the clown doesn't spot the movement. It floats. Barely. They shove off.`,
    (a, b) => `${a} holds the logs steady while ${b} knots them tight. "If this comes apart in the current we are BOTH clown food." It holds. They ride.`,
    (a, b) => `A half-sunk raft, one paddle, and ${a} and ${b} bailing water with their shoes. Somehow they're making downstream time.`,
    (a, b) => `${a} rigs a raft solo until ${b} wades in to help push it off the mud. Teamwork born of pure terror. Downstream they go.`,
  ] },
  { badge: 'RIVER · OARS', two: false, pool: [
    (a) => `${a} splashes along the shallows hunting for a branch long enough to use as an oar, one eye on the tree line the whole time. Found one. Keep moving.`,
    (a) => `${a} snaps a sapling for a paddle and immediately regrets how loud it was. Somewhere upstream, something big goes still. ${pronouns(a).Sub} paddle${pronouns(a).sub === 'they' ? '' : 's'} faster.`,
    (a) => `No oar, no problem — ${a} paddles the raft with a dinner-plate-sized piece of bark and sheer spite. It's slow. It works.`,
    (a) => `${a} loses the first oar to the current and has to double back for another, cursing the whole time. Time bleeds away.`,
  ] },
  { badge: 'RIVER · RAPIDS', two: false, pool: [
    (a) => `The current grabs ${a} and slings the raft through a chute of white water. ${pronouns(a).Sub} ride${pronouns(a).sub === 'they' ? '' : 's'} it out soaked and swearing — and a lot closer to the flags.`,
    (a) => `${a} hits a rock mid-rapid, spins twice, and comes out the other side somehow still aboard. "I MEANT to do that." Nobody believes ${pronouns(a).obj}.`,
    (a) => `The river narrows and ${a} just holds on and prays through the rapids. Terrifying. Fast. Effective.`,
  ] },
  { badge: 'RIVER · LEAK', two: false, pool: [
    (a) => `${a}'s raft springs a leak halfway across and ${pronouns(a).sub} ${pronouns(a).sub === 'they' ? 'have' : 'has'} to jam a shoe in the gap and paddle one-handed. Slows ${pronouns(a).obj} down, but ${pronouns(a).sub} stay${pronouns(a).sub === 'they' ? '' : 's'} afloat.`,
    (a) => `Water pours over the side and ${a} bails frantically with cupped hands, losing precious seconds to the river.`,
  ] },
];
const MTN_OBST = [
  { badge: 'MOUNTAIN · CLIMB', two: true, pool: [
    (a, b) => `${a} boosts ${b} up a rock face, then ${b} reaches back down and hauls ${a} up after. Two-person climbing on a moonless night. Grim, slow, working.`,
    (a, b) => `${a} finds the handholds and calls them down to ${b} in the dark. "Left foot — no, your OTHER left." They top the ledge together.`,
    (a, b) => `${a} and ${b} chimney up a chute back to back, wedged against the cold stone, inching toward the ridge. The clown can't climb. Probably.`,
  ] },
  { badge: 'MOUNTAIN · BRIDGE', two: false, pool: [
    (a) => `${a} reaches the broken log bridge over the ravine and edges across on hands and knees as it groans. The log cracks the second ${pronouns(a).sub} ${pronouns(a).sub === 'they' ? 'are' : 'is'} clear. Behind ${pronouns(a).obj}, the clown skids to a stop at the gap.`,
    (a) => `The old log bridge is half-rotted. ${a} tests it, decides against thinking too hard, and sprints across as it sways. Made it. Barely.`,
    (a) => `${a} freezes at the broken bridge — then hears the honking behind ${pronouns(a).obj} and suddenly the fifty-foot drop looks very reasonable. Across ${pronouns(a).sub} go${pronouns(a).sub === 'they' ? '' : 'es'}.`,
    (a) => `${a} balances across the gap on a single fallen log, arms wide, not breathing. The clown arrives just as the log gives way behind ${pronouns(a).obj}.`,
  ] },
  { badge: 'MOUNTAIN · SCREE', two: false, pool: [
    (a) => `${a} hits a slope of loose scree and slides half of it back down for every step up, sending rocks clattering into the dark. Loud. Exhausting. Uphill anyway.`,
    (a) => `Loose gravel gives under ${a}'s boots and ${pronouns(a).sub} scramble${pronouns(a).sub === 'they' ? '' : 's'} on all fours up the shifting slope, losing ground and skin.`,
    (a) => `${a} powers up the scree field on pure legs, kicking up a rockslide behind ${pronouns(a).obj} that — bonus — the clown has to wade through.`,
  ] },
  { badge: 'MOUNTAIN · RIDGE', two: false, pool: [
    (a) => `Wind screams across the ridge line and ${a} crawls the exposed spine of the mountain, flag route in sight, clown nowhere up HERE at least.`,
    (a) => `${a} tops out on the ridge, gulps the cold air, and gets ${pronouns(a).posAdj} first clear look at the flags. Almost. Almost.`,
    (a) => `The ridge is a knife-edge and ${a} takes it one careful step at a time, the whole forest black and howling below.`,
  ] },
];
function _routeBeat(rt, crew, P, personalScores, addBeat, clock, wave) {
  const bank = rt === 'river' ? RIVER_OBST : MTN_OBST;
  const obst = pick(bank);
  const a = pick(crew);
  const b = obst.two ? pick(crew.filter(n => n !== a)) : null;
  const players = (obst.two && b) ? [a, b] : [a];
  players.forEach(n => { P[n].progress = clamp(P[n].progress + 5 + Math.random() * 5, 0, 100); });
  let kind = 'neutral';
  if (obst.two && b) { addBond(a, b, 1); personalScores[a] = (personalScores[a] || 0) + 0.3; kind = 'good'; }
  else if (Math.random() < 0.25) { P[a].timePen += 5; kind = 'neutral'; }  // a stumble costs a little time
  const text = (obst.two && b) ? draw(obst.pool, a, b) : draw(obst.pool, a);
  addBeat({ phase: 'stalk', type: 'route', route: rt, players, badge: obst.badge, badgeClass: kind, text });
}

// ── SOCIAL EVENTS during the stalk — weighted catalog, every event with real
// consequences (bonds / popularity / heat / showmances). Fires 1-2 per call. ──
function _clownSocial(P, active, personalScores, ep, camp, addBeat, prox, wave, count) {
  const live = active.filter(n => !P[n].grabbed);
  if (live.length < 2) return;
  const bumpScore = (n, d) => { personalScores[n] = (personalScores[n] || 0) + d; };

  const schemer = live.find(canScheme);
  const heroP = live.find(n => ['hero', 'loyal-soldier'].includes(archOf(n)) || pStats(n).loyalty >= 6);
  const social = live.find(n => archOf(n) === 'social-butterfly' || pStats(n).social >= 7);

  // low-bond pair (rivalry) + a compatible unpaired pair (chemistry)
  let rivalryPair = null, sparkPair = null, minB = 2;
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const a = live[i], b = live[j], bd = getBond(a, b);
    if (bd < minB && (archOf(a) !== archOf(b) || bd <= -1)) { minB = bd; rivalryPair = [a, b]; }
    if (seasonConfig.romance !== 'disabled' && !sparkPair && romanticCompat(a, b)
      && !gs.showmances?.some(sh => sh.phase !== 'broken-up' && sh.players.includes(a) && sh.players.includes(b))) sparkPair = [a, b];
  }

  const events = [];
  const add = (w, type, fire) => events.push({ w, type, fire });

  // ── ABANDON — leave a straggler to the clown ("only one winner") ──
  const exposedAlly = live.find(n => !P[n].loaded && P[n].progress < 80);
  const leaver = live.find(n => n !== exposedAlly && P[n].progress > (exposedAlly ? P[exposedAlly].progress : 0) && !isNice(n));
  if (exposedAlly && leaver && prox >= 40) add(2.6, 'abandon', () => {
    P[exposedAlly].timePen += 12;
    addBond(leaver, exposedAlly, -2); bumpPop(leaver, -1);
    if (!gs._clownHeat) gs._clownHeat = {};
    gs._clownHeat[leaver] = { target: exposedAlly, amount: (gs._clownHeat[leaver]?.amount || 0) + 1, expiresEp: (gs.episode || 0) + 2 };
    addBeat({ phase: 'stalk', type: 'abandon', players: [leaver, exposedAlly], badge: 'LEFT BEHIND', badgeClass: 'bad',
      text: draw([
        (l, a) => `${a} trips and calls for help. ${l} looks back once — then keeps running. "There's only one winner. Sorry." ${a} is left flat-footed and exposed as the clown's shadow grows.`,
        (l, a) => `"We go together!" ${a} pleads. ${l} is already gone. "It's a game," ${l} mutters, not slowing down. ${a} loses ground and gains a grudge.`,
        (l, a) => `${l} could wait the two seconds it'd take to bring ${a} along. ${l} doesn't. ${a} watches ${pronouns(l).obj} vanish into the dark and files it away for tribal.`,
      ], leaver, exposedAlly) });
  });

  // ── HELP / RESCUE — pull a teammate out of the clown's path ──
  if (heroP) add(1.7, 'help', () => {
    const saved = pick(live.filter(n => n !== heroP && !P[n].loaded)) || pick(live.filter(n => n !== heroP));
    if (!saved) return;
    P[saved].timePen = Math.max(0, P[saved].timePen - 8);
    addBond(heroP, saved, 2); bumpPop(heroP, 1.5); bumpScore(heroP, 1);
    addBeat({ phase: 'stalk', type: 'help', players: [heroP, saved], badge: 'RESCUE', badgeClass: 'good',
      text: draw([
        (h, s) => `${s} is frozen at a snapped twig, clown closing in — and ${h} appears out of the dark, grabs ${pronouns(s).posAdj} wrist, and drags ${pronouns(s).obj} into cover. "Breathe. We move on three." Pure instinct.`,
        (h, s) => `${h} doubles back for ${s} when nobody would've blamed ${pronouns(h).obj} for not. "I'm not leaving you out here with THAT." They slip past the clown together.`,
        (h, s) => `A hand out of the shadows — ${h}'s — yanks ${s} off the path a half-second before the clown sweeps through. "Go together or not at all." ${s} won't forget who came back.`,
        (h, s) => `${h} spots ${s} pinned in a bush and doesn't think twice, waving the clown ${pronouns(h).posAdj} way instead. "OVER HERE, you painted freak!" ${s} scrambles free. Fearless, or insane.`,
        (h, s) => `${h} shoulder-checks ${s} out of the clown's reach and eats the glancing blow ${pronouns(s).sub} would've taken. "Move. I'll catch up." A gift ${s} didn't ask for and won't forget.`,
        (h, s) => `The clown lunges for ${s}; ${h} throws a rock at its head to buy the half-second ${s} needs to bolt. "RUN, don't look back!" ${s} runs. ${s} looks back. ${h} is grinning like a lunatic.`,
        (h, s) => `${h} finds ${s} paralyzed in the open and simply refuses to let it end there — grabbing ${pronouns(s).obj} by the pack strap and hauling ${pronouns(s).obj} bodily into the ferns as the clown crashes past.`,
        (h, s) => `"Give me your hand — HAND, now!" ${h} hauls ${s} up a slick bank and out of the clown's path at the last possible second. They lie in the mud, laughing that shaky almost-died laugh.`,
        (h, s) => `${h} could've kept running for the flags. Instead ${pronouns(h).sub} plant${pronouns(h).sub === 'they' ? '' : 's'} ${pronouns(h).ref} between ${s} and the clown and stares it down until ${s} is clear. Real one.`,
      ], heroP, saved) });
  });

  // ── SPLIT / ALLIANCE-TRAVEL — a group moves as one (Amelie's crew) ──
  if (live.length >= 3) add(1.4, 'split', () => {
    const leadr = social || pick(live);
    const crew = live.filter(n => n !== leadr && getBond(n, leadr) >= 0).slice(0, 2);
    if (crew.length < 1) return;
    const group = [leadr, ...crew];
    group.forEach(n => { P[n].timePen = Math.max(0, P[n].timePen - 4); });
    for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) addBond(group[i], group[j], 1);
    addBeat({ phase: 'stalk', type: 'split', players: group.slice(0, 2), badge: 'MOVE AS ONE', badgeClass: 'good',
      text: draw([
        (a, b) => `${a} waves ${b} and the others into a tight knot. "We go together — more eyes, more darts, more chance." They move through the trees as one nervous, six-legged animal. It works.`,
        (a, b) => `${a} splits the map with ${b}: one reads, one watches the dark. Safety in numbers, at least until the flags — when only one of them can win.`,
        (a, b) => `${a}, ${b} and a couple of stragglers band together against the clown, an alliance of pure terror. For now the game can wait. Survival can't.`,
        (a, b) => `${a} lines everyone up back-to-back and moves the whole cluster like a single wary creature, ${b} calling the pace. Slow, but nobody gets picked off alone.`,
        (a, b) => `"Nobody breaks off, nobody's a hero." ${a} and ${b} shepherd the pack down the trail shoulder to shoulder. The clown likes stragglers; tonight there aren't any.`,
        (a, b) => `${a} rigs a little chain — everyone's hand on the next one's pack — and ${b} takes point. A dumb-looking, terrified conga line that somehow keeps them all alive.`,
        (a, b) => `${a} and ${b} agree to pool their one loaded gun and cover the whole group in a moving huddle. It slows them to a crawl, but the clown can't isolate anyone.`,
        (a, b) => `${a} posts ${b} as rear guard with the darts while ${pronouns(a).sub} lead${pronouns(a).sub === 'they' ? '' : 's'} the pack from the front. A little two-person perimeter, walking through hell together.`,
        (a, b) => `${a} calls a whispered huddle: "Same pace, same path, nobody's a hero." ${b} nods and they move the whole knot of people as one careful animal.`,
        (a, b) => `${a} and ${b} take turns walking backward to watch the trail behind while the group presses on. Exhausting, paranoid, and exactly why none of them get picked off.`,
      ], leadr, crew[0]) });
  });

  // ── SABOTAGE — a schemer steers the clown toward a rival ──
  if (schemer && prox >= 45) add(2.0, 'sabotage', () => {
    const victim = pick(live.filter(n => n !== schemer && getBond(schemer, n) < 4)) || pick(live.filter(n => n !== schemer));
    if (!victim) return;
    P[victim].timePen += 10;
    addBond(schemer, victim, -1.5); bumpPop(schemer, -0.5); bumpScore(schemer, 0.5);
    if (!gs._clownHeat) gs._clownHeat = {};
    gs._clownHeat[schemer] = { target: victim, amount: (gs._clownHeat[schemer]?.amount || 0) + 1, expiresEp: (gs.episode || 0) + 2 };
    addBeat({ phase: 'stalk', type: 'sabotage', players: [schemer, victim], badge: 'SABOTAGE', badgeClass: 'bad',
      text: draw([
        (s, v) => `${s} bangs two rocks together and lobs them behind ${v}, then melts into the dark. The clown's head snaps around toward the noise — and toward ${v}. "Not my problem anymore."`,
        (s, v) => `${s} clocks where the clown is looking and quietly herds it ${v}'s way, whistling just loud enough. ${v} suddenly has a seven-foot problem and no idea why.`,
        (s, v) => `A flare of ${s}'s flashlight, aimed to bounce off ${v}'s pack, and the clown locks on. ${s} is already three trees away. Ruthless little play.`,
        (s, v) => `${s} snaps a glowstick and tucks it into the mud right along ${v}'s path, a beacon for the one thing you don't want finding you. ${v} never sees who did it.`,
        (s, v) => `${s} waits until ${v} is mid-climb, then kicks a cascade of pebbles down to draw the clown's ear ${pronouns(v).posAdj} way. "Sorry, ${v}. Game's a game."`,
        (s, v) => `${s} mimics ${v}'s panicked yelp — a decent impression — from just uphill, and the clown pivots toward the real ${v} like a compass finding north. Cold.`,
      ], schemer, victim) });
  });

  // ── ENCOURAGEMENT — social player talks a scared player forward ──
  if (social) add(1.3, 'encourage', () => {
    const down = live.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
    if (!down || down === social) return;
    P[down].timePen = Math.max(0, P[down].timePen - 5);
    addBond(social, down, 1.5); bumpPop(social, 0.5); bumpPop(down, 0.5);
    addBeat({ phase: 'stalk', type: 'encourage', players: [social, down], badge: 'RALLIED', badgeClass: 'good',
      text: draw([
        (s, d) => `${d} is ready to just sit down in the dirt and quit. ${s} grabs ${pronouns(d).posAdj} face. "Hey. It's a guy in a costume and a lot of hydraulics. You've got this. One flag." ${d} breathes, and goes.`,
        (s, d) => `${s} won't let ${d} spiral. "I will be right behind you the whole way. Eyes up. Move." ${d} actually laughs, then runs.`,
        (s, d) => `"You're more scared of losing than of the clown, right? Good. Use that." ${s} points ${d} at the flags and shoves. It's exactly what ${pronouns(d).sub} needed.`,
        (s, d) => `${s} keeps up a steady stream of terrible jokes to keep ${d} moving through the worst of the dark. Ridiculous. Also working. ${d}'s legs stop shaking.`,
        (s, d) => `${s} matches ${d}'s panicked breathing, then slows it down, in and out, until ${d}'s hands stop trembling. "There you are. Now go get your flag." ${d} goes.`,
        (s, d) => `"I have watched you do harder things than this on three hours of sleep," ${s} tells ${d} flatly. "A clown? Please." Somehow it lands, and ${d} squares up.`,
        (s, d) => `${s} catches ${d} about to bolt the wrong way in a panic and turns ${pronouns(d).obj} around by the shoulders. "Flags are THAT way. With me. Now." ${d} nods and moves.`,
        (s, d) => `${s} presses ${pronouns(s).posAdj} own flashlight into ${d}'s shaking hands. "Light leads, fear follows. You go first, I'm right here." It's a small thing. It's everything.`,
        (s, d) => `${d} whispers that ${pronouns(d).sub} can't do it. ${s} just says, quietly, "You already are. Look how far you've come." ${d} looks back at the dark ${pronouns(d).sub} crossed — and keeps going.`,
        (s, d) => `${s} starts humming the campiest, dumbest song imaginable until ${d} is laughing too hard to be scared. "See? Can't be terrified and cringing at once. Move those feet."`,
      ], social, down) });
  });

  // ── SHOWMANCE SPARK — danger throws a compatible pair together ──
  if (seasonConfig.romance !== 'disabled' && sparkPair && prox >= 40) add(1.8, 'spark', () => {
    const [a, b] = sparkPair;
    const sparked = _challengeRomanceSpark(a, b, ep, null, null, personalScores, 'hiding from the clown together');
    if (sparked) {
      addBeat({ phase: 'stalk', type: 'spark', players: [a, b], badge: '💘 SPARKS', badgeClass: 'good',
        text: draw([
          (x, y) => `${x} and ${y} dive into the same bush to hide and end up tangled together, way too close, hearts going for reasons that aren't all fear. The clown passes. Neither of them mentions it. Everyone will.`,
          (x, y) => `Sharing one loaded gun and one hiding spot does something to ${x} and ${y}. They come out of the dark holding hands and pretending they weren't. Showmance, incoming.`,
        ], a, b) });
    } else {
      addBond(a, b, 1);
      addBeat({ phase: 'stalk', type: 'chemistry', players: [a, b], badge: 'CHEMISTRY', badgeClass: 'good',
        text: draw([
          (x, y) => `${x} shields ${y} from the clown's flashlight sweep and holds the look a beat too long once it passes. Nothing said. Everything felt.`,
          (x, y) => `In the middle of the terror, ${x} and ${y} keep finding excuses to stick together. Strategy, they'd both swear. The dark says otherwise.`,
          (x, y) => `${x} and ${y} whisper-argue about the map, standing much closer than the map requires. The camp is going to have a field day.`,
          (x, y) => `${x} makes ${y} laugh in the middle of the scariest night of the season, and for a second neither of them is thinking about the clown at all.`,
          (x, y) => `${x} reaches for ${y}'s hand in the dark "so they don't get separated," holds it three beats longer than necessary, and neither of them lets go first.`,
        ], a, b) });
    }
  });

  // ── RIVALRY — two who don't get along clash at the flags ──
  if (rivalryPair) add(1.3, 'rivalry', () => {
    const [a, b] = rivalryPair;
    addBond(a, b, -1.5); bumpPop(a, -0.5);
    if (Math.random() < 0.3) { if (!gs._clownHeat) gs._clownHeat = {}; gs._clownHeat[a] = { target: b, amount: (gs._clownHeat[a]?.amount || 0) + 1, expiresEp: (gs.episode || 0) + 2 }; }
    addBeat({ phase: 'stalk', type: 'rivalry', players: [a, b], badge: 'RIVALRY', badgeClass: 'bad',
      text: draw([
        (x, y) => `${x} and ${y} reach the same flag at the same second and immediately start shouting over who earned it — loud enough that the stun timer suddenly feels very, very short. "Keep it down, you'll bring it back!" "YOU keep it down!"`,
        (x, y) => `The pressure cracks ${x} and ${y} open. "You slowed me down the WHOLE way!" "I saved your life twice!" It's ugly, it's personal, and it's headed straight to tribal.`,
        (x, y) => `${x} shoves past ${y} for the last flag; ${y} shoves right back. Two people who can't stand each other, one strip of cloth, zero grace.`,
        (x, y) => `"I'd rather the clown got you than you got immunity," ${x} snaps at ${y}. Nobody's laughing. That feud just got deeper.`,
        (x, y) => `${x} accuses ${y} of steering the clown ${pronouns(x).posAdj} way on purpose. ${y} doesn't exactly deny it. The two of them nearly forget there's a seven-foot animatronic listening.`,
        (x, y) => `${y} takes the flag ${x} had ${pronouns(x).posAdj} hand on first. "That's MINE." "Prove it." They're still hissing at each other when the flashlights find them.`,
        (x, y) => `Old business boils over in the dark: ${x} and ${y} trade blame for every bad call all season, right there at the flag line. Whoever loses tonight blames the other. Guaranteed.`,
        (x, y) => `${x} deliberately kicks over the log ${y} was about to cross and keeps walking. ${y}'s jaw drops. "Oh, it's LIKE that?" It is very much like that now.`,
        (x, y) => `${y} "accidentally" points the clown's attention at ${x} with a too-loud cough, then plays innocent. ${x} clocks it instantly. This ends at tribal, one way or another.`,
      ], a, b) });
  });

  // ── RESPECT — a gutsy play earns grudging respect ──
  if (live.length >= 2 && prox >= 35) add(1.2, 'respect', () => {
    const doer = live.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    const witness = pick(live.filter(n => n !== doer && getBond(n, doer) < 3)) || pick(live.filter(n => n !== doer));
    if (!doer || !witness) return;
    addBond(doer, witness, 1.5); bumpPop(doer, 1);
    addBeat({ phase: 'stalk', type: 'respect', players: [doer, witness], badge: 'RESPECT', badgeClass: 'good',
      text: draw([
        (d, w) => `${d} walks straight up to the clown to draw it off the group like it's nothing. ${w}, who never rated ${d}, just stares. "...Okay. That was actually kind of incredible."`,
        (d, w) => `Even ${w} — no fan of ${d} — has to give it up after that. "I didn't think ${d} had it in ${pronouns(d).obj}. I was wrong." Respect, earned in the dark.`,
        (d, w) => `${d} takes a hit meant for the whole group and keeps ${pronouns(d).posAdj} feet. ${w} claps, almost against ${pronouns(w).posAdj} will.`,
      ], doer, witness) });
  });

  if (!events.length) return;
  const want = Math.max(1, count || 1);
  const pool = events.slice(), chosen = [];
  for (let k = 0; k < want && pool.length; k++) {
    // downweight event TYPES already used this run so variety spreads across the whole hunt
    const eff = pool.map(e => e.w / (1 + (_typeUsed[e.type] || 0) * 1.7));
    const total = eff.reduce((s, w) => s + w, 0);
    let roll = Math.random() * total, idx = 0;
    for (let i = 0; i < pool.length; i++) { roll -= eff[i]; if (roll <= 0) { idx = i; break; } }
    const [e] = pool.splice(idx, 1);
    _typeUsed[e.type] = (_typeUsed[e.type] || 0) + 1;
    chosen.push(e);
  }
  chosen.forEach(e => e.fire());
}

// ══════════════════════════════════════════════════════════════════════
// VP + TEXT are in killer-clown-vp.js
// ══════════════════════════════════════════════════════════════════════
export { rpBuildClownTitleCard, rpBuildClownStalk, rpBuildClownRun, clownRevealNext, clownRevealAll } from './killer-clown-vp.js';
