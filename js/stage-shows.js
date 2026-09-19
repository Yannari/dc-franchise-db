// ════════════════════════════════════════════════════════════════
//  STAGE SHOWS — what each show's episodes look and sound like on the stage
// ════════════════════════════════════════════════════════════════
// js/episode-stage.js is show-blind. It knows three kinds of scene — HOME (the
// camp, the house), COMP (a challenge, an HOH or veto) and EXIT (tribal
// council, an eviction) — and everything it prints or recognises comes from
// the profile below: the hosts, the word for a team, how a vote is read and an
// exit announced, the chapter names, the music for each kind of scene, the
// sets. That is the rule CLAUDE.md sets for every generated sentence: a show's
// words come from its own entry, never from another show's.
//
// ADDING A SHOW is one profile here plus one sets file (js/stage-sets-*.js).
// The format contract is the same for every show:
//   [SCENE: Place — spot — time.] [Present: A, B. Host: C.]
// so the parser, chapters, run time, results screen, reaction shots and
// highlight pop-ups all work unchanged.
import * as island from './stage-sets-island.js';
import { KITS } from './stage-sets-kits.js';
import { resolveChallenge } from './stage-challenges.js';

// Total Drama's sets: the island's places plus the challenge kits, in one table.
Object.assign(island.SETS, KITS);
const tdSets = { SETS: island.SETS, TIMES: island.TIMES, timeOf: island.timeOf, skySVG: island.skySVG, pickSet: island.pickSet };

