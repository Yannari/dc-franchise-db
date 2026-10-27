// The voices of Kristal-talKs: who is in the chair, what Kristal asks them,
// and how they answer.
//
// Design: docs/superpowers/specs/2026-08-21-kristal-talks-v2-design.md, and
// the overhaul of 2026-10-21 (the user: "they barely respond to the host's
// question, never naming names, it's just boring and repetitive ... it needs a
// big overhaul").
//
// ── AN EPISODE IS A LIST OF BEATS FROM THE RECORD ──
//
// v2 asked a question per TOPIC (the boot, the rivalry, behind the scenes) and
// answered it with an essay about playing the game. v3 reads the season record
// into BEATS — one fact with one person in it: who blindsided them, whom they
// blindsided, the rival, the castmate who named them as a rival, who did it on
// the night they left, whether the right person won, the showmance and where
// it stands now off the life log, a castmate's own record that mentions them,
// a quoted key moment with a name in it, the number with somebody behind it.
// Kristal asks about that person by name; the answer says the name and takes
// a side. The loudest beats are pressed. Every word is in js/kristal-lines.js.
//
// ── STATS PICK TEXT, NEVER OUTCOMES ──
//
// Nothing in this file touches a listener count, a tier or a follower — the
// parity test in tests/kristal.test.js holds that door shut.
//
// ── NO SLOT PRINTS EMPTY ──
//
// A line is only eligible when every {slot} it names has a value, and a beat
// whose question cannot be filled is not asked. "undefined" can never print.

import { BEATS, MOMENT_BEATS, NUMBERS, NUMBER_A, COLD, ADVICE_Q, ADVICE, RAPID, MOOD, LIFE, LIFE_PRESS,
  LIFE_CRACK, FUTURE_Q, FUTURE_A } from './kristal-lines.js';
import { PLAYBACK_Q, PLAYBACK_A } from './kristal-exit-lines.js';
import { familyOf } from './shows.js';

