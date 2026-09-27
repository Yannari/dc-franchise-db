// pm/lines/variants.js — more lines for the pools a season wears thin. Data only.
//
// User: "add text variants too, avoid repetitions always". Measured over six
// seasons at 22 islanders, the pools where one line played 7 to 17 times in a
// season: "what I saw" in a gossip scene (gw.p.01 x17), the friendship,
// ick and loyalty endings (x10-11 — an ending never opens with whoever spoke
// last, so an ick's "kept quiet" ending had ONE line that could follow most
// openers), the pull, kiss and deep-chat endings, the turn-downs, comfort.
// Appended to each pool (pm/script.js), whatever file the pool lives in.
// Casts and `of` values as each pool's own file says.
const A = (id, beat, when = {}) => ({ id, when, turns: [], beat });

export const VARIANTS = {
  // gossip-what [a, b, c]: what a saw c do (c is b's partner). `of`: the secret's kind.
  'gossip-what': [
    { id: 'gw.p.03', when: { of: 'pull' }, turns: [['a', "{c} was off with someone else on the terrace for ages."], ['b', "Just talking?"], ['a', "It didn't look like just talking."]] },
    { id: 'gw.p.04', when: { of: 'pull' }, turns: [['a', "{c} pulled someone for a chat. I don't know what was said, but they were very close."]] },
    { id: 'gw.p.05', when: { of: 'pull' }, turns: [['a', "I saw {c} on the daybed with someone who isn't you."], ['b', "When?"], ['a', "Earlier. They didn't see me."]] },
    { id: 'gw.p.06', when: { of: 'pull' }, turns: [['a', "{c} went for a chat with someone else, and came back grinning."]] },
    { id: 'gw.p.07', when: { of: 'pull' }, turns: [['a', "Someone pulled {c} for a chat, and {c} didn't say no."], ['b', "Right."], ['a', "And it wasn't a quick one."]] },
    { id: 'gw.p.08', when: { of: 'pull' }, turns: [['a', "{c} has been getting to know someone. Not you."]] },
    { id: 'gw.k.03', when: { of: 'kiss' }, turns: [['a', "{c} kissed someone else. I saw it."], ['b', "Where?"], ['a', "By the pool. It wasn't a peck."]] },
    { id: 'gw.k.04', when: { of: 'kiss' }, turns: [['a', "I didn't want to be the one to tell you. {c} kissed someone."]] },
    { id: 'gw.k.05', when: { of: 'kiss' }, turns: [['a', "There was a kiss. {c} and someone else."], ['b', "You're sure?"], ['a', "I'm sure."]] },
    { id: 'gw.b.03', when: { of: 'bed' }, turns: [['a', "{c} wasn't in your bed. {c} was in someone else's."]] },
    { id: 'gw.b.04', when: { of: 'bed' }, turns: [['a', "I saw {c} under the covers with someone. It wasn't nothing."]] },
    { id: 'gw.s.03', when: { of: 'said' }, turns: [['a', "{c} was talking about you. It wasn't nice."], ['b', "What did {c} say?"], ['a', "That you're not really {c}'s type."]] },
    { id: 'gw.s.04', when: { of: 'said' }, turns: [['a', "I heard {c} say you were only a back-up."]] },
    { id: 'gw.pr.03', when: { of: 'promise' }, turns: [['a', "{c} told someone else they'd see them on the outside."], ['b', "Who?"], ['a', "Not you. That's all you need to know."]] },
    { id: 'gw.pr.04', when: { of: 'promise' }, turns: [['a', "{c} was making plans. Dinners, dates, the lot. With someone else."]] },
  ],

  // friendship-close [a, b]: two friends.
  'friendship-close': [
    { id: 'fcv.01', turns: [['a', "Same time tomorrow?"], ['b', "Same time, same sunbed."]] },
    { id: 'fcv.02', turns: [['b', "I'm glad I've got you in here."], ['a', "Me too. It'd be a lot harder without you."]] },
    { id: 'fcv.03', turns: [['a', "Come on, I'm starving."], ['b', "You're always starving."], ['a', "And you always come with me."]] },
    { id: 'fcv.04', turns: [['b', "Don't tell anyone how soft I am."], ['a', "I won't. Everyone knows anyway."]] },
    { id: 'fcv.05', turns: [['a', "Thanks for listening."], ['b', "That's what I'm here for."]] },
    { id: 'fcv.06', turns: [['b', "Right. Pool?"], ['a', "Pool."]], beat: 'They race each other there.' },
    { id: 'fcv.07', turns: [['a', "You'd tell me if I was being an idiot, wouldn't you?"], ['b', "Straight away."], ['a', "Good."]] },
    { id: 'fcv.08', turns: [['b', "I've missed talking to you like this."], ['a', "We're in the same villa."], ['b', "You know what I mean."]] },
    { id: 'fcv.09', turns: [['a', "Let's go and see what everyone's doing."], ['b', "Let's go and cause trouble."], ['a', "That's what I said."]] },
    { id: 'fcv.10', turns: [['b', "You always know what to say."], ['a', "Not always. Just to you."]] },
    A('fcv.b01', 'They sit there a while longer, watching the others in the pool.'),
    A('fcv.b02', '{a} bumps {b} with a shoulder, and they both get up.'),
    A('fcv.b03', '{b} throws an arm round {a}, and they walk back to the kitchen together.'),
    A('fcv.b04', 'They end up talking about everyone else in the villa until dinner.'),
    A('fcv.b05', 'The conversation drifts, and neither of them minds.'),
    A('fcv.b06', '{a} steals {b}\'s sunglasses, and {b} chases {a.obj} across the lawn.'),
    A('fcv.b07', 'They go and get ready together, still talking.'),
    A('fcv.b08', '{b} lies back and closes {b.posAdj} eyes, and {a} does the same.'),
    A('fcv.b09', 'Somebody calls them both over, and they go together.'),
    A('fcv.b10', 'They split a drink between them and go back to the others.'),
  ],

  // ick-close [a, b]: a got the ick. Endings that open with {a}, for the
  // openers that end on {b}'s line. `of`: said · kept.
  'ick-close': [
    { id: 'ikc.k.11', when: { of: 'kept' }, turns: [['a', "Right. I'm going to get a drink."], ['b', "I'll come with you."], ['a', "No, it's fine. I'll bring you one."]] },
    { id: 'ikc.k.12', when: { of: 'kept' }, turns: [['a', "I'm going to have a shower."], ['b', "Now?"], ['a', "It's really hot."]], beat: '{a} goes, and takes a long time.' },
    { id: 'ikc.k.13', when: { of: 'kept' }, turns: [['a', "Anyway. What were we talking about?"], ['b', "You tell me."]] },
    { id: 'ikc.k.14', when: { of: 'kept' }, turns: [['a', "Yeah. Okay."], ['b', "Okay what?"], ['a', "Nothing. Just okay."]] },
    { id: 'ikc.k.15', when: { of: 'kept' }, turns: [['a', "I'm going to see if the others need a hand."]], beat: '{b} watches {a} go, and frowns.' },
    { id: 'ikc.k.16', when: { of: 'kept' }, turns: [['a', "Can we talk later?"], ['b', "About what?"], ['a', "Nothing. Just later."]] },
    { id: 'ikc.s.11', when: { of: 'said' }, turns: [['a', "I'm sorry, I have to be honest. That put me off."], ['b', "Put you off me?"], ['a', "A little bit."]] },
    { id: 'ikc.s.12', when: { of: 'said' }, turns: [['a', "Please don't do that again."], ['b', "Do what?"], ['a', "Any of that."]], beat: '{b} goes quiet.' },
    { id: 'ikc.s.13', when: { of: 'said' }, turns: [['a', "That's a no from me. Sorry."], ['b', "A no to what?"], ['a', "To that. Whatever that was."]] },
    { id: 'ikc.s.14', when: { of: 'said' }, turns: [['a', "I need to tell you something, and you're not going to like it."], ['b', "Go on."], ['a', "I've got the ick."]] },
  ],

  // loyalty-close [a, b]: a turned b's pull down.
  'loyalty-close': [
    { id: 'lcv.01', turns: [['b', "I hope they know how lucky they are."], ['a', "I'll make sure they do."]] },
    { id: 'lcv.02', turns: [['b', "No harm in asking, though."], ['a', "No harm at all."]] },
    { id: 'lcv.03', turns: [['b', "Right. I'll stop embarrassing myself."], ['a', "You didn't embarrass yourself."], ['b', "I did a bit."]] },
    { id: 'lcv.04', turns: [['b', "Okay. I respect that."], ['a', "Thank you."]], beat: '{b} walks back to the others.' },
    { id: 'lcv.05', turns: [['b', "Can I still say hi at breakfast?"], ['a', "Of course you can."]] },
    { id: 'lcv.06', turns: [['a', "I hope you find someone who says yes."], ['b', "Me too."]] },
    { id: 'lcv.07', turns: [['a', "It's nothing to do with you. You're lovely."], ['b', "Just not lovely enough."], ['a', "That's not what I said."]] },
    { id: 'lcv.08', turns: [['b', "Well, that's me told."], ['a', "Sorry."], ['b', "Don't be."]] },
    { id: 'lcv.09', turns: [['a', "I'm flattered. Honestly."], ['b', "Flattered but taken."], ['a', "Flattered but taken."]] },
    { id: 'lcv.10', turns: [['b', "I'll leave you to it, then."], ['a', "Thanks for understanding."]] },
    { id: 'lcv.11', turns: [['b', "If you ever want a chat, just a chat, I'm around."], ['a', "I know where to find you."]] },
    { id: 'lcv.12', turns: [['a', "Are we okay?"], ['b', "We're fine. It's a villa. It happens."]] },
    A('lcv.b01', '{b} gives {a} a thumbs up and goes to find someone else.'),
    A('lcv.b02', '{a} goes back to {a.posAdj} partner and sits a little closer.'),
    A('lcv.b03', '{b} laughs it off and goes to get a drink.'),
    A('lcv.b04', 'It\'s a bit awkward, and then {b} makes a joke, and it isn\'t.'),
    A('lcv.b05', '{a} watches {b} go, and doesn\'t follow.'),
    A('lcv.b06', 'Later, {a} tells {a.posAdj} partner about it, and they both laugh.'),
  ],

  // pull-close [a, b]: a pulled b. `of`: flirt · turned-down · kissed · promised.
  'pull-close': [
    { id: 'pcv.f.01', when: { of: 'flirt' }, turns: [['b', "We should do this again."], ['a', "We should."], ['b', "Soon."]] },
    { id: 'pcv.f.02', when: { of: 'flirt' }, turns: [['a', "I like talking to you."], ['b', "I can tell."], ['a', "Is it that obvious?"], ['b', "Very."]] },
    { id: 'pcv.f.03', when: { of: 'flirt' }, turns: [['b', "People are going to talk."], ['a', "Let them."]], beat: 'They walk back separately, both smiling.' },
    { id: 'pcv.f.04', when: { of: 'flirt' }, turns: [['a', "Same time tomorrow?"], ['b', "Maybe. If you're lucky."]] },
    { id: 'pcv.f.05', when: { of: 'flirt' }, turns: [['b', "Right. I'm going back before anyone notices."], ['a', "Everyone's already noticed."]] },
    A('pcv.f.b1', '{b} glances back at {a} on the way to the kitchen.', { of: 'flirt' }),
    A('pcv.f.b2', 'They are interrupted, and neither of them looks happy about it.', { of: 'flirt' }),
    { id: 'pcv.t.01', when: { of: 'turned-down' }, turns: [['a', "Well. Worth a try."], ['b', "Sorry."], ['a', "Don't be."]] },
    { id: 'pcv.t.02', when: { of: 'turned-down' }, turns: [['b', "I hope that's not weird now."], ['a', "It's only weird if we make it weird."]] },
    A('pcv.t.b1', '{a} goes back to the others and acts like it never happened.', { of: 'turned-down' }),
    A('pcv.t.b2', '{a} laughs it off, a bit too loudly.', { of: 'turned-down' }),
    { id: 'pcv.k.01', when: { of: 'kissed' }, turns: [['b', "We shouldn't have done that."], ['a', "Probably not."], ['b', "Do you regret it?"], ['a', "Not even slightly."]] },
    { id: 'pcv.k.02', when: { of: 'kissed' }, turns: [['a', "Nobody saw. Did they?"], ['b', "I don't think so."]], beat: 'They go back inside by different doors.' },
    A('pcv.k.b1', 'They walk back a few minutes apart, and neither of them can stop smiling.', { of: 'kissed' }),
    { id: 'pcv.p.01', when: { of: 'promised' }, turns: [['b', "On the outside, then."], ['a', "On the outside."]] },
    { id: 'pcv.p.02', when: { of: 'promised' }, turns: [['a', "Don't tell anyone about this."], ['b', "Our secret."]] },
  ],

  // kiss-close [a, b]: after a couple's kiss. `of`: first · warm · easy · off.
  'kiss-close': [
    { id: 'kcv.e.01', when: { of: 'easy' }, turns: [['b', "That was nice."], ['a', "It was."]], beat: 'They go back to the others holding hands.' },
    { id: 'kcv.e.02', when: { of: 'easy' }, turns: [['a', "I'm starting to like you a lot."], ['b', "Only starting?"], ['a', "It's going well so far."]] },
    { id: 'kcv.e.03', when: { of: 'easy' }, turns: [['b', "I could get used to this."], ['a', "Me too."]] },
    { id: 'kcv.e.04', when: { of: 'easy' }, turns: [['a', "Do you want a drink?"], ['b', "Go on."]], beat: '{a} goes, and comes back quickly.' },
    { id: 'kcv.e.05', when: { of: 'easy' }, turns: [['b', "Is this going somewhere, do you think?"], ['a', "I hope so."]] },
    { id: 'kcv.w.01', when: { of: 'warm' }, turns: [['a', "Stay here a minute."], ['b', "I'm not going anywhere."]] },
    { id: 'kcv.w.02', when: { of: 'warm' }, turns: [['b', "I don't think I've ever felt like this."], ['a', "Me neither. It's a bit scary."]] },
    { id: 'kcv.w.03', when: { of: 'warm' }, turns: [['a', "You make everything easier in here."], ['b', "So do you."]], beat: 'They stay wrapped up in each other until someone calls them in.' },
    { id: 'kcv.o.01', when: { of: 'off' }, turns: [['a', "Are you okay? You seem far away."], ['b', "Just tired."]] },
    { id: 'kcv.o.02', when: { of: 'off' }, turns: [['b', "I'm going to go and get ready."], ['a', "Already?"], ['b', "Yeah."]] },
  ],

  // deep-chat-close [a, b]: a couple opening up. `of`: open · guarded.
  'deep-chat-close': [
    { id: 'dcv.o.01', when: { of: 'open' }, turns: [['b', "I feel lighter for saying that."], ['a', "Good. You can always say it to me."]] },
    { id: 'dcv.o.02', when: { of: 'open' }, turns: [['a', "I didn't know that about you."], ['b', "Not many people do."], ['a', "I'm glad I do."]] },
    { id: 'dcv.o.03', when: { of: 'open' }, turns: [['b', "Thank you for listening. Properly listening."], ['a', "Always."]] },
    { id: 'dcv.o.04', when: { of: 'open' }, turns: [['a', "I trust you. That's new for me."], ['b', "I won't let you down."]] },
    { id: 'dcv.o.05', when: { of: 'open' }, turns: [['b', "Can we do this more? Just talk?"], ['a', "Every day, if you want."]] },
    A('dcv.o.b1', 'They sit in silence for a while, and it is comfortable.', { of: 'open' }),
    A('dcv.o.b2', '{b} rests {b.posAdj} head on {a.posAdj} shoulder.', { of: 'open' }),
    { id: 'dcv.g.01', when: { of: 'guarded' }, turns: [['b', "Can we talk about something else?"], ['a', "Sure. Of course."]] },
    { id: 'dcv.g.02', when: { of: 'guarded' }, turns: [['b', "I'm not ready to go there yet."], ['a', "That's okay. When you are."]] },
    { id: 'dcv.g.03', when: { of: 'guarded' }, turns: [['a', "You can tell me, you know."], ['b', "I know. Just not yet."]] },
    A('dcv.g.b1', '{b} changes the subject, and {a} lets it go.', { of: 'guarded' }),
  ],

  // gossip-close [a, b, c]: a told b about b's partner c. `of`: thanks · angry · quiet.
  'gossip-close': [
    { id: 'gcv.t.01', when: { of: 'thanks' }, turns: [['b', "I'd rather know than not."], ['a', "That's why I told you."]] },
    { id: 'gcv.t.02', when: { of: 'thanks' }, turns: [['b', "You're a good friend."], ['a', "I'm sorry it's bad news."]] },
    { id: 'gcv.a.01', when: { of: 'angry' }, turns: [['b', "Where is {c}?"], ['a', "Don't do anything yet."], ['b', "I'm not waiting."]], beat: '{b} gets up and goes to find {c}.' },
    { id: 'gcv.a.02', when: { of: 'angry' }, turns: [['b', "I can't believe this."], ['a', "I'm sorry."], ['b', "Not you. {c}."]] },
    { id: 'gcv.q.01', when: { of: 'quiet' }, turns: [['b', "Okay."], ['a', "Are you all right?"], ['b', "I will be."]] },
    { id: 'gcv.q.02', when: { of: 'quiet' }, turns: [['b', "I need some time on my own."], ['a', "I'll be around."]] },
  ],

  // comfort [a, b]: a comes and sits with b. `of`: friend · partner · unexpected.
  comfort: [
    { id: 'cfv.f.01', when: { of: 'friend' }, stage: '{a} brings two cups of tea into the bedroom.', turns: [
      ['a', "I didn't know how you take it, so I guessed."], ['b', "You guessed wrong."], ['a', "Drink it anyway."]], beat: '{b} laughs, and drinks it.' },
    { id: 'cfv.f.02', when: { of: 'friend' }, turns: [
      ['a', "Do you want to talk, or do you want me to talk about something stupid?"], ['b', "Something stupid."], ['a', "I can do that."]] },
    { id: 'cfv.f.03', when: { of: 'friend' }, stage: '{a} sits down on the edge of the bed.', turns: [
      ['a', "Everyone's asking where you are."], ['b', "Tell them I'm fine."], ['a', "I'll tell them you'll be out in a bit."]] },
    { id: 'cfv.p.01', when: { of: 'partner' }, turns: [
      ['a', "Come here. I've got you."], ['b', "I'm sorry you have to see me like this."], ['a', "Don't be. This is what I'm here for."]] },
    { id: 'cfv.p.02', when: { of: 'partner' }, stage: '{a} finds {b} on the daybed and lies down beside {b.obj}.', turns: [
      ['a', "You don't have to explain."], ['b', "I want to."], ['a', "Then I'm listening."]] },
    { id: 'cfv.u.01', when: { of: 'unexpected' }, turns: [
      ['a', "I know we don't really talk. But are you okay?"], ['b', "Not really."], ['a', "Do you want me to stay?"], ['b', "…Yeah."]] },
    { id: 'cfv.u.02', when: { of: 'unexpected' }, stage: '{a} sits down next to {b}, a bit awkwardly.', turns: [
      ['a', "I didn't think you'd want me here."], ['b', "I didn't think you'd come."], ['a', "Well. I'm here."]] },
  ],

  // loyalty [a, b]: coupled a turns down b's pull.
  loyalty: [
    { id: 'lyv.01', turns: [['b', "Have you got a minute?"], ['a', "For a chat, yes. For that kind of chat, no."], ['b', "What kind of chat?"], ['a', "The kind you were going to have."]] },
    { id: 'lyv.02', turns: [['b', "Can I steal you?"], ['a', "I'd rather you didn't. I'm happy where I am."], ['b', "Okay. Worth a go."]] },
    { id: 'lyv.03', stage: '{b} sits down next to {a} by the pool.', turns: [['b', "Are you as happy as you look?"], ['a', "I am, actually."], ['b', "Shame."], ['a', "For you, maybe."]] },
    { id: 'lyv.04', turns: [['b', "I think you're amazing."], ['a', "That's kind. My partner thinks so too."], ['b', "I walked into that."]] },
    { id: 'lyv.05', turns: [['b', "Would you ever look at anyone else?"], ['a', "Not while I'm happy."], ['b', "And are you?"], ['a', "Very."]] },
    { id: 'lyv.06', stage: '{b} catches {a} in the kitchen.', turns: [['b', "Do you want to go somewhere quieter?"], ['a', "I'm good here, thanks."], ['b', "Right."]] },
    { id: 'lyv.07', turns: [['b', "Just one chat. That's all I'm asking."], ['a', "I know what one chat turns into in here."], ['b', "Fair."]] },
    { id: 'lyv.08', turns: [['b', "You and me would work, you know."], ['a', "Maybe. But I'm already working on something."]] },
    { id: 'lyv.09', stage: 'On the terrace, {b} leans on the rail next to {a}.', turns: [['b', "So is it serious, you two?"], ['a', "It's getting there."], ['b', "So there's still a chance."], ['a', "There's really not."]] },
    { id: 'lyv.10', turns: [['b', "I've been wanting to ask you something."], ['a', "If it's a chat, I'm going to say no."], ['b', "How did you know?"], ['a', "Everyone asks in the same voice."]] },
    { id: 'lyv.11', turns: [['b', "Can I get to know you?"], ['a', "As a friend, of course."], ['b', "And not as a friend?"], ['a', "Just as a friend."]] },
    { id: 'lyv.12', stage: '{b} sits on the end of {a}\'s sunbed.', turns: [['b', "I'm going to be honest. I like you."], ['a', "I'm going to be honest back. I'm not looking."]] },
    { id: 'lyv.13', turns: [['b', "What would it take?"], ['a', "For what?"], ['b', "For you to go on a date with me."], ['a', "Me being single. And I'm not."]] },
    { id: 'lyv.14', turns: [['b', "Is your partner the jealous type?"], ['a', "No. But I'm the loyal type."]] },
    { id: 'lyv.15', stage: 'By the fire pit, {b} sits down beside {a}.', turns: [['b', "I don't want to cause trouble."], ['a', "Then don't ask."], ['b', "…I wasn't going to."], ['a', "You were."]] },
  ],

  // kiss [a, b]: a couple kiss.
  kiss: [
    { id: 'ksv.01', stage: 'On the daybed, {a} leans over and kisses {b}.', turns: [['b', "What was that for?"], ['a', "I felt like it."]] },
    { id: 'ksv.02', turns: [['a', "Come here a second."], ['b', "What?"]], beat: '{a} kisses {b}, and {b} laughs into it.' },
    { id: 'ksv.03', stage: 'In the kitchen, {b} kisses {a} while the kettle boils.', turns: [['a', "The kettle."], ['b', "Let it boil."]] },
    { id: 'ksv.04', stage: 'On the swing, the two of them are close.', turns: [['b', "Can I kiss you?"], ['a', "You don't have to ask."]] },
    { id: 'ksv.05', turns: [['a', "Everyone's looking."], ['b', "Good."]], beat: '{b} kisses {a} anyway.' },
    { id: 'ksv.06', stage: 'In the pool, {a} swims over to {b}.', turns: [['b', "Hello."], ['a', "Hello."]], beat: 'They kiss, and somebody splashes them.' },
    { id: 'ksv.07', stage: '{a} kisses {b} goodnight in the bedroom.', when: { phase: 'evening' }, turns: [['b', "Goodnight."], ['a', "Goodnight."], ['b', "One more."]] },
    { id: 'ksv.08', stage: 'By the fire pit, {b} leans in.', turns: [['a', "In front of everyone?"], ['b', "In front of everyone."]] },
    { id: 'ksv.09', turns: [['a', "I've wanted to do that all day."], ['b', "Then why didn't you?"], ['a', "I'm doing it now."]] },
    { id: 'ksv.10', stage: 'On the terrace, {a} pulls {b} in by the hand.', turns: [['b', "Where are we going?"], ['a', "Nowhere. Just here."]], beat: 'They kiss, and stay out there a while.' },
  ],
};

