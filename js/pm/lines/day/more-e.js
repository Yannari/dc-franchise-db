// pm/lines/day/more-e.js — the pools season 313 ran dry of in one episode.
// Data only; merged into whichever pool holds the kind (script.js).
//
//   ballot-reveal [a, b]   a votes to dump b's couple — every vote is read out
//                          now, up to ten a night, so the pool is sized for it
//   casa-return   [a]      of: stayed, choice: stick — waiting on the bench
//   loyalty       [a, b]   a is coupled and turns b's pull down
//   gossip        [a, b, c] a tells b something about c (`knows`)
//   lie-react     [a, b, c] of: hurt — c hears a red light about a
export const MORE_E = {
  'ballot-reveal': [
    { id: 'br3.01', turns: [['a', "I've thought about this all day. My vote is for {b}'s couple to leave."]] },
    { id: 'br3.02', stage: '{a} stands up and takes a breath.', turns: [['a', "I don't think {b}'s couple is as strong as the other one. So my vote goes to {b}."]] },
    { id: 'br3.03', turns: [['a', "This isn't personal. I'm voting for {b} to go."]], beat: '{b} nods, but does not look up.' },
    { id: 'br3.04', turns: [['a', "I've had my best chats in here with the other couple. I'm sorry, {b}."]] },
    { id: 'br3.05', turns: [['a', "I just don't see the spark with {b}'s couple. That's my vote."]] },
    { id: 'br3.06', stage: '{a} looks at both couples before speaking.', turns: [['a', "The couple I want to stay in the villa is the other one. So, {b}, I'm sorry."]] },
    { id: 'br3.07', turns: [['a', "I'm going with my gut, and my gut says {b}."]], beat: 'There is a sharp intake of breath from the benches.' },
    { id: 'br3.08', turns: [['a', "I think {b} is a great person. I just don't think {b.posAdj} couple is going anywhere."]] },
    { id: 'br3.09', turns: [['a', "I really don't want to do this. It's {b}."]], beat: '{a} sits down fast, like it hurt to say.' },
    { id: 'br3.10', stage: '{a} stands, and the benches go quiet.', turns: [['a', "I've watched both couples, and only one of them looks like it's lasting. It isn't {b}'s."]] },
    { id: 'br3.11', turns: [['a', "I'm voting with my head, not my heart. {b}."]] },
    { id: 'br3.12', turns: [['a', "The other couple have been there for me. I have to vote for {b} to leave."]], beat: '{b} gives {a} a small, tight smile.' },
    { id: 'br3.13', turns: [['a', "I'm sorry. My vote is {b}."]], beat: 'Nobody on the benches moves.' },
    { id: 'br3.14', turns: [['a', "It's the hardest vote I've had to make in here. {b}."]] },
    { id: 'br3.15', stage: '{a} glances at {b} before speaking, and then away.', turns: [['a', "{b}, I love you, but I think your couple has run its course. That's my vote."]] },
    { id: 'br3.16', turns: [['a', "I want the couple with the most real connection to stay. For me, that isn't {b}'s."]] },
  ],
  'casa-return': [
    { id: 'cs.s.05', when: { of: 'stayed', choice: 'stick' }, stage: "{a} is alone on the bench, a hand resting on the empty cushion beside {a.obj}.", turns: [['a', "I just want to see that face walk in."]] },
    { id: 'cs.s.06', when: { of: 'stayed', choice: 'stick' }, turns: [['a', "Everyone kept telling me to twist. I didn't."]], beat: '{a} does not take {a.posAdj} eyes off the steps.' },
    { id: 'cs.s.07', when: { of: 'stayed', choice: 'stick' }, stage: '{a} sits on the bench, bouncing one knee.', turns: [['a', "If they come back with someone, I'll cope. I think I'll cope."]] },
    { id: 'cs.s.08', when: { of: 'stayed', choice: 'stick' }, turns: [['a', "I've never wanted to see someone walk through a door so much in my life."]] },
    { id: 'cs.s.09', when: { of: 'stayed', choice: 'stick' }, stage: 'The bench, and {a} alone on it, very still.', turns: [['a', "Whatever they did over there, I know what I did here. I stayed."]] },
    { id: 'cs.s.10', when: { of: 'stayed', choice: 'stick' }, turns: [['a', "I've counted every single day of it."]], beat: '{a} laughs, and it wobbles.' },
  ],
  loyalty: [
    { id: 'ly3.01', when: { justMet: true }, turns: [['b', "Can I grab you?"], ['a', "I'm really flattered. But I'm happy where I am, honestly."], ['b', "Already?"], ['a', "Already."]] },
    { id: 'ly3.02', when: { justMet: true }, turns: [['b', "Do you want to have a chat?"], ['a', "Maybe with everyone. Not on our own, not tonight."]], beat: '{b} laughs it off, and does not ask again.' },
    { id: 'ly3.03', when: { justMet: true }, turns: [['b', "You're the first person I wanted to talk to."], ['a', "That's really sweet. But I've got my eye on someone already."]] },
    { id: 'ly3.04', when: { justMet: true }, stage: '{b} catches {a} on the terrace.', turns: [['b', "Two minutes?"], ['a', "Honestly, I'd rather not. I don't want to give anyone the wrong idea."]] },
    { id: 'ly3.05', turns: [['b', "Can I borrow you for a bit?"], ['a', "Not like that, no. Sorry."], ['b', "That's fair."]] },
    { id: 'ly3.06', turns: [['b', "Come on, just a chat."], ['a', "There's no such thing as just a chat in here. You know that."]] },
    { id: 'ly3.07', stage: '{a} glances over at {a.posAdj} partner before answering.', turns: [['a', "I'm going to say no. I hope that's okay."], ['b', "It's more than okay. I respect it."]] },
    { id: 'ly3.08', turns: [['b', "Are you not even a little bit curious?"], ['a', "No. And I'm not being rude. I'm just not."]] },
  ],
  gossip: [
    { id: 'gs3.01', when: { knows: true }, turns: [['a', "I don't know if I should say this."], ['b', "You've started now."], ['a', "It's about {c}. I think you need to hear it from someone."]] },
    { id: 'gs3.02', when: { knows: true }, stage: '{a} checks nobody is in earshot.', turns: [['a', "Have you spoken to {c} today?"], ['b', "A bit. Why?"], ['a', "Because I think there's something {c} hasn't told you."]] },
    { id: 'gs3.03', when: { knows: true }, turns: [['a', "I've been sitting on this all day and I can't anymore."], ['b', "What is it?"], ['a', "It's {c}."]], beat: "{b}'s face drops before {a} has said anything else." },
    { id: 'gs3.04', when: { knows: true }, turns: [['b', "Why are you being weird?"], ['a', "I'm not being weird. I'm being a good friend. There's something about {c} you should know."]] },
    { id: 'gs3.05', when: { knows: true }, stage: '{a} sits down next to {b}, and does not smile.', turns: [['a', "Can I be honest with you about something? You're not going to like it."], ['b', "Is it about {c}?"], ['a', "It's about {c}."]] },
  ],
  'lie-react': [
    { id: 'lx.h.05', when: { of: 'hurt' }, turns: [['c', "Say that again."], ['a', "It's wrong. It has to be."], ['c', "It doesn't have to be anything."]] },
    { id: 'lx.h.06', when: { of: 'hurt' }, turns: [['a', "Please don't look at me like that."], ['c', "How am I supposed to look at you?"]], beat: 'The whole villa is staring at the floor.' },
    { id: 'lx.h.07', when: { of: 'hurt' }, turns: [['c', "I asked you. I asked you straight."]], beat: '{a} opens {a.posAdj} mouth, and nothing comes out.' },
  ],
};
