// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/whack.js — Whacktivity week (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/whacktivity.js. Houseguests walk, in public, to the
// door of the power they want; {power} is that door.
//
//   whack.declared   a walked to {power}; b saw it                         scene
//   whack.crowd      a and b (and c) all went for {power}                   scene
//   whack.shut       a's door never opened; b saw it                       scene; intent seen
//   whack.satout     a went for no door; b reads it                         safe | scared
//   whack.suspect    a can name who was in the room that opened: b and c    scene
//   whack.hoh        a, the HOH, watched b walk to a door                   scene
//   whack.normal     a may have won {power}; b watches how a acts           overplayed | fine
//   whack.after      a week on, a still watches b and c                     scene

export default {
  'whack.declared.scene': [
    { id: 'wk2.d1', turns: [{ by: 'b', dr: "Nobody knows what happened behind that door. Everyone knows {a} walked through the one marked {power}." }] },
    { id: 'wk2.d2', turns: [{ by: 'b', say: "You wanted {power}." }, { by: 'a', say: "Maybe." }, { by: 'b', say: "Not maybe. We all watched you walk in." }] },
    { id: 'wk2.d3', turns: [{ by: 'a', dr: "I crossed the room in front of everyone to get to {power}. There's no hiding what I wanted now." }] },
    { id: 'wk2.d4', turns: [{ by: 'b', say: "Why {power}, specifically?" }, { by: 'a', say: "...It looked fun." }, { by: 'b', say: "Sure." }] },
    { id: 'wk2.d5', turns: [{ by: 'b', dr: "{a} walked straight to {power}. That tells me exactly how {a}'s week is going." }] },
    { id: 'wk2.d6', turns: [{ by: 'a', dr: "Everyone keeps asking me why I picked {power}. There's no good answer that isn't a confession." }] },
  ],
  'whack.crowd.scene': [
    { id: 'wk2.c1', turns: [{ by: 'a', dr: "{b} walked to the same door as me. So now I know who my competition is." }] },
    { id: 'wk2.c2', turns: [{ by: 'b', dr: "Everyone who went for {power} found out at the same moment that everyone else wanted it too." }] },
    { id: 'wk2.c3', turns: [{ beat: '{a} and {b} end up in the same queue for {power}.' }, { by: 'a', say: "Fancy seeing you here." }, { by: 'b', say: "Don't." }] },
    { id: 'wk2.c4', turns: [{ by: 'a', dr: "That door wasn't a secret alliance. It was a public list of people with the same plan." }] },
    { id: 'wk2.c5', turns: [{ by: 'b', say: "So you want {power} too." }, { by: 'a', say: "Apparently we both do." }] },
    { id: 'wk2.c6', when: { third: true }, turns: [{ by: 'c', dr: "{a}, {b} and I all went for the same thing. None of us are friends any more." }] },
  ],
  'whack.shut.scene': [
    { id: 'wk2.s1', turns: [{ by: 'a', dr: "I picked {power}. The door never opened. Everyone still watched me walk to it." }] },
    { id: 'wk2.s2', when: { intent: 'seen' }, turns: [{ by: 'a', say: "I didn't even get to play." }, { by: 'b', say: "Everyone saw you try, though." }] },
    { id: 'wk2.s3', turns: [{ by: 'a', dr: "Worst result possible. A room that didn't open, and a whole house that knows what I wanted." }] },
    { id: 'wk2.s4', turns: [{ by: 'a', dr: "I went for it and got nothing. People won't remember the nothing. They'll remember I went for it." }] },
    { id: 'wk2.s5', when: { intent: 'seen' }, turns: [{ by: 'b', dr: "{a}'s door never opened. I'm still going to remember which one {a} picked." }] },
    { id: 'wk2.s6', turns: [{ by: 'a', dr: "Wrong door, wrong week. Story of my game." }] },
  ],
  'whack.satout.safe': [
    { id: 'wk2.o1', turns: [{ by: 'b', dr: "{a} didn't go for any door. Only someone who feels safe turns down a free shot at power." }] },
    { id: 'wk2.o2', turns: [{ by: 'a', say: "I didn't need it." }, { by: 'b', dr: "{a} thinks this week can't touch {a.obj}. I want to know why." }] },
    { id: 'wk2.o3', turns: [{ by: 'b', dr: "Everyone else crossed the room. {a} stayed put. That's comfortable. Comfortable is dangerous." }] },
    { id: 'wk2.o4', turns: [{ by: 'a', dr: "Everyone ran for a door. I didn't need to. Let them wonder why." }] },
    { id: 'wk2.o5', turns: [{ by: 'b', say: "You didn't go for anything." }, { by: 'a', say: "Didn't need to." }, { by: 'b', say: "Interesting." }] },
    { id: 'wk2.o6', turns: [{ by: 'a', dr: "Sitting it out was a choice. Not everyone understood it." }] },
  ],
  'whack.satout.scared': [
    { id: 'wk2.x1', turns: [{ by: 'a', dr: "I couldn't decide fast enough. So I didn't pick anything. Now everyone's reading into it." }] },
    { id: 'wk2.x2', turns: [{ by: 'b', say: "Why didn't you move?" }, { by: 'a', say: "I... didn't know which door." }, { by: 'b', dr: "Or {a} didn't want to be seen wanting something." }] },
    { id: 'wk2.x3', turns: [{ by: 'b', dr: "{a} stayed on the sofa. Half the house thinks it was clever. I think {a} panicked." }] },
    { id: 'wk2.x4', turns: [{ by: 'a', dr: "Not walking was meant to be invisible. It wasn't." }] },
    { id: 'wk2.x5', turns: [{ by: 'b', say: "Everyone, look who didn't move." }, { beat: 'Everyone looks at {a}.' }] },
    { id: 'wk2.x6', turns: [{ by: 'a', dr: "I froze. In this house, freezing looks like a strategy." }] },
  ],
  'whack.suspect.scene': [
    { id: 'wk2.u1', turns: [{ by: 'a', dr: "I don't know if anyone came out of that room with something. I do know who went in. {b} and {c}." }] },
    { id: 'wk2.u2', turns: [{ by: 'a', say: "One of you has it." }, { by: 'b', say: "Has what?" }, { by: 'c', say: "Has what?" }, { by: 'a', dr: "Identical answers. Great." }] },
    { id: 'wk2.u3', turns: [{ by: 'a', dr: "The suspects walked in right in front of us. I just can't tell which of {b} and {c} it is." }] },
    { id: 'wk2.u4', turns: [{ by: 'a', dr: "{b} and {c} are getting watched all week. At most one of them deserves it." }] },
    { id: 'wk2.u5', turns: [{ by: 'a', say: "So who won {power}?" }, { beat: '{b} and {c} both shrug.' }] },
    { id: 'wk2.u6', turns: [{ by: 'b', dr: "Everyone's looking at me like I'm holding something. I might be. I'm not saying." }] },
  ],
  'whack.hoh.scene': [
    { id: 'wk2.h1', turns: [{ by: 'a', dr: "I wasn't allowed to play. So I watched who walked towards something that could be used on me. {b} was one of them." }] },
    { id: 'wk2.h2', turns: [{ by: 'a', dr: "The HOH doesn't get a door. I get a list. {b} is on it." }] },
    { id: 'wk2.h3', turns: [{ by: 'a', say: "Interesting who moved." }, { beat: '{b} hears it. That was the point.' }] },
    { id: 'wk2.h4', turns: [{ by: 'a', dr: "I can't stop anyone going in that room. All I can do about {b} is remember." }] },
    { id: 'wk2.h5', turns: [{ by: 'b', dr: "{a} watched me walk to that door. {a} is HOH. That's not good for me." }] },
    { id: 'wk2.h6', turns: [{ by: 'a', dr: "Everyone who went for a power this week is on my radar. {b} first." }] },
  ],
  'whack.normal.overplayed': [
    { id: 'wk2.n1', turns: [{ by: 'a', say: "That room was a waste of time, honestly." }, { by: 'b', say: "I didn't ask." }, { by: 'b', dr: "{a} answered a question nobody asked." }] },
    { id: 'wk2.n2', turns: [{ by: 'b', dr: "{a} keeps changing the subject away from {power}. I wasn't thinking about it. Now I am." }] },
    { id: 'wk2.n3', turns: [{ by: 'a', say: "Honestly, it was nothing." }, { by: 'b', dr: "That's the third time {a} has said that." }] },
    { id: 'wk2.n4', turns: [{ by: 'a', dr: "I'm acting completely normal about that room. Completely normal." }] },
    { id: 'wk2.n5', turns: [{ by: 'b', say: "How did the room go?" }, { by: 'a', say: "Fine! Really fine. Nothing happened. Why?" }, { by: 'b', say: "Just asking." }] },
    { id: 'wk2.n6', turns: [{ by: 'b', dr: "Nobody is that relaxed about nothing." }] },
  ],
  'whack.normal.fine': [
    { id: 'wk2.f1', turns: [{ by: 'b', say: "How did it go?" }, { by: 'a', say: "Fine." }, { beat: 'That is the whole answer.' }] },
    { id: 'wk2.f2', turns: [{ by: 'a', dr: "I'm exactly as vague as everyone else who went in. That's the trick." }] },
    { id: 'wk2.f3', turns: [{ by: 'a', dr: "I let the subject drop. That's harder than it sounds." }] },
    { id: 'wk2.f4', turns: [{ by: 'b', dr: "{a} said nothing about that room. Neither did anyone else. I've got nothing." }] },
    { id: 'wk2.f5', turns: [{ by: 'b', say: "Anything happen in there?" }, { by: 'a', say: "What room?" }, { by: 'b', say: "Very funny." }] },
    { id: 'wk2.f6', turns: [{ by: 'a', dr: "If I've got something, nobody will know until I use it." }] },
  ],
  'whack.after.scene': [
    { id: 'wk2.a1', turns: [{ by: 'a', dr: "I can still name everyone who went into the {power} room. I still can't tell if any of them came out with something." }] },
    { id: 'wk2.a2', turns: [{ by: 'a', dr: "A week later, I'm still careful around {b}. I can't say why out loud." }] },
    { id: 'wk2.a3', turns: [{ by: 'a', dr: "Nobody has played anything. Holding something looks exactly like that." }] },
    { id: 'wk2.a4', turns: [{ by: 'b', dr: "The {power} room is old news. Except to {a}, apparently." }] },
    { id: 'wk2.a5', turns: [{ by: 'a', say: "Still nothing to tell me, {b}?" }, { by: 'b', say: "Still nothing." }, { by: 'a', say: "Hm." }] },
    { id: 'wk2.a6', turns: [{ by: 'a', dr: "Everyone forgot that room except me." }] },
  ],
};
