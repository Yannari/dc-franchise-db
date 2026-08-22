// End-of-season rankings updater.
//
// Lifted out of current-season.html, where it sat behind a tab full of tools the
// simulator has since replaced. The scoring engine below is unchanged (v4 —
// 3-pillar + narrative override); only the ends were rewired:
//
//   * the rankings database loads itself from the repo instead of a file picker
//   * placements can come from the season currently open in the simulator, so a
//     finale can be scored the moment it finishes
//   * the result can be published straight to the site, not only downloaded
//
// Rendered into the Legacy tab by renderRankingsUpdate().

import { extractSeasonTemplate, buildBigBrotherSeasonDocument } from './stats-export.js';

// The tool was written against current-season.html, whose .btn is white-on-dark.
// The simulator's .btn is not, so every button here rendered as black text —
// unreadable on the translucent ones. Scope our own button styling to the card.
const RU_CSS = `
<style>
#fr-rankings-update .btn {
  color: #fff; border: 1px solid rgba(255,255,255,0.15); border-radius: 9px;
  padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: filter .15s, border-color .15s;
}
#fr-rankings-update .btn:hover { filter: brightness(1.14); border-color: rgba(255,255,255,0.3); }
#fr-rankings-update .btn:disabled { opacity: .6; cursor: default; filter: none; }
#fr-rankings-update input, #fr-rankings-update select { color: #fff; }
</style>`;

const RU_HTML = RU_CSS + `      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- END-OF-SEASON RANKINGS UPDATE                              -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="glass-card" style="padding: 24px; margin-top: 20px;" id="rankings-update-card">
        <h3 style="margin-top: 0;">📊 End-of-Season Rankings Update</h3>
        <p style="opacity: 0.8; font-size: 14px; margin-bottom: 20px;">
          After the finale, enter each player's final placement. The system applies the franchise scoring curve automatically — consistent with all existing scores, no manual math needed.
        </p>

        <div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">① Load Current Rankings Database</h4>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button id="ru-load-file-btn" class="btn" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">📂 Load rankings_database.json</button>
            <input type="file" id="ru-file-input" accept=".json" style="display:none;">
            <span id="ru-load-status" style="font-size: 13px; opacity: 0.7;">No file loaded</span>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; opacity: 0.9;">② Auto-fill from Season JSON <span style="font-size:11px;opacity:0.5;font-weight:400;">(optional but faster)</span></h4>
          <p style="font-size: 12px; opacity: 0.6; margin: 0 0 10px 0;">Load your seasonX-data.json to auto-fill player names, placements, jury votes and votes against. Then just add challenge/idol stats manually for the few players who had them.</p>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button id="ru-use-current-btn" class="btn" style="background: linear-gradient(135deg, #4ade80, #22c55e);">🎬 Use the season in the simulator</button>
            <button id="ru-load-season-btn" class="btn" style="background: linear-gradient(135deg, #f59e0b, #d97706);">⚡ Load Season Data JSON</button>
            <input type="file" id="ru-season-file-input" accept=".json" style="display:none;">
            <span id="ru-season-load-status" style="font-size: 13px; opacity: 0.7;">No season file loaded</span>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">③ Season Info</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; opacity: 0.7; display: block; margin-bottom: 4px;">Season Number</label>
              <input type="number" id="ru-season-num" value="8" min="1" style="width: 100%; padding: 8px 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 14px;">
            </div>
            <div>
              <label style="font-size: 12px; opacity: 0.7; display: block; margin-bottom: 4px;">Cast Size</label>
              <input type="number" id="ru-cast-size" value="18" min="8" style="width: 100%; padding: 8px 10px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 14px;">
            </div>
            <div>
              <label style="font-size: 12px; opacity: 0.7; display: block; margin-bottom: 4px;">Co-Winners? (jury tie)</label>
              <select id="ru-co-winner" style="width: 100%; padding: 8px 10px; background: rgba(30,20,50,0.9); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; font-size: 14px;">
                <option value="no">No — single winner</option>
                <option value="yes">Yes — shared win</option>
              </select>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; opacity: 0.9;">③ Final Placements &amp; Stats</h4>
          <p style="font-size: 12px; opacity: 0.6; margin: 0 0 8px 0;">Name must match exactly as in rankings_database.json. All stat fields are optional — leave blank to skip. Hover column headers for scoring details.</p>

          <div style="display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; padding: 10px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 11px; opacity: 0.75; line-height: 1.9;">
            <span style="color:#e2e8f0;">📍 <b>PLACEMENT</b> — spine of the formula · base = 42 + (placementPercentile × 0.26) · P1 → base 68 · last place → base 42 · Win +8 (2nd win +5…) · all other stats add on top</span>
            <span style="display:block;width:100%;height:1px;background:rgba(255,255,255,0.07);margin:2px 0;"></span>
            <span id="ru-legend-show" style="display:contents;"></span>
            <span>🤝 Allies +0.5 each (cap 4) · Unbreakable/named alliances only — auto-filled from season JSON</span>
            <span>♟️ Strategic score ×0.12 — ability + real moves (flips, blindsides, schemes, effective plays) · auto-filled from season JSON</span>
            <span style="color:#34d399; margin-left:8px;">💞 <b>SOCIAL</b></span>
            <span></span>
            <span>❤️ Fan Fav +2.0</span>
            <span>🗳️ Votes vs −0.2 per vote above avg · +0.15 per vote below avg</span>
            <span style="color:#fbbf24; margin-left:8px;">✍️ <b>Override</b> ±5 max</span>
            <span style="color:#f87171; margin-left:8px;">🚪 Quit −6.0</span>
          </div>

          <div style="overflow: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;" id="ru-placements-table">
              <thead>
                <tr style="opacity: 0.65; border-bottom: 1px solid rgba(255,255,255,0.12); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; background: rgba(255,255,255,0.03);">
                  <th style="padding: 6px 6px; text-align: left; min-width: 120px;">Player</th>
                  <th style="padding: 6px 5px; text-align: center; width: 50px;" title="Final placement (1 = winner)">Place</th>
                  <th id="ru-th-comp1" style="padding: 6px 5px; text-align: center; width: 44px; color:#60a5fa;" title="+0.8 per individual immunity win">Imm</th>
                  <th id="ru-th-comp2" style="padding: 6px 5px; text-align: center; width: 44px; color:#60a5fa;" title="+0.3 per reward win">Rew</th>
                  <th id="ru-th-comp3" style="padding: 6px 5px; text-align: center; width: 46px; color:#60a5fa; display:none;" title="third competition — set per show">Arena</th>
                  <th id="ru-th-adv-found" style="padding: 6px 5px; text-align: center; width: 44px; color:#a78bfa;" title="Total idols/advantages FOUND · +0.4 each (credit for locating them)">Found</th>
                  <th id="ru-th-adv-played" style="padding: 6px 5px; text-align: center; width: 46px; color:#a78bfa;" title="Idols/advantages PLAYED EFFECTIVELY (negated votes / worked) · +1.2 each on top of the found bonus">Played</th>
                  <th id="ru-th-adv-wasted" style="padding: 6px 5px; text-align: center; width: 46px; color:#a78bfa;" title="Idols/advantages PLAYED but WASTED (misfired / negated 0 votes / failed) · −1.2 each">Wasted</th>
                  <th id="ru-th-adv-held" style="padding: 6px 5px; text-align: center; width: 44px; color:#a78bfa;" title="Idols/advantages HELD & never used · 0 if survived to the end · −1.8 if eliminated still holding it">Held</th>
                  <th style="padding: 6px 5px; text-align: center; width: 46px; color:#a78bfa;" title="Real alliances only — Unbreakable bonds or named alliances · +0.5 each, max 4 · do NOT include casual relationships">Allies</th>
                  <th style="padding: 6px 5px; text-align: center; width: 52px; color:#a78bfa;" title="Strategic-gameplay score (ability + real moves: flips, blindsides, schemes, effective plays) · ×0.12 · auto-filled from season JSON">Strat</th>
                  <th style="padding: 6px 5px; text-align: center; width: 50px; color:#34d399;" title="not counted in score">Jury ⭐</th>
                  <th style="padding: 6px 5px; text-align: center; width: 50px; color:#34d399;" title="Votes cast against this player · −0.2 per vote above cast avg · +0.15 per vote below cast avg">Votes vs</th>
                  <th style="padding: 6px 5px; text-align: center; width: 42px; color:#f59e0b;" title="Won Fan Favorite · +2.0">FanFav</th>
                  <th style="padding: 6px 5px; text-align: center; width: 38px; color:#f87171;" title="Quit voluntarily · −6.0">Quit</th>
                  <th style="padding: 6px 5px; text-align: center; width: 58px; color:#fbbf24;" title="Narrative override · −5 to +5 · add a reason in the note field">±Override</th>
                  <th style="padding: 6px 5px; text-align: left; min-width: 100px; color:#fbbf24;" title="Required if override used — explain why">Override Reason</th>
                  <th style="padding: 6px 5px; text-align: center; width: 36px;">Del</th>
                </tr>
              </thead>
              <tbody id="ru-placements-body"></tbody>
            </table>
          </div>
          <button id="ru-add-row-btn" class="btn" style="margin-top: 10px; background: rgba(255,255,255,0.08); font-size: 13px; padding: 6px 14px;">+ Add Row</button>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;">
          <button id="ru-preview-btn" class="btn" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">👁️ Preview Score Changes</button>
          <button id="ru-apply-btn" class="btn" style="background: linear-gradient(135deg, #22c55e, #16a34a); display: none;" title="Writes the AI reasoning, commits rankings_database.json and refreshes the database. Falls back to downloading the file if the site can't be reached.">✅ Apply &amp; publish to the site</button>
          <button id="ru-reset-btn" class="btn" style="background: rgba(255,255,255,0.10);" title="Empty the table and clear the preview. This is the only thing that discards what you have typed.">↺ Start over</button>
        </div>

        <div id="ru-preview-output" style="display: none;"></div>
      </div>`;

