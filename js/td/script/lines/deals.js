// ══════════════════════════════════════════════════════════════════════
// td/script/lines/deals.js — side deals (camp-events.js SIDE DEALS)
// ══════════════════════════════════════════════════════════════════════
//
// deal.side.genuine — {a} offers {b} a final {size}, and means it.
// deal.side.hollow  — {a} offers it and does not mean it. Only {a}'s
//                     confessional says so: {b} never hears it.
// {size} is 'two' or 'three'. A final three has no third yet, so "you and me"
// lines are final-two only, and final-three lines say they pick the third
// together. Ids: 'sd.'.
//
// Shape (feedback: scenes with real dialogue): at most one line of staging,
// three to five spoken lines, end on what they do. No stings, no epigrams;
// a confessional says plainly what they are doing and why.
const TWO = { size: 'two' }, THREE = { size: 'three' };

const GENUINE = [
  { id: 'sd.a1', when: TWO, turns: [
    { beat: '{a} waits until the others have gone to bed, then sits down next to {b}.' },
    { by: 'a', say: "Can I ask you something? Who are you actually taking to the end?" },
    { by: 'b', say: "Honestly? I haven't thought that far." },
    { by: 'a', say: "Then think about me. Final two. You and me." },
    { by: 'b', say: "Okay. Yeah. Final two." },
    { beat: 'They shake on it.' },
  ] },
  { id: 'sd.a2', when: TWO, turns: [
    { by: 'a', say: "I'm just going to say it. I trust you more than anyone else here." },
    { by: 'b', say: "That's really nice to hear." },
    { by: 'a', say: "So let's make it official. Final two. Nobody else has to know." },
    { by: 'b', say: "Deal. But if you're messing with me, I'll find out." },
    { by: 'a', say: "I'm not." },
  ] },
  { id: 'sd.a3', turns: [
    { by: 'a', say: "Do you have a minute? Not here. Somewhere quieter." },
    { beat: '{a} and {b} walk away from the others.' },
    { by: 'a', say: "Everyone's making little deals. I want to make one with someone I actually like." },
    { by: 'b', say: "What kind of deal?" },
    { by: 'a', say: "Final {size}. We look out for each other all the way." },
    { by: 'b', say: "Okay. I'm in." },
  ] },
  { id: 'sd.a4', when: { band: 'friends', size: 'two' }, turns: [
    { by: 'b', say: "You look like you want to say something." },
    { by: 'a', say: "I do. We get on, right? Like, really get on." },
    { by: 'b', say: "Yeah, of course we do." },
    { by: 'a', say: "Then I want you next to me at the end. Final two." },
    { by: 'b', say: "I was hoping you'd ask." },
  ] },
  { id: 'sd.a5', when: { alliance: true }, turns: [
    { by: 'a', say: "The alliance is great and everything. But alliances fall apart." },
    { by: 'b', say: "So what are you saying?" },
    { by: 'a', say: "I'm saying if it ever does, I want to know I've still got you. Final {size}." },
    { by: 'b', say: "Just between us?" },
    { by: 'a', say: "Just between us." },
    { beat: '{b} nods, and they head back before anyone notices they were gone.' },
  ] },
  { id: 'sd.a6', when: { register: 'fiery' }, turns: [
    { by: 'a', say: "Okay, I'm not good at the sneaky stuff, so I'm just going to ask you straight out." },
    { by: 'b', say: "Go on." },
    { by: 'a', say: "Final {size}. Yes or no?" },
    { by: 'b', say: "Yes." },
    { by: 'a', say: "Great. Done." },
    { beat: '{a} slaps {b} on the shoulder and walks off.' },
  ] },
  { id: 'sd.a7', when: { register: 'shy' }, turns: [
    { by: 'a', say: "This is probably stupid, but would you ever want to make a deal? Like, a final {size}?" },
    { by: 'b', say: "That's not stupid." },
    { by: 'a', say: "Really?" },
    { by: 'b', say: "Really. I'd like that." },
    { beat: '{a} looks relieved and tries not to smile too much.' },
  ] },
  { id: 'sd.a8', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "You're smarter than people here give you credit for. I've noticed." },
    { by: 'b', say: "Thanks. I think." },
    { by: 'a', say: "Smart people should stick together. Final {size}. We look out for each other until the end." },
    { by: 'b', say: "And what do I get if I say yes?" },
    { by: 'a', say: "Me on your side. Nobody's coming after you while I'm next to you." },
    { by: 'b', say: "Okay. Final {size}." },
  ] },
  { id: 'sd.a9', when: { register: 'sweet' }, turns: [
    { by: 'a', say: "I know this is a game, but I really like you. Like, as a person." },
    { by: 'b', say: "Same. You're one of the good ones here." },
    { by: 'a', say: "So can we promise each other something? Final {size}. No matter what." },
    { by: 'b', say: "I promise." },
    { beat: 'They hug.' },
  ] },
  { id: 'sd.a10', when: { band: 'neutral' }, turns: [
    { by: 'a', say: "We haven't really talked much, have we?" },
    { by: 'b', say: "Not really, no." },
    { by: 'a', say: "That's kind of why I'm here. Nobody thinks of us together, so nobody would see it coming." },
    { by: 'b', say: "See what coming?" },
    { by: 'a', say: "A final {size}. You and me looking out for each other." },
    { by: 'b', say: "Huh. Okay. Let's try it." },
  ] },
  { id: 'sd.a11', when: { spot: 'dock' }, turns: [
    { beat: '{a} finds {b} sitting at the end of the dock and sits down next to {b.obj}.' },
    { by: 'a', say: "Mind if I join you?" },
    { by: 'b', say: "Go ahead." },
    { by: 'a', say: "I've been thinking about who I'd want with me at the end. You're on the list. Top of it." },
    { by: 'b', say: "Final {size}?" },
    { by: 'a', say: "Final {size}." },
  ] },
  { id: 'sd.a12', when: { early: false }, turns: [
    { by: 'a', say: "People are getting picked off one by one. I don't want to be next, and I don't want you to be either." },
    { by: 'b', say: "So what do we do?" },
    { by: 'a', say: "We stick together. Final {size}. If someone comes for you, they have to come for me too." },
    { by: 'b', say: "Okay. I'm in." },
  ] },
  { id: 'sd.a13', when: THREE, turns: [
    { by: 'a', say: "I want to make a final three with you." },
    { by: 'b', say: "Who's the third?" },
    { by: 'a', say: "We pick them together, later. Right now I just want to know you and I are solid." },
    { by: 'b', say: "We're solid." },
    { beat: 'They bump fists.' },
  ] },
  { id: 'sd.a14', when: THREE, turns: [
    { by: 'b', say: "What's up? You've been looking at me all through dinner." },
    { by: 'a', say: "I want a final three. You, me, and someone we both trust." },
    { by: 'b', say: "And who do we both trust?" },
    { by: 'a', say: "Let's work that out. But the two of us are in it, whatever happens." },
    { by: 'b', say: "Okay. Deal." },
  ] },
];

