// ══════════════════════════════════════════════════════════════════════
// td/script/lines/romance.js — flirting, showmances, kisses, jealousy, the end of it
// ══════════════════════════════════════════════════════════════════════
//
// The engine decides every romance beat (romance.js: who sparks, when a showmance
// forms and fades, who gets jealous; camp-events.js: flirting, night games). Every
// pair here passed romanticCompat before the engine fired the scene.
//
// romance.flirt.any — {a} and {b} flirt; not a couple (yet).
// romance.moment.<couple|crush> — the showmancer's moment with {b}: an established
//   couple (kisses allowed), or a crush that is getting obvious.
// romance.night.<kiss|friends|never|dare> — after-dark games: the bottle lands on {a}
//   and {b} and they kiss / they laugh it off; never-have-I-ever; truth or dare.
// romance.spark.any — {a} and {b} are officially a thing now.
// romance.rekindle.<apart|betrayed> — back together after being separated, or after
//   one voted the other out.
// romance.fade.<amicable|soured> — the showmance quietly ends.
// romance.rideordie.any — {a} and {b} are going to the end together.
// romance.honeymoon.any — the glow.
// romance.noticed.any — {a} watches the couple {b} and {c} and starts counting votes.
// romance.target.any — {a} decides the couple {b} and {c} has to be split.
// romance.jealous.any — {a} used to be {b}'s person; now it's {c}.
// romance.sidelined.any — {a}'s best friend {b} is always with {c} now.
// romance.sabotage.any — {a} makes a move on {b} so that {c} ({b}'s partner) sees it.
// Ids: 'ro.'.

