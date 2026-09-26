// pm/lines/journey.js — the final dates and the film of each couple's story (pm/journey.js). Data only.
//
//   final-date     [a, b]      their last date. `of`: sunset · yacht · picnic · rooftop
//   journey-open   [a, b]      the film begins. `of` the story's shape:
//                              steady · rocky (a row, a test, the photos) · way-back (split and back) · late (met late)
//   journey-clip   [a, b, (c)] one chapter, the narrator over the footage. `of` the chapter:
//                              night-one · met · date-met · coupled · first-kiss · date · row · tested · casa ·
//                              photos · split · back · at-risk · love · challenge
//                              {day} the day it happened; {quote}/{quoteWho} a line from it (hasQuote);
//                              {about} (c) the third person in it, for tested
//   journey-react  [a, b]      the two of them, watching that chapter back. `of` the chapter.
//   journey-end    [a, b]      the film ends. `of` the shape.
//
// Every chapter is something that happened and aired (pm/journey.js storyOf):
// these lines narrate it and never add to it. The footage's own words are
// the quote; nothing here says what else happened in it.
const N = (id, of, stage, line, more = {}) => ({ id, when: { of, ...(more.when || {}) }, ...(stage ? { stage } : {}), turns: [['narrator', line], ...(more.turns || [])], ...(more.beat ? { beat: more.beat } : {}) });
const Q = { hasQuote: true };

