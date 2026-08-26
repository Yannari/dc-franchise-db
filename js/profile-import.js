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

export function selectProfileVoice({ localVoice, rosterVoice, legacyVoice } = {}) {
  return [localVoice, rosterVoice, legacyVoice].find(value => !isBlank(value)) || '';
}
