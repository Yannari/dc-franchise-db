// pm/talk/more/debrief-arcs-volume.js — the last pools heard five times a
// season (the user, 2026-10-23: "also add the volume like u wanted to do to
// avoid repetitions"): the debrief's recount, one or two lines for each thing
// a night can do to an islander (`of`); a couple's advice to a friend
// ("parents-advice", one opening line); and the families' visit. Same facts as
// pm/talk/debrief.js, arcs.js and families: {c} is who the night was about.
const R = (...turns) => ({ turns });
const W = (when, ...turns) => ({ when, turns });
const S = (stage, ...turns) => ({ stage, turns });

export const DEBRIEF_RECOUNT = {
  moves: {
    recount: [
      W({ of: 'miss' }, ['a', "{c}'s bed is still made. Nobody's touched it. I can't stop looking at it."], ['b', "It'll get easier."], ['a', "I don't want it to. Not yet."]),
      W({ of: 'miss' }, ['a', "{c} was the first person I spoke to in here. The very first. And now {c}'s gone, and I don't know who I'm going to talk to at breakfast."], ['b', "Me. You'll talk to me."]),
      W({ of: 'miss' }, ['a', "I knew it might be {c}. I knew it. It doesn't make it any better that I knew."], ['b', "Nothing makes it better. It just takes time."]),
      W({ of: 'next' }, ['a', "Look at who's left. Look at who's coupled up. And then look at me. I'm on the edge, and everyone can see it."], ['b', "You're not on the edge. You're in the middle of it."]),
      W({ of: 'next' }, ['a', "I can feel it coming. Every ceremony, it gets a bit closer. One more and it's me."], ['b', "Then make the next few days count. Don't sit and wait for it."]),
      W({ of: 'next' }, ['a', "I smiled the whole way through tonight. I don't think I'll smile through the next one."], ['b', "You don't know what the next one is yet."]),
      W({ of: 'blame' }, ['a', "I'm not going to scream at {c}. I'm just never going to forget it. That's worse."], ['b', "Sleep on it. It'll still be there in the morning."]),
      W({ of: 'blame' }, ['a', "{c} looked straight at me before saying that name. Straight at me. {c} knew what it would do."], ['b', "And what are you going to do?"], ['a', "Nothing tonight. Tomorrow's another story."]),
      W({ of: 'twisted-on' }, ['a', "I had a whole speech ready. For when {c} walked back in. I never got to use it."], ['b', "Use it on someone who deserves it."]),
      W({ of: 'twisted-on' }, ['a', "Every night, I told everyone {c} would come back on {c.posAdj} own. Every single night. I feel so stupid."], ['b', "You're not stupid. You were loyal."]),
      W({ of: 'twisted' }, ['a', "I don't regret it. I just wish I could have done it without hurting {c}. There wasn't a way."], ['b', "There never is."]),
      W({ of: 'twisted' }, ['a', "{c} wouldn't look at me. Not once, the whole night. I deserve that, I know I do."], ['b', "Give it a day. Then talk."]),
      W({ of: 'robbed' }, ['a', "I stood there and watched {c} take my partner. In front of everyone. I didn't even get a say."], ['b', "Nobody gets a say at a recoupling. That's the cruel bit."]),
      W({ of: 'robbed' }, ['a', "I'm angrier with myself than with {c}. I should have seen it coming."], ['b', "Nobody saw it coming. Not even me."]),
      W({ of: 'stole', taken: true }, ['a', "I've got who I wanted. So why do I feel sick?"], ['b', "Because you've got a heart. That's a good thing."]),
      W({ of: 'stole', taken: true }, ['a', "Tomorrow is going to be awful. {c} is going to be awful. And I'll have earned it."], ['b', "Then face it. Don't hide from it."]),
      W({ of: 'eyeing', taken: true }, ['a', "{c} walked in and {pa} sat up straighter. I saw it. Everybody saw it."], ['b', "And then {pa} sat back down next to you."], ['a', "For now."]),
      W({ of: 'bomb-threat', taken: true }, ['a', "{c} came in, looked around, and looked straight at {pa}. I'm not imagining it."], ['b', "You're not. But {pa} didn't look back. Not really."]),
      W({ of: 'bomb-fancy', taken: false }, ['a', "Okay. I'm just going to say it. {c}. Did you see? I need a chat with {c} tomorrow. First thing."], ['b', "You'll have to queue."]),
      W({ of: 'bomb-fancy', taken: true }, ['a', "I'm not saying anything's going to happen. I'm just saying {c} is very, very easy to look at."], ['b', "Careful."]),
      W({ of: 'picked', taken: true, chose: true }, ['a', "I stood up and said {pa}'s name, and {pa} smiled before I'd even finished. Best moment in here, easily."], ['b', "You two are sickening. In a good way."]),
      W({ of: 'picked', taken: true, chose: false }, ['a', "I didn't think {pa} would pick me. I really didn't. And then {pa} did."], ['b', "I told you."]),
      W({ of: 'meh', taken: true }, ['a', "{pa} is lovely. I keep saying that. I don't know why I have to keep saying it."], ['b', "Because you're trying to convince yourself."]),
      W({ of: 'meh', taken: true }, ['a', "It's fine. It's fine. It's just not what I wanted."], ['b', "Give it a few days. Or don't. But be honest with {pa}."]),
      W({ of: 'happy', taken: true }, ['a', "Night one, and I'm already this happy. Is that allowed?"], ['b', "Make the most of it."]),
      W({ of: 'unsure', taken: true }, ['a', "{pa} is nice. I just thought I'd feel more. Is that awful on the first night?"], ['b', "It's honest. Give it time."]),
    ],
  },
};

