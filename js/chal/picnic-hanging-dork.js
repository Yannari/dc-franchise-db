// ═══════════════════════════════════════════════════════════════
//  PICNIC AT HANGING DORK — Pre-merge outback challenge
//  Phase 1: Emu Race (4 momentum segments)
//  Phase 2: Bungee Sheep Grab + Shear (push-your-luck)
// ═══════════════════════════════════════════════════════════════

import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── helpers ──
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function noise(n) { return (Math.random() - 0.5) * n * 2; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + d; }
function portrait(name, size = 24) {
  const p = players.find(x => x.name === name);
  if (!p?.slug) return `<span class="hd-portrait-blank" style="width:${size}px;height:${size}px;background:var(--hd-dust);border-radius:50%;display:inline-block;vertical-align:middle"></span>`;
  return `<img src="assets/avatars/${p.slug}.png" class="hd-portrait" style="width:${size}px;height:${size}px;border-radius:50%;vertical-align:middle;object-fit:cover" onerror="this.style.display='none'" alt="${name}">`;
}
function aAn(word) { return /^[aeiou]/i.test(word) ? 'an' : 'a'; }

function _normTribes(hd) {
  if (!hd?.tribes) return;
  hd.tribes.forEach(t => {
    if (t.tribeName && t.tribeName !== 'undefined') return;
    if (t.name && t.name !== 'undefined') { t.tribeName = t.name; return; }
    // cross-reference gs.tribes by member overlap
    if (t.members?.length && gs.tribes?.length) {
      const match = gs.tribes.find(gt =>
        gt.members?.some(m => t.members.includes(m))
      );
      if (match) { t.tribeName = match.name || match.tribeName || 'Team ?'; t.name = t.tribeName; return; }
    }
    t.tribeName = `Team ${hd.tribes.indexOf(t) + 1}`;
    t.name = t.tribeName;
  });
}

// ── constants ──
const SEG_NAMES = ['Dusty Flats', 'Red Dune Crossing', 'Scrubland Maze', 'Final Sprint'];
const BASE_SEG_TIME = 25;
const SEG_STAT_FN = [
  s => s.physical * 0.6 + s.endurance * 0.4,
  s => s.boldness * 0.3 + s.physical * 0.2 + s.endurance * 0.5,
  s => s.intuition * 0.4 + s.physical * 0.3 + s.boldness * 0.3,
  s => s.physical * 0.5 + s.boldness * 0.3 + s.endurance * 0.2,
];
const SHEEP_TYPES = [
  { type: 'common', woolMin: 3, woolMax: 5 },
  { type: 'sturdy', woolMin: 6, woolMax: 8 },
  { type: 'prize', woolMin: 9, woolMax: 12 },
];

// ── text pools ──
const EMU_MOUNT = [
  (p) => { const pr = pronouns(p); return `${p} swings onto ${pr.posAdj} emu with surprising confidence. The bird squawks but holds steady.`; },
  (p) => { const pr = pronouns(p); return `${p} approaches ${pr.posAdj} emu cautiously. One false step and the bird almost bolts.`; },
  (p) => { const pr = pronouns(p); return `${p} leaps onto the emu's back like ${pr.sub}'s done this a thousand times. ${pr.Sub} hasn't.`; },
  (p) => { const pr = pronouns(p); return `The emu gives ${p} a deeply suspicious look before allowing ${pr.obj} to mount.`; },
  (p) => { const pr = pronouns(p); return `${p} straddles the emu and immediately starts sliding sideways. ${pr.Sub} grabs a fistful of feathers.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu honks aggressively as ${pr.sub} settles in. This partnership is already off to a rocky start.`; },
  (p) => { const pr = pronouns(p); return `${p} mounts ${pr.posAdj} emu with the grace of someone who's never touched a bird in ${pr.posAdj} life.`; },
  (p) => { const pr = pronouns(p); return `${p} whispers something to ${pr.posAdj} emu. The emu doesn't care. ${p} mounts anyway.`; },
];

const EMU_BUCK = [
  (p) => { const pr = pronouns(p); return `${p}'s emu bucks hard! ${pr.Sub} grabs the neck feathers and barely holds on.`; },
  (p) => { const pr = pronouns(p); return `The emu launches ${p} sideways. ${pr.Sub} scrambles back on, dignity gone.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu rears up without warning. ${pr.Sub} clings on with both arms wrapped around its neck.`; },
  (p) => { const pr = pronouns(p); return `A sudden buck sends ${p} airborne for a terrifying half-second before ${pr.sub} crashes back into the saddle.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu decides it's done cooperating. Three violent bucks later, ${pr.sub}'s still hanging on — barely.`; },
  (p) => { const pr = pronouns(p); return `The emu kicks its legs out and ${p} goes sliding forward, face-first into feathers.`; },
  (p) => { const pr = pronouns(p); return `${p} gets thrown so hard ${pr.posAdj} shoes fly off. ${pr.Sub} rides the rest of the segment barefoot.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu does a full spin-buck combo. ${pr.Sub} somehow stays mounted through sheer panic grip.`; },
];

