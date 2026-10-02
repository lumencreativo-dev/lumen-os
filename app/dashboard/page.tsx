"use client";

import DashboardView from "@/components/team/DashboardView";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";

export default function DashboardPage() {
    const { user } = useAuth();
    const rawName = user?.email?.split("@")[0] || "Kevin";
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                className="flex justify-between items-start"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div>
                    <h1 className="lumen-title text-4xl font-black text-gray-900 tracking-tight">
                        Hola, {name} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Aquí está tu centro de comando de hoy.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-white border border-gray-100 shadow-sm rounded-full px-4 py-2">
                    <div className="w-2 h-2 rounded-full bg-lumen-priority animate-pulse" />
                    <span className="text-sm font-semibold text-gray-700">Lumen OS</span>
                    <span className="text-xs text-gray-400 font-mono">v2.0</span>
                </div>
            </motion.div>

            <DashboardView />
        </div>
    );
}
