# 🧠 SYSTEM STATE: Lumen OS
**Última Actualización:** 30 de Septiembre de 2026
**Infraestructura:** Next.js (Vercel) + Supabase (Nativo/REST) + GitHub. NO PRISMA.

## ⏸️ Módulos en Pausa (CONGELADOS)
- **CRM / Leads:** (`app/dashboard/leads`)
- **Finanzas / Facturación:** (`app/dashboard/finance`)
- **Tareas Internas:** (`app/dashboard/tasks`)

## 🟢 Módulos Activos (EN DESARROLLO)
- **Hub de Identidad:** (Nuevo) Ficha de carisma y restricciones por cliente.
- **Calendario T-45:** (Nuevo) Matriz de fechas a 45 días vista.
- **Banco de Prompts:** (Nuevo) Master prompts guardados por cliente.
- **Portal de Cliente:** (Existente - Refactorizando) `app/portal/[token]`.

## 📜 Reglas de Arquitectura Inviolables
1. **Supabase Nativo:** Prohibido usar ORMs pesados como Prisma. Usar `@supabase/ssr` nativo para cuidar los límites del Free Tier (conexiones REST en lugar de TCP).
2. **Desarrollo Modular:** Construir y probar un módulo a la vez. No mezclar features.
3. **UI Centrada en el Cliente:** Todo gravita alrededor del "Hub del Cliente". Menos clics es mejor.
