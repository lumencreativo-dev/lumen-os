'use client';

import { useState } from 'react';
import {
    ExternalLink, Play, Folder, FileText, Image as ImageIcon,
    Maximize2, X, Film, Sparkles, HelpCircle, RefreshCw, Download
} from 'lucide-react';

export interface ParsedMedia {
    type: 'drive-file' | 'drive-folder' | 'canva' | 'video' | 'image' | 'external';
    embedUrl?: string;
    directUrl: string;
    fileId?: string;
    directImageUrl?: string;
    thumbnailUrl?: string;
    downloadUrl?: string;
}

export function parseDriveUrl(rawUrl: string): ParsedMedia {
    const url = rawUrl.trim();
    if (!url) return { type: 'external', directUrl: '' };

    // 1. Google Drive File ID extraction
    const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
        url.match(/drive\.google\.com\/uc\?(?:export=view&)?id=([a-zA-Z0-9_-]+)/);

    if (driveFileMatch && driveFileMatch[1] && !url.includes('/folders/')) {
        const fileId = driveFileMatch[1];
        return {
            type: 'drive-file',
            fileId,
            embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
            directImageUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
            directUrl: url
        };
    }

    // 2. Google Drive Folder
    const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (url.includes('drive.google.com') && url.includes('/folders/')) {
        const folderId = folderMatch ? folderMatch[1] : undefined;
        return {
            type: 'drive-folder',
            embedUrl: folderId ? `https://drive.google.com/embeddedfolderview?id=${folderId}#grid` : undefined,
            directUrl: url
        };
    }

    // 3. Canva design links
    const canvaMatch = url.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)/);
    if (canvaMatch) {
        // Strip query params and append /view?embed
        const cleanBase = url.split('?')[0].replace(/\/edit.*|\/view.*/, '');
        return {
            type: 'canva',
            embedUrl: `${cleanBase}/view?embed`,
            directUrl: url
        };
    }

    // 4. Direct Video
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) {
        return {
            type: 'video',
            embedUrl: url,
            downloadUrl: url,
            directUrl: url
        };
    }

    // 5. Direct Image
    if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url) || url.includes('images.unsplash.com')) {
        return {
            type: 'image',
            embedUrl: url,
            downloadUrl: url,
            directUrl: url
        };
    }

    // 6. YouTube / Vimeo
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
        return {
            type: 'video',
            embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
            directUrl: url
        };
    }

    return {
        type: 'external',
        directUrl: url
    };
}

interface MediaPreviewProps {
    url?: string;
    title?: string;
    className?: string;
    compact?: boolean;
    fmt?: string; // 'Reel' | 'Historia' | 'Post' | 'Carrusel' | etc.
}

