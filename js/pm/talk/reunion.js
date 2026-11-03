// pm/talk/reunion.js — the reunion, in the studio, run by Dior (pm/reunion.js
// decides what happened since the villa and casts each segment; these are the
// words). Every scene is one whole conversation about one thing, and every
// islander in it speaks. Plain feelings, said the way people say them a few
// weeks after: no quips, no punchlines.
//
//   ru-open      []          Dior opens. `of`: splits (a couple has split since) · plain
//   ru-host      []          Dior turns to the next thing. `of`: recouplings · casa · exes · feuds · clips · friends
//   ru-winners   [a, b]      the winners. `fate`: together · stronger · split · friends; `why` (split; {a} ended it):
//                            faded · distance · different · trust · money; `envelope`: split · steal
//   ru-firstout  [a, b]      the first two dumped
//   ru-couple    [a, b]      a couple who left together. `fate` as above; `place`: final · left
//   ru-steal     [a, b, c]   {b} took {c} from {a} at a recoupling. `now` ({a} to {b}): over · hurt · cold; `lasted`: {b} and {c} made the end
//   ru-casa      [a, b, c]   {a} came back from Casa with {c}; {b} had waited. `now` ({b} to {a}); `lasted`: {a} and {c} made the end
//   ru-exes      [a, b]      {a} ended it with {b} in the villa. `now`: friends · awkward · hurt · still
//   ru-feud      [a, b]      two who couldn't stand each other. `now`: made-up · still · worse
//   ru-clip      [a, b, c]   after a clip of {a} with {c}: {b}, {a}'s partner then, has their say. `fate` of {a} and {b}: split · together · over
//   ru-friends   [a, b]      villa best friends. `now`: closer · same · drifted
//   ru-ask       []          Dior's quick question. `q`: again · learned · change · home
//   ru-quick     [a]         one answer. `q`; `how` {a} left: early · mid · walked · final · won
//   ru-public    [a]         how the public saw them. `label` (pm/ledger.js): fan-favourite · loved · liked · invisible · divisive · disliked · villain
//   ru-close     [a, b] / [] the winners' last word, and goodnight. `fate`
import { build } from './build.js';
import { say } from './whole/voice.js';

// The reunion's facts are the record's (pm/reunion.js), and nothing of the day: the studio is weeks later.
const NONE = { friction: false, rowedToday: false, kissed: false, heard: false, rebuffed: false, stoleFrom: false, promised: false, xAgain: false };
const factsOf = keys => (state, ev) => ({ ...NONE, ...Object.fromEntries(keys.map(k => [k, ev.extra?.[k] ?? null])) });
const kind = (name, keys, whole) => build(name, { plans: { featured: ['whole'], short: ['whole'] }, moves: { whole }, facts: factsOf(keys), tiered: false });

// ── the opening ─────────────────────────────────────────────────────────
export const RU_OPEN = kind('ru-open', ['of'], [
  { when: { of: 'plain' }, stage: "A studio full of lights and a live audience. One by one, the islanders walk out and take their seats on the sofas.", turns: [
    ['dior', "Good evening, and welcome to the Perfect Match reunion."],
    ['dior', "Every islander from this summer is here tonight. Some of you haven't seen each other since the day you left the villa."],
    ['dior', "We're going to talk about all of it. The couples, the break-ups, the friendships, and a few things you never got to see."],
  ], beat: "The audience cheers. On the sofas, a few of the islanders are already holding hands." },
  { when: { of: 'plain' }, stage: "The studio lights come up. The islanders are on three long sofas, the couples together, the others wherever they could find a seat.", turns: [
    ['dior', "Welcome to the reunion. It has been a few weeks since the final, and a lot has happened since."],
    ['dior', "Tonight we find out who is still together, who is still friends, and who is still not speaking."],
  ], beat: "A couple of the islanders look at each other and then quickly look away." },
  { when: { of: 'splits' }, stage: "A studio full of lights and a live audience. The islanders file onto the sofas, and some of the couples are not sitting together.", turns: [
    ['dior', "Good evening, and welcome to the Perfect Match reunion."],
    ['dior', "You might notice some of our couples have chosen different seats tonight. We will get to that."],
    ['dior', "But first, every islander from this summer is here, and I want to hear from all of you."],
  ], beat: "The audience goes \"ooh\". Somebody on the end sofa stares very hard at the floor." },
  { when: { of: 'splits' }, stage: "The studio lights come up on three sofas. Two people who left the villa together are sitting as far apart as they can.", turns: [
    ['dior', "Welcome to the reunion. It's been a few weeks since the final, and not everything has stayed the way we left it."],
    ['dior', "Tonight we talk about all of it, the good and the hard. Nobody is leaving until we do."],
  ], beat: "There is nervous laughter from the sofas." },
]);

// ── Dior turns to the next thing ───────────────────────────────────────
export const RU_HOST = kind('ru-host', ['of'], [
  { when: { of: 'public' }, turns: [['dior', "Some of you have had a very different summer to the one you had in the villa. The public have been watching every day, and they have opinions."]], beat: "A few of the islanders laugh nervously." },
  { when: { of: 'public' }, turns: [['dior', "In the villa you had no idea how you were coming across. You do now. Let's talk about that."]] },
  { when: { of: 'recouplings' }, turns: [['dior', "Let's go back to the recouplings. Some of you lost your partner at that fire pit, and some of you were the reason."]], beat: "A few people on the sofas shift in their seats." },
  { when: { of: 'recouplings' }, turns: [['dior', "Now, the recouplings. Every one of them changed somebody's summer, and two of them changed it a lot."]] },
  { when: { of: 'casa' }, turns: [['dior', "We can't have a reunion without talking about Casa Amor."]], beat: "The audience groans and laughs at the same time." },
  { when: { of: 'casa' }, turns: [['dior', "Casa Amor. The week that tested every couple in the villa. Not everyone came back the same."]] },
  { when: { of: 'exes' }, turns: [['dior', "Some of you broke up in the villa and then had to keep living with each other. I want to know how that is now."]] },
  { when: { of: 'exes' }, turns: [['dior', "Let's talk about the exes. Not every couple who started this summer finished it together."]], beat: "Two people on opposite sofas both suddenly find their drinks very interesting." },
  { when: { of: 'feuds' }, turns: [['dior', "Not everybody in that villa got along. Let's talk about that."]], beat: "The audience laughs. On the sofas, nobody does." },
  { when: { of: 'feuds' }, turns: [['dior', "Some of you could barely be in the same room in the villa. Tonight you're on the same stage."]] },
  { when: { of: 'clips' }, turns: [['dior', "Now. There were cameras everywhere in that villa, and not everything made it to air. Until tonight."]], beat: "The studio gasps, and several islanders put their heads in their hands." },
  { when: { of: 'clips' }, turns: [['dior', "We have some footage you've never seen. Some of you know exactly what I'm talking about."]], beat: "The big screen behind Dior lights up." },
  { when: { of: 'friends' }, turns: [['dior', "It wasn't all romance and arguments. Some of the best things to come out of that villa were friendships."]], beat: "The audience goes \"aww\"." },
  { when: { of: 'friends' }, turns: [['dior', "Let's talk about the friendships, because some of you found your best friend in there."]] },
]);

