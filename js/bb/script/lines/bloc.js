// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/bloc.js — voting blocs, seen from outside (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/blocs.js. The people talking are outside the bloc,
// so they never say its name: they say who is in it ({b} and {c}, or
// {target} and {partner}).
//
//   bloc.noticed   a notices b and c are a pair / a group                    couple | group
//   bloc.votes     a works it out from the last vote, {tally} (five-two)     couple | group
//   bloc.target    a picks {target} to break it; b, if there, is told        couple | group
//                  reason: alone | wins | reach; intent: told | alone
//   bloc.recruit   a asks b to go after {target}                             joined | refused
//                  intent: one | many (joined), asked | nobody (refused)
//   bloc.told      a tells b that {target} and {partner} work together       believed | doubted
//                  reason: matched | trust (believed), distrust | messenger | sudden (doubted)
//   bloc.blowup    a calls out b and c in front of the house (kitchen)       couple | group
//   bloc.quiet     a has nothing to act on yet, or keeps it in                scene

export default {
  'bloc.noticed.couple': [
    { id: 'bn.c1', turns: [{ by: 'a', dr: "{b} and {c} never vote against each other. Not once. That's one vote that counts twice." }] },
    { id: 'bn.c2', turns: [{ beat: '{b} leaves the room. A minute later, {c} follows.' }, { by: 'a', dr: "Every single time." }] },
    { id: 'bn.c3', turns: [{ by: 'a', dr: "Ask {b} a question and watch. The first thing {b} does is look at {c}." }] },
    { id: 'bn.c4', turns: [{ by: 'a', dr: "If {b} goes up, {c} will do anything to save {b.obj}. Everyone needs to know that before the next HOH." }] },
    { id: 'bn.c5', turns: [{ by: 'a', dr: "{b} and {c} say they're just friends. Friends don't check with each other before every vote." }] },
    { id: 'bn.c6', turns: [{ by: 'a', dr: "I've stopped thinking of {b} and {c} as two people. They're a pair, and you have to deal with them as a pair." }] },
    { id: 'bn.c7', when: { room: ['backyard'] }, turns: [{ beat: '{b} and {c} whisper on the hammock.' }, { by: 'a', dr: "They do that every night. I'd love to know what they talk about." }] },
    { id: 'bn.c8', turns: [{ by: 'a', dr: "{b} will never write {c}'s name down. I'm sure of it. And that changes everything." }] },
    { id: 'bn.c9', turns: [{ beat: '{c} laughs at something {b} says from across the room.' }, { by: 'a', dr: "Nobody else heard it. {c} did." }] },
  ],
  'bloc.noticed.group': [
    { id: 'bn.g1', turns: [{ by: 'a', dr: "Every time I walk in, the same people stop talking. {b}, {c}... always the same faces." }] },
    { id: 'bn.g2', turns: [{ beat: 'The conversation stops when {a} walks in.' }, { by: 'a', dr: "That's the third time today. Same people every time." }] },
    { id: 'bn.g3', turns: [{ by: 'a', dr: "{b} and {c} are working together. I can't prove it. I don't need to." }] },
    { id: 'bn.g4', turns: [{ by: 'a', dr: "I've been keeping track of who ends up in the same room. {b} and {c} are always there." }] },
    { id: 'bn.g5', turns: [{ by: 'a', dr: "If two people are that close in a house this small, the votes get decided before the rest of us even hear about them." }] },
    { id: 'bn.g6', turns: [{ by: 'a', dr: "{b} and {c} never disagree about anything. In this house, that's not normal." }] },
    { id: 'bn.g7', when: { intent: 'big' }, turns: [{ by: 'a', dr: "{b}, {c} and at least one more. I'm nearly sure. That's a lot of votes." }] },
    { id: 'bn.g8', turns: [{ by: 'a', dr: "Something's going on with {b} and {c}. They act like people who've already agreed on everything." }] },
    { id: 'bn.g9', turns: [{ by: 'a', dr: "I used to think {b} and {c} just got on well. Now I think it's a lot more than that." }] },
    { id: 'bn.g10', turns: [{ by: 'a', dr: "Nobody's told me anything. But you don't need to be told when you've got eyes." }] },
    { id: 'bn.g11', turns: [{ beat: '{b} catches {c}\'s eye across the room. {c} nods.' }, { by: 'a', dr: "What was that about?" }] },
  ],
  'bloc.votes.couple': [
    { id: 'bv.c1', turns: [{ by: 'a', dr: "{b} and {c} voted the same way. Again. They always do." }] },
    { id: 'bv.c2', turns: [{ by: 'a', dr: "That {tally} vote. I know exactly where {b} and {c}'s votes went. Same place." }] },
    { id: 'bv.c3', when: { again: true }, turns: [{ by: 'a', dr: "Every vote, {b} and {c} land in the same place. That's not a coincidence any more." }] },
    { id: 'bv.c4', turns: [{ by: 'a', dr: "I don't need anyone to tell me about {b} and {c}. I just need to look at how they vote." }] },
    { id: 'bv.c5', turns: [{ by: 'a', dr: "If you want to know how {b} will vote, ask {c}. Same answer every time." }] },
    { id: 'bv.c6', turns: [{ by: 'a', dr: "Last week proved it. {b} and {c} are one vote with two names." }] },
  ],
  'bloc.votes.group': [
    { id: 'bv.g1', turns: [{ by: 'a', dr: "That {tally} vote didn't happen by accident. {b} and {c} walked into the Diary Room already agreed." }] },
    { id: 'bv.g2', turns: [{ by: 'a', dr: "I keep going back over that {tally} vote. You only get those numbers if {b} and {c} voted together." }] },
    { id: 'bv.g3', turns: [{ by: 'a', dr: "Nobody had to tell me. I just counted. {b}, {c}, and whoever else they've got." }] },
    { id: 'bv.g4', when: { again: true }, turns: [{ by: 'a', dr: "That's not the first time {b} and {c} have voted together. It's a pattern now." }] },
    { id: 'bv.g5', turns: [{ by: 'a', dr: "I spent all last week watching the wrong people. The vote showed me who's really working together." }] },
    { id: 'bv.g6', turns: [{ by: 'a', dr: "A {tally} vote. Somebody organised that. My money's on {b} and {c}." }] },
  ],
  'bloc.target.couple': [
    { id: 'bt.c1', turns: [{ by: 'a', dr: "You can't take out {target} and {partner} at the same time. So you split them up. {target} goes first." }] },
    { id: 'bt.c2', turns: [{ by: 'a', dr: "I don't care which one of them goes. I care that one of them does. {target} is easier to get." }] },
    { id: 'bt.c3', turns: [{ by: 'a', dr: "Once {target} is gone, {partner} is just one angry person instead of half of a pair." }] },
    { id: 'bt.c4', when: { intent: 'told' }, turns: [{ by: 'a', say: "{target} and {partner} will keep voting together unless somebody splits them up." }, { by: 'b', say: "So which one?" }, { by: 'a', say: "{target}." }] },
    { id: 'bt.c5', when: { intent: 'told', reason: 'alone' }, turns: [{ by: 'b', say: "Why {target} and not {partner}?" }, { by: 'a', say: "Because {partner} has friends all over the house. {target} only has {partner}." }] },
    { id: 'bt.c6', when: { intent: 'told', reason: 'wins' }, turns: [{ by: 'a', say: "{target} keeps winning comps. If {target} gets to the end with {partner}, we're done." }, { by: 'b', say: "So we split them up now." }, { by: 'a', say: "Now." }] },
    { id: 'bt.c7', when: { reason: 'wins' }, turns: [{ by: 'a', dr: "{target} is the one winning the comps. Take {target} out and {partner} is on {partner.posAdj} own." }] },
    { id: 'bt.c8', when: { intent: 'told' }, turns: [{ by: 'b', say: "You really think they're a pair?" }, { by: 'a', say: "I know they are. And I know which one to go after." }] },
  ],
  'bloc.target.group': [
    { id: 'bt.g1', turns: [{ by: 'a', dr: "We're not playing against {target} and {partner} separately. We're playing against one group that votes together. {target} is how we break it." }] },
    { id: 'bt.g2', turns: [{ by: 'a', dr: "I've gone over it again and again. The way into that group is {target}." }] },
    { id: 'bt.g3', turns: [{ by: 'a', dr: "I'm done guessing about that group. It's real, and the person to go after is {target}." }] },
    { id: 'bt.g4', when: { reason: 'alone' }, turns: [{ by: 'a', dr: "{target} doesn't have anyone outside that group. Take {target} out and the rest of them have nowhere to hide." }] },
    { id: 'bt.g5', when: { reason: 'wins' }, turns: [{ by: 'a', dr: "{target} keeps winning. If that group gets to the end, it'll be because {target} carried them." }] },
    { id: 'bt.g6', when: { reason: 'reach' }, turns: [{ by: 'a', dr: "I can't get to {partner}. But {target}? {target} I can get to." }] },
    { id: 'bt.g7', when: { intent: 'told' }, turns: [{ by: 'a', say: "{target}. That's who we go after." }, { by: 'b', say: "Why {target}?" }, { by: 'a', say: "Because if {target} goes, that group falls apart." }] },
    { id: 'bt.g8', when: { intent: 'told' }, turns: [{ by: 'a', say: "Have you noticed {target} and {partner} always vote the same way?" }, { by: 'b', say: "Now you mention it." }, { by: 'a', say: "That's why {target} has to go." }] },
    { id: 'bt.g9', when: { intent: 'told', reason: 'alone' }, turns: [{ by: 'b', say: "Why not {partner}?" }, { by: 'a', say: "{partner} has friends everywhere. {target} only has that group." }] },
    { id: 'bt.g10', when: { intent: 'told', reason: 'wins' }, turns: [{ by: 'b', say: "Why {target}?" }, { by: 'a', say: "Look at how many comps {target} has won. That group isn't going anywhere while {target} is here." }] },
  ],
  'bloc.recruit.joined': [
    { id: 'br.j1', turns: [{ by: 'a', say: "I'm not asking you to like me. I'm asking you to count." }, { by: 'b', say: "...Okay. I see it." }, { by: 'a', say: "So {target} goes first." }, { by: 'b', say: "{target} goes first." }] },
    { id: 'br.j2', turns: [{ by: 'a', say: "If {target}'s group sticks together, the rest of us go home one by one." }, { by: 'b', say: "So what do we do?" }, { by: 'a', say: "We get {target} out first." }] },
    { id: 'br.j3', turns: [{ by: 'a', say: "Can I talk to you for a second? It's about {target}." }, { by: 'b', say: "I was wondering when someone would bring that up." }] },
    { id: 'br.j4', turns: [{ by: 'b', say: "I've been thinking the same thing about {target}." }, { by: 'a', say: "Then let's do something about it." }] },
    { id: 'br.j5', turns: [{ by: 'a', dr: "I've been pulling people aside one at a time. {b} is in. {target} goes first." }] },
    { id: 'br.j6', when: { intent: 'many' }, turns: [{ by: 'a', dr: "I made the same pitch to a few people today. More than one of them said yes. {target} is in trouble." }] },
    { id: 'br.j7', turns: [{ by: 'b', dr: "{a} made a good point about {target}. I don't totally trust {a}, but the numbers are the numbers." }] },
    { id: 'br.j8', turns: [{ by: 'a', say: "You see it too, right? {target} and those people always vote together." }, { by: 'b', say: "I see it." }, { by: 'a', say: "Then we're on the same page." }] },
    { id: 'br.j9', turns: [{ by: 'b', say: "If I go after {target}, you've got my back?" }, { by: 'a', say: "Completely." }, { by: 'b', say: "Then I'm in." }] },
  ],
  'bloc.recruit.refused': [
    { id: 'br.r1', turns: [{ by: 'a', dr: "I told people about {target}'s group. Everybody nodded. Nobody's going to do anything." }] },
    { id: 'br.r2', turns: [{ by: 'a', dr: "The plan's good. I'm just the wrong person to be pitching it." }] },
    { id: 'br.r3', turns: [{ by: 'a', dr: "I keep saying {target}'s name and nobody wants to hear it." }] },
    { id: 'br.r4', when: { intent: 'asked' }, turns: [{ by: 'a', say: "{target} is working with a group. We need to get {target} out." }, { by: 'b', say: "Says who?" }, { by: 'a', say: "Says me." }, { by: 'b', say: "That's what worries me." }] },
    { id: 'br.r5', when: { intent: 'asked' }, turns: [{ by: 'b', say: "Think about who gains if I believe you." }, { by: 'a', say: "Everyone who isn't in that group." }, { by: 'b', say: "Or just you." }] },
    { id: 'br.r6', when: { intent: 'asked' }, turns: [{ by: 'b', say: "I'm not saying you're wrong about {target}. I'm saying I don't trust you." }] },
    { id: 'br.r7', when: { intent: 'asked' }, turns: [{ by: 'b', dr: "{a} wants me to go after {target}. I want to know why {a} is so keen." }] },
    { id: 'br.r8', turns: [{ by: 'a', dr: "Everyone I talked to today agreed with me and then did nothing. That's worse than saying no." }] },
  ],
  'bloc.told.believed': [
    { id: 'bl.b1', turns: [{ by: 'a', say: "{target} and {partner} are working together." }, { by: 'b', say: "I know. I've been watching them." }, { by: 'a', say: "So it's not just me." }] },
    { id: 'bl.b2', turns: [{ by: 'a', say: "You know {target} and {partner} are working together, right?" }, { by: 'b', say: "...That explains the last vote." }] },
    { id: 'bl.b3', turns: [{ by: 'b', say: "Say that again." }, { by: 'a', say: "{target} and {partner}. They've got a deal." }, { by: 'b', say: "That makes so much sense." }] },
    { id: 'bl.b4', when: { reason: 'matched' }, turns: [{ by: 'b', dr: "I already had a feeling about {target} and {partner}. {a} just said it first." }] },
    { id: 'bl.b5', when: { reason: 'trust' }, turns: [{ by: 'b', dr: "If anyone else told me that, I'd ignore it. But I trust {a}." }] },
    { id: 'bl.b6', turns: [{ by: 'a', say: "I'm only telling you because I trust you. {target} and {partner} are together." }, { by: 'b', say: "I'm glad you told me." }] },
    { id: 'bl.b7', turns: [{ by: 'a', say: "{target} and {partner} have a deal." }, { by: 'b', say: "How long have you known?" }, { by: 'a', say: "A while. I wanted to be sure first." }] },
    { id: 'bl.b8', turns: [{ by: 'a', say: "Watch {target} and {partner} at the next vote." }, { by: 'b', say: "Who else knows?" }, { by: 'a', say: "Just you." }, { by: 'b', say: "Keep it that way." }] },
    { id: 'bl.b9', when: { reason: 'matched' }, turns: [{ by: 'a', say: "I think {target} and {partner} are working together." }, { by: 'b', say: "I've thought that for days." }] },
  ],
  'bloc.told.doubted': [
    { id: 'bl.d1', turns: [{ by: 'a', say: "{target} and {partner} are working together." }, { by: 'b', say: "And who told you that?" }, { by: 'a', say: "Nobody. I worked it out." }, { by: 'b', say: "Right." }] },
    { id: 'bl.d2', turns: [{ by: 'b', dr: "{a} told me {target} and {partner} are working together. Maybe. Or maybe {a} wants me to think that." }] },
    { id: 'bl.d3', turns: [{ by: 'a', say: "{target} and {partner} have a deal." }, { by: 'b', say: "Have you got any proof?" }, { by: 'a', say: "Not exactly." }, { by: 'b', say: "Then I'm not buying it." }] },
    { id: 'bl.d4', when: { reason: 'distrust' }, turns: [{ by: 'b', dr: "I don't trust {a}. So I don't trust anything {a} tells me." }] },
    { id: 'bl.d5', when: { reason: 'messenger' }, turns: [{ by: 'b', dr: "{a} might even be right. But I'm not going to make a move because {a} told me to." }] },
    { id: 'bl.d6', when: { reason: 'sudden' }, turns: [{ by: 'a', say: "{target} and {partner} are a team." }, { by: 'b', say: "Where's this coming from?" }, { by: 'a', say: "I've been watching them." }, { by: 'b', say: "Since when?" }] },
    { id: 'bl.d7', turns: [{ by: 'a', dr: "I told {b} about {target} and {partner}. {b} didn't believe a word. And I was telling the truth." }] },
    { id: 'bl.d8', turns: [{ by: 'a', say: "You should know about {target} and {partner}." }, { by: 'b', say: "Why are you telling me this?" }, { by: 'a', say: "Because you should know." }, { by: 'b', say: "Or because it helps you." }] },
    { id: 'bl.d9', when: { reason: 'sudden' }, turns: [{ by: 'b', dr: "Out of nowhere, {a} tells me {target} and {partner} are a team. That sounds like a move to me." }] },
  ],
  'bloc.blowup.group': [
    { id: 'bb.g1', turns: [{ by: 'a', say: "We all know {b} and {c} are working together! Stop pretending!" }, { by: 'b', say: "That's not true." }, { by: 'a', say: "Then why do you always vote the same way?" }] },
    { id: 'bb.g2', turns: [{ by: 'a', say: "Say it to my face that you're not working together." }, { beat: '{b} says nothing.' }, { by: 'a', dr: "{b} didn't deny it. That's all anyone needed to hear." }] },
    { id: 'bb.g3', turns: [{ beat: 'An argument about the dishes turns into something else.' }, { by: 'a', say: "This isn't about the dishes. This is about {b} and {c} running this house!" }] },
    { id: 'bb.g4', turns: [{ by: 'a', say: "Everyone in this room knows about {b} and {c}. I'm just the one saying it." }, { by: 'c', say: "You're embarrassing yourself." }] },
    { id: 'bb.g5', turns: [{ by: 'c', say: "Can we not do this here?" }, { by: 'a', say: "Where else? You do everything behind closed doors!" }] },
    { id: 'bb.g6', turns: [{ by: 'b', dr: "{a} just shouted about our alliance in front of the whole house. We're in big trouble now." }] },
    { id: 'bb.g7', turns: [{ by: 'a', dr: "I couldn't keep it in any more. I said it in front of everyone. Now nobody can pretend." }] },
  ],
  'bloc.blowup.couple': [
    { id: 'bb.c1', turns: [{ by: 'a', say: "You two vote the same way every single time!" }, { by: 'b', say: "We're friends." }, { by: 'a', say: "You're a lot more than friends in this game." }] },
    { id: 'bb.c2', turns: [{ by: 'a', say: "Everyone knows {b} and {c} are a pair. Stop acting like you're not!" }, { by: 'c', say: "We never said we weren't." }] },
    { id: 'bb.c3', turns: [{ by: 'a', say: "If one of you goes up, the other will do anything to save them. Just admit it." }, { by: 'b', say: "Of course I'd want to save {c}." }, { by: 'a', say: "Thank you. That's all I wanted to hear." }] },
    { id: 'bb.c4', turns: [{ by: 'b', dr: "{a} just told the whole house that {c} and I are a pair. Now we've both got targets on our backs." }] },
    { id: 'bb.c5', turns: [{ by: 'a', dr: "Somebody had to say it out loud. {b} and {c} are a team. Now everybody knows it." }] },
    { id: 'bb.c6', turns: [{ by: 'c', say: "Why are you doing this in front of everyone?" }, { by: 'a', say: "Because you two do everything in private!" }] },
    { id: 'bb.c7', turns: [{ beat: 'The whole house stops to watch.' }, { by: 'a', say: "{b} and {c}. One vote, twice. Every single week." }] },
  ],
  'bloc.quiet.scene': [
    { id: 'bq.1', turns: [{ by: 'a', dr: "I've got a feeling about some people in here. I'm keeping it to myself for now." }] },
    { id: 'bq.2', turns: [{ by: 'a', dr: "I'm not ready to say anything yet. I want to be sure first." }] },
    { id: 'bq.3', turns: [{ by: 'a', dr: "I'm watching. That's all I'm doing for now." }] },
    { id: 'bq.4', turns: [{ by: 'a', dr: "Everyone's trying to work out who's with who. Me too. I'm just quieter about it." }] },
    { id: 'bq.5', turns: [{ by: 'a', dr: "I could say something. But the minute I do, I'm the one with the target." }] },
    { id: 'bq.6', turns: [{ by: 'a', dr: "Not yet. I'll know when it's the right time." }] },
    { id: 'bq.7', turns: [{ by: 'a', dr: "Nobody's telling me anything this week. So I'm working it out on my own." }] },
  ],
};
