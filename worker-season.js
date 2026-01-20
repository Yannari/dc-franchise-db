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
          error: "Invalid mode. Use: 'audition-generation', 'season-data-extraction', 'rankings-rebuild', or 'rankings-update'" 
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

const instructions = `
Extract Total Drama season data from episode summaries.

CRITICAL: Use CANONICAL_CAST names exactly as provided. Do not invent new names.

=== STRATEGIC RANK DEFINITION (1-10 scale) ===

Strategic Rank measures a player's STRATEGIC IMPACT and GAME CONTROL, NOT their placement.

**Rating Scale (1-10):**

**10 - Strategic Mastermind**
- Controlled multiple votes across the season
- Orchestrated major blindsides or flips
- Found/played idols with perfect timing
- Held multiple alliances together
- Made game-defining moves
Example: Winner who controlled entire merge, idol plays that changed the game

**8-9 - Strategic Powerhouse**
- Controlled their alliance's votes consistently
- Executed successful blindsides or strategic moves
- Found advantages and used them well
- Shaped the endgame structure
Example: Finalists who ran voting blocs, players who controlled pre-merge

**6-7 - Strategic Player**
- Made some strategic moves that mattered
- Positioned well within alliances
- Occasional vote control or successful targeting
- Found advantages but didn't always maximize them
Example: Jury members who made key moves, alliance lieutenants

**4-5 - Average Strategy**
- Followed alliance plans without leading
- Made basic strategic decisions
- Survived by being in the right alliance
- No major strategic impact
Example: Mid-merge boots who played safely, floaters

**2-3 - Minimal Strategy**
- Mostly reactive, not proactive
- Followed others' plans
- No strategic moves of note
Example: Early jury members with no big moves, pre-merge boots

**1 - No Strategic Impact**
- First boot or quit with no gameplay
- Made no strategic decisions
- Pure social/physical game or early exit
Example: Episode 1-2 boots, quits

**HOW TO ASSIGN:**
1. Read the full season summary
2. Identify who CONTROLLED votes, not who survived longest
3. Note idol plays, blindsides, alliance formations
4. Winners get 8-10 IF they strategically dominated (not just won comps)
5. Early boots can have high scores IF they made big moves before elimination
6. Late-game floaters can have low scores IF they never controlled anything

**Examples from Season 7:**
- MacArthur (Winner, held idol, alliance switchboard, controlled endgame) = 9-10
- Cody (Runner-up, advantage master, key alliances) = 8-9
- Taylor (7th, ultimate connector, kingmaker) = 8-9
- Jacques (4th quit, comp beast but strategic before meltdown) = 6-7
- Tom (5th, one huge idol play) = 5-6
- Scott (8th, duo player, consistent) = 6-7
- Carrie (3rd, social queen, protected by bonds) = 7-8
- Lindsay (1st boot, winner threat) = 2-3
- Spud (17th, no strategic moves) = 1-2

${canonicalCastSection}

Return ONLY valid JSON matching the schema.
`.trim();

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

// ===== SCORING FORMULA - COMPLETE FIXED VERSION =====

