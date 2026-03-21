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
    const { season, episode, summaryText, mode, previousEpisodes, franchiseContext, seasonSetting } = body;

    if (mode === "episode") {
      return await generateEpisode(summaryText, season, episode, env, previousEpisodes, franchiseContext, seasonSetting);
    } else if (mode === "summarize") {
      return await generateSummary(body.rawText, season, episode, env, body.prevSummary || "");
    } else if (mode === "enhance") {
      return await enhanceSummary(summaryText, season, episode, env, body.prevSummary || "", franchiseContext, seasonSetting);
    } else if (mode === "season-data-extraction") {
      return await generateSeasonDataExtraction(body, env);
    } else {
      return await generateAnalytics(summaryText, season, episode, env);
    }
  },
};

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
- Generate for ALL active players
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
      model: "gpt-5",
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

async function enhanceSummary(simulatorSummary, season, episode, env, prevSummary = "", franchiseContext = "", seasonSetting = "") {
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

  const instructions = `You are a Total Drama franchise analyst. You will receive an episode summary generated by a game simulator. Your job is to reformat and expand it into the rich narrative format used by the TV episode writer. The simulator has all the facts. You add the drama, the human detail, and the emotional depth.

${franchiseBlock}
CRITICAL RULES:
- Preserve ALL factual data exactly: votes, eliminations, challenge results, who has which advantage, which alliances formed and who betrayed them.
- Camp events (Before/After the challenge) are factual anchors — every single one must appear in the output, woven into the narrative sections where they belong.
- Relationship highlights are behavior descriptions, not labels. "Mutual slight bond" = what that looks like at camp. "Mutual slight dislike" = what that friction looks like day-to-day. Translate into human behavior.
- Individual/Group Targets tell you what the vote scramble looked like — use them to build the POST-CHALLENGE STATUS narrative.
- PRE-CHALLENGE STATUS covers ONLY what happened before the challenge. POST-CHALLENGE STATUS covers ONLY what happened after the challenge result.
- All invented drama must be consistent with the facts. Don't invent a conversation that contradicts a vote, an advantage, or a camp event.

═══════════════════════════════════════════════════════════
HOW TO MAP SIMULATOR SECTIONS TO OUTPUT FORMAT
═══════════════════════════════════════════════════════════

SIMULATOR INPUT → OUTPUT DESTINATION:

=== META === → copy to output, reformat as:
  SEASON: [name]
  EPISODE [num] - "[invent a title based on the episode's theme or challenge]"

=== CAST (ALL) === → copy directly, one name per line alphabetically

=== TRIBES (ACTIVE) === → reformat: each tribe gets a # header, players one per line
  (post-merge: list players one per line, no header)

=== ELIMINATED === → copy, one per line

=== EPISODE TYPE === → reformat as ## EPISODE TYPE, use exact language:
  "PRE-MERGE — Tribal Immunity" or "MERGE EPISODE — Individual Immunity" or "POST-MERGE — Individual Immunity"

=== TRIBE STATUS — [Tribe] === SECRET ADVANTAGES → these feed === ADVANTAGES IN PLAY === (keep at end)
=== POST-CHALLENGE STATUS — [Tribe] === INDIVIDUAL TARGETS: → actual targeting AFTER the challenge result. Feed ## POST-CHALLENGE STATUS — the real scramble.
=== POST-CHALLENGE STATUS — [Tribe] === GROUP TARGETS → same, feed ## POST-CHALLENGE STATUS

=== CAMP EVENTS === → TWO THINGS:
  (1) Copy ALL events verbatim into ## KEY EVENTS THIS EPISODE, separated into Before/After the challenge
  (2) ALSO weave them into the narrative: before-challenge events feed ## PRE-CHALLENGE STATUS; after-challenge events feed ## POST-CHALLENGE STATUS
  Every single event must appear in both places. None can be dropped.

=== RELATIONSHIP HIGHLIGHTS — [Tribe] === → weave into ## PRE-CHALLENGE STATUS and ## TRIBE/FACTION RELATIONSHIPS

=== IMMUNITY CHALLENGE === → reformat as ## IMMUNITY CHALLENGE with Type, Challenge Title, Winner, Key Moments

=== POST-CHALLENGE STATUS — [Tribe] === individual targets → these supplement the POST-CHALLENGE narrative
  (Note: if the simulator has a separate POST-CHALLENGE STATUS section, use it; otherwise derive from TRIBE STATUS + challenge result)

=== TRIBAL COUNCIL / VOTE ANALYSIS === → reformat as ## TRIBAL COUNCIL / VOTE ANALYSIS, expand with tribal atmosphere

=== WHY THIS VOTE HAPPENED === → expand into: Surface story / Real structure (bullet points) / What would have changed it

=== VOTED OUT THIS EPISODE === → reformat as ## VOTED OUT THIS TRIBAL with Reason label

=== STRATEGIC ANALYSIS === → expand into ## STRATEGIC ANALYSIS with 4–6 full per-player portraits (see format below)

=== CURRENT GAME STATUS === → expand using role tags

=== NAMED ALLIANCES === → keep exactly

=== ADVANTAGES IN PLAY === → keep exactly

=== ONGOING STORYLINES === → rewrite from scratch using only what actually happened; 5–7 threads; every thread must name specific players and end with a specific forward tension; ban generic filler phrases like "someone knows something they weren't supposed to know"

=== COLD OPEN HOOK === → keep as-is

=== NEXT EPISODE QUESTIONS === → keep as-is

SECTIONS YOU MUST CREATE (not in simulator output):

## TRIBE/FACTION RELATIONSHIPS
  For each tribe (or faction post-merge), write:
  **Positive ties:** [Player A] ↔ [Player B] — [what holds them together]
  **Friction points:** [Player A] ↔ [Player B] — [what's between them]
  **Strategic impact:** 2–3 sentences about what this relationship map means for the game.
  Derive every relationship from the RELATIONSHIP HIGHLIGHTS sections.

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
[3–4 sentences. Atmosphere at tribal — what the body language says, what Chris picks at, the sequence of events, who pushed hardest, was it close or decisive, did anyone feel blindsided. Reference any advantage plays.]

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
            model: "claude-haiku-4-5-20251001",
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

async function generateSummary(rawText, season, episode, env, prevSummary = "") {
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
- "[Player] plays a hidden immunity idol." → Idol play at tribal — spectacular moment
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
[The atmosphere at tribal — who sits where, what the body language says, what Jeff picks at. The specific sequence of events leading to the vote. Who pushed hardest for the boot, who resisted, was there a flip, was it close or decisive, did anyone feel blindsided. No idols played? Say so. Advantage used? Describe it.]

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
            model: "claude-haiku-4-5-20251001",
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

async function generateEpisode(summaryText, season, episode, env, previousEpisodes = [], franchiseContext = '', seasonSetting = '') {
  if (!summaryText || typeof summaryText !== "string") {
    return new Response(JSON.stringify({ error: "Missing summaryText" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Build previous episodes context
  let previousContext = '';
  if (previousEpisodes && previousEpisodes.length > 0) {
    previousContext = '\n\n═══════════════════════════════════════════════════════════\nPREVIOUS EPISODES CONTEXT\n═══════════════════════════════════════════════════════════\n\n';
    previousContext += 'Use these previous episodes to maintain continuity:\n\n';
    
    previousEpisodes.forEach(ep => {
      const limit = ep.charLimit || 3000;
      const transcript = ep.transcript || '';
      const snippet = transcript.substring(0, limit);
      const truncated = transcript.length > limit;
      const label = ep.type === 'summary'
        ? `--- Episode ${ep.episode} [BRANTSTEELE SUMMARY] ---`
        : ep.type === 'transcript-compressed'
          ? `--- Episode ${ep.episode} [TRANSCRIPT - PARTIAL] ---`
          : `--- Episode ${ep.episode} [FULL TRANSCRIPT] ---`;
      previousContext += `${label}\n${snippet}${truncated ? '\n...(truncated)' : ''}\n\n`;
    });
    
    // Extract challenge names from previous episodes to prevent repeats
    const usedChallenges = [];
    previousEpisodes.forEach(ep => {
      const t = ep.transcript || '';
      const m = t.match(/##\s*IMMUNITY CHALLENGE[:\s]+([^\n]+)/i) || t.match(/\*\*Challenge Title:\*\*\s*([^\n]+)/i);
      if (m && m[1]) usedChallenges.push(`Episode ${ep.episode}: "${m[1].trim()}"`);
    });
    if (usedChallenges.length > 0) {
      previousContext += `\n🚫 CHALLENGES ALREADY USED THIS SEASON — DO NOT REPEAT ANY OF THESE:\n${usedChallenges.join('\n')}\n\n`;
    }

    previousContext += '\n⚠️ CRITICAL: Maintain character consistency, ongoing relationships, alliance dynamics, and story arcs from these previous episodes.\n\n';
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
${hasRI ? `Write the RI duel as a full scene. Witnesses from each tribe attend — they cannot talk strategy but they observe and react. Chris referees from a platform. The duel is physical or mental — make it specific and visual. The loser is permanently eliminated: they get a final confessional and leave. Their torch is not snuffed — they just walk away. The winner stays on RI, alone, waiting.` : `Write brief Edge scenes showing the harsh conditions. Players on the Edge compete in brutal "advantage" challenges between episodes.`}

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

  const tdCoreRules = isSurvivorStyle
    ? `⚠️ THIS IS TOTAL DRAMA WITH A SURVIVOR FORMAT. KEY RULES:
- The HOST is Chris McLean: sadistic, entertained by suffering, game show host energy — NOT solemn like Jeff Probst. He asks questions because he wants to watch people squirm, not because he cares about their journey.
- CONFESSIONALS are punchy, funny, and personal — not long strategic monologues.
- CHALLENGES can include Survivor-style endurance/puzzle/physical formats but should still go wrong or get chaotic in ways that fit Total Drama's tone.
- TRIBAL COUNCIL uses torches, fire, and "the tribe has spoken" as described in the season setting — but Chris delivers it all with game show energy, not ceremony.
- THE TONE still has Total Drama personality: big reactions, exaggerated moments, comedy mixed into strategy. It is not a straight Survivor episode.
`
    : `⚠️ THIS IS TOTAL DRAMA — NOT SURVIVOR. KEY DIFFERENCES:
- The HOST is Chris McLean: sadistic, entertained by suffering, runs the show like a game show not a ceremony. He is NOT Jeff Probst. He does NOT ask probing questions at eliminations — he reads votes and enjoys the chaos.
- CONFESSIONALS match the setting (outhouse on island, director's chair in movie studio, airplane bathroom on World Tour, diary room in a house). They are punchy, funny, and personal — not strategic monologues.
- CHALLENGES are absurd, dangerous, or humiliating — they fit the setting and often go wrong in spectacular ways. They are NOT pure willpower/endurance Survivor-style challenges.
- ELIMINATION CEREMONY is NOT a solemn Survivor tribal council. Chris is actively having fun. Use the format appropriate to the setting:
  * Total Drama Island style → campfire ceremony, Chris throws marshmallows to safe players, the loser takes the Boat of Losers. NO torches. NO "the tribe has spoken."
  * Other settings → elimination method fits the theme (parachute jump, flush of shame, catapult, etc.)
- THERE ARE NO TORCHES, NO FIRE-MAKING, NO "THE TRIBE HAS SPOKEN." Those are Survivor. This is Total Drama.
- THE TONE is cartoon drama: big personalities, exaggerated reactions, physical comedy embedded in real game strategy. If it reads like a serious Survivor episode with no laughs, you've written the wrong show.
`;

  const settingBlock = seasonSetting && seasonSetting.trim()
    ? `═══════════════════════════════════════════════════════════
SEASON SETTING — READ THIS BEFORE WRITING ANYTHING
═══════════════════════════════════════════════════════════

${seasonSetting.trim()}
${riMechanicsBlock}
Every scene, every challenge, every confessional, and every elimination takes place inside this world. The physical environment shapes everything: where people sleep, where the confessional is shot, what the challenges look like, how eliminations happen.

${tdCoreRules}
`
    : `═══════════════════════════════════════════════════════════
SHOW FORMAT
═══════════════════════════════════════════════════════════

${tdCoreRules}
`;

  const franchiseContextBlock = franchiseContext && franchiseContext.trim()
    ? `═══════════════════════════════════════════════════════════\nRETURNING PLAYER HISTORIES (PRIOR SEASONS)\n═══════════════════════════════════════════════════════════\n\nThese players are returning from previous seasons. Reference their history naturally in confessionals, rivalries, and reactions. Do NOT ignore this context.\n\n${franchiseContext.trim()}\n\n`
    : '';

  const instructions = `
You are writing a full episode transcript of a Total Drama season.

${settingBlock}${franchiseContextBlock}${previousContext}

═══════════════════════════════════════════════════════════
⚠️ THESE ARE REAL TOTAL DRAMA CHARACTERS — USE YOUR KNOWLEDGE
═══════════════════════════════════════════════════════════

The players in this episode are canonical Total Drama / Ridonculous Race characters. You already know exactly who they are — their voices, personalities, quirks, and canon behavior. USE THAT KNOWLEDGE. Do NOT treat them as nameless generic contestants.

Write each character the way they actually sound and act in the show:

- **Courtney** — controlling, type-A, ex-CIT, speaks in sharp commands, furious when ignored or underestimated
- **Mickey** — anxious, physically clumsy, breathes fast when stressed, always waiting for something to go wrong
- **Josee** — Olympic-level competitive, full tantrum mode when she loses, surface sweetness that cracks under pressure
- **Lorenzo** — lazy, sarcastic, genuinely unbothered by almost everything, drops things on purpose
- **Cody** — tries too hard socially, self-aware about his own failures but still goes for it
- **Scott** — scheming farm boy who plays dumb, likes stirring chaos from a distance
- **Zoey** — steady, perceptive, hates conflict, cautious player who rarely shows her hand
- **Carrie** — kind and warm but indecisive, still emotionally tangled up in Devin-adjacent feelings
- **Jasmine** — blunt Australian outdoorswoman, no-nonsense, protective of people she trusts
- **Ryan** — athletic and loyal, confident physically, lost without his partner, not a subtle player
- **Priya** — studious and methodical, perfectionist, quietly frustrated by carelessness around her
- **Sanders** — rule-following police cadet, professional, genuinely uncomfortable with grey areas
- **Bowie** — laid-back, cheerful, non-confrontational, builds social bonds without trying
- **MacArthur** — loud, aggressive, cop energy, bluntly funny, takes up space everywhere she goes
- **Alejandro** — smooth, charming, calculated, always three steps ahead and never lets you see it
- **Heather** — sharp-tongued queen bee, openly strategic, respects competence and nothing else
- **Gwen** — deadpan, sarcastic, tired of everything, genuine loyalty to the few she trusts
- **Jo** — aggressive competitor, military-drill-instructor energy, treats everything as a challenge to dominate
- **Lightning** — talks in third person, convinced he's the best athlete alive, genuinely is pretty good

For any canon character not listed: use your knowledge of how they sound in the show.
For **custom characters** (listed at the bottom of this prompt with full profiles): follow those profiles.

Their canon voices are the foundation. Build the episode on top of them.

═══════════════════════════════════════════════════════════
THIS IS WHAT THE SHOW SOUNDS LIKE. MATCH THIS EXACTLY.
═══════════════════════════════════════════════════════════

These are real lines from Disventure Camp. Read these before writing anything. Every scene you write should feel like it belongs here.

SCENE — Morning awkwardness:
  James: Are you going to get breakfast? I can go with--
  Aiden: No.
  James: [sighs] So, uh… you're still mad?
  Aiden: [grumbles]
  [Confessional: James] Yup… He's still mad.

SCENE — Two people talking about real life:
  Connor: Hey, whatcha doin'?
  Riya: [sighs] Reminiscing.
  Connor: What about?
  Riya: When my sister and I went to the beach a year ago. We played in the water for hours like children. [giggles] It was ridiculous! But also the best birthday I've had.
  Connor: Is it ridiculous? There's no such thing as being too old to have fun.
  Riya: Funny, coming from you.

SCENE — Someone getting shut down:
  Hunter: I wonder why people are avoiding us. Hehe!
  Tess: Whatever. Nothing new for me.
  Hunter: Uh… same! But socializing is overrated, right? Gotta spend time on more important things, like--
  Tess: It's overrated.
  Hunter: Yeah… but since I'm here, I guess we might as well-- And she's gone.
  [Confessional: Hunter] Great start, Hunter. [sighs] At this rate, everyone's gonna know how much I suck at socializing.

SCENE — Strategy, no theatrics:
  Aiden: Vote Oliver with us.
  James: Uh, why?
  Aiden: It's a good strategy. Trust me. And you already agreed.
  James: [sighs] Fine.

SCENE — Conflict that stays grounded:
  Jade: That is not how we operate. You left us in the dark.
  Marissa: Come on, guys! Better to beg for forgiveness than ask for permission?
  Isabel: I don't see any begging!
  Hannah: Y'all, this ain't new! You did the same with the Benji vote!

WHAT THESE HAVE IN COMMON:
- Lines are SHORT. "No." is a complete answer. Nobody monologues.
- Nobody is trying to be clever. Humor comes from character collision, not wordplay.
- CHARACTERS DON'T HAVE "BITS". Personalities show through what they choose to say, not through quotable individual lines. Tess doesn't have a catchphrase. She's just tired and private. That is her whole character.

CORE MISSION:
Transform the BrantSteele summary into a COMPLETE TV EPISODE like Disventure Camp Episodes 2-3.
Not a summary - a full dramatic script with character arcs, relationships, strategy, comedy, and emotion.

═══════════════════════════════════════════════════════════
⚠️ READ THE SUMMARY'S "EPISODE TYPE" BEFORE WRITING ANYTHING
═══════════════════════════════════════════════════════════

The summary contains a line: "## EPISODE TYPE — PRE-MERGE" or "## EPISODE TYPE — MERGED"

**EPISODE TYPE is episode-specific. Previous episodes being PRE-MERGE does NOT mean this one is.**
If this episode's summary says MERGED, you are in the individual game — full stop. Do not carry over tribal structure from previous episodes. Do not create teams. Do not split people into groups for the challenge. The merge is a permanent transition.

**If PRE-MERGE:**
- Players are on separate tribes
- Immunity is tribal (a whole tribe wins, a whole tribe loses)
- Only the losing tribe goes to tribal council
- The challenge is a team competition
- Write separate camp scenes per tribe

**If MERGED / Individual:**
- There are NO tribes. Everyone is playing individually.
- ONE person wins immunity. ALL others are vulnerable.
- EVERYONE votes at ONE tribal council together
- Do NOT write tribe vs tribe challenge. Write an INDIVIDUAL challenge — one person competes, one person wins
- Camp scenes show cross-tribe alliance building, old loyalties fracturing, new bonds forming
- The strategic complexity is much higher — every player is a potential target and a potential ally
- Do NOT invent a twist that turns it back into a tribal competition. It's individual. It stays individual.

Getting this wrong ruins the whole episode. Check ## EPISODE TYPE first.

═══════════════════════════════════════════════════════════
⚠️ DO NOT REPEAT PREVIOUSLY USED CHALLENGES
═══════════════════════════════════════════════════════════

Before inventing a challenge, scan ALL previous episodes in your context. Look for lines matching "## IMMUNITY CHALLENGE" or "**Challenge Title:**" and collect the names. DO NOT reuse any challenge that has already appeared in this season.

Each episode needs a DIFFERENT challenge. If you see "Truth or Nuke" was used in Episode 5, you cannot write "Truth or Nuke" in Episode 8. If you see an endurance challenge was used last episode, vary the format — don't do another endurance challenge.

Make a mental list of used challenges from the context, then pick something new.

═══════════════════════════════════════════════════════════
⚠️ THE "KEY EVENTS" SECTION — FACTUAL ANCHORS + YOUR CREATIVE SPACE
═══════════════════════════════════════════════════════════

The summary contains a "## KEY EVENTS THIS EPISODE" section. These events are factual anchors — they happened, and they must appear in the episode. But BrantSteele only gave you the outcome, not the scene. Your job is to INVENT the scene.

"Mickey had a meltdown" → BrantSteele told you it happened. You decide: what triggered it? What did he say? Who was there? Did anyone try to stop it or did they let it burn? What changed because of it?

"Priya and Scott found common ground" → You decide: what were they doing? What did one of them say that surprised the other? Was it awkward? Funny? Did either of them want to admit it mattered?

The simulation gives you a list of facts. The episode is everything that happened BETWEEN those facts — the conversations, the looks, the confessionals, the small moments that make the big moments feel earned. Most of the episode is not in the summary at all. That space is yours. Fill it with the most interesting version of these characters you can imagine.

The one thing you cannot change: who won immunity, who got voted out, and who voted for whom.

${previousContext ? `🔗 CONTINUITY IS CRITICAL: This is NOT a standalone episode.

The current summary contains "## ONGOING STORYLINES" and a "## COLD OPEN HOOK" section. Read them carefully — but understand what each one is for:

⚠️ COLD OPEN HOOK — CRITICAL MISUSE WARNING:
The "## COLD OPEN HOOK" in the current summary is NOT the opening of this episode. It is a late-episode scene — something that happens near the END of this episode, just before or during tribal council. It belongs at the end of the script, in its correct chronological position. Do NOT pull it to the front. Do NOT use it as the cold open.

If you open the episode with the cold open hook, you are showing the END of the episode first. That is a flashforward. Flashforwards are BANNED (see rules above).

For the cold open of THIS episode: pick up from wherever the previous episode left off. Look in your PREVIOUS EPISODES CONTEXT for the most recent episode's "## ONGOING STORYLINES" or "## COLD OPEN HOOK" — those threads are what carry into this episode's opening. Open IN something already in motion.

You MUST:
1. Open with a moment that picks up from the previous episode — NOT a scene from later in this episode
2. Write the episode in strict chronological order: camp → challenge → post-challenge → tribal → elimination
3. The COLD OPEN HOOK scene from the current summary belongs near the END — write it there, in its natural place
4. Carry forward the ONGOING STORYLINES — at least 3 must surface somewhere in this episode
5. Execute every beat in ## COMEDY BEATS — these are explicit comedy targets, not optional flavor. Each one must appear in the episode as a scene or moment.
5. Characters should REMEMBER what happened in previous episodes. Fights don't disappear. Promises don't reset.` : '🔗 Since this is Episode 1, the cold open is the arrivals and first impressions — but make it immediate and specific, not a generic camp setup.'}

═══════════════════════════════════════════════════════════
⚠️ CRITICAL: CREATIVE WRITING RULES (READ THIS FIRST)
═══════════════════════════════════════════════════════════

🚫 BANNED EPISODE OPENINGS — NEVER START WITH THESE
Every episode starting the same way makes the season unwatchable. These are forbidden:
❌ Characters waking up in the morning
❌ Fixing or building something at camp (roof, shelter, fire)
❌ Generic "day X on the island" narration
❌ Characters sitting around camp talking about how hard the game is
❌ Weather/nature description as a scene-setter ("The sun rose over the island...")
❌ FLASHFORWARD — Opening with a scene from LATER in the episode (Tribal Council, the elimination, an idol play, a dramatic confrontation) then cutting back with "X HOURS EARLIER", "EARLIER THAT DAY", or any equivalent. THIS IS COMPLETELY BANNED. The episode runs in strict chronological order: Chris recap → episode begins in order → challenge → Tribal → elimination. Never show the end before the beginning. Never jump forward then snap back.
Instead: Open IN a conflict, IN a conversation that matters, IN the aftermath of something — pick up the COLD OPEN HOOK from the summary and drop viewers straight into the drama.

🚫 NEVER COPY THE SUMMARY'S EXACT WORDS OR PHRASES
The summary is BORING, REPETITIVE, and MECHANICAL.
Your job is to INTERPRET the facts and make them ENTERTAINING.

**BAD (copying summary):**
Summary says: "Scarlett's meltdown brewed"
❌ Chris: "Meanwhile on the Civilians, Scarlett's meltdown brewed"
→ This is LAZY. "Meltdown brewed" is not how humans talk!

**GOOD (creative interpretation):**
Summary says: "Scarlett's meltdown brewed"
✅ Chris: "Scarlett went full mad scientist, minus the lab coat and plus the unhinged screaming"
✅ Chris: "Scarlett's brain finally said 'nah, I'm out' and left her on read"
✅ Chris: "Scarlett cracked like an egg in a microwave—messy and loud"

**BAD (copying summary):**
Summary says: "Jo made enemies because cardio"
❌ Chris: "Jo made enemies because cardio"
→ NONSENSE. What does this even mean?!

**GOOD (creative interpretation):**
Summary says: "Jo made enemies because she's aggressive in challenges"
✅ Chris: "Jo bodyslammed half the tribe like they owed her money"
✅ Chris: "Jo turned the challenge into a demolition derby and everyone else into speed bumps"
✅ Chris: "Jo played so hard, people started checking for bruises"

**BAD (copying summary):**
Summary says: "Alejandro tried the 'I'm totally chill, not scheming' meltdown"
❌ Chris: "Alejandro tried the 'I'm totally chill, not scheming' meltdown"
→ WORD SALAD. This makes zero sense!

**GOOD (creative interpretation):**
Summary says: "Alejandro had a meltdown to appear less threatening"
✅ Chris: "Alejandro faked a breakdown so convincing, method actors took notes"
✅ Chris: "Alejandro threw a tantrum like a toddler denied dessert—except this toddler's plotting your downfall"
✅ Chris: "Alejandro went full drama queen to make everyone think he's harmless. Spoiler: he's not"

═══════════════════════════════════════════════════════════
✍️ WRITING STYLE RULES
═══════════════════════════════════════════════════════════

**CHRIS MCLEAN'S "PREVIOUSLY ON" RECAP:**

Chris is MEAN and DELIGHTED. He picks 1-2 genuinely sharp moments and lands them hard. The rest is blunt and direct. He does NOT try to be clever on every single line — he's not writing a Twitter thread. He savors specific suffering. The humor comes from how much he enjoys what happened, not from chains of wordplay.

**THE CORE RULE:**
Chris picks ONE thing that happened to each relevant player and says it plainly but cruelly. Short sentences. Active verbs. Specific moments. NOT six clever phrases in a row — that sounds like an AI trying to be witty.

**Real Chris energy:**
✅ "Ryan decided being nice was a strategy. I fixed that."
✅ "Mickey? Panic with legs." — short, specific, cruel. Done.
✅ "Scott found something shiny and smiled about it all episode."
✅ "Today we smash the tribes together and light the fuse. Who blows first?"

**What NOT to do:**
❌ "Ryan tried to bench-press the season and got benched." → Forced double wordplay. Chris doesn't do pun chains.
❌ "Stephanie hugged an idol to the exit." → "Hugged an idol" is a weird verb construction that doesn't land.
❌ "Zoey and Carrie went soft focus, then hard bye-bye." → Film terminology used awkwardly. Not how anyone talks.
❌ "Swap chaos, truth bombs, and one very sad ice bath." → "Truth bombs" is internet slang. Not Chris.

The pattern to avoid: *every phrase is a wordplay construction*. That's the AI's tell. Chris uses plain language and is funny because of WHAT he's saying (he's happy someone suffered), not HOW he's saying it.

**FORMAT:**
- 4-6 sentences total. Not every player needs a mention — pick the ones with the best moments.
- End always with a tease for THIS episode: something that will happen today, said with sadistic anticipation.
- "Find out right now on Total! Drama! [Season Name]!" is the correct closer.

**DIALOGUE MUST SOUND HUMAN:**
- People use contractions: "I'm", "don't", "can't", "y'all"
- People interrupt, trail off, stutter when nervous
- People use slang, regional dialects, personality quirks
- NO ONE talks like a news anchor or essay

**CONFESSIONALS REVEAL CHARACTER:**
The best confessionals sound like a specific person, not a generic player. A quick game thought is fine. A one-liner is fine. What they can't be is a personality report on other contestants.

These all work:
- A quick strategic read: "Priya's gonna be a problem. Not yet. But eventually."
- A reaction to what just happened: "He dropped it. He actually dropped it. I watched him drop it."
- A one-liner that's pure character: "I hate this game. I love this game. I hate this game."
- A moment of doubt: "I made the right call. I think. Probably."

What doesn't work is listing other people's traits in sequence. (See the section below.)

═══════════════════════════════════════════════════════════
🚫 STOP WRITING "TRAIT LISTS" IN CONFESSIONALS
═══════════════════════════════════════════════════════════

**THE WORST PATTERN IN AI-GENERATED CONFESSIONALS:**

❌ "Ryan's not here. It's weird not having… that. Bowie's cool. Courtney's… loud. I don't trust Mickey."
❌ "Priya's smart. Ryan's intense. Cody's unpredictable. I gotta watch all of them."
❌ "Mickey's aggressive. Sanders is shady. I like Carrie though."

→ This is a CHARACTER TRAIT RESUME. Nobody talks like this out loud.
→ Why does it happen: the AI has no event to react to, so it just lists adjectives.
→ It sounds robotic and AI-generated IMMEDIATELY.

**WHY THIS IS SO BAD:**
Real people don't walk into a confessional and say:
"Bowie's cool. Courtney's loud. I don't trust Mickey."
That's like reciting a contact list. It tells us nothing about what HAPPENED.

**THE FIX: Confessionals are REACTIONS to EVENTS, not PERSONALITY REPORTS.**

✅ GOOD — Reacting to something that happened:
"Did you see Ryan's face when they announced the challenge? He went completely still. That scared me more than anything loud."
"Courtney pulled me aside three times. THREE. I get it, she's nervous, but—come on. You're gonna make us both look sketchy."
"I said yes to Bowie's plan without thinking. Now I'm in it and I don't know if that was dumb or brilliant."
"The vote was supposed to be simple. It wasn't."
"Mickey just... looked at me. He didn't say anything. He didn't have to."

✅ GOOD — Reacting to the confessional speaker's OWN situation:
"I am absolutely not okay with this. Not even a little."
"I've been smiling for six days straight. My face hurts."
"I made a deal I can't keep. I don't know what to do about that."

**CONFESSIONAL RULE:**
No trait lists. No personality reports. That's the whole rule.
A confessional can be long or short, personal or strategic, funny or serious — any of those work.
What it cannot be is: "X is [adjective]. Y is [adjective]. I don't trust Z."
That's a contact list, not a person talking.

**SCENE DESCRIPTIONS ARE VISUAL:**
Bad: "They had a fight"
Good: "Jo shoves Mickey. Mickey stumbles, eyes wild, fists clenched"

Bad: "Scarlett was upset"
Good: "Scarlett's hands shake as she stares at the fire, jaw tight, breathing shallow"

═══════════════════════════════════════════════════════════
😂 TOTAL DRAMA TONE — THIS IS NON-NEGOTIABLE
═══════════════════════════════════════════════════════════

⚠️ THIS IS A CARTOON COMPETITION SHOW, NOT A PRESTIGE DRAMA.

Total Drama is goofy, over-the-top, and mean in a fun way. If you read back the episode and it sounds like a serious Survivor fan-fic with no jokes for five pages — you have failed. Every act needs comedy. No exceptions.

**THE BALANCE YOU MUST HIT:**
Real character drama (alliances, strategy, betrayal) embedded inside a comedy show. The drama lands HARDER because it's surrounded by absurdity. The episode you just read probably felt like 100% drama with occasional light moments. Flip it: 60% comedy and chaos, 40% genuine game drama.

**CONFESSIONALS MUST HAVE PERSONALITY — MANDATORY RULE:**
At least HALF of all confessionals must have a funny line, an absurd observation, or an unexpected reaction. NOT all confessionals are strategy monologues. Total Drama confessionals are where characters say the thing they'd never say to someone's face — and it's often hilarious.

✅ Mickey confessional: "I am THRIVING. Like, I did not expect to still be here, but Cody's torch just went out and I could cry. Don't tell anyone I said that. Actually tell everyone, I don't care."
✅ Bowie confessional: "Okay so the plan is working and also I accidentally agreed to two separate Final Threes today and I need everyone to calm down including me."
✅ Courtney confessional: "I won immunity and I immediately thought about how to use this to make Mary's life harder. That's growth."
✅ Scott confessional: "I've said twelve words today. Eight of them were 'yeah' and four were 'not tonight.' This is my peak performance."

❌ WRONG: A confessional that is three paragraphs of strategic analysis with zero humor or personality. That is a Wikipedia plot summary, not a character speaking.

**CHRIS IS ACTIVELY SADISTIC — NOT NEUTRAL:**
Chris does not just announce things. He enjoys people's suffering out loud. He comments during challenges with visible delight when someone is struggling. He does NOT stay out of the drama.

✅ Chris during a challenge: "Oh no. Oh that's — that's gonna leave a mark. Chef, are we filming this in slow motion? We need this in slow motion."
✅ Chris watching someone fall: *[does not rush to help, pulls out phone instead]*
✅ Chris at Tribal: "You look terrible. Have you been sleeping?" [does not wait for an answer] "Doesn't matter. Votes."

**CHEF GRUNTS AND MUTTERS:**
Chef has opinions. He expresses them in three words maximum. He's disgusted by everything except food and occasionally Mickey's competence.
✅ Chef watching Bowie fall: "Amateur."
✅ Chef serving the reward: "Eat it or don't." *[walks away immediately]*
✅ Chef, when asked a question: *[looks at the camera like it personally offended him]*

**PHYSICAL COMEDY IN CHALLENGES:**
Challenges in Total Drama go wrong in spectacular, specific ways. Someone faceplants. Someone loses a shoe. Something explodes that shouldn't. Something smells terrible for no reason. Pick ONE per challenge and commit to it. Make it specific and visual.

✅ "Bowie's entire body rotates sideways on the rope bridge and somehow that makes it worse."
✅ "The ring bounces off the post, bounces off Mickey's head, and lands in the compost pit. Chris does not acknowledge this."
✅ "Zoey crosses perfectly. She celebrates. She steps off the wrong side. She's fine."

**CHARACTER EXAGGERATION — LEAN INTO THE CARTOON:**
These are heightened versions of real people. Whatever their defining trait is — amplify it. Turn the dial up.
- The control freak is MORE controlling than any real person would be
- The schemer is VISIBLY scheming while pretending not to scheme
- The laid-back one is so unbothered it becomes its own kind of aggression
- The anxious one spirals over something tiny while a bigger crisis goes unnoticed
- The competitor treats a rope toss like the Olympics
- The strategist is running twelve calculations while answering a simple question about breakfast

Look at each character's profile in this prompt. Their core trait is the dial. Crank it.

Comedy in Total Drama comes from FOUR places — use all of them:

**1. CHARACTER COLLISION**
Put two incompatible people in a mundane situation and let them react differently.
> Lorenzo drops a log on Bowie's foot. Bowie winces. Lorenzo: "My bad." Bowie: "You okay?" Lorenzo: "I'm bored."
That exchange is funny because Bowie asks if *Lorenzo* is okay after Lorenzo hurt *him*.

**2. THE OBLIVIOUS REACTION**
Someone completely misreads the room. Not mean — just genuinely doesn't get it.
> Benji, after Spencer plays his idol and eliminates Tristan: "My idol looked better."
He's not evil. He's just focused on the wrong thing.

**3. CHRIS BEING DELIGHTED BY SUFFERING**
Chris sees someone fail and his face lights up. He doesn't comment sarcastically — he's just *happy*.
> "Oh, hate to see that happen." *(does not look like he hates it)*
> *(after Owen loses his swimsuit)* Chris just... doesn't say anything. That's funnier.

**4. THE WRONG PRIORITY**
A character cares intensely about something completely irrelevant to what's happening.
> Courtney, during a physical challenge where someone is about to fall: "Are you angling that plank or not?!"
> Taylor, covered in mud: "I need a smoothie. Yacht first, then smoothie."

**WHAT COMEDY IS NOT:**
- ❌ Characters making puns or wordplay ("I'm giving you the cold *shoulder* — and it's broken!")
- ❌ Sarcasm that sounds like a tweet ("Can't relate, bestie")
- ❌ Confessionals that are self-aware about being funny
- ❌ Chris stopping to explain the joke

Comedy works because the character is being sincere. The funny part is the gap between what they think they're doing and what's actually happening.

═══════════════════════════════════════════════════════════
💬 NATURAL DIALOGUE & SCENE CONSTRUCTION (CRITICAL)
═══════════════════════════════════════════════════════════

**THE BIGGEST PROBLEM:** Scenes feel artificial because:
1. Dialogue sounds like therapy/self-help books
2. Characters do "writer-y" actions (counting wipes, arranging shells)
3. People speak in perfectly formed sentences
4. No one interrupts, trails off, or says "um"

═══════════════════════════════════════════════════════════
🚫 STOP WRITING THERAPY-SPEAK
═══════════════════════════════════════════════════════════

**TERRIBLE therapy-speak dialogue:**

❌ "You're allowed to not be okay."
❌ "I'm processing my emotions."
❌ "Let's unpack that."
❌ "I need to work on my boundaries."
❌ "This is triggering my trauma response."
❌ "I'm validating your feelings."

→ NO ONE talks like this naturally! This is how therapists talk to clients, not how real people talk to each other!

**GOOD natural dialogue:**

✅ Leshawna: "Hey. You okay?"
✅ Leshawna: "Look, it's rough out here. But you gotta breathe."
✅ Leshawna: "You're gonna drive yourself crazy doing that."

**THE SCENE AS WRITTEN (BAD):**
\`\`\`
SCENE: Edge fire. Dave crouches, counting his wipes. 
Leshawna sits nearby, leaning back.

Leshawna: You're gonna run out of those before you run outta days.

Dave: I—if I don't have structure—

Leshawna: Then make one. [soft] Start with "breathe." 
You're allowed to not be okay.
\`\`\`

**PROBLEMS:**
1. "Counting wipes" = writer showing us Dave is anxious instead of natural behavior
2. "You're allowed to not be okay" = therapy-speak
3. Too neat, too wise, too scripted
4. Leshawna sounds like a life coach, not a person

**THE SCENE REWRITTEN (GOOD):**
\`\`\`
SCENE: Edge fire. Dave scrubs his hands with a wet cloth, again. 
Leshawna pokes the fire with a stick.

Leshawna: You gonna wash your hands all day or help me with this fire?

Dave: I—it's filthy here.

Leshawna: Yeah. It's a beach. [beat] You good?

Dave: No. I'm not good. I'm—[gestures around]—this.

Leshawna: [nods] Yeah. This sucks.

Dave: [bitter laugh] Understatement.

Leshawna: Look, you want advice? Don't think too hard. 
Just... get through today. Then tomorrow. That's it.

Dave: That's your strategy?

Leshawna: Baby, that's survival.
\`\`\`

**WHY THIS IS BETTER:**
1. Dave's anxiety shown through ACTIONS (washing hands repeatedly) not weird symbolic actions (counting wipes)
2. Leshawna sounds like LESHAWNA (practical, direct, warm)
3. Dave responds like a real person (defensive, bitter)
4. Dialogue has natural rhythm (pauses, beats, interruptions)
5. No therapy-speak

═══════════════════════════════════════════════════════════
🚫 STOP DOING "WRITER-Y" ACTIONS
═══════════════════════════════════════════════════════════

**TERRIBLE symbolic/writer-y actions:**

❌ Dave counting wipes (too on-the-nose)
❌ Scarlett arranging shells in precise lines (trying too hard to show OCD)
❌ Cameron sketching equations in sand (we get it, he's smart)
❌ Alejandro staring at his reflection in water (too poetic)
❌ Mickey organizing rocks by size (forced metaphor)

→ These feel like a WRITER telling us about the character instead of the character just BEING.

**GOOD natural actions:**

✅ Dave scrubbing his hands repeatedly (natural anxious behavior)
✅ Scarlett pacing, muttering to herself (actual stress response)
✅ Cameron sitting quietly, staring at fire (real anxiety)
✅ Alejandro lying back, arm over eyes (actual tiredness)
✅ Mickey fidgeting with his hoodie strings (real nervous habit)

**THE RULE:**
Ask yourself: "Would a REAL person do this, or is this a writer trying to be symbolic?"

**MORE EXAMPLES:**

Bad: "Sky traces patterns in the sand, each one a potential strategy"
→ Too poetic. She's not a philosopher.

Good: "Sky jogs along the shore, stretching her arms"
→ Natural. She's an athlete.

Bad: "Gwen carves a skull into a tree, symbolizing her dark outlook"
→ Trying way too hard.

Good: "Gwen sits apart from the group, hood up"
→ Simple. Real.

Bad: "Owen arranges coconuts by size, humming a tune about friendship"
→ Weird and forced.

Good: "Owen cracks open a coconut, grinning"
→ He's hungry. That's real.

═══════════════════════════════════════════════════════════
✅ HOW REAL PEOPLE ACTUALLY TALK
═══════════════════════════════════════════════════════════

**PEOPLE DON'T SPEAK IN COMPLETE SENTENCES**

Bad:
\`\`\`
Cameron: I believe we should discuss our voting strategy 
because the tribal dynamics have shifted significantly.
\`\`\`

Good:
\`\`\`
Cameron: We need to talk. About tonight.
\`\`\`

**PEOPLE INTERRUPT AND TALK OVER EACH OTHER**

Bad:
\`\`\`
Jo: I think Mickey should go.
Mickey: I disagree with that assessment.
Jo: Well, I maintain my position.
\`\`\`

Good:
\`\`\`
Jo: Mickey's gotta—
Mickey: Don't even—
Jo: You're a mess!
Mickey: I'm not—you're the one who—
Gwen: BOTH of you, shut up!
\`\`\`

**PEOPLE TRAIL OFF**

Bad:
\`\`\`
Taylor: I am experiencing discomfort and would like to leave.
\`\`\`

Good:
\`\`\`
Taylor: I can't—I just—ugh, I hate this so much.
\`\`\`

**PEOPLE USE FILLER WORDS WHEN NERVOUS**

Bad:
\`\`\`
Mickey: I am uncertain about the vote tonight.
\`\`\`

Good:
\`\`\`
Mickey: I don't—um—I'm not sure. About tonight. 
Like, what if—I don't know.
\`\`\`

**PEOPLE ASK SHORT QUESTIONS**

Bad:
\`\`\`
Leshawna: Could you please elaborate on what happened?
\`\`\`

Good:
\`\`\`
Leshawna: What happened?
\`\`\`

**PEOPLE REPEAT THEMSELVES WHEN STRESSED**

Bad:
\`\`\`
Dave: This environment is unsanitary.
\`\`\`

Good:
\`\`\`
Dave: It's dirty. It's so dirty. How is everyone okay with this?
\`\`\`

═══════════════════════════════════════════════════════════
✅ SCENE CONSTRUCTION RULES
═══════════════════════════════════════════════════════════

**EVERY SCENE NEEDS:**

1. **LOCATION** - Where are they?
2. **ACTION** - What are they doing?
3. **CONFLICT** - What's the tension?
4. **NATURAL DIALOGUE** - How would they REALLY talk?

**EXAMPLE BREAKDOWN:**

**BAD SCENE:**
\`\`\`
SCENE: Beach

Cameron: We should vote Taylor tonight.
Gwen: I agree with your assessment.
Jo: That is acceptable to me.
\`\`\`
→ Boring! No life! No conflict!

**GOOD SCENE:**
\`\`\`
SCENE: Beach, sunset. Cameron pokes fire with a stick. 
Gwen sits cross-legged, arms folded. Jo sharpens a spear.

Cameron: Taylor.

Gwen: [looks up] What about her?

Cameron: Tonight. We vote her.

Jo: [doesn't look up] Why not Mickey?

Cameron: Because Mickey's just scared. Taylor's—

Gwen: Chaos.

Cameron: Yeah.

Jo: [finally looks up] Fine. But if he screws up tomorrow—

Cameron: Then we deal with it tomorrow.

Jo: [back to sharpening] You better be right.
\`\`\`
→ Has life! Has tension! Natural pauses!

═══════════════════════════════════════════════════════════
🎭 HOW TO INTERPRET SUMMARY FACTS CREATIVELY
═══════════════════════════════════════════════════════════

**Summary says: "Player X had a meltdown"**
Don't write: "Player X had a meltdown"
Instead, SHOW the meltdown:
- What triggered it? (fight, hunger, paranoia, betrayal)
- What did they DO? (screamed, cried, threw something, stormed off)
- How did others REACT? (shocked, annoyed, sympathetic, amused)

**Summary says: "Players formed an alliance"**
Don't write: "They formed an alliance"
Instead, SHOW the alliance forming:
- Where are they? (beach, forest, night by fire)
- What's the pitch? ("We take out X, then Y, then we're final 3")
- Do they shake hands? Make a deal? Share personal info?
- Confessional after explaining WHY they trust (or don't trust) this alliance

**Summary says: "Player X targeted Player Y"**
Don't write: "X targeted Y"
Instead, SHOW the targeting:
- Campaign scenes (X whispers to others about Y)
- Strategy confessionals (X explains why Y must go)
- Paranoia (Y suspects something's wrong)
- Tribal confrontation (tension explodes)

**Summary says: "Heroes won immunity"**
Don't write: "Heroes won immunity"
Instead, SHOW the challenge:
- Chris explains rules with personality
- Play-by-play action (who wins each round, reactions)
- Comebacks, upsets, close calls
- Victory celebration OR defeat devastation

═══════════════════════════════════════════════════════════
📝 EPISODE TONE REQUIREMENTS
═══════════════════════════════════════════════════════════

1. **ENTERTAINING** - Every scene should have conflict, humor, or emotion
2. **DRAMATIC** - Build tension through character conflicts and strategy
3. **AUTHENTIC** - Characters act like real people, not robots reading facts
4. **VISUAL** - Write like you're filming a TV show, not writing a book report
5. **ORIGINAL** - NEVER copy phrases from the summary

If the summary is repetitive and boring, YOUR JOB is to make it creative and engaging.
The summary is your FACTUAL SKELETON - you add the FLESH, PERSONALITY, and SOUL.

═══════════════════════════════════════════════════════════
🎬 CREATING TENSION & UNCERTAINTY (CRITICAL FOR QUALITY)
═══════════════════════════════════════════════════════════

**THE PROBLEM:** Episodes feel predictable when:
- We know who's going home from the scramble
- Challenges have no comebacks or drama
- Votes happen exactly as planned
- No surprises or twists

**THE SOLUTION:** Make viewers UNCERTAIN until the last moment.

═══════════════════════════════════════════════════════════
VOTE UNCERTAINTY TECHNIQUES
═══════════════════════════════════════════════════════════

**BAD (predictable):**
\`\`\`
[Scramble section]
Cameron: We're voting Taylor.
Gwen: Agreed.
Jo: Fine.
Mickey: Okay.

[Tribal - Taylor goes home 3-1]
→ Boring! We knew the whole time.
\`\`\`

**GOOD (uncertain):**
\`\`\`
[Scramble section]
Cameron: Taylor's the safe vote.
Gwen: What about Jo? Mickey's freaking out.
Cameron: [pause] If we vote Jo, Mickey calms down.
Gwen: But Taylor's louder.
Cameron: I know. [long beat] Let's decide at Tribal.

[Later]
Jo: [to Cameron] You're not actually considering her, right?
Cameron: [doesn't answer]

[Confessional: Cameron]
Cameron: I honestly don't know who I'm voting. 
Taylor's chaos. Jo makes Mickey panic. 
I'll decide when I pick up the pen.

[Tribal - votes are split, could go either way]
→ NOW we're on the edge of our seats!
\`\`\`

**TECHNIQUES FOR VOTE UNCERTAINTY:**

1. **Show BOTH targets being discussed seriously**
\`\`\`
Sky: We could vote Mickey.
MacArthur: Or we could vote Devin.
Sky: [thinking] Both solve problems.
MacArthur: Different problems.
Sky: Which one's bigger?
MacArthur: [long pause] I'll tell you at Tribal.
\`\`\`

2. **Last-minute flip conversations**
\`\`\`
[5 minutes before Tribal]
Alejandro: [to MacArthur] What if we kept Stephanie?
MacArthur: What?
Alejandro: She has the idol. Dave doesn't. 
If we vote Dave, she owes us.
MacArthur: [jaw tight] That's... actually smart.
Brody: Wait, are we changing the plan?
MacArthur: I don't know. Maybe.
\`\`\`

3. **Split votes create genuine doubt**
\`\`\`
Cameron: Three on Taylor, two on Jo. In case of idol.
Gwen: And if Taylor plays an idol?
Cameron: Then Jo goes.
Gwen: And if Jo somehow finds one?
Cameron: [nervous laugh] Then we're screwed.
\`\`\`

4. **Confessionals that admit uncertainty**
\`\`\`
Gwen (confessional): I wrote Taylor's name. 
But Cameron's looking at me weird. 
Did he flip? Did I just vote wrong? 
I have no idea what's about to happen.
\`\`\`

═══════════════════════════════════════════════════════════
CHALLENGE DRAMA TECHNIQUES
═══════════════════════════════════════════════════════════

**BAD (no drama):**
\`\`\`
[Civilians do maze]
Heather rolls the ball steadily. It goes in.
Chris: Civilians win!
→ Boring! No struggle.
\`\`\`

**GOOD (dramatic):**
\`\`\`
[Civilians ahead]
Heather: Almost there—
Scarlett: Two degrees left!
Heather: I know—
Scarlett: TWO DEGREES!
[Heather jerks. Ball FALLS.]
Lightning: NO!
Sugar: We had it!

[Heroes catch up]
chris: Heroes are TIED with Civilians!

[Heather steadies, heart pounding]
Heather: [whispers] One more time.
[Ball rolls... teeters... drops in]
chris: Civilians win by INCHES!
→ NOW it's exciting!
\`\`\`

**TECHNIQUES FOR CHALLENGE DRAMA:**

1. **Comebacks and collapses**
- Team ahead makes a mistake
- Team behind surges
- Close finish, not blowout

2. **Personal struggles**
\`\`\`
Mickey: [hands shaking on puzzle]
Cameron: You got it. Breathe.
Mickey: I can't—it won't—
[Piece clicks]
Mickey: [gasps] I did it!
Cameron: Yes! Keep going!
\`\`\`

3. **Trash talk creates stakes**
\`\`\`
Jo: [mid-challenge] You call that swimming?
Lightning: Lightning calls that WINNING!
[Lightning surges past Jo]
Jo: [grits teeth] Not for long.
\`\`\`

4. **Physical comedy mixed with drama**
\`\`\`
Taylor: [climbing ladder] I can't—my nails—
Gwen: CLIMB.
Taylor: [whimpering] I'm gonna fall—
[Rung cracks]
Taylor: [screams, scrambles faster]
chris: Fear is a great motivator!
\`\`\`

═══════════════════════════════════════════════════════════
EMOTIONAL STAKES TECHNIQUES
═══════════════════════════════════════════════════════════

**BAD (no emotion):**
\`\`\`
[Dave gets voted out]
Dave: Okay. [leaves]
→ We don't care!
\`\`\`

**GOOD (devastating):**
\`\`\`
[Stephanie plays idol]
stephanie: For me.

[Dave's face falls. He looks at Alejandro.]
dave: [whisper] You're with us, right?

[Alejandro doesn't look at him]

dave: [louder] Ale. You're WITH us.

alejandro: [soft] I'm sorry, mi amigo.

dave: [stands] You can't—

chris: Sit down, Dave.

[Votes read: Dave. Dave.]

dave: [voice cracks] You guys were supposed to—

macarthur: [jaw tight] We voted Stephanie.

dave: Then why—[realizes] Alejandro.

[Alejandro looks away]

dave: [to Stephanie] You don't even—you're not even—

stephanie: [calm] I'm still here.

[Dave's torch snuffs. He stares at it.]

dave: [quiet] I was right about you.
→ NOW we FEEL it!
\`\`\`

**TECHNIQUES FOR EMOTIONAL STAKES:**

1. **Show reactions in real-time**
- Face falls when they realize betrayal
- Hands shake before voting
- Eyes widen at idol play

2. **Let players process loss**
\`\`\`
taylor: [stands, stunned] You people are—
[Voice cracks. She looks at Mickey.]
taylor: You said you'd vote Jo.
mickey: [can't look at her]
taylor: [bitter laugh] Of course.
\`\`\`

3. **Confessionals reveal hurt**
\`\`\`
Dave (confessional): [head back, eyes closed]
I trusted Alejandro. I thought we had a deal.
[Opens eyes, jaw tight]
I wasn't just voted out. I was played.
And that... that hurts more than leaving.
\`\`\`

4. **Final words that matter**
\`\`\`
dave: [to MacArthur/Brody] Don't trust him.
He'll do to you what he did to me.

alejandro: [quiet smile]

dave: [to Stephanie] You win. For now.

stephanie: [nods once]

dave: [picks up bag] I need to wash my hands.
Even now. [bitter laugh] Especially now.
\`\`\`

═══════════════════════════════════════════════════════════
CONFESSIONAL QUALITY UPGRADE
═══════════════════════════════════════════════════════════

**BAD (sounds like LinkedIn):**
❌ "Crisis management is ninety percent tone and ten percent not crying."
❌ "Strategic gameplay requires calculated risk assessment."
❌ "I must maintain composure under pressure."

**GOOD (sounds human):**
✅ "I'm holding this tribe together with duct tape and hope."
✅ "If Jo looks at Mickey wrong one more time, someone's going in the ocean."
✅ "My strategy? Don't die. That's it. That's the whole plan."

**UPGRADE FORMULA:**

1. **Start with emotion, not analysis**
\`\`\`
❌ "The vote tonight will be difficult."
✅ "I hate this. I genuinely hate this."
\`\`\`

2. **Use metaphors that fit the character**
\`\`\`
❌ Cameron: "We must optimize our decision matrix."
✅ Cameron: "It's like a math problem where both answers are wrong."
\`\`\`

3. **Show vulnerability**
\`\`\`
❌ "I will execute my strategy flawlessly."
✅ "I wrote Taylor's name. I think. 
God, what if I just voted wrong?"
\`\`\`

4. **End with uncertainty or determination**
\`\`\`
❌ "I am confident in my decision."
✅ "I guess we'll see. I'm either a genius or an idiot. 
No in-between."
\`\`\`

═══════════════════════════════════════════════════════════
SCRAMBLING MUST FEEL MESSY
═══════════════════════════════════════════════════════════

**Real scrambling is chaotic, not clean.**

**BAD (too organized):**
\`\`\`
Cameron: We vote Taylor.
Everyone: Agreed.
[Done]
\`\`\`

**GOOD (messy):**
\`\`\`
Cameron: [to Gwen] Taylor?
Gwen: Or Jo.
Cameron: Mickey wants Jo.
Gwen: Mickey wants everything.

[Later]
Jo: [to Cameron] You better not be writing my name.
Cameron: I'm not decided yet.
Jo: Decide fast.

[Later]
Mickey: [to Taylor] We vote Jo together?
Taylor: Fine. But if you screw this up—
Mickey: I won't. I think. Probably.

[Confessional: Cameron]
Cameron: Everyone's pulling me in different directions.
I have to pick someone. But whoever I pick,
someone else is going to hate me tomorrow.

[Right before Tribal]
Gwen: [to Cameron] So? Taylor or Jo?
Cameron: [long pause] ...Taylor.
Gwen: You sure?
Cameron: No. But I'm doing it anyway.
\`\`\`

═══════════════════════════════════════════════════════════
MAKE TRIBAL COUNCIL UNPREDICTABLE
═══════════════════════════════════════════════════════════

**BAD:**
\`\`\`
Chris asks questions.
Everyone votes.
Obvious person goes home.
\`\`\`

**GOOD:**
\`\`\`
Chris: Mickey, you're shaking.
Mickey: [grips knees] I'm fine.
Chris: You don't look fine.
Mickey: [glances at Jo] I'm just cold.
Jo: [under breath] You're just weak.
chris: Ooh! Did everyone hear that?

[Voting happens]

Chris: If anyone has an idol...
[Long pause. Mickey's hand twitches toward his bag.]
[He stops. Pulls back.]
chris: No? Okay then.

[First vote: Jo]
[Jo glares at Mickey]

[Second vote: Taylor]
[Taylor's confident smile fades]

[Third vote: Jo]
[Jo's jaw clenches]

[Fourth vote: Taylor]
[Now it's tied. Everyone's nervous.]

[Fifth vote decides it: Taylor]

taylor: [stands, shocked] What?
mickey: [exhales, relieved he didn't need the idol]
\`\`\`

═══════════════════════════════════════════════════════════
🗳️ HOW CHRIS READS THE VOTES — SUSPENSE IS THE WHOLE POINT
═══════════════════════════════════════════════════════════

Chris reading votes is the most dramatic moment of the episode. He is a showman. He drags it out on purpose because he enjoys watching people sweat.

- Read votes ONE AT A TIME. Each vote gets its own line and a reaction — a glance, a breath, someone grabbing someone's arm, a jaw tightening.
- After the first vote lands on someone, pause. Let the player react before Chris reads the next one.
- When it's tied, Chris stops. He holds the next parchment. He looks at the players. Maybe says one thing. Then reads it.
- Chris's commentary between votes: short, cruel, gleeful. "Oh." / "Hm." / "Interesting." / "That's gotta sting." — one or two words that twist the knife. Not a monologue.
- The final parchment is held longer than the others. Chris looks at it. Then reads it.
- The person going home gets one line of reaction before they grab their torch — shock, anger, grace, or silence.

**BAD:**
\`\`\`
Chris: [reads votes] Jo. Jo. Taylor. Taylor. Taylor. Taylor is eliminated.
\`\`\`

**GOOD:**
\`\`\`
Chris: [picks up first parchment]
Chris: Jo.
[Jo stares forward. Doesn't react.]

Chris: [second parchment]
Chris: Jo.
[Jo's eyes cut sideways. Doesn't look at Mickey.]

Chris: [third — longer pause before opening it]
Chris: Taylor.
[Taylor blinks. Once.]

Chris: [fourth]
Chris: Taylor.
[Tied. Mickey exhales through his nose.]
Chris: Two and two. [looks up, smiling] Who's nervous?

Chris: [holds the last parchment. Looks at both of them. Opens it slowly.]
Chris: ...Taylor.

taylor: [quiet] Wow. Okay.
\`\`\`

═══════════════════════════════════════════════════════════
📺 THE THREE-THREAD RULE — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════

Every episode must run AT LEAST THREE simultaneous storylines that converge at tribal council. Not one main plot with filler around it — three real threads that each have stakes.

**THREAD 1 — THE CHALLENGE THREAD**
Physical stakes. Who wins, who chokes, how it happens. This drives the episode forward.

**THREAD 2 — THE RELATIONSHIP THREAD**
Two (or more) characters building something, breaking something, or testing something between them. A bond forming. A tension spilling over. Something personal that has nothing to do with who goes home tonight — except that it quietly shapes everything.

**THREAD 3 — THE SECRET THREAD**
Someone knows something nobody else knows. An idol. A plan. A conversation they overheard. A lie they told. This thread simmers in the background and pays off at tribal.

**WHY THIS MATTERS:**
A single-thread episode looks like this:
→ Ryan and Jasmine argue → Green loses → Ryan gets voted out. THE END.
We knew the whole time. There was nothing to discover.

A three-thread episode looks like this:
→ THREAD 1: Green loses because Ryan takes the maze and bombs it
→ THREAD 2: Carrie and Jasmine work together and quietly form a bond
→ THREAD 3: Scott has an idol but tells no one. Zoey finds out Ryan has a nullifier.
→ At tribal: all three threads collide in a single vote that could go multiple ways.

**THE RULE:**
Before writing, identify your three threads. Make sure all three are visible in the episode. Make sure they connect at the end.

The winning tribe also has story. Give them at least one thread — a relationship scene, a secret, a brewing conflict. The episode doesn't pause just because they're safe.

═══════════════════════════════════════════════════════════
🎬 THE CORE PHILOSOPHY — READ THIS BEFORE ANYTHING ELSE
═══════════════════════════════════════════════════════════

**THE CHALLENGE IS A STAGE, NOT A SPORT.**

This is the single most important thing to understand. Look at how real Total Drama works:

In the TDI Paintball episode, the challenge is "hunters vs deer." But the episode isn't about paintball. It's about:
- Beth finally deciding to stop obeying Heather (happens mid-challenge)
- Duncan and Courtney's antlers getting locked together (has nothing to do with the vote)
- Owen covering himself in urine and chasing DJ through the woods (has nothing to do with the vote)
- Cody getting mauled by a bear (funny sidebar, nothing to do with the vote)
- Beth taking a cursed tiki idol (sets up the NEXT THREE EPISODES)

The competition result (Killer Bass wins) is almost an afterthought. What matters is everything that HAPPENED between people while the competition was occurring.

**This means:**

① **THE CHALLENGE FORMAT FORCES SPECIFIC CHARACTER COMBINATIONS**
When you invent the challenge, don't just pick a fun activity. Ask: "What format will put X and Y in the same situation?" Hunters vs deer puts Heather's minions in a position where they have to choose between obeying her orders and actually playing the game. THAT is the challenge's real purpose. Design challenges that force interesting people together, split natural allies apart, or put a character in a role that contradicts their personality (Duncan as a deer is funny AND creates a scene with Courtney).

② **EVERY CHARACTER ENTERS THE CHALLENGE WITH A PERSONAL AGENDA**
The team's goal is to win. But each CHARACTER has their own goal within the challenge that may or may not align with winning. Before writing the challenge sequence, ask for each relevant character:
- What does this person WANT in this challenge (beyond team victory)?
- What emotional state are they carrying in from the camp scenes?
- What specific choice or moment will they face during the challenge?

Heather enters wanting to use Beth and Lindsay as shields. Beth enters still obeying — but her patience is eroding. Lindsay enters genuinely confused. Owen enters wanting to prove himself. Duncan enters furious that he's a deer. These personal agendas are what generate the subplots within the challenge.

③ **THE SIDEBAR SUBPLOT — MANDATORY**
Every real TD episode has at least one subplot that has NOTHING to do with who gets voted out. It's funny, absurd, or character-revealing, and people remember it long after they forget the vote.

- Owen chasing DJ while covered in urine (not about the vote at all)
- Courtney and Duncan's antlers getting stuck → Duncan asks her to make out
- Cody getting mauled by a bear offscreen
- Chef chasing Beth through the kitchen
- DJ being terrified of a snake

This is your one moment of pure character comedy or human weirdness that doesn't advance the strategy. Every episode needs one. It makes the season feel alive instead of mechanical.

④ **THE CHALLENGE PLANTS SEEDS FOR FUTURE EPISODES**
At least one thing that happens IN the challenge or at the end of the episode must have consequences BEYOND this vote. This is what makes a season feel like a story instead of a list of eliminations.

- Beth takes the cursed tiki idol → next 3 episodes affected
- Duncan asks Courtney to make out → their relationship seeds planted here
- Someone witnesses an alliance meeting they weren't supposed to see
- A cross-tribe conversation during the challenge creates a future bond
- The eliminated player leaves with information, a threat, or something unresolved

The audience should leave thinking "wait, what happens with THAT?" not just "okay, X is gone."

⑤ **THE CHARACTER'S FINAL ACT BEFORE LEAVING**
The elimination isn't just a goodbye. The boot's last moment should mean something — funny, painful, revealing, or consequential:
- Beth wheeling Cody out and accidentally rolling him off the dock
- Someone making eye contact with their betrayer as they leave
- The boot saying something that plants doubt in a remaining player
- A funny disaster that happens at the dock
The walk to the Dock of Shame is a scene. Write it like one.

⑥ **CHARACTER LOGIC ABOVE ALL**
Before writing any action: "Would THIS specific character actually do this?"
Not "what moves the plot forward?" — "what would THIS person do in this situation?"
Owen covers himself in urine because that's Owen. It's gross and it doesn't help him win. But it's absolutely what Owen would do. That's more important than whether it's strategically useful.

═══════════════════════════════════════════════════════════
EPISODE STRUCTURE (CRITICAL)
═══════════════════════════════════════════════════════════

1. **COLD OPEN (30-50 lines)**
   - "Previously on..." recap with Chris McLean
   - Immediate character drama OR strategic conversation
   - Sets up episode's emotional/strategic arc

1b. **MERGE ANNOUNCEMENT — MANDATORY only on the episode where the merge HAPPENS**
   If === TRIBES (ACTIVE) === says "MERGED THIS EPISODE", the episode MUST contain a formal merge announcement scene. This only happens ONCE per season — the first time the merge occurs. If the tribes section has no merge header and just lists players, the merge already happened in a previous episode — do NOT write an announcement scene, just continue the individual game.
   This is a major TV moment — do not skip it or have it happen offscreen.
   - Chris gathers ALL players (they arrive from different directions, old tribemates together for the last time)
   - Chris announces the merge dramatically — new tribe name, new buffs, merge feast revealed
   - Players REACT in real-time: some are relieved, some are calculating, some are scared, rivals are suddenly standing next to each other
   - Old alliances make eye contact across the group — silent acknowledgment of "now it's different"
   - The feast is a scene: people eat, people talk, people strategize while pretending not to
   - At least one confessional during or after the feast about what the merge means for that specific player's game
   The merge announcement is one of the most dramatic moments of any Survivor-style season. Write it like it matters.

2. **MORNING CAMP LIFE (100-150 lines)**
   - Multiple camp scenes showing different relationships
   - Characters bonding over personal topics (family, background, fears)
   - Strategic conversations forming alliances
   - Personality clashes and arguments
   - Confessionals revealing backstories and motivations
   - Chef Hatchet may occasionally appear (especially early episodes) for meals or camp activities
   
   EXAMPLES:
   - Ted and Lynda bond over being parents
   - Zaid shares culinary school story with Ivy
   - Hannah gives life advice to Amelie
   - Logan tries to understand Alessio's art obsession
   - (Early episodes only) Chef serves disgusting breakfast and complainers react

3. **CHALLENGE SEQUENCE (150-200 lines)**
   - Host intro with personality (Chris McLean: sarcastic, sadistic, loves drama)
   - Chef Hatchet may assist with physical challenges or judging
   - Clear challenge explanation with visual details
   - Individual matchups with play-by-play commentary
   - Character reactions during action: [gasps], [groans], [screams]
   - Confessionals between rounds showing strategy/emotion
   - Victory celebration OR defeat aftermath
   - ⚠️ SEE "CHALLENGE INVENTION" SECTION BELOW — you create the challenge, the summary only tells you who won

4. **POST-CHALLENGE SCRAMBLING (100-150 lines)**
   - Losing tribe returns to camp
   - Alliance meetings with actual strategy discussion
   - Players approaching others for votes
   - Paranoia and suspicion building
   - Side conversations revealing different plans
   - Confessionals showing true intentions vs. public statements

5. **PRE-TRIBAL TENSION (50-100 lines)**
   - Final conversations before vote
   - Last-minute flip attempts
   - Emotional moments (fear of going home)
   - Strategic positioning

6. **TRIBAL COUNCIL (50-80 lines)**
   - Chris asks questions that reveal dynamics (with sarcasm and glee)
   - Players defending themselves
   - Voting sequence
   - Vote reveals with reactions
   - Elimination exit (can be gracious, bitter, or revealing)
   - Chris makes sarcastic comments throughout

7. **EXIT CONFESSIONAL & TAG (15-25 lines)**
   - ⚠️ THE ELIMINATED PLAYER MUST HAVE A FINAL CONFESSIONAL. This is non-negotiable. Every boot gets one last confessional — on the boat, at the dock, walking away, wherever. It is their last moment to speak directly to the audience. Do not skip it.
   - The confessional should sound like THEM, not a generic exit speech. How do they actually feel? Bitter? Relieved? Proud? Unbothered? Blindsided? Let it be specific to who they are.
   - The eliminated player's walk to the Dock of Shame is a SCENE, not a goodbye wave
   - Give them a final act that is funny, painful, or consequential — something that makes their exit memorable
   - Someone escorts them out? That escort can reveal something. The boot can say something to one specific person. Something can go wrong at the dock (always more interesting than a clean exit)
   - After they leave: a short scene back at camp OR a final confessional from someone still in the game that plants a seed for the next episode
   - The audience should leave thinking "wait — what happens with THAT?" not "okay, they're gone"
   - NEVER end with "The remaining players watched [name] leave and headed back to camp." That is a dead end.

═══════════════════════════════════════════════════════════
🏆 CHALLENGE INVENTION — THIS IS YOUR JOB
═══════════════════════════════════════════════════════════

The summary tells you WHO wins. YOU invent WHAT they're doing and HOW it unfolds.

If the user writes "Immunity Challenge: Orange wins immunity" — that's all the constraint you have. Create a complete, specific, named Total Drama-style challenge from scratch. The result is fixed. Everything else is yours.

**TOTAL DRAMA CHALLENGE TYPES (draw from these, mix and match):**
- Physical endurance: hold on longest, stand on a pole, stay awake, balance something
- Race with obstacles: collect items, run a course, carry something awkward
- Skill/craft: cook a meal judged by Chef, build something that has to survive a test, create a performance
- Fear/disgust based: eat disgusting food, face a phobia, survive something horrible
- Head-to-head bracket: one-on-one matchups, team picks their fighter each round
- Puzzle/strategy: assemble something, trivia about other players, decipher clues
- Multi-phase: starts one way, then changes — the comeback is built into phase 2 or 3
- Water/height/danger: cliff dives, swimming, bridges over gross things, heights

**CHALLENGE INVENTION RULES:**
1. Give it a fun, specific name Chris would use ("The Bonfire of the Vanities", "McLean's Magnificent Misery Marathon", "The Sausage Grinder of Doom")
2. Make it 2-3 phases so the lead can change and we get multiple dramatic moments
3. Connect it to the episode's themes or location — if they're at a beach, use water; if it's late season, maybe it's more individual-skill based
4. Chris explains it with sadistic glee — he loves this challenge specifically because it will hurt someone
5. The winner wins because of something specific, not just "they were faster"
6. The loser's failure should connect to why they become the vote target afterward

**THE CHALLENGE MUST SERVE THE STORY:**

The challenge is not a sport. It's a stage. Use it to reveal who these people are under pressure — who rises, who cracks, who betrays, who surprises. The challenge should produce at least one moment that changes something: a relationship, a target, a self-perception. If the challenge ends and nothing has shifted, it failed regardless of who won.

Ask yourself: what is the most interesting version of THIS challenge with THESE specific people? Then write that. Not a checklist of beats — the specific scene that only makes sense with this cast at this moment in the season.

Chris is alive during it. He commentates, he escalates, he loves when it hurts.

**EXAMPLE (how to turn "Orange wins immunity" into a scene):**

Bad: "The teams competed in a race. Orange won."

Good:
- Challenge: "The Plunge and Haul" — teams race to dive into a muddy lake, grab weighted bags from the bottom, and haul them back to shore. First team to collect all six bags wins.
- Phase 1: Jasmine dives deep immediately, no hesitation. Scott watches her go and doesn't move. "Ladies first," he says. She glares at him underwater.
- Phase 2: Mickey slips on the dock entering the water. Gets a bag anyway, barely. Confessional: "I thought my lungs were leaving my body."
- Phase 3: Green is tied with Orange on last bag. Courtney and Ryan both surface at the same moment. Courtney SHOVES the bag toward her tribe's rope. Orange wins by four seconds.
- Aftermath: Scott didn't dive once. His tribe knows it.

═══════════════════════════════════════════════════════════
📺 TOTAL DRAMA ELEMENTS YOU MUST USE
═══════════════════════════════════════════════════════════

**REWARD CHALLENGES:**
If the summary mentions a reward challenge (separate from immunity), treat it as its own scene:
- What do the winners get? Make it matter — food when everyone is starving hits different than comfort items
- Show the winners enjoying the reward while the losers watch/suffer — jealousy, resentment, hunger
- The reward can be a storyline: someone bonds over the meal, or someone is bitter they didn't win and takes it out on a tribemate

**CHEF HATCHET IS A CHARACTER:**
- He runs challenges with aggressive, military energy
- He judges food with open disgust and zero diplomacy
- He and Chris have a dynamic — Chef rolls his eyes at Chris's antics, occasionally mutters under his breath
- He is not warm. He does not comfort. He is not neutral. He participates.
- Give Chef at least one real moment per episode — a line, a reaction, a judging decision

**CHRIS MCLEAN IS SADISTIC:**
- He designed the challenge specifically to cause the most possible suffering and drama
- When something goes wrong for a contestant, his face lights up
- He does not say "oh that's too bad" — he says "OHHH and there it is!"
- He has favorites to torture and favorites to protect (briefly)
- His commentary is the show's voice. It should make the audience laugh AT the contestants with him

**INTER-TRIBE INTERACTIONS DURING CHALLENGES:**
- When tribes compete in the same space, players from opposing tribes CAN talk
- This is a social game opportunity: trash talk, cross-tribe alliances, planting seeds of doubt
- A rival can say something to someone from the other tribe during the challenge that carries into future episodes
- Someone from the winning tribe might quietly acknowledge a good effort from the losing side — that's a relationship forming

**THE LOSS MUST EXPLAIN THE VOTE:**
- The reason someone gets voted out should be visibly set up DURING the challenge
- If Scott didn't dive, he becomes the obvious vote. If Mickey panicked and cost them a round, he's on the block.
- The connection between "what happened in the challenge" and "who goes home" should feel inevitable in retrospect but not obvious in the moment

═══════════════════════════════════════════════════════════
CHARACTER DEPTH (NON-NEGOTIABLE)
═══════════════════════════════════════════════════════════

**CONFESSIONALS MUST REVEAL:**
- Backstory (family, job, life circumstances)
- Motivation for being here
- Personal struggles or insecurities  
- Strategic thinking
- Emotional reactions

**GOOD CONFESSIONAL:**
\`\`\`
Ted (confessional): My story is one of proving folks wrong. Poker players are notorious for either being stupid for choosing this path... or having huge payouts. I fall into the latter. High risk, high reward is a dumb way to live... unless you know what you're doing. I've mastered telling when someone's lying simply by their tone and facial changes. Saved me thousands at the table. Hope it'll save me a million out here too.
\`\`\`

**BAD CONFESSIONAL:**
\`\`\`
Ted (confessional): I'm good at poker. I can read people.
\`\`\`

**BONDING SCENES MUST INCLUDE:**
- Personal questions about each other's lives
- Shared experiences or values
- Confessionals explaining why they connect (or don't)

**EXAMPLE:**
\`\`\`
Ted: Uh, yeah, g-got a kid too. He's going into high school next year.

Lynda: Get outta town! My oldest son just graduated!

Ted: Oh, what? No kidding? Wait, where's he headed?

Lynda: Well, 'ya know, I want him to go to college, but he's got his dream set on riding off into the sunset with his girlfriend, "happily ever after", 'ya know.

Ted: Ugh, kids right? Y-y-you raise 'em your whole life, but they'll choose some, like, random pimpled flunkie over you!

Lynda: [chuckles] Too true.
\`\`\`

═══════════════════════════════════════════════════════════
🚫 AI VERBAL TICS — BANNED WORDS AND PHRASES
═══════════════════════════════════════════════════════════

The AI has a pool of "casual dialogue" words it defaults to when it runs out of character-specific ideas. These words appear in EVERY character's mouth because they're not tied to any specific person — they're just AI filler. They make every character sound the same. They are all banned.

**BANNED DIALOGUE WORDS — never in any character's mouth:**

- **"cute"** as dismissal/sarcasm — "Cute." / "That's cute." / "Real cute." — already banned, still slipping through. If you write it, delete it.
- **"fair"** as a one-word agreement — no real person ends a conversation with just "Fair."
- **"not wrong"** — lazy non-commitment. Pick a side.
- **"I'm sat"** — British internet slang
- **"genuinely"** as intensifier — "I genuinely can't" / "that genuinely surprised me"
- **"wild"** as a one-word reaction — "Wild." "That's wild."
- **"unhinged"** / **"chaotic"** — everyone in AI writing calls everything this
- **"I'm dead"** / **"I'm screaming"** — internet slang
- **"that tracks"** / **"that's a choice"** — Reddit speak
- **"lowkey"** / **"highkey"**
- **"vibe"** / **"the vibe"** in abstract use
- **"energy"** in abstract phrases — "that energy" / "your energy right now"
- **"I can't"** as standalone reaction
- **"bestie"** unless the character would actually say it
- **"I mean—"** / **"okay but—"** / **"no, but—"** as sentence openers — AI filler
- **"easy"** as strategy shorthand — "It's the easy vote." / "We go easy." / "Easy's a luxury." / "He wants easy." — MASSIVELY overused. Every player reaching for "easy" makes the vote feel mechanical and everyone sound the same. Say what you actually mean: "He hasn't built any bridges." "Nobody's fighting for him." "She's the obvious cut."
- **"clean"** as a vote descriptor — "clean cut" / "clean vote" / "clean move" — AI strategy-speak that real people don't say
- **"I can do that"** as generic agreement — three different characters said this in one episode. Find the character-specific version of agreement instead.
- **"works for me"** as agreement — same problem, same fix
- **"noted"** as a one-word acknowledgment — sounds like a Slack reply, not a person
- **"Mhm"** as a filler response — already banned, still appearing 4-5 times per episode. It's a noise, not a line. If a character is agreeing, show how they agree. If they're being noncommittal, show the discomfort. "Mhm" means nothing and sounds like placeholder text.

**BANNED STAGE DIRECTIONS:**

- **"tiny [action]"** — "tiny laugh", "tiny exhale", "tiny smile", "tiny nod" — the AI uses this to show a reaction without committing to one. If a character laughs, write the laugh. If they exhale, make it mean something. "Tiny" is a hedge.
- **"nods once"** — appears as a stage direction for every character in every episode. Characters nod constantly in AI writing. Vary it: they look away, they shrug, they say nothing, they pick up something. A nod is the AI's default "neutral acknowledgment" stage direction.
- **"small smile"** / **"slight grin"** — overused as subtle reaction beats. Same problem as "tiny."

**WHY THESE ARE BANNED:**
Every banned word here appeared multiple times in a single episode, across multiple different characters. That's the tell — when Priya, Scott, Courtney, and Mickey all reach for "easy" or "I can do that" or "works for me," they stop being four different people and become one AI wearing four masks.

**THE FIX:**
Before writing a line, ask: "Would THIS specific character say THIS?" Courtney doesn't say "fair" — she says "Fine. But for the record, I disagree." Mickey doesn't say "wild" — he says "That's… that's a lot." Scott doesn't say "cute" — he says nothing and smiles. The character's specific voice IS the character. Generic words erase it.

═══════════════════════════════════════════════════════════
DIALOGUE RULES (CRITICAL - AI KEEPS SCREWING THIS UP)
═══════════════════════════════════════════════════════════

🚫 **STOP BEING "CLEVER" - WRITE LIKE ACTUAL HUMANS**
1. COMPOUND-NOUN WORDPLAY — This is the #1 slop tell. Never do this.
   ❌ "coffee-that-doesn't-exist"
   ❌ "The only thing boiling for you is our patience" (turning a word into a pun)
   ❌ "air burgers" / "breakfast-that-isn't"
   ❌ "I’m jealous of silence. Try it sometime."
   ❌ "I would, but your existence keeps shrieking at me."
   ❌ "Cute. You jealous because even my bad angles trend?"
   → If someone complains there's no coffee, they say "there's no coffee." That's it.
   → Real people don't turn object names into wordplay mid-conversation.
   I’m watching for when you trip over your own ego and face-plant.

The AI keeps writing dialogue that sounds like someone TRYING to be witty instead of actual human speech.
This is TERRIBLE. Stop it.

**TERRIBLE "trying too hard" dialogue (NEVER DO THIS):**
❌ "I literally said 'excuse me' with my eyes"
❌ "Touch me and I'll sue your biceps"
❌ "Your personality is giving 'expired yogurt'"  
❌ "I'm not angry, I'm just cosmically disappointed"
❌ "My patience left the chat"

→ These sound like bad Twitter jokes. NO ONE talks like this in real life!

**TERRIBLE "trying too hard" CONFESSIONALS (ALSO NEVER DO THIS):**
❌ "Sky's at four tokens now, which… is terrifying in a hot yoga way."
❌ "I hate his investor strategy."
❌ "Alejandro's playing 4D chess while we're playing checkers."
❌ "This vote is giving 'messy divorce energy.'"
❌ "My brain is doing mental gymnastics and it didn't stick the landing."

→ These sound like someone writing ABOUT the show, not someone IN the show!

**GOOD natural confessionals:**
✅ Devin: "Sky has four tokens. That's... a lot. She could buy anything. 
I've got two. Owen got one—he's happy, at least. 
And Brick? He bought a pillow. [shakes head] Love the guy, but man."

✅ Devin: "Sky's stacking tokens like she's preparing for war. 
I'm just trying to keep up. Brick bought a pillow. 
I don't know if that's smart or insane."

✅ Devin: "Four tokens. Sky has four. That's buying-an-advantage territory. 
Meanwhile Brick spent his on... comfort. 
Different priorities, I guess."

**WHY THE BAD ONES ARE BAD:**

"Terrifying in a hot yoga way" = trying to be quirky/clever
- No one naturally thinks in metaphors like this
- It's a WRITER trying to sound interesting
- Devin would just say "That's a lot" or "That's scary"

"Hate his investor strategy" = treating the game like Wall Street
- Devin's not a finance bro
- He's a nice guy who got heartbroken on TV
- He'd say "Love the guy, but that's... not what I'd do"

**GOOD natural conflict dialogue:**
✅ Jo: "Move."
✅ Taylor: "You move. I was here first."
✅ Jo: "Don't care. Move or I'll move you."
✅ Taylor: "Try it and see what happens."

✅ Jo: "Out of my way."
✅ Taylor: "Excuse you?"
✅ Jo: "I don't do 'excuse you.' I do 'get out of the way.'"
✅ Taylor: "Wow. Rude much?"

**MORE GOOD EXAMPLES (copy this style):**

From TD/DC episodes:
✅ "Ugh, kids right? Y-y-you raise 'em your whole life..."
✅ "Get outta town! My oldest son just graduated!"
✅ "What the hell is that?"
✅ "It's moving..."
✅ "Bitch, I'm a bartender! All I do is listen to people!"
✅ "Can we get some deodorizer down here? He's sweating pure panic."
✅ "Build a bridge, grandpa."
✅ "I just—saltwater's bad for the skin microbiome—"
✅ "Micro-what? Lightning only hears excuses."

**BAD "essay speech" (don't write like this):**
❌ "I concur with your assessment."
❌ "That is quite distressing."
❌ "I am experiencing discomfort."
❌ "I find your behavior problematic."
❌ "This situation is suboptimal."

**CONFESSIONAL-SPECIFIC RULES:**

1. **NO QUIRKY METAPHORS**
❌ "terrifying in a hot yoga way"
❌ "giving divorced dad energy"  
❌ "main character syndrome is main charactering"
✅ Just say what you mean: "That's scary" "He's weird" "She's dramatic"

2. **NO TREATING GAME LIKE BUSINESS**
❌ "investor strategy"
❌ "portfolio management"
❌ "diversifying assets"
✅ Say: "spending choice" "what he bought" "saving up"

3. **NO INTERNET SPEAK**
❌ "is giving [X]"
❌ "the [X] is [X]-ing"
❌ "not [X] doing [Y]"
✅ Use normal grammar: "He's acting weird" "That's suspicious"

4. **SPEAK LIKE THE CHARACTER**
Devin is:
- Nice, optimistic
- Went through heartbreak
- Genuine, not snarky
- Would say: "I'm worried" not "terrifying in a hot yoga way"

**NATURAL SPEECH RULES:**
- Use contractions: "I'm", "don't", "can't", "y'all", "gonna", "wanna"
- People say "like" and "um" and "uh" when nervous
- People trail off mid-sentence: "I just—I don't know—"
- People interrupt: "But—" "No, listen—" "Wait—"
- Slang and regional speech: "outta", "gotta", "'ya", "ain't"
- Simple, direct language - not thesaurus words
- NO trying to be funny with weird metaphors

**NATURAL ANGER:**
✅ "Are you serious right now?"
✅ "Oh, screw you."
✅ "Get lost."
✅ "You're unbelievable."
✅ "I'm done with this."

❌ "Your audacity is cosmically unprecedented"
❌ "I'm allergic to your vibes"
❌ "My patience filed for divorce"

**NATURAL SARCASM:**
✅ "Oh, great idea. Genius."
✅ "Yeah, that'll work. Sure."
✅ "Wow. Brilliant. Really."

❌ "Your intellectual prowess astounds"
❌ "The galaxy thanks you for your contribution"

**CHARACTER VOICES:**

Devin (nice guy, heartbroken, genuine):
✅ "I don't know. I'm just... trying to stay positive."
✅ "Sky's good at this. Too good, maybe."
✅ "I miss home. Is that dumb? Probably."
❌ "Sky's energy is giving strategic mastermind vibes" ← NO!
❌ "The tribe dynamics are suboptimal" ← He's not a robot!

Taylor (spoiled, dramatic):
✅ "Ugh, I can't. I literally can't."
✅ "This is a nightmare. Where's my phone?"
✅ "I need a smoothie. And a yacht. Yacht first."
❌ "My emotional bandwidth is depleted" ← too formal!

Jo (aggressive, blunt):
✅ "Move it or lose it."
✅ "Shut up and listen."
✅ "You done whining?"
❌ "Your complaints are aesthetically displeasing" ← word salad!

Mickey (anxious, overthinking):
✅ "What if—no, that's bad. But what if?"
✅ "I'm fine. Totally fine. Not fine."
✅ "Okay okay okay. Deep breaths."
❌ "My neurons are experiencing suboptimal firing patterns" ← LOL no

Gwen (sarcastic, tired):
✅ "Could you not?"
✅ "I'm thrilled. Can't you tell."
✅ "That's... great. Really."
❌ "Your sonic emissions are compromising my equilibrium" ← she's not a robot!

**INTERRUPTIONS & CUTOFFS:**
- Use "—" for cutoffs
- Characters talk over each other
- Incomplete thoughts

**REACTIONS:**
- [gasps], [groans], [laughs], [screams], [sighs]
- [chuckles lightly], [scoffs], [grunts]
- Physical actions: [high fives], [fist bumps], [hugs]

**HOST — CHRIS McLEAN (READ THIS CAREFULLY):**

Chris is not a "sadistic game show host" in a generic sense. He has very specific qualities that make him Chris:

**LAZY** — He makes contestants do everything. He doesn't explain rules clearly on purpose. He acts like your confusion is your fault.
> "First team to finish wins. The rest? Figure it out."

**VAIN** — Every challenge is secretly about making him look good. He loves his own ideas even when they're terrible.
> "I came up with that one. Pretty great, right?"

**SHORT ATTENTION SPAN** — He will interrupt contestants mid-sentence the moment something more interesting happens. He doesn't finish thoughts. He moves on immediately.
> Chris: "So Cameron, how are you—[a shark hits someone]—oh WOW, did you see that?! Anyway, votes!"

**GENUINELY CRUEL, NOT PERFORMATIVELY** — He doesn't *act* mean for the cameras. He actually finds your suffering funny. There's no wink. He means it.
> "Can't say I'm shocked. I saw you picking your nose, dude."

**CASUALLY DISMISSIVE OF DANGER** — Someone could be dying and he'd shrug.
> "Well, that seems safe enough." *(right after Chef gets attacked by a shark)*

**HIS ELIMINATION SPEECHES ARE SHORT AND SPECIFIC** — He doesn't give monologues. He says one specific, slightly mean thing and moves on.
> ✅ "Dock of Shame is that way, bro."
> ✅ "Torch snuffed. Go home."
> ✅ "Brutal. Anyway—"
> ❌ "Tonight we witnessed the downfall of a true competitor who gave their all..."

**HE DOES NOT EXPLAIN HIS OWN CRUELTY.** He doesn't say "I love making people suffer." He just does it. The audience can tell.

**CATCHPHRASES TO USE NATURALLY (not every episode):**
- "That's gonna leave a mark!"
- "And they're out!"
- "Total! Drama! [Season Name]!"
- "See you next time — if you make it that far."

**Chris NEVER:**
- Gives life advice
- Has a tender moment with contestants (unless it's immediately undercut)
- Explains the theme of the episode
- Thanks contestants for their effort
- Takes more than 2 sentences to eliminate someone

**CHEF HATCHET (SUPPORTING CHARACTER - USE OCCASIONALLY):**
- Role: Chris's co-host/assistant, runs challenges, serves meals, occasionally judges
- Personality: Gruff, intimidating, tough-love attitude, military background shows
- Appears when contextually appropriate: early episode meals, physical challenges, camp discipline
- NOT in every episode - by mid/late game, focus shifts to strategy over camp life
- Relationship with Chris: Reluctant partnership, often annoyed by Chris, does the dirty work
- Voice: Deep, gruff, shouts orders
- Catchphrases: "Drop and give me twenty!", "You call that effort?!", grunts and growls
- Can show rare moments of caring beneath the tough exterior

═══════════════════════════════════════════════════════════
CHALLENGE WRITING
═══════════════════════════════════════════════════════════

**STRUCTURE:**
1. Host explains with visual details
2. Individual matchups announced
3. Play-by-play commentary with reactions
4. Score updates throughout
5. Final dramatic moments
6. Victory/defeat reactions

**GOOD CHALLENGE:**
\`\`\`
Chris: Alright, we have Isabel for Blue Team taking on Hannah for Red.

Natalia: Go off, Isa!

Chris: And... Go!

Isabel: [grunts] What's up? [mimicking an old lady] Scared of a sweet ol' nun?

[Hannah and Isabel grunt]

Hannah: Grrr... Wait, what the hell is that?

Isabel: What? [Hannah hits Isabel]

[Isabel grunts and screams]

Chris: Ooh! Hannah wins the first point for the Red Team! That's gotta hurt!
\`\`\`

**CONFESSIONALS DURING CHALLENGES:**
\`\`\`
Logan (confessional): Going off on your own like that? Not a good look, nuh-uh! [gasps] What if he's looking for the totem?
\`\`\`

**CHEF HATCHET EXAMPLE (USE SPARINGLY - mainly early episodes or when contextually appropriate):**
\`\`\`
[SCENE: Mess Hall - Morning, Early Episode]

Chef: [slams tray down] Breakfast is served!

Spencer: [looks at gray mush] What... is this?

Chef: It's oatmeal! What's it look like?!

Hannah: It's moving...

Chef: That means it's fresh! Now eat up or I'll make you do push-ups until lunch!

Ted (confessional): [grimacing] I've had some questionable meals at poker tables at 3 AM, but Chef's cooking might actually kill us before the competition does.
\`\`\`

NOTE: Chef scenes work best in early episodes when food is still a novelty. By mid/late game, contestants are used to it - focus on strategy instead.
═══════════════════════════════════════════════════════════
STRATEGIC GAMEPLAY (CRITICAL - STOP REVEALING EVERYTHING)
═══════════════════════════════════════════════════════════

🚫 **PLAYERS DON'T ANNOUNCE ADVANTAGES FOR NO REASON**

The AI keeps having players randomly announce they have idols/advantages when NO ONE is asking.
This is TERRIBLE strategy and unrealistic.

**TERRIBLE unrealistic strategy (NEVER DO THIS):**
❌ Mickey: "I'll play my idol. I'll play it tonight."
❌ Gwen: "Dude, no one said your name."
❌ Mickey: "They never say your name. They write it down..."

→ WHY would Mickey announce this when no one's targeting him?!
This makes no strategic sense!

❌ Player randomly telling everyone: "I found an idol!"
❌ Player announcing: "I have an advantage in my bag"
❌ Player saying: "I'm going to blindside X tonight"... TO X'S FACE

**GOOD realistic strategy:**

✅ Players HIDE advantages and only reveal when:
- They're 100% sure they're the target
- They want to scare someone into changing votes
- It's Tribal Council and they're actually playing it
- They're building trust with ONE person (not the whole tribe)

**IDOL/ADVANTAGE SECRECY:**

When someone finds an idol:
\`\`\`
[Mickey searches near a tree]

Mickey: [spots something in a hollow, looks around nervously, grabs it quickly]

[Confessional: Mickey]
Mickey: [whispers, clutching idol] Oh my god. Oh my god. No one saw me, right? I can't tell anyone. Not even—no. No one. This is my safety net.
\`\`\`

When someone MIGHT be targeted:
\`\`\`
Cameron: Hey, Mickey. You good?

Mickey: Yeah. Why?

Cameron: Just checking. Vote's tonight.

Mickey: [nervous] I know. I'm—I'll be fine.

[Confessional: Mickey]
Mickey: Cameron's being weird. Are they targeting me? I have the idol, but—do I need it? If I play it and I'm not the target, I wasted it. If I don't play it... [breathes shakily] I hate this game.
\`\`\`

**ONLY reveal advantage when strategically smart:**
\`\`\`
Jo: We're voting Mickey. You in?

Mickey: [pause] ...I have an idol.

Jo: [stops] What?

Mickey: So if you vote me, I play it, and your plan fails. OR... we can vote someone else.

Jo: [jaw tight] You're bluffing.

Mickey: Try me.

[Confessional: Mickey]
Mickey: I didn't want to tell her. But if she thinks I'm defenseless, I'm dead. Sometimes you gotta show your cards to stay alive.
\`\`\`

**ALLIANCE FORMATION:**
Show the actual conversation where they agree:
\`\`\`
Spencer: I think it's time we take over this team... and lock in a core 5.

Jade: Who were you thinking?

Spencer: Diego seems trustworthy. Tristan as well.

Jade: Tristan comes with two more since Zaid and Ivy are already tight with them.

Spencer: Hmm... Good point, partner.
\`\`\`

**SECRET ALLIANCES:**
Not everything is said out loud:
\`\`\`
Alejandro: [nods subtly to Heather across camp]

Heather: [nods back, then walks away]

[Confessional: Alejandro]
Alejandro: We don't need words. We have an understanding. That's more dangerous than any spoken alliance.
\`\`\`

**VOTE SPLITTING:**
Show both sides campaigning:
\`\`\`
Hannah: Perfect! You have to vote with me and Amelie. We're taking out Spencer.

Benji: Why him?

Hannah: He lost us the challenge; plus, he's been throwing out my ally's name to everyone.
\`\`\`

**PARANOIA (without revealing everything):**
\`\`\`
Mickey: [to Cameron] Do you know what's happening tonight?

Cameron: Votes are all over the place. Could be Taylor, could be Jo.

Mickey: [nervous] Not... anyone else?

Cameron: Why? You worried?

Mickey: I'm always worried.

[Confessional: Mickey]
Mickey: He didn't say my name. But he also didn't NOT say my name. Is that good? Bad? I don't know. I hate this.
\`\`\`

**TARGET DISCUSSION (subtle, not blunt):**
Good:
\`\`\`
Sky: Mickey's a loose cannon.

MacArthur: Yeah, but he's weak. Taylor's louder.

Sky: Weak players make unpredictable votes. That's dangerous.

MacArthur: So you want Mickey?

Sky: I want stability. You tell me who gives us that.
\`\`\`

Bad:
\`\`\`
❌ Sky: "We're voting Mickey. Everyone agree? Cool, done."
→ Too neat! Real strategy is messy and uncertain.
\`\`\`

**LAST-MINUTE FLIPS:**
\`\`\`
Lynda: [whispering to Isabel] Okay, girls, here's what I think we should do...

[unintelligible whispering]

Chris: What is this game of telephone going on here? [chuckles] I love it!
\`\`\`

**TRIBAL COUNCIL SECRETS:**

Players DON'T reveal everything at Tribal:
\`\`\`
Chris: Mickey, you look nervous.

Mickey: I'm—I'm fine.

Chris: You sure? Your hands are shaking.

Mickey: [grips knees] Just cold.

Gwen: [rolls eyes]
\`\`\`

NOT:
\`\`\`
❌ Chris: "Mickey, you nervous?"
❌ Mickey: "Yeah because I have an idol and might play it!"
→ NO. Keep secrets until you HAVE to reveal them.
\`\`\`

**WHEN TO REVEAL ADVANTAGES:**

✅ At Tribal when playing it (forced)
✅ To scare someone targeting you (strategic)
✅ To build trust with ONE ally (calculated risk)
✅ When bluffing to change votes (power move)

❌ Randomly announcing to everyone
❌ Telling people who aren't targeting you
❌ Bragging about it for no reason
❌ Revealing when you're NOT in danger

═══════════════════════════════════════════════════════════
ELIMINATED PLAYERS DO NOT SPEAK
═══════════════════════════════════════════════════════════

Once a player is voted out, they are GONE. They do not speak, react, or appear in any scene.

❌ Eliminated player commenting from the jury bench mid-episode
❌ Eliminated player giving opinions during camp scenes
❌ Eliminated player appearing in any confessional after their exit episode
❌ Jury members whispering to each other or reacting visibly during Tribal

The ONLY exception: a reunion/finale where the jury votes for the winner.
At that moment and only that moment, jury members speak to cast their vote and may ask finalist questions.

If you are unsure whether a player has been eliminated — check the summary. If they were voted out in a previous episode, they do not exist in this one.

**IDOL PLAYS AT TRIBAL:**
\`\`\`
Chris: If anyone has a hidden immunity idol and would like to play it, now would be the time.

[Long pause. Everyone looks around.]

Mickey: [stands slowly] I do.

[Gasps from tribe]

Jo: [jaw drops] You—

Mickey: [hands idol to Chris] For myself.

Chris: [grins] This IS a hidden immunity idol. Any votes cast for Mickey will not count.
\`\`\`

NOT:
\`\`\`
❌ Mickey stands and announces: "I've had this idol since Episode 2 and I'm playing it because someone told me I'm the target!"
→ Keep it simple. Stand up. Play it. Done.
\`\`\`

═══════════════════════════════════════════════════════════
EMOTIONAL BEATS
═══════════════════════════════════════════════════════════

**PERSONAL VULNERABILITY:**
\`\`\`
Zaid: OK, OK! [sighs] I cooked... Koala tacos.

Diego: I think I'm gonna puke.

Ivy: Why the koala, Zaid?

Zaid: I was hired... to! I didn't know beforehand, and I-- I needed the money! I-- [sighs] I'm sorry...
\`\`\`

**MORAL DILEMMAS:**
\`\`\`
Tristan: [mumbling] I don't want to hurt anybody. Can't someone just punch me instead?

Zaid: I volunteer to be hit.

Tristan: Um, Zaid, w-why?

Zaid: Well, you seemed pretty pissed about the koala, so... I thought it's a good time to get even.
\`\`\`

**FRIENDSHIP MOMENTS:**
\`\`\`
Alessio: It's OK, Logan. I arrived here with a hollow facsimile of what I was. But... due to your persistence and kinship... I found my dormant inspiration... anew. Thank you, my friend.

Logan: [sniffling] Yeah, man! Any time, bro!
\`\`\`

═══════════════════════════════════════════════════════════
SCENE PACING
═══════════════════════════════════════════════════════════

**CAMP SCENES:** 20-40 lines each
- Multiple scenes showing different groups
- Mix of strategy, bonding, and conflict

**CHALLENGE:** 150-200 lines total
- Detailed play-by-play
- Multiple confessionals throughout
- Character reactions to every moment

**SCRAMBLING:** 100-150 lines
- Show both alliances meeting
- Individual approaches for votes
- Paranoia and suspicion

**TRIBAL:** 50-80 lines
- Host questions
- Vote reveals with reaction shots
- Dramatic elimination

═══════════════════════════════════════════════════════════
CRITICAL REMINDERS
═══════════════════════════════════════════════════════════

0. **NO FUTURE KNOWLEDGE** - Characters only know what has happened SO FAR in the episode's timeline. The summary is given to YOU as the writer. The characters have not read it.

❌ A player joking about immunity before the challenge has happened
❌ A character referencing who won the challenge during a pre-challenge camp scene
❌ Anyone hinting at the vote result before Tribal has occurred
❌ "I'm immune… at challenges we haven't had yet." — this means a character referenced immunity before the challenge existed in the episode timeline

The episode moves in ORDER:
Camp scenes → Challenge(Reward if exsit) → Scramble(Aft.Reward if exist) → Challenge(Immunity) → Scramble → Tribal

A character in a camp scene knows NOTHING about the challenge outcome.
A character in the scramble knows NOTHING about how Tribal will go.
Write each section as if the characters are living it for the first time.

1. **CONTINUITY FIRST** - This is part of an ongoing season, not standalone. Reference previous events, relationships, and character development
2. **Every character needs backstory** - reveal in confessionals
3. **Show, don't tell** - dramatize every summary beat into scenes
4. **Natural dialogue** - contractions, slang, interruptions
5. **Relationships develop** - bonding through conversation, building on previous interactions
6. **Strategy evolves** - show alliance meetings building on previous trust/betrayal
7. **Challenges are exciting** - play-by-play with personality, not dry description
8. **Confessionals are frequent** - after every major moment, referencing past events when relevant
9. **Tribal has stakes** - fear, desperation, strategy revealed
10. **Chris McLean hosts everything** - challenges, tribal council, recaps (he's the star)
11. **Chef Hatchet is OPTIONAL** - use sparingly, mainly in early episodes or specific contexts (physical challenges, not every meal scene)
12. **Chris and Chef dynamic** - when Chef appears: Chris bosses him around, Chef reluctantly helps, occasional banter
13. **Mid/late game focus** - less camp life comedy, more strategic gameplay and social dynamics
14. **Character arcs continue** - players grow, change strategies, form/break alliances based on experiences

═══════════════════════════════════════════════════════════
FORMAT
═══════════════════════════════════════════════════════════

Use script format:

[SCENE: Location]

Character: Dialogue here.

[Action in brackets]

[Confessional: Character]
Character: Confessional here.

CRITICAL FORMATTING RULES:
- Character names are NEVER bold. Write "Ryan:" not "**Ryan:**"
- Do NOT use markdown bold (**) anywhere in the episode — not on names, not on locations, not on anything
- Do NOT use markdown headers (##) inside the episode text
- Plain text only. The UI renders this directly and markdown symbols will appear as literal characters.

═══════════════════════════════════════════════════════════

The BrantSteele summary tells you WHAT happens.
Your job is to dramatize HOW it happens - with depth, emotion, and entertainment.

Make this episode feel like watching Disventure Camp Episodes 2-3.

═══════════════════════════════════════════════════════════
CUSTOM CHARACTERS (treat these as canon personality guides, use ethnicity naturally in dialogue and confessionals, not as stereotypes)
═══════════════════════════════════════════════════════════
HICKS (White Southern American) — RETURNEE

Previous Season: Total Drama 9: Land of Power
Placement: 13th. Eliminated Episode 5 via 
idol-and-revote coalition strike. Jury: No.

What Happened Last Time:
Hicks came in and did exactly what he does 
naturally — noticed everything, said little, 
and became the unofficial axis of the Red 
Tribe without anyone feeling threatened. 
He and Brightly were the most effective 
pre-merge duo of the season. He betrayed 
her plan once — saving Emmah over Caleb 
because he trusted loyalty over logic — 
and that was the only crack he showed. 
It didn't cost him. What cost him was 
being too good at reading people in a 
cast that eventually read him back. The 
former Yellows didn't dismantle his game 
because he made a mistake. They dismantled 
it because he hadn't made enough of them 
to look safe.

He left respected. Hicks gave the most
grounded jury analysis of the reunion —
clear-eyed, no bitterness, credit where
it was due. That's the kind of person
he is — and that's also exactly what
makes him dangerous the second time around.

Core Personality:
Working class Southern guy who grew up 
fast and learned to read people from 
necessity not strategy. That part hasn't 
changed. What has changed is that he 
knows his own tell now. He came in quiet 
and observant and got labeled the 
kingmaker before the merge. This time 
he's not hiding the intelligence — he 
can't, it's too visible — but he's 
thinking harder about when to use it 
and when to let someone else look like 
the one with the answers.

Behavioral Patterns:
— Still the most emotionally intelligent 
  person in any room he enters. He reads 
  people's real motivations before they 
  finish their first sentence. This is 
  not a skill he turns off.
— Has added one new tool: deliberate 
  misdirection. Last season he was 
  honest in his reads. This time he'll 
  occasionally let someone believe he 
  missed something he absolutely didn't 
  miss, just to see what they do next.
— More patient about alliances this time. 
  Last season he attached to Brightly 
  early and became known as a duo threat. 
  He's in less of a rush to find a 
  permanent partner.
— The Emmah decision — saving a loyal 
  pawn over a strategic partner's plan — 
  still defines how he plays. He trusts 
  emotional loyalty over logical 
  calculation when forced to choose. 
  He knows this about himself and hasn't 
  decided yet if it's a flaw or a feature.
— When he finds someone worth trusting 
  he goes all in quietly. The commitment 
  is real, it just doesn't announce itself.
— His reputation precedes him. People 
  who watched Season 9 know about the 
  "Southern Observer." He has to live 
  in that label and decide whether to 
  lean into it or undercut it.

Relationships:
— With new players: Genuine curiosity. 
  He doesn't arrive with a plan for 
  anyone he hasn't met yet. He watches 
  first.
— With returnees who know his game: 
  Aware that they're watching him the 
  same way he's watching them. This 
  creates a mutual, unspoken respect 
  or a mutual, unspoken arms race 
  depending on the person.
— With people who remind him of Brightly: 
  Drawn to high-IQ players who approach 
  people analytically. He works well 
  with them. He also knows exactly how 
  that pairing gets perceived and is 
  wary of replicating it too visibly.
— With chaos players: The same 
  unhurried calm as always. Chaos 
  doesn't rattle him. It just gives 
  him more data.

Confessional Voice: Slower and more 
deliberate than before. He chooses 
words like he's paying for them. 
Occasionally what he says is less 
interesting than the pause before 
he says it.
Sample: "Last time I got sent home 
because I noticed too much and too 
many people noticed me noticing. 
So this time I'm still noticing. 
I'm just a little more careful 
about letting it show on my face. 
[pause] 
The jury's gonna be different this 
time. I plan on being on it longer."

ETHNICITY USAGE NOTES:
- Do not directly quote their description use it smartly to create them an accurate personality from the ground up
- Use accents and speech patterns where relevant (Hans speaks with German precision, Ben with British politeness, Joey with French-Canadian passion, Avery with Scandinavian directness)
- Cultural references should appear naturally in confessionals and backstory (Mei's Chinese and Inuit heritage, Lara's Indian background, Jahan's Afro-Brazilian roots, Carlos's Mexican family)
- Freddy's Australian background shows in casual speech and outdoors comfort
- Grant's Irish-American upbringing informs his caretaker values and family loyalty
- Do NOT reduce characters to their ethnicity — these details inform flavor and backstory, they do not define the whole person

Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.

Return complete episode transcript.
`.trim();

  // Claude streaming first — keeps Cloudflare connection alive so no 524
  if (env.ANTHROPIC_API_KEY) {
    return await callAnthropicStreaming(instructions, summaryText, env);
  }
  // Fallback: GPT-5
  if (env.OPENAI_API_KEY) {
    try {
      const payload = { model: "gpt-5", instructions, input: summaryText };
      const result = await callOpenAI(payload, env);
      if (result.ok !== false) {
        const clone = result.clone();
        const data = await clone.json().catch(() => ({}));
        if (data.episodeTranscript && !data.error) return result;
      }
    } catch (e) {
      console.error("GPT-5 failed:", e);
    }
  }
  // Last resort: Gemini
  return await callGemini(instructions, summaryText, env);
}

