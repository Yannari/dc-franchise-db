// ══════════════════════════════════════════════════════════════════════
// td/script/lines/jury.js — the Jury House: the voted-out at the motel
// ══════════════════════════════════════════════════════════════════════
//
// js/rescue-island.js (generateInterludeLife, the jury venue) decides the week: who arrives,
// which two still hate each other and how that ends, who is on the outside and who pulls them
// in, who cannot let their vote-out go, who becomes friends, and the motel's group nights.
// js/td/script/jury.js turns each of those decisions into a scene from these pools. Nobody here
// can win any more; most of them still get a vote, and that is what the week is about.
//
// Modelled on Disventure Camp's "Panel of Peers": water aerobics, bingo, people working through
// their exits, old enemies talking it out, new friends.
//
// {target}  the person who voted {a} out and lied doing it.      (jury.bitter.*)
// {fin}     the player still in the game {a} is rooting for.      (jury.solo.rooting)
// intent    'finalist' (the {target} is still playing) or 'gone'. (jury.bitter.vote)
// The motel's places (the pool, the buffet, the bar, the lounge, the hot tub) are where the
// viewer stages each kind of scene (vp-td-ep/jury-house.js SET_BY_KEY). Ids: 'jh.'.

// ── arriving ──────────────────────────────────────────────────────────
// {a} just got voted out and walks in; {b} is a friend who was already here.
const ARRIVE_HUG = [
  { id: 'jh.ah1', turns: [
    { beat: '{a} drags a suitcase up the motel path. {b} is off the lounger before the gate even shuts.' },
    { by: 'b', say: 'You made it! Get over here.' },
    { by: 'a', say: "I got voted out, {b}. That's not exactly making it." },
    { by: 'b', say: "You're here, and you're with me. That counts." },
    { by: 'a', conf: 'I walked in ready to sulk for a week. {b} ruined that in about four seconds.' },
  ] },
  { id: 'jh.ah2', turns: [
    { beat: '{b} spots {a} at the front desk and nearly knocks over a drink getting there.' },
    { by: 'b', say: 'Oh no. No, no, no. Who did it?' },
    { by: 'a', say: 'Everybody. It was basically everybody.' },
    { by: 'b', say: "Then sit down and tell me all of it, and don't leave anything out." },
    { by: 'a', conf: "I didn't think I'd be glad to see anyone this week. Then {b} hugged me and I nearly cried at the front desk." },
  ] },
  { id: 'jh.ah3', turns: [
    { beat: '{a} stands in the doorway of the motel with a bag, looking around.' },
    { by: 'b', say: 'Hey! Over here!' },
    { by: 'a', say: "Please tell me there's food." },
    { by: 'b', say: 'There is a whole buffet, and I saved you the good chair.' },
    { by: 'a', conf: 'Getting voted out felt like the end of the world. Getting hugged by {b} straight after helped more than I want to admit.' },
  ] },
  { id: 'jh.ah4', when: { register: 'fiery' }, turns: [
    { beat: '{a} storms into the lobby, still angry, and drops a bag on the floor.' },
    { by: 'a', say: "I want names. Who's been talking about my vote?" },
    { by: 'b', say: 'Nobody yet. Breathe first, and then we can talk about who to be mad at.' },
    { by: 'a', say: 'Fine. One breath.' },
    { by: 'a', conf: 'I came in ready to fight everybody. {b} was the only person here I did not want to fight.' },
  ] },
  { id: 'jh.ah5', turns: [
    { beat: "{b} is waiting by the pool when {a} walks in, and doesn't say anything at first. Just hugs {a.obj}." },
    { by: 'a', say: "Okay. Okay, I'm fine." },
    { by: 'b', say: "You're not fine, and that's allowed." },
    { by: 'a', say: 'When did you get so wise?' },
    { by: 'b', say: "I've had a lot of time to think in here." },
    { by: 'b', conf: 'I knew {a} would be next. I hated being right about it.' },
  ] },
  { id: 'jh.ah6', turns: [
    { by: 'a', say: 'So this is where they keep us.' },
    { by: 'b', say: "Pretty much. There's a pool, there's a hot tub, and nobody's plotting anything, which is honestly the best part." },
    { by: 'a', say: 'Nobody?' },
    { by: 'b', say: 'Okay, a little. But not against you.' },
    { by: 'a', conf: 'I had been dreading this place. Then I saw {b} and remembered I actually made friends in this game.' },
  ] },
];

// {a} just got voted out and walks in alone.
const ARRIVE_ALONE = [
  { id: 'jh.al1', turns: [
    { beat: '{a} walks into the motel lobby with a bag and stops. Everyone by the pool goes quiet.' },
    { by: 'a', say: "Wow. Don't all get up at once." },
    { beat: 'Somebody waves. Most of them go back to their drinks.' },
    { by: 'a', conf: 'Every one of these people either voted me out or got voted out with my help. So yeah, it is awkward.' },
  ] },
  { id: 'jh.al2', turns: [
    { beat: '{a} sits on the edge of the motel bed and stares at the wall for a long time.' },
    { by: 'a', say: 'Okay. So that happened.' },
    { by: 'a', conf: 'I keep waiting for somebody to tell me it was a mistake and I can go back. Nobody is going to say that.' },
  ] },
  { id: 'jh.al3', turns: [
    { by: 'a', say: 'Which room is mine?' },
    { beat: 'Nobody at the pool answers. {a} goes and finds it alone.' },
    { by: 'a', conf: "I didn't expect a welcome party. I did expect somebody to at least look up." },
  ] },
  { id: 'jh.al4', when: { register: 'schemer' }, turns: [
    { beat: '{a} takes the corner chair in the lounge, the one with a view of everybody.' },
    { by: 'a', say: "Don't mind me. Just getting comfortable." },
    { by: 'a', conf: "I'm out of the game, but I still get a vote. Every person in here is going to want to know where I stand, and I'm not telling them." },
  ] },
  { id: 'jh.al5', when: { register: 'sweet' }, turns: [
    { beat: '{a} hovers by the door, holding a bag to {a.posAdj} chest.' },
    { by: 'a', say: 'Hi. Um. Is anyone using this chair?' },
    { beat: 'Nobody answers, so {a} sits down.' },
    { by: 'a', conf: 'I thought getting voted out would be the worst part. It is actually walking into a room where everybody already has their friends.' },
  ] },
  { id: 'jh.al6', turns: [
    { beat: '{a} drops a bag by the pool and lies down on the nearest lounger without a word.' },
    { by: 'a', say: "Wake me up when it's the finale." },
    { by: 'a', conf: "I'm too tired to be angry yet. I'm sure that'll come tomorrow." },
  ] },
  { id: 'jh.al7', turns: [
    { by: 'a', say: 'Hi, everyone. Yes, me. I know.' },
    { beat: 'A couple of people at the buffet laugh. One of them pulls out a chair.' },
    { by: 'a', conf: "Laughing at it first is the only way I know how to walk into a room like this." },
  ] },
];

