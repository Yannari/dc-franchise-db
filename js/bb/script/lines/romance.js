// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/romance.js — the shared romance layer, in a house (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for the romance beats week.js builds from the shared pipeline
// (romance.js stages run on the house). Kind = 'romance.' + the pipeline's
// event type; the cast follows the event's players.
//
//   firstMove, showmanceSpark, showmanceRekindle, showmanceBreakup,
//   showmanceRideOrDie, showmanceHoneymoon        a and b                        scene
//   showmanceNoticed, showmanceTarget             a watches the couple b and c   scene; Target intent hit ({target})
//   showmanceJealousy                             a, jealous of b with c         scene
//   friendshipJealousy                            a, losing friend b to c        scene
//   triangleTension     a in the middle of b and c (dual) / c circling a and b (onesided)
//   triangleEscalation  three: a and c fight over b / schemed: a works {first}, {centre}, {second}
//   trianglePublicFight a and c fight over b        triangleConfrontation  a asks b, the centre; c is the other
//   triangleUltimatum   a chooses b over c          triangleResolved  faded | villain | cool | hurt (c is left)
//   triangleCut         centre (c gone, a and b left) | hand (a voted c out) | house
//   triangleLonely      a lost both                 affairSecret  a cheats with b
//   affairRumor         a suspects b                affairCaught  a walks in on b and c
//   affairExposed       a tells b about {target}    affairSilent  a knows about b
//   affairChoice        a chooses b; c is left
//   showmanceSabotage   a flirts with b, c's partner, so that c hears about it

