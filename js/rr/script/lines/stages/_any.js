// A stage of a staged challenge with no lines of its own yet (each place's stage lines win: lines/stages/<place>.js).
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    { id: 'stg.ok1', turns: [
      by('a', "That's one part done. Keep going."),
      by('b', "Is it the hard part?"),
      by('a', "Every part is the hard part."),
    ] },
    { id: 'stg.ok2', turns: [
      beat('{a} and {b} get through it and stop for one breath, no more.'),
      by('b', "Next bit. Don't think. Next bit."),
      by('a', "Not thinking. Going."),
    ] },
  ],
  'task-stage.fail': [
    { id: 'stg.f1', turns: [
      beat('It goes wrong, all at once.'),
      by('b', "Back. We go back and do it again."),
      by('a', "I know. I know. Don't say it twice."),
    ] },
    { id: 'stg.f2', turns: [
      by('a', "That was nearly it."),
      by('b', "Nearly isn't it. Again."),
      beat('{a} and {b} go back to the start of that part and try it again.'),
    ] },
  ],
};
