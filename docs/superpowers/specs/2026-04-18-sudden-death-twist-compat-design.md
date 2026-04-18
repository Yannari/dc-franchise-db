# Sudden Death + Twist Challenge Compatibility Fix

## Problem

`episode.js:1548` — generic sudden death fires early:

```js
if (ep.isSuddenDeath && !ep.isOffTheChain) {
```

This runs `simulateIndividualChallenge` (generic) and returns early. The twist-specific challenge dispatcher (lines 1944-2060) never runs. So the twist's `simulate*()` function never fires, its data object (e.g. `ep.campCastaways`) never gets populated, and VP screens that check for that data show nothing.

**Result:** 8 of 10 post-merge twist challenges are broken when combined with sudden death. Only Off the Chain (explicitly exempted) and Triple Dog Dare / Slasher Night (return early before SD guard) work correctly.

### Broken Challenges

| Challenge | Flag | Data Object |
|---|---|---|
| Camp Castaways | `isCampCastaways` | `ep.campCastaways` |
| Lucky Hunt | `isLuckyHunt` | `ep.luckyHunt` |
| Hide and Be Sneaky | `isHideAndBeSneaky` | `ep.hideAndBeSneaky` |
| Wawanakwa Gone Wild | `isWawanakwaGoneWild` | `ep.wawanakwaGoneWild` |
| Tri-Armed Triathlon | `isTriArmedTriathlon` | `ep.triArmedTriathlon` |
| Say Uncle | `isSayUncle` | `ep.sayUncle` |
| Brunch of Disgustingness | `isBrunchOfDisgustingness` | `ep.brunch` |
| Basic Straining | `isBasicStraining` | `ep.basicStraining` |

### Unaffected Challenges

- **Off the Chain** — exempted from generic SD, handles SD internally (lines 1974-2043). Stays as-is.
- **Triple Dog Dare / Slasher Night** — run and return `ep` before SD guard (their own complete blocks at lines ~1367-1543).
- **Pre-merge challenges** — SD only fires post-merge in practice.

## Approach: Option B — Unified Post-Challenge SD Handler

Instead of adding per-challenge exemptions (Option A), invert the flow: let twist challenges run first, then read their results for SD elimination. One change point covers all challenges.

## Design

### 1. Modify SD Guard (line 1548)

Add a check for all post-merge twist challenge flags. When a twist challenge is active, skip the generic SD path — let the normal flow continue so the twist challenge dispatcher runs.

```js
const _hasTwistChallenge = ep.isCampCastaways || ep.isLuckyHunt || ep.isHideAndBeSneaky
  || ep.isWawanakwaGoneWild || ep.isTriArmedTriathlon || ep.isSayUncle
  || ep.isBrunchOfDisgustingness || ep.isBasicStraining;

if (ep.isSuddenDeath && !ep.isOffTheChain && !_hasTwistChallenge) {
  // ... existing generic SD logic unchanged ...
}
```

Off the Chain keeps its own exemption and internal handling.

### 2. New Unified SD Handler (after challenge dispatcher, before tribal)

Insert after the challenge dispatcher block (~line 2060) and before tribal council setup. This handles sudden death for all twist challenges uniformly.

**`chalPlacements` availability:** Only 4 of 8 affected challenges set `ep.chalPlacements` (Brunch, Hide and Be Sneaky, Off the Chain, Say Uncle). The other 4 (Camp Castaways, Lucky Hunt, Wawanakwa Gone Wild, Tri-Armed Triathlon, Basic Straining) only set `ep.chalMemberScores`. The handler derives placements from scores when `chalPlacements` is absent — no challenge file changes needed.

