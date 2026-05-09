// js/chal/viking-sour.js — Viking Sour: pre-merge tribe challenge (blueprint + sail + naval battle)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function noise(range = 2.5) { return (Math.random() - 0.5) * 2 * range; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function host() { return seasonConfig?.hostName || 'Chris'; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_ARCHS = new Set(['villain', 'mastermind', 'schemer']);

function canScheme(name) {
  const a = arch(name);
  if (VILLAIN_ARCHS.has(a)) return true;
  if (NICE_ARCHS.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════════════════════════════════════════════
// NARRATION TEXT POOLS
// ══════════════════════════════════════════════════════════════

const EUREKA_TEXT = [
  (n, pr) => `${n}'s eyes go wide. "${pr.Sub === 'They' ? 'Wait' : 'Wait'} — that piece goes THERE." The blueprint clicks into focus.`,
  (n, pr) => `Something fires behind ${n}'s eyes. ${pr.Sub} grabs the blueprint and starts sketching corrections. The whole tribe watches.`,
  (n, pr) => `"I see it." ${n} traces the hull design with ${pr.posAdj} finger. "We've been building the keel wrong."`,
  (n, pr) => `${n} flips the fragment upside down and suddenly everything makes sense. "${pr.Sub === 'They' ? 'They' : pr.Sub} figured it out!" someone yells.`,
  (n, pr) => `A grin spreads across ${n}'s face. ${pr.Sub} just solved the hardest section of the blueprint. The tribe erupts.`,
  (n, pr) => `${n} connects two fragments nobody thought went together. The hull shape appears. "THAT'S a longship."`,
];

const STUDY_TEXT = [
  (n, pr) => `${n} squints at the rune fragments, turning them over. Slow progress.`,
  (n, pr) => `${n} pieces together another section of the blueprint. It's starting to look like something.`,
  (n, pr) => `${n} mutters to ${pr.ref} while matching fragment edges. "This one... no. This one."`,
  (n, pr) => `${n} holds two fragments up to the light. One fits. The other doesn't. ${pr.Sub} keeps going.`,
  (n, pr) => `${n} cross-references the rune markings with the hull outline. Careful, methodical work.`,
  (n, pr) => `${n} sits back and surveys the pieces. Something's not right. ${pr.Sub} rearranges three fragments.`,
];

const BUILD_TEXT = [
  (n, pr) => `${n} drives a wooden peg into the hull plank. Solid work.`,
  (n, pr) => `${n} hoists a beam into position and hammers it home. The ship takes shape.`,
  (n, pr) => `${n} lashes the rigging to the mast. ${pr.PosAdj} knots hold firm.`,
  (n, pr) => `${n} shapes the prow with a hand axe. Chips fly. The dragon head emerges.`,
  (n, pr) => `${n} seals the hull joints with pine tar. Every gap gets covered. This ship won't leak.`,
  (n, pr) => `${n} tests the oar fittings. They slot in cleanly. ${pr.Sub} nods — good enough for war.`,
];

const ARGUMENT_TEXT = [
  (a, b) => `${a} and ${b} clash over where the mast goes. The argument gets loud. The tribe stalls.`,
  (a, b) => `"That's NOT how you brace a hull!" ${a} shoves ${b}'s work aside. ${b} shoves back.`,
  (a, b) => `${a} questions ${b}'s fragment placement. ${b} fires back. Five minutes of progress, gone.`,
  (a, b) => `${a} and ${b} are building in opposite directions. By the time they notice, they've wasted materials.`,
  (a, b) => `"You're reading the blueprint wrong." "No, YOU are." ${a} and ${b} go in circles.`,
];

const SABOTAGE_TEXT = [
  (n, pr) => `${n} subtly loosens a key joint on the rival tribe's ship frame when nobody's looking.`,
  (n, pr) => `${n} swaps a structural peg with a rotten one. The damage won't show until the water.`,
  (n, pr) => `${n} "accidentally" kicks dirt over the rival's blueprint fragments. Oops.`,
  (n, pr) => `${n} pockets a critical fragment from the other tribe's pile. It'll cost them time.`,
];

const SABOTAGE_CAUGHT_TEXT = [
  (n, catcher) => `${catcher} catches ${n} red-handed. "What are you DOING to our ship?!" The whole beach hears it.`,
  (n, catcher) => `"HEY!" ${catcher} spots ${n} messing with their build. ${n} freezes. Busted.`,
  (n, catcher) => `${catcher}'s eyes narrow. ${n} is WAY too close to the rival's hull. "Step away. Now."`,
  (n, catcher) => `${n} tries to play it off but ${catcher} isn't buying it. "I saw what you did."`,
];

const FLIRT_TEXT = [
  (a, b) => `${a} and ${b} keep finding excuses to work on the same section. Their hands brush. Neither pulls away.`,
  (a, b) => `${a} catches ${b}'s eye across the construction site. They both smile. Hammers stop swinging.`,
  (a, b) => `${b} asks ${a} for help with a beam. They could do it alone. They don't want to.`,
  (a, b) => `${a} and ${b} have stopped building and started talking. The tribe notices. The ship doesn't build itself.`,
];

const LEADERSHIP_CLASH_TEXT = [
  (w, l) => `${w} and ${l} both try to take charge. It comes down to a battle of wills. ${w} wins. ${l} seethes.`,
  (w, l) => `Two captains, one ship. ${w}'s plan gets the tribe's vote. ${l} has to follow orders now.`,
  (w, l) => `${w} steps up and the tribe follows. ${l} tried, but ${w} had the room.`,
  (w, l) => `"We do it MY way." ${w} and ${l} lock eyes. The tribe picks ${w}. ${l} goes quiet.`,
];

const CREDIT_STEAL_TEXT = [
  (thief, victim) => `${thief} presents ${victim}'s breakthrough as ${pronouns(thief).posAdj} own idea. ${victim} stands there, stunned.`,
  (thief, victim) => `"I figured it out!" ${thief} announces, holding up ${victim}'s fragment. ${victim} knows the truth.`,
  (thief, victim) => `${thief} takes credit for ${victim}'s eureka moment. The tribe doesn't know any better. ${victim} does.`,
  (thief, victim) => `${thief} swoops in after ${victim}'s breakthrough and reframes the discovery. Classic.`,
];

const LAUNCH_TEXT = [
  (n, pr) => `${n} heaves the hull forward. Muscles straining, feet digging into the sand.`,
  (n, pr) => `${n} puts ${pr.posAdj} shoulder into the stern and pushes. The ship groans and slides.`,
  (n, pr) => `${n} grabs the rope and pulls. The longship inches toward the water.`,
  (n, pr) => `${n} throws everything into the launch. Sweat freezes on ${pr.posAdj} forehead. The ship moves.`,
  (n, pr) => `${n} finds solid footing and drives forward. The longship gains momentum.`,
  (n, pr) => `${n} locks arms with a teammate and they push together. The hull scrapes into the shallows.`,
];

const ICE_BREAK_SUCCESS_TEXT = [
  (n, pr) => `${n} smashes through the ice shelf with a running kick. Open water ahead.`,
  (n, pr) => `${n} grabs the battering pole and slams it into the ice. The floe splits. Path clear.`,
  (n, pr) => `Ice shatters under ${n}'s assault. ${pr.Sub} doesn't even slow down.`,
  (n, pr) => `${n} throws ${pr.posAdj} weight against the ice wall. It cracks, then crumbles. "GO!"`,
];

const ICE_BREAK_FAIL_TEXT = [
  (n, pr) => `${n} bounces off the ice shelf. It barely chips. The ship grinds to a halt.`,
  (n, pr) => `${n} swings at the ice and misses the weak point. The floe holds. Time wasted.`,
  (n, pr) => `${n} tries to kick through the ice and slips. ${pr.Sub} goes down hard. The ice doesn't.`,
  (n, pr) => `The ice is too thick for ${n}. ${pr.Sub} hammers away but can't break through.`,
];

const SAIL_SEGMENT_TEXT = [
  (tribe) => `${tribe}'s longship cuts through the channel. Oars rising and falling in unison.`,
  (tribe) => `The crew of ${tribe} rows hard. The ship surges forward through the icy water.`,
  (tribe) => `${tribe} maintains rhythm. The bow wave splits the dark water cleanly.`,
  (tribe) => `${tribe}'s rowers find their stroke. The ship accelerates through the channel.`,
  (tribe) => `The ${tribe} longship carves a path through the frigid strait.`,
  (tribe) => `${tribe} pushes through. The oars dip and pull. The shore gets closer.`,
];

const WIND_FAVORABLE_TEXT = [
  (tribe) => `A favorable wind fills ${tribe}'s sail! The ship surges forward. Gift from the gods.`,
  (tribe) => `The wind shifts. ${tribe}'s sail catches it perfectly. Free speed.`,
  (tribe) => `A gust of wind from the east — ${tribe}'s ship practically flies through the channel.`,
  (tribe) => `${tribe}'s sail snaps taut. The wind is with them. The whole crew cheers.`,
];

const ICE_COLLISION_TEXT = [
  (tribe, dmg) => `An ice floe rams into ${tribe}'s hull! The ship shudders. ${dmg} HP damage.`,
  (tribe, dmg) => `${tribe} didn't see the submerged ice in time. CRUNCH. The hull takes ${dmg} damage.`,
  (tribe, dmg) => `Floating ice slams against ${tribe}'s port side. The ship groans. ${dmg} HP gone.`,
  (tribe, dmg) => `${tribe} clips an ice sheet. Wood splinters fly. That's ${dmg} damage to the hull.`,
];

const CURRENT_DRAG_TEXT = [
  (tribe) => `A crosscurrent catches ${tribe}'s ship and drags it sideways. Precious time lost.`,
  (tribe) => `${tribe} fights a brutal current. The ship barely holds course.`,
  (tribe) => `The current turns against ${tribe}. Every stroke just keeps them in place.`,
  (tribe) => `${tribe} rows into a hidden current. The ship stalls. The rowers curse.`,
];

const WHALE_SIGHT_TEXT = [
  (tribe) => `A massive whale surfaces alongside ${tribe}'s ship. The crew stares in awe. A good omen.`,
  (tribe) => `"WHALE!" The ${tribe} crew points. A grey leviathan breaches off the starboard side. Beautiful. Terrifying.`,
  (tribe) => `A whale's tail slaps the water near ${tribe}'s bow. The spray drenches the crew. Nobody cares — it's magnificent.`,
  (tribe) => `${tribe} sails past a pod of whales. The sounds echo through the hull. The crew rows in silence, humbled.`,
];

const SAIL_HERO_TEXT = [
  (n, pr) => `${n} takes the helm and steers through a narrow ice gap. Nerves of steel.`,
  (n, pr) => `${n} spots a faster channel between the floes and redirects the ship. Smart sailing.`,
  (n, pr) => `${n} rows with everything ${pr.sub} has. The oar bends. The ship surges.`,
  (n, pr) => `${n} climbs the mast to scout ahead. "${pr.Sub} sees clear water to starboard!"`,
  (n, pr) => `${n} bails water while rowing. Somehow ${pr.sub} does both. Superhuman effort.`,
  (n, pr) => `${n} leans into each stroke like ${pr.posAdj} life depends on it. The ship responds.`,
  (n, pr) => `${n} takes the rudder and carves a perfect line through the ice field.`,
  (n, pr) => `${n} catches a rogue wave at the perfect angle. The ship shoots forward.`,
];

const SAIL_STRUGGLE_TEXT = [
  (n, pr) => `${n}'s oar catches on ice and snaps. ${pr.Sub} grabs a spare but time is lost.`,
  (n, pr) => `${n} slips on the frozen deck and crashes into the mast. ${pr.Sub} hobbles back to the oar.`,
  (n, pr) => `${n}'s hands are too numb to grip. ${pr.Sub} blows on them desperately between strokes.`,
  (n, pr) => `${n} misjudges the current and steers into a dead end. The crew has to backtrack.`,
  (n, pr) => `${n} freezes up at the tiller. The ship drifts. Someone else has to take over.`,
  (n, pr) => `A wave slams the deck and sweeps ${n}'s feet out. ${pr.Sub} goes sliding into the rail.`,
];

const ALLIANCE_WHISPER_TEXT = [
  (a, b) => `${a} and ${b} huddle at the stern while the others row. Words are exchanged. A deal is forming.`,
  (a, b) => `${a} leans toward ${b} between strokes. "After this... we need to talk." ${b} nods.`,
  (a, b) => `"You and me — final three?" ${a} whispers to ${b}. The boat is too loud for anyone else to hear.`,
  (a, b) => `${a} and ${b} share a look that says more than words. An alliance takes shape on the open sea.`,
];

const SEASICK_TEXT = [
  (n, pr) => `${n} turns green and hangs over the rail. ${pr.Sub}'s done rowing for now.`,
  (n, pr) => `The waves get to ${n}. ${pr.Sub} loses ${pr.posAdj} lunch over the side. The crew grimaces.`,
  (n, pr) => `${n} can't stop the heaving. ${pr.PosAdj} oar floats free. Someone else has to cover.`,
  (n, pr) => `"I'm fine, I'm—" ${n} is NOT fine. ${pr.Sub} spends the rest of the segment bent double.`,
];

const RIVALRY_ROW_TEXT = [
  (a, b) => `${a} and ${b} row against each other's rhythm on purpose. The ship zigzags. Everyone suffers.`,
  (a, b) => `${a} splashes ${b} with ${pronouns(a).posAdj} oar. ${b} splashes back. The ship slows to a crawl.`,
  (a, b) => `"Row FASTER." "YOU row faster." ${a} and ${b}'s rivalry is costing the whole tribe.`,
  (a, b) => `${a} deliberately bumps ${b}'s oar. ${b} retaliates. The coordination is gone.`,
];

const CAPTAIN_ENCOURAGE_TEXT = [
  (captain, tribe) => `${captain} stands at the prow and bellows encouragement. "${tribe}! We are VIKINGS! ROW!"`,
  (captain, tribe) => `${captain} starts a rowing chant. The rhythm catches. The ship picks up speed.`,
  (captain, tribe) => `"I can see the battle ahead!" ${captain} roars. "Nobody stops until we get there!" The crew responds.`,
  (captain, tribe) => `${captain} moves from rower to rower with a word for each. The morale surge is visible in the oar speed.`,
];

// ── PHASE 3: NAVAL BATTLE TEXT ──

const CANNON_HIT_TEXT = [
  (shooter, target, dmg) => `${shooter} fires! BOOM! Direct hit on ${target}'s hull — ${dmg} damage!`,
  (shooter, target, dmg) => `${shooter} lights the fuse. The cannon roars. ${target}'s ship shudders from the ${dmg}-damage impact.`,
  (shooter, target, dmg) => `The cannonball from ${shooter} tears through ${target}'s deck planking. ${dmg} HP gone.`,
  (shooter, target, dmg) => `${shooter} aims for the waterline. CRACK. ${target} takes ${dmg} damage where it hurts most.`,
  (shooter, target, dmg) => `${shooter}'s shot finds its mark. Wood splinters explode from ${target}'s hull. ${dmg} damage.`,
  (shooter, target, dmg) => `FIRE! ${shooter}'s cannonball punches clean through ${target}'s broadside. ${dmg} HP stripped away.`,
];

const CANNON_MISS_TEXT = [
  (shooter, target) => `${shooter} fires wide. The cannonball splashes harmlessly past ${target}'s stern.`,
  (shooter, target) => `${shooter}'s shot goes high. The cannonball sails over ${target}'s mast.`,
  (shooter, target) => `Misfire! ${shooter}'s cannon belches smoke but the ball drops short.`,
  (shooter, target) => `${shooter} pulls the lanyard. The shot skips off the waves and misses ${target} entirely.`,
  (shooter, target) => `The wind shifts just as ${shooter} fires. The cannonball veers wide of ${target}.`,
];

const CANNON_UNLOCK_TEXT = [
  (n, pr) => `${n} cracks the flint mechanism. Sparks fly. The cannon is LIVE. "Fire when ready!"`,
  (n, pr) => `${n} figures out the firing sequence. The cannon roars to life. ${pr.Sub} grins through the smoke.`,
  (n, pr) => `After wrestling with the mechanism, ${n} gets the cannon operational. "WE HAVE FIRE!"`,
  (n, pr) => `${n} aligns the flint and steel. Click. BOOM. The first test shot echoes across the channel.`,
];

const CANNON_UNLOCK_FAIL_TEXT = [
  (n, pr) => `${n} fumbles with the cannon mechanism. Sparks die. "Come ON!" Still locked.`,
  (n, pr) => `${n} can't crack the flint alignment. The cannon stays cold. Another round wasted.`,
  (n, pr) => `${n} tries to force the mechanism. It jams harder. No cannons this round.`,
  (n, pr) => `${n} thinks ${pr.sub}'s got it... nope. False alarm. The cannon won't fire.`,
];

const SAIL_PROGRESS_TEXT = [
  (n, pr, tribe) => `${n} catches wind in the sail and pushes ${tribe}'s ship forward toward the enemy flag.`,
  (n, pr, tribe) => `${n} adjusts the rigging. The ship surges. Closer to the flag.`,
  (n, pr, tribe) => `${n} works the sail with expert hands. ${tribe}'s ship glides through the battle zone.`,
  (n, pr, tribe) => `${n} reads the wind and tacks perfectly. ${tribe} closes the distance.`,
];

const FLAG_GRAB_SUCCESS_TEXT = [
  (n, pr) => `${n} LEAPS from the bow and snatches the flag! "I GOT IT!" The battle is OVER!`,
  (n, pr) => `${n} reaches out... and ${pr.posAdj} fingers close around the flag. IT'S DONE!`,
  (n, pr) => `${n} grabs the flag with both hands and pulls it free. VICTORY!`,
  (n, pr) => `${n} tears the flag from its post mid-swing. The other ships can only watch.`,
];

const FLAG_GRAB_FAIL_TEXT = [
  (n, pr) => `${n} lunges for the flag — and misses! ${pr.PosAdj} fingers brush the fabric but can't hold it.`,
  (n, pr) => `${n} reaches for the flag but the waves pull the ship back at the last second. SO close.`,
  (n, pr) => `${n} stretches out but the flag stays just out of reach. The crew groans.`,
  (n, pr) => `Almost! ${n} gets a hand on the flag but the ship rocks and ${pr.sub} loses ${pr.posAdj} grip.`,
];

const REPAIR_TEXT = [
  (n, pr, hp) => `${n} patches the hull breach with pine tar and planking. +${hp} HP restored.`,
  (n, pr, hp) => `${n} hammers new boards over the damage. The water slows. +${hp} HP.`,
  (n, pr, hp) => `${n} works below deck, sealing leaks. The ship stabilizes. +${hp} HP restored.`,
  (n, pr, hp) => `${n} plugs the worst holes with spare timber. +${hp} HP. It'll hold — for now.`,
];

const RAM_SUCCESS_TEXT = [
  (attacker, target, dmg) => `${attacker} rams STRAIGHT into ${target}'s hull! CRASH! ${dmg} damage inflicted!`,
  (attacker, target, dmg) => `${attacker}'s prow smashes into ${target}'s broadside. Wood explodes. ${dmg} HP destroyed.`,
  (attacker, target, dmg) => `Full speed ahead! ${attacker} drives into ${target} like a battering ram. ${dmg} damage!`,
  (attacker, target, dmg) => `The collision sends shockwaves through both ships. ${target} takes the worst of it: ${dmg} HP.`,
];

const RAM_MISS_TEXT = [
  (attacker) => `${attacker}'s ram attempt goes wide! The ship lurches and the crew scrambles to recover.`,
  (attacker) => `${attacker} tries to ram but misjudges the distance. The ship veers off course.`,
  (attacker) => `The ram fails! ${attacker}'s ship spins sideways in the current. Embarrassing.`,
  (attacker) => `${attacker} charges but the enemy ship slips away. The momentum carries them past.`,
];

const WEATHER_SQUALL_TEXT = [
  () => `A squall ERUPTS across the battlefield! Wind and rain lash every ship. Cannons are near-useless.`,
  () => `Dark clouds roll in. Lightning cracks. The sea churns. Every ship takes a beating.`,
  () => `The weather turns vicious. Waves crash over the decks. Nobody can aim in this.`,
  () => `A wall of rain hits the battle zone. Visibility drops to nothing. Ships collide in the murk.`,
];

const FRIENDLY_FIRE_TEXT = [
  (n, tribe) => `DISASTER — ${n}'s cannon fires into ${tribe}'s OWN ship! "WHO LOADED THAT?!"`,
  (n, tribe) => `${n} pulls the wrong lanyard. The shot tears through ${tribe}'s own rigging. Catastrophic.`,
  (n, tribe) => `Friendly fire! ${n}'s cannonball hits ${tribe}'s mast. The crew ducks. Trust evaporates.`,
  (n, tribe) => `In the chaos, ${n} fires on ${tribe}'s own hull. The scream from below deck says it all.`,
];

const BOARDING_SUCCESS_TEXT = [
  (n, target) => `${n} SWINGS across on a rope and lands on ${target}'s deck! Ammo seized!`,
  (n, target) => `${n} boards ${target}'s ship in a daring leap. Before they can react, ${n} grabs their ammo stores.`,
  (n, target) => `${n} crashes onto ${target}'s deck like a raider. Two ammo crates under ${pronouns(n).posAdj} arms. Gone before they recover.`,
  (n, target) => `${n} vaults the gap between ships and storms ${target}'s ammo hold. In. Out. Legendary.`,
];

const BOARDING_FAIL_TEXT = [
  (n, target) => `${n} tries to board ${target}'s ship but the crew throws ${pronouns(n).obj} back. Hard landing.`,
  (n, target) => `${n} leaps for ${target}'s deck and misses. ${pronouns(n).Sub} dangles from the rail before dropping back.`,
  (n, target) => `${n}'s boarding attempt is repelled. ${target}'s crew shoves ${pronouns(n).obj} overboard.`,
  (n, target) => `${n} gets halfway onto ${target}'s ship before a defender kicks ${pronouns(n).obj} off the gunwale.`,
];

const HUMAN_CANNONBALL_TEXT = [
  (n, target, dmg) => `${n} CLIMBS INTO THE CANNON. "Fire me." They fire ${pronouns(n).obj}. ${n} smashes into ${target}'s mast. ${dmg} DAMAGE. ${n} is out of the fight. LEGENDARY.`,
  (n, target, dmg) => `"Load me up." ${n} curls into the barrel. BOOM. ${n} rockets across the water and crashes through ${target}'s deck. ${dmg} damage. ${n} doesn't get up. But ${pronouns(n).posAdj} tribe won't forget this.`,
  (n, target, dmg) => `The most insane thing anyone has ever done on this show: ${n} FIRES ${pronouns(n).ref} at ${target}'s ship. ${dmg} HP destroyed. ${n} is injured. The tribe is screaming.`,
  (n, target, dmg) => `${n}: "I have an idea. A bad one." Five seconds later ${pronouns(n).sub}'s airborne. ${target}'s hull explodes on impact. ${dmg} damage. ${n} is done for the day. But WHAT a play.`,
];

const HEROIC_SHIELD_TEXT = [
  (n, tribe) => `${n} throws ${pronouns(n).ref} in front of the incoming cannonball. The hit lands on ${pronouns(n).obj} instead of the hull. 20 HP saved. ${n} crumples but the ship survives.`,
  (n, tribe) => `"GET DOWN!" ${n} takes the cannon hit meant for ${tribe}'s hull. ${pronouns(n).Sub} absorbs the impact. The ship holds.`,
  (n, tribe) => `${n} shields the breach with ${pronouns(n).posAdj} body. The cannonball slams into ${pronouns(n).obj}. ${tribe}'s ship stays afloat. ${n} might not.`,
  (n, tribe) => `${n} steps into the line of fire. The shot hits ${pronouns(n).obj} square in the back. The hull is intact. ${n} isn't moving.`,
];

const FLAMING_AMMO_TEXT = [
  (tribe, target) => `FLAMING AMMO! ${tribe}'s ship is desperate — they light the cannonballs on fire! DOUBLE DAMAGE!`,
  (tribe, target) => `${tribe} wraps their ammo in oil-soaked rags and lights them. The shots burn through ${target}'s hull.`,
  (tribe, target) => `Fire in the hole — LITERALLY. ${tribe} goes full scorched-earth with flaming cannonballs.`,
  (tribe, target) => `${tribe}'s crew sets the ammo ablaze. Every hit now burns AND smashes. ${target} is in serious trouble.`,
];

const COWARD_TEXT = [
  (n, pr) => `${n} crawls below deck and refuses to come up. "I can't do this. I CAN'T." ${pr.Sub}'s out for 2 rounds.`,
  (n, pr) => `${n} locks ${pr.ref} in the cargo hold. ${pr.Sub} can hear the battle but won't rejoin. Cowardice, plain and simple.`,
  (n, pr) => `"This is too much!" ${n} drops ${pr.posAdj} oar and hides. The tribe is down a body for 2 rounds.`,
  (n, pr) => `${n} freezes. Then retreats. Then curls up behind the mast. ${pr.Sub} is not built for naval warfare.`,
];

const BATTLE_CRY_TEXT = [
  (n, tribe) => `${n} stands on the prow and ROARS. The sound carries across the water. ${tribe}'s crew fights harder.`,
  (n, tribe) => `"FOR ${tribe.toUpperCase()}!" ${n} screams. The whole crew echoes it. Something shifts. They're fighting as one.`,
  (n, tribe) => `${n} starts pounding ${pronouns(n).posAdj} shield and chanting. The rhythm spreads. ${tribe}'s ship moves with purpose.`,
  (n, tribe) => `${n} rallies the crew with a war cry that sends chills down spines — friend and foe alike.`,
];

const MUTINY_TEXT = [
  (n, tribe) => `${n} tries to take control of ${tribe}'s ship. "This captain is going to get us KILLED!" The crew hesitates.`,
  (n, tribe) => `Mutiny on the high seas! ${n} demands new leadership. The tribe splits. Chaos erupts.`,
  (n, tribe) => `${n} grabs the tiller and tries to steer the ship away from battle. The crew fights ${pronouns(n).obj} for control.`,
  (n, tribe) => `"I'm taking over!" ${n} announces. Nobody follows. The mutiny dies on the deck.`,
];

const MUTINY_SUCCESS_TEXT = [
  (n, tribe) => `${n} seizes control of ${tribe}'s ship! The old captain is shoved aside. New orders ring out.`,
  (n, tribe) => `MUTINY! ${n} takes the helm of ${tribe}'s longship. The crew falls in line. This ship has a new captain.`,
  (n, tribe) => `${n} rips the tiller from the captain's hands. "MY ship now." ${tribe} sails under new command.`,
  (n, tribe) => `The crew sides with ${n}. ${tribe}'s captain steps down. The mutineer takes the wheel. New era.`,
  (n, tribe) => `${n} calls for a vote on the deck. The tribe backs ${pronouns(n).obj}. ${tribe} has a new leader mid-battle.`,
];

const CANNON_SABOTAGE_TEXT = [
  (n, target) => `${n} jams something into ${target}'s cannon barrel when nobody's looking. It won't fire next round.`,
  (n, target) => `Sabotage! ${n} sabotages ${target}'s cannon during the chaos. The mechanism locks.`,
  (n, target) => `${n} sneaks to ${target}'s cannon and wedges a nail into the firing mechanism. Jammed.`,
  (n, target) => `${n} pours water into ${target}'s powder store. The cannon is useless for a round.`,
];

const PATCH_GENIUS_TEXT = [
  (n, pr, hp) => `${n} works magic below deck. ${pr.Sub} reinforces the hull with cross-braces nobody thought of. +${hp} HP. Genius.`,
  (n, pr, hp) => `${n} finds structural weak points and shores them up with a technique that shouldn't work but does. +${hp} HP restored.`,
  (n, pr, hp) => `"Give me five minutes." ${n} disappears below deck and comes back with a rebuilt hull section. +${hp} HP.`,
  (n, pr, hp) => `${n}'s engineering instincts kick in. ${pr.Sub} restructures the damaged hull from the inside out. +${hp} HP.`,
];

const FLAG_INTERFERENCE_TEXT = [
  (n, pr, target) => `${n} hooks ${target}'s rigging with a grapple, dragging their ship away from the flag. Brilliant play.`,
  (n, pr, target) => `${n} throws a boarding net across ${target}'s bow. They have to cut free before they can reach the flag.`,
  (n, pr, target) => `${n} rams ${target}'s rudder with a loose beam. The ship spins away from the flag.`,
  (n, pr, target) => `${n} fires a chain shot that tangles ${target}'s rigging. No flag grab this round.`,
];

const SINK_TEXT = [
  (tribe) => `${tribe}'s ship goes under! Water pours through the breaches. The crew abandons ship. IT'S OVER.`,
  (tribe) => `The hull gives way. ${tribe}'s longship lists hard to port, then capsizes. They're done.`,
  (tribe) => `SUNK! ${tribe}'s ship disappears beneath the waves. The crew floats in the icy water, defeated.`,
  (tribe) => `${tribe}'s ship breaks apart. The mast topples. The crew swims for debris. A devastating loss.`,
];

const FLAG_WIN_TEXT = [
  (tribe) => `${tribe} CAPTURES THE FLAG! The longship erupts with celebration. VICTORY ON THE HIGH SEAS!`,
  (tribe) => `THE FLAG IS ${tribe.toUpperCase()}'S! The crew roars. The other ships can only watch.`,
  (tribe) => `${tribe} pulls the flag aboard. It's official. They own this battle.`,
  (tribe) => `FLAG SECURED! ${tribe}'s crew waves it from the mast. The war is won.`,
];

const TIMEOUT_TEXT = [
  () => `The horn sounds! Time's up! The battle ends without a decisive victory.`,
  () => `Twelve rounds of carnage and no flag captured, no ship sunk. It goes to the judges.`,
  () => `The war horn echoes across the water. Both fleets still float. Closest to the flag wins.`,
  () => `Time expires! Neither fleet achieved a knockout. Distance to the flag decides it.`,
];

// ── COMM CHATTER ──
const CHATTER_P1 = [
  `Sawdust and rune-dust fill the air. Hammers ring against the cold.`,
  `The beach stinks of pine tar and desperation.`,
  `Blueprint fragments scatter in the wind. Someone better catch those.`,
  `"More pegs! We need MORE PEGS!" echoes from three directions.`,
  `The dragon heads are taking shape. The fear in the rival camp is palpable.`,
  `A gull lands on an unfinished mast. Nobody has time to shoo it away.`,
  `The tide creeps in. They need to finish before the beach disappears.`,
  `Pine tar fumes make eyes water. Nobody stops working.`,
  `Wood shavings curl at everyone's feet. The beach looks like a carpenter's nightmare.`,
  `The wind picks up. Loose fragments go airborne. Chaos.`,
];

const CHATTER_P2 = [
  `Oars crack the ice. The channel stretches ahead, dark and unforgiving.`,
  `Frozen spray coats the decks. Everything is slippery. Everything is dangerous.`,
  `The longships slice through the fjord like knives through silence.`,
  `Someone vomits over the rail. Nobody judges. The waves are brutal.`,
  `Ice groans around them. The channel narrows. The crews row harder.`,
  `Whale song echoes through the hull. Beautiful and deeply unsettling.`,
  `The sail catches and the ship lurches. Rowers scramble for grip.`,
  `Breath turns to frost the moment it leaves the mouth. This is Viking territory.`,
  `The shore recedes. There's no going back now.`,
  `Rogue waves crash over the bow. The crew bails water between strokes.`,
];

const CHATTER_P3 = [
  `CANNON FIRE echoes across the water. The battle has begun.`,
  `Smoke and splinters fill the air. Visibility is dropping fast.`,
  `The flag flutters in the wind. Every ship wants it. Only one gets it.`,
  `Hull planks groan. Water seeps in. Repair crews work frantically.`,
  `A cannonball whistles overhead. Everyone ducks. Nobody breathes.`,
  `The battle flag is dead ahead. But so is the enemy fleet.`,
  `Blood and seawater mix on the deck. This is war.`,
  `The mast creaks. If that goes down, they're done.`,
  `Ammo's running low. Every shot has to count from here.`,
  `The wind shifts. Every captain recalculates. The battle turns.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════

export function simulateVikingSour(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return ep;

  const tribeData = tribes.map(t => ({
    name: t.name,
    members: t.members.filter(m => gs.activePlayers.includes(m)),
    color: tribeColor(t.name) || '#888'
  }));

  if (!ep.campEvents) ep.campEvents = {};
  tribeData.forEach(t => {
    if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] };
  });
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  const allActive = tribeData.flatMap(t => t.members);
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  // ═══════════════════════════════════════════════
  // PHASE 1: BLUEPRINT ASSEMBLY
  // ═══════════════════════════════════════════════
  const tribeClarity = {};
  const tribeBuildQuality = {};
  const tribeAssemblyDone = {};
  const tribeBoatHP = {};
  const phase1Events = [];
  let phase1Winner = null;

  tribeData.forEach(t => {
    tribeClarity[t.name] = 0;
    tribeAssemblyDone[t.name] = false;
  });

  // Study rounds — accumulate clarity
  const MAX_STUDY_ROUNDS = 5;
  const eurekaUsed = new Set();
  const tribeEurekaCount = {};
  const MAX_EUREKAS_PER_TRIBE = 2;
  tribeData.forEach(t => { tribeEurekaCount[t.name] = 0; });
  for (let round = 0; round < MAX_STUDY_ROUNDS; round++) {
    tribeData.forEach(t => {
      if (tribeClarity[t.name] >= 100) return;

      // Eureka candidate: pick 1 best mental+intuition member per round (caps tribe size advantage)
      const eurekaCandidate = tribeEurekaCount[t.name] < MAX_EUREKAS_PER_TRIBE
        ? t.members.filter(n => !eurekaUsed.has(n))
            .map(n => ({ name: n, score: pStats(n).mental + pStats(n).intuition + noise(2.5) }))
            .sort((a, b) => b.score - a.score)[0] || null
        : null;

      t.members.forEach(n => {
        const s = pStats(n);
        const pr = pronouns(n);
        const fragQuality = s.mental * 0.4 + s.intuition * 0.3 + noise(2.5);
        const clarityGain = Math.max(0, fragQuality * 1.2);
        tribeClarity[t.name] = clamp(tribeClarity[t.name] + clarityGain / t.members.length, 0, 100);
        ep.chalMemberScores[n] += Math.round(fragQuality * 0.5);

        // Eureka: only the round's best candidate gets a shot (1 attempt per tribe per round)
        if (eurekaCandidate && eurekaCandidate.name === n && eurekaCandidate.score > 15 && Math.random() < 0.5) {
          eurekaUsed.add(n);
          tribeEurekaCount[t.name]++;
          tribeClarity[t.name] = clamp(tribeClarity[t.name] + 25 / t.members.length, 0, 100);
          ep.chalMemberScores[n] += 10;
          popDelta(n, 2);
          phase1Events.push({
            type: 'eureka', player: n, tribe: t.name, round,
            text: pick(EUREKA_TEXT)(n, pr),
            score: 10, badge: 'EUREKA', badgeClass: 'eureka'
          });
        } else if (Math.random() < 0.35 || round === MAX_STUDY_ROUNDS - 1) {
          phase1Events.push({
            type: 'study', player: n, tribe: t.name, round,
            text: pick(STUDY_TEXT)(n, pr),
            score: Math.round(fragQuality * 0.5), badge: 'STUDY', badgeClass: 'build'
          });
        }
      });
    });

    // Social events (2-3 per tribe per phase total, spread across rounds)
    if (round === 1 || round === 3) {
      tribeData.forEach(t => {
        if (t.members.length < 2) return;
        const eventRoll = Math.random();

        if (eventRoll < 0.25) {
          // Argument
          const pair = _randomPair(t.members);
          if (pair) {
            const [a, b] = pair;
            addBond(a, b, -1);
            ep.chalMemberScores[a] -= 2;
            ep.chalMemberScores[b] -= 2;
            phase1Events.push({
              type: 'argument', players: [a, b], tribe: t.name, round,
              text: pick(ARGUMENT_TEXT)(a, b),
              score: -2, badge: 'ARGUMENT', badgeClass: 'social'
            });
            ep.campEvents[t.name].post.push({
              type: 'vs-argument',
              text: `${a} and ${b} clashed during the blueprint assembly`,
              players: [a, b], badgeText: 'Blueprint Clash', badgeClass: 'badge-negative'
            });
          }
        } else if (eventRoll < 0.4) {
          // Sabotage (villain only, targets rival)
          const schemers = t.members.filter(n => canScheme(n));
          const rivalTribes = tribeData.filter(rt => rt.name !== t.name);
          if (schemers.length > 0 && rivalTribes.length > 0) {
            const saboteur = pick(schemers);
            const pr = pronouns(saboteur);
            const rivalTribe = pick(rivalTribes);
            // Caught check
            const catchers = rivalTribe.members.filter(n => pStats(n).intuition > 5);
            const caught = catchers.length > 0 && Math.random() < 0.4;
            if (caught) {
              const catcher = pick(catchers);
              ep.chalMemberScores[saboteur] -= 5;
              popDelta(saboteur, -1);
              addBond(catcher, saboteur, -2);
              phase1Events.push({
                type: 'sabotageCaught', player: saboteur, catcher, tribe: t.name, targetTribe: rivalTribe.name, round,
                text: pick(SABOTAGE_CAUGHT_TEXT)(saboteur, catcher),
                score: -5, badge: 'BUSTED', badgeClass: 'chaos'
              });
              ep.campEvents[t.name].post.push({
                type: 'vs-sabotage-caught',
                text: `${saboteur} was caught trying to sabotage ${rivalTribe.name}'s ship by ${catcher}`,
                players: [saboteur, catcher], badgeText: 'Sabotage Caught', badgeClass: 'badge-negative'
              });
            } else {
              tribeBuildQuality[rivalTribe.name] = (tribeBuildQuality[rivalTribe.name] || 0) - 10;
              phase1Events.push({
                type: 'sabotage', player: saboteur, tribe: t.name, targetTribe: rivalTribe.name, round,
                text: pick(SABOTAGE_TEXT)(saboteur, pr),
                score: 0, badge: 'SABOTAGE', badgeClass: 'chaos'
              });
            }
          }
        } else if (eventRoll < 0.55) {
          // Flirting distraction
          const pair = _romanticPair(t.members);
          if (pair) {
            const [a, b] = pair;
            ep.chalMemberScores[a] -= 3;
            ep.chalMemberScores[b] -= 3;
            addBond(a, b, 1);
            phase1Events.push({
              type: 'flirt', players: [a, b], tribe: t.name, round,
              text: pick(FLIRT_TEXT)(a, b),
              score: -3, badge: 'DISTRACTED', badgeClass: 'social'
            });
          }
        } else if (eventRoll < 0.7) {
          // Leadership clash
          const candidates = t.members.filter(n => pStats(n).strategic > 4);
          if (candidates.length >= 2) {
            const sorted = candidates.map(n => ({
              name: n,
              score: pStats(n).strategic * 0.4 + pStats(n).social * 0.3 + noise(2.5)
            })).sort((a, b) => b.score - a.score);
            const winner = sorted[0].name;
            const loser = sorted[1].name;
            ep.chalMemberScores[loser] -= 2;
            addBond(winner, loser, -0.5);
            phase1Events.push({
              type: 'leaderClash', winner, loser, tribe: t.name, round,
              text: pick(LEADERSHIP_CLASH_TEXT)(winner, loser),
              score: -2, badge: 'POWER PLAY', badgeClass: 'social'
            });
          }
        } else if (eventRoll < 0.85) {
          // Eureka credit steal
          const eurekaPlayers = phase1Events.filter(e => e.type === 'eureka' && e.tribe === t.name).map(e => e.player);
          const thieves = t.members.filter(n => canScheme(n) && !eurekaPlayers.includes(n));
          if (eurekaPlayers.length > 0 && thieves.length > 0) {
            const thief = pick(thieves);
            const victim = pick(eurekaPlayers);
            addBond(thief, victim, -2);
            popDelta(victim, -1);
            phase1Events.push({
              type: 'creditSteal', thief, victim, tribe: t.name, round,
              text: pick(CREDIT_STEAL_TEXT)(thief, victim),
              score: 0, badge: 'CREDIT STOLEN', badgeClass: 'chaos'
            });
            ep.campEvents[t.name].post.push({
              type: 'vs-credit-steal',
              text: `${thief} took credit for ${victim}'s discovery during blueprint assembly`,
              players: [thief, victim], badgeText: 'Credit Stolen', badgeClass: 'badge-negative'
            });
          }
        }
      });
    }
  }

  // Assembly phase — build the ship when clarity > 30%
  tribeData.forEach(t => {
    if (tribeClarity[t.name] < 30) tribeClarity[t.name] = 30; // minimum to proceed
    let buildScore = 0;
    t.members.forEach(n => {
      const s = pStats(n);
      const avgBond = t.members.filter(m => m !== n).reduce((sum, m) => sum + getBond(n, m), 0) / Math.max(1, t.members.length - 1);
      const teamwork = clamp((avgBond + 10) / 2, 0, 10);
      const contribution = s.physical * 0.4 + s.mental * 0.3 + teamwork * 0.3 + noise(2.5);
      buildScore += contribution;
      const memberBuildScore = clamp(Math.round(contribution), 3, 8);
      ep.chalMemberScores[n] += memberBuildScore;

      if (Math.random() < 0.5) {
        phase1Events.push({
          type: 'build', player: n, tribe: t.name, round: 'assembly',
          text: pick(BUILD_TEXT)(n, pronouns(n)),
          score: memberBuildScore, badge: 'BUILD', badgeClass: 'build'
        });
      }
    });

    const rawQuality = clamp(buildScore / t.members.length + (tribeBuildQuality[t.name] || 0), 0, 100);
    tribeBuildQuality[t.name] = rawQuality;
    tribeAssemblyDone[t.name] = true;

    // Boat HP from build quality — scaled high so naval battles last 5-8 rounds
    tribeBoatHP[t.name] = clamp(Math.round(rawQuality * 25), 150, 250);
  });

  // Determine P1 winner by clarity + build quality
  const p1Ranking = tribeData.map(t => ({
    name: t.name,
    score: tribeClarity[t.name] * 0.5 + (tribeBuildQuality[t.name] || 0) * 0.5
  })).sort((a, b) => b.score - a.score);
  phase1Winner = p1Ranking[0].name;

  // Winning tribe bonus
  tribeData.find(t => t.name === phase1Winner)?.members.forEach(n => {
    ep.chalMemberScores[n] += 5;
  });

  // Snapshot Phase 1 HP before Phase 2/3 mutate tribeBoatHP
  const phase1BoatHP = { ...tribeBoatHP };

  // ═══════════════════════════════════════════════
  // PHASE 2: LAUNCH & SAIL
  // ═══════════════════════════════════════════════
  const phase2Events = [];
  const tribePositions = {}; // track arrival order
  const tribeSailProgress = {};
  let arrivalOrder = [];

  const iceBreakUsedTexts = new Set();
  tribeData.forEach(t => {
    tribeSailProgress[t.name] = 0;

    // Launch phase — pick 2 best pushers (normalize tribe size)
    const launchCandidates = t.members
      .map(n => ({ name: n, score: pStats(n).physical * 0.5 + pStats(n).endurance * 0.3 + noise(2.5) }))
      .sort((a, b) => b.score - a.score);
    const pushers = launchCandidates.slice(0, 2);
    const launchTotal = pushers.reduce((s, p) => s + p.score, 0);
    const hpBonus = tribeBoatHP[t.name] >= 230 ? 3 : tribeBoatHP[t.name] >= 180 ? 1.5 : 0;
    const launchSuccess = (launchTotal + hpBonus) > 9 + noise(2);

    pushers.forEach(p => {
      const memberScore = clamp(Math.round(p.score * 0.6), 1, 4);
      ep.chalMemberScores[p.name] += memberScore;
      phase2Events.push({
        type: 'launch', player: p.name, tribe: t.name,
        text: pick(LAUNCH_TEXT)(p.name, pronouns(p.name)),
        score: memberScore, badge: 'LAUNCH', badgeClass: 'sail'
      });
    });

    if (!launchSuccess) {
      tribeSailProgress[t.name] -= 3;
      phase2Events.push({
        type: 'launchStall', tribe: t.name,
        text: `${t.name}'s ship gets stuck in the sand! The crew scrambles to free it. Precious time lost.`,
        badge: 'STALLED', badgeClass: 'chaos'
      });
    }

    // Ice breaking attempt
    const iceBreaker = t.members.reduce((best, n) => {
      const score = pStats(n).boldness * 0.5 + pStats(n).physical * 0.5;
      return score > (best.score || 0) ? { name: n, score } : best;
    }, { name: t.members[0], score: 0 });

    const iceScore = pStats(iceBreaker.name).boldness + pStats(iceBreaker.name).physical + noise(2.5);
    const icePr = pronouns(iceBreaker.name);
    if (iceScore > 12) {
      ep.chalMemberScores[iceBreaker.name] += 8;
      // Avoid text repetition across tribes
      let iceText;
      for (let attempt = 0; attempt < 8; attempt++) {
        iceText = pick(ICE_BREAK_SUCCESS_TEXT)(iceBreaker.name, icePr);
        if (!iceBreakUsedTexts.has(iceText) || attempt >= 7) break;
      }
      iceBreakUsedTexts.add(iceText);
      phase2Events.push({
        type: 'iceBreakSuccess', player: iceBreaker.name, tribe: t.name,
        text: iceText,
        score: 8, badge: 'ICE BREAK', badgeClass: 'sail'
      });
    } else {
      ep.chalMemberScores[iceBreaker.name] -= 3;
      phase2Events.push({
        type: 'iceBreakFail', player: iceBreaker.name, tribe: t.name,
        text: pick(ICE_BREAK_FAIL_TEXT)(iceBreaker.name, icePr),
        score: -3, badge: 'ICE BLOCK', badgeClass: 'chaos'
      });
    }

    // 3-segment sailing with individual player moments
    for (let seg = 0; seg < 3; seg++) {
      const endAvg = t.members.reduce((s, n) => s + pStats(n).endurance, 0) / t.members.length;
      const physAvg = t.members.reduce((s, n) => s + pStats(n).physical, 0) / t.members.length;
      const bq = (tribeBuildQuality[t.name] || 50) / 10;
      const hpFactor = clamp(tribeBoatHP[t.name] / 250, 0.6, 1.0);
      const segSpeed = (endAvg * 0.4 + physAvg * 0.3 + bq * 0.3 + noise(2)) * hpFactor;
      tribeSailProgress[t.name] += Math.max(0, segSpeed);

      // Individual player moment each segment (hero or struggle)
      const segPlayer = t.members[seg % t.members.length];
      const sp = pStats(segPlayer);
      const sailCheck = sp.endurance * 0.4 + sp.physical * 0.3 + noise(2.5);
      if (sailCheck > 5) {
        const heroScore = clamp(Math.round(sailCheck * 0.6), 2, 5);
        ep.chalMemberScores[segPlayer] += heroScore;
        tribeSailProgress[t.name] += 1.5;
        phase2Events.push({
          type: 'sailHero', player: segPlayer, tribe: t.name, segment: seg,
          text: pick(SAIL_HERO_TEXT)(segPlayer, pronouns(segPlayer)),
          score: heroScore, badge: 'HELM', badgeClass: 'sail'
        });
      } else {
        ep.chalMemberScores[segPlayer] -= 2;
        tribeSailProgress[t.name] -= 1;
        phase2Events.push({
          type: 'sailStruggle', player: segPlayer, tribe: t.name, segment: seg,
          text: pick(SAIL_STRUGGLE_TEXT)(segPlayer, pronouns(segPlayer)),
          score: -2, badge: 'STRUGGLE', badgeClass: 'chaos'
        });
      }

      // Tribe-level sail card (50% chance, shows overall progress)
      if (Math.random() < 0.4) {
        const segScore = clamp(Math.round(segSpeed * 0.5), 2, 5);
        t.members.forEach(n => { ep.chalMemberScores[n] += Math.round(segScore / t.members.length); });
        phase2Events.push({
          type: 'sail', tribe: t.name, segment: seg,
          text: pick(SAIL_SEGMENT_TEXT)(t.name),
          score: segScore, badge: 'SAIL', badgeClass: 'sail'
        });
      }

      // Social events (spread across segments, not just seg 1)
      if (seg === 1 || seg === 2) {
        const socialRoll = Math.random();
        if (seg === 1 && socialRoll < 0.3 && t.members.length >= 2) {
          const pair = _randomPair(t.members);
          if (pair) {
            const [a, b] = pair;
            addBond(a, b, 2);
            phase2Events.push({
              type: 'allianceWhisper', players: [a, b], tribe: t.name,
              text: pick(ALLIANCE_WHISPER_TEXT)(a, b),
              badge: 'ALLIANCE', badgeClass: 'social'
            });
            ep.campEvents[t.name].post.push({
              type: 'vs-alliance-whisper',
              text: `${a} and ${b} formed a bond during the sailing phase`,
              players: [a, b], badgeText: 'Sea Bond', badgeClass: 'badge-positive'
            });
          }
        } else if (seg === 1 && socialRoll < 0.5) {
          const sickCandidate = t.members.reduce((worst, n) =>
            pStats(n).endurance < (pStats(worst).endurance) ? n : worst, t.members[0]);
          if (pStats(sickCandidate).endurance * 0.8 + noise(2.5) < 5) {
            ep.chalMemberScores[sickCandidate] -= 4;
            tribeSailProgress[t.name] -= 2;
            phase2Events.push({
              type: 'seasick', player: sickCandidate, tribe: t.name,
              text: pick(SEASICK_TEXT)(sickCandidate, pronouns(sickCandidate)),
              score: -4, badge: 'SEASICK', badgeClass: 'chaos'
            });
          }
        } else if (seg === 2 && socialRoll < 0.35 && t.members.length >= 2) {
          const pair = _rivalPair(t.members);
          if (pair) {
            const [a, b] = pair;
            addBond(a, b, -1);
            ep.chalMemberScores[a] -= 2;
            ep.chalMemberScores[b] -= 2;
            tribeSailProgress[t.name] -= 1.5;
            phase2Events.push({
              type: 'rivalryRow', players: [a, b], tribe: t.name,
              text: pick(RIVALRY_ROW_TEXT)(a, b),
              score: -2, badge: 'ROWING CLASH', badgeClass: 'social'
            });
          }
        } else if (seg === 2 && socialRoll < 0.6) {
          const captain = t.members.reduce((best, n) =>
            pStats(n).social > pStats(best).social ? n : best, t.members[0]);
          const captainScore = pStats(captain).social * 0.5 + noise(2.5);
          if (captainScore > 3) {
            tribeSailProgress[t.name] += 3;
            t.members.forEach(m => { if (m !== captain) addBond(captain, m, 1); });
            ep.chalMemberScores[captain] += 3;
            phase2Events.push({
              type: 'captainEncourage', captain, tribe: t.name,
              text: pick(CAPTAIN_ENCOURAGE_TEXT)(captain, t.name),
              score: 3, badge: 'RALLIED', badgeClass: 'social'
            });
          }
        }
      }
    }
  });

  // Weather events — 1 per segment, affects ALL tribes (not per-tribe)
  for (let seg = 0; seg < 3; seg++) {
    const weatherRoll = Math.random();
    if (weatherRoll < 0.25) {
      const luckyTribe = pick(tribeData);
      tribeSailProgress[luckyTribe.name] += 5;
      phase2Events.push({
        type: 'wind', tribe: luckyTribe.name, segment: seg,
        text: pick(WIND_FAVORABLE_TEXT)(luckyTribe.name),
        badge: 'TAILWIND', badgeClass: 'sail'
      });
    } else if (weatherRoll < 0.45) {
      const unluckyTribe = pick(tribeData);
      const dmg = 8 + Math.floor(Math.random() * 8);
      tribeBoatHP[unluckyTribe.name] = Math.max(0, tribeBoatHP[unluckyTribe.name] - dmg);
      phase2Events.push({
        type: 'iceCollision', tribe: unluckyTribe.name, segment: seg, damage: dmg,
        text: pick(ICE_COLLISION_TEXT)(unluckyTribe.name, dmg),
        badge: `−${dmg} HP`, badgeClass: 'chaos'
      });
    } else if (weatherRoll < 0.6) {
      const draggedTribe = pick(tribeData);
      tribeSailProgress[draggedTribe.name] -= 3;
      phase2Events.push({
        type: 'current', tribe: draggedTribe.name, segment: seg,
        text: pick(CURRENT_DRAG_TEXT)(draggedTribe.name),
        badge: 'DRAGGED', badgeClass: 'chaos'
      });
    } else if (weatherRoll < 0.7) {
      const whaleTribe = pick(tribeData);
      for (let wi = 0; wi < whaleTribe.members.length; wi++)
        for (let wj = wi + 1; wj < whaleTribe.members.length; wj++)
          addBond(whaleTribe.members[wi], whaleTribe.members[wj], 0.5);
      phase2Events.push({
        type: 'whale', tribe: whaleTribe.name, segment: seg,
        text: pick(WHALE_SIGHT_TEXT)(whaleTribe.name),
        badge: 'WHALE', badgeClass: 'sail'
      });
    }
  }

  // Determine arrival order by sail progress
  arrivalOrder = tribeData.map(t => ({
    name: t.name,
    progress: tribeSailProgress[t.name]
  })).sort((a, b) => b.progress - a.progress);
  arrivalOrder.forEach((t, i) => { tribePositions[t.name] = i; });

  // Snapshot Phase 2 HP before Phase 3 mutates tribeBoatHP
  const phase2BoatHP = { ...tribeBoatHP };

  // ═══════════════════════════════════════════════
  // PHASE 3: NAVAL BATTLE
  // ═══════════════════════════════════════════════
  const phase3Events = [];
  const MAX_ROUNDS = 12;
  const TOTAL_AMMO = {};
  const CANNON_UNLOCKED = {};
  const FLAG_DISTANCE = {};
  const SAIL_ACCUM = {};
  const COWARD_ROUNDS = {};
  const CANNON_JAMMED = {};
  const HUMAN_CANNONBALL_USED = {};
  const PATCH_GENIUS_USED = {};
  let battleWinner = null;
  let battleEndReason = null;

  const ACTION_SLOTS = 3; // fixed slots per tribe per round — neutralizes tribe size advantage
  tribeData.forEach(t => {
    const isFlintTribe = t.name === phase1Winner;
    TOTAL_AMMO[t.name] = isFlintTribe ? 20 : 16;
    CANNON_UNLOCKED[t.name] = isFlintTribe;
    FLAG_DISTANCE[t.name] = 100 - (tribePositions[t.name] === 0 ? 15 : 0);
    SAIL_ACCUM[t.name] = 0;
    CANNON_JAMMED[t.name] = false;
    HUMAN_CANNONBALL_USED[t.name] = false;
    PATCH_GENIUS_USED[t.name] = false;
  });
  allActive.forEach(n => { COWARD_ROUNDS[n] = 0; });

  for (let round = 0; round < MAX_ROUNDS; round++) {
    if (battleWinner) break;

    // Decrement coward cooldowns once per round (not per tribe)
    allActive.forEach(n => { if (COWARD_ROUNDS[n] > 0) COWARD_ROUNDS[n]--; });

    // Auto-unlock non-flint tribes at round 1 — flint tribe's advantage is 1 free round of fire + extra ammo
    if (round === 1) {
      tribeData.forEach(t => {
        if (!CANNON_UNLOCKED[t.name] && tribeBoatHP[t.name] > 0) {
          CANNON_UNLOCKED[t.name] = true;
          const unlocker = t.members.reduce((best, n) =>
            pStats(n).mental + pStats(n).boldness > pStats(best).mental + pStats(best).boldness ? n : best, t.members[0]);
          ep.chalMemberScores[unlocker] += 3;
          phase3Events.push({
            type: 'cannonUnlock', player: unlocker, tribe: t.name, round,
            text: pick(CANNON_UNLOCK_TEXT)(unlocker, pronouns(unlocker)),
            score: 3, badge: 'UNLOCKED', badgeClass: 'cannon'
          });
        }
      });
    }

    tribeData.forEach(t => {
      if (tribeBoatHP[t.name] <= 0 || battleWinner) return;
      const enemies = tribeData.filter(et => et.name !== t.name && tribeBoatHP[et.name] > 0);
      if (enemies.length === 0) return;
      // Target selection: weighted by proximity (closest flag distance) + grudge (lowest bond) + vulnerability
      const target = enemies.reduce((best, et) => {
        const distScore = (100 - FLAG_DISTANCE[et.name]) * 0.3; // closer to flag = higher priority
        const vulnScore = (250 - tribeBoatHP[et.name]) * 0.1; // more damaged = slightly higher priority
        const bondAvg = t.members.reduce((s, n) => s + et.members.reduce((s2, m) => s2 + getBond(n, m), 0), 0) / (t.members.length * et.members.length || 1);
        const grudgeScore = Math.max(0, -bondAvg) * 2; // negative bonds = grudge
        const totalScore = distScore + vulnScore + grudgeScore + noise(3);
        const bestDistScore = (100 - FLAG_DISTANCE[best.name]) * 0.3;
        const bestVulnScore = (250 - tribeBoatHP[best.name]) * 0.1;
        const bestBondAvg = t.members.reduce((s, n) => s + best.members.reduce((s2, m) => s2 + getBond(n, m), 0), 0) / (t.members.length * best.members.length || 1);
        const bestGrudgeScore = Math.max(0, -bestBondAvg) * 2;
        const bestTotalScore = bestDistScore + bestVulnScore + bestGrudgeScore + noise(3);
        return totalScore > bestTotalScore ? et : best;
      }, enemies[0]);

      // Pick best member for each action slot role
      const available = t.members.filter(n => COWARD_ROUNDS[n] === 0);
      if (available.length === 0) return;

      // Score each available member for each role
      const scored = available.map(n => {
        const s = pStats(n);
        const a = arch(n);
        const fireScore = (s.physical * 0.3 + s.intuition * 0.4 + noise(1.5)) * ((['challenge-beast', 'hothead'].includes(a)) ? 1.3 : 1);
        const repairScore = s.mental * 0.6 + s.intuition * 0.2 + noise(1.5);
        const sailScore = s.endurance * 0.4 + s.physical * 0.3 + noise(1.5);
        return { name: n, fireScore, repairScore, sailScore, stats: s, arch: a, pr: pronouns(n) };
      });

      // Decide slot allocation: fire + sail + flex
      const canFire = CANNON_UNLOCKED[t.name] && TOTAL_AMMO[t.name] > 0 && !CANNON_JAMMED[t.name];
      const needsRepair = tribeBoatHP[t.name] < 150;
      const slots = [];
      // Slot 1: fire if available, else sail
      if (canFire) slots.push('fire');
      else slots.push('sail');
      // Slot 2: always sail
      slots.push('sail');
      // Slot 3: flex — repair if damaged, double-fire if ammo, else sail
      if (needsRepair && available.some(m => pStats(m).mental > 4)) slots.push('repair');
      else if (canFire && TOTAL_AMMO[t.name] > 1) slots.push('fire');
      else slots.push('sail');

      // Assign best-fit member to each slot (no duplicates)
      const assigned = new Set();
      const slotAssignments = [];
      for (const role of slots) {
        let best = null, bestScore = -Infinity;
        for (const m of scored) {
          if (assigned.has(m.name)) continue;
          const sc = role === 'fire' ? m.fireScore : role === 'repair' ? m.repairScore : m.sailScore;
          if (sc > bestScore) { bestScore = sc; best = m; }
        }
        if (!best && scored.length > 0) best = scored.find(m => !assigned.has(m.name)) || scored[0];
        if (best) {
          assigned.add(best.name);
          slotAssignments.push({ role, member: best });
        }
      }

      // Execute each slot
      for (const { role, member } of slotAssignments) {
        const n = member.name;
        const s = member.stats;
        const pr = member.pr;

        if (role === 'fire') {
          if (TOTAL_AMMO[t.name] > 0 && !CANNON_JAMMED[t.name]) {
            const isFlaming = tribeBoatHP[t.name] < 100 && TOTAL_AMMO[t.name] >= 2 && round >= 3;
            const ammoCost = isFlaming ? 2 : 1;
            TOTAL_AMMO[t.name] -= ammoCost;
            const accuracy = s.physical * 0.3 + s.intuition * 0.4 + noise(2.5);
            if (accuracy > 4) {
              let dmg = 12 + Math.floor(Math.random() * 12);
              if (isFlaming) dmg = Math.round(dmg * 1.6);
              tribeBoatHP[target.name] = Math.max(0, tribeBoatHP[target.name] - dmg);
              ep.chalMemberScores[n] += 5;
              if (isFlaming) {
                popDelta(n, 1);
                phase3Events.push({
                  type: 'flamingAmmo', player: n, tribe: t.name, target: target.name, round, damage: dmg,
                  text: pick(FLAMING_AMMO_TEXT)(t.name, target.name),
                  score: 5, badge: `🔥 −${dmg} HP`, badgeClass: 'cannon'
                });
              } else {
                phase3Events.push({
                  type: 'cannonHit', player: n, tribe: t.name, target: target.name, round, damage: dmg,
                  text: pick(CANNON_HIT_TEXT)(n, target.name, dmg),
                  score: 5, badge: `HIT −${dmg}`, badgeClass: 'cannon'
                });
              }
            } else {
              ep.chalMemberScores[n] -= 1;
              phase3Events.push({
                type: 'cannonMiss', player: n, tribe: t.name, target: target.name, round,
                text: pick(CANNON_MISS_TEXT)(n, target.name),
                score: -1, badge: 'MISS', badgeClass: 'chaos'
              });
            }
          }
        } else if (role === 'repair') {
          const repairAmt = clamp(4 + Math.floor(s.mental * 0.5 + noise(2)), 4, 10);
          tribeBoatHP[t.name] = Math.min(250, tribeBoatHP[t.name] + repairAmt);
          ep.chalMemberScores[n] += 3;
          phase3Events.push({
            type: 'repair', player: n, tribe: t.name, round, hp: repairAmt,
            text: pick(REPAIR_TEXT)(n, pr, repairAmt),
            score: 3, badge: `+${repairAmt} HP`, badgeClass: 'repair'
          });
        } else {
          const sailSpeed = s.endurance * 0.4 + s.physical * 0.3 + noise(2.5);
          SAIL_ACCUM[t.name] += Math.max(0, sailSpeed);
          FLAG_DISTANCE[t.name] = Math.max(0, FLAG_DISTANCE[t.name] - sailSpeed * 0.4);
          ep.chalMemberScores[n] += 2;
          if (Math.random() < 0.45) {
            phase3Events.push({
              type: 'sailProgress', player: n, tribe: t.name, round,
              text: pick(SAIL_PROGRESS_TEXT)(n, pr, t.name),
              score: 2, badge: 'SAIL', badgeClass: 'sail'
            });
          }

          if (FLAG_DISTANCE[t.name] <= 10) {
            const grabScore = s.physical * 0.3 + s.boldness * 0.4 + noise(2.5);
            if (grabScore > 5) {
              ep.chalMemberScores[n] += 15;
              popDelta(n, 2);
              battleWinner = t.name;
              battleEndReason = 'flag';
              phase3Events.push({
                type: 'flagGrab', player: n, tribe: t.name, round,
                text: pick(FLAG_GRAB_SUCCESS_TEXT)(n, pr),
                score: 15, badge: 'FLAG CAPTURED', badgeClass: 'flag'
              });
            } else {
              phase3Events.push({
                type: 'flagFail', player: n, tribe: t.name, round,
                text: pick(FLAG_GRAB_FAIL_TEXT)(n, pr),
                score: 0, badge: 'SO CLOSE', badgeClass: 'chaos'
              });
            }
          }
        }
      }

    });

    // Check for sinking AFTER all tribes act (targets may have been sunk by cannon fire)
    if (!battleWinner) {
      tribeData.forEach(t => {
        if (tribeBoatHP[t.name] <= 0 && !phase3Events.some(e => e.type === 'sink' && e.tribe === t.name)) {
          phase3Events.push({
            type: 'sink', tribe: t.name, round,
            text: pick(SINK_TEXT)(t.name),
            badge: 'SUNK', badgeClass: 'chaos'
          });
        }
      });
      const alive = tribeData.filter(et => tribeBoatHP[et.name] > 0);
      if (alive.length === 1) {
        battleWinner = alive[0].name;
        battleEndReason = 'sink';
      } else if (alive.length === 0) {
        // All sunk — winner is whoever had most HP before the final round
        battleWinner = tribeData.reduce((best, t) => (tribeBoatHP[t.name] > tribeBoatHP[best.name]) ? t : best, tribeData[0]).name;
        battleEndReason = 'sink';
      }
    }

    // Clear jammed cannons
    tribeData.forEach(t => { CANNON_JAMMED[t.name] = false; });

    // Battle events (5-8 total across all rounds)
    if (round >= 1 && !battleWinner) {
      const eventBudget = round < 4 ? 0.6 : round < 8 ? 0.5 : 0.4;
      if (Math.random() < eventBudget) {
        const eventType = Math.random();

        if (eventType < 0.12) {
          // Ram attempt
          const attacker = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0));
          const defender = pick(tribeData.filter(t => t.name !== attacker.name && tribeBoatHP[t.name] > 0));
          if (attacker && defender) {
            const physAvg = attacker.members.reduce((s, n) => s + pStats(n).physical, 0) / attacker.members.length;
            const endAvg = attacker.members.reduce((s, n) => s + pStats(n).endurance, 0) / attacker.members.length;
            const ramScore = physAvg + endAvg + noise(3);
            if (ramScore > 12) {
              const dmg = 25 + Math.floor(Math.random() * 15) + Math.round(physAvg * 0.3);
              const selfDmg = 8 + Math.floor(Math.random() * 8);
              tribeBoatHP[defender.name] = Math.max(0, tribeBoatHP[defender.name] - dmg);
              tribeBoatHP[attacker.name] = Math.max(0, tribeBoatHP[attacker.name] - selfDmg);
              attacker.members.forEach(n => { ep.chalMemberScores[n] += 3; });
              phase3Events.push({
                type: 'ramHit', attacker: attacker.name, target: defender.name, round, damage: dmg, selfDamage: selfDmg,
                text: pick(RAM_SUCCESS_TEXT)(attacker.name, defender.name, dmg),
                score: 3, badge: `RAM −${dmg}`, badgeClass: 'cannon'
              });
            } else {
              attacker.members.forEach(n => { ep.chalMemberScores[n] -= 3; });
              phase3Events.push({
                type: 'ramMiss', attacker: attacker.name, round,
                text: pick(RAM_MISS_TEXT)(attacker.name),
                score: -3, badge: 'RAM FAIL', badgeClass: 'chaos'
              });
            }
          }
        } else if (eventType < 0.22) {
          // Weather squall
          phase3Events.push({
            type: 'squall', round,
            text: pick(WEATHER_SQUALL_TEXT)(),
            badge: 'SQUALL', badgeClass: 'chaos'
          });
          tribeData.forEach(t => {
            const squallDmg = 5 + Math.floor(Math.random() * 8);
            tribeBoatHP[t.name] = Math.max(0, tribeBoatHP[t.name] - squallDmg);
          });
        } else if (eventType < 0.30) {
          // Friendly fire
          const tribe = pick(tribeData.filter(t => CANNON_UNLOCKED[t.name] && tribeBoatHP[t.name] > 0));
          if (tribe) {
            const shooter = pick(tribe.members);
            const ffDmg = 8 + Math.floor(Math.random() * 10);
            tribeBoatHP[tribe.name] = Math.max(0, tribeBoatHP[tribe.name] - ffDmg);
            ep.chalMemberScores[shooter] -= 5;
            phase3Events.push({
              type: 'friendlyFire', player: shooter, tribe: tribe.name, round, damage: ffDmg,
              text: pick(FRIENDLY_FIRE_TEXT)(shooter, tribe.name),
              score: -5, badge: 'FRIENDLY FIRE', badgeClass: 'chaos'
            });
          }
        } else if (eventType < 0.42) {
          // Boarding raid
          const raider = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0));
          const targetShip = pick(tribeData.filter(t => t.name !== raider?.name && tribeBoatHP[t.name] > 0));
          if (raider && targetShip) {
            const boarder = raider.members.reduce((best, n) =>
              pStats(n).boldness + pStats(n).physical > pStats(best).boldness + pStats(best).physical ? n : best, raider.members[0]);
            const boardScore = pStats(boarder).boldness + pStats(boarder).physical + noise(2.5);
            if (boardScore > 11) {
              const stolen = Math.min(2, TOTAL_AMMO[targetShip.name]);
              TOTAL_AMMO[targetShip.name] -= stolen;
              TOTAL_AMMO[raider.name] += stolen;
              ep.chalMemberScores[boarder] += 8;
              popDelta(boarder, 1);
              phase3Events.push({
                type: 'boardingSuccess', player: boarder, tribe: raider.name, target: targetShip.name, round, stolen,
                text: pick(BOARDING_SUCCESS_TEXT)(boarder, targetShip.name),
                score: 8, badge: `RAID +${stolen}`, badgeClass: 'cannon'
              });
            } else {
              ep.chalMemberScores[boarder] -= 4;
              phase3Events.push({
                type: 'boardingFail', player: boarder, tribe: raider.name, target: targetShip.name, round,
                text: pick(BOARDING_FAIL_TEXT)(boarder, targetShip.name),
                score: -4, badge: 'REPELLED', badgeClass: 'chaos'
              });
            }
          }
        } else if (eventType < 0.50) {
          // Flag interference
          const interferer = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0));
          const flagTarget = tribeData.filter(t => t.name !== interferer?.name && FLAG_DISTANCE[t.name] < 40 && tribeBoatHP[t.name] > 0);
          if (interferer && flagTarget.length > 0) {
            const target = pick(flagTarget);
            const player = pick(interferer.members);
            FLAG_DISTANCE[target.name] += 15;
            addBond(player, target.members[0], -1);
            ep.chalMemberScores[player] += 3;
            phase3Events.push({
              type: 'flagInterference', player, tribe: interferer.name, target: target.name, round,
              text: pick(FLAG_INTERFERENCE_TEXT)(player, pronouns(player), target.name),
              score: 3, badge: 'BLOCKED', badgeClass: 'flag'
            });
          }
        } else if (eventType < 0.58 && !Object.values(PATCH_GENIUS_USED).includes(true)) {
          // Patch job genius
          const tribe = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0 && tribeBoatHP[t.name] < 160));
          if (tribe) {
            const genius = tribe.members.reduce((best, n) =>
              pStats(n).mental > pStats(best).mental ? n : best, tribe.members[0]);
            if (pStats(genius).mental > 6) {
              const hp = 30;
              tribeBoatHP[tribe.name] = Math.min(250, tribeBoatHP[tribe.name] + hp);
              ep.chalMemberScores[genius] += 6;
              PATCH_GENIUS_USED[tribe.name] = true;
              phase3Events.push({
                type: 'patchGenius', player: genius, tribe: tribe.name, round, hp,
                text: pick(PATCH_GENIUS_TEXT)(genius, pronouns(genius), hp),
                score: 6, badge: `+${hp} HP`, badgeClass: 'repair'
              });
            }
          }
        } else if (eventType < 0.66) {
          // Human cannonball
          const tribe = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0 && !HUMAN_CANNONBALL_USED[t.name] && CANNON_UNLOCKED[t.name]));
          if (tribe) {
            const candidate = tribe.members.find(n =>
              pStats(n).boldness * 0.7 + noise(2.5) > 7 && pStats(n).physical * 0.6 + noise(2.5) > 6);
            if (candidate) {
              const target = pick(tribeData.filter(t => t.name !== tribe.name && tribeBoatHP[t.name] > 0));
              if (target) {
                const dmg = 35 + Math.floor(Math.random() * 15);
                tribeBoatHP[target.name] = Math.max(0, tribeBoatHP[target.name] - dmg);
                HUMAN_CANNONBALL_USED[tribe.name] = true;
                ep.chalMemberScores[candidate] += 12;
                popDelta(candidate, 4);
                COWARD_ROUNDS[candidate] = 99; // out of fight
                phase3Events.push({
                  type: 'humanCannonball', player: candidate, tribe: tribe.name, target: target.name, round, damage: dmg,
                  text: pick(HUMAN_CANNONBALL_TEXT)(candidate, target.name, dmg),
                  score: 12, badge: `CANNONBALL −${dmg}`, badgeClass: 'heroic'
                });
                ep.campEvents[tribe.name].post.push({
                  type: 'vs-human-cannonball',
                  text: `${candidate} launched themselves from a cannon during the naval battle`,
                  players: [candidate], badgeText: 'Human Cannonball', badgeClass: 'badge-legendary'
                });
              }
            }
          }
        } else if (eventType < 0.74) {
          // Heroic shield
          const tribe = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0 && tribeBoatHP[t.name] < 120));
          if (tribe) {
            const heroes = tribe.members.filter(n => NICE_ARCHS.has(arch(n)) && COWARD_ROUNDS[n] === 0);
            if (heroes.length > 0) {
              const hero = pick(heroes);
              tribeBoatHP[tribe.name] = Math.min(250, tribeBoatHP[tribe.name] + 25);
              ep.chalMemberScores[hero] += 6;
              popDelta(hero, 3);
              phase3Events.push({
                type: 'heroicShield', player: hero, tribe: tribe.name, round,
                text: pick(HEROIC_SHIELD_TEXT)(hero, tribe.name),
                score: 6, badge: 'SHIELD', badgeClass: 'heroic'
              });
            }
          }
        } else if (eventType < 0.80) {
          // Cowardly abandon
          const tribe = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0));
          if (tribe) {
            const cowards = tribe.members.filter(n =>
              pStats(n).boldness * 0.6 + noise(2.5) < 3 && COWARD_ROUNDS[n] === 0);
            if (cowards.length > 0) {
              const coward = pick(cowards);
              COWARD_ROUNDS[coward] = 2;
              ep.chalMemberScores[coward] -= 6;
              popDelta(coward, -2);
              phase3Events.push({
                type: 'coward', player: coward, tribe: tribe.name, round,
                text: pick(COWARD_TEXT)(coward, pronouns(coward)),
                score: -6, badge: 'COWARD', badgeClass: 'chaos'
              });
            }
          }
        } else if (eventType < 0.88) {
          // Battle cry
          const tribe = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0));
          if (tribe) {
            const rallier = tribe.members.reduce((best, n) =>
              pStats(n).social > pStats(best).social ? n : best, tribe.members[0]);
            if (pStats(rallier).social * 0.5 + noise(2.5) > 3) {
              tribe.members.forEach(n => {
                if (n !== rallier) addBond(rallier, n, 1);
                ep.chalMemberScores[n] += 2;
              });
              phase3Events.push({
                type: 'battleCry', player: rallier, tribe: tribe.name, round,
                text: pick(BATTLE_CRY_TEXT)(rallier, tribe.name),
                score: 2, badge: 'BATTLE CRY', badgeClass: 'heroic'
              });
            }
          }
        } else if (eventType < 0.94) {
          // Mutiny attempt
          const tribe = pick(tribeData.filter(t => {
            const avgBond = t.members.length > 1 ?
              t.members.reduce((s, n) => s + t.members.reduce((s2, m) => s2 + (m !== n ? getBond(n, m) : 0), 0), 0) / (t.members.length * (t.members.length - 1) || 1) : 0;
            return avgBond < -2 && tribeBoatHP[t.name] > 0;
          }));
          if (tribe) {
            const mutineer = tribe.members.reduce((best, n) =>
              pStats(n).strategic > pStats(best).strategic ? n : best, tribe.members[0]);
            const mutinyScore = pStats(mutineer).strategic + pStats(mutineer).social + noise(2.5);
            if (mutinyScore > 13) {
              // Successful mutiny — tribe gets a bonus round
              ep.chalMemberScores[mutineer] += 5;
              phase3Events.push({
                type: 'mutinySuccess', player: mutineer, tribe: tribe.name, round,
                text: pick(MUTINY_SUCCESS_TEXT)(mutineer, tribe.name),
                score: 5, badge: 'MUTINY', badgeClass: 'chaos'
              });
            } else {
              ep.chalMemberScores[mutineer] -= 8;
              phase3Events.push({
                type: 'mutinyFail', player: mutineer, tribe: tribe.name, round,
                text: pick(MUTINY_TEXT)(mutineer, tribe.name),
                score: -8, badge: 'MUTINY FAILED', badgeClass: 'chaos'
              });
            }
          }
        } else {
          // Cannon sabotage
          const saboteur = pick(tribeData.filter(t => tribeBoatHP[t.name] > 0));
          const sabTarget = pick(tribeData.filter(t => t.name !== saboteur?.name && CANNON_UNLOCKED[t.name] && tribeBoatHP[t.name] > 0));
          if (saboteur && sabTarget) {
            const agent = saboteur.members.find(n => canScheme(n));
            if (agent) {
              CANNON_JAMMED[sabTarget.name] = true;
              ep.chalMemberScores[agent] += 3;
              phase3Events.push({
                type: 'cannonSabotage', player: agent, tribe: saboteur.name, target: sabTarget.name, round,
                text: pick(CANNON_SABOTAGE_TEXT)(agent, sabTarget.name),
                score: 3, badge: 'JAMMED', badgeClass: 'chaos'
              });
            }
          }
        }
      }
    }

    // Check sinking after battle events too (ram, squall, friendly fire can sink)
    if (!battleWinner) {
      tribeData.forEach(t => {
        if (tribeBoatHP[t.name] <= 0 && !phase3Events.some(e => e.type === 'sink' && e.tribe === t.name)) {
          phase3Events.push({
            type: 'sink', tribe: t.name, round,
            text: pick(SINK_TEXT)(t.name),
            badge: 'SUNK', badgeClass: 'chaos'
          });
        }
      });
      const alive2 = tribeData.filter(et => tribeBoatHP[et.name] > 0);
      if (alive2.length === 1) {
        battleWinner = alive2[0].name;
        battleEndReason = 'sink';
      }
    }
  }

  // Timeout — closest to flag wins
  if (!battleWinner) {
    const closest = tribeData.filter(t => tribeBoatHP[t.name] > 0)
      .sort((a, b) => FLAG_DISTANCE[a.name] - FLAG_DISTANCE[b.name]);
    if (closest.length > 0) {
      battleWinner = closest[0].name;
      battleEndReason = 'timeout';
      phase3Events.push({
        type: 'timeout', round: MAX_ROUNDS,
        text: pick(TIMEOUT_TEXT)(),
        badge: 'TIME UP', badgeClass: 'chaos'
      });
    }
  }

  // ═══════════════════════════════════════════════
  // FINALIZE
  // ═══════════════════════════════════════════════
  const winnerTribeName = battleWinner || arrivalOrder[0].name;

  // Build result
  const result = {
    phase1: {
      events: phase1Events,
      clarity: { ...tribeClarity },
      buildQuality: { ...tribeBuildQuality },
      boatHP: { ...phase1BoatHP },
      winner: phase1Winner
    },
    phase2: {
      events: phase2Events,
      sailProgress: { ...tribeSailProgress },
      arrivalOrder: arrivalOrder.map(a => a.name),
      boatHP: { ...phase2BoatHP }
    },
    phase3: {
      events: phase3Events,
      finalHP: Object.fromEntries(tribeData.map(t => [t.name, tribeBoatHP[t.name]])),
      finalAmmo: { ...TOTAL_AMMO },
      flagDistance: { ...FLAG_DISTANCE },
      winner: battleWinner,
      endReason: battleEndReason,
      rounds: Math.min(MAX_ROUNDS, phase3Events.length > 0 ? (phase3Events[phase3Events.length - 1].round || 0) + 1 : MAX_ROUNDS)
    },
    tribes: tribeData.map(t => ({
      name: t.name,
      members: [...t.members],
      color: t.color,
      boatHP: phase1BoatHP[t.name],
      buildQuality: tribeBuildQuality[t.name] || 50,
      ammo: TOTAL_AMMO[t.name],
      flagDist: FLAG_DISTANCE[t.name],
      isFlintWinner: t.name === phase1Winner
    })),
    winnerTribe: winnerTribeName
  };

  // Romance hooks
  const _romActive = allActive;
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'viking sour');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'viking sour', _romActive);

  // Set episode fields
  ep.vikingSour = result;
  ep.isVikingSour = true;
  ep.challengeType = 'viking-sour';
  ep.challengeLabel = 'Viking Sour';
  ep.challengeCategory = 'mixed';

  // Determine winner/loser by average member score
  const tribeRankings = tribeData.map(t => {
    const avg = t.members.map(n => ep.chalMemberScores[n] || 0).reduce((a, b) => a + b, 0) / (t.members.length || 1);
    return { name: t.name, avg, members: t.members };
  });
  // Battle winner goes first regardless of score
  tribeRankings.sort((a, b) => {
    if (a.name === winnerTribeName) return -1;
    if (b.name === winnerTribeName) return 1;
    return b.avg - a.avg;
  });

  const winTribe = tribeRankings[0].name;
  const loseTribe = tribeRankings[tribeRankings.length - 1].name;

  ep.winner = gs.tribes.find(t => t.name === winTribe);
  ep.loser = gs.tribes.find(t => t.name === loseTribe);
  ep.safeTribes = tribeRankings.length > 2
    ? tribeRankings.slice(1, -1).map(tn => gs.tribes.find(t => t.name === tn.name)).filter(Boolean)
    : [];
  ep.tribalPlayers = gs.tribes.find(t => t.name === loseTribe)?.members || allActive;

  ep.challengePlacements = tribeRankings.map(tn => ({
    name: tn.name, members: [...(gs.tribes.find(t => t.name === tn.name)?.members || [])],
    memberScores: {},
  }));

  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort(([, a], [, b]) => b - a).map(([n]) => n);

  // Top scorer from winning tribe gets massive bonus
  const topScorer = ep.winner?.members?.slice().sort((a, b) =>
    (ep.chalMemberScores[b] || 0) - (ep.chalMemberScores[a] || 0)
  )[0];
  if (topScorer) {
    const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores)
      .filter(([n]) => n !== topScorer).map(([, s]) => s));
    ep.chalMemberScores[topScorer] = Math.max(
      ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;
  }

  updateChalRecord(ep);
  return ep;
}

