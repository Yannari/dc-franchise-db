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
  handshake: ['🤝', 'handshake emoji'], fish: ['🐟', 'fish emoji'], wave: ['👋', 'waving hand emoji'], broken: ['💔', 'broken heart emoji'],
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

// An emoji can sit between two sentences ("Same 😂 Let's go"). Once it is
// dropped, or read out at the end, the first sentence needs its full stop.
const joinAcross = (left, right) =>
  /[A-Za-z0-9)]\s*$/.test(left) && /^\s*[A-Z]/.test(right) ? `${left.trimEnd()}.${right}` : left + right;

// A register (ci/register.js) changes how the words are typed, never what
// they say: dry types lowercase and flat, formal writes it out, blunt drops
// the softeners, hype shouts now and then. Emoji and hashtags are untouched.
const TOKEN = /(\{[et]:[A-Za-z0-9]+\})/;
const keepCase = (from, to) => (from[0] === from[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to);
const SPELLED = [[/\b(\w+)'s gotta\b/gi, (m, w) => `${w} has to`], [/\b(I|you|we|they) gotta\b/gi, (m, w) => `${w} have to`],
  [/\bgonna\b/gi, 'going to'], [/\bwanna\b/gi, 'want to'], [/\bgotta\b/gi, 'got to'],
  [/\bkinda\b/gi, 'kind of'], [/\bya\b/gi, 'you'], [/\bu\b/gi, 'you']];
// Slang dropped at the start takes its comma with it; in the middle it leaves
// the sentence's own punctuation where it was ("different lol. I'm" → "different. I'm").
const SLANG_LEAD = /^(\s*)(lol|lmao|omg|ngl|tbh|haha)\b[,!.]?\s*/i;
const SLANG_MID = /\s+(lol|lmao|omg|ngl|tbh|haha)\b/gi;
const unslang = p => p.replace(SLANG_LEAD, '$1').replace(SLANG_MID, '');
function onText(text, f) {
  return text.split(TOKEN).map(p => (TOKEN.test(p) ? p : f(p))).join('');
}
function lastText(text, f) {
  const parts = text.split(TOKEN);
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!TOKEN.test(parts[i]) && /[A-Za-z0-9]/.test(parts[i])) { parts[i] = f(parts[i]); break; }
  }
  return parts.join('');
}
const firstUp = text => text.replace(/^(\s*)([a-z])/, (m, sp, c) => sp + c.toUpperCase());
export function byRegister(text, register, rng = () => 0.5) {
  switch (register) {
    case 'dry': {
      const t = onText(text, p => p.toLowerCase().replace(/\bi\b/g, 'I').replace(/!+/g, '.'));
      return lastText(t, p => p.replace(/\.(\s*)$/, '$1'));
    }
    case 'formal': {
      let t = onText(text, p => unslang(SPELLED.reduce((x, [re, to]) =>
        x.replace(re, typeof to === 'function' ? to : m => keepCase(m, to)), p)));
      t = firstUp(tidy(t)).replace(/!{2,}/g, '!');
      return lastText(t, p => p.replace(/([A-Za-z0-9)])(\s*)$/, '$1.$2'));
    }
    case 'blunt':
      return firstUp(tidy(onText(text, p => unslang(p.replace(/!{2,}/g, '!'))
        .replace(/^\s*(honestly|omg|okay so|ngl|no offense but),?\s*/i, ''))));
    case 'hype':
      if (rng() >= 0.3) return text;
      return lastText(onText(text, p => p.toUpperCase()), p => p.replace(/\.?(\s*)$/, '!$1').replace(/([!?])!(\s*)$/, '$1$2'));
    default:
      return text;
  }
}

