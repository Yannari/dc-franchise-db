// pm/lines/arcs.js — six storylines over several episodes (pm/arcs.js). Data only.
//
//   betray-see      [a, b, c]     a finds out friend b went for c (a's one). `of`: saw · told
//   betray-confront [a, b, c]     a and b, about c. `of` is b's answer: sorry · defends · cold
//   betray-end      [a, b]        the friendship. `of`: mended · over
//   mugged-low      [a, b]        a to friend b: always the one left
//   found-love      [a, b]        b finally picks a, and means it
//   villa-happy     [a, b, c]     a is happy for friend b and c
//   redeem-reflect  [a, b]        a admits it to b. `of`: sincere · for-show
//   redeem-act      [a, b]        a says sorry to b, whom a wronged. `of`: accepted · refused
//   redeem-doubt    [a, b, c]     a and b aren't sure c's change is real
//   grass-talk      [a, b, c]     a and b about c, who tells everyone everything
//   grass-frozen    [a, b]        a walks in and it goes quiet; friend b
//   grass-confront  [a, b]        a, whom b told on, has it out. `of`: owns · sorry (b's answer)
//   parents-named   [a, b, c]     c calls couple a and b the villa's mum and dad
//   parents-advice  [a, b, c]     c comes to a and b. `of`: crush · feud · heartbreak · general
//   parents-mediate [a, b, c]     a steps between b and c. `of`: works · fails
//   parents-wobble  [a, b]        the villa parents row
//   exw-stir        [a, b, c]     a to friend b about ex c, who has walked in. `of`: still · over
//   exw-partner     [a, b, c]     a asks partner b about b's ex c
//   exw-talk        [a, b]        exes a and b talk. `of`: spark · closure · row
//   exw-back        [a, b]        a second chance
//
// The exes' past is only what the record holds: that they were together.
// Nothing here says where, or why it ended.
export const ARC_LINES = {
  'betray-see': [
    { id: 'bs2.s.01', when: { of: 'saw' }, stage: '{a} comes out of the dressing room and stops. {b} is with {c}.', turns: [
      ['a', "You're joking."], ['b', "It's not what it looks like."],
      ['a', "It looks exactly like what it is."]], beat: '{a} turns round and walks back inside.' },
    { id: 'bs2.s.02', when: { of: 'saw' }, stage: 'From across the lawn, {a} watches {b} with {c}.', turns: [
      ['a', "Of all the people in here."], ['b', "{a}, wait."],
      ['a', "You knew. You knew how I felt about {c}."]] },
    { id: 'bs2.s.03', when: { of: 'saw' }, stage: '{a} walks up just as {b} and {c} pull apart.', turns: [
      ['a', "My best friend in here. Really?"], ['b', "Let me explain."],
      ['a', "I don't want an explanation. I want a friend."]], beat: 'Nobody on the terrace moves.' },
    { id: 'bs2.t.01', when: { of: 'told' }, stage: 'In the dressing room, {a} turns round from the mirror to face {b}.', turns: [
      ['a', "Is it true? About you and {c}?"], ['b', "Who told you?"],
      ['a', "So it is true."], ['b', "It's not like that."]] },
    { id: 'bs2.t.02', when: { of: 'told' }, stage: '{a} finds {b} by the pool.', turns: [
      ['a', "I had to hear it from someone else. About {c}."], ['b', "I was going to tell you."],
      ['a', "When?"], ['b', "I don't know. Soon."]], beat: '{a} laughs once, and walks off.' },
    { id: 'bs2.t.03', when: { of: 'told' }, stage: 'On the swing seat, {a} sits down next to {b} without a word.', turns: [
      ['a', "I heard about {c}."], ['b', "{a}…"],
      ['a', "Don't. I just want to know if you thought about me at all."]] },
  ],

  'betray-confront': [
    // sorry
    { id: 'bc2.s.01', when: { of: 'sorry' }, stage: '{a} and {b}, on their own, on the terrace.', turns: [
      ['a', "Why {c}?"], ['b', "I didn't plan it. I'm so sorry."],
      ['a', "You should have come to me first."], ['b', "I know. I should have. I'm sorry."]] },
    { id: 'bc2.s.02', when: { of: 'sorry' }, stage: '{b} finds {a} in the kitchen.', turns: [
      ['b', "I've been sick about it all day."], ['a', "Good."],
      ['b', "You mean more to me than {c} does."], ['a', "Then why did you do it?"], ['b', "I don't have a good answer."]] },
    { id: 'bc2.s.03', when: { of: 'sorry' }, stage: 'By the fire pit, {b} can\'t look at {a}.', turns: [
      ['a', "Say something."], ['b', "I messed up. With you, not with {c}."],
      ['a', "That's the first right thing you've said."]] },
    // defends
    { id: 'bc2.d.01', when: { of: 'defends' }, stage: 'On the lawn, {a} goes straight up to {b}.', turns: [
      ['a', "You went behind my back."], ['b', "You weren't even with {c}."],
      ['a', "That's not the point and you know it."], ['b', "I'm allowed to like who I like."]], beat: 'Everyone on the daybeds has stopped talking.' },
    { id: 'bc2.d.02', when: { of: 'defends' }, stage: 'In the dressing room, it gets loud.', turns: [
      ['a', "Friends don't do that."], ['b', "Friends don't tell each other who they can talk to."],
      ['a', "Talk? Is that what you call it?"], ['b', "I'm not doing this with you."]] },
    { id: 'bc2.d.03', when: { of: 'defends' }, stage: 'At the fire pit, {a} and {b} face each other.', turns: [
      ['b', "{c} came to me. I didn't go looking."], ['a', "You could have said no."],
      ['b', "Why would I say no?"], ['a', "Because of me."]] },
    // cold
    { id: 'bc2.c.01', when: { of: 'cold' }, stage: '{a} tries to talk to {b} by the pool.', turns: [
      ['a', "Are we going to talk about {c}?"], ['b', "There's nothing to talk about."],
      ['a', "There's everything to talk about."], ['b', "Not for me."]], beat: '{b} puts {b.posAdj} sunglasses on and lies back.' },
    { id: 'bc2.c.02', when: { of: 'cold' }, stage: 'In the kitchen, {b} carries on making a drink.', turns: [
      ['a', "Do you even care?"], ['b', "It's a villa. These things happen."],
      ['a', "Not to friends, they don't."]] },
  ],

  'betray-end': [
    { id: 'be.m.01', when: { of: 'mended' }, stage: '{a} sits down next to {b} on the swing.', turns: [
      ['a', "I miss you."], ['b', "I miss you too."],
      ['a', "No more secrets."], ['b', "No more secrets. I promise."]], beat: 'They hug, and the whole garden relaxes.' },
    { id: 'be.m.02', when: { of: 'mended' }, stage: '{b} brings {a} a tea in the morning.', turns: [
      ['b', "Peace offering."], ['a', "I'm still annoyed with you."],
      ['b', "I know."], ['a', "…Come here."]] },
    { id: 'be.m.03', when: { of: 'mended' }, stage: 'In the dressing room, {a} hands {b} a hairbrush without being asked.', turns: [
      ['b', "Are we okay?"], ['a', "We're getting there."], ['b', "I'll take getting there."]] },
    { id: 'be.o.01', when: { of: 'over' }, stage: 'On the terrace, {a} finally says it.', turns: [
      ['a', "I can't be your friend after that."], ['b', "So that's it?"],
      ['a', "That's it."]], beat: '{b} watches {a} walk away.' },
    { id: 'be.o.02', when: { of: 'over' }, stage: 'In the dressing room, {a} moves {a.posAdj} things to the other end of the mirror.', turns: [
      ['b', "Really?"], ['a', "Really."], ['b', "We used to be close."], ['a', "Used to be."]] },
    { id: 'be.o.03', when: { of: 'over' }, stage: '{b} tries once more by the pool.', turns: [
      ['b', "Can we just talk?"], ['a', "We talked. I've heard enough."]], beat: "They don't speak again that day." },
  ],

  'mugged-low': [
    { id: 'ml.01', stage: '{a} is sitting on {a.posAdj} own by the pool. {b} sits down.', turns: [
      ['a', "Why is it always me?"], ['b', "What do you mean?"],
      ['a', "Every time, I'm the one left. Every single time."], ['b', "It's not you. Honestly."], ['a', "It feels like it's me."]] },
    { id: 'ml.02', stage: 'In the dressing room, {a} puts the brush down.', turns: [
      ['a', "I'm starting to think nobody in here is going to pick me."], ['b', "Don't say that."],
      ['a', "It's true, though, isn't it?"], ['b', "Your person just hasn't walked in yet."]] },
    { id: 'ml.03', stage: 'On the daybeds, {b} gives {a} a hug.', turns: [
      ['a', "I'm so tired of being the back-up."], ['b', "You're nobody's back-up."],
      ['a', "Then why does it keep happening?"]], beat: "{b} doesn't have an answer, and holds on." },
    { id: 'ml.04', stage: 'By the fire pit, after everyone else has gone in.', turns: [
      ['a', "I keep giving people my all, and they keep choosing someone else."], ['b', "They're the ones missing out."],
      ['a', "You have to say that."], ['b', "I don't. I mean it."]] },
  ],

  'found-love': [
    { id: 'fl.01', stage: 'On the swing seat, {b} takes {a}\'s hand.', turns: [
      ['b', "I'm not going anywhere. You know that?"], ['a', "Nobody's ever said that to me in here."],
      ['b', "Well, I'm saying it."], ['a', "I don't know what to do with that."], ['b', "You don't have to do anything."]],
      beat: '{a} is smiling so hard {a} has to look away.' },
    { id: 'fl.02', stage: '{b} finds {a} by the pool.', turns: [
      ['b', "I'd pick you first. Every time."], ['a', "You don't have to say that."],
      ['b', "I'm not saying it because I have to."]], beat: '{a} bursts into tears, and laughs at {a.ref} for it.' },
    { id: 'fl.03', stage: 'On the terrace, {a} and {b} have been talking for an hour.', turns: [
      ['a', "I'd sort of given up."], ['b', "On what?"],
      ['a', "On this. On someone actually wanting me back."], ['b', "I want you back. A lot."]] },
    { id: 'fl.04', stage: '{b} kisses {a} in front of everyone at the fire pit.', turns: [
      ['a', "What was that for?"], ['b', "So everyone knows."],
      ['a', "Knows what?"], ['b', "That I'm not letting you be the one left again."]] },
  ],

  'villa-happy': [
    { id: 'vh.01', stage: '{a} grabs {b} in the dressing room.', turns: [
      ['a', "Look at you! You're glowing."], ['b', "Stop."],
      ['a', "No! After everything, you deserve this."], ['b', "I think I actually do."]] },
    { id: 'vh.02', stage: 'On the daybeds, {a} watches {b} and {c} laughing.', turns: [
      ['a', "I've never seen {b} this happy in here."], ['c', "Me neither."],
      ['a', "Look after {b}. Please."], ['c', "I will."]] },
    { id: 'vh.03', stage: '{a} hugs {b} at the kitchen island.', turns: [
      ['a', "I told you, didn't I? I told you your person would walk in."], ['b', "You did."],
      ['a', "I'm always right."]], beat: '{b} laughs, and doesn\'t argue.' },
  ],

  'redeem-reflect': [
    { id: 'rr2.s.01', when: { of: 'sincere' }, stage: 'On the roof terrace, {a} is quiet for a long time.', turns: [
      ['a', "I don't like who I've been in here."], ['b', "What do you mean?"],
      ['a', "I've hurt people. I didn't come here to do that."], ['b', "Then do something about it."], ['a', "I'm going to."]] },
    { id: 'rr2.s.02', stage: 'By the pool, {a} sits down next to {b}.', when: { of: 'sincere' }, turns: [
      ['a', "Be honest with me. How have I come across?"], ['b', "Honestly? Not great."],
      ['a', "Yeah. I thought so."], ['b', "It's not too late."]] },
    { id: 'rr2.s.03', when: { of: 'sincere' }, stage: 'In the dressing room, {a} stops getting ready.', turns: [
      ['a', "My family are watching this."], ['b', "And?"],
      ['a', "And I wouldn't be proud of me."]], beat: '{b} squeezes {a.posAdj} shoulder.' },
    { id: 'rr2.f.01', when: { of: 'for-show' }, stage: 'On the daybed, {a} leans in to {b}.', turns: [
      ['a', "I need to turn this round. People think I'm the bad guy."], ['b', "Do you think you're the bad guy?"],
      ['a', "I think I need to say sorry to a few people."], ['b', "Because you mean it, or because of how it looks?"], ['a', "Does it matter?"]] },
    { id: 'rr2.f.02', when: { of: 'for-show' }, stage: 'In the kitchen, {a} talks to {b} quietly.', turns: [
      ['a', "If I apologise, it'll all blow over."], ['b', "That's not really what an apology is."],
      ['a', "It is if it works."]] },
  ],

  'redeem-act': [
    { id: 'ra.a.01', when: { of: 'accepted' }, stage: '{a} asks {b} for a chat on the swing.', turns: [
      ['a', "I was out of order with you. I'm sorry. Properly sorry."], ['b', "I didn't think you'd ever say that."],
      ['a', "Neither did I, if I'm honest."], ['b', "Thank you. We're okay."]], beat: 'They hug. Across the garden, a few of the others notice.' },
    { id: 'ra.a.02', when: { of: 'accepted' }, stage: 'At the fire pit, {a} stands up in front of everyone and turns to {b}.', turns: [
      ['a', "I owe you an apology, and I wanted everyone to hear it."], ['b', "Wow. Okay."],
      ['a', "I got it wrong. I'm sorry."], ['b', "I accept it."]] },
    { id: 'ra.a.03', when: { of: 'accepted' }, stage: '{a} brings {b} a drink by the pool.', turns: [
      ['a', "No agenda. I just want to say I'm sorry."], ['b', "You mean it?"],
      ['a', "I mean it."], ['b', "Then fine. Clean slate."]] },
    { id: 'ra.r.01', when: { of: 'refused' }, stage: '{a} asks {b} for a chat.', turns: [
      ['a', "I'm sorry for how I've been."], ['b', "Are you, though?"],
      ['a', "I am."], ['b', "I'll believe it when I see it."]], beat: '{b} walks off. {a} stays where {a} is.' },
    { id: 'ra.r.02', when: { of: 'refused' }, stage: 'In the kitchen, {a} tries.', turns: [
      ['a', "Can we start again?"], ['b', "No. You don't get to decide that."],
      ['a', "I'm trying here."], ['b', "Try harder, then."]] },
  ],

  'redeem-doubt': [
    { id: 'rd.01', stage: 'On the daybeds, {a} and {b} watch {c} apologising to someone.', turns: [
      ['a', "Do you buy it?"], ['b', "Not really."],
      ['a', "Me neither. Bit convenient, isn't it?"], ['b', "Very convenient."]] },
    { id: 'rd.02', stage: 'In the dressing room, {a} lowers {a.posAdj} voice.', turns: [
      ['a', "{c} has suddenly turned nice."], ['b', "I noticed."],
      ['a', "It's for the cameras."], ['b', "Maybe. Or maybe {c} actually means it."], ['a', "I'll wait and see."]] },
    { id: 'rd.03', stage: 'By the pool, {a} shakes {a.posAdj} head.', turns: [
      ['a', "People don't change that fast."], ['b', "Give {c} a chance."],
      ['a', "I gave {c} a chance. Look what happened."]] },
  ],

  'grass-talk': [
    { id: 'gt.01', stage: 'In the kitchen, {a} makes sure {c} isn\'t in earshot.', turns: [
      ['a', "Have you noticed everything goes straight back to {c}?"], ['b', "Now you say it."],
      ['a', "Every time something happens, {c} is the one telling everyone."], ['b', "I'm not telling {c} anything any more."]] },
    { id: 'gt.02', stage: 'On the sunbeds, {a} and {b} talk quietly.', turns: [
      ['b', "Be careful what you say around {c}."], ['a', "Why?"],
      ['b', "Because it'll be round the whole villa by dinner."]] },
    { id: 'gt.03', stage: 'By the fire pit, {a} leans over to {b}.', turns: [
      ['a', "{c} can't keep anything to {c.ref}."], ['b', "Some people would say that's honest."],
      ['a', "Some people would say it's stirring."]] },
    { id: 'gt.04', stage: 'The dressing room. {a} shuts the door.', turns: [
      ['a', "Right. Nobody say anything in front of {c}."], ['b', "Is it that bad?"],
      ['a', "Everything I've told {c} has come back to me from someone else."]] },
  ],

  'grass-frozen': [
    { id: 'gf.01', stage: '{a} walks into the kitchen, and the conversation stops.', turns: [
      ['a', "What?"], ['b', "Nothing."],
      ['a', "It's clearly something."], ['b', "It's nothing. Honestly."]], beat: '{a} gets a drink and walks out again.' },
    { id: 'gf.02', stage: 'On the daybeds, {a} sits down with {b}.', turns: [
      ['a', "Why does everyone go quiet when I come over?"], ['b', "Do they?"],
      ['a', "You know they do."], ['b', "Maybe people think you'll repeat things."], ['a', "I only say what's true."]] },
    { id: 'gf.03', stage: 'In the dressing room, {a} watches the others stop talking.', turns: [
      ['a', "Am I being left out of something?"], ['b', "It's not like that."],
      ['a', "It feels exactly like that."]] },
  ],

  'grass-confront': [
    { id: 'gc2.o.01', when: { of: 'owns' }, stage: '{a} walks straight up to {b} on the lawn.', turns: [
      ['a', "You told everyone. About me."], ['b', "I told the truth."],
      ['a', "It wasn't yours to tell."], ['b', "If you didn't want people to know, you shouldn't have done it."]],
      beat: 'Half the lawn is watching.' },
    { id: 'gc2.o.02', when: { of: 'owns' }, stage: 'At the fire pit, {a} turns to {b}.', turns: [
      ['a', "Why is it always you running round telling everyone?"], ['b', "Because somebody has to be honest in here."],
      ['a', "Honest? You tell on everyone."], ['b', "Better that than lying."]] },
    { id: 'gc2.s.01', when: { of: 'sorry' }, stage: '{a} finds {b} in the kitchen.', turns: [
      ['a', "You went and told everyone."], ['b', "I know. I shouldn't have."],
      ['a', "Why did you?"], ['b', "I thought I was helping. I wasn't. I'm sorry."]] },
    { id: 'gc2.s.02', when: { of: 'sorry' }, stage: 'On the swing, {a} sits next to {b}.', turns: [
      ['a', "I trusted you."], ['b', "I know. I'm going to keep my mouth shut from now on."],
      ['a', "That'd be a start."]] },
  ],

  'parents-named': [
    { id: 'pn.01', stage: 'At breakfast, {c} puts an arm round {a} and {b}.', turns: [
      ['c', "You two are basically the villa's {~mum} and dad."], ['a', "Excuse me?"],
      ['c', "Everyone comes to you. You're the parents."], ['b', "I'll take it."]], beat: 'The whole kitchen laughs, and it sticks.' },
    { id: 'pn.02', stage: 'On the terrace, {c} watches {a} and {b} settle an argument between two others.', turns: [
      ['c', "Thanks, {~Mum}. Thanks, Dad."], ['a', "Don't."],
      ['c', "You love it."], ['b', "We do, a bit."]] },
    { id: 'pn.03', stage: 'By the pool, {c} flops down next to {a} and {b}.', turns: [
      ['c', "Right. I need advice. Where are the villa parents?"], ['a', "Here, apparently."],
      ['b', "Office hours are nine till five."]] },
  ],

  'parents-advice': [
    { id: 'pa.c.01', when: { of: 'crush' }, stage: '{c} sits down with {a} and {b} on the daybed.', turns: [
      ['c', "I really like someone, and I don't know if they like me back."], ['a', "Have you told them?"],
      ['c', "No."], ['b', "Then that's your answer. Tell them."]] },
    { id: 'pa.c.02', when: { of: 'crush' }, stage: 'In the kitchen, {c} catches {a} and {b}.', turns: [
      ['c', "Should I go for it?"], ['a', "What's the worst that can happen?"],
      ['c', "They say no."], ['b', "Then you know. And you move on."]] },
    { id: 'pa.f.01', when: { of: 'feud' }, stage: '{c} finds {a} and {b} by the fire pit.', turns: [
      ['c', "I can't stop being angry."], ['a', "You're allowed to be angry."],
      ['b', "But it's eating you up. Is it worth it?"], ['c', "…No. Probably not."]] },
    { id: 'pa.f.02', when: { of: 'feud' }, stage: 'On the terrace, {c} sits between {a} and {b}.', turns: [
      ['c', "Every time I see them, I want to scream."], ['b', "Then don't look at them."],
      ['a', "Focus on you. That's all you can do."]] },
    { id: 'pa.h.01', when: { of: 'heartbreak' }, stage: '{a} and {b} find {c} crying in the dressing room.', turns: [
      ['a', "Come here."], ['c', "I'm fine."],
      ['b', "You're not fine, and that's okay."], ['c', "It just really hurts."], ['a', "We know. We've got you."]] },
    { id: 'pa.h.02', when: { of: 'heartbreak' }, stage: 'By the pool, {c} leans on {b}.', turns: [
      ['c', "Will it stop hurting?"], ['b', "It will. Not today. But it will."],
      ['a', "And we'll be here the whole time."]] },
    { id: 'pa.g.01', when: { of: 'general' }, stage: '{c} sits down with {a} and {b} on the swing.', turns: [
      ['c', "How do you two make it look so easy?"], ['a', "It's not easy."],
      ['b', "We just talk. About everything."], ['c', "That's it?"], ['a', "That's most of it."]] },
    { id: 'pa.g.02', when: { of: 'general' }, stage: 'In the kitchen, {c} watches {a} and {b} make breakfast together.', turns: [
      ['c', "I want what you two have."], ['b', "You'll get it."],
      ['c', "When?"], ['a', "When you stop looking so hard."]] },
  ],

  'parents-mediate': [
    { id: 'pm2.w.01', when: { of: 'works' }, stage: '{a} sits {b} and {c} down on the terrace.', turns: [
      ['a', "Right. Nobody's leaving until you two have talked."], ['b', "There's nothing to say."],
      ['a', "There's loads to say. Go on."], ['c', "…I didn't mean for it to get this bad."], ['b', "Me neither."]],
      beat: 'By the end, they are both nearly smiling.' },
    { id: 'pm2.w.02', when: { of: 'works' }, stage: 'At the fire pit, {a} stands between {b} and {c}.', turns: [
      ['a', "You're both good people. You've just got it wrong with each other."], ['c', "Maybe."],
      ['b', "Maybe."], ['a', "Shake on it."]], beat: 'They do.' },
    { id: 'pm2.f.01', when: { of: 'fails' }, stage: '{a} tries to get {b} and {c} in the same room.', turns: [
      ['a', "Can you two just talk?"], ['b', "Stay out of it."],
      ['a', "I'm trying to help."], ['c', "Nobody asked you to."]], beat: '{a} holds {a.posAdj} hands up and walks away.' },
    { id: 'pm2.f.02', when: { of: 'fails' }, stage: 'In the kitchen, {a} steps between {b} and {c}.', turns: [
      ['a', "Come on. This isn't you."], ['b', "It is today."],
      ['c', "Leave it. It's not worth it."]] },
  ],

  'parents-wobble': [
    { id: 'pw2.01', stage: 'On the terrace, {a} and {b} are arguing, and the whole villa can hear.', turns: [
      ['a', "Don't talk to me like that."], ['b', "Like what?"],
      ['a', "Like I'm one of the people you give advice to."]], beat: 'Down by the pool, everyone has gone quiet.' },
    { id: 'pw2.02', stage: 'In the bedroom, {a} and {b} have their backs to each other.', turns: [
      ['a', "Everyone's looking at us."], ['b', "Let them look."],
      ['a', "They think we're perfect."], ['b', "Nobody's perfect."]] },
    { id: 'pw2.03', stage: 'At breakfast, {a} and {b} sit at opposite ends of the table.', turns: [
      ['a', "Can you pass the milk?"], ['b', "It's right there."]], beat: 'The whole table looks from one to the other.' },
  ],

  'exw-stir': [
    { id: 'es.s.01', when: { of: 'still' }, stage: 'In the dressing room, {a} can\'t stop looking out of the window at {c}.', turns: [
      ['b', "You're staring."], ['a', "I'm not."],
      ['b', "You are. Do you still like {c}?"], ['a', "…I don't know. Maybe."]] },
    { id: 'es.s.02', when: { of: 'still' }, stage: 'On the daybed, {a} tells {b} quietly.', turns: [
      ['a', "I thought I was over {c}."], ['b', "And?"],
      ['a', "And then {c} walked back in, and I wasn't."]] },
    { id: 'es.s.03', when: { of: 'still' }, stage: 'By the pool, {a} watches {c} laughing with the others.', turns: [
      ['a', "It's so weird having {c} back."], ['b', "Weird good or weird bad?"],
      ['a', "That's the problem. I don't know."]] },
    { id: 'es.o.01', when: { of: 'over' }, stage: 'On the terrace, {b} asks {a} straight out.', turns: [
      ['b', "How do you feel, with {c} back?"], ['a', "Honestly? Fine. That's done."],
      ['b', "Really?"], ['a', "Really. We were together. We're not now."]] },
    { id: 'es.o.02', when: { of: 'over' }, stage: 'In the kitchen, {a} shrugs at {b}.', turns: [
      ['b', "Is it awkward?"], ['a', "A bit. But I'm not going back there."]] },
  ],

  'exw-partner': [
    { id: 'ep2.01', stage: '{a} finds {b} on the swing.', turns: [
      ['a', "Should I be worried about {c}?"], ['b', "No. Why would you be?"],
      ['a', "Because you were with {c}. And now {c} is back."], ['b', "That's over."], ['a', "Is it?"]] },
    { id: 'ep2.02', stage: 'By the fire pit, {a} watches {b} talking to {c}.', turns: [
      ['a', "What were you two talking about?"], ['b', "Nothing. Just catching up."],
      ['a', "You looked very caught up."]] },
    { id: 'ep2.03', stage: 'In the bedroom, {a} turns over to face {b}.', turns: [
      ['a', "Promise me you're not going back to {c}."], ['b', "I promise."],
      ['a', "Say it like you mean it."], ['b', "I promise."]], beat: "{a} doesn't sleep for a long time." },
  ],

  'exw-talk': [
    { id: 'et.s.01', when: { of: 'spark' }, stage: '{a} and {b} end up alone on the roof terrace.', turns: [
      ['a', "So. Here we are again."], ['b', "Here we are."],
      ['a', "I didn't think I'd feel like this, seeing you."], ['b', "Like what?"], ['a', "Like we never stopped."]] },
    { id: 'et.s.02', when: { of: 'spark' }, stage: 'By the pool, late, {a} sits down next to {b}.', turns: [
      ['b', "Do you ever think about us?"], ['a', "All the time."],
      ['b', "Me too."]], beat: "Neither of them moves away." },
    { id: 'et.c.01', when: { of: 'closure' }, stage: 'On the swing, {a} and {b} finally talk.', turns: [
      ['a', "I'm glad we can do this. Just talk."], ['b', "Me too. It's better like this."],
      ['a', "Friends?"], ['b', "Friends."]] },
    { id: 'et.c.02', when: { of: 'closure' }, stage: 'In the kitchen, {a} and {b} make a coffee together.', turns: [
      ['b', "We weren't right for each other."], ['a', "No. But I'm glad it was you, for a bit."],
      ['b', "Same."]] },
    { id: 'et.r.01', when: { of: 'row' }, stage: 'On the terrace, it starts quietly and gets loud.', turns: [
      ['a', "You walked back in here like nothing happened."], ['b', "What did you want me to do?"],
      ['a', "Anything. An apology would be nice."], ['b', "I've got nothing to apologise for."]], beat: 'The whole villa is watching now.' },
    { id: 'et.r.02', when: { of: 'row' }, stage: 'In the dressing room, {a} turns round to {b}.', turns: [
      ['a', "So you're really back."], ['b', "Don't start."],
      ['a', "I haven't even started."]] },
  ],

  'exw-back': [
    { id: 'eb2.01', stage: '{a} takes {b}\'s hand at the fire pit.', turns: [
      ['a', "I don't want to lose you twice."], ['b', "Then don't."],
      ['a', "Second chance?"], ['b', "Second chance."]], beat: 'Somebody on the benches whoops.' },
    { id: 'eb2.02', stage: 'On the terrace, {b} kisses {a}.', turns: [
      ['a', "Is this a good idea?"], ['b', "Probably not."],
      ['a', "Do it again, then."]] },
    { id: 'eb2.03', stage: 'By the pool, {a} and {b} can\'t stop smiling.', turns: [
      ['a', "We're doing this, then?"], ['b', "We're doing this. Properly this time."]] },
  ],
};
