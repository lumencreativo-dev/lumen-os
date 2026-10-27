-- ============================================================
-- LUMEN OS - Planner (Tienda de Campaña / Calendario Operativo)
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- Tabla de clientes del planner
CREATE TABLE IF NOT EXISTS "PlannerClient" (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#F7931E',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de contenido del planner
CREATE TABLE IF NOT EXISTS "PlannerItem" (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL REFERENCES "PlannerClient"(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    fmt         TEXT NOT NULL DEFAULT 'Post',
    title       TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'Idea',
    note        TEXT DEFAULT '',
    canva_link  TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reglas recurrentes
CREATE TABLE IF NOT EXISTS "PlannerRule" (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL REFERENCES "PlannerClient"(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    freq        TEXT NOT NULL DEFAULT 'w',
    fmt         TEXT NOT NULL DEFAULT 'Post',
    title       TEXT DEFAULT '',
    status      TEXT DEFAULT 'Idea',
    note        TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tareas por mes/cliente
CREATE TABLE IF NOT EXISTS "PlannerTask" (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL REFERENCES "PlannerClient"(id) ON DELETE CASCADE,
    month       TEXT NOT NULL,
    text        TEXT NOT NULL,
    prio        INTEGER NOT NULL DEFAULT 2,
    date        TEXT DEFAULT '',
    done        BOOLEAN NOT NULL DEFAULT false,
    created_at  BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Tabla de Hitos (fechas importantes del cliente)
CREATE TABLE IF NOT EXISTS "PlannerMilestone" (
    id          TEXT PRIMARY KEY,
    client_id   TEXT NOT NULL REFERENCES "PlannerClient"(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    date        TEXT NOT NULL,
    recurring   BOOLEAN NOT NULL DEFAULT true,
    emoji       TEXT DEFAULT 'star',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Politicas RLS (abiertas, sin login)
ALTER TABLE "PlannerClient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlannerItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlannerRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlannerTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlannerMilestone" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open access PlannerClient" ON "PlannerClient" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access PlannerItem" ON "PlannerItem" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access PlannerRule" ON "PlannerRule" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access PlannerTask" ON "PlannerTask" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Open access PlannerMilestone" ON "PlannerMilestone" FOR ALL USING (true) WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_pi_client ON "PlannerItem"(client_id);
CREATE INDEX IF NOT EXISTS idx_pi_date ON "PlannerItem"(date);
CREATE INDEX IF NOT EXISTS idx_pr_client ON "PlannerRule"(client_id);
CREATE INDEX IF NOT EXISTS idx_pt_client ON "PlannerTask"(client_id);
CREATE INDEX IF NOT EXISTS idx_pm_client ON "PlannerMilestone"(client_id);
