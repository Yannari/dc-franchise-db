// js/chal/operation-classified.js - Operation: Classified spy challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, addBond } from '../bonds.js';

const HOST = () => seasonConfig.host || 'Chris';
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const VILLAINS = ['villain', 'schemer', 'mastermind'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'underdog'];

function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function canBlackmail(name) {
  const s = pStats(name);
  return VILLAINS.includes(arch(name)) || (s.strategic >= 7 && s.loyalty <= 4);
}
function isShunned(name) {
  const active = gs.activePlayers || [];
  if (active.length <= 1) return false;
  const avgBond = active.filter(p => p !== name).reduce((sum, p) => sum + getBond(name, p), 0) / Math.max(1, active.length - 1);
  return avgBond <= -0.75 || (gs.popularity?.[name] || 0) <= -2;
}
function portrait(name, size = 42) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const init = (name || '?')[0].toUpperCase();
  return `<span class="oc-port" style="width:${size}px;height:${size}px"><img src="assets/avatars/${slug}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><b>${init}</b></span>`;
}
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function addSpyHeat(victim, target, amount) {
  if (!victim || !target) return;
  if (!gs._operationClassifiedHeat) gs._operationClassifiedHeat = {};
  gs._operationClassifiedHeat[victim] = { target, amount, expiresEp: (gs.episode || 0) + 3 };
}

function statusFromCover(score) {
  if (score >= 7.8) return 'clear';
  if (score >= 5.6) return 'watched';
  return 'flagged';
}
function resultFromLaser(score) {
  if (score >= 8.4) return 'ghost';
  if (score >= 6.4) return 'clean';
  if (score >= 4.6) return 'alarm';
  return 'hit';
}
function resultFromDefusal(score) {
  if (score >= 8.6) return 'perfect';
  if (score >= 6.7) return 'defused';
  if (score >= 4.8) return 'messy';
  return 'blast';
}

function _simulateScan(active, state, timeline) {
  active.forEach(name => {
    const s = pStats(name);
    const coverScore = s.mental * 0.30 + s.intuition * 0.25 + s.strategic * 0.20 + s.temperament * 0.15 + s.social * 0.10 + rand(-1.5, 1.5);
    const status = statusFromCover(coverScore);
    const label = status === 'clear' ? 'CLEARANCE GRANTED' : status === 'watched' ? 'UNDER WATCH' : 'INTRUDER FLAGGED';
    const delta = status === 'clear' ? 1 : status === 'watched' ? 0 : -1.5;
    state.players[name].scan = { coverScore, status, label };
    state.players[name].score += delta;
    if (status === 'flagged') state.alarm += 8;
    timeline.scan.push({
      type: status, player: name, score: coverScore,
      text: status === 'clear'
        ? `${name}'s face scan clears instantly. Production security labels ${pronouns(name).obj} an authorized agent.`
        : status === 'watched'
        ? `${name}'s scan hangs for three uncomfortable seconds. The system lets ${pronouns(name).obj} through, but keeps a camera locked on ${pronouns(name).obj}.`
        : `${name} touches the handle and the whole set screams. INTRUDER FLAGGED. ${pronouns(name).Sub} start${pronouns(name).sub === 'they' ? '' : 's'} the mission already compromised.`,
    });
  });
}

