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
    },
    required: [
      "narrativeSummary", "bestMove", "biggestRisk", "bootPredictions", "powerRankings",
      "allianceStability", "votingBlocs", "titles", "roles", "socialNetwork", "juryManagement",
      "threatBreakdown", "pathToVictory",
    ],
  };

  const instructions = `
You generate Survivor-style analytics for a Total Drama simulation with Redemption Island.

CRITICAL RULES:
1. Identify ALL players still in the game (including Redemption Island).
2. For bootPredictions, powerRankings, votingBlocs, titles, roles, socialNetwork, juryManagement, threatBreakdown, pathToVictory: Include relevant entries for active players.
3. If there are 18 total players (15 active + 3 on RI), ALL arrays must have 18 entries where applicable.

VOTING BLOCS (CRITICAL):
- Identify 2-4 active voting coalitions (temporary groups targeting specific players)
- Different from alliances: votingBlocs are TEMPORARY coalitions for specific votes, not permanent alliances
- Each bloc needs: name (descriptive), members (array of player names), strength (0-100), target (who they're voting for), notes (why they formed)
- Example: {"name": "Anti-Carrie Coalition", "members": ["Zoey", "Taylor", "Jasmine"], "strength": 70, "target": "Carrie", "notes": "Formed after merge to take out social threat"}
- If no clear voting blocs exist, create at least 1-2 based on the vote patterns in the summary

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
      // Extract key information from previous episode (adjust character limit as needed)
      // Recommended: 3000-5000 chars per episode to balance context vs token usage
      const CHAR_LIMIT = 3000; // 👈 CHANGE THIS NUMBER
      const snippet = (ep.transcript || '').substring(0, CHAR_LIMIT);
      previousContext += `--- Episode ${ep.episode} ---\n${snippet}\n...(truncated)\n\n`;
    });
    
    previousContext += '\n⚠️ CRITICAL: Maintain character consistency, ongoing relationships, alliance dynamics, and story arcs from these previous episodes.\n\n';
  }

  const instructions = `
You are writing a full episode transcript of a Total Drama season.

${previousContext}

CORE MISSION:
Transform the BrantSteele summary into a COMPLETE TV EPISODE like Disventure Camp Episodes 2-3.
Not a summary - a full dramatic script with character arcs, relationships, strategy, comedy, and emotion.

${previousContext ? '🔗 CONTINUITY IS CRITICAL: This is NOT a standalone episode. Reference and build upon events, relationships, alliances, and character development from previous episodes.' : ''}

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
DIALOGUE RULES
═══════════════════════════════════════════════════════════

**NATURAL SPEECH:**
✅ "Ugh, kids right?" 
✅ "Get outta town!"
✅ "Y'all just got lucky."
✅ "What the hell is that?"
✅ "Bitch, I'm a bartender!"

❌ "I concur with your assessment."
❌ "That is quite distressing."
❌ "I am experiencing discomfort."

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
STRATEGIC GAMEPLAY
═══════════════════════════════════════════════════════════

**ALLIANCE FORMATION:**
Show the actual conversation where they agree:
\`\`\`
Spencer: I think it's time we take over this team... and lock in a core 5.

Jade: Who were you thinking?

Spencer: Diego seems trustworthy. Tristan as well.

Jade: Tristan comes with two more since Zaid and Ivy are already tight with them.

Spencer: Hmm... Good point, partner.
\`\`\`

**VOTE SPLITTING:**
Show both sides campaigning:
\`\`\`
Hannah: Perfect! You have to vote with me and Amelie. We're taking out Spencer.

Benji: Why him?

Hannah: He lost us the challenge; plus, he's been throwing out my ally's name to everyone.
\`\`\`

**LAST-MINUTE FLIPS:**
\`\`\`
Lynda: [whispering to Isabel] Okay, girls, here's what I think we should do...

[unintelligible whispering]

Chris: What is this game of telephone going on here? [chuckles] I love it!
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