'use client';

import dynamic from 'next/dynamic';

const PlannerApp = dynamic(
    () => import('@/components/planner/PlannerApp').then((mod) => mod.PlannerApp),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7931E] flex items-center justify-center mx-auto animate-pulse">
                        <span className="text-black text-xl font-bold">✨</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-white tracking-wide">Cargando Lumen Suite...</p>
                        <p className="text-xs text-[#737373]">Sincronizando clientes y calendario...</p>
                    </div>
                </div>
            </div>
        )
    }
);

export default function SuitePage() {
    return <PlannerApp mode="admin" />;
}
