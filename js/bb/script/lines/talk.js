// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/talk.js — the house talking game (spec Phase 5)
// ══════════════════════════════════════════════════════════════════════
//
// Each family is one intent from spec §4.5, played by an existing event that
// keeps its own casting, weight and consequences; only the words moved here.
// The ENDING is what the event decided before a word was picked.
//
//   talk.campaign     deals-vote-pitch       a nominee works a voter
//                     a pitcher (on the block), b the voter, c the other nominee (when there is one)
//                     lands | refused
//   talk.final-two    deals-final-two        a and b say "final two" out loud
//                     made
//   talk.safety       deals-safety           safety bought in the HOH room
//                     a the HOH, b the houseguest
//                     deal (meant) | lie (the HOH has b on the list; b believes it) | seen (b does not)
//   talk.debrief      deals-numbers-check    two allies count the vote
//                     sure | shaky (a is not a natural counter)
//   talk.reaffirm     deals-reaffirm         an endgame deal said again
//                     solid | doubt | cut (a is planning to cut b; b buys it) | seen (b does not)
//   talk.confront     social-blow-up         a row in front of the house
//                     a the one who snaps, b the one it is aimed at
//                     volatile (a hot temper) | calculated (a strategist with the receipts) | general
//   talk.gossip       social-info-trade      a tells b something about c, who is not in the room
//                     traded
//   talk.comfort      social-comfort-block   a sits with b, who is on the block
//                     kind
//   talk.pitch-target power-hoh-pitch        a takes a name up to the HOH room
//                     a the pitcher, b the HOH, c the name (not in the room)
//                     lands | overplayed
//   talk.hoh-visit    power-hoh-room-court   the HOH room full after lights-out
//                     a the HOH, b (and c, when there is a third) up there with them
//                     court
//   talk.hoh-decide   power-hoh-deciding     the HOH says the name out loud for the first time
//                     a the HOH, b the confidant, c the name (not in the room)
//                     named
//
// Scripts, not templates: lines said out loud, Diary Room confessionals, and
// short stage directions. No line claims a history the record does not have.