// ── the winners ────────────────────────────────────────────────────────
export const RU_WINNERS = kind('ru-winners', ['fate', 'why', 'envelope'], [
  { when: { fate: 'together' }, stage: "{a} and {b} sit in the middle sofa, holding hands.", turns: [
    ['dior', "Let's start with our winners. {a}, {b}, you won the whole thing. How has life been since the final?"],
    say('a', "Strange, honestly. In the villa it was just us. Now there are people everywhere, and the one thing that feels normal is {b}.", { romantic: "Every day I wake up and {b} is still there, and I still can't quite believe it." }),
    ['b', "We've been trying to have normal days. Walks, dinners, that kind of thing. It's been really nice."],
    ['dior', "Have there been any hard moments?"],
    ['b', "A couple. It's different when you're not together all day. You have to actually make time for each other."],
    ['a', "But we're doing it. I'm happy. I'm really happy."],
  ], beat: "{b} squeezes {a.posAdj} hand, and the audience cheers." },
  { when: { fate: 'together' }, stage: "{a} and {b} walk out together to the loudest cheer of the night.", turns: [
    ['dior', "Our winners. {b}, are you two still together?"],
    ['b', "We are. And it's been better than I thought it would be."],
    ['dior', "What did you think it would be?"],
    ['b', "I was scared it would only work in the villa. That we'd get home and not know how to be around each other."],
    say('a', "I was scared of the same thing. We talked about it on the first night back, and we've been talking ever since.", { lad: "Same, honestly. But we sat down the first night home and just talked it all through." }),
  ], beat: "The two of them smile at each other, and the studio goes \"aww\"." },
  { when: { fate: 'together', envelope: 'split' }, stage: "{a} and {b} sit together on the middle sofa.", turns: [
    ['dior', "{a}, {b}. You won, and then there was the envelope. {a}, did you ever think about keeping the money?"],
    ['a', "No. Not even for a second. We won it together."],
    ['b', "I knew {a} would share it. But I still held my breath when {a} opened it."],
    ['dior', "And now? Are you still together?"],
    ['b', "We are. We're doing really well."],
  ], beat: "{a} kisses {b} on the cheek, and the studio cheers." },
  { when: { fate: 'stronger' }, stage: "{a} and {b} sit close together on the middle sofa.", turns: [
    ['dior', "Our winners, {a} and {b}. I hear you have some news."],
    ['a', "We've moved in together."],
    ['dior', "Already?"],
    say('b', "I know it's quick. But we spent every day together in the villa, and then we went home and missed each other all the time. So we thought, why are we doing this?", { romantic: "When you know, you know. I didn't want to wake up without {a} any more." }),
    ['a', "I've met {b}'s family, {b}'s met mine. It feels real now. Not just a summer thing."],
  ], beat: "The audience is on its feet." },
  { when: { fate: 'stronger' }, stage: "{a} and {b} sit together, and {b} can't stop smiling.", turns: [
    ['dior', "{a}, {b}. Our winners. How are things?"],
    ['b', "Honestly? Better than in the villa. We get to just be us."],
    ['a', "I told {b} I loved {b.obj} again the day we got home. Without cameras. That felt important."],
    ['dior', "And what did {b} say?"],
    ['b', "I said it back. I'll always say it back."],
  ], beat: "The studio goes \"aww\", and {a} goes red." },
  { when: { fate: 'stronger', envelope: 'split' }, stage: "{a} and {b} sit on the middle sofa, holding hands.", turns: [
    ['dior', "Our winners. {a}, you had the envelope, and you shared it. What did you do with the money?"],
    ['a', "We put it toward a place together. We moved in last week."],
    ['b', "I still can't believe it. A few weeks ago we were sleeping in a room with twenty people."],
    ['dior', "Any regrets?"],
    ['b', "None. Not one."],
  ], beat: "The audience cheers, and the other couples clap along." },
  { when: { fate: 'split', why: 'faded' }, stage: "{a} and {b} sit on the same sofa, a gap between them.", turns: [
    ['dior', "Our winners. I have to ask. Are you still together?"],
    ['a', "No. We're not."],
    ['dior', "What happened?"],
    say('a', "It just faded. In the villa, everything felt so big. When we got home, I kept waiting to feel the same, and I didn't. I ended it.", { soft: "I didn't want to hurt {b}. But I couldn't pretend I still felt the way I did in there." }),
    ['b', "I knew something was off. I just hoped I was wrong."],
    ['dior', "{b}, how are you now?"],
    ['b', "Sad. But I'd rather it was honest than fake."],
  ], beat: "The studio is quiet. {a} reaches over and touches {b}'s arm, and {b} lets {a.obj}." },
  { when: { fate: 'split', why: 'distance' }, stage: "{a} and {b} sit on opposite ends of the middle sofa.", turns: [
    ['dior', "{a}, {b}. Our winners. I'm sorry to ask, but are you still together?"],
    ['b', "No."],
    ['a', "We live hours apart. We tried. Every weekend was a train or a long drive, and in the week we barely spoke."],
    ['dior', "Who ended it?"],
    ['a', "I did. I hated doing it. I just couldn't see how it would work."],
    ['b', "I wanted to keep trying. I still think we could have made it work."],
  ], beat: "Nobody in the studio says anything for a moment." },
  { when: { fate: 'split', why: 'different' }, stage: "{a} and {b} sit on the middle sofa, polite, a little stiff.", turns: [
    ['dior', "Our winners. How are things between you two?"],
    ['a', "We're not together any more."],
    ['dior', "Why?"],
    ['a', "Outside the villa, we just wanted different things. {b} wanted to settle down. I wasn't ready for that."],
    ['b', "I thought we were on the same page. Turns out we weren't even reading the same book."],
    ['dior', "Are you still friends?"],
    ['b', "We're trying. It's early."],
  ], beat: "{a} nods, and doesn't look up." },
  { when: { fate: 'split', why: 'trust' }, stage: "{a} and {b} sit on different sofas.", turns: [
    ['dior', "Our winners, sitting apart. {b}, what happened?"],
    ['b', "Things came out after the villa. Things I should have known in there."],
    ['dior', "{a}, do you want to answer that?"],
    ['a', "I ended it before it got worse. I'm not proud of everything I did in there."],
    ['b', "I would have forgiven a lot. I just needed you to be honest with me."],
  ], beat: "The studio is silent." },
  { when: { fate: 'split', why: 'money' }, stage: "{a} and {b} sit as far apart as the stage allows.", turns: [
    ['dior', "We have to talk about the envelope. {a}, you kept all the money."],
    ['a', "I did."],
    ['dior', "Why?"],
    ['a', "I've thought about it every day since. I made a choice in the moment, and I can't take it back."],
    ['dior', "{b}?"],
    ['b', "I loved you. I trusted you completely. You picked the money over me, in front of everyone."],
    ['a', "I'm sorry."],
    ['b', "I know you are. It doesn't change anything."],
  ], beat: "The studio is completely silent." },
  { when: { fate: 'friends' }, stage: "{a} and {b} sit together on the middle sofa, laughing about something before the cameras are even on.", turns: [
    ['dior', "Our winners, and our best friends. You won as friends. How is that friendship now?"],
    ['a', "Better than ever. We talk every day."],
    ['b', "We never pretended to be something we weren't. I think that's why it lasted."],
    ['dior', "Any romance since?"],
    ['b', "Not with each other. I love {a}, just not like that."],
  ], beat: "The audience cheers anyway." },
]);

// ── the first ones out ─────────────────────────────────────────────────
export const RU_FIRSTOUT = kind('ru-firstout', [], [
  { stage: "{a} and {b} sit together at the end of a sofa.", turns: [
    ['dior', "{a}, {b}. You two were the first to leave. What was it like, watching the rest of it from home?"],
    say('a', "Hard. I'd be on the sofa shouting at the screen, wishing I was still in there.", { quiet: "Hard. I watched every episode on my own, so nobody would see my face." }),
    ['b', "I couldn't watch at first. It hurt too much. I caught up later, all in one go."],
    ['dior', "Do you think you went too soon?"],
    ['b', "Yes. I never really got the chance to find anyone."],
    ['a', "Same. I'd have loved one more week."],
  ], beat: "The studio claps for them both." },
  { stage: "{a} and {b} sit side by side, near the back.", turns: [
    ['dior', "{a} and {b}, our first two out. How are you both?"],
    ['a', "I'm good. It took a while, but I'm good."],
    ['dior', "A while?"],
    ['a', "The first week home I felt like I'd failed. Everyone kept asking what happened, and I didn't have an answer."],
    say('b', "I felt the same. But I'm glad I went in. I'd do it again in a heartbeat.", { soft: "I felt the same. But I'm proud I went in at all. That took a lot." }),
  ], beat: "{a} nods along, and the audience applauds." },
  { stage: "{a} and {b} share the end of a sofa.", turns: [
    ['dior', "{a}, {b}, you had the shortest time in the villa. Is there anything you wish you'd done differently?"],
    ['b', "Said how I felt sooner. I was waiting for the right moment, and it never came."],
    ['a', "Been more myself. I was so nervous at the start that I didn't really let anyone in."],
    ['dior', "Well, we're glad to have you back tonight."],
    ['a', "Thank you. It's nice to see everyone."],
  ], beat: "The audience cheers, and {b} waves." },
]);