// ── the grudge: two who hated each other in the game, all the way to burying it ──
// {a} and {b} are enemies; the scenes run wounds → boils → reckon → buried across the week.
const GRUDGE_WOUNDS = [
  { id: 'jh.gw1', turns: [
    { beat: '{a} walks into the lounge, sees {b} on the couch, and turns straight back around.' },
    { by: 'b', say: "You can sit down. I don't bite." },
    { by: 'a', say: 'I know exactly what you do, {b}. I was there.' },
    { by: 'a', conf: 'Same motel, same pool, same buffet as the person who lied to me. This is going to be a long week.' },
  ] },
  { id: 'jh.gw2', turns: [
    { beat: '{a} and {b} reach for the same lounger at the same time. Neither one lets go.' },
    { by: 'b', say: 'I was here first.' },
    { by: 'a', say: 'You were first at a lot of things. Like writing my name down.' },
    { beat: '{b} lets go. {a} does not sit down either.' },
    { by: 'b', conf: "I thought the game was over once we got here. Apparently {a} didn't get the memo." },
  ] },
  { id: 'jh.gw3', turns: [
    { by: 'a', say: "So we're just going to pretend nothing happened?" },
    { by: 'b', say: "I'm not pretending anything. I'm eating breakfast." },
    { by: 'a', say: 'Enjoy it.' },
    { by: 'a', conf: '{b} gets to act like everything is fine, because {b} is not the one who got hurt.' },
  ] },
  { id: 'jh.gw4', turns: [
    { beat: 'The whole lounge goes quiet when {b} walks in. Everybody looks at {a}.' },
    { by: 'a', say: "What? I'm not going to do anything." },
    { by: 'b', say: 'Good.' },
    { by: 'a', say: 'Yet.' },
    { by: 'b', conf: 'Everybody here knows what happened between me and {a}. I can feel them waiting for it to blow up.' },
  ] },
  { id: 'jh.gw5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Oh, great. Of course you're here." },
    { by: 'b', say: "It's a motel for people who got voted out, {a}. Where else would I be?" },
    { by: 'a', say: "Anywhere I'm not would be nice." },
    { by: 'a', conf: 'I have a temper, and {b} knows exactly where to find it.' },
  ] },
  { id: 'jh.gw6', turns: [
    { beat: '{a} takes the seat farthest from {b} at the buffet and eats without looking up once.' },
    { by: 'b', say: "You can't ignore me for a whole week." },
    { by: 'a', say: 'Watch me.' },
    { by: 'b', conf: 'Fine. If {a} wants a cold war, {a} can have one.' },
  ] },
];
const GRUDGE_BOILS = [
  { id: 'jh.gb1', turns: [
    { beat: 'It starts over the TV remote at the buffet and gets loud fast.' },
    { by: 'b', say: "Seriously? It's a remote." },
    { by: 'a', say: "It's never just the remote with you, {b}. You looked me in the eye and told me I was safe." },
    { by: 'b', say: 'I told you what I knew at the time!' },
    { by: 'a', say: 'You knew exactly what was happening.' },
    { beat: 'Everyone else at the buffet suddenly has somewhere else to be.' },
    { by: 'a', conf: "A week of being polite, and it took a TV remote. I'm not even sorry." },
  ] },
  { id: 'jh.gb2', turns: [
    { by: 'a', say: 'Say it. Say why you did it.' },
    { by: 'b', say: 'Because you were going to do it to me first!' },
    { by: 'a', say: "That's not true, and you know it." },
    { by: 'b', say: "I don't know it! That's the whole game, {a}. Nobody knows anything!" },
    { beat: '{a} throws a napkin on the table and walks out.' },
    { by: 'b', conf: "I'm not proud of how I played {a}. I'm also not going to stand there and get yelled at." },
  ] },
  { id: 'jh.gb3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: 'You want to know the funny part? I would have taken you to the end.' },
    { by: 'b', say: "No, you wouldn't." },
    { by: 'a', say: "You'll never know now, will you?" },
    { by: 'b', conf: '{a} said that to make me feel bad. It worked, a little.' },
  ] },
  { id: 'jh.gb4', turns: [
    { beat: '{b} tries to apologize in the hallway. It does not go well.' },
    { by: 'b', say: "I'm trying to say sorry here." },
    { by: 'a', say: "You're trying to feel better. That's different." },
    { by: 'b', say: "Can't it be both?" },
    { by: 'a', say: 'Not today.' },
    { by: 'a', conf: "I'll forgive {b} when I'm ready. Somebody shouting sorry at me in a hallway isn't it." },
  ] },
  { id: 'jh.gb5', turns: [
    { beat: '{a} and {b} are arguing by the pool, and the people in it have stopped swimming to listen.' },
    { by: 'a', say: 'You made me look stupid in front of everybody.' },
    { by: 'b', say: 'You did that yourself when you trusted me.' },
    { beat: 'Somebody in the pool whistles. Both of them glare at the pool.' },
    { by: 'b', conf: 'That came out meaner than I meant it. I did mean some of it.' },
  ] },
  { id: 'jh.gb6', turns: [
    { by: 'a', say: 'Every night in here I think about that vote.' },
    { by: 'b', say: "So do I, okay? You're not the only one who lost." },
    { by: 'a', say: "You didn't lose because of me." },
    { beat: '{b} does not have an answer for that.' },
    { by: 'a', conf: "That's the first time I've seen {b} without a comeback. It felt better than I thought it would." },
  ] },
];
const GRUDGE_RECKON = [
  { id: 'jh.gr1', turns: [
    { beat: "{b} sits down on the end of {a}'s lounger without asking." },
    { by: 'b', say: 'Can we actually talk? Not yell. Talk.' },
    { by: 'a', say: 'Fine. Talk.' },
    { by: 'b', say: 'I was scared. You were the biggest threat to me, and I panicked.' },
    { by: 'a', say: 'You could have just told me that.' },
    { by: 'b', say: 'I know. I know that now.' },
    { by: 'a', conf: 'It didn\'t fix anything. But it was the first true thing {b} has said to me in weeks.' },
  ] },
  { id: 'jh.gr2', turns: [
    { by: 'a', say: 'Why did you come over here?' },
    { by: 'b', say: "Because I'm tired of eating dinner at the other end of the table from you." },
    { by: 'a', say: "That's not an apology." },
    { by: 'b', say: "Then here's one. I'm sorry. I made it personal, and it didn't have to be." },
    { beat: '{a} looks at {b} for a long moment, then moves over to make room.' },
    { by: 'b', conf: "I gave a lot of speeches in this game. That was the only one that scared me." },
  ] },
  { id: 'jh.gr3', turns: [
    { beat: '{a} and {b} end up the last two awake by the pool, and neither of them leaves.' },
    { by: 'a', say: 'You know the worst part? I liked you.' },
    { by: 'b', say: 'I liked you too. That made it harder.' },
    { by: 'a', say: 'Then why did you do it?' },
    { by: 'b', say: "Because liking you wasn't going to get me to the end." },
    { by: 'a', conf: "It's a terrible answer. It's also an honest one, and I'll take honest." },
  ] },
  { id: 'jh.gr4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I don't want to hate you anymore. It's exhausting." },
    { by: 'b', say: "Then don't." },
    { by: 'a', say: "It's not that easy." },
    { by: 'b', say: "I know. But I'd like to try, if you would." },
    { by: 'a', conf: "I've never been good at holding grudges. {b} is making it really hard to hold on to this one." },
  ] },
  { id: 'jh.gr5', turns: [
    { by: 'b', say: 'I keep replaying it. Not the vote. The part before, when you trusted me.' },
    { by: 'a', say: 'Good. You should.' },
    { by: 'b', say: "I'm sorry, {a}. I really am." },
    { beat: "{a} doesn't say it's okay. {a} doesn't leave, either." },
    { by: 'b', conf: "That's the closest {a} has come to forgiving me. I'll take it." },
  ] },
  { id: 'jh.gr6', turns: [
    { beat: '{a} finds {b} sitting alone at the edge of the pool with both feet in the water.' },
    { by: 'a', say: 'Mind if I sit?' },
    { by: 'b', say: "It's your motel too." },
    { by: 'a', say: "I'm still mad at you." },
    { by: 'b', say: "That's fair." },
    { by: 'a', say: "But I'm also bored of being mad at you." },
    { by: 'b', conf: "That's the nicest thing {a} has said to me since the vote." },
  ] },
];
const GRUDGE_BURIED = [
  { id: 'jh.gu1', turns: [
    { beat: "By the last night, {a} and {b} are sharing a bottle of something {b} took from behind the bar." },
    { by: 'a', say: "Remember when I wouldn't sit at the same table as you?" },
    { by: 'b', say: 'That was Tuesday.' },
    { by: 'a', say: 'It feels like a year ago.' },
    { by: 'b', conf: 'We gave this game everything and it spat us both out. There is no point hating each other over it now.' },
  ] },
  { id: 'jh.gu2', turns: [
    { by: 'a', say: 'To {b}, my least favourite person in this whole game.' },
    { by: 'b', say: 'To {a}, who held a grudge longer than anyone in the history of this show.' },
    { beat: 'They clink glasses. Both of them are laughing.' },
    { by: 'a', conf: 'I came in here ready to hate {b} forever. It lasted about five days.' },
  ] },
  { id: 'jh.gu3', turns: [
    { by: 'b', say: 'So are we good?' },
    { by: 'a', say: "We're good. I'm still not voting the way you'd want me to." },
    { by: 'b', say: "That's fair. I wouldn't either." },
    { by: 'a', conf: "Being friends with {b} again doesn't change my vote. It just means I'll enjoy the finale more." },
  ] },
  { id: 'jh.gu4', turns: [
    { beat: '{a} and {b} are laughing so hard at the bar that the others turn around to look.' },
    { by: 'a', say: 'Okay, okay, but your face when they read my name.' },
    { by: 'b', say: 'I was trying so hard to look surprised!' },
    { by: 'a', say: "You looked like you'd swallowed a bug." },
    { by: 'b', conf: "If you'd told me a week ago we'd be joking about that vote, I wouldn't have believed you." },
  ] },
  { id: 'jh.gu5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm still mad, you know." },
    { by: 'b', say: 'I know.' },
    { by: 'a', say: "Just not as mad. Don't get excited." },
    { by: 'b', say: "I wouldn't dream of it." },
    { by: 'a', conf: "I don't really do sorry. {b} did enough sorry for both of us, so I let it go." },
  ] },
  { id: 'jh.gu6', turns: [
    { beat: '{b} hands {a} a drink without being asked.' },
    { by: 'a', say: "What's this for?" },
    { by: 'b', say: 'For not pushing me into the pool when you had the chance.' },
    { by: 'a', say: 'I still might.' },
    { by: 'b', conf: "I'm not saying we're best friends now. But I'd sit next to {a} at the reunion." },
  ] },
];

