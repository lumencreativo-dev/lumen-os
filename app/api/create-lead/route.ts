import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhooks";
import { notifyNewLead } from "@/lib/discord";
import { sendLeadConfirmationEmail, sendTeamNotificationEmail } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nombre, email, whatsapp, institucion, necesidad, tipoInstitucion, instagram } = body;

        // 1. Validar datos básicos
        if (!nombre || !email) {
            return NextResponse.json(
                { error: "Faltan datos obligatorios (nombre, email)" },
                { status: 400 }
            );
        }

        // 2. Buscar el pipeline y columna por defecto
        const defaultPipeline = await prisma.pipeline.findFirst({
            where: { isDefault: true },
            include: { columns: { orderBy: { order: 'asc' }, take: 1 } },
        });

        // 3. Crear Lead en la base de datos
        const lead = await prisma.lead.create({
            data: {
                name: `LEAD-${Date.now()}`,
                leadName: nombre,
                title: institucion || 'Contacto desde Landing',
                email: email,
                phone: whatsapp,
                source: 'website',
                notes: necesidad ? `Tipo: ${tipoInstitucion || 'N/A'}\nInstagram: ${instagram || 'N/A'}\nNecesidad: ${necesidad}` : undefined,
                status: 'Lead',
                pipelineId: defaultPipeline?.id,
                columnId: defaultPipeline?.columns[0]?.id,
            },
        });

        console.log(`✅ Lead creado: ${lead.name}`);

        // 4. Notificaciones (todas en paralelo, sin bloquear)
        const notifications = [];

        // Discord
        notifications.push(
            notifyNewLead({
                nombre,
                email,
                whatsapp,
                institucion,
                necesidad,
            }).catch(e => console.error("Discord error:", e))
        );

        // Webhook n8n
        notifications.push(
            sendWebhook('lead.created', {
                lead: {
                    id: lead.name,
                    name: nombre,
                    email,
                    phone: whatsapp,
                    institution: institucion,
                    instagram,
                    need: necesidad,
                    source: "Landing Page",
                },
            }).catch(e => console.error("Webhook error:", e))
        );

        // Email de confirmación al lead
        notifications.push(
            sendLeadConfirmationEmail({
                nombre,
                email,
                whatsapp: whatsapp || '',
                institucion,
                instagram,
                necesidad,
                leadId: lead.name,
            }).catch(e => console.error("Email confirmación error:", e))
        );

        // Email al equipo
        notifications.push(
            sendTeamNotificationEmail({
                nombre,
                email,
                whatsapp: whatsapp || '',
                institucion,
                instagram,
                necesidad,
                leadId: lead.name,
            }).catch(e => console.error("Email equipo error:", e))
        );

        // Telegram
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        if (telegramToken && telegramChatId) {
            const message = `🚀 *Nuevo Lead desde la Web*\n\n👤 *Nombre:* ${nombre}\n🏢 *Institución:* ${institucion || 'N/A'}\n📧 *Email:* ${email}\n📱 *WhatsApp:* ${whatsapp || 'N/A'}\n📝 *Necesidad:* ${necesidad || 'No especificada'}`;

            notifications.push(
                fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: telegramChatId, text: message, parse_mode: "Markdown" }),
                }).catch(e => console.error("Telegram error:", e))
            );
        }

        // Ejecutar todas las notificaciones en paralelo
        await Promise.allSettled(notifications);

        return NextResponse.json({
            success: true,
            lead: lead.name,
            message: "Lead procesado correctamente",
        });
    } catch (error) {
        console.error("❌ Error CRÍTICO en create-lead:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
