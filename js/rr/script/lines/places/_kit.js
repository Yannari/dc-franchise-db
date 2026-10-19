// Helpers for hand-written lines (places/*.js, rewrite/*.js).
// V: a spoken line with its five voice variants, held to the load-time gate's two rules as it is written
// (lines/index.js variantFails), so nothing is dropped silently later:
//   loud    two or more short shouted sentences ("WAIT! Let's GO! NOW!") are joined into one shouted sentence
//   others  a variant shorter than 45% of a line of ten words or more has lost the meaning: it is left out, and
//           the line as written plays for that voice
// mergePools: sections with the same pool keys, joined.
const words = s => String(s).split(/\s+/).filter(Boolean).length;
const sentences = s => String(s).match(/[^.!?]+[.!?]+/g) || [String(s)];

const KEEP_CAP = /^(I|I'm|I'll|I've|I'd|Mom|Dad|Grandma|Grandpa|Don)$/;
function calmLoud(v) {
  const ss = sentences(v).map(x => x.trim());
  if (ss.length < 3 || ss.filter(x => x.endsWith('!') && words(x) <= 3).length < 2) return v;
  // one shouted sentence: every break but the last becomes a comma
  // and the next word goes lower case, unless it is shouted, "I", a family word, or a slot
  return ss.map((x, i) => (i < ss.length - 1 ? x.replace(/[.!?]+$/, ',') : x)).join(' ')
    .replace(/, ([A-Z][a-z][\w']*)/g, (m, w) => (KEEP_CAP.test(w) ? m : `, ${w.charAt(0).toLowerCase()}${w.slice(1)}`));
}

export const V = (say, sharp, dry, loud, soft, odd) => {
  const keep = v => !(words(say) >= 10 && words(v) < words(say) * 0.45);
  const v = {};
  for (const [tag, text] of Object.entries({ sharp, dry, loud: calmLoud(loud), soft, odd })) if (text && keep(text)) v[tag] = text;
  return { say, v };
};

export function mergePools(...parts) {
  const out = {};
  for (const part of parts) for (const [k, list] of Object.entries(part)) (out[k] ||= []).push(...list);
  return out;
}