// ── a couple who left together ─────────────────────────────────────────
export const RU_COUPLE = kind('ru-couple', ['fate', 'why', 'place'], [
  // still together
  { when: { fate: 'together', place: 'final' }, stage: "{a} and {b} sit together, {b}'s head on {a}'s shoulder.", turns: [
    ['dior', "{a}, {b}. You made the final together. Are you still together?"],
    ['a', "We are."],
    ['dior', "How's it been?"],
    ['b', "Good. Really good. We see each other most weekends."],
    say('a', "I was nervous it wouldn't feel the same outside. It does. It feels better, actually.", { lad: "I was a bit worried it'd be different on the outside. It's not. It's better." }),
  ], beat: "The audience goes \"aww\"." },
  { when: { fate: 'together', place: 'final' }, stage: "{a} and {b} sit close on the end of a sofa.", turns: [
    ['dior', "{b}, {a}. Still going?"],
    ['b', "Still going."],
    ['dior', "Any arguments since you got out?"],
    ['b', "One or two. About silly things. Who's driving, whose turn it is to visit."],
    ['a', "But we talk it through now. We're better at that than we were in the villa."],
  ], beat: "They smile at each other, and the studio claps." },
  { when: { fate: 'together', place: 'final' }, stage: "{a} and {b} sit together, holding hands.", turns: [
    ['dior', "{a} and {b}. You didn't win, but you're still here together. Does the result still sting?"],
    ['a', "Not at all. I left with {b}. That's what I wanted."],
    ['b', "I mean it when I say we won anyway. I know that sounds like something people say."],
    ['dior', "It does, but I believe you."],
  ], beat: "The audience laughs, and then claps." },
  { when: { fate: 'together', place: 'final' }, stage: "{a} and {b} sit together on the middle sofa.", turns: [
    ['dior', "{a}, {b}. How has it been since the final?"],
    ['b', "Busy. But we've made time for each other every week."],
    ['dior', "{a}, what has surprised you most?"],
    say('a', "How easy it is. In the villa there was always something going on. Out here it's just the two of us, and it's easy.", { quiet: "That it's quiet. Just us. I like it a lot." }),
  ], beat: "{b} smiles, and doesn't let go of {a}'s hand." },
  { when: { fate: 'together', place: 'left' }, stage: "{a} and {b} sit together, near the end of a sofa.", turns: [
    ['dior', "{a}, {b}. You left the villa together, and you're still together. How?"],
    ['a', "We just kept going. Leaving early meant we got a head start on real life."],
    ['b', "We watched the rest of the season together, every night. It was strange, seeing everyone carry on without us."],
    ['dior', "Any regrets about leaving when you did?"],
    ['b', "No. I'd rather have left with {a} than stayed without {a.obj}."],
  ], beat: "The studio claps." },
  { when: { fate: 'together', place: 'left' }, stage: "{a} and {b} sit side by side.", turns: [
    ['dior', "{b}, {a}. You went home as a couple. Are you still one?"],
    ['b', "We are."],
    ['a', "It's been really nice, actually. We get to do normal things. Go for dinner. Meet each other's friends."],
    ['dior', "And the friends approve?"],
    ['a', "Mostly."],
  ], beat: "The studio laughs, and so does {b}." },
  { when: { fate: 'together', place: 'left' }, stage: "{a} and {b} sit together, {a}'s arm round {b}.", turns: [
    ['dior', "{a}, {b}. You were dumped on the same night, and you walked out holding hands. Still holding hands?"],
    ['b', "Still holding hands."],
    ['a', "It was horrible leaving. But the drive to the hotel, just the two of us, was the first time it felt real."],
    ['dior', "Real how?"],
    ['a', "No cameras, no recouplings. Just {b}, and it was still good."],
  ], beat: "{b} leans into {a}, and the studio goes \"aww\"." },
  { when: { fate: 'together', place: 'left' }, stage: "{a} and {b} sit together near the end of the sofa.", turns: [
    ['dior', "{b}, {a}. You left early, and you're still together. Did you watch the rest of it?"],
    ['b', "Every night, on the sofa together. Shouting at the screen."],
    ['dior', "Do you wish you'd stayed longer?"],
    say('a', "Part of me. But I think leaving when we did kept us safe from all the drama.", { quiet: "Sometimes. But we got out with what mattered." }),
  ], beat: "The studio claps." },
  // more serious
  { when: { fate: 'stronger', place: 'final' }, stage: "{a} and {b} sit together, very close.", turns: [
    ['dior', "{a}, {b}. I'm told things have moved fast since the final."],
    ['b', "We've moved in together."],
    ['dior', "Already?"],
    say('a', "I know. But we spent every day together in there. Being apart after that felt wrong.", { romantic: "I didn't want to spend another night without {b}. So I asked, and {b} said yes." }),
    ['b', "My family loves {a}. That was the last thing I was worried about."],
  ], beat: "The audience is on its feet, cheering." },
  { when: { fate: 'stronger', place: 'final' }, stage: "{a} and {b} sit on the middle sofa, {a}'s arm round {b}.", turns: [
    ['dior', "{a} and {b}. How are things?"],
    ['a', "Serious. In a good way. We've met each other's families, and we're talking about moving in."],
    ['dior', "{b}, did you see this coming in the villa?"],
    ['b', "I hoped for it. I didn't let myself believe it until we were home and it was still there."],
  ], beat: "The studio goes \"aww\"." },
  { when: { fate: 'stronger', place: 'final' }, stage: "{a} and {b} sit together, smiling at each other.", turns: [
    ['dior', "{b}, {a}, you look happy."],
    ['b', "We are. We said I love you again the day we got home. Just the two of us, no cameras."],
    ['a', "It meant more out here than it did in there, if that makes sense."],
    ['dior', "It does."],
  ], beat: "The audience claps, and {b} gives {a} a kiss." },
  { when: { fate: 'stronger', place: 'left' }, stage: "{a} and {b} sit close together.", turns: [
    ['dior', "{a}, {b}. You were dumped together, and I hear you've moved in together."],
    ['a', "We have. Leaving early was the best thing that happened to us."],
    ['b', "We had real life to get on with, and we did it together."],
    ['dior', "Do you ever wonder what would have happened if you'd stayed?"],
    ['a', "Sometimes. But I've got what I went in for."],
  ], beat: "The studio cheers." },
  // split since
  { when: { fate: 'split', why: 'faded', place: 'final' }, stage: "{a} and {b} sit on the same sofa, with a space between them.", turns: [
    ['dior', "{a}, {b}. You made the final together. Are you still together?"],
    ['b', "No."],
    ['dior', "What happened?"],
    say('a', "It faded. I ended it. When we got home, I kept waiting for the feeling to come back, and it didn't.", { soft: "I ended it. I didn't want to. I just couldn't make myself feel what I felt in there." }),
    ['b', "I could tell. I didn't want to see it, but I could tell."],
    ['dior', "Are you okay, {b}?"],
    ['b', "I will be. It still hurts, but I'd rather {a} was honest."],
  ], beat: "The studio is quiet for a moment, and then claps for both of them." },
  { when: { fate: 'split', why: 'faded', place: 'final' }, stage: "{a} and {b} sit on different sofas.", turns: [
    ['dior', "{b}, {a}. I noticed you're not sitting together."],
    ['a', "We split up about two weeks after the final."],
    ['dior', "Whose decision?"],
    ['a', "Mine. It was the hardest thing I've done in a long time. But it wasn't fair to keep going when I didn't feel it."],
    ['b', "I thought we'd get through it. I really did."],
  ], beat: "{b} looks down at {b.posAdj} hands, and the studio stays quiet." },
  { when: { fate: 'split', why: 'distance', place: 'final' }, stage: "{a} and {b} sit on the same sofa, not quite looking at each other.", turns: [
    ['dior', "{a}, {b}. Still together?"],
    ['a', "No. We tried, but we live so far apart."],
    ['b', "It was every weekend on a train, and phone calls in the week that kept getting shorter."],
    ['dior', "Who called it?"],
    ['a', "Me. I hated it. But I could see us both getting unhappy."],
    ['b', "I'd have kept going. But I understand why you didn't."],
  ], beat: "{a} reaches out, and {b} squeezes {a.posAdj} hand for a second before letting go." },
  { when: { fate: 'split', why: 'different', place: 'final' }, stage: "{a} and {b} sit on the same sofa, polite with each other.", turns: [
    ['dior', "{a}, {b}. Where are you now?"],
    ['a', "Not together. I ended it."],
    ['dior', "Why?"],
    ['a', "Once we were home, we wanted different things. {b} was ready for something serious. I wasn't."],
    ['b', "I was ready. I thought you were too. That's the part that hurts."],
  ], beat: "Nobody in the studio says anything." },
  { when: { fate: 'split', why: 'trust', place: 'final' }, stage: "{a} and {b} sit on opposite sofas.", turns: [
    ['dior', "{b}, you and {a} are not sitting together."],
    ['b', "No. Some things came out after the villa, and I couldn't get past them."],
    ['dior', "{a}, it was you who ended it?"],
    ['a', "It was. Before it got any worse. I hurt {b}, and I know that."],
    ['b', "I would have forgiven a lot. I needed the truth, and I got it from a screen instead of from you."],
  ], beat: "The studio is silent." },
  { when: { fate: 'split', why: 'faded', place: 'left' }, stage: "{a} and {b} sit apart on the same sofa.", turns: [
    ['dior', "{a}, {b}. You left the villa together. Are you still together?"],
    ['a', "No. It didn't last long outside."],
    ['dior', "What happened?"],
    ['a', "In there, we were all each other had. Out here, I realised it wasn't love. I ended it."],
    ['b', "I think I knew before we even got home. I just didn't want to be the one to say it."],
  ], beat: "The studio claps for them both." },
  { when: { fate: 'split', why: 'distance', place: 'left' }, stage: "{a} and {b} sit apart.", turns: [
    ['dior', "{b}, {a}. You went home together. What happened next?"],
    ['b', "We live on opposite ends of the country. It got harder every week."],
    ['a', "I ended it. I didn't want us to start resenting each other."],
    ['dior', "Are you still friends?"],
    ['b', "I hope so. Give it some time."],
  ], beat: "{a} nods, and the audience applauds." },
  { when: { fate: 'split', why: 'different', place: 'left' }, stage: "{a} and {b} sit on the same sofa, a careful gap between them.", turns: [
    ['dior', "{a}, {b}. Together?"],
    ['a', "No. Outside the villa, we're very different people."],
    ['b', "That's one way to put it."],
    ['dior', "{b}, what's the other way?"],
    ['b', "I wanted to try. {a} decided it wasn't worth it. I'd have liked a say."],
  ], beat: "{a} doesn't answer, and the studio goes \"ooh\"." },
  { when: { fate: 'split', why: 'trust', place: 'left' }, stage: "{a} and {b} sit on different sofas.", turns: [
    ['dior', "{a}, {b}. You left together, and now you're sitting apart."],
    ['b', "Things came out. Things I wish I'd heard from {a}."],
    ['a', "I ended it. I knew I'd let {b} down, and I didn't want to drag it out."],
    ['b', "You should have told me in there."],
  ], beat: "The studio goes very quiet." },
  // friends at the final
  { when: { fate: 'friends', place: 'final' }, stage: "{a} and {b} sit together, already laughing.", turns: [
    ['dior', "{a}, {b}. You reached the final as friends. Are you still friends?"],
    ['a', "Best friends. We talk every day."],
    ['b', "People keep asking if we're secretly together. We're not. I just really love {a}."],
    ['dior', "Any romance for either of you since?"],
    ['a', "Not yet. But I'm open to it."],
  ], beat: "The audience cheers, and {b} pulls {a} into a hug." },
  { when: { fate: 'friends', place: 'final' }, stage: "{a} and {b} sit side by side, comfortable.", turns: [
    ['dior', "{b}, {a}. Friends to the end, and after it?"],
    ['b', "Yes. We've seen each other loads since we got out."],
    ['a', "I came in looking for love, and I found my best friend instead. I'm honestly fine with that."],
  ], beat: "The studio goes \"aww\"." },
]);

