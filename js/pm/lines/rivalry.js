// pm/lines/rivalry.js — two after the same one, and the crush that isn't
// returned (pm/rivalry.js). Data only.
//
// Casts:
//   rival-shade     [a, b, c]  a throws shade at rival b over c. `of`: behind (said to
//                              the others, loud enough for b to hear) · face
//   rival-play      [a, b, c]  a goes for b, in front of rival c. `of`: interrupt · play · fair
//   code-call       [a, b, c]  a calls b out for going after c's partner
//   rival-row       [a, b, c]  rivals a and b, over c. `of`: row · clear-air
//   rival-step-back [a, b, c]  a stops competing for c. `of`: friend (b is a's friend) · to-rival (b is the rival)
//   rival-won       [a, b, c]  c chose a over b. `of`: gracious · bitter
//   crush-confide   [a, b, c]  a tells friend b about c. `of`: go-for-it · careful
//   crush-watch     [a, b, c]  a watches b with b's partner c. `of`: hurt · catty
//   crush-move      [a, b]     a goes for b. `of`: let-down · friend-zone · leads-on · maybe
//   crush-plea      [a, b]     a is b's partner and asks for more. `of`: warmer · colder
//   crush-over      [a, b]     a is done waiting for b. `of`: moving-on · led-on
//
// Real conversations: an opening, a turn, a landing. The catty lines are
// catty in plain words, never clever ones. Nothing here names a past the
// engine didn't record: "the way you are with {c}", never "last night".
export const RIVALRY_LINES = {
  'rival-shade': [
    // behind: said to the others, loud enough for b to hear
    { id: 'rs.b.01', when: { of: 'behind' }, stage: '{a} is on the daybeds with the others, not keeping {a.posAdj} voice down.', turns: [
      ['a', "I'm just saying, {b} is trying way too hard with {c}."], ['a', "It's a bit embarrassing, isn't it?"],
      ['b', "I can hear you, you know."], ['a', "Good."]], beat: 'Nobody on the daybeds knows where to look.' },
    { id: 'rs.b.02', when: { of: 'behind' }, stage: 'In the kitchen, {a} leans over to the others while {b} is at the fridge.', turns: [
      ['a', "Has anyone noticed {b} laughs at everything {c} says?"], ['a', "Everything. Even the stuff that isn't funny."],
      ['b', "Do you want to say that to me?"], ['a', "I just did."]] },
    { id: 'rs.b.03', when: { of: 'behind' }, stage: '{a} is doing {a.posAdj} make-up in the dressing room. {b} is two mirrors down.', turns: [
      ['a', "Some people in here need to realise {c} isn't interested."], ['b', "Is that about me?"],
      ['a', "If it was about you, I'd say your name."], ['b', "You basically did."]], beat: '{b} puts {b.posAdj} brush down and walks out.' },
    { id: 'rs.b.04', when: { of: 'behind', archetype: ['villain', 'mastermind', 'schemer'] }, stage: '{a} sits down next to the others and smiles.', turns: [
      ['a', "I think it's sweet, honestly. {b} following {c} round like that."], ['a', "Someone should tell {b} it's not working."],
      ['b', "Someone should tell you to mind your own business."], ['a', "Touchy."]], beat: '{a} goes back to {a.posAdj} drink, still smiling.' },
    { id: 'rs.b.05', when: { of: 'behind' }, stage: 'By the pool, {a} talks to the others without looking at {b}.', turns: [
      ['a', "I'm not worried about {b}. At all."], ['b', "Then why are you talking about me?"],
      ['a', "I'm not. I'm talking about {c}."], ['b', "Same thing, apparently."]] },
    { id: 'rs.b.06', when: { of: 'behind' }, stage: '{a} watches {b} walk over to {c}, and says it to the whole terrace.', turns: [
      ['a', "Here we go again."], ['b', "What's that supposed to mean?"],
      ['a', "It means every time I sit with {c}, you appear."], ['b', "I'm allowed to talk to people."], ['a', "Talk to someone else, then."]] },
    { id: 'rs.b.07', when: { of: 'behind', archetype: ['villain', 'mastermind', 'schemer'] }, stage: '{a} makes sure {c} is close enough to hear.', turns: [
      ['a', "I'd just be careful, that's all. {b} says one thing to you and another thing to everyone else."],
      ['b', "That's a lie and you know it."], ['a', "Then you've got nothing to worry about."]],
      beat: '{c} looks from one to the other, and says nothing.' },

    // face: straight to b
    { id: 'rs.f.01', when: { of: 'face' }, stage: '{a} walks straight up to {b} on the lawn.', turns: [
      ['a', "Can I be honest with you?"], ['b', "Go on."], ['a', "I like {c}. I'm not going to pretend I don't."],
      ['b', "Neither am I."], ['a', "Then we both know where we stand."]] },
    { id: 'rs.f.02', when: { of: 'face' }, stage: '{a} catches {b} on the way back from {c}.', turns: [
      ['a', "You know I'm getting to know {c}, right?"], ['b', "I know. So am I."],
      ['a', "I'm just saying. I'm not going anywhere."], ['b', "Me neither."]], beat: 'They stare at each other, then walk off in different directions.' },
    { id: 'rs.f.03', when: { of: 'face' }, stage: '{a} sits down right next to {b}.', turns: [
      ['a', "Do you actually like {c}, or do you just like the attention?"], ['b', "Wow."],
      ['a', "It's a fair question."], ['b', "It's a rude question."], ['a', "You haven't answered it."]] },
    { id: 'rs.f.04', when: { of: 'face', archetype: 'hothead' }, stage: '{a} walks across the garden to {b}, arms folded.', turns: [
      ['a', "Every time I turn round, you're all over {c}."], ['b', "I'm not all over anyone."],
      ['a', "I've got eyes."], ['b', "Then use them to look at someone else."]], beat: 'Half the garden has gone quiet.' },
    { id: 'rs.f.05', when: { of: 'face' }, stage: 'In the kitchen, {a} and {b} reach for the same glass.', turns: [
      ['a', "After you. You like getting there first, don't you?"], ['b', "What's that meant to mean?"],
      ['a', "You know exactly what it means."], ['b', "If you've got something to say about {c}, say it."], ['a', "I just did."]] },
    { id: 'rs.f.06', when: { of: 'face' }, stage: '{a} stops {b} by the steps.', turns: [
      ['a', "Just so you know, {c} told me I'm the one {c} wants to get to know."], ['b', "Funny. {c} told me the same thing."],
      ['a', "Did {c}?"], ['b', "Maybe you should ask."]], beat: '{a} goes straight to find {c}.' },
  ],

  'rival-play': [
    // interrupt: straight into b's chat with the rival
    { id: 'rp.i.01', when: { of: 'interrupt' }, stage: '{c} is on the daybed with {b}. {a} walks straight over.', turns: [
      ['a', "Sorry, can I borrow {b} for a minute?"], ['c', "We're in the middle of something."],
      ['a', "It won't take long."], ['b', "…Yeah, go on."]], beat: "{c} watches them go, and doesn't look away." },
    { id: 'rp.i.02', when: { of: 'interrupt' }, stage: '{a} sits down between {b} and {c} on the swing.', turns: [
      ['a', "What are we talking about?"], ['c', "We were talking. Just us."],
      ['a', "Well, now it's the three of us."], ['b', "Okay, this is awkward."]] },
    { id: 'rp.i.03', when: { of: 'interrupt' }, stage: '{a} walks up with two drinks while {c} is talking to {b}.', turns: [
      ['a', "I got you one."], ['b', "Oh. Thanks."], ['c', "I was just about to get {b} a drink."],
      ['a', "Too late."]], beat: '{c} gets up and goes back inside.' },
    { id: 'rp.i.04', when: { of: 'interrupt' }, stage: '{c} is mid-sentence when {a} takes {b} by the hand.', turns: [
      ['a', "Come with me. I want to show you something."], ['c', "Seriously?"],
      ['a', "It'll be two minutes."], ['c', "It's never two minutes."]] },
    { id: 'rp.i.05', when: { of: 'interrupt' }, stage: 'The terrace. {c} and {b} are laughing, and {a} walks up.', turns: [
      ['a', "Can I get a chat?"], ['b', "Now?"], ['a', "Now."], ['c', "Don't mind me, then."]], beat: '{b} goes with {a}. {c} goes very quiet.' },

    // play: making the move, with c watching
    { id: 'rp.p.01', when: { of: 'play' }, stage: 'On the lawn, where {c} can see, {a} sits down close to {b}.', turns: [
      ['a', "I'll be honest. You're the one I'm here for."], ['b', "That's a lot."],
      ['a', "I know. I don't do things by halves."], ['b', "Clearly."]], beat: 'From the other side of the lawn, {c} is watching every second.' },
    { id: 'rp.p.02', when: { of: 'play' }, stage: '{a} brings {b} breakfast on the daybed while {c} is still in the kitchen.', turns: [
      ['b', "What's this for?"], ['a', "Nothing. I wanted to."], ['b', "You didn't have to."],
      ['a', "I know. That's why it counts."]] },
    { id: 'rp.p.03', when: { of: 'play' }, stage: '{a} pulls {b} aside by the pool, and {c} sees them go.', turns: [
      ['a', "I just want to know if I'm wasting my time."], ['b', "You're not wasting your time."],
      ['a', "Then show me."]], beat: '{b} kisses {a} on the cheek. {c} sees it.' },
    { id: 'rp.p.04', when: { of: 'play' }, stage: '{a} makes {b} laugh so loud the whole garden turns round, {c} included.', turns: [
      ['b', "Stop. Stop, I can't breathe."], ['a', "I'm not even trying."],
      ['b', "That's the worrying bit."]] },
    { id: 'rp.p.05', when: { of: 'play' }, stage: 'At the fire pit, {a} goes to sit next to {b}, taking the seat {c} was heading for.', turns: [
      ['a', "Is this seat free?"], ['b', "It is now."], ['c', "I was about to sit there."],
      ['a', "Plenty of other seats."]] },

    // fair: straight, no digs
    { id: 'rp.f.01', when: { of: 'fair' }, stage: '{a} asks {b} for a chat, in front of everyone.', turns: [
      ['a', "I know {c} likes you too. I'm not going to go behind anyone's back."], ['b', "I appreciate that."],
      ['a', "But I'm not going to hide how I feel either."], ['b', "I wouldn't want you to."]] },
    { id: 'rp.f.02', when: { of: 'fair' }, stage: 'On the swing seat, {a} and {b} talk while {c} does lengths in the pool.', turns: [
      ['a', "Whatever happens, I want you to pick whoever makes you happy."], ['b', "Even if it isn't you?"],
      ['a', "Even if it isn't me. I'd just rather it was."]] },
    { id: 'rp.f.03', when: { of: 'fair' }, stage: '{a} finds {b} alone by the fire pit.', turns: [
      ['a', "I'm not going to slag anyone off to get you."], ['b', "Good. I've had enough of that."],
      ['a', "I just want you to know I'm here, and I'm serious."], ['b', "I know you are."]] },
    { id: 'rp.f.04', when: { of: 'fair' }, stage: '{a} goes over to {b} and {c} together.', turns: [
      ['a', "I'm not trying to cause drama. I like {b}, and I think everyone knows it."], ['c', "At least you're honest."],
      ['a', "May as well be."], ['b', "Right. Okay. Thanks, I think."]] },
  ],

  'code-call': [
    { id: 'cd.01', when: { gender: 'f' }, stage: '{a} marches over to {b} on the lawn.', turns: [
      ['a', "What happened to girl code?"], ['b', "I haven't done anything."],
      ['a', "You've been all over {c}'s partner all day."], ['b', "We were talking."], ['a', "Talking? Right."]],
      beat: '{c} is standing right behind {a}.' },
    { id: 'cd.02', when: { gender: 'm' }, stage: '{a} pulls {b} away from the others.', turns: [
      ['a', "{~Mate}, that's {c}'s partner."], ['b', "I know that."],
      ['a', "Then what are you doing?"], ['b', "Getting to know people. That's what we're here for."], ['a', "Not like that, you're not."]] },
    { id: 'cd.03', stage: '{a} stands up at the fire pit so everyone can hear.', turns: [
      ['a', "I'm sorry, but I have to say it. You knew they were together, and you went for it anyway."],
      ['b', "They're not married."], ['c', "Wow."], ['a', "That's all you've got to say?"]], beat: 'The fire pit goes silent.' },
    { id: 'cd.04', when: { gender: 'f' }, stage: 'In the dressing room, {a} turns round from the mirror.', turns: [
      ['a', "I'd never do that to another girl. Never."], ['b', "I didn't do anything to anyone."],
      ['a', "Ask {c} how it felt watching you."], ['c', "It felt horrible, actually."]] },
    { id: 'cd.05', when: { gender: 'm' }, stage: 'By the gym, {a} stops {b}.', turns: [
      ['a', "{c} is one of my boys. I'm not having it."], ['b', "It's not your business."],
      ['a', "It is when it's {c}."], ['b', "Fine. Noted."]], beat: "{b} walks off. {a} doesn't take {a.posAdj} eyes off {b.obj}." },
    { id: 'cd.06', stage: '{a} sits down next to {b}, very calm.', turns: [
      ['a', "I'm not having a go. I just think you should know how it looks."], ['b', "How does it look?"],
      ['a', "Like you don't care who gets hurt."], ['b', "That's not fair."], ['a', "Then prove it."]] },
    { id: 'cd.07', stage: '{a} walks up while {b} is still talking to {c}.', turns: [
      ['a', "Can I ask you something, {b}? Would you like it if someone did that to you?"],
      ['b', "Did what?"], ['c', "Don't play dumb."], ['b', "I'm not playing anything."]] },
  ],

  'rival-row': [
    // row: it comes out
    { id: 'rr.r.01', when: { of: 'row' }, stage: 'It starts by the pool and gets louder.', turns: [
      ['a', "You've been stirring things with {c} all day."], ['b', "I haven't said a word about you."],
      ['a', "Everyone's told me what you said."], ['b', "Then everyone's lying."], ['a', "All of them?"]],
      beat: 'Two of the others have to step in.' },
    { id: 'rr.r.02', when: { of: 'row' }, stage: 'Across the garden, {a} shouts over to {b}.', turns: [
      ['a', "Say it to my face!"], ['b', "Fine. You're desperate."], ['a', "I'm desperate? You've been following {c} round for days!"],
      ['b', "At least {c} actually talks to me."]], beat: 'The whole villa has stopped what it was doing.' },
    { id: 'rr.r.03', when: { of: 'row' }, stage: 'In the kitchen, {a} slams a cupboard shut.', turns: [
      ['b', "Is there a problem?"], ['a', "You're the problem."], ['b', "Because {c} sat with me at dinner?"],
      ['a', "Because you smirked at me the whole way through."], ['b', "I wasn't smirking."], ['a', "You're smirking now!"]] },
    { id: 'rr.r.04', when: { of: 'row' }, stage: 'On the terrace, {a} and {b} are face to face.', turns: [
      ['a', "I've been nice to you since day one."], ['b', "Nice? You've been talking about me to everyone."],
      ['a', "Because of how you've been with {c}."], ['b', "{c} can make up {c.posAdj} own mind."], ['a', "Not with you in {c.posAdj} ear all day."]],
      beat: '{c} gets up and walks away from both of them.' },
    { id: 'rr.r.05', when: { of: 'row' }, stage: 'It kicks off on the daybeds, in front of everyone.', turns: [
      ['b', "Why are you always looking at me like that?"], ['a', "Like what?"],
      ['b', "Like I've done something to you."], ['a', "You know what you've done."], ['b', "I like {c}. That's not a crime."]] },
    { id: 'rr.r.06', when: { of: 'row' }, stage: '{b} storms into the dressing room after {a}.', turns: [
      ['b', "Don't walk away from me."], ['a', "I'm not doing this now."],
      ['b', "You started it."], ['a', "And I'm finishing it. Leave {c} alone."]], beat: '{a} walks out. The door bangs behind {a.obj}.' },

    // clear-air: they sort it
    { id: 'rr.c.01', when: { of: 'clear-air' }, stage: 'The next morning, {a} sits down next to {b} with two teas.', turns: [
      ['a', "I'm sorry for shouting. It's got nothing to do with you personally."], ['b', "I know. It's a weird situation."],
      ['a', "It is. We both like the same person."], ['b', "May the best one win, then."]] },
    { id: 'rr.c.02', when: { of: 'clear-air' }, stage: '{a} finds {b} by the pool.', turns: [
      ['a', "Can we talk? Properly, without everyone watching."], ['b', "Yeah. I'd like that."],
      ['a', "I don't want to fall out over {c}."], ['b', "Me neither. It's not worth it."]], beat: 'They hug, awkwardly, and then properly.' },
    { id: 'rr.c.03', when: { of: 'clear-air' }, stage: 'On the daybeds, {a} and {b} end up alone.', turns: [
      ['b', "This is stupid, isn't it?"], ['a', "Completely."], ['b', "Truce?"],
      ['a', "Truce. But I'm still not giving up on {c}."], ['b', "Wouldn't expect you to."]] },
    { id: 'rr.c.04', when: { of: 'clear-air' }, stage: '{a} goes over to {b} in front of the others.', turns: [
      ['a', "I've been out of order. I'm sorry."], ['b', "I've been a bit much too."],
      ['a', "Whatever {c} decides, we're fine. Yeah?"], ['b', "Yeah. We're fine."]] },
  ],

  'rival-step-back': [
    // friend: a tells a friend
    { id: 'sb.f.01', when: { of: 'friend' }, stage: '{a} sits down next to {b} on the swing.', turns: [
      ['a', "I'm done."], ['b', "Done with what?"], ['a', "Fighting over {c}. I'm not going to be in competition with someone for a person."],
      ['b', "Are you sure?"], ['a', "I'm sure. If {c} wants me, {c} knows where I am."]] },
    { id: 'sb.f.02', when: { of: 'friend' }, stage: 'In the dressing room, {a} takes {a.posAdj} earrings out.', turns: [
      ['a', "I'm stepping back from {c}."], ['b', "Why? You really like {c}."],
      ['a', "I do. But I like myself more."], ['b', "Good for you."]] },
    { id: 'sb.f.03', when: { of: 'friend' }, stage: '{a} and {b} are lying on the sunbeds.', turns: [
      ['a', "I don't want to spend my time in here chasing someone."], ['b', "So you're walking away?"],
      ['a', "I'm not walking away. I'm just not running after anyone."], ['b', "That's fair."]] },
    { id: 'sb.f.04', when: { of: 'friend' }, stage: 'By the fire pit, {a} is very quiet.', turns: [
      ['b', "What's going on?"], ['a', "I think I have to let {c} go."], ['b', "Because of the other one?"],
      ['a', "Because {c} hasn't picked me. And that tells me enough."]], beat: '{b} puts an arm round {a}.' },
    // to-rival: a says it to the rival
    { id: 'sb.r.01', when: { of: 'to-rival' }, stage: '{a} goes over to {b}.', turns: [
      ['a', "I'm not going to get in your way with {c} any more."], ['b', "Really?"],
      ['a', "Really. It's not worth us falling out."], ['b', "Thank you. I mean that."]] },
    { id: 'sb.r.02', when: { of: 'to-rival' }, stage: '{a} catches {b} alone in the kitchen.', turns: [
      ['a', "You can have {c}."], ['b', "It's not like that."], ['a', "It is a bit like that. I'm out. Good luck."],
      ['b', "…Thanks."]], beat: "{a} walks off before {b} can say anything else." },
  ],

  'rival-won': [
    // gracious
    { id: 'rw.g.01', when: { of: 'gracious' }, stage: 'After the recoupling, {b} goes over to {a}.', turns: [
      ['b', "Congratulations. Honestly."], ['a', "Are you okay?"],
      ['b', "I will be. {c} made the choice. That's that."], ['a', "Thank you for being like this."]] },
    { id: 'rw.g.02', when: { of: 'gracious' }, stage: '{b} holds {b.posAdj} hand out to {a}.', turns: [
      ['b', "No hard feelings."], ['a', "Really?"], ['b', "Really. Look after {c}."],
      ['a', "I will."]] },
    { id: 'rw.g.03', when: { of: 'gracious' }, stage: 'The terrace, later. {b} sits with {a} for a minute.', turns: [
      ['b', "I'm upset, if I'm honest."], ['a', "I'm sorry."], ['b', "Don't be. I'd have done the same."],
      ['a', "Friends?"], ['b', "Friends."]] },
    { id: 'rw.g.04', when: { of: 'gracious' }, stage: '{b} gives {a} a hug on the way back from the fire pit.', turns: [
      ['b', "You two look good together. I mean it."], ['a', "That means a lot, coming from you."]] },
    // bitter
    { id: 'rw.b.01', when: { of: 'bitter' }, stage: 'After the recoupling, {b} walks straight past {a}.', turns: [
      ['a', "Can we talk?"], ['b', "There's nothing to talk about. You won."],
      ['a', "It wasn't a competition."], ['b', "It was to you."]], beat: '{b} goes to bed early.' },
    { id: 'rw.b.02', when: { of: 'bitter' }, stage: 'In the kitchen, {b} watches {a} and {c} together.', turns: [
      ['b', "Give it a week."], ['a', "Sorry?"], ['b', "Give it a week, and {c} will be looking at someone else."],
      ['a', "Is that what you're hoping?"], ['b', "It's what I'm expecting."]] },
    { id: 'rw.b.03', when: { of: 'bitter' }, stage: 'At the fire pit, {b} watches {c} sit down next to {a}.', turns: [
      ['b', "Enjoy it while it lasts."], ['c', "What's that meant to mean?"],
      ['b', "Nothing. Nothing at all."]], beat: '{a} squeezes {c.posAdj} hand and keeps looking at the fire.' },
    { id: 'rw.b.04', when: { of: 'bitter' }, stage: '{b} is on the daybeds with the others when {a} walks past.', turns: [
      ['b', "Here comes the winner."], ['a', "Don't be like that."],
      ['b', "Like what? I'm happy for you. Can't you tell?"]], beat: 'Nobody laughs.' },
  ],

  'crush-confide': [
    // go-for-it: the friend pushes
    { id: 'ccf.g.01', when: { of: 'go-for-it' }, stage: 'On the swing seat, {a} leans into {b}.', turns: [
      ['a', "Can I tell you something? I really like {c}."], ['b', "I know. It's obvious."],
      ['a', "Is it?"], ['b', "So obvious. What are you waiting for?"], ['a', "For {c} to notice me."], ['b', "Then make {c} notice."]] },
    { id: 'ccf.g.02', when: { of: 'go-for-it' }, stage: 'In the dressing room, {b} catches {a} staring out of the window at {c}.', turns: [
      ['b', "Just go and talk to {c}."], ['a', "And say what?"], ['b', "That you like {c}. It's not hard."],
      ['a', "It's really hard."], ['b', "Worst case, you know where you stand."]] },
    { id: 'ccf.g.03', when: { of: 'go-for-it' }, stage: '{a} and {b} are on the sunbeds.', turns: [
      ['a', "I think I've got a thing for {c}."], ['b', "Then crack on."], ['a', "I don't think {c} feels the same."],
      ['b', "You don't know that until you ask."]] },
    { id: 'ccf.g.04', when: { of: 'go-for-it' }, stage: 'At breakfast, {a} keeps looking over at {c}.', turns: [
      ['b', "You've been looking at {c} for ten minutes."], ['a', "I haven't."],
      ['b', "You have. Go and pull {c} for a chat."], ['a', "Maybe later."], ['b', "Now. Go."]] },
    // careful: the friend warns
    { id: 'ccf.c.01', when: { of: 'careful' }, stage: 'On the daybed, {a} tells {b} quietly.', turns: [
      ['a', "I like {c}. Like, really like {c}."], ['b', "Listen. I don't want you to get hurt."],
      ['a', "What do you mean?"], ['b', "I just don't know if {c} sees you like that."]], beat: '{a} goes quiet.' },
    { id: 'ccf.c.02', when: { of: 'careful' }, stage: '{a} and {b} are by the pool.', turns: [
      ['a', "Do you think {c} likes me?"], ['b', "Honestly?"], ['a', "Honestly."],
      ['b', "I think {c} likes you as a person. I don't know about the rest."]] },
    { id: 'ccf.c.03', when: { of: 'careful' }, stage: '{b} finds {a} alone on the terrace.', turns: [
      ['b', "You're thinking about {c} again, aren't you?"], ['a', "I can't help it."],
      ['b', "Just don't put all your eggs in one basket. Not in here."], ['a', "I know. I know."]] },
    { id: 'ccf.c.04', when: { of: 'careful' }, stage: 'In the kitchen, {a} tells {b} while they wash up.', turns: [
      ['a', "I think I'm falling for {c}."], ['b', "Already?"], ['a', "Is that bad?"],
      ['b', "It's not bad. Just be careful. I haven't seen {c} look at you the way you look at {c}."]] },
  ],

  'crush-watch': [
    // hurt
    { id: 'cw.h.01', when: { of: 'hurt' }, stage: '{a} watches {b} and {c} kissing on the daybed.', turns: [
      ['c', "You alright over there?"], ['a', "Yeah. Fine."], ['c', "You sure?"],
      ['a', "I'm fine."]], beat: '{a} goes inside.' },
    { id: 'cw.h.02', when: { of: 'hurt' }, stage: '{b} and {c} are laughing by the pool. {a} is sitting on {a.posAdj} own.', turns: [
      ['b', "Come and join us!"], ['a', "I'm alright here, thanks."],
      ['b', "Are you okay? You've been quiet all day."], ['a', "Just tired."]] },
    { id: 'cw.h.03', when: { of: 'hurt' }, stage: 'At the fire pit, {c} puts an arm round {b}. {a} looks away.', turns: [
      ['b', "What's wrong?"], ['a', "Nothing. I'm just going to go to bed."],
      ['c', "It's not even ten."], ['a', "I'm tired."]] },
    { id: 'cw.h.04', when: { of: 'hurt' }, stage: '{a} walks past {b} and {c} on the swing, and keeps walking.', turns: [
      ['b', "{a}? Where are you going?"], ['a', "Nowhere. Carry on."]], beat: "{b} watches {a} go, and doesn't know why." },
    // catty
    { id: 'cw.c.01', when: { of: 'catty' }, stage: '{a} walks past {b} and {c} and stops.', turns: [
      ['a', "Cute. Very cute."], ['c', "Thanks?"],
      ['a', "It won't last, but it's cute."], ['b', "What's your problem?"], ['a', "I don't have a problem."]] },
    { id: 'cw.c.02', when: { of: 'catty' }, stage: 'In the kitchen, {a} stands next to {c}.', turns: [
      ['a', "I don't know what {b} sees in you, honestly."], ['c', "Excuse me?"],
      ['a', "I'm just being honest."], ['c', "No, you're being nasty."]], beat: '{c} goes straight to tell {b}.' },
    { id: 'cw.c.03', when: { of: 'catty' }, stage: '{a} watches {c} sit down next to {b}.', turns: [
      ['a', "Must be nice, being second choice."], ['c', "I'm not anyone's second choice."],
      ['a', "If you say so."], ['b', "Leave it, {a}."]] },
    { id: 'cw.c.04', when: { of: 'catty' }, stage: 'By the pool, {a} says it loud enough for {c} to hear.', turns: [
      ['a', "Some people just get lucky with who's left, don't they?"], ['c', "Is that about me?"],
      ['a', "Why, did it sound like it?"]], beat: '{b} takes {c} inside.' },
  ],

  'crush-move': [
    // let-down: gently
    { id: 'cm.l.01', when: { of: 'let-down' }, stage: '{a} finally asks {b} for a chat on the swing.', turns: [
      ['a', "I need to tell you something. I really like you."], ['b', "Oh. That's really sweet."],
      ['a', "But?"], ['b', "But I don't feel the same. I'm sorry."], ['a', "No. It's fine. I needed to know."]],
      beat: '{a} holds it together until {b} has gone.' },
    { id: 'cm.l.02', when: { of: 'let-down' }, stage: 'On the terrace, {a} takes a deep breath.', turns: [
      ['a', "Do you ever think about us? Like, as more than this?"], ['b', "Honestly? No. I'm sorry."],
      ['a', "Okay."], ['b', "I didn't want to lie to you."], ['a', "I know. Thank you."]] },
    { id: 'cm.l.03', when: { of: 'let-down' }, stage: '{a} brings {b} a drink and sits down.', turns: [
      ['a', "I'm just going to say it. I like you, a lot."], ['b', "I'm really flattered."],
      ['a', "That's never a good start."], ['b', "It's just not there for me. I wish it was."]] },
    { id: 'cm.l.04', when: { of: 'let-down' }, stage: 'By the pool, {a} goes for it.', turns: [
      ['a', "Would you ever go for someone like me?"], ['b', "Someone like you, maybe. You? I don't think so."],
      ['a', "Wow. Okay."], ['b', "Sorry. That came out wrong. I just don't see it."]], beat: '{a} laughs, but it hurt.' },
    // friend-zone
    { id: 'cm.f.01', when: { of: 'friend-zone' }, stage: 'On the daybed, {a} tells {b} how {a} feels.', turns: [
      ['b', "You're one of my best friends in here."], ['a', "That's the problem."],
      ['b', "I don't want to lose that."], ['a', "You won't. I just wanted you to know."]] },
    { id: 'cm.f.02', when: { of: 'friend-zone' }, stage: '{a} catches {b} in the kitchen.', turns: [
      ['a', "Have you ever thought about me like that?"], ['b', "Like what?"], ['a', "You know. Like that."],
      ['b', "You're like family to me."], ['a', "Right. Family. Great."]] },
    { id: 'cm.f.03', when: { of: 'friend-zone' }, stage: 'On the swing, {a} goes quiet before saying it.', turns: [
      ['a', "I've started liking you. More than a friend."], ['b', "Oh no."], ['a', "Oh no?"],
      ['b', "Not oh no. I love you. Just not like that."]] },
    { id: 'cm.f.04', when: { of: 'friend-zone' }, stage: '{a} sits next to {b} on the sunbeds.', turns: [
      ['a', "What would you do if I kissed you right now?"], ['b', "Laugh, probably."],
      ['a', "Right."], ['b', "Not at you. It would just feel weird. You're my friend."]] },
    // leads-on: b enjoys being wanted
    { id: 'cm.o.01', when: { of: 'leads-on' }, stage: '{a} tells {b} how {a} feels on the terrace.', turns: [
      ['b', "I'm not saying no."], ['a', "So you're saying yes?"],
      ['b', "I'm saying let's see what happens."], ['a', "Okay. I can do that."]], beat: '{b} smiles, and goes back to the others.' },
    { id: 'cm.o.02', when: { of: 'leads-on' }, stage: '{b} strokes {a}\'s arm while {a} is talking.', turns: [
      ['a', "I really like you."], ['b', "I know you do."],
      ['a', "And?"], ['b', "And I like that you do."]] },
    { id: 'cm.o.03', when: { of: 'leads-on' }, stage: 'On the daybed, {b} leans in close.', turns: [
      ['b', "Maybe if things were different."], ['a', "Different how?"],
      ['b', "Just keep being you. We'll see."]], beat: '{b} kisses {a} on the cheek and walks off. {a} is grinning.' },
    { id: 'cm.o.04', when: { of: 'leads-on' }, stage: 'In the kitchen, {a} asks {b} straight out.', turns: [
      ['a', "Is there any chance for me?"], ['b', "There's always a chance."],
      ['a', "Really?"], ['b', "Don't look so surprised."]] },
    // maybe: a spark after all
    { id: 'cm.m.01', when: { of: 'maybe' }, stage: '{a} finally says it, on the swing seat.', turns: [
      ['a', "I like you. I have done for a while."], ['b', "I didn't know that."],
      ['a', "Now you do."], ['b', "I think I need to look at you differently now."], ['a', "In a good way?"], ['b', "Maybe in a good way."]] },
    { id: 'cm.m.02', when: { of: 'maybe' }, stage: 'By the fire pit, {a} goes for it.', turns: [
      ['a', "Would you ever give me a chance?"], ['b', "I hadn't thought about it."],
      ['a', "Think about it now."], ['b', "…Okay. I'm thinking about it."]], beat: "{b} can't stop smiling." },
    { id: 'cm.m.03', when: { of: 'maybe' }, stage: '{a} pulls {b} for a chat on the terrace.', turns: [
      ['a', "I'll be honest. I'm really into you."], ['b', "Oh. Wow. Okay."],
      ['a', "Too much?"], ['b', "No. It's just that nobody's said that to me in here."], ['a', "Well, I'm saying it."]] },
    { id: 'cm.m.04', when: { of: 'maybe' }, stage: '{a} and {b} sit on the daybed after dinner.', turns: [
      ['a', "I don't want to be just friends."], ['b', "Where's this come from?"],
      ['a', "It's been there all along."], ['b', "Give me a bit of time. I'm not saying no."]] },
  ],

  'crush-plea': [
    // warmer
    { id: 'cp.w.01', when: { of: 'warmer' }, stage: 'On the daybed, {a} takes {b}\'s hand.', turns: [
      ['a', "Can you show me a bit more affection? I don't always know where I stand."], ['b', "I didn't realise you felt like that."],
      ['a', "I do."], ['b', "Then I'll make sure you know."]], beat: '{b} kisses {a}, properly.' },
    { id: 'cp.w.02', when: { of: 'warmer' }, stage: '{a} sits with {b} on the swing.', turns: [
      ['a', "Sometimes I feel like I'm the only one trying."], ['b', "You're not. I'm just not very good at showing it."],
      ['a', "Can you try?"], ['b', "I'll try. I promise."]] },
    { id: 'cp.w.03', when: { of: 'warmer' }, stage: 'In the bedroom, {a} turns to {b} before lights out.', turns: [
      ['a', "Do you actually like me?"], ['b', "Of course I do. Why would you ask that?"],
      ['a', "Because you never say it."], ['b', "Then I'll say it. I like you."]] },
    { id: 'cp.w.04', when: { of: 'warmer' }, stage: 'By the pool, {a} says it quietly.', turns: [
      ['a', "I need a bit more from you."], ['b', "More what?"], ['a', "More of you. More than a kiss goodnight."],
      ['b', "Okay. You've got it."]] },
    // colder
    { id: 'cp.c.01', when: { of: 'colder' }, stage: 'On the daybed, {a} takes {b}\'s hand.', turns: [
      ['a', "Can you show me a bit more affection?"], ['b', "I'm not a very touchy person."],
      ['a', "You're touchy with other people."], ['b', "That's different."], ['a', "How?"]], beat: "{b} doesn't answer." },
    { id: 'cp.c.02', when: { of: 'colder' }, stage: '{a} catches {b} on the way to the kitchen.', turns: [
      ['a', "Are we okay?"], ['b', "We're fine."], ['a', "You barely look at me."],
      ['b', "I'm just taking things slowly."], ['a', "Slowly or backwards?"]] },
    { id: 'cp.c.03', when: { of: 'colder' }, stage: 'In the bedroom, {a} lies awake next to {b}.', turns: [
      ['a', "Can I have a cuddle?"], ['b', "It's really hot tonight."],
      ['a', "It's always really hot."], ['b', "Night, {a}."]], beat: '{b} rolls over. {a} stares at the ceiling.' },
    { id: 'cp.c.04', when: { of: 'colder' }, stage: 'At the fire pit, {a} leans in to {b}.', turns: [
      ['a', "I feel like I'm always the one making the effort."], ['b', "I didn't ask you to."],
      ['a', "Wow."], ['b', "That came out wrong."], ['a', "No. I think it came out exactly right."]] },
  ],

  'crush-over': [
    // moving-on
    { id: 'co.m.01', when: { of: 'moving-on' }, stage: '{a} finds {b} by the pool.', turns: [
      ['a', "I'm going to stop waiting for you."], ['b', "I never asked you to wait."],
      ['a', "I know. That's why I'm stopping."], ['b', "Okay. Are we still good?"], ['a', "We'll be good."]] },
    { id: 'co.m.02', when: { of: 'moving-on' }, stage: 'On the lawn, {a} sits down next to {b}.', turns: [
      ['a', "I've let it go. The whole thing."], ['b', "Yeah?"],
      ['a', "Yeah. I'm going to get to know other people."], ['b', "I think that's a good idea."]] },
    { id: 'co.m.03', when: { of: 'moving-on' }, stage: 'In the kitchen, {a} makes {b} a tea.', turns: [
      ['b', "What's this for?"], ['a', "A peace offering. I'm over it. Over you."],
      ['b', "That was quick."], ['a', "It wasn't quick for me."]] },
    { id: 'co.m.04', when: { of: 'moving-on' }, stage: '{a} and {b} end up on the swing together.', turns: [
      ['a', "It's weird, you know. I liked you so much, and now I just like you."], ['b', "Is that better?"],
      ['a', "It's easier."]] },
    // led-on: b kept it going
    { id: 'co.l.01', when: { of: 'led-on' }, stage: '{a} walks straight up to {b} on the terrace.', turns: [
      ['a', "You knew how I felt, and you let me keep hoping."], ['b', "I never promised you anything."],
      ['a', "You didn't have to. You just kept smiling at me."], ['b', "I'm allowed to smile."], ['a', "Not like that, you're not."]],
      beat: '{a} walks off, and {b} has nothing to say.' },
    { id: 'co.l.02', when: { of: 'led-on' }, stage: 'At the fire pit, {a} says it in front of everyone.', turns: [
      ['a', "I've been a mug. You liked having me run after you."], ['b', "That's not true."],
      ['a', "Then tell me it was ever going to happen."], ['b', "…"], ['a', "Exactly."]] },
    { id: 'co.l.03', when: { of: 'led-on' }, stage: 'In the dressing room, {a} turns round to {b}.', turns: [
      ['a', "What was it? A bit of attention?"], ['b', "I liked talking to you."],
      ['a', "You liked me liking you."], ['b', "Maybe. I'm sorry."]] },
  ],
};
