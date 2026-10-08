// ══════════════════════════════════════════════════════════════════════
// td/script/lines/isle.js — life on the islands: Redemption Island and Rescue Island
// ══════════════════════════════════════════════════════════════════════
//
// The voted-out who are still in the game (js/rescue-island.js decides every moment:
// who trains, who breaks, who fights, who makes a pact; js/td/script/island.js turns
// the decision into a scene). Everyone here was voted out; they all want back in.
//
// {isle}   'Redemption Island' or 'Rescue Island' (always there).
// {drill}  what the training is, as an activity ('sprints up and down the sand').
// {streak} duels won in a row, as a word.            (isle.mind.hard, isle.pair.fear)
// {target} the person who wrote their name.          (isle.fixate.target)
// {enemy}  the one who voted both of them out.       (isle.plot.enemy)
// intent   'duel' (Redemption: they fight each other for the spot) or 'return'
//          (Rescue: one return challenge brings someone back). A line that names
//          the duel or the return challenge asks for its intent.
// Ids: 'is.'.
//
// The voice is the camp's (spec §5.1): something to do under the scene, a real
// reason, pushback, attitude, and a confessional that lands one thought.
const DUEL = { intent: 'duel' }, BACK = { intent: 'return' };

// ── alone ─────────────────────────────────────────────────────────────
const ALONE_VOTE = [
  { id: 'is.v1', turns: [
    { beat: '{a} is drawing in the sand with a stick: names, arrows, crossed-out names.' },
    { by: 'a', say: "If they voted with me, I'm still there. If they voted with me." },
    { by: 'a', conf: "I keep running the vote back like it's going to come out different. It never does." },
  ] },
  { id: 'is.v2', turns: [
    { beat: '{a} sits with {a.posAdj} knees pulled up, talking quietly to nobody.' },
    { by: 'a', say: "Okay. Who told who. Start at the beginning." },
    { by: 'a', say: "No. They knew before lunch. They had to have known before lunch." },
    { by: 'a', conf: "Somebody I trusted wrote my name down. I'd love to know which face they made while they did it." },
  ] },
  { id: 'is.v3', when: { register: 'fiery' }, turns: [
    { beat: '{a} throws a rock into the water. Then another one. Harder.' },
    { by: 'a', say: "Unbelievable. Un-be-lievable." },
    { by: 'a', conf: "I'm not sad. I'm angry. Sad is for people who are done, and I am not done." },
  ] },
  { id: 'is.v4', when: { register: 'schemer' }, turns: [
    { beat: '{a} lines up shells on a log, one for each person still in the game.' },
    { by: 'a', say: "This one flipped. This one followed. This one never had an idea in their life." },
    { by: 'a', conf: "Getting voted out is just information. Now I know exactly who to go after when I'm back." },
  ] },
  { id: 'is.v5', when: { register: 'sweet' }, turns: [
    { beat: '{a} is picking at the frayed edge of {a.posAdj} sleeve.' },
    { by: 'a', say: "I really thought they liked me. I thought we were friends." },
    { by: 'a', conf: "I keep telling myself it's just a game. It still hurts like it wasn't." },
  ] },
  { id: 'is.v6', turns: [
    { beat: '{a} is counting on {a.posAdj} fingers and keeps losing count.' },
    { by: 'a', say: "Four votes. Where did four votes come from?" },
    { by: 'a', conf: "I didn't see it coming. That's the part that bugs me the most. I'm supposed to see it coming." },
  ] },
  { id: 'is.v7', when: { register: 'shy' }, turns: [
    { by: 'a', say: "Should've said more. Should've talked to people." },
    { beat: '{a} stares out at the water for a long time.' },
    { by: 'a', conf: "I stayed quiet so nobody would notice me. Turns out that's how you get noticed." },
  ] },
  { id: 'is.v8', when: { register: 'competitor' }, turns: [
    { beat: '{a} does push-ups while muttering between reps.' },
    { by: 'a', say: "Voted out. Me. With everything I did in those challenges." },
    { by: 'a', conf: "They got rid of the strongest player because they were scared. Fine. Be scared." },
  ] },
];

const ALONE_STEADY = [
  { id: 'is.s1', turns: [
    { beat: 'The sun is going down. {a} sits on a log, watching it.' },
    { by: 'a', say: "Okay. That's actually really nice." },
    { by: 'a', conf: "First time out here I didn't think about the vote for a whole minute. I'll take it." },
  ] },
  { id: 'is.s2', turns: [
    { beat: '{a} walks along the edge of the water, letting it wash over {a.posAdj} feet.' },
    { by: 'a', conf: "You can't stay angry all day. It's exhausting. I need that energy for getting back in." },
  ] },
  { id: 'is.s3', turns: [
    { beat: '{a} had a bad morning. Now {a} splashes water on {a.posAdj} face and takes a long breath.' },
    { by: 'a', say: "Okay. Okay. You're fine." },
    { by: 'a', conf: "I had a moment. It's over. I'm still here, and that's what matters." },
  ] },
  { id: 'is.s4', when: { register: 'cool' }, turns: [
    { beat: '{a} is lying flat on the sand, eyes closed.' },
    { by: 'a', conf: "Everybody thinks this place breaks you. It only breaks you if you let it run your head." },
    { by: 'a', say: "Not today." },
  ] },
  { id: 'is.s5', when: { register: 'sweet' }, turns: [
    { beat: '{a} is humming to {a.ref} while braiding some long grass.' },
    { by: 'a', conf: "Somebody told me once: you can't control what happens, only what you do next. So I'm doing next." },
  ] },
  { id: 'is.s6', turns: [
    { beat: '{a} sits still for a long time, then nods to {a.ref}.' },
    { by: 'a', say: "I stopped replaying it. It's done." },
    { by: 'a', conf: "I can't change the vote. I can change whether I'm ready when my chance comes." },
  ] },
  { id: 'is.s7', when: { register: 'fiery' }, turns: [
    { beat: '{a} kicks off {a.posAdj} shoes and walks into the water up to {a.posAdj} knees.' },
    { by: 'a', say: "That's cold. That's so cold. Okay, that's good." },
    { by: 'a', conf: "I've been yelling at the ocean for two days. Today I'm just standing in it. Progress." },
  ] },
];

const ALONE_GRIND = [
  { id: 'is.g1', turns: [
    { beat: "It's barely light out. {a} is already up, doing lunges in the sand." },
    { by: 'a', say: "Twenty more. Come on." },
    { by: 'a', conf: "Everyone else here is asleep. That's the difference between me and them." },
  ] },
  { id: 'is.g2', turns: [
    { beat: '{a} scratches another line into a piece of driftwood with a sharp stone.' },
    { by: 'a', say: "Another day." },
    { by: 'a', conf: "I'm keeping count. When I get back in, I want them to know how long I waited." },
  ] },
  { id: 'is.g3', when: DUEL, turns: [
    { beat: '{a} practices tying knots, again and again, faster each time.' },
    { by: 'a', say: "Under ten seconds. Under ten." },
    { by: 'a', conf: "The duel could be anything. So I'm getting good at everything." },
  ] },
  { id: 'is.g4', when: BACK, turns: [
    { beat: '{a} runs the length of the beach and back, then checks the sun.' },
    { by: 'a', say: "Faster than yesterday." },
    { by: 'a', conf: "One challenge decides who goes back. I'm going to be the one who wanted it most." },
  ] },
  { id: 'is.g5', when: { register: 'competitor' }, turns: [
    { beat: '{a} is doing pull-ups on a low branch, counting out loud.' },
    { by: 'a', say: "Forty-one. Forty-two." },
    { by: 'a', conf: "Out here there's no one to impress. I'm doing it anyway. That's how you know you mean it." },
  ] },
  { id: 'is.g6', turns: [
    { beat: '{a} is up before the birds, stretching by the cold fire.' },
    { by: 'a', conf: "Every morning I tell myself the same thing: today could be the day I get back in. So get up." },
  ] },
  { id: 'is.g7', when: { register: 'shy' }, turns: [
    { beat: '{a} practices a speech under {a.posAdj} breath.' },
    { by: 'a', say: "Hi. I'm back. And I'd like to work with you. No. That's terrible." },
    { by: 'a', conf: "If I get back in, I have to actually talk to people. So I'm practising. On a crab." },
  ] },
];

const REST = [
  { id: 'is.r1', turns: [
    { beat: '{a} lies in the shade with an arm over {a.posAdj} eyes and does not move for hours.' },
    { by: 'a', conf: "Rest is training too. That's what I'm telling myself. It's also true." },
  ] },
  { id: 'is.r2', turns: [
    { beat: '{a} wraps {a.posAdj} sore knee with a strip of torn shirt and lies back down.' },
    { by: 'a', say: "Not today. Tomorrow." },
    { by: 'a', conf: "If I train like this I'll break. If I break, I'm done. So today I sleep." },
  ] },
  { id: 'is.r3', when: { register: 'competitor' }, turns: [
    { beat: '{a} is lying down and clearly hating it. {a.PosAdj} foot keeps tapping.' },
    { by: 'a', conf: "Resting is the hardest workout there is. I would rather run ten miles." },
  ] },
  { id: 'is.r4', turns: [
    { beat: '{a} naps through the heat of the day, curled up in the shade.' },
    { by: 'a', say: "Five more minutes." },
    { by: 'a', conf: "Out here, sleep is the only thing nobody can take from you." },
  ] },
  { id: 'is.r5', when: { register: 'sweet' }, turns: [
    { beat: '{a} soaks {a.posAdj} blistered feet in the water and sighs.' },
    { by: 'a', say: "Oh, that's so much better." },
    { by: 'a', conf: "I'm being nice to my body today. It's been through a lot." },
  ] },
  { id: 'is.r6', when: { register: 'cool' }, turns: [
    { beat: '{a} sits against a tree, eyes half-closed, watching the others train.' },
    { by: 'a', conf: "They're wearing themselves out. Fine by me. I'll be the one with legs left when it matters." },
  ] },
];

