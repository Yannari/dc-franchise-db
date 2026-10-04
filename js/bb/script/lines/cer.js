// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/cer.js — what happens around the ceremonies (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/ceremonies.js. The ceremony speeches themselves
// are Phase 4's act scripts (lines/ceremony.js); these are the reactions
// around them.
//
//   cer.nomgame     a, the HOH, kept it businesslike; b and c are up      scene
//   cer.nompersonal a, the HOH, made it personal with b; c is up too      scene
//   cer.pawn        a, the HOH, tells b they are only a pawn (storage room)   trusted | burned
//   cer.blindside   a was put up by b, whom a trusted                     scene; intent promised | allied | plain
//   cer.stoic       a takes the nomination calmly                         scene
//   cer.saved       b used the veto on a                                  scene
//   cer.left        b kept the veto and left a on the block               scene; intent allied
//   cer.backdoor    b, the HOH, names a as the planned replacement        scene
//   cer.replace     b names a as the replacement                          scene
//   cer.gracious    a leaves with grace; b is the friend a stops at last  scene; intent close
//   cer.scorched    a leaves angry at b, and says something at the door   plain | bloc ({group}) | lie ({liar}) | vote ({voted})
//   cer.blindsided  a leaves by a big vote; b is the friend who voted a out   scene

export default {
  'cer.nomgame.scene': [
    { id: 'zn.g1', turns: [{ by: 'a', dr: "I kept it short. No apologies. It's a game, and they both know it." }] },
    { id: 'zn.g2', turns: [{ by: 'b', dr: "{a} said it wasn't personal. It sounded like a line {a.sub}'d practised." }] },
    { id: 'zn.g3', turns: [{ by: 'c', say: "Was that hard for you?" }, { by: 'a', say: "Honestly? No." }, { by: 'c', dr: "At least {a} was honest." }] },
    { id: 'zn.g4', turns: [{ by: 'a', dr: "I named {b} and {c} and sat down. No speech. They'll both get a shot at the veto." }] },
    { id: 'zn.g5', turns: [{ by: 'b', say: "Well. Here we are." }, { by: 'c', say: "Here we are." }] },
    { id: 'zn.g6', turns: [{ by: 'a', say: "You'll both get a shot at the veto." }, { by: 'b', say: "Generous." }, { by: 'a', dr: "It isn't generous. It's a plan." }] },
    { id: 'zn.g7', turns: [{ by: 'c', dr: "{a} didn't even look at us. I'd almost prefer shouting." }] },
  ],
  'cer.nompersonal.scene': [
    { id: 'zn.p1', turns: [{ by: 'a', dr: "Everyone told me to say it's just a game. It isn't. {b} made it personal first." }] },
    { id: 'zn.p2', turns: [{ by: 'b', say: "You didn't have to say all that in front of everyone." }, { by: 'a', say: "Yes, I did." }] },
    { id: 'zn.p3', turns: [{ by: 'c', dr: "{a} went after {b} in that speech. I've never been so glad not to be the main target." }] },
    { id: 'zn.p4', turns: [{ by: 'b', dr: "{a} said what {a.sub} really thinks of me in front of the whole house. Fine. Now I know." }] },
    { id: 'zn.p5', turns: [{ by: 'a', say: "I'm not going to pretend I'm sorry." }, { by: 'b', say: "Nobody asked you to." }] },
    { id: 'zn.p6', turns: [{ by: 'c', dr: "That speech changed how I see {a}. If {a} can do that to {b}, {a} can do it to anyone." }] },
  ],
  'cer.pawn.trusted': [
    { id: 'zp.t1', turns: [{ by: 'a', say: "You're not the one going. I just need you up there until the vote." }, { by: 'b', say: "Okay. I trust you." }, { by: 'b', dr: "Mostly." }] },
    { id: 'zp.t2', turns: [{ by: 'b', say: "Say it to my face." }, { by: 'a', say: "You're a pawn. You're safe. If that changes, you'll hear it from me first." }, { by: 'b', dr: "Every pawn in this house has heard that exact sentence." }] },
    { id: 'zp.t3', turns: [{ by: 'a', say: "Stay calm, and you're off the block after the vote." }, { by: 'b', say: "Are the votes really there?" }, { by: 'a', say: "They're there." }] },
    { id: 'zp.t4', turns: [{ by: 'b', dr: "{a} talked fast and quietly. I nodded. Later I realised I never got an actual number." }] },
    { id: 'zp.t5', turns: [{ by: 'a', dr: "I need {b} to trust me. If {b} panics, the whole week falls apart." }] },
    { id: 'zp.t6', turns: [{ by: 'b', say: "Promise me." }, { by: 'a', say: "I promise." }, { by: 'b', dr: "That's the only promise that matters this week." }] },
  ],
  'cer.pawn.burned': [
    { id: 'zp.b1', turns: [{ by: 'b', say: "You told me something like this before." }, { beat: '{a} does not have an answer.' }, { by: 'b', say: "...Fine. Okay." }] },
    { id: 'zp.b2', turns: [{ by: 'b', dr: "{a} has told me I'm safe before. I'm not falling for it twice. But I've got no choice." }] },
    { id: 'zp.b3', turns: [{ by: 'a', say: "This time it's different." }, { by: 'b', say: "That's what you said last time." }] },
    { id: 'zp.b4', turns: [{ by: 'b', dr: "I agreed to be the pawn. When you're on the block, you agree to everything." }] },
    { id: 'zp.b5', turns: [{ by: 'a', say: "I need you to trust me." }, { by: 'b', say: "I know you do." }] },
    { id: 'zp.b6', turns: [{ by: 'b', dr: "I'll sit up here. But I'm counting the votes myself this time." }] },
  ],
  'cer.blindside.scene': [
    { id: 'zb.1', turns: [{ by: 'a', dr: "I'm going back over every conversation I've had with {b} this week. Knowing the ending changes all of them." }] },
    { id: 'zb.2', turns: [{ by: 'a', say: "Okay." }, { beat: '{a} says nothing else for the rest of the ceremony.' }] },
    { id: 'zb.3', turns: [{ by: 'a', dr: "I defended {b} twice this week. In front of people. That's the part that hurts." }] },
    { id: 'zb.4', turns: [{ by: 'a', dr: "I smiled through the whole ceremony. I won't be sleeping tonight." }] },
    { id: 'zb.5', when: { intent: 'promised' }, turns: [{ by: 'a', dr: "{b} said it out loud. 'You're not going up.' And I believed it." }] },
    { id: 'zb.6', when: { intent: 'allied' }, turns: [{ by: 'a', dr: "{b} and I were supposed to be in this together. I looked down the row at the rest of our alliance. Nobody would look at me." }] },
    { id: 'zb.7', turns: [{ by: 'a', say: "Was any of it real?" }, { by: 'b', say: "It's the game." }, { by: 'a', say: "That's not an answer." }] },
    { id: 'zb.8', when: { intent: 'promised' }, turns: [{ by: 'a', say: "You told me I was safe." }, { by: 'b', say: "Things changed." }, { by: 'a', say: "In a day?" }] },
  ],
  'cer.stoic.scene': [
    { id: 'zs.1', turns: [{ by: 'a', say: "What time are the veto players picked?" }, { beat: 'That is all {a} says.' }] },
    { id: 'zs.2', turns: [{ by: 'a', say: "Right. Then I'd better win the veto." }, { beat: 'Two people laugh. One of them stops.' }] },
    { id: 'zs.3', turns: [{ by: 'a', dr: "I'm not giving anyone a reaction. That's what they want." }] },
    { id: 'zs.4', turns: [{ by: 'a', dr: "Crying about it won't get me off the block. Winning the veto will." }] },
    { id: 'zs.5', turns: [{ beat: '{a} congratulates the HOH and goes to make coffee.' }, { by: 'a', dr: "Staying calm costs nothing. Panicking costs votes." }] },
    { id: 'zs.6', turns: [{ by: 'a', dr: "Everyone is talking about how calm I was. Good. Let them." }] },
  ],
  'cer.saved.scene': [
    { id: 'zv.1', turns: [{ by: 'a', say: "Thank you. Properly." }, { by: 'b', say: "You'd have done the same." }, { by: 'a', say: "I'd like to think so." }] },
    { id: 'zv.2', turns: [{ by: 'a', say: "You didn't have to do that." }, { by: 'b', say: "I did, though." }, { by: 'a', dr: "I owe {b}. I'm going to pay that back." }] },
    { id: 'zv.3', turns: [{ by: 'a', say: "I'm not going to forget this." }, { by: 'b', say: "I know." }] },
    { id: 'zv.4', turns: [{ beat: '{a} hugs {b} before the meeting has even ended.' }, { by: 'a', say: "Whatever you need next week, come to me first." }] },
    { id: 'zv.5', turns: [{ by: 'a', say: "Why did you do it?" }, { by: 'b', say: "Because I wanted you here." }, { by: 'a', dr: "I'll remember that answer." }] },
    { id: 'zv.6', turns: [{ by: 'a', dr: "Some deals are made with words. {b} and I just made one without saying anything." }] },
  ],
  'cer.left.scene': [
    { id: 'zl.1', turns: [{ by: 'a', dr: "I nodded like I knew it was coming. I didn't know it was coming." }] },
    { id: 'zl.2', turns: [{ by: 'a', say: "That's fine." }, { beat: '{a} says it again, without looking at anyone.' }, { by: 'a', say: "That's fine." }] },
    { id: 'zl.3', turns: [{ by: 'b', say: "I'm sorry." }, { by: 'a', say: "Don't." }] },
    { id: 'zl.4', turns: [{ by: 'a', dr: "I asked {b} for a different answer in private. Now I know what that conversation was worth." }] },
    { id: 'zl.5', when: { intent: 'allied' }, turns: [{ by: 'a', dr: "{b} and I are meant to be working together. {b} left me up here." }] },
    { id: 'zl.6', turns: [{ by: 'a', dr: "The veto went back in the box. I went back to counting votes." }] },
    { id: 'zl.7', turns: [{ by: 'b', dr: "I couldn't use it on {a}. I hope {a} understands. I don't think {a} does." }] },
  ],
  'cer.backdoor.scene': [
    { id: 'zd.1', turns: [{ by: 'a', dr: "When {b} said my name, the whole week made sense. The nominations. The pawn. All of it." }] },
    { id: 'zd.2', turns: [{ by: 'a', dr: "Everyone kept telling me I wasn't a target. They needed me to believe it. I did." }] },
    { id: 'zd.3', turns: [{ by: 'a', say: "So this was the plan all along." }, { by: 'b', say: "It was the plan all along." }] },
    { id: 'zd.4', turns: [{ by: 'a', dr: "Some people didn't even react when my name was called. That's how I know they knew." }] },
    { id: 'zd.5', turns: [{ by: 'a', say: "You couldn't have told me?" }, { by: 'b', say: "If I'd told you, it wouldn't have worked." }] },
    { id: 'zd.6', turns: [{ by: 'a', dr: "I never got to play in the veto. That was on purpose." }] },
  ],
  'cer.replace.scene': [
    { id: 'zr.1', turns: [{ by: 'a', say: "Was this always the plan?" }, { by: 'b', say: "No." }, { by: 'a', dr: "I don't believe that." }] },
    { id: 'zr.2', turns: [{ by: 'a', dr: "Once the veto was used, there was only ever one name that made the numbers work. Mine." }] },
    { id: 'zr.3', turns: [{ by: 'a', dr: "I'm not even angry. Just tired. I sat down, and the house started counting." }] },
    { id: 'zr.4', turns: [{ by: 'a', say: "Me? Really?" }, { by: 'b', say: "I'm sorry. It had to be someone." }] },
    { id: 'zr.5', turns: [{ by: 'a', dr: "I thought the veto would change somebody else's week. It changed mine." }] },
    { id: 'zr.6', turns: [{ by: 'b', dr: "Putting {a} up wasn't personal. {a} won't see it that way." }] },
  ],
  'cer.gracious.scene': [
    { id: 'zg.1', turns: [{ by: 'a', say: "Play hard. I'll be watching every second." }] },
    { id: 'zg.2', turns: [{ by: 'a', say: "I'm not going to be bitter about a game I asked to play." }, { beat: 'The room believes {a}.' }] },
    { id: 'zg.3', turns: [{ by: 'a', say: "No hard feelings. Seriously." }, { beat: '{a} hugs the people by the door and goes.' }] },
    { id: 'zg.4', turns: [{ by: 'a', say: "Somebody had to be right and somebody had to leave." }, { beat: 'The hugs start.' }] },
    { id: 'zg.5', when: { intent: 'close' }, turns: [{ beat: '{a} stops at {b} last. Whatever {a} says is too quiet for the room.' }, { by: 'b', dr: "I'll tell you what {a} said when this is over. Not before." }] },
    { id: 'zg.6', turns: [{ by: 'a', say: "Thank you, everyone. Really. Go and play." }, { beat: '{a} says something kind to each person on the way out.' }] },
    { id: 'zg.7', when: { intent: 'close' }, turns: [{ by: 'a', say: "Win it for both of us." }, { by: 'b', say: "I'll try." }] },
  ],
  'cer.scorched.plain': [
    { id: 'zx.p1', turns: [{ by: 'a', say: "{b}. You know what you did. And now everyone watching knows too." }] },
    { id: 'zx.p2', turns: [{ by: 'a', say: "I'd say good luck, {b}, but I'd be lying." }, { beat: '{a} picks up {a.posAdj} bag and walks out.' }] },
    { id: 'zx.p3', turns: [{ by: 'a', say: "If {b} promised you the same thing, talk to each other before the next vote." }] },
    { id: 'zx.p4', turns: [{ by: 'a', say: "You got me, {b}. Now explain to them why they're next." }] },
    { id: 'zx.p5', turns: [{ by: 'a', say: "{b} broke our deal and lied to cover it. Ask {b} about it after I'm gone." }] },
    { id: 'zx.p6', turns: [{ beat: '{a} hugs everyone except {b}.' }, { by: 'a', say: "Enjoy your week, {b}." }] },
  ],
  'cer.scorched.bloc': [
    { id: 'zx.b1', turns: [{ by: 'a', say: "{b}, you know what you did. And everyone should know who you did it with. {group}." }] },
    { id: 'zx.b2', turns: [{ by: 'a', say: "You think {b} plays alone? It's {group}. All of them." }] },
    { id: 'zx.b3', turns: [{ by: 'a', say: "Before I go: it's {group}. That's who's running this house. Do something about it." }] },
    { id: 'zx.b4', turns: [{ by: 'a', say: "{b} isn't the only one. It's {group}. You're welcome." }] },
    { id: 'zx.b5', turns: [{ beat: '{a} stops at the door.' }, { by: 'a', say: "One more thing. {b} is with {group}. Work it out." }] },
    { id: 'zx.b6', turns: [{ by: 'a', say: "I'm leaving, so I've got nothing to lose. {b} is working with {group}. Now everyone knows." }] },
  ],
  'cer.scorched.lie': [
    { id: 'zx.l1', turns: [{ by: 'a', say: "That story about me promising final two to everyone? {liar} made it up. Ask {liar}." }] },
    { id: 'zx.l2', turns: [{ by: 'a', say: "Before I go: {liar} lied about me. There were never any deals. Check." }] },
    { id: 'zx.l3', turns: [{ by: 'a', say: "{b}, you know what you did. And {liar}? That story about me wasn't true." }] },
    { id: 'zx.l4', turns: [{ by: 'a', say: "I'm out. But {liar} invented that whole story about me. Remember that." }] },
    { id: 'zx.l5', turns: [{ beat: '{a} turns at the door.' }, { by: 'a', say: "{liar}. Tell them the truth now I'm gone." }] },
    { id: 'zx.l6', turns: [{ by: 'a', say: "Everyone believed {liar} about me. Everyone was wrong." }] },
  ],
  'cer.scorched.vote': [
    { id: 'zx.v1', turns: [{ by: 'a', say: "And {b}? You voted out {voted}, whatever you told people." }] },
    { id: 'zx.v2', turns: [{ by: 'a', say: "One thing before I go. {b} voted {voted} out. {b} swore otherwise." }] },
    { id: 'zx.v3', turns: [{ by: 'a', say: "Ask {b} about the vote that sent {voted} home. Ask {b} why {b} lied about it." }] },
    { id: 'zx.v4', turns: [{ by: 'a', say: "{b} lied to you all about voting {voted} out. I know. Now you do too." }] },
    { id: 'zx.v5', turns: [{ beat: '{a} stops at the door.' }, { by: 'a', say: "{b} voted out {voted}. Think about that." }] },
    { id: 'zx.v6', turns: [{ by: 'a', say: "You got me, {b}. And everyone should know you got {voted} too." }] },
  ],
  'cer.blindsided.scene': [
    { id: 'zy.1', turns: [{ beat: '{a} stands up before the votes have finished being read.' }, { by: 'a', say: "I get it. I get it." }] },
    { id: 'zy.2', turns: [{ beat: '{a} looks straight at {b}. {b} looks at the floor.' }, { by: 'a', say: "Right." }] },
    { id: 'zy.3', turns: [{ by: 'a', say: "Wow." }, { beat: 'That is all {a} says on the way out.' }] },
    { id: 'zy.4', turns: [{ by: 'a', say: "So everybody knew except me." }, { beat: 'Nobody answers.' }] },
    { id: 'zy.5', turns: [{ by: 'a', say: "Was any of it real, {b}?" }, { beat: '{b} does not answer in time.' }] },
    { id: 'zy.6', turns: [{ beat: '{b} reaches for a goodbye hug. {a} hugs the person behind {b} instead.' }, { by: 'b', dr: "I deserved that." }] },
    { id: 'zy.7', turns: [{ by: 'a', say: "I counted the votes this morning. I counted them wrong." }] },
  ],
};
