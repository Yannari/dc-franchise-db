# Show-Scoped Player Portraits Design

**Date:** 2026-09-01

**Status:** Proposed

## Objective

Replace the special-case normal/`-returnee` avatar system with an unlimited portrait catalog. A player may have any number of portraits for Total Drama, Big Brother, The Traitors, and future shows. Each season appearance records the portrait used for that appearance, and every simulator, current-season, season-wiki, and player-profile surface renders that recorded choice.

Returning-player status remains gameplay and continuity metadata. It never chooses artwork.

## User experience

### Asset preparation

Portrait files continue to live in `assets/avatars/`. Files are never uploaded into browser storage and are never embedded as base64. PNG remains the preferred format, but the catalog stores the complete filename so `.webp`, `.jpg`, and `.gif` remain possible.

The durable catalog is `assets/avatars/portrait-catalog.json`. Each entry identifies the player, show, stable portrait ID, label, and filename. Adding art means placing the file in `assets/avatars/` and adding one catalog entry. A validation/generation command checks that every registered file exists and reports unregistered candidate files; it never silently renames IDs.

### Cast builder

After a roster player and season show are selected, the cast form displays a Portrait section:

- portraits are filtered to the current `seasonFormat()`;
- show-specific portraits appear first, followed by the player's global portrait;
- every option is a thumbnail with its authored label;
- the user may select any registered option;
- the choice is stored as `avatarId` on that season's cast-member record;
- `Returning Player` remains a separate checkbox with no visual side effect;
- when no show-specific portrait exists, the global default is selected and the UI says why;
- an unavailable registered file is disabled and visibly marked `Missing file`.

There is no maximum number of portraits per show.

### Wiki and current-season behavior

- The live simulator and `current-season.html` use the active season's selected portrait.
- Season pages and episode cards use the portrait stored for that historical season.
- `player.html` opens with the most recent appearance's portrait.
- Selecting a season on the player page changes the large hero portrait to that season's recorded portrait.
- Every season row/card on the profile uses its own recorded portrait.
- A player who appeared five times on the same show may therefore display five different looks across the career timeline.
- Links continue to use the canonical player slug. A portrait filename or ID never becomes player identity.

## Data model

### Portrait catalog

`assets/avatars/portrait-catalog.json` uses this schema:

```json
{
  "schemaVersion": 1,
  "players": {
    "bowie": {
      "defaults": {
        "global": "base",
        "total-drama": "td-original",
        "big-brother": "bb-1",
        "traitors": "tr-castle"
      },
      "portraits": [
        {
          "id": "base",
          "show": "global",
          "label": "Profile default",
          "file": "bowie.png"
        },
        {
          "id": "td-return",
          "show": "total-drama",
          "label": "Second Total Drama appearance",
          "file": "bowie-returnee.png"
        },
        {
          "id": "tr-castle",
          "show": "traitors",
          "label": "Castle outfit",
          "file": "bowie-traitors.png"
        }
      ]
    }
  }
}
```

Rules:

- portrait IDs are stable within one player and must not be reused for another file;
- `show` is `global` or a key from `js/shows.js`;
- `file` is a basename only and may not contain `/`, `\\`, `..`, a URL, or a data URI;
- each player has exactly one valid global default;
- a show default is optional and must reference a portrait for that show or `global`;
- duplicate IDs, duplicate player slugs, unknown shows, missing files, and unsafe paths are validation errors;
- changing a label is safe; changing the file behind a used ID changes history and requires an explicit migration;
- deleting an ID used by a saved season is forbidden by validation unless an alias is retained.

### Season cast assignment

The player object used for a season stores identity and appearance separately:

```json
{
  "name": "Bowie",
  "slug": "bowie",
  "isReturnee": true,
  "avatarId": "tr-castle",
  "avatarFile": "bowie-traitors.png"
}
```

`avatarId` is the durable selection. `avatarFile` is a denormalized snapshot written when the season begins and carried into exports. The snapshot ensures an archived season can still render if a catalog is unavailable. The resolver verifies that the catalog ID and snapshot agree when both exist and prefers the season snapshot for historical rendering.

The canonical `slug` is never rewritten to an effective portrait slug. The current `baseSlug`/mutated `slug` cache is retired after legacy migration.

