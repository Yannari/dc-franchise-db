// ══════════════════════════════════════════════════════════════════════
// bb/twist-contract.js — what a twist is allowed to change, stated once
// ══════════════════════════════════════════════════════════════════════
//
// The catalog design's rule: no large switch statement with one branch per
// television name. A twist is a descriptor of CAPABILITIES the week engine
// consumes — how many nominees, how many vetoes, who names a replacement,
// whether ballots or the eviction itself can be cancelled. The engine asks
// the resolved state at its interception points; it never asks "is this the
// Diamond Veto week" by name.
//
// The twists that were built before this contract existed (Double Eviction,
// Instant Eviction, Have-Nots) are REGISTERED here but not rewritten — their
// engine paths stand, and the descriptor records what they do so the debug
// panel, compatibility checks and future twists have one place to look.

/**
 * The neutral week. Every rule a twist can change, at its default.
 * A resolved week with no twists is exactly this.
 */
export const BASE_WEEK_RULES = Object.freeze({
  hohCount: 1,              // how many Heads of Household hold power at once
  nomineeCount: 2,          // how many the HOH names at the ceremony
  vetoCount: 1,             // how many vetoes exist this week (0 = no veto act)
  vetoSecret: false,        // whether the veto's use is anonymous
  hohSecret: false,         // the HOH's identity is hidden from the house
  replacementAuthority: 'hoh', // 'hoh' | 'veto-holder' — who fills the empty chair
  cancelVotes: 0,           // ballots removed before the count
  cancelEviction: false,    // nobody leaves this week
  addSlots: [],             // extra competition slots ('safety', 'return', ...)
  secondCycle: false,       // a compressed second eviction cycle after the first
});

/**
 * How a power reaches a holder. The show has used every one of these, and
 * they are different mechanics, not different flavor text — who can get the
 * power, who knows it exists, and when the house finds out all follow from
 * the channel. Organized from the wiki's actual instances:
 *
 *   veto-competition       The week's own veto comp awards the special veto
 *                          (America's Care Package/OTT chose the veto type
 *                          in play; announced to the house beforehand).
 *   dedicated-competition  A separate comp exists just for the power
 *                          (Whacktivity BB21, Safety Suite BB22, Roadkill).
 *   pandoras-box           The HOH's private gamble; the canonical Diamond
 *                          Veto (BB12 Matt Hoffman) arrived this way, secret.
 *   hidden-search          Hidden in the house, found by looking (BB17's
 *                          hidden veto scavenger hunt, secret rooms).
 *   audience               Granted by viewer vote, delivered publicly
 *                          (America's Care Package BB18, App Store BB20).
 *   temptation             Offered privately with a consequence attached
 *                          (Den of Temptation BB19).
 *   purchase               Bought with an earned currency (High Roller's
 *                          Room BBCAN9).
 *   random-draw            Pure luck of the draw (Round Trip Ticket BB18).
 *
 * Secrecy is its own axis: 'public' (house knows the power and the holder),
 * 'holder-secret' (house knows the power exists, not who holds it — BB20's
 * Hacker), 'secret' (nobody knows it exists until it is used — Matt's DPOV).
 * Public acquisitions get ANNOUNCED: the engine opens the week with a
 * twist-announcement act, because a house that finds out a rule mid-ceremony
 * is a house that was never told the rules.
 */
export const POWER_ACQUISITION_CHANNELS = Object.freeze([
  'veto-competition', 'dedicated-competition', 'pandoras-box',
  'hidden-search', 'audience', 'temptation', 'purchase', 'random-draw',
]);

/**
 * The registry. One descriptor per twist id, shaped as the design doc's
 * contract: layer, category, timing, duration, and the rules delta — plus,
 * for powers, how they are acquired and who knows.
 */