// {a} does not mean it. Only the confessional says so.
const HOLLOW = [
  { id: 'sd.h1', when: TWO, turns: [
    { by: 'a', say: "Final two. You and me." },
    { by: 'b', say: "Final two. I'm in." },
    { beat: 'They shake on it.' },
    { by: 'a', conf: "Do I mean it? For now. I need {b}'s vote for the next few weeks, and now I've got it." },
  ] },
  { id: 'sd.h2', turns: [
    { by: 'a', say: "I trust you. I want you with me at the end." },
    { by: 'b', say: "Really? That means a lot." },
    { by: 'a', say: "Final {size}?" },
    { by: 'b', say: "Final {size}." },
    { by: 'a', conf: "I need {b} to believe I'm taking {b.obj} to the end. Then my name never goes on {b}'s ballot." },
  ] },
  { id: 'sd.h3', turns: [
    { by: 'a', say: "Can we make a deal? Final {size}. We keep each other safe." },
    { by: 'b', say: "Yeah. Yeah, let's do it." },
    { by: 'a', conf: "{b} wanted a deal, so I gave {b.obj} one. I'm not planning to sit next to {b.obj} at the end." },
  ] },
  { id: 'sd.h4', when: { register: 'schemer' }, turns: [
    { by: 'a', say: "Between you and me, you're the only person here I trust." },
    { by: 'b', say: "Seriously?" },
    { by: 'a', say: "Seriously. Final {size}." },
    { by: 'b', say: "Okay. Final {size}." },
    { by: 'a', conf: "I don't trust {b}. I don't trust anyone. But {b} trusts me now, and that's what I needed." },
  ] },
  { id: 'sd.h5', turns: [
    { by: 'a', say: "Promise me we go to the end together." },
    { by: 'b', say: "I promise. Do you?" },
    { by: 'a', say: "Of course I do." },
    { by: 'a', conf: "I'll keep that promise as long as it helps me. When it stops helping me, I won't." },
  ] },
  { id: 'sd.h6', when: { band: 'friends' }, turns: [
    { by: 'b', say: "So we're really doing this? Final {size}?" },
    { by: 'a', say: "We're really doing this." },
    { beat: '{b} grins and heads back to the others.' },
    { by: 'a', conf: "I do like {b}. But I came here to win, and I'm not going to win sitting next to {b.obj}." },
  ] },
  { id: 'sd.h7', turns: [
    { by: 'b', say: "Can I trust you? Like, actually trust you?" },
    { by: 'a', say: "Of course. Final {size}. I'll shake on it right now." },
    { beat: 'They shake.' },
    { by: 'a', conf: "{b} is a vote I need right now. Later, {b} is a vote I don't need." },
  ] },
  { id: 'sd.h8', when: { early: true }, turns: [
    { by: 'a', say: "We should look out for each other. Final {size}." },
    { by: 'b', say: "This early?" },
    { by: 'a', say: "The earlier the better." },
    { by: 'b', say: "Okay. Yeah, why not." },
    { by: 'a', conf: "It's way too early to know who I'm taking to the end. But {b} doesn't need to know that." },
  ] },
];

export default {
  'deal.side.genuine': GENUINE,
  'deal.side.hollow': HOLLOW,
};