export const PARENTS_ADVICE_VOLUME = {
  moves: {
    ask: [
      S("{c} wanders over to where {a} and {b} are sitting, looking lost.", ['c', "You two always seem to know what you're doing. Can I borrow you for a minute?"]),
      S("{c} sits down cross-legged in front of {a} and {b}.", ['c', "I need advice, and I need it from people who actually make it work."]),
      S("{c} catches {a} and {b} on the swing seat.", ['c', "Can I interrupt? I've got a question only you two can answer."]),
      S("{c} hovers by {a} and {b} on the lawn until they look up.", ['c', "Have you got a minute? I'm a bit of a mess."]),
    ],
    advice: [
      W({ of: 'crush' }, ['c', "How do I tell someone I like them without making it weird?"], ['b', "You can't. It's always a bit weird. That's the fun bit."], ['a', "Just be honest. Weird and honest beats smooth and fake."]),
      W({ of: 'crush' }, ['c', "What if they don't feel the same?"], ['a', "Then you'll know, and you can stop wondering."], ['b', "And we'll be right here with snacks."]),
      W({ of: 'feud' }, ['c', "How do I make peace with someone who hates me?"], ['a', "Start small. Make them a tea. Ask how they slept."], ['b', "Nobody can stay angry at someone holding a tea."]),
      W({ of: 'feud' }, ['c', "Everyone's picking sides, and I'm tired of it."], ['b', "Then stop playing. Walk away from the next one."], ['a', "It's harder than it sounds. It's worth it."]),
      W({ of: 'heartbreak' }, ['c', "Every time I see them with someone else, it starts all over again."], ['b', "Then don't watch. Come and sit with us instead."], ['a', "You won't feel like this forever. I promise."]),
      W({ of: 'heartbreak' }, ['c', "Am I stupid for still caring?"], ['a', "No. You're human. It means it was real."], ['b', "And real things take a while to let go of."]),
      W({ of: 'general' }, ['c', "How do you two never seem to argue?"], ['a', "We argue all the time."], ['b', "We just make up quickly. That's the trick."]),
      W({ of: 'general' }, ['c', "What's the secret? You two make it look so easy."], ['b', "We talk. About everything. Even the boring stuff."], ['a', "Especially the boring stuff."]),
    ],
    land: [
      { turns: [], beat: "{c} gives them both a hug and wanders off, thinking." },
      { turns: [['c', "Thank you. Both of you."], ['a', "Any time."]] },
      { turns: [], beat: "{a} and {b} share a look as {c} walks away. They'll be talking about this later." },
    ],
  },
};

export const FAMILIES_VOLUME_2 = {
  moves: {
    talk: [
      W({ verdict: 'good' }, ['b', "Were they always this nice, or were they on their best behaviour?"], ['a', "That was them on their best behaviour. You've passed."]),
      W({ verdict: 'good' }, ['a', "They asked me to bring you home for dinner as soon as we're out."], ['b', "Really?"], ['a', "They've already picked the date."]),
      W({ verdict: 'good' }, ['b', "I was so nervous. I thought I'd say something stupid."], ['a', "You said everything right. They loved you."]),
      W({ verdict: 'bad' }, ['b', "They didn't like me, did they?"], ['a', "They don't know you yet. That's different."]),
      W({ verdict: 'bad' }, ['a', "They're protective. They've seen me hurt before."], ['b', "I'm not going to hurt you."], ['a', "I know. They don't, yet."]),
      W({ verdict: 'bad' }, ['b', "That was the longest ten minutes of my life."], ['a', "I'm sorry. They'll come round."]),
      W({ verdict: 'unsure' }, ['b', "I couldn't read them at all."], ['a', "Nobody can. Not even me."]),
      W({ verdict: 'unsure' }, ['a', "They want to see more of you. That's not a no."], ['b', "It's not a yes either."]),
      W({ verdict: 'unsure' }, ['b', "Did that go well? I genuinely can't tell."], ['a', "It went okay. Okay is good, with them."]),
    ],
    after: [
      W({ verdict: 'good' }, ['a', "I can't stop smiling. They loved you."], ['b', "They loved me. I can't believe it."]),
      W({ verdict: 'good' }, ['b', "Your family's amazing, you know."], ['a', "They said the same about you."]),
      W({ verdict: 'bad' }, ['a', "Whatever they think, I know what I think."], ['b', "And what's that?"], ['a', "That I'm staying right here, with you."]),
      W({ verdict: 'bad' }, ['b', "I'll win them over. I'm very winnable-over."], ['a', "That's not a word."], ['b', "It is now."]),
      W({ verdict: 'unsure' }, ['a', "They'll make their minds up on the outside. That's where it matters anyway."]),
      W({ verdict: 'unsure' }, ['b', "At least nobody cried."], ['a', "I nearly did."], ['b', "So did I."]),
    ],
  },
};
