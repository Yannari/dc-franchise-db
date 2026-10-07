// ══════════════════════════════════════════════════════════════════════
// td/script/lines/fallout.js — the morning after a vote (camp-events.js post-tribal aftermath)
// ══════════════════════════════════════════════════════════════════════
//
// fallout.mourn.<one|many>  — {a}'s ally {fallen} went home, and {a} knows who
//   voted {fallen} out: {voters} ('one': that voter is {b}, here, and gets the
//   cold shoulder; 'many': {a} tells the camera).
// fallout.found.<one|many>  — {a} found out {voters} wrote {a}'s own name.
// fallout.blame.<ending>    — the plan broke and {a} blames {b}, who in fact
//   stayed loyal. Nobody here knows who really flipped, so nobody names them.
//   'swapped': {plan} was meant to go and {boot} went instead. 'ally': {boot},
//   one of their own, went home. 'broke': the plan came apart ({plan} optional).
// fallout.flip.<ending>     — {a} flipped last night and nobody knows. Only the
//   camera hears it. 'ally': {a} voted against {b}, an ally still here, who is
//   friendly to {a} in the scene (the viewer knows, {b} does not). 'swap': {a}
//   wrote {wrote} instead of {plan}. 'plain': {wrote} optional.
// fallout.loose.any         — a stray vote that changed nothing ({wrote} optional).
// {group} is the alliance's name, when it has one. Ids: 'fo.'.
const MOURN_ONE = [
  { id: 'fo.m1', turns: [
    { by: 'b', say: "Morning! Want some of this? It's almost edible." },
    { by: 'a', say: "No thanks." },
    { by: 'b', say: "Okay... are you mad at me or something?" },
    { by: 'a', say: "Why would I be mad? Just because {fallen} is gone?" },
    { beat: '{a} walks away. {b} watches {a.obj} go.' },
  ] },
  { id: 'fo.m2', turns: [
    { by: 'b', say: "Hey. I'm sorry about {fallen}. I know you two were close." },
    { by: 'a', say: "Are you? Sorry?" },
    { by: 'b', say: "Of course I am." },
    { by: 'a', say: "Funny. Because I know how you voted." },
    { beat: "{b} doesn't have an answer for that." },
  ] },
  { id: 'fo.m3', turns: [
    { by: 'b', say: "Can you pass me that?" },
    { beat: '{a} passes it without looking at {b.obj}.' },
    { by: 'b', say: "Wow. Okay. Thanks, I guess." },
    { by: 'a', conf: "{b} voted {fallen} out. {b} can get {b.posAdj} own stuff from now on." },
  ] },
  { id: 'fo.m4', turns: [
    { by: 'a', say: "Can I ask you something? Did you vote for {fallen}?" },
    { by: 'b', say: "It's a secret ballot." },
    { by: 'a', say: "That's a yes." },
    { by: 'b', say: "It was just the game. It wasn't personal." },
    { by: 'a', say: "It's personal to me." },
  ] },
  { id: 'fo.m5', when: { register: 'fiery' }, turns: [
    { by: 'b', say: "Morning—" },
    { by: 'a', say: "Don't. Don't 'morning' me. You voted {fallen} out." },
    { by: 'b', say: "Whoa, okay, calm down—" },
    { by: 'a', say: "I'm perfectly calm! This is me being calm!" },
    { beat: '{a} kicks a bucket on the way out.' },
  ] },
  { id: 'fo.m6', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "No hard feelings about last night, right?" },
    { by: 'a', say: "None at all." },
    { beat: '{a} smiles until {b} leaves.' },
    { by: 'a', conf: "{b} took {fallen} away from me. I'm going to take something away from {b}. I just haven't decided what yet." },
  ] },
  { id: 'fo.m7', when: { register: 'sweet' }, turns: [
    { by: 'b', say: "You okay? You look really sad." },
    { by: 'a', say: "I miss {fallen}." },
    { by: 'b', say: "Yeah. Me too." },
    { by: 'a', say: "Then why did you vote for {fallen}?" },
    { beat: "{b} looks at the ground." },
  ] },
];
const MOURN_MANY = [
  { id: 'fo.mm1', turns: [
    { by: 'a', conf: "{fallen} is gone, and I know exactly who did it. {voters}." },
    { by: 'a', conf: "They think I'm going to let it go. They're wrong." },
  ] },
  { id: 'fo.mm2', turns: [
    { by: 'a', conf: "I woke up this morning and {fallen}'s spot was empty. I hate it." },
    { by: 'a', conf: "{voters}. Remember those names, because I definitely will." },
  ] },
  { id: 'fo.mm3', turns: [
    { by: 'a', conf: "Everyone's acting like last night didn't happen. It happened." },
    { by: 'a', conf: "{voters} voted {fallen} out, and now they want to be my friends. Not a chance." },
  ] },
  { id: 'fo.mm4', turns: [
    { by: 'a', conf: "I'm not going to make a scene. That's what they'd want." },
    { by: 'a', conf: "But {voters}? You just made an enemy. A quiet one." },
  ] },
  { id: 'fo.mm5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "{voters}. All of them. They took {fallen} out like it was nothing." },
    { by: 'a', conf: "Okay. Game on." },
  ] },
  { id: 'fo.mm6', when: { register: 'sweet' }, turns: [
    { by: 'a', conf: "I really miss {fallen}. This place isn't the same without {fallen}." },
    { by: 'a', conf: "And I can't stop thinking about who voted {fallen} out. {voters}. I thought some of them were my friends." },
  ] },
  { id: 'fo.mm7', turns: [
    { by: 'a', conf: "Losing {fallen} hurts. Knowing it was {voters} hurts more." },
    { by: 'a', conf: "I'm going to smile at all of them today. That's the hardest thing I'll do all week." },
  ] },
  { id: 'fo.mm8', turns: [
    { by: 'a', conf: "{fallen} was my best friend in here. Now it's just me." },
    { by: 'a', conf: "{voters} better hope I don't win the next challenge." },
  ] },
];

