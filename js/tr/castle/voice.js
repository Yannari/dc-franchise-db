// ══════════════════════════════════════════════════════════════════════
// tr/castle/voice.js — a contestant answers in their own words, about the
// thing that actually just happened
// ══════════════════════════════════════════════════════════════════════
//
// TWO DEFECTS, ONE CAUSE, AND THE CAUSE IS THE INTERESTING PART.
//
// `js/vp-tr/castle-day.js` composes every castle scene into four or five
// cards, and the third of them — the REACTION — is drawn from a pool keyed on
// (scene family x voice register x tone). Family is a property of the EVENT
// FILE, not of the sentence the action card printed, and one family holds
// scenes with nothing in common. `js/tr/castle/grief.js` is the clearest case:
// `grief-empty-chair` is mourning and `grief-suspicion-of-timing` is two
// people doing forensics over breakfast, and both are `family: 'grief'`, so
// both were answered out of the grief-comfort register. Rendered:
//
//     (action)   {a} wanted to know what {v} knew. {b} wanted to know who
//                else had wondered that before last night.
//     (reaction) {b} sits down beside {a} and stays until {a} has stopped.
//
// Stopped WHAT. Nobody was crying. The reaction is not merely bland, it
// asserts a stimulus the scene did not contain — and the dangling "stopped"
// is what a reader notices first, because a comfort line borrowed onto an
// interrogation has no antecedent to attach to.
//
// SO THE REACTION IS KEYED ON WHAT THE ACTION DID. `actionPurpose(scene)`
// below is an EXPLICIT DECLARATION TABLE over (eventId, branch) — the same
// discipline `ADVERSE_BRANCHES` and `TURNED_BRANCHES` already run on in
// castle-day.js, and for the same stated reason: the information is in the
// event, and a list somebody has to maintain deliberately is better than a
// pattern that quietly stops matching. Anything not on the table returns null
// and the screen keeps the family register it has always used, so this can
// only ever correct a scene, never break one that was already right.
//
// AND THE VOICE IS MODERN. writing-contracts.md's "modern individual voice
// contract" is a rule about vocabulary as much as about differentiation:
// castle atmosphere may be gothic, contestants may not be. Nothing in this
// file says "I shall", "most troubling", "I find your account" or "henceforth";
// everything in it uses contractions, fragments and the register the person's
// archetype and stats actually support. `js/tr/castle/lines.js` holds the
// event pools; this holds the person.
//
// NO WRITES. This file computes a sentence and touches no ledger — it is
// content and a lookup, which is why the write-path guard has nothing to say
// about it and why js/vp-tr/ may import it without importing engine state.
import { players } from '../../core.js';

/** The four registers a contestant answers in. */
export const VOICE_REGISTERS = ['blunt', 'sharp', 'warm', 'guarded'];

/**
 * Archetype -> register.
 *
 * IDENTICAL TO `VOICE_BY_ARCHETYPE` in js/vp-tr/castle-day.js ON PURPOSE, and
 * that duplication is deliberate rather than an oversight: the screen's copy
 * is what selects its own family pools and it predates this file. The two are
 * pinned equal by tests/tr-voice.test.js, so a divergence goes red rather than
 * producing a person who is blunt in one card and warm in the next.
 *
 * Every key is a valid archetype (AGENTS.md), and the behaviour rules hold:
 * nice archetypes land in `warm` and never receive an escalating line.
 */
export const VOICE_BY_ARCHETYPE = {
  hothead: 'blunt', villain: 'blunt', 'challenge-beast': 'blunt', 'chaos-agent': 'blunt',
  mastermind: 'sharp', schemer: 'sharp', 'perceptive-player': 'sharp',
  'social-butterfly': 'warm', hero: 'warm', showmancer: 'warm', 'loyal-soldier': 'warm',
  floater: 'guarded', goat: 'guarded', underdog: 'guarded', wildcard: 'guarded',
};

/**
 * How this person talks. Archetype first, and stats when the roster row has
 * no archetype on it — the one cut AGENTS.md permits, since a stat line is
 * never absent and an archetype often is.
 */
export function voiceOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  const a = p && p.archetype;
  if (a && VOICE_BY_ARCHETYPE[a]) return VOICE_BY_ARCHETYPE[a];
  const s = (p && p.stats) || {};
  const n = k => Number(s[k]) || 5;
  const bid = {
    blunt: n('boldness') + (10 - n('temperament')),
    sharp: n('strategic') + n('intuition'),
    warm: n('social') + n('loyalty'),
    guarded: (10 - n('boldness')) + (10 - n('social')),
  };
  return VOICE_REGISTERS.slice().sort((x, y) => bid[y] - bid[x])[0];
}

// ══════════════════════════════════════════════════════════════════════
// THE POOLS
// ══════════════════════════════════════════════════════════════════════
//
// `{b}` is the person SPEAKING — the one `lineInVoice` was called for. `{a}`
// is the other person in the scene. That is the same convention the reaction
// pools in js/vp-tr/castle-day.js already use, so a line moved between the two
// files does not silently swap who is who.
//
// TEN PER REGISTER PER PURPOSE, and the number is measured rather than
// chosen for symmetry. tests/tr-voice.test.js asks that a cast's lines stay
// more than 65% distinct after names are stripped; a register holding six
// people and eight lines collides too often to clear it with margin, and ten
// puts the measured figure comfortably above the band. The same width is what
// stops one person owning a catchphrase across a season, since the index moves
// with the scene.

const CHALLENGE_ACCUSATION = {
  blunt: [
    '“{a}, say it properly. You think I did something — put it in a sentence.”',
    '“You have been circling me since breakfast. Ask the question.”',
    '“Come on. You are not asking, you are accusing. Do the second one out loud.”',
    '“If my name is on your list, say my name. I would rather hear it from you.”',
    '“That is not a question, {a}. That is a verdict with a question mark on it.”',
    '“Either I did it or I didn\'t. Pick one and we can both get on with the day.”',
    '“You want me to argue myself out of something you have not accused me of yet.”',
    '“Ask me in front of people, or stop asking me at all.”',
    '“I am not doing the dance. Just say the thing you came to say.”',
    '“You have had all day to say it. It is nearly dark. Say it.”',
  ],
  sharp: [
    '“Your first version had me upstairs. This one has me in the hall. Which is it?”',
    '“I want to know who told you that, because the shape of it is somebody else\'s.”',
    '“You are asking me a question you already have an answer to. Why?”',
    '“Say the part you are leaving out. That is the part I am interested in.”',
    '“That works as a story. It does not work as a timeline. Walk me through the hour.”',
    '“Who benefits from this being tonight\'s only question? Start there.”',
    '“I will answer it. First tell me what you think the answer is going to be.”',
    '“You have got two facts and a feeling, and you are treating all three the same.”',
    '“Where did the detail come from? Not the claim. The detail.”',
    '“If that is true, then something you told me yesterday isn\'t. Which one goes?”',
  ],
  warm: [
    '“Can we slow down? I would rather hear you out than win this.”',
    '“I am not going to be weird about it. Just tell me what you think I did.”',
    '“Say it to me and not around me. I can take it, honestly.”',
    '“If you are worried about me, I would rather know. That is all.”',
    '“I do not want to fight with you. I do want to know what you have heard.”',
    '“Tell me the whole thing, and then I will tell you my whole thing.”',
    '“You have been off with me all morning. What is it? Properly.”',
    '“I would rather you asked than wondered. Ask.”',
    '“Whatever it is, say it now, because I like you and this is horrible.”',
    '“Let me hear it from you before I hear a version of it from someone else.”',
  ],
  guarded: [
    '“Interesting. Where did you get that?”',
    '“Go on. I would like to hear the rest of it before I say anything.”',
    '“That is a lot of certainty for a Tuesday. Who else has heard it?”',
    '“Say more. I am not going to help you finish it.”',
    '“I could answer that. I would rather know why you are asking first.”',
    '“Right. And when did that become a thing people were saying?”',
    '“Hm. Is that you asking, or is that someone else asking through you?”',
    '“I will take that seriously when you tell me where it came from.”',
    '“You have decided something. I would like to know when.”',
    '“Keep going. You are nearly at the bit that matters.”',
  ],
};

const ANSWER_ACCUSATION = {
  blunt: [
    '“You have been waiting all day to say that. Just say you want me gone.”',
    '“No. Next question, {a}, come on.”',
    '“That is not what happened and you know it is not what happened.”',
    '“Put my name up tonight if you believe it. Stop asking me questions instead.”',
    '“You are wrong. Loudly, publicly wrong, and I am not softening it.”',
    '“I was where I said I was. Ask anyone. Actually, come on, ask them now.”',
    '“Say it at the table and see who backs you.”',
    '“Do not do the voice with me. Just say what you think I did.”',
    '“You want me careful about this? I am not going to be careful about this.”',
    '“Fine. You want the whole hour? Here is the whole hour, and then we are done.”',
  ],
  sharp: [
    '“I will answer that. Then I want you to answer the same question back.”',
    '“Half of that is true and the half that is true is the half that proves nothing.”',
    '“You have got the order wrong. Fix the order and your point disappears.”',
    '“I was there. So were four other people. Ask one of them before you ask me twice.”',
    '“That is a fair question badly aimed. Here is where it should have been aimed.”',
    '“I can account for all of it. What I want to know is why tonight.”',
    '“You are describing something I did. You are not describing why it matters.”',
    '“Yes, I did that. It is not the thing you think it is, and here is why.”',
    '“I will give you the timeline. Watch what you do with it — that is my part of this.”',
    '“You are right about the room and wrong about the hour, and the hour is the case.”',
  ],
  warm: [
    '“That is not it. I promise you that is not it, and I will tell you what is.”',
    '“Okay. That really hurt, and I am still going to answer it properly.”',
    '“I understand why it looks like that. It is not that. Let me explain.”',
    '“You could have just asked me. I would have told you the first time.”',
    '“I am not angry. I am gutted, but I am not angry. Here is what actually happened.”',
    '“Ask me anything about that hour. Genuinely, anything.”',
    '“I would rather you had come to me than carried it round all day.”',
    '“That is fair to ask and it is wrong, and I would like to fix it now.”',
    '“I did not do that. And I am not going to be strange with you about it.”',
    '“Right. Deep breath. Here is the whole of it, and you can decide.”',
  ],
  guarded: [
    '“I was where I said I was.”',
    '“Sure. And what did you expect me to say?”',
    '“Someone has been busy. Whoever they are, they left a bit out.”',
    '“I could go through it again. It will be the same as it was the first time.”',
    '“That is one way of putting it.”',
    '“If that is what you think, that is what you think.”',
    '“Ask someone else and see if they say the same. I will wait.”',
    '“I answered that this morning. You were standing right there.”',
    '“Believe what you like. I am not going to perform being upset about it.”',
    '“That is not a question, so I am not going to treat it like one.”',
  ],
};