### Season documents and career records

Every placement/cast row gains:

```json
{
  "name": "Bowie",
  "playerSlug": "bowie",
  "avatarId": "tr-castle",
  "avatarFile": "bowie-traitors.png"
}
```

Career `seasonDetails[]` repeats `avatarId` and `avatarFile`. This is intentional denormalization: the player wiki must render historical appearances without opening the original simulator save.

No aggregate career-level avatar overwrites season assignments. A derived `latestAvatarFile` may be emitted for list pages, but it is recomputed from the latest appearance and is never authoritative.

## Central resolver

Create `js/avatar-registry.js` as the only portrait-resolution authority. It imports show identity from `js/shows.js` and exposes:

```js
loadPortraitCatalog(): Promise<PortraitCatalog>
validatePortraitCatalog(catalog, availableFiles): PortraitProblem[]
portraitOptions(playerSlug, show): PortraitOption[]
resolvePortrait({ playerSlug, show, avatarId, avatarFile }): ResolvedPortrait
avatarUrl(context): string
legacyPortraitSelection(player, show): { avatarId, avatarFile }
```

Resolution order:

1. a safe historical `avatarFile` snapshot;
2. the requested `avatarId` in that player's catalog;
3. the player's default for the requested show;
4. the player's global default;
5. legacy `assets/avatars/{playerSlug}.png`;
6. initials/emoji fallback supplied by the caller.

`ResolvedPortrait` includes `{ playerSlug, avatarId, file, url, source, missing }`. `source` is one of `season-snapshot`, `selected-id`, `show-default`, `global-default`, `legacy-default`, or `fallback`. Screens may display diagnostics in development mode but never expose internal IDs as prose.

All new rendering code calls `avatarUrl()` or consumes `ResolvedPortrait`. No new template may concatenate `assets/avatars/${slug}.png` directly.

## Persistence and data flow

1. `franchise_roster.json` remains the source of player identity and biography.
2. `portrait-catalog.json` remains the source of available artwork and defaults.
3. The cast builder copies `avatarId` and `avatarFile` into the active cast member.
4. `savestate.js` preserves both fields in saves, snapshots, and loaded casts.
5. Season-start/finalization code copies both fields into episode/season records.
6. `stats-export.js` includes both fields in placements, cast rows, and `seasonDetails`.
7. `wiki.js` passes both fields into dossier career seasons instead of reconstructing from `playerSlug`.
8. `current-season.html`, `season_ref.html`, and `player.html` resolve the stored assignment.

The player slug continues to identify the profile URL. The show registry continues to identify the show. Artwork does not become a third identity system.

## Legacy migration

Existing data has three relevant shapes:

1. base `slug` only;
2. `baseSlug` plus a mutated `{slug}-returnee` effective slug;
3. `isReturnee: true` plus `_returneeAvatarOk`.

On load, `legacyPortraitSelection()` performs a one-way in-memory repair:

- canonical player identity becomes `baseSlug || slug without -returnee`;
- if the stored slug ends in `-returnee`, select the catalog entry whose file is `{base}-returnee.png`;
- otherwise, for an old save only, `isReturnee && _returneeAvatarOk` may select that legacy entry;
- if no such catalog entry exists, select the show/global default;
- write `avatarId` and `avatarFile` on the repaired player;
- remove `_returneeAvatarOk`; stop mutating `slug`;
- preserve `isReturnee` unchanged.

The compatibility path exists only for records without `avatarId`. Once a user explicitly selects a portrait, changing `isReturnee` must not change it.

The existing `returnee-manifest.json` and `tools/gen-returnee-manifest.mjs` remain temporarily for old releases, then are removed once all consumers use the general catalog.

## Screen integration

### Simulator and VP

`rpPortrait`, `miniAvatar`, cast cards, relationship editors, challenge screens, voting screens, ceremonies, and Traitors screens must all consume the active cast member's resolved portrait. The implementation inventory must search for direct `assets/avatars/` concatenation and either route the site through the central helper or prove the image is a host/non-player asset.

### Current season

`current-season.html` currently derives many images from `slugify(name)`. It must build a name-to-appearance map from the live snapshot's cast/placements and use one helper for every player image. Host aliases remain separate.

