// ══════════════════════════════════════════════════════════════════════
// ci/transcript.js — a season, readable top to bottom
// ══════════════════════════════════════════════════════════════════════
//
// The main quality tool (ADDING-A-SHOW §16.1): every aired scene, both layers
// of every message — what the player says out loud and what arrives on the
// screen — every reaction, and the host. The first message of a block is
// shown dictated, as the real edit does; later ones show only the screen.
import { peopleOf } from './state.js';
import { hostName } from './script.js';
import { GAMES } from './games-data.js';

export const TITLES = {
  profiles: 'Setting up the profiles', recognise: 'A face they know', status: 'Status update',
  likes: 'The Newsfeed', chat: 'Private chat', 'circle-chat': 'Circle Chat', arrival: 'A new Player', welcome: 'Welcome to The Circle', 'group-chat': 'A group chat',
  'after-party': 'The after-party', ratings: 'The Ratings', hangout: 'The Hangout', alert: 'An alert', save: 'A save', offer: 'The offer', plead: 'The last two', vote: 'The vote', statement: 'Who would you block?', antivirus: 'The antivirus', date: 'A date', invites: 'The invitations', race: 'The race to message', newparty: "The newcomer's party", lurk: 'Watching in secret', chosen: 'Chosen by the Influencers', 'pair-arrival': 'Two new Players', 'power-reveal': 'News from the Circle', hack: 'The Hacker', 'hack-undone': 'Comparing notes', 'joker-chat': 'The Joker', 'joker-pick': "The Joker's pick", 'burner-exposed': 'The burner', 'no-block': 'No blocking', mission: 'A secret task', disrupter: 'First to respond', swap: 'The profile swap', 'swap-back': 'The swap ends', clone: 'The clone', 'ride-or-die': 'Ride or Die', sacrifice: 'Ride or Die: the choice', 'second-chance': 'A second chance', egg: 'The eggs',
  blocking: 'The blocking', visit: 'The visit', report: 'What the visit "said"', goodbye: 'The goodbye video',
  'final-ratings': 'The final ratings', meet: 'The finalists meet', reveal: 'The winner',
  game: 'A game', party: 'The party', life: 'Alone in the apartment', 'home-video': 'A video from home',
};

const realName = (state, h) => peopleOf(state, h).join(' and ');

export function speakerLabel(state, h) {
  if (h === 'host') return hostName().toUpperCase();
  const p = state.profiles[h];
  if (!p) return String(h).toUpperCase();
  const real = realName(state, h).toUpperCase();
  const shown = p.shown?.name;
  return shown && shown.toUpperCase() !== real ? `${real} (as ${shown})` : real;
}

const shownName = (state, h) => (state.profiles[h]?.shown?.name || realName(state, h)).toUpperCase();

export function blockText(state, block) {
  const out = [];
  // The Hangout's decision, aired after the name (script.js hangoutFlashback).
  if (block.phase === 'flashback-open') out.push('  — EARLIER, IN THE HANGOUT —');
  let dictated = false;
  for (const l of block.lines) {
    const shownAs = shownName(state, l.who);
    const who = !l.person ? speakerLabel(state, l.who)
      : l.person.toUpperCase() === shownAs ? shownAs : `${l.person.toUpperCase()} (for ${shownAs})`;
    if (l.kind === 'stage') out.push(`  [${l.text}]`);
    else if (l.kind === 'say') out.push(`  ${who}, aloud: "${l.text}"`);
    else if (l.kind === 'video') out.push(`  ${who} (on video): "${l.text}"`);
    else if (l.kind === 'react') out.push(`  ${who}: "${l.text}"`);
    else if (l.kind === 'host') out.push(`  ${hostName().toUpperCase()}: ${l.text}`);
    else if (l.kind === 'post') {
      out.push(`  ${who} posts: ${l.spoken}`, `      ▸ STATUS — ${shownName(state, l.who)}: ${l.text}`);
    } else if (l.kind === 'send') {
      if (!dictated) { out.push(`  ${who} dictates: ${l.spoken}`); dictated = true; }
      out.push(`      ▸ ${l.anon ? (l.anon === true ? 'ANONYMOUS' : String(l.anon).toUpperCase()) : shownName(state, l.who)}: ${l.text}`);
    }
  }
  if (block.beat) out.push(`  — ${block.beat}`);
  return out;
}

// Meet the players (the arrival screen, js/vp-ci/stage.js): before a player's
// first lines, who they really are and what they are playing as. The viewer
// is told; the room is not.
const FAME_WORDS = { celebrity: 'A celebrity', villain: 'A known villain', threat: 'A big threat', known: 'Seen on TV' };
const PLAN_WORDS = { honest: 'Playing as themselves', polished: 'Playing as themselves, best photos only',
  edited: 'Playing as themselves, with a few things changed', shared: 'Two players, one profile' };
