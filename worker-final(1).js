export default {
  async fetch(request, env) {
    const cors = corsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("Use POST", { status: 405, headers: cors });
    }

    const body = await request.json().catch(() => ({}));
    const { mode } = body;

    try {
      if (mode === "audition-generation") {
        return await generateAuditions(body, env);
      } else if (mode === "season-data-extraction") {
        return await generateSeasonDataExtraction(body, env);
      } else if (mode === "rankings-rebuild") {
        return await generateRankingsRebuild(body, env);
      } else if (mode === "rankings-update") {
        return await generateRankingsUpdate(body, env);
      } else {
        return new Response(JSON.stringify({ 
          error: "Invalid mode. Use: 'season-data-extraction', 'rankings-rebuild', or 'rankings-update'" 
        }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: "Worker error", 
        details: String(e), 
        stack: e.stack 
      }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function safeLowerId(x) {
  return String(x || "").trim().toLowerCase();
}

// ===== AUDITION GENERATION =====
async function generateAuditions(body, env) {
  const cors = corsHeaders();
  const { auditionsText, seasonTheme, seasonNumber, castSize } = body;

  if (!auditionsText || !auditionsText.trim()) {
    return new Response(JSON.stringify({ error: "No auditions text provided" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      auditions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            auditionNumber: { type: "number" },
            archetype: { type: "string" },
            personalityTraits: { type: "array", items: { type: "string" } },
            auditionText: { type: "string" },
            strategy: { type: "string" },
            memorableQuote: { type: "string" },
            hook: { type: "string" },
          },
          required: ["name", "auditionNumber", "archetype", "personalityTraits", "auditionText", "strategy", "memorableQuote", "hook"],
        },
      },
    },
    required: ["auditions"],
  };

  const instructions = `
Parse and structure audition tapes from the provided text.

INPUT: Raw text containing audition summaries (one per contestant)
OUTPUT: Structured JSON with each audition formatted consistently

YOUR TASK:
1. Parse each audition from the text
2. Extract: name, archetype (from parentheses), main audition text
3. Infer: personality traits (3-5 adjectives), strategy summary, memorable quote, hook
4. Return structured JSON

EXTRACTION RULES:
- **Name**: Extract from "Audition X/Y — Name (Archetype)" format
- **Archetype**: Extract from parentheses after name
- **Audition Text**: The main 2-4 paragraph audition tape (clean it up, maintain voice)
- **Personality Traits**: Infer 3-5 adjectives from the text (e.g., "bubbly", "nervous", "strategic")
- **Strategy**: Summarize their stated or implied game plan in 1 sentence
- **Memorable Quote**: Extract the most quotable line from their audition
- **Hook**: The "end beat" or final promise/statement

STYLE PRESERVATION:
- Keep the first-person voice (character speaking to camera)
- Maintain their personality and quirks
- Clean up formatting but preserve essence

EXAMPLE INPUT:
"Audition 1/16 — Carrie (Hopeless Romantic Superfan)
Carrie comes in bubbly and nervous, clutching a notebook filled with handwritten 'dream alliances.' She admits she watches every season like it's a rom-com, rooting for couples and underdogs. She says she wants to play 'with her heart,' but immediately worries that means she'll get blindsided. She promises she won't fall in love this time… then instantly admits she probably will."

EXAMPLE OUTPUT:
{
  "name": "Carrie",
  "auditionNumber": 1,
  "archetype": "Hopeless Romantic Superfan",
  "personalityTraits": ["bubbly", "nervous", "emotional", "romantic", "self-aware"],
  "auditionText": "Carrie comes in bubbly and nervous, clutching a notebook filled with handwritten 'dream alliances.' She admits she watches every season like it's a rom-com, rooting for couples and underdogs. She says she wants to play 'with her heart,' but immediately worries that means she'll get blindsided. She promises she won't fall in love this time… then instantly admits she probably will.",
  "strategy": "Play with heart but try to think strategically",
  "memorableQuote": "If I get voted out for trusting people… at least it'll be poetic.",
  "hook": "Wants to prove she can play strategically, not just emotionally"
}

Return ONLY JSON with the auditions array.
`.trim();
  
  const payload = {
    model: "gpt-5",
    instructions,
    input: `Parse these audition summaries into structured JSON:\n\n${auditionsText}`,
    text: { format: { type: "json_schema", name: "auditions", strict: true, schema } },
  };

  return await callOpenAI(payload, env);
}

// ===== EXTRACT CANONICAL CAST =====
function extractCastFromEpisode1(episodes) {
  try {
    const ep1 = Array.isArray(episodes) ? episodes[0] : null;
    const text = (ep1 && (ep1.summary || ep1.text || ep1.raw || "")) || "";
    if (!text) return [];

    const startIdx = text.indexOf("=== CAST (ALL) ===");
    if (startIdx === -1) return [];
    const afterStart = text.slice(startIdx + "=== CAST (ALL) ===".length);

    const nextHeadingIdx = afterStart.indexOf("===");
    const block = (nextHeadingIdx === -1 ? afterStart : afterStart.slice(0, nextHeadingIdx)).trim();
    if (!block) return [];

    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim());

    const banned = new Set(["votes to win", "votes received", "jury votes", "elimination order", "placements", "statistics", "cast"]);
    const cleaned = lines.filter((n) => {
      const lower = n.toLowerCase();
      return n && !banned.has(lower) && !lower.includes("votes to win");
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

// ===== SEASON DATA EXTRACTION =====
async function generateSeasonDataExtraction(body, env) {
  const cors = corsHeaders();
  const { season, seasonTitle, episodes, finale, awards, metadata, brantsteeleStats } = body;

  if (!episodes || episodes.length === 0) {
    return new Response(JSON.stringify({ error: "No episodes provided" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const canonicalCast = extractCastFromEpisode1(episodes);
  const expectedCastSize = Number(metadata?.castSize) || (canonicalCast.length || undefined);

  const castItemSchema = canonicalCast.length ? { type: "string", enum: canonicalCast } : { type: "string" };

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      cast: {
        type: "array",
        items: castItemSchema,
        ...(expectedCastSize ? { minItems: expectedCastSize, maxItems: expectedCastSize } : {}),
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
            phase: { type: "string", enum: ["Winner", "Finalist", "Juror", "Pre-Juror", "Pre-Merge"] },
            notes: { type: "string" },
            strategicRank: { type: "number" },
            story: { type: "string" },
            gameplayStyle: { type: "string" },
            keyMoments: { type: "array", items: { type: "string" } },
            challengeWins: { type: "number" },
            immunityWins: { type: "number" },
            idolsFound: { type: "number" },
            votesReceived: { type: "number" },
            alliances: { type: "array", items: castItemSchema },
            rivalries: { type: "array", items: castItemSchema },
          },
          required: [
            "placement", "name", "phase", "notes", "strategicRank", "story", "gameplayStyle", "keyMoments",
            "challengeWins", "immunityWins", "idolsFound", "votesReceived", "alliances", "rivalries"
          ],
        },
      },
      finalists: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { name: castItemSchema, placement: { type: "number" }, juryVotes: { type: "number" } },
          required: ["name", "placement", "juryVotes"],
        },
      },
      winner: {
        type: "object",
        additionalProperties: false,
        properties: { 
          name: castItemSchema, 
          keyStats: { type: "string" }, 
          strategy: { type: "string" }, 
          legacy: { type: "string" } 
        },
        required: ["name", "keyStats", "strategy", "legacy"],
      },
      jury: { type: "array", items: castItemSchema },
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
                properties: { voter: castItemSchema, target: castItemSchema },
                required: ["voter", "target"],
              },
            },
          },
          required: ["episode", "eliminated", "votes"],
        },
      },
      seasonNarrative: { type: "string" },
    },
    required: ["cast", "placements", "finalists", "winner", "jury", "votingHistory", "seasonNarrative"],
  };

  let episodeSummaries = "";
  episodes.forEach((ep) => {
    episodeSummaries += `\n\n=== EPISODE ${ep.episode} ===\n${ep.summary}`;
  });

  let brantsteeleSection = "";
  if (brantsteeleStats && brantsteeleStats.length > 100) {
    brantsteeleSection = `\n\n=== BRANTSTEELE STATISTICS ===\n${brantsteeleStats}\n`;
  }

  const canonicalCastSection = canonicalCast.length
    ? `\n\nCANONICAL_CAST:\n- ${canonicalCast.join("\n- ")}`
    : "";

  const instructions = `Extract Total Drama season data. Use CANONICAL_CAST names only.${canonicalCastSection}\nReturn ONLY JSON.`;

  const payload = {
    model: "gpt-5",
    instructions,
    input: episodeSummaries + brantsteeleSection,
    text: { format: { type: "json_schema", name: "season_data", strict: true, schema } },
  };

  return await callOpenAI(payload, env);
}

