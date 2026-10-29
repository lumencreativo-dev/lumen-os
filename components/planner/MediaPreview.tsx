'use client';

import { useState } from 'react';
import { ExternalLink, Play, Folder, FileText, Image as ImageIcon, Eye, Maximize2, X } from 'lucide-react';

interface MediaPreviewProps {
    url?: string;
    title?: string;
    className?: string;
    compact?: boolean;
}

export function parseDriveUrl(rawUrl: string): { type: 'drive-file' | 'drive-folder' | 'video' | 'image' | 'external'; embedUrl?: string; directUrl: string } {
    const url = rawUrl.trim();
    if (!url) return { type: 'external', directUrl: '' };

    // Google Drive File ID extraction
    // Formats:
    // https://drive.google.com/file/d/FILE_ID/view...
    // https://drive.google.com/open?id=FILE_ID
    // https://drive.google.com/uc?id=FILE_ID
    const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveFileMatch && driveFileMatch[1] && !url.includes('/folders/')) {
        const fileId = driveFileMatch[1];
        return {
            type: 'drive-file',
            embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
            directUrl: url
        };
    }

    // Google Drive Folder
    if (url.includes('drive.google.com') && url.includes('/folders/')) {
        return {
            type: 'drive-folder',
            directUrl: url
        };
    }

    // Direct Video
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) {
        return {
            type: 'video',
            embedUrl: url,
            directUrl: url
        };
    }

    // Direct Image
    if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url) || url.includes('images.unsplash.com')) {
        return {
            type: 'image',
            embedUrl: url,
            directUrl: url
        };
    }

    // YouTube / Vimeo
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

export function MediaPreview({ url, title, className = '', compact = false }: MediaPreviewProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (!url || !url.trim()) {
        return (
            <div className={`flex flex-col items-center justify-center bg-black/30 border border-white/5 rounded-2xl p-6 text-center text-white/30 ${className}`}>
                <ImageIcon className="w-8 h-8 mb-2 text-white/20" />
                <p className="text-xs font-medium">Sin material adjunto todavía</p>
                <p className="text-[11px] text-white/20 mt-0.5">El diseñador agregará el enlace de Drive al terminar</p>
            </div>
        );
    }

    const parsed = parseDriveUrl(url);

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Embedded Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 group">
                {parsed.type === 'drive-file' && parsed.embedUrl && (
                    <div className="relative w-full aspect-video sm:aspect-[16/10] bg-black">
                        <iframe
                            src={parsed.embedUrl}
                            className="w-full h-full border-0"
                            allow="autoplay"
                            title={title || 'Material Drive'}
                        />
                    </div>
                )}

                {parsed.type === 'video' && parsed.embedUrl && (
                    <div className="relative w-full aspect-video bg-black">
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
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                )}

                {parsed.type === 'image' && parsed.embedUrl && (
                    <div className="relative w-full max-h-[420px] bg-black/40 flex items-center justify-center overflow-hidden">
                        <img
                            src={parsed.embedUrl}
                            alt={title || 'Visual'}
                            className="max-h-[420px] w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setLightboxOpen(true)}
                        />
                        <button
                            onClick={() => setLightboxOpen(true)}
                            className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title="Ver en grande"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {parsed.type === 'drive-folder' && (
                    <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 bg-gradient-to-br from-[#1A1A1A] to-[#121212]">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F7931E]">
                            <Folder className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Carpeta de Google Drive</h4>
                            <p className="text-white/40 text-xs mt-0.5">Contiene múltiples recursos o artes de esta pieza</p>
                        </div>
                        <a
                            href={parsed.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7931E] hover:bg-[#F7931E]/90 text-white text-xs font-bold shadow-lg shadow-[#F7931E]/20 transition-all"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Abrir carpeta en Google Drive
                        </a>
                    </div>
                )}

                {parsed.type === 'external' && (
                    <div className="p-5 flex items-center justify-between gap-3 bg-[#161616]">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F7931E] shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                                <p className="text-white font-bold text-xs truncate">Material / Enlace Externo</p>
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

            {/* Direct Open in new tab link */}
            <div className="flex items-center justify-between text-[11px] px-1 text-white/40">
                <span>Material adjunto</span>
                <a
                    href={parsed.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#F7931E] flex items-center gap-1 transition-colors font-medium"
                >
                    <ExternalLink className="w-3 h-3" /> Abrir enlace original
                </a>
            </div>

            {/* Lightbox for Images */}
            {lightboxOpen && parsed.embedUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={parsed.embedUrl}
                        alt="Zoom"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