const ADMIT_FAULT = {
  blunt: [
    '“Yeah, that was my fault. I am not going to dress it up.”',
    '“I got it wrong. Loudly, in front of all of you. There it is.”',
    '“My fault. I would do it again for the same reason and it would still be my fault.”',
    '“I got it wrong and I am furious about it, mostly with myself.”',
    '“That one is my fault. Say what you want about it, you are not wrong.”',
    '“I got it wrong. I am not doing the speech, but I got it wrong.”',
    '“My fault, start to finish. Anybody want to add anything? No? Good.”',
    '“I got it wrong, and the annoying part is I knew halfway through.”',
    '“My fault. Do not be nice about it, it makes it worse.”',
    '“I got it wrong. Next time somebody stop me.”',
  ],
  sharp: [
    '“I got it wrong. Specifically: I trusted the timing and the timing was the lie.”',
    '“That is my fault, and I can tell you exactly where the mistake entered.”',
    '“I got it wrong for a reason that made sense at the time, which is the worst kind.”',
    '“My fault. I built on one source and I should have had two.”',
    '“I got it wrong. What I want to understand is who benefited from me getting it wrong.”',
    '“That is on record as my fault. I would like to be the one who says so first.”',
    '“I got it wrong, and I have spent an hour working out how, which is the useful part.”',
    '“My fault. I weighted a feeling like it was evidence.”',
    '“I got it wrong. Do not let me do the same thing to somebody else on Thursday.”',
    '“My fault, and here is the part of it I still think I was right about, so you can argue.”',
  ],
  warm: [
    '“I got it wrong. I am so sorry — genuinely, that is my fault.”',
    '“That was my fault and I have felt sick about it all day.”',
    '“I got it wrong about you, in front of people, and I hate that I did.”',
    '“My fault. Not a bit of it was yours, and I want that said out loud.”',
    '“I got it wrong. You do not have to be okay with me, but I needed to say it.”',
    '“That is my fault. I should have come to you first and I did not.”',
    '“I got it wrong and I would like to fix it, if you will let me try.”',
    '“My fault entirely. I am not going to explain it, because explaining it is excusing it.”',
    '“I got it wrong. I was frightened and I made it your problem.”',
    '“That was my fault, and the worst part is you were nice about it at the time.”',
  ],
  guarded: [
    '“That one is my fault. I will leave it there.”',
    '“I got it wrong. I do not have anything else to add to that.”',
    '“My fault, yes. Anyway.”',
    '“I got it wrong. You can all stop looking at me now.”',
    '“My fault. I am not going to make a thing of it.”',
    '“I got it wrong, which I imagine several of you had already worked out.”',
    '“That was my fault. I would rather not go round the table on it.”',
    '“I got it wrong. I have said so. That is the whole statement.”',
    '“My fault. I will be more careful about who I say things to.”',
    '“I got it wrong, and I am aware of exactly how that looks.”',
  ],
};

const THEORISE_WITH = {
  blunt: [
    '“It is not random. Nothing in this building is random.”',
    '“Somebody sat next to them last night and said goodnight. That is where I would start.”',
    '“Then say the name you are thinking of. I will say mine at the same time.”',
    '“I do not want a theory, I want a list. Who was up, and who was where.”',
    '“Fine, work it backwards. Who is better off this morning than they were?”',
    '“You are being polite about it. I am not going to be. It was one of four people.”',
    '“Every time we do this we end up with the same two names. Maybe that is the answer.”',
    '“Right, so either we are wrong about them or we are wrong about everything.”',
    '“That is the question, and I notice nobody wants to say it at breakfast.”',
    '“I have been up since four doing this in my head. Go on then, say yours.”',
  ],
  sharp: [
    '“Take the order out of it. Who was the safest person to take, not the most useful?”',
    '“They were not chosen for what they knew. They were chosen for who they sat with.”',
    '“If it was about the question they asked, then somebody in this room heard it.”',
    '“Two things are true and they do not fit together. That is where the answer is.”',
    '“Ask it the other way. Not why them — why not the obvious one?”',
    '“There is a version of this where the point was to make us look at somebody else.”',
    '“I have four candidates and three of them only work if last Tuesday was a lie.”',
    '“Whoever did it wanted this conversation to happen. That is worth remembering.”',
    '“The timing is the message. Everything else is decoration.”',
    '“I am less interested in who than in why now. Now is the part that is unusual.”',
  ],
  warm: [
    '“I keep going round it. Why them, of all of us.”',
    '“Can I say something horrible? I think they were taken because people liked them.”',
    '“I do not want to be doing this over breakfast, and I cannot stop doing it.”',
    '“Talk it through with me. I would rather be wrong out loud than quiet and wrong.”',
    '“They were kind to me on the first night. I want to be useful about this.”',
    '“Part of me does not want the answer. The rest of me has not slept.”',
    '“Say your theory and I will not repeat it. I just need somebody to think with.”',
    '“It feels wrong to be clever about it. And we have to be, don\'t we.”',
    '“I have three ideas and I hate all of them. Which do you want first?”',
    '“I know it is a game. It stopped feeling like one at about six this morning.”',
  ],
  guarded: [
    '“Could be anything. Could be nothing. What do you think?”',
    '“I have a name. I am not going to be the first one to say it.”',
    '“Say yours first and I will tell you if it matches.”',
    '“There is an obvious answer and I do not trust obvious answers.”',
    '“I would rather listen for a day than guess out loud this morning.”',
    '“Everybody is going to have a theory by lunch. I would like mine to be late and right.”',
    '“I noticed something. I am going to sit with it a bit longer.”',
    '“Ask me tomorrow. I will have an answer tomorrow.”',
    '“Whatever I say now gets repeated by dinner, so: no comment, kindly.”',
    '“I think what you think. I am just not saying it at this table.”',
  ],
};

const REFUSE_TO_THEORISE = {
  blunt: [
    '“Somebody is dead and you want to do arithmetic. Not today.”',
    '“No. I am not doing this before breakfast.”',
    '“I am not going to sit here and turn them into a clue. Ask somebody else.”',
    '“Stop. Genuinely, stop. Not everything is a puzzle.”',
    '“You can have this conversation. You can have it somewhere else.”',
    '“I will play the game at the table. I am not playing it over their empty chair.”',
    '“Ask me tonight and I will be brutal about it. Ask me now and I will walk off.”',
    '“That is the fourth theory I have heard this morning and I have had enough of all of them.”',
    '“No. Say their name like a person for one hour, then we can go back to it.”',
    '“I am not speculating about a friend before nine in the morning.”',
  ],
  sharp: [
    '“Everything we say this morning is going to be wrong. Let us be wrong quietly.”',
    '“I have a view. Telling you it now costs me and buys me nothing.”',
    '“The first theory of the day is always the one that sticks and it is usually rubbish.”',
    '“I would rather watch who is theorising than join in.”',
    '“Give it six hours. Grief makes people say things they cannot take back.”',
    '“You are asking me to commit to a read before the evidence has finished arriving.”',
    '“No. Whatever I say now will be quoted at me by Thursday.”',
    '“I am collecting, not concluding. Come back to me.”',
    '“Ask me after the mission. People are honest when they are tired.”',
    '“I will tell you what I think when what I think is worth something.”',
  ],
  warm: [
    '“I cannot. Not this morning. I just want to be sad about it for one hour.”',
    '“Please can we not. Not yet.”',
    '“I know it helps you to talk it out. It is doing the opposite to me.”',
    '“Later. I promise, later. I am not much use right now.”',
    '“Sorry. I keep hearing their voice and I cannot do sums over the top of it.”',
    '“Can we just sit here? I do not want to solve anything for a bit.”',
    '“I want to. I open my mouth and nothing sensible comes out.”',
    '“Ask me at lunch. I will be a person again by lunch.”',
    '“I am not being difficult. I am just really not okay.”',
    '“Give me the morning. You can have the whole afternoon.”',
  ],
  guarded: [
    '“I do not know. That is my answer.”',
    '“Not everything is a clue.”',
    '“I would rather not say.”',
    '“Hm.” And nothing else, for long enough that the question dies.',
    '“You are asking the wrong person. I really did not notice anything.”',
    '“I have not thought about it.” Which is not true, and is said anyway.',
    '“Whatever you think is probably right. I have not got a view.”',
    '“I am going to go and be useful somewhere else.”',
    '“No idea. Sorry.”',
    '“I heard nothing, I saw nothing, and I am extremely tired.”',
  ],
};

