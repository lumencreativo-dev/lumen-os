import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebhook, validateApiKey } from "@/lib/webhooks";
import { notifyNewLead } from "@/lib/discord";

export async function GET() {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                pipeline: true,
                column: true,
                assignedTo: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ leads });
    } catch (error) {
        console.error("API Leads Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Buscar la columna por defecto si no se especifica
        let columnId = body.columnId;
        let pipelineId = body.pipelineId;

        if (!columnId && !pipelineId) {
            const defaultPipeline = await prisma.pipeline.findFirst({
                where: { isDefault: true },
                include: { columns: { orderBy: { order: 'asc' }, take: 1 } },
            });
            if (defaultPipeline) {
                pipelineId = defaultPipeline.id;
                columnId = defaultPipeline.columns[0]?.id;
            }
        }

        const newLead = await prisma.lead.create({
            data: {
                name: `LEAD-${Date.now()}`,
                leadName: body.lead_name || body.leadName || body.nombre || 'Sin nombre',
                title: body.title,
                email: body.email_id || body.email,
                phone: body.mobile_no || body.phone || body.whatsapp,
                source: body.source || 'dashboard',
                value: body.value ? parseFloat(body.value) : undefined,
                notes: body.notes || body.necesidad,
                tags: body.tags || [],
                status: body.status || 'Lead',
                pipelineId,
                columnId,
                assignedToId: body.assignedToId,
            },
            include: { pipeline: true, column: true },
        });

        // Webhooks y notificaciones
        sendWebhook('lead.created', {
            lead: newLead,
            source: body.source || 'dashboard',
        }).catch(console.error);

        notifyNewLead({
            nombre: newLead.leadName,
            email: newLead.email || '',
            whatsapp: newLead.phone || undefined,
            institucion: newLead.leadName,
            necesidad: newLead.title || undefined,
        }).catch(console.error);

        return NextResponse.json({ lead: newLead });
    } catch (error) {
        console.error("POST Lead Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { name, id, ...updates } = body;

        const leadId = id || name;
        if (!leadId) {
            return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
        }

        // Buscar lead por id o por name
        const existingLead = await prisma.lead.findFirst({
            where: { OR: [{ id: leadId }, { name: leadId }] },
        });

        if (!existingLead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        const stageChanged = updates.columnId && updates.columnId !== existingLead.columnId;

        const updatedLead = await prisma.lead.update({
            where: { id: existingLead.id },
            data: {
                leadName: updates.leadName || updates.lead_name,
                title: updates.title,
                email: updates.email || updates.email_id,
                phone: updates.phone || updates.mobile_no,
                source: updates.source,
                value: updates.value ? parseFloat(updates.value) : undefined,
                notes: updates.notes,
                tags: updates.tags,
                status: updates.status,
                pipelineId: updates.pipelineId,
                columnId: updates.columnId,
                assignedToId: updates.assignedToId,
                lastContactedAt: updates.lastContactedAt ? new Date(updates.lastContactedAt) : undefined,
            },
            include: { pipeline: true, column: true },
        });

        // Webhook
        if (stageChanged) {
            sendWebhook('lead.stage_changed', {
                lead: updatedLead,
                previousStage: existingLead.columnId,
                newStage: updates.columnId,
            }).catch(console.error);
        } else {
            sendWebhook('lead.updated', {
                lead: updatedLead,
                changes: Object.keys(updates),
            }).catch(console.error);
        }

        return NextResponse.json({ success: true, lead: updatedLead });
    } catch (error) {
        console.error("PUT Lead Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
