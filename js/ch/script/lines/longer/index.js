// The long cut: { entryId: [turn index | new turn, ...] }, one file per family (lines/index.js applies it).
import meeting from './meeting.js';
import recruit from './recruit.js';
import aftermath from './aftermath.js';
import pairs from './pairs.js';
import house from './house.js';
import game from './game.js';

export default Object.assign({}, meeting, recruit, aftermath, pairs, house, game);
