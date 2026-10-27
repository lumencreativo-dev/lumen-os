'use client';

import { PlannerItem } from './types';
import { DAYS_SHORT, FMTS, pad, todayStr, fmtColor } from './constants';

interface MonthCardProps {
    month: string;
    m: number;
    year: number;
    items: PlannerItem[];
    counts: Record<string, number>;
    milestoneOnFn: (date: string) => any[];
    onClick: () => void;
}

export function MonthCard({ month, m, year, items, counts, milestoneOnFn, onClick }: MonthCardProps) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const firstDay = (new Date(year, m, 1).getDay() + 6) % 7;
    const td = todayStr();

    return (
        <div
            onClick={onClick}
            className="bg-[#161616] border border-white/10 rounded-2xl p-4 hover:border-white/30 hover:bg-[#1E1E1E] transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
            <div>
                {/* Header: Month name + Format counts */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-sm group-hover:text-[#F7931E] transition-colors">
                        {month}
                    </h3>
                    <div className="flex gap-1.5">
                        {FMTS.map(f => counts[f.name] > 0 && (
                            <div key={f.name} className="flex items-center gap-0.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                                <span className="text-white/60 font-semibold text-[10px]">{counts[f.name]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5">
                    {DAYS_SHORT.map(d => (
                        <div key={d} className="text-center text-white/40 text-[10px] font-bold pb-1">{d}</div>
                    ))}
                    {Array.from({ length: firstDay }, (_, i) => (
                        <div key={`e${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const d = i + 1;
                        const dateStr = `${year}-${pad(m + 1)}-${pad(d)}`;
                        const dayItems = items.filter(it => it.date === dateStr);
                        const mss = milestoneOnFn(dateStr);
                        const isToday = dateStr === td;

                        return (
                            <div
                                key={d}
                                className={`aspect-square rounded-sm flex flex-col items-center justify-center relative ${
                                    isToday ? 'bg-[#F7931E]/25 ring-1 ring-[#F7931E]' : ''
                                }`}
                            >
                                <span className={`text-[10px] leading-none ${isToday ? 'text-[#F7931E] font-black' : 'text-white/60'}`}>
                                    {d}
                                </span>
                                {dayItems.length > 0 && (
                                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                                        {dayItems.slice(0, 3).map((it, idx) => (
                                            <div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: fmtColor(it.fmt) }} />
                                        ))}
                                    </div>
                                )}
                                {mss.length > 0 && (
                                    <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-black" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Improvement #3: Monthly Heatmap Intensity Bar */}
            <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-white/30 mb-1.5 font-medium">
                    <span>Actividad</span>
                    <span>{items.length} piezas</span>
                </div>
                <div className="flex gap-[2px] h-2 w-full rounded bg-white/5 p-[1px] overflow-hidden">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const d = i + 1;
                        const dateStr = `${year}-${pad(m + 1)}-${pad(d)}`;
                        const count = items.filter(it => it.date === dateStr).length;

                        let bg = 'bg-transparent';
                        if (count === 1) bg = 'bg-[#F7931E]/40';
                        else if (count === 2) bg = 'bg-[#F7931E]/75';
                        else if (count >= 3) bg = 'bg-[#F7931E]';

                        return (
                            <div
                                key={d}
                                className={`flex-1 rounded-[1px] ${bg} transition-colors`}
                                title={`${d} de ${month}: ${count} contenido(s)`}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
