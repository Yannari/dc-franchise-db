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
