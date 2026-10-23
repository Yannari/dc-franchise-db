// ══════════════════════════════════════════════════════════════════════
// pm/talk/journey.js — the final date, and the film of a couple's summer
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). The clips themselves are
// the narrator over the footage (pm/lines/journey.js, journey-clip); these
// are the two of them, talking.
//   final-date     [a, b]  their last date. `of`: sunset · yacht · picnic · rooftop
//   journey-open   [a, b]  the film begins. `of` the story's shape (pm/journey.js shapesOf):
//                  steady · rocky · way-back · late · enemies · fought-for · fell-harder ·
//                  friends · underdog · second-chance · slow-burn · survivors · held · casa-made
//   journey-react  [a, b]  watching one chapter back. `of` the chapter:
//                  night-one · met · date-met · coupled · first-kiss · date · row · tested · casa ·
//                  photos · split · back · at-risk · love · challenge · enemies · friends · crush ·
//                  fought · found · second
//   journey-end    [a, b]  the film ends. `of` the shape.
//   speech         [a, b]  the middle of a's declaration: one chapter, {day} when it was.
// Either of them may say any line: nothing says WHICH of them strayed, fell
// first, or was left on the bench. A chapter is only what aired.
import { build } from './build.js';

const FINAL = { tiered: false };

export const FINAL_DATE = build('final-date', {
  ...FINAL,
  plans: { featured: ['arrive', 'talk', 'future', 'land'], short: ['arrive', 'talk', 'land'] },
  moves: {
    arrive: [
      { when: { of: 'sunset' }, stage: "A clifftop, a table for two, and the sun going down behind {a} and {b} on their final date.", turns: [
        ['a', "This is unreal. Look at it. Look at the colour of the sky."],
        ['b', "I can't believe it's the last one. The last date."],
      ] },
      { when: { of: 'sunset' }, stage: "A beach lit by candles, and a table set for two.", turns: [
        ['b', "Look at this. They've gone all out. There are petals. Actual petals."],
        ['a', "We deserve petals. We've earned petals."],
      ] },
      { when: { of: 'yacht' }, stage: "{a} and {b}'s final date is on a yacht, out on the water, with the island getting smaller behind them.", turns: [
        ['a', "I'm not going to lie, I feel like a film star right now."],
        ['b', "You look like one. Don't let it go to your head."],
      ] },
      { when: { of: 'yacht' }, stage: "A boat takes {a} and {b} out for the last date, just the two of them and the sea.", turns: [
        ['b', "No villa. No fire pit. No phone going off. Well. Some cameras."],
        ['a', "Just us, then. Mostly."],
      ] },
      { when: { of: 'picnic' }, stage: "A blanket, a basket and a view: the final date, in the hills above the villa.", turns: [
        ['a', "You can see the whole villa from up here. It looks so small."],
        ['b', "All that drama, in that tiny little box."],
      ] },
      { when: { of: 'rooftop' }, stage: "A rooftop terrace strung with lights, a table for two, and the whole island below.", turns: [
        ['b', "We made it. We actually made it to the final date."],
        ['a', "Did you ever think we would? Honestly?"],
      ] },
    ],
    talk: [
      { turns: [
        ['b', "Can I tell you something? The first week, I had a whole list in my head of reasons this wouldn't work."],
        ['a', "A list? How long was the list?"],
        ['b', "Long. Really long. And every week, something came off it. There's nothing left on it now."],
        ['a', "That might be the most romantic thing anyone's ever said to me, and it was about a list."],
      ] },
      { turns: [
        ['a', "Do you know what I'm going to miss? The stupid stuff. Making you a tea. You stealing the good side of the bed."],
        ['b', "I don't steal it. I'm just already on it."],
        ['a', "Every single night."],
        ['b', "And you still came to bed every night."],
      ] },
      { turns: [
        ['b', "What's the moment? The one you'll remember. If you had to pick."],
        ['a', "Honestly? Not a big one. Some random afternoon on the daybeds. You fell asleep mid-sentence, and I just sat there and thought, oh. Oh no. I'm in trouble."],
        ['b', "I didn't fall asleep mid-sentence."],
        ['a', "You did. It was a very boring sentence."],
      ] },
      { turns: [
        ['a', "Are you nervous? About tomorrow? About the outside?"],
        ['b', "A bit. In here it's just us. Out there, there's everything else."],
        ['a', "Everything else will just have to fit round us, then."],
      ] },
      { turns: [
        ['b', "I keep thinking about how close we came to not happening. All the times it could have gone a different way."],
        ['a', "Stop. Don't think about that. It didn't go a different way. It went this way."],
      ] },
    ],
    future: [
      { turns: [
        ['a', "When we get out, I want to take you to my favourite place at home. It's nothing special. It's just mine, and I want it to be ours."],
        ['b', "I'd love that. I want to see all of it. Your terrible bedroom. Your friends who are going to hate me."],
        ['a', "They're going to love you. That's the scary bit."],
      ] },
      { turns: [
        ['b', "First thing, when we're out. What are we doing?"],
        ['a', "Sleeping in a bed that doesn't have a microphone next to it."],
        ['b', "And then?"],
        ['a', "And then whatever you want. For as long as you want."],
      ] },
      { turns: [
        ['a', "My family's going to have so many questions."],
        ['b', "Good questions or bad questions?"],
        ['a', "Embarrassing questions. They'll have watched every minute of this."],
        ['b', "Every minute? Even the fire pits?"],
        ['a', "Especially the fire pits."],
      ] },
    ],
    land: [
      { turns: [], beat: "They clink glasses, and neither of them looks away first." },
      { turns: [], beat: "{b} rests {b.posAdj} head on {a}'s shoulder, and for a long time neither of them says anything." },
      { turns: [], beat: "They watch the sun go all the way down before anyone mentions going back." },
    ],
  },
});