export const STAGE_SHOWS = {
  'total-drama': {
    id: 'total-drama',
    name: 'Total Drama',
    sets: tdSets,
    homeSet: 'camp', compSet: 'challenge', exitSet: 'tribal',

    // "[Challenge: Hell's Kitchen]" → the twist's kit (js/stage-challenges.js). Every competition
    // scene after it is played on that kit unless its header names a spot with a kit of its own.
    kits: Object.keys(KITS),
    resolveChallenge,
    challengeKick: "TODAY'S CHALLENGE",
    // a competition header's spot → a kit ("Challenge compound — mess tent" is a kitchen)
    kitSpots: [
      ['kitchen',    /kitchen|mess (tent|hall)|canteen|cafeteria/i],
      ['stage',      /\bstage\b|auditorium|theat(er|re)|runway/i],
      ['arena',      /\bcourt\b|\bgym\b|dojo|\bring\b/i],
      ['water',      /lake|dock|cliff|canoe race|pool|river|waterfall/i],
      ['nightwoods', /forest|woods|trail/i],
      ['spooky',     /mansion|haunted|museum|dungeon|\blab\b|hospital/i],
      ['desert',     /desert|pyramid|dunes|ruins|dig site/i],
      ['snow',       /snow|\bice\b|glacier|summit|slope/i],
      ['bigtop',     /big top|midway|ferris|carousel/i],
      ['maze',       /maze|labyrinth/i],
      ['studio',     /soundstage|backlot|film set|studio/i],
      ['course',     /obstacle|course|canoe hold|drill|finish line|track/i],
    ],
    // where the votes are cast, one voter at a time ("[SCENE: Tribal council — voting booth — night.]")
    boothSet: 'booth',

    hosts: ['Chris', 'Chef'],
    hostColors: { Chris: '#ffcc33', Chef: '#f1f1f1' },

    // a team: "Green camp", "Kinosa camp", "Blue tribe's beach"
    group: 'tribe', groups: 'tribes',
    groupPlace: /^(?:the\s+)?([A-Za-z][\w'-]*?)(?:'s)?\s+(?:camp|tribe|beach|shelter)\b/i,
    notGroups: /^(the|main|tribe|challenge|exile|redemption|tribal|jury|merge|merged|losers?|winners?|home|base|boot|island)$/i,

    // what kind of scene a place is, when its set alone does not say
    compPlace: /challenge|compound|arena|obstacle course/i,
    exitPlace: /tribal|council|campfire ceremony|elimination ceremony/i,

    // the middle of "[SCENE: Green camp — well — morning.]" → which set to draw
    spots: [
      ['booth',     /booth|voting|the urn/i],
      ['tribal',    /tribal|council|urn/i],
      ['dock',      /dock|pier/i],
      ['well',      /\bwell\b/i],
      ['fishing',   /fishing|rocks|tide ?pool|lagoon|reef/i],
      ['cliff',     /cliff|peak|ledge|lookout/i],
      ['jungle',    /tree ?line|jungle|forest|trail|woods|vines|clearing/i],
      ['beach',     /water'?s edge|beach|shore|waterline|lake/i],
      ['challenge', /compound|mess|obstacle|course|canoe|bench|water station|open area|arena|podium/i],
      ['camp',      /fire ?pit|campfire|\bfire\b|shelter|cabin|crate|bunk|hammock|camp/i],
    ],
    // old-style scenes (no spot in the header) move mid-scene on these cues
    cutLead: /^(at the|later|next morning|next day|late that night|late at night|much later|later still|pre-tribal|evening|night|morning|dawn|between phases|full dark|meanwhile|back at)\b/i,
    locPhrase: /\b(at|to|near|by|on) the (dock|well|tree ?line|water's edge|beach|shore|fire pit|shelter|urn)\b/i,
    cutSpots: [
      ['dock',      /\b(dock|pier|pilings)\b/i],
      ['well',      /\bthe well\b/i],
      ['jungle',    /\b(tree ?line|jungle|forest|trail|woods|vines)\b/i],
      ['beach',     /\b(water's edge|the beach|the shore|shoreline)\b/i],
      ['challenge', /\b(compound|mess tent|mess hall|obstacle course)\b/i],
      ['camp',      /\b(fire pit|the fire|shelter|camp|supply crate|the crate|cabin|bunk)\b/i],
    ],

    // the vote, read by the host at an EXIT scene
    vote: {
      start: /\b(reads?|reading) (out )?the votes\b|\btally the votes\b|\bthe votes are in\b/i,
      exit: /voted out|bring me your torch|that'?s enough/i,
      // who the exit line names, which beats any count: "James — that's enough", "James, bring me
      // your torch", "voted out of the game… James". Tried in order; the name must be a player.
      exitName: [
        /([A-Z][a-zA-Z'\-]+)\s*[—–,.-]+\s*that'?s enough/,
        /([A-Z][a-zA-Z'\-]+)[,.]?\s+bring me your torch/,
        /voted out[^.!?]*?(?:\.\.\.|…|—|–|:|,)\s*([A-Z][a-zA-Z'\-]+)/,
      ],
      final: /tribe has spoken/i,
      write: /\b[Ww]rites\s+([A-Z][A-Za-z]+)/,
      snuff: /snuffs?\b|torch goes (dark|out)/i,
    },
    exitCard: 'THE TRIBE HAS SPOKEN',
    exitWord: 'voted out',                 // "4th voted out"
    compWin: /\b(\w+) WINS IMMUNITY/i,     // the winner word is a person or a team
    compPrize: 'IMMUNITY',
    // something a player finds and keeps (drawn as a badge on their standee)
    find: { re: /\b(finds|pulls out|digs up|uncovers|holds up)\b[^.]{0,50}\bidol\b/i, word: /idol/i, label: 'IDOL FOUND' },
    // a challenge ends a player's run without ending their game
    benchLine: /^\W*DISMISSED\b/,
    benchAct: /\b(rings? (it|the bell)|pulls it\b|walks to the bell|walks to the bench)/i,
    // the host calling people out by name: "Owen, you're out!", "Izzy and Owen are out of the challenge!"
    benchHost: /\b(is|are|you'?re)\s+(out|done|eliminated|disqualified)\b|\bout of the (challenge|game)\b/i,
    // a player going out on their own, named in the direction: "Gwen taps out", "Owen falls into the lake"
    benchFall: /\b(taps out|gives up|drops out|falls (in|into|off|out)|wipes out|faints|passes out|is (out|eliminated|disqualified)|can'?t hold on|lets go)\b/i,
    // finishing order: "[Owen crosses the finish line first.]", "Gwen finishes second"
    place: /\b(?:crosses the finish line|finishes|comes in|places)\s+(first|second|third|fourth|fifth|last)\b|\b(first|second|third|last) (?:across|over) the (?:line|finish)\b|\bwins the race\b/i,

    chapters: { cold: 'Cold Open', home: 'Camp Life', comp: 'The Challenge', after: 'After the Challenge', exit: 'Tribal Council', epilogue: 'Epilogue' },
    // js/audio.js beds (assets/audio/)
    beds: { day: 'camp-day', night: 'camp-night', comp: 'challenge', exit: 'tribal-tension', end: 'aftermath', titles: 'challenge' },
  },
};

export const DEFAULT_STAGE_SHOW = 'total-drama';
export const stageShow = id => STAGE_SHOWS[id] || STAGE_SHOWS[DEFAULT_STAGE_SHOW];
export const hasStage = id => !!STAGE_SHOWS[id];
