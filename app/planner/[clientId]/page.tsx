'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const PlannerApp = dynamic(
    () => import('@/components/planner/PlannerApp').then((mod) => mod.PlannerApp),
    {
        ssr: false,
        loading: () => (
            <div suppressHydrationWarning className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7931E] flex items-center justify-center mx-auto animate-pulse">
                        <span className="text-black text-xl font-bold">✨</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-white tracking-wide">Cargando Portal de Cliente...</p>
                        <p className="text-xs text-[#737373]">Sincronizando contenidos...</p>
                    </div>
                </div>
            </div>
        )
    }
);

export default function ClientPlannerPage() {
    const params = useParams();
    const clientId = params?.clientId as string;
    return <PlannerApp mode="client" clientId={clientId} />;
}
