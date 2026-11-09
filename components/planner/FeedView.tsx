'use client';

import { useState, useMemo } from 'react';
import {
  Instagram,
  Layers,
  Video,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Sparkles,
  Calendar,
  Filter,
} from 'lucide-react';
import { PlannerClient, PlannerItem } from './types';
import { fmtColor } from './constants';

interface FeedViewProps {
  client: PlannerClient | null;
  items: PlannerItem[];
  onOpenItem: (item: PlannerItem) => void;
}

export function FeedView({ client, items, onOpenItem }: FeedViewProps) {
  const [filter, setFilter] = useState<'all' | 'feed' | 'approved'>('all');

  // Filter items that belong in Instagram feed (Posts, Carruseles, Reels)
  // Sorted in reverse chronological order (newest date first, matching Instagram profile)
  const feedItems = useMemo(() => {
    let filtered = items.filter((it) => it.fmt !== 'Historia'); // Stories don't show on grid

    if (filter === 'feed') {
      filtered = filtered.filter((it) => it.fmt === 'Post' || it.fmt === 'Carrusel');
    } else if (filter === 'approved') {
      filtered = filtered.filter((it) => it.status === 'Aprobado' || it.status === 'Programado' || it.status === 'Publicado');
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [items, filter]);

  const initials = client?.name
    ? client.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'L';

  const clientHandle = client?.name
    ? client.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    : 'lumencreativo';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* ── Instagram Profile Header Mockup ── */}
      <div className="bg-[#141414] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar with Story gradient border */}
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#F7931E] via-[#E11D48] to-[#9333EA] shrink-0 shadow-lg">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#141414] flex items-center justify-center text-xl sm:text-2xl font-black text-white overflow-hidden"
                style={{ backgroundColor: client?.color || '#F7931E' }}
              >
                {client?.avatar ? (
                  <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-extrabold text-lg sm:text-xl flex items-center gap-1.5">
                  @{clientHandle}
                </h3>
                <span className="text-[11px] font-bold bg-[#F7931E]/20 text-[#F7931E] border border-[#F7931E]/30 px-2 py-0.5 rounded-full">
                  Feed 3x3 Preview
                </span>
              </div>
              <p className="text-white/80 text-sm font-semibold">{client?.name || 'Cliente'}</p>
              <p className="text-white/40 text-xs">
                Previsualización estética del muro de Instagram antes de publicar
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 sm:gap-8 self-center sm:self-auto text-center bg-white/5 border border-white/5 px-5 py-3 rounded-2xl">
            <div>
              <p className="text-white font-black text-lg">{feedItems.length}</p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Posts</p>
            </div>
            <div>
              <p className="text-emerald-400 font-black text-lg">
                {feedItems.filter((i) => i.status === 'Aprobado').length}
              </p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Aprobados</p>
            </div>
            <div>
              <p className="text-[#F7931E] font-black text-lg">
                {feedItems.filter((i) => i.status === 'Programado').length}
              </p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Programados</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-white/40 mr-1" />
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-white/50 hover:text-white bg-white/5'
              }`}
            >
              Todos ({items.filter((i) => i.fmt !== 'Historia').length})
            </button>
            <button
              onClick={() => setFilter('feed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'feed'
                  ? 'bg-white/20 text-white shadow-xs'
                  : 'text-white/50 hover:text-white bg-white/5'
              }`}
            >
              Posts & Carruseles
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-white/50 hover:text-white bg-white/5'
              }`}
            >
              Solo Listos & Aprobados
            </button>
          </div>

          <span className="text-[11px] text-white/40 font-medium hidden sm:inline">
            Toca cualquier foto para editar o programar
          </span>
        </div>
      </div>

      {/* ── 3x3 Grid Container ── */}
      {feedItems.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] border border-white/5 rounded-3xl p-8">
          <Instagram className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h4 className="text-white font-bold text-base mb-1">Sin contenidos para el feed</h4>
          <p className="text-white/40 text-xs max-w-sm mx-auto">
            Añade publicaciones, carruseles o reels en el calendario para ver cómo se compone la cuadrícula estética de tu cuenta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#0D0D0D] p-2 sm:p-3 rounded-3xl border border-white/10 shadow-2xl">
          {feedItems.map((item) => {
            const color = fmtColor(item.fmt);
            const hasRealImage =
              item.material_link &&
              (item.material_link.match(/\.(jpeg|jpg|gif|png|webp)/i) ||
                item.material_link.includes('unsplash') ||
                item.material_link.includes('supabase'));

            return (
              <div
                key={item.id}
                onClick={() => onOpenItem(item)}
                className="group relative aspect-square bg-[#1A1A1A] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#F7931E]/60 transition-all hover:shadow-xl"
              >
                {/* Media Image or Styled Typography Placeholder */}
                {hasRealImage ? (
                  <img
                    src={item.material_link}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full p-3 sm:p-4 flex flex-col justify-between transition-transform duration-500 group-hover:scale-105"
                    style={{
                      background: `radial-gradient(circle at top right, ${color}22, #141414 75%)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white shadow-xs"
                        style={{ backgroundColor: color }}
                      >
                        {item.fmt}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-white font-bold text-xs sm:text-sm line-clamp-3 leading-snug">
                        {item.title || item.fmt}
                      </p>
                      {item.copy && (
                        <p className="text-white/40 text-[10px] line-clamp-2">{item.copy}</p>
                      )}
                    </div>

                    <div className="text-[10px] text-white/30 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                )}

                {/* Top-Right Format Icon (Like Instagram) */}
                <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs p-1.5 rounded-lg text-white/90 shadow-md">
                  {item.fmt === 'Reel' && <Video className="w-3.5 h-3.5 text-amber-400" />}
                  {item.fmt === 'Carrusel' && <Layers className="w-3.5 h-3.5 text-teal-400" />}
                  {item.fmt === 'Post' && <ImageIcon className="w-3.5 h-3.5 text-blue-400" />}
                </div>

                {/* Bottom-Left Status Pill */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 text-[9px] font-bold text-white shadow-xs">
                  {item.status === 'Aprobado' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                  {item.status === 'Programado' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F7931E]" />
                  )}
                  {item.status === 'En diseño' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                  {item.status === 'Idea' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                  <span className="capitalize">{item.status}</span>
                </div>

                {/* Hover Details Overlay */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center text-white space-y-2 backdrop-blur-2xs">
                  <p className="font-extrabold text-xs sm:text-sm line-clamp-2 px-2">
                    {item.title || item.fmt}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-bold text-white/80">
                    <span>❤️ {Math.floor(Math.random() * 80) + 20}</span>
                    <span>💬 {Math.floor(Math.random() * 15) + 2}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#F7931E] bg-[#F7931E]/20 border border-[#F7931E]/40 px-2.5 py-1 rounded-lg">
                    Editar en Ficha →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
