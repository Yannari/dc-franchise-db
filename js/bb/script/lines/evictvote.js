// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/evictvote.js — what each voter says in the Diary Room on eviction night
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-06: "the vote is not really personalised, it's always 'I vote to evict'".
// On the real show most voters say something first — to the person going, to the person
// staying, or to the camera — and then the formula. The formula stays (it is the show), and
// what comes before it is what is true of that voter (bb/script/ceremony.js chooses):
//
//   evict.vote.flip     a told the house they were voting the other way
//   evict.vote.friend   a is close to b, who is going
//   evict.vote.enemy    a has no time for b
//   evict.vote.loyal    a is protecting c, the nominee who stays
//   evict.vote.hard     a nearly voted the other way
//   evict.vote.bloc     a wanted somebody else out, and votes with their people anyway
//   evict.vote.plain    none of those
//
// On a night that seats a juror, a voter may say so ('<kind>jury': "enjoy the jury house").
// Those lines live apart so a pre-jury vote never mentions a jury that does not exist yet.
//
// a = the voter, b = who a votes to evict, c = the other nominee. Every entry ends on the
// formula, so the count on screen is never in doubt.

const V = (id, dr) => ({ id, turns: [{ by: 'a', dr }] });

export default {
  'evict.vote.flip': [
    V('ev.f1', "{b}, I'm sorry. I know what I told you. This is game, not personal. I vote to evict {b}."),
    V('ev.f2', "I said one thing in the kitchen. I'm doing another thing in here. That's the game. I vote to evict {b}."),
    V('ev.f3', "{b}, you're going to find out I lied to you. I hope you understand why one day. I vote to evict {b}."),
    V('ev.f4', "This is the hardest thing I've done in here. {b}, I'm sorry. I vote to evict {b}."),
    V('ev.f5', "{c}, you owe me one. {b}, please don't hate me. I vote to evict {b}."),
    V('ev.f6', "I changed my mind this morning. Nobody knows yet. Sorry, {b}. I vote to evict {b}."),
  ],
  'evict.vote.friend': [
    V('ev.r1', "{b}, I love you. I'll see you on the outside. I'm so sorry. I vote to evict {b}."),
    V('ev.r2', "This one hurts. {b}, you're one of my favourite people in here. I vote to evict {b}."),
    V('ev.r3', "{b}, save me a seat out there. Hug your people for me. I vote to evict {b}."),
    V('ev.r4', "I don't want to do this. I really don't. {b}, I'm sorry. I vote to evict {b}."),
    V('ev.r5', "{b}, it's not you. It's never been you. It's the numbers. I vote to evict {b}."),
    V('ev.r6', "Sorry, babe. I'll miss you so much. I vote to evict {b}."),
    V('ev.r7', "{b}, you made this place feel like home. I hate this. I vote to evict {b}."),
  ],
  'evict.vote.enemy': [
    V('ev.e1', "Easiest vote I've had in here. I vote to evict {b}."),
    V('ev.e2', "{b}, bye. I vote to evict {b}."),
    V('ev.e3', "Nothing personal, {b}. Okay, it's a little personal. I vote to evict {b}."),
    V('ev.e4', "I've been waiting for this one. I vote to evict {b}."),
    V('ev.e6', "No speech. I vote to evict {b}."),
    V('ev.e7', "{b}, you made it very easy. I vote to evict {b}."),
  ],
  'evict.vote.loyal': [
    V('ev.l1', "{c}, I've got you. Always. I vote to evict {b}."),
    V('ev.l2', "{c}, this one's for you. {b}, sorry. I vote to evict {b}."),
    V('ev.l3', "I keep my word. {c}, I want you here next week. I vote to evict {b}."),
    V('ev.l4', "{c}, I told you I'd be there. I'm there. I vote to evict {b}."),
    V('ev.l5', "{b}, I like you. But I'm with {c}. I vote to evict {b}."),
    V('ev.l6', "{c}, see you on the other side of this. I vote to evict {b}."),
  ],
  'evict.vote.hard': [
    V('ev.h1', "I've gone back and forth all week. I'm still not sure. I vote to evict {b}."),
    V('ev.h2', "{b}, {c}, I'm sorry to whichever of you this hurts more. I vote to evict {b}."),
    V('ev.h3', "This could have gone either way right up until I sat down. I vote to evict {b}."),
    V('ev.h4', "I changed my mind three times walking in here. Final answer. I vote to evict {b}."),
    V('ev.h5', "Honestly? Coin toss. {b}, it landed on you. I vote to evict {b}."),
    V('ev.h6', "I hate this vote. I hate it. I vote to evict {b}."),
  ],
  'evict.vote.flipjury': [
    V('ev.fj1', "{b}, I promised you. I'm breaking it. I'll explain when I see you at the end. I vote to evict {b}."),
    V('ev.fj2', "{b}, you're going to the jury, and you're going to be angry with me. I'd be angry too. I vote to evict {b}."),
    V('ev.fj3', "I know this costs me a jury vote. I'm doing it anyway. I vote to evict {b}."),
    V('ev.fj4', "{b}, I said I was with you. On the jury, you'll hear why I wasn't. I vote to evict {b}."),
    V('ev.fj5', "This is going to be a very awkward finale night. Sorry, {b}. I vote to evict {b}."),
    V('ev.fj6', "{b} is going to sit on that jury and stare at me. I'll deserve it. I vote to evict {b}."),
  ],
  'evict.vote.friendjury': [
    V('ev.rj1', "{b}, save me a seat on the jury. Please don't hold this against me. I vote to evict {b}."),
    V('ev.rj2', "{b}, you'll be on that jury, and I hope you vote for me anyway. I vote to evict {b}."),
    V('ev.rj3', "This is the one I'll have to answer for at the end. Sorry, {b}. I vote to evict {b}."),
    V('ev.rj4', "{b}, the jury gets you, and the game gets a little lonelier for me. I vote to evict {b}."),
    V('ev.rj5', "I hope the jury house is nicer than this one, {b}. You deserve that. I vote to evict {b}."),
    V('ev.rj6', "{b}, I'll make my case to you at the end, and I hope you hear it. I vote to evict {b}."),
  ],
  'evict.vote.enemyjury': [
    V('ev.ej1', "{b}, enjoy the jury house. I vote to evict {b}."),
    V('ev.ej2', "{b} was never voting for me on the jury anyway. I vote to evict {b}."),
    V('ev.ej3', "Bitter juror incoming. I vote to evict {b}."),
    V('ev.ej4', "{b} can be angry with me from the jury bench. I vote to evict {b}."),
    V('ev.ej5', "One jury vote I never had. I vote to evict {b}."),
    V('ev.ej6', "{b}, the jury house has a pool. Go and cool off. I vote to evict {b}."),
  ],
  'evict.vote.loyaljury': [
    V('ev.lj1', "{c}, I'd rather face {b} on the jury than face you. I vote to evict {b}."),
    V('ev.lj2', "{c}, we go deeper together. {b}, I'll see you at the end. I vote to evict {b}."),
    V('ev.lj3', "{c}, I'm keeping my word, even if it costs me on the jury. I vote to evict {b}."),
    V('ev.lj4', "{b}, nothing personal. {c} and I are going further. I'll see you on the jury. I vote to evict {b}."),
    V('ev.lj5', "{c}, this one's for you. {b}, I'll take the jury questions. I vote to evict {b}."),
    V('ev.lj6', "Loyalty first, jury second. {c}, I've got you. I vote to evict {b}."),
  ],
  'evict.vote.hardjury': [
    V('ev.hj1', "Whoever I vote out tonight sits on the jury. I've thought about that all week. I vote to evict {b}."),
    V('ev.hj2', "This is a jury vote I'm giving away either way. I vote to evict {b}."),
    V('ev.hj3', "Whichever one of you goes, I've made a juror angry. I vote to evict {b}."),
    V('ev.hj4', "I've counted jury votes all week and I still don't know. I vote to evict {b}."),
    V('ev.hj5', "{c}, {b}, either one of you on the jury scares me. I vote to evict {b}."),
    V('ev.hj6', "It's a coin toss and the jury's watching. I vote to evict {b}."),
  ],
  'evict.vote.plainjury': [
    V('ev.pj1', "{b}, you'll make a great juror. I vote to evict {b}."),
    V('ev.pj2', "Welcome to the jury, {b}. I vote to evict {b}."),
    V('ev.pj3', "{b}, see you on finale night. I vote to evict {b}."),
    V('ev.pj4', "Enjoy the jury house, {b}. I hear the food's better. I vote to evict {b}."),
    V('ev.pj5', "{b}, I hope you'll still hear me out at the end. I vote to evict {b}."),
    V('ev.pj6', "Jury seat for {b}. I vote to evict {b}."),
  ],
  'evict.vote.bloc': [
    V('ev.b1', "This isn't the vote I wanted. But I'm with my people. I vote to evict {b}."),
    V('ev.b2', "{c}, if it was just me, it'd be you. It's not just me. I vote to evict {b}."),
    V('ev.b3', "I'll go with the group this time. Sorry, {b}. I vote to evict {b}."),
    V('ev.b4', "My gut says one thing. My alliance says another. My alliance wins tonight. I vote to evict {b}."),
    V('ev.b5', "We talked it through as a group, and this is where we landed. I vote to evict {b}."),
    V('ev.b6', "Team vote. Not my first choice. I vote to evict {b}."),
  ],
  'evict.vote.plain': [
    V('ev.p1', "Sorry, {b}. I vote to evict {b}."),
    V('ev.p2', "I vote to evict {b}."),
    V('ev.p3', "{b}, it's been fun. I vote to evict {b}."),
    V('ev.p4', "Good luck, {b}. I vote to evict {b}."),
    V('ev.p5', "{c}, {b}, you both played hard. I vote to evict {b}."),
    V('ev.p6', "With the house. I vote to evict {b}."),
    V('ev.p7', "{b}, no hard feelings. I vote to evict {b}."),
  ],
};
