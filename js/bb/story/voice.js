// ══════════════════════════════════════════════════════════════════════
// bb/story/voice.js — who is talking, and what they have been through with this person
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "the house life dialogue is generic too, fix it the same way" (as the jury
// house: lines from who the person is and what they did). The house-life scripts are good scenes,
// but anybody could play any part, and nothing in them knows the two people's history.
//
// Every houseguest has a VOICE (from archetype and stats: fiery, strategist, warm, loyal, nervous,
// carefree, competitor, villain), and the scene's closing confessional gains a sentence in that
// voice about THIS person: the week they nominated each other, the votes they cast the same way,
// the alliance or deal they share, the showmance, how they stand right now. Facts are the house's
// record up to the week being written, so a replay never reads today's state.
//
// Words only: its own dice, a season ledger against repeats, and nothing in the game moves.

import { gs, players } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { stableRng } from '../knowledge.js';
import { said } from '../script/write.js';

const archOf = n => (players || []).find(p => p.name === n)?.archetype || 'floater';
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = n => W[n] || String(n);

/** fiery · strategist · warm · loyal · nervous · carefree · competitor · villain */
export function voiceOf(n) {
  const a = archOf(n), s = pStats(n) || {};
  if (a === 'villain' || a === 'schemer') return 'villain';
  if (a === 'mastermind' || a === 'perceptive-player') return 'strategist';
  if (a === 'hothead' || a === 'chaos-agent' || (s.temperament || 5) <= 3) return 'fiery';
  if (a === 'challenge-beast') return 'competitor';
  if (a === 'loyal-soldier' || a === 'hero') return 'loyal';
  if (a === 'social-butterfly' || a === 'showmancer') return 'warm';
  if (a === 'underdog' || a === 'goat' || (s.boldness || 5) <= 3) return 'nervous';
  return 'carefree';
}

/** What the record says about these two, up to (not including) week `upTo`. */
function historyOf(me, o, upTo) {
  const weeks = (gs.bb?.weeks || []).filter(w => (w.num || 0) < upTo);
  const h = {};
  for (const w of weeks) {
    const nom = (w.acts || []).find(a => a?.type === 'nominations');
    const noms = nom?.nominees || [];
    if (w.hoh === o && noms.includes(me)) h.theyNomMe = w.num;
    if (w.hoh === me && noms.includes(o)) h.iNomThem = w.num;
    const ev = (w.acts || []).find(a => a?.type === 'eviction');
    const bal = ev?.ballots || [];
    const mine = bal.find(b => b.voter === me)?.evict, theirs = bal.find(b => b.voter === o)?.evict;
    if (mine && theirs) { if (mine === theirs) h.sameVotes = (h.sameVotes || 0) + 1; else h.splitVote = w.num; }
    h.lastWeek = w.num;
    if (w.vetoUsedOn === me && w.vetoWinner === o) h.theySavedMe = w.num;
  }
  // a group or deal from before this week: one made this week may not have aired yet when the confessional
  // does (read 2026-10-15: "Ripper and I are both in The Plot Twist" two scenes before Scary was asked in)
  const snap = (gs.bb?.weeks || []).find(w => (w.num || 0) === upTo)?.alliancesAtStart;
  const before = a => !snap || ((snap[a.name] || []).includes(me) && (snap[a.name] || []).includes(o));
  h.alliance = (gs.namedAlliances || []).find(a => a.active !== false && (a.members || []).includes(me) && (a.members || []).includes(o) && before(a))?.name || null;
  h.deal = (gs.sideDeals || []).some(d => d.active !== false && !d.broken && (d.players || []).includes(me) && (d.players || []).includes(o)
    && !(Number(d.madeEp) >= upTo));
  h.couple = (gs.showmances || []).some(s => !s.broken && (s.players || []).includes(me) && (s.players || []).includes(o));
  h.bond = getBond(me, o);
  return h;
}

// the sentence, by the kind of scene, the voice, and the history
// (a style scene is a game scene, whatever the style: b in it is a's closest person, so a provocateur's
// style scene closing on "we'll be fine by dinner, Hicks just needs to cool off" was a fight nobody had)
const KIND = t => /(^|[^a-z])style\./.test(t) ? 'game'
  : /feud|friction|argument|cold|snap|grudge|blow|provocateur|confront/.test(t) ? 'feud'
  : /alliance|deal|pact|bloc|checkin/.test(t) ? 'ally'
    : /showmance|romance|couple|flirt|spark/.test(t) ? 'heart'
      : /target|gossip|lobby|block|campaign|scheme|hohweek|plan|nom|veto|style.|power|phase|deals|jury|endgame|prejury|nexthoh|outside|bb./.test(t) ? 'game' : 'life';

// Each fact has several ways to be said, and each WAY is said at most twice a season (the season
// read, 2026-10-13: one split-vote sentence closed 45 confessionals). A week is named only while it
// is recent; after that the fact is told without the date.
const ago = (w, h) => (h.lastWeek && h.lastWeek - w <= 1 ? (w === h.lastWeek ? 'last week' : `in week ${w}`) : null);
function lines(kind, voice, o, h) {
  const hist = [];
  // each fact is tagged, so the same one is not told about the same pair week after week
  const add = (fact, ...ways) => hist.push(Object.assign(ways.filter(Boolean), { fact }));
  if (h.theyNomMe) add('nomMe', `${o} put me on the block in week ${h.theyNomMe}. I haven't forgotten that, and I don't think I'm supposed to.`,
    `I was on the block because of ${o} once. I smile at ${o} every day. I also remember.`,
    `${o} nominated me. We've talked a hundred times since and never once about that.`);
  if (h.iNomThem) add('nomThem', `I put ${o} on the block in week ${h.iNomThem}. Every conversation with ${o} since then has had that sitting in the middle of it.`,
    `I nominated ${o}. ${o} says it's water under the bridge. Nobody in here means that.`,
    `I put ${o} up once. ${o} has never said a word to me about it. That's what worries me.`);
  const sour = hist.length;
  if (h.theySavedMe) add('saved', `${o} used the veto on me in week ${h.theySavedMe}. I owe ${o}, and we both know it.`,
    `${o} pulled me off the block. Whatever ${o} asks me for, I'm going to have to think very hard before I say no.`,
    `I'm only still here because ${o} used that veto on me. That kind of thing doesn't wear off.`);
  if (h.sameVotes >= 2) add('same', `${o} and I have voted the same way ${word(h.sameVotes)} times now. That's not an accident.`,
    `Every vote so far, ${o} and I have landed in the same place. We've never once planned it out loud.`,
    `${o} and I keep ending up on the same side of the vote. At some point that stops being luck.`);
  const split = h.splitVote && ago(h.splitVote, h);
  if (split) add('split', `${o} and I didn't vote the same way ${split}. Neither of us has brought it up. We both know.`,
    `${o} voted the other way ${split}. Nobody had to tell me. I've been very friendly about it.`,
    `We split ${split}, ${o} and me. I keep waiting for ${o} to explain, and ${o} keeps not explaining.`);
  // said about the alliance itself, not about "this" (the user, 2026-10-14: "super vague"): the tail
  // closes any kind of scene, so it cannot point at what the scene was
  // (the two about arguing close a disagreement only: "I need her vote more than I need to win an
  // argument" closed a flirtation at dinner, read 2026-10-14)
  if (h.alliance && kind !== 'ally') add('alliance', `${o} and I are both in ${h.alliance}. Anything I say to ${o} gets back to the rest of them by dinner.`,
    kind === 'feud' && `${o} is in ${h.alliance} with me, and I need ${o}'s vote more than I need to win an argument.`,
    kind === 'feud' && `${o} and I are in ${h.alliance} together. With anybody else, I'd be a lot blunter.`);
  if (h.deal && kind !== 'ally') add('deal', `${o} and I have a deal. I keep reminding myself of that.`,
    `There's a deal between ${o} and me. Days like this, I find out how much it's worth.`,
    `I shook on a deal with ${o}. I keep looking at my hand.`);
  if (h.couple && kind === 'feud') add('couple', `It's different when it's ${o}. It's always different when it's ${o}.`,
    `With anybody else I'd play this cold. With ${o}, I can't.`,
    `Everybody knows about ${o} and me, so everybody's watching how I handle this.`);
  const V = {
    feud: {
      fiery: [`And I'm not going to pretend I'm fine. ${o} knows exactly what ${o} did.`, `I've got a short fuse, and ${o} keeps finding it.`],
      strategist: [`Every fight tells me something. ${o} just showed me exactly how ${o} handles pressure. I'll remember that.`],
      warm: [`I hate this. I'll go and fix it with ${o} tomorrow, because I don't want to live like this.`, `I don't like being on anybody's bad side. Especially ${o}'s.`],
      loyal: [`I'll say it to ${o}'s face, not behind ${o}'s back. That's the only way I know how to do this.`, `If ${o} has a problem with me, ${o} can come and say it. I'll be right here.`],
      nervous: [`I shouldn't have said anything. Now I'm on ${o}'s bad side, and that's the worst place to be in here.`, `My heart is still pounding. I don't do confrontation. Ask anyone.`],
      carefree: [`By tomorrow I'll have forgotten what this was about. ${o} won't, though. ${o} never does.`, `Honestly? We'll be fine by dinner. ${o} just needs to cool off.`],
      competitor: [`Fine. I'll settle it the way I settle everything: I'll beat ${o} in the next competition.`, `${o} can talk all ${o} wants. I'll do my talking when the HOH is on the line.`],
      villain: [`Let ${o} be angry. Angry people make mistakes, and I'll be right there when ${o} does.`, `Fine. ${o} and I don't get on. I've got a game to play.`],
    },
    ally: {
      fiery: [`If ${o} ever turns on me, everybody in this house will hear about it. Loudly.`, `I'm all in with ${o}. I don't do halfway.`],
      strategist: [`That's one more vote I can count on, and ${o} doesn't realise I'm the one steering it.`, `${o} is useful, and ${o} likes me. That's the best kind of ally there is.`],
      warm: [`It's not just a deal for me. I actually like ${o}. That's either my strength or my problem.`, `I came in here wanting real friends. ${o} feels like one.`],
      loyal: [`Once I'm in, I'm in. ${o} will never have to wonder about me.`, `I don't make promises lightly. ${o} just got one.`],
      nervous: [`Finally. I'm not on my own in here any more. I didn't realise how much I needed that.`, `I keep waiting for ${o} to change ${o}'s mind about me.`],
      carefree: [`I didn't plan on joining anything. But ${o} asked nicely, and I'm easy.`, `${o} makes it easy. I didn't have to think twice.`],
      competitor: [`Two people who can win competitions, working together? That's bad news for everyone else.`, `${o} can win. I can win. Good luck to the rest of them.`],
      villain: [`${o} thinks this is a partnership. It's a shield. I'll decide when to put it down.`, `I'll keep ${o} close. That's exactly where I want ${o}.`],
    },
    heart: {
      fiery: [`I don't do anything quietly, and that includes this.`, `If anyone has a problem with ${o} and me, they can say it to my face.`],
      strategist: [`I know how this looks to the house. I've thought about it. I'm doing it anyway, which isn't like me.`, `Everyone will say it's a strategy. It isn't. That's what scares me.`],
      warm: [`I didn't come here to fall for anybody. I'm not doing a very good job of that.`, `${o} makes this house a lot less lonely.`],
      loyal: [`I don't do halfway. Not with ${o}.`, `I'm not playing games with ${o}. Everything else in here, sure. Not that.`],
      nervous: [`I keep thinking ${o} is going to realise I'm not that interesting.`, `I'm terrified, honestly. In a good way. Mostly.`],
      carefree: [`Is it a showmance? Who knows. It's fun, and I'm not overthinking it.`, `I'm just enjoying it. The game can wait an afternoon.`],
      competitor: [`It's a distraction. I know it is. I'm letting it be one anyway.`, `I'll still beat ${o} in a competition. I'll just feel bad about it now.`],
      villain: [`I like ${o}. Really. It doesn't change what I'll do if I have to.`, `Feelings are dangerous in here. I'm having them anyway.`],
    },
    game: {
      fiery: [`I'm done whispering. If it's ${o}, I'll say it out loud.`, `I can't stand sitting on information. It makes me want to scream it from the kitchen.`],
      strategist: [`Information is the only real currency in here. I just got paid.`, `I'm not reacting yet. I'm watching who reacts.`],
      warm: [`I hate talking about people like this. But this is the game, and I'm playing it.`, `I'll still give ${o} a hug at dinner. That's the hard part of this game.`],
      loyal: [`I'll only go after ${o} if ${o} gives me a reason. Right now, ${o} is giving me a few.`, `I'm not going to lie about it later. If I vote ${o} out, I'll say so.`],
      nervous: [`Every time somebody whispers, I assume it's about me. Today, for once, it isn't.`, `I just want to make it to the next week. That's my whole plan.`],
      carefree: [`I'm just here for the gossip, honestly. The game will sort itself out.`, `Whatever. I'll vote with whoever asks me nicest.`],
      competitor: [`I'd rather win my safety than talk my way into it.`, `All this talking. Just give me a competition and let me win it.`],
      villain: [`Let them all talk. Every whisper gives me something to use.`, `I don't need anybody to trust me. I just need them scared of the right person.`],
    },
    life: {
      fiery: [`That's me. Loud, all the time. The house can deal with it.`, `I'm a lot. I know I'm a lot. That's the fun part.`],
      strategist: [`It looks like I'm relaxing. I'm watching who sits next to who.`, `Even sitting around tells me who's with who.`],
      warm: [`This is the part of the game I love: the people.`, `Days like this are why I came here.`],
      loyal: [`I take care of my people. That's how I was raised, and I'm not changing in here.`, `It's the small things. I notice who helps out, and I remember.`],
      nervous: [`For one afternoon I forgot to be scared. That felt nice.`, `I'm starting to feel like I belong here. Don't jinx it.`],
      carefree: [`Best day in the house so far. Nobody talked about the game for a whole hour.`, `I'm not stressed. I'm never stressed. That's my secret.`],
      competitor: [`I've been sitting still too long. I need a competition.`, `I'm bored. Bored is dangerous for me.`],
      villain: [`Everyone's laughing. Good. Laughing people tell you things.`, `I'm charming when I want to be. Today, I wanted to be.`],
    },
  };
  const voiced = V[kind]?.[voice] || [];
  // a history fact first, when there is one: that is what makes the line about THIS person. A deal
  // being made is not the place for an old nomination (the read of 2026-10-14: a final three formed
  // on screen, closed by "I was on the block because of Bowie once. I also remember")
  // ...and an old nomination is brought up only where the two of them are at odds: in a scene where
  // one is consoling the other it reads as a sentence from somewhere else
  return { hist: kind === 'feud' ? hist : hist.slice(sour), voiced };
}

const NAMES_RE = () => new RegExp('(' + (players || []).map(p => p.name).filter(Boolean).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');

/**
 * Give the scene's closing confessional a sentence in the speaker's voice about the other person
 * in it. Mutates `sc.lines` and returns the scene. `kind` is the scene's type/step text.
 */
export function addInsight(sc, kindText, weekNum) {
  if (!sc || !Array.isArray(sc.lines) || !sc.lines.length) return sc;
  const di = sc.lines.map((l, i) => [l, i]).filter(([l]) => l.kind === 'dr' && l.by).map(([, i]) => i).at(-1);
  if (di == null) return sc;
  const dl = sc.lines[di];
  if (String(dl.text).length > 170) return sc;
  const me = dl.by;
  const others = (sc.cast || []).filter(n => n && n !== me);
  if (!others.length) return sc;
  // the other person: the one this confessional names, else whoever spoke most with them
  const o = others.find(n => String(dl.text).includes(n))
    || others.slice().sort((a, b) => sc.lines.filter(l => l.by === b).length - sc.lines.filter(l => l.by === a).length)[0];
  const kind = KIND(String(kindText || ''));
  // downtime (a camera called Gary, a water fight) keeps its own ending: an old nomination or a vote
  // tacked onto it is a sentence from another scene (the read of 2026-10-14)
  if (kind === 'life') return sc;
  const voice = voiceOf(me);
  const hx = historyOf(me, o, weekNum || 99);
  // a flirtation is the couple's scene: somebody watching it gets no feelings of their own added
  const pair = sc.lines.filter(l => l.by && l.kind !== 'dr').map(l => l.by);
  // ...and an engine moment about a couple (showmance-two-votes) is not a flirtation: only the couple speak of
  // feelings there (read 2026-10-14: Ripper, pitching Beth, closed on "I'm not playing games with Beth")
  if (kind === 'heart' && !hx.couple && (/^showmance-|^couple-|^romance-/.test(String(kindText || '')) || !(pair.includes(me) && pair.includes(o) && new Set(pair).size <= 2))) return sc;
  const res = lines(kind, voice, o, hx);
  // history only when the scene is between these two: both of them speak in it (a bystander's
  // confessional brought up their own deal with somebody in the middle of another couple's scene)
  const spoke = n => sc.lines.some(l => l.by === n && l.kind !== 'dr');
  // ...and only when the scene is ABOUT the two of them: their row, their alliance, their showmance. A scene about
  // somebody else (four on the loungers deciding Angelica can't be trusted) closed on "Fatima and I didn't vote
  // the same way in week three", which is another conversation's point (the user, 2026-10-25: "its like its
  // mixing 2 different conversation"). A confessional about a third person, and a group scene that is not the two
  // of them fighting, keep their own ending; two people talking about themselves (a pitch for a vote, a deal) can
  // still bring up the vote they split.
  const talkers = new Set(sc.lines.filter(l => l.by && l.kind !== 'dr' && l.kind !== 'beat').map(l => l.by));
  const aboutSomebodyElse = (players || []).some(p => p?.name && p.name !== me && p.name !== o && new RegExp(`\\b${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(String(dl.text)));
  const theirs = talkers.size <= 2 ? !aboutSomebodyElse : kind === 'feud';
  const hist = spoke(me) && spoke(o) && theirs ? res.hist : [];
  // downtime is the scene's own: a voice line there read as a non sequitur, so only history; and a
  // voice line is about the other person, so only where that person is talking too (the read of
  // 2026-10-13: "I voted with the group. Nobody believes me. Sure, why not. Yul seems fun" in a
  // confessional with no Yul in it)
  // a game moment (a veto lobby, a vote count) keeps to its own point: the voice lines for it were
  // about nobody in particular and read as another scene's ("I'm done whispering. If it's Chase...")
  // ...and an alliance's voice lines are about joining one ("Once I'm in, I'm in"): only where one is made, not
  // closing a pep talk on the block (read 2026-10-14)
  // (a group being made in a storyline scene: the engine's quick recruit sketches are business, and "Beth seems
  // fun, and I like fun people" closed "I just have to hope Beth meant that")
  const forming = /formed|forms|final-t|pact/.test(String(kindText || ''));
  const mending = /apolog|makeup|make-up|reconcil|truce|repair|sorry|forgive/.test(String(kindText || ''));
  const voiced = kind === 'life' || kind === 'game' || (kind === 'ally' && !forming) || (kind === 'feud' && mending) || !spoke(o) || !spoke(me) ? [] : res.voiced;
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'voice', sc.id || '', me);
  const led = gs.bb ? (gs.bb.voiceUsed ||= {}) : {};
  const re = NAMES_RE();
  const shape = t => t.replace(re, 'X');
  // a voice line is remembered for everybody (names blanked), once; a history WAY of saying a fact
  // (names blanked too) twice a season, and never twice for the same pair
  const keyOf = (t, isHist) => (isHist ? t : shape(t));
  const groups = (gs.namedAlliances || []).map(a => a?.name).filter(Boolean);
  const unnamed = t => groups.reduce((x, g) => x.split(g).join('G'), t);
  const way = t => 'h:' + unnamed(shape(t)).replace(/last week|in week \d+|week \d+/g, 'W').replace(/\b(two|three|four|five|six|seven|eight|nine|ten|\d+) times\b/g, 'N times');
  const usable = t => !led[t] && (led[way(t)] || 0) < 2;
  // one fact about one pair once in three weeks, and two history tails a week for one speaker (the read
  // of 2026-10-14: "Axel voted the other way last week" closed four of Zee's confessionals in a week)
  const wk = weekNum || 99;
  const pairOf = fact => `f:${fact}|${[me, o].sort().join('|')}`;
  const recent = fact => led[pairOf(fact)] != null && wk - led[pairOf(fact)] < 3;
  const spent = (led[`s:${me}|${wk}`] || 0) >= 2;
  const toldThisWeek = fact => (led[`hw:${fact}|${wk}`] || 0) >= 1;
  const freshH = spent ? [] : hist.filter(ways => !recent(ways.fact) && !toldThisWeek(ways.fact)).map(ways => Object.assign(ways.filter(usable), { fact: ways.fact }))
    .filter(w => w.length).map(w => ({ t: w[Math.floor(rng() * w.length) % w.length], fact: w.fact }));
  const freshV = voiced.filter(t => !led[keyOf(t, false)]);
  // history first (it is about this pair), then the voice; never a sentence this season has heard
  const useHist = freshH.length > 0 && rng() < 0.75;
  const pool = useHist ? freshH : freshV.map(t => ({ t }));
  if (!pool.length) return sc;
  const picked = pool[Math.floor(rng() * pool.length) % pool.length];
  const add = picked.t;
  led[keyOf(add, useHist)] = 1;
  if (useHist) {
    led[way(add)] = (led[way(add)] || 0) + 1;
    led[pairOf(picked.fact)] = wk;
    led[`s:${me}|${wk}`] = (led[`s:${me}|${wk}`] || 0) + 1;
    led[`hw:${picked.fact}|${wk}`] = (led[`hw:${picked.fact}|${wk}`] || 0) + 1;
  }
  sc.lines[di] = { ...dl, text: said('dr', `${String(dl.text).replace(/\s+$/, '')} ${add}`) };
  return sc;
}
