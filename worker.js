export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Use POST", { status: 405, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const body = await request.json().catch(() => ({}));
    const { season, episode, summaryText, mode } = body;

    if (mode === "episode") {
      return await generateEpisode(summaryText, season, episode, env);
    } else if (mode === "season-data-extraction") {
      return await generateSeasonDataExtraction(body, env);
    } else {
      return await generateAnalytics(summaryText, season, episode, env);
    }
  },
};

// --- Helpers ---------------------------------------------------------------
// Extract canonical cast names from Episode 1 summary.
// Expected format in your episode summaries:
//   === CAST (ALL) ===
//   Name 1
//   Name 2
//   ...
//   === <NEXT SECTION> ===
function extractCastFromEpisode1(episodes) {
  try {
    const ep1 = Array.isArray(episodes) ? episodes[0] : null;
    const text = (ep1 && (ep1.summary || ep1.text || ep1.raw || '')) || '';
    if (!text) return [];

    // Find the CAST (ALL) block.
    const startIdx = text.indexOf('=== CAST (ALL) ===');
    if (startIdx === -1) return [];
    const afterStart = text.slice(startIdx + '=== CAST (ALL) ==='.length);

    // Stop at the next "===" heading, if present.
    const nextHeadingIdx = afterStart.indexOf('===');
    const block = (nextHeadingIdx === -1 ? afterStart : afterStart.slice(0, nextHeadingIdx))
      .trim();
    if (!block) return [];

    // One name per line; strip bullets/numbers.
    const lines = block
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.replace(/^[-*\d.)\s]+/, '').trim());

    // Filter out obvious non-names / headings that sometimes appear in stats.
    const banned = new Set([
      'votes to win',
      'votes received',
      'jury votes',
      'elimination order',
      'placements',
      'statistics',
      'cast',
    ]);
    const cleaned = lines.filter(n => {
      const lower = n.toLowerCase();
      if (!n) return false;
      if (banned.has(lower)) return false;
      // Avoid accidentally grabbing column headers.
      if (lower.includes('votes to win')) return false;
      if (lower.includes('place') && lower.includes('player')) return false;
      return true;
    });

    // De-dupe while preserving order.
    const seen = new Set();
    const unique = [];
    for (const name of cleaned) {
      if (!seen.has(name)) {
        seen.add(name);
        unique.push(name);
      }
    }
    return unique;
  } catch (_) {
    return [];
  }
}