const RECEIVE_ADMISSION = {
  blunt: [
    '“Right. Good. That needed saying and none of the rest of us said it.”',
    '“You are not the only one who was wrong. You are the only one who admitted it.”',
    '“Do not do that. Half this castle was on the same side of it.”',
    '“Yeah, you were wrong. So was I. So was everyone at that table.”',
    '“Fine. Owned. Now do something useful with it.”',
    '“I would rather you said that than spent a week not saying it.”',
    '“You were wrong. It happens. Do not carry it about like luggage.”',
    '“Say it once and then stop, because the second time is for you and not for them.”',
    '“That took something. It does not fix anything, and it took something.”',
    '“Good. Now the rest of you can stop pretending you were somewhere else.”',
  ],
  sharp: [
    '“Noted. And I would like to know what changed your mind, because it might change mine.”',
    '“That is useful. Not comforting, but useful — tell me where the read went wrong.”',
    '“You are the only person in this room who has updated out loud. That is worth something.”',
    '“So the source was bad. Which means everything else from that source is bad too.”',
    '“I will take that seriously. I am also going to work out who let it run.”',
    '“Thank you. Now: was that your idea, or was it handed to you?”',
    '“Good. Say it again at the table, because half of them still believe it.”',
    '“That admission has a shape. Somebody built the thing you are apologising for.”',
    '“I respect it and I am still going to ask you three questions about it.”',
    '“That is one mistake accounted for. There are others, and they are not all yours.”',
  ],
  warm: [
    '“That cannot have been easy. Thank you for saying it.”',
    '“You are being harder on yourself than any of us are.”',
    '“Come here. We were all wrong. You just said it first.”',
    '“I am not going to pretend it did not happen. I am glad you said it, though.”',
    '“That is a big thing to say out loud in a room like this.”',
    '“Do not sit with it on your own tonight. Come and find me.”',
    '“You did the decent thing about a week too late, and you still did it.”',
    '“I forgive you, if that is a thing I am allowed to say about this.”',
    '“It is all right. It is not all right, and it is all right between us.”',
    '“I would have done the same. I probably did. Thank you for saying it anyway.”',
  ],
  guarded: [
    '“Okay.” And it is genuinely not clear whether that is acceptance.',
    '“Well. That is one of us.”',
    '“Mm. Thank you for saying so.”',
    '“I heard it. I am going to think about it.”',
    '“That is very honest of you.” Which is not the same as saying it is forgiven.',
    '“Right.” A nod, and a note taken somewhere nobody can see it.',
    '“Everybody was wrong. Some of us were quieter about it.”',
    '“I appreciate the sentiment.” The sentiment is what is being appreciated.',
    '“Fine.” And a seat is not moved closer.',
    '“You did not have to say that.” Said in a way that suggests it changed something.',
  ],
};

/** Every purpose this file can speak, with its four registers. */
const POOLS = {
  'challenge-accusation': CHALLENGE_ACCUSATION,
  'answer-accusation': ANSWER_ACCUSATION,
  'admit-fault': ADMIT_FAULT,
  'theorise-with': THEORISE_WITH,
  'refuse-to-theorise': REFUSE_TO_THEORISE,
  'receive-admission': RECEIVE_ADMISSION,
};

/** The purposes `lineInVoice` knows. For the source rule and for the tests. */
export const VOICE_PURPOSES = Object.keys(POOLS);

/**
 * Deterministic, well-spread index. FNV-1a over the key string.
 *
 * Deterministic because a season replays: two renders of the same episode must
 * produce the same sentence, and `Math.random()` here would put a different
 * line in the VP and in the text backlog for one stored scene, which is the
 * one thing js/vp-tr/screens.js exists to prevent. Spread because the
 * differentiation band in tests/tr-voice.test.js is a birthday problem —
 * a weak hash clusters a register's members onto one line and the band goes
 * red for a reason that has nothing to do with the writing.
 */
function _hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function _fill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null && subs[k] !== '') ? subs[k] : m);
}

/**
 * ONE CONTESTANT, ONE PURPOSE, ONE SENTENCE.
 *
 * `facts` IS READ AND NEVER WRITTEN. That is a contract requirement rather
 * than a style preference: the causal chain is `stored fact -> eligible
 * reaction -> scene cites the fact`, and a voice layer that edited the fact on
 * the way past would make the citation a description of itself. A shallow copy
 * is taken before anything is substituted, and the object handed in comes back
 * untouched — tests/tr-voice.test.js snapshots it and compares.
 *
 * `ctx.seed` (or `ctx.sceneId`) moves the index, so the same person says
 * different things across a season while staying inside their own register.
 * Without one the line is stable per (person, purpose), which is what a unit
 * test wants and what a season must not have.
 */
export function lineInVoice(name, purpose, facts = {}, ctx = {}) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error(`voice lineInVoice: a speaker is a name, got ${JSON.stringify(name)}`);
  }
  const pool = POOLS[purpose];
  if (!pool) {
    throw new Error(`voice lineInVoice: unknown purpose "${purpose}". `
      + `Known: ${VOICE_PURPOSES.join(', ')}`);
  }
  const register = voiceOf(name);
  const lines = pool[register] || pool.guarded;
  const seed = String(ctx.seed ?? ctx.sceneId ?? '');
  const idx = _hash(`${name}|${purpose}|${seed}`) % lines.length;
  // THE COPY. `facts` is the caller's record; `b` defaults to the speaker so a
  // caller that only knows who is talking still gets a filled line.
  const subs = { ...facts };
  if (subs.b == null) subs.b = name;
  return _fill(lines[idx], subs);
}

// ══════════════════════════════════════════════════════════════════════
// WHAT THE ACTION ACTUALLY DID
// ══════════════════════════════════════════════════════════════════════
//
// THE TABLE IS DELIBERATELY SHORT AND DELIBERATELY EXPLICIT. Every entry was
// put here by reading the event's own line pools and deciding that the FAMILY
// register answers the wrong stimulus for that branch. An event not listed
// keeps the register it has always had. Adding a wrong entry produces a wrong
// reaction; adding none produces the behaviour that shipped, which is why this
// is an opt-in list and not a heuristic over the sentence.

/**
 * `eventId` -> branch -> purpose. A `*` branch applies to every branch of
 * that event.
 */
const PURPOSE_TABLE = {
  // js/tr/castle/grief.js — `grief-suspicion-of-timing` is the reviewer's
  // rendered example. Three of its four branches are two people doing
  // forensics about the night's victim; the fourth is one of them refusing to.
  // None of the four is mourning, and all four were answered out of the
  // grief-comfort register ("sits down beside {a} and stays until {a} has
  // stopped" — stopped what).
  'grief-suspicion-of-timing': {
    timing: 'theorise-with',
    'about-to-say-something': 'theorise-with',
    'we-had-it-wrong': 'theorise-with',
    'would-not-play': 'refuse-to-theorise',
  },
  // Also grief.js. `owned-the-mistake` is somebody standing up and saying they
  // were wrong about the person who was taken — an ADMISSION, and the other
  // person in the scene is receiving one, not consoling a mourner.
  'grief-wrongly-suspected-irony': {
    'owned-the-mistake': 'receive-admission',
  },
};

/**
 * The purpose the REACTION card should answer, or null to keep the family
 * register.
 *
 * Reads the scene record's own fields (`eventId`, `branch`) and nothing else —
 * never the composed sentence, because a rule over prose is the heuristic this
 * file replaces.
 */
export function actionPurpose(scene) {
  const byEvent = PURPOSE_TABLE[String(scene?.eventId || '')];
  if (!byEvent) return null;
  return byEvent[String(scene?.branch || '')] || byEvent['*'] || null;
}

/**
 * THE SAME LINE, WITH THE PERSON SAYING IT NAMED.
 *
 * A reaction card must say who is reacting — `tests/tr-castle-prose.test.js`
 * enforces that over every composed card, and it is right to: the establishing
 * card and the reaction card are the two a reader cannot resolve from anywhere
 * else, and bare dialogue in a scene with three people in it is unattributable.
 * `lineInVoice` returns the words alone because that is what a corpus test
 * should measure; this wraps them in an attribution drawn from the same
 * register, so the card reads as television rather than as a transcript.
 *
 * The lead is hashed on a DIFFERENT key from the line, so two people in the
 * same register saying different things are not handed the same lead-in.
 */
export function attributedLineInVoice(name, purpose, facts = {}, ctx = {}) {
  const line = lineInVoice(name, purpose, facts, ctx);
  const leads = ATTRIBUTION[voiceOf(name)] || ATTRIBUTION.guarded;
  const seed = String(ctx.seed ?? ctx.sceneId ?? '');
  const lead = leads[_hash(`${purpose}|${name}|${seed}|lead`) % leads.length];
  return `${_fill(lead, { ...facts, b: facts.b == null ? name : facts.b })} ${line}`;
}

/**
 * How each register arrives at a line. `{b}` is the speaker, so every one of
 * these puts the reacting person's name on the card.
 */
const ATTRIBUTION = {
  blunt: [
    '{b} does not wait for the end of the sentence.',
    '{b} says it flat out.',
    '{b} is not going to be delicate about this.',
    '{b} answers before anybody has finished asking.',
    '{b} puts it plainly, and at volume.',
    '{b} does not lower the volume for it.',
    '{b} cuts straight across.',
    '{b} has been sitting on this since breakfast.',
  ],
  sharp: [
    '{b} takes a beat, then answers.',
    '{b} turns it over once before saying anything.',
    '{b} has clearly been thinking about this.',
    '{b} answers the question underneath the question.',
    '{b} watches {a} while saying it.',
    '{b} chooses the words carefully.',
    '{b} lets the pause do some of the work.',
    '{b} says it quietly, which is worse.',
  ],
  warm: [
    '{b} softens it, and means it.',
    '{b} says it gently.',
    '{b} does not make it harder than it is.',
    '{b} takes it better than {a} expected.',
    '{b} looks straight at {a}.',
    '{b} sits down before answering.',
    '{b} answers honestly, and it costs something.',
    '{b} does not pretend to be fine about it.',
  ],
  guarded: [
    '{b} gives about half of it.',
    '{b} says only this.',
    '{b} answers after a moment.',
    '{b} does not offer anything else.',
    '{b} keeps it short.',
    '{b} shrugs first.',
    '{b} looks somewhere else and says it.',
    '{b} lets a beat go by.',
  ],
};

