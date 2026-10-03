// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/scheme.js — schemes and what comes of them (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/schemes.js. A scheme is decided by the shared
// generators in social-manipulation.js, which can return several results in
// one go (a note found, the schemer exposed, the victim comforted). Each
// result is one of these scenes; schemes.js joins them into a single beat.
//
// {target} is the person a scheme is about, never in the room.
//
//   scheme.note       a plants a note for b about {target}       believed | doubt
//                     b finds the note was a's work               exposed
//   scheme.lie        a lies to b about {target}                  believed | rejected
//                     a, who was lied to, confronts b             confront
//                     a warns b that {source} is using b's name   warned
//   scheme.comfort    a looks after b, the victim of a scheme:    aware (b knows what was said) | unaware
//   scheme.exposed    a exposes b's lies to the house             scene; intent double ({target}, {partner})
//   scheme.whisper    a raises doubts about {target}              spread
//                     a, the target, traces them back to b         exposed
//   scheme.rally      a rallies the house against {target}        scene
//   scheme.majority   a sells b a fake vote count on {target}     fooled | refused
//   scheme.kiss       a makes a move on b, c's partner, while     setup
//                     {partner} keeps c out of the room
//                     b, the partner, sees through a              failed
//                     a, who saw it, confronts b                  heartbroken | over
//   scheme.accuse     a tells b (and c) that {target} has promised final two to everyone   landed | flat
//   scheme.collapse   a checks the story; b was accused; c made it up                      scene
//   scheme.quiet      a's scheme comes to nothing                 scene

