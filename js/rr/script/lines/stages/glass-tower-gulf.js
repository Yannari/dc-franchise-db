// Glass Tower Gulf's Either/Or, stage by stage (js/rr/places/glass-tower-gulf.js `stages`; director.js stageBeats).
//   Squeegee  harness-up -> the-drop -> wash -> the-column -> squeegee-tip     (both on the platform, down the glass)
//   Serve     racket-up -> the-serve -> the-return -> serve-tip                (the launcher across the net)
// A streaky pane is washed again; a ball that goes out is served again.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const T = 'squeegee-serve';

export default {
  'task-stage.ok': [
    // ── Squeegee ──
    { id: 'gtg.st.hu1', when: at(T, 'harness-up'), turns: [
      beat('On the roof of the glass tower, a worker clips {a} and {b} into harnesses and points at the edge, and the edge is the edge of everything.'),
      by('b', "How high up are we?"),
      by('a', "Don't ask me that right now."),
    ] },
    { id: 'gtg.st.hu2', when: at(T, 'harness-up'), turns: [
      by('a', "Harness tight? Clip done up? Helmet on?"),
      by('b', "Yes. You've asked me that three times."),
      by('a', "I know. I'm nervous."),
    ] },
    { id: 'gtg.st.dr1', when: at(T, 'the-drop'), turns: [
      beat('The platform jerks, drops a foot, and then starts lowering slowly down the outside of the tower, swinging gently in the wind.'),
      by('b', "It's swinging. Why is it swinging?"),
      by('a', "It's hanging off a building. Just hold the rail."),
    ] },
    { id: 'gtg.st.dr2', when: at(T, 'the-drop'), turns: [
      by('a', "Look at the view. You can see the whole city."),
      by('b', "I'm not looking. I'm just looking at the window."),
      beat('The platform stops beside the first pane of glass with a little bump.'),
    ] },
    { id: 'gtg.st.wa1', when: at(T, 'wash'), turns: [
      beat('{a} soaps the pane, {b} squeegees it, and the glass comes up shining like a mirror.'),
      by('a', "Look at that! It's so shiny!"),
      by('b', "I can see my face. I look terrified."),
    ] },
    { id: 'gtg.st.wa2', when: at(T, 'wash'), turns: [
      by('b', "Top to bottom, one long stroke. Then wipe the blade."),
      by('a', "How do you know how to do this?"),
      by('b', "I washed cars one summer. Same thing, just higher."),
    ] },
    { id: 'gtg.st.wa3', when: at(T, 'wash'), turns: [
      beat('On the other side of the glass, a hotel guest in a bathrobe looks up from breakfast and stares at them.'),
      by('a', "Morning!"),
      beat('The guest closes the curtains.'),
    ] },
    { id: 'gtg.st.co1', when: at(T, 'the-column'), turns: [
      beat('Pane after pane, the platform inches down the face of the tower, leaving a long, shining stripe of clean glass above it.'),
      by('b', "We're getting good at this."),
      by('a', "We're getting faster, anyway."),
    ] },
    { id: 'gtg.st.co2', when: at(T, 'the-column'), turns: [
      by('a', "How many more?"),
      by('b', "Twelve. Don't count. It makes it worse."),
      beat('They wash the next one, and the next, and the next, until their arms ache and the whole column sparkles.'),
    ] },
    { id: 'gtg.st.st1', when: at(T, 'squeegee-tip'), turns: [
      beat('The platform winches back up to the roof, and an inspector runs a white glove down the column of glass and finds nothing on it.'),
      by('b', "Clean! Totally clean!"),
      by('a', "Great. Give me the tip. I want solid ground."),
    ] },
    { id: 'gtg.st.st2', when: at(T, 'squeegee-tip'), turns: [
      by('a', "Solid ground. I've never been so happy to stand on a floor."),
      by('b', "\"Take a taxi to the gold market.\" Can you walk to a taxi?"),
      beat('{a} can walk to a taxi, but only by holding onto {b}\'s arm all the way.'),
    ] },

    // ── Serve ──
    { id: 'gtg.st.ru1', when: at(T, 'racket-up'), turns: [
      beat('The rooftop court looks out over the sea, and across the net sits the launcher, a squat, humming machine with a ball loaded in its mouth.'),
      by('a', "It's just a ball machine. How hard can it be?"),
      by('b', "It says it's the toughest one in the world."),
    ] },
    { id: 'gtg.st.ru2', when: at(T, 'racket-up'), turns: [
      by('b', "I played tennis once at school. It didn't go well."),
      by('a', "Just hit it back over. That's all."),
      beat('They take a racket each and get into position on the baseline.'),
    ] },
    { id: 'gtg.st.sv1', when: at(T, 'the-serve'), turns: [
      beat('The launcher whirs, clicks, and fires. The ball comes over the net like a cannonball, and {a} swings, and somehow, the racket finds it.'),
      by('b', "You hit it! You touched it!"),
      by('a', "I hit it! My arm's numb, but I hit it!"),
    ] },
    { id: 'gtg.st.sv2', when: at(T, 'the-serve'), turns: [
      by('a', "Watch its mouth. When the light goes red, it fires."),
      beat('The light goes red. {b} is already moving before the ball comes out, racket up, and gets a clean piece of it.'),
      by('b', "Ha! I knew it was coming!"),
    ] },
    { id: 'gtg.st.rt1', when: at(T, 'the-return'), turns: [
      beat('The ball flies back over the net, drops inside the line, and bounces past the launcher before it can do anything about it.'),
      by('a', "In! It was in! Was it in?"),
      by('b', "It was in! We beat the machine!"),
    ] },
    { id: 'gtg.st.rt2', when: at(T, 'the-return'), turns: [
      by('b', "Not too hard. Just over the net and in."),
      beat('{b} taps it back over the net, slow and soft, and it lands just inside the far line.'),
      by('a', "That was so soft. And it worked!"),
    ] },
    { id: 'gtg.st.vt1', when: at(T, 'serve-tip'), turns: [
      beat('The launcher powers down with a sad little whine, and a hatch in its side opens to show the tip.'),
      by('a', "Ha! Good game."),
      by('b', "Don't gloat. Let's go."),
    ] },
    { id: 'gtg.st.vt2', when: at(T, 'serve-tip'), turns: [
      by('b', "\"Take a taxi to the gold market.\" Gold!"),
      by('a', "I'm never playing tennis again. I'm retiring undefeated."),
      beat('They leave the rackets on the court and run for the lift.'),
    ] },
  ],

  'task-stage.fail': [
    // ── Squeegee ──
    { id: 'gtg.sf.hu1', when: at(T, 'harness-up'), turns: [
      beat('{b} gets one leg over the edge of the roof, looks down, and brings it straight back again.'),
      by('b', "Not yet. Give me a minute."),
      by('a', "We don't have a minute!"),
    ] },
    { id: 'gtg.sf.hu2', when: at(T, 'harness-up'), turns: [
      by('a', "Why are you lying flat on the roof?"),
      by('b', "It feels safer down here."),
      beat('The worker waits, very patiently, holding the platform door open.'),
    ] },
    { id: 'gtg.sf.dr1', when: at(T, 'the-drop'), turns: [
      beat('A gust of wind catches the platform and swings it out from the glass, then back against it with a bump.'),
      by('b', "Up! Take us up! I want to go up!"),
      by('a', "We can't go up. We haven't washed anything yet."),
    ] },
    { id: 'gtg.sf.dr2', when: at(T, 'the-drop'), turns: [
      by('a', "Why have we stopped?"),
      by('b', "I pressed stop. I don't know which one's go."),
      beat('They spend a long time hanging very still beside a window, pressing buttons.'),
    ] },
    { id: 'gtg.sf.wa1', when: at(T, 'wash'), turns: [
      beat('{a} steps back to admire the pane, and in the sunlight it is covered in long, wavy, soapy streaks.'),
      by('a', "It looked clean from close up!"),
      by('b', "It's all streaky. Do it again."),
    ] },
    { id: 'gtg.sf.wa2', when: at(T, 'wash'), turns: [
      by('b', "Why is it getting dirtier?"),
      by('a', "The water's dirty. We're just making it worse."),
      beat('They have to wash the whole pane again, with fresh water this time.'),
    ] },
    { id: 'gtg.sf.wa3', when: at(T, 'wash'), turns: [
      beat('{b} drops the squeegee. It falls a very, very long way, and they both watch it go.'),
      by('b', "I'm so sorry."),
      by('a', "Use your sleeve, then."),
    ] },
    { id: 'gtg.sf.co1', when: at(T, 'the-column'), turns: [
      by('a', "Wait. Did we miss one? That one looks dirty."),
      beat('They look up. One pane, right in the middle of the column, is still grey.'),
      by('b', "We have to go back up for one window."),
    ] },
    { id: 'gtg.sf.co2', when: at(T, 'the-column'), turns: [
      beat('A seagull lands on the platform rail, looks at {a}, and then flies off, leaving something white on the window they just cleaned.'),
      by('a', "No. No! I just cleaned that!"),
      by('b', "Get the squeegee."),
    ] },

    // ── Serve ──
    { id: 'gtg.sf.sv1', when: at(T, 'the-serve'), turns: [
      beat('The launcher fires. {a} swings. The ball is already past {a.obj} and bouncing off the back fence by the time the racket moves.'),
      by('a', "I didn't even see it."),
      by('b', "It served. You missed."),
    ] },
    { id: 'gtg.sf.sv2', when: at(T, 'the-serve'), turns: [
      by('b', "Get ready. Here it comes."),
      beat('The ball hits {b} right in the stomach, and {b} sits down on the court, very suddenly.'),
      by('b', "Ow. That didn't count. I wasn't ready."),
    ] },
    { id: 'gtg.sf.sv3', when: at(T, 'the-serve'), turns: [
      beat('{a} swings so hard at the ball that {a.sub} spins right round in a full circle and misses it completely.'),
      by('b', "Nice spin."),
      by('a', "That was not on purpose."),
    ] },
    { id: 'gtg.sf.rt1', when: at(T, 'the-return'), turns: [
      beat('{a} hits the ball, and it soars up over the net, over the court, over the fence, and out into the sky over the sea.'),
      by('a', "Is that out?"),
      by('b', "That's way out."),
    ] },
    { id: 'gtg.sf.rt2', when: at(T, 'the-return'), turns: [
      by('b', "Just get it over the net!"),
      beat('{b} gets it into the net, very firmly. The ball drops and rolls back to {b}\'s feet.'),
      by('a', "Over the net, not into it."),
    ] },
  ],
};
