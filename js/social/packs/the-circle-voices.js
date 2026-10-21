// js/social/packs/the-circle-voices.js
// The alumni hosts, watching the Circle.
//
// Twelve DELIVERIES, the same twelve js/social/voices.js derives from a host's
// canonical profile, each given the two moments the Circle is watched for most:
// somebody topping the ratings and somebody getting blocked. A column read down
// has to sound like one person; the same people on the other shows live in
// their packs, and the voices must not bleed.
//
// `s` is the player. THERE IS NO VOTE AND NO HOUSE: the players rate each
// other from separate apartments, and the Influencers block.

export const HOST_TAKES = {
  // Short. Stops talking. The joke is that there is no joke.
  deadpan: {
    'top-rated': [
      ({ s }) => `${s} came first. The apartment was very pleased.`,
      () => `Number one. Same apartment. Slightly better mood.`,
      ({ s }) => `${s} is popular. The others are thrilled.`,
      () => `They sent nice messages. People liked the messages. Science.`,
      () => `First in the ratings. Next week, first in line to be blocked.`,
    ],
    blocked: [
      ({ s }) => `${s} got blocked. The screen was very dramatic about it.`,
      () => `One rating. One block. One very quiet apartment.`,
      ({ s }) => `${s} is out. The circle chat is slightly quieter.`,
      () => `The Influencers did the thing. Riveting.`,
      () => `Blocked. They will have to text people the normal way now.`,
    ],
  },
  // Everything is the greatest thing that has ever happened.
  theatrical: {
    'top-rated': [
      ({ s }) => `${s}, number one! The crowd goes wild! Well. The apartment goes wild.`,
      () => `First in the ratings! Somebody cue a slow-motion reveal and a string section!`,
      ({ s }) => `${s} rose to the top like the final act of a love story. I wept.`,
      () => `A coronation by keyboard. Iconic. Unrepeatable. Until next week.`,
      () => `That was not a rating. That was a standing ovation from a room full of screens.`,
    ],
    blocked: [
      ({ s }) => `${s}, blocked! The tragedy! The betrayal! The dramatic music!`,
      () => `The screen went dark and the whole Circle held its breath. A true final act.`,
      ({ s }) => `I will be thinking about ${s}'s goodbye message for weeks. Weeks!`,
      () => `Exit, pursued by an Influencer. Devastating.`,
      () => `Some players leave. That one made an exit.`,
    ],
  },
  // Says it straight, then stops.
  blunt: {
    'top-rated': [
      ({ s }) => `${s} was nice to everyone. That's why.`,
      () => `Most liked this week. Doesn't mean safe next week.`,
      ({ s }) => `${s} never picked a fight in the circle chat. It pays.`,
      () => `Popular. That's the whole ratings.`,
      () => `Good week for them. Next.`,
    ],
    blocked: [
      ({ s }) => `${s} talked too much in the circle chat. That's why.`,
      () => `Bottom of the ratings, no friends with power. Out.`,
      ({ s }) => `${s} trusted the wrong Influencer.`,
      () => `Bad week. Blocked. It happens.`,
      () => `They saw it coming in the ratings.`,
    ],
  },
  // Measured, complete sentences, a little old-fashioned.
  formal: {
    'top-rated': [
      ({ s }) => `I would like to commend ${s} on a consistently gracious week of correspondence.`,
      () => `The highest rating reflects a great deal of patient, courteous conversation.`,
      ({ s }) => `${s} has conducted every private chat with admirable restraint.`,
      () => `One should never underestimate the value of a well-timed compliment.`,
      () => `A deserved result, achieved without unpleasantness. Quite right.`,
    ],
    blocked: [
      ({ s }) => `It is with regret that we say goodbye to ${s}.`,
      () => `The goodbye message was composed with real dignity.`,
      ({ s }) => `${s} was let down by the timing of the ratings rather than by any lack of character.`,
      () => `A blocking is never pleasant, and this one was handled with grace.`,
      () => `I wish them every success in whatever they choose to do next.`,
    ],
  },
  // Kind first, always.
  warm: {
    'top-rated': [
      ({ s }) => `Oh, I'm so happy for ${s}. They've been lovely to everybody.`,
      () => `Did you see the smile when the number one came up? That's the best part of this show.`,
      ({ s }) => `${s} really deserves to feel liked. Good for them.`,
      () => `First place, and they still sent a kind message to whoever came last. Lovely person.`,
      () => `Being liked by people you've never met is a special thing.`,
    ],
    blocked: [
      ({ s }) => `I'm so sad to see ${s} go. They were kind in every chat.`,
      () => `That goodbye message. I hope they stay friends with everybody.`,
      ({ s }) => `${s} should be proud. That was an honest game.`,
      () => `Getting blocked isn't losing. It's just the end of the messages.`,
      () => `I hope they got to meet somebody special on the way out.`,
    ],
  },
  // Every result is a lesson in leverage.
  manipulative: {
    'top-rated': [
      ({ s }) => `${s} just became the profile everybody wants to be friends with. That's useful, if you're clever.`,
      () => `Top the ratings and every message you get is a little nicer. Watch.`,
      ({ s }) => `If I were ${s}, I'd come third next week on purpose. Targets get blocked.`,
      () => `The real prize is the Influencer seat. The rating is just the key.`,
      () => `Now they have something to offer. I'd start trading.`,
    ],
    blocked: [
      ({ s }) => `${s} never made a friend who'd protect them in the hangout. That's the lesson.`,
      () => `A block is what happens when nobody owes you anything.`,
      ({ s }) => `${s} trusted the wrong group chat. I could have told them.`,
      () => `You don't need to be liked if somebody else is liked less. They forgot that.`,
      () => `The other players were relieved. Relief is a kind of debt.`,
    ],
  },
  // Worried for everybody, all the time.
  nervous: {
    'top-rated': [
      ({ s }) => `${s} came first, which is great, but now everybody's watching them, which is terrifying.`,
      () => `Number one is lovely. Number one is also the first name on everybody's list.`,
      ({ s }) => `I'm thrilled for ${s}. I'm also worried about the next ratings.`,
      () => `They did so well! I hope nobody gets jealous. People get jealous in group chats.`,
      () => `First place! Okay. Okay, good. Is there an Influencer twist? Please no twist.`,
    ],
    blocked: [
      ({ s }) => `Oh no. Oh, ${s}. I felt that block in my chest.`,
      () => `I couldn't watch the screen go dark. I watched it through my fingers.`,
      ({ s }) => `${s} getting blocked like that is my actual nightmare.`,
      () => `Every time the alert sound plays I forget how to breathe.`,
      () => `I'm so sorry for them. I'd have panicked at the first private chat.`,
    ],
  },
  // EVERYTHING IS AMAZING.
  excitable: {
    'top-rated': [
      ({ s }) => `${s} CAME FIRST! Did you SEE their face?`,
      () => `Number one! The ratings! The music! I'm out of breath and I didn't even type anything!`,
      ({ s }) => `${s} is killing it! Killing it!`,
      () => `Everybody loves them! EVERYBODY!`,
      () => `Best ratings of the season, I'm calling it, I'll call it again next week!`,
    ],
    blocked: [
      ({ s }) => `No! Not ${s}! They were so fun!`,
      () => `That was SO close! One rating! One!`,
      ({ s }) => `I really thought ${s} would make the final! I was on my feet!`,
      () => `The pause before the name came up! I screamed at my television!`,
      () => `They'll be back. I believe it. Somebody bring them back!`,
    ],
  },
  // It is always, somehow, about them.
  boastful: {
    'top-rated': [
      ({ s }) => `${s} came first the way I would have. Charmingly, and in good lighting.`,
      () => `I topped ratings like that all the time. Nice to see it done properly.`,
      ({ s }) => `${s} clearly studied my messages. You can tell.`,
      () => `First place is my natural habitat. Welcome to it.`,
      () => `Good rating. Not my best rating ever, but good.`,
    ],
    blocked: [
      ({ s }) => `${s} should have asked me for advice. I'd have been an Influencer by week two.`,
      () => `I never got blocked. Not once. Just saying.`,
      ({ s }) => `I feel for ${s}. It's hard being on a show without me on it.`,
      () => `That circle chat? I'd have had everybody eating out of my hand.`,
      () => `They'll learn. Some of us didn't need to.`,
    ],
  },
  // Says the opposite of what it means, and means it.
  sarcastic: {
    'top-rated': [
      ({ s }) => `Oh good, ${s} came first. Now we'll never hear the end of it.`,
      () => `Number one. Shocking. Truly nobody saw that coming. Except everybody.`,
      ({ s }) => `${s} sent nice messages. Somebody give them a medal.`,
      () => `Most liked. Wonderful. I'm sure they'll be very humble in the circle chat.`,
      () => `Popular person is popular. Groundbreaking television.`,
    ],
    blocked: [
      ({ s }) => `${s} trusted an Influencer. Bold strategy.`,
      () => `Blocked. What a fun surprise for the person who came last.`,
      ({ s }) => `I'm sure ${s} will take it very calmly. On camera. In a goodbye video.`,
      () => `The screen went dark. Riveting. Never seen that before.`,
      () => `Great night for everybody else, though.`,
    ],
  },
  // Knows how it works on the street, and says so.
  streetwise: {
    'top-rated': [
      ({ s }) => `${s} worked every private chat. Asked about their families, remembered the answers. That's how it's done.`,
      () => `You top the ratings by listening, not by typing more.`,
      ({ s }) => `${s} knew who to trust and who to be nice to. Different lists.`,
      () => `They didn't panic in the circle chat. Half of them panic in the circle chat.`,
      () => `Reading people through a screen is a real skill. They have it.`,
    ],
    blocked: [
      ({ s }) => `${s} trusted a profile over a person. That's how you get blocked.`,
      () => `Never say anything in a group chat you wouldn't say to everybody.`,
      ({ s }) => `${s} didn't build a single friendship that could survive a hangout.`,
      () => `They lost it in the circle chat, with one message. Classic.`,
      () => `The game is won in private chats. They stayed in the public one.`,
    ],
  },
  // Sees signs in everything.
  mystical: {
    'top-rated': [
      ({ s }) => `${s} was meant to rise. You could feel it in their first message.`,
      () => `The Circle opened up for them this week. That doesn't happen by accident.`,
      ({ s }) => `There's a warmth around ${s}. The others can feel it through the screen.`,
      () => `Number one. The stars must have been very busy.`,
      () => `Some players are carried by the room. That one was this week.`,
    ],
    blocked: [
      ({ s }) => `${s}'s journey was always going to end somewhere meaningful. It just ended early.`,
      () => `The Circle decides. Today it decided against them.`,
      ({ s }) => `I sensed it in the ratings. ${s} was out of step with the room.`,
      () => `Every season somebody has to leave first. The Circle is a circle.`,
      () => `They'll find what they were looking for. It just isn't in that apartment.`,
    ],
  },
};
