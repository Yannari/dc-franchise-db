// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-long5.js — the next round of sketches, written out
// ══════════════════════════════════════════════════════════════════════
// The kinds that still aired at five spoken lines or fewer most of the time (three played seasons,
// after n-long4.js). Same roles as their headers:
//   long.drama.food.any    a takes more than a fair share; b catches it (c, d: the camp)
//   arc.spark.<case>       a (who will run tonight's plan) notices b (the target); c is b's partner
//   long.conf.bigmove.any  a wants to make a move (alone: to the camera)
//   long.threat.notice.any a, a strategist, about b, the threat
//   long.conf.paranoia.any a is getting into their own head
//   long.adv.found.idol    a finds an idol, alone
// Ids: 'nl5.'.

export default {
  'long.drama.food.any': [
    { id: 'nl5.f1', turns: [
      { beat: "{b} lifts the lid on the rice pot and stares into it. It's nearly empty." },
      { by: 'b', say: "Okay. Who ate the rice?" },
      { by: 'a', say: "I had some." },
      { by: 'b', say: "You had some? There was enough for everybody until about ten minutes ago." },
      { by: 'a', say: "I was hungry. I did all the water runs this morning." },
      { by: 'b', say: "We were all hungry! That's what rations are!" },
      { by: 'c', say: "Can we not fight about rice, please?", opt: true },
      { by: 'b', say: "We can fight about rice when it's the only food we've got." },
      { by: 'a', say: "Fine. I'll go find more. Happy?" },
      { by: 'b', conf: "It's not about the rice. It's about {a} deciding {a.posAdj} stomach matters more than everybody else's. People remember that kind of thing at a vote." },
    ] },
    { id: 'nl5.f2', turns: [
      { beat: "{b} catches {a} by the food box after dark, cheeks suspiciously full." },
      { by: 'b', say: "Are you serious right now?" },
      { by: 'a', say: "Mm-hmm?" },
      { by: 'b', say: "Those were the emergency crackers." },
      { by: 'a', say: "This is an emergency. I'm starving." },
      { by: 'b', say: "We're all starving. That's why they're called emergency crackers and not {a}'s crackers." },
      { by: 'a', say: "Okay, you can't tell anybody." },
      { by: 'b', say: "I'm going to tell everybody." },
      { by: 'b', conf: "I caught {a} eating the emergency crackers in the dark. I'm not even angry. I'm just never letting {a} hold the food box again." },
    ] },
    { id: 'nl5.f3', when: { voice: ['loud', 'tough', 'blunt'] }, turns: [
      { by: 'b', say: "Hey! That's three fish. There are eight of us." },
      { by: 'a', say: "I caught them." },
      { by: 'b', say: "You caught them for the team. That's how it works." },
      { by: 'a', say: "Then the team can go catch some." },
      { beat: "Everybody at the fire goes quiet." },
      { by: 'c', say: "Wow.", opt: true },
      { by: 'a', say: "...Fine. Take one. Take two. I don't care." },
      { by: 'b', conf: "Three fish. In front of everybody. I didn't have to say a word after that. {a} said it all." },
    ] },
  ],

  'arc.spark.pair': [
    { id: 'nl5.p1', turns: [
      { beat: "{a} is collecting firewood when {b} and {c} come down the path together, finishing each other's sentences." },
      { by: 'b', say: "Morning! We already did the water." },
      { by: 'c', say: "Both trips." },
      { by: 'a', say: "Both of you? Together?" },
      { by: 'b', say: "We do everything together. It's faster." },
      { by: 'a', say: "Yeah. I'm noticing that." },
      { by: 'a', conf: "{b} and {c} do the chores together, eat together, and I'd bet anything they vote together. That's two votes walking around camp as one person." },
    ] },
    { id: 'nl5.p2', turns: [
      { by: 'a', say: "Have you two ever had an argument? Even one?" },
      { by: 'b', say: "Not really. Why?" },
      { by: 'c', say: "We just get each other." },
      { by: 'a', say: "That's really sweet." },
      { by: 'b', say: "You say that like it's a bad thing." },
      { by: 'a', say: "No, no, it's great. For you two." },
      { by: 'a', conf: "If {b} and {c} both make it to the merge, nobody's ever going to split them. I think somebody needs to, before they get the chance." },
    ] },
  ],
  'arc.spark.sank': [
    { id: 'nl5.s1', turns: [
      { beat: "On the walk back from the challenge, {a} slows down until {a} is next to {b}." },
      { by: 'a', say: "Hey. You okay?" },
      { by: 'b', say: "No. I know I lost it for us." },
      { by: 'a', say: "It wasn't just you." },
      { by: 'b', say: "It was mostly me. You can say it." },
      { by: 'a', say: "...You had a rough one. Get some sleep." },
      { by: 'a', conf: "I was nice to {b} just now, and I meant it. I'm also going to be thinking about that challenge when we sit down to vote." },
    ] },
  ],
  'arc.spark.grudge': [
    { id: 'nl5.g1', turns: [
      { beat: "{a} and {b} reach for the last of the water at the same time." },
      { by: 'b', say: "I had it first." },
      { by: 'a', say: "You always have it first." },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'a', say: "It means you take the first of everything and act like nobody notices." },
      { by: 'b', say: "Take the water, then. Since it's such a big deal." },
      { by: 'a', say: "I don't want the water now." },
      { by: 'a', conf: "I've had about a week of {b} being {b}. I'm starting to think the easiest way to fix it is a vote." },
    ] },
  ],

  'long.conf.bigmove.any': [
    { id: 'nl5.m1', turns: [
      { beat: "{a} sits alone on the dock at dawn, before anybody else is up." },
      { by: 'a', conf: "Everybody here is comfortable. They wake up, they do their chores, they vote the way they're told." },
      { by: 'a', conf: "And comfortable people stop paying attention. They don't notice when somebody starts counting differently." },
      { by: 'a', conf: "I've been counting differently for two days. There's a vote coming where everybody thinks they know what happens, and they don't." },
      { by: 'a', conf: "If I'm wrong, I go home. If I'm right, I'm the reason everybody remembers this season." },
      { by: 'a', conf: "I can live with either one. What I can't live with is sitting here waiting for my turn." },
    ] },
    { id: 'nl5.m2', when: { voice: ['anxious', 'warm', 'earnest'] }, turns: [
      { by: 'a', conf: "I've never made a big move in my life. Not at school, not at work, not anywhere." },
      { by: 'a', conf: "I'm the person who goes along with things. I'm good at going along with things." },
      { by: 'a', conf: "But going along with things in here gets you a nice seat on the jury and a hug on the way out." },
      { by: 'a', conf: "So I think I'm going to try something. I'm terrified. My hands are actually shaking right now." },
      { by: 'a', conf: "I just don't want to look back on this and know I never tried." },
    ] },
  ],
  'long.threat.notice.any': [
    { id: 'nl5.t1', turns: [
      { beat: "{a} watches {b} laughing with half the camp by the fire." },
      { by: 'a', conf: "I like {b}. Everybody likes {b}. That's the problem." },
      { by: 'a', conf: "{b} wins things, {b} helps people, and {b} has never once had a vote cast against {b.obj}." },
      { by: 'a', conf: "If {b} gets to the end, {b} wins. Nobody's going to vote against somebody who was nice to them every day." },
      { by: 'a', conf: "So either somebody deals with {b} soon, or we're all just playing for second place." },
    ] },
  ],
  'long.conf.paranoia.any': [
    { id: 'nl5.k1', turns: [
      { beat: "{a} lies awake in the {quarters}, listening to everybody else breathe." },
      { by: 'a', conf: "Two people I trust were whispering this morning. They stopped when they saw me." },
      { by: 'a', conf: "Could be nothing. Could be they were talking about breakfast." },
      { by: 'a', conf: "But nobody stops talking about breakfast when somebody walks up." },
      { by: 'a', conf: "So now I'm lying here going through every conversation I've had in three days, trying to work out which one gave me away." },
    ] },
  ],
  'long.adv.found.idol': [
    { id: 'nl5.i1', turns: [
      { beat: "{a} has been digging around the roots of the same tree for half an hour, checking over {a.posAdj} shoulder every few seconds." },
      { by: 'a', conf: "I know how this looks. I look like an idiot digging in the dirt." },
      { beat: "{a}'s fingers close around something hard and wrapped in cloth." },
      { by: 'a', conf: "Okay. Okay. Is that...? It is. That's an idol. I actually found a Hidden Immunity Idol." },
      { by: 'a', conf: "Nobody saw. Nobody knows. That's the most important part." },
      { by: 'a', conf: "From now on, every time somebody whispers my name, I get to smile, because they have no idea what's in my bag." },
    ] },
  ],
};
