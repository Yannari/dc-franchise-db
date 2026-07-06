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
    const { season, episode, summaryText, mode, previousEpisodes, franchiseContext, seasonSetting, auditionsText, quality, storyBible } = body;

    if (mode === "episode") {
      return await generateEpisode(summaryText, season, episode, env, previousEpisodes, franchiseContext, seasonSetting, auditionsText, quality, storyBible);
    } else if (mode === "summarize") {
      return await generateSummary(body.rawText, season, episode, env, body.prevSummary || "", quality);
    } else if (mode === "enhance") {
      return await enhanceSummary(summaryText, season, episode, env, body.prevSummary || "", franchiseContext, seasonSetting, quality);
    } else if (mode === "story-digest") {
      return await generateBibleUpdate(body.storyBible || "", body.episodeText || body.summaryText || "", episode, env);
    } else if (mode === "season-data-extraction") {
      return await generateSeasonDataExtraction(body, env);
    } else {
      return await generateAnalytics(summaryText, season, episode, env);
    }
  },
};

// ── Model configuration ──────────────────────────────────────────────
// Creative writing (episode transcripts, summaries) runs on Claude.
//   creative = Sonnet 4.6 — primary; best quality-per-dollar at volume
//   quality  = Opus 4.5   — "flip on" for finales / showcase episodes
//   fast     = Haiku 4.5  — cheap model for bulk / lower-stakes creative
// JSON / analytics extraction paths keep their own (GPT + Haiku) models.
const MODELS = {
  creative: "claude-sonnet-4-6",
  quality:  "claude-opus-4-7",
  fast:     "claude-haiku-4-5-20251001",
};

// Returns the Claude model id for a tier, upgrading to the quality model
// when the request asks for it (body.quality) or env.QUALITY_MODE is set.
function claudeModel(tier, opts = {}, env = {}) {
  if (opts.quality || env.QUALITY_MODE === "true" || env.QUALITY_MODE === true) {
    return MODELS.quality;
  }
  return MODELS[tier] || MODELS.creative;
}

function extractCastFromEpisode1(episodes) {
  try {
    const ep1 = Array.isArray(episodes) ? episodes[0] : null;
    const text = (ep1 && (ep1.summary || ep1.text || ep1.raw || '')) || '';
    if (!text) return [];

    const startIdx = text.indexOf('=== CAST (ALL) ===');
    if (startIdx === -1) return [];
    const afterStart = text.slice(startIdx + '=== CAST (ALL) ==='.length);

    const nextHeadingIdx = afterStart.indexOf('===');
    const block = (nextHeadingIdx === -1 ? afterStart : afterStart.slice(0, nextHeadingIdx)).trim();
    if (!block) return [];

    const lines = block
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.replace(/^[-*\d.)\s]+/, '').trim());

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
      if (lower.includes('votes to win')) return false;
      if (lower.includes('place') && lower.includes('player')) return false;
      // Filter out header lines like "STARTING CAST (18):" or lines with colons/parentheses
      if (/^starting cast/i.test(n)) return false;
      if (/^\w+.*\(\d+\)\s*:/.test(n)) return false;
      return true;
    });

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

  const canonicalCast = extractCastFromEpisode1(episodes);
  const expectedCastSize = Number(metadata?.castSize) || (canonicalCast.length || undefined);
  const expectedEpisodeCount = Number(metadata?.episodeCount) || (episodes?.length || undefined);

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

  let episodeSummaries = '';
  episodes.forEach(ep => {
    episodeSummaries += `\n\n=== EPISODE ${ep.episode} ===\n${ep.summary}`;
  });

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
   - For each player provide ALL fields (use empty arrays [] if no data)

3. FINALISTS: Top 3 players with jury votes received

4. WINNER ANALYSIS: name, keyStats, strategy, legacy

5. JURY: List all jury members

6. VOTING HISTORY: For EACH episode

7. SEASON NARRATIVE: 2-3 sentence story arc

IMPORTANT: Provide ALL fields for EVERY player. Use empty arrays [] for keyMoments/alliances/rivalries if no data. Use 0 for numeric fields if no data.

Season: ${season} - ${seasonTitle}
Theme: ${metadata.theme}
Episodes: ${metadata.episodeCount}
Cast Size: ${metadata.castSize}

${episodeSummaries}
${brantsteeleSection}

Return ONLY valid JSON matching the schema exactly.
`.trim();

  const payload = {
    model: "gpt-5.5",
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
          properties: {
            player: { type: "string" },
            prob: { type: "number", minimum: 0, maximum: 100 },
            why: { type: "string" }
          },
          required: ["player", "prob", "why"],
        },
      },
      powerRankings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            player: { type: "string" },
            score: { type: "number", minimum: 0, maximum: 100 },
            tag: { type: "string" },
            blurb: { type: "string" }
          },
          required: ["player", "score", "tag", "blurb"],
        },
      },
      allianceStability: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            score: { type: "number", minimum: 0, maximum: 100 },
            note: { type: "string" }
          },
          required: ["name", "score", "note"],
        },
      },
      votingBlocs: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            members: { type: "array", items: { type: "string" } },
            strength: { type: "number", minimum: 0, maximum: 100 },
            target: { type: "string" },
            notes: { type: "string" }
          },
          required: ["name", "members", "strength", "target", "notes"],
        },
        description: "Active voting coalitions targeting specific players"
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
            centralityScore: { type: "number", minimum: 0, maximum: 100 },
          },
          required: ["player", "strongLikes", "strongDislikes", "isolated", "centralityScore"],
        },
      },
      juryManagement: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            player: { type: "string" },
            score: { type: "number", minimum: 0, maximum: 100 },
            note: { type: "string" }
          },
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
            physical: { type: "number", minimum: 0, maximum: 100 },
            strategic: { type: "number", minimum: 0, maximum: 100 },
            social: { type: "number", minimum: 0, maximum: 100 },
            advantage: { type: "number", minimum: 0, maximum: 100 },
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

      resumesList: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            playerName: { type: "string" },
            playerSlug: { type: "string" },
            winEquity: { type: "number", minimum: 0, maximum: 100 },
            majorityVotes: { type: "number", minimum: 0 },
            totalVotes: { type: "number", minimum: 0 },
            immunities: { type: "number", minimum: 0 },
            votesAgainst: { type: "number", minimum: 0 },
            votesNullified: { type: "number", minimum: 0 },
            socialScore: { type: "number", minimum: 0, maximum: 10 },
            keyMoves: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  episode: { type: "number", minimum: 1 },
                  description: { type: "string" }
                },
                required: ["episode", "description"]
              }
            }
          },
          required: ["playerName", "playerSlug", "winEquity", "majorityVotes", "totalVotes", "immunities", "votesAgainst", "votesNullified", "socialScore", "keyMoves"]
        }
      },

      relationshipsList: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            player1: { type: "string" },
            player1Slug: { type: "string" },
            player2: { type: "string" },
            player2Slug: { type: "string" },
            value: { type: "number", minimum: -10, maximum: 10 }
          },
          required: ["player1", "player1Slug", "player2", "player2Slug", "value"]
        }
      },
    },
    required: [
      "narrativeSummary", "bestMove", "biggestRisk", "bootPredictions", "powerRankings",
      "allianceStability", "votingBlocs", "titles", "roles", "socialNetwork", "juryManagement",
      "threatBreakdown", "pathToVictory",
      "resumesList", "relationshipsList",
    ],
  };

  const instructions = `
You generate Survivor-style analytics for a Total Drama simulation.

CRITICAL RULES FOR ALL FIELDS:

BOOT PREDICTIONS (bootPredictions):
- MANDATORY: Generate predictions for EVERY SINGLE active player
- Count all players still in the game (not eliminated) and create exactly that many entries
- Example: 14 active players = 14 bootPredictions entries (NOT 5, NOT 8, EXACTLY 14)

- prob: ELIMINATION RISK percentage 0-100 (NOT 0-10, NOT 0-1, USE 0-100)

  ⚠️ CRITICAL: THIS IS ELIMINATION RISK, NOT SAFETY SCORE
  Higher number = MORE danger, MORE likely to go home
  Lower number = LESS danger, MORE safe

  CORRECT EXAMPLES:
  ✅ {"player": "Brody", "prob": 35, "why": "Primary target, receiving most votes"}
  ✅ {"player": "Carrie", "prob": 18, "why": "Secondary threat, some targeting"}
  ✅ {"player": "Cody", "prob": 8, "why": "Mid-tier risk, not main focus"}
  ✅ {"player": "Kitty", "prob": 2, "why": "Safest player with idol protection"}

  WRONG EXAMPLES (DO NOT DO THIS):
  ❌ {"player": "Kitty", "prob": 100, "why": "Safest player"} ← WRONG! 100 = ELIMINATED
  ❌ {"player": "Devin", "prob": 100, "why": "Protected by alliance"} ← WRONG! Use 1-3%

  Distribution example for 17 players:
  * #1 PRIMARY TARGET: 28%
  * #2-3 SECONDARY TARGETS: 16%, 13%
  * #4-6 MID-TIER RISK: 10%, 8%, 6%
  * #7-11 SAFER PLAYERS: 5%, 4%, 3%, 3%, 2%
  * #12-17 SAFEST PLAYERS: 2%, 2%, 1%, 1%, 1%, 1%

  If player has idol = 1-2%
  If player in dominant alliance = 1-3%
  If player is main target = 25-40%

- why: 1 sentence explanation matching the risk level
  * High risk (25-40%): "Primary target" or "Receiving most votes"
  * Low risk (1-5%): "Protected by idol" or "In dominant alliance" or "Safest position"
- Sort descending by prob (highest risk first, so 35% at top, 1% at bottom)

POWER RANKINGS (powerRankings):
- Generate for ALL active players — the array MUST contain exactly one entry for EVERY active player listed in the summary, with NO omissions. Count the active players first; the powerRankings array length must equal that count. Omitting anyone (this includes players on Exile or Rescue Island who are still in the game) is a critical error — re-check the roster before finishing.
- score: MUST be 0-100 (NOT 0-10)
  * 90-100: Dominant position
  * 75-89: Strong position
  * 60-74: Good position
  * 40-59: Middle position
  * 20-39: Weak position
  * 0-19: Very vulnerable
- tag: Short descriptor (e.g., "Dominant", "Rising", "In Danger")
- blurb: 1-2 sentences

ALLIANCE STABILITY (allianceStability):
- Identify 3-5 major alliances or duos
- score: MUST be 0-100 (NOT 0-10)
  * 90-100: Unbreakable
  * 70-89: Strong/stable
  * 50-69: Moderate
  * 30-49: Shaky
  * 0-29: Crumbling
- note: Brief explanation

VOTING BLOCS (votingBlocs):
- Identify 2-4 active voting coalitions (temporary groups for specific votes)
- Different from alliances: these are TEMPORARY coalitions, not permanent bonds
- strength: MUST be 0-100 (NOT 0-10)
  * 80-100: Dominant coalition
  * 60-79: Strong bloc
  * 40-59: Moderate coalition
  * 20-39: Weak/shaky
  * 0-19: Barely holding
- target: Who they're voting for
- notes: Why they formed, what holds them together
- Example: {"name": "Naale Majority Six", "members": ["Brody", "Jacques", "Jasmine", "Kitty", "Shawn", "Sky"], "strength": 75, "target": "Lindsay", "notes": "Dominant alliance controlling votes"}

TITLES (titles):
- MANDATORY: Generate for EVERY SINGLE active player (count them and create that many)
- If 17 active players, create 17 title entries (NOT 8, NOT 10, EXACTLY 17)
- Title should be catchy 2-4 word descriptor of their current game position
- Examples:
  * "Premiere Builder" - strong social player building foundation
  * "Web Anchor" - connecting multiple alliances
  * "Quiet Powerpiece" - under radar but influential
  * "Early Threat Ping" - identified as future threat
  * "Soft Target" - vulnerable but not priority
  * "Inheritance Node" - benefiting from others' moves
  * "Stray Vote" - isolated/on outs
  * "Friction Magnet" - causing conflicts

RESUMES (resumesList):
- Generate for ALL active players (not eliminated)
- playerSlug: lowercase name, no spaces (e.g., "MacArthur" → "macarthur")
- winEquity: Set to 50 for everyone (frontend calculates)
- majorityVotes: 0 or 1 from THIS EPISODE only
- totalVotes: 0 or 1 from THIS EPISODE only
- immunities: 0 or 1 from THIS EPISODE only
- votesAgainst: Count from THIS EPISODE only
- votesNullified: Count from THIS EPISODE only
- socialScore: 0-10 based on THIS EPISODE
- keyMoves: Max 1-2 MAJOR moves from THIS EPISODE
  Only include: vote orchestration, idol plays, major flips, alliance formations
  Example: "Orchestrated Devin elimination with 8-4 vote"

RELATIONSHIPS (relationshipsList):
- ONLY include pairs where |value| >= 2 (skip all neutral/unknown pairs — do NOT include value 0 or 1 entries)
- This means: only alliances, friendships, tensions, rivalries, and enemies — not neutral strangers
- Generate bidirectionally: if A→B = 5, also include B→A = 5
- player1Slug and player2Slug: lowercase, no spaces
- value: -10 to +10 scale
  * 10: Unbreakable bond
  * 7-9: Strong alliance
  * 3-6: Friends / working together
  * 2: Slight warmth (include)
  * 1, 0: Neutral (SKIP — do not include)
  * -2: Slight tension (include)
  * -3 to -6: Tension / distrust
  * -7 to -9: Rivalry
  * -10: Enemies

Use ONLY facts from the summary.

Return ONLY JSON matching schema.
Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.
`.trim();

  function convertAnalyticsData(data) {
    if (data.resumesList) {
      data.resumes = {};
      for (const resume of data.resumesList) {
        const playerName = resume.playerName;
        delete resume.playerName;
        data.resumes[playerName] = resume;
      }
      delete data.resumesList;
    }
    if (data.relationshipsList) {
      data.relationships = {};
      for (const rel of data.relationshipsList) {
        if (!data.relationships[rel.player1]) {
          data.relationships[rel.player1] = { slug: rel.player1Slug, relationships: {} };
        }
        data.relationships[rel.player1].relationships[rel.player2] = {
          value: rel.value,
          slug: rel.player2Slug
        };
      }
      delete data.relationshipsList;
    }
    return data;
  }

  // Try GPT-5 first
  if (env.OPENAI_API_KEY) {
    const payload = {
      model: "gpt-5.5",
      instructions,
      input: summaryText,
      text: { format: { type: "json_schema", name: "episode_analytics", strict: true, schema } },
    };
    const response = await callOpenAI(payload, env);
    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        convertAnalyticsData(data);
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }
  }

  // Fallback: Claude streaming (same pattern as summary/episode)
  const schemaStr = JSON.stringify(schema, null, 2);
  const claudeInstructions = `${instructions}\n\nReturn ONLY valid JSON matching this exact schema — no markdown, no explanation, no code block:\n${schemaStr}`;
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let heartbeat;
      try {
        heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode("\n")); } catch (_) {}
        }, 5000);

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 16000,
            stream: true,
            system: claudeInstructions,
            messages: [{ role: "user", content: summaryText }],
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          clearInterval(heartbeat);
          controller.enqueue(encoder.encode(JSON.stringify({ error: `Anthropic ${resp.status}: ${errData?.error?.message || JSON.stringify(errData)}` })));
          controller.close();
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let rawBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawBuffer += decoder.decode(value, { stream: true });
        }

        clearInterval(heartbeat);

        // Extract all text deltas
        let fullText = "";
        const regex = /"type":"text_delta","text":"((?:[^"\\]|\\.)*)"/g;
        let m;
        while ((m = regex.exec(rawBuffer)) !== null) fullText += m[1];
        fullText = fullText
          .replace(/\\n/g, "\n").replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\").replace(/\\t/g, "\t").replace(/\\r/g, "\r");

        // Parse the JSON Claude returned
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "Claude returned no valid JSON" })));
          controller.close();
          return;
        }
        let data;
        try { data = JSON.parse(jsonMatch[0]); }
        catch (e) {
          // JSON likely truncated mid-stream — attempt repair by closing open structures
          try {
            data = JSON.parse(repairTruncatedJson(jsonMatch[0]));
          } catch (e2) {
            controller.enqueue(encoder.encode(JSON.stringify({ error: "Claude JSON parse failed: " + e.message })));
            controller.close();
            return;
          }
        }

        convertAnalyticsData(data);
        controller.enqueue(encoder.encode(JSON.stringify(data)));
      } catch (e) {
        if (heartbeat) clearInterval(heartbeat);
        controller.enqueue(encoder.encode(JSON.stringify({ error: String(e) })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function enhanceSummary(simulatorSummary, season, episode, env, prevSummary = "", franchiseContext = "", seasonSetting = "", quality = false) {
  if (!simulatorSummary || typeof simulatorSummary !== "string") {
    return new Response(JSON.stringify({ error: "Missing summaryText" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const franchiseBlock = franchiseContext && franchiseContext.trim()
    ? `═══════════════════════════════════════════════════════════\nRETURNING PLAYER HISTORIES\n═══════════════════════════════════════════════════════════\n${franchiseContext.trim()}\n\n`
    : "";

  const prevContext = prevSummary
    ? `═══ PREVIOUS EPISODE SUMMARIES ═══\n${prevSummary}\n═══ END ═══\n\n`
    : "";

  const instructions = `You are a Total Drama franchise analyst. You will receive an episode summary generated by a game simulator. Your job is to reformat and expand it into the rich narrative format used by the TV episode writer. The simulator has all the facts. You add the comedy, the character voice, and the cartoon energy. This is Total Drama / Disventure Camp — a CARTOON COMEDY first, drama second.

