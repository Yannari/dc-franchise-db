// ══════════════════════════════════════════════════════════════════════
// main.js — Module bridge: imports ES modules and exposes on window
// ══════════════════════════════════════════════════════════════════════

import * as core from './core.js';
import * as playersMod from './players.js';
import * as bondsMod from './bonds.js';
import * as alliancesMod from './alliances.js';
import * as votingMod from './voting.js';
import * as advantagesMod from './advantages.js';
import * as romanceMod from './romance.js';
import * as challengesCoreMod from './challenges-core.js';
import * as cliffDiveMod from './chal/cliff-dive.js';
import * as awakeAThonMod from './chal/awake-a-thon.js';
import * as dodgebrawlMod from './chal/dodgebrawl.js';
import * as talentShowMod from './chal/talent-show.js';
import * as suckyOutdoorsMod from './chal/sucky-outdoors.js';
import * as upTheCreekMod from './chal/up-the-creek.js';
import * as truthOrDareTrainMod from './chal/truth-or-dare-train.js';
import * as aMazeInGripMod from './chal/a-maze-ing-grip.js';
import * as paintballHuntMod from './chal/paintball-hunt.js';
import * as hellsKitchenMod from './chal/hells-kitchen.js';
import * as trustMod from './chal/trust.js';
import * as basicStrainingMod from './chal/basic-straining.js';
import * as xtremeTortureMod from './chal/x-treme-torture.js';
import * as phobiaFactorMod from './chal/phobia-factor.js';
import * as brunchMod from './chal/brunch.js';
import * as luckyHuntMod from './chal/lucky-hunt.js';
import * as sayUncleMod from './chal/say-uncle.js';
import * as tripleDogDareMod from './chal/triple-dog-dare.js';
import * as slasherNightMod from './chal/slasher-night.js';
import * as monsterCashMod from './chal/monster-cash.js';
import * as mineOverMatterMod from './chal/mine-over-matter.js';
import * as treasureIslandMod from './chal/treasure-island.js';
import * as operationClassifiedMod from './chal/operation-classified.js';
import * as hideAndBeSneakyMod from './chal/hide-and-be-sneaky.js';
import * as offTheChainMod from './chal/off-the-chain.js';
import * as wawanakwaGoneWildMod from './chal/wawanakwa-gone-wild.js';
import * as triArmedTriathlonMod from './chal/tri-armed-triathlon.js';
import * as campCastawaysMod from './chal/camp-castaways.js';
import * as areWeThereYetiMod from './chal/are-we-there-yeti.js';
import * as alienEggMod from './chal/alien-egg.js';
import * as beachBlanketBogusMod from './chal/beach-blanket-bogus.js';
import * as crazytownMod from './chal/crazytown.js';
import * as chefshankMod from './chal/chefshank.js';
import * as oneFluMod from './chal/one-flu.js';
import * as mastersOfDisastersMod from './chal/masters-of-disasters.js';
import * as fullMetalDramaMod from './chal/full-metal-drama.js';
import * as oceansHeistMod from './chal/oceans-heist.js';
import * as millionBucksBCMod from './chal/million-bucks-bc.js';
import * as sportsMarathonMod from './chal/sports-marathon.js';
import * as superHeroldMod from './chal/super-hero-ld.js';
import * as princessPrideMod from './chal/princess-pride.js';
import * as getAClueMod from './chal/get-a-clue.js';
import * as rockNRuleMod from './chal/rock-n-rule.js';
import * as crouchingCourtneyMod from './chal/crouching-courtney.js';
import * as houstonMod from './chal/houston.js';
import * as topDogMod from './chal/top-dog.js';
import * as walkEgyptMod from './chal/walk-like-an-egyptian.js';
import * as crazyFunTimeMod from './chal/crazy-fun-time.js';
import * as frozenCrossingMod from './chal/frozen-crossing.js';
import * as vikingSourMod from './chal/viking-sour.js';
import * as bridalBrawlsMod from './chal/bridal-brawls.js';
import * as greatFakeOutMod from './chal/great-fake-out.js';
import * as africanLyingSafariMod from './chal/african-lying-safari.js';
import * as rapaPhooeyMod from './chal/rapa-phooey.js';
import * as drumhellerMod from './chal/drumheller.js';
import * as planesTrainsMod from './chal/planes-trains.js';
import * as picnicHangingDorkMod from './chal/picnic-hanging-dork.js';
import * as slapSlapRevMod from './chal/slap-slap-revolution.js';
import * as broadwayBabyMod from './chal/broadway-baby.js';
import * as amazonRaceMod from './chal/amazon-race.js';
import * as nightMuseumMod from './chal/night-at-museum.js';
import * as brutalerMod from './chal/bigger-badder-brutaler.js';
import * as truthOrSharkMod from './chal/truth-or-shark.js';
import * as rockTheDockMod from './chal/rock-the-dock.js';
import * as tropicalTakedownMod from './chal/tropical-takedown.js';
import * as midnightManhuntMod from './chal/midnight-manhunt.js';
import * as greecesPiecesMod from './chal/greeces-pieces.js';
import * as hangarBlackMod from './chal/hangar-black.js';
import * as iceIceBabyMod from './chal/ice-ice-baby.js';
import * as findersCreepersMod from './chal/finders-creepers.js';
import * as backstabbersAhoyMod from './chal/backstabbers-ahoy.js';
import * as projectRunawayMod from './chal/project-runaway.js';
import * as hawaiianPunchMod from './chal/hawaiian-punch.js';
import * as socialManipMod from './social-manipulation.js';
import * as settingsMod from './settings.js';
import * as campEventsMod from './camp-events.js';
import * as twistsMod from './twists.js';
import * as rescueIslandMod from './rescue-island.js';
import * as episodeMod from './episode.js';
import * as finaleMod from './finale.js';
import * as textBacklogMod from './text-backlog.js';
import * as aftermathMod from './aftermath.js';
import * as aftermayhemMod from './chal/aftermayhem.js';
import * as castUiMod from './cast-ui.js';
import * as runUiMod from './run-ui.js';
import * as vpScreensMod from './vp-screens.js';
import * as vpFinaleMod from './vp-finale.js';
import * as vpUiMod from './vp-ui.js';
import * as savestateMod from './savestate.js';
import * as statsExportMod from './stats-export.js';
import * as audioMod from './audio.js';
import * as recapMod from './recap.js';
import * as broadcastMod from './broadcast.js';

