// pm/lines/movie-night.js — Movie Night (pm/movie-night.js). Data only.
// The clips themselves are never written here: a clip is the real scene's own
// lines, replayed (user: "don't invent things"). These are the villa around it.
//   movie-text   [a, (b)]    a reads the text out; the first line IS the text
//   movie-seat   [a, b]      a couple sits down. `of`: guilty (a has something
//                            on the reel) · easy
//   movie-react  [a, b, (c)] a watched b on screen; c gasps beside a.
//                            `of`: hurt · fury · relief
//   movie-row    [a, b]      a confronts b after the screening.
//                            `of`: own-it · deny · walk-off
//   movie-split  [a, b]      a ends it with b
export const MOVIE_NIGHT = {
  'movie-text': [
    { id: 'mt.01', turns: [['a', "Islanders, tonight it's Movie Night. Grab your popcorn and take your seats. #LightsCameraAction"], ['b', "Oh no. Oh no, no."]], beat: 'Every couple in the villa looks at each other at once.' },
    { id: 'mt.02', stage: "{a}'s phone buzzes at dinner.", turns: [['a', "Islanders, it's Movie Night. Some of you are about to become stars. #NowShowing"], ['b', "Stars of what, though?"]] },
    { id: 'mt.03', turns: [['a', "I got a text!"], ['a', "Islanders, the cinema is open. Tonight you'll see what the cameras saw. #RollTheTape"], ['b', "What the cameras saw. Brilliant. Great."]] },
    { id: 'mt.04', stage: 'The whole villa gathers round {a} in the kitchen.', turns: [['a', "Islanders, please make your way to the lawn for Movie Night. #ComingSoon"], ['b', "Is anyone else suddenly feeling really sick?"]] },
    { id: 'mt.05', turns: [['a', "Islanders, it's time for Movie Night. Don't forget the tissues. #SpoilerAlert"], ['b', "Why would we need tissues?"], ['a', "That's what I'm worried about."]] },
    { id: 'mt.06', when: { cast: 1 }, turns: [['a', "Islanders, Movie Night starts in ten minutes. #BigScreen"]], beat: 'Somebody groans. Somebody else laughs far too loudly.' },
  ],
  'movie-seat': [
    { id: 'ms.g.01', when: { of: 'guilty' }, stage: 'The lawn has become an outdoor cinema: a huge screen, beanbags, blankets, popcorn.', turns: [['b', "You're very quiet."], ['a', "Just tired."], ['b', "You're holding that popcorn like it's going to save you."]] },
    { id: 'ms.g.02', when: { of: 'guilty' }, stage: 'Couples find their beanbags in front of the big screen.', turns: [['b', "Is there anything on there I should know about?"], ['a', "No. Nothing. Why would there be?"], ['b', "You said nothing three times."]] },
    { id: 'ms.g.03', when: { of: 'guilty' }, stage: 'The fairy lights dim and the screen starts to glow.', turns: [['a', "Whatever's on there, just remember it's edited."], ['b', "Why are you saying that before it's even started?"]], beat: '{a} does not answer.' },
    { id: 'ms.g.04', when: { of: 'guilty' }, turns: [['b', "Why are you sitting so far away?"], ['a', "I'm not."], ['b', "You're practically on the next beanbag."]] },
    { id: 'ms.e.01', when: { of: 'easy' }, stage: 'The lawn is full of beanbags and blankets, and the big screen lights up.', turns: [['a', "I've got nothing to worry about."], ['b', "Good. Neither have I."], ['a', "Then why are we both holding hands this tight?"]] },
    { id: 'ms.e.02', when: { of: 'easy' }, stage: 'Popcorn goes round. Nobody eats any.', turns: [['b', "Pass the popcorn."], ['a', "You haven't eaten any of the last bowl."], ['b', "I'm nervous-holding it."]] },
    { id: 'ms.e.03', when: { of: 'easy' }, turns: [['a', "Honestly, I'm excited. I want to see what everyone else has been up to."], ['b', "That's because you haven't done anything."], ['a', "Exactly."]] },
  ],
  'movie-react': [
    // hurt
    { id: 'mr.h.01', when: { of: 'hurt' }, turns: [['a', "…Wow."]], beat: '{a} stares at the screen long after the clip has ended.' },
    { id: 'mr.h.02', when: { of: 'hurt' }, turns: [['a', "Can someone pause it? I need a second."]], beat: 'Nobody pauses it.' },
    { id: 'mr.h.03', when: { of: 'hurt', cast: 3 }, turns: [['c', "Are you okay?"], ['a', "No. I'm really not."]], beat: '{c} takes {a.posAdj} hand. {b} does not look up.' },
    { id: 'mr.h.04', when: { of: 'hurt' }, turns: [['a', "I asked you. I asked you straight out, and you said nothing happened."]], beat: '{b} looks at the floor.' },
    { id: 'mr.h.05', when: { of: 'hurt', cast: 3 }, turns: [['a', "Did you know about this?"], ['c', "No. I swear I didn't."]], beat: '{a} gets up and moves to a different beanbag.' },
    { id: 'mr.h.06', when: { of: 'hurt' }, turns: [['a', "I feel sick."]], beat: 'The popcorn goes down, untouched.' },
    // fury
    { id: 'mr.f.01', when: { of: 'fury' }, turns: [['a', "Are you JOKING?"]], beat: 'The whole cinema turns round.' },
    { id: 'mr.f.02', when: { of: 'fury' }, turns: [['a', "No. No, no. Rewind that. I want to see it again."], ['b', "Please don't."]] },
    { id: 'mr.f.03', when: { of: 'fury', cast: 3 }, turns: [['a', "Do you see this? Are you all seeing this?"], ['c', "We're all seeing it."]], beat: '{a} throws the popcorn down.' },
    { id: 'mr.f.04', when: { of: 'fury' }, turns: [['a', "That's what you do when I'm not there? That?"], ['b', "It's not what it looks like."], ['a', "It's exactly what it looks like!"]] },
    { id: 'mr.f.05', when: { of: 'fury' }, turns: [['a', "Don't touch me. Don't even look at me right now."]], beat: '{b} takes {b.posAdj} arm back very slowly.' },
    // relief: a good clip
    { id: 'mr.r.01', when: { of: 'relief' }, turns: [['a', "You said no. You actually said no."], ['b', "Of course I did."]], beat: '{a} kisses {b} in front of the whole cinema.' },
    { id: 'mr.r.02', when: { of: 'relief' }, turns: [['a', "I didn't even know that happened."], ['b', "I didn't think it was worth mentioning."], ['a', "It was worth mentioning."]] },
    { id: 'mr.r.03', when: { of: 'relief' }, turns: [['a', "Okay, that's the best thing I've ever seen on a screen."]], beat: 'The villa cheers.' },
    { id: 'mr.r.04', when: { of: 'relief' }, turns: [['a', "Come here."]], beat: '{a} pulls {b} into a hug and does not let go.' },
  ],
  'movie-row': [
    // owning it
    { id: 'mw.o.01', when: { of: 'own-it' }, stage: 'After the screening, on the daybeds.', turns: [
      ['a', "Say something."], ['b', "I'm sorry. I should have told you."], ['a', "Why didn't you?"],
      ['b', "Because I knew it would look like this."], ['a', "It looks like this because it IS this."],
      ['b', "I know. I'm not going to make excuses."], ['a', "I don't know if sorry is enough."]], beat: '{a} walks off to the dressing room.' },
    { id: 'mw.o.02', when: { of: 'own-it' }, turns: [
      ['a', "Was any of it a lie?"], ['b', "No. It happened. All of it."], ['a', "At least you're honest now."],
      ['b', "I should have been honest then."], ['a', "Yeah. You should have."], ['b', "What do you want me to do?"],
      ['a', "I want you to give me some space."]] },
    { id: 'mw.o.03', when: { of: 'own-it' }, stage: 'By the pool, away from the others.', turns: [
      ['b', "I'm not going to pretend it was edited."], ['a', "Good, because it wasn't."], ['b', "I messed up."],
      ['a', "You did. And I had to find out on a massive screen in front of everyone."], ['b', "That's the worst part, isn't it."],
      ['a', "That's the worst part."]] },
    // denying it
    { id: 'mw.d.01', when: { of: 'deny' }, stage: 'The garden, the minute the screen goes dark.', turns: [
      ['a', "Explain that."], ['b', "It was edited. They've made it look worse than it was."], ['a', "I heard you say it."],
      ['b', "Out of context."], ['a', "What context makes that okay?"], ['b', "You're overreacting."],
      ['a', "Don't you dare tell me I'm overreacting."]], beat: 'Half the villa is pretending not to listen. Nobody is managing it.' },
    { id: 'mw.d.02', when: { of: 'deny' }, turns: [
      ['b', "Nothing happened."], ['a', "I just watched it happen."], ['b', "It was a chat."],
      ['a', "Then why didn't you tell me about the chat?"], ['b', "Because I knew you'd do this."],
      ['a', "Do what? React to you lying to me?"]] },
    { id: 'mw.d.03', when: { of: 'deny' }, stage: 'On the terrace, loud enough for the kitchen to hear.', turns: [
      ['a', "Look me in the eye and tell me that's not what it looked like."], ['b', "It's not what it looked like."],
      ['a', "You can't even look at me when you say it."], ['b', "Because you're shouting!"],
      ['a', "I'm shouting because you're lying!"]] },
    // walking off
    { id: 'mw.w.01', when: { of: 'walk-off' }, turns: [
      ['b', "Can we talk?"], ['a', "Not tonight."], ['b', "Please. Five minutes."], ['a', "I said not tonight."]],
      beat: '{a} walks away, and {b} is left standing on the lawn on {b.posAdj} own.' },
    { id: 'mw.w.02', when: { of: 'walk-off' }, turns: [
      ['b', "Where are you going?"], ['a', "Anywhere you're not."]], beat: '{a} spends the rest of the night in the dressing room.' },
    { id: 'mw.w.03', when: { of: 'walk-off' }, turns: [
      ['b', "Say something. Anything."], ['a', "I've got nothing to say to you."]], beat: '{a} takes a pillow and sleeps on the daybed.' },
  ],
  'movie-split': [
    { id: 'mx.01', turns: [['a', "I can't do this any more. We're done."], ['b', "You don't mean that."], ['a', "I've never meant anything more."]], beat: 'The villa goes completely silent.' },
    { id: 'mx.02', turns: [['a', "I'm not going to be the one who gets made a fool of on a screen twice."], ['b', "So that's it?"], ['a', "That's it."]] },
    { id: 'mx.03', turns: [['a', "I'm closing this off. Tonight."], ['b', "Over one clip?"], ['a', "Over what the clip showed me about you."]], beat: '{b} watches {a} walk away.' },
    { id: 'mx.04', turns: [['a', "I trusted you more than anyone in here."], ['b', "I know."], ['a', "Then you know why I'm done."]] },
  ],
};

