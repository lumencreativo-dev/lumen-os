// app/planner/[clientId]/page.tsx
// Vista de Cliente — solo ve SU calendario, sin panel de admin
'use client';

import { PlannerApp } from '@/components/planner/PlannerApp';

export default function ClientPlannerPage({ params }: { params: { clientId: string } }) {
    return <PlannerApp mode="client" clientId={params.clientId} />;
}
