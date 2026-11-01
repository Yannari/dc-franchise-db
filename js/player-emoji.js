// A player's icon, from their time on the show.
//
// devotees.html draws `player.emoji` on every card. It used to come from two
// places only: the AI fill (which a season exported without the fill pass, or
// without credits, never gets) and a hand-written map of the original Total
// Drama cast. Everybody else drew the generic silhouette. This gives every
// player an icon at merge time, read from their record: a win, what they were
// known for on that show, or how far they got.
//
// An icon the AI or a person chose is never replaced. A derived one is stored
// twice, as `emoji` and `autoEmoji`; while the two match it is still ours and
// is re-derived on every merge, so an early boot who comes back and wins gets
// the crown.
import { DEFAULT_FORMAT, engineOf, seasonId } from './shows.js';

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

const WIN = {
  'total-drama': ['🏆', '💰', '🥇'],
  'big-brother': ['🔑', '🏆', '💰'],
  'secret-story': ['🤫', '🔐', '🏆'],
  'traitors': ['🏆', '💰', '🛡️'],
  'drag-race': ['👑', '💎', '✨'],
  'perfect-match': ['💞', '💍', '🏆'],
  'the-circle': ['📱', '🏆', '💬'],
  'the-challenge': ['🏆', '🥇', '💪'],
  'ridonculous-race': ['🏁', '🌍', '🏆'],
};
const TRAITOR_WIN = ['🗡️', '🎭', '💰'];
const FINAL = ['⭐', '🌟', '🎖️'];
const FAN = ['💖', '🌻', '🫶'];
const DEEP = ['🔥', '🦅', '🌹', '🎯', '🌙', '🦊', '🐺', '🌊'];
const MIDDLE = ['🌗', '🎈', '🧩', '🪁', '🎲', '🌀', '🍀', '🐝'];
const EARLY = ['🥀', '🍂', '🚪', '👋', '🌧️', '🪶', '🕊️', '🌫️'];
// Last resort, so a big cast never has to share.
const ANY = ['🦋', '🌵', '🍉', '🎐', '🪐', '🐚', '🍒', '🦩', '🌈', '🎵', '🐬', '🍋', '🦚', '🌼',
  '🐙', '🧿', '🪷', '🦉', '🍄', '🐢', '🎀', '🧸', '🪸', '🐳', '🌋', '🧊', '🦁', '🐞', '🍓', '🌴'];

const n = v => Number(v) || 0;

// What a player was known for on each show, strongest first: [did it, icons].
const house = d => {
  const bb = d.bb || {}, ss = d.ss || {};
  return [
    [n(ss.secretKept) >= 1, ['🔒', '🤐']],
    [n(ss.secretsFound) >= 1, ['🔍', '🕵️']],
    [n(ss.buzzesWrong) >= 2, ['🚨']],
    [n(bb.hohWins) >= 2, ['👑', '🏠']],
    [n(bb.vetoWins) >= 2, ['🛡️', '🔓']],
    [n(bb.blockBusterWins) >= 1, ['🧱']],
    [n(bb.timesNominated) >= 4, ['🎯', '🪑']],
  ];
};
const SIGNS = {
  'total-drama': d => [
    [n(d.immunityWins) >= 3, ['💪', '🏅']],
    [n(d.idolsFound) >= 1, ['🗿', '🔮']],
    [d.strategicRank === 'High', ['🧠', '♟️']],
    [n(d.votesReceived) >= 8, ['🎯']],
  ],
  'big-brother': house,
  'secret-story': house,
  'traitors': ({ tr = {}, status = '' }) => [
    [n(tr.roundsAsTraitor) > 0 || n(tr.timesRecruited) > 0, ['🗡️', '🎭', '🐍']],
    [/murder/i.test(status), ['🕯️', '🌙', '⚰️']],
    [n(tr.shieldsWon) >= 1, ['🛡️']],
    [n(tr.reads) >= 3, ['🔍', '👁️']],
    [/banish/i.test(status), ['⚖️']],
  ],
  'drag-race': ({ dr = {}, status = '' }) => [
    [n(dr.wins) >= 2, ['💎', '👠']],
    [/congeniality/i.test(status) || n(dr.congeniality) > 0, ['🌸', '💐']],
    [n(dr.lipsyncWins) >= 2, ['💃', '🎤']],
    [n(dr.smackdownCrowns) >= 1, ['🎙️']],
    [n(dr.bottoms) >= 3, ['🫠', '🪭']],
  ],
  'perfect-match': ({ pm = {}, showmance, showmanceEnded }) => [
    [['fan-favourite', 'loved'].includes(pm.label), ['🥰', '💖']],
    [['villain', 'disliked'].includes(pm.label), ['😈', '🐍']],
    [pm.label === 'divisive', ['🌶️', '⚡']],
    [n(pm.timesStolen) >= 1, ['💔']],
    [n(pm.couplings) >= 3, ['🔄', '🦋']],
    [(pm.enemies || []).length >= 2, ['🔥']],
    [!!showmance && showmanceEnded !== 'broken', ['💑']],
    [pm.label === 'invisible', ['👻', '🫥']],
  ],
  'the-circle': ({ ci = {} }) => [
    [n(ci.catfishSeasons) > 0 || ci.mode === 'catfish', ['🎭', '🐟']],
    [n(ci.influencerTimes) >= 2, ['📣', '⭐']],
    [n(ci.blocksMade) >= 2, ['⛔', '🚫']],
    [n(ci.avgRating) >= 4, ['📈', '💬']],
  ],
  'the-challenge': ({ ch = {} }) => [
    [n(ch.arenaWins) >= 2, ['⚔️', '🥊']],
    [n(ch.dailyWins) >= 2, ['🏋️', '💪']],
    [n(ch.timesVotedIn) >= 3, ['🎯']],
    [n(ch.calledOut) >= 2, ['📢']],
    [n(ch.volunteered) >= 2, ['🙋']],
  ],
  'ridonculous-race': ({ rr = {} }) => [
    [n(rr.legWins) >= 2, ['🚀', '🏃']],
    [n(rr.sabotage) >= 1, ['🪤']],
    [n(rr.helped) >= 2, ['🤝']],
    [n(rr.penalties) >= 2, ['⏱️', '🚩']],
    [n(rr.lasts) >= 2, ['🐢']],
    [n(rr.begged) >= 1, ['🙏']],
  ],
};
const signatures = (show, d) => (SIGNS[show]?.(d) || []).filter(([did]) => did).map(([, pool]) => pool);

