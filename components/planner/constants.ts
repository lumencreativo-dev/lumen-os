import { PlannerItem, PlannerRule } from './types';

export const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAYS_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const FMTS = [
    { name: 'Post',     color: '#1A237E' },
    { name: 'Carrusel', color: '#00838F' },
    { name: 'Historia', color: '#F7931E' },
    { name: 'Reel',     color: '#C2185B' },
];

export const FMT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    'Post':     { bg: 'bg-blue-900/40',   border: 'border-blue-400/50',  text: 'text-blue-100',  dot: '#60A5FA' },
    'Carrusel': { bg: 'bg-teal-900/40',   border: 'border-teal-400/50',  text: 'text-teal-100',  dot: '#2DD4BF' },
    'Historia': { bg: 'bg-amber-900/40',  border: 'border-amber-400/50', text: 'text-amber-100', dot: '#FBBF24' },
    'Reel':     { bg: 'bg-pink-900/40',   border: 'border-pink-400/50',  text: 'text-pink-100',  dot: '#F472B6' },
};

export const STATUSES = ['Idea', 'En diseno', 'Por aprobar', 'Aprobado', 'Programado', 'Publicado', 'Corregir'];

export const STATUS_COLORS: Record<string, string> = {
    'Idea': '#9E9E9E',
    'En diseno': '#1A237E',
    'Por aprobar': '#F7931E',
    'Aprobado': '#00838F',
    'Programado': '#2E7D32',
    'Publicado': '#5E35B1',
    'Corregir': '#C62828',
};

export const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    'Idea':        { bg: 'bg-zinc-800/80',   text: 'text-zinc-300',   border: 'border-zinc-700' },
    'En diseno':   { bg: 'bg-blue-950/80',   text: 'text-blue-300',   border: 'border-blue-700/60' },
    'Por aprobar': { bg: 'bg-amber-950/80',  text: 'text-amber-300',  border: 'border-amber-600/60' },
    'Aprobado':    { bg: 'bg-teal-950/80',   text: 'text-teal-300',   border: 'border-teal-600/60' },
    'Programado':  { bg: 'bg-emerald-950/80',text: 'text-emerald-300',border: 'border-emerald-600/60' },
    'Publicado':   { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-600/60' },
    'Corregir':    { bg: 'bg-red-950/80',    text: 'text-red-300',    border: 'border-red-600/60' },
};

export const PLATFORMS_LIST = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'X', 'YouTube', 'WhatsApp'];

export const PLATFORM_PILLS: Record<string, { label: string; bg: string; text: string; border: string }> = {
    'Instagram': { label: 'IG', bg: 'bg-pink-950/50',  text: 'text-pink-300',    border: 'border-pink-500/40' },
    'Facebook':  { label: 'FB', bg: 'bg-blue-950/50',  text: 'text-blue-300',    border: 'border-blue-500/40' },
    'TikTok':    { label: 'TK', bg: 'bg-cyan-950/50',  text: 'text-cyan-300',    border: 'border-cyan-500/40' },
    'LinkedIn':  { label: 'IN', bg: 'bg-sky-950/50',   text: 'text-sky-300',     border: 'border-sky-500/40' },
    'X':         { label: 'X',  bg: 'bg-zinc-800/60',  text: 'text-zinc-200',    border: 'border-zinc-500/40' },
    'YouTube':   { label: 'YT', bg: 'bg-red-950/50',   text: 'text-red-300',     border: 'border-red-500/40' },
    'WhatsApp':  { label: 'WA', bg: 'bg-emerald-950/50',text: 'text-emerald-300',border: 'border-emerald-500/40' },
};

export const PRIORITIES = [
    { label: 'Alta',  color: '#C62828' },
    { label: 'Media', color: '#EF8F00' },
    { label: 'Baja',  color: '#2E7D32' },
];

export const FREQ_LABEL: Record<string, string> = { w: 'semana', m: 'mes', y: 'año' };

// ─── Utils ────────────────────────────────────────────────────────────────────
export const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
export const pad = (n: number) => String(n).padStart(2, '0');
export const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const mk = (year: number, mon: number) => `${year}-${pad(mon + 1)}`;
export const fmtColor = (name: string) => FMTS.find(f => f.name === name)?.color ?? '#9E9E9E';
export const safeHref = (url?: string | null) => (url && url.trim().startsWith('http')) ? url.trim() : null;

export function occursOn(rule: PlannerRule, dateStr: string): boolean {
    if (dateStr < rule.date) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const [, m0, d0] = rule.date.split('-').map(Number);
    if (rule.freq === 'y') return m === m0 && d === d0;
    if (rule.freq === 'm') return d === Math.min(d0, new Date(y, m, 0).getDate());
    const diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(...(rule.date.split('-').map(Number)) as [number, number, number])) / 864e5);
    return diff % 7 === 0;
}