function _simulateLaser(active, state, timeline) {
  const ordered = [...active].sort(() => Math.random() - 0.5);
  ordered.forEach(name => {
    const s = pStats(name);
    const base = s.physical * 0.35 + s.mental * 0.20 + s.endurance * 0.15 + s.boldness * 0.15 + s.intuition * 0.15;
    const scanMod = state.players[name].scan.status === 'flagged' ? -0.8 : state.players[name].scan.status === 'clear' ? 0.35 : 0;
    const reckless = s.boldness >= 8 && Math.random() < 0.28;
    const panic = s.temperament <= 3 && Math.random() < 0.25;
    const laserScore = base + scanMod + (reckless ? rand(-1.4, 1.8) : 0) + (panic ? -1.3 : 0) + rand(-2, 2);
    const result = resultFromLaser(laserScore);
    let delta = laserScore * 0.7;
    if (result === 'ghost') delta += 2.5;
    if (result === 'alarm') { delta -= 1.5; state.alarm += 10; }
    if (result === 'hit') { delta -= 3; state.alarm += 16; }
    if (reckless && result === 'ghost') delta += 1;
    if (panic) delta -= 1;
    state.players[name].laser = { laserScore, result, reckless, panic };
    state.players[name].score += delta;
    timeline.laser.push({
      type: result, player: name, score: laserScore,
      text: result === 'ghost'
        ? `${name} reads the laser rhythm, drops under a red beam, rolls through a blind spot, and clears the vault like the room was built for ${pronouns(name).obj}.`
        : result === 'clean'
        ? `${name} takes the slow route. Not flashy, not stupid. One step, one breath, one clean crossing.`
        : result === 'alarm'
        ? `${name} clips a beam with ${pronouns(name).posAdj} shoulder. The siren kicks on and every camera in the room swings toward ${pronouns(name).obj}.`
        : `${name} freezes, guesses wrong, and eats a wall of red light. The console marks ${pronouns(name).obj} COMPROMISED.`,
    });
  });
}

