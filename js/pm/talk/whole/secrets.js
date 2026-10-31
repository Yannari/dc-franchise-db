// pm/talk/whole/secrets.js — two story beats about what one islander knows and
// another doesn't. One talk each, start to finish (pm/script.js talkScript
// `whole`), in their own voices (whole/voice.js).
//
// feels-off [a, b, c]  {c}, {a}'s partner, has been going off {a}, and {a} asks
//   {b}, a friend: "has {c} said anything to you?" (pm/threads.js doubt beat 2).
//   of: told ({b} heard {c} talk about it, and says so) · covers ({b} heard it,
//   and keeps it) · unsure ({b} knows nothing). `why` is the real reason, which
//   only {c} (and {b}, when told) knows: cooling · behind · eyes ({about}) · ick ·
//   played · triangle.
// secret-burden [a, b, c, d]  {a} saw what {c} did behind {d}'s back, with
//   {about}, and tells {b}. sec: pull · kiss · promise · bed. of: {b}'s advice
//   (tell · leave).
import { say } from './voice.js';

export const FEELS_OFF_WHOLE = { moves: { whole: [
  // ── {b} tells {a} what {c} said ──
  { when: { of: 'told', why: ['cooling', 'behind'] }, stage: "{a} sits down next to {b} on the steps by the pool.", turns: [
    ['a', "Can I ask you something? Has {c} said anything to you about me?"],
    ['b', "Why are you asking?"],
    ['a', "Because something's changed, and I can feel it."],
    say('b', "I'm not going to lie to you. {c} said {c.he}'s not feeling it like {c.he} was.", { soft: "I'm so sorry. {c} told me {c.he}'s not sure about you two any more. I hate being the one to say it." }),
    say('a', "I knew it. I knew something was wrong.", { nervy: "Oh. Okay. I knew. I think I knew.", sharp: "Then why hasn't {c} said that to me?" }),
    ['b', "Talk to {c.obj}. Don't let {c.obj} go quiet on you."],
  ], beat: "{a} nods, and looks across the garden at {c}." },
  { when: { of: 'told', why: 'eyes', hasAbout: true }, stage: "{a} sits down next to {b} on the steps by the pool.", turns: [
    ['a', "Be honest with me. Has {c} said anything to you?"],
    ['b', "Do you really want to know?"],
    ['a', "Yes."],
    say('b', "{c} said {c.he} keeps thinking about {about}.", { soft: "I'm sorry. {c} said {c.he} can't stop thinking about {about}. I didn't know how to tell you." }),
    say('a', "{about}. Of course it's {about}.", { romantic: "I thought it was us. I really thought it was us.", lad: "{about}? Seriously, bro?" }),
    ['b', "I'm sorry. I'd want to know, if it was me."],
  ], beat: "{a} gets up without a word and walks back into the villa." },
  { when: { of: 'told', why: ['ick', 'played', 'triangle'] }, stage: "{a} finds {b} in the bedroom, folding towels.", turns: [
    ['a', "Has {c} said anything about me? You'd tell me, wouldn't you?"],
    ['b', "I would. And yes. {c} said something's changed for {c.obj}."],
    ['a', "What does that mean?"],
    ['b', "I don't know exactly. I just know {c.he}'s not feeling the same."],
    say('a', "Thank you for telling me. I mean it.", { sharp: "Right. I'm going to find out what that means." }),
  ], beat: "{b} puts down the towel and gives {a} a hug." },
  // ── {b} knows, and covers ──
  { when: { of: 'covers' }, stage: "{a} sits down next to {b} on the steps by the pool.", turns: [
    ['a', "Has {c} said anything to you about me?"],
    ['b', "Like what?"],
    ['a', "Like whether {c.he}'s still into me. {c.He}'s been different."],
    say('b', "No. Nothing. I think {c.he}'s just tired.", { nervy: "No? I don't think so. Nothing I can think of." }),
    ['a', "Okay. Thanks."],
  ], beat: "{a} looks relieved. {b} looks at the pool, and doesn't look at {a} again." },
  { when: { of: 'covers' }, stage: "{a} finds {b} in the bedroom, folding towels.", turns: [
    ['a', "You're close with {c}. Is everything okay with {c.obj}?"],
    ['b', "As far as I know."],
    ['a', "Has {c.he} said anything about us?"],
    ['b', "Honestly, it's not my place. You should ask {c}."],
    ['a', "That sounds like a yes."],
    ['b', "It's not a yes. It's not my place."],
  ], beat: "{a} watches {b} fold the same towel twice." },
  // ── {b} knows nothing ──
  { when: { of: 'unsure' }, stage: "{a} sits down next to {b} on the steps by the pool.", turns: [
    ['a', "Can I ask you something? Does {c} seem different to you?"],
    ['b', "Different how?"],
    ['a', "Quieter. With me, anyway. {c.He}'s fine with everyone else."],
    ['b', "I haven't noticed. But you know {c.obj} better than I do."],
    say('a', "That's what scares me. I know something's wrong.", { nervy: "I can't stop thinking about it. Is it me?" }),
    ['b', "Then ask {c.obj}. Before you drive yourself mad."],
  ], beat: "{a} nods, and goes off to find {c}." },
  { when: { of: 'unsure' }, stage: "{a} finds {b} in the bedroom, folding towels.", turns: [
    ['a', "Has {c} said anything to you? About me?"],
    ['b', "No. Nothing. Why?"],
    ['a', "{c.He} barely looked at me at breakfast."],
    say('b', "Maybe {c.he}'s just having an off day. Everyone has them.", { soft: "I'm sure it's nothing. But if it's worrying you, talk to {c.obj}." }),
    ['a', "I hope you're right."],
  ], beat: "{b} hands {a} a towel to fold, and they don't talk about it any more." },
] } };

