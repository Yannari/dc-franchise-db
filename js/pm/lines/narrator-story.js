// pm/lines/narrator-story.js — the voiceover that leads INTO a story's beat.
// Data only. One sentence or two, BEFORE the scene, so the viewer knows why
// they are watching it: what is happening, and what is at stake. Then it stops.
// No joke on the end (season read 2026-10-30, the user: "less trying too much
// to be clever" — "{a} has decided that's more of a guideline" was the kind of
// line it meant). He knows what the public saw and nothing more. Same cast
// slots as the scene: {a} {b} {c} {d}; facts as the scene's (story, of, subj, why…).
export const NARRATOR_STORY = {
  'graft-eyes': [
    { id: 'nst.eyes.1', turns: [['narrator', "{a} can't stop thinking about {c}. But {c} is coupled up with {d}."]] },
    { id: 'nst.eyes.2', turns: [['narrator', "{c} and {d} are a couple. {a} has feelings for {c}, and is about to say so for the first time."]] },
    { id: 'nst.eyes.3', when: { fresh: true }, turns: [['narrator', "{a} has only been in the villa a day, and already knows who {a.he} wants. It's {c}, and {c} is with {d}."]] },
  ],
  watching: [
    { id: 'nst.watch.1', turns: [['narrator', "Across the garden, {d} has asked {c} for a chat. {a} has seen all of it."]] },
    { id: 'nst.watch.2', turns: [['narrator', "{c} has gone off for a chat with {d}, and {a} is trying not to mind."]] },
  ],
  'where-head': [
    { id: 'nst.wh.1', when: { story: 'graft' }, turns: [['narrator', "Earlier, {b} went off for a chat with {c}. {a} has thought about nothing else since."]] },
    { id: 'nst.wh.2', when: { story: 'graft' }, turns: [['narrator', "{a} has waited all afternoon to ask {b} about {c}. It can't wait any longer."]] },
    { id: 'nst.wh.3', when: { story: 'doubt' }, turns: [['narrator', "{b} has gone quiet on {a} these last few days, and {a} is starting to worry."]] },
    { id: 'nst.wh.4', when: { story: 'doubt' }, turns: [['narrator', "For two days, {a} has been asking the villa what's wrong with {b}. Tonight, {a} asks {b}."]] },
  ],
  'graft-turn': [
    { id: 'nst.turn.1', turns: [['narrator', "{a} has had time to think about {c}. Now {a} has to tell {b} what {a.he}'s decided."]] },
    { id: 'nst.turn.2', turns: [['narrator', "{a} has something to say to {b}, and it isn't going to be easy to hear."]] },
  ],
  'graft-shut': [
    { id: 'nst.shut.1', turns: [['narrator', "{b} has asked {a} for a chat a few times now. {a} has decided this one will be the last."]] },
    { id: 'nst.shut.2', turns: [['narrator', "{a} is with {pa}, and {b} keeps trying anyway. Today, {a} is going to make it clear."]], when: { taken: true } },
  ],
  'feels-off': [
    { id: 'nst.off.1', turns: [['narrator', "{c} has been distant with {a} all day, and {a} doesn't know why."]] },
    { id: 'nst.off.2', turns: [['narrator', "Something is wrong with {c}, and {a} can feel it. {a} goes to {b} for help."]] },
  ],
  'secret-burden': [
    { id: 'nst.burden.1', when: { ago: 'today' }, turns: [['narrator', "{a} saw something earlier, and hasn't told anyone."]] },
    { id: 'nst.burden.3', when: { ago: 'days' }, turns: [['narrator', "{a} has been keeping something to {a.ref} for days, and it's getting harder."]] },
    { id: 'nst.burden.2', turns: [['narrator', "{a} knows something about {c} that {d} doesn't, and it's getting harder to keep quiet."]] },
  ],
  'doubt-end': [
    { id: 'nst.end.1', turns: [['narrator', "Yesterday, {a} and {b} had the talk. Today, {a} has made a decision."]] },
    { id: 'nst.end.2', turns: [['narrator', "{a} has slept on it, and knows what {a.he} has to say to {b}."]] },
  ],
  'pick-chat': [
    { id: 'nst.pick.1', when: { of: 'nobody' }, turns: [['narrator', "There's a recoupling tonight, and {a} is single. If nobody picks {a}, {a.he} goes home."]] },
    { id: 'nst.pick.2', when: { of: ['torn', 'unsure'] }, turns: [['narrator', "There's a recoupling tonight. {a} is coupled up with {pa}, but {a} isn't sure {pa} is the one {a.he} wants to pick."]] },
    { id: 'nst.pick.3', turns: [['narrator', "It's recoupling day, and everyone in the villa is thinking about tonight."]] },
  ],
  'vote-worry': [
    { id: 'nst.vote.1', turns: [['narrator', "Tonight, the public decide who stays. {a} and {b} are trying not to think about it."]] },
    { id: 'nst.vote.2', turns: [['narrator', "The public's votes are already in, and {a} and {b} are worried."]] },
  ],
  'stick-twist': [
    { id: 'nst.stick.1', turns: [['narrator', "Tomorrow, {a} has to choose: stay with {pa}, or start again with {c}."]], when: { taken: true } },
    { id: 'nst.stick.2', turns: [['narrator', "{pa} is in the other villa. {c} is in this one. {a} has to decide by tomorrow."]], when: { taken: true } },
  ],
  'group-chat': [
    { id: 'nst.gc.1', when: { subj: 'found-out' }, turns: [['narrator', "{a} has just found out about {x}, and needs {a.posAdj} friends."]] },
    { id: 'nst.gc.2', when: { subj: 'pulled' }, turns: [['narrator', "{x} pulled {a} for a chat earlier, and the others want to know how it went."]] },
    { id: 'nst.gc.3', when: { subj: 'celebrate' }, turns: [['narrator', "{a} has good news about {x}, and can't wait to tell everyone."]] },
    { id: 'nst.gc.4', when: { subj: ['turned', 'ended'] }, turns: [['narrator', "Today hasn't gone the way {a} hoped with {x}. {a} goes to {a.posAdj} friends."]] },
    { id: 'nst.gc.5', when: { subj: 'spark' }, turns: [['narrator', "Yesterday, {a} and {x} talked for hours, and everyone noticed."]] },
  ],
  'bed-chat': [
    { id: 'nst.bed.1', turns: [['narrator', "Lights out. The villa is quiet, but {a} and {b} are still talking."]] },
    { id: 'nst.bed.2', when: { of: ['after-row', 'distant'] }, turns: [['narrator', "It's been a hard day for {a} and {b}, and now they have to share a bed."]] },
  ],
  vent: [
    { id: 'nst.vent.1', when: { story: 'doubt' }, turns: [['narrator', "Everyone thinks {a} and {pa} are fine. {a} isn't so sure."]] },
  ],
  pull: [
    { id: 'nst.pull.1', when: { story: 'graft', bTaken: true }, turns: [['narrator', "{b} is coupled up with {pb}, but {a} is going to ask for a chat anyway."]] },
    { id: 'nst.pull.2', when: { story: 'spark' }, turns: [['narrator', "{a} and {b} are both single, and they've been circling each other for days."]] },
  ],
  gossip: [
    { id: 'nst.gossip.1', when: { story: 'secret' }, turns: [['narrator', "{a} has decided to tell {b} what {c} has been up to."]] },
  ],
  'deep-chat': [
    { id: 'nst.deep.1', when: { story: 'progress' }, turns: [['narrator', "{a} and {b} have been getting closer, and {a} wants to know more about {b}."]] },
  ],
};