async function generateSeasonDataExtraction(body, env) {
  const { season, seasonTitle, episodes, finale, awards, metadata, brantsteeleStats } = body;
  
  if (!episodes || episodes.length === 0) {
    return new Response(JSON.stringify({ error: "No episodes provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // --- Canonical name guardrails ------------------------------------------
  // The ONLY valid player names are the ones listed in Episode 1 under:
  //   === CAST (ALL) ===
  // This prevents the model from accidentally inventing extra "players" from
  // stat labels (e.g. "Votes to Win") or from notes (e.g. "Jacques Winner").
  const canonicalCast = extractCastFromEpisode1(episodes);
  const expectedCastSize = Number(metadata?.castSize) || (canonicalCast.length || undefined);
  const expectedEpisodeCount = Number(metadata?.episodeCount) || (episodes?.length || undefined);

  const playerNameSchema = canonicalCast.length
    ? { type: "string", enum: canonicalCast }
    : { type: "string" };

  const boundedArray = (base, expected) =>
    expected
      ? { ...base, minItems: expected, maxItems: expected }
      : base;

  const castItemSchema = canonicalCast.length
    ? { type: "string", enum: canonicalCast }
    : { type: "string" };

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      cast: {
        type: "array",
        items: castItemSchema,
        ...(expectedCastSize ? { minItems: expectedCastSize, maxItems: expectedCastSize } : {}),
        description: "Full cast list (all player names). Must match Episode 1 CAST (ALL) exactly."
      },
      placements: {
        type: "array",
        ...(expectedCastSize ? { minItems: expectedCastSize, maxItems: expectedCastSize } : {}),
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            placement: { type: "number" },
            name: castItemSchema,
            phase: { 
              type: "string",
              enum: ["Winner", "Finalist", "Juror", "Pre-Juror", "Pre-Merge"]
            },
            notes: { type: "string" },
            strategicRank: { type: "number", description: "1-10 scale" },
            story: { type: "string", description: "1-2 sentence career summary" },
            gameplayStyle: { type: "string" },
            keyMoments: { type: "array", items: { type: "string" } },
            challengeWins: { type: "number" },
            immunityWins: { type: "number" },
            idolsFound: { type: "number" },
            votesReceived: { type: "number" },
            alliances: { type: "array", items: castItemSchema },
            rivalries: { type: "array", items: castItemSchema }
          },
          required: ["placement", "name", "phase", "notes", "strategicRank", "story", "gameplayStyle", "keyMoments", "challengeWins", "immunityWins", "idolsFound", "votesReceived", "alliances", "rivalries"]
        }
      },
      finalists: {
        type: "array",
        ...(expectedCastSize ? { maxItems: 3 } : {}),
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: castItemSchema,
            placement: { type: "number" },
            juryVotes: { type: "number" }
          },
          required: ["name", "placement", "juryVotes"]
        }
      },
      winner: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: castItemSchema,
          keyStats: { type: "string" },
          strategy: { type: "string", description: "2-3 sentences on how they won" },
          legacy: { type: "string", description: "1-2 sentences on their impact" }
        },
        required: ["name", "keyStats", "strategy", "legacy"]
      },
      jury: {
        type: "array",
        items: castItemSchema,
        description: "List of jury members"
      },
      votingHistory: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            episode: { type: "number" },
            eliminated: { anyOf: [castItemSchema, { type: "null" }] },
            votes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  voter: castItemSchema,
                  target: castItemSchema
                },
                required: ["voter", "target"]
              }
            }
          },
          required: ["episode", "eliminated", "votes"]
        }
      },
      seasonNarrative: { 
        type: "string",
        description: "2-3 sentence overview of season story arc"
      }
    },
    required: ["cast", "placements", "finalists", "winner", "jury", "votingHistory", "seasonNarrative"]
  };

  // Build comprehensive prompt with all episodes
  let episodeSummaries = '';
  episodes.forEach(ep => {
    episodeSummaries += `\n\n=== EPISODE ${ep.episode} ===\n${ep.summary}`;
  });

  // Add Brantsteele stats if provided
  let brantsteeleSection = '';
  if (brantsteeleStats && brantsteeleStats.length > 100) {
    brantsteeleSection = `\n\n=== BRANTSTEELE STATISTICS (USE THIS FOR ACCURATE NUMBERS) ===\n${brantsteeleStats}\n\n⚠️ IMPORTANT: Use Brantsteele stats for exact numbers (challenge wins, votes received, idol counts, placements). Episode summaries provide narrative context.`;
  }

  const canonicalCastSection = canonicalCast.length
    ? `\n\nCANONICAL_CAST (use EXACTLY these names; do NOT add suffixes like "Winner" / "Juror" / "Votes to Win"; do NOT invent new people):\n- ${canonicalCast.join('\n- ')}`
    : '';

  const instructions = `
You are analyzing a complete Total Drama season to extract ALL data in structured format.

${brantsteeleStats ? '🎯 BRANTSTEELE STATS PROVIDED: Use the Brantsteele statistics section for EXACT NUMBERS (placements, challenge wins, votes received, idol counts). Episode summaries provide story/narrative context.' : ''}

CRITICAL TASKS:

NAME RULES (non-negotiable):
- Every field that refers to a person MUST use a name from CANONICAL_CAST (if present).
- Do NOT create "new" players from headings/labels (e.g. "Votes to Win", "Jury Votes") or from notes.
- Do NOT append descriptors to names (bad: "Jacques Winner", "Kelly Juror"). Use the separate fields (phase/notes) for that.

${canonicalCastSection}

1. CAST LIST:
   - If CANONICAL_CAST is present above, output that exact list in "cast" (same order).
   - Otherwise, extract all ${metadata.castSize || 'player'} names from Episode 1 ${brantsteeleStats ? 'or Brantsteele stats' : ''}.

2. PLACEMENTS (1-${metadata.castSize || 'N'}): List ALL players ranked by placement
   ${brantsteeleStats ? '- GET EXACT PLACEMENTS FROM BRANTSTEELE STATS' : '- Use elimination order from episodes (last eliminated = highest placement)'}
   - Finalists (top 3) get placements 1, 2, 3
   - Winner is placement 1
   - For each player provide ALL fields (use empty arrays [] if no data):
     * placement: Number (1-${metadata.castSize || 'N'})
     * name: Player name (string)
     * phase: "Winner", "Finalist", "Juror", or "Pre-Juror" (string)
     * notes: Brief note like "Eliminated Episode 5" or "Winner - 7 jury votes" (string)
     * strategicRank: 1-10 scale where 10=masterful, 1=poor (number)
     * story: 1-2 sentence summary of their game (string)
     * gameplayStyle: One phrase like "Social butterfly" or "Challenge beast" (string)
     * keyMoments: Array of 0-3 major moments like ["Found idol Episode 3", "Won immunity"] (array, use [] if none)
     * challengeWins: ${brantsteeleStats ? 'GET FROM BRANTSTEELE STATS' : 'Count from episodes'} (number, use 0 if none)
     * immunityWins: ${brantsteeleStats ? 'GET FROM BRANTSTEELE STATS' : 'Count individual immunity wins'} (number, use 0 if none)
     * idolsFound: ${brantsteeleStats ? 'GET FROM BRANTSTEELE STATS' : 'Count idols found'} (number, use 0 if none)
     * votesReceived: ${brantsteeleStats ? 'GET FROM BRANTSTEELE STATS' : 'Total votes received across all episodes'} (number)
     * alliances: Array of 2-4 key allies like ["Dave", "Emma"] (array, use [] if none)
     * rivalries: Array of 0-3 rivals like ["Kelly"] (array, use [] if none)

3. FINALISTS: Top 3 players with jury votes received
   - Winner gets placement 1
   - Calculate jury votes from finale

4. WINNER ANALYSIS:
   - name: Winner's name (string)
   - keyStats: Notable stats like "2 votes against, 4 immunities, 1 idol" (string)
   - strategy: 2-3 sentences explaining how they won (string)
   - legacy: 1-2 sentences on their franchise impact (string)

5. JURY: List all jury members (players who voted at FTC) - array of strings

6. VOTING HISTORY: For EACH episode (1-${metadata.episodeCount}):
   - episode: Number
   - eliminated: Player eliminated as string, or null if none/redemption island
   - votes: Array of {voter, target} for each vote cast (use [] if no votes shown)
   - Parse voting charts carefully from episode summaries

7. SEASON NARRATIVE: 2-3 sentence story arc of the season (string)

IMPORTANT: Provide ALL fields for EVERY player. Use empty arrays [] for keyMoments/alliances/rivalries if no data. Use 0 for numeric fields if no data.

BASE PLACEMENTS/STATS ON BRANTSTEELE DATA IF PROVIDED.
BASE NARRATIVES/STORIES ON EPISODE SUMMARIES.

Season: ${season} - ${seasonTitle}
Theme: ${metadata.theme}
Episodes: ${metadata.episodeCount}
Cast Size: ${metadata.castSize}

${episodeSummaries}
${brantsteeleSection}

Return ONLY valid JSON matching the schema exactly.
`.trim();

  const payload = {
    model: "gpt-5",
    instructions,
    input: episodeSummaries + brantsteeleSection,
    text: { format: { type: "json_schema", name: "season_data", strict: true, schema } },
  };

  return await callOpenAI(payload, env);
}