// A second batch, where the volume is (measured after the first: flirty pull
// endings ~90 a season over 22 spoken ones, friendship endings ~250).
const MORE = {
  'pull-close': [
    { id: 'pcv.f.06', when: { of: 'flirt' }, turns: [['a', "I've enjoyed this."], ['b', "Me too. More than I thought I would."]] },
    { id: 'pcv.f.07', when: { of: 'flirt' }, turns: [['a', "Can I pull you again tomorrow?"], ['b', "You can try."]] },
    { id: 'pcv.f.08', when: { of: 'flirt' }, turns: [['a', "Everyone's going to ask what we talked about."], ['b', "Tell them nothing."], ['a', "That's what I'll say."]] },
    { id: 'pcv.f.09', when: { of: 'flirt' }, turns: [['a', "You're trouble, aren't you?"], ['b', "Only a little bit."]] },
    { id: 'pcv.f.10', when: { of: 'flirt' }, turns: [['a', "Go on, then. Back to the others."], ['b', "You first."], ['a', "No, you."]], beat: 'They end up walking back together.' },
    { id: 'pcv.f.11', when: { of: 'flirt' }, turns: [['a', "I'll let you go."], ['b', "Will you?"], ['a', "Eventually."]] },
    { id: 'pcv.f.12', when: { of: 'flirt' }, turns: [['b', "This was a good idea."], ['a', "Mine are usually good ideas."], ['b', "Usually?"]] },
    { id: 'pcv.f.13', when: { of: 'flirt' }, turns: [['b', "I didn't expect to like you this much."], ['a', "Is that a compliment?"], ['b', "Take it as one."]] },
    { id: 'pcv.f.14', when: { of: 'flirt' }, turns: [['b', "Don't tell anyone I laughed at that."], ['a', "Too late. I'm telling everyone."]] },
    { id: 'pcv.f.15', when: { of: 'flirt' }, turns: [['b', "Are you going to go and do this with someone else now?"], ['a', "No. Just you."], ['b', "Good answer."]] },
    { id: 'pcv.f.16', when: { of: 'flirt' }, turns: [['b', "Right. I'm going. Before I say something I shouldn't."], ['a', "Now I want to know what it was."]] },
    { id: 'pcv.f.17', when: { of: 'flirt' }, turns: [['b', "Same place later?"], ['a', "Same place later."]] },
  ],
  'friendship-close': [
    { id: 'fcv.11', turns: [['a', "Promise me we'll still do this when we're out."], ['b', "Every week."]] },
    { id: 'fcv.12', turns: [['a', "Do you want the last biscuit?"], ['b', "Obviously."], ['a', "Tough, I'm having it."]] },
    { id: 'fcv.13', turns: [['a', "Right. I'm going to get ready. Come and do my hair?"], ['b', "Only if you do mine."]] },
    { id: 'fcv.14', turns: [['a', "I'd be lost in here without you."], ['b', "You'd be fine."], ['a', "I'd be fine and bored."]] },
    { id: 'fcv.15', turns: [['a', "Go on, then. Tell me something good."], ['b', "The sun's out and you've got me."], ['a', "That'll do."]] },
    { id: 'fcv.16', turns: [['b', "Is it weird that I tell you everything?"], ['a', "A bit. Don't stop, though."]] },
    { id: 'fcv.17', turns: [['b', "Come on. Dinner."], ['a', "Carry me."], ['b', "Not a chance."]] },
    { id: 'fcv.18', turns: [['b', "I'm really glad we met."], ['a', "Stop it. You'll make me cry."], ['b', "Good."]] },
    A('fcv.b11', 'They sit and watch the sun go down over the villa, not saying much.'),
    A('fcv.b12', '{b} rests {b.posAdj} head on {a.posAdj} shoulder for a minute, then they get up.'),
    A('fcv.b13', 'They start planning what they\'ll do on the outside, and don\'t stop until dinner.'),
    A('fcv.b14', '{a} pulls {b} up off the sunbed, and they go and join the others.'),
  ],
  'gossip-what': [
    { id: 'gw.p.09', when: { of: 'pull' }, turns: [['a', "{c} was having a very close chat with someone. Knees touching, the lot."]] },
    { id: 'gw.p.10', when: { of: 'pull' }, turns: [['a', "I don't want to stir anything. But {c} went off with someone for a long time."], ['b', "How long?"], ['a', "Long enough."]] },
    { id: 'gw.p.11', when: { of: 'pull' }, turns: [['a', "{c} was laughing with someone else on the swing. It looked flirty."], ['b', "Flirty how?"], ['a', "Flirty flirty."]] },
    { id: 'gw.p.12', when: { of: 'pull' }, turns: [['a', "You should know {c} has been pulled for chats. More than once."]] },
    { id: 'gw.p.13', when: { of: 'pull' }, turns: [['a', "{c} went to the terrace with someone and they were whispering."], ['b', "About what?"], ['a', "I couldn't hear. That's the problem."]] },
    { id: 'gw.p.14', when: { of: 'pull' }, turns: [['a', "I saw {c} with someone by the fire pit. It didn't look like a friendly chat."]] },
  ],
};
for (const [k, v] of Object.entries(MORE)) VARIANTS[k] = [...(VARIANTS[k] || []), ...v];
