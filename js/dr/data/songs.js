// ══════════════════════════════════════════════════════════════════════
// dr/data/songs.js — the lip sync song bank
// ══════════════════════════════════════════════════════════════════════
//
// Real titles and artists, used as NAMES only — the user's call. Nothing here
// reproduces a lyric or a recording; a song is a set of tags the lip sync
// engine reads to decide what the performance asks of a queen.
//
//   tempo  ballad | mid | dance | uptempo
//          Decides how much `dance` matters. Dance always counts — you can
//          slay a ballad by knowing how to move — but an uptempo number
//          doubles its weight.
//   mood   sad | fierce | funny | sexy | rage
//          Decides the SECOND stat: acting carries a sad song, comedy a funny
//          one, and boldness the three that need attitude.
//   genre  what kind of record it is. Read by `lipsyncScore` for a small
//          style-fit edge — a pageant queen on a country ballad, a club kid on
//          hyperpop — worth much less than the craft terms above, on the same
//          principle as a runway category flattering a look. It is NOT a
//          decorative tag: a field nothing reads is a field that rots.
//   hook   breakdown | key-change | spoken | dance-break | none
//          The moment in the song where a performance is made or lost. The
//          narration builds its third beat out of this.
//
// `lipsync` outweighs everything above on every song. These tags decide who
// ELSE has a chance, never who is favoured.

