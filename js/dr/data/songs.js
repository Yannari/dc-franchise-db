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
//   hook   breakdown | key-change | spoken | dance-break | none
//          The moment in the song where a performance is made or lost. The
//          narration builds its third beat out of this.
//
// `lipsync` outweighs everything above on every song. These tags decide who
// ELSE has a chance, never who is favoured.

export const SONGS = [
  { title: 'Emotion', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'fierce', hook: 'key-change' },
  { title: 'Cut to the Feeling', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'fierce', hook: 'key-change' },
  { title: 'Call Me Maybe', artist: 'Carly Rae Jepsen', tempo: 'uptempo', mood: 'funny', hook: 'none' },
  { title: 'Stronger', artist: 'Kelly Clarkson', tempo: 'uptempo', mood: 'rage', hook: 'breakdown' },
  { title: 'Since U Been Gone', artist: 'Kelly Clarkson', tempo: 'uptempo', mood: 'rage', hook: 'breakdown' },
  { title: 'Believe', artist: 'Cher', tempo: 'dance', mood: 'sad', hook: 'key-change' },
  { title: 'Toxic', artist: 'Britney Spears', tempo: 'dance', mood: 'sexy', hook: 'dance-break' },
  { title: 'Womanizer', artist: 'Britney Spears', tempo: 'dance', mood: 'fierce', hook: 'breakdown' },
  { title: 'Vogue', artist: 'Madonna', tempo: 'dance', mood: 'fierce', hook: 'spoken' },
  { title: 'Express Yourself', artist: 'Madonna', tempo: 'uptempo', mood: 'fierce', hook: 'none' },
  { title: 'Hung Up', artist: 'Madonna', tempo: 'dance', mood: 'sexy', hook: 'none' },
  { title: 'I Will Survive', artist: 'Gloria Gaynor', tempo: 'dance', mood: 'rage', hook: 'none' },
  { title: 'Total Eclipse of the Heart', artist: 'Bonnie Tyler', tempo: 'ballad', mood: 'sad', hook: 'breakdown' },
  { title: 'Without You', artist: 'Mariah Carey', tempo: 'ballad', mood: 'sad', hook: 'key-change' },
  { title: 'Emotions', artist: 'Mariah Carey', tempo: 'mid', mood: 'sexy', hook: 'key-change' },
  { title: 'Firework', artist: 'Katy Perry', tempo: 'mid', mood: 'fierce', hook: 'key-change' },
  { title: 'Roar', artist: 'Katy Perry', tempo: 'mid', mood: 'fierce', hook: 'none' },
  { title: 'Bad Romance', artist: 'Lady Gaga', tempo: 'dance', mood: 'fierce', hook: 'breakdown' },
  { title: 'Telephone', artist: 'Lady Gaga', tempo: 'dance', mood: 'funny', hook: 'spoken' },
  { title: 'Single Ladies', artist: 'Beyoncé', tempo: 'uptempo', mood: 'fierce', hook: 'dance-break' },
  { title: 'Halo', artist: 'Beyoncé', tempo: 'ballad', mood: 'sad', hook: 'key-change' },
  { title: 'Break My Soul', artist: 'Beyoncé', tempo: 'dance', mood: 'fierce', hook: 'breakdown' },
  { title: 'Umbrella', artist: 'Rihanna', tempo: 'mid', mood: 'sexy', hook: 'none' },
  { title: 'S&M', artist: 'Rihanna', tempo: 'dance', mood: 'sexy', hook: 'breakdown' },
  { title: 'Whip My Hair', artist: 'Willow', tempo: 'uptempo', mood: 'funny', hook: 'dance-break' },
  { title: 'Barbie Girl', artist: 'Aqua', tempo: 'dance', mood: 'funny', hook: 'spoken' },
  { title: 'Chandelier', artist: 'Sia', tempo: 'mid', mood: 'sad', hook: 'breakdown' },
  { title: 'Elastic Heart', artist: 'Sia', tempo: 'mid', mood: 'rage', hook: 'breakdown' },
  { title: 'Fighter', artist: 'Christina Aguilera', tempo: 'uptempo', mood: 'rage', hook: 'key-change' },
  { title: 'Beautiful', artist: 'Christina Aguilera', tempo: 'ballad', mood: 'sad', hook: 'none' },
  { title: 'Wrecking Ball', artist: 'Miley Cyrus', tempo: 'ballad', mood: 'sad', hook: 'breakdown' },
  { title: 'Party in the U.S.A.', artist: 'Miley Cyrus', tempo: 'uptempo', mood: 'funny', hook: 'none' },
  { title: 'Bang Bang', artist: 'Jessie J', tempo: 'uptempo', mood: 'fierce', hook: 'spoken' },
  { title: 'Love Shack', artist: 'The B-52s', tempo: 'uptempo', mood: 'funny', hook: 'spoken' },
  { title: 'Nasty', artist: 'Janet Jackson', tempo: 'dance', mood: 'fierce', hook: 'dance-break' },
  { title: 'Rhythm Nation', artist: 'Janet Jackson', tempo: 'dance', mood: 'fierce', hook: 'dance-break' },
  { title: 'Physical', artist: 'Olivia Newton-John', tempo: 'uptempo', mood: 'sexy', hook: 'dance-break' },
  { title: 'It’s Raining Men', artist: 'The Weather Girls', tempo: 'dance', mood: 'funny', hook: 'spoken' },
  { title: 'Proud Mary', artist: 'Tina Turner', tempo: 'mid', mood: 'rage', hook: 'dance-break' },
  { title: 'The Best', artist: 'Tina Turner', tempo: 'mid', mood: 'fierce', hook: 'key-change' },
  { title: 'I Have Nothing', artist: 'Whitney Houston', tempo: 'ballad', mood: 'sad', hook: 'key-change' },
  { title: 'So Emotional', artist: 'Whitney Houston', tempo: 'uptempo', mood: 'sexy', hook: 'none' },
];

export function songById(title) {
  return SONGS.find(s => s.title === title) || null;
}