// ── UTILITY ──
function _randomPair(members) {
  if (members.length < 2) return null;
  const shuffled = [...members].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function _romanticPair(members) {
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (romanticCompat(members[i], members[j]) && Math.random() < 0.3) {
        return [members[i], members[j]];
      }
    }
  }
  return null;
}

function _rivalPair(members) {
  let worst = null;
  let worstBond = 999;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const b = getBond(members[i], members[j]);
      if (b < worstBond) { worst = [members[i], members[j]]; worstBond = b; }
    }
  }
  return worst || _randomPair(members);
}

// ══════════════════════════════════════════════════════════════
// VP: STATE + REVEAL
// ══════════════════════════════════════════════════════════════

const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`vs-step-${suffix}-${i}`);
    if (el) el.classList.add('vs-visible');
  }
  const counter = document.getElementById(`vs-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`vs-controls-${suffix}`);
    if (controls) { const btns = controls.querySelectorAll('.vs-btn'); btns.forEach(b => b.style.opacity = '0.4'); }
  }
}

export function vikingSourRevealNext(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    if (st.idx >= st.total - 1) return;
    st.idx++;
    const suffix = screenKey.replace('vs-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
    const el = document.getElementById(`vs-step-${suffix}-${st.idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { console.warn('VS reveal error:', e); }
  try { _vsUpdateBlueprintTracker(screenKey); } catch (e) { /* tracker optional */ }
  try { _vsUpdateSidebar(screenKey); } catch (e) { /* sidebar optional */ }
  try { _vsUpdateMap(screenKey); } catch (e) { /* map optional */ }
}

export function vikingSourRevealAll(screenKey, totalSteps) {
  try {
    const st = _ensureState(screenKey, totalSteps);
    st.idx = st.total - 1;
    const suffix = screenKey.replace('vs-', '');
    _reapplyVisibility(suffix, st.idx, st.total);
  } catch (e) { console.warn('VS revealAll error:', e); }
  try { _vsUpdateBlueprintTracker(screenKey); } catch (e) { /* tracker optional */ }
  try { _vsUpdateSidebar(screenKey); } catch (e) { /* sidebar optional */ }
  try { _vsUpdateMap(screenKey); } catch (e) { /* map optional */ }
}

function _vsUpdateBlueprintTracker(screenKey) {
  if (!screenKey?.includes('phase1')) return;
  const epRecord = window._vsEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.vikingSour) return;
  const data = epRecord.vikingSour;
  const st = _tvState[screenKey];
  const revealIdx = st ? st.idx : -1;
  const stepMeta = window._vsPhase1StepMeta;
  if (!stepMeta) return;

  const skipTypes = new Set(['header', 'blueprint', 'yard', 'summary', 'chatter']);
  const totalEvts = stepMeta.filter(s => !skipTypes.has(s.type)).length;
  const preShowSteps = 2; // header + blueprint
  const revealedEvts = revealIdx <= preShowSteps - 1 ? 0 : Math.min(totalEvts, revealIdx - (preShowSteps - 1));
  const progress = totalEvts > 0 ? revealedEvts / totalEvts : 0;

  // Update clarity bars
  data.tribes.forEach(t => {
    const finalClarity = data.phase1.clarity[t.name] || 0;
    const curClarity = Math.round(finalClarity * progress);
    const fillEl = document.getElementById(`vs-clarity-fill-${t.name}`);
    const pctEl = document.getElementById(`vs-clarity-pct-${t.name}`);
    if (fillEl) fillEl.style.width = curClarity + '%';
    if (pctEl) pctEl.textContent = curClarity + '%';
  });

  // Update fragment chips
  const fragLabels = ['HULL', 'KEEL', 'MAST', 'STERN', 'RUDDER', 'BOW', 'SAIL', 'CANNON'];
  const avgClarity = data.tribes.reduce((sum, t) => sum + (data.phase1.clarity[t.name] || 0), 0) / data.tribes.length;
  const fragsFound = Math.ceil(fragLabels.length * avgClarity * progress / 100);
  for (let i = 0; i < fragLabels.length; i++) {
    const el = document.getElementById(`vs-frag-${i}`);
    if (!el) continue;
    if (i < fragsFound) {
      el.classList.add('found');
      el.textContent = el.dataset.label;
    } else {
      el.classList.remove('found');
      el.textContent = '???-' + String.fromCharCode(65 + i % 6) + (i + 1);
    }
  }

  // Update construction yard — SVG ship parts + part chips + percentage
  data.tribes.forEach(t => {
    const finalClarity = data.phase1.clarity[t.name] || 0;
    const tribeProgress = (finalClarity * progress) / 100;
    const partsBuilt = Math.floor(tribeProgress * SHIP_PARTS.length);
    const partialProgress = (tribeProgress * SHIP_PARTS.length) - partsBuilt;

    // Update SVG ship
    const shipContainer = document.getElementById(`vs-yard-ship-${t.name}`);
    if (shipContainer) {
      shipContainer.innerHTML = _buildLongshipSVG(t.name, t.color, partsBuilt + (partialProgress > 0.3 ? 0.5 : 0));
    }

    // Update percentage
    const yardPct = document.getElementById(`vs-yard-pct-${t.name}`);
    if (yardPct) yardPct.textContent = Math.round(tribeProgress * 100) + '%';

    // Update part chips
    SHIP_PARTS.forEach((p, pi) => {
      const chip = document.getElementById(`vs-ypc-${t.name}-${p}`);
      if (!chip) return;
      if (pi < partsBuilt) chip.classList.add('active');
      else chip.classList.remove('active');
    });
  });
}

