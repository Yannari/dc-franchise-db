// A partner snapping, rewritten to the standard. Scenes of 6 to 12 lines, about something specific that's been
// building (the humming, the map, the pace), with what it's really about underneath. a snaps at b.
// `snap`: out loud. `cold-shoulder`: a stops talking to b altogether.
import { V } from '../places/_kit.js';

const SN = 'snap.snap', CS = 'snap.cold-shoulder';

export default {
  retire: [SN, CS, 'snap.any'],
  pools: {
    [SN]: [
      { id: 'sn.s-any1', turns: [
        { beat: '{b} is humming the same four notes, over and over, right behind {a}.' },
        { by: 'a', ...V("Stop humming. I swear, if I hear those four notes one more time.", "Stop humming. Four notes, one more time, I swear.", "Stop humming. One more time and I swear.", "STOP HUMMING! I swear, if I hear those FOUR NOTES one more time!",
          "Can you please stop humming? If I hear those four notes one more time, I swear.", "Stop humming. Those four notes are living in my skull now.") },
        { by: 'b', say: "I hum when I'm nervous. I don't even know I'm doing it." },
        { by: 'a', say: "Well, I know you're doing it. Everybody on this continent knows you're doing it." },
        { by: 'b', say: "It's not about the humming, is it?" },
        { by: 'a', ...V("No. It's that I'm doing all the worrying for both of us, and you're back there humming like we're on holiday.", "I'm worrying for both of us, and you're humming like it's a holiday.", "I do all the worrying. You hum. Like a holiday.", "NO! It's that I'm doing ALL the worrying for BOTH of us, and you're HUMMING like we're on HOLIDAY!",
          "No. It's that I feel like I'm doing all the worrying for both of us, and you're humming like we're on holiday.", "No. I'm carrying all the worry, and you're carrying a tune.") },
        { by: 'b', say: "I'm worried too. I just hum it." },
        { beat: 'Neither of them says anything for a while. The humming does not come back.' },
      ] },
      { id: 'sn.s-any2', turns: [
        { by: 'b', ...V("We should've gone left. I said left. I said it twice.", "I said left. I said it twice.", "We should've gone left. I said it twice.", "We should've gone LEFT! I SAID left! I said it TWICE!",
          "We should have gone left, you know. I said left, twice.", "Left. I said left. I said it like a prophet. Twice.") },
        { by: 'a', ...V("Then you should've said it louder. Or held the map. Or done anything except say it twice.", "Then hold the map, or say it louder.", "Say it louder. Or hold the map yourself.", "Then you should've said it LOUDER! Or held the MAP! Or done ANYTHING except say it TWICE!",
          "Then maybe you should have said it louder, or held the map yourself.", "Then you should've held the map, or a sign, or a parade.") },
        { by: 'b', say: "I'm not allowed to hold the map. You took the map." },
        { by: 'a', say: "Because last time you held the map we ended up at a goat farm!" },
        { by: 'b', say: "That was one time!" },
        { by: 'a', say: "It was a very big goat farm!" },
        { beat: 'A passing local stops, looks at them, and walks a little faster.' },
      ] },
      { id: 'sn.s-fam1', when: { relFam: 'family' }, turns: [
        { by: 'a', ...V("You always do this. Since we were kids. Something goes wrong, and you go quiet, and I have to fix it.", "You always go quiet and I fix it. Since we were kids.", "Since we were kids. You go quiet, I fix it.", "You ALWAYS do this! Since we were KIDS! You go QUIET and I have to FIX it!",
          "You always do this. Ever since we were kids. Something goes wrong, you go quiet, and I fix it.", "Since we were kids. Something breaks, you vanish, and I'm the glue.") },
        { by: 'b', say: "That's not fair." },
        { by: 'a', say: "Mom's birthday. The car. The dog." },
        { by: 'b', say: "The dog was not my fault." },
        { by: 'a', ...V("The dog was a little bit your fault.", "The dog was a bit your fault.", "Partly your fault, the dog.", "The dog was a LITTLE BIT your fault!", "Okay, the dog was a little bit your fault.", "The dog was at least forty percent your fault.") },
        { beat: 'They walk on in silence. After a minute, {b} speaks without looking over.' },
        { by: 'b', say: "I'm sorry about the dog." },
      ] },
      { id: 'sn.s-love1', when: { relFam: 'romantic' }, turns: [
        { by: 'b', say: "Can we slow down? Just for a minute? My feet are bleeding." },
        { by: 'a', ...V("Your feet are not bleeding. You've been saying your feet are bleeding since breakfast.", "Your feet aren't bleeding. You've said that all day.", "They're not bleeding. You've said that all day.", "Your feet are NOT bleeding! You've been saying that ALL DAY!",
          "Your feet aren't bleeding, babe. You've been saying they're bleeding all day.", "Your feet are not bleeding. They have been dramatic since breakfast.") },
        { by: 'b', say: "Don't babe me." },
        { by: 'a', say: "I didn't say babe." },
        { by: 'b', say: "You were about to. I could hear it coming." },
        { beat: '{b} takes off a shoe. The sock is, in fact, a little bit red.' },
        { by: 'a', say: "Oh. Okay. Sit down. Sit down, I'm sorry." },
      ] },
      { id: 'sn.s-task1', when: { at: 'task' }, turns: [
        { beat: '{b} has just failed it again. {a} throws the tip envelope on the ground.' },
        { by: 'a', ...V("How? How do you keep getting that part wrong? It's the same part every time!", "How do you keep getting that part wrong? Same part!", "It's the same part every time. How do you keep missing it?", "HOW? How do you KEEP getting that part WRONG? It's the SAME part every time!",
          "How do you keep getting that part wrong? It's the same part, every single time!", "It's the same part. Every time. You and that part have a feud.") },
        { by: 'b', say: "Do you want to do it?" },
        { by: 'a', say: "I'm not allowed to do it!" },
        { by: 'b', ...V("Then stop yelling at the person who is.", "Then stop yelling at the person doing it.", "Then stop yelling at me.", "Then STOP YELLING at the person who IS!",
          "Then maybe stop yelling at the person who's actually doing it.", "Then stop yelling at the only person allowed to do it.") },
        { beat: '{a} picks the envelope back up, very carefully, and says nothing.' },
      ] },
    ],
    [CS]: [
      { id: 'sn.c-any1', turns: [
        { by: 'b', say: "Which way now?" },
        { beat: '{a} points. Doesn\'t look, doesn\'t speak, just points.' },
        { by: 'b', ...V("Oh, we're doing this? We're doing the pointing?", "We're doing the pointing now?", "So we're pointing now.", "Oh, we're DOING this? We're doing the POINTING?", "Oh, so we're doing this now? The pointing thing?", "Ah. The pointing. The ancient language of the furious.") },
        { beat: '{a} points again, harder.' },
        { by: 'b', say: "Fine. I can point too." },
        { beat: 'They walk the next mile in total silence, pointing.' },
      ] },
      { id: 'sn.c-any2', turns: [
        { by: 'b', ...V("I said I was sorry. Three times. You want a fourth?", "I said sorry three times. Want a fourth?", "Three sorries. You want a fourth?", "I SAID I was SORRY! THREE times! You want a FOURTH?",
          "I've said I'm sorry three times now. Do you want a fourth?", "I've apologised three times. Four is a lot of apologising.") },
        { by: 'a', say: "Okay." },
        { by: 'b', say: "That's it? Okay?" },
        { by: 'a', say: "I heard you. Okay." },
        { by: 'b', ...V("That's the worst okay you've ever said. That's a terrible okay.", "That's your worst okay ever.", "Worst okay you've ever said.", "That's the WORST okay you've EVER said!", "That's honestly the worst okay you've ever said.", "That okay had no soul in it.") },
        { beat: '{a} walks on ahead, and stays a few steps ahead for the rest of the leg.' },
      ] },
      { id: 'sn.c-fam1', when: { relFam: 'family' }, turns: [
        { by: 'b', say: "You're doing the thing Dad does. The quiet thing." },
        { by: 'a', say: "I'm not doing anything." },
        { by: 'b', ...V("You are. The jaw, the walking ahead, the very polite answers. It's the Dad thing.", "The jaw, the walking ahead, the polite answers. It's Dad.", "The jaw. The walking ahead. It's Dad.", "You ARE! The JAW, the walking AHEAD, the very POLITE answers! It's the DAD thing!",
          "You are, though. The jaw, the walking ahead, the very polite answers. It's what Dad does.", "The jaw, the pace, the politeness. You've become Dad.") },
        { by: 'a', say: "Would you like a drink of water?" },
        { by: 'b', say: "See? That's so polite. That's the most Dad thing you've ever said." },
        { beat: '{a} walks a little faster, with {a.posAdj} jaw set exactly like their father\'s.' },
      ] },
    ],
  },
};
