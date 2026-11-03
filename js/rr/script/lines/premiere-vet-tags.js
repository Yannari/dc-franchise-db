// A veteran's line at the end of the team's introduction (write.js, team-intro; the user, 2026-11-03: "how can i make
// them reference their show while their relationship is not reality tv"). Said to camera by the one who has been on a
// show before (rr/past.js, team.past), whatever the team's relationship or identity. {show} is their last show,
// {partner} their partner. Picked by what is true of them, most particular first:
//   met-*     they were both on one show: what they were to each other there (showmance, rivals, allies, the cast)
//   won       the speaker won one        final     made the final of one
//   newbie    the partner has never been on anything
//   vet       anything else
export const VET_TAGS = {
  'met-showmance': [
    "We met on {show}. That's a whole story, and you can go and watch it.",
    "The last time we were on television together, it was {show}. A lot has happened since then.",
  ],
  'met-rivals': [
    "The last time we were on a show together, it was {show}, and we could not stand each other. So this should be fun.",
    "We were on {show} together. We were not on the same side.",
  ],
  'met-allies': [
    "We were on {show} together, and we had each other's backs the whole time. Same plan here.",
    "We worked together on {show}. It went pretty well, so we're doing it again.",
  ],
  'met-cast': [
    "We were both on {show}, the same season. We barely talked back then, which is funny now.",
    "We've done {show} together already. This one has more running.",
  ],
  won: [
    "Just so everybody knows, I won {show}. I'm not saying it to brag. I'm saying it so they're nervous.",
    "I've won one of these before, on {show}. Different show, same feeling.",
  ],
  final: [
    "I made the final on {show}. I'm not planning on going home early this time either.",
    "I got all the way to the end of {show}. I'd like to go one better here.",
  ],
  newbie: [
    "I've done this before, on {show}. {partner} hasn't. I'm going to be the calm one. Probably.",
    "{partner} has never been on television. I've done {show}. I told {partner} everything, and none of it went in.",
  ],
  vet: [
    "I've been on {show} before, so the cameras don't bother me. The running might.",
    "{show} was a lot. I have a feeling this is going to be more.",
    "The last time I was on television it was {show}. I learned a lot, mostly about what not to do.",
  ],
};