export const JOURNEY_OPEN = build('journey-open', {
  ...FINAL,
  plans: { featured: ['screen', 'nerves'], short: ['screen'] },
  moves: {
    screen: [
      { when: { of: ['steady', 'slow-burn', 'held'] }, stage: "After dinner, a screen lights up on the table. It's a film of their time in the villa.", turns: [['b', "Oh no. What's this?"], ['a', "It's us. It's the whole summer."]] },
      { when: { of: ['steady', 'friends', 'late', 'casa-made'] }, stage: "A screen on the table lights up with both their names, and a film begins.", turns: [['a', "Shall we?"], ['b', "Go on, then. Slowly. I want to see every second."]] },
      { when: { of: ['rocky', 'way-back', 'survivors'] }, stage: "A screen lights up. On it, in white letters: their journey.", turns: [['b', "I'm scared of what's on this."], ['a', "Same. I think I know some of the bits they've put in."]] },
      { when: { of: 'late' }, stage: "A screen lights up. Their film is shorter than most, and they both laugh at that.", turns: [['b', "We didn't waste any time, did we?"], ['a', "Quality, not quantity."]] },
      { when: { of: 'enemies' }, stage: "The film starts, and the first thing on the screen is the two of them arguing.", turns: [['b', "Oh no. Not this. Why have they started with this?"], ['a', "Because it's the best bit. It's where we started."]] },
      { when: { of: 'fought-for' }, stage: "The film begins. It has more than two people in it.", turns: [['a', "Oh, they're showing all of that."], ['b', "Whatever they show, it ends with us. Hold my hand."]] },
      { when: { of: 'fell-harder' }, stage: "The film opens on the two of them, and one of them is very obviously keener than the other.", turns: [['a', "Look at that. It's so obvious."], ['b', "One of us took a while to catch up."]] },
      { when: { of: 'friends' }, stage: "The film starts with the two of them laughing on the daybeds, long before anything happened.", turns: [['b', "We were just friends then."], ['a', "Were we, though? Were we really?"]] },
      { when: { of: 'underdog' }, stage: "The film starts with a lot of fire pits, and a lot of nights left sitting on the bench.", turns: [['a', "Oh, they showed all of that."], ['b', "It makes the ending better. Trust me."]] },
      { when: { of: 'second-chance' }, stage: "The film starts with the two of them, the first time round, before any of this.", turns: [['a', "We've done this before."], ['b', "And we're better at it now."]] },
      { when: { of: 'casa-made' }, stage: "A screen lights up, and the first thing on it is the Casa Amor gate opening.", turns: [['a', "That's where it started. In the middle of all that."], ['b', "Best chaos of my life."]] },
    ],
    nerves: [
      { turns: [['a', "Whatever's on here, we've already lived it. It can't hurt us now."], ['b', "Says you. You haven't seen what I looked like on day two."]] },
      { turns: [['b', "If there's a clip of me snoring, I'm walking out."], ['a', "There's definitely a clip of you snoring."]] },
      { turns: [['a', "Are you going to cry?"], ['b', "Already am. It hasn't even started."]] },
    ],
  },
});

