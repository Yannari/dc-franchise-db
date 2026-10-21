// Skyline City's finale challenges, stage by stage (js/rr/places/skyline-finale.js `stages`; director.js stageBeats).
//   the stairs  the-lobby -> first-flights -> last-flights -> the-briefcase        (both partners to the top)
//   the buoys   row-out -> buoy-hunt -> read-number -> the-lock -> case-open        (the three numbers that open the case)
// A partner who stops to rest keeps the team on the stairs; a wrong combination means rowing out again. This is the last
// leg: a million dollars on it, and the lines know it.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the stairs ──
    { id: 'sky.st.lb1', when: at('tower-stairs', 'the-lobby'), turns: [
      beat('They burst into the skyscraper lobby and run straight past the elevators to the stairwell door.'),
      by('b', "Eighty-six flights. We can do eighty-six flights."),
      by('a', "This is the last leg. We can do anything."),
    ] },
    { id: 'sky.st.lb2', when: at('tower-stairs', 'the-lobby'), turns: [
      by('a', "Don't look at the elevator. Don't even look at it."),
      beat('They push through the stairwell door and start climbing.'),
      by('b', "A million dollars at the top. Think about that."),
    ] },
    { id: 'sky.st.ff1', when: at('tower-stairs', 'first-flights'), turns: [
      beat('Flight after flight, the stairwell goes round and round, grey and echoing.'),
      by('b', "What floor are we on?"),
      by('a', "Twenty. Don't think about the other sixty-six."),
    ] },
    { id: 'sky.st.ff2', when: at('tower-stairs', 'first-flights'), turns: [
      by('a', "Steady. Same speed. Don't sprint."),
      beat('They climb side by side, breathing hard, one hand on the rail.'),
      by('b', "We've come this far. We're not stopping now."),
    ] },
    { id: 'sky.st.lf1', when: at('tower-stairs', 'last-flights'), turns: [
      beat('By floor seventy, every step is heavy, and they\'re pulling themselves up by the rail.'),
      by('b', "I can't feel my legs."),
      by('a', "Me neither. Keep going. Sixteen more."),
    ] },
    { id: 'sky.st.lf2', when: at('tower-stairs', 'last-flights'), turns: [
      by('a', "I can see the door. There's a door at the top."),
      by('b', "That's it! That's the deck!"),
      beat('They find one last burst of energy and take the final flight two steps at a time.'),
    ] },
    { id: 'sky.st.bc1', when: at('tower-stairs', 'the-briefcase'), turns: [
      beat('On the observation deck, the wind is cold, the whole city is far below, and a briefcase with their names on it waits by the railing.'),
      by('b', "It's got our names on it."),
      by('a', "Grab it. Read the tip. Go."),
    ] },
    { id: 'sky.st.bc2', when: at('tower-stairs', 'the-briefcase'), turns: [
      by('a', "Look at that. Look at the whole city."),
      by('b', "We'll look at it later. When we've won."),
      beat('{b} grabs the briefcase, and they head back down.'),
    ] },

    // ── the buoys ──
    { id: 'sky.st.ro1', when: at('buoys', 'row-out'), turns: [
      beat('At the boathouse, they jump into a rowing boat and push off into the park lake.'),
      by('a', "You row, I'll look for numbers."),
      by('b', "Why do I always row?"),
      by('a', "Because you're better at it. Row!"),
    ] },
    { id: 'sky.st.ro2', when: at('buoys', 'row-out'), turns: [
      by('b', "Three numbers. On three buoys. Out of all of those."),
      beat('There are dozens of buoys bobbing on the lake, each with a number painted on it.'),
      by('a', "Then let's start looking."),
    ] },
    { id: 'sky.st.bh1', when: at('buoys', 'buoy-hunt'), turns: [
      beat('They row from buoy to buoy, {a} leaning out over the side to read each one.'),
      by('a', "Seven. Twelve. Four. None of these mean anything."),
      by('b', "They have to be somewhere. Keep reading."),
    ] },
    { id: 'sky.st.bh2', when: at('buoys', 'buoy-hunt'), turns: [
      by('b', "That one has a little flag on it. Like on our briefcase."),
      beat('They row over, and the buoy has their team\'s colour on its flag.'),
      by('a', "That's one of ours! Two more!"),
    ] },
    { id: 'sky.st.rn1', when: at('buoys', 'read-number'), turns: [
      beat('{a} grabs the buoy, pulls it close, and reads the number painted on it.'),
      by('a', "Nine. It's a nine. Write it down."),
      by('b', "I'm not writing it down. I'll remember it. Nine."),
    ] },
    { id: 'sky.st.rn2', when: at('buoys', 'read-number'), turns: [
      by('b', "What's on that one?"),
      by('a', "Three. Nine, five, three. That's all three."),
      beat('{b} turns the boat around and rows hard for the dock.'),
    ] },
    { id: 'sky.st.lk1', when: at('buoys', 'the-lock'), turns: [
      beat('On the dock, {a} spins the dials on the briefcase lock with shaking fingers.'),
      by('b', "Nine, five, three."),
      beat('The lock clicks open.'),
    ] },
    { id: 'sky.st.lk2', when: at('buoys', 'the-lock'), turns: [
      by('a', "Which order? Does the order matter?"),
      by('b', "Try the order we found them in."),
      beat('{a} tries it, and the briefcase pops open.'),
    ] },
    { id: 'sky.st.co1', when: at('buoys', 'case-open'), turns: [
      beat('Inside the briefcase is the last tip: run to the stage.'),
      by('b', "This is it. This is the end."),
      by('a', "Then let's run. As fast as we've ever run."),
    ] },
    { id: 'sky.st.co2', when: at('buoys', 'case-open'), turns: [
      by('a', "The stage. Everyone's waiting at the stage."),
      by('b', "Everyone we beat. Come on."),
      beat('They leave the boat at the dock and run.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the stairs ──
    { id: 'sky.sf.ff1', when: at('tower-stairs', 'first-flights'), turns: [
      beat('On floor thirty, {b} stops, grabs the rail and bends over, breathing hard.'),
      by('b', "One minute. Just one minute."),
      by('a', "We don't have a minute! Other teams are behind us!"),
    ] },
    { id: 'sky.sf.ff2', when: at('tower-stairs', 'first-flights'), turns: [
      by('a', "We went out too fast. I can't breathe."),
      beat('They sit down on the stairs, and somebody\'s footsteps come pounding up from below.'),
      by('b', "Get up. Get up, they're coming."),
    ] },
    { id: 'sky.sf.lf1', when: at('tower-stairs', 'last-flights'), turns: [
      beat('Ten floors from the top, {a}\'s legs simply stop, and {a} sits down hard on the step.'),
      by('b', "No, no, no. Not now. We're so close."),
      by('a', "I know. I know. Give me ten seconds."),
    ] },
    { id: 'sky.sf.lf2', when: at('tower-stairs', 'last-flights'), turns: [
      by('b', "I'm cramping. My leg's cramping."),
      beat('{b} sits on the stairs, rubbing the cramp out of {b.posAdj} calf, while {a} waits on the landing above.'),
      by('a', "Come on. Please. It's the last leg."),
    ] },

    // ── the buoys ──
    { id: 'sky.sf.ro1', when: at('buoys', 'row-out'), turns: [
      beat('They run to the boathouse on the wrong side of the lake. There are no boats there, just a man selling candy floss.'),
      by('a', "This isn't it!"),
      by('b', "Run! The other side!"),
    ] },
    { id: 'sky.sf.ro2', when: at('buoys', 'row-out'), turns: [
      by('a', "Why are we going in circles?"),
      by('b', "Because you're only rowing with one oar!"),
      beat('They spin round twice before they get both oars going.'),
    ] },
    { id: 'sky.sf.bh1', when: at('buoys', 'buoy-hunt'), turns: [
      beat('They row out to a buoy, read the number, and realise they\'ve already been to this one.'),
      by('b', "We've been here. We've been to this exact buoy."),
      by('a', "They all look the same!"),
    ] },
    { id: 'sky.sf.bh2', when: at('buoys', 'buoy-hunt'), turns: [
      by('a', "Seven! That's ours!"),
      by('b', "That's a different team's flag. Look at the colour."),
      beat('They row on, looking for their own colour.'),
    ] },
    { id: 'sky.sf.rn1', when: at('buoys', 'read-number'), turns: [
      beat('The buoy is spinning in the water, and {a} reads the number upside down.'),
      by('a', "Six. It's a six."),
      beat('It\'s a nine.'),
    ] },
    { id: 'sky.sf.rn2', when: at('buoys', 'read-number'), turns: [
      by('b', "What was the second number? Was it five or two?"),
      by('a', "You said you'd remember!"),
      beat('They row back out to check.'),
    ] },
    { id: 'sky.sf.lk1', when: at('buoys', 'the-lock'), turns: [
      beat('{a} spins the dials and pulls the latch. It doesn\'t open.'),
      by('b', "Try it again. Slowly."),
      by('a', "It's wrong. One of the numbers is wrong. Back out."),
    ] },
    { id: 'sky.sf.lk2', when: at('buoys', 'the-lock'), turns: [
      by('a', "Nine, three, five?"),
      by('b', "Nine, five, three!"),
      beat('Neither one works. They have missed a buoy, and they have to row out again.'),
    ] },
  ],
};