/** Every (eventId, branch) pair the table declares. For the source rule. */
export function declaredPurposes() {
  const out = [];
  for (const [eventId, branches] of Object.entries(PURPOSE_TABLE)) {
    for (const [branch, purpose] of Object.entries(branches)) {
      out.push({ eventId, branch, purpose });
    }
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// WHETHER THE SCENE WENT BADLY FOR THE PERSON ANSWERING IT
// ══════════════════════════════════════════════════════════════════════
//
// MOVED HERE FROM js/vp-tr/castle-day.js BY TASK 7A, WITH ITS COMMENTS AND
// WITHOUT A SINGLE BRANCH RECLASSIFIED. It arrived as four `Set`s and 560
// lines of hand-sorted reading — "every branch string five real seasons
// produced, read and sorted by hand" — living inside a screen, and Task 7A's
// episode editor needs the identical answer one layer down: a scene's TONE
// (js/tr/episode-editor.js's `sceneTone`) turns on whether the respondent is
// being leaned on, which is precisely what this classification already
// decides. An engine module cannot import a VP module, and a second copy of a
// 130-branch denylist is the drift this project has shipped once already.
//
// castle-day.js imports them straight back and still exports `BRANCH_TONES`,
// so the coverage arm in tests/tr-castle-prose.test.js — the one that goes red
// when a new branch appears on neither list — is measuring the same objects it
// always was.
export const ADVERSE_OUTCOMES = new Set(['test-exposed', 'failed-maliciously', 'exposed',
  'broken-up', 'confessed-unrelated']);
export const SMOOTH_OUTCOMES = new Set(['denied-convincingly', 'passed-clean',
  'defended-by-history', 'turned-back', 'buried', 'became-showmance']);
export const ADVERSE_BRANCHES = new Set([
  // ── THE LAST THREE REACHABLE CELLS (carry-on.js, 2026-09-06) ────────
  //
  // Being asked about an account where you cannot sit down, losing it to a
  // third pair of ears, being caught setting a test, and an answer better
  // than the question deserved. In each the person opposite is under it.
  'answered-too-well', 'asked-about-it-out-there',
  'somebody-else-was-there', 'they-saw-it-coming',
  // ── THE CONTINUATIONS (js/tr/castle/carry-on.js, 2026-09-06) ────────
  //
  // Five events written to fill the advancer holes in `morning` and
  // `journey-out`. These are the branches where the person opposite is
  // under something: an account that grew, a test failed the second time,
  // a gap found on the road, a dead player enlisted into an argument.
  'failed-it-this-time', 'found-the-hole', 'one-of-them-retreated',
  'refused-to-play', 'somebody-else-checked', 'stopped-telling-it',
  'tested-it-again', 'the-story-grew', 'turned-it-to-use',
  // ── THE AFTERNOON THAT WENT WELL (js/tr/castle/mission-fallout.js) ──
  //
  // The three from that batch where somebody IS under something: two people
  // who could not get out of each other's way, competence turned into an
  // accusation, and a team result told in the first person all the way home.
  // `too-soon` belongs here too and is already on the list.
  'found-it-suspicious', 'got-in-the-way', 'took-the-credit',
  // ── THE GROUP SCENES (js/tr/castle/group.js, 2026-09-05) ────────────
  //
  // A room, not a pair. Sorted on the same rule: adverse means somebody is
  // being leaned on, and in a group that is the person the other two have
  // already agreed about, the one who came apart under three questioners,
  // or the one walked away from on a road.
  'agreed-who-cost-them', 'blamed-each-other', 'came-apart',
  'left-somebody-out', 'picked-up-a-stray', 'the-room-split',
  'the-room-turned', 'two-against-one',
  // ── THE ROMANCE FAMILY ON THE ROAD (2026-09-05) ─────────────────────
  //
  // Sorted on this family's own precedent rather than on the confrontation
  // rule: `refused-the-pact` and `one-sided-pact` are already adverse here,
  // so a cold, one-sided or rebuffed outcome is the adverse register for
  // romance even though nobody is being interrogated. `let-them-struggle`
  // belongs to this set too and is already on it from journey.js.
  'kept-apart-on-purpose', 'made-a-performance-of-it', 'they-refused-it',
  'wrote-different-names',
  // ── THE SEVEN CONFRONTATION EVENTS ADDED 2026-09-05 ─────────────────
  //
  // The family was four events and every one of them in `evening`, so the
  // loudest thing this format does could only happen in one hour of the day.
  // These are the branches where somebody IS under it: an accusation that
  // lands at breakfast, a vote nobody will account for, an argument with
  // five miles left to run, a promise denied to the face of the person it
  // was made to.
  'blamed-somebody-else', 'blamed-them-back', 'denied-saying-it',
  'everybody-heard-it', 'made-it-worse', 'made-it-worse-for-them',
  'named-the-weak-link', 'ran-the-whole-way', 'room-took-sides',
  'said-it-cold', 'threw-it-back', 'turned-it-on-them', 'would-not-answer',
  // ── the road out (js/tr/castle/journey.js) ──────────────────────────
  //
  // The five where somebody is on the receiving end of it: an argument
  // carried out of the castle and had in front of a walking column, one that
  // had to be broken up, one swallowed and still felt, being left to carry
  // your own load for a mile, and being the person nobody would walk beside.
  'straight-back-into-it', 'in-front-of-everybody', 'somebody-stepped-in',
  // NOT `swallowed-it`: that branch name already lives in BENIGN, grouped
  // with 'let-it-pass' and 'ended-kindly', and the sense carries over — a
  // row somebody holds in is a row the other person never has to take.
  'let-them-struggle', 'walking-alone',
  // a circle-mate was revealed a Traitor and the circle came apart, not together
  // (after-the-circle-harboured-one; its 'closed-ranks' branch is BENIGN below)
  'who-else', 'couldnt-see-it', 'cut-loose',
  // an alliance came apart (trust-circle-breaks; 'talked-through' is BENIGN,
  // 'turned-cold' is already listed below)
  'drifted', 'severed',
  // the story did not survive contact
  'awkward', 'broke', 'collapses', 'frayed', 'overcooked', 'slip', 'suspicious',
  'tell', 'wobbles', 'nearly', 'sleepless', 'sacrificed-ally',
  // the mourning turned into an accusation, or into paranoia
  'blamed-room', 'wrongly-suspected-irony', 'awake-paranoid', 'opportunistic',
  // it went wrong, and in public
  'broke-up', 'confronts', 'exposes', 'jealousy', 'showmance-fight', 'called-strategic',
  // the doubt got sharper rather than softer
  'caught', 'cracks', 'confess', 'crosschecked', 'hardened', 'denyWeak',
  'revived', 'turned', 'redirects', 'overheard',
  // they failed it, or worked out that it was one
  'caughtTest', 'failed', 'malicious', 'got-rattled', 'inconsistent', 'refused',
  'refuses', 'reluctant', 'chased',
  // it did not hold
  'broken', 'deflected', 'dropped', 'leakedAccident', 'leakedDeliberate', 'soured',
  // FIX ROUND 2 — the six the coverage arm below was built to surface, plus one
  // more found while classifying: an evasive answer is an answer that went badly
  // for the person giving it.
  'awake-desperate', 'grudge-resurfaced', 'dissonance', 'slipped', 'unresolved',
  'overcorrected', 'hedged',
  // and the ones the coverage arm surfaced on its first run
  'disappointment', 'grudge', 'left-out', 'rivalry-carried-over', 'warned',
  // ── TASK 7 STAGE 1: RE-READ AND MOVED OFF THE BENIGN LIST ──
  //
  // `strategic` (callback-history-confrontation) was classified benign in fix
  // round 2 on the strength of its NAME. Reading the branch says otherwise, and
  // both halves of the evidence point the same way:
  //
  //   - it writes `bondDelta = -1`. It is the only branch on the benign list
  //     that moves a bond DOWN. A scene the screen answers as smooth while the
  //     engine records a relationship getting worse is the exact card-contradicts-
  //     the-card-under-it defect ADVERSE_BRANCHES was introduced for.
  //   - all four of its authored lines are veiled threats, not neutral
  //     strategy: "the history between them was a card {a} could play whenever
  //     they wanted", "treated the whole thing like leverage, and {b} clocked
  //     exactly what was happening", "{a} simply mentioned that they remembered
  //     it well", "People here don't know that story yet ... and left it
  //     hanging."
  //
  // The respondent is being leaned on. REACT_ADVERSE is the register that
  // answers that, so this belongs here. `strategic` is produced by
  // callback-history-confrontation and by nothing else in the pool, so the move
  // is confined to that event.
  'strategic',
  // ── TASK 7 STAGE 3: THE `journey-back` LIBRARY, CLASSIFIED BY READING ──
  //
  // The mission-fallout window went from six events to twenty and from 0.70
  // scenes an episode to 4.36, so this list and the one below grew by 67
  // branches at once. Every one was read — its authored lines AND its bond
  // delta — and sorted by ONE question, which is the question `_tone` is
  // actually asking: IS THE PERSON ANSWERING THIS SCENE BEING LEANED ON? A
  // branch is adverse when the respondent is under pressure, refuses the
  // conversation, is caught short, or when the scene leaves the two of them
  // worse off. Everything else is smooth. The bond delta is the corroborating
  // evidence rather than the rule — which is the lesson `strategic` above
  // taught, in the other direction.
  //
  // The refusals and the stonewalls (the respondent will not have the
  // conversation, and the asker leaves with nothing):
  'kept-it-back', 'let-it-alone', 'one-sided', 'refused-it', 'shrugged',
  'shrugged-off', 'talked-past-it', 'thin-answer', 'unimpressed',
  // The account did not survive being asked about, or was volunteered at
  // somebody's own expense:
  'blank', 'gap', 'thin', 'overtold',
  // It became an argument, and the two of them came home worse off:
  'angry', 'bitter', 'divided-it', 'ended-badly', 'split', 'strained',
  'turned-sharp', 'boasted',
  // The past was used as a weapon, or answered as one:
  'defended-the-hour', 'old-account', 'not-that-person', 'still-that-person',
  'used-it',
  // `useful` is `mission-a-body-short`'s branch where the missing person is
  // brought up in order to get at somebody who is still here. Its own last
  // line is "{b} noticed that {a} only ever mentioned the dead when {a} wanted
  // something from the living", and it writes a bond of -1. The respondent is
  // being worked on.
  'useful',
  // Nobody else there, and it landed badly anyway. `caught-up-with-it` is the
  // solo road-home branch where the day catches up with somebody — it also
  // writes `setEmotionalState(..., 'paranoid')`, so a smooth register here
  // would contradict the state the same firing recorded.
  'caught-up-with-it',
  // ── TASK 7 STAGE 4: THE TWO WINDOWS EITHER SIDE OF A BANISHMENT ───────
  //
  // `after-table` went from fourteen events to twenty-five and `night` from
  // seven to twelve, and twelve events already in those two windows were
  // rewritten off the audit's REWRITE list from one or two branches to four,
  // so these two lists grew by ninety-seven branches at once. Every one was
  // read — its authored lines AND its bond delta — and sorted on the same
  // single question stage 3 used, which is the question `_tone` is actually
  // asking: IS THE PERSON ANSWERING THIS SCENE BEING LEANED ON? Adverse when
  // the respondent is under pressure, refuses the conversation, is caught
  // short, or the scene leaves the two of them worse off. The bond delta is
  // corroborating evidence and not the rule, which is the lesson `strategic`
  // taught in the other direction.
  //
  // The ballot was put to somebody and the answer did not survive it:
  'denied-it', 'flat-denial', 'overclaimed', 'made-it-a-price',
  // A refusal, a silence, or a door closed on the person asking:
  'would-not-say', 'would-not-say-it', 'went-quiet', 'let-it-stand',
  'could-not', 'let-it-lie', 'promised-nothing', 'kept-out',
  // It turned into a confrontation, and the respondent is answering it:
  'asked-them-why', 'asked-about-it', 'asked-outright', 'one-of-us-is-lying',
  'picked-it-up', 'moved-off', 'never-with-me', 'disagreed', 'told-somebody',
  // `one-way` is the rewritten `trust-trade-reads` branch where one of them
  // pays and the other does not. It sits beside `one-sided` above, which is
  // the identical shape on the road home, for the identical reason.
  'one-way',
  // The scene left the two of them worse off, or ended something:
  'pressed-it', 'turned-cold', 'could-not-agree', 'one-of-them-lied',
  'reopened-it', 'kept-the-score', 'one-sided-pact', 'refused-the-pact',
  'hollow', 'faded-out', 'ended-in-strategy', 'half-kept-it', 'dropped-it',
  'clocked-the-check', 'saw-through-it', 'turned-it-round', 'overdid-it',
  'overexplained', 'defended-the-vote',
  // The mourning turned into an accusation. `angry-at-the-room` is the same
  // shape as `blamed-room` above and sits with it deliberately.
  'angry-at-the-room', 'named-the-wrong-one',
  // Nobody there to be leaned on, and it landed badly anyway. Both of these
  // write `setEmotionalState(..., 'paranoid')` in the same firing, so a smooth
  // register would contradict the state the scene itself recorded — the rule
  // `caught-up-with-it` is on this list for.
  'rattled', 'counted-them',
  // `conditional` is `after-i-need-you-tomorrow`'s answer-with-air-in-it. It
  // sits beside `hedged` above, which is the identical move in the identical
  // hour, and writes a bond delta of exactly zero for the same reason.
  'conditional',
  // ── TASK 7 STAGE 5: `defended` MOVED OFF THE BENIGN LIST ──────────────
  //
  // Stage 4 checked this branch, agreed the argument for moving it was good,
  // and left it because the two events that produce it are in windows stage 4
  // did not own and it had no measurement of them. This stage owns
  // `journey-out` and has one, so the decision is made rather than deferred.
  //
  // THREE THINGS, ALL POINTING THE SAME WAY:
  //
  //   1. IT IS INCOHERENT WITH ITS OWN EVENT. `mission-what-cost-us` produces
  //      both `shrugged` and `defended`. `shrugged` -- the respondent declines
  //      to be drawn, bond delta -0.5 -- is already adverse. `defended` is the
  //      same refusal delivered harder, at a bond delta of -1. A screen that
  //      answers the softer refusal in the adverse register and the harder one
  //      smoothly is saying two different things about one scale.
  //   2. THE BOND DELTA. Both producing events write -1. That is the criterion
  //      stage 1 used to move `strategic` off this list, and it is the only
  //      branch left on it that moves a bond down by a whole point.
  //   3. THE AUTHORED LINES ARE A DOOR CLOSED ON THE PERSON ASKING:
  //      "{b} shut it down flat"; "{b} told {a} to leave {c} alone ... much
  //      harder than the question deserved"; "You want to hang somebody for
  //      that?"; "Go on, then. Tell me you would have managed it."
  //
  // Produced by `susp-out-of-earshot` (journey-out) and `mission-what-cost-us`
  // (journey-back) and by nothing else in the pool, so the move is confined to
  // those two.
  'defended',
  // ── TASK 7 STAGE 5: THE REWRITE BATCHES ──────────────────────────────
  //
  // Seventy-five branches at once, from twenty-one events rewritten off the
  // audit's REWRITE list plus the six solo branches this stage added to widen
  // starving windows. Every one was read -- its authored lines AND its bond
  // delta -- and sorted on the same single question stages 3 and 4 used, which
  // is the question `_tone` is actually asking: IS THE PERSON ANSWERING THIS
  // SCENE BEING LEANED ON? The bond delta is corroborating evidence and not
  // the rule.
  //
  // The answer was hollow, or had air in it, or was a price:
  'air-in-the-answer', 'asked-for-a-name', 'asked-it-back',
  // A refusal, or a door closed on the person asking:
  'would-not-join-in', 'would-not-promise', 'did-not-take', 'walked-it-off',
  // It became an argument, or one of them was caught inside their own answer:
  'argued-about-it', 'one-of-us-was-there', 'put-each-other-on-it',
  // The respondent was worked on, taken from, or made a subject of:
  'came-back-round', 'took-it-away', 'kept-it', 'made-it-strategy',
  'told-somebody-else', 'went-to-them', 'asked-for-it',
  // The move was seen to be a move, which is the worst outcome it has:
  'too-obvious', 'too-specific', 'read-it-wrong',
  // The two of them came away worse off, or something old was reopened cold:
  'regretted-it', 'still-owed',
  // Nobody there to be leaned on, and it wrote `setEmotionalState(...,
  // 'paranoid')` in the same firing -- the rule `rattled` and `counted-them`
  // are on this list for.
  'came-down-angry',
  // `awake-unfounded` is `grief-nobody-sleeps` on a nervy mood with NO ballot
  // behind it (fix round 1, C3) — an override-set paranoia, or an episode with
  // no Round Table yet. It is a solo scene, so nobody is being leaned on; it
  // sits here rather than on the benign list for the same reason
  // `came-down-angry` above does, which is that the firing's own state is
  // paranoid and a smooth consequence card would contradict it.
  'awake-unfounded',
  // ── TASK 7 STAGE 6: THE REMAINING REWRITES ───────────────────────────
  //
  // The last of the audit's REWRITE list, plus the KEEP-list events whose
  // branch sets were widened to close the repetition ceiling. Sorted on the
  // same single question stages 3, 4 and 5 used, which is the question `_tone`
  // is actually asking: IS THE PERSON ANSWERING THIS SCENE BEING LEANED ON?
  // The bond delta is corroborating evidence and not the rule.
  //
  // A private thing was put to somebody's face, or taken to a third party who
  // did not ask for it. `showed-somebody` and `told-somebody-else` above are
  // the same move and sit together deliberately:
  'put-it-to-them', 'showed-somebody', 'asked-what-it-was', 'asked-them',
  'showed-them-the-list', 'named-it-to-them',
  // The direction of the scene reversed and the person who started it is now
  // the one answering for it — the shape `put-each-other-on-it` is on this
  // list for:
  'caught-them-looking', 'nobody-asked-you', 'called-it-out',
  // A refusal, or a door closed on the room:
  'walked-away', 'would-not-take-it', 'shut-it-down',
  // The respondent came apart, or was taken from, or heard themselves:
  'admitted-something-else', 'caught-themselves', 'gave-it-up',
  // It was produced and it landed on the floor, which is a scene going badly
  // for the person who produced it and an accusation for the person it names:
  'nobody-cared',
  // ── AND THE ROMANCE BATCH ────────────────────────────────────────────
  //
  // The respondent was put under the room's eye, or split from their partner
  // and asked apart, or told to stop. `asked-not-to` and `did-not-step-in`
  // both REVERSE the direction — {b} speaks and {a} answers for it — which is
  // why they are adverse even though the person being answered is the one who
  // meant well:
  'too-loud', 'asked-not-to', 'did-not-step-in', 'asked-separately',
  // The account came apart, or was refused, in front of people:
  'did-not-match', 'refused-to-vouch',
  // The couple turned on each other, or on a name, and came away worse off.
  // `went-cold` is the quiet version and is the more adverse of the two:
  'went-cold', 'about-the-vote',
  // A refusal, delivered kindly, is still a door closed on the person asking
  // — the shape `refused-the-pact` is on this list for:
  'too-soon',
  // Somebody else's sentence got inside the two of them, which is what it was
  // sent to do:
  'it-landed-inside',
  // ── AND THE TRUST BATCH ──────────────────────────────────────────────
  //
  // An honest read handed straight back, or asked for back, or priced before
  // it was given — three different ways for a confidence to cost the person
  // who offered it, and in all three the respondent is answering a demand:
  'defended-them', 'took-it-back', 'made-them-pay-first',
  // An answer with a clause in it, or a promise that needed making twice.
  // `with-one-exception` sits beside `conditional` and `hedged` above, which
  // are the identical move, and `said-it-again` is a doubt wearing a
  // reassurance:
  'with-one-exception', 'said-it-again',
  // A refusal, however gently delivered, is still a door closed on the person
  // asking — the shape `refused-the-pact` and `too-soon` are on this list for:
  'could-not-be-near-anyone', 'not-this-week', 'declined',
  // The offer was accepted and immediately priced, which is `made-it-a-price`
  // in an evening rather than at a ballot:
  'asked-what-it-costs',
  // ── AND THE JOURNEY BATCH ────────────────────────────────────────────
  //
  // Somebody walked away, or declined to be walked with, or would not have the
  // conversation at all. All three are a door closed on the person who started
  // it, and the first two also reverse who is left standing there:
  'fell-behind', 'would-not-be-picked', 'would-not-talk-about-it',
  // The road took more out of the respondent than they meant to give:
  'said-too-much',
  // The test was turned round and the person who set it is now sitting it —
  // the same shape as `put-each-other-on-it` and `caught-them-looking`:
  'turned-it-around',
  // The account came apart in the person's own mouth, which is the solo
  // exception this list already carries `rattled` for — except that this one
  // is adverse on its own content rather than on a state write: the cover
  // story is the scene, and it failed:
  'could-not-get-it-straight',
  // ── AND THE GRIEF BATCH ──────────────────────────────────────────────
  //
  // Somebody claimed a dead person's place in front of the room, or would not
  // clear them of anything, or moved away from the person standing next to
  // them. In all three the other party is the one left holding it:
  'took-their-chair', 'still-think-we-were-right', 'sat-apart',
  // The grief turned into an accusation, at the room or at one person, which
  // is the shape `blamed-room` and `angry-at-the-room` are on this list for:
  'named-a-number', 'turned-on-them', 'turned-on-each-other',
  // A refusal to have the conversation at all:
  'would-not-play',
  // Somebody was mourned beside rather than with, and both of them felt the
  // gap. It is not unkind and it is not smooth either — what the respondent
  // experiences is being got slightly wrong all morning:
  'one-sided-grief',
  // The sentence was true, landed badly, and could not be taken back:
  'said-it-and-regretted-it',
  // ── AND THE CALLBACK BATCH ───────────────────────────────────────────
  //
  // The offer was refused, or accepted only in a much smaller version, and the
  // person who made it is the one left holding the difference:
  'not-the-same-terms', 'would-not-spend-it',
  // An old debt was named, or priced, or produced in front of people. All
  // three lean on the person it is about:
  'said-it-once-and-stopped', 'wants-something-for-it',
  // The defence did not work, or worked and cost them both. `now-they-are-a-
  // pair` sits beside `too-loud` above, which is the identical outcome in a
  // different family:
  'history-is-not-evidence', 'now-they-are-a-pair',
  // The warning was handed back, or spent. `used-it-immediately` is the same
  // shape as `told-somebody-else`:
  'defended-them-instead', 'used-it-immediately',
  // Somebody was watched, counted or put together by a room with no evidence:
  'somebody-noticed', 'the-room-got-there-first', 'the-room-priced-them',
  // One of them has moved on and the other has not, and the not-moving-on is
  // the whole scene:
  'one-of-them-still-is',
  // The room was told, to its face, that its history is worth nothing:
  'made-a-virtue-of-it',
  // ── AND THE COVER BATCH ──────────────────────────────────────────────
  //
  // A refusal, and in both cases the person refused is the one left holding
  // it — `would-not-take-it` is somebody declining to be spent in public and
  // `would-not-square-it` is somebody declining to be managed at dawn:
  'would-not-take-it', 'would-not-square-it',
  // The move worked and could not be stopped afterwards, which is the worst
  // outcome the manoeuvre has:
  'the-room-kept-it',
  // The account was heard to be an account, or was checked behind the
  // teller's back, or was volunteered at their own expense:
  'too-identical', 'checked-against-somebody', 'told-it-unasked',
  // Somebody else had already told the story, and the teller found out from
  // the room:
  'they-told-it-first',
  // ── AND THE TESTING / CALLBACK TAIL ──────────────────────────────────
  //
  // The test was named out loud, or turned round on the person running it.
  // These four all REVERSE the direction — the tester becomes the respondent —
  // which is exactly the shape `put-each-other-on-it` and `caught-them-looking`
  // are on this list for:
  'named-the-test', 'asked-why-twice', 'out-waited-them', 'asked-to-be-let-off',
  // A refusal to answer the same question twice:
  'would-not-repeat-it',
  // The check leaked, or found a room that would not be drawn. In both the
  // person tested comes away knowing they were tested:
  'got-back-to-them', 'nobody-would-say',
  // CONFRONTATION (confrontation.js). The person it was aimed at came off
  // badly: they folded, or it detonated in the open. (`turned` is already
  // above; `held` is benign.) `crumbled` is the pile-on's fold; `drew-fire` is
  // the defender who pulled the room onto themselves.
  'cracked', 'blew-up', 'crumbled', 'drew-fire',
]);
/**
 * AND EVERY OTHER BRANCH, SAID OUT LOUD.
 *
 * FIX ROUND 2, and it is the fix my own round-1 concern asked for. `_tone`
 * treats anything not on the adverse list as smooth, which means an unknown
 * branch and a known-harmless branch are indistinguishable — the design could
 * not tell "we have looked at this and it is fine" from "we have never seen
 * this". Measured: five seasons produce over 130 distinct branch strings; the
 * adverse list held 44 and every one of them was hit, so it was not stale, but
 * 90-odd fell through in silence and six of those were genuinely adverse.
 *
 * So the fallback is noisy now. This is a DENYLIST rather than a heuristic:
 * every branch the castle can produce must appear on one list or the other, and
 * `tests/tr-castle-prose.test.js` fails on any that appears on neither. Task 7
 * adds branches, and the day it does, that arm goes red and somebody classifies
 * them — which is the whole point.
 */
export const BENIGN_BRANCHES = new Set([
  // ── AND THE HALF OF THE SAME THREE THAT PRESS NOBODY ────────────────
  //
  // Rehearsing an account to yourself on a road, counting the column at the
  // gate, saying a dead player's name out loud for two miles, a test that
  // came back blank.
  'counted-the-column', 'let-it-lie-out-there', 'nobody-said-the-name',
  'nothing-to-read', 'rehearsed-on-the-walk', 'set-it-over-breakfast',
  'talked-about-them-walking', 'walking-where-they-walked',
  // ── AND THE CONTINUATIONS THAT PRESS NOBODY ─────────────────────────
  //
  // Same five events. Grief shared without either of them meaning anything
  // by it, an account told the same way twice, a thing said again in
  // daylight, a doubt rested rather than asked again.
  'admitted-it-in-daylight', 'let-it-cool', 'nothing-changed-in-daylight',
  'passed-it-again', 'shared-it-properly', 'still-carrying-it',
  'told-it-the-same', 'was-talked-round',
  // ── AND THE WARM HALF OF THE SAME FOUR EVENTS ───────────────────────
  //
  // The register this file did not have. Its fourteen existing events run
  // "what cost us", "a body short", "who was where" — an afternoon is also
  // the only time these people do something TOGETHER, in daylight, with a
  // shared result, and none of that had a scene. Nobody opposite is under
  // anything in any of these, including the ones that cost a bond.
  'admired', 'blamed-the-set-up', 'enjoyed-it', 'found-they-worked',
  'laughed-about-it', 'noted-it-quietly', 'one-of-them-carried-it',
  'polite-and-nothing', 'shared-it-out', 'too-visible',
  'went-quiet-about-it', 'wished-it-had-been-them',
  // ── AND THE GROUP SCENES WHERE NOBODY IS UNDER ANYTHING ─────────────
  //
  // A room that agrees, a room that cannot, a kitchen that says nothing, a
  // late night where three people tell each other true things. Several of
  // these are bleak and none of them presses the person opposite, which is
  // what this list sorts on.
  'broke-up-with-nothing', 'counted-it-out-loud', 'heard-something',
  'held-the-room', 'landed-on-one', 'nobody-mentioned-it',
  'nobody-wanted-to-go-up', 'nobody-would-start',
  'one-of-them-defended-them', 'one-of-them-left-early',
  'protected-one-of-them', 'said-it-first', 'said-nothing-useful',
  'somebody-said-nothing', 'told-each-other-things',
  'traded-what-they-had', 'walked-as-a-block', 'went-over-the-afternoon',
  'went-to-bed-on-it',
  // ── AND THE WARM HALF OF THE SAME THREE EVENTS ──────────────────────
  //
  // Walking a road together, being got home off one, voting the same name,
  // spending a slate to keep somebody out of danger. Public, in several
  // cases costly, and in none of them is the person opposite under
  // anything.
  'covered-for-them', 'first-hour-alone', 'one-of-them-was-in-danger',
  'the-column-saw-it', 'took-care-of-them', 'walked-the-whole-way',
  'wrote-the-same-name',
  // ── AND THE ONES FROM THE SAME SEVEN THAT DO NOT LEAN ON ANYBODY ────
  //
  // Same events, sorted on this file's rule rather than on how loud the
  // scene is: an accusation that fizzles, a room that shuts it down, a
  // corridor that ends with the air cleared, somebody taking the blame
  // themselves. Nobody opposite is being pressed in any of these.
  'admitted-it', 'both-embarrassed', 'cleared-the-air', 'had-a-reason',
  'nobody-backed-it', 'nobody-heard-it', 'ran-out-of-road',
  'said-it-plainly', 'said-what-they-meant', 'shut-down',
  'the-column-broke-it-up', 'told-them-to-stop', 'too-raw',
  'took-the-blame',
  // ── the scenes one person has (js/tr/castle/alone.js) ───────────────
  //
  // Solo scenes have no respondent, so none of them can be adverse in this
  // file's sense — there is nobody being leaned on. They are somebody thinking
  // on a road, waiting for a table, or sitting with a result.
  'went-over-it', 'noticed-the-quiet', 'let-it-go',
  'decided-early', 'still-deciding', 'dreading-it',
  'was-right', 'was-wrong', 'counting-the-cost',
  // ── AND THE SIXTEEN SOLO EVENTS ADDED ON 2026-09-05 (same file) ─────
  //
  // Same rule, applied whole: a scene with one actor in it has no
  // respondent, so there is nobody for the register to be adverse TOWARDS.
  // Several of these read bleak — lying awake counting the room against you,
  // being unable to hold the pace on the road home, noticing the hall cool
  // around you — and bleak is not what this list sorts on. `_tone` picks the
  // register the SCREEN speaks in, and the register for one person alone
  // with a thought is the smooth one however bad the thought is.
  'afraid-of-the-morning', 'already-working', 'brought-it-home',
  'certain-of-someone', 'could-not-keep-up', 'could-not-sleep',
  'counted-them-in', 'decided-to-say-nothing', 'deliberately-behind',
  'did-not-notice', 'dreading-the-mission', 'gave-up-tracking',
  'glad-to-be-out', 'got-on-with-it', 'had-the-room', 'holding-it',
  'kept-the-place', 'looked-at-it-properly', 'no-plan-at-all',
  'nobody-came', 'not-sure-it-counts', 'not-thinking-about-it',
  'nothing-changed', 'one-vote-bothering-them', 'people-are-cooler',
  'people-are-warmer', 'practised-it', 'read-the-ballots',
  'said-nothing-going-up', 'sat-somewhere-else', 'shook-it-off',
  'slept-fine', 'stayed-down', 'stopped-counting', 'straight-up',
  'the-empty-rooms', 'took-the-back', 'took-the-front',
  'took-the-long-way', 'watched-them-come-in', 'went-over-tomorrow',
  'went-through-it-again', 'went-where-put', 'what-it-has-cost',
  'why-they-came', 'wrote-it-down',
  // ── AND THE FOURTH BRANCH EACH OF THEM GAINED ───────────────────────
  //
  // Task 11's completeness bar is four branches and the nineteen above
  // shipped with three; each of these is the fork that was added, on a
  // different driver from its siblings. Same rule as the block above: one
  // actor, no respondent, nothing for the register to be adverse towards.
  // `voted-against-the-room` and `took-the-chair` are the two that look
  // hardest and are still BENIGN here -- a person sitting alone with what
  // they did is not a person leaning on anybody.
  'being-managed', 'came-back-decided', 'changed-their-mind',
  'checked-their-own-record', 'counted-the-doors',
  'counted-who-did-not-look', 'decided-to-go-first', 'decided-who-to-tell',
  'did-the-arithmetic', 'not-worried-tonight', 'set-the-pace',
  'took-the-chair', 'voted-against-the-room', 'walked-it-like-a-race',
  'walked-off-the-path', 'wanted-to-go-home', 'went-up-with-a-decision',
  'wished-they-had-waited', 'worked-out-a-move',
  // ── AND THE FOURTH BRANCH THE SHORT EVENTS GAINED (2026-09-05) ──────
  //
  // Eleven events across confrontation/cover/journey/testing/trust shipped
  // with three branches against Task 11's bar of four. Sorted on this file's
  // own rule -- adverse means the RESPONDENT is being leaned on, not that the
  // scene is bleak. A defence that arrives late, a silence under a question,
  // a day nobody asked, a trade that was not returned: nobody in any of those
  // is being pressed by the person opposite.
  'too-late', 'stopped-talking', 'nobody-asked', 'the-gap-in-the-middle', 'needed-carrying', 'never-raised-it', 'asked-for-one-back', 'misread', 'refused-to-trade',
  // ── the road out (js/tr/castle/journey.js, four events) ─────────────
  //
  // Sorted by the rule this file runs on: adverse means the RESPONDENT is
  // being leaned on. Raising an old thing where the castle cannot hear it,
  // taking the weight off somebody, reading the shape of the column — the
  // person opposite is being talked to, helped, or looked at, not pressed.
  'said-it-out-there', 'took-the-weight', 'made-a-point-of-it',
  'read-the-order', 'the-wrong-pair',
  // ── the morning nobody was taken (quiet-night-full-table) ───────────
  //
  // All four, and the classification is not a shrug. This scene is two people
  // arriving at a theory TOGETHER about a full table: nobody is accused,
  // nobody is asked to account for themselves, and the bond goes up on every
  // branch. `somebody-was-safe` is the one that looks adverse and is not --
  // it is the pair getting NEAREST THE TRUTH, and the person it is about is
  // not in the conversation. Adverse means the respondent is being leaned on,
  // and in this scene the respondent is being agreed with.
  'counted-twice', 'they-faltered', 'somebody-was-safe', 'a-message',
  // an alliance aired its strain and survived (trust-circle-breaks)
  'talked-through',
  'agreed', 'airtight', 'alibi-built', 'awake-content', 'blended-in',
  'buried', 'carried', 'checked-in', 'checks-out', 'circle', 'cleared', 'cold-read',
  'complied', 'confided', 'confirmed', 'consistent', 'convincing', 'cried-alone',
  'denies', 'double-bluffed', 'empty-chair', 'favor-returned',
  'feigned-fear', 'flattered', 'followed-through', 'grief-spark', 'headcount-pair',
  'headcount-solo', 'heard', 'held', 'holds', 'huddled', 'imagined', 'inconclusive',
  'innocent', 'invited-in', 'keepsake', 'kept', 'keptQuiet', 'let-it-go',
  'misread-calm', 'mourn', 'noticed', 'numb', 'oblivious', 'pact', 'pair-again',
  'pair-first', 'planted', 'probed', 'protected', 'quiet', 'reassured',
  'recruit-story-kept', 'rehearsed', 'reseated', 'road-spark', 'serviceable',
  'shape-guessed', 'shape-redrawn', 'shared-alibi', 'shared-mourning',
  'shared-suspicion', 'shield-pact', 'showmance-formed', 'showmance-on-the-road',
  'solo-again', 'solo-first', 'sparked', 'stayed-calm', 'steady', 'stoic', 'sworn',
  'timing', 'toasted', 'tracked-since', 'traded-reads', 'transactional',
  'vowed-silence', 'walked-back-together', 'wary', 'whispered',
  // and the ones the coverage arm surfaced on its first run
  'alliance-reformed', 'alumni-bond', 'buries', 'defended-by-history', 'recognized',
  'reconciles', 'redemption', 'reunion-spark', 'sincere', 'synchronized',
  // ── TASK 7 STAGE 3: THE `journey-back` LIBRARY (see the note above) ────
  //
  // Two people agreed, or worked something out, or simply had a decent hour of
  // it. Nobody in these is being leaned on.
  'agreed', 'agreed-for-different-reasons', 'agreed-quietly', 'already-past-it',
  'answered', 'asked-back', 'carried-inside', 'closed-ranks', 'compared-clean',
  'counted-it', 'counted-the-cost', 'credited', 'did-not-mention-it', 'easy',
  'joked', 'named-them', 'not-yet', 'pinned', 'professional', 'quietly-dropped',
  'redirected', 'said-out-loud', 'same-page', 'saw-it-happen', 'settled-it',
  'solid', 'straight-answer', 'suspicious-of-eager', 'told-them', 'traded',
  'unasked', 'walked-in-holding', 'watched',
  // And the solo road-home branches, where there is nobody to be leaned on by.
  // `on-their-own` is private grief and sits beside `cried-alone` above for
  // exactly the same reason: grief landing is not a scene going badly.
  'alone', 'nothing-doing', 'on-their-own', 'sorting-it', 'straight-through',
  // ── TASK 7 STAGE 4: THE TWO WINDOWS EITHER SIDE OF A BANISHMENT ───────
  //
  // See the long note on the adverse list above for the rule these were sorted
  // by. Everything here is a scene in which nobody is under pressure: an
  // honest answer, a kindness, an arrangement both of them wanted, or one
  // person alone with something.
  //
  // The ballot was asked about and answered straight:
  'owned-it', 'named-the-others', 'reassured-it', 'counted-my-own',
  'blamed-the-loudest', 'credit-where-due', 'who-knew', 'next-one',
  'worked-the-room', 'answered-it', 'dismissed', 'got-it-right',
  'stood-by-it', 'walked-it-back', 'with-me-again', 'came-across',
  // Grief that landed, and did not turn into anything else:
  'mourned', 'relieved', 'guilty', 'moved-their-things', 'talked-about-them',
  'own-ballot',
  // Two people agreed something, or simply had a decent hour of it:
  'quietly-pleased', 'worried-by-it', 'made-it-a-plan', 'made-a-plan',
  'said-it-out-loud', 'joked-about-it', 'agreed-a-line', 'ordinary', 'funny',
  'kind', 'same-name', 'noticed-and-said-so', 'refused-it-back',
  'called-a-truce', 'useful-rivalry', 'agreed-to-be-strangers',
  'ended-kindly', 'let-it-pass', 'laughed-it-off', 'was-welcomed',
  'swallowed-it', 'made-a-condition',
  // `performed-it` is the Traitor branch of `after-somebody-goes-tonight`,
  // and it sits here for the same reason `feigned-fear` does: what the
  // RESPONDENT experiences is a frightened person being honest with them.
  // Nobody in that corridor is being leaned on, and the screen has no
  // business telling the viewer otherwise.
  'performed-it',
  // The solo branches of both windows. There is nobody to be leaned on by,
  // and none of these writes an emotional state the smooth register would
  // contradict — the two that do are on the adverse list above.
  'alone-with-it', 'read-the-room', 'filed-it', 'awake-with-it',
  'checked-the-door', 'rehearsing',
  // ── TASK 7 STAGE 5: THE REWRITE BATCHES (see the note on the adverse
  // list above for the rule these were sorted by) ──────────────────────
  //
  // Two people agreed something, or worked something out, or one of them was
  // simply honest and it was taken that way:
  'agreed-a-version', 'agreed-the-map', 'agreed-to-hide-it', 'agreed-what-it-was',
  'compared-notes', 'invited-them-in', 'traded-it', 'still-good', 'checked-out',
  'named-somebody-else', 'redrew-it', 'could-not-place-one', 'did-not-line-up',
  'lost-the-hour', 'went-and-asked', 'one-sided-vow', 'left-it-unsaid',
  // A kindness, or grief that landed and did not turn into anything else:
  'handed-it-over', 'was-found', 'checked-on-them', 'said-the-number',
  'named-them-all', 'could-not-finish', 'turned-into-a-vow', 'nobody-joined-in',
  'set-it-out', 'did-not-come-down',
  // A relationship became public, or was recognised, and nobody was pressed:
  'picked-it-back-up', 'left-it-at-the-door', 'said-it-to-the-room',
  'stopped-hiding-it', 'the-room-said-it', 'told-one-person', 'named-it',
  'somebody-saw',
  // The move worked, or was not made, and the respondent experienced neither
  // as pressure. `it-took`, `overpaid-for-it`, `pitched-it-right` and
  // `borrowed-it` sit here for the reason `feigned-fear` and `performed-it`
  // do: what the RESPONDENT experiences is an ordinary person having an
  // ordinary conversation, and the screen has no business telling the viewer
  // otherwise just because the audience knows more than they do.
  'it-took', 'overpaid-for-it', 'pitched-it-right', 'borrowed-it',
  'thought-better-of-it', 'held-it-back', 'could-not-today', 'read-it-right',
  'said-it-aloud',
  // The solo branches. There is nobody to be leaned on by, and none of these
  // writes an emotional state the smooth register would contradict -- the one
  // that does is `came-down-angry`, on the adverse list above.
  'nearly-said-it', 'saw-it-alone', 'drew-it-alone', 'went-back-over-one',
  'poured-two', 'pocketed', 'put-it-back', 'put-it-away', 'counted-the-chairs',
  'counted-the-useful-ones',
  // ── TASK 7 STAGE 6: THE REMAINING REWRITES (see the note on the adverse
  // list above for the rule these were sorted by) ──────────────────────
  //
  // The respondent came out of it fine, or the scene was a kindness, or the
  // doubt was put down rather than pressed:
  'answered-at-last', 'it-worked', 'stopped-watching',
  // The solo branches. There is nobody to be leaned on by, and none of these
  // writes an emotional state the smooth register would contradict — the ones
  // that do are `came-down-angry`, `rattled` and `counted-them`, on the
  // adverse list above.
  'read-it', 'was-nothing', 'heard-it-out-loud', 'let-the-list-go',
  'put-it-down',
  // ── AND THE ROMANCE BATCH ────────────────────────────────────────────
  //
  // Something started, or was said out loud, or was deliberately not said,
  // and nobody in any of them is under pressure. `one-sided` sits here for the
  // reason `borrowed-it` does: what the other person experiences is a pleasant
  // evening, and the screen has no business telling the viewer otherwise just
  // because the audience knows which of the two is awake at three:
  'named-it-fast', 'one-sided-so-far', 'interrupted', 'said-nothing',
  // The row was had and put down again, or the accusation was absorbed:
  'patched-it', 'made-a-joke-of-it', 'leaned-into-it',
  // Comfort that stayed comfort, and the morning the castle drew its own
  // conclusions about — neither of which leans on anybody in the scene:
  'just-comfort', 'the-room-noticed',
  // ── AND THE TRUST BATCH ──────────────────────────────────────────────
  //
  // Two people arrived at the same name, or made something out loud, or were
  // let inside. Nobody is under pressure in any of them:
  'both-had-it', 'counted-the-room', 'said-the-word', 'three-of-us',
  'showed-the-worst-of-it',
  // `went-round-the-room` sits here for the reason `feigned-fear` and
  // `performed-it` do: what the RESPONDENT experiences is somebody being kind
  // to them, and the screen has no business telling the viewer otherwise
  // just because the audience can count the other four people it happened to.
  'went-round-the-room',
  // The `trust-defend-in-absentia` branches, all of which report ONE
  // participant because the person being defended is upstairs (see that
  // event's header — it is the audit's only REMOVE, answered as a record fix).
  // The rule this list states then applies: a solo branch is benign unless the
  // same firing writes a state the smooth register would contradict, and none
  // of these writes one. `spoke-for-them` is the renamed success branch; see
  // the same header for why it is not called `defended`.
  'spoke-for-them', 'lost-the-argument', 'was-asked-why', 'let-it-sit',
  // ── AND THE JOURNEY BATCH ────────────────────────────────────────────
  //
  // A name was answered with a name, which is the fairest exchange the road
  // has, and nobody in it is under pressure:
  'named-somebody-else',
  // The two solo `cover-road-rehearsal` branches. Nobody else is on that road,
  // and neither writes a state the smooth register would contradict:
  'stopped-rehearsing',
  // ── AND THE GRIEF BATCH ──────────────────────────────────────────────
  //
  // Two people did something quiet and decent about an empty chair, or about
  // each other, and nobody in any of them is under pressure:
  'moved-it-away', 'laid-a-place', 'nobody-noticed', 'kept-the-gap',
  'told-a-story-about-them', 'could-not-say-it',
  // The morning's own facts, arrived at together rather than put to anybody:
  'about-to-say-something', 'we-had-it-wrong',
  // Somebody took the whole of a mistake rather than spreading it round the
  // table, and somebody turned an accusation inward instead of outward:
  'owned-the-mistake', 'blamed-themselves',
  // The room's threshold, observed. `one-of-them-still-feels-it` is the person
  // who has NOT crossed it, and being the last one counting is not a scene
  // going badly for anybody in it:
  'one-of-them-still-feels-it', 'performed-it',
  // ── AND THE CALLBACK BATCH ───────────────────────────────────────────
  //
  // Two people rebuilt something, or settled something, or agreed a hard fact
  // about the end without anybody being leaned on to do it:
  'renegotiated-it', 'agreed-not-to', 'let-it-go-at-last',
  'both-know-how-it-ends', 'compared-endings',
  // A warning that arrived at somebody who already had it, and a story asked
  // for rather than overheard:
  'already-knew', 'asked-to-be-told',
  // Somebody outside a story went and started one of their own, which is a
  // scene about the person and not about the room:
  'went-and-found-one',
  // ── AND THE TESTING / CALLBACK TAIL ──────────────────────────────────
  //
  // The small ask was taken and then some, the silence was used for something
  // of the respondent's own, and somebody stopped narrating an old season at
  // the person living in a new one. Nobody is leaned on in any of them:
  'over-delivered', 'filled-it-with-their-own', 'stopped-comparing',
  // ── AND THE COVER BATCH ──────────────────────────────────────────────
  //
  // Two people ran a dangerous thing together and it worked, and the
  // respondent experienced a colleague rather than an interrogator:
  'played-along', 'were-together-anyway',
  // The solo cover branches. Nobody else is in any of them, and none writes a
  // state the smooth register would contradict. `heard-themselves` and
  // `binned-it` are somebody arriving at a private conclusion, which is the
  // same shape as `read-the-room` and `alone-with-it` above:
  'roughed-it-up', 'heard-themselves', 'changed-it', 'binned-it',
  'abandoned-it',
  // ── AND TWO MOVED OFF THE ADVERSE LIST, BECAUSE THE SCENE CHANGED ─────
  //
  // `tracked` (susp-pattern-tracking) and `misread-nervy` (susp-misread-tell)
  // were both classified adverse when they were two-person scenes. This
  // stage's rewrite makes both of them ONE-PERSON scenes — the subject of the
  // tally, and the subject of the invented tell, are not told any of it is
  // happening, and naming them a participant is precisely what let the screen
  // hand them a reaction card in a conversation they were not having (stage
  // 5's `borrowed-it` finding). The rule this list already states then
  // applies: a solo branch is benign unless the same firing writes a state the
  // smooth register would contradict, and neither of these writes one. It also
  // resolves a pre-existing incoherence, because `tracked-since` — the SAME
  // scene with a longer history on it — has been on this list all along.
  'tracked', 'misread-nervy',
  // CONFRONTATION (confrontation.js). The person under fire came through it —
  // held the pile-on, or was defended, or the mob overshot and swung sympathy
  // their way — and the defence branches that cost the defender nothing.
  'weathered', 'overreached', 'worked', 'fell-flat',
  // The pile-on's target redirects it and the person who STARTED it is now
  // the one under the room. That is a respondent being leaned on, so it is
  // adverse -- the only one of the eleven new branches that is.
  'turned-it-back',
]);

/**
 * SMOOTH OR ADVERSE, from the record and from nothing else.
 *
 * The stored OUTCOME first, because a story that ended in an exposure is an
 * adverse scene whatever the branch said on the way in; the branch second.
 * Identical in both directions to `_tone` in js/vp-tr/castle-day.js, which is
 * pinned by tests/tr-voice.test.js — two answers to "did this go badly" is the
 * shape where a reaction card contradicts the card above it.
 */
export function sceneToneClass(scene) {
  const branchAdverse = ADVERSE_BRANCHES.has(String(scene?.branch || ''));
  if (scene?.closedNow && ADVERSE_OUTCOMES.has(scene.outcome)) return 'adverse';
  if (scene?.closedNow && SMOOTH_OUTCOMES.has(scene.outcome)) {
    return branchAdverse ? 'adverse' : 'smooth';
  }
  return branchAdverse ? 'adverse' : 'smooth';
}
