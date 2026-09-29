// ══════════════════════════════════════════════════════════════════════
// dr/data/jury-beats.js — the Jury of Queer Peers
// ══════════════════════════════════════════════════════════════════════
//
// AS3's rule: the queens the season already sent home come back on finale
// night and decide which two finalists sing for the crown. The law this show
// is built on is that THE ROOM never votes — and these queens are not the
// room. They are already out, they end nobody, and every finalist they are
// voting on has survived the whole season. See js/dr/jury.js for the longer
// version of that argument, which lives next to the ballot itself.
//
// {a} is the juror. {x} is the finalist she voted for, {y} the one she did
// not, and {h} the host.

export const JURY_BEATS = {
  /* ── THE BENCH ── they already came back with the rest of the returned cast,
     two screens earlier, so this is them taking the jury seats, not walking
     through a door a second time. */
  open: [
    "\"Before we go any further,\" the host says, turning to the queens who came back tonight, \"some of you have opinions about this.\" The finalists look at the returned cast, and the returned cast looks straight back.",
    "The host lets the room settle. \"This season, you will not be deciding who lip syncs for the crown,\" he tells the finalists. He nods at the queens he sent home. \"They will.\"",
    "\"Every queen who left this competition left because somebody decided she should.\" The host smiles at the returned cast. \"Tonight they get a turn.\"",
    "Nobody has told the finalists this part. You can see the exact moment each of them works out why the queens who went home were brought back tonight.",
    "\"You have all been judged by me all season,\" the host says to the finalists. \"Tonight you are judged by them, and they were in the room.\"",
  ],
  walk: [
    "{a} gets up from the returned cast and walks to the jury bench in the best thing she owns, and takes her time about it.",
    "{a} takes her seat on the jury, finds the finalist she is here for, and does not look at anybody else.",
    "The room makes a sound as {a} crosses to the jury bench, and {a} enjoys every second of it.",
    "{a} takes the jury seat like somebody who has been waiting weeks for this exact walk.",
    "{a} sits down on the jury, kisses nobody, and folds her hands.",
    "{a} finds her place on the jury bench and crosses her legs like she has been rehearsing it in a hotel mirror.",
    "{a} takes her seat, looks down the line of finalists one at a time, and gives none of them anything.",
    "{a} moves to the jury bench and squeezes the hand of the queen next to her before she sits.",
    "{a} sits down on the jury with a little wave to the finalists that could mean anything.",
  ],
  rule: [
    '"Each of you will cast one vote," the host says to the jury. "The two finalists with the most support will lip sync for the crown. The rest will not."',
    '"One vote each. No discussion, no second round." The host looks down the line of them. "Say who and say why."',
    '"You do not decide the winner," the host tells the jury. "You decide who gets the chance to be one."',
  ],
  /* THE BALLOT, tiered on what actually carried it — js/dr/jury.js decides,
     this only says it out loud. {x} is her vote, {y} the one she passed over. */
  ballot: {
    friend: [
      '"{x}." {a} does not hesitate. "She is my friend and I am not going to pretend to be objective. She held me up in that werk room when nobody else did."',
      '"I am voting with my heart and my heart is {x}." {a} shrugs, entirely unbothered. "Judge me."',
      '"{x}, obviously." {a} grins. "You all know why. Everybody in this room knows why."',
      '"I love {y}. I would die for {x}." {a} spreads her hands. "That is the whole ballot."',
      '"{x} was the first person who was kind to me in there." {a} nods. "You do not forget who that was."',
    ],
    season: [
      '"{x}." {a} says it plainly. "Look at her record, then look at mine, and tell me she has not earned this."',
      '"I am voting on the season, not on the night." {a} nods at {x}. "She was consistent when consistent was hard."',
      '"{x} did it every week. Not once. Every week." {a} looks down the line. "That is what this is supposed to be."',
      '"If we are honest about who played the best season it is {x}, and I do not think it is close."',
      '"{y} had moments. {x} had a SEASON." {a} tilts her head. "Those are different things."',
    ],
    tonight: [
      '"I came in here thinking one thing, and then I watched {x} do that number." {a} exhales. "I am voting for what I just saw."',
      '"{x}. Because that showcase was the best thing anybody has done on this stage all season, including me."',
      '"Everybody keeps talking about résumés." {a} shakes her head. "{x} went out there and ended it. Tonight counts."',
      '"I was not voting for {x} an hour ago." {a} laughs. "Then she performed. So."',
      '"{x} peaked at the exact right moment and I have to respect the timing of that."',
    ],
    circle: [
      '"{x} is one of mine and she has been since week two." {a} shrugs. "I am not going to get shy about it now."',
      '"There were a few of us in there who actually looked after each other." {a} nods at {x}. "She was one. That is my vote."',
      '"People are going to say I voted for my girl." {a} smiles. "I voted for my girl."',
      '"{x} protected me when she did not have to." {a} looks at her. "This is the only way I have to say thank you."',
    ],
    'respect-despite': [
      '"{x} sent me home." {a} lets that sit. "And she was right to. I am still voting for her, and I would like the record to show what that costs me."',
      '"The queen who ended my season is standing right there." {a} nods at {x}. "She also played the best game in this competition. Both things are true."',
      '"I am not going to punish {x} for being better than me." {a} smiles thinly. "Much as I would enjoy it."',
      '"I have thought about this every night since I left." {a} looks at {x}. "It is you. God help me."',
    ],
    'least-worst': [
      '"Honestly? Neither of them was my favourite." {a} shrugs. "{x}. Because somebody has to be."',
      '"I do not have a speech." {a} nods once. "{x}."',
      '"{x}. Ask me tomorrow and you might get a different answer, but you are asking me now."',
      '"It is {x} by a hair, and I want everybody to know it was by a hair."',
    ],
  },
  /* SHE TOOK A LONG TIME ABOUT IT. Drawn only when the ballot was close. */
  agonised: [
    '{a} does not say a name straight away. She looks at both of them long enough that the host starts to say something and then decides not to.',
    '"This is genuinely horrible," {a} says. "I want you all to know I hate this."',
    '{a} opens her mouth twice before anything comes out.',
    '"Can I abstain?" {a} asks. The host says no. {a} nods like she expected that.',
  ],
  /* WHAT THE FINALISTS DO WHILE THEY ARE BEING VOTED ON. */
  watch: [
    '{x} keeps her face perfectly still, which is taking more work than the showcase did.',
    'Somewhere down that line a finalist is counting, and getting a number she does not like.',
    'The finalists are not allowed to react, and every single one of them is reacting.',
    '{y} smiles at the juror who just did not pick her, and the smile is a professional achievement.',
  ],
  tally: [
    '"The votes are in," the host says, and the room stops being a room.',
    'The host takes the ballots and does not read them for a moment, because he knows exactly what that moment is worth.',
    '"Ladies. Your season has spoken."',
  ],
  /* AND THE QUEEN THE JURY DID NOT SEND THROUGH. */
  cut: [
    '"{y}," the host says gently. "Your sisters have not sent you through. You will not be lip syncing for the crown tonight."',
    '"The jury has not chosen you, {y}." The host does not soften it much. "That is the format, and that is the room you played in."',
    '"{y}, you are not singing tonight." The host pauses. "The queens who made that decision are standing right there, and you know all of them."',
  ],
  /* AND THE TWO THE JURY SENT THROUGH. {x} and {z} are the pair. */
  through: [
    '"The two queens your sisters have chosen," the host says, "are {x} and {z}. Ladies, you are lip syncing for the crown."',
    '"{x}. {z}." The host lets both names land. "The jury has spoken. Get ready to fight for it."',
    '"Your season picked you," the host tells {x} and {z}. "Now go and prove it was right."',
  ],
  cutWords: [
    '"Sent home by my own sisters." {y} laughs, and it is almost real. "That is the most Drag Race thing that has ever happened to me."',
    '"I would rather have lost the song." {y} shakes her head. "At least a song you can fight."',
    '"They were in the room with me." {y} nods slowly. "If that is what the room thought, that is what the room thought."',
    '"I am going to be thinking about which ones," {y} says, "for a very long time."',
  ],
};

/** One line, names filled. Shares the shape every other pool in dr/data uses. */
export function juryLine(pool, vars = {}, rng = Math.random, used = null) {
  const list = Array.isArray(pool) ? pool : [];
  if (!list.length) return '';
  const fresh = Array.isArray(used) ? list.filter(l => !used.includes(l)) : list;
  const from = fresh.length ? fresh : list;
  if (from === list && Array.isArray(used)) {
    for (const l of list) {
      const at = used.indexOf(l);
      if (at >= 0) used.splice(at, 1);
    }
  }
  const line = from[Math.floor(rng() * from.length) % from.length];
  if (Array.isArray(used)) used.push(line);
  return String(line).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}
