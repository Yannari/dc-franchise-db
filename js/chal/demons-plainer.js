// ══════════════════════════════════════════════════════════════════════
// demons-plainer.js — Demon's Plainer (DC4 S4E1)
// Schedule-adaptive carnival challenge.
//   • Episode 1 (pre-merge, first challenge): Shelter Scramble → Demon's Plainer
//   • Any other pre-merge slot: Demon's Plainer only (tribe vs tribe)
//   • Post-merge: Demon's Plainer only (individual immunity)
// Phase A = forest/dusk shelter build. Phase B = neon carnival flag-memory coaster.
// ══════════════════════════════════════════════════════════════════════
import { gs, seasonConfig, players } from '../core.js';
import { pStats, pronouns, romanticCompat, updateChalRecord } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';
import { currentSetting } from '../settings.js';

// ── venue flavor: the shelter is built at the season's camp, so its scavenged
// scrap, scenery, and startle reflect the SETTING (not always a carnival) ──
const VENUE_FLAVOR = {
  'hosted-camp': {
    scrapWord: 'whatever the camp has lying around',
    startle: ['A loon bursts up off the lake', 'A raccoon shoots out from under the porch', 'A bat swoops down out of the rafters'],
    sketchSpot: 'a rotting canoe', haul: 'a whole picnic table',
    themeMaterial: 'A faded camp banner', themeLook: 'mismatched camp-craft junk and a crooked porch rail',
    wanderScene: 'the boathouse',
  },
  'survival-island': {
    scrapWord: 'driftwood, bamboo, and whatever washes ashore',
    startle: ['A wild boar crashes out of the brush', 'A seabird explodes off the rocks', "A crab scuttles across someone's foot"],
    sketchSpot: 'a piece of driftwood', haul: 'a whole bamboo trunk',
    themeMaterial: 'A bleached palm frond', themeLook: 'lashed bamboo and a driftwood arch',
    wanderScene: 'the treeline',
  },
  'carnival': {
    scrapWord: 'busted carnival scrap',
    startle: ['A pigeon clatters out of a dead ride booth', 'A busted animatronic lurches to life', 'An owl flaps out of the funhouse'],
    sketchSpot: 'a busted carousel horse', haul: 'a whole Ferris-wheel cart',
    themeMaterial: 'A salvaged carousel banner', themeLook: 'mismatched carnival colors and a crooked ticket-booth facade',
    wanderScene: 'a shuttered funhouse',
  },
  'film-lot': {
    scrapWord: 'salvaged set pieces and props',
    startle: ['A prop animatronic lurches out of the dark', 'A pigeon flaps down from the rafters', 'A fog machine hisses to life in the dark'],
    sketchSpot: 'a fake storefront facade', haul: 'a whole plywood set flat',
    themeMaterial: 'A painted set backdrop', themeLook: 'salvaged set-dressing and a fake storefront facade',
    wanderScene: 'a dark soundstage',
  },
  'world-tour': {
    scrapWord: 'salvaged cabin panels and cargo',
    startle: ['A stray bird flaps out of the cargo hold', 'The intercom shrieks with feedback', 'A luggage cart rolls loose down the aisle'],
    sketchSpot: 'a dented beverage cart', haul: 'a whole cargo pallet',
    themeMaterial: 'A first-class curtain', themeLook: 'salvaged cabin panels and a crooked beverage-cart bar',
    wanderScene: 'the cargo hold',
  },
};
function venue() { return VENUE_FLAVOR[currentSetting()] || VENUE_FLAVOR['carnival']; }

