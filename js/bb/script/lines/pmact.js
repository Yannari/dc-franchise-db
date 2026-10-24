// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/pmact.js — premiere night, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// The host and the relic are gone; two groups hunt the house on night one
// (written by bb/script/ceremony.js). These people have known each other for
// a few hours: nobody has history, and nobody talks as if they do. {room} is
// a place in the house ("the storeroom"), always mid-sentence.
//
// Deep on purpose (user, 2026-10-24, reading a premiere: the same exchange
// played in both groups and "kept searching right next to me" twice in a
// row): a hunt of eight voices every kind of moment several times a night.
// The host is "the host", never "her": the franchise's host is not always a
// woman.
//
//   pmact.warm       a, searching, feels close in {room}            scene
//   pmact.together   a and b meet in {room} and actually talk       scene
//   pmact.collide    a and b search {room} around each other        scene
//   pmact.withheld   a keeps a lead from b                          scene
//   pmact.found      a finds it                                     relic | host
//   pmact.night      a has the relic; b has the host and the money  scene
//   pmact.secret     a learns the money is a power (DR)             scene

export default {
  'pmact.warm.scene': [
    { id: 'pm7.w1', turns: [{ by: 'a', dr: "There's something in {room}. I just can't find it yet." }] },
    { id: 'pm7.w2', turns: [{ by: 'a', say: "Has anyone checked {room} properly?" }] },
    { id: 'pm7.w3', turns: [{ by: 'a', dr: "I keep ending up in {room}. That has to mean something." }] },
    { id: 'pm7.w4', turns: [{ by: 'a', say: "Hang on. Something's off in here." }] },
    { id: 'pm7.w5', turns: [{ by: 'a', dr: "I'm not saying anything yet, but I'm going back to {room}." }] },
    { id: 'pm7.w6', turns: [{ by: 'a', say: "Is it me, or is {room} weirdly tidy?" }] },
    { id: 'pm7.w7', turns: [{ by: 'a', say: "Why is there a draught in here? There's no window." }] },
    { id: 'pm7.w8', turns: [{ by: 'a', dr: "This hotel was built to hide things. {room} is hiding something. I can feel it." }] },
    { id: 'pm7.w9', turns: [{ by: 'a', say: "Okay, that panel moved. Did everyone see that panel move?" }] },
    { id: 'pm7.w10', turns: [{ by: 'a', dr: "I've been in {room} three times. Third time's the charm, right?" }] },
  ],
  'pmact.together.scene': [
    { id: 'pm7.t1', turns: [{ by: 'a', say: "Find anything?" }, { by: 'b', say: "Nothing. Where are you from, anyway?" }] },
    { id: 'pm7.t2', turns: [{ by: 'a', say: "I think we're the only two not panicking." }, { by: 'b', say: "Give it an hour." }] },
    { id: 'pm7.t3', turns: [{ by: 'b', dr: "{a} and I stopped searching and just talked. First real conversation I've had in here." }] },
    { id: 'pm7.t4', turns: [{ by: 'a', say: "Is it weird that I'm having fun?" }, { by: 'b', say: "Very. Me too, though." }] },
    { id: 'pm7.t5', turns: [{ by: 'b', say: "You're good at this." }, { by: 'a', say: "I'm good at looking like I'm good at this." }, { by: 'b', say: "Same thing, on night one." }] },
    { id: 'pm7.t6', turns: [{ by: 'a', say: "If one of us finds it, we tell the other first. Deal?" }, { by: 'b', say: "Deal. That's my first deal in here." }] },
    { id: 'pm7.t7', turns: [{ by: 'a', dr: "{b} made me laugh in {room} with the lights off. I didn't expect to like anyone this fast." }] },
    { id: 'pm7.t8', turns: [{ by: 'b', say: "So what do you actually do, outside of this?" }, { by: 'a', say: "Right now? I search hotels in the dark, apparently." }] },
  ],
  'pmact.collide.scene': [
    { id: 'pm7.c1', turns: [{ by: 'a', say: "Oh. You're in here too." }, { by: 'b', say: "Looks like it." }, { beat: 'Neither of them leaves.' }] },
    { id: 'pm7.c2', turns: [{ by: 'b', dr: "{a} kept searching right next to me and didn't say a word. Noted." }] },
    { id: 'pm7.c3', turns: [{ by: 'a', say: "I was checking this side." }, { by: 'b', say: "And I'm checking it now." }] },
    { id: 'pm7.c4', turns: [{ beat: '{a} and {b} reach for the same drawer at the same moment.' }, { by: 'b', say: "I had it first." }, { by: 'a', say: "You really didn't." }] },
    { id: 'pm7.c5', turns: [{ by: 'a', dr: "{b} followed me into {room}. Either we had the same idea, or {b} had mine." }] },
    { id: 'pm7.c6', turns: [{ by: 'b', say: "Do you mind?" }, { by: 'a', say: "Not at all. Do you?" }, { beat: 'They search the same shelf in total silence.' }] },
    { id: 'pm7.c7', turns: [{ by: 'a', dr: "Six hours in this house, and {b} is already the person I'm keeping an eye on." }] },
  ],
  'pmact.withheld.scene': [
    { id: 'pm7.k1', turns: [{ by: 'b', say: "Have you checked {room}?" }, { by: 'a', say: "Not really." }, { by: 'a', dr: "I've checked it twice." }] },
    { id: 'pm7.k2', turns: [{ by: 'a', dr: "I think I know where it is. I'm not telling anyone. Not on night one." }] },
    { id: 'pm7.k3', turns: [{ by: 'b', say: "Anything in there?" }, { by: 'a', say: "Dust. Lots of dust." }, { by: 'a', dr: "There was not just dust." }] },
    { id: 'pm7.k4', turns: [{ by: 'a', dr: "{b} asked me straight out where I'd been. I said the kitchen. I had not been in the kitchen." }] },
    { id: 'pm7.k5', turns: [{ by: 'a', say: "I'd try upstairs, honestly." }, { beat: '{a} goes straight back to {room} the moment {b} is out of sight.' }] },
    { id: 'pm7.k6', turns: [{ by: 'a', dr: "Sharing is lovely. Winning is lovelier." }] },
  ],
  'pmact.found.relic': [
    { id: 'pm7.r1', turns: [{ by: 'a', say: "I've got it! I've got the relic!" }] },
    { id: 'pm7.r2', turns: [{ by: 'a', dr: "Night one, and I'm picking who plays for HOH. No pressure." }] },
    { id: 'pm7.r3', turns: [{ by: 'a', say: "It was right here the whole time! Everyone, I've got it!" }] },
    { id: 'pm7.r4', turns: [{ by: 'a', dr: "I picked up the relic and every single person in that room looked at me differently. That took about one second." }] },
    { id: 'pm7.r5', turns: [{ by: 'a', say: "Found it! Okay. Okay. What do I do with it?" }] },
    { id: 'pm7.r6', turns: [{ by: 'a', dr: "I came in here wanting to fly under the radar. I am now holding the radar." }] },
  ],
  'pmact.found.host': [
    { id: 'pm7.h1', turns: [{ by: 'a', say: "I found the host! In here!" }] },
    { id: 'pm7.h2', turns: [{ by: 'a', say: "Everyone! Over here!" }] },
    { id: 'pm7.h3', turns: [{ by: 'a', say: "Hello? Hello! Are you okay? Everyone, come quick!" }] },
    { id: 'pm7.h4', turns: [{ by: 'a', dr: "I opened the door and the host was just sitting there. Calmly. Like this happens every week." }] },
    { id: 'pm7.h5', turns: [{ by: 'a', say: "Got the host! Somebody tell the others!" }] },
    { id: 'pm7.h6', turns: [{ by: 'a', dr: "I rescued the host on the first night of Big Brother. I'm going to be telling that story for the rest of my life." }] },
  ],
  'pmact.night.scene': [
    { id: 'pm7.n1', turns: [{ by: 'b', say: "Ten thousand dollars? On night one?" }, { by: 'a', dr: "Everyone's looking at the money. Nobody's looking at the relic. Good." }] },
    { id: 'pm7.n2', turns: [{ by: 'a', dr: "I get to pick who plays for HOH. That's going to make me some friends and some enemies." }] },
    { id: 'pm7.n3', turns: [{ by: 'b', say: "Ten grand. I'm not going to lie, I screamed." }, { by: 'a', say: "We heard." }] },
    { id: 'pm7.n4', turns: [{ by: 'a', dr: "{b} got ten thousand dollars and a round of applause. I got the relic and a queue of people being suddenly very nice to me." }] },
    { id: 'pm7.n5', turns: [{ by: 'b', dr: "Everyone's congratulating me, and every single one of them is doing the maths on that money." }] },
    { id: 'pm7.n6', turns: [{ by: 'a', say: "So who's buying dinner?" }, { by: 'b', say: "Not a chance." }] },
  ],
  'pmact.secret.scene': [
    { id: 'pm7.s1', turns: [{ by: 'a', dr: "It's not just money. It's a way off the block. Nobody else knows that." }] },
    { id: 'pm7.s2', turns: [{ by: 'a', dr: "Everyone thinks I won ten thousand dollars. I won a lot more than that." }] },
    { id: 'pm7.s3', turns: [{ by: 'a', dr: "If I'm ever sitting in that chair before the jury, I can hand the money over and walk off the block. And nobody out there has a clue." }] },
    { id: 'pm7.s4', turns: [{ by: 'a', dr: "Big Brother just told me what that money really is. I am going to be so normal about this. So normal." }] },
    { id: 'pm7.s5', turns: [{ by: 'a', dr: "Ten thousand dollars, or my way off the block. I didn't know I'd have to choose. I'm not choosing yet." }] },
    { id: 'pm7.s6', turns: [{ by: 'a', dr: "The money's a key. Once. Before the jury. That changes how I play the next month." }] },
  ],
};
