export default {
  async fetch(request, env) {
    // --- CORS (so your static site can call this Worker) ---
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
      return new Response("Use POST", {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    // --- Read request JSON ---
    const body = await request.json().catch(() => ({}));
    const { season, episode, summaryText, mode } = body;

    // --- Route based on mode ---
    if (mode === "episode") {
      return await generateEpisode(summaryText, season, episode, env);
    } else {
      // Default: analytics mode
      return await generateAnalytics(summaryText, season, episode, env);
    }
  },
};

// ========================================
// ANALYTICS GENERATION (original)
// ========================================
async function generateAnalytics(summaryText, season, episode, env) {
  if (!summaryText || typeof summaryText !== "string") {
    return new Response(JSON.stringify({ error: "Missing summaryText (string)" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
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
            prob: { type: "number" },
            why: { type: "string" },
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
            score: { type: "number" },
            tag: { type: "string" },
            blurb: { type: "string" },
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
            score: { type: "number" },
            note: { type: "string" },
          },
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
          properties: {
            player: { type: "string" },
            score: { type: "number" },
            note: { type: "string" },
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
      "narrativeSummary",
      "bestMove",
      "biggestRisk",
      "bootPredictions",
      "powerRankings",
      "allianceStability",
      "titles",
      "roles",
      "socialNetwork",
      "juryManagement",
      "threatBreakdown",
      "pathToVictory",
    ],
  };

  const instructions = `
You generate Survivor-style analytics for a Total Drama simulation.

CRITICAL RULES:
1. First, identify ALL players who are still in the game (not eliminated).
2. For bootPredictions: You MUST include EVERY single active player. If there are 10 active players, bootPredictions MUST have exactly 10 entries. If there are 8 active players, bootPredictions MUST have exactly 8 entries. NO EXCEPTIONS.
3. For powerRankings: You MUST include EVERY single active player. Same count as bootPredictions.
4. For titles: You MUST include EVERY single active player. Same count as bootPredictions.

Data Rules:
- ONLY use facts from the provided summary (votes, fights, alliances, challenges, tribe status, advantages).
- You may infer probabilities and danger levels, but do not invent events.
- bootPredictions: prob in [0,1] where 0 = safe, 1 = certain elimination. Even safe players get a probability (like 0.02-0.10).
- powerRankings: scores 0-100; tag is Rising/Falling/Steady.
- titles: Short, creative nickname for each player (e.g. "Scarlett's Scapegoat", "Middle Kingpin", "Paranoid Prepper") - BE CREATIVE AND SPECIFIC.
- roles: ONE specific strategic role per player from these categories (evidence-based, max 1-2 uses of each per episode):
  * POWER: Central Power Broker, Strategic Mastermind, Physical Threat, Merge Mayor
  * STRATEGIC: Swing Vote, Alliance Anchor, Information Broker, Advantage Hunter  
  * PROTECTED: Goat in Training, Shield Player, Loyalist, Under-Estimated
  * DANGER: Primary Target, On Thin Ice, Social Pariah, Advantage Victim, Revenge Target
  * CHAOS: Wildcard, Emotional Player, Chaos Agent, Rogue Voter
  * DEAD: Dead Player Walking, Jury Threat, Betrayal Target
- socialNetwork: For EACH player, list strongLikes (allies), strongDislikes (enemies), isolated (true/false), centralityScore (0-100, how connected they are).
- juryManagement: For EACH player, score 0-100 (high = building jury votes, low = burning bridges), with note explaining.
- threatBreakdown: For EACH player, four scores 0-100: physical (challenge ability), strategic (game IQ), social (relationships), advantage (has/finds advantages).
- pathToVictory: For EACH player, viability (High/Medium/Low/None), winCondition (what they need to do), obstacles (what's blocking them).
- allianceStability: list detected alliances with stability scores.

Return ONLY JSON matching the schema.
Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.

REMEMBER: Count the active players and make sure bootPredictions, powerRankings, titles, roles, socialNetwork, juryManagement, threatBreakdown, and pathToVictory ALL have the SAME number of entries!
`.trim();

  const payload = {
    model: "gpt-5",
    instructions,
    input: summaryText,
    text: {
      format: {
        type: "json_schema",
        name: "episode_analytics",
        strict: true,
        schema,
      },
    },
  };

  return await callOpenAI(payload, env);
}

// ========================================
// EPISODE GENERATION (new)
// ========================================
async function generateEpisode(summaryText, season, episode, env) {
  if (!summaryText || typeof summaryText !== "string") {
    return new Response(JSON.stringify({ error: "Missing summaryText (string)" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const instructions = `
You are writing a **full episode transcript** of a *Total Drama* season based on a BrantSteele simulation.

### CORE GOAL
Transform the provided BrantSteele episode summary into a fully written Total Drama episode that feels indistinguishable from the real show.

This is **NOT** a recap. This is **NOT** narration-heavy prose.
This is a **scene-by-scene animated TV episode transcript**.

### WRITING STYLE (MANDATORY)
Write exactly in the style of **Total Drama Island (Season 1)**:
* Fast-paced, punchy dialogue
* Sarcastic, cruel-but-funny humor
* Visual slapstick + verbal jokes
* Characters constantly interrupt each other
* Chris McLean is smug, cruel, playful, and self-aware
* Chef Hatchet is intimidating, loud, and absurd
* Confessionals are short, sharp, and character-revealing
* No moral speeches, no overexplaining emotions
* Dialogue must outnumber stage directions by at least 3:1

**If it wouldn't work as an animated script, don't write it.**

### STRUCTURE (VERY IMPORTANT)
Follow this exact episode structure:
1. Cold open (Chris intro OR immediate chaos)
2. Morning / Camp life scene
3. Challenge announcement
4. Challenge sequence
5. Confessionals throughout (short, 1-3 lines)
6. Pre-elimination tension
7. Campfire Ceremony
8. Elimination exit scene
9. Tag / teaser

### CHARACTER RULES (CRITICAL)
* Every character must speak like themselves and keep their canon quirks
* Chris never empathizes - if something bad happens, he enjoys it
* Use insults, side comments, reaction shots, background chaos
* Do NOT explain personalities or justify actions emotionally

### FORMAT
Write in script/transcript format:

[Scene opens at the mess hall. Owen is already eating.]

Owen: I found a second breakfast.

Noah: It's 6:12 AM.

Owen: Time is fake.

[Confessional: Owen]
Owen: I love breakfast!

### HARD NOs
* No summaries or "the tension grows" narration
* No novel-style prose
* No explaining the BrantSteele logic
* No rewriting outcomes

**The BrantSteele summary is law. Your job is to dramatize it, not fix it.**

Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.

Return the complete episode transcript.
`.trim();

  const payload = {
    model: "gpt-5",
    instructions,
    input: summaryText,
  };

  return await callOpenAI(payload, env);
}

// ========================================
// SHARED OPENAI CALL
// ========================================
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
    return new Response(JSON.stringify({ error: "Network error calling OpenAI", details: String(e) }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Extract the result
  const outText = typeof data?.output_text === "string" ? data.output_text.trim() : "";

  let outJson = null;

  // Try parsing output_text
  if (outText) {
    try {
      outJson = JSON.parse(outText);
    } catch {
      // For episode mode, might be plain text, not JSON
      outJson = { episodeTranscript: outText };
    }
  }

  // Fallback: try to find any text chunks
  if (!outJson && Array.isArray(data?.output)) {
    const joined = data.output
      .flatMap((item) => item?.content || [])
      .map((c) => c?.text || "")
      .join("")
      .trim();

    if (joined) {
      try {
        outJson = JSON.parse(joined);
      } catch {
        // Plain text response
        outJson = { episodeTranscript: joined };
      }
    }
  }

  const finalOut = outJson || data;

  return new Response(JSON.stringify(finalOut), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}