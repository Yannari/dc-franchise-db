// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/arcs.js — stories that run across weeks (bb/story/arcs.js casts them and ends them)
// ══════════════════════════════════════════════════════════════════════
//
// Written against docs/bb-dialogue-style.md. Total Drama's arcs (td/story/arcs.js) in the house: two
// people, a scene a week, each one starting where the last left off, an ending the GAME decides.
//   payback   {rival} nominated a, and a survived. a vows it (vow), waits for it (wait), and then:
//             end.payback  a is Head of Household and puts {rival} on the block
//             end.gone     somebody else sent {rival} home first
//             end.mercy    a held the keys and did NOT nominate {rival}
//   block     a has been on the block again and again, and is still here: the self-mockery (pro),
//             and the week a finally wins something (end.win)
// b is a's closest person, except in end.payback, where b is {rival} on the way to the chair.
// {prize} is what a won in block.end.win ("the veto", "the HOH key"). Ids 'ar.'.

export default {
  'arc.payback.vow': [
    { id: 'ar.pv1', presumes: ['vote'], turns: [
      { by: 'a', say: "I'm still here." },
      { by: 'b', say: "You're still here." },
      { by: 'a', say: "{rival} put me on that block and I'm still here." },
      { by: 'b', say: "So what now?" },
      { by: 'a', say: "Now I win something. And when I do, {rival} gets to sit in the chair I sat in." },
      { by: 'b', say: "That's a promise?" },
      { by: 'a', say: "That's a promise." },
      { by: 'a', dr: "{rival} thought I'd be gone by now. I'm going to be the last face {rival} sees in this house." },
    ] },
    { id: 'ar.pv2', presumes: ['vote'], turns: [
      { by: 'b', say: "Are you okay? You've been quiet since the vote." },
      { by: 'a', say: "I'm thinking." },
      { by: 'b', say: "About?" },
      { by: 'a', say: "About {rival}. About how {rival} looked at me when I stayed." },
      { by: 'b', say: "How did {rival} look at you?" },
      { by: 'a', say: "Like I was a problem that didn't go away. Good. I'm not going away." },
      { by: 'a', dr: "I'm not angry. I'm patient. In this house that's scarier." },
    ] },
    { id: 'ar.pv3', presumes: ['vote'], turns: [
      { beat: '{a} is staring at the HOH room door.' },
      { by: 'b', say: "What are you doing?" },
      { by: 'a', say: "Picturing it." },
      { by: 'b', say: "Picturing what?" },
      { by: 'a', say: "Me up there. {rival} down here. Same chair, other way round." },
      { by: 'b', say: "Remind me never to nominate you." },
      { by: 'b', dr: "{a} survived {rival}'s nomination, and something changed. {a} used to be nice. {a} is still nice. Just… with a list." },
    ] },
  ],
  'arc.payback.wait': [
    { id: 'ar.pw1', presumes: ['vote'], turns: [
      { by: 'b', say: "You've still got that look." },
      { by: 'a', say: "What look?" },
      { by: 'b', say: "The {rival} look." },
      { by: 'a', say: "I don't have a {rival} look." },
      { by: 'b', say: "You've had it since the block. Every comp, you watch {rival}, not the comp." },
      { by: 'a', say: "...I'll win one eventually." },
      { by: 'a', dr: "It's not that I can't let it go. It's that I don't want to. Not until the keys are mine." },
    ] },
    { id: 'ar.pw2', presumes: ['vote'], turns: [
      { by: 'a', say: "{rival} came and talked to me today. Really nice. Really friendly." },
      { by: 'b', say: "And?" },
      { by: 'a', say: "And people who put you on the block get really friendly when they think you might win HOH." },
      { by: 'b', say: "So you're not falling for it." },
      { by: 'a', say: "I smiled. I said all the right things. I'm not falling for it." },
      { by: 'a', dr: "{rival} wants to be friends now. {rival} can try. I haven't forgotten that chair." },
    ] },
    { id: 'ar.pw3', presumes: ['vote'], turns: [
      { by: 'b', say: "Another comp, another loss." },
      { by: 'a', say: "Don't." },
      { by: 'b', say: "I'm just saying. {rival} is still here." },
      { by: 'a', say: "And so am I. That's the whole point." },
      { by: 'b', say: "How long are you going to wait?" },
      { by: 'a', say: "As long as it takes. This house has a lot of comps left." },
      { by: 'a', dr: "Every week I don't win is a week {rival} gets to relax. Enjoy it, {rival}." },
    ] },
  ],
  'arc.payback.end.payback': [
    { id: 'ar.pe1', presumes: ['vote'], turns: [
      { by: 'b', say: "Is this about what I think it's about?" },
      { by: 'a', say: "You know what it's about." },
      { by: 'b', say: "That was ages ago." },
      { by: 'a', say: "You put me in that chair. I've thought about it every day since." },
      { by: 'b', say: "It was a game move." },
      { by: 'a', say: "So is this." },
      { by: 'a', dr: "I told myself if I ever got the keys, {b} would sit where I sat. I got the keys. Have a seat, {b}." },
    ] },
    { id: 'ar.pe2', presumes: ['vote'], turns: [
      { by: 'b', say: "You're putting me up." },
      { by: 'a', say: "I'm putting you up." },
      { by: 'b', say: "Because I nominated you." },
      { by: 'a', say: "Because you nominated me, and I'm still here, and you didn't think I would be." },
      { by: 'b', say: "That's petty." },
      { by: 'a', say: "It's Big Brother. Petty is a strategy." },
      { by: 'b', dr: "I knew it the second {a}'s name came out of that comp. I've been waiting for this all week." },
    ] },
    { id: 'ar.pe3', presumes: ['vote'], turns: [
      { beat: 'The HOH room. {a} lets {b} sit down before saying anything.' },
      { by: 'a', say: "Comfortable?" },
      { by: 'b', say: "Just say it." },
      { by: 'a', say: "You're going up. You know why." },
      { by: 'b', say: "We could have worked together." },
      { by: 'a', say: "We could have. Then you nominated me." },
      { by: 'a', dr: "I've waited for this since the day {b} put me up. I thought I'd feel bad about it. I don't." },
    ] },
  ],
  'arc.payback.end.gone': [
    { id: 'ar.pg1', presumes: ['vote'], turns: [
      { by: 'b', say: "Well. {rival}'s gone." },
      { by: 'a', say: "{rival}'s gone." },
      { by: 'b', say: "You don't look happy." },
      { by: 'a', say: "I wanted it to be me. I wanted to be the one who did it." },
      { by: 'b', say: "Does it matter who did it?" },
      { by: 'a', say: "...No. It doesn't. It really doesn't. It still does." },
      { by: 'a', dr: "I waited weeks for this, and somebody else got there first. I'm relieved. I'm also a bit annoyed." },
    ] },
    { id: 'ar.pg2', presumes: ['vote'], turns: [
      { by: 'a', say: "Did you see {rival}'s face when the vote got read out?" },
      { by: 'b', say: "I saw it." },
      { by: 'a', say: "That's the face I made when {rival} nominated me." },
      { by: 'b', say: "So you're even." },
      { by: 'a', say: "We're even. Somebody else settled it, but we're even." },
      { by: 'b', say: "Feel better?" },
      { by: 'a', say: "Much." },
      { by: 'a', dr: "The house sent {rival} home. I didn't have to. Honestly, that's even better for my jury votes." },
    ] },
    { id: 'ar.pg3', presumes: ['vote'], turns: [
      { by: 'b', say: "So that's the end of the {rival} thing." },
      { by: 'a', say: "It was never a thing." },
      { by: 'b', say: "It was the biggest thing in your whole life for a month." },
      { by: 'a', say: "...It was a bit of a thing." },
      { by: 'b', say: "And now?" },
      { by: 'a', say: "Now I need a new thing. Give me a minute." },
      { by: 'b', dr: "{a} spent weeks waiting to get {rival} out. The house did it for free. I think {a} is going to miss having an enemy." },
    ] },
  ],
  'arc.payback.end.mercy': [
    { id: 'ar.pm1', presumes: ['vote'], turns: [
      { by: 'b', say: "You had the keys. You didn't put {rival} up." },
      { by: 'a', say: "I didn't." },
      { by: 'b', say: "After everything?" },
      { by: 'a', say: "After everything. Turns out, when it's your HOH, the old stuff isn't the biggest threat in the room." },
      { by: 'b', say: "That's very grown up of you." },
      { by: 'a', say: "Don't tell anyone. I've got a reputation." },
      { by: 'a', dr: "I've wanted {rival} out for weeks. Then I won, and I looked at the house, and {rival} wasn't the problem. I hate that." },
    ] },
    { id: 'ar.pm2', presumes: ['vote'], turns: [
      { by: 'b', say: "You didn't put {rival} up." },
      { by: 'a', say: "I need {rival}'s vote more than I need the revenge." },
      { by: 'b', say: "You'd trust {rival}'s vote?" },
      { by: 'a', say: "I'd trust {rival} owing me. That's different." },
      { by: 'b', say: "That's cold." },
      { by: 'a', say: "It's about the votes. Somebody who owes me is more use to me than somebody who's gone." },
      { by: 'a', dr: "{rival} owes me now. That's the most strategic thing I've done in here, and it felt terrible." },
    ] },
    { id: 'ar.pm3', presumes: ['vote'], turns: [
      { by: 'b', say: "You let {rival} off." },
      { by: 'a', say: "I let {rival} off." },
      { by: 'b', say: "You've talked about this for weeks." },
      { by: 'a', say: "And in the HOH room, it just looked small. There were bigger names." },
      { by: 'b', say: "{rival} won't thank you." },
      { by: 'a', say: "I know. That's how I know it was the right call." },
      { by: 'b', dr: "{a} had {rival} right there, and let it go. Either that's the smartest move this season, or the worst." },
    ] },
  ],
  'arc.block.pro': [
    { id: 'ar.bp1', presumes: ['vote'], turns: [
      { by: 'b', say: "Back on the block." },
      { by: 'a', say: "Back on the block. My second home." },
      { by: 'b', say: "How are you so calm?" },
      { by: 'a', say: "I'm a professional now. I know which chair. I know which way to face. I've got a block outfit." },
      { by: 'b', say: "You've got a block outfit?" },
      { by: 'a', say: "Blue. Calming. Says 'keep me'." },
      { by: 'a', dr: "If they gave out a key for surviving the block, I'd have a keyring by now." },
    ] },
    { id: 'ar.bp2', presumes: ['vote'], turns: [
      { by: 'a', say: "You know what I've never done in this house? Sat on the couch for a nomination ceremony." },
      { by: 'b', say: "That's so sad." },
      { by: 'a', say: "It's not sad. It's a career." },
      { by: 'b', say: "Do you want a hug?" },
      { by: 'a', say: "I want a comp win. Hugs are for people who've been on the couch." },
      { by: 'b', say: "...I'm hugging you anyway." },
      { by: 'b', dr: "{a} jokes about the block. The jokes get better every time. That's how you know it hurts." },
    ] },
    { id: 'ar.bp3', presumes: ['vote'], turns: [
      { by: 'b', say: "How many times now?" },
      { by: 'a', say: "Don't count. I stopped counting." },
      { by: 'b', say: "And you're still here." },
      { by: 'a', say: "Still here. Like a cockroach. A charming cockroach." },
      { by: 'b', say: "That's the worst compliment you've ever given yourself." },
      { by: 'a', say: "It's the only one the house keeps giving me." },
      { by: 'a', dr: "Every HOH puts me up. Every week the house keeps me. Somebody in here is either my biggest fan or my laziest enemy." },
    ] },
  ],
  'arc.block.end.win': [
    { id: 'ar.bw1', presumes: ['vote'], turns: [
      { by: 'b', say: "You won." },
      { by: 'a', say: "I won." },
      { by: 'b', say: "You actually won something." },
      { by: 'a', say: "Say it again. Slower." },
      { by: 'b', say: "You. Actually. Won." },
      { beat: '{a} lies down on the floor and stays there.' },
      { by: 'a', dr: "All that time in the chair. All those weeks. I'm not sitting in it this week. Somebody else gets to know what it's like." },
    ] },
    { id: 'ar.bw2', presumes: ['vote'], turns: [
      { by: 'a', say: "Do you know what this means?" },
      { by: 'b', say: "You're safe?" },
      { by: 'a', say: "I'm SAFE. Me. The block professional. Off duty." },
      { by: 'b', say: "What are you going to do with yourself?" },
      { by: 'a', say: "Sit on the couch at the ceremony. Like a normal person. With my legs crossed." },
      { by: 'b', say: "Living the dream." },
      { by: 'a', dr: "Everybody in this house has had me on the block. This week I'm the one holding the power. Let's see how they like it." },
    ] },
    { id: 'ar.bw3', presumes: ['vote'], turns: [
      { beat: '{b} finds {a} holding {prize} like somebody might take it back.' },
      { by: 'b', say: "You can put it down. It's yours." },
      { by: 'a', say: "I'm not putting it down. I'm sleeping with it." },
      { by: 'b', say: "That's weird." },
      { by: 'a', say: "I've earned weird. I've been on the block more than the chairs have." },
      { by: 'b', say: "Fair." },
      { by: 'b', dr: "{a} has been the house's easy name for weeks. Not this week. This week everybody's being very, very nice to {a}." },
    ] },
  ],
};
