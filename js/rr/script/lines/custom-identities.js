// A custom identity's own lines (the user, 2026-10-19: "how do u build the custom identities dialogue"). A custom
// identity is a name of the user's own (the Stunt Doubles, the Mall Santas, the Beekeepers), so nothing here may know
// what the name means: these are lines for ANY name, said in the show's rhythm. The comedy is that nobody, Don least
// of all, quite knows what these people do, and that the two of them are completely sure of it. {identity} is the name
// ("Stunt Doubles"), {team} the team ("the Stunt Doubles").
//
// The premiere airs a custom identity's introduction over the relationship ones (write.js tiers), and a team's own
// introduction (`ci.own`, the user's two lines from the Pairs view) over everything.
const don = say => ({ by: 'don', say });
const say = (by, s) => ({ by, conf: s });
const beat = s => ({ beat: s });
const intro = (id, ...turns) => ({ id: `ci.${id}`, when: { custom: true }, turns: turns.map(x => (typeof x === 'string' ? don(x) : x)) });

export const INTROS = {
    'team-intro.any': [
      // the one the user wrote: Don's label, then each of them, to camera
      { id: 'ci.own', when: { ownIntro: true }, turns: [don('{a} and {b}: {donLabel}.'), say('a', '{ownA}'), say('b', '{ownB}')] },

      intro('first', "{a} and {b}. {identity}, and {relTag}. That's a first for this show.",
        say('a', "We get that a lot."),
        say('b', "Mostly from people who then ask us to leave."),
        say('a', "Politely, though. Always politely.")),
      intro('believe', "Next, {a} and {b}, {relTag}. They tell me they're {identity}. I've decided to believe them.",
        say('b', "There are maybe six {identity} in the world who do it the way we do it."),
        say('a', "Four. Two retired."),
        say('b', "One retired. One got very into pottery.")),
      intro('looked-up', "{a} and {b}. {identity}. I had to look it up. I'm still not sure.",
        say('a', "Nobody's sure. That's the beauty of it."),
        say('b', "My mom tells people we're dentists."),
        say('a', "It's easier for everyone.")),
      intro('trust', "{a} and {b}: {relTag}, and {identity}.",
        say('a', "Being {identity} is all about trust."),
        say('b', "And snacks."),
        say('a', "Trust, then snacks."),
        say('b', "Sometimes snacks, then trust.")),
      intro('whole-thing', "{a} and {b} are {relTag}. And {identity}. Apparently that's a whole thing.",
        say('b', "It's the whole thing."),
        say('a', "We've been {identity} since before it was cool."),
        say('b', "It's still not cool. We're working on it.")),
      intro('medium', "And the {identity}! {a} and {b}, {relTag}.",
        say('a', "People hear '{identity}' and think it's easy."),
        say('b', "It's not easy."),
        say('a', "It's not hard either. It's medium. But we are extremely good at medium.")),
      intro('rehearsed', beat('{a} and {b} walk up in perfect step, like they rehearsed it.'),
        "{a} and {b}. {identity}, {relTag}, and clearly rehearsed.",
        say('a', "We practised the walk in the parking lot."),
        say('b', "Forty times."),
        say('a', "Thirty-nine. You tripped once.")),
      intro('the-best', "{a} and {b}, {relTag}, who call themselves 'the best {identity} you'll ever meet.'",
        say('b', "We are."),
        say('a', "We're the only {identity} most people ever meet. So, technically."),
        say('b', "Technically the best. I'll take technically.")),
      intro('packed', "{a} and {b}. {identity}. I asked what that has to do with a race around the world. They said 'everything.'",
        say('a', "Everything."),
        say('b', "Nobody is ready for us."),
        say('a', "Including us. I packed for a weekend.")),
      intro('hometown', "{a} and {b}, {relTag}. Self-described {identity}.",
        say('a', "Back home, everybody knows us."),
        say('b', "Back home is forty people."),
        say('a', "Forty-one. There's a new baby. She already knows us.")),
      intro('business-card', beat('{b} hands Don a business card. Don reads it twice.'),
        "{a} and {b}. {relTag}. And, according to this card, {identity}.",
        say('b', "We had a hundred printed."),
        say('a', "We've given out three."),
        say('b', "Four now. Don's got one. That's how it starts.")),
    ],
};

export default {
  retire: [],
  pools: {

    // Don at the mat, to a team he can't place
    'don-place.plain': [
      { id: 'ci.mat-afraid', when: { custom: true }, turns: [
        don("{team}. {placing}. I still don't know what {identity} do, and at this point I'm afraid to ask."),
        { by: 'a', say: "Mostly this." },
        don("Then you're very good at it. Go sit."),
      ] },
      { id: 'ci.mat-scale', when: { custom: true }, turns: [
        don("{team}, you're {placing}. Is that good for {identity}? Is there a scale?"),
        { by: 'b', say: "There's a scale." },
        don("I don't want to hear about the scale."),
      ] },
      { id: 'ci.mat-proud', when: { custom: true }, turns: [
        don("{placing}, {team}. Your families must be so proud. Or confused. Probably confused."),
        { by: 'a', say: "Mostly confused." },
        don("Same as me. Off you go."),
      ] },
      { id: 'ci.mat-dance', when: { custom: true }, turns: [
        don("{team}. {placing}. Do {identity} celebrate? Please say no."),
        { by: 'b', say: "We have a small dance." },
        don("Keep it small. Keep it over there."),
      ] },
    ],

    // the other team, at a team nobody has heard of
    'trash-talk.exchange': [
      { id: 'ci.tt-made-up', when: { customB: true }, turns: [
        { by: 'a', say: "{identityB}. Is that a job, or did you make it up?" },
        { by: 'c', say: "We made it up. And now it's a job." },
        { by: 'd', say: "Which is more than you can say." },
        { by: 'b', say: "That's... honestly kind of impressive." },
        { by: 'a', say: "Don't be impressed. We're racing them." },
        { by: 'c', say: "You can race us and be impressed. Lots of people manage both." },
      ] },
      { id: 'ci.tt-forecast', when: { customB: true }, turns: [
        { by: 'a', say: "Nobody's ever heard of {identityB}." },
        { by: 'c', say: "Give it a week. Everybody's going to hear about {identityB}." },
        { by: 'b', say: "Is that a threat?" },
        { by: 'd', say: "It's a forecast." },
        { by: 'a', say: "A forecast of what?" },
        { by: 'c', say: "You'll know it when you see it. You'll be behind us, so you'll see it." },
      ] },
      { id: 'ci.tt-explain', when: { customB: true }, turns: [
        { by: 'a', say: "Explain {identityB} to me. Slowly." },
        { by: 'c', say: "No." },
        { by: 'd', say: "If you have to ask, you'll never get it." },
        { by: 'b', say: "We're going to be here a while, then." },
        { by: 'c', say: "Fine. It's like what you do, except we're good at it." },
        { by: 'a', say: "We don't do anything." },
        { by: 'd', say: "Exactly." },
      ] },
    ],
  },
};
