// pm/lines/kiss-round.js — the kisses a kissing challenge is made of
// (pm/kiss-round.js). Data only.
//
//   game-kiss [a, b]  a kisses b. `of`: partner · crush · stir · fun.
//   `game`: snogger (blindfolded boys, the girls choose) · suck-blow · lip-service.
//   {pa} is a's partner (taken), {pb} is b's (bTaken).
export const KISS_ROUND_LINES = {
  'game-kiss': [
    // ── partner: the safe choice ──
    { id: 'gk.p6', when: { of: 'partner' }, stage: '{a} goes straight for {b}. No hesitation.', turns: [['b', "Took you long enough."], ['a', "About two seconds."]], beat: 'The villa cheers, a little disappointed.' },
    { id: 'gk.p7', when: { of: 'partner' }, turns: [['a', "There was only ever going to be one."]], beat: '{b} kisses {a} back, and the villa groans.' },
    { id: 'gk.p1', when: { of: 'partner', game: 'snogger' }, stage: '{a} goes straight for {b}. No hesitation.', turns: [['b', "I knew it was you."], ['a', "Of course it was me."]], beat: 'The villa cheers, a little disappointed.' },
    { id: 'gk.p2', when: { of: 'partner' }, turns: [['a', "Sorry, everyone. I'm boring."], ['b', "You're not boring. You're mine."]] },
    { id: 'gk.p3', when: { of: 'partner', game: 'snogger' }, stage: '{a} kisses {b}, and {b} breaks into a grin under the blindfold.', turns: [['b', "Ten. Easily ten."]], beat: 'Everyone knows exactly who that was.' },
    { id: 'gk.p4', when: { of: 'partner' }, stage: '{a} takes {b} by the hand first, then kisses {b.obj}.', turns: [['a', "Safe choice?"], ['b', "Best choice."]] },
    { id: 'gk.p5', when: { of: 'partner' }, turns: [['a', "I'm not risking anything today."]], beat: '{a} kisses {b}, and the villa groans at how sweet it is.' },
    // ── crush: the one they actually fancy ──
    { id: 'gk.c1', when: { of: 'crush', taken: true }, stage: "{a} walks right past {pa} and kisses {b}.", turns: [['a', "It's a game. It's a game!"]], beat: '{pa} has stopped smiling.' },
    { id: 'gk.c2', when: { of: 'crush', taken: true }, stage: '{a} kisses {b}, and it goes on a lot longer than a challenge needs it to.', turns: [['a', "…What? That's the challenge."]], beat: 'The whole villa turns to look at {pa}.' },
    { id: 'gk.c3', when: { of: 'crush', taken: false }, stage: '{a} goes for {b}, and does not hold back.', turns: [['b', "Well. Hello."], ['a', "I've been waiting all day to do that."]], beat: 'The villa loses its mind.' },
    { id: 'gk.c4', when: { of: 'crush' }, turns: [['a', "I'm not going to lie. I've wanted to do that for a while."], ['b', "I could tell."]], beat: 'The kiss has the whole lawn whooping.' },
    { id: 'gk.c5', when: { of: 'crush', bTaken: true }, stage: '{a} kisses {b}, with {pb} standing right there.', turns: [['b', "Oh my God."]], beat: "{pb} is staring at the floor." },
    { id: 'gk.c6', when: { of: 'crush', game: 'snogger' }, stage: 'Blindfolded, {b} has no idea who it is. The villa does.', turns: [['b', "Whoever that was… wow."]], beat: '{a} walks back to the line, not looking at anyone.' },
    { id: 'gk.c7', when: { of: 'crush' }, stage: '{a} and {b} kiss, and neither of them seems in a hurry to stop.', turns: [['a', "Sorry. Got carried away."], ['b', "Don't be sorry."]] },
    // ── stir: on purpose, to shake a couple ──
    { id: 'gk.s1', when: { of: 'stir', bTaken: true }, stage: '{a} looks straight at {pb}, and then kisses {b}.', turns: [['a', "What? It's only a game."]], beat: '{pb} goes very, very quiet.' },
    { id: 'gk.s2', when: { of: 'stir', bTaken: true }, turns: [['a', "I'm picking {b}. Sorry, {pb}. Not sorry."]], beat: 'There is a gasp from the benches.' },
    { id: 'gk.s3', when: { of: 'stir' }, stage: '{a} takes {a.posAdj} time choosing, and makes sure everyone is watching.', turns: [['a', "I think I'll go with… {b}."]], beat: '{a} is smiling. Nobody else is.' },
    { id: 'gk.s4', when: { of: 'stir', bTaken: true }, stage: '{a} gives {b} a long, deliberate kiss, then glances over at {pb}.', turns: [['a', "Just having fun."]], beat: '{pb} does not think it is fun.' },
    { id: 'gk.s5', when: { of: 'stir' }, turns: [['a', "It's a challenge. Everyone's so sensitive."]], beat: '{a} wipes {a.posAdj} lipstick off {b} in front of everyone, and enjoys every second.' },
    // ── fun: a laugh, no harm ──
    { id: 'gk.f1', when: { of: 'fun' }, stage: '{a} plants a big, silly kiss on {b}.', turns: [['b', "Was that a kiss or a headbutt?"], ['a', "Bit of both."]], beat: 'The villa is in stitches.' },
    { id: 'gk.f2', when: { of: 'fun' }, turns: [['a', "I'm going for the safe option. {b}, you're my friend. Come here."]], beat: 'It is the least romantic kiss of the day, and the funniest.' },
    { id: 'gk.f3', when: { of: 'fun' }, stage: '{a} gives {b} a quick peck and runs back to the line.', turns: [['b', "That's it?"], ['a', "That's all you're getting."]] },
    { id: 'gk.f4', when: { of: 'fun', game: 'snogger' }, stage: '{b} is blindfolded and braced. {a} kisses {b.obj} on the forehead.', turns: [['b', "Who does that? Who kisses a forehead?"]], beat: 'The girls are crying with laughter.' },
    { id: 'gk.f5', when: { of: 'fun' }, turns: [['a', "Right. For the challenge. Nothing more."], ['b', "Nothing more."]], beat: 'They kiss, and both burst out laughing halfway through.' },
  ],
};
