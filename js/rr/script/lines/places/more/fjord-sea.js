// Fjord Sea, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/fjord-sea.js: both build the longship from the picture-only sheet and
// row and sail it across the fjord; at the meatball cannon, a packs, aims and fires and b watches from the oars.
import { V, mergePools } from '../_kit.js';

const LS = { taskId: 'longship' };
const MC = { taskId: 'meatball-cannon' };

const longship = {
  'task-start.any': [
    { id: 'fjs2.ls-s5', when: LS, turns: [
      { beat: 'Picture one on the instruction sheet shows two smiling stick people holding a plank. That is all it shows.' },
      { by: 'a', say: "Step one: be happy and hold a plank." },
      { by: 'b', say: "I can do one of those." },
    ] },
    { id: 'fjs2.ls-s6', when: LS, turns: [
      { by: 'b', say: "Sort it first. Planks here, oars there, shields over there." },
      { by: 'a', say: "And this?" },
      { beat: '{a} holds up a long carved wooden dragon head with its tongue out.' },
      { by: 'b', say: "That goes at the front. Obviously. It's the face." },
    ] },
    { id: 'fjs2.ls-s7', when: LS, turns: [
      { beat: 'Further along the stony shore, another team\'s longship is already half built and looking very much like a ship.' },
      { by: 'a', say: "Don't look at theirs. Theirs isn't our problem." },
      { by: 'b', say: "Theirs has a shape. Ours has a heap." },
    ] },
    { id: 'fjs2.ls-s8', when: LS, turns: [
      { by: 'a', ...V("I think the planks go on in rows. Like roof tiles. Each one over the last one.", "Planks go on like roof tiles.", "Like roof tiles.", "Like ROOF TILES! Each one OVER the last!", "I think the planks overlap in rows, like roof tiles do.", "A boat is just a roof that's fallen in love with the sea.") },
      { by: 'b', say: "How do you know that?" },
      { by: 'a', say: "Our shed. It leaks too." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjs2.ls-f5', when: LS, turns: [
      { beat: 'The hull goes up plank over plank, the mast slides into its slot with a thunk, and the striped sail unrolls with the stripes the right way round.' },
      { by: 'b', say: "Push it in! Before it changes its mind!" },
      { beat: 'They row out, the sail catches, and the longship carries them to the far shore without a drop inside.' },
    ] },
    { id: 'fjs2.ls-f6', when: LS, turns: [
      { by: 'a', say: "Row on the count. In, pull. In, pull." },
      { by: 'b', say: "We sound like a real crew." },
      { beat: 'In, pull, in, pull, straight across the fjord, and the bow scrapes up onto the far shore.' },
      { by: 'a', say: "We are a real crew. A crew of two. Very small, very good crew." },
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
      { by: 'b', say: "You're the best leak finder in the world." },
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
      { by: 'a', say: "Somebody's getting an extra shield." },
      { by: 'b', say: "Or we've done something very wrong somewhere." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjs2.ls-x4', when: LS, turns: [
      { beat: 'Halfway across, the dragon head falls off the front and floats away ahead of them, grinning.' },
      { by: 'a', say: "Our face! We've lost our face!" },
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
      { by: 'a', say: "Something fierce. Like a warrior." },
      { by: 'b', say: "The Mostly Dry." },
    ] },
    { id: 'fjs2.ls-dn5', when: LS, turns: [
      { beat: '{a} steps out onto the stones of the far shore, sways, and grabs {b}\'s arm.' },
      { by: 'a', say: "The land's moving." },
      { by: 'b', say: "The land's fine. You've got sea legs now." },
    ] },
    { id: 'fjs2.ls-dn6', when: LS, turns: [
      { by: 'a', say: "We still have three planks left over." },
      { by: 'b', say: "Don't tell anyone." },
      { by: 'a', say: "And it still floated. That's how good we are." },
    ] },
  ],
};

const cannon = {
  'task-start.any': [
    { id: 'fjs2.mc-s5', when: MC, turns: [
      { beat: '{a} picks up a meatball from the pile, weighs it in one hand, and sniffs it.' },
      { by: 'a', say: "These are real. These are somebody's dinner." },
      { by: 'b', say: "Somebody's dinner is about to fly." },
    ] },
    { id: 'fjs2.mc-s6', when: MC, turns: [
      { by: 'b', say: "Pack them down tight. Loose meatballs go everywhere." },
      { by: 'a', say: "How tight?" },
      { by: 'b', say: "Like you're packing a suitcase for a long holiday." },
    ] },
    { id: 'fjs2.mc-s7', when: MC, turns: [
      { beat: '{a} crouches behind the cannon and looks down the barrel at the target, one eye shut, tongue out in concentration.' },
      { by: 'a', say: "I'm lining it up." },
      { by: 'b', say: "You're lining it up with your tongue." },
    ] },
    { id: 'fjs2.mc-s8', when: MC, turns: [
      { by: 'a', say: "How do I turn it? It weighs as much as a car." },
      { by: 'b', ...V("There's a handle on the side. Wind it, and the front goes up.", "Wind the handle on the side.", "Handle. Side.", "There's a HANDLE on the side! WIND it!", "There's a little handle on the side, wind it and the front goes up.", "The cannon has a handle. Everything has a handle if you look.") },
      { beat: '{a} winds the handle. The front of the cannon goes up, and up, and up, until it\'s pointing at the moon.' },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjs2.mc-f5', when: MC, turns: [
      { beat: 'BOOM. The meatball flies in a long, lazy curve, a seagull dives for it and misses, and it drops straight through the middle of the target.' },
      { by: 'b', say: "It beat the seagull! Our meatball beat a seagull!" },
      { by: 'a', say: "Nothing beats our meatball." },
    ] },
    { id: 'fjs2.mc-f6', when: MC, turns: [
      { by: 'a', say: "Three meatballs. Not four, not two. Three feels right." },
      { beat: 'Three meatballs, one boom, and all three go through the middle of the target together, like a little brown cloud.' },
      { by: 'b', say: "A meatball cloud! Right through the middle!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fjs2.mc-a5', when: MC, turns: [
      { by: 'b', say: "Every shot goes right. Every single one. So aim at the left edge, and let it drift." },
      { by: 'a', say: "Aim wrong on purpose?" },
      { by: 'b', say: "Aim wrong on purpose." },
      { beat: '{a} aims at the left edge. The meatball drifts right, and drops dead through the centre.' },
    ] },
    { id: 'fjs2.mc-a6', when: MC, turns: [
      { beat: 'After five misses, {a} ties a bit of string to the end of the barrel and watches which way it blows before every shot.' },
      { by: 'a', say: "The string says left. Wait. The string says nothing. Now!" },
      { beat: 'BOOM. Through the middle of the target, and the shore crew cheers.' },
      { by: 'b', say: "We beat the wind with a string!" },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fjs2.mc-t4', when: MC, turns: [
      { beat: '{a} is down to the last few meatballs in the pile, and the target out on the fjord has drifted further away.' },
      { by: 'a', say: "It's moving! The target's moving away from me!" },
      { by: 'b', say: "It's not running from you. It's the tide." },
      { by: 'a', say: "It's running from me." },
    ] },
    { id: 'fjs2.mc-t5', when: MC, turns: [
      { by: 'b', say: "That one went sideways. How does a meatball go sideways?" },
      { by: 'a', say: "It was a bad meatball. It had a lump on it." },
      { by: 'b', say: "They've all got lumps! They're meatballs!" },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjs2.mc-x4', when: MC, turns: [
      { beat: 'BOOM. The meatballs come out as one squashed lump, fly about three metres, and land on the deck at {b}\'s feet.' },
      { by: 'b', say: "That one's for me?" },
      { by: 'a', say: "Packed too tight! Reload! Again!" },
    ] },
    { id: 'fjs2.mc-x5', when: MC, turns: [
      { beat: 'The meatball lands right on top of the target and sits there for one proud second, then rolls off into the water.' },
      { by: 'a', say: "It was on it! It was sitting on it!" },
      { by: 'b', say: "On isn't through! Reload!" },
    ] },
  ],
  'task-done.any': [
    { id: 'fjs2.mc-dn4', when: MC, turns: [
      { beat: '{a} pats the side of the cannon, still warm, like a big iron dog.' },
      { by: 'a', say: "Good cannon." },
      { by: 'b', say: "Don't get attached. We can't take it with us." },
    ] },
    { id: 'fjs2.mc-dn5', when: MC, turns: [
      { by: 'b', say: "I'm starving. All I've smelled for an hour is meatballs." },
      { by: 'a', say: "There's one stuck to the mast." },
      { by: 'b', say: "I'm not that starving." },
    ] },
    { id: 'fjs2.mc-dn6', when: MC, turns: [
      { by: 'a', say: "How many did we fire?" },
      { by: 'b', say: "I stopped counting when the fish started following the boat." },
      { by: 'a', say: "Row faster. They'll want more." },
    ] },
  ],
};

export default mergePools(longship, cannon);