const EMU_SHORTCUT = [
  (p) => { const pr = pronouns(p); return `${p} spots a gap in the brush and steers ${pr.posAdj} emu through it. Shortcut!`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu seems to know a faster route. ${pr.Sub} lets the bird lead and gains ground.`; },
  (p) => { const pr = pronouns(p); return `${p} notices a dry creek bed cutting through the terrain. ${pr.Sub} takes it and saves precious seconds.`; },
  (p) => { const pr = pronouns(p); return `Sharp eyes from ${p} — ${pr.sub} spots a ridge path that shaves time off the route.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu veers left and ${pr.sub} almost corrects it — but the bird found a faster path.`; },
  (p) => { const pr = pronouns(p); return `${p} catches a glimpse of flattened grass ahead. Someone's been through here before. ${pr.Sub} follows the trail.`; },
  (p) => { const pr = pronouns(p); return `${p} trusts ${pr.posAdj} instincts and cuts through a boulder gap. The gamble pays off.`; },
  (p) => { const pr = pronouns(p); return `${p} reads the terrain like a map and finds an unmarked shortcut through the scrub.`; },
];

const EMU_STUMBLE = [
  (p) => { const pr = pronouns(p); return `${p}'s emu trips on loose rock. ${pr.Sub} lurches forward but recovers.`; },
  (p) => { const pr = pronouns(p); return `A hidden root catches ${p}'s emu mid-stride. ${pr.Sub} loses a few seconds regaining control.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu hits soft sand and sinks. ${pr.Sub} kicks frantically to get the bird moving again.`; },
  (p) => { const pr = pronouns(p); return `${p} and ${pr.posAdj} emu both stumble through a patch of loose gravel. Not pretty.`; },
  (p) => { const pr = pronouns(p); return `The emu's legs buckle on a downhill slope. ${p} holds on while the bird regains its footing.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu slides sideways on clay. ${pr.Sub} drags it back on course, losing momentum.`; },
  (p) => { const pr = pronouns(p); return `A dust devil kicks up right in front of ${p}. ${pr.PosAdj} emu panics and stumbles hard.`; },
  (p) => { const pr = pronouns(p); return `${p} hits a rut at full speed. The emu staggers, ${p} nearly goes over the handlebars — if emus had handlebars.`; },
];

const EMU_BUCK_SAVE = [
  (p) => { const pr = pronouns(p); return `${p}'s emu bucks violently — but ${pr.sub} digs ${pr.posAdj} heels in and stays mounted. Barely lost a second.`; },
  (p) => { const pr = pronouns(p); return `The emu tries to throw ${p}, but ${pr.sub} reads the move and shifts weight. Crisis averted.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu does a vicious sideways buck. ${pr.Sub} leans into it, riding the momentum. Nice recovery.`; },
  (p) => { const pr = pronouns(p); return `A buck that would've unseated anyone else, but ${p} has iron legs. ${pr.Sub} steadies and keeps moving.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu rears up — but ${pr.sub} wraps both arms around the neck and brings it back down. Control regained.`; },
  (p) => { const pr = pronouns(p); return `The emu kicks hard left, ${p} leans hard right. Perfect counterbalance. ${pr.Sub} barely loses stride.`; },
  (p) => { const pr = pronouns(p); return `${p} gets bucked so hard ${pr.posAdj} teeth rattle — but ${pr.sub} sticks the landing and keeps riding.`; },
  (p) => { const pr = pronouns(p); return `The emu tries every trick: spin, buck, stop. ${p} survives all three. That's pure grit.`; },
];

const EMU_SURGE = [
  (p) => { const pr = pronouns(p); return `${p} finds a burst of speed! ${pr.PosAdj} emu breaks into a full sprint, eating up ground.`; },
  (p) => { const pr = pronouns(p); return `${p} kicks ${pr.posAdj} emu into high gear. The bird responds — they're flying through the dust.`; },
  (p) => { const pr = pronouns(p); return `Something clicks for ${p}. ${pr.Sub} and the emu move as one. Pure acceleration.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu catches a second wind and surges forward. ${pr.Sub} whoops with joy.`; },
  (p) => { const pr = pronouns(p); return `${p} spots the gap and drives ${pr.posAdj} emu through it at full gallop. Time gained.`; },
  (p) => { const pr = pronouns(p); return `${p} digs in and the emu responds with an explosive burst. Rivals eat ${pr.posAdj} dust.`; },
  (p) => { const pr = pronouns(p); return `${p} leans forward, whispers to the emu, and suddenly they're overtaking everyone.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu goes from trot to gallop in a heartbeat. ${pr.Sub} hangs on and lets it run.`; },
];

const EMU_COOPERATION = [
  (p) => { const pr = pronouns(p); return `${p}'s emu nuzzles ${pr.posAdj} hand. They're bonding. And somehow, they're faster now.`; },
  (p) => { const pr = pronouns(p); return `${p} and ${pr.posAdj} emu have found their rhythm. The bird anticipates every turn.`; },
  (p) => { const pr = pronouns(p); return `${p} stops fighting the emu and starts working WITH it. The emu rewards ${pr.obj} with smooth speed.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu chirps happily. A happy emu is a fast emu. ${pr.Sub} gains ground.`; },
  (p) => { const pr = pronouns(p); return `${p} scratches the emu's neck between strides. The bird practically purrs and picks up speed.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu leans into the turns exactly when ${pr.sub} does. Full partnership unlocked.`; },
];

const EMU_DUST_BLIND = [
  (p) => { const pr = pronouns(p); return `A wall of dust hits ${p} in the face. ${pr.Sub} can't see, the emu can't see, and time is slipping away.`; },
  (p) => { const pr = pronouns(p); return `${p} rides straight into a dust cloud kicked up by the tribe ahead. ${pr.Sub} emerges coughing and off-course.`; },
  (p) => { const pr = pronouns(p); return `Blinding dust engulfs ${p}. ${pr.Sub} steers by instinct alone — and instinct takes ${pr.obj} the wrong way.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu panics in the dust storm. Zero visibility. ${pr.Sub} just holds on until it clears.`; },
  (p) => { const pr = pronouns(p); return `The leading pack kicks up so much dirt that ${p} loses the trail entirely. Precious seconds wasted.`; },
  (p) => { const pr = pronouns(p); return `${p} gets a face full of outback. ${pr.Sub} spits sand and tries to find the course through watering eyes.`; },
];

const EMU_REFUSE = [
  (p) => { const pr = pronouns(p); return `${p}'s emu plants its feet and refuses to move. ${pr.Sub} kicks, pleads, threatens — nothing.`; },
  (p) => { const pr = pronouns(p); return `The emu sits down. Just sits. ${p} stares at it in disbelief.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu has had enough. It starts walking in circles, ignoring ${pr.posAdj} increasingly desperate steering.`; },
  (p) => { const pr = pronouns(p); return `${p} pulls on the emu's neck. The emu pulls back. This standoff costs valuable seconds.`; },
  (p) => { const pr = pronouns(p); return `The emu decides this is a great time for a dust bath. ${p} is still on its back.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu starts pecking at the ground, completely ignoring the race. ${pr.Sub} waves ${pr.posAdj} arms uselessly.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu spots something fascinating in the dirt and just... stops. ${pr.Sub} can't convince it otherwise.`; },
  (p) => { const pr = pronouns(p); return `The emu turns to look at ${p} with pure indifference. Then it starts preening. Mid-race.`; },
];

const SEG_GOOD = [
  (t) => `${t} tears through the stretch — emus in formation, riders locked in.`,
  (t) => `Clean run for ${t}. The emus hit their stride and the team keeps it tight.`,
  (t) => `${t} pushes hard and gains serious ground. That's how you race.`,
  (t) => `${t}'s emus move like they were born for this. Effortless speed.`,
  (t) => `Dust flying, feathers ruffling — ${t} absolutely crushes this segment.`,
  (t) => `${t} finds their rhythm. Every rider in sync, every emu cooperative.`,
  (t) => `${t} carves through the terrain with precision. Textbook racing.`,
  (t) => `Strong showing from ${t}. The emus are practically sprinting.`,
];

const SEG_BAD = [
  (t) => `${t} struggles through — half the emus won't cooperate, and the other half are lost.`,
  (t) => `Rough segment for ${t}. Nothing's going right out there.`,
  (t) => `${t} limps through this stretch. The emus seem actively hostile today.`,
  (t) => `${t} falls behind as their emus scatter in three different directions.`,
  (t) => `Painful to watch. ${t}'s formation disintegrates within seconds.`,
  (t) => `${t}'s riders are fighting their emus more than the terrain.`,
  (t) => `${t} loses precious time to emu tantrums and navigational disasters.`,
  (t) => `${t} stumbles through in disarray. The other tribes can hear the shouting.`,
];

const SOCIAL_FLIRT = [
  (a, t) => { const pr = pronouns(a); return `${a} sidles ${pr.posAdj} emu over to ${t} between segments. A wink, a compliment, a casual hair flip — and ${t}'s completely distracted.`; },
  (a, t) => { const pr = pronouns(a); return `${a} catches ${t}'s eye and mouths something across the dust cloud. ${t} can't help but stare.`; },
  (a, t) => { const pr = pronouns(a); return `${a} rides past ${t} close enough to brush shoulders. 'Nice riding,' ${pr.sub} murmurs. ${t} forgets what segment they're in.`; },
  (a, t) => { const pr = pronouns(a); return `${a} pretends to need help with ${pr.posAdj} emu, specifically near ${t}. The rescue attempt takes suspiciously long.`; },
  (a, t) => { const pr = pronouns(a); return `${a} makes a show of stretching between segments, conveniently right in ${t}'s line of sight.`; },
  (a, t) => { const pr = pronouns(a); return `${a} shares ${pr.posAdj} water canteen with ${t}. The eye contact lasts three seconds too long.`; },
  (a, t) => { const pr = pronouns(a); return `${a} laughs at something ${t} says — louder and longer than the joke deserves. ${t} doesn't seem to mind.`; },
  (a, t) => { const pr = pronouns(a); return `${a} guides ${pr.posAdj} emu right next to ${t}'s. A whispered conversation follows. ${t}'s tribe looks nervous.`; },
];

const SOCIAL_COUNTER = [
  (c, v) => { const pr = pronouns(c); return `${c} yanks ${v} back into formation. 'Focus! We're in a race, not a dating show.'`; },
  (c, v) => { const pr = pronouns(c); return `${c} steps between ${v} and the distraction. 'Eyes forward. Don't fall for it.'`; },
  (c, v) => { const pr = pronouns(c); return `${c} snaps ${pr.posAdj} fingers in front of ${v}'s face. 'Hey! That was a setup and you know it.'`; },
  (c, v) => { const pr = pronouns(c); return `${c} pulls ${v} aside. 'They're playing you. Get your head in the game.'`; },
  (c, v) => { const pr = pronouns(c); return `${c} shoots the flirt a death glare, then turns to ${v}. 'Don't even think about it.'`; },
  (c, v) => { const pr = pronouns(c); return `${c} physically steers ${v}'s emu back toward the team. 'We can't afford distractions.'`; },
  (c, v) => { const pr = pronouns(c); return `${c} notices what's happening and loudly clears ${pr.posAdj} throat. ${v} snaps out of it.`; },
  (c, v) => { const pr = pronouns(c); return `${c} rides up beside ${v} and blocks the view. 'Trust me, they're not worth losing over.'`; },
];

const SOCIAL_FAKE_ALLIANCE = [
  (a, t) => { const pr = pronouns(a); return `${a} whispers to ${t}: 'Your tribemate was talking about throwing the challenge to get you out.' The seed is planted.`; },
  (a, t) => { const pr = pronouns(a); return `${a} casually mentions to ${t} that ${pr.sub} heard something interesting at camp. Something about ${t}'s alliance.`; },
  (a, t) => { const pr = pronouns(a); return `${a} pulls ${t} aside during the break. 'I probably shouldn't tell you this, but someone on your tribe wants you gone.'`; },
  (a, t) => { const pr = pronouns(a); return `${a} drops a vague warning to ${t} about tribal loyalty. Just enough to make ${t} paranoid.`; },
  (a, t) => { const pr = pronouns(a); return `${a} mentions to ${t} that ${pr.sub}'s 'heard things' — won't say what, but the implication is clear.`; },
  (a, t) => { const pr = pronouns(a); return `${a} fake-confides in ${t}: 'If I were on your tribe, I'd watch my back. Just saying.'`; },
  (a, t) => { const pr = pronouns(a); return `${a} feigns concern for ${t}. 'Are you sure everyone on your tribe is loyal? I've been hearing whispers.'`; },
  (a, t) => { const pt = pronouns(t); return `${a} passes ${t} a folded leaf with scribbled words. ${t} reads it and ${pt.posAdj} expression darkens.`; },
];

const SOCIAL_TRASH = [
  (a, t) => { const pr = pronouns(a); return `${a} rides past ${t} and shouts: 'Your emu's faster than you are, and it's not even trying!'`; },
  (a, t) => { const pr = pronouns(a); return `${a} blows a kiss at ${t}. 'See you at tribal, sweetheart.'`; },
  (a, t) => { const pr = pronouns(a); return `${a} laughs as ${t}'s tribe falls behind. 'Call that racing? My grandmother rides harder than that!'`; },
  (a, t) => { const pr = pronouns(a); return `${a} makes a show of yawning as ${t} passes. 'Oh, are you still in this?'`; },
  (a, t) => { const pr = pronouns(a); return `${a} turns back to shout at ${t}: 'Hope you packed your bags!' ${pr.PosAdj} emu seems to be strutting.`; },
  (a, t) => { const pr = pronouns(a); return `${a} catches ${t}'s eye and drags a finger across ${pr.posAdj} throat. Subtle.`; },
  (a, t) => { const pr = pronouns(a); return `${a} hollers across the dust: 'Is your tribe even trying, ${t}? This is embarrassing!'`; },
  (a, t) => { const pr = pronouns(a); return `${a} rides backward for a second just to taunt ${t}. The showboating costs nothing — the humiliation is free.`; },
];

const SOCIAL_CLASH = [
  (a, t) => `${a}'s emu slams into ${t}'s mid-stride! Both birds squawk and the riders nearly collide.`,
  (a, t) => `${a} and ${t}'s emus lock necks briefly — a territorial dispute that costs both riders time.`,
  (a, t) => `${a}'s emu body-checks ${t}'s off the trail. Feathers fly. Neither rider is happy.`,
  (a, t) => `The emus of ${a} and ${t} decide to settle a grudge right here, right now. Both riders hang on for the ride.`,
  (a, t) => `${a} and ${t} crowd the same path. Their emus bump hard and both stumble off course.`,
  (a, t) => `${a}'s emu charges at ${t}'s. A cloud of dust, angry honking, and suddenly both riders are way behind.`,
  (a, t) => `${a} and ${t} cut each other off simultaneously. The resulting emu pile-up is spectacular.`,
  (a, t) => `${a}'s emu pecks at ${t}'s emu. ${t}'s emu retaliates. Both riders are just passengers now.`,
];

const BUNGEE_JUMP = [
  (p) => { const pr = pronouns(p); return `${p} stands at the canyon edge, looks down, and jumps without hesitation. The bungee cord screams.`; },
  (p) => { const pr = pronouns(p); return `${p} takes a running start and launches ${pr.ref} off the cliff. The canyon swallows ${pr.obj}.`; },
  (p) => { const pr = pronouns(p); return `${p} peers over the edge, mutters something unprintable, and dives. The cord catches ${pr.obj} just in time.`; },
  (p) => { const pr = pronouns(p); return `${p} does a dramatic countdown — three, two, one — and drops into the void. ${pr.PosAdj} scream echoes.`; },
  (p) => { const pr = pronouns(p); return `${p} steps off the ledge like stepping off a bus. Cold, calm, terrifying.`; },
  (p) => { const pr = pronouns(p); return `${p} cannonballs off the cliff. Style points: debatable. Commitment: absolute.`; },
  (p) => { const pr = pronouns(p); return `${p} closes ${pr.posAdj} eyes and falls backward off the edge. The crowd gasps.`; },
  (p) => { const pr = pronouns(p); return `${p} charges the edge at full sprint and hurls ${pr.ref} into the canyon with a war cry.`; },
];

const BUNGEE_GRAB_WIN = [
  (p) => { const pr = pronouns(p); return `${p} snags a sheep mid-bounce! ${pr.Sub} clutches it tight as the cord yanks ${pr.obj} back up.`; },
  (p) => { const pr = pronouns(p); return `Perfect grab from ${p} — ${pr.sub} wraps both arms around the sheep and holds on through the rebound.`; },
  (p) => { const pr = pronouns(p); return `${p}'s fingers close around wool and ${pr.sub} isn't letting go. The sheep bleats in protest.`; },
  (p) => { const pr = pronouns(p); return `${p} scoops up a sheep with one arm while the other grips the cord. Impressive form.`; },
  (p) => { const pr = pronouns(p); return `${p} times the bounce perfectly and grabs a sheep at the bottom of the arc. Clean catch.`; },
  (p) => { const pr = pronouns(p); return `${p} stretches ${pr.posAdj} arms to the limit and just barely gets a grip on the sheep's wool.`; },
  (p) => { const pr = pronouns(p); return `${p} bear-hugs a sheep at the apex of ${pr.posAdj} swing. The sheep accepts its fate.`; },
  (p) => { const pr = pronouns(p); return `${p} grabs a sheep by the scruff and tucks it under ${pr.posAdj} arm like a rugby ball.`; },
];

const BUNGEE_GRAB_FAIL = [
  (p) => { const pr = pronouns(p); return `${p} reaches for the sheep and misses completely. The cord snaps ${pr.obj} back up empty-handed.`; },
  (p) => { const pr = pronouns(p); return `${p}'s fingers brush wool but can't get a grip. The sheep trots away smugly.`; },
  (p) => { const pr = pronouns(p); return `${p} swings wildly at a sheep and comes up with nothing but dust and regret.`; },
  (p) => { const pr = pronouns(p); return `The sheep dodges ${p}'s grab at the last second. ${pr.Sub} bounces back up with empty arms.`; },
  (p) => { const pr = pronouns(p); return `${p} overshoots the grab. ${pr.PosAdj} hands close on empty air as the cord recoils.`; },
  (p) => { const pr = pronouns(p); return `${p} had it — then didn't. The sheep slips through ${pr.posAdj} fingers at the worst moment.`; },
  (p) => { const pr = pronouns(p); return `${p} grabs a mouthful of wool that immediately tears free. Not enough. Not nearly enough.`; },
  (p) => { const pr = pronouns(p); return `${p} misjudges the swing arc entirely. ${pr.Sub}'s not even close to the sheep.`; },
];

const BUNGEE_DINGO = [
  (p) => { const pr = pronouns(p); return `A dingo bursts from the scrub and charges ${p}'s sheep! ${pr.Sub} has to fight it off mid-bounce!`; },
  (p) => { const pr = pronouns(p); return `${p} lands with the sheep — and immediately hears growling. A dingo is already circling.`; },
  (p) => { const pr = pronouns(p); return `The moment ${p} grabs the sheep, a dingo lunges. Teeth, claws, absolute chaos.`; },
  (p) => { const pr = pronouns(p); return `A pack of dingoes spotted ${p}'s prize sheep. ${pr.Sub}'s now in a tug-of-war with a wild dog.`; },
  (p) => { const pr = pronouns(p); return `Dingo! ${p} sees it a second too late. The animal leaps at the sheep in ${pr.posAdj} arms.`; },
  (p) => { const pr = pronouns(p); return `${p} hears the snarl before ${pr.sub} sees it. A dingo is already airborne, heading straight for ${pr.posAdj} sheep.`; },
  (p) => { const pr = pronouns(p); return `A scrawny dingo with hungry eyes locks onto ${p}'s sheep. This is going to get ugly.`; },
  (p) => { const pr = pronouns(p); return `${p}'s greedy grab attracted attention — a dingo crashes through the brush, teeth bared.`; },
];

const BUNGEE_DINGO_ESCAPE = [
  (p) => { const pr = pronouns(p); return `${p} kicks the dingo away and the cord yanks ${pr.obj} skyward! ${pr.Sub} keeps the sheep — barely!`; },
  (p) => { const pr = pronouns(p); return `${p} stares the dingo down until it backs off. ${pr.Sub} clutches the sheep tighter and ascends.`; },
  (p) => { const pr = pronouns(p); return `${p} swings the sheep behind ${pr.posAdj} back and plants a foot in the dingo's face. Survival instinct wins.`; },
  (p) => { const pr = pronouns(p); return `The cord snaps ${p} upward just as the dingo pounces. ${pr.Sub} escapes by inches, sheep intact.`; },
  (p) => { const pr = pronouns(p); return `${p} headbutts the dingo. Actually headbutts it. The dingo retreats. ${p} has the sheep.`; },
  (p) => { const pr = pronouns(p); return `${p} uses the sheep itself as a shield. The dingo bites wool instead of flesh and gives up.`; },
  (p) => { const pr = pronouns(p); return `${p} screams so loud the dingo flinches. ${pr.Sub} grabs the opportunity — and the sheep — and ascends.`; },
  (p) => { const pr = pronouns(p); return `${p} outmaneuvers the dingo with a spin move. The cord lifts ${pr.obj} away with the sheep secure.`; },
];

const BUNGEE_DINGO_LOST = [
  (p) => { const pr = pronouns(p); return `The dingo rips the sheep from ${p}'s arms. ${pr.Sub} bounces back up with nothing.`; },
  (p) => { const pr = pronouns(p); return `${p} can't hold on — the dingo wins the tug-of-war and vanishes with the sheep into the brush.`; },
  (p) => { const pr = pronouns(p); return `${p} loses ${pr.posAdj} grip as the dingo pulls. The sheep is gone. ${pr.Sub} rises empty-handed.`; },
  (p) => { const pr = pronouns(p); return `The dingo is faster, meaner, and hungrier. ${p} watches ${pr.posAdj} sheep disappear into the outback.`; },
  (p) => { const pr = pronouns(p); return `${p} tries to hold on but the dingo's jaws are stronger. The sheep bleats once and is dragged away.`; },
  (p) => { const pr = pronouns(p); return `${p} and the dingo lock eyes. The dingo wins. ${p} bounces up with nothing but shame.`; },
  (p) => { const pr = pronouns(p); return `The dingo snatches ${p}'s sheep in one clean motion. ${pr.Sub}'s left holding a clump of loose wool.`; },
  (p) => { const pr = pronouns(p); return `${p} reaches for the sheep one last time but the cord yanks ${pr.obj} away. The dingo takes its prize.`; },
];

const BUNGEE_SHEAR = [
  (p) => { const pr = pronouns(p); return `${p} shears with quick, efficient strokes. Wool piles up nicely.`; },
  (p) => { const pr = pronouns(p); return `${p}'s shearing technique is rough but effective. The sheep looks relieved when it's over.`; },
  (p) => { const pr = pronouns(p); return `${p} attacks the wool like a professional. Clean lines, minimal waste.`; },
  (p) => { const pr = pronouns(p); return `${p} struggles with the shears — clumps of wool fly everywhere. Some land in ${pr.posAdj} mouth.`; },
  (p) => { const pr = pronouns(p); return `${p} shears methodically, layer by layer. Patient. Thorough.`; },
  (p) => { const pr = pronouns(p); return `${p} goes at the sheep like it owes ${pr.obj} money. Fast, aggressive, surprisingly effective.`; },
  (p) => { const pr = pronouns(p); return `${p} discovers shearing is harder than it looks. Half the wool ends up on the ground, unusable.`; },
  (p) => { const pr = pronouns(p); return `${p} shears with ${pr.posAdj} tongue sticking out in concentration. Every snip is deliberate.`; },
];

const BRAND_FOUND = [
  (p, tribe) => { const pr = pronouns(p); return `${p} shears frantically — and there it is! ${tribe.toUpperCase()} BRAND! ${pr.Sub} screams from the canyon floor!`; },
  (p, tribe) => { const pr = pronouns(p); return `The wool falls away and — YES! The ${tribe} brand is burned into the hide! ${p} holds it up for everyone to see!`; },
  (p, tribe) => { const pr = pronouns(p); return `${p}'s hands are shaking as ${pr.sub} shears the last patch. There's the brand. ${tribe}'s brand. The tribe ERUPTS.`; },
  (p, tribe) => { const pr = pronouns(p); return `BRAND! ${p} found one! The ${tribe} logo gleams on the sheep's flank. ${pr.Sub} pumps ${pr.posAdj} fist so hard the sheep startles.`; },
  (p, tribe) => { const pr = pronouns(p); return `${p} peels back the wool and — that's their mark. ${tribe}'s brand. ${pr.Sub} clutches the sheep like a trophy.`; },
  (p, tribe) => { const pr = pronouns(p); return `Wait — WAIT — ${p} found it! ${tribe} brand! The canyon echoes with cheering!`; },
  (p, tribe) => { const pr = pronouns(p); return `Shear, shear, shear — THERE. The ${tribe} brand. ${p} nearly drops the sheep from excitement.`; },
  (p, tribe) => { const pr = pronouns(p); return `${p} can barely believe it. Under all that wool: ${tribe}'s brand, clear as day. That's one closer to immunity.`; },
];

const BRAND_WRONG = [
  (p, otherTribe) => { const pr = pronouns(p); return `${p} shears eagerly — but that's the ${otherTribe} brand. Wrong team. ${pr.Sub} drops the sheep in disgust.`; },
  (p, otherTribe) => { const pr = pronouns(p); return `All that effort for... ${otherTribe}'s brand. ${p} kicks the dirt. That sheep was worth nothing to ${pr.obj}.`; },
  (p, otherTribe) => { const pr = pronouns(p); return `The brand emerges: ${otherTribe}. Not theirs. ${p} groans — but at least that sheep is out of the pool now.`; },
  (p, otherTribe) => { const pr = pronouns(p); return `${p} finishes shearing and stares. That's not their brand. That's ${otherTribe}'s. Wasted jump.`; },
  (p, otherTribe) => { const pr = pronouns(p); return `Wrong brand! ${p} uncovered ${otherTribe}'s mark. The ${otherTribe} spectators cheer sarcastically.`; },
  (p, otherTribe) => { const pr = pronouns(p); return `${p} peels back the last tuft and — ${otherTribe}'s brand stares back. ${pr.Sub} throws the shears down.`; },
];

const BRAND_NONE = [
  (p) => { const pr = pronouns(p); return `${p} shears the whole sheep. Nothing. No brand. Just wool and wasted time.`; },
  (p) => { const pr = pronouns(p); return `Clean wool, clean hide, clean nothing. ${p}'s sheep is unmarked. Back up ${pr.sub} goes.`; },
  (p) => { const pr = pronouns(p); return `${p} shears down to the skin. No brand. The canyon feels a little deeper on the ride back up.`; },
  (p) => { const pr = pronouns(p); return `No brand. ${p}'s face says it all. That was a lot of effort for a naked sheep.`; },
  (p) => { const pr = pronouns(p); return `${p} checks every inch. Front, back, ears, belly. Nothing. The sheep is brand-free. ${pr.Sub} lets it go.`; },
  (p) => { const pr = pronouns(p); return `Unmarked. ${p} sheared a dud. ${pr.Sub} trudges back to the cliff edge as the sheep trots off.`; },
];

const CHAOS_DINGO_GRAB = [
  (p) => { const pr = pronouns(p); return `${p} reaches into the flock and grabs — wait, that's not wool. That's FUR. That's a DINGO. ${p} GRABBED A DINGO.`; },
  (p) => { const pr = pronouns(p); return `${p}'s hand closes around something... wiry. Sharp teeth flash. That is NOT a sheep. ${pr.Sub} just grabbed a dingo.`; },
  (p) => { const pr = pronouns(p); return `"SHEEP! I got a—" ${p} looks down. The animal looks up. It growls. ${p} screams. It's a dingo.`; },
  (p) => { const pr = pronouns(p); return `${p} yanks what ${pr.sub} thinks is a sheep out of the pile. The dingo disagrees with this assessment. Loudly.`; },
  (p) => { const pr = pronouns(p); return `A dingo had been hiding in the flock. ${p} found it. The dingo found ${p}'s arm. This is going poorly.`; },
  (p) => { const pr = pronouns(p); return `${p} emerges from the bounce cradling something furry. It's not bleating. It's snarling. Oh no.`; },
];

const CHAOS_NO_CORD = [
  (p) => { const pr = pronouns(p); return `${p} is SO amped up ${pr.sub} FORGETS TO CLIP IN and launches off the cliff. The scream fades. The splat echoes.`; },
  (p) => { const pr = pronouns(p); return `"DID ${p.toUpperCase()} JUST — DID ${pr.sub.toUpperCase()} JUST JUMP WITHOUT THE CORD?!" The medics sprint. ${p} is out of the challenge.`; },
  (p) => { const pr = pronouns(p); return `${p} charges the edge with such intensity ${pr.sub} blows right past the clip station. Free fall. Full send. Full hospital.`; },
  (p) => { const pr = pronouns(p); return `The cord hangs limply on the ledge. ${p} is already at the bottom. Without it. The medical team was NOT ready for this.`; },
];

const CHAOS_TANGLE = [
  (p1, p2) => `${p1} and ${p2} jump at the same time — their cords TANGLE mid-air! Both spin helplessly as the crew untangles them. Neither gets a sheep.`,
  (p1, p2) => `The cords cross! ${p1} and ${p2} collide at the bottom of the arc in a mess of rope, limbs, and profanity. No grabs for either.`,
  (p1, p2) => `${p1}'s cord wraps around ${p2}'s on the way down. They spend the next 30 seconds spinning like a bolas. Zero sheep grabbed.`,
  (p1, p2) => `Mid-air collision! ${p1} and ${p2} smash into each other at the cord's apex. Both bounce away empty-handed. The sheep are unimpressed.`,
];

const CHAOS_THROWN = [
  (thrower, target) => { const thr = pronouns(thrower); return `${thrower} grabs a dingo from the canyon floor and HURLS it at ${target} mid-jump! ${target}'s grab goes sideways as ${thr.sub} ducks the airborne predator!`; },
  (thrower, target) => { const thr = pronouns(thrower); return `${thrower} whips a rock at ${target}'s bungee cord from the ledge! The cord vibrates wildly, throwing off ${target}'s trajectory!`; },
  (thrower, target) => { const thr = pronouns(thrower); return `${thrower} times it perfectly — ${thr.sub} shoves a sheep out of ${target}'s reach at the bottom of the arc. "OOPS." ${thr.Sub} smirks.`; },
  (thrower, target) => { const thr = pronouns(thrower); return `${thrower} "accidentally" releases a sheep pen gate just as ${target} descends. The flock scatters. ${target} grabs air.`; },
  (thrower, target) => { const thr = pronouns(thrower); return `${thrower} yells "${target}'s" name at the worst possible moment. ${target} flinches, loses focus, and the sheep bolts.`; },
  (thrower, target) => { const thr = pronouns(thrower); return `${thrower} throws ${target}'s teammate's shoe off the cliff. It hits ${target} in the shoulder. "Sorry! Wind!" ${thrower} lies.`; },
];

const ROUND_ANNOUNCE = [
  (n) => `ROUND ${n}. Fresh cords. Fresh fear. The sheep regroup at the canyon floor.`,
  (n) => `Round ${n} — the jumpers line up at the edge. The canyon doesn't get any less terrifying.`,
  (n) => `Round ${n} begins. The sheep below have learned nothing. Neither have the players.`,
  (n) => `The host signals Round ${n}. Somewhere in the canyon, a dingo licks its lips.`,
  (n) => `Round ${n}. The bungee cords are checked, rechecked, and checked again. Mostly.`,
  (n) => `Round ${n} is a go. The wind picks up. The sheep scatter. The players sweat.`,
];

const COMM_RACE = [
  'The dust trail stretches for miles behind the pack.',
  'You can hear the emus honking from the production tent.',
  'The heat shimmer makes the horizon dance.',
  'Somewhere in the distance, a kookaburra laughs at all of them.',
  'The camera crew can barely keep up with this pace.',
  'Dust clouds so thick the trailing riders are racing blind.',
  'The midday sun is absolutely punishing out here.',
  'Three tribes, four segments, and not a single emu that wants to cooperate.',
  'The terrain is getting rougher. The emus are getting angrier.',
  'Production had to relocate two cameras — the dust destroyed the first set.',
  'That emu just tried to eat a cameraman\'s hat. Mid-race.',
  'The outback doesn\'t care about your strategy. It just wants you to sweat.',
  'Someone\'s emu just stopped to look at a rock. That cost them.',
  'The wind shifts and suddenly everyone\'s eating dust.',
  'The sounds out here: hooves, honking, and increasingly creative profanity.',
];

const COMM_BUNGEE = [
  'The canyon wind howls between jumps.',
  'That is a LONG way down.',
  'The sheep below scatter every time someone jumps.',
  'You can see the bungee cords vibrating from the observation deck.',
  'The dingoes are circling. They can smell opportunity.',
  'That cord is holding a lot of trust right now.',
  'The canyon walls cast everything in deep shadow.',
  'Someone forgot to mention the canyon is also full of spiders.',
  'The sheep have learned to run when they see a shadow falling from above.',
  'The medical team is standing by. They always stand by for bungee episodes.',
  'The echo in this canyon makes every scream sound like three.',
  'A sheep just looked up mid-chew. It does not seem concerned.',
  'The bungee operator is having way too much fun with the tension.',
  'Canyon temperature: freezing. Canyon humidity: somehow also awful.',
];

const SOCIAL_BUNGEE_TAUNT = [
  (a, t) => { const pr = pronouns(a); return `${a} smirks at ${t}'s empty hands. 'Was that your best? My emu could've grabbed more.'`; },
  (a, t) => `${a} slow-claps as ${t} returns empty-handed. 'Inspiring performance.'`,
  (a, t) => `${a} holds up ${pronouns(a).posAdj} wool haul and waves it at ${t}. 'Need some of mine?'`,
  (a, t) => `${a} leans over to ${t}: 'You jumped like my grandmother. And she's afraid of heights.'`,
  (a, t) => `${a} pretends to write a score card. Holds up a '2' for ${t}.`,
  (a, t) => `${a} pats ${t} on the back with exaggerated sympathy. 'Not everyone's cut out for this.'`,
  (a, t) => { const pr = pronouns(a); return `${a} flexes ${pr.posAdj} sheep-grabbing hand at ${t}. 'These are premium hands, ${t}. Yours? Not so much.'`; },
  (a, t) => `${a} catches ${t}'s eye and mouths 'tribal council' with a grin.`,
];

const SOCIAL_BUNGEE_ENCOURAGE = [
  (a, t) => `${a} grabs ${t}'s shoulders. 'You've got this. One more jump and we're ahead.'`,
  (a, t) => `${a} high-fives ${t} after the grab. 'That's how it's done!'`,
  (a, t) => { const pr = pronouns(a); return `${a} wraps an arm around ${t}. 'We're winning this. Together.'`; },
  (a, t) => `${a} pumps ${t} up before the jump. 'You're the best grabber we've got. Believe it.'`,
  (a, t) => `${a} cheers from the clifftop as ${t} descends. 'GO GO GO!'`,
  (a, t) => { const pr = pronouns(a); return `${a} tells ${t} exactly where the best sheep are. '${pr.Sub}'s been watching the canyon floor.'`; },
  (a, t) => `${a} catches ${t} at the top and helps ${pronouns(t).obj} steady the sheep. Teamwork.`,
  (a, t) => `${a} makes eye contact with ${t} and nods. No words needed. They're in this together.`,
];

// ── emu wrangling text ──
const EMU_CATCH_APPROACH = [
  (p) => { const pr = pronouns(p); return `${p} crouches low and inches toward ${pr.posAdj} emu. The bird eyes ${pr.obj} suspiciously.`; },
  (p) => { const pr = pronouns(p); return `${p} spots an emu grazing and starts a slow, deliberate approach. Hands out. No sudden moves.`; },
  (p) => { const pr = pronouns(p); return `${p} picks a target — a big grey emu with attitude — and begins the stalk.`; },
  (p) => { const pr = pronouns(p); return `${p} circles around a cluster of emus, looking for the weakest link.`; },
  (p) => { const pr = pronouns(p); return `${p} takes a deep breath and walks straight at an emu like ${pr.sub} owns the place.`; },
  (p) => { const pr = pronouns(p); return `${p} tries the casual approach — just walking past, acting natural. The emu isn't fooled.`; },
];
const EMU_CATCH_SUCCESS = [
  (p) => { const pr = pronouns(p); return `${p} lunges and gets both arms around the emu's neck! It honks furiously but ${pr.sub}'s got it!`; },
  (p) => { const pr = pronouns(p); return `${p} dives, wraps ${pr.posAdj} legs around the bird's body, and wrestles it to a standstill. Caught!`; },
  (p) => { const pr = pronouns(p); return `The emu makes a break for it but ${p} is faster. ${pr.Sub} tackles it mid-stride and hangs on.`; },
  (p) => { const pr = pronouns(p); return `${p} corners the emu against a rock and gently grabs its neck. The bird surrenders... for now.`; },
  (p) => { const pr = pronouns(p); return `${p} offers ${pr.posAdj} hand. The emu sniffs it. Then pecks it. Then... allows ${pr.obj} to grab the reins. Caught.`; },
  (p) => { const pr = pronouns(p); return `${p} manages to loop a rope around the emu's neck on the first try. Natural wrangler.`; },
];
const EMU_CATCH_FAIL = [
  (p) => { const pr = pronouns(p); return `${p} dives for the emu and eats dirt. The bird struts away, completely unbothered.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu dodges at the last second. ${pr.Sub} grabs nothing but feathers and shame.`; },
  (p) => { const pr = pronouns(p); return `The emu kicks ${p} in the shin and bolts. ${pr.Sub} hops around cursing.`; },
  (p) => { const pr = pronouns(p); return `${p} almost has it — then the emu pecks ${pr.obj} right in the forehead and runs.`; },
  (p) => { const pr = pronouns(p); return `${p} trips over ${pr.posAdj} own feet trying to grab the emu. The bird watches with what might be pity.`; },
  (p) => { const pr = pronouns(p); return `${p} lunges, the emu sidesteps, and ${p} slides face-first through emu droppings. Bad day.`; },
];
const EMU_CATCH_HELP = [
  (a, t) => { const pr = pronouns(a); return `${a} brings an emu over to ${t}. 'Here, take this one.' ${t} stares. 'I already caught two,' ${a} shrugs.`; },
  (a, t) => `${a} herds an emu straight into ${t}'s arms. Teamwork — or pity. Either way, ${t} has a ride.`,
  (a, t) => { const pr = pronouns(a); return `${a} catches ${t} struggling and tackles a nearby emu on ${pr.posAdj} behalf. 'You owe me.'`; },
  (a, t) => `${a} whistles an emu over to ${t} like some kind of bird whisperer. ${t} is equal parts grateful and suspicious.`,
];
const EMU_CATCH_COMEDY = [
  (p) => { const pr = pronouns(p); return `${p}'s emu sits on ${pr.obj}. Just... sits. ${pr.Sub}'s pinned under 45 kilos of bird.`; },
  (p) => { const pr = pronouns(p); return `${p} chases ${pr.posAdj} emu in a perfect circle for thirty seconds before realizing it's leading ${pr.obj} nowhere.`; },
  (p) => { const pr = pronouns(p); return `${p} gets pecked so many times ${pr.sub} looks like ${pr.sub}'s been in a pillow fight with a stapler.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu steals ${pr.posAdj} hat and runs off with it. Now ${pr.sub}'s chasing the bird for TWO reasons.`; },
  (p) => { const pr = pronouns(p); return `${p} makes eye contact with the emu. The emu makes eye contact back. Then it charges. ${p} runs.`; },
  (p) => { const pr = pronouns(p); return `${p} tries to lasso an emu and accidentally lassos ${pr.ref}. The emu watches.`; },
];

// ── kangaroo encounter text ──
const KANGAROO_KICK = [
  (p) => { const pr = pronouns(p); return `A kangaroo appears out of NOWHERE and kicks ${p} flat on ${pr.posAdj} back! ${pr.Sub} sees stars.`; },
  (p) => { const pr = pronouns(p); return `${p} doesn't see the kangaroo until it's too late. One kick sends ${pr.obj} tumbling off ${pr.posAdj} emu.`; },
  (p) => { const pr = pronouns(p); return `${p} rounds a boulder and — WHAM. Kangaroo kick to the chest. ${pr.Sub}'s airborne for a full second.`; },
  (p) => { const pr = pronouns(p); return `A territorial kangaroo charges ${p}. ${pr.Sub} tries to dodge but takes a hind leg to the ribs.`; },
  (p) => { const pr = pronouns(p); return `${p} stumbles into a kangaroo's territory. The roo winds up and delivers a kick that echoes across the outback.`; },
  (p) => { const pr = pronouns(p); return `${p} locks eyes with a red kangaroo. The kangaroo doesn't blink. Then it kicks. ${p} goes flying.`; },
];
const KANGAROO_POUCH = [
  (p) => { const pr = pronouns(p); return `${p} arrives at Hanging Rock... in a kangaroo's pouch. ${pr.Sub} looks traumatized but technically finished.`; },
  (p) => { const pr = pronouns(p); return `After losing ${pr.posAdj} emu, ${p} somehow ends up riding in a kangaroo's pouch. Nobody questions it.`; },
  (p) => { const pr = pronouns(p); return `${p} crawls out of a kangaroo's pouch looking dazed. 'Don't ask,' ${pr.sub} mutters. 'Just... don't ask.'`; },
  (p) => { const pr = pronouns(p); return `A kangaroo deposits ${p} at Hanging Rock like a furry taxi service. ${pr.Sub} tips the roo with a granola bar.`; },
];
const KANGAROO_BLOCK = [
  (p) => { const pr = pronouns(p); return `A mob of kangaroos blocks the trail! ${p} has to detour around them, losing precious time.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu refuses to pass a big red kangaroo standing in the path. Smart bird. Cowardly, but smart.`; },
  (p) => { const pr = pronouns(p); return `${p} runs into a kangaroo standoff. Three roos, one trail, zero willingness to move.`; },
];

// ── overnight camp text ──
const OVERNIGHT_CAMP = [
  (t) => `${t} settles in for the night. Someone builds a fire. Someone else immediately sets something on fire that shouldn't be.`,
  (t) => `Night falls on ${t}'s camp. The emus are tied up. The stars are brilliant. Nobody can sleep because the emus won't stop honking.`,
  (t) => `${t} huddles around a weak campfire. The outback is freezing at night. The emus offer no warmth and less sympathy.`,
  (t) => `${t} camps under the southern sky. It would be romantic if they weren't all covered in emu feathers and regret.`,
];
const OVERNIGHT_SNORE = [
  (p) => { const pr = pronouns(p); return `${p} snores so loud the emus panic. Half of ${pr.posAdj} tribe wakes up to feathered chaos.`; },
  (p) => { const pr = pronouns(p); return `${p} falls asleep immediately and snores like a chainsaw. Nobody else sleeps.`; },
  (p) => { const pr = pronouns(p); return `${p}'s snoring attracts a curious wombat. The wombat sits on ${pr.posAdj} face. ${pr.Sub} doesn't notice.`; },
];
const OVERNIGHT_CONFRONTATION = [
  (a, t) => { const pr = pronouns(a); return `${a} can't sleep and confronts ${t} by the fire. 'We need to talk about your performance today.'`; },
  (a, t) => { const pr = pronouns(a); return `${a} corners ${t} while the others sleep. 'You threw that segment. I saw it.' The accusation hangs in the cold air.`; },
  (a, t) => `Late at night, ${a} and ${t} have a whispered argument that gets louder than either intended. Someone tells them to shut up.`,
  (a, t) => `${a} catches ${t} sneaking extra water rations. The staredown by firelight is intense.`,
];
const OVERNIGHT_BOND = [
  (a, t) => `${a} and ${t} share watch duty. By dawn, they've bonded over mutual emu hatred and outback survival stories.`,
  (a, t) => { const pr = pronouns(a); return `${a} gives ${t} ${pr.posAdj} blanket when the temperature drops. Small gesture, big impact.`; },
  (a, t) => `${a} and ${t} sit up talking while the others sleep. About the game. About home. About whether emus dream.`,
];

// ── arrival narration ──
const ARRIVAL_FIRST = [
  (p) => { const pr = pronouns(p); return `${p} crests the final ridge and sees Hanging Rock. ${pr.Sub} arrives FIRST — emu gasping, rider grinning.`; },
  (p) => { const pr = pronouns(p); return `${p}'s emu sprints the final stretch. ${pr.Sub} dismounts at Hanging Rock before anyone else is even visible.`; },
];
const ARRIVAL_MID = [
  (p) => { const pr = pronouns(p); return `${p} arrives at Hanging Rock, dusty and exhausted. ${pr.Sub} slides off the emu and collapses.`; },
  (p) => { const pr = pronouns(p); return `${p} rides in shortly after. ${pr.PosAdj} emu looks like it wants a divorce.`; },
  (p) => { const pr = pronouns(p); return `${p} stumbles in, sunburned and dehydrated. But ${pr.sub} made it.`; },
  (p) => { const pr = pronouns(p); return `${p} arrives looking surprisingly composed. ${pr.PosAdj} emu, not so much.`; },
];
const ARRIVAL_LAST = [
  (p) => { const pr = pronouns(p); return `${p} finally limps in dead last. ${pr.PosAdj} emu looks like it's been through a war.`; },
  (p) => { const pr = pronouns(p); return `${p} arrives so late the host was about to send a search party. ${pr.Sub} falls off the emu face-first.`; },
];
const ARRIVAL_KANGAROO = [
  (p) => { const pr = pronouns(p); return `${p} arrives at Hanging Rock... via kangaroo pouch. ${pr.Sub} tumbles out, covered in fur and shame.`; },
];

// ── shearing advantage text ──
const SHEAR_POWERED = [
  (t) => `${t} gets BATTERY-POWERED SHEARS! The wool practically flies off.`,
  (t) => `As first-place finishers, ${t} receives the powered clippers. This is going to be fast.`,
];
const SHEAR_STANDARD = [
  (t) => `${t} gets standard shears. Nothing fancy, but they work.`,
  (t) => `${t} receives a basic pair of shears. Middle of the pack, middle of the road.`,
];
const SHEAR_RUSTY = [
  (t) => `${t} gets RUSTY GARDEN SHEARS. This is going to be painful... for everyone.`,
  (t) => `Last place means ${t} is stuck with rusty, bent garden shears. Every cut is a struggle.`,
];

// ── host commentary ──
const HOST_WAITING = [
  'The host has carved himself a didgeridoo while waiting. He plays it badly.',
  'The host is getting a suntan. The production intern is holding an umbrella over the equipment, not the host.',
  'The host checks his watch. Then checks it again. Then throws it into the canyon.',
  'The host has been waiting so long he\'s started naming the sheep.',
];

// ═══════════════════════════════════════════════════════════════
//  SIMULATION
// ═══════════════════════════════════════════════════════════════

function _canScheme(name) {
  const arch = players.find(p => p.name === name)?.archetype;
  if (['villain', 'mastermind', 'schemer'].includes(arch)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(arch)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

function _generateSocialEvent(afterSeg, tribes, tribeOf, ep) {
  const allPlayers = tribes.flatMap(t => t.members);
  const schemers = allPlayers.filter(p => _canScheme(p));

  // even without schemers, emu clashes can happen (~40% fallback)
  if (schemers.length === 0) {
    if (Math.random() < 0.4 && allPlayers.length >= 2) {
      const a = pick(allPlayers);
      const rivals = allPlayers.filter(p => tribeOf[p] !== tribeOf[a]);
      if (rivals.length === 0) return null;
      const t = pick(rivals);
      addBond(a, t, -1);
      return {
        afterSegment: afterSeg, type: 'emu-clash',
        actor: a, target: t, actorTribe: tribeOf[a], targetTribe: tribeOf[t],
        narrative: pick(SOCIAL_CLASH)(a, t),
        bondDelta: -1, popDelta: 0, timePenalty: 1 + noise(0.5),
        counterReaction: null,
      };
    }
    return null;
  }

  const actor = pick(schemers);
  const actorTribe = tribeOf[actor];
  const rivals = allPlayers.filter(p => tribeOf[p] !== actorTribe);
  if (rivals.length === 0) return null;
  const target = pick(rivals);
  const targetTribe = tribeOf[target];
  const s = pStats(actor);

  const roll = Math.random();
  let evt;

  if (roll < 0.3 && romanticCompat(actor, target)) {
    // flirtation distraction
    const timePen = 1 + s.social * 0.2 + noise(0.5);
    evt = {
      afterSegment: afterSeg, type: 'flirt',
      actor, target, actorTribe, targetTribe,
      narrative: pick(SOCIAL_FLIRT)(actor, target),
      bondDelta: -1, popDelta: -1, timePenalty: Math.max(0.5, timePen),
      counterReaction: null,
    };
    addBond(actor, target, -1);
    popDelta(actor, -1);

    // counter-reaction from target's teammate
    const teammates = tribes.find(t => t.tribeName === targetTribe)?.members.filter(m => m !== target) || [];
    const loyalMate = teammates.sort((a, b) => {
      const sa = pStats(a), sb = pStats(b);
      return (sb.loyalty * 0.7 + sb.intuition * 0.3 + noise(2)) - (sa.loyalty * 0.7 + sa.intuition * 0.3 + noise(2));
    })[0];
    if (loyalMate && (pStats(loyalMate).loyalty * 0.7 + pStats(loyalMate).intuition * 0.3 + noise(2)) > 5.5) {
      evt.counterReaction = {
        player: loyalMate,
        narrative: pick(SOCIAL_COUNTER)(loyalMate, target),
        bondBoost: 2,
      };
      evt.timePenalty *= 0.5;
      addBond(loyalMate, target, 2);
      ep.campEvents[targetTribe]?.post.push({
        text: `${loyalMate} caught ${actor}'s flirtation gambit and snapped ${target} out of it`,
        players: [loyalMate, target, actor], badgeText: 'Counter', badgeClass: 'badge-green',
      });
    }
  } else if (roll < 0.55) {
    // fake alliance whisper
    const targetMates = tribes.find(t => t.tribeName === targetTribe)?.members.filter(m => m !== target) || [];
    const doubted = targetMates.length > 0 ? pick(targetMates) : target;
    evt = {
      afterSegment: afterSeg, type: 'fake-alliance',
      actor, target, actorTribe, targetTribe,
      narrative: pick(SOCIAL_FAKE_ALLIANCE)(actor, target),
      bondDelta: -2, popDelta: 0, timePenalty: 0,
      counterReaction: null,
    };
    addBond(target, doubted, -2);
    ep.campEvents[targetTribe]?.post.push({
      text: `${actor} planted seeds of doubt between ${target} and ${doubted}`,
      players: [actor, target, doubted], badgeText: 'Scheme', badgeClass: 'badge-red',
    });
  } else if (roll < 0.8) {
    // trash talk
    evt = {
      afterSegment: afterSeg, type: 'trash-talk',
      actor, target, actorTribe, targetTribe,
      narrative: pick(SOCIAL_TRASH)(actor, target),
      bondDelta: -1, popDelta: -1, timePenalty: 0.5 + s.boldness * 0.1,
      counterReaction: null,
    };
    addBond(actor, target, -1);
    popDelta(actor, -1);
  } else {
    // emu clash
    evt = {
      afterSegment: afterSeg, type: 'emu-clash',
      actor, target, actorTribe, targetTribe,
      narrative: pick(SOCIAL_CLASH)(actor, target),
      bondDelta: -1, popDelta: 0,
      timePenalty: 1 + noise(0.5),
      counterReaction: null,
    };
    addBond(actor, target, -1);
  }
  return evt;
}

function _generatePostMergeSocialEvent(afterSeg, activePlayers, ep, campKey) {
  const schemers = activePlayers.filter(p => _canScheme(p));

  // emu clashes can happen without schemers (~40%)
  if (schemers.length === 0) {
    if (Math.random() < 0.4 && activePlayers.length >= 2) {
      const a = pick(activePlayers);
      const t = pick(activePlayers.filter(p => p !== a));
      if (!t) return null;
      addBond(a, t, -1);
      return {
        afterSegment: afterSeg, type: 'emu-clash',
        actor: a, target: t, actorTribe: campKey, targetTribe: campKey,
        narrative: pick(SOCIAL_CLASH)(a, t),
        bondDelta: -1, popDelta: 0, timePenalty: 1 + noise(0.5),
        counterReaction: null,
      };
    }
    return null;
  }

  const actor = pick(schemers);
  const target = pick(activePlayers.filter(p => p !== actor));
  if (!target) return null;
  const s = pStats(actor);
  const roll = Math.random();
  let evt;

  if (roll < 0.3 && romanticCompat(actor, target)) {
    // flirtation distraction
    const timePen = 1 + s.social * 0.2 + noise(0.5);
    evt = {
      afterSegment: afterSeg, type: 'flirt',
      actor, target, actorTribe: campKey, targetTribe: campKey,
      narrative: pick(SOCIAL_FLIRT)(actor, target),
      bondDelta: -1, popDelta: -1, timePenalty: Math.max(0.5, timePen),
      counterReaction: null,
    };
    addBond(actor, target, -1);
    popDelta(actor, -1);

    // counter-reaction from a loyal player
    const loyalCandidates = activePlayers.filter(m => m !== target && m !== actor);
    const loyalMate = loyalCandidates.sort((a, b) => {
      const sa = pStats(a), sb = pStats(b);
      return (sb.loyalty * 0.7 + sb.intuition * 0.3 + noise(2)) - (sa.loyalty * 0.7 + sa.intuition * 0.3 + noise(2));
    })[0];
    if (loyalMate && (pStats(loyalMate).loyalty * 0.7 + pStats(loyalMate).intuition * 0.3 + noise(2)) > 5.5) {
      evt.counterReaction = {
        player: loyalMate,
        narrative: pick(SOCIAL_COUNTER)(loyalMate, target),
        bondBoost: 2,
      };
      evt.timePenalty *= 0.5;
      addBond(loyalMate, target, 2);
      ep.campEvents[campKey]?.post.push({
        text: `${loyalMate} caught ${actor}'s flirtation gambit and snapped ${target} out of it`,
        players: [loyalMate, target, actor], badgeText: 'Counter', badgeClass: 'badge-green',
      });
    }
  } else if (roll < 0.45) {
    // sabotage (schemer cuts emu reins, scatters supplies)
    evt = {
      afterSegment: afterSeg, type: 'sabotage',
      actor, target, actorTribe: campKey, targetTribe: campKey,
      narrative: `${actor} loosens ${target}'s emu saddle between segments. The emu bolts as soon as ${target} mounts up.`,
      bondDelta: -2, popDelta: -1, timePenalty: 2 + s.strategic * 0.2 + noise(0.5),
      counterReaction: null,
    };
    addBond(actor, target, -2);
    popDelta(actor, -1);
    ep.campEvents[campKey]?.post.push({
      text: `${actor} sabotaged ${target}'s emu between race segments`,
      players: [actor, target], badgeText: 'Sabotage', badgeClass: 'badge-red',
    });
  } else if (roll < 0.65) {
    // trash talk
    evt = {
      afterSegment: afterSeg, type: 'trash-talk',
      actor, target, actorTribe: campKey, targetTribe: campKey,
      narrative: pick(SOCIAL_TRASH)(actor, target),
      bondDelta: -1, popDelta: -1, timePenalty: 0.5 + s.boldness * 0.1,
      counterReaction: null,
    };
    addBond(actor, target, -1);
    popDelta(actor, -1);
  } else if (roll < 0.82) {
    // emu clash
    evt = {
      afterSegment: afterSeg, type: 'emu-clash',
      actor, target, actorTribe: campKey, targetTribe: campKey,
      narrative: pick(SOCIAL_CLASH)(actor, target),
      bondDelta: -1, popDelta: 0, timePenalty: 1 + noise(0.5),
      counterReaction: null,
    };
    addBond(actor, target, -1);
  } else {
    // encouragement from nice players (if actor happens to be nice — fallback to clash)
    const niceOnes = activePlayers.filter(p => {
      const a = players.find(x => x.name === p)?.archetype;
      return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a);
    });
    if (niceOnes.length > 0) {
      const encourager = pick(niceOnes);
      const encouraged = pick(activePlayers.filter(p => p !== encourager));
      if (encouraged) {
        evt = {
          afterSegment: afterSeg, type: 'encourage',
          actor: encourager, target: encouraged, actorTribe: campKey, targetTribe: campKey,
          narrative: `${encourager} rides up beside ${encouraged} between segments. 'You've got this. Keep pushing.'`,
          bondDelta: 2, popDelta: 1, timePenalty: 0,
          counterReaction: null,
        };
        addBond(encourager, encouraged, 2);
        popDelta(encourager, 1);
      }
    }
    if (!evt) {
      evt = {
        afterSegment: afterSeg, type: 'emu-clash',
        actor, target, actorTribe: campKey, targetTribe: campKey,
        narrative: pick(SOCIAL_CLASH)(actor, target),
        bondDelta: -1, popDelta: 0, timePenalty: 1 + noise(0.5),
        counterReaction: null,
      };
      addBond(actor, target, -1);
    }
  }
  return evt;
}

export function simulatePicnicHangingDork(ep) {
  if (!gs.isMerged) {
  // ── PRE-MERGE (tribe challenge) ──
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const allActive = tribes.flatMap(t => t.members);
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  const result = {
    tribes: [], socialEvents: [], bungeeSocialEvents: [],
    rankings: [], winningTribe: '', losingTribe: '',
    raceWinner: '', bungeeWinner: '', brandWinner: '', mvpPlayer: '',
    kangarooEvents: [], overnightEvents: [], bungeeRounds: [],
  };

  // build tribe data
  const tribeData = tribes.map(t => ({
    tribeName: t.name,
    members: t.members.filter(m => allActive.includes(m)),
    color: tribeColor(t.name),
    emuWrangling: [],
    emuSegments: [],
    totalRaceTime: 0,
    arrivalOrder: [],
    shearAdvantage: 'standard',
    bungeeGrabs: [],
    totalWool: 0,
    momentum: 0,
  }));

  // ── PHASE 0: EMU WRANGLING ──
  tribeData.forEach(td => {
    td.members.forEach(m => {
      const s = pStats(m);
      const rawCatch = s.physical * 0.4 + s.boldness * 0.3 + s.endurance * 0.3 + noise(2.5);
      const catchScore = isNaN(rawCatch) ? 5 : rawCatch;
      const attempts = catchScore > 7 ? 1 : catchScore > 4 ? 2 : 3;
      const emuQuality = clamp(Math.round(catchScore), 1, 10);
      const events = [];

      events.push({ type: 'approach', text: pick(EMU_CATCH_APPROACH)(m) });

      if (attempts >= 2) {
        events.push({ type: 'fail', text: pick(EMU_CATCH_FAIL)(m) });
        if (Math.random() < 0.4) events.push({ type: 'comedy', text: pick(EMU_CATCH_COMEDY)(m) });
      }
      if (attempts >= 3) {
        events.push({ type: 'fail', text: pick(EMU_CATCH_FAIL)(m) });
        // teammate help?
        const teammates = td.members.filter(t => t !== m);
        const helper = teammates.find(t => {
          const hs = pStats(t);
          return hs.loyalty > 5 && (td.emuWrangling.find(w => w.player === t)?.caught);
        });
        if (helper) {
          events.push({ type: 'help', text: pick(EMU_CATCH_HELP)(helper, m), helper });
          addBond(helper, m, 1);
          addBond(m, helper, 1);
        }
      }

      events.push({ type: 'success', text: pick(EMU_CATCH_SUCCESS)(m) });
      ep.chalMemberScores[m] = (ep.chalMemberScores[m] || 0) + (11 - attempts) * 0.5;

      td.emuWrangling.push({
        player: m, attempts, emuQuality, caught: true, events,
        catchTime: attempts * 8 + noise(3),
      });
    });
  });

  // ── PHASE 1: EMU RACE ──
  const timePenalties = {};
  tribeData.forEach(t => { timePenalties[t.tribeName] = 0; });

  for (let segIdx = 0; segIdx < 4; segIdx++) {
    const segResults = [];

    tribeData.forEach(td => {
      const memberRolls = [];
      let segEvents = [];

      td.members.forEach(m => {
        const s = pStats(m);
        const wrangling = td.emuWrangling.find(w => w.player === m);
        const emuBonus = wrangling ? (wrangling.emuQuality - 5) * 0.15 : 0;
        const raw = SEG_STAT_FN[segIdx](s) + noise(2.5) + emuBonus;
        const events = [];

        const roll = Math.random();
        // emu bucks (~15%)
        if (roll < 0.15) {
          const agiCheck = s.physical * 0.5 + s.boldness * 0.5 + noise(2);
          if (agiCheck < 5) {
            events.push({ type: 'buck', text: pick(EMU_BUCK)(m), timeDelta: 2.5 });
          } else {
            events.push({ type: 'save', text: pick(EMU_BUCK_SAVE)(m), timeDelta: 0.3 });
          }
        }
        // surge (~12%) — big physical burst
        else if (roll < 0.27) {
          const physCheck = s.physical * 0.5 + s.endurance * 0.5 + noise(2);
          if (physCheck > 5) {
            events.push({ type: 'surge', text: pick(EMU_SURGE)(m), timeDelta: -2 });
            ep.chalMemberScores[m] = (ep.chalMemberScores[m] || 0) + 2;
            popDelta(m, 1);
          }
        }
        // shortcut (~12%)
        else if (roll < 0.39) {
          const intCheck = s.intuition + noise(2);
          if (intCheck > 4.5) {
            events.push({ type: 'shortcut', text: pick(EMU_SHORTCUT)(m), timeDelta: -1.5 });
            ep.chalMemberScores[m] = (ep.chalMemberScores[m] || 0) + 2;
          }
        }
        // stumble (~12%)
        else if (roll < 0.51) {
          const physCheck = s.physical + noise(2);
          events.push({
            type: 'stumble', text: pick(EMU_STUMBLE)(m),
            timeDelta: physCheck > 5 ? 1 : 2.5,
          });
        }
        // emu refuses (~10% all segments, more likely in later ones)
        else if (roll < 0.61 && (segIdx >= 2 || Math.random() < 0.4)) {
          const boldCheck = s.boldness + noise(2);
          events.push({
            type: 'refuse', text: pick(EMU_REFUSE)(m),
            timeDelta: boldCheck > 5 ? 1.5 : 3.5,
          });
        }
        // emu cooperation (~10%) — rider-bird synergy
        else if (roll < 0.71) {
          const endCheck = s.endurance * 0.5 + s.social * 0.5 + noise(2);
          if (endCheck > 5) {
            events.push({ type: 'bond', text: pick(EMU_COOPERATION)(m), timeDelta: -1.2 });
          }
        }
        // dust blind (~8%) — trailing rider gets blinded
        else if (roll < 0.79) {
          events.push({ type: 'dust', text: pick(EMU_DUST_BLIND)(m), timeDelta: 1.8 });
        }

        // guarantee at least ~40% of players have events per segment
        if (events.length === 0 && Math.random() < 0.25) {
          if (Math.random() < 0.5) {
            events.push({ type: 'stumble', text: pick(EMU_STUMBLE)(m), timeDelta: 1.2 });
          } else {
            events.push({ type: 'surge', text: pick(EMU_SURGE)(m), timeDelta: -1.0 });
          }
        }

        // score contribution
        const rawScore = isNaN(raw) ? 5 : raw;
        ep.chalMemberScores[m] = (ep.chalMemberScores[m] || 0) + Math.max(0, rawScore * 0.5);
        memberRolls.push({ name: m, score: rawScore, event: events[0] || null });
        events.forEach(e => segEvents.push({ ...e, player: m }));
      });

      const avgScore = memberRolls.reduce((sum, r) => sum + r.score, 0) / (memberRolls.length || 1);
      const safeAvg = isNaN(avgScore) ? 5 : avgScore;
      const momFactor = 1.0 + td.momentum * 0.1;
      let segTime = BASE_SEG_TIME / (1 + safeAvg * momFactor / 10);
      segEvents.forEach(e => { segTime += (e.timeDelta || 0); });
      segTime += timePenalties[td.tribeName] || 0;
      if (isNaN(segTime) || segTime <= 0) segTime = BASE_SEG_TIME;
      segTime = Math.max(8, segTime);
      timePenalties[td.tribeName] = 0;

      td.emuSegments.push({
        segName: SEG_NAMES[segIdx], segIdx,
        time: Math.round(segTime * 10) / 10,
        momentum: td.momentum,
        memberRolls, events: segEvents,
      });
      td.totalRaceTime += segTime;

      segResults.push({ tribeName: td.tribeName, segTime });
    });

    // update momentum
    segResults.sort((a, b) => a.segTime - b.segTime);
    tribeData.forEach(td => {
      if (td.tribeName === segResults[0].tribeName) {
        td.momentum = clamp(td.momentum + 1, -2, 2);
      } else if (td.tribeName === segResults[segResults.length - 1].tribeName) {
        td.momentum = clamp(td.momentum - 1, -2, 2);
      }
    });

    // social events between segments (not after last)
    if (segIdx < 3) {
      const numEvents = 1 + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
      for (let i = 0; i < numEvents; i++) {
        const evt = _generateSocialEvent(segIdx, tribeData, tribeOf, ep);
        if (evt) {
          result.socialEvents.push(evt);
          if (evt.timePenalty > 0) {
            timePenalties[evt.targetTribe] = (timePenalties[evt.targetTribe] || 0) + evt.timePenalty;
          }
        }
      }

      // kangaroo encounters (~25% per segment break, affects random player)
      if (Math.random() < 0.25) {
        const victim = pick(allActive);
        const victimTribe = tribeOf[victim];
        const kickDamage = 2 + noise(1);
        const isPouch = Math.random() < 0.15; // rare: ride in pouch
        const narrative = isPouch ? pick(KANGAROO_POUCH)(victim) : pick(KANGAROO_KICK)(victim);
        result.kangarooEvents.push({
          afterSegment: segIdx, player: victim, tribe: victimTribe,
          type: isPouch ? 'pouch' : 'kick', narrative,
          timeDelta: isPouch ? -1 : kickDamage,
        });
        if (!isPouch) {
          timePenalties[victimTribe] = (timePenalties[victimTribe] || 0) + kickDamage;
          popDelta(victim, -1);
        } else {
          popDelta(victim, 1);
        }
        ep.campEvents[victimTribe]?.post.push({
          text: isPouch ? `${victim} arrived at Hanging Rock via kangaroo pouch` : `${victim} got kicked by a kangaroo during the emu race`,
          players: [victim], badgeText: isPouch ? 'Pouch' : 'Kicked', badgeClass: isPouch ? 'badge-blue' : 'badge-red',
        });
      }

      // kangaroo blocks trail (~15%)
      if (Math.random() < 0.15) {
        const blockedTribe = pick(tribeData);
        const blockedPlayer = pick(blockedTribe.members);
        result.kangarooEvents.push({
          afterSegment: segIdx, player: blockedPlayer, tribe: blockedTribe.tribeName,
          type: 'block', narrative: pick(KANGAROO_BLOCK)(blockedPlayer), timeDelta: 1.5,
        });
        timePenalties[blockedTribe.tribeName] = (timePenalties[blockedTribe.tribeName] || 0) + 1.5;
      }

      // overnight camp after segment 1 (the "two-day journey")
      if (segIdx === 1) {
        tribeData.forEach(td => {
          const campNarrative = pick(OVERNIGHT_CAMP)(td.tribeName);
          result.overnightEvents.push({ type: 'camp', tribe: td.tribeName, narrative: campNarrative });

          // snoring event (~30%)
          if (Math.random() < 0.3) {
            const snorer = pick(td.members);
            result.overnightEvents.push({
              type: 'snore', tribe: td.tribeName, player: snorer,
              narrative: pick(OVERNIGHT_SNORE)(snorer),
            });
            td.members.forEach(m => { if (m !== snorer) { ep.chalMemberScores[m] = (ep.chalMemberScores[m] || 0) - 0.3; } });
          }

          // confrontation or bond (~40%)
          if (Math.random() < 0.4 && td.members.length >= 2) {
            const p1 = pick(td.members);
            const p2 = pick(td.members.filter(m => m !== p1));
            if (p2) {
              const bond = getBond(p1, p2);
              if (bond < 0 || _canScheme(p1)) {
                result.overnightEvents.push({
                  type: 'confrontation', tribe: td.tribeName, actor: p1, target: p2,
                  narrative: pick(OVERNIGHT_CONFRONTATION)(p1, p2),
                });
                addBond(p1, p2, -1);
                ep.campEvents[td.tribeName]?.post.push({
                  text: `${p1} confronted ${p2} during the overnight camp`, players: [p1, p2],
                  badgeText: 'Tension', badgeClass: 'badge-red',
                });
              } else {
                result.overnightEvents.push({
                  type: 'bond', tribe: td.tribeName, actor: p1, target: p2,
                  narrative: pick(OVERNIGHT_BOND)(p1, p2),
                });
                addBond(p1, p2, 2);
                ep.campEvents[td.tribeName]?.post.push({
                  text: `${p1} and ${p2} bonded during overnight camp`, players: [p1, p2],
                  badgeText: 'Bond', badgeClass: 'badge-green',
                });
              }
            }
          }
        });
      }
    }
  }

  // ── STAGGERED ARRIVALS ──
  tribeData.forEach(td => {
    const memberTimes = td.members.map(m => {
      const s = pStats(m);
      const wrangling = td.emuWrangling.find(w => w.player === m);
      const emuBonus = wrangling ? wrangling.emuQuality * 0.3 : 0;
      const rawTime = td.totalRaceTime + (10 - s.endurance) * 0.5 + noise(3) - emuBonus;
      return { player: m, time: isNaN(rawTime) ? BASE_SEG_TIME * 4 : rawTime };
    });
    memberTimes.sort((a, b) => a.time - b.time);
    td.arrivalOrder = memberTimes.map(mt => ({
      player: mt.player, arrivalTime: Math.round((mt.time || BASE_SEG_TIME * 4) * 10) / 10,
      kangarooPouch: result.kangarooEvents.some(ke => ke.player === mt.player && ke.type === 'pouch'),
    }));
  });

  // race rankings
  const raceRanked = tribeData.slice().sort((a, b) => a.totalRaceTime - b.totalRaceTime);
  result.raceWinner = raceRanked[0].tribeName;
  const fastestTime = raceRanked[0].totalRaceTime;
  const raceScores = {};
  raceRanked.forEach(td => {
    raceScores[td.tribeName] = 100 * fastestTime / td.totalRaceTime;
  });

  // ── SHEARING ADVANTAGE ──
  raceRanked[0].shearAdvantage = 'powered';
  raceRanked[raceRanked.length - 1].shearAdvantage = 'rusty';
  if (raceRanked.length > 2) {
    for (let i = 1; i < raceRanked.length - 1; i++) raceRanked[i].shearAdvantage = 'standard';
  }

  // ── PHASE 2: BUNGEE BRAND HUNT ──
  // Build the sheep pool: 5 branded per tribe + 2 unmarked (find 3 of your 5 to win)
  const numTribes = tribeData.length;
  const sheepPool = [];
  tribeData.forEach(td => {
    for (let i = 0; i < 5; i++) sheepPool.push({ brand: td.tribeName });
  });
  for (let i = 0; i < 2; i++) sheepPool.push({ brand: null });
  // shuffle
  for (let i = sheepPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sheepPool[i], sheepPool[j]] = [sheepPool[j], sheepPool[i]];
  }

  // track brands found per tribe, incapacitated players
  const tribeBrandsFound = {};
  tribeData.forEach(td => { tribeBrandsFound[td.tribeName] = 0; td.brandsFound = 0; });
  const incapacitated = new Set();
  const bungeeRounds = [];
  let brandWinnerTribe = null;

  // rotation index per tribe
  const tribeJumperIdx = {};
  tribeData.forEach(td => { tribeJumperIdx[td.tribeName] = 0; });

  for (let roundNum = 1; roundNum <= 10 && !brandWinnerTribe && sheepPool.length > 0; roundNum++) {
    const roundData = { round: roundNum, jumps: [] };

    // Each tribe picks ONE jumper this round (rotate through members)
    const roundJumpers = []; // { tribeName, player }
    tribeData.forEach(td => {
      const available = td.members.filter(m => !incapacitated.has(m));
      if (available.length === 0) return;
      const idx = tribeJumperIdx[td.tribeName] % available.length;
      const jumper = available[idx];
      tribeJumperIdx[td.tribeName]++;
      roundJumpers.push({ tribeName: td.tribeName, player: jumper, td });
    });

    // Process each jump
    roundJumpers.forEach(({ tribeName, player, td }) => {
      const s = pStats(player);
      const approach = s.boldness + noise(2.5) < 4 ? 'cautious' : s.boldness + noise(2.5) > 7 ? 'greedy' : 'normal';

      let chaosType = null, chaosData = null;
      let grabSuccess = false, sheepBrand = null, isOwnBrand = false;
      let woolFinal = 0;

      // Roll for chaos FIRST
      const chaosRoll = Math.random();

      // 2% NO CORD — incapacitated
      if (chaosRoll < 0.02) {
        chaosType = 'no-cord';
        incapacitated.add(player);
        popDelta(player, -2);
        const campKey = tribeName;
        ep.campEvents[campKey]?.post.push({
          text: `${player} jumped without a bungee cord and is out of the challenge`,
          players: [player], badgeText: 'No Cord!', badgeClass: 'badge-red',
        });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 2;
      }
      // 4% TANGLE with another tribe's jumper
      else if (chaosRoll < 0.06 && roundJumpers.length >= 2) {
        const otherJumpers = roundJumpers.filter(rj => rj.tribeName !== tribeName && !incapacitated.has(rj.player));
        if (otherJumpers.length > 0) {
          const tanglePartner = pick(otherJumpers);
          chaosType = 'tangle';
          chaosData = { partner: tanglePartner.player };
          ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 2;
          ep.chalMemberScores[tanglePartner.player] = (ep.chalMemberScores[tanglePartner.player] || 0) + 2;
        }
      }
      // 5% DINGO GRAB
      else if (chaosRoll < 0.11) {
        chaosType = 'dingo-grab';
        const fightCheck = s.physical * 0.5 + s.boldness * 0.3 + noise(2.5);
        chaosData = { foughtOff: fightCheck > 5 };
        if (!chaosData.foughtOff) {
          popDelta(player, -1);
        }
        ep.campEvents[tribeName]?.post.push({
          text: `${player} grabbed a dingo instead of a sheep during the bungee brand hunt`,
          players: [player], badgeText: 'Dingo!', badgeClass: 'badge-red',
        });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 2;
      }

      // Check if villain throws at someone
      let thrownAt = false, thrower = null;
      if (!chaosType) {
        const otherJumpers = roundJumpers.filter(rj => rj.tribeName !== tribeName && !incapacitated.has(rj.player));
        otherJumpers.forEach(rj => {
          if (_canScheme(rj.player) && Math.random() < 0.12) {
            thrownAt = true;
            thrower = rj.player;
            chaosType = 'thrown';
            chaosData = { thrower: rj.player };
            addBond(rj.player, player, -1);
            popDelta(rj.player, -1);
          }
        });
      }

      // Grab attempt (only if no incapacitating chaos)
      if (!incapacitated.has(player) && chaosType !== 'no-cord' && chaosType !== 'tangle' && chaosType !== 'dingo-grab') {
        const grabScore = (s.physical * 0.4 + s.boldness * 0.3 + s.endurance * 0.3 + noise(2.5)) / 10;
        const shearAdv = td.shearAdvantage;
        const advMod = shearAdv === 'powered' ? -0.08 : shearAdv === 'rusty' ? 0.08 : 0;
        let threshold = approach === 'cautious' ? 0.25 : approach === 'normal' ? 0.35 : 0.48;
        threshold += advMod;
        if (thrownAt) threshold += 0.15;
        grabSuccess = grabScore > threshold && sheepPool.length > 0;

        if (grabSuccess) {
          // Pop a random sheep from pool
          const sheepIdx = Math.floor(Math.random() * sheepPool.length);
          const grabbed = sheepPool.splice(sheepIdx, 1)[0];
          sheepBrand = grabbed.brand;
          isOwnBrand = sheepBrand === tribeName;

          // Shearing for wool (secondary scoring)
          const shearMult = shearAdv === 'powered' ? 1.3 : shearAdv === 'rusty' ? 0.7 : 1.0;
          const sheepData = pick(SHEEP_TYPES);
          const woolRaw = sheepData.woolMin + Math.floor(Math.random() * (sheepData.woolMax - sheepData.woolMin + 1));
          const shearEfficiency = (s.physical * 0.4 + s.endurance * 0.3 + s.intuition * 0.3 + noise(2)) / 10;
          woolFinal = Math.round(woolRaw * Math.min(1, shearEfficiency * 1.2) * shearMult);
          woolFinal = Math.max(1, woolFinal);

          if (isOwnBrand) {
            tribeBrandsFound[tribeName]++;
            td.brandsFound = tribeBrandsFound[tribeName];
            ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 15;
            popDelta(player, 2);
            ep.campEvents[tribeName]?.post.push({
              text: `${player} found a ${tribeName} brand during the bungee hunt!`,
              players: [player], badgeText: 'Brand!', badgeClass: 'badge-green',
            });
          } else {
            ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 3;
          }
        } else if (!grabSuccess) {
          ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 0;
        }
      }

      const jumpResult = {
        player, round: roundNum, approach, grabSuccess, sheepBrand, isOwnBrand,
        woolFinal, chaosType, chaosData, tribeName,
      };
      roundData.jumps.push(jumpResult);
      td.bungeeGrabs.push(jumpResult);
      td.totalWool += woolFinal;
    });

    bungeeRounds.push(roundData);

    // Social events between rounds (every other round)
    if (roundNum % 2 === 1 && roundNum < 10) {
      const allBungeePlayers = tribeData.flatMap(t => t.members).filter(p => !incapacitated.has(p));
      const socialRoll = Math.random();
      let socialEvt = null;

      if (socialRoll < 0.35) {
        const villains = allBungeePlayers.filter(p => _canScheme(p));
        const niceOnes = allBungeePlayers.filter(p => {
          const a = players.find(x => x.name === p)?.archetype;
          return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a);
        });
        if (villains.length > 0 && allBungeePlayers.length > 1) {
          const taunter = pick(villains);
          const taunted = pick(allBungeePlayers.filter(p => p !== taunter));
          socialEvt = {
            type: 'taunt', actor: taunter, target: taunted, afterRound: roundNum,
            narrative: pick(SOCIAL_BUNGEE_TAUNT)(taunter, taunted),
            bondDelta: -1, popDelta: -1,
          };
          addBond(taunter, taunted, -1);
          popDelta(taunter, -1);
        } else if (niceOnes.length > 0) {
          const encourager = pick(niceOnes);
          const encouraged = pick(allBungeePlayers.filter(p => p !== encourager && tribeOf[p] === tribeOf[encourager]));
          if (encouraged) {
            socialEvt = {
              type: 'encourage', actor: encourager, target: encouraged, afterRound: roundNum,
              narrative: pick(SOCIAL_BUNGEE_ENCOURAGE)(encourager, encouraged),
              bondDelta: 2, popDelta: 1,
            };
            addBond(encourager, encouraged, 2);
            popDelta(encourager, 1);
          }
        }
      } else if (socialRoll < 0.55) {
        const niceOnes = allBungeePlayers.filter(p => {
          const a = players.find(x => x.name === p)?.archetype;
          return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a);
        });
        if (niceOnes.length > 0) {
          const encourager = pick(niceOnes);
          const teammates = allBungeePlayers.filter(p => p !== encourager && tribeOf[p] === tribeOf[encourager]);
          const encouraged = teammates.length > 0 ? pick(teammates) : pick(allBungeePlayers.filter(p => p !== encourager));
          if (encouraged) {
            socialEvt = {
              type: 'encourage', actor: encourager, target: encouraged, afterRound: roundNum,
              narrative: pick(SOCIAL_BUNGEE_ENCOURAGE)(encourager, encouraged),
              bondDelta: 2, popDelta: 1,
            };
            addBond(encourager, encouraged, 2);
            popDelta(encourager, 1);
          }
        }
      }

      if (socialEvt) result.bungeeSocialEvents.push(socialEvt);
    }

    // Check win condition: any tribe found all 3?
    for (const tn of Object.keys(tribeBrandsFound)) {
      if (tribeBrandsFound[tn] >= 3) {
        brandWinnerTribe = tn;
        break;
      }
    }
  }

  // Store bungee round data
  result.bungeeRounds = bungeeRounds;
  result.brandWinner = brandWinnerTribe;

  // If no tribe found all 3, the tribe with the most brands wins bungee
  if (!brandWinnerTribe) {
    const brandCounts = tribeData.map(td => ({ tribeName: td.tribeName, brands: tribeBrandsFound[td.tribeName] || 0, wool: td.totalWool }));
    brandCounts.sort((a, b) => b.brands - a.brands || b.wool - a.wool);
    brandWinnerTribe = brandCounts[0].tribeName;
    result.brandWinner = brandWinnerTribe;
  }

  // bungee scores: brands * 33.3 + wool bonus
  const bungeeScores = {};
  tribeData.forEach(td => {
    td.bungeeScore = (tribeBrandsFound[td.tribeName] || 0) * 33.3 + (td.totalWool / 3);
    bungeeScores[td.tribeName] = td.bungeeScore;
  });
  const maxBungee = Math.max(1, ...Object.values(bungeeScores));
  const normalizedBungee = {};
  tribeData.forEach(td => {
    normalizedBungee[td.tribeName] = 100 * bungeeScores[td.tribeName] / maxBungee;
  });

  // bungee rankings
  const bungeeRanked = tribeData.slice().sort((a, b) => (bungeeScores[b.tribeName] || 0) - (bungeeScores[a.tribeName] || 0));
  result.bungeeWinner = bungeeRanked[0].tribeName;

  // combined rankings
  const combined = tribeData.map(td => ({
    tribeName: td.tribeName,
    total: (raceScores[td.tribeName] || 0) + (normalizedBungee[td.tribeName] || 0),
    raceScore: raceScores[td.tribeName] || 0,
    bungeeScore: normalizedBungee[td.tribeName] || 0,
    brandsFound: tribeBrandsFound[td.tribeName] || 0,
    bungeeRaw: bungeeScores[td.tribeName] || 0,
  }));
  combined.sort((a, b) => b.total - a.total);
  result.rankings = combined.map(c => c.tribeName);
  result.winningTribe = combined[0].tribeName;
  result.losingTribe = combined[combined.length - 1].tribeName;

  // MVP: highest individual chalMemberScore from winning tribe
  const winTribe = tribeData.find(t => t.tribeName === result.winningTribe);
  result.mvpPlayer = winTribe?.members.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  )[0] || '';

  // store tribe data
  result.tribes = tribeData.map(td => ({
    tribeName: td.tribeName, name: td.tribeName, members: td.members, color: td.color,
    emuWrangling: td.emuWrangling, emuSegments: td.emuSegments,
    totalRaceTime: Math.round(td.totalRaceTime * 10) / 10,
    arrivalOrder: td.arrivalOrder, shearAdvantage: td.shearAdvantage,
    bungeeGrabs: td.bungeeGrabs, totalWool: td.totalWool,
    brandsFound: tribeBrandsFound[td.tribeName] || 0,
    bungeeScore: bungeeScores[td.tribeName] || 0,
  }));

  // camp events
  tribeData.forEach(td => {
    if (td.tribeName === result.winningTribe) {
      ep.campEvents[td.tribeName]?.post.push({
        text: `${td.tribeName} won the Picnic at Hanging Dork challenge`,
        players: td.members, badgeText: 'Won', badgeClass: 'badge-green',
      });
    } else if (td.tribeName === result.losingTribe) {
      ep.campEvents[td.tribeName]?.post.push({
        text: `${td.tribeName} lost the outback challenge and faces tribal council`,
        players: td.members, badgeText: 'Lost', badgeClass: 'badge-red',
      });
    }
  });

  // ── FINALIZE ──
  ep.picnicHangingDork = result;
  ep.isPicnicHangingDork = true;
  ep.challengeType = 'tribe';
  ep.challengeLabel = 'Picnic at Hanging Dork';
  ep.challengeCategory = 'adventure';

  const winnerTribe = gs.tribes.find(t => t.name === result.winningTribe);
  const loserTribe = gs.tribes.find(t => t.name === result.losingTribe);
  ep.winner = winnerTribe;
  ep.loser = loserTribe;
  ep.safeTribes = combined.length > 2
    ? combined.slice(1, -1).map(c => gs.tribes.find(t => t.name === c.tribeName)).filter(Boolean)
    : [];
  ep.tribalPlayers = loserTribe ? [...loserTribe.members] : [];
  ep.challengePlacements = combined.map(c => ({
    name: c.tribeName, members: [...(gs.tribes.find(t => t.name === c.tribeName)?.members || [])],
  }));
  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a).map(([n]) => n);

  // top scorer massive bonus
  const topScorer = winnerTribe?.members.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  )[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([, s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(
      ep.chalMemberScores[topScorer] || 0, maxOther
    ) + allActive.length + 5;
  }

  // romance hooks
  const _romActive = allActive;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'outback race');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'bungee canyon', _romActive);

  updateChalRecord(ep);
  return ep;

  } else {
  // ═══════════════════════════════════════════════════════════════
  //  POST-MERGE (individual challenge) — Golden Fleece Hunt
  // ═══════════════════════════════════════════════════════════════
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (active.length < 2) return ep;

  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    isPostMerge: true,
    players: [], socialEvents: [], bungeeSocialEvents: [],
    rankings: [], raceWinner: '', bungeeWinner: '', immunityWinner: '',
    kangarooEvents: [], overnightEvents: [], bungeeRounds: [],
  };

  // ── PHASE 0: INDIVIDUAL EMU WRANGLING ──
  const playerData = active.map(name => {
    const s = pStats(name);
    const rawCatch = s.physical * 0.4 + s.boldness * 0.3 + s.endurance * 0.3 + noise(2.5);
    const catchScore = isNaN(rawCatch) ? 5 : rawCatch;
    const attempts = catchScore > 7 ? 1 : catchScore > 4 ? 2 : 3;
    const emuQuality = clamp(Math.round(catchScore), 1, 10);
    const events = [];

    events.push({ type: 'approach', text: pick(EMU_CATCH_APPROACH)(name) });

    if (attempts >= 2) {
      events.push({ type: 'fail', text: pick(EMU_CATCH_FAIL)(name) });
      if (Math.random() < 0.4) events.push({ type: 'comedy', text: pick(EMU_CATCH_COMEDY)(name) });
    }
    if (attempts >= 3) {
      events.push({ type: 'fail', text: pick(EMU_CATCH_FAIL)(name) });
    }

    events.push({ type: 'success', text: pick(EMU_CATCH_SUCCESS)(name) });
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + (11 - attempts) * 0.5;

    return {
      name, emuWrangling: { player: name, attempts, emuQuality, caught: true, events, catchTime: attempts * 8 + noise(3) },
      emuSegments: [], totalRaceTime: 0, arrivalOrder: null,
      shearAdvantage: 'standard', bungeeGrabs: [], totalWool: 0,
      goldenFleeceFound: 0, momentum: 0,
    };
  });

  // ── PHASE 1: INDIVIDUAL EMU RACE (4 segments) ──
  const timePenalties = {};
  active.forEach(n => { timePenalties[n] = 0; });

  for (let segIdx = 0; segIdx < 4; segIdx++) {
    const segResults = [];

    playerData.forEach(pd => {
      const s = pStats(pd.name);
      const emuBonus = (pd.emuWrangling.emuQuality - 5) * 0.15;
      const raw = SEG_STAT_FN[segIdx](s) + noise(2.5) + emuBonus;
      const segEvents = [];

      const roll = Math.random();
      // emu bucks (~15%)
      if (roll < 0.15) {
        const agiCheck = s.physical * 0.5 + s.boldness * 0.5 + noise(2);
        if (agiCheck < 5) {
          segEvents.push({ type: 'buck', text: pick(EMU_BUCK)(pd.name), timeDelta: 2.5, player: pd.name });
        } else {
          segEvents.push({ type: 'save', text: pick(EMU_BUCK_SAVE)(pd.name), timeDelta: 0.3, player: pd.name });
        }
      }
      // surge (~12%)
      else if (roll < 0.27) {
        const physCheck = s.physical * 0.5 + s.endurance * 0.5 + noise(2);
        if (physCheck > 5) {
          segEvents.push({ type: 'surge', text: pick(EMU_SURGE)(pd.name), timeDelta: -2, player: pd.name });
          ep.chalMemberScores[pd.name] = (ep.chalMemberScores[pd.name] || 0) + 2;
          popDelta(pd.name, 1);
        }
      }
      // shortcut (~12%)
      else if (roll < 0.39) {
        const intCheck = s.intuition + noise(2);
        if (intCheck > 4.5) {
          segEvents.push({ type: 'shortcut', text: pick(EMU_SHORTCUT)(pd.name), timeDelta: -1.5, player: pd.name });
          ep.chalMemberScores[pd.name] = (ep.chalMemberScores[pd.name] || 0) + 2;
        }
      }
      // stumble (~12%)
      else if (roll < 0.51) {
        const physCheck = s.physical + noise(2);
        segEvents.push({
          type: 'stumble', text: pick(EMU_STUMBLE)(pd.name),
          timeDelta: physCheck > 5 ? 1 : 2.5, player: pd.name,
        });
      }
      // emu refuses (~10%)
      else if (roll < 0.61 && (segIdx >= 2 || Math.random() < 0.4)) {
        const boldCheck = s.boldness + noise(2);
        segEvents.push({
          type: 'refuse', text: pick(EMU_REFUSE)(pd.name),
          timeDelta: boldCheck > 5 ? 1.5 : 3.5, player: pd.name,
        });
      }
      // emu cooperation (~10%)
      else if (roll < 0.71) {
        const endCheck = s.endurance * 0.5 + s.social * 0.5 + noise(2);
        if (endCheck > 5) {
          segEvents.push({ type: 'bond', text: pick(EMU_COOPERATION)(pd.name), timeDelta: -1.2, player: pd.name });
        }
      }
      // dust blind (~8%)
      else if (roll < 0.79) {
        segEvents.push({ type: 'dust', text: pick(EMU_DUST_BLIND)(pd.name), timeDelta: 1.8, player: pd.name });
      }

      // filler events (~25%)
      if (segEvents.length === 0 && Math.random() < 0.25) {
        if (Math.random() < 0.5) {
          segEvents.push({ type: 'stumble', text: pick(EMU_STUMBLE)(pd.name), timeDelta: 1.2, player: pd.name });
        } else {
          segEvents.push({ type: 'surge', text: pick(EMU_SURGE)(pd.name), timeDelta: -1.0, player: pd.name });
        }
      }

      const rawScore = isNaN(raw) ? 5 : raw;
      ep.chalMemberScores[pd.name] = (ep.chalMemberScores[pd.name] || 0) + Math.max(0, rawScore * 0.5);

      const momFactor = 1.0 + pd.momentum * 0.1;
      let segTime = BASE_SEG_TIME / (1 + rawScore * momFactor / 10);
      segEvents.forEach(e => { segTime += (e.timeDelta || 0); });
      segTime += timePenalties[pd.name] || 0;
      if (isNaN(segTime) || segTime <= 0) segTime = BASE_SEG_TIME;
      segTime = Math.max(8, segTime);
      timePenalties[pd.name] = 0;

      pd.emuSegments.push({
        segName: SEG_NAMES[segIdx], segIdx,
        time: Math.round(segTime * 10) / 10,
        momentum: pd.momentum,
        memberRolls: [{ name: pd.name, score: rawScore, event: segEvents[0] || null }],
        events: segEvents,
      });
      pd.totalRaceTime += segTime;

      segResults.push({ player: pd.name, segTime });
    });

    // update momentum (top gains, bottom loses)
    segResults.sort((a, b) => a.segTime - b.segTime);
    playerData.forEach(pd => {
      if (pd.name === segResults[0].player) {
        pd.momentum = clamp(pd.momentum + 1, -2, 2);
      } else if (pd.name === segResults[segResults.length - 1].player) {
        pd.momentum = clamp(pd.momentum - 1, -2, 2);
      }
    });

    // social events between segments (not after last)
    if (segIdx < 3) {
      const numEvents = 1 + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
      for (let i = 0; i < numEvents; i++) {
        const evt = _generatePostMergeSocialEvent(segIdx, active, ep, campKey);
        if (evt) {
          result.socialEvents.push(evt);
          if (evt.timePenalty > 0 && evt.target) {
            timePenalties[evt.target] = (timePenalties[evt.target] || 0) + evt.timePenalty;
          }
        }
      }

      // kangaroo encounters (~25%)
      if (Math.random() < 0.25) {
        const victim = pick(active);
        const kickDamage = 2 + noise(1);
        const isPouch = Math.random() < 0.15;
        const narrative = isPouch ? pick(KANGAROO_POUCH)(victim) : pick(KANGAROO_KICK)(victim);
        result.kangarooEvents.push({
          afterSegment: segIdx, player: victim, tribe: campKey,
          type: isPouch ? 'pouch' : 'kick', narrative,
          timeDelta: isPouch ? -1 : kickDamage,
        });
        if (!isPouch) {
          timePenalties[victim] = (timePenalties[victim] || 0) + kickDamage;
          popDelta(victim, -1);
        } else {
          popDelta(victim, 1);
        }
        ep.campEvents[campKey]?.post.push({
          text: isPouch ? `${victim} arrived at Hanging Rock via kangaroo pouch` : `${victim} got kicked by a kangaroo during the emu race`,
          players: [victim], badgeText: isPouch ? 'Pouch' : 'Kicked', badgeClass: isPouch ? 'badge-blue' : 'badge-red',
        });
      }

      // kangaroo blocks trail (~15%)
      if (Math.random() < 0.15) {
        const blockedPlayer = pick(active);
        result.kangarooEvents.push({
          afterSegment: segIdx, player: blockedPlayer, tribe: campKey,
          type: 'block', narrative: pick(KANGAROO_BLOCK)(blockedPlayer), timeDelta: 1.5,
        });
        timePenalties[blockedPlayer] = (timePenalties[blockedPlayer] || 0) + 1.5;
      }

      // overnight camp after segment 1
      if (segIdx === 1) {
        result.overnightEvents.push({ type: 'camp', tribe: campKey, narrative: pick(OVERNIGHT_CAMP)(campKey) });

        // snoring (~30%)
        if (Math.random() < 0.3) {
          const snorer = pick(active);
          result.overnightEvents.push({
            type: 'snore', tribe: campKey, player: snorer,
            narrative: pick(OVERNIGHT_SNORE)(snorer),
          });
          active.forEach(m => { if (m !== snorer) { ep.chalMemberScores[m] = (ep.chalMemberScores[m] || 0) - 0.3; } });
        }

        // confrontation or bond (~40%, up to 2 events)
        const overnightCount = Math.random() < 0.6 ? 2 : 1;
        for (let oi = 0; oi < overnightCount; oi++) {
          if (Math.random() < 0.4 && active.length >= 2) {
            const p1 = pick(active);
            const p2 = pick(active.filter(m => m !== p1));
            if (p2) {
              const bond = getBond(p1, p2);
              if (bond < 0 || _canScheme(p1)) {
                result.overnightEvents.push({
                  type: 'confrontation', tribe: campKey, actor: p1, target: p2,
                  narrative: pick(OVERNIGHT_CONFRONTATION)(p1, p2),
                });
                addBond(p1, p2, -1);
                ep.campEvents[campKey]?.post.push({
                  text: `${p1} confronted ${p2} during the overnight camp`, players: [p1, p2],
                  badgeText: 'Tension', badgeClass: 'badge-red',
                });
              } else {
                result.overnightEvents.push({
                  type: 'bond', tribe: campKey, actor: p1, target: p2,
                  narrative: pick(OVERNIGHT_BOND)(p1, p2),
                });
                addBond(p1, p2, 2);
                ep.campEvents[campKey]?.post.push({
                  text: `${p1} and ${p2} bonded during overnight camp`, players: [p1, p2],
                  badgeText: 'Bond', badgeClass: 'badge-green',
                });
              }
            }
          }
        }
      }
    }
  }

  // ── STAGGERED ARRIVALS (individual) ──
  playerData.forEach(pd => {
    const s = pStats(pd.name);
    const emuBonus = pd.emuWrangling.emuQuality * 0.3;
    const rawTime = pd.totalRaceTime + (10 - s.endurance) * 0.5 + noise(3) - emuBonus;
    pd.arrivalOrder = {
      player: pd.name, arrivalTime: Math.round((isNaN(rawTime) ? BASE_SEG_TIME * 4 : rawTime) * 10) / 10,
      kangarooPouch: result.kangarooEvents.some(ke => ke.player === pd.name && ke.type === 'pouch'),
    };
  });

  // race rankings by totalRaceTime
  const raceRanked = playerData.slice().sort((a, b) => a.totalRaceTime - b.totalRaceTime);
  result.raceWinner = raceRanked[0].name;

  // first place gets powered shears, last gets rusty
  raceRanked[0].shearAdvantage = 'powered';
  raceRanked[raceRanked.length - 1].shearAdvantage = 'rusty';
  for (let i = 1; i < raceRanked.length - 1; i++) raceRanked[i].shearAdvantage = 'standard';

  ep.campEvents[campKey]?.post.push({
    text: `${raceRanked[0].name} won the emu race and earned powered shears`,
    players: [raceRanked[0].name], badgeText: '1st Place', badgeClass: 'badge-green',
  });
  ep.campEvents[campKey]?.post.push({
    text: `${raceRanked[raceRanked.length - 1].name} came last in the emu race — stuck with rusty shears`,
    players: [raceRanked[raceRanked.length - 1].name], badgeText: 'Last', badgeClass: 'badge-red',
  });

  // ── PHASE 2: BUNGEE GOLDEN FLEECE HUNT ──
  // 5 golden fleece sheep + 2 unmarked (mirrors pre-merge pool ratio)
  const sheepPool = [];
  for (let i = 0; i < 5; i++) sheepPool.push({ brand: 'golden' });
  for (let i = 0; i < 4; i++) sheepPool.push({ brand: null });
  // shuffle
  for (let i = sheepPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sheepPool[i], sheepPool[j]] = [sheepPool[j], sheepPool[i]];
  }

  const goldenFleeceCount = {};
  active.forEach(n => { goldenFleeceCount[n] = 0; });
  const incapacitated = new Set();
  const bungeeRounds = [];
  let fleeceWinner = null;

  // rotation index
  let jumperRotation = 0;

  for (let roundNum = 1; roundNum <= 20 && !fleeceWinner; roundNum++) {
    // replenish pool each round — fresh sheep wander into the canyon
    const goldenLeft = sheepPool.filter(s => s.brand === 'golden').length;
    const goldenNeeded = Math.max(0, 3 - goldenLeft);
    for (let i = 0; i < goldenNeeded; i++) sheepPool.push({ brand: 'golden' });
    while (sheepPool.length < active.length) sheepPool.push({ brand: null });
    for (let i = sheepPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sheepPool[i], sheepPool[j]] = [sheepPool[j], sheepPool[i]];
    }

    const roundData = { round: roundNum, jumps: [] };
    const available = active.filter(p => !incapacitated.has(p));
    if (available.length === 0) break;

    // Each player takes a turn this round (round-robin)
    const roundJumpers = available.slice();

    roundJumpers.forEach(player => {
      if (fleeceWinner || sheepPool.length === 0) return;
      const s = pStats(player);
      const pd = playerData.find(p => p.name === player);
      const approach = s.boldness + noise(2.5) < 4 ? 'cautious' : s.boldness + noise(2.5) > 7 ? 'greedy' : 'normal';

      let chaosType = null, chaosData = null;
      let grabSuccess = false, sheepBrand = null, isOwnBrand = false;
      let woolFinal = 0;

      // Chaos roll
      const chaosRoll = Math.random();

      // 2% NO CORD
      if (chaosRoll < 0.02) {
        chaosType = 'no-cord';
        incapacitated.add(player);
        popDelta(player, -2);
        ep.campEvents[campKey]?.post.push({
          text: `${player} jumped without a bungee cord and is out of the challenge`,
          players: [player], badgeText: 'No Cord!', badgeClass: 'badge-red',
        });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 2;
      }
      // 4% TANGLE with another jumper
      else if (chaosRoll < 0.06 && roundJumpers.length >= 2) {
        const otherJumpers = roundJumpers.filter(rj => rj !== player && !incapacitated.has(rj));
        if (otherJumpers.length > 0) {
          const tanglePartner = pick(otherJumpers);
          chaosType = 'tangle';
          chaosData = { partner: tanglePartner };
          ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 2;
          ep.chalMemberScores[tanglePartner] = (ep.chalMemberScores[tanglePartner] || 0) + 2;
        }
      }
      // 5% DINGO GRAB
      else if (chaosRoll < 0.11) {
        chaosType = 'dingo-grab';
        const fightCheck = s.physical * 0.5 + s.boldness * 0.3 + noise(2.5);
        chaosData = { foughtOff: fightCheck > 5 };
        if (!chaosData.foughtOff) {
          popDelta(player, -1);
        }
        ep.campEvents[campKey]?.post.push({
          text: `${player} grabbed a dingo instead of a sheep during the bungee hunt`,
          players: [player], badgeText: 'Dingo!', badgeClass: 'badge-red',
        });
        ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 2;
      }

      // villain sabotage (~12%)
      let thrownAt = false, thrower = null;
      if (!chaosType) {
        const otherPlayers = roundJumpers.filter(rj => rj !== player && !incapacitated.has(rj));
        otherPlayers.forEach(rj => {
          if (_canScheme(rj) && Math.random() < 0.12) {
            thrownAt = true;
            thrower = rj;
            chaosType = 'thrown';
            chaosData = { thrower: rj };
            addBond(rj, player, -1);
            popDelta(rj, -1);
          }
        });
      }

      // Grab attempt
      if (!incapacitated.has(player) && chaosType !== 'no-cord' && chaosType !== 'tangle' && chaosType !== 'dingo-grab') {
        const grabScore = (s.physical * 0.4 + s.boldness * 0.3 + s.endurance * 0.3 + noise(2.5)) / 10;
        const shearAdv = pd.shearAdvantage;
        const advMod = shearAdv === 'powered' ? -0.08 : shearAdv === 'rusty' ? 0.08 : 0;
        let threshold = approach === 'cautious' ? 0.25 : approach === 'normal' ? 0.35 : 0.48;
        threshold += advMod;
        if (thrownAt) threshold += 0.15;
        grabSuccess = grabScore > threshold && sheepPool.length > 0;

        if (grabSuccess) {
          const sheepIdx = Math.floor(Math.random() * sheepPool.length);
          const grabbed = sheepPool.splice(sheepIdx, 1)[0];
          sheepBrand = grabbed.brand;
          isOwnBrand = sheepBrand === 'golden';

          // Shearing for wool
          const shearMult = shearAdv === 'powered' ? 1.3 : shearAdv === 'rusty' ? 0.7 : 1.0;
          const sheepData = pick(SHEEP_TYPES);
          const woolRaw = sheepData.woolMin + Math.floor(Math.random() * (sheepData.woolMax - sheepData.woolMin + 1));
          const shearEfficiency = (s.physical * 0.4 + s.endurance * 0.3 + s.intuition * 0.3 + noise(2)) / 10;
          woolFinal = Math.round(woolRaw * Math.min(1, shearEfficiency * 1.2) * shearMult);
          woolFinal = Math.max(1, woolFinal);

          if (isOwnBrand) {
            goldenFleeceCount[player]++;
            pd.goldenFleeceFound = goldenFleeceCount[player];
            ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 15;
            popDelta(player, 2);
            ep.campEvents[campKey]?.post.push({
              text: `${player} found a GOLDEN FLEECE during the bungee hunt!`,
              players: [player], badgeText: 'Golden!', badgeClass: 'badge-green',
            });
            if (goldenFleeceCount[player] >= 2) fleeceWinner = player;
          } else {
            ep.chalMemberScores[player] = (ep.chalMemberScores[player] || 0) + 3;
          }
        }
      }

      // Dingo fight (on successful grab)
      let dingoFight = null;
      if (grabSuccess && Math.random() < 0.05) {
        const fightCheck = s.physical * 0.5 + s.boldness * 0.3 + noise(2.5);
        const escaped = fightCheck > 5;
        dingoFight = { escaped };
        if (!escaped) {
          grabSuccess = false;
          woolFinal = 0;
          popDelta(player, -1);
        } else {
          popDelta(player, 1);
        }
      }

      const jumpResult = {
        player, round: roundNum, approach, grabSuccess, sheepBrand, isOwnBrand,
        woolFinal, chaosType, chaosData, tribeName: campKey, dingoFight,
      };
      roundData.jumps.push(jumpResult);
      pd.bungeeGrabs.push(jumpResult);
      pd.totalWool += woolFinal;
    });

    bungeeRounds.push(roundData);

    // Social events between odd rounds
    if (roundNum % 2 === 1 && roundNum < 10) {
      const allBungeePlayers = active.filter(p => !incapacitated.has(p));
      const socialRoll = Math.random();
      let socialEvt = null;

      if (socialRoll < 0.35) {
        const villains = allBungeePlayers.filter(p => _canScheme(p));
        const niceOnes = allBungeePlayers.filter(p => {
          const a = players.find(x => x.name === p)?.archetype;
          return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a);
        });
        if (villains.length > 0 && allBungeePlayers.length > 1) {
          const taunter = pick(villains);
          const taunted = pick(allBungeePlayers.filter(p => p !== taunter));
          socialEvt = {
            type: 'taunt', actor: taunter, target: taunted, afterRound: roundNum,
            narrative: pick(SOCIAL_BUNGEE_TAUNT)(taunter, taunted),
            bondDelta: -1, popDelta: -1,
          };
          addBond(taunter, taunted, -1);
          popDelta(taunter, -1);
        } else if (niceOnes.length > 0 && allBungeePlayers.length > 1) {
          const encourager = pick(niceOnes);
          const encouraged = pick(allBungeePlayers.filter(p => p !== encourager));
          if (encouraged) {
            socialEvt = {
              type: 'encourage', actor: encourager, target: encouraged, afterRound: roundNum,
              narrative: pick(SOCIAL_BUNGEE_ENCOURAGE)(encourager, encouraged),
              bondDelta: 2, popDelta: 1,
            };
            addBond(encourager, encouraged, 2);
            popDelta(encourager, 1);
          }
        }
      } else if (socialRoll < 0.55) {
        const niceOnes = allBungeePlayers.filter(p => {
          const a = players.find(x => x.name === p)?.archetype;
          return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a);
        });
        if (niceOnes.length > 0 && allBungeePlayers.length > 1) {
          const encourager = pick(niceOnes);
          const encouraged = pick(allBungeePlayers.filter(p => p !== encourager));
          if (encouraged) {
            socialEvt = {
              type: 'encourage', actor: encourager, target: encouraged, afterRound: roundNum,
              narrative: pick(SOCIAL_BUNGEE_ENCOURAGE)(encourager, encouraged),
              bondDelta: 2, popDelta: 1,
            };
            addBond(encourager, encouraged, 2);
            popDelta(encourager, 1);
          }
        }
      }

      if (socialEvt) result.bungeeSocialEvents.push(socialEvt);
    }

    // fleeceWinner is set immediately when a player finds their 2nd golden fleece
  }

  result.bungeeRounds = bungeeRounds;

  // Determine bungee winner
  if (!fleeceWinner) {
    // Most golden fleece wins; wool as tiebreaker
    const fleeceCounts = playerData.map(pd => ({
      name: pd.name, golden: goldenFleeceCount[pd.name] || 0, wool: pd.totalWool,
    }));
    fleeceCounts.sort((a, b) => b.golden - a.golden || b.wool - a.wool);
    fleeceWinner = fleeceCounts[0].name;
  }

  result.bungeeWinner = fleeceWinner;
  result.immunityWinner = fleeceWinner;

  // ── FINALIZE (post-merge) ──
  result.players = playerData.map(pd => ({
    name: pd.name,
    emuWrangling: pd.emuWrangling,
    emuSegments: pd.emuSegments,
    totalRaceTime: Math.round(pd.totalRaceTime * 10) / 10,
    arrivalOrder: pd.arrivalOrder,
    shearAdvantage: pd.shearAdvantage,
    bungeeGrabs: pd.bungeeGrabs,
    totalWool: pd.totalWool,
    goldenFleeceFound: goldenFleeceCount[pd.name] || 0,
  }));

  // Combined rankings — fleece winner always #1, rest by score
  result.rankings = active.slice().sort((a, b) => {
    if (a === fleeceWinner) return -1;
    if (b === fleeceWinner) return 1;
    return (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0);
  });

  // Camp events
  ep.campEvents[campKey]?.post.push({
    text: `${fleeceWinner} found all the golden fleece and won individual immunity!`,
    players: [fleeceWinner], badgeText: 'Immunity', badgeClass: 'badge-green',
  });

  ep.picnicHangingDork = result;
  ep.isPicnicHangingDork = true;
  ep.challengeType = 'picnic-hanging-dork';
  ep.challengeLabel = 'Picnic at Hanging Dork';
  ep.challengeCategory = 'adventure';
  ep.immunityWinner = fleeceWinner;
  ep.tribalPlayers = active;
  ep.chalPlacements = result.rankings;

  // Immunity winner massive chalMemberScores bonus
  const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
    .filter(([n]) => n !== fleeceWinner).map(([, s]) => s));
  ep.chalMemberScores[fleeceWinner] = Math.max(
    ep.chalMemberScores[fleeceWinner] || 0, maxOther
  ) + active.length + 5;

  // Romance hooks
  const _romActive = active;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'outback race');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'bungee canyon', _romActive);

  updateChalRecord(ep);
  return ep;
  } // end if/else gs.isMerged
}