function _vsUpdateSidebar(screenKey) {
  const sideEl = document.getElementById('vs-sidebar-inner');
  if (!sideEl) return;
  const epRecord = window._vsEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.vikingSour) return;
  const phase = _screenKeyToPhase(screenKey);
  const sidebar = sideEl.closest('.vs-sidebar');
  const scrollTop = sidebar ? sidebar.scrollTop : 0;
  sideEl.innerHTML = _buildSidebarContent(epRecord, phase, screenKey);
  if (sidebar) sidebar.scrollTop = scrollTop;
}

function _vsUpdateMap(screenKey) {
  if (!screenKey?.includes('phase3')) return;
  const epRecord = window._vsEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  if (!epRecord?.vikingSour) return;
  const data = epRecord.vikingSour;
  const st = _tvState[screenKey];
  const revealIdx = st ? st.idx : -1;
  const snapshots = window._vsMapSnapshots;
  const stepMeta = window._vsPhase3StepMeta;
  if (!snapshots) return;
  const curMeta = stepMeta && stepMeta[revealIdx] ? stepMeta[revealIdx] : null;
  const snapIdx = curMeta?.snapIdx !== undefined ? curMeta.snapIdx : clamp(revealIdx, 0, snapshots.length - 1);
  const snap = snapshots[clamp(snapIdx, 0, snapshots.length - 1)] || {};
  const maxHP = 250;

  // Update round label
  const roundEl = document.getElementById('vs-map-round');
  if (roundEl && curMeta?.round !== undefined) {
    roundEl.textContent = `Round ${curMeta.round + 1}`;
  }

  const tribeIndexMap = {};
  data.tribes.forEach((t, i) => { tribeIndexMap[t.name] = i; });

  data.tribes.forEach((tribe, idx) => {
    const ship = document.getElementById(`vs-ship-${idx}`);
    if (!ship) return;
    const flagDist = snap[tribe.name]?.flagDist ?? 100;
    const pct = clamp(100 - flagDist, 0, 100);
    ship.style.left = `${5 + pct * 0.82}%`;

    const hp = snap[tribe.name]?.hp ?? maxHP;
    const hpPct = clamp(Math.round(hp / maxHP * 100), 0, 100);
    const hpBar = document.getElementById(`vs-shiphp-${idx}`);
    const hpLabel = document.getElementById(`vs-shiphp-label-${idx}`);
    if (hpBar) {
      hpBar.style.width = `${hpPct}%`;
      hpBar.className = 'vs-hp-fill ' + (hp > maxHP * 0.5 ? 'healthy' : hp > maxHP * 0.25 ? 'damaged' : 'critical');
    }
    if (hpLabel) hpLabel.textContent = `${Math.max(0, Math.round(hp))} HP`;

    // Fire effect on damaged ships
    const fireEl = document.getElementById(`vs-ship-fire-${idx}`);
    if (fireEl) {
      fireEl.classList.toggle('active', hp <= maxHP * 0.4 && hp > 0);
    }

    // Sinking animation
    if (hp <= 0) {
      if (!ship.classList.contains('sinking')) ship.classList.add('sinking');
    } else {
      ship.classList.remove('sinking');
    }
  });

  // Cannon shot animation on hit events
  if (curMeta && ['cannonHit', 'flamingAmmo', 'ramHit', 'humanCannonball'].includes(curMeta.type)) {
    const attackerTribe = curMeta.tribe;
    const targetTribe = curMeta.target || (data.tribes.find(t => t.name !== attackerTribe)?.name);
    if (attackerTribe && targetTribe) {
      _fireCannonAnimation(tribeIndexMap[attackerTribe], tribeIndexMap[targetTribe]);
    }
  }
}