export function MediaPreview({
    url,
    title,
    className = '',
    compact = false,
    fmt = 'Post'
}: MediaPreviewProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [driveViewMode, setDriveViewMode] = useState<'video' | 'image'>(() => {
        // Default to video for Reels and Stories; image for Posts/Carruseles
        return fmt === 'Reel' || fmt === 'Historia' ? 'video' : 'image';
    });
    const [imgError, setImgError] = useState(false);
    const [showDriveHelp, setShowDriveHelp] = useState(false);

    if (!url || !url.trim()) {
        return (
            <div className={`flex flex-col items-center justify-center bg-black/30 border border-white/5 rounded-2xl p-6 text-center text-white/30 ${className}`}>
                <ImageIcon className="w-8 h-8 mb-2 text-white/20" />
                <p className="text-xs font-semibold text-white/50">Sin material adjunto todavía</p>
                <p className="text-[11px] text-white/30 mt-0.5">Pega el enlace de Google Drive (CapCut / Canva) para reproducir aquí</p>
            </div>
        );
    }

    const parsed = parseDriveUrl(url);
    const isVertical = fmt === 'Reel' || fmt === 'Historia';

    return (
        <div className={`space-y-2.5 ${className}`}>
            {/* Top Toolbar for Drive Files */}
            {parsed.type === 'drive-file' && !compact && (
                <div className="flex items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => { setDriveViewMode('video'); setImgError(false); }}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                driveViewMode === 'video'
                                    ? 'bg-[#F7931E] text-white shadow-md shadow-[#F7931E]/20'
                                    : 'text-white/50 hover:text-white'
                            }`}
                        >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Video Player (CapCut)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setDriveViewMode('image')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                driveViewMode === 'image'
                                    ? 'bg-[#F7931E] text-white shadow-md shadow-[#F7931E]/20'
                                    : 'text-white/50 hover:text-white'
                            }`}
                        >
                            <ImageIcon className="w-3 h-3" />
                            <span>Imagen / Arte (Canva)</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDriveHelp(!showDriveHelp)}
                        className="text-white/30 hover:text-white/60 p-1.5 rounded-lg transition-colors"
                        title="¿Problemas para reproducir?"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Permission tip helper */}
            {showDriveHelp && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#F7931E]" /> ¿El video o imagen pide acceso o no carga?
                    </p>
                    <p className="text-white/70">
                        En Google Drive, haz clic derecho en el archivo ➔ <strong>Compartir</strong> ➔ en <em>Acceso general</em> selecciona <strong>"Cualquier persona con el enlace"</strong> (como Lector).
                    </p>
                </div>
            )}

            {/* Main Embedded Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black/70 border border-white/10 group shadow-xl">
                {/* ── GOOGLE DRIVE FILE ── */}
                {parsed.type === 'drive-file' && (
                    <>
                        {/* Video Mode: Google Drive iframe player */}
                        {(driveViewMode === 'video' || imgError) && parsed.embedUrl && (
                            <div className={isVertical
                                ? "relative w-full max-w-[280px] sm:max-w-[310px] mx-auto aspect-[9/16] bg-black my-2 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15"
                                : "relative w-full aspect-video sm:aspect-[16/10] bg-black"
                            }>
                                <iframe
                                    src={parsed.embedUrl}
                                    className="w-full h-full border-0"
                                    allow="autoplay; encrypted-media; fullscreen"
                                    allowFullScreen
                                    title={title || 'Material Drive Video'}
                                />
                            </div>
                        )}

                        {/* Image Mode: Google Drive direct CDN Image */}
                        {driveViewMode === 'image' && !imgError && parsed.directImageUrl && (
                            <div className="relative w-full min-h-[220px] max-h-[500px] bg-black/40 flex items-center justify-center overflow-hidden p-2">
                                <img
                                    src={parsed.directImageUrl}
                                    alt={title || 'Visual Canva Drive'}
                                    onError={() => {
                                        // If direct image fails (e.g. it was an MP4 video), fallback to video view
                                        setImgError(true);
                                        setDriveViewMode('video');
                                    }}
                                    className="max-h-[480px] w-auto max-w-full object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity shadow-md"
                                    onClick={() => setLightboxOpen(true)}
                                />
                                <button
                                    onClick={() => setLightboxOpen(true)}
                                    className="absolute top-4 right-4 p-2 rounded-xl bg-black/70 hover:bg-black text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                    title="Ver en pantalla completa"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ── CANVA EMBED ── */}
                {parsed.type === 'canva' && parsed.embedUrl && (
                    <div className="relative w-full aspect-video sm:aspect-[16/10] bg-black">
                        <iframe
                            src={parsed.embedUrl}
                            className="w-full h-full border-0"
                            allowFullScreen
                            allow="fullscreen"
                            title={title || 'Diseño Canva'}
                        />
                    </div>
                )}

                {/* ── DIRECT VIDEO / YOUTUBE ── */}
                {parsed.type === 'video' && parsed.embedUrl && (
                    <div className={isVertical
                        ? "relative w-full max-w-[280px] sm:max-w-[310px] mx-auto aspect-[9/16] bg-black my-2 rounded-2xl overflow-hidden ring-1 ring-white/15"
                        : "relative w-full aspect-video bg-black"
                    }>
                        {parsed.embedUrl.includes('youtube.com') ? (
                            <iframe
                                src={parsed.embedUrl}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={title || 'Video'}
                            />
                        ) : (
                            <video
                                src={parsed.embedUrl}
                                controls
                                playsInline
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                )}

                {/* ── DIRECT IMAGE ── */}
                {parsed.type === 'image' && parsed.embedUrl && (
                    <div className="relative w-full max-h-[460px] bg-black/40 flex items-center justify-center overflow-hidden p-2">
                        <img
                            src={parsed.embedUrl}
                            alt={title || 'Visual'}
                            className="max-h-[440px] w-auto max-w-full object-contain rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setLightboxOpen(true)}
                        />
                        <button
                            onClick={() => setLightboxOpen(true)}
                            className="absolute top-4 right-4 p-2 rounded-xl bg-black/70 hover:bg-black text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                            title="Ver en pantalla completa"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── GOOGLE DRIVE FOLDER ── */}
                {parsed.type === 'drive-folder' && (
                    <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 bg-gradient-to-br from-[#1A1A1A] to-[#121212]">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F7931E]">
                            <Folder className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Carpeta de Google Drive</h4>
                            <p className="text-white/40 text-xs mt-0.5">Contiene múltiples artes, videos o recursos de esta pieza</p>
                        </div>
                        <a
                            href={parsed.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7931E] hover:bg-[#F7931E]/90 text-white text-xs font-bold shadow-lg shadow-[#F7931E]/20 transition-all active:scale-95"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Abrir carpeta en Google Drive
                        </a>
                    </div>
                )}

                {/* ── EXTERNAL LINK FALLBACK ── */}
                {parsed.type === 'external' && (
                    <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-[#161616]">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F7931E] shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                                <p className="text-white font-bold text-xs truncate">Enlace externo adjunto</p>
                                <p className="text-white/40 text-[11px] truncate">{parsed.directUrl}</p>
                            </div>
                        </div>
                        <a
                            href={parsed.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Abrir
                        </a>
                    </div>
                )}
            </div>

            {/* Bottom Bar: Download + Quick link to open in new tab */}
            <div className="flex items-center justify-between text-[11px] px-1 text-white/50">
                <span className="flex items-center gap-1.5">
                    {parsed.type === 'drive-file' && <Film className="w-3 h-3 text-[#F7931E]" />}
                    <span className="font-medium">{parsed.type === 'drive-file' ? 'Google Drive' : 'Material adjunto'}</span>
                </span>
                <div className="flex items-center gap-3">
                    {parsed.downloadUrl && (
                        <a
                            href={parsed.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20"
                            title="Descargar archivo a tu dispositivo"
                        >
                            <Download className="w-3 h-3" /> Descargar
                        </a>
                    )}
                    <a
                        href={parsed.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#F7931E] flex items-center gap-1 transition-colors font-medium text-white/50"
                    >
                        <ExternalLink className="w-3 h-3" /> Enlace original
                    </a>
                </div>
            </div>

            {/* Lightbox for Fullscreen Image Zoom */}
            {lightboxOpen && (parsed.directImageUrl || parsed.embedUrl) && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <div className="absolute top-5 right-5 flex items-center gap-2">
                        {parsed.downloadUrl && (
                            <a
                                href={parsed.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                                onClick={e => e.stopPropagation()}
                            >
                                <Download className="w-4 h-4" /> Descargar
                            </a>
                        )}
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-xl"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <img
                        src={parsed.directImageUrl || parsed.embedUrl}
                        alt="Zoom Fullscreen"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
