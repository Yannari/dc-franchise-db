// pm/talk/whole/debrief.js — after a ceremony, {a} talks the night over with {b},
// a friend on the same side ({Where}: the boys on the terrace, the girls in the
// dressing room). One talk, start to finish (pm/script.js talkScript `whole`),
// in their own voices (whole/voice.js). The stitched debrief had the narrator
// in the middle of it, a friend saying "Debriefs are where you find out what
// people really think", and "have one sad night, and then do it for her".
// What it's about is the engine's (pm/debrief.js `of`); {c} is who:
//   night one   happy · unsure (about {pa}) · rather ({c}) · rather-yours ({pb}, {b}'s own)
//   robbed      {c} took {a}'s partner tonight (since: before · tonight)
//   stole       {a} took {pa} from {c} · took-back: {a} took {pa} back from {c}, who'd picked {pa.obj}
//   refused     {a} said no to {c} at the fire pit, for a partner still to choose (taken: it worked)
//   twisted-on  {c} came back from Casa with someone else · twisted: {a} did, leaving {c}
//   miss        {c} went home (cMine: {c} was {a}'s partner) · blame: {c} voted {a}'s person out
//   next        {a} is scared of being next
//   eyeing      {c} walked in, and {a}'s partner couldn't stop looking · bomb-threat: {c} is after {a}'s partner
//   bomb-fancy  {a} likes the look of {c}
//   picked      {a} got who {a} wanted ({pa}; chose: {a} did the picking) · meh: {a} isn't feeling {pa}
// cGone: {c} went home tonight, so there's nobody to face in the morning.
import { say } from './voice.js';

const SHORT = ['short', 'note'];
const STAY = [undefined, false];

/** What the debrief knows that the shared facts don't (talk/index.js DEBRIEF.facts). */
export const debriefFacts = (state, ev) => ({ cGone: !!ev.extra?.cGone, cMine: !!ev.extra?.mine });