// ── the outsider: {a} doesn't fit, {b} pulls {a.obj} in ────────────────
const OUT_OUTSIDE = [
  { id: 'jh.oo1', turns: [
    { beat: '{a} eats alone at the end of the buffet table while everybody else crowds around the other end.' },
    { by: 'a', say: "No, I'm fine. Go ahead. I'm good here." },
    { by: 'a', conf: "Even here, I don't quite fit. Same as in the game, honestly." },
  ] },
  { id: 'jh.oo2', turns: [
    { beat: 'Everyone at the pool is laughing at a story from before {a} got here.' },
    { by: 'a', say: "Who's that about?" },
    { beat: 'Nobody hears {a.obj}.' },
    { by: 'a', conf: 'They all had friends in the game. I had a plan, and now I don\'t have that either.' },
  ] },
  { id: 'jh.oo3', when: { register: 'shy' }, turns: [
    { beat: '{a} stands at the door of the lounge for a minute, then goes back down the hall.' },
    { by: 'a', say: 'Maybe later.' },
    { by: 'a', conf: 'Walking into a room full of people who already know each other is the hardest thing I do all day.' },
  ] },
  { id: 'jh.oo4', turns: [
    { by: 'a', say: 'Does anybody want to play cards?' },
    { beat: 'Two people look up, then go back to talking.' },
    { by: 'a', say: 'Okay. No worries.' },
    { by: 'a', conf: "I keep trying. It's like knocking on a door and hearing everybody go quiet behind it." },
  ] },
  { id: 'jh.oo5', turns: [
    { beat: '{a} sits on the edge of the pool, feet in the water, while a game of chicken goes on at the other end.' },
    { by: 'a', say: 'Nice one!' },
    { beat: 'Nobody turns around.' },
    { by: 'a', conf: "I laugh when they laugh, so it doesn't look weird that I'm sitting here by myself. It still looks weird." },
  ] },
  { id: 'jh.oo6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Oh, sure, don't let me interrupt your little club." },
    { beat: 'The table goes quiet. {a} leaves anyway.' },
    { by: 'a', conf: "I know that didn't help. I just hate being the one who's left out." },
  ] },
  { id: 'jh.oo7', turns: [
    { beat: '{a} has read the same page of the same magazine in the lobby four times.' },
    { by: 'a', say: 'Morning! Anyone doing anything today?' },
    { beat: 'The people walking past say morning back and keep walking.' },
    { by: 'a', conf: "Everyone's nice to me. Nobody's friends with me. There's a difference, and I can feel it." },
  ] },
];
const OUT_SEAT = [
  { id: 'jh.os1', turns: [
    { beat: '{b} notices {a} eating alone again and just sits down across from {a.obj}.' },
    { by: 'b', say: 'Is this seat taken?' },
    { by: 'a', say: 'No.' },
    { by: 'b', say: "Good. Because I can't listen to the people over there argue about cereal for one more minute." },
    { by: 'a', conf: "It's such a small thing. It felt huge." },
  ] },
  { id: 'jh.os2', turns: [
    { by: 'b', say: 'Hey, we need a fourth for cards. You in?' },
    { by: 'a', say: 'Me?' },
    { by: 'b', say: "You're the only one not already playing. So yes, you." },
    { beat: '{a} takes the cards. {b} pulls a chair over.' },
    { by: 'a', conf: 'Nobody in the game ever asked me to join anything. {b} did it like it was nothing.' },
  ] },
  { id: 'jh.os3', turns: [
    { beat: '{b} drops onto the lounger next to {a} with two drinks and hands one over.' },
    { by: 'b', say: 'You looked like you needed one of these.' },
    { by: 'a', say: 'Do I look that sad?' },
    { by: 'b', say: 'You look like I did my first night.' },
    { by: 'a', conf: "I don't know why {b} cared. I'm really glad {b} did." },
  ] },
  { id: 'jh.os4', when: { registerB: 'sweet' }, turns: [
    { by: 'b', say: "Come sit with us. I'm not taking no for an answer." },
    { by: 'a', say: "I don't want to be in the way." },
    { by: 'b', say: "You're not in the way. You're in the group now." },
    { by: 'b', conf: "I know exactly what it's like to be on the outside. I wasn't going to let {a} sit there." },
  ] },
  { id: 'jh.os5', turns: [
    { by: 'b', say: "What's your story, anyway? I don't think we ever talked in the game." },
    { by: 'a', say: 'We didn\'t. You were always with your people.' },
    { by: 'b', say: "Well, I'm with you now. So talk." },
    { beat: 'They talk until the buffet closes.' },
    { by: 'a', conf: '{b} asked me about my life. Not my game, my life. Nobody has done that in weeks.' },
  ] },
  { id: 'jh.os6', turns: [
    { beat: '{b} pulls {a} into the middle of an argument about the best season of the show.' },
    { by: 'b', say: '{a}, settle this. Who is right?' },
    { by: 'a', say: 'Um. Neither of you?' },
    { beat: 'The whole table laughs, and somebody pours {a} a drink.' },
    { by: 'a', conf: "One silly argument and suddenly I'm part of it. I'll take it." },
  ] },
];
const OUT_BELONG = [
  { id: 'jh.ob1', turns: [
    { beat: 'By the last night, {a} is in the middle of the group at the pool, laughing at something {b} said.' },
    { by: 'a', say: 'Okay, okay, tell it again. Slower this time.' },
    { by: 'b', say: 'No! You heard it the first time!' },
    { by: 'a', conf: "{b} didn't have to do any of that. Nobody in the game ever did. Maybe that's the difference out here." },
  ] },
  { id: 'jh.ob2', turns: [
    { by: 'a', say: 'I almost stayed in my room.' },
    { by: 'b', say: "I'm glad you didn't." },
    { by: 'a', say: 'Me too.' },
    { by: 'b', conf: "{a} is funny. Actually funny. I can't believe nobody noticed in the game." },
  ] },
  { id: 'jh.ob3', turns: [
    { beat: "{a} is the one telling the story by the pool now, and everyone's listening." },
    { by: 'a', say: 'And then the whole bucket of water goes right over my head.' },
    { by: 'b', say: 'In front of everyone?' },
    { by: 'a', say: 'In front of everyone!' },
    { by: 'a', conf: "A week ago I couldn't get anyone to look up from their drink. Now they're asking me for stories." },
  ] },
  { id: 'jh.ob4', turns: [
    { by: 'b', say: 'Picture, everybody! {a}, get in here.' },
    { by: 'a', say: "I'm in it?" },
    { by: 'b', say: "Obviously you're in it." },
    { by: 'a', conf: "It's one picture. I still want a copy." },
  ] },
  { id: 'jh.ob5', when: { register: 'shy' }, turns: [
    { by: 'a', say: 'Thanks. For the other day.' },
    { by: 'b', say: 'For what?' },
    { by: 'a', say: 'For sitting down.' },
    { by: 'b', say: 'That was nothing.' },
    { by: 'a', say: "It wasn't nothing to me." },
    { by: 'b', conf: 'I forget how much a little thing can matter to somebody.' },
  ] },
  { id: 'jh.ob6', turns: [
    { beat: '{a} and {b} are the last two in the pool as the lights go off around it.' },
    { by: 'a', say: 'Will you stay in touch after this?' },
    { by: 'b', say: "Of course I will. You're stuck with me now." },
    { by: 'a', conf: "I came here alone. I'm leaving with a friend. That's more than the game ever gave me." },
  ] },
];

