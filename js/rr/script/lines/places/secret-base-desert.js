// Secret Base Desert's own lines (js/rr/places/secret-base-desert.js), in our own words:
//   the drive       across the desert: the engine overheats.
//   sneaking in     All-In: a buzzing fence, a field of warning signs and soldiers with searchlights, road to hangar door
//                   unseen; spotted, the fence touched or an alarm set off and it's marched back to the road.
//   the artifact    All-In: a glowing alien thing among the crates and sheets, heavy, fragile, carried back out past the
//                   guards to an agent in dark glasses; dropped, cracked or caught and it goes back.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'secret-base-desert' };
const SN = { taskId: 'sneak-in' };
const AR = { taskId: 'artifact' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'sbd.op1', when: P, turns: [
      beat("Don stands on an empty desert road at dusk, beside a sign full of bullet holes that just says 'NO'. Somewhere, a helicopter thuds."),
      don("Welcome to Secret Base Desert! Officially, there is nothing out here. Unofficially, there's a fence, a lot of soldiers, and something they really don't want you to see."),
      don("Tonight, teams break in. And then they break out. With a souvenir. Please don't get me arrested."),
      beat('A light streaks across the sky behind him, stops, and zips off sideways. Don does not turn round. He pretends he didn\'t see it.'),
    ] },
    { id: 'sbd.op2', when: P, turns: [
      don("Secret Base Desert. I've been told I'm not allowed to say where we are. I've also been told we're not here. So, welcome to nowhere."),
      don("Racers, drive out into the desert. Keep going until the signs tell you to stop. Then keep going."),
      beat('A man in dark glasses and a black suit appears beside Don, says nothing, and walks away.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'sbd.op3', when: P, turns: [
      beat("Don sits in a deckchair on the roof of a trailer, wearing a tinfoil hat, looking up at the stars through binoculars."),
      don("Secret Base Desert. I'm watching the skies. You're breaking in. Trucks are at the trailer."),
      don("If anything lands, call me. Actually, don't. I'll see it."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'sbd.ar1', when: P, turns: [
      beat("The pickup drives for an hour through a desert with nothing in it, until a fence appears out of the dark, lit up for miles."),
      by('a', "There's nothing for a hundred miles, and then that."),
      by('b', "What are they hiding in there?"),
      by('a', "We're about to find out."),
    ] },
    { id: 'sbd.ar2', when: P, turns: [
      by('b', "Look at the stars. There are so many."),
      by('a', "Is that one moving? That one's moving."),
      by('b', "That's a plane. Probably. Please be a plane."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'sbd.ad1', when: P, turns: [
      by('a', "The tip says 'sneak in'. In there. Past the soldiers."),
      by('b', "Are they real soldiers?"),
      by('a', "They have real searchlights."),
    ] },
    { id: 'sbd.ad2', when: P, turns: [
      beat("They pass a sign that says DO NOT ENTER, then another that says SERIOUSLY, then another that just says NO."),
      by('b', "The signs are getting ruder."),
      by('a', "The signs are getting more nervous."),
    ] },
  ],
};

// ── the drive (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'sbd.tm1', when: { taskId: 'desert-pickup', mishap: 'engine-overheats' }, turns: [
      beat("Steam pours out from under the pickup's bonnet, and it coughs to a stop in the middle of nowhere."),
      by('a', "It's overheated. In the desert. Of course it has."),
      by('b', "Pour the water in. Our water. All of it."),
      beat('Twenty minutes and every bottle of water they had later, the engine starts again.'),
    ] },
  ],
};