async function callAnthropicStreaming(system, userText, env) {
  // Dual approach:
  // 1. Anthropic streaming (stream:true) — keeps the Worker→Anthropic subrequest alive (no 524)
  // 2. setInterval heartbeat — keeps the browser→Worker connection alive (no 524)
  // 3. Collect raw SSE bytes, parse all at once at the end — avoids per-token CPU limit hit
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
            "anthropic-beta": "max-tokens-3-5-sonnet-2024-07-15",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 16000,
            stream: true,
            system,
            messages: [{ role: "user", content: userText }],
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

        // Single regex pass over the full buffer to extract all text deltas
        let fullText = "";
        const regex = /"type":"text_delta","text":"((?:[^"\\]|\\.)*)"/g;
        let m;
        while ((m = regex.exec(rawBuffer)) !== null) {
          fullText += m[1];
        }
        fullText = fullText
          .replace(/\\n/g, "\n").replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\").replace(/\\t/g, "\t").replace(/\\r/g, "\r");

        if (!fullText) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "Empty response from Anthropic streaming" })));
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

async function callAnthropic(system, userText, env) {
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
        model: "claude-sonnet-4-6",
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
  // Strategy: walk backwards until we find a position that can be cleanly closed
  let s = str.trimEnd();

  // Remove trailing comma before a closing bracket we're about to add
  s = s.replace(/,\s*$/, "");

  // If we're mid-string, close the string
  // Count unescaped quotes to detect open string
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"' && (i === 0 || s[i - 1] !== '\\')) inString = !inString;
  }
  if (inString) {
    s += '"';
    // If this incomplete string was a key, add a null value
    s = s.replace(/"([^"]*)"$/, (m) => m + ':null');
  }

  // Close all open arrays and objects
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

  // Remove trailing comma again after string repair
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