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

export const VOICES = [...BATCH1, ...BATCH2, ...BATCH3, ...BATCH4, ...BATCH5, ...BATCH6, ...BATCH7, ...BATCH8, ...BATCH9, ...BATCH10, ...BATCH11, ...BATCH12, ...BATCH13, ...BATCH14, ...BATCH15, ...BATCH16, ...BATCH17, ...BATCH18, ...BATCH19, ...BATCH20, ...BATCH21, ...BATCH22, ...BATCH23, ...BATCH24];
