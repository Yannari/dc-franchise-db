// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-finds.js — finding an advantage: the search, the find, the feeling
// ══════════════════════════════════════════════════════════════════════
// The user, 2026-10-09: "advantage found, there's no setup, nothing, no animation, just text" (a Vote
// Steal found as two confessional lines). Every find opens with the search ({place} is the venue's
// own secret spot), the viewer raises the item out of the ground after that beat (vp-td-ep/steps.js
// foundStep), and the confessional says what it does and what the finder means to do with it.
// long.adv.found.<ending>: the ending is the engine's own (camp-events.js / advantages.js).

const F = (id, beat, confs, when) => ({ id, place: 'secret', ...(when ? { when } : {}), turns: [{ beat }, ...confs.map(conf => ({ by: 'a', conf }))] });

export default {
  'long.adv.found.votesteal': [
    F('nfd.vs1', "{a} slips away to {place} while everybody else is busy, and starts searching. Wedged out of sight, there is a small sealed tube with a note inside.",
      ["It's a Vote Steal. At a vote, I can take somebody's vote off them and use it myself, which means they don't vote and I vote twice.",
        "I already know whose vote I want. I just have to wait for the night it hurts the most, and keep my face straight until then."]),
    F('nfd.vs2', "{a} is alone {here}, checking the same spot for the third day running. This time there is something there.",
      ["I found a Vote Steal. I can take one person's vote at a vote and use it as my own.",
        "The person I steal it from is going to be furious, and everybody will see me do it, so I have to be sure it's worth the enemy."]),
  ],
  'long.adv.found.extravote': [
    F('nfd.ev1', "{a} wanders off to {place} and starts poking around, mostly out of boredom. Tucked away, there is a small scroll tied with string.",
      ["It's an Extra Vote. At one vote, I get to write a name twice, and nobody is counting on that second vote but me.",
        "In a close vote, that's the whole game. I'm not telling anybody, not even the people I trust most."]),
    F('nfd.ev2', "{a} is alone {here} when {a} notices a loose stone that wasn't loose yesterday. Underneath it, there is a folded note.",
      ["An Extra Vote, so one night I get two votes instead of one.",
        "I keep thinking about who I'd use it on, and the honest answer is whoever is about to beat me."]),
  ],
  'long.adv.found.voteblock': [
    F('nfd.vb1', "{a} searches {here} while the others are at the water. Hidden where nobody would look, there is a small wooden token.",
      ["It's a Vote Block. I can stop one person from voting at a vote, just take their voice away for the night.",
        "It doesn't help me directly, but it can take a vote away from the people coming for me, and that might be enough."]),
  ],
  'long.adv.found.teamswap': [
    F('nfd.ts1', "{a} is alone {here}, digging through a pile of leaves for something to do. Under them, there is a sealed envelope.",
      ["It's a Team Swap. I can move somebody from one team to the other, which is either going to save me or start a war.",
        "I have no idea yet who I'd swap. I just know the person I pick will never forgive me."]),
  ],
  'long.adv.found.safetynopower': [
    F('nfd.sp1', "{a} slips off to {place} before anybody else is up. Tucked away out of sight, there is a small envelope with a rope tied round it.",
      ["It's Safety Without Power. At a vote, I can leave before anybody votes, and nobody can vote for me, but I don't get to vote either.",
        "It's an exit door. I hope I never need it, and I'm so relieved I have it."]),
  ],
  'long.adv.found.solevote': [
    F('nfd.so1', "{a} searches {here} for most of the afternoon and is about to give up when {a} spots something tucked behind a stone.",
      ["It's a Sole Vote. One night, mine is the only vote that counts. Everybody else writes a name, and it doesn't matter.",
        "That's terrifying, because if I use it, everybody knows exactly who sent the person home."]),
  ],
  'long.adv.found.legacy': [
    F('nfd.lg1', "{a} is alone {here} when {a} spots a little bundle hidden where nobody would look. Inside, there is a note and a carved token.",
      ["It's a Legacy Advantage. It does nothing for a while, and then on one night it works like an idol. I have to make it to that night.",
        "If I go home before then, I have to leave it to somebody, so I'd better start thinking about who I trust."]),
  ],
  'long.adv.found.kip': [
    F('nfd.kp1', "{a} searches {here} while camp is busy. Tucked away, there is a scroll with a strange seal on it.",
      ["It's Knowledge is Power. At a vote, I can ask somebody if they have an advantage, and if they do, I take it.",
        "So I need to know who's hiding something, and I need to ask the right person on the right night."]),
  ],
  'long.adv.found.amulet': [
    F('nfd.am1', "{a} is alone {here}, turning over stones, when something glints in the dirt.",
      ["I found an amulet, and somebody else has one too. The fewer of us who still have one, the stronger it gets.",
        "So the people holding the others are the people I need to watch."]),
  ],
  'long.adv.found.secondlife': [
    F('nfd.sl1', "{a} slips away to {place} and searches until {a}'s hands are filthy. Finally, there it is.",
      ["It's a Second Life amulet. If I get voted out, I can challenge somebody to a duel and take their place.",
        "So I'm not out until I've lost twice. That changes how brave I can be."]),
  ],
  'long.adv.found.beware': [
    F('nfd.bw1', "{a} is alone {here} when {a} finds a small box with a warning scrawled on the lid.",
      ["It's a Beware Advantage. It's an idol, but until somebody else finds theirs, I've lost my vote.",
        "So I've got the idol, and I've got a problem, and both of them are in my pocket."]),
  ],
};
