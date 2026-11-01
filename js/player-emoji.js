// A player's icon: who they are, from the wiki, and what they did on the show.
//
// devotees.html draws `player.emoji` on every card. It used to come from two
// places only: the AI fill (which a season exported without the fill pass, or
// without credits, never gets) and a hand-written map of the original Total
// Drama cast. Everybody else drew the generic silhouette.
//
// The user, 2026-10-31: "the emoji is always based on their personality from
// the wiki and the show combined". So every player is scored against the
// THEMES below from three sources at once:
//   - the wiki's biography of the character (franchise_roster.json: the
//     descriptor, the occupation, the personality, the backstory, the archetype)
//   - what the wiki wrote about them on that season (the season document's
//     `personality` and `lead`, and the season detail's play style and moments)
//   - the record itself: a Traitor's rounds, a showmance, the comps they won,
//     the fights they had, the public's read
// and takes an icon from the theme that scores highest, so a florist who
// schemed her way to the end reads differently from a florist who was dumped
// on night three.
//
// An icon the AI or a person chose is never replaced. A derived one is stored
// as `autoEmoji` too, with the appearance it was read from (`autoEmojiFrom`);
// it is re-read when that appearance changes (a comeback, a win) or is the
// season being merged, and otherwise kept, so icons don't drift every export.
import { players as castPlayers } from './core.js';
import { DEFAULT_FORMAT, seasonId } from './shows.js';

// The original cast, hand-picked (the same map devotees.html falls back on).
export const HAND_EMOJI = {
  'alejandro': '👑', 'lindsay': '💁', 'duncan': '💀', 'emma': '🎯', 'cameron': '🧠',
  'bridgette': '🏄', 'trent': '🎸', 'owen': '🍔', 'heather': '💅', 'beth': '🌸',
  'gwen': '🎨', 'courtney': '📋', 'noah': '📚', 'ezekiel': '🏔️', 'geoff': '🎉',
  'zoey': '❤️', 'scott': '🚜', 'mike': '🎭', 'anne maria': '💄', 'brick': '🎖️',
  'dwayne': '👨‍👦', 'jo': '💪', 'dakota': '✨', 'dawn': '🌿', 'b': '🔧',
  'sam': '🎮', 'lightning': '⚡', 'staci': '💬', 'crimson': '🖤', 'harold': '🤓',
  'leshawna': '💁', 'justin': '😎', 'katie': '💖', 'sadie': '💖', 'izzy': '🤪',
  'lynda': '⚡', 'marissa': '🦸', 'natalia': '🌪️', 'richard': '⚔️', 'spencer': '♟️',
  'ted': '🎭', 'tristan': '🥊', 'zaid': '🎖️',
};

const n = v => Number(v) || 0;
const len = v => (Array.isArray(v) ? v.length : 0);

/* THE THEMES. `words` is read against the wiki text; `arche` adds the
   character's archetype; `record(d)` reads one season of what they did, from
   whichever show block that season carries (bb, ss, tr, dr, pm, ci, ch, rr). */
