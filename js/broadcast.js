// ══════════════════════════════════════════════════════════════════════
// broadcast.js — Broadcast "channel bar" identity + light/dark theme toggle
// ══════════════════════════════════════════════════════════════════════
// Sleek modern sports-network chrome for the app shell: an ON-AIR light, a
// live clock, the network name, and the current season/episode context pulled
// from gs. Plus a persisted light/dark theme toggle. The cinematic VP/recap
// keep their own dark palette and are unaffected by the theme.
//
// Pure helpers (theme + display string) are split out and unit-tested; the
// DOM wiring (clock interval, button) is thin.
import { gs, seasonConfig } from './core.js';

export const THEME_KEY = 'dc_theme';   // 'dark' (default) | 'light'

// ── Theme (pure) ──
export function normalizeTheme(t) { return t === 'light' ? 'light' : 'dark'; }

export function loadTheme(storage) {
  const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  return normalizeTheme(s ? s.getItem(THEME_KEY) : 'dark');
}

export function saveTheme(theme, storage) {
  const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (s) s.setItem(THEME_KEY, normalizeTheme(theme));
}

// ── Broadcast bar display string (pure) ──
// Returns the public, persistent season context shown in the application shell.
export function broadcastState(g = gs, cfg = seasonConfig) {
  const hasSeason = !!(g && g.initialized);
  const season = (cfg && cfg.name) ? cfg.name : null;
  // gs.episode is 0 before the first episode runs; show the NEXT/current ep number.
  const epNum = hasSeason ? (g.episode || 0) : 0;
  const activeCount = hasSeason ? (g.activePlayers || []).length : 0;
  const originalCount = hasSeason ? Math.max(1, activeCount + (g.eliminated || []).length) : 1;
  const progress = hasSeason && originalCount > 1
    ? Math.max(0, Math.min(100, Math.round(((originalCount - activeCount) / (originalCount - 1)) * 100)))
    : 0;
  const phase = !hasSeason ? 'Create'
    : g.phase === 'pre-merge' ? 'Pre-Merge'
      : g.phase === 'post-merge' ? 'Post-Merge'
        : g.phase === 'finale' ? 'Finale'
          : g.phase === 'complete' ? 'Complete' : '';
  return {
    onAir: hasSeason,
    network: 'DC FRANCHISE NETWORK',
    season: season || (hasSeason ? 'Untitled Season' : null),
    episode: epNum > 0 ? epNum : null,
    phase,
    progress,
  };
}

// Two-digit zero-padded clock string HH:MM from a Date (pure).
export function clockString(date = new Date()) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ── DOM wiring ──
export function applyTheme(theme) {
  const t = normalizeTheme(theme);
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', t);
  }
  const btn = typeof document !== 'undefined' && document.getElementById('theme-toggle');
  if (btn) { btn.textContent = t === 'light' ? '🌙' : '☀️'; btn.title = t === 'light' ? 'Switch to dark mode' : 'Switch to light mode'; }
  return t;
}

export function toggleTheme() {
  const next = loadTheme() === 'light' ? 'dark' : 'light';
  saveTheme(next);
  applyTheme(next);
}

export function updateBroadcastBar() {
  if (typeof document === 'undefined') return;
  const st = broadcastState();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const onAirEl = document.getElementById('bcast-onair');
  const headerEl = document.querySelector('.sim-header');
  if (onAirEl) onAirEl.classList.toggle('off', !st.onAir);
  if (headerEl) headerEl.classList.toggle('season-live', st.onAir);
  set('bcast-onair-label', st.onAir ? 'ON AIR' : 'OFF AIR');
  set('bcast-season', st.season || '—');
  const epEl = document.getElementById('bcast-episode');
  if (epEl) epEl.textContent = st.episode ? `EP ${st.episode}` : '';
  set('bcast-phase', st.phase || '');
  const progressEl = document.getElementById('bcast-progress-fill');
  if (progressEl) progressEl.style.width = `${st.progress || 0}%`;
}

let _clockTimer = null;
export function initBroadcastBar() {
  if (typeof document === 'undefined') return;
  applyTheme(loadTheme());
  updateBroadcastBar();
  const tick = () => { const el = document.getElementById('bcast-clock'); if (el) el.textContent = clockString(); };
  tick();
  if (_clockTimer) clearInterval(_clockTimer);
  _clockTimer = setInterval(tick, 15000); // 15s is plenty for HH:MM
}
