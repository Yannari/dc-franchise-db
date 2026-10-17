// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/shifts.js — alliances that change shape
// ══════════════════════════════════════════════════════════════════════
//
// alliances.js allianceShifts. {alliance} is a group's name; the rest per kind:
//   alliance-leave.walked         a leaves {alliance} on their own; b is the leader (or whoever is left)
//   alliance-leave.walked-friend  a leaves because {alliance} is coming for {target}, a's partner or close friend
//   alliance-leave.defected       a leaves {alliance} for {to}; b, the old leader, finds out
//   alliance-switch.any           b joins {alliance} from {from}; a leads {alliance}
//   alliance-merge.any            a and b lead {alliance} and {from}, joining against {against}; c, d other members
//   alliance-end.drifted          a and b were in {alliance}; nobody betrayed anybody, it just stopped being a group
export default {
  // (appended to game.js's 'alliance-leave.walked' by index.js)
  'alliance-leave.walked+': [
    { id: 'sw.w1', turns: [
      { beat: '{a} finds {b} alone by the pool.' },
      { by: 'a', say: "I need to tell you something, and I'd rather you heard it from me." },
      { by: 'b', say: "That's never good." },
      { by: 'a', say: "I'm out of {alliance}. I don't fit in it, and I've known that for a while." },
      { by: 'b', say: "You could have said something before now." },
      { by: 'a', say: "I'm saying it now. No hard feelings." },
      { by: 'b', say: "There are always hard feelings in here." },
      { by: 'a', conf: "Nobody in {alliance} was ever going to fight for me. I'd rather be on my own than be the first name they give up." },
    ] },
    { id: 'sw.w2', turns: [
      { by: 'b', say: "You haven't been at a single one of our talks this week." },
      { by: 'a', say: "Because I'm not part of them anymore. I'm done with {alliance}." },
      { by: 'b', say: "Just like that?" },
      { by: 'a', say: "It hasn't been just like that. It's been weeks of me sitting in a room where nobody listens to me." },
      { by: 'b', say: "Okay. Then I hope you know what you're doing." },
      { by: 'b', conf: "{a} walked away from {alliance}. That's one less vote for us, and one more person who knows everything we talk about." },
    ] },
    { id: 'sw.w3', turns: [
      { by: 'a', conf: "I left {alliance} today. I didn't get kicked out, and nobody stabbed me in the back. I just didn't belong there." },
      { by: 'a', conf: "The scary part is that I'm a free agent now. The good part is that nobody gets to decide my vote for me." },
    ] },
  ],
  'alliance-leave.walked-friend': [
    { id: 'sw.f1', turns: [
      { beat: '{a} walks into the room where {b} is talking strategy and does not sit down.' },
      { by: 'a', say: "I heard who {alliance} wants to vote in. It's {target}." },
      { by: 'b', say: "It's the smart move, and you know it." },
      { by: 'a', say: "Maybe it is. I'm not doing it to {target}." },
      { by: 'b', say: "Then you're choosing {target} over us." },
      { by: 'a', say: "Yes. I am." },
      { by: 'a', conf: "{alliance} wanted me to help send {target} into the Arena. Some things matter more than a vote, and {target} is one of them." },
    ] },
    { id: 'sw.f2', turns: [
      { by: 'b', say: "You've been quiet since we said {target}'s name." },
      { by: 'a', say: "Because I'm not going to be the reason {target} goes in." },
      { by: 'b', say: "This is bigger than one person." },
      { by: 'a', say: "Not to me. I'm out of {alliance}." },
      { by: 'b', conf: "We lost {a} over {target}. I should have seen that coming. Everybody in this house knows how close they are." },
    ] },
    { id: 'sw.f3', turns: [
      { by: 'a', say: "I'm leaving the group." },
      { by: 'b', say: "Because of {target}?" },
      { by: 'a', say: "Because of {target}. If you're coming for {target}, you're coming for me too." },
      { by: 'b', say: "That's a big thing to say in here." },
      { by: 'a', say: "I know. I mean it." },
      { by: 'a', conf: "I'm not going to sit in a room and help plan against somebody I care about. {alliance} can do it without me." },
    ] },
  ],
  'alliance-leave.defected': [
    { id: 'sw.d1', turns: [
      { by: 'b', say: "Somebody told me you've been meeting with {to}." },
      { by: 'a', say: "I'm not going to lie to you. I'm with {to} now." },
      { by: 'b', say: "After everything {alliance} did for you?" },
      { by: 'a', say: "They want me more than you did. That's all this is." },
      { by: 'b', say: "No. This is you picking a side, and it isn't ours." },
      { by: 'b', conf: "{a} walked out of {alliance} and straight into {to}. I'll remember that at every vote from now on." },
    ] },
    { id: 'sw.d2', turns: [
      { by: 'a', conf: "I left {alliance} for {to} today. I know how it looks. I also know where the numbers are." },
      { by: 'b', conf: "I found out {a} jumped to {to} from somebody else. {a} didn't even have the decency to tell me." },
    ] },
    { id: 'sw.d3', turns: [
      { beat: '{b} is waiting for {a} in the kitchen.' },
      { by: 'b', say: "So it's true. You're with {to}." },
      { by: 'a', say: "It's true." },
      { by: 'b', say: "We trusted you with everything." },
      { by: 'a', say: "And I didn't tell them any of it. I just don't want to be in {alliance} anymore." },
      { by: 'b', say: "You'll tell them eventually. Everybody does." },
      { by: 'a', conf: "{b} thinks I'm a traitor. Maybe I am. But {to} has the votes, and I'm not going to go home out of loyalty." },
    ] },
  ],
  'alliance-switch.any': [
    { id: 'sw.g1', turns: [
      { by: 'b', say: "I want in, if you'll have me." },
      { by: 'a', say: "You're leaving {from}?" },
      { by: 'b', say: "I already have." },
      { by: 'a', say: "Then you're in {alliance}. But I'm watching you." },
      { by: 'b', say: "That's fair." },
      { by: 'a', conf: "{b} just left {from} to join us. That's a vote, and it's somebody who knows everything {from} is planning. It's also somebody who's done this once before." },
    ] },
    { id: 'sw.g2', turns: [
      { beat: '{b} sits down with {alliance} for the first time.' },
      { by: 'a', say: "Everybody, {b} is with us now." },
      { by: 'b', say: "I know some of you don't trust me yet." },
      { by: 'a', say: "Then tell us something that earns it. What is {from} planning?" },
      { by: 'b', say: "Give me a day, and you'll know everything I know." },
      { by: 'b', conf: "I came over from {from} with nothing but what I know. I'd better make it worth something." },
    ] },
  ],
  'alliance-merge.any': [
    { id: 'sm.1', turns: [
      { beat: '{a} and {b} meet in the gym with the door shut.' },
      { by: 'a', say: "{against} is bigger than both of us. Separately, we're done." },
      { by: 'b', say: "And together?" },
      { by: 'a', say: "Together, we're the bigger group. {alliance} and {from}, voting as one." },
      { by: 'b', say: "We keep your name?" },
      { by: 'a', say: "We keep whatever name gets {against} out of this house." },
      { by: 'c', opt: 1, say: "I'm in. I'm tired of losing votes to them." },
      { by: 'b', conf: "Yesterday {a} was the competition. Today we're one alliance. That's how much {against} scares everybody." },
    ] },
    { id: 'sm.2', turns: [
      { by: 'b', say: "We've been splitting votes with you for weeks, and {against} keeps winning." },
      { by: 'a', say: "So stop splitting them." },
      { by: 'b', say: "That's what I'm here to say. {from} is in, if {alliance} will have us." },
      { by: 'a', say: "Then we're one group from tonight." },
      { by: 'd', opt: 1, say: "Does everybody know about this?" },
      { by: 'a', opt: 'd', say: "Everybody who needs to." },
      { by: 'a', conf: "Two small alliances don't scare anybody. One big one does. {against} is going to find that out at the vote." },
    ] },
    { id: 'sm.3', turns: [
      { by: 'a', say: "I'll be honest. I never thought I'd be making a deal with you." },
      { by: 'b', say: "Neither did I. But {against} has run every vote, and I'm sick of it." },
      { by: 'a', say: "Then {from} and {alliance} vote together until {against} is broken up." },
      { by: 'b', say: "And after that?" },
      { by: 'a', say: "After that we'll find out who we really are." },
      { by: 'b', conf: "This isn't friendship. It's two groups who are scared of the same people, and right now that's enough." },
    ] },
  ],
  'alliance-end.drifted': [
    { id: 'sd.1', turns: [
      { by: 'a', say: "Can I say what we're all thinking? {alliance} isn't really a thing anymore." },
      { by: 'b', say: "We haven't voted the same way in a while." },
      { by: 'a', say: "We barely talk. We just used to." },
      { by: 'b', say: "So we call it?" },
      { by: 'a', say: "We call it. No hard feelings." },
      { by: 'b', conf: "Nobody betrayed anybody. {alliance} just stopped being a group, and none of us noticed until it was already gone." },
    ] },
    { id: 'sd.2', turns: [
      { by: 'a', conf: "{alliance} didn't end with a fight. We just stopped sitting together at dinner, and then we stopped meeting." },
      { by: 'a', conf: "I'm not even angry about it. I'm a little sad, and I'm a lot more alone than I was a week ago." },
    ] },
    { id: 'sd.3', turns: [
      { beat: '{a} and {b} pass each other on the stairs.' },
      { by: 'b', say: "Are we still meeting tonight?" },
      { by: 'a', say: "I don't think anybody is coming." },
      { by: 'b', say: "Yeah. I didn't think so." },
      { by: 'a', say: "It was good while it lasted." },
      { by: 'b', say: "It was." },
      { by: 'b', conf: "{alliance} was supposed to get us all to the final. It didn't get us there, and nobody even said goodbye." },
    ] },
  ],
};