// ═══════════════════════════════════════════════════════════════
//  VP STATE + REVEAL SYSTEM
// ═══════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`hd-step-${suffix}-${i}`);
    if (el) el.classList.add('hd-visible');
  }
  const counter = document.getElementById(`hd-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`hd-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.hd-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

function _hdUpdateCanyon(screenKey) {
  if (screenKey !== 'hd-bungee') return;
  const st = _tvState[screenKey];
  if (!st) return;
  const stepMeta = window._hdBungeeStepMeta || [];
  const meta = stepMeta[st.idx];
  if (!meta) return;

  const jumper = document.getElementById('hd-canyon-jumper');
  const cord = document.getElementById('hd-cj-cord');
  const icon = document.getElementById('hd-cj-icon');
  const grab = document.getElementById('hd-cj-grab');
  const nameEl = document.getElementById('hd-cj-name');
  const countEl = document.getElementById('hd-canyon-count');
  if (!jumper) return;

  // Count sheep remaining up to this reveal point
  let sheepGrabbed = 0;
  for (let i = 0; i <= st.idx && i < stepMeta.length; i++) {
    if (stepMeta[i].type === 'grab' && stepMeta[i].grabSuccess) sheepGrabbed++;
  }
  const poolSize = (window._hdEpRecord?.picnicHangingDork?.tribes?.length || 3) * 3 + 8;
  if (countEl) countEl.innerHTML = `${_icon('sheep')} ${Math.max(0, poolSize - sheepGrabbed)} sheep left`;

  // Hide a flock sheep for every grab
  for (let i = 0; i < 6; i++) {
    const s = document.getElementById(`hd-flock-${i}`);
    if (s) s.style.opacity = i < Math.max(0, 6 - sheepGrabbed) ? '1' : '0.15';
  }

  // Animate jumper based on step type
  if (meta.type === 'jump' && meta.player) {
    // Player drops into canyon
    jumper.className = 'hd-canyon-jumper hd-cj-active hd-cj-drop';
    const p = players.find(x => x.name === meta.player);
    if (icon && p?.slug) icon.innerHTML = `<img src="assets/avatars/${p.slug}.png" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`;
    else if (icon) icon.innerHTML = '';
    if (nameEl) nameEl.textContent = meta.player.split(' ')[0];
    if (grab) grab.style.opacity = '0';
    if (icon) icon.style.borderColor = 'var(--hd-amber)';
    if (icon) icon.style.boxShadow = '0 2px 8px rgba(0,0,0,0.6)';
  } else if (meta.type === 'grab' && meta.grabSuccess) {
    // Grabbed sheep — show sheep icon, start rising
    jumper.className = 'hd-canyon-jumper hd-cj-active hd-cj-rise hd-cj-grabbed';
  } else if (meta.type === 'grab' && !meta.grabSuccess) {
    // Missed — flash red, rise empty
    jumper.className = 'hd-canyon-jumper hd-cj-active hd-cj-rise hd-cj-miss';
  } else if (meta.type === 'brand') {
    if (meta.brandFound) {
      jumper.className = 'hd-canyon-jumper hd-cj-active hd-cj-rise hd-cj-brand hd-cj-grabbed';
    } else {
      jumper.className = 'hd-canyon-jumper hd-cj-active hd-cj-rise';
    }
  } else if (meta.type === 'chaos') {
    jumper.className = 'hd-canyon-jumper hd-cj-active hd-cj-drop hd-cj-miss';
    if (meta.chaosType === 'dingo-grab' && grab) grab.innerHTML = _icon('dingo');
  } else if (meta.type === 'round') {
    // Reset between rounds
    jumper.className = 'hd-canyon-jumper';
    if (grab) { grab.style.opacity = '0'; grab.innerHTML = _icon('sheep'); }
  } else {
    // social / other — fade out
    jumper.className = 'hd-canyon-jumper';
  }
}

function _hdUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('hd-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._hdEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.picnicHangingDork) return;
  sideEl.innerHTML = _buildSidebarContent(epRecord, screenKey);
}

function _hdUpdateTrack(screenKey) {
  if (!screenKey?.includes('race')) return;
  const st = _tvState[screenKey];
  if (!st) return;
  const snaps = window._hdTrackSnapshots;
  if (!snaps) return;
  const snap = snaps[Math.min(Math.max(st.idx, 0), snaps.length - 1)];
  if (!snap) return;
  const ep = window._hdEpRecord;
  if (!ep?.picnicHangingDork) return;
  const hd = ep.picnicHangingDork;

  // snap values are { seg, segTime } — place within the correct map quarter
  // each segment = 25% of the track; faster (lower time) = further right within segment
  function posFromSnap(entry) {
    if (!entry || typeof entry.seg !== 'number') return 0.02;
    const seg = entry.seg; // 0-3
    const segBase = seg * 0.25; // start of this segment's quarter
    // within-segment position: rank by speed (lower time = further right)
    // collect all entries in the same segment to rank them
    const sameSegTimes = [];
    for (const key in snap) {
      const e = snap[key];
      if (e && typeof e === 'object' && e.seg === seg) sameSegTimes.push(e.segTime);
    }
    const minT = Math.min(...sameSegTimes);
    const maxT = Math.max(...sameSegTimes);
    const range = maxT - minT;
    // intra-segment position: fastest gets ~0.22 (near end of quarter), slowest gets ~0.03
    let intra;
    if (range < 0.5) {
      intra = 0.12; // all tied — middle of segment
    } else {
      intra = 0.03 + 0.19 * (1 - (entry.segTime - minT) / range);
    }
    return segBase + intra;
  }

  if (hd.isPostMerge) {
    (hd.players || []).forEach((p, idx) => {
      const dot = document.getElementById(`hd-runner-${idx}`);
      if (!dot) return;
      const pct = posFromSnap(snap[p.name]);
      dot.style.left = `${3 + pct * 90}%`;
    });
  } else {
    hd.tribes.forEach((tribe, idx) => {
      const dot = document.getElementById(`hd-runner-${idx}`);
      if (!dot) return;
      const pct = posFromSnap(snap[tribe.tribeName]);
      dot.style.left = `${3 + pct * 90}%`;
    });
  }
}

export function hdRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('hd-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`hd-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('HD reveal error:', e); }
  try { _hdUpdateSidebar(screenKey); } catch (e) {}
  try { _hdUpdateTrack(screenKey); } catch (e) {}
  try { _hdUpdateCanyon(screenKey); } catch (e) {}
}

export function hdRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('hd-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('HD revealAll error:', e); }
  try { _hdUpdateSidebar(screenKey); } catch (e) {}
  try { _hdUpdateTrack(screenKey); } catch (e) {}
  try { _hdUpdateCanyon(screenKey); } catch (e) {}
}


// ═══════════════════════════════════════════════════════════════
//  CSS + ICONS + ATMOSPHERE
// ═══════════════════════════════════════════════════════════════

function _icon(type) {
  switch (type) {
    case 'emu': return `<span class="hd-icon hd-iemu"><span class="hd-iemu-head"></span><span class="hd-iemu-neck"></span><span class="hd-iemu-body"></span><span class="hd-iemu-leg1"></span><span class="hd-iemu-leg2"></span></span>`;
    case 'sheep': return `<span class="hd-icon hd-isheep"><span class="hd-isheep-body"></span><span class="hd-isheep-head"></span><span class="hd-isheep-leg1"></span><span class="hd-isheep-leg2"></span></span>`;
    case 'dingo': return `<span class="hd-icon hd-idingo"><span class="hd-idingo-body"></span><span class="hd-idingo-head"></span><span class="hd-idingo-ear1"></span><span class="hd-idingo-ear2"></span><span class="hd-idingo-tail"></span></span>`;
    case 'wool': return `<span class="hd-icon hd-iwool"><span class="hd-iwool-c1"></span><span class="hd-iwool-c2"></span><span class="hd-iwool-c3"></span></span>`;
    case 'canyon': return `<span class="hd-icon hd-icanyon"><span class="hd-icanyon-l"></span><span class="hd-icanyon-r"></span></span>`;
    case 'bungee': return `<span class="hd-icon hd-ibungee"><span class="hd-ibungee-cord"></span><span class="hd-ibungee-knot"></span></span>`;
    case 'brand': return `<span class="hd-icon hd-ibrand"><span class="hd-ibrand-star"></span></span>`;
    case 'dust': return `<span class="hd-icon hd-idust"></span>`;
    case 'mom-up': return `<span class="hd-icon hd-imomup"></span>`;
    case 'mom-down': return `<span class="hd-icon hd-imomdn"></span>`;
    case 'clock': return `<span class="hd-icon hd-iclock"><span class="hd-iclock-h"></span><span class="hd-iclock-m"></span></span>`;
    case 'trophy': return `<span class="hd-icon hd-itrophy"></span>`;
    case 'skull': return `<span class="hd-icon hd-iskull"></span>`;
    case 'kangaroo': return `<span class="hd-icon hd-ikanga"><span class="hd-ikanga-body"></span><span class="hd-ikanga-head"></span><span class="hd-ikanga-tail"></span><span class="hd-ikanga-leg"></span></span>`;
    case 'moon': return `<span class="hd-icon hd-imoon"></span>`;
    case 'shears': return `<span class="hd-icon hd-ishears"><span class="hd-ishears-bl"></span><span class="hd-ishears-br"></span></span>`;
    case 'flag': return `<span class="hd-icon hd-iflag"><span class="hd-iflag-pole"></span><span class="hd-iflag-cloth"></span></span>`;
    default: return `<span class="hd-icon"></span>`;
  }
}

function _buildAtmosphere(phaseCls) {
  let html = '';
  if (phaseCls === 'hd-phase-bungee') {
    // canyon atmosphere: rope lines, wind, pebbles
    for (let i = 0; i < 4; i++) html += `<div class="hd-atm-rope" style="left:${15+i*22}%;animation-delay:${i*0.7}s"></div>`;
    for (let i = 0; i < 15; i++) html += `<div class="hd-atm-pebble" style="left:${Math.random()*100}%;animation-duration:${3+Math.random()*5}s;animation-delay:${Math.random()*8}s;width:${2+Math.random()*3}px;height:${2+Math.random()*3}px"></div>`;
    for (let i = 0; i < 8; i++) html += `<div class="hd-atm-wind" style="top:${10+Math.random()*80}%;animation-duration:${2+Math.random()*4}s;animation-delay:${Math.random()*6}s"></div>`;
  } else if (phaseCls === 'hd-phase-results') {
    // sunset glow
    for (let i = 0; i < 20; i++) html += `<div class="hd-atm-sparkle" style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*4}s;animation-duration:${2+Math.random()*3}s"></div>`;
  } else {
    // race: dust particles, heat shimmer, distant hills
    for (let i = 0; i < 35; i++) html += `<div class="hd-atm-dust" style="left:${Math.random()*100}%;animation-duration:${5+Math.random()*10}s;animation-delay:${Math.random()*12}s;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;opacity:${0.15+Math.random()*0.3}"></div>`;
    for (let i = 0; i < 8; i++) html += `<div class="hd-atm-leaf" style="left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*15}s"></div>`;
    html += '<div class="hd-atm-shimmer"></div>';
  }
  return html;
}

const HD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bowlby+One&family=Special+Elite&family=DM+Mono:wght@400;500&family=Anton&display=swap');

:root {
  --hd-earth: #8c2e0a;
  --hd-sand: #f1e4cd;
  --hd-amber: #e8c668;
  --hd-dust: #a06030;
  --hd-deep: #3a1808;
  --hd-sky: #e8a04a;
  --hd-cyan: #3ce0d4;
  --hd-orange: #ff8a3c;
  --hd-gold: #ffd93c;
  --hd-danger: #ef4444;
  --hd-wool: #f5f0e8;
  --hd-scrub: #5a7a3a;
  --hd-glass: rgba(241,228,205,0.06);
  --hd-gb: rgba(241,228,205,0.12);
}

.hd-shell {
  max-width:1100px; margin:0 auto; position:relative;
  display:flex; gap:0; min-height:100vh;
  font-family:'Special Elite',cursive; color:var(--hd-sand);
}
.hd-phase-race { background:var(--hd-earth); }
.hd-phase-bungee { background:var(--hd-deep); }
.hd-phase-results { background:linear-gradient(180deg,var(--hd-deep) 0%,var(--hd-earth) 40%,var(--hd-sky) 100%); }

.hd-atmosphere {
  position:fixed; left:0; right:0; bottom:0; top:46px;
  pointer-events:none; z-index:1; overflow:hidden;
}

/* ── dust particles ── */
.hd-atm-dust {
  position:absolute; border-radius:50%;
  background:var(--hd-dust); animation:hd-dustfall linear infinite;
}
@keyframes hd-dustfall {
  0% { transform:translateY(-20px) translateX(0); opacity:0; }
  10% { opacity:1; }
  90% { opacity:1; }
  100% { transform:translateY(100vh) translateX(40px); opacity:0; }
}

/* ── leaves ── */
.hd-atm-leaf {
  position:absolute; width:8px; height:5px;
  background:var(--hd-scrub); border-radius:50% 0;
  animation:hd-leafdrift linear infinite;
}
@keyframes hd-leafdrift {
  0% { transform:translateY(-20px) rotate(0deg); opacity:0; }
  15% { opacity:0.5; }
  85% { opacity:0.5; }
  100% { transform:translateY(100vh) rotate(360deg) translateX(60px); opacity:0; }
}

/* ── heat shimmer ── */
.hd-atm-shimmer {
  position:absolute; bottom:0; left:0; right:0; height:80px;
  background:linear-gradient(transparent,rgba(140,46,10,0.3));
  animation:hd-shimmer 3s ease-in-out infinite alternate;
}
@keyframes hd-shimmer { 0%{opacity:0.5;transform:scaleY(1)} 100%{opacity:0.8;transform:scaleY(1.1)} }

/* ── canyon ropes ── */
.hd-atm-rope {
  position:absolute; top:0; width:2px; height:100%;
  background:linear-gradient(var(--hd-dust),transparent);
  animation:hd-ropesway 4s ease-in-out infinite alternate;
}
@keyframes hd-ropesway { 0%{transform:translateX(-3px)} 100%{transform:translateX(3px)} }

/* ── pebbles ── */
.hd-atm-pebble {
  position:absolute; border-radius:50%;
  background:var(--hd-dust); animation:hd-pebfall linear infinite;
}
@keyframes hd-pebfall {
  0% { transform:translateY(-10px); opacity:0; }
  10% { opacity:0.6; }
  100% { transform:translateY(100vh); opacity:0; }
}

/* ── wind gusts ── */
.hd-atm-wind {
  position:absolute; left:-20%; width:40%; height:1px;
  background:linear-gradient(90deg,transparent,rgba(241,228,205,0.15),transparent);
  animation:hd-gust linear infinite;
}
@keyframes hd-gust { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }

/* ── sparkles (results) ── */
.hd-atm-sparkle {
  position:absolute; width:3px; height:3px; border-radius:50%;
  background:var(--hd-gold); animation:hd-twinkle ease-in-out infinite;
}
@keyframes hd-twinkle { 0%,100%{opacity:0;transform:scale(0.5)} 50%{opacity:1;transform:scale(1.2)} }

/* ── reduced motion ── */
@media(prefers-reduced-motion:reduce) {
  .hd-atm-dust,.hd-atm-leaf,.hd-atm-shimmer,.hd-atm-rope,.hd-atm-pebble,.hd-atm-wind,.hd-atm-sparkle,
  .hd-card,.hd-comm { animation:none!important; transition:none!important; }
  .hd-card { opacity:1!important; transform:none!important; }
}

/* ── HUD bar ── */
.hd-hud {
  display:flex; align-items:center; gap:12px;
  padding:8px 16px; margin-bottom:16px;
  background:rgba(58,24,8,0.8); border:1px solid var(--hd-gb);
  border-radius:8px; font-family:'DM Mono',monospace; font-size:12px;
}
.hd-hud-phase {
  display:flex; gap:6px; align-items:center;
}
.hd-hud-dot {
  width:8px; height:8px; border-radius:50%; background:var(--hd-gb);
}
.hd-hud-dot.active { background:var(--hd-amber); box-shadow:0 0 6px var(--hd-amber); }
.hd-hud-label { font-family:'Anton',sans-serif; font-size:14px; text-transform:uppercase; letter-spacing:2px; color:var(--hd-amber); }
.hd-hud-clock { margin-left:auto; color:var(--hd-sand); opacity:0.7; }

/* ── cards ── */
.hd-card {
  background:rgba(241,228,205,0.07); border:1px solid var(--hd-gb);
  border-radius:10px; padding:14px 16px; margin-bottom:10px;
  opacity:0; transform:translateY(20px);
  transition:opacity 0.4s ease-out, transform 0.4s ease-out;
}
.hd-card.hd-visible { opacity:1; transform:translateY(0); }
.hd-card-head {
  display:flex; align-items:center; gap:8px; margin-bottom:8px;
}
.hd-card-tag {
  font-family:'DM Mono',monospace; font-size:10px; text-transform:uppercase;
  padding:2px 8px; border-radius:4px;
  background:var(--hd-amber); color:var(--hd-deep); font-weight:500;
  letter-spacing:1px;
}
.hd-card-tag.tag-social { background:var(--hd-cyan); }
.hd-card-tag.tag-dingo { background:var(--hd-danger); color:var(--hd-sand); }
.hd-card-tag.tag-brand { background:var(--hd-gold); color:var(--hd-deep); }
.hd-card-tag.tag-emu { background:var(--hd-dust); color:var(--hd-sand); }
.hd-card-tag.tag-grab { background:var(--hd-scrub); color:var(--hd-sand); }
.hd-card-tag.tag-fail { background:rgba(239,68,68,0.3); color:var(--hd-danger); }
.hd-card-tag.tag-win { background:rgba(255,217,60,0.3); color:var(--hd-gold); }
.hd-card-who {
  font-family:'Anton',sans-serif; font-size:13px; letter-spacing:1px;
  color:var(--hd-sand); text-transform:uppercase;
}
.hd-card-icon { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.hd-card-body {
  font-size:14px; line-height:1.5; color:rgba(241,228,205,0.85);
}
.hd-card-foot {
  display:flex; align-items:center; gap:12px; margin-top:8px;
  font-family:'DM Mono',monospace; font-size:11px; color:var(--hd-amber);
}
.hd-card-social {
  border:2px dashed var(--hd-amber); background:rgba(232,198,104,0.05);
}
.hd-card-dingo {
  border:2px solid var(--hd-danger); animation:hd-shake 0.5s;
}
.hd-card-counter {
  border-left:3px solid var(--hd-cyan); margin-left:20px; padding-left:12px;
}

/* ── emu track ── */
.hd-track {
  position:sticky; top:46px; z-index:10;
  height:80px; margin:0 -16px 16px; padding:0;
  background:linear-gradient(180deg,rgba(140,46,10,0.3) 0%,var(--hd-earth) 30%,var(--hd-dust) 100%);
  border-bottom:1px solid var(--hd-gb); overflow:hidden;
  box-shadow:0 4px 12px rgba(0,0,0,0.4);
}
.hd-track::before {
  content:''; position:absolute; bottom:0; left:0; right:0; height:20px;
  background:repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(241,228,205,0.05) 20px,rgba(241,228,205,0.05) 21px);
}
.hd-track-seg {
  position:absolute; top:0; height:100%;
  border-right:1px dashed rgba(241,228,205,0.2);
  display:flex; align-items:flex-end; justify-content:center;
  font-family:'DM Mono',monospace; font-size:9px; color:rgba(241,228,205,0.4);
  padding-bottom:4px;
}
.hd-track-seg::before {
  content:''; position:absolute; top:4px; left:50%; transform:translateX(-50%);
  width:4px; height:4px; border-radius:50%; background:var(--hd-amber); opacity:0.4;
}
.hd-track-runner {
  position:absolute; width:20px; height:20px;
  border-radius:50%; border:2px solid var(--hd-sand);
  transition:left 0.6s ease-out;
  z-index:5; display:flex; align-items:center; justify-content:center;
  font-family:'DM Mono',monospace; font-size:7px; font-weight:700;
  box-shadow:0 0 8px rgba(0,0,0,0.4);
}
.hd-track-runner::after {
  content:''; position:absolute; right:-6px; top:50%; transform:translateY(-50%);
  width:0; height:0; border-top:4px solid transparent; border-bottom:4px solid transparent;
  border-left:5px solid rgba(241,228,205,0.3);
}
.hd-track-start {
  position:absolute; left:3%; top:0; bottom:0; width:2px;
  background:var(--hd-amber); opacity:0.5;
}
.hd-track-start::before {
  content:'START'; position:absolute; top:2px; left:4px;
  font-family:'DM Mono',monospace; font-size:7px; color:var(--hd-amber); opacity:0.6;
}
.hd-track-finish {
  position:absolute; right:3%; top:0; bottom:0; width:2px;
  background:var(--hd-gold); opacity:0.5;
}
.hd-track-finish::before {
  content:'FINISH'; position:absolute; top:2px; right:4px;
  font-family:'DM Mono',monospace; font-size:7px; color:var(--hd-gold); opacity:0.6;
  text-align:right;
}

/* ── bungee canyon ── */
.hd-canyon {
  position:sticky; top:46px; z-index:10;
  height:200px; margin:0 -16px 16px; padding:0;
  overflow:hidden;
  background:linear-gradient(180deg,#1a0800 0%,var(--hd-deep) 40%,#2a1008 100%);
  border-bottom:1px solid var(--hd-gb);
  box-shadow:0 4px 12px rgba(0,0,0,0.4);
}
.hd-canyon-wall-l,.hd-canyon-wall-r {
  position:absolute; top:0; width:28%; height:100%;
}
.hd-canyon-wall-l {
  left:0; background:linear-gradient(90deg,var(--hd-dust) 0%,rgba(160,96,48,0.6) 40%,transparent 100%);
}
.hd-canyon-wall-r {
  right:0; background:linear-gradient(270deg,var(--hd-dust) 0%,rgba(160,96,48,0.6) 40%,transparent 100%);
}
.hd-canyon-floor {
  position:absolute; bottom:0; left:0; right:0; height:40px;
  background:linear-gradient(transparent,rgba(160,96,48,0.5));
}
.hd-canyon-sheep {
  position:absolute; bottom:25px; display:flex; gap:8px;
  align-items:flex-end; justify-content:center; width:100%;
}
.hd-canyon-cord {
  position:absolute; top:0; left:50%; width:2px; height:60%;
  background:linear-gradient(var(--hd-sand),var(--hd-amber));
  animation:hd-cord-sway 3s ease-in-out infinite alternate;
  transform-origin:top center;
}
@keyframes hd-cord-sway { 0%{transform:translateX(-50%) rotate(-2deg)} 100%{transform:translateX(-50%) rotate(2deg)} }

/* ── canyon jumper animation ── */
.hd-canyon-jumper {
  position:absolute; left:50%; top:0; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center;
  z-index:5; opacity:0; transition:opacity 0.3s;
}
.hd-canyon-jumper.hd-cj-active { opacity:1; }
.hd-canyon-jumper-cord {
  width:2px; height:0; background:linear-gradient(var(--hd-sand),var(--hd-amber));
  transition:height 0.6s cubic-bezier(0.4,0,0.2,1);
}
.hd-canyon-jumper-icon {
  width:36px; height:36px; border-radius:50%; border:2px solid var(--hd-amber);
  overflow:hidden; background:var(--hd-deep); box-shadow:0 2px 8px rgba(0,0,0,0.6);
  transition:transform 0.3s ease-out;
}
.hd-canyon-jumper-icon img { width:100%; height:100%; object-fit:cover; }
.hd-canyon-jumper-grab {
  position:absolute; bottom:-6px; left:50%; transform:translateX(-50%);
  font-size:14px; opacity:0; transition:opacity 0.4s 0.3s;
}
.hd-cj-grabbed .hd-canyon-jumper-grab { opacity:1; }
.hd-cj-drop .hd-canyon-jumper-cord { height:110px; }
.hd-cj-rise .hd-canyon-jumper-cord { height:30px; }
.hd-cj-miss .hd-canyon-jumper-icon { border-color:var(--hd-danger); }
.hd-cj-brand .hd-canyon-jumper-icon { border-color:var(--hd-gold); box-shadow:0 0 12px rgba(255,217,60,0.5); }
.hd-canyon-jumper-name {
  font-family:'DM Mono',monospace; font-size:8px; color:var(--hd-amber);
  margin-top:2px; text-align:center; white-space:nowrap;
}
.hd-canyon-sheep-count {
  position:absolute; top:8px; right:12px;
  font-family:'DM Mono',monospace; font-size:9px; color:var(--hd-sand); opacity:0.5;
}

.hd-canyon-label {
  position:absolute; top:8px; left:50%; transform:translateX(-50%);
  font-family:'DM Mono',monospace; font-size:9px; color:var(--hd-amber);
  letter-spacing:2px; text-transform:uppercase; opacity:0.5;
}

/* ── sidebar ── */
.hd-sidebar {
  width:220px; min-width:220px; order:2;
  background:rgba(58,24,8,0.85); border-left:1px solid var(--hd-gb);
  padding:12px; font-size:12px; overflow-y:auto;
  max-height:calc(100vh - 46px); position:sticky; top:46px;
}
.hd-sb-title {
  font-family:'Bowlby One',cursive; font-size:14px;
  color:var(--hd-amber); margin-bottom:10px; text-transform:uppercase;
  letter-spacing:2px;
}
.hd-sb-tribe {
  margin-bottom:10px; padding:8px; border-radius:6px;
  background:rgba(241,228,205,0.04); border:1px solid var(--hd-gb);
}
.hd-sb-tribe-name {
  font-family:'Anton',sans-serif; font-size:13px; letter-spacing:1px;
  display:flex; align-items:center; gap:6px; margin-bottom:4px;
}
.hd-sb-tribe-dot {
  width:8px; height:8px; border-radius:50%; display:inline-block;
}
.hd-sb-stat {
  font-family:'DM Mono',monospace; font-size:11px; color:var(--hd-sand);
  opacity:0.8; margin:2px 0;
}
.hd-sb-mom { font-size:10px; }
.hd-sb-mom.up { color:var(--hd-cyan); }
.hd-sb-mom.down { color:var(--hd-danger); }
.hd-sb-divider {
  border:none; border-top:1px solid var(--hd-gb); margin:8px 0;
}
.hd-sb-player {
  display:flex; align-items:center; gap:5px; padding:3px 4px;
  border-radius:4px; margin:2px 0; font-size:10px;
  background:rgba(241,228,205,0.03);
}
.hd-sb-player-name {
  font-family:'DM Mono',monospace; font-size:10px; color:var(--hd-sand);
  flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.hd-sb-player-stat {
  font-family:'DM Mono',monospace; font-size:9px; color:var(--hd-amber);
  white-space:nowrap;
}
.hd-sb-player-badge {
  font-family:'DM Mono',monospace; font-size:7px; padding:1px 4px;
  border-radius:3px; text-transform:uppercase; letter-spacing:0.5px;
}
.hd-sb-badge-up { background:rgba(60,224,212,0.15); color:var(--hd-cyan); }
.hd-sb-badge-down { background:rgba(239,68,68,0.15); color:var(--hd-danger); }
.hd-sb-badge-gold { background:rgba(255,217,60,0.15); color:var(--hd-gold); }
.hd-sb-badge-wool { background:rgba(245,240,232,0.15); color:var(--hd-wool); }
.hd-sb-leaderboard {
  margin:6px 0; padding:6px; border-radius:6px;
  background:rgba(241,228,205,0.04); border:1px solid var(--hd-gb);
}
.hd-sb-lead-row {
  display:flex; align-items:center; gap:6px; padding:3px 0;
  font-family:'DM Mono',monospace; font-size:10px;
}
.hd-sb-lead-rank {
  font-family:'Bowlby One',cursive; font-size:12px; color:var(--hd-amber);
  width:18px; text-align:center;
}
.hd-sb-lead-bar {
  flex:1; height:6px; border-radius:3px; background:rgba(241,228,205,0.1);
  overflow:hidden;
}
.hd-sb-lead-fill { height:100%; border-radius:3px; transition:width 0.3s; }

/* ── controls ── */
.hd-controls-bar {
  position:fixed; bottom:0; left:0; right:0; z-index:90;
  display:flex; align-items:center; justify-content:center; gap:16px;
  padding:10px 20px;
  background:linear-gradient(transparent,rgba(58,24,8,0.95));
  backdrop-filter:blur(8px);
}
.hd-btn {
  font-family:'Anton',sans-serif; font-size:13px;
  padding:8px 20px; border:1px solid var(--hd-amber);
  background:rgba(232,198,104,0.1); color:var(--hd-amber);
  border-radius:6px; cursor:pointer; text-transform:uppercase;
  letter-spacing:2px; transition:background 0.2s;
}
.hd-btn:hover { background:rgba(232,198,104,0.25); }
.hd-counter-display {
  font-family:'DM Mono',monospace; font-size:12px; color:var(--hd-sand);
}

/* ── comm chatter ── */
.hd-comm {
  font-family:'DM Mono',monospace; font-size:11px;
  color:rgba(241,228,205,0.4); font-style:italic;
  padding:6px 12px; margin:8px 0;
  border-left:2px solid rgba(241,228,205,0.1);
}

/* ── title card ── */
.hd-title-wrap {
  text-align:center; padding:60px 20px 40px;
}
.hd-title-main {
  font-family:'Bowlby One',cursive; font-size:42px;
  color:var(--hd-sand); text-transform:uppercase;
  text-shadow:3px 3px 0 var(--hd-deep), 0 0 30px rgba(232,198,104,0.3);
  margin-bottom:8px; line-height:1.1;
}
.hd-title-sub {
  font-family:'Anton',sans-serif; font-size:16px;
  color:var(--hd-amber); letter-spacing:4px; text-transform:uppercase;
  margin-bottom:24px;
}
.hd-title-desc {
  font-size:15px; line-height:1.6; max-width:600px; margin:0 auto 30px;
  color:rgba(241,228,205,0.75);
}
.hd-title-tribes {
  display:flex; gap:16px; justify-content:center; flex-wrap:wrap;
  margin-bottom:24px;
}
.hd-title-tribe {
  padding:12px 16px; border-radius:8px;
  background:rgba(241,228,205,0.06); border:1px solid var(--hd-gb);
  font-family:'Anton',sans-serif; font-size:15px; letter-spacing:1px;
  min-width:140px;
}
.hd-title-phases {
  display:flex; gap:12px; justify-content:center; flex-wrap:wrap;
}
.hd-title-chip {
  font-family:'DM Mono',monospace; font-size:11px; text-transform:uppercase;
  padding:6px 14px; border-radius:20px;
  border:1px solid var(--hd-amber); color:var(--hd-amber);
  letter-spacing:1px;
}

/* ── results ── */
.hd-results-wrap { padding:40px 20px 80px; text-align:center; }
.hd-results-title {
  font-family:'Bowlby One',cursive; font-size:32px; color:var(--hd-gold);
  margin-bottom:24px; text-shadow:2px 2px 0 var(--hd-deep);
}
.hd-podium {
  display:flex; gap:16px; justify-content:center; align-items:flex-end;
  margin-bottom:30px; flex-wrap:wrap;
}
.hd-podium-slot {
  padding:16px 24px; border-radius:10px; min-width:160px;
  background:rgba(241,228,205,0.06); border:1px solid var(--hd-gb);
}
.hd-podium-slot.winner {
  background:rgba(255,217,60,0.1); border-color:var(--hd-gold);
  box-shadow:0 0 20px rgba(255,217,60,0.15);
}
.hd-podium-slot.loser {
  background:rgba(239,68,68,0.08); border-color:var(--hd-danger);
}
.hd-podium-rank {
  font-family:'Bowlby One',cursive; font-size:28px; color:var(--hd-amber);
}
.hd-podium-rank.r1 { color:var(--hd-gold); }
.hd-podium-rank.r-last { color:var(--hd-danger); }
.hd-podium-name {
  font-family:'Anton',sans-serif; font-size:18px; letter-spacing:1px;
  margin:6px 0;
}
.hd-podium-scores {
  font-family:'DM Mono',monospace; font-size:11px;
  color:rgba(241,228,205,0.6); margin-top:4px;
}
.hd-mvp-card {
  display:inline-block; padding:16px 30px; border-radius:10px;
  background:rgba(255,217,60,0.08); border:1px solid var(--hd-gold);
  margin-top:20px;
}
.hd-mvp-label {
  font-family:'DM Mono',monospace; font-size:10px;
  color:var(--hd-gold); text-transform:uppercase; letter-spacing:2px;
}
.hd-mvp-name {
  font-family:'Bowlby One',cursive; font-size:22px; color:var(--hd-sand);
  margin-top:4px;
}
.hd-tribal-banner {
  margin-top:24px; padding:14px 24px; border-radius:8px;
  background:rgba(239,68,68,0.1); border:1px solid var(--hd-danger);
  font-family:'Anton',sans-serif; font-size:15px; color:var(--hd-danger);
  letter-spacing:2px; text-transform:uppercase;
  animation:hd-dpulse 2s ease-in-out infinite;
}
@keyframes hd-dpulse { 0%,100%{box-shadow:0 0 10px rgba(239,68,68,0.1)} 50%{box-shadow:0 0 20px rgba(239,68,68,0.3)} }

/* ── title entrance animation ── */
@keyframes hd-title-enter {
  0% { opacity:0; transform:translateY(24px); }
  100% { opacity:1; transform:translateY(0); }
}

/* ── live dot pulse ── */
.hd-live-dot {
  width:8px; height:8px; border-radius:50%; background:var(--hd-danger);
  display:inline-block; animation:hd-live-pulse 1.5s ease-in-out infinite;
}
@keyframes hd-live-pulse {
  0%,100% { opacity:1; box-shadow:0 0 4px var(--hd-danger); }
  50% { opacity:0.4; box-shadow:0 0 12px var(--hd-danger); }
}

/* ── active phase chip ── */
.hd-chip-active {
  background:rgba(232,198,104,0.15);
  box-shadow:0 0 8px rgba(232,198,104,0.2);
}

/* ── portrait styling ── */
.hd-portrait { border:1px solid var(--hd-gb); }

/* ── sheep wander ── */
@keyframes hd-sheep-wander { 0%{transform:translateX(-4px)} 100%{transform:translateX(4px)} }

/* ── shake ── */
@keyframes hd-shake {
  0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)}
  60%{transform:translateX(-3px)} 80%{transform:translateX(3px)}
}

/* ── icon system ── */
.hd-icon { display:inline-block; position:relative; vertical-align:middle; }

/* emu */
.hd-iemu { width:24px; height:24px; }
.hd-iemu-body { position:absolute; bottom:4px; left:4px; width:14px; height:10px; background:var(--hd-dust); border-radius:50%; }
.hd-iemu-neck { position:absolute; bottom:12px; left:10px; width:3px; height:10px; background:var(--hd-dust); border-radius:2px; transform:rotate(-10deg); }
.hd-iemu-head { position:absolute; top:0; left:8px; width:8px; height:6px; background:var(--hd-sand); border-radius:50%; }
.hd-iemu-head::after { content:''; position:absolute; right:-3px; top:2px; width:4px; height:2px; background:var(--hd-amber); border-radius:0 2px 2px 0; }
.hd-iemu-leg1,.hd-iemu-leg2 { position:absolute; bottom:0; width:2px; height:6px; background:var(--hd-dust); }
.hd-iemu-leg1 { left:7px; }
.hd-iemu-leg2 { left:13px; }

/* sheep */
.hd-isheep { width:22px; height:18px; }
.hd-isheep-body { position:absolute; bottom:4px; left:2px; width:16px; height:11px; background:var(--hd-wool); border-radius:8px 8px 4px 4px; }
.hd-isheep-head { position:absolute; bottom:6px; right:0; width:7px; height:6px; background:var(--hd-sand); border-radius:3px; }
.hd-isheep-head::after { content:''; position:absolute; right:0; top:1px; width:2px; height:2px; background:var(--hd-deep); border-radius:50%; }
.hd-isheep-leg1,.hd-isheep-leg2 { position:absolute; bottom:0; width:2px; height:5px; background:var(--hd-dust); }
.hd-isheep-leg1 { left:5px; }
.hd-isheep-leg2 { left:13px; }

/* dingo */
.hd-idingo { width:26px; height:20px; }
.hd-idingo-body { position:absolute; bottom:4px; left:2px; width:18px; height:10px; background:var(--hd-orange); border-radius:6px 10px 4px 4px; }
.hd-idingo-head { position:absolute; bottom:8px; right:0; width:10px; height:8px; background:var(--hd-orange); border-radius:4px 8px 4px 4px; }
.hd-idingo-head::after { content:''; position:absolute; right:0; top:2px; width:6px; height:3px; background:#d4712a; border-radius:0 4px 2px 0; }
.hd-idingo-ear1,.hd-idingo-ear2 { position:absolute; width:0; height:0; border-left:3px solid transparent; border-right:3px solid transparent; border-bottom:5px solid var(--hd-orange); }
.hd-idingo-ear1 { top:0; right:6px; }
.hd-idingo-ear2 { top:0; right:12px; }
.hd-idingo-tail { position:absolute; bottom:8px; left:0; width:8px; height:3px; background:var(--hd-orange); border-radius:4px 0 0 4px; transform:rotate(-20deg); }

/* wool */
.hd-iwool { width:20px; height:14px; }
.hd-iwool-c1,.hd-iwool-c2,.hd-iwool-c3 { position:absolute; border-radius:50%; background:var(--hd-wool); }
.hd-iwool-c1 { width:10px; height:10px; bottom:0; left:0; }
.hd-iwool-c2 { width:12px; height:12px; bottom:0; left:6px; }
.hd-iwool-c3 { width:10px; height:10px; bottom:2px; left:3px; }

/* canyon */
.hd-icanyon { width:20px; height:18px; }
.hd-icanyon-l,.hd-icanyon-r { position:absolute; bottom:0; width:6px; height:18px; background:var(--hd-dust); }
.hd-icanyon-l { left:0; border-radius:2px 0 0 2px; transform:skewX(8deg); }
.hd-icanyon-r { right:0; border-radius:0 2px 2px 0; transform:skewX(-8deg); }

/* bungee cord */
.hd-ibungee { width:12px; height:22px; }
.hd-ibungee-cord { position:absolute; top:0; left:5px; width:2px; height:18px; background:var(--hd-sand); }
.hd-ibungee-knot { position:absolute; bottom:0; left:3px; width:6px; height:6px; border-radius:50%; background:var(--hd-amber); }

/* brand star */
.hd-ibrand { width:16px; height:16px; }
.hd-ibrand-star { position:absolute; inset:0; }
.hd-ibrand-star::before,.hd-ibrand-star::after {
  content:''; position:absolute; left:3px; top:1px;
  width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent;
  border-bottom:10px solid var(--hd-gold);
}
.hd-ibrand-star::after { transform:rotate(180deg); top:5px; }

/* momentum arrows */
.hd-imomup { width:12px; height:12px; }
.hd-imomup::before { content:''; position:absolute; left:2px; top:3px; width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-bottom:6px solid var(--hd-cyan); }
.hd-imomdn { width:12px; height:12px; }
.hd-imomdn::before { content:''; position:absolute; left:2px; top:3px; width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:6px solid var(--hd-danger); }

/* clock */
.hd-iclock { width:14px; height:14px; border:2px solid var(--hd-sand); border-radius:50%; position:relative; }
.hd-iclock-h { position:absolute; left:5px; bottom:5px; width:2px; height:5px; background:var(--hd-sand); transform-origin:bottom; transform:rotate(-30deg); }
.hd-iclock-m { position:absolute; left:5px; bottom:5px; width:1px; height:6px; background:var(--hd-amber); transform-origin:bottom; transform:rotate(60deg); }

/* trophy */
.hd-itrophy { width:16px; height:16px; }
.hd-itrophy::before {
  content:''; position:absolute; left:3px; top:2px;
  width:10px; height:8px; background:var(--hd-gold);
  border-radius:0 0 5px 5px;
}
.hd-itrophy::after {
  content:''; position:absolute; left:5px; bottom:0;
  width:6px; height:4px; background:var(--hd-amber);
  border-radius:0 0 2px 2px;
}

/* kangaroo */
.hd-ikanga { width:16px; height:16px; }
.hd-ikanga-body { position:absolute; left:4px; top:3px; width:8px; height:10px; background:var(--hd-dust); border-radius:4px 4px 2px 2px; }
.hd-ikanga-head { position:absolute; left:8px; top:0; width:5px; height:5px; background:var(--hd-dust); border-radius:50%; }
.hd-ikanga-tail { position:absolute; left:0; top:6px; width:6px; height:3px; background:var(--hd-amber); border-radius:3px 0 0 3px; transform:rotate(-15deg); }
.hd-ikanga-leg { position:absolute; left:6px; bottom:0; width:3px; height:5px; background:var(--hd-dust); border-radius:0 0 1px 1px; }

/* moon */
.hd-imoon { width:14px; height:14px; }
.hd-imoon::before {
  content:''; position:absolute; left:2px; top:1px;
  width:10px; height:10px; background:var(--hd-amber);
  border-radius:50%; box-shadow:3px -2px 0 0 var(--hd-deep);
}

/* shears */
.hd-ishears { width:16px; height:14px; }
.hd-ishears-bl { position:absolute; left:2px; top:2px; width:6px; height:10px; background:var(--hd-sand); border-radius:3px; transform:rotate(-10deg); }
.hd-ishears-br { position:absolute; right:2px; top:2px; width:6px; height:10px; background:var(--hd-sand); border-radius:3px; transform:rotate(10deg); }

/* flag */
.hd-iflag { width:14px; height:16px; }
.hd-iflag-pole { position:absolute; left:3px; top:0; width:2px; height:16px; background:var(--hd-sand); }
.hd-iflag-cloth { position:absolute; left:5px; top:1px; width:8px; height:6px; background:var(--hd-orange); border-radius:0 2px 2px 0; }

/* wrangling phase */
.hd-phase-wrangle { background:linear-gradient(180deg,#a0592a 0%,var(--hd-earth) 60%,#3a1808 100%); }

/* card for wrangling */
.hd-wrangle-attempt { border-left:3px dashed var(--hd-amber); margin-left:12px; }
.tag-wrangle { background:var(--hd-amber); color:var(--hd-deep); }
.tag-kangaroo { background:var(--hd-dust); color:var(--hd-sand); }
.tag-overnight { background:#2a1a4a; color:var(--hd-amber); }
.tag-arrival { background:var(--hd-scrub); color:var(--hd-sand); }
.tag-shears { background:var(--hd-gold); color:var(--hd-deep); }
`;


// ═══════════════════════════════════════════════════════════════
//  SIDEBAR BUILDER
// ═══════════════════════════════════════════════════════════════

function _buildSidebarContent(ep, screenKey) {
  const hd = ep.picnicHangingDork;
  if (!hd) return '';
  if (!hd.isPostMerge) _normTribes(hd);
  const st = _tvState[screenKey] || { idx: -1 };
  const revIdx = st.idx;
  let html = '';

  if (screenKey === 'hd-race' || screenKey === 'hd-title') {
    const stepMeta = window._hdRaceStepMeta || [];

    if (hd.isPostMerge) {
      // ── POST-MERGE: individual player leaderboard ──
      const playerStats = {};
      (hd.players || []).forEach(p => {
        playerStats[p.name] = { time: 0, momentum: 0, segs: 0, surges: 0, bucks: 0, shortcuts: 0, stumbles: 0, timeDelta: 0 };
      });

      for (let i = 0; i <= revIdx && i < stepMeta.length; i++) {
        const m = stepMeta[i];
        if (m?.type === 'seg-player' && m.player && playerStats[m.player]) {
          playerStats[m.player].time += m.segTime || 0;
          playerStats[m.player].momentum = m.momentum || 0;
          playerStats[m.player].segs++;
        }
        if (m?.type === 'member-event' && m.player && playerStats[m.player]) {
          const ps = playerStats[m.player];
          ps.timeDelta += m.timeDelta || 0;
          if (m.evtType === 'surge' || m.evtType === 'bond') ps.surges++;
          else if (m.evtType === 'buck') ps.bucks++;
          else if (m.evtType === 'shortcut') ps.shortcuts++;
          else if (m.evtType === 'stumble' || m.evtType === 'refuse' || m.evtType === 'dust') ps.stumbles++;
        }
      }

      html += `<div class="hd-sb-title">${_icon('emu')} Race Leaderboard</div>`;
      const sorted = Object.entries(playerStats).filter(([,s]) => s.segs > 0).sort((a, b) => (a[1].time || 999) - (b[1].time || 999));
      const maxTime = Math.max(1, ...sorted.map(([,s]) => s.time || 0));
      sorted.forEach(([name, ps], idx) => {
        const pct = Math.round((ps.time / maxTime) * 100);
        const momBadge = ps.momentum > 0 ? `<span class="hd-sb-player-badge hd-sb-badge-up">+${ps.momentum}</span>` :
          ps.momentum < 0 ? `<span class="hd-sb-player-badge hd-sb-badge-down">${ps.momentum}</span>` : '';
        html += `<div class="hd-sb-lead-row">
          <span class="hd-sb-lead-rank">${idx + 1}</span>
          ${portrait(name, 18)}
          <span class="hd-sb-player-name" style="font-size:11px">${name.split(' ')[0]}</span>
          ${momBadge}
          <span class="hd-sb-player-stat">${ps.time.toFixed(1)}s</span>
        </div>
        <div class="hd-sb-lead-bar"><div class="hd-sb-lead-fill" style="width:${pct}%;background:var(--hd-amber)"></div></div>`;
      });

      // per-player event badges
      html += '<hr class="hd-sb-divider">';
      html += `<div class="hd-sb-title" style="font-size:11px">Player Events</div>`;
      sorted.forEach(([name, ps]) => {
        const badges = [];
        if (ps.surges > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-up">${ps.surges} surge</span>`);
        if (ps.shortcuts > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-gold">${ps.shortcuts} shortcut</span>`);
        if (ps.bucks > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${ps.bucks} buck</span>`);
        if (ps.stumbles > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${ps.stumbles} stumble</span>`);
        if (badges.length === 0) return;
        const deltaColor = ps.timeDelta < 0 ? 'var(--hd-cyan)' : ps.timeDelta > 0 ? 'var(--hd-danger)' : 'var(--hd-sand)';
        html += `<div class="hd-sb-player">
          ${portrait(name, 18)}
          <span class="hd-sb-player-name">${name.split(' ')[0]}</span>
          <span class="hd-sb-player-stat" style="color:${deltaColor}">${ps.timeDelta > 0 ? '+' : ''}${ps.timeDelta.toFixed(1)}s</span>
        </div>
        <div style="display:flex;gap:2px;flex-wrap:wrap;margin:1px 0 3px 24px">${badges.join('')}</div>`;
      });

    } else {
    // ── PRE-MERGE: tribe-based race sidebar (original) ──

    // collect per-tribe and per-player revealed data
    const tribeStats = {};
    const playerEvents = {};
    hd.tribes.forEach(t => {
      tribeStats[t.tribeName] = { time: 0, momentum: 0, segs: 0 };
      t.members.forEach(m => { playerEvents[m] = { surges: 0, bucks: 0, shortcuts: 0, stumbles: 0, timeDelta: 0 }; });
    });

    for (let i = 0; i <= revIdx && i < stepMeta.length; i++) {
      const m = stepMeta[i];
      if (m?.type === 'seg-tribe' && m.tribeName) {
        tribeStats[m.tribeName].time += m.segTime || 0;
        tribeStats[m.tribeName].momentum = m.momentum || 0;
        tribeStats[m.tribeName].segs++;
      }
      if (m?.type === 'member-event' && m.player) {
        const pe = playerEvents[m.player];
        if (pe) {
          pe.timeDelta += m.timeDelta || 0;
          if (m.evtType === 'surge' || m.evtType === 'bond') pe.surges++;
          else if (m.evtType === 'buck') pe.bucks++;
          else if (m.evtType === 'shortcut') pe.shortcuts++;
          else if (m.evtType === 'stumble' || m.evtType === 'refuse' || m.evtType === 'dust') pe.stumbles++;
        }
      }
    }

    // tribe leaderboard
    html += `<div class="hd-sb-title">${_icon('emu')} Race Standings</div>`;
    const sortedTribes = hd.tribes.slice().sort((a, b) => (tribeStats[a.tribeName]?.time || 999) - (tribeStats[b.tribeName]?.time || 999));
    const maxTime = Math.max(1, ...sortedTribes.map(t => tribeStats[t.tribeName]?.time || 0));
    sortedTribes.forEach((tribe, idx) => {
      const ts = tribeStats[tribe.tribeName] || { time: 0, momentum: 0, segs: 0 };
      if (ts.segs === 0) return;
      const pct = Math.round((ts.time / maxTime) * 100);
      const momBadge = ts.momentum > 0 ? `<span class="hd-sb-player-badge hd-sb-badge-up">+${ts.momentum}</span>` :
        ts.momentum < 0 ? `<span class="hd-sb-player-badge hd-sb-badge-down">${ts.momentum}</span>` : '';
      html += `<div class="hd-sb-lead-row">
        <span class="hd-sb-lead-rank">${idx + 1}</span>
        <span class="hd-sb-tribe-dot" style="background:${tribe.color}"></span>
        <span class="hd-sb-player-name" style="font-size:11px">${tribe.tribeName}</span>
        ${momBadge}
        <span class="hd-sb-player-stat">${ts.time.toFixed(1)}s</span>
      </div>
      <div class="hd-sb-lead-bar"><div class="hd-sb-lead-fill" style="width:${pct}%;background:${tribe.color}"></div></div>`;
    });

    // per-tribe player breakdown
    html += '<hr class="hd-sb-divider">';
    html += `<div class="hd-sb-title" style="font-size:11px">Player Performance</div>`;
    hd.tribes.forEach(tribe => {
      html += `<div class="hd-sb-tribe">
        <div class="hd-sb-tribe-name"><span class="hd-sb-tribe-dot" style="background:${tribe.color}"></span> ${tribe.tribeName}</div>`;
      tribe.members.forEach(m => {
        const pe = playerEvents[m] || { surges: 0, bucks: 0, shortcuts: 0, stumbles: 0, timeDelta: 0 };
        const hasData = pe.surges + pe.bucks + pe.shortcuts + pe.stumbles > 0;
        const badges = [];
        if (pe.surges > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-up">${pe.surges} surge</span>`);
        if (pe.shortcuts > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-gold">${pe.shortcuts} shortcut</span>`);
        if (pe.bucks > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${pe.bucks} buck</span>`);
        if (pe.stumbles > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${pe.stumbles} stumble</span>`);
        const deltaColor = pe.timeDelta < 0 ? 'var(--hd-cyan)' : pe.timeDelta > 0 ? 'var(--hd-danger)' : 'var(--hd-sand)';
        html += `<div class="hd-sb-player">
          ${portrait(m, 18)}
          <span class="hd-sb-player-name">${m.split(' ')[0]}</span>
          ${hasData ? `<span class="hd-sb-player-stat" style="color:${deltaColor}">${pe.timeDelta > 0 ? '+' : ''}${pe.timeDelta.toFixed(1)}s</span>` : '<span class="hd-sb-player-stat" style="opacity:0.3">—</span>'}
        </div>
        ${badges.length > 0 ? `<div style="display:flex;gap:2px;flex-wrap:wrap;margin:1px 0 3px 24px">${badges.join('')}</div>` : ''}`;
      });
      html += `</div>`;
    });

    // social events log
    const revealedSocial = [];
    for (let i = 0; i <= revIdx && i < stepMeta.length; i++) {
      const m = stepMeta[i];
      if (m?.socialType) revealedSocial.push(m);
    }
    if (revealedSocial.length > 0) {
      html += '<hr class="hd-sb-divider">';
      html += `<div class="hd-sb-title" style="font-size:11px">${_icon('dust')} Sabotage Log</div>`;
      revealedSocial.forEach(s => {
        html += `<div class="hd-sb-player" style="gap:3px">
          ${portrait(s.actor, 14)} <span style="font-size:9px;color:var(--hd-amber)">${s.socialType.replace('-',' ')}</span> → ${portrait(s.target, 14)}
        </div>`;
      });
    }

    } // end pre-merge race sidebar

  } else if (screenKey === 'hd-bungee') {
    const stepMeta = window._hdBungeeStepMeta || [];

    if (hd.isPostMerge) {
      // ── POST-MERGE: individual golden fleece hunt ──
      const playerData = {};
      (hd.players || []).forEach(p => {
        playerData[p.name] = { goldenFound: 0, grabs: 0, misses: 0, chaos: [], wool: 0, active: false };
      });

      for (let i = 0; i <= revIdx && i < stepMeta.length; i++) {
        const m = stepMeta[i];
        if (!m?.player) continue;
        const pd = playerData[m.player];
        if (!pd) continue;
        pd.active = true;
        if (m.type === 'grab') { if (m.grabSuccess) pd.grabs++; else pd.misses++; }
        if (m.type === 'shear' && m.woolFinal > 0) pd.wool += m.woolFinal;
        if (m.type === 'brand' && m.brandFound) pd.goldenFound++;
        if (m.type === 'chaos') pd.chaos.push(m.chaosType);
      }

      // Golden fleece per player (top 5)
      html += `<div class="hd-sb-title">${_icon('brand')} Golden Fleece Hunt</div>`;
      const sorted = Object.entries(playerData)
        .filter(([,d]) => d.active)
        .sort((a, b) => (b[1].goldenFound - a[1].goldenFound) || (b[1].grabs - a[1].grabs));
      const topPlayers = sorted.slice(0, 5);
      const goalGolden = hd.isPostMerge ? 2 : 3;
      topPlayers.forEach(([name, pd], idx) => {
        const stars = Array.from({length: goalGolden}, (_, i) => i < pd.goldenFound
          ? `${_icon('brand')}`
          : `<span style="opacity:0.2">${_icon('brand')}</span>`
        ).join(' ');
        html += `<div class="hd-sb-lead-row">
          <span class="hd-sb-lead-rank">${idx + 1}</span>
          ${portrait(name, 18)}
          <span class="hd-sb-player-name" style="font-size:11px">${name.split(' ')[0]}</span>
          <span class="hd-sb-player-stat">${stars}</span>
        </div>
        <div class="hd-sb-lead-bar"><div class="hd-sb-lead-fill" style="width:${Math.round(pd.goldenFound / goalGolden * 100)}%;background:${pd.goldenFound >= goalGolden ? 'var(--hd-gold)' : 'var(--hd-amber)'}"></div></div>`;
      });

      // per-player chaos badges
      html += '<hr class="hd-sb-divider">';
      html += `<div class="hd-sb-title" style="font-size:11px">${_icon('bungee')} Jumpers</div>`;
      sorted.forEach(([name, pd]) => {
        const badges = [];
        if (pd.goldenFound > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-gold">${_icon('brand')} ${pd.goldenFound} golden</span>`);
        if (pd.chaos.includes('dingo-grab')) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${_icon('dingo')} dingo</span>`);
        if (pd.chaos.includes('no-cord')) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">NO CORD</span>`);
        if (pd.chaos.includes('tangle')) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">tangled</span>`);
        if (pd.misses > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${pd.misses} miss</span>`);
        html += `<div class="hd-sb-player">
          ${portrait(name, 18)}
          <span class="hd-sb-player-name">${name.split(' ')[0]}</span>
          <span class="hd-sb-player-stat">${pd.grabs > 0 ? `${pd.grabs} grab${pd.grabs > 1 ? 's' : ''}` : '—'}</span>
        </div>
        ${badges.length > 0 ? `<div style="display:flex;gap:2px;flex-wrap:wrap;margin:1px 0 3px 24px">${badges.join('')}</div>` : ''}`;
      });

    } else {
    // ── PRE-MERGE: tribe-based bungee sidebar (original) ──

    // collect per-tribe brands found and per-player data
    const tribeBrands = {};
    const playerData = {};
    hd.tribes.forEach(t => {
      tribeBrands[t.tribeName] = 0;
      t.members.forEach(m => { playerData[m] = { brandsFound: 0, grabs: 0, misses: 0, chaos: [], wool: 0, active: false }; });
    });

    for (let i = 0; i <= revIdx && i < stepMeta.length; i++) {
      const m = stepMeta[i];
      if (!m?.player) continue;
      const pd = playerData[m.player];
      if (!pd) continue;
      pd.active = true;
      if (m.type === 'grab') {
        if (m.grabSuccess) pd.grabs++; else pd.misses++;
      }
      if (m.type === 'shear' && m.woolFinal > 0) {
        pd.wool += m.woolFinal;
      }
      if (m.type === 'brand' && m.brandFound) {
        pd.brandsFound++;
        tribeBrands[m.tribeName] = (tribeBrands[m.tribeName] || 0) + 1;
      }
      if (m.type === 'chaos') {
        pd.chaos.push(m.chaosType);
      }
    }

    // Brand progress per tribe
    html += `<div class="hd-sb-title">${_icon('brand')} Brand Hunt</div>`;
    const sortedTribes = hd.tribes.slice().sort((a, b) => (tribeBrands[b.tribeName] || 0) - (tribeBrands[a.tribeName] || 0));
    sortedTribes.forEach((tribe, idx) => {
      const bf = tribeBrands[tribe.tribeName] || 0;
      const stars = Array.from({length: 3}, (_, i) => i < bf
        ? `${_icon('brand')}`
        : `<span style="opacity:0.2">${_icon('brand')}</span>`
      ).join(' ');
      html += `<div class="hd-sb-lead-row">
        <span class="hd-sb-lead-rank">${idx + 1}</span>
        <span class="hd-sb-tribe-dot" style="background:${tribe.color}"></span>
        <span class="hd-sb-player-name" style="font-size:11px">${tribe.tribeName}</span>
        <span class="hd-sb-player-stat">${stars}</span>
      </div>
      <div class="hd-sb-lead-bar"><div class="hd-sb-lead-fill" style="width:${Math.round(bf / 3 * 100)}%;background:${bf >= 3 ? 'var(--hd-gold)' : tribe.color}"></div></div>`;
    });

    // per-player breakdown
    html += '<hr class="hd-sb-divider">';
    html += `<div class="hd-sb-title" style="font-size:11px">${_icon('bungee')} Jumpers</div>`;
    hd.tribes.forEach(tribe => {
      html += `<div class="hd-sb-tribe">
        <div class="hd-sb-tribe-name"><span class="hd-sb-tribe-dot" style="background:${tribe.color}"></span> ${tribe.tribeName}</div>`;
      tribe.members.forEach(m => {
        const pd = playerData[m] || { brandsFound: 0, grabs: 0, misses: 0, chaos: [], wool: 0, active: false };
        if (!pd.active) {
          html += `<div class="hd-sb-player">${portrait(m, 18)} <span class="hd-sb-player-name">${m.split(' ')[0]}</span> <span class="hd-sb-player-stat" style="opacity:0.3">waiting</span></div>`;
          return;
        }
        const badges = [];
        if (pd.brandsFound > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-gold">${_icon('brand')} ${pd.brandsFound} brand${pd.brandsFound > 1 ? 's' : ''}</span>`);
        if (pd.chaos.includes('dingo-grab')) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${_icon('dingo')} dingo</span>`);
        if (pd.chaos.includes('no-cord')) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">NO CORD</span>`);
        if (pd.chaos.includes('tangle')) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">tangled</span>`);
        if (pd.misses > 0) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${pd.misses} miss</span>`);
        html += `<div class="hd-sb-player">
          ${portrait(m, 18)}
          <span class="hd-sb-player-name">${m.split(' ')[0]}</span>
          <span class="hd-sb-player-stat">${pd.grabs > 0 ? `${pd.grabs} grab${pd.grabs > 1 ? 's' : ''}` : '—'}</span>
        </div>
        ${badges.length > 0 ? `<div style="display:flex;gap:2px;flex-wrap:wrap;margin:1px 0 3px 24px">${badges.join('')}</div>` : ''}`;
      });
      html += `</div>`;
    });

    } // end pre-merge bungee sidebar

  } else if (screenKey === 'hd-results') {

    if (hd.isPostMerge) {
      // ── POST-MERGE: individual final standings ──
      html += `<div class="hd-sb-title">${_icon('trophy')} Final Standings</div>`;
      const rankings = hd.rankings || (hd.players || []).map(p => p.name);
      rankings.forEach((name, idx) => {
        const p = (hd.players || []).find(x => x.name === name);
        const isWinner = name === hd.immunityWinner;
        const gf = p?.goldenFleeceFound || 0;
        const rt = p?.totalRaceTime || 0;
        const score = ep.chalMemberScores?.[name] || 0;
        const brandStars = Array.from({length: 2}, (_, i) => i < gf ? _icon('brand') : `<span style="opacity:0.2">${_icon('brand')}</span>`).join('');
        html += `<div class="hd-sb-tribe" style="${isWinner ? 'border-color:var(--hd-gold)' : ''}">
          <div class="hd-sb-tribe-name">
            <span class="hd-sb-lead-rank" style="font-size:16px;${isWinner ? 'color:var(--hd-gold)' : ''}">#${idx + 1}</span>
            ${portrait(name, 22)}
            <span style="font-size:12px">${name}</span>
            ${isWinner ? '<span class="hd-sb-player-badge hd-sb-badge-gold" style="font-size:8px">IMMUNE</span>' : ''}
          </div>
          <div class="hd-sb-stat">${_icon('emu')} Race: ${rt.toFixed(1)}s</div>
          <div class="hd-sb-stat">${_icon('brand')} Golden: ${brandStars} ${gf}/2</div>
          <div class="hd-sb-stat" style="color:var(--hd-amber)">${_icon('trophy')} Score: ${score.toFixed(0)}pts</div>
        </div>`;
      });

    } else {
    // ── PRE-MERGE: tribe results sidebar (original) ──
    html += `<div class="hd-sb-title">${_icon('trophy')} Final Standings</div>`;
    const fastest = Math.min(...hd.tribes.map(t => t.totalRaceTime || 999));
    const maxBungee = Math.max(1, ...hd.tribes.map(t => t.bungeeScore || 0));

    hd.tribes.slice().sort((a, b) => {
      const as = 100 * fastest / (a.totalRaceTime || 1) + 100 * (a.bungeeScore || 0) / maxBungee;
      const bs = 100 * fastest / (b.totalRaceTime || 1) + 100 * (b.bungeeScore || 0) / maxBungee;
      return bs - as;
    }).forEach((tribe, idx) => {
      const isWinner = tribe.tribeName === hd.winningTribe;
      const isLoser = tribe.tribeName === hd.losingTribe;
      const raceScore = Math.round(100 * fastest / (tribe.totalRaceTime || 1));
      const bungeeNorm = Math.round(100 * (tribe.bungeeScore || 0) / maxBungee);
      const bf = tribe.brandsFound || 0;
      const brandStars = Array.from({length: 3}, (_, i) => i < bf ? _icon('brand') : `<span style="opacity:0.2">${_icon('brand')}</span>`).join('');
      html += `<div class="hd-sb-tribe" style="${isWinner ? 'border-color:var(--hd-gold)' : isLoser ? 'border-color:var(--hd-danger)' : ''}">
        <div class="hd-sb-tribe-name">
          <span class="hd-sb-lead-rank" style="font-size:16px;${isWinner ? 'color:var(--hd-gold)' : isLoser ? 'color:var(--hd-danger)' : ''}">#${idx + 1}</span>
          <span class="hd-sb-tribe-dot" style="background:${tribe.color}"></span> ${tribe.tribeName}
        </div>
        <div class="hd-sb-stat">${_icon('emu')} Race: ${(tribe.totalRaceTime || 0).toFixed(1)}s (${raceScore}pts)</div>
        <div class="hd-sb-stat">${_icon('brand')} Brands: ${brandStars} ${bf}/3 (${bungeeNorm}pts)</div>
        <div class="hd-sb-stat" style="opacity:0.5">${_icon('wool')} Wool: ${tribe.totalWool || 0}</div>
        <div class="hd-sb-stat" style="color:var(--hd-amber)">${_icon('trophy')} Total: ${raceScore + bungeeNorm}pts</div>`;

      // show each player with portrait + their final score
      tribe.members.forEach(m => {
        const score = ep.chalMemberScores?.[m] || 0;
        html += `<div class="hd-sb-player">
          ${portrait(m, 16)}
          <span class="hd-sb-player-name">${m.split(' ')[0]}</span>
          <span class="hd-sb-player-stat">${score.toFixed(0)}pts</span>
        </div>`;
      });
      html += `</div>`;
    });

    // MVP
    if (hd.mvpPlayer) {
      html += `<hr class="hd-sb-divider">
        <div style="text-align:center;padding:6px">
          <div class="hd-sb-player-badge hd-sb-badge-gold" style="font-size:9px;padding:2px 8px">MVP</div>
          <div style="margin:4px 0">${portrait(hd.mvpPlayer, 28)}</div>
          <div style="font-family:'Anton',sans-serif;font-size:12px;color:var(--hd-gold)">${hd.mvpPlayer}</div>
        </div>`;
    }

    } // end pre-merge results sidebar

  } else if (screenKey === 'hd-wrangle') {
    const stepMeta = window._hdWrangleStepMeta || [];

    html += `<div class="hd-sb-title">${_icon('emu')} Emu Wrangling</div>`;

    const playerData = {};
    if (hd.isPostMerge) {
      (hd.players || []).forEach(p => { playerData[p.name] = { attempts: 0, quality: 0, caught: false, helped: false, helper: '' }; });
    } else {
      hd.tribes.forEach(t => {
        t.members.forEach(m => { playerData[m] = { attempts: 0, quality: 0, caught: false, helped: false, helper: '' }; });
      });
    }

    for (let i = 0; i <= revIdx && i < stepMeta.length; i++) {
      const m = stepMeta[i];
      if (!m?.player) continue;
      const pd = playerData[m.player];
      if (!pd) continue;
      if (m.type === 'approach') pd.attempts = 1;
      if (m.type === 'fail') pd.attempts++;
      if (m.type === 'success') {
        pd.caught = true;
        const wSource = hd.isPostMerge
          ? (hd.players || []).flatMap(p => p.emuWrangling || [])
          : hd.tribes.flatMap(t => t.emuWrangling || []);
        const w = wSource.find(w => w.player === m.player);
        if (w) pd.quality = w.emuQuality || 0;
      }
      if (m.type === 'help') pd.helped = true;
    }

    if (hd.isPostMerge) {
      // ── POST-MERGE: flat player list ──
      const allPlayers = (hd.players || []).map(p => p.name);
      const caught = allPlayers.filter(m => playerData[m]?.caught).length;
      html += `<div style="font-size:10px;opacity:0.6;margin-bottom:4px">${caught}/${allPlayers.length} emus caught</div>`;

      allPlayers.forEach(m => {
        const pd = playerData[m] || { attempts: 0, quality: 0, caught: false };
        if (pd.attempts === 0 && !pd.caught) {
          html += `<div class="hd-sb-player">${portrait(m, 18)} <span class="hd-sb-player-name">${m.split(' ')[0]}</span> <span class="hd-sb-player-stat" style="opacity:0.3">waiting</span></div>`;
          return;
        }
        const qualBar = pd.caught ? `<div class="hd-sb-lead-bar" style="margin:1px 0 3px 24px"><div class="hd-sb-lead-fill" style="width:${pd.quality * 10}%;background:${pd.quality >= 7 ? 'var(--hd-cyan)' : pd.quality >= 4 ? 'var(--hd-amber)' : 'var(--hd-danger)'}"></div></div>` : '';
        const badges = [];
        if (pd.caught && pd.attempts === 1) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-gold">1st try</span>`);
        if (pd.attempts >= 3) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${pd.attempts} tries</span>`);
        if (pd.helped) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-up">helped</span>`);
        html += `<div class="hd-sb-player">
          ${portrait(m, 18)}
          <span class="hd-sb-player-name">${m.split(' ')[0]}</span>
          <span class="hd-sb-player-stat">${pd.caught ? `${pd.quality}/10` : `${pd.attempts} tries...`}</span>
        </div>
        ${qualBar}
        ${badges.length > 0 ? `<div style="display:flex;gap:2px;flex-wrap:wrap;margin:1px 0 3px 24px">${badges.join('')}</div>` : ''}`;
      });

    } else {
    // ── PRE-MERGE: tribe-grouped wrangle sidebar (original) ──
    hd.tribes.forEach(tribe => {
      html += `<div class="hd-sb-tribe">
        <div class="hd-sb-tribe-name"><span class="hd-sb-tribe-dot" style="background:${tribe.color}"></span> ${tribe.tribeName}</div>`;

      const caught = tribe.members.filter(m => playerData[m]?.caught).length;
      const total = tribe.members.length;
      html += `<div style="font-size:10px;opacity:0.6;margin-bottom:4px">${caught}/${total} emus caught</div>`;

      tribe.members.forEach(m => {
        const pd = playerData[m] || { attempts: 0, quality: 0, caught: false };
        if (pd.attempts === 0 && !pd.caught) {
          html += `<div class="hd-sb-player">${portrait(m, 18)} <span class="hd-sb-player-name">${m.split(' ')[0]}</span> <span class="hd-sb-player-stat" style="opacity:0.3">waiting</span></div>`;
          return;
        }
        const qualBar = pd.caught ? `<div class="hd-sb-lead-bar" style="margin:1px 0 3px 24px"><div class="hd-sb-lead-fill" style="width:${pd.quality * 10}%;background:${pd.quality >= 7 ? 'var(--hd-cyan)' : pd.quality >= 4 ? 'var(--hd-amber)' : 'var(--hd-danger)'}"></div></div>` : '';
        const badges = [];
        if (pd.caught && pd.attempts === 1) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-gold">1st try</span>`);
        if (pd.attempts >= 3) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-down">${pd.attempts} tries</span>`);
        if (pd.helped) badges.push(`<span class="hd-sb-player-badge hd-sb-badge-up">helped</span>`);
        html += `<div class="hd-sb-player">
          ${portrait(m, 18)}
          <span class="hd-sb-player-name">${m.split(' ')[0]}</span>
          <span class="hd-sb-player-stat">${pd.caught ? `${pd.quality}/10` : `${pd.attempts} tries...`}</span>
        </div>
        ${qualBar}
        ${badges.length > 0 ? `<div style="display:flex;gap:2px;flex-wrap:wrap;margin:1px 0 3px 24px">${badges.join('')}</div>` : ''}`;
      });
      html += `</div>`;
    });
    } // end pre-merge wrangle sidebar
  }

  return html;
}

