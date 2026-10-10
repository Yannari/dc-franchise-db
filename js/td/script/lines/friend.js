// ══════════════════════════════════════════════════════════════════════
// td/script/lines/friend.js — friendship at camp: the small moments that turn into alliances
// ══════════════════════════════════════════════════════════════════════
//
// camp-events.js decides who and how much it moved them. These are the words.
//
// friend.bond.any        {a} and {b} get closer.
// friend.goof.any        Total Drama bonding: something dumb that turns into a friendship.
// friend.struggle.<empty|rivals|plain>  {a} and {b} get through something hard together:
//                        both running on empty / two people who don't get on / just a bad day.
// friend.thanks.any      {a} thanks {b} for something {b} did.
// friend.comfort.any     {a} looks after {b}, who is having a bad time.
// friend.open.any        {a} opens up to {b}.
// friend.sunrise.any     {a} and {b}, up before everyone, talking.
// friend.meal.any        {a} and {b} share food.
// friend.secret.any      {a} tells {b} something real about life outside.
// friend.defend.<loud|quiet|surprise>  {a} stands up for {b}, whose name keeps coming up: loud to {c}'s face
//                                       (and {more}'s), who was giving {b} a hard time; quiet and surprise with no critic there.
// friend.teach.<physical|strategic|mental>  {a} teaches {b}.
// friend.mentor.<spiral|rough>  {a} steadies {b} (spiralling / just rattled).
// friend.solidarity.any  {a} has {b}'s back, without saying so.
// friend.joke.any        {a} and {b} have a running bit.
// friend.laugh.any       {a} makes the whole camp laugh ({b} and {c} among them).
// friend.celebrate.any   {a} starts a celebration; {b} and {c} join in.
// friend.rally.any       {a} pulls the camp back together after a bad day.
// friend.lift.any        {a} lifts everyone's mood.
// Ids: 'fr.'.