export const JOURNEY_LINES = {
  'final-date': [
    { id: 'fd.01', when: { of: 'sunset' }, stage: '{a} and {b} are taken to a clifftop for their final date. The sun is going down.', turns: [['a', "This is unreal."], ['b', "I can't believe it's the last one."]] },
    { id: 'fd.02', when: { of: 'sunset' }, stage: 'A table for two on a beach, lit by candles, for the final date.', turns: [['b', "Look at this. They've gone all out."], ['a', "We deserve it."]] },
    { id: 'fd.03', when: { of: 'yacht' }, stage: "{a} and {b}'s final date is on a yacht, out on the water.", turns: [['a', "I'm not going to lie, I feel like a film star."], ['b', "You look like one."]] },
    { id: 'fd.04', when: { of: 'yacht' }, stage: 'A boat takes {a} and {b} out for their final date, just the two of them.', turns: [['b', "No villa. No cameras. Well, some cameras."], ['a', "Just us, then."]] },
    { id: 'fd.05', when: { of: 'picnic' }, stage: '{a} and {b} have their final date at a picnic in the hills above the villa.', turns: [['a', "You can see the whole villa from here."], ['b', "It looks so small."]] },
    { id: 'fd.06', when: { of: 'picnic' }, stage: 'A blanket, a basket and a view: the final date.', turns: [['b', "I'm going to miss this place."], ['a', "I'm not going to miss the fire pit."]] },
    { id: 'fd.07', when: { of: 'rooftop' }, stage: "{a} and {b}'s final date is on a rooftop terrace, strung with lights.", turns: [['a', "Okay, this is beautiful."], ['b', "It really is."]] },
    { id: 'fd.08', when: { of: 'rooftop' }, stage: 'The final date: a rooftop, a table for two, and the whole island below them.', turns: [['b', "We made it. We actually made it."], ['a', "We did."]] },
  ],
  'journey-open': [
    { id: 'jo.01', when: { of: 'steady' }, stage: "After dinner, a screen lights up on the table. It's a film of their time in the villa.", turns: [['b', "Oh no. What's this?"], ['a', "It's us."]] },
    { id: 'jo.02', when: { of: 'steady' }, stage: 'A photo album is waiting on the table, with their names on the front.', turns: [['a', "Shall we?"], ['b', "Go on, then."]] },
    { id: 'jo.03', when: { of: 'rocky' }, stage: 'A screen lights up. On it, the words: their journey.', turns: [['b', "I'm scared of what's on this."], ['a', "Same."]] },
    { id: 'jo.04', when: { of: 'rocky' }, stage: 'A film of their time together begins to play.', turns: [['a', "I think I know some of the bits they've put in."], ['b', "So do I."]] },
    { id: 'jo.05', when: { of: 'way-back' }, stage: 'A screen lights up with a film of the two of them.', turns: [['b', "Are they going to show everything?"], ['a', "I think so. All of it."]] },
    { id: 'jo.06', when: { of: 'way-back' }, stage: 'A photo album is waiting on the table. {a} opens it slowly.', turns: [['a', "We've been through a lot, haven't we?"]] },
    { id: 'jo.07', when: { of: 'late' }, stage: 'A screen lights up. Their film is shorter than most, and they both laugh at that.', turns: [['b', "We didn't waste any time, did we?"]] },
    { id: 'jo.08', when: { of: 'late' }, stage: "A photo album with their names on it. It isn't very thick.", turns: [['a', "Quality, not quantity."], ['b', "Exactly."]] },
  ],
  'journey-clip': [
    // how they met
    N('jc.n1', 'night-one', '{quoteWho}: "{quote}"', "Day {day}. The very first night. Nobody knew anybody.", { when: Q }),
    N('jc.n2', 'night-one', 'The footage: night one, the fire pit, and two strangers.', "It started on day {day}, before either of them had even unpacked."),
    N('jc.n3', 'night-one', '{quoteWho}: "{quote}"', "Night one. {a} and {b}. Who knew?", { when: Q }),
    N('jc.m1', 'met', '{quoteWho}: "{quote}"', "Day {day}. The first time {a} and {b} really spoke.", { when: Q }),
    N('jc.m2', 'met', 'The footage: {a} and {b}, still strangers.', "It began, like most things in here, with a chat. Day {day}."),
    N('jc.m3', 'met', '{quoteWho}: "{quote}"', "They didn't know it yet. Day {day}.", { when: Q }),
    N('jc.dm1', 'date-met', '{quoteWho}: "{quote}"', "Day {day}. A new arrival, and a date.", { when: Q }),
    N('jc.dm2', 'date-met', 'The footage: their very first date.', "It began on a date, on day {day}, with a lot of nerves."),
    // coupled
    N('jc.c1', 'coupled', '{quoteWho}: "{quote}"', "Day {day}, at the fire pit. The moment they became a couple.", { when: Q }),
    N('jc.c2', 'coupled', 'The footage: the fire pit, and a name read out.', "On day {day}, they coupled up. Officially, if not yet seriously."),
    N('jc.c3', 'coupled', '{quoteWho}: "{quote}"', "Day {day}. A choice at the fire pit.", { when: Q }),
    // first kiss
    N('jc.k1', 'first-kiss', '{quoteWho}: "{quote}"', "Day {day}. The first kiss.", { when: Q }),
    N('jc.k2', 'first-kiss', 'The footage: {a} and {b}, and their first kiss.', "Day {day}. It took them long enough."),
    N('jc.k3', 'first-kiss', '{quoteWho}: "{quote}"', "And then, on day {day}, it happened.", { when: Q }),
    // a date
    N('jc.d1', 'date', '{quoteWho}: "{quote}"', "Day {day}. A date, just the two of them.", { when: Q }),
    N('jc.d2', 'date', 'The footage: the two of them, alone at last.', "Day {day}. Some time away from everyone else."),
    // the row
    N('jc.r1', 'row', '{quoteWho}: "{quote}"', "It wasn't all sunshine. Day {day}.", { when: Q }),
    N('jc.r2', 'row', 'The footage: raised voices, and the two of them on opposite sides of the garden.', "Day {day}. Their first real argument."),
    N('jc.r3', 'row', '{quoteWho}: "{quote}"', "Day {day}. Things got heated.", { when: Q }),
    // tested
    N('jc.t1', 'tested', 'The footage: {about}, and a conversation somebody was not happy about.', "Day {day}. Then {about} got involved."),
    N('jc.t2', 'tested', '{quoteWho}: "{quote}"', "Day {day}. A test, and {about} was at the centre of it.", { when: Q }),
    N('jc.t3', 'tested', '{quoteWho}: "{quote}"', "Not everyone kept their eyes to themselves. Day {day}.", { when: Q }),
    // Casa Amor
    N('jc.ca1', 'casa', 'The footage: the Casa Amor recoupling, and the gate opening.', "Day {day}. Casa Amor. The biggest test of all."),
    N('jc.ca2', 'casa', '{quoteWho}: "{quote}"', "Day {day}, and the moment everyone had been waiting for.", { when: Q }),
    // the photos
    N('jc.p1', 'photos', 'The footage: a photo, held up at the fire pit.', "Day {day}. The photos from Casa."),
    N('jc.p2', 'photos', '{quoteWho}: "{quote}"', "Day {day}. The photo that nobody wanted to see.", { when: Q }),
    // split, and back
    N('jc.s1', 'split', '{quoteWho}: "{quote}"', "Day {day}. It looked like it was over.", { when: Q }),
    N('jc.s2', 'split', 'The footage: the two of them, apart.', "On day {day}, they called it a day. For a while."),
    N('jc.b1', 'back', '{quoteWho}: "{quote}"', "But on day {day}, they found their way back.", { when: Q }),
    N('jc.b2', 'back', 'The footage: the two of them, together again.', "Day {day}. Second chances."),
    // at risk
    N('jc.ar1', 'at-risk', 'The footage: the fire pit, and two names read out.', "Day {day}. They were at risk, and they held their breath."),
    N('jc.ar2', 'at-risk', '{quoteWho}: "{quote}"', "Day {day}. The night they nearly went home.", { when: Q }),
    // love
    N('jc.l1', 'love', '{quoteWho}: "{quote}"', "Day {day}. The big one.", { when: Q }),
    N('jc.l2', 'love', 'The footage: the two of them, somewhere quiet.', "Day {day}. The words everybody had been waiting for."),
    N('jc.l3', 'love', '{quoteWho}: "{quote}"', "And on day {day}, somebody finally said it.", { when: Q }),
    // a challenge
    N('jc.ch1', 'challenge', '{quoteWho}: "{quote}"', "Day {day}. Not every moment was romantic.", { when: Q }),
    N('jc.ch2', 'challenge', 'The footage: a challenge, and the two of them in the middle of it.', "Day {day}. Challenge day."),
  ],
  'journey-react': [
    { id: 'jr.n1', when: { of: 'night-one' }, turns: [['b', "Look how nervous we were."], ['a', "I was shaking. You couldn't tell?"], ['b', "I could tell."]] },
    { id: 'jr.n2', when: { of: 'night-one' }, turns: [['a', "Did you think it would end up like this?"], ['b', "Not for a second."]] },
    { id: 'jr.n3', when: { of: 'night-one' }, turns: [['b', "That feels like a year ago."], ['a', "It was a few weeks."]] },
    { id: 'jr.m1', when: { of: ['met', 'date-met'] }, turns: [['a', "I remember thinking you were way out of my league."], ['b', "Stop it."]] },
    { id: 'jr.m2', when: { of: ['met', 'date-met'] }, turns: [['b', "I had no idea, back then."], ['a', "Neither did I."]] },
    { id: 'jr.m3', when: { of: ['met', 'date-met'] }, turns: [['a', "Look at my face. I'm trying so hard to play it cool."], ['b', "You were not playing it cool."]] },
    { id: 'jr.c1', when: { of: 'coupled' }, turns: [['b', "The fire pit was terrifying that night."], ['a', "I knew who I was going to pick."]] },
    { id: 'jr.c2', when: { of: 'coupled' }, turns: [['a', "Best decision I made in here."], ['b', "Only decision you made in here."]] },
    { id: 'jr.c3', when: { of: 'coupled' }, turns: [['b', "I didn't know if you'd pick me."], ['a', "I did."]] },
    { id: 'jr.k1', when: { of: 'first-kiss' }, turns: [['a', "Oh no. I can't watch this bit."], ['b', "It was a good kiss!"], ['a', "It was a nervous kiss."]] },
    { id: 'jr.k2', when: { of: 'first-kiss' }, turns: [['b', "I was so nervous before that."], ['a', "You didn't look nervous."], ['b', "I'm a good actor."]] },
    { id: 'jr.k3', when: { of: 'first-kiss' }, turns: [['a', "That's when I knew."], ['b', "Really?"], ['a', "Really."]] },
    { id: 'jr.d1', when: { of: 'date' }, turns: [['b', "That was the first time I felt like it was just us."], ['a', "Same."]] },
    { id: 'jr.d2', when: { of: 'date' }, turns: [['a', "I talked way too much on that date."], ['b', "I liked it."]] },
    { id: 'jr.r1', when: { of: 'row' }, turns: [['b', "Oh God. This one."], ['a', "I'd forgotten how loud we were."], ['b', "I hadn't."]] },
    { id: 'jr.r2', when: { of: 'row' }, turns: [['a', "I'm sorry about that, by the way."], ['b', "You said sorry at the time."], ['a', "I'm saying it again."]] },
    { id: 'jr.r3', when: { of: 'row' }, stage: 'They both go quiet while it plays.', turns: [['b', "We came back from that."], ['a', "We did."]] },
    { id: 'jr.t1', when: { of: 'tested' }, turns: [['b', "I didn't enjoy watching that the first time."], ['a', "I know. I'm sorry."]] },
    { id: 'jr.t2', when: { of: 'tested' }, turns: [['a', "That was a stupid moment."], ['b', 'It was {a}.'], ['a', "You're meant to say it wasn't."]] },
    { id: 'jr.t3', when: { of: 'tested' }, stage: '{b} glances at {a} while it plays.', turns: [['a', "Nothing was ever going to happen."], ['b', "I know that now."]] },
    { id: 'jr.ca1', when: { of: 'casa' }, turns: [['a', "The worst few days in here."], ['b', "The longest few days of my life."]] },
    { id: 'jr.ca2', when: { of: 'casa' }, stage: "{b} takes {a}'s hand before it's even finished.", turns: [['b', "I don't want to watch that bit again."], ['a', "Then don't. Look at me instead."]] },
    { id: 'jr.p1', when: { of: 'photos' }, turns: [['b', "That photo."], ['a', "I know."], ['b', "I still think about it."]] },
    { id: 'jr.p2', when: { of: 'photos' }, stage: 'Neither of them says anything for a moment.', turns: [['a', "I'm glad we got through that."], ['b', "Me too. Just."]] },
    { id: 'jr.s1', when: { of: 'split' }, turns: [['b', "I really thought that was it."], ['a', "So did I."]] },
    { id: 'jr.s2', when: { of: 'split' }, stage: '{a} squeezes {b.posAdj} hand.', turns: [['a', "Those were the worst days in here."], ['b', "For me too."]] },
    { id: 'jr.b1', when: { of: 'back' }, turns: [['a', "Best thing I ever did, coming back to you."], ['b', "You took your time about it."]] },
    { id: 'jr.b2', when: { of: 'back' }, turns: [['b', "I'm so glad we gave it another go."], ['a', "Me too."]] },
    { id: 'jr.ar1', when: { of: 'at-risk' }, turns: [['a', "I've never been so scared at a fire pit."], ['b', "I couldn't feel my legs."]] },
    { id: 'jr.ar2', when: { of: 'at-risk' }, turns: [['b', "We nearly went home that night."], ['a', "And now look at us."]] },
    { id: 'jr.l1', when: { of: 'love' }, stage: '{b} is crying before it has finished.', turns: [['a', "I meant every word."], ['b', "I know you did."]] },
    { id: 'jr.l2', when: { of: 'love' }, turns: [['b', "I'll never forget that."], ['a', "I'm glad it's on camera. Now you can't deny I said it first."]] },
    { id: 'jr.l3', when: { of: 'love' }, turns: [['a', "I was so scared to say it."], ['b', "I'm glad you did."]] },
    { id: 'jr.ch1', when: { of: 'challenge' }, turns: [['a', "What are we doing?"], ['b', "Winning, obviously."]] },
    { id: 'jr.ch2', when: { of: 'challenge' }, stage: "They're both crying with laughter.", turns: [['b', "I forgot about this."], ['a', "I'll never forget this."]] },
  ],
  'journey-end': [
    { id: 'je.01', when: { of: 'steady' }, stage: 'The film ends. {a} and {b} sit for a moment without saying anything.', turns: [['a', "We've been solid since the start, haven't we?"], ['b', "From day one."]] },
    { id: 'je.02', when: { of: 'steady' }, stage: 'The last photo is of the two of them, laughing.', turns: [['b', "That's my favourite one."], ['a', "Mine too."]] },
    { id: 'je.03', when: { of: 'steady' }, turns: [['a', "Watching that, I'd do it all again."], ['b', "Exactly the same way?"], ['a', "Exactly the same way."]] },
    { id: 'je.04', when: { of: 'rocky' }, stage: 'The film ends, and {b} wipes {b.posAdj} eyes.', turns: [['b', "It wasn't easy, was it?"], ['a', "No. But it was worth it."]] },
    { id: 'je.05', when: { of: 'rocky' }, turns: [['a', "We had some bad days in there."], ['b', "And we're still here."], ['a', "We're still here."]] },
    { id: 'je.06', when: { of: 'rocky' }, turns: [['b', "Every time I thought we'd lost it, we didn't."], ['a', "Because we didn't give up."]] },
    { id: 'je.07', when: { of: 'way-back' }, stage: 'The film ends on the two of them, together again.', turns: [['a', "We nearly threw it away."], ['b', "But we didn't."]] },
    { id: 'je.08', when: { of: 'way-back' }, turns: [['b', "If you'd told me after the split that we'd be here…"], ['a', "I wouldn't have believed it either."]] },
    { id: 'je.09', when: { of: 'way-back' }, turns: [['a', "Second chances. Who knew?"], ['b', "Best thing we ever did."]] },
    { id: 'je.10', when: { of: 'late' }, stage: 'The film ends. It was short, and neither of them minds.', turns: [['b', "We only had a few weeks."], ['a', "It was enough."]] },
    { id: 'je.11', when: { of: 'late' }, turns: [['a', "Everyone said we'd come in too late."], ['b', "And here we are."]] },
    { id: 'je.12', when: { of: 'late' }, turns: [['b', "I wish I'd found you sooner."], ['a', "You found me in time."]] },
  ],
  // speech [a, b]: the rest of a's declaration, about one moment of their
  // story (`of` the chapter, as journey-clip), {day} when it was.
  speech: [
    { id: 'sp.back.1', when: { of: 'back' }, turns: [['a', "When we split up, I thought I'd lost the best thing that ever happened to me in here. Getting you back is the thing I'm proudest of."]] },
    { id: 'sp.back.2', when: { of: 'back' }, turns: [['a', "We had our time apart, and it made me realise exactly what I had. I'm never letting that happen again."]] },
    { id: 'sp.casa.1', when: { of: 'casa' }, turns: [['a', "Casa Amor was the hardest few days of my life. But walking back in and seeing your face told me everything I needed to know."]] },
    { id: 'sp.casa.2', when: { of: 'casa' }, turns: [['a', "Everyone said Casa would break us. It didn't. It showed me what we've got."]] },
    { id: 'sp.photos.1', when: { of: 'photos' }, turns: [['a', "I know those photos hurt. I know I hurt you. And you still gave me the chance to show you who I really am."]] },
    { id: 'sp.photos.2', when: { of: 'photos' }, turns: [['a', "After the photos, I didn't know if we'd make it. We did, and that's because of you."]] },
    { id: 'sp.split.1', when: { of: 'split' }, turns: [['a', "There was a moment when it was over. I don't ever want to feel like that again."]] },
    { id: 'sp.risk.1', when: { of: 'at-risk' }, turns: [['a', "Standing at that fire pit on day {day}, waiting for our names, all I could think about was losing you."]] },
    { id: 'sp.risk.2', when: { of: 'at-risk' }, turns: [['a', "We nearly went home. And the only thing I was scared of was not seeing you every day."]] },
    { id: 'sp.row.1', when: { of: 'row' }, turns: [['a', "We've argued. Of course we have. But even when we row, I'd rather be arguing with you than getting on with anyone else."]] },
    { id: 'sp.row.2', when: { of: 'row' }, turns: [['a', "I haven't always got it right. You've called me out when I needed it, and I love you for it."]] },
    { id: 'sp.love.1', when: { of: 'love' }, turns: [['a', "On day {day} I told you how I felt. I meant it then, and I mean it more now."]] },
    { id: 'sp.love.2', when: { of: 'love' }, turns: [['a', "The day I said it out loud was the day this stopped being a game for me."]] },
    { id: 'sp.kiss.1', when: { of: 'first-kiss' }, turns: [['a', "I still think about our first kiss. I was so nervous. I'm still nervous now, if I'm honest."]] },
    { id: 'sp.kiss.2', when: { of: 'first-kiss' }, turns: [['a', "The first time I kissed you, I knew this was going to be something."]] },
    { id: 'sp.n1.1', when: { of: 'night-one' }, turns: [['a', "From the very first night, it was you. I didn't know it then, but I know it now."]] },
    { id: 'sp.n1.2', when: { of: 'night-one' }, turns: [['a', "We met on night one, as strangers. I'm standing here now next to my best friend."]] },
    { id: 'sp.met.1', when: { of: ['met', 'date-met', 'coupled'] }, turns: [['a', "When I first met you, I had no idea you'd end up meaning this much to me."]] },
    { id: 'sp.met.2', when: { of: ['met', 'date-met', 'coupled'] }, turns: [['a', "Day {day} changed everything for me, and I didn't even know it at the time."]] },
    { id: 'sp.row.3', when: { of: 'row' }, turns: [['a', "We don't always agree. But you're the first person I want to make up with, every single time."]] },
    { id: 'sp.row.4', when: { of: 'row' }, turns: [['a', "You've seen me at my worst in here, and you stayed. That means more than anything."]] },
    { id: 'sp.row.5', when: { of: 'row' }, turns: [['a', "Every argument we've had, we've come out the other side closer. I didn't know a couple could do that."]] },
    { id: 'sp.risk.3', when: { of: 'at-risk' }, turns: [['a', "When our names were read out, you held my hand, and I stopped being scared."]] },
    { id: 'sp.kiss.3', when: { of: 'first-kiss' }, turns: [['a', "That first kiss was nothing like I expected. It was better."]] },
    { id: 'sp.casa.3', when: { of: 'casa' }, turns: [['a', "I had the chance to walk away at Casa, and I didn't want it. I only wanted you."]] },
    { id: 'sp.met.3', when: { of: ['met', 'date-met', 'coupled'] }, turns: [['a', "I didn't come in here looking for you. I'm so glad I found you anyway."]] },
    { id: 'sp.n1.3', when: { of: 'night-one' }, turns: [['a', "I've known you since the first day. It feels like I've known you my whole life."]] },
  ],
  // The declarations, from the shape of the story (moments.js final).
  declaration: [
    { id: 'dec.s1', when: { of: 'steady' }, stage: '{a} stands up at the fire pit.', turns: [['a', "{b}, from the first night, it's been you. No doubts, no drama. Just you. And I don't want this to end when we leave."]], beat: '{b} is crying, and laughing.' },
    { id: 'dec.s2', when: { of: 'steady' }, stage: '{a} takes a deep breath.', turns: [['a', "Everyone in here has had their ups and downs. We just had ups. I didn't know it could be this easy with someone."]] },
    { id: 'dec.r1', when: { of: 'rocky' }, stage: '{a} turns to {b}.', turns: [['a', "It hasn't been easy, and I know some of that was me. But every time it got hard, you were the one I wanted to fix it with."]], beat: '{b} reaches for {a.posAdj} hand.' },
    { id: 'dec.r2', when: { of: 'rocky' }, stage: '{a} stands, and the fire pit goes quiet.', turns: [['a', "We've argued. We've been tested. And after all of it, I'm standing here, and I'd choose you again. Every time."]] },
    { id: 'dec.w1', when: { of: 'way-back' }, stage: '{a} looks at {b} for a long time before speaking.', turns: [['a', "I lost you once in here, and it was the worst feeling I've ever had. I'm not going to lose you again."]], beat: 'The villa, watching from the benches, loses it.' },
    { id: 'dec.w2', when: { of: 'way-back' }, turns: [['a', "We split up. We came back. And we came back stronger. {b}, thank you for giving me a second chance."]] },
    { id: 'dec.l1', when: { of: 'late' }, stage: '{a} stands up, a little nervous.', turns: [['a', "We didn't have as long as everyone else. But I'd take our few weeks over anybody's whole summer."]] },
    { id: 'dec.l2', when: { of: 'late' }, turns: [['a', "{b}, you walked in and everything changed. I wasn't looking for you, and I found you anyway."]], beat: '{b} laughs through the tears.' },
    { id: 'dec.g1', stage: '{a} stands up and takes {b.posAdj} hands.', turns: [['a', "{b}, I've been thinking about what to say all day, and it all comes down to this: I'm so lucky it's you."]] },
    { id: 'dec.g2', stage: '{a} stands up, already emotional.', turns: [['a', "I came in here not knowing what I wanted. I'm leaving knowing exactly who I want."]] },
    { id: 'dec.g3', turns: [['a', "{b}, you've made this the best summer of my life. And I don't want it to stop when we leave."]], beat: '{b} wipes {b.posAdj} eyes.' },
    { id: 'dec.g4', stage: '{a} looks at {b} for a moment before speaking.', turns: [['a', "You make me laugh every single day. You make me feel safe. I didn't know I'd find both in here."]] },
    { id: 'dec.g5', stage: '{a} gets up to speak, and the villa goes quiet.', turns: [['a', "I'm not going to pretend I planned this. I just know that whatever happens tonight, I've already won."]] },
    { id: 'dec.g6', turns: [['a', "{b}, thank you for being patient with me, for being honest with me, and for picking me."]] },
    { id: 'dec.r3', when: { of: 'rocky' }, stage: '{a} stands up and turns to {b}.', turns: [['a', "We haven't had it easy. We've had the rows, the tests, all of it. And I'd go through every one of them again to end up here with you."]] },
    { id: 'dec.r4', when: { of: 'rocky' }, turns: [['a', "People kept waiting for us to fall apart. We never did."]], beat: 'Somebody on the benches whoops.' },
    { id: 'dec.s3', when: { of: 'steady' }, turns: [['a', "From the first week, I've never once doubted us. Not once."]] },
    { id: 'dec.w3', when: { of: 'way-back' }, stage: '{a} stands, and takes a breath.', turns: [['a', "We found our way back to each other when everybody said we wouldn't. That's how I know this is real."]] },
    { id: 'dec.l3', when: { of: 'late' }, turns: [['a', "I only had a few weeks with you in here. I want every week after this."]] },
  ],
};

