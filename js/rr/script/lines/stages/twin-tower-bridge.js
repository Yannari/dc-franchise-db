// Twin Tower Bridge's challenges, stage by stage (js/rr/places/twin-tower-bridge.js `stages`; director.js stageBeats).
//   the kidnapper    first-note -> battlements -> the-dungeon -> the-guards -> guard-tip   (All-In: both follow the notes)
//   the crown jewel  the-vault -> the-table -> the-pick -> the-light -> real-jewel          (Botch or Watch: a picks, b at the rope)
// A misread note or the wrong guard means back to the last clue; a glass jewel goes back on the table. The tower warden
// is the place's own local.
const at = (taskId, stage) => ({ taskId, stage });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    // ── the kidnapper ──
    { id: 'ttb.st.fn1', when: at('kidnapper', 'first-note'), turns: [
      beat('Pinned to the fortress gate in the fog is a note, written in purple ink: "Where the old guns sleep, your next clue you\'ll keep."'),
      by('b', "The old guns. Cannons?"),
      by('a', "Cannons. Up on the walls. Come on."),
    ] },
    { id: 'ttb.st.fn2', when: at('kidnapper', 'first-note'), turns: [
      by('a', "A masked kidnapper. Leaving riddles. In a castle."),
      by('b', "It's a bit much, isn't it?"),
      beat('They grab a lantern and head inside.'),
    ] },
    { id: 'ttb.st.bt1', when: at('kidnapper', 'battlements'), turns: [
      beat('Up on the battlements, under the moon, a second note is tucked into the mouth of an old cannon.'),
      by('b', "\"Down where the prisoners cry, look for the cell with the open eye.\""),
      by('a', "The dungeon. It's always the dungeon."),
    ] },
    { id: 'ttb.st.bt2', when: at('kidnapper', 'battlements'), turns: [
      by('a', "Something just moved. Over there, on the wall."),
      by('b', "A cloak. Purple trim. That's our kidnapper."),
      beat('By the time they get there, there\'s nothing but another note.'),
    ] },
    { id: 'ttb.st.dg1', when: at('kidnapper', 'the-dungeon'), turns: [
      beat('The dungeon is cold and dripping, and the lantern throws long shadows across rows of empty cells.'),
      by('b', "The cell with the open eye. Look for an eye."),
      by('a', "There. Carved over that door."),
    ] },
    { id: 'ttb.st.dg2', when: at('kidnapper', 'the-dungeon'), turns: [
      by('a', "The last note. It says which guard has our tip."),
      by('b', "\"The guard who stands beside the raven.\""),
      beat('They run back up the stairs towards the courtyard.'),
    ] },
    { id: 'ttb.st.gd1', when: at('kidnapper', 'the-guards'), turns: [
      beat('In the courtyard, a line of royal guards stand in tall fur hats. Not one of them moves. Not one of them blinks.'),
      by('b', "The one by the raven. That one."),
      by('a', "Excuse me. Do you have our tip?"),
      beat('The guard says nothing, but one hand slowly opens.'),
    ] },
    { id: 'ttb.st.gd2', when: at('kidnapper', 'the-guards'), turns: [
      by('a', "They don't move at all. Not even a little."),
      by('b', "Don't try to make them laugh. Just ask for the tip."),
      beat('{a} asks, very politely. The guard\'s hand opens with the tip in it.'),
    ] },
    { id: 'ttb.st.gt1', when: at('kidnapper', 'guard-tip'), turns: [
      beat('The guard holds out the tip without moving a single muscle in their face.'),
      by('b', "Thank you! Thank you so much!"),
      beat('The guard does not respond. They run.'),
    ] },
    { id: 'ttb.st.gt2', when: at('kidnapper', 'guard-tip'), turns: [
      by('a', "Crown jewels next. The jewel vault."),
      by('b', "We are not taking any. Just so you know."),
      by('a', "Not even a little one?"),
    ] },

    // ── the crown jewel ──
    { id: 'ttb.st.vt1', when: at('crown-jewel', 'the-vault'), turns: [
      beat('The jewel vault glitters under a crystal chandelier, and a velvet table is covered in crowns, rings and sceptres.'),
      by('a', "Only one of these is real."),
      by('b', "I can't tell any of them apart. They all look real."),
    ] },
    { id: 'ttb.st.vt2', when: at('crown-jewel', 'the-vault'), turns: [
      by('b', "You pick. I'll stay behind the rope."),
      by('a', "Thanks for the support."),
      beat('{a} steps up to the table.'),
    ] },
    { id: 'ttb.st.tb1', when: at('crown-jewel', 'the-table'), turns: [
      beat('{a} leans over the velvet table, looking at each jewel in turn, close enough to see the scratches.'),
      by('b', "Real gold doesn't scratch easily. Look for scratches."),
      by('a', "That one's scratched. That one's chipped. This one's perfect."),
    ] },
    { id: 'ttb.st.tb2', when: at('crown-jewel', 'the-table'), turns: [
      by('a', "The heavy ones. Glass is lighter, right?"),
      by('b', "I think so. Feel them."),
      beat('{a} lifts each crown, one by one, weighing them in {a.posAdj} hands.'),
    ] },
    { id: 'ttb.st.pk1', when: at('crown-jewel', 'the-pick'), turns: [
      beat('{a} picks up a small gold crown with a single red stone in the middle.'),
      by('a', "This one. It's the least flashy. Real things don't need to show off."),
      by('b', "That's very wise. I hope it's right."),
    ] },
    { id: 'ttb.st.pk2', when: at('crown-jewel', 'the-pick'), turns: [
      by('b', "That one? Really?"),
      by('a', "Trust me. It's this one."),
      beat('{a} carries the crown to the keeper with both hands.'),
    ] },
    { id: 'ttb.st.lt1', when: at('crown-jewel', 'the-light'), turns: [
      beat('The keeper of the jewels holds the crown up to the chandelier. The red stone throws a deep, clear light across the room.'),
      by('b', "Is it real? It looks real."),
      beat('The keeper nods once.'),
    ] },
    { id: 'ttb.st.lt2', when: at('crown-jewel', 'the-light'), turns: [
      by('a', "Please be real. Please."),
      beat('The keeper turns the crown slowly in the light, then gives a small nod.'),
      by('b', "Yes! First try!"),
    ] },
    { id: 'ttb.st.rj1', when: at('crown-jewel', 'real-jewel'), turns: [
      beat('The keeper puts the crown back on its cushion and hands over the tip.'),
      by('b', "You picked the real one! First go!"),
      by('a', "I've always had good taste."),
    ] },
    { id: 'ttb.st.rj2', when: at('crown-jewel', 'real-jewel'), turns: [
      by('a', "\"Walk into the fog.\" That's it? Just walk into the fog?"),
      by('b', "The Chill Zone's in there somewhere. Come on."),
      beat('They head out of the vault and into the foggy street.'),
    ] },
  ],

  'task-stage.fail': [
    // ── the kidnapper ──
    { id: 'ttb.sf.bt1', when: at('kidnapper', 'battlements'), turns: [
      beat('They search every cannon on the battlements. There\'s no note in any of them.'),
      by('a', "Old guns. Maybe it meant old swords."),
      by('b', "Back to the gate. Read it again."),
    ] },
    { id: 'ttb.sf.bt2', when: at('kidnapper', 'battlements'), turns: [
      by('b', "There! The kidnapper!"),
      beat('They chase the purple cloak all the way along the wall, and it turns out to be a flag.'),
      by('a', "It's a flag. We chased a flag."),
    ] },
    { id: 'ttb.sf.dg1', when: at('kidnapper', 'the-dungeon'), turns: [
      beat('They search a cell, then another, then another. None of them has an eye over the door.'),
      by('b', "How many cells are there?"),
      by('a', "Too many. Back to the stairs. We missed one."),
    ] },
    { id: 'ttb.sf.dg2', when: at('kidnapper', 'the-dungeon'), turns: [
      by('a', "The lantern. The lantern's going out."),
      beat('The lantern flickers out. A laugh echoes from somewhere down the corridor.'),
      by('b', "I don't like this. I don't like this at all."),
    ] },
    { id: 'ttb.sf.gd1', when: at('kidnapper', 'the-guards'), turns: [
      beat('{a} walks up to a guard, holds out a hand, and waits. The guard doesn\'t move. No tip.'),
      by('b', "Wrong guard. That's the wrong one."),
      by('a', "How can you tell? They're all the same!"),
    ] },
    { id: 'ttb.sf.gd2', when: at('kidnapper', 'the-guards'), turns: [
      by('b', "Which one's beside the raven?"),
      by('a', "The raven moved! It's flown off!"),
      beat('They have to go back down to the dungeon and read the last note again.'),
    ] },

    // ── the crown jewel ──
    { id: 'ttb.sf.tb1', when: at('crown-jewel', 'the-table'), turns: [
      beat('{a} stares at the table for so long that all the crowns start to look exactly the same.'),
      by('a', "I don't know. I really don't know."),
      by('b', "Just pick one. Go with your gut."),
    ] },
    { id: 'ttb.sf.tb2', when: at('crown-jewel', 'the-table'), turns: [
      by('b', "Don't touch them all! You're leaving fingerprints!"),
      by('a', "How else am I supposed to tell?"),
      beat('The keeper clears their throat and gives {a} a long look.'),
    ] },
    { id: 'ttb.sf.lt1', when: at('crown-jewel', 'the-light'), turns: [
      beat('The keeper holds the crown up to the chandelier, taps the stone, and shakes their head. Glass.'),
      by('a', "But it's the shiniest one!"),
      by('b', "That's why. Real ones aren't that shiny. Put it back."),
    ] },
    { id: 'ttb.sf.lt2', when: at('crown-jewel', 'the-light'), turns: [
      by('a', "This one's definitely real. Look at the size of it."),
      beat('The keeper holds it to the light, and the giant stone glows a bit too green. It\'s painted glass.'),
      by('b', "Too big to be real. Try a smaller one."),
    ] },
  ],
};
