// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/hohweek4.js — the HOH's plan: weighed before the ceremony, explained after it
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-25, on the HOH laying out all three nominees to a friend before the nomination
// ceremony: "he said this before the nomination and spoiled me", and asked how it should work, "sometimes
// they have a plan before nom but nothing set in stone". So:
//   talk.hohweek.weigh          before the ceremony: the HOH thinks out loud and decides nothing. {c} is the
//                               name they lean to, {d} and {e} others they are weighing (one of them may
//                               never be nominated at all)
//   talk.hohweek.after.<pawn|two|backdoor>   after the ceremony, before the veto: the plan, with what the
//                               HOH does if the veto goes wrong. {c} the target, {d} the other nominee,
//                               {e} the backdoor target (not on the block)
// A Block Buster week's plan after the ceremony is talk.bb.hoh (gametalk.js). Written against
// docs/bb-dialogue-style.md: short turns, names, the veto said by name, nobody quoting a maxim.

export default {
  'talk.hohweek.weigh': [
    { id: 'hw4.w1', presumes: ['hoh'], room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} is lying across the bed. {b} is on the floor with a bowl of the HOH snacks.' },
      { by: 'b', say: "So who are you putting up?" },
      { by: 'a', say: "I don't know yet." },
      { by: 'b', say: "You've had the key for a whole day." },
      { by: 'a', say: "I know. I keep going back and forth. Right now it's {c}. Maybe {d}." },
      { by: 'b', say: "What about {e}?" },
      { by: 'a', say: "{e}'s on the list too. I'm not deciding tonight." },
      { by: 'a', dr: "Everybody thinks I've already decided. I haven't. It's {c} today. Ask me tomorrow and it might not be." },
    ] },
    { id: 'hw4.w2', presumes: ['hoh'], room: 'backyard', turns: [
      { beat: 'The backyard. {a} and {b} are walking laps, keeping their voices down.' },
      { by: 'b', say: "Are you going after {c}?" },
      { by: 'a', say: "Probably. I'm leaning that way." },
      { by: 'b', say: "Leaning." },
      { by: 'a', say: "Leaning. I keep thinking about {d} too. And {e}." },
      { by: 'b', say: "{d}? Why {d}?" },
      { by: 'a', say: "I don't know. I just don't know where {d} is with me. Or {e}, honestly." },
      { by: 'a', dr: "If you'd asked me when I won, it was {c}, no question. Now I've got {d} and {e} in my head as well, and the ceremony's tomorrow." },
    ] },
    { id: 'hw4.w3', presumes: ['hoh'], turns: [
      { by: 'b', say: "Have you decided?" },
      { by: 'a', say: "Not really." },
      { by: 'b', say: "'Not really' means yes." },
      { by: 'a', say: "It means I have a name I like and two I'm still thinking about." },
      { by: 'b', say: "Which name?" },
      { by: 'a', say: "{c}. For now. Don't say anything." },
      { by: 'b', say: "And the other two?" },
      { by: 'a', say: "{d} and {e}. One of them, maybe. Maybe neither." },
      { by: 'b', dr: "{a} says it's not decided. I think it's {c}, and I think {a} knows it too." },
    ] },
    { id: 'hw4.w4', presumes: ['hoh'], room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} is sitting on the bed with the nomination keys in a little pile.' },
      { by: 'a', say: "I hate this part." },
      { by: 'b', say: "Picking?" },
      { by: 'a', say: "Picking. Whoever I put up is going to be mad at me for weeks." },
      { by: 'b', say: "So who's going to be mad at you?" },
      { by: 'a', say: "Probably {c}. Maybe {d}. I keep switching." },
      { by: 'b', say: "What about {e}?" },
      { by: 'a', say: "I thought about {e}. I don't think {e} is coming after me. Yet." },
      { by: 'a', dr: "I've got a plan. It's just not a very good plan yet, and I've got until the ceremony to fix it." },
    ] },
    { id: 'hw4.w5', presumes: ['hoh'], room: 'hoh-room', turns: [
      { beat: 'HOH room, late. The house is asleep. {b} has come up and is sitting at the end of the bed.' },
      { by: 'b', say: "You can't sleep either?" },
      { by: 'a', say: "No. Nominations." },
      { by: 'b', say: "Who?" },
      { by: 'a', say: "I'm going to put {c} up. I think." },
      { by: 'b', say: "You think?" },
      { by: 'a', say: "If {c} comes up here tomorrow and says the right thing, I don't know. And then there's {d}. And {e}." },
      { by: 'b', dr: "It's the night before the ceremony and {a} still doesn't know. Honestly, that scares me more than if {a} had a plan." },
    ] },
    { id: 'hw4.w6', presumes: ['hoh'], turns: [
      { by: 'a', say: "Can I run something by you?" },
      { by: 'b', say: "Go." },
      { by: 'a', say: "{c}. What do you think?" },
      { by: 'b', say: "As a target? Yeah. {c} would put you up in a second." },
      { by: 'a', say: "That's what I thought. And {d}?" },
      { by: 'b', say: "I'm not sure about {d}. {d} has been nice to you." },
      { by: 'a', say: "{d} has been nice to everybody. That's kind of my problem with {d}." },
      { by: 'b', say: "And {e}?" },
      { by: 'a', say: "{e}'s a maybe." },
      { by: 'a', dr: "I wanted to hear somebody else say {c}'s name before I commit to anything. {b} said it straight away." },
    ] },
  ],

  // ── after the ceremony: target and pawn ──
  'talk.hohweek.after.pawn': [
    { id: 'ha.p1', presumes: ['hoh', 'noms'], room: 'hoh-room', turns: [
      { beat: 'HOH room, after the ceremony. {a} has the door shut. {b} is sitting on the end of the bed.' },
      { by: 'b', say: "So {c} is the target. And {d}?" },
      { by: 'a', say: "{d} is just filling the chair. {d} isn't who I want gone." },
      { by: 'b', say: "And if {d} wins the veto?" },
      { by: 'a', say: "Then {d} comes down, I put somebody else up next to {c}, and {c} still goes." },
      { by: 'b', say: "And if {c} wins it?" },
      { by: 'a', say: "Then I'm in trouble. Then it's {d} or whoever I put up, and I don't want either of those." },
      { by: 'a', dr: "Everything this week depends on {c} not winning the veto. If {c} wins it, my whole week falls apart." },
    ] },
    { id: 'ha.p2', presumes: ['hoh', 'noms'], turns: [
      { by: 'b', say: "Why {d}?" },
      { by: 'a', say: "Because nobody's going to vote {d} out over {c}." },
      { by: 'b', say: "You hope." },
      { by: 'a', say: "I counted. {c} doesn't have the votes." },
      { by: 'b', say: "Unless {c} wins the veto." },
      { by: 'a', say: "Unless {c} wins the veto. Then I need a replacement, and I don't have one I love." },
      { by: 'b', dr: "{a} is confident. I'd be confident too, if pawns didn't go home in this game all the time." },
    ] },
    { id: 'ha.p3', presumes: ['hoh', 'noms'], room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} is lying on the bed staring at the ceiling. {b} comes in and shuts the door.' },
      { by: 'b', say: "You did it." },
      { by: 'a', say: "I did it. {c} and {d}." },
      { by: 'b', say: "{d} looked shocked." },
      { by: 'a', say: "I know. I'll go and talk to {d} tonight." },
      { by: 'b', say: "What do you tell {d}?" },
      { by: 'a', say: "The truth. {c} is the one I want out. And if the veto comes off {d}, {d} is safe anyway." },
      { by: 'a', dr: "I need {d} calm and {c} nervous. If it's the other way round, I've done something wrong." },
    ] },
    { id: 'ha.p4', presumes: ['hoh', 'noms'], turns: [
      { by: 'b', say: "Who do you want playing in the veto?" },
      { by: 'a', say: "Anybody but {c}'s friends. And I want {c} not to win it." },
      { by: 'b', say: "And if {c} does?" },
      { by: 'a', say: "Then I have to name a replacement, and somebody I didn't plan on could go home." },
      { by: 'b', say: "Have you got a name?" },
      { by: 'a', say: "Not one I'm happy with." },
      { by: 'b', dr: "{a} keeps saying {d} is safe. {d} is only safe if {c} stays on the block." },
    ] },
  ],

  // ── after the ceremony: two names the HOH would both send home ──
  'talk.hohweek.after.two': [
    { id: 'ha.t1', presumes: ['hoh', 'noms'], room: 'hoh-room', turns: [
      { beat: 'HOH room, after the ceremony. {b} closes the door behind them.' },
      { by: 'b', say: "{c} and {d}. No pawn?" },
      { by: 'a', say: "No pawn. I'd be happy with either of them leaving." },
      { by: 'b', say: "That's a big swing." },
      { by: 'a', say: "It's the only way to be sure. If one of them wins the veto, the other one's still up there." },
      { by: 'b', say: "And who do you put up if the veto gets used?" },
      { by: 'a', say: "Somebody I'm okay losing too. I've got a couple of names." },
      { by: 'a', dr: "I didn't want to put somebody up as a pawn and risk sending the wrong person home. Either of them going works for me." },
    ] },
    { id: 'ha.t2', presumes: ['hoh', 'noms'], turns: [
      { by: 'b', say: "Which one do you actually want gone?" },
      { by: 'a', say: "Honestly? {c}. But {d} going wouldn't upset me." },
      { by: 'b', say: "So you're happy either way." },
      { by: 'a', say: "Pretty much. That's why I did it like this." },
      { by: 'b', say: "Unless the veto changes it." },
      { by: 'a', say: "If the veto comes off one of them, I'm not putting up anybody I care about. I promise you that." },
      { by: 'b', dr: "{a} says I'm safe whatever happens with the veto. I believe it about eighty percent." },
    ] },
    { id: 'ha.t3', presumes: ['hoh', 'noms'], turns: [
      { by: 'b', say: "Are you worried?" },
      { by: 'a', say: "About the veto? Yeah. A bit." },
      { by: 'b', say: "{c} and {d} will both go all out for it." },
      { by: 'a', say: "I know. It's the only thing that can mess this up." },
      { by: 'b', say: "And if it does?" },
      { by: 'a', say: "Then I put somebody else up and I still get one of the people I wanted out. Just maybe not the one I wanted most." },
      { by: 'a', dr: "Two people on the block that I'd both be happy to see leave. If the veto doesn't change anything, I win either way." },
    ] },
    { id: 'ha.t4', presumes: ['hoh', 'noms'], room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} is eating cereal out of the box. {b} is lying on the floor.' },
      { by: 'b', say: "{c} is already working the house." },
      { by: 'a', say: "Let {c} work the house. The votes aren't there." },
      { by: 'b', say: "And {d}?" },
      { by: 'a', say: "{d} is quiet. Quiet worries me more." },
      { by: 'b', say: "So you'd rather {d} goes?" },
      { by: 'a', say: "I'd be fine with either. I'd just sleep better if it's {d}." },
      { by: 'b', dr: "{a} put up two people and still hasn't said which one {a} wants gone. I think {a} is waiting to see who wins the veto." },
    ] },
  ],

  // ── after the ceremony: the backdoor, waiting for the veto ──
  'talk.hohweek.after.backdoor': [
    { id: 'ha.b1', presumes: ['hoh', 'noms'], room: 'hoh-room', turns: [
      { beat: 'HOH room. {a} locks the door and turns the music up before saying anything.' },
      { by: 'b', say: "You didn't put {e} up." },
      { by: 'a', say: "No. Not yet." },
      { by: 'b', say: "Not yet?" },
      { by: 'a', say: "If the veto gets used on {c} or {d}, I put {e} up in their place." },
      { by: 'b', say: "And if nobody uses the veto?" },
      { by: 'a', say: "Then {c} or {d} goes, and {e} gets another week. So I need somebody to win it who'll use it." },
      { by: 'a', dr: "If I'd put {e} up today, {e} plays in the veto and maybe wins and walks right off. This way {e} has no idea." },
    ] },
    { id: 'ha.b2', presumes: ['hoh', 'noms'], turns: [
      { by: 'b', say: "Is {e} the real target?" },
      { by: 'a', say: "Keep your voice down. Yes." },
      { by: 'b', say: "So {c} and {d} are just..." },
      { by: 'a', say: "Sitting there. I need one of them to come off." },
      { by: 'b', say: "How?" },
      { by: 'a', say: "I need you, or somebody I trust, to win the veto and use it. Then {e} goes up." },
      { by: 'b', say: "And if {e} wins the veto?" },
      { by: 'a', say: "Then it's over, and I send {c} or {d} home instead." },
      { by: 'b', dr: "{a} has been friendly with {e} all week. {e} has no idea what's coming." },
    ] },
    { id: 'ha.b3', presumes: ['hoh', 'noms'], turns: [
      { beat: 'HOH room, late. {a} and {b} are sitting on the floor with their backs against the bed.' },
      { by: 'a', say: "Can I tell you the actual plan?" },
      { by: 'b', say: "Please." },
      { by: 'a', say: "{e}. After the veto." },
      { by: 'b', say: "You put up {c} and {d} so {e} wouldn't play?" },
      { by: 'a', say: "Exactly. If {e} isn't on the block, {e} only plays if {e} gets picked." },
      { by: 'b', say: "And if {e} gets picked?" },
      { by: 'a', say: "Then I'm in trouble." },
      { by: 'a', dr: "It only works if somebody uses the veto, and if {e} doesn't win it. That's two things that have to go my way." },
    ] },
    { id: 'ha.b4', presumes: ['hoh', 'noms'], turns: [
      { by: 'b', say: "{e} thinks you two are fine." },
      { by: 'a', say: "Good. I need {e} to keep thinking that until the veto meeting." },
      { by: 'b', say: "It's going to be ugly when it happens." },
      { by: 'a', say: "It's going to be ugly whatever I do. At least this way {e} actually goes." },
      { by: 'b', say: "If the veto gets used." },
      { by: 'a', say: "If the veto gets used. I'm working on that." },
      { by: 'a', dr: "I can't control who wins the veto. I can talk to every single person who might play in it, and that's what I'm doing tomorrow." },
    ] },
  ],
};