export const SONGS = [
  { title: 'Emotion', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'fierce', genre: 'dance-pop', hook: 'key-change' },
  { title: 'Cut to the Feeling', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'fierce', genre: 'dance-pop', hook: 'key-change' },
  { title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'funny', genre: 'dance-pop', hook: 'none' },
  { title: 'Stronger', artist: 'Kelly Clarkson', tempo: 'uptempo', mood: 'rage', genre: 'pop', hook: 'breakdown' },
  { title: 'Since U Been Gone', artist: 'Kelly Clarkson', tempo: 'uptempo', mood: 'rage', genre: 'pop', hook: 'breakdown' },
  { title: 'Believe', artist: 'Cher', tempo: 'dance', mood: 'sad', genre: 'dance-pop', hook: 'key-change' },
  { title: 'Toxic', artist: 'Britney Spears', tempo: 'dance', mood: 'sexy', genre: 'dance-pop', hook: 'dance-break' },
  { title: 'Womanizer', artist: 'Britney Spears', tempo: 'dance', mood: 'fierce', genre: 'dance-pop', hook: 'breakdown' },
  { title: 'Vogue', artist: 'Madonna', tempo: 'dance', mood: 'fierce', genre: 'dance-pop', hook: 'spoken' },
  { title: 'Express Yourself', artist: 'Madonna', tempo: 'uptempo', mood: 'fierce', genre: 'dance-pop', hook: 'none' },
  { title: 'Hung Up', artist: 'Madonna', tempo: 'dance', mood: 'sexy', genre: 'dance-pop', hook: 'none' },
  { title: 'I Will Survive', artist: 'Gloria Gaynor', tempo: 'dance', mood: 'rage', genre: 'disco', hook: 'none' },
  { title: 'Total Eclipse of the Heart', artist: 'Bonnie Tyler', tempo: 'ballad', mood: 'sad', genre: 'rock', hook: 'breakdown' },
  { title: 'Without You', artist: 'Mariah Carey', tempo: 'ballad', mood: 'sad', genre: 'r&b', hook: 'key-change' },
  { title: 'Emotions', artist: 'Mariah Carey', tempo: 'mid', mood: 'sexy', genre: 'r&b', hook: 'key-change' },
  { title: 'Firework', artist: 'Katy Perry', tempo: 'mid', mood: 'fierce', genre: 'pop', hook: 'key-change' },
  { title: 'Roar', artist: 'Katy Perry', tempo: 'mid', mood: 'fierce', genre: 'pop', hook: 'none' },
  { title: 'Bad Romance', artist: 'Lady Gaga', tempo: 'dance', mood: 'fierce', genre: 'dance-pop', hook: 'breakdown' },
  { title: 'Telephone', artist: 'Lady Gaga', tempo: 'dance', mood: 'funny', genre: 'dance-pop', hook: 'spoken' },
  { title: 'Single Ladies', artist: 'Beyoncé', tempo: 'uptempo', mood: 'fierce', genre: 'r&b', hook: 'dance-break' },
  { title: 'Halo', artist: 'Beyoncé', tempo: 'ballad', mood: 'sad', genre: 'r&b', hook: 'key-change' },
  { title: 'Break My Soul', artist: 'Beyoncé', tempo: 'dance', mood: 'fierce', genre: 'r&b', hook: 'breakdown' },
  { title: 'Umbrella', artist: 'Rihanna', tempo: 'mid', mood: 'sexy', genre: 'pop', hook: 'none' },
  { title: 'S&M', artist: 'Rihanna', tempo: 'dance', mood: 'sexy', genre: 'pop', hook: 'breakdown' },
  { title: 'Whip My Hair', artist: 'Willow', tempo: 'uptempo', mood: 'funny', genre: 'pop', hook: 'dance-break' },
  { title: 'Barbie Girl', artist: 'Aqua', tempo: 'dance', mood: 'funny', genre: 'dance-pop', hook: 'spoken' },
  { title: 'Chandelier', artist: 'Sia', tempo: 'mid', mood: 'sad', genre: 'pop', hook: 'breakdown' },
  { title: 'Elastic Heart', artist: 'Sia', tempo: 'mid', mood: 'rage', genre: 'pop', hook: 'breakdown' },
  { title: 'Fighter', artist: 'Christina Aguilera', tempo: 'uptempo', mood: 'rage', genre: 'pop', hook: 'key-change' },
  { title: 'Beautiful', artist: 'Christina Aguilera', tempo: 'ballad', mood: 'sad', genre: 'pop', hook: 'none' },
  { title: 'Wrecking Ball', artist: 'Miley Cyrus', tempo: 'ballad', mood: 'sad', genre: 'pop', hook: 'breakdown' },
  { title: 'Party in the U.S.A.', artist: 'Miley Cyrus', tempo: 'uptempo', mood: 'funny', genre: 'pop', hook: 'none' },
  { title: 'Bang Bang', artist: 'Jessie J', tempo: 'uptempo', mood: 'fierce', genre: 'pop', hook: 'spoken' },
  { title: 'Love Shack', artist: 'The B-52s', tempo: 'uptempo', mood: 'funny', genre: 'rock', hook: 'spoken' },
  { title: 'Nasty', artist: 'Janet Jackson', tempo: 'dance', mood: 'fierce', genre: 'r&b', hook: 'dance-break' },
  { title: 'Rhythm Nation', artist: 'Janet Jackson', tempo: 'dance', mood: 'fierce', genre: 'r&b', hook: 'dance-break' },
  { title: 'Physical', artist: 'Olivia Newton-John', tempo: 'uptempo', mood: 'sexy', genre: 'pop', hook: 'dance-break' },
  { title: 'It’s Raining Men', artist: 'The Weather Girls', tempo: 'dance', mood: 'funny', genre: 'disco', hook: 'spoken' },
  { title: 'Proud Mary', artist: 'Tina Turner', tempo: 'mid', mood: 'rage', genre: 'rock', hook: 'dance-break' },
  { title: 'The Best', artist: 'Tina Turner', tempo: 'mid', mood: 'fierce', genre: 'rock', hook: 'key-change' },
  { title: 'I Have Nothing', artist: 'Whitney Houston', tempo: 'ballad', mood: 'sad', genre: 'r&b', hook: 'key-change' },
  { title: 'So Emotional', artist: 'Whitney Houston', tempo: 'uptempo', mood: 'sexy', genre: 'r&b', hook: 'none' },

  // ── WHAT THE SHOW PLAYS NOW ─────────────────────────────────────────
  { title: 'Drop Dead', artist: 'Olivia Rodrigo', tempo: 'uptempo', mood: 'rage', genre: 'rock', hook: 'breakdown' },
  { title: 'Good 4 U', artist: 'Olivia Rodrigo', tempo: 'uptempo', mood: 'rage', genre: 'rock', hook: 'breakdown' },
  { title: 'Vampire', artist: 'Olivia Rodrigo', tempo: 'ballad', mood: 'rage', genre: 'rock', hook: 'key-change' },
  { title: 'Gnarly', artist: 'KATSEYE', tempo: 'uptempo', mood: 'funny', genre: 'hyperpop', hook: 'spoken' },
  { title: 'Touch', artist: 'KATSEYE', tempo: 'dance', mood: 'sexy', genre: 'k-pop', hook: 'dance-break' },
  { title: 'Good Luck, Babe!', artist: 'Chappell Roan', tempo: 'mid', mood: 'sad', genre: 'pop', hook: 'key-change' },
  { title: 'HOT TO GO!', artist: 'Chappell Roan', tempo: 'uptempo', mood: 'funny', genre: 'pop', hook: 'dance-break' },
  { title: 'Pink Pony Club', artist: 'Chappell Roan', tempo: 'mid', mood: 'sad', genre: 'pop', hook: 'key-change' },
  { title: 'Espresso', artist: 'Sabrina Carpenter', tempo: 'mid', mood: 'sexy', genre: 'pop', hook: 'none' },
  { title: 'Please Please Please', artist: 'Sabrina Carpenter', tempo: 'mid', mood: 'funny', genre: 'pop', hook: 'spoken' },
  { title: 'Paint The Town Red', artist: 'Doja Cat', tempo: 'mid', mood: 'fierce', genre: 'hip-hop', hook: 'spoken' },
  { title: 'Woman', artist: 'Doja Cat', tempo: 'mid', mood: 'sexy', genre: 'r&b', hook: 'dance-break' },
  { title: '360', artist: 'Charli XCX', tempo: 'dance', mood: 'fierce', genre: 'hyperpop', hook: 'dance-break' },
  { title: 'Von Dutch', artist: 'Charli XCX', tempo: 'dance', mood: 'rage', genre: 'hyperpop', hook: 'breakdown' },
  { title: 'Padam Padam', artist: 'Kylie Minogue', tempo: 'dance', mood: 'sexy', genre: 'dance-pop', hook: 'dance-break' },
  // 'Murder On The Dancefloor' belonged here and cannot stay: the readout
  // prints song titles, and "murder" is a word The Traitors owns, so the
  // shared vocabulary guard rejects any episode that names it. Four shows
  // depend on that guard being strict, so the title goes rather than the
  // guard. Do not re-add it.
  { title: 'Take Me Home', artist: 'Sophie Ellis-Bextor', tempo: 'dance', mood: 'fierce', genre: 'dance-pop', hook: 'none' },
  { title: 'Texas Hold Em', artist: 'Beyonce', tempo: 'mid', mood: 'funny', genre: 'r&b', hook: 'spoken' },
  { title: 'Cuff It', artist: 'Beyonce', tempo: 'mid', mood: 'sexy', genre: 'r&b', hook: 'dance-break' },

  // ── COUNTRY, WHICH THE SHOW USES MORE THAN PEOPLE EXPECT ────────────
  { title: 'Jolene', artist: 'Dolly Parton', tempo: 'mid', mood: 'sad', genre: 'country', hook: 'none' },
  { title: '9 to 5', artist: 'Dolly Parton', tempo: 'uptempo', mood: 'funny', genre: 'country', hook: 'spoken' },
  { title: 'I Will Always Love You', artist: 'Dolly Parton', tempo: 'ballad', mood: 'sad', genre: 'country', hook: 'key-change' },
  { title: 'Fancy', artist: 'Reba McEntire', tempo: 'mid', mood: 'fierce', genre: 'country', hook: 'spoken' },
  { title: 'Before He Cheats', artist: 'Carrie Underwood', tempo: 'mid', mood: 'rage', genre: 'country', hook: 'breakdown' },
  { title: 'Any Man of Mine', artist: 'Shania Twain', tempo: 'uptempo', mood: 'funny', genre: 'country', hook: 'spoken' },
  { title: 'Follow Your Arrow', artist: 'Kacey Musgraves', tempo: 'mid', mood: 'funny', genre: 'country', hook: 'none' },

  // ── BALLADS, WHICH WERE THE THINNEST SHELF ──────────────────────────
  { title: 'The Show Must Go On', artist: 'Queen', tempo: 'ballad', mood: 'rage', genre: 'rock', hook: 'key-change' },
  { title: 'Someone Like You', artist: 'Adele', tempo: 'ballad', mood: 'sad', genre: 'pop', hook: 'key-change' },
  { title: 'Rolling in the Deep', artist: 'Adele', tempo: 'mid', mood: 'rage', genre: 'soul', hook: 'breakdown' },
  { title: 'Crazy', artist: 'Patsy Cline', tempo: 'ballad', mood: 'sad', genre: 'country', hook: 'none' },
  { title: 'At Last', artist: 'Etta James', tempo: 'ballad', mood: 'sad', genre: 'soul', hook: 'none' },
  { title: 'Feeling Good', artist: 'Nina Simone', tempo: 'ballad', mood: 'fierce', genre: 'soul', hook: 'key-change' },
  { title: "Don't Rain on My Parade", artist: 'Barbra Streisand', tempo: 'ballad', mood: 'fierce', genre: 'musical', hook: 'key-change' },
  { title: 'Defying Gravity', artist: 'Idina Menzel', tempo: 'ballad', mood: 'fierce', genre: 'musical', hook: 'key-change' },
  { title: 'Cabaret', artist: 'Liza Minnelli', tempo: 'mid', mood: 'funny', genre: 'musical', hook: 'spoken' },
  { title: 'All That Jazz', artist: 'Catherine Zeta-Jones', tempo: 'mid', mood: 'sexy', genre: 'musical', hook: 'dance-break' },
  { title: 'Nothing Compares 2 U', artist: "Sinead O'Connor", tempo: 'ballad', mood: 'sad', genre: 'pop', hook: 'none' },
  { title: 'Piece of My Heart', artist: 'Janis Joplin', tempo: 'ballad', mood: 'rage', genre: 'rock', hook: 'breakdown' },

  // ── THE DISCO AND SOUL SPINE ────────────────────────────────────────
  { title: 'Last Dance', artist: 'Donna Summer', tempo: 'dance', mood: 'fierce', genre: 'disco', hook: 'key-change' },
  { title: 'Hot Stuff', artist: 'Donna Summer', tempo: 'dance', mood: 'sexy', genre: 'disco', hook: 'breakdown' },
  { title: 'MacArthur Park', artist: 'Donna Summer', tempo: 'ballad', mood: 'sad', genre: 'disco', hook: 'key-change' },
  { title: "I'm Coming Out", artist: 'Diana Ross', tempo: 'dance', mood: 'fierce', genre: 'disco', hook: 'none' },
  { title: 'Love Hangover', artist: 'Diana Ross', tempo: 'mid', mood: 'sexy', genre: 'disco', hook: 'breakdown' },
  { title: 'Lady Marmalade', artist: 'LaBelle', tempo: 'dance', mood: 'sexy', genre: 'soul', hook: 'spoken' },
  { title: 'New Attitude', artist: 'Patti LaBelle', tempo: 'uptempo', mood: 'fierce', genre: 'soul', hook: 'none' },
  { title: 'Le Freak', artist: 'Chic', tempo: 'dance', mood: 'funny', genre: 'disco', hook: 'dance-break' },
  { title: 'Turn the Beat Around', artist: 'Gloria Estefan', tempo: 'dance', mood: 'fierce', genre: 'latin', hook: 'dance-break' },
  { title: 'Conga', artist: 'Gloria Estefan', tempo: 'dance', mood: 'funny', genre: 'latin', hook: 'dance-break' },
  { title: 'This Will Be', artist: 'Natalie Cole', tempo: 'uptempo', mood: 'funny', genre: 'soul', hook: 'none' },
  { title: 'Best of My Love', artist: 'The Emotions', tempo: 'uptempo', mood: 'funny', genre: 'soul', hook: 'none' },

  // ── THE EIGHTIES AND NINETIES ───────────────────────────────────────
  { title: 'Heart of Glass', artist: 'Blondie', tempo: 'dance', mood: 'sexy', genre: 'rock', hook: 'none' },
  { title: 'Call Me', artist: 'Blondie', tempo: 'uptempo', mood: 'fierce', genre: 'rock', hook: 'breakdown' },
  { title: 'Holding Out for a Hero', artist: 'Bonnie Tyler', tempo: 'uptempo', mood: 'rage', genre: 'rock', hook: 'key-change' },
  { title: 'Black Velvet', artist: 'Alannah Myles', tempo: 'mid', mood: 'sexy', genre: 'rock', hook: 'breakdown' },
  { title: 'Cold Hearted', artist: 'Paula Abdul', tempo: 'dance', mood: 'sexy', genre: 'dance-pop', hook: 'dance-break' },
  { title: 'Straight Up', artist: 'Paula Abdul', tempo: 'uptempo', mood: 'rage', genre: 'dance-pop', hook: 'breakdown' },
  { title: 'Free Your Mind', artist: 'En Vogue', tempo: 'uptempo', mood: 'rage', genre: 'r&b', hook: 'breakdown' },
  { title: "Don't Let Go (Love)", artist: 'En Vogue', tempo: 'mid', mood: 'sad', genre: 'r&b', hook: 'key-change' },
  { title: 'Show Me Love', artist: 'Robin S', tempo: 'dance', mood: 'fierce', genre: 'house', hook: 'breakdown' },
  { title: 'Finally', artist: 'CeCe Peniston', tempo: 'dance', mood: 'funny', genre: 'house', hook: 'dance-break' },
  { title: 'Gypsy Woman', artist: 'Crystal Waters', tempo: 'dance', mood: 'funny', genre: 'house', hook: 'none' },
  { title: 'Groove Is in the Heart', artist: 'Deee-Lite', tempo: 'dance', mood: 'funny', genre: 'house', hook: 'dance-break' },
  { title: "Freedom! '90", artist: 'George Michael', tempo: 'mid', mood: 'fierce', genre: 'pop', hook: 'key-change' },
  { title: 'Music', artist: 'Madonna', tempo: 'dance', mood: 'sexy', genre: 'dance-pop', hook: 'dance-break' },
  { title: 'Man! I Feel Like a Woman!', artist: 'Shania Twain', tempo: 'uptempo', mood: 'funny', genre: 'country', hook: 'spoken' },
  { title: 'Bootylicious', artist: "Destiny's Child", tempo: 'mid', mood: 'sexy', genre: 'r&b', hook: 'dance-break' },
  { title: 'Survivor', artist: "Destiny's Child", tempo: 'mid', mood: 'rage', genre: 'r&b', hook: 'breakdown' },
  { title: "It's Not Right but It's Okay", artist: 'Whitney Houston', tempo: 'mid', mood: 'rage', genre: 'r&b', hook: 'breakdown' },
  { title: "I'm Every Woman", artist: 'Whitney Houston', tempo: 'uptempo', mood: 'fierce', genre: 'r&b', hook: 'key-change' },
  { title: 'Greatest Love of All', artist: 'Whitney Houston', tempo: 'ballad', mood: 'sad', genre: 'r&b', hook: 'key-change' },
  { title: 'And I Am Telling You', artist: 'Jennifer Holliday', tempo: 'ballad', mood: 'rage', genre: 'musical', hook: 'spoken' },

  // ── THE HOUSE'S OWN ─────────────────────────────────────────────────
  { title: 'Supermodel (You Better Work)', artist: 'RuPaul', tempo: 'dance', mood: 'funny', genre: 'dance-pop', hook: 'spoken' },
  { title: 'Cover Girl', artist: 'RuPaul', tempo: 'dance', mood: 'fierce', genre: 'dance-pop', hook: 'dance-break' },
  { title: 'Sissy That Walk', artist: 'RuPaul', tempo: 'dance', mood: 'fierce', genre: 'dance-pop', hook: 'breakdown' },
  { title: 'The Beginning', artist: 'RuPaul', tempo: 'mid', mood: 'sad', genre: 'dance-pop', hook: 'key-change' },

  // ── MORE OF THE MODERN SHELF ────────────────────────────────────────
  { title: 'The Edge of Glory', artist: 'Lady Gaga', tempo: 'uptempo', mood: 'sad', genre: 'dance-pop', hook: 'key-change' },
  { title: 'Rain on Me', artist: 'Lady Gaga', tempo: 'dance', mood: 'sad', genre: 'dance-pop', hook: 'dance-break' },
  { title: 'Diamonds', artist: 'Rihanna', tempo: 'ballad', mood: 'sad', genre: 'pop', hook: 'none' },
  { title: 'Only Girl (In the World)', artist: 'Rihanna', tempo: 'dance', mood: 'sexy', genre: 'pop', hook: 'breakdown' },
  { title: 'Confident', artist: 'Demi Lovato', tempo: 'uptempo', mood: 'rage', genre: 'pop', hook: 'breakdown' },
  { title: "Let's Have a Kiki", artist: 'Scissor Sisters', tempo: 'dance', mood: 'funny', genre: 'dance-pop', hook: 'spoken' },
  { title: 'Stupid Girls', artist: 'Pink', tempo: 'mid', mood: 'funny', genre: 'rock', hook: 'spoken' },
  { title: 'Jump', artist: 'The Pointer Sisters', tempo: 'uptempo', mood: 'sexy', genre: 'soul', hook: 'dance-break' },
  { title: 'Point of No Return', artist: 'Expose', tempo: 'dance', mood: 'sad', genre: 'freestyle', hook: 'breakdown' },
  { title: 'Fascinated', artist: 'Company B', tempo: 'dance', mood: 'sexy', genre: 'freestyle', hook: 'dance-break' },
  { title: 'Livin la Vida Loca', artist: 'Ricky Martin', tempo: 'uptempo', mood: 'sexy', genre: 'latin', hook: 'dance-break' },
  { title: 'Malambo No. 1', artist: 'Yma Sumac', tempo: 'dance', mood: 'rage', genre: 'latin', hook: 'dance-break' },
  { title: 'Dancing on My Own', artist: 'Robyn', tempo: 'mid', mood: 'sad', genre: 'dance-pop', hook: 'breakdown' },
  { title: 'No More Lies', artist: "Michel'le", tempo: 'ballad', mood: 'rage', genre: 'r&b', hook: 'spoken' },
  { title: 'Two of Hearts', artist: 'Stacey Q', tempo: 'dance', mood: 'funny', genre: 'freestyle', hook: 'none' },
];

export function songById(title) {
  return SONGS.find(s => s.title === title) || null;
}
