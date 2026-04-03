# Jury Roundtable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add jury roundtable lobbying mechanics to the jury-elimination twist — passionate jurors campaign for/against active players, shifting persuadable jurors' bonds before the jury elimination vote.

**Architecture:** New `simulateJuryRoundtable(ep)` function generates lobbying data and applies bond shifts. `rpBuildJuryLife(ep)` is extended with a roundtable section at the bottom. Data saved to `ep.juryRoundtable` and patched to episode history.

**Tech Stack:** Vanilla JS, single-file app (`simulator.html`)

**Spec:** `docs/superpowers/specs/2026-04-02-jury-roundtable-design.md`

---

### Task 1: simulateJuryRoundtable Engine Function

**Files:**
- Modify: `simulator.html` — add new function near the jury-elimination twist handler (~line 18465)

- [ ] **Step 1: Add simulateJuryRoundtable function**

Insert BEFORE the jury-elimination twist handler (before the line `// ── TWIST: jury-elimination` at ~line 18465):

```javascript
// ── Jury Roundtable: lobbying & persuasion among jurors before jury elimination vote ──
function simulateJuryRoundtable(ep) {
  const jurors = [...new Set(gs.eliminated || [])];
  const activePlayers = gs.activePlayers || [];
  if (jurors.length < 3 || activePlayers.length < 2) return null;

  const lobbyists = [];
  const shifts = [];
  const pushbacks = [];

  // ── Step 1: Identify lobbyists (proportional activation) ──
  jurors.forEach(juror => {
    const jS = pStats(juror);
    // Find strongest positive and negative bond with active players
    let bestBond = -Infinity, worstBond = Infinity, bestPlayer = null, worstPlayer = null;
    activePlayers.forEach(p => {
      const b = getBond(juror, p);
      if (b > bestBond) { bestBond = b; bestPlayer = p; }
      if (b < worstBond) { worstBond = b; worstPlayer = p; }
    });
    const strongestMag = Math.max(Math.abs(bestBond), Math.abs(worstBond));
    const lobbyChance = strongestMag * 0.08 + jS.boldness * 0.03;
    if (Math.random() >= lobbyChance) return;

    // Pick agenda: champion (positive) or oppose (negative)
    const type = Math.abs(bestBond) >= Math.abs(worstBond) && bestBond > 0 ? 'champion' : 'oppose';
    const target = type === 'champion' ? bestPlayer : worstPlayer;
    if (!target) return;
    lobbyists.push({ juror, type, target, attempts: 0, successes: 0 });
  });

  // ── Step 2: Identify persuadable jurors (proportional margin) ──
  const persuadable = new Set();
  const alreadyShifted = new Set();
  jurors.forEach(juror => {
    if (lobbyists.some(l => l.juror === juror)) return; // lobbyists aren't persuadable
    const jS = pStats(juror);
    const bonds = activePlayers.map(p => ({ name: p, bond: getBond(juror, p) }))
      .sort((a, b) => b.bond - a.bond);
    if (bonds.length < 2) return;
    const margin = bonds[0].bond - bonds[1].bond;
    const threshold = 2.0 - jS.social * 0.08;
    if (margin < threshold) persuadable.add(juror);
  });

  // ── Step 3: Lobbying rolls (all proportional) ──
  lobbyists.forEach(lobby => {
    const lS = pStats(lobby.juror);
    persuadable.forEach(targetJuror => {
      if (alreadyShifted.has(targetJuror)) return; // cap: one shift per juror
      lobby.attempts++;
      const tS = pStats(targetJuror);

      // Persuasion chance
      const persuasionChance = lS.social * 0.04 + Math.max(0, getBond(lobby.juror, targetJuror)) * 0.05;
      if (Math.random() >= persuasionChance) return;

      // Pushback resistance
      const existingBond = getBond(targetJuror, lobby.target);
      const resistance = Math.abs(existingBond) * 0.12 + tS.strategic * 0.03;
      if (Math.random() < resistance) {
        pushbacks.push({ lobbyist: lobby.juror, resistedBy: targetJuror, finalist: lobby.target,
          reason: Math.abs(existingBond) > tS.strategic * 0.25 ? 'strong-opinion' : 'strategic-mind' });
        return;
      }

      // Success — shift bond
      const delta = lobby.type === 'champion'
        ? (0.15 + lS.social * 0.03)
        : -(0.15 + lS.social * 0.03);
      addBond(targetJuror, lobby.target, delta);
      alreadyShifted.add(targetJuror);
      lobby.successes++;
      shifts.push({ lobbyist: lobby.juror, persuaded: targetJuror, finalist: lobby.target,
        direction: lobby.type === 'champion' ? 'for' : 'against', bondDelta: delta });
    });
  });

  // ── Step 4: Generate discussion events per active player ──
  const discussions = activePlayers.map(player => {
    const evts = [];
    const _pr = pronouns(player);

    // Lobbyists who targeted this player
    const champLobbyists = lobbyists.filter(l => l.target === player && l.type === 'champion');
    const opposeLobbyists = lobbyists.filter(l => l.target === player && l.type === 'oppose');

    // Champion arguments
    champLobbyists.forEach(l => {
      const lPr = pronouns(l.juror);
      const lS = pStats(l.juror);
      const text = lS.boldness >= 7
        ? `${l.juror} slams the table. "${player} played the best game out here. Period. If you can't see that, you weren't paying attention."`
        : lS.strategic >= 7
        ? `${l.juror} lays out ${_pr.posAdj} case methodically. "${player} made moves when it counted. The numbers don't lie — ${_pr.sub} earned this."`
        : lS.social >= 7
        ? `${l.juror} gets personal. "I know ${player}. ${_pr.Sub} ${_pr.sub === 'they' ? 'are' : 'is'} a good person who played a real game. That matters to me."`
        : lS.loyalty >= 7
        ? `${l.juror} appeals to honor. "${player} played with integrity. ${_pr.Sub} didn't backstab ${_pr.posAdj} way here. That should count for something."`
        : `${l.juror} makes ${lPr.posAdj} pitch for ${player}. "${player} deserves this. I've seen enough to know."`;
      evts.push({ juror: l.juror, type: 'support', text, badge: 'IN FAVOR', badgeClass: 'win', players: [l.juror, player] });
    });

    // Oppose arguments
    opposeLobbyists.forEach(l => {
      const lPr = pronouns(l.juror);
      const lS = pStats(l.juror);
      const text = lS.boldness >= 7
        ? `${l.juror} doesn't hold back. "${player} doesn't deserve to sit in those chairs. And I'll tell anyone who'll listen exactly why."`
        : lS.temperament <= 4
        ? `${l.juror} can barely contain ${lPr.ref}. "Don't even get me started on ${player}. What ${_pr.sub} did to me — to US — that's not gameplay."`
        : lS.strategic >= 7
        ? `${l.juror} breaks it down. "${player} rode coattails. ${_pr.Sub} didn't make a single real decision all game. I'm not rewarding that."`
        : `${l.juror} shakes ${lPr.posAdj} head. "I've had a lot of time to think about ${player}'s game. It wasn't as impressive as ${_pr.sub} think${_pr.sub === 'they' ? '' : 's'}."`; 
      evts.push({ juror: l.juror, type: 'oppose', text, badge: 'AGAINST', badgeClass: 'bad', players: [l.juror, player] });
    });

    // Lobby outcomes for this player
    shifts.filter(s => s.finalist === player).forEach(s => {
      const sPr = pronouns(s.persuaded);
      const dir = s.direction === 'for' ? 'warming up to' : 'cooling on';
      evts.push({ juror: s.persuaded, type: 'lobbied', 
        text: `${s.persuaded} listens to ${s.lobbyist}'s argument. ${sPr.Sub} ${sPr.sub === 'they' ? 'don\'t' : 'doesn\'t'} say much — but ${sPr.posAdj} expression says ${sPr.sub} ${sPr.sub === 'they' ? 'are' : 'is'} ${dir} ${player}.`,
        badge: 'LOBBIED', badgeClass: 'gold', players: [s.persuaded, player] });
    });

    pushbacks.filter(pb => pb.finalist === player).forEach(pb => {
      const pbPr = pronouns(pb.resistedBy);
      const pbS = pStats(pb.resistedBy);
      const text = pb.reason === 'strategic-mind'
        ? `${pb.resistedBy} cuts in. "I appreciate the pitch, but I'll make up my own mind about ${player}. I've been watching the game too."`
        : `${pb.resistedBy} pushes back. "I know how I feel about ${player}. You're not changing that."`;
      evts.push({ juror: pb.resistedBy, type: 'pushback', text, badge: 'PUSHED BACK', badgeClass: 'bad', players: [pb.resistedBy, player] });
    });

    // General jury sentiment (fill to at least 2 events if not enough lobby activity)
    if (evts.length < 2) {
      const supporters = jurors.filter(j => getBond(j, player) >= 2 && !evts.some(e => e.juror === j));
      const detractors = jurors.filter(j => getBond(j, player) <= -2 && !evts.some(e => e.juror === j));
      if (supporters.length && evts.length < 2) {
        const s = supporters[0];
        const sPr = pronouns(s);
        evts.push({ juror: s, type: 'support', 
          text: `${s} speaks up. "I've got nothing bad to say about ${player}. ${_pr.Sub} played a solid game."`,
          badge: 'IN FAVOR', badgeClass: 'win', players: [s, player] });
      }
      if (detractors.length && evts.length < 2) {
        const d = detractors[0];
        evts.push({ juror: d, type: 'oppose',
          text: `${d} folds ${pronouns(d).posAdj} arms. "${player} and I have unfinished business. I don't see a winner there."`,
          badge: 'AGAINST', badgeClass: 'bad', players: [d, player] });
      }
    }

    return { player, events: evts.slice(0, 4) }; // cap at 4 events per player
  }).filter(d => d.events.length > 0);

  const result = { activePlayers: activePlayers.slice(), lobbyists, shifts, pushbacks, discussions };
  ep.juryRoundtable = result;
  return result;
}
```

- [ ] **Step 2: Call simulateJuryRoundtable from the jury-elimination twist handler**

Find the jury-elimination twist block (~line 18465). The roundtable should fire BEFORE the jury votes, so the bond shifts influence the vote. Insert the call at the START of the block, right after the `if (juryElimTw && gs.eliminated.length > 0) {` opening brace and before the `const immune = ep.immunityWinner;` line:

```javascript
    // Jury roundtable: lobbying and persuasion among jurors before the vote
    simulateJuryRoundtable(ep);
```

- [ ] **Step 3: Commit**

```bash
git add simulator.html
git commit -m "feat: simulateJuryRoundtable engine — lobbying, persuasion, bond shifts"
```

---

### Task 2: Patch Episode History

**Files:**
- Modify: `simulator.html` — `patchEpisodeHistory` function (~line 22566-22639)

- [ ] **Step 1: Add juryRoundtable to patchEpisodeHistory**

Find `patchEpisodeHistory`. Near the end of the function (around the last batch of field patches), add:

```javascript
  if (ep.juryRoundtable) h.juryRoundtable = ep.juryRoundtable;
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: save juryRoundtable to episode history"
```

---

### Task 3: VP — Extend rpBuildJuryLife with Roundtable Section

**Files:**
- Modify: `simulator.html` — `rpBuildJuryLife` function (~line 35125-35607)

- [ ] **Step 1: Add roundtable section before the closing div**

Find the end of `rpBuildJuryLife`. The last lines are:

```javascript
  html += `</div>`;
  return html;
}
```

Replace those last 3 lines with the roundtable section appended before the close:

```javascript
  // ── JURY ROUNDTABLE section ──
  const rt = ep.juryRoundtable;
  if (rt && rt.discussions?.length) {
    html += `<div style="margin-top:32px;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px">
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;margin-bottom:4px;text-transform:uppercase">Jury Roundtable</div>
      <div style="text-align:center;font-size:11px;color:var(--muted);margin-bottom:20px;letter-spacing:1.5px;text-transform:uppercase">The jury debates the remaining players</div>`;

    rt.discussions.forEach(disc => {
      // Active player header
      html += `<div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.06)">
          ${rpPortrait(disc.player)}
          <div>
            <div style="font-size:15px;font-weight:700;color:#cdd9e5">${disc.player}</div>
            <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Under Discussion</div>
          </div>
        </div>`;

      disc.events.forEach(evt => {
        const badgeColors = {
          bad: 'color:var(--accent-fire);background:rgba(248,81,73,0.1);border-color:rgba(248,81,73,0.25)',
          win: 'color:#3fb950;background:rgba(63,185,80,0.1);border-color:rgba(63,185,80,0.25)',
          gold: 'color:#e3b341;background:rgba(227,179,65,0.1);border-color:rgba(227,179,65,0.25)',
          '': 'color:var(--muted);background:var(--surface2);border-color:var(--border)',
        };
        const badgeStyle = badgeColors[evt.badgeClass] || badgeColors[''];
        html += `<div style="margin-bottom:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
            <span style="font-size:9px;font-weight:700;letter-spacing:1px;padding:2px 8px;border-radius:4px;border:1px solid;${badgeStyle}">${evt.badge}</span>
          </div>
          <div style="font-size:13px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
        </div>`;
      });

      html += `</div>`; // close player discussion block
    });

    // Closing summary: The Verdict
    const netShifts = {};
    (rt.shifts || []).forEach(s => {
      netShifts[s.finalist] = (netShifts[s.finalist] || 0) + (s.direction === 'for' ? 1 : -1);
    });
    const verdictLines = Object.entries(netShifts)
      .filter(([, v]) => v !== 0)
      .map(([name, v]) => v > 0 ? `${name} gained ${v} supporter${v > 1 ? 's' : ''}` : `${name} lost ${Math.abs(v)} supporter${Math.abs(v) > 1 ? 's' : ''}`)
      .join('. ');
    if (verdictLines) {
      html += `<div style="margin-top:16px;text-align:center;font-size:12px;color:var(--muted);font-style:italic;letter-spacing:0.5px">
        The Verdict: ${verdictLines}.
      </div>`;
    }

    html += `</div>`; // close roundtable container
  }

  html += `</div>`;
  return html;
}
```

- [ ] **Step 2: Commit**

```bash
git add simulator.html
git commit -m "feat: VP jury roundtable section in rpBuildJuryLife — debates, lobbying, verdict"
```

---

### Task 4: Update ideas_probabilistic_moments.txt

**Files:**
- Modify: `DATA_SEASON/ideas_probabilistic_moments.txt`

- [ ] **Step 1: Mark #11 as done**

Find the `[11] JURY BITTER CASCADE` entry (around line 161). Replace the entry with:

```
[DONE] #11 JURY BITTER CASCADE / ROUNDTABLE — implemented via simulateJuryRoundtable(ep).
  Fires during jury-elimination twist episodes. Lobbyists identified proportionally
  (abs(bond) * 0.08 + boldness * 0.03). Persuadable jurors detected by margin threshold
  (2.0 - social * 0.08). Persuasion: social * 0.04 + bond * 0.05, pushback resistance:
  abs(bond) * 0.12 + strategic * 0.03. Bond shift on success: 0.15 + social * 0.03.
  VP: roundtable section appended to rpBuildJuryLife with finalist-by-finalist debate,
  badges (IN FAVOR/AGAINST/LOBBIED/PUSHED BACK), personality-driven arguments.
  ep.juryRoundtable saved to history.