function _findAlliancePitcher(active) {
  const shunned = active.filter(isShunned).sort((a, b) => pStats(b).strategic + pStats(b).social - pStats(a).strategic - pStats(a).social);
  return shunned[0] || null;
}
function _simulateWiretap(active, state, timeline) {
  const intelScores = active.map(name => {
    const s = pStats(name);
    const intelScore = s.strategic * 0.35 + s.intuition * 0.30 + s.social * 0.20 + s.mental * 0.15 + rand(-2, 2);
    state.players[name].intel = { intelScore };
    state.players[name].score += intelScore * 0.55;
    return { name, intelScore };
  }).sort((a, b) => b.intelScore - a.intelScore);

  const pitcher = _findAlliancePitcher(active);
  if (pitcher) {
    const pool = active.filter(p => p !== pitcher)
      .map(p => ({ name: p, weight: Math.max(0.2, pStats(p).strategic * 0.35 + pStats(p).social * 0.25 + getBond(pitcher, p) * 0.45 + rand(0, 2)) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map(x => x.name);
    const accepted = pool.length >= 2 && (pStats(pitcher).social + pStats(pitcher).strategic + rand(-2, 2)) >= 10;
    state.alliancePitch = { pitcher, targets: pool, accepted };
    if (accepted) {
      pool.forEach(p => addBond(pitcher, p, 1.4));
      state.players[pitcher].score += 3;
      popDelta(pitcher, 1);
    } else {
      pool.forEach(p => addBond(pitcher, p, -0.4));
      state.players[pitcher].score -= 1;
    }
    timeline.wiretap.push({
      type: accepted ? 'alliance' : 'alliance-fail', player: pitcher, players: [pitcher, ...pool],
      text: accepted
        ? `WIRETAP: ${pitcher} uses the camera blackout to pitch ${pool.join(' and ')}. The room has been cold to ${pronouns(pitcher).obj}, but this time the offer lands. A quiet voting bloc forms in the static.`
        : `WIRETAP: ${pitcher} tries to turn being shunned into leverage. ${pool.join(' and ')} listen, but the recorder catches the hesitation. No deal yet.`,
    });
  }

  const blackmailer = active.filter(canBlackmail).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  if (blackmailer) {
    const target = active.filter(p => p !== blackmailer).sort((a, b) => {
      const wa = pStats(a).social + pStats(a).strategic + Math.max(0, -getBond(blackmailer, a));
      const wb = pStats(b).social + pStats(b).strategic + Math.max(0, -getBond(blackmailer, b));
      return wb - wa;
    })[0];
    const exposer = intelScores.find(x => x.name !== blackmailer && x.name !== target)?.name;
    const blackmailPower = pStats(blackmailer).strategic * 0.55 + pStats(blackmailer).social * 0.20 + (10 - pStats(blackmailer).loyalty) * 0.25 + rand(-2, 2);
    const exposePower = exposer ? pStats(exposer).intuition * 0.45 + pStats(exposer).strategic * 0.35 + pStats(exposer).mental * 0.20 + rand(-1.5, 1.5) : 0;
    const foiled = exposer && exposePower >= blackmailPower - 0.4;
    state.blackmail = { blackmailer, target, exposer, foiled, blackmailPower, exposePower };
    if (foiled) {
      addBond(target, blackmailer, -1.5);
      addBond(exposer, target, 1.0);
      addSpyHeat(target, blackmailer, 2.3);
      state.players[blackmailer].score -= 4;
      state.players[exposer].score += 3;
      state.alarm += 14;
      popDelta(blackmailer, -2);
    } else {
      addBond(target, blackmailer, -0.8);
      addSpyHeat(blackmailer, target, 0.8);
      state.players[blackmailer].score += 2.5;
      state.players[target].score -= 1;
      state.alarm += 7;
    }
    timeline.wiretap.push({
      type: foiled ? 'blackmail-foiled' : 'blackmail', player: blackmailer, players: [blackmailer, target, exposer].filter(Boolean),
      text: foiled
        ? `BLACKMAIL ATTEMPT DETECTED: ${blackmailer} corners ${target} with dirt from the mission feed. ${exposer} catches the recording and flips it back on ${pronouns(blackmailer).obj}. The leverage burns in public.`
        : `BLACKMAIL ATTEMPT: ${blackmailer} gets ${target} alone and weaponizes what the cameras caught. It is ugly, quiet, and effective enough to matter.`,
    });
  }

  intelScores.slice(0, 2).forEach(({ name }) => {
    if (state.blackmail?.exposer === name) return;
    state.players[name].score += 1;
    timeline.wiretap.push({
      type: 'intel', player: name,
      text: `${name} watches the monitor wall instead of the lasers. A glance, a whisper, a reflection in the glass. ${pronouns(name).Sub} leave${pronouns(name).sub === 'they' ? '' : 's'} the phase with useful intel.`,
    });
  });
}

function _simulateDefusal(active, state, timeline, ep) {
  const wireNames = ['blue', 'red', 'green', 'yellow', 'black', 'white'];
  active.forEach(name => {
    const s = pStats(name);
    const brainTrust = state.players[name].intel?.intelScore >= 8 && s.strategic >= 6;
    const base = s.mental * 0.35 + s.intuition * 0.30 + s.temperament * 0.20 + s.strategic * 0.10 + s.boldness * 0.05;
    const laserCarry = (state.players[name].laser?.laserScore || 0) * 0.10;
    const compromised = state.players[name].laser?.result === 'hit' || state.players[name].scan?.status === 'flagged';
    const defusalScore = base + laserCarry + (brainTrust ? 0.9 : 0) + (compromised ? -0.8 : 0) + rand(-2.5, 2.5);
    const result = resultFromDefusal(defusalScore);
    const wire = wireNames[Math.floor(Math.abs(Math.round(defusalScore * 10 + name.length)) % wireNames.length)];
    let delta = defusalScore;
    if (result === 'perfect') delta += 4;
    if (result === 'messy') { delta -= 1.5; state.alarm += 8; }
    if (result === 'blast') { delta -= 5; state.alarm += 18; }
    state.players[name].defusal = { defusalScore, result, wire, brainTrust };
    state.players[name].score += delta;
    timeline.defusal.push({
      type: result, player: name, score: defusalScore,
      text: result === 'perfect'
        ? `${name} studies the panel, trusts the pattern, and cuts ${wire}. The timer dies at 00:01. Perfect defusal.`
        : result === 'defused'
        ? `${name} picks ${wire}, winces, and cuts. The bomb sputters out. Not elegant, but alive.`
        : result === 'messy'
        ? `${name} cuts ${wire}. The timer stops, then starts again, then finally dies. Tomato-red warning foam sprays across the floor.`
        : `${name} panics at the panel and cuts ${wire}. Wrong wire. The blast doors slam and the console marks the attempt FAILED.`,
    });
  });

  const ranked = active.map(name => ({ name, score: state.players[name].score })).sort((a, b) => b.score - a.score);
  let winner = ranked[0]?.name || active[0];
  const runnerUp = ranked[1]?.name || null;
  const tieDiff = runnerUp ? Math.abs(ranked[0].score - ranked[1].score) : Infinity;
  const doubleTwist = (ep.twists || []).some(t => t.type === 'double-safety' || t.type === 'shared-immunity');
  let extraImmune = null;
  let tiebreak = null;
  if (runnerUp && tieDiff <= 0.35) {
    if (doubleTwist) {
      extraImmune = runnerUp;
    } else {
      const a = ranked[0].name, b = ranked[1].name;
      const sa = pStats(a), sb = pStats(b);
      const scoreA = sa.mental * 0.40 + sa.intuition * 0.35 + sa.temperament * 0.25 + rand(-1, 1);
      const scoreB = sb.mental * 0.40 + sb.intuition * 0.35 + sb.temperament * 0.25 + rand(-1, 1);
      winner = scoreA >= scoreB ? a : b;
      tiebreak = { players: [a, b], scores: { [a]: scoreA, [b]: scoreB }, winner };
      state.players[winner].score += 1.5;
    }
  }
  state.final = { ranked, winner, runnerUp, tieDiff, extraImmune, tiebreak };
  if (winner) popDelta(winner, 2);
}

export function simulateOperationClassified(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const state = {
    title: 'Operation: Classified',
    host: HOST(),
    players: {},
    alarm: 0,
    alliancePitch: null,
    blackmail: null,
    final: null,
  };
  const timeline = { scan: [], laser: [], wiretap: [], defusal: [] };
  active.forEach(name => { state.players[name] = { score: 0 }; });

  _simulateScan(active, state, timeline);
  _simulateLaser(active, state, timeline);
  _simulateWiretap(active, state, timeline);
  _simulateDefusal(active, state, timeline, ep);

  const ranked = state.final.ranked;
  ep.isOperationClassified = true;
  ep.operationClassified = { ...state, activePlayers: active, timeline, alarm: Math.round(state.alarm), leaderboard: ranked };
  ep.challengeType = 'operation-classified';
  ep.challengeLabel = 'Operation: Classified';
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'Post-merge spy mission: face scan, laser vault, wiretap blackmail, and bomb defusal. One immunity winner unless a double-immunity twist or exact tie permits two.';
  ep.immunityWinner = state.final.winner;
  if (state.final.extraImmune) ep.extraImmune = [...(ep.extraImmune || []), state.final.extraImmune];
  ep.chalPlacements = ranked.map(r => r.name);
  ep.challengePlacements = ranked.map((r, i) => ({ name: r.name, place: i + 1, score: r.score }));
  ep.chalMemberScores = {};
  ranked.forEach(r => { ep.chalMemberScores[r.name] = r.score; });
  ep.tribalPlayers = active;
}

function css() {
  return `<style>
  .oc-shell{--oc-red:#ff2d2d;--oc-green:#22c55e;--oc-amber:#f59e0b;--oc-steel:#94a3b8;--oc-ink:#050607;--oc-panel:#0c1014;position:relative;overflow:hidden;background:#050607;color:#e5e7eb;border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:18px;font-family:Inter,Arial,sans-serif;min-height:560px}
  .oc-shell:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 4px),radial-gradient(circle at 30% 10%,rgba(255,45,45,.14),transparent 34%);pointer-events:none;mix-blend-mode:screen}
  .oc-head{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:14px;margin-bottom:14px}
  .oc-kicker{font:700 10px/1 "Courier New",monospace;letter-spacing:3px;color:var(--oc-red);text-transform:uppercase}
  .oc-title{font-family:var(--font-display,Impact,sans-serif);font-size:34px;letter-spacing:2px;text-transform:uppercase;color:#fff;text-shadow:0 0 18px rgba(255,45,45,.32)}
  .oc-sub{font-size:12px;color:rgba(229,231,235,.62);max-width:620px;line-height:1.45;margin-top:6px}
  .oc-layout{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:14px}
  .oc-feed{min-width:0}
  .oc-sidebar{border:1px solid rgba(148,163,184,.2);background:rgba(12,16,20,.82);border-radius:6px;padding:12px;position:sticky;top:10px;align-self:start}
  .oc-side-title{font:700 10px/1 "Courier New",monospace;color:var(--oc-amber);letter-spacing:2px;text-transform:uppercase;margin-bottom:9px}
  .oc-metric{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:11px;color:rgba(229,231,235,.74)}
  .oc-metric b{font-family:"Courier New",monospace;color:#fff}
  .oc-agent{display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:11px}
  .oc-agent span.name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .oc-chip{font:700 8px/1 "Courier New",monospace;letter-spacing:1px;padding:4px 5px;border:1px solid rgba(255,255,255,.12);border-radius:3px;color:var(--oc-steel)}
  .oc-chip.clear,.oc-chip.perfect,.oc-chip.defused,.oc-chip.ghost{color:var(--oc-green);border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.08)}
  .oc-chip.flagged,.oc-chip.hit,.oc-chip.blast,.oc-chip.blackmail-foiled{color:var(--oc-red);border-color:rgba(255,45,45,.4);background:rgba(255,45,45,.08)}
  .oc-chip.alarm,.oc-chip.messy,.oc-chip.watched{color:var(--oc-amber);border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.08)}
  .oc-event{display:flex;gap:12px;align-items:flex-start;margin:9px 0;padding:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);border-left:3px solid var(--oc-steel);border-radius:5px}
  .oc-event[data-tone=good]{border-left-color:var(--oc-green)}.oc-event[data-tone=bad]{border-left-color:var(--oc-red)}.oc-event[data-tone=warn]{border-left-color:var(--oc-amber)}
  .oc-port{display:inline-grid;place-items:center;flex:0 0 auto;border:1px solid rgba(255,255,255,.18);background:#111;border-radius:4px;overflow:hidden}.oc-port img{width:100%;height:100%;object-fit:cover}.oc-port b{display:none;color:#fff}
  .oc-copy{font-size:13px;line-height:1.55;color:rgba(245,245,245,.88)}
  .oc-row{display:flex;align-items:center;gap:9px;min-width:0}.oc-score{margin-left:auto;font:700 12px "Courier New",monospace;color:var(--oc-green)}
  .oc-controls{text-align:center;margin-top:16px}.oc-btn{border:1px solid rgba(255,45,45,.5);background:linear-gradient(180deg,#271012,#120709);color:#fff;border-radius:4px;padding:11px 18px;font:700 11px "Courier New",monospace;letter-spacing:2px;text-transform:uppercase;cursor:pointer}.oc-btn.secondary{border-color:rgba(148,163,184,.35);background:#101418;color:var(--oc-steel);margin-left:8px}
  .oc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:12px}.oc-dossier{padding:10px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.035);border-radius:5px;text-align:center}.oc-dossier .nm{font-size:11px;font-weight:700;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.oc-dossier .st{font:700 9px "Courier New",monospace;color:var(--oc-steel);margin-top:4px}
  .oc-winner{text-align:center;padding:28px 14px}.oc-winner .name{font-family:var(--font-display,Impact,sans-serif);font-size:32px;letter-spacing:2px;text-transform:uppercase;color:#fff}.oc-stamp{display:inline-block;margin-top:10px;border:2px solid var(--oc-green);color:var(--oc-green);padding:7px 12px;font:900 13px "Courier New",monospace;letter-spacing:2px;transform:rotate(-2deg)}
  @media(max-width:760px){.oc-layout{grid-template-columns:1fr}.oc-sidebar{position:relative;top:auto}.oc-head{display:block}.oc-title{font-size:27px}}
  </style>`;
}
function shell(ep, body, screenKey, events = []) {
  const oc = ep.operationClassified;
  const stateKey = `oc-${ep.num}-${screenKey}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;
  return `${css()}<div class="oc-shell" data-oc="${stateKey}">
    <div class="oc-head"><div><div class="oc-kicker">Mission Control // ${HOST()}</div><div class="oc-title">Operation: Classified</div><div class="oc-sub">You are inside the surveillance console. Advance the feed to scan agents, breach the laser vault, intercept wiretaps, and resolve the immunity defusal.</div></div><div class="oc-chip">POST-MERGE</div></div>
    <div class="oc-layout"><div class="oc-feed">${body}</div><div class="oc-sidebar" id="oc-sidebar-${stateKey}">${buildSidebar(oc, screenKey, revIdx, events)}</div></div>
  </div>`;
}
function eventTone(type) {
  if (['clear', 'ghost', 'clean', 'perfect', 'defused', 'alliance', 'intel'].includes(type)) return 'good';
  if (['flagged', 'hit', 'blast', 'blackmail-foiled'].includes(type)) return 'bad';
  return 'warn';
}
function renderSteps(ep, screenKey, events, btnLabel) {
  const stateKey = `oc-${ep.num}-${screenKey}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const state = window._tvState[stateKey];
  let html = '';
  events.forEach((ev, i) => {
    const visible = i <= state.idx;
    const imgs = (ev.players || [ev.player]).filter(Boolean).slice(0, 3).map(p => portrait(p, 44)).join('');
    html += `<div id="oc-step-${stateKey}-${i}" data-type="${ev.type}" data-player="${ev.player || ''}" style="${visible ? '' : 'display:none'}">
      <div class="oc-event" data-tone="${eventTone(ev.type)}"><div class="oc-row">${imgs}</div><div class="oc-copy">${ev.text}</div>${ev.score !== undefined ? `<div class="oc-score">${ev.score.toFixed(1)}</div>` : ''}</div>
    </div>`;
  });
  const done = state.idx >= events.length - 1;
  html += `<div id="oc-controls-${stateKey}" class="oc-controls" ${done ? 'style="display:none"' : ''}>
    <button class="oc-btn" onclick="operationClassifiedRevealNext('${stateKey}',${events.length},'${screenKey}')">${btnLabel} (${Math.min(events.length, state.idx + 2)}/${events.length})</button>
    <button class="oc-btn secondary" onclick="operationClassifiedRevealAll('${stateKey}',${events.length},'${screenKey}')">Reveal All</button>
  </div>`;
  return html;
}
function buildSidebar(oc, screenKey, revIdx, events = []) {
  const revealed = events.slice(0, Math.max(0, revIdx + 1));
  const statusBy = {};
  revealed.forEach(ev => { if (ev.player) statusBy[ev.player] = ev.type; });
  const alarm = Math.min(99, Math.round((oc.alarm || 0) * Math.max(0.25, (revIdx + 1) / Math.max(1, events.length))));
  const leader = revIdx >= Math.floor(events.length * 0.6) || screenKey === 'debrief'
    ? (oc.leaderboard?.[0]?.name || oc.final?.winner || 'CLASSIFIED')
    : 'CLASSIFIED';
  const compromised = Object.entries(oc.players || {}).filter(([n, p]) =>
    ['flagged', 'hit', 'blast'].includes(statusBy[n]) || p.scan?.status === 'flagged' || p.defusal?.result === 'blast'
  ).length;
  let html = `<div class="oc-side-title">Mission Control</div>
    <div class="oc-metric"><span>Alarm Level</span><b style="color:${alarm > 60 ? 'var(--oc-red)' : alarm > 30 ? 'var(--oc-amber)' : 'var(--oc-green)'}">${alarm}%</b></div>
    <div class="oc-metric"><span>Agents Active</span><b>${oc.activePlayers?.length || 0}</b></div>
    <div class="oc-metric"><span>Compromised</span><b>${compromised}</b></div>
    <div class="oc-metric"><span>Immunity Lead</span><b>${leader}</b></div>
    <div class="oc-side-title" style="margin-top:12px">Agent Status</div>`;
  (oc.activePlayers || []).forEach(name => {
    const p = oc.players[name] || {};
    const st = statusBy[name] || (screenKey === 'scan' ? 'pending' : p.scan?.status || 'pending');
    html += `<div class="oc-agent">${portrait(name, 24)}<span class="name">${name}</span><span class="oc-chip ${st}">${String(st).toUpperCase()}</span></div>`;
  });
  const feed = revealed.slice(-3).map(ev => ev.type.replace(/-/g, ' ').toUpperCase());
  if (feed.length) html += `<div class="oc-side-title" style="margin-top:12px">Intel Feed</div>${feed.map(f => `<div class="oc-metric"><span>${f}</span><b>LOG</b></div>`).join('')}`;
  return html;
}

export function rpBuildOperationClassifiedTitleCard(ep) {
  const oc = ep.operationClassified;
  const cards = (oc.activePlayers || []).map(name => {
    const st = oc.players[name]?.scan?.status || 'pending';
    return `<div class="oc-dossier">${portrait(name, 58)}<div class="nm">${name}</div><div class="st">${st.toUpperCase()}</div></div>`;
  }).join('');
  return shell(ep, `<div class="oc-winner"><div class="oc-kicker">Unauthorized Broadcast Captured</div><div class="name">Mission Feed Online</div><div class="oc-stamp">CLASSIFIED</div></div><div class="oc-grid">${cards}</div>`, 'title', []);
}
export function rpBuildOperationClassifiedScan(ep) {
  const events = ep.operationClassified.timeline.scan || [];
  return shell(ep, renderSteps(ep, 'scan', events, 'Scan Next'), 'scan', events);
}
export function rpBuildOperationClassifiedLaser(ep) {
  const events = ep.operationClassified.timeline.laser || [];
  return shell(ep, renderSteps(ep, 'laser', events, 'Breach'), 'laser', events);
}
export function rpBuildOperationClassifiedWiretap(ep) {
  const events = ep.operationClassified.timeline.wiretap || [];
  return shell(ep, renderSteps(ep, 'wiretap', events, 'Intercept'), 'wiretap', events);
}
export function rpBuildOperationClassifiedDefusal(ep) {
  const events = ep.operationClassified.timeline.defusal || [];
  return shell(ep, renderSteps(ep, 'defusal', events, 'Cut Wire'), 'defusal', events);
}
export function rpBuildOperationClassifiedDebrief(ep) {
  const oc = ep.operationClassified;
  const winner = oc.final?.winner || ep.immunityWinner;
  const rows = (oc.leaderboard || []).map((r, i) => {
    const win = r.name === winner;
    return `<div class="oc-agent" style="${win ? 'background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.18)' : ''}"><b style="width:22px;color:${win ? 'var(--oc-green)' : 'var(--oc-steel)'}">${i + 1}</b>${portrait(r.name, 32)}<span class="name">${r.name}</span><span class="oc-score">${r.score.toFixed(1)}</span></div>`;
  }).join('');
  const fallout = [
    oc.blackmail?.foiled ? `Blackmail foiled: ${oc.blackmail.blackmailer} got exposed by ${oc.blackmail.exposer}.` : oc.blackmail ? `Blackmail unresolved: ${oc.blackmail.blackmailer} leaves with leverage on ${oc.blackmail.target}.` : 'No blackmail packet survived the mission.',
    oc.alliancePitch?.accepted ? `New quiet bloc detected: ${[oc.alliancePitch.pitcher, ...oc.alliancePitch.targets].join(', ')}.` : oc.alliancePitch ? `${oc.alliancePitch.pitcher}'s alliance pitch was logged but not locked.` : 'No new alliance pitch detected.',
    oc.final?.extraImmune ? `${oc.final.extraImmune} also receives immunity through the active double-immunity twist.` : oc.final?.tiebreak ? `Tie broken by sudden defusal: ${oc.final.tiebreak.winner} wins alone.` : 'Single immunity protocol confirmed.',
  ].map(t => `<div class="oc-event" data-tone="warn"><div class="oc-copy">${t}</div></div>`).join('');
  return shell(ep, `<div class="oc-winner">${portrait(winner, 92)}<div class="name">${winner}</div><div class="oc-stamp">IMMUNITY GRANTED</div></div>${fallout}<div class="oc-side-title">Final Leaderboard</div>${rows}`, 'debrief', []);
}

export function operationClassifiedRevealNext(stateKey, totalSteps, screenKey) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const st = window._tvState[stateKey];
  if (st.idx >= totalSteps - 1) return;
  st.idx++;
  const el = document.getElementById(`oc-step-${stateKey}-${st.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  if (st.idx >= totalSteps - 1) {
    const controls = document.getElementById(`oc-controls-${stateKey}`);
    if (controls) controls.style.display = 'none';
  }
  _operationClassifiedUpdateSidebar(stateKey, screenKey);
}
export function operationClassifiedRevealAll(stateKey, totalSteps, screenKey) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  for (let i = window._tvState[stateKey].idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`oc-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  window._tvState[stateKey].idx = totalSteps - 1;
  const controls = document.getElementById(`oc-controls-${stateKey}`);
  if (controls) controls.style.display = 'none';
  _operationClassifiedUpdateSidebar(stateKey, screenKey);
}
function _operationClassifiedUpdateSidebar(stateKey, screenKey) {
  const epNum = Number((stateKey.match(/^oc-(\d+)-/) || [])[1] || 0);
  const ep = (gs.episodeHistory || []).find(e => e.num === epNum) || gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const oc = ep?.operationClassified;
  const side = document.getElementById(`oc-sidebar-${stateKey}`);
  if (!oc || !side) return;
  const events = oc.timeline?.[screenKey] || [];
  const idx = window._tvState?.[stateKey]?.idx ?? -1;
  side.innerHTML = buildSidebar(oc, screenKey, idx, events);
}

export function _textOperationClassified(ep, ln, sec) {
  if (!ep.operationClassified) return;
  const oc = ep.operationClassified;
  sec('OPERATION CLASSIFIED');
  ln(`${HOST()} locks the merged tribe into a spy mission built around face scans, laser grids, wiretaps, and bomb defusal.`);
  if (oc.blackmail?.foiled) ln(`${oc.blackmail.blackmailer}'s blackmail attempt against ${oc.blackmail.target} is exposed by ${oc.blackmail.exposer}, turning the leverage into heat.`);
  else if (oc.blackmail) ln(`${oc.blackmail.blackmailer} successfully leaves the wiretap phase with leverage on ${oc.blackmail.target}.`);
  if (oc.alliancePitch?.accepted) ln(`${oc.alliancePitch.pitcher} turns a bad social position into a new alliance pitch with ${oc.alliancePitch.targets.join(' and ')}.`);
  if (oc.final?.tiebreak) ln(`A near-tie forces a sudden defusal tiebreaker. ${oc.final.tiebreak.winner} wins it.`);
  if (oc.final?.extraImmune) ln(`${oc.final.extraImmune} also receives immunity because a double-immunity twist is active.`);
  ln(`IMMUNITY WINNER: ${oc.final?.winner || ep.immunityWinner}.`);
  ln(`FINAL ORDER: ${(oc.leaderboard || []).map(r => `${r.name} (${r.score.toFixed(1)})`).join(', ')}`);
}
