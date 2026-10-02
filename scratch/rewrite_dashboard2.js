const fs = require('fs');

let content = fs.readFileSync('components/team/DashboardView.tsx', 'utf8');

if (!content.includes('import { motion }')) {
    content = content.replace(
        'import Link from "next/link";',
        'import Link from "next/link";\nimport { motion } from "framer-motion";'
    );
}

const variantsCode = `
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };
`;
if (!content.includes('const container = {')) {
    content = content.replace(
        'const [isLoading, setIsLoading] = useState(true);',
        variantsCode + '\n    const [isLoading, setIsLoading] = useState(true);'
    );
}

const newReturn = `return (
        <motion.div 
            className="space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header section (if it were inside, but it's passed from page.tsx) */}
            <div className="flex justify-between items-center mb-2">
                <motion.div variants={item} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-500">Sistemas Operativos en Línea</span>
                </motion.div>
                <motion.button 
                    variants={item}
                    onClick={fetchStats}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-lumen-priority transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100"
                >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar Panel
                </motion.button>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={item}>
                    <Link href="/dashboard/admin/clients">
                        <div className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6" />
                                </div>
                                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    {stats.clients.active} Activos
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1 font-medium">Total Clientes</p>
                                <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                                    {stats.clients.total}
                                </h3>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                <motion.div variants={item}>
                    <Link href="/dashboard/leads">
                        <div className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <Target className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                    <Target className="w-6 h-6" />
                                </div>
                                {stats.leads.newToday > 0 && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                        <ArrowUpRight className="w-3 h-3" />
                                        +{stats.leads.newToday} Hoy
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1 font-medium">Leads Activos</p>
                                <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                                    {stats.leads.total}
                                </h3>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                <motion.div variants={item}>
                    <Link href="/dashboard/deliverables">
                        <div className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-green-300 transition-all relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <FileText className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                {stats.deliverables.pending > 0 && (
                                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full animate-pulse">
                                        {stats.deliverables.pending} Pendientes
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1 font-medium">Entregables</p>
                                <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                                    {stats.deliverables.total}
                                </h3>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                <motion.div variants={item}>
                    <Link href="/dashboard/finance">
                        <div className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all relative overflow-hidden h-full flex flex-col justify-between">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                <DollarSign className="w-24 h-24" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                {stats.finance.overdue > 0 && (
                                    <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                        {stats.finance.overdue} vencidas
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1 font-medium">Por Cobrar</p>
                                <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                                    \${stats.finance.outstanding.toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <motion.div variants={item} className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-7 rounded-3xl text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-lumen-priority/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Zap className="w-5 h-5 text-lumen-priority" />
                        </div>
                        Acciones Rápidas
                    </h3>
                    <div className="space-y-3 relative z-10">
                        <Link href="/dashboard/admin/clients">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                                <span className="font-medium">Nuevo Cliente</span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="w-4 h-4 text-lumen-priority" />
                                </div>
                            </div>
                        </Link>
                        <Link href="/dashboard/deliverables">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                                <span className="font-medium">Nuevo Entregable</span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FileText className="w-4 h-4 text-blue-400" />
                                </div>
                            </div>
                        </Link>
                        <Link href="/dashboard/calendar">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                                <span className="font-medium">Planificar Contenido</span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Target className="w-4 h-4 text-purple-400" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </motion.div>

                {/* Deliverables Status */}
                <motion.div variants={item} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        Estado Entregables
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    <span className="text-sm font-medium text-gray-600">Aprobados</span>
                                </div>
                                <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{stats.deliverables.approved}</span>
                            </div>
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                    <span className="text-sm font-medium text-gray-600">Pendientes</span>
                                </div>
                                <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{stats.deliverables.pending}</span>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-gray-900">Progreso Global</span>
                                <span className="font-bold text-green-600">
                                    {stats.deliverables.total > 0 ? Math.round((stats.deliverables.approved / stats.deliverables.total) * 100) : 0}%
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: \`\${stats.deliverables.total > 0 ? (stats.deliverables.approved / stats.deliverables.total) * 100 : 0}%\` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Finance Summary */}
                <motion.div variants={item} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-50 rounded-full blur-3xl pointer-events-none" />
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3 relative z-10">
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        Flujo de Caja
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between p-4 bg-green-50/50 border border-green-100 rounded-2xl hover:bg-green-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-bold text-green-800">Cobrado</span>
                            </div>
                            <span className="font-black text-green-700 text-lg">
                                \${stats.finance.totalReceived.toLocaleString()}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl hover:bg-orange-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Clock className="w-4 h-4 text-orange-600" />
                                </div>
                                <span className="text-sm font-bold text-orange-800">Por Cobrar</span>
                            </div>
                            <span className="font-black text-orange-700 text-lg">
                                \${stats.finance.outstanding.toLocaleString()}
                            </span>
                        </div>
                        
                        {stats.finance.overdue > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg animate-pulse">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <span className="text-sm font-bold text-red-800">Vencido</span>
                                </div>
                                <span className="font-black text-red-700">
                                    {stats.finance.overdue} <span className="text-xs font-medium">facturas</span>
                                </span>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}`;

// Search for the MAIN return block. It usually follows `if (!stats) return`
const mainReturnMarker = 'return (\n        <div className="space-y-8">\n            {/* Refresh Button */}';
const returnIdx = content.indexOf(mainReturnMarker);

if (returnIdx !== -1) {
    // Find the end of the file or the end of the return
    // Since it's the last return in the file, we can just replace everything from `returnIdx` to the second to last character (before the closing `}`)
    
    // Find the last closing brace
    const lastBraceIdx = content.lastIndexOf('}');
    
    content = content.substring(0, returnIdx) + newReturn + '\n}';
    fs.writeFileSync('components/team/DashboardView.tsx', content);
    console.log("Dashboard rewritten correctly with Framer Motion!");
} else {
    console.log("Could not find main return statement");
}
