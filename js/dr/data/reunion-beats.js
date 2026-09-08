// ══════════════════════════════════════════════════════════════════════
// js/dr/data/reunion-beats.js — the season, argued about
// ══════════════════════════════════════════════════════════════════════
//
// One pool per TOPIC, and the topics are derived from what the season did —
// see js/dr/reunion.js. A reunion with a fixed running order would be a
// format; this one only talks about the arguments that are actually there, so
// a quiet season gets a short reunion and that is correct.
//
// The real episode sits between the last elimination and the finale — the
// track record chart carries a "Reunion" column in exactly that position —
// and it sends nobody home.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const REUNION_BEATS = [
  {
    id: 'reunion-open', step: 'reunion',
    note: 'The whole cast, back on one sofa, for the first time since it started.',
    tiers: [tier('open', 'Everybody is back and nobody is dressed down.', [
      "They are all back, all of them, sitting in a row in the best drag they own, and the room is louder than any werk room has been this season. The host comes out and does not need to say anything for a while. There is a lot of screaming to get through first.",
      "The whole cast, on one stage, for the first time since the day they walked in. The early boots sit next to the finalists as though the months in between did not happen, and for the first twenty minutes it genuinely does not. Then the host says \"so\", and it does.",
      "Everybody who started this season is back and the seating plan is the only thing anybody has looked at all week. The queens who have not seen each other since a lip sync greet each other like family. Two of them do not.",
      "The host opens the reunion by saying that this cast gave him one of the best seasons he can remember, which is what he says every year and which, this year, several of them clearly believe. The mood lasts about four minutes.",
    ])],
  },
  {
    id: 'feud', step: 'reunion',
    note: 'The season\'s worst pair, made to sit in the same room and say it.',
    tiers: [tier('feud', 'The argument, finally had in front of everybody.', [
      "The host does not build up to it. \"{a}. {b}. Talk to me.\" What follows is nine weeks of it coming out at once — the thing in the werk room, the thing on the runway, the thing neither of them said at the time — and the rest of the cast sits very still and does not intervene.",
      "{a} says her piece first and it is long and it is fair and it is not kind. {b} waits, which is more discipline than she showed all season, and then answers it. Somewhere in the middle the actual grievance surfaces and it turns out to be much smaller and much older than either of them was arguing about.",
      "\"I am not going to sit here and pretend,\" {b} says, and {a} says \"good, do not,\" and the room braces. It goes on for a while. Nobody wins it. Two queens further down the sofa are visibly enjoying it and one is visibly not.",
      "The feud between {a} and {b} gets its hearing and it goes exactly as badly as everybody hoped. They talk over each other twice, the host lets them, and then {b} says one thing that is true enough to stop the room and {a} has no answer for it.",
      "It takes ninety seconds to get from \"we are fine\" to the thing they are actually not fine about. {a} brings up the challenge. {b} brings up what {a} said about her when she was not there. The host, who knew this was coming, sits back.",
    ])],
  },
  {
    id: 'shock-exit', step: 'reunion',
    note: 'A queen with a real record who went home far too early.',
    tiers: [tier('shock', 'Nobody in the room understood it either.', [
      "The host brings up {a}'s elimination and the sofa reacts before he has finished the sentence. She had the record. She had the season. She had one bad night and a song that suited the other one, and she has had weeks to make peace with that and has not entirely.",
      "\"I still do not understand it,\" somebody says from the far end of the sofa, and three queens agree at once. {a} lets them do the outrage on her behalf for a minute, because it is nice, and then says the true thing: she was not good enough that night and the format does not care what you did in week three.",
      "{a} went home with one of the best records in the room and the cast has clearly discussed this among themselves at some length. She takes the sympathy well. You can see it costs her something to take it well.",
      "The exit that broke the season gets its moment. {a} was winning, and then she was not, and then she was gone, and the room still talks about the night like a thing that happened to all of them rather than to her.",
    ])],
  },
  {
    id: 'the-invisible', step: 'reunion',
    note: 'The queen who was safe every week and is asked how that felt.',
    tiers: [tier('invisible', 'Safe is not the same as fine.', [
      "The host asks {a} what it was like to hear \"safe\" every week and she laughs first, because that is the reflex, and then answers it properly. \"It is worse than the bottom,\" she says. \"In the bottom they are at least looking at you.\" Nobody on that sofa disagrees.",
      "{a} was safe more weeks than anybody in this cast and she has clearly thought a great deal about what that means. \"I kept waiting to be told what to fix,\" she says, \"and nobody ever told me anything, because there was nothing wrong. That is the problem.\"",
      "\"Did you feel seen?\" is the question, and {a} takes a long moment with it. The answer is no, and she says so without self-pity, and two other queens on the sofa nod in a way that suggests this reunion has just found a second topic.",
      "{a} says the word \"safe\" back to the host with a flatness that gets a laugh and is not a joke. She was never in the bottom. She was also never called forward. She is proud of the first thing and she is still working on the second.",
    ])],
  },
  {
    id: 'the-friendship', step: 'reunion',
    note: 'The bond the season built, named in front of everybody.',
    tiers: [tier('friendship', 'The thing they both got out of it.', [
      "The host asks {a} about {b} and {a} does not get very far into the answer. It is the good kind of not getting very far. {b} finishes the sentence for her, badly, and then neither of them can talk for a bit and the cast lets them have it.",
      "\"She is the best thing I got out of this,\" {a} says about {b}, and means it, and says it in front of a room that includes the crown she did not win. {b} says something back that is much less articulate and lands harder.",
      "{a} and {b} came into this room as strangers and are leaving it as whatever they are now, and asked to describe it neither of them manages a clean sentence. The rest of the cast has clearly watched this happen up close and is unsurprised.",
      "The friendship between {a} and {b} gets its moment and it is the only part of the reunion nobody interrupts. They tell the story of the night it started. It is a small story. It obviously was not small to them.",
    ])],
  },
  {
    id: 'the-frontrunner', step: 'reunion',
    note: 'The queen who kept winning, asked whether she knew she was.',
    tiers: [tier('frontrunner', 'Did you know? And did you say so?', [
      "\"Did you know you were the one to beat?\" {a} takes the question the way you take a question you have been asked before, by yourself, at three in the morning. \"Yes,\" she says. And then, because the room is waiting: \"and I hated how much I liked it.\"",
      "The host puts it to {a} plainly: she won more than anybody, and the room noticed, and the room got colder. She agrees with all three parts. \"You cannot be the frontrunner and be everybody's friend,\" she says. \"I tried both for about a week.\"",
      "{a} is asked whether the target she carried was fair and she says yes without hesitating, which is not the answer the sofa expected. \"I would have done it to me,\" she says. Two of the queens who did it to her look at the floor.",
      "\"Everyone kept saying my name,\" {a} says, \"and they were right to.\" It is not arrogance the way she says it — it is somebody who has spent weeks working out what it cost her to be good at this in front of eleven other people who wanted it as much.",
    ])],
  },
  {
    id: 'congeniality', step: 'reunion',
    note: 'The audience award, if the season announces it here.',
    tiers: [tier('congeniality', 'The one nobody can campaign for.', [
      "The sash goes to {a} and the sofa is on its feet before the host has finished the name. It is the one award in this format nobody can play for, and every queen in that row knew who it was going to be.",
      "\"Miss Congeniality,\" the host says, and half the cast is already pointing at {a}. She puts her hands over her face. Somebody at the end of the sofa shouts her name for a full four seconds without stopping.",
      "{a} gets the sash and immediately tries to give the credit to somebody else, which is exactly why she got the sash. The room does not let her finish.",
      "The audience picked {a} and the room agrees with the audience loudly. She holds the sash like it might be taken back and thanks people by name until the host gently stops her.",
    ])],
  },
  {
    id: 'reunion-close', step: 'reunion',
    note: 'The host sends them into the finale.',
    tiers: [tier('close', 'One of them is getting crowned next.', [
      "\"One of you,\" the host says, looking down the sofa at the ones still in it, \"is about to be crowned.\" The cast makes the noise. The finalists do not, because they have just remembered what happens next week.",
      "The host closes the reunion the way he closes everything, and the cast gives him the amen, and it is louder than usual because there are more of them than there have been since the premiere. Then everybody remembers there is still a crown to give out.",
      "\"That is the season,\" the host says. \"Almost.\" He lets the almost sit. The queens who are out get to laugh at it. The ones who are not, do not.",
      "The reunion ends with the whole cast on their feet and the finalists in the middle of it, being congratulated for something that has not happened yet by people who will be watching when it does.",
    ])],
  },
];

export const REUNION_IDS = REUNION_BEATS.map(b => b.id);

/** Beats with a tier that has no lines written — the gap check. */
export function unwrittenReunionTiers() {
  const out = [];
  for (const b of REUNION_BEATS) {
    for (const t of b.tiers || []) if (!t.lines?.length) out.push(`${b.id}/${t.id}`);
  }
  return out;
}