const FOUND_ONE = [
  { id: 'fo.f1', turns: [
    { by: 'b', say: "Hey! Sit with me?" },
    { by: 'a', say: "Sure. Did you sleep well? After writing my name down?" },
    { by: 'b', say: "What? I didn't—" },
    { by: 'a', say: "Don't bother. I know." },
    { beat: '{a} sits down anyway and eats in silence. {b} stops eating.' },
  ] },
  { id: 'fo.f2', turns: [
    { by: 'a', say: "So. You voted for me." },
    { by: 'b', say: "Who told you that?" },
    { by: 'a', say: "That's not a no." },
    { by: 'b', say: "It was a numbers thing! It wasn't about you!" },
    { by: 'a', say: "My name on a piece of paper is pretty much about me." },
  ] },
  { id: 'fo.f3', turns: [
    { by: 'b', say: "Why are you looking at me like that?" },
    { by: 'a', say: "Like what?" },
    { by: 'b', say: "Like you want to strangle me." },
    { by: 'a', say: "No idea what you're talking about." },
    { by: 'a', conf: "{b} wrote my name. I'm not saying anything. I'm just going to let {b} sweat." },
  ] },
  { id: 'fo.f4', turns: [
    { by: 'a', say: "I'm not mad. I just want to know why." },
    { by: 'b', say: "Why what?" },
    { by: 'a', say: "Why my name was on your ballot." },
    { by: 'b', say: "...Because I thought you were going after me first." },
    { by: 'a', say: "I wasn't. But maybe I should." },
  ] },
  { id: 'fo.f5', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You've got some nerve, sitting there all smiley." },
    { by: 'b', say: "What did I do?" },
    { by: 'a', say: "You voted for me! That's what you did!" },
    { by: 'b', say: "Okay, keep it down—" },
    { by: 'a', say: "No! Everybody should know!" },
  ] },
  { id: 'fo.f6', when: { register: 'cool' }, turns: [
    { by: 'b', say: "Morning." },
    { by: 'a', say: "Morning. Good vote last night?" },
    { by: 'b', say: "What do you mean?" },
    { by: 'a', say: "You know what I mean." },
    { beat: "{a} leaves before {b} can answer." },
  ] },
  { id: 'fo.f7', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "Can I ask you something? Please be honest." },
    { by: 'b', say: "Sure." },
    { by: 'a', say: "Did you vote for me?" },
    { by: 'b', say: "...Yeah. I'm sorry." },
    { by: 'a', say: "Thanks for being honest, at least." },
  ] },
  { id: 'fo.f8', turns: [
    { beat: '{a} drops into the seat right across from {b}.' },
    { by: 'b', say: "Oh. Hi." },
    { by: 'a', say: "Hi. Enjoying breakfast? You must be hungry after all that voting." },
    { by: 'b', say: "I don't know what you mean." },
    { by: 'a', say: "Sure you don't." },
  ] },
  { id: 'fo.f9', turns: [
    { by: 'b', say: "Are we okay? You've been weird since last night." },
    { by: 'a', say: "I've been weird? You wrote my name down." },
    { by: 'b', say: "How do you even know that?" },
    { by: 'a', say: "Doesn't matter how. What matters is you did it." },
    { by: 'b', say: "I— okay. Yeah. I did. I'm sorry." },
    { by: 'a', say: "Sorry doesn't take it back." },
  ] },
  { id: 'fo.f10', turns: [
    { by: 'a', say: "Funny thing. I heard my name got a vote last night." },
    { by: 'b', say: "Really? Huh. Weird." },
    { by: 'a', say: "Yeah. Weird. And I heard it was yours." },
    { beat: '{b} suddenly finds something very interesting on the ground.' },
  ] },
  { id: 'fo.f11', turns: [
    { by: 'b', say: "Want to team up for the chores today?" },
    { by: 'a', say: "With you? The person who voted for me? No thanks." },
    { by: 'b', say: "Who said I voted for you?" },
    { by: 'a', say: "Nobody had to. It's all over your face." },
    { beat: '{a} walks off.' },
  ] },
  { id: 'fo.f12', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "Morning!" },
    { by: 'a', say: "Morning! You look great today." },
    { by: 'b', say: "Oh! Thanks!" },
    { by: 'a', conf: "{b} wrote my name last night. So now I'm going to be {b}'s best friend. Right up until the vote where I'm not." },
  ] },
];
const FOUND_MANY = [
  { id: 'fo.fm1', turns: [
    { by: 'a', conf: "I found out who wrote my name last night. {voters}." },
    { by: 'a', conf: "And they're all being SO nice to me this morning. It's creepy." },
  ] },
  { id: 'fo.fm2', turns: [
    { by: 'a', conf: "{voters}. Every single one of them smiled at me at breakfast." },
    { by: 'a', conf: "I smiled back. Two can play that game." },
  ] },
  { id: 'fo.fm3', turns: [
    { by: 'a', conf: "I know who voted for me. {voters}." },
    { by: 'a', conf: "I'm not going to say anything yet. I'm just going to watch them." },
  ] },
  { id: 'fo.fm4', turns: [
    { by: 'a', conf: "It's weird, knowing who wanted you gone. {voters}." },
    { by: 'a', conf: "You look at people differently after that." },
  ] },
  { id: 'fo.fm5', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "{voters} voted for me. Every one of them." },
    { by: 'a', conf: "They missed. Now it's my turn." },
  ] },
  { id: 'fo.fm6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{voters} wanted me gone. Noted." },
    { by: 'a', conf: "I'll be lovely to every one of them until the day I'm not." },
  ] },
];

