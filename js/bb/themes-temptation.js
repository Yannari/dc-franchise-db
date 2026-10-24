// Summer of Temptation (BB19).
//
// The house is offered something every week and the offer is FREE — refusing
// costs nothing, which is the only thing that makes accepting a decision. The
// season's cruelty is the part I had backwards from memory and the wiki
// corrected: the consequence does not land on the person who accepted. Paul
// took the Pendant; Ramses was cursed. That gives a blameless beneficiary, an
// innocent victim, and a house hunting a culprit it cannot identify — and it is
// what every good line below plays on.
//
// This theme is the theme engine's PROOF rather than its showpiece. The Den,
// the powers shelf and the Halting Hex are all already built, so the arc is
// nearly pure composition: if the engine cannot assemble a season out of parts
// we already own, this is the cheapest possible week to find that out.
//
// The Halting Hex is deliberately NOT booked. It is a power (js/bb/powers.js),
// not a schedulable twist card — it has no TWIST_CATALOG entry — so it reaches
// this season the way it reaches any season, as a grant from a distributor.
// Pandora's Box is that distributor, which is why the arc hands it the Hex as
// its prize rather than the default Diamond Veto.
//
// A plain descriptor with no import back to themes.js — see the note there on
// why registration must not be circular.
export default {
  id: 'summer-of-temptation',
  name: 'Summer of Temptation',
  tagline: 'Every week, an offer. Somebody else pays for it.',
  house: 'bb-house',
  // Brass, not red. The season is a warm room you are invited into for five
  // weeks; red is what the escalation brings, and a theme that is red from the
  // premiere has spent its only signal on wallpaper. The reader carries the
  // escalated palette under `.is-mood-hostile`.
  palette: { accent: '#c6a05c', ink: '#f0e6d8', paper: '#120a0c', glow: '#e0a848' },
  fonts: { display: '"Cinzel", Georgia, serif', body: '"Inter", system-ui, sans-serif' },

  // ── the voice ──
  //
  // Every pool is at least four lines, and every pool ends with lines that need
  // no names at all. That is not padding: `themeVoice` walks the pool from a
  // seeded start and steps over anything it cannot fill, so a pool whose lines
  // ALL carry a token can go silent on a sealed-HOH week or a week nobody
  // accepted an offer. The untokenised lines are the floor the walk lands on.
  //
  // The tokens are the point of the antagonist existing. A line that could have
  // been written before the season started is a line the broadcast can already
  // do; `{cursed}` in particular only resolves in a week where somebody really
  // did take something, and it names the person who is paying for it.
  // ── THE PRIMER: this season, explained to the person watching it ──────
  //
  // Everything above this line is written to the next engineer. This block is
  // the same season written to the viewer, and it is the only place they are
  // ever told what a Den is. Keep `rules` true of what the arc actually books.
  primer: {
    what: 'BB19. From the first night the house is tempted, again and again, and every temptation comes '
      + 'with a consequence. Whoever takes it is never named, and somebody else usually pays.',
    who: 'The Den is a room in this house that talks. It never competes, never votes and never lies to '
      + 'anybody; it simply opens a door, makes an offer, and waits. It is patient, it is delighted '
      + 'when somebody says yes, and it has never once paid for anything it handed out.',
    rules: [
      'Night one: twenty-five thousand dollars to the first houseguest to press a button. The taker must '
        + 'throw the first Head of Household, and the money lets a returning houseguest into the game, at the '
        + 'cost of somebody else\'s place.',
      'Three times, America sends one houseguest into the Den of Temptation: the Pendant of Protection, the '
        + 'Ring of Replacement, the Halting Hex. Take it, and the house pays the consequence.',
      'The Halting Hex lets the Temptation Competition in for the next three weeks: opt in, and the winner is safe '
        + 'while last place becomes the third nominee. The first four evicted get one chance to battle back.',
      'Late in the summer, the Tree of Temptation: an apple for whoever reaches the Diary Room first, and '
        + 'nobody knows if it holds a prize or a punishment. And there are Have-Nots all summer long.',
    ],
    watch: 'Watch who says yes early, while saying yes still looks free. Then watch who pays for it, '
      + 'because it is never the same person — and watch the house convict somebody innocent of it.',
    register: {
      neutral: 'Hospitable. The Den offers, and swears the offer costs you nothing.',
      hostile: 'The offers keep coming, and the Den has stopped pretending they are free.',
    },
    turn: {
      headline: 'THE OFFERS STOP BEING FREE',
      body: 'The Den has spent the summer being generous and is finished with it. The same door opens '
        + 'onto the same offer, and from here the price is named out loud — and it is still not the '
        + 'person accepting who pays.',
    },
    announce: [
      'Houseguests, the Den has changed the terms of this week. {detail}',
      'Another door has opened, and this is the rule attached to it. {detail}',
      'The Den has something new for the house. Listen before you decide how dangerous it is. {detail}',
      'You wanted to know what the Den had planned. Here it is. {detail}',
    ],
  },

  antagonist: {
    name: 'The Den',
    mood: 'neutral',
    voice: {
      open: {
        neutral: [
          'Week {week}. The Den is open, and it is not asking twice.',
          'Somebody in this house wants something. Week {week} is where they admit it.',
          'The Den has been patient for {week} weeks. Patience is not a promise.',
          'Week {week}. There is a door, and it is unlocked, and that is all the Den will say.',
          'The offer costs nothing, which is the only reason it is a decision. Week {week}.',
          'Week {week}. Nobody has to walk through. That has never once helped.',
          'The Den does not want a trade. The Den wants a yes. Week {week}.',
        ],
        hostile: [
          'Week {week}. The Den has stopped offering and started collecting.',
          'You have all taken something by now. Week {week} is the invoice.',
          'The Den remembers every yes. Week {week} remembers with it.',
          'Week {week}. Somebody is about to find out what they agreed to.',
          'The door is still open. It is no longer an invitation. Week {week}.',
          'Week {week}. The Den has run out of reasons to be polite about this.',
        ],
      },
      noms: {
        neutral: [
          // The season's thesis, said out loud: the chair belongs to somebody
          // who was never in the room.
          '{cursed} takes a chair {hoh} never offered. Somebody in this house knows why, and it is not {cursed}.',
          '{hoh} named two. The third is {cursed}, and {cursed} was not asked.',
          'Three chairs, two decisions. {cursed} is the one nobody will own.',
          '{hoh} names {nominees}. The Den notes that neither of them was offered anything.',
          '{nominees}. The Den finds it interesting who {hoh} did not name.',
          '{hoh} has chosen {nominees}, which is a choice somebody could have prevented.',
          'On the block: {nominees}. Somewhere in this house is a person who could have stopped that and did not.',
          'Two names read out, and a room full of people relieved it was not the third thing.',
          'The block is set. Nobody in it did anything the Den asked.',
        ],
        hostile: [
          '{cursed} is sitting in a chair that belongs to somebody else. The Den will not be naming them.',
          'The third chair is {cursed}. The Den offered it to a different person entirely, and they said yes.',
          '{hoh} names {nominees}, and the Den did not have to lift a finger.',
          '{nominees}. The Den is enjoying this more than {hoh} is.',
          '{hoh} thinks putting up {nominees} was an original idea. The Den will not argue.',
          'The block is set, and the person who set it is not the person who read it out.',
          'Two of these were chosen. The house may work out which two.',
        ],
      },
      veto: {
        neutral: [
          '{veto} holds a necklace that had to be won. Somewhere in this house is a power nobody competed for at all.',
          '{veto} won something in front of everybody. The Den prefers the other kind.',
          '{veto} has a week. The Den is not in the week business.',
          'The veto has moved. The Den has not.',
          'A necklace changes a week. The Den changes a summer.',
          'Somebody just used a power they earned. How quaint.',
          'The veto is a small door. The Den is a large one.',
        ],
        hostile: [
          // Past tense on purpose: the veto may well have taken the cursed
          // houseguest off the block, and a line that assumes it did not would
          // be wrong on exactly the weeks worth watching.
          '{veto} holds the necklace. {cursed} was never told whose hand filled that chair, and the Den is not about to say.',
          '{veto} may keep the necklace. The Den has already spent something better.',
          'The veto bought somebody a week. The Den is not in the week business.',
          'Use the necklace. The Den will still be here on Thursday.',
          'A ceremony, a speech, a small piece of jewellery. The Den does not hold ceremonies.',
          'Everything in that room was earned. That is what makes it so easy to beat.',
        ],
      },
      finale: {
        neutral: [
          'Three left, and the Den has nothing further to offer. That part is over.',
          'The Den made its offers. {finalists} are what the house did with them.',
          '{finalists}. Every one of them said yes to something to be standing there.',
          'The last night. The Den is only watching now, which it finds it prefers.',
        ],
        hostile: [
          '{finalists}. The Den collected from all three and none of them will say so.',
          'The offers are finished. What was taken is not.',
          'Three chairs, and the Den remembers what each of them cost somebody else.',
          '{finalists} arrive at the end owing a debt to people who are not here.',
        ],
      },
      crown: {
        neutral: [
          '{winner} wins. The Den never made anybody do anything, and would like that on the record before the lights go out.',
          '{winner}. Every door in this house was unlocked all summer. The Den simply stood next to one of them. Goodnight.',
          'The house chose {winner}. The Den chose nobody, took nothing, and got a yes out of almost all of you anyway.',
          '{winner} wins a game that spent twelve weeks asking. The Den will be here next summer, asking again.',
        ],
        hostile: [
          '{winner} wins, and somebody who paid for it is watching from the seats. The Den hopes they are watching closely.',
          '{winner}. Every yes on the way here belonged to somebody, and not always to them. The Den kept every receipt.',
          'The Den got its answer, {winner} got the money, and the two are not the same prize. Goodnight.',
          '{winner} wins. The Den is closing now. It was never locked, and not one of you tried the handle to check.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} leaves without ever being offered anything. The Den considers that a mercy.',
          '{evicted} is gone. The Den keeps the receipt.',
          'The house evicts {evicted}, and somebody in the room exhales for the wrong reason.',
          '{evicted} walks out. The offer stands for everyone else.',
          '{hoh} got exactly the week that was ordered. {evicted} paid for a week somebody else wanted.',
          '{evicted} never found out. Most of them do not.',
          // The margin is the one thing here the house DID rather than a name
          // it holds — a count that close, or that lopsided, is the room
          // telling on itself.
          '{margin}, and every hand that went up went up for a reason somebody else supplied.',
        ],
        hostile: [
          '{evicted} is gone, and the Den notes that nobody has admitted anything yet.',
          '{evicted} leaves. The Den is running out of patience and people.',
          '{evicted} goes out of that door still guessing. The Den could have told them. The Den chose not to.',
          'One down. The person responsible voted with the house and hugged them on the way out.',
          '{evicted} goes {margin}. The Den notes how tidy that is, and how little of it was anybody\'s own idea.',
          '{hoh} will be congratulated for this. The Den will let them have it.',
        ],
      },
    },
  },

  // ── the arc ──
  //
  // The offers escalate and the curse keeps landing on somebody blameless.
  //
  // Week 2 rather than week 1 because the Den needs a house that already has
  // plans worth wrecking. The Have-Nots in week 3 are the cheap price the house
  // CAN see, so the expensive one it cannot see reads by contrast. A second Den
  // is the whole point of the season: it happens again, and the house still
  // cannot name a culprit. Pandora's Box is late on purpose — by then the house
  // has twice watched somebody take something for free, so a box that CHARGES
  // for it reads as the season finally presenting a bill. It is also the
  // distributor that can put the Halting Hex into a pair of hands, which is the
  // BB19 ending.
  //
  // ── WHY THE BACK HALF IS RELATIVE ──
  //
  // The first draft pinned the second Den to week 5 and it read beautifully on
  // the twelve-house season it was written against and nowhere else. An arc
  // that mixes absolute weeks with `fromEnd` weeks has the cast size sitting in
  // the gap between them: on eleven houseguests the Den and the box landed in
  // the same week, on ten the Den and the double eviction, on seven the box
  // opened in WEEK ONE. So everything from the second Den onwards counts back
  // from the finale, which is where those beats actually belong — the bill
  // arrives at the end of the season, not on the fifth Thursday.
  //
  // `themeScheduleEntries` now refuses any act that would land on or before the
  // act meant to precede it, so a season too short for all of this gets the
  // front of the arc in order and is simply missing the tail. Measured across
  // every cast from six to eighteen, and the order never once inverts:
  //
  //   6-8   the opening Den and the Have-Nots. No endgame — a five-week season
  //         has no room for one, and at six there is only ever one Den.
  //   9     + the double eviction. Pandora and the second Den are squeezed out.
  //   10    + Pandora. The second Den is still squeezed out.
  //   11+   the whole arc: two Dens, the Have-Nots, Pandora, the double
  //         eviction, in that order.
  //
  // `fromEnd` is 1-indexed — `fromEnd: 1` IS the final eviction week — and the
  // double eviction sits at 3 deliberately. The engine refuses one below a
  // house of six and the last weeks run 5 -> 4 -> 3, so `fromEnd: 3` is the
  // latest week it can actually fire for any cast size; at `fromEnd` 3 the
  // house is always exactly six. Booking it later would not error, it would
  // silently never happen, which is the worse failure.
  //
  // ── THE HEEL TURN, AUTHORED THREE TIMES ON PURPOSE ──
  //
  // Not redundancy. `advanceThemeArc` sets the mood on an exact week, and one
  // week cannot be right for a three-week season and a fifteen-week one at
  // once. Pinned to the absolute week 6 alone it never fired at all below a
  // nine-house cast — half the authored voice and the whole `is-hostile`
  // reader styling unreachable, silently, which is the same "books later, fires
  // never" failure that moved the double eviction. So: week 6 turns a long
  // season while it still has season left to spend; `fromEnd: 4` turns a
  // middling one before the endgame; `fromEnd: 3` is the floor that always
  // exists, because on a three-week season every week IS the endgame and a Den
  // that never hardens is worse than one that hardens immediately. Setting the
  // mood twice is a no-op, so whichever fires first wins and the rest are free.
  //
  // `'hostile'` is a literal the reader keys on (`is-hostile` in
  // rpBuildBBThemeBeat); renaming it would silently lose the styling and no
  // test would see it.
  arc: [
    // BB19's real running order (user, 2026-10-24: "1:1 of the real show"),
    // from the wiki's Temptations and Game History tables:
    //   night one   the $25,000 button, the returnee it lets in, the BB Swap
    //   day 8       the Den: the Pendant of Protection (a self-nomination)
    //   day 17      the Den: the Ring of Replacement (three Ve-Toads)
    //   day 29      the Den: the Halting Hex (the Temptation Competition,
    //               weeks 5 to 7, which the Den result books itself)
    //   day 30      the Battle Back, for the first four evicted
    //   day 58      a double eviction, eleven to nine
    //   weeks 8-10  the Tree of Temptation
    //   day 79      a double eviction, seven to five
    { at: { week: 1 }, book: 'bb-temptation-premiere' },
    { at: { week: 2 }, book: 'bb-den-of-temptation', options: { offer: 'pendant-of-protection' } },
    { at: { week: 3 }, book: 'bb-den-of-temptation', options: { offer: 'ring-of-replacement' } },
    { at: { week: 4 }, book: 'bb-den-of-temptation', options: { offer: 'halting-hex' } },
    // Day 30 was the night after the third Den: the first four evicted, and
    // only them, fought for the way back in.
    { at: { week: 4 }, alongside: true, book: 'bb-battle-back', options: { battleBackCap: 4 } },

    // The temptations stop being free when the doubles start: a double, three
    // weeks of the Tree, a double. BB19 (seventeen, plus Paul) ran them at a
    // final eleven and a final seven; one house size later here (fromEnd n is
    // a final n+3), because a fourteen-houseguest summer has no week free for
    // a double between the Battle Back and the Tree otherwise.
    // (a proportional backstop, so a short cast still turns before its end)
    { at: { frac: 0.6 }, mood: 'hostile' },
    { at: { fromEnd: 7 }, mood: 'hostile' },
    { at: { fromEnd: 7 }, book: 'bb-double-eviction' },
    { at: { fromEnd: 6 }, book: 'bb-tree-of-temptation' },
    { at: { fromEnd: 5 }, book: 'bb-tree-of-temptation' },
    { at: { fromEnd: 4 }, book: 'bb-tree-of-temptation' },
    { at: { fromEnd: 3 }, book: 'bb-double-eviction' },
  ],

  // BB19 ran Have-Nots every week and had no Block Buster.
  seasonKnobs: { bbHaveNots: 'every-week', bbSafetyMode: 'off' },

  books: ['bb-temptation-premiere', 'bb-den-of-temptation', 'bb-battle-back', 'bb-tree-of-temptation'],
  weights: {},
  bans: [],
  exclusive: [],
};
