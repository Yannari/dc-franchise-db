"""
DC Franchise Database — JSON Schema Validator
==============================================
Validates all JSON data files against their schemas.

Run from the repo root:
  python tools/validate_schemas.py

Install dependency if needed:
  pip install jsonschema

-------------------------------------------------------------------------------
CROSS-FORMAT AGGREGATE CONTRACT  (read this before "fixing" a number mismatch)
-------------------------------------------------------------------------------
The database now holds more than one show. Every season and every player season
detail carries a `format` tag ("total-drama" or "big-brother"), and that tag is
REQUIRED — a season with no show can never ship.

Because of that, a player object holds numbers at two different altitudes, and
they are NOT the same number:

  * TOP-LEVEL career fields on a player (`totalChallengeWins`,
    `totalImmunityWins`, `totalRewardWins`, `totalVotesAgainst`,
    `totalIdolsFound`, `totalJuryVotes`, `wins`, `totalSeasons`,
    `bestPlacement`, `avgPlacement`) are CROSS-FORMAT AGGREGATES. They span
    every show the player has ever appeared in. `js/stats-export.js`
    additionally folds Big Brother COMPETITION wins into top-level
    `totalChallengeWins`.

  * PER-SHOW numbers live in `byShow[<format>]`, and each bucket is SUMMED from
    that show's season details only.

Therefore, for any player who has played more than one show, top-level totals
will legitimately EXCEED `byShow["total-drama"]`. That is correct data, not a
bug. A page must pick one altitude and say which: use `byShow[fmt]` when the
context is a single show, and the top-level fields when the context is the
player's whole career.

This validator deliberately does NOT assert that top-level == sum(byShow).
Such a rule would be wrong by construction. (Separately, `tools/audit_data.py`
tracks genuine top-level-vs-seasonDetails disagreements within a single show.)
-------------------------------------------------------------------------------
"""

import json
import os
import sys
import glob

# Force UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

try:
    import jsonschema
    from jsonschema import validate, ValidationError
except ImportError:
    print("ERROR: jsonschema not installed.")
    print("Run: pip install jsonschema")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors_found = 0


def describe(data, path):
    """Walk `data` along `path` and name the nearest identifiable record, so a
    failure reads 'season 1 "Total Drama Island"' instead of 'seasons -> 0'."""
    node = data
    label = ""
    for part in path:
        try:
            node = node[part]
        except (KeyError, IndexError, TypeError):
            break
        if isinstance(node, dict):
            bits = []
            for key in ("seasonNumber", "season", "id", "name", "title", "playerSlug"):
                if key in node and isinstance(node[key], (str, int)):
                    bits.append(f"{key}={node[key]!r}")
                if len(bits) == 2:
                    break
            if bits:
                label = ", ".join(bits)
    return label


def check(label, data, schema):
    """Report EVERY violation in the file, not just the first one."""
    global errors_found
    found = sorted(
        jsonschema.Draft7Validator(schema).iter_errors(data),
        key=lambda e: list(e.absolute_path),
    )
    if not found:
        print(f"  [OK] {label}")
        return
    print(f"  [FAIL] {label}  ({len(found)} violation(s))")
    for e in found[:25]:
        errors_found += 1
        path = " -> ".join(str(p) for p in e.absolute_path) or "(root)"
        who = describe(data, e.absolute_path)
        print(f"         Path   : {path}" + (f"   [{who}]" if who else ""))
        print(f"         Error  : {e.message[:200]}")
    if len(found) > 25:
        extra = len(found) - 25
        errors_found += extra
        print(f"         ... and {extra} more violation(s) suppressed")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ─── Shared sub-schemas ───────────────────────────────────────────────────────

PLAYER_REF = {
    "type": "object",
    "required": ["name", "playerSlug"],
    "properties": {
        "name":       {"type": "string", "minLength": 1},
        "playerSlug": {"type": "string", "minLength": 1},
    }
}

TIER_ENUM = {"type": "string", "enum": ["S+", "S", "A", "B", "C", "D", "Unranked"]}