// ── the bitter juror: {a} cannot let go of {target} ──────────────────
const BITTER_START = [
  { id: 'jh.bs1', turns: [
    { beat: "{a} brings up {target}'s name at breakfast again, like picking at a scab." },
    { by: 'a', say: "{target} looked me dead in the eye and lied. And everyone's acting like that's just strategy." },
    { by: 'a', conf: "I'm on the jury now, and I have a long memory." },
  ] },
  { id: 'jh.bs2', turns: [
    { by: 'a', say: 'Did anyone hear what {target} said about me after the vote?' },
    { beat: 'Nobody answers. {a} answers anyway.' },
    { by: 'a', say: "Nothing. {target} said nothing, because {target} didn't care." },
    { by: 'a', conf: "Everybody keeps telling me it's just a game. That's easy to say when you're not the one who got lied to." },
  ] },
  { id: 'jh.bs3', when: { register: 'fiery' }, turns: [
    { beat: '{a} jabs the remote at the TV every time {target} comes on the feeds.' },
    { by: 'a', say: "There! That smile! That's the same smile from the morning of my vote!" },
    { by: 'a', conf: 'People keep calling me bitter. I just remember what happened.' },
  ] },
  { id: 'jh.bs4', turns: [
    { by: 'a', say: 'I keep replaying the moment {target} told me I was safe.' },
    { beat: '{a} stops talking and stares at the pool.' },
    { by: 'a', conf: 'That conversation is the last thing I think about before I fall asleep. Every night.' },
  ] },
  { id: 'jh.bs5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Here's what nobody in this motel gets. {target} didn't beat me. {target} lied to me. Those are different things." },
    { by: 'a', conf: "If {target} had beaten me fair and square, I'd respect it. That isn't what happened." },
  ] },
  { id: 'jh.bs6', turns: [
    { beat: '{a} is swimming laps, hard, and muttering every time {a} reaches the wall.' },
    { by: 'a', say: 'Smiled at me. Smiled at me the morning of.' },
    { by: 'a', conf: "Swimming is supposed to calm me down. It isn't working, because of {target}." },
  ] },
  { id: 'jh.bs7', turns: [
    { by: 'a', say: 'Can we not watch {target} for five minutes? Change the channel.' },
    { beat: 'Somebody changes the channel. {a} keeps staring at the screen anyway.' },
    { by: 'a', conf: "I keep telling myself I'm over it. Then I hear the name and I'm not." },
  ] },
];
const BITTER_VOTE = [
  { id: 'jh.bv1', when: { intent: 'finalist' }, turns: [
    { by: 'a', say: "Whatever anybody said at the roundtable, I'd already made up my mind." },
    { beat: 'Everyone at the bar looks at {a}.' },
    { by: 'a', say: '{target} is never getting my vote.' },
    { by: 'a', conf: 'Play the game, fine. But lie to my face and then ask me to reward you for it? No.' },
  ] },
  { id: 'jh.bv2', when: { intent: 'finalist' }, turns: [
    { by: 'a', say: "If {target} makes the final, I'm voting for whoever's sitting next to {target}. I don't care who it is." },
    { by: 'a', conf: "That's not bitter. That's the last thing I can still do about it." },
  ] },
  { id: 'jh.bv3', when: { intent: 'finalist' }, turns: [
    { beat: '{a} writes a name on a napkin, folds it up and puts it away.' },
    { by: 'a', say: 'Just practicing.' },
    { by: 'a', conf: "It's not {target}'s name. It's never going to be {target}'s name." },
  ] },
  { id: 'jh.bv4', when: { intent: 'gone' }, turns: [
    { by: 'a', say: 'At least {target} didn\'t make it to the end either.' },
    { by: 'a', conf: "Whoever's left in there, I'm voting for whoever played the most honestly. That rules out a lot of people." },
  ] },
  { id: 'jh.bv5', when: { intent: 'gone' }, turns: [
    { by: 'a', say: "{target} is gone, and I still can't let it go." },
    { beat: '{a} stares into the pool for a long time.' },
    { by: 'a', conf: "My vote is the last power I have in this game. I'm spending it on principle." },
  ] },
  { id: 'jh.bv6', when: { intent: 'gone' }, turns: [
    { by: 'a', say: 'Nobody who smiled in my face on the way out is getting my vote. Nobody.' },
    { by: 'a', conf: 'I earned my seat on this jury the hard way. I am going to use it.' },
  ] },
];

// ── new friends: {a} and {b} never connected in the game ─────────────
const FRIENDS_STRANGE = [
  { id: 'jh.fs1', turns: [
    { beat: "It's two in the morning, and {a} and {b} both walk into the buffet room at the same time, looking for snacks." },
    { by: 'a', say: 'You too?' },
    { by: 'b', say: "Couldn't sleep." },
    { by: 'a', say: 'Same. Want half?' },
    { beat: "An hour later, they're still sitting on the floor, talking." },
    { by: 'b', conf: 'In the game, {a} and I barely said ten words to each other. Turns out we have the same terrible taste in everything.' },
  ] },
  { id: 'jh.fs2', turns: [
    { by: 'a', say: 'Wait, you like that show too?' },
    { by: 'b', say: "I've seen every episode. Twice." },
    { by: 'a', say: 'No way. Nobody I know watches it!' },
    { by: 'b', conf: "We were on opposite sides of every vote. If we'd talked even once, maybe we wouldn't have been." },
  ] },
  { id: 'jh.fs3', turns: [
    { beat: '{a} and {b} end up on the same side of a pool volleyball game and win four in a row.' },
    { by: 'b', say: "Okay, we're good at this." },
    { by: 'a', say: "We're really good at this." },
    { by: 'b', conf: 'The person I spent the whole game avoiding turns out to be my best teammate.' },
  ] },
  { id: 'jh.fs4', turns: [
    { by: 'a', say: 'Can I be honest? I thought you were kind of stuck up.' },
    { by: 'b', say: 'I thought you were kind of scary.' },
    { by: 'a', say: 'Scary?' },
    { by: 'b', say: 'You always looked like you were planning something.' },
    { by: 'a', conf: 'We were both wrong about each other. It only took getting voted out to find out.' },
  ] },
  { id: 'jh.fs5', turns: [
    { beat: '{a} and {b} are both trying to fix the broken ice machine, and neither of them knows what they are doing.' },
    { by: 'a', say: 'Hit it.' },
    { by: 'b', say: "I'm not going to hit it!" },
    { beat: '{a} hits it. Ice pours out everywhere.' },
    { by: 'b', conf: "I didn't think I'd laugh that hard with anyone in here. Least of all {a}." },
  ] },
  { id: 'jh.fs6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I don't think we ever really talked, did we?" },
    { by: 'b', say: 'Not once.' },
    { by: 'a', say: 'Want to start now?' },
    { by: 'b', conf: '{a} asked like it was the most normal thing in the world. I guess it is.' },
  ] },
];
const FRIENDS_THICK = [
  { id: 'jh.ft1', turns: [
    { beat: "By the last night, {a} and {b} are finishing each other's sentences by the pool." },
    { by: 'a', say: "After the finale, we're going on a road trip." },
    { by: 'b', say: 'Somewhere with no cameras.' },
    { by: 'a', say: 'And no voting.' },
    { by: 'b', conf: "The game never let us find out we'd be friends. It took getting voted out." },
  ] },
  { id: 'jh.ft2', turns: [
    { by: 'a', say: "Promise you'll call me after this." },
    { by: 'b', say: "I'll do better than call. I'm coming to visit." },
    { by: 'a', say: "You don't even know where I live." },
    { by: 'b', say: "Then you'd better tell me." },
    { by: 'a', conf: "I came in here with nobody. Now I've got someone coming to visit." },
  ] },
  { id: 'jh.ft3', turns: [
    { beat: '{a} and {b} have pushed two loungers together and are giving every finalist a score out of ten.' },
    { by: 'b', say: 'Seven.' },
    { by: 'a', say: 'Seven? Are you kidding me? Four, maximum.' },
    { by: 'b', conf: "We don't agree on anything about the game. We agree on everything else." },
  ] },
  { id: 'jh.ft4', turns: [
    { by: 'a', say: "You know what I'll miss about this place?" },
    { by: 'b', say: 'The free food?' },
    { by: 'a', say: 'You. Obviously you.' },
    { by: 'b', say: "Ugh, stop. Okay, I'll miss you too." },
    { by: 'b', conf: "I didn't come here to make friends. I'm leaving with one anyway." },
  ] },
  { id: 'jh.ft5', turns: [
    { beat: '{a} pushes {b} into the pool, then jumps in straight after.' },
    { by: 'b', say: "You're dead!" },
    { by: 'a', say: 'Worth it!' },
    { by: 'a', conf: "A week ago I wouldn't have dared. Now {b} is the first person I'd push into a pool." },
  ] },
  { id: 'jh.ft6', turns: [
    { by: 'b', say: "Okay, real question. If we'd been on the same side in the game, how far would we have gone?" },
    { by: 'a', say: 'All the way.' },
    { by: 'b', say: 'All the way.' },
    { by: 'a', conf: "We'll never know. I like to think we would have run that game." },
  ] },
];

