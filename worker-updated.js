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
    },
    required: [
      "narrativeSummary",
      "bestMove",
      "biggestRisk",
      "bootPredictions",
      "powerRankings",
      "allianceStability",
      "titles",
    ],
  };

  const instructions = `
You generate Survivor-style analytics for a Total Drama simulation.
Rules:
- ONLY use facts from the provided summary (votes, fights, alliances, challenges, tribe status, advantages).
- You may infer probabilities and danger levels, but do not invent events.
- bootPredictions: list 3-5 players max; prob in [0,1].
- powerRankings: 0-100 with grounded blurbs; tag is Rising/Falling/Steady.
- titles: short nickname that fits their current portrayal.
Return ONLY JSON matching the schema.
Season: ${season ?? "?"}, Episode: ${episode ?? "?"}.
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
