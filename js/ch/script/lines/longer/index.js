// The long cut: { entryId: [turn index | new turn, ...] }, one file per family (lines/index.js applies it).
import meeting from './meeting.js';
import recruit from './recruit.js';
import aftermath from './aftermath.js';
import pairs from './pairs.js';
import house from './house.js';
import game from './game.js';
import nights from './nights.js';
import more from './more.js';
import talk from './talk.js';
import fallout from './fallout.js';
import arcs from './arcs.js';
import thin from './thin.js';
import goodbye from './goodbye.js';

export default Object.assign({}, meeting, recruit, aftermath, pairs, house, game, nights, more, talk, fallout, arcs, thin, goodbye);