// ── how the public saw them (pm/ledger.js labelFor) ────────────────────
export const RU_PUBLIC = kind('ru-public', ['label'], [
  { when: { label: 'fan-favourite' }, turns: [
    ['dior', "{a}, the public loved you. You were their favourite islander of the summer. Did you have any idea?"],
    say('a', "None. In there you have no idea how you're coming across. My family told me when I got home, and I cried.", { quiet: "No. I thought I was barely on it. I still don't really believe it." }),
    ['dior', "What do you think they saw?"],
    ['a', "Someone being honest, I hope. I didn't know how to be anything else in there."],
  ], beat: "The audience cheers, and {a} puts {a.posAdj} hands over {a.posAdj} face." },
  { when: { label: 'fan-favourite' }, turns: [
    ['dior', "{a}. The country's favourite. How has that been?"],
    ['a', "Overwhelming. People stop me in the street and talk to me like they know me."],
    ['dior', "Do you like it?"],
    ['a', "Mostly. It's nice that people saw the real me. I just wasn't ready for so many of them."],
  ], beat: "The studio claps." },
  { when: { label: 'loved' }, turns: [
    ['dior', "{a}, the public really took to you. How does that feel?"],
    ['a', "Honestly, it means a lot. I was so worried about how I'd come across."],
    ['dior', "Why were you worried?"],
    ['a', "Because in there you're tired and emotional, and you don't always like who you are on a bad day. I'm glad people were kind."],
  ], beat: "The audience cheers for {a}." },
  { when: { label: 'loved' }, turns: [
    ['dior', "{a}, you have a lot of fans out there. Did you watch it back?"],
    say('a', "Every episode. I hid behind a cushion for half of it.", { lad: "All of it, {~bro}. Some bits through my fingers." }),
    ['dior', "And?"],
    ['a', "I liked who I saw, mostly. That's not something I expected to say."],
  ], beat: "The studio laughs warmly." },
  { when: { label: 'loved' }, turns: [
    ['dior', "{a}, people at home really rooted for you. Did you feel it in there?"],
    ['a', "No. In there you only know what the villa thinks of you. I had no idea anyone outside cared."],
    ['dior', "And now you know?"],
    say('a', "It's lovely. And a bit scary. I don't want to let anyone down.", { nervy: "I keep waiting for it to go wrong. It's a lot of people to not let down." }),
  ], beat: "The audience cheers, and {a} smiles." },
  { when: { label: 'loved' }, turns: [
    ['dior', "{a}, the messages about you have been so kind. Is there one you remember?"],
    ['a', "Someone said they started being kinder to themselves after watching me. I read it about ten times."],
    ['dior', "How did that feel?"],
    ['a', "Like it was worth it. All of it, even the bad days."],
  ], beat: "The studio goes \"aww\"." },
  { when: { label: 'fan-favourite' }, turns: [
    ['dior', "{a}, you were the public's favourite. What was it like finding out?"],
    ['a', "Strange. In there I spent half the time thinking everyone was annoyed with me."],
    ['dior', "Why do you think people loved you?"],
    ['a', "Maybe because I didn't pretend. I cried when I was sad and laughed when I was happy."],
  ], beat: "The audience is on its feet for {a}." },
  { when: { label: 'divisive' }, turns: [
    ['dior', "{a}, you were the islander everyone argued about at home. Did you know?"],
    ['a', "Not until I got my phone back. Then I couldn't stop reading it."],
    ['dior', "What did you make of it?"],
    ['a', "That people saw a few minutes a day and decided who I was. Some of them were right. Some weren't."],
  ], beat: "The studio is split, half clapping, half quiet." },
  { when: { label: 'liked' }, turns: [
    ['dior', "{a}, how have people been with you since you got out?"],
    ['a', "Really kind. A few people have said they'd have done the same as me in there."],
    ['dior', "Is there anything you wish they'd seen more of?"],
    ['a', "The quiet bits. The late-night talks. That's where the real friendships were."],
  ], beat: "The studio claps." },
  { when: { label: 'liked' }, turns: [
    ['dior', "{a}, the public were on your side this summer. Did you feel that?"],
    ['a', "Not in there. You can't tell anything in there. But the messages since have been lovely."],
    ['dior', "Any that stuck with you?"],
    ['a', "Someone wrote that I reminded them of their sister. That one got me."],
  ], beat: "The studio goes \"aww\"." },
  { when: { label: 'invisible' }, turns: [
    ['dior', "{a}, some people at home said they didn't get to see enough of you. How do you feel about that?"],
    ['a', "It's fair. I kept a lot to myself in there."],
    ['dior', "Why?"],
    ['a', "I was scared of getting it wrong in front of everyone. I wish I'd let people see more of me."],
  ], beat: "The audience claps, encouraging." },
  { when: { label: 'invisible' }, turns: [
    ['dior', "{a}, you were in the villa a long time, and some people say they still don't know you. Who are you?"],
    ['a', "Someone who takes a while to open up. In there, I never quite got the time."],
    ['dior', "Do you wish you'd been louder?"],
    ['a', "Braver. Not louder. There's a difference."],
  ], beat: "The studio claps." },
  { when: { label: 'divisive' }, turns: [
    ['dior', "{a}, you split the country. Half of them loved you, and half of them really didn't. How has that been?"],
    ['a', "Hard. I read all of it at first. I've stopped now."],
    ['dior', "Do you understand why?"],
    ['a', "Some of it. I said things in there I'd say differently now. But I was always myself."],
  ], beat: "Part of the audience claps. Part of it doesn't." },
  { when: { label: 'divisive' }, turns: [
    ['dior', "{a}. People had a lot to say about you."],
    ['a', "I know. My phone hasn't stopped."],
    ['dior', "Anything you'd like to say to them?"],
    ['a', "Just that I'm a real person, and I made mistakes in a very strange place. I'm learning from them."],
  ], beat: "The studio claps, a little uncertain." },
  { when: { label: 'disliked' }, turns: [
    ['dior', "{a}, I'm going to be honest with you. The public were hard on you this summer."],
    ['a', "I know. I've seen it."],
    ['dior', "How are you doing?"],
    say('a', "Some days are okay. Some days are not. Watching it back, I can see why people reacted the way they did.", { sharp: "I'm fine. I know I wasn't easy to watch. I also know they only saw a few minutes of my day." }),
    ['dior', "Is there anything you'd take back?"],
    ['a', "Quite a lot. Mostly how I spoke to people when I was upset."],
  ], beat: "The studio is quiet, and then claps." },
  { when: { label: 'disliked' }, turns: [
    ['dior', "{a}, it's been a difficult few weeks for you since you got out."],
    ['a', "It has. I knew it wouldn't all be nice, but I wasn't ready for how much of it there'd be."],
    ['dior', "What would you like people to know?"],
    ['a', "That I'm sorry to the people in that villa I hurt. And that I'm more than the worst week of my life."],
  ], beat: "A few people in the audience clap." },
  { when: { label: 'villain' }, turns: [
    ['dior', "{a}, there's no easy way to say this. You were the villain of the summer."],
    ['a', "I know. Believe me, I know."],
    ['dior', "Is it fair?"],
    say('a', "Some of it. I made choices in there that hurt people, and I can't pretend I didn't.", { sharp: "Some of it. I played it the way I played it. I'm not going to cry about it now." }),
    ['dior', "Have you said sorry to anyone?"],
    ['a', "To a few people, privately. Some of them have accepted it. Some haven't, and that's their right."],
  ], beat: "The studio is very quiet." },
  { when: { label: 'villain' }, turns: [
    ['dior', "{a}. The public made their minds up about you very early."],
    ['a', "They did. And I gave them plenty of reasons to."],
    ['dior', "Do you regret how you played it?"],
    ['a', "I regret how it made people feel. I don't think I'm a bad person. I think I was a bad version of myself for six weeks."],
  ], beat: "Somebody on the sofas nods slowly." },
  // (Two a label were not enough: five on the sofa can share one, seed 4, 2026-11-03 — four of them fan favourites.)
  { when: { label: 'fan-favourite' }, turns: [
    ['dior', "{a}, the public voted for you again and again this summer. What do you say to them?"],
    ['a', "Thank you. Honestly, thank you. I didn't feel like I was doing anything special. I was just in there being me."],
    ['dior', "Was that hard?"],
    ['a', "Some days. It's hard to be yourself when you're tired and everyone's watching. I'm glad it came across."],
  ], beat: "The audience claps for a long time." },
  { when: { label: 'fan-favourite' }, turns: [
    ['dior', "{a}, you've got a lot of fans in this studio tonight."],
    ['a', "I can hear them. It's mad. A few weeks ago I was in a villa with no idea anyone was watching."],
    ['dior', "What's been the strangest part?"],
    ['a', "People knowing things about me that I'd forgotten I'd said. Little things, from the kitchen at two in the morning."],
  ], beat: "The fans in the front row cheer, and {a} waves at them." },
  { when: { label: 'liked' }, turns: [
    ['dior', "{a}, people warmed to you as the summer went on. Did you notice it change?"],
    ['a', "Not in there. Out here, yes. People come up to me and say they'd want me as a friend."],
    ['dior', "That's a nice thing to hear."],
    ['a', "It's the best thing anyone could say. That's all I was trying to be in there."],
  ], beat: "The audience claps warmly." },
  { when: { label: 'liked' }, turns: [
    ['dior', "{a}, you seem to have come out of this with your head held high."],
    ['a', "I hope so. I tried to be kind, even on the days I didn't feel it."],
    ['dior', "Were there a lot of those days?"],
    ['a', "More than it looked. But that's what the beach hut was for."],
  ], beat: "The studio laughs, and claps." },
  { when: { label: 'invisible' }, turns: [
    ['dior', "{a}, I want to give you the floor tonight, because I don't think we saw enough of you."],
    ['a', "Thank you. I think that's fair, honestly."],
    ['dior', "What did we miss?"],
    ['a', "A lot of good conversations that happened at three in the morning. I was there. You just weren't."],
  ], beat: "The audience laughs, and {a} looks pleased." },
  { when: { label: 'invisible' }, turns: [
    ['dior', "{a}, did you ever feel like you were in the background in there?"],
    ['a', "Sometimes. Everyone else's stories were so big."],
    ['dior', "And yours?"],
    ['a', "Mine was quieter. I made good friends, and I left as myself. I'm happy with that."],
  ], beat: "The studio claps." },
  { when: { label: 'disliked' }, turns: [
    ['dior', "{a}, the public weren't always on your side. Have you watched it back?"],
    ['a', "Once. I won't do it again."],
    ['dior', "Was it hard?"],
    ['a', "Very. I didn't recognise myself in some of it. That's on me, not the edit."],
  ], beat: "The studio is quiet for a moment, then claps." },
  { when: { label: 'disliked' }, turns: [
    ['dior', "{a}, a lot of people had a lot to say about you this summer."],
    ['a', "They did. Some of it I deserved."],
    ['dior', "And some of it you didn't?"],
    ['a', "Some of it was about things nobody saw the whole of. But I'm not here to argue with anyone tonight."],
  ], beat: "A few people clap." },
  { when: { label: 'villain' }, turns: [
    ['dior', "{a}, you know what people are calling you."],
    ['a', "I know. I've heard every version of it."],
    ['dior', "Does it bother you?"],
    say('a', "More than I thought it would. I'm not that person at home.", { sharp: "Less than people think. I knew what I was doing in there. I'll own it." }),
  ], beat: "The studio goes \"ooh\"." },
  { when: { label: 'villain' }, turns: [
    ['dior', "{a}, if you went back in tomorrow, would you do it the same way?"],
    ['a', "No. I'd still play the game, but I'd be kinder about it."],
    ['dior', "Kinder how?"],
    ['a', "I'd be honest with people's faces, not behind their backs. That's the bit I'd change."],
  ], beat: "Somebody in the audience shouts 'too late', and {a} laughs." },
]);

