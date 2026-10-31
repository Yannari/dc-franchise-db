// pm/talk/whole/graft-eyes.js — {a} tells {b} about {c}, who is with {d}.
// Whole conversations (pm/script.js talkScript): one talk, start to finish,
// in the speakers' own voices (whole/voice.js). The engine's facts:
//   theirs  'yes': {c} has given {a} something back · 'no': nothing yet
//   of      {b}'s line: 'go-for-it' or 'careful'
//   taken   {a} has a partner of their own ({pa})
//   fresh   {a} only walked in today or yesterday
import { say } from './voice.js';

const ME = { taken: false, fresh: false };

export const GRAFT_EYES_WHOLE = { moves: { whole: [
  // ── {c} has noticed {a} too ──
  { when: { ...ME, theirs: 'yes', of: 'careful' }, stage: "{a} and {b} are lying on the sunbeds at the far end of the garden.", turns: [
    say('a', "I think {c} likes me. {c.He} keeps finding reasons to sit next to me, even when {d}'s right there.", {
      lad: "I'm telling you, {~bro}, I swear {c} wants me. Every time I sit down, there {c.he} is. {d} is sitting right there and everything.",
      bestie: "{~Girl}, I'm not making this up. {c} likes me. I can feel it every time {c.he} looks over.",
      nervy: "Can I tell you something, and you won't laugh? I think {c} might like me. I keep catching {c.obj} looking at me.",
      dry: "I think {c} likes me. And before you say it, I've checked. It's not just me being hopeful.",
    }),
    ['b', "Are you sure {c.he}'s not just being friendly?"],
    say('a', "I don't think so. And the worst part is, I like {c.obj} too.", {
      lad: "Nah. That's not friendly. And I'm not going to lie, {~bro}, I'm into it.",
      romantic: "It's not friendly. I know what friendly feels like. This is different, and I feel it too.",
    }),
    say('b', "Then be careful. {c} is with {d}, and if this goes wrong, you still have to live with both of them.", {
      sharp: "Then think before you do anything stupid. {c} is with {d}, and you'll be the one everyone blames.",
      soft: "I just don't want you to get hurt. {c} is with {d}, and you could end up on your own.",
    }),
    ['a', "I know. I've thought about that."],
    ['b', "And you still want to talk to {c.obj}?"],
    say('a', "Yeah. I do.", { lad: "Yeah, {~bro}. I do.", nervy: "Yeah. I think I do. I really do." }),
  ], beat: "{a} looks over at {c}, and doesn't look away." },

  { when: { ...ME, theirs: 'yes', of: 'careful' }, stage: "{a} and {b} are making drinks in the kitchen, and {a} keeps looking over at the pool.", turns: [
    ['b', "That's the third time you've looked over there."],
    say('a', "I can't help it. {c} smiled at me this morning, and I haven't stopped thinking about it since.", {
      lad: "I can't help it, {~bro}. {c} smiled at me this morning, and that was it. I'm gone.",
      bestie: "I can't help it! {c} smiled at me this morning, and I've been useless ever since.",
    }),
    ['b', "{c} is with {d}."],
    ['a', "I know. But it wasn't just a smile. You know when you can tell?"],
    say('b', "I do know. That's why I'm worried. If {d} sees what I'm seeing, there's going to be a row.", {
      sharp: "I know exactly what you mean. And so will {d}, if you keep staring like that.",
    }),
    ['a', "So what do I do?"],
    ['b', "Talk to {c}, but do it properly. Don't sneak around. That's what makes people angry."],
  ], beat: "{a} nods, and picks up the drinks without taking {a.posAdj} eyes off the pool." },

  { when: { ...ME, theirs: 'yes', of: 'go-for-it' }, stage: "{a} and {b} are on the swing seat, watching the pool.", turns: [
    say('a', "{c} keeps looking at me. I'm not imagining it, am I?", {
      lad: "{~Bro}. {c}. Every time I look up, {c.he}'s already looking at me. Tell me I'm not imagining it.",
      bestie: "Tell me the truth. Is {c} looking at me, or am I going mad?",
      quiet: "Is {c} looking at me? I don't want to be the only one who thinks so.",
    }),
    ['b', "You're not imagining it. I've seen it too. Everyone has."],
    ['a', "So what do I do? {c.He}'s with {d}."],
    say('b', "You talk to {c.obj}. If {c.he} feels the same, {d} is going to find out sooner or later anyway.", {
      big: "You go and talk to {c.obj}! If {c.he} likes you back, you'll know in five minutes.",
      lad: "Go and talk to {c.obj}, {~bro}. You only get one go at this.",
      bestie: "You go and talk to {c.obj}, {~girl}. You'll regret it forever if you don't.",
    }),
    ['a', "And if {c.he} doesn't feel the same?"],
    ['b', "Then you'll know, and you can stop wondering."],
  ], beat: "{a} takes a deep breath and gets up off the swing seat." },

  { when: { ...ME, theirs: 'yes', of: 'go-for-it' }, stage: "{a} drags {b} down to the end of the garden, where nobody can hear them.", turns: [
    ['b', "Why are we all the way down here? What's happened?"],
    say('a', "Nothing yet. But last night {c} said something to me, and I can't stop thinking about it.", {
      lad: "Nothing yet. But {c} said something to me last night, {~bro}, and I swear it meant something.",
    }),
    ['b', "What did {c.he} say?"],
    ['a', "That it's easier talking to me than to anyone else in here. Including {d}."],
    say('b', "That's not nothing. That's a lot, actually.", {
      big: "That's not nothing! That's huge!",
      dry: "People don't say that by accident.",
    }),
    ['a', "So you think I should go for it?"],
    ['b', "I think you'd be mad not to find out what {c.he} meant."],
  ], beat: "{a} grins, and {b} shakes {b.posAdj} head and laughs." },

  // ── {c} hasn't given {a} anything ──
  { when: { ...ME, theirs: 'no', of: 'careful' }, stage: "{a} and {b} are sitting on the edge of the pool, feet in the water.", turns: [
    say('a', "I can't stop thinking about {c}. I know {c.he}'s with {d}. I know {c.he} probably doesn't even see me like that.", {
      lad: "I've got a problem, {~bro}. {c}. I can't stop thinking about {c.obj}, and {c.he}'s with {d}.",
      nervy: "I need to tell someone, or I'll burst. I like {c}. And I know {c.he}'s with {d}, and I know it's stupid.",
      romantic: "I think I'm falling for {c}. I know. I know {c.he}'s with {d}. I can't help it.",
    }),
    ['b', "Has {c.he} given you anything? Any sign at all?"],
    ['a', "Not really. {c.He}'s nice to me. That's it."],
    say('b', "Then I don't want you putting yourself out there for nothing. {c} looks happy with {d}.", {
      soft: "Then I'm worried about you. {c} looks happy with {d}, and I don't want you getting hurt for nothing.",
      sharp: "Then leave it. {c} is happy with {d}, and you'll only embarrass yourself.",
    }),
    ['a', "I know. It doesn't stop me feeling it, though."],
    ['b', "Give it a few days. If it's still there, we'll talk again."],
  ], beat: "{b} puts an arm round {a}, and they watch the water." },

  { when: { ...ME, theirs: 'no', of: 'careful' }, stage: "{a} finds {b} on the roof terrace, alone for once.", turns: [
    ['a', "Can I ask you something, and you'll be honest with me?"],
    ['b', "Always."],
    ['a', "Do you think {c} would ever look at me? Even if {d} wasn't there?"],
    say('b', "Honestly? I don't know. I've never seen {c.obj} look at anyone except {d}.", {
      soft: "I don't know. I'm sorry. I've only ever seen {c.obj} with {d}.",
      sharp: "Honestly? No. Not right now. {c} only has eyes for {d}.",
    }),
    say('a', "Yeah. That's what I thought.", { lad: "Yeah. Fair enough, {~bro}." }),
    ['b', "That doesn't mean you can't like {c.obj}. It just means I don't want you to wait around for something that might not happen."],
  ], beat: "{a} sits down next to {b}, and neither of them says anything for a while." },

  { when: { ...ME, theirs: 'no', of: 'go-for-it' }, stage: "{a} and {b} are lying on the daybeds.", turns: [
    say('a', "I like {c}. I know {c.he}'s with {d}, and I know {c.he} hasn't really noticed me. But I like {c.obj}.", {
      lad: "I'm just going to say it. I like {c}. {c.He}'s with {d}, and {c.he}'s never looked twice at me, but I like {c.obj}, {~bro}.",
      bestie: "Okay, I have to tell you. I really like {c}. And before you say anything, yes, I know about {d}.",
    }),
    ['b', "Then tell {c.obj}. What's the worst that can happen?"],
    ['a', "{c.He} says no, and everyone knows about it."],
    ['b', "And then you're exactly where you are now, except you'll know."],
    say('a', "You're right. I'd rather know.", { nervy: "You're right. I'm terrified, but you're right." }),
  ], beat: "{b} squeezes {a.posAdj} hand." },

  { when: { ...ME, theirs: 'no', of: 'go-for-it' }, stage: "{a} and {b} are getting ready in the dressing room.", turns: [
    ['b', "You've been quiet all evening. What's going on?"],
    ['a', "It's {c}. I really like {c.obj}, and {c.he} doesn't even know."],
    say('b', "Then make {c.obj} know. You're not going to get anywhere sitting in here.", {
      big: "Then go and tell {c.obj}! You're gorgeous, you're funny, and {c.he} should know about it!",
      soft: "Then maybe it's time {c.he} knew. You deserve a chance, too.",
    }),
    ['a', "What about {d}?"],
    ['b', "{d} isn't my friend. You are."],
  ], beat: "{a} laughs for the first time all evening." },

  // ── {a} has a partner of their own ──
  { when: { taken: true, fresh: false, of: 'careful' }, stage: "{a} and {b} are sitting on the steps by the pool.", turns: [
    ['a', "I need to tell someone, and it has to be you. I've got feelings for {c}."],
    ['b', "What about {pa}?"],
    say('a', "That's the thing. I care about {pa}. But when I'm with {c}, I feel something I don't feel with {pa}.", {
      lad: "I know, I know. {pa} is great. But {c}, I don't know, {~bro}. It's different.",
      romantic: "I care about {pa}. I do. But with {c}, it feels like it did in the films. I didn't know it could feel like that.",
    }),
    say('b', "You can't do this behind {pa}'s back. If you're going to go for {c}, you have to be honest with {pa} first.", {
      sharp: "Then sort it out. Don't you dare go sneaking round with {c} while {pa} thinks everything's fine.",
    }),
    ['a', "I know. That's what scares me."],
    ['b', "Then don't do anything until you know what you want."],
  ], beat: "{a} nods, and doesn't say anything for a long time." },

  { when: { phase: 'evening', taken: true, fresh: false, of: 'go-for-it' }, stage: "{a} and {b} are in the kitchen, the last two up.", turns: [
    say('a', "Don't judge me. I think I'm falling for {c}.", {
      lad: "Don't look at me like that, {~bro}. I think I'm falling for {c}.",
      bestie: "Promise you won't judge me. I think I'm falling for {c}.",
    }),
    ['b', "You're with {pa}."],
    ['a', "I know I'm with {pa}. But {c} is all I think about."],
    say('b', "Then you need to do something about it. It's not fair on {pa} if you stay just because it's easier.", {
      soft: "Then you have to be honest. {pa} deserves someone who's thinking about {pa.obj}.",
    }),
    ['a', "So you think I should talk to {c}?"],
    ['b', "I think you should be honest with everyone. Starting with yourself."],
  ], beat: "{a} looks at the floor, then back up at {b}, and nods." },

  // ── {a} has only just walked in ──
  { when: { fresh: true, of: 'careful' }, stage: "{a}, still new in the villa, sits down next to {b} on the daybeds.", turns: [
    ['b', "So go on. You've had a look round. Who's caught your eye?"],
    say('a', "{c}. I noticed {c.obj} the second I walked in.", {
      lad: "{c}, {~bro}. The second I walked in. That was it.",
      flirty: "{c}. Have you seen {c.obj}? Of course you have.",
      bestie: "{c}. Obviously. I noticed {c.obj} before I'd even put my bag down.",
    }),
    ['b', "{c} is with {d}. You know that, right?"],
    ['a', "I know. Everyone's told me. I still want to get to know {c.obj}."],
    say('b', "Just don't go in too hard. {d} is going to be watching your every move.", {
      sharp: "Then go carefully. {d} has already clocked you.",
    }),
    ['a', "I'll be honest with everyone. I'm not here to sneak around."],
  ], beat: "{a} looks over at {c} again, and smiles." },

  { when: { fresh: true, of: 'go-for-it' }, stage: "{a}, still new in the villa, finds {b} by the pool.", turns: [
    ['b', "How are you finding it? Be honest."],
    say('a', "Honestly? I only came in for one person, and it's {c}.", {
      lad: "Honestly, {~bro}? I came in for one person. {c}.",
      flirty: "Honestly? I came in here for {c}. I'm not going to pretend I didn't.",
    }),
    ['b', "You know {c.he}'s with {d}?"],
    ['a', "I know. But I didn't come all this way to sit on a sunbed and watch."],
    say('b', "Then go for it. You haven't got long to make your mark.", {
      big: "Then go for it! You've only got a few days, don't waste them!",
    }),
  ], beat: "{a} is already on {a.posAdj} feet." },
  // ── {a} is coupled too, and {b} says go for it (any time of day) ──
  { when: { taken: true, fresh: false, of: 'go-for-it', theirs: 'yes' }, stage: "{a} and {b} are lying on the sunbeds, away from the others.", turns: [
    ['a', "Can I tell you something? You can't tell anyone."],
    ['b', "Go on."],
    say('a', "I like {c}. Like, really like {c.obj}.", { lad: "I like {c}, {~bro}. I really like {c.obj}.", bestie: "Babe. I like {c}. I really, really like {c.obj}.", nervy: "I think I like {c}. I can't stop thinking about {c.obj}." }),
    ['b', "I know. I've seen how you look at each other."],
    ['a', "Each other? You think {c.he} feels it too?"],
    say('b', "I think {c.he} does. And I think you're only with {pa} because it's easy.", { soft: "I think {c.he} does. And I think you deserve to be with someone who makes you feel like that." }),
    ['a', "So what do I do?"],
    ['b', "Be honest with {pa}. Then go and talk to {c}."],
  ], beat: "{a} lies back and stares at the sky, and doesn't say anything for a while." },
  { when: { taken: true, fresh: false, of: 'go-for-it', theirs: 'no' }, stage: "{a} and {b} are in the dressing room, getting ready.", turns: [
    ['a', "Can I ask you something? Would it be really bad if I went for {c}?"],
    ['b', "You're with {pa}."],
    say('a', "I know. But I don't feel about {pa} the way I feel about {c}.", { lad: "I know, {~bro}. But {pa} isn't {c}. I can't help it.", romantic: "I know. But with {c}, I feel something I've never felt. I can't ignore it." }),
    ['b', "Does {c} even know?"],
    ['a', "No. I don't even know if {c.he} likes me."],
    say('b', "Then find out. But tell {pa} first. Don't do it behind {pa.posAdj} back.", { sharp: "Then find out. Just don't lie to {pa} while you do." }),
  ], beat: "{a} looks at {a.posAdj} reflection for a long time, and then nods." },
  { when: { taken: true, fresh: false, of: 'careful' }, stage: "{a} and {b} are sitting at the kitchen island.", turns: [
    ['a', "I think I've got a problem."],
    ['b', "What kind of problem?"],
    ['a', "{c}. I can't stop thinking about {c.obj}."],
    say('b', "You're with {pa}. And {c} is with {d}.", { lad: "Bro. You're with {pa}. And {c} is with {d}. Come on." }),
    ['a', "I know. I know all of that."],
    say('b', "Then be careful. You could lose {pa} over this and not even get {c}.", { soft: "I'm not judging you. I just don't want you to end up with nobody." }),
    ['a', "I know. I'm not going to do anything. Not yet."],
  ], beat: "{b} gives {a} a long look, and doesn't believe the last bit." },
  { when: { taken: true, fresh: false, of: 'careful' }, stage: "{a} and {b} are floating in the pool, the only two in it.", turns: [
    ['a', "Nobody can hear us out here, right?"],
    ['b', "Right. Why?"],
    say('a', "Because I think I like {c}. And I'm with {pa}. And {c} is with {d}.", { lad: "Because I like {c}, {~bro}. And it's a mess." }),
    ['b', "That's a lot of people to hurt."],
    ['a', "I know. That's why I haven't done anything."],
    say('b', "Keep it that way until you're sure. Really sure.", { soft: "Then be careful. You don't want to lose everything for a maybe." }),
  ], beat: "{a} floats there, looking up at the sky, saying nothing." },

] } };
