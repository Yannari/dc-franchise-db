// ══════════════════════════════════════════════════════════════════════
// tr-rules.js — what this format has told the viewer, and when it told them
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS LIVES AT js/ AND NOT AT js/tr/. tests/tr-vp.test.js enforces that
// nothing in js/vp-tr/ may import from js/tr/ — "a screen is handed a record
// and may not reach past it" — and that guard is right: a screen reaching into
// the engine is how a replayed episode ends up drawing live state. This file
// was written under js/tr/ and the guard caught it immediately.
//
// The fix is placement rather than an exemption. This module holds NO engine
// state: it imports nothing, reads no `gs`, and every value in it is a
// constant of the format itself. That makes it the same kind of thing as
// js/shows.js — a static registry that the engine and the screens are both
// supposed to read, kept in one copy precisely so the two cannot drift. It
// sits beside js/tr-run.js at the same level for the same reason.
//
// THE BUG THIS EXISTS FOR. A viewer meets a blocked murder — a full table on a
// morning the turret definitely wrote a name — and the screen says "something
// between that room and this one ate it". That is atmosphere sitting where an
// explanation should be. If nobody ever said what a Shield does, the biggest
// deduction event the format has reads as the show declining to explain
// itself.
//
// The premiere briefing (js/tr/headless.js `_premiereRules`) already solves
// this for the STANDING rules, and solves it well: every rule is a spoken beat
// with a `ruleId`, and `rulePoints` maps the id to the beat index so a screen
// or a test can ask "where was the Shield explained?" and get an answer
// instead of a search. js/tr/missions/contract.js then ENFORCES it — a mission
// whose host never explains `reward` fails to build.
//
// What had no such contract is everything that happens for the first time in
// the MIDDLE of a season. Two shapes, and they need opposite treatment:
//
//   STANDING rules are explained at the premiere, before anybody has played a
//   night. `explainedAt: 'premiere'`. The guard asserts the briefing really
//   does carry them — the briefing is prose, and prose gets edited.
//
//   SURPRISES cannot be explained at the premiere without spoiling them. A
//   cast told on day one that Traitors may recruit spends the season watching
//   for it, and the show gives that away for nothing. So they are explained AT
//   THE MOMENT, the first time they happen, by the screen that renders them:
//   `explainedAt: 'first-occurrence'`, and `reminder` is the line that does it.
//
// WHY A REMINDER IS NOT JUST MORE PROSE. It is observer-gated like everything
// else on these screens. `observerVisibility: 'audience'` means the reminder
// may be printed to the viewer and MUST NOT be printed to a player — the
// blocked murder is the case that matters, because the room genuinely never
// learns a Shield was spent, and a reminder leaking into a player's stream
// would hand them the season's best deduction for free. The rule that a branch
// which never receives a fact cannot leak it applies to explanations too.

/**
 * Every rule this format enforces, and where the viewer is told about it.
 *
 * `trigger` is prose for a human reading the registry. `occursIn` is the
 * machine half — given an episode record it answers "did this rule govern
 * anything that happened here?", which is what lets the guard walk a real
 * season and check the explanation came first rather than trusting a list.
 */