// ── the mind ──────────────────────────────────────────────────────────
const MIND_BROKEN = [
  { id: 'is.b1', turns: [
    { beat: "It's dark. {a} sits by the dying fire with {a.posAdj} face in {a.posAdj} hands." },
    { by: 'a', say: "I can't do this. I can't." },
    { by: 'a', conf: "I thought I was tough. It's the quiet. Nobody tells you how loud the quiet gets." },
  ] },
  { id: 'is.b2', turns: [
    { beat: "{a} hasn't eaten all day. Just sitting, staring at the water." },
    { by: 'a', conf: "I keep thinking about home. My bed. My dog. Real food. I'm so tired." },
  ] },
  { id: 'is.b3', when: { register: 'fiery' }, turns: [
    { beat: '{a} kicks the firewood pile over, then sits down in the middle of it.' },
    { by: 'a', say: "What is the point? Seriously. What is the point?" },
    { by: 'a', conf: "I'm not crying. Fine. I'm crying a little." },
  ] },
  { id: 'is.b4', turns: [
    { beat: '{a} is curled up in the shelter in the middle of the afternoon.' },
    { by: 'a', say: "Just leave me alone for a bit. Please." },
    { by: 'a', conf: "It all hit me at once. The vote, the hunger, being by myself. All of it." },
  ] },
  { id: 'is.b5', when: { register: 'sweet' }, turns: [
    { beat: '{a} is crying quietly, trying not to make any noise.' },
    { by: 'a', conf: "I miss my family so much. I didn't think I would this soon. I'm sorry. Give me a second." },
  ] },
  { id: 'is.b6', when: { register: 'schemer' }, turns: [
    { beat: "{a} sits alone, picking a leaf apart piece by piece. {a.PosAdj} hands won't stop shaking." },
    { by: 'a', conf: "I always have a plan. Right now I have nothing. I hate not having a plan." },
  ] },
];
const MIND_HARD = [
  { id: 'is.d1', turns: [
    { beat: "{a} sharpens a stick by the fire, slow and steady. Not one smile all day." },
    { by: 'a', conf: "{Streak} wins. Every one of them took something out of me. What's left doesn't scare easy." },
  ] },
  { id: 'is.d2', turns: [
    { beat: '{a} walks past the others without a word and starts training.' },
    { by: 'a', conf: "I used to get nervous. {Streak} times in, I don't anymore. I just do the work." },
  ] },
  { id: 'is.d3', when: { register: 'fiery' }, turns: [
    { beat: '{a} cracks {a.posAdj} knuckles and stares at the horizon.' },
    { by: 'a', say: "Bring it. Whoever's next. Bring it." },
    { by: 'a', conf: "{Streak} wins. Nobody out here wants it more than I do, and everybody knows it." },
  ] },
  { id: 'is.d4', when: { register: 'cool' }, turns: [
    { beat: '{a} sits apart from the others, eating slowly.' },
    { by: 'a', conf: "I don't celebrate anymore. {Streak} wins and I've learned that the next one is the only one that counts." },
  ] },
  { id: 'is.d5', turns: [
    { beat: '{a} wraps {a.posAdj} hands and starts drilling, same as yesterday, same as every day.' },
    { by: 'a', say: "Again." },
    { by: 'a', conf: "When I got here I was scared. {Streak} wins later, the fear's gone. I'm not sure that's a good thing." },
  ] },
  { id: 'is.d6', when: { register: 'sweet' }, turns: [
    { beat: "{a} sits by the fire, quieter than {a.sub} used to be." },
    { by: 'a', conf: "I used to apologise after I won. I've won {streak} times now. I've stopped apologising." },
  ] },
];
const FIXATE_TARGET = [
  { id: 'is.f1', turns: [
    { beat: '{a} has scratched a name into the shelter wall: {target}.' },
    { by: 'a', say: "Every day. Every single day, I'm going to look at that." },
    { by: 'a', conf: "{target} put me here. When I get back in, {target} is the first one out. That's the only plan." },
  ] },
  { id: 'is.f2', turns: [
    { beat: '{a} is doing sit-ups, saying one word on every rep.' },
    { by: 'a', say: "{target}. {target}. {target}." },
    { by: 'a', conf: "Some people train for themselves. I'm training for the look on {target}'s face." },
  ] },
  { id: 'is.f3', when: { register: 'schemer' }, turns: [
    { beat: '{a} is drawing a plan in the sand, with {target} in the middle of it.' },
    { by: 'a', conf: "I don't need to beat everyone. I need to beat {target}. Everything else is details." },
  ] },
  { id: 'is.f4', turns: [
    { beat: '{a} talks about {target} at breakfast. And at lunch. And all afternoon.' },
    { by: 'a', say: "And another thing about {target}." },
    { by: 'a', conf: "Yes, I know I keep bringing it up. I'm going to keep bringing it up until I get my revenge." },
  ] },
  { id: 'is.f5', when: { register: 'fiery' }, turns: [
    { beat: '{a} throws a coconut at a tree, hard, then picks it up and does it again.' },
    { by: 'a', say: "That's you, {target}. That's you." },
    { by: 'a', conf: "I'm not letting it go. Letting it go is what got me voted out." },
  ] },
  { id: 'is.f6', turns: [
    { beat: "{a} can't sleep, and lies awake staring at the sky." },
    { by: 'a', conf: "Every time I close my eyes I see {target} reading my name. So I don't close my eyes." },
  ] },
];
const FIXATE_RETURN = [
  { id: 'is.x1', turns: [
    { beat: '{a} trains through lunch. And dinner. Nobody can get {a.obj} to stop.' },
    { by: 'a', conf: "Getting back in is all I think about. I dream about it. Literally. Last night I dreamed I won." },
  ] },
  { id: 'is.x2', when: BACK, turns: [
    { beat: '{a} is drawing the return challenge in the sand, guessing at what it could be.' },
    { by: 'a', say: "If it's a puzzle, I go left. If it's a race, I go right." },
    { by: 'a', conf: "One shot to get back in. I've planned for every version. Twice." },
  ] },
  { id: 'is.x3', when: DUEL, turns: [
    { beat: '{a} drills for the duel long after dark.' },
    { by: 'a', conf: "Every duel I win is one step back into the game. I'm not taking a day off. Not one." },
  ] },
  { id: 'is.x4', turns: [
    { beat: "{a} doesn't sleep. {a} sits up by the fire, going over and over the same moves." },
    { by: 'a', conf: "People think I've lost it. I haven't lost it. I've just stopped thinking about anything else." },
  ] },
  { id: 'is.x5', when: { register: 'competitor' }, turns: [
    { beat: '{a} has built a little obstacle course out of driftwood and runs it again and again.' },
    { by: 'a', say: "Faster. Faster!" },
    { by: 'a', conf: "I'm not here to make friends. I'm here to get back in. That's the only finish line." },
  ] },
  { id: 'is.x6', turns: [
    { beat: '{a} goes over {a.posAdj} comeback plan, out loud, for the third time today.' },
    { by: 'a', say: "Walk in, find who's on the bottom, make them an offer." },
    { by: 'a', conf: "I've got the whole thing planned. I just need someone to open the door." },
  ] },
];

