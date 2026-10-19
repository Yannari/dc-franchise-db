// A team already in an alliance, pitching the next team (season read 2026-10-19: a team in a bloc of four opened its
// next pitch with "you two are the only team in this whole race I actually trust"). It says who it's already with
// ({allyTeam}), and the pitch is to join, never to be the only one. A bloc stops at three teams (scenes.js canAlly).
const by = (b, say) => ({ by: b, say });

export default {
  retire: [],
  pools: {
    'alliance-pitch.accepted': [
      { id: 'ab.club', when: { bloc: true }, turns: [
        by('a', "So. We've got a little alliance going with {allyTeam}. We'd like one more."),
        by('c', "Why are you telling us?"),
        by('b', "Because it's not a secret once it's three teams. It's a club."),
        by('d', "Does the club have a name?"),
        by('a', "Not yet. You could help with the name."),
        by('c', "Okay. We're in. But we're picking the name."),
      ] },
      { id: 'ab.family', when: { bloc: true }, turns: [
        by('c', "We know you're with {allyTeam}. Everybody knows."),
        by('a', "Then you know we look after our friends."),
        by('d', "And now you want more friends."),
        by('b', "We want friends who are fast. You're fast."),
        by('c', "And when it's just us lot left at the end?"),
        by('a', "Then it's a race again. Until then, it's a family."),
        by('d', "A weird family. Fine. We're in."),
      ] },
    ],
    'alliance-pitch.trial': [
      { id: 'ab.probation', when: { bloc: true }, turns: [
        by('a', "You've heard about us and {allyTeam}?"),
        by('c', "We've heard."),
        by('b', "There's room for one more. On a trial basis."),
        by('d', "A trial? Like probation?"),
        by('a', "One leg. If nobody stabs anybody in the back, you're in for good."),
        by('c', "That's the strangest job interview I've ever had."),
      ] },
    ],
    'alliance-pitch.refused': [
      { id: 'ab.no-club', when: { bloc: true }, turns: [
        by('a', "We're with {allyTeam}. Want in?"),
        by('c', "With them? No, thank you."),
        by('b', "What's wrong with them?"),
        by('d', "Nothing. That's what worries us."),
        by('a', "That's not a reason."),
        by('c', "It's our reason. Good luck with your club."),
      ] },
    ],
  },
};