function _buildSidebar(ep, screenKey) {
  return `<div class="hd-sidebar" id="hd-sidebar"><div id="hd-sidebar-inner">${_buildSidebarContent(ep, screenKey)}</div></div>`;
}


// ═══════════════════════════════════════════════════════════════
//  SHELL WRAPPER
// ═══════════════════════════════════════════════════════════════

function _shell(content, ep, screenKey = 'hd-race') {
  const hd = ep.picnicHangingDork;
  if (!hd) return '';
  window._hdEpRecord = ep;
  const phaseCls = screenKey.includes('bungee') ? 'hd-phase-bungee'
    : screenKey.includes('results') ? 'hd-phase-results'
    : screenKey.includes('wrangle') ? 'hd-phase-wrangle' : 'hd-phase-race';
  const sidebar = _buildSidebar(ep, screenKey);
  return `<style>${HD_CSS}</style>
    <div class="hd-shell ${phaseCls}" data-phase="${screenKey}">
      <div class="hd-atmosphere" style="top:46px">${_buildAtmosphere(phaseCls)}</div>
      <div style="position:relative;z-index:2;flex:1;min-width:0;order:1;padding:16px;padding-bottom:60px">
        ${content}
      </div>
      ${sidebar}
    </div>`;
}


// ═══════════════════════════════════════════════════════════════
//  VP SCREEN BUILDERS
// ═══════════════════════════════════════════════════════════════