const FLIRT = [
  { id: 'ro.f1', turns: [
    { beat: '{a} and {b} keep ending up next to each other. Again.' },
    { by: 'a', say: "Fancy meeting you here." },
    { by: 'b', say: "We've been sitting here for an hour." },
    { by: 'a', say: "Still fancy." },
    { by: 'b', conf: "{a} has the worst lines. I keep laughing anyway. That's a problem." },
  ] },
  { id: 'ro.f2', turns: [
    { by: 'a', say: "You've got something on your face." },
    { by: 'b', say: "Where?" },
    { beat: '{a} reaches over and brushes it off. Slowly. There was nothing there.' },
    { by: 'b', conf: "There was nothing on my face. I know there was nothing on my face." },
  ] },
  { id: 'ro.f3', turns: [
    { beat: '{a} and {b} are washing the pots in the water, splashing each other more than cleaning.' },
    { by: 'b', say: "You're terrible at this." },
    { by: 'a', say: "I'm terrible at a lot of things. Want to find out what else?" },
    { by: 'b', say: "...Pass me the pot." },
    { by: 'a', conf: "That was smooth. That was so smooth. Did you see {b}'s face?" },
  ] },
  { id: 'ro.f4', when: { register: 'shy' }, turns: [
    { by: 'a', say: "I, um. I saved you the good log. To sit on. If you want." },
    { by: 'b', say: "That's really sweet." },
    { by: 'a', say: "It's just a log." },
    { by: 'a', conf: "It was not just a log. I've been guarding that log since lunch." },
  ] },
  { id: 'ro.f5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You know, you're the only interesting person here." },
    { by: 'b', say: "Is that a line?" },
    { by: 'a', say: "It's a fact. The line comes later." },
    { by: 'a', conf: "Is it strategy? A little. Is it also because {b} is cute? I'm not answering that." },
  ] },
  { id: 'ro.f6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Stop smiling at me like that." },
    { by: 'b', say: "Like what?" },
    { by: 'a', say: "Like THAT." },
    { by: 'b', say: "You're smiling too." },
    { by: 'a', say: "I'm not! ...Shut up." },
  ] },
  { id: 'ro.f7', turns: [
    { beat: "{b} catches {a} looking. {a} doesn't look away. Neither does {b}." },
    { by: 'b', say: "What?" },
    { by: 'a', say: "Nothing. Just looking." },
    { by: 'b', conf: "Nothing. Sure. That was not a nothing look." },
  ] },
  { id: 'ro.f8', turns: [
    { by: 'a', say: "Teach me how you do that thing with the fire." },
    { by: 'b', say: "Come here. Hold it like this." },
    { beat: "{b}'s hands are over {a}'s for a lot longer than the fire needs." },
    { by: 'a', conf: "I know how to make a fire. I just wanted a lesson." },
  ] },
  { id: 'ro.f9', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Race you to the water. Winner gets a prize." },
    { by: 'b', say: "What's the prize?" },
    { by: 'a', say: "Win and find out." },
    { beat: '{b} wins. Neither of them says what the prize was. Both of them are smiling.' },
  ] },
  { id: 'ro.f10', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I made you something." },
    { beat: '{a} holds out a bracelet made of woven grass.' },
    { by: 'b', say: "You made this? For me?" },
    { by: 'a', say: "It's dumb." },
    { by: 'b', conf: "It's not dumb. I'm never taking it off. Don't tell {a}." },
  ] },
  { id: 'ro.f11', turns: [
    { by: 'b', say: "Why are you always the one sitting next to me?" },
    { by: 'a', say: "Why are you always the one saving the seat?" },
    { beat: '{b} opens {b.posAdj} mouth to argue, then closes it.' },
    { by: 'a', conf: "Got 'em." },
  ] },
  { id: 'ro.f12', when: { gap: 'same' }, turns: [
    { by: 'a', say: "Okay, honest question. If we'd met anywhere else, would you have talked to me?" },
    { by: 'b', say: "Honestly? Probably not. You're kind of a lot." },
    { by: 'a', say: "Wow." },
    { by: 'b', say: "I'm glad we met here, though." },
    { by: 'a', conf: "Insulted and flirted with in four seconds. {b} is dangerous." },
  ] },
  { id: 'ro.f13', when: { charm: true }, turns: [
    { by: 'a', say: "You laugh at all my jokes." },
    { by: 'b', say: "They're good jokes." },
    { by: 'a', say: "They're really not." },
    { by: 'b', say: "Then I guess I just like you." },
    { beat: 'Neither of them knows what to say after that. They both go back to the fire very red.' },
  ] },
];
const MOMENT_COUPLE = [
  { id: 'ro.mc1', turns: [
    { beat: '{a} and {b} slip away from camp. When they come back twenty minutes later, they are holding hands and not hiding it.' },
    { by: 'b', conf: "We stopped pretending. Everyone knew anyway." },
  ] },
  { id: 'ro.mc2', turns: [
    { by: 'b', say: "Come here." },
    { beat: '{b} leans in and {a} meets {b.obj} halfway. The kiss is easy, like they have done it a hundred times.' },
    { by: 'a', say: "People are watching." },
    { by: 'b', say: "Let them." },
  ] },
  { id: 'ro.mc3', turns: [
    { beat: "{a} falls asleep on {b}'s shoulder by the fire. {b} doesn't move for an hour." },
    { by: 'b', conf: "My arm went numb forty minutes ago. I'm not moving it. I'll lose the arm first." },
  ] },
  { id: 'ro.mc4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If anybody here tries to split us up, they'll have to go through me." },
    { by: 'b', say: "You're really hot when you're threatening people." },
    { by: 'a', say: "I know." },
    { beat: '{a} kisses {b}, hard, right there by the fire. Someone groans. Someone else whistles.' },
  ] },
  { id: 'ro.mc5', turns: [
    { by: 'a', say: "Can I tell you something? You're the best thing about this game." },
    { by: 'b', say: "Better than the money?" },
    { by: 'a', say: "Don't make me answer that." },
    { beat: '{b} laughs and kisses {a} on the cheek.' },
  ] },
  { id: 'ro.mc6', when: { register: 'sweet' }, turns: [
    { beat: "{a} fixes {b}'s hair without thinking about it. {b} lets {a.obj}." },
    { by: 'b', say: "Is it that bad?" },
    { by: 'a', say: "It's perfect. I just like touching it." },
    { by: 'b', conf: "Everybody else here is starving and miserable. I'm starving and happy. That's {a}." },
  ] },
  { id: 'ro.mc7', turns: [
    { beat: '{a} and {b} get caught kissing behind the trees by someone fetching water.' },
    { by: 'a', say: "This is not what it looks like." },
    { by: 'b', say: "It's exactly what it looks like." },
    { by: 'a', conf: "We were not subtle. We have never once been subtle." },
  ] },
  { id: 'ro.mc8', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You know everyone thinks we're a voting bloc." },
    { by: 'b', say: "We are a voting bloc." },
    { by: 'a', say: "A voting bloc that kisses." },
    { beat: '{b} pulls {a} in by the shirt.' },
    { by: 'b', say: "Best kind." },
  ] },
  { id: 'ro.mc9', turns: [
    { beat: "{a} wraps an arm around {b} at the fire. {b} leans in and stays there." },
    { by: 'b', conf: "Everybody's watching us like we're a threat. We probably are. I don't care right now." },
  ] },
];
const MOMENT_CRUSH = [
  { id: 'ro.cr1', turns: [
    { beat: '{a} and {b} disappear for an hour. When they come back, something between them has shifted.' },
    { by: 'a', say: "We were just looking for firewood." },
    { by: 'b', conf: "We did not find any firewood. We found a lot of other things to talk about." },
  ] },
  { id: 'ro.cr2', turns: [
    { by: 'b', say: "You remembered that? I said that days ago." },
    { by: 'a', say: "I remember everything you say." },
    { beat: 'That sentence hangs in the air a little too long.' },
    { by: 'a', conf: "That came out way more intense than I meant. Or exactly as intense as I meant." },
  ] },
  { id: 'ro.cr3', when: { arch: 'showmancer' }, turns: [
    { beat: "{a} sits next to {b} and gently takes the cup out of {b}'s hand to refill it." },
    { by: 'b', say: "I could have done that." },
    { by: 'a', say: "I know. I wanted to." },
    { by: 'a', conf: "Some people play this game with alliances. I play it with my heart. Usually works." },
  ] },
  { id: 'ro.cr4', turns: [
    { by: 'a', say: "Do you ever think about what happens after this? Like, outside?" },
    { by: 'b', say: "Outside, like… you and me?" },
    { by: 'a', say: "I didn't say that." },
    { by: 'b', say: "You kind of said that." },
  ] },
  { id: 'ro.cr5', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Can I sit here?" },
    { by: 'b', say: "You always sit here." },
    { by: 'a', say: "I know. I still like asking." },
    { by: 'b', conf: "{a} is so awkward. I think about {a} a lot. Those two things are related." },
  ] },
  { id: 'ro.cr6', turns: [
    { beat: "{a} says something that makes {b} laugh, then immediately checks to see if anyone saw. Everyone saw." },
    { by: 'a', conf: "I'm not good at hiding things. Especially this thing." },
  ] },
  { id: 'ro.cr7', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You drive me crazy, you know that?" },
    { by: 'b', say: "Good crazy or bad crazy?" },
    { by: 'a', say: "I haven't decided!" },
    { by: 'b', conf: "{a} yells at everyone. With me, the yelling's different. Softer. Is that weird?" },
  ] },
];
const NIGHT_KISS = [
  { id: 'ro.nk1', turns: [
    { beat: 'Spin-the-bottle by firelight. {a} spins. It points dead at {b}.' },
    { by: 'a', say: "Rules are rules." },
    { beat: 'The kiss is quick. The look afterwards is not. The whole circle goes quiet.' },
    { by: 'b', conf: "It was a game. It was just a game. Why can't I stop thinking about it?" },
  ] },
  { id: 'ro.nk2', turns: [
    { beat: 'The bottle stops on {a} and {b}. The camp starts whooping.' },
    { by: 'b', say: "We don't have to—" },
    { by: 'a', say: "Scared?" },
    { by: 'b', say: "Of you? Never." },
    { beat: '{b} kisses {a}. It lasts a beat too long. Nobody is whooping anymore.' },
  ] },
  { id: 'ro.nk3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Fine! FINE. Come here." },
    { beat: '{a} grabs {b} and kisses {b.obj} like it is a dare {a} intends to win. When they break apart, {b} is speechless.' },
    { by: 'a', conf: "I don't do anything halfway. Even spin-the-bottle." },
  ] },
  { id: 'ro.nk4', turns: [
    { by: 'b', say: "It's just a game, right?" },
    { by: 'a', say: "Totally just a game." },
    { beat: "They kiss. They both go red. Neither of them looks at anyone else for the rest of the night." },
    { by: 'a', conf: "It was not just a game." },
  ] },
  { id: 'ro.nk5', when: { register: 'shy' }, turns: [
    { beat: 'The bottle points at {a} and {b}. {a} looks like {a} wants to disappear into the sand.' },
    { by: 'b', say: "Hey. We can skip it." },
    { by: 'a', say: "No. I mean. I don't want to skip it." },
    { beat: 'The kiss is tiny and careful. Somehow it is the loudest moment of the night.' },
  ] },
  { id: 'ro.nk6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Well. The bottle has spoken." },
    { by: 'b', say: "Did you rig the bottle?" },
    { by: 'a', say: "Would that be so bad?" },
    { beat: '{b} laughs, and then kisses {a} anyway.' },
  ] },
];
const NIGHT_FRIENDS = [
  { id: 'ro.nf1', turns: [
    { beat: 'The bottle lands on {a} and {b}. They look at each other, horrified, then high-five instead.' },
    { by: 'a', say: "Bro thing." },
    { by: 'b', say: "Total bro thing." },
    { beat: 'The circle roasts them for an hour. Best night in a while.' },
  ] },
  { id: 'ro.nf2', turns: [
    { by: 'b', say: "Okay, there is no way." },
    { by: 'a', say: "Handshake?" },
    { by: 'b', say: "Handshake." },
    { beat: '{a} and {b} invent an elaborate secret handshake on the spot. By the end of the night the whole camp is doing it.' },
  ] },
  { id: 'ro.nf3', turns: [
    { by: 'a', say: "I love you, but not like that." },
    { by: 'b', say: "Same. Hug?" },
    { beat: 'They hug. The circle boos. They take a bow.' },
  ] },
  { id: 'ro.nf4', turns: [
    { by: 'a', say: "Can I kiss your hand instead? Like a knight?" },
    { by: 'b', say: "You may." },
    { beat: '{a} kneels and kisses {b}\'s hand with great ceremony. The camp loses it.' },
  ] },
  { id: 'ro.nf5', turns: [
    { by: 'b', say: "Rematch. Spin again." },
    { by: 'a', say: "You can't spin again." },
    { by: 'b', say: "I just did." },
    { by: 'a', conf: "{b} cheated at spin-the-bottle to get out of kissing me. I'm a little offended. Mostly relieved." },
  ] },
  { id: 'ro.nf6', turns: [
    { by: 'a', say: "This is like kissing my cousin." },
    { by: 'b', say: "You don't have a cousin." },
    { by: 'a', say: "It's like kissing the cousin I don't have." },
    { beat: "The whole circle is crying laughing. Nobody kisses anybody." },
  ] },
];
const NIGHT_NEVER = [
  { id: 'ro.nn1', turns: [
    { by: 'b', say: "Never have I ever lied to someone in this camp." },
    { beat: 'Half the fingers go down. {a} and {b} catch each other\'s eye.' },
    { by: 'a', say: "Oh, come on." },
    { by: 'b', say: "You put yours down first!" },
  ] },
  { id: 'ro.nn2', turns: [
    { by: 'a', say: "Never have I ever cried in the confessional." },
    { by: 'b', say: "That's targeted." },
    { by: 'a', say: "Put your finger down." },
    { beat: '{b} puts a finger down. Then laughs.' },
    { by: 'b', conf: "{a} knew. How did {a} know?" },
  ] },
  { id: 'ro.nn3', turns: [
    { by: 'b', say: "Never have I ever had a crush on someone here." },
    { beat: 'A long silence. {a} slowly puts a finger down. Everyone turns.' },
    { by: 'a', say: "Next question!" },
    { by: 'b', conf: "{a} won't say who. I've got a guess. Everyone's got a guess." },
  ] },
  { id: 'ro.nn4', turns: [
    { by: 'a', say: "Never have I ever been afraid of a goose." },
    { by: 'b', say: "That was ONE time." },
    { by: 'a', say: "Finger down." },
    { by: 'b', conf: "I told {a} that story in confidence. Now it's a game question." },
  ] },
  { id: 'ro.nn5', turns: [
    { by: 'b', say: "Never have I ever told anyone something real out here." },
    { beat: '{a} puts a finger down. So does {b}.' },
    { by: 'a', say: "To each other?" },
    { by: 'b', say: "To each other." },
    { by: 'a', conf: "The game was supposed to be silly. It ended up being the most honest hour of the season." },
  ] },
  { id: 'ro.nn6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Never have I ever voted for someone I said I wouldn't." },
    { beat: 'Nobody moves. Then, very slowly, {b} puts a finger down.' },
    { by: 'a', conf: "I asked a party game question. I got a confession. Best game ever." },
  ] },
];
const NIGHT_DARE = [
  { id: 'ro.nd1', turns: [
    { by: 'b', say: "I dare you to run a full lap of camp. Right now. In your underwear." },
    { by: 'a', say: "Hold my water." },
    { beat: '{a} does it without blinking. The camp is screaming.' },
    { by: 'b', conf: "I didn't think {a} would do it. {a} did it twice." },
  ] },
  { id: 'ro.nd2', turns: [
    { by: 'b', say: "I dare you to sing us a love song. Full volume." },
    { by: 'a', say: "To who?" },
    { by: 'b', say: "To the rice pot." },
    { beat: '{a} serenades the rice pot with real emotion. Nobody can breathe from laughing.' },
  ] },
  { id: 'ro.nd3', turns: [
    { by: 'b', say: "Do an impression of everybody here." },
    { by: 'a', say: "Everybody?" },
    { by: 'b', say: "Everybody." },
    { beat: '{a} goes around the circle. The impression of {b} is last, and it is perfect.' },
    { by: 'b', conf: "I don't sound like that. Do I sound like that? Everyone says I sound like that." },
  ] },
  { id: 'ro.nd4', turns: [
    { by: 'b', say: "I dare you to eat that." },
    { by: 'a', say: "Is it a bug?" },
    { by: 'b', say: "It's mostly a bug." },
    { beat: '{a} eats it, gags dramatically, and gets a standing ovation.' },
  ] },
  { id: 'ro.nd5', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "Truth or dare?" },
    { by: 'a', say: "Dare. Always dare." },
    { by: 'b', say: "Jump in the water. Right now. It's freezing." },
    { beat: '{a} is already running before {b} finishes the sentence.' },
  ] },
  { id: 'ro.nd6', turns: [
    { by: 'b', say: "Truth or dare?" },
    { by: 'a', say: "Truth." },
    { by: 'b', say: "Who here would you take to the end?" },
    { by: 'a', say: "Dare. I change my answer. Dare." },
    { by: 'b', conf: "The one question nobody answers. Not even in a game." },
  ] },
];
const SPARK = [
  { id: 'ro.s1', turns: [
    { by: 'a', say: "So. Are we a thing?" },
    { by: 'b', say: "Do you want us to be a thing?" },
    { by: 'a', say: "I asked first." },
    { by: 'b', say: "Then yes. We're a thing." },
    { by: 'a', conf: "Out of everything that could happen out here, I didn't see this coming. I'm not complaining." },
  ] },
  { id: 'ro.s2', turns: [
    { beat: 'The camp has stopped pretending not to notice {a} and {b}.' },
    { by: 'b', conf: "Somewhere between day one and now, it stopped being a question. {a} and me. That's a thing now." },
  ] },
  { id: 'ro.s3', turns: [
    { by: 'b', say: "People are talking about us." },
    { by: 'a', say: "Let them talk." },
    { by: 'b', say: "That's going to make us a target." },
    { by: 'a', say: "Then we'll be a target together." },
    { by: 'b', conf: "That's either the most romantic or the dumbest thing anyone has ever said to me. I'm in either way." },
  ] },
  { id: 'ro.s4', when: { arch: 'showmancer' }, turns: [
    { beat: '{b} is across the fire, laughing at something.' },
    { by: 'a', conf: "I came here to win. And to fall in love. I'm halfway there." },
  ] },
  { id: 'ro.s5', turns: [
    { beat: 'For the first time, {a} reaches for {b}\'s hand in front of everyone. {b} takes it.' },
    { by: 'a', conf: "That's it. It's official. No going back now." },
  ] },
  { id: 'ro.s6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "A showmance is a terrible move. Everybody knows it's a terrible move. I'm doing it anyway. I think I actually like {b}. Disgusting." },
  ] },
  { id: 'ro.s7', when: { register: 'shy' }, turns: [
    { by: 'a', say: "So, um. I like you. Like, like you." },
    { by: 'b', say: "I know." },
    { by: 'a', say: "You know?" },
    { by: 'b', say: "Everyone knows. I like you too." },
  ] },
];
const REKINDLE_APART = [
  { id: 'ro.ra1', turns: [
    { beat: '{a} walks back into camp. {b} looks up from the fire and freezes.' },
    { by: 'b', say: "You're back." },
    { by: 'a', say: "I'm back." },
    { beat: 'Neither of them moves. Then both of them do.' },
    { by: 'b', conf: "Whatever we had, it never stopped. I just had to wait." },
  ] },
  { id: 'ro.ra2', turns: [
    { by: 'a', say: "I never stopped thinking about you. Not once." },
    { by: 'b', say: "Good. Because I didn't either." },
    { beat: 'They sit together by the fire until it burns down to nothing.' },
  ] },
  { id: 'ro.ra3', turns: [
    { by: 'a', say: "We're playing it cool, right?" },
    { by: 'b', say: "Totally cool." },
    { beat: 'Ten minutes later {a} is sitting in {b}\'s lap. Nobody is fooled.' },
  ] },
  { id: 'ro.ra4', turns: [
    { by: 'b', say: "Did you miss me?" },
    { by: 'a', say: "Every day." },
    { by: 'b', say: "Every day?" },
    { by: 'a', say: "Twice on rice days." },
    { by: 'b', conf: "We're back. The whole camp groaned. I loved it." },
  ] },
  { id: 'ro.ra5', when: { register: 'sweet' }, turns: [
    { beat: '{b} runs straight at {a} and hugs {a.obj} so hard they both fall over.' },
    { by: 'a', say: "Hi." },
    { by: 'b', say: "Hi." },
  ] },
  { id: 'ro.ra6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Don't ever get voted out again. I mean it." },
    { by: 'b', say: "I'll try not to." },
    { by: 'a', say: "Don't TRY. DON'T." },
    { by: 'b', conf: "{a} missed me. Loudly." },
  ] },
];
const REKINDLE_BETRAYED = [
  { id: 'ro.rb1', turns: [
    { by: 'b', say: "You voted me out." },
    { by: 'a', say: "I know." },
    { by: 'b', say: "That's it? You know?" },
    { by: 'a', say: "I'm sorry. I'd do it differently." },
    { by: 'b', conf: "I should hate {a}. I've tried to. It isn't working." },
  ] },
  { id: 'ro.rb2', turns: [
    { beat: '{a} and {b} walk down the beach, away from everyone, and come back an hour later. Something has shifted.' },
    { by: 'a', conf: "It's complicated. It was always going to be complicated. But it's not over." },
  ] },
  { id: 'ro.rb3', turns: [
    { by: 'b', say: "I came back for the game. Not for you." },
    { by: 'a', say: "Okay." },
    { by: 'b', say: "...Mostly for the game." },
    { by: 'a', conf: "Mostly. I'll take mostly." },
  ] },
  { id: 'ro.rb4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "It was a game move. You know it was a game move." },
    { by: 'b', say: "And this? Is this a game move?" },
    { by: 'a', say: "No. This is real." },
    { by: 'b', conf: "{a} said this is real. {a} said a lot of things. I want to believe this one." },
  ] },
  { id: 'ro.rb5', turns: [
    { by: 'b', say: "Give me one reason not to walk away." },
    { by: 'a', say: "Because you're still here. Talking to me." },
    { beat: '{b} doesn\'t walk away.' },
  ] },
  { id: 'ro.rb6', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "You wrote my NAME DOWN!" },
    { by: 'a', say: "I know!" },
    { by: 'b', say: "And I still like you! Do you know how annoying that is?!" },
    { by: 'a', conf: "That was the worst and best conversation of my life." },
  ] },
];
const FADE_AMICABLE = [
  { id: 'ro.fa1', turns: [
    { by: 'a', say: "Hey. Are we okay?" },
    { by: 'b', say: "We're okay. We're just… not that anymore." },
    { by: 'a', say: "Yeah. I know." },
    { by: 'b', conf: "No fight. No betrayal. It just stopped. That's somehow sadder." },
  ] },
  { id: 'ro.fa2', turns: [
    { beat: '{a} and {b} sit apart at dinner for the first time in weeks. Nobody comments.' },
    { by: 'a', conf: "We ran out of things to say. Out here that happens. It still hurts." },
  ] },
  { id: 'ro.fa3', turns: [
    { by: 'b', say: "I think the game got in the way." },
    { by: 'a', say: "The game always gets in the way." },
    { by: 'b', say: "Friends?" },
    { by: 'a', say: "Friends." },
  ] },
  { id: 'ro.fa4', turns: [
    { by: 'a', say: "I'm moving my stuff to the other side." },
    { by: 'b', say: "Okay." },
    { beat: "{b} doesn't stop {a}. That's the answer." },
  ] },
  { id: 'ro.fa5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'll always be glad it happened." },
    { by: 'b', say: "Me too. I just don't think it's happening anymore." },
    { by: 'a', conf: "We hugged. It was a goodbye hug. We both knew it." },
  ] },
  { id: 'ro.fa6', turns: [
    { by: 'b', conf: "The long talks got shorter. Then they stopped. I don't think we ever decided anything. It just ended." },
  ] },
];
const FADE_SOURED = [
  { id: 'ro.fs1', turns: [
    { by: 'a', say: "Don't." },
    { by: 'b', say: "I didn't say anything." },
    { by: 'a', say: "You were going to." },
    { by: 'b', conf: "We used to finish each other's sentences. Now we stop each other's." },
  ] },
  { id: 'ro.fs2', turns: [
    { beat: "{a} walks past {b} without looking. {b} doesn't look either." },
    { by: 'a', conf: "Whatever we were, the game ate it. I'm done grieving it." },
  ] },
  { id: 'ro.fs3', turns: [
    { by: 'b', say: "You changed." },
    { by: 'a', say: "You noticed? I thought you'd stopped noticing me weeks ago." },
    { by: 'b', conf: "That was the last real conversation we had. It wasn't a nice one." },
  ] },
  { id: 'ro.fs4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm done. We're done." },
    { by: 'b', say: "Fine!" },
    { by: 'a', say: "FINE!" },
    { beat: 'They storm off in opposite directions. The camp lets out a breath it was holding.' },
  ] },
  { id: 'ro.fs5', turns: [
    { by: 'b', say: "Was any of it real?" },
    { by: 'a', say: "Does it matter now?" },
    { by: 'b', conf: "{a} didn't say no. That's worse than saying no." },
  ] },
  { id: 'ro.fs6', when: { register: 'schemer' }, turns: [
    { beat: '{b} is on the far side of camp, not looking over.' },
    { by: 'a', conf: "It was useful while it lasted. Now it's not. Don't look at me like that. You'd do the same." },
  ] },
];
const RIDE_OR_DIE = [
  { id: 'ro.rd1', turns: [
    { by: 'a', say: "Promise me something. End of this game, it's you and me." },
    { by: 'b', say: "Even if it costs us?" },
    { by: 'a', say: "Especially if it costs us." },
    { by: 'b', conf: "Everyone's going to come after us now. I don't care. Ride or die." },
  ] },
  { id: 'ro.rd2', turns: [
    { beat: '{a} and {b} sit by the fire with their foreheads together, whispering.' },
    { by: 'a', conf: "They can't vote out what we have. They can try. They'll have to take both of us." },
  ] },
  { id: 'ro.rd3', turns: [
    { by: 'b', say: "If it's between you and the money?" },
    { by: 'a', say: "You. Obviously." },
    { by: 'b', say: "Wrong. The money. Then you. Then we share the money." },
    { by: 'a', say: "...Okay, that's a better answer." },
  ] },
  { id: 'ro.rd4', when: { register: 'schemer' }, turns: [
    { beat: "{b} is asleep against {a}'s shoulder." },
    { by: 'a', conf: "Everybody says showmances lose. Everybody's never had one like ours. We go to the end together or not at all." },
  ] },
  { id: 'ro.rd5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Anybody who comes for you comes for me." },
    { by: 'b', say: "You'll make us a target." },
    { by: 'a', say: "We ARE the target. Might as well be loud about it." },
  ] },
  { id: 'ro.rd6', turns: [
    { by: 'a', say: "Whatever happens. Okay?" },
    { by: 'b', say: "Whatever happens." },
    { beat: 'They shake on it, then laugh, then kiss, because shaking on it felt too formal.' },
  ] },
];
const HONEYMOON = [
  { id: 'ro.h1', turns: [
    { beat: "{a} and {b} are finishing each other's sentences again." },
    { by: 'a', say: "And then we—" },
    { by: 'b', say: "—fell in the water!" },
    { by: 'a', say: "Twice!" },
    { beat: 'Everyone else around the fire exchanges a long look.' },
  ] },
  { id: 'ro.h2', turns: [
    { beat: "{b} brings {a} water without being asked. {a} doesn't say thank you. Just smiles." },
    { by: 'b', conf: "We don't have to say stuff anymore. That's how you know." },
  ] },
  { id: 'ro.h3', turns: [
    { by: 'a', say: "You're sunburnt." },
    { by: 'b', say: "So are you." },
    { by: 'a', say: "Matching." },
    { by: 'b', say: "Couples sunburn." },
    { by: 'a', conf: "Everything is cute when you're in this stage. Even the sunburn." },
  ] },
  { id: 'ro.h4', turns: [
    { beat: "It's late. {a} and {b} are the last ones awake, whispering by the embers." },
    { by: 'b', say: "We should sleep." },
    { by: 'a', say: "Five more minutes." },
    { beat: 'Five more minutes turns into an hour.' },
  ] },
  { id: 'ro.h5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I saved you the last coconut." },
    { by: 'b', say: "You always save me the last coconut." },
    { by: 'a', say: "That's what you do for your person." },
    { by: 'b', conf: "Your person. {a} said your person. I'm going to be thinking about that all week." },
  ] },
  { id: 'ro.h6', turns: [
    { beat: "{b} reaches for {a}'s hand during a quiet moment and doesn't let go." },
    { by: 'a', conf: "Everybody's pretending not to look. Everybody's looking." },
  ] },
  { id: 'ro.h7', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "You're kind of grumpy today." },
    { by: 'a', say: "I'm always grumpy." },
    { by: 'b', say: "You're less grumpy with me." },
    { by: 'a', say: "Don't tell anyone." },
  ] },
  { id: 'ro.h8', turns: [
    { by: 'a', say: "What are you smiling about?" },
    { by: 'b', say: "Nothing." },
    { by: 'a', say: "You're smiling at nothing?" },
    { by: 'b', say: "I'm smiling at you. You're the nothing." },
    { by: 'a', conf: "That made no sense. I loved it." },
  ] },
  { id: 'ro.h9', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Bet I can carry you to the water." },
    { by: 'b', say: "Bet you can't." },
    { beat: '{a} carries {b} to the water. Then drops {b} in. Then gets pulled in too.' },
    { by: 'b', conf: "This is what dating a competitor is like. Everything is a race. I'm winning anyway." },
  ] },
  { id: 'ro.h10', turns: [
    { by: 'b', say: "Tell me about home." },
    { by: 'a', say: "What about it?" },
    { by: 'b', say: "Everything. I want to know everything." },
    { by: 'a', conf: "Nobody's ever asked me that like they meant it. {b} meant it." },
  ] },
];
const NOTICED = [
  { id: 'ro.no1', turns: [
    { beat: '{a} watches {b} and {c} from across the fire, counting quietly.' },
    { by: 'a', conf: "Two votes. Always together. Always protecting each other. That's not cute. That's a problem." },
  ] },
  { id: 'ro.no2', turns: [
    { by: 'a', say: "Those two are going to the end together if somebody doesn't do something." },
    { beat: '{a} says it to nobody in particular. Everybody hears it. {b} and {c} do not.' },
  ] },
  { id: 'ro.no3', turns: [
    { beat: '{b} and {c} are laughing together by the water.' },
    { by: 'a', conf: "I'm happy for them. Genuinely. I'm also writing their names down in my head." },
  ] },
  { id: 'ro.no4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{b}, {c}, you two make a lovely couple." },
    { by: 'b', say: "Thanks!" },
    { by: 'a', conf: "Lovely couple. Lovely voting bloc. Lovely target." },
  ] },
  { id: 'ro.no5', turns: [
    { by: 'a', conf: "Every time I talk to {b}, I'm talking to {c} too. They tell each other everything. That's two people I can't trust." },
  ] },
  { id: 'ro.no6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "{b} and {c} are adorable. I hate that I'm already doing the math." },
  ] },
];
const TARGET = [
  { id: 'ro.t1', turns: [
    { by: 'a', conf: "The pitch is simple. Split {b} and {c} now, or watch them walk into the final two holding hands." },
  ] },
  { id: 'ro.t2', turns: [
    { beat: '{a} has been talking to people all day. Every conversation ends with the same two names.' },
    { by: 'a', conf: "{b} and {c} can't both stay. One of them goes. Which one, I don't care." },
  ] },
  { id: 'ro.t3', when: { register: 'schemer' }, turns: [
    { beat: '{b} and {c} walk past, holding hands.' },
    { by: 'a', conf: "Love is beautiful. It's also a voting bloc. And voting blocs get broken." },
  ] },
  { id: 'ro.t4', turns: [
    { beat: '{b} and {c} walk past, holding hands. {a} watches them go.' },
    { by: 'a', conf: "They think nobody's paying attention. Everyone's paying attention." },
  ] },
  { id: 'ro.t5', turns: [
    { by: 'a', conf: "I like {b}. I like {c}. I'm going to vote one of them out anyway. Out here that's just math." },
  ] },
  { id: 'ro.t6', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "If I have to watch {b} and {c} be cute at the fire for one more night, I'm going to lose it. One of them goes. Soon." },
  ] },
];
const JEALOUS = [
  { id: 'ro.j1', turns: [
    { beat: "{b} and {c} are whispering by the water. {a} sits alone at the fire." },
    { by: 'a', say: "I'm happy for them." },
    { by: 'a', conf: "I used to be the one {b} talked to at night. Now it's {c}. Nobody asked me if that was okay." },
  ] },
  { id: 'ro.j2', turns: [
    { by: 'b', say: "Hey, you okay? You've been quiet." },
    { by: 'a', say: "I'm fine. Go. {c}'s waiting." },
    { by: 'b', say: "You sure?" },
    { by: 'a', say: "Go." },
    { by: 'a', conf: "I'm not fine. I'll never be fine about this." },
  ] },
  { id: 'ro.j3', turns: [
    { beat: '{a} watches {b} laugh at something {c} says. {a} doesn\'t laugh.' },
    { by: 'a', conf: "I don't know when it happened. One day it was me and {b}. Now it's them." },
  ] },
  { id: 'ro.j4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Wow. Didn't take long, did it?" },
    { by: 'c', say: "What's that supposed to mean?" },
    { by: 'a', say: "You know exactly what it means." },
    { by: 'b', conf: "{a} and {c} hate each other now. Because of me. I don't know what to do with that." },
  ] },
  { id: 'ro.j5', when: { register: 'schemer' }, turns: [
    { beat: '{b} is right there, sitting next to {c}.' },
    { by: 'a', say: "You two are so good together." },
    { by: 'c', say: "Thanks." },
    { by: 'a', conf: "They'll be even better apart. I'm going to make sure of it." },
  ] },
  { id: 'ro.j6', turns: [
    { by: 'a', say: "Can I talk to you for a second? Alone?" },
    { by: 'b', say: "Sure. {c}, give us a minute?" },
    { beat: '{c} stays exactly where {c} is.' },
    { by: 'a', conf: "{c} wouldn't even give me one minute. That says everything." },
  ] },
];
const SIDELINED = [
  { id: 'ro.sd1', turns: [
    { beat: '{a} tries to sit with {b} at the fire. {c} is already there. {a} walks away.' },
    { by: 'a', conf: "{b} and I used to be inseparable. Now I'm eating alone. {b} hasn't even noticed." },
  ] },
  { id: 'ro.sd2', turns: [
    { by: 'a', say: "We used to talk about everything." },
    { by: 'b', say: "We still talk!" },
    { by: 'a', say: "When {c} lets you." },
    { by: 'b', conf: "That wasn't fair. Was it fair? Maybe it was a little fair." },
  ] },
  { id: 'ro.sd3', turns: [
    { beat: '{b} and {c} are whispering on the other side of camp.' },
    { by: 'a', conf: "I don't hate {c}. I just hate that {c} took my best friend and nobody asked me." },
  ] },
  { id: 'ro.sd4', when: { register: 'fiery' }, turns: [
    { beat: '{c} is right there beside {b}, as usual.' },
    { by: 'a', say: "Oh, look who remembered I exist." },
    { by: 'b', say: "Don't be like that." },
    { by: 'a', say: "Like what? Alone? Because that's what I am now." },
  ] },
  { id: 'ro.sd5', turns: [
    { beat: '{a} sleeps facing the wall. {b} and {c} are whispering on the other side.' },
    { by: 'a', conf: "Nobody's talking about it. That's the part that hurts the most." },
  ] },
  { id: 'ro.sd6', when: { register: 'sweet' }, turns: [
    { beat: '{c} has an arm around {b}.' },
    { by: 'a', say: "I'm really happy for you two." },
    { by: 'b', say: "Thank you! That means a lot." },
    { by: 'a', conf: "I am happy for them. I'm also really, really lonely. Both things are true." },
  ] },
];
const SABOTAGE = [
  { id: 'ro.sb1', turns: [
    { beat: '{a} corners {b} by the water. From far away, it looks romantic. That is the point.' },
    { by: 'a', say: "You've got something in your hair. Hold still." },
    { beat: '{c} walks around the corner and stops dead.' },
    { by: 'c', say: "Wow." },
    { by: 'a', conf: "I didn't even kiss {b}. I didn't have to." },
  ] },
  { id: 'ro.sb2', turns: [
    { beat: '{a} kisses {b}. Out of nowhere. {b} pulls back, confused, right as {c} walks up.' },
    { by: 'b', say: "That's not— {c}, it's not what it looks like!" },
    { by: 'c', say: "It looks like a kiss." },
    { by: 'a', conf: "It was calculated. It was cold. It worked." },
  ] },
  { id: 'ro.sb3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{c}, I just thought you should know what {b} is really like." },
    { by: 'c', say: "What does that mean?" },
    { by: 'a', say: "Ask {b} about the beach. Last night." },
    { by: 'a', conf: "Nothing happened on the beach. But now {c} will never be sure. Doubt is the whole weapon." },
  ] },
  { id: 'ro.sb4', turns: [
    { beat: "{a} lingers with {b} by the fire, a hand on {b}'s arm. {c} sees it from across camp." },
    { by: 'b', say: "What are you doing?" },
    { by: 'a', say: "Just talking." },
    { by: 'c', conf: "I saw what I saw. I don't care what anyone says." },
  ] },
  { id: 'ro.sb5', turns: [
    { by: 'c', say: "Since when are you two so close?" },
    { by: 'a', say: "Since {b} started needing someone who actually listens." },
    { by: 'b', say: "That's not true!" },
    { by: 'a', conf: "One sentence. That's all it takes to break a showmance." },
  ] },
  { id: 'ro.sb6', when: { register: 'fiery' }, turns: [
    { by: 'c', say: "Get your hands OFF {b}!" },
    { by: 'a', say: "Relax. We were just talking." },
    { by: 'c', say: "With your HANDS?" },
    { by: 'b', conf: "I didn't do anything. Somehow I'm the one in trouble." },
  ] },
];

export default {
  'romance.flirt.any': FLIRT, 'romance.moment.couple': MOMENT_COUPLE, 'romance.moment.crush': MOMENT_CRUSH,
  'romance.night.kiss': NIGHT_KISS, 'romance.night.friends': NIGHT_FRIENDS, 'romance.night.never': NIGHT_NEVER, 'romance.night.dare': NIGHT_DARE,
  'romance.spark.any': SPARK, 'romance.rekindle.apart': REKINDLE_APART, 'romance.rekindle.betrayed': REKINDLE_BETRAYED,
  'romance.fade.amicable': FADE_AMICABLE, 'romance.fade.soured': FADE_SOURED, 'romance.rideordie.any': RIDE_OR_DIE,
  'romance.honeymoon.any': HONEYMOON, 'romance.noticed.any': NOTICED, 'romance.target.any': TARGET,
  'romance.jealous.any': JEALOUS, 'romance.sidelined.any': SIDELINED, 'romance.sabotage.any': SABOTAGE,
};
