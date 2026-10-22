// pm/lines/voices/index.js — a line said in the speaker's own voice. Data only.
//
// The user, 2026-10-22: "update perfect match to use voice too? #goofy #flirty
// #earnest … create variants for a lot of them like the other sims, like The
// Circle or Total Drama".
//
// Each batch is a list of [entry id, the line exactly as the pool has it,
// { key: the same line in that voice }]. pm/script.js finds the turn by its id
// and its words and hangs the voices on it; a batch line that matches nothing
// is listed in VOICE_MISSES, and a test keeps that list empty, so a pool edit
// can never leave a voice pointing at a line that is no longer there.
//
// A key is a voice tag (js/td/story/voice-words.js — the same tags Create
// Character's "Simulator reads" shows, #hashtags first) or one of the five
// families those tags fall back to (js/td/story/voice-family-map.js):
//   sharp  cruel · schemer · proud · bossy
//   dry    dry · calm · quiet · nerdy
//   loud   loud · blunt · tough · competitive · chaotic
//   soft   warm · earnest · emotional · anxious · flirty
//   odd    goofy · ditzy · food · theatrical
// The speaker's strongest tag that has a version wins, then that tag's family,
// then their next tag; nobody with a version left keeps the line as written.
// Different WORDS, not a filter: what this kind of person would actually say
// in this spot (feedback: the Challenge's human-dialogue rules).
import { BATCH1 } from './batch1.js';
import { BATCH2 } from './batch2.js';
import { BATCH3 } from './batch3.js';
import { BATCH4 } from './batch4.js';
import { BATCH5 } from './batch5.js';
import { BATCH6 } from './batch6.js';
import { BATCH7 } from './batch7.js';
import { BATCH8 } from './batch8.js';
import { BATCH9 } from './batch9.js';
import { BATCH10 } from './batch10.js';
import { BATCH11 } from './batch11.js';
import { BATCH12 } from './batch12.js';
import { BATCH13 } from './batch13.js';
import { BATCH14 } from './batch14.js';
import { BATCH15 } from './batch15.js';
import { BATCH16 } from './batch16.js';
import { BATCH17 } from './batch17.js';
import { BATCH18 } from './batch18.js';
import { BATCH19 } from './batch19.js';
import { BATCH20 } from './batch20.js';
import { BATCH21 } from './batch21.js';
import { BATCH22 } from './batch22.js';
import { BATCH23 } from './batch23.js';
import { BATCH24 } from './batch24.js';
import { BATCH25 } from './batch25.js';
import { BATCH26 } from './batch26.js';
import { BATCH27 } from './batch27.js';
import { BATCH28 } from './batch28.js';
import { BATCH29 } from './batch29.js';
import { BATCH30 } from './batch30.js';
import { BATCH31 } from './batch31.js';
import { BATCH32 } from './batch32.js';
import { BATCH33 } from './batch33.js';
import { BATCH34 } from './batch34.js';
import { BATCH35 } from './batch35.js';
import { BATCH36 } from './batch36.js';
import { BATCH37 } from './batch37.js';
import { BATCH38 } from './batch38.js';
import { BATCH39 } from './batch39.js';
import { BATCH40 } from './batch40.js';
import { BATCH41 } from './batch41.js';
import { BATCH42 } from './batch42.js';
import { BATCH43 } from './batch43.js';
import { BATCH44 } from './batch44.js';
import { BATCH45 } from './batch45.js';
import { BATCH46 } from './batch46.js';
import { BATCH47 } from './batch47.js';
import { BATCH48 } from './batch48.js';
import { BATCH49 } from './batch49.js';
import { BATCH50 } from './batch50.js';
import { BATCH51 } from './batch51.js';
import { BATCH52 } from './batch52.js';
import { BATCH53 } from './batch53.js';
import { BATCH54 } from './batch54.js';
import { BATCH55 } from './batch55.js';
import { BATCH56 } from './batch56.js';
import { BATCH57 } from './batch57.js';
import { BATCH58 } from './batch58.js';
import { BATCH59 } from './batch59.js';
import { BATCH60 } from './batch60.js';
import { BATCH61 } from './batch61.js';
import { BATCH62 } from './batch62.js';
import { BATCH63 } from './batch63.js';
import { BATCH64 } from './batch64.js';
import { BATCH65 } from './batch65.js';
import { BATCH66 } from './batch66.js';
import { BATCH67 } from './batch67.js';
import { BATCH68 } from './batch68.js';
import { BATCH69 } from './batch69.js';
import { BATCH70 } from './batch70.js';
import { BATCH71 } from './batch71.js';
import { BATCH72 } from './batch72.js';
import { BATCH73 } from './batch73.js';
import { BATCH74 } from './batch74.js';
import { BATCH75 } from './batch75.js';
import { BATCH76 } from './batch76.js';
import { BATCH77 } from './batch77.js';
import { BATCH78 } from './batch78.js';
import { BATCH79 } from './batch79.js';
import { BATCH80 } from './batch80.js';
import { BATCH81 } from './batch81.js';
import { BATCH82 } from './batch82.js';
import { BATCH83 } from './batch83.js';
import { BATCH84 } from './batch84.js';
import { BATCH85 } from './batch85.js';
import { BATCH86 } from './batch86.js';
import { BATCH87 } from './batch87.js';
import { BATCH88 } from './batch88.js';
import { BATCH89 } from './batch89.js';
import { BATCH90 } from './batch90.js';
import { BATCH91 } from './batch91.js';
import { BATCH92 } from './batch92.js';
import { BATCH93 } from './batch93.js';
import { BATCH94 } from './batch94.js';
import { BATCH95 } from './batch95.js';
import { BATCH96 } from './batch96.js';
import { BATCH97 } from './batch97.js';
import { BATCH98 } from './batch98.js';
import { BATCH99 } from './batch99.js';
import { BATCH100 } from './batch100.js';
import { BATCH101 } from './batch101.js';
import { BATCH102 } from './batch102.js';
import { BATCH103 } from './batch103.js';
import { BATCH104 } from './batch104.js';
import { BATCH105 } from './batch105.js';
import { BATCH106 } from './batch106.js';
import { BATCH107 } from './batch107.js';
import { BATCH108 } from './batch108.js';
import { BATCH109 } from './batch109.js';
import { BATCH110 } from './batch110.js';
import { BATCH111 } from './batch111.js';
import { BATCH112 } from './batch112.js';
import { BATCH113 } from './batch113.js';
import { BATCH114 } from './batch114.js';
import { BATCH115 } from './batch115.js';
import { BATCH116 } from './batch116.js';

