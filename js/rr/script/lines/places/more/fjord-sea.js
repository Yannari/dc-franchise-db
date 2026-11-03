// Fjord Sea, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/fjord-sea.js: both build the longship from the picture-only sheet and
// row and sail it across the fjord; at the meatball cannon, a packs, aims and fires and b watches from the oars.
import { V, mergePools } from '../_kit.js';

const LS = { taskId: 'longship' };
const MC = { taskId: 'meatball-cannon' };

const longship = {
  'task-start.any': [
    { id: 'fjs2.ls-s5', when: LS, turns: [
      { beat: 'Picture one on the instruction sheet shows two stick people holding a plank.' },
      { by: 'a', say: "Step one: hold a plank." },
      { by: 'b', say: "Okay. I can do that." },
    ] },
    { id: 'fjs2.ls-s6', when: LS, turns: [
      { by: 'b', say: "Sort it first. Planks here, oars there, shields over there." },
      { by: 'a', say: "And this?" },
      { beat: '{a} holds up a long carved wooden dragon head with its tongue out.' },
      { by: 'b', say: "That goes at the front." },
    ] },
    { id: 'fjs2.ls-s7', when: LS, turns: [
      { beat: 'Further along the stony shore, another team\'s longship is already half built and looking very much like a ship.' },
      { by: 'a', say: "Don't look at theirs. Theirs isn't our problem." },
      { by: 'b', say: "Theirs looks like a ship already." },
    ] },
    { id: 'fjs2.ls-s8', when: LS, turns: [
      { by: 'a', ...V("I think the planks go on in rows. Like roof tiles. Each one over the last one.", "Planks go on like roof tiles.", "Like roof tiles.", "Like ROOF TILES! Each one OVER the last!", "I think the planks overlap in rows, like roof tiles do.", "A boat is just a roof that's fallen in love with the sea.") },
      { by: 'b', say: "How do you know that?" },
      { by: 'a', say: "I just think so. Try it." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjs2.ls-f5', when: LS, turns: [
      { beat: 'The hull goes up plank over plank, the mast slides into its slot with a thunk, and the striped sail unrolls with the stripes the right way round.' },
      { by: 'b', say: "Push it in! Quick!" },
      { beat: 'They row out, the sail catches, and the longship carries them to the far shore without a drop inside.' },
    ] },
    { id: 'fjs2.ls-f6', when: LS, turns: [
      { by: 'a', say: "Row on the count. In, pull. In, pull." },
      { by: 'b', say: "We sound like a real crew." },
      { beat: 'In, pull, in, pull, straight across the fjord, and the bow scrapes up onto the far shore.' },
      { by: 'a', say: "We are a real crew." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fjs2.ls-a5', when: LS, turns: [
      { by: 'b', say: "Look at the gaps! There's daylight between the planks! Stuff them with the moss off the rocks." },
      { by: 'a', say: "Moss? In a ship?" },
      { by: 'b', say: "The old ones did it. I saw it in a museum." },
      { beat: 'Moss in every gap, and the third longship rows all the way across the fjord without a drop coming in.' },
    ] },
    { id: 'fjs2.ls-a6', when: LS, turns: [
      { beat: 'This time {a} sits in the hull while {b} hammers, and points at every crack the light comes through.' },
      { by: 'a', say: "There. There. And there. And one by your foot." },
      { beat: 'Every crack fixed, the longship goes into the fjord, stays dry, and lands them on the far shore.' },
      { by: 'b', say: "That's it. You found them all." },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fjs2.ls-t4', when: LS, turns: [
      { beat: '{a} is standing in the half-built hull, holding the mast upright with both arms, waiting for {b} to fix it in place.' },
      { by: 'a', say: "Hurry. It's leaning. It's leaning on me." },
      { by: 'b', say: "I can't find the peg! There's no peg in the picture!" },
    ] },
    { id: 'fjs2.ls-t5', when: LS, turns: [
      { by: 'b', say: "We've got six shields and the picture only has five." },
      { by: 'a', say: "Then one of them must be spare." },
      { by: 'b', say: "Or we've done something wrong." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjs2.ls-x4', when: LS, turns: [
      { beat: 'Halfway across, the dragon head falls off the front and floats away ahead of them.' },
      { by: 'a', say: "The front! The front's come off!" },
      { by: 'b', say: "And the front's open! Water's coming in! Back to shore!" },
    ] },
    { id: 'fjs2.ls-x5', when: LS, turns: [
      { beat: 'The longship floats beautifully, until {a} and {b} climb in, when it sinks gently up to the shields.' },
      { by: 'b', say: "It floated without us!" },
      { by: 'a', say: "It's not a ship if we can't be in it! Back! Rebuild!" },
    ] },
  ],
  'task-done.any': [
    { id: 'fjs2.ls-dn4', when: LS, turns: [
      { by: 'b', say: "We should name it." },
      { by: 'a', say: "Something strong." },
      { by: 'b', say: "It barely leaked. That's good enough." },
    ] },
    { id: 'fjs2.ls-dn5', when: LS, turns: [
      { beat: '{a} steps out onto the stones of the far shore, sways, and grabs {b}\'s arm.' },
      { by: 'a', say: "Everything's moving." },
      { by: 'b', say: "That's just from the boat." },
    ] },
    { id: 'fjs2.ls-dn6', when: LS, turns: [
      { by: 'a', say: "We still have three planks left over." },
      { by: 'b', say: "Don't tell anyone." },
      { by: 'a', say: "And it still floated." },
    ] },
  ],
};

const cannon = {
  'task-start.any': [
    { id: 'fjs2.mc-s5', when: MC, turns: [
      { beat: '{a} picks up a meatball from the pile, weighs it in one hand, and sniffs it.' },
      { by: 'a', say: "These are real meatballs." },
      { by: 'b', say: "Not for long. Load them." },
    ] },
    { id: 'fjs2.mc-s6', when: MC, turns: [
      { by: 'b', say: "Pack them down tight. Loose meatballs go everywhere." },
      { by: 'a', say: "How tight?" },
      { by: 'b', say: "Really tight." },
    ] },
    { id: 'fjs2.mc-s7', when: MC, turns: [
      { beat: '{a} crouches behind the cannon and looks down the barrel at the target, one eye shut.' },
      { by: 'a', say: "I'm lining it up." },
      { by: 'b', say: "Hurry up." },
    ] },
    { id: 'fjs2.mc-s8', when: MC, turns: [
      { by: 'a', say: "How do I move it? It's so heavy." },
      { by: 'b', ...V("There's a handle on the side. Wind it, and the front goes up.", "Wind the handle on the side.", "Handle. Side.", "There's a HANDLE on the side! WIND it!", "There's a little handle on the side, wind it and the front goes up.", "The cannon has a handle. Everything has a handle if you look.") },
      { beat: '{a} winds the handle. The front of the cannon goes up, and up, much too high.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjs2.mc-f5', when: MC, turns: [
      { beat: 'BOOM. The meatball flies in a long curve and drops straight through the middle of the target.' },
      { by: 'b', say: "Through the middle! First shot!" },
      { by: 'a', say: "I can't believe it!" },
    ] },
    { id: 'fjs2.mc-f6', when: MC, turns: [
      { by: 'a', say: "Three meatballs this time. Let's see." },
      { beat: 'Three meatballs, one boom, and all three go through the middle of the target together.' },
      { by: 'b', say: "All three! Right through the middle!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fjs2.mc-a5', when: MC, turns: [
      { by: 'b', say: "Every shot goes right. Every single one. So aim at the left edge, and let it drift." },
      { by: 'a', say: "Aim to the side?" },
      { by: 'b', say: "To the side. Trust me." },
      { beat: '{a} aims at the left edge. The meatball drifts right, and drops dead through the centre.' },
    ] },
    { id: 'fjs2.mc-a6', when: MC, turns: [
      { beat: 'After five misses, {a} ties a bit of string to the end of the barrel and watches which way it blows before every shot.' },
      { by: 'a', say: "The wind's dropped. Now!" },
      { beat: 'BOOM. Through the middle of the target, and the shore crew cheers.' },
      { by: 'b', say: "The string worked!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fjs2.mc-t4', when: MC, turns: [
      { beat: '{a} is down to the last few meatballs in the pile, and the target out on the fjord has drifted further away.' },
      { by: 'a', say: "It's moving! The target's moving away from me!" },
      { by: 'b', say: "It's the tide. Aim further." },
      { by: 'a', say: "It's so far away now." },
    ] },
    { id: 'fjs2.mc-t5', when: MC, turns: [
      { by: 'b', say: "That one went sideways. How does a meatball go sideways?" },
      { by: 'a', say: "I don't know. The wind?" },
      { by: 'b', say: "Then aim for the wind!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjs2.mc-x4', when: MC, turns: [
      { beat: 'BOOM. The meatballs come out as one squashed lump, fly about three metres, and land on the deck at {b}\'s feet.' },
      { by: 'b', say: "That didn't even go anywhere!" },
      { by: 'a', say: "Packed too tight! Reload! Again!" },
    ] },
    { id: 'fjs2.mc-x5', when: MC, turns: [
      { beat: 'The meatball lands right on top of the target, sits there for a second, then rolls off into the water.' },
      { by: 'a', say: "It was on it! It was sitting on it!" },
      { by: 'b', say: "On isn't through! Reload!" },
    ] },
  ],
  'task-done.any': [
    { id: 'fjs2.mc-dn4', when: MC, turns: [
      { beat: '{a} pats the side of the cannon, still warm.' },
      { by: 'a', say: "That was so much fun." },
      { by: 'b', say: "Come on. Row." },
    ] },
    { id: 'fjs2.mc-dn5', when: MC, turns: [
      { by: 'b', say: "I'm starving. All I've smelled for an hour is meatballs." },
      { by: 'a', say: "There's one stuck to the mast." },
      { by: 'b', say: "Not that hungry." },
    ] },
    { id: 'fjs2.mc-dn6', when: MC, turns: [
      { by: 'a', say: "How many did we fire?" },
      { by: 'b', say: "Too many. I stopped counting." },
      { by: 'a', say: "Row. Let's get out of here." },
    ] },
  ],
};

export default mergePools(longship, cannon);
