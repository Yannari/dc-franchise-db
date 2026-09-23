// pm/lines/secrets.js — the ways a secret is made, and the second chance
// after it comes out (pm/events.js pull/bed-share/vent, pm/exes.js). Data only.
//   pull (kissed)      [a, b]     a pulled b and it went further: they kiss
//   bed-share          [a, b]     Casa week: coupled a shares a bed with new b.
//                                 `of`: bed · kiss
//   vent               [a, b]     a moans about their partner ({pa}) to friend b
//   apology            [a, b]     a, who did it, says sorry to b. `of`: sincere · half
//   reunite            [a, b]     b takes a back. `of`: warm · mugged (the public
//                                 can't stand a)
//   apology-rejected   [a, b]     b says no. `of`: not-yet · final
//   photos (kiss/bed)  [a, b]     a is looking at a photo of b — kissing, or in a bed
export const SECRET_LINES = {
  pull: [
    { id: 'pk.01', when: { kissed: true }, turns: [['a', "Can I tell you something?"], ['b', "Go on."], ['a', "I've wanted to do this all day."]], beat: 'They kiss, and neither of them checks who is watching.' },
    { id: 'pk.02', when: { kissed: true }, stage: 'Round the back of the villa, where the cameras are fewer.', turns: [['b', "We shouldn't."], ['a', "I know."]], beat: 'They kiss anyway.' },
    { id: 'pk.03', when: { kissed: true }, turns: [['a', "Nobody's around."], ['b', "Somebody's always around."]], beat: '{a} kisses {b}, quickly, and they both laugh like they have got away with something.' },
    { id: 'pk.04', when: { kissed: true }, stage: 'On the daybeds, late, once the others have gone in.', turns: [['b', "This is a bad idea."], ['a', "Then stop me."]], beat: '{b} does not stop {a.obj}.' },
    { id: 'pk.05', when: { kissed: true }, turns: [['a', "I can't stop thinking about you."], ['b', "Then stop talking."]], beat: 'The kiss lasts a lot longer than it should.' },
    { id: 'pk.06', when: { kissed: true }, stage: 'In the kitchen, while everyone else is at the pool.', turns: [['b', "What are we doing?"], ['a', "I don't know. I don't want to stop."]], beat: 'They kiss, and jump apart at a noise from the garden.' },
    { id: 'pk.07', when: { kissed: true }, turns: [['a', "That was a mistake."], ['b', "Was it?"], ['a', "…No."]], beat: 'They kiss again.' },
    { id: 'pk.08', when: { kissed: true }, stage: 'By the hideaway door.', turns: [['b', "If anyone finds out—"], ['a', "Nobody's going to find out."]], beat: 'Somebody on the terrace sees everything.' },
  ],
  'bed-share': [
    { id: 'bs.b.01', when: { of: 'bed' }, stage: 'Casa Amor, lights out. {a} and {b} end up in the same bed.', turns: [['b', "Is this okay?"], ['a', "It's just sleeping."]], beat: 'Neither of them sleeps for a while.' },
    { id: 'bs.b.02', when: { of: 'bed' }, stage: 'The bedroom, after the others have settled.', turns: [['a', "I'll stay on my side."], ['b', "You don't have to."]], beat: '{a} does not stay on {a.posAdj} side.' },
    { id: 'bs.b.03', when: { of: 'bed' }, stage: '{a} climbs into bed next to {b}.', turns: [['b', "What would your partner say?"], ['a', "They're not here."]] },
    { id: 'bs.b.04', when: { of: 'bed' }, stage: 'Casa Amor, late. {a} is in {b.posAdj} bed, talking in whispers.', turns: [['a', "I'm not doing anything wrong."], ['b', "Then why are you whispering?"]] },
    { id: 'bs.b.05', when: { of: 'bed' }, stage: 'The lights go out, and {a} and {b} are still talking under the covers.', turns: [['b', "I really like you, you know."], ['a', "Don't say that. It makes this harder."]] },
    { id: 'bs.k.01', when: { of: 'kiss' }, stage: 'Casa Amor, the lights out, {a} and {b} in the same bed.', turns: [['b', "We shouldn't."], ['a', "I know."]], beat: 'They kiss. Somebody in the next bed pretends to be asleep.' },
    { id: 'bs.k.02', when: { of: 'kiss' }, stage: 'Under the covers, late.', turns: [['a', "I've been wanting to do this since you walked in."]], beat: 'The kiss goes on long enough that the night-vision camera zooms in.' },
    { id: 'bs.k.03', when: { of: 'kiss' }, stage: '{a} and {b} share a bed, and a kiss, and a whispered promise nobody will know.', turns: [['b', "What happens at Casa…"], ['a', "Stays at Casa."]] },
    { id: 'bs.k.04', when: { of: 'kiss' }, stage: 'Casa Amor, the middle of the night.', turns: [['a', "I've got someone back at the villa."], ['b', "I know."]], beat: 'They kiss anyway.' },
  ],
  vent: [
    { id: 'vt.01', when: { taken: true }, turns: [['a', "Honestly? {pa} is doing my head in."], ['b', "Why? What's happened?"], ['a', "Nothing. That's the problem. It's the same chat every day."]] },
    { id: 'vt.02', when: { taken: true }, turns: [['a', "Can I say something and it stays between us?"], ['b', "Of course."], ['a', "I'm not sure {pa} is right for me."], ['b', "Have you told {pa} that?"], ['a', "God, no."]] },
    { id: 'vt.03', when: { taken: true }, turns: [['a', "{pa} is so needy. Every five minutes, where are you, what are you doing."], ['b', "That's a lot."], ['a', "It's too much."]] },
    { id: 'vt.04', when: { taken: true }, turns: [['b', "How are things with {pa}?"], ['a', "Fine. Boring. Fine."], ['b', "Boring?"], ['a', "Don't repeat that."]] },
    { id: 'vt.05', when: { taken: true }, turns: [['a', "I don't think {pa} actually listens to a word I say."], ['b', "Have you said that to {pa}?"], ['a', "What's the point?"]] },
    { id: 'vt.06', when: { taken: true }, turns: [['a', "If I'm honest, I'd be happier single than with {pa}."], ['b', "Wow. Okay."], ['a', "I didn't say that."], ['b', "You definitely said that."]] },
    { id: 'vt.07', when: { taken: true }, turns: [['a', "Is it bad that I get excited when {pa} goes to the gym?"], ['b', "Yes. Very bad."]], beat: 'They both laugh. {b} files it away.' },
    { id: 'vt.08', when: { taken: true }, turns: [['a', "{pa} is lovely. I'm just not attracted to {pa}."], ['b', "At all?"], ['a', "Not really. Please don't say anything."]] },
  ],
  apology: [
    { id: 'ap.s.01', when: { of: 'sincere' }, stage: '{a} finds {b} alone on the terrace.', turns: [
      ['a', "Can I talk to you? You don't have to say anything."], ['b', "Go on."], ['a', "I was wrong. There's no excuse, and I'm not going to make one."],
      ['b', "Then why are you here?"], ['a', "Because I haven't stopped thinking about you. And because you deserved better."]] },
    { id: 'ap.s.02', when: { of: 'sincere' }, turns: [
      ['a', "I've been trying to work out how to say this all day."], ['b', "Just say it."], ['a', "I'm sorry. I hurt you, and I'd take it back if I could."],
      ['b', "But you can't."], ['a', "No. But I can be better. If you let me."]] },
    { id: 'ap.s.03', when: { of: 'sincere' }, stage: 'The daybeds, late.', turns: [
      ['a', "I miss you."], ['b', "You should have thought about that."], ['a', "I know. I did it, and I lost you, and it's the worst thing I've done in here."],
      ['b', "Why should I believe you?"], ['a', "You shouldn't, yet. Let me show you."]] },
    { id: 'ap.s.04', when: { of: 'sincere' }, turns: [
      ['a', "Can I have two minutes?"], ['b', "You've got one."], ['a', "I'm sorry. Properly sorry. Not sorry I got caught. Sorry I did it."],
      ['b', "…That's the first honest thing you've said all week."]] },
    { id: 'ap.h.01', when: { of: 'half' }, turns: [
      ['a', "Look, I'm sorry if you were upset."], ['b', "If I was upset?"], ['a', "You know what I mean."], ['b', "I know exactly what you mean."]] },
    { id: 'ap.h.02', when: { of: 'half' }, turns: [
      ['a', "Can we just move on? It wasn't that deep."], ['b', "It was deep to me."], ['a', "I said sorry, didn't I?"]] },
    { id: 'ap.h.03', when: { of: 'half' }, turns: [
      ['a', "I'm sorry. But you were being a bit off with me too."], ['b', "So it's my fault now?"], ['a', "That's not what I said."], ['b', "It's exactly what you said."]] },
  ],
  reunite: [
    { id: 'ru.w.01', when: { of: 'warm' }, turns: [['b', "One chance. That's it. One."], ['a', "That's all I need."]], beat: '{a} pulls {b} into a hug, and the villa, watching from the kitchen, cheers.' },
    { id: 'ru.w.02', when: { of: 'warm' }, turns: [['b', "I've missed you, you idiot."], ['a', "I've missed you more."]], beat: 'They kiss by the fire pit, and somebody wolf-whistles.' },
    { id: 'ru.w.03', when: { of: 'warm' }, turns: [['b', "If you ever do that again—"], ['a', "I won't. I promise you I won't."], ['b', "Okay. Okay. Come here."]] },
    { id: 'ru.w.04', when: { of: 'warm' }, turns: [['b', "I can't believe I'm doing this."], ['a', "Doing what?"], ['b', "Giving you another chance."]], beat: '{a} is grinning so hard it looks painful.' },
    { id: 'ru.m.01', when: { of: 'mugged' }, turns: [['b', "Fine. I'll give you another chance."], ['a', "You won't regret it."]], beat: 'Two of the islanders exchange a look. Nobody in the kitchen cheers.' },
    { id: 'ru.m.02', when: { of: 'mugged' }, turns: [['b', "I know what everyone's going to say."], ['a', "Who cares what they say?"], ['b', "I do, a bit."]], beat: '{b} takes {a.posAdj} hand anyway.' },
    { id: 'ru.m.03', when: { of: 'mugged' }, turns: [['b', "Everyone thinks I'm mad for this."], ['a', "Are you?"], ['b', "Probably. I'm doing it anyway."]] },
  ],
  'apology-rejected': [
    { id: 'aj.n.01', when: { of: 'not-yet' }, turns: [['b', "I hear you. I'm just not there."], ['a', "Will you ever be?"], ['b', "I don't know. Ask me another day."]] },
    { id: 'aj.n.02', when: { of: 'not-yet' }, turns: [['b', "Sorry isn't enough. Not yet."], ['a', "What is?"], ['b', "Time. And you not doing it again."]] },
    { id: 'aj.n.03', when: { of: 'not-yet' }, turns: [['b', "I want to believe you."], ['a', "Then believe me."], ['b', "It's not a switch. I can't just turn it back on."]] },
    { id: 'aj.f.01', when: { of: 'final' }, turns: [['b', "Stop. Please. I've said no, and I mean it."], ['a', "I'll stop."]], beat: '{a} walks away, and does not look back.' },
    { id: 'aj.f.02', when: { of: 'final' }, turns: [['b', "We're done. You need to let it go."], ['a', "Okay. I'm sorry. For all of it."]] },
    { id: 'aj.f.03', when: { of: 'final' }, turns: [['b', "I don't want an apology. I want you to leave me alone."]], beat: '{a} nods, and goes to the other end of the villa.' },
  ],
  photos: [
    { id: 'ph.k.01', when: { of: 'kiss' }, stage: '{a} turns the photo over. It is {b}, mid-kiss.', turns: [['a', "You're kissing them."], ['b', "It was one kiss."], ['a', "One is enough."]], beat: 'The photo falls onto the bench.' },
    { id: 'ph.k.02', when: { of: 'kiss' }, stage: 'The photo is of {b} kissing somebody new.', turns: [['a', "You walked back in like nothing happened."], ['b', "Nothing serious did happen."]], beat: '{a} laughs, and it sounds like crying.' },
    { id: 'ph.k.03', when: { of: 'kiss' }, stage: '{a} holds up the photo: {b}, kissing somebody else, eyes closed.', turns: [['a', "You look like you're enjoying yourself."]], beat: 'Nobody at the fire pit says a word.' },
    { id: 'ph.b.01', when: { of: 'bed' }, stage: 'The photo: {b} in a Casa bed, next to somebody new.', turns: [['a', "You shared a bed with them."], ['b', "We were just sleeping."], ['a', "Then why is this the first I'm hearing of it?"]] },
    { id: 'ph.b.02', when: { of: 'bed' }, stage: '{a} stares at the photo of {b} under the covers with a new arrival.', turns: [['a', "Every night?"], ['b', "Not every night."], ['a', "That's not a no."]] },
    { id: 'ph.b.03', when: { of: 'bed' }, stage: 'A photo of {b} in bed at Casa Amor, not alone.', turns: [['a', "I slept on my own every night that week."]], beat: '{b} cannot look up from the floor.' },
  ],
};