// ── Draft persistence ────────────────────────────────────────────────
// The Legacy tab rebuilds itself whenever you leave and come back, and a
// refresh throws the DOM away entirely. Everything typed here is expensive to
// re-enter, so it's kept in localStorage and only cleared by Start over.
const RU_DRAFT_KEY = 'ru_draft';
const _ruVal = id => { const el = document.getElementById(id); return el ? el.value : ''; };

/** Snapshot raw input values by position — no per-field mapping to drift. */
function _ruSnapshot() {
  const rows = [...document.querySelectorAll('#ru-placements-body tr')].map(tr => ({
    t: [...tr.querySelectorAll('input[type=text]')].map(i => i.value),
    n: [...tr.querySelectorAll('input[type=number]')].map(i => i.value),
    c: [...tr.querySelectorAll('input[type=checkbox]')].map(i => i.checked),
  })).filter(r => r.t.some(v => String(v).trim()) || r.n.some(v => String(v).trim()) || r.c.some(Boolean));

  const out = document.getElementById('ru-preview-output');
  return {
    rows,
    seasonNum: _ruVal('ru-season-num'),
    castSize: _ruVal('ru-cast-size'),
    coWinner: _ruVal('ru-co-winner'),
    previewOpen: !!(out && out.style.display !== 'none' && out.innerHTML.trim()),
  };
}

function _ruSave() {
  try {
    const snap = _ruSnapshot();
    if (!snap.rows.length) localStorage.removeItem(RU_DRAFT_KEY);
    else localStorage.setItem(RU_DRAFT_KEY, JSON.stringify(snap));
  } catch {}
}

let _ruSaveTimer = null;
function _ruSaveSoon() { clearTimeout(_ruSaveTimer); _ruSaveTimer = setTimeout(_ruSave, 300); }

/** Rebuild the table from the saved draft. Returns the draft, or null. */
function _ruRestore() {
  let draft = null;
  try { draft = JSON.parse(localStorage.getItem(RU_DRAFT_KEY) || 'null'); } catch {}
  if (!draft || !Array.isArray(draft.rows) || !draft.rows.length) return null;

  const body = document.getElementById('ru-placements-body');
  if (!body) return null;
  body.innerHTML = '';
  rowCount = 0;
  draft.rows.forEach(() => addRow());

  [...body.querySelectorAll('tr')].forEach((tr, i) => {
    const r = draft.rows[i];
    if (!r) return;
    [...tr.querySelectorAll('input[type=text]')].forEach((inp, j) => { if (r.t[j] !== undefined) inp.value = r.t[j]; });
    [...tr.querySelectorAll('input[type=number]')].forEach((inp, j) => { if (r.n[j] !== undefined) inp.value = r.n[j]; });
    [...tr.querySelectorAll('input[type=checkbox]')].forEach((inp, j) => { if (r.c[j] !== undefined) inp.checked = !!r.c[j]; });
  });

  ['ru-season-num', 'ru-cast-size', 'ru-co-winner'].forEach((id, k) => {
    const el = document.getElementById(id);
    const v = [draft.seasonNum, draft.castSize, draft.coWinner][k];
    if (el && v !== undefined && v !== '') el.value = v;
  });
  return draft;
}

/** Paint the tool into a host element and wire it up. */
export function renderRankingsUpdate(host) {
  if (!host) return;
  host.innerHTML = RU_HTML;
  ruInit();
  document.getElementById('ru-use-current-btn')?.addEventListener('click', _ruUseCurrentSeason);
  document.getElementById('ru-reset-btn')?.addEventListener('click', _ruReset);

  // The two competition columns are named after the show being ranked. Done on
  // render as well as on load, because the tool is usually opened with a season
  // already in the simulator — and a header reading "Imm" over a column of Head
  // of Household wins is the sort of thing that gets typed into wrong.
  _ruRelabelColumns();

  // Any edit anywhere in the card is worth saving.
  host.addEventListener('input', _ruSaveSoon);
  host.addEventListener('change', _ruSaveSoon);

  const draft = _ruRestore();
  // The preview needs the rankings database, which arrives asynchronously.
  _ruAutoLoad().then(() => { if (draft && draft.previewOpen) { try { buildPreview(); } catch {} } });
}

/**
 * Empty the table and clear the preview. The rankings database stays loaded —
 * that came from the site, not from anything you typed, and reloading it would
 * only be slower.
 */
function _ruReset() {
  if (!confirm('Clear the placements table and the preview?\n\nThis is the only thing that discards what you have typed — refreshing or switching tabs keeps it. The rankings database stays loaded.')) return;

  try { localStorage.removeItem(RU_DRAFT_KEY); } catch {}
  const body = document.getElementById('ru-placements-body');
  if (body) body.innerHTML = '';
  rowCount = 0;
  pendingUpdated = null;
  addRow();                                   // leave one blank row to type into

  const out = document.getElementById('ru-preview-output');
  if (out) { out.innerHTML = ''; out.style.display = 'none'; }
  const apply = document.getElementById('ru-apply-btn');
  if (apply) apply.style.display = 'none';

  const seasonStatus = document.getElementById('ru-season-load-status');
  if (seasonStatus) { seasonStatus.textContent = 'No season file loaded'; seasonStatus.style.color = ''; }
}

/** Pull rankings_database.json straight from the site — no file picker.
 *  Returns a promise so callers can wait for the database before previewing. */
