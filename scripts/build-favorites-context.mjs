import fs from 'node:fs';

const ORDER = ['bowie','mike','millie','thom','grett','gabby','james','lake','yul','natalia','julia','dj'];
const GUIDANCE = {
  bowie:{ties:'Millie: S9 ally/finalist opponent. Julia: S9 strategic rival; Bowie stole her idol.',hook:'Julia rematch—can respect delay a necessary strike? Millie—does he treat her as a finalist equal?'},
  mike:{ties:'No established simulator tie. Likely affinity with DJ is interpretation only.',hook:'Can Mike play a complete independent game, and will two caretakers with DJ ever make the hard call?'},
  millie:{ties:'Bowie: S9 ally and finalist opponent. Julia: S9 alliance with unsafe strategic attraction.',hook:'Who authored the S9 endgame with Bowie, and can she observe Julia without becoming useful to her?'},
  thom:{ties:'Gabby: S11 rescue bond. Grett: S11 rival he helped eliminate.',hook:'Can he trust Gabby as an equal, and judge Grett’s present actions instead of retrying S11?'},
  grett:{ties:'Thom: S11 rival. Gabby: S11 twist-linked path plus complicated source-canon history.',hook:'Can she hold power without detonating bridges, especially with Gabby and Thom watching for old patterns?'},
  gabby:{ties:'Thom: S11 rescue bond. Grett: S11/source-canon complexity.',hook:'Will Thom stop treating her as someone to save, and can Gabby support Grett without becoming her weapon?'},
  james:{ties:'Lake: S12 alliance-network overlap. Yul: S12 and source-canon rival.',hook:'Does he admit Lake stabilized his winner route, and expose Yul now or keep him as predictable cover?'},
  lake:{ties:'James: S12 alliance ecosystem. Yul: S12 moral opponent.',hook:'Can loyalty include self-interest when James asks for another favor or Yul tries to dictate her reaction?'},
  yul:{ties:'James and Lake: S12 rivals. Grett: source-canon former partner; no shared simulator season.',hook:'Grett accountability—target, fake reform, or collapse? James is the successful authenticity comparison he hates.'},
  natalia:{ties:'No shared simulator tie. Source canon establishes familiarity with Gabby and Tom/Thom.',hook:'Can she build a stable core with Gabby and turn warmth with Thom into proof at a real vote?'},
  julia:{ties:'Bowie: S9 strategic rival. Millie: S9 ally.',hook:'Who strikes first in the Bowie rematch, and can Julia learn jury management from Millie without condescension?'},
  dj:{ties:'No established simulator tie. Likely care affinity with Mike is interpretation only.',hook:'Who makes the hard call with Mike, and can DJ join Bowie without ignoring what the structure will demand?'},
};

const roster = JSON.parse(fs.readFileSync('franchise_roster.json','utf8')).players;
const history = JSON.parse(fs.readFileSync('data/continuity/fans-vs-favorites-favorites-history.json','utf8')).players;
const cast = ORDER.map(slug => {
  const profile = roster.find(player => player.slug === slug);
  const archive = history[slug];
  if (!profile || !archive) throw new Error(`Missing Favorites data for ${slug}`);
  const placements = archive.appearances.map(a => `Season ${a.season}: ${a.placement} (${a.status})`).join('; ');
  const signature = archive.appearances.map(a => a.keyMoments?.[0]).filter(Boolean).join(' / ');
  const guide = GUIDANCE[slug];
  const context = [
    `${profile.name}${slug === 'thom' ? ' (Tom canon identity)' : ''}. Source voice: ${profile.voice}`,
    `Archetype: ${profile.archetype}. Behavioral baseline: ${profile.personality.split(/(?<=[.!?])\s+/).slice(0,2).join(' ')}`,
    `Placement history: ${placements}.`,
    signature ? `Archive anchors: ${signature}` : '',
    `Favorite ties: ${guide.ties}`,
    `Open hook: ${guide.hook}`,
  ].filter(Boolean).join(' ');
  if (context.length > 1200) throw new Error(`${slug} context is ${context.length} characters`);
  return { slug, name: profile.name, context };
});
const output = {
  schemaVersion: 1,
  season: { title:'Fans vs Favorites', format:'total-drama', tribeTheme:'Favorites', castSize:24, favorites:12, fans:12 },
  cast,
  franchiseContext: 'Source canon defines voice and behavioral boundaries. Archived simulator seasons define deeds and relationships. Do not invent shared history for unlinked pairs. Thom uses Tom canon characterization and only Thom Seasons 11/13 continuity. Total Drama vocabulary applies: contestants are voted out, never evicted or nominated.',
};
fs.writeFileSync('data/continuity/fans-vs-favorites-favorites-context.json', JSON.stringify(output,null,2)+'\n');
console.log(`Built ${cast.length} Favorites context blocks (${Math.max(...cast.map(x=>x.context.length))} chars max).`);