# Which show a season belongs to. Required on every season and every player
# season detail — see the CROSS-FORMAT AGGREGATE CONTRACT in the module
# docstring. The enum is closed on purpose: "bigbrother" or "Big Brother" must
# fail loudly rather than pass as a new, silently-unhandled show.
FORMAT_ENUM = {"type": "string", "enum": ["total-drama", "big-brother"]}

# Stable cross-show season key: a lowercase show prefix, a hyphen, a number.
# e.g. "td-14", "bb-1".
SEASON_ID = {"type": "string", "pattern": r"^[a-z]+-[0-9]+$"}


# ─── franchise_database.json ──────────────────────────────────────────────────

FRANCHISE_DB_SCHEMA = {
    "type": "object",
    "required": ["franchiseStats", "champions"],
    "properties": {
        "franchiseStats": {
            "type": "object",
            "required": ["totalSeasons", "totalEpisodes", "uniquePlayers", "totalAppearances", "lastUpdated"],
            "properties": {
                "totalSeasons":     {"type": "integer", "minimum": 1},
                "totalEpisodes":    {"type": "integer", "minimum": 1},
                "uniquePlayers":    {"type": "integer", "minimum": 1},
                "totalAppearances": {"type": "integer", "minimum": 1},
                "lastUpdated":      {"type": "string", "pattern": r"^\d{4}-\d{2}-\d{2}$"},
            },
            "additionalProperties": True,
        },
        "champions": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["season", "winner", "playerSlug", "finalVote"],
                "properties": {
                    "season":      {"type": "integer", "minimum": 1},
                    "winner":      {"type": "string", "minLength": 1},
                    "playerSlug":  {"type": "string", "minLength": 1},
                    "finalVote":   {"type": "string"},
                    "runnerUp":    {"type": "string"},
                },
            }
        },
    },
}


# ─── players_database.json ────────────────────────────────────────────────────

SEASON_DETAIL_SCHEMA = {
    "type": "object",
    "required": ["season", "placement", "status", "format"],
    "properties": {
        "season":          {"type": "integer", "minimum": 1},
        "format":          FORMAT_ENUM,
        "seasonId":        SEASON_ID,
        "placement":       {"type": "integer", "minimum": 1},
        "status":          {"type": "string", "enum": ["Winner", "Finalist", "Co-Winner", "Juror", "Pre-Juror", "Pre-Merge", "Medevac", "Quit", "Disqualified"]},
        "tribe":           {"type": "string"},
        "challengeWins":   {"type": "integer", "minimum": 0},
        "immunityWins":    {"type": "integer", "minimum": 0},
        "rewardWins":      {"type": "integer", "minimum": 0},
        "votesReceived":   {"type": "integer", "minimum": 0},
        "idolsFound":      {"type": "integer", "minimum": 0},
        "juryVotes":       {"type": ["integer", "null"], "minimum": 0},
        "strategicRank":   {"type": ["integer", "number", "string", "null"]},  # mixed — tracked by audit_data.py
        "keyMoments":      {"type": "array", "items": {"type": "string"}},
        "notes":           {"type": ["array", "string"]},
        "finalVote":       {"type": "string"},
    },
}

# Per-show career bucket. SUMMED from that show's season details only.
# The top-level career fields on PLAYER_SCHEMA below are cross-format
# aggregates and may legitimately be LARGER than any single bucket here —
# see the CROSS-FORMAT AGGREGATE CONTRACT in the module docstring. No rule in
# this file asserts the two agree, because they are not required to.
BY_SHOW_SCHEMA = {
    "type": "object",
    "propertyNames": FORMAT_ENUM,
    "additionalProperties": {
        "type": "object",
        "properties": {
            "seasons":            {"type": "integer", "minimum": 0},
            "totalChallengeWins": {"type": "integer", "minimum": 0},
            "totalImmunityWins":  {"type": "integer", "minimum": 0},
            "totalRewardWins":    {"type": "integer", "minimum": 0},
            "totalIdolsFound":    {"type": "integer", "minimum": 0},
        },
        "additionalProperties": True,
    },
}