const THEMES = [
  { key: 'music', icons: ['🎸', '🎧', '🎤', '🎹'], words: /\b(musician|singer|sing(s|ing)?|guitar|band\b|dj\b|rapper|song|cabaret)/gi,
    record: d => (n(d.dr?.smackdownCrowns) ? 1.5 : 0) },
  { key: 'dance', icons: ['💃', '🩰', '🕺'], words: /\b(danc|ballet|choreograph)/gi,
    record: d => (n(d.dr?.lipsyncWins) >= 2 ? 2 : 0) },
  { key: 'art', icons: ['🎨', '🖌️', '🖼️'], words: /\b(artist|art\b|art-school|paint|draw|graphic design|creative|tattoo|vision)/gi },
  { key: 'camera', icons: ['📷', '🎬'], words: /\b(photograph|camera|film|director)/gi },
  { key: 'fashion', icons: ['💅', '💄', '👗', '👠'], words: /\b(fashion|makeup|glam|beauty|model|runway|style|stylish|pageant|vain|image consultant|couture|sew)/gi,
    record: d => (n(d.dr?.wins) >= 2 ? 1.5 : 0) },
  { key: 'stage', icons: ['🎭', '✨', '🌟'], words: /\b(actor|actress|acting|theat|drama queen|stage|improv|perform|hollywood|main character|spotlight|attention|dramatic|diva|headliner)/gi },
  { key: 'comedy', icons: ['😂', '🤡', '🃏'], words: /\b(comed|funny|joke|humou?r|laugh|banter|clown|goof)/gi, arche: ['goat'] },
  { key: 'sport', icons: ['💪', '🏋️', '🏅', '⚡'], words: /\b(athlet|sport|gym|fitness|trainer|football|soccer|rugby|box(er|ing)|wrestl|competitive|competitor|physical|powerhouse|self-defen[cs]e)/gi,
    arche: ['challenge-beast'],
    record: d => {
      const comps = n(d.immunityWins) + n(d.ch?.dailyWins) + n(d.ch?.arenaWins) + n(d.rr?.legWins) + n(d.bb?.hohWins) + n(d.bb?.vetoWins);
      return comps >= 4 ? 2.5 : comps >= 2 ? 1.2 : 0;
    } },
  { key: 'outdoors', icons: ['🏄', '🤠', '🌲', '🐄'], words: /\b(surf|farm|cowboy|logger|outdoors|hik(e|ing)|ranch|dairy|country|southern|daredevil)/gi },
  { key: 'mystic', icons: ['🔮', '🌙', '🃏'], words: /\b(tarot|astrolog|witch|spiritual|psychic|crystal|zodiac|horoscope)/gi },
  { key: 'brains', icons: ['🤓', '📚', '🧪', '🎓'], words: /\b(nerd|geek|book|scien|statistic|academic|student|stud(y|ies)|psycholog|superfan|trivia|class president)/gi },
  { key: 'medic', icons: ['🩺', '💉'], words: /\b(doctor|nurse|medic|dental|paramedic|surgeon)/gi },
  { key: 'law', icons: ['👮', '⚖️', '📋'], words: /\b(police|cop\b|lawyer|legal|law\b|commissioner|mayor|drill sergeant|rules)/gi },
  { key: 'money', icons: ['💼', '💸', '💎'], words: /\b(financ|business|heiress|rich|money|debutante|snob|corporate|sales|banker|wealth|privilege)/gi },
  { key: 'food', icons: ['🍳', '🍔', '🧁'], words: /\b(chef|cook|bak(er|ing)|food|eat(s|ing)?\b|bartender|cupcake|brunch)/gi },
  { key: 'gamer', icons: ['🎮', '💻', '🕹️'], words: /\b(gamer|gaming|streamer|tech|coder|programm|video game|poker)/gi },
  { key: 'online', icons: ['📱', '🤳', '🎙️'], words: /\b(influencer|social media|followers|podcast|vlog|brand)/gi },
  { key: 'schemer', icons: ['🐍', '🦊', '🕷️', '🗡️'], words: /\b(manipulat|schem|cunning|calculat|ruthless|liar|lies|lying|deceiv|deception|sly|villain|evil|two-faced|backstab|fox\b|traitor)/gi,
    arche: ['schemer', 'villain'],
    record: d => (n(d.tr?.roundsAsTraitor) || n(d.tr?.timesRecruited) ? 2 + Math.min(4, n(d.tr?.roundsAsTraitor)) : 0) + (n(d.rr?.sabotage) ? 1.5 : 0)
      + (['villain', 'disliked'].includes(d.pm?.label) ? 1.5 : 0) + (len(d.betrayed) ? 1 : 0) },
  { key: 'mind', icons: ['🧠', '♟️', '🧩'], words: /\b(strateg|planner|plans?\b|clever|sharp|smart|mastermind|analy|architect|navigator|chess|calculat|intelligen)/gi,
    arche: ['mastermind', 'schemer', 'perceptive-player'],
    record: d => (d.strategicRank === 'High' ? 2 : 0) + (n(d.bb?.hohWins) >= 2 ? 1 : 0) },
  { key: 'watcher', icons: ['👁️', '🔍', '🕵️', '🦉'], words: /\b(observ|notic|watch|perceptive|reads? people|spy|listener|files it|detail)/gi,
    arche: ['perceptive-player'],
    record: d => (n(d.tr?.reads) >= 3 ? 1.5 : 0) + (n(d.ss?.secretsFound) ? 1.5 : 0) },
  { key: 'fire', icons: ['🔥', '🌋', '💥', '🌶️'], words: /\b(temper|hot-?head|explosive|fiery|firecracker|blunt|confront|argu|aggress|loud|volatile|wrecking ball|storm|clash|feud)/gi,
    arche: ['hothead', 'villain', 'chaos-agent'],
    record: d => (len(d.pm?.enemies) >= 2 ? 1.5 : 0) + (len(d.rivalries) >= 3 ? 1 : 0) + (n(d.ch?.calledOut) >= 2 ? 1.5 : 0) },
  { key: 'chaos', icons: ['🌪️', '🤪', '🎲', '🧨'], words: /\b(chaotic|chaos|unpredictable|wild\b|impulsive|eccentric|spontaneous|reckless|wildcard|bad influence|mischie)/gi,
    arche: ['wildcard', 'chaos-agent'],
    record: d => (n(d.pm?.couplings) >= 3 ? 1 : 0) },
  { key: 'romance', icons: ['💘', '💋', '🌹', '💌'], words: /\b(romantic|romance|flirt|in love|falls? (for|fast)|heartbreak|charmer|temptation|homewrecker|crush|seduc|lover)/gi,
    arche: ['showmancer'],
    record: d => (d.showmance ? 1.5 : 0) + (n(d.pm?.couplings) >= 2 ? 1 : 0) + (len(d.showmances) >= 2 ? 1 : 0) },
  { key: 'heart', icons: ['🫶', '💛', '🧸', '☀️'], words: /\b(kind|warm|caring|gentle|sweet|generous|big heart|open heart|sunshine|puppy|soft|empath|nurtur|motherly|matriarch|includ|looks out for)/gi,
    arche: ['hero', 'social-butterfly', 'underdog'],
    record: d => (d.fanFavourite ? 1.5 : 0) + (['fan-favourite', 'loved'].includes(d.pm?.label) ? 1 : 0)
      + (n(d.dr?.congeniality) || /congeniality/i.test(d.status || '') ? 2 : 0) },
  { key: 'hero', icons: ['🦸', '🛡️', '🦁'], words: /\b(protect|honest|brave|integrity|sticks? up|hero|moral|fair\b|golden boy|principle|a line)/gi,
    arche: ['hero'],
    record: d => (n(d.bb?.vetoWins) >= 2 ? 1 : 0) + (n(d.tr?.shieldsWon) ? 1 : 0) },
  { key: 'party', icons: ['🎉', '🥂', '🪩'], words: /\b(party|life of the|club|nightlife|good time|fun-loving|bubbly|essex|wave)/gi,
    arche: ['social-butterfly'] },
  { key: 'social', icons: ['🦋', '💬', '🤝'], words: /\b(social|outgoing|chatty|talker|charm|friendly|mixer|connect|conversation|popular|mingl|easy to like)/gi,
    arche: ['social-butterfly', 'floater'],
    record: d => (n(d.ci?.avgRating) >= 4 ? 1.5 : 0) + (len(d.alliances) >= 3 ? 1 : 0) },
  { key: 'leader', icons: ['👑', '📣', '🏆'], words: /\b(leader|bossy|in charge|command|organi[sz]|control|ambitious|confident|queen|perfectionist|president|front-runner|matriarch)/gi,
    arche: ['mastermind'],
    record: d => (d.status === 'Winner' ? 1.5 : 0) + (n(d.ci?.influencerTimes) >= 2 ? 1.5 : 0) + (n(d.bb?.hohWins) >= 2 ? 1 : 0) },
  { key: 'loyal', icons: ['⚓', '🐕', '🤞'], words: /\b(loyal|dependable|reliable|steady|devoted|ride or die|keeps (his|her|their) word)/gi,
    arche: ['loyal-soldier'],
    record: d => (len(d.unbreakableBonds) ? 1 : 0) + (n(d.rr?.helped) >= 2 ? 1.5 : 0) },
  { key: 'underdog', icons: ['🌱', '🍀', '🐢', '🪶'], words: /\b(underdog|overlooked|shy|awkward|insecur|nervous|anxious|timid|underestimat|slow burn|quiet)/gi,
    arche: ['underdog', 'goat', 'floater'],
    record: d => (n(d.bb?.timesNominated) >= 4 ? 1.5 : 0) + (n(d.pm?.publicVotesSurvived) >= 2 ? 1 : 0) + (n(d.dr?.bottoms) >= 3 ? 1 : 0) },
  { key: 'cool', icons: ['🕶️', '🧊', '🐺', '🎭'], words: /\b(cool|aloof|reserved|guarded|private|ice\b|lone wolf|mysterious|secretive|calm|unbothered|stoic|evasive|distance)/gi,
    record: d => (n(d.ci?.catfishSeasons) || d.ci?.mode === 'catfish' ? 2 : 0) + (n(d.ss?.secretKept) ? 2 : 0) },
  { key: 'gloom', icons: ['🖤', '💀', '🦇', '🥀'], words: /\b(goth|dark|gloomy|downer|bitter|cynic|sarcas|grumpy|horror|ghoul|morbid|taxiderm|deadpan)/gi },
];

