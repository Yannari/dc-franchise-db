/* ============================================
   PLAYER STORY FORMATTER - JAVASCRIPT
   Add this to your existing JavaScript
   ============================================ */

/**
 * Format a player story with beautiful styling
 * @param {string} storyText - Raw story text from players_database.json
 * @returns {string} Formatted HTML
 */
function formatPlayerStory(storyText) {
  if (!storyText) {
    return '<p style="color: #94a3b8; text-align: center; padding: 40px;">No story available</p>';
  }
  
  // Split by season sections (divided by ────────)
  const sections = storyText.split(/────────+/);
  
  let html = '';
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    // Extract season header (e.g., "SEASON 1 — Cullhouse")
    const headerMatch = trimmed.match(/^SEASON\s+(\d+)\s+—\s+(.+?)$/m);
    
    if (headerMatch) {
      const seasonNum = headerMatch[1];
      const seasonTheme = headerMatch[2];
      
      // Remove the header from the content
      const content = trimmed.replace(headerMatch[0], '').trim();
      
      // Split into paragraphs
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
      
      // Extract result from last paragraph
      let resultBadge = '';
      
      const lastPara = paragraphs[paragraphs.length - 1];
      if (lastPara) {
        // Check for result indicators
        if (lastPara.includes('won Season') || lastPara.match(/Result:.*win/i)) {
          resultBadge = '<span class="result-badge result-winner">🏆 Winner</span>';
        } else if (lastPara.match(/runner-up|2nd/i)) {
          resultBadge = '<span class="result-badge result-runnerup">🥈 Runner-Up</span>';
        } else if (lastPara.match(/eliminated|placed \d+th/i)) {
          const placement = lastPara.match(/(\d+)(?:st|nd|rd|th)/);
          if (placement) {
            resultBadge = `<span class="result-badge result-eliminated">Eliminated ${placement[0]}</span>`;
          }
        }
      }
      
      // Highlight stats (numbers + keywords)
      const formattedParagraphs = paragraphs.map(p => {
        let formatted = p
          // Highlight numbers followed by important keywords
          .replace(/(\d+)\s+(immunity wins?|challenge wins?|total wins?|votes?|idols?)/gi, 
            '<span class="stats-highlight">$1 $2</span>')
          // Highlight important game terms
          .replace(/(Final Tribal Council?|merge|finale|endgame|jury|fire-making)/gi, 
            '<span class="stats-highlight">$1</span>')
          // Highlight vote counts
          .replace(/(\d+)–(\d+)(?:–(\d+))?/g, 
            '<span class="stats-highlight">$1–$2' + (arguments[2] ? '–$3' : '') + '</span>');
        
        return `<p>${formatted}</p>`;
      }).join('');
      
      html += `
        <div class="season-section">
          <div class="season-header">
            <div class="season-number">Season ${seasonNum}</div>
            <div class="season-theme">${seasonTheme}</div>
          </div>
          <div class="season-body">
            ${formattedParagraphs}
            ${resultBadge}
          </div>
        </div>
      `;
    }
  }
  
  return html || '<p style="color: #94a3b8; text-align: center; padding: 40px;">Could not parse story</p>';
}

/**
 * Render player story in a container
 * Usage: renderPlayerStory('duncan', document.getElementById('storyContainer'))
 */
function renderPlayerStory(playerId, container) {
  // Load from players_database
  const db = loadPlayerDatabase(); // Your existing function
  const player = db.players.find(p => p.id === playerId);
  
  if (!player || !player.story) {
    container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">No story available for this player</p>';
    return;
  }
  
  const html = `
    <div class="player-story-container">
      <h2 class="player-story-header">
        📖 ${player.name}'s Story
      </h2>
      ${formatPlayerStory(player.story)}
    </div>
  `;
  
  container.innerHTML = html;
}

/* ============================================
   USAGE EXAMPLE
   ============================================
   
   In your player.html, find where you display the story and replace:
   
   <div id="playerStory">
     <!-- Old plain text story was here -->
   </div>
   
   With:
   
   <div id="playerStory"></div>
   
   <script>
   // When loading player data:
   renderPlayerStory('duncan', document.getElementById('playerStory'));
   </script>
   
   ============================================ */