export const TR_RULES = {
  'faithfuls-and-traitors': {
    id: 'faithfuls-and-traitors',
    trigger: 'Always. The two roles the season is played with.',
    explainedAt: 'premiere',
    observerVisibility: 'all',
    reminder: 'Most of the castle are Faithfuls. Hidden among them are Traitors.',
    fullRules: 'The cast is split into Faithfuls and Traitors. Only the Traitors '
      + 'know who the Traitors are. Everyone else is playing to find them.',
    occursIn: () => true,
  },
  'traitors-murder': {
    id: 'traitors-murder',
    trigger: 'Every night the Traitors meet and choose a name.',
    explainedAt: 'premiere',
    observerVisibility: 'all',
    reminder: 'Each night the Traitors choose one player to murder. That player is '
      + 'simply gone by breakfast, and nobody is told why.',
    fullRules: 'The Traitors meet in secret every night and agree on one player to '
      + 'murder. The murdered player leaves immediately and the castle is given no '
      + 'explanation beyond the empty chair.',
    occursIn: tr => !!(tr.conclave || (tr.dawn && (tr.dawn.victims || []).length)),
  },
  'faithfuls-banish': {
    id: 'faithfuls-banish',
    trigger: 'Every Round Table.',
    explainedAt: 'premiere',
    observerVisibility: 'all',
    reminder: 'The Faithfuls win only by banishing every Traitor.',
    fullRules: 'The Faithfuls’ task is to identify and banish every Traitor '
      + 'before the game ends.',
    occursIn: tr => !!tr.table,
  },
  'round-table-banishment': {
    id: 'round-table-banishment',
    trigger: 'Every evening the castle votes somebody out.',
    explainedAt: 'premiere',
    observerVisibility: 'all',
    reminder: 'Every evening the castle votes. Whoever the room names is banished, '
      + 'and reveals what they were on the way out.',
    fullRules: 'At the Round Table each player writes down one name. The player with '
      + 'the most votes is banished and must immediately reveal whether they were a '
      + 'Faithful or a Traitor.',
    occursIn: tr => !!tr.table,
  },
  'missions-build-the-pot': {
    id: 'missions-build-the-pot',
    trigger: 'Every mission day.',
    explainedAt: 'premiere',
    observerVisibility: 'all',
    reminder: 'Missions add money to the prize pot — the pot everyone still '
      + 'standing at the end is playing for.',
    fullRules: 'Each mission the castle completes adds money to a shared prize pot. '
      + 'The pot is won at the end by whoever is left, under the payout rule.',
    occursIn: tr => !!tr.mission,
  },
  'shield-blocks-a-murder': {
    id: 'shield-blocks-a-murder',
    trigger: 'A mission or the Armoury puts a shield in play.',
    explainedAt: 'premiere',
    observerVisibility: 'all',
    reminder: 'A shield protects its holder from being murdered for one night, and '
      + 'is spent whether or not it is used.',
    fullRules: 'A shield makes its holder immune to murder for a single night. It is '
      + 'consumed at the end of that night either way. Who holds one is not '
      + 'necessarily public.',
    occursIn: tr => !!(tr.armoury
      || (tr.powers || []).some(p => /shield/i.test(String(p && (p.kind || p.id || ''))))),
  },
  'endgame-payout': {
    id: 'endgame-payout',
    trigger: 'The final table.',
    explainedAt: 'premiere',
    observerVisibility: 'all',
    reminder: 'If every Traitor is gone the remaining Faithfuls split the pot. If a '
      + 'single Traitor survives to the end, the Traitors take all of it.',
    fullRules: 'When the endgame is reached, the players still standing vote on '
      + 'whether to end the game. If all remaining players are Faithful they share '
      + 'the pot. If any Traitor remains, the Traitors take the entire pot and the '
      + 'Faithfuls leave with nothing.',
    occursIn: tr => !!tr.finale,
  },

  // ── the surprises: explained the first time they happen ──────────────
  'murder-blocked-by-shield': {
    id: 'murder-blocked-by-shield',
    trigger: 'The Traitors name somebody who is holding a shield.',
    explainedAt: 'first-occurrence',
    // AUDIENCE ONLY, AND THIS IS THE LOAD-BEARING ONE. The castle is never
    // told a murder was attempted, so a reminder that says one was is a leak.
    observerVisibility: 'audience',
    reminder: 'The Traitors chose a name last night and that player was holding a '
      + 'shield, so the murder failed. The castle is never told this happened.',
    fullRules: 'When the Traitors name a shielded player the murder is blocked, the '
      + 'shield is spent, and nobody dies. The castle sees only a full table and is '
      + 'given no explanation for it.',
    occursIn: tr => !!(tr.dawn && tr.dawn.blocked),
  },
  'recruitment-note': {
    id: 'recruitment-note',
    trigger: 'The Traitors send an anonymous offer to a Faithful.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'all',
    reminder: 'The Traitors may offer a Faithful the chance to join them. The offer '
      + 'arrives as an anonymous note, and refusing it is survivable.',
    fullRules: 'The Traitors may recruit a Faithful by leaving an unsigned note. The '
      + 'recipient accepts or refuses in private. Because the note names nobody, a '
      + 'player who refuses it lives, and cannot identify who asked.',
    occursIn: tr => !!(tr.recruitment && tr.recruitment.mode === 'note'),
  },
  'recruitment-ultimatum': {
    id: 'recruitment-ultimatum',
    trigger: 'The last remaining Traitor makes a face-to-face offer.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'all',
    reminder: 'With one Traitor left the offer is made face to face: join them, or '
      + 'be removed tonight. Refusing this one is fatal.',
    fullRules: 'When only one Traitor remains they may deliver an ultimatum in '
      + 'person. The player either accepts and becomes a Traitor, or refuses and is '
      + 'killed — because a refuser who has seen the Traitor’s face cannot '
      + 'be allowed to go back downstairs.',
    occursIn: tr => !!(tr.recruitment && tr.recruitment.mode === 'ultimatum'),
  },
  // ── the six shapes a night can take ─────────────────────────────────
  //
  // A viewer meeting their first double murder has never been told that two
  // people CAN die in one night. Same for the list, the chapel and the
  // dungeon: the format has six murder variants (js/tr/murder-variants.js)
  // and the registry described exactly none of them, so the screen showed the
  // consequence of a rule the audience had never heard.
  //
  // VISIBILITY IS PER VARIANT, and it is not a formality. `double` is public
  // by arithmetic — two empty chairs at one breakfast, which anybody can
  // count. The other three are things the castle is never told, so their
  // explanation is audience-only exactly like the variant line it sits under
  // (js/vp-tr/cold-open.js). `plain-sight` and `name-your-own` are already
  // narrated by the conclave and are described here for completeness.
  'murder-double': {
    id: 'murder-double',
    trigger: 'The Traitors are allowed two names in one night.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'all',
    reminder: 'Some nights the Traitors may take two people instead of one. '
      + 'Two chairs are empty at the same breakfast, and the castle can count.',
    fullRules: 'On a double night the Traitors name two victims rather than one. '
      + 'Both leave before breakfast. Nothing tells the castle in advance that '
      + 'tonight was one of those nights — only the second empty chair does.',
    occursIn: tr => tr.conclave?.variant === 'double',
  },
  'murder-on-trial': {
    id: 'murder-on-trial',
    trigger: 'The Traitors write a shortlist and only one name on it is used.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'audience',
    reminder: 'On this night the Traitors put several names on a list and took '
      + 'only one of them. The people who were on it and lived find out that '
      + 'they were on it.',
    fullRules: 'The Traitors name a shortlist rather than a single victim. One '
      + 'of the listed players is murdered; the others survive knowing they were '
      + 'written down, which is its own kind of information for a room to hold.',
    occursIn: tr => tr.conclave?.variant === 'on-trial',
  },
  'murder-face-to-face': {
    id: 'murder-face-to-face',
    trigger: 'The victim is taken to the chapel and allowed to speak.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'audience',
    reminder: 'This victim was not taken in their sleep. They were brought to '
      + 'the chapel, told what was happening, and given one last thing to say.',
    fullRules: 'On a chapel night the Traitors face their victim before the '
      + 'murder and let them speak once. Whatever is said goes no further than '
      + 'that room; the castle gets the same empty chair as on any other night.',
    occursIn: tr => tr.conclave?.variant === 'face-to-face',
  },
  'murder-dungeon': {
    id: 'murder-dungeon',
    trigger: 'Two players go down to the dungeon and one comes back.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'audience',
    reminder: 'Two players spent the night in the dungeon and the Traitors chose '
      + 'between them. One of them came up to breakfast and the other did not.',
    fullRules: 'A dungeon night puts two players underground together overnight. '
      + 'The Traitors murder one of the pair. The survivor comes back up having '
      + 'spent the night beside the person who did not.',
    occursIn: tr => tr.conclave?.variant === 'dungeon',
  },
  'murder-plain-sight': {
    id: 'murder-plain-sight',
    trigger: 'One Traitor decides alone, downstairs, in company.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'audience',
    reminder: 'There was no meeting tonight. One Traitor chose a name alone, in '
      + 'the middle of everybody, and the others were not asked.',
    fullRules: 'On a plain-sight night the pact never convenes. A single Traitor '
      + 'settles on a victim in company, without consulting the others, and the '
      + 'murder happens on that decision alone.',
    occursIn: tr => tr.conclave?.variant === 'plain-sight',
  },
  'murder-name-your-own': {
    id: 'murder-name-your-own',
    trigger: 'The Traitors are made to murder one of their own.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'audience',
    reminder: 'Tonight the murder had to come from inside the pact. The Traitors '
      + 'were made to choose one of their own, and there was nothing to argue '
      + 'about — only somebody to sign for it.',
    fullRules: 'On this night the Traitors may not name a Faithful. The victim '
      + 'must be one of them, which ends a pact that has grown comfortable and '
      + 'leaves whoever decided it carrying that with the survivors.',
    occursIn: tr => tr.conclave?.variant === 'name-your-own',
  },

  'armoury-shield': {
    id: 'armoury-shield',
    trigger: 'The Armoury opens after a mission.',
    explainedAt: 'first-occurrence',
    observerVisibility: 'all',
    reminder: 'The best performers on the mission enter the Armoury. One of them '
      + 'leaves with a shield, and the rest do not know which.',
    fullRules: 'After a strong mission the top contributors are sent into the '
      + 'Armoury. Each opens one door; the shields are behind some of them. Everyone '
      + 'knows who went in. Nobody outside knows who came out holding one.',
    occursIn: tr => !!(tr.armoury && (tr.armoury.entrants || []).length),
  },
};

