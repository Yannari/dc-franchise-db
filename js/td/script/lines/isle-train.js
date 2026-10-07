// ══════════════════════════════════════════════════════════════════════
// td/script/lines/isle-train.js — training on the islands, by what it builds
// ══════════════════════════════════════════════════════════════════════
//
// isle.train.<stat> — {a} trains alone; the engine decided the stat it builds
//   (rescue-island.js: training / edge-train). Each pool stages its own activity,
//   so a line about sore arms never follows a morning of reading faces.
// isle.train.any   — fits any training (merged into every stat's pool by the writer).
// isle.injury.<body|head> — training went wrong: a body drill (physical, endurance,
//   boldness, loyalty) or a head drill (mental, strategic, social, intuition,
//   temperament).
// Variants read who {a} is: register, archetype, age band, and what {a} is
// notably good at (strong, brainy, tough, bold, charm, sly, sharp, hot, calm).
// Ids: 'it.'.

const PHYSICAL = [
  { id: 'it.ph1', turns: [
    { beat: '{a} sprints the length of the beach, touches the rocks, and sprints back.' },
    { by: 'a', say: "Eleven. Twelve. Come on, legs." },
    { by: 'a', conf: "The return could be a race. If it is, I want everybody else looking at my back." },
  ] },
  { id: 'it.ph2', turns: [
    { beat: '{a} carries a rock the size of a suitcase from one end of camp to the other. Then back.' },
    { by: 'a', say: "Why. Is it. So heavy." },
    { by: 'a', conf: "Nobody gave me a gym out here. So the island is my gym. The island is a terrible gym." },
  ] },
  { id: 'it.ph3', when: { strong: true }, turns: [
    { beat: '{a} drags a whole fallen log up the beach on {a.posAdj} own.' },
    { by: 'a', say: "Light. That was light." },
    { by: 'a', conf: "Strength is the one thing they can't vote off. I'm getting stronger every day out here." },
  ] },
  { id: 'it.ph4', when: { strong: false }, turns: [
    { beat: '{a} tries to climb a palm tree. Gets halfway. Slides all the way back down.' },
    { by: 'a', say: "Okay. Halfway is something." },
    { by: 'a', conf: "I'm not the strongest person out here. I'm going to be the most stubborn." },
  ] },
  { id: 'it.ph5', when: { age: 'older' }, turns: [
    { beat: '{a} does push-ups on the sand, slower than the younger ones, but not stopping.' },
    { by: 'a', say: "Twenty. Twenty-one. My back is filing a complaint." },
    { by: 'a', conf: "Everybody out here is half my age. Fine. I've got more practice at not quitting." },
  ] },
  { id: 'it.ph6', when: { age: 'teen' }, turns: [
    { beat: '{a} is doing burpees on the beach and talking the whole way through them.' },
    { by: 'a', say: "My gym teacher would be so proud. Or confused. Probably confused." },
    { by: 'a', conf: "Back home I'd still be in bed. Out here I'm doing burpees at sunrise. Who even am I?" },
  ] },
  { id: 'it.ph7', when: { register: 'competitor' }, turns: [
    { beat: '{a} races {a.posAdj} own shadow down the beach and argues with it at the end.' },
    { by: 'a', say: "Photo finish. I'm calling it for me." },
    { by: 'a', conf: "When there's nobody to beat, you beat yesterday's you. Yesterday's me is slow." },
  ] },
  { id: 'it.ph8', when: { arch: 'challenge-beast' }, turns: [
    { beat: '{a} does pull-ups on a branch until the branch snaps.' },
    { by: 'a', say: "Need a bigger tree." },
    { by: 'a', conf: "They voted me out because they couldn't beat me. Out here I'm just making that problem worse." },
  ] },
  { id: 'it.ph9', turns: [
    { beat: '{a} does lunges across the sand, all the way to the water and all the way back.' },
    { by: 'a', say: "My legs hate me. Good." },
    { by: 'a', conf: "Every day I'm out here, somebody in the game is getting lazier. Not me." },
  ] },
];
const ENDURANCE = [
  { id: 'it.en1', turns: [
    { beat: '{a} hangs from a branch with both hands. Minutes go by. {a.PosAdj} arms start to shake.' },
    { by: 'a', say: "Not yet. Not yet." },
    { by: 'a', conf: "Endurance is just deciding to stay a little longer than the other person. I can do that." },
  ] },
  { id: 'it.en2', turns: [
    { beat: '{a} holds a squat in the full sun, sweat dripping off {a.posAdj} chin.' },
    { by: 'a', say: "One more minute. Then one more." },
    { by: 'a', conf: "It hurts. That's how I know it's working. That's what I keep telling myself." },
  ] },
  { id: 'it.en3', when: { tough: true }, turns: [
    { beat: '{a} treads water out past the rocks for what looks like an hour.' },
    { by: 'a', say: "Could go another hour." },
    { by: 'a', conf: "I don't get tired. I get bored. That's my secret weapon out here." },
  ] },
  { id: 'it.en4', when: { tough: false }, turns: [
    { beat: '{a} tries to hold a plank. Wobbles. Collapses face-first in the sand.' },
    { by: 'a', say: "That was a good thirty seconds. That was a great thirty seconds." },
    { by: 'a', conf: "Yesterday it was twenty. Tomorrow it'll be forty. I'll get there." },
  ] },
  { id: 'it.en5', when: { register: 'fiery' }, turns: [
    { beat: '{a} is holding a heavy rock over {a.posAdj} head and glaring at the horizon.' },
    { by: 'a', say: "I will not drop you. I WILL NOT DROP YOU." },
    { by: 'a', conf: "Anger is great fuel. I've got a whole tank of it." },
  ] },
  { id: 'it.en6', when: { age: 'older' }, turns: [
    { beat: '{a} walks into the water up to the chest and stands there against the waves, not moving.' },
    { by: 'a', conf: "I've stood through worse than waves. Twenty-hour shifts. Funerals. Weddings. This is nothing." },
  ] },
  { id: 'it.en7', when: { register: 'cool' }, turns: [
    { beat: '{a} sits in the sun without water for as long as {a.sub} can stand it, eyes closed, completely still.' },
    { by: 'a', conf: "The return could be an endurance thing. Most people break in their head before their body. I'm training the head." },
  ] },
  { id: 'it.en8', turns: [
    { beat: '{a} stands on one leg on a rock in the shallows while the waves push at {a.obj}.' },
    { by: 'a', say: "Don't fall. Don't fall. Don't--" },
    { beat: 'Splash.' },
    { by: 'a', conf: "Lasted longer than yesterday. That's all I need. Longer than yesterday." },
  ] },
];
const MENTAL = [
  { id: 'it.me1', turns: [
    { beat: '{a} has made a puzzle out of driftwood pieces and keeps taking it apart and putting it back together.' },
    { by: 'a', say: "Under a minute. Again." },
    { by: 'a', conf: "If the return's a puzzle, I want my hands to know it before my head does." },
  ] },
  { id: 'it.me2', turns: [
    { beat: '{a} lines up shells in patterns, closes {a.posAdj} eyes, and tries to say them back.' },
    { by: 'a', say: "Pink, white, white, spiral, the ugly one. Yes!" },
    { by: 'a', conf: "Memory challenges are always in there. And I am not losing to a memory challenge." },
  ] },
  { id: 'it.me3', when: { brainy: true }, turns: [
    { beat: '{a} builds a tower of stones, knocks it down on purpose, and rebuilds it faster.' },
    { by: 'a', say: "Better structure. Wider base. Obviously." },
    { by: 'a', conf: "Everybody out here is running laps. I'm doing what I'm good at. Thinking." },
  ] },
  { id: 'it.me4', when: { brainy: false }, turns: [
    { beat: '{a} stares at a pile of sticks that is supposed to be a puzzle. Nothing fits.' },
    { by: 'a', say: "Why is there always one piece left over?" },
    { by: 'a', conf: "Puzzles are my weak spot. So I'm doing puzzles until they're not. Or until I cry." },
  ] },
  { id: 'it.me5', when: { age: 'teen' }, turns: [
    { beat: '{a} is solving a shell puzzle while reciting things out loud to keep focused.' },
    { by: 'a', say: "This is worse than finals week. At least finals had snacks." },
    { by: 'a', conf: "I'm basically studying. On an island. For a game show. My teachers would be confused." },
  ] },
  { id: 'it.me6', when: { register: 'shy' }, turns: [
    { beat: '{a} works on a stick puzzle in a quiet corner, away from everyone.' },
    { by: 'a', conf: "Nobody bothers you when you're doing a puzzle. It's the best part of the day." },
  ] },
  { id: 'it.me7', when: { register: 'schemer' }, turns: [
    { beat: '{a} times {a.ref} solving the same knot puzzle, over and over.' },
    { by: 'a', conf: "Brains win more games than muscles. The muscles just haven't figured that out yet." },
  ] },
  { id: 'it.me8', turns: [
    { beat: '{a} counts the stripes on a shell, closes {a.posAdj} eyes, and counts them again from memory.' },
    { by: 'a', say: "Fourteen. No. Fifteen. It's fifteen." },
    { by: 'a', conf: "It's a boring way to spend a morning. It's also how you win a memory challenge." },
  ] },
];
const STRATEGIC = [
  { id: 'it.st1', turns: [
    { beat: "{a} scratches every vote of the season into the sand: who voted, for who, when." },
    { by: 'a', say: "And that's where it turned. Right there." },
    { by: 'a', conf: "The game's still going without me. When I get back, I'm walking in already knowing the map." },
  ] },
  { id: 'it.st2', turns: [
    { beat: '{a} talks through the alliances out loud, moving pebbles around like chess pieces.' },
    { by: 'a', say: "If these two are together, this one's on the outside. So this one needs me." },
    { by: 'a', conf: "I'm not just training to get back in. I'm planning what I do the minute I get there." },
  ] },
  { id: 'it.st3', when: { sly: true }, turns: [
    { beat: "{a} has drawn a map of the old camp in the sand: who sleeps where, who talks to who." },
    { by: 'a', say: "And they never once checked who was watching them." },
    { by: 'a', conf: "I lost one vote. I didn't lose my head. I'm going back with a plan for every person in there." },
  ] },
  { id: 'it.st4', when: { register: 'schemer' }, turns: [
    { beat: '{a} practises a pitch out loud, trying different faces with it.' },
    { by: 'a', say: "I'm only back to help you. No. I'm back because you need me. Better." },
    { by: 'a', conf: "The return challenge gets me in the door. The lies keep me there." },
  ] },
  { id: 'it.st5', when: { arch: 'mastermind' }, turns: [
    { beat: '{a} sits completely still, eyes closed, lips moving slightly.' },
    { by: 'a', conf: "I'm playing out every vote from here to the end. In every version, I win. Now I just have to get back in." },
  ] },
  { id: 'it.st6', when: { age: 'older' }, turns: [
    { beat: '{a} goes over every vote of the season, slowly, counting on {a.posAdj} fingers.' },
    { by: 'a', conf: "Young players play fast. I play long. Out here, I've got all the time in the world to think." },
  ] },
  { id: 'it.st7', when: { register: 'plain' }, turns: [
    { beat: '{a} writes names in the sand, then wipes them out with {a.posAdj} foot, then writes them again.' },
    { by: 'a', say: "Nope. That's not it either." },
    { by: 'a', conf: "I don't know what I'll walk back into. I'm trying to guess every version." },
  ] },
  { id: 'it.st8', turns: [
    { beat: '{a} walks up and down the beach, muttering names and numbers to {a.ref}.' },
    { by: 'a', say: "Five on that side, four on this side. Somebody's the swing." },
    { by: 'a', conf: "Everyone in the game forgot about me. That's the best thing that could've happened." },
  ] },
];
const BOLDNESS = [
  { id: 'it.bo1', turns: [
    { beat: '{a} stands on the edge of the rocks above the deep water, looking down.' },
    { by: 'a', say: "One. Two." },
    { beat: '{a} jumps. A long moment later: a splash, and a whoop.' },
    { by: 'a', conf: "Heights scare me. That's exactly why I jumped." },
  ] },
  { id: 'it.bo2', turns: [
    { beat: '{a} sticks a hand into a dark hole in the rocks, very slowly.' },
    { by: 'a', say: "Please be empty. Please be empty." },
    { by: 'a', conf: "Every challenge in this game has something gross or scary in it. I'm getting used to scary." },
  ] },
  { id: 'it.bo3', when: { bold: true }, turns: [
    { beat: '{a} grabs a crab bare-handed and holds it up like a trophy.' },
    { by: 'a', say: "Who's scared now, buddy?" },
    { by: 'a', conf: "Fear's a choice. I keep choosing not to." },
  ] },
  { id: 'it.bo4', when: { bold: false }, turns: [
    { beat: '{a} stands at the edge of the cliff for a very long time. Then steps back.' },
    { by: 'a', say: "Tomorrow. Tomorrow I jump." },
    { by: 'a', conf: "I got one step closer than yesterday. That counts. That has to count." },
  ] },
  { id: 'it.bo5', when: { arch: 'chaos-agent' }, turns: [
    { beat: '{a} cannonballs off the rocks into the water, screaming the whole way down.' },
    { by: 'a', say: "AGAIN! I'M DOING IT AGAIN!" },
    { by: 'a', conf: "Is it training? Kind of. Is it mostly fun? Yes." },
  ] },
  { id: 'it.bo6', when: { age: 'older' }, turns: [
    { beat: '{a} climbs the rocks carefully, then jumps feet first into the water.' },
    { by: 'a', conf: "My family would kill me if they saw that. Which is part of why I did it." },
  ] },
  { id: 'it.bo7', when: { register: 'fiery' }, turns: [
    { beat: '{a} walks straight into the waves until one knocks {a.obj} over. {a} gets up and walks right back in.' },
    { by: 'a', say: "Is that all you've got, ocean?" },
    { by: 'a', conf: "I'm picking fights with the ocean now. Nobody else is around." },
  ] },
  { id: 'it.bo8', turns: [
    { beat: '{a} wades out past where it is safe to stand and swims back against the current.' },
    { by: 'a', say: "Okay. That was scarier than it looked." },
    { by: 'a', conf: "The scary challenges are the ones people quit. I don't want to be one of the people who quit." },
  ] },
];
const INTUITION = [
  { id: 'it.in1', turns: [
    { beat: '{a} sits by the fire, watching the others without seeming to.' },
    { by: 'a', conf: "You can tell who's lying by their hands. Every single person out here touches their face when they lie." },
  ] },
  { id: 'it.in2', turns: [
    { beat: '{a} keeps glancing at the others while they talk, then looking away.' },
    { by: 'a', say: "Hm." },
    { by: 'a', conf: "I didn't see my own vote coming. I'm never letting that happen again. So I watch." },
  ] },
  { id: 'it.in3', when: { sharp: true }, turns: [
    { beat: '{a} watches two of the others whisper by the water, and says the words before they do.' },
    { by: 'a', conf: "Out here there's nothing to do but watch people. I've gotten scary good at it." },
  ] },
  { id: 'it.in4', when: { sharp: false }, turns: [
    { beat: '{a} stares very hard at someone across the camp, trying to read them.' },
    { by: 'a', say: "Are they sad or just hungry? Could be both." },
    { by: 'a', conf: "I missed every sign in the game. I'm practising. It's harder than it looks." },
  ] },
  { id: 'it.in5', when: { register: 'cool' }, turns: [
    { beat: '{a} sits apart from the group, listening to everything.' },
    { by: 'a', conf: "Everyone thinks I'm zoning out. I'm learning who cracks first when they're hungry." },
  ] },
  { id: 'it.in6', when: { arch: 'perceptive-player' }, turns: [
    { beat: "{a} guesses what's for dinner from the way everyone's walking back from the water." },
    { by: 'a', say: "Fish. And somebody didn't catch any." },
    { by: 'a', conf: "If I can read people this well out here, imagine what I'll do with them back in the game." },
  ] },
  { id: 'it.in7', turns: [
    { beat: '{a} listens to two of the others argue and quietly counts how often each one looks away.' },
    { by: 'a', conf: "Whoever looks away first is the one lying. Ninety percent of the time. I've been keeping score." },
  ] },
];
const SOCIAL = [
  { id: 'it.so1', turns: [
    { beat: '{a} practises a speech to an imaginary jury, out loud, to the ocean.' },
    { by: 'a', say: "I played with heart. And strategy. Mostly heart. No. Strategy with heart." },
    { by: 'a', conf: "If I get back in, I need people to like me fast. So I'm practising being likeable. To a rock." },
  ] },
  { id: 'it.so2', turns: [
    { beat: '{a} is having a full conversation with a coconut with a face drawn on it.' },
    { by: 'a', say: "And how are you holding up? Really? Tell me more." },
    { by: 'a', conf: "I'm practising listening. It's the part I'm bad at." },
  ] },
  { id: 'it.so3', when: { charm: true }, turns: [
    { beat: '{a} rehearses walking back into camp: the smile, the wave, the first line.' },
    { by: 'a', say: "Hey, everybody. Miss me?" },
    { by: 'a', conf: "People like me. That's my weapon. I just have to remind them in the first five minutes." },
  ] },
  { id: 'it.so4', when: { charm: false }, turns: [
    { beat: '{a} tries smiling at {a.posAdj} reflection in a puddle.' },
    { by: 'a', say: "Hi! No. Too much. Hi. Too little." },
    { by: 'a', conf: "I got voted out for being hard to read. So I'm learning to smile. It's going badly." },
  ] },
  { id: 'it.so5', when: { register: 'sweet' }, turns: [
    { beat: '{a} writes little notes in the sand: things to say to people back in the game.' },
    { by: 'a', conf: "When I go back, I want to say sorry to some people. And thank you to others. I'm practising both." },
  ] },
  { id: 'it.so6', when: { age: 'teen' }, turns: [
    { beat: '{a} practises a speech and keeps cracking up halfway through.' },
    { by: 'a', say: "Members of the jury. No. Ha! I can't." },
    { by: 'a', conf: "Talking to adults about strategy is hard. Talking to a coconut about it is easier. That's progress." },
  ] },
  { id: 'it.so7', turns: [
    { beat: '{a} walks around camp asking everyone how they slept, and listening to every answer.' },
    { by: 'a', conf: "In the game I talked too much. Out here I'm learning to ask questions. People love questions about themselves." },
  ] },
];
const TEMPERAMENT = [
  { id: 'it.te1', turns: [
    { beat: '{a} sits by the water with {a.posAdj} eyes closed, breathing slowly, while the flies bite.' },
    { by: 'a', say: "In. Out. Don't swat. Don't swat." },
    { by: 'a', conf: "If I lose my temper in the return, I lose the return. So I practise not losing it." },
  ] },
  { id: 'it.te2', turns: [
    { beat: '{a} counts out loud every time something on the island annoys {a.obj}. {a} counts a lot.' },
    { by: 'a', say: "Forty-eight. Forty-nine. Fifty." },
    { by: 'a', conf: "Out here, everything is annoying. That makes it the perfect place to practise patience." },
  ] },
  { id: 'it.te3', when: { hot: true }, turns: [
    { beat: '{a} is trying to meditate. A bird lands nearby and screeches. {a.PosAdj} eye twitches.' },
    { by: 'a', say: "I am calm. I am so calm. I am the calmest person alive." },
    { by: 'a', conf: "My temper's the reason I'm out here. So the temper and I are having a little talk." },
  ] },
  { id: 'it.te4', when: { calm: true }, turns: [
    { beat: '{a} sits completely still while the others argue about the fire.' },
    { by: 'a', conf: "Everybody's falling apart out here. I'm getting calmer. When the return comes, calm wins." },
  ] },
  { id: 'it.te5', when: { register: 'fiery' }, turns: [
    { beat: "{a} hums loudly with {a.posAdj} fingers in {a.posAdj} ears while somebody complains about the food." },
    { by: 'a', conf: "This is called coping. It's new for me. I hate it. It works." },
  ] },
  { id: 'it.te6', when: { age: 'older' }, turns: [
    { beat: '{a} sits watching the tide, completely relaxed.' },
    { by: 'a', conf: "The young ones out here burn hot and burn out. I've learned to pace myself. Took me forty years." },
  ] },
  { id: 'it.te7', turns: [
    { beat: "Somebody steps on {a}'s foot. {a} closes {a.posAdj} eyes and breathes before saying anything." },
    { by: 'a', say: "It's fine. It's totally fine." },
    { by: 'a', conf: "A week ago I'd have screamed. Look at me now. Growth." },
  ] },
];
const LOYALTY = [
  { id: 'it.lo1', turns: [
    { beat: "{a} gets up early every day to fetch water for everyone, even the people {a} doesn't like." },
    { by: 'a', conf: "A promise is a promise. I said I'd do the water. I do the water." },
  ] },
  { id: 'it.lo2', turns: [
    { beat: '{a} runs the beach beside whoever wants to come, slowing down when they slow down.' },
    { by: 'a', conf: "I'm training. I'm also making sure nobody out here trains alone. Both matter." },
  ] },
  { id: 'it.lo3', when: { loyal: true }, turns: [
    { beat: '{a} keeps a promise to train every morning, even in the rain.' },
    { by: 'a', say: "Said I would. So I am." },
    { by: 'a', conf: "I keep my word. Even to myself. Especially to myself." },
  ] },
  { id: 'it.lo4', when: { register: 'sweet' }, turns: [
    { beat: '{a} helps with every single chore around camp without being asked.' },
    { by: 'a', conf: "When I get back, I want people to say I was the one they could count on. So I'm being that person now." },
  ] },
  { id: 'it.lo5', turns: [
    { beat: '{a} drills fire-making until the sun goes down, then keeps the fire going for everyone else.' },
    { by: 'a', conf: "I'm getting ready for the return. And I'm making sure everybody out here eats. I can do both." },
  ] },
  { id: 'it.lo6', when: { arch: 'loyal-soldier' }, turns: [
    { beat: '{a} sets up a training schedule for the whole island and sticks to it alone when nobody else does.' },
    { by: 'a', conf: "Discipline is loyalty to yourself. Somebody told me that once. I believe it." },
  ] },
];
const ANY = [
  { id: 'it.an1', turns: [
    { beat: '{a} trains through lunch, through the heat, and through the others telling {a.obj} to take a break.' },
    { by: 'a', say: "Break when I'm back in." },
    { by: 'a', conf: "The others think I'm crazy. That's fine. Crazy gets back in the game." },
  ] },
  { id: 'it.an2', turns: [
    { beat: '{a} finishes a long session and drops flat on the sand.' },
    { by: 'a', say: "Okay. Okay. That's enough for today. Maybe." },
    { by: 'a', conf: "I don't know what the return is. So I'm training like it could be anything." },
  ] },
  { id: 'it.an3', turns: [
    { beat: '{a} is training alone at the far end of the beach, where nobody can see {a.obj} fail.' },
    { by: 'a', conf: "I don't want anyone out here to know what I'm good at. Or what I'm bad at." },
  ] },
  { id: 'it.an4', when: { register: 'competitor' }, turns: [
    { beat: '{a} trains in sets, with a stick and the sun for a timer.' },
    { by: 'a', say: "Faster than yesterday. Again." },
    { by: 'a', conf: "Everybody out here wants back in. I want it more. I'm going to prove it with my body." },
  ] },
  { id: 'it.an5', when: { register: 'sweet' }, turns: [
    { beat: '{a} trains quietly, smiling at small wins.' },
    { by: 'a', say: "Look at that! I did it!" },
    { by: 'a', conf: "I'm not the best at anything out here. I'm a little better every day. That's enough for me." },
  ] },
  { id: 'it.an6', when: { arch: 'villain' }, turns: [
    { beat: '{a} trains where the others can see, making it look easy.' },
    { by: 'a', conf: "Half of training is letting everybody else watch you do it. Scared people make mistakes." },
  ] },
  { id: 'it.an7', when: { arch: 'underdog' }, turns: [
    { beat: '{a} keeps going long after the others have stopped for the day.' },
    { by: 'a', conf: "Nobody ever thinks I'm the one who'll make it. Every time, I make them wrong. Let's do it again." },
  ] },
  { id: 'it.an8', when: { age: 'twenties' }, turns: [
    { beat: '{a} trains hard all morning, then collapses in the shade.' },
    { by: 'a', conf: "I'm in the best shape of my life and I'm living on rice. I don't understand bodies." },
  ] },
];