// ── the vote ahead: {a} keeps talking about the finale ───────────────
const LOOMS = [
  { id: 'jh.lm1', turns: [
    { by: 'a', say: "Whatever we say at the roundtable, that's the last power we have in this game. I'm not wasting it." },
    { by: 'a', conf: "Everybody here keeps acting like the game is over. It's not over. We decide who wins." },
  ] },
  { id: 'jh.lm2', turns: [
    { beat: '{a} keeps steering every conversation by the pool back to the finale.' },
    { by: 'a', say: 'Okay, but who do you think actually deserves it?' },
    { by: 'a', conf: "I can't talk about anything else. My vote is the only move I have left." },
  ] },
  { id: 'jh.lm3', turns: [
    { by: 'a', say: 'Has anyone actually thought about the vote? Like, really thought about it?' },
    { beat: 'Nobody answers. {a} sighs.' },
    { by: 'a', conf: "If we get this wrong, the wrong person walks away with the money, and that's on us." },
  ] },
  { id: 'jh.lm4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: 'If enough of us agree, we decide who wins. Just saying.' },
    { by: 'a', conf: "One last move. Getting a few jurors to see things my way still counts as playing." },
  ] },
  { id: 'jh.lm5', turns: [
    { beat: "{a} has written every finalist's name on a piece of paper and is staring at it." },
    { by: 'a', say: 'Good points. Bad points. Good points. Bad points.' },
    { by: 'a', conf: 'I want to be able to explain my vote to anyone who asks. Even them.' },
  ] },
  { id: 'jh.lm6', turns: [
    { by: 'a', say: 'Do you think they know we talk about them all day?' },
    { by: 'a', conf: "I hope they're thinking about us. We're the people they have to answer to now." },
  ] },
];

// ── one person alone ──────────────────────────────────────────────────
const PROCESSING = [
  { id: 'jh.pr1', turns: [
    { beat: '{a} sits apart by the pool and finally lets it out. Not the game. Everything the game cost.' },
    { by: 'a', say: "I'm okay. I'm okay." },
    { by: 'a', conf: "I didn't cry when they read my name. It took a week, a lounger and a sunset." },
  ] },
  { id: 'jh.pr2', turns: [
    { by: 'a', say: "I keep wondering if I'd do anything different." },
    { beat: '{a} pulls {a.posAdj} knees up on the lounger and watches the water.' },
    { by: 'a', conf: "The hardest part isn't losing. It's not knowing if I'd make the same choices again." },
  ] },
  { id: 'jh.pr3', turns: [
    { beat: '{a} writes a long note on motel paper, reads it back and laughs.' },
    { by: 'a', say: 'Dear me. You got too comfortable. Love, the jury.' },
    { by: 'a', conf: "If I can laugh at myself, I'm going to be fine." },
  ] },
  { id: 'jh.pr4', turns: [
    { beat: '{a} watches {a.posAdj} own vote-out on the lounge TV and, to everyone\'s surprise, claps.' },
    { by: 'a', say: "Okay. That was a good move. I'd have voted me out too." },
    { by: 'a', conf: 'It stings less once you can see it from their side. A little less.' },
  ] },
  { id: 'jh.pr5', turns: [
    { by: 'a', say: "That's the first night I've slept all the way through since the vote." },
    { by: 'a', conf: 'Turns out the game was the stressful part. This is just quiet.' },
  ] },
  { id: 'jh.pr6', when: { register: 'fiery' }, turns: [
    { beat: '{a} punches a pool float until it sinks.' },
    { by: 'a', say: 'Better.' },
    { by: 'a', conf: 'I needed to get that out before I have to sit at a table and talk about it calmly.' },
  ] },
  { id: 'jh.pr7', turns: [
    { by: 'a', say: 'Can somebody tell me if I was a good player? Honestly?' },
    { beat: '{a} laughs before anybody can answer.' },
    { by: 'a', conf: "I don't actually want the answer yet. Ask me after the finale." },
  ] },
];
const ROOTING = [
  { id: 'jh.ro1', turns: [
    { by: 'a', say: "I'm out. Fine. But my vote's still live, and it has {fin}'s name on it." },
    { by: 'a', conf: "{fin} is the only one in there playing a game I'd vote for." },
  ] },
  { id: 'jh.ro2', turns: [
    { beat: '{a} watches {fin} on the feeds and grins every time {fin} gets through another vote.' },
    { by: 'a', say: 'Come on, {fin}. One more.' },
    { by: 'a', conf: "I'm not allowed to help anymore. So I cheer." },
  ] },
  { id: 'jh.ro3', turns: [
    { by: 'a', say: 'Say what you want about {fin}. Nobody in there worked harder.' },
    { beat: 'Somebody at the pool starts to argue. {a} talks right over them.' },
    { by: 'a', conf: "I'll defend {fin} until the finale. Then I'll vote for {fin}." },
  ] },
  { id: 'jh.ro4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: 'I made {fin} a friendship bracelet. Is that weird?' },
    { by: 'a', conf: "{fin} looked out for me in the game. I want {fin} to know somebody in here is in {fin}'s corner." },
  ] },
  { id: 'jh.ro5', turns: [
    { by: 'a', say: 'If {fin} wins, I want everyone to remember I called it first.' },
    { by: 'a', conf: 'I picked my winner a long time ago. I am waiting for the rest of the jury to catch up.' },
  ] },
  { id: 'jh.ro6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: 'If one more person in here calls {fin} a floater, I am throwing them in the pool.' },
    { by: 'a', conf: "I'll take shots at a lot of people. Not {fin}." },
  ] },
  { id: 'jh.ro7', turns: [
    { beat: '{a} is on the edge of the couch in the lounge, watching {fin} on the feeds.' },
    { by: 'a', say: "Don't do it. Don't trust them. Oh, good, you didn't." },
    { by: 'a', conf: "I'm more nervous watching {fin} than I ever was playing." },
  ] },
];
const WATCHING = [
  { id: 'jh.wa1', turns: [
    { by: 'a', say: "The game's not done with me yet. I still have a vote, and I want to use it right." },
    { beat: '{a} goes back to watching the feeds in the lounge, chin in hand.' },
    { by: 'a', conf: "I lost. That doesn't mean I stopped seeing what's going on." },
  ] },
  { id: 'jh.wa2', turns: [
    { beat: '{a} watches the others at the pool and says nothing for an hour.' },
    { by: 'a', say: 'Interesting.' },
    { by: 'a', conf: 'You learn a lot about people once the game stops rewarding them for lying.' },
  ] },
  { id: 'jh.wa3', turns: [
    { by: 'a', say: "Three of you have already decided. You two are still thinking about it." },
    { beat: 'The two people at the bar look at each other.' },
    { by: 'a', conf: "Everyone in here is campaigning for somebody. I'm keeping score." },
  ] },
  { id: 'jh.wa4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "So who's everybody voting for?" },
    { beat: '{a} asks it lightly, like it means nothing, and watches every face.' },
    { by: 'a', conf: 'Nobody told me. Their faces told me plenty.' },
  ] },
  { id: 'jh.wa5', turns: [
    { beat: '{a} is keeping a notebook. Nobody is allowed to see it.' },
    { by: 'a', say: "It's private." },
    { by: 'a', conf: 'When I get to that jury bench, I want to know exactly who earned it, and why.' },
  ] },
  { id: 'jh.wa6', turns: [
    { by: 'a', say: "I'm not taking sides. Not yet." },
    { by: 'a', conf: 'I want to hear the finalists make their case before I decide. That is the least they are owed.' },
  ] },
];
const RESTLESS = [
  { id: 'jh.re1', turns: [
    { beat: "{a} can't sit still: laps in the pool, pacing the lobby, anything to burn off being out." },
    { by: 'a', say: "If I stop moving, I start thinking. So I don't stop." },
    { by: 'a', conf: 'I should still be in there. Every lap I swim is one I should be running in a challenge.' },
  ] },
  { id: 'jh.re2', turns: [
    { beat: '{a} snaps at the TV, the food, the weather, everything except the real problem.' },
    { by: 'a', say: "Sorry. It's not you. It's that I should still be playing." },
    { by: 'a', conf: "I'm a competitor. Sitting around is the worst thing they could do to me." },
  ] },
  { id: 'jh.re3', turns: [
    { by: 'a', say: 'Who wants to race? Pool, end to end. Anyone?' },
    { beat: 'Nobody does. {a} races alone.' },
    { by: 'a', conf: 'I need something to win, even if the only person I can beat is me.' },
  ] },
  { id: 'jh.re4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: 'Why is everyone so calm? We got voted out!' },
    { by: 'a', conf: "Everybody here has made peace with it. I haven't, and I'm not going to pretend I have." },
  ] },
  { id: 'jh.re5', turns: [
    { beat: '{a} is doing push-ups by the pool while everyone else relaxes in it.' },
    { by: 'a', say: "Don't mind me." },
    { by: 'a', conf: 'My body still thinks there is a challenge tomorrow.' },
  ] },
  { id: 'jh.re6', turns: [
    { by: 'a', say: 'How many days until the finale?' },
    { beat: 'Somebody tells {a.obj}.' },
    { by: 'a', say: "That's too many." },
    { by: 'a', conf: "I'm counting down the days like it's a sentence. A sentence with a hot tub, but still." },
  ] },
];
const SETTLE = [
  { id: 'jh.se1', turns: [
    { beat: '{a} finds a quiet corner of the motel and, for the first time since the vote, actually relaxes.' },
    { by: 'a', say: 'Okay. This is nice.' },
    { by: 'a', conf: "I spent weeks waiting for somebody to stab me in the back. It's strange having nobody to watch." },
  ] },
  { id: 'jh.se2', turns: [
    { by: 'a', say: 'Is it weird that I like it here?' },
    { by: 'a', conf: 'No votes, no challenges, and the beds are real. I could get used to this.' },
  ] },
  { id: 'jh.se3', turns: [
    { beat: '{a} falls asleep on a lounger in the sun, and nobody wakes {a.obj} up.' },
    { by: 'a', conf: "Best nap of my life. I'm not even sorry." },
  ] },
  { id: 'jh.se4', turns: [
    { by: 'a', say: "I'm going to read a book. An actual book." },
    { by: 'a', conf: "I didn't realize how tired I was until I stopped playing." },
  ] },
  { id: 'jh.se5', turns: [
    { by: 'a', say: 'Is there room service here?' },
    { beat: "There isn't. {a} orders takeout to the front desk anyway." },
    { by: 'a', conf: 'First day of the rest of my life, and it starts with takeout.' },
  ] },
  { id: 'jh.se6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: 'I hope everyone still in the game is okay.' },
    { by: 'a', conf: "I know I'm supposed to be mad. I just miss them." },
  ] },
];

