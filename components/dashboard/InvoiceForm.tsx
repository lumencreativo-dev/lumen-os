"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    X, Plus, Trash2, Loader2, DollarSign, Calendar,
    User, FileText, AlertCircle, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Client } from "@/types/clients";

interface InvoiceItem {
    id: string;
    description: string;
    qty: number;
    rate: number;
}

interface InvoiceFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (invoiceName: string) => void;
}

export default function InvoiceForm({ isOpen, onClose, onSuccess }: InvoiceFormProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: crypto.randomUUID(), description: "", qty: 1, rate: 0 }
    ]);

    // Load clients on mount
    useEffect(() => {
        if (isOpen) {
            loadClients();
            // Reset form
            setSelectedCustomer("");
            setDueDate("");
            setItems([{ id: crypto.randomUUID(), description: "", qty: 1, rate: 0 }]);
            setError(null);
            setSuccess(null);
        }
    }, [isOpen]);

    const loadClients = async () => {
        setLoadingClients(true);
        try {
            const res = await fetch('/api/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
            }
        } catch (e) {
            console.error("Error loading clients:", e);
        } finally {
            setLoadingClients(false);
        }
    };

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), description: "", qty: 1, rate: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const getTotal = () => {
        return items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        // Validations
        if (!selectedCustomer) {
            setError("Selecciona un cliente");
            return;
        }
        if (!dueDate) {
            setError("Selecciona la fecha de vencimiento");
            return;
        }
        if (items.some(item => !item.description.trim())) {
            setError("Todos los items deben tener descripción");
            return;
        }
        if (items.some(item => item.rate <= 0)) {
            setError("El precio de cada item debe ser mayor a 0");
            return;
        }

        setIsSaving(true);

        try {
            const res = await fetch('/api/invoices', { // TODO: implement invoices API
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: selectedCustomer,
                    due_date: dueDate,
                    items: items.map(item => ({
                        description: item.description,
                        qty: item.qty,
                        rate: item.rate
                    }))
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setSuccess(`✅ Factura ${data.invoice_name} creada exitosamente`);
                setTimeout(() => {
                    onSuccess?.(data.invoice_name);
                    onClose();
                }, 1500);
            } else {
                setError(data.error || "Error al crear factura");
            }
        } catch (e: any) {
            setError(e.message || "Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-lumen-priority to-amber-500 px-6 py-4 flex justify-between items-center flex-shrink-0">
                        <div className="flex items-center gap-3 text-white">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Nueva Factura</h2>
                                <p className="text-xs text-white/80">Se creará en ERPNext automáticamente</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-sm">
                                <Check className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        {/* Customer Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                Cliente *
                            </label>
                            {loadingClients ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm p-3 bg-gray-50 rounded-lg">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Cargando clientes...
                                </div>
                            ) : (
                                <select
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all"
                                >
                                    <option value="">Seleccionar cliente...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.name}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                Fecha de Vencimiento *
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all"
                            />
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-700">Items / Servicios</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agregar Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-gray-400">ITEM {index + 1}</span>
                                            {items.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(item.id)}
                                                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                placeholder="Descripción del servicio"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-lumen-priority/20"
                                            />

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-bold">Cantidad</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.qty}
                                                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-lumen-priority/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-bold">Precio Unitario ($)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-lumen-priority/20"
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-right text-sm font-medium text-gray-600">
                                                Subtotal: <span className="text-gray-900 font-bold">${(item.qty * item.rate).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-gray-900 text-white rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-lumen-priority" />
                                <span className="font-medium">Total</span>
                            </div>
                            <span className="text-2xl font-bold">${getTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 pt-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
                        <Button
                            variant="ghost"
                            className="flex-1"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-lumen-priority text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                            onClick={handleSubmit}
                            disabled={isSaving || !selectedCustomer || !dueDate || items.length === 0}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Crear Factura
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
