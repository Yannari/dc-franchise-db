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
];

for (const mod of extractedModules) {
  for (const [key, val] of Object.entries(mod)) {
    if (typeof val === 'function') {
      window[key] = val;
    }
  }
}