```

- [ ] **Step 2: Commit**

```bash
git add DATA_SEASON/ideas_probabilistic_moments.txt
git commit -m "docs: mark #11 Jury Bitter Cascade as done"
```

---

### Task 5: Verify and Test

- [ ] **Step 1: Open simulator.html in browser**

Create a season config with `jury-elimination` twist scheduled on an episode after at least 5-6 eliminations (so there's a decent jury pool).

- [ ] **Step 2: Run to the jury-elimination episode and check VP**

Open the VP for that episode. Look for:
- Jury Life screen loads without errors
- "JURY ROUNDTABLE" section appears below the existing jury house events
- Active players listed with discussion blocks
- Juror quotes with IN FAVOR (green), AGAINST (red), LOBBIED (gold), PUSHED BACK (red) badges
- "The Verdict" summary at the bottom showing net shifts
- Bond shifts actually affect the jury elimination vote (check vote results vs what roundtable showed)

- [ ] **Step 3: Verify edge cases**

- Season with only 2 eliminated players (should skip roundtable — needs >= 3 jurors)
- Season with no strong bonds (few or no lobbyists activate — roundtable still generates with general sentiment)
- Multiple jury-elimination twists in same season (each generates its own roundtable)

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add simulator.html
git commit -m "fix: jury roundtable polish from testing"
```
