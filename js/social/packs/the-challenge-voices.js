// js/social/packs/the-challenge-voices.js
// The alumni hosts, watching The Challenge.
//
// Twelve DELIVERIES, the same twelve js/social/voices.js derives from a host's
// canonical profile, each given the two moments the show is watched for most:
// somebody winning the daily and somebody going home from the Arena. A column
// read down has to sound like one person; the same people on the other shows
// live in their packs, and the voices must not bleed.
//
// `s` is the player. Nobody is "voted out": the house votes people into the
// Arena, and whoever loses the Arena goes home. There is no jury.

export const HOST_TAKES = {
  // Short. Stops talking. The joke is that there is no joke.
  deadpan: {
    'daily-won': [
      ({ s }) => `${s} won the daily. The house is suddenly very friendly.`,
      () => `Safe for a week. Same house. Slightly better mood.`,
      ({ s }) => `${s} won. The losers are thrilled for them.`,
      () => `They ran fast and did not fall off anything. Revolutionary.`,
      () => `A daily win. Next week, a target. Tidy.`,
    ],
    'arena-out': [
      ({ s }) => `${s} lost the Arena. The sand was very understanding.`,
      () => `One vote. One game. One very long flight home.`,
      ({ s }) => `${s} is out. The house is slightly quieter.`,
      () => `TJ did the serious face. It works every time.`,
      () => `In the Arena. Out of the season. Efficient.`,
    ],
  },
  // Everything is the greatest thing that has ever happened.
  theatrical: {
    'daily-won': [
      ({ s }) => `${s} took that daily like the curtain had just gone up. Magnificent.`,
      () => `A daily win! Somebody cue the orchestra and a slow-motion replay!`,
      ({ s }) => `${s} finished that challenge like the final scene of an epic. I wept.`,
      () => `Victory, safety and power in one afternoon. Iconic.`,
      () => `That was not a daily. That was a performance, and I want tickets.`,
    ],
    'arena-out': [
      ({ s }) => `${s}, gone! The tragedy! The house vote that broke a dynasty!`,
      () => `The Arena lights went down and the whole season held its breath.`,
      ({ s }) => `I will be thinking about ${s} walking out of that Arena for weeks. Weeks!`,
      () => `Exit, pursued by an elimination beast. Devastating.`,
      () => `Some players leave. That one made an exit.`,
    ],
  },
  // Says it straight, then stops.
  blunt: {
    'daily-won': [
      ({ s }) => `${s} was the best on the day. Simple.`,
      () => `Fastest and strongest. No argument.`,
      ({ s }) => `${s} didn't panic in the water. Half of them did.`,
      () => `Won it. Safe. Now don't waste the vote.`,
      () => `They earned it. Next.`,
    ],
    'arena-out': [
      ({ s }) => `${s} drew a bad game and lost it. That's the Arena.`,
      () => `Weaker on the day. That's the rule.`,
      ({ s }) => `${s} had no friends at the vote. That's how you end up in there.`,
      () => `Bad night. Out. It happens.`,
      () => `They knew it the second the votes were read.`,
    ],
  },
  // Measured, complete sentences, a little old-fashioned.
  formal: {
    'daily-won': [
      ({ s }) => `I would like to commend ${s} on a thoroughly well-run daily.`,
      () => `The winners made no errors of any consequence today.`,
      ({ s }) => `${s} displayed a discipline the rest of the house would do well to study.`,
      () => `One should not underestimate the value of a calm start.`,
      () => `A deserved result, achieved without fuss. Quite right.`,
    ],
    'arena-out': [
      ({ s }) => `It is with regret that we say goodbye to ${s}.`,
      () => `The loser of the Arena conducted themselves with dignity to the end.`,
      ({ s }) => `${s} was let down by the house vote rather than by any lack of effort.`,
      () => `An elimination is never pleasant, and this one was handled well.`,
      () => `I wish them every success in whatever they choose to do next.`,
    ],
  },
  // Kind first, always.
  warm: {
    'daily-won': [
      ({ s }) => `Oh, I'm so happy for ${s}. They really needed that one.`,
      () => `Did you see them hug at the finish? That's the best part of this show.`,
      ({ s }) => `${s} has worked so hard for this. Good for them.`,
      () => `They won, and they still helped the last person out of the water. Lovely.`,
      () => `A win is a lovely thing to share with people you trust.`,
    ],
    'arena-out': [
      ({ s }) => `I'm so sad to see ${s} go. They were kind to everybody in that house.`,
      () => `That hug in the Arena. They'll be friends for life after this.`,
      ({ s }) => `${s} should be really proud. That was a brave fight.`,
      () => `Losing an Arena isn't losing respect. Everybody saw how hard they went.`,
      () => `I hope they come back stronger. I really do.`,
    ],
  },
  // Every result is a lesson in leverage.
  manipulative: {
    'daily-won': [
      ({ s }) => `${s} just became the person everybody needs at the vote. That's useful, if you're clever.`,
      () => `Win a daily and the whole house starts doing you favours. Watch.`,
      ({ s }) => `If I were ${s}, I'd throw the next daily. Winners get targeted.`,
      () => `The real prize is the vote. The safety is a distraction.`,
      () => `Now they have something to offer. I'd start trading.`,
    ],
    'arena-out': [
      ({ s }) => `${s} never made a friend who'd vote somebody else in. That's the lesson.`,
      () => `The Arena is what happens when nobody owes you anything.`,
      ({ s }) => `${s} trusted the wrong alliance at the pool. I could have told them.`,
      () => `You don't need to be strong if somebody else looks stronger. They forgot that.`,
      () => `The house was relieved. Relief is a kind of debt.`,
    ],
  },
  // Worried for everybody, all the time.
  nervous: {
    'daily-won': [
      ({ s }) => `${s} won, which is great, but now everybody's watching them, which is terrifying.`,
      () => `A daily win is lovely. It's also a target painted on your back.`,
      ({ s }) => `I'm thrilled for ${s}. I'm also worried about the next vote.`,
      () => `They did so well! I hope nobody gets jealous. People get jealous in that house.`,
      () => `A win! Okay. Okay, good. Is the next daily in the water? Please don't be water.`,
    ],
    'arena-out': [
      ({ s }) => `Oh no. Oh, ${s}. I felt that Arena in my chest.`,
      () => `I couldn't watch the end. I watched it through my fingers.`,
      ({ s }) => `${s} going home like that is my actual nightmare.`,
      () => `Every time TJ pauses I forget how to breathe.`,
      () => `I'm so sorry for them. I'd have panicked at the house vote.`,
    ],
  },
  // EVERYTHING IS AMAZING.
  excitable: {
    'daily-won': [
      ({ s }) => `${s} WON THE DAILY! Did you SEE that?`,
      () => `The finish! The jump! I'm out of breath and I didn't even compete!`,
      ({ s }) => `${s} was flying today! Flying!`,
      () => `That daily took them four minutes! FOUR!`,
      () => `Best daily of the season, I'm calling it, I'll call it again next week!`,
    ],
    'arena-out': [
      ({ s }) => `No! Not ${s}! They were so fun!`,
      () => `That was SO close! One second! One!`,
      ({ s }) => `I really thought ${s} would win it! I was on my feet!`,
      () => `The pause before TJ said it! I screamed at my television!`,
      () => `They'll be back. I believe it. They have to come back!`,
    ],
  },
  // It is always, somehow, about them.
  boastful: {
    'daily-won': [
      ({ s }) => `${s} won the daily the way I would have. Quickly, and looking good.`,
      () => `I won dailies like that all the time. Nice to see it done properly.`,
      ({ s }) => `${s} clearly studied my season. You can tell.`,
      () => `First place is my natural habitat. Welcome to it.`,
      () => `Good daily. Not my best daily ever, but good.`,
    ],
    'arena-out': [
      ({ s }) => `${s} should have asked me for advice. I never lost an Arena.`,
      () => `I never got thrown in. Not once. Just saying.`,
      ({ s }) => `I feel for ${s}. It's hard being on a show without me on it.`,
      () => `That game? I'd have finished it before TJ finished explaining it.`,
      () => `They'll learn. Some of us didn't need to.`,
    ],
  },
  // Says the opposite of what it means, and means it.
  sarcastic: {
    'daily-won': [
      ({ s }) => `Oh good, ${s} won. Now we'll never hear the end of it.`,
      () => `Strong person wins strong-person daily. Shocking. Truly nobody saw that coming.`,
      ({ s }) => `${s} ran in a straight line. Somebody give them a medal. Oh wait, they get power.`,
      () => `A daily win. Wonderful. I'm sure they'll be very humble at the vote.`,
      () => `Fast player is fast. Groundbreaking television.`,
    ],
    'arena-out': [
      ({ s }) => `${s} trusted the house. Bold strategy.`,
      () => `Thrown in and sent home. What a fun surprise for the person nobody protected.`,
      ({ s }) => `I'm sure ${s} will take it very calmly. On camera. At the reunion.`,
      () => `TJ did the face. Riveting. Never seen it before.`,
      () => `Great night for everybody else, though.`,
    ],
  },
  // Knows how it works on the street, and says so.
  streetwise: {
    'daily-won': [
      ({ s }) => `${s} worked the house before the daily, then won it. That's how it's done.`,
      () => `You win dailies with your head, not just your legs.`,
      ({ s }) => `${s} knew who to stay close to at the start line. That's a skill.`,
      () => `They didn't panic when it went wrong. Half of them panic.`,
      () => `Smart beats strong every single time on this show.`,
    ],
    'arena-out': [
      ({ s }) => `${s} trusted a handshake over a vote count. That's how you end up in there.`,
      () => `Never tell the house who you'd pick. Everybody knows that.`,
      ({ s }) => `${s} didn't build a single deal that held. Pride's expensive in that house.`,
      () => `They lost it at the pool, three days before the Arena. Classic.`,
      () => `The show is won in the house. They stayed in the gym.`,
    ],
  },
  // Sees signs in everything.
  mystical: {
    'daily-won': [
      ({ s }) => `${s} was meant to win today. You could feel it at the start line.`,
      () => `The day opened up for them. That doesn't happen by accident.`,
      ({ s }) => `There was something in the air around ${s}. Something lucky.`,
      () => `First across the line. The stars must have been very busy.`,
      () => `Some players are carried by the day. That one was today.`,
    ],
    'arena-out': [
      ({ s }) => `${s}'s journey was always going to end somewhere meaningful. It just ended early.`,
      () => `The Arena decides. Tonight it decided against them.`,
      ({ s }) => `I sensed it at the vote. ${s} was out of step with the house.`,
      () => `Every season somebody leaves first. The show is a circle.`,
      () => `They'll find what they were looking for. It just isn't in that house.`,
    ],
  },
};