async function _ruAutoLoad() {
  const status = document.getElementById('ru-load-status');
  try {
    const r = await fetch('rankings_database.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    rankingsDB = await r.json();
    if (status) {
      status.textContent = 'Loaded ' + (rankingsDB.rankings || []).length + ' players from the site';
      status.style.color = '#4ade80';
    }
  } catch (e) {
    if (status) {
      status.textContent = "Couldn't load automatically — pick the file";
      status.style.color = '#e5843e';
    }
  }
}

/**
 * A shared win is either two players sitting on placement 1, or a final vote
 * whose top two counts are equal — S8's 4-4 tie is the case that matters.
 * Co-winners take a 0.75x win bonus, so getting this wrong skews their score.
 */
function _ruDetectCoWin(tmpl) {
  const firsts = (tmpl.placements || []).filter(p => Number(p.placement) === 1).length;
  if (firsts > 1) return true;
  const counts = String((tmpl.winner && tmpl.winner.vote) || '')
    .split('-').map(n => parseInt(n, 10)).filter(Number.isFinite);
  if (counts.length >= 2) {
    const sorted = [...counts].sort((a, b) => b - a);
    if (sorted[0] === sorted[1]) return true;
  }
  return false;
}

/** Fill the whole form from the season currently loaded in the simulator. */
function _ruUseCurrentSeason() {
  const status = document.getElementById('ru-season-load-status');
  const say = (msg, bad) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = bad ? '#e5843e' : '#4ade80';
  };
  try {
    // extractSeasonTemplate() assumes a played season; with an empty simulator
    // it throws from deep inside. Translate that into something actionable
    // rather than surfacing "cannot read properties of undefined".
    // WHICH BUILDER. `extractSeasonTemplate()` is the Total Drama one and
    // stamps `format: 'total-drama'` on whatever it is handed, so pressing
    // this button on a Big Brother season produced a Total Drama document:
    // the board relabelled itself back to Imm/Rew, and then filled those
    // columns from immunityWins and rewardWins, which a house does not have.
    // Every player came out zero and the season ranked on placement alone.
    let tmpl;
    const houseNow = (typeof seasonConfig !== 'undefined' && seasonConfig?.format === 'big-brother')
      || !!(typeof gs !== 'undefined' && gs?.bb?.weeks?.length);
    try {
      tmpl = houseNow
        ? buildBigBrotherSeasonDocument(Number(gs?.seasonNumber || seasonConfig?.seasonNumber) || 1)
        : extractSeasonTemplate();
    } catch (e) {
      // The house builder says something useful when a season is unfinished
      // ('play the finale before exporting'); the Total Drama one throws from
      // deep inside. Keep a real message when there is one.
      throw new Error(/finale|weeks/i.test(e?.message || '')
        ? e.message
        : 'no season is loaded in the simulator — run or load one first');
    }
    const placements = (tmpl && tmpl.placements) || [];
    if (!placements.length) throw new Error('that season has no results yet — play it through the finale first');

    loadSeasonData(tmpl);                       // fills the placements table

    // Season Info, derived rather than typed
    const filled = [];
    const numEl = document.getElementById('ru-season-num');
    if (numEl && tmpl.seasonNumber) { numEl.value = tmpl.seasonNumber; filled.push('S' + tmpl.seasonNumber); }

    const castEl = document.getElementById('ru-cast-size');
    const cast = Number(tmpl.castSize) || placements.length;
    if (castEl && cast) { castEl.value = cast; filled.push(cast + ' players'); }

    const coEl = document.getElementById('ru-co-winner');
    if (coEl) {
      const co = _ruDetectCoWin(tmpl);
      coEl.value = co ? 'yes' : 'no';
      if (co) filled.push('shared win detected');
    }

    const vote = (tmpl.winner && tmpl.winner.vote) || '';
    _ruRelabelColumns();
    say('Loaded from the simulator — ' + filled.join(' · ') + (vote ? ' · final vote ' + vote : ''));
    _ruSave();                       // filled programmatically — no input event fires
  } catch (e) {
    say('Could not read the current season: ' + e.message, true);
  }
}


let rankingsDB     = null;
let pendingUpdated = null;
let rowCount       = 0;

// ── Which show this board is for ─────────────────────────
//
// The formula below was written when there was one show, and two of its terms
// name Total Drama's furniture. `Imm` and `Rew` are its two competitions;
// Big Brother's are Head of Household and the Veto, and they are not the same
// shape — a veto SAVES you, which is what immunity does, while an HOH hands you
// power and a target in the same breath.
//
// Everything else transfers unchanged: placement, wins, finals, advantages,
// alliances, strategic score, jury votes, votes against, fan favourite, quit.
//
// THE WEIGHTS BELOW ARE A STARTING POINT, not a claim. They are yours to tune
// in one place, which is the actual point of them being here rather than
// implied by a column called "Imm".
// Advantage / power lifecycle weights.
//
// These lived as literals in FOUR places — the scorer, the column titles, the
// legend and the preview breakdown — which is the drift this file already got
// bitten by once with the competition columns. One copy, everything reads it.
const RU_ADV = { found: 0.8, played: 2.4, wasted: 2.4, held: 2.4 };

const RU_SHOW = {
  'total-drama': {
    comp1: { label: 'Imm',  weight: 1.6, title: '+1.6 per individual immunity win' },
    comp2: { label: 'Rew',  weight: 0.6, title: '+0.6 per reward win' },
    comp3: null,
    adv: { group: 'ADVANTAGES', noun: 'idol/advantage',
      found: 'Found', played: 'Played', wasted: 'Wasted', held: 'Held' },
  },
  'big-brother': {
    comp1: { label: 'HOH',  weight: 1.2, title: '+1.2 per Head of Household — power, and a target' },
    comp2: { label: 'Veto', weight: 1.6, title: '+1.6 per veto — the competition that saves you' },
    // THE THIRD COMPETITION. A house runs three kinds and this board had two
    // columns, so every Block Buster and every arena win in a season scored
    // exactly nothing — the one comp you win while ON THE BLOCK, which is the
    // hardest circumstance any of them are won in.
    comp3: { label: 'Arena', weight: 1.4,
      title: '+1.4 per Block Buster / arena win — won while already on the block' },
    // Powers are not idols, and the lifecycle words differ: you are GIVEN a
    // power or you win one, you do not find it in a tree.
    adv: { group: 'POWERS', noun: 'power',
      found: 'Won', played: 'Played', wasted: 'Wasted', held: 'Held' },
  },
};

/**
 * Relabel the two competition columns for the show being ranked.
 *
 * Called wherever the season is loaded. Without it the header says "Imm" over a
 * column of Head of Household wins, which is the sort of thing that gets typed
 * into wrong and never noticed.
 */
function _ruRelabelColumns() {
  const rub = _ruRubric();
  for (const [id, spec] of [['ru-th-comp1', rub.comp1], ['ru-th-comp2', rub.comp2],
    ['ru-th-comp3', rub.comp3]]) {
    const th = document.getElementById(id);
    if (!th) continue;
    // A show with two kinds of competition does not get an empty third column
    // sitting there inviting a number that would score nothing.
    th.style.display = spec ? '' : 'none';
    if (!spec) continue;
    th.textContent = spec.label;
    th.title = spec.title;
  }
  const adv = rub.adv || {};
  // The weights live in RU_ADV, so the tooltips quote it rather than repeat it.
  const noun = adv.noun || 'idol/advantage';
  const advTitles = {
    'ru-th-adv-found':  `Total ${noun}s FOUND · +${RU_ADV.found} each (credit for locating them)`,
    'ru-th-adv-played': `${noun}s PLAYED EFFECTIVELY (negated votes / worked) · +${RU_ADV.played} each on top of the found bonus`,
    'ru-th-adv-wasted': `${noun}s PLAYED but WASTED (misfired / negated 0 votes / failed) · −${RU_ADV.wasted} each`,
    'ru-th-adv-held':   `${noun}s HELD & never used · 0 if survived to the end · −${RU_ADV.held} if eliminated still holding it`,
  };
  for (const [id, label] of [['ru-th-adv-found', adv.found], ['ru-th-adv-played', adv.played],
    ['ru-th-adv-wasted', adv.wasted], ['ru-th-adv-held', adv.held]]) {
    const th = document.getElementById(id);
    if (!th) continue;
    if (label) th.textContent = label;
    if (advTitles[id]) th.title = advTitles[id];
  }
  // Every data row has to gain or lose the same cell, or the columns shear.
  document.querySelectorAll('.ru-cell-comp3').forEach(td => {
    td.style.display = rub.comp3 ? '' : 'none';
  });
  _ruRenderLegend();
}

/**
 * The legend, written from the rubric rather than typed underneath it.
 *
 * It used to be hardcoded Total Drama — '🏆 Imm +0.8 · 🎁 Rew +0.3' — so a
 * Big Brother season relabelled its column headers to HOH and Veto while the
 * key above the table went on explaining immunity and reward wins at weights
 * neither of them used. A legend that can disagree with the scorer is worse
 * than no legend.
 */
