// ══════════════════════════════════════════════════════════════════════
// cast-ui.js — Cast builder, roster, presets, config, relationships, alliances UI
// ══════════════════════════════════════════════════════════════════════

export function showTab(name) {
  activeTab = name;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const tabs = ['cast', 'setup', 'run', 'results'];
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    if (i < tabs.length) btn.classList.toggle('active', tabs[i] === name);
  });
  if (name === 'cast')    renderTribeSelect();
  if (name === 'setup')   { populateRelDropdowns(); updateCastSizeDisplay(); renderTimeline(); renderTwistCatalog(); }
  if (name === 'run')     initRunTab();
  if (name === 'results') renderResultsTab();
  // Remember active tab across reloads
  try { localStorage.setItem('simulator_activeTab', name); } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════════
// STAT SLIDERS
// ══════════════════════════════════════════════════════════════════════

export function buildStatSliders() {
  const container = document.getElementById('stat-sliders');
  container.innerHTML = STATS.map(s => `
    <div class="slider-row">
      <span class="slider-name" style="color:${s.color}" title="${s.desc}">${s.name}</span>
      <input type="range" min="1" max="10" value="5" class="stat-slider" id="slider-${s.key}"
        oninput="setSlider('${s.key}', this.value, true)">
      <span class="slider-val" id="val-${s.key}" style="color:${s.color}">5</span>
    </div>`).join('');
  STATS.forEach(s => setSlider(s.key, 5, false));
}

export function setSlider(key, val, resetArchetype) {
  const n = parseInt(val), stat = STATS.find(s => s.key === key);
  const pct = ((n-1)/9*100).toFixed(1) + '%';
  const el = document.getElementById('slider-' + key);
  if (el) { el.value = n; el.style.background = `linear-gradient(to right,${stat.color} 0%,${stat.color} ${pct},#334155 ${pct})`; }
  const vEl = document.getElementById('val-' + key);
  if (vEl) vEl.textContent = n;
  if (resetArchetype) document.getElementById('f-archetype').value = '';
}
export function applyArchetype(key) {
  const a = ARCHETYPES[key]; if (!a) return;
  // Only overwrite stats when adding a NEW player — editing an existing player just changes the label
  if (!editingId) STATS.forEach(s => setSlider(s.key, a[s.key], false));
  document.getElementById('archetype-desc').textContent = a.desc || '';
}
export function getStats() { const s = {}; STATS.forEach(st => { s[st.key] = parseInt(document.getElementById('slider-'+st.key).value); }); return s; }
export function putStats(stats) { STATS.forEach(s => setSlider(s.key, stats[s.key] || 5, false)); }

// ══════════════════════════════════════════════════════════════════════
// DERIVED
// ══════════════════════════════════════════════════════════════════════


// ── Tribe Builder ─────────────────────────────────────────────────────
export const TRIBE_PALETTE = ['#f59e0b','#ef4444','#3b82f6','#10b981','#8b5cf6','#f97316','#ec4899','#0ea5e9','#64748b','#fb7185'];

export function renderTribeBuilder() {
  const list = document.getElementById('tribe-builder-list');
  if (!list) return;
  const tribes = seasonConfig.tribes || [];
  if (!tribes.length) {
    list.innerHTML = '<div style="font-size:12px;color:var(--muted);margin-bottom:4px">No tribes yet. Add one to get started.</div>';
    return;
  }
  list.innerHTML = tribes.map((t, i) => `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <div style="width:22px;height:22px;border-radius:50%;background:${t.color};border:2px solid rgba(255,255,255,0.15);cursor:pointer;flex-shrink:0;position:relative" onclick="cycleTribeColor(${i})" title="Click to change color"></div>
      <input type="text" value="${t.name}" placeholder="Tribe name"
        oninput="updateTribeName(${i},this.value)"
        style="flex:1;background:var(--surface2,var(--surface));border:1px solid var(--border);border-radius:4px;color:var(--text);padding:4px 8px;font-size:13px">
      <button onclick="removeTribe(${i})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#ef4444;border-radius:4px;width:24px;height:24px;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
    </div>`).join('');
}

export function renderTribeSelect() {
  const sel = document.getElementById('f-tribe');
  if (!sel) return;
  const current = sel.value;
  // Configured tribes + any tribes already used by cast players (in case cast was built before tribe builder)
  const configuredNames = (seasonConfig.tribes || []).map(t => t.name);
  const castNames = [...new Set(players.map(p => p.tribe).filter(Boolean))];
  const extraNames = castNames.filter(n => !configuredNames.some(c => c.toLowerCase() === n.toLowerCase()));
  const allTribes = [
    ...(seasonConfig.tribes || []),
    ...extraNames.map(n => ({ name: n, color: tribeColor(n) }))
  ];
  if (!allTribes.length) {
    sel.innerHTML = '<option value="">— set up tribes in Season Setup —</option>';
  } else {
    sel.innerHTML = '<option value="">— pick tribe —</option>' +
      allTribes.map(t => `<option value="${t.name}"${t.name === current ? ' selected' : ''}>${t.name}</option>`).join('');
  }
}

export function addTribe() {
  if (!seasonConfig.tribes) seasonConfig.tribes = [];
  const usedColors = seasonConfig.tribes.map(t => t.color);
  const color = TRIBE_PALETTE.find(c => !usedColors.includes(c)) || TRIBE_PALETTE[seasonConfig.tribes.length % TRIBE_PALETTE.length];
  seasonConfig.tribes.push({ name: 'Tribe ' + (seasonConfig.tribes.length + 1), color });
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeBuilder(); renderTribeSelect();
}

export function removeTribe(i) {
  seasonConfig.tribes.splice(i, 1);
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeBuilder(); renderTribeSelect();
}

export function updateTribeName(i, val) {
  if (seasonConfig.tribes[i]) seasonConfig.tribes[i].name = val;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeSelect();
}

export function cycleTribeColor(i) {
  const t = seasonConfig.tribes[i]; if (!t) return;
  const idx = TRIBE_PALETTE.indexOf(t.color);
  t.color = TRIBE_PALETTE[(idx + 1) % TRIBE_PALETTE.length];
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  renderTribeBuilder(); renderTribeSelect();
}

// ── Romance Compatibility ─────────────────────────────────────────────

// Pronoun helper — returns {sub, obj, pos, posAdj, ref, Sub, Obj, PosAdj} for a player
// Capitalised versions

// ══════════════════════════════════════════════════════════════════════
// CAST CRUD
// ══════════════════════════════════════════════════════════════════════

