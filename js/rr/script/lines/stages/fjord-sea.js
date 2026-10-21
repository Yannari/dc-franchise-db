// Fjord Sea's challenges, stage by stage (js/rr/places/fjord-sea.js `stages`; director.js stageBeats).
//   the longship  the-heap -> the-hull -> mast-and-sail -> the-crossing -> far-shore   (All-In: build it, sail it)
//   the cannon    load-up -> take-aim -> fire -> bullseye                              (Botch or Watch: a fires, b watches)
// A ship that leaks, a mast that falls or a sail on upside down means rowing back and rebuilding; a miss means
// reloading and firing again. The longship captain is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the longship ──
    { id: 'fs.st.hp1', when: at('longship', 'the-heap'), turns: [
      beat('On the stony shore lies a heap of planks, oars, shields and a striped sail, with an instruction sheet that has no words on it.'),
      by('b', "It's just pictures. Little drawings of a man with a hammer."),
      by('a', "Then we do what the little man does."),
    ] },
    { id: 'fs.st.hp2', when: at('longship', 'the-heap'), turns: [
      by('a', "That's a whole ship. In pieces."),
      by('b', "We've built furniture before. How different can it be?"),
      beat('They start sorting the planks into piles.'),
    ] },
    { id: 'fs.st.hl1', when: at('longship', 'the-hull'), turns: [
      beat('Plank by plank, the hull goes together, curving up at both ends like the drawing.'),
      by('b', "It looks like a boat! It actually looks like a boat!"),
      by('a', "Hammer that one in. That's the bit that keeps the water out."),
    ] },
    { id: 'fs.st.hl2', when: at('longship', 'the-hull'), turns: [
      by('a', "Hold this end. I'll do the nails."),
      beat('{b} holds the planks steady while {a} hammers along the side.'),
      by('b', "Don't hit my fingers. Those are my rowing fingers."),
    ] },
    { id: 'fs.st.ms1', when: at('longship', 'mast-and-sail'), turns: [
      beat('They heave the mast upright, slot it into the middle of the hull, and tie off the striped sail.'),
      by('a', "Stripes going across, like the picture."),
      by('b', "It's beautiful. We made a Viking ship."),
    ] },
    { id: 'fs.st.ms2', when: at('longship', 'mast-and-sail'), turns: [
      by('b', "Push! Push it up!"),
      beat('The mast swings up and drops into place with a solid clunk.'),
      by('a', "It's staying up. Don't touch it. Leave it."),
    ] },
    { id: 'fs.st.cs1', when: at('longship', 'the-crossing'), turns: [
      beat('They push the longship off the stones and row out across the cold, flat fjord.'),
      by('a', "It floats! Check the floor. Is the floor dry?"),
      by('b', "Bone dry. Keep rowing."),
    ] },
    { id: 'fs.st.cs2', when: at('longship', 'the-crossing'), turns: [
      by('b', "Row together. In, out. In, out."),
      beat('The wind fills the sail, and the longship picks up speed across the water.'),
      by('a', "We don't even need to row! The sail's doing it!"),
    ] },
    { id: 'fs.st.fr1', when: at('longship', 'far-shore'), turns: [
      beat('The longship scrapes up onto the far shore, and the captain waiting there gives it a long look up and down.'),
      by('b', "Well? Is it a good ship?"),
      beat('The captain knocks on the hull twice, nods, and hands over the tip.'),
    ] },
    { id: 'fs.st.fr2', when: at('longship', 'far-shore'), turns: [
      by('a', "Tip! It's the cannon next."),
      by('b', "I want to keep the ship. Can we keep the ship?"),
      by('a', "We need it for the cannon. So yes, for now."),
    ] },

    // ── the cannon ──
    { id: 'fs.st.ld1', when: at('meatball-cannon', 'load-up'), turns: [
      beat('{a} scoops up a handful of meatballs and packs them down the barrel of the old iron cannon.'),
      by('b', "How many do you put in?"),
      by('a', "All of them, I think. More meatballs, more chance."),
    ] },
    { id: 'fs.st.ld2', when: at('meatball-cannon', 'load-up'), turns: [
      by('a', "They're still warm."),
      by('b', "Don't eat them! They're ammunition!"),
      beat('{a} pushes the meatballs down the barrel with a stick.'),
    ] },
    { id: 'fs.st.am1', when: at('meatball-cannon', 'take-aim'), turns: [
      beat('Far out on the fjord, a round target bobs on the water. {a} squints down the barrel at it.'),
      by('b', "A bit left. No, your left."),
      by('a', "I know which left. Stop helping."),
    ] },
    { id: 'fs.st.am2', when: at('meatball-cannon', 'take-aim'), turns: [
      by('a', "Is the wind blowing that way?"),
      by('b', "I don't know. Lick your finger and hold it up."),
      beat('{a} does, and nudges the cannon a little to the right.'),
    ] },
    { id: 'fs.st.fi1', when: at('meatball-cannon', 'fire'), turns: [
      beat('{a} lights the fuse. The cannon booms, and a cloud of meatballs sails out over the fjord.'),
      by('b', "Look at them go!"),
      beat('They come down right in the middle of the target.'),
    ] },
    { id: 'fs.st.fi2', when: at('meatball-cannon', 'fire'), turns: [
      by('b', "Cover your ears!"),
      beat('BOOM. The meatballs fly in a perfect arc, straight for the target.'),
      by('a', "That's going in. That's definitely going in."),
    ] },
    { id: 'fs.st.be1', when: at('meatball-cannon', 'bullseye'), turns: [
      beat('A meatball punches straight through the middle of the target. The captain on the shore raises a fist.'),
      by('b', "Bullseye! You got a bullseye!"),
      by('a', "Did you see that? Through the middle!"),
    ] },
    { id: 'fs.st.be2', when: at('meatball-cannon', 'bullseye'), turns: [
      by('a', "Tip! Row to the buoy. That's the Chill Zone."),
      by('b', "I'm so proud of you. You and your meatballs."),
      beat('They grab the oars and row for the buoy.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the longship ──
    { id: 'fs.sf.hl1', when: at('longship', 'the-hull'), turns: [
      beat('They step back to look. The hull is curved the wrong way, like a big wooden bowl turned upside down.'),
      by('a', "That's not a boat. That's a roof."),
      by('b', "We put the planks on backwards. All of them."),
    ] },
    { id: 'fs.sf.hl2', when: at('longship', 'the-hull'), turns: [
      by('b', "Why is there a plank left over?"),
      by('a', "There can't be. Check the picture."),
      beat('There\'s a gap in the side of the hull exactly the shape of the plank.'),
    ] },
    { id: 'fs.sf.ms1', when: at('longship', 'mast-and-sail'), turns: [
      beat('The mast wobbles, leans, and crashes down across the hull.'),
      by('b', "Timber!"),
      by('a', "It's not a tree! Don't say timber!"),
    ] },
    { id: 'fs.sf.ms2', when: at('longship', 'mast-and-sail'), turns: [
      by('a', "Why are the stripes going up and down?"),
      by('b', "Because that's how sails go."),
      beat('The captain shakes their head. The sail is on sideways. They take it down and start again.'),
    ] },
    { id: 'fs.sf.cs1', when: at('longship', 'the-crossing'), turns: [
      beat('Halfway across the fjord, water starts bubbling up through the floor of the longship.'),
      by('a', "My feet are wet. Why are my feet wet?"),
      by('b', "We're sinking! Row back! Row back!"),
    ] },
    { id: 'fs.sf.cs2', when: at('longship', 'the-crossing'), turns: [
      by('b', "Is that supposed to come off?"),
      beat('A plank floats away from the side of the ship. The fjord comes in to replace it.'),
      by('a', "Swim! Back to shore! We'll fix it!"),
    ] },

    // ── the cannon ──
    { id: 'fs.sf.ld1', when: at('meatball-cannon', 'load-up'), turns: [
      beat('{a} tips the cannon to load it, and every meatball rolls straight back out onto the deck.'),
      by('b', "They're getting away!"),
      by('a', "Grab them! Grab the meatballs!"),
    ] },
    { id: 'fs.sf.ld2', when: at('meatball-cannon', 'load-up'), turns: [
      by('a', "It's jammed. Something's stuck."),
      by('b', "You put too many in."),
      beat('{a} pulls them all out again, one by one.'),
    ] },
    { id: 'fs.sf.fi1', when: at('meatball-cannon', 'fire'), turns: [
      beat('The cannon booms. The meatballs plop into the water well short of the target, and a fish swims up to eat one.'),
      by('b', "You fed a fish."),
      by('a', "Reload. More gunpowder this time."),
    ] },
    { id: 'fs.sf.fi2', when: at('meatball-cannon', 'fire'), turns: [
      by('b', "Too far left! Way too far!"),
      beat('The meatballs splash down a long way from the target.'),
      by('a', "That was the wind. That was definitely the wind."),
    ] },
    { id: 'fs.sf.fi3', when: at('meatball-cannon', 'fire'), turns: [
      beat('{a} lights the fuse. Nothing happens. Then, very slowly, one meatball rolls out of the barrel and drops in the fjord.'),
      by('a', "That's it? That's all it does?"),
      by('b', "Load it again. Pack it tighter."),
    ] },
  ],
};
