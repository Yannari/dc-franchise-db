// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/fallout.js — the morning after an eviction (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/fallout.js. {gone} is the houseguest evicted last
// night. Nobody here knows more than the vote count and what they have been
// told: whoever accuses someone can be wrong, and only the accused, or the
// narrator, may say so.
//
//   fallout.grief       a lost a friend; b comforts, if there (bedroom)    scene; intent held | alone
//   fallout.hypocrisy   a is upset about {gone}; b doubts it                scene
//   fallout.relief      a is glad {gone} went; b, if there, minds           loud | quiet; intent seen
//   fallout.blame       a decides b got {gone} evicted                      correct | wrong
//   fallout.denial      a asks; b voted {gone} out and says otherwise       caught | believed | doubted
//                       {votes}: how many voted {gone} out, as a word
//   fallout.recognition a finds out b voted to keep {gone}                  close | new
//   fallout.rogue       a hunts the vote(s) to keep {gone}: b (and c)       correct | wrong (kitchen)
//   fallout.word        a tells b how {target} voted                        heard ({source} told a) | seen

export default {
  'fallout.grief.scene': [
    { id: 'fg.1', turns: [{ beat: '{a} makes one cup of coffee too many, notices, and pours it away.' }, { by: 'a', dr: "I made one for {gone}. Habit." }] },
    { id: 'fg.2', turns: [{ by: 'a', dr: "{gone} was the one person in here I didn't have to explain myself to. Now there's nobody like that." }] },
    { id: 'fg.3', turns: [{ by: 'a', say: "{gone} would have..." }, { beat: '{a} stops. Nobody finishes the sentence.' }] },
    { id: 'fg.4', turns: [{ beat: '{a} strips {gone}\'s bed and does not let anyone help.' }, { by: 'a', dr: "I wanted to do it myself." }] },
    { id: 'fg.5', when: { intent: 'held' }, turns: [{ by: 'b', say: "How are you doing?" }, { by: 'a', say: "Honestly? Not great." }, { by: 'b', say: "Come here." }, { beat: '{b} sits with {a} for a long time.' }] },
    { id: 'fg.6', when: { intent: 'held' }, turns: [{ by: 'b', say: "{gone} would want you to keep going." }, { by: 'a', say: "I know. It just doesn't feel like it today." }] },
    { id: 'fg.7', turns: [{ by: 'a', dr: "Everyone's carrying on like normal. I can't. Not today." }] },
    { id: 'fg.8', when: { intent: 'held' }, turns: [{ by: 'a', say: "I keep looking at {gone}'s bed." }, { by: 'b', say: "Then don't. Look at me. I'm still here." }] },
  ],
  'fallout.hypocrisy.scene': [
    { id: 'fh.1', turns: [{ by: 'a', say: "I can't believe {gone} is gone." }, { by: 'b', say: "Can't you?" }, { by: 'a', say: "What's that supposed to mean?" }, { by: 'b', say: "Nothing. Forget it." }, { by: 'b', dr: "You can't vote somebody out and then cry about it at breakfast. Well, you can. It just doesn't look great." }] },
    { id: 'fh.2', turns: [{ beat: "{a} has been crying on and off since the eviction." }, { by: 'b', say: "Do you want a tissue?" }, { by: 'a', say: "Thanks. I just can't believe {gone} is gone." }, { by: 'b', say: "Mm." }, { by: 'b', dr: "{a} is crying about {gone}. Funny. I'm pretty sure {a} voted {gone} out." }] },
    { id: 'fh.3', turns: [{ by: 'b', say: "You okay?" }, { by: 'a', say: "Not really. I'm going to miss {gone}." }, { by: 'b', say: "Even though you voted {gone} out?" }, { by: 'a', say: "Who told you that?" }, { by: 'b', say: "Nobody had to." }, { by: 'a', dr: "Yes, I voted {gone} out. That doesn't mean I wanted {gone} to go. Both things are true." }] },
    { id: 'fh.4', turns: [{ beat: "{b} hands {a} a tissue but says nothing." }, { by: 'a', say: "Thanks. Sorry. I'm a mess." }, { by: 'b', say: "It's fine." }, { by: 'a', say: "{gone} was one of my favourite people in here." }, { by: 'b', say: "Was {gone}?" }, { by: 'b', dr: "I don't know which one is real. The tears or the vote." }] },
    { id: 'fh.5', turns: [{ by: 'b', say: "Weren't you the one saying {gone} had to go?" }, { by: 'a', say: "That was the game. This is different." }, { by: 'b', say: "Is it?" }, { by: 'a', say: "Yes. It is." }, { by: 'b', dr: "It isn't. It never is." }] },
    { id: 'fh.6', turns: [{ by: 'a', say: "I miss {gone} already." }, { by: 'b', say: "Already?" }, { by: 'a', say: "The empty bed. It's weird." }, { by: 'b', say: "You'll get used to it." }, { by: 'b', dr: "I'm not buying it. Not after this week." }] },
    { id: 'fh.7', turns: [{ by: 'a', say: "This house won't be the same without {gone}." }, { by: 'b', say: "You'll manage." }, { by: 'a', say: "That's harsh." }, { by: 'b', say: "Is it? You'll manage fine. You always do." }, { by: 'b', dr: "{a} plays sad very well. I've seen the real thing. That isn't it." }] },
  ],
  'fallout.relief.loud': [
    { id: 'fr.l1', turns: [{ by: 'a', say: "I'm not going to pretend I'm sad. I slept better last night." }] },
    { id: 'fr.l2', turns: [{ by: 'a', say: "Am I supposed to be sad? Genuine question." }, { beat: 'Nobody answers.' }] },
    { id: 'fr.l3', turns: [{ by: 'a', dr: "Everyone's walking around like it's a funeral. {gone} was a problem for me. Now {gone} isn't." }] },
    { id: 'fr.l4', when: { intent: 'seen' }, turns: [{ by: 'a', say: "Best night's sleep I've had in weeks." }, { by: 'b', say: "Seriously? Today?" }, { by: 'a', say: "What? It's true." }] },
    { id: 'fr.l5', when: { intent: 'seen' }, turns: [{ beat: '{a} hums while making breakfast.' }, { by: 'b', say: "Could you not?" }, { by: 'a', say: "Not what?" }, { by: 'b', say: "Be that happy. Today." }] },
    { id: 'fr.l6', turns: [{ by: 'a', dr: "I'm in a good mood and I'm not hiding it. {gone} was coming after me." }] },
    { id: 'fr.l7', when: { intent: 'seen' }, turns: [{ by: 'b', dr: "{gone} has been gone for one night and {a} is already celebrating. I won't forget that." }] },
  ],
  'fallout.relief.quiet': [
    { id: 'fr.q1', turns: [{ by: 'a', dr: "I'll say the right things about {gone}. But I'm relieved. My name kept coming up in {gone}'s conversations." }] },
    { id: 'fr.q2', turns: [{ beat: '{a} finds somewhere quiet and lets out a long breath.' }, { by: 'a', dr: "That's one less person after me." }] },
    { id: 'fr.q3', turns: [{ by: 'a', dr: "I ate a proper breakfast today. First time in a week." }] },
    { id: 'fr.q4', turns: [{ by: 'a', say: "I'm going to miss {gone}." }, { by: 'a', dr: "I'm not going to miss {gone}." }] },
    { id: 'fr.q5', turns: [{ by: 'a', dr: "Nobody can know how relieved I am. So I'm keeping a very straight face today." }] },
    { id: 'fr.q6', turns: [{ by: 'a', dr: "I feel bad about feeling good. But I do feel good." }] },
  ],
  'fallout.blame.correct': [
    { id: 'fb.c1', turns: [{ by: 'a', say: "You were awfully quiet last night." }, { by: 'b', say: "It was an eviction. Everyone was quiet." }, { by: 'a', say: "Not like you." }, { by: 'b', say: "What are you getting at?" }, { by: 'a', say: "Nothing. Yet." }, { by: 'a', dr: "I worked it out. It was {b}. I can't prove it yet, but I know." }] },
    { id: 'fb.c2', turns: [{ by: 'a', say: "Who wanted {gone} gone the most? Honestly?" }, { by: 'b', say: "I don't know. Lots of people?" }, { by: 'a', say: "I keep coming back to one name." }, { by: 'b', say: "Is it mine?" }, { by: 'a', say: "You tell me." }, { by: 'a', dr: "I asked myself who wanted {gone} gone the most. Every time, I get the same answer. {b}." }] },
    { id: 'fb.c3', turns: [{ by: 'a', say: "It was you, wasn't it?" }, { by: 'b', say: "What was?" }, { by: 'a', say: "{gone}. You did that." }, { by: 'b', say: "I don't know what you're talking about." }, { by: 'a', say: "Yes, you do." }, { by: 'b', dr: "{a} knows. I don't know how, but {a} knows." }] },
    { id: 'fb.c4', turns: [
      { by: 'b', say: "Morning! Do you want a coffee?" },
      { by: 'a', say: "No, I'm okay." },
      { by: 'a', say: "You're in a good mood today.", v: { hard: "You're very happy this morning." } },
      { by: 'b', say: "I slept well." },
      { by: 'a', dr: "{b} has been smiling all morning. After last night, I know exactly why." }] },
    { id: 'fb.c5', turns: [{ by: 'b', say: "Are we okay?" }, { by: 'a', say: "{gone} is gone. So no, we're not okay." }, { by: 'b', say: "That wasn't me." }, { by: 'a', say: "It was. And the sooner you stop pretending, the sooner we can both stop wasting time." }, { by: 'a', dr: "{gone} is gone, and {b} is the reason. {b} is my target now." }] },
    { id: 'fb.c6', turns: [{ by: 'a', say: "I know it was you." }, { by: 'b', say: "Okay." }, { by: 'a', say: "That's it? Okay?" }, { by: 'b', say: "What do you want me to say?" }, { by: 'a', say: "The truth." }, { by: 'b', say: "The truth is it's a game, and {gone} was in my way." }, { by: 'a', dr: "At least {b} finally said it. That's going to cost {b} more than {b} thinks." }] },
  ],
  // the one blamed held the key last week: they did not vote, they nominated (read 2026-10-14: an HOH
  // answering "I voted to keep Millie!"). bb/script/write.js takes this pool on data.reason 'hoh'.
  'fallout.blame.about-hoh': [
    { id: 'fb.h1', turns: [{ by: 'b', say: "Why are you looking at me like that?" }, { by: 'a', say: "You put {gone} on that block." }, { by: 'b', say: "And the house voted. I didn't even get a vote." }, { by: 'a', say: "You didn't need one. You'd already done it." }] },
    { id: 'fb.h2', turns: [{ by: 'a', say: "Don't tell me it was the house. You picked {gone}. Out of everybody, you picked {gone}." }, { by: 'b', say: "Somebody had to sit there." }, { by: 'a', say: "And you decided it was {gone}." }, { by: 'a', dr: "{b} keeps saying the house voted. The house only got to vote because {b} sat {gone} in that chair." }] },
    { id: 'fb.h3', turns: [{ by: 'b', say: "I know you're angry with me." }, { by: 'a', say: "{gone} would still be here if you'd picked anybody else." }, { by: 'b', say: "That's not fair." }, { by: 'a', say: "No. It isn't. Ask {gone}." }] },
    { id: 'fb.h4', turns: [{ by: 'b', say: "You've been avoiding me." }, { by: 'a', say: "You nominated {gone}. What did you expect?" }, { by: 'b', say: "The house voted {gone} out. Not me." }, { by: 'a', say: "The house didn't put {gone} in that chair." }] },
    { id: 'fb.h5', turns: [{ by: 'a', dr: "{b} keeps saying it was the house. They were {b}'s nominations. Without them, {gone} is still here." }] },
    { id: 'fb.h6', turns: [{ by: 'a', say: "Out of everybody in this house, you put {gone} up." }, { by: 'b', say: "It was my HOH. Somebody had to go up." }, { by: 'a', say: "And you picked my friend." }] },
    { id: 'fb.h7', turns: [{ by: 'b', say: "Can I sit here?" }, { by: 'a', say: "{gone} used to sit there." }, { by: 'b', say: "I know." }, { by: 'a', say: "Then you know why I'd rather you didn't." }, { by: 'b', dr: "I nominated {gone}. I didn't evict anybody. Try explaining that to {a}." }] },
    { id: 'fb.h8', turns: [{ by: 'a', say: "Did you sleep okay, up in your big room?" }, { by: 'b', say: "Don't do that." }, { by: 'a', say: "Do what? {gone}'s bed is empty. Yours had a view." }, { by: 'b', say: "I had to put two people up. You'd have done the same." }, { by: 'a', say: "Not {gone}. I wouldn't have picked {gone}." }] },
    { id: 'fb.h9', turns: [{ by: 'a', say: "One question. Was {gone} ever the pawn?" }, { by: 'b', say: "...I said that at the time." }, { by: 'a', say: "That's not a yes." }, { by: 'b', say: "It got away from me." }, { by: 'a', dr: "\"It got away from me.\" {b} held the key, put {gone} in the chair, and somehow it got away from {b}." }] },
    { id: 'fb.h10', turns: [{ by: 'b', say: "You haven't said a word to me since the eviction." }, { by: 'a', say: "Because every time I look at you, I see {gone}'s face when the last key out of that box wasn't {gone}'s." }, { by: 'b', say: "It wasn't personal." }, { by: 'a', say: "It was to me." }] },
    { id: 'fb.h11', turns: [{ by: 'a', say: "Every week somebody's HOH, and every week they say it wasn't their fault." }, { by: 'b', say: "It wasn't. Count the votes." }, { by: 'a', say: "The votes only counted because you picked who they were for. You picked {gone}." }, { by: 'b', say: "And I'd do it again." }, { by: 'a', dr: "Good. At least now {b} has stopped hiding behind the house." }] },
  ],
  'fallout.blame.wrong': [
    { id: 'fb.w1', turns: [{ by: 'a', say: "Can we stop pretending?" }, { by: 'b', say: "Pretending what?" }, { by: 'a', say: "That you had nothing to do with {gone} going." }, { by: 'b', say: "I didn't!" }, { by: 'a', say: "Nobody else makes sense." }, { by: 'a', dr: "It was {b}. It has to be. Nobody else makes sense." }] },
    { id: 'fb.w2', turns: [{ by: 'a', say: "I know it was you." }, { by: 'b', say: "It wasn't. I swear." }, { by: 'a', say: "That's exactly what you would say." }, { by: 'b', say: "Ask anyone. Ask how I voted." }, { by: 'a', say: "Everybody in here lies about how they voted." }, { by: 'b', dr: "There's nothing I can say. Every answer sounds like a lie to {a} now." }] },
    { id: 'fb.w3', turns: [{ by: 'b', say: "You haven't said a word to me all day." }, { by: 'a', say: "I don't have anything to say to you." }, { by: 'b', say: "What did I do?" }, { by: 'a', say: "You know what you did." }, { by: 'b', say: "I genuinely don't." }, { by: 'a', dr: "I can't prove it was {b}. I don't need to. I just know." }] },
    { id: 'fb.w4', turns: [
      { by: 'b', say: "Why are you looking at me like that?" },
      { by: 'a', say: "You know why. {gone}." },
      { by: 'b', say: "I voted to keep {gone}! I swear I did.", v: { hard: "I voted to keep {gone}. Believe what you want." } },
      { by: 'a', say: "Sure you did." },
      { by: 'b', dr: "How do you prove how you voted? You can't. That's the whole problem with this house." }] },
    { id: 'fb.w5', turns: [{ by: 'b', say: "Why are you being so cold with me?" }, { by: 'a', say: "You know what you did to {gone}." }, { by: 'b', say: "I didn't do anything!" }, { by: 'a', say: "Didn't you? Then who did?" }, { by: 'b', say: "I don't know! Not me!" }, { by: 'b', dr: "Now I've got a target on my back for something I didn't do." }] },
    { id: 'fb.w6', turns: [{ by: 'b', say: "People are saying you think it was me." }, { by: 'a', say: "People are right." }, { by: 'b', say: "It wasn't. Ask anyone." }, { by: 'a', say: "I've asked. They all say the same thing you do." }, { by: 'b', say: "Because it's true!" }, { by: 'a', dr: "People keep telling me I'm wrong about {b}. I don't care. {b} goes next." }] },
  ],
  'fallout.denial.caught': [
    { id: 'fz.c1', turns: [{ by: 'b', say: "It wasn't me." }, { by: 'a', say: "It was {votes} to nothing, {b}. Everybody voted {gone} out." }, { by: 'b', say: "...Okay. Fine." }] },
    { id: 'fz.c2', turns: [{ by: 'b', say: "I voted to keep {gone}. I promise." }, { by: 'a', say: "Nobody voted to keep {gone}." }] },
    { id: 'fz.c3', turns: [{ by: 'b', say: "I was with {gone} right to the end." }, { by: 'a', say: "Then where's your vote? It was unanimous." }] },
    { id: 'fz.c4', turns: [{ by: 'a', dr: "{b} looked me in the eye and lied. The vote was unanimous. {b} forgot that." }] },
    { id: 'fz.c5', turns: [{ by: 'b', dr: "I forgot the vote was unanimous. That was stupid of me." }] },
    { id: 'fz.c6', turns: [{ by: 'b', say: "I didn't vote {gone} out." }, { by: 'a', say: "Don't. It was unanimous. Just don't." }] },
  ],
  'fallout.denial.believed': [
    { id: 'fz.b1', turns: [{ by: 'b', say: "It wasn't me. I need you to know that." }, { by: 'a', say: "I believe you." }, { by: 'b', dr: "I voted {gone} out. And {a} believed me." }] },
    { id: 'fz.b2', turns: [{ by: 'b', say: "I voted to keep {gone}." }, { by: 'a', say: "Thank you. Really." }] },
    { id: 'fz.b3', turns: [{ by: 'b', say: "I didn't vote against {gone}." }, { by: 'a', say: "Sorry I even asked." }, { by: 'b', say: "It's fine. I'd ask too." }] },
    { id: 'fz.b4', turns: [{ by: 'b', dr: "Lying to {a} made me feel sick. But {a} believed me." }] },
    { id: 'fz.b5', turns: [{ by: 'a', dr: "{b} swore {b.sub} voted to keep {gone}. I believe {b.obj}. I have to believe somebody." }] },
    { id: 'fz.b6', turns: [{ by: 'a', say: "Did you vote {gone} out? Just tell me." }, { by: 'b', say: "I'd never vote against {gone}." }, { by: 'a', say: "I know. I'm sorry. I'm just upset." }] },
  ],
  'fallout.denial.doubted': [
    { id: 'fz.d1', turns: [{ by: 'b', say: "It wasn't me." }, { beat: '{a} waits a second too long.' }, { by: 'a', say: "Okay." }] },
    { id: 'fz.d2', turns: [
      { by: 'a', say: "Did you vote {gone} out? Tell me the truth." },
      { by: 'b', say: "No. I didn't." },
      { by: 'a', say: "Are you sure?" },
      { by: 'b', say: "Yes, I'm sure. Why do you keep asking?", v: { anxious: "Yes. I promise. Please stop looking at me like that." } }] },
    { id: 'fz.d3', turns: [{ by: 'b', say: "I voted to keep {gone}." }, { by: 'a', say: "Thanks for being honest." }, { by: 'a', dr: "{b} wasn't being honest. I could tell." }] },
    { id: 'fz.d4', turns: [{ by: 'a', dr: "{b} says {b.sub} voted to keep {gone}. I don't believe a word of it." }] },
    { id: 'fz.d5', turns: [{ by: 'b', dr: "{a} didn't believe me. I could see it on {a.posAdj} face." }] },
    { id: 'fz.d6', turns: [{ by: 'a', say: "Look me in the eye and say it." }, { by: 'b', say: "I didn't vote {gone} out." }, { by: 'a', say: "You're not looking me in the eye." }] },
  ],
  'fallout.recognition.close': [
    { id: 'fn.c1', turns: [{ by: 'a', say: "You kept {gone}." }, { by: 'b', say: "Obviously I kept {gone}." }] },
    { id: 'fn.c2', turns: [{ by: 'a', dr: "I wasn't surprised {b} voted to keep {gone}. But it still helped. I'm not on my own." }] },
    { id: 'fn.c3', turns: [{ by: 'a', dr: "Everyone else is explaining their vote to me. {b} doesn't have to." }] },
    { id: 'fn.c4', turns: [{ by: 'b', say: "I'm sorry. I tried." }, { by: 'a', say: "I know you did." }] },
    { id: 'fn.c5', turns: [{ by: 'a', say: "At least I know where you stand." }, { by: 'b', say: "Right next to you. Same as always." }] },
    { id: 'fn.c6', turns: [{ by: 'b', dr: "I knew my vote wouldn't change anything. I did it anyway. {gone} was my friend too." }] },
  ],
  'fallout.recognition.new': [
    { id: 'fn.n1', turns: [{ by: 'a', say: "You voted to keep {gone}?" }, { by: 'b', say: "I told {gone} I would." }, { by: 'a', say: "...Sit with me?" }] },
    { id: 'fn.n2', turns: [{ by: 'a', dr: "{b} and I aren't close. But {b} kept {gone} when it didn't help {b.obj} at all. That means something." }] },
    { id: 'fn.n3', turns: [{ by: 'a', say: "Why did you vote to keep {gone}?" }, { by: 'b', say: "Because I gave {gone} my word." }] },
    { id: 'fn.n4', turns: [{ by: 'a', dr: "I didn't expect {b} to be the one who stood by {gone}. I need to talk to {b} more." }] },
    { id: 'fn.n5', turns: [{ by: 'b', say: "I know we don't talk much. But I liked {gone}." }, { by: 'a', say: "So did I. Thank you." }] },
    { id: 'fn.n6', turns: [{ by: 'a', say: "You didn't have to do that." }, { by: 'b', say: "I know. I wanted to." }] },
  ],
  'fallout.rogue.correct': [
    { id: 'fo.c1', turns: [{ by: 'a', say: "Somebody voted to keep {gone}. And I think I know who." }, { beat: '{a} looks straight at {b}.' }, { by: 'b', say: "Don't look at me." }] },
    { id: 'fo.c2', turns: [{ by: 'a', dr: "Everyone said they were voting {gone} out. The numbers say somebody didn't. I'm pretty sure it was {b}." }] },
    { id: 'fo.c3', turns: [{ by: 'a', say: "{b}. It was you, wasn't it?" }, { by: 'b', say: "...Does it matter now?" }] },
    { id: 'fo.c4', when: { third: true }, turns: [{ by: 'a', say: "{b} and {c}. You two kept {gone}." }, { by: 'c', say: "Says who?" }, { by: 'a', say: "Says the vote count." }] },
    { id: 'fo.c5', turns: [{ by: 'b', dr: "{a} worked out it was me. I don't know how. But {a} worked it out." }] },
    { id: 'fo.c6', turns: [{ by: 'a', dr: "{b} was close to {gone} all week. Who else was going to vote to keep {gone}?" }] },
  ],
  'fallout.rogue.wrong': [
    { id: 'fo.w1', turns: [{ by: 'a', say: "Somebody voted to keep {gone}. I think it was {b}." }, { by: 'b', say: "It wasn't me!" }, { by: 'a', say: "That's what you'd say." }] },
    { id: 'fo.w2', turns: [{ by: 'b', dr: "{a} thinks I voted to keep {gone}. I didn't. Now half the house thinks I'm lying." }] },
    { id: 'fo.w3', turns: [{ by: 'a', dr: "{b} was close to {gone}. That's enough for me." }] },
    { id: 'fo.w4', when: { third: true }, turns: [{ by: 'a', say: "{b} and {c}. It was you two." }, { by: 'c', say: "We voted with everyone else!" }, { by: 'a', say: "Sure you did." }] },
    { id: 'fo.w5', turns: [{ by: 'b', say: "I voted {gone} out, same as you." }, { by: 'a', say: "Prove it." }, { by: 'b', say: "How? It's a secret vote!" }] },
    { id: 'fo.w6', turns: [{ by: 'a', dr: "I've worked out who kept {gone}. {b}. I'd bet anything on it." }] },
  ],
  'fallout.word.heard': [
    { id: 'fw.h1', turns: [{ by: 'a', say: "{source} told me {target} voted {gone} out." }, { by: 'b', say: "And you believe {source}?" }, { by: 'a', say: "I do. Do you?" }, { by: 'b', say: "...Yeah. I think I do." }, { by: 'a', say: "Then we know where {target} stands." }, { by: 'b', say: "Against us, apparently." }, { by: 'b', dr: "I'd like to hear it from somebody other than {source}. But I don't think I need to." }] },
    { id: 'fw.h2', turns: [{ by: 'a', say: "I didn't see it myself. {source} told me." }, { by: 'b', say: "Told you what?" }, { by: 'a', say: "{target} voted against {gone}." }, { by: 'b', say: "And how would {source} know that?" }, { by: 'a', say: "{target} said so. To {source}'s face." }, { by: 'b', say: "Then either {target} is careless, or {source} is lying." }, { by: 'a', dr: "I can't tell which, either. But I wanted {b} to hear it." }] },
    { id: 'fw.h3', turns: [{ by: 'a', say: "You didn't hear this from me." }, { by: 'b', say: "Then who did I hear it from?" }, { by: 'a', say: "{source}. {source} says {target} voted {gone} out." }, { by: 'b', say: "Second-hand, then." }, { by: 'a', say: "Second-hand. But {source} has no reason to lie about it." }, { by: 'b', dr: "{a} heard it from {source}. That's second-hand. But I believe it." }] },
    { id: 'fw.h4', turns: [{ by: 'a', say: "This came from {source}, not me. But {target} voted {gone} out." }, { by: 'b', say: "Good to know." }, { by: 'a', say: "Just be careful what you tell {target} now." }, { by: 'b', say: "I'm always careful." }, { by: 'a', say: "Be more careful." }, { by: 'a', dr: "If this gets back to {target}, it's got {source}'s name on it. Not mine." }] },
    { id: 'fw.h5', turns: [
      { by: 'a', say: "{target} voted {gone} out." },
      { by: 'b', say: "How do you know?" },
      { by: 'a', say: "{source} told me." },
      { by: 'b', say: "Then it's probably true. Probably isn't definitely, though." },
      { by: 'b', dr: "I'm going to watch {target} at breakfast tomorrow. If {source} is right, {target} won't be able to look at me." }] },
    { id: 'fw.h6', turns: [{ by: 'a', say: "I'm only passing on what {source} told me." }, { by: 'b', say: "Which is?" }, { by: 'a', say: "That {target} voted {gone} out." }, { by: 'b', say: "Why are you telling me?" }, { by: 'a', say: "Because you were close to {gone}. You'd want to know." }, { by: 'a', dr: "I passed on what {source} told me about {target}. I made sure {b} knew where it came from." }] },
  ],
  'fallout.word.seen': [
    { id: 'fw.s1', turns: [{ by: 'a', say: "{target} voted {gone} out." }, { by: 'b', say: "Are you sure?" }, { by: 'a', say: "I watched {target} all night. {target} didn't even pretend to be sad." }, { by: 'b', say: "That's not proof." }, { by: 'a', say: "Then ask {target} about it and watch {target}'s face." }, { by: 'b', dr: "Not proof, maybe. But now I'm going to be watching too." }] },
    { id: 'fw.s2', turns: [
      { by: 'a', say: "{target} voted {gone} out. I'm sure of it." },
      { by: 'b', say: "How do you know?" },
      { by: 'a', say: "{target} came out of the Diary Room smiling. Nobody smiles on eviction night unless they got what they wanted." },
      { by: 'b', say: "That's not proof.", v: { hard: "That's it? A smile?" } },
      { by: 'a', say: "I know. But you didn't see it." },
      { by: 'b', dr: "{a} has no proof, just a smile. But honestly, I believe it." }] },
    { id: 'fw.s3', turns: [{ by: 'b', say: "Do you know how {target} voted?" }, { by: 'a', say: "{gone} out. I'm sure of it." }, { by: 'b', say: "Huh. I'd have bet the other way." }, { by: 'a', say: "So would {gone}." }] },
    { id: 'fw.s4', turns: [{ by: 'a', say: "I think {target} voted {gone} out." }, { by: 'b', say: "No way. {target} loved {gone}." }, { by: 'a', say: "{target} loved {gone} in public." }, { by: 'b', say: "...Who else knows?" }, { by: 'a', dr: "{b} didn't believe it at first. Then {b} wanted to know who else knew. That's when I knew it had landed." }] },
    { id: 'fw.s5', turns: [{ by: 'a', say: "{target} voted against {gone}." }, { by: 'b', say: "I really thought {target} was with {gone}." }, { by: 'a', say: "So did {gone}." }, { by: 'b', say: "Does anyone else know?" }, { by: 'a', say: "Not yet." }, { by: 'b', dr: "{target} hugged {gone} goodbye. I watched {target} do it." }] },
    { id: 'fw.s6', turns: [{ by: 'a', say: "Keep this between us. {target} voted against {gone}." }, { by: 'b', say: "Between us." }, { by: 'a', say: "I mean it. If {target} finds out I noticed, I'm next." }, { by: 'b', say: "Then I'll act like I don't know anything." }, { by: 'a', say: "You're good at that." }, { by: 'b', dr: "I am good at that. {target} is about to find out how good." }] },
    // this fires most weeks: six exchanges aired fw.s3, s4 and s5 twice each in one season (read 2026-10-14)
    { id: 'fw.s7', turns: [{ by: 'a', say: "Did you see {target} at the vote?" }, { by: 'b', say: "What about it?" }, { by: 'a', say: "Straight in, straight out. Didn't even sit down properly. That's somebody who'd already decided." }, { by: 'b', say: "Decided what?" }, { by: 'a', say: "{gone}." }, { by: 'b', dr: "{a} has been reading people's walks now. The scary thing is, {a} is usually right." }] },
    { id: 'fw.s8', turns: [{ by: 'b', say: "You've been quiet since the eviction." }, { by: 'a', say: "I've been going through everybody who told me they voted to keep {gone}." }, { by: 'b', say: "And?" }, { by: 'a', say: "More people told me that than there were votes to keep {gone}. Somebody's lying, and I think it's {target}." }, { by: 'b', say: "Why {target}?" }, { by: 'a', say: "Because {target} told me twice. Nobody tells you twice unless they need you to believe it." }] },
    { id: 'fw.s9', turns: [{ by: 'a', say: "Who was the first person to stop talking about {gone}?" }, { by: 'b', say: "I don't know. Who?" }, { by: 'a', say: "{target}. Barely an hour after the door shut." }, { by: 'b', say: "Maybe {target} just moves on fast." }, { by: 'a', say: "Or {target} was never going to miss {gone}." }, { by: 'a', dr: "People who lose a friend talk about it for days. {target} talked about it for an hour." }] },
    { id: 'fw.s10', turns: [{ by: 'a', say: "Tell me if I'm crazy." }, { by: 'b', say: "Depends what you say next." }, { by: 'a', say: "{target} voted {gone} out." }, { by: 'b', say: "...You're not crazy." }, { by: 'a', say: "You'd noticed too?" }, { by: 'b', say: "I noticed that {target} was the only one who wasn't surprised." }, { by: 'b', dr: "Two of us have noticed the same thing about {target}. That's no longer a hunch." }] },
    { id: 'fw.s11', turns: [{ by: 'a', say: "{target} asked me how I voted this morning." }, { by: 'b', say: "So?" }, { by: 'a', say: "So people who voted with the house don't ask. People who need to know who's angry do." }, { by: 'b', say: "You think {target} voted {gone} out." }, { by: 'a', say: "I think {target} wants to know if anybody's noticed." }, { by: 'a', dr: "I didn't tell {target} how I voted. I asked {b} what {b} thought about the question instead." }] },
    { id: 'fw.s12', turns: [{ by: 'b', say: "Do you think it was close?" }, { by: 'a', say: "The vote? No. But I know one name I didn't expect." }, { by: 'b', say: "Go on." }, { by: 'a', say: "{target}. I'd have bet anything {target} was keeping {gone}." }, { by: 'b', say: "What changed your mind?" }, { by: 'a', say: "{target} hasn't said one word to me since. And {target} always has something to say." }] },
  ],
};
