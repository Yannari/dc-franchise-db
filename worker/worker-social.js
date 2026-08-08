// ══════════════════════════════════════════════════════════════════════
// worker-social.js — the crowd, written
// ══════════════════════════════════════════════════════════════════════
//
// Takes ONE packet describing ONE moment and returns a crowd reacting to it.
// The packet is a closed set: an event, a list of receipts with ids, the cast,
// and who is talking. Nothing else is knowable, and the client rejects any post
// naming somebody or some week that is not in it — so the prompt does not have
// to plead for accuracy, it has to explain a format.
//
// The same validation runs HERE before returning and again on the client before
// storing. Duplicated on purpose: a check that lives on one side of a network
// call is a check somebody will eventually route around.
//
// Deploy: wrangler deploy worker/worker-social.js --name dc-social
// Needs:  ANTHROPIC_API_KEY

const MODELS = {
  creative: 'claude-sonnet-4-6',
  fast: 'claude-haiku-4-5-20251001',
};

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') {
      return new Response('Use POST', { status: 405, headers: cors });
    }

    const packet = await request.json().catch(() => null);
    if (!packet?.event) {
      return json({ posts: [], error: 'no packet' }, cors);
    }
    try {
      const posts = await writeCrowd(packet, env);
      return json({ posts }, cors);
    } catch (err) {
      // A failure here is not an error the caller can act on — it falls back to
      // its own templates — so it gets an empty crowd and a note, never a 500
      // that a season has to handle.
      return json({ posts: [], error: String(err?.message || err) }, cors);
    }
  },
};

const json = (body, cors) => new Response(JSON.stringify(body), {
  headers: { 'Content-Type': 'application/json', ...cors },
});

const displayName = slug => String(slug || '').split('-').filter(Boolean)
  .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/**
 * The prompt.
 *
 * Two things it spends its length on, because they are the two failure modes:
 *
 *   WHAT MAY BE SAID. The receipts are printed with their ids and the model is
 *   told to cite one. It is not asked to avoid inventing history — it is given
 *   a list and a format, and inventing becomes the harder path rather than the
 *   easy one.
 *
 *   HOW PEOPLE ACTUALLY POST. Left alone a model writes competent television
 *   criticism, because that is what writing about television looks like in its
 *   training data. A real timeline is short, partisan, personal and largely
 *   about who somebody likes. The examples do more work here than the rules.
 */
function buildPrompt(packet) {
  const e = packet.event || {};
  const subject = displayName(e.subject);
  const actor = displayName(e.actor);
  const receipts = (packet.receipts || [])
    .map(r => `  - id:${r.id} — ${r.text}${r.week ? ` (week ${r.week})` : ''}`).join('\n');
  const scream = packet.register === 'scream';

  return `You are writing ${packet.count || 8} separate posts from DIFFERENT fans of a reality \
TV show, reacting live to one moment. This is a fandom timeline, not criticism.

THE MOMENT
  ${e.kind}${subject ? ` — ${subject}` : ''}${actor ? `, and ${actor} did it` : ''}
  Season ${e.season}, episode ${e.episode}.

THE ONLY HISTORY THAT EXISTS
${receipts || '  (none — do not refer to anything that happened before tonight)'}

RULES
  1. Only these people exist: ${(packet.cast || []).map(displayName).join(', ')}. \
Naming anybody else is rejected.
  2. Only the weeks listed above exist. Naming any other week is rejected.
  3. ${packet.requireCite
    ? 'Each post must be ABOUT one of the receipts above, and you must return which one you used.'
    : 'There is no history to draw on. React only to what just happened.'}
  4. Never invent a conversation, a promise, a vote or a week that is not listed.
  5. Maximum ${packet.maxLength} characters.${scream ? ' Maximum 45 — these are screams, not sentences.' : ''}

HOW THESE PEOPLE WRITE
  Most posts are SHORT. Half of them are under sixty characters.
  They are about PEOPLE, not about strategy. Fans have favourites and they are unfair about them.
  Lower case is normal. So are typos, missing apostrophes, and no full stop at the end.
  Nobody writes an essay on a phone at one in the morning.

  Good: "not him doing that to her i'm actually heartbroken"
  Good: "GET HIM ${actor || 'her'}"
  Good: "if ${subject || 'he'} goes i stop watching"
  Good: "${subject || 'She'} is the GOAT and it is not close"
  Bad:  "In a shocking turn of events, tonight's nomination ceremony revealed..."
  Bad:  "Let's talk about what this means for the game going forward."
  Bad:  Anything that sounds like a recap, a review, or a press release.

  Vary them. Some furious, some devastated, some delighted, some joking. \
Different lengths. Do not write ${packet.count || 8} versions of one opinion.

RETURN
  JSON only, no prose around it:
  {"posts":[{"text":"...","cites":["receipt-id"]}]}`;
}

async function writeCrowd(packet, env) {
  const key = env?.ANTHROPIC_API_KEY;
  if (!key) throw new Error('no ANTHROPIC_API_KEY');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      // A crowd of one-line posts is a cheap-model job. The expensive model
      // writes better essays, which is precisely what is not wanted.
      model: packet.register === 'scream' ? MODELS.fast : MODELS.creative,
      max_tokens: 1400,
      temperature: 1,
      messages: [{ role: 'user', content: buildPrompt(packet) }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);

  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  const parsed = parseJson(text);
  const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];

  // Validated here as well as on the client. See the file header.
  return posts
    .map(p => ({ text: String(p?.text || '').trim(), cites: [].concat(p?.cites || []) }))
    .filter(p => p.text && localCheck(p, packet));
}

/** The subset of the client's rules that can be checked without its imports. */
function localCheck(post, packet) {
  const ids = new Set((packet.receipts || []).map(r => r.id));
  if (packet.requireCite) {
    if (!post.cites.length) return false;
    if (post.cites.some(c => !ids.has(c))) return false;
  }
  if (post.text.length > (packet.maxLength || 280)) return false;
  if (packet.register === 'scream' && post.text.length > 45) return false;
  if (/\{[a-z_]+\}/i.test(post.text)) return false;
  const weeks = new Set((packet.receipts || []).map(r => r.week).filter(w => w != null).map(Number));
  for (const m of post.text.matchAll(/\bweek\s+(\d{1,2})\b/gi)) {
    if (!weeks.has(Number(m[1]))) return false;
  }
  return true;
}

/** Models wrap JSON in prose and fences however they feel. */
function parseJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(body.slice(start, end + 1)); } catch { return null; }
}
