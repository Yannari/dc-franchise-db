// Placeholder until this type gets its own mechanics (Plan 2). Re-exporting the
// generic hooks means the spine treats it exactly as it did before the module
// existed, so registering it early breaks nothing.
export * from './_generic.js';
