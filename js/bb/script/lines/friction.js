// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/friction.js — the house falling out over nothing
// ══════════════════════════════════════════════════════════════════════
//
// Scripts, not templates (spec §4.4). Each entry is one exchange: lines said
// out loud (say), a Diary Room confessional (dr), a stage direction (beat).
// Roles: a is the one who has had enough, b is the one who did it, c is the
// third houseguest who steps in (present only when the ending is 'smoothed').
//
// The ENDING was decided before a word was picked (house-friction.js):
//   blowup    it turns into a real row; the bond takes a real hit
//   snipe     it stays small and passive-aggressive; it is remembered
//   smoothed  somebody else steps in and it ends with nobody shouting
//
// Every pool keeps at least three entries with no `when`. A line that leans
// on a fact (being on slop) says so in `when`, so it never airs where the
// fact is false. {count} is the number of people in the house, as a word.

export default {
  // ── the dishes ─────────────────────────────────────────────────────
  'friction.dishes.blowup': [
    { id: 'fd.b1', when: { early: false }, turns: [
      { beat: '{a} opens the dishwasher. It is full of clean plates nobody put away, and there is a sink full of dirty ones on top.' },
      { by: 'a', say: 'Whose pan is this?' },
      { by: 'b', say: "It's soaking." },
      { by: 'a', say: "It's been soaking since Tuesday, {b}. It's not soaking. It lives here now." },
      { by: 'b', say: 'Then wash it, if it bothers you that much.' },
      { by: 'a', dr: "I have washed {b}'s dishes for two weeks. Today I stopped, and today I said something." },
    ] },
    { id: 'fd.b2', turns: [
      { by: 'a', say: "I'm not doing this again. I'm not." },
      { by: 'b', say: 'Doing what?' },
      { by: 'a', say: 'Your dishes. Every single night. I am done.' },
      { by: 'b', say: "Wow. Okay. It's a fork, {a}." },
      { by: 'a', say: "It's never one fork!" },
      { beat: 'The kitchen goes quiet. Somebody on the couch turns the music up.' },
    ] },
    { id: 'fd.b3', turns: [
      { beat: '{b} drops a plate in the sink and heads for the door.' },
      { by: 'a', say: 'Excuse me. Excuse me!' },
      { by: 'b', say: 'What?' },
      { by: 'a', say: "You don't get to leave that there for the rest of us." },
      { by: 'b', say: "I'll do it later." },
      { by: 'a', say: 'You said that yesterday. Later does not exist in this house.' },
      { by: 'a', dr: "I didn't come here to be anybody's maid. I came here to win." },
    ] },
    { id: 'fd.b4', turns: [
      { by: 'a', say: 'Can everyone look at this sink? Can we all just look at it?' },
      { by: 'b', say: 'Are you seriously doing this in front of everybody?' },
      { by: 'a', say: "Yes. Because doing it in private didn't work." },
      { by: 'b', say: "You're unbelievable." },
      { by: 'a', say: "And you're still not washing it." },
      { beat: '{b} storms out to the backyard. {a} washes the pan, very loudly.' },
    ] },
    { id: 'fd.b5', turns: [
      { by: 'b', say: 'Why are you looking at me like that?' },
      { by: 'a', say: 'Because there are four bowls in this sink and every one of them is yours.' },
      { by: 'b', say: 'You counted my bowls?' },
      { by: 'a', say: "I didn't have to count. You eat cereal four times a day." },
      { by: 'b', say: 'Maybe mind your own business.' },
      { by: 'a', say: "It is my business. I'm the one who washes them!" },
    ] },
    { id: 'fd.b6', turns: [
      { by: 'a', say: "Is there a reason you can't rinse a plate?" },
      { by: 'b', say: "Is there a reason you can't stop nagging?" },
      { by: 'a', say: 'Nagging? I have asked you every day since we got here.' },
      { by: 'b', say: 'Exactly. Nagging.' },
      { by: 'a', dr: 'If {b} goes on the block this week, I am not going to pretend to be sad about it.' },
    ] },
    { id: 'fd.b7', when: { hohA: true }, turns: [
      { by: 'a', say: 'I have a whole room upstairs and I am still down here washing your plates.' },
      { by: 'b', say: 'Nobody asked you to.' },
      { by: 'a', say: "Somebody has to, {b}. It's never going to be you." },
      { by: 'b', say: 'Is this about the dishes or is this about the nominations?' },
      { by: 'a', say: "Keep talking and it'll be about both." },
    ] },
    { id: 'fd.b8', when: { again: true }, turns: [
      { by: 'a', say: 'Again, {b}? Really? Again?' },
      { by: 'b', say: 'Here we go.' },
      { by: 'a', say: 'Yes, here we go! Because we have had this exact conversation before!' },
      { by: 'b', say: "And you're going to keep having it, apparently." },
      { by: 'a', dr: "Same sink. Same pan. Same {b}. I'm starting to think it's personal." },
    ] },
  ],

  'friction.dishes.snipe': [
    { id: 'fd.s1', turns: [
      { beat: "{a} washes the dishes, {b}'s included, and stacks them very deliberately right in front of {b}." },
      { by: 'b', say: 'Thanks, I guess.' },
      { by: 'a', say: "Oh, don't thank me. I live to serve." },
      { by: 'b', say: 'Noted.' },
    ] },
    { id: 'fd.s2', turns: [
      { by: 'a', say: "Funny thing about these bowls. They don't wash themselves." },
      { by: 'b', say: "Funny thing about you. You don't stop talking." },
      { by: 'a', say: 'Enjoy your clean spoon, {b}.' },
    ] },
    { id: 'fd.s3', turns: [
      { by: 'a', say: 'Did the dish fairy come by again last night?' },
      { by: 'b', say: 'No idea what you mean.' },
      { by: 'a', say: "No. I bet you don't." },
      { by: 'a', dr: "I'm not going to fight about a sink. I'm just going to remember it." },
    ] },
    { id: 'fd.s4', turns: [
      { by: 'b', say: 'Are there any clean mugs?' },
      { by: 'a', say: 'There would be, if somebody washed theirs.' },
      { by: 'b', say: 'Right. Okay.' },
      { beat: '{b} rinses one mug. Just the one.' },
    ] },
    { id: 'fd.s5', turns: [
      { by: 'a', say: 'I made a chore chart.' },
      { by: 'b', say: 'Good for you.' },
      { by: 'a', say: "Your name's on it. Three times." },
      { by: 'b', say: "I'll take a look." },
      { by: 'a', say: "You won't." },
      { by: 'b', say: 'Probably not.' },
    ] },
    { id: 'fd.s6', turns: [
      { beat: '{a} hands {b} a dish towel without saying a word.' },
      { by: 'b', say: "What's this for?" },
      { by: 'a', say: "You'll work it out." },
      { beat: '{b} puts the towel down on the counter and walks away.' },
    ] },
    { id: 'fd.s7', when: { again: true }, turns: [
      { beat: '{a} looks at the sink, then at {b}, then back at the sink.' },
      { by: 'b', say: "Don't." },
      { by: 'a', say: "I didn't say anything." },
      { by: 'b', say: 'You said it last time.' },
      { by: 'a', say: 'And look how well that worked.' },
    ] },
  ],

  'friction.dishes.smoothed': [
    { id: 'fd.m1', turns: [
      { by: 'a', say: '{b}, I swear, if I find one more pan in this sink...' },
      { by: 'c', say: "Okay! I'll wash, you dry, {b} puts away. Nobody is getting nominated over a frying pan." },
      { by: 'b', say: 'Fine. Fine.' },
      { by: 'a', say: '...Fine.' },
      { by: 'c', dr: "Half the fights in this house are about food or dishes. I'm just trying to keep it to half." },
    ] },
    { id: 'fd.m2', turns: [
      { by: 'b', say: "It's one plate!" },
      { by: 'a', say: "It's never one plate!" },
      { by: 'c', say: "Hey. Both of you. Grab a towel. We'll be done in five minutes." },
      { beat: 'They do. It takes twelve minutes, but nobody shouts.' },
    ] },
    { id: 'fd.m3', turns: [
      { by: 'c', say: "What's going on in here?" },
      { by: 'a', say: '{b} thinks the sink is a storage unit.' },
      { by: 'c', say: "Okay, {b}, that one's on you." },
      { by: 'b', say: "Yeah, yeah. I'll do them now." },
      { by: 'a', say: 'Thank you.' },
      { by: 'c', say: 'See? Easy.' },
    ] },
    { id: 'fd.m4', turns: [
      { by: 'a', say: 'Why is it always me?' },
      { by: 'c', say: "It's not always you. Tonight it's me. {b}, you've got tomorrow." },
      { by: 'b', say: 'Deal.' },
      { by: 'a', dr: "I don't know how {c} does that. I was about to explode, and now I'm drying a colander." },
    ] },
    { id: 'fd.m5', turns: [
      { beat: '{a} and {b} are squaring off over the sink when {c} slides in between them with a tub of ice cream.' },
      { by: 'c', say: 'Peace offering. Nobody fights while there is ice cream.' },
      { by: 'b', say: "That's actually fair." },
      { by: 'a', say: '...I want the big spoon.' },
    ] },
    { id: 'fd.m6', turns: [
      { by: 'a', say: "Forget it. I'll do it myself, like always." },
      { by: 'c', say: 'No, sit down. {b} and I have got this. Right, {b}?' },
      { by: 'b', say: 'Right. Yeah. Sorry, {a}.' },
      { by: 'a', say: '...Thank you.' },
    ] },
    { id: 'fd.m7', when: { again: true }, turns: [
      { by: 'c', say: 'Not this again. You two, seriously.' },
      { by: 'a', say: 'Tell {b}, not me.' },
      { by: 'c', say: "I'm telling both of you. {b}, wash it. {a}, go sit down. I'll referee." },
      { by: 'b', say: 'Fine.' },
      { by: 'c', dr: 'Every week, the same two people and the same sink. I should get a whistle.' },
    ] },
  ],

  // ── somebody ate it ────────────────────────────────────────────────
  'friction.food.blowup': [
    { id: 'ff.b1', when: { havenot: true }, turns: [
      { by: 'a', say: 'Where is my yogurt? The one with my name on it.' },
      { by: 'b', say: 'Oh. That was yours?' },
      { by: 'a', say: 'It had my NAME on it, {b}!' },
      { by: 'b', say: 'I thought that was a joke!' },
      { by: 'a', say: "A joke? I'm on slop! That was the only real thing I had!" },
      { by: 'a', dr: "Slop, no sleep, and now somebody's eating the one thing I saved. I'm done being nice." },
    ] },
    { id: 'ff.b2', turns: [
      { beat: '{a} opens the fridge, stares at an empty shelf, and closes it again very slowly.' },
      { by: 'a', say: 'Who ate the leftovers?' },
      { by: 'b', say: 'I was hungry.' },
      { by: 'a', say: 'Everybody is hungry! There are {count} of us and one pot of pasta!' },
      { by: 'b', say: 'Then you should have eaten it faster.' },
      { beat: 'Nobody in the kitchen moves.' },
    ] },
    { id: 'ff.b3', turns: [
      { by: 'a', say: 'You took the last of the eggs.' },
      { by: 'b', say: 'There were three left.' },
      { by: 'a', say: 'And now there are none. Do you know what anybody is eating tomorrow?' },
      { by: 'b', say: 'Not my problem.' },
      { by: 'a', say: "It's everybody's problem! That's what a house is!" },
      { by: 'a', dr: '{b} eats like nobody else lives here. Well, somebody else lives here. Me.' },
    ] },
    { id: 'ff.b4', turns: [
      { by: 'a', say: 'You ate my peanut butter. With a spoon. Out of the jar.' },
      { by: 'b', say: 'So?' },
      { by: 'a', say: "So now it's yours. Keep it. I'm not touching it." },
      { by: 'b', say: "You're being dramatic." },
      { by: 'a', say: "I'm being hungry!" },
    ] },
    { id: 'ff.b5', turns: [
      { by: 'b', say: "Relax, it's a sandwich." },
      { by: 'a', say: 'It was my sandwich. I made it, I put it down, I turned around, it was gone.' },
      { by: 'b', say: "Then don't leave it lying around." },
      { by: 'a', say: 'On a plate! In the kitchen! Where food goes!' },
      { beat: '{b} takes another bite, looking straight at {a}.' },
    ] },
    { id: 'ff.b6', turns: [
      { by: 'a', say: 'Who finished the cereal and put the empty box back?' },
      { by: 'b', say: '...Me. Why?' },
      { by: 'a', say: 'Because I just poured nothing into a bowl in front of everybody.' },
      { by: 'b', say: "That's kind of funny, though." },
      { by: 'a', say: "It's not funny. Nothing is funny when you're this hungry." },
      { by: 'a', dr: "I'm going to remember this. Not the cereal. The face {b} made." },
    ] },
    { id: 'ff.b7', when: { again: true }, turns: [
      { by: 'a', say: 'This is the second time, {b}. The second time!' },
      { by: 'b', say: 'You keep count of that?' },
      { by: 'a', say: 'Somebody has to, because you obviously do not!' },
      { by: 'b', say: 'It was a granola bar.' },
      { by: 'a', dr: "It is never about the granola bar. It's about the fact that {b} keeps doing it." },
    ] },
  ],

  'friction.food.snipe': [
    { id: 'ff.s1', turns: [
      { by: 'a', say: 'Enjoying that?' },
      { by: 'b', say: 'Very much, thanks.' },
      { by: 'a', say: 'Good. It was mine.' },
      { by: 'b', say: 'Oh. Well. It was delicious.' },
    ] },
    { id: 'ff.s2', turns: [
      { beat: '{a} goes through the fridge with a marker and writes a name on every single thing that belongs to {a.obj}.' },
      { by: 'b', say: "Little much, isn't it?" },
      { by: 'a', say: 'Not anymore.' },
    ] },
    { id: 'ff.s3', turns: [
      { by: 'a', say: 'Did you happen to see a bag of chips? Big bag? Full an hour ago?' },
      { by: 'b', say: "Can't say I did." },
      { by: 'a', say: 'There are crumbs on your shirt, {b}.' },
      { by: 'b', say: 'Those are old crumbs.' },
    ] },
    { id: 'ff.s4', turns: [
      { by: 'b', say: "Is this anyone's?" },
      { by: 'a', say: 'Yes. Mine.' },
      { by: 'b', say: 'Huh.' },
      { beat: '{b} puts it back. Ten minutes later it is gone anyway.' },
    ] },
    { id: 'ff.s5', turns: [
      { by: 'a', say: "So we're just eating other people's food now?" },
      { by: 'b', say: "We're sharing. Like a family." },
      { by: 'a', say: 'Families ask.' },
      { by: 'b', say: 'Can I have one of your cookies?' },
      { by: 'a', say: 'No.' },
    ] },
    { id: 'ff.s6', turns: [
      { by: 'a', say: "Funny how food goes missing every time you're in the kitchen." },
      { by: 'b', say: "Funny how you're always watching me when I'm in the kitchen." },
      { by: 'a', dr: "I'm not watching {b}. I'm watching my food. {b} just happens to be standing next to it." },
    ] },
    { id: 'ff.s7', when: { again: true }, turns: [
      { by: 'a', say: 'Let me guess. You were hungry.' },
      { by: 'b', say: 'I was, actually.' },
      { by: 'a', say: 'You always are, when it is mine.' },
      { beat: '{b} shrugs and keeps eating.' },
    ] },
  ],

  'friction.food.smoothed': [
    { id: 'ff.m1', turns: [
      { by: 'a', say: '{b} ate the last of the pasta.' },
      { by: 'b', say: "I didn't know it was the last of it!" },
      { by: 'c', say: "Okay, I'll make more. We've got rice, we've got beans, nobody starves. Dinner in twenty minutes." },
      { by: 'a', say: "...You're a saint, {c}." },
      { by: 'c', say: 'I know.' },
    ] },
    { id: 'ff.m2', turns: [
      { by: 'a', say: 'That was mine!' },
      { by: 'c', say: 'Here. Have half of mine. {b}, you owe {a} a snack.' },
      { by: 'b', say: "Fair. I'll pay you back out of the next grocery order." },
      { by: 'a', say: 'Fine.' },
    ] },
    { id: 'ff.m3', turns: [
      { by: 'c', say: 'Can we make a rule? Top shelf is anything with a name on it, and nobody touches the top shelf.' },
      { by: 'b', say: 'Sure. Sounds good.' },
      { by: 'a', say: 'Thank you. That is all I wanted.' },
      { by: 'c', dr: "A fridge rule is worth more than half the alliances in this house. Nobody ever believes me." },
    ] },
    { id: 'ff.m4', when: { havenot: true }, turns: [
      { by: 'b', say: "I'm sorry, okay? I'll replace it." },
      { by: 'a', say: "With what? I'm on slop." },
      { by: 'c', say: "I've got some of mine left. {a}, take it. {b}, you're on dish duty tonight. Call it even." },
      { by: 'b', say: 'Even.' },
      { by: 'a', say: '...Even.' },
    ] },
    { id: 'ff.m5', turns: [
      { beat: '{a} is halfway through a speech about the missing leftovers when {c} walks in carrying a fresh pot of mac and cheese.' },
      { by: 'c', say: "Who's hungry?" },
      { by: 'b', say: 'Me!' },
      { by: 'a', say: "This isn't over, {b}." },
      { by: 'b', say: 'It kind of is, though.' },
    ] },
    { id: 'ff.m6', turns: [
      { by: 'a', say: 'Who ate my leftovers?' },
      { by: 'b', say: "Me. I'm sorry. I didn't think." },
      { by: 'c', say: "See? That's all it takes. Now can everybody eat something before somebody else gets yelled at?" },
      { by: 'a', say: "...It's okay." },
      { by: 'b', say: 'Thanks.' },
    ] },
    { id: 'ff.m7', when: { again: true }, turns: [
      { by: 'c', say: 'Is this the food thing again?' },
      { by: 'a', say: 'It is always the food thing.' },
      { by: 'c', say: "Then here's a new thing. {b}, you're cooking tonight. For everybody. {a} picks." },
      { by: 'b', say: '...Okay. That is actually fair.' },
      { by: 'a', say: 'I pick pancakes.' },
    ] },
  ],
};
