"use client";

import { createClient } from "@/utils/supabase/client";
import { Deliverable, DeliverableStatus, DeliverableFeedback, DeliverableVersion } from "@/types/deliverables";

// ─── Helpers ────────────────────────────────────────────────────────────────

function rowToDeliverable(row: any): Deliverable {
    return {
        id: row.id,
        title: row.title,
        clientId: row.clientId,
        clientName: row.clientName || row.Client?.name || "Sin cliente",
        type: row.type?.toLowerCase() ?? "image",
        url: row.url ?? "",
        carouselUrls: row.carouselUrls ?? [],
        status: row.status?.toLowerCase() ?? "pending",
        priority: row.priority?.toLowerCase() ?? "normal",
        description: row.description ?? "",
        deadline: row.deadline ?? undefined,
        currentVersion: row.currentVersion ?? 1,
        tags: row.tags ?? [],
        assignedTo: row.assignedTo ?? undefined,
        approvedAt: row.approvedAt ?? undefined,
        lastViewedAt: row.lastViewedAt ?? undefined,
        createdAt: row.createdAt,
        feedback: (row.DeliverableFeedback ?? []).map((f: any): DeliverableFeedback => ({
            id: f.id,
            date: f.createdAt,
            comment: f.comment,
            author: f.author,
            authorName: f.authorName,
            version: f.version,
        })),
        versions: (row.DeliverableVersion ?? []).map((v: any): DeliverableVersion => ({
            version: v.version,
            url: v.url,
            carouselUrls: v.carouselUrls ?? [],
            createdAt: v.createdAt,
            createdBy: v.createdBy ?? undefined,
            notes: v.notes ?? undefined,
        })),
    };
}

// ─── Service ────────────────────────────────────────────────────────────────

export const deliverableService = {

    getAll: async (): Promise<Deliverable[]> => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("Deliverable")
                .select(`
                    *,
                    Client:clientId ( name ),
                    DeliverableFeedback ( * ),
                    DeliverableVersion ( * )
                `)
                .order("createdAt", { ascending: false });

            if (error) {
                console.error("Supabase getAll deliverables:", error.message);
                return [];
            }
            return (data ?? []).map(rowToDeliverable);
        } catch (e) {
            console.error("deliverableService.getAll error:", e);
            return [];
        }
    },

    getById: async (id: string): Promise<Deliverable | undefined> => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("Deliverable")
                .select(`
                    *,
                    Client:clientId ( name ),
                    DeliverableFeedback ( * ),
                    DeliverableVersion ( * )
                `)
                .eq("id", id)
                .single();

            if (error || !data) return undefined;
            return rowToDeliverable(data);
        } catch (e) {
            return undefined;
        }
    },

    getByClientId: async (clientId: string): Promise<Deliverable[]> => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("Deliverable")
                .select(`
                    *,
                    Client:clientId ( name ),
                    DeliverableFeedback ( * ),
                    DeliverableVersion ( * )
                `)
                .eq("clientId", clientId)
                .order("createdAt", { ascending: false });

            if (error) return [];
            return (data ?? []).map(rowToDeliverable);
        } catch (e) {
            return [];
        }
    },

    add: async (item: Deliverable): Promise<string | null> => {
        try {
            const supabase = createClient();

            // 1. Insert deliverable
            const { data, error } = await supabase
                .from("Deliverable")
                .insert({
                    title: item.title,
                    clientId: item.clientId || null,
                    clientName: item.clientName,
                    type: item.type,
                    url: item.url,
                    carouselUrls: item.carouselUrls ?? [],
                    status: item.status,
                    priority: item.priority ?? "normal",
                    description: item.description ?? "",
                    deadline: item.deadline ?? null,
                    currentVersion: 1,
                    tags: item.tags ?? [],
                })
                .select("id")
                .single();

            if (error || !data) {
                console.error("Supabase insert deliverable:", error?.message);
                return null;
            }

            const deliverableId = data.id;

            // 2. Insert version 1
            await supabase.from("DeliverableVersion").insert({
                deliverableId,
                version: 1,
                url: item.url,
                carouselUrls: item.carouselUrls ?? [],
                notes: "Versión inicial",
                createdBy: item.assignedTo ?? "Equipo Lumen",
            });

            return deliverableId;
        } catch (e) {
            console.error("deliverableService.add error:", e);
            return null;
        }
    },

    updateStatus: async (
        id: string,
        status: DeliverableStatus,
        feedback?: DeliverableFeedback
    ) => {
        try {
            const supabase = createClient();

            // Update status
            await supabase
                .from("Deliverable")
                .update({
                    status,
                    approvedAt: status === "approved" ? new Date().toISOString() : null,
                })
                .eq("id", id);

            // Insert feedback if provided
            if (feedback?.comment) {
                await supabase.from("DeliverableFeedback").insert({
                    deliverableId: id,
                    comment: feedback.comment,
                    author: feedback.author ?? "team",
                    authorName: feedback.authorName ?? "Equipo Lumen",
                    version: feedback.version ?? 1,
                });
            }
        } catch (e) {
            console.error("deliverableService.updateStatus error:", e);
        }
    },

    addVersion: async (
        deliverableId: string,
        version: number,
        url: string,
        carouselUrls: string[] = [],
        notes: string = "",
        createdBy: string = "Equipo Lumen"
    ) => {
        try {
            const supabase = createClient();

            // Insert new version
            await supabase.from("DeliverableVersion").insert({
                deliverableId,
                version,
                url,
                carouselUrls,
                notes,
                createdBy,
            });

            // Update deliverable currentVersion + url
            await supabase
                .from("Deliverable")
                .update({ currentVersion: version, url, status: "in_revision" })
                .eq("id", deliverableId);
        } catch (e) {
            console.error("deliverableService.addVersion error:", e);
        }
    },

    delete: async (id: string): Promise<boolean> => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("Deliverable")
                .delete()
                .eq("id", id);
            return !error;
        } catch (e) {
            return false;
        }
    },

    /** Keep for backward compat — ID now comes from Supabase */
    createId: () => "",
};