// ── the body ──────────────────────────────────────────────────────────
const THRIVING = [
  { id: 'is.th1', turns: [
    { beat: '{a} jogs past the shelter, not even out of breath.' },
    { by: 'a', conf: "Honestly? I feel better out here than I did in the game. Less stress, more training." },
  ] },
  { id: 'is.th2', turns: [
    { beat: '{a} carries two big logs back to camp on {a.posAdj} shoulders, whistling.' },
    { by: 'a', conf: "They sent me out here to get rid of me. They're going to get back a stronger version." },
  ] },
  { id: 'is.th3', when: { register: 'competitor' }, turns: [
    { beat: '{a} flexes at {a.posAdj} reflection in a puddle.' },
    { by: 'a', say: "Look at that. Island strong." },
    { by: 'a', conf: "Everyone else is wasting away. I'm getting bigger. I don't know how either." },
  ] },
  { id: 'is.th4', turns: [
    { beat: '{a} climbs a palm, knocks down three coconuts and climbs back down like it was nothing.' },
    { by: 'a', say: "Lunch is served." },
    { by: 'a', conf: "I've figured this place out. It doesn't scare me anymore." },
  ] },
  { id: 'is.th5', when: { register: 'sweet' }, turns: [
    { beat: '{a} is smiling to {a.ref} while gathering firewood.' },
    { by: 'a', conf: "I know I'm supposed to be miserable out here. I'm actually kind of okay. Is that weird?" },
  ] },
  { id: 'is.th6', when: { register: 'cool' }, turns: [
    { beat: '{a} sits in the sun, calm, eating a fish {a.sub} caught.' },
    { by: 'a', conf: "This place breaks people who fight it. I stopped fighting it. Now it works for me." },
  ] },
];
const STRUGGLING = [
  { id: 'is.st1', turns: [
    { beat: '{a} pushes a handful of rice around a bowl and does not eat it.' },
    { by: 'a', say: "I'm not hungry." },
    { by: 'a', conf: "I am so hungry. I just can't look at another grain of rice." },
  ] },
  { id: 'is.st2', turns: [
    { beat: '{a} has to sit down halfway back from the water, out of breath.' },
    { by: 'a', conf: "My body's giving up before my head is. That's not how this was supposed to go." },
  ] },
  { id: 'is.st3', when: { register: 'fiery' }, turns: [
    { beat: '{a} tries to lift a log, fails, and drops it on purpose.' },
    { by: 'a', say: "Forget it. Forget the log." },
    { by: 'a', conf: "I'm weak. I hate saying that word about myself. But I'm weak right now." },
  ] },
  { id: 'is.st4', turns: [
    { beat: "{a}'s clothes are hanging off {a.obj}. {a} pulls {a.posAdj} belt in another notch." },
    { by: 'a', conf: "I've lost so much weight out here. I don't know how much longer I've got." },
  ] },
  { id: 'is.st5', when: { register: 'shy' }, turns: [
    { beat: '{a} sits shivering by the fire even though it is warm out.' },
    { by: 'a', conf: "I didn't want to say anything. I don't feel good. I haven't for days." },
  ] },
  { id: 'is.st6', when: { register: 'competitor' }, turns: [
    { beat: '{a} gets through five push-ups and collapses on the sixth.' },
    { by: 'a', say: "Five. I used to do fifty." },
    { by: 'a', conf: "Starving makes you slow. I need to eat or I'm not winning anything." },
  ] },
];

// ── helping out (the others are around) ───────────────────────────────
const HELP_FISH = [
  { id: 'is.hf1', turns: [
    { beat: '{a} wades back out of the water with a string of fish over {a.posAdj} shoulder.' },
    { by: 'a', say: "Dinner! Everybody eats!" },
    { by: 'a', conf: "If I feed people, people remember. That's not strategy. Okay, it's a little bit strategy." },
  ] },
  { id: 'is.hf2', turns: [
    { beat: "{a} has been standing in the water with a sharp stick for an hour. Then, finally, there's a splash." },
    { by: 'a', say: "Got one! I got one!" },
    { by: 'a', conf: "Four hours for six fish. Worth it. Everyone's eating today because of me." },
  ] },
  { id: 'is.hf3', when: { register: 'sweet' }, turns: [
    { beat: '{a} is cooking fish over the fire, handing out pieces to everyone.' },
    { by: 'a', say: "Careful, it's hot. There's enough for everyone." },
    { by: 'a', conf: "We're all in the same situation out here. The least I can do is make sure nobody goes hungry." },
  ] },
  { id: 'is.hf4', when: { register: 'schemer' }, turns: [
    { beat: '{a} drops a pile of fish by the fire, then sits back and watches everyone eat.' },
    { by: 'a', conf: "A full stomach makes a grateful voter. I'll be cashing these in later." },
  ] },
  { id: 'is.hf5', when: { register: 'competitor' }, turns: [
    { beat: '{a} comes back with more fish than anyone can carry.' },
    { by: 'a', say: "That's how it's done." },
    { by: 'a', conf: "Fishing is a challenge too. And I don't lose challenges." },
  ] },
  { id: 'is.hf6', turns: [
    { beat: '{a} rigs a trap out of sticks and vine. By the afternoon it is full.' },
    { by: 'a', say: "Who's hungry?" },
    { by: 'a', conf: "First real meal in days. I should've figured that trap out a week ago." },
  ] },
];
const HELP_SHELTER = [
  { id: 'is.hs7', turns: [
    { beat: '{a} props the sagging roof back up with a forked branch and ties it off.' },
    { by: 'a', say: "That should hold. Probably." },
    { by: 'a', conf: "I'm not winning anything sitting here. At least the roof isn't on my face anymore." },
  ] },
  { id: 'is.hs8', turns: [
    { beat: '{a} digs a little trench around the shelter so the rain runs off instead of in.' },
    { by: 'a', conf: "Last night the floor was a puddle. Not anymore. Small wins." },
  ] },
  { id: 'is.hs9', turns: [
    { beat: '{a} spends an hour stuffing dry leaves into the gaps in the walls.' },
    { by: 'a', say: "Warmer already. You're welcome." },
    { by: 'a', conf: "Keeping busy keeps me from thinking about how I got here." },
  ] },
  { id: 'is.hs1', turns: [
    { beat: '{a} spends the morning weaving palm fronds into a wall against the wind.' },
    { by: 'a', say: "There. Now we won't freeze." },
    { by: 'a', conf: "Nobody asked me to. But I was tired of being cold, and everyone else was too." },
  ] },
  { id: 'is.hs2', turns: [
    { beat: '{a} drags branches back to camp one after another and stacks them against the wind.' },
    { by: 'a', conf: "If you want people on your side, give them a reason. A windbreak is a pretty good reason." },
  ] },
  { id: 'is.hs3', when: { register: 'competitor' }, turns: [
    { beat: '{a} finishes the windbreak in an hour and stands back with {a.posAdj} hands on {a.posAdj} hips.' },
    { by: 'a', say: "You're welcome, everybody." },
    { by: 'a', conf: "It's basically a challenge. And I won it." },
  ] },
  { id: 'is.hs4', when: { register: 'sweet' }, turns: [
    { beat: '{a} quietly fixes the leaks in the roof while everyone else is asleep.' },
    { by: 'a', conf: "Nobody saw me do it. That's fine. It was dripping on all of us." },
  ] },
  { id: 'is.hs5', turns: [
    { beat: '{a} builds up the wall on the windy side, packing the gaps with leaves.' },
    { by: 'a', say: "Somebody hold this. No, the other end." },
    { by: 'a', conf: "First night out here, the wind went straight through me. Never again." },
  ] },
  { id: 'is.hs6', when: { register: 'schemer' }, turns: [
    { beat: '{a} builds a windbreak and makes sure everyone sees {a.obj} doing it.' },
    { by: 'a', conf: "Good deeds work best when there's an audience. I made sure there was an audience." },
  ] },
];

const QUIT = [
  { id: 'is.q1', turns: [
    { beat: '{a} stands at the edge of the water with {a.posAdj} bag over {a.posAdj} shoulder.' },
    { by: 'a', say: "I'm done. I'm going home." },
    { by: 'a', conf: "I left everything out here. There's nothing left to give. And that's okay." },
  ] },
  { id: 'is.q2', when: { register: 'fiery' }, turns: [
    { beat: '{a} raises the sail and throws {a.posAdj} bag in the boat.' },
    { by: 'a', say: "You know what? Keep it. Keep the whole thing." },
    { by: 'a', conf: "I'm not quitting the game. I'm quitting being miserable. Big difference." },
  ] },
  { id: 'is.q3', when: { register: 'sweet' }, turns: [
    { beat: "{a} hugs everyone goodbye. {a.PosAdj} eyes are wet." },
    { by: 'a', say: "Win it for me, okay? One of you has to win it." },
    { by: 'a', conf: "I'm choosing to be okay again. That's not giving up. That's taking care of myself." },
  ] },
  { id: 'is.q4', turns: [
    { beat: '{a} raises the sail without a word.' },
    { by: 'a', conf: "I thought I could outlast this place. I can't. I'd rather go home now than break completely." },
  ] },
  { id: 'is.q5', when: { register: 'schemer' }, turns: [
    { beat: '{a} raises the sail and looks back at the others one last time.' },
    { by: 'a', say: "Enjoy the sand. I'm going to go enjoy a bed." },
    { by: 'a', conf: "Losing to this place is not losing to them. I'm fine with that." },
  ] },
  { id: 'is.q6', turns: [
    { beat: '{a} raises the sail. The others gather to watch {a.obj} go.' },
    { by: 'a', say: "I gave it everything I had. I'm proud of that." },
    { by: 'a', conf: "Some people make it out of here back into the game. I'm making it out of here back to my life." },
  ] },
];

// ── two of them ───────────────────────────────────────────────────────
const HISTORY = [
  { id: 'is.p1', turns: [
    { beat: '{a} and {b} sit at opposite ends of the same log. Neither looks at the other.' },
    { by: 'a', say: "So. Fancy seeing you here." },
    { by: 'b', say: "Don't." },
    { by: 'a', conf: "We were on the same side once. Then the vote happened and now we're both out here. Awkward doesn't cover it." },
  ] },
  { id: 'is.p2', turns: [
    { by: 'a', say: "Funny how things work out, huh?" },
    { by: 'b', say: "I'm not laughing." },
    { by: 'a', say: "Yeah. Me neither." },
    { by: 'b', conf: "Same tribe, different side of the vote. Neither of us has forgotten." },
  ] },
  { id: 'is.p3', turns: [
    { beat: '{a} and {b} are both reaching for the same coconut.' },
    { by: 'b', say: "Go ahead. You always did get first pick." },
    { by: 'a', say: "Oh, we're doing this now?" },
    { by: 'b', say: "We're doing this now." },
    { by: 'a', conf: "We used to share a shelter. Now we share an island. And a grudge." },
  ] },
  { id: 'is.p4', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Remember when it was all of us at the fire? Feels like a year ago." },
    { by: 'b', say: "It was like a week ago." },
    { by: 'a', say: "Longest week of my life." },
    { by: 'b', conf: "I'm glad it's {a} out here and not somebody I can't stand. Small mercies." },
  ] },
  { id: 'is.p5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "So. Did you see it coming? Your vote, I mean." },
    { by: 'b', say: "Did you?" },
    { by: 'a', say: "I asked first." },
    { by: 'a', conf: "{b} knows things about the old tribe that I don't. I'm going to find out what." },
  ] },
  { id: 'is.p6', turns: [
    { beat: "{a} and {b} end up on fire duty together. It's quiet. Too quiet." },
    { by: 'a', say: "Pass me the stick." },
    { by: 'b', say: "Say please." },
    { by: 'a', say: "Please. Your highness." },
    { by: 'b', conf: "We were teammates for days and never really talked. Out here we can't avoid it." },
  ] },
];

