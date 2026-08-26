const STAT_KEYS = Object.freeze([
  'physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament',
]);

export const PROFILE_SOURCE_KINDS = new Set([
  'source-canon', 'simulator-continuity', 'interpretation', 'authored',
]);

export const PROFILE_GROUPS = Object.freeze({
  Identity: ['name','gender','sexuality','ethnicity','nationality','descriptor'],
  Biography: ['birthdate','age','hometown','occupation','backstory'],
  Characterization: ['personality','voice'],
  Gameplay: ['archetype','stats'],
  Interview: ['castingInterview'],
});

function clone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function isBlank(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function valuesEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (left == null || right == null) return false;
  if (typeof left !== 'object' || typeof right !== 'object') return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertMatchingSlugs(current, published) {
  if (current?.slug !== published?.slug) {
    throw new Error('Profile slugs must match');
  }
}

function isRoundTripIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validatePublishedProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return { valid: false, errors: ['profile must be an object'] };
  }

  if (typeof profile.slug !== 'string' || profile.slug.trim() === '') {
    errors.push('slug is required');
  }

  if (profile.birthdate != null && profile.birthdate !== ''
      && (typeof profile.birthdate !== 'string' || !isRoundTripIsoDate(profile.birthdate))) {
    errors.push('birthdate must use YYYY-MM-DD');
  }

  if (profile.stats != null) {
    if (typeof profile.stats !== 'object' || Array.isArray(profile.stats)) {
      errors.push('stats must be an object');
    } else {
      const suppliedKeys = Object.keys(profile.stats);
      for (const key of suppliedKeys) {
        if (!STAT_KEYS.includes(key)) errors.push(`Unknown stat: ${key}`);
      }
      for (const key of STAT_KEYS) {
        if (!Object.hasOwn(profile.stats, key)) errors.push(`Missing stat: ${key}`);
        else if (!Number.isInteger(profile.stats[key])
            || profile.stats[key] < 1 || profile.stats[key] > 10) {
          errors.push(`${key} must be an integer from 1 through 10`);
        }
      }
    }
  }

  if (profile.profileSources != null) {
    const sourceGroups = profile.profileSources;
    const prototype = typeof sourceGroups === 'object' && sourceGroups !== null
      ? Object.getPrototypeOf(sourceGroups) : null;
    if (sourceGroups === null || typeof sourceGroups !== 'object'
        || Array.isArray(sourceGroups)
        || (prototype !== Object.prototype && prototype !== null)) {
      errors.push('profileSources must be an object');
    } else {
      for (const [field, sources] of Object.entries(sourceGroups)) {
        if (!Array.isArray(sources)) {
          errors.push(`profileSources.${field} must be an array`);
          continue;
        }
        sources.forEach((source, index) => {
          const path = `profileSources.${field}[${index}]`;
          if (!source || typeof source !== 'object' || Array.isArray(source)) {
            errors.push(`${path} must be an object`);
            return;
          }
          if (typeof source.label !== 'string' || source.label.trim() === '') {
            errors.push(`${path}.label is required`);
          }
          if (source.url != null && typeof source.url !== 'string') {
            errors.push(`${path}.url must be a string`);
          }
          if (!PROFILE_SOURCE_KINDS.has(source.kind)) {
            errors.push(`${path}.kind is invalid`);
          }
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function diffPublishedProfile(current, published) {
  assertMatchingSlugs(current, published);
  const rows = [];
  for (const [group, keys] of Object.entries(PROFILE_GROUPS)) {
    for (const key of keys) {
      if (!Object.hasOwn(published, key) || valuesEqual(current?.[key], published[key])) continue;
      rows.push({
        group,
        key,
        current: clone(current?.[key]),
        published: clone(published[key]),
        selected: isBlank(current?.[key]),
      });
    }
  }
  return rows;
}

export function applyProfileSelection(current, published, selectedKeys) {
  assertMatchingSlugs(current, published);
  const result = clone(current);
  for (const key of selectedKeys || []) {
    if (Object.hasOwn(published, key)) result[key] = clone(published[key]);
  }
  return result;
}

/**
 * The same diff, but from several sources at once.
 *
 * Two buttons that both meant "fill this in" was a worse question than it
 * looked. The wiki fetch offers no field the saved roster cannot, so choosing
 * between them was never about coverage — it was about where the value came
 * from, which is a property of a ROW, not of a button. So the sources merge
 * and every row says where it came from.
 *
 * Where two sources offer the same field, both survive as `candidates` and the
 * reader picks. Silently preferring one would be the thing this whole preview
 * exists to avoid: the saved roster is reviewed and the wiki is fresh, and
 * which of those wins is a judgement nobody can make on the reader's behalf.
 *
 * `sources` is [{ origin, label, profile }], in preference order — the first
 * source offering a field owns the default pick.
 */
export function diffProfileCandidates(current, sources) {
  const rows = new Map();
  for (const source of sources || []) {
    const profile = source?.profile;
    if (!profile) continue;
    assertMatchingSlugs(current, profile);
    for (const [group, keys] of Object.entries(PROFILE_GROUPS)) {
      for (const key of keys) {
        if (!Object.hasOwn(profile, key) || isBlank(profile[key])) continue;
        // A source that agrees with the draft has nothing to offer on this row.
        if (valuesEqual(current?.[key], profile[key])) continue;
        const candidate = {
          origin: source.origin,
          label: source.label,
          value: clone(profile[key]),
          sources: clone(profile.profileSources?.[key]) || [],
        };
        const row = rows.get(key);
        if (!row) {
          rows.set(key, {
            group, key,
            current: clone(current?.[key]),
            candidates: [candidate],
            // Same rule as the single-source diff: a blank comes in ticked, a
            // field the reader already wrote does not.
            selected: isBlank(current?.[key]),
          });
        } else if (!row.candidates.some(c => valuesEqual(c.value, candidate.value))) {
          // Two sources saying the identical thing is one option, not two.
          row.candidates.push(candidate);
        }
      }
    }
  }
  // Grouped order, so the dialog renders Identity before Biography as before.
  const order = Object.keys(PROFILE_GROUPS);
  return [...rows.values()].sort((a, b) =>
    order.indexOf(a.group) - order.indexOf(b.group));
}

/**
 * Apply the chosen candidates.
 *
 * `picks` is [{ key, value, sources }] — the value the reader actually chose,
 * not merely the key, because a row can now offer more than one. Provenance
 * travels with the choice: a value taken from the wiki keeps the wiki's
 * citation, and one taken from the roster keeps the roster's, so the record of
 * where a fact came from survives the merge that produced it.
 */
export function applyCandidateSelection(current, picks) {
  const result = clone(current) || {};
  for (const pick of picks || []) {
    if (!pick || !pick.key) continue;
    result[pick.key] = clone(pick.value);
    if (pick.sources && pick.sources.length) {
      result.profileSources = result.profileSources || {};
      result.profileSources[pick.key] = clone(pick.sources);
    }
  }
  return result;
}

export function selectProfileVoice({ localVoice, rosterVoice, legacyVoice } = {}) {
  return [localVoice, rosterVoice, legacyVoice].find(value => !isBlank(value)) || '';
}