// ── small helpers ──
function noise(mag) { return (Math.random() - 0.5) * 2 * mag; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function archOf(name) { return players.find(p => p.name === name)?.archetype || 'floater'; }
function bumpPop(name, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; }
function survOf(name) { if (!gs.survival) gs.survival = {}; if (gs.survival[name] == null) gs.survival[name] = 80; return gs.survival[name]; }
function bumpSurv(name, d) { gs.survival[name] = clamp(survOf(name) + d, 0, 100); }

// ── archetype leadership weighting ──
const LEADER_BONUS = {
  hero: 3, 'social-butterfly': 3, mastermind: 2.5, schemer: 2, 'loyal-soldier': 2,
  villain: 1.5, 'challenge-beast': 1.5, 'perceptive-player': 1.5, showmancer: 1, hothead: 1,
  wildcard: 0, 'chaos-agent': 0, 'underdog': -0.5, floater: -1, goat: -1,
};
const NICE = ['hero', 'social-butterfly', 'loyal-soldier', 'showmancer', 'underdog', 'goat'];
const COMMANDING = ['villain', 'mastermind', 'schemer', 'hothead'];
function captainStyleOf(name) {
  const a = archOf(name);
  if (NICE.includes(a)) return 'inspiring';
  if (COMMANDING.includes(a)) return 'commanding';
  return 'pragmatic';
}
function canScheme(name) {
  const a = archOf(name);
  if (COMMANDING.includes(a) && a !== 'hothead') return true;
  if (a === 'villain') return true;
  if (NICE.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

const FLAG_COLORS = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'TEAL'];
const OPENERS = [
  "First challenge of the season, campers! Your home for the next few weeks is out there somewhere — go find it, and build something you won't hate sleeping in.",
  "Survival starts NOW. Find your camp, build a shelter from whatever junk you can scavenge, and pray it doesn't rain.",
  "Today you build shelter. Tonight, the sky decides if you chose wisely. No pressure.",
  "Grab your teams and get moving. There's a storm rolling in, and only the winning shelter gets the tarp.",
];
const COASTER_OPENERS = [
  "Say hello to the Demon's Plainer — the number one coaster on this whole cursed midway. Ride it, memorize the flags you pass, and rebuild the order at the bottom.",
  "Your next challenge is strapped to sixty feet of screaming steel. Watch the colored flags on the way down. Get the order right — or ride it again.",
  "Everybody on the Demon's Plainer. Eyes open, stomachs empty. Memorize the flag order. First team to rebuild it wins the sleeping bags.",
  "The Demon's Plainer eats memories for breakfast. Ride, remember, reassemble. Mess it up and two of you go again.",
];
const CLOSERS = [
  "And that's a wrap on day one. Some of you slept dry. Some of you didn't. Welcome to the game.",
  "Sleeping bags to the winners, cold hard nothing to the losers. See you at the next ride.",
  "The Demon's Plainer claims another set of stomachs. Great television.",
];

// ══════════════════════════════════════════════════════════════════════
// PHASE A — SHELTER SCRAMBLE  (episode 1 only, tribes)
// ══════════════════════════════════════════════════════════════════════

const TREK_BEATS = [
  { id: 'snail', tag: 'off-put', badge: 'OFF-PUTTING', cls: 'bad',
    pick: (m) => m.filter(n => ['chaos-agent', 'wildcard', 'villain', 'mastermind'].includes(archOf(n)) || pStats(n).temperament <= 4),
    run: (actor, tribe, add) => {
      const pr = pronouns(actor);
      const witness = pick(tribe.members.filter(n => n !== actor)) || null;
      add({ actor, target: witness, type: 'off-put', badgeText: 'OFF-PUTTING', badgeClass: 'bad',
        text: pick([
          `${actor} stops on the trail to study a snail — then crushes it "to see the colors inside." ${witness || 'The others'} recoil${witness ? 's' : ''}.`,
          `${actor} pockets a dead beetle, dissects a mushroom, and narrates it all cheerfully. ${witness || 'The tribe'} keep${witness ? 's' : ''} a careful distance.`,
          `Everyone freezes as ${actor} pulls the wings off a moth "for science." ${witness || 'Nobody'} know${witness ? 's' : ''} what to say.`,
        ]) });
      bumpPop(actor, -1);
      if (witness) addBond(actor, witness, -1);
    } },
  { id: 'owl', tag: 'scare', badge: 'JUMP SCARE', cls: 'neutral',
    pick: (m) => m,
    run: (actor, tribe, add) => {
      const others = tribe.members.filter(n => n !== actor);
      const brave = others.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
      const scared = others.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
      if (!brave || !scared) return;
      const st = pick(venue().startle);
      add({ actor: brave, target: scared, type: 'encourage', badgeText: 'STEADIED', badgeClass: 'good',
        text: pick([
          `${st} and the whole tribe screams. ${brave} laughs it off and steadies a rattled ${scared}.`,
          `${st} and ${scared} bolts — ${brave} grabs ${pronouns(scared).obj}, cracks a joke, and gets everyone moving again.`,
          `${st} — ${scared} yelps; ${brave} plays it cool and calms the group.`,
        ]) });
      addBond(brave, scared, 1); bumpPop(brave, 1);
    } },
  { id: 'poison', tag: 'prank', badge: 'PRANK', cls: 'bad',
    pick: (m) => m.filter(n => canScheme(n)),
    run: (actor, tribe, add) => {
      const victim = pick(tribe.members.filter(n => n !== actor && getBond(actor, n) < 3)) || pick(tribe.members.filter(n => n !== actor));
      if (!victim) return;
      const pr = pronouns(victim);
      add({ actor, target: victim, type: 'scheme', badgeText: 'DIRTY TRICK', badgeClass: 'bad',
        text: pick([
          `${actor} "forgets" to mention the reddish leaves by the latrine bush. ${victim} finds out the itchy way, and clocks exactly who stayed quiet.`,
          `"Restroom's over there," ${actor} tells ${victim}, conveniently omitting the poison ivy. ${pr.Sub} return${pr.sub === 'they' ? '' : 's'} scratching and furious.`,
          `${actor} watches ${victim} wade straight into the bad leaves and says nothing until it's too late. Comedy for one, misery for the other.`,
        ]) });
      addBond(actor, victim, -2); bumpPop(actor, -1);
      if (!gs._schemeHeat) gs._schemeHeat = {};
    } },
  { id: 'wander', tag: 'wander', badge: 'WANDERED OFF', cls: 'neutral',
    pick: (m) => m.filter(n => ['wildcard', 'chaos-agent', 'floater'].includes(archOf(n)) || pStats(n).social <= 4),
    run: (actor, tribe, add, ctx) => {
      const pr = pronouns(actor);
      const v = venue();
      add({ actor, target: null, type: 'wander', badgeText: 'MIA', badgeClass: 'neutral',
        text: pick([
          `The tribe arrives at camp and realizes ${actor} is gone — found later painting a self-portrait instead of hauling scrap.`,
          `${actor} drifts off to "observe the deconstruction of civilization" and misses the first haul entirely. The others notice the missing hands.`,
          `Nobody can find ${actor}. ${pr.Sub}'${pr.sub === 'they' ? 're' : 's'} sketching ${v.sketchSpot} while everyone else works.`,
        ]) });
      ctx.buildMod -= 1.2;
      const annoyed = pick(tribe.members.filter(n => n !== actor)); if (annoyed) addBond(actor, annoyed, -1);
    } },
  { id: 'showoff', tag: 'haul', badge: 'POWER HAUL', cls: 'good',
    pick: (m) => m.filter(n => ['challenge-beast', 'hero'].includes(archOf(n)) || pStats(n).physical >= 7),
    run: (actor, tribe, add, ctx) => {
      const pr = pronouns(actor);
      add({ actor, target: null, type: 'haul', badgeText: 'POWER HAUL', badgeClass: 'good',
        text: pick([
          `${actor} shoulders ${venue().haul} alone and hauls it back to camp. The tribe cheers; the build gets a real head start.`,
          `${actor} tears a beam free with bare hands and hauls double what anyone else can carry. Pure muscle, pure momentum.`,
          `While others pair up on the heavy stuff, ${actor} just... carries it. All of it. Show-off, but effective.`,
        ]) });
      ctx.buildMod += 1.5; bumpPop(actor, 1);
    } },
  { id: 'lost', tag: 'lost', badge: 'COURSE CORRECT', cls: 'good',
    pick: (m) => m,
    run: (actor, tribe, add, ctx) => {
      const guide = tribe.members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      if (!guide) return;
      add({ actor: guide, target: null, type: 'navigate', badgeText: 'GOOD INSTINCT', badgeClass: 'good',
        text: pick([
          `The tribe takes a wrong fork on the way in and starts to circle back — ${guide} reads the tracks and cuts a straight line to camp.`,
          `Everyone's turned around until ${guide} points at a landmark and gets the tribe back on route, saving precious build time.`,
          `${guide} notices the sun angle and overrules the group's wrong turn. Camp's found in half the time.`,
        ]) });
      ctx.buildMod += 1; bumpPop(guide, 1);
    } },
  { id: 'bond-trek', tag: 'bond', badge: 'BONDED', cls: 'good',
    pick: (m) => m.length >= 2 ? m : [],
    run: (actor, tribe, add, ctx, ep) => {
      const others = tribe.members.filter(n => n !== actor);
      const buddy = others.slice().sort((a, b) => (pStats(b).social - Math.abs(getBond(actor, b))) - (pStats(a).social - Math.abs(getBond(actor, a))))[0];
      if (!buddy) return;
      add({ actor, target: buddy, type: 'bond', badgeText: 'BONDED', badgeClass: 'good',
        text: pick([
          `${actor} and ${buddy} fall into step on the long walk in, trading stories. By camp they're already a two-person unit.`,
          `The trek gives ${actor} and ${buddy} time to actually talk. Something clicks — the start of a real alliance.`,
          `${actor} and ${buddy} split a canteen and a laugh on the trail. Trust, brick one.`,
        ]) });
      addBond(actor, buddy, 2);
      if (seasonConfig.romance && romanticCompat(actor, buddy)) _challengeRomanceSpark(actor, buddy, ep, null, null);
    } },
];

const MATERIAL_BEATS = [
  { id: 'log-help', badge: 'TEAMWORK', cls: 'good',
    run: (tribe, add, ctx) => {
      const strong = tribe.members.slice().sort((a, b) => pStats(b).physical - pStats(a).physical)[0];
      const weak = tribe.members.filter(n => n !== strong).slice().sort((a, b) => pStats(a).physical - pStats(b).physical)[0];
      if (!strong || !weak) return;
      add({ actor: strong, target: weak, type: 'help', badgeText: 'TEAMWORK', badgeClass: 'good',
        text: pick([
          `${weak} can't budge a waterlogged log alone. ${strong} grabs the other end without being asked, and it moves.`,
          `${strong} spots ${weak} struggling under a beam and takes the heavy side. Quiet, decent teamwork.`,
          `A support post nearly crushes ${weak}; ${strong} catches it and they carry it in together.`,
        ]) });
      addBond(strong, weak, 1); ctx.buildMod += 0.8;
    } },
  { id: 'slacker', badge: 'DEAD WEIGHT', cls: 'bad',
    run: (tribe, add, ctx) => {
      const slacker = tribe.members.slice().sort((a, b) => (pStats(a).physical + pStats(a).loyalty) - (pStats(b).physical + pStats(b).loyalty))[0];
      const witness = pick(tribe.members.filter(n => n !== slacker));
      if (!slacker) return;
      add({ actor: slacker, target: witness || null, type: 'slack', badgeText: 'DEAD WEIGHT', badgeClass: 'bad',
        text: pick([
          `${slacker} finds a shady spot and "supervises" while everyone else lifts. ${witness || 'The tribe'} clock${witness ? 's' : ''} it and file${witness ? 's' : 's'} it away.`,
          `Somehow ${slacker} is always holding the clipboard and never the lumber. It doesn't go unnoticed.`,
          `${slacker} takes three water breaks per plank. The others start doing math on who's actually useful.`,
        ]) });
      bumpPop(slacker, -1); ctx.buildMod -= 0.8; if (witness) addBond(slacker, witness, -1);
    } },
  { id: 'beam-drop', badge: 'ACCIDENT', cls: 'bad',
    run: (tribe, add, ctx) => {
      const boss = ctx.captain;
      const victim = pick(tribe.members.filter(n => n !== boss)) || pick(tribe.members);
      if (!victim) return;
      const pr = pronouns(victim);
      add({ actor: boss, target: victim, type: 'mishap', badgeText: 'BEAM DROP', badgeClass: 'bad',
        text: pick([
          `Carrying a beam four-wide, someone lets go early and it lands on ${victim}'s foot. ${pr.Sub} hobble${pr.sub === 'they' ? '' : 's'} for the rest of the build.`,
          `A prop crossbeam slips and clips ${victim}. Nothing broken, but a bruise and a grudge.`,
          `${victim} takes a dropped plank to the shin. The apology is thin; the limp is real.`,
        ]) });
      bumpSurv(victim, -4); addBond(victim, boss, -1);
    } },
  { id: 'respect', badge: 'RESPECT', cls: 'good',
    run: (tribe, add, ctx) => {
      if (tribe.members.length < 2) return;
      const a = pick(tribe.members);
      const b = pick(tribe.members.filter(n => n !== a));
      if (!a || !b) return;
      add({ actor: a, target: b, type: 'respect', badgeText: 'RESPECT', badgeClass: 'good',
        text: pick([
          `${a} pitches a wild theme for the shelter; ${b} builds on it instead of shooting it down. Ideas bounce, respect grows.`,
          `${a} gets a detail wrong about ${b} and, corrected, just says "my bad — noted." ${b} appreciates that more than the apology.`,
          `${b} floats a wild design idea and ${a} actually listens. Small moment, real trust.`,
        ]) });
      addBond(a, b, 1);
    } },
  { id: 'faux-pas', badge: 'AWKWARD', cls: 'bad',
    run: (tribe, add, ctx) => {
      if (tribe.members.length < 2) return;
      const a = pick(tribe.members);
      const b = pick(tribe.members.filter(n => n !== a));
      if (!a || !b) return;
      add({ actor: a, target: b, type: 'faux-pas', badgeText: 'AWKWARD', badgeClass: 'bad',
        text: pick([
          `${a} tries to compliment ${b}'s work and somehow makes it weird. ${b} smiles politely and takes a step back.`,
          `${a} means it as friendly. It does not land as friendly. ${b} files ${a} under "keep at arm's length."`,
          `An ill-judged joke from ${a} kills the mood at the build site. ${b} isn't laughing.`,
        ]) });
      addBond(a, b, -1);
    } },
];

const CONSTRUCT_BEATS = [
  { id: 'design-star', badge: 'MASTER BUILD', cls: 'good',
    run: (tribe, add, ctx) => {
      const brain = tribe.members.slice().sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
      if (!brain) return;
      add({ actor: brain, target: null, type: 'design', badgeText: 'MASTER BUILD', badgeClass: 'good',
        text: pick([
          `${brain} sketches a lean-to with a real load-bearing frame in the dirt, and the tribe finally has a plan worth following.`,
          `${brain} figures out how to lash the joints so the whole thing won't fold in wind. Suddenly the shelter looks like a shelter.`,
          `${brain} re-angles the roof to shed rain and reinforces the base. Engineering, on a scavenger's budget.`,
        ]) });
      ctx.sturdiness += 2; bumpPop(brain, 1);
    } },
  { id: 'theme-pitch', badge: 'STYLE POINTS', cls: 'good',
    run: (tribe, add, ctx) => {
      const bold = tribe.members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
      if (!bold) return;
      const v = venue();
      add({ actor: bold, target: null, type: 'theme', badgeText: 'STYLE POINTS', badgeClass: 'good',
        text: pick([
          `${bold} insists they decorate — "if we're sleeping in it, it should slap." ${v.themeMaterial} becomes a front door.`,
          `${bold} gives the shelter a whole aesthetic: ${v.themeLook}. It's ridiculous. It's kind of great.`,
          `${bold} talks the tribe into style points, betting the judge cares about theme. Bold call.`,
        ]) });
      ctx.theme += 2; bumpPop(bold, 1);
    } },
  { id: 'infight', badge: 'FRICTION', cls: 'bad',
    run: (tribe, add, ctx) => {
      if (tribe.members.length < 2) return;
      const hot = tribe.members.slice().sort((a, b) => (pStats(a).temperament) - (pStats(b).temperament))[0];
      const other = tribe.members.filter(n => n !== hot).slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
      if (!hot || !other) return;
      add({ actor: hot, target: other, type: 'infight', badgeText: 'FRICTION', badgeClass: 'bad',
        text: pick([
          `${hot} and ${other} both "know" the right way to tie the roof and neither will bend. Ten minutes lost to arguing.`,
          `A design fight between ${hot} and ${other} turns personal. The shelter waits while egos duel.`,
          `${hot} snaps at ${other} over where the door goes. The tribe works around the tension.`,
        ]) });
      addBond(hot, other, -2); ctx.sturdiness -= 1;
    } },
  { id: 'mole-sabotage', badge: 'SABOTAGE', cls: 'bad', moleOnly: true,
    run: (tribe, add, ctx) => {
      const sab = tribe.members.find(n => canScheme(n) && pStats(n).strategic >= 6);
      if (!sab) return;
      add({ actor: sab, target: null, type: 'sabotage', badgeText: 'SABOTAGE', badgeClass: 'bad',
        text: pick([
          `${sab} "helps" with the frame and quietly ties a knot that won't hold. Nobody sees it. Yet.`,
          `While the tribe hustles, ${sab} loosens a key support just enough to matter later. Textbook quiet sabotage.`,
          `${sab} volunteers for the hardest joint and does it deliberately wrong. The build looks fine. It isn't.`,
        ]) });
      ctx.sturdiness -= 2;
    } },
];

function _runShelter(ep, active, scores, campEvents) {
  const tribes = gs.tribes.map(t => ({ name: t.name, color: t.color, members: t.members.filter(m => active.includes(m)) }))
    .filter(t => t.members.length > 0);

  // dedupe beat TYPES across tribes so the same event doesn't repeat for every team
  const usedTrek = new Set(), usedMat = new Set(), usedCon = new Set();
  // prefer beats not yet used by another tribe (unused first, then random)
  const preferUnused = (pool, used) => pool.slice().sort((a, b) => {
    const ua = used.has(a.id) ? 1 : 0, ub = used.has(b.id) ? 1 : 0;
    return ua !== ub ? ua - ub : Math.random() - 0.5;
  });

  const tribeData = [];
  for (const tribe of tribes) {
    const events = [];
    const add = (e) => events.push(e);
    // captain = leadership (social+strategic)/2 + archetype bonus + noise
    const captain = tribe.members.slice().sort((a, b) => {
      const la = (pStats(a).social + pStats(a).strategic) / 2 + (LEADER_BONUS[archOf(a)] || 0);
      const lb = (pStats(b).social + pStats(b).strategic) / 2 + (LEADER_BONUS[archOf(b)] || 0);
      return lb - la;
    })[0];
    const style = captainStyleOf(captain);
    const ctx = { captain, buildMod: 0, sturdiness: 0, theme: 0 };

    // ── Beat 1: trek (2-3 events) — distinct beats per tribe where possible ──
    const trekPool = TREK_BEATS.filter(b => b.pick(tribe.members).length > 0);
    const trekCount = Math.min(trekPool.length, 2 + (Math.random() < 0.6 ? 1 : 0));
    const shuffledTrek = preferUnused(trekPool, usedTrek).slice(0, trekCount);
    for (const beat of shuffledTrek) {
      usedTrek.add(beat.id);
      const actor = pick(beat.pick(tribe.members));
      if (actor) beat.run(actor, tribe, add, ctx, ep);
    }

    // ── Beat 2: captain emerges ──
    _captainBeat(captain, style, tribe, add, ctx);

    // ── Beat 3: materials (2 events) — distinct beats per tribe where possible ──
    const matPool = preferUnused(MATERIAL_BEATS, usedMat).slice(0, 2 + (Math.random() < 0.5 ? 1 : 0));
    for (const beat of matPool) { usedMat.add(beat.id); beat.run(tribe, add, ctx); }

    // ── Beat 4: construction (1-2 events) ──
    const hasMole = tribe.members.some(n => canScheme(n) && pStats(n).strategic >= 6 && pStats(n).loyalty <= 4);
    const conPool = CONSTRUCT_BEATS.filter(b => !b.moleOnly || (hasMole && Math.random() < 0.5));
    const conChosen = conPool.filter(b => b.moleOnly).concat(
      preferUnused(conPool.filter(b => !b.moleOnly), usedCon).slice(0, 2));
    for (const beat of conChosen) { usedCon.add(beat.id); beat.run(tribe, add, ctx); }

    // ── build score ──
    let raw = 0;
    for (const m of tribe.members) {
      const s = pStats(m);
      raw += s.physical * 0.35 + s.mental * 0.35 + s.social * 0.25 + noise(2.2);
    }
    const avg = raw / tribe.members.length;
    const leadMult = 1 + (((pStats(captain).social + pStats(captain).strategic) / 2 + (LEADER_BONUS[style === 'inspiring' ? 'hero' : archOf(captain)] || 0)) * 0.015) + ctx.captainBonus;
    const buildScore = avg * leadMult + ctx.buildMod;
    const sturdiness = clamp(avg * 0.5 + ctx.sturdiness + noise(1.5), 0, 20);
    const themeScore = clamp(avg * 0.35 + ctx.theme + noise(1.5), 0, 20);
    const judged = sturdiness + themeScore;

    // small contribution to overall challenge score (coaster dominates)
    for (const m of tribe.members) scores[m] += buildScore * 0.15;

    tribeData.push({ name: tribe.name, color: tribe.color, members: tribe.members, captain, style, events, buildScore, sturdiness: Math.round(sturdiness * 10) / 10, themeScore: Math.round(themeScore * 10) / 10, judged });
  }

  // ── judging: winner = highest judged (sturdiness + theme) ──
  tribeData.sort((a, b) => b.judged - a.judged);
  const winner = tribeData[0];
  const losers = tribeData.slice(1);
  winner.wonTarp = true;

  // ── nightfall payoff ──
  const nightEvents = [];
  // winner: tarp → dry night, survival + bonding
  for (const m of winner.members) bumpSurv(m, 8);
  if (winner.members.length >= 2) {
    const a = pick(winner.members), b = pick(winner.members.filter(n => n !== a));
    if (a && b) { addBond(a, b, 1); nightEvents.push({ tribe: winner.name, kind: 'dry', text: pick([
      `Under the tarp, ${winner.name} stays bone dry. ${a} and ${b} trade whispers about who to trust while the rain drums overhead.`,
      `The tarp holds. ${winner.name} sleeps warm and smug, already talking numbers.`,
      `${winner.name} lucked into a dry night. ${a} and ${b} use it to lock something in.`,
    ]) }); }
  }
  // losers: storm → survival hit + blame camp event
  for (const L of losers) {
    for (const m of L.members) bumpSurv(m, -6);
    const critic = L.members.slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
    const blamed = L.captain;
    if (critic && blamed && critic !== blamed) {
      addBond(critic, blamed, -2);
      nightEvents.push({ tribe: L.name, kind: 'storm', text: pick([
        `The storm rolls in and ${L.name} has no tarp. Soaked and sleepless, ${critic} rips into ${blamed} for how the build went. ${blamed} storms off.`,
        `${L.name} spends the night in the rain. ${critic} blames ${blamed}'s "leadership" out loud, and the tribe splits over it.`,
        `Cold, wet, miserable — ${L.name} turns on itself. ${critic} calls out ${blamed}, and the grudge is set before day two.`,
      ]) });
      campEvents.push({
        campKey: L.name,
        type: 'stormFallout',
        text: `A tarp-less thunderstorm soaks ${L.name}. ${critic} publicly blames ${blamed} for the losing shelter; the tribe fractures.`,
        players: [critic, blamed], badgeText: 'STORM FALLOUT', badgeClass: 'red',
      });
    } else {
      for (const m of L.members) { /* still soaked */ }
      nightEvents.push({ tribe: L.name, kind: 'storm', text: `${L.name} rides out the storm with no tarp. A long, wet, grumbling night.` });
    }
  }

  const introText = `Find your camp and build a shelter from ${venue().scrapWord}. The judge scores sturdiness and theme — winner sleeps dry under the tarp; the rest face the storm.`;
  return { tribeData, winner: winner.name, losers: losers.map(l => l.name), nightEvents, introText };
}

function _captainBeat(captain, style, tribe, add, ctx) {
  const pr = pronouns(captain);
  ctx.captainBonus = 0;
  if (style === 'inspiring') {
    ctx.captainBonus = 0.12;
    for (const m of tribe.members) if (m !== captain) addBond(captain, m, 1);
    bumpPop(captain, 1);
    add({ actor: captain, target: null, type: 'lead', badgeText: 'INSPIRING CAPTAIN', badgeClass: 'good',
      text: pick([
        `${captain} takes charge the way people actually want to be led — asking, encouraging, pitching in first. ${tribe.name} rallies behind ${pr.obj}.`,
        `No barking, no ego: ${captain} organizes ${tribe.name} with a light hand and a lot of heart. The whole tribe lifts.`,
        `${captain} makes everyone feel useful. Morale is high and the build hums along.`,
      ]) });
  } else if (style === 'commanding') {
    ctx.captainBonus = 0.16;
    // efficiency up, but friction with 1-2 members; possible mini-mutiny
    const targets = tribe.members.filter(n => n !== captain).sort(() => Math.random() - 0.5).slice(0, Math.min(2, tribe.members.length - 1));
    for (const t of targets) addBond(captain, t, -1);
    add({ actor: captain, target: targets[0] || null, type: 'lead', badgeText: 'BOSSY CAPTAIN', badgeClass: 'bad',
      text: pick([
        `${captain} seizes control and starts barking orders. The shelter goes up fast — and so does the resentment.`,
        `"I didn't get here by listening to idiots." ${captain} runs ${tribe.name} like a job site. Efficient. Hated.`,
        `${captain} manhandles every decision. It works. Nobody enjoys it.`,
      ]) });
    // mini-mutiny: a bold/hot teammate pushes back
    const rebel = tribe.members.filter(n => n !== captain).slice().sort((a, b) => (pStats(b).boldness) - (pStats(a).boldness))[0];
    if (rebel && pStats(rebel).boldness >= 6 && Math.random() < 0.6) {
      addBond(captain, rebel, -1); bumpPop(rebel, 1);
      add({ actor: rebel, target: captain, type: 'mutiny', badgeText: 'PUSHBACK', badgeClass: 'neutral',
        text: pick([
          `${rebel} finally snaps back at ${captain} — "you're not my boss out here." The tribe quietly takes ${rebel}'s side.`,
          `${rebel} refuses an order and stares ${captain} down. A target gets painted, and it's on ${captain}.`,
          `${rebel} calls out ${captain}'s bossiness in front of everyone. Awkward — and clarifying.`,
        ]) });
    }
  } else {
    ctx.captainBonus = 0.08;
    add({ actor: captain, target: null, type: 'lead', badgeText: 'PRAGMATIC CAPTAIN', badgeClass: 'neutral',
      text: pick([
        `${captain} isn't a natural leader, but somebody has to call it, so ${pr.sub} divide${pr.sub === 'they' ? '' : 's'} the work and keep${pr.sub === 'they' ? '' : 's'} it moving.`,
        `${captain} steps up without wanting the spotlight — practical, no drama, gets ${tribe.name} building.`,
        `${captain} runs a tight, quiet ship. No inspiration, no tyranny, just progress.`,
      ]) });
  }
}

// ══════════════════════════════════════════════════════════════════════
// PHASE B — DEMON'S PLAINER  (always)
// ══════════════════════════════════════════════════════════════════════

const RIDE_BEATS = {
  spot: [
    (n) => `${n} locks onto the flags with laser focus, calling colors under ${pronouns(n).posAdj} breath the whole way down.`,
    (n) => `${n} treats it like a memory drill — RED, BLUE, GREEN — burning the order in as the cart screams downhill.`,
    (n) => `${n} keeps ${pronouns(n).posAdj} eyes open through the loop and nails every flag. Ice-cold recall.`,
  ],
  choke: [
    (n) => `${n} shuts ${pronouns(n).posAdj} eyes on the first drop and misses half the flags. Pure survival mode.`,
    (n) => `The speed scrambles ${n}'s brain — the colors blur into one screaming smear.`,
    (n) => `${n} spends the whole ride white-knuckling the bar instead of watching the flags.`,
  ],
  thrill: [
    (n) => `${n} throws ${pronouns(n).posAdj} hands up and WHOOPS through the loop, having the time of ${pronouns(n).posAdj} life.`,
    (n) => `${n} laughs like a maniac the entire ride. The crowd loves it.`,
    (n) => `${n} rides it like a pro and hams it up for the cameras at the bottom.`,
  ],
};

function _runCoaster(ep, active, scores, campEvents, flagOrder, isMerged, shelter) {
  const memory = {};
  const riders = [];

  // rested edge from tarp winners (ep1)
  const tarpMembers = new Set();
  if (shelter) { const w = shelter.tribeData.find(t => t.name === shelter.winner); (w?.members || []).forEach(m => tarpMembers.add(m)); }

  for (const name of active) {
    const s = pStats(name);
    const rested = tarpMembers.has(name) ? 1.2 : (survOf(name) < 70 ? (survOf(name) - 70) * 0.03 : 0);
    let mem = s.mental * 0.5 + s.intuition * 0.4 + s.endurance * 0.15 + noise(2.5) + rested;

    // nausea: low endurance + temperament
    const queaze = (14 - s.endurance - s.temperament);
    const pukeChance = clamp(queaze * 0.045, 0.02, 0.55);
    const puked = Math.random() < pukeChance;
    let splashed = null;
    const beats = [];

    if (puked) {
      mem -= 2.5;
      // may splash a seatmate
      const seatmate = pick(active.filter(n => n !== name));
      if (seatmate && Math.random() < 0.6) {
        splashed = seatmate;
        addBond(name, seatmate, -2); addBond(seatmate, name, -2); bumpPop(name, -1);
        beats.push({ type: 'puke', badgeText: 'BLOWOUT', badgeClass: 'bad',
          text: pick([
            `After the big loop, ${name} loses lunch all over ${seatmate}. ${pronouns(seatmate).Sub} will not be forgetting this. Neither will the flags — ${name} saw none of them.`,
            `${name} goes green and redecorates ${seatmate}'s shirt at fifty miles an hour. Disgusting. Memorable. Zero flags recorded.`,
            `The coaster wins: ${name} pukes, ${seatmate} wears it, and both of them stop counting flags entirely.`,
          ]) });
      } else {
        beats.push({ type: 'puke', badgeText: 'QUEASY', badgeClass: 'bad',
          text: pick([
            `${name} turns a delicate shade of green and spends the ride fighting ${pronouns(name).posAdj} own stomach instead of watching flags.`,
            `${name} keeps it down — barely — but the flags are a lost cause.`,
            `${name} rides the whole thing with one hand over ${pronouns(name).posAdj} mouth. Not a single color remembered.`,
          ]) });
      }
    } else if (mem >= s.mental * 0.5 + 6) {
      beats.push({ type: 'spot', badgeText: 'SHARP EYES', badgeClass: 'good', text: pick(RIDE_BEATS.spot)(name) });
    } else if (mem < 5) {
      beats.push({ type: 'choke', badgeText: 'RATTLED', badgeClass: 'neutral', text: pick(RIDE_BEATS.choke)(name) });
    } else if (pStats(name).boldness >= 7 && Math.random() < 0.4) {
      beats.push({ type: 'thrill', badgeText: 'THRILL-SEEKER', badgeClass: 'good', text: pick(RIDE_BEATS.thrill)(name) });
      bumpPop(name, 1);
    }

    memory[name] = clamp(mem, 0, 20);
    riders.push({ name, memory: Math.round(memory[name] * 10) / 10, puked, splashed, beats });
  }

  // ── downtime: fear hand-hold / showmance ──
  const downtime = [];
  if (seasonConfig.romance) {
    // existing showmances
    for (const sm of (gs.showmances || [])) {
      if (sm.pair && !sm.broken && active.includes(sm.pair[0]) && active.includes(sm.pair[1])) {
        _checkShowmanceChalMoment(sm.pair[0], sm.pair[1], ep);
      }
    }
    // fear hand-hold spark between a nervous rider + a seatmate
    const nervous = active.filter(n => pStats(n).boldness <= 5).sort((a, b) => pStats(a).boldness - pStats(b).boldness);
    if (nervous.length) {
      const a = nervous[0];
      const b = active.filter(n => n !== a && romanticCompat(a, n)).sort((x, y) => pStats(y).social - pStats(x).social)[0];
      if (b) {
        addBond(a, b, 1);
        downtime.push({ a, b, text: pick([
          `On the slow climb, a terrified ${a} grabs ${b}'s hand and doesn't let go. At the top, neither of them mentions it. Both of them remember it.`,
          `${a} clutches ${b} through the whole first drop. It's fear — mostly. Maybe not entirely.`,
          `White-knuckled, ${a} reaches for ${b} at the crest. Something flickers between them.`,
        ]) });
        if (seasonConfig.romance) _challengeRomanceSpark(a, b, ep, null, null);
      }
    }
  }

  // ── SORT PHASE ──
  let result;
  if (isMerged) {
    result = _sortIndividual(active, memory, scores, riders);
  } else {
    result = _sortTribes(active, memory, scores, riders, campEvents);
  }

  return { flagOrder, riders, downtime, isMerged, ...result };
}

function _sortIndividual(active, memory, scores, riders) {
  // each player attempts to rebuild the flag order; errors from own memory
  const attempts = active.map(name => {
    const mem = memory[name];
    const errChance = clamp(0.7 - mem * 0.05, 0.03, 0.7);
    let errors = 0;
    for (let i = 0; i < 3; i++) if (Math.random() < errChance) errors++;
    const solveTime = 40 + errors * 22 + noise(6) - mem * 1.2;
    const score = mem * 1.5 - errors * 3 + noise(2);
    return { name, mem, errors, solveTime: Math.round(solveTime * 10) / 10, score };
  }).sort((a, b) => b.score - a.score);

  const immunityWinner = attempts[0].name;
  // scoring: everyone gets memory-based score; winner guaranteed top
  const maxOther = Math.max(...active.map(n => scores[n] || 0));
  active.forEach(name => {
    const at = attempts.find(a => a.name === name);
    scores[name] += (at ? at.score : 0) + 6;
  });
  scores[immunityWinner] += maxOther + active.length + 4;
  bumpPop(immunityWinner, 3);

  return { attempts, immunityWinner, sortMode: 'individual' };
}

function _sortTribes(active, memory, scores, riders, campEvents) {
  const tribes = gs.tribes.map(t => ({ name: t.name, color: t.color, members: t.members.filter(m => active.includes(m)) }))
    .filter(t => t.members.length > 0);

  const tribeResults = [];
  for (const tribe of tribes) {
    const arranger = tribe.members.slice().sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
    const tribeMem = tribe.members.reduce((s, m) => s + memory[m], 0) / tribe.members.length;
    const arrangerMem = memory[arranger];
    let retries = 0;
    let errChance = clamp(0.65 - (tribeMem * 0.3 + arrangerMem * 0.7) * 0.05, 0.05, 0.65);
    const rounds = [];
    // first attempt + up to 3 retries
    for (let attempt = 0; attempt <= 3; attempt++) {
      const wrong = Math.random() < errChance;
      rounds.push({ attempt: attempt + 1, arranger, wrong });
      if (!wrong) break;
      retries++;
      errChance = clamp(errChance - 0.12, 0.03, 0.65); // learning
    }
    const gotIt = !rounds[rounds.length - 1].wrong;
    const solveTime = 45 + retries * 20 + noise(5) - arrangerMem * 1.5;
    tribeResults.push({ name: tribe.name, color: tribe.color, members: tribe.members, arranger, tribeMem: Math.round(tribeMem * 10) / 10, retries, rounds, gotIt, solveTime: Math.round(solveTime * 10) / 10 });
  }

  // winner = got it correct with lowest solve time
  tribeResults.sort((a, b) => {
    if (a.gotIt !== b.gotIt) return a.gotIt ? -1 : 1;
    return a.solveTime - b.solveTime;
  });
  const winnerTribe = tribeResults[0];
  const loserTribe = tribeResults[tribeResults.length - 1];

  // sleeping bags → winner: small survival + pop
  for (const m of winnerTribe.members) { bumpSurv(m, 4); scores[m] += 8; }
  bumpPop(winnerTribe.arranger, 2);
  for (const m of loserTribe.members) scores[m] += 2;

  return { tribeResults, winnerTribeName: winnerTribe.name, loserTribeName: loserTribe.name, sortMode: 'tribe' };
}

// ══════════════════════════════════════════════════════════════════════
// ORCHESTRATOR
// ══════════════════════════════════════════════════════════════════════
export function simulateDemonsPlainer(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const isMerged = gs.isMerged;
  const isEp1 = !isMerged && (gs.episodeHistory?.length || 0) === 0;
  const mode = isMerged ? 'postmerge' : (isEp1 ? 'ep1' : 'premerge');

  const scores = {}; active.forEach(p => { scores[p] = 0; });
  const campEvents = [];
  const flagOrder = [];
  const nFlags = 6;
  const pool = FLAG_COLORS.slice().sort(() => Math.random() - 0.5).slice(0, nFlags);
  pool.forEach(c => flagOrder.push(c));

  const chrisOpener = pick(OPENERS);
  const coasterOpener = pick(COASTER_OPENERS);
  const chrisCloser = pick(CLOSERS);

  // ── PHASE A (ep1 only) ──
  let shelter = null;
  if (isEp1) shelter = _runShelter(ep, active, scores, campEvents);

  // ── PHASE B (always) ──
  const coaster = _runCoaster(ep, active, scores, campEvents, flagOrder, isMerged, shelter);

  // ── finalize win conditions ──
  let immunityWinner = null;
  if (isMerged) {
    immunityWinner = coaster.immunityWinner;
    ep.immunityWinner = immunityWinner;
    ep.challengeType = 'demons-plainer';
    ep.tribalPlayers = active.slice();
  } else {
    const winnerTribe = gs.tribes.find(t => t.name === coaster.winnerTribeName);
    const loserTribe = gs.tribes.find(t => t.name === coaster.loserTribeName);
    ep.winner = winnerTribe; ep.loser = loserTribe;
    ep.safeTribes = gs.tribes.filter(t => t !== loserTribe && t !== winnerTribe);
    ep.challengePlacements = (coaster.tribeResults || []).map(tr => { const t = gs.tribes.find(x => x.name === tr.name); return { name: tr.name, members: [...(t?.members || [])] }; });
    ep.tribalPlayers = [...(loserTribe?.members || [])];
    ep.challengeType = 'demons-plainer';
  }

  // chalMemberScores
  const chalMemberScores = {};
  active.forEach(name => { chalMemberScores[name] = Math.round((scores[name] || 0) * 10) / 10; });
  ep.chalMemberScores = chalMemberScores;
  ep.chalPlacements = active.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  if (isMerged && immunityWinner) ep.immunityWinner = immunityWinner;

  // inject camp events into the per-tribe camp structure ({ campKey: { pre, post } })
  if (campEvents.length) {
    if (!ep.campEvents) ep.campEvents = {};
    for (const ce of campEvents) {
      const key = ce.campKey || (isMerged ? (gs.mergeName || 'merge') : null);
      if (!key) continue;
      if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
      const { campKey, ...evt } = ce;
      ep.campEvents[key].pre.push(evt);
    }
  }

  const leaderboard = active.map(name => ({ name, score: Math.round((scores[name] || 0) * 10) / 10 })).sort((a, b) => b.score - a.score);

  ep.demonsPlainer = {
    mode, isMerged,
    chrisOpener, coasterOpener, chrisCloser,
    flagOrder, shelter, coaster,
    scores, leaderboard, immunityWinner,
    winnerTribeName: coaster.winnerTribeName || null,
    loserTribeName: coaster.loserTribeName || null,
  };

  ep.challengeLabel = "Demon's Plainer";
  ep.challengeCategory = 'challenge';
  ep.isDemonsPlainer = true;

  updateChalRecord(ep);
}

// ══════════════════════════════════════════════════════════════════════
// TEXT BACKLOG — full retranscription of the VP narration
// ══════════════════════════════════════════════════════════════════════
export function _textDemonsPlainer(ep, ln, sec) {
  const dp = ep.demonsPlainer;
  if (!dp) return;
  sec("DEMON'S PLAINER");
  ln(`Chris: "${dp.chrisOpener}"`);
  ln('');

  // ── Phase A ──
  if (dp.shelter) {
    ln('━━━ SHELTER SCRAMBLE ━━━');
    for (const t of dp.shelter.tribeData) {
      ln(`— ${t.name} — (Captain: ${t.captain}, ${t.style})`);
      for (const e of t.events) ln(`  • [${e.badgeText}] ${e.text}`);
      ln(`  Shelter judged — Sturdiness ${t.sturdiness}, Theme ${t.themeScore}${t.wonTarp ? '  ★ WINS THE TARP' : ''}`);
      ln('');
    }
    ln(`Winning shelter: ${dp.shelter.winner} (earns the tarp).`);
    for (const ne of dp.shelter.nightEvents) ln(`  • ${ne.text}`);
    ln('');
  }

  // ── Phase B ──
  ln('━━━ THE DEMON\'S PLAINER ━━━');
  ln(`Chris: "${dp.coasterOpener}"`);
  ln(`Flag order to memorize: ${dp.flagOrder.join(' → ')}`);
  ln('');
  for (const r of dp.coaster.riders) {
    for (const b of r.beats) ln(`  • [${b.badgeText}] ${b.text}`);
  }
  for (const d of dp.coaster.downtime) ln(`  • [DOWNTIME] ${d.text}`);
  ln('');

  if (dp.coaster.sortMode === 'tribe') {
    ln('THE SORT:');
    for (const tr of dp.coaster.tribeResults) {
      const retryTxt = tr.retries > 0 ? ` — got it wrong ${tr.retries}x, sent members back to ride again` : ' — nailed it first try';
      ln(`  ${tr.name}: arranger ${tr.arranger}${retryTxt}. ${tr.gotIt ? 'Solved.' : 'Never solved it.'} (time ${tr.solveTime}s)`);
    }
    ln('');
    ln(`★ ${dp.coaster.winnerTribeName} wins the sleeping bags. ${dp.coaster.loserTribeName} heads to tribal council.`);
  } else {
    ln('THE SORT (individual immunity):');
    for (const at of dp.coaster.attempts) {
      ln(`  ${at.name}: ${at.errors} error(s), solve time ${at.solveTime}s`);
    }
    ln('');
    ln(`★ ${dp.immunityWinner} rebuilds the flag order fastest and wins IMMUNITY.`);
  }
  ln('');
  ln(`Chris: "${dp.chrisCloser}"`);
}
