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
    } else {
      return await generateAnalytics(summaryText, season, episode, env);
    }
  },
};

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