// ── two people ────────────────────────────────────────────────────────
const COMMON = [
  { id: 'jh.co1', turns: [
    { beat: '{a} and {b} get stuck putting the chairs away after breakfast and end up laughing the whole time.' },
    { by: 'a', say: 'How are we this bad at stacking chairs?' },
    { by: 'b', say: "It's a gift." },
    { by: 'a', conf: 'We barely spoke in the game. We are actually funny together.' },
  ] },
  { id: 'jh.co2', turns: [
    { by: 'b', say: 'You were having a rough night. Are you okay?' },
    { by: 'a', say: 'Better now.' },
    { by: 'b', say: "Good. I'll sit here a while." },
    { by: 'a', conf: "{b} didn't say anything clever. {b} just stayed, and that was enough." },
  ] },
  { id: 'jh.co3', turns: [
    { by: 'a', say: 'Where are you from, anyway?' },
    { by: 'b', say: "Nowhere you've heard of." },
    { by: 'a', say: 'Try me.' },
    { beat: '{b} tells {a.obj}. It turns out to be two hours from where {a} grew up.' },
    { by: 'b', conf: 'Two strangers, and suddenly not strangers. That is this whole motel.' },
  ] },
  { id: 'jh.co4', turns: [
    { by: 'a', say: 'I had you completely wrong.' },
    { by: 'b', say: 'Yeah. Same.' },
    { by: 'a', say: 'I thought you were a robot.' },
    { by: 'b', say: 'I thought you were a snake.' },
    { by: 'a', conf: "We were each other's biggest misread all season. We can laugh about it now." },
  ] },
  { id: 'jh.co5', turns: [
    { beat: "{a} teaches {b} a card trick nobody asked about, and an hour disappears." },
    { by: 'b', say: 'Again. Do it again.' },
    { by: 'a', say: 'A magician never shows the same trick twice.' },
    { by: 'b', say: 'Do it again.' },
    { by: 'b', conf: "It's the most normal hour I've had since the game started." },
  ] },
  { id: 'jh.co6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I'm really glad you're here." },
    { by: 'b', say: "In the losers' motel?" },
    { by: 'a', say: "With me, in the losers' motel." },
    { by: 'b', conf: '{a} is just kind. It is that simple, and I missed it in the game.' },
  ] },
];
const GAMETALK = [
  { id: 'jh.gt1', turns: [
    { beat: '{a} and {b} sprawl by the pool, comparing notes on the finalists.' },
    { by: 'a', say: "Who's actually playing, though? Really playing?" },
    { by: 'b', say: "That's the question, isn't it?" },
    { by: 'a', conf: 'The longer we talk, the less sure I am about my vote.' },
  ] },
  { id: 'jh.gt2', turns: [
    { by: 'a', say: 'Walk me through it. The vote that got me out.' },
    { by: 'b', say: 'Okay. It started the day before.' },
    { beat: '{b} goes through it piece by piece. {a} goes quiet.' },
    { by: 'a', conf: '{b} saw something I never saw. That stings.' },
  ] },
  { id: 'jh.gt3', turns: [
    { by: 'a', say: 'Rank them. All of them. Worst to best.' },
    { by: 'b', say: 'Out loud?' },
    { by: 'a', say: 'Out loud.' },
    { beat: 'It takes an hour. It gets heated, then honest, then personal.' },
    { by: 'b', conf: "We don't agree on a single ranking. I'm taking notes anyway." },
  ] },
  { id: 'jh.gt4', turns: [
    { by: 'b', say: 'Who has the best résumé, if you ignore whether you like them?' },
    { by: 'a', say: "That's the problem. I can't ignore it." },
    { by: 'b', conf: 'We all say we will vote on the game. Nobody really does.' },
  ] },
  { id: 'jh.gt5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "If you and I vote together, that's two votes. That matters." },
    { by: 'b', say: 'Are you seriously still playing?' },
    { by: 'a', say: 'Always.' },
    { by: 'b', conf: '{a} never stopped. I am almost impressed.' },
  ] },
  { id: 'jh.gt6', turns: [
    { by: 'a', say: "I can't decide between two of them." },
    { by: 'b', say: 'Which two?' },
    { by: 'a', say: 'Not telling you yet.' },
    { by: 'b', say: 'Then why bring it up?' },
    { by: 'a', say: "So you'd think about it too." },
    { by: 'b', conf: "{a} got me thinking about my vote again. I thought I'd figured it out." },
  ] },
];