export function rpBuildHDTitleCard(ep) {
  const hd = ep.picnicHangingDork;
  if (!hd) return '';

  let rosterSection = '';
  if (hd.isPostMerge) {
    // ── POST-MERGE: individual player lineup ──
    const playerPortraits = (hd.players || []).map(p =>
      `<div style="display:inline-block;margin:3px;position:relative">
        ${portrait(p.name, 34)}
        <div style="font-family:'DM Mono',monospace;font-size:8px;text-align:center;margin-top:2px;opacity:0.7;max-width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split(' ')[0]}</div>
      </div>`
    ).join('');
    rosterSection = `<div class="hd-title-tribe" style="border-color:var(--hd-amber)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span class="hd-sb-tribe-dot" style="background:var(--hd-amber);width:10px;height:10px"></span>
        <span style="font-size:17px">${hd.players.length} Competitors</span>
        <span style="opacity:0.4;font-size:11px">Individual immunity</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px">${playerPortraits}</div>
    </div>`;
  } else {
    // ── PRE-MERGE: tribe rosters (original) ──
    _normTribes(hd);
    rosterSection = hd.tribes.map(t => {
      const memberPortraits = (t.members || []).map(m =>
        `<div style="display:inline-block;margin:3px;position:relative">
          ${portrait(m, 34)}
          <div style="font-family:'DM Mono',monospace;font-size:8px;text-align:center;margin-top:2px;opacity:0.7;max-width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.split(' ')[0]}</div>
        </div>`
      ).join('');
      return `<div class="hd-title-tribe" style="border-color:${t.color}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="hd-sb-tribe-dot" style="background:${t.color};width:10px;height:10px"></span>
          <span style="font-size:17px">${t.tribeName}</span>
          <span style="opacity:0.4;font-size:11px">${t.members.length} riders</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px">${memberPortraits}</div>
      </div>`;
    }).join('');
  }

  const subtitleText = hd.isPostMerge ? 'Individual Immunity Challenge' : 'Outback Challenge';
  const descText = hd.isPostMerge
    ? `Wrangle your emu from a stampeding herd. Then race solo across the outback — kangaroo ambushes, overnight camps, and staggered arrivals at Hanging Rock. Fastest rider gets battery-powered shears. Then bungee into a canyon full of sheep — grab one, shear it, and find the golden fleece. First to find 2 golden fleece sheep wins individual immunity.`
    : `First, wrangle your emu from a stampeding herd. Then survive a two-day race across the outback — kangaroo ambushes, overnight camps, and staggered arrivals at Hanging Rock. First tribe gets battery-powered shears, last gets rusty ones. Then bungee into a canyon full of sheep — grab one, shear it, and pray it has YOUR tribe's brand. First tribe to find all 3 of their branded sheep wins.`;
  const bungeeLabel = hd.isPostMerge ? 'Phase 3: Golden Fleece Hunt' : 'Phase 3: Brand Hunt';

  const content = `
    <div class="hd-title-wrap">
      <svg viewBox="0 0 700 160" style="max-width:600px;margin:0 auto 20px;display:block;overflow:visible">
        <!-- sun with animated glow -->
        <defs>
          <radialGradient id="hd-sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="var(--hd-gold)" stop-opacity="1"/>
            <stop offset="60%" stop-color="var(--hd-amber)" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="var(--hd-amber)" stop-opacity="0"/>
          </radialGradient>
          <filter id="hd-heat-blur"><feGaussianBlur stdDeviation="1.5"/></filter>
        </defs>
        <circle cx="580" cy="40" r="50" fill="url(#hd-sun-glow)" opacity="0.7">
          <animate attributeName="r" values="48;54;48" dur="4s" repeatCount="indefinite"/>
        </circle>
        <circle cx="580" cy="40" r="28" fill="var(--hd-amber)" opacity="0.9"/>
        <!-- hanging rock silhouette -->
        <path d="M280 160 L310 50 L340 30 L370 25 L400 35 L420 60 L440 160 Z" fill="var(--hd-deep)" opacity="0.7"/>
        <path d="M340 30 L370 25 L390 15 L380 28 L370 25" fill="var(--hd-deep)" opacity="0.5"/>
        <!-- far hills -->
        <path d="M0 140 Q80 100 160 120 Q240 95 350 115 Q450 90 550 110 Q620 100 700 130 L700 160 L0 160 Z" fill="var(--hd-dust)" opacity="0.4" filter="url(#hd-heat-blur)"/>
        <!-- near ground -->
        <path d="M0 145 Q100 135 200 142 Q350 130 500 140 Q600 132 700 145 L700 160 L0 160 Z" fill="var(--hd-earth)" opacity="0.6"/>
        <!-- animated emu silhouettes running across -->
        <g opacity="0.3">
          <g>
            <animateTransform attributeName="transform" type="translate" values="-80,0;780,0" dur="12s" repeatCount="indefinite"/>
            <circle cx="0" cy="130" r="4" fill="var(--hd-deep)"/>
            <line x1="0" y1="126" x2="0" y2="118" stroke="var(--hd-deep)" stroke-width="1.5"/>
            <circle cx="0" cy="116" r="2.5" fill="var(--hd-deep)"/>
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="-180,0;680,0" dur="14s" repeatCount="indefinite"/>
            <circle cx="0" cy="135" r="3.5" fill="var(--hd-deep)"/>
            <line x1="0" y1="131" x2="0" y2="124" stroke="var(--hd-deep)" stroke-width="1.5"/>
            <circle cx="0" cy="122" r="2" fill="var(--hd-deep)"/>
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="-40,0;740,0" dur="11s" repeatCount="indefinite"/>
            <circle cx="0" cy="128" r="3" fill="var(--hd-deep)"/>
            <line x1="0" y1="125" x2="0" y2="119" stroke="var(--hd-deep)" stroke-width="1"/>
            <circle cx="0" cy="117" r="2" fill="var(--hd-deep)"/>
          </g>
        </g>
        <!-- scrub bushes -->
        <circle cx="80" cy="148" r="6" fill="var(--hd-scrub)" opacity="0.4"/>
        <circle cx="250" cy="150" r="5" fill="var(--hd-scrub)" opacity="0.3"/>
        <circle cx="520" cy="146" r="7" fill="var(--hd-scrub)" opacity="0.35"/>
        <circle cx="650" cy="150" r="4" fill="var(--hd-scrub)" opacity="0.3"/>
      </svg>
      <div class="hd-title-main" style="animation:hd-title-enter 0.8s ease-out">Picnic at<br>Hanging Dork</div>
      <div class="hd-title-sub" style="animation:hd-title-enter 0.8s ease-out 0.2s both">${subtitleText}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;animation:hd-title-enter 0.8s ease-out 0.3s both">
        <span class="hd-live-dot"></span>
        <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--hd-danger);letter-spacing:2px;text-transform:uppercase">LIVE FROM THE OUTBACK</span>
      </div>
      <div class="hd-title-desc" style="animation:hd-title-enter 0.8s ease-out 0.4s both">${descText}</div>
      <div class="hd-title-tribes" style="animation:hd-title-enter 0.8s ease-out 0.5s both">${rosterSection}</div>
      <div class="hd-title-phases" style="animation:hd-title-enter 0.8s ease-out 0.7s both">
        <div class="hd-title-chip hd-chip-active">${_icon('emu')} Phase 1: Emu Wrangling</div>
        <div class="hd-title-chip">${_icon('emu')} Phase 2: Emu Race</div>
        <div class="hd-title-chip">${_icon('bungee')} ${bungeeLabel}</div>
      </div>
    </div>`;
  return _shell(content, ep, 'hd-title');
}