const K = (kind, more = {}) => ({ kind, ...more });
export const SECRET_HUT = {
  honest: [
    { id: 'hut.sc.h1', when: K('apology', { of: 'sincere', role: 0 }), turns: [['a', "I meant every word. I just don't know if it's enough."]] },
    { id: 'hut.sc.h2', when: K('apology', { role: 1 }), turns: [['a', "Part of me wants to forgive them. That's the part I don't trust."]] },
    { id: 'hut.sc.h3', when: K('reunite', { role: 1 }), turns: [['a', "People will say I'm mad. Maybe I am. I still love them."]] },
    { id: 'hut.sc.h4', when: K('reunite', { role: 0 }), turns: [['a', "I've been given a second chance. I'm not wasting it."]] },
    { id: 'hut.sc.h5', when: K('apology-rejected', { role: 1 }), turns: [['a', "I'm not a pushover. Sorry doesn't fix it."]] },
    { id: 'hut.sc.h6', when: K('apology-rejected', { role: 0 }), turns: [['a', "I messed it up. I know I did. I just have to live with it."]] },
  ],
  'two-faced': [
    { id: 'hut.sc.t1', when: K('pull', { kissed: true, role: 0 }), turns: [['a', "Nobody saw. As long as nobody saw, it didn't happen."]] },
    { id: 'hut.sc.t2', when: K('bed-share', { role: 0 }), turns: [['a', "It's Casa. Everyone shares a bed at Casa. It doesn't mean anything."]] },
    { id: 'hut.sc.t3', when: K('bed-share', { of: 'kiss', role: 0 }), turns: [['a', "One kiss. At Casa. That stays at Casa."]] },
    { id: 'hut.sc.t4', when: K('vent', { role: 0 }), turns: [['a', "I'd never say that to my partner's face. But it's true."]] },
    { id: 'hut.sc.t5', when: K('apology', { of: 'half', role: 0 }), turns: [['a', "I said sorry. What else do they want from me?"]] },
  ],
};