// What the wiki says about a character, field by field, and how much each counts.
const BIO_FIELDS = [['descriptor', 3, 2], ['occupation', 2.5, 2], ['personality', 1, 3], ['backstory', 0.4, 2]];

let ROSTER = new Map();
/** The wiki's characters (franchise_roster.json rows). */
export function setEmojiRoster(list) {
  ROSTER = new Map();
  for (const r of list || []) {
    if (!r || typeof r !== 'object') continue;
    if (r.slug) ROSTER.set(String(r.slug).toLowerCase(), r);
    if (r.name) ROSTER.set(String(r.name).toLowerCase(), r);
  }
}
// In the browser the roster is fetched once, long before any export runs.
if (typeof window !== 'undefined' && typeof fetch === 'function') {
  fetch('franchise_roster.json').then(r => (r.ok ? r.json() : null))
    .then(j => { if (j && !ROSTER.size) setEmojiRoster(Array.isArray(j) ? j : j.players); }).catch(() => {});
}
function bioOf(p) {
  const keys = [p.id, p.name].filter(Boolean).map(k => String(k).toLowerCase());
  for (const k of keys) if (ROSTER.has(k)) return ROSTER.get(k);
  // the cast in the simulator: a character made for this season is not on the published roster yet
  const name = String(p.name || '').toLowerCase();
  return (castPlayers || []).find(c => c && (String(c.name || '').toLowerCase() === name || c.slug === p.id)) || null;
}