/** Rule ids the premiere briefing is contracted to explain before night one. */
export const PREMIERE_RULES = Object.values(TR_RULES)
  .filter(r => r.explainedAt === 'premiere').map(r => r.id);

/** Rule ids that are explained at the moment they first happen. */
export const SURPRISE_RULES = Object.values(TR_RULES)
  .filter(r => r.explainedAt === 'first-occurrence').map(r => r.id);

/**
 * Which rules governed something in this episode.
 *
 * Reads the EPISODE RECORD (`ep.tr`), never live `gs`, for the same reason
 * every screen does: a replayed episode must answer about the night it was,
 * not about the state the season finished in.
 */
export function rulesInPlay(tr) {
  if (!tr) return [];
  return Object.values(TR_RULES).filter(r => {
    try { return !!r.occursIn(tr); } catch { return false; }
  }).map(r => r.id);
}

/**
 * The line a screen prints to explain a rule at the moment it happens, or null
 * when this observer is not allowed to be told.
 *
 * `observer` is the VP's own convention: 'audience', or 'player:NAME'.
 */
export function ruleReminder(id, observer = 'audience') {
  const r = TR_RULES[id];
  if (!r) return null;
  if (r.observerVisibility === 'audience' && observer !== 'audience') return null;
  return r.reminder;
}

/**
 * The rule id for a murder variant, or null for an ordinary night.
 *
 * `standard` has no entry on purpose: there is nothing to explain about a
 * night that ran the way the premiere already said every night runs.
 */
const VARIANT_RULE = {
  double: 'murder-double',
  'on-trial': 'murder-on-trial',
  'face-to-face': 'murder-face-to-face',
  dungeon: 'murder-dungeon',
  'plain-sight': 'murder-plain-sight',
  'name-your-own': 'murder-name-your-own',
};

/**
 * What this observer may be told about the shape of last night, or null.
 *
 * THE GATING LIVES HERE AND NOT IN THE SCREEN. A screen that decided for
 * itself would have to know that a double is public arithmetic (two empty
 * chairs at one breakfast, anybody can count) while the list, the chapel and
 * the dungeon are things the castle is never told — and that is a rule about
 * the FORMAT, which is what this file is for. `ruleReminder` already refuses
 * an audience-only rule to a player, so the screen can print whatever comes
 * back without deciding anything.
 */
export function variantReminder(variant, observer = 'audience') {
  const id = VARIANT_RULE[variant];
  return id ? ruleReminder(id, observer) : null;
}