function _fireCannonAnimation(fromIdx, toIdx) {
  const mapEl = document.getElementById('vs-sea-map');
  const fromShip = document.getElementById(`vs-ship-${fromIdx}`);
  const toShip = document.getElementById(`vs-ship-${toIdx}`);
  if (!mapEl || !fromShip || !toShip) return;

  const mapRect = mapEl.getBoundingClientRect();
  const fromRect = fromShip.getBoundingClientRect();
  const toRect = toShip.getBoundingClientRect();

  const startX = fromRect.left + fromRect.width / 2 - mapRect.left;
  const startY = fromRect.top + fromRect.height / 2 - mapRect.top;
  const endX = toRect.left + toRect.width / 2 - mapRect.left;
  const endY = toRect.top + toRect.height / 2 - mapRect.top;
  const dx = endX - startX;
  const dy = endY - startY;

  // Cannonball
  const ball = document.createElement('div');
  ball.className = 'vs-cannonball';
  ball.style.left = startX + 'px';
  ball.style.top = startY + 'px';
  ball.style.setProperty('--cb-dx', dx + 'px');
  ball.style.setProperty('--cb-dy', dy + 'px');
  mapEl.appendChild(ball);
  requestAnimationFrame(() => ball.classList.add('fired'));
  setTimeout(() => ball.remove(), 700);

  // Impact flash on target
  setTimeout(() => {
    const flash = document.createElement('div');
    flash.className = 'vs-impact-flash';
    flash.style.left = endX + 'px';
    flash.style.top = endY + 'px';
    mapEl.appendChild(flash);
    requestAnimationFrame(() => flash.classList.add('active'));
    setTimeout(() => flash.remove(), 600);

    // Hit shake on target ship
    toShip.classList.add('hit');
    setTimeout(() => toShip.classList.remove('hit'), 450);
  }, 500);
}

function _screenKeyToPhase(key) {
  if (key?.includes('phase1')) return 'blueprint';
  if (key?.includes('phase2')) return 'sail';
  if (key?.includes('phase3')) return 'battle';
  if (key?.includes('results')) return 'results';
  return 'title';
}

// ══════════════════════════════════════════════════════════════
// VP: CONSTRUCTION YARD — SVG longship per tribe
// ══════════════════════════════════════════════════════════════

const SHIP_PARTS = ['hull','keel','mast','stern','rudder','bow','sail','cannon'];

function _buildLongshipSVG(tribeName, tribeColor, partsBuilt) {
  const cls = (part) => partsBuilt >= SHIP_PARTS.indexOf(part) + 1 ? 'built' : partsBuilt >= SHIP_PARTS.indexOf(part) + 0.5 ? 'building' : 'hidden';
  const fill = tribeColor;
  const dark = 'rgba(0,0,0,.3)';
  return `<svg width="240" height="110" viewBox="0 0 240 110" fill="none" id="vs-ship-svg-${tribeName}">
    <!-- hull -->
    <path class="ship-part ${cls('hull')}" d="M30 70 Q40 95 120 95 Q200 95 210 70 L195 55 Q120 48 45 55 Z" fill="${fill}" stroke="var(--vs-plank-lt)" stroke-width="1.5"/>
    <!-- keel -->
    <path class="ship-part ${cls('keel')}" d="M80 95 L120 108 L160 95" fill="none" stroke="${fill}" stroke-width="3" stroke-linecap="round"/>
    <!-- stern -->
    <path class="ship-part ${cls('stern')}" d="M30 70 Q20 60 18 40 Q16 28 22 22 Q26 18 30 24 L35 55 Z" fill="${fill}" stroke="var(--vs-plank-lt)" stroke-width="1"/>
    <path class="ship-part ${cls('stern')}" d="M22 22 Q18 14 22 10 Q26 12 28 18" fill="${fill}" opacity=".7"/>
    <!-- bow -->
    <path class="ship-part ${cls('bow')}" d="M210 70 Q218 58 222 40 Q224 28 218 24 Q215 22 212 28 L208 55 Z" fill="${fill}" stroke="var(--vs-plank-lt)" stroke-width="1"/>
    <path class="ship-part ${cls('bow')}" d="M222 40 L228 32 Q230 28 226 26 Q222 30 222 40" fill="${fill}" opacity=".7"/>
    <!-- mast -->
    <line class="ship-part ${cls('mast')}" x1="120" y1="18" x2="120" y2="78" stroke="var(--vs-plank-lt)" stroke-width="3" stroke-linecap="round"/>
    <circle class="ship-part ${cls('mast')}" cx="120" cy="16" r="3" fill="var(--vs-gold)" opacity=".8"/>
    <!-- sail -->
    <path class="ship-part ${cls('sail')}" d="M122 22 Q155 35 155 52 L122 58 Z" fill="var(--vs-parchment)" opacity=".25" stroke="var(--vs-parch-dk)" stroke-width=".5"/>
    <path class="ship-part ${cls('sail')}" d="M125 30 L148 42" stroke="var(--vs-rune)" stroke-width=".5" opacity=".4"/>
    <path class="ship-part ${cls('sail')}" d="M125 40 L150 48" stroke="var(--vs-rune)" stroke-width=".5" opacity=".3"/>
    <!-- rudder -->
    <path class="ship-part ${cls('rudder')}" d="M30 75 L22 90 Q20 94 24 94 L32 82 Z" fill="var(--vs-plank)" stroke="var(--vs-plank-lt)" stroke-width="1"/>
    <!-- cannon -->
    <rect class="ship-part ${cls('cannon')}" x="85" y="62" width="14" height="6" rx="2" fill="var(--vs-iron)" stroke="var(--vs-steel)" stroke-width=".5"/>
    <rect class="ship-part ${cls('cannon')}" x="140" y="62" width="14" height="6" rx="2" fill="var(--vs-iron)" stroke="var(--vs-steel)" stroke-width=".5"/>
    <circle class="ship-part ${cls('cannon')}" cx="83" cy="65" r="2" fill="var(--vs-ember)" opacity=".6"/>
    <circle class="ship-part ${cls('cannon')}" cx="156" cy="65" r="2" fill="var(--vs-ember)" opacity=".6"/>
    <!-- shield row -->
    ${[70,90,110,130,150,170].map((x,si) => `<rect class="ship-part ${si < partsBuilt ? 'built' : 'hidden'}" x="${x}" y="52" width="8" height="10" rx="4" fill="${si % 2 === 0 ? fill : 'var(--vs-gold)'}" opacity=".5" stroke="var(--vs-plank-lt)" stroke-width=".5"/>`).join('')}
    <!-- waterline ripples -->
    <path d="M25 98 Q60 94 120 96 Q180 98 215 94" fill="none" stroke="var(--vs-frost)" stroke-width=".5" opacity=".15"/>
    <path d="M35 102 Q80 99 120 100 Q160 101 205 98" fill="none" stroke="var(--vs-frost)" stroke-width=".5" opacity=".1"/>
  </svg>`;
}

function _buildConstructionYard(data) {
  return `<div class="vs-yard">
    <div class="vs-yard-grid">
      ${data.tribes.map(t => {
        const partChips = SHIP_PARTS.map(p =>
          `<span class="vs-yard-part-chip" id="vs-ypc-${t.name}-${p}">${p}</span>`
        ).join('');
        return `<div class="vs-yard-bay">
          <div class="vs-yard-bay-label">
            <span class="vs-sb-tribe-dot" style="background:${t.color}"></span> ${t.name}
          </div>
          <div class="vs-yard-ship" id="vs-yard-ship-${t.name}">
            ${_buildLongshipSVG(t.name, t.color, 0)}
          </div>
          <div class="vs-yard-pct" id="vs-yard-pct-${t.name}" style="color:${t.color}">0%</div>
          <div class="vs-yard-parts">${partChips}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// VP: CSS ICONS — pseudo-element based (::before / ::after)
// ══════════════════════════════════════════════════════════════

function _icoHammer() { return '<span class="vs-ico vs-ico-hammer"></span>'; }
function _icoShield() { return '<span class="vs-ico vs-ico-shield"></span>'; }
function _icoCannon() { return '<span class="vs-ico vs-ico-cannon"></span>'; }
function _icoFlag() { return '<span class="vs-ico vs-ico-flag"></span>'; }
function _icoShip() { return '<span class="vs-ico vs-ico-ship"></span>'; }
function _icoRune(ch) { return `<span class="vs-ico vs-ico-rune">${ch || ''}</span>`; }
function _icoScroll() { return '<span class="vs-ico vs-ico-scroll"></span>'; }
function _icoFire() { return '<span class="vs-ico vs-ico-fire"></span>'; }
function _icoSkull() { return '<span class="vs-ico vs-ico-skull"></span>'; }
function _icoTrophy() { return '<span class="vs-ico vs-ico-trophy"></span>'; }
function _icoAnchor() { return '<span class="vs-ico vs-ico-anchor"></span>'; }
function _icoAmmo() { return '<span class="vs-ico vs-ico-ammo"></span>'; }

function _eventIcon(type) {
  const map = {
    eureka: _icoRune, study: _icoScroll, build: _icoHammer,
    argument: _icoSkull, sabotage: _icoFire, sabotageCaught: _icoSkull,
    flirt: _icoRune, leaderClash: _icoShield, creditSteal: _icoSkull,
    launch: _icoAnchor, launchStall: _icoAnchor,
    iceBreakSuccess: _icoHammer, iceBreakFail: _icoSkull,
    sail: _icoShip, wind: _icoShip, iceCollision: _icoSkull,
    current: _icoAnchor, whale: _icoShip,
    allianceWhisper: _icoRune, seasick: _icoSkull,
    rivalryRow: _icoSkull, captainEncourage: _icoFlag,
    cannonHit: _icoCannon, cannonMiss: _icoCannon,
    cannonUnlock: _icoCannon, cannonUnlockFail: _icoCannon,
    sailProgress: _icoShip, flagGrab: _icoFlag, flagFail: _icoFlag,
    repair: _icoHammer, ramHit: _icoShip, ramMiss: _icoShip,
    squall: _icoAnchor, friendlyFire: _icoCannon,
    boardingSuccess: _icoFlag, boardingFail: _icoSkull,
    flagInterference: _icoFlag, patchGenius: _icoHammer,
    humanCannonball: _icoCannon, heroicShield: _icoShield,
    flamingAmmo: _icoFire, coward: _icoSkull,
    battleCry: _icoFlag, mutinySuccess: _icoSkull, mutinyFail: _icoSkull,
    cannonSabotage: _icoCannon, sink: _icoSkull,
    timeout: _icoFlag
  };
  return (map[type] || _icoRune)();
}

function _badgeCls(cls) {
  if (cls === 'eureka') return 'vs-badge-eureka';
  if (cls === 'build') return 'vs-badge-build';
  if (cls === 'sail') return 'vs-badge-sail';
  if (cls === 'cannon') return 'vs-badge-cannon';
  if (cls === 'flag') return 'vs-badge-flag';
  if (cls === 'repair') return 'vs-badge-repair';
  if (cls === 'heroic') return 'vs-badge-heroic';
  if (cls === 'social') return 'vs-badge-social';
  if (cls === 'chaos') return 'vs-badge-chaos';
  return 'vs-badge-build';
}

function _tagCls(type) {
  const map = {
    eureka: 'tag-eureka', study: 'tag-build', build: 'tag-build',
    argument: 'tag-social', sabotage: 'tag-chaos', sabotageCaught: 'tag-chaos',
    flirt: 'tag-social', leaderClash: 'tag-social', creditSteal: 'tag-chaos',
    launch: 'tag-sail', launchStall: 'tag-chaos',
    iceBreakSuccess: 'tag-sail', iceBreakFail: 'tag-chaos',
    sail: 'tag-sail', wind: 'tag-sail', iceCollision: 'tag-chaos',
    current: 'tag-chaos', whale: 'tag-sail',
    allianceWhisper: 'tag-social', seasick: 'tag-chaos',
    rivalryRow: 'tag-social', captainEncourage: 'tag-social',
    cannonHit: 'tag-hit', cannonMiss: 'tag-miss',
    cannonUnlock: 'tag-cannon', cannonUnlockFail: 'tag-miss',
    sailProgress: 'tag-sail', flagGrab: 'tag-flag', flagFail: 'tag-miss',
    repair: 'tag-repair', ramHit: 'tag-hit', ramMiss: 'tag-miss',
    squall: 'tag-chaos', friendlyFire: 'tag-chaos',
    boardingSuccess: 'tag-hit', boardingFail: 'tag-miss',
    flagInterference: 'tag-flag', patchGenius: 'tag-repair',
    humanCannonball: 'tag-cannon', heroicShield: 'tag-sail',
    flamingAmmo: 'tag-cannon', coward: 'tag-chaos',
    battleCry: 'tag-sail', mutinySuccess: 'tag-chaos', mutinyFail: 'tag-chaos',
    cannonSabotage: 'tag-cannon', sink: 'tag-sink', timeout: 'tag-flag'
  };
  return map[type] || 'tag-build';
}

// Avatar helper
function _av(name, size = 28) {
  const tc = _playerTribeColor(name);
  return `<img class="vs-portrait" src="assets/avatars/${slug(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-color:${tc}" onerror="this.outerHTML='<div class=\\'vs-portrait\\' style=\\'width:${size}px;height:${size}px;border-color:${tc}\\'>${name.substring(0,2).toUpperCase()}</div>'">`;
}

function _playerTribeColor(name) {
  const epRecord = window._vsEpRecord || gs.episodeHistory?.[window.vpEpNum - 1];
  const vs = epRecord?.vikingSour;
  if (!vs) return '#888';
  const tribe = vs.tribes.find(t => t.members.includes(name));
  return tribe ? tribe.color : '#888';
}

// ══════════════════════════════════════════════════════════════
// VP: SNOWFALL + EMBER PARTICLE GENERATORS
// ══════════════════════════════════════════════════════════════

function _genSnowflakes(count = 40) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = (Math.random() * 100).toFixed(1);
    const sz = (1.5 + Math.random() * 3).toFixed(1);
    const dur = (8 + Math.random() * 12).toFixed(1);
    const delay = (Math.random() * 15).toFixed(1);
    html += `<div class="vs-sf" style="left:${left}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s;"></div>`;
  }
  return html;
}

function _genEmbers(count = 25) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = (Math.random() * 100).toFixed(1);
    const sz = (2 + Math.random() * 4).toFixed(1);
    const dur = (6 + Math.random() * 10).toFixed(1);
    const delay = (Math.random() * 12).toFixed(1);
    const op = (0.2 + Math.random() * 0.4).toFixed(2);
    html += `<div class="vs-ember-p" style="left:${left}%;width:${sz}px;height:${sz}px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op};"></div>`;
  }
  return html;
}

// ══════════════════════════════════════════════════════════════
// VP: SHELL WRAPPER — matches mockup exactly
// ══════════════════════════════════════════════════════════════

