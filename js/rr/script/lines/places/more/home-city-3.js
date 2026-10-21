// Home City, third batch. Every season starts here with every team (12 to 18), and each line is said once a season, so
// the common moments need about one line per team: measured 2026-10-19 over eight seasons, a team starting the tower
// fell back to the general lines 18 times, and the zipline's finish 11. Same rules as the first two batches: leg one,
// nothing has happened yet; the tower is an Either/Or (stairs: 144 flights; sky-deck: an elevator two teams at a time,
// then the outside rail, where a team that freezes is sent back to the start of it); the zipline's tip hangs on a pole
// halfway across, and a team that misses rides to the end and climbs back up.
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
      beat("{a} and {b} push open the stairwell door. It smells of old paint and other people's effort."),
      by('b', "Somebody's already been sick on the third step."),
      by('a', "Then we skip the third step."),
    ] },
    { id: 'hc3.st-s2', when: STAIRS, turns: [
      by('a', "A hundred and forty-four flights. How bad can it be?"),
      by('b', "That's a question you only get to ask once."),
      by('a', "I'll ask it again at the top. Louder."),
    ] },
    { id: 'hc3.st-s3', when: STAIRS, turns: [
      by('b', "Rule one: nobody talks."),
      by('a', "Why?"),
      by('b', "That was talking. Breathing only."),
    ] },
    { id: 'hc3.st-s4', when: STAIRS, turns: [
      beat('{a} counts the flights on {a.posAdj} fingers, and runs out of fingers on the second landing.'),
      by('a', "I've run out of fingers."),
      by('b', "We're on the second floor."),
      by('a', "It's a lot of fingers per floor."),
    ] },
    { id: 'hc3.st-s5', when: STAIRS, turns: [
      by('a', "Small steps. Marathon pace."),
      by('b', "Have you ever run a marathon?"),
      by('a', "I've watched one. On TV. All of it. That's basically training."),
    ] },
    { id: 'hc3.st-s6', when: STAIRS, turns: [
      beat('At the bottom of the stairwell, {b} stretches like a professional athlete. {a} is already four steps up.'),
      by('a', "Are you coming?"),
      by('b', "Warm muscles don't cramp. Cold muscles cry."),
      by('a', "Then cry on the way up."),
    ] },
    { id: 'hc3.sd-s1', when: DECK, turns: [
      beat('The elevator takes two teams at a time. {a} and {b} squeeze in, nose to nose with the other team.'),
      by('a', "Hi."),
      by('b', "Don't make friends. They're the competition."),
      by('a', "We're in a box with them. We're a little bit friends."),
    ] },
    { id: 'hc3.sd-s2', when: DECK, turns: [
      by('a', "The elevator does the climbing. We just stand here. I love this plan."),
      by('b', "And then we walk around the outside of the building."),
      by('a', "I stopped listening after 'elevator'."),
    ] },
    { id: 'hc3.sd-s6', when: DECK, turns: [
      by('a', "We picked this one because it's faster."),
      by('b', "We picked this one because you can't count past fifty stairs."),
      by('a', "Both reasons. Mostly the first one."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc3.sd-s5', when: DECK, turns: [
      beat('The elevator doors open onto the deck, and the wind gets in before they do.'),
      by('b', "My hair. My hair is going sideways."),
      by('a', "Everything is going sideways. Clip in."),
    ] },
    { id: 'hc3.sd-s4', when: DECK, turns: [
      by('a', "How high up are we?"),
      by('b', "Don't ask that."),
      by('a', "I'm asking for the view."),
      by('b', "Then the answer is 'very nice'. Keep walking."),
    ] },
    { id: 'hc3.sd-s3', when: DECK, turns: [
      beat('A crew member clips {b} to the rail and gives the harness one sharp tug.'),
      by('b', "Is that the test? A tug?"),
      by('a', "He tugged it, and it held. That's science."),
      by('b', "That's a tug."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc3.st-a1', when: STAIRS, turns: [
      beat('Halfway up, {b} sits down on a step.'),
      by('b', "Five minutes."),
      by('a', "Five seconds."),
      by('b', "Four minutes."),
      by('a', "Get up. I'll carry the water."),
      beat('{b} gets up, grumbling, and they make it to the top a few minutes later.'),
    ] },
    { id: 'hc3.st-a2', when: STAIRS, turns: [
      by('a', "Which floor is this?"),
      by('b', "There aren't any numbers on this one."),
      by('a', "Then I've decided it's nearly the top."),
      by('b', "That's not how buildings work."),
      beat('Three flights later, the stairwell ends at a door marked TOP. {a} looks unbearably smug.'),
    ] },
    { id: 'hc3.sd-a2', when: DECK, turns: [
      by('b', "Second time round. This time we don't stop."),
      by('a', "What if the wind..."),
      by('b', "We don't stop for the wind. The wind doesn't stop for us."),
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
      by('a', "Got it. The tip. We've got our very first tip."),
      by('b', "Read it, then."),
      by('a', "I can't. I'm still seeing stars."),
    ] },
    { id: 'hc3.tw-dn3', when: TW, turns: [
      by('b', "We're at the top. We are literally at the top of the city."),
      by('a', "And the only way down is a zipline."),
      by('b', "Why would you read that part out loud?"),
    ] },
    { id: 'hc3.tw-dn4', when: TW, turns: [
      beat('{a} goes for a high five with {b}, misses, and high-fives the wall.'),
      by('a', "Ow."),
      by('b', "Still counts."),
    ] },
    { id: 'hc3.tw-dn5', when: TW, turns: [
      by('a', "Was that the hardest thing we'll have to do?"),
      by('b', "It's the first thing we've done."),
      by('a', "So, yes. So far."),
    ] },
  ],
};

