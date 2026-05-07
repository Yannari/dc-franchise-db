import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

/* ═══════════════════════════════════════════════════════════════ */
/*  MIDNIGHT MANHUNT — Victorian Criminal Manhunt (Pre-merge)    */
/*  Prefix: mm-   chalSeries: 'world-tour'  chalStyle: 'hunt'   */
/* ═══════════════════════════════════════════════════════════════ */

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range) { return (Math.random() - 0.5) * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function getArchetype(name) { return players.find(p => p.name === name)?.archetype || 'floater'; }
function _slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function _av(name, size) { return `<img src="assets/avatars/${_slug(name)}.png" alt="${name}" style="width:${size||22}px;height:${size||22}px;border-radius:3px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`; }
function _pin(name) {
  return `<span class="mm-pin">${_av(name, 20)}<span class="mm-pin-label">${name}</span></span>`;
}
function isNice(a) { return ['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(a); }
function isVillain(a) { return ['villain','mastermind','schemer'].includes(a); }
function isNeutral(a) { return ['hothead','challenge-beast','wildcard','chaos-agent','floater','perceptive-player'].includes(a); }
function canScheme(name) {
  const a = getArchetype(name), s = pStats(name);
  if (isVillain(a)) return true;
  if (isNeutral(a) && s.strategic >= 6 && s.loyalty <= 4) return true;
  return false;
}

/* ─── Street locations ─── */
const STREETS = [
  { id:'gaslight-row', name:'Gaslight Row' },
  { id:'brass-alley', name:'Brass Alley' },
  { id:'chandler-lane', name:'Chandler Lane' },
  { id:'inkwell-court', name:'Inkwell Court' },
  { id:'whitechapel-row', name:'Whitechapel Row' },
  { id:'boiler-passage', name:'Boiler Passage' },
  { id:'mitre-square', name:'Mitre Square' },
  { id:'bus-depot', name:'Bus Depot' },
];

/* ─── Text pools (4-6 variants each) ─── */
const TXT_VOL_YES = [
  (n,p) => `${n} steps forward with a confident nod. ${p.Sub} ${pick(["isn't afraid","doesn't hesitate","volunteers without blinking"])}.`,
  (n,p) => `${n} raises ${p.posAdj} hand. ${pick(['"I\'ll do it."','"Let me handle this."','"Someone has to.  Might as well be me."'])}`,
  (n,p) => `${n} cracks ${p.posAdj} knuckles. ${pick(['"Let\'s get this over with."','"Fine. I\'ll go."','"Stand back."'])}`,
  (n,p) => `Without a word, ${n} moves to the front of the group. ${p.Sub} gives a slight nod — ready.`,
];
const TXT_VOL_NO = [
  (n,p) => `${n} takes a firm step backward. ${pick(['"Absolutely not."','"Not a chance."','"I\'m not touching that."','"Hard pass."'])}`,
  (n,p) => `${n} folds ${p.posAdj} arms and shakes ${p.posAdj} head. Not happening.`,
  (n,p) => `${n} looks away, pretending to study the architecture. ${p.Sub} is NOT volunteering.`,
  (n,p) => `${n} mutters something about "personal boundaries" and retreats behind the group.`,
];
const TXT_PRESSURE = [
  (a,b,pa,pb) => `${a} turns to ${b}. ${pick([`"Come on, ${b}. We need you."`,`"${b}, you're the best choice here."`,`"Don't make me do this alone, ${b}."`])} ${b} looks cornered.`,
  (a,b,pa,pb) => `${a} puts a hand on ${b}'s shoulder. "${b}. I'm asking nicely. Once." ${b} swallows hard.`,
  (a,b,pa,pb) => `"Everyone's looking at you, ${b}," ${a} says quietly. The tribe's eyes confirm it. ${b} has nowhere to hide.`,
  (a,b,pa,pb) => `${a} appeals to ${b}'s pride. "${b}, are you really going to let the other tribe beat us because you're scared?"`,
];
const TXT_STRIP_SMOOTH = [
  (a,b) => `${a} and ${b} approach the guard with practiced ease. A deft hand here, a quick tug there — the uniform starts coming off without a fight.`,
  (a,b) => `${a} distracts the guard with smooth conversation while ${b} works the buttons from behind. Teamwork at its finest.`,
  (a,b) => `${a} charms the guard into near-compliance. ${b} handles the rest. The jacket slides off like they've done this before.`,
  (a,b) => `Between ${a}'s silver tongue and ${b}'s quick hands, the guard is half-undressed before he even realizes what's happening.`,
];
const TXT_STRIP_FUMBLE = [
  (a,b) => `${a} grabs the wrong button. ${b} pulls too hard and a sleeve rips. The guard remains stoic while both contestants fumble helplessly.`,
  (a,b) => `${a} and ${b} collide trying to reach the same epaulette. The guard stands motionless while they untangle themselves.`,
  (a,b) => `${b} accidentally tickles the guard while reaching for a pocket. ${a} nearly falls over. This is painful to watch.`,
  (a,b) => `Every button ${a} undoes, the guard's posture makes harder. ${b} is pulling at a cuff that won't budge. The other tribe is watching.`,
];
const CLUE_CONTENTS = [
  { short:'street coordinates', detail:'Coordinates marking three intersections near Boiler Passage — the fugitive was spotted near the second.' },
  { short:'witness sketch', detail:'A charcoal sketch of a tall figure in a dark overcoat, last seen heading northeast past the chandler shop.' },
  { short:'boot print analysis', detail:'A plaster cast impression showing size-12 hobnailed boots with a distinctive crack in the left heel.' },
  { short:'torn fabric swatch', detail:'A swatch of dark wool — expensive, tailored. Ripped from a coat sleeve on a wrought-iron fence.' },
  { short:'coded route map', detail:'A hand-drawn map showing the fugitive\'s likely escape route through three back alleys to the bus depot.' },
  { short:'informant\'s note', detail:'A hastily scrawled message: "Double-decker. Upper deck. He hides in the fog when the gaslights dim."' },
];
const TXT_CLUE_FAST = [
  (n,p,c) => `${n} finds the clue immediately — ${c.short} tucked in the left epaulette. A triumphant wave. ${c.detail}`,
  (n,p,c) => `${n}'s fingers close around a hidden document inside the collar lining. Quick extraction — ${c.short}, intact and clear. ${c.detail}`,
  (n,p,c) => `A practiced search of the inner pockets reveals the clue. ${n} unfolds it carefully — ${c.short}. ${c.detail}`,
  (n,p,c) => `${n} goes straight for the hat band. The clue was tucked inside all along. ${c.detail}`,
];
const TXT_CLUE_SLOW = [
  (n,p,c) => `${n} rummages through every pocket, seam, and fold. Minutes pass. The clue finally appears in the boot lining — ${c.short}. ${c.detail}`,
  (n,p,c) => `${n} searches and searches. ${p.Sub} checks the same pockets twice. The clue — ${c.short} — was in the cuff the whole time. ${c.detail}`,
  (n,p,c) => `After an excruciating search that involves shaking the guard's trousers upside down, ${n} finally spots it: ${c.short}. ${c.detail}`,
  (n,p,c) => `The clue plays hide-and-seek. ${n} misses it three times before finding ${c.short} wedged behind a medal. ${c.detail}`,
];
const TXT_CLUE_CRIT = [
  (n,p,c) => `${n} yanks too hard and the clue TEARS — ${c.short}, now in two pieces. The remaining fragment is barely legible. ${c.detail.substring(0, 60)}...`,
  (n,p,c) => `In ${p.posAdj} rush, ${n} crushes the ${c.short} against a button. The ink smears. Only fragments survive: "${c.detail.substring(0, 40)}..."`,
];
const TXT_SABOTAGE = [
  (s,p) => `${s} sneaks behind the rival tribe and quietly re-buttons three clasps on their guard's uniform. Sabotage complete.`,
  (s,p) => `${s} "accidentally" bumps into the rival strippers, knocking them off balance. ${p.Sub} feigns innocence.`,
  (s,p) => `${s} creates a loud distraction, drawing the rival tribe's attention away from their guard. Precious seconds lost.`,
  (s,p) => `${s} swipes a clue fragment from the rival's guard pile. ${p.Sub} pockets it before anyone notices.`,
];
const TXT_RACK_VICTIM = {
  'hero': (n,p) => `${n} climbs onto the rack without flinching. "Do what you must."`,
  'hothead': (n,p) => `${n} throws ${p.ref} onto the rack. "Get it OVER with. NOW."`,
  'goat': (n,p) => `${n} is visibly trembling as ${p.sub} lies down on the rack. "Is... is this going to hurt?"`,
  'villain': (n,p) => `${n} settles onto the rack with unnerving calm. "I'll remember exactly who put me here."`,
  'loyal-soldier': (n,p) => `${n} lies down stoically. "For the tribe."`,
  'challenge-beast': (n,p) => `${n} rolls onto the rack like it's another workout. "Bring it. I can take it."`,
  'social-butterfly': (n,p) => `${n} sits on the edge of the rack, takes a shaky breath, and lies back. "Just... be gentle, okay?"`,
  'showmancer': (n,p) => `${n} lies on the rack with dramatic flair. "If I don't make it, tell everyone I looked amazing."`,
  'underdog': (n,p) => `${n} lies on the rack quietly. No complaints, no drama — just quiet determination. ${p.Sub} has been through worse.`,
  'default': (n,p) => `${n} takes a breath and lies on the rack, staring at the ceiling, trying not to think about it.`,
};
const TXT_CRANK_GENTLE = [
  (c,v) => `${c} turns the crank slowly, carefully. Every click of the mechanism is deliberate. ${v} winces but holds steady.`,
  (c,v) => `${c} applies gentle, measured pressure. The rack groans but ${v} barely feels it. Mercy over speed.`,
  (c,v) => `"Easy... easy..." ${c} whispers, turning the crank at half-speed. ${v} gives a grateful nod through gritted teeth.`,
];
const TXT_CRANK_NORMAL = [
  (c,v) => `${c} cranks at a steady pace. Not cruel, not gentle. Business. ${v} grips the wooden sides and endures.`,
  (c,v) => `The mechanism clicks rhythmically as ${c} maintains a workman's pace. ${v}'s jaw is tight but ${v}'s managing.`,
  (c,v) => `${c} finds a rhythm — turn, click, turn, click. ${v} breathes through it. Efficient enough.`,
];
const TXT_CRANK_BRUTAL = [
  (c,v) => `${c} WRENCHES the crank. Hard. Fast. ${v}'s eyes go wide. "STOP! STOP!" But ${c} doesn't stop.`,
  (c,v) => `${c} grabs the crank with both hands and cranks with everything. ${v} screams. ${c}'s expression doesn't change.`,
  (c,v) => `${c} puts ${c}'s full weight into the crank. The mechanism shrieks. ${v} howls. The clue better be worth this.`,
];
const TXT_HUNT_FIND_ACT1 = [
  (n,st,p) => `${n} crouches by a drain grate on ${st}. Fresh scratch marks — an arrow scratched in chalk. Evidence secured.`,
  (n,st,p) => `A torn scrap of dark fabric catches ${n}'s eye near a lamppost on ${st}. Still warm to the touch.`,
  (n,st,p) => `${n} finds a boot print in the soot on ${st}. Deep tread, recent. The heel pattern is distinctive.`,
  (n,st,p) => `Under a loose cobblestone on ${st}, ${n} discovers a coded note. ${p.Sub} pockets it carefully — ink still wet.`,
  (n,st,p) => `${n} notices a gaslight on ${st} has been deliberately smashed. Glass still falling. Whoever did this is close.`,
  (n,st,p) => `${n} kneels beside a puddle on ${st}. The water is disturbed — someone stepped through here moments ago.`,
  (n,st,p) => `A dropped button gleams in the gutter on ${st}. ${n} holds it up — brass, military-cut. First solid lead.`,
  (n,st,p) => `${n} spots chalk marks on a wall on ${st}. Crude arrows pointing deeper into the district. A breadcrumb trail.`,
  (n,st,p) => `A window shutter on ${st} is still swinging. ${n} touches the latch — warm from a recent grip. "${p.Sub}'s been here."`,
  (n,st,p) => `${n} finds a smudge of something dark on a doorframe on ${st}. ${p.Sub} sniffs it. Coal dust. Fresh.`,
  (n,st,p) => `A newspaper on ${st} has been torn in half. ${n} finds the missing piece tucked behind a drainpipe — with writing on it.`,
  (n,st,p) => `${n} traces a scratch pattern on the cobblestones of ${st}. Something heavy was dragged through here. Recently.`,
];
const TXT_HUNT_FIND_ACT2 = [
  (n,st,p) => `${n} nearly trips over an overturned crate on ${st}. Someone left in a hurry. Boot prints lead deeper in.`,
  (n,st,p) => `Blood. Just a smear on the brickwork of ${st}, but unmistakable. ${n} marks the location and presses on.`,
  (n,st,p) => `A shattered lantern lies in the middle of ${st}. ${n} picks through the wreckage — finds a scrap of map inside.`,
  (n,st,p) => `${n} catches a whiff of something chemical on ${st}. Chloroform? The scent leads to a discarded cloth nearby.`,
  (n,st,p) => `Two gaslights on ${st} have been knocked out in sequence. ${n} reads the pattern — the fugitive is heading northeast.`,
  (n,st,p) => `${n} finds fingernail scratches gouged into a window ledge on ${st}. Someone climbed through here — and they were desperate.`,
  (n,st,p) => `A warning whistle lies abandoned on ${st}. ${n} examines it — the mouthpiece is still damp. Dropped in panic.`,
  (n,st,p) => `${n} spots a rope dangling from a fire escape on ${st}. Frayed at the bottom — cut recently. The trail leads up.`,
  (n,st,p) => `Muddy footprints on ${st} — but two different shoe sizes. ${n} freezes. "${p.Sub}'s not working alone?" The second trail veers east.`,
  (n,st,p) => `${n} notices a strange symbol carved fresh into a lamp post on ${st}. ${p.Sub} copies it down. The pattern is becoming clear.`,
  (n,st,p) => `The cobblestones on ${st} are wet — but it hasn't rained. ${n} follows the water trail to a broken pipe. Deliberate sabotage.`,
  (n,st,p) => `${n} finds a crumpled wanted poster of the fugitive on ${st}. Someone has drawn an X over the eyes with fresh ink.`,
];
const TXT_HUNT_FIND_ACT3 = [
  (n,st,p) => `${n}'s hands shake decoding the final clue on ${st}. The pieces snap together. "I know where the fugitive is."`,
  (n,st,p) => `A trail of disturbed dust on ${st} leads straight toward the depot. ${n} breaks into a run. This is it.`,
  (n,st,p) => `${n} finds the fugitive's stash on ${st} — rope, a bag, a timetable. The double-decker. It's always been the double-decker.`,
  (n,st,p) => `The evidence converges on ${st}. ${n} spreads ${p.posAdj} clues on the ground — every trail points to the same place.`,
  (n,st,p) => `${n} catches the sound of an engine idling somewhere beyond ${st}. The bus. "EVERYONE — THIS WAY!"`,
  (n,st,p) => `A final desperate chalk arrow on ${st} — the fugitive marked ${p.posAdj} own escape route. ${n} reads it like a signature.`,
  (n,st,p) => `${n} kneels on ${st} and presses ${p.posAdj} ear to the cobblestones. Footsteps — heavy, running — heading northeast. Got you.`,
  (n,st,p) => `Broken glass on ${st} catches the firelight. ${n} follows the trail of shards — they point like arrows toward the depot.`,
  (n,st,p) => `${n} finds a discarded sack on ${st}. The inside reeks of chloroform. The fugitive is preparing for the endgame.`,
  (n,st,p) => `${n} spots the fugitive's silhouette darting between buildings on ${st}. No doubt now — the target is fleeing toward the depot.`,
  (n,st,p) => `A bus ticket stub on ${st}. ${n} flips it over — departure time circled in red ink. "The bus is the exit plan."`,
  (n,st,p) => `${n} nearly collides with a toppled rubbish bin on ${st}. Someone barreled through here at full speed. The trail is hot.`,
  (n,st,p) => `${n} finds scratches on a gate on ${st} — someone tried to force it open. Failed. They went toward the depot instead.`,
  (n,st,p) => `Fresh blood drops on ${st}, leading northeast. ${n} follows them at a sprint. The fugitive is injured and running out of options.`,
];
const TXT_HUNT_MISS_ACT1 = [
  (n,st,p) => `${n} searches ${st} thoroughly but finds nothing. The fog hides everything tonight.`,
  (n,st,p) => `${n} peers into the mist blanketing ${st}. Nothing moves. Nothing breathes. Just the distant clatter of a carriage.`,
  (n,st,p) => `${n} checks every doorway along ${st}. Locked. Dark. Cold. The fugitive has been careful.`,
  (n,st,p) => `${n} circles ${st} twice. A rat scurries across ${p.posAdj} path. That's the most excitement ${p.sub} finds.`,
  (n,st,p) => `${n} holds up ${p.posAdj} lantern on ${st}. The light catches cobwebs, rust, peeling paint — nothing useful.`,
  (n,st,p) => `${n} follows a promising scuff mark down ${st}. It leads to a dead cat. Useless.`,
];
const TXT_HUNT_MISS_ACT2 = [
  (n,st,p) => `${n} slams a fist against the wall on ${st}. The trail's gone cold and ${p.sub} knows it. Time wasted.`,
  (n,st,p) => `${n} chases a shadow down ${st} only to find a coat hung on a nail. ${p.Sub} swears under ${p.posAdj} breath.`,
  (n,st,p) => `${n} is sure of it — a sound on ${st}. Thirty seconds of absolute stillness. Nothing. Just ${p.posAdj} own heartbeat.`,
  (n,st,p) => `Every promising lead on ${st} ends at a wall. ${n} is running out of time and starting to feel it.`,
  (n,st,p) => `${n} realizes ${p.sub}'s been walking in circles on ${st}. The fog turned ${p.obj} around. Valuable minutes lost.`,
  (n,st,p) => `${n} finds a clue on ${st} — then realizes it's ${p.posAdj} own footprint from an earlier round. Frustrating.`,
];
const TXT_HUNT_MISS_ACT3 = [
  (n,st,p) => `${n} sprints down ${st}, desperate. Empty. ${p.Sub}'s too late — the action has moved elsewhere.`,
  (n,st,p) => `${n} checks ${st} one last time. The evidence is gone. Taken. Someone else found it first.`,
  (n,st,p) => `${n} can hear shouting from the depot direction while stuck on ${st}. ${p.Sub} curses and runs toward the sound.`,
  (n,st,p) => `Panic sets in. ${n} tears through ${st} finding nothing. The clock is running out.`,
];
const TXT_RIPPER_CATCH = [
  (n,st,p) => `A shadow detaches from the wall on ${st}. ${n} doesn't see it coming — a gloved hand, a muffled yelp, and ${p.sub} vanishes into the darkness.`,
  (n,st,p) => `The gaslight on ${st} flickers and dies. When it sputters back, ${n} is gone. Only ${p.posAdj} lantern remains, flame guttering on the wet cobblestones.`,
  (n,st,p) => `${n} feels a presence behind ${p.obj} on ${st}. A turn — too late. An arm locks around ${p.posAdj} throat. The fog swallows both of them.`,
  (n,st,p) => `A shape lunges from a doorway on ${st}. ${n} gasps — hands close around ${p.posAdj} collar and ${p.sub} is wrenched off ${p.posAdj} feet.`,
  (n,st,p) => `The fugitive drops from a fire escape directly onto ${n} on ${st}. Impact, struggle, silence. When the fog clears, only one figure walks away.`,
  (n,st,p) => `${n} rounds the corner of ${st} and walks straight into the fugitive's trap — a wire, a stumble, and before ${p.sub} can scream, a sack is over ${p.posAdj} head.`,
  (n,st,p) => `The manhole cover on ${st} shifts. ${n} looks down. Arms reach up and drag ${p.obj} underground in one savage motion.`,
  (n,st,p) => `${n} hears a whisper on ${st}: "${n}..." A turn toward the sound. The last thing ${n} sees is a black-gloved hand.`,
  (n,st,p) => `A carriage door swings open as ${n} passes on ${st}. Before ${p.sub} can react, ${p.sub} is hauled inside. The door slams shut. The carriage doesn't move.`,
  (n,st,p) => `The fugitive is already behind ${n} when ${p.sub} steps into the alley on ${st}. A chloroform rag, three seconds of struggle, then nothing.`,
];
const TXT_RIPPER_ESCAPE = [
  (n,st,p) => `The fugitive's shadow falls across ${n} on ${st}. But ${p.sub} senses it first — ${p.sub} spins and bolts. "${pick(["Not today.","Nice try.","You'll have to be faster."])}"`,
  (n,st,p) => `${n} hears the footsteps a heartbeat before the attack on ${st}. ${p.Sub} throws ${p.ref} sideways and sprints. Close. Too close.`,
  (n,st,p) => `The fugitive's hand closes on ${n}'s shoulder on ${st}. ${p.Sub} wrenches free, leaving fabric behind, and runs for ${p.posAdj} life.`,
  (n,st,p) => `${n} catches the glint of metal on ${st} and reacts on instinct — a feint left, a hard shove, and ${p.sub} is gone before the fugitive can recover.`,
  (n,st,p) => `A wire snags ${n}'s ankle on ${st}. ${p.Sub} stumbles but catches ${p.ref} on a railing. The fugitive lunges — ${n} kicks free and scrambles.`,
  (n,st,p) => `${n} feels the air shift on ${st} — combat instinct. A duck. Something whistles overhead. ${n} doesn't look back.`,
  (n,st,p) => `The fugitive emerges from a doorway on ${st}, arms spread to block the alley. ${n} charges straight through, breaking the grip with raw momentum.`,
  (n,st,p) => `${n} steps into a trap on ${st} — a loose flagstone drops, ${p.sub} stumbles. The fugitive pounces. ${n} screams, and a nearby dog starts barking. The fugitive retreats.`,
  (n,st,p) => `A hand grabs ${n}'s collar on ${st}. ${p.Sub} headbutts backwards, connects with something solid, and sprints into the fog without looking back.`,
  (n,st,p) => `${n} rounds a corner on ${st} directly into the fugitive. For one frozen second they lock eyes. ${n} recovers first — ${p.sub} vaults a railing and drops into a side alley.`,
];
const TXT_RIPPER_STALK = [
  (n,st,p) => `${n} feels watched on ${st}. The hair on the back of ${p.posAdj} neck won't settle. Something is following ${p.obj}.`,
  (n,st,p) => `A shadow mimics ${n}'s movements along the rooftops of ${st}. When ${p.sub} speeds up, it speeds up. When ${p.sub} stops, it stops.`,
  (n,st,p) => `${n} finds ${p.posAdj} own name scratched into a wall on ${st}. The chalk is fresh. The fugitive knows who ${p.sub} is.`,
  (n,st,p) => `Footsteps echo behind ${n} on ${st}. ${n} freezes. The footsteps freeze. ${n} walks. The footsteps follow. ${n} breaks into a run.`,
  (n,st,p) => `${n} spots a figure standing perfectly still at the far end of ${st}. Watching. Then it steps backwards into the fog and vanishes.`,
  (n,st,p) => `Someone has left ${n}'s lantern arranged pointing at ${p.posAdj} own location on ${st}. The fugitive is playing games.`,
];
const TXT_CORGI_YES = [
  (n,p) => `${n} drops to ${p.posAdj} knees. The lead corgi tilts its head... then trots over and licks ${p.posAdj} face. Pack accepted.`,
  (n,p) => `${n} holds out a steady hand. The corgi sniffs, considers, then nuzzles in. Allies forged in the fog.`,
  (n,p) => `The smallest corgi breaks formation and waddles toward ${n}. The others follow. ${n} now has a very short, very fluffy security detail.`,
  (n,p) => `${n} whistles softly. The lead corgi's ears perk up. It barks once — a command — and the pack falls in beside ${p.obj}.`,
];
const TXT_CORGI_NO = [
  (n,p) => `${n} reaches for the lead corgi. It snarls, and the whole pack gives chase. ${n} runs for ${p.posAdj} life.`,
  (n,p) => `The corgis take one look at ${n} and start barking. Loudly. So much for stealth.`,
  (n,p) => `${n} tries a low whistle. The lead corgi bares its teeth. The pack advances as one. ${n} backs away slowly, then not so slowly.`,
  (n,p) => `The lead corgi sniffs ${n}'s hand, then snaps at it. The pack circles ${p.obj} menacingly. ${n} retreats with ${p.posAdj} dignity intact — barely.`,
];
const TXT_TRACKING = [
  (n,p) => `${n} pieces together the evidence — boot prints, fabric scraps, smashed lamps. The pattern converges northeast. "There."`,
  (n,p) => `${n}'s eyes narrow. Every clue studied, every detail memorized. "The fugitive is heading for the bus depot. I'm certain."`,
  (n,p) => `${n} connects the dots on ${p.posAdj} mental map. Alley by alley, clue by clue — the fugitive's path is clear.`,
  (n,p) => `${n} spreads ${p.posAdj} collected clues across a crate. The trajectory is unmistakable. "Boxed in."`,
  (n,p) => `${n} traces a finger along the wall, muttering street names. A pause. Eyes widen. "The bus depot. It's always been the bus depot."`,
  (n,p) => `${n} crouches over ${p.posAdj} evidence, arranging fragments like a jigsaw. The picture snaps into focus. "Northeast. The depot."`,
  (n,p) => `Every clue ${n} collected points the same direction. ${n} straightens up, jaw set. "I know exactly where to go."`,
];
const TXT_CAPTURE_WIN = [
  (n,p,corgi) => `${n} charges up the stairs of the double-decker bus${corgi ? " with the corgis flanking " + p.obj : ""}. The fugitive is cornered. A brief struggle — and ${n} holds up the thrashing bag triumphantly.`,
  (n,p,corgi) => `${n} tackles the fugitive on the upper deck${corgi ? " as the corgis herd the fugitive into a dead end" : ""}. A sack over the head, a knot pulled tight. Case closed.`,
  (n,p,corgi) => `The fugitive makes a break for the stairs. ${n} is faster${corgi ? " — and the corgis block the only exit" : ""}. A flying leap, a scuffle, and it's over.`,
  (n,p,corgi) => `${n} vaults over a seat and lands on the fugitive's back${corgi ? " — the corgis nip at the fugitive's ankles, cutting off retreat" : ""}. Bag. Rope. Done.`,
];

/* ═══════════════════════════════════════════════════════════════ */
/*  SIMULATION                                                    */
/* ═══════════════════════════════════════════════════════════════ */

export function simulateMidnightManhunt(ep) {
  const campKey = gs.tribes[0]?.tribeName || 'tribe';
  if (!ep.campEvents) ep.campEvents = {};
  gs.tribes.forEach(t => { if (!ep.campEvents[t.tribeName]) ep.campEvents[t.tribeName] = { pre: [], post: [] }; });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  const allActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });
  if (!gs.popularity) gs.popularity = {};

  const result = {
    phase1: { tribes: [] },
    phase2: { tribes: [] },
    phase3: { streets: STREETS, acts: [], caughtPlayers: [], corgiStreet: null, corgiAlly: null, tribeClues: {}, tracking: null, capture: null },
    winningTribe: null, losingTribes: [], tribes: [],
  };

  const tribeData = gs.tribes.map(t => ({
    tribeName: t.tribeName || t.name,
    members: t.members.filter(m => allActive.includes(m)),
  }));
  result.tribes = tribeData.map(t => ({ tribeName: t.tribeName, members: [...t.members] }));
  tribeData.forEach(t => { result.phase3.tribeClues[t.tribeName] = 0; });

  /* ─────────────────────────────────────── */
  /*  PHASE 1: GUARD STRIP                  */
  /* ─────────────────────────────────────── */
  for (const tribe of tribeData) {
    const p1 = { tribeName: tribe.tribeName, volunteers: [], refused: [], forced: [], strippers: [], beats: [], sabotage: null, socialEvents: [], clueQuality: 'clean' };

    // Volunteer roll
    for (const name of tribe.members) {
      const s = pStats(name), a = getArchetype(name), pr = pronouns(name);
      let bonus = 0;
      if (['challenge-beast','hero'].includes(a)) bonus = 0.15;
      if (['goat','showmancer','social-butterfly'].includes(a)) bonus = -0.15;
      const roll = s.boldness * 0.1 + bonus + noise(2.5);
      if (roll > 0.5 && !isVillain(a)) {
        p1.volunteers.push({ name, roll, text: pick(TXT_VOL_YES)(name, pr) });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
      } else {
        p1.refused.push({ name, roll, text: pick(TXT_VOL_NO)(name, pr) });
      }
    }

    // Determine strippers
    if (p1.volunteers.length >= 2) {
      p1.volunteers.sort((a, b) => b.roll - a.roll);
      p1.strippers = [p1.volunteers[0].name, p1.volunteers[1].name];
    } else if (p1.volunteers.length === 1) {
      p1.strippers.push(p1.volunteers[0].name);
      // Social pressure to get second
      const refusers = p1.refused.map(r => r.name);
      const convincer = [...tribe.members].sort((a, b) => pStats(b).social - pStats(a).social)[0];
      const target = refusers.filter(n => n !== convincer).sort((a, b) => pStats(a).mental - pStats(b).mental)[0]
        || refusers.sort((a, b) => pStats(a).mental - pStats(b).mental)[0];
      if (convincer && target && convincer !== target && convincer !== p1.strippers[0]) {
        const pressRoll = pStats(convincer).social * 0.1 + noise(2.5);
        const resistRoll = pStats(target).mental * 0.1 + noise(2.5);
        const pr_c = pronouns(convincer), pr_t = pronouns(target);
        if (pressRoll > resistRoll) {
          p1.strippers.push(target);
          p1.forced.push({ name: target, by: convincer });
          addBond(target, convincer, -1.0);
          ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 1;
          p1.socialEvents.push({ type: 'pressure-success', text: pick(TXT_PRESSURE)(convincer, target, pr_c, pr_t), players: [convincer, target] });
        } else {
          p1.strippers.push(convincer);
          p1.socialEvents.push({ type: 'pressure-fail', text: `${convincer} tried to convince ${target}, but ${target} wouldn't budge. ${convincer} has to go instead.`, players: [convincer, target] });
        }
      } else if (refusers.length > 0) {
        const drafted = refusers[0];
        const pr_d = pronouns(drafted);
        p1.strippers.push(drafted);
        p1.forced.push({ name: drafted, by: convincer || p1.volunteers[0]?.name });
        ep.chalMemberScores[drafted] = (ep.chalMemberScores[drafted] || 0) - 1;
        const forcerName = convincer || p1.volunteers[0]?.name || 'the tribe';
        p1.socialEvents.push({
          type: 'drafted', players: [drafted],
          text: pick([
            `Nobody else steps forward. All eyes turn to ${drafted}. ${pr_d.Sub} has no choice — ${forcerName} pushes ${pr_d.obj} forward. "You're up."`,
            `With only one volunteer, someone has to fill the second slot. ${drafted} draws the short straw. ${pr_d.Sub} looks furious but complies.`,
            `"We need a second person," ${forcerName} announces. Silence. Then ${forcerName} points at ${drafted}. "You." ${drafted} opens ${pr_d.posAdj} mouth to protest — then closes it.`,
            `${drafted} tries to disappear into the back of the group. It doesn't work. ${forcerName} grabs ${pr_d.posAdj} arm. "Let's go, ${drafted}."`,
          ]),
        });
        addBond(drafted, forcerName === 'the tribe' ? p1.volunteers[0]?.name || tribe.members[0] : forcerName, -0.5);
      }
    } else {
      // Nobody volunteered — someone has to take charge
      // The most dominant personality steps up and assigns people
      const leader = [...tribe.members].sort((a, b) => {
        const sa2 = pStats(a), sb2 = pStats(b);
        const aScore = sa2.social * 0.4 + sa2.boldness * 0.3 + sa2.strategic * 0.3 + (isVillain(getArchetype(a)) ? 2 : 0) + (getArchetype(a) === 'hothead' ? 1.5 : 0);
        const bScore = sb2.social * 0.4 + sb2.boldness * 0.3 + sb2.strategic * 0.3 + (isVillain(getArchetype(b)) ? 2 : 0) + (getArchetype(b) === 'hothead' ? 1.5 : 0);
        return bScore - aScore;
      })[0];
      const leaderArch = getArchetype(leader);
      const lp = pronouns(leader);

      // Leader picks targets based on their own archetype
      const others = tribe.members.filter(n => n !== leader);
      let picks;
      if (isVillain(leaderArch)) {
        // Villains pick the weakest / least threatening
        picks = others.sort((a, b) => (pStats(a).physical + pStats(a).boldness) - (pStats(b).physical + pStats(b).boldness));
      } else if (leaderArch === 'hothead') {
        // Hotheads pick whoever they like least
        picks = others.sort((a, b) => getBond(leader, a) - getBond(leader, b));
      } else if (isNice(leaderArch)) {
        // Nice archetypes volunteer themselves + pick the most willing
        picks = [leader, ...others.sort((a, b) => pStats(b).boldness - pStats(a).boldness)];
      } else {
        // Neutral: pick strategically — most expendable
        picks = others.sort((a, b) => (pStats(a).strategic + pStats(a).social) - (pStats(b).strategic + pStats(b).social));
      }
      const target1 = picks[0];
      const target2 = picks[1] || picks[0];
      p1.strippers = [target1, target2];

      // Leader announcement narration
      const leaderIncludesSelf = target1 === leader || target2 === leader;
      let announcementText;
      if (leaderIncludesSelf) {
        const other = target1 === leader ? target2 : target1;
        announcementText = pick([
          `Dead silence. ${leader} looks at the group, then sighs. "Fine. I'll do it myself." ${lp.Sub} grabs ${other} by the collar. "${other}, you're coming with me."`,
          `Nobody moves. ${leader} rolls ${lp.posAdj} eyes. "Unbelievable." ${lp.Sub} steps forward, then points at ${other}. "You too. Let's go."`,
          `${leader} scans the group in disgust. "Cowards. All of you." ${lp.Sub} shoves past them and drags ${other} along.`,
        ]);
        gs.popularity[leader] = (gs.popularity[leader] || 0) + 1;
      } else if (isVillain(leaderArch)) {
        announcementText = pick([
          `${leader} steps into the center of the group. "Since nobody has the spine..." ${lp.Sub} points at ${target1} and ${target2}. "You two. Now." The tone leaves no room for argument.`,
          `"This is pathetic," ${leader} mutters, then turns cold. "${target1}. ${target2}. Get up there." ${lp.PosAdj} eyes dare them to refuse.`,
          `${leader} sizes up the group like a chess board. "You" — ${lp.sub} points at ${target1} — "and you." ${target2} flinches. "Don't make me ask twice."`,
        ]);
      } else if (leaderArch === 'hothead') {
        announcementText = pick([
          `${leader} snaps. "SOMEBODY has to do this!" ${lp.Sub} shoves ${target1} forward. "You're going. And ${target2}, move it!" The tribe recoils.`,
          `"Oh for — FINE!" ${leader} erupts. ${lp.Sub} grabs ${target1}'s arm and pushes ${target2} from behind. "GO. Both of you. NOW."`,
          `${leader} loses patience. "Are we just going to STAND here?!" ${lp.Sub} physically steers ${target1} and ${target2} toward the guard.`,
        ]);
      } else {
        announcementText = pick([
          `After an agonizing silence, ${leader} clears ${lp.posAdj} throat. "Look... someone has to." ${lp.Sub} points at ${target1} and ${target2}. "Sorry. But it's you two."`,
          `${leader} looks around the circle. Nobody meets ${lp.posAdj} eyes. "Okay. ${target1}, ${target2} — you're the best fit. I wouldn't ask if we had a choice."`,
        ]);
      }

      // Targets react based on THEIR archetypes
      const reactions = [];
      for (const drafted of [target1, target2]) {
        if (drafted === leader) continue;
        const da = getArchetype(drafted), dp = pronouns(drafted);
        let reactionText;
        if (da === 'hothead') {
          reactionText = pick([
            `${drafted} gets in ${leader}'s face. "You think you can just ORDER me?!" But ${dp.sub} goes anyway — fuming.`,
            `${drafted} slams ${dp.posAdj} fist against the wall. "This is garbage." But ${dp.sub} steps forward, seething.`,
          ]);
          addBond(drafted, leader, -1.5);
        } else if (isVillain(da)) {
          reactionText = pick([
            `${drafted} stares at ${leader} with ice-cold calm. "I'll remember this, ${leader}." ${dp.Sub} moves to the guard without breaking eye contact.`,
            `${drafted} smiles — the kind of smile that promises consequences. "Sure, ${leader}. Happy to help." The words drip with venom.`,
          ]);
          addBond(drafted, leader, -1.0);
        } else if (da === 'challenge-beast' || da === 'hero') {
          reactionText = pick([
            `${drafted} nods tightly. "Fine. But you owe me one, ${leader}." ${dp.Sub} rolls up ${dp.posAdj} sleeves.`,
            `${drafted} doesn't flinch. "Alright. Let's get it done." ${dp.Sub} cracks ${dp.posAdj} neck and steps forward.`,
          ]);
          addBond(drafted, leader, -0.3);
        } else if (da === 'goat' || da === 'underdog') {
          reactionText = pick([
            `${drafted} shrinks. "${pick(["Me? Why me?", "Can't someone else—", "I don't want to—"])}" But nobody rescues ${dp.obj}. ${dp.Sub} shuffles forward.`,
            `${drafted}'s voice cracks. "This isn't fair." But ${dp.sub} knows there's no way out. ${dp.Sub} moves to the guard with shaking hands.`,
          ]);
          addBond(drafted, leader, -0.5);
          gs.popularity[drafted] = (gs.popularity[drafted] || 0) - 1;
        } else {
          reactionText = pick([
            `${drafted} shoots ${leader} a look that could curdle milk — then complies without a word.`,
            `${drafted} mutters something unprintable under ${dp.posAdj} breath and steps forward.`,
          ]);
          addBond(drafted, leader, -0.5);
        }
        reactions.push(reactionText);
      }

      p1.forced = p1.strippers.filter(n => n !== leader).map(n => ({ name: n, by: leader }));
      if (leaderIncludesSelf) p1.forced.push({ name: leader, selfAssigned: true });
      p1.strippers.forEach(n => {
        ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) - 2;
      });
      p1.socialEvents.push({
        type: 'forced-assignment', players: [leader, target1, target2].filter((v, i, a) => a.indexOf(v) === i),
        text: announcementText + (reactions.length > 0 ? '<br><br>' + reactions.join('<br>') : ''),
      });
      const evtKey = tribe.tribeName;
      ep.campEvents[evtKey].post.push({
        text: `${leader} forced ${p1.strippers.filter(n => n !== leader).join(' and ')} to strip the guard after nobody volunteered.${leaderIncludesSelf ? ` ${leader} went too.` : ''}`,
        players: [leader, ...p1.strippers].filter((v, i, a) => a.indexOf(v) === i), badgeText: 'FORCED STRIP', badgeClass: 'badge-danger'
      });
    }

    // Beat 1: Approach
    const [sa, sb] = p1.strippers;
    const combinedSoc = (pStats(sa).social + pStats(sb).social) * 0.5 + (pStats(sa).boldness + pStats(sb).boldness) * 0.25 + noise(2.5);
    const smooth = combinedSoc > 5;
    p1.beats.push({
      beat: 'approach', smooth,
      text: smooth ? pick(TXT_STRIP_SMOOTH)(sa, sb) : pick(TXT_STRIP_FUMBLE)(sa, sb),
      score: smooth ? 2 : -1,
    });
    ep.chalMemberScores[sa] = (ep.chalMemberScores[sa] || 0) + (smooth ? 1 : 0);
    ep.chalMemberScores[sb] = (ep.chalMemberScores[sb] || 0) + (smooth ? 1 : 0);

    // Beat 2: Search
    const searcher = pStats(sa).intuition > pStats(sb).intuition ? sa : sb;
    const searchRoll = pStats(searcher).intuition * 0.1 + noise(2.5);
    const pr_s = pronouns(searcher);
    const clueContent = pick(CLUE_CONTENTS);
    let searchResult;
    if (searchRoll > 0.7) {
      searchResult = 'fast';
      p1.beats.push({ beat: 'search', result: 'fast', text: pick(TXT_CLUE_FAST)(searcher, pr_s, clueContent), score: 2 });
      ep.chalMemberScores[searcher] = (ep.chalMemberScores[searcher] || 0) + 2;
    } else if (searchRoll > 0.3) {
      searchResult = 'slow';
      p1.beats.push({ beat: 'search', result: 'slow', text: pick(TXT_CLUE_SLOW)(searcher, pr_s, clueContent), score: -1 });
      ep.chalMemberScores[searcher] = (ep.chalMemberScores[searcher] || 0) - 1;
    } else {
      searchResult = 'damaged';
      p1.clueQuality = 'damaged';
      p1.beats.push({ beat: 'search', result: 'damaged', text: pick(TXT_CLUE_CRIT)(searcher, pr_s, clueContent), score: -2 });
      ep.chalMemberScores[searcher] = (ep.chalMemberScores[searcher] || 0) - 2;
    }

    // Beat 3: Guard resistance — some guards fight back
    const guardResistRoll = Math.random();
    if (guardResistRoll > 0.5) {
      const resistText = pick([
        `The guard suddenly stiffens, locking ${sa}'s arm mid-reach. ${sb} has to pry the grip loose while ${sa} yelps.`,
        `The guard shifts weight at the worst moment, throwing ${sb} off balance. ${sa} catches ${pronouns(sa).posAdj} teammate before a full tumble.`,
        `A button snaps off and ricochets into the group. The guard's stoic expression never changes, but the tribe loses precious seconds.`,
        `The guard's belt buckle proves near-impossible. ${sa} and ${sb} both pull — it won't budge. Brute force finally wins, but time is lost.`,
      ]);
      const resistScore = -1;
      p1.beats.push({ beat: 'resistance', text: resistText, score: resistScore });
      ep.chalMemberScores[sa] = (ep.chalMemberScores[sa] || 0) - 1;
    }

    // Phase score for completion order
    let phaseScore = 0;
    for (const b of p1.beats) phaseScore += (b.score || 0);
    phaseScore += p1.volunteers.length * 0.5 + noise(2.5);
    p1.phaseScore = phaseScore;

    // Spectator social events (guaranteed 1, chance of 2nd)
    const spectators = tribe.members.filter(n => !p1.strippers.includes(n));
    if (spectators.length > 0) {
      const sp = pick(spectators);
      const spa = getArchetype(sp), spp = pronouns(sp);
      let spText;
      if (isVillain(spa)) spText = `${sp} watches with amusement. "This is the best entertainment we've had all season."`;
      else if (spa === 'hothead') spText = `${sp} heckles from the sideline. "Come ON! My grandmother could strip faster!"`;
      else if (isNice(spa)) spText = `${sp} covers ${spp.posAdj} eyes. "Tell me when it's over."`;
      else spText = `${sp} watches with clinical detachment. "Fascinating technique. Questionable execution."`;
      p1.socialEvents.push({ type: 'spectator', text: spText, players: [sp] });

      if (spectators.length >= 2 && Math.random() < 0.5) {
        const sp2 = spectators.find(n => n !== sp);
        if (sp2) {
          const sp2a = getArchetype(sp2), sp2p = pronouns(sp2);
          const reactionText = pick([
            `${sp2} turns to the group: "Should we... help?" Nobody answers.`,
            `${sp2} makes eye contact with ${sa} mid-strip. ${sp2p.Sub} immediately looks away.`,
            `${sp2} starts nervously narrating what's happening like a sports commentator. It helps nobody.`,
            `${sp2} paces behind the group, muttering strategy. "Go for the boots first! No, the hat! THE HAT!"`,
          ]);
          p1.socialEvents.push({ type: 'spectator-reaction', text: reactionText, players: [sp2] });
        }
      }
    }

    // Sabotage chance
    const rivalTribes = tribeData.filter(t => t.tribeName !== tribe.tribeName);
    if (rivalTribes.length > 0) {
      const rivalMembers = rivalTribes[0].members;
      const schemers = rivalMembers.filter(n => canScheme(n));
      if (schemers.length > 0 && Math.random() < 0.25) {
        const saboteur = pick(schemers);
        const sabRoll = pStats(saboteur).social * 0.1 + noise(2.5);
        const pr_sab = pronouns(saboteur);
        if (sabRoll > 0.4) {
          p1.sabotage = { by: saboteur, text: pick(TXT_SABOTAGE)(saboteur, pr_sab), success: true };
          p1.phaseScore -= 1.5;
          ep.chalMemberScores[saboteur] = (ep.chalMemberScores[saboteur] || 0) - 1;
          gs.popularity[saboteur] = (gs.popularity[saboteur] || 0) - 1;
        }
      }
    }

    result.phase1.tribes.push(p1);
  }

  // Determine Phase 1 completion order
  result.phase1.tribes.sort((a, b) => b.phaseScore - a.phaseScore);
  result.phase1.completionOrder = result.phase1.tribes.map((t, i) => ({ tribeName: t.tribeName, rank: i + 1, score: t.phaseScore }));
  result.phase1.tribes.forEach((t, i) => {
    t.finishRank = i + 1;
  });

  /* ─────────────────────────────────────── */
  /*  PHASE 2: TORTURE RACK                 */
  /* ─────────────────────────────────────── */
  for (let ti = 0; ti < tribeData.length; ti++) {
    const tribe = tribeData[ti];
    const p2 = { tribeName: tribe.tribeName, victim: null, cranker: null, intensity: 'normal', beats: [], socialEvents: [], extractionSpeed: 0 };

    // Victim selection (volunteer mechanic)
    let victimVolunteers = [];
    for (const name of tribe.members) {
      const s = pStats(name), a = getArchetype(name);
      let bonus = 0;
      if (a === 'hero') bonus = 0.2;
      if (a === 'loyal-soldier') bonus = 0.1;
      if (a === 'goat') bonus = -0.2;
      if (isVillain(a)) bonus = -0.15;
      const roll = s.boldness * 0.1 + bonus + noise(2.5);
      if (roll > 0.5) victimVolunteers.push({ name, roll });
    }

    if (victimVolunteers.length > 0) {
      victimVolunteers.sort((a, b) => b.roll - a.roll);
      p2.victim = victimVolunteers[0].name;
      ep.chalMemberScores[p2.victim] = (ep.chalMemberScores[p2.victim] || 0) + (getArchetype(p2.victim) === 'hero' ? 3 : 2);
      gs.popularity[p2.victim] = (gs.popularity[p2.victim] || 0) + 1;
    } else {
      // Lowest avg tribe bond gets pressured
      const bondAvgs = tribe.members.map(n => {
        const bonds = tribe.members.filter(m => m !== n).map(m => getBond(n, m));
        return { name: n, avg: bonds.reduce((s, v) => s + v, 0) / (bonds.length || 1) };
      });
      bondAvgs.sort((a, b) => a.avg - b.avg);
      p2.victim = bondAvgs[0].name;
      ep.chalMemberScores[p2.victim] = (ep.chalMemberScores[p2.victim] || 0) - 1;
      ep.campEvents[tribe.tribeName].post.push({
        text: `${p2.victim} was pressured onto the rack by ${pronouns(p2.victim).posAdj} tribe. Nobody volunteered.`,
        players: [p2.victim], badgeText: 'FORCED RACK', badgeClass: 'badge-danger'
      });
    }

    // Cranker selection
    const crankerCandidates = tribe.members.filter(n => n !== p2.victim);
    const cranker = crankerCandidates.sort((a, b) => {
      const bondA = getBond(a, p2.victim), bondB = getBond(b, p2.victim);
      const physA = pStats(a).physical, physB = pStats(b).physical;
      // Dislikers eager, likers hesitant
      return (bondA < -2 ? -10 : bondA > 3 ? 5 : 0) - (bondB < -2 ? -10 : bondB > 3 ? 5 : 0) + physB - physA;
    })[0];
    p2.cranker = cranker;
    ep.chalMemberScores[cranker] = (ep.chalMemberScores[cranker] || 0) + 1;

    // Determine intensity
    const crankerArch = getArchetype(cranker);
    const bondCV = getBond(cranker, p2.victim);
    if ((isNice(crankerArch) || bondCV > 3) && !isVillain(crankerArch)) {
      p2.intensity = 'gentle';
    } else if (isVillain(crankerArch) || (crankerArch === 'hothead' && bondCV < -2)) {
      p2.intensity = 'brutal';
    } else {
      p2.intensity = 'normal';
    }

    // Beat 1: Setup (victim on rack)
    const va = getArchetype(p2.victim);
    const vp = pronouns(p2.victim);
    const victimTextFn = TXT_RACK_VICTIM[va] || TXT_RACK_VICTIM['default'];
    p2.beats.push({ beat: 'setup', text: victimTextFn(p2.victim, vp) });

    // Beat 2: Cranking
    const physMult = p2.intensity === 'gentle' ? 0.5 : p2.intensity === 'brutal' ? 1.0 : 0.8;
    p2.extractionSpeed = pStats(cranker).physical * physMult + noise(2.5);
    const crankTexts = p2.intensity === 'gentle' ? TXT_CRANK_GENTLE : p2.intensity === 'brutal' ? TXT_CRANK_BRUTAL : TXT_CRANK_NORMAL;
    p2.beats.push({ beat: 'cranking', intensity: p2.intensity, text: pick(crankTexts)(cranker, p2.victim) });

    // Extraction quality — brutal gets more intel, gentle gets less
    let bonusClues = 0;
    let extractionQuality;
    if (p2.intensity === 'brutal') {
      bonusClues = p2.extractionSpeed > 5 ? 2 : 1;
      extractionQuality = 'thorough';
    } else if (p2.intensity === 'gentle') {
      bonusClues = 0;
      extractionQuality = p2.extractionSpeed > 6 ? 'partial' : 'minimal';
    } else {
      bonusClues = p2.extractionSpeed > 5.5 ? 1 : 0;
      extractionQuality = bonusClues > 0 ? 'solid' : 'basic';
    }
    p2.bonusClues = bonusClues;
    p2.extractionQuality = extractionQuality;
    result.phase3.tribeClues[tribe.tribeName] = (result.phase3.tribeClues[tribe.tribeName] || 0) + bonusClues;

    if (p2.intensity === 'gentle') {
      addBond(p2.victim, cranker, 0.5);
      p2.beats.push({
        beat: 'aftermath', intensity: 'gentle',
        text: pick([
          `${p2.victim} sits up slowly and nods at ${cranker}. "Thank you for... not making that worse than it had to be." The tribe's bond is intact — but the clue extraction was shallow.`,
          `As ${p2.victim} is helped off the rack, ${pronouns(p2.victim).sub} squeezes ${cranker}'s arm. A small gesture of gratitude. The mercy cost them detail — the clue is vague.`,
          `${cranker} offers a hand to help ${p2.victim} up. ${p2.victim} takes it. Something silent passes between them. But gentle cranking meant gentle results.`,
        ]),
        bondDelta: '+0.5',
      });
    } else if (p2.intensity === 'brutal') {
      addBond(p2.victim, cranker, -1.0);
      gs.popularity[cranker] = (gs.popularity[cranker] || 0) - 1;
      ep.chalMemberScores[cranker] = (ep.chalMemberScores[cranker] || 0) + 2;
      const victimReaction = pick([
        `${p2.victim} rolls off the rack, gasping. ${pronouns(p2.victim).Sub} locks eyes with ${cranker}. "${pick(["You enjoyed that.", "We're done. You and me.", "I won't forget this."])}" The words are quiet. That makes them worse. But every inch of that clue was extracted — crystal clear.`,
        `${cranker} steps back. ${p2.victim} lies still for a long moment, then slowly sits up. ${pronouns(p2.victim).Sub} doesn't look at ${cranker}. Doesn't need to. Everyone saw. But the rack gave up everything — the tribe enters the hunt with premium intelligence.`,
        `${p2.victim} staggers off the rack. ${pronouns(p2.victim).PosAdj} hands are shaking — from pain or rage, it's hard to tell. ${cranker} avoids eye contact. The cruelty worked — the clue is immaculate.`,
        `${p2.victim} pulls ${pronouns(p2.victim).ref} upright. The tribe watches in tense silence. ${p2.victim} walks past ${cranker} without a word — a silence louder than any threat. But the information? Flawless.`,
      ]);
      p2.beats.push({
        beat: 'aftermath', intensity: 'brutal',
        text: victimReaction,
        bondDelta: '-1.0',
      });
      ep.campEvents[tribe.tribeName].post.push({
        text: `${cranker} brutally cranked the rack on ${p2.victim}. ${p2.victim} won't forget — but the tribe got premium intel for the hunt.`,
        players: [cranker, p2.victim], badgeText: 'BRUTAL RACK', badgeClass: 'badge-danger'
      });
    } else {
      p2.beats.push({
        beat: 'aftermath', intensity: 'normal',
        text: pick([
          `${p2.victim} gets off the rack, rubbing ${pronouns(p2.victim).posAdj} shoulders. "Could've been worse, I guess." The extraction was workmanlike — decent intel, no drama.`,
          `${cranker} helps ${p2.victim} up. Neither looks thrilled, but the job's done. Standard extraction — nothing extra, nothing missing.`,
        ]),
      });
    }

    // Beat 3: Extraction
    const p1clue = result.phase1.tribes[ti]?.clueQuality || 'clean';
    const extractPenalty = p1clue === 'damaged' ? -2 : 0;
    const clueRef = result.phase1.tribes[ti]?.beats?.find(b => b.beat === 'search')?.text || '';
    const clueSnippet = clueRef.match(/"([^"]{10,60})"/) ? clueRef.match(/"([^"]{10,60})"/)[1] : '';
    p2.beats.push({
      beat: 'extraction',
      text: p1clue === 'damaged'
        ? `The damaged clue from Phase 1 makes extraction agonizing. Fragments must be pieced together — precious minutes lost.${clueSnippet ? ` What remains reads: "${clueSnippet}..."` : ''}`
        : `The clue emerges from the rack mechanism${clueSnippet ? ` — "${clueSnippet}."` : ' — coordinates for the hunt ahead.'} The tribe memorizes it quickly. Phase 3 awaits.`,
      penalty: extractPenalty,
    });

    // Spectator social events
    const spectators = tribe.members.filter(n => n !== p2.victim && n !== cranker);
    if (spectators.length > 0) {
      const sp = pick(spectators);
      const spa = getArchetype(sp);
      let spText;
      if (isVillain(spa) && getBond(sp, p2.victim) < 0) {
        spText = `${sp} watches ${p2.victim} suffer with barely concealed satisfaction. "Every cloud has a silver lining."`;
      } else if (isNice(spa)) {
        spText = `${sp} looks away. "This is too much. Can we just find the clue already?"`;
      } else {
        spText = `${sp} winces at every click of the mechanism but says nothing.`;
      }
      p2.socialEvents.push({ type: 'spectator', text: spText, players: [sp] });
    }

    result.phase2.tribes.push(p2);
  }

  // Romance between phases
  const _romActive = allActive;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'guard strip intimacy');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'midnight manhunt', _romActive);

  /* ─────────────────────────────────────── */
  /*  PHASE 3: WHITECHAPEL HUNT             */
  /* ─────────────────────────────────────── */
  const p3 = result.phase3;
  const caughtSet = new Set();
  const corgiStreetIdx = Math.floor(Math.random() * (STREETS.length - 1));
  p3.corgiStreet = STREETS[corgiStreetIdx].id;
  let corgiAllyPlayer = null;
  let corgiAllyTribe = null;

  // Player positions, per-player state
  const playerState = {};
  allActive.forEach(n => {
    const tribe = tribeData.find(t => t.members.includes(n));
    playerState[n] = {
      tribe: tribe?.tribeName,
      street: pick(STREETS).id,
      hadLoudEvent: false,
      caughtAct: null,
    };
  });

  const ACT_CONFIG = [
    { name: 'Searching', rounds: 2, catchAttempts: 2, stalkChance: 0.3, escapeThreshold: 0.7, catchPenalty: -3 },
    { name: 'Closing In', rounds: 3, catchAttempts: 2, stalkChance: 0.15, escapeThreshold: 0.55, catchPenalty: -4 },
    { name: 'Cornered', rounds: 2, catchAttempts: 3, stalkChance: 0, escapeThreshold: 0.55, catchPenalty: -5 },
  ];

  for (let actIdx = 0; actIdx < ACT_CONFIG.length; actIdx++) {
    const actCfg = ACT_CONFIG[actIdx];
    const act = { actNum: actIdx + 1, actName: actCfg.name, rounds: [] };

    if (actIdx === 2) {
      // Act 3: Cornered — desperate last-stand rounds, then tracking + capture
      // Phase A: The fugitive goes all-out — 2 rounds of desperate attacks before the end
      const act3FindPool = TXT_HUNT_FIND_ACT3;
      const act3MissPool = TXT_HUNT_MISS_ACT3;
      for (let rnd = 0; rnd < 2; rnd++) {
        const round = { roundNum: rnd + 1, events: [] };
        const act3Active = allActive.filter(n => !caughtSet.has(n));

        // Move players toward the depot (northeast streets)
        const depotStreets = STREETS.slice(Math.floor(STREETS.length / 2));
        for (const name of act3Active) {
          const intuWeight = pStats(name).intuition * 0.1 + noise(1.5);
          if (intuWeight > 0.3) {
            playerState[name].street = pick(depotStreets).id;
          } else {
            playerState[name].street = pick(STREETS).id;
          }
        }

        // Fewer investigation cards in Act 3 — only top investigators find anything
        for (const name of act3Active) {
          const s = pStats(name), pr = pronouns(name);
          const st = STREETS.find(st => st.id === playerState[name].street);
          const roll = s.intuition * 0.12 + s.mental * 0.06 + noise(2.0);
          if (roll > 0.65) {
            const tribe = playerState[name].tribe;
            p3.tribeClues[tribe] = (p3.tribeClues[tribe] || 0) + 1;
            ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
            round.events.push({ type: 'investigate-success', player: name, tribe: tribe, street: st.name, text: pick(act3FindPool)(name, st.name, pr) });
          } else if (Math.random() < 0.2) {
            round.events.push({ type: 'investigate-fail', player: name, tribe: playerState[name].tribe, street: st.name, text: pick(act3MissPool)(name, st.name, pr) });
          }
        }

        // Desperate fugitive attacks — 3 attempts per round, very hard to escape
        const act3Escaped = new Set();
        for (let catchAttempt = 0; catchAttempt < 3; catchAttempt++) {
          const remaining = act3Active.filter(n => !caughtSet.has(n) && !act3Escaped.has(n));
          if (remaining.length <= 2) break;

          const vulnScores = remaining.map(name => {
            const s = pStats(name), a = getArchetype(name);
            const ps = playerState[name];
            const isAlone = remaining.filter(m => m !== name && playerState[m].street === ps.street && playerState[m].tribe === ps.tribe).length === 0;
            let v = (10 - s.physical) * 0.1 + (10 - s.intuition) * 0.15;
            if (isAlone) v += 0.35;
            if (ps.hadLoudEvent) v += 0.2;
            if (ps.stalked) v += 0.2;
            if (['floater','goat','showmancer'].includes(a)) v += 0.2;
            if (['social-butterfly','underdog'].includes(a)) v += 0.05;
            if (['challenge-beast','hothead','hero'].includes(a)) v -= 0.1;
            if (a === 'perceptive-player') v -= 0.15;
            if (isVillain(a)) v -= 0.05;
            if (corgiAllyPlayer === name) v -= 0.25;
            v += noise(1.5);
            return { name, vulnerability: v };
          });
          vulnScores.sort((a, b) => b.vulnerability - a.vulnerability);
          const target = vulnScores[0]?.name;
          if (!target) continue;

          const s = pStats(target), pr = pronouns(target), a = getArchetype(target);
          let escapeBonus = s.intuition * 0.05 + s.boldness * 0.03 + s.physical * 0.03;
          if (a === 'perceptive-player') escapeBonus += 0.15;
          if (a === 'challenge-beast' || a === 'hothead') escapeBonus += 0.08;
          if (['floater','goat','showmancer'].includes(a)) escapeBonus -= 0.12;
          if (corgiAllyPlayer === target) escapeBonus += 0.1;
          if (playerState[target].stalked) escapeBonus -= 0.15;
          const escapeRoll = escapeBonus + noise(1.2);
          const st = STREETS.find(st => st.id === playerState[target].street);

          if (escapeRoll > 0.55) {
            act3Escaped.add(target);
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 2;
            gs.popularity[target] = (gs.popularity[target] || 0) + 1;
            round.events.push({ type: 'ripper-escape', player: target, tribe: playerState[target].tribe, street: st.name, text: pick(TXT_RIPPER_ESCAPE)(target, st.name, pr) });
          } else {
            caughtSet.add(target);
            playerState[target].caughtAct = 3;
            ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) - 5;
            gs.popularity[target] = (gs.popularity[target] || 0) - 1;
            p3.caughtPlayers.push({ name: target, act: 3, round: rnd + 1, street: st.name });
            round.events.push({ type: 'ripper-catch', player: target, tribe: playerState[target].tribe, street: st.name, text: pick(TXT_RIPPER_CATCH)(target, st.name, pr) });
          }
        }

        // Act 3 social — desperation-themed
        const act3Social = act3Active.filter(n => !caughtSet.has(n));
        if (act3Social.length >= 2) {
          const a = pick(act3Social);
          let b = pick(act3Social.filter(n => n !== a));
          if (!b) b = act3Social.find(n => n !== a);
          if (b) {
            const pA = pronouns(a);
            const socialText = pick([
              `${a} is running on adrenaline. ${pA.Sub} barely registers ${b} shouting — "THE DEPOT! HEAD FOR THE DEPOT!"`,
              `${a} and ${b} both break into a sprint toward the same sound. No more strategy — just survival.`,
              `"It's close!" ${b} screams. ${a} doesn't question it — ${pA.sub} just runs.`,
              `${a} grabs ${b}'s arm. "The bus — NOW." They bolt together through the thinning fog.`,
              `${a} sees ${b} stumble. For a heartbeat ${pA.sub} considers leaving ${b} behind — then reaches back and pulls ${b} to ${pronouns(b).posAdj} feet.`,
              `${a} and ${b} back into each other in the dark. Both scream. Both realize. Both laugh — then hear footsteps and run.`,
            ]);
            addBond(a, b, 0.5);
            round.events.push({ type: 'desperation', players: [a, b], text: socialText });
          }
        }

        // Snapshot positions
        round.positions = {};
        for (const name of allActive) {
          const stName = STREETS.find(s => s.id === playerState[name].street)?.name || 'Gaslight Row';
          round.positions[name] = { street: stName, tribe: playerState[name].tribe, caught: caughtSet.has(name) };
        }
        act.rounds.push(round);
      }

      // Phase B: Tracking
      const trackResults = [];
      for (const tribe of tribeData) {
        const remaining = tribe.members.filter(n => !caughtSet.has(n));
        if (remaining.length === 0) continue;
        const tracker = remaining.sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
        const clueBonus = (p3.tribeClues[tribe.tribeName] || 0) * 0.1;
        const trackRoll = pStats(tracker).intuition * 0.1 + pStats(tracker).mental * 0.05 + clueBonus + noise(2.5);
        trackResults.push({ tribe: tribe.tribeName, tracker, roll: trackRoll });
        ep.chalMemberScores[tracker] = (ep.chalMemberScores[tracker] || 0) + 3;
      }
      trackResults.sort((a, b) => b.roll - a.roll);
      p3.tracking = {
        results: trackResults,
        text: trackResults.map(tr => pick(TXT_TRACKING)(tr.tracker, pronouns(tr.tracker))),
      };

      // Phase C: Capture
      const captureOrder = trackResults.map(tr => tr.tribe);
      let captured = false;
      for (const tribeName of captureOrder) {
        const tribe = tribeData.find(t => t.tribeName === tribeName);
        const remaining = tribe.members.filter(n => !caughtSet.has(n));
        if (remaining.length === 0) continue;
        const hero = remaining.sort((a, b) => (pStats(b).physical + pStats(b).boldness) - (pStats(a).physical + pStats(a).boldness))[0];
        const corgiBonus = (corgiAllyTribe === tribeName) ? 0.3 : 0;
        const manpowerBonus = remaining.length * 0.05;
        const captureRoll = pStats(hero).physical * 0.1 + pStats(hero).boldness * 0.05 + corgiBonus + manpowerBonus + noise(2.5);
        if (captureRoll > 0.5 || captured === false) {
          p3.capture = {
            tribe: tribeName, hero, corgiAssist: corgiAllyTribe === tribeName && corgiAllyPlayer,
            roll: captureRoll, success: true,
            text: pick(TXT_CAPTURE_WIN)(hero, pronouns(hero), corgiAllyTribe === tribeName),
          };
          ep.chalMemberScores[hero] = (ep.chalMemberScores[hero] || 0) + 10;
          gs.popularity[hero] = (gs.popularity[hero] || 0) + 2;
          ep.campEvents[tribeName].post.push({
            text: `${hero} captured the fugitive! Capture hero of the Midnight Manhunt.`,
            players: [hero], badgeText: 'CAPTURE HERO', badgeClass: 'badge-success'
          });
          result.winningTribe = tribeName;
          captured = true;
          break;
        }
      }
      if (!captured && captureOrder.length > 0) {
        result.winningTribe = captureOrder[0];
        const tribe = tribeData.find(t => t.tribeName === captureOrder[0]);
        const hero = tribe.members.filter(n => !caughtSet.has(n))[0];
        p3.capture = { tribe: captureOrder[0], hero, success: true, text: `After a prolonged chase, ${hero} finally corners and bags the fugitive.` };
        ep.chalMemberScores[hero] = (ep.chalMemberScores[hero] || 0) + 10;
      }

      // Snapshot positions for tracking/capture rounds
      const act3Pos = {};
      for (const name of allActive) {
        const stName = STREETS.find(s => s.id === playerState[name].street)?.name || 'Gaslight Row';
        act3Pos[name] = { street: stName, tribe: playerState[name].tribe, caught: caughtSet.has(name) };
      }
      act.rounds.push({ roundNum: 3, type: 'tracking', data: p3.tracking, positions: act3Pos });
      act.rounds.push({ roundNum: 4, type: 'capture', data: p3.capture, positions: act3Pos });
      p3.acts.push(act);
      break;
    }

    for (let rnd = 0; rnd < actCfg.rounds; rnd++) {
      const round = { roundNum: rnd + 1, events: [] };

      // Move players to streets
      const activePlayers = allActive.filter(n => !caughtSet.has(n));
      for (const name of activePlayers) {
        const intuWeight = pStats(name).intuition * 0.1 + noise(2.5);
        const streetIdx = clamp(Math.floor(intuWeight * STREETS.length / 2), 0, STREETS.length - 1);
        playerState[name].street = STREETS[streetIdx].id;
      }

      // Investigation — act-specific text pools
      const actFindPool = actIdx === 0 ? TXT_HUNT_FIND_ACT1 : actIdx === 1 ? TXT_HUNT_FIND_ACT2 : TXT_HUNT_FIND_ACT3;
      const actMissPool = actIdx === 0 ? TXT_HUNT_MISS_ACT1 : actIdx === 1 ? TXT_HUNT_MISS_ACT2 : TXT_HUNT_MISS_ACT3;
      for (const name of activePlayers) {
        const s = pStats(name), pr = pronouns(name);
        const st = STREETS.find(st => st.id === playerState[name].street);
        const roll = s.intuition * 0.1 + s.mental * 0.05 + noise(2.5);
        if (roll > 0.5) {
          const tribe = playerState[name].tribe;
          p3.tribeClues[tribe] = (p3.tribeClues[tribe] || 0) + 1;
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
          round.events.push({ type: 'investigate-success', player: name, tribe: tribe, street: st.name, text: pick(actFindPool)(name, st.name, pr) });
        } else if (Math.random() < 0.35) {
          round.events.push({ type: 'investigate-fail', player: name, tribe: playerState[name].tribe, street: st.name, text: pick(actMissPool)(name, st.name, pr) });
        }
      }

      // Corgi encounter (Act 1 only, first round)
      if (actIdx === 0 && rnd === 0) {
        const corgiStreet = STREETS[corgiStreetIdx];
        const nearbyPlayers = activePlayers.filter(n => playerState[n].street === corgiStreet.id);
        if (nearbyPlayers.length === 0) {
          // Force one random player there
          const forced = pick(activePlayers);
          playerState[forced].street = corgiStreet.id;
          nearbyPlayers.push(forced);
        }
        for (const name of nearbyPlayers) {
          if (corgiAllyPlayer) break; // only 1-2 can befriend
          const s = pStats(name), pr = pronouns(name), a = getArchetype(name);
          let bonus = 0;
          if (['underdog','hero'].includes(a)) bonus = 0.2;
          const roll = s.social * 0.1 + s.intuition * 0.05 + bonus + noise(2.5);
          if (roll > 0.7) {
            corgiAllyPlayer = name;
            corgiAllyTribe = playerState[name].tribe;
            p3.corgiAlly = { name, tribe: corgiAllyTribe };
            ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;
            round.events.push({ type: 'corgi-befriend', player: name, tribe: playerState[name].tribe, street: corgiStreet.name, text: pick(TXT_CORGI_YES)(name, pr) });
          } else {
            ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) - 1;
            playerState[name].hadLoudEvent = true;
            round.events.push({ type: 'corgi-fail', player: name, tribe: playerState[name].tribe, street: corgiStreet.name, text: pick(TXT_CORGI_NO)(name, pr) });
          }
        }
      }

      // Fugitive stalking (builds dread before attacks — Act 1 & 2 only)
      if (actCfg.stalkChance > 0) {
        const stalkable = activePlayers.filter(n => !caughtSet.has(n));
        for (const name of stalkable) {
          if (Math.random() < actCfg.stalkChance) {
            const pr = pronouns(name);
            const st = STREETS.find(s => s.id === playerState[name].street);
            round.events.push({ type: 'ripper-stalk', player: name, tribe: playerState[name].tribe, street: st.name, text: pick(TXT_RIPPER_STALK)(name, st.name, pr) });
            playerState[name].stalked = true;
            break;
          }
        }
      }

      // Ripper attacks — fugitive targets the weakest, escalates each act
      const justEscaped = new Set();
      for (let catchAttempt = 0; catchAttempt < actCfg.catchAttempts; catchAttempt++) {
        const remaining = activePlayers.filter(n => !caughtSet.has(n) && !justEscaped.has(n));
        if (remaining.length <= 2) break;

        const vulnScores = remaining.map(name => {
          const s = pStats(name), a = getArchetype(name);
          const ps = playerState[name];
          const isAlone = remaining.filter(m => m !== name && playerState[m].street === ps.street && playerState[m].tribe === ps.tribe).length === 0;
          let v = (10 - s.physical) * 0.1 + (10 - s.intuition) * 0.15;
          if (isAlone) v += 0.3;
          if (ps.hadLoudEvent) v += 0.2;
          if (ps.stalked) v += 0.2;
          if (['floater','goat','showmancer'].includes(a)) v += 0.15;
          if (['social-butterfly','underdog'].includes(a)) v += 0.05;
          if (['challenge-beast','hothead','hero'].includes(a)) v -= 0.15;
          if (a === 'perceptive-player') v -= 0.2;
          if (isVillain(a)) v -= 0.1;
          if (corgiAllyPlayer === name) v -= 0.3;
          v += noise(2.0);
          return { name, vulnerability: v };
        });
        vulnScores.sort((a, b) => b.vulnerability - a.vulnerability);
        const target = vulnScores[0]?.name;
        if (!target) continue;

        const s = pStats(target), pr = pronouns(target), a = getArchetype(target);
        let escapeBonus = s.intuition * 0.06 + s.boldness * 0.03 + s.physical * 0.03;
        if (a === 'perceptive-player') escapeBonus += 0.2;
        if (a === 'challenge-beast' || a === 'hothead') escapeBonus += 0.1;
        if (['floater','goat','showmancer'].includes(a)) escapeBonus -= 0.1;
        if (corgiAllyPlayer === target) escapeBonus += 0.15;
        if (playerState[target].stalked) escapeBonus -= 0.15;
        const escapeRoll = escapeBonus + noise(1.6);
        const st = STREETS.find(st => st.id === playerState[target].street);

        if (escapeRoll > actCfg.escapeThreshold) {
          justEscaped.add(target);
          ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 2;
          gs.popularity[target] = (gs.popularity[target] || 0) + 1;
          round.events.push({ type: 'ripper-escape', player: target, tribe: playerState[target].tribe, street: st.name, text: pick(TXT_RIPPER_ESCAPE)(target, st.name, pr) });
        } else {
          caughtSet.add(target);
          playerState[target].caughtAct = actIdx + 1;
          ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + actCfg.catchPenalty;
          gs.popularity[target] = (gs.popularity[target] || 0) - 1;
          p3.caughtPlayers.push({ name: target, act: actIdx + 1, round: rnd + 1, street: st.name });
          round.events.push({ type: 'ripper-catch', player: target, tribe: playerState[target].tribe, street: st.name, text: pick(TXT_RIPPER_CATCH)(target, st.name, pr) });
        }
      }

      // Social events — act-aware, varied types
      const socialPlayers = activePlayers.filter(n => !caughtSet.has(n));
      if (socialPlayers.length >= 2) {
        const a = pick(socialPlayers);
        let b = pick(socialPlayers.filter(n => n !== a));
        if (!b) b = socialPlayers.find(n => n !== a);
        if (b) {
          const sameStreet = playerState[a].street === playerState[b].street;
          const sameTribe = playerState[a].tribe === playerState[b].tribe;
          const pA = pronouns(a), pB = pronouns(b);
          let socialText, socialType;
          if (sameStreet && sameTribe) {
            addBond(a, b, 0.5);
            socialType = 'fear-bonding';
            socialText = pick([
              `${a} and ${b} huddle together in the fog. Fear makes allies. They whisper about the fugitive's pattern.`,
              `${a} grabs ${b}'s arm in the darkness. "Stay close." They move as one — two sets of eyes better than one.`,
              `${b} is shaking. ${a} puts a hand on ${pB.posAdj} shoulder. "We've got this. Together." They press on side by side.`,
              `${a} and ${b} share a look. No words needed. They fall into formation — one watches forward, one watches back.`,
              `"Did you hear that?" ${a} whispers. ${b} nods. They back into a doorway together, hearts pounding in unison.`,
            ]);
          } else if (sameStreet && !sameTribe) {
            if (Math.random() < 0.4) {
              socialType = 'cross-tribe-truce';
              socialText = pick([
                `${a} and ${b} meet on the same street. A tense standoff — then ${a} offers a clue in exchange for safe passage.`,
                `${b} rounds a corner and nearly collides with ${a}. "I won't tell if you won't." They split without another word.`,
                `${a} finds ${b} crouched behind a barrel. Enemies by day, survivors by night. ${a} gestures: "That way is clear."`,
              ]);
            } else {
              addBond(a, b, -0.5);
              socialType = 'cross-tribe-taunt';
              socialText = pick([
                `${a} spots ${b} from the rival tribe. "Stay out of our way. These streets are ours tonight."`,
                `${a} deliberately kicks a stone toward ${b}. "Hope the fugitive finds YOU first."`,
                `${a} blocks ${b}'s path. "Wrong neighborhood." ${pA.Sub} cracks ${pA.posAdj} knuckles. ${b} takes a different route.`,
                `"Nice investigating," ${a} calls to ${b}. "Maybe try using your EYES." ${b}'s jaw tightens.`,
              ]);
            }
          } else {
            socialType = actIdx === 0 ? 'tension' : actIdx === 1 ? 'paranoia' : 'desperation';
            if (actIdx === 0) {
              socialText = pick([
                `${a} hears footsteps echo through the fog. ${pA.Sub} freezes, listening. Just ${b} passing through a nearby alley.`,
                `A gaslight sputters near ${a}. In the flash, ${pA.sub} catches a glimpse of ${b} two streets over. Both freeze. Both exhale.`,
                `${a} sees a shape in the fog and nearly screams. It's ${b}, looking equally terrified. They nod and move apart.`,
                `${a} presses flat against a wall as footsteps approach. ${b}'s lantern swings past. Neither acknowledges the other.`,
              ]);
            } else if (actIdx === 1) {
              socialText = pick([
                `${a} can't shake the feeling of being watched. Every alley could be the fugitive — or just ${b} hunting nearby.`,
                `${a} and ${b} end up in adjacent alleys. Through the wall, ${a} hears ${b} breathing fast. Neither is doing well.`,
                `${a} startles at a noise. ${pA.Sub} grips ${pA.posAdj} lantern like a weapon. It's just ${b} — but ${pA.posAdj} hands won't stop shaking.`,
                `${a} spots ${b} sprinting across an intersection. Running FROM something? Or just running? ${a} picks up the pace.`,
              ]);
            } else {
              socialText = pick([
                `${a} is running on adrenaline. ${pA.Sub} barely registers ${b} shouting from across the street — "THE DEPOT! HEAD FOR THE DEPOT!"`,
                `${a} and ${b} both break into a sprint toward the same sound. Cooperation is no longer optional — survival is.`,
                `"It's over there!" ${b} screams. ${a} doesn't question it — ${pA.sub} just runs.`,
                `${a} grabs ${b}'s arm. "The bus — NOW." They bolt together through the thinning fog.`,
              ]);
            }
          }
          round.events.push({ type: socialType, players: [a, b], text: socialText });
          playerState[a].hadLoudEvent = socialType === 'cross-tribe-taunt';
        }
      }

      // Snapshot all player positions for map
      round.positions = {};
      for (const name of allActive) {
        const stName = STREETS.find(s => s.id === playerState[name].street)?.name || 'Gaslight Row';
        round.positions[name] = { street: stName, tribe: playerState[name].tribe, caught: caughtSet.has(name) };
      }
      act.rounds.push(round);
    }

    p3.acts.push(act);
  }

  // Determine winner + rank all tribes by avg score
  const tribeRankings = tribeData.map(t => {
    const memberScores = t.members.map(n => ep.chalMemberScores[n] || 0);
    const avg = memberScores.length > 0 ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length : 0;
    return { tribeName: t.tribeName, avg, members: t.members };
  });
  tribeRankings.sort((a, b) => {
    if (a.tribeName === result.winningTribe) return -1;
    if (b.tribeName === result.winningTribe) return 1;
    return b.avg - a.avg;
  });
  result.losingTribes = tribeRankings.filter(t => t.tribeName !== result.winningTribe).map(t => t.tribeName);
  result.tribeRankings = tribeRankings;
  const lastTribe = tribeRankings[tribeRankings.length - 1];
  result.tribalTribe = lastTribe.tribeName;
  result.safeTribes = tribeRankings.slice(0, -1).map(t => t.tribeName);

  // Set ep fields
  ep.midnightManhunt = result;
  ep.isMidnightManhunt = true;
  ep.challengeType = 'midnight-manhunt';
  ep.challengeLabel = 'Midnight Manhunt';
  ep.challengeCategory = 'mixed';
  // PRE-MERGE: NO ep.immunityWinner!
  ep.challengeData = result;

  // chalPlacements
  const sortedScores = Object.entries(ep.chalMemberScores).sort((a, b) => b[1] - a[1]);
  ep.chalPlacements = sortedScores.map(([n]) => n);

  // Tribe results for voting — only the worst tribe goes to tribal
  const loserGsTribe = gs.tribes.find(t => t.tribeName === lastTribe.tribeName);
  ep.tribalPlayers = loserGsTribe ? [...loserGsTribe.members] : allActive;
  ep.winner = gs.tribes.find(t => t.tribeName === result.winningTribe);
  ep.loser = loserGsTribe;
  ep.safeTribes = tribeRankings.slice(0, -1).map(t => gs.tribes.find(gt => gt.tribeName === t.tribeName)).filter(Boolean);
  ep.challengePlacements = tribeRankings.map(t => gs.tribes.find(gt => gt.tribeName === t.tribeName)).filter(Boolean);

  // Romance hooks (end of challenge)
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'manhunt aftermath');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'midnight manhunt', _romActive);

  updateChalRecord(ep);
  return ep;
}