// ── the steals ─────────────────────────────────────────────────────────
export const RU_STEAL = kind('ru-steal', ['now', 'lasted'], [
  { when: { now: 'hurt', lasted: true }, stage: "{a} sits on one sofa. {b} and {c} sit together on another.", turns: [
    ['dior', "{a}, at that recoupling, {b} stood up and picked {c}. You lost your partner in front of everyone. How do you feel about it now?"],
    say('a', "It still hurts, if I'm honest. I didn't see it coming at all.", { soft: "It still hurts. I really thought {c} and I were going somewhere." }),
    ['dior', "{b}, do you have anything to say to {a}?"],
    ['b', "I'm sorry for how it happened. I'm not sorry I did it. I'd do it again."],
    ['c', "I'm sorry too, {a}. You didn't deserve to find out like that."],
    ['a', "Thank you. I'm glad you two are happy. I am. It just still stings."],
  ], beat: "{b} nods, and the studio claps for {a}." },
  { when: { now: 'hurt', lasted: false }, stage: "{a}, {b} and {c} are spread across three different sofas.", turns: [
    ['dior', "{a}, {b} took {c} from you at a recoupling. And it didn't last. How does that feel?"],
    ['a', "Honestly? It makes it worse. I lost {c} for something that didn't even last."],
    ['b', "I thought it would. I really did."],
    ['dior', "{c}, do you wish you'd stayed with {a}?"],
    ['c', "Sometimes. I think about it."],
    ['a', "Don't say that. Not now."],
  ], beat: "The studio goes \"ooh\", and {a} looks away." },
  { when: { now: 'over', lasted: true }, stage: "{b} and {c} sit together. {a} is on the next sofa, relaxed.", turns: [
    ['dior', "{a}, you lost {c} to {b} at a recoupling. Are you still angry about it?"],
    ['a', "No. I was at the time. But look at them. It was the right call for {c}."],
    ['dior', "{b}?"],
    ['b', "That means a lot, {a}. I was worried you'd never speak to me again."],
    ['c', "I'm really glad we're all okay."],
  ], beat: "{a} leans over and shakes {b}'s hand, and the audience cheers." },
  { when: { now: 'over', lasted: false }, stage: "{a}, {b} and {c} sit near each other on the same side of the stage.", turns: [
    ['dior', "{a}, {b} picked {c} out from under you at a recoupling. Where are you three now?"],
    ['a', "Fine, honestly. It was the villa. People change their minds every day in there."],
    ['b', "It didn't work out with {c} in the end, and that's on me."],
    ['c', "It's on both of us. And {a} was really kind to me after. I didn't expect that."],
  ], beat: "The studio claps." },
  { when: { now: 'cold', lasted: true }, stage: "{a} sits as far from {b} and {c} as possible.", turns: [
    ['dior', "{a}, {b} stood up at the fire pit and took {c} from you. Have you spoken since?"],
    ['a', "No. And I don't want to."],
    ['b', "I've tried to reach out."],
    ['a', "You can stop trying. You knew what {c} meant to me, and you did it anyway."],
    ['dior', "{c}?"],
    ['c', "I hate that it ended like this. I never wanted to hurt anyone."],
  ], beat: "The studio is silent." },
  { when: { now: 'cold', lasted: false }, stage: "{a}, {b} and {c} sit on three different sofas.", turns: [
    ['dior', "{a}, at the recoupling {b} took {c} from you. It didn't last. Do you feel vindicated?"],
    ['a', "No. I feel like I lost something for nothing."],
    ['b', "I didn't do it to hurt you."],
    ['a', "But you did hurt me. You knew you would, and you stood up anyway."],
    ['c', "I'm sorry, {a}. I should have stood up for us."],
  ], beat: "{a} doesn't answer. The studio stays quiet." },
  { when: { now: 'hurt', lasted: true }, stage: "{b} and {c} sit together. {a} is a few seats away.", turns: [
    ['dior', "{a}, do you remember what went through your head when {b} said {c}'s name at that fire pit?"],
    ['a', "That I was going home. And that {c} didn't look surprised."],
    ['c', "I wasn't surprised. {b} had told me earlier that day. I should have warned you."],
    ['b', "That's on me, not {c}. I asked {c} not to say anything."],
    ['a', "I'm happy for you both. I just wish I'd heard it from one of you first."],
  ], beat: "The studio claps for {a}." },
  { when: { now: 'hurt', lasted: false }, stage: "{a}, {b} and {c} sit on the same sofa, with gaps between them.", turns: [
    ['dior', "{c}, {b} took you from {a}, and you two ended up apart anyway. Do you think about how it might have gone with {a}?"],
    ['c', "Yes. More than I'd like."],
    ['a', "Please don't."],
    ['b', "I'm sorry, {a}. It wasn't worth what it did to you."],
  ], beat: "{a} looks at the ceiling and doesn't say anything." },
  { when: { now: 'over', lasted: true }, stage: "{b} and {c} sit together, and {a} is next to them.", turns: [
    ['dior', "{a}, you're sitting right next to the couple who split you up."],
    ['a', "I know. A few weeks ago I wouldn't have."],
    ['dior', "What changed?"],
    ['a', "I watched it back and saw how happy {c} was. I couldn't stay angry at that."],
    ['b', "That's more than fair of you, {a}."],
  ], beat: "{c} reaches over and squeezes {a}'s hand." },
  { when: { now: 'over', lasted: false }, stage: "{a}, {b} and {c} sit together, relaxed.", turns: [
    ['dior', "{a}, {b} picked {c} out from under you, and it didn't work out. Any part of you that's glad?"],
    ['a', "No. I'm not like that. I just hope everyone's okay."],
    ['c', "We are. Honestly, we're all fine."],
    ['b', "We had a drink together last week, the three of us. It was nice."],
  ], beat: "The studio laughs, surprised, and claps." },
  { when: { now: 'cold', lasted: true }, stage: "{b} and {c} sit together. {a} is on the far sofa.", turns: [
    ['dior', "{a}, are you happy for {b} and {c}?"],
    ['a', "I'm trying to be. I'm not there yet."],
    ['b', "I get that. I'd feel the same."],
    ['a', "Then you'll understand why I don't want to talk to you."],
  ], beat: "The studio goes \"ooh\"." },
  { when: { now: 'cold', lasted: false }, stage: "{a}, {b} and {c} sit on three different sofas.", turns: [
    ['dior', "{a}, {b} took {c} from you, and then they split up. What do you say to {b} now?"],
    ['a', "Nothing. There's nothing to say."],
    ['b', "I'd like to say sorry, if you'll let me."],
    ['a', "Not tonight. Maybe not ever."],
  ], beat: "The studio is silent." },
]);

// ── Casa Amor ──────────────────────────────────────────────────────────
export const RU_CASA = kind('ru-casa', ['now', 'lasted'], [
  { when: { now: 'hurt', lasted: true }, stage: "{b} sits on one sofa. {a} and {c} sit together across from {b.obj}.", turns: [
    ['dior', "{b}, you stayed loyal at Casa Amor, and {a} came back with {c}. How do you feel about that now?"],
    say('b', "I still think about walking into that fire pit. I was so happy to see {a}, and then {c} walked in behind {a.obj}.", { soft: "It was the worst night of my summer. I'd been so sure of us." }),
    ['dior', "{a}?"],
    ['a', "I'm sorry I hurt you. I didn't plan it. I met {c}, and I couldn't ignore it."],
    ['c', "We're still together. I know that doesn't make it easier for you, {b}."],
    ['b', "No, it doesn't. But I'm glad it meant something, at least."],
  ], beat: "The studio claps for {b}." },
  { when: { now: 'hurt', lasted: false }, stage: "{a}, {b} and {c} are on three different sofas.", turns: [
    ['dior', "{b}, you waited for {a} at Casa Amor, and {a} came back with {c}. And {a} and {c} didn't last."],
    ['b', "I know. It almost makes it worse."],
    ['dior', "{a}, do you regret it?"],
    ['a', "Yes. I lost something real for something that didn't last a week."],
    ['c', "I didn't know how much {a} meant to you, {b}. I'm sorry."],
  ], beat: "{b} nods, and wipes {b.posAdj} eyes." },
  { when: { now: 'over', lasted: true }, stage: "{a} and {c} sit together. {b} is next to them, relaxed.", turns: [
    ['dior', "{b}, at Casa Amor you stayed loyal, and {a} didn't. Are you over it?"],
    ['b', "I am. I've had time. And look at them. It clearly wasn't just a week at Casa."],
    ['a', "That's really kind, {b}. I never wanted to hurt you."],
    ['c', "We owe you a drink, at least."],
    ['b', "You owe me a lot of drinks."],
  ], beat: "The three of them laugh, and the studio does too." },
  { when: { now: 'over', lasted: false }, stage: "{a}, {b} and {c} are spread along one sofa.", turns: [
    ['dior', "{b}, Casa Amor. {a} came back with {c}, and it didn't last. How are you now?"],
    ['b', "Honestly, I'm fine. I moved on. It was a hard night, but it was the villa."],
    ['a', "I made the wrong choice, and I know it. I'm glad {b} doesn't hate me."],
  ], beat: "{b} gives {a} a small smile." },
  { when: { now: 'cold', lasted: true }, stage: "{b} sits as far from {a} and {c} as possible.", turns: [
    ['dior', "{b}, {a} came back from Casa Amor with {c}. Have you two spoken since?"],
    ['b', "No. I said everything I needed to say at the fire pit."],
    ['a', "I've tried to apologise."],
    ['b', "I don't need an apology. You made your choice."],
    ['c', "I just want to say I'm sorry for how you found out."],
  ], beat: "{b} doesn't look at either of them." },
  { when: { now: 'cold', lasted: false }, stage: "{a}, {b} and {c} are on three different sofas.", turns: [
    ['dior', "{b}, you stayed loyal at Casa Amor. {a} didn't, and it didn't even last."],
    ['b', "I gave everything to {a} in that villa. And {a} threw it away for a week of attention."],
    ['a', "That's not fair."],
    ['b', "None of it was fair. That's my point."],
  ], beat: "The studio goes \"ooh\", and nobody on the sofas says anything." },
  { when: { now: 'hurt', lasted: true }, stage: "{a} and {c} sit together. {b} is on the next sofa, very still.", turns: [
    ['dior', "{b}, you waited for {a} through all of Casa Amor. What was it like watching them together afterwards?"],
    ['b', "Hard. Every day. I had to see them at breakfast, by the pool, at every fire pit."],
    ['a', "I know. I tried to give you space."],
    ['b', "There's no space in that villa. That's the thing."],
    ['c', "I'm sorry it was like that for you."],
  ], beat: "{b} nods, and looks away." },
  { when: { now: 'hurt', lasted: false }, stage: "{a}, {b} and {c} are on the same side of the stage, not looking at each other.", turns: [
    ['dior', "{b}, {a} came back from Casa with {c}, and now it's over between them. Has {a} been in touch?"],
    ['b', "Once. A long message. I haven't answered it yet."],
    ['a', "I didn't expect you to. I just wanted you to know I'm sorry."],
    ['b', "I read it about ten times. I'm still sad, that's all."],
  ], beat: "{c} looks down at {c.posAdj} hands." },
  { when: { now: 'over', lasted: true }, stage: "{a} and {c} sit together, and {b} sits with them.", turns: [
    ['dior', "{b}, you're sitting with {a} and {c}. After Casa Amor, I didn't expect that."],
    ['b', "Neither did I. But it's been weeks. I'm happy, they're happy. Holding on to it would only hurt me."],
    ['c', "That means a lot, {b}. Honestly."],
    ['a', "You were better to me than I deserved, back then."],
  ], beat: "The audience claps for {b}." },
  { when: { now: 'over', lasted: false }, stage: "{a} and {b} sit together. {c} is a little further along.", turns: [
    ['dior', "{b}, after Casa Amor I thought you two would never speak again. And here you are."],
    ['b', "We talked it out after the final. {a} said sorry, and meant it."],
    ['a', "I made a mistake at Casa. I'll always be sorry for how I came back."],
    ['c', "For what it's worth, I'm sorry too."],
  ], beat: "{b} smiles, and the studio claps." },
  { when: { now: 'cold', lasted: true }, stage: "{b} sits apart from {a} and {c}, arms folded.", turns: [
    ['dior', "{b}, it's been weeks since Casa Amor. Has anything changed?"],
    ['b', "No. I still see that night every time I close my eyes."],
    ['dior', "{a}, is there anything you want to say?"],
    ['a', "Just that I'm sorry. I don't expect you to forgive me."],
    ['b', "Good. Because I don't."],
  ], beat: "{c} squeezes {a}'s hand, and the studio goes very quiet." },
  { when: { now: 'cold', lasted: false }, stage: "{a}, {b} and {c} sit as far apart as they can.", turns: [
    ['dior', "{b}, {a} brought {c} back from Casa Amor. It's over now. Do you want an apology?"],
    ['b', "I've had one. It didn't help."],
    ['a', "I don't know what else to say."],
    ['b', "Then don't say anything. That's fine with me."],
  ], beat: "The studio stays silent." },
]);

