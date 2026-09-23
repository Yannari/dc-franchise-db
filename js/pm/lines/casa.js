// pm/lines/casa.js — Casa Amor's return and the photos (pm/casa.js,
// pm/moments.js photos). Data only.
//   casa-host    []            the host opens the return at the fire pit
//   casa-return  [a, (b)]      `of: 'stayed'` — a waited in the villa, alone
//                              (stick) or beside new arrival b (twist).
//                              (`of: 'returned'` is lines/moments.js: the walk-in)
//   casa-react   [a, b, (c)]   the face at the fire pit. `of`:
//                              relief · devastated (b came back with c) ·
//                              both (a waited with someone too; c is b's) ·
//                              turned (a came back alone to b sitting with c)
//   casa-row     [a, b]        a stuck, b didn't: own-it · deny · walk-off
//   photo-text   [a]           the postcards arrive
//   photos       [a, b]        a is looking at a photo of b at Casa
//   photo-row    [a, b]        own-it · deny · walk-off
//   photo-split  [a, b]        a ends it with b
export const CASA_LINES = {
  'casa-host': [
    { id: 'ch.01', turns: [['dior', "Islanders, it's time. The ones who went to Casa Amor are coming back."], ['dior', "And some of you have already made your choice."]] },
    { id: 'ch.02', turns: [['dior', "Welcome to the Casa Amor recoupling."], ['dior', "Each of you will find out, one by one, whether your partner stuck, or twisted."]] },
    { id: 'ch.03', stage: 'The fire pit, lit up, silent.', turns: [['dior', "Tonight, every couple in this villa gets tested. Let's find out who passed."]] },
    { id: 'ch.04', turns: [['dior', "The islanders from Casa Amor are on their way back. They could be alone. They could be with someone new."], ['dior', "And so could you."]] },
  ],
  'casa-return': [
    // the walk back in, alone (a returned; b is the partner waiting)
    { id: 'cs.r.01', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: 'A figure at the top of the steps, alone.', turns: [['narrator', "One islander. No hand to hold. Look at that face at the fire pit."], ['a', "Hi."]], beat: '{b} is already on {b.posAdj} feet.' },
    { id: 'cs.r.02', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: '{a} walks in on {a.posAdj} own, looking straight at {b}.', turns: [['a', "I told you I'd come back."], ['b', "You did. You actually did."]] },
    { id: 'cs.r.03', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: '{a} comes down the steps slowly, alone.', turns: [['a', "All that time, and I didn't even look at anyone."], ['b', "Come here."]] },
    { id: 'cs.r.04', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: '{a} appears at the top of the steps, and stops to find {b} in the crowd.', turns: [['a', "Is that seat still mine?"], ['b', "It never stopped being yours."]] },
    { id: 'cs.r.05', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: 'The door opens. {a} is on {a.posAdj} own.', turns: [['narrator', "Alone. The best word {b} has heard all week."], ['a', "Did you miss me?"], ['b', "Don't even joke."]] },
    { id: 'cs.r.06', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: '{a} walks back in, alone, grinning.', turns: [['a', "Nobody over there even came close."], ['b', "Good. Get over here."]] },
    { id: 'cs.r.07', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'stick' }, stage: '{a} walks in alone, and the whole fire pit exhales at once.', turns: [['a', "I'm back. Just me."], ['b', "Just you is perfect."]] },
    // the walk back in, alone, to a partner who has moved on (the react follows)
    { id: 'cs.r.t1', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'twist' }, stage: '{a} walks in alone, smiling, and then sees {b} on the bench with somebody new.', turns: [['a', "…Oh."]], beat: 'The smile goes, all at once.' },
    { id: 'cs.r.t2', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'twist' }, stage: '{a} comes down the steps on {a.posAdj} own and looks for {b} in the crowd.', turns: [['a', "Why is everyone looking at me like that?"]], beat: 'Then {a} sees who {b} is sitting with.' },
    { id: 'cs.r.t3', when: { of: 'returned', choice: 'stick', withB: true, theirs: 'twist' }, stage: 'The door opens. {a} is on {a.posAdj} own.', turns: [['narrator', "Alone. Loyal. And about to find out that not everybody was."]], beat: '{b} cannot look up.' },
    // the walk back in, with somebody new (a twisted; b is the new one)
    { id: 'cs.w.01', when: { of: 'returned', choice: 'twist', taken: true }, stage: 'Two shadows at the top of the steps.', turns: [['narrator', "Two sets of footsteps. Somebody at the fire pit knows exactly what that means."], ['a', "Hi, everyone. This is {b}."]], beat: '{pa} does not move.' },
    { id: 'cs.w.02', when: { of: 'returned', choice: 'twist', taken: true }, stage: '{a} comes down the steps holding {b.posAdj} hand.', turns: [['a', "I'm sorry. I couldn't pretend."]], beat: '{pa} stares at the floor, and then at {b}.' },
    { id: 'cs.w.03', when: { of: 'returned', choice: 'twist', taken: true }, stage: '{a} and {b} walk in together, and the fire pit goes silent.', turns: [['a', "I know this isn't what you wanted to see."]], beat: '{pa} laughs once, and it is not a laugh.' },
    { id: 'cs.w.04', when: { of: 'returned', choice: 'twist', taken: true }, stage: '{a} stops halfway down the steps with {b}.', turns: [['narrator', "And that is the sound of a couple ending."], ['a', "I had to follow what I felt."]] },
    { id: 'cs.w.05', when: { of: 'returned', choice: 'twist', taken: true }, stage: '{b} walks in first. {a} follows, and cannot look at {pa}.', turns: [['a', "I didn't go there looking for this."]], beat: '{pa} gets up and walks off before anyone can stop them.' },
    { id: 'cs.s.01', when: { of: 'stayed', choice: 'stick' }, stage: '{a} sits alone on the fire pit bench, staring at the steps.', turns: [['a', "I stuck. Whatever happens now, I stuck."]] },
    { id: 'cs.s.02', when: { of: 'stayed', choice: 'stick' }, stage: '{a} waits on the bench with an empty space beside {a.obj}.', turns: [['a', "That space is theirs. I just need them to walk back in and take it."]] },
    { id: 'cs.s.03', when: { of: 'stayed', choice: 'stick' }, stage: '{a} is on {a.posAdj} own at the fire pit, hands shaking.', turns: [['a', "Please come back alone. Please."]] },
    { id: 'cs.s.04', when: { of: 'stayed', choice: 'stick' }, turns: [['a', "I've had days to think about it, and I only thought about one person."]], beat: '{a} keeps looking at the steps.' },
    { id: 'cs.t.01', when: { of: 'stayed', choice: 'twist', withB: true }, stage: '{a} sits at the fire pit, and {b} sits down right beside {a.obj}.', turns: [['a', "I know what this looks like. I've made my choice."]], beat: '{b} takes {a.posAdj} hand.' },
    { id: 'cs.t.02', when: { of: 'stayed', choice: 'twist', withB: true }, stage: '{a} is waiting on the bench, and {b} is next to {a.obj}.', turns: [['b', "Are you sure about this?"], ['a', "No. But I'm sure about how I feel."]] },
    { id: 'cs.t.03', when: { of: 'stayed', choice: 'twist', withB: true }, stage: 'The bench, and {a} next to {b}, not quite looking at the steps.', turns: [['a', "They'll understand. Or they won't. Either way, it's done."]] },
    { id: 'cs.t.04', when: { of: 'stayed', choice: 'twist', withB: true }, turns: [['a', "I didn't think I'd be sitting here with someone new."], ['b', "Do you regret it?"], ['a', "Ask me in five minutes."]] },
  ],
  'casa-react': [
    // relief: both stuck
    { id: 'cr.r.01', when: { of: 'relief' }, turns: [['a', "You came back for me."], ['b', "I was always coming back for you."]], beat: '{b} runs down the last of the steps, straight into {a.posAdj} arms.' },
    { id: 'cr.r.02', when: { of: 'relief' }, turns: [['a', "Oh my God. Oh my God."]], beat: '{a} bursts into tears before {b} has even reached the bench.' },
    { id: 'cr.r.03', when: { of: 'relief' }, turns: [['b', "Did you stick?"], ['a', "Of course I stuck."], ['b', "So did I."]], beat: 'The whole fire pit cheers for them.' },
    { id: 'cr.r.04', when: { of: 'relief' }, turns: [['a', "I've been sick with nerves for days."], ['b', "Never again. I'm not leaving your side again."]] },
    // devastated: b came back with c
    { id: 'cr.d.01', when: { of: 'devastated', cast: 3 }, turns: [['a', "…Wow."], ['b', "I'm sorry."], ['a', "No. Don't. Not in front of everyone."]], beat: '{a} stares at {c} for a long time, and then at the floor.' },
    { id: 'cr.d.02', when: { of: 'devastated', cast: 3 }, turns: [['a', "I sat here on my own. I turned people down for you."], ['b', "I didn't ask you to."], ['a', "You didn't have to ask."]], beat: '{c} looks away.' },
    { id: 'cr.d.03', when: { of: 'devastated', cast: 3 }, turns: [['a', "A few days. That's all it took?"]], beat: '{a} gets up and walks straight into the villa. Nobody follows at first.' },
    { id: 'cr.d.04', when: { of: 'devastated', cast: 3 }, turns: [['a', "I'm not going to cry. I'm not going to cry."]], beat: '{a} cries. Everyone is round {a.obj} in seconds.' },
    { id: 'cr.d.05', when: { of: 'devastated', cast: 3 }, turns: [['a', "Are you serious? With {c}?"], ['b', "I didn't plan it."], ['a', "You didn't plan it. Great. That makes it so much better."]] },
    // both twisted
    { id: 'cr.b.01', when: { of: 'both', cast: 3 }, turns: [['b', "You too?"], ['a', "Don't look at me like that. You walked in holding hands."]], beat: 'The fire pit does not know where to look.' },
    { id: 'cr.b.02', when: { of: 'both', cast: 3 }, turns: [['a', "Well. I suppose that answers that."], ['b', "I suppose it does."]], beat: 'Somebody laughs, nervously, and then stops.' },
    { id: 'cr.b.03', when: { of: 'both', cast: 3 }, turns: [['a', "I thought I was going to feel guilty."], ['b', "And?"], ['a', "And I don't. Not now."]] },
    // turned: a came back alone to b sitting with c
    { id: 'cr.t.01', when: { of: 'turned', cast: 3 }, stage: '{a} walks back in alone, and stops dead at the top of the steps.', turns: [['a', "…No."], ['b', "I'm sorry. I didn't think you'd come back on your own."]], beat: '{a} does not move for a long time.' },
    { id: 'cr.t.02', when: { of: 'turned', cast: 3 }, turns: [['a', "I stayed loyal. For you. And you're sitting there with {c}?"], ['b', "I thought you'd twist."], ['a', "You thought wrong."]] },
    { id: 'cr.t.03', when: { of: 'turned', cast: 3 }, turns: [['a', "I turned down someone amazing because of you."]], beat: '{b} cannot look at {a}. {c} squeezes {b.posAdj} hand.' },
    { id: 'cr.t.04', when: { of: 'turned', cast: 3 }, turns: [['a', "I came back for you. I actually came back for you."], ['b', "I know. I'm so sorry."]], beat: 'The whole villa goes silent.' },
  ],
  'casa-row': [
    { id: 'cw.o.01', when: { of: 'own-it' }, stage: 'Later, by the pool, away from the fire pit.', turns: [
      ['a', "I need to know why."], ['b', "Because I felt something over there I haven't felt here."], ['a', "In a few days?"],
      ['b', "I know how it sounds."], ['a', "It sounds like I wasn't enough."], ['b', "It's not that. It's that it wasn't right."],
      ['a', "It was right for me."]], beat: '{a} walks away before {b} can answer.' },
    { id: 'cw.o.02', when: { of: 'own-it' }, turns: [
      ['b', "I owe you an explanation."], ['a', "You owe me a lot more than that."], ['b', "I'm not going to pretend I didn't mean it."],
      ['a', "At least you're honest now."], ['b', "I should have been honest before I left."], ['a', "Yeah. You should."]] },
    { id: 'cw.o.03', when: { of: 'own-it' }, turns: [
      ['a', "Did you think about me at all?"], ['b', "Every day."], ['a', "Then how?"],
      ['b', "Because thinking about you wasn't the same as feeling it."], ['a', "Wow."], ['b', "I'm sorry. I'm really sorry."]] },
    { id: 'cw.d.01', when: { of: 'deny' }, turns: [
      ['a', "You said you'd come back for me."], ['b', "I didn't know what Casa would be like."], ['a', "That's not an answer."],
      ['b', "I didn't plan any of it."], ['a', "Something happened. You walked back in with them."],
      ['b', "You're making this into something it's not."]], beat: 'Half the villa has to step in.' },
    { id: 'cw.d.02', when: { of: 'deny' }, stage: 'On the terrace, voices carrying across the whole villa.', turns: [
      ['a', "Say it to my face."], ['b', "Say what?"], ['a', "That you got bored of me."],
      ['b', "That's not what happened."], ['a', "Then what did happen?"], ['b', "You wouldn't understand."],
      ['a', "Try me."]] },
    { id: 'cw.w.01', when: { of: 'walk-off' }, turns: [
      ['b', "Can we talk?"], ['a', "You've had days to talk."]], beat: '{a} goes into the dressing room and shuts the door.' },
    { id: 'cw.w.02', when: { of: 'walk-off' }, turns: [
      ['b', "Please. Just let me explain."], ['a', "I don't want your explanation. I want you to leave me alone."]], beat: '{b} stands on the lawn on {b.posAdj} own.' },
  ],
  'photo-text': [
    { id: 'pt.01', turns: [['a', "Islanders, you've got post from Casa Amor. #WishYouWereHere"]], beat: 'An envelope of photos goes round the fire pit.' },
    { id: 'pt.02', stage: "{a}'s phone buzzes.", turns: [['a', "Islanders, the Casa Amor photos have arrived. #PictureThis"]], beat: 'Nobody wants to be the first to look.' },
    { id: 'pt.03', turns: [['a', "I got a text. It says the photos are here."]], beat: 'The whole villa goes quiet, and then everyone crowds round.' },
    { id: 'pt.04', stage: 'A pile of photos sits face down on the fire pit bench.', turns: [['a', "Islanders, please pick up a photo. #PostcardFromCasa"]] },
  ],
  photos: [
    { id: 'ph.2.01', stage: '{a} turns the photo over.', turns: [['a', "Is that you?"], ['b', "Let me see."], ['a', "No. You don't need to see. You were there."]], beat: '{a} drops the photo on the bench.' },
    { id: 'ph.2.02', stage: '{a} holds the photo very still.', turns: [['a', "Look how close you are."], ['b', "We were only talking."], ['a', "Talking doesn't look like that."]] },
    { id: 'ph.2.03', stage: 'The photo goes round the fire pit, and stops at {a}.', turns: [['a', "I thought about you every night that week. And you were doing that."]], beat: '{b} does not say anything.' },
    { id: 'ph.2.04', stage: '{a} stares at the photo, and then at {b}.', turns: [['a', "When was this?"], ['b', "During Casa."], ['a', "While I was sitting there missing you?"]] },
    { id: 'ph.2.05', stage: '{a} laughs at the photo, and it is not a happy laugh.', turns: [['a', "Great. Brilliant. Thanks for that."], ['b', "It's not what it looks like."], ['a', "It's always what it looks like."]] },
    { id: 'ph.2.06', stage: '{a} holds up the photo so the whole fire pit can see it.', turns: [['a', "Anyone want to explain this one? No?"]], beat: '{b} stands up, and then sits back down.' },
  ],
  'photo-row': [
    { id: 'pw.o.01', when: { of: 'own-it' }, turns: [
      ['a', "You let me believe nothing happened."], ['b', "I know. I'm sorry."],
      ['a', "Why didn't you just tell me?"], ['b', "Because I knew I'd lose you."], ['a', "You might lose me anyway."],
      ['b', "I know. I'd rather lose you honestly."]] },
    { id: 'pw.o.02', when: { of: 'own-it' }, stage: 'On the daybeds, the photo still in {a.posAdj} hand.', turns: [
      ['b', "It happened. I'm not going to lie about it."], ['a', "You already did. For days."], ['b', "I still chose you."],
      ['a', "After that?"], ['b', "After that. Maybe because of that. I knew then it was you."]] },
    { id: 'pw.d.01', when: { of: 'deny' }, turns: [
      ['a', "Explain the photo."], ['b', "It's one second. You don't know what happened before or after."], ['a', "So tell me."],
      ['b', "Nothing happened."], ['a', "There's a photo of the nothing."], ['b', "They're trying to cause drama."], ['a', "They didn't have to try very hard."]],
      beat: 'Somebody has to take the photo off {a} before it gets ripped up.' },
    { id: 'pw.d.02', when: { of: 'deny' }, turns: [
      ['b', "You're really going to believe a photo over me?"], ['a', "The photo hasn't lied to me yet."]], beat: 'The fire pit goes very quiet.' },
    { id: 'pw.w.01', when: { of: 'walk-off' }, turns: [
      ['b', "Can I explain?"], ['a', "Not tonight. Not while I'm holding this."]], beat: '{a} walks away, still holding the photo.' },
    { id: 'pw.w.02', when: { of: 'walk-off' }, turns: [
      ['b', "Please."], ['a', "I need to be anywhere you're not."]], beat: '{a} sleeps on the daybed.' },
  ],
  'photo-split': [
    { id: 'px.01', turns: [['a', "We're done. I'm not doing this."], ['b', "Over one photo?"], ['a', "Over one photo, and every day you let me not know about it."]] },
    { id: 'px.02', turns: [['a', "I stuck for you. I'm not sticking any more."]], beat: '{b} watches {a} walk away across the lawn.' },
    { id: 'px.03', turns: [['a', "You had days to be honest, and you let a photo do it for you."], ['b', "I'm sorry."], ['a', "I'm done."]] },
  ],
};

