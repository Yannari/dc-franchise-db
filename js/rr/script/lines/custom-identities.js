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

      // rewritten 2026-10-19 with the premiere ("really robotic and AI"): one of them mostly talks, the other reacts
      intro('first', "{a} and {b}. {identity}, and {relTag}. That's a first for this show.",
        say('a', "Honestly, nobody ever knows what we do. We explain it at parties and people just sort of nod and walk off."),
        say('b', "Then they come back an hour later with questions."),
        say('a', "Good questions, though.")),
      intro('believe', "Next, {a} and {b}, {relTag}. They tell me they're {identity}. I've decided to believe them.",
        say('b', "There aren't many {identity} who do it the way we do it. We might be the only ones, actually."),
        say('a', "We're definitely the loudest ones.")),
      intro('looked-up', "{a} and {b}. {identity}. I had to look it up. I'm still not sure.",
        say('a', "My mum tells people we're dentists. It's just easier for everyone."),
        say('b', "We are not dentists."),
        say('a', "Don't tell her I told you.")),
      intro('trust', "{a} and {b}: {relTag}, and {identity}.",
        say('a', "Being {identity} is all about trust. You have to know the other one's got you, every single time."),
        say('b', "And snacks. It's trust and snacks."),
        say('a', "Mostly trust.")),
      intro('whole-thing', "{a} and {b} are {relTag}. And {identity}. Apparently that's a whole thing.",
        say('b', "It is a whole thing. We've been {identity} since before it was cool."),
        say('a', "It's still not cool."),
        say('b', "We're working on it. This race is part of the plan.")),
      intro('medium', "And the {identity}! {a} and {b}, {relTag}.",
        say('a', "People hear '{identity}' and think it's easy. It's not easy. It's not hard either. It's sort of medium."),
        say('b', "But we are extremely good at medium.")),
      intro('rehearsed', beat('{a} and {b} walk up in perfect step, like they rehearsed it.'),
        "{a} and {b}. {identity}, {relTag}, and clearly rehearsed.",
        say('a', "We practised that walk in the car park. Forty times."),
        say('b', "Thirty-nine. You tripped once.")),
      intro('the-best', "{a} and {b}, {relTag}, who call themselves 'the best {identity} you'll ever meet.'",
        say('b', "We are."),
        say('a', "We're also the only {identity} most people will ever meet, so, technically, yeah. The best.")),
      intro('packed', "{a} and {b}. {identity}. I asked what that has to do with a race around the world. They said 'everything.'",
        say('a', "Everything! It's all the same stuff. Staying calm, being patient, knowing when to run."),
        say('b', "I packed for a weekend, though.")),
      intro('hometown', "{a} and {b}, {relTag}. Self-described {identity}.",
        say('a', "Back home, everybody knows us. We're kind of a big deal."),
        say('b', "Back home is forty people."),
        say('a', "Forty-one. There's a new baby, and she already knows who we are.")),
      intro('business-card', beat('{b} hands Don a business card. Don reads it twice.'),
        "{a} and {b}, {relTag}, and, according to this card, {identity}.",
        say('b', "We had a hundred of those printed. We've given out four."),
        say('a', "Five, now. That's how it starts.")),
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
