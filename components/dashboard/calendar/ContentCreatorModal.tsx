"use client";

import React, { useState, useRef } from "react";
import {
    X, Upload, Instagram, Facebook, Linkedin,
    Video, Image as ImageIcon, Layers, FileText,
    Calendar, Check, Trash2, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentGridItem, Platform, ContentType } from "@/types/content-grid";

interface ContentCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Partial<ContentGridItem>) => void;
    onDelete?: () => void;
    initialData: Partial<ContentGridItem>;
    isEditing: boolean;
}

export default function ContentCreatorModal({
    isOpen, onClose, onSave, onDelete, initialData, isEditing
}: ContentCreatorModalProps) {
    const [formData, setFormData] = useState<Partial<ContentGridItem>>(initialData);
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>([]); // Simulation of files

    if (!isOpen) return null;

    const togglePlatform = (p: Platform) => {
        const current = formData.platforms || [];
        if (current.includes(p)) {
            setFormData({ ...formData, platforms: current.filter(x => x !== p) });
        } else {
            setFormData({ ...formData, platforms: [...current, p] });
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            // Add files to state (simulation)
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles([...files, ...newFiles]);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

                {/* Left Panel: Media & Type */}
                <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tipo & Fecha</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {(['post', 'reel', 'story', 'carousel'] as ContentType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, type })}
                                        className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all
                                            ${formData.type === type
                                                ? 'bg-lumen-priority border-lumen-priority text-white shadow-sm font-bold'
                                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {type === 'reel' ? <Video className="w-4 h-4" /> :
                                            type === 'carousel' ? <Layers className="w-4 h-4" /> :
                                                <ImageIcon className="w-4 h-4" />}
                                        <span className="capitalize">{type}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.date || ''}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-lumen-priority/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Plataformas</h3>
                        <div className="flex gap-2">
                            {(['instagram', 'facebook', 'linkedin', 'tiktok'] as Platform[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => togglePlatform(p)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all relative
                                        ${formData.platforms?.includes(p)
                                            ? 'bg-gray-900 border-gray-900 text-white'
                                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
                                >
                                    {p === 'instagram' && <Instagram className="w-5 h-5" />}
                                    {p === 'facebook' && <Facebook className="w-5 h-5" />}
                                    {p === 'linkedin' && <Linkedin className="w-5 h-5" />}
                                    {p === 'tiktok' && <span className="text-[10px] font-bold">TK</span>}

                                    {formData.platforms?.includes(p) && (
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                                            <Check className="w-2 h-2 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Multimedia</h3>
                        <div
                            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer relative
                                ${dragActive ? 'border-lumen-priority bg-blue-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files && setFiles([...files, ...Array.from(e.target.files)])}
                            />
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <Upload className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Arrastra archivos aquí</p>
                            <p className="text-xs text-gray-400 mt-1">o haz clic para explorar</p>

                            {files.length > 0 && (
                                <div className="mt-4 w-full flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                                    {files.map((f, i) => (
                                        <div key={i} className="text-xs text-left bg-gray-100 p-2 rounded flex justify-between items-center">
                                            <span className="truncate">{f.name}</span>
                                            <span className="text-gray-400 text-[10px]">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Content Details */}
                <div className="w-full md:w-2/3 p-8 flex flex-col h-full bg-white">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isEditing ? "Editar Contenido" : "Planificar Contenido"}
                            </h2>
                            <p className="text-sm text-gray-500">Define los detalles creativos para el equipo.</p>
                        </div>
                        <Button variant="ghost" onClick={onClose} size="icon" className="rounded-full">
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Concept */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Concepto / Título</label>
                            <input
                                type="text"
                                value={formData.concept || ''}
                                onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                                placeholder="Ej: Reel educativo sobre sacramentos..."
                                className="w-full text-lg font-medium border-b-2 border-gray-100 focus:border-lumen-priority outline-none py-2 px-1 transition-colors placeholder:font-normal placeholder:text-gray-300"
                            />
                        </div>

                        {/* Instructions */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                Instrucciones de Diseño
                            </label>
                            <textarea
                                value={formData.instructions || ''}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                placeholder="Describe qué debe aparecer visualmente, referencias, colores..."
                                className="w-full min-h-[100px] p-4 bg-blue-50/30 border border-blue-100 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                            />
                        </div>

                        {/* Caption */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-pink-500" />
                                Caption / Copy
                            </label>
                            <textarea
                                value={formData.caption || ''}
                                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                placeholder="Escribe aquí el texto que acompañará la publicación..."
                                className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm leading-relaxed focus:ring-2 focus:ring-lumen-priority/20 outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                        {isEditing ? (
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                                onClick={onDelete}
                            >
                                <Trash2 className="w-4 h-4" /> Eliminar
                            </Button>
                        ) : <div />}

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button
                                className="bg-lumen-priority text-white hover:bg-orange-500 shadow-lg shadow-orange-400/30 px-8 font-bold"
                                onClick={() => onSave(formData)}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isEditing ? "Guardar Cambios" : "Crear Contenido"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