export const BB_TWIST_CONTRACTS = {
  'bb-double-eviction': {
    id: 'bb-double-eviction', layer: 'scheduled', category: 'week-structure',
    timing: 'week', duration: { weeks: 1 },
    rules: { secondCycle: true },
  },
  'bb-instant-eviction': {
    id: 'bb-instant-eviction', layer: 'scheduled', category: 'week-structure',
    timing: 'week', duration: { weeks: 1 },
    rules: { vetoCount: 0 },
  },
  'bb-have-nots': {
    id: 'bb-have-nots', layer: 'scheduled', category: 'condition',
    timing: 'week-opening', duration: { weeks: 1 },
    rules: {}, // changes living conditions and comp handicaps, not week shape
  },
  'bb-diamond-veto': {
    id: 'bb-diamond-veto', layer: 'scheduled', category: 'veto-power',
    timing: 'veto-ceremony', duration: { weeks: 1 },
    rules: { replacementAuthority: 'veto-holder' },
    // This build runs the OTT Care-Package shape: the week's own veto comp
    // awards the diamond, announced to the house up front. The canonical
    // secret version (Pandora's Box, BB12) becomes a config variant once
    // Pandora's Box exists.
    acquisition: { channel: 'veto-competition', secrecy: 'public' },
    announcement: {
      name: 'The Diamond Power of Veto',
      rule: 'This week’s veto competition is for the DIAMOND Power of Veto. If it is used, the winner — not the Head of Household — names the replacement nominee.',
      sting: 'Whoever wins it controls both chairs.',
    },
  },
  'bb-invisible-hoh': {
    id: 'bb-invisible-hoh', layer: 'scheduled', category: 'power-structure',
    timing: 'week', duration: { weeks: 1 },
    rules: { hohSecret: true },
    // BBCAN9's shape: the house KNOWS the week is invisible — they play the
    // competition and watch the result get sealed — so the twist announces
    // itself while the winner stays hidden. That is exactly what
    // holder-secret means.
    acquisition: { channel: 'dedicated-competition', secrecy: 'holder-secret' },
    announcement: {
      name: 'The Invisible HOH',
      rule: 'This week’s Head of Household is INVISIBLE. The competition result will not be revealed: only the winner knows who holds power. Nominations will be read by Big Brother, and the Invisible HOH may compete in next week’s HOH competition.',
      sting: 'Somebody in this room is about to run the week without wearing the key.',
    },
  },
  'bb-app-store': {
    id: 'bb-app-store', layer: 'scheduled', category: 'distribution',
    timing: 'week-opening', duration: { weeks: 1 },
    // BB20's shape, and the route those powers actually took: the house does
    // not compete for these and cannot earn them. The audience decides, and
    // the only thing that moves an audience is who they have been watching.
    //
    // No rules delta — a distributor changes who is holding what, not how the
    // week is played. What the powers DO lives in powers.js, which is the
    // whole point of keeping the two apart: the Cloud is the same Cloud
    // whether a box, a competition or a country handed it over.
    rules: {},
    acquisition: { channel: 'audience', secrecy: 'holder-secret' },
    announcement: {
      name: 'The App Store',
      rule: 'Three powers are on the shelf this week and nobody in this house can win one. The audience votes, the winners are told in private, and the house is told only that somebody out there now has something.',
      sting: 'Every houseguest in this room is about to start being nice to the cameras.',
    },
  },
  'bb-whacktivity': {
    id: 'bb-whacktivity', layer: 'scheduled', category: 'distribution',
    timing: 'week-opening', duration: { weeks: 1 },
    // BB21's shape. No rules delta — a distributor changes who is holding
    // what, not how the week is played, and what the powers DO lives in
    // powers.js. The twist is entirely in the ACQUISITION: three doors, one
    // choice each, and the Head of Household barred from all of them.
    rules: {},
    acquisition: { channel: 'dedicated-competition', secrecy: 'secret' },
    announcement: {
      name: 'The Whacktivity Competitions',
      rule: 'Three competitions will run this week and each one is for a different power. You may enter ONE of them, or none, and only five houseguests may play any one. The Head of Household may not play at all. Winners will be told in private and this house will not be told who they are.',
      sting: 'Everybody is about to watch everybody else choose a door.',
    },
  },
  'bb-hidden-power': {
    id: 'bb-hidden-power', layer: 'scheduled', category: 'distribution',
    timing: 'week-opening', duration: { weeks: 4 },
    // No rules delta. It changes who is holding what, and only if anybody ever
    // thinks to look behind the cereal.
    rules: {},
    // The last unused channel, and the only one where the power does not come
    // to you: it is already in the building. Wiki-adjacent rather than a
    // transcription — the lineage is the secret room, and BB18's phone booth
    // is already spoken for by the Round Trip Ticket.
    acquisition: { channel: 'hidden-search', secrecy: 'secret' },
    announcement: {
      name: 'Something In This House',
      rule: 'There is a power hidden somewhere in this house. It is in a real place that any one of you could reach, it was put there before you moved in, and that is the whole of what you are being told. There is no clue and there is no competition. Whoever finds it will not be announced.',
      sting: 'You are all about to start watching each other walk into rooms.',
    },
  },
  'bb-den-of-temptation': {
    id: 'bb-den-of-temptation', layer: 'scheduled', category: 'distribution',
    timing: 'week-opening', duration: { weeks: 1 },
    // BB19's shape, and the rule everybody misremembers: the consequence does
    // NOT land on the person who accepted. Paul took the Pendant of Protection
    // and Ramses was cursed for it. The taker walks away clean and hidden.
    //
    // The rules delta is the third chair, because that is the curse — the
    // POWER that was taken changes nothing about the week's shape, and lives
    // in powers.js like every other one. This is the only distributor whose
    // cost is written into the week's rules rather than paid by its recipient.
    rules: { nomineeCount: 3, selfNominationCurse: true },
    acquisition: { channel: 'temptation', secrecy: 'secret' },
    // The DEN announces itself; the taker never does. The house is told there
    // is an offer on the table and is later told a curse has landed, and it is
    // never told those two facts are about the same person.
    announcement: {
      name: 'The Den of Temptation',
      rule: 'One houseguest has been chosen by the audience and is being offered real power in the Den — for nothing. If they accept, a curse enters this house: a houseguest chosen at random will have to nominate THEMSELVES this week. If they refuse, nothing happens at all. You will not be told which of you was offered it, and you will not be told what they chose.',
      sting: 'One of you is about to decide what somebody else’s week is worth.',
    },
  },
  'bb-roadkill': {
    id: 'bb-roadkill', layer: 'scheduled', category: 'nomination-power',
    timing: 'nominations', duration: { weeks: 1 },
    // BB18's shape. Everybody plays, one at a time and out of sight of the
    // rest, and the winner is told in private. They then name a THIRD nominee
    // who goes up alongside the Head of Household's two with no explanation
    // attached — and if the veto comes off that third nominee, it is the
    // Roadkill winner, not the Head of Household, who names the replacement.
    //
    // The rules delta is the third chair and the secrecy of whoever filled it.
    // Everything that makes the twist worth playing — a house that has to
    // GUESS who did this, and is allowed to guess wrong — falls out of that
    // secrecy rather than being a rule of its own.
    rules: { nomineeCount: 3, secretThirdNominator: true },
    acquisition: { channel: 'dedicated-competition', secrecy: 'holder-secret' },
    announcement: {
      name: 'BB Roadkill',
      rule: 'Every houseguest will play BB Roadkill alone, and only the winner will be told they won. That winner secretly names a THIRD nominee, who goes on the block beside the Head of Household\u2019s two. If the veto saves the third nominee, the Roadkill winner names the replacement.',
      sting: 'Somebody in this room is about to put a third key on the wall, and nobody will be able to prove it was them.',
    },
  },
  'bb-hacker': {
    id: 'bb-hacker', layer: 'scheduled', category: 'nomination-power',
    timing: 'post-noms', duration: { weeks: 1 },
    // BB20's shape, and the first twist to consume `cancelVotes` — the rule has
    // been in BASE_WEEK_RULES since this contract was written with nothing to
    // read it.
    //
    // Everybody plays it alone and only the winner is told. What they hold is
    // not one power but three, each optional, each anonymous, each spent on a
    // different night: take a nominee down and seat a replacement; walk one
    // houseguest into the veto competition; cancel one ballot before the count.
    //
    // The rule the wiki settles and memory gets wrong: the nominee the hacker
    // takes down is NOT safe. They are a legal replacement at the veto ceremony
    // three days later. The reprieve is a stay, not a pardon.
    rules: { hackerActive: true, cancelVotes: 1 },
    acquisition: { channel: 'dedicated-competition', secrecy: 'holder-secret' },
    announcement: {
      name: 'The Hacker',
      rule: 'Every houseguest will play the Hacker Competition alone, and only the winner will be told they won. That winner may do three things this week, any of them, none of them, all of them, and always anonymously: they may take one nominee off the block and put somebody else up in their place, they may choose one houseguest to play in the veto competition, and they may cancel one vote at the eviction. Their name will never be read out.',
      sting: 'Three things are about to happen in this house and nobody is going to have done them.',
    },
  },
  'bb-coin-of-destiny': {
    id: 'bb-coin-of-destiny', layer: 'scheduled', category: 'power-structure',
    timing: 'nominations', duration: { weeks: 1 },
    // BB23's shape. Houseguests pay in, play a game of skill, and the winner
    // calls a coin toss. Call it right and they take the nominations off the
    // Head of Household — PRIVATELY. The HOH is dethroned in front of the
    // house and never finds out by whom unless the winner says so.
    //
    // Which makes it the Coup's opposite and the reason both are worth having:
    // the Coup is played standing up with a name attached, and this one leaves
    // a dethroned HOH with a room full of suspects.
    rules: { ceremonyAuthority: 'coin-holder' },
    acquisition: { channel: 'purchase', secrecy: 'holder-secret' },
    announcement: {
      name: 'The Coin of Destiny',
      rule: 'Any houseguest may buy into the Coin of Destiny. They play for it, and whoever wins calls a coin toss in private. Call it correctly and they take this week’s nominations away from the Head of Household and make their own — and the house will never be told who did it.',
      sting: 'Somebody is about to lose their week to a coin, and never learn whose hand threw it.',
    },
  },
  'bb-double-veto': {
    id: 'bb-double-veto', layer: 'scheduled', category: 'veto',
    timing: 'veto-ceremony', duration: { weeks: 1 },
    rules: { doubleVeto: true },
    acquisition: { channel: 'veto-competition', secrecy: 'open' },
    announcement: {
      name: 'The Double Power of Veto',
      rule: 'There are TWO Powers of Veto this week. The winner of the veto competition holds one, and the runner-up holds the other. Both may be used at the same ceremony, and each one used means a replacement nominee.',
      sting: 'The block the Head of Household built can be gone by the end of one meeting.',
    },
  },
  // 'bb-secret-veto' is NOT here, and that is the point.
  //
  // The real one (BBCAN2) was FOUND — Allison pulled it out of the War Room,
  // held it two weeks across three veto competitions, and then stood up at a
  // veto meeting and used it in front of everybody. The secret is the HOLDING,
  // not the hand.
  //
  // None of that is a week you schedule. A twist card says "this happens on
  // episode 4"; a power somebody searches for and sits on says nothing of the
  // sort, and putting it on the Format Designer's shelf made it a one-week
  // assignment handed to a random houseguest, which is a different twist that
  // happens to share a name.
  //
  // It has its owner now, and it is not a contract: `secret-veto` is a POWER
  // (bb/powers.js), stocked on the hidden-search channel bb-hidden-power
  // already runs, with a three-ceremony window. Schedule "Something In This
  // House" and set what is hidden — that is where this lives, because that is
  // how it was acquired.
  'bb-forced-veto': {
    id: 'bb-forced-veto', layer: 'scheduled', category: 'veto',
    timing: 'veto-ceremony', duration: { weeks: 1 },
    rules: { vetoMustBeUsed: true },
    acquisition: { channel: 'veto-competition', secrecy: 'open' },
    announcement: {
      name: 'The Forced Power of Veto',
      rule: 'This week the Power of Veto MUST be used. Whoever wins it will take a nominee off the block whether they want to or not, and the Head of Household will name a replacement.',
      sting: 'Winning the veto this week is not protection. It is an obligation with somebody’s name on it.',
    },
  },
  'bb-team-america': {
    id: 'bb-team-america', layer: 'scheduled', category: 'alliance',
    timing: 'week-opening', duration: { weeks: 1 },
    // No rules delta. The week is untouched — this runs entirely inside the
    // social layer, which is the only place a secret job could live.
    rules: {},
    acquisition: { channel: 'audience', secrecy: 'secret' },
    // No announcement: the house is never told this exists. That is the whole
    // twist — three people are working and everybody else is only ever going
    // to notice the work.
  },
  'bb-camp-comeback': {
    id: 'bb-camp-comeback', layer: 'scheduled', category: 'return',
    timing: 'eviction', duration: { weeks: 4 },
    // No rules delta, which is the point: an evicted houseguest is still
    // evicted. They leave gs.activePlayers, stop competing, stop voting and
    // stop being nominatable exactly as they always did — they simply do not
    // leave the building. The week engine needs to know nothing.
    rules: {},
    announcement: {
      name: 'Camp Comeback',
      rule: 'The next four houseguests evicted will not leave. They move into Camp Comeback — no competitions, no votes, no nominations — and live in this house with everybody who voted them out. When the fourth arrives, all four play for one place back in the game.',
      sting: 'You are about to vote somebody out and then eat breakfast with them.',
    },
  },
  'bb-prizes-and-punishments': {
    id: 'bb-prizes-and-punishments', layer: 'scheduled', category: 'veto-power',
    timing: 'veto', duration: { weeks: 1 },
    // The show's oldest veto format. No rules delta: the week's shape is
    // untouched and there is still exactly one veto — what changes is HOW it
    // reaches a holder. The competition stops awarding it and starts setting
    // the pick order for an exchange in which it is one of the boxes.
    rules: {},
    acquisition: { channel: 'veto-competition', secrecy: 'public' },
    announcement: {
      name: 'Prizes and Punishments',
      rule: 'This week’s veto competition does not award the veto. It sets the order in which houseguests choose a wrapped box — and the Power of Veto is in one of them, along with cash, holidays, and punishments. Later pickers may steal what has already been opened, but anything stolen once is frozen and cannot be taken again.',
      sting: 'Somebody in this room is about to choose five thousand dollars over the only thing that could have saved them.',
    },
  },
  'bb-safety-suite': {
    id: 'bb-safety-suite', layer: 'scheduled', category: 'safety',
    timing: 'week-opening', duration: { weeks: 1 },
    // BB22, and the first consumer of `addSlots`, which has been sitting in
    // BASE_WEEK_RULES since the contract was written with nothing to read it.
    // An extra competition happens before nominations and it is not for power
    // — it is for staying off the block, which is a different act with a
    // different shape and needed its own slot rather than a second veto.
    //
    // The twist is the economy, not the competition: one entry per houseguest
    // per SEASON. Everything interesting follows from that — when to spend it,
    // what spending it says about you, and who has nothing left by week three.
    rules: { addSlots: ['safety'] },
    acquisition: { channel: 'dedicated-competition', secrecy: 'public' },
    announcement: {
      name: 'The Safety Suite',
      rule: 'The Safety Suite is open before nominations. Any houseguest except the Head of Household may enter — ONCE, for the whole season. Whoever beats the clock is safe for the week and must choose a Plus One, who is also safe and takes a punishment for it.',
      sting: 'Every one of you has exactly one of these. Somebody is about to spend theirs in week one.',
    },
  },
  'bb-care-package': {
    id: 'bb-care-package', layer: 'scheduled', category: 'distribution',
    timing: 'week-opening', duration: { weeks: 1 },
    // BB18, and the first PUBLIC audience grant in this catalogue. Every other
    // twist here hides the power, the holder or both; this one announces the
    // contents before the vote, hands the box over on camera and names the
    // recipient to the whole house.
    //
    // No rules delta, and for a reason worth stating: the delta belongs to the
    // PACKAGE, not the twist. Super Safety changes who may be nominated, the
    // vote block removes two ballots, Co-HOH adds a second key — those cannot
    // be one static descriptor, so care-package.js carries them and the week
    // engine reads the delivered package instead of this entry.
    rules: {},
    acquisition: { channel: 'audience', secrecy: 'public' },
    announcement: {
      name: "America's Care Package",
      rule: 'Every week the audience votes one houseguest a care package, and the contents are announced BEFORE the vote. The winner is named publicly. Once a houseguest has received a package they can never receive another.',
      sting: 'This house is about to be told, out loud, who the country likes best.',
    },
  },
  'bb-americas-nominee': {
    id: 'bb-americas-nominee', layer: 'scheduled', category: 'nomination-power',
    timing: 'nominations', duration: { weeks: 1 },
    // BB15, both halves of it. For three weeks the audience voted a houseguest
    // MVP and that houseguest secretly named a third nominee; for three more
    // the audience named the third directly. Same chair, different hand, and
    // the entry chooses which.
    //
    // The rule that separates it from every other third-chair twist we have —
    // and the one the wiki is explicit about — is that if the veto saves the
    // third nominee there is NO replacement. Roadkill hands the pen to the
    // person who filled the chair; this one simply empties it.
    rules: { nomineeCount: 3, thirdChairNoReplacement: true },
    acquisition: { channel: 'audience', secrecy: 'holder-secret' },
    announcement: {
      name: "America's Nominee",
      rule: 'There will be a THIRD nominee this week, and nobody in this house chooses them. The audience does. If the veto is used to save that third nominee, the chair simply empties — there is no replacement.',
      sting: 'One of you is about to be nominated by a room none of you can see.',
    },
  },
  'bb-split-house': {
    id: 'bb-split-house', layer: 'scheduled', category: 'power-structure',
    timing: 'week', duration: { weeks: 1 },
    // BB24's shape: two Heads of Household are crowned in one competition over
    // the whole house, the house is then divided by schoolyard pick, and each
    // half plays a complete week — nominations, veto, campaign, vote — without
    // ever seeing the other. Two houseguests leave the same night.
    //
    // The rules delta says two HOHs and a second cycle. The isolation is not a
    // rule the week engine reads: it falls out of running that engine twice
    // over two disjoint houses, which is the whole reason this is the slice
    // that stress-tests it.
    rules: { hohCount: 2, secondCycle: true },
    acquisition: { channel: 'dedicated-competition', secrecy: 'public' },
    announcement: {
      name: 'The Split House',
      rule: 'This house is being divided in two. Two Heads of Household will be crowned, and they will choose their own sides — after that the two groups will not see or speak to each other for the rest of the week. Each side holds its own nominations, its own veto and its own vote, and on eviction night ONE houseguest from each side will leave.',
      sting: 'Half of you are about to stop existing to the other half.',
    },
  },
  'bb-battle-of-the-block': {
    id: 'bb-battle-of-the-block', layer: 'scheduled', category: 'power-structure',
    timing: 'week', duration: { weeks: 1 },
    // Two Heads of Household, four nominees, and one of the two thrones is
    // gone by the end of the night. The rules delta is small because the twist
    // resolves BEFORE the veto: once a pair has won and their Head of
    // Household has been dethroned, what is left is an ordinary week with one
    // HOH and two nominees, and every downstream act runs unchanged.
    rules: { hohCount: 2, nomineeCount: 4, addSlots: ['battle-of-the-block'] },
    acquisition: { channel: 'dedicated-competition', secrecy: 'public' },
    announcement: {
      name: 'The Battle of the Block',
      rule: 'This week there are TWO Heads of Household, and each of them will nominate two houseguests. The four nominees then compete as pairs. The pair that WINS comes off the block — and dethrones the Head of Household who nominated them, who becomes an ordinary houseguest for the rest of the week. The remaining Head of Household keeps their power and their nominations.',
      sting: 'Two people are about to win this house, and one of them is about to lose it again before Thursday.',
    },
  },
  'bb-battle-back': {
    id: 'bb-battle-back', layer: 'scheduled', category: 'return',
    timing: 'week-close', duration: { weeks: 1 },
    // The first twist to consume addSlots: the week grows an extra competition
    // after the eviction, and its prize is a person rather than a power.
    rules: { addSlots: ['return'] },
    acquisition: { channel: 'dedicated-competition', secrecy: 'public' },
    announcement: {
      name: 'The Battle Back',
      rule: 'The houseguests evicted so far are not gone. At the end of this week they will compete against each other for the right to walk back through that door, and whoever wins re-enters this game with no immunity and no penalty.',
      sting: 'Somebody you already voted out is coming back to remember it.',
    },
  },
  'bb-pandoras-box': {
    id: 'bb-pandoras-box', layer: 'scheduled', category: 'distribution',
    timing: 'post-hoh', duration: { weeks: 1 },
    rules: {}, // the box changes nothing structural; what it HANDS OUT does
    // A distributor, not a power: the prize is drawn from the power
    // inventory (default cargo diamond-veto) and granted SECRET — so there
    // is deliberately no announcement. The house sees the consequence and
    // the lie; the truth lives in gs.bb.powers and the Debug panel.
    acquisition: { channel: 'pandoras-box', secrecy: 'secret' },
  },
};