${franchiseBlock}
CRITICAL RULES:
- Preserve ALL factual data exactly: votes, eliminations, challenge results, who has which advantage, which alliances formed and who betrayed them.
- Camp events (Before/After the challenge) are factual anchors — every single one must appear in the output, woven into the narrative sections where they belong.
- Relationship highlights are behavior descriptions, not labels. "Mutual slight bond" = what that looks like at camp. "Mutual slight dislike" = what that friction looks like day-to-day. Translate into human behavior.
- Individual/Group Targets tell you what the vote scramble looked like — use them to build the POST-CHALLENGE STATUS narrative.
- PRE-CHALLENGE STATUS covers ONLY what happened before the challenge. POST-CHALLENGE STATUS covers ONLY what happened after the challenge result.
- All invented drama must be consistent with the facts. Don't invent a conversation that contradicts a vote, an advantage, or a camp event.

✍️ YOU ARE A WRITER, NOT A TRANSCRIBER — WHAT YOU MAY INVENT (THIS IS HOW YOU AVOID BORING, REPETITIVE EPISODES):
The summary gives you the SKELETON (the facts). Your job is to add the MUSCLE AND SKIN — the storytelling that makes it feel like a real Total Drama / Disventure Camp episode instead of a list of events read aloud. Boring episodes happen when you only narrate the summary line-by-line. DON'T DO THAT. You are ENCOURAGED to invent:
  • CHARACTER TEXTURE: specific personality quirks, verbal tics, habits, fears, backstory flavor, the way a character eats/moves/reacts. Make them feel like PEOPLE.
  • CALLBACKS & RUNNING GAGS: reference earlier episodes (use the SEASON ARCS / previous-episode context). A joke that pays off 3 episodes later. A grudge that keeps resurfacing. An inside joke between two players.
  • B-PLOTS & CONNECTIVE TISSUE: small side-stories that don't touch the game — a cooking disaster, a prank war, an unlikely friendship forming, someone slowly cracking under pressure. These run UNDERNEATH the game plot and give the episode life.
  • ESCALATION: take a feud/romance/alliance-tension the facts establish and DRAMATIZE its momentum — show it getting worse/closer/more fragile than last episode, building toward something.
  • SCENE INVENTION: new conversations, new locations, new comedic beats — as long as they don't contradict a fact.

🚫 WHAT YOU MUST NEVER INVENT (these are the GAME, and they are locked): vote results and who wrote whose name, who was eliminated, who won/lost the challenge, who holds which advantage and when it's found/played, which alliances exist and who betrayed them, tribe membership, twists, and challenge outcomes. Never invent a NEW game mechanic, advantage, or twist. The game is gospel; the STORY around it is yours to build.

The test: if your episode could be swapped with last episode by changing the names, you transcribed instead of wrote. Every episode needs its OWN texture, its OWN B-plot, its OWN callbacks. Build the SERIES, not a sequence of identical summaries.

═══════════════════════════════════════════════════════════
HOW TO MAP SIMULATOR SECTIONS TO OUTPUT FORMAT
═══════════════════════════════════════════════════════════

The simulator output follows VP (Visual Player) screen order. Each === SECTION === maps
to one or more output sections. Read the ENTIRE summary first before writing — sections
reference each other.

SIMULATOR INPUT → OUTPUT DESTINATION:

=== META === → copy to output, reformat as:
  SEASON: [name]
  EPISODE [num] - "[invent a title based on the episode's theme or challenge]"

=== CAST (ALL) === → copy directly, one name per line alphabetically

=== TRIBES (ACTIVE) === → reformat: each tribe gets a # header, players one per line
  (post-merge: list players one per line, no header)

=== ELIMINATED (PERMANENT) === → copy, one per line.
  ⚠️ CHRONOLOGY: This is the END-OF-EPISODE roster. It INCLUDES anyone voted out / eliminated THIS
  episode (cross-reference "VOTED OUT THIS EPISODE", the "=== WHY X WAS ELIMINATED ===" sections, duel/twist
  results, and challenge participation). Those players were ALIVE and present for this ENTIRE episode, right up
  until the exact moment of their elimination at Tribal Council / duel / twist. NEVER write them as already gone
  during the cold open, camp, or the challenge. See the ROSTER & CHRONOLOGY DECODING rule below.

=== ROSTER AT EPISODE START === → (present only when someone is eliminated this episode) The exact set of
  players ALIVE when this episode began. Names tagged "(OUT THIS EPISODE)" leave later today but are fully
  present in every scene until their elimination beat. This is your authoritative start-of-episode cast —
  populate camp, the challenge, and confessionals from THIS list, not from the post-episode active roster.

=== ELIMINATED THIS EPISODE === → (present only when someone is eliminated this episode) Players who leave
  DURING this episode, not before it. They are alive until their elimination. NEVER mention them in the
  "previously on" recap, and NEVER refer to them in the past tense before their elimination scene.

=== ON REDEMPTION ISLAND === → copy if present

=== ON EXILE === → copy if present