export const SECRET_BURDEN_WHOLE = { moves: { whole: [
  // ── a kiss ──
  { when: { sec: 'kiss', hasWith: true, of: 'tell' }, stage: "{a} pulls {b} into the dressing room and shuts the door.", turns: [
    ['a', "I need to tell someone, or I'm going to burst. I saw {c} kiss {about}."],
    ['b', "What? Are you sure?"],
    ['a', "I'm sure. They didn't see me."],
    say('b', "{d} needs to know. You can't keep that from {d}.", { soft: "That's awful. I think {d} deserves to know, even if it's horrible to say." }),
    say('a', "I know. I just don't want to be the one who blows it all up.", { sharp: "I know. And I'm going to tell {d}." }),
    ['b', "You didn't blow it up. {c} did."],
  ], beat: "{a} takes a deep breath, and nods." },
  { when: { sec: 'kiss', hasWith: true, of: 'leave' }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "Can I tell you something, and you can't tell anyone? I saw {c} kiss {about}."],
    ['b', "Oh my God."],
    ['a', "What do I do? Do I tell {d}?"],
    say('b', "I'd stay out of it. If it comes out, it comes out. It's not yours to tell.", { sharp: "Don't get involved. People always blame the one who told." }),
    ['a', "I feel sick keeping it from {d}."],
    ['b', "I know. But it's {c}'s mess, not yours."],
  ], beat: "{a} doesn't look convinced, but says nothing else." },
  // ── a pull, or plans for the outside ──
  { when: { sec: ['pull', 'promise'], hasWith: true, of: 'tell' }, stage: "{a} pulls {b} into the dressing room and shuts the door.", turns: [
    ['a', "I saw {c} with {about}. They were sitting really close, and it went on for ages."],
    ['b', "Did anything happen?"],
    say('a', "I don't know. But they stopped talking when I walked past. That's not a good sign.", { nervy: "I don't know. But it didn't look like nothing. I've felt weird about it all day." }),
    ['b', "Then {d} should know. Let {d} decide what it means."],
    ['a', "Okay. I'll tell {d}."],
  ], beat: "{b} squeezes {a}'s arm on the way out." },
  { when: { sec: ['pull', 'promise'], hasWith: true, of: 'leave' }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "I need your advice. I saw {c} and {about} together. Really close."],
    ['b', "Close how?"],
    ['a', "Close enough that I didn't like it. I keep thinking about {d}."],
    say('b', "But you don't know anything happened. I'd leave it.", { soft: "I'd wait. If you tell {d} and it was nothing, you've caused a row over a chat." }),
    ['a', "And if it wasn't nothing?"],
    ['b', "Then it'll come out without you."],
  ], beat: "{a} nods slowly, and goes back to the others." },
  // ── a shared bed at Casa ──
  { when: { sec: 'bed', hasWith: true }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "Did you see who {c} shared a bed with last night?"],
    ['b', "{about}. I saw."],
    ['a', "Do we say something to {d} when we get back?"],
    say('b', "I don't know. It might have been nothing.", { sharp: "If it was me, I'd want to know. So yes." }),
  ], beat: "Neither of them says anything else. They both know what they saw." },
  // ── no name to say ──
  { when: { hasWith: false }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "I've seen something about {c}, and I don't know what to do with it."],
    ['b', "Something bad?"],
    ['a', "Something {d} wouldn't want to know. Or would. I don't know."],
    say('b', "If it was me, I'd want to know.", { soft: "Take a day. Don't do anything while you're upset." }),
  ], beat: "{a} sits down on the bed, and puts {a.posAdj} head in {a.posAdj} hands." },
  // ── something {c} SAID at a debrief, and {a} heard it ──
  { when: { heard: true, hasWith: true, of: 'tell' }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "Can I tell you something I heard? At the debrief, {c} said {c.he} likes {about}."],
    ['b', "With {d} right downstairs?"],
    ['a', "With {d} right downstairs."],
    say('b', "Then {d} should know. If it was me, I'd want to know.", { soft: "That's horrible for {d}. I think {d} needs to hear it." }),
    ['a', "I know. I hate this."],
  ], beat: "{a} looks at the door, working out what to say." },
  { when: { heard: true, hasWith: true, of: 'leave' }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "At the debrief, {c} said {c.he} likes {about}. I can't stop thinking about it."],
    ['b', "People say all sorts at debriefs. It doesn't mean they'll do anything."],
    ['a', "And {d}?"],
    say('b', "I'd leave it. If {c} acts on it, {d} will find out. Not from you.", { sharp: "Stay out of it. It's not your couple." }),
  ], beat: "{a} nods, but it clearly doesn't sit right." },
  { when: { heard: true, hasWith: false, of: 'tell' }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "I heard {c} at the debrief. {c.He} said {c.he}'s not feeling it with {d}."],
    ['b', "Does {d} know?"],
    ['a', "No. {d} thinks everything's fine."],
    say('b', "Then someone has to say something. It's not fair on {d}.", { soft: "That's so sad. {d} deserves to know the truth." }),
  ], beat: "{a} lets out a long breath." },
  { when: { heard: true, hasWith: false, of: 'leave' }, stage: "{a} and {b} are on their own in the dressing room.", turns: [
    ['a', "{c} said at the debrief that {c.he}'s not feeling it with {d}. Should I say something?"],
    ['b', "I wouldn't. That's for {c} to tell {d}, not you."],
    ['a', "It feels wrong, knowing."],
    ['b', "I know. But it's not yours to say."],
  ], beat: "{a} doesn't argue." },

] } };
