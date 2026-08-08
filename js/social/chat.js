// The green room: alumni hosts talking about tonight, members answering back.
//
// Birdie's crowd is written by the sampler from fan personas. This is the other
// room and it needs a different voice entirely — not louder fans, but people who
// have SAT WHERE THE PLAYER IS SITTING. So the lines are built from the host's
// own record: their placement, their wins, the votes they survived, the seasons
// they came back for. "I went home 9th in season 4 doing exactly this" is worth
// more than any amount of adjectives, and it cannot be faked because it is read
// out of players_database.json.
//
// The physics come from ChatBCC's documented model, not its interface: hosts
// hold the mic, members comment underneath, and there are no tomatoes and no
// ratios in the main line. A pile-on belongs on Birdie; this room is a
// conversation between people who know each other.
//
// Pure: events and host records in, message records out. Seeded, so a night
// reads the same every time it is opened.
import { eventLabel, words } from './adapter.js';

/** Deterministic rng — the same night must not say different things on reload. */
function seeded(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/**
 * Pick without repeating what was just said.
 *
 * Two hosts in a row delivering the same sentence about different people is the
 * single most obvious tell that a room is generated — it happened on the first
 * render, with Jacques and Alejandro both opening "That nomination speech told
 * the whole camp more than it told…". Remembering the last few choices per pool
 * costs nothing and removes it.
 */
function pickFresh(arr, rng, used) {
  const fresh = arr.filter(x => !used.has(x));
  const chosen = pick(fresh.length ? fresh : arr, rng);
  used.add(chosen);
  // Keep the memory shorter than the pool, or it empties and repeats anyway.
  if (used.size > Math.max(1, arr.length - 2)) used.delete([...used][0]);
  return chosen;
}
const titleCase = s => String(s || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/**
 * The credential a host is speaking from.
 *
 * Every one of these is a fact on their record. A host with nothing relevant
 * gets an empty string and simply does not claim anything — silence beats an
 * invented résumé, and the spec's validators would reject the invention anyway.
 */
function credential(host, w) {
  const bits = [];
  if (host.wins) bits.push(`I won one of these`);
  if (host.bestPlacement === 2) bits.push(`I lost this at the end`);
  if (host.expertise.includes('the jury')) bits.push(`I sat on a jury`);
  if (host.expertise.includes('competitions')) bits.push(`I lived on ${w.challenge} wins`);
  if (host.seasonsPlayed >= 3) bits.push(`I have played ${host.seasonsPlayed} of these`);
  if (host.expertise.includes('surviving votes')) bits.push(`I had my name written down plenty`);
  return bits;
}

/**
 * What a host says about one moment.
 *
 * Four or more readings per kind, because a room where every eviction gets the
 * same sentence stops being people within about two episodes. The readings
 * DISAGREE with each other on purpose — fame is reach, not correctness, and a
 * panel that speaks with one voice reads as a press release.
 */
const TAKES = {
  eviction: [
    ({ s, w }) => `${s} was gone the moment the ${w.home} stopped needing ${s.split(' ')[0]}. You can feel that shift days before the ${w.vote}.`,
    ({ s, w }) => `Everyone will say ${s} played too hard. ${s} played too visibly. Those are different mistakes and only one of them is fixable.`,
    ({ s }) => `I do not think ${s} did anything wrong tonight. Sometimes the number is just up and there is no version of the day where it is not.`,
    ({ s, w }) => `Watch the ${w.home} in the hour before. Nobody sits next to somebody they are about to send home. Nobody.`,
    ({ s }) => `${s} asked the wrong person for the truth. That is the whole game right there.`,
  ],
  blindside: [
    ({ s }) => `That was not a vote, that was a decision made somewhere ${s} was not standing. Beautiful work by whoever held it together.`,
    ({ s }) => `A blindside that clean means somebody lied to a friend and did it well. I would like to know who, because that is the winner.`,
    ({ s }) => `${s} had it. Genuinely had it. And then stopped counting, which is when the floor goes.`,
    ({ s, w }) => `The tell was earlier: the ${w.home} got polite. It always gets polite before this.`,
    ({ s }) => `I have been on the wrong end of one of these. You do not see it because the people hiding it are the people you check with.`,
  ],
  'comp-win': [
    ({ s, w }) => `${s} needed that ${w.challenge} and knew it. You could see the difference between wanting it and needing it.`,
    ({ s }) => `Great win, terrible timing. Winning now paints the target ${s} has been avoiding all season.`,
    ({ s, w }) => `That is a real ${w.challenge} performance, not a lucky one. The difference matters when we are ranking these later.`,
    ({ s }) => `I would rather be ${s} tonight than anyone else in that room, and I would rather be almost anyone else next week.`,
  ],
  nomination: [
    ({ s }) => `Putting ${s} up is the safe read. Safe reads are how you get to fifth.`,
    ({ s }) => `${s} on the block is not the story. Who is not on it is the story.`,
    ({ s, w }) => `That nomination speech told the whole ${w.home} more than it told ${s}.`,
    ({ s }) => `If ${s} survives this the whole season reshuffles, and I think ${s} survives it.`,
  ],
  'veto-used': [
    ({ s }) => `Using it was right. Using it and saying that was not.`,
    ({ s }) => `${s} just spent the only piece of power anyone was going to hand out this week. I hope it bought something.`,
    ({ s }) => `That veto changed the target and the blame in one move. Both matter, and people only ever count the first.`,
    ({ s }) => `I would have sat on it. But I lost playing my way, so take that for what it is worth.`,
  ],
  betrayal: [
    ({ s }) => `Call it what it is. ${s} got played by somebody who meant it, and meaning it is the part people cannot fake for long.`,
    ({ s }) => `There is a difference between a betrayal and a decision. That was a decision, and ${s} will not hear the difference for weeks.`,
    ({ s }) => `Everybody at home is furious. Everybody who has played is nodding.`,
    ({ s }) => `The apology after is the tell. If you are apologising you are already scared of the jury.`,
  ],
  'alliance-formed': [
    ({ s }) => `Any alliance built in one conversation dies in one conversation. Ask me how I know.`,
    ({ s }) => `${s} just found the only real number in that room. Now the hard part: keeping it boring.`,
    ({ s }) => `Four people, one plan, no chance. It is always four.`,
    ({ s }) => `I like this for ${s} and I do not like it for anybody sitting next to ${s}.`,
  ],
  'showmance-formed': [
    ({ s, w }) => `Fine. Sweet, even. And it just made both of them a two-for-one that the next ${w.vote} will absolutely take.`,
    ({ s }) => `Every season somebody decides the safest person to trust is the one they like most. It has never once been true.`,
    ({ s }) => `Good for them. Genuinely. Terrible for their game, also genuinely.`,
    ({ s }) => `The pair is the target now, not ${s}. That happens instantly and nobody in there feels it.`,
  ],
  'showmance-broken': [
    ({ s }) => `That was going to end. It ended loudly, which is the only part that costs anything.`,
    ({ s }) => `${s} is now the one person in there with nothing to lose, and that is dangerous for everybody.`,
    ({ s, w }) => `A breakup in that ${w.home} is a vote block coming apart in public. Watch who moves first.`,
    ({ s }) => `I feel for both of them and I am also writing down every name they said out loud.`,
  ],
  finale: [
    ({ s }) => `Whatever happens tonight, the season turned three weeks ago and nobody watching noticed.`,
    ({ s }) => `A jury does not reward the best game. It rewards the game it was allowed to see.`,
    ({ s }) => `I have sat in that chair. You cannot argue somebody into liking you in eight minutes.`,
    ({ s }) => `Winners get remembered. Finalists get asked what went wrong for the rest of their lives.`,
  ],
  'episode-aired': [
    ({ s, w }) => `Quiet ${w.episode}, loud consequences. Those are the ones that decide seasons.`,
    ({ s, w }) => `Nothing in that ${w.episode} was an accident. Somebody is running this and doing it well enough that we cannot see it yet.`,
    ({ s, w }) => `The edit is protecting somebody. It is always protecting somebody.`,
    ({ s, w }) => `Three people in that ${w.home} still think they are in a majority. Two of them are wrong.`,
  ],
};

/** Anything with no written take gets an honest generic one rather than silence. */
const GENERIC_TAKES = [
  ({ s, k }) => `The ${k.toLowerCase()} is the headline. What it does to the numbers is the actual story.`,
  ({ s, k }) => `People are going to talk about ${s || 'that'} all week and miss what it cost.`,
  ({ s, k }) => `I have seen this exact thing go both ways. It usually comes down to who talks first afterwards.`,
  ({ s, k }) => `Small moment. Watch it matter in nine days.`,
];

/** What a member says under a host's message. Members react; they do not analyse. */
const COMMENTS = [
  'this is the only take i trust', 'ok but you would say that',
  'screaming. you called it before it aired', 'respectfully no',
  'i have watched this three times and you are right',
  'nobody asked but go off', 'this is why you are still my favourite',
  'genuinely never thought of it that way', 'the way this aged in ten minutes',
  'not you calling it a decision', 'ok legend', 'hard disagree and i will not explain',
  'saying what we were all thinking', 'this comment section is not ready',
];

/**
 * Turn one episode's events into a hosted conversation.
 *
 * Only hosts author messages — that is the room's rule, and it is enforced here
 * rather than in the renderer, so no path exists that puts a fan persona on the
 * main stage.
 */
export function buildChatMessages(events, speakers, {
  format = 'total-drama', season = 0, episode = 0, seed = 1,
} = {}) {
  if (!events?.length || !speakers?.length) return [];
  const rng = seeded(seed);
  const w = words(format);
  const out = [];
  let n = 0;
  // One memory per pool, so a busy night does not recycle a line while a quiet
  // one still has the whole pool available.
  const usedByKind = new Map();
  const usedCreds = new Set();

  // The loudest moments get covered; a room does not discuss every nomination.
  const worth = events.filter(e => e.kind !== 'episode-aired' || events.length === 1);
  const covered = worth.length > 8 ? worth.filter((_, i) => i % 2 === 0) : worth;

  for (const ev of covered.length ? covered : events) {
    const speaking = speakers.slice(0, 2 + Math.floor(rng() * 2));
    for (const host of speaking) {
      const subject = ev.subject ? titleCase(ev.subject) : '';
      const pool = TAKES[ev.kind] || GENERIC_TAKES;
      if (!usedByKind.has(ev.kind)) usedByKind.set(ev.kind, new Set());
      const line = pickFresh(pool, rng, usedByKind.get(ev.kind))
        ({ s: subject, w, k: eventLabel(ev.kind, format) });

      // Roughly a third of messages lead with the credential that earns them.
      const creds = credential(host, w);
      const lead = creds.length && rng() < 0.34
        ? `${pickFresh(creds, rng, usedCreds)}, so hear me out. ` : '';

      out.push({
        id: `c-${season}-${episode}-${String(n++).padStart(4, '0')}`,
        format, season, episode,
        stream: 'chat',
        channel: 'main-stage',
        authorType: 'host',
        authorSlug: host.slug,
        author: host.name,
        stars: host.stars,
        native: host.native,
        kind: ev.kind,
        subject: ev.subject || null,
        eventLabel: eventLabel(ev.kind, format),
        text: lead + line,
        at: Math.max(0, ev.at + Math.round((rng() - 0.3) * 4 * 60 * 1000)),
        likes: 40 + Math.floor(rng() * 400) + host.stars * 60,
        comments: [],
        hostReplied: false,
      });
    }
  }

  out.sort((a, b) => a.at - b.at);

  // Members answer underneath. Two previews is what the room shows; the count is
  // the real number, so "42 comments" is not decoration.
  for (const m of out) {
    const count = 2 + Math.floor(rng() * 60);
    m.commentCount = count;
    m.comments = Array.from({ length: Math.min(2, count) }, (_, i) => ({
      id: `${m.id}-c${i}`,
      author: `member${1 + Math.floor(rng() * 900)}`,
      text: pick(COMMENTS, rng),
    }));
    // A host answering back is the room's highest signal, so it is rare.
    m.hostReplied = rng() < 0.22;
  }

  return out;
}
