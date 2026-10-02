-- ============================================================
-- LUMEN OS — Tabla Deliverable en Supabase
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS "Deliverable" (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title           TEXT NOT NULL,
    "clientId"      UUID REFERENCES "Client"(id) ON DELETE SET NULL,
    "clientName"    TEXT NOT NULL DEFAULT '',
    type            TEXT NOT NULL DEFAULT 'image',  -- image | video | document | link | carousel
    url             TEXT NOT NULL DEFAULT '',
    "carouselUrls"  TEXT[] DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'pending', -- pending | approved | changes_requested | in_revision
    priority        TEXT NOT NULL DEFAULT 'normal',  -- low | normal | high | urgent
    description     TEXT,
    deadline        TIMESTAMPTZ,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    tags            TEXT[] DEFAULT '{}',
    "assignedTo"    TEXT,
    "approvedAt"    TIMESTAMPTZ,
    "approvedVersion" INTEGER,
    "lastViewedAt"  TIMESTAMPTZ,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de versiones de entregables
CREATE TABLE IF NOT EXISTS "DeliverableVersion" (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "deliverableId" UUID NOT NULL REFERENCES "Deliverable"(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL DEFAULT 1,
    url             TEXT NOT NULL DEFAULT '',
    "carouselUrls"  TEXT[] DEFAULT '{}',
    notes           TEXT,
    "createdBy"     TEXT,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de feedback de entregables
CREATE TABLE IF NOT EXISTS "DeliverableFeedback" (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "deliverableId" UUID NOT NULL REFERENCES "Deliverable"(id) ON DELETE CASCADE,
    comment         TEXT NOT NULL,
    author          TEXT NOT NULL DEFAULT 'team',  -- client | team
    "authorName"    TEXT,
    version         INTEGER DEFAULT 1,
    "createdAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_deliverable_client ON "Deliverable"("clientId");
CREATE INDEX IF NOT EXISTS idx_deliverable_status ON "Deliverable"(status);
CREATE INDEX IF NOT EXISTS idx_deliverable_created ON "Deliverable"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_dv_deliverable ON "DeliverableVersion"("deliverableId");
CREATE INDEX IF NOT EXISTS idx_df_deliverable ON "DeliverableFeedback"("deliverableId");

-- Auto-update updatedAt
CREATE OR REPLACE FUNCTION update_deliverable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER deliverable_updated_at
    BEFORE UPDATE ON "Deliverable"
    FOR EACH ROW EXECUTE FUNCTION update_deliverable_updated_at();

-- RLS
ALTER TABLE "Deliverable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliverableVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliverableFeedback" ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for authenticated — ajustar según necesidad)
CREATE POLICY "Allow all for authenticated" ON "Deliverable"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON "DeliverableVersion"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON "DeliverableFeedback"
    FOR ALL USING (true) WITH CHECK (true);