const GRUDGE = [
  { id: 'is.gr1', when: { wrote: true }, turns: [
    { beat: "{a} blocks {b}'s path to the water." },
    { by: 'a', say: "You know what you did." },
    { by: 'b', say: "I did what I had to. You'd have done the same." },
    { by: 'a', say: "No. I wouldn't have." },
    { by: 'a', conf: "{b} thinks we're even now. We are not even." },
  ] },
  { id: 'is.gr2', when: { wrote: true }, turns: [
    { by: 'a', say: "I've been holding this in for days, so here it is." },
    { by: 'b', say: "Here we go." },
    { by: 'a', say: "You're the reason I'm here. You. Not the others." },
    { by: 'b', say: "And you're the reason I'm here. So what now?" },
    { by: 'b', conf: "{a} wants an apology. {a} is not getting one." },
  ] },
  { id: 'is.gr3', when: { register: 'fiery' }, turns: [
    { beat: '{a} storms over to {b} at the fire.' },
    { by: 'a', say: "Don't you dare act like we're fine!" },
    { by: 'b', say: "Nobody said we were fine." },
    { by: 'a', say: "Good. Because we're not. We're never going to be fine." },
    { by: 'a', conf: "Being stuck on the same island as {b} is a punishment on top of a punishment." },
  ] },
  { id: 'is.gr4', turns: [
    { beat: '{a} and {b} lock eyes across the camp. Nobody else breathes.' },
    { by: 'b', say: "Got something to say?" },
    { by: 'a', say: "Plenty. Not yet." },
    { by: 'b', conf: "{a} has been glaring at me since the moment I got here. Fine. Glare. I'm still here." },
  ] },
  { id: 'is.gr5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I hope you're comfortable. Because only one of us is getting out of here." },
    { by: 'b', say: "Is that a threat?" },
    { by: 'a', say: "It's math." },
    { by: 'a', conf: "I don't yell. I just make sure {b} knows I'm not going anywhere." },
  ] },
  { id: 'is.gr6', when: { wrote: true }, turns: [
    { by: 'b', say: "Are we really going to do this every day?" },
    { by: 'a', say: "As long as you keep pretending you didn't stab me in the back? Yeah." },
    { by: 'b', say: "It was a vote. It's a game." },
    { by: 'a', say: "Then it's a game where I remember." },
    { by: 'b', conf: "{a} brought the beef with {a.obj}. It hasn't cooled down one bit." },
  ] },
  { id: 'is.gr7', when: { register: 'sweet', wrote: true }, turns: [
    { by: 'a', say: "I just want to know why. That's all. Why me?" },
    { by: 'b', say: "It wasn't personal." },
    { by: 'a', say: "It felt personal." },
    { by: 'a', conf: "I'm trying to forgive {b}. I'm not there yet. Not even close." },
  ] },
  { id: 'is.gr8', turns: [
    { by: 'a', say: "Are you going to sit there all day?" },
    { by: 'b', say: "It's a free log." },
    { by: 'a', say: "It's my log. I found it." },
    { by: 'b', say: "You found a log. On an island. Covered in logs." },
    { by: 'a', conf: "{b} gets under my skin like nobody in the game ever did. And now there's no escape." },
  ] },
  { id: 'is.gr9', turns: [
    { beat: '{a} and {b} reach for the same fishing spear and neither lets go.' },
    { by: 'b', say: "Let go." },
    { by: 'a', say: "You let go." },
    { by: 'b', say: "I'm older. Or taller. Or something. Let go." },
    { beat: 'Neither of them lets go. The spear stays where it is for a long time.' },
    { by: 'b', conf: "We didn't like each other in the game. Out here it's worse. Out here there's nothing else to do." },
  ] },
];
const COLD = [
  { id: 'is.c1', turns: [
    { beat: '{a} and {b} eat on opposite sides of the fire. Nobody speaks.' },
    { by: 'a', conf: "I'm not talking to {b}. If I start, I won't stop, and it won't be nice." },
  ] },
  { id: 'is.c2', turns: [
    { beat: "{a} sits down in {b}'s usual spot by the fire. {b} sees it, stops, and sits somewhere else without a word." },
    { by: 'a', conf: "Petty? Yes. Did it feel amazing? Also yes." },
  ] },
  { id: 'is.c3', turns: [
    { beat: '{b} asks if anyone wants water. {a} gets up and fetches {a.posAdj} own.' },
    { by: 'b', say: "Wow. Okay." },
    { by: 'b', conf: "{a} would rather walk to the water than take a cup from me. That's where we're at." },
  ] },
  { id: 'is.c4', when: { register: 'schemer' }, turns: [
    { beat: '{a} talks to everyone at camp except {b}, loudly and cheerfully.' },
    { by: 'a', say: "Anyone want some of this fish? Anyone? Anyone at all?" },
    { by: 'b', conf: "{a} is freezing me out like it's a sport. Joke's on {a.obj}. I like the quiet." },
  ] },
  { id: 'is.c5', turns: [
    { beat: '{a} and {b} end up on wood duty together. They work for an hour without a single word.' },
    { by: 'b', conf: "It's the loudest silence I've ever heard." },
  ] },
  { id: 'is.c6', when: { register: 'fiery' }, turns: [
    { beat: '{b} walks past. {a} turns {a.posAdj} back on {b.obj}, very deliberately.' },
    { by: 'a', say: "Oh, is somebody there? I didn't notice." },
    { by: 'a', conf: "I'm being the bigger person. By ignoring {b} as hard as I possibly can." },
  ] },
];
const BLOWUP = [
  { id: 'is.bu1', when: { wrote: true }, turns: [
    { beat: "It starts over who let the fire go out. It doesn't stay about the fire." },
    { by: 'b', say: "You were on fire duty!" },
    { by: 'a', say: "And you were on 'not voting me out' duty! How'd that go?" },
    { by: 'b', say: "Are you serious right now?" },
    { by: 'a', say: "Dead serious!" },
    { beat: 'The others back away from the fire.' },
    { by: 'a', conf: "Days of holding it in. It all came out at once. I'm not sorry." },
  ] },
  { id: 'is.bu2', turns: [
    { by: 'b', say: "You've been eating more than your share. Everybody knows it." },
    { by: 'a', say: "Oh, so now I'm a thief? That's rich, coming from you!" },
    { by: 'b', say: "Don't point at me!" },
    { by: 'a', say: "I'll point at whoever I want!" },
    { by: 'b', conf: "We were always going to blow up. Today was the day." },
  ] },
  { id: 'is.bu3', when: { register: 'fiery' }, turns: [
    { beat: '{a} throws a coconut shell at the ground right by {b}\'s feet.' },
    { by: 'a', say: "I am SO sick of you!" },
    { by: 'b', say: "The feeling is mutual!" },
    { by: 'a', say: "Then stay on your side of the island!" },
    { by: 'a', conf: "I don't care who heard. I've been wanting to say that since we got here." },
  ] },
  { id: 'is.bu4', turns: [
    { by: 'a', say: "You sabotaged my fire. Don't lie." },
    { by: 'b', say: "I didn't touch your stupid fire!" },
    { by: 'a', say: "Then why is it wet?" },
    { by: 'b', say: "Because it RAINED!" },
    { by: 'b', conf: "{a} has decided everything bad that happens out here is my fault. Including the weather." },
  ] },
  { id: 'is.bu5', turns: [
    { beat: '{a} and {b} are screaming at each other before anybody knows how it started.' },
    { by: 'b', say: "You lied to my face for days!" },
    { by: 'a', say: "You lied first!" },
    { by: 'b', say: "Name one time!" },
    { by: 'a', say: "Pick a day! Any day!" },
    { by: 'a', conf: "It was bound to happen. You can't put two people who hate each other on a tiny island." },
  ] },
  { id: 'is.bu6', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You know why you're out here? Because nobody likes you." },
    { by: 'b', say: "Says the person who's also out here!" },
    { by: 'a', say: "I'm out here because they were scared of me. Different thing." },
    { by: 'b', say: "Keep telling yourself that!" },
    { by: 'b', conf: "I wanted to throw {a} into the ocean. I didn't. I want credit for that." },
  ] },
];