const BOND = [
  { id: 'fr.b1', turns: [
    { by: 'a', say: "Can I sit here?" },
    { by: 'b', say: "Sure." },
    { beat: 'An hour later they are still talking. Neither of them noticed the fire go out.' },
    { by: 'b', conf: "I didn't expect to like {a}. I really like {a}." },
  ] },
  { id: 'fr.b2', turns: [
    { by: 'a', say: "Where are you from, anyway?" },
    { by: 'b', say: "You want the short version or the real one?" },
    { by: 'a', say: "Real one. We've got nothing but time." },
    { by: 'a', conf: "I asked one question and got a whole person. Didn't see that coming." },
  ] },
  { id: 'fr.b3', turns: [
    { beat: '{a} and {b} end up hauling water together, then stay out at the water long after the buckets are full.' },
    { by: 'b', conf: "Somewhere between the first bucket and the last, {a} became my friend." },
  ] },
  { id: 'fr.b4', when: { charm: true }, turns: [
    { by: 'a', say: "You're funny. Nobody told me you were funny." },
    { by: 'b', say: "Nobody asked." },
    { by: 'a', say: "I'm asking now." },
    { by: 'b', conf: "{a} makes you feel like the most interesting person here. Even if you know it's a skill, it works." },
  ] },
  { id: 'fr.b5', when: { calm: true }, turns: [
    { by: 'b', say: "Sorry, I'm rambling." },
    { by: 'a', say: "Keep going. I'm listening." },
    { by: 'b', conf: "{a} actually listens. Out here, that's rarer than food." },
  ] },
  { id: 'fr.b6', turns: [
    { by: 'a', say: "You doing okay? You've had a rough couple of days." },
    { by: 'b', say: "You noticed?" },
    { by: 'a', say: "Somebody had to." },
    { by: 'b', conf: "Small thing. I'm going to remember it." },
  ] },
  { id: 'fr.b7', turns: [
    { by: 'a', say: "Okay, favourite food. Go." },
    { by: 'b', say: "Pizza." },
    { by: 'a', say: "Wrong. Tacos." },
    { by: 'b', say: "You can't be wrong about a favourite." },
    { by: 'a', say: "You can, and you are." },
    { by: 'b', conf: "We argued about tacos for an hour. Best hour I've had out here." },
  ] },
  { id: 'fr.b8', when: { register: 'shy' }, turns: [
    { by: 'b', say: "You don't talk much, do you?" },
    { by: 'a', say: "Not usually." },
    { by: 'b', say: "You're talking to me." },
    { by: 'a', say: "Yeah. I guess I am." },
  ] },
  { id: 'fr.b9', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Everyone here gets on my nerves. Except you." },
    { by: 'b', say: "Is that a compliment?" },
    { by: 'a', say: "It's the best one I've got." },
  ] },
  { id: 'fr.b10', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I started talking to {b} for the game. Somewhere along the way I forgot that's why. Weird." },
  ] },
  { id: 'fr.b11', when: { gap: 'older' }, turns: [
    { by: 'b', say: "You remind me of a teacher I had. The good kind." },
    { by: 'a', say: "I'll take that." },
    { by: 'a', conf: "{b} could be my kid. Somehow we're friends. This game is strange." },
  ] },
  { id: 'fr.b12', when: { gap: 'younger' }, turns: [
    { by: 'a', say: "Can I ask you something? Like, life advice?" },
    { by: 'b', say: "Out here? Sure." },
    { by: 'a', conf: "Everybody else my age is playing. {b} is the one person I can just talk to." },
  ] },
  { id: 'fr.b13', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Do you think I'm annoying?" },
    { by: 'b', say: "A little. In a good way." },
    { by: 'a', say: "Is there a good way?" },
    { by: 'b', say: "Yours is." },
  ] },
  { id: 'fr.b14', turns: [
    { beat: '{a} shares the last of {a.posAdj} water with {b} without being asked.' },
    { by: 'b', say: "You need that." },
    { by: 'a', say: "So do you." },
    { by: 'b', conf: "Out here, water is everything. {a} gave me half of everything." },
  ] },
  { id: 'fr.b15', turns: [
    { by: 'b', say: "What made you sign up for this?" },
    { by: 'a', say: "Honestly? I wanted to see if I could." },
    { by: 'b', say: "Same. And?" },
    { by: 'a', say: "Ask me at the end." },
  ] },
  { id: 'fr.b16', when: { band: 'cold' }, turns: [
    { by: 'a', say: "I don't think we've ever had a real conversation." },
    { by: 'b', say: "We've had several fake ones." },
    { by: 'a', say: "Want to try a real one?" },
    { by: 'b', conf: "We didn't like each other. Today that changed a little. I'm not sure how I feel about it." },
  ] },
  { id: 'fr.b17', when: { job: true }, turns: [
    { by: 'b', say: "What do you do, back home?" },
    { by: 'a', say: "I'm {job}." },
    { by: 'b', say: "No way. I would never have guessed that." },
    { by: 'a', conf: "First person out here who's asked me that. {b} actually wanted to know." },
  ] },
  { id: 'fr.b18', when: { home: true }, turns: [
    { by: 'a', say: "You'd love {home}. Seriously. Come visit when this is over." },
    { by: 'b', say: "Are you inviting me?" },
    { by: 'a', say: "I'm inviting you." },
    { by: 'b', conf: "Friends who make plans for after the game. That's rare out here." },
  ] },
  { id: 'fr.b19', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I made you a friendship bracelet. It's grass. It'll probably fall apart." },
    { by: 'b', say: "I'm wearing it until it does." },
  ] },
  { id: 'fr.b20', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "You were good out there. Like, actually good." },
    { by: 'b', say: "From you? That means something." },
    { by: 'a', conf: "I don't hand out compliments. {b} earned one." },
  ] },
];
const GOOF = [
  { id: 'fr.g1', turns: [
    { by: 'a', say: "No blinking. First one to blink loses." },
    { by: 'b', say: "Loses what?" },
    { by: 'a', say: "Everything." },
    { beat: 'They stare at each other for four minutes while the camp watches in confusion. {b} blinks.' },
    { by: 'b', conf: "I lost everything. I'd do it again." },
  ] },
  { id: 'fr.g2', turns: [
    { beat: '{a} does a dead-on impression of the host. {b} laughs so hard {b.posAdj} drink comes out of {b.posAdj} nose.' },
    { by: 'b', say: "Do it again!" },
    { by: 'a', say: "I'm not a performing monkey." },
    { beat: '{a} does it again.' },
  ] },
  { id: 'fr.g3', turns: [
    { by: 'a', say: "You're the most annoying person here." },
    { by: 'b', say: "And you're the second most annoying." },
    { beat: 'They glare at each other, then both crack up.' },
    { by: 'a', conf: "We had a huge fight and then laughed about it ten seconds later. I think we're best friends now." },
  ] },
  { id: 'fr.g4', turns: [
    { by: 'a', say: "Okay, I've invented a sport." },
    { by: 'b', say: "What's it called?" },
    { by: 'a', say: "Coconut bowling. The pins are also coconuts." },
    { beat: 'By sundown half the camp is playing coconut bowling.' },
  ] },
  { id: 'fr.g5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Arm wrestle. Right now." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because I'm bored and you're here." },
    { beat: 'It is a tie. They argue about it for an hour and part as friends.' },
  ] },
  { id: 'fr.g6', turns: [
    { by: 'b', say: "Teach me how to whistle with my fingers." },
    { by: 'a', say: "Two fingers. Tongue back. Blow." },
    { beat: '{b} spits all over {a}. Both of them are crying laughing.' },
  ] },
  { id: 'fr.g7', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I bet you can't name every person here's biggest weakness." },
    { by: 'b', say: "Bet I can." },
    { beat: '{b} does it, in a whisper, accurately. {a} is impressed and a little worried.' },
    { by: 'a', conf: "{b} is either my new best friend or my next problem. Possibly both." },
  ] },
  { id: 'fr.g8', turns: [
    { by: 'a', say: "Covering for you was the best thing I did today." },
    { by: 'b', say: "You didn't have to." },
    { by: 'a', say: "I know. Don't make it weird." },
    { by: 'b', conf: "{a} covered for me when somebody asked a pointed question. I don't forget stuff like that." },
  ] },
  { id: 'fr.g9', turns: [
    { by: 'b', say: "Is that... a crab wearing a hat?" },
    { by: 'a', say: "His name is Sir Pinch." },
    { by: 'b', say: "Where did he get a hat?" },
    { by: 'a', say: "I made it. Sir Pinch deserves a hat." },
    { by: 'b', conf: "{a} made a crab a hat. I've never trusted anyone more." },
  ] },
  { id: 'fr.g10', turns: [
    { by: 'a', say: "Rate every challenge so far out of ten." },
    { by: 'b', say: "Oh, we're doing this?" },
    { beat: 'They do it. It takes the whole afternoon. They disagree on every single one.' },
  ] },
  { id: 'fr.g11', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Race you to that tree. Loser carries the water." },
    { by: 'b', say: "You're on." },
    { beat: '{b} trips {a} halfway. {a} tackles {b} at the finish. Both of them carry the water, laughing.' },
  ] },
  { id: 'fr.g12', when: { register: 'shy' }, turns: [
    { by: 'b', say: "You're really good at drawing." },
    { by: 'a', say: "It's just sand." },
    { by: 'b', say: "It's a really good sand dog." },
    { by: 'a', conf: "Nobody's ever liked my drawings before. {b} likes my sand dog." },
  ] },
  { id: 'fr.g13', turns: [
    { by: 'a', say: "If we were a band, what would we be called?" },
    { by: 'b', say: "The Starving Losers." },
    { by: 'a', say: "Perfect. I'm the lead singer." },
    { by: 'b', say: "I'm the lead singer." },
  ] },
  { id: 'fr.g14', turns: [
    { beat: '{a} and {b} spend the afternoon building a tiny fort for a lizard.' },
    { by: 'b', conf: "We're adults. We built a lizard a house. I've never been happier." },
  ] },
  { id: 'fr.g15', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Okay, rank everybody here by how good they'd be in a zombie movie." },
    { by: 'b', say: "I'm surviving to the end, obviously." },
    { by: 'a', say: "You'd die in the first scene." },
    { by: 'b', conf: "We ranked the whole cast. I'm not saying who died first. Everyone would be upset." },
  ] },
  { id: 'fr.g16', turns: [
    { by: 'b', say: "Did you just steal my spot?" },
    { by: 'a', say: "It was a free spot." },
    { by: 'b', say: "I was IN it." },
    { by: 'a', say: "And now you're not." },
    { beat: '{b} sits on {a}. They both fall off the log.' },
  ] },
];
const STRUGGLE_EMPTY = [
  { id: 'fr.se1', turns: [
    { beat: "{a} and {b} are both running on empty. They don't say much, but they don't leave each other's side either." },
    { by: 'b', conf: "Something about getting through this with {a} changes things." },
  ] },
  { id: 'fr.se2', turns: [
    { by: 'a', say: "I can't feel my legs." },
    { by: 'b', say: "I can't feel my face." },
    { by: 'a', say: "We make one whole person." },
    { beat: 'They lean on each other the whole way back to camp.' },
  ] },
  { id: 'fr.se3', turns: [
    { beat: "{a} hits a wall halfway through the day. {b} notices first and stays close, without making a big deal of it." },
    { by: 'a', conf: "{b} didn't say anything. {b} just didn't leave. I'm not going to forget that." },
  ] },
  { id: 'fr.se4', turns: [
    { by: 'a', say: "Okay. Ten more minutes and then we rest." },
    { by: 'b', say: "You said that an hour ago." },
    { by: 'a', say: "And look how far we've come." },
    { by: 'b', conf: "We were both dying. {a} kept us going with terrible jokes." },
  ] },
  { id: 'fr.se5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Here. Take my share. You need it more." },
    { by: 'b', say: "You're just as tired as I am." },
    { by: 'a', say: "Then we'll split it." },
  ] },
  { id: 'fr.se6', turns: [
    { by: 'b', say: "Remind me why we signed up for this." },
    { by: 'a', say: "The money." },
    { by: 'b', say: "Right. The money." },
    { beat: 'They both start laughing, too tired to stop.' },
  ] },
];
const STRUGGLE_RIVALS = [
  { id: 'fr.sr1', turns: [
    { beat: "{a} and {b} have barely spoken in days. When the rain floods camp in the night, they're the only two who get up to deal with it." },
    { by: 'b', conf: "We didn't talk. We worked. It counts for something." },
  ] },
  { id: 'fr.sr2', turns: [
    { by: 'a', say: "Hold this end." },
    { by: 'b', say: "I know how to hold a rope." },
    { by: 'a', say: "Then hold it." },
    { beat: 'They fix the whole thing together. Neither says thank you. Both of them think it.' },
  ] },
  { id: 'fr.sr3', turns: [
    { by: 'a', say: "Truce? Just until this is done?" },
    { by: 'b', say: "Just until this is done." },
    { by: 'a', conf: "The truce was supposed to end when the work did. It hasn't. I'm not sure it will." },
  ] },
  { id: 'fr.sr4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I can't believe I'm stuck doing this with YOU." },
    { by: 'b', say: "Feeling's mutual." },
    { beat: 'Two hours later they are laughing at how badly they did it.' },
  ] },
  { id: 'fr.sr5', turns: [
    { by: 'b', say: "You're not as bad as I thought." },
    { by: 'a', say: "You are exactly as bad as I thought. But you're useful." },
    { by: 'b', conf: "That's the nicest thing {a} has ever said to me. I'll take it." },
  ] },
  { id: 'fr.sr6', turns: [
    { beat: "{a} and {b} are the last two still pushing through a miserable day. Neither of them brings up the game." },
    { by: 'a', conf: "We don't like each other. Today that didn't matter." },
  ] },
];
const STRUGGLE_PLAIN = [
  { id: 'fr.sp1', turns: [
    { by: 'a', say: "Rain, hunger, cold. Anything else today?" },
    { by: 'b', say: "Don't jinx it." },
    { beat: 'A crab pinches {a}\'s toe. {b} laughs so hard {b} has to sit down.' },
  ] },
  { id: 'fr.sp2', turns: [
    { beat: "A hard day at camp leaves {a} and {b} sitting together in silence. The kind where nothing needs to be said." },
    { by: 'a', conf: "We didn't talk. I've never felt more like I had somebody out here." },
  ] },
  { id: 'fr.sp3', turns: [
    { by: 'b', say: "Worst day so far?" },
    { by: 'a', say: "Top three. You?" },
    { by: 'b', say: "Number one. But you made it number two." },
  ] },
  { id: 'fr.sp4', turns: [
    { beat: "{b} sees {a} struggling with the firewood and starts helping without a word." },
    { by: 'a', say: "Thanks." },
    { by: 'b', say: "Don't mention it." },
    { by: 'a', conf: "{b} didn't make it a thing. That's why it was a thing." },
  ] },
  { id: 'fr.sp5', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Today was brutal. We still won it." },
    { by: 'b', say: "Won what?" },
    { by: 'a', say: "The day. We survived it. That's a win." },
  ] },
  { id: 'fr.sp6', turns: [
    { by: 'b', say: "If this gets any worse, I'm going to cry." },
    { by: 'a', say: "Want to cry together? Efficient." },
    { beat: 'Neither of them cries. They laugh until it hurts instead.' },
  ] },
  { id: 'fr.sp7', when: { age: 'older' }, turns: [
    { by: 'a', say: "I've worked double shifts easier than this." },
    { by: 'b', say: "I've never worked a double shift." },
    { by: 'a', say: "Congratulations. Now you have." },
  ] },
  { id: 'fr.sp8', turns: [
    { by: 'a', say: "We just have to make it to tomorrow." },
    { by: 'b', say: "And then?" },
    { by: 'a', say: "Then we make it to the day after." },
    { by: 'b', conf: "{a} breaks everything into small pieces. It's the only way I'm getting through this." },
  ] },
];
const THANKS = [
  { id: 'fr.t1', turns: [
    { by: 'a', say: "I haven't said it, but what you did for me back there? I won't forget it." },
    { by: 'b', say: "It was nothing." },
    { by: 'a', say: "It wasn't nothing." },
    { by: 'b', conf: "In this game, \"I won't forget it\" is a promise. {a} meant it." },
  ] },
  { id: 'fr.t2', turns: [
    { by: 'a', say: "Remember when you covered for me at the water? I've been meaning to say thanks." },
    { by: 'b', say: "That was days ago." },
    { by: 'a', say: "I've been carrying it." },
  ] },
  { id: 'fr.t3', when: { register: 'shy' }, turns: [
    { beat: "{a} leaves a cracked coconut by {b}'s spot without a word." },
    { by: 'b', say: "Was this you?" },
    { by: 'a', say: "Maybe. Thanks. For before." },
  ] },
  { id: 'fr.t4', when: { loyal: true }, turns: [
    { by: 'a', say: "You had my back. Now I've got yours. That's how it works with me." },
    { by: 'b', say: "That's a big promise." },
    { by: 'a', say: "I don't make small ones." },
  ] },
  { id: 'fr.t5', turns: [
    { by: 'a', say: "Hey. Thanks for checking on me the other day." },
    { by: 'b', say: "You noticed?" },
    { by: 'a', say: "I notice who notices." },
  ] },
  { id: 'fr.t6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm bad at this, so I'll say it fast. Thank you. Okay. Done." },
    { by: 'b', say: "For what?" },
    { by: 'a', say: "Don't make me say it twice." },
  ] },
  { id: 'fr.t7', turns: [
    { by: 'a', say: "You stuck up for me when nobody else did." },
    { by: 'b', say: "Anyone would have." },
    { by: 'a', say: "Nobody did. You did." },
    { by: 'a', conf: "I owe {b}. In this game, owing somebody means something." },
  ] },
  { id: 'fr.t8', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'm not good at gratitude. But you earned some." },
    { by: 'b', say: "Is that a thank-you?" },
    { by: 'a', say: "It's an IOU. Better than a thank-you." },
  ] },
];
const COMFORT = [
  { id: 'fr.c1', turns: [
    { beat: '{b} is sitting alone, knees pulled up. {a} sits down next to {b.obj} without a word.' },
    { by: 'b', say: "I'm fine." },
    { by: 'a', say: "Sure. I'll just sit here while you're fine." },
    { by: 'b', conf: "Nobody else checked on me. {a} did." },
  ] },
  { id: 'fr.c2', turns: [
    { by: 'a', say: "Hey. You don't have to talk. Want some water?" },
    { by: 'b', say: "Yeah. Thanks." },
    { beat: 'They sit there until the sun goes down.' },
  ] },
  { id: 'fr.c3', when: { charm: true }, turns: [
    { by: 'a', say: "Okay, I'm going to make you laugh. Brace yourself." },
    { by: 'b', say: "I'm not in the mood." },
    { beat: '{a} tells the worst joke in the world. {b} laughs anyway.' },
    { by: 'b', conf: "{a} spotted I was having a bad day before I even knew it." },
  ] },
  { id: 'fr.c4', turns: [
    { by: 'b', say: "I think everyone's going to vote me out." },
    { by: 'a', say: "Not today. I'm not letting it happen today." },
    { by: 'b', conf: "{a} can't promise that. {a} promised it anyway. It helped." },
  ] },
  { id: 'fr.c5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Come here." },
    { beat: '{a} hugs {b} for a long time. {b} doesn\'t let go first.' },
    { by: 'a', conf: "Sometimes you don't need to fix anything. You just need a hug." },
  ] },
  { id: 'fr.c6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Who upset you? I'll go yell at them." },
    { by: 'b', say: "Nobody. It's just a bad day." },
    { by: 'a', say: "I'll yell at the day, then." },
    { by: 'b', conf: "{a} offered to fight a day for me. That's love, out here." },
  ] },
  { id: 'fr.c7', turns: [
    { by: 'a', say: "You're doing better than you think." },
    { by: 'b', say: "How would you know?" },
    { by: 'a', say: "Because I've been watching. You're still here." },
  ] },
  { id: 'fr.c8', when: { gap: 'older' }, turns: [
    { by: 'a', say: "When I was your age, I thought every bad day was the end of the world." },
    { by: 'b', say: "And?" },
    { by: 'a', say: "And it never was. This isn't either." },
  ] },
];
const OPEN = [
  { id: 'fr.o1', turns: [
    { by: 'a', say: "Can I tell you something? I'm scared." },
    { by: 'b', say: "Of the game?" },
    { by: 'a', say: "Of what it's turning me into." },
    { by: 'b', conf: "{a} trusted me with that. I'm going to be careful with it." },
  ] },
  { id: 'fr.o2', turns: [
    { beat: "It's late and the fire is low. {a} starts talking, and it isn't about the game." },
    { by: 'a', say: "I don't usually say this stuff out loud." },
    { by: 'b', say: "You can. I'm not going anywhere." },
  ] },
  { id: 'fr.o3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Everybody thinks I'm angry all the time. Mostly I'm just tired of being underestimated." },
    { by: 'b', say: "I didn't know that." },
    { by: 'a', say: "Nobody does. Now you do." },
  ] },
  { id: 'fr.o4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Don't tell anyone, but I'm not as confident as I look." },
    { by: 'b', say: "You look very confident." },
    { by: 'a', say: "That's the problem. It's all a look." },
  ] },
  { id: 'fr.o5', turns: [
    { by: 'a', say: "I almost didn't come on this show." },
    { by: 'b', say: "Why not?" },
    { by: 'a', say: "Because I didn't think anyone would like me." },
    { by: 'b', say: "I like you." },
    { by: 'a', conf: "That's all it took. Three words. I'm a mess." },
  ] },
  { id: 'fr.o6', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Everyone back home thinks I'm going to embarrass myself." },
    { by: 'b', say: "Are you?" },
    { by: 'a', say: "Probably. I'd still rather be here." },
  ] },
  { id: 'fr.o7', turns: [
    { by: 'b', say: "You okay? You went quiet." },
    { by: 'a', say: "I miss home. Is that stupid?" },
    { by: 'b', say: "It'd be stupid if you didn't." },
  ] },
  { id: 'fr.o8', when: { age: 'older' }, turns: [
    { by: 'a', say: "I came here to prove I've still got it. I'm not sure I do." },
    { by: 'b', say: "You do. I've watched you." },
    { by: 'a', conf: "{b} is half my age and just gave me the best pep talk of my life." },
  ] },
];
const SUNRISE = [
  { id: 'fr.su1', turns: [
    { beat: "Everyone else is asleep. {a} and {b} watch the sky change colour." },
    { by: 'b', say: "This is the only time out here that feels quiet." },
    { by: 'a', say: "I know. That's why I'm up." },
    { by: 'a', conf: "The most important conversation of my day happens before it starts." },
  ] },
  { id: 'fr.su2', turns: [
    { by: 'a', say: "You're up early." },
    { by: 'b', say: "Couldn't sleep. You?" },
    { by: 'a', say: "Never can." },
    { beat: 'They sit and talk about nothing until the others start waking up.' },
  ] },
  { id: 'fr.su3', turns: [
    { by: 'b', say: "Do you ever forget it's a game? Just for a second?" },
    { by: 'a', say: "Right now. Right now I forgot." },
  ] },
  { id: 'fr.su4', when: { calm: true }, turns: [
    { beat: '{a} and {b} sit with their feet in the water as the sun comes up.' },
    { by: 'a', conf: "{b} gets it. Some mornings you just need someone to sit next to." },
  ] },
  { id: 'fr.su5', turns: [
    { by: 'a', say: "What's the first thing you'll do when you get home?" },
    { by: 'b', say: "Sleep in. Past sunrise. On purpose." },
    { by: 'a', say: "Living the dream." },
  ] },
  { id: 'fr.su6', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Morning run?" },
    { by: 'b', say: "Morning walk." },
    { by: 'a', say: "Fine. Morning walk. But fast." },
    { by: 'b', conf: "We walked. We talked. It was the best part of the day, and it was over by seven." },
  ] },
  { id: 'fr.su7', turns: [
    { beat: "{a} and {b} make the first fire of the day together while everyone else sleeps." },
    { by: 'b', say: "Should we wake them?" },
    { by: 'a', say: "Let's have five more minutes first." },
  ] },
  { id: 'fr.su8', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I saved you the warm spot." },
    { by: 'b', say: "There's a warm spot?" },
    { by: 'a', say: "Right next to me." },
  ] },
];
const MEAL = [
  { id: 'fr.m1', turns: [
    { by: 'a', say: "Half for you, half for me." },
    { by: 'b', say: "That's the last of it." },
    { by: 'a', say: "Which is why it's half." },
    { by: 'b', say: "You could've just eaten it. Nobody would've known." },
    { by: 'a', say: "I'd have known. Besides, you look hungrier than me." },
    { by: 'b', say: "I am hungrier than you. Thank you." },
    { by: 'b', conf: "{a} split the last bite down the middle. Out here that's basically a vow." },
  ] },
  { id: 'fr.m2', turns: [
    { beat: "{a} notices {b} hasn't eaten all day and quietly hands over the rest of {a.posAdj} portion." },
    { by: 'b', say: "I can't take this." },
    { by: 'a', say: "Too late. It's yours now." },
  ] },
  { id: 'fr.m3', turns: [
    { by: 'b', say: "This tastes terrible." },
    { by: 'a', say: "Want the rest of mine?" },
    { by: 'b', say: "Yes, obviously." },
  ] },
  { id: 'fr.m4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Eating contest. Who can finish this first?" },
    { by: 'b', say: "It's two spoonfuls." },
    { by: 'a', say: "Then it'll be quick." },
    { beat: 'It is not quick. The food is awful. They both lose.' },
  ] },
  { id: 'fr.m5', turns: [
    { by: 'a', say: "On a scale of one to ten?" },
    { by: 'b', say: "Three." },
    { by: 'a', say: "Generous." },
    { by: 'b', say: "I'm in a good mood. You're here." },
  ] },
  { id: 'fr.m6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I saved you the crispy bit." },
    { by: 'b', say: "There's a crispy bit?" },
    { by: 'a', say: "There's always a crispy bit if you know where to look." },
  ] },
  { id: 'fr.m7', turns: [
    { beat: "{a} and {b} eat together away from the group, talking about every meal they'd kill for right now." },
    { by: 'b', conf: "We described food for an hour. It was torture. I loved it." },
  ] },
  { id: 'fr.m8', when: { age: 'older' }, turns: [
    { by: 'a', say: "Eat. You're young, you need it." },
    { by: 'b', say: "You need it too." },
    { by: 'a', say: "I need it less. I've got reserves." },
  ] },
];
const SECRET = [
  { id: 'fr.sc1', turns: [
    { by: 'a', say: "I haven't told anyone here this." },
    { by: 'b', say: "You don't have to." },
    { by: 'a', say: "I want to." },
    { beat: '{a} talks about life back home. Real life. {b} listens to every word.' },
    { by: 'b', conf: "I see {a} as a whole person now. Not a player. That's dangerous. I don't care." },
  ] },
  { id: 'fr.sc2', when: { sharp: true }, turns: [
    { by: 'b', say: "Can I ask you something? Why are you really here?" },
    { by: 'a', say: "That's a big question." },
    { by: 'b', say: "You can give me the small answer." },
    { by: 'a', say: "No. You asked right. You get the big one." },
  ] },
  { id: 'fr.sc3', turns: [
    { by: 'a', say: "Promise you won't tell anyone?" },
    { by: 'b', say: "Promise." },
    { by: 'a', say: "I'm terrified of birds." },
    { by: 'b', say: "That's it?" },
    { by: 'a', say: "We're surrounded by birds. Every day. All day." },
  ] },
  { id: 'fr.sc4', when: { loyal: true }, turns: [
    { by: 'a', conf: "I told {b} something about my family I've never told anyone. I don't share like that. With {b}, I did." },
  ] },
  { id: 'fr.sc5', turns: [
    { by: 'a', say: "I almost quit on day two." },
    { by: 'b', say: "What stopped you?" },
    { by: 'a', say: "Honestly? You did. You said something nice at the fire." },
    { by: 'b', conf: "I don't even remember what I said. {a} remembered it for weeks." },
  ] },
  { id: 'fr.sc6', when: { job: true }, turns: [
    { by: 'a', say: "Everyone thinks I'm just {job}. That's not why I came." },
    { by: 'b', say: "Then why?" },
    { by: 'a', say: "To find out if I'm more than that." },
  ] },
  { id: 'fr.sc7', when: { home: true }, turns: [
    { by: 'a', say: "Back in {home}, nobody would believe I'm doing this." },
    { by: 'b', say: "Why not?" },
    { by: 'a', say: "Because I've never done anything brave in my life. Until now." },
  ] },
  { id: 'fr.sc8', turns: [
    { by: 'a', say: "Can I tell you the real reason I need this money?" },
    { by: 'b', say: "Only if you want to." },
    { beat: '{a} tells {b}. {b} is quiet for a long time after.' },
    { by: 'b', conf: "Now I know what {a} is playing for. That changes how I see everything." },
  ] },
];
// c is giving b a hard time ({more}, a second one, when there is one): camp-events.js protectiveInstinct
// picks them, the people here who like b least, and they are in every one of these
const DEFEND_LOUD = [
  { id: 'fr.dl1', when: { third: true }, turns: [
    { by: 'c', say: "I'm just saying, {b} hasn't done much around here." },
    { by: 'a', say: "Not {b}, {c}. Pick on somebody else." },
    { by: 'b', conf: "{c} has been on my case for days, and {a} shut it down in about two seconds." },
  ] },
  { id: 'fr.dl2', when: { third: true }, turns: [
    { by: 'a', say: "If you've got a problem with {b}, {c}, you can bring it to me." },
    { beat: "{c} doesn't bring it to {a}." },
    { by: 'b', say: "You didn't have to do that." },
    { by: 'a', say: "Yes, I did." },
  ] },
  { id: 'fr.dl3', when: { register: 'fiery', third: true }, turns: [
    { by: 'a', say: "Leave {b} ALONE, {c}. Seriously, back off." },
    { by: 'c', say: "Okay! Okay, relax, it was a joke." },
    { by: 'b', conf: "{a} yelled at {c} for me, and {c} hasn't said my name since." },
  ] },
  { id: 'fr.dl4', when: { third: true }, turns: [
    { by: 'c', say: "Some of us are actually working today, {b}." },
    { by: 'a', say: "{b} pulls more weight than you do, {c}, so stop." },
    { by: 'b', say: "Thanks." },
    { by: 'a', say: "Don't thank me. It's true." },
  ] },
  { id: 'fr.dl5', when: { strong: true, more: true, third: true }, turns: [
    { beat: "{c} and {more} are giving {b} a hard time. {a} walks over and just stands between them." },
    { by: 'c', conf: "Nobody wants to argue with {a}. Not even me, and I wanted to." },
  ] },
  { id: 'fr.dl5b', when: { strong: true, more: false, third: true }, turns: [
    { beat: "{c} is giving {b} a hard time until {a} walks over and stands between them." },
    { by: 'c', say: "...Fine. Whatever." },
    { by: 'b', conf: "{a} didn't have to say anything. Nobody wants to argue with {a}." },
  ] },
  { id: 'fr.dl6', when: { more: true, third: true }, turns: [
    { by: 'a', say: "Funny how {c} and {more} bring up {b} every single time something goes wrong." },
    { by: 'c', say: "We're just saying what everyone's thinking." },
    { by: 'a', say: "No, you're saying it. Everyone else is just listening to you." },
    { by: 'b', conf: "{a} called out {c} and {more} in front of everyone. Now everybody knows who's been on my case." },
  ] },
];
const DEFEND_QUIET = [
  { id: 'fr.dq1', turns: [
    { beat: "When {b}'s name comes up, {a} quietly steers the conversation somewhere else." },
    { by: 'a', conf: "{b} doesn't know I did that. {b} doesn't need to know." },
  ] },
  { id: 'fr.dq2', turns: [
    { by: 'a', say: "Hey. Watch yourself. Your name's been floating." },
    { by: 'b', say: "Since when?" },
    { by: 'a', say: "Since yesterday. I've been pushing it back down." },
  ] },
  { id: 'fr.dq3', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Every time someone says {b}, I give them a different name. {b} has no idea I'm the only reason {b} is still here." },
  ] },
  { id: 'fr.dq4', turns: [
    { by: 'b', say: "Why does everyone keep being weird around me?" },
    { by: 'a', say: "Don't worry about it. I've got it handled." },
    { by: 'b', conf: "I don't know what {a} handled. I'm just glad somebody did." },
  ] },
  { id: 'fr.dq5', when: { loyal: true }, turns: [
    { by: 'a', conf: "{b} has my loyalty. Loyalty means working behind the scenes. Nobody needs a thank-you." },
  ] },
  { id: 'fr.dq6', turns: [
    { beat: "{a} spends the afternoon talking to people one by one. By sunset, {b}'s name has stopped coming up." },
    { by: 'a', conf: "I didn't campaign. I just reminded people of everything {b} does around here." },
  ] },
];
const DEFEND_SURPRISE = [
  { id: 'fr.ds1', turns: [
    { by: 'a', say: "Actually, {b} has been really good to me. So let's not." },
    { beat: 'Everyone looks at {a}. {a} looks surprised too.' },
    { by: 'a', conf: "I didn't plan that. It just came out. I meant it." },
  ] },
  { id: 'fr.ds2', turns: [
    { by: 'b', say: "Did you just defend me?" },
    { by: 'a', say: "I guess I did." },
    { by: 'b', say: "Since when do you defend people?" },
    { by: 'a', say: "Since right now, apparently." },
  ] },
  { id: 'fr.ds3', turns: [
    { by: 'a', say: "That's not fair to {b}." },
    { by: 'b', conf: "{a} has never said a nice word about me. Today {a} stood up for me. I'm so confused." },
  ] },
  { id: 'fr.ds4', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um. I think {b} is nice. Actually." },
    { beat: 'The group goes quiet. {a} goes red.' },
    { by: 'b', conf: "{a} never talks. {a} talked for me. I'll never forget that." },
  ] },
  { id: 'fr.ds5', turns: [
    { by: 'a', say: "{b} covered for me last week. I'm not voting for {b}. Sorry." },
    { by: 'a', conf: "I owed {b} one. Now we're even. Mostly." },
  ] },
  { id: 'fr.ds6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You know what? No. {b} doesn't deserve this." },
    { by: 'a', conf: "I don't even like {b} that much. I just hate a pile-on more." },
  ] },
];
const TEACH_PHYSICAL = [
  { id: 'fr.tp1', turns: [
    { by: 'a', say: "You're climbing with your arms. Use your legs. Push, don't pull." },
    { beat: '{b} tries again and gets twice as high.' },
    { by: 'b', say: "Whoa." },
    { by: 'a', conf: "If {b} is stronger, we're stronger. That's not charity. That's sense." },
  ] },
  { id: 'fr.tp2', turns: [
    { by: 'a', say: "Breathe out on the hard part. Every time." },
    { by: 'b', say: "That's it?" },
    { by: 'a', say: "That's half of it. The other half is not quitting." },
  ] },
  { id: 'fr.tp3', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Again. Faster. Again." },
    { by: 'b', say: "Are you training me or torturing me?" },
    { by: 'a', say: "Yes." },
    { by: 'b', conf: "{a} is a nightmare coach. I'm also way faster than I was this morning." },
  ] },
  { id: 'fr.tp4', turns: [
    { by: 'b', say: "How do you carry that much without falling over?" },
    { by: 'a', say: "Low. Keep it close. Like it's a baby." },
    { by: 'b', say: "A really heavy baby." },
  ] },
  { id: 'fr.tp5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "You're doing great! One more try!" },
    { beat: '{b} gets it on the next try. {a} cheers louder than {b} does.' },
  ] },
  { id: 'fr.tp6', turns: [
    { by: 'a', say: "Watch my feet, not my hands." },
    { by: 'b', conf: "{a} fixed in ten minutes what I'd been getting wrong for a week. I owe {a} a lot." },
  ] },
];
const TEACH_STRATEGIC = [
  { id: 'fr.ts1', turns: [
    { by: 'a', say: "Okay. Who's with who? Draw it in the sand." },
    { beat: '{b} draws it. {a} moves two names. {b}\'s eyes go wide.' },
    { by: 'b', say: "Oh. OH." },
    { by: 'b', conf: "{a} just showed me the whole game. I was playing blind." },
  ] },
  { id: 'fr.ts2', turns: [
    { by: 'a', say: "Never tell anyone your target until the last minute." },
    { by: 'b', say: "Why?" },
    { by: 'a', say: "Because the last person you tell is the first person who tells." },
  ] },
  { id: 'fr.ts3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Lesson one. Everybody lies. Lesson two. Watch who they lie to." },
    { by: 'b', say: "Is this lesson a lie?" },
    { by: 'a', say: "Now you're learning." },
  ] },
  { id: 'fr.ts4', turns: [
    { by: 'b', say: "How did you know that vote was coming?" },
    { by: 'a', say: "Count who stops talking when you walk up." },
    { by: 'b', conf: "{a} made me see the vote math. I'm a little scared of {a} now. And grateful." },
  ] },
  { id: 'fr.ts5', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Don't react. Ever. Reactions are information." },
    { by: 'b', say: "Got it." },
    { by: 'a', say: "You just nodded. That's a reaction." },
  ] },
  { id: 'fr.ts6', turns: [
    { by: 'a', say: "You're too nice in conversations. People take that as a yes." },
    { by: 'b', say: "So I should be mean?" },
    { by: 'a', say: "No. Just say \"I'll think about it\" more." },
  ] },
];
const TEACH_MENTAL = [
  { id: 'fr.tm1', turns: [
    { by: 'a', say: "Do the corners first. Always the corners." },
    { beat: '{b} solves the driftwood puzzle twice as fast the second time.' },
    { by: 'b', say: "Why does that work?" },
    { by: 'a', say: "It just does. Don't question the corners." },
  ] },
  { id: 'fr.tm2', turns: [
    { by: 'b', say: "I'm terrible at memory stuff." },
    { by: 'a', say: "Make it a story. The red shell went to the big rock to meet the blue shell." },
    { by: 'b', conf: "{a} turned shells into a soap opera. I remembered all of them." },
  ] },
  { id: 'fr.tm3', when: { brainy: true }, turns: [
    { by: 'a', say: "It's not about being smart. It's about patterns. Look for the thing that repeats." },
    { by: 'b', say: "Everything repeats out here. Rice. Rice. Rice." },
    { by: 'a', say: "See? You're already getting it." },
  ] },
  { id: 'fr.tm4', turns: [
    { by: 'a', say: "Slow down. You're rushing. Rushing is losing." },
    { by: 'b', conf: "{a} made me do the same puzzle eleven times. By the end, I could do it with my eyes shut." },
  ] },
  { id: 'fr.tm5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "You're actually really good at this. You just get nervous." },
    { by: 'b', say: "I'm nervous right now." },
    { by: 'a', say: "Then pretend I'm not watching." },
  ] },
  { id: 'fr.tm6', turns: [
    { by: 'b', say: "Teach me the trick." },
    { by: 'a', say: "There's no trick. Just practice." },
    { by: 'b', say: "That's the worst trick." },
  ] },
];
const MENTOR_SPIRAL = [
  { id: 'fr.ms1', turns: [
    { by: 'b', say: "I've messed everything up. Everyone hates me." },
    { by: 'a', say: "Who, specifically?" },
    { by: 'b', say: "Everyone!" },
    { by: 'a', say: "Name one." },
    { beat: '{b} can\'t. {b} starts to calm down.' },
    { by: 'a', conf: "I didn't fix anything. I just asked questions until {b} found the ground again." },
  ] },
  { id: 'fr.ms2', turns: [
    { by: 'a', say: "Breathe with me. In. Out." },
    { by: 'b', say: "This is stupid." },
    { by: 'a', say: "Is it working?" },
    { by: 'b', say: "...A little." },
  ] },
  { id: 'fr.ms3', when: { gap: 'older' }, turns: [
    { by: 'a', say: "I've seen people your age lose it out here. You're not going to be one of them." },
    { by: 'b', say: "How do you know?" },
    { by: 'a', say: "Because you're talking to me instead of yelling at a tree." },
  ] },
  { id: 'fr.ms4', turns: [
    { by: 'b', say: "I can't think straight." },
    { by: 'a', say: "Then don't. Just sit for a minute. The game will still be there." },
    { by: 'b', conf: "{a} talked me down from the edge. I didn't even know I was on it." },
  ] },
  { id: 'fr.ms5', when: { calm: true }, turns: [
    { by: 'a', say: "Whatever you're thinking, it's worse in your head than it is out here." },
    { by: 'b', say: "How do you stay so calm?" },
    { by: 'a', say: "Practice. Lots of bad days." },
  ] },
  { id: 'fr.ms6', turns: [
    { by: 'a', say: "One thing at a time. What's the first thing you need?" },
    { by: 'b', say: "Water. And a hug." },
    { by: 'a', say: "I can do both." },
  ] },
];
const MENTOR_ROUGH = [
  { id: 'fr.mr1', turns: [
    { by: 'a', say: "You're fine. Just breathe. Play your game." },
    { by: 'b', say: "What if my game isn't working?" },
    { by: 'a', say: "Then adjust. Not panic. Adjust." },
  ] },
  { id: 'fr.mr2', turns: [
    { by: 'a', conf: "{b} is overthinking everything. I cut through it in one sentence. {b} exhaled for the first time in hours." },
  ] },
  { id: 'fr.mr3', turns: [
    { by: 'b', say: "Did I mess up today?" },
    { by: 'a', say: "A little. Everybody does. Tomorrow's a new day." },
    { by: 'b', say: "That's very wise." },
    { by: 'a', say: "I got it off a mug." },
  ] },
  { id: 'fr.mr4', when: { age: 'older' }, turns: [
    { by: 'a', say: "When you've done as many dumb things as I have, one bad day stops scaring you." },
    { by: 'b', say: "How many dumb things have you done?" },
    { by: 'a', say: "Ask me at the end. It's a long list." },
  ] },
  { id: 'fr.mr5', turns: [
    { by: 'a', say: "Stop replaying it. You can't change it." },
    { by: 'b', say: "I can't stop." },
    { by: 'a', say: "Then replay it once more, out loud, and then we're done." },
    { by: 'b', conf: "Saying it out loud made it smaller. {a} knew it would." },
  ] },
  { id: 'fr.mr6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Emotions are fine. Just don't let them vote for you." },
    { by: 'b', conf: "{a} said that and walked off. I've been thinking about it all day." },
  ] },
];
const SOLIDARITY = [
  { id: 'fr.sl1', turns: [
    { beat: "{b} slips away from camp. When someone asks where {b} went, {a} answers without blinking." },
    { by: 'a', say: "Firewood. {b}'s getting firewood." },
    { by: 'b', say: "Was I getting firewood?" },
    { by: 'a', say: "You were now. I've got you." },
  ] },
  { id: 'fr.sl2', turns: [
    { by: 'a', conf: "{b} is catching heat. I didn't defend {b} out loud. I just steered two conversations somewhere else. That's what friends do here." },
  ] },
  { id: 'fr.sl3', turns: [
    { beat: "{a} and {b} sit next to each other at the fire. Neither says anything. Everyone can see they're a pair." },
    { by: 'b', conf: "We don't have to talk about it. We both know." },
  ] },
  { id: 'fr.sl4', turns: [
    { by: 'b', say: "Thanks for today." },
    { by: 'a', say: "For what?" },
    { by: 'b', say: "You know what." },
    { by: 'a', say: "I don't know what you're talking about." },
    { by: 'a', conf: "I knew exactly what {b} was talking about." },
  ] },
  { id: 'fr.sl5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} is my person. I'll never say it out loud. I'll never vote against {b} either." },
  ] },
  { id: 'fr.sl6', turns: [
    { beat: '{a} quietly does {b}\'s chores while {b} rests up.' },
    { by: 'b', say: "Did you do my water run?" },
    { by: 'a', say: "Didn't see anything." },
  ] },
  { id: 'fr.sl7', when: { loyal: true }, turns: [
    { by: 'a', say: "Whatever happens with the vote, I'm with you." },
    { by: 'b', say: "I didn't ask." },
    { by: 'a', say: "I know. That's why I'm saying it." },
  ] },
];
const JOKE = [
  { id: 'fr.j1', turns: [
    { by: 'a', say: "Pineapple." },
    { beat: '{b} loses it completely. Nobody else knows why.' },
    { by: 'b', conf: "You had to be there. You really, really had to be there." },
  ] },
  { id: 'fr.j2', turns: [
    { beat: '{a} and {b} do their secret handshake every time they pass each other. It takes eleven seconds.' },
    { by: 'b', conf: "It's stupid. We do it about forty times a day. I'd die for it." },
  ] },
  { id: 'fr.j3', turns: [
    { by: 'a', say: "Remember the thing?" },
    { by: 'b', say: "The THING." },
    { beat: 'Both of them are crying laughing. Everyone else stares.' },
  ] },
  { id: 'fr.j4', turns: [
    { by: 'b', say: "Code word if we're in trouble?" },
    { by: 'a', say: "Banana." },
    { by: 'b', say: "What if somebody says banana for real?" },
    { by: 'a', say: "Then we're in trouble for real." },
  ] },
  { id: 'fr.j5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Don't. Say. It." },
    { by: 'b', say: "Goose." },
    { by: 'a', say: "I SAID DON'T SAY IT!" },
    { by: 'b', say: "I'm just saying a word. It's a normal word. Goose." },
    { by: 'a', say: "One more time and I'm telling everybody about the thing with the canoe." },
    { by: 'b', say: "...Okay. Truce. No goose, no canoe." },
    { by: 'b', conf: "There was an incident with a goose. {a} will never live it down. I'll make sure." },
  ] },
  { id: 'fr.j6', turns: [
    { by: 'a', say: "Same time tomorrow?" },
    { by: 'b', say: "Same rock?" },
    { by: 'a', say: "Same rock. If anybody else is on it, we fight them." },
    { by: 'b', say: "Politely, though." },
    { by: 'a', say: "Very politely. And then we fight them." },
    { by: 'b', say: "Deal. Same rock, same time, polite fighting." },
    { by: 'b', conf: "We have a rock now. It's our rock. Don't sit on our rock." },
  ] },
  { id: 'fr.j7', turns: [
    { beat: '{a} gives every single person at camp a secret nickname, and only tells {b}.' },
    { by: 'b', conf: "I can't look at anyone without laughing now. {a} ruined everyone for me." },
  ] },
  { id: 'fr.j8', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Weather report?" },
    { by: 'b', say: "Storm coming. Name starts with a vowel." },
    { by: 'a', conf: "Our weather reports are about the vote. Nobody else has figured that out. Love that." },
  ] },
];
const LAUGH = [
  { id: 'fr.l1', turns: [
    { by: 'a', say: "Okay, true story. Before I came here, I got stuck in a revolving door for twenty minutes." },
    { by: 'b', say: "How?" },
    { by: 'a', say: "I kept going around. I was too embarrassed to stop." },
    { by: 'c', say: "Twenty minutes?!" },
    { beat: 'The whole camp is in tears. For a few minutes, the game doesn\'t exist.' },
  ] },
  { id: 'fr.l2', turns: [
    { beat: '{a} trips over a log, flips completely over, and lands sitting perfectly upright.' },
    { by: 'a', say: "Meant to do that." },
    { by: 'b', say: "Ten out of ten." },
    { by: 'c', say: "Do it again!" },
  ] },
  { id: 'fr.l3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "WHO keeps putting sand in my shoes?!" },
    { by: 'b', say: "The beach?" },
    { by: 'a', say: "Don't you get smart with me!" },
    { by: 'c', conf: "{a} is yelling at the beach. Everyone is crying laughing. Best day all week." },
  ] },
  { id: 'fr.l4', turns: [
    { by: 'a', say: "Let me do the host." },
    { beat: '{a} does the host. It is perfect. Even the camera guy laughs.' },
    { by: 'b', say: "Do the host when the food's late." },
    { by: 'c', say: "Do the host stepping on a crab!" },
  ] },
  { id: 'fr.l5', turns: [
    { by: 'b', say: "What's the dumbest thing you've ever done?" },
    { by: 'a', say: "Signed up for this show." },
    { by: 'c', say: "Second dumbest." },
    { by: 'a', say: "Agreed to go first in this conversation." },
  ] },
  { id: 'fr.l6', when: { charm: true }, turns: [
    { by: 'a', say: "Okay, everyone, I'm giving out awards. Best snorer goes to {b}." },
    { by: 'b', say: "Hey!" },
    { by: 'a', say: "Most dramatic sigh goes to {c}." },
    { by: 'c', say: "That's fair, actually." },
  ] },
  { id: 'fr.l7', turns: [
    { beat: 'A seagull lands on {a}\'s head and refuses to leave.' },
    { by: 'a', say: "Is it gone? Tell me it's gone." },
    { by: 'b', say: "It's making itself comfortable." },
    { by: 'c', say: "It likes you!" },
  ] },
  { id: 'fr.l8', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Fine. I'll admit it. I can't swim." },
    { by: 'b', say: "There's water EVERYWHERE out here!" },
    { by: 'c', say: "You did the water challenge!" },
    { by: 'a', say: "Very, very badly." },
  ] },
];
const CELEBRATE = [
  { id: 'fr.ce1', turns: [
    { by: 'a', say: "We did it! WE DID IT!" },
    { by: 'b', say: "Group hug!" },
    { by: 'c', say: "Ow! Somebody's elbow!" },
    { beat: 'Everybody is laughing and hugging. Alliances don\'t matter for a minute.' },
  ] },
  { id: 'fr.ce2', turns: [
    { by: 'a', say: "Dance party. Right now. Nobody's allowed to say no." },
    { by: 'b', say: "There's no music." },
    { by: 'a', say: "Then sing!" },
    { by: 'c', conf: "We all sang. Badly. It's the happiest I've been out here." },
  ] },
  { id: 'fr.ce3', turns: [
    { beat: '{a} starts cheering and it\'s contagious. Within seconds the whole camp is shouting.' },
    { by: 'b', say: "What are we cheering for?" },
    { by: 'c', say: "Being alive, I think!" },
  ] },
  { id: 'fr.ce4', turns: [
    { by: 'a', say: "Toast! To us!" },
    { by: 'b', say: "With coconut water?" },
    { by: 'a', say: "With the finest coconut water money can't buy!" },
    { by: 'c', say: "To us!" },
  ] },
  { id: 'fr.ce5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Did you SEE that?! Did you SEE us?!" },
    { by: 'b', say: "We saw!" },
    { by: 'c', say: "We were there!" },
    { by: 'a', say: "I KNOW, and I'm going to talk about it ALL NIGHT!" },
  ] },
  { id: 'fr.ce6', turns: [
    { by: 'b', conf: "Something clicked today. Everybody ate together, laughed together. It won't last. But right now it's real." },
    { by: 'c', say: "Pass the fish!" },
    { by: 'a', say: "Celebration fish coming through!" },
  ] },
  { id: 'fr.ce7', when: { merged: false }, turns: [
    { by: 'a', say: "Undefeated! Well. Defeated less than them!" },
    { by: 'b', say: "We'll take it!" },
    { by: 'c', say: "Chant! Somebody start a chant!" },
  ] },
];
const RALLY = [
  { id: 'fr.ra1', turns: [
    { by: 'a', say: "Okay. Everybody up. We're still here. That's what matters." },
    { by: 'b', say: "We just had the worst day." },
    { by: 'a', say: "And tomorrow will be better, because we're making it better, starting with the fire." },
    { by: 'b', say: "The fire's out. It's been out for an hour." },
    { by: 'a', say: "Then that's the first thing we fix. Who's with me?" },
    { beat: "Slowly, people start getting up." },
    { by: 'b', say: "...Fine. I'll get wood." },
    { by: 'c', conf: "I believed {a}. I don't know why. I just did." },
  ] },
  { id: 'fr.ra2', turns: [
    { beat: "{a} doesn't give a speech. {a} just starts rebuilding the fire, then checking on people, one by one." },
    { by: 'b', say: "Need help?" },
    { by: 'a', say: "Always." },
    { by: 'c', conf: "One person started working. Then everyone did." },
  ] },
  { id: 'fr.ra3', turns: [
    { by: 'a', say: "Nobody's quitting today. Not on my watch." },
    { by: 'b', say: "Who said anything about quitting?" },
    { by: 'a', say: "Your faces did." },
    { by: 'c', say: "...Fair." },
  ] },
  { id: 'fr.ra4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Whatever happened today, it's done. Tomorrow we come back harder." },
    { by: 'b', say: "That's the spirit." },
    { by: 'c', say: "Can the spirit include a nap first?" },
    { by: 'a', say: "Fine. One nap. Then we come back harder." },
  ] },
  { id: 'fr.ra5', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Hey. I know today was hard. I made everyone a cup of hot water. It's not tea. But it's warm." },
    { by: 'b', say: "That's actually really nice." },
    { by: 'c', conf: "{a} turned the worst day into an okay one with hot water. I don't know how." },
  ] },
  { id: 'fr.ra6', turns: [
    { by: 'a', say: "Everybody say one good thing about today. One." },
    { by: 'b', say: "It's over." },
    { by: 'c', say: "Nobody got hurt." },
    { by: 'a', say: "See? Two good things. Momentum." },
  ] },
  { id: 'fr.ra7', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Um. I think we can still do this. If we stick together." },
    { beat: 'Everyone turns. {a} never speaks up.' },
    { by: 'b', say: "{a}'s right." },
    { by: 'c', conf: "When the quiet one rallies you, you listen." },
  ] },
];
const LIFT = [
  { id: 'fr.li1', turns: [
    { beat: '{a} goes around camp, checking in with everybody, one at a time.' },
    { by: 'b', say: "{a} just asked me how I slept. Nobody asks that." },
    { by: 'c', say: "Same. It was weirdly nice." },
  ] },
  { id: 'fr.li2', turns: [
    { by: 'a', say: "Who wants to hear the dumbest story of my life?" },
    { by: 'b', say: "Me." },
    { by: 'c', say: "Obviously me." },
    { beat: 'By the end of it, the whole camp feels lighter.' },
  ] },
  { id: 'fr.li3', when: { charm: true }, turns: [
    { by: 'c', say: "{a}, do the thing again!" },
    { by: 'a', say: "What thing?" },
    { by: 'c', say: "The thing that makes everybody happy!" },
    { by: 'a', say: "I don't have a thing. I just talk to people." },
    { by: 'b', say: "That's the thing. Nobody else here does it." },
    { by: 'a', say: "Okay, fine. Who wants to hear about the worst job I ever had?" },
    { by: 'b', conf: "{a} walked into a miserable camp and somehow, by evening, everybody was laughing. I couldn't tell you how." },
  ] },
  { id: 'fr.li4', turns: [
    { by: 'a', say: "Compliment circle. Everybody says one nice thing about the person on their left." },
    { by: 'b', say: "This is so cheesy." },
    { by: 'c', say: "{b}, you have very nice eyebrows." },
    { by: 'b', say: "...Okay, I like this game." },
  ] },
  { id: 'fr.li5', when: { calm: true }, turns: [
    { beat: "{a} doesn't say much. Just sits by the fire, calm. One by one, everyone drifts over." },
    { by: 'c', conf: "Being around {a} makes you calmer. I don't get it. I just sit closer." },
    { by: 'b', say: "Room for one more?" },
  ] },
  { id: 'fr.li6', turns: [
    { by: 'a', say: "I made everybody a little shell. As a good luck charm." },
    { by: 'b', say: "Did you make one for yourself?" },
    { by: 'a', say: "I forgot." },
    { by: 'c', say: "Here. Take mine. You need luck too." },
  ] },
];