// ===== APPLY RANKING OVERRIDES =====
function applyRankingOverrides(rankings, overridesData) {
  if (!overridesData || !overridesData.overrides) {
    console.log('No overrides provided, using AI scores');
    return rankings;
  }
  
  const overrides = overridesData.overrides;
  let overrideCount = 0;
  
  rankings.forEach(ranking => {
    const playerId = ranking.playerId;
    
    if (overrides[playerId]) {
      const override = overrides[playerId];
      
      // Store original AI values
      ranking.aiScore = ranking.score;
      ranking.aiTier = ranking.tier;
      
      // Apply overrides
      if (override.score !== undefined) {
        ranking.score = override.score;
        console.log(`✓ Override ${playerId}: ${ranking.aiScore} → ${ranking.score}`);
        overrideCount++;
      }
      
      if (override.tier) {
        ranking.tier = override.tier;
      }
      
      // Add override metadata
      ranking.override = {
        applied: true,
        reason: override.reason || 'Manual override',
        originalScore: ranking.aiScore,
        originalTier: ranking.aiTier
      };
    }
  });
  
  console.log(`Applied ${overrideCount} overrides`);
  
  // Re-sort by (possibly overridden) scores
  rankings.sort((a, b) => b.score - a.score);
  
  // Re-assign ranks
  rankings.forEach((r, i) => (r.rank = i + 1));
  
  return rankings;
}

