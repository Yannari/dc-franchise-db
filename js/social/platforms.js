// js/social/platforms.js
// Two rooms with different physics.
//
// ChatBCC — the real app this is modelled on — is NOT a timeline. It is a group
// chat where 56 Big Brother alumni act as HOSTS to about 41,000 members, running
// watch parties and prediction games. So the two streams are not one feed with
// two labels. A public timeline is a stadium; a hosted chat is a room where the
// hosts have played the game and know the people they are talking about.
//
// If a post reads the same in both rooms, the library has failed.

export const PLATFORMS = {
  timeline: {
    id: 'timeline',
    label: 'the timeline',
    /** Public. Anybody posts, and the crowd is the point. */
    audience: 'public',
    /** Hard cap in characters. Short is what makes a dunk land. */
    maxLength: 240,
    /** What a reader can do to a post here. */
    engagement: ['likes', 'tomatoes', 'replies', 'quotes'],
    /** Ratios exist here: tomatoes outrunning likes IS the story. */
    ratios: true,
    /** Lowercase, fragments, no full stops — how the room actually sounds. */
    register: 'casual',
    hostility: 1.0,
  },
  chat: {
    id: 'chat',
    label: 'the group chat',
    /** Hosted. Alumni host, members reply. Semi-private. */
    audience: 'hosted',
    maxLength: 600,
    engagement: ['likes', 'comments'],
    /** No ratio culture. It is a room, not a stadium. */
    ratios: false,
    /** Full sentences. Insider vocabulary. Warmer surface, shadier content. */
    register: 'considered',
    hostility: 0.45,
  },
};

/** A platform by id. Falls back to the timeline — the public room is the default. */
export function platformOf(stream) {
  return PLATFORMS[stream] || PLATFORMS.timeline;
}
