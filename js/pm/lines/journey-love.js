// pm/lines/journey-love.js — the love stories the final can tell (pm/journey.js
// shapesOf, storyOf), read from what went on between the two of them BEFORE
// they were a couple. Data only.
//
//   shapes    enemies · fought-for · fell-harder · friends
//   chapters  enemies (a row, a clash, a feud between them, before) · friends
//             (the two of them as mates, before) · crush (one wanting the
//             other, not wanted back yet) · fought (the recoupling that chose)
//
// From the show: Ekin-Su and Davide, "a liar and an actress" and then the
// winners (UK 8); Dami and Indiyah, friends until week two (UK 8); Paige and
// Jacques, she fell first and he fell harder (UK 8). A speech is said by
// either of them, so the crush lines never say WHICH one fell first.
const N = (id, of, stage, line, more = {}) => ({ id, when: { of, ...(more.when || {}) }, ...(stage ? { stage } : {}), turns: [['narrator', line], ...(more.turns || [])] });
const Q = { hasQuote: true };

export const JOURNEY_LOVE = {
  'journey-open': [
    { id: 'jo.en1', when: { of: 'enemies' }, stage: 'The film starts, and the first thing on the screen is the two of them arguing.', turns: [['b', "Oh no. Not this."], ['a', "They had to start there, didn't they?"]] },
    { id: 'jo.en2', when: { of: 'enemies' }, stage: 'A screen lights up with their names.', turns: [['a', "Do you remember when you couldn't stand me?"], ['b', "I still can't, some days."], ['a', "Liar."]] },
    { id: 'jo.en3', when: { of: 'enemies' }, turns: [['b', "If you'd told me at the start we'd be here, I'd have laughed at you."], ['a', "You'd have thrown a drink at me."]] },
    { id: 'jo.fo1', when: { of: 'fought-for' }, stage: 'The film begins. It has more than two people in it.', turns: [['a', "Oh, they're showing all of that."], ['b', "Of course they are."]] },
    { id: 'jo.fo2', when: { of: 'fought-for' }, turns: [['b', "It wasn't easy, getting here."], ['a', "Nothing worth having is."]] },
    { id: 'jo.fo3', when: { of: 'fought-for' }, stage: 'A screen lights up. {b} takes {a.posAdj} hand before it starts.', turns: [['b', "Whatever they show, it ended with us."]] },
    { id: 'jo.fh1', when: { of: 'fell-harder' }, stage: 'The film opens on the two of them, and one of them is clearly keener than the other.', turns: [['a', "Look at that. It's so obvious."], ['b', "It really is."]] },
    { id: 'jo.fh2', when: { of: 'fell-harder' }, turns: [['b', "One of us took a while to catch up."], ['a', "And then overtook."]] },
    { id: 'jo.fh3', when: { of: 'fell-harder' }, stage: 'A screen lights up with their names.', turns: [['a', "I'm scared to watch the start of this."], ['b', "The start isn't the good bit."]] },
    { id: 'jo.fr1', when: { of: 'friends' }, stage: 'The film starts with the two of them laughing on the daybeds, weeks before anything happened.', turns: [['b', "We were just friends then."], ['a', "Were we, though?"]] },
    { id: 'jo.fr2', when: { of: 'friends' }, turns: [['a', "Everyone said we'd end up together."], ['b', "Everyone except us."]] },
    { id: 'jo.fr3', when: { of: 'friends' }, stage: 'A photo album with their names on it. The first photos are of the two of them being silly.', turns: [['a', "Look at us. Best friends."], ['b', "Still are."]] },
  ],
  'journey-end': [
    { id: 'je.en1', when: { of: 'enemies' }, turns: [['a', "From that to this."], ['b', "I still think you were wrong, by the way."], ['a', "I know. I love you anyway."]] },
    { id: 'je.en2', when: { of: 'enemies' }, stage: 'The last frame is the two of them kissing, and they both laugh at it.', turns: [['b', "Who'd have thought?"], ['a', "Not you. Not me."]] },
    { id: 'je.en3', when: { of: 'enemies' }, turns: [['b', "We were so horrible to each other."], ['a', "And now look."]], beat: '{b} kisses {a.obj}.' },
    { id: 'je.fo1', when: { of: 'fought-for' }, turns: [['b', "I'd do it all again."], ['a', "Even the rows?"], ['b', "Even the rows. It got me you."]] },
    { id: 'je.fo2', when: { of: 'fought-for' }, stage: 'The film ends on the recoupling, and the choice.', turns: [['a', "That's the moment."], ['b', "That's the one."]] },
    { id: 'je.fh1', when: { of: 'fell-harder' }, turns: [['a', "You were worth waiting for."], ['b', "So were you. I just took longer to see it."]] },
    { id: 'je.fh2', when: { of: 'fell-harder' }, turns: [['b', "I'm all in now. You know that?"], ['a', "I know. I can tell."]] },
    { id: 'je.fr1', when: { of: 'friends' }, turns: [['b', "I don't want to lose my best friend."], ['a', "You won't. You get to keep me as both."]] },
    { id: 'je.fr2', when: { of: 'friends' }, stage: 'The film ends where it began, with the two of them laughing.', turns: [['a', "I think that's why it works. We liked each other first."]] },
  ],
  'journey-clip': [
    N('jc.en1', 'enemies', '{quoteWho}: "{quote}"', "Day {day}. Before any of it, they could barely stand each other.", { when: Q }),
    N('jc.en2', 'enemies', 'The footage: the two of them, face to face, and nobody backing down.', "Day {day}. Not the start anyone would pick for a love story."),
    N('jc.en3', 'enemies', '{quoteWho}: "{quote}"', "Day {day}. If you'd said then they'd end up together, nobody would have believed you.", { when: Q }),
    N('jc.fr1', 'friends', '{quoteWho}: "{quote}"', "Day {day}. Just friends. Or so they said.", { when: Q }),
    N('jc.fr2', 'friends', 'The footage: the two of them laughing together, weeks before anything happened.', "Day {day}. Before anything else, they were friends."),
    N('jc.fr3', 'friends', '{quoteWho}: "{quote}"', "Day {day}. The villa could see it before they could.", { when: Q }),
    N('jc.cr1', 'crush', '{quoteWho}: "{quote}"', "Day {day}. One of them already knew. The other had no idea.", { when: Q }),
    N('jc.cr2', 'crush', 'The footage: one of them trying, the other not quite there yet.', "Day {day}. It wasn't mutual. Not yet."),
    N('jc.cr3', 'crush', '{quoteWho}: "{quote}"', "Day {day}. It took one of them a while to catch up.", { when: Q }),
    N('jc.fo1', 'fought', '{quoteWho}: "{quote}"', "Day {day}. Two people wanted the same person. Only one got picked.", { when: Q }),
    N('jc.fo2', 'fought', 'The footage: the recoupling, and a choice between two.', "Day {day}. The night it was decided."),
  ],
  'journey-react': [
    { id: 'jr.en1', when: { of: 'enemies' }, turns: [['b', "I was so angry with you."], ['a', "You were terrifying."], ['b', "Good."]] },
    { id: 'jr.en2', when: { of: 'enemies' }, turns: [['a', "Can we skip this bit?"], ['b', "No. I want to see how far we've come."]] },
    { id: 'jr.en3', when: { of: 'enemies' }, turns: [['a', "I didn't like you."], ['b', "I know."], ['a', "I really like you now."]] },
    { id: 'jr.fr1', when: { of: 'friends' }, turns: [['a', "We had so much fun, didn't we?"], ['b', "We still do."]] },
    { id: 'jr.fr2', when: { of: 'friends' }, turns: [['b', "Did you like me then? Like that?"], ['a', "A little bit."], ['b', "I knew it."]] },
    { id: 'jr.cr1', when: { of: 'crush' }, turns: [['a', "That's hard to watch."], ['b', "I'm sorry you had to wait."], ['a', "It was worth it."]] },
    { id: 'jr.cr2', when: { of: 'crush' }, turns: [['b', "It took a while, didn't it?"], ['a', "It did. We got there."]] },
    { id: 'jr.fo1', when: { of: 'fought' }, turns: [['a', "I was so nervous that night."], ['b', "You had no reason to be."], ['a', "I didn't know that."]] },
    { id: 'jr.fo2', when: { of: 'fought' }, turns: [['b', "That was the right choice."], ['a', "Best one either of us made."]] },
  ],
  speech: [
    { id: 'sp.en.1', when: { of: 'enemies' }, turns: [['a', "When we first met, we clashed. On day {day} I honestly thought I'd never get on with you. Now I can't imagine a single day without you."]] },
    { id: 'sp.en.2', when: { of: 'enemies' }, turns: [['a', "You're the only person in here who's ever told me I was wrong to my face. I hated it. And then I fell for you."]] },
    { id: 'sp.fr.1', when: { of: 'friends' }, turns: [['a', "You were my best friend in here before you were anything else. I'll never take that for granted."]] },
    { id: 'sp.fr.2', when: { of: 'friends' }, turns: [['a', "We spent weeks being friends. And somewhere along the way I realised the person I wanted to tell everything to was the person I wanted to be with."]] },
    { id: 'sp.cr.1', when: { of: 'crush' }, turns: [['a', "It wasn't love at first sight for both of us. But it's love now, for both of us, and that's what matters."]] },
    { id: 'sp.cr.2', when: { of: 'crush' }, turns: [['a', "One of us had to wait for the other to catch up. I'm so glad we did."]] },
    { id: 'sp.fo.1', when: { of: 'fought' }, turns: [['a', "It wasn't simple. There was a choice to make, and it was us. It will always be us."]] },
    { id: 'sp.fo.2', when: { of: 'fought' }, turns: [['a', "On day {day}, when it came down to it, it was us. Everything since has proved it was right."]] },
  ],
  declaration: [
    { id: 'dec.en1', when: { of: 'enemies' }, stage: '{a} stands up, and laughs before saying a word.', turns: [['a', "{b}, if you'd told me at the start that I'd be standing here saying this to you, I'd have walked out. You drive me mad. And I'm completely in love with you."]] },
    { id: 'dec.en2', when: { of: 'enemies' }, stage: '{a} takes {b}\'s hands.', turns: [['a', "We started off on the wrong foot. Both feet, honestly. But everything since then has been the best thing that's ever happened to me."]], beat: '{b} is laughing and crying at the same time.' },
    { id: 'dec.fo1', when: { of: 'fought-for' }, stage: '{a} stands at the front of the fire pit.', turns: [['a', "It hasn't been easy for us. There were other people in it, and there were hard nights. But every single time, I'd have chosen you."]] },
    { id: 'dec.fo2', when: { of: 'fought-for' }, turns: [['a', "{b}, we had to fight to get here. I'd do it all again tomorrow."]], beat: '{b} squeezes {a.posAdj} hand.' },
    { id: 'dec.fh1', when: { of: 'fell-harder' }, stage: '{a} turns to {b}.', turns: [['a', "It took one of us longer than the other to get here. But we're both here now, all the way, and I'm not going anywhere."]] },
    { id: 'dec.fh2', when: { of: 'fell-harder' }, turns: [['a', "I don't care who fell first. I care that we both fell, and that we're standing here."]], beat: '{b} covers {b.posAdj} face.' },
    { id: 'dec.fr1', when: { of: 'friends' }, stage: '{a} stands up and grins at {b}.', turns: [['a', "{b}, you were my friend first. You made me laugh every single day. And one day I looked at you and realised I didn't just want you as my friend."]] },
    { id: 'dec.fr2', when: { of: 'friends' }, turns: [['a', "Everyone in here saw it before we did. I'm glad they were right."]], beat: 'The fire pit cheers.' },
  ],
};