// ── the villa's exes ───────────────────────────────────────────────────
export const RU_EXES = kind('ru-exes', ['now', 'cause'], [
  { when: { now: 'friends' }, stage: "{a} and {b} sit on the same sofa, chatting before Dior turns to them.", turns: [
    ['dior', "{a}, {b}. You broke up in the villa, and you're sitting together tonight. Are you friends?"],
    ['b', "We are. It took a while, but we are."],
    ['a', "We ended it before it turned into something we'd both regret. I'm glad we did."],
    ['dior', "{b}, was it hard, living together after?"],
    ['b', "At first. Then it just got easier every day."],
  ], beat: "The two of them share a smile, and the studio claps." },
  { when: { now: 'friends' }, stage: "{a} and {b} sit near each other, comfortable.", turns: [
    ['dior', "{b} and {a}. Exes, and now?"],
    ['a', "Friends. Honestly, good friends."],
    ['b', "I think we were better at being friends all along. We just needed a break-up to work it out."],
  ], beat: "The audience laughs warmly." },
  { when: { now: 'awkward' }, stage: "{a} and {b} sit on different sofas and haven't looked at each other once.", turns: [
    ['dior', "{a}, {b}. You split up in the villa. How are things now?"],
    ['a', "Fine. We don't really talk."],
    ['dior', "{b}?"],
    ['b', "It's not bad. It's just awkward. I don't know what to say to {a} any more."],
    ['a', "Same. I wish it wasn't like this."],
  ], beat: "There is a long, uncomfortable pause." },
  { when: { now: 'awkward' }, stage: "{a} and {b} end up next to each other on the sofa, and both notice.", turns: [
    ['dior', "Well, this is a seating plan. {a}, {b}, how are things between you?"],
    ['b', "Polite."],
    ['a', "We said hello backstage. That was about it."],
    ['dior', "Do you want to be friends?"],
    ['a', "Maybe one day. Not yet."],
  ], beat: "{b} nods, and they both look at Dior instead of each other." },
  { when: { now: 'hurt' }, stage: "{a} and {b} sit on different sofas.", turns: [
    ['dior', "{b}, {a} ended things with you in the villa. Where are you with it now?"],
    say('b', "Still hurting, if I'm honest. You don't just turn it off.", { soft: "Still sad. I watched it all back, and it hurt all over again." }),
    ['dior', "{a}, did you know?"],
    ['a', "I thought it might still be hard. I'm sorry, {b}. I never wanted to hurt you."],
    ['b', "I know you didn't. It still did."],
  ], beat: "The studio claps gently for {b}." },
  { when: { now: 'hurt' }, stage: "{a} and {b} sit on the same sofa, with someone between them.", turns: [
    ['dior', "{a}, {b}. You broke up in the villa. How are you both?"],
    ['a', "I'm good. I think it was the right call."],
    ['b', "I'm getting there. Watching it back was hard. Seeing myself so happy, and knowing what was coming."],
    ['a', "I didn't know you felt like that."],
    ['b', "You never asked."],
  ], beat: "{a} goes quiet, and the studio does too." },
  { when: { now: 'still' }, stage: "{a} and {b} sit on opposite sofas, and the air between them is cold.", turns: [
    ['dior', "{a}, {b}. You split in the villa. Have things calmed down?"],
    ['b', "No."],
    ['dior', "{b}, what's still bothering you?"],
    ['b', "How {a} did it. I was the last to know, and everyone else knew first."],
    ['a', "I've said I'm sorry."],
    ['b', "Saying it isn't the same as meaning it."],
  ], beat: "The studio goes \"ooh\"." },
  { when: { now: 'still' }, stage: "{a} and {b} sit as far apart as the stage allows.", turns: [
    ['dior', "{b}, {a}. Do you two speak?"],
    ['a', "No."],
    ['b', "There's nothing to say. {a} made {a.posAdj} choice."],
    ['dior', "{a}, would you like to be friends?"],
    ['a', "I'd like us to be civil. I don't think we're ready for anything more."],
  ], beat: "{b} folds {b.posAdj} arms and doesn't answer." },
]);

// ── the feuds ──────────────────────────────────────────────────────────
const DID = ['steal', 'vote', 'told', 'said', 'sided', 'rival'];
const TRAIT = ['fake', 'loud', 'moody', 'cocky', 'clash'];
export const RU_FEUD = kind('ru-feud', ['now', 'grudge'], [
  { when: { now: 'made-up', grudge: DID }, stage: "{a} and {b} sit on the same sofa, which gets a laugh from the audience.", turns: [
    ['dior', "{a}, {b}. In the villa, you two could not be in the same room. Now you're on the same sofa."],
    ['a', "We met up after the final. Just the two of us. We talked for hours."],
    ['b', "I did something in there that hurt {a}, and I owned it. That's where it started."],
    ['dior', "So you're friends now?"],
    ['a', "Friends might be a stretch. But I like {b} now. I didn't think I'd ever say that."],
  ], beat: "{b} laughs, and the audience cheers." },
  { when: { now: 'made-up', grudge: DID }, stage: "{a} and {b} sit near each other, and they both look relaxed.", turns: [
    ['dior', "{b} and {a}. The two people I was most worried about having in the same studio. How are you?"],
    ['b', "Good. We sorted it out."],
    ['a', "Out of the villa, it all looked so small. I couldn't remember why I'd been so angry."],
    ['b', "I could. I'd earned some of it. I said sorry, and {a} let me."],
  ], beat: "The studio claps." },
  { when: { now: 'made-up', grudge: TRAIT }, stage: "{a} and {b} sit on the same sofa, and the audience laughs.", turns: [
    ['dior', "{a}, {b}. You two did not get on in the villa."],
    ['a', "That's being kind."],
    ['dior', "And now?"],
    ['a', "Now I get it. In there, everything {b} did annoyed me. Out here, I actually like {b}."],
    ['b', "We were both tired, and nobody can hide in that villa. It brings out the worst in you."],
  ], beat: "The two of them laugh, and the studio cheers." },
  { when: { now: 'made-up', grudge: TRAIT }, stage: "{a} and {b} sit side by side, comfortable.", turns: [
    ['dior', "{b}, {a}. Enemies in the villa, and now?"],
    ['b', "Now we're fine. Better than fine."],
    ['a', "I judged {b} too fast. I'll admit that on stage."],
    ['b', "And I wasn't exactly easy to live with."],
  ], beat: "The audience goes \"aww\"." },
  { when: { now: 'still', grudge: DID }, stage: "{a} and {b} are on opposite sofas.", turns: [
    ['dior', "{a}, {b}. Have you two made peace?"],
    ['a', "No."],
    ['dior', "Why not?"],
    ['a', "Because {b} has never said sorry. Not once."],
    ['b', "Because I'm not sorry. I did what I thought was right."],
    ['dior', "Can you see each other's side at all?"],
    ['b', "I can see why {a} is upset. I just don't think I was wrong."],
  ], beat: "{a} shakes {a.posAdj} head, and the studio goes \"ooh\"." },
  { when: { now: 'still', grudge: DID }, stage: "{a} and {b} sit a long way apart.", turns: [
    ['dior', "{b}, {a}. Still not speaking?"],
    ['b', "We say hello. That's about it."],
    ['a', "I don't trust {b}. I won't pretend I do for the cameras."],
    ['b', "That's fine. I don't need you to."],
  ], beat: "The studio is quiet." },
  { when: { now: 'still', grudge: TRAIT }, stage: "{a} and {b} sit on opposite sofas.", turns: [
    ['dior', "{a}, {b}. You never got on. Has that changed?"],
    ['a', "No. I don't think we're ever going to be friends, and that's okay."],
    ['b', "We're just very different people. In there, there was nowhere to get away from it."],
    ['dior', "So you'll just avoid each other?"],
    ['a', "Politely."],
  ], beat: "The audience laughs, and so does {b}, a little." },
  { when: { now: 'still', grudge: TRAIT }, stage: "{a} and {b} sit apart, both very still.", turns: [
    ['dior', "{b}, {a}. Has time helped?"],
    ['b', "Not really. Watching it back made it worse."],
    ['a', "I watched it back too. I still think I was right."],
    ['b', "Of course you do."],
  ], beat: "The studio goes \"ooh\"." },
  { when: { now: 'worse', grudge: DID }, stage: "{a} and {b} sit as far apart as the stage allows.", turns: [
    ['dior', "{a}, {b}. It's got worse since the villa, hasn't it?"],
    ['a', "Yes. {b} has been talking about me since we got out. People keep sending it to me."],
    ['b', "I've told the truth. That's all."],
    ['a', "Your version of it."],
    ['dior', "Is there anything that would fix this?"],
    ['a', "An apology. A real one."],
    ['b', "Then we're going to be waiting a long time."],
  ], beat: "The studio gasps." },
  { when: { now: 'worse', grudge: TRAIT }, stage: "{a} and {b} sit on opposite sofas and won't look at each other.", turns: [
    ['dior', "{b}, {a}. Things haven't improved?"],
    ['b', "They've got worse. I watched the show back, and I saw what {a} said about me when I wasn't there."],
    ['a', "I said it to your face as well."],
    ['b', "Not all of it."],
  ], beat: "The studio goes very quiet." },
  // (One a grudge was the only one written: two bad feuds in one night shared it, seed 3, 2026-11-03.)
  { when: { now: 'worse', grudge: DID }, stage: "{b} sits down, sees who {b.he} is next to, and moves along the sofa.", turns: [
    ['dior', "{b}, you've moved. Is that about {a}?"],
    ['b', "It is. I thought we'd be fine by now. We're not."],
    ['a', "We were nearly fine. Then the episodes came out, and everyone saw what {b} did."],
    ['b', "Everyone saw it because it happened. I've never said it didn't."],
    ['dior', "Have you spoken since the final?"],
    ['a', "Once. It didn't go well."],
  ], beat: "{a} looks straight ahead for the rest of the segment." },
  { when: { now: 'worse', grudge: TRAIT }, stage: "{a} and {b} are at opposite ends of the stage, and the audience has noticed.", turns: [
    ['dior', "{a}, {b}. The two of you didn't get on in there. Has anything changed?"],
    ['a', "It's worse, honestly. In the villa I could walk away. Out here people keep asking me about {b}."],
    ['b', "Then stop answering."],
    ['a', "That's exactly what I mean."],
    ['dior', "Is there any chance you'll be friends one day?"],
    ['b', "I'd rather be honest with you than say yes to make tonight easier. No."],
  ], beat: "The studio goes \"ooh\", and neither of them looks over." },
]);

