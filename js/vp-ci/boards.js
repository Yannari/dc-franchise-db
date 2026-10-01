// ══════════════════════════════════════════════════════════════════════
// vp-ci/boards.js — a board for every Circle game (Plan 5, spec 18.3)
// ══════════════════════════════════════════════════════════════════════
//
// One board per game family (48 games, 10 families), titled with the game's
// own name and fed by the game's beats (the row keeps them: season.js
// STAGE_DATA.game). A written block remembers its beat (`bi`), so the board
// at step N draws exactly the beats whose lines have aired: an answer drops
// into its column when it is given, a vote when it is cast, the owner of a
// fact when it is revealed, the winner when they win. Never ahead.
//
//   statement — the statement card, AGREE | DISAGREE columns, the room's split
//   name      — the prompt card, who named whom, the award
//   ask       — the question card (ANONYMOUS stays anonymous), the guess
//   guess     — the fact card, the guessers, then the owner revealed
//   make      — the gallery: what each is making, the frames, the likes
//   photo     — the Newsfeed: each post, its likes, its hashtags
//   team      — the draft, the two teams, the score
//   gift      — the gifts piling up at each recipient
//   flirt     — the lines, then the hearts
//   rival     — the hot seat and everyone stating their case
import { prizeOf } from '../ci/games.js';
import { GAMES } from '../ci/games-data.js';
import { FACTS } from '../ci/games-content.js';
import { esc, hashify, nameOf, ringOf, faceUrl, bg, ringBg, dlg, cam, tile, where, speakerAt, bgUi } from './parts.js';
import { faceOf } from './steps.js';

const PRIZE = { immunity: 'PRIZE · IMMUNITY', video: 'PRIZE · A VIDEO FROM HOME', party: 'PRIZE · A PARTY', photo: 'PRIZE · A NEW PHOTO', trophy: 'PRIZE · A TROPHY' };
const TONE = { good: 'good', bad: 'bad', funny: 'funny' };

/** What the board knows at step `idx`: the beats aired so far, and the one on screen now. */
function played(screen, idx) {
  const beats = screen.d?.beats || [];
  const seen = new Set();
  for (let i = 0; i <= idx; i++) { const bi = screen.steps[i]?.bi; if (bi != null) seen.add(bi); }
  const list = beats.map((b, i) => ({ ...b, i })).filter(b => seen.has(b.i));
  const st = idx >= 0 ? screen.steps[idx] : null;
  const cur = st?.bi != null ? { ...beats[st.bi], i: st.bi } : list.at(-1) || null;
  // The words of a beat, as its line said them (a sent message first).
  const textOf = bi => {
    const lines = screen.steps.filter((s, i) => s.bi === bi && i <= idx);
    return (lines.find(s => s.part === 'send' || s.part === 'post') || lines.find(s => s.who))?.text || '';
  };
  return { list, cur, st, textOf };
}
const promptText = (g, id) => g.prompts?.find(p => p.id === id)?.text || '';
const roundOf = (list, cur) => (cur?.round != null ? cur.round : [...list].reverse().find(b => b.round != null)?.round ?? null);
const inRound = (list, r) => list.filter(b => b.round === r);
const mini = (row, h, cls = '') => {
  const url = faceUrl(faceOf(row, h, 'profile'));
  return `<span class="civ-gmini ${cls}"${ringBg(ringOf(row, h), url)} title="${esc(nameOf(row, h))}">${url ? '' : esc(nameOf(row, h)[0] || '?')}</span>`;
};
const who = (row, h) => `<b style="color:${ringOf(row, h)}">${esc(nameOf(row, h))}</b>`;
const card = (label, text, cls = '') => `<div class="civ-gcard ${cls}"><small>${esc(label)}</small>${hashify(text)}</div>`;
const rules = g => card('THE RULES', g.rules?.[0] || '', 'rules');