// ── to camera ─────────────────────────────────────────────────────────
const CONF = [
  { id: 'jh.cf1', turns: [{ by: 'a', conf: 'For weeks this game was my whole life. Now I share a motel with the people who took it from me, and I still get a vote. I plan to make it count.' }] },
  { id: 'jh.cf2', turns: [{ by: 'a', conf: "You'd think we'd all be at each other's throats in here. Some of us are. But I'm making friends I never would have made in the game." }] },
  { id: 'jh.cf3', turns: [{ by: 'a', conf: "I keep replaying my vote-out. My jury seat is the last power I have, and I'm not giving it to someone who lied to my face." }] },
  { id: 'jh.cf4', turns: [{ by: 'a', conf: "The finale is coming. I watch every move the finalists make, because when I sit on that jury, I want to know exactly who earned it." }] },
  { id: 'jh.cf5', turns: [{ by: 'a', conf: 'I thought this would feel like losing. Some days it feels more like getting my life back.' }] },
  { id: 'jh.cf6', turns: [{ by: 'a', conf: "The strangest part is that I miss it. I hated the game half the time, and I'd go back in a heartbeat." }] },
];

// ── the motel together: {a}, {b} and {c} ────────────────────────────
// water aerobics: {a} runs it, {b} hates it, {c} loves it
const AEROBICS = [
  { id: 'jh.wa21', turns: [
    { beat: '{a} has made {a.ref} the activities director and stands at the edge of the pool with a whistle.' },
    { by: 'a', say: 'And reach! And reach! Feel the burn, people!' },
    { by: 'b', say: "If you blow that whistle one more time, I'm throwing it in the deep end." },
    { by: 'c', say: "I'm actually loving this?" },
    { by: 'b', say: 'Of course you are.' },
    { by: 'b', conf: "This is how I'll remember this place. {a}, a whistle, and nowhere to hide." },
  ] },
  { id: 'jh.wa22', turns: [
    { by: 'a', say: 'Okay, everybody, water aerobics! It is mandatory fun!' },
    { by: 'b', say: "There's no such thing as mandatory fun." },
    { by: 'a', say: 'There is now.' },
    { beat: '{c} is already in the pool doing arm circles.' },
    { by: 'c', say: "Come on, {b}, it's not that bad!" },
    { by: 'b', conf: 'Everything about it was bad. I did it anyway.' },
  ] },
  { id: 'jh.wa23', turns: [
    { beat: '{a} has talked half the motel into a water aerobics class.' },
    { by: 'a', say: 'Left leg! Your other left!' },
    { by: 'c', say: "This is the best day I've had in weeks." },
    { by: 'b', say: "This is the worst day I've had in weeks, and I got voted out." },
    { by: 'b', conf: "I haven't laughed this hard since day one. Don't tell {a}." },
  ] },
  { id: 'jh.wa24', turns: [
    { by: 'a', say: "Line up, everybody. We're doing synchronized swimming." },
    { by: 'b', say: 'We are absolutely not doing synchronized swimming.' },
    { beat: 'Ten minutes later, {b} is doing synchronized swimming.' },
    { by: 'c', say: "{b}, you're a natural!" },
    { by: 'b', conf: 'I would like it on the record that I was forced.' },
  ] },
  { id: 'jh.wa25', turns: [
    { beat: '{a} counts out loud while {b} and {c} flail around in the shallow end.' },
    { by: 'a', say: 'Five, six, seven, eight!' },
    { by: 'b', say: "My legs don't bend that way!" },
    { by: 'c', say: 'Mine do! Watch!' },
    { beat: '{c} goes under.' },
    { by: 'a', conf: "Maybe I'm not the best activities director. I'm still the only one we have." },
  ] },
  { id: 'jh.wa26', turns: [
    { by: 'a', say: 'Everybody in! The water is warm!' },
    { by: 'b', say: 'You said that about the hot tub, and the hot tub was freezing.' },
    { by: 'c', say: 'It was kind of freezing.' },
    { by: 'a', say: 'Nobody asked you, {c}!' },
    { by: 'a', conf: 'Being in charge of fun is harder than being in the game.' },
  ] },
];
// bingo night: {a} calls the numbers, {b} says it is rigged, {c} wins without paying attention
const BINGO = [
  { id: 'jh.bi1', turns: [
    { beat: 'Bingo night at the motel gets cutthroat fast. {a} is calling the numbers.' },
    { by: 'a', say: 'B4.' },
    { by: 'b', say: "That's the third B in a row. You're rigging it." },
    { by: 'a', say: "It's a ball in a cage, {b}!" },
    { by: 'c', say: 'Bingo! Wait, is that bingo?' },
    { by: 'b', say: 'Oh, come on!' },
    { by: 'b', conf: "I lost to somebody who didn't know what bingo was. I want that on the record." },
  ] },
  { id: 'jh.bi2', turns: [
    { by: 'a', say: 'G50.' },
    { by: 'c', say: 'Oh! I have that! Do I have that?' },
    { by: 'b', say: "You're not even looking at your card!" },
    { by: 'c', say: 'Bingo!' },
    { by: 'a', conf: '{c} won three rounds in a row without paying attention once. Honestly, I am impressed.' },
  ] },
  { id: 'jh.bi3', turns: [
    { by: 'b', say: 'I wanted poker. Nobody wanted poker.' },
    { by: 'a', say: "Because you'd take everybody's money." },
    { by: 'b', say: "That's what poker is for!" },
    { by: 'a', say: 'I19.' },
    { by: 'c', say: 'Bingo!' },
    { by: 'b', conf: 'This game takes no skill. Just luck. I hate it.' },
  ] },
  { id: 'jh.bi4', turns: [
    { beat: '{b} watches {a} spin the cage with narrowed eyes.' },
    { by: 'b', say: 'Show me the ball.' },
    { by: 'a', say: 'What?' },
    { by: 'b', say: 'Show me the ball before you call it.' },
    { by: 'a', say: 'N32.' },
    { by: 'c', say: 'Bingo!' },
    { by: 'b', conf: "I'm not saying {a} cheated. I'm saying I'd like an investigation." },
  ] },
  { id: 'jh.bi5', turns: [
    { by: 'c', say: 'How do you play again?' },
    { by: 'a', say: 'You mark the numbers I call.' },
    { by: 'c', say: 'Oh. Like this?' },
    { by: 'a', say: 'Yes, and that is a bingo.' },
    { by: 'b', say: 'Unbelievable.' },
    { by: 'c', conf: "I don't know how I won. I'm keeping the prize anyway." },
  ] },
  { id: 'jh.bi6', turns: [
    { by: 'a', say: 'Last round. The winner gets the good lounger tomorrow.' },
    { by: 'b', say: "Now you're talking." },
    { beat: '{b} watches the card like a hawk. {c} barely looks at it.' },
    { by: 'c', say: 'Bingo.' },
    { by: 'b', conf: 'The good lounger. Gone. To somebody who was not even trying.' },
  ] },
];
// a guitar: {a} plays, {b} and {c} drift over
const MUSIC = [
  { id: 'jh.mu1', turns: [
    { beat: 'Somebody finds a guitar in the lounge, and it turns out {a} can actually play.' },
    { by: 'b', say: "Wait, you're good!" },
    { by: 'a', say: "Don't sound so surprised." },
    { beat: '{c} sits down on the floor. {b} starts humming along.' },
    { by: 'c', conf: 'For one evening, this place sounded less like a waiting room and more like a home.' },
  ] },
  { id: 'jh.mu2', turns: [
    { by: 'a', say: 'Any requests?' },
    { by: 'b', say: "Something sad. I'm feeling sad." },
    { by: 'c', say: 'Something happy, because {b} is feeling sad.' },
    { beat: '{a} plays something in between, and both of them sing.' },
    { by: 'a', conf: "I hadn't played in weeks. I didn't realize how much I missed it." },
  ] },
  { id: 'jh.mu3', turns: [
    { beat: '{a} strums by the fire on the beach while {b} and {c} lie back in the sand.' },
    { by: 'b', say: 'Play the one from before.' },
    { by: 'a', say: 'Which one?' },
    { by: 'b', say: 'The one that made {c} cry.' },
    { by: 'c', say: "I didn't cry!" },
    { by: 'a', conf: "Music is the one thing in here that isn't about the game. Everybody needs that." },
  ] },
  { id: 'jh.mu4', turns: [
    { by: 'c', say: 'Teach me a song?' },
    { by: 'a', say: "Okay. Three chords. That's all you need." },
    { beat: '{c} learns two of them in twenty minutes. {b} is laughing too hard to help.' },
    { by: 'c', conf: "I'm terrible at it. I'm going to keep practicing anyway." },
  ] },
  { id: 'jh.mu5', turns: [
    { by: 'a', say: 'This one is for everybody who got blindsided.' },
    { by: 'b', say: 'So, all of us.' },
    { by: 'a', say: 'So, all of us.' },
    { beat: 'The whole lounge sings along, badly.' },
    { by: 'b', conf: 'It was a terrible song, and we sang it like it was the best one ever written.' },
  ] },
  { id: 'jh.mu6', turns: [
    { by: 'b', say: 'Play something we all know.' },
    { by: 'a', say: 'Like what?' },
    { by: 'c', say: 'The theme song!' },
    { by: 'a', say: 'We are not singing the theme song.' },
    { beat: 'They sing the theme song.' },
    { by: 'a', conf: "If anyone asks, this never happened." },
  ] },
];

