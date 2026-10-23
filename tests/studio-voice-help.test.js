// The Studio's "How voice tags work" explains the selected show only.
//
// The user, 2026-10-22: "fix the collapsible How voice tags work for it adapts showing the # that works for bb
// in the explanation only if bb is selected same for all the other shows". It was one paragraph for every show,
// Perfect Match's weights included, and said nothing of Big Brother's registers.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { WORD_TAGS } from '../js/td/story/voice-words.js';
import { CIRCLE_VOICE_TAGS } from '../js/ci/register.js';
import { bbTagRegisters } from '../js/bb/story/register.js';
import { REGISTERS as PM_REGISTERS } from '../js/pm/story/director.js';
import { CIRCLE_FORMAT, SHOWS } from '../js/shows.js';

const src = fs.readFileSync(path.join(process.cwd(), 'js/studio.js'), 'utf8');
const grab = name => {
  const i = src.indexOf(`function ${name}(`);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) { j = k + 1; break; } }
  return src.slice(i, j);
};
const line = name => src.match(new RegExp(`^const ${name} = [^\\n]*(?:\\n  \\+[^\\n]*)*`, 'm'))[0];

const help = format => new Function('WORD_TAGS', 'CIRCLE_VOICE_TAGS', 'bbTagRegisters', 'PM_REGISTERS', 'CIRCLE_FORMAT', 'SHOWS', [
  `const _showFormat = () => ${JSON.stringify(format)};`,
  line('_showName'), line('_tags'), line('_byRegister'), line('_REMOVE'), line('_MIX'),
  grab('_voiceHelpFor'),
  `return _voiceHelpFor(${JSON.stringify(format)});`,
].join('\n'))(WORD_TAGS, CIRCLE_VOICE_TAGS, bbTagRegisters, PM_REGISTERS, CIRCLE_FORMAT, SHOWS);

describe('how voice tags work, per show', () => {
  it('Big Brother lists its registers and the tags each one takes, and nothing of the Circle', () => {
    const t = help('big-brother');
    for (const [r, tags] of Object.entries(bbTagRegisters())) {
      expect(t).toContain(`<b>${r}</b>`);
      for (const tag of tags) expect(t).toContain('#' + tag);
    }
    expect(t).toMatch(/#nerdy does nothing here/);
    expect(t).toMatch(/4, 2\.5, 1\.5/);
    expect(t).not.toContain('#chill');
  });

  it('Perfect Match lists its six registers and its mix', () => {
    const t = help('perfect-match');
    for (const r of Object.keys(PM_REGISTERS)) expect(t).toContain(`<b>${r}</b>`);
    expect(t).toMatch(/4, 2\.5, 1\.5/);
    expect(t).not.toContain('Big Brother');
  });

  it('the Circle shows its own voices, and says a weight does nothing', () => {
    const t = help(CIRCLE_FORMAT);
    for (const tag of CIRCLE_VOICE_TAGS) expect(t).toContain('#' + tag);
    expect(t).toMatch(/does nothing here/);
    expect(t).not.toMatch(/4, 2\.5, 1\.5/);
  });

  it('Total Drama, the Challenge and the Race speak the first tag, and weights do nothing', () => {
    for (const f of ['total-drama', 'the-challenge', 'ridonculous-race']) {
      const t = help(f);
      expect(t, f).toContain(SHOWS[f].name);
      expect(t, f).toContain('#' + WORD_TAGS[0]);
      expect(t, f).toMatch(/does nothing here/);
      expect(t, f).not.toMatch(/4, 2\.5, 1\.5|#chill|<b>terse<\/b>/);
    }
  });

  it('the Traitors and Drag Race say they do not read tags at all', () => {
    expect(help('traitors')).toMatch(/does not read voice tags/);
    expect(help('drag-race')).toMatch(/does not read these tags/);
  });

  it('the summary names the selected show, and Big Brother shows what it hears', () => {
    expect(src).toMatch(/How voice tags work in \$\{_showName\(\)\}/);
    expect(src).toMatch(/\(_bbSelected\(\) \? _bbVoiceHtml\(text\) : ''\)/);
  });

  it('"Fill in this profile" shows only when Big Brother is selected', () => {
    // the user, 2026-10-23: "remove fill this profile button when big brother isnt selected"
    expect(src).toMatch(/d\.name && _bbSelected\(\) \? '<button[^']*id="st-fill-profile"/);
  });

  it('the Drag Race craft section shows only when Drag Race is selected', () => {
    // the user, 2026-10-23: "remove drag race craft section when drag race isnt selected"
    expect(src).toMatch(/_drSelected\(\) \? `<details class="st-drag" id="st-drag-panel"/);
    expect(src).toMatch(/id="st-f-drag-family-add">\+ Add link<\/button>\s*<\/details>` : ''\}/);
  });
});
