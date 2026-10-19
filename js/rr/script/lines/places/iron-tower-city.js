// Iron Tower City's own lines (js/rr/places/iron-tower-city.js), 1:1 with the real leg (Ridonculous Race ep. 3, the
// wiki's "French is an Eiffel Language"), written in our own words:
//   the caricature   Botch or Watch at the foot of the tower: one partner draws, the other poses, a local artist
//                    approves only a real caricature (four exaggerations, nothing flattering, never "too realistic").
//                    The partner posing has opinions about their own face.
//   the catacombs    All-In: a maze of tunnels lined with bones; follow your nose to the cheese, past the same skull
//                    twice, down dead ends, one partner's stomach making things worse.
//   the cheese raft  one wheel each, ridden down the river to the museum: forgotten oars, a partner eating the raft,
//                    a team that carries it instead.
// Gated on place / taskId / mishap (a place's own line wins whenever one fits). a does the Botch, b watches.
import { V, mergePools } from './_kit.js';

const P = { place: 'iron-tower-city' };
const CA = { taskId: 'caricature' };
const CT = { taskId: 'catacombs' };
const CR = { taskId: 'cheese-raft' };
const don = say => ({ by: 'don', say });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'itc.op1', when: P, turns: [
      { beat: 'Don stands on a bridge, the iron tower behind him, holding a coffee cup the size of a thimble.' },
      don("Iron Tower City! Home of the world's most famous painting, very romantic bridges, and coffee in cups for dolls."),
      { beat: 'He finishes the coffee in one sip and stares at the empty cup.' },
      don("Once they land, teams must take a cab to the iron tower to find their next tip. Last team to the Chill Zone may be eliminated. And somebody get me a real coffee."),
    ] },
    { id: 'itc.op2', when: P, turns: [
      don("Welcome to Iron Tower City, home of fine art, fine food, and a waiter who looked at my outfit and sighed."),
      { beat: 'He looks down at his outfit, then back at the camera.' },
      don("It's a great outfit. Teams must race to the iron tower, where one of them is about to find out how good they are at drawing."),
    ] },
  ],
  'don-opener.bored': [
    { id: 'itc.op3', when: P, turns: [
      { beat: 'A mime is doing a routine right next to Don. Don is trying very hard to ignore him.' },
      don("Iron Tower City. Home of art, love, and... him."),
      { beat: 'The mime pretends to be trapped in a box. Don does not react.' },
      don("Teams are on their way to the iron tower. I'm on my way anywhere he isn't."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'itc.ar1', when: P, turns: [
      { beat: 'The cab turns a corner, and there it is: the iron tower, enormous against the sky.' },
      { by: 'a', ...V("Oh my gosh. Oh my gosh. That's it. That's really it.", "That's it. That's really it.", "There it is.", "Oh my GOSH! That's IT! That's REALLY it!", "Oh my gosh, that's really it, isn't it?", "There it is. The most famous lump of iron in the world.") },
      { by: 'b', say: "I've had a poster of that on my wall since I was nine." },
      { by: 'a', say: "Don't cry in the cab. We'll cry at the top." },
    ] },
    { id: 'itc.ar2', when: P, turns: [
      { by: 'b', say: "Everybody here is so stylish. Look at them. Look at us." },
      { by: 'a', ...V("We look like we've slept in a desert. Because we did.", "We look like we slept in a desert.", "We slept in a desert.", "We LOOK like we've SLEPT in a DESERT! Because we DID!", "We look like we slept in a desert, because we did.", "We look like the before photo.") },
      { by: 'b', say: "Walk with confidence. Pretend it's a fashion choice." },
    ] },
    { id: 'itc.ar3', when: P, turns: [
      { by: 'a', say: "Smell that. Fresh bread. Everywhere smells of fresh bread." },
      { by: 'b', say: "We don't have time for bread." },
      { by: 'a', say: "There's always time for bread. I'm buying one at the first chance." },
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'itc.ad1', when: P, turns: [
      { by: 'b', say: "I don't speak the language. Do you speak the language?" },
      { by: 'a', ...V("I know how to say hello, thank you, and I would like a croissant.", "Hello, thank you, and croissant.", "Hello. Thank you. Croissant.", "I know HELLO, THANK YOU, and I would like a CROISSANT!", "I know how to say hello, thank you and I'd like a croissant.", "I can greet, thank, and order pastry. That's all.") },
      { by: 'b', say: "Then we're going to eat very well and get very lost." },
    ] },
    { id: 'itc.ad2', when: P, turns: [
      { beat: 'The traffic is ten lanes wide and nobody seems to be following any lanes at all.' },
      { by: 'a', say: "How does anybody drive here? There are no rules. There are just horns." },
      { by: 'b', say: "Don't look. Just let the driver do it. Close your eyes." },
    ] },
  ],
};

// ── the caricature (Botch or Watch at the iron tower) ──
const caricature = {
  'don-demo.gag': [
    { id: 'itc.ca-d1', when: CA, turns: [
      { beat: 'Don sits on a stool at the foot of the iron tower while a local artist sketches him.' },
      don("In this Botch or Watch, whoever didn't do the last one must draw a caricature of their partner. When this local artist approves of the drawing, they get their next tip."),
      { beat: 'The artist turns the easel round. Don\'s chin takes up most of the page.' },
      don("That's not a caricature. That's slander. My chin is perfect."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'itc.ca-d2', when: CA, turns: [
      don("The partner who skipped the last Botch or Watch picks up the charcoal. The other one sits, and poses, and tries not to be offended."),
      don("Our artist wants a real caricature. Big nose, big ears, big everything. Too realistic and it's back to a blank page."),
      { beat: 'He leans towards the camera.' },
      don("I asked for a nice one. Apparently there's no such thing."),
    ] },
  ],
  'whose-botch.obvious': [
    { id: 'itc.ca-w1', when: CA, turns: [
      { by: 'b', say: "It's drawing. You do the drawing. You draw on everything. You draw on napkins." },
      { by: 'a', ...V("Those were doodles. This is art.", "Doodles. This is art.", "That's doodling.", "Those were DOODLES! This is ART!", "Those were just doodles, though. This is art.", "Napkins are my sketchbook. This is the gallery.") },
      { by: 'b', say: "Then go and art." },
    ] },
  ],
  'whose-botch.volunteer': [
    { id: 'itc.ca-w2', when: CA, turns: [
      { by: 'a', say: "I'll draw you. I've always wanted to draw you." },
      { by: 'b', say: "That's sweet." },
      { by: 'a', say: "I've always wanted to draw your nose. Specifically." },
      { by: 'b', say: "That's less sweet." },
    ] },
  ],
  'whose-botch.pushed': [
    { id: 'itc.ca-w3', when: CA, turns: [
      { by: 'a', say: "You're drawing. I'm not drawing. I did the stew." },
      { by: 'b', ...V("I can't draw! I can't even draw a circle!", "I can't draw a circle!", "I can't draw. At all.", "I CAN'T draw! I can't even draw a CIRCLE!", "I can't draw. I can't even draw a circle properly.", "My circles have corners!") },
      { by: 'a', say: "Then draw me with corners. Go." },
    ] },
  ],
  'whose-botch.teaser-guess': [
    { id: 'itc.ca-w4', when: CA, turns: [
      { by: 'b', say: "'Who can draw?' What does that even mean? Draw what? Draw a sword?" },
      { by: 'a', say: "It's at the foot of a famous tower in an arty city. It means drawing." },
      { by: 'b', say: "Then it's you. My stick men lose their arms." },
    ] },
  ],
  'task-start.any': [
    { id: 'itc.ca-s1', when: CA, turns: [
      { beat: '{b} sits on the stool. {a} picks up the charcoal like it might bite.' },
      { by: 'b', say: "Make me look good." },
      { by: 'a', ...V("It's a caricature. I'm not allowed to make you look good.", "Not allowed to make you look good.", "It's not meant to look good.", "It's a CARICATURE! I'm NOT ALLOWED to make you look GOOD!", "It's a caricature. I'm not really allowed to make you look good.", "The rules forbid flattery.") },
    ] },
    { id: 'itc.ca-s2', when: CA, turns: [
      { by: 'a', say: "Okay. Four exaggerations. What's your biggest feature?" },
      { by: 'b', say: "My personality." },
      { by: 'a', say: "I can't draw a personality. I'm doing your eyebrows." },
    ] },
    { id: 'itc.ca-s3', when: CA, turns: [
      { beat: 'The artist hands {a} a fresh sheet and folds their arms.' },
      { by: 'a', say: "Is there a time limit?" },
      { by: 'b', ...V("There's a whole race behind us. That's the time limit.", "The teams behind us are the time limit.", "The other teams are the limit.", "There's a WHOLE RACE behind us! That's the TIME LIMIT!", "The teams behind us are the time limit, really.", "The time limit is everybody else.") },
    ] },
    { id: 'itc.ca-s4', when: CA, turns: [
      { by: 'b', say: "Do my good side." },
      { by: 'a', say: "Which one's your good side?" },
      { by: 'b', say: "That's the problem. I've never been sure." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'itc.ca-f1', when: CA, turns: [
      { beat: '{a} draws a huge head on a tiny body, with ears like dinner plates.' },
      { by: 'b', ...V("That is a horrible picture of me.", "That's horrible.", "That's awful.", "That is a HORRIBLE picture of me!", "That's a really horrible picture of me.", "That picture is a crime.") },
      { beat: 'The artist laughs out loud and hands over the tip.' },
      { by: 'a', say: "It's horrible, and it's perfect." },
    ] },
    { id: 'itc.ca-f2', when: CA, turns: [
      { by: 'a', say: "Big nose, big chin, tiny eyes, giant hair. Done." },
      { by: 'b', say: "Is that what you think I look like?" },
      { by: 'a', say: "It's what the artist thinks you look like. Look, they're nodding." },
    ] },
    { id: 'itc.ca-f3', when: CA, turns: [
      { beat: 'The artist looks at the drawing, looks at {b}, looks back at the drawing, and snorts.' },
      { by: 'b', say: "Why is everybody laughing? What did you draw?" },
      { by: 'a', ...V("You. I drew you. Accurately, but bigger.", "You. Accurately. But bigger.", "I drew you. Just bigger.", "YOU! I drew YOU! ACCURATELY, but BIGGER!", "I drew you. Accurately, just bigger.", "The truth, enlarged.") },
    ] },
    { id: 'itc.ca-f4', when: CA, turns: [
      { by: 'b', say: "That was quick. You barely looked at me." },
      { by: 'a', say: "I've looked at you every day for years. I didn't need to look." },
      { by: 'b', say: "That's either very sweet or very insulting." },
      { by: 'a', say: "Look at the drawing. It's both." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'itc.ca-a1', when: CA, turns: [
      { beat: 'The artist tears up the third drawing and drops it on the pile.' },
      { by: 'a', say: "Why? What's wrong with it now?" },
      { by: 'b', say: "The artist says it's too realistic." },
      { by: 'a', say: "It's a stick figure! How is a stick figure too realistic?" },
    ] },
    { id: 'itc.ca-a2', when: CA, turns: [
      { by: 'b', say: "You keep making me pretty. Stop making me pretty." },
      { by: 'a', ...V("I can't help it. You're my partner. I'm being nice.", "I can't help being nice.", "I'm being nice.", "I CAN'T help it! You're my PARTNER! I'm being NICE!", "I can't help it. I keep being nice to you.", "My hand refuses to insult you.") },
      { by: 'b', say: "Be mean. Be mean just this once. Give me a huge nose." },
    ] },
    { id: 'itc.ca-a3', when: CA, turns: [
      { beat: 'Five drawings in, {a} finally gives {b} a nose the size of a pear, and an enormous forehead.' },
      { by: 'b', say: "Okay, now you're enjoying it." },
      { beat: 'The artist claps once and hands over the tip.' },
      { by: 'a', say: "I enjoyed it a lot." },
    ] },
    { id: 'itc.ca-a4', when: CA, turns: [
      { by: 'a', say: "Four exaggerations. Okay. Ears, teeth, hair, and... your attitude." },
      { by: 'b', say: "How do you draw an attitude?" },
      { by: 'a', say: "Folded arms and a frown. You're doing it right now. Hold still." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'itc.ca-t1', when: CA, turns: [
      { beat: 'The pile of torn-up drawings next to the easel is getting taller.' },
      { by: 'b', say: "Maybe draw what you see, but worse." },
      { by: 'a', ...V("Everything I draw is already worse. That's the problem. It's worse in the wrong way.", "It's worse in the wrong way.", "Wrong kind of worse.", "Everything I draw is ALREADY worse! It's worse in the WRONG way!", "Everything I draw is worse already. It's just the wrong kind of worse.", "My bad drawings are bad in a boring way.") },
    ] },
    { id: 'itc.ca-t2', when: CA, turns: [
      { by: 'a', say: "My hand's cramping. I've drawn your face more times today than anyone in history." },
      { by: 'b', say: "And not one of them looks like me." },
      { by: 'a', say: "That's the point! It's not supposed to look like you!" },
    ] },
    { id: 'itc.ca-t3', when: CA, turns: [
      { beat: 'Another team gets their tip and runs off. {a} is still on a blank sheet.' },
      { by: 'b', say: "Just start. Draw the eyes. Everybody can draw eyes." },
      { by: 'a', say: "My eyes look like eggs. Everybody's eyes look like eggs when I draw them." },
    ] },
  ],
  'task-done.any': [
    { id: 'itc.ca-dn1', when: CA, turns: [
      { beat: 'The artist signs the drawing with a flourish and hands it to {b}, along with the tip.' },
      { by: 'b', ...V("We get to keep it? I don't want to keep it.", "Do I have to keep it?", "We keep it?", "We get to KEEP it? I don't WANT to keep it!", "We get to keep it? I really don't want to.", "A souvenir of my humiliation. Thank you.") },
      { by: 'a', say: "I'm framing it." },
    ] },
    { id: 'itc.ca-dn2', when: CA, turns: [
      { by: 'a', say: "The tip says the catacombs. Underground." },
      { by: 'b', say: "Underground. Great. Somewhere dark, after you made me look like a potato." },
      { by: 'a', say: "A handsome potato." },
    ] },
    { id: 'itc.ca-dn3', when: CA, turns: [
      { beat: '{b} looks at the finished caricature for a long, long moment.' },
      { by: 'b', say: "Is this really how I look to you?" },
      { by: 'a', say: "Only on the outside. Come on, we've got a tip." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'itc.ca-x1', when: CA, turns: [
      { beat: 'The artist looks at it for one second, shakes their head, and tears it in half.' },
      { by: 'a', ...V("I worked on that for ten minutes!", "Ten minutes of work!", "I worked on that!", "I WORKED on that for TEN MINUTES!", "I worked on that for ten whole minutes!", "That was my masterpiece! My ten-minute masterpiece!") },
      { by: 'b', say: "Draw faster, then. And worse." },
    ] },
    { id: 'itc.ca-x2', when: CA, turns: [
      { beat: 'The artist hands the drawing back with one word: portrait. Not caricature. Portrait.' },
      { by: 'a', say: "It's a terrible portrait, though. Doesn't that count?" },
      { beat: 'The artist shakes their head and pins up a fresh sheet.' },
    ] },
    { id: 'itc.ca-x3', when: CA, turns: [
      { beat: 'The artist holds the drawing next to {b}\'s face, compares them, and shrugs.' },
      { beat: 'The artist holds up three fingers. Only three exaggerations. It needs four.' },
      { by: 'b', say: "Give me bigger ears. I'm begging you. Give me huge ears." },
    ] },
  ],
  'watching-botch.cheer': [
    { id: 'itc.ca-v1', when: CA, turns: [
      { by: 'b', say: "You're doing great! I mean, I can't see it, but I believe in it!" },
      { by: 'a', say: "Stop moving your face. You keep moving your face." },
      { by: 'b', say: "That's me cheering!" },
    ] },
  ],
  'watching-botch.nerves': [
    { id: 'itc.ca-v2', when: CA, turns: [
      { by: 'b', say: "Can I see? Just a peek? What are you doing to my nose?" },
      { by: 'a', say: "You'll see when it's done." },
      { by: 'b', say: "That's what worries me." },
    ] },
  ],
  'watching-botch.coach-illegal': [
    { id: 'itc.ca-v3', when: CA, turns: [
      { beat: '{b} leans round the easel and grabs the charcoal.' },
      { by: 'b', say: "Here, let me just fix the chin..." },
      { beat: 'The artist snatches the charcoal back and points at the rules: only one partner draws.' },
      { by: 'a', say: "You just cost us thirty minutes for a chin." },
    ] },
  ],
  'watching-botch.quiet': [
    { id: 'itc.ca-v4', when: CA, turns: [
      { beat: '{b} sits perfectly still on the stool, trying to look interesting, and says nothing at all.' },
      { by: 'a', say: "You've gone very quiet." },
      { by: 'b', say: "I'm posing. Artists need silence." },
    ] },
  ],
  'helped-botch.any': [
    { id: 'itc.ca-h1', when: CA, turns: [
      { beat: 'When the artist looks away, {b} quickly adds two enormous ears to the drawing.' },
      { by: 'a', say: "Did you just draw on it? You're not allowed to draw on it!" },
      { by: 'b', say: "Nobody saw. Look, it's better now." },
    ] },
  ],
};

// ── the catacombs (All-In, follow your nose) ──
const catacombs = {
  'don-demo.gag': [
    { id: 'itc.ct-d1', when: CT, turns: [
      { beat: 'Don stands in a tunnel lined with skulls, holding a torch under his chin.' },
      don("Welcome to the catacombs, where the city keeps its oldest residents. Teams must use their noses to find the right exit, and the tip hidden among wheels of very strong cheese."),
      { beat: 'He sniffs, and his eyes water.' },
      don("Very, very strong cheese. I can't feel my face."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'itc.ct-d2', when: CT, turns: [
      don("The catacombs. Miles of tunnels, thousands of bones, and one smell that tells you you're going the right way."),
      don("Find the cheese, take one wheel each, and the tip is yours. Get lost, and you'll be meeting a lot of skulls. Several times."),
      { beat: 'A skull falls off a shelf behind him. He doesn\'t turn round.' },
    ] },
  ],
  'task-start.any': [
    { id: 'itc.ct-s1', when: CT, turns: [
      { beat: '{a} and {b} walk down the steps into the dark. It gets colder with every step.' },
      { by: 'b', ...V("Are those real? Are those real bones?", "Real bones?", "Those are real bones.", "Are those REAL? Are those REAL BONES?", "Are those actually real bones?", "Those are bones. Of people. Who were people.") },
      { by: 'a', say: "Don't look at them. Look at the floor. Smell for cheese." },
    ] },
    { id: 'itc.ct-s2', when: CT, turns: [
      { by: 'a', say: "Okay. Noses on. What do you smell?" },
      { by: 'b', say: "Damp. Old. And you. You haven't showered since the desert." },
      { by: 'a', say: "Smell past me." },
    ] },
    { id: 'itc.ct-s3', when: CT, turns: [
      { beat: 'Three tunnels split off in three directions. They all look exactly the same.' },
      { by: 'b', say: "Left, middle or right?" },
      { by: 'a', ...V("Whichever one smells worst.", "The worst-smelling one.", "Follow the stink.", "Whichever one SMELLS WORST!", "Whichever one smells the worst, I suppose.", "The one with the most offensive air.") },
    ] },
    { id: 'itc.ct-s4', when: CT, turns: [
      { by: 'a', say: "Hold my hand." },
      { by: 'b', say: "Because you're scared?" },
      { by: 'a', say: "Because if I lose you down here, I'll never find you again. And yes. Also scared." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'itc.ct-f1', when: CT, turns: [
      { by: 'b', say: "Wait. Smell that? That's cheese. That's definitely cheese." },
      { beat: 'They follow the smell round two corners and find a pile of cheese wheels stacked against the bones.' },
      { by: 'a', say: "Your nose is a gift. I'll never make fun of your nose again." },
    ] },
    { id: 'itc.ct-f2', when: CT, turns: [
      { beat: '{a} walks with {a.posAdj} eyes shut, nose first, turning at every junction without stopping.' },
      { by: 'b', say: "How are you doing this?" },
      { by: 'a', ...V("I grew up above a cheese shop. This is home.", "Above a cheese shop. This is home.", "Cheese shop childhood.", "I grew up ABOVE a CHEESE SHOP! This is HOME!", "I grew up above a cheese shop, so this is basically home.", "My childhood smelled exactly like this.") },
    ] },
    { id: 'itc.ct-f3', when: CT, turns: [
      { by: 'a', say: "That's the third skull with a hat on. Somebody's put hats on them. Follow the hats." },
      { by: 'b', say: "Why would the hats lead anywhere?" },
      { beat: 'The hats lead straight to the cheese.' },
      { by: 'a', say: "Never question the hats." },
    ] },
    { id: 'itc.ct-f4', when: CT, turns: [
      { beat: 'The smell hits them both at the same moment, and they turn the same way without a word.' },
      { by: 'b', say: "There. Down there." },
      { by: 'a', say: "Grab two wheels and let's never come down here again." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'itc.ct-a1', when: CT, turns: [
      { by: 'b', say: "That's the same skull. We've walked past that skull three times." },
      { by: 'a', say: "Then we turn left at the skull. We've been going right." },
      { beat: 'They turn left at the skull. Two minutes later, they smell it.' },
      { by: 'b', say: "Cheese. Finally. Cheese." },
    ] },
    { id: 'itc.ct-a2', when: CT, turns: [
      { by: 'a', say: "If we find every dead end, the only way left is the right way." },
      { by: 'b', ...V("That's a terrible plan.", "Terrible plan.", "That's terrible.", "That's a TERRIBLE plan!", "That's honestly a terrible plan.", "That plan has many dead ends in it.") },
      { beat: 'Four dead ends later, the plan works.' },
      { by: 'a', say: "Terrible, and it worked." },
    ] },
    { id: 'itc.ct-a3', when: CT, turns: [
      { beat: '{b} gets down on {b.posAdj} hands and knees and sniffs the floor.' },
      { by: 'a', say: "What are you doing?" },
      { by: 'b', say: "Cheese is heavy. The smell sinks. This way." },
      { beat: 'Ridiculous as it looks, it\'s the right way.' },
    ] },
    { id: 'itc.ct-a4', when: CT, turns: [
      { by: 'a', say: "We followed that other team, and they followed somebody's stomach." },
      { by: 'b', say: "Then we stop following people, and start following cheese." },
      { by: 'a', say: "Agreed. Nose first. Nobody else's nose." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'itc.ct-t1', when: CT, turns: [
      { beat: 'They\'ve been underground for an hour. Every tunnel looks the same, and every skull looks like it\'s laughing.' },
      { by: 'b', say: "I think that skull is laughing at us." },
      { by: 'a', say: "Everything down here is laughing at us." },
    ] },
    { id: 'itc.ct-t2', when: CT, turns: [
      { by: 'a', ...V("I can't smell anything anymore. My nose has given up.", "My nose has given up.", "Nose gone.", "I can't SMELL anything anymore! My NOSE has given UP!", "I can't smell anything now, my nose has just given up.", "My nose has retired. It's moved to the countryside.") },
      { by: 'b', say: "Then use mine. Follow me, and don't let go of my bag." },
      { by: 'a', say: "Your nose has been wrong four times." },
    ] },
    { id: 'itc.ct-t3', when: CT, turns: [
      { beat: 'A drip of water lands on {b}\'s neck, and {b} screams loud enough to echo for a full minute.' },
      { by: 'a', say: "It's water. It was water." },
      { by: 'b', say: "Down here, it could have been anything." },
    ] },
  ],
  'task-done.any': [
    { id: 'itc.ct-dn1', when: CT, turns: [
      { beat: '{a} and {b} come up the steps into daylight, each hugging a wheel of cheese the size of a car tyre.' },
      { by: 'a', say: "Sunlight. I'd forgotten about sunlight." },
      { by: 'b', ...V("I'm never eating cheese again. Never.", "Never eating cheese again.", "No more cheese. Ever.", "I'm NEVER eating cheese AGAIN! NEVER!", "I'm never eating cheese again, I swear.", "Cheese and I are finished. We've grown apart.") },
    ] },
    { id: 'itc.ct-dn2', when: CT, turns: [
      { by: 'b', say: "The tip says sail the cheese to the museum. Sail it?" },
      { by: 'a', say: "On the river. The cheese is the boat." },
      { by: 'b', say: "I've been on some strange boats, but never a dairy one." },
    ] },
    { id: 'itc.ct-dn3', when: CT, turns: [
      { beat: 'They roll their cheese wheels out of the tunnel like a pair of very tired farmers.' },
      { by: 'a', say: "How much does this weigh?" },
      { by: 'b', say: "About the same as my regrets." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'itc.ct-x1', when: CT, turns: [
      { beat: 'The tunnel ends in a wall of skulls.' },
      { by: 'b', ...V("Dead end. Another dead end.", "Dead end. Again.", "Dead end.", "DEAD END! ANOTHER dead end!", "It's another dead end.", "Another dead end. Literally, in this case.") },
      { by: 'a', say: "Back. Back the way we came. Again." },
    ] },
    { id: 'itc.ct-x2', when: CT, turns: [
      { by: 'a', say: "Cheese! That's cheese! This way!" },
      { beat: 'It is not cheese. It is a bin, and a very old sandwich.' },
      { by: 'b', say: "That's not even our cheese." },
    ] },
    { id: 'itc.ct-x3', when: CT, turns: [
      { beat: 'They come out of a tunnel and find themselves back at the bottom of the steps where they started.' },
      { by: 'a', say: "No. No. We walked for half an hour." },
      { by: 'b', say: "In a circle. We walked in a very big circle." },
    ] },
  ],
};

// ── the cheese raft (ridden down the river to the museum) ──
const raft = {
  'ride.any': [
    { id: 'itc.cr-r1', when: CR, turns: [
      { beat: '{a} and {b} push off from the bank, sitting on top of their cheese wheels, paddling with their hands.' },
      { by: 'b', ...V("It floats. I can't believe it floats.", "It floats!", "It actually floats.", "It FLOATS! I can't BELIEVE it floats!", "It floats. I honestly can't believe it floats.", "The cheese floats. Science is a lie.") },
      { by: 'a', say: "Don't say it out loud. Don't let the cheese hear you." },
    ] },
    { id: 'itc.cr-r2', when: CR, turns: [
      { by: 'a', say: "Are we going faster than the people walking along the river?" },
      { by: 'b', say: "A man walking his dog just went past us." },
      { by: 'a', say: "The dog's very fast." },
    ] },
    { id: 'itc.cr-r3', when: CR, turns: [
      { beat: 'A tourist boat goes past, and everybody on it takes a photo of the two people sailing on cheese.' },
      { by: 'b', say: "Wave. Wave like this is normal." },
      { by: 'a', say: "Nothing about this is normal." },
    ] },
    { id: 'itc.cr-r4', when: CR, turns: [
      { by: 'a', say: "My trousers are soaked, and they smell like a cave." },
      { by: 'b', ...V("Everything smells like a cave. We smell like a cave.", "We smell like a cave.", "We're a cave now.", "EVERYTHING smells like a CAVE! WE smell like a CAVE!", "Honestly, everything smells like a cave now. Including us.", "We are the cave now.") },
      { by: 'a', say: "The museum's going to love us." },
    ] },
  ],
  'travel-mishap.any': [
    { id: 'itc.cr-m1', when: { ...CR, mishap: 'no-oars' }, turns: [
      { by: 'b', say: "Where are the oars? You were supposed to bring the oars." },
      { by: 'a', say: "I thought you had the oars." },
      { beat: 'They paddle with their hands. It takes twenty minutes longer than it should.' },
    ] },
    { id: 'itc.cr-m2', when: { ...CR, mishap: 'eats-the-raft' }, turns: [
      { beat: 'Halfway down the river, {a} is quietly eating the edge of {a.posAdj} raft.' },
      { by: 'b', say: "Stop eating the boat! You're eating our boat!" },
      { by: 'a', say: "I haven't eaten since the desert. It's a very good boat." },
    ] },
    { id: 'itc.cr-m3', when: { ...CR, mishap: 'carries-the-cheese' }, turns: [
      { by: 'a', say: "I'm not sitting on cheese in a river. We carry it." },
      { by: 'b', say: "It weighs a ton. And the tip says sail it." },
      { beat: 'They carry the cheese along the riverbank, staggering, while other teams float past them.' },
    ] },
  ],
};

export default mergePools(place, caricature, catacombs, raft);
