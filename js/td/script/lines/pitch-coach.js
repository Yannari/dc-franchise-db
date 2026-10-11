// ══════════════════════════════════════════════════════════════════════
// td/script/lines/pitch-coach.js — a coach working the camp before a vote (voting.js coachPitch)
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-10: a coach pitched "I've got two votes already", and a coach has no ballot. A coach
// lobbies with what a coach has: they watch the team every day, they've trained these people, and they
// can be voted out themselves. {a} is the coach, {b} the player, {target} the name. The engine's eight
// reactions come in three (episode.js COACH_TONE):
//   pitch.coach.yes     receptive
//   pitch.coach.maybe   uncertain, numbers-focused, guarded, distracted
//   pitch.coach.no      cold, skeptical, unreceptive
//   pitch.coachread.<landed|stalled>   the coach, to the camera
// Ids: 'pc.'.
const YES = [
  { id: 'pc.y1', turns: [
    { by: 'a', say: "I can't vote. You know that. But I watch this team all day, and {target} is the one I'd cut.", v: { sharp: "I don't get a vote, so I'll be blunt. {target} is dead weight, and you know it." } },
    { by: 'b', say: "Why {target}?" },
    { by: 'a', say: "Because every time it gets hard, {target} is the first one to quit. I've watched it happen." },
    { by: 'b', say: "Okay. Yeah, I've seen that too." },
  ] },
  { id: 'pc.y2', turns: [
    { beat: "{a} waits until practice is over and {b} is alone." },
    { by: 'a', say: "Can I give you some advice? Not about the drill. About the vote." },
    { by: 'b', say: "You're allowed to do that?" },
    { by: 'a', say: "Nobody said I'm not. {target}. Think about it." },
    { by: 'b', say: "I already have, honestly. I just didn't want to be the one to say it." },
    { by: 'a', say: "Then don't say it. Just write it." },
  ] },
  { id: 'pc.y3', turns: [
    { by: 'a', say: "I've worked with you every day. I'd like you to still be here next week." },
    { by: 'b', say: "Me too." },
    { by: 'a', say: "Then {target} has to go first. {target} wants you gone. I've heard it.", v: { soft: "Then I think {target} should go first. I'm sorry, I just think that's safest for you." } },
    { by: 'b', say: "Wow. Okay. Thank you for telling me." },
  ] },
  { id: 'pc.y4', turns: [
    { by: 'b', say: "Coach. Who would you vote for, if you could?" },
    { by: 'a', say: "Honestly? {target}." },
    { by: 'b', say: "That's who I was thinking." },
    { by: 'a', say: "Good. Then we're thinking the same thing, and I never said a word.", v: { loud: "See? Great minds! And I never said anything, okay?" } },
  ] },
  { id: 'pc.y5', turns: [
    { by: 'a', say: "Quick question. Who's the weakest person on this team right now?" },
    { by: 'b', say: "Is this a trick question?" },
    { by: 'a', say: "It's a coaching question. I'd say {target}." },
    { by: 'b', say: "...Yeah. I'd say {target} too." },
    { by: 'a', conf: "I can't write a name down. But I can make sure the right people write the same one." },
  ] },
  { id: 'pc.y6', turns: [
    { by: 'a', say: "If {target} stays, the next name on the list might be mine. And then who trains you?" },
    { by: 'b', say: "Okay, that's a fair point." },
    { by: 'a', say: "I know it is. I've been thinking about it all day.", v: { dry: "I know. I've had a lot of time to think. Coaches don't do much else." } },
    { by: 'b', say: "Fine. {target}. But you owe me extra practice." },
  ] },
];
const MAYBE = [
  { id: 'pc.m1', turns: [
    { by: 'a', say: "I'll be honest. I'd like {target} to go." },
    { by: 'b', say: "That's easy for you to say. You don't have to write it down." },
    { by: 'a', say: "No. But I'm the one who loses everybody I trained if this goes wrong." },
    { by: 'b', say: "I'll think about it. That's all I can promise." },
  ] },
  { id: 'pc.m2', turns: [
    { by: 'a', say: "Can I tell you who I'd vote for, if I had a vote?" },
    { by: 'b', say: "Sure, but you don't, so it doesn't really matter." },
    { by: 'a', say: "{target}. And it matters more than you think." },
    { by: 'b', say: "Maybe. I already told some people something else." },
    { by: 'a', say: "Then tell them you changed your mind." },
  ] },
  { id: 'pc.m3', turns: [
    { by: 'a', say: "{target}. Hear me out." },
    { by: 'b', say: "What's in it for me?" },
    { by: 'a', say: "My time. Every session I've got, for as long as I'm here.", v: { sharp: "My time. You've seen what I do with the people I pick." } },
    { by: 'b', say: "That's a good offer. I just don't know if it's worth my neck." },
  ] },
  { id: 'pc.m4', turns: [
    { by: 'b', say: "Is this coaching, or is this you trying to stay in the game?" },
    { by: 'a', say: "Can't it be both?" },
    { by: 'b', say: "Not really, no." },
    { by: 'a', say: "Fine. It's both. {target} is still the right call." },
    { by: 'b', say: "I'll see what everybody else is doing." },
  ] },
  { id: 'pc.m5', turns: [
    { by: 'a', say: "You've got a good head on you. What do you think about {target}?" },
    { by: 'b', say: "I think you're buttering me up." },
    { by: 'a', say: "A little. I also think I'm right.", v: { loud: "A LITTLE! But I'm also right!" } },
    { by: 'b', say: "Let me talk to a couple of people first." },
  ] },
  { id: 'pc.m6', turns: [
    { by: 'a', say: "I'm not asking for a promise. I'm just asking you to look at {target} in the next challenge." },
    { by: 'b', say: "And if I don't see what you see?" },
    { by: 'a', say: "Then I was wrong, and you can tell me so." },
    { by: 'b', say: "Deal. I'm not saying yes, though." },
  ] },
];
const NO = [
  { id: 'pc.n1', turns: [
    { by: 'a', say: "{target} has to go. I've watched {target} every day." },
    { by: 'b', say: "With respect, coach, you don't get a vote. I do." },
    { by: 'a', say: "I know that." },
    { by: 'b', say: "Then let me use it.", v: { sharp: "Then stay in your lane." } },
  ] },
  { id: 'pc.n2', turns: [
    { by: 'a', say: "Can we talk about {target}?" },
    { by: 'b', say: "No. {target} is my friend, and you're not even playing." },
    { by: 'a', say: "Not yet, I'm not." },
    { by: 'b', say: "That's exactly why I don't trust this." },
  ] },
  { id: 'pc.n3', turns: [
    { by: 'a', say: "I need you on {target}. Please." },
    { by: 'b', say: "Wait. Is your name out there? Is that what this is?" },
    { by: 'a', say: "...Maybe." },
    { by: 'b', say: "So you want me to save you by throwing {target} under the bus. No thanks." },
  ] },
  { id: 'pc.n4', turns: [
    { by: 'a', say: "Hey. About the vote. I think {target}—" },
    { by: 'b', say: "Nope. You train me, I'm grateful. You don't tell me how to vote." },
    { by: 'a', say: "I'm not telling you. I'm suggesting." },
    { by: 'b', say: "Suggest it to somebody else.", v: { loud: "Then suggest it to somebody ELSE!" } },
  ] },
  { id: 'pc.n5', turns: [
    { by: 'a', say: "Honestly, {target} is holding this team back." },
    { by: 'b', say: "Funny. {target} said the same thing about you." },
    { by: 'a', say: "...Did {target}?" },
    { by: 'b', say: "Maybe you should worry about your own name." },
  ] },
  { id: 'pc.n6', turns: [
    { by: 'a', say: "{target}. That's my advice." },
    { by: 'b', say: "You watch from the side. I've been in it with {target} every single day." },
    { by: 'a', say: "Watching from the side is how I see it." },
    { by: 'b', say: "Then we saw different things." },
  ] },
];
// An alliance with a coach in it (camp-events.js puts the coach in role a): the coach can't vote, so the
// deal is what a coach can give now (the sessions, eyes on the whole camp, a word in the right ear) and
// the vote they'll have if they make the merge. {group} is its name; {more} the members past {c}.
const WITH_COACH = [
  { id: 'pc.a1', when: { third: false }, turns: [
    { beat: '{a} waits until practice is over and {b} is the last one left.' },
    { by: 'a', say: "Can I be honest with you? I can't vote. But I can make sure you're not the one who goes home." },
    { by: 'b', say: "How?" },
    { by: 'a', say: "Extra sessions. I hear everything at this camp, and you'll hear it from me first." },
    { by: 'b', say: "And what do you get?" },
    { by: 'a', say: "If I make the merge, I get a friend who owes me one. Let's call it {group}." },
    { by: 'b', say: "{group}. Okay, coach. Deal." },
  ] },
  { id: 'pc.a2', when: { third: false }, turns: [
    { by: 'b', say: "Is it weird if I say you're my favourite person here?" },
    { by: 'a', say: "Very weird. I'm your coach." },
    { by: 'b', say: "I know. I mean it, though." },
    { by: 'a', say: "Then let's make it count. I watch your back now, and if I make the merge, you watch mine." },
    { by: 'b', say: "Like an alliance?" },
    { by: 'a', say: "Exactly like an alliance. {group}.", v: { loud: "EXACTLY like an alliance! {group}!", dry: "That's what the word means, yes. {group}." } },
  ] },
  { id: 'pc.a3', when: { third: false }, turns: [
    { by: 'a', say: "You know everybody thinks a coach is just here to run drills, right?" },
    { by: 'b', say: "Aren't you?" },
    { by: 'a', say: "I'm also here to play, eventually. And when I do, I want somebody I trust already in the game." },
    { by: 'b', say: "So you want me to keep you safe until the merge?" },
    { by: 'a', say: "I want us to keep each other safe. I can't write a name, but I can tell you which one to write." },
    { by: 'b', say: "Okay. I'm in. What do we call it?" },
    { by: 'a', say: "{group}." },
  ] },
  { id: 'pc.a4', when: { third: true, more: false }, turns: [
    { beat: '{a} sits {b} and {c} down where nobody else can hear.' },
    { by: 'a', say: "You two are the best I've got. I'm not losing either of you to a stupid vote." },
    { by: 'c', say: "You can't vote, though." },
    { by: 'a', say: "No, but you two can, and I can tell you everything I hear before anybody else does." },
    { by: 'b', say: "And at the merge?" },
    { by: 'a', say: "At the merge, I'm a third vote you didn't have before. {group}. The three of us." },
    { by: 'c', say: "Okay. I like those numbers." },
  ] },
  { id: 'pc.a5', when: { third: true, more: false }, turns: [
    { by: 'b', say: "So why are we meeting in secret with our coach?" },
    { by: 'a', say: "Because everybody's making alliances, and nobody's asking me. So I'm asking you." },
    { by: 'c', say: "Can a coach even be in an alliance?" },
    { by: 'a', say: "Nobody said I can't. I don't vote yet. But I see everything, and I'll make the merge if you keep me here." },
    { by: 'b', say: "And you keep us here?" },
    { by: 'a', say: "That's the deal. {group}." },
  ] },
  { id: 'pc.a6', when: { third: true, more: true }, turns: [
    { beat: '{a} gets {b}, {c} and {more} together, away from everybody else.' },
    { by: 'a', say: "Here's the deal. You four have the votes. I've got the information. Together, nobody can touch us." },
    { by: 'b', say: "Like a secret group inside the group?" },
    { by: 'a', say: "Exactly. I hear who's talking about who, and you hear it from me." },
    { by: 'c', say: "And when you start playing?" },
    { by: 'a', say: "Then you've got one more vote you didn't have. {group}. Everybody in?" },
    { by: 'b', say: "Everybody's in." },
  ] },
  { id: 'pc.a7', when: { third: true, more: true }, turns: [
    { by: 'a', say: "I've worked with every one of you. I know who's loyal. That's why you're the ones sitting here." },
    { by: 'c', say: "This is an alliance, isn't it?" },
    { by: 'a', say: "It's {group}. You vote together, I keep you sharp and tell you what I hear, and if I make the merge, I vote with you." },
    { by: 'b', say: "That's a lot of us. Somebody's going to notice." },
    { by: 'a', say: "Let them. A big group is hard to break." },
  ] },
];
const READ_LANDED = [
  { id: 'pc.l1', turns: [{ by: 'a', conf: "I don't get a vote, so I borrowed a few. It's the best coaching I've done all week." }] },
  { id: 'pc.l2', turns: [{ by: 'a', conf: "They listened. I've spent days earning that, and it just paid off." }] },
  { id: 'pc.l3', turns: [{ by: 'a', conf: "Everybody thinks a coach is just here to run drills. Watch the votes come in on {target}, and then tell me that." }] },
  { id: 'pc.l4', turns: [{ by: 'a', conf: "I can't write a name, but I can make sure everyone else writes the right one." }] },
  { id: 'pc.l5', turns: [{ by: 'a', conf: "If {target} goes home, that's one less person who wants me gone. Coaching is going great." }] },
  { id: 'pc.l6', turns: [{ by: 'a', conf: "I told them what I saw. They agreed. That's all a coach can really do." }] },
];
const READ_STALLED = [
  { id: 'pc.s1', turns: [{ by: 'a', conf: "That's the problem with being a coach. They can ignore me, and nothing happens to them." }] },
  { id: 'pc.s2', turns: [{ by: 'a', conf: "Nobody's biting on {target}. I'm starting to think my name is the one going around." }] },
  { id: 'pc.s3', turns: [{ by: 'a', conf: "I trained these people. You'd think that would buy me one conversation. Apparently not." }] },
  { id: 'pc.s4', turns: [{ by: 'a', conf: "Without a vote, all I've got is advice. Nobody wanted my advice." }] },
  { id: 'pc.s5', turns: [{ by: 'a', conf: "Lesson learned. A coach who pushes too hard looks like a coach who's scared, and I'm a little scared." }] },
  { id: 'pc.s6', turns: [{ by: 'a', conf: "I said {target}, and everybody looked at their shoes. I don't like that at all." }] },
];

export const GUARANTEED = Object.fromEntries(['pitch.coach.yes', 'pitch.coach.maybe', 'pitch.coach.no', 'pitch.coachread.landed', 'pitch.coachread.stalled'].map(k => [k, ['tribal']]));
GUARANTEED['alliance.form.withcoach'] = ['group'];

export default {
  'pitch.coach.yes': YES,
  'pitch.coach.maybe': MAYBE,
  'pitch.coach.no': NO,
  'pitch.coachread.landed': READ_LANDED,
  'pitch.coachread.stalled': READ_STALLED,
  'alliance.form.withcoach': WITH_COACH,
};