export const DEBRIEF_WHOLE = { moves: { whole: [
  // ── night one ──
  { when: { of: 'happy', taken: true }, stage: "Night one, after the coupling. {a} grabs {b} by the pool before anyone else can.", turns: [
    ['b', "Well? How do you feel?"],
    say('a', "Really happy. I didn't think I'd feel like this on the first night.", { lad: "Honestly? I'm {~buzzing}, bro. I got who I wanted.", bestie: "Babe. I'm so happy. I got exactly who I wanted.", quiet: "Happy. Really happy." }),
    ['b', "I could tell. You couldn't stop smiling."],
    ['a', "Is it mad to feel this good already?"],
    ['b', "No. Just enjoy it."],
  ], beat: "{a} looks over at {pa}, who is already looking back." },
  { when: { of: 'unsure', taken: true }, stage: "The first night, late. {a} and {b} sit on the end of a sunbed while everyone else gets ready for bed.", turns: [
    ['b', "Are you happy with how it went?"],
    say('a', "{pa} is lovely. I just thought I'd feel more. Is that awful?", { lad: "{pa} is a good one. I just didn't feel much, {~bro}. Is that bad?", nervy: "I don't know. {pa} is really nice. I just didn't feel the spark. Is that terrible?" }),
    ['b', "It's one night. Nobody feels it on the first night."],
    ['a', "And if I still don't feel it in a few days?"],
    ['b', "Then you'll know. But give {pa.obj} a chance first."],
  ], beat: "{a} nods, and looks over at {pa}, trying to feel something." },
  { when: { of: 'rather', cast: 3 }, stage: "Night one, after the coupling. {a} grabs {b} by the pool before anyone else can.", turns: [
    ['b', "Go on. How do you feel?"],
    say('a', "Can I be honest? The one I really liked was {c}.", { lad: "Honestly? It's {c}, {~bro}. I couldn't stop looking at {c.obj}.", bestie: "Okay, don't judge me. I liked {c}. From the second I saw {c.obj}." }),
    ['b', "Then why didn't you pick {c.obj}?"],
    ['a', "Because it didn't work out like that. It's night one. Nothing's decided."],
    ['b', "Then be nice to the one you're with, and see what happens."],
  ], beat: "{a} looks across the garden at {c}, and then quickly away." },
  { when: { of: 'rather-yours', bTaken: true }, stage: "The first night, late. {a} and {b} sit on the end of a sunbed.", turns: [
    ['b', "So? How do you feel about tonight?"],
    ['a', "I'm going to be honest with you, because you're my friend. If I'd had the choice, I'd have gone for {pb}."],
    say('b', "{pb}? My {pb}?", { sharp: "You're telling me this on night one?", lad: "{pb}? Bro. Come on." }),
    ['a', "I'm not going to do anything. I just didn't want to lie to you."],
    ['b', "Okay. Thanks for telling me, I suppose."],
  ], beat: "They sit there a moment longer, and it's a bit awkward now." },

  // ── robbed: {c} took {a}'s partner ──
  { when: { of: 'robbed', since: 'before' }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "Are you okay?"],
    say('a', "No. I thought we were solid. I really thought we were solid.", { lad: "No, bro. I thought we were solid. I'm {~gutted}.", bestie: "No, babe. I thought we were solid. I really did.", sharp: "I'm fine. I'm angry. {c} knew exactly what {c.he} was doing." }),
    ['b', "Nobody saw that coming."],
    ['a', "I did. A bit. I just didn't want to believe it."],
    say('b', "You'll be okay. It's not over in here.", { soft: "I'm so sorry. You didn't deserve that." }),
    ['a', "It feels over."],
  ], beat: "{b} puts an arm round {a}, and {a} lets {b.obj}." },
  { when: { of: 'robbed', since: 'before' }, stage: "{Where}, {a} sits down and doesn't say anything for a long time.", turns: [
    ['b', "Talk to me."],
    ['a', "I had to sit there and watch {c} stand up and say the name. My person's name."],
    ['b', "I know. I was watching your face."],
    say('a', "What do I do now?", { sharp: "I'm going to talk to {c} tomorrow. {c.He} knew we were together." }),
    ['b', "Tonight? Nothing. You sleep. Tomorrow, we work it out."],
  ], beat: "{a} nods, and wipes {a.posAdj} eyes." },
  { when: { of: 'robbed', since: 'tonight' }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "That was a lot."],
    ['a', "I picked someone, and ten minutes later {c} stood up and took them back."],
    ['b', "I know. You'd only just got together."],
    say('a', "I know. It still stings.", { lad: "I know, bro. Still stings.", sharp: "I know. I just don't like losing." }),
  ], beat: "{b} hands {a} a drink, and they sit for a bit." },

  // ── stole / took back ──
  { when: { of: 'stole', taken: true, cGone: STAY }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "So. You did it."],
    say('a', "I did it. I picked {pa}. I know how it looks.", { lad: "I did it, bro. I picked {pa}. I'm not sorry.", nervy: "I did it. Oh my God. I can't believe I did it." }),
    ['b', "{c} isn't going to be happy."],
    ['a', "I know. But I had to follow my heart. I'd have regretted it forever."],
    say('b', "Then own it. Tomorrow's going to be hard.", { soft: "Just be kind to {c} tomorrow. {c.He}'s going to be hurting." }),
    ['a', "I know."],
  ], beat: "{a} looks down at {c}, alone at the other end of the garden, and then looks away." },
  { when: { of: 'stole', taken: true, cGone: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "How are you feeling?"],
    ['a', "Guilty. I picked {pa}, and now {c} has gone home."],
    ['b', "That's not on you. You didn't send {c} home."],
    say('a', "Didn't I? If I hadn't picked {pa}, {c} would still be here.", { lad: "Feels like I did, bro." }),
    ['b', "You followed your heart. That's what you're here for."],
  ], beat: "{a} nods, but it doesn't help much." },
  { when: { of: 'took-back', taken: true, cGone: STAY }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You took {pa} back."],
    say('a', "Of course I did. {c} picked {pa} right in front of me. What was I supposed to do?", { sharp: "Of course I did. {c} tried it. I wasn't having it.", romantic: "I had to. I wasn't going to lose {pa} like that." }),
    ['b', "I'm not saying you were wrong. I'm saying tomorrow's going to be awkward."],
    ['a', "It can be awkward. I'm with who I want to be with."],
  ], beat: "{a} looks over at {pa}, and smiles for the first time all night." },
  { when: { of: 'took-back', taken: true, cGone: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You took {pa} back, and {c} has gone."],
    ['a', "I know. I feel bad. But I wasn't going to lose {pa}."],
    ['b', "Nobody blames you."],
    ['a', "I hope {c} is okay."],
  ], beat: "{a} is quiet for a while after that." },

  // ── refused: {a} said no to {c}, for a partner still to choose ──
  { when: { of: 'refused', taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "I can't believe you said no to {c} in front of everyone."],
    say('a', "I had to. I wanted {pa}. I wasn't going to pretend.", { lad: "Had to, bro. It was always {pa}.", romantic: "I had to. It's {pa}. It was always going to be {pa}." }),
    ['b', "And it worked. {pa} picked you."],
    say('a', "I know. I was so scared {pa.he} wouldn't.", { sharp: "I knew {pa.he} would." }),
  ], beat: "{a} grins, and {b} grins back." },
  { when: { of: 'refused', taken: false }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "Are you okay?"],
    ['a', "I said no to {c} for someone who didn't pick me."],
    ['b', "You did what felt right."],
    say('a', "And now I'm single. Brilliant.", { soft: "I know. I'd do it again. It still hurts." }),
  ], beat: "{b} puts an arm round {a}." },

  // ── Casa ──
  { when: { of: 'twisted-on' }, stage: "{Where}, {a} sits down and stares at the floor.", turns: [
    ['b', "Talk to me."],
    say('a', "I stuck. I stuck for {c}. And {c} walked in with someone else.", { lad: "I stuck, bro. I stuck. And {c} walks in with someone else.", bestie: "I stuck, babe. I stayed loyal. And {c} came back with someone else." }),
    ['b', "I know. I'm so sorry."],
    ['a', "I didn't even look at anyone else. Not once."],
    say('b', "That says everything about you, and nothing good about {c}.", { soft: "You did nothing wrong. Nothing." }),
  ], beat: "{a} cries, and {b} holds on until {a.he} stops." },
  { when: { of: 'twisted' }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "So. You came back with someone."],
    ['a', "I know. I saw {c}'s face. I'll never forget it."],
    ['b', "Do you regret it?"],
    say('a', "No. I don't think so. I just wish it hadn't had to hurt {c}.", { sharp: "No. I went with how I felt. That's the point of Casa.", nervy: "I don't know. Ask me tomorrow." }),
  ], beat: "{a} looks over at {c}, who won't look back." },

  // ── someone went home ──
  { when: { of: 'miss', cMine: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "Come here."],
    say('a', "I didn't even get to say goodbye properly. {c} was just gone.", { lad: "I didn't even get a {~proper} goodbye, bro. {c} has just gone.", bestie: "I didn't even get to say goodbye properly, babe. {c} has just gone." }),
    ['b', "I know. I'm so sorry."],
    say('a', "I keep looking for {c.obj}. Every time someone walks past, I look.", { romantic: "I really thought we were going to the end. I really thought it was {c}.", quiet: "I miss {c.obj} already." }),
    ['b', "You'll see {c.obj} on the outside."],
    ['a', "It's not the same."],
  ], beat: "{b} doesn't say anything else. {b.He} just stays." },
  { when: { of: 'miss', cMine: true }, stage: "{a} has gone up to bed early, and is sitting on {c}'s side of it.", turns: [
    ['b', "Do you want to talk about it?"],
    ['a', "Not really. I just don't want to sleep on my own."],
    ['b', "Then you won't. I'll stay."],
  ], beat: "{b} sits down beside {a}, and they don't say anything else." },
  { when: { of: 'miss', cMine: false }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You okay?"],
    say('a', "Not really. {c} was my person in here. My best friend.", { lad: "Not really, bro. {c} was my boy in here.", bestie: "Not really, babe. {c} was my girl in here." }),
    ['b', "I know. It's going to feel different without {c.obj}."],
    ['a', "It already does."],
    ['b', "You've still got me."],
  ], beat: "{a} puts {a.posAdj} head on {b}'s shoulder." },
  { when: { of: 'miss', cMine: false, tier: SHORT }, stage: "{Where}, {a} and {b} talk the night over.", turns: [
    ['a', "I can't believe {c} has gone."],
    ['b', "Me neither. It's going to be weird."],
  ], beat: "They sit quietly for a while." },
  { when: { of: 'blame' }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You've gone quiet."],
    ['a', "I saw {c}'s vote. I saw who {c} put up."],
    ['b', "I know. I saw it too."],
    say('a', "I'm not going to forget it.", { sharp: "{c} is going to have to explain that to me.", soft: "I don't even want to look at {c} right now." }),
  ], beat: "{a} looks across the garden at {c}, and doesn't look away." },
  { when: { of: 'next' }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You look worried."],
    say('a', "I'm next. I can feel it. Every ceremony, it gets a bit closer.", { lad: "I'm next, bro. I can feel it.", nervy: "I'm next. I know I am. I can't stop shaking." }),
    ['b', "You don't know that."],
    ['a', "I don't have a couple. I don't have anyone fighting for me."],
    ['b', "Then spend the next few days making sure you do."],
  ], beat: "{a} nods, but doesn't look any less worried." },

  // ── a bombshell walked in ──
  { when: { of: 'eyeing', taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You saw that, then."],
    say('a', "Everyone saw that. {pa} couldn't take {pa.posAdj} eyes off {c}.", { lad: "Everyone saw it, bro. {pa} couldn't stop looking at {c}.", bestie: "Babe, everyone saw. {pa} was staring at {c}." }),
    ['b', "It's a new face. Everyone looks at a new face."],
    ['a', "Not like that."],
    say('b', "Talk to {pa} tomorrow. Not tonight.", { sharp: "Then ask {pa} about it. Don't sit here wondering." }),
  ], beat: "{a} looks over at {pa}, who is still looking at {c}." },
  { when: { of: 'bomb-threat', taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "What's wrong?"],
    say('a', "{c} is going to go for {pa}. I know it.", { lad: "{c} is after {pa}, bro. You could see it.", bestie: "{c} wants {pa}, babe. I could see it straight away." }),
    ['b', "You don't know that."],
    ['a', "You could see it the second {c} walked in."],
    ['b', "Then you trust {pa}. That's all you can do."],
  ], beat: "{a} doesn't look like trusting {pa} is easy right now." },
  { when: { of: 'bomb-fancy' }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You've gone quiet."],
    say('a', "Did you see {c}? I can't stop thinking about {c.obj}.", { lad: "Bro. Did you see {c}? I'm done.", bestie: "Babe. Did you see {c}? I can't." }),
    ['b', "You're in a couple."],
    ['a', "I know. I'm just saying. I'm allowed to look."],
    ['b', "Looking's how it starts."],
  ], beat: "{a} laughs, but doesn't argue." },

  // ── a recoupling with no steal ──
  { when: { of: 'picked', chose: true, taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You picked {pa}."],
    say('a', "I picked {pa}. I was so nervous standing up there.", { lad: "I picked {pa}, bro. No doubt about it.", romantic: "I picked {pa}. It was never going to be anyone else." }),
    ['b', "You didn't look nervous. You looked sure."],
    ['a', "I was sure. I was just scared {pa.he} didn't feel the same."],
    ['b', "Did you see {pa.posAdj} face? {pa.He} feels the same."],
  ], beat: "{a} grins, and can't stop." },
  { when: { of: 'picked', chose: false, taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "Well. {pa} picked you."],
    say('a', "I didn't know who {pa} was going to say. My heart was going. And then {pa.he} said my name.", { bestie: "Babe. When {pa} said my name, I nearly cried.", lad: "Bro. When {pa} said my name, I could have run up there." }),
    ['b', "You got exactly who you wanted."],
    ['a', "I know. I can't believe it."],
  ], beat: "{a} looks over at {pa}, and {pa} waves." },
  { when: { of: 'picked', tier: SHORT, taken: true }, stage: "{Where}, {a} and {b} talk the night over.", turns: [
    ['a', "I got {pa}. I actually got {pa}."],
    ['b', "I know. I'm so happy for you."],
  ], beat: "{a} can't stop smiling." },
  { when: { of: 'meh', taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You don't look happy."],
    say('a', "I'm with {pa} now. {pa} is nice. I just don't feel anything.", { lad: "I'm with {pa}. {pa} is a good one. I just don't {~fancy} {pa.obj}, {~bro}.", bestie: "I'm with {pa}, and I'm not excited, babe. I feel like I should be." }),
    ['b', "Give it a few days."],
    ['a', "And if I still don't feel anything?"],
    ['b', "Then be honest with {pa}. But give {pa.obj} a chance first."],
  ], beat: "{a} nods, and doesn't look convinced." },
  { when: { of: 'meh', taken: true, tier: SHORT }, stage: "{Where}, {a} and {b} talk the night over.", turns: [
    ['a', "I'm with {pa}. I just don't feel it."],
    ['b', "Give it time."],
  ], beat: "{a} shrugs." },
  // ── more of the common nights ──
  { when: { of: 'bomb-threat', taken: true }, stage: "{Where}, {a} sits down and doesn't say anything for a while.", turns: [
    ['b', "Is it {c}?"],
    ['a', "It's {c}. Did you see how {c.he} looked at {pa}?"],
    ['b', "I saw."],
    say('a', "I've got a horrible feeling about tomorrow.", { lad: "I've got a bad feeling about this, {~bro}.", sharp: "{c} can try. {pa} is with me." }),
    ['b', "{pa} picked you. Remember that."],
  ], beat: "{a} nods, and tries to hold on to that." },
  { when: { of: 'bomb-threat', taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['a', "Can I ask you something? Do you think {pa} likes {c}?"],
    ['b', "{c} has been here five minutes."],
    ['a', "That's not a no."],
    say('b', "It's a no. {pa} has been looking at you all night.", { soft: "I don't think so. And if {pa} does, you'll know soon enough. Try to sleep." }),
  ], beat: "{a} looks over at {pa}, and {pa} looks back. That helps a bit." },
  { when: { of: 'meh', taken: true }, stage: "{Where}, {a} and {b} talk the night over.", turns: [
    ['a', "Can I be honest with you? I'm not excited about {pa}."],
    ['b', "Did you think you would be?"],
    ['a', "I hoped. {pa} is nice. That's all I've got. Nice."],
    say('b', "Nice can turn into something. Or it won't, and then you'll know.", { sharp: "Then don't waste {pa.posAdj} time." }),
  ], beat: "{a} looks across at {pa}, and tries to feel more than nice." },
  { when: { of: 'meh', taken: true }, stage: "{Where}, {b} sits down next to {a}.", turns: [
    ['b', "You don't look like someone who got what they wanted."],
    ['a', "Because I didn't. I ended up with {pa} because nobody else picked me."],
    ['b', "That doesn't mean it can't work."],
    say('a', "I know. I just wanted to be chosen. Not left over.", { romantic: "I wanted someone to stand up there and want me. Not end up with me." }),
  ], beat: "{b} puts an arm round {a}, and doesn't say anything else." },
  { when: { of: 'eyeing', taken: true }, stage: "{Where}, {a} sits down and stares at the floor.", turns: [
    ['b', "Talk to me."],
    ['a', "{pa} hasn't stopped looking at {c} since {c.he} walked in."],
    ['b', "Everyone's looking at {c}. It's new."],
    say('a', "Then why does it feel like it's just {pa}?", { sharp: "I'm not everyone. I'm with {pa}. And I saw it." }),
  ], beat: "{b} doesn't have an answer." },
  { when: { of: 'next' }, stage: "{Where}, {a} and {b} talk the night over.", turns: [
    ['a', "Did you see how close it was tonight?"],
    ['b', "I saw."],
    say('a', "Next time, that's me going home.", { nervy: "Next time, it's me. I can feel it.", lad: "Next time, I'm gone, {~bro}." }),
    ['b', "Then we spend this week making sure it isn't."],
  ], beat: "{a} lets out a breath, and nods." },
] } };
