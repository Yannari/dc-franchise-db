# Favorites Continuity and Cast Profile Import Design

## Purpose

Build trustworthy Cast Studio profiles for the twelve Favorites in the next
Fans vs Favorites season, then make those published profiles directly loadable
in the character editor. The feature must eliminate copy/paste without creating
a second personality or voice database that can drift from
`voice-profiles.json`.

The initial Favorites are Bowie, Mike, Millie, Thom, Grett, Gabby, James, Lake,
Yul, Natalia, Julia, and DJ. Thom is Disventure Camp's Tom in source canon and
inherits the simulator history stored under Thom in Seasons 11 and 13.

## Data Ownership

`franchise_roster.json` becomes the authored source of truth for a character's
complete reusable profile. Existing gameplay fields remain unchanged and the
record gains authored profile fields where available:

- identity: name, slug, gender, sexuality, ethnicity, nationality, descriptor;
- biography: birthdate, age fallback, hometown, occupation, backstory;
- characterization: personality, voice;
- gameplay interpretation: archetype and the nine valid stats;
- provenance: field-level source references and confidence/category metadata;
- casting interview, when deliberately authored.

`voice-profiles.json` remains a compatibility projection while existing episode
writing code consumes it. Its entry is generated from the roster record's
structured `voice` plus the existing composed biography lead. It is not edited
as an independent characterization source after migration.

Archived season JSON remains the source for simulator career history. Canon
biography must not absorb season deeds, alliances, placements, or later
development. Those belong to the continuity bible and franchise context.

## Fact Categories

Every researched value belongs to one of three categories:

1. **Source canon** — explicitly supported by an official source or a named
   reference page.
2. **Simulator continuity** — supported by archived season data in this
   repository.
3. **Interpretation** — a deliberate writing or gameplay inference, including
   suggested stats and evolved motivations.

Unsupported facts remain blank. In particular, the system must not manufacture
a birthdate, hometown, ethnicity, nationality, occupation, or sexuality and
present it as canon. A user may later author an alternate-continuity value, but
its provenance must identify it as authored rather than sourced.

## Roster Schema Extension

The roster record adds:

```json
{
  "voice": "Compact behavioral and dialogue guide.",
  "profileSources": {
    "personality": [
      { "label": "Total Drama Wiki — Bowie", "url": "https://totaldrama.fandom.com/wiki/Bowie", "kind": "source-canon" }
    ],
    "birthdate": [],
    "stats": [
      { "label": "Gameplay interpretation", "kind": "interpretation" }
    ]
  }
}
```

`profileSources` is optional and field-keyed. Existing roster entries remain
valid. Source records are concise citations, not copied wiki passages. A field
with no verified source uses an empty value and may carry an explanatory source
note only when useful.

## Cast Studio Experience

When an existing roster character is opened, the editor continues to show the
merged local/published draft. A new **Load published profile** action appears
for characters with a published roster record.

The action opens a preview rather than writing immediately. The preview groups
fields into Identity, Biography, Characterization, Gameplay, and Interview. For
each differing field it shows:

- current value;
- published value;
- provenance category and source label;
- a checkbox controlling whether that field is applied.

Blank current fields are selected by default. Nonblank conflicts are unselected
by default. **Select all**, **Fill blanks**, **Cancel**, and **Apply selected**
controls make the operation explicit. Applying changes updates only the Studio
draft; the user must still press **Save character**. Cancel leaves the draft
untouched.

The initial implementation does not fetch or scrape arbitrary wiki URLs in the
browser. Live scraping is too fragile across layout changes, CORS rules, and
community edits. Research is curated into the published roster and remains
reviewable in git.

## Voice Compatibility Projection

Studio loading follows this order:

1. local Studio draft, for unsaved work;
2. structured roster fields, including `voice`;
3. legacy `voice-profiles.json` entry, only when the roster lacks `voice`;
4. existing legacy parsing fallbacks.

Saving a character writes the structured roster record first. Repository
publishing then derives the matching compatibility voice entry with the
existing `composeVoice` path. Export performs the same projection. This keeps
older consumers operational while preventing two authored copies.

Migration is incremental. Characters without a roster `voice` continue to use
the legacy file. Once migrated, a character's roster `voice` always wins.

## Continuity Bible

A separate Favorites continuity document is produced from the fourteen
archived Total Drama seasons and researched source canon. Each character entry
contains:

- canon baseline and behavioral boundaries;
- chronological simulator appearances and placements;
- alliances, rivalries, betrayals, romances, debts, and signature moments;
- development from source canon through the latest simulator appearance;
- unresolved hooks entering Fans vs Favorites;
- speech rhythm, vocabulary, emotional tells, confessional behavior, and
  actions the character would not take;
- relationship notes involving other members of the twelve-person Favorites
  cast.

The bible is writing context, not profile biography. A compact franchise-context
projection may be generated from it for the episode worker, while the full bible
remains a reference artifact.

## Data Flow

1. Research source canon and record short citations.
2. Extract each Favorite's archived season history by exact roster identity.
3. Resolve the Thom/Tom alias only in the continuity layer: Tom canon plus Thom
   Seasons 11/13. Do not merge the separate archived `Tom` contestant record.
4. Author the full continuity bible.
5. Update the twelve roster profiles with verified facts, characterization,
   interpretation, and provenance.
6. Cast Studio loads or previews those published records.
7. Saving/publishing derives the legacy voice projection.
8. Episode writing receives compact voice plus returning-player history without
   confusing biography with gameplay deeds.

## Conflict and Error Handling

- Name matching uses the stable slug, never display-name fuzzy matching.
- Profile import never overwrites a nonblank field silently.
- Invalid stats are rejected; only the nine project stat keys are accepted and
  values remain within the existing range.
- Invalid ISO birthdates are rejected. Unknown dates remain blank.
- Unknown provenance kinds are displayed as unverified and are not selected by
  default.
- A missing published record disables the import action with a clear message.
- Failure to update the compatibility voice file must not erase the roster save;
  Studio reports the partial failure as it does for current repository writes.

## Verification

Automated tests cover:

- legacy roster records still loading without new fields;
- roster `voice` taking precedence over the legacy voice file;
- published-profile diffing and fill-blanks defaults;
- selective application preserving unchecked draft fields;
- rejection of invented stat keys and invalid dates;
- voice export deriving the compatibility entry from roster `voice`;
- Thom source/career identity mapping remaining explicit and not merging Tom's
  separate Season 7 record.

Manual browser verification covers opening each Favorite, previewing its
published profile, applying only blanks, saving, reloading, and confirming that
the episode writer receives the same composed voice.

## Non-Goals

- Live wiki scraping or automatic acceptance of community-edited facts.
- Replacing archived season data with prose summaries.
- Importing career history into pre-show backstory.
- Automatically overwriting user-authored profile edits.
- Removing `voice-profiles.json` in this iteration.
- Inventing missing canon demographics or dates.