// ===== SCORING FORMULA (MIMICS USER'S SYSTEM) =====

function calculateScore(player) {
  const details = Array.isArray(player.seasonDetails) ? player.seasonDetails : [];
  const seasons = details.length || 1;
  
  if (details.length === 0) return 25; // Default for no data
  
  const avgPlacement = details.reduce((sum, s) => sum + Number(s.placement || 99), 0) / details.length;
  const wins = Number(player.wins || 0);
  const challengeWins = Number(player.totalChallengeWins || 0);
  const votesAgainst = Number(player.totalVotesAgainst || 0);
  const juryVotes = Number(player.totalJuryVotes || 0);
  const idolsFound = Number(player.totalIdolsFound || 0);
  
  // PLACEMENT COMPONENT (0-100, most important)
  // Lower avg = higher score
  // Mickey (1.5 avg) ≈ 92.5, Jacques (1.0) = 95, Ryan (5.5) ≈ 72.5, Bridgette (8.5) ≈ 57.5
  const placementScore = Math.max(0, Math.min(100, ((20 - avgPlacement) / 20) * 100));
  
  // WIN BONUS (0-20 points)
  // Jacques (1 win, 1 season) = +20, Mickey (1 win, 2 seasons) = +10, Alejandro (1 win, 3 seasons) = +6.7
  const winBonus = (wins / seasons) * 20;
  
  // CHALLENGE BONUS (0-15 points)
  // Alejandro (13 wins, 3 seasons) = +14.4, Jacques (4 wins, 1 season) = +13.3
  const challengeBonus = Math.min(15, (challengeWins / seasons) * 3.33);
  
  // SOCIAL COMPONENT (-10 to +10)
  // High jury votes = positive, high votes against = negative
  const votesPerSeason = votesAgainst / seasons;
  const juryPerSeason = juryVotes / seasons;
  const socialBonus = Math.min(10, juryPerSeason * 2) - Math.min(10, votesPerSeason * 0.8);
  
  // STRATEGIC BONUS (0-5 points)
  const strategicBonus = Math.min(5, (idolsFound / seasons) * 2.5);
  
  // TOTAL SCORE
  let total = placementScore + winBonus + challengeBonus + socialBonus + strategicBonus;
  
  // Small sample penalty (1-season players capped at ~90)
  if (seasons === 1 && wins === 0) {
    total = Math.min(total, 88);
  }
  
  return Math.round(Math.min(100, Math.max(0, total)) * 10) / 10; // Round to 1 decimal
}

function assignTier(score) {
  if (score >= 85) return "S+";
  if (score >= 80) return "S";
  if (score >= 70) return "A";
  if (score >= 60.5) return "B";
  if (score >= 50.5) return "C";
  return "D";
}

function generateStatus(player, currentSeason) {
  const playedSeasons = new Set(player.seasons || []);
  const missedSeasons = [];
  
  for (let i = 1; i <= currentSeason; i++) {
    if (!playedSeasons.has(i)) {
      missedSeasons.push(i);
    }
  }
  
  if (missedSeasons.length === 0) {
    return `Competed in all ${currentSeason} seasons`;
  } else if (missedSeasons.length === currentSeason - 1) {
    return `Competed in Season ${[...playedSeasons][0]} only`;
  } else if (missedSeasons.length <= 3) {
    return `Did not compete in S${missedSeasons.join(', S')}`;
  } else {
    return `Competed in ${playedSeasons.size}/${currentSeason} seasons`;
  }
}

