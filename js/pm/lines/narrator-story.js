// pm/lines/narrator-story.js — the voiceover that leads INTO a story's beat.
// Data only. The real narrator links (Love Island USA S3E21): "After feeling
// played by Cash, Charlie forms a personal best four-word sentence in order to
// vibe with Alana." One fact that is the cause, then the turn on it, said
// deadpan, BEFORE the scene, so the viewer knows why they are watching it.
// He knows what the public saw and nothing more. Same cast slots as the scene:
// {a} {b} {c} {d}; facts as the scene's (story, of, subj, why…).
export const NARRATOR_STORY = {
  'graft-eyes': [
    { id: 'nst.eyes.1', turns: [['narrator', "Meanwhile, {a} has a plan. The plan is {c}. There is one small problem with the plan, and the problem's name is {d}."]] },
    { id: 'nst.eyes.2', turns: [['narrator', "{c} is coupled up with {d}. {a} has noticed. {a} has decided that's more of a guideline."]] },
    { id: 'nst.eyes.3', when: { fresh: true }, turns: [['narrator', "{a} has been in the villa for about a day, and has already worked out who {a} wants. {a} has also worked out who {a} is going to upset."]] },
  ],
  watching: [
    { id: 'nst.watch.1', turns: [['narrator', "Across the garden, {d} has asked {c} for a chat. {c} has said yes. {a} has seen all of it."]] },
    { id: 'nst.watch.2', turns: [['narrator', "{c} has gone off for a chat with {d}. {a} would like everyone to know {a} is completely relaxed about it."]] },
  ],
  'where-head': [
    { id: 'nst.wh.1', when: { story: 'graft' }, turns: [['narrator', "Earlier, {b} went off for a chat with {c}. {a} has been thinking about nothing else since, and now {a} would like a word."]] },
    { id: 'nst.wh.2', when: { story: 'graft' }, turns: [['narrator', "{a} has had all afternoon to come up with a calm, mature way to ask {b} about {c}. Let's see how calm."]] },
    { id: 'nst.wh.3', when: { story: 'doubt' }, turns: [['narrator', "{b} has been a bit quiet with {a} lately. {a} has noticed. {a} has also noticed that a bit quiet is starting to sound a lot like a lot quiet."]] },
    { id: 'nst.wh.4', when: { story: 'doubt' }, turns: [['narrator', "For two days, {a} has been asking the villa what's wrong with {b}. Tonight {a} tries asking {b}."]] },
  ],
  'graft-turn': [
    { id: 'nst.turn.1', turns: [['narrator', "{a} has had some time to think about {c}. Now {a} has to tell {b} what {a} has been thinking."]] },
    { id: 'nst.turn.2', turns: [['narrator', "{a} has something to say to {b}. Judging by the way {a} is walking, it isn't 'good morning'."]] },
  ],
  'graft-shut': [
    { id: 'nst.shut.1', turns: [['narrator', "{b} has asked {a} for a chat a few times now. {a} has decided this one is going to be the last."]] },
    { id: 'nst.shut.2', turns: [['narrator', "{a} is with {pa}. {b} keeps forgetting. {a} is about to remind {b.obj}, kindly, for the last time."]], when: { taken: true } },
  ],
  'feels-off': [
    { id: 'nst.off.1', turns: [['narrator', "{c} has been a bit off with {a} today. Rather than ask {c}, {a} has decided to ask literally anyone else."]] },
    { id: 'nst.off.2', turns: [['narrator', "Something's up with {c}, and {a} can feel it. {a} is going to get to the bottom of it, via {b}, which is the long way round."]] },
  ],
  'secret-burden': [
    { id: 'nst.burden.1', when: { ago: 'today' }, turns: [['narrator', "{a} saw something earlier, and has been walking around with it ever since. It is getting heavy."]] },
    { id: 'nst.burden.3', when: { ago: 'days' }, turns: [['narrator', "{a} has been sitting on something for days now. It hasn't got any lighter."]] },
    { id: 'nst.burden.2', turns: [['narrator', "{a} knows something about {c} that {d} doesn't. In this villa, that has a shelf life of about an hour."]] },
  ],
  'doubt-end': [
    { id: 'nst.end.1', turns: [['narrator', "Yesterday {a} and {b} had the talk. Today, {a} has made a decision. {b} doesn't know which one yet."]] },
    { id: 'nst.end.2', turns: [['narrator', "{a} has slept on it. {b} has not slept at all."]] },
  ],
  'pick-chat': [
    { id: 'nst.pick.1', when: { of: 'nobody' }, turns: [['narrator', "There's a recoupling tonight, and {a} is single. {a} would like to talk about that, at length, with anyone who'll listen."]] },
    { id: 'nst.pick.2', when: { of: ['torn', 'unsure'] }, turns: [['narrator', "Tonight's recoupling should be easy for {a}. {a} is coupled up with {pa}. And yet."]] },
    { id: 'nst.pick.3', turns: [['narrator', "Recoupling day. The villa is pretending it's a normal day. Nobody has done a normal thing since breakfast."]] },
  ],
  'vote-worry': [
    { id: 'nst.vote.1', turns: [['narrator', "Tonight, the public decide who stays. {a} and {b} are trying very hard not to think about it, and failing together."]] },
    { id: 'nst.vote.2', turns: [['narrator', "The votes are already in. {a} and {b} just don't know which way. Neither, to be fair, does anyone else."]] },
  ],
  'stick-twist': [
    { id: 'nst.stick.1', turns: [['narrator', "Tomorrow, {a} has to choose: stick with {pa}, or twist for {c}. Tonight, {a} has chosen to talk about it until {b} falls asleep."]], when: { taken: true } },
    { id: 'nst.stick.2', turns: [['narrator', "{pa} is in the other villa. {c} is in this one. {a} is in a bit of a situation."]], when: { taken: true } },
  ],
  'group-chat': [
    { id: 'nst.gc.1', when: { subj: 'found-out' }, turns: [['narrator', "{a} has just been told about {x}. The rest of the villa found out about four seconds later."]] },
    { id: 'nst.gc.2', when: { subj: 'pulled' }, turns: [['narrator', "{x} pulled {a} for a chat earlier. The others would like a full report, with timings."]] },
    { id: 'nst.gc.3', when: { subj: 'celebrate' }, turns: [['narrator', "{a} has news. The news has a name, and the name is {x}."]] },
    { id: 'nst.gc.4', when: { subj: ['turned', 'ended'] }, turns: [['narrator', "Today has not gone the way {a} planned. {a} has gone to the people who will say all the right things about {x}."]] },
    { id: 'nst.gc.5', when: { subj: 'spark' }, turns: [['narrator', "Yesterday {a} and {x} had a chat that went on for a very long time. The villa has some questions."]] },
  ],
  'bed-chat': [
    { id: 'nst.bed.1', turns: [['narrator', "Lights out. The villa is quiet, apart from {a} and {b}, who still have a few things to say."]] },
    { id: 'nst.bed.2', when: { of: ['after-row', 'distant'] }, turns: [['narrator', "It's been a long day for {a} and {b}. They're sharing a bed. They are not, technically, sharing the middle of it."]] },
  ],
  vent: [
    { id: 'nst.vent.1', when: { story: 'doubt' }, turns: [['narrator', "Everyone thinks {a} and {pa} are fine. {a} is about to explain to {b} why that's not entirely true."]] },
  ],
  pull: [
    { id: 'nst.pull.1', when: { story: 'graft', bTaken: true }, turns: [['narrator', "{b} is coupled up with {pb}. {a} has decided to ask for a chat anyway. Bold. Possibly a bit too bold."]] },
    { id: 'nst.pull.2', when: { story: 'spark' }, turns: [['narrator', "{a} and {b} are both single, both looking, and both pretending they haven't noticed each other. That ends now."]] },
  ],
  gossip: [
    { id: 'nst.gossip.1', when: { story: 'secret' }, turns: [['narrator', "{a} has decided. {b} is about to find out what {c} has been up to, and {a} is going to be the one who says it."]] },
  ],
  'deep-chat': [
    { id: 'nst.deep.1', when: { story: 'progress' }, turns: [['narrator', "{a} and {b} have been getting serious. The rest of the villa has been getting nosy."]] },
  ],
};