export const JOURNEY_REACT = build('journey-react', {
  ...FINAL,
  plans: { featured: ['watch', 'say?'], short: ['watch'] },
  moves: {
    watch: [
      { when: { of: 'night-one' }, turns: [['b', "Look how nervous we were. Look at your hands."], ['a', "I was shaking. You couldn't tell?"], ['b', "I could tell from across the lawn."]] },
      { when: { of: 'night-one' }, turns: [['a', "Did you think, that night, it would end up like this?"], ['b', "Not for a second. I thought you were going to be trouble."]] },
      { when: { of: ['met', 'date-met'] }, turns: [['a', "I remember thinking you were way out of my league."], ['b', "Stop it."], ['a', "I'm serious. Look at me, trying to be cool."], ['b', "You were not being cool."]] },
      { when: { of: ['met', 'date-met'] }, turns: [['b', "We had no idea, back then. None. We were just two strangers being polite."], ['a', "Very polite. Painfully polite."]] },
      { when: { of: 'coupled' }, turns: [['b', "The fire pit was terrifying that night. I didn't know what was going to happen."], ['a', "I did. I knew exactly who I was going to stand next to."]] },
      { when: { of: 'coupled' }, turns: [['a', "Best decision I made in that villa."], ['b', "Mine too. By a mile."]] },
      { when: { of: 'first-kiss' }, turns: [['a', "Oh no. I can't watch this bit. Cover my eyes."], ['b', "It was a good kiss!"], ['a', "It was a nervous kiss. Look at it. That's a nervous kiss."]] },
      { when: { of: 'first-kiss' }, turns: [['b', "I was so nervous before that. I'd been building up to it all day."], ['a', "You didn't look nervous."], ['b', "I was terrified. I just hid it very well."]] },
      { when: { of: 'date' }, turns: [['b', "That was the first time it felt like it was just us. No villa. Nobody listening."], ['a', "Apart from the cameras."], ['b', "Apart from the cameras."]] },
      { when: { of: 'date' }, turns: [['a', "I talked way too much on that date."], ['b', "I liked it. I liked all of it."]] },
      { when: { of: 'row' }, turns: [['b', "Oh God. This one."], ['a', "I'd forgotten how loud we were."], ['b', "I hadn't. I remember every word."]] },
      { when: { of: 'row' }, stage: "They both go quiet while it plays.", turns: [['a', "We came back from that, though."], ['b', "We did. I don't know how, some days, but we did."]] },
      { when: { of: 'tested' }, turns: [['b', "I didn't enjoy watching that the first time."], ['a', "I know. I didn't enjoy living it."]] },
      { when: { of: 'tested' }, stage: "{b} glances at {a} while it plays, and {a} is already looking back.", turns: [['a', "That was a hard week."], ['b', "It was. We got through it."]] },
      { when: { of: 'casa' }, stage: "{b} takes {a}'s hand before the clip has even finished.", turns: [['a', "The worst few days in there."], ['b', "The longest few days of my life. I don't want to watch that bit again."]] },
      { when: { of: 'photos' }, turns: [['b', "That photo."], ['a', "I know."], ['b', "I still think about it, sometimes."], ['a', "I know you do."]] },
      { when: { of: 'split' }, turns: [['b', "I really thought that was it. I really thought we were done."], ['a', "So did I. I couldn't sleep for days."]] },
      { when: { of: 'back' }, turns: [['a', "Best thing either of us ever did, trying again."], ['b', "You took your time about it."], ['a', "I got there."]] },
      { when: { of: 'at-risk' }, turns: [['a', "I've never been so scared at a fire pit in my life."], ['b', "I couldn't feel my legs. I genuinely couldn't feel my legs."]] },
      { when: { of: 'love' }, stage: "{b} is crying before it's even finished.", turns: [['a', "I meant every word of that."], ['b', "I know you did. I knew then, too."]] },
      { when: { of: 'love' }, turns: [['b', "I'll never forget that. Never."], ['a', "Me neither. I'm glad it's on camera. Now nobody can say I didn't say it."]] },
      { when: { of: 'challenge' }, stage: "They're both crying with laughter.", turns: [['a', "What are we doing? What is that? What am I doing with my arms?"], ['b', "Winning. Obviously."]] },
      { when: { of: 'enemies' }, turns: [['b', "I was so angry with you."], ['a', "You were terrifying."], ['b', "Good. You deserved it."]] },
      { when: { of: 'enemies' }, turns: [['a', "Can we skip this bit?"], ['b', "No. I want to see how far we've come."]] },
      { when: { of: 'friends' }, turns: [['b', "Did you like me then? Like that? Be honest."], ['a', "A little bit."], ['b', "I knew it. I knew it."]] },
      { when: { of: 'crush' }, turns: [['a', "That's hard to watch, one of us trying so hard."], ['b', "It was worth the wait, though, wasn't it?"], ['a', "Every day of it."]] },
      { when: { of: 'fought' }, turns: [['a', "I was so nervous that night."], ['b', "You had no reason to be."], ['a', "I didn't know that, did I?"]] },
      { when: { of: 'found' }, turns: [['a', "That's the night everything changed."], ['b', "Look at your face. You couldn't believe it."]] },
      { when: { of: 'second' }, turns: [['a', "Were we mad, trying again?"], ['b', "Probably. I'm so glad we were mad."]] },
    ],
    say: [
      { when: { of: ['night-one', 'met', 'date-met', 'coupled'] }, turns: [['a', "It feels like a year ago. It was a few weeks."], ['b', "In villa time, it was a year."]] },
      { when: { of: ['row', 'tested', 'photos', 'split', 'casa'] }, turns: [['b', "Do you know what I'm proud of? Not that it was easy. That it wasn't, and we're still here."]] },
      { when: { of: ['first-kiss', 'love', 'date', 'found'] }, turns: [['a', "That's when I knew. I don't think I told you that. That's when I knew."], ['b', "You've told me now."]] },
      { when: { of: ['at-risk', 'fought', 'back', 'second'] }, turns: [['b', "We nearly didn't get this. Any of this. I think about that a lot."]] },
      { turns: [['a', "I'm glad they kept that bit in."], ['b', "So am I. Even the embarrassing parts."]] },
    ],
  },
});