export default {
  // ── a nominee works a voter ─────────────────────────────────────────
  'talk.campaign.lands': [
    { id: 'tc.l1', turns: [
      { by: 'a', say: "Can I steal you for five minutes?" },
      { by: 'b', say: "You've got three. Somebody's watching." },
      { by: 'a', say: "Then I'll be quick. If I go home this week, who do you think is next?" },
      { by: 'b', say: '...' },
      { by: 'a', say: "Exactly. Think about that before you vote." },
      { by: 'b', dr: "I walked in there with my mind made up. I walked out doing maths." },
    ] },
    { id: 'tc.l2', turns: [
      { by: 'a', say: "You don't owe me anything. I know that. I'm asking anyway." },
      { by: 'b', say: 'Okay. Ask.' },
      { by: 'a', say: "Keep me, and you've got somebody in this house who'll never write your name down. Ever." },
      { by: 'b', say: 'Never is a long time in here.' },
      { by: 'a', say: "Then hold me to it." },
    ] },
    { id: 'tc.l3', turns: [
      { by: 'b', say: "I'm not going to lie to you. Most people are voting you out." },
      { by: 'a', say: "Most people. Not everybody yet." },
      { by: 'b', say: "What would I get?" },
      { by: 'a', say: "Me, owing you. And I pay back." },
      { by: 'b', dr: "{a} didn't beg. {a.Sub} made it sound like a trade. I like trades." },
    ] },
    { id: 'tc.l4', turns: [
      { by: 'a', say: "Forget the vote for a second. What are you actually worried about in here?" },
      { by: 'b', say: 'Honestly? Being next.' },
      { by: 'a', say: "Then keep the person who's never come after you. That's me." },
      { by: 'b', say: "...That's not a bad point." },
    ] },
    { id: 'tc.l5', when: { third: true }, turns: [
      { by: 'a', say: "Can I tell you something about {c}?" },
      { by: 'b', say: 'Go on.' },
      { by: 'a', say: "{c} wins things. I don't. Who would you rather be sitting next to in a month?" },
      { by: 'b', dr: "I hate that {a} is right. I really hate it." },
    ] },
    { id: 'tc.l6', when: { third: true }, turns: [
      { by: 'a', say: "Everyone keeps telling me {c} is the safe vote." },
      { by: 'b', say: 'Isn\'t {c}?' },
      { by: 'a', say: "Safe for who? Not for you. Ask {c} who {c} wants out next. Then ask me." },
      { by: 'b', say: "...Okay. I'll ask." },
    ] },
    { id: 'tc.l7', when: { room: ['bedroom'] }, turns: [
      { beat: '{a} sits down on the end of {b}\'s bed without being asked.' },
      { by: 'a', say: "One vote. That's all I need from you. One." },
      { by: 'b', say: "It's never just one vote." },
      { by: 'a', say: "It is this week. And next week, you'd have mine." },
      { by: 'b', dr: "I promised nothing. But I'm thinking about it, and I wasn't this morning." },
    ] },
    { id: 'tc.l8', turns: [
      { by: 'a', say: "I'm not going to tell you what to do. I'm going to tell you what I'd do in your seat." },
      { by: 'b', say: 'Which is?' },
      { by: 'a', say: "Keep the person who'll owe you. Not the one who'll forget you by Friday." },
      { by: 'b', say: "...You might be right." },
    ] },
    { id: 'tc.l9', when: { band: ['friends'] }, turns: [
      { by: 'b', say: "You know I want you to stay." },
      { by: 'a', say: 'Then I need you to say it to two more people.' },
      { by: 'b', say: "Who?" },
      { by: 'a', say: "The two who haven't decided. You've got more pull with them than I do." },
      { by: 'b', say: "Okay. Tonight." },
    ] },
    { id: 'tc.l10', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "I know we've never been close." },
      { by: 'b', say: "That's one way to put it." },
      { by: 'a', say: "So here's the thing. If I stay, I owe you. If I go, you've lost the one person in here who would." },
      { by: 'b', say: '...Huh.' },
      { by: 'b', dr: "It's the first time {a} has ever made sense to me. Annoying." },
    ] },
    { id: 'tc.l11', turns: [
      { by: 'a', say: "Can I be honest? I'm scared. I'm not going to pretend I'm not." },
      { by: 'b', say: "I'd be scared too." },
      { by: 'a', say: "I just want one more week to prove I'm worth keeping." },
      { by: 'b', say: 'Let me think about it. Properly.' },
    ] },
    { id: 'tc.l12', when: { late: true }, turns: [
      { by: 'a', say: "There aren't many of us left. You know who wins if I go, right?" },
      { by: 'b', say: 'Tell me who you think.' },
      { by: 'a', say: "Whoever has the most friends on the jury. And it isn't you. Not yet." },
      { by: 'b', dr: "That got under my skin. In a good way. Maybe." },
    ] },
    { id: 'tc.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Let me tell you what happens next week if I'm not here." },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "You become the easiest name in the house. I'm the only thing standing in front of you." },
      { by: 'b', dr: "I know {a} is playing me. The annoying thing is that {a} is also right." },
    ] },
    { id: 'tc.rf1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "I'm not going to beg. I'm just going to tell you: I'm a fighter, and you want a fighter on your side." },
      { by: 'b', say: "You're also a lot." },
      { by: 'a', say: "A lot of what? Loyalty? Yes!" },
      { by: 'b', say: "...Okay. Okay, I hear you." },
    ] },
    { id: 'tc.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "I'm sorry, I'm bad at this. Can I just... ask for your vote?" },
      { by: 'b', say: "You just did." },
      { by: 'a', say: "Was that okay?" },
      { by: 'b', dr: "That was the least polished pitch I've had all week. It's the only one I believed." },
    ] },
    { id: 'tc.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I'm not going to say anything bad about anybody. I just really want to stay with you guys." },
      { by: 'b', say: "That's it? No dirt on anyone?" },
      { by: 'a', say: "I don't do dirt." },
      { by: 'b', dr: "Everyone else came to me with a knife. {a} came with a hug. It worked, weirdly." },
    ] },
    { id: 'tc.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "Keep me and I'll win comps that protect you. Simple as that." },
      { by: 'b', say: "Or you'll win comps that protect you." },
      { by: 'a', say: "Both. Both is fine." },
    ] },
    { id: 'tc.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "I'll keep this short. You've got two options. One of them helps you next week. It's me." },
      { by: 'b', say: "Prove it." },
      { by: 'a', say: "Count who the other one is close to. Then count who I'm close to." },
      { by: 'b', say: "...Huh." },
    ] },
  ],
  'talk.campaign.refused': [
    { id: 'tc.r1', turns: [
      { by: 'a', say: "Have you got a minute?" },
      { by: 'b', say: 'Sure.' },
      { by: 'a', say: "I just want to know where your head's at for Thursday." },
      { by: 'b', say: "I'm still thinking." },
      { by: 'a', dr: "\"Still thinking\" is how people say no in this house." },
    ] },
    { id: 'tc.r2', turns: [
      { by: 'b', say: "I hear you. I do." },
      { by: 'a', say: "But?" },
      { by: 'b', say: "But I made a promise to somebody else this week, and I'm keeping it." },
      { by: 'a', say: "Okay. Thanks for telling me." },
    ] },
    { id: 'tc.r3', turns: [
      { by: 'a', say: "Can I count on you?" },
      { by: 'b', say: 'You can count on me to think about it.' },
      { by: 'a', say: "That's not the same thing." },
      { by: 'b', say: "No. It isn't." },
    ] },
    { id: 'tc.r4', turns: [
      { by: 'a', say: "So I'm thinking, if you keep me, you and I could really—" },
      { by: 'b', say: "{a}. Stop. I already know what I'm doing." },
      { by: 'a', say: "...Right." },
      { by: 'a', dr: "I pushed too hard. I could see it on {b.posAdj} face. I just couldn't stop talking." },
    ] },
    { id: 'tc.r5', turns: [
      { beat: '{b} keeps folding laundry all the way through the pitch.' },
      { by: 'a', say: "Are you even listening?" },
      { by: 'b', say: "I'm listening. I'm just not moving." },
    ] },
    { id: 'tc.r6', when: { third: true }, turns: [
      { by: 'a', say: "Honestly, {c} is the bigger threat. You know that." },
      { by: 'b', say: "Maybe. But {c} has never lied to me." },
      { by: 'a', say: 'And I have?' },
      { by: 'b', say: "I didn't say that." },
      { by: 'a', dr: "{b.Sub} didn't have to." },
    ] },
    { id: 'tc.r7', turns: [
      { by: 'a', say: "Just tell me straight. Am I going home?" },
      { by: 'b', say: "I don't control the house." },
      { by: 'a', say: "That's a yes." },
      { by: 'b', say: "It's a \"I don't control the house\"." },
    ] },
    { id: 'tc.r8', when: { band: ['cold', 'enemies'] }, turns: [
      { by: 'a', say: "I know we haven't always got on—" },
      { by: 'b', say: "We've never got on." },
      { by: 'a', say: "Then let's start now." },
      { by: 'b', say: "On the week you need my vote? Come on, {a}." },
    ] },
    { id: 'tc.r9', when: { band: ['friends'] }, turns: [
      { by: 'a', say: "Please tell me you're with me." },
      { by: 'b', say: "I love you. You know I do." },
      { by: 'a', say: "That's not an answer." },
      { by: 'b', say: '...I know.' },
      { by: 'a', dr: "If {b} isn't voting for me, then nobody in this house is." },
    ] },
    { id: 'tc.r10', turns: [
      { by: 'a', say: "What would it take?" },
      { by: 'b', say: "Honestly? More than you've got." },
      { by: 'a', say: 'Wow.' },
      { by: 'b', say: "I'm sorry. You asked." },
    ] },
    { id: 'tc.r11', turns: [
      { by: 'a', say: "I'll keep it short. I'd like your vote." },
      { by: 'b', say: "I'll keep it short too. I can't." },
      { by: 'a', dr: "At least {b} was honest. That's more than I got from anyone else today." },
    ] },
    { id: 'tc.r12', when: { late: true }, turns: [
      { by: 'a', say: "This late, you need every friend you can get. I'm a friend." },
      { by: 'b', say: "This late, I need fewer people who can beat me." },
      { by: 'a', say: "...Fair." },
    ] },
    { id: 'tc.rs2', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "You know I could make your life very easy in here." },
      { by: 'b', say: "That sounded like a threat." },
      { by: 'a', say: "It was a promise." },
      { by: 'b', dr: "With {a} there's no difference. That's exactly why I'm voting {a.obj} out." },
    ] },
    { id: 'tc.rf2', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "So that's it? You're just going to let them push me out?" },
      { by: 'b', say: "Lower your voice." },
      { by: 'a', say: "No! I'm sick of lowering my voice!" },
      { by: 'b', dr: "And that is why I'm not voting to keep {a}." },
    ] },
    { id: 'tc.ry2', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Is there... anything I could say?" },
      { by: 'b', say: "I'm sorry. I don't think so." },
      { by: 'a', say: "Okay. Thanks for being honest." },
    ] },
    { id: 'tc.rw2', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I'm not going to pressure you. I just wanted you to know I'd love to stay." },
      { by: 'b', say: "I know. And I'm really sorry." },
      { by: 'a', say: "Don't be sorry. Play your game." },
    ] },
    { id: 'tc.rc2', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "You'd rather keep someone who can't win a single comp?" },
      { by: 'b', say: "Yes. That's exactly what I'd rather." },
      { by: 'a', say: "...Oh." },
    ] },
    { id: 'tc.rk2', when: { register: 'cool' }, turns: [
      { by: 'a', say: "Walk me through it. Why them over me?" },
      { by: 'b', say: "Because you'd see me coming." },
      { by: 'a', say: "That's a compliment and a no." },
      { by: 'b', say: "That's exactly what it is." },
    ] },
  ],

  // ── a final two, said out loud ──────────────────────────────────────
  'talk.final-two.made': [
    { id: 'tf.m1', turns: [
      { by: 'a', say: "I need to say something, and I need you to not laugh." },
      { by: 'b', say: "I'm not laughing." },
      { by: 'a', say: "Final two. You and me. Whatever happens." },
      { by: 'b', say: "Whatever happens." },
      { by: 'a', dr: "Nobody wrote it down. We both know every word of it." },
    ] },
    { id: 'tf.m2', turns: [
      { by: 'a', say: "Is this a final two? What we've got?" },
      { by: 'b', say: "I assumed it already was." },
      { by: 'a', say: "Then let's say it properly." },
      { beat: 'They shake on it. Then they hug, because a handshake felt too small.' },
    ] },
    { id: 'tf.m3', turns: [
      { by: 'a', say: "If it's us at the end, I'm not going to feel bad about beating you." },
      { by: 'b', say: "You won't beat me." },
      { by: 'a', say: "We'll see. Final two?" },
      { by: 'b', say: 'Final two.' },
    ] },
    { id: 'tf.m4', when: { room: ['bedroom'] }, turns: [
      { beat: 'Lights out. {a} whispers across the gap between the beds.' },
      { by: 'a', say: "You awake?" },
      { by: 'b', say: 'No.' },
      { by: 'a', say: "Final two. I mean it." },
      { by: 'b', say: "...Me too. Go to sleep." },
    ] },
    { id: 'tf.m5', turns: [
      { by: 'a', say: "I don't want to get to the end next to somebody I don't respect." },
      { by: 'b', say: 'Is that a compliment?' },
      { by: 'a', say: "It's a final two. Take it or leave it." },
      { by: 'b', say: "I'll take it." },
      { by: 'b', dr: "{a} has been hinting at it for days. I'm glad {a} finally said it out loud." },
    ] },
    { id: 'tf.m6', turns: [
      { by: 'b', say: "Can I ask you something big?" },
      { by: 'a', say: "You want a final two." },
      { by: 'b', say: "...How did you know?" },
      { by: 'a', say: "Because I was about to ask you the same thing." },
    ] },
    { id: 'tf.m7', turns: [
      { by: 'a', say: "Pinky promise. I know it's stupid." },
      { by: 'b', say: "It's not stupid if you mean it." },
      { by: 'a', say: "I mean it. You and me at the end." },
      { beat: 'They link little fingers, and both of them look away from the camera.' },
    ] },
    { id: 'tf.m8', turns: [
      { by: 'a', say: "Here's my question. If you won the last HOH, who would you take?" },
      { by: 'b', say: "You. Easy." },
      { by: 'a', say: "Then we've got a final two." },
      { by: 'a', dr: "{b} answered too fast to be lying. I hope." },
    ] },
    { id: 'tf.m9', when: { showmance: true }, turns: [
      { by: 'b', say: "People are going to say we're only doing this because we're together." },
      { by: 'a', say: "Let them. Final two, together or not." },
      { by: 'b', say: "Together or not." },
      { by: 'b', dr: "That's the most romantic thing anyone has ever said to me, and it was about a game show." },
    ] },
    { id: 'tf.m10', when: { alliance: true }, turns: [
      { by: 'a', say: "The alliance is great. But I need to know who I'm sitting next to at the end." },
      { by: 'b', say: "Me." },
      { by: 'a', say: "Just you. Not the group." },
      { by: 'b', say: "Just me. Final two." },
    ] },
    { id: 'tf.m11', when: { late: true }, turns: [
      { by: 'a', say: "There's not many of us left. I need to know where you'll be at the end." },
      { by: 'b', say: "Next to you." },
      { by: 'a', say: "Promise me." },
      { by: 'b', say: 'I promise. Final two.' },
    ] },
    { id: 'tf.m12', turns: [
      { by: 'a', say: "Say it. Out loud. So I know it's real." },
      { by: 'b', say: "Final two, {a}. You and me." },
      { by: 'a', say: 'Okay. Okay. Good.' },
      { by: 'a', dr: "In this house, saying it out loud is basically a wedding." },
    ] },
  ],

  // ── safety, bought in the HOH room ─────────────────────────────────
  'talk.safety.deal': [
    { id: 'ts.d1', turns: [
      { by: 'b', say: "I'll keep it simple. Leave me off the block, and I leave you alone next week." },
      { by: 'a', say: "Say that again. Slowly." },
      { by: 'b', say: "No nomination now. No shot back if I win." },
      { by: 'a', say: 'Deal.' },
    ] },
    { id: 'ts.d2', turns: [
      { by: 'b', say: "Am I going up? Just tell me." },
      { by: 'a', say: "No. As long as you leave me alone next week." },
      { by: 'b', say: "Done. Done, before you change your mind." },
    ] },
    { id: 'ts.d3', turns: [
      { by: 'a', say: "You keep my name out of next week, and I keep yours off that screen." },
      { by: 'b', say: "Does that include if the veto gets used?" },
      { by: 'a', say: "It includes the replacement. You're safe with me." },
      { beat: 'They shake on it.' },
    ] },
    { id: 'ts.d4', turns: [
      { by: 'b', say: "I came up here ready to beg." },
      { by: 'a', say: "Don't. I've got an offer instead." },
      { by: 'a', say: "One week, both ways. I don't touch you, you don't touch me." },
      { by: 'b', say: "...Can you say that one more time? I want to remember it exactly." },
    ] },
    { id: 'ts.d5', turns: [
      { by: 'a', say: "I'm not coming after you this week." },
      { by: 'b', say: 'Why not?' },
      { by: 'a', say: "Because I'd rather have you owe me than hate me." },
      { by: 'b', dr: "I've never been so happy to owe somebody something." },
    ] },
    { id: 'ts.d6', turns: [
      { by: 'b', say: "What do you want from me?" },
      { by: 'a', say: "Next week. If you win, I'm not on your list." },
      { by: 'b', say: "That's it?" },
      { by: 'a', say: "That's it. That's a lot, in here." },
    ] },
    { id: 'ts.d7', when: { band: ['friends'] }, turns: [
      { by: 'b', say: "I know you're not putting me up. I just wanted to hear it." },
      { by: 'a', say: "I'm not putting you up." },
      { by: 'b', say: "And next week?" },
      { by: 'a', say: "Next week, you return the favour." },
    ] },
    { id: 'ts.d8', turns: [
      { beat: '{b} knocks on the HOH room door and waits to be told to come in.' },
      { by: 'b', say: "Five minutes, and then I'll leave you alone." },
      { by: 'a', say: "Sit down. I think we can both get what we want here." },
    ] },
  ],
  'talk.safety.lie': [
    { id: 'ts.l1', turns: [
      { by: 'a', say: "You keep my name out of next week, and I keep yours out of the box." },
      { by: 'b', say: "Deal. Thank you. Really." },
      { beat: 'They shake on it. {b} leaves smiling.' },
      { by: 'a', dr: "{b} is at the top of my list. I just need {b.obj} calm until the ceremony." },
    ] },
    { id: 'ts.l2', turns: [
      { by: 'b', say: "So I'm good this week?" },
      { by: 'a', say: "You're good. I promise." },
      { by: 'b', say: 'Okay. I trust you.' },
      { by: 'a', dr: "\"I trust you\". That's going to sting if I do what I'm planning." },
    ] },
    { id: 'ts.l3', turns: [
      { by: 'a', say: "I'd never put you up. You know that." },
      { by: 'b', say: "I do. I just needed to hear it." },
      { beat: 'The door closes behind {b}. {a} goes back to the list on the desk, where one name is already circled.' },
    ] },
    { id: 'ts.l4', turns: [
      { by: 'b', say: "Promise me I'm safe." },
      { by: 'a', say: "Promise." },
      { by: 'a', dr: "I've made a lot of promises today. Not all of them were the kind you keep." },
    ] },
    { id: 'ts.l5', turns: [
      { by: 'a', say: "You and me are fine. Go and enjoy your week." },
      { by: 'b', say: "That's the best thing anyone's said to me in days." },
      { by: 'a', dr: "It's easier to put somebody up when they're not expecting it. Fewer speeches." },
    ] },
    { id: 'ts.l6', turns: [
      { by: 'b', say: "I'm not going up, right?" },
      { by: 'a', say: "Why would you go up? Relax." },
      { by: 'b', say: "Okay. Okay. Thank you." },
      { by: 'a', dr: "I didn't say no. I said relax. There's a difference, and {b} will find out what it is." },
    ] },
    { id: 'ts.l7', turns: [
      { by: 'a', say: "Deal. One week each way." },
      { by: 'b', say: "Shake on it?" },
      { by: 'a', say: "Shake on it." },
      { by: 'a', dr: "Handshakes are free. Nominations aren't." },
    ] },
  ],
  'talk.safety.seen': [
    { id: 'ts.s1', turns: [
      { by: 'a', say: "You've got nothing to worry about this week." },
      { by: 'b', say: "Great. Deal." },
      { by: 'b', dr: "I smiled and shook {a.posAdj} hand. I'm packing my bag in my head on the way downstairs." },
    ] },
    { id: 'ts.s2', turns: [
      { by: 'a', say: "Keep me safe next week and you're safe now. Easy." },
      { by: 'b', say: "Sure. Deal." },
      { by: 'b', dr: "A promise from a Head of Household is a weather forecast. Nice to hear. Means nothing." },
    ] },
    { id: 'ts.s3', turns: [
      { by: 'a', say: "I'd never put you up." },
      { by: 'b', say: "Okay." },
      { by: 'a', say: "You don't believe me." },
      { by: 'b', say: "I believe you said it." },
    ] },
    { id: 'ts.s4', turns: [
      { by: 'a', say: "Deal?" },
      { by: 'b', say: "Deal." },
      { beat: '{b} holds eye contact one second longer than a friend would.' },
      { by: 'b', dr: "Now I've got a promise I can wave around when it gets broken. That's all this was." },
    ] },
    { id: 'ts.s5', turns: [
      { by: 'b', say: "Am I safe?" },
      { by: 'a', say: "Of course you're safe." },
      { by: 'b', dr: "\"Of course.\" Nobody says \"of course\" about something they actually mean." },
    ] },
    { id: 'ts.s6', turns: [
      { by: 'a', say: "We're good. You're not going anywhere." },
      { by: 'b', say: 'Good to know.' },
      { by: 'b', dr: "I've counted the house. I know whose name is in {a.posAdj} head. Saying no would only make it sooner." },
    ] },
    { id: 'ts.s7', turns: [
      { by: 'a', say: "Trust me." },
      { by: 'b', say: "I'm trying." },
      { by: 'a', say: "Try harder." },
      { by: 'b', dr: "When somebody tells you to trust them twice, don't." },
    ] },
  ],

  // ── two allies count the vote ─────────────────────────────────────
  'talk.debrief.sure': [
    { id: 'tn.s1', when: { late: false }, turns: [
      { by: 'a', say: "Say the names." },
      { by: 'b', say: "Us two, plus the three in the bedroom." },
      { by: 'a', say: "That's five. Five is enough." },
      { by: 'b', say: "Five is enough." },
    ] },
    { id: 'tn.s2', turns: [
      { by: 'a', say: "Count it again." },
      { by: 'b', say: "We've counted it four times." },
      { by: 'a', say: "Then a fifth won't hurt." },
      { beat: 'They count on their fingers. Same answer.' },
    ] },
    { id: 'tn.s3', turns: [
      { by: 'b', say: "Are we good for Thursday?" },
      { by: 'a', say: "We've had the votes since yesterday. I'm just making sure nobody wobbles." },
      { by: 'b', say: "Who's most likely to wobble?" },
      { by: 'a', say: "The one who agreed fastest. Always." },
    ] },
    { id: 'tn.s4', turns: [
      { by: 'a', say: "The whole week comes down to one person." },
      { by: 'b', say: 'Who?' },
      { by: 'a', say: "The one who hasn't said a name to anybody. Silence is a vote too." },
      { by: 'b', say: "Then we talk to them tonight, before anyone else does." },
    ] },
    { id: 'tn.s5', turns: [
      { by: 'a', say: "Nobody does anything weird this week. We just let it happen." },
      { by: 'b', say: "That's the scariest part. Waiting." },
      { by: 'a', dr: "We have the votes. I know we have the votes. I'm still going to count them again before bed." },
    ] },
    { id: 'tn.s6', turns: [
      { by: 'b', say: "What if they flip?" },
      { by: 'a', say: "Then we lose one vote and we still win. I've counted for that too." },
      { by: 'b', say: "You're a little bit scary." },
      { by: 'a', say: "Thank you." },
    ] },
    { id: 'tn.s7', when: { alliance: true }, turns: [
      { by: 'a', say: "Everybody in the alliance has confirmed. All of them." },
      { by: 'b', say: "In person, or through someone?" },
      { by: 'a', say: "In person. I asked every one of them to say it to my face." },
    ] },
    { id: 'tn.s8', when: { late: true }, turns: [
      { by: 'a', say: "With this few people, one vote is everything. We've got it. Barely." },
      { by: 'b', say: "Barely still counts." },
      { by: 'a', say: "Barely is how people go home." },
    ] },
  ],
  'talk.debrief.shaky': [
    { id: 'tn.k1', turns: [
      { by: 'a', say: "So that's... five? Or four?" },
      { by: 'b', say: "Who are you counting twice?" },
      { by: 'a', say: "...I don't know. Start again." },
    ] },
    { id: 'tn.k2', turns: [
      { by: 'a', say: "We've definitely got the votes. Definitely. Probably." },
      { by: 'b', say: "Which is it?" },
      { by: 'a', say: "Definitely probably." },
      { by: 'b', dr: "That is not a sentence that makes me feel safe." },
    ] },
    { id: 'tn.k3', turns: [
      { by: 'b', say: "Did you actually ask them, or did you just assume?" },
      { by: 'a', say: "I... assumed very strongly." },
      { by: 'b', say: "Go and ask them." },
    ] },
    { id: 'tn.k4', turns: [
      { by: 'a', say: "Everybody said they were with us." },
      { by: 'b', say: "Everybody says that to everybody." },
      { by: 'a', say: "...Oh no." },
    ] },
    { id: 'tn.k5', turns: [
      { beat: '{a} counts on {a.posAdj} fingers, gets to the end, and starts again.' },
      { by: 'b', say: "You've done that three times." },
      { by: 'a', say: "Because I keep getting a different number." },
    ] },
    { id: 'tn.k6', turns: [
      { by: 'a', say: "I think we're fine." },
      { by: 'b', say: "You think." },
      { by: 'a', say: "I think very confidently." },
      { by: 'a', dr: "I'm not good at numbers. I'm good at people. Right now I'm not sure I'm good at either." },
    ] },
    { id: 'tn.k7', turns: [
      { by: 'b', say: "Who's the swing vote?" },
      { by: 'a', say: "There isn't one. Or there's three. Depends who you believe." },
      { by: 'b', say: "That's the worst answer you could have given me." },
    ] },
    { id: 'tn.k8', when: { late: true }, turns: [
      { by: 'a', say: "There's so few of us, it should be easy to count." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And it's somehow harder." },
    ] },
  ],

  // ── an endgame deal, said again ───────────────────────────────────
  'talk.reaffirm.solid': [
    { id: 'tr.s1', turns: [
      { by: 'a', say: "Still us?" },
      { by: 'b', say: "Still us. To the end." },
      { by: 'a', say: "Good. That's all I needed." },
    ] },
    { id: 'tr.s2', turns: [
      { beat: '{a} bumps {b}\'s shoulder on the way past. {b} nods once.' },
      { by: 'a', dr: "We don't even have to talk about it any more. That nod is the whole conversation." },
    ] },
    { id: 'tr.s3', turns: [
      { by: 'a', say: "We good?" },
      { by: 'b', say: "We're good." },
      { by: 'a', say: "Just checking." },
      { by: 'b', say: "You check every day." },
      { by: 'a', say: "And every day you say we're good. I like hearing it." },
    ] },
    { id: 'tr.s4', turns: [
      { by: 'a', say: "Let's do the order. Who goes next, in a perfect world?" },
      { by: 'b', say: "Honestly? We agree on everyone except one." },
      { by: 'a', say: "Then we argue about the one." },
      { beat: 'They argue about the one for five minutes, and leave with a plan they can both repeat.' },
    ] },
    { id: 'tr.s5', turns: [
      { by: 'b', say: "Do you ever worry I'll turn on you?" },
      { by: 'a', say: "No. Should I?" },
      { by: 'b', say: "No. I just wanted to hear you say no." },
    ] },
    { id: 'tr.s6', turns: [
      { by: 'a', say: "If one of us wins HOH this week, nothing changes." },
      { by: 'b', say: "Nothing changes." },
      { by: 'a', say: "Say it like you mean it." },
      { by: 'b', say: "Nothing. Changes." },
    ] },
    { id: 'tr.s7', turns: [
      { by: 'b', say: "You know what I like about us? No drama." },
      { by: 'a', say: "Don't say that. You'll jinx it." },
      { by: 'b', say: "Fine. Some drama. Very small drama." },
    ] },
    { id: 'tr.s8', turns: [
      { by: 'a', dr: "{b} is the only person in this house I don't have to double-check. Do you know how rare that is in here?" },
      { by: 'a', say: "Hey. Thanks for being normal." },
      { by: 'b', say: "That's the nicest thing anyone's said to me all week." },
    ] },
    { id: 'tr.s9', when: { showmance: true }, turns: [
      { by: 'b', say: "Promise me the game doesn't come between us." },
      { by: 'a', say: "The game is how we met. It doesn't get to break us up." },
      { by: 'b', say: "That's either really sweet or a bit cheesy." },
      { by: 'a', say: "It's both. Still us?" },
      { by: 'b', say: "Still us." },
    ] },
    { id: 'tr.s10', when: { late: true }, turns: [
      { by: 'a', say: "Look how few of us are left. And we're still here. Together." },
      { by: 'b', say: "We said we would be." },
      { by: 'a', say: "People say a lot of things in here. We meant ours." },
    ] },
    { id: 'tr.s11', turns: [
      { by: 'a', say: "Whatever anybody tells you about me this week, come to me first." },
      { by: 'b', say: "Always. Same goes for you." },
      { by: 'a', say: "Always." },
    ] },
    { id: 'tr.s12', when: { room: ['backyard'] }, turns: [
      { beat: '{a} and {b} sit on the backyard couch, saying nothing, watching the pool.' },
      { by: 'b', say: "This is the only part of the day where I'm not scared." },
      { by: 'a', say: "Same. Don't tell anyone." },
    ] },
    { id: 'tr.s13', turns: [
      { by: 'b', say: "I had a nightmare that you flipped on me." },
      { by: 'a', say: "Did I win?" },
      { by: 'b', say: "That's not the point!" },
      { by: 'a', say: "I'm joking. Still us. Always." },
    ] },
    { id: 'tr.s14', turns: [
      { by: 'a', say: "Same plan as yesterday?" },
      { by: 'b', say: "Same plan as yesterday." },
      { by: 'a', say: "Good. I love a boring plan." },
    ] },
    { id: 'tr.s15', turns: [
      { by: 'a', say: "Whatever anyone says about me this week, it isn't true." },
      { by: 'b', say: "What are they going to say?" },
      { by: 'a', say: "No idea. Just getting in first." },
      { by: 'b', say: "Noted. Still us." },
    ] },
    { id: 'tr.s16', turns: [
      { beat: '{a} and {b} do a secret handshake that is clearly getting longer every week.' },
      { by: 'b', dr: "It started as a fist bump. It is now about twelve moves long. That's how you know it's real." },
    ] },
    { id: 'tr.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "You and me are the only real thing in this house." },
      { by: 'b', say: "I know." },
      { by: 'a', dr: "And I mean it. Which, for me, is very unusual." },
    ] },
    { id: 'tr.rf1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "If anybody comes for you, they come through me. I mean it." },
      { by: 'b', say: "I know you do. That's what scares everybody." },
    ] },
    { id: 'tr.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "I'm not good at saying it, but... you're my person in here." },
      { by: 'b', say: "You just said it fine." },
    ] },
    { id: 'tr.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I'd be so lost in here without you." },
      { by: 'b', say: "You'd be fine. You'd have adopted someone else by now." },
      { by: 'a', say: "Never. You're the original." },
    ] },
    { id: 'tr.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "Next comp, we both go hard. One of us wins it. Deal?" },
      { by: 'b', say: "Deal. Same plan as always." },
    ] },
    { id: 'tr.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "Nothing's changed in my count. Has anything changed in yours?" },
      { by: 'b', say: "Nothing." },
      { by: 'a', say: "Good. Then we keep going." },
    ] },
  ],
  'talk.reaffirm.doubt': [
    { id: 'tr.d1', turns: [
      { by: 'a', say: "We're still good, right?" },
      { by: 'b', say: "...Yeah. Of course." },
      { by: 'a', dr: "There was a pause. It wasn't long. It wasn't nothing, either." },
    ] },
    { id: 'tr.d2', turns: [
      { by: 'a', say: "Still us?" },
      { by: 'b', say: "Still us. Why do you keep asking?" },
      { by: 'a', say: "No reason." },
      { by: 'b', dr: "There's always a reason." },
    ] },
    { id: 'tr.d3', turns: [
      { by: 'a', say: "What would you think about cutting one of your friends loose next week?" },
      { by: 'b', say: "Sure. Whatever you think." },
      { by: 'a', dr: "That was too easy. {b} would never let that go without a fight, unless {b} wasn't listening." },
    ] },
    { id: 'tr.d4', turns: [
      { by: 'b', say: "You've been weird with me today." },
      { by: 'a', say: "I've been weird with everyone." },
      { by: 'b', say: "That's not the comfort you think it is." },
    ] },
    { id: 'tr.d5', turns: [
      { by: 'a', say: "Are you still with me? Honestly?" },
      { by: 'b', say: "Honestly? Yes." },
      { by: 'a', say: "Okay." },
      { by: 'a', dr: "{b} said every right word. I walked away and couldn't tell you which one bothered me." },
    ] },
    { id: 'tr.d6', turns: [
      { by: 'b', say: "I saw you talking to the others last night." },
      { by: 'a', say: "I talk to everybody. That's the game." },
      { by: 'b', say: "Sure. As long as you come back here at the end of it." },
    ] },
    { id: 'tr.d7', turns: [
      { by: 'a', say: "If it came down to me or your alliance, who would you pick?" },
      { by: 'b', say: "That's not a fair question." },
      { by: 'a', say: "It wasn't supposed to be fair." },
      { by: 'b', say: '...You. Obviously.' },
      { by: 'a', dr: "\"Obviously\" took {b} four seconds." },
    ] },
    { id: 'tr.d8', turns: [
      { by: 'a', say: "Same deal as always?" },
      { by: 'b', say: 'Same deal.' },
      { beat: 'Both of them smile. Neither smile goes all the way up.' },
    ] },
    { id: 'tr.d9', turns: [
      { by: 'b', say: "Can I ask you something without you getting upset?" },
      { by: 'a', say: "That's never a good start." },
      { by: 'b', say: "Do you still trust me as much as you did?" },
      { by: 'a', say: "...Mostly." },
      { by: 'b', say: 'Mostly.' },
    ] },
    { id: 'tr.d10', turns: [
      { by: 'a', say: "Nothing's changed between us, has it?" },
      { by: 'b', say: "Has it for you?" },
      { by: 'a', say: "I asked first." },
      { by: 'b', dr: "When you answer a question with a question in this house, you've already answered it." },
    ] },
    { id: 'tr.d11', when: { late: true }, turns: [
      { by: 'a', say: "We're nearly there. Don't go weird on me now." },
      { by: 'b', say: "I'm not going weird." },
      { by: 'a', say: "You're a bit weird." },
      { by: 'b', say: "The game's a bit weird right now, {a}." },
    ] },
    { id: 'tr.d12', turns: [
      { by: 'a', say: "Whatever happens, we're good. Yeah?" },
      { by: 'b', say: "\"Whatever happens\"? What's going to happen?" },
      { by: 'a', say: "Nothing. It's just a thing people say." },
      { by: 'b', dr: "Nobody says \"whatever happens\" unless something is about to." },
    ] },
    { id: 'tr.d13', turns: [
      { by: 'a', say: "You'd tell me if you heard my name, right?" },
      { by: 'b', say: "Course I would." },
      { by: 'a', say: "Have you heard my name?" },
      { by: 'b', say: "...No." },
      { by: 'a', dr: "That was a long \"no\". Way too long." },
    ] },
    { id: 'tr.d14', turns: [
      { by: 'b', say: "You've been spending a lot of time with the others." },
      { by: 'a', say: "Is that a problem?" },
      { by: 'b', say: "It's an observation." },
      { by: 'a', say: "Observations in this house are never just observations." },
    ] },
    { id: 'tr.d15', turns: [
      { by: 'a', say: "Promise me we're still solid." },
      { by: 'b', say: "I promise." },
      { by: 'a', say: "Say it like you did last week." },
      { by: 'b', say: "I... promise?" },
      { by: 'a', dr: "Last week {b} didn't need to think about it." },
    ] },
    { id: 'tr.d16', turns: [
      { beat: '{a} sits down next to {b}. {b} moves over, a fraction more than needed.' },
      { by: 'a', say: "We're fine, yeah?" },
      { by: 'b', say: "We're fine." },
    ] },
    { id: 'tr.rs2', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Still us, darling?" },
      { by: 'b', say: "Of course." },
      { by: 'a', dr: "\"Of course.\" That's what I say when I'm lying. I know the sound." },
    ] },
    { id: 'tr.rf2', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Be straight with me. Are we good or not?" },
      { by: 'b', say: "We're good! Why are you shouting?" },
      { by: 'a', say: "I'm not shouting, I'm asking loudly!" },
    ] },
    { id: 'tr.ry2', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Are we... still okay? Sorry. I just worry." },
      { by: 'b', say: "We're okay." },
      { by: 'a', dr: "{b} didn't look at me once while saying it. I noticed. I always notice." },
    ] },
    { id: 'tr.rw2', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I just want to make sure I haven't upset you somehow." },
      { by: 'b', say: "You haven't." },
      { by: 'a', say: "Because you've seemed a bit far away." },
      { by: 'b', say: "I've just got a lot on my mind." },
    ] },
    { id: 'tr.rc2', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "If I win HOH, you're safe. If you win, am I?" },
      { by: 'b', say: "...Obviously." },
      { by: 'a', dr: "That pause was longer than my last wall comp." },
    ] },
    { id: 'tr.rk2', when: { register: 'cool' }, turns: [
      { by: 'a', say: "I'll ask once and I'll believe your answer. Are we still solid?" },
      { by: 'b', say: "We're solid." },
      { by: 'a', dr: "I said I'd believe the answer. I didn't say I wouldn't check it." },
    ] },
  ],
  // a is planning to cut b, and b believes the words.
  'talk.reaffirm.cut': [
    { id: 'tr.c1', turns: [
      { by: 'a', say: "Still us. Still the end." },
      { by: 'b', say: "Still us." },
      { by: 'a', dr: "I meant every word except the ones that matter." },
    ] },
    { id: 'tr.c2', turns: [
      { by: 'b', say: "I don't know what I'd do in here without you." },
      { by: 'a', say: "You won't have to find out." },
      { by: 'a', dr: "{b} is going to find out. Probably on Thursday." },
    ] },
    { id: 'tr.c3', turns: [
      { beat: 'The same handshake they have done for weeks.' },
      { by: 'a', dr: "Only one of us knows that was goodbye." },
    ] },
    { id: 'tr.c4', turns: [
      { by: 'a', say: "Finale night, you and me, still standing. I can see it." },
      { by: 'b', say: "Me too." },
      { by: 'a', dr: "I can see finale night. I just can't see {b} in it." },
    ] },
    { id: 'tr.c5', turns: [
      { by: 'b', say: "Promise me nothing's changed." },
      { by: 'a', say: "Nothing's changed." },
      { by: 'a', dr: "Everything's changed. {b} just can't see it yet, and I'd like to keep it that way for a few days." },
    ] },
    { id: 'tr.c6', when: { early: false }, turns: [
      { by: 'a', say: "Hey. You're my person in here." },
      { by: 'b', say: "And you're mine." },
      { by: 'a', dr: "I've had this conversation with {b} twenty times. This is the first time it felt like lying." },
    ] },
  ],
  // a is planning to cut b, and b does not believe it.
  'talk.reaffirm.seen': [
    { id: 'tr.e1', turns: [
      { by: 'a', say: "Still us?" },
      { by: 'b', say: "Still us." },
      { by: 'b', dr: "{a} held eye contact for about two seconds too long. I counted." },
    ] },
    { id: 'tr.e2', turns: [
      { by: 'a', say: "Whatever happens, I've got you." },
      { by: 'b', say: "That's the third \"whatever happens\" today." },
      { by: 'a', say: "Is it?" },
      { by: 'b', dr: "I'm going to need to win something this week. On my own." },
    ] },
    { id: 'tr.e3', turns: [
      { by: 'a', say: "You and me at the end. Like always." },
      { by: 'b', say: "Like always." },
      { by: 'b', dr: "{a} used to say that like a promise. Now it sounds like a goodbye card." },
    ] },
    { id: 'tr.e4', turns: [
      { by: 'b', say: "You'd tell me if something changed, right?" },
      { by: 'a', say: "Obviously." },
      { by: 'b', say: 'Okay.' },
      { by: 'b', dr: "Something's changed. I can feel it in the room." },
    ] },
    { id: 'tr.e5', turns: [
      { by: 'a', say: "To the end. Same as ever." },
      { by: 'b', say: "Same as ever." },
      { beat: '{b} smiles, and spends the evening working out how to win without {a}.' },
    ] },
    { id: 'tr.e6', turns: [
      { by: 'a', say: "Are we good?" },
      { by: 'b', say: "You tell me." },
      { by: 'a', say: "We're good." },
      { by: 'b', dr: "{a} answered for both of us. That's new." },
    ] },
  ],

  // ── a row, in front of the house ──────────────────────────────────
  'talk.confront.volatile': [
    { id: 'tx.v1', when: { room: ['kitchen'] }, turns: [
      { by: 'b', say: "Can you lower your voice?" },
      { by: 'a', say: "Why? So you can talk over me again?" },
      { by: 'b', say: "Nobody's talking over you." },
      { by: 'a', say: "You do it every single time I open my mouth!" },
      { beat: 'Everyone in the kitchen suddenly needs to be somewhere else.' },
    ] },
    { id: 'tx.v2', turns: [
      { by: 'a', say: "Say it again. Say it to my face." },
      { by: 'b', say: "I said you're difficult. Because you are." },
      { by: 'a', say: "Difficult? I'll show you difficult!" },
      { by: 'b', dr: "And that, right there, is exactly what I meant." },
    ] },
    { id: 'tx.v3', turns: [
      { by: 'a', say: "Do you think I can't hear you whispering about me?" },
      { by: 'b', say: "Not everything is about you." },
      { by: 'a', say: "In this house? Right now? It is!" },
      { by: 'b', say: "You're unbelievable." },
      { by: 'a', say: "And you're a coward!" },
    ] },
    { id: 'tx.v4', turns: [
      { by: 'b', say: "Calm down." },
      { by: 'a', say: "Don't. Don't tell me to calm down." },
      { by: 'b', say: "I'm just saying..." },
      { by: 'a', say: "You're always \"just saying\"! Say something real for once!" },
      { by: 'a', dr: "I know how I looked. I don't care. Somebody had to say it." },
    ] },
    { id: 'tx.v5', when: { room: ['kitchen'] }, turns: [
      { beat: '{a} slams a cupboard shut hard enough that the plates rattle.' },
      { by: 'b', say: "Wow. Mature." },
      { by: 'a', say: "You want mature? Stop making jokes about me in front of everybody." },
      { by: 'b', say: "It was a joke." },
      { by: 'a', say: "It's always a joke with you until it's somebody's game!" },
    ] },
    { id: 'tx.v6', turns: [
      { by: 'a', say: "You've been following me from room to room all day." },
      { by: 'b', say: "That's paranoid." },
      { by: 'a', say: "Then why are you in here?" },
      { by: 'b', say: "I live here!" },
      { beat: 'It is the last quiet sentence either of them says for ten minutes.' },
    ] },
    { id: 'tx.v7', turns: [
      { by: 'a', say: "You told people something I said to you in private." },
      { by: 'b', say: "It wasn't a big deal." },
      { by: 'a', say: "It was to me! That's the point!" },
      { by: 'b', say: "Okay, I'm sorry..." },
      { by: 'a', say: "No you're not. You're sorry I found out." },
    ] },
    { id: 'tx.v8', turns: [
      { by: 'a', say: "I'm done being nice to you." },
      { by: 'b', say: "When were you ever nice to me?" },
      { by: 'a', say: "Every day I didn't say this!" },
      { by: 'b', dr: "{a} blew up over nothing. Again. The house saw it. That's all I need." },
    ] },
    { id: 'tx.v9', when: { band: ['enemies'] }, turns: [
      { by: 'a', say: "I can't even be in the same room as you." },
      { by: 'b', say: "Then leave." },
      { by: 'a', say: "You leave!" },
      { by: 'b', say: "I was here first!" },
      { beat: 'Neither of them leaves. Everyone else does.' },
    ] },
    { id: 'tx.v10', turns: [
      { by: 'b', say: "Why are you looking at me like that?" },
      { by: 'a', say: "Because I know what you said about me last night." },
      { by: 'b', say: "Who told you that?" },
      { by: 'a', say: "So you did say it!" },
      { by: 'a', dr: "{b} confirmed it before I'd even accused {b.obj} of anything. Amateur." },
    ] },
    { id: 'tx.v11', turns: [
      { by: 'a', say: "Don't walk away from me while I'm talking!" },
      { by: 'b', say: "Then stop shouting and I'll stay!" },
      { by: 'a', say: "I'm not shouting!" },
      { beat: 'Everyone else in the room disagrees, silently.' },
    ] },
    { id: 'tx.v12', turns: [
      { by: 'b', say: "Why are you so angry all the time?" },
      { by: 'a', say: "Because of people like you!" },
      { by: 'b', say: "What does that even mean?" },
      { by: 'a', say: "It means leave me alone!" },
      { by: 'b', dr: "I asked one question. I got a weather warning." },
    ] },
    { id: 'tx.v13', turns: [
      { by: 'a', say: "If you've got something to say, say it now. Not behind my back. Now." },
      { by: 'b', say: "Fine. You're a nightmare to live with." },
      { by: 'a', say: "Better than being a snake!" },
    ] },
    { id: 'tx.v14', turns: [
      { beat: '{a} throws a cushion across the room. It misses {b} by a long way.' },
      { by: 'b', say: "Was that supposed to hit me?" },
      { by: 'a', say: "It was supposed to make a point!" },
      { by: 'b', say: "The point was the wall." },
    ] },
  ],
  'talk.confront.calculated': [
    { id: 'tx.c1', turns: [
      { by: 'a', say: "I want to give you a chance to tell me the truth." },
      { by: 'b', say: "About what?" },
      { by: 'a', say: "About why three people heard three different versions of your plan." },
      { by: 'b', say: "That's not what happened." },
      { by: 'a', say: "Then let's get the three of them in here and ask." },
    ] },
    { id: 'tx.c2', turns: [
      { by: 'a', say: "Explain your vote to me." },
      { by: 'b', say: "I voted with the house." },
      { by: 'a', say: "That's funny, because the house says you didn't." },
      { by: 'b', say: "This is an ambush." },
      { by: 'a', say: "It's a question. You're just not enjoying the answer." },
    ] },
    { id: 'tx.c3', turns: [
      { by: 'a', say: "You've been playing both sides." },
      { by: 'b', say: "I've been playing the game." },
      { by: 'a', say: "Both sides of it, yes. That's what I said." },
      { by: 'a', dr: "I wasn't angry. I was organised. I've been writing this conversation in my head for days." },
    ] },
    { id: 'tx.c4', turns: [
      { by: 'a', say: "Did our deal ever mean anything to you?" },
      { by: 'b', say: "It was strategic. You know that." },
      { by: 'a', say: "I asked you a personal question and you gave me a game answer." },
      { by: 'b', say: "This IS a game!" },
      { by: 'a', say: "Then you've just lost a teammate." },
    ] },
    { id: 'tx.c5', turns: [
      { by: 'a', say: "I've heard your plan. My name's in it, as the backup." },
      { by: 'b', say: "It's called having options." },
      { by: 'a', say: "And I'm an option?" },
      { by: 'b', say: "Everybody's an option." },
      { by: 'a', say: "Good to know. So are you." },
    ] },
    { id: 'tx.c6', turns: [
      { beat: '{a} waits until the room is full before asking the first question.' },
      { by: 'a', say: "{b}, where were you when the plan changed?" },
      { by: 'b', say: "Why are you asking me this in front of everybody?" },
      { by: 'a', say: "Because in private, you lie." },
    ] },
    { id: 'tx.c7', turns: [
      { by: 'a', say: "You're telling people I'm the one who can't be trusted." },
      { by: 'b', say: "I'm telling people what I think." },
      { by: 'a', say: "Then say it to my face. Go on." },
      { by: 'b', dr: "{a} wants a scene. I'm not giving {a.obj} one. Much." },
    ] },
    { id: 'tx.c8', turns: [
      { by: 'a', say: "Here's what I know, and here's who told me." },
      { by: 'b', say: "You've been keeping notes on me?" },
      { by: 'a', say: "Somebody had to." },
      { beat: 'The room goes very quiet. Nobody wants to be named next.' },
    ] },
  ],
  'talk.confront.general': [
    { id: 'tx.g1', turns: [
      { by: 'a', say: "Can you wash your stuff, please? Just once?" },
      { by: 'b', say: "Can you stop ordering everyone around? Just once?" },
      { by: 'a', say: "I'm not ordering anyone, I'm asking!" },
      { beat: 'Five minutes later they are shouting about everything except the dishes.' },
    ] },
    { id: 'tx.g2', turns: [
      { by: 'a', say: "Why do you leave the room every time I walk in?" },
      { by: 'b', say: "I don't." },
      { by: 'a', say: "You did it at breakfast, you did it at lunch, and you just did it now." },
      { by: 'b', say: "Maybe I just didn't want to talk to you." },
      { by: 'a', say: "Then say that!" },
    ] },
    { id: 'tx.g3', turns: [
      { by: 'b', say: "You're taking this game way too personally." },
      { by: 'a', say: "How is being lied to by someone you trusted supposed to feel impersonal?" },
      { by: 'b', say: "I never lied to you." },
      { by: 'a', say: "You just did. Again." },
    ] },
    { id: 'tx.g4', when: { room: ['kitchen'] }, turns: [
      { by: 'a', say: "Can I talk to you? Alone?" },
      { by: 'b', say: "Whatever you want to say, you can say it here." },
      { by: 'a', say: "Fine. Here it is, then." },
      { beat: 'Everybody at the table suddenly finds their plate very interesting.' },
    ] },
    { id: 'tx.g5', turns: [
      { by: 'a', say: "Did you call me the easy vote?" },
      { by: 'b', say: "Who said that?" },
      { by: 'a', say: "That's not a no." },
      { by: 'b', say: "It's a \"who said that\"." },
      { by: 'a', say: "It's a yes, is what it is." },
    ] },
    { id: 'tx.g6', turns: [
      { by: 'b', say: "You never help clean. Ever." },
      { by: 'a', say: "I cleaned the bathroom this morning. I swept the yard. I did the..." },
      { by: 'b', say: "Oh, here we go. The list." },
      { by: 'a', say: "Yes! The list! Because you asked!" },
    ] },
    { id: 'tx.g7', turns: [
      { by: 'a', say: "Who started the rumour about me?" },
      { by: 'b', say: "I'm not telling you that." },
      { by: 'a', say: "Then it was you." },
      { by: 'b', say: "That's not how that works." },
      { by: 'a', dr: "If {b} didn't start it, {b} would have said who did. That's how it works in here." },
    ] },
    { id: 'tx.g8', when: { room: ['kitchen'] }, turns: [
      { by: 'b', say: "Somebody's been hiding the good cereal." },
      { by: 'a', say: "Are you looking at me?" },
      { by: 'b', say: "I'm looking at the cupboard you're standing in front of." },
      { beat: '{a} opens every cupboard in the kitchen, one by one, getting angrier with each door.' },
    ] },
    { id: 'tx.g9', turns: [
      { by: 'a', say: "You took the bed I asked you not to take." },
      { by: 'b', say: "It's a bed. There's no name on it." },
      { by: 'a', say: "There was a sock on it! My sock!" },
      { by: 'b', say: "A sock isn't a reservation!" },
      { beat: 'Half the house gets dragged into it. Nobody sleeps well that night.' },
    ] },
    { id: 'tx.g10', turns: [
      { by: 'a', say: "I'm sick of being left out of every conversation in this house." },
      { by: 'b', say: "Nobody's leaving you out." },
      { by: 'a', say: "Then where was I last night, when you were all in the bedroom?" },
      { by: 'b', say: "...Asleep?" },
      { by: 'a', say: "Don't." },
    ] },
    { id: 'tx.g11', when: { early: false }, turns: [
      { by: 'a', say: "I've kept my mouth shut for weeks. I'm done." },
      { by: 'b', say: "Okay, so say it." },
      { by: 'a', say: "You're fake. To everybody. And everybody knows it but you." },
      { by: 'b', dr: "Weeks of holding it in, and that was the speech? I've had worse." },
    ] },
    { id: 'tx.g12', turns: [
      { by: 'b', say: "What's your problem with me?" },
      { by: 'a', say: "How long have you got?" },
      { by: 'b', say: "Wow." },
      { by: 'a', say: "You asked!" },
      { by: 'a', dr: "I didn't plan to do it in front of half the house. But here we are." },
    ] },
    { id: 'tx.g13', turns: [
      { by: 'a', say: "Can we talk about what you said at dinner?" },
      { by: 'b', say: "What did I say at dinner?" },
      { by: 'a', say: "You know exactly what you said." },
      { by: 'b', say: "It was a joke, relax." },
      { by: 'a', say: "Stop telling me to relax!" },
    ] },
    { id: 'tx.g14', turns: [
      { by: 'b', say: "Why do you always have to make everything about you?" },
      { by: 'a', say: "Me? You've been sulking all day!" },
      { by: 'b', say: "I haven't been sulking!" },
      { by: 'a', say: "You've been sulking so loudly I can hear it from the yard!" },
    ] },
    { id: 'tx.g15', turns: [
      { by: 'a', say: "Stop speaking for me." },
      { by: 'b', say: "I wasn't speaking for you." },
      { by: 'a', say: "You literally said \"{a} agrees\". I never agreed!" },
      { by: 'b', dr: "{a} agreed. {a} just doesn't remember agreeing." },
    ] },
    { id: 'tx.g16', turns: [
      { by: 'a', say: "Is there a reason you rolled your eyes at me?" },
      { by: 'b', say: "My eyes are allowed to move." },
      { by: 'a', say: "Not like that, they're not." },
      { beat: 'It escalates from there, very quickly, about very little.' },
    ] },
    { id: 'tx.g17', turns: [
      { by: 'b', say: "You've been weird with me for days. Just say it." },
      { by: 'a', say: "Fine. You don't listen. To anyone. Ever." },
      { by: 'b', say: "That's not true." },
      { by: 'a', say: "See? You're doing it right now!" },
    ] },
    { id: 'tx.g18', turns: [
      { by: 'a', say: "You went through my stuff." },
      { by: 'b', say: "I was looking for my hoodie!" },
      { by: 'a', say: "In my drawer?" },
      { by: 'b', say: "It could have been in your drawer!" },
      { by: 'a', dr: "It was not in my drawer. It has never been in my drawer." },
    ] },
    { id: 'tx.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Oh, I'm not angry. I just think the whole house should hear what you said to me." },
      { by: 'b', say: "Don't you dare." },
      { by: 'a', say: "Too late, sweetheart." },
    ] },
    { id: 'tx.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Can I... I need to say something, and I need you to let me finish." },
      { by: 'b', say: "Go on, then." },
      { by: 'a', say: "You've been really unkind to me. And I've been letting it happen. I'm done letting it happen." },
      { by: 'b', dr: "I didn't think {a} had it in {a.obj}. Fair play." },
    ] },
    { id: 'tx.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I've tried so hard with you. So hard." },
      { by: 'b', say: "Nobody asked you to." },
      { by: 'a', say: "And that's exactly the problem! I'm nice to you and you're nasty back!" },
    ] },
    { id: 'tx.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "You want to talk trash? Beat me in a comp first." },
      { by: 'b', say: "This isn't about comps!" },
      { by: 'a', say: "Everything's about comps!" },
    ] },
    { id: 'tx.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "I'm going to say this once, calmly, and then I'm done." },
      { by: 'b', say: "Here we go." },
      { by: 'a', say: "Stop lying about me. That's all. Thank you." },
      { beat: '{a} walks out. {b} is left with nobody to shout at.' },
    ] },
  ],

  // ── gossip: a tells b about c, who is not in the room ───────────────
  'talk.gossip.traded': [
    { id: 'tg.t1', turns: [
      { by: 'a', say: "You didn't hear this from me." },
      { by: 'b', say: "I never hear anything from you." },
      { by: 'a', say: "{c} is telling people you're the biggest threat in the house." },
      { by: 'b', say: "...Who else knows?" },
    ] },
    { id: 'tg.t2', turns: [
      { by: 'a', say: "Do you want to know what {c} said about you this morning?" },
      { by: 'b', say: "Do I want to know?" },
      { by: 'a', say: "You need to know. That's different." },
      { by: 'b', dr: "I trust {a}. I'm going to check it anyway. Twice." },
    ] },
    { id: 'tg.t3', turns: [
      { by: 'a', say: "I'll tell you about {c} if you tell me where the vote was this morning." },
      { by: 'b', say: "Deal. You first." },
      { by: 'a', say: "{c} wants a new alliance. Without either of us." },
      { by: 'b', say: "...Okay. The vote's still split. But not for long." },
    ] },
    { id: 'tg.t4', when: { room: ['pantry'] }, turns: [
      { beat: '{a} pulls {b} into the storage room, between the shelves of cereal, and shuts the door.' },
      { by: 'a', say: "Keep your voice down. It's about {c}." },
      { by: 'b', say: "It's always about {c}." },
      { by: 'a', say: "Because {c} is running this house and nobody's noticed." },
    ] },
    { id: 'tg.t5', turns: [
      { by: 'b', say: "What have you heard?" },
      { by: 'a', say: "That {c} has a final two with somebody. I don't know who." },
      { by: 'b', say: "Then that's the first thing we find out." },
    ] },
    { id: 'tg.t6', turns: [
      { by: 'a', say: "Have you noticed how {c} is always in the room when a plan changes?" },
      { by: 'b', say: "...Now that you say it." },
      { by: 'a', say: "Now that I say it. Exactly." },
      { by: 'a', dr: "I don't know if {c} is pulling strings. But now {b} is watching {c}, and that's worth something." },
    ] },
    { id: 'tg.t7', when: { late: false }, turns: [
      { by: 'a', say: "Swear you won't repeat this." },
      { by: 'b', say: "I swear." },
      { by: 'a', say: "{c} wants you out before jury." },
      { by: 'b', say: "Before jury? Why?" },
      { by: 'a', say: "Because you're the one person who could beat {c} at the end." },
    ] },
    { id: 'tg.t8', turns: [
      { by: 'a', say: "Do you trust {c}?" },
      { by: 'b', say: "About as far as I can throw the HOH bed." },
      { by: 'a', say: "Good. Keep it that way." },
    ] },
    { id: 'tg.t9', turns: [
      { by: 'b', say: "You look like you've got something." },
      { by: 'a', say: "I've got something." },
      { by: 'b', say: "About who?" },
      { by: 'a', say: "Who do you think? {c}." },
      { by: 'b', dr: "Every bit of news in this house has {c}'s name on it this week." },
    ] },
    { id: 'tg.t10', turns: [
      { by: 'a', say: "{c} asked me who you were voting for." },
      { by: 'b', say: "And what did you say?" },
      { by: 'a', say: "That I didn't know. Which is true, because you haven't told me." },
      { by: 'b', say: "...I'll tell you. But you didn't hear it from me." },
    ] },
    { id: 'tg.t11', turns: [
      { by: 'a', say: "Want to trade?" },
      { by: 'b', say: "What have you got?" },
      { by: 'a', say: "Something about {c}. Something good." },
      { by: 'b', say: "Then I've got something about the vote. Go." },
    ] },
    { id: 'tg.t12', turns: [
      { by: 'a', say: "I'm only telling you because I trust you." },
      { by: 'b', say: "That's what people say right before they tell everybody." },
      { by: 'a', say: "Fine. Then I'm only telling you. {c} is playing everybody." },
      { by: 'b', say: "Everybody?" },
      { by: 'a', say: "Everybody. Including you." },
    ] },
    { id: 'tg.t13', when: { late: true }, turns: [
      { by: 'a', say: "With this few of us left, {c} is the one to worry about." },
      { by: 'b', say: "Why {c}?" },
      { by: 'a', say: "Because {c} has friends on both sides and enemies on neither." },
      { by: 'b', dr: "{a} is right. That's the most dangerous kind of player in this house." },
    ] },
    { id: 'tg.t14', turns: [
      { by: 'b', say: "Who told you that?" },
      { by: 'a', say: "Doesn't matter. Is it true?" },
      { by: 'b', say: "About {c}? Probably." },
      { by: 'a', say: "Then we're on the same page." },
    ] },
    { id: 'tg.t15', when: { room: ['backyard'] }, turns: [
      { beat: '{a} and {b} sit with their backs to the camera on the backyard couch, talking low.' },
      { by: 'a', say: "{c} keeps asking me about you." },
      { by: 'b', say: "What kind of questions?" },
      { by: 'a', say: "The kind you ask before you make a move." },
    ] },
    { id: 'tg.t16', turns: [
      { by: 'a', say: "Is it just me, or has {c} been really nice to everyone this week?" },
      { by: 'b', say: "Suspiciously nice." },
      { by: 'a', say: "Nobody's that nice in this house unless they want something." },
      { by: 'b', say: "So what does {c} want?" },
      { by: 'a', say: "That's what we're going to find out." },
    ] },
    { id: 'tg.t17', turns: [
      { by: 'a', say: "Quick question. Has {c} talked to you today?" },
      { by: 'b', say: "Twice. Why?" },
      { by: 'a', say: "Because {c} talked to me three times. About you." },
      { by: 'b', say: "...What about me?" },
    ] },
    { id: 'tg.t18', turns: [
      { by: 'b', say: "Okay, spill." },
      { by: 'a', say: "{c} said you'd be the first to flip if things got tight." },
      { by: 'b', say: "{c} said that?" },
      { by: 'a', say: "Word for word." },
      { by: 'b', dr: "If {c} thinks I'm the flipper, I'll flip. Just not the way {c} expects." },
    ] },
    { id: 'tg.t19', turns: [
      { by: 'a', say: "I'm not saying it's true. I'm saying it's what I heard." },
      { by: 'b', say: "What did you hear?" },
      { by: 'a', say: "That {c} is keeping a list. With names on it. In order." },
      { by: 'b', say: "Am I on it?" },
      { by: 'a', say: "Everyone's on it." },
    ] },
    { id: 'tg.t20', turns: [
      { by: 'a', say: "Did you see {c}'s face when the nominations came up?" },
      { by: 'b', say: "No, I was looking at the screen." },
      { by: 'a', say: "{c} wasn't surprised. Not even a little." },
      { by: 'b', dr: "So {c} knew before the rest of us. Interesting." },
    ] },
    { id: 'tg.t21', turns: [
      { by: 'b', say: "Who's {c} closest to in here? Honestly?" },
      { by: 'a', say: "Everyone thinks it's them. That's the trick." },
      { by: 'b', say: "...That's terrifying." },
      { by: 'a', say: "That's {c}." },
    ] },
    { id: 'tg.t22', turns: [
      { by: 'a', say: "I've got something, but you have to promise not to react." },
      { by: 'b', say: "I promise." },
      { by: 'a', say: "{c} called you a floater." },
      { by: 'b', say: "A FLOATER?" },
      { by: 'a', say: "You promised!" },
    ] },
    { id: 'tg.t23', when: { alliance: true }, turns: [
      { by: 'a', say: "Keep this inside the alliance." },
      { by: 'b', say: "Always." },
      { by: 'a', say: "{c} has been asking who's in it. Asking everybody." },
      { by: 'b', say: "Then {c} is getting close. Too close." },
    ] },
    { id: 'tg.t24', turns: [
      { by: 'a', say: "Tell me if I'm crazy. {c} has been in the HOH room every night this week." },
      { by: 'b', say: "You're not crazy. I've noticed it too." },
      { by: 'a', say: "Then we're both on the outside of something." },
    ] },
    { id: 'tg.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "I probably shouldn't tell you this..." },
      { by: 'b', say: "But you're going to." },
      { by: 'a', say: "{c} has been saying your name. A lot." },
      { by: 'a', dr: "Is that strictly true? Mostly. Is it useful? Very." },
    ] },
    { id: 'tg.rf1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Do you know what {c} said about you? Because I'm furious about it, and it wasn't even about me!" },
      { by: 'b', say: "Calm down. What did {c} say?" },
      { by: 'a', say: "That you're coasting! You! Coasting!" },
    ] },
    { id: 'tg.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "Can I tell you something? I don't usually... I don't really talk about people." },
      { by: 'b', say: "That's why I'll believe you." },
      { by: 'a', say: "{c} is planning something. I heard it in the bathroom." },
    ] },
    { id: 'tg.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "I hate gossip. I really do. But you're my friend, so you should know." },
      { by: 'b', say: "Know what?" },
      { by: 'a', say: "{c} isn't being honest with you. I'm sorry." },
    ] },
    { id: 'tg.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "{c} is scared of you. Like, properly scared." },
      { by: 'b', say: "Of me? Why?" },
      { by: 'a', say: "The last comp. {c} watched you the whole time." },
    ] },
    { id: 'tg.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "I'll give you one piece of information. You decide what it's worth." },
      { by: 'b', say: "Fair." },
      { by: 'a', say: "{c} has been asking everyone the same question: who are you closest to?" },
      { by: 'b', dr: "That's not gossip. That's somebody building a map." },
    ] },
  ],

  // ── comfort: a sits with b, on the block ─────────────────────────────
  'talk.comfort.kind': [
    { id: 'tk.k1', when: { room: ['backyard'] }, turns: [
      { by: 'a', say: "Do you want company? We don't have to talk." },
      { by: 'b', say: "...Yeah. Stay." },
      { beat: 'They sit on the backyard couch for a long time without saying anything.' },
    ] },
    { id: 'tk.k2', turns: [
      { by: 'a', say: "You don't have to pretend you're okay with me." },
      { by: 'b', say: "I'm not okay. I'm terrified." },
      { by: 'a', say: "I know. I'd be terrified too." },
      { by: 'b', dr: "{a} didn't try to fix anything. {a} just let me be scared. Nobody else did that." },
    ] },
    { id: 'tk.k3', when: { room: ['bedroom'] }, turns: [
      { beat: '{a} brings a cup of tea into the bedroom and puts it on the nightstand.' },
      { by: 'a', say: "I'm not going to talk about the vote. Tell me about home instead." },
      { by: 'b', say: "...Okay. You'd love my family. They'd hate it in here." },
    ] },
    { id: 'tk.k4', turns: [
      { by: 'b', say: "Everyone's acting like I'm already gone." },
      { by: 'a', say: "You're not gone. You're right here, eating my crisps." },
      { by: 'b', say: "These are your crisps?" },
      { by: 'a', say: "Keep them. You need them more." },
    ] },
    { id: 'tk.k5', turns: [
      { by: 'a', say: "How are you holding up?" },
      { by: 'b', say: "Honestly? Not great." },
      { by: 'a', say: "Then don't hold up. Just sit here for a bit." },
    ] },
    { id: 'tk.k6', turns: [
      { by: 'b', say: "I keep replaying the ceremony in my head." },
      { by: 'a', say: "Stop. You did nothing wrong in there. Somebody had to sit in that chair." },
      { by: 'b', say: "Why did it have to be me?" },
      { by: 'a', say: "Bad luck. Not bad game." },
    ] },
    { id: 'tk.k7', turns: [
      { by: 'a', say: "I'm not here because I want something. I just didn't want you on your own." },
      { by: 'b', say: "That's the nicest thing anyone's said to me all week." },
      { by: 'b', dr: "In here, everyone who's nice to you wants your vote. {a} didn't even ask for mine." },
    ] },
    { id: 'tk.k8', when: { room: ['backyard'] }, turns: [
      { beat: '{b} is lying on the backyard grass, staring up at the sky. {a} lies down alongside.' },
      { by: 'a', say: "Nice view." },
      { by: 'b', say: "It's the same sky as yesterday." },
      { by: 'a', say: "Still a nice view." },
    ] },
    { id: 'tk.k9', turns: [
      { by: 'a', say: "Whatever happens on eviction night, you've been one of the best people in this house." },
      { by: 'b', say: "Don't. You'll make me cry." },
      { by: 'a', say: "Cry, then. Nobody's watching." },
      { by: 'b', say: "Literally everyone is watching." },
    ] },
    { id: 'tk.k10', turns: [
      { by: 'b', say: "Do you think I'm going home?" },
      { by: 'a', say: "I think you've got a better shot than you think." },
      { by: 'b', say: "That's not a no." },
      { by: 'a', say: "It's not a yes, either. Hold on to that." },
    ] },
    { id: 'tk.k11', when: { band: ['friends'] }, turns: [
      { by: 'a', say: "Hey. Look at me. I've got you." },
      { by: 'b', say: "I know you do." },
      { by: 'a', say: "Then stop looking like you're already packing." },
    ] },
    { id: 'tk.k12', turns: [
      { by: 'a', say: "Want me to do your hair? Somebody did mine on a bad day once. It helped more than it should have." },
      { by: 'b', say: "...Yeah. Okay." },
      { beat: 'For twenty minutes, nobody mentions the block.' },
    ] },
    { id: 'tk.k13', when: { early: true }, turns: [
      { by: 'b', say: "I barely know anybody yet and I'm already on the block." },
      { by: 'a', say: "Then get to know me. Starting now." },
      { by: 'b', say: "...Hi." },
      { by: 'a', say: "Hi." },
    ] },
    { id: 'tk.k14', turns: [
      { by: 'a', say: "You're allowed to be upset, you know." },
      { by: 'b', say: "I don't want people to see it." },
      { by: 'a', say: "Then be upset in here, with me. I won't tell anyone." },
      { by: 'b', dr: "{a} is the reason I got out of bed today." },
    ] },
    { id: 'tk.k15', turns: [
      { by: 'a', say: "Want to do something stupid to take your mind off it?" },
      { by: 'b', say: "Like what?" },
      { by: 'a', say: "I'll teach you the worst dance I know." },
      { beat: 'Ten minutes later they are both laughing too hard to finish it.' },
    ] },
    { id: 'tk.k16', turns: [
      { by: 'b', say: "I just keep thinking about my family watching this." },
      { by: 'a', say: "They're proud of you. You know that, right?" },
      { by: 'b', say: "Even if I go home on Thursday?" },
      { by: 'a', say: "Especially then. You played." },
    ] },
    { id: 'tk.k17', turns: [
      { by: 'a', say: "Have you eaten today?" },
      { by: 'b', say: "I'm not hungry." },
      { by: 'a', say: "That's not what I asked." },
      { beat: '{a} makes a sandwich and leaves it on the table in front of {b} without another word.' },
    ] },
    { id: 'tk.k18', turns: [
      { by: 'b', say: "Do you think it's personal? Being put up?" },
      { by: 'a', say: "I think it's a game, and you're good at it. That makes you scary." },
      { by: 'b', say: "I don't feel scary." },
      { by: 'a', say: "You don't have to feel it. They do." },
    ] },
    { id: 'tk.k19', turns: [
      { by: 'a', say: "Whatever you need this week. Practise your speech on me. Cry on me. Anything." },
      { by: 'b', say: "You'd let me practise my speech on you?" },
      { by: 'a', say: "Ten times, if you want." },
      { by: 'b', dr: "{a} has nothing to gain from being nice to me this week. That's why it means something." },
    ] },
    { id: 'tk.k20', turns: [
      { by: 'b', say: "I'm sorry, I'm terrible company right now." },
      { by: 'a', say: "You're the best company in the house. Terrible is just your mood." },
      { by: 'b', say: "...That's weirdly comforting." },
    ] },
    { id: 'tk.k21', when: { late: true }, turns: [
      { by: 'b', say: "I got so close. That's what hurts." },
      { by: 'a', say: "You're still close. You're still here." },
      { by: 'b', say: "For now." },
      { by: 'a', say: "For now is all any of us have got." },
    ] },
    { id: 'tk.k22', turns: [
      { by: 'a', say: "Can I say something? You've handled this better than I would have." },
      { by: 'b', say: "I've cried four times today." },
      { by: 'a', say: "Like I said. Better than I would have." },
    ] },
    { id: 'tk.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "I'm not good at this kind of thing. But I'm here." },
      { by: 'b', say: "That's all I need." },
    ] },
    { id: 'tk.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "Come here. Big hug. Non-negotiable." },
      { by: 'b', say: "I don't want a hug." },
      { by: 'a', say: "Too bad. You're getting one." },
    ] },
    { id: 'tk.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "Listen. The veto's coming. You win that, none of this matters." },
      { by: 'b', say: "And if I don't?" },
      { by: 'a', say: "Then we work on your speech. I'll be your coach." },
    ] },
    { id: 'tk.rk1', when: { register: 'cool' }, turns: [
      { by: 'a', say: "Let's look at it calmly. Who are the votes you can actually get?" },
      { by: 'b', say: "I can't think straight right now." },
      { by: 'a', say: "Then I'll think. You breathe." },
    ] },
  ],

  // ── a name pitched to the HOH: a pitcher, b the HOH, c the name (not in the room) ──
  'talk.pitch-target.lands': [
    { id: 'tp.l1', turns: [
      { by: 'a', say: "This room is unreal. Is that a mini fridge?" },
      { by: 'b', say: "Help yourself." },
      { by: 'a', say: "Thanks. Can I ask you something? What are you thinking about {c}?" },
      { by: 'b', say: "...Why? What have you heard?" },
      { by: 'b', dr: "{a} came up for a drink and left me with a name. I'm not mad. It's a good name." },
    ] },
    { id: 'tp.l2', turns: [
      { by: 'a', say: "I'm not telling you what to do." },
      { by: 'b', say: "But?" },
      { by: 'a', say: "But if {c} is still here next week, {c} is coming for you. Not me. You." },
      { by: 'b', say: "...I've thought that too." },
    ] },
    { id: 'tp.l3', turns: [
      { by: 'a', say: "Can I be honest about {c}?" },
      { by: 'b', say: "Please." },
      { by: 'a', say: "{c} is the only person in this house who could win this whole thing without anybody noticing." },
      { by: 'b', dr: "I'd been going back and forth all day. {a} just stopped the back and forth." },
    ] },
    { id: 'tp.l4', turns: [
      { by: 'b', say: "Who would you put up?" },
      { by: 'a', say: "It's not my week." },
      { by: 'b', say: "Pretend it is." },
      { by: 'a', say: "{c}. And I wouldn't lose a minute of sleep." },
    ] },
    { id: 'tp.l5', turns: [
      { by: 'a', say: "You've noticed how {c} is in every conversation? Every single one?" },
      { by: 'b', say: "I have now." },
      { by: 'a', say: "That's somebody running the house from the couch." },
      { by: 'b', say: "...Yeah. Yeah, it is." },
    ] },
    { id: 'tp.l6', turns: [
      { by: 'a', say: "I'll say one name and then I'll leave you alone." },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "{c}." },
      { beat: '{b} doesn\'t answer. But later that night, there is only one name on the notepad by the bed.' },
    ] },
    { id: 'tp.l7', turns: [
      { by: 'a', say: "What did {c} say to you when you won?" },
      { by: 'b', say: "Congratulations, I think." },
      { by: 'a', say: "Funny. That's not what {c} said downstairs." },
      { by: 'b', dr: "I don't know if {a} is telling me the truth. But I believe it, and that's what counts this week." },
    ] },
    { id: 'tp.l8', turns: [
      { by: 'a', say: "If you don't take the shot at {c} now, you won't get another one." },
      { by: 'b', say: "That's a big shot." },
      { by: 'a', say: "Big shots are what you won that key for." },
    ] },
  ],
  'talk.pitch-target.overplayed': [
    { id: 'tp.o1', turns: [
      { by: 'a', say: "Honestly, you'd be doing the whole house a favour if {c} went up." },
      { by: 'b', say: "The whole house, or you?" },
      { by: 'a', say: "...Both?" },
      { by: 'b', dr: "{a} came up here to run my week. I noticed." },
    ] },
    { id: 'tp.o2', turns: [
      { by: 'a', say: "So I was thinking you should put up {c}." },
      { by: 'b', say: "You've been in here two minutes." },
      { by: 'a', say: "I'm efficient." },
      { by: 'b', dr: "When somebody runs up the stairs with a name ready, you start looking at them instead." },
    ] },
    { id: 'tp.o3', turns: [
      { by: 'a', say: "{c}, {c}, {c}. That's all I'm saying." },
      { by: 'b', say: "You've said it three times." },
      { by: 'a', say: "Because it's important." },
      { by: 'b', say: "Or because it's important to you." },
    ] },
    { id: 'tp.o4', turns: [
      { by: 'a', say: "You've got to get {c} out. You've got to." },
      { by: 'b', say: "I don't have to do anything." },
      { by: 'a', say: "No, I know, I just mean..." },
      { by: 'b', say: "I know what you mean." },
      { by: 'b', dr: "I'm writing a name down tonight. It might not be the one {a} wanted." },
    ] },
    { id: 'tp.o5', turns: [
      { by: 'a', say: "Can I say something about {c}?" },
      { by: 'b', say: "Everyone's said something about {c} today." },
      { by: 'a', say: "Well, mine's the true one." },
      { by: 'b', say: "That's what they all said." },
    ] },
    { id: 'tp.o6', turns: [
      { by: 'a', say: "Trust me. {c} has to go." },
      { by: 'b', say: "Why should I trust you?" },
      { by: 'a', say: "...Because I'm telling you to?" },
      { by: 'b', dr: "Wrong answer. Very wrong answer." },
    ] },
    { id: 'tp.o7', turns: [
      { by: 'a', say: "I just want what's best for your game." },
      { by: 'b', say: "That's very generous of you." },
      { by: 'a', say: "And what's best for your game is {c} going home." },
      { by: 'b', say: "And what's best for yours?" },
      { beat: '{a} laughs. {b} does not.' },
    ] },
    { id: 'tp.o8', turns: [
      { by: 'a', say: "I'd never tell you what to do. But {c}. Seriously." },
      { by: 'b', say: "You just told me what to do." },
      { by: 'a', say: "I suggested." },
      { by: 'b', dr: "That was not a suggestion. That was a shopping list." },
    ] },
  ],

  // ── the HOH room fills up: a the HOH, b and c up there with them ──
  'talk.hoh-visit.court': [
    { id: 'th.c1', turns: [
      { beat: 'The HOH room fills up after lights-out. Nobody downstairs is asleep.' },
      { by: 'b', say: "This bed is bigger than my flat." },
      { by: 'a', say: "Get off my pillow." },
      { by: 'b', say: "Never." },
    ] },
    { id: 'th.c2', turns: [
      { by: 'a', say: "Who wants a snack from the basket?" },
      { by: 'b', say: "Me. Always me." },
      { by: 'a', dr: "Nothing gets decided up here. That's not the point. The point is who's in the room." },
    ] },
    { id: 'th.c3', when: { third: true }, turns: [
      { by: 'b', say: "Look at us. The cool kids' table." },
      { by: 'c', say: "Keep your voice down, they can hear you downstairs." },
      { by: 'b', say: "Good." },
      { by: 'a', say: "Don't. You'll get us all put up next week." },
    ] },
    { id: 'th.c4', turns: [
      { beat: 'Somebody starts a card game on the HOH bed. The laughing carries down the stairs.' },
      { by: 'a', say: "Shh! People are trying to be jealous down there." },
      { by: 'b', say: "Let them." },
    ] },
    { id: 'th.c5', turns: [
      { by: 'b', say: "Can I have the good side of the bed?" },
      { by: 'a', say: "You've been on it since dinner." },
      { by: 'b', say: "And I'm very comfortable." },
      { by: 'a', dr: "{b} has been up here since dinner. In this house, that's a public statement about who's safe." },
    ] },
    { id: 'th.c6', when: { third: true }, turns: [
      { by: 'c', say: "We should go down. People are going to talk." },
      { by: 'b', say: "People are always going to talk." },
      { by: 'a', say: "Stay. I'm the Head of Household. I'm allowed friends." },
      { by: 'c', dr: "Allowed, yes. But everybody downstairs is counting who's up here." },
    ] },
    { id: 'th.c7', turns: [
      { by: 'b', say: "I could live in this room." },
      { by: 'a', say: "You basically do this week." },
      { by: 'b', say: "Is that a problem?" },
      { by: 'a', say: "Not for me. Maybe for the people downstairs." },
    ] },
    { id: 'th.c8', when: { third: true }, turns: [
      { by: 'a', say: "Okay, honestly. What's the house saying about me?" },
      { by: 'b', say: "That you're having the best week of your life." },
      { by: 'c', say: "And that you're nominating the people who didn't come up." },
      { by: 'a', say: "...That's not a terrible guess." },
    ] },
    { id: 'th.c9', turns: [
      { beat: '{a} and {b} lie on the HOH bed watching the camera feeds of the house below.' },
      { by: 'b', say: "Look at them all down there. Like a nature documentary." },
      { by: 'a', say: "Be nice. Next week we could be the ones down there." },
    ] },
    { id: 'th.c10', turns: [
      { by: 'a', say: "Stay as long as you want. Seriously." },
      { by: 'b', say: "You'll regret saying that at three in the morning." },
      { by: 'a', say: "I already regret it a bit." },
    ] },
    { id: 'th.c11', turns: [
      { by: 'b', say: "Tell us about home. The real stuff." },
      { by: 'a', say: "You'll get bored." },
      { by: 'b', say: "We won't." },
      { beat: 'Nobody gets bored. Somebody ends up crying, and it is not the Head of Household.' },
    ] },
    { id: 'th.c12', turns: [
      { by: 'a', say: "Okay, rules. Shoes off the bed. Nobody touches the snacks without asking." },
      { by: 'b', say: "That's a dictatorship." },
      { by: 'a', say: "That's a Head of Household." },
    ] },
    { id: 'th.c13', when: { third: true }, turns: [
      { by: 'c', say: "Is anyone else coming up?" },
      { by: 'a', say: "I don't know. I didn't invite anyone. You just came." },
      { by: 'b', say: "We're the uninvited favourites." },
      { by: 'c', say: "That's the best kind." },
    ] },
    { id: 'th.c14', turns: [
      { beat: '{b} is flicking through the photos by the HOH bed.' },
      { by: 'b', say: "Are these from home? Everyone's smiling in them except you." },
      { by: 'a', say: "I'm smiling on the inside. I always have been." },
    ] },
    { id: 'th.c15', turns: [
      { by: 'b', say: "What's it like? Being up here?" },
      { by: 'a', say: "Honestly? Lonely, until people knock." },
      { by: 'b', say: "Then I'll keep knocking." },
      { by: 'a', dr: "{b} keeps coming up. Either {b} likes me, or {b} likes being safe. I'll find out which." },
    ] },
    { id: 'th.c16', when: { third: true }, turns: [
      { by: 'b', say: "Who do you think is talking about us right now?" },
      { by: 'c', say: "Everybody." },
      { by: 'a', say: "Good. Let them wonder." },
    ] },
    { id: 'th.c17', turns: [
      { by: 'a', say: "This is the first time all week I've actually laughed." },
      { by: 'b', say: "Being in charge is that bad?" },
      { by: 'a', say: "Being in charge is fine. Everyone wanting something is the bad bit." },
      { by: 'b', say: "I don't want anything." },
      { by: 'a', say: "Everyone says that." },
    ] },
    { id: 'th.c18', turns: [
      { beat: 'Music plays quietly from the HOH room speaker. {a} and {b} are both pretending not to sing along.' },
      { by: 'b', say: "You're singing." },
      { by: 'a', say: "You're singing louder." },
    ] },
    { id: 'th.rs1', when: { register: 'schemer' }, turns: [
      { by: 'a', say: "Isn't it lovely up here? Just us. The people I trust." },
      { by: 'b', say: "That sounded slightly threatening." },
      { by: 'a', say: "Only to the people downstairs." },
    ] },
    { id: 'th.rf1', when: { register: 'fiery' }, turns: [
      { by: 'a', say: "Turn the music up! It's my room, I make the rules!" },
      { by: 'b', say: "They're trying to sleep downstairs." },
      { by: 'a', say: "Then they should've won HOH!" },
    ] },
    { id: 'th.ry1', when: { register: 'shy' }, turns: [
      { by: 'a', say: "I didn't think anybody would actually come up." },
      { by: 'b', say: "Are you kidding? This is the best room in the house." },
      { by: 'a', say: "And I'm in it. Still feels weird." },
    ] },
    { id: 'th.rw1', when: { register: 'sweet' }, turns: [
      { by: 'a', say: "Everyone's welcome up here. I mean it. Tell the others." },
      { by: 'b', say: "You know that's not how HOH works, right?" },
      { by: 'a', say: "It's how my HOH works." },
    ] },
    { id: 'th.rc1', when: { register: 'competitor' }, turns: [
      { by: 'a', say: "Okay, who wants a push-up contest on the HOH carpet?" },
      { by: 'b', say: "Nobody. Nobody wants that." },
      { by: 'a', say: "Fine, I'll just do them by myself." },
    ] },
    { id: 'th.rk1', when: { register: 'cool' }, turns: [
      { beat: '{a} sits back against the headboard and lets everybody else do the talking.' },
      { by: 'a', dr: "People say the most interesting things when you let them fill a silence." },
    ] },
  ],

  // ── the HOH says the name: a the HOH, b the confidant, c the target (not there) ──
  'talk.hoh-decide.named': [
    { id: 'tw.n1', turns: [
      { by: 'b', say: "So? Who is it?" },
      { by: 'a', say: "{c}." },
      { by: 'b', say: "...Yeah. Yeah, I figured." },
      { by: 'a', dr: "That's the first time I've said it out loud. Now it's real, and now somebody else knows." },
    ] },
    { id: 'tw.n2', turns: [
      { by: 'a', say: "If I don't do it this week, somebody else gets the chance and I lose it." },
      { by: 'b', say: "You're talking about {c}." },
      { by: 'a', say: "I'm talking about {c}." },
    ] },
    { id: 'tw.n3', turns: [
      { by: 'a', say: "It's simple. {c} goes up. The only question is who sits next to {c}." },
      { by: 'b', say: "Not me, I hope." },
      { by: 'a', say: "Not you." },
      { by: 'b', dr: "\"Not you\". I'll be holding {a} to that on Saturday." },
    ] },
    { id: 'tw.n4', turns: [
      { by: 'b', say: "You've gone quiet." },
      { by: 'a', say: "I'm deciding." },
      { by: 'b', say: "No, you've decided. You just haven't said it." },
      { by: 'a', say: "...{c}." },
    ] },
    { id: 'tw.n5', turns: [
      { by: 'a', say: "Can you keep a secret?" },
      { by: 'b', say: "Better than anyone in this house." },
      { by: 'a', say: "It's {c}. Don't tell anyone. I mean anyone." },
      { by: 'b', dr: "{a} trusted me with the name. That's the most dangerous thing anybody can give you in here." },
    ] },
    { id: 'tw.n6', turns: [
      { by: 'a', say: "Talk me out of putting up {c}." },
      { by: 'b', say: "I can't." },
      { by: 'a', say: "Try." },
      { by: 'b', say: "I really can't. It's the right move." },
    ] },
    { id: 'tw.n7', turns: [
      { by: 'b', say: "Are you nervous?" },
      { by: 'a', say: "About {c}? A bit. {c} won't take it quietly." },
      { by: 'b', say: "Nobody takes it quietly." },
      { by: 'a', say: "{c} really won't." },
    ] },
    { id: 'tw.n8', turns: [
      { by: 'a', say: "I keep writing the same name on the notepad." },
      { by: 'b', say: "Let me guess. {c}?" },
      { by: 'a', say: "Is it that obvious?" },
      { by: 'b', say: "To me. Let's hope it isn't to {c}." },
    ] },
  ],
};