// ===== RANKINGS REBUILD (All Players) =====
async function generateRankingsRebuild(body, env) {
  const cors = corsHeaders();
  
  const { playersDB, currentSeason } = body;

  if (!playersDB?.players || !Array.isArray(playersDB.players)) {
    return new Response(JSON.stringify({ error: "Missing playersDB.players" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Filter valid players only
  const allPlayers = playersDB.players.filter(p => {
    const id = safeLowerId(p.id || p.playerId);
    return id && 
           !id.includes('votes-to-win') && 
           !id.includes('juror-voted') &&
           !id.includes('jury-votes') &&
           id !== 'everyone' &&
           id !== 'eliminate';
  });

  console.log(`Calculating scores for ${allPlayers.length} players...`);

  // Calculate scores for all
  const rankings = allPlayers.map(player => {
    const score = calculateScore(player);
    const tier = assignTier(score);
    const details = Array.isArray(player.seasonDetails) ? player.seasonDetails : [];
    const seasons = details.length || 1;
    
    return {
      playerId: safeLowerId(player.id || player.playerId || player.name),
      tier,
      score,
      rank: 0,
      
      // Stats
      avgPlacement: details.length 
        ? Number((details.reduce((sum, s) => sum + Number(s.placement || 0), 0) / details.length).toFixed(2))
        : 99,
      winRate: Number(((Number(player.wins || 0) / seasons) * 100).toFixed(1)),
      seasons: player.seasons || [],
      placements: details.map(s => s.placement),
      challengeWins: Number(player.totalChallengeWins || 0),
      votesAgainst: Number(player.totalVotesAgainst || 0),
      juryVotes: Number(player.totalJuryVotes || 0),
      idolsFound: Number(player.totalIdolsFound || 0),
      status: generateStatus(player, currentSeason || 6),
      
      // Placeholders for AI
      title: "",
      emoji: "",
      reasoning: "",
      strengths: [],
      weaknesses: [],
    };
  });

  // Sort by score
  rankings.sort((a, b) => b.score - a.score);
  rankings.forEach((r, i) => (r.rank = i + 1));

  // Ask AI for narratives (batched)
  const batchSize = 30;
  const batches = [];
  for (let i = 0; i < rankings.length; i += batchSize) {
    batches.push(rankings.slice(i, i + batchSize));
  }

  const narrativeRankings = [];
  
  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    
    // Build rich player context with stories
    const playersWithContext = batch.map(ranking => {
      const player = allPlayers.find(p => safeLowerId(p.id || p.playerId) === ranking.playerId);
      
      return {
        playerId: ranking.playerId,
        name: player?.name || ranking.playerId,
        score: ranking.score,
        tier: ranking.tier,
        rank: ranking.rank,
        
        // Stats
        avgPlacement: ranking.avgPlacement,
        winRate: ranking.winRate,
        seasons: ranking.seasons,
        placements: ranking.placements,
        challengeWins: ranking.challengeWins,
        votesAgainst: ranking.votesAgainst,
        juryVotes: ranking.juryVotes,
        idolsFound: ranking.idolsFound,
        
        // Rich context from season builder
        story: player?.story || "",  // Full AI-generated story from episodes
        seasonDetails: (player?.seasonDetails || []).map(s => ({
          season: s.season,
          placement: s.placement,
          gameplayStyle: s.gameplayStyle || "",
          keyMoments: s.keyMoments || [],
          alliances: s.alliances || [],
          rivalries: s.rivalries || []
        }))
      };
    });
    
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        rankings: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              playerId: { type: "string" },
              title: { type: "string" },
              emoji: { type: "string" },
              reasoning: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
            },
            required: ["playerId", "title", "emoji", "reasoning", "strengths", "weaknesses"],
          },
        },
      },
      required: ["rankings"],
    };

    const instructions = `
Generate narrative fields for Total Drama franchise rankings.

You have access to each player's full STORY (extracted from episode summaries) and their seasonDetails (gameplay style, key moments, alliances, rivalries).

USE THIS RICH CONTEXT to write thoughtful, specific reasoning that references actual gameplay events, not just stats.

TITLE PATTERNS (2-4 words):
- Winners: "The Champion", "The Unbeaten", "The Prodigy"
- Multi-season legends: "The Strategist", "The Powerhouse"
- Runners-up: "The Contender", "The Silver Medalist"
- Strategic players: "The Schemer", "The Analyst"
- Physical players: "The Competitor", "The Athlete"
- Social players: "The Goth Icon", "The Social Queen"
- Personality-based: "The Rebel Champ", "The Underdog", "The Snake Charmer"

EMOJI PATTERNS:
🏆 = Multi-season winner (50%+ win rate)
🥇 = 1-season perfect winner (100% win rate)
👑 = Winner with strong legacy
🧠 = Strategic mastermind
💪 = Challenge powerhouse
🥈 = Runner-up
🏅 = Strong competitor
🦊 = Schemer/manipulator
🖤 = Iconic/memorable
♟️ = Chess master / Strategic genius
🎸🎭🎮🎉 = Personality-based

REASONING (2-4 sentences) - MUST reference actual gameplay from their story:
- Reference specific KEY MOMENTS from their seasonDetails
- Mention ALLIANCES that helped them or RIVALRIES that hurt them
- Reference their GAMEPLAY STYLE (strategic, social, physical, etc.)
- Include stats but make them support the narrative, not BE the narrative
- If they have a story field, pull specific events from it

BAD Example (stats only): "1 win in 2 seasons, avg 1.5. Challenges: 3 wins. Votes: 8 against. Jury: 5 votes."

GOOD Example (story-driven): "Won S5 through a dominant social game, leveraging his alliance with Trent to control the vote. His S6 runner-up finish showed consistency (avg 1.5), though he received 8 votes against for being a threat. Strong jury pull (5 votes) reflects his social mastery."

ANOTHER GOOD Example: "Redemption arc king—went from 17th place elimination in S3 to winning S4 on his second chance. His strategic evolution and fire-making win at Final 4 sealed his legacy."

STRENGTHS (2-4 items) - Reference actual gameplay:
- "Dominated physically (13 challenge wins)"
- "Three-time finalist (only player ever)"
- "Strategic idol plays at merge"
- "Unbreakable social bonds"
- "Redemption arc winner"
- "Consistent deep runs"

WEAKNESSES (1-3 items) - Be specific:
- "Always targeted early (25 votes against)"
- "Needed 3 tries to win"
- "Exposed by idol misplay"
- "Volatile placement (1st/14th/7th)"
- "Weak jury management"

Return ONLY JSON.
`.trim();

    const payload = {
      model: "gpt-5",
      instructions,
      input: JSON.stringify({ rankings: playersWithContext }, null, 2),  // Send rich context
      text: { format: { type: "json_schema", name: "rankings_narrative", strict: true, schema } },
    };

    const aiResp = await callOpenAI(payload, env);
    const aiJson = await aiResp.json().catch(() => null);

    if (aiJson?.rankings) {
      // Merge AI narratives back into rankings
      for (const aiRank of aiJson.rankings) {
        const original = batch.find(r => r.playerId === aiRank.playerId);
        if (original) {
          original.title = aiRank.title;
          original.emoji = aiRank.emoji;
          original.reasoning = aiRank.reasoning;
          original.strengths = aiRank.strengths;
          original.weaknesses = aiRank.weaknesses;
        }
      }
    }
    
    narrativeRankings.push(...batch);
  }

  // Apply manual overrides if provided
  const finalRankings = applyRankingOverrides(narrativeRankings, body.overrides);

  const out = {
    metadata: {
      name: "DC Franchise Rankings Database",
      version: String(currentSeason || "6"),
      lastUpdated: new Date().toISOString().split("T")[0],
      totalPlayers: finalRankings.length,
      source: "User-mimicking scoring formula + AI narratives + Manual overrides",
    },
    scoringSystem: {
      overview: "Mimics user's manual ranking logic",
      formula: "Placement(base 0-100) + WinBonus(0-20) + ChallengeBonus(0-15) + SocialBonus(-10 to +10) + StrategicBonus(0-5)",
      details: "Placement = (20 - avgPlacement)/20 * 100. Win = wins/seasons * 20. Challenge = wins/season * 3.33 (cap 15). Social = juryVotes*2 - votesAgainst*0.8. Strategic = idols/season * 2.5 (cap 5)."
    },
    tiers: {
      "S+": { scoreRange: [85, 100], description: "Elite players" },
      "S": { scoreRange: [80, 84.9], description: "Top performers" },
      "A": { scoreRange: [70, 79.9], description: "Strong competitors" },
      "B": { scoreRange: [60.5, 69.9], description: "Above average" },
      "C": { scoreRange: [50.5, 60.4], description: "Average" },
      "D": { scoreRange: [0, 50.4], description: "Below average" },
    },
    rankings: finalRankings,
  };

  return new Response(JSON.stringify(out), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ===== RANKINGS UPDATE (Preserve Non-Returnees) =====
async function generateRankingsUpdate(body, env) {
  const cors = corsHeaders();
  
  const { playersDB, seasonData, oldRankingsDB, oldRankingsData } = body;

  if (!playersDB?.players) {
    return new Response(JSON.stringify({ error: "Missing playersDB" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let base = oldRankingsDB || oldRankingsData;
  if (!base?.rankings) {
    return new Response(JSON.stringify({ error: "No old rankings. Use 'rankings-rebuild' first." }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const playedThisSeason = new Set(
    (seasonData?.placements || [])
      .map((p) => safeLowerId(p.playerId || p.playerSlug || p.id || p.name))
      .filter(Boolean)
  );

  const oldMap = Object.create(null);
  for (const r of base.rankings) {
    const pid = safeLowerId(r.playerId);
    if (pid) oldMap[pid] = r;
  }

  const allPlayers = playersDB.players.filter(p => {
    const id = safeLowerId(p.id || p.playerId);
    return id && !id.includes('votes-to-win') && !id.includes('juror-voted');
  });

  const preserved = [];
  const recomputed = [];

  for (const player of allPlayers) {
    const playerId = safeLowerId(player.id || player.playerId || player.name);
    if (!playerId) continue;

    const hadOld = !!oldMap[playerId];
    const shouldRecompute = playedThisSeason.has(playerId) || !hadOld;

    if (!shouldRecompute && hadOld) {
      preserved.push({ ...oldMap[playerId] });
      continue;
    }

    // Recalculate (same as rebuild)
    const score = calculateScore(player);
    const tier = assignTier(score);
    const details = Array.isArray(player.seasonDetails) ? player.seasonDetails : [];
    const seasons = details.length || 1;
    
    recomputed.push({
      playerId,
      tier,
      score,
      rank: 0,
      avgPlacement: details.length 
        ? Number((details.reduce((sum, s) => sum + Number(s.placement || 0), 0) / details.length).toFixed(2))
        : 99,
      winRate: Number(((Number(player.wins || 0) / seasons) * 100).toFixed(1)),
      seasons: player.seasons || [],
      placements: details.map(s => s.placement),
      challengeWins: Number(player.totalChallengeWins || 0),
      votesAgainst: Number(player.totalVotesAgainst || 0),
      juryVotes: Number(player.totalJuryVotes || 0),
      idolsFound: Number(player.totalIdolsFound || 0),
      status: generateStatus(player, seasonData?.seasonNumber || 6),
      title: "",
      emoji: "",
      reasoning: "",
      strengths: [],
      weaknesses: [],
    });
  }

  // TODO: Call AI for narratives on recomputed players only
  // For now, use placeholders
  for (const r of recomputed) {
    r.title = "—";
    r.emoji = "—";
    r.reasoning = "Updated after new season";
    r.strengths = [];
    r.weaknesses = [];
  }

  const merged = [...recomputed, ...preserved];
  merged.sort((a, b) => b.score - a.score);
  merged.forEach((r, i) => (r.rank = i + 1));

  // Apply manual overrides if provided
  const finalMerged = applyRankingOverrides(merged, body.overrides);

  const out = {
    metadata: base.metadata || {},
    scoringSystem: base.scoringSystem || {},
    tiers: base.tiers || {},
    rankings: finalMerged,
  };

  return new Response(JSON.stringify(out), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ===== OpenAI Helper =====
async function callOpenAI(payload, env) {
  const cors = corsHeaders();
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
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const outText = typeof data?.output_text === "string" ? data.output_text.trim() : "";
  let outJson = null;

  if (outText) {
    try {
      outJson = JSON.parse(outText);
    } catch {}
  }

  if (!outJson && Array.isArray(data?.output)) {
    const joined = data.output
      .flatMap((i) => i?.content || [])
      .map((c) => c?.text || "")
      .join("")
      .trim();
    if (joined) {
      try {
        outJson = JSON.parse(joined);
      } catch {}
    }
  }

  return new Response(JSON.stringify(outJson || data), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}