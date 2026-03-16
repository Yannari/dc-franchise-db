// Site Configuration - auto-synced from franchise_database.json
// Edit fallback values here only if franchise_database.json is unavailable
const SITE_CONFIG = {
  seasons: 9,
  players: 102,
  currentSeason: 9,
  iconFormat: 'name.png'
};

window.SITE_CONFIG = SITE_CONFIG;

// Auto-sync from franchise_database.json so adding a new season requires
// only updating that file — no manual edits needed anywhere else.
(async function () {
  try {
    const root = document.documentElement.getAttribute('data-root') || '.';
    const r = await fetch(root + '/franchise_database.json');
    if (!r.ok) return;
    const data = await r.json();
    const fs = data.franchiseStats;
    if (!fs) return;
    window.SITE_CONFIG.seasons = fs.totalSeasons;
    window.SITE_CONFIG.players = fs.uniquePlayers;
    window.SITE_CONFIG.currentSeason = fs.totalSeasons;
    document.dispatchEvent(new CustomEvent('siteConfigReady', { detail: window.SITE_CONFIG }));
  } catch (_) {}
})();