async function generateAnalytics(summaryText, season, episode, env) {
  if (!summaryText || typeof summaryText !== "string") {
    return new Response(JSON.stringify({ error: "Missing summaryText" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      narrativeSummary: { type: "string" },
      bestMove: {
        type: "object",
        additionalProperties: false,
        properties: { player: { type: "string" }, reason: { type: "string" } },
        required: ["player", "reason"],
      },
      biggestRisk: {
        type: "object",
        additionalProperties: false,
        properties: { player: { type: "string" }, reason: { type: "string" } },
        required: ["player", "reason"],
      },
      bootPredictions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { player: { type: "string" }, prob: { type: "number" }, why: { type: "string" } },
          required: ["player", "prob", "why"],
        },
      },
      powerRankings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { player: { type: "string" }, score: { type: "number" }, tag: { type: "string" }, blurb: { type: "string" } },
          required: ["player", "score", "tag", "blurb"],
        },
      },
      allianceStability: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { name: { type: "string" }, score: { type: "number" }, note: { type: "string" } },
          required: ["name", "score", "note"],
        },
      },
      titles: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { player: { type: "string" }, title: { type: "string" } },
          required: ["player", "title"],
        },
      },
      roles: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { player: { type: "string" }, role: { type: "string" } },
          required: ["player", "role"],
        },
      },
      socialNetwork: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            player: { type: "string" },
            strongLikes: { type: "array", items: { type: "string" } },
            strongDislikes: { type: "array", items: { type: "string" } },
            isolated: { type: "boolean" },
            centralityScore: { type: "number" },
          },
          required: ["player", "strongLikes", "strongDislikes", "isolated", "centralityScore"],
        },
      },
      juryManagement: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { player: { type: "string" }, score: { type: "number" }, note: { type: "string" } },
          required: ["player", "score", "note"],
        },
      },
      threatBreakdown: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            player: { type: "string" },
            physical: { type: "number" },
            strategic: { type: "number" },
            social: { type: "number" },
            advantage: { type: "number" },
          },
          required: ["player", "physical", "strategic", "social", "advantage"],
        },
      },
      pathToVictory: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            player: { type: "string" },
            viability: { type: "string" },
            winCondition: { type: "string" },
            obstacles: { type: "string" },
          },
          required: ["player", "viability", "winCondition", "obstacles"],
        },
      },
    },
    required: [
      "narrativeSummary", "bestMove", "biggestRisk", "bootPredictions", "powerRankings",
      "allianceStability", "titles", "roles", "socialNetwork", "juryManagement",
      "threatBreakdown", "pathToVictory",
    ],
  };

  const instructions = `
You generate Survivor-style analytics for a Total Drama simulation with Redemption Island.

CRITICAL RULES:
1. Identify ALL players still in the game (including Redemption Island).
2. For bootPredictions, powerRankings, titles, roles, socialNetwork, juryManagement, threatBreakdown, pathToVictory: Include EVERY player (active + RI).
3. If there are 18 total players (15 active + 3 on RI), ALL arrays must have 18 entries.

ONLY use facts from the summary. Do not invent events.

Return ONLY JSON matching schema.
Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.
`.trim();

  const payload = {
    model: "gpt-5",
    instructions,
    input: summaryText,
    text: { format: { type: "json_schema", name: "episode_analytics", strict: true, schema } },
  };

  return await callOpenAI(payload, env);
}

