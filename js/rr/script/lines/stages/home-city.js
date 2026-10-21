// Home City's challenges, stage by stage (js/rr/places/home-city.js `stages`; director.js stageBeats).
//   Stairs     stairwell -> burn -> last-flights -> stairs-top     (all 144 flights on foot)
//   Sky-deck   elevator -> clip-on -> rail -> deck-top             (the slow elevator, then the outside deck in the wind)
//   the zip    clip-in -> over-lake -> grab-tip -> landing          (tower to the island airport, the tip on the line)
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the stairs ──
    { id: 'hc.st.sw1', when: at('tower', 'stairwell'), turns: [
      beat('{a} hauls open the heavy stairwell door. A sign on the wall says FLIGHT 1 OF 144.'),
      by('b', "Why would they put that on a sign?"),
      by('a', "So we know how much longer we have to suffer."),
      beat('They take the first steps two at a time.'),
    ] },
    { id: 'hc.st.sw2', when: at('tower', 'stairwell'), turns: [
      by('a', "Let's pace ourselves. Nice and steady. Whoever goes out fast is dead by flight forty."),
      by('b', "Okay. Nice and steady."),
      beat('A team behind them thunders past, taking the steps three at a time.'),
      by('b', "They're going to die on flight forty, right?"),
      by('a', "That's what I'm hoping."),
    ] },
    { id: 'hc.st.sw3', when: at('tower', 'stairwell'), turns: [
      beat('The stairwell is concrete, grey and echoing, and it smells of whoever climbed it last.'),
      by('b', "I took the stairs at work once. Ten floors. I still remember it."),
      by('a', "This is a hundred and forty-four."),
    ] },
    { id: 'hc.st.bu1', when: at('tower', 'burn'), turns: [
      beat('Somewhere around flight sixty, the talking stops. There is only breathing, and the slap of feet on concrete.'),
      by('b', "How many more?"),
      by('a', "Don't ask me that."),
      beat('They keep climbing.'),
    ] },
    { id: 'hc.st.bu2', when: at('tower', 'burn'), turns: [
      by('a', "I can't feel my legs anymore."),
      by('b', "Use your arms. Pull on the rail."),
      beat('{a} grabs the handrail and drags {a.ref} up one flight, then another, like someone climbing a rope.'),
      by('a', "Okay. That's actually working."),
    ] },
    { id: 'hc.st.bu3', when: at('tower', 'burn'), turns: [
      beat('{b} starts counting the flights out loud to keep going.'),
      by('b', "Seventy-one. Seventy-two. Seventy-three."),
      by('a', "Could you count in your head?"),
      by('b', "If I count in my head, I'll stop."),
      by('a', "Then count out loud. Count really loud."),
    ] },
    { id: 'hc.st.lf1', when: at('tower', 'last-flights'), turns: [
      beat('FLIGHT 140, says the wall. {a} and {b} look at the sign as if it were an old friend.'),
      by('b', "Four more. Only four more."),
      by('a', "Four. I can do four."),
    ] },
    { id: 'hc.st.lf2', when: at('tower', 'last-flights'), turns: [
      by('a', "I can hear wind. Why can I hear wind?"),
      by('b', "Because we're at the top of a tower! We made it!"),
      beat('They take the last flight on their hands and knees, and don\'t care who sees it.'),
    ] },
    { id: 'hc.st.lf3', when: at('tower', 'last-flights'), turns: [
      beat('With ten flights to go, {b} grabs {a}\'s hand and pulls.'),
      by('b', "Come on. We're not sitting down this close."),
      by('a', "I wasn't going to sit down."),
      by('b', "You were looking at that step like it was a bed."),
    ] },
    { id: 'hc.st.st1', when: at('tower', 'stairs-top'), turns: [
      beat('They stagger out of the stairwell into the bright glass room at the top. The whole city lies far below.'),
      by('b', "Look at that view."),
      by('a', "Later. Where's the tip?"),
      beat('The tip box sits by the window. {a} grabs one.'),
    ] },
    { id: 'hc.st.st2', when: at('tower', 'stairs-top'), turns: [
      by('a', "We climbed all of that."),
      by('b', "I know. I can't feel my legs. Where's the tip?"),
      beat('{b} tears it open with shaking hands.'),
    ] },
    // ── the Sky-deck ──
    { id: 'hc.st.el1', when: at('tower', 'elevator'), turns: [
      beat('The elevator takes two teams at a time, and it climbs very, very slowly.'),
      by('a', "This is supposed to be the fastest elevator in the city."),
      by('b', "Doesn't feel like it."),
      beat('Soft music plays. Nobody in the elevator speaks.'),
    ] },
    { id: 'hc.st.el2', when: at('tower', 'elevator'), turns: [
      by('b', "Good call on the elevator. No stairs."),
      by('a', "Yeah, but it goes to the part where we walk around the outside."),
      by('b', "Oh. I forgot about that part."),
      by('a', "Yeah."),
    ] },
    { id: 'hc.st.el3', when: at('tower', 'elevator'), turns: [
      beat('{a} watches the numbers climb above the elevator door and pops {a.posAdj} ears.'),
      by('a', "My ears just popped. Is that normal?"),
      by('b', "It means we're really high up."),
    ] },
    { id: 'hc.st.cl1', when: at('tower', 'clip-on'), turns: [
      beat('At the door to the outside deck, a crew member hands them each a harness and a helmet.'),
      by('b', "Two clips. Always one on the rail. That's the rule."),
      by('a', "What happens if both clips are off?"),
      by('b', "Don't let that happen."),
      beat('{a} checks both clips three times.'),
    ] },
    { id: 'hc.st.cl2', when: at('tower', 'clip-on'), turns: [
      by('a', "Does this helmet make my head look big?"),
      by('b', "You look fine. Clip on."),
      beat('Click, click. They\'re on the rail.'),
    ] },
    { id: 'hc.st.cl3', when: at('tower', 'clip-on'), turns: [
      beat('The door opens. The wind comes straight in, and both of them lean back from it.'),
      by('b', "Is it always like this out there?"),
      by('a', "I guess so. It's really high up."),
    ] },
    { id: 'hc.st.ra1', when: at('tower', 'rail'), turns: [
      beat('Out on the edge, the wind tugs at their clothes. The street is so far down that the cars look like crumbs.'),
      by('b', "Don't look down."),
      by('a', "You just looked down."),
      by('b', "Yeah. That's how I know not to."),
    ] },
    { id: 'hc.st.ra2', when: at('tower', 'rail'), turns: [
      by('a', "Slide the clip, step, slide the clip, step."),
      by('b', "Slide, step. Slide, step."),
      beat('They shuffle round the deck together, never letting go of the rail.'),
      by('a', "We're actually doing it. We're on the outside of a building."),
    ] },
    { id: 'hc.st.ra3', when: at('tower', 'rail'), turns: [
      beat('Halfway round, the wind drops for a moment, and the whole lake opens up below them.'),
      by('b', "Okay, that's beautiful."),
      by('a', "It is. Can we go inside now?"),
    ] },
    { id: 'hc.st.dt1', when: at('tower', 'deck-top'), turns: [
      beat('They unclip at the far door and fall through it into the warm glass room.'),
      by('a', "Floor. Real floor."),
      by('b', "Tip first. Then you can lie on it."),
    ] },
    { id: 'hc.st.dt2', when: at('tower', 'deck-top'), turns: [
      by('b', "We walked all the way around the outside of a tower."),
      by('a', "I'm telling everyone about this."),
      beat('{a} takes the next tip from the box by the window.'),
    ] },
    // ── the zipline ──
    { id: 'hc.st.ci1', when: at('zipline', 'clip-in'), turns: [
      beat('At the top, a thin cable runs from the tower all the way across the lake to the little island airport.'),
      by('a', "We're going down that? On a wire?"),
      by('b', "It's a cable. It's really strong."),
      by('a', "That doesn't really help."),
    ] },
    { id: 'hc.st.ci2', when: at('zipline', 'clip-in'), turns: [
      by('b', "There's a tip halfway down the line. We grab it on the way past."),
      by('a', "While we're flying?"),
      by('b', "Yep. Get your hand ready."),
      beat('They clip their trolleys onto the cable.'),
    ] },
    { id: 'hc.st.ci3', when: at('zipline', 'clip-in'), turns: [
      beat('{a} grips the trolley handles so hard {a.posAdj} knuckles go white.'),
      by('a', "On three. One. Two."),
      beat('{b} pushes off on two.'),
    ] },
    { id: 'hc.st.ol1', when: at('zipline', 'over-lake'), turns: [
      beat('They fly out from the tower, the lake rushing past underneath, the wind roaring in their ears.'),
      by('a', "This is amazing!"),
      by('b', "I can't hear you! But yes!"),
    ] },
    { id: 'hc.st.ol2', when: at('zipline', 'over-lake'), turns: [
      by('b', "There's a boat down there! Hi!"),
      beat('A sailing boat drifts below them. Someone on deck waves back.'),
      by('a', "Stop waving and watch for the tip!"),
    ] },
    { id: 'hc.st.ol3', when: at('zipline', 'over-lake'), turns: [
      beat('{a} screams for the first few seconds, then realises it\'s actually fun and screams with joy instead.'),
      by('a', "I'm not scared any more! I'm flying!"),
      by('b', "Enjoy it! It's nearly over!"),
    ] },
    { id: 'hc.st.gt1', when: at('zipline', 'grab-tip'), turns: [
      beat('Halfway across, a tip dangles from the cable, spinning in the wind.'),
      by('b', "There it is! Reach! Reach!"),
      beat('{a} stretches out one arm and snatches it as they whizz past.'),
      by('a', "Got it! I've got it!"),
    ] },
    { id: 'hc.st.gt2', when: at('zipline', 'grab-tip'), turns: [
      by('a', "Coming up! It's coming up fast!"),
      by('b', "I've got it! I've got it!"),
      beat('{b} grabs the tip and clutches it to {b.posAdj} chest for the rest of the ride.'),
    ] },
    { id: 'hc.st.gt3', when: at('zipline', 'grab-tip'), turns: [
      beat('The tip flutters towards them. {a} and {b} both reach for it at once.'),
      by('a', "Mine!"),
      by('b', "Ours! It's ours!"),
      beat('They get it between them, one corner each.'),
    ] },
    { id: 'hc.st.la1', when: at('zipline', 'landing'), turns: [
      beat('The cable slows at the island end, and they bump to a stop beside the little airport.'),
      by('b', "Solid ground. I love solid ground."),
      by('a', "Read the tip. The Chill Zone's got to be close."),
    ] },
    { id: 'hc.st.la2', when: at('zipline', 'landing'), turns: [
      by('a', "Can we go again? Just once? For fun?"),
      by('b', "We're in a race."),
      by('a', "Right. Later, though."),
      beat('They unclip and run for the airport.'),
    ] },
  ],
  'task-stage.fail': [
    // ── the stairs ──
    { id: 'hc.sf.sw1', when: at('tower', 'stairwell'), turns: [
      beat('{a} and {b} charge up ten flights before {b} notices the sign says SERVICE STAIRS. THIS LEVEL ONLY.'),
      by('b', "These stairs don't go to the top."),
      by('a', "Then where do they go?"),
      by('b', "The kitchens, apparently."),
      beat('They clatter back down to find the right stairwell.'),
    ] },
    { id: 'hc.sf.sw2', when: at('tower', 'stairwell'), turns: [
      by('a', "We go out fast. We get ahead of everybody."),
      beat('They sprint the first twenty flights, then both stop, bent double, on the same landing.'),
      by('b', "That was a terrible plan."),
      by('a', "It worked for about twenty flights."),
    ] },
    { id: 'hc.sf.bu1', when: at('tower', 'burn'), turns: [
      beat('On flight eighty-something, {a}\'s legs simply stop. {a.Sub} sits down on the step.'),
      by('a', "Give me a minute. Just one minute."),
      by('b', "Teams are passing us!"),
      by('a', "Let them. My legs won't move."),
      beat('They lose minutes on the landing before {a} can stand.'),
    ] },
    { id: 'hc.sf.bu2', when: at('tower', 'burn'), turns: [
      by('b', "Cramp! I've got a cramp!"),
      beat('{b} grabs {b.posAdj} calf and hops in a circle on the landing.'),
      by('a', "Point your toes up! Up, not down!"),
      by('b', "I can't! It hurts!"),
      beat('It takes a long, painful while before they can climb again.'),
    ] },
    { id: 'hc.sf.bu3', when: at('tower', 'burn'), turns: [
      beat('{a} and {b} lie flat on a landing, staring at the ceiling, breathing like old bellows.'),
      by('b', "If we lie here long enough, do you think they'll send the elevator?"),
      by('a', "No. Get up."),
      by('b', "You get up first."),
    ] },
    { id: 'hc.sf.lf1', when: at('tower', 'last-flights'), turns: [
      beat('With the top almost in sight, {b} misses a step and goes down hard on {b.posAdj} knees.'),
      by('a', "Are you okay?"),
      by('b', "I'm fine. That was embarrassing, but I'm fine."),
      beat('{a} helps {b} up, and they go on more slowly.'),
    ] },
    { id: 'hc.sf.lf2', when: at('tower', 'last-flights'), turns: [
      by('a', "That's the top. That's the door to the top."),
      beat('{a} pushes it. It\'s a cupboard full of mops.'),
      by('b', "That's not the top."),
      by('a', "No. It's a cupboard. Keep climbing."),
    ] },
    // ── the Sky-deck ──
    { id: 'hc.sf.cl1', when: at('tower', 'clip-on'), turns: [
      beat('{a} clips both carabiners onto {a.posAdj} own belt loop instead of the rail.'),
      by('b', "You're clipped to yourself!"),
      by('a', "Oh. Well, at least I'm safe."),
      beat('The crew member makes them take everything off and start the check again.'),
    ] },
    { id: 'hc.sf.cl2', when: at('tower', 'clip-on'), turns: [
      by('b', "My helmet doesn't fit."),
      beat('It is on backwards. Then it is on sideways. Then the crew member takes it and does it for {b.obj}.'),
      by('a', "We just lost time because of a helmet."),
    ] },
    { id: 'hc.sf.ra1', when: at('tower', 'rail'), turns: [
      beat('A gust hits the deck. {a} freezes, both hands locked around the rail.'),
      by('b', "You have to move. Slide the clip."),
      by('a', "I can't. My hands won't let go."),
      beat('The crew calls it. They\'re walked back to the start of the rail to try again.'),
      by('a', "Okay. I'm moving. I'm moving."),
    ] },
    { id: 'hc.sf.ra2', when: at('tower', 'rail'), turns: [
      by('a', "Both clips! You've got both clips off!"),
      by('b', "I was moving one and the other one slipped!"),
      beat('A whistle blows. Rules are rules: back to the start of the deck.'),
      by('b', "I'm sorry. I'm so sorry."),
    ] },
    { id: 'hc.sf.ra3', when: at('tower', 'rail'), turns: [
      beat('Halfway round, {b} sits down on the deck, back against the glass, and refuses to stand.'),
      by('b', "I'm not moving. I live here now."),
      by('a', "You can't stay out here."),
      beat('By the time {a} coaxes {b} back up, the crew has sent them back to the start.'),
    ] },
    // ── the zipline ──
    { id: 'hc.sf.ci1', when: at('zipline', 'clip-in'), turns: [
      beat('{a} clips the trolley on upside down. The crew member flips it round without a word.'),
      by('a', "I knew that. I was checking."),
      by('b', "Sure you were."),
    ] },
    { id: 'hc.sf.ci2', when: at('zipline', 'clip-in'), turns: [
      by('b', "I'm not going. You go first. I'll be right behind you."),
      by('a', "You said that at the pool when we were kids. You never jumped."),
      beat('Team after team pushes off past them while {b} stands at the edge.'),
    ] },
    { id: 'hc.sf.ol1', when: at('zipline', 'over-lake'), turns: [
      beat('{a} stops dead in the middle of the line, dangling over the water, not quite heavy enough to reach the end.'),
      by('a', "Why have I stopped?"),
      by('b', "Pull yourself along! Hand over hand!"),
      beat('{a} hauls {a.ref} along the cable, very slowly, while the boats below enjoy the show.'),
    ] },
    { id: 'hc.sf.ol2', when: at('zipline', 'over-lake'), turns: [
      beat('Halfway out, {b} spins round on the trolley and ends up going backwards.'),
      by('b', "I can't see where I'm going!"),
      by('a', "You're going to the airport! Just hold on!"),
    ] },
    { id: 'hc.sf.gt1', when: at('zipline', 'grab-tip'), turns: [
      beat('The tip flutters past, a whole arm\'s length out of reach.'),
      by('b', "You missed it!"),
      by('a', "It moved! At the last second!"),
      beat('The line drags them all the way to the bottom anyway, and they have to climb back up for another run.'),
    ] },
    { id: 'hc.sf.gt2', when: at('zipline', 'grab-tip'), turns: [
      by('a', "Got it!"),
      beat('{a} opens {a.posAdj} fist. It\'s a handful of air. The tip is still spinning on the line behind them.'),
      by('b', "You grabbed air!"),
      beat('At the bottom, they start the long walk back up the tower.'),
    ] },
    { id: 'hc.sf.gt3', when: at('zipline', 'grab-tip'), turns: [
      beat('{b} catches the tip, juggles it, and watches it flutter down into the lake.'),
      by('b', "No, no, no, no!"),
      by('a', "Did you just drop the tip in the lake?"),
      beat('A crew boat fishes it out and puts another one on the line. Back to the top they go.'),
    ] },
  ],
};
