import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhooks";
import { notifyNewClient } from "@/lib/discord";

export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                socialCredentials: true,
                _count: {
                    select: {
                        invoices: true,
                        deliverables: true,
                        tasks: true,
                    },
                },
            },
        });

        return NextResponse.json({ clients, source: "prisma" });
    } catch (error) {
        console.error("GET Clients Error:", error);
        return NextResponse.json({ clients: [], error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, whatsapp, instagram, website, industry, address, taxId, contactPerson, paymentDay, notes, socialCredentials } = body;

        if (!name) {
            return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
        }

        const newClient = await prisma.client.create({
            data: {
                name: name.trim(),
                email,
                phone,
                whatsapp,
                instagram: instagram?.replace('@', '').trim(),
                website,
                industry: industry?.trim(),
                address,
                taxId,
                contactPerson,
                paymentDay,
                notes,
                socialCredentials: socialCredentials?.length ? {
                    create: socialCredentials.map((sc: any) => ({
                        platform: sc.platform,
                        username: sc.username,
                        password: sc.password,
                    })),
                } : undefined,
            },
            include: { socialCredentials: true },
        });

        // Notificaciones
        sendWebhook('client.created', {
            client: newClient,
            portalLink: `/portal/${newClient.portalToken}`,
        }).catch(console.error);

        notifyNewClient({
            nombre: newClient.name,
            email: newClient.email || undefined,
            instagram: newClient.instagram || undefined,
            industry: newClient.industry || undefined,
            portalLink: `/portal/${newClient.portalToken}`,
        }).catch(console.error);

        // Telegram
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        if (telegramToken && telegramChatId) {
            const message = `🎉 *¡NUEVO CLIENTE!*\n\n📌 *Nombre:* ${newClient.name}\n📸 *Instagram:* ${newClient.instagram ? `@${newClient.instagram}` : 'N/A'}\n🏢 *Rubro:* ${newClient.industry || 'N/A'}\n📞 *Contacto:* ${newClient.phone || 'N/A'}\n🔗 *Portal:* /portal/${newClient.portalToken}`;

            fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: telegramChatId, text: message, parse_mode: "Markdown" }),
            }).catch(console.error);
        }

        return NextResponse.json({
            success: true,
            client: newClient,
            portalLink: `/portal/${newClient.portalToken}`,
        });
    } catch (error) {
        console.error("POST Client Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "id requerido" }, { status: 400 });
        }

        // Manejar credenciales sociales por separado
        const { socialCredentials, ...clientUpdates } = updates;

        const updatedClient = await prisma.client.update({
            where: { id },
            data: {
                name: clientUpdates.name,
                email: clientUpdates.email,
                phone: clientUpdates.phone,
                whatsapp: clientUpdates.whatsapp,
                instagram: clientUpdates.instagram?.replace('@', '').trim(),
                website: clientUpdates.website,
                industry: clientUpdates.industry,
                address: clientUpdates.address,
                taxId: clientUpdates.taxId,
                contactPerson: clientUpdates.contactPerson,
                paymentDay: clientUpdates.paymentDay,
                notes: clientUpdates.notes,
                logo: clientUpdates.logo,
            },
            include: { socialCredentials: true },
        });

        // Si se enviaron credenciales sociales, reemplazarlas
        if (socialCredentials) {
            await prisma.socialCredential.deleteMany({ where: { clientId: id } });
            if (socialCredentials.length > 0) {
                await prisma.socialCredential.createMany({
                    data: socialCredentials.map((sc: any) => ({
                        clientId: id,
                        platform: sc.platform,
                        username: sc.username,
                        password: sc.password,
                    })),
                });
            }
        }

        return NextResponse.json({ success: true, client: updatedClient });
    } catch (error) {
        console.error("PUT Client Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "id requerido" }, { status: 400 });
        }

        await prisma.client.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Client Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