const formatOf = d => d.format || DEFAULT_FORMAT;
const seasonKey = d => d.seasonId || seasonId(formatOf(d), d.season);

function hash(s) {
  let h = 0;
  for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}
const rotate = (pool, k) => pool.map((_, i) => pool[(i + k) % pool.length]);

// The appearance that defines a player: their latest win, else their latest season.
function definingSeason(p) {
  const ds = (p.seasonDetails || []).filter(Boolean);
  const wins = ds.filter(d => d.status === 'Winner');
  return (wins.length ? wins : ds).at(-1) || null;
}

const textOf = v => (Array.isArray(v) ? v.join(' ') : typeof v === 'string' ? v : '');

/**
 * How strongly each theme fits this player: the wiki's biography, what the
 * wiki wrote about the season (`seasonText`), and every season's record, the
 * defining one in full and the rest at half.
 */
export function themeScores(p, defining, seasonText = '') {
  const score = Object.fromEntries(THEMES.map(t => [t.key, 0]));
  const read = (text, weight, cap) => {
    if (!text) return;
    for (const t of THEMES) {
      const hits = (String(text).match(t.words) || []).length;
      if (hits) score[t.key] += Math.min(cap, hits) * weight;
    }
  };
  const bio = bioOf(p);
  if (bio) {
    for (const [field, w, cap] of BIO_FIELDS) read(bio[field], w, cap);
    for (const t of THEMES) if (t.arche?.includes(bio.archetype)) score[t.key] += 2;
  }
  read(seasonText, 1.5, 3);
  for (const d of p.seasonDetails || []) {
    if (!d) continue;
    const w = d === defining ? 1 : 0.5;
    read(d.gameplayStyle, 2 * w, 2);
    read(textOf(d.keyMoments) + ' ' + textOf(d.notes), 0.5 * w, 2);
    // What they did counts double: the same biography reads differently as a Traitor.
    for (const t of THEMES) if (t.record) score[t.key] += t.record(d) * w * 2;
  }
  return score;
}

const FINAL = ['⭐', '🌟', '🎖️'];
const DEEP = ['🔥', '🦅', '🌹', '🎯', '🌙', '🦊', '🐺', '🌊'];
const MIDDLE = ['🌗', '🎈', '🧩', '🪁', '🎲', '🌀', '🍀', '🐝'];
const EARLY = ['🥀', '🍂', '🚪', '👋', '🌧️', '🪶', '🕊️', '🌫️'];
// Last resort, so a big cast never has to share.
const ANY = ['🦋', '🌵', '🍉', '🎐', '🪐', '🐚', '🍒', '🦩', '🌈', '🎵', '🐬', '🍋', '🦚', '🌼',
  '🐙', '🧿', '🪷', '🦉', '🍄', '🐢', '🎀', '🧸', '🪸', '🐳', '🌋', '🧊', '🦁', '🐞', '🍓', '🌴'];