```js
// ── SUDDEN DEATH + TWIST CHALLENGE: eliminate last place from challenge results ──
if (ep.isSuddenDeath && _hasTwistChallenge) {
  // Derive placements from chalMemberScores if challenge didn't set chalPlacements
  if (!ep.chalPlacements?.length && ep.chalMemberScores && Object.keys(ep.chalMemberScores).length) {
    ep.chalPlacements = Object.entries(ep.chalMemberScores)
      .sort(([,a],[,b]) => b - a).map(([n]) => n);
  }

  const _sdLastPlace = ep.chalPlacements?.length
    ? ep.chalPlacements[ep.chalPlacements.length - 1]
    : null;

  if (_sdLastPlace) {
    ep.eliminated = _sdLastPlace;
    ep.suddenDeathEliminated = _sdLastPlace;
    ep.noTribal = true;

    // State mutation (mirrors generic SD branch at lines 1570-1604)
    handleAdvantageInheritance(_sdLastPlace, ep);
    gs.activePlayers = gs.activePlayers.filter(p => p !== _sdLastPlace);
    gs.eliminated.push(_sdLastPlace);
    if (gs.isMerged) gs.jury.push(_sdLastPlace);
    gs.advantages = gs.advantages.filter(a => a.holder !== _sdLastPlace);

    // Provider tracking
    if (seasonConfig.foodWater === 'enabled' && gs.currentProviders?.includes(_sdLastPlace)) {
      const _sdTribe = gs.isMerged ? (gs.mergeName || 'merge') : '';
      gs.providerVotedOutLastEp = { name: _sdLastPlace, tribeName: _sdTribe };
    }

    // Black vote — copy from generic SD (lines 1584-1603) and
    // Off the Chain SD handler (lines 1988-2006)
    if (seasonConfig.blackVote && seasonConfig.blackVote !== 'off' && gs.activePlayers.length > 4) {
      const _sdPool = gs.activePlayers.filter(p => p !== _sdLastPlace);
      if (_sdPool.length) {
        if (seasonConfig.blackVote === 'classic') {
          const _sdBvTarget = [..._sdPool].sort((a, b) =>
            getBond(_sdLastPlace, a) - getBond(_sdLastPlace, b))[0];
          if (_sdBvTarget) {
            if (!gs.blackVotes) gs.blackVotes = [];
            gs.blackVotes.push({
              from: _sdLastPlace, target: _sdBvTarget, ep: epNum, type: 'classic',
              reason: getBond(_sdLastPlace, _sdBvTarget) <= -2
                ? `grudge — ${_sdLastPlace} and ${_sdBvTarget} had bad blood`
                : `${_sdLastPlace} wants ${_sdBvTarget} gone — lowest bond of anyone left`
            });
            ep.blackVote = {
              from: _sdLastPlace, target: _sdBvTarget, type: 'classic',
              reason: getBond(_sdLastPlace, _sdBvTarget) <= -2 ? `grudge` : `lowest bond`
            };
          }
        } else if (seasonConfig.blackVote === 'modern') {
          const _sdBvRecip = [..._sdPool].sort((a, b) =>
            getBond(_sdLastPlace, b) - getBond(_sdLastPlace, a))[0];
          if (_sdBvRecip) {
            gs.advantages.push({
              holder: _sdBvRecip, type: 'extraVote', foundEp: epNum,
              fromBlackVote: true, giftedBy: _sdLastPlace
            });
            ep.blackVote = {
              from: _sdLastPlace, recipient: _sdBvRecip, type: 'modern',
              reason: `closest ally`
            };
          }
        }
      }
    }

    // Post-elimination bookkeeping
    updateChalRecord(ep);
    generateCampEvents(ep, 'post');
    updatePlayerStates(ep);
    checkPerceivedBondTriggers(ep);
    decayAllianceTrust(ep.num);
    recoverBonds(ep);
    updateSurvival(ep);
    gs.episode = epNum;
    if (gs.activePlayers.length <= seasonConfig.finaleSize) gs.phase = 'finale';

    // Episode history — all standard fields, mirroring Off the Chain SD handler
    // (lines 2017-2037). patchEpisodeHistory copies twist-specific data (e.g.
    // ep.campCastaways, ep.luckyHunt) automatically.
    gs.episodeHistory.push({
      num: epNum, eliminated: _sdLastPlace, riChoice: null,
      immunityWinner: ep.immunityWinner || null,
      challengeType: ep.challengeType || 'individual',
      challengeLabel: ep.challengeLabel,
      challengeCategory: ep.challengeCategory,
      challengeDesc: ep.challengeDesc,
      chalPlacements: ep.chalPlacements || [],
      chalMemberScores: ep.chalMemberScores || {},
      isMerge: ep.isMerge, isSuddenDeath: true, noTribal: true,
      suddenDeathEliminated: _sdLastPlace,
      votes: {}, alliances: [],
      twists: (ep.twists || []).map(t => ({...t})),
      tribesAtStart: (ep.tribesAtStart || []).map(t =>
        ({ name: t.name, members: [...t.members] })),
      campEvents: ep.campEvents || null,
      journey: ep.journey || null,
      idolFinds: ep.idolFinds || [],
      advantagesPreTribal: ep.advantagesPreTribal || null,
      summaryText: '',
      gsSnapshot: window.snapshotGameState(),
    });
    const stSD = generateSummaryText(ep);
    gs.episodeHistory[gs.episodeHistory.length - 1].summaryText = stSD;
    ep.summaryText = stSD;
    window.patchEpisodeHistory(ep);
    window.saveGameState();
    return ep;
  }
}
```