export const VOICES = [...BATCH1, ...BATCH2, ...BATCH3, ...BATCH4, ...BATCH5, ...BATCH6, ...BATCH7, ...BATCH8, ...BATCH9, ...BATCH10, ...BATCH11, ...BATCH12, ...BATCH13, ...BATCH14, ...BATCH15, ...BATCH16, ...BATCH17, ...BATCH18, ...BATCH19, ...BATCH20, ...BATCH21, ...BATCH22, ...BATCH23, ...BATCH24, ...BATCH25, ...BATCH26, ...BATCH27, ...BATCH28, ...BATCH29, ...BATCH30, ...BATCH31, ...BATCH32, ...BATCH33, ...BATCH34, ...BATCH35, ...BATCH36, ...BATCH37, ...BATCH38, ...BATCH39, ...BATCH40, ...BATCH41, ...BATCH42, ...BATCH43, ...BATCH44, ...BATCH45, ...BATCH46, ...BATCH47, ...BATCH48, ...BATCH49, ...BATCH50, ...BATCH51, ...BATCH52, ...BATCH53, ...BATCH54, ...BATCH55, ...BATCH56, ...BATCH57, ...BATCH58, ...BATCH59, ...BATCH60, ...BATCH61, ...BATCH62, ...BATCH63, ...BATCH64, ...BATCH65, ...BATCH66, ...BATCH67, ...BATCH68, ...BATCH69, ...BATCH70, ...BATCH71, ...BATCH72, ...BATCH73, ...BATCH74, ...BATCH75, ...BATCH76, ...BATCH77, ...BATCH78, ...BATCH79, ...BATCH80, ...BATCH81, ...BATCH82, ...BATCH83, ...BATCH84, ...BATCH85, ...BATCH86, ...BATCH87, ...BATCH88, ...BATCH89, ...BATCH90, ...BATCH91, ...BATCH92, ...BATCH93, ...BATCH94, ...BATCH95, ...BATCH96, ...BATCH97, ...BATCH98, ...BATCH99, ...BATCH100, ...BATCH101, ...BATCH102, ...BATCH103, ...BATCH104, ...BATCH105, ...BATCH106, ...BATCH107, ...BATCH108, ...BATCH109, ...BATCH110, ...BATCH111, ...BATCH112, ...BATCH113, ...BATCH114, ...BATCH115, ...BATCH116];