const CLOSE = [
  { id: 'is.cl1', turns: [
    { beat: '{a} cracks the last coconut and hands {b} half.' },
    { by: 'a', say: "We're still us. Even out here." },
    { by: 'b', say: "Even out here." },
    { by: 'b', conf: "Everyone out here is a rival. Except {a}. {a} is family." },
  ] },
  { id: 'is.cl2', turns: [
    { by: 'b', say: "I'm really glad it's you out here with me." },
    { by: 'a', say: "Me too. Weird thing to be glad about, but me too." },
    { beat: 'They sit shoulder to shoulder, watching the water.' },
    { by: 'a', conf: "{b} is the only reason I haven't lost my mind out here." },
  ] },
  { id: 'is.cl3', when: { register: 'sweet' }, turns: [
    { beat: '{a} stays up with {b}, talking about home.' },
    { by: 'a', say: "What's the first thing you'll eat when you get out?" },
    { by: 'b', say: "Pizza. A whole one. By myself." },
    { by: 'a', say: "I'll get the next one. We'll split nothing." },
    { by: 'b', conf: "Talking to {a} makes me forget where I am. For a few minutes anyway." },
  ] },
  { id: 'is.cl4', turns: [
    { beat: '{b} had a rough night. {a} sits down next to {b.obj} without saying anything.' },
    { by: 'b', say: "You don't have to stay." },
    { by: 'a', say: "I know." },
    { beat: '{a} stays.' },
    { by: 'b', conf: "No strategy. No deals. Just {a} being there. That meant more than anything in the game." },
  ] },
  { id: 'is.cl5', turns: [
    { by: 'a', say: "Hey. Whatever happens, I'm still in your corner." },
    { by: 'b', say: "Even if I'm in your way?" },
    { by: 'a', say: "Even then." },
    { by: 'a', conf: "Out here you find out who your real friends are. {b} is a real one." },
  ] },
  { id: 'is.cl6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "If anybody out here gives you trouble, they deal with me. Got it?" },
    { by: 'b', say: "Nobody's giving me trouble." },
    { by: 'a', say: "Good. Keep it that way." },
    { by: 'b', conf: "{a} acts tough, but would do anything for a friend. I'm lucky to be one of them." },
  ] },
  { id: 'is.cl7', turns: [
    { beat: '{a} and {b} are washing their only shirts in the surf.' },
    { by: 'a', say: "Remember when we thought camp food was the worst part?" },
    { by: 'b', say: "I'd kill for camp food right now. Actually kill." },
    { by: 'a', say: "Please don't. They'll make it a challenge." },
    { by: 'b', conf: "I didn't know {a} that well before. Now I'd pick {a} over anyone still in the game." },
  ] },
  { id: 'is.cl8', turns: [
    { by: 'b', say: "Can I tell you something embarrassing?" },
    { by: 'a', say: "You've seen me cry over a crab. Go ahead." },
    { by: 'b', say: "I miss my mom. Like, a lot." },
    { by: 'a', say: "...Yeah. Me too. Mine, I mean. Not yours." },
    { beat: 'They both laugh harder than the joke deserves.' },
    { by: 'a', conf: "Out here, nobody pretends to be cool. Honestly? It's kind of nice." },
  ] },
  { id: 'is.cl9', turns: [
    { beat: '{a} has scratched a little calendar into a rock. {b} adds a doodle next to every day.' },
    { by: 'a', say: "Why is today a frowny face?" },
    { by: 'b', say: "Because you ate the last banana." },
    { by: 'a', say: "Fair." },
    { by: 'b', conf: "We keep each other sane. Mostly by being annoying." },
  ] },
];
const DREAD = [
  { id: 'is.dr1', when: DUEL, turns: [
    { beat: "{a} is helping {b} practise fire-making, showing {b.obj} where to blow." },
    { by: 'a', say: "Lower. Gentler. There you go." },
    { by: 'b', say: "You know I might use this against you." },
    { by: 'a', say: "Yeah. I know." },
    { by: 'a', conf: "I'm teaching my best friend how to beat me. That's where I'm at." },
  ] },
  { id: 'is.dr2', when: DUEL, turns: [
    { by: 'b', say: "Promise me something. Whoever wins, no hard feelings." },
    { by: 'a', say: "No hard feelings." },
    { beat: "They shake on it. Neither of them lets go right away." },
    { by: 'b', conf: "We both said it. I don't think either of us meant it." },
  ] },
  { id: 'is.dr3', turns: [
    { beat: "{a} can't sleep. {b} is asleep a few feet away." },
    { by: 'a', conf: "Only one of us can stay. It might be {b} or me. I trust {b} more than anyone in this game, and I might have to beat {b.obj}." },
  ] },
  { id: 'is.dr4', turns: [
    { by: 'a', say: "Can we not talk about what happens next?" },
    { by: 'b', say: "We have to talk about it sometime." },
    { by: 'a', say: "Sometime. Not today." },
    { by: 'b', conf: "We both know how this ends. One of us goes home. We're just pretending for one more day." },
  ] },
  { id: 'is.dr5', turns: [
    { beat: '{a} and {b} are training side by side. Every few minutes, one of them stops and watches the other.' },
    { by: 'b', say: "You're getting good at that." },
    { by: 'a', say: "Is that a compliment or a warning?" },
    { by: 'b', say: "Both, I think." },
    { by: 'a', conf: "I want {b} to do well. I also really want to win. Those two things can't both happen." },
  ] },
  { id: 'is.dr6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "If it comes down to us, I don't know if I can try my hardest." },
    { by: 'b', say: "You have to. I'd be mad if you didn't." },
    { by: 'a', say: "Really?" },
    { by: 'b', say: "Really. Promise me." },
    { by: 'a', conf: "I promised. I don't know if I can keep it." },
  ] },
];
const COMEDY = [
  { id: 'is.co1', turns: [
    { beat: "{a} accidentally kicks sand right into {b}'s rice." },
    { by: 'b', say: "Seriously?" },
    { by: 'a', say: "It's seasoning." },
    { beat: '{b} stares. {a} stares back. Then {b} cracks up, and so does {a}.' },
    { by: 'b', conf: "Worst lunch of my life. Best laugh I've had in days." },
  ] },
  { id: 'is.co2', turns: [
    { by: 'a', say: "You're cooking the rice wrong." },
    { by: 'b', say: "There's no wrong way to boil rice." },
    { by: 'a', say: "And yet here you are, finding one." },
    { by: 'b', say: "Fine. You do it." },
    { by: 'a', say: "...I don't actually know how." },
    { by: 'b', conf: "We argued about rice for twenty minutes. It's the most normal thing that's happened all week." },
  ] },
  { id: 'is.co3', turns: [
    { beat: "A crab runs off with {a}'s sock. {a} chases it across the beach. {b} watches and doesn't help at all." },
    { by: 'a', say: "Help me!" },
    { by: 'b', say: "I'm rooting for the crab." },
    { by: 'a', conf: "I lost the sock. And my dignity. {b} is never letting this go." },
  ] },
  { id: 'is.co4', turns: [
    { beat: '{a} tries to open a coconut by throwing it at a rock. It bounces back and hits {a} in the leg.' },
    { by: 'b', say: "Did the coconut win?" },
    { by: 'a', say: "The coconut won." },
    { by: 'b', conf: "I needed that. I didn't know how badly I needed that." },
  ] },
  { id: 'is.co5', turns: [
    { by: 'a', say: "I'm going to build us a chair." },
    { by: 'b', say: "Out of what?" },
    { by: 'a', say: "Sticks. Determination." },
    { beat: "An hour later {a} sits on the chair. It collapses instantly. {b} laughs so hard it hurts." },
    { by: 'a', conf: "Version two will be better. Version two will be a lot better." },
  ] },
  { id: 'is.co6', when: { register: 'fiery' }, turns: [
    { beat: '{a} yells at a seagull that stole a fish right off the fire.' },
    { by: 'a', say: "Get back here, you feathered thief!" },
    { by: 'b', say: "You're losing a fight with a bird." },
    { by: 'a', say: "I'm not losing! I'm regrouping!" },
    { by: 'b', conf: "{a} has made an enemy of every animal on this island. It's honestly impressive." },
  ] },
];
const LATE = [
  { id: 'is.l1', turns: [
    { beat: "It's late. Neither {a} nor {b} can sleep. They end up by the fire." },
    { by: 'a', say: "What would you do different? If you could go back?" },
    { by: 'b', say: "Talk less. Listen more. You?" },
    { by: 'a', say: "Trust fewer people." },
    { by: 'b', conf: "Out here at night, nobody pretends. I got to know {a} better in an hour than in the whole game." },
  ] },
  { id: 'is.l2', turns: [
    { beat: '{a} and {b} are lying on their backs, looking up at the stars.' },
    { by: 'b', say: "Who do you miss most?" },
    { by: 'a', say: "My friends. They'd think this whole thing is hilarious." },
    { by: 'b', say: "My family. They'd be furious I got voted out." },
    { by: 'a', conf: "Weird night. Good night." },
  ] },
  { id: 'is.l3', turns: [
    { beat: '{a} and {b} sit by the fire trading stories until the dark feels smaller.' },
    { by: 'a', say: "And then the car rolled right into the lake. With the ducks watching." },
    { by: 'b', say: "No way." },
    { by: 'a', say: "Every word true." },
    { by: 'b', conf: "{a} tells the best stories. I needed that more than sleep." },
  ] },
  { id: 'is.l4', when: { register: 'shy' }, turns: [
    { beat: "{b} finds {a} awake by the fire and sits down." },
    { by: 'b', say: "Can't sleep either?" },
    { by: 'a', say: "Not really. I don't usually talk about this stuff." },
    { by: 'b', say: "Well. Nobody's around." },
    { by: 'a', conf: "I said more to {b} in one night than I said to anyone in the whole game. It felt good." },
  ] },
  { id: 'is.l5', turns: [
    { by: 'a', say: "Can I tell you something? I'm scared I'm not going to make it back in." },
    { by: 'b', say: "Everybody out here is scared of that." },
    { by: 'a', say: "Even you?" },
    { by: 'b', say: "Especially me." },
    { by: 'a', conf: "It helps, knowing it's not just me." },
  ] },
  { id: 'is.l6', when: { register: 'schemer' }, turns: [
    { beat: "It's the middle of the night. {a} pokes the fire while {b} talks." },
    { by: 'b', say: "I just wanted people to like me, you know?" },
    { by: 'a', say: "I know." },
    { by: 'a', conf: "I didn't plan to actually care about {b}'s life story. It just happened. Don't tell anyone." },
  ] },
];
const LEAN = [
  { id: 'is.ln1', turns: [
    { by: 'a', say: "Can I just sit with you for a bit? Today's bad." },
    { by: 'b', say: "Of course. Sit." },
    { beat: '{a} leans against {b} and closes {a.posAdj} eyes.' },
    { by: 'a', conf: "The weight gets lighter when somebody helps you carry it. {b} helped." },
  ] },
  { id: 'is.ln2', turns: [
    { beat: '{a} has been crying. {b} brings {a.obj} water and a cracked coconut.' },
    { by: 'b', say: "Eat. You need it." },
    { by: 'a', say: "I'm not hungry." },
    { by: 'b', say: "Eat anyway. For me." },
    { by: 'a', conf: "I wasn't going to make it today. {b} made sure I did." },
  ] },
  { id: 'is.ln3', turns: [
    { by: 'a', say: "I don't think I can do this anymore." },
    { by: 'b', say: "You didn't come this far to quit." },
    { by: 'a', say: "What if I did?" },
    { by: 'b', say: "Then you'll have to get past me first. I'm not letting you." },
    { by: 'a', conf: "{b} won't let me give up. I almost hate {b.obj} for it. Almost." },
  ] },
  { id: 'is.ln4', turns: [
    { beat: '{a} and {b} talk it out by the water. No strategy, no game. Just two people keeping each other sane.' },
    { by: 'a', say: "Thanks. For listening." },
    { by: 'b', say: "You'd do the same for me." },
    { by: 'b', conf: "Out here, being a friend is the only thing that keeps you human." },
  ] },
  { id: 'is.ln5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "I'm about to lose it. I'm actually about to lose it." },
    { by: 'b', say: "Then lose it at me. Go on." },
    { beat: '{a} yells at the ocean for a full minute. {b} waits.' },
    { by: 'a', say: "Okay. Okay. Better." },
    { by: 'a', conf: "{b} let me be a mess and didn't make it weird. I owe {b.obj} one." },
  ] },
  { id: 'is.ln6', turns: [
    { beat: '{b} sits next to {a} while {a} breaks down. No words. Just being there.' },
    { by: 'a', say: "Sorry. I don't know what's wrong with me." },
    { by: 'b', say: "Nothing's wrong with you. This place is hard." },
    { by: 'a', conf: "Sometimes you don't need advice. You just need somebody to stay." },
  ] },
];
const PETTY = [
  { id: 'is.pt1', turns: [
    { by: 'a', say: "You've been hogging the tarp all night." },
    { by: 'b', say: "You snore." },
    { by: 'a', say: "What does that have to do with the tarp?" },
    { by: 'b', say: "It's my payment for listening to you snore." },
    { by: 'a', conf: "It's petty. I know it's petty. Out here everything is bigger." },
  ] },
  { id: 'is.pt2', turns: [
    { beat: '{a} and {b} both grab the last dry log at the same time.' },
    { by: 'b', say: "I found it." },
    { by: 'a', say: "I saw it first." },
    { by: 'b', say: "Seeing isn't finding." },
    { by: 'b', conf: "We fought over a log for ten minutes. It's not about the log. It's never about the log." },
  ] },
  { id: 'is.pt3', turns: [
    { by: 'a', say: "Who drank all the water?" },
    { by: 'b', say: "Not me." },
    { by: 'a', say: "You're literally holding the cup." },
    { by: 'b', say: "That's a different cup." },
    { by: 'a', conf: "If {b} lies about water, what else is {b} lying about?" },
  ] },
  { id: 'is.pt4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "That is my side of the shelter!" },
    { by: 'b', say: "There are no sides!" },
    { by: 'a', say: "There are now!" },
    { beat: '{a} draws a line in the sand with {a.posAdj} foot.' },
    { by: 'b', conf: "{a} drew a line in the sand. An actual line. In actual sand." },
  ] },
  { id: 'is.pt5', turns: [
    { by: 'b', say: "You took the big piece of fish again." },
    { by: 'a', say: "They're all the same size." },
    { by: 'b', say: "They are not. I measured." },
    { by: 'a', say: "You measured the fish?" },
    { by: 'a', conf: "{b} measured the fish. That's what this place does to people." },
  ] },
  { id: 'is.pt6', turns: [
    { by: 'a', say: "Can you not whistle? Please? Just for one hour?" },
    { by: 'b', say: "It keeps me sane." },
    { by: 'a', say: "It's making me the opposite." },
    { by: 'b', conf: "{a} hates my whistling. So now I whistle a little bit more." },
  ] },
];
const SIZE = [
  { id: 'is.sz1', turns: [
    { beat: "{b} walks onto the beach with {b.posAdj} torch. {a} looks up from the fire and doesn't smile." },
    { by: 'a', say: "Welcome to paradise." },
    { by: 'b', say: "It's not that bad." },
    { by: 'a', say: "Give it a day." },
    { by: 'a', conf: "{b} showing up means one more person between me and getting back in. I'm already measuring." },
  ] },
  { id: 'is.sz2', turns: [
    { beat: '{b} drops {b.posAdj} bag and looks around. {a} is already watching.' },
    { by: 'b', say: "So how does this work out here?" },
    { by: 'a', say: "You'll figure it out." },
    { by: 'b', conf: "{a} didn't even say hello. Just stared at me like I'm the next problem to solve." },
  ] },
  { id: 'is.sz3', turns: [
    { by: 'a', say: "So they got you too." },
    { by: 'b', say: "Looks like it." },
    { by: 'a', say: "Anyone I know?" },
    { by: 'b', say: "Everyone you know." },
    { by: 'a', conf: "First thing I did was look at {b}'s arms. Second thing was look at {b}'s eyes. I need to know what I'm up against." },
  ] },
  { id: 'is.sz4', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Hey! I'm so sorry you're out here. Are you okay?" },
    { by: 'b', say: "I've been better." },
    { by: 'a', say: "I'll show you where the water is." },
    { by: 'a', conf: "I'm being nice to {b}. I mean it. I also know only one of us gets back in." },
  ] },
  { id: 'is.sz5', when: { register: 'competitor' }, turns: [
    { beat: '{a} sizes {b} up from head to toe the second {b} steps off the boat.' },
    { by: 'a', say: "Hope you've been training." },
    { by: 'b', say: "I just got here." },
    { by: 'a', say: "Then you're already behind." },
    { by: 'b', conf: "{a} has been out here long enough to forget how to say hi." },
  ] },
  { id: 'is.sz6', turns: [
    { beat: '{b} sits down by the fire. {a} moves over to make room, but not much.' },
    { by: 'b', conf: "{a} knows what me being here means. One of us is going to beat the other." },
  ] },
];
const FEAR = [
  { id: 'is.fe1', turns: [
    { beat: '{b} watches {a} train. {a} has won {streak} duels in a row, and it shows.' },
    { by: 'b', say: "Do you ever take a day off?" },
    { by: 'a', say: "Do you?" },
    { by: 'b', conf: "{Streak} wins. No weak spots. I've watched for three days and I can't find one." },
  ] },
  { id: 'is.fe2', turns: [
    { by: 'a', say: "Don't look so worried. It's only a duel." },
    { by: 'b', say: "Says the person who's won {streak} of them." },
    { by: 'a', say: "Exactly." },
    { by: 'b', conf: "{a} expects to win. You can see it just in the way {a} stands." },
  ] },
  { id: 'is.fe3', turns: [
    { beat: '{a} finishes a training run and barely breathes hard. {b} stops everything to stare.' },
    { by: 'b', conf: "Everyone says {a} is unbeatable out here. {Streak} duels in a row. I'm starting to believe them." },
  ] },
  { id: 'is.fe4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Want a tip? Don't let me see you sweat." },
    { by: 'b', say: "I'm not sweating." },
    { by: 'a', say: "You are. A lot." },
    { by: 'a', conf: "{Streak} wins. Half of winning a duel is the other person thinking they've already lost." },
  ] },
  { id: 'is.fe5', turns: [
    { by: 'b', say: "How have you won {streak} in a row?" },
    { by: 'a', say: "I just don't lose." },
    { by: 'b', say: "That's not an answer." },
    { by: 'a', say: "It is out here." },
    { by: 'b', conf: "I'm not scared of {a}. I'm just very, very aware of {a}." },
  ] },
  { id: 'is.fe6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Next. Who's next? Is it you?" },
    { by: 'b', say: "Back off." },
    { by: 'a', say: "{Streak} in a row. And you're next." },
    { by: 'b', conf: "{a} talks a lot of trash. The annoying part is {a} keeps backing it up." },
  ] },
];
const TRASH = [
  { id: 'is.tt1', turns: [
    { by: 'a', say: "You know you can't beat me, right?" },
    { beat: "{a} says it like it's a comment on the weather. {b} grits {b.posAdj} teeth." },
    { by: 'b', say: "We'll see." },
    { by: 'a', say: "We will. And then you'll go home." },
    { by: 'b', conf: "I want to beat {a} so badly I can taste it." },
  ] },
  { id: 'is.tt2', turns: [
    { by: 'a', say: "Let me tell you exactly how this goes. You try hard, you fall short, I wave goodbye." },
    { beat: '{b} says nothing. Just stares.' },
    { by: 'a', conf: "{b} didn't say a word. That means it got in {b.posAdj} head. Good." },
  ] },
  { id: 'is.tt3', turns: [
    { beat: '{a} leans in close to {b}.' },
    { by: 'a', say: "You're going home." },
    { by: 'b', say: "Funny. I was about to say the same thing to you." },
    { by: 'b', conf: "{a} thinks trash talk scares me. It doesn't. It makes me want it more." },
  ] },
  { id: 'is.tt4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Hey! You! Enjoy your last few days out here!" },
    { by: 'b', say: "Do you ever stop yelling?" },
    { by: 'a', say: "When I'm back in the game! Which will be soon!" },
    { by: 'b', conf: "{a} has been shouting at me since breakfast. I'm saving my energy for beating {a.obj}." },
  ] },
  { id: 'is.tt5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "I'd stop training if I were you. It's a bit embarrassing, honestly." },
    { by: 'b', say: "Then don't watch." },
    { by: 'a', say: "Oh, I'm watching. I'm taking notes." },
    { by: 'a', conf: "If {b} is thinking about me, {b} isn't thinking about winning. That's the whole trick." },
  ] },
  { id: 'is.tt6', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Race you to the water. Loser cooks dinner." },
    { by: 'b', say: "Fine." },
    { beat: '{a} wins by a mile and walks back slowly.' },
    { by: 'a', say: "Hope you're a good cook." },
    { by: 'b', conf: "{a} turns everything into a competition. Even dinner. Especially dinner." },
  ] },
];
const RESPECT = [
  { id: 'is.re1', turns: [
    { by: 'a', say: "Your fire technique is better than mine. I'll admit it once." },
    { by: 'b', say: "Your puzzle speed is scary. I'll admit that once too." },
    { beat: 'They nod at each other and go back to training.' },
    { by: 'a', conf: "{b} is a real competitor. I respect that. I still want to beat {b.obj}." },
  ] },
  { id: 'is.re2', turns: [
    { beat: '{a} and {b} finish the same drill at the same time, both out of breath.' },
    { by: 'b', say: "Not bad." },
    { by: 'a', say: "Not bad yourself." },
    { by: 'b', conf: "Rivals during the day, survivors at night. That's how it works with {a}." },
  ] },
  { id: 'is.re3', turns: [
    { by: 'a', say: "Whatever happens, you earned your spot out here." },
    { by: 'b', say: "So did you." },
    { by: 'a', conf: "I used to think {b} was just another player. Out here I've seen what {b}'s made of." },
  ] },
  { id: 'is.re4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Same time tomorrow?" },
    { by: 'b', say: "Earlier. I'll beat you there." },
    { by: 'a', say: "Doubt it." },
    { by: 'b', conf: "{a} pushes me harder than anyone. I'd never tell {a.obj} that." },
  ] },
  { id: 'is.re5', turns: [
    { beat: '{a} offers {b} a hand up after a hard fall in training. {b} takes it.' },
    { by: 'b', say: "Thanks." },
    { by: 'a', say: "Don't get used to it." },
    { by: 'a', conf: "I want to win. I want to win against someone good. {b} is good." },
  ] },
  { id: 'is.re6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "You read the wind before you started that fire. Smart." },
    { by: 'b', say: "You noticed?" },
    { by: 'a', say: "I notice everything." },
    { by: 'b', conf: "{a} doesn't hand out compliments. So when you get one, it means something." },
  ] },
];
const SPAR = [
  { id: 'is.sp1', turns: [
    { beat: '{a} and {b} end up {drill} together until the sun goes down.' },
    { by: 'a', say: "One more?" },
    { by: 'b', say: "One more. Then food." },
    { by: 'b', conf: "Training alone is lonely. With {a}, it's actually kind of fun." },
  ] },
  { id: 'is.sp2', turns: [
    { by: 'a', say: "Want to train together? We could try {drill}." },
    { by: 'b', say: "You're on." },
    { beat: 'They push each other harder than either of them would push alone.' },
    { by: 'a', conf: "{b} made me better today. That might come back to bite me. Worth it." },
  ] },
  { id: 'is.sp3', turns: [
    { beat: '{a} and {b} find themselves {drill} at the same time. Without a word, they start keeping pace with each other.' },
    { by: 'b', say: "Partners?" },
    { by: 'a', say: "Partners. For today." },
    { by: 'a', conf: "We didn't plan it. It just happened. Out here you take help where you find it." },
  ] },
  { id: 'is.sp4', when: { register: 'competitor' }, turns: [
    { by: 'a', say: "Bet you can't keep up." },
    { by: 'b', say: "Bet I can." },
    { beat: 'They spend the afternoon {drill}, neither one willing to stop first.' },
    { by: 'b', conf: "We nearly killed each other. Best training I've had out here." },
  ] },
  { id: 'is.sp5', turns: [
    { beat: '{a} and {b} are {drill}, shouting encouragement at each other.' },
    { by: 'b', say: "Come on! You've got this!" },
    { by: 'a', say: "So have you! Don't stop!" },
    { by: 'a', conf: "We're helping each other get better at beating each other. It makes sense if you don't think about it." },
  ] },
  { id: 'is.sp6', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Can I train with you? I'm terrible at this alone." },
    { by: 'b', say: "Sure. Let's go." },
    { beat: '{a} and {b} spend the morning {drill}, laughing every time one of them messes up.' },
    { by: 'b', conf: "Something about struggling together makes you close. Fast." },
  ] },
];
const NEWFRIENDS = [
  { id: 'is.nf1', turns: [
    { by: 'a', say: "We never really talked in the game, did we?" },
    { by: 'b', say: "Not once. You were always busy." },
    { by: 'a', say: "Busy getting voted out, apparently." },
    { beat: 'They both laugh.' },
    { by: 'b', conf: "Took being stuck on an island to find out {a} is actually great." },
  ] },
  { id: 'is.nf2', turns: [
    { beat: '{a} and {b} are on water duty together and get talking.' },
    { by: 'b', say: "Wait, you like that band too?" },
    { by: 'a', say: "Like them? I've seen them six times." },
    { by: 'b', conf: "We had zero conversations in the game. Out here we can't stop talking." },
  ] },
  { id: 'is.nf3', turns: [
    { by: 'a', say: "I used to think you were stuck up." },
    { by: 'b', say: "I used to think you were loud." },
    { by: 'a', say: "I am loud." },
    { by: 'b', say: "Yeah. It's growing on me." },
    { by: 'a', conf: "{b} and I never had a reason to talk before. Turns out we get along." },
  ] },
  { id: 'is.nf4', turns: [
    { beat: '{a} teaches {b} a card game played with shells. {b} wins the first round.' },
    { by: 'a', say: "Beginner's luck." },
    { by: 'b', say: "Deal again." },
    { by: 'b', conf: "I didn't expect to make a friend out here. I definitely didn't expect it to be {a}." },
  ] },
  { id: 'is.nf5', when: { register: 'shy' }, turns: [
    { by: 'b', say: "You're really quiet." },
    { by: 'a', say: "I talk when I've got something to say." },
    { by: 'b', say: "So say something." },
    { beat: '{a} does. They talk for an hour.' },
    { by: 'b', conf: "{a} is funny. Like, really funny. Why did nobody know that?" },
  ] },
  { id: 'is.nf6', turns: [
    { by: 'a', say: "Where are you from, anyway?" },
    { by: 'b', say: "You really don't know?" },
    { by: 'a', say: "We were in the game for days and never had one conversation." },
    { by: 'b', say: "Well. We've got time now." },
    { by: 'a', conf: "Out here there's no game to play. So you just talk. It's kind of nice." },
  ] },
];

