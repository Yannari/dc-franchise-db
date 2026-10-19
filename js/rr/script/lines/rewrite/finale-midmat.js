// The finale's halfway mat (season read 2026-10-19). The first two teams there race on to the finish; the third is
// cut there, and often only reaches it after the race is already over. Nobody here has placed, nobody is "safe", and
// nobody "arrived last": Don says where they are. write.js sends a scene played at the halfway mat (data.midmat) to
// these pools and nowhere else. {placing} is first or second.
const don = say => ({ by: 'don', say });

export default {
  retire: [],
  pools: {
    'don-place.midmat': [
      { id: 'fm.p1', turns: [
        don("{team}! You're the {placing} team to reach the halfway mat."),
        { by: 'a', say: "Is that good?" },
        don("It means you're still in it. The finish line is that way. Go!"),
      ] },
      { id: 'fm.p2', turns: [
        don("{team}, {placing} to the halfway mat. Don't stop. Don't hug me. Run."),
        { by: 'b', say: "Can we at least have some water?" },
        don("There's water at the finish. Go!"),
      ] },
      { id: 'fm.p3', turns: [
        { beat: '{a} and {b} skid onto the halfway mat, gasping.' },
        don("{placing} to the halfway mat, {team}! Keep moving. The million dollars isn't on this mat."),
        { by: 'a', say: "Then where is it?" },
        don("Further. It's always further."),
      ] },
    ],
    'don-elim.midmat': [
      { id: 'fm.e1', turns: [
        don("{team}. The other teams came through this halfway mat a long time ago."),
        { by: 'a', say: "How long ago?" },
        don("Long enough. Your race ends here, at the halfway mat. I'm sorry."),
        { by: 'b', say: "We made the final. Nobody thought we'd make the final." },
      ] },
      { id: 'fm.e2', turns: [
        { beat: "{a} and {b} run onto the halfway mat. Don is waiting alone, and he isn't smiling." },
        don("{team}, you're the last team to reach the halfway mat, and this is where your race ends."),
        { by: 'a', say: "So close." },
        don("Closer than anybody else this season. Except two."),
        { by: 'b', say: "...Thanks, Don." },
      ] },
      { id: 'fm.e3', turns: [
        don("{team}, welcome to the halfway mat. I have some news, and it isn't good."),
        { by: 'b', say: "We're out, aren't we?" },
        don("You're out. Third, in the whole race. Out of all of them. That's not nothing."),
        { by: 'a', say: "It feels like nothing." },
        don("Give it a week."),
      ] },
    ],
  },
};