/**
 * Merge the week's twists into one rules object the engine can consult.
 *
 * Returns { rules, active, applied } where `applied` records which twist
 * changed which rule from what to what — the debug panel's requirement that
 * every hook mutation says who did it and why.
 */
export function resolveWeekTwistState(twistIds = []) {
  const rules = { ...BASE_WEEK_RULES, addSlots: [] };
  const active = [];
  const applied = [];
  const announcements = [];
  for (const id of twistIds) {
    const contract = BB_TWIST_CONTRACTS[id];
    if (!contract) continue;
    active.push(id);
    // A public rule is announced, and so is a holder-secret one — the house
    // knows the Hacker or the Invisible HOH EXISTS, just not who it is.
    // Fully secret powers stay off this list; their reveal is the knowledge
    // system's job, not the announcer's.
    const secrecy = contract.acquisition?.secrecy ?? 'public';
    if (contract.announcement && secrecy !== 'secret') {
      announcements.push({ twist: id, ...contract.announcement });
    }
    for (const [key, value] of Object.entries(contract.rules || {})) {
      if (key === 'addSlots') {
        for (const slot of value) { rules.addSlots.push(slot); applied.push({ twist: id, rule: 'addSlots', to: slot }); }
        continue;
      }
      if (rules[key] !== value) {
        applied.push({ twist: id, rule: key, from: rules[key], to: value });
        rules[key] = value;
      }
    }
  }
  return { rules, active, applied, announcements };
}