// ── plotting the way back ─────────────────────────────────────────────
const PACT = [
  { id: 'is.pa1', turns: [
    { beat: '{a} pulls {b} aside, away from the others.' },
    { by: 'a', say: "If either of us gets back in, we play together. Deal?" },
    { by: 'b', say: "Deal. And whoever goes back first pulls the other one up." },
    { by: 'a', conf: "Everyone in the game thinks we're done. They're not ready for the two of us." },
  ] },
  { id: 'is.pa2', turns: [
    { by: 'b', say: "We need somebody on the inside when we get back. That's us. For each other." },
    { by: 'a', say: "You and me, then." },
    { beat: 'They shake on it, quickly, before anyone sees.' },
    { by: 'b', conf: "The game kicked us out. It didn't stop us from planning." },
  ] },
  { id: 'is.pa3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Here's the thing. Whoever goes back in walks in alone. Unless they've got a partner waiting." },
    { by: 'b', say: "And you want to be my partner." },
    { by: 'a', say: "I want us to be each other's partner." },
    { by: 'b', say: "Fine. Deal." },
    { by: 'a', conf: "{b} will remember this deal when it counts. I'll make sure of that." },
  ] },
  { id: 'is.pa4', when: { band: 'friends' }, turns: [
    { by: 'a', say: "Promise me something. If I get back in, I'm bringing you with me." },
    { by: 'b', say: "And if I get back in?" },
    { by: 'a', say: "Then you bring me." },
    { by: 'b', say: "Deal." },
    { by: 'b', conf: "We were friends before. Now we're a team again. Small team. Very motivated." },
  ] },
  { id: 'is.pa5', turns: [
    { beat: '{a} and {b} whisper by the water.' },
    { by: 'a', say: "One of us gets back in, the other one's name never comes up. Ever." },
    { by: 'b', say: "And we go after the same people." },
    { by: 'a', say: "Same people." },
    { by: 'b', conf: "Nobody thinks people out here are still playing. We're still playing." },
  ] },
  { id: 'is.pa6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "When we get back in, we hit them hard. Together." },
    { by: 'b', say: "Together." },
    { by: 'a', say: "Say it like you mean it!" },
    { by: 'b', say: "TOGETHER!" },
    { by: 'a', conf: "Now I've got somebody to go back in with. That changes everything." },
  ] },
];
const NOTES = [
  { id: 'is.n1', turns: [
    { by: 'a', say: "Who do you think is really running things in there?" },
    { by: 'b', say: "Not the person everyone thinks." },
    { by: 'a', say: "Go on." },
    { by: 'b', conf: "{a} and I put our notes together and the picture got a lot clearer. Some people are in big trouble." },
  ] },
  { id: 'is.n2', turns: [
    { beat: '{a} and {b} draw the old camp in the sand: who sat where, who talked to who.' },
    { by: 'a', say: "Okay. So if these two are together, then the vote that got me makes sense." },
    { by: 'b', say: "And the vote that got me too." },
    { by: 'a', conf: "We figured out more out here in an hour than I did in the whole game." },
  ] },
  { id: 'is.n3', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Tell me everything you know. Every deal, every whisper." },
    { by: 'b', say: "What do I get?" },
    { by: 'a', say: "You get my half." },
    { by: 'b', say: "Okay. Deal." },
    { by: 'a', conf: "Knowledge is the only thing I can take back in with me. I'm stocking up." },
  ] },
  { id: 'is.n4', turns: [
    { by: 'b', say: "Who voted for you?" },
    { by: 'a', say: "Same people who voted for you, I bet." },
    { by: 'b', say: "Then we know who's running it." },
    { by: 'b', conf: "Comparing notes with {a} told me exactly who to go after if I get back in." },
  ] },
  { id: 'is.n5', turns: [
    { beat: '{a} and {b} talk strategy over a pot of boiling rice.' },
    { by: 'a', say: "The quiet ones are the ones to watch." },
    { by: 'b', say: "The quiet ones are always the ones to watch." },
    { by: 'a', conf: "Being out here gives you something the people in the game don't have. Time to think." },
  ] },
  { id: 'is.n6', when: { register: 'cool' }, turns: [
    { by: 'a', say: "Let's go through it. Every vote. In order." },
    { by: 'b', say: "That's going to take a while." },
    { by: 'a', say: "We've got nothing but time." },
    { by: 'b', conf: "{a} remembers every vote. Every one. That's a little scary. It's also really useful." },
  ] },
];
const REVENGE = [
  { id: 'is.rv1', turns: [
    { by: 'a', say: "Who voted you out?" },
    { beat: '{b} lists the names. {a} nods slowly.' },
    { by: 'a', say: "Same people." },
    { by: 'b', conf: "{a} and I have the same list. That makes us allies whether we like it or not." },
  ] },
  { id: 'is.rv2', turns: [
    { beat: '{a} and {b} are swapping stories about who stabbed them in the back.' },
    { by: 'b', say: "And then they hugged me. The same day!" },
    { by: 'a', say: "They hugged you? They made me a bracelet!" },
    { by: 'a', conf: "Every name that comes up goes on the list. The list is getting long." },
  ] },
  { id: 'is.rv3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "When I get back in, they're all going down. Every single one." },
    { by: 'b', say: "Start with the ones who smiled at us." },
    { by: 'a', say: "Oh, especially them." },
    { by: 'b', conf: "{a} wants revenge. I want revenge. We're going to get along great." },
  ] },
  { id: 'is.rv4', turns: [
    { by: 'b', say: "If I get back in, I'm not forgiving anybody." },
    { by: 'a', say: "Good. Don't." },
    { by: 'b', say: "You either?" },
    { by: 'a', say: "Not a chance." },
    { by: 'a', conf: "We compared hit lists. They matched. That's a good feeling." },
  ] },
  { id: 'is.rv5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "They think they've seen the last of us. Let them think it." },
    { by: 'b', say: "And then?" },
    { by: 'a', say: "And then we walk back in and take them apart, one at a time." },
    { by: 'b', conf: "{a} has a whole plan. It's scary how much of a plan." },
  ] },
  { id: 'is.rv6', turns: [
    { beat: '{a} and {b} count off names on their fingers.' },
    { by: 'a', say: "That's four people." },
    { by: 'b', say: "Five. You forgot the one who cried." },
    { by: 'a', conf: "We're not bitter. We're organised." },
  ] },
];
const ENEMY = [
  { id: 'is.en1', turns: [
    { by: 'a', say: "Wait. {enemy} voted for you too?" },
    { by: 'b', say: "{enemy} wrote my name and then hugged me goodbye." },
    { by: 'a', say: "Same! Exactly the same!" },
    { by: 'b', conf: "{a} and I have one big thing in common. Its name is {enemy}." },
  ] },
  { id: 'is.en2', turns: [
    { by: 'b', say: "Can I tell you who I'm going after first if I get back in?" },
    { by: 'a', say: "Let me guess. {enemy}." },
    { by: 'b', say: "How did you know?" },
    { by: 'a', say: "Because {enemy} is the one who sent me here too." },
    { by: 'a', conf: "The conversation wrote itself. {enemy} doesn't know it, but {enemy} just made two enemies who talk." },
  ] },
  { id: 'is.en3', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "{enemy}! {enemy} did it to you too?" },
    { by: 'b', say: "Yep." },
    { by: 'a', say: "I swear, if I get back in there." },
    { by: 'b', say: "Get in line." },
    { by: 'b', conf: "{enemy} has a lot of people out here who'd love a word. We're starting a club." },
  ] },
  { id: 'is.en4', turns: [
    { beat: '{a} and {b} work out who voted for who, and keep landing on the same name.' },
    { by: 'b', say: "{enemy}. Again." },
    { by: 'a', say: "{enemy} is everywhere." },
    { by: 'a', conf: "{enemy} is running the game. And now two people out here know it." },
  ] },
  { id: 'is.en5', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "{enemy} voted us both out. Which means {enemy} is scared of us both." },
    { by: 'b', say: "So?" },
    { by: 'a', say: "So when one of us gets back, {enemy} has a problem." },
    { by: 'b', conf: "{a} turned getting voted out into a plan. I'm in." },
  ] },
  { id: 'is.en6', turns: [
    { by: 'b', say: "I keep thinking about the look on {enemy}'s face when they read my name." },
    { by: 'a', say: "Smug?" },
    { by: 'b', say: "So smug." },
    { by: 'a', say: "Same face for me." },
    { by: 'a', conf: "{enemy} sent both of us here. That's a mistake {enemy} will regret." },
  ] },
];