const BLAME_SWAPPED = [
  { id: 'fo.b1', turns: [
    { by: 'a', say: "{plan} was supposed to go last night. {boot} went instead. Explain that." },
    { by: 'b', say: "Why are you asking me?" },
    { by: 'a', say: "Because somebody flipped, and you're the only one who'd do it." },
    { by: 'b', say: "I voted {plan}! Exactly like we said!" },
    { by: 'a', say: "Sure you did." },
    { by: 'b', conf: "I didn't flip. I didn't! And now I'm the bad guy for something I didn't do." },
  ] },
  { id: 'fo.b2', turns: [
    { by: 'a', say: "Don't lie to me. You broke the plan." },
    { by: 'b', say: "What plan? The {plan} plan? I stuck to it!" },
    { by: 'a', say: "Then why is {boot} gone and {plan} still here?" },
    { by: 'b', say: "I don't know! Ask somebody else!" },
    { beat: '{a} turns away. {b} stares after {a.obj}, stunned.' },
  ] },
  { id: 'fo.b3', turns: [
    { by: 'b', say: "Why won't you talk to me?" },
    { by: 'a', say: "Because I know what you did." },
    { by: 'b', say: "What did I do?" },
    { by: 'a', say: "{boot} went home instead of {plan}. Somebody switched. It was you." },
    { by: 'b', say: "It wasn't! I swear it wasn't!" },
  ] },
  { id: 'fo.b4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "You! You flipped on us!" },
    { by: 'b', say: "What are you talking about?" },
    { by: 'a', say: "{plan} was the vote! {plan}! And now {boot}'s gone!" },
    { by: 'b', say: "I voted {plan}! I don't know who flipped!" },
    { by: 'a', say: "Yeah, right." },
  ] },
  { id: 'fo.b5', when: { group: true }, turns: [
    { by: 'a', say: "{group} had one job last night. Vote {plan}. And somebody couldn't do it." },
    { by: 'b', say: "And you think it was me?" },
    { by: 'a', say: "Who else would it be?" },
    { by: 'b', say: "Literally anyone else! I did what we said!" },
    { by: 'b', conf: "Somebody in {group} flipped, and I'm taking the blame for it. This is so unfair." },
  ] },
  { id: 'fo.b6', turns: [
    { by: 'a', conf: "{plan} was supposed to go. {boot} went instead. Somebody flipped." },
    { by: 'a', conf: "And I'm pretty sure it was {b}." },
    { by: 'b', say: "Hey, are you okay? You've been weird all morning." },
    { by: 'a', say: "I'm fine." },
  ] },
];
const BLAME_ALLY = [
  { id: 'fo.a1', turns: [
    { by: 'a', say: "{boot} was one of us. One of US. And {boot} went home." },
    { by: 'b', say: "I know. I'm gutted too." },
    { by: 'a', say: "Are you? Because somebody voted our own person out, and I think it was you." },
    { by: 'b', say: "Me? I would never!" },
    { by: 'a', say: "That's exactly what someone who did it would say." },
  ] },
  { id: 'fo.a2', turns: [
    { by: 'b', say: "I can't believe {boot}'s gone." },
    { by: 'a', say: "Can't you?" },
    { by: 'b', say: "What's that supposed to mean?" },
    { by: 'a', say: "It means somebody turned on {boot}. And you were acting weird all day yesterday." },
    { by: 'b', say: "I was acting weird because I was nervous! Like everyone!" },
  ] },
  { id: 'fo.a3', turns: [
    { by: 'a', say: "Just tell me the truth. Did you vote for {boot}?" },
    { by: 'b', say: "No!" },
    { by: 'a', say: "Somebody did. And you're the only one who's been hanging around the other side." },
    { by: 'b', say: "I talked to them ONCE." },
    { beat: "{a} doesn't believe a word of it." },
  ] },
  { id: 'fo.a4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "We lost {boot} because of a traitor. And I'm looking at the traitor." },
    { by: 'b', say: "Are you serious right now?" },
    { by: 'a', say: "Dead serious." },
    { by: 'b', say: "I loved {boot}! Why would I do that?" },
    { by: 'a', say: "You tell me!" },
  ] },
  { id: 'fo.a5', when: { group: true }, turns: [
    { by: 'a', conf: "{group} lost {boot} last night, and it was an inside job." },
    { by: 'a', conf: "I've thought about it all night. It's {b}. It has to be." },
    { by: 'b', conf: "{a} won't even look at me. I have no idea what I did." },
  ] },
  { id: 'fo.a6', turns: [
    { by: 'b', say: "Do you want to talk about {boot}?" },
    { by: 'a', say: "With you? No." },
    { by: 'b', say: "What did I do?" },
    { by: 'a', say: "Somebody voted {boot} out from the inside. I'm not stupid." },
    { by: 'b', conf: "I didn't do anything. But {a} has decided I did, and I don't know how to fix that." },
  ] },
  { id: 'fo.a7', turns: [
    { by: 'a', say: "Somebody in our group wrote {boot}'s name." },
    { by: 'b', say: "I know. It's horrible." },
    { by: 'a', say: "You don't seem that upset about it." },
    { by: 'b', say: "I'm upset on the inside!" },
    { by: 'a', say: "Then show it. Because right now you look fine." },
  ] },
  { id: 'fo.a8', when: { register: 'cool' }, turns: [
    { by: 'a', say: "I've gone over last night a hundred times. {boot} didn't go home by accident." },
    { by: 'b', say: "Okay. So who did it?" },
    { by: 'a', say: "I think you did." },
    { by: 'b', say: "Based on what?!" },
    { by: 'a', say: "Based on how jumpy you've been all morning." },
  ] },
];
const BLAME_BROKE = [
  { id: 'fo.k1', turns: [
    { by: 'a', say: "The plan fell apart last night. Somebody flipped." },
    { by: 'b', say: "Yeah, I noticed." },
    { by: 'a', say: "And I think it was you." },
    { by: 'b', say: "Me?! I did exactly what we said!" },
    { by: 'a', say: "Then who didn't?" },
    { by: 'b', say: "I don't know! But it wasn't me!" },
  ] },
  { id: 'fo.k2', when: { plan: true }, turns: [
    { by: 'a', say: "We were all supposed to vote {plan}. It didn't happen. Why not?" },
    { by: 'b', say: "How would I know?" },
    { by: 'a', say: "Because you were the one who kept saying {plan} was a bad idea." },
    { by: 'b', say: "Saying it's a bad idea isn't the same as flipping!" },
    { beat: "{a} doesn't look convinced." },
  ] },
  { id: 'fo.k3', turns: [
    { by: 'b', say: "Why does everyone keep staring at me?" },
    { by: 'a', say: "Because the vote went wrong, and people think it was you." },
    { by: 'b', say: "Do YOU think it was me?" },
    { by: 'a', say: "...Yeah. I do." },
    { by: 'b', say: "Unbelievable." },
  ] },
  { id: 'fo.k4', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Somebody wrecked the vote and I know it was you!" },
    { by: 'b', say: "You don't know anything!" },
    { by: 'a', say: "I know you were whispering with the other side all day!" },
    { by: 'b', say: "That's called TALKING! People do it!" },
  ] },
  { id: 'fo.k5', turns: [
    { by: 'a', conf: "Something went wrong at the vote. Somebody went off-script." },
    { by: 'a', conf: "My money's on {b}." },
    { by: 'b', conf: "Everyone's acting like I did something. I didn't do anything!" },
  ] },
  { id: 'fo.k6', when: { group: true }, turns: [
    { by: 'a', say: "{group} is supposed to vote together. Last night we didn't." },
    { by: 'b', say: "I know. It's a mess." },
    { by: 'a', say: "It's a mess YOU made." },
    { by: 'b', say: "Excuse me? I voted with the group!" },
    { by: 'a', say: "Prove it." },
    { by: 'b', say: "How am I supposed to prove it?!" },
  ] },
];