/* ═══════════════════════════════════════════════════════════════ */
/*  VP PRESENTATION                                               */
/* ═══════════════════════════════════════════════════════════════ */

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`mm-step-${suffix}-${i}`);
    if (el) el.classList.add('mm-visible');
  }
  const counter = document.getElementById(`mm-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`mm-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.mm-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

export function mmRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('mm-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch(e) {}
  try { _updateSidebar(screenKey); } catch(e) {}
  try { if (screenKey === 'mm-hunt') _updateMap(screenKey); } catch(e) {}
  const el = document.getElementById(`mm-step-${suffix}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function mmRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('mm-', '');
  try { _reapplyVisibility(suffix, st.idx, st.total); } catch(e) {}
  try { _updateSidebar(screenKey); } catch(e) {}
  try { if (screenKey === 'mm-hunt') _updateMap(screenKey); } catch(e) {}
}

function _updateSidebar(screenKey) {
  const el = document.getElementById('mm-sidebar-inner');
  if (!el) return;
  const epNum = window.vpEpNum;
  const epRec = gs.episodeHistory[epNum - 1];
  if (!epRec?.midnightManhunt) return;
  const phase = document.querySelector('[data-mm-phase]')?.dataset.mmPhase || 'title';
  el.innerHTML = _buildSidebarContent(epRec, phase, screenKey);
}

/* ─── SVG Icon helpers ─── */
function _svgMagnify(color = '#b8962e') {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="${color}" stroke-width="1.5" fill="none"/><line x1="11" y1="11" x2="15" y2="15" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
}
function _svgKnife(color = '#c02020') {
  return `<svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 0 L10 12 L7 11 L4 12 Z" fill="${color}"/><rect x="5.5" y="12" width="3" height="5" rx="1" fill="rgba(120,80,40,.6)"/><line x1="4" y1="14" x2="10" y2="14" stroke="rgba(120,80,40,.6)" stroke-width="1.5"/></svg>`;
}
function _svgPaw(color = '#b8962e') {
  return `<svg width="16" height="14" viewBox="0 0 16 14" fill="none"><ellipse cx="8" cy="10" rx="5" ry="3" fill="${color}"/><circle cx="4" cy="5" r="1.8" fill="${color}"/><circle cx="7" cy="3.5" r="1.8" fill="${color}"/><circle cx="10.5" cy="3.5" r="1.8" fill="${color}"/><circle cx="13" cy="5" r="1.8" fill="${color}"/></svg>`;
}
function _svgHandcuffs(color = '#3a7a3a') {
  return `<svg width="18" height="14" viewBox="0 0 18 14" fill="none"><circle cx="5" cy="8" r="4" stroke="${color}" stroke-width="1.5" fill="none"/><circle cx="13" cy="8" r="4" stroke="${color}" stroke-width="1.5" fill="none"/><line x1="8" y1="6" x2="10" y2="6" stroke="${color}" stroke-width="2"/></svg>`;
}
function _svgSpeech(color = '#5c3d2e') {
  return `<svg width="16" height="14" viewBox="0 0 16 14" fill="none"><rect x="1" y="1" width="13" height="9" rx="2" stroke="${color}" stroke-width="1.5" fill="none"/><polygon points="4,10 7,13 3,13" fill="${color}"/></svg>`;
}
function _svgTelegram(color = '#3a2a18') {
  return `<svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="1" y="1" width="14" height="10" rx="1" stroke="${color}" stroke-width="1.5" fill="none"/><polyline points="1,1 8,7 15,1" stroke="${color}" stroke-width="1" fill="none"/></svg>`;
}
function _svgGavel(color = '#5c3d2e') {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="4" rx="1" fill="${color}"/><rect x="7" y="5" width="2" height="7" fill="${color}"/><rect x="4" y="12" width="8" height="2" rx="1" fill="${color}" opacity=".5"/></svg>`;
}
function _svgShield(color = '#3a7a3a') {
  return `<svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M7 1 L13 4 L13 9 Q13 14 7 15 Q1 14 1 9 L1 4 Z" stroke="${color}" stroke-width="1.5" fill="none"/><path d="M5 8 L7 10 L10 5" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function _svgSkull(color = '#8a1818') {
  return `<svg width="14" height="16" viewBox="0 0 14 16" fill="none"><ellipse cx="7" cy="7" rx="6" ry="6.5" stroke="${color}" stroke-width="1.3" fill="none"/><circle cx="5" cy="6.5" r="1.5" fill="${color}"/><circle cx="9" cy="6.5" r="1.5" fill="${color}"/><path d="M5 11 Q7 13 9 11" stroke="${color}" stroke-width="1" fill="none"/><line x1="6" y1="13" x2="6" y2="15" stroke="${color}" stroke-width="1"/><line x1="8" y1="13" x2="8" y2="15" stroke="${color}" stroke-width="1"/></svg>`;
}
function _svgCrown(color = '#b8962e') {
  return `<svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1 10 L3 3 L5.5 6 L8 1 L10.5 6 L13 3 L15 10 Z" fill="${color}" opacity=".3" stroke="${color}" stroke-width="1.2"/></svg>`;
}
function _svgRack(color = '#5c3d2e') {
  return `<svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="1" y="3" width="14" height="2" rx="1" fill="${color}"/><rect x="1" y="7" width="14" height="2" rx="1" fill="${color}"/><circle cx="3" cy="4" r="1.5" stroke="${color}" stroke-width="1" fill="none"/><circle cx="13" cy="8" r="1.5" stroke="${color}" stroke-width="1" fill="none"/><line x1="3" y1="4" x2="13" y2="8" stroke="${color}" stroke-width=".8" stroke-dasharray="2,2"/></svg>`;
}
function _svgTopHat(color = '#1a1410') {
  return `<svg width="16" height="14" viewBox="0 0 16 14" fill="none"><rect x="4" y="2" width="8" height="8" rx="1" fill="${color}"/><rect x="1" y="10" width="14" height="3" rx="1" fill="${color}"/><rect x="5" y="7" width="6" height="1" fill="rgba(184,150,46,.4)"/></svg>`;
}
function _svgWatch(color = '#b8962e') {
  return `<svg width="14" height="16" viewBox="0 0 14 16" fill="none"><circle cx="7" cy="9" r="5.5" stroke="${color}" stroke-width="1.5" fill="none"/><line x1="7" y1="9" x2="7" y2="5.5" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/><line x1="7" y1="9" x2="9.5" y2="9" stroke="${color}" stroke-width="1" stroke-linecap="round"/><rect x="5.5" y="1" width="3" height="3" rx="1" fill="${color}"/></svg>`;
}

/* ─── Street Map System ─── */
const STREET_COORDS = {
  'Gaslight Row':    { x: 200, y: 50 },
  'Brass Alley':     { x: 120, y: 110 },
  'Chandler Lane':   { x: 280, y: 110 },
  'Inkwell Court':   { x: 440, y: 110 },
  'Whitechapel Row': { x: 360, y: 110 },
  'Boiler Passage':  { x: 500, y: 170 },
  'Mitre Square':    { x: 600, y: 110 },
  'Bus Depot':       { x: 700, y: 170 },
};
const MAP_START = { x: 50, y: 50 }; // Tower Gate

function _buildMapSvg(tribes, allPlayers) {
  const TRIBE_COLORS = ['#2848a0','#a03030','#2a8a2a','#8a6e1a'];
  let svg = `<svg id="mm-map-svg" viewBox="0 0 780 220" style="display:block;width:100%;">
  <defs>
    <radialGradient id="mm-fog-of-war" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="transparent"/><stop offset="60%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(200,186,158,0.5)"/>
    </radialGradient>
    <radialGradient id="mm-lamp-glow">
      <stop offset="0%" stop-color="rgba(212,168,48,0.2)"/><stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="780" height="220" fill="#d4c4a0"/>
  <rect width="780" height="220" fill="url(#mm-fog-of-war)"/>

  <!-- Streets -->
  <path d="M40 50 Q200 48 400 51 Q600 49 740 50" stroke="#5c3d2e" stroke-width="8" fill="none" opacity=".15"/>
  <path d="M40 110 Q180 108 350 112 Q550 109 740 110" stroke="#5c3d2e" stroke-width="10" fill="none" opacity=".15"/>
  <path d="M40 170 Q250 168 500 172 Q650 169 740 170" stroke="#5c3d2e" stroke-width="7" fill="none" opacity=".15"/>
  <path d="M120 30 Q118 80 121 130 Q119 170 120 200" stroke="#5c3d2e" stroke-width="5" fill="none" opacity=".12"/>
  <path d="M280 30 Q282 90 279 140 Q281 180 280 200" stroke="#5c3d2e" stroke-width="5" fill="none" opacity=".12"/>
  <path d="M440 30 Q438 70 441 120 Q439 160 440 200" stroke="#5c3d2e" stroke-width="6" fill="none" opacity=".12"/>
  <path d="M600 30 Q602 80 599 130 Q601 175 600 200" stroke="#5c3d2e" stroke-width="5" fill="none" opacity=".12"/>

  <!-- Buildings -->
  <rect x="50" y="55" width="60" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>
  <line x1="55" y1="60" x2="105" y2="100" stroke="#3a2a18" stroke-width=".5" opacity=".1"/>
  <line x1="105" y1="60" x2="55" y2="100" stroke="#3a2a18" stroke-width=".5" opacity=".1"/>
  <rect x="140" y="55" width="130" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>
  <rect x="300" y="55" width="130" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>
  <rect x="460" y="55" width="130" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>
  <rect x="50" y="115" width="60" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>
  <rect x="140" y="115" width="130" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>
  <rect x="300" y="115" width="130" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>
  <rect x="460" y="115" width="130" height="50" fill="none" stroke="#3a2a18" stroke-width="1.5" opacity=".3"/>

  <!-- Street names -->
  <text x="200" y="45" fill="#5c3d2e" font-family="IM Fell English" font-size="9" font-style="italic" opacity=".5">Gaslight Row</text>
  <text x="350" y="106" fill="#5c3d2e" font-family="IM Fell English" font-size="10" font-style="italic" opacity=".6">Whitechapel Row</text>
  <text x="500" y="166" fill="#5c3d2e" font-family="IM Fell English" font-size="9" font-style="italic" opacity=".5">Boiler Passage</text>
  <text x="115" y="22" fill="#5c3d2e" font-family="IM Fell English" font-size="8" font-style="italic" opacity=".4" transform="rotate(-90 115 22)">Brass Alley</text>
  <text x="275" y="22" fill="#5c3d2e" font-family="IM Fell English" font-size="8" font-style="italic" opacity=".4" transform="rotate(-90 275 22)">Chandler La.</text>
  <text x="435" y="22" fill="#5c3d2e" font-family="IM Fell English" font-size="8" font-style="italic" opacity=".4" transform="rotate(-90 435 22)">Inkwell Ct.</text>
  <text x="595" y="22" fill="#5c3d2e" font-family="IM Fell English" font-size="8" font-style="italic" opacity=".4" transform="rotate(-90 595 22)">Mitre Sq.</text>

  <!-- Gas lamps -->
  <g transform="translate(80,42)" opacity=".35"><rect x="-1" y="0" width="2" height="10" fill="#5c3d2e"/><rect x="-4" y="-2" width="8" height="4" rx="2" fill="none" stroke="#5c3d2e" stroke-width="1"/><circle cx="0" cy="0" r="6" fill="url(#mm-lamp-glow)"/></g>
  <g transform="translate(350,42)" opacity=".35"><rect x="-1" y="0" width="2" height="10" fill="#5c3d2e"/><rect x="-4" y="-2" width="8" height="4" rx="2" fill="none" stroke="#5c3d2e" stroke-width="1"/><circle cx="0" cy="0" r="6" fill="url(#mm-lamp-glow)"/></g>
  <g transform="translate(550,162)" opacity=".35"><rect x="-1" y="0" width="2" height="10" fill="#5c3d2e"/><rect x="-4" y="-2" width="8" height="4" rx="2" fill="none" stroke="#5c3d2e" stroke-width="1"/><circle cx="0" cy="0" r="6" fill="url(#mm-lamp-glow)"/></g>

  <!-- Location nodes -->
  <circle cx="50" cy="50" r="8" fill="none" stroke="#8a6e1a" stroke-width="2" opacity=".6"/>
  <text x="50" y="53" text-anchor="middle" fill="#5c3d2e" font-family="Courier Prime" font-size="7" font-weight="700">T</text>

  <!-- Bus Depot — pulsing target -->
  <circle cx="700" cy="170" r="10" fill="none" stroke="#3a7a3a" stroke-width="2" opacity=".5">
    <animate attributeName="r" values="10;13;10" dur="2.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values=".5;.8;.5" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  <text x="700" y="188" text-anchor="middle" fill="#3a7a3a" font-family="Courier Prime" font-size="8" font-weight="700" opacity=".6">BUS DEPOT</text>

  <!-- Compass rose -->
  <g transform="translate(740,30)" opacity=".25">
    <line x1="0" y1="-12" x2="0" y2="12" stroke="#5c3d2e" stroke-width="1"/>
    <line x1="-12" y1="0" x2="12" y2="0" stroke="#5c3d2e" stroke-width="1"/>
    <polygon points="0,-12 -3,-4 3,-4" fill="#5c3d2e"/>
    <text x="0" y="-14" text-anchor="middle" fill="#5c3d2e" font-family="IM Fell English" font-size="7">N</text>
  </g>

  <!-- Fugitive shadow (animated drift) -->
  <g id="mm-map-ripper" opacity=".15" style="transform:translate(500px,140px);transition:transform 1s ease,opacity .5s">
    <circle r="10" fill="rgba(138,24,24,.15)" stroke="none">
      <animate attributeName="opacity" values=".05;.3;.05" dur="4s" repeatCount="indefinite"/>
    </circle>
    <circle r="4" fill="rgba(138,24,24,.25)">
      <animate attributeName="opacity" values=".1;.4;.1" dur="4s" repeatCount="indefinite"/>
    </circle>
    <text y="3" text-anchor="middle" fill="#c02020" font-family="Courier Prime" font-size="7" font-weight="700" opacity=".6">?</text>
  </g>

  <!-- Catch X marks (hidden initially) -->`;

  for (const [name, c] of Object.entries(STREET_COORDS)) {
    const sid = name.replace(/\s+/g, '-').toLowerCase();
    svg += `\n  <g id="mm-map-x-${sid}" opacity="0" transform="translate(${c.x},${c.y})">
    <line x1="-6" y1="-6" x2="6" y2="6" stroke="#c02020" stroke-width="3" stroke-linecap="round"/>
    <line x1="6" y1="-6" x2="-6" y2="6" stroke="#c02020" stroke-width="3" stroke-linecap="round"/>
  </g>`;
  }

  // Corgi marker (hidden initially)
  svg += `\n  <g id="mm-map-corgi" opacity="0" style="transition:opacity .5s">
    <ellipse cx="0" cy="4" rx="4" ry="2.5" fill="#b8862e"/>
    <circle cx="-3" cy="-1" r="1.5" fill="#b8862e"/>
    <circle cx="0" cy="-2.5" r="1.5" fill="#b8862e"/>
    <circle cx="3" cy="-1" r="1.5" fill="#b8862e"/>
  </g>`;

  // Individual player markers — avatar photo in tribe-colored circle
  (allPlayers || []).forEach((p, pi) => {
    const tc = TRIBE_COLORS[p.ti] || '#5c3d2e';
    const slug = _slug(p.name);
    const clipId = `mm-clip-p-${pi}`;
    svg += `\n  <defs><clipPath id="${clipId}"><circle r="7"/></clipPath></defs>`;
    svg += `\n  <g id="mm-map-p-${pi}" style="transform:translate(${MAP_START.x}px,${MAP_START.y}px);transition:transform .8s cubic-bezier(.25,1,.5,1),opacity .4s" opacity=".8">
    <circle r="8" fill="${tc}" stroke="#e8d8b8" stroke-width="1.5"/>
    <image href="assets/avatars/${slug}.png" x="-7" y="-7" width="14" height="14" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>
    <circle r="7" fill="none" stroke="${tc}" stroke-width="1.5"/>
  </g>`;
  });

  // Catch flash overlay
  svg += `\n  <rect id="mm-map-catch-flash" x="0" y="0" width="780" height="220" fill="rgba(192,32,32,0)" pointer-events="none">
    <animate id="mm-catch-anim" attributeName="fill" values="rgba(192,32,32,0);rgba(192,32,32,.35);rgba(192,32,32,.15);rgba(192,32,32,0)" dur="0.8s" begin="indefinite" fill="freeze"/>
  </rect>`;

  svg += `\n</svg>`;
  return svg;
}

function _updateMap(screenKey) {
  const meta = window._mmHuntStepMeta || [];
  const positions = window._mmHuntPositions || [];
  const allPlayers = window._mmMapPlayers || [];
  const st = _tvState[screenKey];
  const revIdx = st ? st.idx : -1;

  // Find latest position snapshot index + event-specific data from stepMeta up to reveal
  let latestPosIdx = -1;
  const caughtAt = [];
  let corgiStreet = null;
  let ripperStreet = null;
  let justCaught = false;

  for (let i = 0; i <= revIdx && i < meta.length; i++) {
    const m = meta[i];
    if (m.posIdx !== undefined && m.posIdx >= 0) latestPosIdx = m.posIdx;
    if (m.type === 'ripper-catch') {
      caughtAt.push({ street: m.street, player: m.player });
      ripperStreet = m.street;
      if (i === revIdx) justCaught = true;
    }
    if (m.type === 'ripper-escape') ripperStreet = m.street;
    if (m.type === 'ripper-stalk') ripperStreet = m.street;
    if (m.type === 'corgi-befriend') corgiStreet = m.street;
  }

  // Position all player markers from snapshot
  const posSnap = latestPosIdx >= 0 ? positions[latestPosIdx] : null;
  const caughtNames = new Set(caughtAt.map(c => c.player));

  allPlayers.forEach((p, pi) => {
    const el = document.getElementById(`mm-map-p-${pi}`);
    if (!el) return;

    if (posSnap && posSnap[p.name]) {
      const pd = posSnap[p.name];
      const coords = STREET_COORDS[pd.street] || MAP_START;
      // Stagger players at same street so they don't overlap
      const sameStreetBefore = allPlayers.slice(0, pi).filter(op => posSnap[op.name]?.street === pd.street).length;
      const offX = (sameStreetBefore % 4) * 14 - 21;
      const offY = Math.floor(sameStreetBefore / 4) * 14 - 7;
      el.style.transform = `translate(${coords.x + offX}px,${coords.y + offY}px)`;

      if (caughtNames.has(p.name)) {
        el.setAttribute('opacity', '.2');
      } else {
        el.setAttribute('opacity', '.85');
      }
    } else {
      // No position yet — keep at start
      el.style.transform = `translate(${MAP_START.x}px,${MAP_START.y}px)`;
    }
  });

  // Move fugitive shadow
  const ripperEl = document.getElementById('mm-map-ripper');
  if (ripperEl) {
    if (ripperStreet) {
      const rc = STREET_COORDS[ripperStreet] || { x: 500, y: 140 };
      ripperEl.style.transform = `translate(${rc.x + 15}px,${rc.y - 10}px)`;
      ripperEl.style.transition = 'transform 1s ease, opacity .5s';
      ripperEl.setAttribute('opacity', '.4');
    } else {
      ripperEl.style.transform = `translate(500px,140px)`;
      ripperEl.setAttribute('opacity', '.15');
    }
  }

  // Show X marks at catch locations
  for (const c of caughtAt) {
    const sid = c.street.replace(/\s+/g, '-').toLowerCase();
    const xEl = document.getElementById(`mm-map-x-${sid}`);
    if (xEl) {
      xEl.setAttribute('opacity', '0.7');
      xEl.style.transition = 'opacity .3s';
    }
  }

  // Flash on fresh catch — red overlay + shake
  if (justCaught) {
    const flashAnim = document.getElementById('mm-catch-anim');
    if (flashAnim) flashAnim.beginElement();
    const mapSvg = document.getElementById('mm-map-svg');
    if (mapSvg) {
      mapSvg.style.animation = 'none';
      void mapSvg.offsetHeight;
      mapSvg.style.animation = 'mm-map-shake .4s ease-out';
    }
  }

  // Corgi marker
  const corgiEl = document.getElementById('mm-map-corgi');
  if (corgiEl && corgiStreet) {
    const cc = STREET_COORDS[corgiStreet] || { x: 120, y: 110 };
    corgiEl.style.transform = `translate(${cc.x - 15}px,${cc.y + 12}px)`;
    corgiEl.setAttribute('opacity', '.5');
  }
}

/* ─── Shell Wrapper (CSS + layout) ─── */
function _mmShell(content, ep, phase, sidebarHtml) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Courier+Prime:wght@400;700&family=Caveat:wght@400;500;600;700&display=swap');
.mm-shell{font-family:'Libre Baskerville',serif;color:#e8d8b8;max-width:1100px;margin:0 auto;position:relative;min-height:500px;overflow:clip;
  background:repeating-linear-gradient(90deg,transparent 0px,rgba(60,40,20,.15) 1px,transparent 2px,transparent 18px),
  repeating-linear-gradient(90deg,transparent 0px,rgba(40,25,12,.08) 1px,transparent 2px,transparent 60px),
  linear-gradient(180deg,#1a110a 0%,#2a1a0e 30%,#3a2818 60%,#2a1a0e 100%);
  border:3px solid #3a2a18;box-shadow:0 0 40px rgba(0,0,0,.8),inset 0 0 80px rgba(0,0,0,.6);}
.mm-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 600px 400px at 30% 20%,rgba(212,160,23,.06) 0%,transparent 100%),
  radial-gradient(ellipse 400px 300px at 70% 80%,rgba(138,24,24,.03) 0%,transparent 100%);}
.mm-layout{display:flex;position:relative;z-index:1;}
.mm-sidebar-col{width:290px;flex-shrink:0;position:sticky;top:50px;align-self:flex-start;
  background:repeating-linear-gradient(0deg,transparent 0px,transparent 18px,rgba(120,100,80,.15) 18px,rgba(120,100,80,.15) 20px),
  repeating-linear-gradient(90deg,transparent 0px,transparent 38px,rgba(120,100,80,.15) 38px,rgba(120,100,80,.15) 40px),
  linear-gradient(180deg,#4a2a1a 0%,#5a3a2a 20%,#3a2218 80%,#2a1810 100%);
  border-right:4px solid #3a2a18;box-shadow:inset 0 0 40px rgba(0,0,0,.5);padding:10px;overflow-y:auto;max-height:calc(100vh - 60px);}
.mm-main-col{flex:1;min-width:0;padding:12px 16px 80px;}
/* Cards */
.mm-card{position:relative;margin-bottom:12px;
  background:linear-gradient(135deg,#e8d8b8 0%,#d4c4a0 70%,#b8a880 100%);
  color:#1a1410;padding:12px 14px;border:1px solid #b8a880;
  box-shadow:3px 4px 12px rgba(0,0,0,.4),inset 0 0 20px rgba(0,0,0,.04);
  font-size:13px;line-height:1.6;}
.mm-card::after{content:'';position:absolute;top:-5px;left:14px;width:11px;height:11px;background:#d04040;border-radius:50%;
  box-shadow:0 2px 4px rgba(0,0,0,.4),inset 0 -2px 3px rgba(0,0,0,.2);}
.mm-card-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid rgba(60,40,20,.15);}
.mm-card-type{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#5c3d2e;}
.mm-card-body{position:relative;z-index:1;}
.mm-card-body strong{color:#1a1410;font-weight:700;}
.mm-card-body em{font-family:'Caveat',cursive;font-style:normal;font-size:16px;color:#5c3d2e;font-weight:500;}
.mm-card-ripper{background:linear-gradient(135deg,#2a1a14 0%,#1a1210 70%,#100a08 100%);color:#e8d8b8;border:2px solid #8a1818;
  box-shadow:3px 4px 12px rgba(0,0,0,.5),0 0 30px rgba(138,24,24,.1);}
.mm-card-ripper::after{background:#c02020;}
.mm-card-ripper .mm-card-type{color:#c02020;}
.mm-card-ripper strong{color:#e8d8b8;}
.mm-card-ripper em{color:rgba(232,216,184,.7);}
.mm-card-ripper .mm-card-head{border-bottom-color:rgba(192,32,32,.2);}
.mm-card-social{border:1px dashed #5c3d2e;border-left:3px solid #5c3d2e;}
.mm-card-social::after{background:#e8e0d0;}
.mm-card-corgi{border-left:4px solid #b8962e;}
.mm-card-capture{border:2px solid #3a7a3a;box-shadow:3px 4px 12px rgba(0,0,0,.4),0 0 20px rgba(58,122,58,.08);}
.mm-card-capture::after{background:#3a7a3a;}
.mm-card-capture .mm-card-type{color:#3a7a3a;}
.mm-card-telegram{background:linear-gradient(180deg,#f0e8d0,#e8dcc0);font-family:'Courier Prime',monospace;font-size:12px;
  line-height:1.7;text-transform:uppercase;letter-spacing:.5px;border:2px dashed #b8a880;}
.mm-card-telegram::after{background:#d4b030;}
.mm-card-foot{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(60,40,20,.1);position:relative;z-index:1;}
.mm-pin{display:inline-flex;align-items:center;gap:4px;padding:1px 6px 1px 2px;margin:1px 2px;
  background:#e8d8b8;border:1px solid #b8a880;box-shadow:1px 1px 3px rgba(0,0,0,.25);vertical-align:middle;}
.mm-pin img{border-radius:1px;border:1px solid rgba(90,60,40,.15);}
.mm-pin-label{font-family:'Courier Prime',monospace;font-size:9px;font-weight:700;color:#1a1410;letter-spacing:.5px;text-transform:uppercase;}
.mm-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;font-family:'Courier Prime',monospace;font-size:9px;letter-spacing:1px;border-radius:1px;}
.mm-badge-score{background:rgba(184,150,46,.15);color:#8a6e1a;border:1px solid rgba(184,150,46,.3);}
.mm-badge-bond{background:rgba(90,60,40,.1);color:#5c3d2e;border:1px solid rgba(90,60,40,.2);}
.mm-badge-pop{background:rgba(138,24,24,.1);color:#8a1818;border:1px solid rgba(138,24,24,.2);}
.mm-badge-camp{background:rgba(26,20,16,.08);color:#3a2a18;border:1px solid rgba(60,40,20,.15);}
.mm-stamp{position:absolute;top:8px;right:10px;font-family:'Courier Prime',monospace;font-size:11px;font-weight:700;
  letter-spacing:3px;text-transform:uppercase;padding:3px 10px;border:3px solid;transform:rotate(-8deg);opacity:.6;z-index:2;}
.mm-stamp-filed{color:#8a6e1a;border-color:#8a6e1a;}
.mm-stamp-urgent{color:#c02020;border-color:#c02020;}
.mm-stamp-closed{color:#3a7a3a;border-color:#3a7a3a;}
.mm-intel-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;margin-top:4px;
  font-family:'Courier Prime',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
  border:1px dashed;border-radius:1px;}
.mm-intel-thorough{background:rgba(58,122,58,.1);color:#3a7a3a;border-color:rgba(58,122,58,.3);}
.mm-intel-solid{background:rgba(184,150,46,.08);color:#8a6e1a;border-color:rgba(184,150,46,.25);}
.mm-intel-partial{background:rgba(180,120,40,.06);color:#8a6e1a;border-color:rgba(180,120,40,.2);}
.mm-intel-minimal{background:rgba(138,24,24,.06);color:#8a1818;border-color:rgba(138,24,24,.15);}
.mm-intel-basic{background:rgba(90,70,50,.05);color:#5c3d2e;border-color:rgba(90,70,50,.15);}
.mm-caught-flash{display:flex;align-items:center;gap:8px;margin-top:8px;padding:6px 10px;background:rgba(138,24,24,.15);border:1px solid #8a1818;}
.mm-caught-flash-x{font-family:'IM Fell English',serif;font-size:26px;font-weight:700;color:#c02020;line-height:1;}
.mm-caught-flash-info{font-family:'Courier Prime',monospace;font-size:10px;color:#c02020;letter-spacing:1px;}
.mm-street{display:inline-flex;align-items:center;gap:3px;padding:1px 7px;margin-right:3px;
  background:rgba(26,20,16,.06);border:1px solid rgba(60,40,20,.15);
  font-family:'Courier Prime',monospace;font-size:9px;color:#5c3d2e;letter-spacing:1px;}
.mm-vol-box{background:rgba(26,20,16,.04);border:1px dashed rgba(60,40,20,.15);padding:8px;margin:8px 0;position:relative;z-index:1;}
.mm-vol-title{font-family:'Courier Prime',monospace;font-size:10px;color:#5c3d2e;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;}
.mm-vol-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px;}
.mm-vol-slot{display:flex;align-items:center;gap:5px;padding:3px 6px;font-size:11px;border-radius:1px;}
.mm-vol-yes{background:rgba(58,122,58,.08);border:1px solid rgba(58,122,58,.2);color:#3a7a3a;}
.mm-vol-no{background:rgba(138,24,24,.05);border:1px solid rgba(138,24,24,.12);color:#8a1818;}
.mm-vol-press{background:rgba(184,150,46,.08);border:1px solid rgba(184,150,46,.15);color:#8a6e1a;}
.mm-rack-meter{display:flex;align-items:center;gap:6px;margin:6px 0;position:relative;z-index:1;}
.mm-rack-label{font-family:'Courier Prime',monospace;font-size:9px;color:#5c3d2e;letter-spacing:1px;text-transform:uppercase;width:55px;}
.mm-rack-bar{flex:1;height:9px;background:rgba(26,20,16,.08);border:1px solid rgba(60,40,20,.1);overflow:hidden;}
.mm-rack-fill{height:100%;}
.mm-rack-gentle{background:linear-gradient(90deg,#4a7a4a,#60a060);width:30%;}
.mm-rack-normal{background:linear-gradient(90deg,#a08030,#c8a030);width:60%;}
.mm-rack-brutal{background:linear-gradient(90deg,#a03030,#d04040);width:90%;}
.mm-flavor{font-family:'IM Fell English',serif;font-size:13px;font-style:italic;color:rgba(232,216,184,.6);text-align:center;padding:6px 16px;margin:8px 0;}
.mm-act-label{text-align:center;margin:10px 0;font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;}
.mm-act-badge{display:inline-block;padding:4px 14px;border:2px solid;}
.mm-step{opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s;}
.mm-step.mm-visible{opacity:1;transform:translateY(0);}
/* Section header */
.mm-section-h{font-family:'IM Fell English',serif;font-size:22px;color:#e8d8b8;text-align:center;letter-spacing:3px;margin-bottom:4px;}
.mm-section-sub{font-family:'Courier Prime',monospace;font-size:9px;color:#d4b040;letter-spacing:3px;text-transform:uppercase;text-align:center;margin-bottom:14px;}
/* Title card */
.mm-title{text-align:center;padding:16px 16px 20px;}
.mm-case-stamp{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border:1px solid #8a1818;font-family:'Courier Prime',monospace;font-size:9px;color:#c02020;letter-spacing:2px;text-transform:uppercase;transform:rotate(-2deg);opacity:.8;}
/* Manila folder */
.mm-folder{position:relative;max-width:480px;margin:0 auto 16px;
  background:linear-gradient(170deg,#e8dcc0 0%,#ddd0aa 40%,#d4c498 100%);
  border:1px solid #b8a878;border-radius:2px;padding:22px 24px 18px;
  box-shadow:3px 4px 14px rgba(0,0,0,.5),inset 0 0 30px rgba(0,0,0,.04);}
.mm-folder::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.7' numOctaves='4'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");opacity:.6;}
.mm-folder-tab{position:absolute;top:-18px;left:24px;background:linear-gradient(180deg,#d8cc9e,#c8bc8e);
  padding:3px 14px;border:1px solid #b8a878;border-bottom:none;border-radius:3px 3px 0 0;
  font-family:'Courier Prime',monospace;font-size:8px;letter-spacing:3px;color:#5c4a2e;text-transform:uppercase;}
.mm-folder-inner{position:relative;z-index:1;}
.mm-folder-stamp{position:absolute;top:8px;right:8px;
  font-family:'Courier Prime',monospace;font-size:14px;font-weight:700;color:#c02020;
  letter-spacing:2px;text-transform:uppercase;padding:4px 10px;
  border:4px solid #c02020;transform:rotate(-12deg);opacity:.7;
  background:rgba(192,32,32,.04);animation:mm-stamp-slam .6s .6s both cubic-bezier(.15,1.6,.35,1);}
@keyframes mm-stamp-slam{0%{transform:rotate(-20deg) scale(3);opacity:0;filter:blur(2px)}
  50%{transform:rotate(-10deg) scale(.9);opacity:.9;filter:blur(0)}
  70%{transform:rotate(-14deg) scale(1.05);opacity:.75}
  100%{transform:rotate(-12deg) scale(1);opacity:.7}}
.mm-folder-title{font-family:'IM Fell English',serif;font-size:32px;color:#1a1410;line-height:1.1;margin-bottom:4px;}
.mm-folder-sub{font-family:'IM Fell English',serif;font-size:13px;font-style:italic;color:#5c4a2e;letter-spacing:3px;margin-bottom:6px;}
.mm-folder-case{font-family:'Courier Prime',monospace;font-size:10px;color:#8a6e1a;letter-spacing:2px;text-transform:uppercase;
  padding:3px 8px;border:1px solid rgba(138,110,26,.2);display:inline-block;margin-bottom:6px;}
.mm-folder-desc{font-family:'IM Fell English',serif;font-size:12px;font-style:italic;color:#7a6a4a;border-top:1px solid rgba(90,60,40,.15);padding-top:6px;}
/* Evidence board (title card) */
.mm-eb{position:relative;max-width:520px;margin:0 auto 12px;padding:14px;
  background:repeating-linear-gradient(0deg,transparent 0px,transparent 18px,rgba(120,100,80,.12) 18px,rgba(120,100,80,.12) 20px),
  repeating-linear-gradient(90deg,transparent 0px,transparent 38px,rgba(120,100,80,.12) 38px,rgba(120,100,80,.12) 40px),
  linear-gradient(180deg,#4a2a1a 0%,#5a3a2a 50%,#3a2218 100%);
  border:3px solid #3a2a18;box-shadow:2px 3px 10px rgba(0,0,0,.5),inset 0 0 30px rgba(0,0,0,.3);}
.mm-eb-header{font-family:'Courier Prime',monospace;font-size:9px;letter-spacing:3px;color:rgba(232,216,184,.4);
  text-transform:uppercase;text-align:center;margin-bottom:10px;border-bottom:1px solid rgba(232,216,184,.08);padding-bottom:5px;}
.mm-eb-strings{position:absolute;top:30px;left:50%;transform:translateX(-50%);pointer-events:none;z-index:0;width:90%;height:auto;}
.mm-eb-grid{display:grid;gap:6px;position:relative;z-index:1;justify-items:center;}
.mm-eb-photo{background:#e8d8b8;padding:4px 4px 2px;box-shadow:2px 3px 8px rgba(0,0,0,.5);position:relative;width:72px;transition:transform .3s;}
.mm-eb-photo:hover{z-index:5;transform:rotate(0deg) scale(1.15)!important;}
.mm-eb-photo-pin{position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:10px;height:10px;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.4);z-index:2;}
.mm-eb-photo-img{width:100%;aspect-ratio:1;background:#d4c4a0;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.mm-eb-photo-img img{width:100%;height:100%;object-fit:contain;}
.mm-eb-photo-name{font-family:'Courier Prime',monospace;font-size:8px;color:#1a1410;text-align:center;margin-top:2px;letter-spacing:.5px;text-transform:uppercase;line-height:1.2;}
.mm-eb-photo-tribe{font-family:'Courier Prime',monospace;font-size:6px;text-align:center;letter-spacing:1px;text-transform:uppercase;opacity:.7;}
/* Desk artifacts */
.mm-desk-artifacts{display:flex;justify-content:center;gap:18px;margin:10px auto 0;max-width:400px;}
.mm-artifact{display:flex;flex-direction:column;align-items:center;gap:3px;opacity:.45;}
.mm-artifact span{font-family:'Courier Prime',monospace;font-size:7px;color:rgba(232,216,184,.5);letter-spacing:1px;text-transform:uppercase;}
.mm-artifact-watch svg{animation:mm-spin 12s linear infinite;}
@keyframes mm-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
/* Sidebar icon row */
.mm-sb-icons{display:flex;justify-content:center;gap:8px;margin:6px 0;opacity:.4;}
/* Fog wisps */
.mm-fog-layer{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
.mm-fog-w{position:absolute;height:2px;border-radius:50%;opacity:0;background:linear-gradient(90deg,transparent,rgba(180,170,155,.06),transparent);}
.mm-fog-w:nth-child(1){top:30%;left:-10%;width:250px;animation:mm-dr 20s 0s ease-in-out infinite;}
.mm-fog-w:nth-child(2){top:60%;left:-8%;width:200px;animation:mm-dr 16s 5s ease-in-out infinite;}
.mm-fog-w:nth-child(3){top:80%;left:-12%;width:230px;animation:mm-dr 22s 10s ease-in-out infinite;}
@keyframes mm-dr{0%{transform:translateX(-5%);opacity:0}15%{opacity:.4}85%{opacity:.4}100%{transform:translateX(110%);opacity:0}}
/* Motes */
.mm-mote{position:absolute;width:2px;height:2px;background:rgba(212,168,48,.2);border-radius:50%;opacity:0;}
.mm-mote:nth-child(4){left:20%;animation:mm-fl 11s 0s infinite;}
.mm-mote:nth-child(5){left:50%;animation:mm-fl 14s 3s infinite;}
.mm-mote:nth-child(6){left:80%;animation:mm-fl 12s 7s infinite;}
@keyframes mm-fl{0%{bottom:-3%;opacity:0}15%{opacity:.5}50%{opacity:.2;transform:translateX(10px)}100%{bottom:100%;opacity:0}}
@media(prefers-reduced-motion:reduce){.mm-fog-w,.mm-mote{animation:none!important;opacity:0!important;}.mm-folder-stamp{animation:none!important;transform:rotate(-12deg) scale(1)!important;opacity:.7!important;}#mm-map-svg{animation:none!important;}}
/* Sticky Map */
.mm-map-sticky{position:sticky;top:0;z-index:5;margin:0 -16px;
  background:#2a1c12;border-bottom:3px solid #5c3d2e;box-shadow:0 4px 20px rgba(0,0,0,.6);}
.mm-map-frame{position:relative;overflow:hidden;
  background:linear-gradient(135deg,#e8d8b8 0%,#d4c4a0 50%,#c8b890 100%);
  border:8px solid;border-image:linear-gradient(180deg,#6a4a28,#4a3018,#3a2010) 1;}
.mm-map-frame svg{display:block;width:100%;}
.mm-map-frame::before,.mm-map-frame::after{content:'';position:absolute;width:12px;height:12px;
  background:radial-gradient(circle,#d4b040,#8a6e1a);border-radius:50%;
  box-shadow:0 1px 3px rgba(0,0,0,.4);z-index:3;}
.mm-map-frame::before{top:6px;left:6px;}
.mm-map-frame::after{top:6px;right:6px;}
.mm-map-tack-bl,.mm-map-tack-br{position:absolute;width:12px;height:12px;
  background:radial-gradient(circle,#d4b040,#8a6e1a);border-radius:50%;
  box-shadow:0 1px 3px rgba(0,0,0,.4);z-index:3;}
.mm-map-tack-bl{bottom:6px;left:6px;}
.mm-map-tack-br{bottom:6px;right:6px;}
.mm-map-phase-label{position:absolute;top:8px;right:20px;
  font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:2px;
  color:#5c3d2e;text-transform:uppercase;
  background:rgba(232,216,184,.7);padding:2px 8px;border:1px solid #5c3d2e;z-index:4;}
@keyframes mm-map-shake{0%{transform:translateX(0)}15%{transform:translateX(-4px)}30%{transform:translateX(4px)}45%{transform:translateX(-3px)}60%{transform:translateX(2px)}75%{transform:translateX(-1px)}100%{transform:translateX(0)}}
/* Controls */
.mm-controls-bar{position:sticky;bottom:0;z-index:50;
  background:linear-gradient(to top,rgba(26,17,10,.98),rgba(26,17,10,.9));
  border-top:2px solid #8a6e1a;padding:8px 14px;display:flex;align-items:center;justify-content:center;gap:10px;}
.mm-btn{padding:7px 16px;border:1px solid rgba(184,150,46,.3);border-radius:1px;background:rgba(184,150,46,.06);
  color:#d4b040;cursor:pointer;font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;}
.mm-btn:hover{background:rgba(184,150,46,.15);border-color:#b8962e;}
.mm-counter{font-family:'Courier Prime',monospace;font-size:11px;color:rgba(232,216,184,.5);min-width:45px;text-align:center;}
/* Sidebar specific */
.mm-sb-title{font-family:'IM Fell English',serif;font-size:12px;color:rgba(232,216,184,.6);letter-spacing:2px;text-align:center;margin-bottom:3px;}
.mm-sb-sub{font-family:'Courier Prime',monospace;font-size:7px;color:rgba(232,216,184,.3);letter-spacing:3px;text-transform:uppercase;text-align:center;margin-bottom:8px;}
.mm-sb-label{font-family:'Courier Prime',monospace;font-size:9px;letter-spacing:3px;color:rgba(232,216,184,.5);text-transform:uppercase;text-align:center;margin:8px 0 5px;border-bottom:1px solid rgba(232,216,184,.08);padding-bottom:3px;}
.mm-sb-act{display:flex;align-items:center;justify-content:center;gap:5px;padding:5px;margin-bottom:8px;
  border:1px solid #8a1818;background:rgba(138,24,24,.06);font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c02020;}
.mm-sb-act-dot{width:5px;height:5px;background:#c02020;border-radius:50%;animation:mm-blink 1.2s infinite;}
@keyframes mm-blink{0%,100%{opacity:1}50%{opacity:.15}}
.mm-sb-clue-row{display:flex;align-items:center;gap:5px;margin-bottom:3px;}
.mm-sb-clue-tribe{font-family:'Courier Prime',monospace;font-size:9px;width:50px;text-align:right;letter-spacing:1px;}
.mm-sb-clue-bar{flex:1;height:7px;background:rgba(212,160,48,.06);border-radius:1px;overflow:hidden;}
.mm-sb-clue-fill{height:100%;border-radius:1px;}
.mm-sb-clue-n{font-family:'Courier Prime',monospace;font-size:9px;width:16px;color:rgba(232,216,184,.4);}
.mm-sb-wanted{background:linear-gradient(180deg,#e8d8b8,#d4c4a0,#b8a880);border:2px solid #5c3d2e;
  box-shadow:2px 3px 8px rgba(0,0,0,.5);padding:6px;margin-bottom:8px;position:relative;transform:rotate(-1deg);}
.mm-sb-wanted::before{content:'';position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:12px;height:12px;
  background:#d04040;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.4);z-index:2;}
.mm-sb-wanted h3{font-family:'IM Fell English',serif;font-size:18px;color:#1a1410;text-align:center;letter-spacing:3px;text-transform:uppercase;
  border-bottom:2px solid #3a2a18;padding-bottom:3px;margin-bottom:4px;}
.mm-sb-wanted-reward{display:inline-block;padding:1px 8px;border:2px solid #8a1818;color:#8a1818;
  font-family:'Courier Prime',monospace;font-size:11px;font-weight:700;letter-spacing:3px;transform:rotate(-4deg);position:absolute;top:6px;right:4px;}
.mm-sb-wanted-name{font-family:'IM Fell English',serif;font-size:11px;color:#1a1410;text-align:center;font-style:italic;margin-top:3px;}
.mm-sb-wanted-status{margin-top:4px;padding:3px 6px;background:rgba(138,24,24,.06);border:1px solid rgba(138,24,24,.2);
  font-family:'Courier Prime',monospace;font-size:9px;color:#c02020;text-align:center;letter-spacing:1px;text-transform:uppercase;}
.mm-sb-wanted-pin{position:relative;padding:2px 5px;margin-top:3px;background:rgba(232,216,184,.85);border:1px solid #b8a880;
  font-family:'Courier Prime',monospace;font-size:7px;color:#3a2a18;transform:rotate(1.5deg);box-shadow:1px 1px 2px rgba(0,0,0,.15);}
.mm-sb-wanted-pin::before{content:'';position:absolute;top:-3px;right:6px;width:6px;height:6px;background:#d4b030;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,.2);}
.mm-sb-polars{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:6px;}
.mm-sb-polar{background:#e8d8b8;padding:4px 4px 2px;box-shadow:2px 2px 6px rgba(0,0,0,.45);position:relative;font-size:0;}
.mm-sb-polar-img{width:100%;aspect-ratio:1;background:#d4c4a0;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.mm-sb-polar-img img{width:100%;height:100%;object-fit:contain;}
.mm-sb-polar-name{font-family:'Courier Prime',monospace;font-size:7px;color:#1a1410;text-align:center;margin-top:2px;letter-spacing:.5px;text-transform:uppercase;line-height:1.2;}
.mm-sb-polar::before{content:'';position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:9px;height:9px;border-radius:50%;
  box-shadow:0 1px 2px rgba(0,0,0,.4);z-index:2;background:var(--pin-color,#5c3d2e);}
.mm-sb-polar.caught .mm-sb-polar-img{opacity:.25;filter:grayscale(1);}
.mm-sb-polar.caught::after{content:'';position:absolute;top:4px;left:4px;right:4px;bottom:14px;z-index:3;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'%3E%3Cline x1='5' y1='5' x2='45' y2='45' stroke='%23c02020' stroke-width='5' stroke-linecap='round'/%3E%3Cline x1='45' y1='5' x2='5' y2='45' stroke='%23c02020' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E") center/contain no-repeat;}
.mm-sb-caught-gallery{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;}
.mm-sb-caught-photo{position:relative;width:52px;background:#e8d8b8;padding:3px 3px 10px;box-shadow:1px 1px 4px rgba(0,0,0,.4);}
.mm-sb-caught-photo-img{width:100%;aspect-ratio:1;background:#d4c4a0;display:flex;align-items:center;justify-content:center;
  font-family:'Courier Prime',monospace;font-size:12px;color:#5c3d2e;font-weight:700;}
.mm-sb-caught-photo-name{font-family:'Courier Prime',monospace;font-size:6px;color:#1a1410;text-align:center;margin-top:1px;text-transform:uppercase;}
.mm-sb-caught-x{position:absolute;top:3px;left:3px;right:3px;bottom:10px;pointer-events:none;z-index:3;}
.mm-sb-corgi{padding:5px 6px;margin-bottom:6px;background:rgba(180,140,80,.06);border:1px dashed rgba(180,140,80,.2);
  display:flex;align-items:center;gap:6px;font-family:'Courier Prime',monospace;font-size:8px;color:#d4b040;letter-spacing:1px;text-transform:uppercase;}
</style>
<div class="mm-shell" data-mm-phase="${phase}">
  <div class="mm-fog-layer">
    <div class="mm-fog-w"></div><div class="mm-fog-w"></div><div class="mm-fog-w"></div>
    <div class="mm-mote"></div><div class="mm-mote"></div><div class="mm-mote"></div>
  </div>
  <div class="mm-layout">
    <div class="mm-sidebar-col"><div id="mm-sidebar-inner">${sidebarHtml}</div></div>
    <div class="mm-main-col">${content}</div>
  </div>
</div>`;
}

/* ─── Sidebar Content Builder ─── */
function _buildSidebarContent(ep, phase, screenKey) {
  const d = ep.midnightManhunt;
  if (!d) return '';
  const tribes = d.tribes || [];
  const maxClues = 5;
  let h = '';

  h += `<div class="mm-sb-title">Midnight Manhunt</div>`;
  h += `<div class="mm-sb-sub">Criminal Investigation Board</div>`;

  // Compute hunt reveal state — accumulate data from stepMeta up to current reveal index
  const isHuntPhase = phase === 'hunt' || phase === 'results';
  let huntRevealClues = {};  // tribe → count
  let huntRevealCaught = []; // player names
  let huntRevealCorgi = null;
  let huntRevealCapture = false;
  let huntRevealActName = '';

  if (phase === 'hunt') {
    const meta = window._mmHuntStepMeta || [];
    const st = _tvState['mm-hunt'];
    const revIdx = st ? st.idx : -1;
    // Accumulate bonus clues from rack phase as baseline
    const rackTribes = d.phase2?.tribes || [];
    rackTribes.forEach(rt => {
      if (rt.bonusClues > 0) huntRevealClues[rt.tribeName] = (huntRevealClues[rt.tribeName] || 0) + rt.bonusClues;
    });
    for (let i = 0; i <= revIdx && i < meta.length; i++) {
      const m = meta[i];
      if (m.type === 'clue') huntRevealClues[m.tribe] = (huntRevealClues[m.tribe] || 0) + 1;
      if (m.type === 'ripper-catch') huntRevealCaught.push(m.player);
      if (m.type === 'corgi-befriend') huntRevealCorgi = m.player;
      if (m.type === 'capture') huntRevealCapture = true;
      if (m.type === 'act-header') huntRevealActName = m.actName;
    }
  } else if (phase === 'results') {
    // Results screen — show everything
    tribes.forEach(t => { huntRevealClues[t.tribeName] = d.phase3.tribeClues[t.tribeName] || 0; });
    huntRevealCaught = d.phase3.caughtPlayers.map(c => c.name);
    huntRevealCorgi = d.phase3.corgiAlly?.name || null;
    huntRevealCapture = !!d.phase3.capture?.success;
  }

  // Pocket watch (simplified for sidebar)
  const actName = phase === 'hunt'
    ? (huntRevealCapture ? 'Cornered' : huntRevealActName || 'Searching')
    : phase === 'rack' ? 'The Rack' : phase === 'guard' ? 'Guard Strip' : phase === 'results' ? 'Case Closed' : 'Case Brief';
  h += `<div class="mm-sb-act"><div class="mm-sb-act-dot"></div>${actName}</div>`;

  // Wanted poster
  let ripperStatus = 'AT LARGE';
  if (phase === 'hunt') {
    ripperStatus = huntRevealCapture ? 'CAPTURED' : huntRevealCaught.length > 0 ? 'STALKING' : (huntRevealActName === 'Closing In' ? 'HUNTING' : 'AT LARGE');
  } else if (phase === 'results') {
    ripperStatus = d.phase3.capture?.success ? 'CAPTURED' : 'AT LARGE';
  }
  h += `<div class="mm-sb-wanted">`;
  h += `<h3>Wanted</h3>`;
  h += `<div class="mm-sb-wanted-reward">REWARD</div>`;
  h += `<svg width="70" height="80" viewBox="0 0 70 80" style="display:block;margin:2px auto;"><rect x="20" y="6" width="30" height="4" rx="1" fill="#1a1410"/><rect x="23" y="0" width="24" height="9" rx="2" fill="#3a2a18" opacity=".7"/><ellipse cx="35" cy="18" rx="10" ry="9" fill="#1a1410"/><path d="M14 50 Q18 30 35 28 Q52 30 56 50 L60 80 L10 80 Z" fill="#3a2a18" opacity=".7"/><text x="35" y="60" text-anchor="middle" fill="#8a1818" font-family="IM Fell English" font-size="22" opacity=".5">?</text></svg>`;
  h += `<div class="mm-sb-wanted-name">"The Fugitive"</div>`;
  h += `<div class="mm-sb-wanted-status">▸ ${ripperStatus}</div>`;
  if (isHuntPhase) {
    const clueTotal = Object.values(huntRevealClues).reduce((s, v) => s + v, 0);
    if (clueTotal > 0) h += `<div class="mm-sb-wanted-pin">EVIDENCE: ${clueTotal} clue${clueTotal > 1 ? 's' : ''} gathered</div>`;
  }
  h += `</div>`;

  // Evidence icon row
  h += `<div class="mm-sb-icons">${_svgMagnify('#d4b040')} ${_svgTopHat('#d4b040')} ${_svgKnife('#d4b040')} ${_svgPaw('#d4b040')} ${_svgHandcuffs('#d4b040')} ${_svgWatch('#d4b040')}</div>`;

  // Player polaroids — grouped by tribe
  h += `<div class="mm-sb-label">— Evidence Board —</div>`;
  const TRIBE_COLORS = ['#2848a0','#a03030','#2a8a2a','#8a6e1a'];
  tribes.forEach((tribe, ti) => {
    const tc = TRIBE_COLORS[ti] || '#5c3d2e';
    const tn = tribe.tribeName || '???';
    h += `<div style="font-family:'Courier Prime',monospace;font-size:7px;letter-spacing:2px;text-transform:uppercase;color:${tc};text-align:center;margin:6px 0 3px;border-bottom:1px solid ${tc}33;padding-bottom:2px">${tn}</div>`;
    h += `<div class="mm-sb-polars">`;
    tribe.members.forEach(name => {
      const isCaught = isHuntPhase && huntRevealCaught.includes(name);
      const tilt = ((name.length * 7 + ti * 3) % 7 - 3).toFixed(1);
      h += `<div class="mm-sb-polar${isCaught ? ' caught' : ''}" style="transform:rotate(${tilt}deg);border-bottom:2px solid ${tc};--pin-color:${tc}"><div class="mm-sb-polar-img">${_av(name, 72)}</div><div class="mm-sb-polar-name">${name}</div></div>`;
    });
    h += `</div>`;
  });

  // Extraction quality — rack and hunt phases
  if (phase === 'rack' || isHuntPhase) {
    const rackTribes = d.phase2?.tribes || [];
    if (rackTribes.length > 0 && rackTribes[0].extractionQuality) {
      h += `<div class="mm-sb-label">— Intel Quality —</div>`;
      rackTribes.forEach((rt) => {
        const eq = rt.extractionQuality || 'basic';
        const bc = rt.bonusClues || 0;
        const tn = rt.tribeName || '???';
        const eqColor = eq === 'thorough' ? '#3a7a3a' : eq === 'minimal' ? '#8a1818' : '#8a6e1a';
        h += `<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;padding:3px 5px;background:rgba(${eq === 'thorough' ? '58,122,58' : eq === 'minimal' ? '138,24,24' : '184,150,46'},.06);border:1px solid rgba(${eq === 'thorough' ? '58,122,58' : eq === 'minimal' ? '138,24,24' : '184,150,46'},.15);">`;
        h += `<span style="font-family:'Courier Prime',monospace;font-size:8px;color:${eqColor};letter-spacing:1px;text-transform:uppercase;flex:1">${tn.substring(0, 8)}</span>`;
        h += `<span style="font-family:'Courier Prime',monospace;font-size:8px;color:${eqColor};font-weight:700">${eq.toUpperCase()}</span>`;
        if (bc > 0) h += `<span style="font-family:'Courier Prime',monospace;font-size:7px;color:#3a7a3a;margin-left:2px">+${bc}</span>`;
        h += `</div>`;
      });
    }
  }

  // Clue tracker — only in hunt/results phases, gated by reveal
  if (isHuntPhase) {
    h += `<div class="mm-sb-label">— Clues —</div>`;
    tribes.forEach((tribe, ti) => {
      const count = huntRevealClues[tribe.tribeName] || 0;
      const pct = Math.min(count / maxClues * 100, 100);
      const color = ti === 0 ? '#2848a0' : '#a03030';
      const tn = tribe.tribeName || '???';
      h += `<div class="mm-sb-clue-row"><span class="mm-sb-clue-tribe" style="color:${color}">${tn.substring(0, 8)}</span><div class="mm-sb-clue-bar"><div class="mm-sb-clue-fill" style="width:${pct}%;background:${color}"></div></div><span class="mm-sb-clue-n">${count}</span></div>`;
    });
  }

  // Caught players — only shown as they're revealed
  if (isHuntPhase && huntRevealCaught.length > 0) {
    h += `<div class="mm-sb-label">— Caught —</div>`;
    h += `<div class="mm-sb-caught-gallery">`;
    for (const cName of huntRevealCaught) {
      h += `<div class="mm-sb-caught-photo"><div class="mm-sb-caught-photo-img">${_av(cName, 52)}</div><div class="mm-sb-caught-photo-name">${cName}</div>`;
      h += `<div class="mm-sb-caught-x"><svg viewBox="0 0 50 50" width="100%" height="100%" fill="none"><line x1="5" y1="5" x2="45" y2="45" stroke="#c02020" stroke-width="6" stroke-linecap="round" opacity=".7"/><line x1="45" y1="5" x2="5" y2="45" stroke="#c02020" stroke-width="6" stroke-linecap="round" opacity=".7"/><line x1="7" y1="7" x2="43" y2="43" stroke="#e03030" stroke-width="2.5" stroke-linecap="round" opacity=".35"/><line x1="43" y1="7" x2="7" y2="43" stroke="#e03030" stroke-width="2.5" stroke-linecap="round" opacity=".35"/></svg></div>`;
      h += `</div>`;
    }
    h += `</div>`;
  }

  // Corgi ally — only after befriend card is revealed
  if (isHuntPhase && huntRevealCorgi) {
    h += `<div class="mm-sb-corgi">${_svgPaw('#d4b040')} Corgi Ally: ${huntRevealCorgi}</div>`;
  }

  return h;
}

/* ─── VP Screen Builders ─── */

export function rpBuildMMTitleCard(ep) {
  const d = ep.midnightManhunt;
  if (!d) return '<div>No data</div>';
  const tribes = d.tribes || [];
  const allMembers = tribes.flatMap((t, ti) => t.members.map(n => ({ name: n, ti })));
  const cols = Math.min(allMembers.length, 5);

  let content = `<div class="mm-title">`;

  // Manila folder — central branding
  content += `<div class="mm-folder">`;
  content += `<div class="mm-folder-tab">CASE FILE</div>`;
  content += `<div class="mm-folder-inner">`;
  content += `<div class="mm-folder-stamp" id="mm-stamp">CHRIS APPROVED</div>`;
  content += `<div class="mm-folder-title">Midnight Manhunt</div>`;
  content += `<div class="mm-folder-sub">A Victorian Investigation</div>`;
  content += `<div class="mm-folder-case">Case No. ${ep.num || gs.episodeHistory.length} · ${tribes.map(t => t.tribeName).join(' vs ')}</div>`;
  content += `<div class="mm-folder-desc">Two tribes. One fugitive. The fog closes in.</div>`;
  content += `</div></div>`;

  // Evidence board — all players with red string
  content += `<div class="mm-eb">`;
  content += `<div class="mm-eb-header">Detective's Evidence Board</div>`;

  // Red string SVG overlay
  const cellW = 88, cellH = 105;
  const svgW = cols * cellW, svgH = Math.ceil(allMembers.length / cols) * cellH;
  content += `<svg class="mm-eb-strings" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" fill="none">`;
  for (let i = 0; i < allMembers.length; i++) {
    const x1 = (i % cols) * cellW + cellW / 2, y1 = Math.floor(i / cols) * cellH + 40;
    const j = (i + 1) % allMembers.length;
    const x2 = (j % cols) * cellW + cellW / 2, y2 = Math.floor(j / cols) * cellH + 40;
    const sag = 12 + (i * 7) % 15;
    const cpx = (x1 + x2) / 2 + ((i * 17) % 24 - 12), cpy = (y1 + y2) / 2 + sag;
    content += `<path d="M${x1},${y1} Q${cpx},${cpy} ${x2},${y2}" stroke="#c02020" stroke-width="1.2" opacity=".55"/>`;
    if (i % 3 === 0 && i + 2 < allMembers.length) {
      const k = i + 2;
      const x3 = (k % cols) * cellW + cellW / 2, y3 = Math.floor(k / cols) * cellH + 40;
      content += `<path d="M${x1},${y1} Q${(x1 + x3) / 2 + 8},${(y1 + y3) / 2 - 10} ${x3},${y3}" stroke="#c02020" stroke-width=".8" stroke-dasharray="5,4" opacity=".35"/>`;
    }
  }
  content += `</svg>`;

  // Player polaroid grid
  content += `<div class="mm-eb-grid" style="grid-template-columns:repeat(${cols},1fr)">`;
  allMembers.forEach(({ name, ti }, idx) => {
    const tilt = ((name.length * 7 + ti * 5 + idx * 3) % 9 - 4).toFixed(1);
    const tribeColor = ti === 0 ? '#2848a0' : '#a03030';
    const tribeName = tribes[ti]?.tribeName || '';
    content += `<div class="mm-eb-photo" style="transform:rotate(${tilt}deg)">`;
    content += `<div class="mm-eb-photo-pin" style="background:${tribeColor}"></div>`;
    content += `<div class="mm-eb-photo-img">${_av(name, 60)}</div>`;
    content += `<div class="mm-eb-photo-name">${name}</div>`;
    content += `<div class="mm-eb-photo-tribe" style="color:${tribeColor}">${tribeName}</div>`;
    content += `</div>`;
  });
  content += `</div>`;
  content += `</div>`;

  // Desk artifacts row
  content += `<div class="mm-desk-artifacts">`;
  content += `<div class="mm-artifact">${_svgMagnify('#d4b040')}<span>Evidence</span></div>`;
  content += `<div class="mm-artifact">${_svgTopHat('#d4b040')}<span>Suspects</span></div>`;
  content += `<div class="mm-artifact">${_svgKnife('#d4b040')}<span>Weapon</span></div>`;
  content += `<div class="mm-artifact">${_svgPaw('#d4b040')}<span>K-9 Unit</span></div>`;
  content += `<div class="mm-artifact">${_svgHandcuffs('#d4b040')}<span>Capture</span></div>`;
  content += `<div class="mm-artifact mm-artifact-watch">${_svgWatch('#d4b040')}<span>Time</span></div>`;
  content += `</div>`;

  content += `</div>`;
  return _mmShell(content, ep, 'title', _buildSidebarContent(ep, 'title', 'mm-title'));
}

export function rpBuildMMGuardStrip(ep) {
  const d = ep.midnightManhunt;
  if (!d) return '<div>No data</div>';
  const screenKey = 'mm-guard';
  const steps = [];

  steps.push(`<div class="mm-flavor">The ancient fortress looms through morning haze. Two guards stand motionless at the iron gate...</div>`);

  for (const tribe of d.phase1.tribes) {
    // Volunteer consensus
    const tName = tribe.tribeName || '???';
    let volHtml = `<div class="mm-card"><div class="mm-card-head">${_svgSpeech()} <span class="mm-card-type">Tribe Consensus — ${tName}</span></div>`;
    volHtml += `<div class="mm-card-body">`;
    for (const v of tribe.volunteers) volHtml += `<div style="margin-bottom:4px">${_pin(v.name)} ${v.text}</div>`;
    for (const r of tribe.refused) volHtml += `<div style="margin-bottom:4px">${_pin(r.name)} ${r.text}</div>`;
    volHtml += `</div>`;
    volHtml += `<div class="mm-vol-box"><div class="mm-vol-title">Who Volunteers?</div><div class="mm-vol-grid">`;
    for (const v of tribe.volunteers) volHtml += `<div class="mm-vol-slot mm-vol-yes">${_av(v.name, 16)} ✓ ${v.name}</div>`;
    for (const f of tribe.forced) volHtml += `<div class="mm-vol-slot mm-vol-press">${_av(f.name, 16)} ⚡ ${f.name}</div>`;
    for (const r of tribe.refused) {
      if (!tribe.forced.find(f => f.name === r.name)) volHtml += `<div class="mm-vol-slot mm-vol-no">${_av(r.name, 16)} ✗ ${r.name}</div>`;
    }
    volHtml += `</div></div>`;
    volHtml += `<div class="mm-card-foot">`;
    tribe.volunteers.forEach(v => { volHtml += `<span class="mm-badge mm-badge-score">${_av(v.name, 14)} +2 ${v.name}</span>`; });
    tribe.forced.forEach(f => { volHtml += `<span class="mm-badge mm-badge-pop">${_av(f.name, 14)} FORCED ${f.name}</span>`; });
    volHtml += `</div></div>`;
    steps.push(volHtml);

    // Social events
    for (const se of tribe.socialEvents) {
      const sePlayers = se.players || [];
      const sePins = sePlayers.map(n => _pin(n)).join(' ');
      const seLabel = se.type === 'spectator' ? 'Spectator' : se.type === 'spectator-reaction' ? 'Reaction' : se.type === 'forced-assignment' ? 'Forced Assignment' : se.type === 'drafted' ? 'Drafted' : se.type === 'pressure-success' ? 'Pressure' : se.type === 'pressure-fail' ? 'Pressure Failed' : 'Social';
      steps.push(`<div class="mm-card mm-card-social"><div class="mm-card-head">${_svgSpeech()} <span class="mm-card-type">${seLabel}</span> ${sePins}</div><div class="mm-card-body">${se.text}</div></div>`);
    }

    // Beats
    for (const beat of tribe.beats) {
      const beatLabel = beat.beat === 'approach' ? 'Approach' : beat.beat === 'resistance' ? 'Guard Resistance' : 'Clue Extraction';
      const stamp = beat.result === 'fast' ? '<div class="mm-stamp mm-stamp-filed">Filed</div>' : beat.result === 'damaged' ? '<div class="mm-stamp mm-stamp-urgent">Damaged</div>' : '';
      const tagText = beat.beat === 'approach' ? (beat.smooth ? 'SMOOTH' : 'FUMBLE') : beat.beat === 'resistance' ? 'RESISTED' : beat.result?.toUpperCase() || '';
      steps.push(`<div class="mm-card mm-card-report">${stamp}<div class="mm-card-head">${_svgMagnify()} <span class="mm-card-type">Investigation · ${beatLabel}</span></div><div class="mm-card-body">${beat.text}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${beat.score > 0 ? '+' : ''}${beat.score} ${tagText}</span></div></div>`);
    }

    // Sabotage
    if (tribe.sabotage?.success) {
      steps.push(`<div class="mm-card mm-card-ripper"><div class="mm-stamp mm-stamp-urgent">Secret</div><div class="mm-card-head">${_svgKnife()} <span class="mm-card-type">Sabotage</span></div><div class="mm-card-body">${tribe.sabotage.text}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-pop">POP −1 ${tribe.sabotage.by}</span></div></div>`);
    }
  }

  // Completion order summary
  if (d.phase1.completionOrder && d.phase1.completionOrder.length > 1) {
    let orderHtml = `<div class="mm-card mm-card-capture" style="border-color:#d4b040"><div class="mm-stamp mm-stamp-filed">Results</div>`;
    orderHtml += `<div class="mm-card-head">${_svgWatch()} <span class="mm-card-type" style="color:#8a6e1a">Phase I — Completion Order</span></div>`;
    orderHtml += `<div class="mm-card-body">`;
    d.phase1.completionOrder.forEach((entry, i) => {
      const tn = entry.tribeName || '???';
      const medal = i === 0 ? '🥇' : '🥈';
      const verdict = i === 0 ? 'finishes first — clean extraction, moving ahead' : 'trails behind — extra time cost heading into the rack';
      orderHtml += `<div style="margin-bottom:4px"><strong>${medal} ${tn}</strong> — ${verdict}</div>`;
    });
    orderHtml += `</div></div>`;
    steps.push(orderHtml);
  }

  const totalSteps = steps.length;
  let html = `<div class="mm-section-h">The Tower Gate</div><div class="mm-section-sub">Phase I — Guard Strip</div>`;
  steps.forEach((s, i) => { html += `<div class="mm-step" id="mm-step-guard-${i}">${s}</div>`; });
  html += `<div class="mm-controls-bar" id="mm-controls-guard"><button class="mm-btn" onclick="mmRevealNext('${screenKey}',${totalSteps})">Reveal Next</button><span class="mm-counter" id="mm-counter-guard">0 / ${totalSteps}</span><button class="mm-btn" onclick="mmRevealAll('${screenKey}',${totalSteps})">Reveal All</button></div>`;

  window._mmGuardSteps = totalSteps;
  return _mmShell(html, ep, 'guard', _buildSidebarContent(ep, 'guard', screenKey));
}

export function rpBuildMMRack(ep) {
  const d = ep.midnightManhunt;
  if (!d) return '<div>No data</div>';
  const screenKey = 'mm-rack';
  const steps = [];

  steps.push(`<div class="mm-flavor">Torchlight flickers across damp stone walls. The medieval rack waits in the center of the chamber...</div>`);

  for (const tribe of d.phase2.tribes) {
    const tName2 = tribe.tribeName || '???';

    // Victim/cranker selection + setup
    const setupBeat = tribe.beats.find(b => b.beat === 'setup');
    let selHtml = `<div class="mm-card"><div class="mm-card-head">${_svgSpeech()} <span class="mm-card-type">Victim Selection — ${tName2}</span></div>`;
    selHtml += `<div class="mm-card-body">${_pin(tribe.victim)} ${setupBeat?.text || 'lies on the rack.'}<br>${_pin(tribe.cranker)} takes the crank.</div>`;
    selHtml += `<div class="mm-card-foot"><span class="mm-badge mm-badge-score">${_av(tribe.victim, 14)} VICTIM: ${tribe.victim}</span><span class="mm-badge mm-badge-score">${_av(tribe.cranker, 14)} CRANKER: ${tribe.cranker}</span></div></div>`;
    steps.push(selHtml);

    // Cranking beat
    const crankBeat = tribe.beats.find(b => b.beat === 'cranking');
    if (crankBeat) {
      let crankHtml = `<div class="mm-card mm-card-report"><div class="mm-card-head">${_svgMagnify()} <span class="mm-card-type">Investigation · The Cranking</span> ${_pin(tribe.cranker)} ${_pin(tribe.victim)}</div>`;
      crankHtml += `<div class="mm-card-body">${crankBeat.text}</div>`;
      crankHtml += `<div class="mm-rack-meter"><span class="mm-rack-label">Intensity</span><div class="mm-rack-bar"><div class="mm-rack-fill mm-rack-${tribe.intensity}"></div></div></div>`;
      crankHtml += `<div class="mm-card-foot">`;
      if (tribe.intensity === 'gentle') crankHtml += `<span class="mm-badge mm-badge-bond">${_av(tribe.victim, 14)} BOND +0.5 → ${_av(tribe.cranker, 14)}</span>`;
      if (tribe.intensity === 'brutal') crankHtml += `<span class="mm-badge mm-badge-pop">${_av(tribe.cranker, 14)} POP −1</span><span class="mm-badge mm-badge-bond" style="background:rgba(138,24,24,.1);color:#8a1818;border-color:rgba(138,24,24,.2)">${_av(tribe.victim, 14)} BOND −1.0 → ${_av(tribe.cranker, 14)}</span><span class="mm-badge mm-badge-camp">BRUTAL RACK</span>`;
      const eq = tribe.extractionQuality || 'basic';
      const bc = tribe.bonusClues || 0;
      const eqLabel = eq === 'thorough' ? `THOROUGH INTEL: +${bc} HUNT CLUES` : eq === 'solid' ? `SOLID INTEL: +${bc} HUNT CLUE${bc !== 1 ? 'S' : ''}` : eq === 'partial' ? 'PARTIAL INTEL: +0 HUNT CLUES' : eq === 'minimal' ? 'MINIMAL INTEL: +0 HUNT CLUES' : `BASIC INTEL: +${bc} HUNT CLUE${bc !== 1 ? 'S' : ''}`;
      crankHtml += `<div class="mm-intel-badge mm-intel-${eq}">${_svgMagnify(eq === 'thorough' ? '#3a7a3a' : eq === 'minimal' ? '#8a1818' : '#8a6e1a')} ${eqLabel}</div>`;
      crankHtml += `</div></div>`;
      steps.push(crankHtml);
    }

    // Aftermath beat
    const afterBeat = tribe.beats.find(b => b.beat === 'aftermath');
    if (afterBeat) {
      let afterHtml = `<div class="mm-card mm-card-social"><div class="mm-card-head">${_svgSpeech()} <span class="mm-card-type">Aftermath · ${afterBeat.intensity === 'brutal' ? 'Reckoning' : afterBeat.intensity === 'gentle' ? 'Gratitude' : 'Recovery'}</span> ${_pin(tribe.victim)} ${_pin(tribe.cranker)}</div>`;
      afterHtml += `<div class="mm-card-body">${afterBeat.text}</div>`;
      if (afterBeat.bondDelta) {
        const bondColor = afterBeat.bondDelta.startsWith('-') ? 'background:rgba(138,24,24,.1);color:#8a1818;border-color:rgba(138,24,24,.2)' : '';
        afterHtml += `<div class="mm-card-foot"><span class="mm-badge mm-badge-bond" style="${bondColor}">${_av(tribe.victim, 14)} BOND ${afterBeat.bondDelta} → ${_av(tribe.cranker, 14)}</span></div>`;
      }
      afterHtml += `</div>`;
      steps.push(afterHtml);
    }

    // Social events
    for (const se of tribe.socialEvents) {
      const sePins = (se.players || []).map(n => _pin(n)).join(' ');
      steps.push(`<div class="mm-card mm-card-social"><div class="mm-card-head">${_svgSpeech()} <span class="mm-card-type">Social · Spectator</span> ${sePins}</div><div class="mm-card-body">${se.text}</div></div>`);
    }

    // Extraction beat
    const extBeat = tribe.beats.find(b => b.beat === 'extraction');
    if (extBeat) {
      const extStamp = extBeat.penalty < 0 ? '<div class="mm-stamp mm-stamp-urgent">Damaged</div>' : '<div class="mm-stamp mm-stamp-filed">Filed</div>';
      const eqExt = tribe.extractionQuality || 'basic';
      const bcExt = tribe.bonusClues || 0;
      let extFoot = '';
      if (bcExt > 0) extFoot = `<div class="mm-card-foot"><span class="mm-badge mm-badge-score" style="background:rgba(58,122,58,.1);color:#3a7a3a;border-color:rgba(58,122,58,.2)">+${bcExt} BONUS CLUE${bcExt > 1 ? 'S' : ''} → Phase III</span></div>`;
      else if (eqExt === 'minimal') extFoot = `<div class="mm-card-foot"><span class="mm-badge mm-badge-score" style="background:rgba(138,24,24,.08);color:#8a1818;border-color:rgba(138,24,24,.15)">SHALLOW EXTRACTION — NO BONUS CLUES</span></div>`;
      steps.push(`<div class="mm-card mm-card-report">${extStamp}<div class="mm-card-head">${_svgMagnify()} <span class="mm-card-type">Clue Extraction — ${tName2}</span></div><div class="mm-card-body">${extBeat.text}</div>${extFoot}</div>`);
    }
  }

  const totalSteps = steps.length;
  let html = `<div class="mm-section-h">The Rack Chamber</div><div class="mm-section-sub">Phase II — Torture Rack</div>`;
  steps.forEach((s, i) => { html += `<div class="mm-step" id="mm-step-rack-${i}">${s}</div>`; });
  html += `<div class="mm-controls-bar" id="mm-controls-rack"><button class="mm-btn" onclick="mmRevealNext('${screenKey}',${totalSteps})">Reveal Next</button><span class="mm-counter" id="mm-counter-rack">0 / ${totalSteps}</span><button class="mm-btn" onclick="mmRevealAll('${screenKey}',${totalSteps})">Reveal All</button></div>`;

  window._mmRackSteps = totalSteps;
  return _mmShell(html, ep, 'rack', _buildSidebarContent(ep, 'rack', screenKey));
}

export function rpBuildMMManhunt(ep) {
  const d = ep.midnightManhunt;
  if (!d) return '<div>No data</div>';
  const screenKey = 'mm-hunt';
  const steps = [];
  const stepMeta = [];
  const posSnapshots = []; // index → { name: { street, tribe, caught } }
  let curPosIdx = -1;

  steps.push(`<div class="mm-flavor">Night falls. The fog thickens. Somewhere in these winding streets, the fugitive stalks...</div>`);
  stepMeta.push({ type: 'flavor', posIdx: -1 });

  for (const act of d.phase3.acts) {
    const actColor = act.actName === 'Searching' ? '#d4b040' : act.actName === 'Closing In' ? '#c02020' : '#3a7a3a';
    steps.push(`<div class="mm-act-label"><span class="mm-act-badge" style="border-color:${actColor};color:${actColor}">Act ${act.actNum} — ${act.actName}</span></div>`);
    stepMeta.push({ type: 'act-header', actName: act.actName, posIdx: curPosIdx });

    for (const round of act.rounds) {
      // Store round positions snapshot
      if (round.positions) {
        posSnapshots.push(round.positions);
        curPosIdx = posSnapshots.length - 1;
      }

      if (round.type === 'tracking' && round.data) {
        for (let t = 0; t < round.data.results.length; t++) {
          const tr = round.data.results[t];
          const txt = round.data.text[t] || '';
          steps.push(`<div class="mm-card mm-card-report"><div class="mm-stamp mm-stamp-filed">Filed</div><div class="mm-card-head">${_svgMagnify()} <span class="mm-card-type">Tracking — ${tr.tribe}</span> ${_pin(tr.tracker)}</div><div class="mm-card-body">${txt}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${_av(tr.tracker, 14)} +3 TRACKING</span></div></div>`);
          stepMeta.push({ type: 'tracking', tribe: tr.tribe, posIdx: curPosIdx });
        }
        continue;
      }
      if (round.type === 'capture' && round.data) {
        const c = round.data;
        steps.push(`<div class="mm-card mm-card-capture"><div class="mm-stamp mm-stamp-closed">Case Closed</div><div class="mm-card-head">${_svgHandcuffs()} <span class="mm-card-type">Capture Report — The Bagging</span> ${_pin(c.hero)}</div><div class="mm-card-body"><span class="mm-street">Bus Depot</span> ${c.text}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${_av(c.hero, 14)} +10 CAPTURE HERO</span>${c.corgiAssist ? `<span class="mm-badge mm-badge-score">+3 CORGI ASSIST</span>` : ''}<span class="mm-badge mm-badge-pop" style="background:rgba(58,122,58,.1);color:#3a7a3a;border-color:rgba(58,122,58,.2)">${_av(c.hero, 14)} POP +2</span><span class="mm-badge mm-badge-camp">CAMP: Capture Hero</span></div></div>`);
        stepMeta.push({ type: 'capture', hero: c.hero, tribe: c.tribe, corgiAssist: !!c.corgiAssist, street: 'Bus Depot', posIdx: curPosIdx });
        continue;
      }

      if (!round.events) continue;
      for (const evt of round.events) {
        const evtPlayer = evt.player || (evt.players ? evt.players[0] : null);
        const evtPin = evtPlayer ? _pin(evtPlayer) : '';
        if (evt.type === 'investigate-success') {
          steps.push(`<div class="mm-card mm-card-report"><div class="mm-card-head">${_svgMagnify()} <span class="mm-card-type">Investigation · Round ${round.roundNum}</span> ${evtPin}</div><div class="mm-card-body"><span class="mm-street">${evt.street}</span> ${evt.text}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${_av(evtPlayer, 14)} +2 CLUE</span></div></div>`);
          stepMeta.push({ type: 'clue', tribe: evt.tribe || '', street: evt.street, player: evtPlayer, posIdx: curPosIdx });
        } else if (evt.type === 'investigate-fail') {
          steps.push(`<div class="mm-card"><div class="mm-card-head">${_svgMagnify('#999')} <span class="mm-card-type">Investigation · Cold Trail</span> ${evtPin}</div><div class="mm-card-body"><span class="mm-street">${evt.street}</span> ${evt.text}</div></div>`);
          stepMeta.push({ type: 'cold-trail', tribe: evt.tribe || '', street: evt.street, player: evtPlayer, posIdx: curPosIdx });
        } else if (evt.type === 'corgi-befriend') {
          steps.push(`<div class="mm-card mm-card-corgi"><div class="mm-card-head">${_svgPaw()} <span class="mm-card-type" style="color:#b8962e">Encounter · Corgi Pack</span> ${evtPin}</div><div class="mm-card-body"><span class="mm-street">${evt.street}</span> ${evt.text}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${_av(evtPlayer, 14)} +3 CORGI ALLY</span><span class="mm-badge mm-badge-camp">CAMP: Befriended the Corgis</span></div></div>`);
          stepMeta.push({ type: 'corgi-befriend', player: evtPlayer, tribe: evt.tribe || '', street: evt.street, posIdx: curPosIdx });
        } else if (evt.type === 'corgi-fail') {
          steps.push(`<div class="mm-card mm-card-corgi"><div class="mm-card-head">${_svgPaw()} <span class="mm-card-type" style="color:#b8962e">Encounter · Corgi Chase</span> ${evtPin}</div><div class="mm-card-body"><span class="mm-street">${evt.street}</span> ${evt.text}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${_av(evtPlayer, 14)} −1 CHASED</span></div></div>`);
          stepMeta.push({ type: 'corgi-fail', tribe: evt.tribe || '', street: evt.street, player: evtPlayer, posIdx: curPosIdx });
        } else if (evt.type === 'ripper-stalk') {
          steps.push(`<div class="mm-card mm-card-ripper" style="opacity:.85;border-left:3px solid rgba(138,24,24,.4)"><div class="mm-card-head">${_svgKnife()} <span class="mm-card-type" style="color:#8a4a2e">Fugitive · Stalking</span> ${evtPin}</div><div class="mm-card-body"><span class="mm-street" style="border-color:rgba(138,24,24,.2);color:#8a4a2e">${evt.street}</span> ${evt.text}</div></div>`);
          stepMeta.push({ type: 'ripper-stalk', player: evtPlayer, tribe: evt.tribe || '', street: evt.street, posIdx: curPosIdx });
        } else if (evt.type === 'ripper-catch') {
          steps.push(`<div class="mm-card mm-card-ripper"><div class="mm-stamp mm-stamp-urgent">Urgent</div><div class="mm-card-head">${_svgKnife()} <span class="mm-card-type">Fugitive · Strike</span> ${evtPin}</div><div class="mm-card-body"><span class="mm-street" style="border-color:rgba(138,24,24,.3);color:#c02020">${evt.street}</span> ${evt.text}</div><div class="mm-caught-flash">${_av(evt.player, 28)} <span class="mm-caught-flash-x">✕</span><div class="mm-caught-flash-info">${evt.player} — CAUGHT BY THE FUGITIVE</div></div><div class="mm-card-foot"><span class="mm-badge mm-badge-score" style="background:rgba(138,24,24,.15);color:#c02020;border-color:rgba(138,24,24,.3)">${_av(evt.player, 14)} CAUGHT</span><span class="mm-badge mm-badge-pop">POP −1</span></div></div>`);
          stepMeta.push({ type: 'ripper-catch', player: evt.player, tribe: evt.tribe || '', street: evt.street, posIdx: curPosIdx });
        } else if (evt.type === 'ripper-escape') {
          steps.push(`<div class="mm-card mm-card-ripper"><div class="mm-card-head">${_svgKnife()} <span class="mm-card-type">Fugitive · Near Miss</span> ${evtPin}</div><div class="mm-card-body"><span class="mm-street" style="border-color:rgba(138,24,24,.3);color:#c02020">${evt.street}</span> ${evt.text}</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${_av(evtPlayer, 14)} +2 ESCAPE</span><span class="mm-badge mm-badge-pop" style="background:rgba(58,122,58,.1);color:#3a7a3a;border-color:rgba(58,122,58,.2)">POP +1</span></div></div>`);
          stepMeta.push({ type: 'ripper-escape', player: evtPlayer, tribe: evt.tribe || '', street: evt.street, posIdx: curPosIdx });
        } else {
          const socialPins = (evt.players || []).map(n => _pin(n)).join(' ');
          steps.push(`<div class="mm-card mm-card-social"><div class="mm-card-head">${_svgSpeech()} <span class="mm-card-type">Social · ${evt.type.replace(/-/g, ' ')}</span> ${socialPins}</div><div class="mm-card-body">${evt.text}</div></div>`);
          stepMeta.push({ type: 'social', posIdx: curPosIdx });
        }
      }
    }
  }

  // Build all-players list for map markers
  const allPlayers = d.tribes.flatMap((t, ti) => t.members.map(n => ({ name: n, ti, tribe: t.tribeName })));

  const totalSteps = steps.length;
  const mapHtml = `<div class="mm-map-sticky"><div class="mm-map-frame"><div class="mm-map-tack-bl"></div><div class="mm-map-tack-br"></div><div class="mm-map-phase-label">Phase III — Manhunt</div>${_buildMapSvg(d.tribes, allPlayers)}</div></div>`;
  let html = mapHtml;
  html += `<div class="mm-section-h">The Streets</div><div class="mm-section-sub">Phase III — Midnight Manhunt</div>`;
  steps.forEach((s, i) => { html += `<div class="mm-step" id="mm-step-hunt-${i}">${s}</div>`; });
  html += `<div class="mm-controls-bar" id="mm-controls-hunt"><button class="mm-btn" onclick="mmRevealNext('${screenKey}',${totalSteps})">Reveal Next</button><span class="mm-counter" id="mm-counter-hunt">0 / ${totalSteps}</span><button class="mm-btn" onclick="mmRevealAll('${screenKey}',${totalSteps})">Reveal All</button></div>`;

  window._mmHuntStepMeta = stepMeta;
  window._mmHuntPositions = posSnapshots;
  window._mmMapTribes = d.tribes;
  window._mmMapPlayers = allPlayers;
  window._mmHuntSteps = totalSteps;
  return _mmShell(html, ep, 'hunt', _buildSidebarContent(ep, 'hunt', screenKey));
}

export function rpBuildMMResults(ep) {
  const d = ep.midnightManhunt;
  if (!d) return '<div>No data</div>';
  const screenKey = 'mm-results';
  const steps = [];
  const scores = ep.chalMemberScores || {};
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  steps.push(`<div class="mm-flavor">The fog lifts. Dawn breaks over the cobblestones. The case is closed.</div>`);

  // Use pre-computed tribe rankings from simulation
  const rankings = d.tribeRankings || [];

  // Winner
  let winHtml = `<div class="mm-card mm-card-capture"><div class="mm-stamp mm-stamp-closed">Case Closed</div>`;
  winHtml += `<div class="mm-card-head">${_svgHandcuffs()} <span class="mm-card-type">Final Report</span></div>`;
  winHtml += `<div class="mm-card-body"><strong>${d.winningTribe}</strong> captures the fugitive and wins immunity!`;
  if (rankings.length >= 3) {
    winHtml += `<br><br><strong>${rankings[1].tribeName}</strong> — safe. No tribal council tonight.`;
    winHtml += `<br><strong>${rankings[2].tribeName}</strong> — tribal council awaits.`;
  } else if (rankings.length === 2) {
    winHtml += `<br><br><strong>${rankings[1].tribeName}</strong> — tribal council awaits.`;
  } else if (d.losingTribes.length > 0) {
    winHtml += `<br><br><strong>${d.losingTribes.join(', ')}</strong> — tribal council awaits.`;
  }
  winHtml += `</div><div class="mm-card-foot"><span class="mm-badge mm-badge-score">${d.winningTribe} WINS</span>`;
  if (rankings.length >= 3) {
    winHtml += `<span class="mm-badge mm-badge-score" style="background:rgba(58,122,58,.1);color:#3a7a3a;border-color:rgba(58,122,58,.2)">${rankings[1].tribeName} SAFE</span>`;
    winHtml += `<span class="mm-badge mm-badge-score" style="background:rgba(138,24,24,.1);color:#c02020;border-color:rgba(138,24,24,.2)">${rankings[2].tribeName} TRIBAL</span>`;
  } else if (rankings.length === 2) {
    winHtml += `<span class="mm-badge mm-badge-score" style="background:rgba(138,24,24,.1);color:#c02020;border-color:rgba(138,24,24,.2)">${rankings[1].tribeName} TRIBAL</span>`;
  }
  winHtml += `</div></div>`;
  steps.push(winHtml);

  // Scoreboard
  let scoreHtml = `<div class="mm-card"><div class="mm-card-head">${_svgMagnify()} <span class="mm-card-type">Performance Rankings</span></div><div class="mm-card-body">`;
  sorted.forEach(([name, score], i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    scoreHtml += `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 0;${i < 3 ? 'font-weight:700' : ''}">${_av(name, 18)} ${medal} ${name}<span style="font-family:Courier Prime,monospace;font-size:11px;margin-left:auto">${score > 0 ? '+' : ''}${score}</span></div>`;
  });
  scoreHtml += `</div></div>`;
  steps.push(scoreHtml);

  const totalSteps = steps.length;
  let html = `<div class="mm-section-h">Case Closed</div><div class="mm-section-sub">Results & Scoring</div>`;
  steps.forEach((s, i) => { html += `<div class="mm-step" id="mm-step-results-${i}">${s}</div>`; });
  html += `<div class="mm-controls-bar" id="mm-controls-results"><button class="mm-btn" onclick="mmRevealNext('${screenKey}',${totalSteps})">Reveal Next</button><span class="mm-counter" id="mm-counter-results">0 / ${totalSteps}</span><button class="mm-btn" onclick="mmRevealAll('${screenKey}',${totalSteps})">Reveal All</button></div>`;

  return _mmShell(html, ep, 'results', _buildSidebarContent(ep, 'results', screenKey));
}
