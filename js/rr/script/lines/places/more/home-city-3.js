// Home City, third batch. Every season starts here with every team (12 to 18), and each line is said once a season, so
// the common moments need about one line per team: measured 2026-10-19 over eight seasons, a team starting the tower
// fell back to the general lines 18 times, and the zipline's finish 11. Same rules as the first two batches: leg one,
// nothing has happened yet; the tower is an Either/Or (stairs: 144 flights; sky-deck: an elevator two teams at a time,
// then the outside rail, where a team that freezes is sent back to the start of it); the zipline's tip hangs on a pole
// halfway across, and a team that misses rides to the end and climbs back up.
//
// Written again 2026-11-03 (the user: "like a bad google translation... they dont talk like everyday real people"):
// the old batch was a sketch per entry ("a lot of fingers per floor", "that's called multitasking"). These are two
// people on their first task of the race, saying what they would say.
import { mergePools } from '../_kit.js';

const STAIRS = { taskId: 'tower', side: 'stairs' };
const DECK = { taskId: 'tower', side: 'skydeck' };
const TW = { taskId: 'tower' };
const ZL = { taskId: 'zipline' };
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

const tower = {
  'task-start.any': [
    { id: 'hc3.st-s1', when: STAIRS, turns: [
      beat("{a} and {b} push open the stairwell door and start up the first flight."),
      by('b', "Don't sprint. We've got a long way to go."),
      by('a', "I know. Steady. Let's just keep moving."),
    ] },
    { id: 'hc3.st-s2', when: STAIRS, turns: [
      by('a', "A hundred and forty-four flights. Okay. We can do this."),
      by('b', "We're not stopping, okay? Not once."),
      by('a', "Not once. Let's go."),
    ] },
    { id: 'hc3.st-s3', when: STAIRS, turns: [
      by('b', "Let's not talk. Save your breath."),
      by('a', "Okay."),
      by('b', "I mean it. Just breathe and climb."),
    ] },
    { id: 'hc3.st-s4', when: STAIRS, turns: [
      beat('{a} takes the stairs two at a time for the first few flights.'),
      by('b', "Slow down! You're going to burn out!"),
      by('a', "Fine. One at a time. But keep up."),
    ] },
    { id: 'hc3.st-s5', when: STAIRS, turns: [
      by('a', "Small steps. Keep the same pace the whole way."),
      by('b', "Tell me if you need to stop."),
      by('a', "I'm not going to need to stop."),
    ] },
    { id: 'hc3.st-s6', when: STAIRS, turns: [
      beat('At the bottom of the stairwell, {b} stops to stretch. {a} is already four steps up.'),
      by('a', "Are you coming?"),
      by('b', "I'm coming! Two seconds!"),
    ] },
    { id: 'hc3.sd-s1', when: { ...DECK, liftWith: true }, turns: [
      beat('The elevator takes two teams at a time. {a} and {b} squeeze in with the other team.'),
      by('a', "Hi. Good luck up there."),
      by('b', "Don't be nice to them. We're racing them."),
      by('a', "I'm just being polite."),
    ] },
    { id: 'hc3.sd-s2', when: DECK, turns: [
      by('a', "Okay, the elevator does the climbing for us. I like this already."),
      by('b', "And then we have to walk round the outside of the building."),
      by('a', "Let's just not think about that part yet."),
    ] },
    { id: 'hc3.sd-s6', when: DECK, turns: [
      by('a', "Did we pick the right one?"),
      by('b', "It's faster. I'm sure it's faster."),
      by('a', "Okay. I hope you're right."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc3.sd-s5', when: DECK, turns: [
      beat('The elevator doors open onto the deck, and the wind comes straight in.'),
      by('b', "Oh my God, it's so windy."),
      by('a', "Clip in. Clip in first, then worry about it."),
    ] },
    { id: 'hc3.sd-s4', when: DECK, turns: [
      by('a', "How high up are we?"),
      by('b', "Don't ask. Just keep walking."),
      by('a', "Okay. Okay. One step at a time."),
    ] },
    { id: 'hc3.sd-s3', when: DECK, turns: [
      beat('A crew member clips {b} to the rail and gives the harness one sharp tug.'),
      by('b', "Is that it? Am I safe?"),
      by('a', "You're safe. It held. Come on, let's go."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc3.st-a1', when: STAIRS, turns: [
      beat('Halfway up, {b} sits down on a step.'),
      by('b', "I need a minute. Just one minute."),
      by('a', "We can't. Teams are coming up behind us. Come on, I'll go in front."),
      beat('{b} gets up, slowly, and they make it to the top a few minutes later.'),
    ] },
    { id: 'hc3.st-a2', when: STAIRS, turns: [
      by('a', "Which floor is this?"),
      by('b', "I don't know. I stopped looking."),
      by('a', "It has to be nearly the top. It has to be."),
      beat('Three flights later, the stairwell ends at a door marked TOP.'),
    ] },
    { id: 'hc3.sd-a2', when: DECK, turns: [
      by('b', "Second time. This time we don't stop."),
      by('a', "What if the wind picks up again?"),
      by('b', "Then we hold on and keep going. Don't stop."),
      beat("They don't stop, and this time they make it all the way round."),
    ] },
  ],
  'task-done.any': [
    { id: 'hc3.tw-dn1', when: TW, turns: [
      beat('{a} and {b} burst out at the top, and the whole city is spread out underneath them.'),
      by('b', "Look at that."),
      by('a', "Look at it later. Tip first."),
    ] },
    { id: 'hc3.tw-dn2', when: TW, turns: [
      by('a', "Got it. Our first tip."),
      by('b', "Read it, then."),
      by('a', "Give me a second. I can't breathe."),
    ] },
    { id: 'hc3.tw-dn3', when: TW, turns: [
      by('b', "We're at the top. We actually made it to the top."),
      by('a', "And now we're going down a zipline."),
      by('b', "Seriously? Okay. Okay, let's go."),
    ] },
    { id: 'hc3.tw-dn4', when: TW, turns: [
      beat('{a} and {b} high-five, both of them still out of breath.'),
      by('a', "That's one done."),
      by('b', "One done. Come on."),
    ] },
    { id: 'hc3.tw-dn5', when: TW, turns: [
      by('a', "Please tell me that was the hardest thing we'll have to do."),
      by('b', "It's the first leg. I don't think so."),
      by('a', "Don't tell me that."),
    ] },
  ],
};

const failed = {
  'attempt-fail.any': [
    { id: 'hc3.sd-a1', when: DECK, turns: [
      beat('{a} freezes halfway round the rail. A crew member waves them both back to the start.'),
      by('a', "Back? We were halfway!"),
      by('b', "I know. Let's just go again. And this time, don't look down."),
    ] },
    { id: 'hc3.zl-a1', when: ZL, turns: [
      beat('{a} reaches for the pole, swipes at nothing, and sails on to the end of the line.'),
      by('a', "I missed it!"),
      by('b', "Then we go back up the tower. Again."),
      by('a', "All of it?"),
      by('b', "All of it."),
    ] },
  ],
};

const zipline = {
  'task-start.any': [
    { id: 'hc3.zl-s1', when: ZL, turns: [
      beat('{a} stands at the edge of the platform, clipped on, with the lake a long way below.'),
      by('a', "The tip's on a pole, halfway across?"),
      by('b', "Halfway. You grab it as you go past."),
      by('a', "At what speed?"),
      by('b', "Fast. So get your hand ready."),
    ] },
    { id: 'hc3.zl-s2', when: ZL, turns: [
      by('b', "You go first. I'll watch how you do it."),
      by('a', "Thanks. Really helpful."),
      by('b', "Just go! Teams are waiting!"),
    ] },
    { id: 'hc3.zl-s3', when: ZL, turns: [
      by('a', "Arms in. Legs up. Hand out at the pole."),
      by('b', "Which side is the pole on?"),
      by('a', "The right. Right hand out. Don't miss it."),
    ] },
    { id: 'hc3.zl-s4', when: ZL, turns: [
      beat("A crew member checks the clip on {b}'s harness twice, and then a third time."),
      by('b', "Is something wrong with it?"),
      by('a', "No. They're just being careful. You're fine."),
    ] },
    { id: 'hc3.zl-s5', when: ZL, turns: [
      by('a', "On three. One. Two."),
      by('b', "Wait, wait, wait. Okay. Go."),
      beat('{a} pushes off and is gone, shrieking, out over the lake.'),
      by('b', "Okay. My turn. Oh my God."),
    ] },
    { id: 'hc3.zl-s6', when: ZL, turns: [
      by('b', "I'm going to scream the whole way down."),
      by('a', "That's fine. Scream. Just grab the tip."),
      by('b', "Okay. Scream and grab. I can do that."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc3.zl-f1', when: ZL, turns: [
      beat('{a} snatches the tip clean off the pole without even slowing down.'),
      by('b', "You got it! First try!"),
      by('a', "I didn't even see it! I just grabbed!"),
    ] },
    { id: 'hc3.zl-f2', when: ZL, turns: [
      by('b', "Did you get it?"),
      by('a', "I got it!"),
      by('b', "Yes! Okay, let's go!"),
    ] },
    { id: 'hc3.zl-f3', when: ZL, turns: [
      beat('{b} grabs the tip and holds it up in the air the rest of the way to the island.'),
      by('a', "Don't drop it!"),
      by('b', "I'm not going to drop it! I've got it!"),
    ] },
    { id: 'hc3.zl-f4', when: ZL, turns: [
      by('a', "That was easier than I thought."),
      by('b', "You had your eyes closed the whole way."),
      by('a', "I still got the tip, didn't I?"),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc3.zl-a2', when: ZL, turns: [
      by('b', "Reach out early. If you wait till you see it, you've already gone past."),
      by('a', "Okay. Early. Got it."),
      beat('On the next run, {a} reaches out early, and the tip comes away in {a.posAdj} hand.'),
      by('a', "Got it! It worked!"),
    ] },
    { id: 'hc3.zl-a3', when: ZL, turns: [
      by('a', "Another run. My arms are so tired."),
      by('b', "Last time. You've got this. Just grab it."),
      beat('On the next run, {a} grabs, and the tip comes away in {a.posAdj} hand.'),
    ] },
    { id: 'hc3.zl-a4', when: ZL, turns: [
      beat('On the next run, {b} comes down the line with one hand out, watching nothing but the pole.'),
      by('b', "Got it! I've got it!"),
      by('a', "Hold on to it! Don't let go!"),
    ] },
  ],
  'task-done.any': [
    { id: 'hc3.zl-dn1', when: ZL, turns: [
      beat('{b} lands on the island platform, unclips, and holds up the tip.'),
      by('b', "Got it! I've got the tip!"),
      by('a', "Put it in your pocket before you drop it in the lake."),
    ] },
    { id: 'hc3.zl-dn2', when: ZL, turns: [
      by('a', "Which way is the Chill Zone?"),
      by('b', "It says by the airport. Over there."),
      by('a', "Okay. Run."),
    ] },
    { id: 'hc3.zl-dn3', when: ZL, turns: [
      by('b', "My legs are shaking."),
      by('a', "Mine too. Come on, we're nearly there."),
      by('b', "I know. Give me one second."),
    ] },
    { id: 'hc3.zl-dn4', when: ZL, turns: [
      beat('{a} and {b} jog off the jetty, still in their harnesses, until a crew member calls them back.'),
      by('a', "Sorry! Sorry. Here."),
      by('b', "Hurry up! Just give it to them!"),
    ] },
    { id: 'hc3.zl-dn5', when: ZL, turns: [
      by('a', "A tower and a zipline, and it's not even lunchtime."),
      by('b', "And we're not done yet. Come on."),
      by('a', "I know. I'm coming."),
    ] },
    { id: 'hc3.zl-dn6', when: ZL, turns: [
      by('b', "Was that fun? I think that was fun."),
      by('a', "It was fun. Terrifying, but fun."),
      by('b', "Okay. Now let's go find Don."),
    ] },
  ],
};

export default mergePools(tower, zipline, failed);