// Deterministic pick — the same episode reads the same way forever.
function hash(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pickFrom = (list, key) => list && list.length ? list[hash(key) % list.length] : null;

const SLOT_RE = /\{(\w+)\}/g;
const slotsOf = t => [...String(t).matchAll(SLOT_RE)].map(m => m[1]);
const has = (facts, k) => facts[k] !== undefined && facts[k] !== null && facts[k] !== '';
// A sentence that opens on a slot ("{exitNight}. Whose idea...") starts with a
// capital once it is filled.
const capFirst = s => s.replace(/(^|[.?!]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
const fill = (t, facts) => capFirst(String(t).replace(SLOT_RE, (_, k) => facts[k] ?? ''));

/**
 * A line whose every slot is fillable — preferring one that says `prefer`
 * (the beat's person), so a beat about Aubrey is answered with Aubrey's name
 * whenever the bank has a line that can say it.
 */
function pickLine(bank, key, facts, prefer = 'x') {
  const ok = (bank || []).filter(t => slotsOf(t).every(k => has(facts, k)));
  // Named lines twice over: the answer usually says the name, not always.
  const named = ok.filter(t => slotsOf(t).includes(prefer));
  const line = pickFrom(named.length ? [...ok, ...named] : ok, key);
  return line ? fill(line, facts) : '';
}

// ── the styles ──────────────────────────────────────────────────────────
//
// Priority order matters: a villain with temperament 1 is a hothead first,
// and anyone with mental 2 rambles whatever the archetype says.

export const STYLES = ['rambler', 'hothead', 'bomb', 'chaos', 'analyst',
  'charmer', 'earnest', 'deadpan'];

export function styleOf({ archetype = '', stats = {} } = {}) {
  const s = stats || {};
  if ((s.mental ?? 5) <= 2) return 'rambler';
  if (archetype === 'hothead' || (s.temperament ?? 5) <= 2) return 'hothead';
  if (archetype === 'villain' || archetype === 'schemer') return 'bomb';
  if (archetype === 'chaos-agent' || archetype === 'wildcard') return 'chaos';
  if (archetype === 'mastermind' || (s.strategic ?? 5) >= 8) return 'analyst';
  if (archetype === 'social-butterfly' || archetype === 'showmancer'
    || (s.social ?? 5) >= 8) return 'charmer';
  if (archetype === 'hero' || archetype === 'loyal-soldier'
    || (s.loyalty ?? 5) >= 8) return 'earnest';
  if (archetype === 'floater' || archetype === 'goat' || (s.social ?? 5) <= 3) return 'deadpan';
  return (s.strategic ?? 5) >= 6 ? 'analyst' : (s.social ?? 5) >= 6 ? 'charmer' : 'deadpan';
}

// The cadence is the style; the voice keeps the exact archetype and every
// extreme stat, which pick the stance (who owns it, who blames) and the advice.
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

export function voiceOf({ archetype = '', stats = {} } = {}) {
  const values = Object.fromEntries(STAT_KEYS.map(k => [k,
    Number.isFinite(Number(stats?.[k])) ? Number(stats[k]) : 5]));
  const traits = STAT_KEYS.flatMap(k => values[k] >= 8 ? [`high-${k}`]
    : values[k] <= 3 ? [`low-${k}`] : []);
  return { archetype: archetype || 'custom', cadence: styleOf({ archetype, stats: values }),
    stats: values, traits };
}

// ── reading a key moment ────────────────────────────────────────────────
//
// Key moments and notes are sentences the exporters and the wiki fill wrote
// ("Ep3: broke the Aubrey final-three pact to protect Bowie", "Week 11:
// Evicted by Joel's tiebreaker."). What Kristal needs from one is WHEN, WHO
// else is in it, and WHAT KIND of thing it was — enough to ask the right
// question about the right person. The text itself is quoted, never rewritten.

const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const UNIT_RE = /^\s*(Ep(?:isode)?|Week|Wk)\.?\s*(\d+)(?:\s*[-–]\s*\d+)?\s*[:\-—–.,]*\s*/i;
const CLASSES = [
  ['exit', /\b(voted out|eliminated|evicted|blocked|sashay\w*|banished|dumped|booted|snuffed|sent home|goes home|went home)\b/i],
  ['betrayal', /\b(broke|breaks|flip(?:s|ped)?|blindsid\w*|betray\w*|backstab\w*|turn(?:s|ed)? on|stole|steals|robbed|sabotag\w*|lied|double-cross\w*|secretly vot\w*)\b/i],
  ['fight', /\b(clash\w*|argu\w*|fight\w*|feud\w*|confront\w*|meltdowns?|call(?:s|ed)? out|shov\w*|blow-?up|scream\w*|spat|insult\w*)\b/i],
  ['romance', /\b(kiss\w*|showmance|flirt\w*|chemistry|crush|romanc\w*)\b/i],
  ['power', /\b(idol|advantage|extra vote|amulet|shield|save card|key)\b/i],
  ['win', /\b(won|wins|beat|beats|defeat\w*|immunity|HOH|head of household|veto|fire-making|duel|maxi|lip ?sync)\b/i],
  ['bond', /\b(bonds?|bonded|alliance|pact|duo|core|pair(?:s|ed)? with|protect\w*|trained|allied|friendship|partnership)\b/i],
  ['vote', /\b(vote\w*|revote|tiebreak\w*|tie-break\w*|swing)\b/i],
];
// The verb has to come right after the name, inside the clause: "after Logan's
// warning, nullifying votes" is not Logan doing anything to anybody.
const DONE_TO = '(?:flip\\w*|stole|steal\\w*|blindsid\\w*|betray\\w*|turn(?:s|ed)? on|broke|cut|snuff\\w*|redirect\\w*|sabotag\\w*|voted|nominat\\w*|evict\\w*|block\\w*|eliminat\\w*|strip\\w*|shov\\w*)';

/** One record sentence → { text, ep, names, cls, x }, or null. */
export function parseMoment(raw, castNames = []) {
  let text = String(raw || '').trim();
  let ep = null;
  const m = text.match(UNIT_RE);
  if (m) { ep = `${/^w/i.test(m[1]) ? 'Week' : 'Episode'} ${m[2]}`; text = text.slice(m[0].length); }
  text = text.replace(/^[—–-]\s*/, '').trim();
  if (text.length < 8) return null;
  text = text[0].toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) text += '.';
  const names = castNames
    .filter(n => n && new RegExp(`\\b${esc(n)}\\b`).test(text))
    .sort((a, b) => text.indexOf(a) - text.indexOf(b));
  // Something done TO the subject by somebody named: "after Aiden flips onto
  // him", "shoved off the totem by Seraphine", "Evicted by Joel's tiebreaker".
  const after = names.find(n => new RegExp(`\\b(?:after|when|as|once|until)\\s+${esc(n)}(?:'s)?\\s+(?:\\w+\\s+){0,2}?${DONE_TO}`, 'i').test(text));
  // "by" only after something done to you: "Chosen by Misha" is a kindness.
  const BY_RE = new RegExp(`\\b${DONE_TO.replace('(?:', '(?:voted out|targeted|backdoored|outed|exposed|')}\\b[^.]{0,30}?\\bby\\s+`, 'i');
  const byAt = text.search(BY_RE);
  const byClause = byAt >= 0 ? text.slice(byAt) : '';
  const byName = byAt >= 0 ? names.find(n => new RegExp(`\\bby\\s+${esc(n)}\\b`).test(byClause)) : null;
  const by = after || byName || null;
  // Who did it: the name after "after", or every name after the "by".
  const doers = after ? [after]
    : byName ? names.filter(n => byClause.indexOf(n) >= byClause.search(/\bby\s/)) : [];
  // "Survived cross-pressure while Oliwia went home" is Oliwia's exit, not the
  // subject's: an exit word right after a name belongs to that name.
  const others = re => names.some(n => new RegExp(`\\b${esc(n)}\\s+(?:\\w+\\s+){0,2}(?:${re.source})`, 'i').test(text));
  const cls = by ? 'by' : (CLASSES.find(([c, re]) => re.test(text) && !(c === 'exit' && others(re))) || ['moment'])[0];
  // Who the record puts first: the subject when the sentence opens on a name.
  const lead = names.find(n => text.startsWith(n)) || null;
  return { text, ep, names, cls, lead, doers, x: by || names[0] || null };
}

// ── the vocabulary of each show ──────────────────────────────────────────
const EXIT_NIGHT = {
  'total-drama': 'the night they voted you out', 'big-brother': 'eviction night',
  'drag-race': 'the night you sashayed away', 'the-circle': 'the night you got blocked',
  traitors: 'the night you were banished', 'perfect-match': 'the night you got dumped',
  'the-challenge': 'the night you went home',
};

// ── the beats ────────────────────────────────────────────────────────────

/** The reading order: warm up on the result, escalate, land on the person, close. */
const ORDER = ['the-response', 'the-win', 'the-loss', 'the-boot', 'the-winner', 'the-numbers', 'the-moment',
  'the-ally', 'the-record', 'the-rival-of', 'the-rivalry', 'the-backstab', 'the-betrayal',
  'the-romance', 'the-romance-over', 'the-life', 'behind-the-scenes', 'the-advice', 'the-future'];

/** How each voice stands on a beat, for the aftermath model. */
const STANCE = { bomb: 'justify', analyst: 'explain', hothead: 'deflect', charmer: 'reframe',
  earnest: 'own', deadpan: 'own', chaos: 'own', rambler: 'explain' };
function stanceFor(type, style, voice) {
  const s = voice?.stats || {};
  if (type === 'the-betrayal') {
    if ((s.loyalty ?? 5) >= 8 || style === 'earnest') return 'apologize';
    if ((s.loyalty ?? 5) <= 3) return 'justify';
  }
  if (['the-record', 'the-response'].includes(type) && ['bomb', 'hothead', 'charmer'].includes(style)) return 'dispute';
  if (type === 'the-backstab' && style === 'hothead') return 'deflect';
  return STANCE[style] || 'explain';
}

/**
 * A story from the bare facts, for an episode built without the record (a test,
 * or an old caller): the rival and the partner are still people to ask about.
 */
function storyFromFacts(ep) {
  const f = ep.facts || {};
  const topic = id => (ep.topics || []).find(t => t.id === id);
  const placeN = parseInt(f.placement, 10);
  const rival = f.rivalName || f.rival || topic('the-rivalry')?.about || null;
  const partner = f.partner || topic('the-showmance')?.about || topic('the-breakup')?.about || null;
  return {
    guest: ep.guestName, season: f.season, format: ep.season?.format,
    placement: Number.isFinite(placeN) ? placeN : null, place: f.placement,
    won: placeN === 1 || !!topic('the-win'), winner: f.winner || null, runnerUp: null,
    allies: f.alliance ? [f.alliance] : [], rivals: rival ? [rival] : [], rivalOf: [],
    betrayed: [], betrayedBy: [], partner, partnerOver: !!topic('the-breakup'), partnerStatus: null,
    moments: [], aboutYou: [], stats: f.votes ? [{ type: 'votes', n: Number(f.votes) }] : [], castNames: [],
    life: [],
  };
}

function relationTo(story, name) {
  if ((story.allies || []).includes(name) || story.partner === name) return 0;
  if ([...(story.rivals || []), ...(story.rivalOf || []), ...(story.betrayedBy || [])].includes(name)) return 1;
  return 2;
}

/** Every beat the record can carry, each with how much drama it holds. */
function beatsFor(story, clip) {
  const out = [];
  const add = (type, heat, data = {}) => out.push({ type, heat, ...data });
  const usedX = new Set();
  const first = (list, avoid = []) => (list || []).find(n => n && n !== story.guest && !avoid.includes(n)) || null;
  if (clip) add('the-response', 10, { x: clip.by, quote: clip.quote });

  const exitM = (story.moments || []).find(m => (m.cls === 'exit' || m.cls === 'by') && m.x);
  if (story.won) add('the-win', 5, { x: story.runnerUp || first(story.rivals) || null });
  else if (story.finalist) add('the-loss', 6, { x: story.winner && story.winner !== story.guest ? story.winner : null });
  else add('the-boot', 6, { x: exitM?.x || first(story.betrayedBy) || null, moment: exitM });
  if (!story.won && story.winner && story.winner !== story.guest) {
    const rel = relationTo(story, story.winner);
    add('the-winner', rel === 1 ? 7 : 4, { x: story.winner, rel });
  }
  const backstab = first(story.betrayedBy);
  if (backstab) add('the-backstab', 8, { x: backstab, moment: story.why?.[backstab] || null });
  const betrayal = first(story.betrayed, [backstab]);
  if (betrayal) add('the-betrayal', 8, { x: betrayal, moment: story.why?.[betrayal] || null });
  const rival = first(story.rivals, [backstab, betrayal]);
  if (rival) add('the-rivalry', 7, { x: rival });
  const rivalOf = first(story.rivalOf, [backstab, betrayal, rival]);
  if (rivalOf) add('the-rival-of', 6, { x: rivalOf });
  if (story.partner) add(story.partnerOver ? 'the-romance-over' : 'the-romance',
    story.partnerOver ? 7 : 6, { x: story.partner, status: story.partnerStatus });
  for (const m of story.aboutYou || []) {
    if (m.by !== backstab && m.by !== betrayal && m.cls !== 'betrayal' && m.cls !== 'by') {
      add('the-record', 6, { x: m.by, moment: m, cls: m.cls }); break;
    }
  }
  const ally = first(story.allies, [story.partner]);
  if (ally) add('the-ally', 4, { x: ally });
  const heatOf = { fight: 5, romance: 5, power: 4, win: 4, vote: 3, bond: 3, moment: 2 };
  for (const m of story.moments || []) {
    if (!heatOf[m.cls]) continue;
    // A summary line is not a moment: "Winner - 7 jury votes (7-1-0)." gets no "Do you regret it?".
    if (/^(winner|runner|finalist|placed|finished|\d)/i.test(m.text) || (!m.x && m.text.length < 30)) continue;
    add('the-moment', heatOf[m.cls], { x: m.x, moment: m, cls: m.cls });
  }
  const stat = (story.stats || [])[0];
  if (stat) add('the-numbers', 3, { stat });
  for (const b of out) if (b.x) usedX.add(b.x);
  return out;
}

/** The people an answer can reach for, by role. */
function rolesOf(story, key) {
  const pool = (story.castNames || []).filter(n => n !== story.guest);
  const pickCast = salt => pickFrom(pool, `${key}|${salt}`);
  const any = (...xs) => xs.flat().find(n => n && n !== story.guest) || null;
  return {
    liar: any(story.betrayedBy, story.rivals),
    ally: any(story.allies, story.partner),
    rival: any(story.rivals, story.rivalOf),
    enemy: any(story.betrayedBy, story.rivals, story.rivalOf),
    winner: story.winner && story.winner !== story.guest ? story.winner : null,
    robbed: [story.runnerUp].find(n => n && n !== story.guest && n !== story.winner) || null,
    castmate: pickCast('castmate'),
    threat: any(story.winner !== story.guest ? story.winner : null, story.rivals, story.runnerUp),
    partner: story.partner || null,
  };
}

/** The angles of a beat this record can ask. */
const anglesFor = (list, facts) => (list || []).filter(g => !g.need
  || (g.need === '!x' ? !has(facts, 'x') : has(facts, g.need)));

/**
 * One beat, asked from one angle: the question, the answer written for that
 * question, and — when the beat is pressed — that angle's own press and the
 * crack that answers it.
 */
function exchangeFor(b, ctx, pressed = false) {
  const { story, style, voice, key, words } = ctx;
  const facts = {
    x: b.x, guest: story.guest, season: story.season, place: story.place,
    exitNight: EXIT_NIGHT[story.format] || EXIT_NIGHT[familyOf(story.format)] || 'the night you went home',
    players: words.players || 'players', player: words.player || 'player',
    status: b.status, quote: b.quote,
    ep: b.moment?.ep, moment: b.moment?.text,
  };
  let q = '', a = '', press = null, crack = null, receipt = null;
  if (b.type === 'the-numbers') {
    const st = b.stat;
    const roles = rolesOf(story, key);
    const y = st.type === 'idols' ? roles.ally
      : st.type === 'wins' ? (roles.rival || roles.robbed || roles.castmate)
        : st.type === 'blocks' ? ((story.betrayed || [])[0] || roles.rival)
          : st.type === 'bottoms' ? null : (roles.enemy || roles.rival);
    const f = { ...facts, n: String(st.n), y, s: st.n === 1 ? '' : 's' };
    const spec = NUMBERS[st.type];
    if (!spec || slotsOf(spec.q).some(k => !has(f, k))) return null;
    q = fill(spec.q, f);
    a = pickLine(NUMBER_A[spec.a]?.[style], `${key}|a`, f, 'y');
    receipt = { type: st.type, statement: q };
  } else {
    let ok = anglesFor(b.type === 'the-moment' ? (MOMENT_BEATS[b.cls] || MOMENT_BEATS.moment) : BEATS[b.type], facts);
    if (pressed && ok.some(g => g.press)) ok = ok.filter(g => g.press);
    const g = pickFrom(ok, `${key}|angle`);
    if (!g) return null;
    // An angle that does not name the person does not get to invent them.
    const f = g.need === 'x' || b.type === 'the-loss' ? facts : { ...facts, x: null };
    const bank = g.byRel ? g.byRel[['ally', 'rival', 'neutral'][b.rel ?? 2]] : g.a;
    q = pickLine(g.q, `${key}|q`, f);
    // An answer that echoes the question -- "Deserve is a big word", "Saw it
    // coming?", "Again?" -- needs the question to have said it. Asked "Would
    // you have voted for Wayne?", Julia answered "Deserve is a big word".
    const echoFits = t => {
      const m = String(t || '').match(/^([A-Z][a-z’']*(?: [a-z’']+){0,2})(?:\?| is a big word)/);
      return !m || q.toLowerCase().includes(m[1].toLowerCase());
    };
    a = pickLine(bank?.[style], `${key}|a`, f);
    for (let k = 1; k < 6 && a && !echoFits(a); k++) a = pickLine(bank?.[style], `${key}|a${k}`, f);
    if (pressed && g.press) {
      const pr = pickFrom(g.press, `${key}|p`);
      // A press that the answer already settled is not asked: "So is Lila
      // right or not?" after "Lila is right, honestly" is a host who was not
      // listening.
      if (pr && slotsOf(pr.p).every(k => has(f, k)) && !(pr.unless && pr.unless.test(a))) {
        press = fill(pr.p, f);
        crack = pickLine(pr.c?.[style], `${key}|c`, f) || null;
      }
    }
    if (b.type === 'the-moment') receipt = { type: 'moment', statement: b.moment.text };
    // A blindside, a betrayal or a boot that the record describes is read
    // out first: Kristal has the receipt, and says so.
    if (b.moment && ['the-backstab', 'the-betrayal', 'the-boot'].includes(b.type) && q) {
      q = `${b.moment.ep ? b.moment.ep + '. ' : ''}“${b.moment.text}” ${q}`;
      receipt = { type: 'moment', statement: b.moment.text };
    }
    if (b.type === 'the-record') receipt = { type: 'note', statement: b.moment.text };
  }
  if (!q || !a) return null;
  // `who`: the person this exchange named — they turn up in the comments (js/kristal-comments.js).
  const named = b.x && [q, a, crack].some(t => t && t.includes(b.x));
  const x = { topic: b.type, q, a, behavior: stanceFor(b.type, style, voice), who: named ? b.x : null };
  if (press && crack) { x.press = press; x.crack = crack; }
  if (receipt) x.receipt = receipt;
  x._facts = facts;
  return x;
}

/**
 * Write the whole transcript for one episode.
 *
 * `ep` carries id/kind/story/style/tier (a bare `facts` still works); `prior`
 * is the earlier episode this one answers, `earlier` every episode already
 * recorded this gap (a clip that names this guest is played to them), `visit`
 * which appearance this is. Pure text — nothing here touches a number.
 */
export function composeEpisode(ep, { words = {}, prior = null, earlier = [], visit = 1, salt = '' } = {}) {
  // The remix: a salt re-seeds every PICK while the episode's identity — the
  // guest, the beats, the listeners, the tier — stays exactly what it was.
  const K = salt ? `${ep.id}~${salt}` : ep.id;
  const voice = ep.voice || {
    ...voiceOf({ archetype: ep.archetype || '', stats: ep.stats || {} }),
    cadence: ep.style || styleOf({ archetype: ep.archetype || '', stats: ep.stats || {} }),
  };
  const style = ep.style && !ep.voice ? ep.style : voice.cadence || ep.style || 'deadpan';
  const story = { ...storyFromFacts(ep), ...(ep.story || {}) };
  if (!story.guest) story.guest = ep.guestName;

  // ── the clip: somebody earlier this gap said this guest's name ──
  // The mentioned guest's episode first (the person this hour is about), then
  // anybody else who sat down before and named them.
  const named = new RegExp(`\\b${esc(story.guest || '\u0000')}\\b`);
  // Only a line from an exchange where they were judged or something they did
  // was named: every answer to a clip is a defence ("leaves out everything X
  // did first", "X is right that I did it"), and played a compliment --
  // "I've never been so scared of anyone as I was of Bowie" -- it answered
  // something nobody said.
  // Not the record or the ballots either: "It's true. It's also only the half
  // Thom was there for" and "Bowie. I recognised the handwriting" mean nothing
  // without the question they answered. And not the nice-thing angle of a
  // rivalry, which is a compliment by request.
  // Nor a betrayal, which is the speaker CONFESSING ("I made Bowie pancakes
  // that morning"): "It's just wrong" does not answer an apology.
  const CLIPPABLE = new Set(['the-rivalry', 'the-backstab', 'the-boot', 'the-loss', 'the-winner']);
  const clipFrom = p => {
    if (!p || p.guest === ep.guest) return null;
    // Only a line that says their name: a clip about somebody else is not a clip.
    // ...and not a line paying them a compliment from inside an accusing beat:
    // "I appreciated that more than Isabel will ever know" is thanks.
    const PRAISE = /\b(appreciat\w*|grateful|thank\w*|respect\w*|love[sd]?|adore\w*|proud|saw through me|could (actually )?beat me)\b/i;
    const line = (p.exchanges || []).filter(x => CLIPPABLE.has(x.topic) && !/\bnice thing\b/i.test(x.q || ''))
      .flatMap(x => [x.crack, x.a]).find(t => t && named.test(t) && !PRAISE.test(t)) || null;
    // It is read out inside “…”, so its own quotation marks become single ones.
    return line ? { by: p.guestName, quote: line.replace(/“/g, '‘').replace(/”/g, '’') } : null;
  };
  const clip = clipFrom(prior) || earlier.map(clipFrom).find(Boolean) || null;

  const ctx = { story, style, voice, key: K, words };
  const limit = ep.tier === 'viral' ? 9 : ep.tier === 'solid' ? 7 : 5;
  const exchanges = [];

  if (ep.kind === 'life' && (story.life || []).length) {
    // ── the catch-up: the year first, as itself ──
    for (const [i, ev] of story.life.slice(0, 2).entries()) {
      const mood = Object.keys(MOOD).find(m => MOOD[m].includes(ev.kind));
      // A headline with no mood of its own (a promotion, a new job) is not an hour of radio.
      if (!mood) continue;
      const f = { whom: ev.whomName, event: ev.line, guest: story.guest };
      const q = pickLine(LIFE[mood].q, `${K}|lq|${i}`, f, 'whom');
      const a = pickLine(LIFE[mood].a[style], `${K}|la|${i}`, f, 'whom');
      if (!q || !a) continue;
      const x = { topic: 'the-life', q, a, behavior: stanceFor('the-life', style, voice), who: ev.whomName || null, mood, _facts: f };
      if (!exchanges.length) {
        x.press = pickFrom(LIFE_PRESS, `${K}|lp`);
        x.crack = pickFrom(LIFE_CRACK[style] || LIFE_CRACK.deadpan, `${K}|lc`);
      }
      exchanges.push(x);
    }
    // then the career, which is the follow-up material
    const beats = beatsFor(story, clip).filter(b => ['the-response', 'the-rivalry', 'the-backstab',
      'the-betrayal', 'the-winner', 'the-romance', 'the-romance-over'].includes(b.type))
      .sort((a, b) => b.heat - a.heat).slice(0, Math.max(1, limit - 4));
    for (const [i, b] of beats.entries()) {
      const x = exchangeFor(b, { ...ctx, key: `${K}|b${i}` });
      if (x) exchanges.push(x);
    }
    const roles = rolesOf(story, K);
    const f = { guest: story.guest, y: roles.rival || roles.winner };
    const a = pickLine(FUTURE_A[style], `${K}|fa`, f, 'y');
    if (a) exchanges.push({ topic: 'the-future', q: pickLine(FUTURE_Q, `${K}|fq`, f), a,
      behavior: stanceFor('the-future', style, voice) });
  } else {
    // ── the debrief ──
    // The guest sat down during the season too, and named a winner: play it back.
    const pd = story.prediction;
    if (pd && pd.said && story.winner && story.winner !== story.guest && pd.said !== story.guest) {
      const f = { week: String(pd.week || ''), said: pd.said, winner: story.winner,
        when: pd.week ? `${String(words.round || 'week').toLowerCase()} ${pd.week}` : null };
      const which = pd.right ? 'right' : 'wrong';
      const q = pickLine(PLAYBACK_Q[which], `${K}|pbq`, f, 'said');
      const a = pickLine(PLAYBACK_A[which], `${K}|pba`, f, 'said');
      if (q && a) exchanges.push({ topic: 'the-prediction', q, a, behavior: pd.right ? 'own' : 'reframe', who: pd.said });
    }
    const beats = beatsFor(story, clip);
    // The loudest beats, one per person where the record allows: the same
    // name three times is an interview about one person, which is fine only
    // when the season really was about one person.
    const chosen = [];
    const perX = new Map();
    const perType = new Map();
    const perCls = new Set();
    const quoted = new Set();
    for (const b of beats.slice().sort((a, b) => b.heat - a.heat || ORDER.indexOf(a.type) - ORDER.indexOf(b.type))) {
      if (chosen.length >= limit - 1) break;
      if (b.x && (perX.get(b.x) || 0) >= 2) continue;
      if ((perType.get(b.type) || 0) >= (b.type === 'the-moment' ? 2 : 1)) continue;
      if (b.type === 'the-moment' && perCls.has(b.cls)) continue;
      // One record line is read out once: the boot that IS the blindside is the blindside.
      if (b.moment && quoted.has(b.moment.text)) {
        if (b.type === 'the-boot' || b.type === 'the-moment') continue;
        b = { ...b, moment: null };
      }
      if (b.type === 'the-boot' && b.x && chosen.some(c => c.type === 'the-backstab' && c.x === b.x)) continue;
      chosen.push(b);
      if (b.cls) perCls.add(b.cls);
      if (b.moment) quoted.add(b.moment.text);
      if (b.x) perX.set(b.x, (perX.get(b.x) || 0) + 1);
      perType.set(b.type, (perType.get(b.type) || 0) + 1);
    }
    // Pressed: the loudest one (two on a viral) that Kristal has a press for.
    const pressBudget = ep.tier === 'viral' ? 2 : 1;
    const pressable = b => (BEATS[b.type] || []).some(g => g.press) && b.x;
    const pressOn = new Set(chosen.filter(pressable).slice(0, pressBudget));
    chosen.sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
    for (const [i, b] of chosen.entries()) {
      const x = exchangeFor(b, { ...ctx, key: `${K}|${b.type}|${i}` }, pressOn.has(b));
      if (x) exchanges.push(x);
    }
    // ── the close: somebody they would call, or advice for the next cast ──
    const roles = rolesOf(story, K);
    const f = { season: story.season, y: roles.ally || roles.castmate };
    const g = pickFrom(anglesFor(BEATS['behind-the-scenes'], f), `${K}|close`);
    const closeQ = g ? pickLine(g.q, `${K}|cq`, f) : '';
    const closeA = g ? pickLine(g.a[style], `${K}|ca`, f, 'y') : '';
    // Half the closes are the advice, so the last question is not always the same one.
    if (closeQ && closeA && hash(`${K}|close-kind`) % 2) {
      exchanges.push({ topic: 'behind-the-scenes', q: closeQ, a: closeA, behavior: stanceFor('behind-the-scenes', style, voice), who: f.y });
    } else {
      exchanges.push({ topic: 'the-advice', q: pickFrom(ADVICE_Q, `${K}|aq`),
        a: ADVICE[voice.archetype] || ADVICE.custom, behavior: 'own' });
    }
  }

  // ── the cold open, from the loudest beat ──
  const hook = exchanges.filter(x => x.topic !== 'the-advice' && x.topic !== 'behind-the-scenes')
    .slice().sort((a, b) => (b.press ? 1 : 0) - (a.press ? 1 : 0))[0] || null;
  const coFacts = { guest: story.guest, season: story.season, place: story.place,
    visit: String(visit), x: hook?._facts?.x, event: story.life?.[0]?.line };
  const coBank = visit > 1 ? COLD.returning
    : ep.kind === 'life' ? COLD.life
      : (hook && COLD[hook.topic]) || COLD.any;
  const coldOpen = pickLine(coBank, `${K}|cold`, coFacts) || pickLine(COLD.any, `${K}|cold2`, coFacts)
    || `Welcome to Kristal-talKs. My guest tonight is ${story.guest}.`;

  // ── rapid fire: four questions, every answer a name ──
  const roles = rolesOf(story, K);
  const rapid = [];
  const usedY = new Map();
  const start = hash(K + '|rf') % RAPID.length;
  // A showmance gets its question asked first: it is the one everybody wants.
  const order = RAPID.map((_, i) => RAPID[(start + i * 5) % RAPID.length]);
  if (roles.partner) order.sort((a, b) => (b.love ? 1 : 0) - (a.love ? 1 : 0));
  for (let i = 0; i < order.length && rapid.length < 4; i++) {
    const item = order[i];
    const y = roles[item.need];
    if (!y || (usedY.get(y) || 0) >= 2) continue;
    const f = { y, season: story.season, guest: story.guest };
    const q = fill(item.q, f);
    if (rapid.some(r => r.q === q)) continue;
    const ans = pickLine(item.s?.[style] || [], `${K}|rfs|${i}`, f, 'y') || pickLine(item.a, `${K}|rfa|${i}`, f, 'y');
    // "Rana." under two questions is one answer twice.
    if (!ans || rapid.some(r => r.a === ans)) continue;
    rapid.push({ q, a: ans });
    usedY.set(y, (usedY.get(y) || 0) + 1);
  }
  // A guest with nobody on the record still plays, with the questions about themselves.
  for (const [q, a] of [['Would you go back tomorrow?', 'Yes, but I’d play it very differently.'],
    ['Rate your edit out of ten.', 'Six. Fair, mostly.'], ['Best day in there?', 'The first one, before anyone knew anything.'],
    ['Worst day?', 'The last one.']]) {
    if (rapid.length >= 4) break;
    rapid.push({ q, a });
  }

  const titleHook = hook?._facts?.x || null;
  for (const x of exchanges) delete x._facts;
  // What the clip everyone shares actually says — the last crack, or the
  // loudest answer. Later guests are played these.
  const crackX = exchanges.filter(x => x.crack).pop();
  ep._lastCrack = crackX ? crackX.crack : null;
  ep._lastAnswer = exchanges.length ? exchanges[exchanges.length - 1].a : null;
  const pressed = exchanges.filter(x => x.crack).length;
  return { coldOpen, exchanges, rapid, pressed, hook: titleHook };
}

/** Consequences are derived from the interview and never written back merely
 *  because the page opened. Other surfaces can display or deliberately
 *  materialize them later without making a page view alter canon. */
export function podcastAftermath(ep) {
  const xs = ep.exchanges || [];
  const receipts = xs.filter(x => x.receipt);
  const owned = xs.filter(x => ['own', 'apologize'].includes(x.behavior)).length;
  const resisted = xs.filter(x => ['deflect', 'dispute'].includes(x.behavior)).length;
  const explained = xs.filter(x => ['explain', 'justify', 'reframe'].includes(x.behavior)).length;
  const credibilityScore = Math.max(-3, Math.min(6,
    receipts.length + owned * 2 + explained - resisted * 2));
  const credibility = credibilityScore >= 5 ? 'strengthened'
    : credibilityScore >= 2 ? 'credible' : credibilityScore >= 0 ? 'mixed' : 'damaged';
  const controversy = Math.max(0, Math.min(10,
    (ep.tier === 'viral' ? 4 : ep.tier === 'solid' ? 2 : 0)
      + resisted * 2 + (ep.mentioned ? 2 : 0) + xs.filter(x => x.press).length));
  const apologized = xs.some(x => x.behavior === 'apologize');
  const relationship = !ep.mentioned ? null : apologized
    ? { with: ep.mentioned, direction: 'repair', label: 'A public apology opened the door to a private conversation.' }
    : resisted ? { with: ep.mentioned, direction: 'worsen', label: 'The disputed account added new tension to the relationship.' }
      : { with: ep.mentioned, direction: 'unchanged', label: 'The relationship remains unresolved.' };
  const responseRequested = Boolean(ep.mentioned && ep.tier === 'viral'
    && (controversy >= 6 || relationship?.direction === 'worsen'));
  const tags = [credibility === 'strengthened' ? 'owned the record'
    : credibility === 'damaged' ? 'story questioned' : 'account debated'];
  if (apologized) tags.push('public apology');
  if (responseRequested) tags.push('response requested');
  return { credibility, credibilityScore, controversy, relationship,
    responseRequested, receiptsTested: receipts.length, tags };
}

// ── the room under an episode: js/kristal-comments.js (rebuilt 2026-10-21) ──
export { episodeComments } from './kristal-comments.js';