// ── Expose mutable state as getters/setters on window ──
// This is critical: window.gs must always return the CURRENT module-scoped value.
// Assignments like `gs = newValue` in the inline script will call the setter,
// which updates the module-scoped variable via core.setGs(newValue).
const stateVars = {
  'players':            'setPlayers',
  'editingId':          'setEditingId',
  'activeTab':          'setActiveTab',
  'seasonConfig':       'setSeasonConfig',
  'relationships':      'setRelationships',
  'editingRelId':       'setEditingRelId',
  'activeRelType':      'setActiveRelType',
  'gs':                 'setGs',
  'gsCheckpoints':      'setGsCheckpoints',
  'viewingEpNum':       'setViewingEpNum',
  'selectedEpisodes':   'setSelectedEpisodes',
  'currentTwistFilter': 'setCurrentTwistFilter',
  'currentChalSeries':  'setCurrentChalSeries',
  'preGameAlliances':   'setPreGameAlliances',
  'editingAllianceId':  'setEditingAllianceId',
  'alliancePerm':       'setAlliancePerm',
};

for (const [prop, setter] of Object.entries(stateVars)) {
  Object.defineProperty(window, prop, {
    get: () => core[prop],
    set: (v) => core[setter](v),
    configurable: true,
  });
}

// ── Expose constants directly on window ──
const constants = [
  'STATS', 'ARCHETYPES', 'ARCHETYPE_NAMES', 'THREAT_TIERS',
  'REL_TYPES', 'ADVANTAGES', 'ADV_SOURCE_LABELS',
  'TWIST_CATALOG',
  'DARE_POOL', 'DARE_CATEGORIES',
  'SAY_UNCLE_POOL', 'SAY_UNCLE_CATEGORIES',
  'BRUNCH_FOOD_POOL', 'BRUNCH_FOOD_CATEGORIES', 'BRUNCH_EATOFF_DISH', 'BRUNCH_REACTIONS',
  'PHOBIA_POOL', 'PHOBIA_CATEGORIES',
  'S10_TRIBES', 'S10_BONDS_PRESET',
  'S9_TRIBES', 'S9_BONDS_PRESET',
  'DEFAULT_STATS', 'CHALLENGE_DB', 'REWARD_POOL',
];

for (const name of constants) {
  window[name] = core[name];
}