function _shell(content, ep, sidebarPhase = 'title', screenKey = 'vs-title') {
  const data = ep.vikingSour;
  if (!data) return '<div>No Viking Sour data.</div>';

  const sidebarHTML = _buildSidebar(ep, sidebarPhase, screenKey);
  const showEmbers = sidebarPhase === 'battle';
  const tickerPool = sidebarPhase === 'blueprint' ? CHATTER_P1 : sidebarPhase === 'sail' ? CHATTER_P2 : sidebarPhase === 'battle' ? CHATTER_P3 : CHATTER_P1;
  const tickerText = `◆ ${pick(tickerPool)} ◆ ${pick(tickerPool)} ◆ ${pick(tickerPool)} ◆`;

  return `
<div class="vs-shell" data-phase="${sidebarPhase}">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');
:root {
  --vs-tar:#1a1510;--vs-tar2:#241e16;--vs-plank:#3a2e1e;--vs-plank-lt:#584830;
  --vs-parchment:#d8ceb4;--vs-parch-dk:#b8a888;--vs-parch-lt:#e8e0cc;
  --vs-fjord:#3a5568;--vs-frost:#9ab8c8;--vs-ice:#c8dce8;--vs-storm:#2a3a48;
  --vs-sea-deep:#1a2830;--vs-sea-mid:#2a4050;--vs-wave:#4a7888;
  --vs-ember:#c45a20;--vs-flame:#e87830;--vs-gold:#c8a040;--vs-gold-lt:#e0c060;
  --vs-forge:#ff9040;
  --vs-blood:#8a2020;--vs-iron:#6a6a6a;--vs-steel:#8a8a88;
  --vs-rune:#a08048;--vs-rune-glow:rgba(192,160,64,.3);
  --vs-danger:#c83030;--vs-safe:#3a8850;--vs-warn:#c89830;
  --vs-glass:rgba(26,21,16,.7);--vs-glass2:rgba(26,21,16,.85);
}
.vs-shell{position:relative;max-width:1100px;margin:0 auto;font-family:'EB Garamond',Georgia,serif;color:var(--vs-parchment);z-index:2;}
.vs-grid{display:grid;grid-template-columns:1fr 260px;gap:0;}
@media(max-width:800px){.vs-grid{grid-template-columns:1fr;}.vs-sidebar{order:-1;}}
.vs-main{min-width:0;border-right:2px solid var(--vs-plank-lt);padding-bottom:140px;}
/* Title screen (no grid, full viewport) */
.vs-title-screen{position:relative;min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;}
.vs-title-screen .vs-title-series{font-family:'Cinzel',serif;font-size:clamp(11px,1.5vw,14px);color:var(--vs-frost);letter-spacing:8px;text-transform:uppercase;}
.vs-title-screen .vs-title-main{font-family:'Cinzel Decorative',serif;font-weight:900;font-size:clamp(48px,8vw,80px);color:var(--vs-gold);letter-spacing:clamp(4px,1vw,12px);text-transform:uppercase;line-height:1;margin:8px 0;text-shadow:0 4px 12px rgba(0,0,0,.7),0 0 40px var(--vs-rune-glow),0 0 80px rgba(200,160,64,.08);}
.vs-title-screen .vs-title-tagline{font-family:'EB Garamond',serif;font-style:italic;font-size:clamp(14px,2vw,20px);color:var(--vs-parch-dk);letter-spacing:2px;margin-top:4px;}
.vs-title-runes{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0;}
.vs-title-rune{font-family:'Cinzel Decorative',serif;font-size:24px;color:var(--vs-rune);opacity:.4;}
.vs-title-rune-line{width:clamp(40px,8vw,100px);height:1px;background:linear-gradient(90deg,transparent,var(--vs-rune),transparent);}
.vs-title-phases{display:flex;gap:0;margin-top:28px;}
.vs-title-phase-pip{padding:8px 20px;font-family:'Cinzel',serif;font-size:clamp(8px,1vw,11px);letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(160,128,72,.2);color:var(--vs-parch-dk);background:rgba(26,21,16,.5);}
.vs-title-phase-pip:first-child{border-radius:4px 0 0 4px;}
.vs-title-phase-pip:last-child{border-radius:0 4px 4px 0;}
.vs-title-phase-pip .pip-num{font-family:'Cinzel Decorative',serif;color:var(--vs-gold);margin-right:6px;font-size:13px;}
.vs-title-phase-pip.active{background:rgba(200,160,64,.1);border-color:var(--vs-gold);color:var(--vs-gold);}
.vs-title-tribe-row{display:flex;align-items:center;gap:8px;margin-top:24px;}
.vs-title-tribe-label{font-family:'Cinzel',serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:4px 12px;border-radius:3px;}
.vs-title-tribe-label.team-a{color:var(--vs-ember);border:1px solid rgba(196,90,32,.3);background:rgba(196,90,32,.08);}
.vs-title-tribe-label.team-b{color:var(--vs-frost);border:1px solid rgba(58,85,104,.3);background:rgba(58,85,104,.08);}
.vs-title-tribe-vs{font-family:'Cinzel Decorative',serif;font-size:14px;color:var(--vs-gold);opacity:.5;}
.vs-title-roster{display:flex;gap:8px;margin-top:32px;flex-wrap:wrap;justify-content:center;}
.vs-title-player{display:flex;flex-direction:column;align-items:center;gap:4px;transition:transform .3s;}
.vs-title-player:hover{transform:translateY(-4px);}
.vs-title-player-avatar{width:40px;height:40px;border-radius:50%;border:2px solid var(--vs-rune);overflow:hidden;background:var(--vs-plank);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.5);}
.vs-title-player-avatar img{width:100%;height:100%;object-fit:cover;}
.vs-title-player-avatar .initials{font-family:'Cinzel',serif;font-size:12px;font-weight:700;color:var(--vs-gold);}
.vs-title-player-name{font-family:'Cinzel',serif;font-size:8px;letter-spacing:1px;color:var(--vs-parch-dk);text-transform:uppercase;}
.vs-title-player.team-a .vs-title-player-avatar{border-color:var(--vs-ember);}
.vs-title-player.team-b .vs-title-player-avatar{border-color:var(--vs-frost);}

/* ═══════ ATMOSPHERE — frozen fjord ═══════ */
.vs-atmo{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.vs-atmo-sky{position:absolute;inset:0;
  background:linear-gradient(180deg,#2a3540 0%,#3a4a58 25%,#4a5a68 50%,#3a4a58 75%,var(--vs-sea-deep) 100%);}
.vs-aurora{position:absolute;top:5%;left:0;right:0;height:30%;opacity:.12;
  background:linear-gradient(90deg,transparent 0%,rgba(80,180,120,.4) 20%,rgba(60,160,180,.3) 40%,
  rgba(100,200,140,.35) 60%,rgba(80,140,180,.25) 80%,transparent 100%);
  filter:blur(40px);animation:vs-aurora-shift 20s ease-in-out infinite alternate;}
@keyframes vs-aurora-shift{0%{transform:translateX(-5%) scaleY(1)}50%{transform:translateX(5%) scaleY(1.3)}100%{transform:translateX(-3%) scaleY(.8)}}
.vs-mtn{position:absolute;bottom:35%;}
.vs-mtn.m1{left:-5%;width:0;height:0;border-style:solid;border-width:0 200px 300px 180px;border-color:transparent transparent rgba(20,28,35,.8) transparent;}
.vs-mtn.m2{left:20%;width:0;height:0;border-style:solid;border-width:0 160px 260px 140px;border-color:transparent transparent rgba(25,32,40,.7) transparent;}
.vs-mtn.m3{left:50%;width:0;height:0;border-style:solid;border-width:0 220px 340px 200px;border-color:transparent transparent rgba(22,30,38,.75) transparent;}
.vs-mtn.m4{left:75%;width:0;height:0;border-style:solid;border-width:0 180px 280px 160px;border-color:transparent transparent rgba(18,26,33,.7) transparent;}
.vs-cap{position:absolute;}
.vs-cap.c1{left:calc(-5% + 110px);bottom:calc(35% + 200px);width:0;height:0;border-style:solid;border-width:0 80px 80px 60px;border-color:transparent transparent rgba(200,220,232,.08) transparent;}
.vs-cap.c3{left:calc(50% + 90px);bottom:calc(35% + 240px);width:0;height:0;border-style:solid;border-width:0 100px 80px 90px;border-color:transparent transparent rgba(200,220,232,.1) transparent;}
.vs-sea{position:absolute;bottom:0;left:0;right:0;height:35%;background:linear-gradient(0deg,var(--vs-sea-deep) 0%,var(--vs-sea-mid) 40%,var(--vs-storm) 100%);}
.vs-wave-line{position:absolute;left:0;right:0;height:2px;opacity:.15;}
.vs-wave-line:nth-child(1){top:10%;background:var(--vs-frost);animation:vs-wave 4s ease-in-out infinite;}
.vs-wave-line:nth-child(2){top:30%;background:var(--vs-wave);animation:vs-wave 5s ease-in-out infinite .5s;}
.vs-wave-line:nth-child(3){top:55%;background:var(--vs-frost);animation:vs-wave 6s ease-in-out infinite 1s;}
.vs-wave-line:nth-child(4){top:75%;background:var(--vs-wave);animation:vs-wave 4.5s ease-in-out infinite 1.5s;}
@keyframes vs-wave{0%,100%{transform:translateX(-3%)}50%{transform:translateX(3%)}}

/* Snowfall */
.vs-snow-wrap{position:fixed;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden;}
.vs-sf{position:absolute;background:rgba(200,220,232,.6);border-radius:50%;animation:vs-fall linear infinite;}
@keyframes vs-fall{0%{transform:translateY(-10px) translateX(0);opacity:0}5%{opacity:.4}50%{transform:translateY(50vh) translateX(25px)}100%{transform:translateY(105vh) translateX(10px);opacity:0}}

/* Ember particles */
.vs-embers{position:fixed;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden;transition:opacity 1s;}
.vs-ember-p{position:absolute;border-radius:50%;background:var(--vs-ember);animation:vs-ember-rise linear infinite;}
@keyframes vs-ember-rise{0%{transform:translateY(100vh) translateX(0);opacity:0}10%{opacity:.6}80%{opacity:.3}100%{transform:translateY(-10vh) translateX(30px);opacity:0}}

@media(prefers-reduced-motion:reduce){.vs-sf,.vs-aurora,.vs-wave-line,.vs-ember-p{animation:none !important;}}

/* ═══════ CSS ICONS (runic/nordic) — pseudo-element based ═══════ */
.vs-ico{display:inline-block;position:relative;vertical-align:middle;}
.vs-ico-hammer{width:14px;height:14px;}
.vs-ico-hammer::before{content:'';position:absolute;top:1px;left:3px;width:8px;height:6px;background:var(--vs-iron);border-radius:1px;border:1px solid var(--vs-steel);}
.vs-ico-hammer::after{content:'';position:absolute;top:7px;left:6px;width:2px;height:7px;background:var(--vs-plank-lt);border-radius:0 0 1px 1px;}
.vs-ico-shield{width:14px;height:16px;}
.vs-ico-shield::before{content:'';position:absolute;top:0;left:1px;width:12px;height:12px;border:2px solid var(--vs-gold);border-radius:50% 50% 50% 50% / 40% 40% 60% 60%;background:var(--vs-plank);}
.vs-ico-shield::after{content:'';position:absolute;top:4px;left:5px;width:4px;height:4px;background:var(--vs-gold);border-radius:50%;}
.vs-ico-cannon{width:16px;height:12px;}
.vs-ico-cannon::before{content:'';position:absolute;top:2px;left:0;width:12px;height:6px;background:var(--vs-iron);border-radius:2px 6px 6px 2px;border:1px solid var(--vs-steel);}
.vs-ico-cannon::after{content:'';position:absolute;top:4px;left:12px;width:4px;height:3px;background:var(--vs-ember);border-radius:0 2px 2px 0;}
.vs-ico-flag{width:12px;height:16px;}
.vs-ico-flag::before{content:'';position:absolute;top:0;left:0;width:2px;height:16px;background:var(--vs-plank-lt);}
.vs-ico-flag::after{content:'';position:absolute;top:1px;left:2px;width:9px;height:7px;background:var(--vs-ember);clip-path:polygon(0 0,100% 15%,85% 50%,100% 85%,0 100%);}
.vs-ico-ship{width:18px;height:14px;}
.vs-ico-ship::before{content:'';position:absolute;bottom:0;left:0;width:18px;height:6px;background:var(--vs-plank);border-radius:0 0 50% 50%;border:1px solid var(--vs-plank-lt);}
.vs-ico-ship::after{content:'';position:absolute;top:0;left:8px;width:2px;height:10px;background:var(--vs-plank-lt);}
.vs-ico-rune{width:10px;height:14px;font-family:'Cinzel Decorative',serif;font-size:14px;color:var(--vs-gold);line-height:1;}
.vs-ico-scroll{width:14px;height:12px;}
.vs-ico-scroll::before{content:'';position:absolute;top:0;left:0;width:14px;height:10px;background:var(--vs-parch-dk);border-radius:2px;border:1px solid var(--vs-rune);}
.vs-ico-scroll::after{content:'';position:absolute;top:2px;left:3px;right:3px;height:1px;background:var(--vs-plank);box-shadow:0 3px 0 var(--vs-plank),0 6px 0 var(--vs-plank);}
.vs-ico-fire{width:10px;height:14px;}
.vs-ico-fire::before{content:'';position:absolute;bottom:0;left:1px;width:8px;height:10px;background:var(--vs-ember);border-radius:50% 50% 30% 30%;clip-path:polygon(50% 0%,100% 60%,80% 100%,20% 100%,0% 60%);}
.vs-ico-fire::after{content:'';position:absolute;bottom:1px;left:3px;width:4px;height:5px;background:var(--vs-flame);border-radius:50% 50% 30% 30%;clip-path:polygon(50% 0%,100% 60%,80% 100%,20% 100%,0% 60%);}
.vs-ico-skull{width:12px;height:14px;}
.vs-ico-skull::before{content:'';position:absolute;top:0;left:1px;width:10px;height:10px;background:var(--vs-parchment);border-radius:50% 50% 40% 40%;border:1px solid var(--vs-iron);}
.vs-ico-skull::after{content:'';position:absolute;top:3px;left:3px;width:3px;height:3px;background:var(--vs-tar);border-radius:50%;box-shadow:4px 0 0 var(--vs-tar);}
.vs-ico-trophy{width:14px;height:14px;}
.vs-ico-trophy::before{content:'';position:absolute;top:0;left:3px;width:8px;height:8px;background:var(--vs-gold);border-radius:0 0 50% 50%;border:1px solid var(--vs-gold-lt);}
.vs-ico-trophy::after{content:'';position:absolute;bottom:0;left:4px;width:6px;height:4px;background:var(--vs-gold);border-radius:0 0 2px 2px;border-top:1px solid var(--vs-gold-lt);}
.vs-ico-anchor{width:12px;height:16px;}
.vs-ico-anchor::before{content:'';position:absolute;top:0;left:4px;width:4px;height:12px;background:var(--vs-iron);border-radius:2px 2px 0 0;}
.vs-ico-anchor::after{content:'';position:absolute;bottom:0;left:0;width:12px;height:4px;border:2px solid var(--vs-iron);border-top:none;border-radius:0 0 50% 50%;}
.vs-ico-ammo{width:10px;height:10px;}
.vs-ico-ammo::before{content:'';position:absolute;top:1px;left:1px;width:8px;height:8px;background:var(--vs-iron);border-radius:50%;border:1px solid var(--vs-steel);box-shadow:inset -2px -2px 0 rgba(0,0,0,.3);}

/* ═══════ BROADCAST CHROME ═══════ */
.vs-broadcast{position:relative;z-index:3;height:38px;
  background:linear-gradient(90deg,var(--vs-tar2),var(--vs-plank),var(--vs-tar2));
  border-bottom:2px solid var(--vs-gold);display:flex;align-items:center;justify-content:space-between;padding:0 16px;}
.vs-live{display:flex;align-items:center;gap:6px;font-family:'Cinzel',serif;font-size:10px;
  color:var(--vs-ember);text-transform:uppercase;letter-spacing:3px;font-weight:700;}
.vs-live-dot{width:8px;height:8px;background:var(--vs-ember);border-radius:50%;animation:vs-pulse 1.2s ease-in-out infinite;}
@keyframes vs-pulse{0%,100%{opacity:1;box-shadow:0 0 4px var(--vs-ember)}50%{opacity:.3;box-shadow:none}}
.vs-ticker{flex:1;overflow:hidden;margin:0 24px;height:18px;position:relative;}
.vs-ticker-inner{position:absolute;white-space:nowrap;animation:vs-scroll 35s linear infinite;
  font-family:'EB Garamond',serif;font-size:12px;font-style:italic;color:var(--vs-parch-dk);letter-spacing:1px;}
@keyframes vs-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.vs-saga-mark{font-family:'Cinzel Decorative',serif;color:var(--vs-gold);font-size:12px;letter-spacing:3px;}
@media(prefers-reduced-motion:reduce){.vs-live-dot,.vs-ticker-inner{animation:none !important;}}

/* ═══════ TITLE BANNER ═══════ */
.vs-title-banner{
  background:linear-gradient(180deg,var(--vs-tar) 0%,var(--vs-plank) 100%);
  border-bottom:3px solid var(--vs-gold);padding:24px 28px 18px;position:relative;z-index:2;
  box-shadow:0 4px 20px rgba(0,0,0,.5);}
.vs-title-banner::before{content:'';position:absolute;bottom:3px;left:0;right:0;height:8px;
  background:repeating-linear-gradient(90deg,var(--vs-gold) 0px,var(--vs-gold) 4px,transparent 4px,transparent 12px,
  var(--vs-gold) 12px,var(--vs-gold) 14px,transparent 14px,transparent 20px);opacity:.2;}
.vs-title-main{font-family:'Cinzel Decorative',serif;font-weight:900;font-size:clamp(22px,3vw,30px);
  color:var(--vs-gold);letter-spacing:6px;text-transform:uppercase;
  text-shadow:0 2px 4px rgba(0,0,0,.6),0 0 20px var(--vs-rune-glow);}
.vs-title-sub{font-family:'Cinzel',serif;font-size:11px;color:var(--vs-parch-dk);letter-spacing:6px;
  text-transform:uppercase;margin-top:4px;}
.vs-title-phase{font-family:'Cinzel',serif;font-size:13px;color:var(--vs-frost);letter-spacing:3px;
  margin-top:10px;padding-top:8px;border-top:1px solid rgba(192,160,64,.2);}
.vs-title-desc{font-family:'EB Garamond',serif;font-size:15px;font-style:italic;color:var(--vs-parch-dk);
  margin-top:6px;line-height:1.4;max-width:600px;}

/* Knotwork divider */
.vs-knot{height:16px;margin:8px 0;position:relative;overflow:hidden;}
.vs-knot::before{content:'';position:absolute;top:7px;left:0;right:0;height:2px;background:var(--vs-rune);opacity:.3;}
.vs-knot::after{content:'◆ ◆ ◆';position:absolute;top:0;left:50%;transform:translateX(-50%);
  font-size:10px;color:var(--vs-rune);letter-spacing:8px;background:var(--vs-tar);padding:0 12px;}

/* ═══════ CARDS ═══════ */
.vs-card{background:var(--vs-glass2);border:1px solid rgba(192,160,64,.15);
  margin:8px 16px;padding:12px 16px;position:relative;
  border-left:3px solid var(--vs-plank-lt);transition:opacity .4s ease-out,transform .4s ease-out;}
.vs-card.vs-hidden{opacity:0;transform:translateY(12px);pointer-events:none;max-height:0;overflow:hidden;margin:0 !important;padding:0 !important;border:0 !important;}
.vs-card.vs-visible{opacity:1;transform:translateY(0);max-height:none;overflow:visible;}
.vs-card-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;}
.vs-card-who{font-family:'Cinzel',serif;font-size:13px;font-weight:700;color:var(--vs-parchment);letter-spacing:1px;}
.vs-card-tribe{font-family:'Fira Code',monospace;font-size:10px;font-weight:500;letter-spacing:1px;text-transform:uppercase;padding:1px 6px;border-radius:2px;background:rgba(0,0,0,.35);margin-right:2px;}
.vs-card-tag{font-family:'Fira Code',monospace;font-size:9px;padding:2px 8px;border-radius:2px;
  text-transform:uppercase;letter-spacing:1px;white-space:nowrap;}
.vs-card-body{font-family:'EB Garamond',serif;font-size:14px;line-height:1.5;color:var(--vs-parch-dk);}
.vs-card-foot{font-family:'Fira Code',monospace;font-size:10px;margin-top:6px;opacity:.6;}

/* Card accent variants */
.vs-card.eureka{border-left-color:var(--vs-gold);background:rgba(200,160,64,.06);}
.vs-card.build{border-left-color:var(--vs-plank-lt);}
.vs-card.sail{border-left-color:var(--vs-fjord);}
.vs-card.cannon{border-left-color:var(--vs-ember);}
.vs-card.social{border-left-color:var(--vs-frost);border-style:dashed;border-left-style:dashed;background:rgba(154,184,200,.04);}
.vs-card.chaos{border-left-color:var(--vs-danger);background:rgba(200,48,48,.04);}
.vs-card.heroic{border-left-color:var(--vs-gold-lt);background:rgba(224,192,96,.06);}

/* Tags */
.tag-eureka{background:var(--vs-gold);color:var(--vs-tar);}
.tag-build{background:var(--vs-plank-lt);color:var(--vs-parchment);}
.tag-sail{background:var(--vs-fjord);color:var(--vs-ice);}
.tag-cannon{background:var(--vs-ember);color:var(--vs-parchment);}
.tag-hit{background:var(--vs-danger);color:#fff;}
.tag-miss{background:var(--vs-iron);color:var(--vs-parchment);}
.tag-social{background:var(--vs-frost);color:var(--vs-tar);}
.tag-chaos{background:var(--vs-blood);color:var(--vs-parchment);}
.tag-repair{background:var(--vs-safe);color:#fff;}
.tag-flag{background:var(--vs-gold-lt);color:var(--vs-tar);}
.tag-sink{background:var(--vs-danger);color:#fff;font-weight:700;}

/* Portrait */
.vs-portrait{width:28px;height:28px;border-radius:50%;background:var(--vs-plank);
  border:2px solid var(--vs-rune);display:inline-flex;align-items:center;justify-content:center;
  font-family:'Cinzel',serif;font-size:10px;font-weight:700;color:var(--vs-gold);flex-shrink:0;object-fit:contain;}

/* ═══════ SIDEBAR ═══════ */
.vs-sidebar-cell{position:relative;}
.vs-sidebar{background:var(--vs-glass2);padding:12px;font-size:12px;position:sticky;top:0;
  height:100vh;max-height:100vh;overflow-y:auto;
  border-left:2px solid var(--vs-plank-lt);scrollbar-width:thin;scrollbar-color:var(--vs-plank-lt) transparent;
  overscroll-behavior:contain;}
.vs-sb-title{font-family:'Cinzel',serif;font-size:11px;color:var(--vs-gold);letter-spacing:2px;
  text-transform:uppercase;margin:12px 0 6px;padding-bottom:4px;border-bottom:1px solid rgba(192,160,64,.2);}
.vs-sb-title:first-child{margin-top:0;}
.vs-sb-divider{border:none;border-top:1px solid rgba(192,160,64,.1);margin:8px 0;}
.vs-sb-tribe{padding:6px 8px;margin:4px 0;background:rgba(58,46,30,.3);border:1px solid rgba(192,160,64,.1);border-radius:3px;}
.vs-sb-tribe-name{font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:1px;
  display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.vs-sb-tribe-dot{width:8px;height:8px;border-radius:2px;display:inline-block;}
.vs-sb-stat{font-family:'Fira Code',monospace;font-size:9px;color:var(--vs-parch-dk);
  display:flex;align-items:center;gap:4px;margin:2px 0;}

/* Ship HP bar */
.vs-hp-bar{height:12px;background:rgba(42,42,42,.5);border:1px solid var(--vs-plank-lt);border-radius:2px;
  margin:4px 0;position:relative;overflow:hidden;}
.vs-hp-fill{height:100%;border-radius:1px;transition:width .5s ease-out;}
.vs-hp-fill.healthy{background:linear-gradient(90deg,var(--vs-safe),#4a9860);}
.vs-hp-fill.damaged{background:linear-gradient(90deg,var(--vs-warn),#d4a830);}
.vs-hp-fill.critical{background:linear-gradient(90deg,var(--vs-danger),#e84040);animation:vs-hp-flash 1s infinite;}
@keyframes vs-hp-flash{0%,100%{opacity:1}50%{opacity:.6}}
.vs-hp-label{position:absolute;top:0;left:0;right:0;height:100%;display:flex;align-items:center;
  justify-content:center;font-family:'Fira Code',monospace;font-size:8px;color:var(--vs-parchment);
  text-shadow:0 1px 2px rgba(0,0,0,.8);letter-spacing:1px;}

/* Ammo display */
.vs-ammo{display:flex;gap:3px;margin:4px 0;flex-wrap:wrap;}
.vs-ammo-ball{width:10px;height:10px;border-radius:50%;background:var(--vs-iron);
  border:1px solid var(--vs-steel);box-shadow:inset -2px -2px 0 rgba(0,0,0,.3);}
.vs-ammo-ball.spent{opacity:.2;}
.vs-ammo-ball.flint{background:var(--vs-ember);border-color:var(--vs-flame);
  box-shadow:inset -2px -2px 0 rgba(0,0,0,.3),0 0 4px rgba(232,120,48,.3);}

/* Flag distance */
.vs-flag-track{height:20px;background:rgba(42,58,72,.3);border:1px solid var(--vs-fjord);
  border-radius:2px;margin:4px 0;position:relative;}
.vs-flag-marker{position:absolute;top:50%;transform:translateY(-50%);transition:left .5s ease-out;}
.vs-flag-goal{position:absolute;right:4px;top:2px;font-size:10px;}

/* Player row */
.vs-sb-player{display:flex;align-items:center;gap:6px;padding:3px 4px;margin:1px 0;}
.vs-sb-player-name{font-family:'EB Garamond',serif;font-size:12px;color:var(--vs-parchment);}
.vs-sb-player-stat{font-family:'Fira Code',monospace;font-size:9px;color:var(--vs-parch-dk);margin-left:auto;}
.vs-sb-badge{font-family:'Fira Code',monospace;font-size:8px;padding:1px 5px;border-radius:2px;display:inline-block;margin-left:4px;}
.vs-sb-badge-gold{background:var(--vs-gold);color:var(--vs-tar);}
.vs-sb-badge-red{background:var(--vs-danger);color:#fff;}
.vs-sb-badge-blue{background:var(--vs-fjord);color:var(--vs-ice);}

/* ═══════ SEA MAP (Naval Battle) ═══════ */
.vs-sea-map{position:sticky;top:0;z-index:5;height:220px;background:linear-gradient(180deg,#1a2838 0%,var(--vs-storm) 30%,var(--vs-sea-deep) 70%,#0e1820 100%);
  border:2px solid var(--vs-plank-lt);border-bottom:3px solid var(--vs-ember);margin:0 0 8px;overflow:hidden;backdrop-filter:blur(4px);}
.vs-sea-map::before{content:'NAVAL BATTLE TRACKER';position:absolute;top:6px;left:12px;font-family:'Cinzel',serif;font-size:8px;color:var(--vs-rune);letter-spacing:3px;text-transform:uppercase;opacity:.5;z-index:6;}
.vs-sea-map-grid{position:absolute;inset:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 29px,rgba(154,184,200,.04) 30px),
  repeating-linear-gradient(90deg,transparent,transparent 29px,rgba(154,184,200,.04) 30px);}
.vs-sea-map-label{position:absolute;font-family:'Fira Code',monospace;font-size:8px;color:var(--vs-frost);opacity:.4;z-index:6;}
.vs-sea-map-flag{position:absolute;top:50%;right:8%;transform:translateY(-50%);z-index:3;}
.vs-sea-map-flag-glow{position:absolute;top:50%;right:7%;width:30px;height:30px;transform:translateY(-50%);
  background:radial-gradient(circle,rgba(200,160,64,.25) 0%,transparent 70%);border-radius:50%;
  animation:vs-flag-pulse 2s ease-in-out infinite;z-index:2;}
@keyframes vs-flag-pulse{0%,100%{opacity:.6;transform:translateY(-50%) scale(1)}50%{opacity:1;transform:translateY(-50%) scale(1.3)}}
.vs-sea-ship{position:absolute;z-index:4;transition:left .8s ease-out,top .3s ease-out;display:flex;flex-direction:column;align-items:center;gap:1px;}
.vs-sea-ship.sinking{animation:vs-sink 2s ease-in forwards;}
.vs-sea-ship.hit{animation:vs-ship-hit .4s ease-out;}
@keyframes vs-sink{0%{transform:rotate(0) translateY(0);opacity:1}40%{transform:rotate(12deg) translateY(8px);opacity:.8}100%{transform:rotate(25deg) translateY(40px);opacity:0}}
@keyframes vs-ship-hit{0%{filter:brightness(1)}15%{filter:brightness(3) saturate(2)}100%{filter:brightness(1)}}
.vs-sea-ship-svg{width:60px;height:30px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));}
.vs-sea-ship-label{font-family:'Fira Code',monospace;font-size:8px;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.8);}
.vs-sea-ship-hpwrap{width:54px;height:6px;border-radius:3px;background:rgba(0,0,0,.5);border:1px solid rgba(154,184,200,.15);overflow:hidden;position:relative;}
.vs-sea-ship-hplabel{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Fira Code',monospace;font-size:6px;color:#fff;text-shadow:0 1px 2px #000;z-index:1;white-space:nowrap;}
.vs-hp-fill{height:100%;border-radius:2px;transition:width .6s ease-out;}
.vs-hp-fill.healthy{background:linear-gradient(90deg,#3a8850,#5aaa70);}
.vs-hp-fill.damaged{background:linear-gradient(90deg,#c89830,#e0b040);}
.vs-hp-fill.critical{background:linear-gradient(90deg,#c83030,#e85040);animation:vs-hp-crit .8s ease-in-out infinite;}
@keyframes vs-hp-crit{0%,100%{opacity:1}50%{opacity:.5}}
.vs-sea-ship-fire{position:absolute;top:-6px;left:50%;transform:translateX(-50%);opacity:0;transition:opacity .5s;pointer-events:none;}
.vs-sea-ship-fire.active{opacity:1;}
.vs-sea-map-wave{position:absolute;height:1px;left:0;right:0;background:rgba(154,184,200,.08);
  animation:vs-mapwave 3s ease-in-out infinite alternate;}
@keyframes vs-mapwave{0%{transform:translateX(-2%)}100%{transform:translateX(2%)}}
.vs-cannonball{position:absolute;width:6px;height:6px;background:radial-gradient(circle,var(--vs-ember),#333);
  border-radius:50%;z-index:10;pointer-events:none;opacity:0;}
.vs-cannonball.fired{animation:vs-cannonball-fly .6s ease-in forwards;}
.vs-cannonball-trail{position:absolute;width:3px;height:3px;background:var(--vs-ember);border-radius:50%;
  z-index:9;pointer-events:none;opacity:0;}
@keyframes vs-cannonball-fly{0%{opacity:1;transform:translate(0,0) scale(1)}50%{opacity:1;transform:translate(var(--cb-dx),calc(var(--cb-dy) - 20px)) scale(1.2)}100%{opacity:0;transform:translate(var(--cb-dx),var(--cb-dy)) scale(.5)}}
.vs-impact-flash{position:absolute;width:20px;height:20px;border-radius:50%;z-index:11;pointer-events:none;opacity:0;
  background:radial-gradient(circle,rgba(255,200,80,.9) 0%,rgba(200,90,32,.5) 40%,transparent 70%);}
.vs-impact-flash.active{animation:vs-impact .5s ease-out forwards;}
@keyframes vs-impact{0%{opacity:1;transform:translate(-50%,-50%) scale(.3)}50%{opacity:.8;transform:translate(-50%,-50%) scale(1.5)}100%{opacity:0;transform:translate(-50%,-50%) scale(2)}}
.vs-map-round-label{position:absolute;top:6px;right:12px;font-family:'Cinzel',serif;font-size:9px;color:var(--vs-frost);letter-spacing:2px;opacity:.6;z-index:6;}
@media(prefers-reduced-motion:reduce){.vs-sea-ship.sinking,.vs-sea-ship.hit,.vs-cannonball.fired,.vs-impact-flash.active,.vs-sea-map-flag-glow,.vs-hp-fill.critical{animation:none !important;}}

/* ═══════ BLUEPRINT OVERLAY ═══════ */
.vs-blueprint{background:rgba(200,206,180,.06);border:1px dashed var(--vs-parch-dk);
  margin:8px 16px;padding:16px;position:relative;}
.vs-blueprint-title{font-family:'Cinzel',serif;font-size:11px;color:var(--vs-rune);
  letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
.vs-clarity-bar{height:16px;background:rgba(42,42,42,.4);border:1px solid var(--vs-rune);
  border-radius:2px;position:relative;overflow:hidden;}
.vs-clarity-fill{height:100%;background:linear-gradient(90deg,var(--vs-rune),var(--vs-gold));
  border-radius:1px;transition:width 1s ease-out;}
.vs-clarity-label{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-family:'Fira Code',monospace;font-size:9px;color:var(--vs-parchment);text-shadow:0 1px 2px rgba(0,0,0,.8);}
.vs-frag{display:inline-block;padding:2px 6px;margin:2px;font-family:'Fira Code',monospace;font-size:9px;
  background:var(--vs-parch-dk);color:var(--vs-tar);border-radius:1px;opacity:.6;
  transform:rotate(var(--rot));transition:opacity .3s;}
.vs-frag.found{opacity:1;background:var(--vs-gold);color:var(--vs-tar);}

/* Assembly progress per tribe */
.vs-assembly-row{display:flex;align-items:center;gap:10px;margin:6px 16px;
  padding:8px 12px;background:rgba(58,46,30,.2);border:1px solid rgba(192,160,64,.1);}
.vs-assembly-tribe{font-family:'Cinzel',serif;font-size:11px;font-weight:700;width:80px;
  display:flex;align-items:center;gap:6px;}
.vs-assembly-bar{flex:1;height:14px;background:rgba(42,42,42,.4);border:1px solid var(--vs-plank-lt);
  border-radius:2px;position:relative;overflow:hidden;}
.vs-assembly-fill{height:100%;transition:width .6s ease-out;border-radius:1px;}
.vs-assembly-pct{font-family:'Fira Code',monospace;font-size:9px;color:var(--vs-parch-dk);width:35px;text-align:right;}

/* ═══════ CONSTRUCTION YARD MAP ═══════ */
.vs-yard{margin:8px 16px;padding:16px;background:rgba(26,21,16,.85);border:1px solid rgba(192,160,64,.15);position:sticky;top:0;z-index:5;overflow:hidden;backdrop-filter:blur(4px);}
.vs-yard::before{content:'CONSTRUCTION YARD';position:absolute;top:8px;left:16px;font-family:'Cinzel',serif;font-size:9px;color:var(--vs-rune);letter-spacing:3px;text-transform:uppercase;opacity:.6;}
.vs-yard-grid{display:flex;gap:12px;margin-top:24px;justify-content:center;flex-wrap:wrap;}
.vs-yard-bay{flex:1;min-width:200px;max-width:320px;position:relative;padding:8px;border:1px solid rgba(192,160,64,.1);background:rgba(58,46,30,.15);}
.vs-yard-bay-label{font-family:'Cinzel',serif;font-size:10px;color:var(--vs-parch-dk);letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:4px;display:flex;align-items:center;justify-content:center;gap:6px;}
.vs-yard-ship{display:flex;justify-content:center;padding:8px 0;}
.vs-yard-ship svg{filter:drop-shadow(0 2px 6px rgba(0,0,0,.4));}
.vs-yard-ship svg .ship-part{transition:opacity .5s ease-out,fill .3s ease-out;}
.vs-yard-ship svg .ship-part.hidden{opacity:.08;}
.vs-yard-ship svg .ship-part.building{opacity:.4;animation:vs-part-pulse 1.2s ease-in-out infinite;}
.vs-yard-ship svg .ship-part.built{opacity:1;}
@keyframes vs-part-pulse{0%,100%{opacity:.3}50%{opacity:.6}}
.vs-yard-pct{font-family:'Fira Code',monospace;font-size:11px;text-align:center;margin-top:4px;letter-spacing:1px;}
.vs-yard-parts{display:flex;gap:3px;justify-content:center;margin-top:6px;flex-wrap:wrap;}
.vs-yard-part-chip{font-family:'Fira Code',monospace;font-size:7px;padding:1px 4px;border-radius:1px;letter-spacing:1px;text-transform:uppercase;background:rgba(42,42,42,.6);color:var(--vs-iron);border:1px solid rgba(106,106,106,.2);transition:all .4s ease-out;}
.vs-yard-part-chip.active{background:var(--vs-gold);color:var(--vs-tar);border-color:var(--vs-gold);}
@media(prefers-reduced-motion:reduce){.vs-yard-ship svg .ship-part.building{animation:none !important;opacity:.4;}}

/* ═══════ BATTLE RESULTS ═══════ */
.vs-battle-result{margin:12px 16px;padding:16px;text-align:center;
  border:2px solid var(--vs-gold);background:rgba(200,160,64,.06);position:relative;}
.vs-battle-result::before{content:'';position:absolute;inset:3px;border:1px solid rgba(192,160,64,.2);}
.vs-battle-result-title{font-family:'Cinzel Decorative',serif;font-size:20px;color:var(--vs-gold);
  letter-spacing:4px;text-transform:uppercase;}
.vs-battle-result-method{font-family:'EB Garamond',serif;font-style:italic;font-size:14px;
  color:var(--vs-parch-dk);margin-top:4px;}

/* ═══════ COMM CHATTER ═══════ */
.vs-comm{font-family:'EB Garamond',serif;font-style:italic;font-size:12px;color:var(--vs-parch-dk);
  margin:4px 16px;padding:4px 12px;border-left:2px solid rgba(192,160,64,.15);opacity:.7;}
.vs-comm-host{color:var(--vs-frost);border-left-color:var(--vs-frost);}

/* ═══════ PODIUM ═══════ */
.vs-podium{display:flex;justify-content:center;gap:16px;margin:16px;flex-wrap:wrap;}
.vs-podium-slot{padding:16px;text-align:center;min-width:140px;
  background:var(--vs-glass2);border:1px solid rgba(192,160,64,.15);position:relative;}
.vs-podium-slot.winner{border-color:var(--vs-gold);box-shadow:0 0 20px var(--vs-rune-glow);}
.vs-podium-slot.loser{border-color:var(--vs-danger);opacity:.7;}
.vs-podium-rank{font-family:'Cinzel Decorative',serif;font-size:20px;color:var(--vs-gold);}
.vs-podium-name{font-family:'Cinzel',serif;font-size:14px;color:var(--vs-parchment);letter-spacing:2px;margin:6px 0;}
.vs-podium-scores{font-family:'Fira Code',monospace;font-size:9px;color:var(--vs-parch-dk);line-height:1.8;}

/* ═══════ CONTROLS ═══════ */
.vs-controls{position:fixed;bottom:0;left:0;right:0;z-index:1000;
  background:linear-gradient(0deg,var(--vs-tar),rgba(26,21,16,.95));
  border-top:2px solid var(--vs-gold);padding:10px 16px;
  display:flex;align-items:center;justify-content:center;gap:12px;}
.vs-btn{font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;
  padding:8px 20px;border:1px solid var(--vs-gold);background:transparent;color:var(--vs-gold);
  cursor:pointer;transition:all .2s;}
.vs-btn:hover{background:var(--vs-gold);color:var(--vs-tar);}
.vs-counter{font-family:'Fira Code',monospace;font-size:11px;color:var(--vs-parch-dk);}
</style>

<div class="vs-atmo">
  <div class="vs-atmo-sky"></div>
  <div class="vs-aurora"></div>
  <div class="vs-mtn m1"></div><div class="vs-mtn m2"></div><div class="vs-mtn m3"></div><div class="vs-mtn m4"></div>
  <div class="vs-cap c1"></div><div class="vs-cap c3"></div>
  <div class="vs-sea">
    <div class="vs-wave-line"></div><div class="vs-wave-line"></div>
    <div class="vs-wave-line"></div><div class="vs-wave-line"></div>
  </div>
</div>

<div class="vs-snow-wrap">${_genSnowflakes(40)}</div>
<div class="vs-embers" style="opacity:${showEmbers ? '1' : '0'}">${_genEmbers(25)}</div>

<div class="vs-broadcast">
  <div class="vs-live"><div class="vs-live-dot"></div> SAGA LIVE</div>
  <div class="vs-ticker"><div class="vs-ticker-inner">${tickerText}</div></div>
  <div class="vs-saga-mark">VIKING SOUR</div>
</div>

<div class="vs-grid">
  <div class="vs-main">
    ${content}
  </div>
  ${sidebarHTML}
</div>

</div>`;
}