// ── after a clip: the partner has their say ────────────────────────────
export const RU_CLIP = kind('ru-clip', ['what', 'fate', 'of'], [
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: 'together' }, turns: [
    ['dior', "{b}, you're sitting right next to {a}. Did you know about this?"],
    ['b', "No. I'm finding out with everyone else."],
    ['a', "It was a chat. That's all it was. I came back to you, didn't I?"],
    ['b', "You did. We'll talk about it at home."],
  ], beat: "{a} reaches for {b}'s hand, and {b} lets {a.obj} take it, slowly." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: 'together' }, turns: [
    ['dior', "{b}, how does that feel to watch?"],
    ['b', "Not great. But I'd rather know."],
    ['dior', "{c}, anything to add?"],
    ['c', "Only that nothing happened. I promise."],
    ['a', "Nothing happened. I'm with {b}."],
  ], beat: "{b} nods, slowly. The studio isn't convinced." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}, you were with {a} when that happened. How does it feel to see it?"],
    ['b', "Honestly? It explains a lot."],
    ['a', "I'm sorry you had to find out like this."],
    ['b', "I'm sorry I didn't find out sooner."],
  ], beat: "{c} looks down, and the studio goes \"ooh\"." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}?"],
    ['b', "I knew something was going on. Everyone told me I was being paranoid."],
    ['dior', "{c}, did you know {a} was with {b} at the time?"],
    ['c', "I did. I should have stayed out of it."],
  ], beat: "The studio gasps." },
  { when: { what: ['kiss', 'bed'], fate: 'together' }, turns: [
    ['dior', "{b}. Did you know?"],
    ['b', "No. I didn't."],
    ['a', "I was going to tell you. I didn't know how."],
    ['b', "We're going to need more than one evening to talk about this."],
  ], beat: "The studio goes completely silent, and {c} looks at the floor." },
  { when: { what: ['kiss', 'bed'], fate: 'together' }, turns: [
    ['dior', "{b}, you're still with {a}. Is that going to change after tonight?"],
    ['b', "I don't know. Ask me when I've had a minute to breathe."],
    ['c', "I'm sorry, {b}. It shouldn't have happened."],
    ['a', "It's on me, not {c}."],
  ], beat: "{b} takes a long breath and doesn't answer." },
  { when: { what: ['kiss', 'bed'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}, you were with {a} when that happened."],
    ['b', "I was. And now I know why it felt so off at the end."],
    ['a', "I'm sorry. I really am."],
    ['b', "I believe you. It doesn't change anything."],
    ['dior', "{c}?"],
    ['c', "I knew it was wrong. I'm sorry, {b}."],
  ], beat: "The studio is silent." },
  { when: { what: ['kiss', 'bed'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}, how do you feel, seeing that?"],
    ['b', "Sick. I defended {a} to everyone in that villa."],
    ['a', "I know you did. I didn't deserve it."],
  ], beat: "{c} doesn't say anything, and nobody asks {c.obj} to." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}, you're watching this for the first time. What's going through your head?"],
    ['b', "That I asked {a} straight out if anything was going on, and {a} said no."],
    ['a', "It was just a chat. I didn't think it was a big deal."],
    ['b', "Then why didn't you tell me about it?"],
  ], beat: "{a} doesn't have an answer, and the studio goes \"ooh\"." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}, did you know {a} and {c} had that conversation?"],
    ['b', "No. I'd heard bits from other people. I never saw it."],
    ['c', "For what it's worth, I'm sorry. I knew you two were together."],
    ['b', "Thank you for saying that. It's more than I got from {a}."],
  ], beat: "{a} looks at the floor." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}. How does that make you feel?"],
    say('b', "Embarrassed, mostly. I was so sure of us at the time.", { soft: "Sad. I really believed in us back then." }),
    ['a', "I was sure of us too. I just wasn't honest with myself."],
  ], beat: "The studio is quiet." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: 'together' }, turns: [
    ['dior', "{b}, you're still with {a}. Does that clip change anything?"],
    ['b', "I knew about the chat. I didn't know it looked like that."],
    ['a', "I told you the truth. I promise you nothing happened."],
    ['b', "I believe you. I'm just going to need a minute."],
  ], beat: "{a} squeezes {b}'s hand, and {b} doesn't pull away." },
  { when: { what: ['pull', 'said', 'promise', 'head-turned'], fate: 'together' }, turns: [
    ['dior', "{b}. Anything you want to ask {a}?"],
    ['b', "Just one thing. Would you have told me if this hadn't been shown?"],
    ['a', "Yes. I would have. I'm sorry it came out like this."],
  ], beat: "{b} nods, and the audience claps, unsure." },
  { when: { what: ['kiss', 'bed'], fate: ['split', 'over'] }, turns: [
    ['dior', "{b}, I'm sorry you had to see that like this."],
    ['b', "Don't be. I'd rather know. It makes the end make sense."],
    ['dior', "{a}?"],
    ['a', "There's nothing I can say that makes it better. I'm sorry."],
  ], beat: "{c} keeps very still, and the studio is silent." },
  { when: { what: ['kiss', 'bed'], fate: 'together' }, turns: [
    ['dior', "{b}, you and {a} are still together. Can you get past this?"],
    ['b', "I don't know yet. I really don't."],
    ['a', "I'll do whatever it takes. I mean that."],
  ], beat: "{b} doesn't look at {a}, and the studio stays quiet." },
]);

// ── the friendships ────────────────────────────────────────────────────
export const RU_FRIENDS = kind('ru-friends', ['now'], [
  { when: { now: 'closer' }, stage: "{a} and {b} sit together, already giggling about something.", turns: [
    ['dior', "{a}, {b}. You two were inseparable in the villa. Still?"],
    ['a', "Even more now. We talk every single day."],
    say('b', "{a} was the first person I called when I got home. Before anyone.", { bestie: "Babe, you were my first call home. Before my family, even." }),
    ['dior', "What made it work?"],
    ['a', "We were honest with each other, even when it wasn't what we wanted to hear."],
  ], beat: "The audience goes \"aww\", and {b} puts an arm round {a}." },
  { when: { now: 'closer' }, stage: "{a} and {b} sit side by side, comfortable.", turns: [
    ['dior', "{b} and {a}. Best friends from the villa. How has it been since?"],
    ['b', "We've been on holiday together already. Just the two of us."],
    ['a', "I didn't go in looking for a best friend. I'm so glad I found one."],
  ], beat: "The studio claps." },
  { when: { now: 'same' }, stage: "{a} and {b} sit near each other and wave across.", turns: [
    ['dior', "{a}, {b}. Still friends?"],
    ['a', "Always. We don't see each other as much as we'd like, but when we do, it's like no time has passed."],
    ['b', "Everyone has their own lives again. But I know {a} is there if I need {a.obj}."],
  ], beat: "The studio goes \"aww\"." },
  { when: { now: 'same' }, stage: "{a} and {b} sit together.", turns: [
    ['dior', "{b}, {a}. Friendship still going?"],
    ['b', "It is. We text most days."],
    ['a', "{b} got me through the worst days in that villa. I'm not going to forget that."],
  ], beat: "{b} smiles and squeezes {a}'s hand." },
  { when: { now: 'drifted' }, stage: "{a} and {b} sit on different sofas.", turns: [
    ['dior', "{a}, {b}. You were so close in the villa. Are you still close?"],
    ['a', "Not really. We drifted."],
    ['dior', "What happened?"],
    ['b', "Nothing big. We just stopped calling. I'm sad about it, honestly."],
    ['a', "Me too. Maybe tonight can fix that."],
  ], beat: "{b} nods, and they smile at each other across the stage." },
  { when: { now: 'drifted' }, stage: "{a} and {b} sit apart, a little awkward.", turns: [
    ['dior', "{b}, {a}. Still best friends?"],
    ['b', "I wouldn't say that any more."],
    ['a', "I thought we were. I'm hurt, if I'm honest."],
    ['b', "I'm not angry with you. Life just got busy. I'm sorry."],
  ], beat: "The studio goes quiet." },
]);