// Second lines for the final's film (season 202: four couples, three of them
// "rocky", heard the same opening, reaction and ending in one episode).
export const JOURNEY_MORE = {
  'journey-open': [
    { id: 'jo.09', when: { of: 'steady' }, stage: 'The lights go down, and the film begins with their names.', turns: [['b', "I'm going to cry, aren't I?"], ['a', "Definitely."]] },
    { id: 'jo.10', when: { of: 'steady' }, stage: 'A screen by the table flickers on.', turns: [['a', "Is this all of it?"], ['b', "I hope it's the good bits."]] },
    { id: 'jo.11', when: { of: 'rocky' }, stage: 'The film starts, and {b} reaches for {a.posAdj} hand straight away.', turns: [['b', "Whatever's on here, we're here now."], ['a', "We're here now."]] },
    { id: 'jo.12', when: { of: 'rocky' }, stage: 'Their names come up on the screen.', turns: [['a', "Do we have to watch the hard parts?"], ['b', "I think the hard parts are the point."]] },
    { id: 'jo.13', when: { of: 'rocky' }, stage: 'The screen lights up. {a} takes a deep breath.', turns: [['a', "Okay. Let's see how bad it was."], ['b', "It wasn't that bad."], ['a', "Some of it was."]] },
    { id: 'jo.14', when: { of: 'way-back' }, stage: 'The film begins, and they both go quiet.', turns: [['b', "I'm glad we're watching this together."]] },
    { id: 'jo.15', when: { of: 'way-back' }, turns: [['a', "There's a bit in here I'm not proud of."], ['b', "There's a bit in here we both got through."]] },
    { id: 'jo.16', when: { of: 'late' }, stage: 'The screen lights up with a film of the two of them. It begins late in the summer.', turns: [['a', "We got here fast."], ['b', "We got here right."]] },
    { id: 'jo.17', when: { of: 'late' }, turns: [['b', "Everyone else had weeks. We had days."], ['a', "And look at us."]] },
  ],
  'journey-end': [
    { id: 'je.13', when: { of: 'steady' }, turns: [['b', "No wobbles. Not really."], ['a', "Not really. A couple of small ones."]], beat: 'They both laugh.' },
    { id: 'je.14', when: { of: 'rocky' }, stage: 'The screen goes dark, and neither of them lets go.', turns: [['a', "I'm glad we didn't walk away."], ['b', "So am I."]] },
    { id: 'je.15', when: { of: 'rocky' }, turns: [['b', "We should be proud of that."], ['a', "Of all of it?"], ['b', "Of getting to the end of it."]] },
    { id: 'je.16', when: { of: 'rocky' }, stage: 'The last frame is the two of them at the fire pit.', turns: [['a', "Every hard bit made this better."]] },
    { id: 'je.17', when: { of: 'way-back' }, turns: [['a', "We found our way back. Not many people do."], ['b', "Not many people are us."]] },
    { id: 'je.18', when: { of: 'late' }, turns: [['b', "Short film."], ['a', "Best film."]], beat: '{b} kisses {a.obj}.' },
  ],
  'journey-react': [
    { id: 'jr.c4', when: { of: 'coupled' }, turns: [['a', "Look at us, standing there."], ['b', "We had no idea."]] },
    { id: 'jr.c5', when: { of: 'coupled' }, turns: [['b', "Do you remember your face when my name came out?"], ['a', "I remember yours."]] },
    { id: 'jr.k4', when: { of: 'first-kiss' }, turns: [['b', "Watching that back is so strange."], ['a', "Good strange?"], ['b', "Very good strange."]] },
    { id: 'jr.k5', when: { of: 'first-kiss' }, turns: [['a', "I'd wanted to do that for days."], ['b', "I could tell."]] },
    { id: 'jr.m4', when: { of: ['met', 'date-met'] }, turns: [['a', "Is that really the first thing I said to you?"], ['b', "It was. And it worked."]] },
    { id: 'jr.n4', when: { of: 'night-one' }, turns: [['b', "Night one. Look how nervous we were."], ['a', "I'm still nervous."]] },
    { id: 'jr.r4', when: { of: 'row' }, turns: [['b', "We sorted it, though."], ['a', "We always did."]] },
    { id: 'jr.t4', when: { of: 'tested' }, turns: [['a', "That was a test."], ['b', "And we passed. Eventually."]] },
    { id: 'jr.l4', when: { of: 'love' }, turns: [['a', "I meant it. I still mean it."], ['b', "I know you do."]] },
  ],
};