export function submitPlayer() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { alert('Enter a player name.'); return; }
  const sexuality = document.getElementById('f-sexuality')?.value || 'straight';
  const player = {
    id: editingId || Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    name, slug: document.getElementById('f-slug').value.trim() || name.toLowerCase().replace(/\s+/g,'-'),
    tribe: document.getElementById('f-tribe').value,
    gender: getGender(),
    sexuality: sexuality !== 'straight' ? sexuality : undefined,
    archetype: document.getElementById('f-archetype').value, stats: getStats(),
    isReturnee: document.getElementById('f-returnee')?.checked || false,
  };
  if (editingId) { const i = players.findIndex(p=>p.id===editingId); if(i!==-1) players[i]=player; cancelEdit(); }
  else { players.push(player); resetForm(); }
  saveCast(); renderCast();
}
export function editPlayer(id) {
  const p = players.find(p=>p.id===id); if (!p) return;
  editingId = id;
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-slug').value = p.slug||'';
  const tribeEl = document.getElementById('f-tribe'); if (tribeEl) tribeEl.value = p.tribe||'';
  setGender(p.gender || 'nb');
  const sexEl = document.getElementById('f-sexuality'); if (sexEl) sexEl.value = p.sexuality||'straight';
  document.getElementById('f-archetype').value = p.archetype||'';
  document.getElementById('archetype-desc').textContent = ARCHETYPES[p.archetype]?.desc||'';
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = p.isReturnee || false;
  putStats(p.stats);
  document.getElementById('form-title').textContent = 'Edit \u2014 '+p.name;
  document.getElementById('submit-btn').textContent = 'Update Player';
  document.getElementById('edit-actions').style.display = 'flex';
  renderCast(); document.querySelector('.form-panel').scrollTop = 0;
}
export function cancelEdit() {
  editingId = null; resetForm();
  document.getElementById('form-title').textContent = 'Add Player';
  document.getElementById('submit-btn').textContent = 'Add Player';
  document.getElementById('edit-actions').style.display = 'none';
  document.getElementById('archetype-desc').textContent = '';
  renderCast();
}
export function deleteCurrentEdit() {
  if (!editingId) return;
  const p = players.find(p=>p.id===editingId);
  if (!confirm('Remove '+(p?.name||'this player')+'?')) return;
  players = players.filter(p=>p.id!==editingId); saveCast(); cancelEdit();
}
export function resetForm() {
  ['f-name','f-slug'].forEach(id => document.getElementById(id).value='');
  const tEl = document.getElementById('f-tribe'); if (tEl) tEl.value='';
  const sEl = document.getElementById('f-sexuality'); if (sEl) sEl.value='straight';
  setGender('nb');
  document.getElementById('f-archetype').value='';
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = false;
  document.getElementById('archetype-desc').textContent='';
  STATS.forEach(s => setSlider(s.key, 5, false));
}
// ── Franchise Roster: fetched from JSON on load, embedded copy as fallback ──
export let FRANCHISE_ROSTER = [{"name":"Alejandro","slug":"alejandro","gender":"m","archetype":"schemer","stats":{"physical":8,"endurance":8,"mental":10,"social":10,"strategic":10,"loyalty":2,"boldness":9,"intuition":10,"temperament":4}},{"name":"Amy","slug":"amy","gender":"f","archetype":"villain","stats":{"physical":4,"endurance":6,"mental":6,"social":6,"strategic":8,"loyalty":2,"boldness":9,"intuition":6,"temperament":2}},{"name":"Anne Maria","slug":"anne-maria","gender":"f","archetype":"wildcard","stats":{"physical":6,"endurance":4,"mental":4,"social":4,"strategic":4,"loyalty":4,"boldness":7,"intuition":4,"temperament":4}},{"name":"Axel","slug":"axel","gender":"f","archetype":"hothead","stats":{"physical":9,"endurance":8,"mental":4,"social":5,"strategic":4,"loyalty":7,"boldness":6,"intuition":4,"temperament":3}},{"name":"B","slug":"b","gender":"m","archetype":"loyal-soldier","stats":{"physical":6,"endurance":6,"mental":8,"social":2,"strategic":2,"loyalty":10,"boldness":3,"intuition":5,"temperament":10}},{"name":"Beardo","slug":"beardo","gender":"m","archetype":"goat","stats":{"physical":6,"endurance":4,"mental":4,"social":2,"strategic":2,"loyalty":6,"boldness":4,"intuition":3,"temperament":8}},{"name":"Beth","slug":"beth","gender":"f","archetype":"goat","stats":{"physical":4,"endurance":6,"mental":6,"social":4,"strategic":4,"loyalty":6,"boldness":5,"intuition":5,"temperament":6}},{"name":"Blaineley","slug":"blaineley","gender":"f","archetype":"chaos-agent","stats":{"physical":4,"endurance":4,"mental":8,"social":10,"strategic":8,"loyalty":2,"boldness":8,"intuition":9,"temperament":4}},{"name":"Bowie","slug":"bowie","gender":"m","sexuality":"gay","archetype":"mastermind","stats":{"physical":6,"endurance":4,"mental":8,"social":10,"strategic":10,"loyalty":6,"boldness":7,"intuition":9,"temperament":6}},{"name":"Brick","slug":"brick","gender":"m","archetype":"hero","stats":{"physical":8,"endurance":10,"mental":4,"social":6,"strategic":2,"loyalty":10,"boldness":4,"intuition":5,"temperament":8}},{"name":"Bridgette","slug":"bridgette","gender":"f","archetype":"showmancer","stats":{"physical":8,"endurance":8,"mental":6,"social":8,"strategic":2,"loyalty":8,"boldness":4,"intuition":7,"temperament":8}},{"name":"Brightly","slug":"brightly","gender":"nb","archetype":"mastermind","stats":{"physical":4,"endurance":4,"mental":10,"social":6,"strategic":8,"loyalty":6,"boldness":6,"intuition":8,"temperament":6}},{"name":"Brody","slug":"brody","gender":"m","archetype":"social-butterfly","stats":{"physical":10,"endurance":8,"mental":2,"social":10,"strategic":2,"loyalty":10,"boldness":4,"intuition":6,"temperament":8}},{"name":"Caleb","slug":"caleb","gender":"m","archetype":"showmancer","stats":{"physical":10,"endurance":8,"mental":6,"social":8,"strategic":6,"loyalty":6,"boldness":7,"intuition":7,"temperament":6}},{"name":"Cameron","slug":"cameron","gender":"m","archetype":"mastermind","stats":{"physical":2,"endurance":4,"mental":10,"social":4,"strategic":8,"loyalty":8,"boldness":5,"intuition":7,"temperament":8}},{"name":"Carrie","slug":"carrie","gender":"f","archetype":"showmancer","stats":{"physical":4,"endurance":6,"mental":6,"social":10,"strategic":6,"loyalty":8,"boldness":4,"intuition":8,"temperament":8}},{"name":"Chase","slug":"chase","gender":"m","archetype":"floater","stats":{"physical":4,"endurance":4,"mental":4,"social":8,"strategic":2,"loyalty":4,"boldness":5,"intuition":6,"temperament":8}},{"name":"Chef Hatchet","slug":"chef-hatchet","gender":"m","archetype":"hothead","stats":{"physical":10,"endurance":10,"mental":4,"social":2,"strategic":4,"loyalty":8,"boldness":8,"intuition":4,"temperament":2}},{"name":"Chet","slug":"chet","gender":"m","archetype":"loyal-soldier","stats":{"physical":8,"endurance":6,"mental":4,"social":4,"strategic":2,"loyalty":8,"boldness":5,"intuition":4,"temperament":4}},{"name":"Chris McLean","slug":"chris-mclean","gender":"m","archetype":"chaos-agent","stats":{"physical":6,"endurance":6,"mental":8,"social":10,"strategic":10,"loyalty":2,"boldness":10,"intuition":8,"temperament":2}},{"name":"Cody","slug":"cody","gender":"m","archetype":"perceptive-player","stats":{"physical":2,"endurance":4,"mental":10,"social":8,"strategic":4,"loyalty":8,"boldness":4,"intuition":9,"temperament":8}},{"name":"Courtney","slug":"courtney","gender":"f","archetype":"hothead","stats":{"physical":6,"endurance":4,"mental":8,"social":6,"strategic":8,"loyalty":4,"boldness":8,"intuition":7,"temperament":2}},{"name":"Crimson","slug":"crimson","gender":"f","sexuality":"bi","archetype":"loyal-soldier","stats":{"physical":4,"endurance":6,"mental":6,"social":2,"strategic":4,"loyalty":10,"boldness":3,"intuition":4,"temperament":8}},{"name":"Dakota","slug":"dakota","gender":"f","archetype":"social-butterfly","stats":{"physical":4,"endurance":4,"mental":4,"social":8,"strategic":4,"loyalty":6,"boldness":5,"intuition":6,"temperament":6}},{"name":"Damien","slug":"damien","gender":"m","archetype":"underdog","stats":{"physical":2,"endurance":4,"mental":10,"social":6,"strategic":6,"loyalty":8,"boldness":4,"intuition":8,"temperament":8}},{"name":"Dave","slug":"dave","gender":"m","archetype":"floater","stats":{"physical":6,"endurance":4,"mental":8,"social":4,"strategic":4,"loyalty":8,"boldness":6,"intuition":6,"temperament":4}},{"name":"Dawn","slug":"dawn","gender":"f","archetype":"loyal-soldier","stats":{"physical":4,"endurance":4,"mental":8,"social":2,"strategic":2,"loyalty":10,"boldness":2,"intuition":5,"temperament":10}},{"name":"Devin","slug":"devin","gender":"m","archetype":"showmancer","stats":{"physical":6,"endurance":6,"mental":4,"social":8,"strategic":4,"loyalty":10,"boldness":4,"intuition":6,"temperament":8}},{"name":"DJ","slug":"dj","gender":"m","archetype":"hero","stats":{"physical":8,"endurance":4,"mental":6,"social":10,"strategic":2,"loyalty":10,"boldness":3,"intuition":8,"temperament":10}},{"name":"Duncan","slug":"duncan","gender":"m","archetype":"chaos-agent","stats":{"physical":8,"endurance":8,"mental":6,"social":6,"strategic":8,"loyalty":4,"boldness":8,"intuition":6,"temperament":4}},{"name":"Dwayne","slug":"dwayne","gender":"m","archetype":"perceptive-player","stats":{"physical":4,"endurance":8,"mental":6,"social":10,"strategic":2,"loyalty":10,"boldness":2,"intuition":8,"temperament":10}},{"name":"Ella","slug":"ella","gender":"f","archetype":"showmancer","stats":{"physical":4,"endurance":6,"mental":4,"social":8,"strategic":4,"loyalty":10,"boldness":3,"intuition":6,"temperament":10}},{"name":"Ellody","slug":"ellody","gender":"f","archetype":"mastermind","stats":{"physical":4,"endurance":4,"mental":10,"social":6,"strategic":10,"loyalty":6,"boldness":7,"intuition":8,"temperament":6}},{"name":"Emma","slug":"emma","gender":"f","archetype":"social-butterfly","stats":{"physical":8,"endurance":8,"mental":4,"social":8,"strategic":6,"loyalty":8,"boldness":6,"intuition":6,"temperament":4}},{"name":"Emmah","slug":"emmah","gender":"f","archetype":"hothead","stats":{"physical":6,"endurance":6,"mental":6,"social":6,"strategic":8,"loyalty":6,"boldness":8,"intuition":6,"temperament":2}},{"name":"Ennui","slug":"ennui","gender":"m","archetype":"loyal-soldier","stats":{"physical":6,"endurance":6,"mental":6,"social":2,"strategic":4,"loyalty":8,"boldness":4,"intuition":4,"temperament":10}},{"name":"Eva","slug":"eva","gender":"f","archetype":"hothead","stats":{"physical":10,"endurance":10,"mental":4,"social":2,"strategic":2,"loyalty":4,"boldness":7,"intuition":3,"temperament":2}},{"name":"Ezekiel","slug":"ezekiel","gender":"m","archetype":"loyal-soldier","stats":{"physical":2,"endurance":4,"mental":2,"social":4,"strategic":6,"loyalty":6,"boldness":5,"intuition":3,"temperament":6}},{"name":"Geoff","slug":"geoff","gender":"m","archetype":"showmancer","stats":{"physical":8,"endurance":6,"mental":4,"social":10,"strategic":2,"loyalty":8,"boldness":4,"intuition":7,"temperament":10}},{"name":"Gerry","slug":"gerry","gender":"m","archetype":"floater","stats":{"physical":4,"endurance":2,"mental":6,"social":6,"strategic":6,"loyalty":6,"boldness":6,"intuition":6,"temperament":4}},{"name":"Gwen","slug":"gwen","gender":"f","sexuality":"bi","archetype":"floater","stats":{"physical":6,"endurance":6,"mental":8,"social":6,"strategic":6,"loyalty":8,"boldness":6,"intuition":7,"temperament":4}},{"name":"Harold","slug":"harold","gender":"m","archetype":"floater","stats":{"physical":4,"endurance":4,"mental":10,"social":4,"strategic":6,"loyalty":6,"boldness":6,"intuition":7,"temperament":6}},{"name":"Heather","slug":"heather","gender":"f","archetype":"villain","stats":{"physical":6,"endurance":6,"mental":8,"social":6,"strategic":10,"loyalty":2,"boldness":9,"intuition":7,"temperament":2}},{"name":"Hicks","slug":"hicks","gender":"m","archetype":"perceptive-player","stats":{"physical":5,"endurance":5,"mental":7,"social":8,"strategic":6,"loyalty":7,"boldness":4,"intuition":9,"temperament":7},"isReturnee":false},{"name":"Izzy","slug":"izzy","gender":"f","archetype":"wildcard","stats":{"physical":8,"endurance":10,"mental":2,"social":4,"strategic":2,"loyalty":4,"boldness":6,"intuition":3,"temperament":6}},{"name":"Jacques","slug":"jacques","gender":"m","sexuality":"gay","archetype":"schemer","stats":{"physical":8,"endurance":8,"mental":6,"social":8,"strategic":10,"loyalty":2,"boldness":9,"intuition":7,"temperament":4}},{"name":"Jasmine","slug":"jasmine","gender":"f","archetype":"perceptive-player","stats":{"physical":8,"endurance":10,"mental":8,"social":8,"strategic":4,"loyalty":8,"boldness":5,"intuition":8,"temperament":8}},{"name":"Jay","slug":"jay","gender":"m","archetype":"loyal-soldier","stats":{"physical":4,"endurance":4,"mental":6,"social":6,"strategic":4,"loyalty":10,"boldness":3,"intuition":6,"temperament":8}},{"name":"Jen","slug":"jen","gender":"f","archetype":"social-butterfly","stats":{"physical":4,"endurance":6,"mental":6,"social":8,"strategic":4,"loyalty":8,"boldness":4,"intuition":7,"temperament":8}},{"name":"Jo","slug":"jo","gender":"f","archetype":"villain","stats":{"physical":10,"endurance":10,"mental":6,"social":4,"strategic":8,"loyalty":2,"boldness":10,"intuition":5,"temperament":2}},{"name":"Josee","slug":"josee","gender":"f","archetype":"hothead","stats":{"physical":8,"endurance":8,"mental":6,"social":4,"strategic":6,"loyalty":4,"boldness":8,"intuition":5,"temperament":2}},{"name":"Julia","slug":"julia","gender":"f","archetype":"schemer","stats":{"physical":6,"endurance":8,"mental":6,"social":6,"strategic":10,"loyalty":2,"boldness":9,"intuition":6,"temperament":4}},{"name":"Junior","slug":"junior","gender":"m","archetype":"loyal-soldier","stats":{"physical":4,"endurance":4,"mental":6,"social":6,"strategic":4,"loyalty":8,"boldness":5,"intuition":6,"temperament":6}},{"name":"Justin","slug":"justin","gender":"m","archetype":"chaos-agent","stats":{"physical":6,"endurance":4,"mental":4,"social":10,"strategic":8,"loyalty":2,"boldness":8,"intuition":7,"temperament":4}},{"name":"Katie","slug":"katie","gender":"f","archetype":"loyal-soldier","stats":{"physical":4,"endurance":4,"mental":4,"social":6,"strategic":2,"loyalty":10,"boldness":3,"intuition":5,"temperament":8}},{"name":"Kelly","slug":"kelly","gender":"f","archetype":"schemer","stats":{"physical":4,"endurance":4,"mental":6,"social":8,"strategic":10,"loyalty":2,"boldness":8,"intuition":7,"temperament":4}},{"name":"Kitty","slug":"kitty","gender":"f","archetype":"perceptive-player","stats":{"physical":6,"endurance":6,"mental":8,"social":10,"strategic":6,"loyalty":8,"boldness":5,"intuition":9,"temperament":8}},{"name":"Laurie","slug":"laurie","gender":"f","archetype":"chaos-agent","stats":{"physical":4,"endurance":6,"mental":8,"social":6,"strategic":6,"loyalty":4,"boldness":7,"intuition":7,"temperament":4}},{"name":"Leonard","slug":"leonard","gender":"m","archetype":"goat","stats":{"physical":2,"endurance":2,"mental":4,"social":4,"strategic":2,"loyalty":4,"boldness":5,"intuition":4,"temperament":6}},{"name":"Leshawna","slug":"leshawna","gender":"f","archetype":"social-butterfly","stats":{"physical":8,"endurance":8,"mental":6,"social":8,"strategic":6,"loyalty":8,"boldness":6,"intuition":7,"temperament":4}},{"name":"Lightning","slug":"lightning","gender":"m","archetype":"wildcard","stats":{"physical":10,"endurance":8,"mental":2,"social":4,"strategic":4,"loyalty":2,"boldness":8,"intuition":3,"temperament":4}},{"name":"Lindsay","slug":"lindsay","gender":"f","archetype":"social-butterfly","stats":{"physical":4,"endurance":6,"mental":2,"social":8,"strategic":2,"loyalty":8,"boldness":4,"intuition":5,"temperament":8}},{"name":"Lorenzo","slug":"lorenzo","gender":"m","archetype":"hothead","stats":{"physical":6,"endurance":6,"mental":4,"social":6,"strategic":4,"loyalty":4,"boldness":7,"intuition":5,"temperament":2}},{"name":"MacArthur","slug":"macarthur","gender":"f","sexuality":"lesbian","archetype":"challenge-beast","stats":{"physical":10,"endurance":8,"mental":4,"social":6,"strategic":6,"loyalty":6,"boldness":7,"intuition":5,"temperament":4}},{"name":"Mary","slug":"mary","gender":"f","archetype":"mastermind","stats":{"physical":4,"endurance":4,"mental":10,"social":6,"strategic":8,"loyalty":8,"boldness":4,"intuition":8,"temperament":10}},{"name":"Max","slug":"max","gender":"m","archetype":"chaos-agent","stats":{"physical":4,"endurance":4,"mental":4,"social":4,"strategic":2,"loyalty":2,"boldness":6,"intuition":4,"temperament":4}},{"name":"Mickey","slug":"mickey","gender":"m","archetype":"mastermind","stats":{"physical":4,"endurance":4,"mental":10,"social":6,"strategic":8,"loyalty":10,"boldness":5,"intuition":8,"temperament":6}},{"name":"Mike","slug":"mike","gender":"m","archetype":"showmancer","stats":{"physical":6,"endurance":6,"mental":6,"social":8,"strategic":4,"loyalty":8,"boldness":5,"intuition":7,"temperament":6}},{"name":"Miles","slug":"miles","gender":"f","archetype":"loyal-soldier","stats":{"physical":4,"endurance":8,"mental":6,"social":6,"strategic":4,"loyalty":8,"boldness":3,"intuition":6,"temperament":10}},{"name":"Millie","slug":"millie","gender":"f","archetype":"underdog","stats":{"physical":4,"endurance":2,"mental":10,"social":4,"strategic":6,"loyalty":8,"boldness":5,"intuition":7,"temperament":6}},{"name":"MK","slug":"mk","gender":"f","sexuality":"queer","archetype":"schemer","stats":{"physical":4,"endurance":4,"mental":8,"social":4,"strategic":10,"loyalty":2,"boldness":7,"intuition":6,"temperament":8}},{"name":"Nichelle","slug":"nichelle","gender":"f","archetype":"social-butterfly","stats":{"physical":4,"endurance":4,"mental":6,"social":8,"strategic":2,"loyalty":6,"boldness":5,"intuition":7,"temperament":4}},{"name":"Noah","slug":"noah","gender":"m","archetype":"floater","stats":{"physical":2,"endurance":4,"mental":10,"social":4,"strategic":6,"loyalty":6,"boldness":6,"intuition":7,"temperament":4}},{"name":"Owen","slug":"owen","gender":"m","sexuality":"bi","archetype":"social-butterfly","stats":{"physical":8,"endurance":4,"mental":2,"social":10,"strategic":2,"loyalty":10,"boldness":3,"intuition":6,"temperament":10}},{"name":"Pete","slug":"pete","gender":"m","archetype":"loyal-soldier","stats":{"physical":6,"endurance":6,"mental":6,"social":4,"strategic":8,"loyalty":6,"boldness":7,"intuition":5,"temperament":4}},{"name":"Priya","slug":"priya","gender":"f","archetype":"hero","stats":{"physical":10,"endurance":8,"mental":10,"social":6,"strategic":8,"loyalty":6,"boldness":7,"intuition":8,"temperament":6}},{"name":"Raj","slug":"raj","gender":"m","sexuality":"gay","archetype":"loyal-soldier","stats":{"physical":8,"endurance":8,"mental":2,"social":6,"strategic":2,"loyalty":10,"boldness":3,"intuition":4,"temperament":10}},{"name":"Ripper","slug":"ripper","gender":"m","archetype":"chaos-agent","stats":{"physical":8,"endurance":6,"mental":2,"social":4,"strategic":4,"loyalty":4,"boldness":6,"intuition":3,"temperament":6}},{"name":"Rock","slug":"rock","gender":"m","archetype":"social-butterfly","stats":{"physical":6,"endurance":6,"mental":4,"social":8,"strategic":4,"loyalty":8,"boldness":5,"intuition":6,"temperament":6}},{"name":"Rodney","slug":"rodney","gender":"m","archetype":"challenge-beast","stats":{"physical":8,"endurance":8,"mental":2,"social":4,"strategic":2,"loyalty":8,"boldness":4,"intuition":3,"temperament":8}},{"name":"Ryan","slug":"ryan","gender":"m","archetype":"challenge-beast","stats":{"physical":10,"endurance":8,"mental":4,"social":6,"strategic":4,"loyalty":8,"boldness":5,"intuition":5,"temperament":8}},{"name":"Sadie","slug":"sadie","gender":"f","archetype":"loyal-soldier","stats":{"physical":4,"endurance":4,"mental":4,"social":6,"strategic":2,"loyalty":10,"boldness":2,"intuition":5,"temperament":10}},{"name":"Sam","slug":"sam","gender":"m","archetype":"floater","stats":{"physical":4,"endurance":2,"mental":8,"social":6,"strategic":2,"loyalty":10,"boldness":2,"intuition":7,"temperament":10}},{"name":"Samey","slug":"samey","gender":"f","archetype":"hero","stats":{"physical":4,"endurance":6,"mental":6,"social":6,"strategic":4,"loyalty":10,"boldness":3,"intuition":6,"temperament":8}},{"name":"Sanders","slug":"sanders","gender":"f","sexuality":"lesbian","archetype":"hero","stats":{"physical":8,"endurance":10,"mental":8,"social":6,"strategic":6,"loyalty":10,"boldness":4,"intuition":7,"temperament":10}},{"name":"Scarlett","slug":"scarlett","gender":"f","archetype":"schemer","stats":{"physical":4,"endurance":6,"mental":10,"social":6,"strategic":10,"loyalty":2,"boldness":9,"intuition":8,"temperament":2}},{"name":"Scary Girl","slug":"scary-girl","gender":"f","archetype":"wildcard","stats":{"physical":8,"endurance":8,"mental":4,"social":2,"strategic":2,"loyalty":4,"boldness":7,"intuition":3,"temperament":2}},{"name":"Scott","slug":"scott","gender":"m","archetype":"villain","stats":{"physical":6,"endurance":8,"mental":8,"social":4,"strategic":10,"loyalty":2,"boldness":9,"intuition":6,"temperament":4}},{"name":"Shawn","slug":"shawn","gender":"m","archetype":"hero","stats":{"physical":8,"endurance":10,"mental":6,"social":4,"strategic":4,"loyalty":6,"boldness":6,"intuition":5,"temperament":4}},{"name":"Sierra","slug":"sierra","gender":"f","archetype":"loyal-soldier","stats":{"physical":6,"endurance":8,"mental":6,"social":4,"strategic":6,"loyalty":10,"boldness":5,"intuition":5,"temperament":4}},{"name":"Sky","slug":"sky","gender":"f","archetype":"challenge-beast","stats":{"physical":10,"endurance":10,"mental":8,"social":6,"strategic":6,"loyalty":6,"boldness":6,"intuition":7,"temperament":8}},{"name":"Spud","slug":"spud","gender":"m","archetype":"social-butterfly","stats":{"physical":4,"endurance":4,"mental":2,"social":8,"strategic":2,"loyalty":8,"boldness":3,"intuition":5,"temperament":10}},{"name":"Staci","slug":"staci","gender":"f","archetype":"loyal-soldier","stats":{"physical":2,"endurance":2,"mental":2,"social":2,"strategic":2,"loyalty":8,"boldness":3,"intuition":2,"temperament":10}},{"name":"Stephanie","slug":"stephanie","gender":"f","archetype":"hothead","stats":{"physical":8,"endurance":8,"mental":6,"social":6,"strategic":6,"loyalty":4,"boldness":8,"intuition":6,"temperament":2}},{"name":"Sugar","slug":"sugar","gender":"f","archetype":"villain","stats":{"physical":6,"endurance":8,"mental":4,"social":6,"strategic":8,"loyalty":2,"boldness":9,"intuition":5,"temperament":2}},{"name":"Tammy","slug":"tammy","gender":"f","archetype":"loyal-soldier","stats":{"physical":4,"endurance":4,"mental":4,"social":4,"strategic":2,"loyalty":8,"boldness":4,"intuition":4,"temperament":8}},{"name":"Taylor","slug":"taylor","gender":"f","archetype":"villain","stats":{"physical":4,"endurance":4,"mental":6,"social":10,"strategic":8,"loyalty":2,"boldness":9,"intuition":8,"temperament":2}},{"name":"Tom","slug":"tom","gender":"m","sexuality":"gay","archetype":"social-butterfly","stats":{"physical":8,"endurance":8,"mental":4,"social":8,"strategic":4,"loyalty":10,"boldness":3,"intuition":6,"temperament":10}},{"name":"Topher","slug":"topher","gender":"m","archetype":"chaos-agent","stats":{"physical":4,"endurance":6,"mental":6,"social":8,"strategic":6,"loyalty":2,"boldness":8,"intuition":7,"temperament":4}},{"name":"Trent","slug":"trent","gender":"m","archetype":"showmancer","stats":{"physical":6,"endurance":6,"mental":6,"social":8,"strategic":4,"loyalty":8,"boldness":4,"intuition":7,"temperament":8}},{"name":"Tyler","slug":"tyler","gender":"m","archetype":"loyal-soldier","stats":{"physical":8,"endurance":6,"mental":2,"social":6,"strategic":2,"loyalty":8,"boldness":4,"intuition":4,"temperament":10}},{"name":"Wayne","slug":"wayne","gender":"m","archetype":"hero","stats":{"physical":8,"endurance":8,"mental":2,"social":8,"strategic":2,"loyalty":10,"boldness":3,"intuition":5,"temperament":10}},{"name":"Zee","slug":"zee","gender":"m","archetype":"social-butterfly","stats":{"physical":6,"endurance":8,"mental":6,"social":8,"strategic":2,"loyalty":8,"boldness":3,"intuition":7,"temperament":10}},{"name":"Zoey","slug":"zoey","gender":"f","archetype":"showmancer","stats":{"physical":8,"endurance":8,"mental":8,"social":10,"strategic":6,"loyalty":10,"boldness":4,"intuition":9,"temperament":8}}];