// ══════════════════════════════════════════════════════════════
// VP: SIDEBAR — matches mockup (HP bars, ammo balls, flag track, battle log, saga moments)
// ══════════════════════════════════════════════════════════════

function _buildSidebar(ep, phase, screenKey) {
  return `<div class="vs-sidebar-cell"><div class="vs-sidebar"><div id="vs-sidebar-inner">${_buildSidebarContent(ep, phase, screenKey)}</div></div></div>`;
}

function _hpClass(hp) {
  return hp > 125 ? 'healthy' : hp > 60 ? 'damaged' : 'critical';
}

function _buildAmmoHTML(total, spent, flintCount) {
  let html = '';
  for (let i = 0; i < flintCount; i++) {
    html += i < (total - spent) ? '<div class="vs-ammo-ball flint"></div>' : '<div class="vs-ammo-ball spent"></div>';
  }
  const regular = total - flintCount;
  const regularLeft = Math.max(0, (total - spent) - flintCount);
  for (let i = 0; i < regular; i++) {
    html += i < regularLeft ? '<div class="vs-ammo-ball"></div>' : '<div class="vs-ammo-ball spent"></div>';
  }
  return html;
}

function _buildSidebarContent(ep, phase, screenKey) {
  const data = ep.vikingSour;
  if (!data) return '';

  const st = _tvState[screenKey];
  const revealIdx = st ? st.idx : -1;

  let html = `<div class="vs-sb-title">${_icoShip()} Fleet Status</div>`;

  data.tribes.forEach(tribe => {
    const col = tribe.color;

    if (phase === 'blueprint') {
      const stepMeta = window._vsPhase1StepMeta;
      const _skipTypes = new Set(['header', 'blueprint', 'yard', 'summary', 'chatter']);
      const totalEvts = stepMeta ? stepMeta.filter(s => !_skipTypes.has(s.type)).length : 1;
      const _preShow = 2;
      const revealedEvts = revealIdx <= _preShow - 1 ? 0 : Math.min(totalEvts, revealIdx - (_preShow - 1));
      const progress = totalEvts > 0 ? revealedEvts / totalEvts : 0;

      const finalClarity = data.phase1.clarity[tribe.name] || 0;
      const finalBQ = data.phase1.buildQuality[tribe.name] || 0;
      const finalHP = data.phase1.boatHP[tribe.name] || 50;

      const clarity = Math.round(finalClarity * progress);
      const bq = Math.round(finalBQ * progress);
      const hp = Math.round(250 - (250 - finalHP) * progress);
      const hpPct = clamp(Math.round(hp / 250 * 100), 0, 100);
      const qualityLabel = bq >= 75 ? 'Sturdy' : bq >= 50 ? 'Decent' : bq > 0 ? 'Leaky' : '—';
      html += `<div class="vs-sb-tribe">
        <div class="vs-sb-tribe-name">
          <span class="vs-sb-tribe-dot" style="background:${col}"></span> ${tribe.name}
          ${tribe.isFlintWinner ? '<span class="vs-sb-badge vs-sb-badge-gold" style="margin-left:auto;font-size:7px;">FLINT</span>' : ''}
        </div>
        <div class="vs-sb-stat">${_icoScroll()} Clarity: ${Math.round(clarity)}%</div>
        <div class="vs-clarity-bar">
          <div class="vs-clarity-fill" style="width:${clarity}%"></div>
          <div class="vs-clarity-label">${Math.round(clarity)}%</div>
        </div>
        <div class="vs-sb-stat">${_icoShield()} Hull HP:</div>
        <div class="vs-hp-bar">
          <div class="vs-hp-fill ${_hpClass(hp)}" style="width:${hpPct}%"></div>
          <div class="vs-hp-label">${hp} / 250</div>
        </div>
        <div class="vs-sb-stat">${_icoScroll()} Build Quality: ${Math.round(bq)} (${qualityLabel})</div>`;

      // Player contribution bars inside tribe block
      const evts = data.phase1.events;
      const _preShow2 = 2;
      const _skipT = new Set(['header', 'blueprint', 'yard', 'summary', 'chatter']);
      const revealedCount = revealIdx <= _preShow2 - 1 ? 0 : revealIdx - (_preShow2 - 1);
      const playerScores = {};
      const playerBest = {};
      let evtIdx = 0;
      if (stepMeta) {
        for (let si = 0; si < stepMeta.length; si++) {
          if (_skipT.has(stepMeta[si].type)) continue;
          if (evtIdx >= revealedCount) break;
          const evt = evts[evtIdx];
          evtIdx++;
          if (!evt || evt.tribe !== tribe.name) continue;
          const p = evt.player || (evt.players ? evt.players[0] : null) || evt.thief || evt.winner;
          if (!p) continue;
          playerScores[p] = (playerScores[p] || 0) + Math.abs(evt.score || 1);
          if (evt.type === 'eureka') playerBest[p] = 'eureka';
          else if (!playerBest[p]) playerBest[p] = evt.type;
        }
      }
      const maxScore = Math.max(1, ...Object.values(playerScores));
      const tribeMembers = tribe.members || [];
      if (tribeMembers.length > 0) {
        html += `<div style="margin-top:6px;border-top:1px solid rgba(192,160,64,.1);padding-top:4px;">`;
        tribeMembers.forEach(n => {
          const sc = playerScores[n] || 0;
          const pct = maxScore > 0 ? Math.round(sc / maxScore * 100) : 0;
          const best = playerBest[n];
          const barCol = best === 'eureka' ? 'var(--vs-gold)' : best === 'sabotage' || best === 'argument' ? 'var(--vs-danger)' : col;
          html += `<div style="display:flex;align-items:center;gap:4px;margin:2px 0;">
            ${_av(n, 16)}
            <span style="font-family:'Cinzel',serif;font-size:8px;color:var(--vs-parch-dk);width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n}</span>
            <div style="flex:1;height:6px;background:rgba(42,42,42,.4);border-radius:1px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${barCol};border-radius:1px;transition:width .4s ease-out;"></div>
            </div>
            <span style="font-family:'Fira Code',monospace;font-size:7px;color:var(--vs-parch-dk);width:20px;text-align:right;">${sc}</span>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;

    } else if (phase === 'sail') {
      const stepMeta = window._vsPhase2StepMeta;
      const totalEvts = stepMeta ? stepMeta.filter(s => s.type !== 'header' && s.type !== 'summary' && s.type !== 'chatter').length : 1;
      const revealedEvts = revealIdx <= 0 ? 0 : Math.min(totalEvts, revealIdx);
      const sailProgress = totalEvts > 0 ? revealedEvts / totalEvts : 0;

      const startHP = data.phase1.boatHP[tribe.name] || 200;
      const finalHP = data.phase2.boatHP[tribe.name] || 150;
      const hp = Math.round(startHP - (startHP - finalHP) * sailProgress);
      const hpPct2 = clamp(Math.round(hp / 250 * 100), 0, 100);

      const finalSailProg = data.phase2.sailProgress[tribe.name] || 0;
      const maxSailProg = Math.max(1, ...Object.values(data.phase2.sailProgress));
      const pct = (finalSailProg * sailProgress / maxSailProg * 100);

      html += `<div class="vs-sb-tribe">
        <div class="vs-sb-tribe-name">
          <span class="vs-sb-tribe-dot" style="background:${col}"></span> ${tribe.name}
        </div>
        <div class="vs-sb-stat">${_icoShip()} Sail Progress:</div>
        <div class="vs-hp-bar">
          <div class="vs-hp-fill healthy" style="width:${pct}%"></div>
          <div class="vs-hp-label">${Math.round(pct)}%</div>
        </div>
        <div class="vs-sb-stat">${_icoShield()} Hull HP:</div>
        <div class="vs-hp-bar">
          <div class="vs-hp-fill ${_hpClass(hp)}" style="width:${hpPct2}%"></div>
          <div class="vs-hp-label">${hp} / 250</div>
        </div>
        <div class="vs-sb-stat">${_icoScroll()} Build Quality: ${Math.round(tribe.buildQuality)}</div>`;

      // Player contribution bars for Phase 2
      const p2Evts = data.phase2.events;
      const _skipT2 = new Set(['header', 'summary', 'chatter']);
      const p2Scores = {};
      const p2Best = {};
      let p2Count = 0;
      if (stepMeta) {
        for (let si = 0; si < stepMeta.length; si++) {
          if (_skipT2.has(stepMeta[si]?.type)) continue;
          if (p2Count >= revealedEvts) break;
          const evt = p2Evts[p2Count];
          p2Count++;
          if (!evt || evt.tribe !== tribe.name) continue;
          const p = evt.player || (evt.players ? evt.players[0] : null);
          if (!p) continue;
          p2Scores[p] = (p2Scores[p] || 0) + Math.abs(evt.score || 1);
          if (!p2Best[p]) p2Best[p] = evt.type;
        }
      }
      const p2Max = Math.max(1, ...Object.values(p2Scores));
      const p2Members = tribe.members || [];
      if (p2Members.length > 0) {
        html += `<div style="margin-top:6px;border-top:1px solid rgba(192,160,64,.1);padding-top:4px;">`;
        p2Members.forEach(n => {
          const sc = p2Scores[n] || 0;
          const pct2 = p2Max > 0 ? Math.round(sc / p2Max * 100) : 0;
          const best = p2Best[n];
          const barCol = best === 'iceBreakSuccess' ? 'var(--vs-frost)' : best === 'seasick' ? 'var(--vs-danger)' : col;
          html += `<div style="display:flex;align-items:center;gap:4px;margin:2px 0;">
            ${_av(n, 16)}
            <span style="font-family:'Cinzel',serif;font-size:8px;color:var(--vs-parch-dk);width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n}</span>
            <div style="flex:1;height:6px;background:rgba(42,42,42,.4);border-radius:1px;overflow:hidden;">
              <div style="height:100%;width:${pct2}%;background:${barCol};border-radius:1px;transition:width .4s ease-out;"></div>
            </div>
            <span style="font-family:'Fira Code',monospace;font-size:7px;color:var(--vs-parch-dk);width:20px;text-align:right;">${sc}</span>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;

    } else if (phase === 'battle') {
      const snapshots = window._vsMapSnapshots;
      const snapIdx = clamp(revealIdx, 0, (snapshots?.length || 1) - 1);
      const snap = snapshots?.[snapIdx]?.[tribe.name] || {};
      const hp = snap.hp ?? data.phase3.finalHP[tribe.name] ?? 0;
      const ammo = snap.ammo ?? data.phase3.finalAmmo[tribe.name] ?? 0;
      const flagDist = snap.flagDist ?? data.phase3.flagDistance[tribe.name] ?? 100;
      const isSunk = hp <= 0;
      const isWinner = data.phase3.winner === tribe.name && revealIdx >= (st?.total || 0) - 1;
      const totalAmmo = tribe.ammo || 8;
      const spent = Math.max(0, totalAmmo - ammo);
      const flintCount = tribe.isFlintWinner ? 3 : 0;
      const flagPct = clamp(100 - flagDist, 0, 100);

      const hpPct3 = clamp(Math.round(hp / 250 * 100), 0, 100);
      html += `<div class="vs-sb-tribe">
        <div class="vs-sb-tribe-name">
          <span class="vs-sb-tribe-dot" style="background:${col}"></span> ${tribe.name}
          ${tribe.isFlintWinner ? '<span class="vs-sb-badge vs-sb-badge-gold" style="margin-left:auto;font-size:7px;">FLINT</span>' : ''}
        </div>
        <div class="vs-sb-stat">${_icoShield()} Hull HP:</div>
        <div class="vs-hp-bar">
          <div class="vs-hp-fill ${isSunk ? 'critical' : _hpClass(hp)}" style="width:${Math.max(0, hpPct3)}%"></div>
          <div class="vs-hp-label" ${isSunk ? 'style="color:var(--vs-danger)"' : ''}>${isSunk ? 'SUNK' : Math.max(0, hp) + ' / 250'}</div>
        </div>
        <div class="vs-sb-stat">${_icoCannon()} Ammo:</div>
        <div class="vs-ammo">${_buildAmmoHTML(totalAmmo, spent, flintCount)}</div>
        <div class="vs-sb-stat">${_icoFlag()} Flag distance:</div>
        <div class="vs-flag-track">
          <div class="vs-flag-marker" style="left:${flagPct}%;">
            <span class="vs-sb-tribe-dot" style="background:${col};width:10px;height:10px"></span>
          </div>
          <div class="vs-flag-goal">${_icoFlag()}</div>
        </div>
        <div class="vs-sb-stat">${_icoScroll()} Build Quality: ${Math.round(tribe.buildQuality)} (${tribe.buildQuality >= 75 ? 'Sturdy' : tribe.buildQuality >= 50 ? 'Decent' : 'Leaky'})</div>`;

      // Player contribution bars for Phase 3
      const p3Evts = data.phase3.events;
      const p3Scores = {};
      const p3Best = {};
      const p3StepMeta = window._vsPhase3StepMeta;
      const p3Skip = new Set(['header', 'summary', 'chatter', 'map']);
      let p3EvtIdx = 0;
      if (p3StepMeta) {
        for (let si = 0; si <= revealIdx && si < p3StepMeta.length; si++) {
          if (p3Skip.has(p3StepMeta[si]?.type)) continue;
          const evt = p3Evts[p3EvtIdx];
          p3EvtIdx++;
          if (!evt || evt.tribe !== tribe.name) continue;
          const p = evt.player || (evt.players ? evt.players[0] : null);
          if (!p) continue;
          p3Scores[p] = (p3Scores[p] || 0) + Math.abs(evt.score || 1);
          if (!p3Best[p]) p3Best[p] = evt.type;
        }
      }
      const p3Max = Math.max(1, ...Object.values(p3Scores));
      const p3Members = tribe.members || [];
      if (p3Members.length > 0) {
        html += `<div style="margin-top:6px;border-top:1px solid rgba(192,160,64,.1);padding-top:4px;">`;
        p3Members.forEach(n => {
          const sc = p3Scores[n] || 0;
          const pct3 = p3Max > 0 ? Math.round(sc / p3Max * 100) : 0;
          const best = p3Best[n];
          const barCol = best === 'cannonHit' || best === 'flamingAmmo' ? 'var(--vs-ember)' : best === 'repair' ? 'var(--vs-safe)' : best === 'flagGrab' ? 'var(--vs-gold)' : col;
          html += `<div style="display:flex;align-items:center;gap:4px;margin:2px 0;">
            ${_av(n, 16)}
            <span style="font-family:'Cinzel',serif;font-size:8px;color:var(--vs-parch-dk);width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${n}</span>
            <div style="flex:1;height:6px;background:rgba(42,42,42,.4);border-radius:1px;overflow:hidden;">
              <div style="height:100%;width:${pct3}%;background:${barCol};border-radius:1px;transition:width .4s ease-out;"></div>
            </div>
            <span style="font-family:'Fira Code',monospace;font-size:7px;color:var(--vs-parch-dk);width:20px;text-align:right;">${sc}</span>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;

    } else {
      // Title / results
      const hp = data.phase3?.finalHP?.[tribe.name] ?? data.phase1?.boatHP?.[tribe.name] ?? 150;
      const hpPctR = clamp(Math.round(Math.max(0, hp) / 250 * 100), 0, 100);
      const isWinner = data.winnerTribe === tribe.name;
      html += `<div class="vs-sb-tribe">
        <div class="vs-sb-tribe-name">
          <span class="vs-sb-tribe-dot" style="background:${col}"></span> ${tribe.name}
          ${isWinner ? '<span class="vs-sb-badge vs-sb-badge-gold" style="margin-left:auto;font-size:7px;">WINNER</span>' : ''}
        </div>
        <div class="vs-sb-stat">${_icoShield()} Hull HP:</div>
        <div class="vs-hp-bar">
          <div class="vs-hp-fill ${_hpClass(Math.max(0, hp))}" style="width:${hpPctR}%"></div>
          <div class="vs-hp-label">${hp <= 0 ? 'SUNK' : Math.max(0, hp) + ' / 250'}</div>
        </div>
      </div>`;
    }
  });

  // Battle log (phase 3 only, gated by reveal)
  if (phase === 'battle') {
    html += `<hr class="vs-sb-divider">`;
    html += `<div class="vs-sb-title">${_icoCannon()} Battle Log</div>`;
    const battleEvts = data.phase3.events;
    const stepMeta = window._vsPhase3StepMeta;
    const _logSkip = new Set(['header', 'summary', 'chatter', 'map']);
    let maxShow = 0;
    if (revealIdx >= 0 && stepMeta) {
      for (let si = 0; si <= revealIdx && si < stepMeta.length; si++) {
        if (!_logSkip.has(stepMeta[si]?.type)) maxShow++;
      }
      maxShow = Math.min(maxShow, battleEvts.length);
    }
    for (let i = 0; i < maxShow && i < battleEvts.length; i++) {
      const evt = battleEvts[i];
      if (!evt) continue;
      const r = evt.round !== undefined ? `R${evt.round + 1}: ` : '';
      let logCol = 'var(--vs-iron)';
      let logText = '';
      if (evt.type === 'cannonHit') { logCol = 'var(--vs-ember)'; logText = `${r}${evt.tribe} HIT → ${evt.target} -${evt.damage} HP`; }
      else if (evt.type === 'cannonMiss') { logCol = 'var(--vs-iron)'; logText = `${r}${evt.tribe} MISS`; }
      else if (evt.type === 'cannonUnlock') { logCol = 'var(--vs-frost)'; logText = `${r}${evt.tribe} FIRE UNLOCKED`; }
      else if (evt.type === 'cannonUnlockFail') { logCol = 'var(--vs-iron)'; logText = `${r}${evt.tribe} — no fire`; }
      else if (evt.type === 'boardingSuccess') { logCol = 'var(--vs-gold)'; logText = `${r}${evt.player || ''} BOARDING RAID`; }
      else if (evt.type === 'humanCannonball') { logCol = 'var(--vs-forge)'; logText = `${r}${evt.player || ''} HUMAN CANNONBALL → -${evt.damage || 40} HP`; }
      else if (evt.type === 'heroicShield') { logCol = 'var(--vs-gold-lt)'; logText = `${r}${evt.player || ''} HEROIC SHIELD`; }
      else if (evt.type === 'ramHit') { logCol = 'var(--vs-ember)'; logText = `${r}${evt.attacker} RAM → ${evt.target}`; }
      else if (evt.type === 'repair' || evt.type === 'patchGenius') { logCol = 'var(--vs-safe)'; logText = `${r}${evt.tribe} REPAIR +${evt.hp || 0} HP`; }
      else if (evt.type === 'flagGrab') { logCol = 'var(--vs-gold-lt)'; logText = `${r}${evt.tribe} FLAG GRABBED!`; }
      else if (evt.type === 'sink') { logCol = 'var(--vs-danger)'; logText = `${(evt.target || evt.tribe || '').toUpperCase()} SUNK`; }
      else { logText = `${r}${evt.badge || evt.type}`; }
      if (logText) html += `<div class="vs-sb-stat" style="color:${logCol}${evt.type === 'sink' ? ';font-weight:700' : ''}">${logText}</div>`;
    }
  }

  // Saga moments (all phases, gated by reveal)
  const sagaMoments = _collectSagaMoments(data, phase, revealIdx, st);
  if (sagaMoments.length > 0) {
    html += `<hr class="vs-sb-divider">`;
    html += `<div class="vs-sb-title">${_icoRune('ᚱ')} Saga Moments</div>`;
    sagaMoments.forEach(m => {
      html += `<div class="vs-sb-player">${_av(m.player, 24)}<span class="vs-sb-player-name">${m.player}</span>
        <span class="vs-sb-badge ${m.badgeCls}">${m.badge}</span></div>`;
    });
  }

  return html;
}

function _collectSagaMoments(data, phase, revealIdx, st) {
  const moments = [];
  const seen = new Set();
  const phases = phase === 'blueprint' ? [data.phase1] :
    phase === 'sail' ? [data.phase1, data.phase2] :
    phase === 'battle' ? [data.phase1, data.phase2, data.phase3] :
    [data.phase1, data.phase2, data.phase3];

  phases.forEach((p, pIdx) => {
    if (!p?.events) return;
    const isCurrentPhase = (phase === 'blueprint' && pIdx === 0) ||
      (phase === 'sail' && pIdx === 1) ||
      (phase === 'battle' && pIdx === 2);
    p.events.forEach((evt, eIdx) => {
      // Gate current-phase events by reveal index
      if (isCurrentPhase && eIdx > revealIdx) return;
      const player = evt.player || evt.attacker || (evt.players ? evt.players[0] : null);
      if (!player) return;
      let badge = null, badgeCls = 'vs-sb-badge-gold';
      if (evt.type === 'eureka') { badge = 'EUREKA'; }
      else if (evt.type === 'humanCannonball') { badge = 'CANNONBALL'; }
      else if (evt.type === 'heroicShield') { badge = 'SHIELD'; }
      else if (evt.type === 'boardingSuccess') { badge = 'RAIDER'; badgeCls = 'vs-sb-badge-blue'; }
      else if (evt.type === 'sabotage') { badge = 'SABOTEUR'; badgeCls = 'vs-sb-badge-red'; }
      else if (evt.type === 'iceBreakSuccess') { badge = 'ICE BREAK'; }
      else if (evt.type === 'battleCry') { badge = 'BATTLE CRY'; badgeCls = 'vs-sb-badge-blue'; }
      else if (evt.type === 'flagGrab') { badge = 'FLAG'; }
      else if (evt.type === 'mutinySuccess') { badge = 'MUTINY'; badgeCls = 'vs-sb-badge-red'; }
      if (badge && !seen.has(player + badge)) {
        seen.add(player + badge);
        moments.push({ player, badge, badgeCls });
      }
    });
  });
  return moments;
}

// ══════════════════════════════════════════════════════════════
// VP: TITLE CARD
// ══════════════════════════════════════════════════════════════

export function rpBuildVSTitleCard(ep) {
  const data = ep.vikingSour;
  if (!data) return '<div>No data</div>';

  window._vsEpRecord = ep;

  // Build player roster by tribe
  let rosterHTML = '';
  let playerIdx = 0;
  data.tribes.forEach((t, tIdx) => {
    if (tIdx > 0) {
      rosterHTML += `<div style="width:2px;height:48px;background:linear-gradient(180deg,transparent,var(--vs-rune),transparent);margin:0 8px;align-self:center;opacity:0;animation:vs-fade-up .4s ease-out ${3.2 + playerIdx * 0.08}s forwards;"></div>`;
    }
    t.members.forEach(n => {
      const teamCls = tIdx === 0 ? 'team-a' : 'team-b';
      const delay = 3.2 + playerIdx * 0.08;
      rosterHTML += `<div class="vs-title-player ${teamCls}" style="animation-delay:${delay}s">
        <div class="vs-title-player-avatar">
          <img src="assets/avatars/${slug(n)}.png" alt="${n}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="initials" style="display:none">${n.substring(0, 2).toUpperCase()}</span>
        </div>
        <div class="vs-title-player-name">${n}</div>
      </div>`;
      playerIdx++;
    });
  });

  // Tribe labels
  const t0 = data.tribes[0], t1 = data.tribes[1];
  const tribesRow = data.tribes.length >= 2 ? `
    <div class="vs-title-tribe-row">
      <span class="vs-title-tribe-label team-a">${t0.name}</span>
      <span class="vs-title-tribe-vs">vs</span>
      <span class="vs-title-tribe-label team-b">${t1.name}</span>
    </div>
  ` : '';

  // Longship SVG silhouettes
  const shipSVG = `<svg width="120" height="50" viewBox="0 0 120 50" fill="none">
    <path d="M10 35 Q20 45 60 45 Q100 45 110 35 L100 20 Q60 10 20 20 Z" fill="var(--vs-plank)" stroke="var(--vs-plank-lt)" stroke-width="1"/>
    <line x1="60" y1="5" x2="60" y2="40" stroke="var(--vs-plank-lt)" stroke-width="2"/>
    <path d="M62 8 Q80 15 62 25" fill="var(--vs-fjord)" opacity=".4"/>
  </svg>`;

  const tickerText = `◆ ${pick(CHATTER_P1)} ◆ ${pick(CHATTER_P1)} ◆ ${pick(CHATTER_P1)} ◆`;

  return `
<div class="vs-shell" data-phase="title">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap');
:root {
  --vs-tar:#1a1510;--vs-tar2:#241e16;--vs-plank:#3a2e1e;--vs-plank-lt:#584830;
  --vs-parchment:#d8ceb4;--vs-parch-dk:#b8a888;--vs-parch-lt:#e8e0cc;
  --vs-fjord:#3a5568;--vs-frost:#9ab8c8;--vs-ice:#c8dce8;--vs-storm:#2a3a48;
  --vs-sea-deep:#1a2830;--vs-sea-mid:#2a4050;--vs-wave:#4a7888;
  --vs-ember:#c45a20;--vs-flame:#e87830;--vs-gold:#c8a040;--vs-gold-lt:#e0c060;
  --vs-forge:#ff9040;
  --vs-blood:#8a2020;--vs-iron:#6a6a6a;--vs-steel:#8a8a88;
  --vs-rune:#a08048;--vs-rune-glow:rgba(192,160,64,.3);
  --vs-danger:#c83030;--vs-safe:#3a8850;--vs-warn:#c89830;
  --vs-glass:rgba(26,21,16,.7);--vs-glass2:rgba(26,21,16,.85);
}
.vs-shell{position:relative;max-width:1100px;margin:0 auto;font-family:'EB Garamond',Georgia,serif;color:var(--vs-parchment);z-index:2;}
/* Atmosphere */
.vs-atmo{position:fixed;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;}
.vs-atmo-sky{position:absolute;inset:0;background:linear-gradient(180deg,#1a2028 0%,#2a3540 20%,#3a4a58 45%,#4a5a68 60%,var(--vs-storm) 80%,var(--vs-sea-deep) 100%);}
.vs-aurora{position:absolute;top:3%;left:0;right:0;height:25%;opacity:.15;
  background:linear-gradient(90deg,transparent,rgba(80,180,120,.5) 25%,rgba(60,160,180,.4) 50%,rgba(100,200,140,.45) 75%,transparent);
  filter:blur(50px);animation:vs-aurora-shift 18s ease-in-out infinite alternate;}
@keyframes vs-aurora-shift{0%{transform:translateX(-8%) scaleY(1)}50%{transform:translateX(8%) scaleY(1.4)}100%{transform:translateX(-5%) scaleY(.7)}}
.vs-mtn{position:absolute;bottom:30%;}
.vs-mtn.m1{left:-8%;width:0;height:0;border-style:solid;border-width:0 280px 420px 240px;border-color:transparent transparent rgba(14,20,26,.9) transparent;}
.vs-mtn.m2{left:18%;width:0;height:0;border-style:solid;border-width:0 200px 350px 180px;border-color:transparent transparent rgba(18,24,30,.85) transparent;}
.vs-mtn.m3{left:40%;width:0;height:0;border-style:solid;border-width:0 300px 480px 260px;border-color:transparent transparent rgba(12,18,24,.92) transparent;}
.vs-mtn.m4{left:68%;width:0;height:0;border-style:solid;border-width:0 240px 380px 200px;border-color:transparent transparent rgba(16,22,28,.87) transparent;}
.vs-mtn.m5{left:85%;width:0;height:0;border-style:solid;border-width:0 180px 300px 160px;border-color:transparent transparent rgba(14,20,26,.85) transparent;}
.vs-cap{position:absolute;bottom:30%;}
.vs-cap.c1{left:calc(-8% + 150px);bottom:calc(30% + 310px);width:0;height:0;border-style:solid;border-width:0 110px 90px 80px;border-color:transparent transparent rgba(200,220,232,.06) transparent;}
.vs-cap.c3{left:calc(40% + 130px);bottom:calc(30% + 370px);width:0;height:0;border-style:solid;border-width:0 140px 100px 120px;border-color:transparent transparent rgba(200,220,232,.08) transparent;}
.vs-sea{position:absolute;bottom:0;left:0;right:0;height:30%;background:linear-gradient(0deg,var(--vs-sea-deep) 0%,var(--vs-sea-mid) 50%,rgba(42,58,72,.6) 100%);}
.vs-wave-line{position:absolute;left:0;right:0;height:2px;opacity:.08;background:var(--vs-frost);}
.vs-wave-line:nth-child(1){top:15%;animation:vs-wave 5s ease-in-out infinite;}
.vs-wave-line:nth-child(2){top:35%;animation:vs-wave 6s ease-in-out infinite .8s;}
.vs-wave-line:nth-child(3){top:55%;animation:vs-wave 4.5s ease-in-out infinite 1.5s;}
.vs-wave-line:nth-child(4){top:75%;animation:vs-wave 5.5s ease-in-out infinite 2s;}
@keyframes vs-wave{0%,100%{transform:translateX(-2%)}50%{transform:translateX(2%)}}
/* Snowfall */
.vs-snow-wrap{position:fixed;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;overflow:hidden;}
.vs-sf{position:absolute;background:rgba(200,220,232,.5);border-radius:50%;animation:vs-fall linear infinite;}
@keyframes vs-fall{0%{transform:translateY(-10px) translateX(0);opacity:0}5%{opacity:.35}50%{transform:translateY(50vh) translateX(20px)}100%{transform:translateY(105vh) translateX(8px);opacity:0}}
@media(prefers-reduced-motion:reduce){.vs-sf,.vs-aurora,.vs-wave-line{animation:none !important;}}
/* Broadcast chrome */
.vs-broadcast{position:relative;z-index:3;height:38px;
  background:linear-gradient(90deg,var(--vs-tar2),var(--vs-plank),var(--vs-tar2));
  border-bottom:2px solid var(--vs-gold);display:flex;align-items:center;justify-content:space-between;padding:0 16px;}
.vs-live{display:flex;align-items:center;gap:6px;font-family:'Cinzel',serif;font-size:10px;
  color:var(--vs-ember);text-transform:uppercase;letter-spacing:3px;font-weight:700;}
.vs-live-dot{width:8px;height:8px;background:var(--vs-ember);border-radius:50%;animation:vs-pulse 1.2s ease-in-out infinite;}
@keyframes vs-pulse{0%,100%{opacity:1;box-shadow:0 0 4px var(--vs-ember)}50%{opacity:.3;box-shadow:none}}
.vs-ticker{flex:1;overflow:hidden;margin:0 24px;height:18px;position:relative;}
.vs-ticker-inner{position:absolute;white-space:nowrap;animation:vs-scroll 35s linear infinite;
  font-family:'EB Garamond',serif;font-size:12px;font-style:italic;color:var(--vs-parch-dk);letter-spacing:1px;}
@keyframes vs-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.vs-saga-mark{font-family:'Cinzel Decorative',serif;color:var(--vs-gold);font-size:12px;letter-spacing:3px;}
@media(prefers-reduced-motion:reduce){.vs-live-dot,.vs-ticker-inner{animation:none !important;}}
/* Entrance keyframes */
@keyframes vs-fade-up{0%{opacity:0;transform:translateY(30px)}100%{opacity:1;transform:translateY(0)}}
@keyframes vs-fade-down{0%{opacity:0;transform:translateY(-20px)}100%{opacity:1;transform:translateY(0)}}
@keyframes vs-title-slam{0%{transform:scale(1.6) translateY(-20px);filter:blur(8px)}40%{transform:scale(1.02) translateY(2px);filter:blur(0)}60%{transform:scale(.98) translateY(-1px)}100%{transform:scale(1) translateY(0)}}
@keyframes vs-title-reveal{0%{opacity:0}100%{opacity:1}}
@keyframes vs-rune-glow{0%{opacity:0;transform:scale(.3) rotate(-20deg);text-shadow:none}60%{opacity:.6;transform:scale(1.15) rotate(5deg);text-shadow:0 0 20px var(--vs-rune-glow)}100%{opacity:.4;transform:scale(1) rotate(0deg);text-shadow:0 0 8px var(--vs-rune-glow)}}
@keyframes vs-line-grow{0%{transform:scaleX(0);opacity:0}100%{transform:scaleX(1);opacity:1}}
@keyframes vs-pip-slide{0%{opacity:0;transform:translateY(16px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes vs-tribe-pop{0%{opacity:0;transform:scale(.7)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
@keyframes vs-player-pop{0%{opacity:0;transform:translateY(20px) scale(.6)}70%{transform:translateY(-3px) scale(1.05)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes vs-ship-drift-l{0%{opacity:0;transform:translateX(-80px)}100%{opacity:.12;transform:translateX(0)}}
@keyframes vs-ship-drift-r{0%{opacity:0;transform:translateX(80px) scaleX(-1)}100%{opacity:.12;transform:translateX(0) scaleX(-1)}}
@keyframes vs-title-glow{0%,100%{text-shadow:0 4px 12px rgba(0,0,0,.7),0 0 40px var(--vs-rune-glow),0 0 80px rgba(200,160,64,.08)}50%{text-shadow:0 4px 16px rgba(0,0,0,.7),0 0 60px var(--vs-rune-glow),0 0 120px rgba(200,160,64,.15)}}
/* Title screen */
.vs-title-screen{position:relative;min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;z-index:2;}
.vs-title-screen .vs-title-series{font-family:'Cinzel',serif;font-size:clamp(11px,1.5vw,14px);color:var(--vs-frost);letter-spacing:8px;text-transform:uppercase;
  opacity:0;animation:vs-fade-down .8s ease-out .3s forwards;}
.vs-title-screen .vs-title-main{font-family:'Cinzel Decorative',serif;font-weight:900;font-size:clamp(48px,8vw,80px);color:var(--vs-gold);letter-spacing:clamp(4px,1vw,12px);text-transform:uppercase;line-height:1;margin:8px 0;
  text-shadow:0 4px 12px rgba(0,0,0,.7),0 0 40px var(--vs-rune-glow),0 0 80px rgba(200,160,64,.08);
  opacity:0;animation:vs-title-reveal .4s ease-out .6s forwards, vs-title-slam 1s cubic-bezier(.16,1,.3,1) .6s both, vs-title-glow 4s ease-in-out 2s infinite;}
.vs-title-screen .vs-title-tagline{font-family:'EB Garamond',serif;font-style:italic;font-size:clamp(14px,2vw,20px);color:var(--vs-parch-dk);letter-spacing:2px;margin-top:4px;
  opacity:0;animation:vs-fade-up .7s ease-out 1.2s forwards;}
.vs-title-runes{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0;}
.vs-title-rune{font-family:'Cinzel Decorative',serif;font-size:24px;color:var(--vs-rune);opacity:0;}
.vs-title-rune:nth-child(2){animation:vs-rune-glow .6s ease-out 1.5s forwards;}
.vs-title-rune:nth-child(3){animation:vs-rune-glow .6s ease-out 1.7s forwards;}
.vs-title-rune:nth-child(4){animation:vs-rune-glow .6s ease-out 1.9s forwards;}
.vs-title-rune-line{width:clamp(40px,8vw,100px);height:1px;background:linear-gradient(90deg,transparent,var(--vs-rune),transparent);
  opacity:0;transform-origin:center;animation:vs-line-grow .5s ease-out 1.4s forwards;}
.vs-title-phases{display:flex;gap:0;margin-top:28px;}
.vs-title-phase-pip{padding:8px 20px;font-family:'Cinzel',serif;font-size:clamp(8px,1vw,11px);letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(160,128,72,.2);color:var(--vs-parch-dk);background:rgba(26,21,16,.5);
  opacity:0;}
.vs-title-phase-pip:nth-child(1){animation:vs-pip-slide .5s ease-out 2.1s forwards;}
.vs-title-phase-pip:nth-child(2){animation:vs-pip-slide .5s ease-out 2.3s forwards;}
.vs-title-phase-pip:nth-child(3){animation:vs-pip-slide .5s ease-out 2.5s forwards;}
.vs-title-phase-pip:first-child{border-radius:4px 0 0 4px;}
.vs-title-phase-pip:last-child{border-radius:0 4px 4px 0;}
.vs-title-phase-pip .pip-num{font-family:'Cinzel Decorative',serif;color:var(--vs-gold);margin-right:6px;font-size:13px;}
.vs-title-phase-pip.active{background:rgba(200,160,64,.1);border-color:var(--vs-gold);color:var(--vs-gold);}
.vs-title-tribe-row{display:flex;align-items:center;gap:8px;margin-top:24px;opacity:0;animation:vs-fade-up .6s ease-out 2.7s forwards;}
.vs-title-tribe-label{font-family:'Cinzel',serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:4px 12px;border-radius:3px;}
.vs-title-tribe-label.team-a{color:var(--vs-ember);border:1px solid rgba(196,90,32,.3);background:rgba(196,90,32,.08);
  animation:vs-tribe-pop .5s ease-out 2.9s both;}
.vs-title-tribe-label.team-b{color:var(--vs-frost);border:1px solid rgba(58,85,104,.3);background:rgba(58,85,104,.08);
  animation:vs-tribe-pop .5s ease-out 3.1s both;}
.vs-title-tribe-vs{font-family:'Cinzel Decorative',serif;font-size:14px;color:var(--vs-gold);opacity:0;animation:vs-rune-glow .5s ease-out 3.0s forwards;}
.vs-title-roster{display:flex;gap:8px;margin-top:32px;flex-wrap:wrap;justify-content:center;}
.vs-title-player{display:flex;flex-direction:column;align-items:center;gap:4px;transition:transform .3s;
  opacity:0;animation:vs-player-pop .4s ease-out both;}
.vs-title-player:hover{transform:translateY(-4px);}
.vs-title-player-avatar{width:40px;height:40px;border-radius:50%;border:2px solid var(--vs-rune);overflow:hidden;background:var(--vs-plank);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.5);}
.vs-title-player-avatar img{width:100%;height:100%;object-fit:cover;}
.vs-title-player-avatar .initials{font-family:'Cinzel',serif;font-size:12px;font-weight:700;color:var(--vs-gold);}
.vs-title-player-name{font-family:'Cinzel',serif;font-size:8px;letter-spacing:1px;color:var(--vs-parch-dk);text-transform:uppercase;}
.vs-title-player.team-a .vs-title-player-avatar{border-color:var(--vs-ember);}
.vs-title-player.team-b .vs-title-player-avatar{border-color:var(--vs-frost);}
.vs-title-ship{position:absolute;z-index:3;opacity:0;}
.vs-title-ship.left{bottom:22%;left:10%;animation:vs-ship-drift-l 1.5s ease-out 1s forwards;}
.vs-title-ship.right{bottom:20%;right:12%;animation:vs-ship-drift-r 1.5s ease-out 1.2s forwards;}
@media(prefers-reduced-motion:reduce){
  .vs-title-screen .vs-title-series,.vs-title-screen .vs-title-main,.vs-title-screen .vs-title-tagline,
  .vs-title-rune,.vs-title-rune-line,.vs-title-phase-pip,.vs-title-tribe-row,.vs-title-tribe-label,
  .vs-title-tribe-vs,.vs-title-player,.vs-title-ship{opacity:1 !important;animation:none !important;transform:none !important;}
  .vs-title-ship.right{transform:scaleX(-1) !important;}
}
</style>

<div class="vs-atmo">
  <div class="vs-atmo-sky"></div>
  <div class="vs-aurora"></div>
  <div class="vs-mtn m1"></div><div class="vs-mtn m2"></div><div class="vs-mtn m3"></div><div class="vs-mtn m4"></div><div class="vs-mtn m5"></div>
  <div class="vs-cap c1"></div><div class="vs-cap c3"></div>
  <div class="vs-sea">
    <div class="vs-wave-line"></div><div class="vs-wave-line"></div>
    <div class="vs-wave-line"></div><div class="vs-wave-line"></div>
  </div>
</div>
<div class="vs-snow-wrap">${_genSnowflakes(50)}</div>

<div class="vs-broadcast">
  <div class="vs-live"><div class="vs-live-dot"></div> SAGA LIVE</div>
  <div class="vs-ticker"><div class="vs-ticker-inner">${tickerText}</div></div>
  <div class="vs-saga-mark">VIKING SOUR</div>
</div>

<!-- Longship silhouettes on the fjord -->
<div class="vs-title-ship left">${shipSVG}</div>
<div class="vs-title-ship right">${shipSVG}</div>

<div class="vs-title-screen">
  <div class="vs-title-series">World Tour Challenge</div>
  <div class="vs-title-main">Viking Sour</div>
  <div class="vs-title-tagline">Build the unknown. Sail the frozen. Sink or be sunk.</div>

  <div class="vs-title-runes">
    <div class="vs-title-rune-line"></div>
    <div class="vs-title-rune">ᚱ</div>
    <div class="vs-title-rune">ᚦ</div>
    <div class="vs-title-rune">ᛟ</div>
    <div class="vs-title-rune-line"></div>
  </div>

  <div class="vs-title-phases">
    <div class="vs-title-phase-pip active"><span class="pip-num">I</span> Build</div>
    <div class="vs-title-phase-pip"><span class="pip-num">II</span> Sail</div>
    <div class="vs-title-phase-pip"><span class="pip-num">III</span> Battle</div>
  </div>

  ${tribesRow}

  <div class="vs-title-roster">
    ${rosterHTML}
  </div>
</div>

</div>`;
}

// ══════════════════════════════════════════════════════════════
// VP: PHASE 1 — BLUEPRINT ASSEMBLY
// ══════════════════════════════════════════════════════════════

export function rpBuildVSPhase1(ep) {
  const data = ep.vikingSour;
  if (!data) return '<div>No data</div>';

  window._vsEpRecord = ep;
  const stKey = 'vs-phase1';
  const events = data.phase1.events;
  const steps = [];
  const stepMeta = [];

  // Title banner
  steps.push(`
    <div class="vs-title-banner">
      <div class="vs-title-sub">World Tour Challenge</div>
      <div class="vs-title-main">Viking Sour</div>
      <div class="vs-knot"></div>
      <div class="vs-title-phase">${_icoScroll()} &ensp;Phase I — Blueprint Assembly</div>
      <div class="vs-title-desc">Shredded blueprints. Wooden pieces. Allen keys. Sledgehammers. Figure out what you're building — then build it before the other tribe does.</div>
    </div>
  `);
  stepMeta.push({ type: 'header' });

  // Blueprint clarity tracker — starts zeroed, updates live via DOM on reveal
  const fragLabels = ['HULL', 'KEEL', 'MAST', 'STERN', 'RUDDER', 'BOW', 'SAIL', 'CANNON'];
  steps.push(`
    <div class="vs-blueprint">
      <div class="vs-blueprint-title">${_icoScroll()} Blueprint Fragments</div>
      <div id="vs-frag-chips" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;">
        ${fragLabels.map((lbl, fi) => {
          const rot = ((fi * 7 + 3) % 7 - 3);
          return `<span class="vs-frag" id="vs-frag-${fi}" style="--rot:${rot}deg" data-label="${lbl}-${String.fromCharCode(65 + fi % 6)}${fi + 1}">???-${String.fromCharCode(65 + fi % 6)}${fi + 1}</span>`;
        }).join('')}
      </div>
      <div style="font-family:'Fira Code',monospace;font-size:9px;color:var(--vs-parch-dk);margin-bottom:4px;">TRIBE CLARITY</div>
      ${data.tribes.map(t => {
        return `<div class="vs-assembly-row" style="margin:4px 0">
          <div class="vs-assembly-tribe"><span class="vs-sb-tribe-dot" style="background:${t.color}"></span> ${t.name}</div>
          <div class="vs-assembly-bar"><div id="vs-clarity-fill-${t.name}" class="vs-assembly-fill" style="width:0%;background:linear-gradient(90deg,var(--vs-rune),var(--vs-gold))"></div></div>
          <div class="vs-assembly-pct" id="vs-clarity-pct-${t.name}">0%</div>
        </div>`;
      }).join('')}
    </div>
  `);
  stepMeta.push({ type: 'blueprint' });

  // Construction yard is injected outside steps for sticky positioning

  // Interleave chatter and events
  let chatterIdx = 0;

  events.forEach((evt, i) => {
    if (i > 0 && i % 3 === 0 && chatterIdx < CHATTER_P1.length) {
      steps.push(`<div class="vs-comm">${CHATTER_P1[chatterIdx++]}</div>`);
      stepMeta.push({ type: 'chatter' });
    }

    const cardType = evt.type === 'eureka' ? 'eureka' :
      ['argument', 'flirt', 'leaderClash', 'creditSteal', 'allianceWhisper'].includes(evt.type) ? 'social' :
      ['sabotage', 'sabotageCaught'].includes(evt.type) ? 'chaos' : 'build';

    const player = evt.player || (evt.players ? evt.players[0] : null) || (evt.thief || evt.winner);
    const player2 = evt.players && evt.players[1] ? evt.players[1] : null;
    const tag = evt.badge || evt.type.toUpperCase();
    const tribeCol = data.tribes.find(t => t.name === evt.tribe)?.color || '#888';
    const tribeDot = evt.tribe ? `<span class="vs-sb-tribe-dot" style="background:${tribeCol};width:10px;height:10px;flex-shrink:0"></span><span class="vs-card-tribe" style="color:${tribeCol}">${evt.tribe}</span>` : '';

    let foot = '';
    if (evt.score) foot += `${evt.score > 0 ? '+' : ''}${evt.score} pts`;
    if (evt.damage) foot += `${foot ? ' • ' : ''}-${evt.damage} HP`;

    steps.push(`<div class="vs-card ${cardType}" style="border-left-color:${tribeCol}">
      <div class="vs-card-head">
        ${tribeDot}
        ${player ? _av(player) : ''}
        ${player ? `<span class="vs-card-who">${player}</span>` : ''}
        ${player2 ? `${_icoSkull()} ${_av(player2)} <span class="vs-card-who">${player2}</span>` : ''}
        <span class="vs-card-tag ${_tagCls(evt.type)}">${_eventIcon(evt.type)} ${tag}</span>
      </div>
      <div class="vs-card-body">${evt.text}</div>
      ${foot ? `<div class="vs-card-foot">${foot}</div>` : ''}
    </div>`);
    stepMeta.push({ type: evt.type, tribe: evt.tribe, score: evt.score || 0 });
  });

  // Assembly complete announcement
  const flintTribe = data.tribes.find(t => t.isFlintWinner);
  steps.push(`<div class="vs-knot"></div>
    <div class="vs-card heroic vs-visible" style="text-align:center;border:2px solid var(--vs-gold)">
      <div style="font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--vs-gold);letter-spacing:3px;margin-bottom:6px;">ASSEMBLY COMPLETE</div>
      ${data.tribes.map(t =>
        `<div style="font-family:'Cinzel',serif;font-size:13px;color:var(--vs-parchment);margin:4px 0;">
          <span class="vs-sb-tribe-dot" style="background:${t.color}"></span> ${t.name}: Quality ${Math.round(t.buildQuality)} → ${t.boatHP} HP
          ${t.isFlintWinner ? `<div style="font-family:'EB Garamond',serif;font-style:italic;color:var(--vs-parch-dk);margin-top:4px;">Advantage earned: <span style="color:var(--vs-ember)">FLINT ROCKS</span> — fire cannons from round 1 + 3 bonus ammo</div>` : ''}
        </div>`
      ).join('')}
    </div>
  `);
  stepMeta.push({ type: 'summary' });

  window._vsPhase1StepMeta = stepMeta;

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('vs-', '');

  const stepsHTML = steps.map((html, i) =>
    `<div id="vs-step-${suffix}-${i}" class="${i <= 1 ? 'vs-visible' : 'vs-card vs-hidden'}">${html}</div>`
  ).join('');

  // Pre-show title banner and blueprint tracker
  if (st.idx < 1) st.idx = 1;

  const yardHTML = _buildConstructionYard(data);

  const content = `
    ${yardHTML}
    ${stepsHTML}
    <div id="vs-controls-${suffix}" class="vs-controls">
      <button class="vs-btn" onclick="vikingSourRevealNext('${stKey}',${steps.length})">Reveal Next</button>
      <span id="vs-counter-${suffix}" class="vs-counter">2 / ${steps.length}</span>
      <button class="vs-btn" onclick="vikingSourRevealAll('${stKey}',${steps.length})">Reveal All</button>
    </div>
  `;

  return _shell(content, ep, 'blueprint', stKey);
}

// ══════════════════════════════════════════════════════════════
// VP: PHASE 2 — LAUNCH & SAIL
// ══════════════════════════════════════════════════════════════

export function rpBuildVSPhase2(ep) {
  const data = ep.vikingSour;
  if (!data) return '<div>No data</div>';

  window._vsEpRecord = ep;
  const stKey = 'vs-phase2';
  const events = data.phase2.events;
  const steps = [];
  const stepMeta = [];

  // Title banner
  steps.push(`
    <div class="vs-title-banner">
      <div class="vs-title-sub">World Tour Challenge</div>
      <div class="vs-title-main">Viking Sour</div>
      <div class="vs-knot"></div>
      <div class="vs-title-phase">${_icoShip()} &ensp;Phase II — Launch &amp; Sail</div>
      <div class="vs-title-desc">Push your longship across the ice, break through to open water, and sail north through the frozen straits. Build quality determines how well your ship holds together.</div>
    </div>
  `);
  stepMeta.push({ type: 'header' });

  let chatterIdx = 0;

  events.forEach((evt, i) => {
    if (i > 0 && i % 3 === 0 && chatterIdx < CHATTER_P2.length) {
      steps.push(`<div class="vs-comm">${CHATTER_P2[chatterIdx++]}</div>`);
      stepMeta.push({ type: 'chatter' });
    }

    const cardType = ['launch', 'launchStall', 'iceBreakSuccess', 'iceBreakFail', 'sail', 'wind', 'whale', 'captainEncourage'].includes(evt.type) ? 'sail' :
      ['allianceWhisper', 'rivalryRow'].includes(evt.type) ? 'social' :
      ['seasick', 'iceCollision', 'current'].includes(evt.type) ? 'chaos' :
      evt.type === 'iceBreakSuccess' ? 'heroic' : 'sail';

    const player = evt.player || (evt.players ? evt.players[0] : null) || evt.captain;
    const player2 = evt.players && evt.players[1] ? evt.players[1] : null;
    const tag = evt.badge || evt.type.toUpperCase();
    const tribeCol2 = data.tribes.find(t => t.name === evt.tribe)?.color || '#888';
    const tribeDot2 = evt.tribe ? `<span class="vs-sb-tribe-dot" style="background:${tribeCol2};width:10px;height:10px;flex-shrink:0"></span><span class="vs-card-tribe" style="color:${tribeCol2}">${evt.tribe}</span>` : '';

    let foot = '';
    if (evt.score) foot += `${evt.score > 0 ? '+' : ''}${evt.score} pts`;
    if (evt.damage) foot += `${foot ? ' • ' : ''}-${evt.damage} HP`;

    steps.push(`<div class="vs-card ${cardType}" style="border-left-color:${tribeCol2}">
      <div class="vs-card-head">
        ${tribeDot2}
        ${player ? _av(player) : ''}
        <span class="vs-card-who">${player || evt.tribe || ''}</span>
        ${player2 ? `${_icoAnchor()} ${_av(player2)} <span class="vs-card-who">${player2}</span>` : ''}
        <span class="vs-card-tag ${_tagCls(evt.type)}">${_eventIcon(evt.type)} ${tag}</span>
      </div>
      <div class="vs-card-body">${evt.text}</div>
      ${foot ? `<div class="vs-card-foot">${foot}</div>` : ''}
    </div>`);
    stepMeta.push({ type: evt.type, tribe: evt.tribe, score: evt.score || 0 });
  });

  // Arrival order summary
  steps.push(`<div class="vs-knot"></div>
    <div class="vs-card heroic vs-visible" style="text-align:center;border:2px solid var(--vs-gold)">
      <div style="font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--vs-gold);letter-spacing:3px;margin-bottom:6px;">ARRIVAL ORDER</div>
      ${data.phase2.arrivalOrder.map((name, i) => {
        const tribe = data.tribes.find(t => t.name === name);
        return `<div style="font-family:'Cinzel',serif;font-size:13px;margin:4px 0;">
          <span style="color:${tribe?.color || '#888'};font-weight:700;">${i + 1}. ${name}</span>
        </div>`;
      }).join('')}
      <div style="font-family:'EB Garamond',serif;font-style:italic;color:var(--vs-parch-dk);margin-top:8px;">First arrival picks battle position (+20 flag advantage)</div>
    </div>
  `);
  stepMeta.push({ type: 'summary' });

  window._vsPhase2StepMeta = stepMeta;
  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('vs-', '');

  const stepsHTML = steps.map((html, i) =>
    `<div id="vs-step-${suffix}-${i}" class="${i === 0 ? 'vs-visible' : 'vs-card vs-hidden'}">${html}</div>`
  ).join('');

  if (st.idx < 0) st.idx = 0;

  const content = `
    ${stepsHTML}
    <div id="vs-controls-${suffix}" class="vs-controls">
      <button class="vs-btn" onclick="vikingSourRevealNext('${stKey}',${steps.length})">Reveal Next</button>
      <span id="vs-counter-${suffix}" class="vs-counter">1 / ${steps.length}</span>
      <button class="vs-btn" onclick="vikingSourRevealAll('${stKey}',${steps.length})">Reveal All</button>
    </div>
  `;

  return _shell(content, ep, 'sail', stKey);
}

// ══════════════════════════════════════════════════════════════
// VP: PHASE 3 — NAVAL BATTLE
// ══════════════════════════════════════════════════════════════

export function rpBuildVSPhase3(ep) {
  const data = ep.vikingSour;
  if (!data) return '<div>No data</div>';

  window._vsEpRecord = ep;
  const stKey = 'vs-phase3';
  const events = data.phase3.events;
  const steps = [];
  const stepMeta = [];

  // Build map snapshots for progressive reveal
  const mapSnapshots = [];
  const currentState = {};
  data.tribes.forEach(t => {
    currentState[t.name] = {
      hp: data.phase2.boatHP[t.name] || t.boatHP,
      ammo: t.ammo,
      flagDist: t.isFlintWinner ? 80 : 100
    };
  });
  mapSnapshots.push(JSON.parse(JSON.stringify(currentState)));

  // Title banner (battle-themed with ember border) — always visible, not a step
  const titleBanner = `
    <div class="vs-title-banner" style="border-bottom-color:var(--vs-ember);">
      <div class="vs-title-sub">World Tour Challenge</div>
      <div class="vs-title-main">Viking Sour</div>
      <div class="vs-knot"></div>
      <div class="vs-title-phase">${_icoCannon()} &ensp;Phase III — Viking Naval Battle</div>
      <div class="vs-title-desc">${data.tribes.find(t => t.isFlintWinner) ?
        `Capture the flag or sink the enemy. ${data.tribes.find(t => t.isFlintWinner).name} has flint — their cannons are hot from round one. The other tribe must improvise fire or race for the flag.` :
        'Capture the flag or sink the enemy. Load your cannons, aim true, and pray the hull holds.'}</div>
    </div>
  `;

  // Sea map — sticky, always visible, NOT a step
  const mapHTML = _buildSeaMap(data);

  let chatterIdx = 0;
  let snapCount = 0;

  events.forEach((evt, i) => {
    if (i > 0 && i % 3 === 0 && chatterIdx < CHATTER_P3.length) {
      steps.push(`<div class="vs-comm vs-comm-host">${CHATTER_P3[chatterIdx++]}</div>`);
      stepMeta.push({ type: 'chatter', snapIdx: snapCount });
    }

    // Update state for map snapshots
    if (evt.damage && evt.target) {
      if (currentState[evt.target]) currentState[evt.target].hp = Math.max(0, currentState[evt.target].hp - evt.damage);
    }
    if (evt.type === 'repair' && evt.tribe && evt.hp) {
      if (currentState[evt.tribe]) currentState[evt.tribe].hp = Math.min(250, currentState[evt.tribe].hp + evt.hp);
    }
    if (evt.type === 'patchGenius' && evt.tribe && evt.hp) {
      if (currentState[evt.tribe]) currentState[evt.tribe].hp = Math.min(250, currentState[evt.tribe].hp + evt.hp);
    }
    if (evt.type === 'heroicShield' && evt.tribe) {
      if (currentState[evt.tribe]) currentState[evt.tribe].hp = Math.min(250, currentState[evt.tribe].hp + 25);
    }
    if (evt.type === 'ramHit' && evt.target) {
      if (currentState[evt.target]) currentState[evt.target].hp = Math.max(0, currentState[evt.target].hp - (evt.damage || 30));
      if (evt.attacker && currentState[evt.attacker]) currentState[evt.attacker].hp = Math.max(0, currentState[evt.attacker].hp - (evt.selfDamage || 12));
    }
    if (evt.type === 'friendlyFire' && evt.tribe) {
      if (currentState[evt.tribe]) currentState[evt.tribe].hp = Math.max(0, currentState[evt.tribe].hp - (evt.damage || 12));
    }
    if (evt.type === 'squall') {
      data.tribes.forEach(t => { if (currentState[t.name]) currentState[t.name].hp = Math.max(0, currentState[t.name].hp - 8); });
    }
    if (evt.type === 'boardingSuccess' && evt.tribe && evt.target) {
      const stolen = evt.stolen || 2;
      if (currentState[evt.target]) currentState[evt.target].ammo = Math.max(0, currentState[evt.target].ammo - stolen);
      if (currentState[evt.tribe]) currentState[evt.tribe].ammo += stolen;
    }
    if (evt.type === 'sailProgress' && evt.tribe) {
      if (currentState[evt.tribe]) currentState[evt.tribe].flagDist = Math.max(0, currentState[evt.tribe].flagDist - 3);
    }
    if (evt.type === 'flagGrab' && evt.tribe) {
      if (currentState[evt.tribe]) currentState[evt.tribe].flagDist = 0;
    }
    if (evt.type === 'flagInterference' && evt.target) {
      if (currentState[evt.target]) currentState[evt.target].flagDist = Math.min(100, currentState[evt.target].flagDist + 15);
    }
    if ((evt.type === 'cannonHit' || evt.type === 'flamingAmmo') && evt.tribe) {
      if (currentState[evt.tribe]) currentState[evt.tribe].ammo = Math.max(0, (currentState[evt.tribe].ammo || 0) - (evt.type === 'flamingAmmo' ? 2 : 1));
    }

    snapCount++;
    mapSnapshots.push(JSON.parse(JSON.stringify(currentState)));

    const cardType = ['cannonHit', 'cannonMiss', 'cannonUnlock', 'cannonUnlockFail', 'flamingAmmo', 'humanCannonball', 'cannonSabotage'].includes(evt.type) ? 'cannon' :
      ['sailProgress', 'flagGrab', 'flagFail', 'flagInterference', 'battleCry'].includes(evt.type) ? 'sail' :
      ['heroicShield'].includes(evt.type) ? 'heroic' :
      ['repair', 'patchGenius'].includes(evt.type) ? 'build' :
      ['sink', 'friendlyFire', 'coward', 'squall', 'ramMiss', 'mutinyFail', 'mutinySuccess', 'boardingFail', 'timeout'].includes(evt.type) ? 'chaos' :
      ['ramHit', 'boardingSuccess'].includes(evt.type) ? 'cannon' : 'sail';

    const player = evt.player || evt.attacker;
    const tag = evt.badge || evt.type.toUpperCase();
    const tribeCol3 = data.tribes.find(t => t.name === evt.tribe)?.color || '#888';
    const tribeDot3 = evt.tribe ? `<span class="vs-sb-tribe-dot" style="background:${tribeCol3};width:10px;height:10px;flex-shrink:0"></span><span class="vs-card-tribe" style="color:${tribeCol3}">${evt.tribe}</span>` : '';

    const hitTag = ['cannonHit', 'ramHit', 'boardingSuccess', 'flamingAmmo', 'humanCannonball'].includes(evt.type) ?
      '<span class="vs-card-tag tag-hit">HIT</span>' :
      ['cannonMiss', 'ramMiss', 'boardingFail', 'flagFail', 'cannonUnlockFail'].includes(evt.type) ?
      '<span class="vs-card-tag tag-miss">MISS</span>' : '';

    let foot = '';
    if (evt.damage && evt.target) foot += `-${evt.damage} HP to ${evt.target}`;
    if (evt.score) foot += `${foot ? ' • ' : ''}${evt.score > 0 ? '+' : ''}${evt.score} pts`;
    if (evt.round !== undefined) foot += `${foot ? ' • ' : ''}Round ${evt.round + 1}`;

    steps.push(`<div class="vs-card ${cardType}" style="border-left-color:${tribeCol3}">
      <div class="vs-card-head">
        ${tribeDot3}
        ${player ? _av(player) : ''}
        <span class="vs-card-who">${player || evt.tribe || ''}</span>
        <span class="vs-card-tag ${_tagCls(evt.type)}">${_eventIcon(evt.type)} ${tag}</span>
        ${hitTag}
      </div>
      <div class="vs-card-body">${evt.text}</div>
      ${foot ? `<div class="vs-card-foot">${foot}</div>` : ''}
    </div>`);
    stepMeta.push({ type: evt.type, tribe: evt.tribe || evt.attacker, target: evt.target, score: evt.score || 0, round: evt.round, snapIdx: snapCount });
  });

  // Battle result announcement
  const winTribe = data.tribes.find(t => t.name === data.phase3.winner);
  const loseTribe = data.tribes.find(t => t.name !== data.phase3.winner);
  const endReason = data.phase3.endReason;
  const victoryTitle = endReason === 'flag' ? 'Victory by Flag Capture' :
    endReason === 'sink' ? 'Victory by Sinking' : 'Victory by Distance';
  const victoryMethod = endReason === 'flag' ? `${winTribe?.name || '???'} captured the enemy flag.` :
    endReason === 'sink' ? `${winTribe?.name || '???'} sank ${loseTribe?.name || 'the enemy'}\'s longship. The frozen sea claims another vessel.` :
    `Time expired. ${winTribe?.name || '???'} was closest to the flag.`;

  steps.push(`<div class="vs-battle-result">
    <div class="vs-battle-result-title">${_icoTrophy()} &ensp;${victoryTitle}</div>
    <div class="vs-battle-result-method">${victoryMethod}</div>
    <div style="margin-top:12px;">
      <span class="vs-sb-tribe-dot" style="background:${winTribe?.color || '#888'}"></span>
      <span style="font-family:'Cinzel',serif;font-size:14px;color:var(--vs-gold);letter-spacing:2px;">
        ${(winTribe?.name || '???').toUpperCase()} WINS TRIBAL IMMUNITY</span>
    </div>
    <div style="margin-top:6px;font-family:'EB Garamond',serif;font-style:italic;color:var(--vs-parch-dk);">
      ${loseTribe?.name || 'The losing tribe'} goes to tribal council.</div>
  </div>`);
  stepMeta.push({ type: 'result', snapIdx: snapCount });

  window._vsMapSnapshots = mapSnapshots;
  window._vsPhase3StepMeta = stepMeta;

  const st = _ensureState(stKey, steps.length);
  const suffix = stKey.replace('vs-', '');

  const stepsHTML = steps.map((html, i) =>
    `<div id="vs-step-${suffix}-${i}" class="vs-card vs-hidden">${html}</div>`
  ).join('');

  if (st.idx < 0) st.idx = -1;

  const content = `
    ${titleBanner}
    ${mapHTML}
    ${stepsHTML}
    <div id="vs-controls-${suffix}" class="vs-controls">
      <button class="vs-btn" onclick="vikingSourRevealNext('${stKey}',${steps.length})">Reveal Next</button>
      <span id="vs-counter-${suffix}" class="vs-counter">0 / ${steps.length}</span>
      <button class="vs-btn" onclick="vikingSourRevealAll('${stKey}',${steps.length})">Reveal All</button>
    </div>
  `;

  return _shell(content, ep, 'battle', stKey);
}

function _buildMapShipSVG(color, idx) {
  const hull = color;
  return `<svg class="vs-sea-ship-svg" viewBox="0 0 60 30" fill="none">
    <path d="M5 18 Q8 26 30 26 Q52 26 55 18 L50 14 Q30 11 10 14 Z" fill="${hull}" opacity=".8" stroke="${hull}" stroke-width=".5"/>
    <path d="M20 26 L30 29 L40 26" fill="none" stroke="${hull}" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>
    <line x1="30" y1="5" x2="30" y2="20" stroke="var(--vs-plank-lt)" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M31 7 Q42 12 42 17 L31 19 Z" fill="var(--vs-parchment)" opacity=".2" stroke="var(--vs-parch-dk)" stroke-width=".3"/>
    <path d="M5 18 Q3 14 4 8 Q5 5 7 7 L9 14 Z" fill="${hull}" opacity=".7"/>
    <path d="M55 18 Q57 14 56 9 Q55 6 53 8 L51 14 Z" fill="${hull}" opacity=".7"/>
    <rect x="18" y="15" width="6" height="3" rx="1" fill="var(--vs-iron)" opacity=".8"/>
    <rect x="36" y="15" width="6" height="3" rx="1" fill="var(--vs-iron)" opacity=".8"/>
    ${[14,22,30,38,44].map((x,i) => `<rect x="${x}" y="12" width="3" height="5" rx="1.5" fill="${i%2===0?hull:'var(--vs-gold)'}" opacity=".4"/>`).join('')}
  </svg>`;
}

function _buildFireSVG() {
  return `<svg width="20" height="16" viewBox="0 0 20 16" fill="none" style="display:block;">
    <path d="M10 0 Q14 4 14 8 Q14 14 10 16 Q6 14 6 8 Q6 4 10 0Z" fill="var(--vs-ember)" opacity=".7">
      <animate attributeName="d" dur="0.6s" repeatCount="indefinite" values="M10 0 Q14 4 14 8 Q14 14 10 16 Q6 14 6 8 Q6 4 10 0Z;M10 1 Q15 5 13 9 Q13 14 10 15 Q7 14 7 9 Q5 5 10 1Z;M10 0 Q14 4 14 8 Q14 14 10 16 Q6 14 6 8 Q6 4 10 0Z"/>
    </path>
    <path d="M10 4 Q12 6 12 9 Q12 13 10 14 Q8 13 8 9 Q8 6 10 4Z" fill="var(--vs-flame)" opacity=".8"/>
  </svg>`;
}

function _buildSeaMap(data) {
  const tribeCount = data.tribes.length;
  const laneHeight = Math.min(55, Math.floor(160 / tribeCount));

  let shipsHTML = '';
  data.tribes.forEach((tribe, idx) => {
    const startPct = tribe.isFlintWinner ? 20 : 5;
    const topPx = 35 + idx * laneHeight;
    const initHP = data.phase2.boatHP?.[tribe.name] || tribe.boatHP || 200;
    shipsHTML += `<div id="vs-ship-${idx}" class="vs-sea-ship" style="left:${startPct}%;top:${topPx}px;" data-tribe="${tribe.name}">
      <div class="vs-sea-ship-fire" id="vs-ship-fire-${idx}">${_buildFireSVG()}</div>
      ${_buildMapShipSVG(tribe.color, idx)}
      <div class="vs-sea-ship-label" style="color:${tribe.color};">${tribe.name}</div>
      <div class="vs-sea-ship-hpwrap">
        <div class="vs-sea-ship-hplabel" id="vs-shiphp-label-${idx}">${initHP} HP</div>
        <div id="vs-shiphp-${idx}" class="vs-hp-fill healthy" style="width:100%;height:100%;"></div>
      </div>
    </div>`;
  });

  const laneLines = data.tribes.slice(0, -1).map((_, idx) => {
    const y = 35 + (idx + 1) * laneHeight - Math.floor(laneHeight / 2);
    return `<div style="position:absolute;left:5%;right:5%;top:${y}px;height:1px;background:rgba(154,184,200,.06);"></div>`;
  }).join('');

  return `<div class="vs-sea-map" id="vs-sea-map">
    <div class="vs-sea-map-grid"></div>
    <div class="vs-sea-map-wave" style="top:25%"></div>
    <div class="vs-sea-map-wave" style="top:50%"></div>
    <div class="vs-sea-map-wave" style="top:75%"></div>
    ${laneLines}
    <div class="vs-sea-map-label" style="top:4px;left:12px;">START</div>
    <div class="vs-sea-map-label" style="top:4px;right:12px;">FLAG</div>
    <div class="vs-sea-map-flag-glow"></div>
    <div class="vs-sea-map-flag">
      ${_icoFlag()}
      <div style="font-family:'Fira Code',monospace;font-size:7px;color:var(--vs-gold-lt);text-align:center;margin-top:1px;">GOAL</div>
    </div>
    <div class="vs-map-round-label" id="vs-map-round">Round 1</div>
    ${shipsHTML}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// VP: RESULTS
// ══════════════════════════════════════════════════════════════

export function rpBuildVSResults(ep) {
  const data = ep.vikingSour;
  if (!data) return '<div>No data</div>';

  window._vsEpRecord = ep;

  const scores = ep.chalMemberScores || {};
  const winTribe = data.winnerTribe;

  // Sort tribes: winner first
  const sorted = [...data.tribes].sort((a, b) => {
    if (a.name === winTribe) return -1;
    if (b.name === winTribe) return 1;
    const avgA = a.members.reduce((s, n) => s + (scores[n] || 0), 0) / (a.members.length || 1);
    const avgB = b.members.reduce((s, n) => s + (scores[n] || 0), 0) / (b.members.length || 1);
    return avgB - avgA;
  });

  // Podium
  let podiumHTML = '';
  sorted.forEach((tribe, tIdx) => {
    const isWinner = tribe.name === winTribe;
    const isLoser = tIdx === sorted.length - 1;
    const cls = isWinner ? 'winner' : isLoser ? 'loser' : '';
    const endReason = data.phase3.endReason;
    let battleText = '';
    if (isWinner) {
      battleText = endReason === 'flag' ? 'FLAG CAPTURED' : endReason === 'sink' ? 'SANK ENEMY' : 'CLOSEST TO FLAG';
    } else if (data.phase3.finalHP[tribe.name] <= 0) {
      battleText = 'SUNK';
    } else {
      battleText = 'OUTPACED';
    }
    const arrivalIdx = data.phase2.arrivalOrder.indexOf(tribe.name);
    const arrivalText = arrivalIdx === 0 ? '1st arrival' : `${arrivalIdx + 1}${arrivalIdx === 1 ? 'nd' : arrivalIdx === 2 ? 'rd' : 'th'} arrival`;

    const membersHTML = tribe.members.map(n => _av(n, 24)).join('');

    podiumHTML += `<div class="vs-podium-slot ${cls}">
      <div class="vs-podium-rank" ${isLoser ? 'style="color:var(--vs-danger)"' : ''}>#${tIdx + 1}</div>
      <div style="margin:8px 0;display:flex;justify-content:center;gap:4px;">${membersHTML}</div>
      <div class="vs-podium-name" style="color:${tribe.color};">${tribe.name}</div>
      <div class="vs-podium-scores">
        ${_icoScroll()} Build Quality: ${Math.round(tribe.buildQuality)}<br>
        ${_icoShip()} Sail: ${arrivalText}<br>
        ${_icoCannon()} Battle: ${battleText}<br>
        ${isWinner ? `${_icoTrophy()} IMMUNE` : `${_icoSkull()} TRIBAL COUNCIL`}
      </div>
    </div>`;
  });

  // Individual scores
  const allPlayers = data.tribes.flatMap(t => t.members.map(n => ({ name: n, tribe: t.name, color: t.color })));
  allPlayers.sort((a, b) => (scores[b.name] || 0) - (scores[a.name] || 0));

  // Find saga badges per player
  const sagaMoments = _collectSagaMoments(data, 'results', 9999, null);
  const playerBadges = {};
  sagaMoments.forEach(m => {
    if (!playerBadges[m.player]) playerBadges[m.player] = m;
  });

  let individualHTML = '';
  let lastTribe = null;
  allPlayers.forEach(p => {
    if (lastTribe !== null && lastTribe !== p.tribe) {
      individualHTML += '<hr class="vs-sb-divider">';
    }
    lastTribe = p.tribe;
    const badge = playerBadges[p.name];
    individualHTML += `<div class="vs-sb-player">
      ${_av(p.name, 24)}
      <span class="vs-sb-player-name">${p.name}</span>
      ${badge ? `<span class="vs-sb-badge ${badge.badgeCls}">${badge.badge}</span>` : ''}
      <span class="vs-sb-player-stat">${scores[p.name] || 0}pts</span>
    </div>`;
  });

  const content = `
    <div class="vs-title-banner">
      <div class="vs-title-sub">World Tour Challenge</div>
      <div class="vs-title-main">Viking Sour</div>
      <div class="vs-knot"></div>
      <div class="vs-title-phase">${_icoTrophy()} &ensp;Final Standings</div>
    </div>

    <div class="vs-podium">${podiumHTML}</div>

    <div class="vs-knot"></div>

    <div style="margin:0 16px;font-family:'Cinzel',serif;font-size:11px;color:var(--vs-gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">
      Individual Scores</div>
    <div class="vs-card vs-visible" style="padding:8px 12px;">
      ${individualHTML}
    </div>
  `;

  return _shell(content, ep, 'results', 'vs-results');
}
