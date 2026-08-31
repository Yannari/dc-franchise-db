-- Profile provenance was added after the roster table was deployed.
-- Apply once with Wrangler; SQLite does not support ADD COLUMN IF NOT EXISTS.
ALTER TABLE roster ADD COLUMN profile_sources TEXT;