// ── Expose functions on window ──
const functions = [
  'defaultConfig', 'repairGsSets', 'prepGsForSave', 'loadAll',
  // Setters are also available on window for direct use if needed
  'setPlayers', 'setEditingId', 'setActiveTab', 'setSeasonConfig',
  'setRelationships', 'setEditingRelId', 'setActiveRelType',
  'setGs', 'setGsCheckpoints', 'setViewingEpNum',
  'setSelectedEpisodes', 'setCurrentTwistFilter', 'setCurrentChalSeries',
  'setPreGameAlliances', 'setEditingAllianceId', 'setAlliancePerm',
];

for (const name of functions) {
  if (typeof core[name] === 'function') {
    window[name] = core[name];
  }
}

// ── Expose extracted module functions on window ──
const extractedModules = [
  playersMod, bondsMod, alliancesMod, votingMod,
  advantagesMod, romanceMod, challengesCoreMod,
  cliffDiveMod, awakeAThonMod, dodgebrawlMod, talentShowMod,
  suckyOutdoorsMod, upTheCreekMod, truthOrDareTrainMod, aMazeInGripMod, paintballHuntMod, hellsKitchenMod,
  trustMod, basicStrainingMod, xtremeTortureMod, phobiaFactorMod,
  brunchMod, luckyHuntMod, sayUncleMod, tripleDogDareMod, slasherNightMod, monsterCashMod, mineOverMatterMod, treasureIslandMod, operationClassifiedMod, hideAndBeSneakyMod, offTheChainMod, alienEggMod, beachBlanketBogusMod, crazytownMod, chefshankMod, oneFluMod, mastersOfDisastersMod, fullMetalDramaMod, oceansHeistMod, millionBucksBCMod, sportsMarathonMod, superHeroldMod, princessPrideMod, getAClueMod, rockNRuleMod, crouchingCourtneyMod, houstonMod, topDogMod, walkEgyptMod, crazyFunTimeMod, frozenCrossingMod, vikingSourMod, bridalBrawlsMod, greatFakeOutMod, africanLyingSafariMod, rapaPhooeyMod, drumhellerMod, planesTrainsMod, picnicHangingDorkMod, slapSlapRevMod, broadwayBabyMod, amazonRaceMod, nightMuseumMod, brutalerMod,
  truthOrSharkMod, rockTheDockMod, tropicalTakedownMod, midnightManhuntMod, greecesPiecesMod, hangarBlackMod, iceIceBabyMod, findersCreepersMod, backstabbersAhoyMod, projectRunawayMod, hawaiianPunchMod, aftermayhemMod, socialManipMod, settingsMod, campEventsMod, twistsMod, rescueIslandMod,
  episodeMod, finaleMod, textBacklogMod, aftermathMod,
  castUiMod, runUiMod, vpScreensMod, vpFinaleMod, vpUiMod,
  savestateMod,
  statsExportMod,
  audioMod,
  recapMod,
  broadcastMod,
];

for (const mod of extractedModules) {
  for (const [key, val] of Object.entries(mod)) {
    if (typeof val === 'function') {
      window[key] = val;
    }
  }
}

// ── Expose UI module state variables on window ──
// Objects/constants — direct assignment (mutated in place, not reassigned)
window._tvState = vpScreensMod._tvState;
window._ftcState = vpUiMod._ftcState;
window.audio = audioMod.audio;          // audio engine singleton (object, not a function)
window.CUE_CATALOG = audioMod.CUE_CATALOG;
window.BED_CATALOG = audioMod.BED_CATALOG;
window._vpa = vpUiMod._vpa;
window._alliancePermDesc = castUiMod._alliancePermDesc;
window.TRIBE_PALETTE = castUiMod.TRIBE_PALETTE;
window._hsReveal = hideAndBeSneakyMod._hsReveal;
window._hsRevealAll = hideAndBeSneakyMod._hsRevealAll;
window._mxReveal = offTheChainMod._mxReveal;
window._mxRevealAll = offTheChainMod._mxRevealAll;

// Mutable let variables — getters + explicit setter functions
// ES module live bindings work for reads but not writes; use setter functions for writes
const uiStateGettersSetters = [
  ['vpCurrentScreen', () => vpScreensMod.vpCurrentScreen, vpScreensMod.setVpCurrentScreen],
  ['vpScreens',       () => vpScreensMod.vpScreens,       vpScreensMod.setVpScreens],
  ['vpEpNum',         () => vpScreensMod.vpEpNum,          vpScreensMod.setVpEpNum],
  ['_spoilerFree',    () => runUiMod._spoilerFree,         runUiMod.set_spoilerFree],
  ['FRANCHISE_ROSTER',() => castUiMod.FRANCHISE_ROSTER,    castUiMod.setFRANCHISE_ROSTER],
];

