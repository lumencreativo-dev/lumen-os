"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Invoice {
    id: string; // name in ERPNext (SINV-xxx)
    number: string;
    date: string;
    amount: number;
    status: "paid" | "unpaid" | "overdue";
    pdfUrl?: string; // We build this dynamically
}

interface Props {
    // If provided, fetches real data. If not, uses externalInvoices or mocks.
    clientName?: string;
    invoices?: Invoice[];
}

export function InvoiceList({ clientName, invoices: externalInvoices }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>(externalInvoices || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (clientName) {
            fetchInvoices();
        } else if (externalInvoices) {
            setInvoices(externalInvoices);
        }
    }, [clientName, externalInvoices]);

    const fetchInvoices = async () => {
        if (!clientName) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/deliverables`); // TODO: Replace with /api/invoices when implemented
            if (res.ok) {
                const data = await res.json();
                const fetchedInvoices = (data.invoices || []).map((inv: any) => ({
                    id: inv.name,
                    number: inv.name,
                    date: inv.posting_date,
                    amount: inv.grand_total,
                    status: inv.status === 'Paid' ? 'paid' : inv.status === 'Overdue' ? 'overdue' : 'unpaid',
                }));
                setInvoices(fetchedInvoices);
            } else {
                setError("No se pudieron cargar las facturas");
            }
        } catch (e) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (invoiceId: string) => {
        window.open(`/api/invoices/${invoiceId}/pdf`, '_blank'); // TODO: implement PDF route
    };

    const statusStyles = {
        paid: "bg-green-50 text-green-700 border-green-100",
        unpaid: "bg-amber-50 text-amber-700 border-amber-100",
        overdue: "bg-red-50 text-red-700 border-red-100"
    };

    const statusLabels = {
        paid: "Pagada",
        unpaid: "Pendiente",
        overdue: "Vencida"
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-lumen-priority" />
            </div>
        );
    }

    if (error && !invoices.length) {
        return (
            <div className="bg-red-50 rounded-xl border border-red-100 p-8 flex flex-col items-center justify-center text-red-600">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p>{error}</p>
                <Button variant="link" onClick={fetchInvoices} className="text-red-700 underline mt-2">Reintentar</Button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Factura</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Monto</th>
                            <th className="px-6 py-4 text-center">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        {inv.number}
                                        {inv.status === 'overdue' && <div className="text-[10px] text-red-500 font-bold">Vencida</div>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyles[inv.status]}`}>
                                        {statusLabels[inv.status]}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-medium text-gray-900">
                                    ${inv.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 text-gray-400 hover:text-lumen-priority hover:bg-amber-50"
                                        title="Descargar PDF"
                                        onClick={() => handleDownload(inv.id)}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {invoices.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No tienes facturas disponibles</p>
                </div>
            )}
        </div>
    );
}