export default {
  'scheme.note.believed': [
    { id: 'sn.b1', turns: [{ beat: '{a} slips a folded note into {b}\'s bag.' }, { by: 'b', dr: "Someone left me a note saying {target} has been pushing my name. I don't know who wrote it. But it makes sense." }] },
    { id: 'sn.b2', turns: [{ beat: '{b} finds a note tucked under a pillow and reads it twice.' }, { by: 'b', dr: "It says {target} has a side deal. I trusted {target}. Not any more." }] },
    { id: 'sn.b3', turns: [{ by: 'a', dr: "I wrote a note. I put it where {b} would find it. Now {b} doesn't trust {target}. That's all I wanted." }] },
    { id: 'sn.b4', turns: [{ beat: '{b} reads the note, folds it carefully, and puts it away.' }, { by: 'b', dr: "{target} has been talking about me behind my back. I've got it in writing." }] },
    { id: 'sn.b5', turns: [{ by: 'b', say: "Did you see who was in here earlier?" }, { by: 'a', say: "No. Why?" }, { by: 'b', say: "No reason." }, { by: 'b', dr: "I'm not telling anyone about this note until I've worked out what {target} is up to." }] },
    { id: 'sn.b6', turns: [{ by: 'b', dr: "I found a list. {target}'s allies on one side, targets on the other. My name's on the wrong side." }] },
    { id: 'sn.b7', turns: [{ by: 'a', dr: "{b} found my note. I watched {b} read it. Then I watched {b} look across the room at {target}." }] },
  ],
  'scheme.note.doubt': [
    { id: 'sn.d1', turns: [{ beat: '{b} finds an unsigned note about {target} and reads it twice.' }, { by: 'b', dr: "I don't believe all of it. But I'm not going to tell {target} everything any more." }] },
    { id: 'sn.d2', turns: [{ by: 'b', dr: "Somebody wants me to stop trusting {target}. Maybe it's true. Maybe it's a setup. I'm going to watch and see." }] },
    { id: 'sn.d3', turns: [{ by: 'b', dr: "The handwriting on this note looks wrong. But the numbers on it bother me." }] },
    { id: 'sn.d4', turns: [{ by: 'a', dr: "{b} didn't fully believe the note. Doesn't matter. {b} is thinking about it. That's enough." }] },
    { id: 'sn.d5', turns: [{ by: 'b', say: "Do you know anything about a note?" }, { by: 'a', say: "What note?" }, { by: 'b', say: "Never mind." }] },
    { id: 'sn.d6', turns: [{ by: 'b', dr: "A note says {target} has another final two. I don't know who wrote it. I'm keeping it anyway." }] },
  ],
  'scheme.note.exposed': [
    { id: 'sn.e1', turns: [{ by: 'b', say: "This is your handwriting." }, { by: 'a', say: "What? No, it isn't." }, { by: 'b', say: "It is. I'd know it anywhere." }] },
    { id: 'sn.e2', turns: [{ by: 'b', say: "You wrote this note." }, { by: 'a', say: "Why would I write a note?" }, { by: 'b', say: "That's what I'd like to know." }] },
    { id: 'sn.e3', turns: [{ by: 'b', dr: "The note used a phrase {a} says all the time. It took me five minutes to work out who wrote it." }] },
    { id: 'sn.e4', turns: [{ by: 'b', say: "Everyone, listen. {a} left me a fake note." }, { by: 'a', say: "That's ridiculous." }, { by: 'b', say: "Then explain the handwriting." }] },
    { id: 'sn.e5', turns: [{ by: 'a', dr: "{b} saw straight through the note. I didn't think {b} would check." }] },
    { id: 'sn.e6', turns: [{ by: 'b', say: "I checked every detail in this note. All of them are wrong." }, { by: 'a', say: "So?" }, { by: 'b', say: "So why did you write it?" }] },
  ],
  'scheme.lie.believed': [
    { id: 'sl.b1', turns: [{ by: 'a', say: "{target} has been pushing your name. I thought you should know." }, { by: 'b', say: "Seriously?" }, { by: 'a', say: "I'm only telling you because I care." }] },
    { id: 'sl.b2', turns: [{ by: 'a', say: "Don't say I told you. But {target} offered you up as an easy nominee." }, { by: 'b', say: "...I knew it." }] },
    { id: 'sl.b3', turns: [{ by: 'a', say: "{target} called your alliance fake. Right in front of me." }, { by: 'b', say: "Who else heard it?" }, { by: 'a', say: "A couple of people." }] },
    { id: 'sl.b4', turns: [{ by: 'b', dr: "{a} told me what {target} has been saying about me. It fits. Everything fits." }] },
    { id: 'sl.b5', turns: [{ by: 'a', dr: "None of it was true. {b} believed every word." }] },
    { id: 'sl.b6', turns: [{ by: 'a', say: "{target} told everyone your final-two deal." }, { by: 'b', say: "{target} did what?" }] },
    { id: 'sl.b7', turns: [{ by: 'a', say: "{target} laughed when your name came up." }, { by: 'b', say: "Laughed?" }, { by: 'a', say: "Like you weren't a threat at all." }] },
  ],
  'scheme.lie.rejected': [
    { id: 'sl.r1', turns: [{ by: 'a', say: "{target} has been going after you." }, { by: 'b', say: "That doesn't sound like {target}." }, { by: 'a', say: "Well, it's true." }, { by: 'b', say: "Is it?" }] },
    { id: 'sl.r2', turns: [{ by: 'a', say: "{target} is coming for you." }, { by: 'b', say: "Who told you that?" }, { by: 'a', say: "I just heard it." }, { by: 'b', say: "From who?" }] },
    { id: 'sl.r3', turns: [{ by: 'b', dr: "Everything {a} told me helps {a}. That's not a coincidence." }] },
    { id: 'sl.r4', turns: [{ by: 'a', say: "You need to watch {target}." }, { by: 'b', say: "Why are you the only person saying this?" }] },
    { id: 'sl.r5', turns: [{ by: 'b', dr: "{a} tried to turn me against {target}. I'm more worried about {a} now." }] },
    { id: 'sl.r6', turns: [{ by: 'a', dr: "{b} didn't buy it. Now {b} is looking at me funny." }] },
  ],
  'scheme.lie.confront': [
    { id: 'sl.c1', turns: [{ by: 'a', say: "Somebody told me you've been pushing my name." }, { by: 'b', say: "Who said that?" }, { by: 'a', say: "Does it matter?" }, { by: 'b', say: "Yes! Because it's not true!" }] },
    { id: 'sl.c2', turns: [{ by: 'a', say: "Say it to my face, then." }, { by: 'b', say: "Say what?" }, { by: 'a', say: "Whatever you've been saying about me." }] },
    { id: 'sl.c3', turns: [{ by: 'b', say: "I never said that." }, { by: 'a', say: "That's not what I heard." }, { by: 'b', say: "Then you heard wrong." }] },
    { id: 'sl.c4', turns: [{ by: 'a', say: "I thought we were good." }, { by: 'b', say: "We are good! What are you talking about?" }] },
    { id: 'sl.c5', turns: [{ by: 'b', dr: "{a} came at me for something I never said. Somebody is lying, and it isn't me." }] },
    { id: 'sl.c6', turns: [{ by: 'a', say: "Are you after me?" }, { by: 'b', say: "No! Who's telling you this?" }] },
  ],
  'scheme.lie.warned': [
    { id: 'sl.w1', turns: [{ by: 'a', say: "Heads up. {source} has been using your name." }, { by: 'b', say: "Saying what?" }, { by: 'a', say: "That you're after me. I didn't believe it." }] },
    { id: 'sl.w2', turns: [{ by: 'a', say: "{source} told me something about you. I don't think it's true." }, { by: 'b', say: "Thanks for telling me." }] },
    { id: 'sl.w3', turns: [{ by: 'b', dr: "{a} came straight to me about what {source} said. That's the kind of person I want on my side." }] },
    { id: 'sl.w4', turns: [{ by: 'a', say: "Don't react yet. {source} is spreading stories about you." }, { by: 'b', say: "Then I'll wait and see who repeats them." }] },
    { id: 'sl.w5', turns: [{ by: 'a', dr: "{source} tried to turn me against {b}. I went and told {b} instead." }] },
    { id: 'sl.w6', turns: [{ by: 'b', say: "What exactly did {source} say?" }, { by: 'a', say: "Word for word?" }, { by: 'b', say: "Word for word." }] },
  ],
  'scheme.comfort.aware': [
    { id: 'sc.1', turns: [{ by: 'a', say: "Are you okay?" }, { by: 'b', say: "Not really." }, { by: 'a', say: "Tell me what happened. From the start." }] },
    { id: 'sc.2', turns: [{ beat: '{a} brings {b} a glass of water and sits down.' }, { by: 'a', say: "Not everyone believes it, you know." }, { by: 'b', say: "It doesn't feel like that." }] },
    { id: 'sc.3', turns: [{ by: 'a', say: "Do you want advice, or do you want company?" }, { by: 'b', say: "Company." }, { by: 'a', say: "Okay." }] },
    { id: 'sc.4', turns: [{ by: 'b', dr: "{a} didn't try to get a vote out of me. {a} just listened. I needed that." }] },
    { id: 'sc.5', turns: [{ by: 'a', say: "Have you eaten?" }, { by: 'b', say: "I can't." }, { by: 'a', say: "Try. Then we'll talk about what to do." }] },
    { id: 'sc.6', turns: [{ by: 'a', say: "For what it's worth, I stuck up for you." }, { by: 'b', say: "You did?" }, { by: 'a', say: "Of course I did." }] },
    { id: 'sc.7', turns: [{ by: 'a', dr: "Somebody's been messing with {b}. I don't know who yet. But I'm on {b}'s side." }] },
    { id: 'sc.8', turns: [{ by: 'b', say: "Does everyone hate me now?" }, { by: 'a', say: "No. A few people believe it. Most don't." }] },
    { id: 'sc.9', turns: [{ by: 'a', say: "Let's work out what was actually said and what got added." }, { by: 'b', say: "Where do we even start?" }, { by: 'a', say: "With who told you." }] },
    { id: 'sc.10', turns: [{ by: 'b', dr: "After today, I know who my real friends are in here. {a} is one of them." }] },
  ],
  'scheme.comfort.unaware': [
    { id: 'sc.u1', turns: [{ by: 'a', say: "You doing okay?" }, { by: 'b', say: "Yeah. Why?" }, { by: 'a', say: "No reason. Just checking." }] },
    { id: 'sc.u2', turns: [{ by: 'a', dr: "Somebody's telling stories about {b}. I don't believe a word. I made sure {b} had a friend today." }] },
    { id: 'sc.u3', turns: [{ by: 'a', say: "Come and sit with me." }, { by: 'b', say: "Everything okay?" }, { by: 'a', say: "Everything's fine. I just wanted the company." }] },
    { id: 'sc.u4', turns: [{ by: 'a', say: "If anyone says anything about you, come to me first." }, { by: 'b', say: "Why? What are people saying?" }, { by: 'a', say: "Nothing I believe." }] },
    { id: 'sc.u5', turns: [{ by: 'a', dr: "I heard what's being said about {b}. I'm not going to repeat it. I'm just going to be nice to {b}." }] },
    { id: 'sc.u6', turns: [{ by: 'b', dr: "{a} has been really kind to me today. I don't know why. I'll take it." }] },
    { id: 'sc.u7', turns: [{ by: 'a', say: "Made you a coffee." }, { by: 'b', say: "What's this for?" }, { by: 'a', say: "Does it have to be for something?" }] },
    { id: 'sc.u8', turns: [{ by: 'a', dr: "{b} has no idea what's being said about {b.obj}. I'm not going to be the one to tell {b.obj}. But I'm not going to believe it either." }] },
  ],
  'scheme.exposed.scene': [
    { id: 'sx.1', turns: [{ by: 'a', say: "Everyone tell me what {b} told you this week." }, { beat: 'Three people answer. Three different stories.' }, { by: 'a', say: "Interesting." }] },
    { id: 'sx.2', turns: [{ by: 'a', say: "{b}, you told me one thing and told everyone else something different." }, { by: 'b', say: "That's not true." }, { by: 'a', say: "Then why don't the stories match?" }] },
    { id: 'sx.3', turns: [{ by: 'a', dr: "I put together everything {b} said this week. None of it fits. So I said it in front of everyone." }] },
    { id: 'sx.4', turns: [{ by: 'b', say: "Can we talk about this privately?" }, { by: 'a', say: "No. You've had enough private conversations." }] },
    { id: 'sx.5', turns: [{ by: 'b', dr: "{a} exposed me in front of the whole house. I didn't see it coming." }] },
    { id: 'sx.6', turns: [{ by: 'a', say: "Tell the story again, {b}. The one you told me yesterday." }, { beat: '{b} starts. The story is different this time.' }] },
    { id: 'sx.8', turns: [{ by: 'a', say: "Everyone who {b} promised safety this week, put your hand up." }, { beat: 'Too many hands go up.' }] },
    { id: 'sx.9', turns: [{ by: 'a', say: "I'm not doing this to be cruel. I'm doing it because {b} has been lying to all of us." }, { by: 'b', say: "That's not fair." }] },
    { id: 'sx.10', turns: [{ by: 'b', say: "I can explain." }, { by: 'a', say: "Go on, then. Everyone's listening." }, { beat: '{b} cannot explain.' }] },
    { id: 'sx.7', when: { intent: 'double' }, turns: [{ by: 'a', say: "{b} has promised final two to more than one person in this room." }, { by: 'b', say: "That's a lie." }, { beat: '{target} and {partner} look at each other.' }] },
  ],
  'scheme.whisper.spread': [
    { id: 'sw.1', turns: [{ by: 'a', say: "I'm just asking. What happens if {target} wins HOH next week?" }, { beat: 'Nobody has a good answer.' }] },
    { id: 'sw.2', turns: [{ by: 'a', dr: "I never said 'vote out {target}'. I just asked the right questions. Now everyone's saying it themselves." }] },
    { id: 'sw.3', turns: [{ beat: '{a} pulls people aside one at a time.' }, { by: 'a', say: "Doesn't {target} have a lot of friends in here?" }] },
    { id: 'sw.4', turns: [{ by: 'a', dr: "In one room I talked about {target}'s comp wins. In another, {target}'s deals. Different reasons. Same name." }] },
    { id: 'sw.5', turns: [{ by: 'a', say: "I'm not saying anything. I'm just saying keep an eye on {target}." }] },
    { id: 'sw.7', turns: [{ by: 'a', say: "Has {target} ever told you who {target} would nominate?" }, { beat: 'Nobody can say for sure.' }, { by: 'a', say: "Funny, that." }] },
    { id: 'sw.8', turns: [{ by: 'a', dr: "I'm not attacking {target}. I'm just making sure everyone keeps thinking about {target}." }] },
    { id: 'sw.9', turns: [{ by: 'a', say: "Don't you think {target} has had it a bit easy so far?" }] },
    { id: 'sw.6', turns: [{ by: 'a', dr: "By tonight, people who never talked to each other will all be worried about {target}." }] },
  ],
  'scheme.whisper.exposed': [
    { id: 'sw.e1', turns: [{ by: 'a', say: "Three people asked me the same question today. Same words. All from you." }, { by: 'b', say: "I don't know what you mean." }] },
    { id: 'sw.e2', turns: [{ by: 'a', dr: "Everyone's suddenly worried about me. I asked who started it. Every answer was {b}." }] },
    { id: 'sw.e3', turns: [{ by: 'a', say: "Who first said my name to you?" }, { beat: 'Two people answer at once: {b}.' }] },
    { id: 'sw.e4', turns: [{ by: 'a', say: "If you've got a problem with me, say it to me." }, { by: 'b', say: "I haven't got a problem with you." }, { by: 'a', say: "Then stop telling everyone you do." }] },
    { id: 'sw.e5', turns: [{ by: 'b', dr: "{a} worked out where all the talk was coming from. I should have been more careful." }] },
    { id: 'sw.e6', turns: [{ by: 'a', dr: "Breakfast, the backyard, before bed. The same doubts about me in three places. {b} was in all three." }] },
  ],
  'scheme.rally.scene': [
    { id: 'sr.1', turns: [{ by: 'a', say: "If we split our votes, {target} stays. Is that what we want?" }, { beat: 'Nobody says yes.' }] },
    { id: 'sr.2', turns: [{ by: 'a', say: "Who here feels safe with {target} still in the house?" }, { beat: 'Silence.' }, { by: 'a', say: "That's what I thought." }] },
    { id: 'sr.3', turns: [{ by: 'a', dr: "I went room to room making the case against {target}. A few people agreed straight away. The rest are counting." }] },
    { id: 'sr.4', turns: [{ by: 'a', say: "This isn't a favour to me. This is about who gets to next week." }] },
    { id: 'sr.5', turns: [{ by: 'a', say: "{target} has a deal with someone in this room. Maybe more than one. Think about that." }] },
    { id: 'sr.6', turns: [{ by: 'a', dr: "I stopped whispering and said it out loud. {target} has to go. Now everyone has to pick a side." }] },
    { id: 'sr.8', turns: [{ by: 'a', say: "I'll say it out loud. I want {target} gone this week." }, { beat: 'A few people nod. A few look at the floor.' }] },
    { id: 'sr.9', turns: [{ by: 'a', say: "Think about who {target} would put up next week." }, { beat: 'The room goes quiet while everyone thinks about it.' }] },
    { id: 'sr.10', turns: [{ by: 'a', dr: "If {target} stays, half of us are in trouble. I just had to make everyone see it." }] },
    { id: 'sr.11', turns: [{ by: 'a', say: "We keep saying 'next week'. Next week might be too late." }] },
    { id: 'sr.7', turns: [{ by: 'a', say: "Let's count. Who's voting {target} out?" }, { beat: 'Hands go up, one by one.' }] },
  ],
  'scheme.majority.fooled': [
    { id: 'sm.f1', turns: [{ by: 'a', say: "It's settled. Everyone's voting {target} out." }, { by: 'b', say: "Everyone?" }, { by: 'a', say: "Everyone. Just keep it quiet." }] },
    { id: 'sm.f2', turns: [{ by: 'a', say: "The vote changed an hour ago. It's {target} now." }, { by: 'b', say: "Nobody told me." }, { by: 'a', say: "I'm telling you." }] },
    { id: 'sm.f3', turns: [{ by: 'a', say: "Don't go asking around. People are nervous." }, { by: 'b', say: "Okay. I won't." }] },
    { id: 'sm.f4', turns: [{ by: 'b', dr: "{a} walked me through the whole vote. Everyone's on {target}. I'm glad I'm not the odd one out." }] },
    { id: 'sm.f5', turns: [{ by: 'a', dr: "I gave {b} a vote count. Every name was in the right place. None of it was real." }] },
    { id: 'sm.f6', turns: [{ by: 'a', say: "You're the last one we're telling. It's {target}." }, { by: 'b', say: "Then I'm in." }] },
  ],
  'scheme.majority.refused': [
    { id: 'sm.r1', turns: [{ by: 'a', say: "Everyone's voting {target} out." }, { by: 'b', say: "Name them." }, { beat: '{a} names them. One name is wrong.' }, { by: 'b', say: "I don't think so." }] },
    { id: 'sm.r2', turns: [{ by: 'a', say: "Don't check with anyone. It'll make people nervous." }, { by: 'b', dr: "So I checked with everyone." }] },
    { id: 'sm.r3', turns: [{ by: 'b', say: "Why has nobody else mentioned this all day?" }, { by: 'a', say: "Because it's quiet." }, { by: 'b', say: "Or because it's not real." }] },
    { id: 'sm.r4', turns: [{ by: 'b', dr: "{a} gave me a perfect vote count. Too perfect. I asked one person on it. They'd never heard of the plan." }] },
    { id: 'sm.r5', turns: [{ by: 'a', dr: "{b} checked my numbers. I didn't think {b} would." }] },
    { id: 'sm.r6', turns: [{ by: 'b', say: "I just spoke to two people on your list. Neither of them has heard of this plan." }, { by: 'a', say: "...They must have forgotten." }] },
  ],
  'scheme.kiss.setup': [
    { id: 'sv.s1', turns: [{ beat: '{partner} asks {c} for help with something in another room.' }, { by: 'a', say: "Mind if I sit here?" }, { by: 'b', say: "...Sure." }, { beat: '{c} comes back early.' }, { by: 'c', say: "What's going on?" }] },
    { id: 'sv.s2', turns: [{ beat: 'While {partner} keeps {c} busy, {a} moves very close to {b}.' }, { by: 'c', dr: "I walked back in and they were sitting so close. I don't know what I saw. But I saw it." }] },
    { id: 'sv.s3', turns: [{ by: 'a', say: "You know you're my favourite person in here, right?" }, { by: 'b', say: "Don't say that." }, { beat: '{c} is standing in the doorway.' }] },
    { id: 'sv.s4', turns: [{ by: 'a', dr: "{partner} got {c} out of the room. I did the rest. I didn't need it to be real. I needed {c} to see it." }] },
    { id: 'sv.s5', turns: [{ beat: '{a} leans in to {b}. {b} doesn\'t move away fast enough.' }, { by: 'c', say: "Seriously?" }] },
    { id: 'sv.s6', turns: [{ by: 'c', dr: "{partner} kept me outside for twenty minutes for no reason. When I came back, I worked out why." }] },
  ],
  'scheme.kiss.failed': [
    { id: 'sv.f1', turns: [{ by: 'a', say: "Want to go somewhere quiet?" }, { by: 'b', say: "No. Who put you up to this?" }] },
    { id: 'sv.f2', turns: [{ by: 'b', dr: "People kept leaving the room so {a} and I would be alone. I'm not stupid." }] },
    { id: 'sv.f3', turns: [{ by: 'a', say: "You look nice today." }, { by: 'b', say: "I know what you're doing." }, { beat: '{b} walks away.' }] },
    { id: 'sv.f4', turns: [{ by: 'a', dr: "{b} saw straight through it. That's not going to happen now." }] },
    { id: 'sv.f5', turns: [{ by: 'b', say: "Why are you suddenly so interested in me?" }, { by: 'a', say: "Can't I be?" }, { by: 'b', say: "Not this week, no." }] },
    { id: 'sv.f6', turns: [{ by: 'b', dr: "Somebody set that up. I'm going straight to the person I'm actually with." }] },
  ],
  'scheme.kiss.heartbroken': [
    { id: 'sv.h1', turns: [{ by: 'a', say: "I saw you." }, { by: 'b', say: "It's not what it looked like." }, { by: 'a', say: "Then what was it?" }] },
    { id: 'sv.h2', turns: [{ by: 'a', say: "Was it planned?" }, { by: 'b', say: "No!" }, { by: 'a', say: "Then why didn't you move away?" }, { beat: '{b} doesn\'t answer.' }] },
    { id: 'sv.h3', turns: [{ by: 'a', dr: "I don't know what to believe. I know what I saw." }] },
    { id: 'sv.h4', turns: [{ by: 'b', say: "Please. Let me explain." }, { by: 'a', say: "Not now." }, { beat: '{a} walks out.' }] },
    { id: 'sv.h5', turns: [{ by: 'b', dr: "I didn't do anything. But {a} won't even look at me." }] },
    { id: 'sv.h6', turns: [{ by: 'a', say: "Was any of it real? Us?" }, { by: 'b', say: "Of course it was." }, { by: 'a', say: "It didn't look like it." }] },
  ],
  'scheme.kiss.over': [
    { id: 'sv.o1', turns: [{ by: 'a', say: "We're done." }, { by: 'b', say: "Please, just let me..." }, { by: 'a', say: "No." }] },
    { id: 'sv.o2', turns: [{ by: 'a', dr: "It's over between me and {b}. I can't trust {b} any more." }] },
    { id: 'sv.o3', turns: [{ by: 'b', say: "Can we talk?" }, { by: 'a', say: "There's nothing left to say." }] },
    { id: 'sv.o4', turns: [{ by: 'b', dr: "Somebody broke us up on purpose. And it worked." }] },
    { id: 'sv.o5', turns: [{ by: 'a', say: "I'm moving beds." }, { by: 'b', say: "You don't have to do that." }, { by: 'a', say: "Yes, I do." }] },
    { id: 'sv.o6', turns: [{ by: 'a', dr: "I came in here to play a game. I let {b} distract me. Not any more." }] },
  ],
  'scheme.accuse.landed': [
    { id: 'sz.l1', turns: [{ by: 'a', say: "Ask {target} about final-two deals. Then ask somebody else the same thing." }, { by: 'b', say: "What do you mean?" }, { by: 'a', say: "You'll get a different answer." }] },
    { id: 'sz.l2', turns: [{ by: 'a', say: "{target} has promised final two to half this house." }, { by: 'b', say: "Seriously?" }, { by: 'a', say: "Go and check." }] },
    { id: 'sz.l3', turns: [{ by: 'b', dr: "{a} says {target} has final-two deals all over the house. If that's true, {target} has to go." }] },
    { id: 'sz.l4', turns: [{ by: 'a', dr: "There's no web of deals. I made it up. But {b} believes it, and that's what counts." }] },
    { id: 'sz.l5', turns: [{ by: 'a', say: "How many final twos do you think {target} has?" }, { by: 'b', say: "...One?" }, { by: 'a', say: "Keep thinking." }] },
    { id: 'sz.l6', when: { third: true }, turns: [{ by: 'a', say: "Just ask {target} about final-two deals." }, { by: 'b', say: "I will." }, { by: 'c', dr: "{a} is very keen for us to turn on {target}. I'd like to know why." }] },
  ],
  'scheme.accuse.flat': [
    { id: 'sz.f1', turns: [{ by: 'a', say: "{target} has final-two deals with loads of people." }, { by: 'b', say: "Name one." }, { by: 'a', say: "Well..." }, { by: 'b', say: "Name one." }] },
    { id: 'sz.f2', turns: [{ by: 'a', say: "How many people has {target} promised?" }, { by: 'b', say: "You brought it up. You tell us." }] },
    { id: 'sz.f3', turns: [{ by: 'b', dr: "{a} said {target} is double-dealing. {a} couldn't name a single deal." }] },
    { id: 'sz.f4', turns: [{ by: 'a', dr: "Nobody believed me about {target}. I should have had a better story ready." }] },
    { id: 'sz.f5', turns: [{ by: 'b', say: "Where's this coming from?" }, { by: 'a', say: "I just think people should know." }, { by: 'b', say: "Know what? You haven't said anything." }] },
    { id: 'sz.f6', when: { third: true }, turns: [{ by: 'a', say: "{target} is working everyone." }, { by: 'c', say: "Has {target} promised you anything?" }, { by: 'a', say: "...No." }, { by: 'c', say: "Then how do you know?" }] },
  ],
  'scheme.collapse.scene': [
    { id: 'sp.1', turns: [{ by: 'a', say: "I asked around. {b} hasn't got a single final-two deal with anyone." }, { by: 'b', say: "I told you." }, { by: 'a', say: "{c}, where did that story come from?" }] },
    { id: 'sp.2', turns: [{ by: 'b', say: "Who told you I had all these deals?" }, { beat: 'Everyone turns to look at {c}.' }] },
    { id: 'sp.3', turns: [{ by: 'a', dr: "I checked every deal {c} said {b} had. None of them exist. {c} made the whole thing up." }] },
    { id: 'sp.4', turns: [{ by: 'c', say: "I only said what I heard." }, { by: 'a', say: "From who?" }, { beat: '{c} has no answer.' }] },
    { id: 'sp.5', turns: [{ by: 'b', dr: "{c} lied about me to half the house. Now everyone knows it. {c} is my target now." }] },
    { id: 'sp.6', turns: [{ by: 'a', say: "Has anyone actually got a final two with {b}?" }, { beat: 'Nobody does.' }, { by: 'b', say: "So that's a no, then." }] },
  ],
  'scheme.quiet.scene': [
    { id: 'sq.1', turns: [{ by: 'a', dr: "I had a plan for today. It didn't work. There's always tomorrow." }] },
    { id: 'sq.2', turns: [{ by: 'a', dr: "I tried something. Nobody took the bait. Fine." }] },
    { id: 'sq.3', turns: [{ by: 'a', dr: "Some days nothing works. Today was one of those days." }] },
    { id: 'sq.4', turns: [{ by: 'a', dr: "Nobody was in the mood to listen to me today. I'll try again when they are." }] },
    { id: 'sq.5', turns: [{ by: 'a', dr: "I started writing something. Then I thought better of it." }] },
    { id: 'sq.6', turns: [{ by: 'a', dr: "That went nowhere. Good thing nobody noticed I tried." }] },
  ],
};
