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
    if (w.vetoUsedOn === me && w.vetoWinner === o) h.theySavedMe = w.num;
  }
  h.alliance = (gs.namedAlliances || []).find(a => a.active !== false && (a.members || []).includes(me) && (a.members || []).includes(o))?.name || null;
  h.deal = (gs.sideDeals || []).some(d => d.active !== false && !d.broken && (d.players || []).includes(me) && (d.players || []).includes(o));
  h.couple = (gs.showmances || []).some(s => !s.broken && (s.players || []).includes(me) && (s.players || []).includes(o));
  h.bond = getBond(me, o);
  return h;
}

// the sentence, by the kind of scene, the voice, and the history
const KIND = t => /feud|friction|argument|cold|snap|grudge|blow/.test(t) ? 'feud'
  : /alliance|deal|pact|bloc|checkin/.test(t) ? 'ally'
    : /showmance|romance|couple|flirt|spark/.test(t) ? 'heart'
      : /target|gossip|lobby|block|campaign|scheme|hohweek|plan|nom|veto|style.|power|phase|deals|jury|endgame|prejury|nexthoh|outside|bb./.test(t) ? 'game' : 'life';

function lines(kind, voice, o, h) {
  const hist = [];
  if (h.theyNomMe) hist.push(`${o} put me on the block in week ${h.theyNomMe}. I haven't forgotten that, and I don't think I'm supposed to.`);
  if (h.iNomThem) hist.push(`I put ${o} on the block in week ${h.iNomThem}. Every conversation with ${o} since then has had that sitting in the middle of it.`);
  if (h.theySavedMe) hist.push(`${o} used the veto on me in week ${h.theySavedMe}. I owe ${o}, and we both know it.`);
  if (h.sameVotes >= 2) hist.push(`${o} and I have voted the same way ${word(h.sameVotes)} times now. That's not an accident.`);
  if (h.splitVote) hist.push(`${o} and I didn't vote the same way in week ${h.splitVote}. Neither of us has brought it up. We both know.`);
  if (h.alliance && kind !== 'ally') hist.push(`${o} is in ${h.alliance} with me. That changes how I have to handle this.`);
  if (h.deal && kind !== 'ally') hist.push(`${o} and I have a deal. I keep reminding myself of that.`);
  if (h.couple && kind !== 'heart') hist.push(`It's different when it's ${o}. It's always different when it's ${o}.`);
  const V = {
    feud: {
      fiery: [`And I'm not going to pretend I'm fine. ${o} knows exactly what ${o} did.`, `I've got a short fuse, and ${o} keeps finding it.`],
      strategist: [`Every fight tells me something. ${o} just showed me exactly how ${o} handles pressure. I'll remember that.`, `I let ${o} think that won. I'd rather ${o} underestimate me.`],
      warm: [`I hate this. I'll go and fix it with ${o} tomorrow, because I don't want to live like this.`, `I don't like being on anybody's bad side. Especially ${o}'s.`],
      loyal: [`I'll say it to ${o}'s face, not behind ${o}'s back. That's the only way I know how to do this.`, `If ${o} has a problem with me, ${o} can come and say it. I'll be right here.`],
      nervous: [`I shouldn't have said anything. Now I'm on ${o}'s bad side, and that's the worst place to be in here.`, `My heart is still pounding. I don't do confrontation. Ask anyone.`],
      carefree: [`By tomorrow I'll have forgotten what this was about. ${o} won't, though. ${o} never does.`, `Honestly? We'll be fine by dinner. ${o} just needs to cool off.`],
      competitor: [`Fine. I'll settle it the way I settle everything: I'll beat ${o} in the next competition.`, `${o} can talk all ${o} wants. I'll do my talking when the HOH is on the line.`],
      villain: [`Let ${o} be angry. Angry people make mistakes, and I'll be right there when ${o} does.`, `${o} just made this a lot easier for me.`],
    },
    ally: {
      fiery: [`If ${o} ever turns on me, everybody in this house will hear about it. Loudly.`, `I'm all in with ${o}. I don't do halfway.`],
      strategist: [`That's one more vote I can count on, and ${o} doesn't realise I'm the one steering it.`, `${o} is useful, and ${o} likes me. That's the best kind of ally there is.`],
      warm: [`It's not just a deal for me. I actually like ${o}. That's either my strength or my problem.`, `I came in here wanting real friends. ${o} feels like one.`],
      loyal: [`Once I'm in, I'm in. ${o} will never have to wonder about me.`, `I don't make promises lightly. ${o} just got one.`],
      nervous: [`Finally. I'm not on my own in here any more. I didn't realise how much I needed that.`, `I keep waiting for ${o} to change ${o}'s mind about me.`],
      carefree: [`I didn't plan on joining anything. But ${o} asked nicely, and I'm easy.`, `Sure, why not. ${o} seems fun, and I like fun people.`],
      competitor: [`Two people who can win competitions, working together? That's bad news for everyone else.`, `${o} can win. I can win. Good luck to the rest of them.`],
      villain: [`${o} thinks this is a partnership. It's a shield. I'll decide when to put it down.`, `I'll keep ${o} close. That's exactly where I want ${o}.`],
    },
    heart: {
      fiery: [`I don't do anything quietly, and that includes this.`, `If anyone has a problem with ${o} and me, they can say it to my face.`],
      strategist: [`I know how this looks to the house. I've thought about it. I'm doing it anyway, which isn't like me.`, `Everyone will say it's a strategy. It isn't. That's what scares me.`],
      warm: [`I didn't come here to fall for anybody. I'm not doing a very good job of that.`, `${o} makes this house feel smaller, in a good way.`],
      loyal: [`If I'm in, I'm in. That goes for ${o} too.`, `I'm not playing games with ${o}. Everything else in here, sure. Not that.`],
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
      strategist: [`It looks like I'm relaxing. I'm watching who sits next to who.`, `Even downtime is information.`],
      warm: [`This is the part of the game I love: the people.`, `Days like this are why I came here.`],
      loyal: [`I take care of my people. That's how I was raised, and I'm not changing in here.`, `It's the small things. I notice who helps out, and I remember.`],
      nervous: [`For one afternoon I forgot to be scared. That felt nice.`, `I'm starting to feel like I belong here. Don't jinx it.`],
      carefree: [`Best day in the house so far. Nobody talked about the game for a whole hour.`, `I'm not stressed. I'm never stressed. That's my secret.`],
      competitor: [`I've been sitting still too long. I need a competition.`, `I'm bored. Bored is dangerous for me.`],
      villain: [`Everyone's laughing. Good. Laughing people tell you things.`, `I'm charming when I want to be. Today, I wanted to be.`],
    },
  };
  const voiced = V[kind]?.[voice] || [];
  // a history fact first, when there is one: that is what makes the line about THIS person
  return { hist, voiced };
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
  const voice = voiceOf(me);
  const hx = historyOf(me, o, weekNum || 99);
  // a flirtation is the couple's scene: somebody watching it gets no feelings of their own added
  const pair = sc.lines.filter(l => l.by && l.kind !== 'dr').map(l => l.by);
  if (kind === 'heart' && !hx.couple && !(pair.includes(me) && pair.includes(o) && new Set(pair).size <= 2)) return sc;
  const res = lines(kind, voice, o, hx);
  // history only when the scene is between these two: both of them speak in it (a bystander's
  // confessional brought up their own deal with somebody in the middle of another couple's scene)
  const spoke = n => sc.lines.some(l => l.by === n && l.kind !== 'dr');
  const hist = spoke(me) && spoke(o) ? res.hist : [];
  // downtime is the scene's own: a voice line there read as a non sequitur, so only history
  const voiced = kind === 'life' ? [] : res.voiced;
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'voice', sc.id || '', me);
  const led = gs.bb ? (gs.bb.voiceUsed ||= {}) : {};
  const re = NAMES_RE();
  const shape = t => t.replace(re, 'X');
  // a history line is remembered for THIS pair (names kept); a voice line for everybody (names blanked)
  const keyOf = (t, isHist) => (isHist ? t : shape(t));
  const freshH = hist.filter(t => !led[keyOf(t, true)]), freshV = voiced.filter(t => !led[keyOf(t, false)]);
  // history first (it is about this pair), then the voice; never a sentence this season has heard
  const useHist = freshH.length > 0 && rng() < 0.75;
  const pool = useHist ? freshH : freshV;
  if (!pool.length) return sc;
  const add = pool[Math.floor(rng() * pool.length) % pool.length];
  led[keyOf(add, useHist)] = 1;
  sc.lines[di] = { ...dl, text: `${String(dl.text).replace(/\s+$/, '')} ${add}` };
  return sc;
}
