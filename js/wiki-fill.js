// ══════════════════════════════════════════════════════════════════════
// wiki-fill.js — cutting one person's thread out of a season of episodes
// ══════════════════════════════════════════════════════════════════════
//
// The character article's Personality section was reading the VOICE PROFILE —
// an authoring artifact that tells the episode writer how somebody talks. It
// was never a description of how they played, because nothing that knew how
// they played was ever shown to the thing writing the article.
//
// Meanwhile the AI narrative fill has been sent `ep.summaryText` all along:
// the simulator's own prose. "Amberly left ten votes to two." True, and it
// cannot tell you that Ireland answers in single syllables before coffee or
// that Joel lies about snoring. Only the screenplay knows that, and the
// screenplay lives in IndexedDB and has never left the browser.
//
// So this cuts each houseguest's THREAD out of a season: every line they
// speak and every stage direction that names them, sampled across the whole
// run rather than the front of it. A cast of eighteen is one request, not
// eighteen — see `sliceCastThreads`.

/** A dialogue line: `Name: words`. Same shape the episode player parses. */
const DIALOGUE = /^([A-Z][a-zA-Z\s'\-]+):\s*(.+)$/;
/** A bracketed tag: `[SCENE: KITCHEN]`, `[CONFESSIONAL: Ireland]`. */
const TAG = /^\[(.*)\]$/;

/**
 * Break one episode transcript into beats we can attribute to people.
 *
 * Deliberately simpler than the episode player's parser: that one is building
 * a screen and needs scene indices, tribal context and vote lines. This one
 * only needs to know WHO SAID IT and whether they were alone at the time.
 */
export function readTranscript(text) {
  const out = [];
  let confessor = '';
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const tag = line.match(TAG);
    if (tag) {
      const label = tag[1].trim();
      if (/confessional/i.test(label)) {
        // "[CONFESSIONAL: Ireland]" or "[Ireland - Confessional]".
        confessor = label.replace(/confessional\s*[:\-]?\s*/i, '')
          .replace(/[:\-]\s*confessional\s*/i, '').trim();
        continue;
      }
      confessor = '';
      out.push({ kind: 'stage', who: null, text: label });
      continue;
    }

    const dlg = line.match(DIALOGUE);
    if (dlg) {
      const who = dlg[1].trim();
      out.push({ kind: confessor && who.toLowerCase() === confessor.toLowerCase()
        ? 'confessional' : 'dialogue', who, text: dlg[2].trim() });
      continue;
    }
    // A WRAPPED LINE, not a stage direction.
    //
    // The episode writer hard-wraps long speeches, so a sentence arrives as
    // "Caleb: I want to be clear, because there is a version" followed by
    // "of tonight where everybody pretends they did not know." Read
    // literally, the tail becomes a stage direction — which broke the thing
    // this file exists for, because a "verbatim" quote was then only the
    // first line of what somebody said.
    //
    // The tell is that the speech was cut mid-sentence: a real stage
    // direction follows a line that finished. So a continuation is only
    // merged when the previous beat was speech AND ended without terminal
    // punctuation.
    const prev = out[out.length - 1];
    if (prev && (prev.kind === 'dialogue' || prev.kind === 'confessional')
        && !/[.!?…"'\-—:]$/.test(prev.text)) {
      prev.text += ' ' + line;
      continue;
    }
    out.push({ kind: 'stage', who: null, text: line });
  }
  return out;
}

/** Evenly spaced pick, so a thread is the whole season and not its first week. */
function spread(items, cap) {
  if (items.length <= cap) return items;
  const step = items.length / cap;
  const out = [];
  for (let i = 0; i < cap; i++) out.push(items[Math.floor(i * step)]);
  return out;
}

/**
 * Every cast member's thread through a season, in ONE payload.
 *
 * All of them together rather than a request each, for three reasons and only
 * one of them is cost:
 *
 *   - a model that can see the whole cast writes them APART. Asked about
 *     eighteen people one at a time it has no way to know it has already
 *     called four of them "the quiet strategist".
 *   - the same pass can pick quotes that do not collide.
 *   - it is how the existing narrative fill already works, so the season
 *     document keeps one shape.
 *
 * The budget is spent on CONFESSIONALS first. A confessional is the character
 * explaining themselves to camera with nobody else in the room — the densest
 * personality signal per token in the whole transcript — and scene dialogue
 * fills whatever is left.
 */
export function sliceCastThreads(episodes = [], cast = [], {
  confPerPlayer = 14, linePerPlayer = 16, mentionPerPlayer = 6,
} = {}) {
  const byName = new Map(cast.map(n => [n.toLowerCase(), n]));
  const threads = new Map(cast.map(n => [n, { name: n, confessionals: [], lines: [], mentions: [] }]));

  for (const ep of episodes) {
    const num = ep.episode ?? ep.num ?? null;
    for (const beat of readTranscript(ep.transcript || ep.text || '')) {
      if (beat.who) {
        const real = byName.get(beat.who.toLowerCase());
        if (!real) continue;                       // a host, or somebody not cast
        const t = threads.get(real);
        const entry = { ep: num, text: beat.text };
        if (beat.kind === 'confessional') t.confessionals.push(entry);
        else t.lines.push(entry);
        continue;
      }
      // A stage direction that names somebody is what they DID, which is the
      // half of a personality that never gets spoken aloud.
      for (const [low, real] of byName) {
        if (beat.text.toLowerCase().includes(low)) {
          threads.get(real).mentions.push({ ep: num, text: beat.text });
        }
      }
    }
  }

  return [...threads.values()].map(t => ({
    name: t.name,
    confessionals: spread(t.confessionals, confPerPlayer),
    lines: spread(t.lines, linePerPlayer),
    mentions: spread(t.mentions, mentionPerPlayer),
    // What the slice was cut from, so a thin thread can be told apart from a
    // quiet houseguest — one of those is a data problem and the other is a
    // fact about the person.
    totals: { confessionals: t.confessionals.length, lines: t.lines.length,
      mentions: t.mentions.length },
  }));
}

// ══════════════════════════════════════════════════════════════════════
// GAME HISTORY — the other half of a season article
// ══════════════════════════════════════════════════════════════════════
//
// The wiki's Game history section is derived: "Caleb won Head of Household.
// Ireland and Joel went on the block. Joel was evicted, 6-3." Every word of
// that is true and none of it is a week. It cannot say the block was set
// before the competition was over, or that the vote flipped in the last
// hour, because the season document does not know either.
//
// So this reads the same episodes the character fill reads and asks for
// PROSE PER ROUND — with the derived facts handed over beside the
// screenplay, non-negotiable. The record is the skeleton; the episode is
// only allowed to say how it happened.

/**
 * One episode, cut down to something a model can be asked about.
 *
 * A full screenplay is mostly conversation, and a season of them will not
 * fit in one request. What survives is what a recap is made of: scene
 * headings (they are the structure), stage directions (what people DID),
 * and the longer speeches. "Mm." is in character and is not a week.
 */
export function episodeDigest(text, { cap = 5000 } = {}) {
  const beats = readTranscript(text);
  const scored = beats.map((b, i) => {
    // A one-word reply is in character and is not a week. Dropped outright
    // rather than scored low: they are so cheap that a roomful of them will
    // out-bid the speech they were replying to and eat the whole budget.
    if (b.kind === 'dialogue' && b.text.length < 25) return null;
    let score;
    if (b.kind === 'stage') {
      // A scene heading is structure and is always worth its characters.
      score = /^(scene|int\.|ext\.)/i.test(b.text) ? 100 : 40 + Math.min(b.text.length, 120) / 6;
    } else {
      // Long speech carries argument; a one-word reply carries a mood we
      // are not summarising here. A confessional is somebody explaining
      // their own week to camera, which is exactly the thing being asked for.
      score = (b.kind === 'confessional' ? 45 : 12) + Math.min(b.text.length, 200) / 10;
    }
    // Costed as it will be WRITTEN, not as it was parsed — the brackets and
    // the "(to camera)" are characters somebody pays for too.
    const render = b.kind === 'stage' ? `[${b.text}]`
      : `${b.who}:${b.kind === 'confessional' ? ' (to camera)' : ''} ${b.text}`;
    return { i, render, score, cost: render.length + 1 };
  }).filter(Boolean);

  const keep = [];
  let spent = 0;
  for (const s of scored.slice().sort((a, b) => b.score - a.score)) {
    if (spent + s.cost > cap) continue;
    keep.push(s);
    spent += s.cost;
  }
  // Back into the order it happened in — a recap of a shuffled episode is
  // a recap of a different episode.
  keep.sort((a, b) => a.i - b.i);

  return keep.map(k => k.render).join('\n');
}

/**
 * The season's rounds as the RECORD has them, from either show's shape.
 *
 * Big Brother exports `weeks`; Total Drama exports `votingHistory`. Both
 * are a list of rounds with somebody leaving at the end, and the article
 * says the same kind of thing about each — so they are normalised once,
 * here, rather than twice in two pages.
 */
export function roundLedger(doc = {}) {
  const weeks = Array.isArray(doc.weeks) && doc.weeks.length ? doc.weeks : null;
  const rows = weeks || (Array.isArray(doc.votingHistory) ? doc.votingHistory : []);
  const word = weeks ? 'Week' : 'Episode';

  return rows.map((r, idx) => {
    const n = Number(r.week ?? r.episode ?? r.round ?? idx + 1);
    const facts = [];
    if (r.hoh) facts.push(`${r.hoh} won Head of Household`);
    if (r.winner) facts.push(`${r.winner} won the challenge`);
    if (r.immunityWinner && r.immunityWinner !== r.winner) facts.push(`${r.immunityWinner} had immunity`);
    const noms = r.blockBeforeSafety || r.initialNominees;
    if (noms?.length) facts.push(`nominated: ${noms.join(', ')}`);
    if (r.vetoWinner) facts.push(`${r.vetoWinner} won the veto`);
    if (r.safetyWinner) facts.push(`${r.safetyWinner} won the Block Buster and came off the block`);
    if (r.finalNominees?.length) facts.push(`at the vote: ${r.finalNominees.join(' and ')}`);
    if (r.publicVote) facts.push('the house voted out loud, one at a time');
    if (r.tieBreak) facts.push('the vote tied and was broken by the Head of Household');
    const tally = Object.entries(r.votes || {}).map(([name, c]) => `${name} ${c}`);
    if (tally.length) facts.push(`votes: ${tally.join(', ')}`);
    // ── WHO LEFT, IN THE SHOW'S OWN VERB ──
    //
    // A show with ONE way of leaving can be described by the two clauses
    // below, which is why they were the whole rule for two shows. A show with
    // TWO — The Traitors banishes at the table and murders at night — cannot:
    // whichever clause won would print one of its verbs over the other's
    // departure, which is this repo's oldest bug class wearing a new hat. So a
    // round may carry its own `exits[]`, each with the verb the REGISTRY gave
    // that channel (js/tr/export.js, `exitVerbs` in js/shows.js), and when it
    // does that list is what is rendered. Nothing is guessed here.
    const exits = Array.isArray(r.exits) ? r.exits.filter(x => x?.name && x?.verb) : [];
    if (exits.length) for (const x of exits) facts.push(`${x.name} was ${x.verb}`);
    else if (r.evicted) facts.push(`${r.evicted} was evicted`);
    else if (r.eliminated) facts.push(`${r.eliminated} was eliminated`);
    if (r.quit) facts.push(`${r.quit} quit`);
    if (r.medevac) facts.push(`${r.medevac} was medically evacuated`);

    return { n, word, gone: r.evicted || r.eliminated || exits[0]?.name || null,
      // Everybody who left this round and how, for a reader that needs more
      // than one name. `gone` keeps its shape for the readers that have one.
      ...(exits.length ? { left: exits.map(x => ({ name: x.name, verb: x.verb })) } : {}),
      facts };
  });
}

/**
 * What the game-history request is built from: the ledger for each round,
 * and whichever episodes belong to it.
 *
 * Episode numbers and week numbers are not the same thing in either show —
 * a double eviction is one week and two evictions, a Total Drama season is
 * one episode per round until it is not. Rather than guess a mapping, an
 * episode is attached to a round by the number it carries, and a round with
 * no episode saved still gets asked about from its facts alone.
 */
export function gameHistoryPayload(doc, episodes = [], { capPerRound = 5000 } = {}) {
  const ledger = roundLedger(doc);
  const byNum = new Map(episodes.map(e => [Number(e.episode ?? e.num), e]));
  return ledger.map(r => {
    const ep = byNum.get(r.n);
    return {
      n: r.n, word: r.word, facts: r.facts,
      episode: ep ? episodeDigest(ep.transcript || ep.text || '', { cap: capPerRound }) : '',
    };
  });
}

/** The payload the worker is sent: compact, and readable when it is logged. */
export function threadsToPrompt(threads) {
  return threads.map(t => {
    const bits = [`### ${t.name}`];
    if (t.confessionals.length) {
      bits.push('CONFESSIONALS:', ...t.confessionals.map(c => `  (ep${c.ep}) "${c.text}"`));
    }
    if (t.lines.length) {
      bits.push('IN THE HOUSE:', ...t.lines.map(c => `  (ep${c.ep}) "${c.text}"`));
    }
    if (t.mentions.length) {
      bits.push('SEEN DOING:', ...t.mentions.map(c => `  (ep${c.ep}) ${c.text}`));
    }
    if (!t.confessionals.length && !t.lines.length) {
      bits.push('(no dialogue recorded — they barely spoke on camera)');
    }
    return bits.join('\n');
  }).join('\n\n');
}
