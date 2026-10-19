// js/social/packs/ridonculous-race-voices.js
// The alumni hosts, watching the race.
//
// Twelve DELIVERIES, the same twelve js/social/voices.js derives from a host's
// canonical profile, each given the two moments a race is watched for most: a
// team winning a leg and a team going home. A column read down has to sound
// like one person; the same people on the other shows live in their packs, and
// the voices must not bleed.
//
// `s` is one of the team. THERE IS NO VOTE: a team is eliminated for reaching
// the Chill Zone last, never voted out, and nobody lives in a house.

export const HOST_TAKES = {
  // Short. Stops talking. The joke is that there is no joke.
  deadpan: {
    'leg-won': [
      ({ s }) => `${s} got there first. The mat was very welcoming.`,
      () => `First place. Same airport tomorrow. Slightly earlier.`,
      ({ s }) => `${s} won a leg. The other teams are thrilled for them.`,
      () => `They read the tip and did what it said. Revolutionary.`,
      () => `A good cab, a fast challenge, no tears. Boring. Effective.`,
    ],
    'race-out': [
      ({ s }) => `${s} came last. The mat was very understanding.`,
      () => `One taxi. One leg. One very long flight home.`,
      ({ s }) => `${s} is out. The Chill Zone is slightly quieter.`,
      () => `Don did the serious face. It works every time.`,
      () => `Last team in. Last team out. Tidy.`,
    ],
  },
  // Everything is the greatest thing that has ever happened.
  theatrical: {
    'leg-won': [
      ({ s }) => `${s} hit that mat like the curtain had just gone up. Magnificent.`,
      () => `First place! Somebody cue the orchestra and a slow-motion replay!`,
      ({ s }) => `${s} ran that leg like the final scene of an epic. I wept.`,
      () => `A victory lap around half the planet. Iconic. Unrepeatable. Until next week.`,
      () => `That was not a leg win. That was a performance, and I want tickets.`,
    ],
    'race-out': [
      ({ s }) => `${s}, gone! The tragedy! The airport delay that broke a dynasty!`,
      () => `Last to the mat, and the whole world went quiet. A true final act.`,
      ({ s }) => `I will be thinking about ${s} walking onto that mat for weeks. Weeks!`,
      () => `Exit, pursued by a taxi meter. Devastating.`,
      () => `Some teams leave. That team made an exit.`,
    ],
  },
  // Says it straight, then stops.
  blunt: {
    'leg-won': [
      ({ s }) => `${s} won because they didn't waste time. Simple.`,
      () => `Best team on the day. No argument.`,
      ({ s }) => `${s} read the tip properly. Half of them don't.`,
      () => `Fast at the challenge, fast at the airport. That's the whole job.`,
      () => `They earned it. Next.`,
    ],
    'race-out': [
      ({ s }) => `${s} got the wrong cab and paid for it.`,
      () => `Slowest team on the day. That's the rule.`,
      ({ s }) => `${s} argued for twenty minutes at a challenge. That's the leg.`,
      () => `Bad leg. Out. It happens.`,
      () => `They knew it was coming an hour before the mat.`,
    ],
  },
  // Measured, complete sentences, a little old-fashioned.
  formal: {
    'leg-won': [
      ({ s }) => `I would like to commend ${s} on a thoroughly well-run leg.`,
      () => `The first team to the mat made no errors of any consequence today.`,
      ({ s }) => `${s} displayed a discipline the other teams would do well to study.`,
      () => `One should not underestimate the value of reading the tip in full.`,
      () => `A deserved result, achieved without fuss. Quite right.`,
    ],
    'race-out': [
      ({ s }) => `It is with regret that we say goodbye to ${s}.`,
      () => `The last team to the mat conducted themselves with dignity to the end.`,
      ({ s }) => `${s} was let down by the transport rather than by any lack of effort.`,
      () => `An elimination is never pleasant, and this one was handled well.`,
      () => `I wish them every success in whatever they choose to do next.`,
    ],
  },
  // Kind first, always.
  warm: {
    'leg-won': [
      ({ s }) => `Oh, I'm so happy for ${s}. They really needed that one.`,
      () => `Did you see them hug on the mat? That's the best part of this show.`,
      ({ s }) => `${s} has worked so hard for this. Good for them.`,
      () => `First place, and they still stopped to thank the crew. Lovely people.`,
      () => `A leg win is a lovely thing to share with someone you trust.`,
    ],
    'race-out': [
      ({ s }) => `I'm so sad to see ${s} go. They were kind to everybody.`,
      () => `That hug on the mat. They'll be friends for life after this.`,
      ({ s }) => `${s} should be really proud. That was a brave race.`,
      () => `Going home together is still going home together. That matters.`,
      () => `I hope they got to see something beautiful before the end.`,
    ],
  },
  // Every result is a lesson in leverage.
  manipulative: {
    'leg-won': [
      ({ s }) => `${s} just became the team everybody follows. That's useful, if you're clever about it.`,
      () => `Win a leg and every other team starts doing you favours. Watch.`,
      ({ s }) => `If I were ${s}, I'd lose a little time on purpose next leg. Targets get hit.`,
      () => `The real prize is the head start. The money is a distraction.`,
      () => `Now they have something to offer. I'd start trading.`,
    ],
    'race-out': [
      ({ s }) => `${s} never made a single friend who'd hold a cab for them. That's the lesson.`,
      () => `Last place is what happens when nobody owes you anything.`,
      ({ s }) => `${s} trusted the wrong team at the airport. I could have told them.`,
      () => `You don't need to be fast if somebody else is slower. They forgot that.`,
      () => `The other teams were relieved. Relief is a kind of debt.`,
    ],
  },
  // Worried for everybody, all the time.
  nervous: {
    'leg-won': [
      ({ s }) => `${s} won, which is great, but now everybody's watching them, which is terrifying.`,
      () => `First place is lovely. First place also means first to the scary challenge.`,
      ({ s }) => `I'm thrilled for ${s}. I'm also worried about the next airport.`,
      () => `They did so well! I hope nobody gets jealous. People get jealous.`,
      () => `A leg win! Okay. Okay, good. What's next? Is it heights? Please don't be heights.`,
    ],
    'race-out': [
      ({ s }) => `Oh no. Oh, ${s}. I felt that taxi ride in my chest.`,
      () => `I couldn't watch the last bit. I watched it through my fingers.`,
      ({ s }) => `${s} going out like that is my actual nightmare.`,
      () => `Every time Don does the pause I forget how to breathe.`,
      () => `I'm so sorry for them. I'd have panicked at the first airport.`,
    ],
  },
  // EVERYTHING IS AMAZING.
  excitable: {
    'leg-won': [
      ({ s }) => `${s} WON THE LEG! Did you SEE that run?`,
      () => `First place! The mat! The jump! I'm out of breath and I didn't even race!`,
      ({ s }) => `${s} was flying today! Flying!`,
      () => `That challenge took them two minutes! TWO!`,
      () => `Best leg of the season, I'm calling it, I'll call it again next week!`,
    ],
    'race-out': [
      ({ s }) => `No! Not ${s}! They were so fun!`,
      () => `That was SO close! One cab! One!`,
      ({ s }) => `I really thought ${s} would sprint it! I was on my feet!`,
      () => `The pause before Don said it! I screamed at my television!`,
      () => `They'll be back. I believe it. They have to come back!`,
    ],
  },
  // It is always, somehow, about them.
  boastful: {
    'leg-won': [
      ({ s }) => `${s} won the leg the way I would have. Quickly, and looking good.`,
      () => `I won legs like that all the time. Honestly, it's nice to see it done properly.`,
      ({ s }) => `${s} clearly studied my season. You can tell.`,
      () => `First place is my natural habitat. Welcome to it.`,
      () => `Good leg. Not my best leg ever, but good.`,
    ],
    'race-out': [
      ({ s }) => `${s} should have asked me for advice. I'd have had them in a different cab.`,
      () => `I never came last. Not once. Just saying.`,
      ({ s }) => `I feel for ${s}. It's hard being on a show without me on it.`,
      () => `That airport? I'd have been on the earlier flight. Easily.`,
      () => `They'll learn. Some of us didn't need to.`,
    ],
  },
  // Says the opposite of what it means, and means it.
  sarcastic: {
    'leg-won': [
      ({ s }) => `Oh good, ${s} won. Now we'll never hear the end of it.`,
      () => `First place. Shocking. Truly nobody saw that coming. Except everybody.`,
      ({ s }) => `${s} read the tip correctly. Somebody give them a medal. Oh wait, there's a prize.`,
      () => `A leg win. Wonderful. I'm sure they'll be very humble about it.`,
      () => `Fast team is fast. Groundbreaking television.`,
    ],
    'race-out': [
      ({ s }) => `${s} got in the slow cab. Bold strategy.`,
      () => `Last place. What a fun surprise for the team that argued for an hour.`,
      ({ s }) => `I'm sure ${s} will take it very calmly. On camera. Forever.`,
      () => `Don did the face. Riveting. Never seen it before.`,
      () => `Great leg for everybody else, though.`,
    ],
  },
  // Knows how it works on the street, and says so.
  streetwise: {
    'leg-won': [
      ({ s }) => `${s} worked the airport. Asked the right people, got the right seats. That's how it's done.`,
      () => `You win legs by talking to locals, not by running faster.`,
      ({ s }) => `${s} knew which cab driver to trust. That's a skill.`,
      () => `They didn't panic in the crowd. Half the teams panic in the crowd.`,
      () => `Street smart beats fast every single time.`,
    ],
    'race-out': [
      ({ s }) => `${s} trusted a map over a person. That's how you end up last.`,
      () => `Never get in the first cab at the rank. Everybody knows that.`,
      ({ s }) => `${s} didn't ask anybody for directions. Pride's expensive out there.`,
      () => `They lost it at the airport, with the wrong queue. Classic.`,
      () => `The race is won on the pavement. They stayed on the map.`,
    ],
  },
  // Sees signs in everything.
  mystical: {
    'leg-won': [
      ({ s }) => `${s} was meant to win this leg. You could feel it at the start line.`,
      () => `The road opened up for them today. That doesn't happen by accident.`,
      ({ s }) => `There was something in the air around ${s}. Something lucky.`,
      () => `First to the mat. The stars must have been very busy.`,
      () => `Some teams are carried by the journey. That one was today.`,
    ],
    'race-out': [
      ({ s }) => `${s}'s journey was always going to end somewhere beautiful. It just ended early.`,
      () => `The road decides. Today it decided against them.`,
      ({ s }) => `I sensed it at the airport. ${s} was out of step with the day.`,
      () => `Every leg ends for somebody. The race is a circle.`,
      () => `They'll find what they were looking for. It just isn't on the mat.`,
    ],
  },
};
