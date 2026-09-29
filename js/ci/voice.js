// ══════════════════════════════════════════════════════════════════════
// ci/voice.js — a message as it shows on screen, and as it is dictated
// ══════════════════════════════════════════════════════════════════════
//
// Players dictate everything, punctuation included (90 US transcripts:
// "exclamation point" 337 times, "question mark" 274, "dot, dot, dot" 130,
// "emoji" 1,473): 'Message: "Hey girl, exclamation point." Heart emoji. Send.'
// A pool writes a message once, with {e:heart} and {t:GirlGang} tokens; this
// file styles it in the sender's texting voice and renders both forms.
export const EMOJI = {
  heart: ['❤️', 'heart emoji'], laugh: ['😂', 'laughing emoji'], fire: ['🔥', 'fire emoji'],
  eyes: ['👀', 'eyes emoji'], hearteyes: ['😍', 'heart-eyes emoji'], cry: ['😢', 'crying emoji'],
  devil: ['😈', 'devil emoji'], wink: ['😉', 'winky face emoji'], pray: ['🙏', 'praying hands emoji'],
  hug: ['🤗', 'hug emoji'], grimace: ['😬', 'grimacing emoji'], shock: ['😱', 'shocked emoji'],
  crown: ['👑', 'crown emoji'], sparkle: ['✨', 'sparkle emoji'], party: ['🎉', 'party emoji'],
  think: ['🤔', 'thinking emoji'], mind: ['🤯', 'mind-blown emoji'], halo: ['😇', 'angel emoji'],
  muscle: ['💪', 'flexed arm emoji'], kiss: ['😘', 'kissy face emoji'], sweat: ['😅', 'sweating emoji'],
  snake: ['🐍', 'snake emoji'], clap: ['👏', 'clapping hands emoji'], sad: ['😔', 'sad face emoji'],
  smile: ['😊', 'smiley face emoji'], side: ['😏', 'smirk emoji'], cool: ['😎', 'sunglasses emoji'],
  sun: ['☀️', 'sun emoji'], lipstick: ['💄', 'lipstick emoji'], detective: ['🕵️', 'detective emoji'],
  handshake: ['🤝', 'handshake emoji'],
};

export function tokenize(text) {
  const out = [];
  const re = /\{([et]):([A-Za-z0-9]+)\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: 'text', v: text.slice(last, m.index) });
    out.push({ type: m[1] === 'e' ? 'emoji' : 'tag', v: m[2] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ type: 'text', v: text.slice(last) });
  return out;
}

export const tagWords = tag => tag.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2');

const tidy = s => s.replace(/[ \t]{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim();

/** Keep or drop each token by the sender's voice; a loud voice doubles an exclamation. */
export function styleMessage(text, voice = {}, rng = () => 0.5) {
  const e = voice.emoji ?? 0.5, t = voice.hashtags ?? 0.5, caps = voice.caps ?? 0;
  let out = '';
  for (const p of tokenize(text)) {
    if (p.type === 'text') {
      let v = p.v;
      if (caps > 0 && rng() < caps * 0.5) v = v.replace(/!/g, '!!');
      out += v;
    } else if (p.type === 'emoji') {
      if (rng() < 0.3 + 0.7 * e) out += `{e:${p.v}}`;
    } else if (rng() < 0.25 + 0.75 * t) out += `{t:${p.v}}`;
  }
  const cleaned = tidy(out);
  const bare = cleaned.replace(/\{[et]:[A-Za-z0-9]+\}/g, '').trim();
  // A message that was only emoji keeps its first token rather than going blank.
  if (!bare && !/\{[et]:/.test(cleaned)) {
    const first = tokenize(text).find(p => p.type !== 'text');
    return first ? `{${first.type === 'emoji' ? 'e' : 't'}:${first.v}}` : tidy(text);
  }
  return cleaned;
}

export function displayText(text) {
  return tidy(tokenize(text).map(p => p.type === 'text' ? p.v
    : p.type === 'emoji' ? (EMOJI[p.v]?.[0] ?? '') : `#${p.v}`).join(''));
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function speakText(s) {
  return tidy(s)
    .replace(/\s*(\.\.\.|…)/g, ', dot, dot, dot.')
    .replace(/!+/g, ', exclamation point.')
    .replace(/\?+/g, ', question mark.')
    .replace(/\.\.$/, '.')
    .replace(/\.\s*$/, '');
}

export function dictation(text, lead = 'Message', close = 'Send') {
  const parts = tokenize(text);
  const quoted = speakText(parts.filter(p => p.type === 'text').map(p => p.v).join(' '));
  const extras = parts.filter(p => p.type !== 'text')
    .map(p => p.type === 'emoji' ? cap(EMOJI[p.v]?.[1] ?? 'emoji') : `Hashtag ${tagWords(p.v)}`);
  const said = quoted ? `${lead}: "${cap(quoted)}."` : `${lead}:`;
  return [said, ...extras.map(x => `${x}.`), `${close}.`].join(' ').replace(/\.\."/g, '."');
}