export const JOURNEY_END = build('journey-end', {
  ...FINAL,
  plans: { featured: ['last', 'say', 'land?'], short: ['last', 'say'] },
  moves: {
    last: [
      { stage: "The film ends. For a moment, {a} and {b} just sit there without saying anything.", turns: [] },
      { stage: "The film ends on the two of them, laughing at something nobody else heard.", turns: [] },
      { stage: "The screen goes dark, and {b} wipes {b.posAdj} eyes.", turns: [] },
    ],
    say: [
      { when: { of: ['steady', 'slow-burn', 'held'] }, turns: [['a', "We've been solid since the start, haven't we?"], ['b', "From day one. Even when everyone else was falling apart."], ['a', "I'd do it all again. Exactly the same way."]] },
      { when: { of: ['rocky', 'survivors'] }, turns: [['b', "It wasn't easy, was it?"], ['a', "No. We had some really bad days in there."], ['b', "And we're still here."], ['a', "We're still here."]] },
      { when: { of: 'way-back' }, turns: [['a', "We nearly threw it away."], ['b', "If you'd told me after the split that we'd be sitting here..."], ['a', "I wouldn't have believed it either. Not for a second."]] },
      { when: { of: 'late' }, turns: [['b', "We only had a few weeks."], ['a', "It was enough. It was more than enough."], ['b', "I wish I'd found you sooner."], ['a', "You found me in time."]] },
      { when: { of: 'enemies' }, turns: [['a', "From that, to this."], ['b', "I still think you were wrong, by the way. That first week."], ['a', "I know. I love you anyway."]] },
      { when: { of: 'fought-for' }, turns: [['b', "I'd do it all again."], ['a', "Even the hard nights?"], ['b', "Even those. They got me you."]] },
      { when: { of: 'fell-harder' }, turns: [['a', "You were worth waiting for."], ['b', "So were you. I just took longer to see it. I see it now."]] },
      { when: { of: 'friends' }, turns: [['b', "I don't want to lose my best friend."], ['a', "You won't. You get to keep me as both. That's the deal."]] },
      { when: { of: 'underdog' }, turns: [['a', "All those nights on the bench."], ['b', "And look where we ended up."], ['a', "Worth every single one."]] },
      { when: { of: 'second-chance' }, turns: [['b', "I'm glad we didn't give up on each other."], ['a', "Twice."], ['b', "Twice. Third time, I'd have been worried."]] },
      { when: { of: 'casa-made' }, turns: [['a', "Everyone said it wouldn't last past the week."], ['b', "It's lasted all the way to the final."]] },
    ],
    land: [
      { turns: [], beat: "{b} kisses {a}, and the candles flicker." },
      { turns: [], beat: "{a} reaches over and turns the screen off, and doesn't let go of {b}'s hand." },
    ],
  },
});

