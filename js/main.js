// ══════════════════════════════════════════════════════════════════════
// main.js — Bridge between ES modules and inline <script defer>
// Imports from core.js and exposes everything on window for onclick handlers
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
import * as socialManipMod from './social-manipulation.js';
import * as campEventsMod from './camp-events.js';
import * as twistsMod from './twists.js';
import * as rescueIslandMod from './rescue-island.js';

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
  'setSelectedEpisodes', 'setCurrentTwistFilter',
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
  suckyOutdoorsMod, upTheCreekMod, paintballHuntMod, hellsKitchenMod,
  trustMod, basicStrainingMod, xtremeTortureMod, phobiaFactorMod,
  brunchMod, luckyHuntMod, sayUncleMod, tripleDogDareMod, slasherNightMod,
  socialManipMod, campEventsMod, twistsMod, rescueIslandMod,
];

for (const mod of extractedModules) {
  for (const [key, val] of Object.entries(mod)) {
    if (typeof val === 'function') {
      window[key] = val;
    }
  }
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
  'slasher-night': { simulate: slasherNightMod.simulateSlasherNight, rpBuild: slasherNightMod.rpBuildSlasherAnnouncement, text: slasherNightMod._textSlasherNight },
};
