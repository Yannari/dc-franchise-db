// ══════════════════════════════════════════════════════════════════════
// td/script/lines/drama-more.js — more of the drama that comes up most often
// ══════════════════════════════════════════════════════════════════════
//
// Same keys as lines/drama.js (index.js adds them up), grown to what a season uses:
// a hothead's social bomb airs about nine times a season, a power clash about five
// (measured over five played seasons, 2026-10-07). Ids: 'dm.'.

const BOMB_HOTHEAD = [
  { id: 'dm.bh1', turns: [
    { by: 'b', say: "Did you put the lid back on the water?" },
    { by: 'a', say: "Oh my GOD, I am SO sorry I forgot the LID, call the POLICE." },
    { by: 'b', say: "I just asked." },
    { by: 'b', conf: "It was a lid. {a} made it a crime scene." },
  ] },
  { id: 'dm.bh2', turns: [
    { by: 'a', say: "Why is it always me? Why is it ALWAYS me doing everything around here?" },
    { by: 'b', say: "You did one thing today." },
    { by: 'a', say: "And it was EVERYTHING!" },
    { by: 'b', conf: "{a} fetched water once. Once. We'll be hearing about it for a week." },
  ] },
  { id: 'dm.bh3', turns: [
    { beat: '{a} has been quiet all morning. Then {b} hums a song by the fire.' },
    { by: 'a', say: "Can you NOT?" },
    { by: 'b', say: "Not what?" },
    { by: 'a', say: "EXIST so LOUDLY!" },
    { by: 'b', conf: "I was humming. Quietly. I've been humming quietly for a week." },
  ] },
  { id: 'dm.bh4', turns: [
    { by: 'a', say: "You know what? Every single one of you is useless!" },
    { by: 'b', say: "Every single one?" },
    { by: 'a', say: "YES!" },
    { beat: '{a} storms off. Slowly, somebody starts laughing. Then everybody does.' },
    { by: 'b', conf: "Useless and amused. Mostly amused." },
  ] },
  { id: 'dm.bh5', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "Maybe calm down a bit?" },
    { by: 'a', say: "I AM calm! THIS is calm!" },
    { by: 'b', say: "That's what worries me." },
    { by: 'b', conf: "If that's calm, I never want to see angry." },
  ] },
  { id: 'dm.bh6', turns: [
    { by: 'a', say: "I'm not here to make friends, okay? I'm here to WIN!" },
    { by: 'b', say: "You can do both." },
    { by: 'a', say: "Not with YOU people!" },
    { by: 'b', conf: "{a} said 'you people'. To all of us. At once." },
  ] },
  { id: 'dm.bh7', turns: [
    { beat: "{b} reaches for the last banana. {a} reaches at the same time." },
    { by: 'a', say: "That's MINE. I saw it FIRST." },
    { by: 'b', say: "It's a banana." },
    { by: 'a', say: "It's MY banana!" },
    { by: 'b', conf: "We had a whole fight over a banana. In front of everyone. I let {a} have it. I'm still mad." },
  ] },
  { id: 'dm.bh8', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Some of you didn't even TRY out there today!" },
    { by: 'b', say: "We all tried." },
    { by: 'a', say: "Then try HARDER!" },
    { by: 'b', conf: "{a} wanted to win so badly that {a} yelled at the people who'd have to vote for {a.obj}." },
  ] },
  { id: 'dm.bh9', turns: [
    { by: 'a', say: "Oh, that's rich. Coming from YOU." },
    { by: 'b', say: "I said good morning." },
    { by: 'a', say: "In THAT tone?" },
    { by: 'b', conf: "Good morning has a tone now. Noted." },
  ] },
  { id: 'dm.bh10', turns: [
    { beat: '{a} kicks the sand so hard it gets in the rice.' },
    { by: 'b', say: "Great. Sandy rice. Again." },
    { by: 'a', say: "Then cook your OWN rice!" },
    { by: 'b', conf: "I'm eating sand because {a} had a feeling. Everyone saw it." },
  ] },
  { id: 'dm.bh11', when: { age: 'older' }, turns: [
    { by: 'a', say: "I have had it with all of you acting like children!" },
    { by: 'b', say: "We're not acting." },
    { by: 'a', say: "That's even worse!" },
    { by: 'b', conf: "{a} yelled at us like a substitute teacher. We all got the message. We all resented it." },
  ] },
  { id: 'dm.bh12', when: { age: 'teen' }, turns: [
    { by: 'a', say: "Oh, sorry, I forgot I'm not allowed to have FEELINGS here!" },
    { by: 'b', say: "Nobody said that." },
    { by: 'a', say: "You THOUGHT it!" },
    { by: 'b', conf: "Apparently I'm in trouble for what I'm thinking now." },
  ] },
  { id: 'dm.bh13', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Everybody just stop being so MEAN all the time!" },
    { beat: 'Everyone stares. {a} never yells.' },
    { by: 'b', say: "Are you okay?" },
    { by: 'a', say: "NO!" },
    { by: 'b', conf: "When the nicest person in camp blows up, you know it's bad. We all felt it." },
  ] },
  { id: 'dm.bh14', when: { strong: true }, turns: [
    { beat: '{a} throws a log on the fire so hard that sparks fly at everyone.' },
    { by: 'b', say: "Whoa! Watch it!" },
    { by: 'a', say: "YOU watch it!" },
    { by: 'b', conf: "Nobody wants to argue with {a}. That's not respect. That's fear." },
  ] },
];
const READ_HOTHEAD = [
  { id: 'dm.rh1', turns: [
    { by: 'a', conf: "Imagine sitting next to {b} at the final vote. I can't. I won't." },
  ] },
  { id: 'dm.rh2', turns: [
    { beat: '{a} quietly moves {a.posAdj} things to the other side of the fire.' },
    { by: 'a', conf: "I'm not saying anything. I'm just sitting further away from {b} from now on." },
  ] },
  { id: 'dm.rh3', turns: [
    { by: 'a', conf: "The scariest part isn't that {b} yelled. It's that {b} looked happy doing it." },
  ] },
  { id: 'dm.rh4', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "Every time {b} explodes, I lose a problem. I didn't even have to lift a finger." },
  ] },
  { id: 'dm.rh5', turns: [
    { by: 'a', say: "Is everyone okay?" },
    { by: 'b', say: "I'm RIGHT HERE." },
    { by: 'a', say: "I know. I was asking everyone else." },
    { by: 'a', conf: "Not my finest moment. Worth it." },
  ] },
  { id: 'dm.rh6', turns: [
    { by: 'a', conf: "{b} needs to win every argument. Fine. {b} can win the argument. I'll win the vote." },
  ] },
  { id: 'dm.rh7', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I've got a temper too. But I'm not stupid with it. {b} is stupid with it." },
  ] },
  { id: 'dm.rh8', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "Yelling doesn't win challenges. {b} would know that if {b} won any." },
  ] },
  { id: 'dm.rh9', turns: [
    { beat: '{a} catches somebody\'s eye across the fire. They both look away quickly.' },
    { by: 'a', conf: "That look said everything. We're both done with {b}." },
  ] },
  { id: 'dm.rh10', when: { age: 'older' }, turns: [
    { by: 'a', conf: "I've raised teenagers. {b} is a teenager with a vote. That's a dangerous combination." },
  ] },
  { id: 'dm.rh11', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I don't like loud people. I really don't like loud people who yell at me." },
  ] },
  { id: 'dm.rh12', when: { register: 'cool' }, turns: [
    { by: 'a', conf: "{b} keeps giving me reasons. I don't even have to look for them anymore." },
  ] },
  { id: 'dm.rh13', when: { band: 'friends' }, turns: [
    { by: 'a', conf: "{b} is my friend. My friend also just blew up in front of everyone. I don't know how to protect someone who keeps doing that." },
  ] },
  { id: 'dm.rh14', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Hey, {b}. Want some water? It might help." },
    { by: 'b', say: "I don't need WATER." },
    { by: 'a', conf: "I tried. I really tried. {b} doesn't want help. {b} wants an audience." },
  ] },
];
const BOMB_ARROGANT = [
  { id: 'dm.ba1', turns: [
    { by: 'a', say: "No offence, but if I were playing with better people, I'd be running this game." },
    { by: 'b', say: "How is that no offence?" },
    { by: 'a', say: "I said no offence first. It's a rule." },
  ] },
  { id: 'dm.ba2', turns: [
    { by: 'a', say: "I'm not saying I'm the best player here. I'm just saying nobody else is close." },
    { by: 'b', conf: "{a} said that to a fire full of people who all have votes. Brave. Or not very smart." },
  ] },
  { id: 'dm.ba3', when: { charm: true }, turns: [
    { by: 'a', say: "Honestly, I could get any of you to do anything. It's a gift." },
    { by: 'b', say: "Prove it." },
    { by: 'a', say: "Pass me the water." },
    { beat: '{b} passes the water. Then realises.' },
    { by: 'b', conf: "{a} made a point. {a} also made an enemy." },
  ] },
  { id: 'dm.ba4', turns: [
    { by: 'a', say: "When I win this, I'll mention all of you in my speech. Briefly." },
    { by: 'b', say: "When you win?" },
    { by: 'a', say: "I'm being polite. I could've said if." },
  ] },
  { id: 'dm.ba5', when: { brainy: true }, turns: [
    { by: 'a', say: "It's honestly exhausting being the only one here who thinks ahead." },
    { by: 'b', say: "We think ahead." },
    { by: 'a', say: "To lunch, maybe." },
    { by: 'b', conf: "{a} is smart. {a} is also about to find out that smart doesn't count votes." },
  ] },
  { id: 'dm.ba6', turns: [
    { by: 'a', say: "Let me give everyone some free advice." },
    { by: 'b', say: "Nobody asked." },
    { by: 'a', say: "That's why it's free." },
    { beat: '{a} gives the advice anyway, to everybody, for ten minutes.' },
  ] },
];
const READ_ARROGANT = [
  { id: 'dm.ra1', turns: [
    { by: 'a', conf: "{b} keeps telling everyone how great {b} is. Every time, I lose a little more interest in keeping {b.obj} around." },
  ] },
  { id: 'dm.ra2', when: { register: 'competitor' }, turns: [
    { by: 'a', conf: "If {b} is so good, {b} can win immunity. Until then, {b} is a name." },
  ] },
  { id: 'dm.ra3', turns: [
    { beat: '{a} nods along with every word {b} says, smiling the whole time.' },
    { by: 'a', conf: "Smile and nod. Smile and nod. Then write the name down." },
  ] },
  { id: 'dm.ra4', when: { age: 'older' }, turns: [
    { by: 'a', conf: "I've worked for people like {b}. The confident ones are always the first to fall. Usually in a meeting." },
  ] },
  { id: 'dm.ra5', when: { register: 'shy' }, turns: [
    { by: 'a', conf: "I don't talk much. But I listen. And I heard every word {b} said." },
  ] },
];
const CLASH = [
  { id: 'dm.cl1', turns: [
    { by: 'a', say: "Fire first, then food. That's the plan." },
    { by: 'b', say: "Food first. Nobody can work on an empty stomach." },
    { by: 'a', say: "Nobody can eat without a fire!" },
    { by: 'b', say: "Raw fish exists!" },
    { by: 'a', conf: "{b} would rather eat raw fish than let me be right. That's who we're dealing with." },
  ] },
  { id: 'dm.cl2', turns: [
    { by: 'b', say: "I'll take it from here, thanks." },
    { by: 'a', say: "There's nothing to take. I'm doing it." },
    { by: 'b', say: "You're doing it wrong." },
    { by: 'a', say: "Then show me. From over there." },
  ] },
  { id: 'dm.cl3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Okay. Firewood. Two crews: one gathers, one chops, and we swap at noon. Hands up if you're with me." },
    { beat: "Two hands go up around the group." },
    { by: 'b', say: "Or we all gather now, while it's light, and chop together once it's piled up. Hands?" },
    { beat: "Two hands go up for that too. Everyone looks at the one person who hasn't voted." },
    { by: 'a', conf: "A tie. Over firewood. This is what democracy looks like out here." },
  ] },
  { id: 'dm.cl4', turns: [
    { by: 'a', say: "Can you stop undoing everything I set up?" },
    { by: 'b', say: "Can you stop setting things up wrong?" },
    { by: 'a', say: "There's no wrong way to stack wood!" },
    { by: 'b', say: "There is, and you found it." },
  ] },
  { id: 'dm.cl5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'M IN CHARGE!" },
    { by: 'b', say: "SAYS WHO?" },
    { by: 'a', say: "SAYS ME!" },
    { beat: 'Everyone else quietly leaves to go do whatever they want.' },
  ] },
  { id: 'dm.cl6', turns: [
    { beat: "{a} draws a chore chart in the sand. {b} rubs it out and draws a different one." },
    { by: 'a', say: "Are you serious?" },
    { by: 'b', say: "Mine has colours." },
    { by: 'a', say: "It's SAND." },
    { by: 'b', conf: "Mine was better. Everyone knows mine was better." },
  ] },
  { id: 'dm.cl7', when: { age: 'teen' }, turns: [
    { by: 'b', say: "Shouldn't someone older be in charge?" },
    { by: 'a', say: "Shouldn't someone smarter be talking?" },
    { by: 'b', conf: "{a} is young and in charge of nothing and still won that exchange. I hate it." },
  ] },
  { id: 'dm.cl8', when: { gap: 'older' }, turns: [
    { by: 'a', say: "Listen to me. I've done this kind of thing before." },
    { by: 'b', say: "Camped on a reality show?" },
    { by: 'a', say: "Organised people who didn't want to be organised." },
    { by: 'b', conf: "{a} is going to treat us like an office until somebody votes {a.obj} out. Possibly me." },
  ] },
];
const FOOD = [
  { id: 'dm.fo1', turns: [
    { by: 'b', say: "Who ate the berries we were saving?" },
    { beat: "{a} has purple fingers." },
    { by: 'a', say: "Birds, probably." },
    { by: 'b', conf: "A bird with purple fingers. Okay." },
  ] },
  { id: 'dm.fo2', turns: [
    { by: 'b', say: "There were six fish. Now there are four." },
    { by: 'a', say: "Fish shrink when you cook them." },
    { by: 'b', say: "Not in NUMBER." },
  ] },
  { id: 'dm.fo3', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "You're eating more than everyone." },
    { by: 'a', say: "I'm thinking more than everyone. It burns calories." },
    { by: 'b', conf: "That's the worst excuse I've ever heard. {a} delivered it like a professor." },
  ] },
  { id: 'dm.fo4', turns: [
    { by: 'a', say: "I'm just tasting it. To make sure it's cooked." },
    { by: 'b', say: "That's your fifth taste." },
    { by: 'a', say: "It's a big pot." },
  ] },
  { id: 'dm.fo5', when: { age: 'teen' }, turns: [
    { by: 'b', say: "You've had three helpings!" },
    { by: 'a', say: "I'm still growing!" },
    { by: 'b', say: "We're ALL starving!" },
    { by: 'b', conf: "{a} plays the young card every time there's food. It's starting to work on me less." },
  ] },
  { id: 'dm.fo6', turns: [
    { beat: "{b} finds a stash of coconut pieces hidden under {a}'s bag." },
    { by: 'b', say: "Planning something?" },
    { by: 'a', say: "Emergency supplies." },
    { by: 'b', say: "For an emergency of one?" },
  ] },
];
const DISPUTE_PLAIN = [
  { id: 'dm.dl1', turns: [
    { by: 'b', say: "You told me we were voting together." },
    { by: 'a', say: "And we will. Probably." },
    { by: 'b', say: "Probably?" },
    { by: 'b', conf: "Probably is the worst word you can hear out here." },
  ] },
  { id: 'dm.dl2', turns: [
    { by: 'a', say: "Your plan's going to get us both voted out." },
    { by: 'b', say: "And yours is better?" },
    { by: 'a', say: "Mine doesn't involve trusting everybody." },
    { by: 'a', conf: "We left still disagreeing. That's two people with two different votes now." },
  ] },
  { id: 'dm.dl3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm not voting for my friend just because you said so!" },
    { by: 'b', say: "Keep your voice down!" },
    { by: 'a', say: "Why? So nobody hears how bossy you are?" },
  ] },
  { id: 'dm.dl4', turns: [
    { by: 'b', say: "Who's been telling people I'm a threat?" },
    { by: 'a', say: "I don't know." },
    { by: 'b', say: "Look at me and say that again." },
    { by: 'a', say: "...I don't know." },
    { by: 'b', conf: "{a} hesitated. That's all I needed to see." },
  ] },
  { id: 'dm.dl5', when: { band: 'friends' }, turns: [
    { by: 'a', say: "I hate that we disagree about this." },
    { by: 'b', say: "Me too. But I'm still right." },
    { by: 'a', say: "And I'm still voting the other way." },
    { by: 'b', conf: "Friends can disagree. Friends can also vote each other out. That's what scares me." },
  ] },
];
const JEALOUS = [
  { id: 'dm.jl1', turns: [
    { by: 'a', say: "Must be nice having everyone love you." },
    { by: 'b', say: "Nobody loves me." },
    { by: 'a', say: "They clapped for you for five minutes." },
    { by: 'a', conf: "Nobody's ever clapped for me for five minutes. Not even my family." },
  ] },
  { id: 'dm.jl2', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{b} won again. Great. Another reason for everybody else to vote {b} out. I'll make sure they remember." },
  ] },
  { id: 'dm.jl3', turns: [
    { by: 'b', say: "You okay? You've been weird since the challenge." },
    { by: 'a', say: "I'm fine. Congrats again. On winning. Again." },
    { by: 'b', conf: "Three congrats in one sentence. Not one of them meant it." },
  ] },
  { id: 'dm.jl4', when: { strong: true }, turns: [
    { by: 'a', say: "I'd have won if I hadn't slipped." },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "I would have." },
    { by: 'a', conf: "I'm stronger than {b}. Everybody knows it. So how does {b} keep beating me?" },
  ] },
  { id: 'dm.jl5', turns: [
    { by: 'a', say: "Everybody keeps saying your name like you're some kind of hero." },
    { by: 'b', say: "I just won a challenge." },
    { by: 'a', say: "Exactly. Just a challenge." },
  ] },
];
const STIR_SLY = [
  { id: 'dm.ss1', turns: [
    { by: 'a', say: "So, {c}, you're okay with {b} taking the good sleeping spot every night?" },
    { by: 'c', say: "I mean, I guess not. Now that you mention it." },
    { by: 'b', say: "Since when do you care where I sleep?" },
    { by: 'a', conf: "I just asked a question. The answer started the fight. Not me." },
  ] },
  { id: 'dm.ss2', turns: [
    { by: 'a', say: "Funny how {b} always volunteers for the easy jobs, right, {c}?" },
    { by: 'c', say: "Ha. Yeah. Actually, yeah." },
    { by: 'b', say: "I did the latrine yesterday!" },
    { by: 'a', conf: "{b} defends {b.ref}, {c} gets suspicious. I just watch." },
  ] },
  { id: 'dm.ss3', turns: [
    { by: 'a', say: "I'm not saying anything. I'm just saying {c} seemed annoyed with you earlier, {b}." },
    { by: 'b', say: "Were you?" },
    { by: 'c', say: "I wasn't! Until now." },
  ] },
  { id: 'dm.ss4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{b}, {c} really looks up to you. Like, a lot. It's sweet." },
    { by: 'c', say: "I never said that." },
    { by: 'b', say: "You don't look up to me?" },
    { by: 'a', conf: "Now one of them is embarrassed and the other one is hurt. I didn't lie once." },
  ] },
  { id: 'dm.ss5', turns: [
    { by: 'a', say: "Did either of you notice the rice going missing? I won't name names." },
    { beat: '{b} and {c} slowly turn to look at each other.' },
    { by: 'a', conf: "I didn't name anybody. They named each other." },
  ] },
];

export default {
  'drama.bomb.hothead': BOMB_HOTHEAD, 'drama.read.hothead': READ_HOTHEAD,
  'drama.bomb.arrogant': BOMB_ARROGANT, 'drama.read.arrogant': READ_ARROGANT,
  'drama.clash.any': CLASH, 'drama.food.any': FOOD, 'drama.dispute.plain': DISPUTE_PLAIN,
  'drama.jealous.any': JEALOUS, 'drama.stir.sly': STIR_SLY,
};
