// pm/lines/kiss-round.js — the kisses a kissing challenge is made of
// (pm/kiss-round.js). Data only.
//
//   game-kiss [a, b]  a kisses b. `of`: partner · crush · stir · fun.
//   `game`: snogger (blindfolded boys, the girls choose) · suck-blow · lip-service.
//   {pa} is a's partner (taken), {pb} is b's (bTaken).
export const KISS_ROUND_LINES = {
  // Truth or Dare's truths (challenges-more.js truthOrDare). `of`:
  //   named-coupled [a, b, c]  a is asked who else they'd kiss, and names b, with c (a's partner) listening
  //   named-single  [a, b]     a, single, names b
  //   dodge         [a, b]     a dodges the question, with b (a's partner) watching
  //   partner-only  [a, b]     a's answer is b, a's partner
  //   nobody        [a]        a, single, has nobody to name
  'tod-truth': [
    { id: 'tt.nc1', when: { of: 'named-coupled' }, stage: '{a} picks truth. The card: who in here, apart from your partner, would you most like to kiss?', turns: [['a', "…Honestly? {b}."], ['c', "Wow. Okay."]], beat: '{b} looks pleased.' },
    { id: 'tt.nc2', when: { of: 'named-coupled' }, stage: "{a}'s card asks who {a} would pull if {a} was single.", turns: [['a', "It's got to be {b}."]], beat: '{c} puts {c.posAdj} drink down.' },
    { id: 'tt.nc3', when: { of: 'named-coupled' }, turns: [['a', "Truth. Go on."], ['a', "Who would I go for, apart from {c}? …{b}. Sorry. It's the truth."]], beat: 'The villa gasps. {c} does not say a word.' },
    { id: 'tt.ns1', when: { of: 'named-single' }, stage: '{a} picks truth. Who would you most like to couple up with?', turns: [['a', "{b}. I've never hidden it."], ['b', "Oh. Okay then."]], beat: 'The villa whoops.' },
    { id: 'tt.ns2', when: { of: 'named-single' }, turns: [['a', "You want the truth? It's {b}. It's been {b} for days."]], beat: '{b} goes pink.' },
    { id: 'tt.d1', when: { of: 'dodge' }, stage: '{a} reads the card for a long time.', turns: [['a', "Can I take a dare instead?"], ['b', "Why can't you answer it?"]], beat: '{b} notices.' },
    { id: 'tt.d2', when: { of: 'dodge' }, turns: [['a', "Who would I kiss other than my partner? Nobody. Obviously."], ['b', "You took a long time to say obviously."]] },
    { id: 'tt.d3', when: { of: 'dodge' }, turns: [['a', "I'm not answering that."], ['b', "It's truth or dare. You have to answer."], ['a', "Then I'm not answering it very well."]] },
    { id: 'tt.p1', when: { of: 'partner-only' }, stage: "{a}'s card: who in here would you kiss, apart from your partner?", turns: [['a', "Nobody. It's {b}. It's only ever been {b}."]], beat: '{b} kisses {a} before anyone can say anything.' },
    { id: 'tt.p2', when: { of: 'partner-only' }, turns: [['a', "Easy. {b}. Next question."]], beat: 'The villa groans.' },
    { id: 'tt.n1', when: { of: 'nobody' }, turns: [['a', "Who do I like in here? Honestly, nobody's grabbed me yet."]], beat: 'Somebody on the benches shouts, "Yet!"' },
    { id: 'tt.n2', when: { of: 'nobody' }, stage: '{a} reads the card, and shrugs.', turns: [['a', "I'm still looking. Next."]] },
  ],
  'game-kiss': [
    { id: 'gk.td1', when: { game: 'truth-dare' }, stage: '{a} picks dare. The card: kiss the islander you are most attracted to.', turns: [['a', "Right. Okay."]], beat: '{a} walks straight over to {b}.' },
    { id: 'gk.td2', when: { game: 'truth-dare', of: 'stir' }, stage: "{a} picks dare, and reads it out slowly: kiss somebody else's partner.", turns: [['a', "I think I know exactly who."]], beat: '{a} goes straight for {b}.' },
    // ── partner: the safe choice ──
    { id: 'gk.p6', when: { of: 'partner' }, stage: '{a} goes straight for {b}. No hesitation.', turns: [['b', "Took you long enough."], ['a', "About two seconds."]], beat: 'The villa cheers.' },
    { id: 'gk.p7', when: { of: 'partner' }, turns: [['a', "There was only ever going to be one."]], beat: '{b} kisses {a} back, and the villa groans.' },
    { id: 'gk.p1', when: { of: 'partner', game: 'snogger' }, stage: '{a} goes straight for {b}. No hesitation.', turns: [['b', "I knew it was you."], ['a', "Of course it was me."]], beat: 'The villa cheers.' },
    { id: 'gk.p2', when: { of: 'partner' }, turns: [['a', "Sorry, everyone. I'm boring."], ['b', "You're not boring. You're mine."]] },
    { id: 'gk.p3', when: { of: 'partner', game: 'snogger' }, stage: '{a} kisses {b}, and {b} breaks into a grin under the blindfold.', turns: [['b', "Ten. Easily ten."]], beat: 'Everyone knows who it was.' },
    { id: 'gk.p4', when: { of: 'partner' }, stage: '{a} takes {b} by the hand first, then kisses {b.obj}.', turns: [['a', "Safe choice?"], ['b', "Best choice."]] },
    { id: 'gk.p5', when: { of: 'partner' }, turns: [['a', "I'm not risking anything today."]], beat: '{a} kisses {b}. The villa groans.' },
    // ── crush: the one they actually fancy ──
    { id: 'gk.c1', when: { of: 'crush', taken: true }, stage: "{a} walks right past {pa} and kisses {b}.", turns: [['a', "It's a game. It's a game!"]], beat: '{pa} has stopped smiling.' },
    { id: 'gk.c2', when: { of: 'crush', taken: true }, stage: '{a} kisses {b} for a long time.', turns: [['a', "…What? That's the challenge."]], beat: 'The whole villa turns to look at {pa}.' },
    { id: 'gk.c3', when: { of: 'crush', taken: false }, stage: '{a} goes for {b}, and does not hold back.', turns: [['b', "Well. Hello."], ['a', "I've been waiting all day to do that."]], beat: 'The villa screams.' },
    { id: 'gk.c4', when: { of: 'crush' }, turns: [['a', "I'm not going to lie. I've wanted to do that for a while."], ['b', "I could tell."]], beat: 'The whole lawn whoops.' },
    { id: 'gk.c5', when: { of: 'crush', bTaken: true }, stage: '{a} kisses {b}, with {pb} standing right there.', turns: [['b', "Oh my God."]], beat: "{pb} is staring at the floor." },
    { id: 'gk.c6', when: { of: 'crush', game: 'snogger' }, stage: "{b} is blindfolded and doesn't know who it is. Everyone else does.", turns: [['b', "Whoever that was… wow."]], beat: '{a} walks back to the line, not looking at anyone.' },
    { id: 'gk.c7', when: { of: 'crush' }, stage: '{a} and {b} kiss for a long time.', turns: [['a', "Sorry. Got carried away."], ['b', "Don't be sorry."]] },
    // ── stir: on purpose, to shake a couple ──
    { id: 'gk.s1', when: { of: 'stir', bTaken: true }, stage: '{a} looks straight at {pb}, and then kisses {b}.', turns: [['a', "What? It's only a game."]], beat: '{pb} goes quiet.' },
    { id: 'gk.s2', when: { of: 'stir', bTaken: true }, turns: [['a', "I'm picking {b}. Sorry, {pb}. Not sorry."]], beat: 'There is a gasp from the benches.' },
    { id: 'gk.s3', when: { of: 'stir' }, stage: '{a} takes {a.posAdj} time choosing. Everyone is watching.', turns: [['a', "I think I'll go with… {b}."]], beat: '{a} is smiling. Nobody else is.' },
    { id: 'gk.s4', when: { of: 'stir', bTaken: true }, stage: '{a} kisses {b} for a long time, then looks at {pb}.', turns: [['a', "Just having fun."]], beat: "{pb} isn't laughing." },
    { id: 'gk.s5', when: { of: 'stir' }, turns: [['a', "It's a challenge. Everyone's so sensitive."]], beat: '{a} wipes {a.posAdj} lipstick off {b} in front of everyone.' },
    // ── fun: a laugh, no harm ──
    { id: 'gk.f1', when: { of: 'fun' }, stage: '{a} plants a big, silly kiss on {b}.', turns: [['b', "Was that a kiss or a headbutt?"], ['a', "Bit of both."]], beat: 'The villa is in stitches.' },
    { id: 'gk.f2', when: { of: 'fun' }, turns: [['a', "I'm going for the safe option. {b}, you're my friend. Come here."]], beat: 'Everyone laughs.' },
    { id: 'gk.f3', when: { of: 'fun' }, stage: '{a} gives {b} a quick peck and runs back to the line.', turns: [['b', "That's it?"], ['a', "That's all you're getting."]] },
    { id: 'gk.f4', when: { of: 'fun', game: 'snogger' }, stage: '{b} is blindfolded. {a} kisses {b.obj} on the forehead.', turns: [['b', "Who does that? Who kisses a forehead?"]], beat: 'The girls are crying with laughter.' },
    { id: 'gk.f5', when: { of: 'fun' }, turns: [['a', "Right. For the challenge. Nothing more."], ['b', "Nothing more."]], beat: 'They kiss, and both burst out laughing halfway through.' },
  ],
};