const failed = {
  'attempt-fail.any': [
    { id: 'hc3.sd-a1', when: DECK, turns: [
      beat('{a} freezes halfway round the rail. A crew member waves them both back to the start.'),
      by('a', "Back? We were halfway!"),
      by('b', "Rules are rules. Back we go. And this time, don't look down."),
    ] },
    { id: 'hc3.zl-a1', when: ZL, turns: [
      beat('{a} reaches for the pole, swipes at nothing, and sails on to the end of the line.'),
      by('a', "I missed it!"),
      by('b', "Then back up the tower. Again."),
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
      by('b', "Fast."),
    ] },
    { id: 'hc3.zl-s2', when: ZL, turns: [
      by('b', "You go first. If you miss the tip, I'll know where not to grab."),
      by('a', "That's very generous of you."),
      by('b', "I'm a giver."),
    ] },
    { id: 'hc3.zl-s3', when: ZL, turns: [
      by('a', "Arms in. Legs up. Hand out at the pole."),
      by('b', "Which hand?"),
      by('a', "The one closest to the pole."),
      by('b', "They're both close to the pole!"),
    ] },
    { id: 'hc3.zl-s4', when: ZL, turns: [
      beat("A crew member checks the clip on {b}'s harness twice, and then a third time."),
      by('b', "Why a third time?"),
      by('a', "Because you asked a question on the second."),
    ] },
    { id: 'hc3.zl-s5', when: ZL, turns: [
      by('a', "On three. One. Two."),
      by('b', "Is it on three, or after three?"),
      beat('{a} is already gone, shrieking, somewhere over the lake.'),
      by('b', "It was on two. It was always going to be on two."),
    ] },
    { id: 'hc3.zl-s6', when: ZL, turns: [
      by('b', "If I scream the whole way, don't tell anybody."),
      by('a', "Everybody will see it on TV."),
      by('b', "Then don't tell them it was me."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc3.zl-f1', when: ZL, turns: [
      beat('{a} snatches the tip clean off the pole without even slowing down.'),
      by('b', "How did you do that?"),
      by('a', "No idea. And I'm never doing it again, in case I can't."),
    ] },
    { id: 'hc3.zl-f2', when: ZL, turns: [
      by('b', "Did you get it?"),
      by('a', "I got it."),
      by('b', "Did you scream?"),
      by('a', "I got it and I screamed. That's called multitasking."),
    ] },
    { id: 'hc3.zl-f3', when: ZL, turns: [
      beat('{b} grabs the tip, holds it up like a trophy, and spins slowly on the line all the way to the island.'),
      by('a', "Stop spinning!"),
      by('b', "I can't! It's a victory spin!"),
    ] },
    { id: 'hc3.zl-f4', when: ZL, turns: [
      by('a', "That was easier than I thought it would be."),
      by('b', "You had your eyes closed."),
      by('a', "Which made it easier."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc3.zl-a2', when: ZL, turns: [
      by('b', "You have to grab before you see it. If you can see it, you're already past it."),
      by('a', "That makes no sense."),
      by('b', "Try it."),
      beat("On the next run, {a} grabs blind, and the tip comes away in {a.posAdj} hand."),
    ] },
    { id: 'hc3.zl-a3', when: ZL, turns: [
      by('a', "Another run. My arms are noodles."),
      by('b', "Noodles can grab things."),
      by('a', "Name one thing a noodle has ever grabbed."),
      by('b', "Just grab the tip!"),
      beat('On the next run, {a} grabs, and the tip comes away in {a.posAdj} hand.'),
    ] },
    { id: 'hc3.zl-a4', when: ZL, turns: [
      beat('On the next run, {b} comes down the line with one hand out and a face of total focus.'),
      by('b', "Got it! Got it, got it, got it!"),
      by('a', "Stop saying got it and hold on to it!"),
    ] },
  ],
  'task-done.any': [
    { id: 'hc3.zl-dn1', when: ZL, turns: [
      beat('{b} lands on the island platform, unclips, and waves the tip at the lake.'),
      by('b', "Got it! I've got the tip!"),
      by('a', "Then stop waving it about. You'll drop it in the lake."),
    ] },
    { id: 'hc3.zl-dn2', when: ZL, turns: [
      by('a', "The airport. We're going to an actual airport."),
      by('b', "After Don."),
      by('a', "After Don. Then an actual airport."),
    ] },
    { id: 'hc3.zl-dn3', when: ZL, turns: [
      by('b', "My legs are shaking."),
      by('a', "You were sitting down the whole way."),
      by('b', "They're shaking from the inside."),
    ] },
    { id: 'hc3.zl-dn4', when: ZL, turns: [
      beat('{a} and {b} jog off the jetty, still wearing their harnesses, until a crew member chases them down.'),
      by('a', "Can we keep these?"),
      by('b', "Give it back. We'll get our own."),
    ] },
    { id: 'hc3.zl-dn5', when: ZL, turns: [
      by('a', "One tower, one zipline, one lake. Not bad for a morning."),
      by('b', "It's not even lunchtime."),
      by('a', "Not bad for not even lunchtime."),
    ] },
    { id: 'hc3.zl-dn6', when: ZL, turns: [
      by('b', "Was that fun? I think that was fun."),
      by('a', "It was fun. It was terrifying, but it was fun."),
      by('b', "Let's never tell Don it was fun."),
    ] },
  ],
};

export default mergePools(tower, zipline, failed);