const K = (kind, more = {}) => ({ kind, ...more });
export const CASA_HUT = {
  honest: [
    { id: 'hut.ca.h1', when: K('casa-react', { of: 'relief', role: 0 }), turns: [['a', "When I saw them on their own at the top of the steps, I couldn't breathe."]] },
    { id: 'hut.ca.h2', when: K('casa-react', { of: 'devastated', role: 0 }), turns: [['a', "I've never felt anything like it. Like the ground went."]] },
    { id: 'hut.ca.h3', when: K('casa-react', { of: 'turned', role: 0 }), turns: [['a', "I walked in on my own, proud of myself. That lasted about two seconds."]] },
    { id: 'hut.ca.h4', when: K('casa-return', { of: 'stayed', choice: 'stick', role: 0 }), turns: [['a', "Sitting on that bench on my own was the longest minute of my life."]] },
    { id: 'hut.ca.h5', when: K('photos', { role: 0 }), turns: [['a', "A photo. I found out from a photo."]] },
    { id: 'hut.ca.h6', when: K('photo-row', { of: 'own-it', role: 1 }), turns: [['a', "I should have told them the second I walked back in."]] },
  ],
  'two-faced': [
    { id: 'hut.ca.t1', when: K('casa-return', { of: 'returned', choice: 'stick', role: 0 }), turns: [['a', "I came back on my own. What happened at Casa can stay at Casa."]] },
    { id: 'hut.ca.t2', when: K('photo-row', { of: 'deny', role: 1 }), turns: [['a', "It's one photo. I'm not letting one photo end this."]] },
  ],
};
