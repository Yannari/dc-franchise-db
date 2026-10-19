// Home City's own lines (js/rr/places/home-city.js), 1:1 with the real first leg (the wiki's "None Down, Eighteen to
// Go - Part 1"), written in our own words: the race begins at the station, on foot to the tower's Don Box; Stairs (all
// 144 flights: legs give out, partners get carried) or Sky-deck (a slow elevator, then the outside deck in the wind:
// somebody nearly goes over); the zipline across the lake to the island airport (somebody ends up in the water).
// Gated on place / taskId / side. The opener is the whole race's: it's leg one.
import { V, mergePools } from './_kit.js';

const P = { place: 'home-city' };
const TW = { taskId: 'tower' };
const ST = { taskId: 'tower', side: 'stairs' };
const SD = { taskId: 'tower', side: 'skydeck' };
const ZL = { taskId: 'zipline' };
const don = say => ({ by: 'don', say });

// ── the place: the start of the whole race ──
const place = {
  'don-opener.annoyed': [
    { id: 'hc.op1', when: P, turns: [
      { beat: 'Don stands on the roof of the old train station, the city tower behind him, the wind doing terrible things to his hair.' },
      don("And that's everybody! Teams of two, racing around the world for one million dollars. Here's how it works."),
      don("At the end of every leg there's a Chill Zone. The last team to reach it may be eliminated. The first team to reach the final Chill Zone wins it all."),
      { beat: 'He holds up a box with his own face on it.' },
      don("And this is the Don Box. It holds your tips. It's also very handsome. Racers, the race starts... now!"),
    ] },
    { id: 'hc.op2', when: P, turns: [
      don("That's all of them! Welcome to Home City, home of the city tower, a very cold lake, and the start of the Ridonculous Race!"),
      don("Our teams are about to race around the world, one leg at a time, for a million dollars. Some of them are going to make it. Most of them aren't."),
      { beat: 'He gestures at the crowd of teams on the platform below.' },
      don("Look at them. So fresh. So hopeful. Enjoy it, racers. It never lasts."),
    ] },
  ],
  'don-opener.bored': [
    { id: 'hc.op3', when: P, turns: [
      { beat: 'Don stands at the top of the station steps with a megaphone he clearly doesn\'t need.' },
      don("Racers! That's all of you. Your first Don Box is at the foot of the city tower. On foot. Go!"),
      { beat: 'Nobody moves. Everyone is still taking selfies.' },
      don("I said go! The million dollars is not going to win itself!"),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'hc.ar1', when: P, turns: [
      { beat: '{a} and {b} stand on the station platform, looking up at the tower.' },
      { by: 'a', ...V("This is it. This is actually happening.", "This is really happening.", "This is it.", "This is IT! This is ACTUALLY happening!", "This is it, this is really actually happening.", "We're here. It's real. Somebody pinch me. Gently.") },
      { by: 'b', say: "Around the world. You and me. For a million dollars." },
      { by: 'a', say: "Don't say it like that. I'll cry before we've started." },
    ] },
    { id: 'hc.ar2', when: P, turns: [
      { by: 'b', say: "Look at all these teams. Look at them all." },
      { by: 'a', ...V("Half of them look like they've trained for this.", "Half of them look trained.", "They look trained.", "HALF of them look like they've TRAINED for this!", "Half of them look like they've actually trained for this.", "Half of them look like they were built in a lab for this.") },
      { by: 'b', say: "We trained." },
      { by: 'a', say: "We walked to the shop twice." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'hc.ad1', when: P, turns: [
      { by: 'a', say: "Is that the tower? We have to go up that?" },
      { by: 'b', ...V("We don't know that yet. It might be something on the ground.", "Might be on the ground.", "Maybe it's on the ground.", "We don't KNOW that yet! It MIGHT be on the GROUND!", "We don't know that yet. It could be something on the ground.", "Perhaps the challenge is to admire it. From below.") },
      { by: 'a', say: "It's never on the ground. Nothing on these shows is ever on the ground." },
    ] },
    { id: 'hc.ad2', when: P, turns: [
      { by: 'b', say: "I've got a bad feeling. I haven't even started and I've got a bad feeling." },
      { by: 'a', say: "That's nerves. Everybody's got nerves." },
      { by: 'b', say: "Everybody else is smiling." },
      { by: 'a', say: "They're smiling with nerves." },
    ] },
  ],
};

// ── the tower: Stairs or Sky-deck ──
const tower = {
  'don-demo.gag': [
    { id: 'hc.tw-d1', when: TW, turns: [
      { beat: 'Don stands at the foot of the city tower, beside the first Don Box.' },
      don("In this Either/Or, teams choose. Stairs: all one hundred and forty-four flights, on foot. Sky-deck: take the elevator up, clip on, and walk all the way round the outside deck."),
      { beat: 'He looks up at the deck, impossibly high above him.' },
      don("I did the Sky-deck this morning. I've stopped shaking. Mostly."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'hc.tw-d2', when: TW, turns: [
      don("Two ways up. The Stairs are slow, sweaty and safe. The Sky-deck is quick and windy, and there's only one elevator, and it's very, very slow."),
      don("Choose wisely, racers! Your next tip is waiting at the top."),
      { beat: 'The elevator doors open behind him. It is empty. They close again.' },
    ] },
  ],
  'decide-side.agree': [
    { id: 'hc.tw-dc1', when: TW, turns: [
      { by: 'a', say: "Stairs or deck?" },
      { by: 'b', ...V("Stairs. I'm not walking round the outside of anything.", "Stairs. Nothing outside.", "Stairs.", "STAIRS! I'm NOT walking round the OUTSIDE of anything!", "Stairs, please. I'm not walking round the outside of anything.", "Stairs. My feet stay on the inside of buildings.") },
      { by: 'a', say: "One hundred and forty-four flights?" },
      { by: 'b', say: "Every single one of them, and gladly." },
    ] },
  ],
  'decide-side.overruled': [
    { id: 'hc.tw-dc2', when: TW, turns: [
      { by: 'b', say: "Stairs. Please. Stairs." },
      { by: 'a', say: "The elevator's faster. We're doing the deck." },
      { by: 'b', ...V("You're going to make me walk round the outside of a tower on the first day.", "On the first day? The outside?", "The outside. On day one.", "You're going to make me walk round the OUTSIDE of a TOWER on the FIRST DAY!", "You're really going to make me walk round the outside of a tower on day one?", "Day one, and you're dangling me off a building.") },
      { by: 'a', say: "Day one is the best day to be brave." },
    ] },
  ],
  'decide-side.swayed-by-watching': [
    { id: 'hc.tw-dc3', when: TW, turns: [
      { beat: 'A queue of teams has formed in front of the single slow elevator.' },
      { by: 'a', say: "Look at that line. We'll be waiting an hour." },
      { by: 'b', say: "Stairs, then. Everyone else is too lazy to take the stairs." },
    ] },
  ],
  'task-start.any': [
    { id: 'hc.st-s1', when: ST, turns: [
      { beat: '{a} and {b} push through the door into the stairwell. The stairs go up, and up, and up.' },
      { by: 'a', say: "We just take it one flight at a time." },
      { by: 'b', ...V("One flight at a time. A hundred and forty-four times.", "One at a time. A hundred and forty-four times.", "A hundred and forty-four times.", "One flight at a TIME! A HUNDRED and FORTY-FOUR times!", "One flight at a time, a hundred and forty-four times over.", "One flight, then another, until we die or reach the top.") },
    ] },
    { id: 'hc.st-s2', when: ST, turns: [
      { by: 'b', say: "Should we pace ourselves?" },
      { by: 'a', say: "Pacing is for people with time. Go!" },
      { beat: 'They take the first ten flights at a sprint. They will regret this.' },
    ] },
    { id: 'hc.sd-s1', when: SD, turns: [
      { beat: 'The elevator doors open, and {a} and {b} squeeze in beside another team.' },
      { by: 'a', say: "Does anybody else's ears pop when they go up fast?" },
      { by: 'b', ...V("Everybody's ears pop. That's what ears do.", "Everyone's ears pop.", "All ears pop.", "EVERYBODY'S ears pop! That's WHAT ears DO!", "Everybody's ears pop, that's just what ears do.", "Ears love a good pop.") },
    ] },
    { id: 'hc.sd-s2', when: SD, turns: [
      { beat: 'At the top, a crew member clips {a} and {b} onto a rail on the outside of the deck. The wind hits them at once.' },
      { by: 'b', say: "Oh. Oh, it's windy. Nobody said it would be this windy." },
      { by: 'a', say: "Don't look down. Look at the rail." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc.st-f1', when: ST, turns: [
      { beat: '{a} and {b} keep a steady pace, flight after flight, passing two teams sitting on the landings.' },
      { by: 'a', say: "Slow and steady. Slow and steady." },
      { by: 'b', say: "We're overtaking people. Slow and steady is winning." },
    ] },
    { id: 'hc.st-f2', when: ST, turns: [
      { by: 'b', ...V("We're halfway. I can see a sign. It says halfway.", "Halfway. There's a sign.", "Halfway. Sign says so.", "We're HALFWAY! I can SEE a SIGN! It says HALFWAY!", "We're halfway, I can see a sign that says halfway.", "A sign that says halfway! Civilisation!") },
      { by: 'a', say: "Don't stop. If we stop, my legs will remember they hate me." },
      { beat: 'They don\'t stop. They reach the top together, breathing like two old accordions.' },
    ] },
    { id: 'hc.sd-f1', when: SD, turns: [
      { beat: '{a} and {b} walk the whole deck without stopping once, holding the rail and each other.' },
      { by: 'a', say: "That wasn't so bad." },
      { by: 'b', say: "My hands are shaking so hard I can't unclip the rope." },
    ] },
    { id: 'hc.sd-f2', when: SD, turns: [
      { by: 'b', say: "Look at the view. Look at the whole city." },
      { by: 'a', ...V("I'm looking at my feet. My feet are my view.", "I'm looking at my feet.", "My feet. That's my view.", "I'm LOOKING at my FEET! My FEET are my VIEW!", "I'm looking at my feet. My feet are the view today.", "I'm admiring my shoes. They're very brave shoes.") },
      { beat: 'They make it round the whole deck and unclip at the end, both grinning.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc.st-a1', when: ST, turns: [
      { beat: '{b} sits down on a landing and refuses to get up.' },
      { by: 'b', say: "I can't. My legs have stopped. They've just stopped." },
      { by: 'a', ...V("Then get on my back. I'll carry you.", "Get on my back.", "On my back. Now.", "Then get on my BACK! I'll CARRY you!", "Then climb on my back, I'll carry you.", "Climb aboard. I'm a staircase taxi now.") },
      { beat: '{a} carries {b} up the last six flights, and nearly dies doing it.' },
    ] },
    { id: 'hc.st-a2', when: ST, turns: [
      { by: 'a', say: "What floor is this?" },
      { by: 'b', say: "It doesn't say. It's been not saying for ten floors." },
      { by: 'a', say: "Then we just keep going until there's no more stairs." },
    ] },
    { id: 'hc.sd-a1', when: SD, turns: [
      { beat: 'A gust of wind takes {a} right off {a.posAdj} feet. The safety line catches {a.obj}, and {b} grabs {a.posAdj} leg.' },
      { by: 'b', say: "I've got you! I've got you!" },
      { by: 'a', ...V("I've changed my mind about this race. I want to go home.", "I want to go home.", "I've changed my mind.", "I've CHANGED my MIND about this race! I want to go HOME!", "I've changed my mind about this whole race. I want to go home.", "I take it all back. I'm a ground person now.") },
    ] },
    { id: 'hc.sd-a2', when: SD, turns: [
      { beat: '{a} and {b} have to go back to the start of the rail after {b} freezes halfway round.' },
      { by: 'a', say: "Second time's easier. You know what it feels like now." },
      { by: 'b', say: "I know exactly what it feels like. That's the problem." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'hc.st-t1', when: ST, turns: [
      { by: 'b', say: "I can hear my heart. In my ears. Why can I hear my heart in my ears?" },
      { by: 'a', say: "That's normal. Keep climbing." },
      { by: 'b', say: "Nothing about this is normal." },
    ] },
    { id: 'hc.st-t2', when: ST, turns: [
      { beat: 'Another team jogs past {a} and {b} on their way up, waving cheerfully.' },
      { by: 'a', ...V("How are they jogging? How is anyone jogging?", "How are they jogging?", "They're jogging?", "How are they JOGGING? How is ANYONE jogging?", "How are they still jogging? How is anybody jogging?", "Jogging. On stairs. They're not human.") },
      { by: 'b', say: "I hate them. I hate them so much." },
    ] },
    { id: 'hc.sd-t1', when: SD, turns: [
      { beat: '{b} is pressed flat against the tower wall, eyes shut, not moving at all.' },
      { by: 'a', say: "One step. Just one step to the left." },
      { by: 'b', say: "I've decided to live here now. On the deck. Forever." },
    ] },
  ],
  'task-done.any': [
    { id: 'hc.tw-dn1', when: TW, turns: [
      { beat: '{a} and {b} reach the top and grab the tip from the Don Box.' },
      { by: 'a', say: "The zipline. Across the lake. To the airport." },
      { by: 'b', ...V("Down? We go down now? We just came up!", "Down? We just came up!", "Down now?", "DOWN? We go DOWN now? We JUST came UP!", "Down? We're going down now? We only just came up!", "All that up, just to go down? This race is cruel.") },
    ] },
    { id: 'hc.tw-dn2', when: TW, turns: [
      { by: 'b', say: "We did it. We're at the top." },
      { by: 'a', say: "And now we have to get across that lake." },
      { by: 'b', say: "Can I enjoy being at the top for one second?" },
    ] },
    { id: 'hc.tw-dn3', when: TW, turns: [
      { beat: '{a} pulls the tip out and reads it with {a.posAdj} hands still shaking.' },
      { by: 'a', say: "First leg, first tip. Let's not be the first team out." },
      { by: 'b', say: "Agreed. Let's not be famous for that." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hc.st-x1', when: ST, turns: [
      { beat: '{a} misses a step, slides down half a flight on {a.posAdj} backside, and lands at {b}\'s feet.' },
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I'm fine. My pride is somewhere on the floor above." },
    ] },
    { id: 'hc.sd-x1', when: SD, turns: [
      { beat: 'Halfway round the deck, {b} grabs the rail and won\'t let go.' },
      { by: 'a', ...V("We have to go back to the start. They're saying we have to go back.", "We have to go back to the start.", "Back to the start.", "We have to go BACK to the START! They're SAYING we have to go BACK!", "They're saying we have to go back to the start of the rail.", "The rail has rejected us. We begin again.") },
      { by: 'b', say: "Good. The start is closer to the inside." },
    ] },
    { id: 'hc.sd-x2', when: SD, turns: [
      { beat: 'The elevator arrives, opens, and fills up with another team before {a} and {b} can get on.' },
      { by: 'a', say: "Next one. We'll get the next one." },
      { by: 'b', say: "The next one is ten minutes. The stairs would've been ten minutes." },
    ] },
  ],
};

// ── the zipline across the lake ──
const zipline = {
  'don-demo.gag': [
    { id: 'hc.zl-d1', when: ZL, turns: [
      don("Your next tip is at the island airport, on the other side of the lake. The fastest way there is this zipline."),
      { beat: 'He clips himself on, pushes off, and sails out over the water, shrieking all the way.' },
      don("Grab the tip as you fly past the pole! Miss it, and you go round again! Somebody get me down!"),
    ] },
  ],
  'don-demo.dry': [
    { id: 'hc.zl-d2', when: ZL, turns: [
      don("Both partners ride the zipline across the lake. Halfway over, there's a pole with your next tip on it. Grab it as you go."),
      don("Miss it, and you'll have to climb back up and try again. Also, try not to land in the lake. It's very, very cold."),
      { beat: 'He dips one finger in a bucket of lake water and shudders all over.' },
    ] },
  ],
  'task-start.any': [
    { id: 'hc.zl-s1', when: ZL, turns: [
      { beat: '{a} and {b} are strapped into harnesses at the edge of the platform. The lake is a very long way down.' },
      { by: 'a', say: "You go first." },
      { by: 'b', ...V("Why me?", "Why me?", "Me? Why?", "Why ME?", "Why do I have to go first?", "Why must I be the brave one?") },
      { by: 'a', say: "So I can see if it works." },
    ] },
    { id: 'hc.zl-s2', when: ZL, turns: [
      { by: 'b', say: "Is this thing safe? This feels like the kind of thing that isn't safe." },
      { by: 'a', say: "They wouldn't let us do it if it wasn't safe." },
      { by: 'b', say: "This is the show that put us in a tower on day one." },
    ] },
    { id: 'hc.zl-s3', when: ZL, turns: [
      { beat: 'A crew member hands {a} a helmet.' },
      { by: 'a', say: "Do I have to wear the helmet? It's going to ruin my hair." },
      { by: 'b', say: "The lake will ruin your hair more." },
    ] },
    { id: 'hc.zl-s4', when: ZL, turns: [
      { by: 'a', say: "On three. One, two..." },
      { beat: '{b} pushes off on two.' },
      { by: 'a', say: "That was two! You went on two!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc.zl-f1', when: ZL, turns: [
      { beat: '{a} flies over the water, snatches the tip off the pole as it whips past, and whoops all the way down.' },
      { by: 'a', ...V("I got it! First try! I got it!", "Got it. First try.", "Got it!", "I GOT it! FIRST TRY! I GOT it!", "I got it! First try, I actually got it!", "I caught it like a hawk, a very sweaty hawk!") },
      { by: 'b', say: "Show-off!" },
    ] },
    { id: 'hc.zl-f2', when: ZL, turns: [
      { beat: '{a} and {b} zip down the line, and {b} grabs the tip clean off the pole.' },
      { by: 'b', say: "That was amazing! Can we do it again?" },
      { by: 'a', say: "No. We have a plane to catch." },
    ] },
    { id: 'hc.zl-f3', when: ZL, turns: [
      { by: 'a', say: "I've never done a zipline in my life." },
      { beat: 'Ten seconds later, {a} has the tip in {a.posAdj} hand and is landing perfectly on the far side.' },
      { by: 'b', say: "For somebody who's never done a zipline, that was suspicious." },
    ] },
    { id: 'hc.zl-f4', when: ZL, turns: [
      { beat: 'The wind is behind them, and the line is fast. {a} grabs the tip without even trying.' },
      { by: 'a', say: "Easy. I don't know what everyone was worried about." },
      { by: 'b', say: "I'm going to remember you said that." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc.zl-a1', when: ZL, turns: [
      { beat: 'This time {a} reaches out early, stretches as far as {a.sub} can, and gets it.' },
      { by: 'a', ...V("Got it! Third time!", "Third time. Got it.", "Got it. Third time.", "GOT it! THIRD time!", "Got it! Third time lucky!", "Third time! The pole has surrendered!") },
      { by: 'b', say: "Finally! My arms are shaking from climbing back up." },
    ] },
    { id: 'hc.zl-a2', when: ZL, turns: [
      { by: 'b', say: "You keep grabbing too late. Grab before the pole, not at the pole." },
      { by: 'a', say: "Before the pole. Before the pole. Okay." },
      { beat: '{a} grabs before the pole, and gets it.' },
    ] },
    { id: 'hc.zl-a3', when: ZL, turns: [
      { beat: '{a} climbs back up the platform steps, dripping, having missed the tip and dipped into the lake.' },
      { by: 'b', say: "How was the lake?" },
      { by: 'a', say: "Cold. Very cold. Clip me in, I'm going again." },
    ] },
    { id: 'hc.zl-a4', when: ZL, turns: [
      { by: 'a', say: "Don't look at the water. Look at the tip. Only the tip." },
      { beat: 'This time {b} looks only at the tip, and snatches it off the pole.' },
      { by: 'b', say: "Only the tip! It works!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'hc.zl-t1', when: ZL, turns: [
      { beat: '{a} has missed the tip three times. Every climb back up the platform is slower than the last.' },
      { by: 'a', say: "My arms aren't long enough. That's the problem. I've got short arms." },
      { by: 'b', say: "Your arms were long enough to steal my chips on the train." },
    ] },
    { id: 'hc.zl-t2', when: ZL, turns: [
      { by: 'b', say: "I keep spinning round. I go down backwards every time." },
      { by: 'a', ...V("Then grab it backwards. Grab it with your eyes shut.", "Grab it backwards.", "Backwards, then.", "Then GRAB it BACKWARDS! Grab it with your EYES SHUT!", "Then just grab it backwards. Grab it with your eyes shut.", "Grab it backwards. The tip won't know.") },
      { by: 'b', say: "That's not advice. That's just words." },
    ] },
    { id: 'hc.zl-t3', when: ZL, turns: [
      { beat: 'Team after team zips past {a} and {b} on the platform, grabbing tips, landing, running for the airport.' },
      { by: 'a', say: "Everybody else is getting it." },
      { by: 'b', say: "Everybody else isn't us. One more go." },
    ] },
  ],
  'task-done.any': [
    { id: 'hc.zl-dn1', when: ZL, turns: [
      { beat: '{a} and {b} land on the island, unclip, and run for the airport doors with the tip.' },
      { by: 'b', say: "Our first leg's nearly done." },
      { by: 'a', ...V("Don't say nearly. Nearly is how you lose.", "Don't say nearly.", "No nearly.", "DON'T say NEARLY! NEARLY is how you LOSE!", "Don't say nearly. That's how you jinx it.", "Nearly is a curse word on this show.") },
    ] },
    { id: 'hc.zl-dn2', when: ZL, turns: [
      { by: 'b', say: "That was the best thing I've ever done. Can we get on a plane now?" },
      { by: 'a', say: "Once we've checked in with Don." },
      { by: 'b', say: "Then let's go and check in with Don." },
    ] },
    { id: 'hc.zl-dn3', when: ZL, turns: [
      { beat: '{a} lands in a heap, rolls, and stands up holding the tip high over {a.posAdj} head.' },
      { by: 'a', say: "Ta-da!" },
      { by: 'b', say: "You landed on your face." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hc.zl-x1', when: ZL, turns: [
      { beat: '{a} reaches for the tip, misses by an inch, and sails right past it.' },
      { by: 'a', say: "No! No, no, no! Back up! I have to go back up!" },
      { by: 'b', say: "That's a lot of stairs to go back up." },
    ] },
    { id: 'hc.zl-x2', when: ZL, turns: [
      { beat: '{a} swings, spins, and the line dips {a.obj} straight into the lake.' },
      { by: 'a', ...V("It's freezing! It's absolutely freezing!", "It's freezing!", "Freezing!", "It's FREEZING! It's ABSOLUTELY FREEZING!", "It's freezing in here, absolutely freezing!", "The lake is ice! Liquid ice!") },
      { by: 'b', say: "Did you get the tip?" },
      { by: 'a', say: "Did I get the tip? I got a fish!" },
    ] },
    { id: 'hc.zl-x3', when: ZL, turns: [
      { beat: '{b} closes {b.posAdj} eyes on the way down and goes straight past the pole.' },
      { by: 'a', say: "Did you have your eyes shut?" },
      { by: 'b', say: "Only for the scary part. Which was all of it." },
    ] },
  ],
};

export default mergePools(place, tower, zipline);