export default {
  'romance.firstMove.scene': [
    { id: 'wa.1', turns: [{ by: 'a', say: "Can I say something awkward?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "I like you. Properly." }, { by: 'b', say: "...Good. Me too." }] },
    { id: 'wa.2', turns: [{ by: 'a', say: "Stay behind a minute?" }, { beat: 'Everyone else leaves.' }, { by: 'a', say: "I've been wanting to say this for days." }, { by: 'b', say: "Then say it." }] },
    { id: 'wa.3', turns: [{ by: 'a', say: "Pretending there's nothing going on is harder than just saying it." }, { by: 'b', say: "So say it." }, { by: 'a', say: "There's something going on." }, { by: 'b', say: "I know." }] },
    { id: 'wa.4', turns: [{ by: 'a', say: "Do you feel it too? Or is it just me?" }, { by: 'b', say: "It's not just you." }, { beat: '{a} laughs with relief.' }] },
    { id: 'wa.5', turns: [{ by: 'a', dr: "I tried to be casual about it. I was not casual at all. But {b} met me halfway." }] },
    { id: 'wa.6', turns: [{ by: 'b', dr: "Half the house guessed before {a} said a word. I'm glad {a} finally did." }] },
  ],
  'romance.showmanceSpark.scene': [
    { id: 'wb.1', turns: [{ by: 'a', say: "So, are we doing this?" }, { by: 'b', say: "We're doing this." }, { beat: 'Someone outside hears them laughing.' }] },
    { id: 'wb.2', turns: [{ by: 'b', say: "What are you going to call this in the Diary Room?" }, { by: 'a', say: "Not flirting." }, { by: 'b', say: "No. Definitely not flirting." }] },
    { id: 'wb.3', turns: [{ by: 'a', dr: "{b} and I agreed it's real. We decided in private. Everyone knew by breakfast." }] },
    { id: 'wb.4', turns: [{ by: 'b', dr: "We tried to act normal at breakfast. We failed." }] },
    { id: 'wb.5', turns: [{ by: 'a', say: "Are we telling people?" }, { by: 'b', say: "I think they already know." }] },
    { id: 'wb.6', turns: [{ by: 'b', dr: "{a} and I are together now. People will see us as one vote. I know that. I don't care." }] },
  ],
  'romance.showmanceRekindle.scene': [
    { id: 'wc.1', turns: [{ by: 'a', say: "Can we talk? Just us?" }, { by: 'b', say: "Yeah. I'd like that." }] },
    { id: 'wc.2', turns: [{ by: 'b', say: "You left this." }, { by: 'a', say: "Thanks." }, { by: 'b', say: "...And I'm sorry." }] },
    { id: 'wc.3', turns: [{ by: 'a', say: "This still hurts." }, { by: 'b', say: "I know. I'm not going to argue." }, { by: 'a', say: "That helps." }] },
    { id: 'wc.4', turns: [{ by: 'a', say: "Making up doesn't erase what happened." }, { by: 'b', say: "I know. But I'm not done trying." }] },
    { id: 'wc.5', turns: [{ by: 'b', dr: "{a} and I aren't fixed. But we're talking again." }] },
    { id: 'wc.6', turns: [{ by: 'a', dr: "I missed {b}. I'm not proud of how fast I forgave {b}. But I did." }] },
  ],
  'romance.showmanceBreakup.scene': [
    { id: 'wd.1', turns: [{ by: 'a', say: "We're not describing the same relationship." }, { by: 'b', say: "No. We're not." }, { beat: '{b} moves {b.posAdj} things before bed.' }] },
    { id: 'wd.2', turns: [{ by: 'a', say: "Every conversation with you feels like strategy now." }, { by: 'b', say: "...Yeah." }, { by: 'a', say: "So let's stop pretending." }] },
    { id: 'wd.3', turns: [{ by: 'a', say: "I need some space." }, { by: 'b', say: "In this house?" }, { beat: 'Neither of them laughs.' }] },
    { id: 'wd.4', turns: [{ beat: '{a} and {b} come to dinner separately and sit apart.' }, { by: 'a', dr: "That's it. We're done." }] },
    { id: 'wd.5', turns: [{ by: 'b', say: "Are we a couple, or just two votes protecting each other?" }, { beat: '{a} does not answer fast enough.' }] },
    { id: 'wd.6', turns: [{ by: 'b', dr: "It's over between me and {a}. I'm sad. I'm also a bit relieved." }] },
  ],
  'romance.showmanceRideOrDie.scene': [
    { id: 'we.1', turns: [{ by: 'a', say: "Neither of us cuts the other. Ever." }, { by: 'b', say: "Ever." }] },
    { id: 'we.2', turns: [{ by: 'b', say: "Would you pick us over an easier path to the end?" }, { by: 'a', say: "Yes." }, { by: 'b', say: "Even with people listening?" }, { by: 'a', say: "Yes." }] },
    { id: 'we.3', turns: [{ by: 'a', say: "If one of us gets there, we both got there." }, { by: 'b', dr: "That's romantic. It's also dangerous." }] },
    { id: 'we.4', turns: [{ by: 'a', dr: "{b} and I don't have separate plans any more. Every plan has two seats in it." }] },
    { id: 'we.5', turns: [{ by: 'b', dr: "{a} promised me the end. I believe {a}. Everyone else can see it too, and that's the problem." }] },
    { id: 'we.6', turns: [{ by: 'a', say: "Whatever happens, it's us." }, { by: 'b', say: "It's us." }] },
  ],
  'romance.showmanceHoneymoon.scene': [
    { id: 'wf.1', turns: [{ beat: '{a} and {b} whisper across their beds until someone throws a pillow.' }, { by: 'a', say: "Sorry!" }, { by: 'b', say: "We're not sorry." }] },
    { id: 'wf.2', turns: [{ by: 'a', say: "Breakfast. Exactly how you like it." }, { by: 'b', say: "You remembered." }, { beat: 'Three people at the table exchange a look.' }] },
    { id: 'wf.3', turns: [{ by: 'b', dr: "{a} and I can't stop smiling. It's embarrassing. I don't care." }] },
    { id: 'wf.4', turns: [{ by: 'a', say: "Want to sit in the hammock?" }, { by: 'b', say: "Always." }] },
    { id: 'wf.5', turns: [{ by: 'a', dr: "We keep finding reasons to sit next to each other. Nobody's fooled." }] },
    { id: 'wf.6', turns: [{ by: 'b', say: "Everyone's staring at us." }, { by: 'a', say: "Let them." }] },
  ],
  'romance.showmanceNoticed.scene': [
    { id: 'wg.1', turns: [{ by: 'a', dr: "{b} checks {c}'s face before agreeing to anything. They're one vote." }] },
    { id: 'wg.2', turns: [{ by: 'a', say: "Count {b} and {c} as one." }, { beat: 'Nobody argues.' }] },
    { id: 'wg.3', turns: [{ by: 'a', dr: "There's no point pitching {b} without {c}. You get both or neither." }] },
    { id: 'wg.4', turns: [{ by: 'a', dr: "The second {c} leaves a room, {b} leaves too. They're a pair now." }] },
    { id: 'wg.5', turns: [{ by: 'a', say: "Which one of them is easier to get out?" }, { beat: 'Nobody answers straight away.' }] },
    { id: 'wg.6', turns: [{ by: 'a', dr: "I've stopped saying '{b} and {c}'. I just say 'the couple'." }] },
  ],
  'romance.showmanceTarget.scene': [
    { id: 'wh.1', turns: [{ by: 'a', say: "If {b} and {c} stay together, that's two votes every week." }, { beat: 'The next question is which of them goes first.' }] },
    { id: 'wh.2', turns: [{ by: 'a', dr: "I'm not attacking their relationship. I'm counting their votes." }] },
    { id: 'wh.3', turns: [{ by: 'a', say: "Who gains if {b} and {c} both stay?" }, { beat: 'Nobody has a good answer.' }] },
    { id: 'wh.4', turns: [{ by: 'a', dr: "Break up {b} and {c} before either of them wins power. That's the plan." }] },
    { id: 'wh.5', turns: [{ by: 'a', say: "The couple needs to lose one. Which one?" }] },
    { id: 'wh.6', turns: [{ by: 'a', dr: "By dinner, my idea about {b} and {c} had travelled further than I expected." }] },
    { id: 'wh.7', when: { intent: 'hit' }, turns: [{ by: 'a', dr: "{b} and {c} have to be split up. And it starts with {target}." }] },
    { id: 'wh.8', when: { intent: 'hit' }, turns: [{ by: 'a', say: "If we're splitting them up, it's {target} first." }] },
  ],
  'romance.showmanceJealousy.scene': [
    { id: 'wi.1', turns: [{ by: 'a', say: "Can we talk?" }, { by: 'b', say: "In a bit. I'm waiting for {c}." }, { by: 'a', say: "It's fine." }, { beat: '{a} eats dinner in another room.' }] },
    { id: 'wi.2', turns: [{ by: 'a', say: "You two are impossible to separate these days." }, { beat: 'Nobody laughs. {a} is not smiling.' }] },
    { id: 'wi.3', turns: [{ beat: '{a} sees {b} and {c} curled up together and turns around.' }, { by: 'a', dr: "I'm keeping my distance." }] },
    { id: 'wi.4', turns: [{ by: 'b', say: "Can we talk tomorrow instead?" }, { by: 'a', say: "Sure." }, { by: 'a', dr: "That's the third time." }] },
    { id: 'wi.5', turns: [{ by: 'a', dr: "I'm not jealous of {c}. I just miss {b}. Maybe that's the same thing." }] },
    { id: 'wi.6', turns: [{ by: 'a', dr: "{b} has picked {c}. Not just as a partner. Over everyone." }] },
  ],
  'romance.friendshipJealousy.scene': [
    { id: 'wj.1', turns: [{ beat: '{a} brings two mugs over and finds {b} already sitting with {c}.' }, { by: 'a', dr: "I left one mug on the table and took the other outside." }] },
    { id: 'wj.2', turns: [{ by: 'a', say: "Can we finish yesterday's conversation?" }, { beat: '{b} looks at {c} first.' }, { by: 'a', say: "Never mind." }] },
    { id: 'wj.3', turns: [{ by: 'a', dr: "Every story {b} and {c} tell needs context only they understand. I gave up trying to join in." }] },
    { id: 'wj.4', turns: [{ by: 'b', say: "We'll talk later, I promise." }, { beat: '{b} goes upstairs with {c}.' }, { by: 'a', dr: "Later isn't coming." }] },
    { id: 'wj.5', turns: [{ by: 'a', dr: "I didn't lose {b} in a vote. I lost {b} to {c}." }] },
    { id: 'wj.6', turns: [{ by: 'a', say: "Do you still have time for me?" }, { by: 'b', say: "Of course!" }, { by: 'a', dr: "{b} said that from across the room, holding {c}'s hand." }] },
  ],
  'romance.triangleTension.dual': [
    { id: 'wk.d1', turns: [{ by: 'a', dr: "I talked to {b} all night and {c} all morning. I'm sure it's fine." }] },
    { id: 'wk.d2', turns: [{ by: 'b', dr: "Everyone knows {a} is in two things at once. Everyone except {a}, apparently." }] },
    { id: 'wk.d3', turns: [{ beat: '{b} and {c} sit on either side of {a} at dinner.' }, { by: 'c', dr: "Loudest dinner of the season, and nobody said a word." }] },
    { id: 'wk.d4', turns: [{ by: 'c', dr: "{a} said the same sweet thing to me and to {b}. Same day. Same words." }] },
    { id: 'wk.d5', turns: [{ by: 'b', say: "Where were you this morning?" }, { by: 'a', say: "With {c}. Why?" }, { by: 'b', say: "No reason." }] },
    { id: 'wk.d6', turns: [{ by: 'a', dr: "I like {b}. I like {c}. I know that's a problem." }] },
  ],
  'romance.triangleTension.onesided': [
    { id: 'wk.o1', turns: [{ by: 'b', dr: "{c} keeps turning up wherever {a} is. I've noticed every single time." }] },
    { id: 'wk.o2', turns: [{ by: 'b', dr: "{c} laughs a bit too long at {a}'s jokes. Nothing's happened. I'm still counting." }] },
    { id: 'wk.o3', turns: [{ beat: '{b} finds {a} and {c} talking quietly in a doorway.' }, { by: 'b', dr: "I turned around before they saw me." }] },
    { id: 'wk.o4', turns: [{ by: 'b', dr: "{a} told {c} something I thought was just ours. I heard it from someone else." }] },
    { id: 'wk.o5', turns: [{ by: 'c', say: "You two seem close." }, { by: 'a', say: "We are." }, { by: 'c', dr: "Close for now. In this house that never lasts, and I'll be right there when it breaks." }] },
    { id: 'wk.o6', turns: [{ by: 'b', say: "Is something going on with {c}?" }, { by: 'a', say: "No! We're friends." }, { by: 'b', dr: "That's what worries me." }] },
  ],
  'romance.triangleEscalation.three': [
    { id: 'wl.t1', turns: [{ by: 'b', dr: "{a} and {c} sat either side of me for an hour without a word. I was the furniture." }] },
    { id: 'wl.t2', turns: [{ by: 'a', say: "{c} is playing a character in here." }, { beat: 'Nobody thinks {a} is talking about the game.' }] },
    { id: 'wl.t3', turns: [{ beat: '{b} tries to talk to {a} and {c} together.' }, { by: 'b', dr: "Three minutes. Then I left." }] },
    { id: 'wl.t4', turns: [{ by: 'a', say: "Some people can't make up their minds." }, { beat: '{b} puts down a fork. {c} does not look up.' }] },
    { id: 'wl.t5', turns: [{ by: 'a', say: "Sit with {c}. That's what you want anyway." }, { beat: 'Everyone suddenly finds something else to look at.' }] },
    { id: 'wl.t6', turns: [{ by: 'b', say: "Can we talk?" }, { by: 'a', say: "About what? You've been pretty clear." }] },
  ],
  'romance.triangleEscalation.schemed': [
    { id: 'wl.s1', turns: [{ by: 'a', dr: "None of those three are counting votes. {first}, {centre}, {second}. They're playing a different game from us." }] },
    { id: 'wl.s2', turns: [{ by: 'a', dr: "{first} is going to get hurt. Hurt people take the first hand offered. I'll be the one offering it." }] },
    { id: 'wl.s3', turns: [{ by: 'a', dr: "I've given {first} a small doubt and {second} a different one. Neither is big enough to trace." }] },
    { id: 'wl.s4', turns: [{ by: 'a', dr: "{centre} picks one of them. The other one comes to me that same night, angry and free." }] },
    { id: 'wl.s5', turns: [{ by: 'a', dr: "That triangle is going to blow up. I don't have to do anything. I just need to be standing in the right place." }] },
    { id: 'wl.s6', turns: [{ by: 'a', dr: "Let {first} and {second} fight over {centre}. I'll take whoever loses." }] },
  ],
  'romance.trianglePublicFight.scene': [
    { id: 'wm.1', turns: [{ by: 'a', say: "You're moving in on {b}!" }, { by: 'c', say: "And?" }, { beat: '{b} walks out and does not come back.' }] },
    { id: 'wm.2', turns: [{ by: 'a', say: "Snake." }, { by: 'c', say: "Delusional." }, { by: 'b', say: "Can you both just..." }, { beat: 'Both of them shout {b} down.' }] },
    { id: 'wm.3', turns: [{ by: 'a', say: "You don't deserve {b}." }, { beat: '{c} laughs. The next thirty seconds are worse.' }] },
    { id: 'wm.4', turns: [{ by: 'b', dr: "{a} and {c} had it out in front of everyone. And I'm the reason. This is my fault." }] },
    { id: 'wm.5', turns: [{ beat: 'The argument moves from room to room for twenty minutes.' }, { by: 'c', dr: "Nothing got settled. Except which side everyone is on." }] },
    { id: 'wm.6', turns: [{ by: 'c', say: "Say it to my face." }, { by: 'a', say: "I just did." }] },
  ],
  'romance.triangleConfrontation.scene': [
    { id: 'wn.1', turns: [{ by: 'a', say: "Where do I stand?" }, { by: 'b', say: "You know where you stand." }, { by: 'a', dr: "I don't believe a word." }] },
    { id: 'wn.2', turns: [{ by: 'a', say: "I'd rather be told than work it out myself." }, { by: 'b', say: "There's nothing to tell." }, { by: 'a', say: "Then tell me that properly." }] },
    { id: 'wn.3', turns: [{ by: 'a', say: "I'm not asking you to choose. I'm asking you to say what this is." }, { beat: '{b} takes too long to answer.' }] },
    { id: 'wn.4', turns: [{ by: 'a', say: "I deserve honesty." }, { by: 'b', say: "Everything's fine." }, { by: 'a', dr: "'Fine' is doing a lot of work there." }] },
    { id: 'wn.5', turns: [{ by: 'a', dr: "I waited until {c} was in the Diary Room. Then I asked {b} straight out." }] },
    { id: 'wn.6', turns: [{ by: 'b', dr: "{a} asked me where {a} stands. I didn't have an answer that wouldn't hurt someone." }] },
  ],
  'romance.triangleUltimatum.scene': [
    { id: 'wo.1', turns: [{ by: 'a', say: "I can't keep doing this to both of you." }, { beat: '{b} and {c} look at each other.' }] },
    { id: 'wo.2', turns: [{ by: 'a', say: "It's you. It's been you for a while." }, { by: 'b', say: "Really?" }, { by: 'a', say: "Really." }, { beat: '{a} goes to find {c}. That conversation takes much longer.' }] },
    { id: 'wo.3', turns: [{ by: 'a', say: "I've made up my mind." }, { beat: '{a} says it to both of them at once.' }, { by: 'c', dr: "Brave or cruel. I haven't decided which." }] },
    { id: 'wo.4', turns: [{ by: 'b', dr: "{a} chose me. I feel happy and terrible at the same time." }] },
    { id: 'wo.5', turns: [{ by: 'c', dr: "{a} chose {b}. I went outside and stayed there most of the night." }] },
    { id: 'wo.6', turns: [{ by: 'a', dr: "It wasn't clean. It wasn't painless. But it's done." }] },
  ],
  'romance.triangleResolved.faded': [
    { id: 'wp.f1', turns: [{ by: 'c', dr: "It ended without anybody saying it had ended. {a} just stopped looking for me." }] },
    { id: 'wp.f2', turns: [{ by: 'c', dr: "Nobody said anything. I worked it out from where {a} sits now." }] },
    { id: 'wp.f3', turns: [{ by: 'a', dr: "{c} and I barely speak now. It just stopped. {b} didn't have to do anything." }] },
    { id: 'wp.f4', turns: [{ by: 'b', dr: "No fight, no ultimatum. {a} drifted back to me. I'll take it." }] },
    { id: 'wp.f5', turns: [{ by: 'c', say: "We're fine, right?" }, { by: 'a', say: "Yeah. Fine." }, { by: 'c', dr: "We're nothing. That's what 'fine' means." }] },
    { id: 'wp.f6', turns: [{ by: 'a', dr: "I didn't make a choice. It made itself." }] },
  ],
  'romance.triangleResolved.villain': [
    { id: 'wp.v1', turns: [{ by: 'c', say: "That's fine. Just remember you made that choice in a house where everybody votes." }] },
    { id: 'wp.v2', turns: [{ by: 'c', say: "Upset? You've just given me my week back." }, { by: 'a', dr: "That was not the reaction I expected." }] },
    { id: 'wp.v3', turns: [{ by: 'c', say: "Interesting." }, { by: 'c', dr: "{a} has no idea what {a} has started." }] },
    { id: 'wp.v4', turns: [{ by: 'c', dr: "{a} picked {b}. Fine. {a} just lost the one person who was never coming after {a}." }] },
    { id: 'wp.v5', turns: [{ by: 'c', say: "Good luck to you both." }, { by: 'a', dr: "{c} didn't mean that." }] },
    { id: 'wp.v6', turns: [{ by: 'c', dr: "I'm not heartbroken. I'm free. That's much worse for {a}." }] },
  ],
  'romance.triangleResolved.cool': [
    { id: 'wp.c1', turns: [{ by: 'c', say: "I understand." }, { by: 'c', dr: "And I'm counting everything again from the top." }] },
    { id: 'wp.c2', turns: [{ by: 'c', say: "Game respects game." }, { beat: '{c} goes off to have a very different conversation with someone else.' }] },
    { id: 'wp.c3', turns: [{ beat: '{c} shakes {a}\'s hand.' }, { by: 'a', dr: "That was the most strategic handshake I've ever had." }] },
    { id: 'wp.c4', turns: [{ by: 'c', dr: "{a} chose {b}. Okay. Now I'm free to play." }] },
    { id: 'wp.c5', turns: [{ by: 'c', say: "No hard feelings." }, { by: 'a', say: "Really?" }, { by: 'c', say: "Really." }, { by: 'c', dr: "I said no hard feelings. Honestly, I'm hurt. I'm just not going to let anybody in this house see it." }] },
    { id: 'wp.c6', turns: [{ by: 'c', dr: "Feelings later. Votes now." }] },
  ],
  'romance.triangleResolved.hurt': [
    { id: 'wp.h1', turns: [{ by: 'c', say: "Okay. Okay." }, { beat: '{c} cannot manage a third word.' }] },
    { id: 'wp.h2', turns: [{ by: 'c', dr: "I held it together through the whole conversation. Then I cried in the shower." }] },
    { id: 'wp.h3', turns: [{ by: 'c', say: "Was any of it real?" }, { beat: '{a} takes too long. {c} stops needing an answer.' }] },
    { id: 'wp.h4', turns: [{ by: 'b', dr: "I tried to give {c} some space. There's nowhere in this house to give anyone space." }] },
    { id: 'wp.h5', turns: [{ by: 'c', dr: "{a} chose {b}. I knew it was coming. It still hurt." }] },
    { id: 'wp.h6', turns: [{ by: 'a', dr: "Hurting {c} was the worst part of this game so far." }] },
  ],
  'romance.triangleCut.centre': [
    { id: 'wq.c1', turns: [{ by: 'a', dr: "{b} and I fought over {c} for weeks. Now {c} is gone, and there's nothing left to fight about." }] },
    { id: 'wq.c2', turns: [{ by: 'b', dr: "The vote sorted it out. {c} left. {a} and I are still here, stuck with a rivalry." }] },
    { id: 'wq.c3', turns: [{ by: 'a', say: "So." }, { by: 'b', say: "So." }, { by: 'a', say: "Truce?" }, { by: 'b', say: "Truce." }] },
    { id: 'wq.c4', turns: [{ by: 'b', dr: "An hour after {c} left, {a} and I were in the same kitchen. Neither of us could remember why we were angry." }] },
    { id: 'wq.c5', turns: [{ by: 'a', dr: "I thought I'd feel like I won. I don't." }] },
    { id: 'wq.c6', turns: [{ by: 'b', say: "We don't have to be friends." }, { by: 'a', say: "No. But we don't have to be enemies either." }] },
  ],
  'romance.triangleCut.hand': [
    { id: 'wq.h1', turns: [{ by: 'b', dr: "{a} voted {c} out. I don't know if that was a choice about us or a warning to everyone." }] },
    { id: 'wq.h2', turns: [{ by: 'a', dr: "I had two people in this house and one vote. I used it." }] },
    { id: 'wq.h3', turns: [{ by: 'b', say: "Did you vote {c} out?" }, { by: 'a', say: "Does it matter?" }, { by: 'b', say: "It does to me." }] },
    { id: 'wq.h4', turns: [{ by: 'a', dr: "Nobody forced me to decide. I decided in the Diary Room." }] },
    { id: 'wq.h5', turns: [{ by: 'b', dr: "{a} chose me with a vote. I'm not sure how to feel about that." }] },
    { id: 'wq.h6', turns: [{ by: 'a', dr: "{c} left knowing I wrote the name. I'll live with that." }] },
  ],
  'romance.triangleCut.house': [
    { id: 'wq.o1', turns: [{ by: 'a', dr: "The rest of the house settled it for me in about four seconds." }] },
    { id: 'wq.o2', turns: [{ by: 'b', dr: "None of us chose. The house did. {c} is gone, and {a} and I are together by default." }] },
    { id: 'wq.o3', turns: [{ by: 'a', dr: "I never got to decide. {c} left, and that was that." }] },
    { id: 'wq.o4', turns: [{ by: 'a', say: "I'm sorry about {c}." }, { by: 'b', say: "Are you?" }, { by: 'a', say: "...I don't know." }] },
    { id: 'wq.o5', turns: [{ by: 'b', dr: "We're a couple now because of a vote neither of us controlled. Not how I pictured it." }] },
    { id: 'wq.o6', turns: [{ by: 'a', dr: "I was stuck in the middle for weeks. Then the house just took the decision away." }] },
  ],
  'romance.triangleLonely.scene': [
    { id: 'wr.1', turns: [{ by: 'a', dr: "Two beds empty in one week. Both of them people I cared about." }] },
    { id: 'wr.2', turns: [{ by: 'a', dr: "The house is loud tonight. I'm not part of any of it." }] },
    { id: 'wr.3', turns: [{ beat: '{a} makes tea at two in the morning and does not drink it.' }, { by: 'a', dr: "There's nobody left to argue with." }] },
    { id: 'wr.4', turns: [{ by: 'a', dr: "I was in something with both of them. Now I'm in nothing." }] },
    { id: 'wr.5', turns: [{ by: 'a', dr: "I didn't get to choose. I got to lose both." }] },
    { id: 'wr.6', turns: [{ by: 'a', dr: "Everyone says it's better this way. It doesn't feel better." }] },
  ],
  'romance.affairSecret.scene': [
    { id: 'ws.1', turns: [{ by: 'a', dr: "{b} and I are awake at three in the morning. Again. Somebody's going to notice." }] },
    { id: 'ws.2', turns: [{ beat: '{a} and {b} take the long way round and end up in the same place.' }, { by: 'b', dr: "There are cameras everywhere. I know." }] },
    { id: 'ws.3', turns: [{ by: 'b', say: "I made you a plate." }, { by: 'a', say: "Thanks." }, { by: 'a', dr: "Someone else used to do that for me." }] },
    { id: 'ws.4', turns: [{ beat: '{a} laughs at something {b} says too quietly for anyone else to hear.' }, { by: 'a', dr: "Nothing in here is ever that quiet." }] },
    { id: 'ws.5', turns: [{ by: 'a', dr: "We came out four minutes apart. That's worse than coming out together." }] },
    { id: 'ws.6', turns: [{ by: 'b', dr: "{a} isn't single. I know that. I keep ending up next to {a} anyway." }] },
  ],
  'romance.affairRumor.scene': [
    { id: 'wt.1', turns: [{ by: 'a', dr: "I don't have proof about {b}. I've got a list of small things that keeps getting longer." }] },
    { id: 'wt.2', turns: [{ by: 'a', say: "Has anyone else noticed {b} lately?" }, { beat: 'Two people look up far too quickly.' }] },
    { id: 'wt.3', turns: [{ by: 'a', dr: "I can't sleep in here. That means I know exactly what time {b} came to bed." }] },
    { id: 'wt.4', turns: [{ by: 'a', dr: "Nothing I could call evidence. Just a lot of small things in the right order." }] },
    { id: 'wt.5', turns: [{ by: 'a', say: "Where were you last night, {b}?" }, { by: 'b', say: "Asleep. Why?" }, { by: 'a', say: "No reason." }] },
    { id: 'wt.6', turns: [{ by: 'a', dr: "Something's going on with {b}. I'm going to find out what." }] },
  ],
  'romance.affairCaught.scene': [
    { id: 'wu.1', turns: [{ beat: '{a} walks in and finds {b} and {c} standing much too close.' }, { by: 'a', say: "Oh." }, { beat: 'Nobody speaks for four seconds.' }] },
    { id: 'wu.2', turns: [{ by: 'a', say: "How long?" }, { beat: '{b} starts a sentence three times. {c} does not start one at all.' }] },
    { id: 'wu.3', turns: [{ by: 'a', dr: "I wasn't looking for them. I found them anyway." }] },
    { id: 'wu.4', turns: [{ beat: '{b} and {c} spring apart when {a} walks in.' }, { by: 'a', dr: "That told me everything." }] },
    { id: 'wu.5', turns: [{ by: 'a', say: "I didn't see anything." }, { by: 'b', say: "There's nothing to see." }, { by: 'a', say: "Then why are you both so red?" }] },
    { id: 'wu.6', turns: [{ by: 'c', dr: "{a} walked in on {b} and me. It's only a matter of time now." }] },
  ],
  'romance.affairExposed.scene': [
    { id: 'wv.1', turns: [{ by: 'a', say: "You need to hear this about {target}. And you need to hear it from someone who cares." }] },
    { id: 'wv.2', turns: [{ by: 'a', say: "I'm not going to be one more person who knows and lets you find out last." }, { by: 'b', say: "Find out what?" }] },
    { id: 'wv.3', turns: [{ by: 'a', say: "Can you come outside for a minute?" }, { beat: 'It takes eleven minutes. {b} does not sit down again for an hour.' }] },
    { id: 'wv.4', turns: [{ by: 'a', say: "It's about {target}." }, { beat: '{b}\'s face does the rest.' }] },
    { id: 'wv.5', turns: [{ by: 'b', dr: "{a} told me about {target}. I didn't want to believe it. I believe it." }] },
    { id: 'wv.6', turns: [{ by: 'a', dr: "Telling {b} about {target} was the hardest conversation I've had in here." }] },
  ],
  'romance.affairSilent.scene': [
    { id: 'ww.1', turns: [{ by: 'a', dr: "I know about {b}. {b} knows I know. Neither of us has said a word." }] },
    { id: 'ww.2', turns: [{ by: 'b', say: "Coffee?" }, { by: 'a', say: "Thanks." }, { by: 'a', dr: "{b} has made me coffee every morning since I found out." }] },
    { id: 'ww.3', turns: [{ by: 'a', dr: "I'm sitting on the biggest secret in this house. I'm in no hurry to use it." }] },
    { id: 'ww.4', turns: [{ by: 'b', dr: "{a} has never said 'you owe me'. {a} doesn't need to." }] },
    { id: 'ww.5', turns: [{ by: 'a', dr: "I'm keeping it. Not to be kind. It's worth more if I don't spend it yet." }] },
    { id: 'ww.6', turns: [{ by: 'b', say: "Are we okay?" }, { by: 'a', say: "We're fine." }, { by: 'b', dr: "{a} is holding all the cards." }] },
  ],
  'romance.showmanceSabotage.scene': [
    { id: 'wy.1', turns: [{ beat: '{a} gets {b} alone and stands much too close.' }, { by: 'a', dr: "I don't need {b} to like me. I need {c} to hear about it." }] },
    { id: 'wy.2', turns: [{ by: 'a', say: "You look tired. Come and sit with me." }, { by: 'b', say: "...Okay." }, { by: 'c', dr: "Someone told me {b} was very cosy with {a} today. I want to know why." }] },
    { id: 'wy.3', turns: [{ by: 'c', say: "Were you with {a} earlier?" }, { by: 'b', say: "We were just talking!" }, { by: 'c', say: "That's not what I heard." }] },
    { id: 'wy.4', turns: [{ by: 'a', dr: "A hand on the arm, a laugh that goes on too long. In this house, that's enough. Word does the rest." }] },
    { id: 'wy.5', turns: [{ by: 'b', dr: "{a} was all over me today, and someone made sure {c} heard about it. I didn't do anything." }] },
    { id: 'wy.6', turns: [{ by: 'c', dr: "Everyone saw {a} and {b}. Everyone except me. I'm the last to know, as usual." }] },
  ],
  'romance.affairChoice.scene': [
    { id: 'wx.1', turns: [{ by: 'a', say: "It meant nothing." }, { by: 'b', say: "I don't believe you." }, { beat: '{b} stays anyway.' }] },
    { id: 'wx.2', turns: [{ by: 'a', say: "It's {b}." }, { beat: '{c} hears it from the next room and does not come in.' }] },
    { id: 'wx.3', turns: [{ by: 'c', say: "Okay." }, { beat: '{c} goes to bed at nine.' }, { by: 'b', dr: "Nobody knows what that 'okay' meant." }] },
    { id: 'wx.4', turns: [{ by: 'b', say: "One chance. One." }, { by: 'a', say: "Deal." }, { by: 'c', dr: "They arranged it right in front of me." }] },
    { id: 'wx.5', turns: [{ by: 'a', dr: "I chose {b}. I hurt {c}. Both of those are true." }] },
    { id: 'wx.6', turns: [{ by: 'c', dr: "{a} picked {b}. I should have seen it coming." }] },
  ],
};
