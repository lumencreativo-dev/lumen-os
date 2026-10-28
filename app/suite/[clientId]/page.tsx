'use client';

import { useParams } from 'next/navigation';
import { PlannerApp } from '@/components/planner/PlannerApp';

export default function ClientSuitePage() {
    const params = useParams();
    const clientId = params?.clientId as string;
    return <PlannerApp mode="client" clientId={clientId} />;
}