// The shapes the final gives by what was the couple's own (journey.js
// shapesOf): survivors (at risk again and again), held (Casa could not touch
// them), slow-burn (met early, together late).
export const JOURNEY_SHAPES = {
  'journey-open': [
    { id: 'jo.cm1', when: { of: 'casa-made' }, stage: 'The film starts at Casa Amor, the night they met.', turns: [['b', "Look at you walking in."], ['a', "Look at you pretending you weren't looking."]] },
    { id: 'jo.cm2', when: { of: 'casa-made' }, turns: [['a', "Everyone said Casa couples never last."], ['b', "Everyone says a lot of things."]] },
    { id: 'jo.cm3', when: { of: 'casa-made' }, stage: 'A screen lights up with a film of the two of them. It begins halfway through the summer.', turns: [['b', "We came in late to this."], ['a', "We came in at the right time."]] },
    { id: 'jo.sv1', when: { of: 'survivors' }, stage: 'The film begins at the fire pit. It comes back to the fire pit a lot.', turns: [['b', "How many times were we at risk?"], ['a', "Too many."]] },
    { id: 'jo.sv2', when: { of: 'survivors' }, stage: 'A screen lights up with their names.', turns: [['a', "Every week, I thought this was it."], ['b', "And every week it wasn't."]] },
    { id: 'jo.sv3', when: { of: 'survivors' }, turns: [['b', "Is this going to be all fire pits?"], ['a', "Probably. We spent enough time at it."]] },
    { id: 'jo.hd1', when: { of: 'held' }, stage: 'The film starts, and it starts with the two of them apart: Casa Amor.', turns: [['a', "I know how this bit ends."], ['b', "So do I. With you."]] },
    { id: 'jo.hd2', when: { of: 'held' }, turns: [['b', "Everyone said Casa would get us."], ['a', "Everyone was wrong."]] },
    { id: 'jo.hd3', when: { of: 'held' }, stage: 'A photo album with their names on the front, and one photo from each villa inside.', turns: [['a', "Two villas, and still us."]] },
    { id: 'jo.sb1', when: { of: 'slow-burn' }, stage: 'The film opens on the first week, with the two of them barely talking.', turns: [['b', "Look at us. We had no idea."], ['a', "You had no idea. I had some idea."]] },
    { id: 'jo.sb2', when: { of: 'slow-burn' }, turns: [['a', "It took us so long, didn't it?"], ['b', "We got there."]] },
    { id: 'jo.sb3', when: { of: 'slow-burn' }, stage: 'A screen lights up. The first clip is from weeks before they coupled up.', turns: [['b', "Were we friends first?"], ['a', "We were friends first."]] },
  ],
  'journey-end': [
    { id: 'je.cm1', when: { of: 'casa-made' }, turns: [['b', "Casa was meant to break couples up."], ['a', "It made one."]] },
    { id: 'je.cm2', when: { of: 'casa-made' }, stage: 'The last photo is from the night they walked back into the villa together.', turns: [['a', "Everyone was staring."], ['b', "Let them stare."]] },
    { id: 'je.cm3', when: { of: 'casa-made' }, turns: [['a', "I nearly didn't come back with you."], ['b', "I know. I'm glad you did."]] },
    { id: 'je.sv1', when: { of: 'survivors' }, turns: [['a', "They kept putting us up there, and we kept coming back down together."], ['b', "Every time."]] },
    { id: 'je.sv2', when: { of: 'survivors' }, stage: 'The film ends on them at the fire pit, still holding hands.', turns: [['b', "I don't think I'll ever be able to sit at a fire pit again."], ['a', "We'll get one for the garden."]] },
    { id: 'je.sv3', when: { of: 'survivors' }, turns: [['a', "Nobody thought we'd make it to the final."], ['b', "We did."]] },
    { id: 'je.hd1', when: { of: 'held' }, turns: [['b', "Three days apart, and all I did was miss you."], ['a', "Same. The whole time."]] },
    { id: 'je.hd2', when: { of: 'held' }, stage: 'The last photo is the two of them on the bench, the night they both came back alone.', turns: [['a', "That's my favourite night in here."]] },
    { id: 'je.hd3', when: { of: 'held' }, turns: [['a', "If Casa couldn't do it, nothing can."], ['b', "Don't jinx it."]] },
    { id: 'je.sb1', when: { of: 'slow-burn' }, turns: [['a', "Worth the wait?"], ['b', "Every day of it."]] },
    { id: 'je.sb2', when: { of: 'slow-burn' }, stage: 'The film ends where it began, with the two of them laughing.', turns: [['b', "We were friends first. I think that's why it works."]] },
    { id: 'je.sb3', when: { of: 'slow-burn' }, turns: [['a', "I think I knew before you did."], ['b', "You definitely did."]] },
  ],
  declaration: [
    { id: 'dec.cm1', when: { of: 'casa-made' }, stage: '{a} stands up and turns to {b}.', turns: [['a', "Nobody gave us a chance. A Casa couple, they said. Give it a week. And here we are, in the final. I'm not going anywhere."]] },
    { id: 'dec.cm2', when: { of: 'casa-made' }, turns: [['a', "I walked into a villa full of strangers, and you were the one that made it feel like home."]], beat: '{b} squeezes {a.posAdj} hand.' },
    { id: 'dec.sv1', when: { of: 'survivors' }, stage: '{a} stands up at the fire pit, where they have stood so many times.', turns: [['a', "{b}, every week they put us up there, and every week I'd have chosen you all over again. I'm not scared of this fire pit any more. I've got you."]] },
    { id: 'dec.sv2', when: { of: 'survivors' }, stage: '{a} takes {b}\'s hands.', turns: [['a', "We've been at risk more times than anyone. And every time, the only thing I was scared of was losing you."]], beat: '{b} is already crying.' },
    { id: 'dec.hd1', when: { of: 'held' }, stage: '{a} turns to {b}.', turns: [['a', "When you went to Casa, everyone told me to be ready for the worst. I sat on that bench, and you walked back in alone. I'll never forget that."]] },
    { id: 'dec.hd2', when: { of: 'held' }, turns: [['a', "We had every reason to give up and we didn't even think about it. That's what I want. That, for as long as you'll have me."]] },
    { id: 'dec.sb1', when: { of: 'slow-burn' }, stage: '{a} stands up and laughs before saying anything.', turns: [['a', "{b}, you were my friend before you were anything else. It took us ages. I wouldn't change a single day."]] },
    { id: 'dec.sb2', when: { of: 'slow-burn' }, turns: [['a', "I don't know when it happened. Somewhere between the first week and now, you became my favourite person."]], beat: '{b} covers {b.posAdj} face.' },
  ],
};