export function setFRANCHISE_ROSTER(v) { FRANCHISE_ROSTER = v; }

// ── Franchise Roster Search ───────────────────────────────────────────
export let rosterHighlight = -1;

export function filterRoster(query) {
  const dd = document.getElementById('roster-dropdown');
  if (!query.trim()) { dd.style.display = 'none'; return; }
  const roster = FRANCHISE_ROSTER;
  const q = query.toLowerCase();
  const matches = roster.filter(p => p.name.toLowerCase().includes(q)).slice(0, 12);
  rosterHighlight = -1;
  if (!matches.length) { dd.style.display = 'none'; return; }
  dd.innerHTML = matches.map((p, i) =>
    `<div class="roster-item" data-i="${i}" onmousedown="fillFromRoster(${JSON.stringify(p).replace(/"/g,'&quot;')})"
      style="padding:7px 10px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <span>${p.name}</span>
      <span style="font-size:10px;color:var(--muted)">${p.archetype||''}</span>
    </div>`
  ).join('');
  dd.style.display = 'block';
}

export function rosterKeyNav(e) {
  const dd = document.getElementById('roster-dropdown');
  const items = dd.querySelectorAll('.roster-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') { rosterHighlight = Math.min(rosterHighlight + 1, items.length - 1); highlightRosterItem(items); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { rosterHighlight = Math.max(rosterHighlight - 1, 0); highlightRosterItem(items); e.preventDefault(); }
  else if (e.key === 'Enter' && rosterHighlight >= 0) { items[rosterHighlight].dispatchEvent(new Event('mousedown')); e.preventDefault(); }
  else if (e.key === 'Escape') { dd.style.display = 'none'; }
}

export function highlightRosterItem(items) {
  items.forEach((el, i) => el.style.background = i === rosterHighlight ? 'var(--accent-dim, rgba(99,102,241,.15))' : '');
}

export function fillFromRoster(p) {
  document.getElementById('roster-search').value = '';
  document.getElementById('roster-dropdown').style.display = 'none';
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-slug').value = p.slug || p.name.toLowerCase().replace(/\s+/g, '-');
  setGender(p.gender || 'nb');
  const sexEl = document.getElementById('f-sexuality'); if (sexEl) sexEl.value = p.sexuality || 'straight';
  document.getElementById('f-archetype').value = p.archetype || '';
  document.getElementById('archetype-desc').textContent = ARCHETYPES[p.archetype]?.desc || '';
  if (p.stats) putStats(p.stats);
  // Always default to non-returnee when adding from roster — set per-season in cast builder
  const retEl = document.getElementById('f-returnee'); if (retEl) retEl.checked = false;
}

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('#roster-search') && !e.target.closest('#roster-dropdown'))
    document.getElementById('roster-dropdown').style.display = 'none';
});