export function rpBuildHDEmuWrangling(ep) {
  const hd = ep.picnicHangingDork;
  if (!hd) return '';
  if (!hd.isPostMerge) _normTribes(hd);

  const stepMeta = [];
  let stepIdx = 0;
  let cards = '';

  cards += `<div class="hd-hud">
    <div class="hd-hud-phase">
      <span class="hd-hud-dot active"></span>
      <span class="hd-hud-dot"></span>
      <span class="hd-hud-dot"></span>
    </div>
    <span class="hd-hud-label">Phase 1: Emu Wrangling</span>
    <span class="hd-hud-clock">${_icon('emu')} CATCH YOUR RIDE</span>
  </div>`;

  if (hd.isPostMerge) {
    // ── POST-MERGE: iterate hd.players ──
    (hd.players || []).forEach(p => {
      const wrangling = p.emuWrangling;
      if (!wrangling) return;
      const wList = Array.isArray(wrangling) ? wrangling : [wrangling];

      wList.forEach(w => {
        w.events.forEach(evt => {
          const tagCls = evt.type === 'success' ? 'tag-grab' : evt.type === 'fail' ? 'tag-fail'
            : evt.type === 'help' ? 'tag-social' : evt.type === 'comedy' ? 'tag-dingo' : 'tag-wrangle';
          const tagLabel = evt.type === 'approach' ? 'APPROACH' : evt.type === 'success' ? 'CAUGHT!'
            : evt.type === 'fail' ? 'MISS' : evt.type === 'help' ? 'TEAMMATE HELP' : 'COMEDY';

          cards += `<div class="hd-card hd-wrangle-attempt" id="hd-step-wrangle-${stepIdx}">
            <div class="hd-card-head">
              ${portrait(w.player, 24)}
              <span class="hd-card-who">${w.player}</span>
              <span class="hd-card-tag ${tagCls}">${tagLabel}</span>
            </div>
            <div class="hd-card-body">${evt.text}</div>
            ${evt.type === 'success' ? `<div class="hd-card-foot" style="color:var(--hd-cyan)">Emu Quality: ${w.emuQuality}/10 ${w.attempts > 1 ? `(${w.attempts} attempts)` : '(first try!)'}</div>` : ''}
          </div>`;
          stepMeta.push({ type: evt.type, player: w.player });
          stepIdx++;
        });
      });
    });
  } else {
    // ── PRE-MERGE: tribe-grouped wrangling (original) ──
    hd.tribes.forEach(tribe => {
      if (!tribe.emuWrangling?.length) return;

      cards += `<div class="hd-card" id="hd-step-wrangle-${stepIdx}" style="border-left:4px solid ${tribe.color}">
        <div class="hd-card-head">
          <span class="hd-card-tag" style="background:${tribe.color};color:var(--hd-deep)">${tribe.tribeName}</span>
        </div>
        <div class="hd-card-body" style="font-family:'Anton',sans-serif;font-size:16px;color:var(--hd-amber)">${(tribe.tribeName || '???').toUpperCase()} — EMU WRANGLING</div>
      </div>`;
      stepMeta.push({ type: 'tribe-header', tribeName: tribe.tribeName });
      stepIdx++;

      tribe.emuWrangling.forEach(w => {
        w.events.forEach(evt => {
          const tagCls = evt.type === 'success' ? 'tag-grab' : evt.type === 'fail' ? 'tag-fail'
            : evt.type === 'help' ? 'tag-social' : evt.type === 'comedy' ? 'tag-dingo' : 'tag-wrangle';
          const tagLabel = evt.type === 'approach' ? 'APPROACH' : evt.type === 'success' ? 'CAUGHT!'
            : evt.type === 'fail' ? 'MISS' : evt.type === 'help' ? 'TEAMMATE HELP' : 'COMEDY';

          cards += `<div class="hd-card hd-wrangle-attempt" id="hd-step-wrangle-${stepIdx}">
            <div class="hd-card-head">
              ${portrait(w.player, 24)}
              <span class="hd-card-who">${w.player}</span>
              <span class="hd-card-tag ${tagCls}">${tagLabel}</span>
            </div>
            <div class="hd-card-body">${evt.text}</div>
            ${evt.type === 'success' ? `<div class="hd-card-foot" style="color:var(--hd-cyan)">Emu Quality: ${w.emuQuality}/10 ${w.attempts > 1 ? `(${w.attempts} attempts)` : '(first try!)'}</div>` : ''}
          </div>`;
          stepMeta.push({ type: evt.type, player: w.player, tribeName: tribe.tribeName });
          stepIdx++;
        });
      });
    });
  }

  window._hdWrangleStepMeta = stepMeta;

  const totalSteps = stepIdx;
  cards += `<div class="hd-controls-bar" id="hd-controls-wrangle">
    <button class="hd-btn" onclick="hdRevealNext('hd-wrangle',${totalSteps})">NEXT</button>
    <span class="hd-counter-display" id="hd-counter-wrangle">0 / ${totalSteps}</span>
    <button class="hd-btn" onclick="hdRevealAll('hd-wrangle',${totalSteps})">ALL</button>
  </div>`;

  return _shell(cards, ep, 'hd-wrangle');
}