function _ruRenderLegend() {
  const el = document.getElementById('ru-legend-show');
  if (!el) return;
  const rub = _ruRubric();
  const adv = rub.adv || {};
  const comp = [rub.comp1, rub.comp2, rub.comp3].filter(Boolean)
    .map(c => `<span>${c.label} +${c.weight}</span>`).join('');
  el.innerHTML = `<span style="color:#60a5fa;">⚡ <b>COMPETITIONS</b></span>${comp}`
    + `<span style="color:#a78bfa; margin-left:8px;">🧠 <b>${adv.group || 'STRATEGIC'}</b></span>`
    + `<span>${adv.found || 'Found'} +${RU_ADV.found}</span>`
    + `<span>${adv.played || 'Played'} effectively +${RU_ADV.played}</span>`
    + `<span>${adv.wasted || 'Wasted'} −${RU_ADV.wasted}</span>`
    + `<span>${adv.held || 'Held'} &amp; eliminated −${RU_ADV.held} · survived = 0</span>`;
}

/**
 * The format of the season being ranked.
 *
 * The LOADED DOCUMENT wins. Uploading a Big Brother season while the simulator
 * happens to hold a Total Drama one must rank the thing you uploaded, and the
 * document says which show it is.
 */
let _ruLoadedFormat = null;
function _ruShowFormat() {
  if (_ruLoadedFormat) return _ruLoadedFormat;
  try {
    const el = document.getElementById('ru-format');
    if (el && el.value) return el.value;
    if (typeof seasonConfig !== 'undefined' && seasonConfig?.format) return seasonConfig.format;
  } catch {}
  return 'total-drama';
}

/** What show a season document is from, however it arrived. */
function _ruFormatOfDoc(json) {
  if (json?.format) return json.format;
  if (typeof json?.seasonId === 'string' && json.seasonId.startsWith('bb-')) return 'big-brother';
  // A document with weeks and no episodes is a house, whatever it forgot to say.
  if (Array.isArray(json?.weeks) && json.weeks.length) return 'big-brother';
  return 'total-drama';
}

function _ruRubric(format) {
  return RU_SHOW[format || _ruShowFormat()] || RU_SHOW['total-drama'];
}

// ── Scoring formula ──────────────────────────────────────
function placementPct(placement, castSize) {
  return (castSize - placement) / (castSize - 1) * 100;
}

function careerPct(seasonPcts) {
  const sorted = [...seasonPcts].sort((a, b) => b - a);
  const weights = [[1.0],[0.62,0.38],[0.52,0.30,0.18],[0.46,0.29,0.16,0.09]];
  const w = weights[Math.min(sorted.length - 1, 3)];
  return sorted.reduce((sum, pct, i) => sum + pct * (w[i] || 0), 0);
}

const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

function computeScore(p) {
  const cp   = careerPct(p.allPcts);
  // Base 42 → 68: placement is still the spine, but a shorter one.
  //
  // This was `30 + pct * 42`, which made one placement position worth 2.6
  // points in a cast of 17 — more than four Heads of Household, or three
  // vetoes. The board was a finish-order list with a decorative modifier
  // column: the most decorated non-finalist of a season could not out-score
  // someone three spots above her who had done nothing all game.
  //
  // The spread is 26 and the competition weights doubled, which sets the law
  // the rest of the formula is tuned against: ONE COMPETITION WIN IS WORTH
  // ABOUT ONE PLACEMENT POSITION (a veto 1.6 against 26/16 = 1.63 per place in
  // a cast of 17). Winning things can now move you past the people who merely
  // outlasted you, which is the entire point of scoring them.
  //
  // The floor rose 30 → 42 rather than the ceiling falling, on purpose. The
  // top of the board is where it was (a one-season winner still lands ~87, S,
  // not S+), and the compression comes out of the bottom, where a scale that
  // scored the first boot of a 17-person house at 30/100 was saying she was
  // barely a franchise player at all. She made the cast.
  const base = 42 + (cp / 100) * 26;

  // Win bonus — the P1 placement already lifts the base, so the flat win reward is kept
  // modest to avoid a single win rocketing a mediocre-career player to near-perfect.
  // Co-winner gets ×0.75 (jury tie ≠ outright win).
  const winVals = [8, 5, 3, 2];
  let winBonus = Array.from({length: Math.min(p.wins, 4)}, (_, i) => winVals[i]).reduce((a,b) => a+b, 0);
  if (p.coWin) winBonus = Math.round(winBonus * 0.75);

  const finCap   = Math.min(p.nonWinFinals, 2);
  const finBonus = p.wins > 0 ? finCap * 2.5 : finCap * 4.5;
  const multiBonus = (p.numSeasons - 1) * 3;

  // COMPETITIONS — whichever two the show runs.
  //
  // This read `immWins * 0.8 + rewWins * 0.3` unconditionally. Under Big Brother
  // that scored a veto — the competition that takes you off the block — as a
  // reward challenge, at less than half the weight of the thing it is actually
  // equivalent to.
  const _rub = _ruRubric(p.format);
  const physBonus = (num(p.immWins) * _rub.comp1.weight)
                  + (num(p.rewWins) * _rub.comp2.weight)
                  + (_rub.comp3 ? num(p.comp3Wins) * _rub.comp3.weight : 0);

  // STRATEGIC — advantages scored by lifecycle: found (located it) < played effectively,
  // while wasting or dying with one costs you. Plus a strategic-gameplay term.
  const advFoundBonus  = (p.advFound  || 0) * RU_ADV.found;   // located an advantage
  const advPlayedBonus = (p.advPlayed || 0) * RU_ADV.played;  // used it effectively (on top of found)
  const advWastedPen   = (p.advWasted || 0) * RU_ADV.wasted;  // burned to no effect
  const advHeldPen     = p.isFinalist ? 0 : ((p.advHeld || 0) * RU_ADV.held); // eliminated still holding it
  const stratBonus = advFoundBonus + advPlayedBonus
                   - advWastedPen - advHeldPen
                   + (Math.min(p.alliances, 4) * 0.5)
                   + ((p.strategicScore || 0) * 0.12); // ability + real moves (flips, blindsides, schemes, effective plays)

  // SOCIAL — co-winner jury votes ×0.75 (4-4 tie ≠ 4 decisive votes)
  const castAvgVotes = Math.round(p.castSize / 3);
  // Two-sided votes curve: above avg = penalty, below avg = bonus
  const voteDiff     = p.votesAgainst - castAvgVotes;
  const voteAdj      = voteDiff > 0 ? -(voteDiff * 0.2) : -(voteDiff * 0.15); // negative diff * negative rate = positive bonus
  const fanFavBonus  = p.fanFav ? 2.0 : 0;
  const socialBonus  = fanFavBonus + voteAdj;

  const quitAdj = p.quit ? -6 : 0;

  // NARRATIVE OVERRIDE — clamped to ±5
  const override = Math.max(-5, Math.min(5, p.override || 0));

  const raw = base + winBonus + finBonus + multiBonus + physBonus + stratBonus + socialBonus + quitAdj + override;
  return Math.round(Math.min(Math.max(raw, 0), 100) * 10) / 10;
}

function scoreTier(s) {
  if (s >= 90) return 'S+';
  if (s >= 80) return 'S';
  if (s >= 71) return 'A';
  if (s >= 61) return 'B';
  if (s >= 51) return 'C';
  return 'D';
}

function tierColor(t) {
  return {'S+':'#f59e0b','S':'#a78bfa','A':'#60a5fa','B':'#34d399','C':'#fbbf24','D':'#9ca3af'}[t]||'#fff';
}

// ── Row builder ──────────────────────────────────────────
function numCell(val, w, color) {
  const border = color ? 'border:1px solid ' + color + '33;' : 'border:1px solid rgba(255,255,255,0.11);';
  return '<input type="number" value="' + (val||'') + '" style="width:' + w + ';padding:4px 4px;background:rgba(255,255,255,0.07);' + border + 'border-radius:5px;color:#fff;font-size:12px;text-align:center;">';
}
function chkCell(checked, color) {
  return '<input type="checkbox" ' + (checked?'checked':'') + ' style="width:15px;height:15px;cursor:pointer;accent-color:' + color + ';">';
}

