import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhooks";
import { notifyDeliverableUpdate } from "@/lib/discord";

export async function GET() {
    try {
        const deliverables = await prisma.deliverable.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
                feedback: { orderBy: { createdAt: 'desc' } },
                versions: { orderBy: { version: 'desc' } },
            },
        });

        return NextResponse.json({ deliverables });
    } catch (error) {
        console.error("API Deliverables Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const newDeliverable = await prisma.deliverable.create({
            data: {
                title: body.title,
                description: body.description,
                type: (body.type || 'IMAGE').toUpperCase(),
                url: body.url || '',
                carouselUrls: body.carouselUrls || [],
                status: 'PENDING',
                priority: (body.priority || 'NORMAL').toUpperCase(),
                currentVersion: 1,
                deadline: body.deadline ? new Date(body.deadline) : undefined,
                clientId: body.clientId,
                clientName: body.clientName || body.client,
                createdById: body.createdById,
                tags: body.tags || [],
                versions: {
                    create: {
                        version: 1,
                        url: body.url || '',
                        carouselUrls: body.carouselUrls || [],
                        notes: 'Versión inicial',
                    },
                },
            },
            include: {
                client: { select: { id: true, name: true } },
                versions: true,
            },
        });

        sendWebhook('deliverable.created', {
            deliverable: newDeliverable,
        }).catch(console.error);

        return NextResponse.json({ success: true, deliverable: newDeliverable });
    } catch (error) {
        console.error("API Deliverables POST Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const existing = await prisma.deliverable.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const statusChanged = updates.status && updates.status !== existing.status;

        const updatedDeliverable = await prisma.deliverable.update({
            where: { id },
            data: {
                title: updates.title,
                description: updates.description,
                type: updates.type?.toUpperCase(),
                url: updates.url,
                status: updates.status?.toUpperCase(),
                priority: updates.priority?.toUpperCase(),
                deadline: updates.deadline ? new Date(updates.deadline) : undefined,
                clientId: updates.clientId,
                clientName: updates.clientName,
                tags: updates.tags,
                approvedAt: updates.status === 'APPROVED' ? new Date() : undefined,
            },
            include: {
                client: { select: { id: true, name: true } },
                feedback: true,
            },
        });

        // Notificaciones por cambio de estado
        if (statusChanged) {
            const clientName = updatedDeliverable.client?.name || updatedDeliverable.clientName || 'N/A';

            if (updates.status?.toUpperCase() === 'APPROVED') {
                sendWebhook('deliverable.approved', { deliverable: updatedDeliverable }).catch(console.error);
                notifyDeliverableUpdate({
                    titulo: updatedDeliverable.title,
                    cliente: clientName,
                    estado: 'aprobado',
                }).catch(console.error);
            } else if (updates.status?.toUpperCase() === 'CHANGES_REQUESTED') {
                sendWebhook('deliverable.changes_requested', { deliverable: updatedDeliverable, feedback: updates.feedback }).catch(console.error);
                notifyDeliverableUpdate({
                    titulo: updatedDeliverable.title,
                    cliente: clientName,
                    estado: 'cambios_solicitados',
                    feedback: updates.feedback,
                }).catch(console.error);
            }
        }

        return NextResponse.json({ success: true, deliverable: updatedDeliverable });
    } catch (error) {
        console.error("API Deliverables PUT Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
