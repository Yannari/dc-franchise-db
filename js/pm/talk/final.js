// ══════════════════════════════════════════════════════════════════════
// pm/talk/final.js — the final's declarations (pm/moments.js final)
// ══════════════════════════════════════════════════════════════════════
//
// declaration  [a, b]  {a} stands at the fire pit and speaks to {b}. The shape
//   of their story is the engine's (`of`, journey.js shapesOf): steady · rocky ·
//   way-back · late · enemies · second-chance · underdog · fought-for ·
//   fell-harder · survivors · held · casa-made · friends · slow-burn. The real
//   moment from their film follows as its own scene (`speech`), so nothing here
//   names a day or an event: only the shape, said the way people say it.
//   stand    {a} gets up
//   story    the two of them, told for their shape — the long turn
//   feel     where {a} is now
//   future   the outside
//   land     {b}, and the fire pit
import { build } from './build.js';

export const DECLARATION = build('declaration', {
  tiered: false,
  plans: { featured: ['stand', 'story', 'feel', 'future?', 'land'], short: ['story', 'feel', 'land'] },
  moves: {
    stand: [
      { stage: "{a} stands up at the fire pit and turns to {b}.", turns: [] },
      { stage: "{a} unfolds a piece of paper, looks at it, and puts it away again.", turns: [
        ['a', "I wrote a speech. I'm not going to read it. I'm just going to say it."],
      ] },
      { stage: "{a} takes both of {b}'s hands and breathes in.", turns: [] },
      { stage: "{a} gets up, and the whole fire pit goes quiet.", turns: [
        ['a', "Okay. I'm going to cry. I'm just warning everyone now."],
      ] },
    ],
    story: [
      { when: { of: 'steady' }, turns: [
        ['a', "{b}, from the very first night, it's been you. Everyone in this villa has had their ups and downs, and we've watched all of it from the daybed, holding hands. No drama. No doubts. I didn't know it could be this easy with somebody. I spent so long thinking love had to be hard to be real, and you've shown me it doesn't."],
      ] },
      { when: { of: 'rocky' }, turns: [
        ['a', "It hasn't been easy, has it? We've argued. We've had days where we couldn't look at each other, and nights where I didn't know if we'd make it to the morning. And I know some of that was me. But every single time it got hard, you were the one I wanted to fix it with. Not anyone else. You."],
      ] },
      { when: { of: 'way-back' }, turns: [
        ['a', "I lost you once in this villa. And it was the worst feeling I've ever had. I walked around this place pretending I was fine, and I wasn't. I wasn't fine for one second. And then somehow, we found our way back to each other. Everybody said we wouldn't. We did. That's how I know this is real."],
      ] },
      { when: { of: 'late' }, turns: [
        ['a', "We didn't get as long as everyone else in here. You walked in when this villa was already halfway through its summer, and I'd stopped expecting anything. And then there you were. I'd take our few weeks over anybody else's whole summer, and I mean that."],
      ] },
      { when: { of: 'enemies' }, turns: [
        ['a', "If you'd told me at the start that I'd be standing here saying this to you, I'd have laughed you out of the villa. We could not stand each other. You drove me mad. You still drive me mad. And somewhere along the way, I fell completely in love with you."],
      ] },
      { when: { of: 'second-chance' }, turns: [
        ['a', "We were given a second chance, the two of us. Not everybody gets one, and I know that. When it happened, I promised myself I wasn't going to waste it. And I haven't. Every day since, I've known exactly how lucky I am."],
      ] },
      { when: { of: 'underdog' }, turns: [
        ['a', "Nobody gave us a chance. I know they didn't, because I heard it. In the bedroom, at the fire pit, on the daybeds. Everyone had us down as the next couple out. And here we are, at the final. I always knew what we had, even when nobody else could see it."],
      ] },
      { when: { of: 'fought-for' }, turns: [
        ['a', "There were other people in it, for both of us. There were hard nights, and choices I didn't want to make. But every single time it came down to it, I chose you. And you chose me. We had to fight to get here, and I'd do every bit of it again tomorrow."],
      ] },
      { when: { of: 'fell-harder' }, turns: [
        ['a', "It took one of us a bit longer than the other to get here. I'm not going to say which one, because everyone knows. But we're both here now, all the way. And honestly, I don't care who fell first. I care that we both fell."],
      ] },
      { when: { of: 'survivors' }, turns: [
        ['a', "We've been at risk more times than I can count. I've stood at this fire pit holding your hand, waiting to hear if we were going home. And every time our names were read out as safe, I didn't feel relief for me. I felt relief that I got to keep you for another day."],
      ] },
      { when: { of: 'held' }, turns: [
        ['a', "When we went to Casa, everybody told me what was going to happen. They said nobody comes back the same. And I sat on that bed every night thinking about you. I didn't look at anyone. And when I walked back in and saw you on your own, waiting for me, I knew we could survive anything."],
      ] },
      { when: { of: 'casa-made' }, turns: [
        ['a', "We met halfway through this whole thing, when the villa was turned upside down. Everyone thought it was a Casa thing, a bit of fun, something that wouldn't last. And it's lasted. It's more than lasted. It's the realest thing I've ever had."],
      ] },
      { when: { of: 'friends' }, turns: [
        ['a', "You were my friend first. My best friend in here. You made me laugh every single day, you listened to me complain about everything, and you never once made me feel stupid. And one day I looked at you and realised I didn't just want you as my friend. Everyone in this villa saw it before we did."],
      ] },
      { when: { of: 'slow-burn' }, turns: [
        ['a', "It took us ages to get here. Honestly, ages. There were days I thought it was never going to happen. But every slow, frustrating, confusing day of it was worth it, because it means that what we've got now is built on something real."],
      ] },
      { turns: [
        ['a', "{b}, I've been thinking about what to say all day, and every time I tried to write it down, it came out wrong. So I'm just going to tell you the truth. When I walked into this villa, I didn't think I'd find anything real. I thought I'd have a summer, make some friends, and go home. And then I met you, and everything changed."],
      ] },
    ],
    feel: [
      { turns: [
        ['a', "You make me laugh every single day. You make me feel safe, which I didn't think was possible in here. And when I wake up in the morning and you're there, I'm happy before I've even opened my eyes."],
      ] },
      { turns: [
        ['a', "I'm not the same person who walked down those steps. You've made me softer, and braver, and a lot more honest, mostly with myself. And I'm so grateful for that."],
      ] },
      { when: { rung: 'official' }, turns: [
        ['a', "You're my {b.gf}. You're my best friend. And whatever the public decide tonight, I've already won. I've got you."],
      ] },
      { when: { reg: 'big' }, turns: [
        ['a', "I'm obsessed with you. I'm not even going to pretend I'm not. Everybody in this villa has had to listen to me talk about you for weeks, and I'm sorry to all of them, and I'm not sorry at all."],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['a', "I'm not good at this. Everyone knows I'm not good at this. But I'll say it once, clearly, in front of everyone: I love you. That's the speech. That's the whole speech. I'm sitting down. No, I'm not. There's more."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "Thank you for being patient with me. Thank you for being honest with me, even when it was hard. And thank you for picking me, every single time. I don't think you know how much that's meant."],
      ] },
    ],
    future: [
      { turns: [
        ['a', "Whatever happens tonight, I don't want this to stop when we walk out of here. I want the boring stuff with you. The food shop, the Sunday mornings, your friends meeting my friends. I want all of it."],
      ] },
      { turns: [
        ['a', "I can't wait for the outside with you. For a normal Tuesday. For a day where nobody's watching and it's just us, doing nothing, together."],
      ] },
      { turns: [
        ['a', "This isn't the end of anything. It's the start. And I can't wait to find out what comes next, as long as it's with you."],
      ] },
    ],
    land: [
      { turns: [], beat: "{b} is crying and laughing at the same time, and the fire pit is on its feet." },
      { turns: [], beat: "{b} pulls {a} into a hug before {a} has even sat down." },
      { when: { bGender: 'f' }, turns: [['b', "You've made me ruin my make-up."], ['a', "Worth it."]], beat: "Somewhere along the benches, someone else is crying too." },
      { turns: [], beat: "{b} can't speak for a moment, and just squeezes {a}'s hands." },
    ],
  },
  notes: [],
});