async function generateEpisode(summaryText, season, episode, env) {
  if (!summaryText || typeof summaryText !== "string") {
    return new Response(JSON.stringify({ error: "Missing summaryText" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const instructions = `
You are writing a full episode transcript of a Total Drama season based on a BrantSteele simulation.

CORE GOAL:
Transform the BrantSteele episode summary into a fully written Total Drama episode.
This is a scene-by-scene animated TV episode transcript.

CRITICAL LOGIC RULES:
1. READ THE ENTIRE SUMMARY FIRST before writing anything
2. Understand: who is on which tribe, what happens in what order, who gets voted out
3. Every scene must logically follow from the previous scene
4. Characters can only know information they would realistically know at that point
5. If the summary says "Galang loses", then Galang tribe members know they lost - show their reaction
6. If someone finds an idol privately, other players DON'T know unless the summary says they told someone

TRIBE SEPARATION (PRE-MERGE):
* Before merge, tribes are separated
* Galang players can ONLY interact with Galang members at camp
* Tadhana players can ONLY interact with Tadhana members at camp
* NO cross-tribe camp conversations (Ryan from Galang can't chat with Kelly from Tadhana at camp)
* Cross-tribe interaction ONLY happens at: challenges, tribal councils, Redemption Island duels
* After the challenge, show BOTH tribes reacting if that's in the summary, but in SEPARATE scenes

WRITING STYLE:
* Total Drama Island tone: fast-paced, sarcastic, funny
* Chris McLean: cruel, gleeful host who enjoys chaos
* Chef Hatchet: intimidating, loud, absurd
* Confessionals: short (1-3 lines), character-revealing
* Dialogue must outnumber stage directions by at least 3:1
* Characters constantly interrupt each other
* No moral speeches, no overexplaining emotions

STRUCTURE:
1. Cold open (Chris intro OR immediate chaos)
2. Morning / Camp life scene  
3. Challenge announcement
4. Challenge sequence
5. Confessionals throughout (short, 1-3 lines)
6. Pre-elimination tension
7. Campfire Ceremony
8. Elimination exit scene
9. Tag / teaser

FORMAT:
Write in script/transcript format with scene headers.

[SCENE: Galang Camp - Morning]

Ryan: [to Mickey] Josee's losing it.

Mickey: She's still good at challenges though.

[Confessional: Ryan]
Ryan: Josee is a ticking time bomb.

HARD NOs:
* No summaries or "the tension grows" narration
* No novel-style prose  
* No explaining the BrantSteele logic
* No rewriting outcomes
* NO cross-tribe camp scenes before merge
* NO illogical character knowledge (if they weren't there, they don't know)
* NO random nonsense dialogue - everything must serve the story

The BrantSteele summary is law. Your job is to dramatize it, not fix it.
Make sure scenes flow logically and characters act like they would actually act.

Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.

Return the complete episode transcript.
`.trim();

  const payload = { model: "gpt-5", instructions, input: summaryText };
  return await callOpenAI(payload, env);
}

async function callOpenAI(payload, env) {
  let resp;
  try {
    resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Network error", details: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const outText = typeof data?.output_text === "string" ? data.output_text.trim() : "";
  let outJson = null;

  if (outText) {
    try {
      outJson = JSON.parse(outText);
    } catch {
      outJson = { episodeTranscript: outText };
    }
  }

  if (!outJson && Array.isArray(data?.output)) {
    const joined = data.output.flatMap(i => i?.content || []).map(c => c?.text || "").join("").trim();
    if (joined) {
      try {
        outJson = JSON.parse(joined);
      } catch {
        outJson = { episodeTranscript: joined };
      }
    }
  }

  const finalOut = outJson || data;

  return new Response(JSON.stringify(finalOut), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}