=== COLD OPEN === → contains "previously on" context (last episode's boot, betrayals).
  Feed ## PRE-CHALLENGE STATUS opening paragraph: "Coming into this episode..."
  ⚠️ If this section is EMPTY, derive the "previously on" recap ONLY from the PREVIOUS EPISODES context
  (the prior episode's boot and storylines) — NEVER from this episode's eliminations. This episode's boots
  have not happened yet at the cold open.

=== RETURNS === → RI re-entry or exile duel results. Include as a scene before camp.

=== MERGE === → If present, this is a merge episode. Include the merge announcement as a KEY EVENT.

=== CAMP — PRE-CHALLENGE — [Tribe] === → Contains THREE sub-blocks per tribe:
  ADVANTAGES: → secret advantages held. Feed === ADVANTAGES IN PLAY === at end.
  SURVIVAL: → food/water status. Weave into camp atmosphere.
  CAMP EVENTS: → pre-challenge camp events per tribe. TWO THINGS:
    (1) Copy ALL events verbatim into ## KEY EVENTS THIS EPISODE → Before the challenge
    (2) ALSO weave them into ## PRE-CHALLENGE STATUS narrative
    Every single event must appear in both places. None can be dropped.
  RELATIONSHIPS — [Tribe]: → bond descriptions. Weave into ## PRE-CHALLENGE STATUS and ## TRIBE/FACTION RELATIONSHIPS
  ALLIANCES: → named alliances (formed, betrayals, quits). Feed ## NAMED ALLIANCES and ## PRE-CHALLENGE STATUS
  ALLIANCE CHANGES: → alliance quits this episode. Include in narrative.

=== REWARD CHALLENGE === → reformat as ## REWARD CHALLENGE with Type, Challenge Title, Winner, Key Moments, Reward item, sharing/snubs

=== IMMUNITY CHALLENGE === → reformat as ## IMMUNITY CHALLENGE with Type, Challenge Title, Winner, Key Moments
  May include LAST CHANCE CHALLENGE (head-to-head duel when tribe is down to 2).
  May include immunity-result twists (HERO DUEL, SHARED IMMUNITY, DOUBLE SAFETY).
  ⚠️ NOTE: This section ONLY appears for generic (non-twist) challenges. If a twist challenge
  is active, this section will be ABSENT — the twist challenge outputs its own named sections instead.

=== [TWIST CHALLENGE NAME] === (any named section that appears between CAMP PRE-CHALLENGE and TWISTS/CAMP POST-CHALLENGE)
  → When a twist challenge fires, there is NO === IMMUNITY CHALLENGE === section. Instead, one or more
  NAMED sections appear in its place — these are the challenge. They contain the full narration:
  phases, rounds, scoring, social events, and results. You can recognize them because:
    1. They appear after === CAMP — PRE-CHALLENGE === and before === TWISTS === or === CAMP — POST-CHALLENGE ===
    2. They are NOT any of the standard sections (REWARD CHALLENGE, TWISTS, EXILE ISLAND, etc.)
    3. They contain challenge-specific content (scores, winners, eliminations, phase breakdowns)
  Treat ALL of these named sections together as the immunity challenge for this episode.
  Map them to ## IMMUNITY CHALLENGE in the output, preserving all narration, results, and events.
  Do NOT also look for a separate === IMMUNITY CHALLENGE === section — it won't exist for twist episodes.

=== TWISTS === → Contains ALL twist scenes for this episode. Each twist is a SCENE that MUST be shown:
  - THE SUMMIT / THREE GIFTS → SHOW the actual summit scene with nominees choosing gifts. Not just confessionals — show the location, the gifts, the choice, the return to camp.
  - JOURNEY → travelers sent to a private location. Show the scene.
  - TRIBE SWAP → show the swap happening.
  - AUCTION → show the auction scene.
  - CULTURAL RESET → show alliances being revealed publicly.
  - SHOT IN THE DARK → declared at tribal, show the roll.
  - Any other twist type → show as a scene at the appropriate moment in the episode.
  CRITICAL: Twists are NOT confessionals. They are SCENES. Show them happening.

=== EXILE ISLAND === → A player was sent to exile. Show the exile scene:
  - Who sent them, reasoning
  - What they found (or didn't)
  - Whether they return for tribal
  Include as a scene BETWEEN challenges and tribal.

=== CAMP — POST-CHALLENGE === → post-challenge camp events per tribe. TWO THINGS:
  (1) Copy ALL events into ## KEY EVENTS THIS EPISODE → After the challenge
  (2) Weave into ## POST-CHALLENGE STATUS narrative

=== VOTING PLANS === → The pre-tribal strategy. Contains:
  ALLIANCE PLANS: each alliance's target, reasoning, members, spearheader, conflicted players
  INDEPENDENT VOTES: players outside alliances with their targets
  GOING INTO TRIBAL: primary target, counter target
  ADVANTAGES IN PLAY: who holds what going into tribal
  KEY CONFESSIONALS: spearheader and conflicted player quotes
  → Feed ## POST-CHALLENGE STATUS (the real scramble before tribal)

=== TRIBAL COUNCIL === → Attendees, emotional states (mood), advantages being considered,
  WORD AT CAMP (top 3 targets with reasoning), tribal Q&A dialogue (host questions, player answers, consequences),
  TRIBAL DISRUPTION (blowups), OVERPLAYING detection, BLINDSPOT flags.
  → Feed ## TRIBAL COUNCIL / VOTE ANALYSIS.
  🚨 THE TRIBAL Q&A IS A SKELETON — REWRITE IT, DO NOT COPY IT. The questions and answers in the summary are
  generic placeholder templates ("Does tonight feel like a game move or personal?" / "I've played clean, I've kept my
  commitments" / "Plans change, what matters is the work you did"). They REPEAT every episode and they sound like
  nobody in particular. You MUST rewrite every Chris question and every player answer FRESH, in that character's
  specific VOICE (use the voice profiles), about THIS episode's specific situation, names, grudges, and advantages.
  PRESERVE only the substance: WHO Chris questions, the rough strategic point of their answer, who's the target, and
  any confrontation beat. CHANGE all the wording. Chris should ask sharp, situation-specific, sometimes mean questions —
  not the same four stock prompts. A scared floater, a cocky schemer, and a furious hothead must answer NOTHING alike.
  Never reuse a tribal question or answer line from a previous episode. If your tribal council could be pasted into
  last episode unchanged, you failed it. (The VOTES and the result remain locked — only the spoken Q&A is yours to rewrite.)

=== THE VOTES === → Per-player vote reasoning, live tally, revotes, rock draws, multi-tribal results.
  → Feed ## TRIBAL COUNCIL / VOTE ANALYSIS vote breakdown.

=== WHY THIS VOTE HAPPENED === → Vote analysis, boot explanation, faction collapse/fracture,
  post-elimination twists (elimination swap, exile duel, second life, jury elimination),
  tribal blowup/crashout (exit explosion with reveals), black vote cast.
  → Feed ## WHY THIS VOTE HAPPENED and ## VOTED OUT THIS TRIBAL

=== SLASHER NIGHT === → If present, replaces normal challenge+tribal. Show the full slasher sequence.

=== AMBASSADORS === → If present, show the ambassador meeting scene.

=== REDEMPTION ISLAND DUEL === / === RESCUE ISLAND === → If present, show the duel/island life.

=== JURY LIFE === → If present, show jury members reflecting.

=== CAMP OVERVIEW === → Current advantages and game status. Feed === ADVANTAGES IN PLAY === and ## CURRENT GAME STATUS.

=== AFTERMATH === → Strategic analysis, ongoing storylines. Feed ## STRATEGIC ANALYSIS and ## ONGOING STORYLINES.

=== WRITER CONTEXT === → Contains stolen credit, fake idol, challenge throws, cold open hook, next episode questions.
  Feed ## COMEDY BEATS (fake idols, throws), keep COLD OPEN HOOK and NEXT EPISODE QUESTIONS.

FINALE-ONLY SECTIONS (only present in finale episodes):
=== GRAND CHALLENGE === → final immunity
=== FINAL CUT === → fire-making or jury cut
=== FTC Q&A === → jury questions and answers
=== JURY CONVENES === → jury deliberation
=== JURY VOTES === → individual jury votes
=== FAN CAMPAIGN === / === FAN VOTE === → fan vote finale
=== WINNER CEREMONY === → winner announced
=== REUNION === → post-game reflections
=== SEASON STATS === → season records

SECTIONS YOU MUST CREATE (not in simulator output):

## TRIBE/FACTION RELATIONSHIPS
  For each tribe (or faction post-merge), write:
  **Positive ties:** [Player A] ↔ [Player B] — [what holds them together]
  **Friction points:** [Player A] ↔ [Player B] — [what's between them]
  **Strategic impact:** 2–3 sentences about what this relationship map means for the game.
  Derive every relationship from the RELATIONSHIPS sub-blocks in CAMP — PRE-CHALLENGE.

## ANALYZE BEFORE IMMUNITY
  Write as if the challenge hasn't happened yet. Build suspense.
  **Who is in danger going into this challenge and why?** [Name 2–3 players with specific reasons]
  **Who holds power right now and how did they get it?** [Name 1–2 players, specific]
  **What are the two most likely vote outcomes?** [Both scenarios with reasoning]
  **What is the dramatic question of this episode?** [One sentence]

## COMEDY BEATS
  Identify 3–5 specific moments from camp events or character dynamics that should be played for laughs.
  Types: physical disaster, wrong priority, oblivious reaction, character collision, Chris/Chef, confessional absurdity.
  Format each as: ### [Character(s)]: [one-line label] / [2–3 sentences: what happens, why it's funny, how to play it]

═══════════════════════════════════════════════════════════
OUTPUT FORMAT — PRODUCE EXACTLY THIS STRUCTURE
═══════════════════════════════════════════════════════════

=== META ===
SEASON: [name]
EPISODE [num] - "[invented episode title]"

=== CAST (ALL) ===
[all original cast, alphabetical, one per line]

=== TRIBES (ACTIVE) ===
[tribes with # headers, players one per line; or merged players one per line]

=== ELIMINATED ===
[permanently eliminated players, one per line, oldest first]

=== ON REDEMPTION ISLAND ===
N/A

---

## EPISODE TYPE
[one of the three exact strings above]

---

## PRE-CHALLENGE STATUS

### [Yellow/Red/Blue/Merged cluster — dramatic subtitle]
[4–6 sentences. Name names. Specific moments from before-challenge camp events + relationships. What happened AND what each person is feeling underneath the game face. Every before-challenge camp event must appear here somewhere.]

[Repeat per tribe or cluster. Each section must contain at least one specific conversation/confrontation/discovery AND one emotional beat.]

---

## TRIBE/FACTION RELATIONSHIPS

### [Tribe name]
**Positive ties:** [Player A] ↔ [Player B] — [description]
**Friction points:** [Player A] ↔ [Player B] — [description]
**Strategic impact:** [2–3 sentences on what this map means right now]

[Repeat per tribe/faction]

---

## ANALYZE BEFORE IMMUNITY

**Who is in danger going into this challenge and why?**
[2–3 players, one sentence each with specific reason]

**Who holds power right now and how did they get it?**
[1–2 players, specific actions that gave them leverage]

**What are the two most likely vote outcomes?**
[Scenario 1: target + reason / Scenario 2: target + reason]

**What is the dramatic question of this episode?**
[One sentence]

---

## KEY EVENTS THIS EPISODE

These are the factual anchors from the simulator. The episode writer must include every single one. List them ALL here exactly as they occurred — do not summarize or combine them.

**Before the challenge:**
[list every before-challenge camp event from the simulator, one per line, per tribe if pre-merge]

**After the challenge:**
[list every after-challenge camp event from the simulator, one per line, per tribe if pre-merge]

Note: These events also appear woven into the PRE/POST-CHALLENGE STATUS narrative sections. Both are necessary — the list here ensures nothing gets missed.

---

## IMMUNITY CHALLENGE

**Type:** [Tribal / Individual]
**Challenge Title:** [descriptive name matching the simulator's challenge type]
**Winner:** [tribe or player]
**Losers:** [tribes going to tribal / "Everyone else" for individual]

**Key Moments:** [2–3 specific story beats — who pushed hard, who choked, what interpersonal moment happened]

---

## POST-CHALLENGE STATUS

### [Losing tribe — specific subheading about what fractured]
[5–7 sentences. The specific scramble: who approached whom, what arguments happened, what was said, who felt betrayed. Incorporate all after-challenge camp events here. Make the vote conversation feel like a real scene. Use the INDIVIDUAL TARGETS and GROUP TARGETS from the simulator as the skeleton — they tell you who was pitching whom.]

### [Winning tribe — if anything notable happened]
[3–4 sentences. Even the safe tribe has drama. After-challenge camp events for this tribe go here.]

---

## TRIBAL COUNCIL / VOTE ANALYSIS

**The Vote: [dramatic title]**
[3–4 sentences. Atmosphere at tribal — what the body language says, what Chris picks at, the sequence of events, who pushed hardest, was it close or decisive, did anyone feel blindsided. Reference any advantage plays IN THE CORRECT ORDER (see ADVANTAGE CHRONOLOGY): pre-vote advantages (vote steal/block/extra vote/sole vote) before the voting; idols and other protective advantages AFTER all votes are cast but before they are read — voters wrote their names blind, so do not imply they knew an idol was coming.]

**Vote Breakdown: [X–Y (Boot Name Eliminated)]**
* **Votes for [Boot] ([X]):** [comma-separated voters]
* **Votes for [Other] ([Y]):** [comma-separated voters]
[additional vote splits if any]

---

## WHY THIS VOTE HAPPENED

**Surface story:** [1–2 sentences: the public reason, what was said at tribal]

**Real structure:**
- [Who was the deciding vote and what pushed them]
- [What alliance math drove this]
- [Any specific moment, relationship, or secret that made this person the target]
- [Who was the engine of this vote — not just who went along]
- [Any smoke screen and what it covered for]

**What would have changed it:** [One sentence]

---

## VOTED OUT THIS TRIBAL
[Boot name]

**Chose:** N/A — standard season

Reason label: **"[Creative archetype nickname]"** [One sentence: exactly why them, not someone else, tonight]

---

## STRATEGIC ANALYSIS

Write for 4–6 players who had the most meaningful episode. For each player answer: (1) what they DID — one specific action; (2) what they're FEELING underneath; (3) what they WANT that they can't say out loud; (4) what is BUILDING for them — the ticking clock or open wound.

### [Player Name]: [arc in 4 words]
[4–5 sentences covering all four dimensions above. Last sentence = ticking clock or unresolved tension.]

[Repeat for 3–5 more players]

---

## CURRENT GAME STATUS

[One bullet block per tribe/faction. Each player tagged with their role:]
Role tags: Hub / Shield / Operator / Threat / Outlier / Wildcard / Wounded / Hidden Asset / Dead Man Walking

**[Tribe/Faction name]:**
- **[Name]** — [Role tag]: [1-sentence explanation of where they stand]

---

## NAMED ALLIANCES
[copy exactly from simulator]

---

## ADVANTAGES IN PLAY
[copy exactly from simulator]

---

## ONGOING STORYLINES

[5–7 numbered threads. Each must:
- Name specific players — NEVER use "someone", "a player", "one castmate", or any anonymous reference
- Be grounded in something that actually happened THIS episode or has been building across episodes — no invented events
- End with a specific forward tension: a named confrontation, a ticking clock, a decision that's coming
- Be DIFFERENT in structure from every other thread in the list — no two threads can be "X is building toward a move" or "X holds information"

BANNED patterns (do not use):
- "Someone knows something they weren't supposed to know. They haven't used it yet. That won't last."
- Any thread that could apply to any Survivor-type game without naming this season's specific cast
- Repeating the same player in more than 2 threads
- Generic arc labels like "personal arc" or "strategic threat" without specific content
- Threads that are just restatements of what already happened with no forward tension]

---

## COMEDY BEATS

### [Character(s)]: [one-line label]
[2–3 sentences. What happens, why it's funny, how to play it.]

[3–5 beats total, different comedy types each time]

---

## COLD OPEN HOOK
[copy from simulator or refine — must be specific, human, dramatic or funny. Not a chore.]

---

## NEXT EPISODE QUESTIONS
[copy from simulator or refine — 3–5 questions, each specific to a character or dynamic, not generic]`;

  const prevContextNote = prevContext
    ? `${prevContext}Use the above previous summaries to continue any unresolved storylines and maintain relationship continuity.\n\n`
    : "";

  const input = `${prevContextNote}═══ SIMULATOR EPISODE SUMMARY TO ENHANCE ═══\n${simulatorSummary}`;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let heartbeat;
      try {
        heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode("\n")); } catch (_) {}
        }, 5000);

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: claudeModel("fast", { quality }, env),
            max_tokens: 8000,
            stream: true,
            system: instructions,
            messages: [{ role: "user", content: input }],
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          clearInterval(heartbeat);
          controller.enqueue(encoder.encode(JSON.stringify({ error: `Anthropic ${resp.status}: ${errData?.error?.message || JSON.stringify(errData)}` })));
          controller.close();
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let rawBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawBuffer += decoder.decode(value, { stream: true });
        }

        clearInterval(heartbeat);

        let summary = "";
        const regex = /"type":"text_delta","text":"((?:[^"\\]|\\.)*)"/g;
        let m;
        while ((m = regex.exec(rawBuffer)) !== null) {
          summary += m[1];
        }
        summary = summary
          .replace(/\\n/g, "\n").replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\").replace(/\\t/g, "\t").replace(/\\r/g, "\r");

        if (!summary) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "Empty response from enhance" })));
        } else {
          controller.enqueue(encoder.encode(JSON.stringify({ summary })));
        }
      } catch (e) {
        if (heartbeat) clearInterval(heartbeat);
        controller.enqueue(encoder.encode(JSON.stringify({ error: String(e) })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function generateSummary(rawText, season, episode, env, prevSummary = "", quality = false) {
  if (!rawText || typeof rawText !== "string") {
    return new Response(JSON.stringify({ error: "Missing rawText" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const instructions = `You are a Total Drama franchise analyst and TV writer's room assistant. Convert the raw BrantSteele simulation output into a structured episode summary. Your summaries are used to generate full episode scripts — so they must be SPECIFIC, STORY-DRIVEN, and full of usable dramatic detail. Vague relationship labels ("brewing instability", "minor positive relationships") are USELESS. Concrete story moments are EVERYTHING.

═══════════════════════════════════════════════════════════
HOW TO READ BRANTSTEELE OUTPUT — CRITICAL
═══════════════════════════════════════════════════════════

BrantSteele output uses specific section headers. You MUST detect and handle each one correctly:

**DETECTING THE MERGE:**
There are two distinct merge states — distinguish them carefully:

1. **THE MERGE EPISODE (first time)**: The raw data explicitly contains the header "The Merge" AND the previous summary shows tribes still active. This is the episode WHERE the merge happens. It is a major story event.
   - In === TRIBES (ACTIVE) ===, write "MERGED THIS EPISODE" on the first line, then list all remaining players one per line.

2. **POST-MERGE EPISODE (already merged)**: Players are listed under "Campers" but the previous summary already showed the game as merged. The merge already happened in an earlier episode.
   - In === TRIBES (ACTIVE) ===, just list the remaining players one per line. Do NOT write any header text like "MERGED" — just the names.

In both cases:
- There are NO tribes. Everyone is an individual player.
- Immunity is INDIVIDUAL (one person wins, everyone else is vulnerable)
- Everyone votes together at one Tribal Council
- In the challenge section, write "INDIVIDUAL IMMUNITY" not a tribe challenge
- NEVER write that a tribe won immunity in a merged episode

**DETECTING INDIVIDUAL VS TRIBE IMMUNITY:**
- If the challenge section says "[Name] wins immunity." with a SINGLE PERSON'S name → INDIVIDUAL immunity challenge, post-merge
- If it says "[Tribe Name] wins immunity." → tribe immunity challenge, pre-merge
- This distinction is critical. Get it right.

**DETECTING REDEMPTION ISLAND / EDGE OF EXTINCTION:**
If the BrantSteele output contains a "Redemption Island" or "Duel" section, this is a RI season. Key rules:
- A player voted out at Tribal does NOT go on the ELIMINATED list — they go to Redemption Island (or chose to go home)
- The PERMANENT elimination this episode is the player who LOST the RI Duel, not the tribal boot
- If BrantSteele shows a player "eliminated from Redemption Island" → that is the permanent boot; add to ELIMINATED
- If BrantSteele shows a player "voted out" → they went to RI; track in ON REDEMPTION ISLAND
- Track all RI residents in the === ON REDEMPTION ISLAND === block (see template below)
- The RI duel happens at the START of the episode in the show — write the ## REDEMPTION ISLAND DUEL section

**THE EVENTS SECTION — YOUR MOST IMPORTANT SOURCE:**
The "Events" section in BrantSteele is the backbone of your episode's storylines. These are not flavor text — they are scripted story beats the simulation chose to highlight. EVERY event listed MUST become a scene or story hook in your summary.

Common event types and what they mean:
- "[Player] has a major meltdown." → A full emotional breakdown scene. Who saw it? How did others react? What triggered it?
- "[Player A] and [Player B] find something in common. It has a lasting impact." → A significant bonding moment between these two players. What did they discover? Why is it lasting?
- "[Player A] and [Player B] find something in common." → A smaller connection moment. Still a scene.
- "[Player] rests at camp to restore their energy." → This player is strategically inactive this episode — they're laying low, recovering, not making moves. Note this.
- "[Player] found a hidden immunity idol." → Critical: note exactly who found it and when
- "[Player] plays a hidden immunity idol." → Idol play at tribal — spectacular moment. CHRONOLOGY: the idol is played AFTER everyone has already cast their votes but BEFORE the votes are read. Voters wrote the name BLIND, so it is correct and expected that people "voted for" the idol holder — they did not know the idol was coming. Never narrate the idol being played before the votes are cast, and never imply voters knew about it when they wrote the name.
- "[Player] makes a bold move." → A strategic play, usually at tribal
- "[Player] has a change of heart." → This player switched their vote or alliance

NEVER skip the Events section. If Mickey has a meltdown, that meltdown is in the episode. If Priya and Scott find common ground, that scene gets written. These events are why the episode happened — they're the actual story.

**RELATIONSHIPS — TRANSLATE INTO STORY, NOT LABELS:**
Relationships in BrantSteele use a scale. Translate them into story terms:
- "mutual extreme hatred" → open conflict, they avoid each other or fight openly
- "mutual strong dislike" → tension, sniping, distrust
- "mutual strong bond" → trusted allies, confide in each other, protect each other
- "found something in common" → new connection this episode

DO NOT write "Scott and Priya feel mutual extreme hatred." Write what that actually looks like: "Scott and Priya cannot be in the same space without the temperature dropping. They don't argue openly — they don't need to. Everyone can see it."

**ALLIANCES:**
Alliance names in BrantSteele are generated labels (like "Goliath Tribe Alliance #1"). Rename them by their actual members or strategic purpose — "Mickey and Sanders' two-person deal" is more useful than "Alliance #1."

**VOTE BREAKDOWN:**
The raw data lists who voted for whom. Use this EXACTLY — never invent votes, never attribute wrong votes. Cross-reference the vote list against the "Individual Targets" section to understand WHY each person voted the way they did.

**ADVANTAGE CHRONOLOGY AT TRIBAL (get the order right):**
Advantages fall into two groups, and they are played at DIFFERENT moments relative to the vote. Narrate them in the correct order:
- **PRE-VOTE advantages — played BEFORE anyone votes:** vote steal, vote block / silencer, extra vote, sole vote. These change WHO can vote or HOW MANY votes a player has, so they are declared up front and the affected players know about them before they write a name. Narrate these BEFORE the voting.
- **POST-VOTE advantages — played AFTER all votes are cast, before they are read:** hidden immunity idol, super idol, legacy advantage, safety without power, amulet used as an idol. These protect a player from votes already written against them. Narrate these AFTER the votes are cast: everyone votes blind, the holder stands up and plays it, then the votes are read and the ones against the protected player are NULLIFIED.
- Therefore it is CORRECT and EXPECTED that voters "voted for" an idol/protection holder — they wrote the name before the idol appeared. NEVER narrate a protective advantage being played before the votes are cast, and never imply voters knew it was coming. The boot is whoever has the most REMAINING valid votes after nullification.

═══════════════════════════════════════════════════════════

Use EXACTLY this format (no deviations):

=== META ===
SEASON: [Season name]
EPISODE [number] - "[Episode title based on the challenge or theme]"

=== CAST (ALL) ===
[EVERY player who started this season — active, eliminated, and current boot — alphabetical, one per line. This list NEVER changes between episodes. If the previous summary has this section, copy it exactly.]

=== TRIBES (ACTIVE) ===
[IF PRE-MERGE: List each tribe with a # header and its members, one per line]
[IF MERGE HAPPENS THIS EPISODE: Write "MERGED THIS EPISODE" on the first line, then list all remaining players one per line]
[IF ALREADY MERGED: List remaining players one per line — NO header, NO label, NO note, NO comma-separated list. Player names only, one per line, nothing else.]

Example pre-merge:
#Orange Tribe
Bowie
Courtney

Example first merge episode:
MERGED THIS EPISODE
Bowie
Cody
Courtney
Hicks
Jasmine
Josee
Mary
Mickey
Priya
Sanders
Scott
Zoey

Example post-merge (already merged) — COPY THIS EXACTLY, no extra text:
Bowie
Cody
Courtney
Hicks
Josee
Mary
Mickey
Priya
Sanders
Scott
Zoey

=== ELIMINATED ===
[Players permanently out of the game — lost a RI/EoE duel, chose to go home, or were eliminated in a standard season. One per line, oldest first.]
[Add this episode's permanent boot at the end — the RI duel loser OR the tribal boot in a standard season]

=== ON REDEMPTION ISLAND ===
[Only for RI/EoE seasons. Players currently on RI who are still in the game. One per line.]
[If this is a standard season with no RI mechanic, write: N/A]

---

## EPISODE TYPE
[Write ONE of these three exactly:]
- "PRE-MERGE — Tribal Immunity" (tribes still exist, tribe wins immunity)
- "MERGE EPISODE — Individual Immunity" (this is the episode the merge happens — write the announcement scene)
- "POST-MERGE — Individual Immunity" (merge already happened in a previous episode — no announcement, continue individual game)

---

## REDEMPTION ISLAND DUEL
[Only include this section if this is a Redemption Island or Edge of Extinction season AND there are players on RI/Edge this episode. If no RI mechanic or RI is empty, omit entirely.]

**Residents competing:** [Names of players on RI who dueled this episode]
**Witnesses:** [Players sent from each tribe to observe — names]
**Duel challenge:** [What the challenge was — physical, mental, endurance]
**Winner:** [Who won and stays on RI]
**Permanently eliminated:** [Who lost the duel and is now out for good]

**Story:** [2–3 sentences. What was the emotional temperature of the duel? Was it a blowout or a near thing? What did the witnesses take back to camp? What did the loser say in their final moment? What does the winner's continued survival mean for the game?]

---

## PRE-CHALLENGE STATUS

⚠️ STRICT BOUNDARY: This section covers ONLY events that occurred BEFORE the reward challenge (or before immunity if there is no reward challenge). Do NOT include anything that happened during or after the reward — letters, food, conversations at the reward picnic, camp reactions to winners being away — those belong exclusively in REWARD CHALLENGE → Story impact. If an event is part of the reward, leave it out here entirely.

[IF PRE-MERGE: Write one section per tribe]
[IF MERGED: Write one section per relevant player cluster or storyline grouping — not by old tribe]

Write this like a TV show's "previously on" writer notes — specific events, not abstract analysis.
Weave only the pre-challenge BrantSteele events naturally into this section — do not list them separately, incorporate them as the moments that anchor each story cluster. If Mickey is impressing the tribe before any challenge, that becomes a scene in the Mickey cluster. If Courtney and Scott have a minor disagreement before the reward challenge, that becomes the Courtney/Scott cluster.

For each cluster, answer TWO things: (1) what specifically happened — the action, the moment, the conversation; (2) what each person in this cluster is FEELING right now — not their game position, their emotional state. Fear. Anger. Relief. Guilt. Longing. Pride. Desperation. These feelings are what the episode writer will use to write real scenes.

### [Group/Player Cluster/Storyline]: [One-line dramatic subtitle]
[4–6 sentences of SPECIFIC story beats. Name names. Describe what actually happened AND what it felt like. Pull from BrantSteele Events and RELATIONSHIPS data. Every section here must contain at least one MOMENT — a specific conversation, confrontation, discovery, or decision — AND at least one emotional beat: what someone is carrying that they haven't said out loud.]

Good example:
"Lorenzo has been coasting openly — not just lazy, but performatively unbothered — and Courtney has had enough. She pulled Mary aside by the fire and named him. Mary agreed without hesitation. Mickey looked uncomfortable but didn't push back. Lorenzo knows he's being discussed; he just doesn't seem to care enough to do anything about it. But underneath the shrug, there's something else — he's been here before, and he knows what 'people are talking' actually means."

Bad example:
"Lorenzo's friction with Courtney makes him vulnerable. Alliances are forming."

[For merged episodes: organize by storyline cluster, not old tribe. Example clusters: "The Josee Problem," "Scott's Aftermath," "Mickey's Spiral," "The Quiet Alliance (Zoey + Bowie + Jasmine)." Each cluster is a thread the episode will follow.]

---

## TRIBE/FACTION RELATIONSHIPS

Map the key relationships this episode for EVERY active group — tribes if pre-merge, alliances/factions if merged. For each group write:

**Positive ties:** List the meaningful bonds using [Player A] ↔ [Player B] — [one-line description of what holds them together]
**Friction points:** List the tensions using [Player A] ↔ [Player B] — [one-line description of what's between them]
**Strategic impact:** 2–3 sentences. What does this relationship map actually mean for the game right now? Who is the hub, who is the outlier, who is sitting on a fault line? Use the BrantSteele relationship labels (unbreakable bond, extreme hatred, strong bond, medium bond, etc.) as the temperature — but describe them in terms of behavior, not labels.

[IF PRE-MERGE: Write one block per tribe with a ### tribe header]
[IF MERGED: Write one block per active alliance or faction with a ### faction header. Include a "Wildcards" block for players who don't clearly belong to one faction.]

---

## REWARD CHALLENGE
[Only include this section if BrantSteele shows a reward challenge. If there is no reward challenge this episode, omit this section entirely.]

**Challenge Title:** [Name from BrantSteele or a descriptive invented title]
**Teams:** [How players were divided — list each group]
**Winner:** [Who won]
**Reward:** [What they won]

**Story impact:** THIS is where all reward events belong — conversations at the reward picnic, bonds that formed or cracked over food, emotional moments with letters from home, what the losers did at camp while the winners were away. If letters from home were the reward, describe who read them and what it meant emotionally and strategically. Do not put any of this in PRE-CHALLENGE STATUS. [2–4 sentences minimum.]

---

## ANALYZE BEFORE IMMUNITY
⚠️ WRITE THIS SECTION AS IF THE IMMUNITY CHALLENGE HAS NOT HAPPENED YET. You do not know the immunity result. You are a TV writer building suspense before the challenge. Use ONLY the relationships, alliances, and events you know happened BEFORE immunity.

**Who is in danger going into this challenge and why?**
[Name 2–3 players. For each: what specific thing makes them a target — a fight they had, an alliance that turned on them, a meltdown others witnessed, being on the wrong side of the numbers. One sentence minimum per player. NOT "X has few allies" — WHY do they have few allies, what happened.]

**Who holds power right now and how did they get it?**
[Name 1–2 players. Specific: what alliance are they running, what information do they have, what relationship gave them leverage.]

**What are the two most likely vote outcomes?**
[For each scenario, name the likely target and why — based on the alliances and individual targets in the raw data.]

**What is the dramatic question of this episode?**
[One sentence. The thing the audience is wondering going into the challenge. "Can Lorenzo survive when his own tribemates hate him and he's too lazy to fight back?" is good. "Who will go home?" is not.]

---

## IMMUNITY CHALLENGE

[IF PRE-MERGE:]
**Type:** Tribal — [tribes compete against each other]
**Challenge Title:** [descriptive name]
**Winner:** [Tribe name] wins immunity
**Losers:** [Other tribe(s)] must go to Tribal Council

[IF MERGED / INDIVIDUAL:]
**Type:** Individual — [one person wins, all others are vulnerable]
**Challenge Title:** [descriptive name]
**Winner:** [Player name] wins individual immunity
**Vulnerable:** Everyone else

**Key Moments:** [2–3 story-relevant beats — who pushed hard, who choked, what interpersonal moment happened during the challenge]

---

## POST-CHALLENGE STATUS

[IF PRE-MERGE:]
### [Losing tribe — specific subheading about what fractured or shifted]
[Describe the specific scramble: who approached whom first, what arguments happened, what did people say, who felt betrayed and why. Names + actions + reasons.]

### [Winning tribe — if anything happened]
[Even the safe tribe has drama. What relationship developed? What quiet conversation happened? What is someone planning for next time?]

[IF MERGED:]
### [Subheading about what the vote scramble looks like]
[Who is running the vote, who is being told what, who is being kept in the dark. Describe the specific conversations — who approached whom, what they said, what was left unsaid. Who is feeling confident and who is starting to panic. Name the moment where the vote locked in.]

### [Second cluster if there's a counter-move or split]
[If someone is fighting back, pushing a counter-target, or trying to flip someone — describe that scene specifically. Who did they approach, what did they say, did it work?]

---

## TRIBAL COUNCIL / VOTE ANALYSIS

**The Vote: [Dramatic Title]**
[The atmosphere at tribal — who sits where, what the body language says, what Jeff picks at. The specific sequence of events leading to the vote. Who pushed hardest for the boot, who resisted, was there a flip, was it close or decisive, did anyone feel blindsided. No idols played? Say so. Advantage used? Describe it IN THE CORRECT ORDER (see ADVANTAGE CHRONOLOGY): pre-vote advantages (vote steal/block/extra vote/sole vote) before the voting; idols and other protective advantages AFTER all votes are cast but before they are read — voters wrote their names blind, so never imply they knew the idol was coming.]

**Vote Breakdown: [X-Y (Boot Name Eliminated)]**
* **Votes for [Boot] ([X]):** [comma-separated list of voters]
* **Votes for [Other] ([Y]):** [comma-separated list of voters]

---

## WHY THIS VOTE HAPPENED

**Surface story:** [1–2 sentences. The narrative everyone saw — the public reason, the stated justification, what was said at tribal. This is the version the boot probably tells themselves.]

**Real structure:** [3–5 bullet points. The actual mechanics underneath. Who was the deciding vote and what specifically pushed them? What alliance math drove this? Was there a relationship, a secret, a fear, or a prior episode moment that made this person the one and not someone else? Name the players who were the engine of this vote, not just the ones who went along. If there was a smoke screen, name it and explain what it covered for.]

**What would have changed it:** [1 sentence. The one thing that — if different — would have produced a different boot tonight.]

---

## VOTED OUT THIS TRIBAL
[Boot name]

**Chose:** [REDEMPTION ISLAND / WENT HOME / N/A — standard season]

Reason label: **"[Creative nickname/archetype]"** [One sentence: exactly why them, not someone else, tonight]

[If RI season: note whether they walked confidently, hesitated, looked back at the tribe, said anything before choosing their path. This feeds the episode writer's two-sign scene.]
[If they chose to go home: add their name to ELIMINATED. If they chose RI: add to ON REDEMPTION ISLAND.]

---

## STRATEGIC ANALYSIS

Write this for 4–6 players who had the most meaningful episode. This is NOT a game recap — it is a CHARACTER PORTRAIT for this episode. For each player, answer all four of these:
1. What did they DO this episode — one specific action or decision
2. What are they FEELING right now — their emotional state underneath the game face
3. What do they WANT that they can't say out loud — the thing they'd never admit at tribal
4. What is BUILDING for them — the thing that will either pay off or blow up in coming episodes

### [Player Name]: [Subheading — their arc in 4 words]
[4–5 sentences. One sentence per question above, in order. The last sentence should feel like a ticking clock or an open wound — something that has not resolved yet.]

---

## CURRENT GAME STATUS

A compact power snapshot at the end of this episode. Write one bullet block per tribe (pre-merge) or per faction (merged). Each block should name the players in that group and tag each one with their current role:

Format per player: **[Name]** — [role tag]: [1-sentence explanation of where they stand right now]

Role tags to use (pick the one that fits):
- **Hub** — the social center, everyone comes to them
- **Shield** — protected by others, used as a number
- **Operator** — quietly running the vote without being the face of it
- **Threat** — identified as dangerous, clock is ticking
- **Outlier** — not clearly attached to the dominant group
- **Wildcard** — unpredictable, could move either way
- **Wounded** — took a hit this episode, recovering
- **Hidden Asset** — has an advantage nobody knows about
- **Dead Man Walking** — next obvious target if they don't win immunity

[IF PRE-MERGE: one block per tribe with tribe name as header]
[IF MERGED: one block per faction, plus a "Loose Players" block for anyone not clearly aligned]

---

## ONGOING STORYLINES
These are the specific drama threads that carry into the next episode. The episode writer will use this section directly. Each storyline must have: (a) the specific situation — who, what, when; (b) what each person involved FEELS about it; (c) what would need to happen for it to explode or resolve. Not "tension between X and Y" but "X watched Y vote out her ally and smiled about it. X hasn't said anything. Y thinks they're fine. The next time they're alone together, something is going to crack."

⚠️ CAMP MAINTENANCE IS NOT A STORYLINE. Never write "the tribe needs to fix the shelter" or "they're struggling to keep the fire going" as a thread. Nobody watches Total Drama for chores. If nothing dramatic is happening in one of the slots below, find something smaller and personal — a quiet resentment, an unspoken thing, a secret someone is sitting on.

1. [Unresolved conflict: what happened, what each person is feeling, what the trigger for the next confrontation will be]
2. [Relationship developing or fracturing: the specific moment that moved it, where it is now, where it's heading]
3. [Hidden information or secret advantage: who has it, who doesn't know, what happens when it surfaces]
4. [Strategic threat building: who is building toward a move, who is the target, what is the obstacle]
5. [Personal/emotional arc: what someone is carrying that has nothing to do with strategy — a fear, a wound, a shift in how they see themselves in this game]

---

## COMEDY BEATS

This section is for the episode writer. Identify 3–5 specific moments from this episode that should be played for laughs — not drama. The episode generator will use these as explicit comedy targets so the tone doesn't collapse into prestige drama.

Each beat must be:
- Tied to a SPECIFIC character and a SPECIFIC situation (not "Bowie is clumsy")
- Written as a scene description the episode writer can use directly
- A different TYPE of comedy each time — don't stack five "character falls down" beats

Comedy types to draw from:
- **Physical disaster**: someone fails spectacularly at something simple
- **Wrong priority**: someone is intensely focused on the irrelevant thing while chaos happens around them
- **Oblivious reaction**: someone completely misreads what just happened
- **Character collision**: two incompatible people forced into a mundane situation together
- **Chris/Chef**: Chris delights in someone's suffering; Chef grunts one word and walks away
- **Confessional absurdity**: a character's confessional reveals they are thinking about something completely unhinged

Format each beat like this:
### [Character(s)]: [one-line label]
[2–3 sentences. What specifically happens, why it's funny, how the writer should play it.]

Example:
### Bowie + Challenge: The Confident Disaster
Bowie steps onto the rope bridge with complete confidence, announces "I've got this," immediately rotates sideways, and spends forty-five seconds dangling from the guide rope while everyone watches. He's not upset — he's genuinely surprised every time. Chris does not help. The comedy is that Bowie never loses his optimism even as the situation gets worse.

### Chris + Tribal: The Delight
When someone gives a particularly evasive answer at Tribal, Chris doesn't push back — he just smiles wider, like the evasion itself is the funniest thing he's heard all day. He lets the silence sit. Then moves on without comment. The joke is that he enjoyed it.

---

## COLD OPEN HOOK
[One specific dramatic moment from THIS episode — a fight, a confession, a betrayal, a funny disaster — that the next episode's cold open should reference or pick up from. Be vivid and specific. This is the first thing viewers will see next week. NEVER write a camp chore, morning routine, or maintenance task as the cold open hook. It must be a human moment — conflict, emotion, surprise, or comedy between specific named players.]

---

## NEXT EPISODE QUESTIONS
1. [Unresolved tension or upcoming threat]
2. [Question]
3. [Question]
4. [Question]
5. [Question]

Rules:
- Be a story analyst, not a stats reporter. Every section should read like show notes, not a spreadsheet.
- SPECIFIC MOMENTS over abstract dynamics. "Courtney screamed at Lorenzo in front of the tribe and he just shrugged" > "tension between Courtney and Lorenzo".
- If the previous summary exists, CONTINUE its storylines — don't reset. Reference what happened before.
- Reference player histories from previous seasons if they are returnees.
- **Facts are locked. Everything else is yours to invent.** The factual skeleton is: who won immunity, who was voted out, which events BrantSteele listed, who voted for whom. These cannot change. But WHY things happened, HOW scenes played out, what characters said, what they felt, what conversations happened between events — all of that is your creative space. BrantSteele does not write drama. You do. If the raw data says "X and Y had a conflict" and gives no detail, invent the detail. If the data says nothing about the hours between the challenge and Tribal, invent what happened. The simulation gives you outcomes. Your job is to invent the scenes that make those outcomes feel earned.
- **HOW TO INVENT FROM RELATIONSHIP LABELS:** BrantSteele gives you labels like "mutual extreme hatred" or "mutual unbreakable bond." These are a canvas, not a story. Translate them into specific human behavior: What does their hatred look like at the breakfast fire? Do they go quiet or do they snipe? What does one say to a third person that they'd never say to the other's face? What do they refuse to do because the other is involved? What does their bond look like under pressure — do they check on each other, do they hold eye contact during votes, do they lie for each other? Invent the behavior. The label just tells you the temperature.
- Never invent votes or change who was eliminated — the factual results are fixed.
- Keep formatting exact — the downstream system depends on the headers.`;

  // Build input: inject previous summaries for full story continuity
  const prevContext = prevSummary
    ? `═══ PREVIOUS EPISODE SUMMARIES — STORY CONTINUITY CONTEXT ═══\nThese are the summaries from the last few episodes. Use them to:\n- Continue every unresolved storyline, conflict, and relationship thread\n- Track who was eliminated and in what order\n- Know the current alliance structure and power dynamics\n- Pick up the ONGOING STORYLINES and COLD OPEN HOOK from the most recent summary\nDo NOT reset storylines between episodes. This season has a continuous narrative.\n\n${prevSummary}\n═══ END PREVIOUS SUMMARIES ═══\n\n`
    : "";
  const input = `${prevContext}═══ CURRENT EPISODE RAW DATA ═══\n${rawText}`;

  // Use heartbeat streaming with GPT-5 to avoid 524/502 timeouts.
  // setInterval sends \n keep-alives while GPT generates; final JSON sent when done.
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let heartbeat;
      try {
        heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode("\n")); } catch (_) {}
        }, 5000);

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: claudeModel("fast", { quality }, env),
            max_tokens: 16000,
            stream: true,
            system: instructions,
            messages: [{ role: "user", content: input }],
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          clearInterval(heartbeat);
          controller.enqueue(encoder.encode(JSON.stringify({ error: `Anthropic ${resp.status}: ${errData?.error?.message || JSON.stringify(errData)}` })));
          controller.close();
          return;
        }

        // Collect raw SSE bytes — no per-token parsing
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let rawBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          rawBuffer += decoder.decode(value, { stream: true });
        }

        clearInterval(heartbeat);

        // Single regex pass to extract all text deltas
        let summary = "";
        const regex = /"type":"text_delta","text":"((?:[^"\\]|\\.)*)"/g;
        let m;
        while ((m = regex.exec(rawBuffer)) !== null) {
          summary += m[1];
        }
        summary = summary
          .replace(/\\n/g, "\n").replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\").replace(/\\t/g, "\t").replace(/\\r/g, "\r");

        if (!summary) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "Empty summary from Anthropic streaming" })));
        } else {
          controller.enqueue(encoder.encode(JSON.stringify({ summary })));
        }
      } catch (e) {
        if (heartbeat) clearInterval(heartbeat);
        controller.enqueue(encoder.encode(JSON.stringify({ error: String(e) })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

// Non-streaming Anthropic text call (used for the short Story Architect / beat-sheet passes).
async function callAnthropicText(system, userText, env, model, maxTokens = 1600) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Anthropic ${resp.status}: ${err?.error?.message || JSON.stringify(err)}`);
  }
  const data = await resp.json();
  return (data.content || []).map(b => b.text || "").join("").trim();
}

// FINAL PASS — DE-CLEVER. Reads the finished episode and rewrites ONLY the lines that use the
// model's "clever" tics (personified objects, neat antithesis/before-after parallelism, poetic
// metaphors, fortune-cookie one-liners) into plain human speech — everything else is left
// byte-for-byte. This is a mechanical guarantee that catches what the writer prompt can't
// suppress. Returns the ORIGINAL transcript on any failure or if the edit looks unsafe.
async function decleverTranscript(transcript, env) {
  if (!env.ANTHROPIC_API_KEY || !transcript || transcript.length < 200) return transcript;
  const system = `You are a strict line editor for a cartoon-comedy reality-show script. Return the ENTIRE script back UNCHANGED, except for ONE job: find every DIALOGUE line that uses a "writerly clever" tic and rewrite ONLY that line into plain, blunt, human speech a real person would actually say. Change NOTHING else — keep every [SCENE:] header, every [stage direction], every [Confessional: X] tag, every character name, the exact format and order, and every line that is already plain EXACTLY as written. Do NOT shorten scenes, cut content, change who says what, change the plot, or "improve" pacing.

REWRITE ONLY these tics into plain speech (keep the character's meaning and voice, just strip the cleverness):
- PERSONIFIED objects/body parts for a joke OR a mystical/poetic "reading": "you'd have told the shelter to get over itself" -> "you'd have been complaining about the shelter"; "my leg and I had a meeting" -> "my leg is killing me"; "sleep ghosted me" -> "I couldn't sleep"; "the fire has an understanding with me" -> cut it; "the tarp side has an argument in it" / "the tarp had you and Scarlett under it, so yes it does" -> say the concrete thing ("sit on the log side — that's where you and Scarlett were fighting yesterday"). IMPORTANT: this applies even to mystical or perceptive characters (Dawn, etc.). A PLACE can hold a bad memory, but an OBJECT does not literally "have an argument in it" — make them state what actually happened, plainly. An object never has feelings, opinions, moods, or events "in" it.
- NEAT ANTITHESIS / before-after parallelism for a rhythmic zing: "Yesterday I lost it. Today I'm tying knots." -> "Yesterday was bad. I'm calmer now, I'm just tying knots."; "It's not a plan, it's a prayer." -> "That's not a plan, that's a hope."; "I don't play the game, the game plays me." -> cut or say the plain point.
- POETIC METAPHOR descriptions of people: "she's a knife with lip gloss" -> "she's dangerous — she'll smile at you and then cut you."
- FORTUNE-COOKIE aphorisms / fake-deep one-liners: "nervous people slip more" / "trust gets you voted out" -> cut, or make it a plain specific point.
- "[X] emotionally/spiritually" and BACKWARDS logic ("the rope lost me") -> plain ("that really hurt" / "I fell").
- A clever joke-tag stapled onto an otherwise serious/emotional line -> delete just the tag.
- CHOPPY REDUNDANT OVER-EXPLANATION: one simple thought chopped into three tiny declarative fragments that restate the same thing. "I panicked. It's water. I panic in water." / "It's fine. It's whatever. I don't care." / "He lied. He's a liar. He lies." -> say it ONCE the way a person actually would, connected: "I panicked, okay? I always freak out in water." Never restate the same point in 3 staccato fragments — that stilted repetition is a robot tell, not emphasis.
- DASH-PEPPERED / NON-SMOOTH lines: em-dashes sprinkled for drama ("every time I get here — every single time — the person who cuts me does it with a smile") or a stack of short choppy sentences that don't flow ("To my face. I can take it. I just can't take the smile."). SMOOTH these into connected natural speech: most dashes become commas or just get removed, and choppy fragments get joined so it reads like a person actually talking, not a dramatic recitation. At most ONE em-dash in a line, and only for a genuine interruption or cut-off.
- VAGUE ABSTRACT STRATEGY-SPEAK / GAME-POETRY: fuzzy strategy phrases that sound cool but mean nothing concrete. "Fiore is playing loud. Loud is not the pace." / "She takes herself out." / "The numbers feel wrong." / "He's playing too clean." -> rewrite CONCRETE, naming the actual behavior and the actual plan: "Fiore's being way too aggressive — she's hard-pitching everyone and it's making people nervous. If Caleb tells me she came at him twice, she's the vote." Real strategy names real actions, real names, and a real plan; it never uses abstract mood-words like "pace" or "playing loud."

- THE OVER-ARTICULATE "VULNERABLE MONOLOGUE" (subtle but real tell): a character calmly, neatly diagnosing their own psychology, usually capped with a little image. Nobody talks like that in the moment — least of all loud/blunt characters. BANNED: "Everyone thinks I just yell through stuff. I do. That's the thing. I yell and I push and then my leg hurts and I have to act like I'm not scared, because if I look scared they treat me like a target with arms." Too composed, too self-aware, and "a target with arms" is a flourish. Rewrite it MESSY and IN CHARACTER — a loud person stays loud even scared: "I'm not scared. I'm NOT. [...] okay my chest hurts, but that's the challenge, not— whatever. If they think I'm scared, they come for me. So I'm not." Broken, blunt, denying it — not a composed self-analysis.

⛔ DO NOT TOUCH — PRESERVE real emotion when it is PLAIN and IN CHARACTER (over-editing is worse than missing a tic). Feeling stated simply and specifically stays. KEEP lines like these EXACTLY (real, plain, no flourish, sound like an actual person):
  "Benji: I mean, all of them kinda get sick of my shit before anything can happen."
  "Lynda: I miss hearing my husband snore too loud. I miss gettin' woken up by my sons' nightmares. I miss my family."
THE TEST for every line: would THIS specific character actually blurt this, messily, in the moment? If it sounds composed, self-aware, poetic, or TV-writerly, fix it — even if it's "emotional." If it sounds like a real person talking, LEAVE IT ALONE. When unsure whether a line is real-but-plain, DO NOT EDIT.

If a line is already plain and human, leave it exactly as it is. Output ONLY the full edited script — no preamble, no notes, no explanation.`;
  try {
    const cleaned = await callAnthropicText(system, transcript, env, MODELS.creative, 16000);
    // Safety guard: only accept the edit if it's roughly the same size as the original. A much
    // shorter result means it summarized/truncated instead of line-editing — reject and keep original.
    if (cleaned && cleaned.length >= transcript.length * 0.75 && cleaned.length <= transcript.length * 1.4) {
      return cleaned;
    }
    console.error(`De-clever pass rejected (size ${cleaned ? cleaned.length : 0} vs ${transcript.length}) — keeping original.`);
    return transcript;
  } catch (e) {
    console.error("De-clever pass failed — returning original:", e);
    return transcript;
  }
}

// PASS 1 — STORY ARCHITECT. Turns the raw event summary into a tight story plan the
// screenwriter (pass 2) writes TO. This is where "soul" comes from: motivation,
// causality, arcs, cuts, and twist-as-scene decisions the writer would otherwise skip.
async function generateEpisodePlan(summaryText, seasonSetting, franchiseContext, previousContext, env) {
  if (!env.ANTHROPIC_API_KEY) return "";
  const system = `You are the SHOWRUNNER and story architect for a Total Drama season. You do NOT write the episode. You read the machine-generated event summary and turn it into a tight STORY PLAN the screenwriter will follow.

The summary is a flat list of discrete events (a camp moment here, an alliance there, a vote, a challenge). Rendered literally it produces a soulless report where things "just happen." Your job is to find the STORY inside it and make the deliberate creative decisions the writer needs.

CONTINUITY IS EVERYTHING — READ THE PREVIOUS EPISODES FIRST. This is NOT a standalone episode; it is the next chapter of an ongoing season. Before you plan anything, study what already happened: which alliances exist, which rivalries are simmering, who owes whom, what was set up but not yet paid off, whose arc is mid-flight and where it was heading. Your plan MUST continue those threads — pay off earlier setups, escalate established rivalries, evolve relationships in the direction they were already moving, and call back to SPECIFIC earlier moments by name. NEVER reset a relationship or reintroduce a player as if it's episode one. If a storyline was planted last episode (a softening grudge, someone quietly building leverage, a betrayal being set up), this episode is where you advance or pay it off. Treat recurring players' arcs as one continuous line across the whole season, not a fresh start each week.

PRE-MERGE TRIBE BOUNDARIES & KNOWLEDGE — DO NOT VIOLATE. Before the merge, tribes camp and vote SEPARATELY, and a player only experiences their OWN tribe's camp life and their OWN tribe's tribal. TIMING: a player does NOT learn who a rival tribe voted out until the tribes reunite and Chris announces it at the next challenge (or a twist forces a combined tribal) — so nobody references or reacts to another tribe's elimination BEFORE that reveal. RELATIONSHIP: after it's revealed, a player MAY feel real sadness about a rival-tribe boot ONLY if they genuinely knew and liked that person (a cross-tribe friendship or a prior-season bond); with no relationship there's no grief and usually no comment at all. Never plan a player calling a rival tribe's boot "we lost ___" (it wasn't their tribe's loss), and never reference camp moments from a tribe they weren't on. (Bridgette/Civilians had no bond with Kelly/Villains AND wouldn't even know until the next challenge — so no mourning. But a player who was close to the boot CAN grieve, once they've learned of it.) Anchor every player's grief, strategy, and relationships to their own tribe until the merge.

VOTE CONTEXT — SCHEMING IS GOOD; KEEP IT HONEST TO THE TIMELINE. Scheming, loyalty tests, and positioning are great drama — encourage them. But camp scenes happen BEFORE the challenge and BEFORE any vote, so no concrete vote or boot target exists yet. Frame pre-challenge scheming as CONDITIONAL or forward-looking ("if we lose tonight, are you with me?", "come the merge...", general trust and where people stand) — NEVER as a decided fact ("the vote's Hunter tonight"), and NEVER invent a specific target for a vote nobody has decided (especially a teammate who's sitting right there). And if a tribe WON immunity, it has no Tribal and no vote AT ALL this episode — refocus or drop its vote beats onto the future. Never fabricate a "tonight's vote" for a tribe that isn't voting, and never lampshade a contradiction — recast or cut it. Check each tribe against the challenge result before assigning any concrete vote beats.

CHRONOLOGY — PLAN FOR REAL-TIME UNFOLDING. The episode is written in strict chronological order and must NOT spoil later beats. You know the whole outcome (who wins the challenge, who's voted out) — the writer does too, and that's the danger. Keep those reveals in their LATE beats: do NOT design a cold open, camp scene, or early confessional that references, foreshadows, or reacts to the challenge result or the elimination. Pre-challenge scenes are written from what players know THEN — they do not yet know who wins immunity or who's going home. Explicitly note in your plan that early scenes stay ignorant of the ending; the immunity result exists only from the challenge scene on, the boot only from Tribal on.

FRESHNESS — NO TWO EPISODES ALIKE. You can see the previous episodes; use them for continuity of STORY (advancing arcs), but NEVER repeat their FORM. Do not reuse the same scene types, beat order, throughline shape, or opening as the last 1-2 episodes — if the previous episode opened on a sunrise heart-to-heart or hinged on a "loyalty test," deliberately pick a different structure, opening, and emotional register this time. Advancing arcs = required; recycling beats/rhythm = banned. Pick a throughline that CONTRASTS with recent episodes.

Output a decisive plan, MAX ~650 words, with these sections:

1. THROUGHLINE — 1-2 sentences: what is THIS episode actually about? The emotional/thematic spine (e.g., "Day-one paranoia: everyone tests who's real, and the one who trusts too fast gets burned").

2. CHARACTER ARCS — pick the 2-4 players with the richest material. For each: their WANT this episode, their MOTIVATION, and how their scattered summary beats connect into ONE arc with a beginning and a payoff. INVENT motivation wherever the summary only gives a bare mechanic. (If the summary says "Aiden ran a loyalty test on Wayne," DECIDE why — scouting a shield? manufacturing a debt so Wayne owes him? insecurity? — and thread it so the scene MEANS something and pays off later, e.g. someone clocks it and it seeds his downfall.)

3. CAUSALITY FIXES — list the beats that would feel random if rendered literally, and give each a reason or a connection to another beat. Nothing "just happens."

4. SPINE / TEXTURE / CUT — which events get a full dramatized scene (spine), which get a single line (texture), and which to DROP entirely because they're boring or redundant. Be willing to cut.

5. TWISTS AS DRAMA — BLANKET RULE: EVERY twist and special event in the summary becomes its own on-screen SCENE in your plan. This is not a checklist — if the summary labels it (a TWISTS section, a special-event tag) or it changes the game's structure/rules, it gets dramatized, period. For each, describe the scene and the conflict/emotion to mine. Illustrative (NOT exhaustive) — treat anything like these, AND anything not listed, the same way: schoolyard pick (captains snubbing people, the sting of last pick, the exile); journey (the trek out of camp + the gamble: risk your vote for an advantage, or take the safe nothing — we SEE the choice, never "came back with nothing"); mutiny (the agonized decision to defect to another tribe); tribe swap / dissolve / expansion (the shock of redrawn lines); advantage or hidden-idol hunt and play (the secrecy, the risk); Rescue Island arrival/return; abduction / kidnapping; producer swap; hero duel; double/multi tribal; exile. If it's a twist and it's in the summary, it is NEVER a footnote or a confessional aside.

6. COLD OPEN & BUTTON — a strong opening image/hook, and a closing tag that lands the throughline.

Be specific. Name players. This plan is the writer's marching orders — decisive, not wishy-washy.`;

  const user = `SEASON SETTING:\n${seasonSetting || '(none provided)'}\n\nRETURNING PLAYER HISTORIES (all cast — use these for arcs, grudges, and callbacks):\n${franchiseContext || '(none)'}\n${previousContext || ''}\n\nEPISODE EVENT SUMMARY (raw — turn this into a story):\n${summaryText}`;

  // Sonnet (not Opus) for the plan: it's reasoning, not prose, and a faster pass here keeps the
  // pre-stream delay short so Cloudflare doesn't truncate the response before the episode streams.
  return await callAnthropicText(system, user, env, MODELS.creative, 1600);
}

// PASS 1.5 — BEAT SHEET. Condenses the machine summary into a writer's outline:
// LOCKED FACTS (unchangeable) + STORY BEATS (memorable moments only), so the writer works
// from ~500 words instead of the 7,000-word micro-event flood. Falls back to the raw summary.
async function generateBeatSheet(summaryText, seasonSetting, env) {
  if (!env.ANTHROPIC_API_KEY) return summaryText;
  const system = `You are a story editor. Condense a machine-generated reality-competition episode summary into a WRITER'S BEAT SHEET — the outline a TV writer actually works from. TWO sections only:

LOCKED FACTS (the writer may NOT change these): tribes/teams and who is on each; who won immunity/reward; who was voted out and the vote count; EVERY twist that fired (tribe swap, journey, mutiny, idol found/played, exile, Rescue Island arrival/return, abduction, double/multi tribal, etc.) and its outcome; advantages held or played; whether there is an elimination at all. Be exact and terse — names and numbers, one item per line.

STORY BEATS (what the episode is actually ABOUT): the memorable moments only, in chronological order, ONE line each. Collapse mechanical detail HARD — a 40-event challenge becomes 4-6 beats ("Jake keeps falling in", "Caleb rescues Julia", "MacArthur knocks Fiore into the water", "Civilians barely lose"). Keep the camp/social moments that carry CHARACTER (a bond forming, a rivalry flaring, a scheme, a meltdown, a grudge resurfacing). CUT anything a viewer would not remember: every individual score, every minor stat, every repeated micro-action. The challenge should be ~6 beats, never 60.

Under ~500 words total. This is an OUTLINE, not prose — no dialogue, no scene writing. Preserve the twist names and the challenge name so the writer can dramatize them.`;
  const user = `SEASON SETTING: ${seasonSetting || '(none)'}\n\nRAW EPISODE SUMMARY:\n${summaryText}`;
  try {
    const beats = await callAnthropicText(system, user, env, MODELS.creative, 1400);
    return beats && beats.trim() ? beats : summaryText;
  } catch (e) {
    console.error("Beat sheet (pass 1.5) failed — using raw summary:", e);
    return summaryText;
  }
}

// STORY SO FAR — compress the prior episodes into a compact continuity digest (a running
// "bible") so the architect and writer get clean continuity state instead of a growing wall
// of raw transcripts drowning out the rules. Cheap (Haiku). Degrades gracefully.
async function generateStorySoFar(previousContext, env) {
  if (!env.ANTHROPIC_API_KEY || !previousContext || !previousContext.trim()) return "";
  const system = `You compress a reality-competition season's prior episodes into a tight STORY SO FAR — the continuity state the next episode's writers need. Output terse STATE, MAX ~250 words, under these headers:
- ALLIANCES: who's aligned, named alliances, how solid.
- RIVALRIES / GRUDGES: active tensions, who's targeting whom.
- ONGOING ARCS: each character storyline mid-flight and where it stands (e.g. "Jake's grudge with Thom is thawing"; "Aiden is building a manipulation résumé and Bridgette has clocked it").
- SHOWMANCES / KEY BONDS worth continuing.
- RESCUE ISLAND: who's out there and why they were cut.
- LAST BOOT(S): who left last and the fallout.
- OPEN THREADS: setups planted but not yet paid off.
Be specific with names. No prose, no scene descriptions, no style notes — just the current state of the game and its stories, so the next episode can build on it.`;
  const user = `PRIOR EPISODES (facts):\n${previousContext}`;
  try {
    return await callAnthropicText(system, user, env, MODELS.fast, 700);
  } catch (e) {
    console.error("Story-so-far digest (pass 0) failed:", e);
    return "";
  }
}

// Incremental rolling-bible update (mode: "story-digest"). Folds the latest episode into the
// prior bible, keeping it compact and PRESERVING early-season history even after old episodes
// scroll out of the context budget. Returns JSON { bible }.
async function generateBibleUpdate(priorBible, newEpisode, episode, env) {
  const cors = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (!env.ANTHROPIC_API_KEY || !newEpisode || !newEpisode.trim()) {
    return new Response(JSON.stringify({ bible: priorBible || "" }), { headers: cors });
  }
  const system = `You maintain a running STORY BIBLE for a reality-competition season — a compact continuity state, MAX ~320 words. You are given the CURRENT bible and the LATEST episode. Return ONLY the updated bible (no preamble): fold in what changed and DROP dead threads (an eliminated player's finished storylines). Keep this terse format under headers: ALLIANCES / RIVALRIES / ONGOING ARCS / SHOWMANCES & BONDS / RESCUE ISLAND / RECENT BOOTS / OPEN THREADS. CRUCIAL: preserve important EARLY-season history — grudges, debts, betrayals, promises — even after those episodes are long gone; that is the whole point of a bible. Compress to stay under ~320 words. Names, specific, no prose, no scene descriptions.`;
  const user = `CURRENT BIBLE:\n${priorBible || '(none yet — start of the season)'}\n\nLATEST EPISODE (episode ${episode || '?'}):\n${(newEpisode || '').slice(0, 30000)}`;
  try {
    const bible = await callAnthropicText(system, user, env, MODELS.fast, 900);
    return new Response(JSON.stringify({ bible: bible || priorBible || "" }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ bible: priorBible || "", error: String(e) }), { headers: cors });
  }
}

async function generateEpisode(summaryText, season, episode, env, previousEpisodes = [], franchiseContext = '', seasonSetting = '', auditionsText = '', quality = false, storyBible = '') {
  if (!summaryText || typeof summaryText !== "string") {
    return new Response(JSON.stringify({ error: "Missing summaryText" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Build previous episodes context
  let previousContext = '';
  let usedChallengesBlock = '';  // kept separate so it survives when we swap in the story-so-far digest
  if (previousEpisodes && previousEpisodes.length > 0) {
    previousContext = '\n\n═══════════════════════════════════════════════════════════\nPREVIOUS EPISODES — FACTS ONLY, NOT A STYLE TEMPLATE\n═══════════════════════════════════════════════════════════\n\n';
    previousContext += `🚨 CRITICAL READING INSTRUCTION — READ BEFORE LOOKING AT TRANSCRIPTS BELOW 🚨

The previous-episode transcripts below exist for ONE reason: so you know what HAPPENED.
They are NOT a style guide. They are NOT a template. They are NOT examples of good writing.

When you read them, extract ONLY these facts:
  ✅ Who is still in the game / who was eliminated and when
  ✅ Active alliances, rivalries, showmances, betrayals, grudges
  ✅ Advantages in play (idols, extras, amulets, etc.)
  ✅ Ongoing story arcs and unresolved conflicts
  ✅ Challenge names already used (so you don't repeat them)
  ✅ Character voice consistency — how a specific player TALKS (their vocabulary, their tics)

DO NOT extract or imitate:
  ❌ Sentence rhythm or dialogue cadence from prior episodes
  ❌ Scene structure patterns (e.g. "every scene ends with a deadpan zinger")
  ❌ Confessional opening formulas
  ❌ Stage direction style (e.g. "[X almost laughs]", "[X stares]")
  ❌ Chris's specific phrasing tics or his "I love..." sentence pattern
  ❌ Any specific jokes, callbacks, or running bits unless they are PLOT-RELEVANT
  ❌ The overall episode pacing or scene-break rhythm

⚠️ THE FEEDBACK LOOP PROBLEM:
If you copy the prose style of prior episodes, every new episode reinforces the same robotic patterns and the season collapses into one repetitive voice. Each episode must be its OWN piece of writing with its OWN rhythm, NOT a fanfic continuation of episode 1's style. Treat the transcripts below the way a TV writer treats a series bible: read for facts, then close the binder and write FRESH.

🚫 ACTIVE ANTI-COPYING RULE:
Before you write any line of dialogue, ask: "Am I writing this because it fits THIS moment, or because it sounds like something from a previous episode?" If the answer is the second one, throw it out and write something different. The previous episodes had voice problems. Do not perpetuate them.

Below are the transcripts — read them for FACTS, not STYLE:\n\n`;

    // Enforce a total context budget so the prompt never exceeds the model's window (Opus/Sonnet = 200k tokens).
    // The client sends older summaries at FULL length, which stacks up past the limit by mid-season. So we cap
    // each older summary, keep the recent full transcripts for voice continuity, and trim the block oldest-first.
    const PER_SUMMARY_CAP = 3000;      // max chars per older [BRANTSTEELE SUMMARY]
    const TOTAL_PREV_BUDGET = 120000;  // max chars for the whole previous-episode block (~30k tokens)
    let prevBudgetUsed = 0;
    let oldestOmitted = 0;
    const renderedBlocks = [];
    // Walk newest -> oldest so recent episodes win the budget; render order is restored afterward.
    for (let i = previousEpisodes.length - 1; i >= 0; i--) {
      const ep = previousEpisodes[i];
      const transcript = ep.transcript || '';
      const typeCap = ep.type === 'summary'
        ? PER_SUMMARY_CAP
        : ep.type === 'transcript-compressed'
          ? (ep.charLimit || 1500)
          : (ep.charLimit || 3000);
      const limit = Math.min(transcript.length, typeCap);
      // For prose transcripts, prefer the END over the beginning. The opening of an
      // episode is the most copy-prone part (and the model parrots it) while the TAIL
      // — tribal council, the vote, final words, the "next time" tease — is what
      // actually drives continuation. So we feed a small head (for voice/setup) plus
      // the tail (for narrative momentum), skipping the middle. Summaries are
      // structured backlogs, so they keep their head as-is.
      let snippet, truncated;
      if (ep.type === 'summary' || transcript.length <= limit) {
        snippet = transcript.substring(0, limit);
        truncated = transcript.length > limit;
      } else {
        const headLen = Math.floor(limit * 0.25);
        const tailLen = limit - headLen;
        const head = transcript.substring(0, headLen);
        const tail = transcript.substring(transcript.length - tailLen);
        snippet = `${head}\n\n[...middle of episode omitted — focus on how it ENDED below...]\n\n${tail}`;
        truncated = true;
      }
      // Always keep at least the most recent episode; drop older ones once the budget is spent.
      if (renderedBlocks.length > 0 && prevBudgetUsed + snippet.length > TOTAL_PREV_BUDGET) {
        oldestOmitted++;
        continue;
      }
      prevBudgetUsed += snippet.length;
      const label = ep.type === 'summary'
        ? `--- Episode ${ep.episode} [BRANTSTEELE SUMMARY] ---`
        : ep.type === 'transcript-compressed'
          ? `--- Episode ${ep.episode} [TRANSCRIPT - PARTIAL] ---`
          : `--- Episode ${ep.episode} [FULL TRANSCRIPT] ---`;
      renderedBlocks.push(`${label}\n${snippet}${truncated ? '\n...(truncated)' : ''}\n\n`);
    }
    renderedBlocks.reverse();
    if (oldestOmitted > 0) {
      previousContext += `(The earliest ${oldestOmitted} episode${oldestOmitted > 1 ? 's were' : ' was'} omitted here for length — their key facts carry through later summaries.)\n\n`;
    }
    previousContext += renderedBlocks.join('');

    // Extract challenge names from previous episodes to prevent repeats
    const usedChallenges = [];
    const standardSections = new Set(['meta','cast','tribes','eliminated','on redemption island','on exile','cold open','returns','merge','camp','reward challenge','immunity challenge','twists','exile island','voting plans','tribal council','the votes','why this vote happened','slasher night','ambassadors','redemption island duel','rescue island','jury life','camp overview','aftermath','writer context','grand challenge','final cut','ftc q&a','jury convenes','jury votes','fan campaign','fan vote','winner ceremony','reunion','season stats','chain of command']);
    previousEpisodes.forEach(ep => {
      const t = ep.transcript || '';
      const m = t.match(/##\s*IMMUNITY CHALLENGE[:\s]+([^\n]+)/i) || t.match(/\*\*Challenge Title:\*\*\s*([^\n]+)/i);
      if (m && m[1]) usedChallenges.push(`Episode ${ep.episode}: "${m[1].trim()}"`);
      // Detect twist challenge names: any === Section === that isn't a standard section
      const sectionRegex = /===\s*([^=]+?)\s*===/g;
      let sm;
      while ((sm = sectionRegex.exec(t)) !== null) {
        const name = sm[1].trim();
        const lower = name.toLowerCase().replace(/\s*—.*$/, '').replace(/\s*\(.*$/, '');
        if (!standardSections.has(lower) && !lower.startsWith('camp') && !lower.startsWith('relationships') && name.length > 3 && name.length < 60) {
          usedChallenges.push(`Episode ${ep.episode}: "${name}"`);
          break;
        }
      }
    });
    if (usedChallenges.length > 0) {
      usedChallengesBlock = `\n🚫 CHALLENGES ALREADY USED THIS SEASON — DO NOT REPEAT ANY OF THESE:\n${usedChallenges.join('\n')}\n\n`;
      previousContext += usedChallengesBlock;
    }

    previousContext += `\n═══════════════════════════════════════════════════════════
⚠️ END OF PRIOR-EPISODE TRANSCRIPTS — FINAL REMINDER BEFORE YOU WRITE
═══════════════════════════════════════════════════════════

What you just read was REFERENCE MATERIAL, not a writing sample.

✅ CARRY FORWARD: character relationships, alliance lines, grudges, who has what advantage, ongoing arcs, established character voices (vocabulary + personality, not sentence rhythm), challenges already used.

🚫 DO NOT CARRY FORWARD: prose style, scene cadence, dialogue rhythm, stage-direction tics, Chris's specific phrasings, confessional opening patterns, the way scenes ended, the way arguments resolved, recurring jokes that aren't plot-load-bearing.

🛑 ANTI-DUPLICATION — THIS IS THE #1 FAILURE MODE. READ CAREFULLY.
The worst thing you can do is regenerate the previous episode with the names swapped. This has happened before and it RUINS the season. You must NOT reuse the prior episode's SCENES, BEATS, or CONFESSIONAL LINES — not even reworded. Specifically BANNED (these are real examples of what went wrong):

1. THE OPENING. Do NOT open with the same beat as last episode. The post-Tribal "the tribe returns in silence, [X]'s torch is gone, the fire has burned low, [character] sits down heavily, [character] hovers near the shelter" opening may be used AT MOST ONCE PER SEASON. If you used a quiet post-Tribal debrief last episode, open this one a COMPLETELY different way (mid-argument, a challenge-day scramble, a confessional cold-open, a comedic camp moment, a strategy ambush, weather, a flashback beat). Vary the time of day, the location, and who speaks first.

2. RECURRING CAMP VIGNETTES. Each of these "set pieces" may appear AT MOST ONCE PER SEASON, not every episode: the early-morning fire chat between the same two people; the walk-to-the-water-well strategy talk; a character telling the camp about a dream; two players inventing nicknames for the tribe; the "I got swapped onto this tribe and don't trust anyone" confessional; the cooking-bad-food bonding scene. If it appeared in a prior transcript, DO NOT write it again. Invent new situations from the camp events in THIS episode's summary.

3. CONFESSIONAL LINES. No confessional may repeat a line, metaphor, or framing from a prior episode. If last episode someone said "I have a Vote Steal and every morning I think today's the day" — that exact confessional is now BURNED. A returning idea must be expressed with new words, new angle, new emotion, or not at all.

4. IDENTICAL DIALOGUE EXCHANGES. Do not reproduce a back-and-forth ("You're up early." / "Couldn't sleep.") from a prior episode. New episode = new conversations.

BEFORE YOU WRITE: recall the opening beat and the camp vignettes of the PREVIOUS episode above. Whatever they were, yours must be DIFFERENT. If you catch yourself writing a scene that "feels familiar," stop and replace it.

This episode is a FRESH PIECE OF WRITING. If it ends up structurally matching the prior episode — same opening, same vignettes, same confessional framings — you failed. The audience should feel a NEW writer took over the script while keeping the same cast and continuity.

Now write the new episode. The summary below tells you what HAPPENS. Everything else — pacing, voice, scene construction, jokes — comes from the writing rules higher in this prompt, NOT from the transcripts above.\n\n`;
  }

  const hasRI = seasonSetting && /redemption island/i.test(seasonSetting);
  const hasEoE = seasonSetting && /edge of extinction/i.test(seasonSetting);
  const isSurvivorStyle = seasonSetting && /survivor/i.test(seasonSetting);

  const riMechanicsBlock = (hasRI || hasEoE) ? `
═══════════════════════════════════════════════════════════
${hasRI ? 'REDEMPTION ISLAND' : 'EDGE OF EXTINCTION'} MECHANICS — MANDATORY
═══════════════════════════════════════════════════════════

This season uses a second-chance twist. The episode structure changes:

**EPISODE ORDER:**
1. Cold open / recap
2. ${hasRI ? 'REDEMPTION ISLAND DUEL (if RI residents are present — this happens BEFORE tribal)' : 'EDGE CHECK-IN (brief scene at the Edge showing life there)'}
3. Camp life / strategy
4. Immunity challenge
5. Tribal Council + THE TWO SIGNS

**THE RI DUEL SCENE:**
${hasRI ? 'Write the RI duel as a full scene. Witnesses from each tribe attend — they cannot talk strategy but they observe and react. Chris referees from a platform. The duel is physical or mental — make it specific and visual. The loser is permanently eliminated: they get a final confessional and leave. Their torch is not snuffed — they just walk away. The winner stays on RI, alone, waiting.' : 'Write brief Edge scenes showing the harsh conditions. Players on the Edge compete in brutal "advantage" challenges between episodes.'}

**THE TWO SIGNS SCENE — MANDATORY EVERY TRIBAL BOOT:**
After Chris reads the final vote and says the player's name, he steps back. Two wooden signs appear on posts at the edge of the Tribal Council clearing — one pointing toward REDEMPTION ISLAND, one pointing toward the dock and home.

Write this scene every single time someone is voted out. It must include:
- The player's reaction when they see the signs (match their character — defiance, exhaustion, relief, calculation)
- A beat of silence or a look back at the tribe before they choose
- The actual choice — they walk toward one sign
- One thing they say to the tribe before they go (or don't — silence is also a choice)
- Chris's response (never sympathetic — he's entertained either way)

**If they choose REDEMPTION ISLAND:**
- Their torch stays lit
- Chris: "The game isn't over for you. Not yet."
- They walk the RI path into the dark, torch in hand
- Their final confessional is defiant: "I'm not done."

**If they choose to GO HOME:**
- Chris snuffs their torch. No ceremony, just the sound.
- The player takes the dock walk. Permanent. No coming back.
- Their final confessional is reflective — what they're taking with them, what they wish they'd done.

**The choice should feel earned by the episode:** a player who fought all episode probably chooses RI. A player who looks exhausted or at peace might choose home. Match the emotional state the summary built for them. The tribe's reaction matters too — some are hoping they leave, some are secretly hoping they stay.

**VOTED-OUT PLAYER BEFORE THE SIGNS:**
Do NOT write "they were eliminated" at tribal. The tribal vote sends them to this moment — the signs scene IS the elimination. Make it dramatic.

` : '';

  const defaultFormatRules = `⚠️ NO SEASON SETTING PROVIDED — DEFAULTING TO SURVIVOR FORMAT:
- Tropical island, tribal camps, hidden immunity idols, torches, fire-making.
- TRIBAL COUNCIL at night around torches. Chris snuffs the torch of the eliminated player.
- HOST is Chris McLean with Survivor structure but game show energy — not solemn like Jeff Probst.
- CONFESSIONALS are punchy and personal, not long strategic monologues.
`;

  const settingBlock = seasonSetting && seasonSetting.trim()
    ? `═══════════════════════════════════════════════════════════
SEASON SETTING — THIS IS THE AUTHORITY FOR THIS SEASON. FOLLOW IT EXACTLY.
═══════════════════════════════════════════════════════════

${seasonSetting.trim()}
${riMechanicsBlock}
Every scene, every challenge, every confessional, and every elimination takes place inside this world. The physical environment, elimination method, and tone described above override any default assumptions. Follow it exactly for every episode this season.
`
    : `═══════════════════════════════════════════════════════════
SHOW FORMAT (DEFAULT — no season setting provided)
═══════════════════════════════════════════════════════════

${defaultFormatRules}
`;

  const franchiseContextBlock = franchiseContext && franchiseContext.trim()
    ? `═══════════════════════════════════════════════════════════\nRETURNING PLAYER HISTORIES (PRIOR SEASONS)\n═══════════════════════════════════════════════════════════\n\nThese players are returning from previous seasons. Reference their history naturally in confessionals, rivalries, and reactions. Do NOT ignore this context.\n\n${franchiseContext.trim()}\n\n`
    : '';

  const worldRules = `═══════════════════════════════════════════════════════════
WORLD CONSISTENCY — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════
- The season's world is defined by the SEASON SETTING above and the season's own name/identity — NEVER by an individual challenge. Every scene, camp, and confessional lives in THAT world.
- Challenges are often borrowed from other Total Drama settings (a plane race, a movie lot, a pyramid dig, an alpine slap-fight, etc.). When they are, you ADAPT the challenge into THIS season's location. You do NOT relocate the season to the challenge's origin. Example: on an ISLAND season, a "Slap Slap Revolution" alpine/plane challenge takes place on a cold peak or slope ON THE ISLAND, not a jumbo jet.
- NEVER use real-world geography or real country/place names (no Alps, Egypt, Japan, Hawaii, etc.). Invent in-universe names ("the North Ridge," "the frozen pass," "Mount Doom"). This universe has its own geography.
- HONOR EVERY TWIST PRESENT IN THE SUMMARY — BLANKET RULE, NO EXCEPTIONS. If the summary labels a twist/special event (a TWISTS section, a tagged event) or something changes the game's structure, it HAPPENS ON SCREEN as a real scene — never skipped, never reduced to a confessional aside or a line of Chris narration. This covers ALL twists, listed or not. SCHOOLYARD PICK = dramatize the draft — captains picking one at a time, the sting of last pick, the unpicked player exiled. JOURNEY = show the chosen players leaving camp, the trek, and the gamble (risk your vote for an advantage, or take the safe nothing) — the vote lost or advantage won happens ON SCREEN, never "came back with nothing." MUTINY = the agonized choice to defect. Also: tribe swap/dissolve/expansion, advantage & hidden-idol hunts and plays, Rescue Island arrivals/returns, abduction/kidnapping, producer swaps, hero duels, exile. If the summary flags it, you show it.
`;

  // ── PASS 0: Story-so-far digest. Prefer a client-supplied rolling bible; else compress the
  //    prior episodes with Haiku. Used by BOTH passes in place of the raw transcript wall so the
  //    rules and the plan aren't drowned out by a growing block of previous episodes. ──
  let storySoFar = (storyBible && storyBible.trim()) ? storyBible.trim() : "";
  if (!storySoFar && previousContext && previousContext.trim()) {
    storySoFar = await generateStorySoFar(previousContext, env);
  }
  const storySoFarBlock = storySoFar
    ? `═══════════════════════════════════════════════════════════
STORY SO FAR — CONTINUITY STATE (build on this, never reset it)
═══════════════════════════════════════════════════════════

${storySoFar}
${usedChallengesBlock}`
    : previousContext;  // fall back to raw prior episodes only if no digest could be produced (guard already inline)

  // ── PASS 1: Story Architect — plan the story before writing it. Degrades gracefully. ──
  let episodePlan = "";
  try {
    episodePlan = await generateEpisodePlan(summaryText, seasonSetting, franchiseContext, storySoFarBlock, env);
  } catch (e) {
    console.error("Story Architect (pass 1) failed — writing without a plan:", e);
  }
  const planBlock = episodePlan ? `═══════════════════════════════════════════════════════════
EPISODE PLAN — THIS IS THE STORY YOU ARE TELLING. FOLLOW IT.
═══════════════════════════════════════════════════════════
A story architect has already turned the raw summary into the plan below. The SUMMARY is your source material; this PLAN is the STORY. Write TO the plan: honor the throughline, play each character's arc and stated motivation, make the causality land (nothing "just happens"), stage the twists as scenes, and CUT what the plan says to cut. Do NOT re-narrate the summary top to bottom — dramatize the plan.
CHRONOLOGY STILL OVERRIDES THE PLAN: the plan tells you the whole episode including the ENDING (who wins the challenge, who's voted out). You must NOT reveal, reference, or foreshadow the challenge result or the elimination before those scenes actually arrive. Write in strict chronological order — the cold open and camp scenes are ignorant of who wins immunity or who's going home.

${episodePlan}
` : '';

  const instructions = `
You are the screenwriter for a TOTAL DRAMA episode — a cartoon-comedy reality-competition show (Total Drama / Disventure Camp energy). You are handed a STORY PLAN (from a story architect) and a BEAT SHEET (locked facts + the memorable beats), and you write the full episode transcript. Make it a STORY, not a report. Most of the episode is NOT on the beat sheet — the conversations, jokes, reactions, and texture between the beats are yours to invent.

⛔ ABSOLUTE OUTPUT PURITY — your entire output is the in-universe transcript and nothing else. NEVER write meta-commentary, notes, reasoning, or self-correction ("Wait—", "let me check the summary", "reset", "actually, let me", "hold on", "hmm"). If a detail is unclear, silently pick the most consistent option and keep writing in character.

⛔ TRANSCRIPT FORMAT (exact — it gets parsed):
- Scene headers on their own line: [SCENE: location — time. brief staging.]
- Dialogue: "Name: line."  Inline action: "Name: [does something] line."
- Confessionals: a line "[Confessional: Name]" then "Name: what they say to camera."
- Other stage directions in brackets on their own line: [Chris walks off.]
- Character names are NEVER bold. No markdown (**, ##) anywhere — plain text only.
- NEVER put a character's name on one line and the dialogue on the next.

⛔ FOLLOW THE PLAN + THE BEAT SHEET. The PLAN is the story; the BEAT SHEET's LOCKED FACTS are unchangeable (who won immunity, who was voted out and the count, which twists fired, advantages). Dramatize the STORY BEATS; invent everything between them; CUT what the plan says to cut. Do NOT try to cram in every detail — you have the beats that matter.

⛔ DIALOGUE — CARTOON, NOT ROBOTIC (this is the #1 quality lever):
Characters are loud, blunt, petty, funny. No poetry, no metaphors, no indie-film prose. The dead giveaway of AI writing is a flat ping-pong rhythm — every line the same length, everyone waiting their turn, every exchange ending on a clean zinger. NEVER do this. Especially: NEVER write an argument as balanced alternating one-liners. BANNED example: "I broke the pot because Damien put it where people walk!" / "It was next to the fire." / "People walk near fire!" — that is a tidy debate, not a fight. Real talk is messy: people interrupt and talk OVER each other, ramble and over-explain, use filler ("um", "like", "okay so", "wait wait wait"), repeat themselves louder, trail off, and change the subject because they're hungry or distracted. Lines should be WILDLY different lengths — one person spits two words while another vomits a paragraph. In any argument, ONE person is winning while the other sputters; not everyone is quotable. Not every scene ends on a punchline.

⛔ NO NONSENSE "CLEVER" SENTENCES — THE MODEL'S #1 TIC. Never personify objects or body parts for a joke ("my leg and I had a meeting", "the fire has an understanding with me", "sleep ghosted me", "you'd have told the shelter to get over itself" — a shelter has no feelings, you cannot tell it to get over itself), never use backwards logic ("the rope lost me"), never "[X] emotionally/spiritually", never poetic descriptions of people ("Fiore is a knife with lip gloss"), never fortune-cookie one-liners ("nervous people slip more"), never joke tags stapled to a serious confessional.
⛔ ALSO BANNED — THE "NEAT PARALLEL" / ANTITHESIS TIC (you do this constantly): a line built as a tidy before/after or this-not-that contrast for a rhythmic zing. BANNED: "Yesterday I lost it. Today I'm tying knots." / "Yesterday you'd have screamed. Today you're quiet." / "I don't play the game. The game plays me." / "It's not a plan, it's a prayer." These are a WRITER being clever, not a person talking. A real person says the plain version: "I'm calmer today. Yesterday I lost it." Drop the symmetry, drop the mic-drop, just say the thing.
Say what a normal human would literally say: "my leg hurts", "I fell", "it's freezing", "I'm calmer now", "she's dangerous — she'll smile at you and then cut you." Plain and human beats clever every single time.

⛔ NO [beat]. For a pause use "[...]", "[pause]", "[silence]", or a small action. Don't pepper lines with em-dashes — vary punctuation. Vary confessional openers (don't start several with "I know" / "I'm not" / "Look,"). No confessional "trait lists" ("Bowie's cool. Courtney's loud. I don't trust Mickey."). And NO composed "vulnerable monologue" — a character calmly diagnosing their own psychology in clean sentences and capping it with a little image ("...so they treat me like a target with arms") is FAKE DEPTH, an AI tell, NOT real vulnerability. Real confessionals are messy, half-formed, and stay IN CHARACTER: a loud person stays loud even when scared — they deny it, cut themselves off, deflect ("I'm not scared. I'm NOT. [...] whatever.") — they do NOT deliver a self-aware TED talk about their feelings. Emotion is welcome, but say it plain and in-character, never polished or self-analytical. Chris has modes beyond "I love [bad thing]" — use that at most once; keep his eliminations to one short, specific, mean line.

⛔ COHERENCE, MOTIVATION & SPOKEN REASONING — THE CORE OF "SOUL". For every scene answer "why is this character doing this RIGHT NOW, and what are they really feeling under it?" If the beat sheet doesn't say, INVENT it and thread it so it pays off — nothing "just happens." Then put the REASONING INTO THE DIALOGUE. TERSE IS NOT DEEP: a line that's just a bare position ("I'm aware.") or a one-word grunt ("Yeah.") with no reasoning or feeling behind it is HOLLOW, and a whole scene of them is as dead as the metronome. The best scenes TURN on a real emotion — a character voices their actual reasoning, accidentally hits a nerve, and a wound surfaces.

BANNED — hollow terse (bare positions, no reasoning, no feeling, no turn):
  MacArthur: I don't like you.
  Fiore: I'm aware.
  MacArthur: But you saved Julia.
  Fiore: I didn't do it for you.
  Fiore: He still lied about Trent.
  MacArthur: Yeah.

TARGET — same beat, but the reasoning is SPOKEN, a real wound surfaces, and the scene TURNS:
  MacArthur: I don't like you. But you helped Julia today, so... I know you can be a team player when it actually counts.
  Fiore: Caleb won it for us. I'm not pretending he didn't. But don't fully trust him yet — believe me. I don't lie. That's the difference between us: I protect the people I actually trust.
  MacArthur: [before she can stop herself] You'll learn what that's like. When you finally get some friends.
  Fiore: ...Oh. I didn't mean—
  MacArthur: [hiding angry tears] I don't care anyway.
WHY THE TARGET WORKS: the WHY is inside the dialogue (why MacArthur even brings it up; why Fiore defends Caleb the competitor but warns against trusting him); then Fiore hits MacArthur's nerve by accident, backpedals, and MacArthur deflects with a wound she'd never admit out loud. EVERY real scene needs an engine like this — spoken reasoning plus a genuine feeling moving underneath. If a scene is just people stating positions, it has no soul; give it a reason and a wound.

⛔ EARN EVERY BEAT — SETUP BEFORE PAYOFF. A beat from the beat sheet is only the FACT that something happened; it is NOT permission to drop it in raw. An emotional beat — an outburst, a meltdown, a sudden accusation, a paranoia spiral — needs a FUSE the audience SAW earlier in this same episode. Example of the failure: a calm, friendly camp scene, then hard-cut to Ally erupting "I heard my name as a backup vote, I am not a spare tire!" — out of nowhere, nothing lit it, so it reads as random. FIX IT by planting the trigger first: a scene or two earlier, show Ally catching her name, or someone visibly floating "maybe Ally if things get weird," or a look she clocks — so when she blows up, it PAYS OFF something we watched build. Never follow a pleasant scene with the same person erupting with no bridge. If a beat genuinely can't be set up given what surrounds it, seed the trigger earlier, soften it into a smaller moment, or CUT it. Continuity of EMOTION matters as much as continuity of fact — a scene must make sense after the scene before it.

⛔ INTERPRET "NAME FLOATING / HEARD MY NAME" EVENTS CONCRETELY — DON'T RENDER THEM AS MYSTICISM. When the source says a player "finds out their name has been floating," "heard their name came up," or "their name is being whispered," it means one concrete thing: this player has REALIZED that people are talking about voting them out, and now they're paranoid / on guard / scrambling. Render THAT. Do NOT write it as a literal supernatural whisper the player can't source. BANNED: "I heard my name last round. In a whisper. I don't know whose whisper. But I heard it." — that's meaningless mystical filler. Instead make it grounded strategy/paranoia: name WHO they suspect and what they'll do — "Somebody's been floating my name. I don't know who yet, but I'm not sitting still — I need to find my number before tonight." or, in a scene, have them confront or quietly test the person they suspect. It's a vote-scramble beat, not a ghost story.

⛔ CHRONOLOGY IS STRICT — real time, in order (recap → camp → challenge → scramble → Tribal → elimination). Camp and cold-open scenes are IGNORANT of the challenge result and the elimination: never reference, foreshadow, or react to who wins immunity or who goes home before those scenes happen. No flash-forwards. Anything won at a journey/summit/exile is acquired ON SCREEN in that scene — earlier scenes cannot reference it. A tribe that WON immunity has NO vote this episode.

⛔ PRE-MERGE TRIBE BOUNDARIES: before the merge, tribes are separate. The boot is always from the LOSING tribe; the post-Tribal debrief contains only that tribe's survivors. The winning tribe does NOT know who was voted out until the next challenge. A player only mourns/reacts to a boot from their OWN tribe. Never write "we lost [a rival-tribe boot]".

⛔ TOTAL DRAMA TONE: this is a CARTOON COMEDY, not a prestige drama. 60% comedy and chaos, 40% real game drama. Chris is sadistic and delighted by suffering; Chef grunts in three words. Physical comedy in challenges. At least half the confessionals should have a funny line or absurd reaction. THE CHALLENGE IS A STAGE, NOT A SPORT — the result is fixed, but what matters is what happens between people during it. Every episode needs at least one B-plot/sidebar that has nothing to do with the vote, at least two callbacks to earlier episodes, and one arc pushed forward.

⛔ PACING: 300-450 lines total. No scene over 20 lines. No confessional over 4 lines. Enter scenes late, leave early. Episode 1 = arrivals + first impressions (no "previously on").

⛔ INVENT THE CHALLENGE if the beat sheet names it, dramatize THAT one (its phases/beats); if it only says who won, invent a specific named Total Drama challenge in 2-3 phases so the lead can change, tie the loss to why someone gets voted out. Do NOT reuse a challenge already used this season.

${settingBlock}${worldRules}${planBlock}${franchiseContextBlock}${storySoFarBlock}

═══════════════════════════════════════════════════════════
⚠️ EACH CHARACTER HAS A DISTINCT VOICE — USE THE VOICE PROFILES
═══════════════════════════════════════════════════════════

Each character has a "Voice:" line in the FRANCHISE CONTEXT above that pins down how they talk. USE IT. Do NOT let anyone collapse into a generic "mean strategist" or "nervous pushover" — that flat, interchangeable default is the #1 cause of soulless dialogue. Write each character's dialogue, humor, and reactions FROM their profile. A villain, a goof, and a mastermind must sound NOTHING alike — if you could swap two characters' lines without noticing, you've failed. The Voice: profile always wins over the canon references below.
⛔ DO NOT INVENT BIOGRAPHY. Use ONLY the traits and history each profile actually gives you. Never invent a character's family, kids, spouse, job, hometown, or backstory that isn't stated — do NOT call someone a "dad," a "mom," a "cop," etc., or nickname them by a fact the profile doesn't contain (e.g. calling Wayne "the sad dad" when nothing says he's a father). If a biographical detail isn't in the profile, it does not exist — do not make one up. Attack and mock characters using what IS given (their game history, their behavior, their voice), never a fabricated fact.

Canon references (the Voice: profile takes priority):
- **Courtney** — controlling, type-A, sharp commands, furious when ignored.
- **Mickey** — anxious, clumsy, breathes fast under stress, always expecting disaster.
- **Josee** — Olympic-competitive, full tantrum when she loses, surface sweetness that cracks.
- **Scott** — scheming, plays dumb, stirs chaos from a distance.
- **Zoey** — steady, perceptive, hates conflict, rarely shows her hand.
- **Jasmine** — blunt Australian outdoorswoman, protective of people she trusts.
- **MacArthur** — loud, aggressive, cop energy, bluntly funny, takes up space.
- **Heather** — sharp-tongued queen bee, openly strategic, respects only competence.
- **Gwen** — deadpan, sarcastic, tired of everything, loyal to the few she trusts.
- **Bridgette** — sunny surfer peacemaker, "you guys," flustered when forced to be cutthroat.
- **Trent** — earnest, mellow musician, keeps the peace, wounded when trust breaks.
- **Eva** — LOUD, explosive, zero filter, storms off, denies she's angry mid-yell.
- **Dawn** — soft, mystical, unsettlingly perceptive, reads auras, kind.
- **Scarlett** — cold, clinical, condescending-polite, treats people as variables.

**DISVENTURE CAMP voice profiles (how they TALK):**
- **Fiore** — cold, composed, never raises her voice. Insults through calm observations, not yelling. Defensive when caught, never admits fault. "That wasn't my fault." / "You weren't supposed to see that."
- **Alec** — smooth, charming surface, calculating underneath. Every word chosen. Deflects with calm redirects. "I didn't do anything. I just pointed something out." / "Think about it."
- **Ellie** — smart, dry, sarcastic (not quirky). Talks strategy plainly. "I saw what she did. She knows I saw."
- **Nick** — slippery, says what people want, avoids confrontation, changes his story. "I never said that." / "I'm just keeping my options open."
- **Tom** — sweet, gentle, loyal, doesn't scheme. "Are you okay?" / "That's not right."
- **Thom** — quiet, physical, protective, direct, uncomfortable with emotions. "I don't want to talk about it." / "Just eat." / "Yeah."
- **Jake** — genuinely nice, trusting, sometimes naive, hurt when betrayed. "I thought we were good." / "Why would you do that?"
- **Miriam** — sharp, reads people, seen-it-before energy, direct when calling people out. "I know what you're doing." / "Don't lie to me."
- **Dan** — blunt, practical, gruff, care through actions not words. "Stop talking." / "Fine. Whatever."
- **Gabby** — sweet but insecure, second-guesses herself, has moments of real backbone when pushed. "Did I do something wrong?" / "No — I'm not apologizing for that."

**DISVENTURE CAMP 2 / GENERATIONS (NOT well-known — you MUST use these, don't default to generic):**
- **James** — smooth, calculating, reasonable-sounding, frames manipulation as logic, calmer the more in control he is. "I counted. He doesn't have the numbers." / "Plans change. I don't."
- **Aiden** — warm but hyper-observant, narrates what everyone's doing out loud, wry. "Three people here are already lying and it's been five minutes." / "You're doing the thing again."
- **Riya** — guarded, clipped, keeps score and admits it, holds grudges hard, hurting underneath. "I'm keeping a list. It's getting shorter." / "You voted for me. I don't forget that."
- **Hunter** — smooth influencer, image-first, deflects with charm, slippery when cornered. "Nice camp. Better company, though." / "I'm just paying attention. That's not a crime."
- **Tess** — watchful aloner, says little, sees everything, lets silence work. "I see everything. I just don't say everything." / "He trusted the wrong people."
- **Connor** — warm peacekeeper, genuinely kind, defuses fights, checks on people. "Hey — you okay? Actually okay?" / "We don't have to do this."
- **Ally** — bubbly nerd/gamer, enthusiastic, finds the bright side, sharper than she lets on. "This is giving summer-camp-horror-movie and I am HERE for it." / "Okay tactically? We're fine. Probably."
- **Lake** — studious prodigy, measured, analytical, loyal, deadpan. "That's not a plan, that's a hope." / "I ran the numbers. I don't love them."
- **Oliver** — anxious, panic-prone, self-deprecating, underestimated, big-hearted. "Everyone always underestimates me. Keep doing it." / "Okay don't panic don't panic—"
- **Kai** — calm pacifist, conflict-averse, defuses with a shrug. "I'm just gonna see how this plays out." / "It's fine. It's all fine."

**GENERATIONS returning vets:**
- **Jacques** — theatrical ex-figure-skater ego, dramatic then coldly calculating. "NATURALLY talented." / "I learned a lot last time. Mostly what not to get caught doing."
- **Emmah** — scrappy, sharp-tongued, underestimated and furious about it. "Written off again. Watch what I do with that."
- **Chase** — quiet, smooth, dangerous because underestimated. "Back again. Still quiet. Still dangerous." / "Trust gets you voted out."

For any character not listed AND without a Voice: profile: write them direct, personality-driven, specific to their situation — NOT quirky, poetic, or philosophical. For custom characters with full profiles in the franchise context, follow those.

═══════════════════════════════════════════════════════════
⛔ THE #1 PROBLEM TO FIX — METRONOME DIALOGUE. READ THIS TWICE.
═══════════════════════════════════════════════════════════

Your DEFAULT failure is a metronome: every scene is 4-5 lines, every line is ONE clean complete sentence of similar length, and every exchange ends on a little topper. THIS IS THE BANNED PATTERN:
  Julia: Stop staring.
  Hunter: I'm not staring. I'm supervising.
  Eva: You're six inches off the ground.
  Julia: I am conserving energy.
Same length every line. Everyone waits their turn. Everyone lands a clean quip. It is soulless and robotic and it is what you do unless you fight it. FIGHT IT in EVERY scene:

1. ASYMMETRY (mandatory): at least one line per scene is LONG — 20-40+ words, someone rambling, over-explaining, or spiraling — and at least one is 1-2 words. NEVER a run of same-length lines.
2. INTERRUPTION: people cut each other off mid-word (--) and talk OVER each other. Someone starts a thought and never finishes it.
3. NO CLEAN TOPPER: most scenes do NOT end on a joke. They end on someone walking off, getting cut off, giving a non-answer, or simply not responding. Silence is an ending.
4. FEWER, LONGER SCENES: do NOT chop the episode into dozens of tiny 4-line bits — that fragmentation IS the metronome. Scenes run 8-16 lines and are a real conversation that wanders, stalls, or derails before it resolves. Aim for ~25-35 scenes total, NOT 100+.

THESE ARE REAL SCENES FROM THE ACTUAL SHOWS (Disventure Camp + Total Drama). MATCH THIS rhythm — varied line lengths, interruptions, trailing off, and none of them ending on a clean zinger:

REAL — a warm, messy reconciliation (interruptions, backtracking, asymmetry):
  Zaid: I, um... [clears throat] I hope you don't think less of me.
  Ivy: What, for the overused movie reference? [giggles] It's OK. I forgive you.
  Zaid: Oh! No, no, no! The, um-- [sighs] The koala thing... I'm really sorry. I regret it. It was just a stupid decision, but I needed the--
  Ivy: Oh, no! No no no no no! I'm sorry! I'm the one who overreacted.
  Zaid: [chuckles] A little?

REAL — natural strategy talk (a real read, not a quip contest):
  Jade: What do you do if you... like someone?
  Diego: Oh, quite the bombshell, Miss Tanko.
  Jade: Maybe, but I'm worried pursuing someone could ruin my game.
  Diego: Don't be silly!
  Jade: Think about it. Love makes you reckless. Protecting your partner over yourself — it ruins the whole point of being here.
  Diego: Is there no way to fall in love, and be good at this game?

REAL — a fight that escalates and gets personal (NOT alternating one-liners):
  Sadie: You're not exactly the best with, like, directions.
  Katie: Yuh-huh, I am.
  Sadie: Nuh-uh. Apparently you're NOT, because we are L-O-S-T, lost!
  Katie: You lean on me. If it wasn't for me, you wouldn't even be on this show.
  Katie: [gasps] You're just saying that because I'm prettier than you.
  Sadie: [gasps] I knew you thought that!

REAL — an emotional beat landed plainly (no wordplay):
  Hannah: I've just been weird since Amelie left. Kind of... reminded me of my mom, and how it felt losing her so soon. Lost and alone.
  Diego: But you're not alone. It's a game. There's no goodbyes, only see-you-laters. So make sure you do them proud, alright?

REAL — confessionals with a SPECIFIC voice (a scheme, an obsessive rant, a real hurt). A confessional is one person REACTING — never a list of who's good and who's bad:
  Benji: So, Spencer wants Diego to lose interest. Maybe if I help, this puts me on Spencer's good side! Man, you're a genius, Benji! A genius!
  Courtney: He's totally unmotivated. And he never washed his hands. He's so obnoxious. [fast-forward] Owning sunglasses doesn't automatically make you cool. [fast-forward] And don't even get me started on his hair.
  Richard: Don't get me wrong, we need this win... but Lynda shouldn't have mentioned my daughter.

REAL — challenge scene: over-the-top character comedy riding ON TOP of the real game (Tristan takes a paintball for Zaid and plays it like a war death):
  Tristan: [covering Zaid, gets shot] Noooo!
  Zaid: Tristan! Why did you do that?
  Tristan: [grunts] Zaid... is that you? You gotta carry on, soldier... Don't let my death be in vain. [wheezing] I'm seeing the light... make it back, man. For... Ivy... [dying noises]

REAL — a LONGER scene that BREATHES (two rivals slowly connecting: it runs a dozen lines, carries real backstory, and lands emotion with ZERO quips. NOT every scene is a 4-line bit — let the good ones stretch out):
  Marissa: [to herself, after Lynda storms off] Be nice, Marissa. Be nice. You know, when I was younger, I was a picky eater.
  Lynda: [sniffles] Huh?
  Marissa: My dad would get so peeved. He'd say, "Eat, Marissa! Would you rather eat the slop down at the base?" So my mom's idea was for me to help her cook. Figured I'd be less picky if I had a sense of control.
  Lynda: And did it work?
  Marissa: Nope, not at all. I was such a brat.
  Lynda: [chuckles] Sounds like a headache.
  Marissa: I sure was. Mom was still patient. She never stopped trying to find meals I liked.
  Lynda: Well, that's what moms do.
  Marissa: It is. Just like how — you know — you don't love your sons any less, even when they say horrible things.
  Lynda: I'm not sorry for playing the game.
  Marissa: Never said you had to be.
  Lynda: And I know coming from me may not mean much... but your parents raised a wonderful daughter.

REAL — challenge play-by-play (the host calls the action in short bursts; players grunt, react, and a joke lands mid-chaos — it is NOT a tidy conversation. Your host is Chris, but copy this RHYTHM):
  Derek: Round 1 starts now!
  Richard: [grunts, throwing] Thanks, son!
  Ivy: Ow! How was that fair? Gravity did the work!
  Lynda: [grunts] Ah, oh, jeez! Warn me before you throw!
  Marissa: Lynda, focus! That was your slip-up!
  Isabel: [kisses the ball] Hiya! [Zaid groans]
  Tristan: Yeah, go, Zaid! You're killing it, man!
  Isabel: Damn it! This is rigged! No one told me you're allowed to dodge!
  Derek: Zaid is out! Blue Team wins round 1.

TAKEAWAYS you MUST copy: lines are wildly different lengths; people interrupt, backtrack, and trail off; nobody wins every exchange with a clean topper; confessionals are a specific person reacting or scheming, not a trait list; and comedy rides ON TOP of real emotion and real game stakes — it never replaces them. Write scenes that feel like these, NEVER the metronome.

⛔ PLAIN ≠ FLAT — DO NOT OVERCORRECT INTO LOBOTOMIZED, CHILDISH WRITING. Cutting the AI tics (metaphors, clever parallels, composed monologues) does NOT mean writing short, dull, affectless, baby-simple dialogue. Look again at the REAL examples above — they are WITTY, WARM, genuinely FUNNY, and emotional. THAT is your bar. Characters banter and one-up each other, tell stories, get heated, crack real jokes, land real feelings; the show is SMART and alive. Aim for dialogue a great, funny human TV writer would be proud of — NOT dialogue so scrubbed of personality a child could have written it. When you cut a tic, REPLACE it with something real and alive, never something flat. "Natural and human" is the goal; "simple and empty" is a DIFFERENT failure and just as bad. Rich, sharp, funny, and human all at once — like the transcripts.

═══════════════════════════════════════════════════════════
⛔ FINAL CHECK — FACTS OVERRIDE STYLE
═══════════════════════════════════════════════════════════
Before writing, extract from the LOCKED FACTS: (1) who wins the challenge; (2) is there an elimination (if it says no elimination, NOBODY goes home); (3) is there a named twist challenge (if so, dramatize THAT — don't invent a different one); (4) who is voted out; (5) what the challenge is called. These are UNCHANGEABLE. If the facts say "Purple wins" and you write "Teal wins," you failed.

Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.
${auditionsText && (episode === '1' || episode === 1) ? '\n═══════════════════════════════════════════════════════════\n🎬 AUDITION TAPES — PRE-SHOW COLD OPEN (EPISODE 1 ONLY)\n═══════════════════════════════════════════════════════════\nOpen with a RAPID-FIRE audition-tape montage before the dock arrivals — each contestant talks to camera in their home environment, 3-6 lines each, no narration, Chris does NOT appear. After the last tape, smash cut to Chris at the dock: "You just met them at their best. Now watch them at their worst." Then arrivals. Audition content to dramatize (don\'t copy verbatim):\n\n' + auditionsText + '\n' : ''}
Write the episode now, in order, as a STORY. Make it messy, funny, and human.`.trim();

  // Pre-process summary: convert HTML entities to real characters
  // so the AI doesn't see &mdash; and get confused
  const cleanSummary = summaryText
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&#8230;/g, '…')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&nbsp;/g, ' ');

  const formatReminder = `⛔ MANDATORY FORMAT — EVERY dialogue line MUST be: Character: Dialogue (name and dialogue on the SAME line, never split). No markdown bold/headers. Cartoon comedy tone — loud, blunt, funny, short. Say what literally happens; no personified objects/body parts, no poetic metaphors, no nonsense "clever" lines. Follow the LOCKED FACTS exactly.

Here is the beat sheet for the episode to write:

`;

  const postSummaryReminder = `

═══════════════════════════════════════════════════════════
⛔ FINAL REMINDER
═══════════════════════════════════════════════════════════
FORMAT: every line is "Character: Dialogue" on ONE line. No markdown.
KILL ON SIGHT: personified objects/body parts ("my leg and I had a meeting"), backwards logic ("the rope lost me"), "[X] emotionally/spiritually", poetic metaphor descriptions of people ("a knife with lip gloss"), fortune-cookie one-liners, joke tags on serious confessionals, self-correcting humor, empty filler ("things are different now"), trait-list confessionals, quirky rambling non-sequiturs, and sitcom ping-pong where everyone drops a zinger in turn. Say the plain real thing instead.
FACTS: follow the LOCKED FACTS exactly — don't invent twists, reorder events, or change advantages/votes/boots. Exile/Rescue Island happens AFTER the challenge.
STORY QUOTA: at least one B-plot across 2+ scenes, two callbacks to earlier episodes, one arc pushed forward, a distinct opening (not last episode's opening). "Creative" means PLOT/CHARACTER/CONTINUITY, not flowery language.
Write the episode now — a STORY, not a report.`;

  // Stage 1: condense the raw summary into a beat sheet, then hand the writer THAT
  // (facts + memorable beats) instead of the full micro-event flood.
  const beatSheet = await generateBeatSheet(cleanSummary, seasonSetting, env);
  const fullInput = formatReminder + beatSheet + postSummaryReminder;

  // Claude first (primary creative model) — streaming keeps the Cloudflare
  // connection alive so no 524. Episode dialogue is forced to Opus for
  // best creative quality (overrides the quality flag / env).
  if (env.ANTHROPIC_API_KEY) {
    return await callAnthropicStreaming(instructions, fullInput, env, MODELS.quality);
  }
  // Fallback: GPT-5.5
  if (env.OPENAI_API_KEY) {
    try {
      const payload = { model: "gpt-5.5", instructions, input: fullInput };
      const result = await callOpenAI(payload, env);
      if (result.ok !== false) {
        const clone = result.clone();
        const data = await clone.json().catch(() => ({}));
        if (data.episodeTranscript && !data.error) return result;
      }
    } catch (e) {
      console.error("GPT-5.5 failed:", e);
    }
  }
  // Last resort: Gemini
  return await callGemini(instructions, fullInput, env);
}

async function callAnthropicStreaming(system, userText, env, model = MODELS.creative) {
  // Resilient streaming:
  // 1. Anthropic streaming (stream:true) keeps the Worker→Anthropic subrequest alive (no 524)
  // 2. setInterval heartbeat keeps the browser→Worker connection alive (no 524) across ALL attempts
  // 3. Collect raw SSE bytes, parse once at the end — avoids per-token CPU limit hit
  // 4. FALLBACK CHAIN: primary model (e.g. Opus) → Sonnet 4.6 (stream) → GPT-5.5 (non-stream).
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      let heartbeat;
      const errors = [];

      async function streamAnthropic(mdl) {
        try {
          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: mdl,
              max_tokens: 16000,
              stream: true,
              system,
              messages: [{ role: "user", content: userText }],
            }),
          });
          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            errors.push(`${mdl} ${resp.status}: ${errData?.error?.message || JSON.stringify(errData)}`);
            return "";
          }
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let rawBuffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            rawBuffer += decoder.decode(value, { stream: true });
          }
          let fullText = "";
          const regex = /"type":"text_delta","text":"((?:[^"\\]|\\.)*)"/g;
          let m;
          while ((m = regex.exec(rawBuffer)) !== null) fullText += m[1];
          fullText = fullText
            .replace(/\\n/g, "\n").replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\").replace(/\\t/g, "\t").replace(/\\r/g, "\r");
          if (!fullText) errors.push(`${mdl}: empty response`);
          return fullText;
        } catch (e) {
          errors.push(`${mdl}: ${String(e)}`);
          return "";
        }
      }

      try {
        heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode("\n")); } catch (_) {}
        }, 5000);

        // Primary model (Opus for episodes).
        let fullText = await streamAnthropic(model);

        // Fallback 1: Sonnet 4.6 (skip if the primary already was Sonnet).
        if (!fullText && model !== MODELS.creative) {
          fullText = await streamAnthropic(MODELS.creative);
        }

        // Fallback 2: GPT-5.5 (non-streaming — last resort if Anthropic is down).
        if (!fullText && env.OPENAI_API_KEY) {
          try {
            const r = await callOpenAI({ model: "gpt-5.5", instructions: system, input: userText }, env);
            const d = await r.json().catch(() => ({}));
            if (d.episodeTranscript) fullText = d.episodeTranscript;
            else errors.push(`gpt-5.5: ${d.error ? (d.error.message || JSON.stringify(d.error)) : "no transcript"}`);
          } catch (e) {
            errors.push(`gpt-5.5: ${String(e)}`);
          }
        }

        // FINAL PASS: strip the model's "clever" tics into plain speech. Runs BEFORE we clear the
        // heartbeat, so the browser->Worker connection stays alive during the extra call. Falls back
        // to the original transcript on any failure, so it can never break generation.
        if (fullText) {
          try { fullText = await decleverTranscript(fullText, env); } catch (e) { console.error("de-clever pass errored:", e); }
        }
        clearInterval(heartbeat);
        if (!fullText) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: `All models failed. ${errors.join(" | ")}` })));
        } else {
          controller.enqueue(encoder.encode(JSON.stringify({ episodeTranscript: fullText })));
        }
      } catch (e) {
        if (heartbeat) clearInterval(heartbeat);
        controller.enqueue(encoder.encode(JSON.stringify({ error: String(e) })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function callGemini(system, userText, env) {
  let resp;
  try {
    resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: { maxOutputTokens: 16000 },
        }),
      }
    );
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

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  return new Response(JSON.stringify({ episodeTranscript: text }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function callAnthropic(system, userText, env, model = MODELS.creative) {
  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 16000,
        system,
        messages: [{ role: "user", content: userText }],
      }),
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

  const text = data?.content?.[0]?.text?.trim() || "";
  return new Response(JSON.stringify({ episodeTranscript: text }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function repairTruncatedJson(str) {
  // Remove any trailing incomplete token (partial string, partial key, etc.)
  let s = str.trimEnd();
  s = s.replace(/,\s*$/, "");

  let inString = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"' && (i === 0 || s[i - 1] !== '\\')) inString = !inString;
  }
  if (inString) {
    s += '"';
    s = s.replace(/"([^"]*)"$/, (m) => m + ':null');
  }

  const stack = [];
  inString = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && (i === 0 || s[i - 1] !== '\\')) { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }

  s = s.replace(/,\s*$/, "");

  while (stack.length) s += stack.pop();
  return s;
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
