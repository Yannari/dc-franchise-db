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
    { id: 'fh.1', turns: [{ by: 'a', say: "I can't believe {gone} is gone." }, { by: 'b', say: "Can't you?" }] },
    { id: 'fh.2', turns: [{ by: 'b', dr: "{a} is crying about {gone}. Funny. I'm pretty sure {a} voted {gone} out." }] },
    { id: 'fh.3', turns: [{ by: 'a', dr: "Yes, I voted {gone} out. That doesn't mean I wanted {gone} to go. Both things are true." }] },
    { id: 'fh.4', turns: [{ beat: '{b} hands {a} a tissue but says nothing.' }, { by: 'b', dr: "I don't know which one is real. The tears or the vote." }] },
    { id: 'fh.5', turns: [{ by: 'b', say: "Weren't you the one saying {gone} had to go?" }, { by: 'a', say: "That was the game. This is different." }, { by: 'b', say: "Is it?" }] },
    { id: 'fh.6', turns: [{ by: 'a', say: "I miss {gone} already." }, { by: 'b', dr: "I'm not buying it. Not after this week." }] },
    { id: 'fh.7', turns: [{ by: 'a', say: "This house won't be the same without {gone}." }, { by: 'b', say: "You'll manage." }] },
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
    { id: 'fb.c1', turns: [{ by: 'a', dr: "I worked it out. It was {b}. I can't prove it yet, but I know." }] },
    { id: 'fb.c2', turns: [{ by: 'a', dr: "I asked myself who wanted {gone} gone the most. Every time, I get the same answer. {b}." }] },
    { id: 'fb.c3', turns: [{ by: 'a', say: "It was you, wasn't it?" }, { by: 'b', say: "What was?" }, { by: 'a', say: "{gone}. You did that." }, { by: 'b', say: "I don't know what you're talking about." }] },
    { id: 'fb.c4', turns: [{ by: 'a', dr: "{b} has been smiling all morning. Now I know why." }] },
    { id: 'fb.c5', turns: [{ by: 'a', dr: "{gone} is gone, and {b} is the reason. {b} is my target now." }] },
    { id: 'fb.c6', turns: [{ by: 'a', say: "I know it was you." }, { by: 'b', say: "Okay." }, { by: 'a', say: "That's it? Okay?" }, { by: 'b', say: "What do you want me to say?" }] },
  ],
  'fallout.blame.wrong': [
    { id: 'fb.w1', turns: [{ by: 'a', dr: "It was {b}. It has to be. Nobody else makes sense." }] },
    { id: 'fb.w2', turns: [{ by: 'a', say: "I know it was you." }, { by: 'b', say: "It wasn't. I swear." }, { by: 'a', say: "That's exactly what you would say." }] },
    { id: 'fb.w3', turns: [{ by: 'a', dr: "I can't prove it was {b}. I don't need to. I just know." }] },
    { id: 'fb.w4', turns: [{ by: 'b', say: "Why are you looking at me like that?" }, { by: 'a', say: "You know why." }, { by: 'b', say: "I really don't." }] },
    { id: 'fb.w5', turns: [{ by: 'b', say: "Why are you being so cold with me?" }, { by: 'a', say: "You know what you did to {gone}." }, { by: 'b', say: "I didn't do anything!" }, { by: 'b', dr: "Now I've got a target on my back for something I didn't do." }] },
    { id: 'fb.w6', turns: [{ by: 'a', dr: "People keep telling me I'm wrong about {b}. I don't care. {b} goes next." }] },
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
    { id: 'fz.b6', turns: [{ by: 'b', say: "I'd never vote against {gone}." }, { by: 'a', say: "I know. I'm sorry. I'm just upset." }] },
  ],
  'fallout.denial.doubted': [
    { id: 'fz.d1', turns: [{ by: 'b', say: "It wasn't me." }, { beat: '{a} waits a second too long.' }, { by: 'a', say: "Okay." }] },
    { id: 'fz.d2', turns: [{ by: 'a', say: "Did you vote {gone} out?" }, { by: 'b', say: "No." }, { by: 'a', say: "Are you sure?" }, { by: 'b', say: "...Yes." }] },
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
    { id: 'fw.h1', turns: [{ by: 'a', say: "{source} told me {target} voted {gone} out." }, { by: 'b', say: "And you believe {source}?" }, { by: 'a', say: "I do. Do you?" }, { by: 'b', say: "...Yeah. I think I do." }] },
    { id: 'fw.h2', turns: [{ by: 'a', say: "I didn't see it myself. {source} told me." }, { by: 'b', say: "Told you what?" }, { by: 'a', say: "{target} voted against {gone}." }] },
    { id: 'fw.h3', turns: [{ by: 'b', dr: "{a} heard it from {source}. That's second-hand. But I believe it." }] },
    { id: 'fw.h4', turns: [{ by: 'a', say: "This came from {source}, not me. But {target} voted {gone} out." }, { by: 'b', say: "Good to know." }] },
    { id: 'fw.h5', turns: [{ by: 'a', say: "{target} voted {gone} out." }, { by: 'b', say: "How do you know?" }, { by: 'a', say: "{source}." }, { by: 'b', say: "Then it's probably true." }] },
    { id: 'fw.h6', turns: [{ by: 'a', dr: "I passed on what {source} told me about {target}. I made sure {b} knew where it came from." }] },
  ],
  'fallout.word.seen': [
    { id: 'fw.s1', turns: [{ by: 'a', say: "{target} voted {gone} out." }, { by: 'b', say: "Are you sure?" }, { by: 'a', say: "Completely sure." }, { by: 'b', say: "...Wow." }] },
    { id: 'fw.s2', turns: [{ by: 'a', say: "{target} wrote {gone}'s name down." }, { by: 'b', say: "How do you know?" }, { by: 'a', say: "Trust me. I know." }] },
    { id: 'fw.s3', turns: [{ by: 'b', say: "Who voted {gone} out?" }, { by: 'a', say: "{target}, for one." }, { by: 'b', say: "Who else?" }, { by: 'a', say: "That's the only one I know for sure." }] },
    { id: 'fw.s4', turns: [{ by: 'a', dr: "I told {b} about {target}'s vote. {b} didn't believe it at first. Then {b} wanted to know who else knew." }] },
    { id: 'fw.s5', turns: [{ by: 'a', say: "{target} voted against {gone}." }, { by: 'b', say: "I really thought {target} was with {gone}." }, { by: 'a', say: "So did {gone}." }] },
    { id: 'fw.s6', turns: [{ by: 'a', say: "Keep this between us. {target} voted against {gone}." }, { by: 'b', say: "Between us." }] },
  ],
};
