// pm/talk/whole/voice.js — one line, in each islander's own voice.
//
// The user, 2026-10-30, on "Friendly people don't look at you like that. You
// know they don't.": "depending on their voice it could be so much more human —
// a frat boy, a chill lad, could be like 'I'm telling you bro, I swear she
// wants me'." A whole conversation (pm/script.js talkScript `whole`) writes its
// key lines once plainly and then once per voice that would say it differently;
// the speaker's own persona (pm/profile.js) and register (pm/story/director.js)
// pick which one plays. The plain line has to be good: it is heard most.
//
//   say('a', "plain line", { lad: "…", bestie: "…", soft: "…" })
//
// A voice may give several lines (an array), all said by the same speaker.

export const VOICE = {
  // The laid-back lads and the players, to another lad: "bro", short, sure of themselves.
  lad: { persona: ['fuckboy', 'villa-clown', 'bombshell', 'messy'], gender: 'm', bGender: 'm' },
  // The girls' girls and the loud ones, to another girl: warm, quick, all in.
  bestie: { persona: ['girls-girl', 'villa-clown', 'messy', 'bombshell'], gender: 'f', bGender: 'f' },
  // In love with being in love.
  romantic: { persona: 'hopeless-romantic' },
  // Keeps their cards close.
  player: { persona: 'game-player' },
  // Doesn't say much, and means all of it.
  quiet: { persona: 'wallflower' },
  // How they sound in this scene (pm/story/director.js REGISTERS).
  soft: { reg: 'soft' },
  sharp: { reg: 'sharp' },
  big: { reg: 'big' },
  dry: { reg: 'dry' },
  flirty: { reg: 'flirty' },
  nervy: { reg: 'nervy' },
};

/** A line said by `by`, plainly, and in each voice given. */
export function say(by, plain, voices = {}) {
  const turns = t => (Array.isArray(t) ? t : [t]).map(x => [by, x]);
  return { by, vary: [{ turns: turns(plain) },
    ...Object.entries(voices).map(([v, t]) => {
      if (!VOICE[v]) throw new Error(`unknown voice ${v}`);
      return { when: VOICE[v], turns: turns(t) };
    })] };
}
