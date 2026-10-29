// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-type.js — Secret Story's lettering
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-29: "the font you use for the opening's theme or other things like the launch title is not good
// and not stylized Secret Story at all; everything should be stylized Secret Story". The show's titles are never flat
// type: chunky Aachen letters filled with a pink gradient, a thick white outline, a deep purple extrusion under them,
// and a glow. Two layers make it: the outline and the extrusion are a copy of the words behind (::before, from
// data-t), the gradient fill is the words in front. Tones: pink (the logo, titles), 'w' white with a pink outline
// (sentences, so they stay readable), 't' teal, 'g' gold (a win, money).
//
// Use `ssx(text, tone)` wherever a title is drawn, and put SS_TYPE_CSS in the page's styles.

// The font's address, from this file and not from the page: a relative url() in a <style> resolves against
// whichever page is open, and the user, 2026-10-29 ("i still dont see it use the Aachen Bold font"), saw the
// names fall back to a plain sans. It is also loaded the moment Secret Story's code is, so the first name drawn
// is already in it rather than swapped in late (or never, on a page that only draws it once).
export const SS_FONT_URL = (() => { try { return new URL('../../assets/fonts/Aachen-Bold.otf', import.meta.url).href; } catch { return 'assets/fonts/Aachen-Bold.otf'; } })();
export const SS_FONT_FACE = `@font-face{font-family:'SSAachen';src:url('${SS_FONT_URL}') format('opentype');font-weight:100 900;font-display:swap}`;
if (typeof document !== 'undefined' && document.fonts && typeof FontFace === 'function') {
  try {
    const f = new FontFace('SSAachen', `url('${SS_FONT_URL}') format('opentype')`, { weight: '100 900', display: 'swap' });
    document.fonts.add(f);
    f.load().catch(() => { /* the @font-face in the styles tries again */ });
  } catch { /* no FontFace here */ }
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The words, lettered as Secret Story letters its titles. */
export const ssx = (text, tone = '') => {
  const e = esc(text);
  return `<span class="ssx${tone ? ` ${tone}` : ''}" data-t="${e}"><span>${e}</span></span>`;
};

export const SS_TYPE_CSS = `
${SS_FONT_FACE}
.ssx{position:relative;display:inline-block;font-family:'SSAachen',sans-serif!important;font-weight:700;font-style:normal;letter-spacing:.02em;line-height:1.08;
  text-shadow:none!important;-webkit-text-stroke:0;color:#fff;padding:0 .06em;white-space:nowrap}
/* (one line: the copy behind must break exactly where the words in front do, and a title never breaks) */
.ssx::before{content:attr(data-t);position:absolute;left:.06em;top:0;white-space:nowrap;color:#fff;-webkit-text-stroke:.16em #fff;text-shadow:none;pointer-events:none;
  filter:drop-shadow(.035em .05em 0 #9b1a7c) drop-shadow(.03em .045em 0 #5b0d4f) drop-shadow(0 .14em .25em rgba(15,0,25,.65))}
.ssx>span{position:relative;display:inline;text-shadow:none!important;-webkit-text-stroke:0;color:transparent;-webkit-background-clip:text;background-clip:text;
  background-image:linear-gradient(180deg,#ffe0f3 0%,#ff7fcb 28%,#ff2a9a 55%,#d4157f 78%,#8e0f63 100%)}
.ssx.w::before{color:#ff3ea5;-webkit-text-stroke-color:#ff3ea5}
.ssx.w>span{background-image:linear-gradient(180deg,#fff 0%,#fff 60%,#ffd6ee 100%)}
.ssx.t>span{background-image:linear-gradient(180deg,#e6fffb 0%,#6ff0e2 30%,#19d3c5 60%,#0d8f86 100%)}
.ssx.g>span{background-image:linear-gradient(180deg,#fffbe0 0%,#ffe27a 30%,#f5c542 60%,#c48a12 100%)}
`;
