// ══════════════════════════════════════════════════════════════════════
// js/dr/data/smackdown-beats.js — the eliminated cast, back for one night
// ══════════════════════════════════════════════════════════════════════
//
// The engine built a full bracket — eight queens, three rounds, a song per
// duel, a champion and a title — and every scene carried `text: ''`. There was
// no screen either, so the episode arrived with nothing on it at all.
//
// A smackdown is not a maxi challenge with lip syncs bolted on. There is no
// runway, no panel, no critique and nobody goes home, because everybody here
// already went home once. It is a tournament, and the only currency in it is
// which queen wants it most on the night.
//
// `{a}` and `{b}` are the two queens in a duel; `{c}` is the song.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const SMACKDOWN_BEATS = [
  {
    id: 'smackdown-open', step: 'smackdown', speaker: 'host',
    note: 'Every queen sent home this season, back on the stage at once.',
    tiers: [tier('open', 'The bracket is announced.', [
      "They come back one at a time and the room gets louder with each of them. \"Welcome back,\" the host says, once they are all standing there — the early boots, the mid-season cuts, the one who left last week and has not stopped thinking about it. \"Tonight you are not competing for the crown. You are competing for each other.\" He explains the bracket. Somebody at the end of the line has already worked out who she wants.",
      "\"You all left this competition before you were ready to.\" The host lets that sit with a row of queens who each have a private opinion about exactly how unready they were. \"So tonight we settle it the only way this show knows how.\" A bracket goes up behind him. The screaming takes a while to stop.",
      "The stage fills with queens who have not stood on it since the night they were told to sashay. The host does not pretend this is about the crown. \"Nobody here is going back into the competition,\" he says. \"This is about who walks out of this season with something.\" It is, if anything, louder than a normal elimination.",
      "Every queen this season sent home, one bracket, one title. The host runs through it quickly because nobody in the room is listening — they are all looking at the names beside their own and doing the arithmetic on who they would rather face and who they absolutely would not.",
    ])],
  },
  {
    id: 'smackdown-duel', step: 'smackdown', speaker: 'narrator',
    note: 'One duel of the bracket. Tiered by how close it was.',
    tiers: [
      tier('blowout', 'One of them was never in it.', [
        "{a} against {b} to “{c}”, and it is over inside the first chorus. {a} takes the number and does not give any of it back — she is faster, she is bigger, and she is clearly been waiting weeks to do exactly this. {b} fights to the end of the song. It does not get close.",
        "It is not a fair fight and everybody can see it by the second verse. {a} knows every word of “{c}” and every beat under it, and {b} knows the chorus. The gap between those two things is the whole duel.",
        "{a} wins it standing still. There is a moment halfway through “{c}” where she simply stops and lets the lyric do the work, and the room comes up, and {b} — who is doing everything right and doing it well — has nowhere left to go.",
        "“{c}” suits {a} the way a song occasionally suits somebody completely. She does not have to reach for any of it. {b} is good. {b} is not this.",
      ]),
      tier('close', 'Two queens, and one of them had to lose.', [
        "{a} and {b} take “{c}” apart between them and it is the best thing either of them has done all season. Every time one of them lands something the other answers it. The host watches the whole thing with his hand over his mouth. When it ends the room does not immediately know who won, and neither, visibly, do they.",
        "This is the duel the bracket was hoping for. “{c}” gets performed twice at once, in two entirely different registers, and both of them work. {a} takes it by a margin nobody in the room could name out loud.",
        "Neither of them gives an inch. {b} goes for the floor early, {a} answers it, and from there it is a conversation rather than a fight — two queens raising each other for three minutes. {a} edges it. {b} is the first person to hug her.",
        "“{c}” is close enough that it comes down to the last eight bars, which is where {a} does the thing she has been saving. {b} sees it happen from four feet away and laughs, because there is nothing else to do about it.",
      ]),
      tier('upset', 'Nobody had her winning that.', [
        "Nobody had {a} beating {b} and {a} did not care. She takes “{c}” from the first note, commits to it harder than she committed to anything while she was still in the competition, and by the end the room is screaming for the queen who went home first. {b} takes it well and takes it hard.",
        "{b} was the favourite going into this one and it does not survive the first chorus. {a} arrives with something to prove and proves it — and the look on her face when the host calls her name is the look of somebody who has been carrying that for weeks.",
        "The upset of the bracket. {a} should not beat {b} on paper, and “{c}” is not even her kind of song, and she wins it anyway on pure want. Somebody in the back shouts her name three times before the host has said anything.",
        "This is the one people will talk about. {a} — out early, barely a track record, nothing to lose — takes “{c}” off {b} and looks genuinely startled to have done it. {b} says “that was deserved” and means it.",
      ]),
    ],
  },
  {
    id: 'smackdown-crown', step: 'smackdown', speaker: 'host',
    note: 'The champion of the bracket takes her title.',
    tiers: [tier('crown', 'A title of her own, and it is not the crown.', [
      "\"{a}.\" The host says it and the room already knew. \"You came back here and you beat every queen they put in front of you.\" She is handed her title and does not know what to do with her face. It is not the crown. It is not nothing either, and everybody on that stage understands the difference.",
      "{a} takes it, and the cast makes more noise for her than they made for anybody all night. \"I went home in week four,\" she says, when the host asks her how it feels. \"And tonight I beat every queen they put in front of me.\" That is the whole speech and it does not need another line.",
      "The title goes to {a}, who fought through the entire bracket and looks like somebody who has just been given back a thing she thought she had lost. She holds it up. The queens who lost to her tonight are the loudest people in the room.",
      "\"The winner of the smackdown — and I do not say this lightly — is {a}.\" She wins a title, a sum of money and a night that is entirely hers, on a stage she was sent away from weeks ago. Some queens get a crown. This one got the last word.",
    ])],
  },
];

export const SMACKDOWN_IDS = SMACKDOWN_BEATS.map(b => b.id);

/** Beats with a tier that has no lines written — the gap check. */
export function unwrittenSmackdownTiers() {
  const out = [];
  for (const b of SMACKDOWN_BEATS) {
    for (const t of b.tiers || []) if (!t.lines?.length) out.push(`${b.id}/${t.id}`);
  }
  return out;
}
