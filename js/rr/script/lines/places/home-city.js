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
      { by: 'b', say: "Look at all these teams." },
      { by: 'a', say: "Some of them look really fit." },
      { by: 'b', say: "So are we. Sort of." },
      { by: 'a', say: "We'll be fine. We just have to be smart about it." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'hc.ad1', when: P, turns: [
      { by: 'a', say: "Is that the tower? Do we have to go up that?" },
      { by: 'b', say: "We don't know yet. It might be something on the ground." },
      { by: 'a', say: "I hope so. I really don't like heights." },
    ] },
    { id: 'hc.ad2', when: P, turns: [
      { by: 'b', say: "I've got a bad feeling about this." },
      { by: 'a', say: "That's just nerves. Everybody's nervous." },
      { by: 'b', say: "Everyone else looks so calm." },
      { by: 'a', say: "They're nervous too. Stay with me and we'll be fine." },
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
    { id: 'hc.tw-dc1', when: { ...TW, side: 'stairs' }, turns: [
      { by: 'a', say: "Stairs or deck?" },
      { by: 'b', say: "Stairs. I'm not walking round the outside of anything." },
      { by: 'a', say: "It's a hundred and forty-four flights." },
      { by: 'b', say: "I know. I'd still rather climb." },
    ] },
  ],
  'decide-side.overruled': [
    { id: 'hc.tw-dc2', when: { ...TW, side: 'skydeck' }, turns: [
      { by: 'b', say: "Stairs. Please." },
      { by: 'a', say: "The elevator's faster. We're doing the deck." },
      { by: 'b', say: "You know I hate heights." },
      { by: 'a', say: "I know. I'll be right next to you the whole way." },
    ] },
  ],
  'decide-side.swayed-by-watching': [
    { id: 'hc.tw-dc3', when: { ...TW, side: 'stairs', liftQueue: true }, turns: [
      { beat: "A queue of teams has formed in front of the single slow elevator." },
      { by: 'a', say: "Look at that line. We'll be waiting an hour." },
      { by: 'b', say: "Then let's take the stairs. Nobody's queuing for those." },
    ] },
  ],
  'task-start.any': [
    { id: 'hc.st-s1', when: ST, turns: [
      { beat: "{a} and {b} push through the door into the stairwell. The stairs go up, and up, and up." },
      { by: 'a', say: "We just take it one flight at a time." },
      { by: 'b', say: "One at a time. Tell me if you need to slow down." },
    ] },
    { id: 'hc.st-s2', when: ST, turns: [
      { by: 'b', say: "Should we pace ourselves?" },
      { by: 'a', say: "No. Let's get ahead while our legs are fresh." },
      { beat: "They take the first ten flights at a sprint, and it costs them later." },
    ] },
    { id: 'hc.sd-s1', when: { ...SD, liftWith: true }, turns: [
      { beat: "The elevator doors open, and {a} and {b} squeeze in beside another team." },
      { by: 'a', say: "How long does this take to get up?" },
      { by: 'b', say: "Long enough for me to start panicking about the deck." },
      { by: 'a', say: "Don't think about the deck yet. One thing at a time." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc.sd-s2', when: SD, turns: [
      { beat: 'At the top, a crew member clips {a} and {b} onto a rail on the outside of the deck. The wind hits them at once.' },
      { by: 'b', say: "Oh. Oh, it's windy. Nobody said it would be this windy." },
      { by: 'a', say: "Don't look down. Look at the rail." },
    ] },
    { id: 'hc.st-f1', when: ST, turns: [
      { beat: '{a} and {b} keep a steady pace, flight after flight, passing two teams sitting on the landings.' },
      { by: 'a', say: "Slow and steady. Slow and steady." },
      { by: 'b', say: "We're overtaking people. Slow and steady is winning." },
    ] },
    { id: 'hc.st-f2', when: ST, turns: [
      { by: 'b', say: "We're halfway. There's a sign." },
      { by: 'a', say: "Don't stop. If we stop, I won't get going again." },
      { beat: "They don't stop, and they reach the top together, completely out of breath." },
    ] },
    { id: 'hc.sd-f1', when: SD, turns: [
      { beat: '{a} and {b} walk the whole deck without stopping once, holding the rail and each other.' },
      { by: 'a', say: "That wasn't so bad." },
      { by: 'b', say: "My hands are shaking so hard I can't unclip the rope." },
    ] },
    { id: 'hc.sd-f2', when: SD, turns: [
      { by: 'b', say: "Look at the view. You can see the whole city." },
      { by: 'a', say: "I can't look. Tell me when we're nearly at the end." },
      { beat: "{b} talks {a} all the way round the deck, and they unclip at the end, both grinning." },
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
      { beat: "A gust of wind takes {a} right off {a.posAdj} feet. The safety line catches {a.obj}, and {b} grabs {a.posAdj} leg." },
      { by: 'b', say: "I've got you! I've got you!" },
      { by: 'a', say: "I can't do this. I want to go back inside." },
      { by: 'b', say: "Two more steps and we're round the corner. Come on." },
    ] },
    { id: 'hc.sd-a2', when: SD, turns: [
      { beat: '{a} and {b} have to go back to the start of the rail after {b} freezes halfway round.' },
      { by: 'a', say: "Second time's easier. You know what it feels like now." },
      { by: 'b', say: "I know exactly what it feels like. That's the problem." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'hc.st-t1', when: ST, turns: [
      { by: 'b', say: "I can hear my heart in my ears." },
      { by: 'a', say: "That's normal. Keep climbing." },
      { by: 'b', say: "Can we stop for one minute?" },
      { by: 'a', say: "Thirty seconds. Then we go." },
    ] },
    { id: 'hc.st-t2', when: ST, turns: [
      { beat: "Another team jogs past {a} and {b} on their way up, waving cheerfully." },
      { by: 'a', say: "How are they jogging?" },
      { by: 'b', say: "Forget them. We run our own race." },
    ] },
    { id: 'hc.sd-t1', when: SD, turns: [
      { beat: "{b} is pressed flat against the tower wall, eyes shut, not moving at all." },
      { by: 'a', say: "One step. Just one step to the left." },
      { by: 'b', say: "I can't move my feet." },
      { by: 'a', say: "Then hold my hand and move one foot. Just one." },
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
      { by: 'b', say: "Give me one second to breathe, then let's go." },
    ] },
    { id: 'hc.tw-dn3', when: TW, turns: [
      { beat: "{a} pulls the tip out and reads it with {a.posAdj} hands still shaking." },
      { by: 'a', say: "First leg, first tip. Let's not be the first team out." },
      { by: 'b', say: "We won't be. We're doing fine." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hc.st-x1', when: ST, turns: [
      { beat: "{a} misses a step, slides down half a flight on {a.posAdj} backside, and lands at {b}'s feet." },
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I'm fine. Just my knee. Keep going." },
    ] },
    { id: 'hc.sd-x1', when: SD, turns: [
      { beat: "Halfway round the deck, {b} grabs the rail and won't let go." },
      { by: 'a', say: "We have to go back to the start. They're saying we have to go back." },
      { by: 'b', say: "Okay. Let's go back and try again, slower this time." },
    ] },
    // (the car filling up before they get on is the elevator's own moment now: places/home-city-lift.js lift-door.full)
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
      { beat: "{a} and {b} are strapped into harnesses at the edge of the platform. The lake is a very long way down." },
      { by: 'a', say: "You go first." },
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because if I watch you do it, I'll be able to do it." },
    ] },
    { id: 'hc.zl-s2', when: ZL, turns: [
      { by: 'b', say: "Is this thing safe?" },
      { by: 'a', say: "They wouldn't let us do it if it wasn't." },
      { by: 'b', say: "Okay. Can you check my harness for me?" },
    ] },
    { id: 'hc.zl-s3', when: ZL, turns: [
      { beat: "A crew member hands {a} a helmet." },
      { by: 'a', say: "Do I really have to wear this?" },
      { by: 'b', say: "Yes. Put it on and let's go." },
    ] },
    { id: 'hc.zl-s4', when: ZL, turns: [
      { by: 'a', say: "On three. One, two..." },
      { beat: "{b} pushes off on two." },
      { by: 'a', say: "That was two! Wait for me!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc.zl-f1', when: ZL, turns: [
      { beat: "{a} flies over the water, snatches the tip off the pole as it whips past, and whoops all the way down." },
      { by: 'a', say: "I got it! First try!" },
      { by: 'b', say: "Brilliant! Wait for me on the other side!" },
    ] },
    { id: 'hc.zl-f2', when: ZL, turns: [
      { beat: '{a} and {b} zip down the line, and {b} grabs the tip clean off the pole.' },
      { by: 'b', say: "That was amazing! Can we do it again?" },
      { by: 'a', say: "No. We have a plane to catch." },
    ] },
    { id: 'hc.zl-f3', when: ZL, turns: [
      { by: 'a', say: "I've never done a zipline in my life." },
      { beat: "Ten seconds later, {a} has the tip in {a.posAdj} hand and is landing perfectly on the far side." },
      { by: 'b', say: "For somebody who's never done one, that was perfect." },
    ] },
    { id: 'hc.zl-f4', when: ZL, turns: [
      { beat: "The wind is behind them, and the line is fast. {a} grabs the tip without even trying." },
      { by: 'a', say: "Easy. I don't know what everyone was worried about." },
      { by: 'b', say: "Don't say that yet. We haven't landed." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc.zl-a1', when: ZL, turns: [
      { beat: "This time {a} reaches out early, stretches as far as {a.sub} can, and gets it." },
      { by: 'a', say: "Got it! Third time!" },
      { by: 'b', say: "Finally! Now run, before anyone else catches up." },
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
      { beat: "{a} has missed the tip three times. Every climb back up the platform is slower than the last." },
      { by: 'a', say: "My arms aren't long enough. I keep missing it." },
      { by: 'b', say: "Reach out earlier. Before you get to the pole." },
    ] },
    { id: 'hc.zl-t2', when: ZL, turns: [
      { by: 'b', say: "I keep spinning round and going down backwards." },
      { by: 'a', say: "Hold the trolley with one hand and turn yourself round with the other." },
      { by: 'b', say: "Okay. I'll try that." },
    ] },
    { id: 'hc.zl-t3', when: ZL, turns: [
      { beat: 'Team after team zips past {a} and {b} on the platform, grabbing tips, landing, running for the airport.' },
      { by: 'a', say: "Everybody else is getting it." },
      { by: 'b', say: "Everybody else isn't us. One more go." },
    ] },
  ],
  'task-done.any': [
    { id: 'hc.zl-dn1', when: ZL, turns: [
      { beat: "{a} and {b} land on the island, unclip, and run for the airport doors with the tip." },
      { by: 'b', say: "Our first leg's nearly done." },
      { by: 'a', say: "Not yet. Run, we can still pass somebody." },
    ] },
    { id: 'hc.zl-dn2', when: ZL, turns: [
      { by: 'b', say: "That was the best thing I've ever done. Can we get on a plane now?" },
      { by: 'a', say: "Once we've checked in with Don." },
      { by: 'b', say: "Then let's go and check in with Don." },
    ] },
    { id: 'hc.zl-dn3', when: ZL, turns: [
      { beat: "{a} lands in a heap, rolls, and stands up holding the tip high over {a.posAdj} head." },
      { by: 'b', say: "Are you hurt?" },
      { by: 'a', say: "No. Come on, let's find Don." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'hc.zl-x1', when: ZL, turns: [
      { beat: "{a} reaches for the tip, misses by an inch, and sails right past it." },
      { by: 'a', say: "No! I have to go back up!" },
      { by: 'b', say: "Go on. I'll be at the top with your harness ready." },
    ] },
    { id: 'hc.zl-x2', when: ZL, turns: [
      { beat: "{a} swings, spins, and the line dips {a.obj} straight into the lake." },
      { by: 'a', say: "It's freezing! It's absolutely freezing!" },
      { by: 'b', say: "Did you get the tip?" },
      { by: 'a', say: "No. I have to go again." },
    ] },
    { id: 'hc.zl-x3', when: ZL, turns: [
      { beat: "{b} closes {b.posAdj} eyes on the way down and goes straight past the pole." },
      { by: 'a', say: "Did you have your eyes shut?" },
      { by: 'b', say: "Yes. I'll keep them open this time." },
    ] },
  ],
};

export default mergePools(place, tower, zipline);
