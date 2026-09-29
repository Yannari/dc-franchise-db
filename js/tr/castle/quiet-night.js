// ══════════════════════════════════════════════════════════════════════
// tr/castle/quiet-night.js — the morning nobody was taken
// ══════════════════════════════════════════════════════════════════════
//
// THE GAP THIS FILLS. A blocked murder is the loudest thing that can happen
// in this format without anybody dying, and the castle had no scene for it.
// Every dawn event in the pool is built on a body: `grief-empty-chair` weights
// 0 without a victim, `variantEvidence` returns early with a comment saying a
// blocked night emits nothing, and `murderEvidence` suppresses itself. Three
// systems agreeing, correctly, that there is no corpse to read — and between
// them a morning where twenty people sit down to a full table and NOBODY IN
// THE CASTLE SAYS A WORD ABOUT IT.
//
// ── WHAT THE ROOM IS ALLOWED TO KNOW, WHICH IS THE WHOLE DESIGN ──────
//
// Not that a murder was attempted. Not that a Shield was spent. Not who was
// named. The castle is never told any of that (js/tr/powers.js, and the
// audience-only gate on the cold open's own line). What it has is one public
// fact, available to anybody who can count chairs:
//
//     everybody who went to bed came down to breakfast.
//
// So the gate here is not `blockedMurders`. It is "no empty place this
// morning", which is the same fact from the side the room can see, and it
// covers the other way it happens too — a night the pact never settled on a
// name at all. An event that gated on the block itself would be reading a
// secret in order to decide whether people are allowed to notice something
// public, and it would go wrong the first time a night ended quietly for the
// other reason.
//
// THE BRANCHES ARE THEORIES, and none of them is right, because the castle has
// no way to get this right. That is the point of the scene: a room being handed
// the strongest piece of evidence in the game and having no idea what it is
// looking at.
import { gs } from '../../core.js';
import { pStats } from '../../players.js';
import { registerEvent } from '../events.js';
import { sceneApi } from './effects.js';
import { lineFor } from './lines.js';

const FAMILY = 'suspicion';

/** Did anybody leave by the night channel last night? Public, countable. */
function _tookSomebody(ep) {
  const rounds = gs?.tr?.rounds;
  if (!rounds) return true;                       // no ledger: assume nothing to say
  const round = rounds.find(r => r.ep === ep - 1);
  if (!round) return true;                        // no night behind this morning
  return !!round.murdered;
}

/** Is there a night behind this morning at all? Episode one opens on arrivals. */
function _hadANight(ep) {
  return !!(gs?.tr?.rounds || []).some(r => r.ep === ep - 1);
}

const QUIET_LINES = {
  // Somebody says the obvious thing, and the obvious thing is unsettling.
  'counted-twice': [
    '{a} counts the table and grabs {b}’s arm.\n{a}: "Nobody’s missing."\n{b}: "Nobody’s missing."',
    '{a} counts the table twice, gets the same number, and tells {b}, who has already done it.\n{a}: "Everyone’s here."\n{b}: "I know. I counted."\n{a}: "So nobody died."\n{b}: "Nobody died."',
    '{a} and {b} count heads at breakfast.\n{a}: "Nobody’s missing."\n{b}: "Nobody’s missing."\n{a} (to camera): "Nobody murdered. Why?"',
    '{a} counts again.\n{b}: "Still everyone."\n{a}: "Why, though?"',
  ],
  // The generous reading: they could not agree, or they lost their nerve.
  'they-faltered': [
    '{a} has a theory by the second cup.\n{a}: "They couldn’t agree. That’s why nobody died."\n{b}: "Or they want us to think that."',
    '{a} thinks the Traitors argued all night and never settled.\n{a}: "They couldn’t agree. That’s what this is."\n{b}: "I’d love that to be true."',
    '{a} has a theory.\n{a} (to camera): "They fell out. I’d put money on it."',
    '{a} tells {b} {aSub} thinks they’re cracking.\n{b}: "Or they want us to think that."\n{a}: "Maybe."',
  ],
  // The dangerous reading, and the one that is nearest the truth.
  'somebody-was-safe': [
    '{a} lowers {aPos} voice.\n{a}: "Somebody in this room had a shield last night."\n{b}: "Who?"',
    '{a} says it quietly to {b}.\n{a}: "They went for somebody, and it didn’t work."\n{b}: "A shield?"\n{a}: "Must have been."',
    '{a} suspects a shield saved someone.\n{a} (to camera): "Someone in this castle had protection last night."',
    '{a} and {b} wonder who was saved.\n{b}: "Who looks relieved this morning?"\n{a}: "Nobody. That’s the problem."',
  ],
  // The paranoid reading: a gift is a message.
  'a-message': [
    '{a} won’t relax.\n{a}: "A quiet night is a message."\n{b}: "Or just a quiet night."',
    '{a} doesn’t trust a quiet night.\n{a}: "This is a message. They’re playing with us."\n{b}: "Nobody’s ever been thanked for a quiet night."',
    '{a} is suspicious of the calm.\n{a} (to camera): "No murder isn’t good news. It’s a tactic."',
    '{a} can’t relax.\n{b}: "Enjoy it."\n{a}: "I can’t."',
  ],
};

registerEvent({
  id: 'quiet-night-full-table',
  family: FAMILY,
  window: 'dawn',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'temperament', 'strategic', 'boldness'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // PUBLIC GATE ONLY — see the header. A full table this morning, and a
    // night behind it for the table to be full after.
    if (!_hadANight(ctx.ep)) return 0;
    if (_tookSomebody(ctx.ep)) return 0;
    // Weighted like `grief-empty-chair`'s 3: this is the dawn scene on a
    // morning that has no other dawn scene available to it, so it does not
    // need to out-compete anything.
    return 4;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'quiet-night-full-table');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    // WHICH THEORY THEY REACH FOR, out of who they are. A high-intuition
    // player gets closest to what actually happened; a comfortable one takes
    // the comfortable reading; a bold one treats it as a move against them.
    const scores = {
      'counted-twice': 0.4,
      'they-faltered': (sb.temperament / 10) * 0.45,
      'somebody-was-safe': (sa.intuition / 10) * 0.5 + (sa.strategic / 10) * 0.2,
      'a-message': (sa.boldness / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'counted-twice';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const why = branch === 'they-faltered' ? 'decided the Traitors could not agree last night'
      : branch === 'somebody-was-safe' ? 'worked out that a name was chosen and did not take'
        : branch === 'a-message' ? 'read a quiet night as something the Traitors wanted'
          : 'counted a full table twice';
    const note = lineFor(QUIET_LINES[branch], `quiet-night|${branch}|${ctx.ep}`, { a, b });
    // A CONSEQUENCE, because a scene that changes nothing is not a scene.
    // Two people who arrive at the same reading of a strange morning are
    // closer for it; the pair who merely counted are barely moved.
    const bondDelta = branch === 'counted-twice' ? 0.5 : 1;
    api.addBond(a, b, bondDelta, { source: why });
    const t = api.openArc(FAMILY, [a, b], { source: why, seed: note });
    return {
      branch, pair: [a, b], speaker: a, respondent: b,
      topic: null, topicKind: 'quiet-night',
      threadId: t?.id, bondDelta,
    };
  },
});
