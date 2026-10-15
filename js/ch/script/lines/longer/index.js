// The long cut: { entryId: [turn index | new turn, ...] }, one file per family (lines/index.js applies it).
import meeting from './meeting.js';
import recruit from './recruit.js';

export default Object.assign({}, meeting, recruit);