function addRow(name, placement, stats) {
  rowCount++;
  name = name || ''; placement = placement !== undefined ? placement : ''; stats = stats || {};
  const tbody = document.getElementById('ru-placements-body');
  const tr = document.createElement('tr');
  tr.dataset.row = rowCount;
  tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
  tr.innerHTML =
    '<td style="padding:5px 5px;">' +
      '<input type="text" value="' + name + '" placeholder="e.g. Sanders" style="width:110px;padding:5px 7px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:5px;color:#fff;font-size:12px;">' +
    '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(placement,'44px') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.imm,       '36px','#60a5fa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.rew,       '36px','#60a5fa') + '</td>' +
    '<td class="ru-cell-comp3" style="padding:5px 4px;text-align:center;' + (_ruRubric().comp3 ? '' : 'display:none;') + '">' + numCell(stats.comp3, '36px','#60a5fa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.advFound,   '38px','#a78bfa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.advPlayed,  '40px','#a78bfa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.advWasted,  '40px','#a78bfa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.advHeld,    '38px','#a78bfa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.alliances,   '40px','#a78bfa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.strategicScore, '46px','#a78bfa') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.juryVotes,   '40px','#34d399') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + numCell(stats.votesVs,    '44px','#34d399') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + chkCell(stats.fanFav,'#f59e0b') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' + chkCell(stats.quit,  '#f87171') + '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' +
      '<input type="number" min="-5" max="5" value="' + (stats.override||'') + '" placeholder="0" ' +
      'style="width:50px;padding:4px 4px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);border-radius:5px;color:#fbbf24;font-size:12px;text-align:center;">' +
    '</td>' +
    '<td style="padding:5px 4px;">' +
      '<input type="text" value="' + (stats.overrideReason||'') + '" placeholder="reason…" ' +
      'style="width:130px;padding:4px 6px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.2);border-radius:5px;color:#fcd34d;font-size:11px;">' +
    '</td>' +
    '<td style="padding:5px 4px;text-align:center;">' +
      '<button onclick="this.closest(\'tr\').remove()" style="background:rgba(239,68,68,0.18);border:1px solid rgba(239,68,68,0.3);border-radius:5px;color:#f87171;cursor:pointer;padding:3px 7px;font-size:11px;">✕</button>' +
    '</td>';
  tbody.appendChild(tr);
}

function getRows() {
  const rows = [];
  document.querySelectorAll('#ru-placements-body tr').forEach(tr => {
    const txt  = tr.querySelectorAll('input[type=text]');
    const nums = tr.querySelectorAll('input[type=number]');
    const chks = tr.querySelectorAll('input[type=checkbox]');
    const name      = txt[0]  ? txt[0].value.trim()  : '';
    const placement = parseInt(nums[0] ? nums[0].value : '');
    if (!name || isNaN(placement)) return;
    rows.push({
      name,
      placement,
      // READ BY POSITION, so every index below moves when a column is added.
      // The third competition cell is always in the DOM — hidden rather than
      // absent on a show that has two — precisely so these stay put whichever
      // show is loaded.
      immWins:       parseInt(nums[1]?nums[1].value:'')||0,
      rewWins:       parseInt(nums[2]?nums[2].value:'')||0,
      comp3Wins:     parseInt(nums[3]?nums[3].value:'')||0,
      advFound:      parseInt(nums[4]?nums[4].value:'')||0,
      advPlayed:     parseInt(nums[5]?nums[5].value:'')||0,
      advWasted:     parseInt(nums[6]?nums[6].value:'')||0,
      advHeld:       parseInt(nums[7]?nums[7].value:'')||0,
      alliances:     parseInt(nums[8]?nums[8].value:'')||0,
      strategicScore:parseFloat(nums[9]?nums[9].value:'')||0,
      juryVotes:     parseInt(nums[10]?nums[10].value:'')||0,
      votesAgainst:  parseInt(nums[11]?nums[11].value:'')||0,
      override:      parseFloat(nums[12]?nums[12].value:'')||0,
      overrideReason:txt[1] ? txt[1].value.trim() : '',
      fanFav: chks[0]?chks[0].checked:false,
      quit:   chks[1]?chks[1].checked:false,
    });
  });
  return rows;
}

// ── Preview ───────────────────────────────────────────────
function buildPreview() {
  if (!rankingsDB) { alert('Load rankings_database.json first (Step \u2460)'); return; }
  const seasonNum = parseInt(document.getElementById('ru-season-num').value);
  const castSize  = parseInt(document.getElementById('ru-cast-size').value);
  const coWinMode = document.getElementById('ru-co-winner').value === 'yes';
  const rows      = getRows();
  if (!rows.length)                     { alert('Add at least one player in Step \u2462'); return; }
  if (isNaN(seasonNum)||isNaN(castSize)){ alert('Fill Season Number and Cast Size'); return; }

  // Validate overrides have reasons
  const missingReasons = rows.filter(r => r.override !== 0 && !r.overrideReason);
  if (missingReasons.length) {
    alert('Please add a reason for the override on: ' + missingReasons.map(r=>r.name).join(', '));
    return;
  }

  const winnerNames   = new Set((coWinMode?rows.filter(r=>r.placement===1):rows.filter(r=>r.placement===1).slice(0,1)).map(r=>r.name));
  const finalistNames = new Set(rows.filter(r=>r.placement<=3).map(r=>r.name));
  const knownCasts    = {1:24,2:14,3:16,4:18,5:18,6:20,7:20,8:18};
  const results       = [];

  rows.forEach(row => {
    const existing = rankingsDB.rankings.find(p =>
      (p.name||'').toLowerCase()===row.name.toLowerCase() ||
      (p.playerId||'').toLowerCase()===row.name.toLowerCase()
    );

    const isWinner   = winnerNames.has(row.name);
    const isCoWin    = isWinner && coWinMode;
    const isFinalist = finalistNames.has(row.name);

    let prevPcts=[], prevWins=0, prevNonWinFinals=0, prevSeasons=0, wasNew=false;
    if (existing) {
      prevSeasons = existing.seasonsPlayed||1;
      prevWins    = existing.wins||0;
      const pls   = existing.placements||[];
      prevPcts    = pls.length
        ? pls.map((p,i) => placementPct(p, knownCasts[i+1]||19))
        : [Math.max(0,Math.min(100,((existing.score||50)-30-(prevWins>0?14:0)-(prevSeasons-1)*4)/37*100))];
      if (pls.length) prevNonWinFinals = pls.filter(p=>p===2||p===3).length;
    } else { wasNew = true; }

    // Co-winner gets effective P1.5 (halfway between win and runner-up)
    const effectivePlacement = (isWinner && coWinMode) ? 1.5 : row.placement;
    const allPcts      = [...prevPcts, placementPct(effectivePlacement, castSize)];
    const totalWins    = prevWins + (isWinner?1:0);
    const nonWinFinals = prevNonWinFinals + (!isWinner&&isFinalist?1:0);
    const numSeasons   = prevSeasons+1;

    const newScore = computeScore({
      allPcts, wins:totalWins, nonWinFinals, numSeasons, coWin:isCoWin,
      format:_ruShowFormat(),
      immWins:row.immWins, rewWins:row.rewWins, comp3Wins:row.comp3Wins,
      advFound:row.advFound, advPlayed:row.advPlayed, advWasted:row.advWasted, advHeld:row.advHeld,
      strategicScore:row.strategicScore,
      alliances:row.alliances,
      juryVotes:row.juryVotes, votesAgainst:row.votesAgainst,
      fanFav:row.fanFav, quit:row.quit,
      override:row.override, castSize, isFinalist
    });

    // Build breakdown string
    const castAvg = Math.round(castSize/3);
    const parts   = [];
    // ── THE BREAKDOWN HAS TO USE THE NUMBERS THE SCORE USED ──
    //
    // These labels and weights were hardcoded Total Drama while the scorer
    // read the show's rubric. A house printed 'Imm:+1.6' for two Heads of
    // Household (2 x 0.8) against a score that had actually counted 1.2
    // (2 x 0.6), and called a veto a reward at a third of its real weight.
    // A breakdown that does not add up to its own total is worse than none:
    // it is a receipt for a different purchase.
    const _mrub = _ruRubric();
    const _adv = _mrub.adv || {};
    if (row.immWins)    parts.push(_mrub.comp1.label + ':+' + (row.immWins*_mrub.comp1.weight).toFixed(1));
    if (row.rewWins)    parts.push(_mrub.comp2.label + ':+' + (row.rewWins*_mrub.comp2.weight).toFixed(1));
    if (row.comp3Wins && _mrub.comp3) {
      parts.push(_mrub.comp3.label + ':+' + (row.comp3Wins*_mrub.comp3.weight).toFixed(1));
    }
    if (row.advFound)   parts.push((_adv.found || 'AdvFound') + ':+' + (row.advFound*RU_ADV.found).toFixed(1));
    if (row.advPlayed)  parts.push((_adv.played || 'AdvPlay') + ':+' + (row.advPlayed*RU_ADV.played).toFixed(1));
    if (row.advWasted)  parts.push((_adv.wasted || 'AdvWasted') + ':\u2212' + (row.advWasted*RU_ADV.wasted).toFixed(1));
    if (row.advHeld && !isFinalist) parts.push((_adv.held || 'AdvHeld') + ':\u2212' + (row.advHeld*RU_ADV.held).toFixed(1));
    if (row.strategicScore) parts.push('Strat:+' + (row.strategicScore*0.12).toFixed(1));
    if (row.alliances)   parts.push('Allies:+' + (Math.min(row.alliances,4)*0.5).toFixed(1));
    if (row.fanFav)     parts.push('FanFav:+2.0');
    const vDiff = row.votesAgainst - castAvg;
    if (vDiff > 0)  parts.push('VotesVs:\u2212'+(vDiff*0.2).toFixed(1));
    else if (vDiff < 0) parts.push('VotesVs:+'+(Math.abs(vDiff)*0.15).toFixed(1));
    if (row.quit)       parts.push('Quit:\u22126.0');
    if (row.override)   parts.push('Override:' + (row.override>0?'+':'') + row.override.toFixed(1) + (row.overrideReason?' ('+row.overrideReason+')':''));

    // The baseline is the player's ESTABLISHED score — the one in the rankings.
    //
    // This used to average scoreHistory, but that array is a log of the score
    // after each update, not a list of per-season performances: for 82 of the
    // 86 players with a history, the last entry IS the current score. Averaging
    // it therefore averaged past states of the same number, producing a figure
    // that was never anyone's ranking (Wayne: 56.5 -> 89.6 showed a "career
    // average" of 73.0), and a delta measured from it was meaningless.
    let oldScore = null;
    if (existing) {
      const hist = existing.scoreHistory;
      oldScore = (existing.score != null)
        ? existing.score
        : (hist && hist.length ? hist[hist.length - 1] : 0);
    }
    const oldTier  = existing?existing.tier:null;
    const newTier  = scoreTier(newScore);

    results.push({
      name:row.name, placement:row.placement, isWinner, isNew:wasNew, isFinalist,
      oldScore, newScore, oldTier, newTier,
      tierChanged: oldTier!==newTier,
      delta: oldScore!==null ? newScore-oldScore : null,
      breakdown: parts.join(' \u2502 '),
      overrideReason: row.overrideReason,
      existingRef: existing, row
    });
  });

  pendingUpdated = results;
  renderPreview(results, seasonNum, castSize);
}

/**
 * The Place cell: the finish, plus how far the score moved them off it.
 *
 * A player who won three arena competitions from the bottom half should be able
 * to see that the board noticed. Silent disagreement between two adjacent
 * columns just looks like a bug.
 */
function _ruPlaceCell(r, i) {
  const moved = r.placement - (i + 1);
  if (!moved) return String(r.placement);
  const up = moved > 0;
  return r.placement + ' <span style="font-size:10px;color:' + (up ? '#34d399' : '#f87171') +
    ';" title="' + (up ? 'scores above' : 'scores below') + ' the finish order by ' +
    Math.abs(moved) + '">' + (up ? '▲' : '▼') + Math.abs(moved) + '</span>';
}

function renderPreview(results, seasonNum, castSize) {
  const out = document.getElementById('ru-preview-output');
  out.style.display = 'block';
  setTimeout(_ruSave, 0);        // remember that the preview was open

  const newPlayers  = results.filter(r=>r.isNew);
  const tierChanges = results.filter(r=>r.tierChanged&&!r.isNew);
  const risers      = results.filter(r=>r.delta!==null&&r.delta>2);
  const fallers     = results.filter(r=>r.delta!==null&&r.delta<-1);
  const overrides   = results.filter(r=>r.row.override!==0);

  const ds = d => d===null?'NEW':(d>=0?'+':'')+d.toFixed(1);
  const dc = d => d===null?'#a78bfa':d>0?'#34d399':d<0?'#f87171':'#9ca3af';

  // ── SORTED BY THE SCORE, NOT BY THE FINISH ──
  //
  // The board decides an order and then printed a different one: rows ran in
  // finish order while the column beside them held the score, so a season where
  // play actually moved somebody read as a broken table (5th scoring under 6th,
  // 10th scoring over 8th). Rank is where the formula puts them; Place is where
  // the season left them, and the gap between the two is the interesting part.
  const ranked = results.slice().sort((a, b) =>
    (b.newScore - a.newScore) || (a.placement - b.placement));

  const rowHtml = (r, i) =>
    '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' +
    '<td style="padding:7px 10px;font-weight:700;opacity:0.85;">' + (i + 1) + '</td>' +
    '<td style="padding:7px 10px;opacity:0.7;">' + _ruPlaceCell(r, i) + '</td>' +
    '<td style="padding:7px 10px;font-weight:600;">' + r.name +
      (r.row.quit?' <span style="font-size:11px;opacity:0.5;">(quit)</span>':'') +
      (r.isWinner?' \ud83d\udc51':'') +
      (r.row.override?' <span style="font-size:10px;color:#fbbf24;" title="' + r.overrideReason + '">[override]</span>':'') +
    '</td>' +
    '<td style="padding:7px 10px;text-align:center;opacity:0.55;">' + (r.oldScore!==null?r.oldScore:'\u2014') + '</td>' +
    '<td style="padding:7px 10px;text-align:center;font-weight:700;color:' + tierColor(r.newTier) + ';">' + r.newScore + '</td>' +
    '<td style="padding:7px 10px;text-align:center;font-weight:600;color:' + dc(r.delta) + ';">' + ds(r.delta) + '</td>' +
    '<td style="padding:7px 10px;text-align:center;">' +
      (r.oldTier&&r.oldTier!==r.newTier
        ?'<span style="opacity:0.4;text-decoration:line-through;font-size:11px;">'+r.oldTier+'</span> \u2192 <span style="color:'+tierColor(r.newTier)+';font-weight:700;">'+r.newTier+'</span>'
        :'<span style="color:'+tierColor(r.newTier)+';font-weight:700;">'+r.newTier+'</span>') +
    '</td>' +
    '<td style="padding:7px 10px;font-size:11px;opacity:0.55;min-width:180px;">' + (r.breakdown||'\u2014') + '</td>' +
    '</tr>';

  let html =
    '<div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:14px 16px;margin-bottom:14px;font-size:13px;">' +
      '<div style="display:flex;gap:20px;flex-wrap:wrap;">' +
        '<span>\ud83d\udcc5 S'+seasonNum+'</span>' +
        '<span>\ud83d\udc65 Cast '+castSize+'</span>' +
        '<span>\ud83c\udfc6 '+(results.filter(r=>r.isWinner).map(r=>r.name).join(' &amp; ')||'?')+'</span>' +
        '<span style="color:#34d399;">\u2b06 '+risers.length+' risers</span>' +
        '<span style="color:#f87171;">\u2b07 '+fallers.length+' drops</span>' +
        '<span style="color:#a78bfa;">\u2728 '+newPlayers.length+' new</span>' +
        '<span style="color:#fbbf24;">\ud83d\udd00 '+tierChanges.length+' tier changes</span>' +
        (overrides.length?'<span style="color:#fbbf24;">\u270f\ufe0f '+overrides.length+' overrides</span>':'') +
      '</div>' +
    '</div>' +
    '<div style="overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,0.1);">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<thead><tr style="background:rgba(255,255,255,0.05);font-size:10px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.65;">' +
          '<th style="padding:8px 10px;text-align:left;" title="Where the score puts them on the board">Rank</th>' +
          '<th style="padding:8px 10px;text-align:left;" title="Where the season left them — an arrow means the formula disagrees with the finish order">Place</th>' +
          '<th style="padding:8px 10px;text-align:left;">Player</th>' +
          '<th style="padding:8px 10px;text-align:center;" title="The player\'s established score \u2014 what the rankings currently show for them.">Current</th>' +
          '<th style="padding:8px 10px;text-align:center;">New</th>' +
          '<th style="padding:8px 10px;text-align:center;" title="How far the new score moves them from their established score">\u0394</th>' +
          '<th style="padding:8px 10px;text-align:center;">Tier</th>' +
          '<th style="padding:8px 10px;text-align:left;">Modifiers</th>' +
        '</tr></thead>' +
        '<tbody>'+ranked.map(rowHtml).join('') +'</tbody>' +
      '</table>' +
    '</div>';

  if (tierChanges.length) {
    html += '<div style="margin-top:12px;padding:10px 14px;background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.2);border-radius:9px;font-size:12px;">' +
      '<strong>\ud83d\udd00 Tier Changes:</strong> ' +
      tierChanges.map(r=>r.name+' '+r.oldTier+'\u2192<span style="color:'+tierColor(r.newTier)+'">'+r.newTier+'</span>').join(' &nbsp;\u00b7&nbsp; ') +
    '</div>';
  }

  if (overrides.length) {
    html += '<div style="margin-top:10px;padding:10px 14px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.18);border-radius:9px;font-size:12px;">' +
      '<strong>\u270f\ufe0f Narrative Overrides:</strong> ' +
      overrides.map(r => r.name + ' ' + (r.row.override>0?'+':'')+r.row.override + ' — <em>' + r.overrideReason + '</em>').join(' &nbsp;\u00b7&nbsp; ') +
    '</div>';
  }

  out.innerHTML = html;
  document.getElementById('ru-apply-btn').style.display = 'inline-flex';
}

// ── Apply ─────────────────────────────────────────────────
// ── AI reasoning via Claude API ──────────────────────────
async function generateAIReasoning(name, seasonNum, placement, row, isWinner, isNew, existingReasoning, totalSeasons, totalWins) {
  const winLabel   = isWinner ? 'Winner' : `P${placement}`;
  const statParts  = [];
  if (row.immWins)    statParts.push(`${row.immWins} immunity win${row.immWins>1?'s':''}`);
  if (row.rewWins)    statParts.push(`${row.rewWins} reward win${row.rewWins>1?'s':''}`);
  if (row.advPlayed) statParts.push(`played ${row.advPlayed} advantage${row.advPlayed>1?'s':''} effectively`);
  if (row.advWasted) statParts.push(`wasted ${row.advWasted} advantage${row.advWasted>1?'s':''}`);
  if (row.advHeld) statParts.push(`held ${row.advHeld} advantage${row.advHeld>1?'s':''} (unused)`);
  if (row.alliances)  statParts.push(`${row.alliances} real alliance${row.alliances>1?'s':''}`);
  if (row.votesAgainst===0) statParts.push('never received a vote');
  else if (row.votesAgainst===1) statParts.push('voted against once');
  else statParts.push(`${row.votesAgainst} votes against`);
  if (row.fanFav)     statParts.push('fan favorite');
  if (row.quit)       statParts.push('quit the game');
  if (row.override)   statParts.push(`narrative note: ${row.overrideReason}`);

  const context = isNew
    ? `This is ${name}'s first season (Season ${seasonNum}). They placed ${winLabel}. Stats: ${statParts.join(', ')}.`
    : `${name} has now played ${totalSeasons} seasons with ${totalWins} win${totalWins!==1?'s':''}. This season (Season ${seasonNum}) they placed ${winLabel}. Stats: ${statParts.join(', ')}. Their existing career summary: "${existingReasoning}"`;

  const prompt = `You write the "Why ${isWinner?'S+':totalWins>0?'S':'tier'}" reasoning for a Total Drama franchise rankings page.

${context}

Write 2-4 sentences that read like a thoughtful analyst describing this player's legacy — not a stat sheet. Be specific about what made their game notable or what their placement means in context. If they're a returning player, weave their career arc together rather than listing seasons separately. If they played poorly or left early, be honest but fair. Match the tone of these examples:

Good example (winner): "S9's dominant winner and the franchise's most advantage-literate player. Bowie played a social spider game from day one, allying quietly while hoarding power. He stripped Julia's idol at Tribal with Knowledge is Power, broke his Unbreakable Bond to blindside Priya, and beat Damien at fire to seal a flawless endgame."

Good example (non-winner): "S9's most complete non-winner. Millie converted a Beware package into the Red Idol, used it at F8 to nullify a five-vote strike, and held her alliances together through one of the season's messiest post-merges. Her game had everything a winning résumé needs — she just ran into Bowie."

Good example (early boot): "S9's unluckiest exit. Nichelle was on the wrong end of the Ep2 rock draw through no fault of her own, then burned Shot in the Dark in Ep3 and lost — going 3-0 as both she and Ripper burned their advantages simultaneously."

Write ONLY the reasoning text, no labels or quotes.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await resp.json();
    const text = data?.content?.[0]?.text?.trim();
    if (text) return text;
  } catch(e) {
    console.warn('AI reasoning failed, using fallback', e);
  }
  // Fallback to structured text
  return buildSeasonReasoning(name, seasonNum, placement, row, isWinner, isNew, existingReasoning);
}

async function applyUpdates() {
  if (!pendingUpdated||!rankingsDB) return;
  const seasonNum = parseInt(document.getElementById('ru-season-num').value);

  // Show loading state
  const applyBtn = document.getElementById('ru-apply-btn');
  const origText = applyBtn.textContent;
  applyBtn.textContent = '⏳ Generating AI reasoning...';
  applyBtn.disabled = true;

  // First pass — update all stats without reasoning
  const needsReasoning = [];
  pendingUpdated.forEach(r => {
    const row = r.row;
    if (r.isNew) {
      const maxRank = Math.max(...rankingsDB.rankings.map(p=>p.rank||0));
      const newEntry = {
        playerId: r.name.toLowerCase().replace(/[^a-z0-9]/g,'-'),
        name:r.name, rank:maxRank+1, tier:r.newTier, score:r.newScore,
        wins:r.isWinner?1:0, seasonsPlayed:1,
        scoreHistory:[r.newScore],
        placements:[r.placement], avgPlacement:r.placement,
        // Every competition the show has, not just the two Total Drama runs.
        challengeWins: row.immWins+row.rewWins+(row.comp3Wins||0),
        votesAgainst:row.votesAgainst, juryVotes:row.juryVotes,
        idolsFound:row.advFound || (row.advPlayed+row.advWasted+row.advHeld),
        title:'', emoji:r.isWinner?'\ud83d\udc51':'\u2b50',
        reasoning: buildSeasonReasoning(r.name, seasonNum, r.placement, row, r.isWinner, true, ''),
        strengths:[], weaknesses:[]
      };
      rankingsDB.rankings.push(newEntry);
      needsReasoning.push({ entry: newEntry, r, row, isNew: true, totalSeasons: 1, totalWins: r.isWinner?1:0 });
    } else {
      const e = r.existingRef;
      if (!e.scoreHistory) e.scoreHistory=[e.score];
      e.score=r.newScore; e.tier=r.newTier;
      e.scoreHistory.push(r.newScore);
      e.wins=(e.wins||0)+(r.isWinner?1:0);
      e.seasonsPlayed=(e.seasonsPlayed||1)+1;
      e.winRate=Math.round((e.wins/e.seasonsPlayed)*100*100)/100;
      if (!e.placements) e.placements=[];
      e.placements.push(r.placement);
      e.avgPlacement=e.placements.reduce((a,b)=>a+b,0)/e.placements.length;
      e.challengeWins=(e.challengeWins||0)+row.immWins+row.rewWins+(row.comp3Wins||0);
      e.votesAgainst=(e.votesAgainst||0)+row.votesAgainst;
      e.juryVotes=(e.juryVotes||0)+row.juryVotes;
      e.idolsFound=(e.idolsFound||0)+(row.advFound || (row.advPlayed+row.advWasted+row.advHeld));
      if (row.override) {
        if (!e.overrides) e.overrides=[];
        e.overrides.push({season:seasonNum, value:row.override, reason:row.overrideReason});
      }
      needsReasoning.push({ entry: e, r, row, isNew: false, totalSeasons: e.seasonsPlayed, totalWins: e.wins, prevReasoning: e.reasoning });
    }
  });

  // Second pass — generate AI reasoning for all players in parallel
  applyBtn.textContent = `⏳ Writing ${needsReasoning.length} player summaries...`;
  await Promise.all(needsReasoning.map(async ({entry, r, row, isNew, totalSeasons, totalWins, prevReasoning}) => {
    entry.reasoning = await generateAIReasoning(
      r.name, seasonNum, r.placement, row, r.isWinner,
      isNew, prevReasoning||'', totalSeasons, totalWins
    );
  }));

  rankingsDB.rankings.sort((a,b)=>b.score-a.score);
  rankingsDB.rankings.forEach((p,i)=>{p.rank=i+1;});
  if (rankingsDB.metadata) rankingsDB.metadata.lastUpdated=new Date().toISOString().split('T')[0];

  // Publish straight to the site: the Worker commits rankings_database.json and
  // refreshes the database from it. Downloading is the fallback, so a missing
  // backend or a failed request never costs you the AI reasoning you just paid
  // for \u2014 you still get the file and can commit it yourself.
  applyBtn.textContent = '\u23f3 Publishing\u2026';
  const published = await _ruPublish(rankingsDB, seasonNum);

  let note;
  if (published.ok) {
    note = '\u2705 Published \u2014 rankings_database.json committed and the database refreshed. ' +
           'The site rebuilds in about a minute.';
  } else {
    const blob = new Blob([JSON.stringify(rankingsDB, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rankings_database.json'; a.click();
    URL.revokeObjectURL(url);
    note = '\u26a0\ufe0f Could not publish (' + published.error + ') \u2014 the file was downloaded instead. ' +
           'Replace rankings_database.json in the repo with it and commit.';
  }

  applyBtn.textContent = origText;
  applyBtn.disabled = false;

  document.getElementById('ru-preview-output').insertAdjacentHTML('beforeend',
    '<div style="margin-top:12px;padding:12px 16px;background:' + (published.ok ? 'rgba(34,197,94,0.1)' : 'rgba(255,179,71,0.1)') +
    ';border:1px solid ' + (published.ok ? 'rgba(34,197,94,0.3)' : 'rgba(255,179,71,0.35)') +
    ';border-radius:10px;font-size:13px;color:' + (published.ok ? '#4ade80' : '#ffb347') + ';">' + note + '</div>'
  );
}

/** Hand the updated rankings to the Worker, which commits and syncs them. */
async function _ruPublish(db, seasonNumber) {
  let base = '', token = '';
  try {
    base = (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, '');
    token = localStorage.getItem('studio_api_token') || '';
  } catch {}
  if (!base) return { ok: false, error: 'no backend configured' };
  if (!token) return { ok: false, error: 'no studio token on this device' };

  try {
    const r = await fetch(base + '/api/publish-season', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ seasonNumber, rankings: db }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !j.ok) return { ok: false, error: (j && j.error) || ('HTTP ' + r.status) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Season JSON auto-fill ─────────────────────────────────
function loadSeasonData(json) {
  const placements = json.placements||json.players||[];
  if (!placements.length) { alert('No placements array found in season JSON'); return; }
  document.getElementById('ru-placements-body').innerHTML='';
  rowCount=0;
  // Self-contained name normalizer (this IIFE has no slugify in scope).
  const norm = s => (s||'').toLowerCase().trim().replace(/['".]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  // Fan Favorite lives in the awards block, not in the placements array — map
  // it to a normalized name so we can tick the FANFAV box for that player.
  const ffRaw = json.awards?.fanFavorite;
  const fanFavKey = ffRaw ? norm(typeof ffRaw === 'string' ? ffRaw : ffRaw.name) : null;
  /* Remember what kind of season this is BEFORE filling anything: it decides
     which competition each of the two columns holds, and what they are called. */
  _ruLoadedFormat = _ruFormatOfDoc(json);
  const isHouse = _ruLoadedFormat === 'big-brother';
  _ruRelabelColumns();

  const sorted=[...placements].sort((a,b)=>(a.placement||99)-(b.placement||99));
  sorted.forEach(p=>{
    const name=p.name||p.playerName||'';
    const placement=p.placement||p.finalPlacement||'';
    // Named/unbreakable alliances — exported as an array; count them for the
    // "Allies +0.5 each (cap 4)" bonus. Falls back to a numeric count field.
    const allianceCount = Array.isArray(p.alliances) ? p.alliances.length
                        : (typeof p.alliances === 'number' ? p.alliances
                        : (p.allianceCount ?? p.namedAlliances?.length ?? 0));
    const stats={
      juryVotes:   p.juryVotes||p.jury_votes||0,
      votesVs:     p.votesAgainst||p.votes_against||p.votesReceived||0,
      /* THE ADVANTAGE COLUMNS, per show. A house does not find idols — it is
         handed powers, plays them, lets them lapse, or ends the season still
         holding one. Those four states are what `bb.powersWon/Played/Wasted/
         Held` count, and reading only the Total Drama field names left all
         four columns empty on every Big Brother season. */
      advFound:    isHouse ? (p.bb?.powersWon ?? 0) : (p.idolsFound ?? p.advFound ?? 0),
      advPlayed:   isHouse ? (p.bb?.powersPlayed ?? 0) : (p.advPlayed ?? 0),
      advWasted:   isHouse ? (p.bb?.powersWasted ?? 0) : (p.advWasted ?? 0),
      advHeld:     isHouse ? (p.bb?.powersHeld ?? 0) : (p.advHeld ?? 0),
      /* The house writes this one under a different name — `strategicRank` —
         so the column sat empty while the number it wanted was right there. */
      strategicScore: p.strategicScore ?? (isHouse ? (p.strategicRank ?? 0) : 0),
      /* THE TWO COMPETITION COLUMNS, per show.
         A Big Brother placement carries its own tallies in `bb` — hohWins,
         vetoWins, timesNominated — and this read immunityWins and rewardWins,
         which a house does not have. Every Big Brother player auto-filled as
         zero and zero, so the two competition terms scored nothing for
         everybody and the board came out ranked on placement alone. */
      imm:         isHouse ? (p.bb?.hohWins ?? p.hohWins ?? 0)
                           : (p.immunityWins||p.imm||0),
      rew:         isHouse ? (p.bb?.vetoWins ?? p.vetoWins ?? 0)
                           : (p.rewardWins!=null ? p.rewardWins
                              : (p.rew!=null ? p.rew : Math.max(0, (p.challengeWins||0)-(p.immunityWins||0)))),
      /* The third competition, which only a house has. Block Buster and
         arena wins were being read by nothing at all. */
      comp3:       isHouse ? (p.bb?.blockBusterWins ?? p.blockBusterWins ?? 0) : 0,
      alliances:   allianceCount,
      fanFav:      !!fanFavKey && norm(name) === fanFavKey,
      quit:        p.eliminated==='quit'||p.quit||false,
    };
    addRow(name, placement, stats);
  });
  if (sorted.length) document.getElementById('ru-cast-size').value=sorted.length;
  document.getElementById('ru-season-load-status').textContent='\u2705 Loaded '+sorted.length+' players';
  document.getElementById('ru-season-load-status').style.color='#4ade80';
}

// ── Init ─────────────────────────────────────────────────
function ruInit() {
  addRow();

  document.getElementById('ru-load-file-btn').addEventListener('click',()=>document.getElementById('ru-file-input').click());
  document.getElementById('ru-file-input').addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try {
        rankingsDB=JSON.parse(ev.target.result);
        const count=rankingsDB.rankings?.length||0;
        document.getElementById('ru-load-status').textContent='\u2705 Loaded \u2014 '+count+' players';
        document.getElementById('ru-load-status').style.color='#4ade80';
      } catch {
        document.getElementById('ru-load-status').textContent='\u274c Invalid JSON';
        document.getElementById('ru-load-status').style.color='#f87171';
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('ru-load-season-btn').addEventListener('click',()=>document.getElementById('ru-season-file-input').click());
  document.getElementById('ru-season-file-input').addEventListener('change',e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try { loadSeasonData(JSON.parse(ev.target.result)); }
      catch {
        document.getElementById('ru-season-load-status').textContent='\u274c Invalid JSON';
        document.getElementById('ru-season-load-status').style.color='#f87171';
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('ru-add-row-btn').addEventListener('click',()=>addRow());
  document.getElementById('ru-preview-btn').addEventListener('click',buildPreview);
  document.getElementById('ru-apply-btn').addEventListener('click',applyUpdates);
}
