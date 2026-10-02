export interface SocialCredential {
    platform: string;    // e.g., 'Instagram', 'Facebook', 'TikTok'
    username: string;
    password: string;
}

export interface Client {
    id: string;      // Internal ID (e.g., 'hsa')
    name: string;    // Full Name
    erpId?: string;   // ERPNext ID reference
    portalToken: string;   // Secret access token for URL
    logo?: string; logoUrl?: string; brandColor?: string;   // Optional logo URL
    instagram?: string;    // Instagram handle (sin @)
    industry?: string;     // Rubro/Industria
    contactPhone?: string; // Teléfono de contacto
    whatsapp?: string;     // WhatsApp (puede ser diferente al teléfono)
    paymentDay?: string;   // Día de pago mensual
    contactName?: string; // Nombre del encargado
    email?: string; // Email de contacto
    address?: string; // Dirección
    taxId?: string; // RUT/NIT
    website?: string; // Sitio Web
    outstandingBalance?: number; // Saldo pendiente desde ERPNext
    createdAt?: string;    // ISO date de creación
    socialCredentials?: SocialCredential[]; // Credenciales de redes sociales
    notes?: string; // Notas internas sobre el cliente
}