### Player profile and wiki

`player.html` must keep `activeAppearance` state. The initial appearance is the newest recorded season. Changing the selected show/season updates:

- the hero image and alt text;
- the visual season indicator;
- any appearance-scoped summary already controlled by that selector.

The profile's season cards render their own `avatarFile`. The Wiki tab uses the same dossier data and resolver; it does not maintain a second portrait rule.

### Season and franchise pages

`season_ref.html`, `seasons.html`, rankings, devotees, awards, and compare pages use `latestAvatarFile` when showing a career-level person and the season row's `avatarFile` when showing an appearance. Existing databases without these fields fall back safely.

## Catalog maintenance

Create `tools/gen-avatar-manifest.mjs` with two modes:

- `--check`: validate catalog schema, shows, safe paths, duplicate IDs, defaults, missing files, and references in `data/seasons/*-data.json`;
- `--write-files`: regenerate a simple available-file inventory used by the browser to mark missing assets without 404 probes.

The tool does not invent catalog entries from filenames because stable IDs and human labels cannot be inferred reliably. It reports unregistered files as informational candidates.

`docs/ADDING-A-SHOW.md` gains a portrait note: a new show needs no avatar code branch; its registry key becomes valid automatically in portrait catalog entries and the cast-builder filter.

## Error handling and fallbacks

- Unknown `avatarId`: use the safe snapshot, then show/global default, and record a development warning.
- Missing snapshot file: try catalog/default fallback and mark the option missing in the builder.
- Unknown show: treat as `global` only; never silently treat it as Total Drama.
- Unsafe filename: reject it and render fallback initials.
- Catalog load failure: historical snapshot or legacy base portrait still renders.
- Old database row: infer the legacy base portrait without modifying the database on read.
- Duplicate label: allowed; duplicate ID: rejected.
- Deleted historical portrait: catalog validation fails before release.

## Accessibility

- Thumbnail choices are a keyboard-navigable radio group.
- Every choice has a text label containing player, show, and portrait label.
- Selection is not communicated by color alone.
- Missing images remain readable as initials and `Missing file` text.
- Hero portrait changes announce the selected season and portrait through an `aria-live="polite"` status.
- Motion is not required for the picker or portrait transition.

## Testing and release gates

### Unit tests

- resolution order for selected ID, show default, global default, legacy default, and initials fallback;
- show isolation: a Big Brother choice never appears in The Traitors without an explicit shared/global entry;
- unlimited portraits for one player/show;
- unknown show does not fall back to Total Drama;
- unsafe paths are rejected;
- legacy `-returnee` saves migrate once and preserve `isReturnee` independently;
- toggling `isReturnee` after explicit selection does not change the portrait;
- catalog validator catches missing files, unknown shows, duplicate IDs, and deleted historical references.

### Integration tests

- cast-builder filter shows only current-show plus global portraits;
- selected `avatarId` survives save/load and season simulation;
- season export writes `avatarId` and `avatarFile` to placements and career season details;
- current-season player images use the active season assignment;
- player profile opens on latest appearance and changes hero art when another season is selected;
- each career season card uses its own portrait;
- wiki and profile tabs agree;
- old seasons with only `playerSlug` continue rendering base art;
- returnee status affects continuity but not artwork.

### Repository audit

Run a direct-path inventory. Any player-rendering hit must be migrated or explicitly allowlisted as a host, decorative asset, or backward-compatible fallback:

```bash
rg -n "assets/avatars/.*\\$\\{|assets/avatars/.*slug|slugify\\(name\\).*png" js *.html
```

Release is blocked if:

- a current player screen reconstructs a portrait from name/slug while season appearance data is available;
- a historical season loses its recorded portrait after a newer season changes defaults;
- toggling returning-player status changes art;
- a show-specific portrait leaks into another show;
- catalog validation or project tests fail.

## Documentation and source-of-truth rules

- `js/shows.js`: show identity and valid show keys.
- `franchise_roster.json`: player identity and biography.
- `assets/avatars/portrait-catalog.json`: available portraits and defaults.
- season cast/save/export rows: the portrait used for that appearance.
- `js/avatar-registry.js`: resolution and migration behavior.

No other file may own a hard-coded show list or a competing portrait-selection rule.