// ── sneaking in (All-In) ──
const sneak = {
  'don-demo.gag': [
    { id: 'sbd.sn-d1', when: SN, turns: [
      don("In this All-In, sneak into the base. Get from the road to the hangar door without being seen. Past the soldiers, the warning signs, and the fence that buzzes."),
      beat('He creeps forward on tiptoe to demonstrate. A searchlight lands on him instantly. He freezes, and waves.'),
      don("Not like that. Don't wave. Never wave."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'sbd.sn-d2', when: SN, turns: [
      don("Get spotted, touch the fence, or set off an alarm, and you'll be marched back out to the road to start again."),
      don("Both of you at the hangar door, unseen, and the next tip is yours. The soldiers are actors. The searchlights are real. Very bright. Very real."),
      beat('A searchlight sweeps across the field behind him, and a racer flattens into the dirt just in time.'),
    ] },
  ],
  'task-start.any': [
    { id: 'sbd.sn-s1', when: SN, turns: [
      beat("{a} and {b} lie flat in the dirt at the edge of the field, watching the searchlights sweep back and forth."),
      by('a', "It goes left, then right, then left."),
      by('b', "We run when it goes right. Get ready."),
    ] },
    { id: 'sbd.sn-s2', when: SN, turns: [
      by('b', "Crawl. Low. Like a snake. Like a sneaky snake."),
      by('a', "There might be actual snakes."),
      by('b', "Then be sneakier than them."),
    ] },
    { id: 'sbd.sn-s3', when: SN, turns: [
      beat("{a} crawls behind a warning sign, and {b} crawls behind {a}, and they both hold their breath."),
      by('a', "Did he see us?"),
      by('b', "He's still walking. He didn't see us."),
    ] },
    { id: 'sbd.sn-s4', when: SN, turns: [
      by('a', "What do we do if we get caught?"),
      by('b', "Say we're lost tourists."),
      by('a', "In the middle of a secret desert base at night?"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'sbd.sn-f1', when: SN, turns: [
      beat("Crawling, freezing, and darting between sweeps of the light, {a} and {b} reach the hangar door without a single alarm."),
      by('b', "We're in! We made it!"),
      by('a', "Shh! We're not in yet! We're at the door!"),
    ] },
    { id: 'sbd.sn-f2', when: SN, turns: [
      by('a', "Now! While he's looking the other way!"),
      beat("They sprint across the open ground behind the soldier's back and duck into the shadow of the hangar."),
      by('b', "He didn't turn round! First try!"),
    ] },
    { id: 'sbd.sn-f3', when: SN, turns: [
      beat("{a} times every searchlight perfectly, counting under {a.posAdj} breath, and leads them through without being seen once."),
      by('b', "How did you do that?"),
      by('a', "I've played a lot of video games."),
    ] },
    { id: 'sbd.sn-f4', when: SN, turns: [
      by('b', "First go. Not one alarm."),
      by('a', "We're spies. We're actual spies."),
      by('b', "Very dusty spies."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'sbd.sn-a1', when: SN, turns: [
      by('b', "The light always skips the left side. Go left. All the way left."),
      beat("They crawl all the way along the left side, where the light never quite reaches, and reach the door."),
      by('a', "The blind spot! You found the blind spot!"),
    ] },
    { id: 'sbd.sn-a2', when: SN, turns: [
      beat("Second try. {a} and {b} wait twice as long between every move, and the soldier never sees a thing."),
      by('a', "Patience! Patience was the answer!"),
      by('b', "We're at the door! Finally!"),
    ] },
    { id: 'sbd.sn-a3', when: SN, turns: [
      by('a', "We keep getting caught by the same soldier. So we follow him. Right behind him. He never looks back."),
      beat("They tiptoe right behind the soldier all the way to the hangar door. He never once looks back."),
      by('b', "The safest place is right behind him!"),
    ] },
    { id: 'sbd.sn-a4', when: SN, turns: [
      beat("After being marched back twice, {a} and {b} finally slip through the field and reach the hangar door unseen."),
      by('a', "Third time! We did it!"),
      by('b', "I'm covered in dirt. But we did it."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'sbd.sn-t1', when: SN, turns: [
      beat("{a} and {b} are pinned behind a warning sign, a searchlight sitting right on top of them, not moving."),
      by('a', "Why isn't it moving?"),
      by('b', "Maybe he's on his break."),
    ] },
    { id: 'sbd.sn-t2', when: SN, turns: [
      by('b', "That's the third time they've caught us."),
      by('a', "The same soldier, every time."),
      by('b', "He's starting to recognise us."),
    ] },
    { id: 'sbd.sn-t3', when: SN, turns: [
      beat("{a} sneezes in the dust. Every soldier turns round at once."),
      by('a', "Sorry. Sorry. It's the dust."),
      by('b', "Don't move! Maybe they'll think it was a coyote!"),
    ] },
  ],
  'task-done.any': [
    { id: 'sbd.sn-dn1', when: SN, turns: [
      by('a', "We snuck into a secret base."),
      by('b', "That's probably illegal."),
      by('a', "It's a challenge. It's allowed."),
    ] },
    { id: 'sbd.sn-dn2', when: SN, turns: [
      beat("{a} and {b} slip through the hangar door into the dark, and something inside glows faintly green."),
      by('b', "What's that light?"),
      by('a', "I think that's what we're here for."),
    ] },
    { id: 'sbd.sn-dn3', when: SN, turns: [
      by('b', "My heart's going so fast."),
      by('a', "Mine too. Spying is exhausting."),
      by('b', "And we're only halfway."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'sbd.sn-x1', when: SN, turns: [
      beat("The searchlight lands right on {a} and {b}. A soldier walks over, points to the road, and waits."),
      by('a', "We're lost tourists?"),
      by('b', "He doesn't believe us. Back to the road."),
    ] },
    { id: 'sbd.sn-x2', when: SN, turns: [
      beat("{b} brushes the fence by accident. It buzzes loudly, and an alarm goes off across the whole base."),
      by('b', "I barely touched it!"),
      by('a', "Back to the road! Quick!"),
    ] },
    { id: 'sbd.sn-x3', when: SN, turns: [
      beat("{a} steps on a can in the dark. Clank. Every light in the field swings round."),
      by('a', "Who leaves a can in a secret base?"),
      by('b', "Back to the road! Again!"),
    ] },
  ],
};

// ── the alien artifact (All-In) ──
const artifact = {
  'don-demo.gag': [
    { id: 'sbd.ar-d1', when: AR, turns: [
      don("In this All-In, find the alien artifact somewhere in this hangar, and carry it out past the guards to the agent at the fence. Without a scratch."),
      beat('He lifts a sheet off a crate, sees something glowing underneath, and drops the sheet straight back down.'),
      don("That's not it. That's something else. Please forget I showed you that."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'sbd.ar-d2', when: AR, turns: [
      don("Drop it, crack it, or get caught on the way out, and you put it back and try again. It's heavy. It's fragile. It hums."),
      don("Hand it to the agent without a scratch, and the next tip is yours. Don't ask the agent anything. He's not allowed to answer."),
      beat('The agent in dark glasses stands by the fence in the dark, holding out both hands, not moving.'),
    ] },
  ],
  'task-start.any': [
    { id: 'sbd.ar-s1', when: AR, turns: [
      beat("{a} and {b} creep through the dark hangar, past crates and strange machines covered in sheets."),
      by('a', "Everything's under a sheet. Why is everything under a sheet?"),
      by('b', "So people like us can't see it."),
    ] },
    { id: 'sbd.ar-s2', when: AR, turns: [
      by('b', "Look for the glow. It said it glows."),
      by('a', "Half the things in here glow."),
      by('b', "Look for the glowiest glow."),
    ] },
    { id: 'sbd.ar-s3', when: AR, turns: [
      beat("{a} lifts a sheet. Underneath is a smooth, green, humming shape, the size of a football."),
      by('a', "Found it. I think. It's humming at me."),
      by('b', "Pick it up! Gently!"),
    ] },
    { id: 'sbd.ar-s4', when: AR, turns: [
      by('a', "How do you carry an alien thing?"),
      by('b', "Like a baby. Both hands. Don't shake it."),
      by('a', "What if it shakes itself?"),
    ] },
  ],
  'task-try.first-try': [
    { id: 'sbd.ar-f1', when: AR, turns: [
      beat("{a} carries the artifact like a newborn, {b} leads the way through the shadows, and they hand it to the agent without a scratch."),
      by('b', "He nodded! The agent nodded!"),
      by('a', "First try! We stole an alien thing!"),
    ] },
    { id: 'sbd.ar-f2', when: AR, turns: [
      by('a', "Slow. Slow. Slower than slow."),
      beat("They walk it out so slowly that the guards never notice them. The agent takes it, checks it, and hands over the tip."),
      by('b', "Slow and invisible!"),
    ] },
    { id: 'sbd.ar-f3', when: AR, turns: [
      beat("{b} wraps the artifact in a sheet, tucks it under one arm like laundry, and strolls right out past a guard."),
      by('a', "You just walked past him!"),
      by('b', "He thought it was laundry!"),
    ] },
    { id: 'sbd.ar-f4', when: AR, turns: [
      by('b', "First go. Not a scratch on it."),
      by('a', "It stopped humming when the agent took it. Did you notice?"),
      by('b', "I'm choosing not to think about that."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'sbd.ar-a1', when: AR, turns: [
      by('b', "We dropped it because it's slippery. So we carry it in a sheet. Like a hammock."),
      beat("They carry it between them in a sheet like a hammock, all the way to the agent, without a wobble."),
      by('a', "The hammock idea! Genius!"),
    ] },
    { id: 'sbd.ar-a2', when: AR, turns: [
      beat("Second try. This time {a} and {b} wait for the guards to change shifts, and walk straight out in the gap."),
      by('a', "Shift change! Now!"),
      beat("The agent takes the artifact, checks it, and nods. The tip is theirs."),
    ] },
    { id: 'sbd.ar-a3', when: AR, turns: [
      by('a', "We keep getting caught at the door. So we go out the back. Through the vent."),
      beat("They squeeze through the back vent with the artifact between them, and come out right beside the agent."),
      by('b', "The vent! Always the vent!"),
    ] },
    { id: 'sbd.ar-a4', when: AR, turns: [
      beat("After one drop and one capture, {a} and {b} finally hand the artifact over without a single mark."),
      by('a', "Third time! Not a scratch!"),
      by('b', "My arms are shaking. But not a scratch."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'sbd.ar-t1', when: AR, turns: [
      beat("{a} and {b} are crouched behind a crate, the artifact between them, a guard standing right in front of the way out."),
      by('a', "He's not moving. He's just standing there."),
      by('b', "Maybe he's guarding."),
    ] },
    { id: 'sbd.ar-t2', when: AR, turns: [
      by('b', "It's getting heavier. Why is it getting heavier?"),
      by('a', "It's not getting heavier. You're getting tired."),
      by('b', "It feels like it's getting heavier."),
    ] },
    { id: 'sbd.ar-t3', when: AR, turns: [
      beat("The artifact suddenly starts humming louder in {a}'s arms, and glowing brighter."),
      by('a', "It's getting louder! Why is it getting louder?"),
      by('b', "Cover it! Cover it with something!"),
    ] },
  ],
  'task-done.any': [
    { id: 'sbd.ar-dn1', when: AR, turns: [
      by('a', "What do you think it actually was?"),
      by('b', "I don't want to know."),
      by('a', "Me neither. But I really want to know."),
    ] },
    { id: 'sbd.ar-dn2', when: AR, turns: [
      beat("{a} and {b} walk out into the desert night, towards the Chill Zone lights in the dark, looking up at the stars."),
      by('b', "Is that one moving?"),
      by('a', "Walk faster."),
    ] },
    { id: 'sbd.ar-dn3', when: AR, turns: [
      by('b', "We broke into a secret base and stole an alien thing."),
      by('a', "And gave it straight back."),
      by('b', "Best night of my life."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'sbd.ar-x1', when: AR, turns: [
      beat("The artifact slips out of {b}'s hands and hits the floor with a crack. Every light in the hangar comes on."),
      by('b', "It cracked! It cracked a tiny bit!"),
      by('a', "Put it back! We have to start again!"),
    ] },
    { id: 'sbd.ar-x2', when: AR, turns: [
      beat("A guard steps out from behind a crate, right in front of them, and points back into the hangar."),
      by('a', "We were just admiring it!"),
      by('b', "He doesn't believe us. Put it back."),
    ] },
    { id: 'sbd.ar-x3', when: AR, turns: [
      beat("The agent takes the artifact, turns it over, finds a tiny scratch, and hands it straight back."),
      by('a', "It's a tiny scratch!"),
      by('b', "Tiny is still a scratch! Back to the hangar!"),
    ] },
  ],
};

export default mergePools(place, roads, sneak, artifact);