const formatOf = d => d.format || DEFAULT_FORMAT;
// A spin-off with no table of its own (All Stars) reads as its parent show.
const showOf = d => (SIGNS[formatOf(d)] ? formatOf(d) : engineOf(formatOf(d)) || DEFAULT_FORMAT);
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

// Every icon this player could take, in the order they should try them.
export function emojiCandidates(name, d, castSize) {
  const show = showOf(d);
  const k = hash(name);
  const place = n(d.placement) || castSize;
  const frac = castSize > 1 ? Math.min(1, Math.max(0, (place - 1) / (castSize - 1))) : 0.5;
  // The crown keeps its order; everything else is rotated by
  // name so two players with the same record don't reach for the same icon.
  const fixed = [];
  if (d.status === 'Winner') {
    // A Traitor who took the pot wins with the dagger, not the shield.
    fixed.push(...(n(d.tr?.roundsAsTraitor) > 0 ? TRAITOR_WIN : WIN[show] || WIN[DEFAULT_FORMAT]));
  }
  const pools = [...signatures(show, d)];
  if (d.fanFavourite) pools.push(FAN);
  if (d.status !== 'Winner' && (/runner|finalist/i.test(d.status || '') || frac <= 0.15)) {
    pools.push(place === 2 ? ['🥈'] : place === 3 ? ['🥉'] : [], FINAL);
  }
  pools.push(frac >= 0.75 ? EARLY : frac >= 0.4 ? MIDDLE : DEEP);
  pools.push(ANY);
  return [...fixed, ...pools.flatMap(pool => rotate(pool, pool.length ? k % pool.length : 0))];
}

/**
 * Gives every player in a players database an icon, in place, and returns the
 * database. Hand-picked and AI-chosen icons are kept; derived ones are
 * re-derived. Within one season's cast nobody shares an icon if it can be helped.
 */
export function fillCareerEmoji(db) {
  const players = db?.players || [];
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
    if (!ours) { delete p.autoEmoji; continue; }
    // The originals' icons, for the originals: a Drag Race queen called Jo is not Total Drama's Jo.
    const td = (p.seasonDetails || []).some(d => d && formatOf(d) === DEFAULT_FORMAT);
    const hand = td ? HAND_EMOJI[String(p.name || '').toLowerCase()] : null;
    if (hand) { p.emoji = hand; delete p.autoEmoji; continue; }
    const d = definingSeason(p);
    if (!d) continue;
    p.emoji = '';
    const key = seasonKey(d);
    if (!todo.has(key)) todo.set(key, []);
    todo.get(key).push({ p, d });
  }
  for (const [key, list] of todo) {
    const members = cast.get(key) || new Set();
    const used = new Set([...members].map(p => p.emoji).filter(Boolean));
    list.sort((a, b) => (n(a.d.placement) || 99) - (n(b.d.placement) || 99) || String(a.p.name).localeCompare(String(b.p.name)));
    for (const { p, d } of list) {
      const options = emojiCandidates(p.name, d, members.size);
      const pick = options.find(e => !used.has(e)) || options[0];
      used.add(pick);
      p.emoji = pick;
      p.autoEmoji = pick;
    }
  }
  return db;
}
