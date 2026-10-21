// ══════════════════════════════════════════════════════════════════════
// ci/lines/goodbye-friends.js — a friend's goodbye, and two catfish at one door
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-21: "goodbye video from someone friendly should acknowledge a
// little if theyre a catfish or no ... like acknowledge their real name too", and
// "the visit of 2 catfish theyre shouldnt be a blame like im sorry for deceiving
// you theyre both catfish the visit still can be negative or positive tho".
//   goodbye.react.friend.real     a friend watching b's video: b was real all along
//   goodbye.react.friend.catfish  a friend watching b's video: b was a catfish, and here is the real name
//   visit.talk.bothfake.<tone>    a (blocked) at b's door, both of them catfish: warm, or cold over the game
//   visit.talk2.bothfake.<tone>   the rest of that sit-down
const E = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.${String(i + 1).padStart(2, '0')}`, ...x })) });
const R = (text, beat) => ({ turns: [{ by: 'a', react: text }], ...(beat ? { beat } : {}) });
// The first thing out of their mouth, then the rest of the thought, out loud.
const R2 = (react, say, beat) => ({ turns: [{ by: 'a', react }, { by: 'a', say }], ...(beat ? { beat } : {}) });
const T = (...turns) => ({ turns: turns.map(([by, k, text]) => ({ by, [k]: text })) });
const B = (entry, beat) => ({ ...entry, beat });

export const GOODBYE_FRIENDS = {
  ...E('goodbye.react.friend.real', [
    R2("{b} was real.", "I knew it. Same name, same face, same heart."),
    R2("See?", "That's my friend. Real the whole time. I'm going to miss you, {b}.", '{a} smiles at the screen and wipes {a.posAdj} eyes.'),
    R2("It really was {b}.", "I'm so glad. I would have been crushed if that was a stranger."),
    R2("Exactly like the pictures.", "{b}, you were real, and you were the best."),
    R2("{b} was everything {b.sub} said.", "That makes this so much harder."),
    R2("No catfish.", "Just {b}. I'm going to find {b.obj} the second this is over."),
    R2("I told everybody {b} was real.", "Nobody listened. Now look."),
    R2("That's the face I've been talking to every day.", "Bye, {b}. For now.", '{a} touches the screen.'),
    R2("Real name, real face, real friend.", "I'm going to miss {b} so much."),
    R2("{b} was real, and {b} still got blocked.", "This game is cruel."),
  ]),
  ...E('goodbye.react.friend.catfish', [
    R2("{b.real}.", "So that's your real name. I'm still going to miss you, {b.real}."),
    R2("Wait.", "{b} was {b.real} this whole time? Okay. I don't even care. I love {b.obj} anyway.", '{a} laughs and shakes {a.posAdj} head.'),
    R2("A catfish?", "My friend was a catfish? Hi, {b.real}. Nice to finally meet you."),
    R2("{b.real}.", "I'm saying it out loud so I remember it. The friendship was real, even if the pictures weren't."),
    R2("So {b} wasn't real, but {b.real} was the one talking to me.", "That's who I'll miss."),
    R2("I did not see that coming.", "{b.real}, you got me. I'm still on your side."),
    R2("That's not {b}.", "That's {b.real}. And honestly? {b.real} seems great."),
    R2("Different face, same person I talked to every night.", "Bye, {b.real}.", '{a} gives the screen a little wave.'),
    R2("{b.real}!", "Okay. I have so many questions. None of them change anything."),
    R2("A catfish, and my friend.", "Both things can be true. Good luck out there, {b.real}."),
  ]),
  ...E('visit.talk.bothfake.warm', [
    B(T(['b', 'say', "So. Neither of us is who we said we were."], ['a', 'say', "Nope. Hi. I'm {a.real}."], ['b', 'say', "{b.real}. Nice to finally meet you."]),
      '{a} and {b} stare at each other, then both start laughing.'),
    T(['a', 'say', "You too? You're a catfish too?"], ['b', 'say', "Guilty. I'm {b.real}."], ['a', 'say', "{a.real}. We should have teamed up from day one."]),
    T(['b', 'say', "I was so ready to explain myself, and then you walked in looking like that."], ['a', 'say', "Like not my pictures?"], ['b', 'say', "Exactly like not your pictures. Same here. Come sit."]),
    B(T(['a', 'say', "Okay, real names. I'm {a.real}."], ['b', 'say', "{b.real}. So, two fake profiles, one couch."], ['a', 'say', "Best visit in Circle history."]),
      '{b} pulls {a} in for a hug.'),
    T(['b', 'say', "I can't believe it. We both did the exact same thing."], ['a', 'say', "Great minds."], ['b', 'say', "Great liars. In the nicest way."]),
    T(['a', 'say', "I came here ready to confess."], ['b', 'say', "And I opened the door ready to confess."], ['a', 'say', "So we're even. I'm {a.real}, by the way."]),
    T(['b', 'say', "I knew there was something about you. I just didn't think it was the same something as me."], ['a', 'say', "Takes one to know one."], ['b', 'say', "Apparently not. I had no idea."]),
    B(T(['a', 'say', "Nobody can ever know about this conversation."], ['b', 'say', "Who would believe it anyway? Two catfish, one door."], ['a', 'say', "I'm {a.real}. You?"], ['b', 'say', "{b.real}. Hi."]),
      '{a} and {b} shake hands like it is a business deal, then hug.'),
  ]),
  ...E('visit.talk.bothfake.cold', [
    T(['a', 'say', "Don't give me that look. We both did it."], ['b', 'say', "I'm not mad about the profile. I'm mad you came here."], ['a', 'say', "You blocked me. I wanted to see who did it."]),
    T(['b', 'say', "So you're not real either."], ['a', 'say', "Neither are you, so let's skip that part."], ['b', 'say', "Fine. Then what do you want?"]),
    B(T(['a', 'say', "I'm not here to talk about pictures. I'm here about the blocking."], ['b', 'say', "It was the game. You would have done the same thing."], ['a', 'say', "Maybe. I still wanted to hear you say it."]),
      '{a} stays standing.'),
    T(['b', 'say', "Of all the doors in this building, you picked mine."], ['a', 'say', "You never once had my back in there."], ['b', 'say', "I had my own back. That's the game."]),
    T(['a', 'say', "I'm {a.real}. Not that you care."], ['b', 'say', "{b.real}. And you're right, I don't."], ['a', 'say', "Good. Then this will be quick."]),
    T(['b', 'say', "We both lied. That's not the problem."], ['a', 'say', "Then what is?"], ['b', 'say', "You played me in every chat, and you know it."]),
    B(T(['a', 'say', "I thought we were close in there."], ['b', 'say', "We were close to the same thing: winning."], ['a', 'say', "Wow. Okay."]),
      '{b} crosses {b.posAdj} arms.'),
    T(['b', 'say', "Say what you came to say."], ['a', 'say', "You were never going to keep me safe. I just want you to admit it."], ['b', 'say', "Fine. I wasn't."]),
  ]),
  ...E('visit.talk2.bothfake.warm', [
    T(['a', 'say', "Win this. For both of the fake people."], ['b', 'say', "For both of the real ones."]),
    T(['b', 'say', "Your secret's safe with me."], ['a', 'say', "Yours is safe with me. Obviously."]),
    T(['a', 'say', "When this is over, we're telling everybody together."], ['b', 'say', "Deal. Front row at the finale."]),
    T(['b', 'say', "Any advice for the last fake profile standing?"], ['a', 'say', "Keep your story straight, and don't trust anybody who's too nice."], ['b', 'say', "So, not you."]),
    T(['a', 'say', "I'm so glad it was you."], ['b', 'say', "Me too, {a.real}. Me too."]),
    T(['b', 'say', "Does anybody else know about you?"], ['a', 'say', "Just you. Now we're even."]),
  ]),
  ...E('visit.talk2.bothfake.cold', [
    T(['a', 'say', "Enjoy it while it lasts."], ['b', 'say', "I plan to."]),
    T(['b', 'say', "Are we done?"], ['a', 'say', "We're done."]),
    T(['a', 'say', "They'll find you out eventually. Nobody stays hidden forever."], ['b', 'say', "I'll take my chances."]),
    T(['b', 'say', "Good luck out there, {a.real}."], ['a', 'say', "Keep it. You'll need it more than me."]),
    T(['a', 'say', "I hope it was worth it."], ['b', 'say', "Ask me at the finale."]),
    T(['b', 'say', "Nothing personal."], ['a', 'say', "It felt personal."]),
  ]),
};
