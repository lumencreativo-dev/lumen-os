/**
 * Discord Webhook Notifications
 * 
 * Envía mensajes con embeds bonitos a los canales de Discord de Lumen.
 * Cada canal tiene su propio webhook para mantener la organización.
 */

type DiscordChannel = 'leads' | 'finanzas' | 'clientes' | 'entregables' | 'tareas';

const WEBHOOK_MAP: Record<DiscordChannel, string | undefined> = {
    leads: process.env.DISCORD_WEBHOOK_LEADS,
    finanzas: process.env.DISCORD_WEBHOOK_FINANZAS,
    clientes: process.env.DISCORD_WEBHOOK_CLIENTES,
    entregables: process.env.DISCORD_WEBHOOK_ENTREGABLES,
    tareas: process.env.DISCORD_WEBHOOK_TAREAS,
};

// Colores para los embeds de Discord (en decimal)
const COLORS = {
    success: 0x22c55e,   // Verde
    warning: 0xf59e0b,   // Amarillo
    error: 0xef4444,     // Rojo
    info: 0x3b82f6,      // Azul
    primary: 0xf7931e,   // Naranja Lumen
    purple: 0x8b5cf6,    // Morado
};

interface DiscordEmbed {
    title: string;
    description?: string;
    color: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: { text: string };
    timestamp?: string;
}

interface DiscordMessage {
    username?: string;
    avatar_url?: string;
    embeds: DiscordEmbed[];
}

async function sendToDiscord(channel: DiscordChannel, message: DiscordMessage): Promise<void> {
    const webhookUrl = WEBHOOK_MAP[channel];

    if (!webhookUrl) {
        console.warn(`⚠️ Discord webhook no configurado para canal: ${channel}`);
        return;
    }

    // Agregar branding por defecto
    message.username = message.username || 'Lumen OS';
    message.avatar_url = message.avatar_url || 'https://i.imgur.com/AfFp7pu.png';

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (res.ok) {
            console.log(`✅ Discord [#${channel}] notificación enviada`);
        } else {
            console.warn(`⚠️ Discord [#${channel}] error: ${res.status} ${res.statusText}`);
        }
    } catch (error) {
        console.error(`❌ Discord [#${channel}] error de conexión:`, error);
    }
}

// ============ FUNCIONES PÚBLICAS ============

/** Nuevo lead desde el formulario de contacto */
export async function notifyNewLead(data: {
    nombre: string;
    email: string;
    whatsapp?: string;
    institucion?: string;
    necesidad?: string;
}) {
    await sendToDiscord('leads', {
        embeds: [{
            title: '🔔 Nuevo Lead Recibido',
            color: COLORS.primary,
            fields: [
                { name: '👤 Nombre', value: data.nombre, inline: true },
                { name: '🏢 Institución', value: data.institucion || 'No especificada', inline: true },
                { name: '📧 Email', value: data.email, inline: true },
                { name: '📱 WhatsApp', value: data.whatsapp || 'No proporcionado', inline: true },
                { name: '📝 Necesidad', value: data.necesidad || 'No especificada' },
            ],
            footer: { text: 'Lumen OS • CRM' },
            timestamp: new Date().toISOString(),
        }],
    });
}

/** Nuevo cliente creado en el sistema */
export async function notifyNewClient(data: {
    nombre: string;
    email?: string;
    instagram?: string;
    industry?: string;
    portalLink?: string;
}) {
    await sendToDiscord('clientes', {
        embeds: [{
            title: '🌟 Nuevo Cliente Registrado',
            color: COLORS.success,
            fields: [
                { name: '🏢 Nombre', value: data.nombre, inline: true },
                { name: '📧 Email', value: data.email || 'N/A', inline: true },
                { name: '📸 Instagram', value: data.instagram ? `@${data.instagram}` : 'N/A', inline: true },
                { name: '🏭 Rubro', value: data.industry || 'N/A', inline: true },
                ...(data.portalLink ? [{ name: '🔗 Portal', value: data.portalLink }] : []),
            ],
            footer: { text: 'Lumen OS • Clientes' },
            timestamp: new Date().toISOString(),
        }],
    });
}

/** Entregable aprobado o con cambios solicitados */
export async function notifyDeliverableUpdate(data: {
    titulo: string;
    cliente: string;
    estado: 'aprobado' | 'cambios_solicitados';
    feedback?: string;
}) {
    const isApproved = data.estado === 'aprobado';

    await sendToDiscord('entregables', {
        embeds: [{
            title: isApproved ? '✅ Entregable Aprobado' : '⚠️ Cambios Solicitados',
            color: isApproved ? COLORS.success : COLORS.warning,
            fields: [
                { name: '📄 Título', value: data.titulo, inline: true },
                { name: '🏢 Cliente', value: data.cliente, inline: true },
                ...(data.feedback ? [{ name: '💬 Comentarios', value: data.feedback }] : []),
            ],
            footer: { text: 'Lumen OS • Entregables' },
            timestamp: new Date().toISOString(),
        }],
    });
}

/** Factura creada o pago recibido */
export async function notifyFinanceEvent(data: {
    tipo: 'factura_creada' | 'pago_recibido' | 'factura_vencida';
    cliente: string;
    monto: number;
    moneda?: string;
    numeroFactura?: string;
}) {
    const titles: Record<string, string> = {
        factura_creada: '📄 Nueva Factura Creada',
        pago_recibido: '💰 Pago Recibido',
        factura_vencida: '🚨 Factura Vencida',
    };

    const colors: Record<string, number> = {
        factura_creada: COLORS.info,
        pago_recibido: COLORS.success,
        factura_vencida: COLORS.error,
    };

    await sendToDiscord('finanzas', {
        embeds: [{
            title: titles[data.tipo],
            color: colors[data.tipo],
            fields: [
                { name: '🏢 Cliente', value: data.cliente, inline: true },
                { name: '💵 Monto', value: `${data.moneda || 'USD'} ${data.monto.toLocaleString()}`, inline: true },
                ...(data.numeroFactura ? [{ name: '📋 Factura', value: data.numeroFactura, inline: true }] : []),
            ],
            footer: { text: 'Lumen OS • Finanzas' },
            timestamp: new Date().toISOString(),
        }],
    });
}

/** Tarea actualizada */
export async function notifyTaskUpdate(data: {
    titulo: string;
    estado: string;
    asignado?: string;
    cliente?: string;
}) {
    const stateEmojis: Record<string, string> = {
        'OPEN': '🆕',
        'WORKING': '🔨',
        'PENDING_REVIEW': '👁️',
        'COMPLETED': '✅',
        'CANCELLED': '❌',
    };

    await sendToDiscord('tareas', {
        embeds: [{
            title: `${stateEmojis[data.estado] || '📋'} Tarea: ${data.estado}`,
            color: data.estado === 'COMPLETED' ? COLORS.success : COLORS.info,
            fields: [
                { name: '📋 Título', value: data.titulo, inline: true },
                { name: '📊 Estado', value: data.estado, inline: true },
                ...(data.asignado ? [{ name: '👤 Asignado', value: data.asignado, inline: true }] : []),
                ...(data.cliente ? [{ name: '🏢 Cliente', value: data.cliente, inline: true }] : []),
            ],
            footer: { text: 'Lumen OS • Tareas' },
            timestamp: new Date().toISOString(),
        }],
    });
}