function calculateScore(player) {
  const details = Array.isArray(player.seasonDetails) ? player.seasonDetails : [];
  const seasons = details.length || 1;
  
  if (details.length === 0) return 25;
  
  const sortedDetails = [...details].sort((a, b) => a.season - b.season);
  
  // Calculate weighted placement
  let weightedPlacement = 0;
  let improvement = 0;
  
  if (seasons === 1) {
    weightedPlacement = sortedDetails[0].placement;
  } else {
    const mostRecent = sortedDetails[sortedDetails.length - 1];
    const older = sortedDetails.slice(0, -1);
    const firstPlacement = sortedDetails[0].placement;
    improvement = firstPlacement - mostRecent.placement;
    
    if (improvement >= 10) {
      const olderAvg = older.reduce((sum, s) => sum + s.placement, 0) / older.length;
      weightedPlacement = (mostRecent.placement * 0.7) + (olderAvg * 0.3);
    } else {
      const olderAvg = older.reduce((sum, s) => sum + s.placement, 0) / older.length;
      weightedPlacement = (mostRecent.placement * 0.5) + (olderAvg * 0.5);
    }
  }
  
  // BASE COMPONENTS
  const placementScore = Math.max(0, Math.min(45, 45 * (1 - (weightedPlacement - 1) / 19)));
  
  const wins = Number(player.wins || 0);
  const winScore = (wins / seasons) * 20;
  
  const challengeWins = Number(player.totalChallengeWins || 0);
  const immunityWins = Number(player.totalImmunityWins || 0);
  const totalChallengeValue = (immunityWins * 1.3) + challengeWins;
  const challengePerSeason = totalChallengeValue / seasons;
  const challengeScore = Math.min(15, challengePerSeason * 3);
  
  const votesAgainst = Number(player.totalVotesAgainst || 0);
  const juryVotes = Number(player.totalJuryVotes || 0);
  const totalAlliances = details.reduce(
    (sum, s) => sum + (Array.isArray(s.alliances) ? s.alliances.length : 0),
    0
  );
  const totalRivalries = details.reduce(
    (sum, s) => sum + (Array.isArray(s.rivalries) ? s.rivalries.length : 0),
    0
  );
  
  const juryPerSeason = juryVotes / seasons;
  const juryBonus = Math.min(6, juryPerSeason * 0.6);
  const votesPerSeason = votesAgainst / seasons;
  const votesBonus = Math.max(0, 3 - (votesPerSeason * 0.2));
  const alliancesPerSeason = totalAlliances / seasons;
  const allianceBonus = Math.min(2, alliancesPerSeason * 0.4);
  const rivalriesPerSeason = totalRivalries / seasons;
  const rivalryPenalty = Math.min(2, rivalriesPerSeason * 0.3);
  
  const socialScore = Math.max(0, Math.min(12, 
    juryBonus + votesBonus + allianceBonus - rivalryPenalty
  ));
  
  const idolsFound = Number(player.totalIdolsFound || 0);
  const avgStrategicRank = details.reduce((sum, s) => 
    sum + Number(s.strategicRank || 5), 0
  ) / details.length;
  
  const strategicRankScore = Math.min(8, (avgStrategicRank - 1) * 0.89);
  const idolScore = Math.min(3, (idolsFound / seasons) * 1.5);
  const strategicScore = Math.min(11, strategicRankScore + idolScore);
  
  let total = placementScore + winScore + challengeScore + socialScore + strategicScore;
  
  // BONUSES
  if (seasons >= 3 && weightedPlacement <= 5) total += 6;
  else if (seasons >= 2 && weightedPlacement <= 3) total += 4;
  
  // ✅ IMPROVED IMPROVEMENT BONUSES
  if (improvement >= 15) total += 12;      // Massive redemption (was +5)
  else if (improvement >= 10) total += 8;  // Major improvement (was +5)
  else if (improvement >= 5) total += 4;   // Significant improvement (was +3)
  
  // ✅ FINALIST BONUSES - MORE GENEROUS
  const hasRunnerUp = details.some(s => s.placement === 2);
  const hasThirdPlace = details.some(s => s.placement === 3);
  
  if (hasRunnerUp && wins === 0) {
    total += 8;  // ✅ Increased from 4
    
    // ✅ REDEMPTION ARC SUPER BONUS
    if (improvement >= 15) {
      total += 8;  // Bottom to finals = incredible
    } else if (improvement >= 10) {
      total += 5;  // Major comeback
    }
  } else if (hasThirdPlace && wins === 0) {
    total += 6;  // ✅ Increased from 2
  }
  
  const finalistCount = details.filter(s => s.placement <= 3).length;
  if (finalistCount >= 2 && wins === 0) total += 4;
  
  if (votesAgainst === 0 && seasons >= 2) total += 6;
  if (challengePerSeason >= 5) total += 3;
  
  // Strategic mid-merge bonus
  if (weightedPlacement >= 4 && weightedPlacement <= 10 && avgStrategicRank >= 8) {
    total += 8;
  }
  
  // F5 idol play bonus
  if (weightedPlacement === 5 && idolsFound > 0) {
    total += 15;
  }
  
  // ✅ PENALTIES - TYPE SAFE
  const hasQuit = details.some((s) => {
    const notes = typeof s.notes === "string" ? s.notes :
                  Array.isArray(s.notes) ? s.notes.join(" ") : "";
    const status = typeof s.status === "string" ? s.status : "";
    return notes.toLowerCase().includes("quit") || 
           status.toLowerCase().includes("quit");
  });
  
  const isWinner = wins > 0;
  
  if (hasQuit) {
    if (isWinner) {
      total -= 3;  // ✅ Winners get lighter quit penalty (was -4)
    } else {
      total -= (weightedPlacement <= 5 ? 4 : 7);
    }
  }
  
  // ✅ ONE-SEASON CAP - ONLY FOR NON-FINALISTS
  if (seasons === 1 && wins === 0 && weightedPlacement > 3) {
    total = Math.min(total, 85);  // ✅ Cap doesn't apply to finalists
  }
  
  // ✅ WINNER PROTECTION - CRITICAL FIX
  if (isWinner) {
    const winRate = wins / seasons;
    if (winRate >= 0.5) {
      // 50%+ win rate (1/2, 2/3, etc.) = S+ minimum
      total = Math.max(total, 90);
    } else {
      // <50% win rate = S minimum
      total = Math.max(total, 82);
    }
  }
  
  return Math.round(Math.min(100, Math.max(0, total)) * 10) / 10;
}

