// ══════════════════════════════════════════════════════════════════════
// td/script/lines/leak.js — a deal made in the wrong place, overheard
// ══════════════════════════════════════════════════════════════════════
//
// camp-events.js _leakPass (the user, 2026-10-07: "a deal in a public place carries more
// risk of a leak, but don't let it stop people strategizing"). {b} and {c} talked game
// somewhere {a} could hear: a deal, an alliance, a plan. The ending says what it was.
//   leak.heard.<deal|alliance|plan>  a = the one who overheard; b and c = the two talking.
// b and c don't know they were heard; only a's lines and confessional say it.
// Ids: 'lk.'.

const HEARD = [
  { id: 'lk.h1', turns: [
    { beat: '{a} stops just short of the corner. {b} and {c} are talking, low and fast.' },
    { by: 'b', say: "...so we're agreed. You and me." },
    { by: 'c', say: "You and me." },
    { by: 'a', conf: "They really should check who's around before they say stuff like that. Now I know exactly where I stand. Outside it." },
  ] },
  { id: 'lk.h2', turns: [
    { beat: '{a} is doing nothing much nearby when {b} and {c} start talking a bit too loudly.' },
    { by: 'c', say: "Nobody else can know about this." },
    { by: 'b', say: "Nobody will." },
    { by: 'a', conf: "Nobody will. Except me, standing right here. Good to know." },
  ] },
  { id: 'lk.h3', when: { register: 'fiery' }, turns: [
    { beat: '{a} hears every word of what {b} and {c} are planning.' },
    { by: 'a', conf: "Oh, they're making deals? Without me? Right in front of me? Okay. OKAY." },
    { by: 'a', conf: "I'm not going to say anything. Yet. But I heard it." },
  ] },
  { id: 'lk.h4', when: { register: ['schemer', 'cool'] }, turns: [
    { beat: '{a} doesn\'t look up while {b} and {c} talk. {a} doesn\'t miss a word either.' },
    { by: 'a', conf: "{b} and {c}. Interesting. I didn't know that was a thing." },
    { by: 'a', conf: "Now I do, and they don't know I know. That's the best kind of information there is." },
  ] },
  { id: 'lk.h5', when: { register: ['sweet', 'shy'] }, turns: [
    { beat: '{a} was only fetching something. Now {a} wishes {a.sub} hadn\'t.' },
    { by: 'a', conf: "I wasn't trying to listen. I swear. But {b} and {c} were right there, and they were making a plan, and I'm not in it." },
    { by: 'a', conf: "I don't know what to do with that. I really don't." },
  ] },
  { id: 'lk.h6', when: { register: ['competitor', 'plain'] }, turns: [
    { beat: '{a} catches the end of something between {b} and {c}.' },
    { by: 'a', conf: "That didn't sound like small talk. That sounded like two people who just picked a side, and it isn't mine." },
  ] },
  { id: 'lk.h7', turns: [
    { beat: "{a} goes very still. A few feet away, {b} and {c} are counting votes, and {a}'s name comes up." },
    { by: 'c', say: "...and then {a}. Eventually." },
    { by: 'a', conf: "Eventually. Great. Good to know I'm on somebody's list. Now they're on mine." },
  ] },
];

export default { 'leak.heard.any': HEARD };