export default {
  'friend.bond.any': BOND, 'friend.goof.any': GOOF,
  'friend.struggle.empty': STRUGGLE_EMPTY, 'friend.struggle.rivals': STRUGGLE_RIVALS, 'friend.struggle.plain': STRUGGLE_PLAIN,
  'friend.thanks.any': THANKS, 'friend.comfort.any': COMFORT, 'friend.open.any': OPEN, 'friend.sunrise.any': SUNRISE,
  'friend.meal.any': MEAL, 'friend.secret.any': SECRET,
  'friend.defend.loud': DEFEND_LOUD, 'friend.defend.quiet': DEFEND_QUIET, 'friend.defend.surprise': DEFEND_SURPRISE,
  'friend.teach.physical': TEACH_PHYSICAL, 'friend.teach.strategic': TEACH_STRATEGIC, 'friend.teach.mental': TEACH_MENTAL,
  'friend.mentor.spiral': MENTOR_SPIRAL, 'friend.mentor.rough': MENTOR_ROUGH,
  'friend.solidarity.any': SOLIDARITY, 'friend.joke.any': JOKE,
  'friend.laugh.any': LAUGH, 'friend.celebrate.any': CELEBRATE, 'friend.rally.any': RALLY, 'friend.lift.any': LIFT,
};
