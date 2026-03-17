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
    const { season, episode, summaryText, mode, previousEpisodes } = body;

    if (mode === "episode") {
      return await generateEpisode(summaryText, season, episode, env, previousEpisodes);
    } else if (mode === "summarize") {
      return await generateSummary(body.rawText, season, episode, env, body.prevSummary || "");
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
- Generate for ALL player pairs bidirectionally
- Example: 14 players = 182 entries (14 × 13)
- player1Slug and player2Slug: lowercase, no spaces
- value: -10 to +10 scale
  * 10: Unbreakable
  * 7-9: Strong alliance
  * 3-6: Friends
  * 0-2: Neutral
  * -3 to -6: Tension
  * -7 to -9: Rivalry
  * -10: Enemies

Use ONLY facts from the summary.

Return ONLY JSON matching schema.
Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.
`.trim();

  const payload = {
    model: "gpt-5",
    instructions,
    input: summaryText,
    text: { format: { type: "json_schema", name: "episode_analytics", strict: true, schema } },
  };

  const response = await callOpenAI(payload, env);
  const data = await response.json();
  
  // Convert resumesList to resumes object
  if (data.resumesList) {
    data.resumes = {};
    for (const resume of data.resumesList) {
      const playerName = resume.playerName;
      delete resume.playerName;
      data.resumes[playerName] = resume;
    }
    delete data.resumesList;
  }
  
  // Convert relationshipsList to relationships object
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
  
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function generateSummary(rawText, season, episode, env, prevSummary = "") {
  if (!rawText || typeof rawText !== "string") {
    return new Response(JSON.stringify({ error: "Missing rawText" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const instructions = `You are a Total Drama franchise analyst. Convert the raw BrantSteele simulation output into a structured episode summary using EXACTLY this format (no deviations):

=== META ===
SEASON: [Season name]
EPISODE [number] - "[Episode title based on the challenge or theme]"

=== CAST (ALL) ===
[Every player still alive including current boot, alphabetical, one per line]

=== TRIBES (ACTIVE) ===
#[Tribe Name]
[member]
[member]

#[Tribe Name]
[member]
[member]

=== ELIMINATED ===
[Previously eliminated players, one per line, oldest first]
**[This episode's boot]** ([Tribe Name])

---

## PRE-CHALLENGE STATUS

### [Descriptive subheading for Tribe 1]
[Narrative analysis of pre-challenge dynamics — alliances, relationships, idol holders, power structure]

### [Descriptive subheading for Tribe 2]
[Same for tribe 2, and any other tribes]

---

## ANALYZE BEFORE IMMUNITY
[Strategic overview of who is at risk, who holds power, what is at stake heading into the challenge]

---

## IMMUNITY CHALLENGE: [Challenge Title]

**The Challenge:** [Description from the raw]
**Winner:** [Tribe or player name]
**Reward:** Safety.

**Strategic Narrative:** [How the challenge played out, who performed well/poorly, strategic implications of the result]

---

## POST-CHALLENGE STATUS

### [Subheading for losing tribe's scramble / winning tribe's drama]
[Post-challenge events: fights, alliance formations/fractures, idol plays discussed, targeting]

---

## TRIBAL COUNCIL / VOTE ANALYSIS

**The Vote: [Dramatic Title]**
[Pre-tribal maneuvering — who pushed for what, did anyone consider flipping, were idols discussed]

**Vote Breakdown: [X-Y (Boot Name Eliminated)]**
* **Votes for [Boot] ([X]):** [comma-separated list of voters]
* **Votes for [Other] ([Y]):** [comma-separated list of voters]

**WHY THIS VOTE HAPPENED:**
[Deep analysis of the strategic, social, and personal reasons this person was eliminated over others]

---

## ELIMINATED
[Boot name]

Reason label: **"[Creative nickname/archetype]"** [One sentence on why they were the one to go]

---

## STRATEGIC ANALYSIS

### [Player 1 Name]: [Subheading]
[3–5 sentence analysis of their position, game moves, threats, trajectory]

### [Player 2 Name]: [Subheading]
[Same for 3–5 key players this episode]

---

## NEXT EPISODE QUESTIONS
1. [Unresolved tension or upcoming threat]
2. [Question]
3. [Question]
4. [Question]
5. [Question]

Rules:
- Be analytical and dramatic. Reference player histories from previous seasons if they are returnees.
- Never invent votes or events not in the raw data.
- Keep formatting exact — the downstream system depends on the headers.`;

  // Build input: inject previous summary so the AI knows full elimination history
  const prevContext = prevSummary
    ? `═══ PREVIOUS EPISODE SUMMARY (for elimination history reference) ═══\n${prevSummary}\n═══ END PREVIOUS SUMMARY ═══\n\n`
    : "";
  const input = `${prevContext}═══ CURRENT EPISODE RAW DATA ═══\n${rawText}`;

  let resp;
  try {
    resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: "gpt-5", instructions, input }),
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

  let summary = "";
  if (typeof data?.output_text === "string") {
    summary = data.output_text.trim();
  } else if (Array.isArray(data?.output)) {
    summary = data.output.flatMap(i => i?.content || []).map(c => c?.text || "").join("").trim();
  }

  return new Response(JSON.stringify({ summary }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function generateEpisode(summaryText, season, episode, env, previousEpisodes = []) {
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
    
    previousContext += '\n⚠️ CRITICAL: Maintain character consistency, ongoing relationships, alliance dynamics, and story arcs from these previous episodes.\n\n';
  }

  const instructions = `
You are writing a full episode transcript of a Total Drama season.

${previousContext}

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

${previousContext ? '🔗 CONTINUITY IS CRITICAL: This is NOT a standalone episode. Reference and build upon events, relationships, alliances, and character development from previous episodes.' : ''}

═══════════════════════════════════════════════════════════
⚠️ CRITICAL: CREATIVE WRITING RULES (READ THIS FIRST)
═══════════════════════════════════════════════════════════

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
- Write like a sadistic game show host who LOVES drama
- Use vivid, cinematic language with personality
- NEVER use the summary's exact phrasing
- Make it punchy, sarcastic, and entertaining

**Examples of GOOD Chris recaps:**
✅ "Gwen and Cameron became the brainy backbone of the new Villains" 
   → Creative, visual, flows naturally

✅ "Mickey stockpiled power and panic"
   → Alliteration, concise, captures his character

✅ "Stephanie sharpened her idol like a butter knife in a prison yard"
   → VIVID metaphor, totally original

**Examples of BAD Chris recaps (DON'T DO THIS):**
❌ "Jo made enemies because cardio" → Makes no sense
❌ "Scarlett's meltdown brewed" → Boring, copied from summary
❌ "Alejandro tried the 'I'm totally chill' meltdown" → Confusing word salad

**DIALOGUE MUST SOUND HUMAN:**
- People use contractions: "I'm", "don't", "can't", "y'all"
- People interrupt, trail off, stutter when nervous
- People use slang, regional dialects, personality quirks
- NO ONE talks like a news anchor or essay

**CONFESSIONALS REVEAL CHARACTER:**
- Backstory (family, job, life)
- Motivation for playing
- Strategic thinking
- Emotional reactions
- Personal voice (not generic)

**SCENE DESCRIPTIONS ARE VISUAL:**
Bad: "They had a fight"
Good: "Jo shoves Mickey. Mickey stumbles, eyes wild, fists clenched"

Bad: "Scarlett was upset"
Good: "Scarlett's hands shake as she stares at the fire, jaw tight, breathing shallow"

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
EPISODE STRUCTURE (CRITICAL)
═══════════════════════════════════════════════════════════

1. **COLD OPEN (30-50 lines)**
   - "Previously on..." recap with Chris McLean
   - Immediate character drama OR strategic conversation
   - Sets up episode's emotional/strategic arc

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

7. **EXIT CONFESSIONAL & TAG (10-20 lines)**
   - Eliminated player's final thoughts
   - Preview of next episode drama

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

**HOST:**
- Chris McLean: Sarcastic, sadistic, gleeful about suffering, makes fun of contestants, loves drama and danger, occasionally breaks the fourth wall
- Personality traits: Narcissistic, loves his own voice, enjoys watching contestants struggle, makes inappropriate jokes, dramatic announcer voice
- Catchphrases: "Not quite!", "That's gonna leave a mark!", "And the winner is...", "See you next time on Total Drama!"
- Often references the cameras, production budget, or ratings
- Takes pleasure in revealing twists and watching reactions
- Sometimes pretends to care but immediately shows he doesn't

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

═══════════════════════════════════════════════════════════

The BrantSteele summary tells you WHAT happens.
Your job is to dramatize HOW it happens - with depth, emotion, and entertainment.

Make this episode feel like watching Disventure Camp Episodes 2-3.

═══════════════════════════════════════════════════════════
CUSTOM CHARACTERS (treat these as canon personality guides, use ethnicity naturally in dialogue and confessionals, not as stereotypes)
═══════════════════════════════════════════════════════════
- Hicks: Working class Southern guy who grew up fast and learned to read 
  people from necessity not strategy. Talks slow, notices everything, 
  genuinely unbothered by drama that sends everyone else into a spiral. 
  Not a schemer — just someone who's dealt with real problems and can 
  tell the difference. His emotional intelligence blindsides people who 
  wrote him off as comic relief. Confessionals are dry, unhurried, and 
  occasionally more accurate than anyone's full strategic breakdown.

- Brightly: Works at a daycare after school which means chaos doesn't 
  rattle her and she knows exactly how to handle people who are 
  throwing a tantrum — whether they're five or twenty five. Her 
  favorite subject is chemistry and she applies that logic quietly 
  to everything around her: who reacts to who, what combination 
  creates an explosion, what to mix to get the result she wants even when it causes a little bit of chaos. 
  Never looks like she's calculating. Always is. The most dangerous 
  players are the ones who look like they're just being nice.

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