const FLIP_ALLY = [
  { id: 'fo.x1', turns: [
    { by: 'b', say: "Morning! I saved you the last banana." },
    { by: 'a', say: "Aw. Thanks." },
    { by: 'a', conf: "I wrote {b}'s name last night. And {b} saved me a banana. I feel a little bad. A little." },
  ] },
  { id: 'fo.x2', turns: [
    { by: 'b', say: "Can you believe somebody voted for me last night? Who would do that?" },
    { by: 'a', say: "No idea. That's crazy." },
    { by: 'b', say: "At least I know I can trust you." },
    { by: 'a', say: "Always." },
    { by: 'a', conf: "It was me. Obviously it was me." },
  ] },
  { id: 'fo.x3', turns: [
    { by: 'b', say: "We're still good, right? You and me?" },
    { by: 'a', say: "Of course we are. Why wouldn't we be?" },
    { beat: '{b} smiles and heads off.' },
    { by: 'a', conf: "{b} has no idea I voted against {b.obj}. And I'm going to keep it that way." },
  ] },
  { id: 'fo.x4', turns: [
    { by: 'b', say: "Somebody's lying to me, and I'm going to find out who." },
    { by: 'a', say: "Let me know if you need any help." },
    { by: 'b', say: "Thanks. You're the best." },
    { by: 'a', conf: "I'm going to help {b} look for the traitor. Very carefully. Away from me." },
  ] },
  { id: 'fo.x5', when: { register: 'schemer' }, turns: [
    { by: 'b', say: "I'm so glad I've got you in this game." },
    { by: 'a', say: "Me too." },
    { by: 'a', conf: "I voted for {b} last night. It didn't work. Next time it will." },
  ] },
  { id: 'fo.x6', when: { register: 'sweet' }, turns: [
    { by: 'b', say: "You're the only one who's been nice to me this morning." },
    { by: 'a', say: "Of course. You deserve it." },
    { by: 'a', conf: "I voted for {b} last night. I had to. Being extra nice today is the least I can do." },
  ] },
];
const FLIP_SWAP = [
  { id: 'fo.s1', turns: [
    { by: 'a', conf: "Everyone thinks the vote went to plan. It didn't." },
    { by: 'a', conf: "They all wrote {plan}. I wrote {wrote}. And nobody has a clue." },
  ] },
  { id: 'fo.s2', turns: [
    { by: 'a', conf: "The plan was {plan}. I went with {wrote}." },
    { by: 'a', conf: "And then I sat there and nodded along with everyone else. I'm kind of proud of that." },
  ] },
  { id: 'fo.s3', turns: [
    { by: 'a', conf: "I didn't vote {plan}. I voted {wrote}." },
    { by: 'a', conf: "Why? Because I don't take orders. I just let people think I do." },
  ] },
  { id: 'fo.s4', when: { group: true }, turns: [
    { by: 'a', conf: "{group} told me to vote {plan}. I wrote {wrote}." },
    { by: 'a', conf: "And I'm still sitting in {group}, and nobody suspects a thing." },
  ] },
  { id: 'fo.s5', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "{plan}, {wrote}, it's all the same to me. What matters is I wrote the name I wanted." },
    { by: 'a', conf: "The others can keep thinking we're a team." },
  ] },
  { id: 'fo.s6', turns: [
    { by: 'a', conf: "Okay, confession time. Literally. I didn't vote {plan}." },
    { by: 'a', conf: "I wrote {wrote}. Please don't tell anybody. Oh wait. Everybody's going to see this." },
  ] },
];
const FLIP_PLAIN = [
  { id: 'fo.p1', turns: [
    { by: 'a', conf: "Everyone thinks I voted with the group last night. I didn't." },
    { by: 'a', conf: "And nobody figured it out. Not one person." },
  ] },
  { id: 'fo.p2', when: { wrote: true }, turns: [
    { by: 'a', conf: "I went off-script last night. I wrote {wrote}." },
    { by: 'a', conf: "Nobody noticed. I'm honestly a little offended nobody noticed." },
  ] },
  { id: 'fo.p3', turns: [
    { by: 'a', conf: "I flipped last night. I didn't tell anyone, and I'm not going to." },
    { by: 'a', conf: "I'm taking this one all the way to the end." },
  ] },
  { id: 'fo.p4', when: { group: true }, turns: [
    { by: 'a', conf: "I broke from {group} last night." },
    { by: 'a', conf: "And this morning I'm back in {group}, and nobody suspects a thing." },
  ] },
  { id: 'fo.p5', turns: [
    { by: 'a', conf: "That vote last night? It didn't go the way everyone thinks it did." },
    { by: 'a', conf: "I'm the only one who knows. Well, me and you." },
  ] },
  { id: 'fo.p6', when: { register: 'schemer' }, turns: [
    { by: 'a', conf: "I didn't vote with them. I never planned to." },
    { by: 'a', conf: "Let them keep thinking I'm on their side. That's when I'm most useful." },
  ] },
];
const LOOSE = [
  { id: 'fo.l1', turns: [
    { by: 'a', conf: "I didn't vote with everyone last night. It didn't change anything." },
    { by: 'a', conf: "I just wanted to see if I could." },
  ] },
  { id: 'fo.l2', when: { wrote: true }, turns: [
    { by: 'a', conf: "I threw a vote at {wrote} last night. Nobody noticed." },
    { by: 'a', conf: "Didn't matter this time. Maybe next time it will." },
  ] },
  { id: 'fo.l3', turns: [
    { by: 'a', conf: "My vote went somewhere else last night. The same person went home anyway." },
    { by: 'a', conf: "So no harm done. Right?" },
  ] },
  { id: 'fo.l4', when: { group: true }, turns: [
    { by: 'a', conf: "{group} thinks I'm locked in. I'm... mostly locked in." },
    { by: 'a', conf: "Last night I wasn't. Nobody needs to know that." },
  ] },
  { id: 'fo.l5', turns: [
    { by: 'a', conf: "Sometimes you vote how you're told. Sometimes you don't." },
    { by: 'a', conf: "Last night, I didn't. It didn't change anything, but I liked it." },
  ] },
  { id: 'fo.l6', when: { register: 'fiery' }, turns: [
    { by: 'a', conf: "I wasn't going to write the name they told me to. So I didn't." },
    { by: 'a', conf: "They went home anyway, so whatever." },
  ] },
];

export default {
  'fallout.mourn.one': MOURN_ONE,
  'fallout.mourn.many': MOURN_MANY,
  'fallout.found.one': FOUND_ONE,
  'fallout.found.many': FOUND_MANY,
  'fallout.blame.swapped': BLAME_SWAPPED,
  'fallout.blame.ally': BLAME_ALLY,
  'fallout.blame.broke': BLAME_BROKE,
  'fallout.flip.ally': FLIP_ALLY,
  'fallout.flip.swap': FLIP_SWAP,
  'fallout.flip.plain': FLIP_PLAIN,
  'fallout.loose.any': LOOSE,
};

export const GUARANTEED = {
  'fallout.mourn.one': ['fallen'],
  'fallout.mourn.many': ['fallen'],
  'fallout.blame.swapped': ['plan', 'boot'],
  'fallout.blame.ally': ['boot'],
  'fallout.flip.swap': ['wrote', 'plan'],
};