for (const [prop, getter, setter] of uiStateGettersSetters) {
  Object.defineProperty(window, prop, {
    get: getter,
    set: setter,
    configurable: true,
  });
}

// Read-only live bindings (only modified within their own module)
const uiStateReadOnly = [
  ['_reunionRevealed', () => vpFinaleMod._reunionRevealed],
  ['_gcRevealed',      () => vpFinaleMod._gcRevealed],
  ['_vpSearchMatches', () => vpUiMod._vpSearchMatches],
  ['_vpSearchIdx',     () => vpUiMod._vpSearchIdx],
  ['rosterHighlight',  () => castUiMod.rosterHighlight],
];

for (const [prop, getter] of uiStateReadOnly) {
  Object.defineProperty(window, prop, {
    get: getter,
    configurable: true,
  });
}

// ── Challenge registry ──
window.CHALLENGES = {
  'cliff-dive': { simulate: cliffDiveMod.simulateCliffDive, rpBuild: cliffDiveMod.rpBuildCliffDive, text: cliffDiveMod._textCliffDive },
  'awake-a-thon': { simulate: awakeAThonMod.simulateAwakeAThon, rpBuild: awakeAThonMod.rpBuildAwakeAThon, text: awakeAThonMod._textAwakeAThon },
  'dodgebrawl': { simulate: dodgebrawlMod.simulateDodgebrawl, rpBuild: dodgebrawlMod.rpBuildDodgebrawl, text: dodgebrawlMod._textDodgebrawl },
  'talent-show': { simulate: talentShowMod.simulateTalentShow, rpBuild: talentShowMod.rpBuildTalentAuditions, text: talentShowMod._textTalentShow },
  'sucky-outdoors': { simulate: suckyOutdoorsMod.simulateSuckyOutdoors, rpBuild: suckyOutdoorsMod.rpBuildSuckyOutdoors, text: suckyOutdoorsMod._textSuckyOutdoors },
  'up-the-creek': { simulate: upTheCreekMod.simulateUpTheCreek, rpBuild: upTheCreekMod.rpBuildUpTheCreek, text: upTheCreekMod._textUpTheCreek },
  'paintball-hunt': { simulate: paintballHuntMod.simulatePaintballHunt, rpBuild: paintballHuntMod.rpBuildPaintballHunt, text: paintballHuntMod._textPaintballHunt },
  'hells-kitchen': { simulate: hellsKitchenMod.simulateHellsKitchen, rpBuild: hellsKitchenMod.rpBuildHellsKitchen, text: hellsKitchenMod._textHellsKitchen },
  'trust-challenge': { simulate: trustMod.simulateTrustChallenge, rpBuild: trustMod.rpBuildTrustChallenge, text: trustMod._textTrustChallenge },
  'basic-straining': { simulate: basicStrainingMod.simulateBasicStraining, rpBuild: basicStrainingMod.rpBuildBasicStraining, text: basicStrainingMod._textBasicStraining },
  'x-treme-torture': { simulate: xtremeTortureMod.simulateXtremeTorture, rpBuild: xtremeTortureMod.rpBuildXtremeTorture, text: xtremeTortureMod._textXtremeTorture },
  'phobia-factor': { simulate: phobiaFactorMod.simulatePhobiaFactor, rpBuild: phobiaFactorMod.rpBuildPhobiaConfessions, text: phobiaFactorMod._textPhobiaFactor },
  'brunch-of-disgustingness': { simulate: brunchMod.simulateBrunchOfDisgustingness, rpBuild: brunchMod.rpBuildBrunchSplit, text: brunchMod._textBrunchOfDisgustingness },
  'lucky-hunt': { simulate: luckyHuntMod.simulateLuckyHunt, rpBuild: luckyHuntMod.rpBuildLuckyHunt, text: luckyHuntMod._textLuckyHunt },
  'say-uncle': { simulate: sayUncleMod.simulateSayUncle, rpBuild: sayUncleMod.rpBuildSayUncleAnnouncement, text: sayUncleMod._textSayUncle },
  'triple-dog-dare': { simulate: tripleDogDareMod.simulateTripleDogDare, rpBuild: tripleDogDareMod.rpBuildTripleDogDareAnnouncement, text: tripleDogDareMod._textTripleDogDare },
  'slasher-night': { simulate: slasherNightMod.simulateSlasherNight, rpBuild: slasherNightMod.rpBuildSlasherTitleCard, text: slasherNightMod._textSlasherNight },
  'monster-cash': { simulate: monsterCashMod.simulateMonsterCash, rpBuild: monsterCashMod.rpBuildMonsterCashTitleCard, text: monsterCashMod._textMonsterCash },
  'mine-over-matter': { simulate: mineOverMatterMod.simulateMineOverMatter, rpBuild: mineOverMatterMod.rpBuildMineTitleCard, text: mineOverMatterMod._textMineOverMatter },
  'treasure-island': { simulate: treasureIslandMod.simulateTreasureIsland, rpBuild: treasureIslandMod.rpBuildTreasureTitleCard, text: treasureIslandMod._textTreasureIsland },
  'operation-classified': { simulate: operationClassifiedMod.simulateOperationClassified, rpBuild: operationClassifiedMod.rpBuildOperationClassifiedTitleCard, text: operationClassifiedMod._textOperationClassified },
  'hide-and-be-sneaky': { simulate: hideAndBeSneakyMod.simulateHideAndBeSneaky, rpBuild: hideAndBeSneakyMod.rpBuildHideAndBeSneaky, text: hideAndBeSneakyMod._textHideAndBeSneaky },
  'off-the-chain': { simulate: offTheChainMod.simulateOffTheChain, rpBuild: offTheChainMod.rpBuildOffTheChain, text: offTheChainMod._textOffTheChain },
  'wawanakwa-gone-wild': { simulate: wawanakwaGoneWildMod.simulateWawanakwaGoneWild, rpBuild: wawanakwaGoneWildMod.rpBuildWawanakwaGoneWild, text: wawanakwaGoneWildMod._textWawanakwaGoneWild },
  'tri-armed-triathlon': { simulate: triArmedTriathlonMod.simulateTriArmedTriathlon, rpBuild: triArmedTriathlonMod.rpBuildTriArmedTriathlon, text: triArmedTriathlonMod._textTriArmedTriathlon },
  'camp-castaways': { simulate: campCastawaysMod.simulateCampCastaways, rpBuild: campCastawaysMod.rpBuildCampCastaways, text: campCastawaysMod._textCampCastaways },
  'are-we-there-yeti': { simulate: areWeThereYetiMod.simulateAreWeThereYeti, rpBuild: areWeThereYetiMod.rpBuildYetiDropOff, text: areWeThereYetiMod._textAreWeThereYeti },
  'alien-egg': { simulate: alienEggMod.simulateAlienEgg, rpBuild: alienEggMod.rpBuildAlienEggTitleCard, text: alienEggMod._textAlienEgg },
  'beach-blanket-bogus': { simulate: beachBlanketBogusMod.simulateBeachBlanketBogus, rpBuild: beachBlanketBogusMod.rpBuildBeachBlanketBogusTitleCard, text: beachBlanketBogusMod._textBeachBlanketBogus },
};

// ══════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════

async function init() {
  buildStatSliders();
  buildAdvantageList();
  await loadAll();
  renderCast();
  renderConfig();
  renderRelList();
  renderAllianceList();
  renderPresetList();
  await _migrateSeasonSavesFromLS();
  renderSeasonSaveList();
  // Restore spoiler-free state BEFORE rendering tabs (so episode history respects it)
  const _sfSaved2 = localStorage.getItem('simulator_spoilerFree') === 'true';
  const _sfCb2 = document.getElementById('cfg-spoiler-free');
  if (_sfCb2) _sfCb2.checked = _sfSaved2;
  _spoilerFree = _sfSaved2;

  // Restore last active tab
  const _savedTab = localStorage.getItem('simulator_activeTab');
  if (_savedTab && ['cast','setup','run','results'].includes(_savedTab)) {
    showTab(_savedTab);
  }

  // Initialize the audio engine (first-gesture unlock + window exposure)
  audioMod.initAudio();
  // Broadcast channel bar: ON-AIR state, live clock, theme (light/dark)
  broadcastMod.initBroadcastBar();
  // Resolve returnee avatars for the loaded cast (uses -returnee.png when present)
  playersMod.refreshReturneeAvatars();
}

await init();