export function saveCast() { localStorage.setItem('simulator_cast', JSON.stringify(players)); }
export function clearCast() { if(!confirm('Clear all players?')) return; players=[]; saveCast(); cancelEdit(); renderCast(); }
export function loadS10Preset() {
  if (players.length>0 && !confirm('Replace cast with S10 Champions vs Contenders?')) return;
  const rosterMap = Object.fromEntries(FRANCHISE_ROSTER.map(p => [p.name, p]));
  players = S10_TRIBES.map((t,i) => {
    const r = rosterMap[t.name];
    if (!r) { console.warn('S10 preset: missing roster entry for', t.name); return null; }
    return { ...r, tribe: t.tribe, id: 's10-'+i, isReturnee: true };
  }).filter(Boolean);
  seasonConfig.tribes = [{ name:'Champions', color:'#f59e0b' }, { name:'Contenders', color:'#ef4444' }];
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  saveCast(); cancelEdit(); renderCast(); renderTribeBuilder(); renderTribeSelect(); renderConfig();
}
export function loadS9Preset() {
  if (players.length>0 && !confirm('Replace cast with S9 Land of Powers (18 newbies)?')) return;
  const rosterMap = Object.fromEntries(FRANCHISE_ROSTER.map(p => [p.name, p]));
  players = S9_TRIBES.map((t,i) => {
    const r = rosterMap[t.name];
    if (!r) { console.warn('S9 preset: missing roster entry for', t.name); return null; }
    return { ...r, tribe: t.tribe, id: 's9-'+i, isReturnee: false };
  }).filter(Boolean);
  seasonConfig.tribes = [{ name:'Yellow', color:'#f59e0b' }, { name:'Red', color:'#ef4444' }, { name:'Blue', color:'#3b82f6' }];
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  saveCast(); cancelEdit(); renderCast(); renderTribeBuilder(); renderTribeSelect(); renderConfig();
}
export function exportCast() {
  const blob = new Blob([JSON.stringify(players,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='simulator-cast.json'; a.click();
}
export function importCast(event) {
  const file = event.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => { try { const raw=JSON.parse(e.target.result); const data=Array.isArray(raw) ? raw : (raw.players && Array.isArray(raw.players)) ? raw.players : null; if(!data) throw new Error(); players=data; saveCast(); renderCast(); renderTribeBuilder(); renderTribeSelect(); } catch { alert('Invalid JSON file.'); } };
  reader.readAsText(file); event.target.value='';
}

// ── Franchise Roster Management ──
export function exportRoster() {
  const blob = new Blob([JSON.stringify({ players: FRANCHISE_ROSTER }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'franchise_roster.json'; a.click();
}
export function importRoster(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const raw = JSON.parse(e.target.result);
      const data = Array.isArray(raw) ? raw : (raw.players && Array.isArray(raw.players)) ? raw.players : null;
      if (!data || !data.length) throw new Error();
      FRANCHISE_ROSTER = data;
      try { localStorage.setItem('simulator_franchise_roster', JSON.stringify(data)); } catch(err) {}
      alert(`Roster imported: ${data.length} players.`);
    } catch { alert('Invalid JSON file. Expected { "players": [...] } or a bare array.'); }
  };
  reader.readAsText(file); event.target.value = '';
}
export function syncCastToRoster() {
  if (!players.length) { alert('No cast to sync.'); return; }
  let updated = 0;
  players.forEach(p => {
    const ri = FRANCHISE_ROSTER.findIndex(r => r.name === p.name || r.slug === p.slug);
    if (ri !== -1) {
      FRANCHISE_ROSTER[ri] = { ...FRANCHISE_ROSTER[ri], archetype: p.archetype, stats: { ...p.stats }, gender: p.gender };
      if (p.sexuality) FRANCHISE_ROSTER[ri].sexuality = p.sexuality;
      if (p.isReturnee !== undefined) FRANCHISE_ROSTER[ri].isReturnee = p.isReturnee;
      updated++;
    } else {
      FRANCHISE_ROSTER.push({ name: p.name, slug: p.slug, gender: p.gender, archetype: p.archetype, stats: { ...p.stats } });
      updated++;
    }
  });
  try { localStorage.setItem('simulator_franchise_roster', JSON.stringify(FRANCHISE_ROSTER)); } catch(err) {}
  alert(`Roster updated: ${updated} player${updated !== 1 ? 's' : ''} synced.`);
}

// ── Preset System: save/load full season setups ──
export function _buildPresetData() {
  return {
    version: 1,
    name: seasonConfig.name || 'Untitled',
    date: new Date().toISOString().slice(0, 10),
    config: { ...seasonConfig },
    players: players.map(p => ({ ...p })),
    relationships: relationships.map(r => ({ ...r })),
    preGameAlliances: (preGameAlliances || []).map(a => ({ ...a })),
  };
}
export function _applyPreset(data) {
  if (!data?.config || !data?.players) { alert('Invalid preset data.'); return; }
  seasonConfig = data.config;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  players = data.players;
  saveCast();
  relationships = data.relationships || [];
  localStorage.setItem('simulator_relationships', JSON.stringify(relationships));
  preGameAlliances = data.preGameAlliances || [];
  localStorage.setItem('simulator_pre_alliances', JSON.stringify(preGameAlliances));
  renderConfig(); renderCast(); renderTribeBuilder(); renderTribeSelect();
  if (typeof renderRelList === 'function') renderRelList();
  if (typeof renderAllianceList === 'function') renderAllianceList();
}

// A) Export full preset as JSON file
export function exportPreset() {
  const data = _buildPresetData();
  const name = (seasonConfig.name || 'preset').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `preset-${name}.json`; a.click();
}
export function importPreset(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm(`Load preset "${data.name || 'Untitled'}"? This will replace your current setup.`)) return;
      _applyPreset(data);
    } catch { alert('Invalid preset file.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

// B) Save/load presets to localStorage
export function _getPresets() {
  try { return JSON.parse(localStorage.getItem('simulator_presets') || '[]'); } catch { return []; }
}
export function _savePresets(list) {
  localStorage.setItem('simulator_presets', JSON.stringify(list));
  renderPresetList();
}
export function savePreset() {
  const name = prompt('Preset name:', seasonConfig.name || 'My Season');
  if (!name) return;
  const presets = _getPresets();
  const existing = presets.findIndex(p => p.name === name);
  const data = _buildPresetData();
  data.name = name;
  if (existing >= 0) {
    if (!confirm(`Overwrite existing preset "${name}"?`)) return;
    presets[existing] = data;
  } else {
    presets.push(data);
  }
  _savePresets(presets);
  alert(`Preset "${name}" saved.`);
}
export function loadPreset(name) {
  if (!name) { document.getElementById('preset-delete-row').style.display = 'none'; return; }
  const presets = _getPresets();
  const data = presets.find(p => p.name === name);
  if (!data) { alert('Preset not found.'); return; }
  if (!confirm(`Load preset "${name}"? This will replace your current setup.`)) {
    document.getElementById('preset-list').value = '';
    return;
  }
  _applyPreset(data);
  document.getElementById('preset-list').value = '';
  document.getElementById('preset-delete-row').style.display = 'none';
}
export function deletePreset() {
  const sel = document.getElementById('preset-list');
  const name = sel.value;
  if (!name) return;
  if (!confirm(`Delete preset "${name}"?`)) return;
  const presets = _getPresets().filter(p => p.name !== name);
  _savePresets(presets);
  sel.value = '';
  document.getElementById('preset-delete-row').style.display = 'none';
}
export function renderPresetList() {
  const sel = document.getElementById('preset-list');
  if (!sel) return;
  const presets = _getPresets();
  sel.innerHTML = '<option value="">— Load saved preset —</option>' +
    presets.map(p => `<option value="${p.name}">${p.name} (${p.date || '?'})</option>`).join('');
  // Show load/delete buttons when a preset is selected — don't auto-load
  sel.onchange = function() {
    document.getElementById('preset-delete-row').style.display = this.value ? 'block' : 'none';
  };
}

// ── Season Save/Load: saves completed seasons (full gs + config + cast) ──
export function _buildSeasonSaveData() {
  prepGsForSave(gs);
  return {
    version: 1,
    type: 'season-save',
    name: seasonConfig.name || 'Untitled Season',
    date: new Date().toISOString().slice(0, 10),
    episode: gs.episode || 0,
    config: { ...seasonConfig },
    players: players.map(p => ({ ...p })),
    relationships: relationships.map(r => ({ ...r })),
    preGameAlliances: (preGameAlliances || []).map(a => ({ ...a })),
    gs: JSON.parse(JSON.stringify(gs)), // deep clone
  };
}
export function _applySeasonSave(data) {
  if (!data?.gs || !data?.config) { alert('Invalid season save.'); return; }
  seasonConfig = data.config;
  // Fire-making override on season load
  if (seasonConfig.firemaking && seasonConfig.finaleSize < 4) seasonConfig.finaleSize = 4;
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  players = data.players || [];
  saveCast();
  relationships = data.relationships || [];
  localStorage.setItem('simulator_relationships', JSON.stringify(relationships));
  preGameAlliances = data.preGameAlliances || [];
  localStorage.setItem('simulator_pre_alliances', JSON.stringify(preGameAlliances));
  gs = data.gs;
  repairGsSets(gs);
  saveGameState();
  renderConfig(); renderCast(); renderTribeBuilder(); renderTribeSelect();
  if (typeof renderRelList === 'function') renderRelList();
  if (typeof renderAllianceList === 'function') renderAllianceList();
  // Fully refresh the Run tab — show content, render episode history, show last episode
  if (typeof renderRunTab === 'function') renderRunTab();
  if (typeof renderEpisodeHistory === 'function') renderEpisodeHistory();
  if (typeof renderTimeline === 'function') renderTimeline();
  // Show the last episode's result
  if (gs.episodeHistory?.length) {
    const lastEp = gs.episodeHistory[gs.episodeHistory.length - 1];
    if (typeof renderEpisodeView === 'function') renderEpisodeView(lastEp);
  }
}

// Export season as JSON file
export function exportSeason() {
  if (!gs?.initialized) { alert('No season to export. Initialize first.'); return; }
  const data = _buildSeasonSaveData();
  const name = (seasonConfig.name || 'season').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase();
  const ep = gs.episode || 0;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `season-${name}-ep${ep}.json`; a.click();
}
export function importSeason(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.type !== 'season-save') { alert('This is not a season save file.'); return; }
      if (!confirm(`Load season "${data.name}" (Episode ${data.episode || 0})? This replaces everything.`)) return;
      _applySeasonSave(data);
    } catch { alert('Invalid season file.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

// Save/load seasons to localStorage
export function _getSeasonSaves() {
  try { return JSON.parse(localStorage.getItem('simulator_season_saves') || '[]'); } catch { return []; }
}
export function _saveSeasonSaves(list) {
  localStorage.setItem('simulator_season_saves', JSON.stringify(list));
  renderSeasonSaveList();
}
export function saveSeasonToStorage() {
  if (!gs?.initialized) { alert('No season to save. Initialize first.'); return; }
  const defaultName = (seasonConfig.name || 'Season') + ' (Ep ' + (gs.episode || 0) + ')';
  const name = prompt('Save name:', defaultName);
  if (!name) return;
  const saves = _getSeasonSaves();
  const existing = saves.findIndex(s => s.name === name);
  const data = _buildSeasonSaveData();
  data.name = name;
  if (existing >= 0) {
    if (!confirm(`Overwrite "${name}"?`)) return;
    saves[existing] = data;
  } else {
    saves.push(data);
  }
  try {
    _saveSeasonSaves(saves);
    alert(`Season "${name}" saved.`);
  } catch (e) {
    // localStorage might be full — offer export instead
    alert('localStorage full. Use "Export Season" to save as a file instead.');
  }
}
export function loadSeasonFromStorage(name) {
  if (!name) { document.getElementById('season-delete-row').style.display = 'none'; return; }
  const saves = _getSeasonSaves();
  const data = saves.find(s => s.name === name);
  if (!data) { alert('Save not found.'); return; }
  if (!confirm(`Load "${name}"? This replaces your current season.`)) {
    document.getElementById('season-save-list').value = '';
    return;
  }
  _applySeasonSave(data);
  document.getElementById('season-save-list').value = '';
  document.getElementById('season-delete-row').style.display = 'none';
}
export function deleteSeasonSave() {
  const sel = document.getElementById('season-save-list');
  const name = sel.value;
  if (!name) return;
  if (!confirm(`Delete "${name}"?`)) return;
  const saves = _getSeasonSaves().filter(s => s.name !== name);
  _saveSeasonSaves(saves);
  sel.value = '';
  document.getElementById('season-delete-row').style.display = 'none';
}
export function renderSeasonSaveList() {
  const sel = document.getElementById('season-save-list');
  if (!sel) return;
  const saves = _getSeasonSaves();
  sel.innerHTML = '<option value="">— Load saved season —</option>' +
    saves.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  sel.onchange = function() {
    // Just show load/delete buttons — don't auto-load
    document.getElementById('season-delete-row').style.display = this.value ? 'block' : 'none';
  };
}

// ══════════════════════════════════════════════════════════════════════
// CAST RENDER
// ══════════════════════════════════════════════════════════════════════

export function renderCast() {
  const grid = document.getElementById('cast-grid');
  if (!players.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128101;</div><p>No players yet. Add one or click <strong>S9 Cast</strong> / <strong>S10 Cast</strong>.</p></div>`;
    document.getElementById('cast-count').textContent='0';
    document.getElementById('cast-tribe-summary').textContent='';
    return;
  }
  const sorted = [...players].sort((a,b) => (a.tribe||'').localeCompare(b.tribe||'')||a.name.localeCompare(b.name));
  grid.innerHTML = sorted.map(renderCard).join('');
  document.getElementById('cast-count').textContent = players.length;
  const tribes={};
  players.forEach(p => { const t=p.tribe||'No Tribe'; tribes[t]=(tribes[t]||0)+1; });
  document.getElementById('cast-tribe-summary').textContent = '\u2014 '+Object.entries(tribes).map(([t,c])=>`${t} (${c})`).join(' \u00b7 ');
}
export function renderCard(p) {
  const ov=overall(p.stats), th=parseFloat(threat(p.stats)), tier=threatTier(th), tc=tribeColor(p.tribe);
  const ovPct=((ov-1)/9*100).toFixed(0), isEd=editingId===p.id;
  const avatar=`<img src="assets/avatars/${p.slug}.png" alt="${p.name}" onerror="this.remove()">`;
  const statBars=STATS.map(s=>`<div class="sbar-row"><span class="sbar-key" style="color:${s.color}">${s.label}</span><div class="bar-bg"><div class="bar-fill" style="width:${p.stats[s.key]/10*100}%;background:${s.color}"></div></div><span class="sbar-val">${p.stats[s.key]}</span></div>`).join('');
  return `<div class="player-card ${isEd?'editing':''}" id="card-${p.id}">
    <div class="card-tribe-bar" style="background:${tc}"></div>
    <div class="card-top">
      <div class="card-avatar">${p.name[0].toUpperCase()}${avatar}</div>
      <div class="card-info">
        <div class="card-name" title="${p.name}">${p.name}</div>
        <div class="card-badges">
          ${p.tribe?`<span class="tribe-badge" style="background:${tc}22;color:${tc}">${p.tribe}</span>`:''}
          <span class="archetype-tag">${ARCHETYPE_NAMES[p.archetype]||'Custom'}</span>
          ${p.isReturnee ? '<span class="archetype-tag" style="background:rgba(245,158,11,0.15);color:#f59e0b">Returning</span>' : ''}
        </div>
      </div>
    </div>
    <div class="overall-row"><span class="overall-label-sm">Overall</span><div class="bar-bg"><div class="bar-fill" style="width:${ovPct}%;background:linear-gradient(to right,#10b981,#3b82f6)"></div></div><span class="overall-val">${ov}</span></div>
    <div class="stat-bars">${statBars}</div>
    <div class="threat-row"><div class="threat-dot" style="background:${tier.color}"></div><span class="threat-text">Threat: ${tier.label} (${th})</span></div>
    <div class="card-actions"><button class="btn btn-secondary" onclick="editPlayer('${p.id}')">Edit</button></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════════════
// SEASON CONFIG
// ══════════════════════════════════════════════════════════════════════

export function buildAdvantageList() {
  // idol is handled by the Hidden Immunity Idol accordion above — only render other advantages here
  const advToList = ADVANTAGES.filter(a => a.key !== 'idol');
  document.getElementById('adv-list').innerHTML = advToList.map(a => {
    const hasSources = a.defaultSources && a.defaultSources.length > 0;
    const srcHtml = hasSources ? `<div id="adv-sources-${a.key}" class="adv-sources" style="display:${a.default>0?'flex':'none'};gap:4px;margin:2px 0 4px 24px;flex-wrap:wrap">
      ${Object.entries(ADV_SOURCE_LABELS).map(([src, lbl]) => `<label style="font-size:10px;color:var(--muted);display:flex;align-items:center;gap:2px;cursor:pointer;padding:1px 5px;border-radius:3px;border:1px solid var(--border);background:var(--surface2)">
        <input type="checkbox" id="adv-src-${a.key}-${src}" style="width:11px;height:11px" ${(a.defaultSources||[]).includes(src)?'checked':''} onchange="saveConfig()">
        <span>${lbl}</span>
      </label>`).join('')}
    </div>` : '';
    return `<div class="adv-row">
      <input type="checkbox" id="adv-${a.key}" class="adv-check" ${a.default>0?'checked':''} onchange="toggleAdv('${a.key}')">
      <span style="flex:1;font-size:13px;color:#e2e8f0;cursor:pointer" onclick="document.getElementById('adv-${a.key}').click()">${a.label}</span>
      <select id="adv-onceper-${a.key}" class="adv-onceper" style="font-size:10px;padding:1px 4px;background:var(--surface2);color:var(--muted);border:1px solid var(--border);border-radius:3px;margin-right:4px" ${a.default===0?'disabled':''} onchange="saveConfig()">
        <option value="">respawn</option>
        <option value="season">per season</option>
        <option value="phase">per phase</option>
      </select>
      <input type="number" id="adv-count-${a.key}" class="adv-count" min="0" max="9" value="${a.default}" ${a.default===0?'disabled':''} oninput="saveConfig()">
    </div>
    ${srcHtml}
    ${a.key === 'legacy' ? `<div id="legacy-settings" style="display:none;margin:4px 0 8px 24px">
      <label style="font-size:11px;color:#8b949e">Activates at</label>
      <select id="cfg-legacy-activates" class="form-select" style="font-size:11px;padding:2px 6px;width:auto;margin-left:6px" onchange="saveConfig()">
        <option value="6">Final 6</option>
        <option value="5" selected>Final 5</option>
        <option value="7">Final 7</option>
        <option value="13,6">Final 13 + Final 6</option>
      </select>
    </div>` : ''}`;
  }).join('');
}
export function toggleAdv(key) {
  const checked = document.getElementById('adv-'+key).checked;
  const countEl = document.getElementById('adv-count-'+key);
  countEl.disabled = !checked;
  if (!checked) countEl.value=0; else if (!parseInt(countEl.value)) countEl.value=1;
  const oncePerEl = document.getElementById('adv-onceper-'+key);
  if (oncePerEl) oncePerEl.disabled = !checked;
  // Show/hide source toggles
  const srcEl = document.getElementById('adv-sources-'+key);
  if (srcEl) srcEl.style.display = checked ? 'flex' : 'none';
  // Show/hide legacy-specific settings
  if (key === 'legacy') {
    const legSet = document.getElementById('legacy-settings');
    if (legSet) legSet.style.display = checked ? 'block' : 'none';
  }
  saveConfig();
}
export function onFinaleFormatChange() {
  const format = document.getElementById('cfg-finale-format')?.value;
  const slider = document.getElementById('cfg-finale');
  const display = document.getElementById('finale-display');
  const needsF4 = format === 'fire-making' || format === 'koh-lanta';
  if (needsF4) {
    if (slider) { slider.value = 4; slider.disabled = true; slider.style.opacity = '0.4'; }
    const label = format === 'koh-lanta' ? 'koh-lanta' : 'fire-making';
    if (display) display.textContent = `4 (locked — ${label})`;
  } else {
    if (slider) { slider.disabled = false; slider.style.opacity = '1'; }
    if (display) display.textContent = slider?.value || '3';
  }
  saveConfig();
}

export function toggleRI() {
  const on = document.getElementById('cfg-ri').checked;
  const _riEl = document.getElementById('ri-settings');
  _riEl.style.display = on ? 'flex' : 'none';
  _riEl.style.flexDirection = 'column';
  saveConfig();
}
export function toggleSID() { saveConfig(); }
export function saveConfig() {
  const g = id => document.getElementById(id);
  seasonConfig = {
    name:        g('cfg-name')?.value.trim() || '',
    year:        g('cfg-year')?.value.trim() || '',
    days:        parseInt(g('cfg-days')?.value) || 39,
    gameMode:    seasonConfig.gameMode || 'spectator',
    teams:       parseInt(g('cfg-teams')?.value) || 2,
    mergeAt:     parseInt(g('cfg-merge')?.value) || 12,
    finaleSize:  parseInt(g('cfg-finale')?.value) || 3,
    finaleFormat: g('cfg-finale-format')?.value || 'traditional',
    finaleAssistants: g('cfg-finale-assistants')?.checked || false,
    jurySize:    parseInt(g('cfg-jury')?.value) || 9,
    ri:          g('cfg-ri')?.checked || false,
    riReentryAt: parseInt(g('cfg-ri-reentry')?.value) || 12,
    riFormat:    g('cfg-ri-format')?.value || 'redemption',
    riReturnPoints: parseInt(g('cfg-ri-return-points')?.value) || 1,
    riSecondReturnAt: parseInt(g('cfg-ri-second-return')?.value) || 5,
    journey:     g('cfg-journey')?.checked || false,
    exile:       g('cfg-exile')?.checked || false,
    exilePhase:  g('cfg-exile-phase')?.value || 'both',
    shotInDark:  g('cfg-sid')?.checked || false,
    blackVote:   g('cfg-black-vote')?.value || 'off',
    firemaking:  (g('cfg-finale-format')?.value === 'fire-making') || false,
    tiebreakerMode: g('cfg-tiebreaker-mode')?.value || 'survivor',
    qem:         g('cfg-qem')?.checked || false,
    idolRehide:  g('cfg-idol-rehide')?.checked || false,
    idolsPerTribe: parseInt(g('cfg-idols-per-tribe')?.value) || 1,
    idolsAtMerge: parseInt(g('cfg-idols-at-merge')?.value) ?? 1,
    advExpire:   parseInt(g('cfg-adv-expire')?.value) || 4,
    foodWater:   g('cfg-food-water')?.value || 'disabled',
    survivalDifficulty: g('cfg-survival-difficulty')?.value || 'casual',
    aftermath:   g('cfg-aftermath')?.value || 'disabled',
    fanVoteFrequency: g('cfg-fan-vote-frequency')?.value || 'disabled',
    mole:        g('cfg-mole')?.value || 'disabled',
    molePlayers: seasonConfig.molePlayers || [],
    moleCoordination: g('cfg-mole-coordination')?.value || 'independent',
    romance:     g('cfg-romance')?.value || 'enabled',
    autoRewardChallenges: g('cfg-auto-reward')?.checked ?? false,
    replacementOnMedevac: g('cfg-replacement')?.checked ?? false,
    rewardSharing: g('cfg-reward-sharing')?.checked ?? false,
    host:        g('cfg-host')?.value || 'Chris',
    advantages: Object.fromEntries(ADVANTAGES.map(a => {
      if (a.key === 'idol') {
        const en = g('adv-idol-enabled');
        const _ipt = parseInt(g('cfg-idols-per-tribe')?.value) || 1;
        const _numTribes = parseInt(g('cfg-teams')?.value) || 2;
        const _iam = parseInt(g('cfg-idols-at-merge')?.value) ?? 1;
        return [a.key, { enabled: en ? en.checked : false, count: _ipt * _numTribes + _iam }];
      }
      const en = g('adv-' + a.key), ct = g('adv-count-' + a.key), op = g('adv-onceper-' + a.key);
      const sources = Object.keys(ADV_SOURCE_LABELS).filter(src => g('adv-src-' + a.key + '-' + src)?.checked);
      return [a.key, { enabled: en ? en.checked : false, count: ct ? parseInt(ct.value)||0 : 0, oncePer: op?.value || '', sources }];
    })),
    legacyActivatesAt: (g('cfg-legacy-activates')?.value || '5').split(',').map(Number),
    twistSchedule: seasonConfig.twistSchedule || [],
    tribes: seasonConfig.tribes || [],
    popularityEnabled: g('cfg-popularity')?.checked ?? true,
    hidePopularity: g('cfg-hide-popularity')?.checked ?? false,
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig));
  // Disable fan-vote finale option when popularity is off
  const _fvOpt = document.querySelector('#cfg-finale-format option[value="fan-vote"]');
  if (_fvOpt) {
    const _popOn = g('cfg-popularity')?.checked;
    _fvOpt.disabled = !_popOn;
    _fvOpt.textContent = _popOn ? 'Fan Vote Finale' : 'Fan Vote Finale (requires popularity)';
    // If fan-vote was selected but popularity just got disabled, reset to traditional
    if (!_popOn && seasonConfig.finaleFormat === 'fan-vote') {
      seasonConfig.finaleFormat = 'traditional';
      const _fmSel = g('cfg-finale-format');
      if (_fmSel) _fmSel.value = 'traditional';
    }
  }
}
export function renderConfig() {
  const g = id => document.getElementById(id);
  const set = (id, val) => { const el = g(id); if (el) el.value = val; };
  const chk = (id, val) => { const el = g(id); if (el) el.checked = val; };
  set('cfg-name',    seasonConfig.name || '');
  set('cfg-year',    seasonConfig.year || '');
  set('cfg-days',    seasonConfig.days || 39);
  set('cfg-teams',   seasonConfig.teams || 2);
  set('cfg-merge',   seasonConfig.mergeAt);
  set('cfg-finale',  seasonConfig.finaleSize);
  set('cfg-finale-format', seasonConfig.finaleFormat || 'traditional');
  if (g('cfg-finale-assistants')) g('cfg-finale-assistants').checked = !!seasonConfig.finaleAssistants;
  set('cfg-jury',    seasonConfig.jurySize || 9);
  chk('cfg-ri',        seasonConfig.ri);
  set('cfg-ri-reentry', seasonConfig.riReentryAt);
  set('cfg-ri-format', seasonConfig.riFormat || 'redemption');
  set('cfg-ri-return-points', seasonConfig.riReturnPoints || 1);
  set('cfg-ri-second-return', seasonConfig.riSecondReturnAt || 5);
  if (g('ri-settings')) g('ri-settings').style.display = seasonConfig.ri ? 'flex' : 'none';
  chk('cfg-journey',   seasonConfig.journey || false);
  chk('cfg-exile', seasonConfig.exile || false);
  set('cfg-exile-phase', seasonConfig.exilePhase || 'both');
  const _exilePhaseRow = g('exile-phase-row');
  if (_exilePhaseRow) _exilePhaseRow.style.display = seasonConfig.exile ? '' : 'none';
  chk('cfg-sid',       seasonConfig.shotInDark || false);
  set('cfg-black-vote', seasonConfig.blackVote || 'off');
  // Apply finaleFormat lock on render (fire-making and koh-lanta force F4)
  const _fmFormat = seasonConfig.finaleFormat;
  const _needsF4 = _fmFormat === 'fire-making' || _fmFormat === 'koh-lanta';
  const _fmSlider = g('cfg-finale');
  const _fmDisplay = document.getElementById('finale-display');
  if (_needsF4) {
    if (_fmSlider) { _fmSlider.value = 4; _fmSlider.disabled = true; _fmSlider.style.opacity = '0.4'; }
    if (_fmDisplay) _fmDisplay.textContent = `4 (locked — ${_fmFormat})`;
  } else {
    if (_fmSlider) { _fmSlider.disabled = false; _fmSlider.style.opacity = '1'; }
  }
  set('cfg-tiebreaker-mode', seasonConfig.tiebreakerMode || 'survivor');
  chk('cfg-qem',        seasonConfig.qem || false);
  chk('cfg-popularity', seasonConfig.popularityEnabled ?? true);
  chk('cfg-hide-popularity', seasonConfig.hidePopularity ?? false);
  // Show/hide the hide-popularity row based on popularity being enabled
  const _hpRow = g('hide-pop-row');
  if (_hpRow) _hpRow.style.display = (seasonConfig.popularityEnabled ?? true) ? '' : 'none';
  chk('cfg-idol-rehide', seasonConfig.idolRehide || false);
  set('cfg-idols-per-tribe', seasonConfig.idolsPerTribe || 1);
  set('cfg-idols-at-merge', seasonConfig.idolsAtMerge ?? 1);
  set('cfg-adv-expire',  seasonConfig.advExpire ?? 4);
  set('cfg-food-water',  seasonConfig.foodWater || 'disabled');
  set('cfg-survival-difficulty', seasonConfig.survivalDifficulty || 'casual');
  // Show/hide survival sub-options based on food/water being enabled
  const _fwOn = (seasonConfig.foodWater || 'disabled') === 'enabled';
  chk('cfg-auto-reward', seasonConfig.autoRewardChallenges ?? false);
  const _arRow = g('auto-reward-row');
  const _arDesc = g('auto-reward-desc');
  if (_arRow) _arRow.style.display = _fwOn ? '' : 'none';
  if (_arDesc) _arDesc.style.display = _fwOn ? '' : 'none';
  chk('cfg-replacement', seasonConfig.replacementOnMedevac ?? false);
  const _repRow = g('replacement-row');
  const _repDesc = g('replacement-desc');
  if (_repRow) _repRow.style.display = _fwOn ? '' : 'none';
  if (_repDesc) _repDesc.style.display = _fwOn ? '' : 'none';
  chk('cfg-reward-sharing', seasonConfig.rewardSharing ?? false);
  const _rsRow = g('reward-sharing-row');
  const _rsDesc = g('reward-sharing-desc');
  if (_rsRow) _rsRow.style.display = _fwOn ? '' : 'none';
  if (_rsDesc) _rsDesc.style.display = _fwOn ? '' : 'none';
  set('cfg-host', seasonConfig.host || 'Chris');
  // Aftermath
  set('cfg-aftermath', seasonConfig.aftermath || 'disabled');
  set('cfg-fan-vote-frequency', seasonConfig.fanVoteFrequency || 'disabled');
  // The Mole
  set('cfg-mole', seasonConfig.mole || 'disabled');
  set('cfg-mole-coordination', seasonConfig.moleCoordination || 'independent');
  updateMoleUI();
  // Romance
  set('cfg-romance', seasonConfig.romance || 'enabled');
  // Sync slider displays
  ['teams','merge','finale','jury','adv-expire'].forEach(name => updateSlider(name));
  renderTribeBuilder(); renderTribeSelect();
  // Hidden Immunity Idol
  const idolAdv = seasonConfig.advantages?.idol;
  if (idolAdv) {
    chk('adv-idol-enabled', idolAdv.enabled);
  }
  // Other advantages in adv-list
  ADVANTAGES.filter(a => a.key !== 'idol').forEach(a => {
    const adv = seasonConfig.advantages?.[a.key]; if (!adv) return;
    const en = g('adv-'+a.key), ct = g('adv-count-'+a.key);
    if (en) en.checked = adv.enabled;
    if (ct) { ct.value = adv.count; ct.disabled = !adv.enabled; }
    const op = g('adv-onceper-'+a.key);
    if (op) { op.value = adv.oncePer || ''; op.disabled = !adv.enabled; }
    // Source toggles
    const srcEl = g('adv-sources-'+a.key);
    if (srcEl) srcEl.style.display = adv.enabled ? 'flex' : 'none';
    const sources = adv.sources || a.defaultSources || [];
    Object.keys(ADV_SOURCE_LABELS).forEach(src => {
      const cb = g('adv-src-' + a.key + '-' + src);
      if (cb) cb.checked = sources.includes(src);
    });
  });
  // Legacy settings
  const legSet = g('legacy-settings');
  const legSel = g('cfg-legacy-activates');
  if (legSet && legSel) {
    legSet.style.display = seasonConfig.advantages?.legacy?.enabled ? 'block' : 'none';
    legSel.value = (seasonConfig.legacyActivatesAt || [5]).join(',');
  }
  renderTimeline();
  updateSurvivalDesc();
}
export function loadS10Config() {
  seasonConfig = {
    name:'Champions vs Contenders', year:'', days:39, gameMode:'spectator',
    teams:2, mergeAt:12, finaleSize:3, finaleFormat:'fire-making', jurySize:9,
    ri:true, riReentryAt:14, riFormat:'redemption', riReturnPoints:1, riSecondReturnAt:5, journey:true, shotInDark:false,
    firemaking:true, qem:false, idolRehide:false,
    advExpire:4, foodWater:'disabled', survivalDifficulty:'casual',
    advantages: { idol:{enabled:true,count:2}, voteSteal:{enabled:true,count:1}, extraVote:{enabled:true,count:1}, kip:{enabled:false,count:0}, legacy:{enabled:false,count:0}, amulet:{enabled:false,count:0} },
    twistSchedule: [{ id:'s10-swap', episode:5, type:'tribe-swap' }],
    tribes: [{ name:'Champions', color:'#f59e0b' }, { name:'Contenders', color:'#ef4444' }],
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); renderConfig();
}
export function loadDC4Config() {
  seasonConfig = {
    name:'Disventure Camp 4: Carnival of Chaos', year:'', days:52, gameMode:'spectator',
    teams:2, mergeAt:12, finaleSize:2, finaleFormat:'jury-cut', jurySize:9,
    ri:true, riReentryAt:10, riFormat:'redemption', riReturnPoints:1, riSecondReturnAt:5, journey:false, shotInDark:false,
    firemaking:false, qem:false, idolRehide:false,
    tiebreakerMode:'challenge',
    advExpire:4, foodWater:'disabled', survivalDifficulty:'casual',
    advantages: { idol:{enabled:true,count:2}, voteSteal:{enabled:true,count:1}, extraVote:{enabled:true,count:1}, kip:{enabled:false,count:0}, legacy:{enabled:false,count:0}, amulet:{enabled:false,count:0}, beware:{enabled:false,count:0} },
    twistSchedule: [
      { id:'dc4-gifts',  episode:1,  type:'three-gifts'      },
      { id:'dc4-swap',   episode:6,  type:'elimination-swap' },
      { id:'dc4-exile',  episode:9,  type:'exile-duel'       },
      { id:'dc4-auction',episode:17, type:'auction'          },
    ],
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); renderConfig();
}
export function loadS9Config() {
  seasonConfig = {
    name:'Total Drama: Land of Powers', year:'', days:39, gameMode:'spectator',
    teams:3, mergeAt:11, finaleSize:3, finaleFormat:'fire-making', jurySize:9,
    ri:false, riReentryAt:11, riFormat:'redemption', riReturnPoints:1, riSecondReturnAt:5, journey:true, shotInDark:true,
    firemaking:true, qem:false, idolRehide:false,
    advExpire:4, foodWater:'disabled', survivalDifficulty:'casual',
    advantages: { idol:{enabled:true,count:2}, voteSteal:{enabled:false,count:0}, extraVote:{enabled:true,count:1}, kip:{enabled:true,count:1}, legacy:{enabled:false,count:0}, amulet:{enabled:false,count:0} },
    twistSchedule: [
      { id:'s9-swap', episode:5,  type:'tribe-swap'  },
      { id:'s9-fire', episode:15, type:'fire-making' },
    ],
    tribes: [{ name:'Yellow', color:'#f59e0b' }, { name:'Red', color:'#ef4444' }, { name:'Blue', color:'#3b82f6' }],
  };
  localStorage.setItem('simulator_config', JSON.stringify(seasonConfig)); renderConfig();
}

// ══════════════════════════════════════════════════════════════════════
// RELATIONSHIPS
// ══════════════════════════════════════════════════════════════════════


export function saveRels() { localStorage.setItem('simulator_rels', JSON.stringify(relationships)); }
export function populateRelDropdowns() {
  const names = players.map(p=>p.name).sort();
  const opts  = names.map(n=>`<option value="${n}">${n}</option>`).join('');
  document.getElementById('rel-a').innerHTML = opts;
  document.getElementById('rel-b').innerHTML = opts;
  updateRelAvatars();
}
export function updateRelAvatars() {
  const a = document.getElementById('rel-a')?.value;
  const b = document.getElementById('rel-b')?.value;
  const aEl = document.getElementById('rel-a-avatar');
  const bEl = document.getElementById('rel-b-avatar');
  if (aEl && a) aEl.innerHTML = miniAvatar(a, 32);
  if (bEl && b) bEl.innerHTML = miniAvatar(b, 32);
}
export function openRelForm(id) {
  editingRelId = id; const form = document.getElementById('rel-form'); form.style.display='flex';
  populateRelDropdowns();
  if (id) {
    const r = relationships.find(r=>r.id===id); if(!r) return;
    document.getElementById('rel-a').value = r.a; document.getElementById('rel-b').value = r.b;
    document.getElementById('rel-note').value = r.note||''; setRelType(r.type);
    document.getElementById('rel-form-title').textContent = 'Edit Relationship';
    document.getElementById('rel-submit-btn').textContent = 'Update';
  } else {
    document.getElementById('rel-note').value=''; setRelType('neutral');
    document.getElementById('rel-form-title').textContent = 'Add Relationship';
    document.getElementById('rel-submit-btn').textContent = 'Add';
  }
  form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
export function closeRelForm() { editingRelId=null; document.getElementById('rel-form').style.display='none'; }
export function setRelType(type) {
  activeRelType = type;
  document.querySelectorAll('#type-seg .type-btn').forEach(btn => {
    const t=btn.dataset.type, rt=REL_TYPES[t];
    if (!rt) return;
    btn.classList.toggle('active', t===type);
    btn.style.background = t===type ? rt.color : '';
    btn.style.borderColor = t===type ? rt.color : '';
  });
}
export function submitRel() {
  const a=document.getElementById('rel-a').value, b=document.getElementById('rel-b').value;
  if (!a||!b) { alert('Select two players.'); return; }
  if (a===b) { alert('Select two different players.'); return; }
  const key=[a,b].sort().join('|');
  const dup = relationships.find(r => { if(editingRelId&&r.id===editingRelId) return false; return [r.a,r.b].sort().join('|')===key; });
  if (dup) { alert(`A relationship between ${a} and ${b} already exists.`); return; }
  const rel = { id: editingRelId||Date.now().toString(36)+Math.random().toString(36).slice(2,4), a, b, type: activeRelType, bond: REL_TYPES[activeRelType]?.bond??0, note: document.getElementById('rel-note').value.trim() };
  if (editingRelId) { const i=relationships.findIndex(r=>r.id===editingRelId); if(i!==-1) relationships[i]=rel; }
  else relationships.push(rel);
  saveRels(); closeRelForm(); renderRelList();
}
export function deleteRel(id) { relationships=relationships.filter(r=>r.id!==id); saveRels(); renderRelList(); }
export function clearRelationships() { if(!confirm('Clear all relationships?')) return; relationships=[]; saveRels(); closeRelForm(); renderRelList(); }
export function loadS10Bonds() {
  if (relationships.length>0&&!confirm('Replace current relationships with S10 pre-game bonds?')) return;
  relationships = S10_BONDS_PRESET.map((b,i) => ({...b, id:'s10-bond-'+i, bond:REL_TYPES[b.type]?.bond??0}));
  saveRels(); renderRelList();
}
export function loadS9Bonds() {
  if (!confirm('S9 is an all-newbie cast — no pre-game bonds. Clear existing relationships?')) return;
  relationships = [];
  saveRels(); renderRelList();
}
export function renderRelList() {
  const list = document.getElementById('rel-list');
  if (!relationships.length) { list.innerHTML=`<div class="rel-empty">No relationships defined.<br>Click <strong>+ Add</strong> or load <strong>S9/S10 Bonds</strong> preset.</div>`; return; }
  const sorted = [...relationships].sort((a,b) => { if(a.type==='unbreakable'&&b.type!=='unbreakable') return -1; if(b.type==='unbreakable'&&a.type!=='unbreakable') return 1; return Math.abs(b.bond)-Math.abs(a.bond); });
  list.innerHTML = sorted.map(r => { const rt=REL_TYPES[r.type]||REL_TYPES.neutral; return `<div class="rel-card"><div class="rel-players"><div style="display:flex;align-items:center;gap:6px">${miniAvatar(r.a)}<span style="font-size:12px;font-weight:600">${r.a}</span><span class="rel-arrow">\u2194</span>${miniAvatar(r.b)}<span style="font-size:12px;font-weight:600">${r.b}</span></div>${r.note?`<div class="rel-note" title="${r.note}">${r.note}</div>`:''}</div><span class="rel-badge" style="background:${rt.bg};color:${rt.color}">${rt.label}</span><div class="rel-actions"><button class="btn btn-secondary btn-sm" onclick="openRelForm('${r.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteRel('${r.id}')">\u2715</button></div></div>`; }).join('');
}

// ══════════════════════════════════════════════════════════════════════
// PRE-GAME ALLIANCES
// ══════════════════════════════════════════════════════════════════════

// preGameAlliances, editingAllianceId, alliancePerm — now in js/core.js (accessed via window)
export const _alliancePermDesc = { permanent:'Permanent — cannot dissolve. Members stay loyal no matter what.', normal:'Normal — can dissolve through betrayals or low bonds.', fragile:'Fragile — dissolves easily. Low tolerance for betrayal or bond decay.' };

export function savePreAlliances() { localStorage.setItem('simulator_prealliances', JSON.stringify(preGameAlliances)); }

export function openAllianceForm(id) {
  // No limit on number of alliances — useful for Blood vs Water seasons
  editingAllianceId = id;
  const form = document.getElementById('alliance-form'); form.style.display = 'flex';
  // Build member toggle grid
  const grid = document.getElementById('alliance-member-grid');
  const names = players.map(p => p.name).sort();
  const existing = id ? preGameAlliances.find(a => a.id === id) : null;
  const selected = new Set(existing?.members || []);
  grid.innerHTML = names.map(n => {
    const p = players.find(x => x.name === n);
    const slug = p?.slug || n.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
    const init = (n||'?')[0].toUpperCase();
    const sel = selected.has(n);
    return `<div data-member="${n}" data-selected="${sel}" onclick="toggleAllianceMember(this)" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;width:48px">
      <div style="width:36px;height:36px;border-radius:50%;border:3px solid ${sel ? '#10b981' : 'transparent'};overflow:hidden;position:relative;background:var(--surface2);transition:border-color 0.15s">
        <img src="assets/avatars/${slug}.png" style="width:100%;height:100%;object-fit:cover;border-radius:50%;${sel ? '' : 'filter:grayscale(0.5);opacity:0.6;'}transition:filter 0.15s,opacity 0.15s" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
        <span style="display:none;font-size:14px;font-weight:700;color:var(--muted);align-items:center;justify-content:center;width:100%;height:100%;position:absolute;top:0;left:0">${init}</span>
      </div>
      <span style="font-size:9px;color:${sel ? '#10b981' : 'var(--muted)'};text-align:center;line-height:1.1;max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color 0.15s">${n}</span>
    </div>`;
  }).join('');
  if (existing) {
    document.getElementById('alliance-name').value = existing.name || '';
    setAlliancePerm(existing.permanence || 'normal');
    document.getElementById('alliance-form-title').textContent = 'Edit Alliance';
    document.getElementById('alliance-submit-btn').textContent = 'Update';
  } else {
    document.getElementById('alliance-name').value = '';
    setAlliancePerm('normal');
    document.getElementById('alliance-form-title').textContent = 'Add Pre-Game Alliance';
    document.getElementById('alliance-submit-btn').textContent = 'Add Alliance';
  }
  form.scrollIntoView({behavior:'smooth',block:'nearest'});
}
export function closeAllianceForm() { editingAllianceId = null; document.getElementById('alliance-form').style.display = 'none'; }
export function setAlliancePerm(p) {
  alliancePerm = p;
  document.querySelectorAll('#alliance-perm-seg .type-btn').forEach(btn => {
    const t = btn.dataset.perm;
    btn.classList.toggle('active', t === p);
    btn.style.background = t === p ? (p === 'permanent' ? '#10b981' : p === 'fragile' ? '#f85149' : 'var(--accent-dim)') : '';
    btn.style.borderColor = t === p ? (p === 'permanent' ? '#10b981' : p === 'fragile' ? '#f85149' : 'var(--accent)') : '';
  });
  document.getElementById('alliance-perm-desc').textContent = _alliancePermDesc[p] || '';
}
export function toggleAllianceMember(el) {
  const isSel = el.dataset.selected === 'true';
  el.dataset.selected = isSel ? 'false' : 'true';
  const ring = el.querySelector('div');
  const img = el.querySelector('img');
  const label = el.querySelector('span:last-child');
  if (ring) ring.style.borderColor = isSel ? 'transparent' : '#10b981';
  if (img) { img.style.filter = isSel ? 'grayscale(0.5)' : ''; img.style.opacity = isSel ? '0.6' : '1'; }
  if (label) label.style.color = isSel ? 'var(--muted)' : '#10b981';
}
export function submitAlliance() {
  const name = document.getElementById('alliance-name').value.trim();
  if (!name) { alert('Enter an alliance name.'); return; }
  const members = [...document.querySelectorAll('#alliance-member-grid [data-selected="true"]')].map(b => b.dataset.member);
  if (members.length < 2) { alert('Select at least 2 members.'); return; }
  if (members.length > 6) { alert('Maximum 6 members per alliance.'); return; }
  const alliance = {
    id: editingAllianceId || Date.now().toString(36) + Math.random().toString(36).slice(2,4),
    name, members, permanence: alliancePerm,
  };
  if (editingAllianceId) {
    const i = preGameAlliances.findIndex(a => a.id === editingAllianceId);
    if (i !== -1) preGameAlliances[i] = alliance;
  } else {
    preGameAlliances.push(alliance);
  }
  savePreAlliances(); closeAllianceForm(); renderAllianceList();
}
export function deletePreAlliance(id) { preGameAlliances = preGameAlliances.filter(a => a.id !== id); savePreAlliances(); renderAllianceList(); }
export function clearPreAlliances() { if (!confirm('Clear all pre-game alliances?')) return; preGameAlliances = []; savePreAlliances(); closeAllianceForm(); renderAllianceList(); }
export function renderAllianceList() {
  const list = document.getElementById('alliance-list');
  const addBtn = document.getElementById('add-alliance-btn');
  if (!preGameAlliances.length) { list.innerHTML = '<div class="rel-empty">No pre-game alliances defined.<br>Click <strong>+ Add</strong> to create one.</div>'; return; }
  list.innerHTML = preGameAlliances.map(a => {
    const permColor = a.permanence === 'permanent' ? '#10b981' : a.permanence === 'fragile' ? '#f85149' : 'var(--muted)';
    const permLabel = a.permanence === 'permanent' ? 'PERMANENT' : a.permanence === 'fragile' ? 'FRAGILE' : 'NORMAL';
    return `<div class="rel-card">
      <div class="rel-players">
        <div class="rel-names" style="flex-wrap:wrap;gap:4px"><strong style="color:var(--accent)">${a.name}</strong></div>
        <div style="display:flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap">${a.members.map(m => `<div style="display:flex;align-items:center;gap:3px">${miniAvatar(m, 24)}<span style="font-size:11px;color:var(--muted)">${m}</span></div>`).join('<span style="color:var(--border);font-size:10px">\u00b7</span>')}</div>
      </div>
      <span class="rel-badge" style="color:${permColor};border:1px solid ${permColor};background:transparent;font-size:9px">${permLabel}</span>
      <div class="rel-actions">
        <button class="btn btn-secondary btn-sm" onclick="openAllianceForm('${a.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deletePreAlliance('${a.id}')">\u2715</button>
      </div>
    </div>`;
  }).join('');
}

