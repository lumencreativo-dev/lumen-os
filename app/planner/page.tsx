// app/planner/page.tsx
// La "Tienda de Campaña" — Planner operativo de Lumen Creativo
// Vista de Admin: ve todos los clientes, puede crear, editar y compartir
'use client';

export default function PlannerPage() {
    return <PlannerApp mode="admin" />;
}

import { PlannerApp } from '@/components/planner/PlannerApp';