// ── the ten boards ─────────────────────────────────────────────────────
const BOARDS = {
  statement(row, g, { list, cur }) {
    const r = roundOf(list, cur);
    if (r == null) return rules(g);
    const beats = inRound(list, r);
    const prompt = beats.find(b => b.kind === 'prompt');
    const lone = beats.find(b => b.kind === 'lone')?.about;
    const res = beats.find(b => b.kind === 'results');
    const [yes, no] = g.say || ['Agree', 'Disagree'];
    const col = ans => beats.filter(b => b.kind === 'answer' && b.answer === ans)
      .map(b => tile(row, b.by, `${b.i === cur?.i ? 'land' : ''} ${b.by === lone ? 'lone' : ''}`, b.strong ? '<span class="civ-badge">SURE</span>' : '')).join('');
    return `${card(`STATEMENT ${r + 1}`, promptText(g, prompt?.promptId))}
      <div class="civ-gcols"><div><h4 class="yes">${esc(yes.toUpperCase())}</h4>${col('agree')}</div><div><h4 class="no">${esc(no.toUpperCase())}</h4>${col('disagree')}</div></div>
      ${res ? `<div class="civ-gnote">${res.split === 'lone' ? 'ONE AGAINST THE ROOM' : res.split === 'split' ? 'THE ROOM IS SPLIT' : 'THE ROOM AGREES'}</div>` : ''}`;
  },
  name(row, g, { list, cur }) {
    const r = roundOf(list, cur);
    if (r == null) return rules(g);
    const beats = inRound(list, r);
    const prompt = beats.find(b => b.kind === 'prompt');
    const tone = TONE[prompt?.tone] || 'good';
    const votes = {};
    for (const b of beats.filter(x => x.kind === 'namer')) (votes[b.about] ||= []).push(b.by);
    const tally = beats.find(b => b.kind === 'tally');
    const rows = Object.entries(votes).sort((a, b) => b[1].length - a[1].length).map(([h, by]) =>
      `<div class="civ-grow${tally?.about === h ? ' won ' + tone : ''}">${tile(row, h, 'row')}<span class="civ-gvotes">${by.map(x => mini(row, x)).join('')}</span><b>${by.length}</b></div>`).join('');
    return `${card(g.name.toUpperCase(), promptText(g, prompt?.promptId), tone)}${rows}
      ${tally ? `<div class="civ-gaward ${tone}">${tally.everyone ? 'EVERYONE SAID ' : ''}${esc(nameOf(row, tally.about).toUpperCase())}</div>` : ''}`;
  },
  ask(row, g, { list, cur, textOf }) {
    const r = roundOf(list, cur);
    if (r == null) return rules(g);
    const beats = inRound(list, r);
    const q = beats.find(b => b.kind === 'question');
    if (!q) return rules(g);
    const guess = beats.find(b => b.kind === 'guess');
    const asker = q.anon ? '<b class="anon">ANONYMOUS</b>' : who(row, q.by);
    return `<div class="civ-gask ${q.qkind === 'barbed' ? 'barbed' : ''}">
        <small>QUESTION ${r + 1} · ${q.qkind === 'barbed' ? 'A HARD ONE' : 'FRIENDLY'}</small>
        <div class="civ-gq">${asker} <span>asks</span> ${who(row, q.about)}</div>
        <div class="civ-gqtext">“${hashify(textOf(q.i))}”</div>
      </div>
      ${tile(row, q.about, 'hot')}
      ${guess ? `<div class="civ-gnote">${who(row, guess.by)} thinks it was ${who(row, guess.about)}</div>` : ''}`;
  },
  guess(row, g, { list, cur }) {
    const r = roundOf(list, cur);
    if (r == null) return rules(g);
    const beats = inRound(list, r);
    const prompt = beats.find(b => b.kind === 'prompt');
    // the fact on screen: the last one read out, up to now
    const fact = [...beats].reverse().find(b => b.kind === 'fact');
    if (!fact) return card(`ROUND ${r + 1}`, promptText(g, prompt?.promptId));
    const after = beats.filter(b => b.i > fact.i);
    const owner = after.find(b => b.kind === 'owner');
    const words = (FACTS[fact.promptId] || []).find(f => f.id === fact.factId)?.text || '';
    const guessers = after.filter(b => b.kind === 'guessed').map(b =>
      `<div class="civ-grow">${tile(row, b.by, 'row')}<b class="${owner ? (b.right ? 'right' : 'wrong') : ''}">${owner ? (b.right ? '✓' : '✗') : '…'}</b></div>`).join('');
    return `${card(promptText(g, fact.promptId) || `ROUND ${r + 1}`, words ? `“${words}”` : 'Who wrote this?', 'fact')}
      <div class="civ-gowner">${owner ? tile(row, owner.by, 'land won', '<span class="civ-badge">IT WAS THEM</span>') : '<div class="civ-mtile row hidden"><div class="ph">?</div><div class="n">WHO WROTE IT?</div></div>'}</div>${guessers}`;
  },
  make(row, g, { list, cur, textOf }) {
    const shown = list.filter(b => b.phase === 'reveal' && (b.kind.startsWith('portrait.') || b.kind === 'item'));
    // An anonymous game keeps its makers secret until somebody guesses right.
    const outed = new Set(list.filter(b => b.kind === 'whodunit.right').map(b => b.about));
    const maker = b => (!g.anonymous || outed.has(b.by) ? esc(nameOf(row, b.by)) : '?');
    const winner = list.find(b => b.phase === 'verdict' && b.kind === 'winner')?.by;
    const last = list.find(b => b.phase === 'verdict' && b.kind === 'last')?.by;
    if (!shown.length) {
      const plans = list.filter(b => b.kind === 'plan');
      if (!plans.length) return rules(g);
      const built = {};
      for (const b of list.filter(x => /^build\./.test(x.kind))) built[b.by] = b.kind.split('.')[1];
      return `${card(g.name.toUpperCase(), g.rules?.[0] || '')}<div class="civ-gplans">${plans.map(b =>
        `<div class="civ-grow">${mini(row, b.by)} <span>${b.about ? 'is making one about' : 'is making one'}</span> ${b.about ? mini(row, b.about) : ''}${built[b.by] ? `<em class="${built[b.by]}">${built[b.by] === 'proud' ? 'PROUD OF IT' : built[b.by] === 'disaster' ? 'A DISASTER' : 'DONE'}</em>` : ''}</div>`).join('')}</div>`;
    }
    return `<div class="civ-gwall">${shown.map(b => {
      const url = faceUrl(faceOf(row, b.about, 'profile'));
      return `<div class="civ-gframe ${b.tier || 'ok'}${b.i === cur?.i ? ' land' : ''}${b.by === winner ? ' won' : ''}${b.by === last ? ' last' : ''}">
        <div class="art"${bg(url)}>${url ? '' : esc(nameOf(row, b.about)[0])}</div>
        <div class="cap">${esc(nameOf(row, b.about).toUpperCase())}</div>
        <div class="line">${esc(textOf(b.i)).slice(0, 90)}</div>
        <div class="meta">${b.by === winner ? `<b class="win">♛ ${maker(b)} WINS</b>` : `by ${maker(b)}`} · ♥ ${b.n ?? 0}</div></div>`;
    }).join('')}</div>`;
  },
  photo(row, g, { list, cur, textOf }) {
    const posts = list.filter(b => b.kind === 'post');
    if (!posts.length) return rules(g);
    const winner = list.find(b => b.kind === 'winner')?.by;
    return `<div class="civ-gfeed">${posts.map(p => {
      const url = faceUrl(faceOf(row, p.by, 'profile'));
      const tags = list.filter(b => b.kind === 'tag' && b.about === p.by).map(b => `<span>${hashify(textOf(b.i))}</span>`).join('');
      return `<div class="civ-gpost${p.i === cur?.i ? ' land' : ''}${p.by === winner ? ' won' : ''}">
        <div class="ph"${bg(url)}>${url ? '' : esc(nameOf(row, p.by)[0])}</div>
        <div class="by">${esc(nameOf(row, p.by).toUpperCase())} <em>♥ ${p.n ?? 0}</em></div>
        <div class="cap">${hashify(textOf(p.i).slice(0, 120))}</div><div class="tags">${tags}</div></div>`;
    }).join('')}</div>`;
  },
  team(row, g, { list, cur }) {
    const caps = list.find(b => b.kind === 'captains');
    if (!caps) return rules(g);
    const teams = [[caps.by], [caps.about]];
    for (const b of list.filter(x => /^pick/.test(x.kind))) (b.by === caps.by ? teams[0] : teams[1]).push(b.about);
    const lastPick = list.find(b => b.kind === 'last');
    if (lastPick) (lastPick.about === caps.by ? teams[0] : teams[1]).push(lastPick.by);
    const score = [...list].reverse().find(b => b.kind?.startsWith('question'))?.n || '0 to 0';
    const [s1, s2] = String(score).split(' to ');
    const q = cur?.kind?.startsWith('question') ? cur : null;
    return `<div class="civ-gscore"><div>${teams[0].map(h => mini(row, h)).join('')}<b>${esc(s1 ?? '0')}</b></div><i>vs</i><div><b>${esc(s2 ?? '0')}</b>${teams[1].map(h => mini(row, h)).join('')}</div></div>
      <div class="civ-gteams">${teams.map((t, i) => `<div><h4>TEAM ${esc(nameOf(row, t[0]).toUpperCase())}</h4>${t.map(h => tile(row, h, `row${cur?.about === h && /^pick|^last/.test(cur.kind) ? ' land' : ''}`, h === t[0] ? '<span class="civ-badge">CAPTAIN</span>' : '')).join('')}</div>`).join('')}</div>
      ${q ? `<div class="civ-gnote ${q.right ? 'right' : 'wrong'}">${who(row, q.by)} ${q.right ? 'gets it right' : 'gets it wrong'}</div>` : ''}`;
  },
  gift(row, g, { list, cur }) {
    const gifts = list.filter(b => b.kind === 'gift');
    if (!gifts.length) return rules(g);
    const pile = {};
    for (const b of gifts) (pile[b.about] ||= []).push(b.by);
    return `<div class="civ-gpiles">${Object.entries(pile).sort((a, b) => b[1].length - a[1].length).map(([h, by]) =>
      `<div class="civ-gpile${cur?.about === h ? ' land' : ''}">${tile(row, h, 'row')}<div class="boxes">${by.map(x => `<span class="box" title="from ${esc(nameOf(row, x))}">🎁</span>`).join('')}</div><b>${by.length}</b></div>`).join('')}</div>`;
  },
  flirt(row, g, { list, cur, textOf }) {
    const lines = list.filter(b => b.kind === 'line');
    if (!lines.length) return rules(g);
    const votes = {};
    for (const b of list.filter(x => x.kind === 'vote')) (votes[b.about] ||= []).push(b.by);
    if (Object.keys(votes).length) {
      return `${card(g.name.toUpperCase(), 'The best flirt, by vote.')}${Object.entries(votes).sort((a, b) => b[1].length - a[1].length).map(([h, by], i) =>
        `<div class="civ-grow${i === 0 ? ' won good' : ''}">${tile(row, h, 'row')}<span class="civ-gvotes">${by.map(x => mini(row, x)).join('')}</span><b>♥ ${by.length}</b></div>`).join('')}`;
    }
    const b = lines.at(-1);
    return `<div class="civ-gflirt">${mini(row, b.by, 'big')}<div class="bub">“${hashify(textOf(b.i))}”<small>${esc(nameOf(row, b.by))} → ${esc(nameOf(row, b.about))}</small></div>${mini(row, b.about, 'big')}</div>
      <div class="civ-gnote">${lines.length} line${lines.length > 1 ? 's' : ''} so far</div>`;
  },
  rival(row, g, { list, cur, textOf }) {
    const st = list.filter(b => b.kind === 'statement');
    if (!st.length) return rules(g);
    const count = {};
    for (const b of st) count[b.about] = (count[b.about] || 0) + 1;
    const seat = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
    const now = cur?.kind === 'statement' || cur?.kind === 'reply' ? cur : st.at(-1);
    return `<div class="civ-gseat">${tile(row, seat, 'hot', `<span class="civ-badge red">× ${count[seat]}</span>`)}</div>
      <div class="civ-gring">${st.map(b => `<span class="${b.i === now?.i ? 'now' : ''}${b.mutual ? ' mutual' : ''}">${mini(row, b.by)}<i>→</i>${mini(row, b.about)}</span>`).join('')}</div>
      ${now ? `<div class="civ-gqtext">“${hashify(textOf(now.i))}”</div>` : ''}`;
  },
};

export function gameStage(row, screen, idx, fresh) {
  const g = GAMES.find(x => x.id === screen.d?.gameId);
  const st = idx >= 0 ? screen.steps[idx] : null;
  const talking = st?.part === 'stage' ? speakerAt(screen, idx) : st?.who;
  if (!g) return `<div class="civ-layer">${bgUi}${where('A GAME')}${dlg(row, st, fresh)}</div>`;
  const view = played(screen, idx);
  const board = (BOARDS[g.family] || (() => rules(g)))(row, g, view);
  return `<div class="civ-layer civ-game fam-${esc(g.family)}">${bgUi}
    <div class="civ-gtitle"><b>${esc(g.name.toUpperCase())}</b>${PRIZE[prizeOf(g)] ? `<span>${PRIZE[prizeOf(g)]}</span>` : ''}</div>
    <div class="civ-gboard${fresh ? ' fresh' : ''}">${board}</div>
    ${talking && st?.part !== 'send' ? cam(row, talking, `side${fresh ? ' in' : ''}`) : ''}
    ${where(`A GAME · ${g.name.toUpperCase()}`)}${dlg(row, st, fresh, 'right')}</div>`;
}
