// Geyser Island's challenges, stage by stage (js/rr/places/geyser-island.js `stages`; director.js stageBeats).
//   broken telephone  the-speaker -> the-geysers -> the-local -> phrase-tip                     (All-In: both)
//   Feast             the-shark -> sheeps-head -> the-ram -> the-shot -> clean-plate             (every bite of every dish)
//   Fossil            ice-cave -> find-fossil -> chip -> lift-out -> fossil-out                  (out of the ice without a crack)
// The local at the far side of the geyser field is the place's own (the avatar stands there: js/vp-rr-ep/locals.js).
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── broken telephone ──
    { id: 'gi.st.sp1', when: at('telephone', 'the-speaker'), turns: [
      beat('{a} presses the button on the speaker box, and Don\'s voice crackles out, saying one long phrase in the local language, very slowly and very smugly.'),
      by('b', "Play it again. Play it ten more times."),
      by('a', "Okay. It starts with something like \"smorgle\", and then it gets much worse."),
    ] },
    { id: 'gi.st.sp2', when: at('telephone', 'the-speaker'), turns: [
      by('a', "Let's split it. You remember the first half, and I'll remember the second half."),
      by('b', "That's smart. That's really smart."),
      beat('They play the phrase again, each of them mouthing their own half of it with their eyes shut.'),
    ] },
    { id: 'gi.st.sp3', when: at('telephone', 'the-speaker'), turns: [
      beat('{b} plays the phrase over and over and turns it into a little song, with a tune and everything.'),
      by('b', "If you sing it, it sticks. That's how I learned my times tables."),
      by('a', "You don't know your times tables."),
      by('b', "I know the song, though."),
    ] },
    { id: 'gi.st.gy1', when: at('telephone', 'the-geysers'), turns: [
      beat('They run out into the field, still chanting the phrase, and a geyser blasts a column of boiling water straight up into the air right beside them.'),
      by('a', "Keep saying it! Don't stop saying it!"),
      by('b', "Smorgle... something... I'm saying it! I'm saying most of it!"),
    ] },
    { id: 'gi.st.gy2', when: at('telephone', 'the-geysers'), turns: [
      by('a', "Watch the holes. When it bubbles, it's about to go."),
      beat('A vent bubbles at their feet. They jump sideways just as it erupts, and the steam rolls over them like a warm, wet blanket.'),
      by('b', "It smells like eggs. Why does it smell like eggs?"),
    ] },
    { id: 'gi.st.gy3', when: at('telephone', 'the-geysers'), turns: [
      beat('{a} and {b} zigzag between the geysers, muttering the phrase under their breath, like two people who have both lost their minds at once.'),
      by('a', "Nearly there. Nobody say anything that isn't the phrase."),
      by('b', "Smorgle bjarta hrumpen flissa..."),
    ] },
    { id: 'gi.st.lo1', when: at('telephone', 'the-local'), turns: [
      beat('The local is waiting on the far side of the field, arms folded, listening with a completely blank face.'),
      by('a', "Smorgle bjarta hrumpen flissa, dorna..."),
      by('b', "...blöt!"),
      beat('The local thinks about it for a long moment, then nods.'),
    ] },
    { id: 'gi.st.lo2', when: at('telephone', 'the-local'), turns: [
      by('b', "You say it. You've got the better accent."),
      beat('{a} takes a deep breath and says the whole phrase in one go, in an accent from no country that has ever existed.'),
      beat('The local blinks, and nods slowly.'),
    ] },
    { id: 'gi.st.pt1', when: at('telephone', 'phrase-tip'), turns: [
      beat('The local hands over the tip with a little bow.'),
      by('b', "What did we actually say, though?"),
      by('a', "I don't want to know. If it was rude, I don't want to know."),
    ] },
    { id: 'gi.st.pt2', when: at('telephone', 'phrase-tip'), turns: [
      by('a', "\"Take a helicopter to the national park.\" A helicopter!"),
      by('b', "And it's away from the geysers. This is the best tip we've ever had."),
      beat('They run for the helipad, the phrase still going round and round in their heads.'),
    ] },

    // ── the feast ──
    { id: 'gi.st.sh1', when: at('feast-fossil', 'the-shark'), turns: [
      beat('The first dish is a little cube of fermented shark, pale and wobbly, on a wooden board. The smell arrives a whole second before the plate does.'),
      by('a', "It smells like a swimming pool and a bin had a baby."),
      by('b', "Hold your nose and chew fast."),
      beat('{a} holds {a.posAdj} nose, chews fast, and swallows. One down.'),
    ] },
    { id: 'gi.st.sh2', when: at('feast-fossil', 'the-shark'), turns: [
      by('b', "On three. One, two..."),
      beat('They both eat the shark on two, because waiting for three is too much to ask, and sit very still afterwards.'),
      by('a', "I can feel it looking at me from the inside."),
    ] },
    { id: 'gi.st.hd1', when: at('feast-fossil', 'sheeps-head'), turns: [
      beat('The next dish is half a sheep\'s head, and the sheep is looking straight at them.'),
      by('b', "Why does it still have its eye? Why didn't they take the eye?"),
      by('a', "Just don't look at it, and it won't look at you."),
    ] },
    { id: 'gi.st.hd2', when: at('feast-fossil', 'sheeps-head'), turns: [
      by('a', "It actually tastes like lamb. It's just lamb with a face."),
      by('b', "That's the worst sentence I've ever heard."),
      beat('They pick it clean anyway, every last bit, and carefully don\'t talk about the face.'),
    ] },
    { id: 'gi.st.rm1', when: at('feast-fossil', 'the-ram'), turns: [
      beat('The third dish arrives in a little bowl, and the cook explains what it is, using hand gestures.'),
      by('b', "Is that... are those...?"),
      by('a', "Yes. Don't think about it. Think about a million dollars."),
      beat('They eat them, thinking very hard about a million dollars.'),
    ] },
    { id: 'gi.st.rm2', when: at('feast-fossil', 'the-ram'), turns: [
      by('b', "They're sour. Why are they sour? What did they do to them?"),
      by('a', "Pickled them, I think. Keep chewing. Don't stop chewing."),
      beat('The bowl is empty. Neither of them will ever speak of it again.'),
    ] },
    { id: 'gi.st.so1', when: at('feast-fossil', 'the-shot'), turns: [
      beat('Last of all, the cook pours two little glasses of something clear that smells of liquorice and fire.'),
      by('a', "To the race."),
      by('b', "To the race."),
      beat('They drink. Both of them cough for a full ten seconds.'),
    ] },
    { id: 'gi.st.so2', when: at('feast-fossil', 'the-shot'), turns: [
      by('b', "At least it washes the shark down."),
      by('a', "Nothing washes the shark down. The shark is with me forever now."),
      beat('The glasses go back on the table, empty.'),
    ] },
    { id: 'gi.st.cp1', when: at('feast-fossil', 'clean-plate'), turns: [
      beat('The cook checks every plate and every bowl, finds nothing left on any of them, and hands over the empty platter with the tip.'),
      by('a', "Take this to the Chill Zone? Gladly. Anything to get out of this hut."),
      by('b', "I'm never eating again. Not ever."),
    ] },
    { id: 'gi.st.cp2', when: at('feast-fossil', 'clean-plate'), turns: [
      by('b', "We did it. We ate the whole feast."),
      by('a', "We did. I'm so proud of us, and I feel so ill."),
      beat('They carry the empty platter out of the hut like a trophy.'),
    ] },

    // ── the fossil ──
    { id: 'gi.st.ic1', when: at('feast-fossil', 'ice-cave'), turns: [
      beat('The ice cave is blue all the way through, and so cold that their breath hangs in the air.'),
      by('b', "It's beautiful. It's like being inside a glacier."),
      by('a', "We are inside a glacier. That's why I can't feel my feet."),
    ] },
    { id: 'gi.st.ic2', when: at('feast-fossil', 'ice-cave'), turns: [
      by('a', "We chose the fossil so we wouldn't have to eat a sheep's face."),
      by('b', "And I stand by that choice, even though I can't feel my fingers."),
      beat('They take a pick each and head into the cave.'),
    ] },
    { id: 'gi.st.ff1', when: at('feast-fossil', 'find-fossil'), turns: [
      beat('{a} wipes the frost off the wall with a sleeve, and there, deep in the ice, is the dark curl of a fossil shell.'),
      by('a', "There! It's in there!"),
      by('b', "It's so old. It's older than Don."),
    ] },
    { id: 'gi.st.ff2', when: at('feast-fossil', 'find-fossil'), turns: [
      by('b', "How are we meant to find something inside a wall?"),
      beat('{b} shines a torch into the ice, and a block lights up from inside with a shadowy shape in the middle of it.'),
      by('a', "Like that. You find it like that."),
    ] },
    { id: 'gi.st.cx1', when: at('feast-fossil', 'chip'), turns: [
      beat('{a} chips at the ice around the fossil, tiny tap after tiny tap, while {b} holds the torch.'),
      by('b', "Slowly. Slowly. Pretend it's a bomb."),
      by('a', "Why would you make it sound like a bomb? Now my hands are shaking."),
    ] },
    { id: 'gi.st.cx2', when: at('feast-fossil', 'chip'), turns: [
      by('a', "It's working. The ice is coming away in little flakes."),
      beat('Chip by chip, the block around the fossil gets smaller, and the shell inside gets clearer.'),
      by('b', "Don't stop now. You're so close."),
    ] },
    { id: 'gi.st.cx3', when: at('feast-fossil', 'chip'), turns: [
      beat('{b} takes over with the pick for a while, and finds a crack in the ice that runs right round the fossil.'),
      by('b', "If I tap here, I think it'll just pop out."),
      beat('{b} taps there, and the block pops out.'),
    ] },
    { id: 'gi.st.lf1', when: at('feast-fossil', 'lift-out'), turns: [
      beat('They lift the block between them, very slowly, as if it were made of glass.'),
      by('a', "Got it? Don't drop it."),
      by('b', "I won't drop it if you stop telling me not to drop it."),
    ] },
    { id: 'gi.st.lf2', when: at('feast-fossil', 'lift-out'), turns: [
      by('b', "It's so heavy. How is a shell this heavy?"),
      by('a', "It's mostly ice. The shell is the size of a cookie."),
      beat('They lower it into a sack and wrap it up like a newborn baby.'),
    ] },
    { id: 'gi.st.fo1', when: at('feast-fossil', 'fossil-out'), turns: [
      beat('They come out of the cave into the daylight, holding the fossil between them.'),
      by('a', "Not one crack. Not a single crack."),
      by('b', "Chill Zone. Let's get it there before I trip over something."),
    ] },
    { id: 'gi.st.fo2', when: at('feast-fossil', 'fossil-out'), turns: [
      by('b', "We'll be in a museum. This fossil is going in a museum, and we dug it up."),
      by('a', "You're not going in a museum. The fossil is."),
      beat('They hurry off towards the Chill Zone.'),
    ] },
  ],

  'task-stage.fail': [
    // ── broken telephone ──
    { id: 'gi.sf.sp1', when: at('telephone', 'the-speaker'), turns: [
      by('a', "Say it back to me. Just to check."),
      by('b', "Smoogle... burger... hum... hum... something about a boat?"),
      by('a', "That's not even close. Play it again."),
    ] },
    { id: 'gi.sf.sp2', when: at('telephone', 'the-speaker'), turns: [
      beat('They listen to the phrase twelve times. On the thirteenth, {a} realises they have been practising a completely different word in the middle.'),
      by('a', "Is it \"flissa\" or \"flossa\"?"),
      by('b', "I don't know anymore. Neither of them sounds like a word now."),
    ] },
    { id: 'gi.sf.gy1', when: at('telephone', 'the-geysers'), turns: [
      beat('A geyser goes off right under {a}\'s feet. {a} comes out of the steam soaked from head to toe, with a face like an empty room.'),
      by('b', "What's the phrase? What's your half?"),
      by('a', "It's gone. The geyser blasted it right out of my head."),
    ] },
    { id: 'gi.sf.gy2', when: at('telephone', 'the-geysers'), turns: [
      by('b', "Left! Go left!"),
      beat('{a} goes right, straight into a cloud of steam, and the two of them have to stop and find each other again.'),
      by('a', "Where are you? And what was the third word?"),
    ] },
    { id: 'gi.sf.lo1', when: at('telephone', 'the-local'), turns: [
      by('a', "Smorgle bjarta flumpen hrissa, dorna blöt!"),
      beat('The local shakes their head once, very slowly, and points back across the geyser field to the speaker box.'),
      by('b', "One word! It was one word! We swapped two of them round!"),
    ] },
    { id: 'gi.sf.lo2', when: at('telephone', 'the-local'), turns: [
      beat('{b} gets halfway through the phrase, stops, and starts humming the tune instead.'),
      by('b', "Hm hm hmm-hm, hrumpen, hm hm..."),
      beat('The local is not interested in the tune. They are sent back across the field.'),
    ] },
    { id: 'gi.sf.lo3', when: at('telephone', 'the-local'), turns: [
      by('a', "You start, and I'll finish."),
      beat('{b} starts. {a} finishes. Unfortunately, they both say the middle bit, at the same time, differently.'),
      beat('The local points back at the geysers.'),
    ] },

    // ── the feast ──
    { id: 'gi.sf.sh1', when: at('feast-fossil', 'the-shark'), turns: [
      beat('{a} puts the fermented shark in, chews twice, and then runs out of the hut to give it back to the river.'),
      by('b', "Was it that bad?"),
      by('a', "It was so much worse than the smell. And now there's a new plate of it."),
    ] },
    { id: 'gi.sf.sh2', when: at('feast-fossil', 'the-shark'), turns: [
      by('b', "I can't. I can't put that in my mouth."),
      beat('{b} sneaks the shark onto the floor under the table. The cook sees it, picks it up and puts a fresh piece on the plate.'),
      by('a', "Nice try. Now you have to eat two."),
    ] },
    { id: 'gi.sf.hd1', when: at('feast-fossil', 'sheeps-head'), turns: [
      beat('{b} picks up the sheep\'s head, comes face to face with its eye, and puts it straight back down again.'),
      by('b', "It's still looking at me. I can't eat something that's looking at me."),
      beat('The cook takes the plate away, and brings another one. With another head. Also looking.'),
    ] },
    { id: 'gi.sf.hd2', when: at('feast-fossil', 'sheeps-head'), turns: [
      by('a', "I got the cheek down, but I'm not doing the tongue."),
      by('b', "You have to do the tongue. It's the rule."),
      beat('{a} doesn\'t do the tongue, so the cook brings a new head, tongue and all.'),
    ] },
    { id: 'gi.sf.rm1', when: at('feast-fossil', 'the-ram'), turns: [
      beat('The cook explains what the third dish is. {a} understands, a beat later, and goes very green.'),
      by('a', "No. I can't. Not those."),
      beat('{a} gets one down, and then it comes straight back up. The cook calmly refills the bowl.'),
    ] },
    { id: 'gi.sf.rm2', when: at('feast-fossil', 'the-ram'), turns: [
      by('b', "Okay. I'm doing it. I'm doing it right now."),
      beat('{b} is not doing it. {b} has been holding the spoon in front of {b.posAdj} mouth for a full minute, and the bowl goes back for a fresh one.'),
      by('a', "You were so close. You were a spoon away."),
    ] },
    { id: 'gi.sf.so1', when: at('feast-fossil', 'the-shot'), turns: [
      beat('{a} knocks back the shot, coughs, splutters, and sprays half of it across the table.'),
      by('b', "That doesn't count! Half of it's on me!"),
      beat('The cook pours another one.'),
    ] },
    { id: 'gi.sf.so2', when: at('feast-fossil', 'the-shot'), turns: [
      by('a', "It smells like a candle. Why does a drink smell like a candle?"),
      beat('{a} sips it, which you cannot do with a shot, and the cook takes it away and pours a fresh one to be done properly.'),
      by('b', "All in one go this time. Like a grown-up."),
    ] },

    // ── the fossil ──
    { id: 'gi.sf.ff1', when: at('feast-fossil', 'find-fossil'), turns: [
      by('a', "Is that it? That dark thing?"),
      beat('{a} chips at the dark thing for five minutes, and it turns out to be a rock.'),
      by('b', "That's just a rock. We've been digging out a rock."),
    ] },
    { id: 'gi.sf.ff2', when: at('feast-fossil', 'find-fossil'), turns: [
      beat('{a} and {b} walk the whole length of the cave, wiping frost off the walls, and find nothing but ice and more ice.'),
      by('b', "Maybe a team took the last one."),
      by('a', "There are loads. We're just bad at looking."),
    ] },
    { id: 'gi.sf.cx1', when: at('feast-fossil', 'chip'), turns: [
      beat('{a} swings the pick one tiny bit too hard, and a crack runs straight through the middle of the fossil.'),
      by('a', "No. No, no, no. It's broken."),
      by('b', "We have to find another one. Back to the wall."),
    ] },
    { id: 'gi.sf.cx2', when: at('feast-fossil', 'chip'), turns: [
      by('b', "My hands are so cold that I can't feel the pick."),
      beat('{b} can\'t feel the pick, and it shows. A piece of the shell breaks clean off and skitters across the floor of the cave.'),
      by('a', "It doesn't count if it's broken. We start again."),
    ] },
    { id: 'gi.sf.cx3', when: at('feast-fossil', 'chip'), turns: [
      beat('{a} chips, {b} chips, and on the same tap, from both sides at once, the block splits right down the middle.'),
      by('b', "We broke it together. That's nice, in a way."),
      by('a', "It's not nice in any way."),
    ] },
    { id: 'gi.sf.lf1', when: at('feast-fossil', 'lift-out'), turns: [
      beat('They lift the block out of the wall, and it slides through their gloves, hits the floor and cracks in two.'),
      by('a', "It was so slippy! It's made of ice! Of course it was slippy!"),
      beat('They go back to the wall to find another one.'),
    ] },
    { id: 'gi.sf.lf2', when: at('feast-fossil', 'lift-out'), turns: [
      by('b', "I've got it. I've totally got it."),
      beat('{b} has got it right up until {b.posAdj} foot slides on the icy floor, and then nobody has got it.'),
      by('a', "Is it okay? Tell me it's okay."),
      by('b', "It's in three pieces, so it's not okay."),
    ] },
  ],
};