### 3. VP Screens

No VP changes needed:

- **SD announcement card** — already fires based on `ep.isSuddenDeath` flag in `buildVPScreens`.
- **Twist VP screens** — now populate because `simulate*()` actually runs and sets the data object.
- **Result:** Player sees SD stakes announcement + full twist challenge experience + SD elimination result.

### 4. Episode History

The twist-specific data (e.g. `ep.campCastaways`, `ep.luckyHunt`) is saved via `patchEpisodeHistory`, which copies all `ep.*` properties. The SD handler just needs to push a base history entry; `patchEpisodeHistory` handles the rest.

## Scope

### What Changes

| File | Change |
|---|---|
| `js/episode.js` line 1548 | Add `_hasTwistChallenge` variable + modify SD guard condition |
| `js/episode.js` after ~line 2060 | New unified SD handler block (~60 lines) |

### What Stays the Same

- Off the Chain's internal SD handling (lines 1967-2043)
- Triple Dog Dare / Slasher Night early returns
- Generic SD for non-twist episodes
- All twist `simulate*()` functions — unchanged
- All VP `rpBuild*()` functions — unchanged
- `voting.js`, `alliances.js`, all other modules — unchanged

## Edge Cases

1. **Challenge produces no `chalPlacements` AND no `chalMemberScores`** — `_sdLastPlace` is null, SD elimination skipped. Falls through to tribal (degraded but functional).
2. **Challenge only has `chalMemberScores`** — Handler derives `chalPlacements` by sorting scores descending. Last entry (lowest score) is eliminated. Covers Camp Castaways, Lucky Hunt, Wawanakwa Gone Wild, Tri-Armed Triathlon, Basic Straining.
3. **Brunch of Disgustingness** — team-based. `chalPlacements` is set as `[...winners, ...losers]`. Last place is worst performer on losing team.
3. **Hide and Be Sneaky** — can produce 1-2 immunity winners. SD reads `chalPlacements` last entry regardless.
4. **Basic Straining post-merge** — already produces individual placements. Last standing wins immunity; last eliminated from boot camp is SD-eliminated.
5. **`ep.extraImmune` players** — if a challenge grants extra immunity, those players are protected from being voted for but could still be last in `chalPlacements`. However, since SD bypasses tribal and uses placements directly, this is consistent: the challenge itself determines who performs worst.

## Testing

Manual testing in browser:
1. Configure a season with Sudden Death enabled
2. Add each twist challenge to a post-merge episode
3. Verify: twist challenge VP screens populate, SD eliminates last place, no tribal council
4. Verify: Off the Chain still works with its existing SD path
5. Verify: Non-twist SD episodes still use generic challenge
