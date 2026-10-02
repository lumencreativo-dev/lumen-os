"use client";

import { Client } from "@/types/clients";

// Client Service - fetches from Supabase via API
export const clientService = {
    getAll: async (): Promise<Client[]> => {
        try {
            const res = await fetch('/api/clients');
            if (res.ok) {
                const data = await res.json();
                return data.clients || [];
            }
        } catch (e) {
            console.error("Error fetching clients", e);
        }
        return [];
    },

    getById: async (id: string): Promise<Client | undefined> => {
        const all = await clientService.getAll();
        return all.find(c => c.id === id);
    },

    getByErpId: async (erpId: string): Promise<Client | undefined> => {
        const all = await clientService.getAll();
        return all.find(c => c.erpId === erpId);
    },

    getByPortalToken: async (token: string): Promise<Client | undefined> => {
        const all = await clientService.getAll();
        return all.find(c => c.portalToken === token);
    },

    create: async (clientData: Partial<Client>): Promise<Client | null> => {
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });
            if (res.ok) {
                const data = await res.json();
                return data.client || null;
            }
        } catch (e) {
            console.error("Error creating client", e);
        }
        return null;
    },

    update: async (erpId: string, clientData: Partial<Client>): Promise<Client | null> => {
        try {
            const res = await fetch('/api/clients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ erpId, ...clientData })
            });
            if (res.ok) {
                const data = await res.json();
                return data.client || null;
            }
        } catch (e) {
            console.error("Error updating client", e);
        }
        return null;
    },

    delete: async (erpId: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/clients?erpId=${encodeURIComponent(erpId)}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (e) {
            console.error("Error deleting client", e);
        }
        return false;
    }
};