function assignTier(score) {
  if (score >= 90) return "S+";  // 90-100: Elite Winners
  if (score >= 80) return "S";   // 80-89: Championship Caliber
  if (score >= 71) return "A";   // 71-79: Elite Threats
  if (score >= 61) return "B";   // 61-70: Above Average
  if (score >= 51) return "C";   // 51-60: Average
  return "D";                     // 0-50: Below Average
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
      input: JSON.stringify({ rankings: playersWithContext }, null, 2),
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
      overview: "Balanced scoring with winner protection and redemption arc bonuses",
      formula: "Placement(45) + Win(20) + Challenge(15) + Social(12) + Strategic(11) + Bonuses - Penalties",
      details: "Winners protected at 82+ (90+ for 50%+ win rate). Finalist bonuses: R-up +8, 3rd +6. Redemption arcs: 15+ improvement = +12 base + up to +8 for finalist."
    },
    tiers: {
      "S+": { scoreRange: [90, 100], description: "Elite Winners" },
      "S": { scoreRange: [80, 89], description: "Championship Caliber" },
      "A": { scoreRange: [71, 79], description: "Elite Threats" },
      "B": { scoreRange: [61, 70], description: "Above Average" },
      "C": { scoreRange: [51, 60], description: "Average" },
      "D": { scoreRange: [0, 50], description: "Below Average" },
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

  // ✅ GENERATE AI NARRATIVES FOR UPDATED PLAYERS
  if (recomputed.length > 0) {
    const playersWithContext = recomputed.map(ranking => {
      const player = allPlayers.find(p => safeLowerId(p.id || p.playerId) === ranking.playerId);
      
      return {
        playerId: ranking.playerId,
        name: player?.name || ranking.playerId,
        score: ranking.score,
        tier: ranking.tier,
        rank: 0,
        avgPlacement: ranking.avgPlacement,
        winRate: ranking.winRate,
        seasons: ranking.seasons,
        placements: ranking.placements,
        challengeWins: ranking.challengeWins,
        votesAgainst: ranking.votesAgainst,
        juryVotes: ranking.juryVotes,
        idolsFound: ranking.idolsFound,
        story: player?.story || "",
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

TITLE PATTERNS (2-4 words):
- Winners: "The Champion", "The Unbeaten"
- Finalists: "The Contender", "The Social Queen"
- Strategic: "The Schemer", "The Mastermind"
- Physical: "The Competitor", "The Beast"

EMOJI PATTERNS:
🏆 = Winner, 🥇 = Perfect winner, 👑 = Dominant, 🧠 = Strategic
💪 = Physical, 🥈 = Runner-up, 🥉 = Third place, 🏅 = Strong

REASONING (2-4 sentences):
- Reference specific moments from their story
- Mention alliances/rivalries
- Include placement and key stats
- Make it personal to their gameplay

STRENGTHS (2-4 items): Be specific
WEAKNESSES (1-3 items): Be honest

Return ONLY JSON.
`.trim();
    
    const payload = {
      model: "gpt-5",
      instructions,
      input: JSON.stringify({ rankings: playersWithContext }, null, 2),
      text: { format: { type: "json_schema", name: "rankings_narrative", strict: true, schema } },
    };
    
    const aiResp = await callOpenAI(payload, env);
    const aiJson = await aiResp.json().catch(() => null);
    
    if (aiJson?.rankings) {
      for (const aiRank of aiJson.rankings) {
        const original = recomputed.find(r => r.playerId === aiRank.playerId);
        if (original) {
          original.title = aiRank.title;
          original.emoji = aiRank.emoji;
          original.reasoning = aiRank.reasoning;
          original.strengths = aiRank.strengths;
          original.weaknesses = aiRank.weaknesses;
        }
      }
    }
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