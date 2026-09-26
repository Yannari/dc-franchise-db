// pm/lines/day/kiss-close.js — what a couple say after they kiss. Data only.
//
// User: "make sure we have actual conversations too". A villa kiss played as
// two lines and a kiss (234 of 300 aired kisses in five seasons had two
// spoken lines or fewer). A short kiss scene now carries on after the kiss,
// picked by what the engine read off the pair (pm/events.js ENDINGS.kiss):
//
//   first  their first kiss, and it went well
//   warm   they are into each other
//   easy   it's nice, it isn't a big deal yet
//   off    one of them isn't feeling it
//
// Written to follow ANY kiss opener: no places, no past, nothing the engine
// did not record. Both {a}-first and {b}-first entries, so the ending never
// opens with whoever spoke last.
export const KISS_CLOSE = {
  'kiss-close': [
    // first: the first one, and it went well
    { id: 'kc.f.01', when: { of: 'first', rowedToday: false }, turns: [['b', "So that happened."], ['a', "That happened."], ['b', "Good?"], ['a', "Really good."]] },
    { id: 'kc.f.02', when: { of: 'first', rowedToday: false }, turns: [['a', "I've been thinking about doing that for ages."], ['b', "Why didn't you?"], ['a', "Nerves."], ['b', "You didn't seem nervous."]] },
    { id: 'kc.f.03', when: { of: 'first', rowedToday: false }, turns: [['b', "My heart's going so fast."], ['a', "Mine too. Feel."], ['b', "Oh my God, it is."]] },
    { id: 'kc.f.04', when: { of: 'first', rowedToday: false }, turns: [['a', "Was that okay?"], ['b', "Better than okay."], ['a', "Yeah?"], ['b', "Do it again and I'll tell you properly."]], beat: '{a} does.' },
    { id: 'kc.f.05', when: { of: 'first', rowedToday: false }, turns: [['b', "Everyone's going to ask about this."], ['a', "What are you going to tell them?"], ['b', "That it was really nice."], ['a', "Just nice?"], ['b', "Really nice."]] },
    { id: 'kc.f.06', when: { of: 'first', rowedToday: false }, turns: [['a', "I didn't think you'd kiss me back."], ['b', "Why not?"], ['a', "I don't know. I didn't know if you liked me like that."], ['b', "I do. Obviously."]] },
    { id: 'kc.f.07', when: { of: 'first', rowedToday: false }, turns: [['b', "I'm actually shaking."], ['a', "Come here."]], beat: '{a} pulls {b} in, and they both laugh.' },
    { id: 'kc.f.08', when: { of: 'first', rowedToday: false }, turns: [['a', "Can I be honest? That's the best first kiss I've had."], ['b', "You're just saying that."], ['a', "I'm not."], ['b', "…Me too, actually."]] },
    { id: 'kc.f.09', when: { of: 'first', rowedToday: false }, turns: [['b', "Right. I need to go and tell everyone."], ['a', "Now?"], ['b', "Right now."]], beat: '{b} kisses {a.obj} again first.' },
    { id: 'kc.f.10', when: { of: 'first', rowedToday: false }, turns: [['a', "I feel like a teenager."], ['b', "Same. I can't stop smiling."], ['a', "Good. Don't."]] },

    // warm: they are into each other
    { id: 'kc.w.01', when: { of: 'warm' }, turns: [['a', "I could do that all day."], ['b', "We nearly have."], ['a', "Not complaining."]] },
    { id: 'kc.w.02', when: { of: 'warm' }, turns: [['b', "You're a really good kisser, you know."], ['a', "Only with you."], ['b', "Shut up."], ['a', "I mean it."]] },
    { id: 'kc.w.03', when: { of: 'warm' }, turns: [['a', "Every time I do that, I like you more."], ['b', "That's a lot of liking."], ['a', "It is."]] },
    { id: 'kc.w.04', when: { of: 'warm' }, turns: [['b', "I miss you when you're on the other side of the villa."], ['a', "It's about ten metres."], ['b', "It's too far."]] },
    { id: 'kc.w.05', when: { of: 'warm' }, turns: [['a', "Do you know what I like best about you?"], ['b', "Go on."], ['a', "You kiss me like nobody's watching."], ['b', "Everybody's watching."], ['a', "Exactly."]] },
    { id: 'kc.w.06', when: { of: 'warm' }, turns: [['b', "Don't go anywhere."], ['a', "I'm not going anywhere."], ['b', "Promise?"], ['a', "Promise."]] },
    { id: 'kc.w.07', when: { of: 'warm' }, turns: [['a', "You've gone red."], ['b', "I have not."], ['a', "You have. It's cute."]], beat: '{b} hides {b.posAdj} face in {a.posAdj} shoulder.' },
    { id: 'kc.w.08', when: { of: 'warm' }, turns: [['b', "I don't want to go back in yet."], ['a', "Then we won't."], ['b', "They'll come looking for us."], ['a', "Let them look."]] },
    { id: 'kc.w.09', when: { of: 'warm' }, turns: [['a', "I think about you when you're not even here."], ['b', "I'm always here."], ['a', "When you're in the shower, then."], ['b', "That's a different conversation."]] },
    { id: 'kc.w.10', when: { of: 'warm' }, turns: [['b', "I'm so glad it's you."], ['a', "Me too. Honestly."]], beat: 'They stay wrapped up together for a long time.' },
    { id: 'kc.w.11', when: { of: 'warm' }, turns: [['a', "You're distracting me."], ['b', "From what?"], ['a', "Everything."], ['b', "Good."]] },
    { id: 'kc.w.12', when: { of: 'warm' }, turns: [['b', "Again."], ['a', "Again?"], ['b', "Again."]], beat: '{a} kisses {b.obj} again, slower.' },
    { id: 'kc.w.13', when: { of: 'warm' }, turns: [['a', "I don't get butterflies. I'm getting butterflies."], ['b', "Is that bad?"], ['a', "No. It's really good."]] },
    { id: 'kc.w.14', when: { of: 'warm', phase: 'evening' }, turns: [['b', "Can we just stay out here tonight?"], ['a', "On the daybed?"], ['b', "Anywhere. With you."], ['a', "Okay."]] },

    // easy: nice, not a big deal yet
    { id: 'kc.e.01', when: { of: 'easy' }, turns: [['a', "That was nice."], ['b', "It was."], ['a', "Right. Drink?"], ['b', "Go on then."]] },
    { id: 'kc.e.02', when: { of: 'easy' }, turns: [['b', "Are we getting somewhere, do you think?"], ['a', "I think so. Slowly."], ['b', "Slowly's good."]] },
    { id: 'kc.e.03', when: { of: 'easy' }, turns: [['a', "I like this. I like getting to know you."], ['b', "Me too. No rush, though."], ['a', "No rush."]] },
    { id: 'kc.e.04', when: { of: 'easy' }, turns: [['b', "You've got lip balm on my face."], ['a', "Sorry."], ['b', "Don't be."]], beat: 'They both laugh.' },
    { id: 'kc.e.05', when: { of: 'easy' }, turns: [['a', "Shall we go back to the others?"], ['b', "In a minute."], ['a', "A minute, then."]] },
    { id: 'kc.e.06', when: { of: 'easy' }, turns: [['b', "Is this going to be a thing now?"], ['a', "Do you want it to be?"], ['b', "Maybe. Ask me tomorrow."]] },
    { id: 'kc.e.07', when: { of: 'easy' }, turns: [['a', "I'm starting to really like you."], ['b', "Starting?"], ['a', "It's early. Give me a chance."]] },
    { id: 'kc.e.08', when: { of: 'easy' }, turns: [['b', "Okay, I'm going to get ready."], ['a', "Already?"], ['b', "It takes me ages. See you out there."]] },

    // off: one of them isn't feeling it
    { id: 'kc.o.01', when: { of: 'off' }, turns: [['a', "Everything alright?"], ['b', "Yeah. Just tired."]], beat: '{b} gets up first.' },
    { id: 'kc.o.02', when: { of: 'off' }, turns: [['b', "Sorry. I'm a bit distracted today."], ['a', "By what?"], ['b', "Nothing. Honestly."]], beat: "{a} doesn't look convinced." },
    { id: 'kc.o.03', when: { of: 'off' }, turns: [['a', "That felt a bit different."], ['b', "Different how?"], ['a', "I don't know. Forget it."]] },
    { id: 'kc.o.04', when: { of: 'off' }, turns: [['b', "Right. I'll see you in a bit."], ['a', "Oh. Okay."]], beat: '{b} goes back inside, and {a} stays out there on {a.posAdj} own.' },
    { id: 'kc.o.05', when: { of: 'off' }, turns: [['a', "You kissed me like you were thinking about something else."], ['b', "I wasn't."], ['a', "Okay."]], beat: "Neither of them says anything else." },
    { id: 'kc.o.06', when: { of: 'off' }, turns: [['b', "Do you want to go and see what the others are doing?"], ['a', "If you want."], ['b', "Yeah. Come on."]] },
    { id: 'kc.o.07', when: { of: 'off' }, turns: [['a', "Are we okay?"], ['b', "We're fine."], ['a', "You'd tell me if we weren't?"], ['b', "I'd tell you."]] },
    { id: 'kc.o.08', when: { of: 'off' }, turns: [['b', "I'm going to get a drink."], ['a', "Want me to come?"], ['b', "No, it's fine. Stay here."]] },
  ],
};
