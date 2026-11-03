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
      // (Don introduces them the way a host does, "Next up, cousins Silas and Penelope, the Creepy Cousins", not
      // "Silas and Penelope: Creepy Cousins and cousins.", read 2026-11-03)
      { id: 'ci.own', when: { ownIntro: true }, turns: [don('Next up, {a} and {b}, {donLabel}.'), say('a', '{ownA}'), say('b', '{ownB}')] },
      { id: 'ci.own2', when: { ownIntro: true }, turns: [don('Here come {a} and {b}, {donLabel}!'), say('a', '{ownA}'), say('b', '{ownB}')] },
      { id: 'ci.own3', when: { ownIntro: true }, turns: [don('And now, {a} and {b}, {donLabel}.'), say('a', '{ownA}'), say('b', '{ownB}')] },

      // written again 2026-11-03 (the user: "they talk like a bad translation"; four custom teams in one premiere shared
      // two intros, because a name that already says the relationship, "Exes", "Father & Daughter", has no {relTag}, and
      // only two intros did without one): most need only the name, and they say plain things a pair would say to camera
      intro('first', "Meet {a} and {b}, who call themselves the {identity}.",
        say('a', "People always ask what that means. Honestly, it's hard to explain. You kind of have to see us."),
        say('b', "And now everybody's going to see us. So that's good."),
        say('a', "Or really bad. We'll find out.")),
      intro('believe', "Next, {a} and {b}, who tell me they're {identity}, and I've decided to believe them.",
        say('b', "There aren't many {identity} out there. Not like us, anyway."),
        say('a', "We're definitely the loudest ones.")),
      intro('looked-up', "Here come {a} and {b}, the {identity}!",
        say('a', "We've wanted to do this race for years. Years."),
        say('b', "We applied three times."),
        say('a', "And the third time, they finally said yes. So we're not going home early. No way.")),
      intro('trust', "{a} and {b}, the {identity}.",
        say('a', "The thing about us is, we trust each other completely. I know {b} has my back, every single time."),
        say('b', "Most of the time."),
        say('a', "Most of the time. That's still a lot of the time.")),
      intro('whole-thing', "And here are {a} and {b}, who call themselves the {identity}.",
        say('b', "Everybody back home thinks we're crazy for doing this."),
        say('a', "They're probably right."),
        say('b', "But we're going to win anyway. Then they can call us crazy rich.")),
      intro('medium', "Meet {a} and {b}, the {identity}!",
        say('a', "Honestly? We're not the fastest. We're not the strongest."),
        say('b', "But we never give up. Ever. That's our whole thing."),
        say('a', "That, and we argue a lot. But we never give up.")),
      intro('rehearsed', beat('{a} and {b} walk up side by side, perfectly in step.'),
        "{a} and {b}, the {identity}, and they've clearly practised that walk.",
        say('a', "We did practise it. In the car park. A lot of times."),
        say('b', "Worth it, though.")),
      intro('the-best', "{a} and {b}, who say they're 'the best {identity} you'll ever meet.'",
        say('b', "We are."),
        say('a', "We've been doing this together a long time. We know each other inside out."),
        say('b', "Which is good, and also really annoying.")),
      intro('packed', "Meet {a} and {b}, the {identity}. They say being {identity} is the perfect training for this race.",
        say('a', "It is! You have to stay calm, you have to be patient, and you have to know when to run."),
        say('b', "And I still packed for a weekend, so we'll see.")),
      intro('hometown', "Next up, {a} and {b}, the {identity}.",
        say('a', "Back home, everybody knows us. We're kind of a big deal."),
        say('b', "It's a really small town."),
        say('a', "It's a small town, and we're a big deal in it.")),
      intro('business-card', beat('{b} hands Don a business card. Don reads it twice.'),
        "{a} and {b}, and, according to this card, the {identity}.",
        say('b', "We had a hundred of those printed. We've given out four."),
        say('a', "Five, now. It's a start.")),
      intro('nervous', "Here come {a} and {b}, the {identity}!",
        say('b', "I'm so nervous. I didn't sleep at all last night."),
        say('a', "Neither of us did. We just lay there, talking about the race."),
        say('b', "But we're here now. It's happening. Oh my God.")),
      intro('prove', "{a} and {b}, the {identity}.",
        say('a', "A lot of people don't take us seriously. They hear what we're called, and they laugh."),
        say('b', "So we're here to show them."),
        say('a', "We're going to go a long way. Watch.")),
      intro('family-watching', "Meet {a} and {b}, the {identity}!",
        say('a', "Everybody we know is watching this. Everybody."),
        say('b', "No pressure, then."),
        say('a', "No pressure at all. Just don't embarrass us.")),
      intro('money', "And next, the {identity}, {a} and {b}.",
        say('b', "If we win, the first thing I'm doing is paying off my loans. All of them."),
        say('a', "The first thing I'm doing is sleeping for a week."),
        say('b', "Okay. Sleep first. Then the loans.")),
      intro('differences', "Here are {a} and {b}, who call themselves the {identity}.",
        say('a', "We're really different. Like, really different."),
        say('b', "I plan everything. {a} plans nothing."),
        say('a', "And somehow it works. Most of the time.")),
      intro('ready', "{a} and {b}! The {identity}!",
        say('b', "We've been training for months. Running, maps, everything."),
        say('a', "We got lost on the way here, though."),
        say('b', "That doesn't count. The race hadn't started.")),
      intro('rel-first', "Meet {a} and {b}, {relTag}, and the {identity}.",
        say('a', "Doing this together is the craziest thing we've ever done."),
        say('b', "And the best, hopefully."),
        say('a', "Ask me at the end.")),
      intro('rel-know', "Next up, {a} and {b}. {identity}, and {relTag}.",
        say('b', "We know each other better than anybody. That's our secret weapon."),
        say('a', "And our biggest problem."),
        say('b', "Both. It's both.")),
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
        don("{team}, you're {placing}. Is that a good day for {identity}?"),
        { by: 'b', say: "It's a great day." },
        don("Then I'm happy for you, so go and rest!"),
      ] },
      { id: 'ci.mat-proud', when: { custom: true }, turns: [
        don("{placing}, {team}. Your families must be so proud!"),
        { by: 'a', say: "I hope so." },
        don("I'm sure they are! Off you go!"),
      ] },
      { id: 'ci.mat-dance', when: { custom: true }, turns: [
        don("{team}. {placing}. How do {identity} celebrate?"),
        { by: 'b', say: "We have a small dance." },
        don("Then let's see it!"),
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