export const SPEECH = build('speech', {
  ...FINAL,
  plans: { featured: ['memory'], short: ['memory'] },
  moves: {
    memory: [
      { when: { of: 'back' }, turns: [['a', "When we split, I thought I'd lost the best thing that ever happened to me in there. Getting you back is the thing I'm proudest of, out of everything."]] },
      { when: { of: 'back' }, turns: [['a', "We had our time apart, and it was horrible, and it made me realise exactly what I had. I'm never letting that happen again."]] },
      { when: { of: 'casa' }, turns: [['a', "Casa Amor was the hardest few days of my life. Everyone said it would break us. It didn't. It showed me exactly what we've got."]] },
      { when: { of: 'photos' }, turns: [['a', "After the photos, I didn't know if we'd make it. I know how much that week hurt. And we're standing here anyway, and that's because of you."]] },
      { when: { of: 'split' }, turns: [['a', "There was a moment in there when it was over. I never want to feel like that again. I'm going to spend every day making sure I don't."]] },
      { when: { of: 'at-risk' }, turns: [['a', "Standing at that fire pit on day {day}, waiting for our names, the only thing I could think about was not seeing you every morning."]] },
      { when: { of: 'row' }, turns: [['a', "We've argued. Of course we have. But even when we row, I'd rather be arguing with you than getting on with anyone else in the world."]] },
      { when: { of: 'row' }, turns: [['a', "You've seen me at my worst in there, and you stayed. You called me out when I needed it. That means more to me than you know."]] },
      { when: { of: 'love' }, turns: [['a', "On day {day}, I told you how I felt. I was terrified. I meant it then, and I mean it more now, standing here."]] },
      { when: { of: 'first-kiss' }, turns: [['a', "I still think about our first kiss. I was so nervous. I'm still nervous now, if I'm honest, and that's how I know."]] },
      { when: { of: 'night-one' }, turns: [['a', "From the very first night, it was you. I didn't know it then. I know it now. We met as strangers, and I'm standing next to my best friend."]] },
      { when: { of: ['met', 'date-met', 'coupled', 'date'] }, turns: [['a', "Day {day} changed everything for me, and I didn't even know it at the time. I didn't come in looking for you. I'm so glad I found you anyway."]] },
      { when: { of: ['tested', 'challenge'] }, turns: [['a', "Not every moment in there was easy, and not every moment was romantic. But every single one of them, I wanted you next to me."]] },
      { when: { of: 'enemies' }, turns: [['a', "When we first met, we clashed. On day {day}, I honestly thought I'd never get on with you. Now I can't imagine one day without you."]] },
      { when: { of: 'friends' }, turns: [['a', "You were my best friend before you were anything else. Somewhere along the way, I realised the person I wanted to tell everything to was the person I wanted to be with."]] },
      { when: { of: 'crush' }, turns: [['a', "It wasn't love at first sight for both of us. One of us had to wait for the other to catch up. But it's love now, for both of us, and that's all that matters."]] },
      { when: { of: 'fought' }, turns: [['a', "It wasn't simple. There was a choice to make, on day {day}, and it was us. Everything since has proved it was the right one."]] },
      { when: { of: 'found' }, turns: [['a', "For so long in there, it felt like it was never going to be me. And then there was you, and it was us. I've never been so glad to be wrong."]] },
      { when: { of: 'second' }, turns: [['a', "We had our chance once, and it didn't work. Most people don't get another go. We did, and I'm not wasting a single day of it."]] },
      // Two people at one fire pit can share a chapter, and a line is heard once a night.
      { when: { of: 'casa' }, turns: [['a', "I had the chance to walk away at Casa, and I didn't want it. Walking back into this villa and seeing your face told me everything I needed to know."]] },
      { when: { of: 'photos' }, turns: [['a', "I know those photos hurt. I know what that week was like. And you still gave us the chance to get through it. I'll never forget that."]] },
      { when: { of: 'split' }, turns: [['a', "We weren't together for a while, and every day of it I knew I'd got it wrong. Standing here with you now feels like getting it right."]] },
      { when: { of: 'at-risk' }, turns: [['a', "When our names were read out at the fire pit, you squeezed my hand, and I stopped being scared. I've never told you that."]] },
      { when: { of: 'love' }, turns: [['a', "The day I said it out loud was the day this stopped being a summer for me and started being my life."]] },
      { when: { of: 'first-kiss' }, turns: [['a', "That first kiss was nothing like I expected. It was better. I've been trying to beat it ever since."]] },
      { when: { of: 'night-one' }, turns: [['a', "I've known you since the very first day. Somehow it feels like I've known you my whole life."]] },
      { when: { of: 'enemies' }, turns: [['a', "You're the only person in there who ever told me I was wrong to my face. I hated it. And then I fell for you."]] },
      { when: { of: 'friends' }, turns: [['a', "Everyone saw it before we did. Every single person. I'm so glad they were right and we were wrong."]] },
      { when: { of: 'crush' }, turns: [['a', "One of us was a bit behind the other for a while. I don't care who. I care that we both got here."]] },
      { when: { of: 'fought' }, turns: [['a', "When it came down to a choice, it was us. It will always be us. I'd make that choice every day."]] },
      { when: { of: 'found' }, turns: [['a', "People kept saying my person hadn't walked in yet. They were wrong. They'd walked in. I just had to wait."]] },
      { when: { of: 'second' }, turns: [['a', "Some things are worth a second go. You're the only one I'd ever say that about."]] },
      { when: { of: ['tested', 'challenge', 'date'] }, turns: [['a', "Even on the days that weren't perfect, I'd look over and you'd be there. That's all I've ever wanted from someone."]] },
      { turns: [['a', "I could stand here and list every moment, but it would take all night. It's all of it. It's you."]] },
    ],
  },
});