# NOTE: the total* / wins / avgPlacement fields below are CROSS-FORMAT career
# aggregates spanning every show. Per-show numbers live in `byShow`.
PLAYER_SCHEMA = {
    "type": "object",
    "required": ["id", "name", "seasons", "totalSeasons", "wins", "bestPlacement",
                 "totalChallengeWins", "totalImmunityWins", "totalVotesAgainst"],
    "properties": {
        "id":                    {"type": "string", "minLength": 1, "pattern": r"^[a-z0-9\-]+$"},
        "name":                  {"type": "string", "minLength": 1},
        "seasons":               {"type": "array", "items": {"type": "integer", "minimum": 1}},
        "totalSeasons":          {"type": "integer", "minimum": 0},
        "wins":                  {"type": "integer", "minimum": 0},
        "bestPlacement":         {"type": "integer", "minimum": 1},
        "totalChallengeWins":    {"type": "integer", "minimum": 0},
        "totalImmunityWins":     {"type": "integer", "minimum": 0},
        "totalRewardWins":       {"type": "integer", "minimum": 0},
        "totalVotesAgainst":     {"type": "integer", "minimum": 0},
        "totalIdolsFound":       {"type": "integer", "minimum": 0},
        "totalJuryVotes":        {"type": "integer", "minimum": 0},
        "tier":                  TIER_ENUM,
        "badges":                {"type": "array", "items": {"type": "string"}},
        "byShow":                BY_SHOW_SCHEMA,
        "seasonDetails":         {"type": "array", "items": SEASON_DETAIL_SCHEMA},
        "story":                 {"type": "string"},
        "seasonsPlayed":         {"type": "integer", "minimum": 0},
        "avgPlacement":          {"type": ["number", "integer"]},
    },
}

PLAYERS_DB_SCHEMA = {
    "type": "object",
    "required": ["franchise", "players"],
    "properties": {
        "franchise": {
            "type": "object",
            "required": ["name", "totalSeasons", "totalPlayers"],
            "properties": {
                "name":         {"type": "string"},
                "totalSeasons": {"type": "integer", "minimum": 0},
                "totalPlayers": {"type": "integer", "minimum": 0},
            }
        },
        "players": {"type": "array", "minItems": 1, "items": PLAYER_SCHEMA},
    },
}


# ─── season*-data.json ────────────────────────────────────────────────────────

PLACEMENT_SCHEMA = {
    "type": "object",
    "required": ["placement", "name", "playerSlug", "phase"],
    "properties": {
        "placement":     {"type": "integer", "minimum": 1},
        "name":          {"type": "string", "minLength": 1},
        "playerSlug":    {"type": "string", "minLength": 1, "pattern": r"^[a-z0-9\-]+$"},
        "phase":         {"type": "string", "enum": ["Winner", "Finalist", "Co-Winner", "Juror", "Pre-Juror", "Pre-Merge", "Medevac", "Quit", "Disqualified"]},
        "notes":         {"type": ["string", "array"]},
        "strategicRank": {"type": ["integer", "number", "string", "null"]},
        "story":         {"type": "string"},
        "keyMoments":    {"type": "array", "items": {"type": "string"}},
        "gameplayStyle": {"type": "string"},
        "immunityWins":  {"type": "integer", "minimum": 0},
        "challengeWins": {"type": "integer", "minimum": 0},
        "votesReceived": {"type": "integer", "minimum": 0},
    },
}

SEASON_DATA_SCHEMA = {
    "type": "object",
    "required": ["seasonNumber", "title", "castSize", "episodeCount", "winner", "placements"],
    "properties": {
        "seasonNumber":  {"type": "integer", "minimum": 1},
        "title":         {"type": "string", "minLength": 1},
        "subtitle":      {"type": "string"},
        "castSize":      {"type": "integer", "minimum": 2},
        "episodeCount":  {"type": "integer", "minimum": 1},
        "jurySize":      {"type": "integer", "minimum": 0},
        "winner": {
            "type": "object",
            "required": ["name", "playerSlug", "vote"],
            "properties": {
                "name":       {"type": "string", "minLength": 1},
                "playerSlug": {"type": "string", "minLength": 1},
                "vote":       {"type": "string"},
                "runnerUp":   {"type": "string"},
                "keyStats":   {"type": "string"},
                "strategy":   {"type": "string"},
                "legacy":     {"type": "string"},
            }
        },
        "finalists": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "playerSlug", "placement"],
                "properties": {
                    "name":       {"type": "string"},
                    "playerSlug": {"type": "string"},
                    "placement":  {"type": "integer", "minimum": 1},
                    "votes":      {"type": "integer", "minimum": 0},
                }
            }
        },
        "placements": {"type": "array", "minItems": 1, "items": PLACEMENT_SCHEMA},
    },
}


