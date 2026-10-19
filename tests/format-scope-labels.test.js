// A cast-form control scoped to another show hides with its label: the user saw "Billed as (The Challenge)" and
// "Division (The Challenge...)" labels with nothing under them on a Ridonculous Race season (2026-10-19), because those
// controls are scoped as SECTIONS, and a section hid only the control itself.
import { describe, it, expect } from 'vitest';
import { seasonConfig } from '../js/core.js';
import { applyFormatScope } from '../js/quick-setup.js';

describe('format scope', () => {
  it("hides another show's cast-form control with its label", () => {
    document.body.innerHTML = `
      <div class="form-group" id="g-bill"><label class="form-label">Billed as (The Challenge)</label><select id="f-ch-billing"></select></div>
      <div class="form-group" id="g-partner"><label class="form-label">Partner</label><input id="f-ch-partner"></div>`;
    Object.assign(seasonConfig, { format: 'ridonculous-race' });
    applyFormatScope();
    expect(document.getElementById('g-bill').style.display).toBe('none');
    expect(document.getElementById('g-partner').style.display).toBe('');
    Object.assign(seasonConfig, { format: 'the-challenge' });
    applyFormatScope();
    expect(document.getElementById('g-bill').style.display).toBe('');
  });
});