export default {
  'isle.alone.vote': ALONE_VOTE, 'isle.alone.steady': ALONE_STEADY, 'isle.alone.grind': ALONE_GRIND,
  'isle.rest.any': REST,
  'isle.mind.broken': MIND_BROKEN, 'isle.mind.hard': MIND_HARD,
  'isle.fixate.target': FIXATE_TARGET, 'isle.fixate.return': FIXATE_RETURN,
  'isle.body.thriving': THRIVING, 'isle.body.struggling': STRUGGLING,
  'isle.help.fish': HELP_FISH, 'isle.help.shelter': HELP_SHELTER, 'isle.quit.any': QUIT,
  'isle.pair.history': HISTORY, 'isle.pair.grudge': GRUDGE, 'isle.pair.cold': COLD, 'isle.pair.blowup': BLOWUP,
  'isle.pair.close': CLOSE, 'isle.pair.dread': DREAD, 'isle.pair.comedy': COMEDY, 'isle.pair.late': LATE,
  'isle.pair.lean': LEAN, 'isle.pair.petty': PETTY, 'isle.pair.size': SIZE, 'isle.pair.fear': FEAR,
  'isle.pair.trash': TRASH, 'isle.pair.respect': RESPECT, 'isle.pair.spar': SPAR, 'isle.pair.newfriends': NEWFRIENDS,
  'isle.plot.pact': PACT, 'isle.plot.notes': NOTES, 'isle.plot.revenge': REVENGE, 'isle.plot.enemy': ENEMY,
};

/** Data an island scene always carries, by key (the writer may say these without asking). */
export const GUARANTEED = {
  'isle.pair.spar': ['drill'],
  'isle.mind.hard': ['streak', 'Streak'], 'isle.pair.fear': ['streak', 'Streak'],
  'isle.fixate.target': ['target'], 'isle.plot.enemy': ['enemy'],
};