// ── the quick questions ────────────────────────────────────────────────
export const RU_ASK = kind('ru-ask', ['q'], [
  { when: { q: 'again' }, turns: [['dior', "Quick question, and I want quick answers. Would you do it all again?"]] },
  { when: { q: 'learned' }, turns: [['dior', "Quick-fire. What did that villa teach you about yourself?"]] },
  { when: { q: 'change' }, turns: [['dior', "Quick one. If you could go back and change one thing, what would it be?"]] },
  { when: { q: 'home' }, turns: [['dior', "Quick-fire. What was the first thing you did when you got home?"]] },
  // A question asked of a second round (pm/reunion.js runs rounds until everyone has spoken twice).
  { when: { q: 'again' }, turns: [['dior', "Same question for the rest of you. Would you go back in tomorrow, knowing what you know now?"]] },
  { when: { q: 'learned' }, turns: [['dior', "Let's go along the sofa. One thing the villa taught you. Quickly."]] },
  { when: { q: 'change' }, turns: [['dior', "The rest of you, then. One thing you'd do differently. No speeches."]] },
  { when: { q: 'home' }, turns: [['dior', "And the rest of you. First thing you did once you were home?"]] },
]);
const Q = (q, how, lines) => lines.map(([lead, line]) => ({ when: { q, how }, turns: [['dior', lead], ['a', line]] }));
export const RU_QUICK = kind('ru-quick', ['q', 'how'], [
  // would you do it again
  ...Q('again', 'early', [["{a}?", "Yes. I'd just want a lot longer next time."], ["{a}, you weren't in there long."], ["What about you, {a}?", "In a heartbeat. I barely got started."], ["{a}?", "Yes. I'd be braver from the first day."]].map(([l, t]) => (t ? [l, t] : [l, "Yes. I'd want the chance to actually get to know people."]))),
  ...Q('again', 'mid', [["{a}?", "Yes. It was the hardest thing I've ever done, and I loved it."], ["{a}, would you?", "I think so. I'd protect my heart a bit more."], ["And {a}?", "Yes. I made friends in there I'll have for life."], ["{a}?", "Probably. Ask me again in a year."]]),
  ...Q('again', 'walked', [["{a}, you walked. Would you go back?", "I don't know. I left for a reason. But I miss it some days."], ["{a}?", "Maybe. Not yet. I needed to go when I did."]]),
  ...Q('again', 'final', [["{a}?", "Every single day of it."], ["{a}, would you?", "Yes. All of it, even the hard parts."], ["And {a}?", "Yes. I wouldn't change a thing."]]),
  ...Q('again', 'won', [["{a}?", "Yes. It gave me the best thing in my life."], ["{a}, you won. Would you do it again?", "Yes. But I'd want to win it the same way."]]),
  // what it taught them
  ...Q('learned', 'early', [["{a}?", "That I give up on things too quickly."], ["{a}?", "That it's okay to put yourself out there, even if it doesn't work."], ["And {a}?", "That I'm stronger than I thought. Leaving early hurt, and I got through it."], ["{a}, you went first. What did you learn?", "That I need to say what I want, out loud, straight away."]]),
  ...Q('learned', 'mid', [["{a}?", "That I trust people too easily."], ["{a}?", "That I'm more jealous than I thought I was."], ["What about you, {a}?", "That I can be on my own and be okay."], ["{a}?", "That I care a lot about what people think of me. I'm working on that."]]),
  ...Q('learned', 'walked', [["{a}?", "That it's okay to walk away from something that isn't right for you."], ["{a}, you left on your own terms. What did it teach you?", "That I know myself better than I thought."]]),
  ...Q('learned', 'final', [["{a}?", "That I can actually let someone in."], ["{a}?", "That I'm a lot more patient than I thought."], ["And {a}?", "That the best things take time."]]),
  ...Q('learned', 'won', [["{a}?", "That I deserve to be loved properly."], ["{a}, what did winning teach you?", "That being honest gets you further than playing it safe."]]),
  // one thing they'd change
  ...Q('change', 'early', [["{a}?", "I'd have gone for who I really liked on the first night."], ["{a}?", "I'd talk to more people. I hid at the start."], ["And {a}?", "I wouldn't have played it so safe. I was too nervous."], ["{a}, one thing?", "I'd have got to know everyone as people first, not just as options."]]),
  ...Q('change', 'mid', [["{a}?", "I'd have trusted my gut sooner."], ["{a}?", "I'd have said sorry quicker after the big argument."], ["What about you, {a}?", "I'd have stayed out of other people's business."], ["{a}?", "I'd have ended things sooner instead of hoping it would get better."]]),
  ...Q('change', 'walked', [["{a}?", "I'd have asked for help sooner, before it got too much."], ["{a}, would you change leaving?", "No. I'd change how long I waited to say I wasn't okay."]]),
  ...Q('change', 'final', [["{a}?", "Not a lot. Maybe I'd have told my partner how I felt sooner."], ["{a}?", "I'd have stressed less. It worked out in the end."], ["And {a}?", "I'd have enjoyed it more instead of worrying about every recoupling."]]),
  ...Q('change', 'won', [["{a}?", "Nothing. I mean that. It led me here."], ["{a}, even the winners get asked. One thing?", "I'd have said I love you a week earlier."]]),
  // the first thing at home
  ...Q('home', 'early', [["{a}?", "Cried, then slept for about fourteen hours."], ["{a}?", "Hugged my {~mum} for about ten minutes straight."], ["And {a}?", "Watched the episode I left in. Big mistake."], ["{a}, first thing?", "Ate a whole pizza on my own. I'm not ashamed."]]),
  ...Q('home', 'mid', [["{a}?", "Turned my phone on and immediately turned it off again."], ["{a}?", "Went to see my best friend. I'd missed everyone so much."], ["What about you, {a}?", "Had a bath. A long one. Nobody waiting outside."], ["{a}?", "Slept in a room on my own. It was so quiet I couldn't sleep."]]),
  ...Q('home', 'walked', [["{a}?", "Saw my family. That's why I left, and it was the right thing to do."], ["{a}?", "Sat in the garden with my dog for an hour. It was exactly what I needed."]]),
  ...Q('home', 'final', [["{a}?", "Called my partner, about an hour after we'd said goodbye."], ["{a}?", "Took my family out for dinner. They'd been so nervous for me."], ["And {a}?", "Slept for a full day."]]),
  // more of the two most common, so a round of five never hears one answer twice
  ...Q('again', 'mid', [["{a}, would you go back in?", "Yes. I'd just trust my own feelings more and listen to everyone else less."], ["{a}?", "Yes, but I'd want a different ending."]]),
  ...Q('again', 'early', [["{a}?", "Yes. I didn't get to show who I really am."], ["{a}, would you?", "Honestly, yes. Even knowing I'd go early."]]),
  ...Q('learned', 'mid', [["{a}, what did it teach you?", "That I don't have to be liked by everyone."], ["{a}?", "That I'm softer than I pretend to be."]]),
  ...Q('learned', 'early', [["{a}?", "That rejection doesn't kill you. It just feels like it at the time."], ["{a}, what did you learn?", "That I hold back too much at the start of things."]]),
  ...Q('change', 'mid', [["{a}, one thing?", "I'd have been kinder to myself on the bad days."], ["{a}?", "I'd have stood up for myself sooner."]]),
  ...Q('change', 'early', [["{a}?", "I'd have stopped worrying about the cameras."], ["{a}, what would you change?", "I'd have pulled the person I liked for a chat on day one."]]),
  ...Q('home', 'mid', [["{a}, first thing?", "Cooked my own dinner, in my own kitchen. It felt amazing."], ["{a}?", "Called my best friend and talked for three hours."]]),
  ...Q('home', 'early', [["{a}?", "Sat in the car on my drive for ten minutes before I could go in."], ["{a}, first thing?", "Turned the show on, and watched everyone carry on without me."]]),
  ...Q('home', 'won', [["{a}?", "Showed my family the trophy, then fell asleep on the sofa holding it."], ["{a}, the winner. First thing?", "Took my partner to meet my family. Straight from the airport."]]),
]);

// ── goodnight ──────────────────────────────────────────────────────────
export const RU_CLOSE = kind('ru-close', ['fate'], [
  { when: { fate: ['together', 'stronger'] }, turns: [
    ['dior', "Before we go, the last word goes to our winners. {a}, {b}?"],
    ['a', "Thank you to everyone who voted for us. You changed our lives."],
    ['b', "And thank you to everyone on these sofas. We wouldn't have got through it without you."],
    ['dior', "That's all from us. Thank you to every one of our islanders, and to all of you for watching. Goodnight!"],
  ], beat: "The whole studio is on its feet, and the islanders pile onto the stage together." },
  { when: { fate: ['together', 'stronger'] }, turns: [
    ['dior', "{a}, {b}, our winners. Anything you want to say before we go?"],
    ['b', "Just that it was real. All of it. Thank you for believing in us."],
    ['dior', "Thank you all for watching, and thank you to our islanders for letting us in. Goodnight!"],
  ], beat: "Confetti comes down over the stage, and the islanders hug each other." },
  { when: { fate: 'split' }, turns: [
    ['dior', "Our winners have had a hard few weeks. {a}, {b}, anything you want to say before we go?"],
    ['b', "Just thank you to everyone who voted. It meant a lot, even if it didn't end the way we hoped."],
    ['a', "Same. I'll always be grateful for what we had in there."],
    ['dior', "Thank you to every one of our islanders, and to all of you for watching. Goodnight."],
  ], beat: "The studio claps, and the islanders slowly get up from the sofas." },
  { when: { fate: 'friends' }, turns: [
    ['dior', "The last word goes to our winners, and our best friends. {a}, {b}?"],
    ['a', "Thank you for voting for a friendship. That meant everything."],
    ['b', "And thank you to everyone here. I'd do it all again with every one of you."],
    ['dior', "Goodnight, everyone, and thank you for watching!"],
  ], beat: "The whole cast gathers in the middle of the stage." },
  { when: { fate: 'none' }, turns: [
    ['dior', "That's all we have time for. Thank you to every one of our islanders, and to all of you for watching."],
    ['dior', "Goodnight, and see you in the villa next time."],
  ], beat: "The whole studio is on its feet." },
]);
