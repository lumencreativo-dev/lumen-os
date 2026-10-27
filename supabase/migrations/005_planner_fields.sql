-- Agregar los nuevos campos a PlannerItem
ALTER TABLE "PlannerItem"
    ADD COLUMN IF NOT EXISTS "hour"         TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "responsible"  TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "pillar"       TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "platforms"    TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS "copy"         TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "hashtags"     TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "cta"          TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "visual_idea"  TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "material_link" TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "published_link" TEXT DEFAULT '';

-- Mismo para PlannerRule (para que los recurrentes tambien tengan ficha)
ALTER TABLE "PlannerRule"
    ADD COLUMN IF NOT EXISTS "hour"         TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "responsible"  TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "pillar"       TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "platforms"    TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS "copy"         TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "hashtags"     TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "cta"          TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "visual_idea"  TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "material_link" TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "published_link" TEXT DEFAULT '';

NOTIFY pgrst, 'reload schema';