// Every icon this player could take, best fit first.
export function emojiCandidates(p, d, castSize, seasonText = '') {
  const k = hash(p.name);
  const score = themeScores(p, d, seasonText);
  const fits = THEMES.filter(t => score[t.key] > 0)
    .sort((a, b) => score[b.key] - score[a.key] || (hash(p.name + a.key) - hash(p.name + b.key)));
  const pools = fits.map(t => t.icons);
  // Nothing on the wiki and nothing on the record: how far they got.
  const place = n(d.placement) || castSize;
  const frac = castSize > 1 ? Math.min(1, Math.max(0, (place - 1) / (castSize - 1))) : 0.5;
  if (/runner|finalist/i.test(d.status || '') || frac <= 0.15) pools.push(FINAL);
  pools.push(frac >= 0.75 ? EARLY : frac >= 0.4 ? MIDDLE : DEEP, ANY);
  return pools.flatMap(pool => rotate(pool, k % pool.length));
}

/**
 * Gives every player in a players database an icon, in place, and returns the
 * database. Hand-picked and AI-chosen icons are kept. Within one season's cast
 * nobody shares an icon if it can be helped.
 *
 * `seasonDoc` is the season being merged: its players are re-read, with what
 * the wiki wrote about them if it has been written. `refresh` re-reads every
 * derived icon (the backfill, which has every season's wiki to hand through
 * `wikiText(seasonKey, name)`).
 */
export function fillCareerEmoji(db, seasonDoc = null, { refresh = false, wikiText = null } = {}) {
  const players = db?.players || [];
  const merging = seasonDoc?.seasonId || (seasonDoc?.seasonNumber
    ? seasonId(seasonDoc.format || DEFAULT_FORMAT, seasonDoc.seasonNumber) : null);
  const docText = new Map((seasonDoc?.placements || seasonDoc?.players || [])
    .filter(x => x?.name).map(x => [x.name, [x.lead, x.personality, x.gameplayStyle].map(textOf).join(' ')]));
  const cast = new Map();                 // season key -> players who appeared in it
  for (const p of players) {
    for (const d of p.seasonDetails || []) {
      if (!d) continue;
      const key = seasonKey(d);
      if (!cast.has(key)) cast.set(key, new Set());
      cast.get(key).add(p);
    }
  }
  const todo = new Map();                 // season key -> [{ p, d }]
  for (const p of players) {
    const ours = !p.emoji || (p.autoEmoji && p.emoji === p.autoEmoji);
    if (!ours) { delete p.autoEmoji; delete p.autoEmojiFrom; continue; }
    // The originals' icons, for the originals: a Drag Race queen called Jo is not Total Drama's Jo.
    const td = (p.seasonDetails || []).some(d => d && formatOf(d) === DEFAULT_FORMAT);
    const hand = td ? HAND_EMOJI[String(p.name || '').toLowerCase()] : null;
    if (hand) { p.emoji = hand; delete p.autoEmoji; delete p.autoEmojiFrom; continue; }
    const d = definingSeason(p);
    if (!d) continue;
    const key = seasonKey(d);
    const from = `${key}:${d.status || ''}:${d.placement ?? ''}`;
    if (p.emoji && !refresh && key !== merging && p.autoEmojiFrom === from) continue;
    p.emoji = '';
    p.autoEmojiFrom = from;
    if (!todo.has(key)) todo.set(key, []);
    todo.get(key).push({ p, d });
  }
  for (const [key, list] of todo) {
    const members = cast.get(key) || new Set();
    const used = new Set([...members].map(p => p.emoji).filter(Boolean));
    list.sort((a, b) => (n(a.d.placement) || 99) - (n(b.d.placement) || 99) || String(a.p.name).localeCompare(String(b.p.name)));
    for (const { p, d } of list) {
      const text = (key === merging ? docText.get(p.name) : '') || wikiText?.(key, p.name) || '';
      const options = emojiCandidates(p, d, members.size, text);
      const pick = options.find(e => !used.has(e)) || options[0];
      used.add(pick);
      p.emoji = pick;
      p.autoEmoji = pick;
    }
  }
  return db;
}
