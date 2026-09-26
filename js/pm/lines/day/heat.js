// pm/lines/day/heat.js — how hot a pull runs (events.js pull `heat`). Data only.
//
//   pull [a, b]  a pulled b for a chat. `heat`:
//     light      neither of them is much into it: friendly, a bit of flattery
//     one-sided  a is far keener than b, and b is humouring it
//     flirty     a real spark on both sides, kept playful (untagged: they join
//                the rest of the pull pool, so the middle heat keeps its variety)
//     steamy     both of them are into it, and everybody can see it
//
// Whole conversations (user: "remember full conversation"): an opening, a
// turn, and where it lands — never two lines and a beat.
export const HEAT_LINES = {
  pull: [
    // ── light: friendly, not much more ──
    { id: 'ht.l1', when: { heat: 'light' }, turns: [
      ['a', "Can I grab you for a minute?"], ['b', "Of course. What's up?"],
      ['a', "Nothing, really. I just realised we haven't spoken properly since you got here."], ['b', "We haven't, have we?"],
      ['a', "So. Tell me something about you."], ['b', "I'm a terrible dancer. That's the main thing."],
      ['a', "Everyone in here is a terrible dancer."], ['b', "Then I'll fit right in."]],
      beat: 'It is a nice chat. It is not much more than that.' },
    { id: 'ht.l2', when: { heat: 'light' }, stage: '{a} and {b} sit on the edge of the pool, feet in the water.', turns: [
      ['a', "You're really easy to talk to, you know."], ['b', "So are you. I think everyone's so nervous in here."],
      ['a', "What do you miss most from home?"], ['b', "My own bed. Is that boring?"],
      ['a', "No, that's the right answer."], ['b', "What about you?"], ['a', "Toast. Really burnt toast."],
      ['b', "Of all the things."]],
      beat: 'They talk about home until someone calls them for dinner.' },
    { id: 'ht.l3', when: { heat: 'light' }, turns: [
      ['a', "I like your outfit, by the way."], ['b', "Thank you! I nearly didn't wear it."],
      ['a', "Why not?"], ['b', "I thought it was a bit much."], ['a', "It's the right amount of much."],
      ['b', "I'm taking that as a compliment."], ['a', "It was one."]] },
    { id: 'ht.l4', when: { heat: 'light' }, turns: [
      ['b', "Is this a chat chat, or just a chat?"], ['a', "Just a chat. I promise."],
      ['b', "Okay. Good. I wasn't sure."], ['a', "I just wanted to get to know you a bit."],
      ['b', "Go on, then. Ask me something."], ['a', "Best holiday you've ever been on?"], ['b', "This one, so far."]],
      beat: 'Both of them seem relieved it is only a chat.' },
    { id: 'ht.l5', when: { heat: 'light' }, stage: '{a} brings {b} a drink on the terrace.', turns: [
      ['a', "Peace offering. I don't think we've really spoken."], ['b', "We haven't. Hi."],
      ['a', "Hi. How are you finding it?"], ['b', "Honestly? Overwhelming. Everyone's so full on."],
      ['a', "You get used to it."], ['b', "Did you?"], ['a', "No. But I'm pretending really well."]],
      beat: '{b} laughs, and they clink glasses.' },
    { id: 'ht.l6', when: { heat: 'light' }, turns: [
      ['a', "Can I ask you something random?"], ['b', "Always."],
      ['a', "Who in here do you think is the funniest?"], ['b', "Honestly? Probably you."],
      ['a', "I'll take it."], ['b', "It's not a high bar."], ['a', "I'll still take it."]] },
    { id: 'ht.l7', when: { heat: 'light' }, stage: '{a} sits down next to {b} on the swing seat.', turns: [
      ['b', "Hello, stranger."], ['a', "I know, I've been all over the place today."],
      ['b', "Good all over the place, or bad?"], ['a', "Bit of both. What about you?"],
      ['b', "Quiet day. I've been sunbathing and thinking."], ['a', "Thinking about what?"],
      ['b', "Nothing interesting. That's the problem."]],
      beat: 'They swing for a bit in easy silence.' },
    { id: 'ht.l8', when: { heat: 'light' }, turns: [
      ['a', "I feel like we'd be really good friends on the outside."], ['b', "Friends?"],
      ['a', "Is that bad?"], ['b', "No! No, I like that. I think you're right."],
      ['a', "Good. Because I need someone to tell me when I'm being an idiot in here."],
      ['b', "Oh, I can definitely do that."]] },

    // ── one-sided: a is keen, b is being polite ──
    { id: 'ht.o1', when: { heat: 'one-sided' }, turns: [
      ['a', "Can I be honest with you?"], ['b', "Always."],
      ['a', "I can't stop thinking about you."], ['b', "Oh. That's… nice."],
      ['a', "Nice?"], ['b', "It's really nice. I'm just not sure where my head is right now."],
      ['a', "That's fine. I'll wait."], ['b', "You don't have to wait for me."]],
      beat: '{a} is hanging on every word. {b} keeps glancing over at the others.' },
    { id: 'ht.o2', when: { heat: 'one-sided' }, stage: '{a} has saved {b} the seat right next to them.', turns: [
      ['a', "So, what's your type? Asking for a friend."], ['b', "I'll let you know when I meet them."],
      ['a', "What if you already have?"], ['b', "Then I'm sure I'll work it out."],
      ['a', "I could help you work it out."], ['b', "I think I'll manage, thanks."]],
      beat: '{a} laughs a bit too hard. {b} does not.' },
    { id: 'ht.o3', when: { heat: 'one-sided' }, turns: [
      ['a', "Do you ever think about us?"], ['b', "Us?"],
      ['a', "You know. Me and you."], ['b', "I… haven't really, if I'm honest."],
      ['a', "Not even a little bit?"], ['b', "I think you're great. I just don't see it like that."],
      ['a', "Yet."], ['b', "Maybe don't say 'yet'."]] },
    { id: 'ht.o4', when: { heat: 'one-sided' }, turns: [
      ['a', "I think we'd be really good together."], ['b', "You're lovely. You really are."],
      ['a', "I feel like there's a 'but' coming."], ['b', "There's no 'but'. I just want to take things slow."],
      ['a', "Slow is good. I can do slow."], ['b', "Really slow."]],
      beat: '{a} looks disappointed, and tries not to show it.' },
    { id: 'ht.o5', when: { heat: 'one-sided' }, stage: '{a} is doing all the talking.', turns: [
      ['a', "…and my friends always say I'm the one who never gives up, so I'm not going to."],
      ['b', "Sorry, give up on what?"], ['a', "On you. On this."],
      ['b', "Right. Okay. I think I zoned out for a second there."],
      ['a', "That's fine. I'll say it all again."], ['b', "You really don't need to."]] },
    { id: 'ht.o6', when: { heat: 'one-sided' }, turns: [
      ['a', "You looked amazing at dinner."], ['b', "Thank you."],
      ['a', "I'm not just saying that. I mean it."], ['b', "I know. Thank you."],
      ['a', "Do you want to sit with me later?"], ['b', "Maybe. We'll see how the night goes."]],
      beat: '{a} is smiling. {b} is already looking at someone else.' },
    { id: 'ht.o7', when: { heat: 'one-sided' }, stage: '{a} catches {b} on the way to the kitchen.', turns: [
      ['a', "Two minutes. That's all I'm asking."], ['b', "Go on, then."],
      ['a', "I really like you. Like, really."], ['b', "I'm flattered. Honestly."],
      ['a', "Flattered is good, right?"], ['b', "Flattered is… flattered."],
      ['a', "I'll take it."]],
      beat: '{b} is already walking back towards the others.' },
    { id: 'ht.o8', when: { heat: 'one-sided' }, turns: [
      ['a', "Have you noticed I keep ending up next to you?"], ['b', "I had noticed, yes."],
      ['a', "It's not an accident."], ['b', "I didn't think it was."],
      ['a', "So what do you think?"], ['b', "I think you're very persistent."]] },

    // ── flirty: a real spark, kept playful ──
    { id: 'ht.f1', turns: [
      ['a', "Can I borrow you?"], ['b', "Depends what for."],
      ['a', "A chat. Maybe a bit more than a chat."], ['b', "Oh, a bit more?"],
      ['a', "I'm just saying, I'm open to it."], ['b', "You're very sure of yourself."],
      ['a', "Is it working?"], ['b', "…A little bit."]],
      beat: 'They are both smiling now, and neither of them is hiding it.' },
    { id: 'ht.f2', stage: '{a} and {b} end up on the daybeds, knees touching.', turns: [
      ['b', "You've been looking at me all day."], ['a', "Have I?"],
      ['b', "You know you have."], ['a', "Maybe you've been looking at me looking at you."],
      ['b', "That's a very clever way of getting out of it."], ['a', "I thought so."]] },
    { id: 'ht.f3', turns: [
      ['a', "Be honest. What did you think of me when I walked in?"], ['b', "Honestly?"],
      ['a', "Honestly."], ['b', "I thought, oh no, they're going to be trouble."],
      ['a', "And?"], ['b', "And I was right."]],
      beat: '{a} laughs, and moves a little closer.' },
    { id: 'ht.f4', turns: [
      ['b', "Why did you pull me?"], ['a', "Because I wanted to see if you'd say yes."],
      ['b', "And I did."], ['a', "And you did."],
      ['b', "So now what?"], ['a', "Now we find out if I'm as charming as I think I am."],
      ['b', "Bold of you."]] },
    { id: 'ht.f5', stage: '{a} hands {b} half of an ice lolly.', turns: [
      ['b', "Are you sharing your ice lolly with me?"], ['a', "Don't make it weird."],
      ['b', "It's a bit romantic, though."], ['a', "It's melting, it's not romantic."],
      ['b', "It's a little bit romantic."], ['a', "Fine. It's a little bit romantic."]] },
    { id: 'ht.f6', turns: [
      ['a', "I've got a confession."], ['b', "Go on."],
      ['a', "I've been trying to get you on your own all day."], ['b', "I knew it."],
      ['a', "You did not know it."], ['b', "I had a strong feeling."],
      ['a', "Is it working?"], ['b', "Ask me again in five minutes."]],
      beat: 'They are both laughing when someone walks past.' },
    { id: 'ht.f7', stage: 'The terrace, just the two of them.', turns: [
      ['b', "What would we be doing right now, if we were on the outside?"], ['a', "Dinner. Somewhere nice."],
      ['b', "You'd pay?"], ['a', "I'd offer to pay."], ['b', "And then?"],
      ['a', "And then you'd insist, and I'd let you."], ['b', "Charming."]] },
    { id: 'ht.f8', turns: [
      ['a', "Rate me out of ten. Go."], ['b', "I'm not doing that."],
      ['a', "Go on."], ['b', "Fine. Seven."], ['a', "Seven?"],
      ['b', "Eight when you're not fishing for compliments."], ['a', "Then I'll stop fishing."]] },

    // ── steamy: both of them, in front of everyone ──
    { id: 'ht.s1', when: { heat: 'steamy' }, stage: '{a} and {b} on the daybed, much too close.', turns: [
      ['a', "If we weren't on camera right now…"], ['b', "Don't finish that sentence."],
      ['a', "Why not?"], ['b', "Because I'd let you."],
      ['a', "You'd let me what?"], ['b', "You know what."]],
      beat: 'Half the terrace has stopped pretending not to watch.' },
    { id: 'ht.s2', when: { heat: 'steamy' }, turns: [
      ['b', "Stop looking at me like that."], ['a', "Like what?"],
      ['b', "You know exactly like what."], ['a', "I can't help it."],
      ['b', "Try."], ['a', "I'm trying. It isn't working."]],
      beat: 'Neither of them moves away.' },
    { id: 'ht.s3', when: { heat: 'steamy' }, stage: "{a}'s hand is resting on {b}'s knee, and nobody is talking about the weather.", turns: [
      ['a', "There's something here, isn't there?"], ['b', "There's been something here since I walked in."],
      ['a', "So why haven't we done anything about it?"], ['b', "Because it's complicated."],
      ['a', "It doesn't feel complicated right now."], ['b', "No. It doesn't."]] },
    { id: 'ht.s4', when: { heat: 'steamy' }, stage: '{a} and {b} are whispering, foreheads almost touching.', turns: [
      ['b', "We should go back to the others."], ['a', "In a minute."],
      ['b', "You said that ten minutes ago."], ['a', "And you're still here."],
      ['b', "That's not the point."], ['a', "It's exactly the point."]] },
    { id: 'ht.s5', when: { heat: 'steamy' }, turns: [
      ['a', "I want to kiss you so badly right now."], ['b', "Then why are you still talking?"],
      ['a', "Because everyone's watching."], ['b', "Since when did you care who was watching?"]],
      beat: "Somebody coughs loudly from the kitchen, and the moment's gone. For now." },
    { id: 'ht.s6', when: { heat: 'steamy' }, stage: 'The hot tub, late, with the others on the other side of the garden.', turns: [
      ['b', "This is dangerous."], ['a', "What is?"],
      ['b', "You. This. Us being alone."], ['a', "We're not alone. There are cameras everywhere."],
      ['b', "That doesn't make it any less dangerous."], ['a', "No. It really doesn't."]] },
    { id: 'ht.s7', when: { heat: 'steamy' }, turns: [
      ['a', "Tell me to walk away."], ['b', "Why would I do that?"],
      ['a', "Because if you don't, I'm not going to."], ['b', "Then don't."],
      ['a', "You're making this very hard."], ['b', "Good."]],
      beat: 'The whole terrace can feel it from where they are sitting.' },
    { id: 'ht.s8', when: { heat: 'steamy' }, stage: "{b} is fixing {a}'s collar, and taking a very long time about it.", turns: [
      ['a', "It's fine. It doesn't need fixing."], ['b', "It really does."],
      ['a', "You're not even fixing it."], ['b', "I know."],
      ['a', "Then what are you doing?"], ['b', "Standing close to you."]] },
  ],
};
