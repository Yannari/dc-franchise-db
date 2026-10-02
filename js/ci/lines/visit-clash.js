// ══════════════════════════════════════════════════════════════════════
// ci/lines/visit-clash.js — a visit that turns into an argument
// ══════════════════════════════════════════════════════════════════════
//
// blocking.js clash(): a blocked Player who resents the Influencer who
// blocked them, and is bold and short-fused enough, goes to have it out.
//   visit.choose.confront       a (blocked) decides where they are going;
//                               like every visit.choose, never says whose door
//   visit.talk.confront.fire    b (the Influencer) gives it right back
//   visit.talk.confront.take    b lets a say all of it
//   visit.talk.confront.defend  b explains; they talk past each other
//   visit.talk2.confront.walkout / .cooled   how it ends
//   visit.bye.walkout / .cooled               the door
//   visit.after.confront        a is the Influencer, alone; b just left
// `sole` (one Influencer, or two) is on the scene: "both of you" only when it was.
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });

export const VISIT_CLASH = {
  ...E('visit.choose.confront', [
    { turns: [{ by: 'a', say: "Oh, I'm not going there for a hug. I'm going there for a conversation." }], beat: '{a} is out the door before the screen finishes talking.' },
    { turns: [{ by: 'a', react: "'You may visit one Player.' Perfect. Somebody has some explaining to do." }, { by: 'a', say: "And they're not gonna like how I ask." }] },
    { turns: [{ by: 'a', say: "I've been typing nice for days. I'm done typing nice." }], beat: '{a} pulls {a.posAdj} hair back like {a.sub} is going into a fight.' },
    { turns: [{ by: 'a', say: "They said it in a message. Let's see them say it to my face." }] },
    { turns: [{ by: 'a', react: "Oh, I know where I'm going." }, { by: 'a', say: "Somebody's about to have a very bad night." }], beat: '{a} cracks {a.posAdj} knuckles in the hallway.' },
  ]),

  // ── The Influencer gives it right back ───────────────────────────────
  ...E('visit.talk.confront.fire', [
    { turns: [
      { by: 'a', say: "You smiled at me in every chat, and then you blocked me. Who does that?" },
      { by: 'b', say: "Somebody who's playing the game. You'd have done the same thing to me." },
      { by: 'a', say: "Don't tell me what I'd have done. You don't know me." },
      { by: 'b', say: "Exactly! I don't know you! That's why you're gone!" },
    ], beat: '{a} stands up off the couch, and {b} stands up too.' },
    { turns: [
      { by: 'a', say: "Fake. You are so fake." },
      { by: 'b', say: "I'm fake? You told every single person in there what they wanted to hear." },
      { by: 'a', say: "That's called being nice! You should try it!" },
      { by: 'b', say: "I was nice! Right up until I had to choose!" },
    ], beat: 'The voices in the apartment get louder.' },
    { turns: [
      { by: 'a', say: "You didn't even have the guts to tell me anything in a chat first." },
      { by: 'b', say: "What was I supposed to say? 'Hey, heads up, you're done'?" },
      { by: 'a', say: "Yeah! Something! Anything!" },
      { by: 'b', say: "Don't come into MY apartment and yell at me for playing better than you." },
    ], beat: '{b} points at the door, and {a} does not move.' },
    { turns: [
      { by: 'b', say: "Before you start, I'm not apologizing." },
      { by: 'a', say: "Wow. You haven't even heard what I came to say." },
      { by: 'b', say: "I know what you came to say. You think you deserved to stay. You didn't." },
      { by: 'a', say: "Who made you the judge of that?" },
      { by: 'b', say: "The Circle did. That's literally what an Influencer is." },
    ] },
    { turns: [
      { by: 'a', say: "I trusted you. I told you things I didn't tell anybody." },
      { by: 'b', say: "You trusted a profile picture and some emojis. So did I. That's this place." },
      { by: 'a', say: "Don't make this about the Circle. This is about you." },
      { by: 'b', say: "Fine! I wanted to stay more than I wanted you to stay. Happy?" },
    ], beat: '{a} laughs, and it is not a happy laugh.' },
  ]),

  // ── The Influencer takes it ──────────────────────────────────────────
  ...E('visit.talk.confront.take', [
    { turns: [
      { by: 'a', say: "Do you have any idea what you just did to me?" },
      { by: 'b', say: "I do. Say whatever you need to say. I'll sit here and take it." },
      { by: 'a', say: "I gave you everything in there. Every chat, every secret. And you threw me out." },
      { by: 'b', say: "You're right. I did." },
    ], beat: '{b} keeps {b.posAdj} eyes on {a} the whole time.' },
    { turns: [
      { by: 'a', say: "I'm so angry I can't even sit down." },
      { by: 'b', say: "Then don't sit. Yell at me. I deserve some of it." },
      { by: 'a', say: "Some of it? You deserve ALL of it." },
      { by: 'b', say: "Okay. All of it." },
    ], beat: '{a} paces from the door to the couch and back.' },
    { turns: [
      { by: 'a', say: "You could've picked anybody. Anybody! You picked me." },
      { by: 'b', say: "I know. I've felt sick about it all night." },
      { by: 'a', say: "Good. You should feel sick." },
    ], beat: '{b} nods and does not argue.' },
    { turns: [
      { by: 'b', say: "I knew it'd be you at the door. I'm not gonna hide from it." },
      { by: 'a', say: "Don't act brave now. You weren't brave when you typed my name." },
      { by: 'b', say: "That's fair. That's really fair." },
    ] },
    { turns: [
      { by: 'a', say: "Say something! Don't just sit there and nod at me!" },
      { by: 'b', say: "What do you want me to say? I'm sorry. I made a call and it was you." },
      { by: 'a', say: "Sorry doesn't put me back in the game." },
    ], beat: '{b} looks down at {b.posAdj} hands.' },
  ]),

  // ── The Influencer explains; they talk past each other ───────────────
  ...E('visit.talk.confront.defend', [
    { turns: [
      { by: 'a', say: "Why me? And don't give me 'it was a game move.'" },
      { by: 'b', say: "But it was a game move! You were connected to everybody." },
      { by: 'a', say: "So being nice to people got me blocked? That's your excuse?" },
      { by: 'b', say: "It's not an excuse, it's the reason. Those are different things." },
    ], beat: '{a} and {b} sit on opposite ends of the couch.' },
    { turns: [
      { by: 'a', say: "You owe me an explanation." },
      { by: 'b', say: "I don't owe you anything. But I'll give you one anyway. You were a threat." },
      { by: 'a', say: "A threat? I was barely hanging on in there!" },
      { by: 'b', say: "And everybody still liked you. That's the kind of threat I mean." },
    ] },
    { turns: [
      { by: 'a', say: "You looked me in the eye in that chat and told me I was safe." },
      { by: 'b', say: "You were safe. Then the ratings came in and everything changed." },
      { by: 'a', say: "Everything changed in one night? Come on." },
      { by: 'b', say: "Yes! In one night! That's how this place works!" },
    ], beat: '{b} throws {b.posAdj} hands up.' },
    { turns: [
      { by: 'a', say: "Whose idea was it? Yours or the other one's?" },
      { by: 'b', say: "We decided together. Don't make this about one person." },
      { by: 'a', say: "I'm making it about the person I'm looking at." },
    ], when: { sole: false } },
    { turns: [
      { by: 'a', say: "Just tell me what I did wrong." },
      { by: 'b', say: "Nothing! You did nothing wrong. That's what makes it so hard to explain." },
      { by: 'a', say: "So I'm gone for nothing. Great. Thanks." },
    ] },
  ]),

  // ── How it ends: a walk-out ──────────────────────────────────────────
  ...E('visit.talk2.confront.walkout', [
    { turns: [
      { by: 'a', say: "You know what? I don't even want an answer anymore." },
      { by: 'b', say: "Then why did you come here?" },
      { by: 'a', say: "To see if you'd say it to my face. Now I know you would. That's worse." },
    ] },
    { turns: [
      { by: 'b', say: "Can we just calm down for a second?" },
      { by: 'a', say: "No. You don't get to decide when I calm down. You've decided enough tonight." },
    ], beat: '{a} heads for the door.' },
    { turns: [
      { by: 'a', say: "I hope the next person you block gives you the same speech." },
      { by: 'b', say: "Fine. Hope away." },
    ] },
    { turns: [
      { by: 'a', say: "I'm done. I'm actually done." },
      { by: 'b', say: "Wait, can we just—" },
      { by: 'a', say: "No." },
    ], beat: '{a} is already at the door.' },
    { turns: [
      { by: 'a', say: "Everybody in there is gonna find out who you really are." },
      { by: 'b', say: "Is that a threat?" },
      { by: 'a', say: "It's a promise. Enjoy your night." },
    ] },
  ]),

  // ── How it ends: cooled down ─────────────────────────────────────────
  ...E('visit.talk2.confront.cooled', [
    { turns: [
      { by: 'a', say: "Okay. I'm still mad. But I get it. I hate that I get it." },
      { by: 'b', say: "For what it's worth, I'd rather have you yell at me than ignore me." },
    ], beat: '{a} finally sits back down.' },
    { turns: [
      { by: 'b', say: "Can I say one thing? I really did like you. That part was real." },
      { by: 'a', say: "Yeah. Me too. That's why it hurts so much." },
    ] },
    { turns: [
      { by: 'a', say: "I came here to scream at you, and now I kind of want to hug you. I hate this place." },
      { by: 'b', say: "Honestly? Same." },
    ], beat: '{a} and {b} both laugh, a little too loud.' },
    { turns: [
      { by: 'b', say: "If you need to yell more, I'm still here." },
      { by: 'a', say: "No. I'm done yelling. Just win, okay? Make it worth it." },
    ] },
    { turns: [
      { by: 'a', say: "Okay. Breathe. I said what I needed to say." },
      { by: 'b', say: "And I heard all of it. Every word." },
    ] },
  ]),

  ...E('visit.bye.walkout', [
    { turns: [{ by: 'a', say: "Bye, {b}. Good luck. You're gonna need it." }], beat: 'The door slams, and {b} stands alone in the apartment.' },
    { turns: [{ by: 'b', say: "So that's it? No goodbye?" }, { by: 'a', say: "That was the goodbye." }], beat: '{a} walks out without looking back.' },
    { turns: [{ by: 'a', react: "Don't follow me." }], beat: '{a} leaves the door open behind {a.obj}, and {b} closes it slowly.' },
    { turns: [{ by: 'b', say: "I'm sorry it ended like this." }, { by: 'a', say: "No, you're not." }], beat: 'The door shuts hard.' },
  ]),
  ...E('visit.bye.cooled', [
    { turns: [{ by: 'a', say: "Come here. One hug. I'm still mad, though." }, { by: 'b', say: "Mad hugs are the best hugs." }], beat: '{a} and {b} hug at the door.' },
    { turns: [{ by: 'b', say: "We're okay?" }, { by: 'a', say: "We will be. Ask me in a week." }], beat: '{a} squeezes {b}\'s arm on the way out.' },
    { turns: [{ by: 'a', say: "Take care of yourself in there." }, { by: 'b', say: "You too, out there. I mean it." }] },
    { turns: [{ by: 'a', say: "Okay. I'm leaving before I cry in your apartment." }, { by: 'b', say: "Too late. I already am." }], beat: '{a} and {b} hug, and both of them are crying.' },
  ]),

  ...E('visit.after.confront', [
    { turns: [{ by: 'a', react: "Oh my God. My hands are shaking." }, { by: 'a', say: "I knew {b} would come. I didn't know it would be like THAT." }], beat: '{a} sits down on the couch and stares at the door.' },
    { turns: [{ by: 'a', say: "Okay. That was a lot. That was a LOT." }, { by: 'a', say: "{b} is gonna tell everybody about me in that goodbye video. I just know it." }] },
    { turns: [{ by: 'a', say: "Was I the bad guy just now? I think I was the bad guy." }], beat: '{a} pulls a pillow over {a.posAdj} face.' },
    { turns: [{ by: 'a', say: "I'm not gonna lie, that hurt more than the blocking did." }, { by: 'a', say: "And I wasn't even the one who got blocked." }] },
    { turns: [{ by: 'a', react: "Wow. Okay. I need a minute." }, { by: 'a', say: "Somebody in here is gonna ask me what happened, and I have no idea what to say." }], beat: '{a} paces the apartment for a long time.' },
  ]),
};
