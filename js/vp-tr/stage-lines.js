// ══════════════════════════════════════════════════════════════════════
// vp-tr/stage-lines.js — a screen's beats, read as lines for a stage
// ══════════════════════════════════════════════════════════════════════
//
// Every castle screen builds the same way: `_buildBeats` hands back
// `{ phase, html, meta }`, the html made of the same few parts with the
// screen's own two-letter prefix — a host band (`xx-host`), a quoted row
// (`xx-said`, with a <cite>), a card title (`xx-card-title`), paragraphs, a
// murmur, a note, an audience-only aside (`xx-irony`, `xx-test`, `xx-shape`),
// a reaction row (`xx-react-row`). A stage plays those one at a time, and this
// reads them without caring which screen wrote them, so every stage says
// exactly what its page says and nothing a stage writes can disagree with it.
//
// `special(el, suffix, ctx)` lets a stage claim a part it draws itself (the
// Round Table's slate, its count, the chair) — return an array of steps, or
// `null` to let the generic reading carry on, or `[]` to swallow the part.

const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const unquote = s => clean(s).replace(/^[“"]+|[”"]+$/g, '');

/** The part a class name names, whatever the screen's prefix: `rt-said` → `said`. */
function partOf(el) {
  // A portrait first: `cv-av` has a two-letter prefix of its own and would
  // otherwise read as a part called "av", initials and all.
  for (const c of el.classList) if (c === 'cv-av' || c.indexOf('cv-av-') === 0) return 'avatar';
  for (const c of el.classList) {
    const m = /^[a-z]{2}-(.+)$/.exec(c);
    if (m) return m[1];
  }
  return '';
}

// Furniture: portraits, face chips, labels, chip rows. Drawn by the stage or
// not drawn at all, and never read as a line.
const SKIP = new Set(['avatar', 'face-chip', 'face-nm', 'card-label', 'chips', 'chip', 'faces', 'arrivals',
  'accused', 'slate-run', 'clash-pair', 'hold', 'place-set', 'vh', 'reveal', 'shaft',
  // breakfast: the count strip, the portrait wall and the cup are drawn by its stage
  'count', 'wall-wrap', 'gap', 'frame-pic', 'trial', 'label']);
// Parts whose text is a heading for the lines that follow it.
const HEADS = new Set(['card-title', 'silence-h', 'clash-k', 'none-h', 'h']);
// Audience-only asides: the page writes them on that layer alone, so reading
// them here keeps the gate the page already keeps.
const ASIDES = new Set(['irony', 'test', 'shape']);

export function beatLines(beats, special) {
  if (typeof document === 'undefined') return [];
  const steps = [];
  const tpl = document.createElement('template');
  beats.forEach((b, bi) => {
    const m = b.meta || {};
    tpl.innerHTML = b.html;
    let tag = null;
    const ctx = { beat: bi, phase: b.phase, meta: m, tpl };
    const push = st => steps.push({ beat: bi, phase: b.phase, kind: m.kind || null, meta: m, ...st });
    const walk = el => {
      for (const n of el.children) {
        const part = partOf(n);
        if (special) {
          const got = special(n, part, ctx);
          if (got) { got.forEach(push); continue; }
        }
        if (part === 'host') {
          push({ t: 'host', text: unquote(n.querySelector('[class$="-host-line"]')?.textContent || n.textContent) });
        } else if (part === 'host-line') {
          push({ t: 'host', text: unquote(n.textContent) });
        } else if (part === 'said') {
          push({ t: 'say', who: clean(n.querySelector('cite')?.textContent),
            text: unquote(n.querySelector('[class$="-said-txt"]')?.textContent) });
        } else if (part === 'react-row') {
          const tx = n.querySelector('[class$="-react-tx"]');
          const who = clean(tx?.querySelector('b')?.textContent);
          if (!tx) continue;
          const full = clean(tx.textContent);
          const rest = who && full.indexOf(who) === 0 ? full.slice(who.length).replace(/^[\s·:–—-]+/, '') : full;
          // A reaction in the first person is somebody speaking; the rest is
          // the narration about them, with their face beside it.
          if (who && /\b(I|I’m|I've|I’ve|me|my)\b/.test(rest)) push({ t: 'say', who, text: rest });
          else push({ t: 'narr', who: who || null, text: full, tag, react: true });
        } else if (ASIDES.has(part)) {
          // THE ASIDE'S WORDS, NOT ITS FURNITURE. Reading the whole element's
          // text took the face chips' initials with it and ran the sentences
          // together: "...that night.HHicksSSandersCCarrieHicks can say..."
          // (the user, 2026-10-03). The heading is the first <b>; the body is
          // every <span> sentence, each its own sentence.
          const head = n.querySelector(':scope > b');
          const headText = clean(head?.textContent);
          const spans = [...n.querySelectorAll(':scope > span')].map(x => clean(x.textContent)).filter(Boolean);
          const body = spans.length ? spans.join(' ')
            : clean([...n.childNodes].filter(x => x !== head && !(x.classList && [...x.classList].some(c => /faces|face-chip|chips/.test(c))))
              .map(x => x.textContent).join(' '));
          if (body) push({ t: 'narr', tag: headText || 'What the room cannot see', text: body, aud: true });
        } else if (part === 'murmur') {
          push({ t: 'narr', tag: 'Around the room', text: clean(n.textContent), murmur: true });
        } else if (part === 'explain') {
          push({ t: 'narr', tag: 'The rule', text: clean(n.textContent) });
        } else if (part === 'note') {
          push({ t: 'narr', text: clean(n.textContent), note: true, tone: n.dataset.tone || '' });
        } else if (HEADS.has(part)) {
          tag = clean(n.textContent);
        } else if (SKIP.has(part)) {
          // furniture
        } else if (n.tagName === 'P') {
          const text = clean(n.textContent);
          if (text) { push({ t: 'narr', tag, text }); tag = null; }
        } else if (n.children.length) walk(n);
        else if (clean(n.textContent)) { push({ t: 'narr', tag, text: clean(n.textContent) }); tag = null; }
      }
    };
    walk(tpl.content);
  });
  return steps;
}