const stars = n => (n > 0 ? '★'.repeat(Math.floor(n)) + (n % 1 >= 0.5 ? '½' : '') : '');
export function introText(row, h) {
  const p = row?.ci?.profiles?.[h];
  if (!p) return null;
  const people = p.people || [];
  const t = row.ci.cast?.[people[0]] || {};
  const facts = people.length > 1 ? [] : [t.age, t.job, t.hometown ? `from ${t.hometown}` : null].filter(x => x != null && x !== '');
  const fame = FAME_WORDS[t.rep] ? `${FAME_WORDS[t.rep]}${t.stars > 0 ? ` (${stars(t.stars)})` : ''}.` : '';
  const plan = p.mode === 'catfish'
    ? `Playing as ${[p.name, p.age, p.job].filter(x => x != null).join(', ')}: a catfish${p.reason ? ` (${p.reason})` : ''}.`
    : `${PLAN_WORDS[people.length > 1 ? 'shared' : p.mode] || PLAN_WORDS.honest}${p.mode === 'edited' && p.edits?.length ? ` (${p.edits.join(', ')})` : ''}.`;
  const head = `MEET ${people.join(' AND ').toUpperCase() || String(p.name).toUpperCase()}`;
  return `  ▸ ${head}${facts.length ? `: ${facts.join(', ')}.` : ':'} ${[fame, plan].filter(Boolean).join(' ')}`;
}
const INTRO = new Set(['profiles', 'arrival']);
const introduces = b => b.key.startsWith('profile.') || b.key === 'arrival';

export function dayText(state, row) {
  const out = [`═══ Day ${row.day} — ${row.slot} ═══`, ''];
  for (const s of row.ci.aired || []) {
    if (!s.script?.blocks?.length) continue;
    const g = s.kind === 'game' ? GAMES.find(x => x.id === s.game) : null;
    out.push(`── ${g ? `A game: ${g.name}` : TITLES[s.kind] || s.kind}`);
    for (const b of s.script.blocks) {
      const h = INTRO.has(s.kind) && introduces(b) ? b.lines?.find(l => l.who && l.who !== 'host')?.who : null;
      const intro = h ? introText(row, h) : null;
      if (intro) out.push(intro);
      out.push(...blockText(state, b), '');
    }
  }
  // THE CIRCLE WEB: what moved tonight (ci/web-data.js; the web screen says the same).
  const end = row.ci.end;
  if (end) {
    const name = h => row.ci.profiles?.[h]?.name || h;
    out.push('── The Circle web');
    const changes = end.changes || [];
    if (changes.length) for (const c of changes) out.push(`  • ${c.text}`);
    else out.push('  • A quiet night in The Circle: nobody moved much.');
    const standing = (end.alliances || []).map(a => [a, a.members.filter(m => end.people.includes(m))])
      .filter(([a, m]) => a.status === 'active' && m.length >= 2);
    if (standing.length) out.push(`  Alliances standing: ${standing.map(([a, m]) => `${a.name} (${m.map(name).join(', ')})`).join('; ')}`);
    out.push('');
  }
  return out.join('\n');
}

export function castText(state) {
  return Object.values(state.profiles).map(p => {
    const real = realName(state, p.handle);
    if (p.mode === 'catfish') return `  ${real} — playing as ${p.shown.name}, ${p.shown.age} (catfish, ${p.reason || 'no reason given'})`;
    if (p.mode === 'shared') return `  ${real} — sharing one profile as ${p.shown.name}`;
    if (p.mode === 'edited') return `  ${real} — as themselves, but edited (${p.edits.join(', ')})`;
    return `  ${real} — as themselves (${p.mode})`;
  }).join('\n');
}

export function seasonText(state, rows, result = null) {
  const parts = ['THE CIRCLE — a season', '', 'The players:', castText(state), ''];
  for (const r of rows) parts.push(dayText(state, r), '');
  if (result) {
    parts.push('Final placements:');
    for (const p of result.placements) parts.push(`  ${p.place}. ${speakerLabel(state, p.profile)} — ${p.avg}`);
    parts.push(`Fan Favorite: ${result.fanFavorite}`);
  }
  return parts.join('\n');
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function seasonHtml(state, rows, result = null) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The Circle — transcript</title>
<style>body{background:#0b0e24;color:#e8ecff;font:15px/1.55 Georgia,serif;max-width:900px;margin:24px auto;padding:0 16px}
pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${esc(seasonText(state, rows, result))}</pre></body></html>`;
}

// ── From a saved row alone (Plan 4) ──────────────────────────────────────
// The run tab keeps rows, never the engine's state. A row carries its aired
// scenes, written, and a name map; that is all these readers need.
export function rowState(row) {
  const profiles = Object.fromEntries(Object.entries(row?.ci?.profiles || {}).map(([h, p]) =>
    [h, { handle: h, shown: { name: p.name }, players: p.people || [], mode: p.mode }]));
  return { profiles };
}
/** One episode as text: the text backlog's Circle transcript. */
export function episodeText(row) {
  return dayText(rowState(row), row);
}
/** One episode's aired scenes, each with its title and its lines as text. */
export function episodeScenes(row) {
  const st = rowState(row);
  return (row?.ci?.aired || []).filter(s => s.script?.blocks?.length).map(s => {
    const g = s.kind === 'game' ? GAMES.find(x => x.id === s.game) : null;
    return { id: s.id, kind: s.kind, title: g ? `A game: ${g.name}` : TITLES[s.kind] || s.kind,
      blocks: s.script.blocks.map(b => blockText(st, b)) };
  });
}
