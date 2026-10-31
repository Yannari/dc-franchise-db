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
//   fallout.blame       a decides b got {gone} evicted                      correct | wrong; intent split | unanimous
//                       reason hoh | told | veto | alliance ({partner}) | couple ({partner}): what the blame rests on
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
    { id: 'fb.c1', when: { intent: 'split' }, turns: [{ by: 'a', say: "You were really quiet at the vote last night." }, { by: 'b', say: "Everybody was quiet." }, { by: 'a', say: "Not like you. You voted {gone} out, didn't you?" }, { by: 'b', say: "I'm not doing this with you right now." }, { by: 'a', dr: "{b} didn't say no. I'm pretty sure {b} voted {gone} out. I just can't prove it yet." }] },
    { id: 'fb.c2', turns: [{ by: 'a', say: "Who wanted {gone} gone the most? Honestly?" }, { by: 'b', say: "I don't know. Lots of people?" }, { by: 'a', say: "I keep coming back to one name." }, { by: 'b', say: "Is it mine?" }, { by: 'a', say: "You tell me." }, { by: 'a', dr: "I asked myself who wanted {gone} gone the most. Every time, I get the same answer. {b}." }] },
    { id: 'fb.c3', when: { intent: 'split' }, turns: [{ by: 'a', say: "You voted {gone} out, didn't you?" }, { by: 'b', say: "I don't know what you're talking about." }, { by: 'a', say: "Yes, you do." }, { by: 'b', dr: "{a} knows I voted {gone} out. I don't know how, but {a} knows." }] },
    { id: 'fb.c4', turns: [
      { by: 'b', say: "Morning! Do you want a coffee?" },
      { by: 'a', say: "No, I'm okay." },
      { by: 'a', say: "You're in a good mood today.", v: { hard: "You're very happy this morning." } },
      { by: 'b', say: "I slept well." },
      { by: 'a', dr: "{gone} went home last night and {b} has been smiling all morning. {b} wanted {gone} out. I'd bet anything on it." }] },
    { id: 'fb.c5', turns: [{ by: 'b', say: "Are we okay?" }, { by: 'a', say: "{gone} is gone. So no, we're not okay." }, { by: 'b', say: "That wasn't me." }, { by: 'a', say: "It was. And the sooner you stop pretending, the sooner we can both stop wasting time." }, { by: 'a', dr: "{gone} is gone, and {b} is the reason. {b} is my target now." }] },
    { id: 'fb.c6', when: { intent: 'split' }, turns: [{ by: 'a', say: "I know you voted {gone} out." }, { by: 'b', say: "Okay." }, { by: 'a', say: "That's it? Okay?" }, { by: 'b', say: "What do you want me to say? Yes. I did." }, { by: 'a', say: "Why?" }, { by: 'b', say: "Because it's a game, and {gone} was in my way." }, { by: 'a', dr: "At least {b} admitted it. I'm coming after {b} now, and {b} knows it." }] },
    // everybody wrote the same name: there is no ballot to find, only who got the house there
    { id: 'fb.c7', when: { intent: 'unanimous' }, turns: [{ by: 'a', say: "I know everybody voted {gone} out. But somebody got the house there, and I think it was you." }, { by: 'b', say: "It wasn't some big plan. Everybody wanted it." }, { by: 'a', say: "Everybody wanted it after you'd talked to them." }, { by: 'a', dr: "The vote was unanimous, so there's no one ballot to be mad at. But I think {b} is the one who got everyone to {gone}." }] },
    { id: 'fb.c8', when: { intent: 'unanimous' }, turns: [{ by: 'b', say: "It was unanimous. You can't be mad at just me." }, { by: 'a', say: "I can. I think you're the one who started it." }, { by: 'b', say: "I said what I thought about {gone}. Everybody else agreed." }, { by: 'a', dr: "Every single person voted {gone} out. I still think {b} is the one who made it easy for them." }] },
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
    { id: 'fb.h11', turns: [{ by: 'a', say: "Every week somebody's HOH, and every week they say it wasn't their fault." }, { by: 'b', say: "It wasn't. The house voted." }, { by: 'a', say: "The votes only counted because you picked who they were for. You picked {gone}." }, { by: 'b', say: "And I'd do it again." }, { by: 'a', dr: "Good. At least now {b} has stopped hiding behind the house." }] },
  ],
  'fallout.blame.wrong': [
    { id: 'fb.w1', turns: [{ by: 'a', say: "Can we stop pretending?" }, { by: 'b', say: "Pretending what?" }, { by: 'a', say: "That you had nothing to do with {gone} going." }, { by: 'b', say: "I didn't!" }, { by: 'a', say: "Nobody else makes sense." }, { by: 'a', dr: "It was {b}. It has to be. Nobody else makes sense." }] },
    { id: 'fb.w2', turns: [{ by: 'a', say: "I know you voted {gone} out." }, { by: 'b', say: "I didn't. I swear." }, { by: 'a', say: "That's exactly what you'd say." }, { by: 'b', say: "I voted to keep {gone}. Ask anyone." }, { by: 'a', say: "Nobody in here tells the truth about how they voted." }, { by: 'b', dr: "I voted to keep {gone} and {a} doesn't believe me. There's no way to prove a vote." }] },
    { id: 'fb.w3', turns: [{ by: 'b', say: "You haven't said a word to me all day." }, { by: 'a', say: "I don't have anything to say to you. Not after {gone}." }, { by: 'b', say: "What did I do?" }, { by: 'a', say: "You voted {gone} out." }, { by: 'b', say: "I didn't! I really didn't." }, { by: 'a', dr: "I can't prove {b} voted {gone} out. I just know it." }] },
    { id: 'fb.w4', turns: [
      { by: 'b', say: "Why are you looking at me like that?" },
      { by: 'a', say: "You know why. {gone}." },
      { by: 'b', say: "I voted to keep {gone}! I swear I did.", v: { hard: "I voted to keep {gone}. Believe what you want." } },
      { by: 'a', say: "Sure you did." },
      { by: 'b', dr: "How do you prove how you voted? You can't. That's the whole problem with this house." }] },
    { id: 'fb.w5', turns: [{ by: 'b', say: "Why are you being so cold with me?" }, { by: 'a', say: "You know what you did to {gone}." }, { by: 'b', say: "I didn't do anything!" }, { by: 'a', say: "Didn't you? Then who did?" }, { by: 'b', say: "I don't know! Not me!" }, { by: 'b', dr: "Now I've got a target on my back for something I didn't do." }] },
    { id: 'fb.w6', turns: [{ by: 'b', say: "People are saying you think it was me." }, { by: 'a', say: "People are right." }, { by: 'b', say: "It wasn't. Ask anyone." }, { by: 'a', say: "I've asked. They all say the same thing you do." }, { by: 'b', say: "Because it's true!" }, { by: 'a', dr: "People keep telling me I'm wrong about {b}. I don't care. {b} goes next." }] },
  ],
  // somebody TOLD them how b voted (bb/fallout.js assignBlame basis 'told')
  'fallout.blame.about-told': [
    { id: 'fbt.1', when: { ending: 'correct' }, turns: [{ by: 'a', say: "Somebody told me how you voted." }, { by: 'b', say: "Who?" }, { by: 'a', say: "Doesn't matter. You voted {gone} out." }, { by: 'b', say: "...Yeah. I did." }, { by: 'a', dr: "I heard it from someone else first, and then {b} said it to my face. At least {b} didn't lie about it." }] },
    { id: 'fbt.2', when: { ending: 'correct' }, turns: [{ by: 'b', say: "Why are you looking at me like that?" }, { by: 'a', say: "Because I know you voted {gone} out. Someone told me." }, { by: 'b', say: "Whoever told you should mind their own business." }, { by: 'a', say: "So it's true." }, { by: 'a', dr: "{b} didn't deny it. {b} just wanted to know who told me." }] },
    { id: 'fbt.3', when: { ending: 'wrong' }, turns: [{ by: 'a', say: "I heard you voted {gone} out." }, { by: 'b', say: "Who said that? Because it's not true." }, { by: 'a', say: "Someone I trust." }, { by: 'b', say: "Then someone you trust is lying to you. I voted to keep {gone}." }, { by: 'b', dr: "Somebody is telling people I voted {gone} out. I didn't. Now I have to find out who's saying it." }] },
    { id: 'fbt.4', when: { ending: 'wrong' }, turns: [{ by: 'a', say: "I was told you flipped on {gone}." }, { by: 'b', say: "I didn't flip. I voted to keep {gone}." }, { by: 'a', say: "That's not what I heard." }, { by: 'b', say: "Then you heard wrong." }, { by: 'a', dr: "Somebody told me {b} voted {gone} out. {b} says no. One of them is lying to me." }] },
    { id: 'fbt.5', when: { ending: 'correct' }, turns: [{ by: 'a', dr: "Somebody told me {b} voted {gone} out. I didn't want to believe it. Then I asked {b}, and {b} couldn't look at me." }] },
    { id: 'fbt.6', when: { ending: 'wrong' }, turns: [{ by: 'b', say: "People are saying I voted {gone} out. You believe them?" }, { by: 'a', say: "I don't know what to believe. Someone told me you did." }, { by: 'b', say: "I voted to keep {gone}. I don't know what else to tell you." }, { by: 'a', dr: "I was told {b} voted {gone} out. {b} swears it was a vote to keep. I really don't know who to believe right now." }] },
    { id: 'fbt.7', turns: [{ by: 'a', say: "Someone told me you voted {gone} out." }, { by: 'b', say: "And you believe them?" }, { by: 'a', say: "I don't know yet. That's why I'm asking you." }, { by: 'b', say: "Then ask me again when you're not this angry." }, { by: 'a', dr: "I heard {b} voted {gone} out. {b} didn't say yes and didn't say no." }] },
    { id: 'fbt.8', turns: [{ by: 'a', dr: "Somebody came to me this morning and told me {b} voted {gone} out. Now I can't stop watching {b}." }] },
    { id: 'fbt.9', turns: [{ by: 'b', say: "Who's been talking to you about me?" }, { by: 'a', say: "Doesn't matter. They said you voted {gone} out." }, { by: 'b', say: "People say a lot of things in here." }, { by: 'a', dr: "{b} wanted to know who told me before {b} would tell me how the vote went. That's what I'll remember." }] },
  ],
  // b won the veto and left {gone} on the block
  'fallout.blame.about-veto': [
    { id: 'fbv.1', turns: [{ by: 'a', say: "You had the veto." }, { by: 'b', say: "I know." }, { by: 'a', say: "You could have taken {gone} off the block, and you didn't even try." }, { by: 'b', say: "I thought about it. It wasn't the right move for my game." }, { by: 'a', dr: "{b} had the veto and left {gone} sitting up there. That's how {gone} went home." }] },
    { id: 'fbv.2', turns: [{ by: 'b', say: "You're mad at me." }, { by: 'a', say: "You won the veto and you didn't use it on {gone}." }, { by: 'b', say: "If I use it, someone else goes up. Maybe me." }, { by: 'a', say: "Maybe. And {gone} would still be here." }, { by: 'a', dr: "I know why {b} didn't use it. I still can't look at {b} today." }] },
    { id: 'fbv.3', when: { ending: 'correct' }, turns: [{ by: 'a', say: "You left {gone} on the block, and then you voted {gone} out." }, { by: 'b', say: "I did. I'm not going to pretend I didn't." }, { by: 'a', dr: "{b} won the veto, didn't use it, and then voted {gone} out as well. I'm not forgetting that." }] },
    { id: 'fbv.4', when: { ending: 'wrong' }, turns: [{ by: 'a', say: "You left {gone} on the block. You wanted {gone} gone." }, { by: 'b', say: "Not using the veto isn't the same thing. I voted to keep {gone}." }, { by: 'a', say: "You can say that. You still left {gone} up there." }, { by: 'b', dr: "I voted to keep {gone}. But I didn't use the veto, and that's all {a} can see." }] },
    { id: 'fbv.5', turns: [{ by: 'a', dr: "{b} won the veto this week. {gone} was sitting right there on the block, and {b} kept it. I'm not going to forget that." }] },
    { id: 'fbv.6', turns: [{ by: 'b', say: "I know what you're going to say." }, { by: 'a', say: "Then say it for me." }, { by: 'b', say: "I should have used the veto on {gone}." }, { by: 'a', say: "Yeah. You should have." }, { by: 'b', dr: "I kept the veto to protect my own game, and {gone} went home. {a} is never going to let that go." }] },
  ],
  // b is in a group the mourner thinks did it; {partner} is another of them
  'fallout.blame.about-alliance': [
    { id: 'fba.1', turns: [{ by: 'a', say: "You and {partner} are working together. Don't bother saying you're not." }, { by: 'b', say: "And?" }, { by: 'a', say: "And {gone} is gone. You two had the numbers." }, { by: 'a', dr: "{b} and {partner} vote together. They wanted {gone} out, and now {gone} is out." }] },
    { id: 'fba.2', when: { ending: 'correct' }, turns: [{ by: 'b', say: "Why are you being cold with me?" }, { by: 'a', say: "Because you and {partner} voted {gone} out." }, { by: 'b', say: "We talked about it, yes." }, { by: 'a', say: "So you admit it." }, { by: 'b', dr: "I didn't mean to say it like that. Now {a} knows {partner} and I voted together." }] },
    { id: 'fba.3', when: { ending: 'wrong' }, turns: [{ by: 'a', say: "You and {partner} got {gone} out." }, { by: 'b', say: "I voted to keep {gone}. Whatever {partner} did, I didn't." }, { by: 'a', say: "You two do everything together." }, { by: 'b', dr: "{a} thinks I voted with {partner}. I didn't. But I can't say who did without giving up my own side." }] },
    { id: 'fba.4', turns: [{ by: 'a', dr: "Every time I see {b}, {partner} is right there. I know they're working together, and I know who wanted {gone} out." }] },
    { id: 'fba.5', when: { ending: 'correct' }, turns: [{ by: 'a', say: "Did you and {partner} decide on {gone} together?" }, { by: 'b', say: "We talk about everything. You know that." }, { by: 'a', say: "That's a yes." }, { by: 'a', dr: "{b} didn't even try to deny it. {b} and {partner} voted {gone} out together." }] },
    { id: 'fba.6', when: { ending: 'wrong' }, turns: [{ by: 'b', say: "This is about {partner}, isn't it?" }, { by: 'a', say: "It's about the two of you voting {gone} out." }, { by: 'b', say: "I didn't. I don't know how {partner} voted and I didn't ask." }, { by: 'b', dr: "I'm getting blamed for {gone} because I'm close to {partner}. I voted to keep {gone}." }] },
    { id: 'fba.7', turns: [{ by: 'b', say: "Are you okay?" }, { by: 'a', say: "Don't. I know you and {partner} wanted {gone} gone." }, { by: 'b', say: "That's not fair." }, { by: 'a', say: "Isn't it? You two had the votes and {gone} isn't here." }, { by: 'a', dr: "{b} and {partner} are working together, and {gone} was in their way. That's all I need to know." }] },
  ],
  // b's partner in a showmance: two votes {a} reads as one
  'fallout.blame.about-couple': [
    { id: 'fbp.1', turns: [{ by: 'a', say: "You and {partner} voted {gone} out." }, { by: 'b', say: "You don't know that." }, { by: 'a', say: "You two vote the same way every week. Everybody knows that." }, { by: 'a', dr: "{b} and {partner} are a couple. If one of them voted {gone} out, they both did." }] },
    { id: 'fbp.2', when: { ending: 'wrong' }, turns: [{ by: 'a', say: "You and {partner} got {gone} out." }, { by: 'b', say: "I voted to keep {gone}. I can't tell you what {partner} did." }, { by: 'a', say: "Come on. You two do everything together." }, { by: 'b', dr: "Because I'm with {partner}, everybody thinks we're one vote. I voted to keep {gone}." }] },
    { id: 'fbp.3', when: { ending: 'correct' }, turns: [{ by: 'b', say: "Is this about {gone}?" }, { by: 'a', say: "It's about you and {partner}. You both voted {gone} out." }, { by: 'b', say: "We talked about it. We decided together." }, { by: 'a', dr: "There it is. They decide together. That's two votes I have to deal with now." }] },
    { id: 'fbp.4', turns: [{ by: 'a', dr: "{b} and {partner} are a couple. They sleep in the same bed and they vote the same way. {gone} never stood a chance against them." }] },
    { id: 'fbp.5', when: { ending: 'correct' }, turns: [{ by: 'a', say: "Did {partner} tell you how to vote?" }, { by: 'b', say: "Nobody tells me how to vote." }, { by: 'a', say: "But you both voted {gone} out." }, { by: 'b', say: "...Yes. We did." }, { by: 'a', dr: "{b} voted {gone} out, and so did {partner}. I'm done treating them like two different people." }] },
    { id: 'fbp.6', when: { ending: 'wrong' }, turns: [{ by: 'b', say: "I know what you think. You think {partner} and I voted {gone} out." }, { by: 'a', say: "Didn't you?" }, { by: 'b', say: "I didn't. I voted to keep {gone}. I'm allowed to vote differently from {partner}." }, { by: 'a', dr: "{b} says the vote was to keep {gone}. I don't know. {b} and {partner} do everything together." }] },
    { id: 'fbp.7', turns: [{ by: 'a', say: "I'm not going to yell at you. I just want you to know I know." }, { by: 'b', say: "Know what?" }, { by: 'a', say: "That you and {partner} wanted {gone} out. You two are one vote with two names on it." }, { by: 'b', say: "That's not how it works with us." }, { by: 'a', dr: "{b} and {partner} can say they vote separately. I don't believe it, not after {gone}." }] },
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
    { id: 'fo.c4', when: { third: true }, turns: [{ by: 'a', say: "{b} and {c}. You two kept {gone}." }, { by: 'c', say: "Says who?" }, { by: 'a', say: "Says the vote." }] },
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
  // a guess at how {target} voted, from something {a} saw. Plain talk, hedged the way people hedge (the user,
  // 2026-10-25: "Straight in, straight out. Didn't even sit down properly... Martin has been reading people's
  // walks now", "why are they not talking like human")
  'fallout.word.seen': [
    { id: 'fw.s1', turns: [
      { by: 'a', say: "I think {target} voted {gone} out." },
      { by: 'b', say: "Why?" },
      { by: 'a', say: "{target} wasn't upset. At all. Everybody else was crying and {target} was making a sandwich." },
      { by: 'b', say: "That's not proof." },
      { by: 'a', say: "I know it's not proof. I just think it." },
      { by: 'b', dr: "I didn't think anything of {target} until {a} said that. Now I'm going to be watching {target}." }] },
    { id: 'fw.s2', turns: [
      { by: 'a', say: "{target} voted {gone} out. I'm almost sure." },
      { by: 'b', say: "How do you know?" },
      { by: 'a', say: "{target} came out of the Diary Room smiling. Who smiles on eviction night?" },
      { by: 'b', say: "That's not proof.", v: { hard: "That's it? A smile?" } },
      { by: 'a', say: "I know. But you didn't see it." },
      { by: 'b', dr: "It's just a smile. But {a} is usually right about this stuff, so I'm keeping it in the back of my head." }] },
    { id: 'fw.s3', turns: [
      { by: 'b', say: "Do you know how {target} voted?" },
      { by: 'a', say: "I think {target} voted {gone} out." },
      { by: 'b', say: "Really? I'd have said {target} voted to keep {gone}." },
      { by: 'a', say: "So would I, a week ago." },
      { by: 'b', say: "What changed?" },
      { by: 'a', say: "I don't know. Just how {target} has been since. Really quiet." }] },
    { id: 'fw.s4', turns: [
      { by: 'a', say: "I think {target} voted {gone} out." },
      { by: 'b', say: "No way. {target} and {gone} were close." },
      { by: 'a', say: "They were close when people were watching." },
      { by: 'b', say: "...Who else thinks that?" },
      { by: 'a', say: "Nobody. Just me. And now you." },
      { by: 'a', dr: "{b} didn't believe me at first. Then {b} asked who else knows, which means {b} believes me." }] },
    { id: 'fw.s5', turns: [
      { by: 'a', say: "{target} voted against {gone}." },
      { by: 'b', say: "Seriously? I really thought {target} was with {gone}." },
      { by: 'a', say: "So did {gone}." },
      { by: 'b', say: "Does anybody else know?" },
      { by: 'a', say: "Not yet. Don't say anything." },
      { by: 'b', dr: "{target} hugged {gone} goodbye last night. I watched {target} do it." }] },
    { id: 'fw.s6', turns: [
      { by: 'a', say: "Keep this between us. I think {target} voted {gone} out." },
      { by: 'b', say: "Okay. Between us." },
      { by: 'a', say: "I mean it. If {target} finds out I'm saying this, I'm next." },
      { by: 'b', say: "I won't say anything." },
      { by: 'a', say: "Thank you." },
      { by: 'b', dr: "I won't say anything to {target}. I might say something to a couple of other people." }] },
    // this fires most weeks: six exchanges aired fw.s3, s4 and s5 twice each in one season (read 2026-10-14)
    { id: 'fw.s7', turns: [
      { by: 'a', say: "Did you see {target} when the votes were being read?" },
      { by: 'b', say: "No, why?" },
      { by: 'a', say: "{target} didn't even look up. Everybody else was looking around the room, and {target} just stared at the floor." },
      { by: 'b', say: "You think {target} voted {gone} out?" },
      { by: 'a', say: "I think so. Yeah." },
      { by: 'b', dr: "{a} watches everybody in this house. If {a} thinks it was {target}, it was probably {target}." }] },
    { id: 'fw.s8', turns: [
      { by: 'b', say: "You've been really quiet since the eviction." },
      { by: 'a', say: "I've been counting everybody who told me they voted to keep {gone}." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "Too many people told me that. There weren't that many votes to keep {gone}. Somebody's lying to me." },
      { by: 'b', say: "Who?" },
      { by: 'a', say: "I think {target}. {target} told me twice, and I didn't even ask the second time." }] },
    { id: 'fw.s9', turns: [
      { by: 'a', say: "Have you noticed {target} hasn't said anything about {gone}?" },
      { by: 'b', say: "Not really. Why?" },
      { by: 'a', say: "Everybody's been talking about {gone} all morning. {target} hasn't said {gone}'s name once." },
      { by: 'b', say: "Maybe {target} is just upset." },
      { by: 'a', say: "Or {target} voted {gone} out and doesn't want to talk about it." },
      { by: 'a', dr: "When you're upset somebody left, you talk about them. {target} has been talking about breakfast." }] },
    { id: 'fw.s10', turns: [
      { by: 'a', say: "Okay, tell me if I'm crazy." },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "I think {target} voted {gone} out." },
      { by: 'b', say: "...No, you're not crazy. I thought the same thing." },
      { by: 'a', say: "Why?" },
      { by: 'b', say: "{target} was the only one who didn't look surprised when the count came out." },
      { by: 'b', dr: "So it's not just me. {a} thinks it was {target} too." }] },
    { id: 'fw.s11', turns: [
      { by: 'a', say: "{target} asked me how I voted this morning." },
      { by: 'b', say: "So?" },
      { by: 'a', say: "So why does {target} need to know that? Unless {target} is worried about who's mad." },
      { by: 'b', say: "You think {target} voted {gone} out." },
      { by: 'a', say: "I think {target} is checking if anybody's noticed." },
      { by: 'a', dr: "I didn't tell {target} how I voted. I came straight to {b} instead." }] },
    { id: 'fw.s12', turns: [
      { by: 'b', say: "Was the vote close, do you think?" },
      { by: 'a', say: "No. But there's one name I didn't expect." },
      { by: 'b', say: "Who?" },
      { by: 'a', say: "{target}. I really thought {target} was keeping {gone}." },
      { by: 'b', say: "What makes you think {target} didn't?" },
      { by: 'a', say: "{target} hasn't said one word to me since. And {target} always talks to me." }] },
  ],
};