# ─── seasons_database.json ────────────────────────────────────────────────────

SEASONS_DB_SCHEMA = {
    "type": "object",
    "required": ["franchise", "seasons"],
    "properties": {
        "franchise": {
            "type": "object",
            "required": ["name"],
            "properties": {"name": {"type": "string"}},
        },
        "seasons": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["seasonNumber", "title", "castSize", "episodeCount", "winner", "format"],
                "properties": {
                    "seasonNumber":  {"type": "integer", "minimum": 1},
                    "format":        FORMAT_ENUM,
                    "seasonId":      SEASON_ID,
                    "title":         {"type": "string"},
                    "subtitle":      {"type": "string"},
                    "castSize":      {"type": "integer", "minimum": 2},
                    "episodeCount":  {"type": "integer", "minimum": 1},
                    "winner":        PLAYER_REF,
                    "awards":        {"type": "object"},
                    "theme":         {"type": "string"},
                    "status":        {"type": "string", "enum": ["Complete", "In Progress", "Upcoming"]},
                    "emoji":         {"type": "string"},
                }
            }
        },
    },
}


# ─── rankings_database.json ───────────────────────────────────────────────────

RANKINGS_DB_SCHEMA = {
    "type": "object",
    "required": ["metadata", "rankings"],
    "properties": {
        "metadata": {
            "type": "object",
            "required": ["name", "version", "lastUpdated", "totalPlayers"],
            "properties": {
                "name":         {"type": "string"},
                "version":      {"type": "string"},
                "lastUpdated":  {"type": "string"},
                "totalPlayers": {"type": "integer", "minimum": 1},
                "seasons":      {"type": "integer", "minimum": 1},
            }
        },
        "rankings": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["name", "tier", "score"],
                "properties": {
                    "playerId":    {"type": "string"},
                    "name":        {"type": "string", "minLength": 1},
                    "rank":        {"type": "integer", "minimum": 1},
                    "tier":        TIER_ENUM,
                    "score":       {"type": ["integer", "number"], "minimum": 0, "maximum": 100},
                    "title":       {"type": "string"},
                    "reasoning":   {"type": "string"},
                    "strengths":   {"type": "array", "items": {"type": "string"}},
                    "weaknesses":  {"type": "array", "items": {"type": "string"}},
                    "seasonsPlayed": {"type": "integer", "minimum": 1},
                    "wins":          {"type": "integer", "minimum": 0},
                    "avgPlacement":  {"type": ["number", "integer"]},
                }
            }
        },
    },
}


# ─── Run validation ───────────────────────────────────────────────────────────

print()
print("=" * 60)
print("SCHEMA VALIDATION")
print("=" * 60)

print("\nCore databases:")
check("franchise_database.json", load(os.path.join(ROOT, "franchise_database.json")), FRANCHISE_DB_SCHEMA)
check("players_database.json",   load(os.path.join(ROOT, "players_database.json")),   PLAYERS_DB_SCHEMA)
check("seasons_database.json",   load(os.path.join(ROOT, "seasons_database.json")),   SEASONS_DB_SCHEMA)
check("rankings_database.json",  load(os.path.join(ROOT, "rankings_database.json")),  RANKINGS_DB_SCHEMA)

print("\nSeason data files:")
for path in sorted(glob.glob(os.path.join(ROOT, "data", "seasons", "season*-data.json"))):
    fname = os.path.basename(path)
    check(fname, load(path), SEASON_DATA_SCHEMA)

print()
print("=" * 60)
if errors_found == 0:
    print(f"All files valid. No schema violations found.")
else:
    print(f"FAILED: {errors_found} schema violation(s) found.")
print("=" * 60)
print()

sys.exit(1 if errors_found > 0 else 0)
