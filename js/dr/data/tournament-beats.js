// ══════════════════════════════════════════════════════════════════════
// js/dr/data/tournament-beats.js — a losers-bracket lip sync tournament
// ══════════════════════════════════════════════════════════════════════
//
// The LaLaPaRuZa — everybody lip syncs in Round 1, the losers face each
// other in Round 2, and the last loser standing goes to sudden death.
// Somebody goes HOME tonight, and fatigue is the mechanic that makes it
// dramatic: a queen on her third song is performing at 78% and everybody
// in the room can see it.
//
// `{a}` = winner, `{b}` = loser, `{c}` = song title. No names.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const TOURNAMENT_BEATS = [
  {
    id: 'tournament-open', step: 'maxi-main', speaker: 'host',
    note: 'The bracket is announced. Everybody lip syncs tonight.',
    tiers: [tier('open', 'The format is explained and the room gets loud.', [
      "\"Tonight,\" the host says, \"every one of you will lip sync.\" He lets the panic settle before he draws the bracket. Round 1: everybody pairs up. Winners sit safe. Losers face each other in Round 2. And whoever is still losing after that — sudden death. \"One of you,\" he says, looking down the line, \"is going home tonight, and the bracket will decide who.\"",
      "The bracket goes up and nobody pretends to be calm about it. Every queen in the room is looking at the name beside her own and doing private arithmetic about who she would rather face and who she absolutely would not. \"This is a lip sync tournament,\" the host says. \"Win your round and sit safe. Lose it, and you lip sync again — tired.\" Somebody at the end of the line has already started stretching.",
      "\"Welcome to the LaLaPaRuZa.\" The host does not explain what the word means because the bracket behind him is already doing that. Everybody pairs up. The losers pair up again. And the last queen still losing — the one who has now lip synced three times in a row on legs that stopped cooperating after the second — goes home. \"Fatigue is part of the format,\" he says. \"So is surviving it.\"",
      "He draws the bracket and walks through it once. Some of them are nodding. Some of them are looking at the ceiling. \"Every one of you will lip sync tonight,\" the host says. \"Some of you will lip sync once and sit safe. Some of you will lip sync until your body tells you to stop. And one of you will not be here tomorrow.\" The music hits and the first pair is called to the stage.",
    ])],
  },
  {
    id: 'tournament-duel', step: 'maxi-main', speaker: 'narrator',
    note: 'One duel of the bracket. Tiered by gap.',
    tiers: [
      tier('blowout', 'One queen took the song and the other watched.', [
        "{a} against {b} to “{c}”, and it is not close. {a} is sharper, hungrier, more certain of every word, and by the second verse {b} is performing for the room rather than against anybody. The host watches it with the expression of a man who has already made up his mind.",
        "It is over inside the first chorus. {a} takes “{c}” and does not give any of it back — every beat is hers, every transition is clean, and {b} is fighting a fight that ended before she knew it had started. When the music stops the room knows.",
        "“{c}” suits {a} the way a song occasionally suits somebody completely. She does not reach for any of it. {b} gives everything she has and it is not the same weight class. The gap between wanting it and having it is the whole duel.",
        "{a} wins it standing still. There is a moment halfway through “{c}” where she simply stops moving and lets the lyric land, and the room comes up, and {b} — who is doing everything right — has nowhere left to go. Some duels are a conversation. This one was a statement.",
      ]),
      tier('close', 'Two queens and one of them had to lose.', [
        "{a} and {b} take “{c}” apart between them and it is the best either has done all season. Every time one lands something the other answers it. The host watches the whole thing with his hand against his chin. When the song ends nobody is sure, and both of them know it.",
        "Neither gives an inch. {b} goes for the floor, {a} answers it with the chorus, and from there it is a conversation — two queens raising each other for three minutes straight. {a} edges it by something neither of them could name. The room screams for both.",
        "This is the duel the bracket was built for. “{c}” gets performed twice at once in two different registers and both of them work. {a} takes it. {b} is the first person to hug her.",
        "“{c}” comes down to the final eight bars, which is where {a} finds the thing she has been saving. {b} sees it happen from four feet away and shakes her head, because there is nothing else to do when somebody pulls that out of nowhere.",
      ]),
      tier('upset', 'The favourite lost and nobody saw it coming.', [
        "Nobody had {a} beating {b} and {a} did not care. She takes “{c}” from the first note, commits to it harder than she has committed to anything on this stage, and by the end the room is screaming for the queen nobody expected to survive this round. {b} takes it well. She takes it hard.",
        "{b} was the favourite and it does not survive the first chorus. {a} arrives with something to prove and proves it, and the look on her face when the host says her name is somebody who has been carrying that weight for weeks and just set it down.",
        "The upset of the night. {a} should not beat {b} on paper — the track record says so, the odds said so, and “{c}” is not even her kind of song. She wins it anyway on pure want. Somebody in the back row shouts her name three times.",
        "This is the one people will talk about. {a} takes “{c}” off {b} and looks genuinely startled to have done it. The room goes up. {b} says “that was deserved” into the noise and means every word of it.",
      ]),
    ],
  },
  {
    id: 'tournament-r1-split', step: 'maxi-main', speaker: 'host',
    note: 'After Round 1: winners are safe, losers pair up for Round 2.',
    tiers: [tier('split', 'The bracket forks. One side sits. The other fights again.', [
      "\"If I called your name — you are safe.\" The Round 1 winners step to one side of the stage and the relief is visible on every one of them. The losers stay where they are. \"The rest of you,\" the host says, \"will lip sync again. Right now.\" Nobody was expecting to rest. Nobody is going to get to.",
      "The host reads the Round 1 results and splits the stage in half. The winners get to breathe. The losers get a new bracket and a new opponent. \"You just lip synced,\" the host says. \"And now you are going to lip sync again, against somebody who just lip synced. Fatigue is real. The question is whose legs give out first.\"",
      "\"Round 1 is over.\" The host looks at the winners and nods them safe. Then he turns to the rest. \"You lost. That does not mean you go home — it means you lip sync again. Tired. Against somebody else who is also tired.\" He draws the Round 2 bracket and the room goes quiet in a way it was not quiet before.",
      "The Round 1 winners exhale. The Round 1 losers watch them do it. \"You are not out,\" the host tells the losers. \"Not yet. But you are about to lip sync for a second time tonight, and I promise you — the songs do not get easier.\" The new bracket goes up. The losing side of the stage looks at it and does not say anything.",
    ])],
  },
  {
    id: 'tournament-r2-split', step: 'maxi-main', speaker: 'host',
    note: 'After Round 2: survivors sit (LOW), losers go to sudden death.',
    tiers: [tier('split', 'The last losers face sudden death.', [
      "\"If you won Round 2 — step to the side.\" They do, on legs that are visibly not what they were at the start of the night. \"You are safe. Barely. But safe.\" The host turns to the queens still standing in the middle of the stage. \"You have now lost two lip syncs tonight. The next one is sudden death, and the loser goes home.\"",
      "The Round 2 survivors are safe and they know it and they do not look happy about it — they look like people who just ran two sprints and are being told they do not have to run a third. The queens left standing have a different expression entirely. \"Sudden death,\" the host says. \"One more lip sync. The loser of this one sashays away.\"",
      "Two rounds in and the stage has sorted itself. The safe queens are catching their breath on one side. The queens still fighting are on the other, and you can see the fatigue on both of them — the slower breathing, the hands on their knees between songs. \"One more,\" the host says. \"And this one counts.\"",
      "The host splits them for the last time. The Round 2 winners sit. They are not celebrating. The queens who are left look at each other and know exactly what is coming. \"You have lip synced twice tonight,\" the host says. \"The next song is your last chance. The loser of this lip sync will sashay away.\"",
    ])],
  },
  {
    id: 'tournament-sudden-death', step: 'maxi-main', speaker: 'narrator',
    note: 'The final lip sync — the loser is eliminated. Fatigue is the story.',
    tiers: [tier('death', 'Two queens on their last legs. One song left.', [
      "They are both exhausted. The songs before this one took something from each of them and everybody in the room can see exactly how much. “{c}” starts and {a} finds something from somewhere — not the sharpness of the first round but something harder and more desperate — and {b}, who has nothing left to give, gives it anyway. It is not enough. Not tonight.",
      "This is not the same {a} who opened the night and it is not the same {b} either. Two lip syncs will do that. “{c}” is their third song and their legs know it. {a} performs through the fatigue the way you perform through anything — by ignoring it and paying for it later. {b} performs through it by slowing down, and on this stage, slowing down is how you lose.",
      "The sudden death round, and both of them are running on fumes. {a} finds something in the second verse — a reserve nobody including her expected — and the room comes up for it. {b} fights to the end of the song. On a fresh stage it might have been enough. After two lip syncs, nothing is fresh.",
      "Three songs in one night. Nobody designed this format to be kind and it is not. {a} and {b} take the stage for “{c}” and both of them are visibly working harder for less. {a} gets there. {b} gets close. The difference between those two things is everything, and the host knows it before the music stops.",
    ])],
  },
  {
    id: 'tournament-elim', step: 'maxi-main', speaker: 'host',
    note: 'The eliminated queen. Mirror message, sashay, reaction.',
    tiers: [tier('elim', 'The tournament sent her home.', [
      "\"{b}.\" The host says it and {b} already knows. \"You fought through this entire bracket, and I need you to know — that took something.\" She nods. She does not cry. She walks to the back of the stage, writes her mirror message in lipstick that her hand is too tired to keep steady, and when the door closes behind her the room is quieter than it has been all night.",
      "The host calls {b}'s name and {b} closes her eyes for one beat before she opens them. \"You lip synced three times tonight,\" he says. \"And you left everything on this stage.\" She did. That is the problem — she left it and somebody else left more. Her mirror message is short. The lipstick is shaking. The cast watches her walk to the door.",
      "\"{b} — you gave us three lip syncs and every one of them was worth watching.\" The host pauses. \"But tonight, you must sashay away.\" She takes the walk to the mirror slowly, writes something the cast will read when she is gone, and turns back for one last look at the stage. The door closes. The room does not move.",
      "\"Tonight was a tournament,\" the host says, \"and {b}, the tournament has spoken.\" She nods. There is nothing to argue with — the bracket decided it, three songs decided it, and the fatigue she could not outrun decided it. She writes her mirror message. She hugs the queens nearest the door. She leaves the way everybody leaves this show — through a door that does not open again.",
    ])],
  },
];

export const TOURNAMENT_IDS = TOURNAMENT_BEATS.map(b => b.id);

export function unwrittenTournamentTiers() {
  const out = [];
  for (const b of TOURNAMENT_BEATS) {
    for (const t of b.tiers || []) if (!t.lines?.length) out.push(`${b.id}/${t.id}`);
  }
  return out;
}