const INJURY_BODY = [
  { id: 'it.ib1', turns: [
    { beat: "{a} lands wrong mid-sprint. {a.PosAdj} ankle rolls and {a} goes down hard." },
    { by: 'a', say: "Ow. Ow ow ow. Okay. That's bad." },
    { by: 'a', conf: "I pushed too hard. I knew I was pushing too hard. I did it anyway." },
  ] },
  { id: 'it.ib2', turns: [
    { beat: "{a}'s shoulder makes a noise it should not make, halfway through a climb." },
    { by: 'a', say: "Nope. Not happening. Not right now." },
    { by: 'a', conf: "One bad day. I can come back from one bad day. I've come back from worse." },
  ] },
  { id: 'it.ib3', when: { register: 'fiery' }, turns: [
    { beat: '{a} slips off the rocks and scrapes a whole leg open. {a} limps back to camp swearing.' },
    { by: 'a', say: "Stupid rocks! Stupid me!" },
    { by: 'a', conf: "I'm not mad at the island. I'm mad at me." },
  ] },
  { id: 'it.ib4', when: { register: 'competitor' }, turns: [
    { beat: "{a} keeps training after {a.posAdj} wrist starts hurting. Then {a.posAdj} hand won't close." },
    { by: 'a', say: "It's nothing. Shake it off." },
    { by: 'a', conf: "Pain is just information. Right now the information is: stop. I hate that." },
  ] },
  { id: 'it.ib5', when: { age: 'older' }, turns: [
    { beat: '{a} bends to lift a log and freezes halfway, one hand on {a.posAdj} back.' },
    { by: 'a', say: "Oh. Oh, that's my back. Hello, back." },
    { by: 'a', conf: "Twenty years ago I'd have walked that off. Today I'm walking it off very, very slowly." },
  ] },
  { id: 'it.ib6', when: { register: 'shy' }, turns: [
    { beat: '{a} lands badly after a jump and sits there quietly, rubbing {a.posAdj} knee.' },
    { by: 'a', conf: "I didn't even yell. I just sat there and thought: of course. Of course this happened." },
  ] },
  { id: 'it.ib7', turns: [
    { beat: '{a} limps back from training, holding {a.posAdj} side.' },
    { by: 'a', say: "I'm fine. I'm totally fine." },
    { beat: '{a} is not totally fine.' },
    { by: 'a', conf: "Worst possible time to get hurt. Which is every time, out here." },
  ] },
];
const INJURY_HEAD = [
  { id: 'it.ih1', turns: [
    { beat: '{a} spends so long working on puzzles in the sun that the world spins on the way up.' },
    { by: 'a', say: "Whoa. Whoa. Why are there two oceans?" },
    { by: 'a', conf: "Sunstroke. From a puzzle. I didn't know you could get hurt thinking." },
  ] },
  { id: 'it.ih2', turns: [
    { beat: "A stone tower {a} has been building all morning falls over, right onto {a.posAdj} foot." },
    { by: 'a', say: "Ah! My toe! My whole morning!" },
    { by: 'a', conf: "Today I lost a fight with a pile of rocks. I built the rocks. That's the worst part." },
  ] },
  { id: 'it.ih3', turns: [
    { beat: '{a} has been staring at the vote lines in the sand for so long that {a.posAdj} head is pounding.' },
    { by: 'a', say: "Too much. That's too much thinking." },
    { by: 'a', conf: "I wasted a whole day overthinking. My brain needs a nap. I need a nap." },
  ] },
  { id: 'it.ih4', when: { register: 'fiery' }, turns: [
    { beat: '{a} kicks a puzzle that will not come together. The puzzle is made of rocks.' },
    { by: 'a', say: "OW! WHY ARE YOU ROCKS?" },
    { by: 'a', conf: "Lesson learned. Don't kick the rock puzzle." },
  ] },
  { id: 'it.ih5', turns: [
    { beat: "{a} sat in the sun practising all day and forgot to drink. Now {a.sub} can't get up." },
    { by: 'a', say: "Can someone bring water? Or a doctor? Or water?" },
    { by: 'a', conf: "I was so focused on getting better that I forgot to stay alive. Rookie mistake." },
  ] },
  { id: 'it.ih6', when: { register: 'cool' }, turns: [
    { beat: '{a} trains for hours without a break, then goes completely pale.' },
    { by: 'a', conf: "I told everybody else to pace themselves. I didn't. I hate when I'm the one who's wrong." },
  ] },
];

export default {
  'isle.train.physical': PHYSICAL, 'isle.train.endurance': ENDURANCE, 'isle.train.mental': MENTAL, 'isle.train.strategic': STRATEGIC,
  'isle.train.boldness': BOLDNESS, 'isle.train.intuition': INTUITION, 'isle.train.social': SOCIAL, 'isle.train.temperament': TEMPERAMENT,
  'isle.train.loyalty': LOYALTY, 'isle.train.any': ANY,
  'isle.injury.body': INJURY_BODY, 'isle.injury.head': INJURY_HEAD,
};
