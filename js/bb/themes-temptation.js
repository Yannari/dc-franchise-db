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
  palette: { accent: '#c02040', ink: '#f3e8ea', paper: '#1a0a0e', glow: '#ff4d6d' },
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
          '{hoh} thinks {nominees} was their idea. Let them.',
          'The block is set, and the person who set it is not the person who read it out.',
          'Two of these were chosen. The house may work out which two.',
        ],
      },
      veto: {
        neutral: [
          '{veto} holds a necklace they competed for. Somewhere in this house is a power nobody competed for at all.',
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
          '{veto} holds the necklace. {cursed} was never told whose hand put them in that chair, and the Den is not about to say.',
          '{veto} may keep the necklace. The Den has already spent something better.',
          'The veto bought somebody a week. The Den is not in the week business.',
          'Use the necklace. The Den will still be here on Thursday.',
          'A ceremony, a speech, a small piece of jewellery. The Den does not hold ceremonies.',
          'Everything in that room was earned. That is what makes it so easy to beat.',
        ],
      },
      vote: {
        neutral: [
          '{evicted} leaves without ever being offered anything. The Den considers that a mercy.',
          '{evicted} is gone. The Den keeps the receipt.',
          'The house evicts {evicted}, and somebody in the room exhales for the wrong reason.',
          '{evicted} walks out. The offer stands for everyone else.',
          '{hoh} got the week they wanted. {evicted} paid for a week somebody else wanted.',
          '{evicted} never found out. Most of them do not.',
        ],
        hostile: [
          '{evicted} is gone, and the Den notes that nobody has admitted anything yet.',
          '{evicted} leaves. The Den is running out of patience and people.',
          '{evicted} goes out of that door still guessing. The Den could have told them. The Den chose not to.',
          'One down. The person responsible voted with the house and hugged them on the way out.',
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
  // in week 5 is the whole point of the season: it happens again, and the house
  // still cannot name a culprit.
  //
  // The heel turn is week 6, and it is the only non-booking act here — the
  // antagonist stops offering and starts collecting. `'hostile'` is a literal
  // the reader keys on (`is-hostile` in rpBuildBBThemeBeat); renaming it would
  // silently lose the styling and no test would see it.
  //
  // Pandora's Box is late on purpose: by then the house has twice watched
  // somebody take something for free, so a box that CHARGES for it reads as the
  // season finally presenting a bill. It is also the distributor that can put
  // the Halting Hex into a pair of hands, which is the BB19 ending.
  //
  // `fromEnd` is 1-indexed — `fromEnd: 1` IS the final eviction week — and the
  // double eviction sits at 3 rather than 1 or 2 deliberately. The engine
  // refuses a double eviction below a house of six and the last weeks run
  // 5 -> 4 -> 3, so `fromEnd: 3` is the latest week it can actually fire for any
  // cast size. Booking it later would not error; it would silently never
  // happen, which is the worse failure.
  arc: [
    { at: { week: 2 }, book: 'bb-den-of-temptation' },
    { at: { week: 3 }, book: 'bb-have-nots' },
    { at: { week: 5 }, book: 'bb-den-of-temptation' },
    { at: { week: 6 }, mood: 'hostile' },
    { at: { fromEnd: 4 }, book: 'bb-pandoras-box', options: { prize: 'halting-hex' } },
    { at: { fromEnd: 3 }, book: 'bb-double-eviction' },
  ],

  books: ['bb-den-of-temptation', 'bb-pandoras-box'],
  weights: { 'bb-pandoras-box': 1.6, 'bb-prizes-and-punishments': 1.4 },
  bans: [],
  exclusive: [],
};