const K = (kind, more = {}) => ({ kind, ...more });
export const MOVIE_NIGHT_HUT = {
  honest: [
    { id: 'hut.mn.h1', when: K('movie-react', { of: 'hurt', role: 0 }), turns: [['a', "Watching that was like being punched. In front of everyone."]] },
    { id: 'hut.mn.h2', when: K('movie-react', { of: 'fury', role: 0 }), turns: [['a', "I'm not calm. I'm not going to be calm for a while."]] },
    { id: 'hut.mn.h3', when: K('movie-react', { of: 'relief', role: 0 }), turns: [['a', "I've never been so happy to see a clip in my life."]] },
    { id: 'hut.mn.h4', when: K('movie-row', { of: 'own-it', role: 1 }), turns: [['a', "I deserved every word. I just hope it isn't over."]] },
    { id: 'hut.mn.h5', when: K('movie-row', { of: 'deny', role: 0 }), turns: [['a', "The worst bit isn't the clip. It's that I'm still being lied to about it."]] },
    { id: 'hut.mn.h6', when: K('movie-split', { role: 0 }), turns: [['a', "I walked in with someone and I'm walking out on my own. And I'm okay with that."]] },
    { id: 'hut.mn.h7', when: K('movie-split', { role: 1 }), turns: [['a', "One clip. That's all it took."]] },
  ],
  'two-faced': [
    { id: 'hut.mn.t1', when: K('movie-row', { of: 'deny', role: 1 }), turns: [['a', "Was it edited? No. Am I going to say that? Also no."]] },
    { id: 'hut.mn.t2', when: K('movie-seat', { of: 'guilty', role: 0 }), turns: [['a', "If there's one clip of me on that screen, I'm in so much trouble."]] },
  ],
};