// What an author wrote about how somebody types (chatVoice, Plan 3a+ Task 14
// layer 2). Every field is optional and none names a character:
//   greetings  said to the group, once, in a Circle Chat
//   openers / fillers / signoffs  the person's own phrases, at `rate` (0.4)
//   caps 'all' | 'often' · ellipses · brackets (stage directions)
// Speech gets the phrases (at half the rate) but never capitals, trailing
// dots or stage directions: those are how a message looks, not how it sounds.
const COMMON_START = /^(the|this|that|it|it's|so|okay|ok|hey|hi|how|what|who|why|when|where|is|are|do|does|did|can|could|would|will|we|we're|you|you're|your|my|me|just|let's|honestly|guys|everyone|everybody|anyone|please|thank|thanks|good|not|no|yes|yeah|and|but|if|well|wait|oh|omg|lol|real|same|love|there|here|all|one|today|tonight|whatever|nobody|somebody|someone)$/i;
const pickOf = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
const endsAsking = t => /\?\s*(\{[et]:[A-Za-z0-9]+\}\s*)*$/.test(t);
export function byAuthored(text, av, rng = () => 0.5, { speech = false, greet = false, reply = false } = {}) {
  if (!av) return text;
  let t = text;
  const rate = (av.rate ?? 0.4) * (speech ? 0.5 : 1);
  // A lead-in ("Per my last message,") lowers the next word only when it is an
  // ordinary one: a name stays a name.
  const lead = (phrase, body) => `${phrase} ${/[,:]$/.test(phrase)
    ? body.replace(/^(\s*)([A-Za-z']+)/, (m, sp, w) => (COMMON_START.test(w) ? sp + w[0].toLowerCase() + w.slice(1) : m)) : body}`;
  if (greet && av.greetings?.length && rng() < 0.8) t = lead(pickOf(av.greetings, rng), t);
  else {
    // Aloud, alone in the apartment: no lead-in addressed to somebody, no sign-off.
    // A reply doesn't open with a question of its own; a question isn't signed off;
    // aloud, an opener is a sentence of its own, never a lead-in or a question.
    const pool = [...(av.openers || []).filter(x => (!speech || !/[,:?]$/.test(x)) && !(reply && /\?$/.test(x))).map(x => ['open', x]),
      ...(av.fillers || []).map(x => ['fill', x]),
      ...(speech || endsAsking(t) ? [] : (av.signoffs || []).map(x => ['sign', x]))];
    if (pool.length && rng() < rate) {
      const [kind, phrase] = pickOf(pool, rng);
      if (kind === 'open') t = lead(phrase, t);
      else if (kind === 'fill') t = lastText(t, p => p.replace(/([.!?]*)(\s*)$/, (m, pun, sp) => `, ${phrase}${pun}${sp}`));
      else t = `${t.replace(/([A-Za-z0-9)])\s*$/, '$1.')} ${phrase}`;
    }
  }
  if (speech) return tidy(t);
  if (av.caps === 'all' || (av.caps === 'often' && rng() < 0.4)) t = onText(t, p => p.toUpperCase());
  // Trailing off: the last sentence, now and then, and never after a question.
  if (av.ellipses && !endsAsking(t) && rng() < 0.6) t = lastText(t, p => p.replace(/[.!]*(\s*)$/, '...$1'));
  if (av.brackets?.length && rng() < (av.rate ?? 0.4) / 2) t = `${t} ${pickOf(av.brackets, rng)}`;
  return tidy(t);
}

/** Keep or drop each token by the sender's voice; a loud voice doubles an exclamation. */
export function styleMessage(text, voice = {}, rng = () => 0.5) {
  const e = voice.emoji ?? 0.5, t = voice.hashtags ?? 0.5, caps = voice.caps ?? 0;
  let out = '', dropped = false;
  for (const p of tokenize(text)) {
    // A hashtag that opens the message IS the message ("#CircleFam forever",
    // the Hashtag game's answers): dropping it left "forever" on its own.
    const opens = !out.replace(/\{[et]:[A-Za-z0-9]+\}/g, '').trim();
    if (p.type === 'tag' && opens) { out += `{t:${p.v}}`; dropped = false; continue; }
    if (p.type === 'text') {
      let v = p.v;
      if (caps > 0 && rng() < caps * 0.5) v = v.replace(/!+/g, m => (m.length > 1 ? m : '!!'));
      out = dropped ? joinAcross(out, v) : out + v;
      dropped = false;
    } else if (p.type === 'emoji') {
      if (rng() < 0.3 + 0.7 * e) out += `{e:${p.v}}`; else dropped = true;
    } else if (rng() < 0.25 + 0.75 * t) out += `{t:${p.v}}`; else dropped = true;
  }
  const cleaned = tidy(byRegister(tidy(out), voice.register, rng));
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
  const quoted = speakText(parts.filter(p => p.type === 'text').map(p => p.v).reduce(joinAcross, ''));
  const extras = parts.filter(p => p.type !== 'text')
    .map(p => p.type === 'emoji' ? cap(EMOJI[p.v]?.[1] ?? 'emoji') : `Hashtag ${tagWords(p.v)}`);
  const said = quoted ? `${lead}: "${cap(quoted)}."` : `${lead}:`;
  return [said, ...extras.map(x => `${x}.`), `${close}.`].join(' ').replace(/\.\."/g, '."');
}