// ── the last night ────────────────────────────────────────────────────
// a toast: {a} found the drinks, {b} makes the speech, {c} tears up
const TOAST = [
  { id: 'jh.to1', turns: [
    { beat: 'On the last night, the whole motel piles out by the pool with whatever {a} found in the mini-fridge.' },
    { by: 'b', say: 'Okay, a toast. To getting voted out.' },
    { by: 'c', say: 'To getting voted out!' },
    { by: 'b', say: "Old grudges, new friends, and nobody in here leaving the way they came in." },
    { beat: '{c} wipes {c.posAdj} eyes and blames the chlorine.' },
    { by: 'c', conf: "I didn't expect to miss this place. I already do." },
  ] },
  { id: 'jh.to2', turns: [
    { by: 'a', say: "Last night, everybody. Who's making a speech?" },
    { by: 'b', say: 'Fine. Me.' },
    { by: 'b', say: "Most of us came in here hating at least one person. I don't think anybody's leaving that way." },
    { by: 'c', say: "Oh no, I'm going to cry." },
    { by: 'a', conf: "I'll remember this more than any challenge I ever won." },
  ] },
  { id: 'jh.to3', turns: [
    { beat: '{a} hands out drinks around the pool, one for everyone.' },
    { by: 'b', say: 'To the jury.' },
    { by: 'a', say: 'To the jury!' },
    { by: 'c', say: 'To whoever wins, and to us for deciding it.' },
    { by: 'c', conf: 'It feels like the last day of summer camp. I guess it kind of is.' },
  ] },
  { id: 'jh.to4', turns: [
    { by: 'b', say: 'Can we promise something? Whatever happens at the finale, we stay friends.' },
    { by: 'a', say: 'Even if we vote differently?' },
    { by: 'b', say: 'Especially if we vote differently.' },
    { by: 'c', say: 'Deal.' },
    { by: 'c', conf: "I don't know how many of these promises we'll keep. I really want to keep this one." },
  ] },
  { id: 'jh.to5', turns: [
    { by: 'a', say: 'I found more drinks!' },
    { by: 'c', say: 'Where?' },
    { by: 'a', say: "Don't ask." },
    { by: 'b', say: 'Then I won\'t. To {a}, for whatever this is.' },
    { by: 'c', conf: 'Best night we had here. Nobody talked about the game for a whole hour.' },
  ] },
  { id: 'jh.to6', turns: [
    { beat: 'Everyone ends up in the pool with their clothes on, and nobody remembers whose idea it was.' },
    { by: 'b', say: 'This was your idea!' },
    { by: 'a', say: 'It was not!' },
    { by: 'c', say: 'It was mine.' },
    { beat: 'Everyone turns to look at {c}.' },
    { by: 'c', conf: "I'd been quiet all week. Somebody had to do something." },
  ] },
];
// cards: {a} brings the deck, {b} and {c} play until three in the morning
const CARDS = [
  { id: 'jh.ca1', turns: [
    { beat: '{a} digs out a deck of cards, and the whole motel crowds round for one loud game that runs until three in the morning.' },
    { by: 'b', say: "You're cheating." },
    { by: 'a', say: "I'm winning. You're just not used to it." },
    { by: 'c', say: 'Deal me in again!' },
    { by: 'b', conf: 'For one evening, we all forgot we were the people the game threw away.' },
  ] },
  { id: 'jh.ca2', turns: [
    { by: 'a', say: 'Poker? Go Fish? Something with rules nobody here knows?' },
    { by: 'c', say: 'Go Fish!' },
    { by: 'b', say: 'We are adults.' },
    { by: 'c', say: 'Go Fish!' },
    { beat: 'They play Go Fish until three in the morning.' },
    { by: 'c', conf: 'Best game of the whole season, and nobody got voted out.' },
  ] },
  { id: 'jh.ca3', turns: [
    { by: 'b', say: 'Last hand. The loser jumps in the pool.' },
    { by: 'a', say: 'Deal.' },
    { beat: '{b} loses. {b} jumps in the pool.' },
    { by: 'c', say: 'Do it again!' },
    { by: 'b', conf: "I'm soaked, and I don't even care." },
  ] },
  { id: 'jh.ca4', turns: [
    { by: 'a', say: "Okay, who's the best liar in this motel?" },
    { by: 'b', say: 'We all got voted out, so none of us.' },
    { by: 'c', say: 'Speak for yourself.' },
    { beat: 'It turns into a bluffing game, and {c} wins every round.' },
    { by: 'a', conf: 'The quietest person in the motel is the best liar in it. Good thing {c} is out of the game.' },
  ] },
  { id: 'jh.ca5', turns: [
    { by: 'c', say: 'What happens when we leave?' },
    { by: 'a', say: 'We go home.' },
    { by: 'c', say: 'I mean us. This.' },
    { by: 'b', say: 'We do this again at the reunion.' },
    { by: 'c', conf: "I don't want this to end. Which is strange, because I didn't want to be here at all." },
  ] },
  { id: 'jh.ca6', turns: [
    { beat: 'The card game falls apart when {b} catches {a} with an ace up {a.posAdj} sleeve.' },
    { by: 'a', say: 'It fell in there.' },
    { by: 'b', say: 'It did not fall in there!' },
    { by: 'c', say: 'I knew it!' },
    { by: 'a', conf: "I've been voted out. I have nothing to lose by cheating at cards." },
  ] },
];

export default {
  'jury.arrive.hug': ARRIVE_HUG, 'jury.arrive.alone': ARRIVE_ALONE,
  'jury.grudge.wounds': GRUDGE_WOUNDS, 'jury.grudge.boils': GRUDGE_BOILS, 'jury.grudge.reckon': GRUDGE_RECKON, 'jury.grudge.buried': GRUDGE_BURIED,
  'jury.outsider.outside': OUT_OUTSIDE, 'jury.outsider.seat': OUT_SEAT, 'jury.outsider.belong': OUT_BELONG,
  'jury.bitter.start': BITTER_START, 'jury.bitter.vote': BITTER_VOTE,
  'jury.friends.strange': FRIENDS_STRANGE, 'jury.friends.thick': FRIENDS_THICK,
  'jury.looms.any': LOOMS,
  'jury.solo.processing': PROCESSING, 'jury.solo.rooting': ROOTING, 'jury.solo.watching': WATCHING, 'jury.solo.restless': RESTLESS, 'jury.solo.settle': SETTLE,
  'jury.pair.common': COMMON, 'jury.pair.gametalk': GAMETALK,
  'jury.conf.any': CONF,
  'jury.group.aerobics': AEROBICS, 'jury.group.bingo': BINGO, 'jury.group.music': MUSIC,
  'jury.night.toast': TOAST, 'jury.night.cards': CARDS,
};

/** Data a jury scene always carries, by key (the writer may say these without asking). */
export const GUARANTEED = {
  'jury.bitter.start': ['target'], 'jury.bitter.vote': ['target'], 'jury.solo.rooting': ['fin'],
};