export function rpBuildHDEmuRace(ep) {
  const hd = ep.picnicHangingDork;
  if (!hd) return '';
  if (!hd.isPostMerge) _normTribes(hd);

  const stepMeta = [];
  let stepIdx = 0;
  let cards = '';
  let commIdx = 0;
  const usedComms = new Set();

  // HUD bar
  cards += `<div class="hd-hud">
    <div class="hd-hud-phase">
      <span class="hd-hud-dot"></span>
      <span class="hd-hud-dot active"></span>
      <span class="hd-hud-dot"></span>
    </div>
    <span class="hd-hud-label">Phase 2: Emu Race</span>
    <span class="hd-hud-clock">${_icon('clock')} LIVE</span>
  </div>`;

  // emu track visualization
  const trackHeight = hd.isPostMerge ? Math.max(80, 10 + (hd.players?.length || 0) * 22 + 10) : 80;
  cards += `<div class="hd-track" style="${trackHeight !== 80 ? `height:${trackHeight}px` : ''}">`;
  cards += `<div class="hd-track-start"></div>`;
  cards += `<div class="hd-track-finish"></div>`;
  for (let s = 0; s < 4; s++) {
    cards += `<div class="hd-track-seg" style="left:${s * 25}%;width:25%">${SEG_NAMES[s]}</div>`;
  }
  if (hd.isPostMerge) {
    (hd.players || []).forEach((p, idx) => {
      const yOff = 10 + idx * 22;
      const slug = players.find(x => x.name === p.name)?.slug;
      const imgTag = slug
        ? `<img src="assets/avatars/${slug}.png" style="width:18px;height:18px;border-radius:50%;object-fit:cover" onerror="this.outerHTML='${p.name.substring(0,2)}'" alt="${p.name}">`
        : p.name.substring(0, 2);
      cards += `<div class="hd-track-runner" id="hd-runner-${idx}" style="left:3%;top:${yOff}px;background:var(--hd-amber);width:20px;height:20px;font-size:7px;overflow:hidden;padding:0;display:flex;align-items:center;justify-content:center">
        ${imgTag}
      </div>`;
    });
  } else {
    hd.tribes.forEach((tribe, idx) => {
      const yOff = 12 + idx * 22;
      cards += `<div class="hd-track-runner" id="hd-runner-${idx}" style="left:3%;top:${yOff}px;background:${tribe.color}">
        ${(tribe.tribeName || tribe.name || '??').substring(0, 2)}
      </div>`;
    });
  }
  cards += `</div>`;

  // build track snapshots for live updates
  const trackSnapshots = [];

  // segment-by-segment cards
  for (let segIdx = 0; segIdx < 4; segIdx++) {
    // segment header
    cards += `<div class="hd-card" id="hd-step-race-${stepIdx}">
      <div class="hd-card-head">
        <span class="hd-card-tag tag-emu">Segment ${segIdx + 1}</span>
        <span class="hd-card-who">${SEG_NAMES[segIdx]}</span>
      </div>
      <div class="hd-card-icon">${_icon('emu')}</div>
      <div class="hd-card-body" style="font-family:'Anton',sans-serif;font-size:18px;letter-spacing:2px;color:var(--hd-amber)">
        ${SEG_NAMES[segIdx].toUpperCase()}
      </div>
    </div>`;
    stepMeta.push({ type: 'seg-header', segIdx });
    trackSnapshots[stepIdx] = stepIdx > 0 && trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
    stepIdx++;

    if (hd.isPostMerge) {
      // ── POST-MERGE: per-player segment results ──
      (hd.players || []).forEach(p => {
        const segs = p.emuSegments || [];
        const seg = segs[segIdx];
        if (!seg) return;

        const segTime = (seg.time && !isNaN(seg.time)) ? seg.time : BASE_SEG_TIME;
        const isGood = segTime < BASE_SEG_TIME * 0.85;
        const narration = isGood ? pick(SEG_GOOD)(p.name) : pick(SEG_BAD)(p.name);
        const momLabel = seg.momentum > 0 ? `${_icon('mom-up')} <span style="color:var(--hd-cyan);font-size:10px">MOMENTUM +${seg.momentum}</span>` :
          seg.momentum < 0 ? `${_icon('mom-down')} <span style="color:var(--hd-danger);font-size:10px">DRAG ${seg.momentum}</span>` : '';

        cards += `<div class="hd-card" id="hd-step-race-${stepIdx}">
          <div class="hd-card-head">
            ${portrait(p.name, 22)}
            <span class="hd-card-who">${p.name}</span>
            <span class="hd-card-tag tag-emu" style="background:var(--hd-amber);color:var(--hd-deep)">${_icon('clock')} ${segTime.toFixed(1)}s</span>
            ${momLabel}
          </div>
          <div class="hd-card-body">${narration}</div>
        </div>`;
        stepMeta.push({
          type: 'seg-player', player: p.name, segIdx,
          segName: SEG_NAMES[segIdx], segTime: segTime, momentum: seg.momentum || 0,
        });

        // track snapshot — store segment index + segment time for map placement
        const prevSnap = stepIdx > 0 && trackSnapshots[stepIdx - 1] ? JSON.parse(JSON.stringify(trackSnapshots[stepIdx - 1])) : {};
        prevSnap[p.name] = { seg: segIdx, segTime };
        trackSnapshots[stepIdx] = prevSnap;

        stepIdx++;

        // per-player events in this segment
        (seg.events || []).forEach(evt => {
          const isPositive = (evt.timeDelta || 0) < 0;
          const tagCls = isPositive ? 'tag-grab' : evt.type === 'dust' ? 'tag-dingo' : 'tag-emu';
          const tagLabel = evt.type === 'surge' ? 'SURGE' : evt.type === 'save' ? 'SAVE' : evt.type === 'bond' ? 'SYNERGY' : evt.type === 'dust' ? 'BLINDED' : evt.type.toUpperCase();
          cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="margin-left:16px;border-left:3px solid var(--hd-amber)">
            <div class="hd-card-head">
              ${portrait(evt.player, 22)}
              <span class="hd-card-who">${evt.player}</span>
              <span class="hd-card-tag ${tagCls}">${tagLabel}</span>
            </div>
            <div class="hd-card-body">${evt.text}</div>
            ${evt.timeDelta ? `<div class="hd-card-foot" style="color:${(evt.timeDelta > 0) ? 'var(--hd-danger)' : 'var(--hd-cyan)'}">${evt.timeDelta > 0 ? '+' : ''}${evt.timeDelta.toFixed(1)}s</div>` : ''}
          </div>`;
          stepMeta.push({ type: 'member-event', player: evt.player, evtType: evt.type, timeDelta: evt.timeDelta || 0 });
          trackSnapshots[stepIdx] = { ...(trackSnapshots[stepIdx - 1] || {}) };
          stepIdx++;
        });
      });
    } else {
      // ── PRE-MERGE: per-tribe segment results (original) ──
      hd.tribes.forEach(tribe => {
        const seg = tribe.emuSegments[segIdx];
        if (!seg) return;

        const segTime = (seg.time && !isNaN(seg.time)) ? seg.time : BASE_SEG_TIME;
        const isGood = segTime < BASE_SEG_TIME * 0.85;
        const narration = isGood ? pick(SEG_GOOD)(tribe.tribeName) : pick(SEG_BAD)(tribe.tribeName);
        const momLabel = seg.momentum > 0 ? `${_icon('mom-up')} <span style="color:var(--hd-cyan);font-size:10px">MOMENTUM +${seg.momentum}</span>` :
          seg.momentum < 0 ? `${_icon('mom-down')} <span style="color:var(--hd-danger);font-size:10px">DRAG ${seg.momentum}</span>` : '';

        cards += `<div class="hd-card" id="hd-step-race-${stepIdx}">
          <div class="hd-card-head">
            <span class="hd-sb-tribe-dot" style="background:${tribe.color};width:10px;height:10px"></span>
            <span class="hd-card-tag" style="background:${tribe.color};color:var(--hd-deep)">${tribe.tribeName}</span>
            <span class="hd-card-who">${_icon('clock')} ${segTime.toFixed(1)}s</span>
            ${momLabel}
          </div>
          <div class="hd-card-body">${narration}</div>
          <div class="hd-card-foot" style="font-size:10px;opacity:0.5">${tribe.members.map(m => portrait(m, 16)).join(' ')}</div>
        </div>`;
        stepMeta.push({
          type: 'seg-tribe', tribeName: tribe.tribeName, segIdx,
          segName: SEG_NAMES[segIdx], segTime: segTime, momentum: seg.momentum || 0,
        });

        // track snapshot — store segment index + segment time for map placement
        const prevSnap = stepIdx > 0 && trackSnapshots[stepIdx - 1] ? JSON.parse(JSON.stringify(trackSnapshots[stepIdx - 1])) : {};
        prevSnap[tribe.tribeName] = { seg: segIdx, segTime };
        trackSnapshots[stepIdx] = prevSnap;

        stepIdx++;

        // per-member events for this tribe in this segment — show ALL events
        seg.events.forEach(evt => {
          const isPositive = (evt.timeDelta || 0) < 0;
          const tagCls = isPositive ? 'tag-grab' : evt.type === 'dust' ? 'tag-dingo' : 'tag-emu';
          const tagLabel = evt.type === 'surge' ? 'SURGE' : evt.type === 'save' ? 'SAVE' : evt.type === 'bond' ? 'SYNERGY' : evt.type === 'dust' ? 'BLINDED' : evt.type.toUpperCase();
          cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="margin-left:16px;border-left:3px solid ${tribe.color}">
            <div class="hd-card-head">
              ${portrait(evt.player, 22)}
              <span class="hd-card-who">${evt.player}</span>
              <span class="hd-card-tag ${tagCls}">${tagLabel}</span>
            </div>
            <div class="hd-card-body">${evt.text}</div>
            ${evt.timeDelta ? `<div class="hd-card-foot" style="color:${(evt.timeDelta > 0) ? 'var(--hd-danger)' : 'var(--hd-cyan)'}">${evt.timeDelta > 0 ? '+' : ''}${evt.timeDelta.toFixed(1)}s</div>` : ''}
          </div>`;
          stepMeta.push({ type: 'member-event', player: evt.player, tribeName: tribe.tribeName, evtType: evt.type, timeDelta: evt.timeDelta || 0 });
          trackSnapshots[stepIdx] = { ...(trackSnapshots[stepIdx - 1] || {}) };
          stepIdx++;
        });
      });
    }

    // comm chatter
    if (segIdx < 3) {
      let comm;
      do { comm = pick(COMM_RACE); } while (usedComms.has(comm) && usedComms.size < COMM_RACE.length);
      usedComms.add(comm);
      cards += `<div class="hd-card hd-comm" id="hd-step-race-${stepIdx}">${comm}</div>`;
      stepMeta.push({ type: 'comm' });
      trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
      stepIdx++;
    }

    // social events after this segment
    const segSocial = (hd.socialEvents || []).filter(e => e.afterSegment === segIdx);
    segSocial.forEach(se => {
      const tagType = se.type === 'flirt' ? 'tag-social' : se.type === 'emu-clash' ? 'tag-emu' : 'tag-social';
      cards += `<div class="hd-card hd-card-social" id="hd-step-race-${stepIdx}">
        <div class="hd-card-head">
          <span class="hd-card-tag ${tagType}">${se.type.replace('-', ' ')}</span>
          <span class="hd-card-who">${se.actor} → ${se.target}</span>
        </div>
        <div class="hd-card-icon">
          ${portrait(se.actor, 28)} ${portrait(se.target, 28)}
        </div>
        <div class="hd-card-body">${se.narrative}</div>
        ${se.timePenalty > 0 ? `<div class="hd-card-foot">+${se.timePenalty.toFixed(1)}s penalty${se.targetTribe ? ` → ${se.targetTribe}` : ''}</div>` : ''}
      </div>`;
      stepMeta.push({ type: 'social', socialType: se.type, actor: se.actor, target: se.target });
      trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
      stepIdx++;

      // counter-reaction card
      if (se.counterReaction) {
        cards += `<div class="hd-card hd-card-counter" id="hd-step-race-${stepIdx}">
          <div class="hd-card-head">
            ${portrait(se.counterReaction.player, 24)}
            <span class="hd-card-tag tag-social">counter</span>
            <span class="hd-card-who">${se.counterReaction.player}</span>
          </div>
          <div class="hd-card-body">${se.counterReaction.narrative}</div>
          <div class="hd-card-foot">BOND +${se.counterReaction.bondBoost} with ${se.target}</div>
        </div>`;
        stepMeta.push({ type: 'counter' });
        trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
        stepIdx++;
      }
    });

      // kangaroo encounters after this segment
      const segKangaroos = (hd.kangarooEvents || []).filter(ke => ke.afterSegment === segIdx);
      segKangaroos.forEach(ke => {
        const isPouch = ke.type === 'pouch';
        const isBlock = ke.type === 'block';
        const tagLabel = isPouch ? 'POUCH RIDE' : isBlock ? 'TRAIL BLOCK' : 'KANGAROO KICK';
        const tagCls = isPouch ? 'tag-grab' : 'tag-kangaroo';
        cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="border-left:3px solid var(--hd-dust)">
          <div class="hd-card-head">
            ${_icon('kangaroo')} ${portrait(ke.player, 22)}
            <span class="hd-card-who">${ke.player}</span>
            <span class="hd-card-tag ${tagCls}">${tagLabel}</span>
          </div>
          <div class="hd-card-body">${ke.narrative}</div>
          <div class="hd-card-foot" style="color:${isPouch ? 'var(--hd-cyan)' : 'var(--hd-danger)'}">
            ${isPouch ? `-${Math.abs(ke.timeDelta).toFixed(1)}s bonus` : `+${Math.abs(ke.timeDelta).toFixed(1)}s penalty${ke.tribe ? ` → ${ke.tribe}` : ''}`}
          </div>
        </div>`;
        stepMeta.push({ type: 'kangaroo', player: ke.player, kangarooType: ke.type });
        trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
        stepIdx++;
      });

      // overnight camp after segment 1
      if (segIdx === 1 && hd.overnightEvents?.length) {
        cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="background:rgba(42,26,74,0.3);border:1px solid rgba(232,166,74,0.3)">
          <div class="hd-card-head">
            ${_icon('moon')}
            <span class="hd-card-tag tag-overnight">OVERNIGHT CAMP</span>
            <span class="hd-card-who">Night falls on the outback...</span>
          </div>
          <div class="hd-card-body" style="font-family:'Anton',sans-serif;font-size:16px;color:var(--hd-amber)">THE TWO-DAY JOURNEY</div>
        </div>`;
        stepMeta.push({ type: 'overnight-header' });
        trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
        stepIdx++;

        hd.overnightEvents.forEach(oe => {
          const tagLabel = oe.type === 'camp' ? 'CAMP' : oe.type === 'snore' ? 'SNORING' : oe.type === 'confrontation' ? 'TENSION' : 'BONDING';
          const tagCls = oe.type === 'confrontation' ? 'tag-fail' : oe.type === 'bond' ? 'tag-grab' : 'tag-overnight';
          const hasPlayer = oe.player || oe.actor;
          cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="border-left:3px dashed rgba(232,166,74,0.4)">
            <div class="hd-card-head">
              ${hasPlayer ? portrait(hasPlayer, 22) : _icon('moon')}
              ${oe.target ? portrait(oe.target, 22) : ''}
              <span class="hd-card-tag ${tagCls}">${tagLabel}</span>
              <span class="hd-card-who">${oe.tribe || ''}</span>
            </div>
            <div class="hd-card-body">${oe.narrative}</div>
          </div>`;
          stepMeta.push({ type: 'overnight', overnightType: oe.type });
          trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
          stepIdx++;
        });

        cards += `<div class="hd-card hd-comm" id="hd-step-race-${stepIdx}">${pick(HOST_WAITING)}</div>`;
        stepMeta.push({ type: 'comm' });
        trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
        stepIdx++;
      }
  }

  // ── STAGGERED ARRIVALS ──
  cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="border:2px solid var(--hd-amber)">
    <div class="hd-card-head">
      ${_icon('flag')}
      <span class="hd-card-tag tag-arrival">ARRIVALS AT HANGING ROCK</span>
    </div>
    <div class="hd-card-body" style="font-family:'Anton',sans-serif;font-size:18px;color:var(--hd-amber)">STAGGERED FINISH</div>
  </div>`;
  stepMeta.push({ type: 'arrival-header' });
  trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
  stepIdx++;

  const allArrivals = [];
  if (hd.isPostMerge) {
    // ── POST-MERGE: arrivals from hd.players sorted by arrivalOrder ──
    (hd.players || []).forEach(p => {
      if (p.arrivalOrder != null) {
        allArrivals.push({ player: p.name, arrivalTime: p.totalRaceTime || 0, arrivalOrder: p.arrivalOrder });
      }
    });
    allArrivals.sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));
  } else {
    // ── PRE-MERGE: arrivals from tribe data (original) ──
    hd.tribes.forEach(tribe => {
      if (!tribe.arrivalOrder?.length) return;
      tribe.arrivalOrder.forEach(ar => {
        allArrivals.push({ ...ar, tribeName: tribe.tribeName, color: tribe.color });
      });
    });
    allArrivals.sort((a, b) => (a.arrivalTime || 0) - (b.arrivalTime || 0));
  }

  allArrivals.forEach((ar, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === allArrivals.length - 1;
    const narration = ar.kangarooPouch ? pick(ARRIVAL_KANGAROO)(ar.player)
      : isFirst ? pick(ARRIVAL_FIRST)(ar.player)
      : isLast ? pick(ARRIVAL_LAST)(ar.player)
      : pick(ARRIVAL_MID)(ar.player);
    const borderColor = ar.color || 'var(--hd-amber)';

    cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="border-left:3px solid ${borderColor}">
      <div class="hd-card-head">
        ${portrait(ar.player, 24)}
        <span class="hd-card-who">${ar.player}</span>
        <span class="hd-card-tag tag-arrival">#${idx + 1}</span>
        <span style="font-family:'DM Mono',monospace;font-size:10px;opacity:0.6">${(ar.arrivalTime ?? 0).toFixed(1)}s</span>
      </div>
      <div class="hd-card-body">${narration}</div>
    </div>`;
    stepMeta.push({ type: 'arrival', player: ar.player, arrivalTime: ar.arrivalTime });
    trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
    if (hd.isPostMerge) {
      (hd.players || []).forEach(p => { trackSnapshots[stepIdx][p.name] = 1; });
    } else {
      hd.tribes.forEach(t => { trackSnapshots[stepIdx][t.tribeName] = 1; });
    }
    stepIdx++;
  });

  // shearing advantage announcement
  cards += `<div class="hd-card" id="hd-step-race-${stepIdx}" style="border:2px solid var(--hd-gold);background:rgba(255,217,60,0.08)">
    <div class="hd-card-head">
      ${_icon('shears')}
      <span class="hd-card-tag tag-shears">SHEARING ADVANTAGE</span>
    </div>
    <div class="hd-card-body">`;
  if (hd.isPostMerge) {
    // ── POST-MERGE: per-player shearing advantage (sorted: powered → standard → rusty) ──
    const advOrder = { powered: 0, standard: 1, rusty: 2 };
    const sorted = (hd.players || []).slice().sort((a, b) => (advOrder[a.shearAdvantage] || 1) - (advOrder[b.shearAdvantage] || 1));
    sorted.forEach(p => {
      const adv = p.shearAdvantage || 'standard';
      const advNarr = adv === 'powered' ? pick(SHEAR_POWERED)(p.name)
        : adv === 'rusty' ? pick(SHEAR_RUSTY)(p.name) : pick(SHEAR_STANDARD)(p.name);
      const advColor = adv === 'powered' ? 'var(--hd-cyan)' : adv === 'rusty' ? 'var(--hd-danger)' : 'var(--hd-sand)';
      cards += `<div style="margin:6px 0;padding:4px 8px;border-left:3px solid ${advColor}">
        ${portrait(p.name, 18)}
        <span style="color:${advColor};font-family:'DM Mono',monospace;font-size:11px;margin-left:6px">${adv.toUpperCase()}</span>
        <span style="margin-left:8px">${advNarr}</span>
      </div>`;
    });
  } else {
    // ── PRE-MERGE: per-tribe shearing advantage (original) ──
    hd.tribes.forEach(tribe => {
      const adv = tribe.shearAdvantage || 'standard';
      const advNarr = adv === 'powered' ? pick(SHEAR_POWERED)(tribe.tribeName)
        : adv === 'rusty' ? pick(SHEAR_RUSTY)(tribe.tribeName) : pick(SHEAR_STANDARD)(tribe.tribeName);
      const advColor = adv === 'powered' ? 'var(--hd-cyan)' : adv === 'rusty' ? 'var(--hd-danger)' : 'var(--hd-sand)';
      cards += `<div style="margin:6px 0;padding:4px 8px;border-left:3px solid ${advColor}">
        <span style="color:${advColor};font-family:'DM Mono',monospace;font-size:11px">${adv.toUpperCase()}</span>
        <span style="margin-left:8px">${advNarr}</span>
      </div>`;
    });
  }
  cards += `</div></div>`;
  stepMeta.push({ type: 'shear-advantage' });
  trackSnapshots[stepIdx] = trackSnapshots[stepIdx - 1] ? { ...trackSnapshots[stepIdx - 1] } : {};
  stepIdx++;

  // fill in track snapshots for missing indices
  for (let i = 0; i < stepIdx; i++) {
    if (!trackSnapshots[i]) {
      trackSnapshots[i] = i > 0 ? { ...(trackSnapshots[i - 1] || {}) } : {};
      if (hd.isPostMerge) {
        (hd.players || []).forEach(p => { if (!trackSnapshots[i][p.name]) trackSnapshots[i][p.name] = 0; });
      } else {
        hd.tribes.forEach(t => { if (!trackSnapshots[i][t.tribeName]) trackSnapshots[i][t.tribeName] = 0; });
      }
    }
  }

  window._hdRaceStepMeta = stepMeta;
  window._hdTrackSnapshots = trackSnapshots;

  const totalSteps = stepIdx;
  cards += `<div class="hd-controls-bar" id="hd-controls-race">
    <button class="hd-btn" onclick="hdRevealNext('hd-race',${totalSteps})">NEXT</button>
    <span class="hd-counter-display" id="hd-counter-race">0 / ${totalSteps}</span>
    <button class="hd-btn" onclick="hdRevealAll('hd-race',${totalSteps})">ALL</button>
  </div>`;

  return _shell(cards, ep, 'hd-race');
}

export function rpBuildHDBungeeGrab(ep) {
  const hd = ep.picnicHangingDork;
  if (!hd) return '';
  if (!hd.isPostMerge) _normTribes(hd);

  const stepMeta = [];
  let stepIdx = 0;
  let cards = '';
  const usedComms = new Set();
  const rounds = hd.bungeeRounds || [];
  const phaseLabel = hd.isPostMerge ? 'Phase 3: Golden Fleece Hunt' : 'Phase 3: Bungee Brand Hunt';
  const sheepPoolSize = hd.isPostMerge ? ((hd.players || []).length * 3 + 5) : (hd.tribes.length * 5 + 2);

  // HUD
  cards += `<div class="hd-hud">
    <div class="hd-hud-phase">
      <span class="hd-hud-dot"></span>
      <span class="hd-hud-dot"></span>
      <span class="hd-hud-dot active"></span>
    </div>
    <span class="hd-hud-label">${phaseLabel}</span>
    <span class="hd-hud-clock">${_icon('clock')} LIVE</span>
  </div>`;

  if (hd.isPostMerge) {
    // ── POST-MERGE: per-player shear tools (top arrivals only) ──
    const topPlayers = (hd.players || []).filter(p => p.shearAdvantage && p.shearAdvantage !== 'standard').slice(0, 3);
    if (topPlayers.length > 0) {
      cards += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">`;
      topPlayers.forEach(p => {
        const adv = p.shearAdvantage;
        const advColor = adv === 'powered' ? 'var(--hd-cyan)' : adv === 'rusty' ? 'var(--hd-danger)' : 'var(--hd-sand)';
        const advLabel = adv === 'powered' ? 'POWERED SHEARS (1.3x)' : adv === 'rusty' ? 'RUSTY SHEARS (0.7x)' : 'STANDARD SHEARS';
        cards += `<div style="flex:1;min-width:120px;padding:6px 10px;background:var(--hd-glass);border-left:3px solid var(--hd-amber);border-radius:4px">
          <div style="font-size:10px;opacity:0.6">${portrait(p.name, 16)} ${p.name.split(' ')[0]}</div>
          <div style="font-family:'DM Mono',monospace;font-size:10px;color:${advColor}">${_icon('shears')} ${advLabel}</div>
        </div>`;
      });
      cards += `</div>`;
    }

    // Golden fleece tracking handled by live-updating sidebar — no static spoiler here
  } else {
    // ── PRE-MERGE: per-tribe shear tools + brand tracker (original) ──
    cards += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">`;
    hd.tribes.forEach(tribe => {
      const adv = tribe.shearAdvantage || 'standard';
      const advColor = adv === 'powered' ? 'var(--hd-cyan)' : adv === 'rusty' ? 'var(--hd-danger)' : 'var(--hd-sand)';
      const advLabel = adv === 'powered' ? 'POWERED SHEARS (1.3x)' : adv === 'rusty' ? 'RUSTY SHEARS (0.7x)' : 'STANDARD SHEARS';
      cards += `<div style="flex:1;min-width:120px;padding:6px 10px;background:var(--hd-glass);border-left:3px solid ${tribe.color};border-radius:4px">
        <div style="font-size:10px;opacity:0.6">${tribe.tribeName}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:${advColor}">${_icon('shears')} ${advLabel}</div>
      </div>`;
    });
    cards += `</div>`;

    // Brand tracker at top
    cards += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding:10px;background:rgba(255,217,60,0.06);border:1px solid var(--hd-gb);border-radius:8px" id="hd-brand-tracker">`;
    hd.tribes.forEach(tribe => {
      const bf = tribe.brandsFound || 0;
      const stars = Array.from({length: 3}, (_, i) => i < bf
        ? `<span style="color:var(--hd-gold);font-size:14px">${_icon('brand')}</span>`
        : `<span style="opacity:0.2;font-size:14px">${_icon('brand')}</span>`
      ).join('');
      cards += `<div style="flex:1;min-width:100px;text-align:center">
        <div style="font-family:'DM Mono',monospace;font-size:10px;opacity:0.6;margin-bottom:4px"><span class="hd-sb-tribe-dot" style="background:${tribe.color};display:inline-block"></span> ${tribe.tribeName}</div>
        <div>${stars}</div>
        <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--hd-amber)">${bf}/3</div>
      </div>`;
    });
    cards += `</div>`;
  }

  // canyon visualization
  cards += `<div class="hd-canyon">
    <div class="hd-canyon-wall-l"></div>
    <div class="hd-canyon-wall-r"></div>
    <div class="hd-canyon-cord"></div>
    <div class="hd-canyon-label">${hd.isPostMerge ? 'Golden Fleece Canyon' : 'Brand Hunt Canyon'}</div>
    <div class="hd-canyon-jumper" id="hd-canyon-jumper">
      <div class="hd-canyon-jumper-cord" id="hd-cj-cord"></div>
      <div class="hd-canyon-jumper-icon" id="hd-cj-icon"></div>
      <div class="hd-canyon-jumper-grab" id="hd-cj-grab">${_icon('sheep')}</div>
      <div class="hd-canyon-jumper-name" id="hd-cj-name"></div>
    </div>
    <div class="hd-canyon-floor"></div>
    <div class="hd-canyon-sheep" id="hd-canyon-flock">
      ${[0,1,2,3,4,5].map((_, i) => `<div class="hd-flock-sheep" id="hd-flock-${i}" style="animation:hd-sheep-wander ${3+i*0.7}s ease-in-out infinite alternate;animation-delay:${i*0.4}s">${_icon('sheep')}</div>`).join('')}
    </div>
    <div class="hd-canyon-sheep-count" id="hd-canyon-count">${_icon('sheep')} ${sheepPoolSize} sheep left</div>
  </div>`;

  // Process round-by-round
  rounds.forEach((roundData, rIdx) => {
    // Round header
    cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}" style="border:2px solid var(--hd-amber);background:rgba(232,198,104,0.06)">
      <div class="hd-card-head">
        ${_icon('bungee')}
        <span class="hd-card-tag tag-emu">ROUND ${roundData.round}</span>
      </div>
      <div class="hd-card-body" style="font-family:'Anton',sans-serif;font-size:16px;color:var(--hd-amber)">${pick(ROUND_ANNOUNCE)(roundData.round)}</div>
    </div>`;
    stepMeta.push({ type: 'round', round: roundData.round });
    stepIdx++;

    // Each jump in order
    roundData.jumps.forEach(jump => {
      const tribeObj = hd.isPostMerge ? null : (hd.tribes || []).find(t => t.tribeName === jump.tribeName);
      const tribeColor = tribeObj?.color || 'var(--hd-amber)';
      const tribeBadge = hd.isPostMerge
        ? '' : `<span class="hd-card-tag" style="background:${tribeColor};color:var(--hd-deep)">${jump.tribeName}</span>`;

      // Jump card
      cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}" style="border-left:3px solid ${tribeColor}">
        <div class="hd-card-head">
          ${portrait(jump.player, 26)}
          ${tribeBadge}
          <span class="hd-card-who">${jump.player}</span>
          <span class="hd-card-tag tag-grab">${(jump.approach || 'normal').toUpperCase()}</span>
        </div>
        <div class="hd-card-icon">${_icon('bungee')}</div>
        <div class="hd-card-body">${pick(BUNGEE_JUMP)(jump.player)}</div>
      </div>`;
      stepMeta.push({ type: 'jump', tribeName: jump.tribeName, player: jump.player, round: roundData.round });
      stepIdx++;

      // Chaos event card (before grab result)
      if (jump.chaosType === 'no-cord') {
        cards += `<div class="hd-card hd-card-dingo" id="hd-step-bungee-${stepIdx}" style="border:3px solid var(--hd-danger);background:rgba(239,68,68,0.12)">
          <div class="hd-card-head">
            ${portrait(jump.player, 24)}
            <span class="hd-card-tag tag-dingo">NO CORD!</span>
            <span class="hd-card-who">${jump.player}</span>
          </div>
          <div class="hd-card-body">${pick(CHAOS_NO_CORD)(jump.player)}</div>
          <div class="hd-card-foot" style="color:var(--hd-danger)">OUT OF CHALLENGE</div>
        </div>`;
        stepMeta.push({ type: 'chaos', chaosType: 'no-cord', tribeName: jump.tribeName, player: jump.player });
        stepIdx++;
      } else if (jump.chaosType === 'tangle' && jump.chaosData?.partner) {
        cards += `<div class="hd-card hd-card-dingo" id="hd-step-bungee-${stepIdx}">
          <div class="hd-card-head">
            ${portrait(jump.player, 22)} ${portrait(jump.chaosData.partner, 22)}
            <span class="hd-card-tag tag-dingo">TANGLED!</span>
          </div>
          <div class="hd-card-body">${pick(CHAOS_TANGLE)(jump.player, jump.chaosData.partner)}</div>
          <div class="hd-card-foot" style="color:var(--hd-danger)">Both miss this round</div>
        </div>`;
        stepMeta.push({ type: 'chaos', chaosType: 'tangle', tribeName: jump.tribeName, player: jump.player });
        stepIdx++;
      } else if (jump.chaosType === 'dingo-grab') {
        cards += `<div class="hd-card hd-card-dingo" id="hd-step-bungee-${stepIdx}">
          <div class="hd-card-head">
            ${_icon('dingo')} ${portrait(jump.player, 22)}
            <span class="hd-card-tag tag-dingo">GRABBED A DINGO!</span>
          </div>
          <div class="hd-card-body">${pick(CHAOS_DINGO_GRAB)(jump.player)}</div>
          <div class="hd-card-foot" style="color:${jump.chaosData?.foughtOff ? 'var(--hd-cyan)' : 'var(--hd-danger)'}">${jump.chaosData?.foughtOff ? 'Fought it off!' : 'Mauled. No sheep.'}</div>
        </div>`;
        stepMeta.push({ type: 'chaos', chaosType: 'dingo-grab', tribeName: jump.tribeName, player: jump.player });
        stepIdx++;
      } else if (jump.chaosType === 'thrown' && jump.chaosData?.thrower) {
        cards += `<div class="hd-card hd-card-social" id="hd-step-bungee-${stepIdx}" style="border:2px dashed var(--hd-danger)">
          <div class="hd-card-head">
            ${portrait(jump.chaosData.thrower, 22)} → ${portrait(jump.player, 22)}
            <span class="hd-card-tag tag-dingo">SABOTAGE!</span>
          </div>
          <div class="hd-card-body">${pick(CHAOS_THROWN)(jump.chaosData.thrower, jump.player)}</div>
          <div class="hd-card-foot" style="color:var(--hd-danger)">BOND -1 | POP -1 for ${jump.chaosData.thrower}</div>
        </div>`;
        stepMeta.push({ type: 'chaos', chaosType: 'thrown', tribeName: jump.tribeName, player: jump.player, thrower: jump.chaosData.thrower });
        stepIdx++;
      }

      // Grab result (only if not incapacitated by chaos)
      if (jump.chaosType !== 'no-cord' && jump.chaosType !== 'tangle' && jump.chaosType !== 'dingo-grab') {
        if (jump.grabSuccess) {
          const grabNarr = pick(BUNGEE_GRAB_WIN)(jump.player);
          cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}">
            <div class="hd-card-head">
              ${portrait(jump.player, 22)}
              <span class="hd-card-tag tag-grab">GRABBED!</span>
              <span class="hd-card-who">${_icon('sheep')} sheep secured</span>
            </div>
            <div class="hd-card-body">${grabNarr}</div>
          </div>`;
          stepMeta.push({ type: 'grab', tribeName: jump.tribeName, player: jump.player, grabSuccess: true });
          stepIdx++;

          // Shearing + brand reveal — THE BIG MOMENT
          const shearNarr = pick(BUNGEE_SHEAR)(jump.player);
          cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}">
            <div class="hd-card-head">
              ${_icon('shears')} ${portrait(jump.player, 22)}
              <span class="hd-card-tag tag-grab">SHEARING</span>
            </div>
            <div class="hd-card-body">${shearNarr}</div>
            <div class="hd-card-foot">${_icon('wool')} ${jump.woolFinal} wool</div>
          </div>`;
          stepMeta.push({ type: 'shear', tribeName: jump.tribeName, player: jump.player, woolFinal: jump.woolFinal });
          stepIdx++;

          // BRAND REVEAL CARD
          const brandLabel = hd.isPostMerge ? 'GOLDEN FLEECE!' : 'BRAND FOUND!';
          if (jump.isOwnBrand) {
            // FOUND OWN BRAND / GOLDEN FLEECE — golden confetti card
            cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}" style="border:3px solid var(--hd-gold);background:rgba(255,217,60,0.15);box-shadow:0 0 20px rgba(255,217,60,0.2);animation:hd-shake 0.5s">
              <div class="hd-card-head">
                ${_icon('brand')} ${_icon('brand')} ${portrait(jump.player, 28)} ${_icon('brand')} ${_icon('brand')}
                <span class="hd-card-tag tag-brand">${brandLabel}</span>
              </div>
              <div class="hd-card-body" style="font-size:16px;color:var(--hd-gold)">${pick(BRAND_FOUND)(jump.player, jump.tribeName)}</div>
              <div class="hd-card-foot" style="color:var(--hd-gold)">${_icon('brand')} +15 score | POP +2</div>
            </div>`;
            stepMeta.push({ type: 'brand', tribeName: jump.tribeName, player: jump.player, brandFound: true, brandType: 'own' });
          } else if (jump.sheepBrand !== null) {
            // WRONG BRAND — red card
            cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}" style="border:2px solid var(--hd-danger);background:rgba(239,68,68,0.08)">
              <div class="hd-card-head">
                ${portrait(jump.player, 22)}
                <span class="hd-card-tag tag-fail">WRONG BRAND</span>
                <span class="hd-card-who">${jump.sheepBrand}</span>
              </div>
              <div class="hd-card-body">${pick(BRAND_WRONG)(jump.player, jump.sheepBrand)}</div>
            </div>`;
            stepMeta.push({ type: 'brand', tribeName: jump.tribeName, player: jump.player, brandFound: false, brandType: 'wrong', wrongBrand: jump.sheepBrand });
          } else {
            // NO BRAND — gray card
            cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}" style="border:1px solid rgba(241,228,205,0.15)">
              <div class="hd-card-head">
                ${portrait(jump.player, 22)}
                <span class="hd-card-tag" style="background:rgba(241,228,205,0.1);color:var(--hd-sand)">NO BRAND</span>
              </div>
              <div class="hd-card-body">${pick(BRAND_NONE)(jump.player)}</div>
            </div>`;
            stepMeta.push({ type: 'brand', tribeName: jump.tribeName, player: jump.player, brandFound: false, brandType: 'none' });
          }
          stepIdx++;
        } else {
          // Grab failed
          cards += `<div class="hd-card" id="hd-step-bungee-${stepIdx}">
            <div class="hd-card-head">
              ${portrait(jump.player, 22)}
              <span class="hd-card-tag tag-fail">MISSED</span>
              <span class="hd-card-who">${_icon('sheep')} empty-handed</span>
            </div>
            <div class="hd-card-body">${pick(BUNGEE_GRAB_FAIL)(jump.player)}</div>
          </div>`;
          stepMeta.push({ type: 'grab', tribeName: jump.tribeName, player: jump.player, grabSuccess: false });
          stepIdx++;
        }
      }
    });

    // Comm chatter after each round
    let comm;
    do { comm = pick(COMM_BUNGEE); } while (usedComms.has(comm) && usedComms.size < COMM_BUNGEE.length);
    usedComms.add(comm);
    cards += `<div class="hd-card hd-comm" id="hd-step-bungee-${stepIdx}">${comm}</div>`;
    stepMeta.push({ type: 'comm' });
    stepIdx++;

    // Social events after odd rounds
    const roundSocial = (hd.bungeeSocialEvents || []).filter(se => se.afterRound === roundData.round);
    roundSocial.forEach(se => {
      cards += `<div class="hd-card hd-card-social" id="hd-step-bungee-${stepIdx}">
        <div class="hd-card-head">
          <span class="hd-card-tag tag-social">${se.type}</span>
          <span class="hd-card-who">${se.actor} → ${se.target}</span>
        </div>
        <div class="hd-card-icon">
          ${portrait(se.actor, 28)} ${portrait(se.target, 28)}
        </div>
        <div class="hd-card-body">${se.narrative}</div>
        <div class="hd-card-foot">BOND ${se.bondDelta > 0 ? '+' : ''}${se.bondDelta}</div>
      </div>`;
      stepMeta.push({ type: 'social', actor: se.actor, target: se.target });
      stepIdx++;
    });
  });

  // Social events without afterRound (legacy format)
  const unassignedSocial = (hd.bungeeSocialEvents || []).filter(se => !se.afterRound);
  unassignedSocial.forEach(se => {
    cards += `<div class="hd-card hd-card-social" id="hd-step-bungee-${stepIdx}">
      <div class="hd-card-head">
        <span class="hd-card-tag tag-social">${se.type}</span>
        <span class="hd-card-who">${se.actor} → ${se.target}</span>
      </div>
      <div class="hd-card-icon">
        ${portrait(se.actor, 28)} ${portrait(se.target, 28)}
      </div>
      <div class="hd-card-body">${se.narrative}</div>
      <div class="hd-card-foot">BOND ${se.bondDelta > 0 ? '+' : ''}${se.bondDelta}</div>
    </div>`;
    stepMeta.push({ type: 'social' });
    stepIdx++;
  });

  window._hdBungeeStepMeta = stepMeta;

  const totalSteps = stepIdx;
  cards += `<div class="hd-controls-bar" id="hd-controls-bungee">
    <button class="hd-btn" onclick="hdRevealNext('hd-bungee',${totalSteps})">NEXT</button>
    <span class="hd-counter-display" id="hd-counter-bungee">0 / ${totalSteps}</span>
    <button class="hd-btn" onclick="hdRevealAll('hd-bungee',${totalSteps})">ALL</button>
  </div>`;

  return _shell(cards, ep, 'hd-bungee');
}

export function rpBuildHDResults(ep) {
  const hd = ep.picnicHangingDork;
  if (!hd) return '';

  let podium = '';
  let mvpSection = '';
  let tribalBanner = '';

  if (hd.isPostMerge) {
    // ── POST-MERGE: individual standings ──
    const rankings = hd.rankings || (hd.players || []).map(p => p.name);
    podium = rankings.map((name, idx) => {
      const p = (hd.players || []).find(x => x.name === name);
      const isWinner = name === hd.immunityWinner;
      const rt = p?.totalRaceTime || 0;
      const gf = p?.goldenFleeceFound || 0;
      const score = ep.chalMemberScores?.[name] || 0;
      const brandStars = Array.from({length: 2}, (_, i) => i < gf
        ? _icon('brand')
        : `<span style="opacity:0.3">${_icon('brand')}</span>`
      ).join('');
      return `<div class="hd-podium-slot ${isWinner ? 'winner' : ''}" style="animation:hd-title-enter 0.6s ease-out ${0.2 + idx * 0.2}s both;${isWinner ? 'border:2px solid var(--hd-gold)' : ''}">
        <div class="hd-podium-rank ${idx === 0 ? 'r1' : ''}">#${idx + 1}</div>
        <div style="margin:6px 0">${portrait(name, 32)}</div>
        <div class="hd-podium-name" style="color:${isWinner ? 'var(--hd-gold)' : 'var(--hd-sand)'}">${name}</div>
        ${isWinner ? '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--hd-gold);margin:2px 0">IMMUNITY WINNER</div>' : ''}
        <div class="hd-podium-scores">
          ${_icon('emu')} Race: ${rt.toFixed(1)}s<br>
          ${_icon('brand')} Golden: ${brandStars} ${gf}/2<br>
          ${_icon('trophy')} Score: ${score.toFixed(0)}pts
        </div>
      </div>`;
    }).join('');

  } else {
    // ── PRE-MERGE: tribe standings (original) ──
    _normTribes(hd);

    const fastest = Math.min(...hd.tribes.map(x => x.totalRaceTime || 1));
    const maxBungee = Math.max(1, ...hd.tribes.map(x => x.bungeeScore || 0));

    const combined = hd.tribes.map(t => {
      const rt = t.totalRaceTime || 1;
      const bs = t.bungeeScore || 0;
      const bf = t.brandsFound || 0;
      return {
        tribeName: t.tribeName, color: t.color,
        raceScore: Math.round(100 * fastest / rt),
        bungeeNorm: Math.round(100 * bs / maxBungee),
        total: Math.round(100 * fastest / rt + 100 * bs / maxBungee),
        raceTime: rt, wool: t.totalWool || 0, brandsFound: bf,
        bungeeRaw: bs,
      };
    }).sort((a, b) => b.total - a.total);

    podium = combined.map((c, idx) => {
      const isWin = c.tribeName === hd.winningTribe;
      const isLose = c.tribeName === hd.losingTribe;
      const tribeObj = hd.tribes.find(t => t.tribeName === c.tribeName);
      const memberIcons = (tribeObj?.members || []).slice(0, 5).map(m => portrait(m, 24)).join('');
      const brandStars = Array.from({length: 3}, (_, i) => i < c.brandsFound
        ? _icon('brand')
        : `<span style="opacity:0.3">${_icon('brand')}</span>`
      ).join('');
      return `<div class="hd-podium-slot ${isWin ? 'winner' : isLose ? 'loser' : ''}" style="animation:hd-title-enter 0.6s ease-out ${0.2 + idx * 0.2}s both">
        <div class="hd-podium-rank ${idx === 0 ? 'r1' : idx === combined.length - 1 ? 'r-last' : ''}">#${idx + 1}</div>
        <div class="hd-podium-name" style="color:${c.color}">${c.tribeName}</div>
        <div style="display:flex;justify-content:center;gap:2px;margin:6px 0">${memberIcons}</div>
        <div class="hd-podium-scores">
          ${_icon('emu')} Race: ${(c.raceTime || 0).toFixed(1)}s (${c.raceScore}pts)<br>
          ${_icon('brand')} Brands: ${brandStars} ${c.brandsFound}/3 (${c.bungeeNorm}pts)<br>
          <span style="opacity:0.5">${_icon('wool')} Wool: ${c.wool}</span><br>
          ${_icon('trophy')} Total: ${c.total}pts
        </div>
      </div>`;
    }).join('');

    mvpSection = hd.mvpPlayer ? `
      <div class="hd-mvp-card">
        <div class="hd-mvp-label">Most Valuable Player</div>
        <div style="margin-top:6px">${portrait(hd.mvpPlayer, 36)}</div>
        <div class="hd-mvp-name">${hd.mvpPlayer}</div>
      </div>` : '';

    tribalBanner = hd.losingTribe ? `
      <div class="hd-tribal-banner">
        ${_icon('skull')} ${hd.losingTribe} — Tribal Council Awaits ${_icon('skull')}
      </div>` : '';
  }

  const content = `
    <div class="hd-results-wrap">
      <div class="hd-results-title">${_icon('trophy')} Results</div>
      <div class="hd-podium">${podium}</div>
      ${mvpSection}
      ${tribalBanner}
    </div>`;
  return _shell(content, ep, 'hd-results');
}
