export interface PlannerClient {
    id: string;
    name: string;
    color: string;
    created_at?: string;
    avatar?: string;
    max_revisions?: number;
    contact_phone?: string;
    portal_welcome_msg?: string;
}

export interface RevisionRecord {
    round: number;
    date: string;
    feedback: string;
}

export interface PlannerItem {
    id: string;
    client_id: string;
    date: string;
    fmt: string;
    title: string;
    status: string;
    note: string;
    canva_link?: string;
    // Extended fields
    hour?: string;
    responsible?: string;
    pillar?: string;
    platforms?: string[];
    copy?: string;
    hashtags?: string;
    cta?: string;
    visual_idea?: string;
    material_link?: string;
    published_link?: string;
    // Approvals & revisions
    revision_count?: number;
    approved_at?: string;
    approved_by?: string;
    revision_history?: RevisionRecord[];
    // Runtime flags
    rule?: boolean;
    ruleId?: string;
    freq?: string;
}

export interface PlannerRule {
    id: string;
    client_id: string;
    date: string;
    freq: string;
    fmt: string;
    title: string;
    status: string;
    note: string;
    hour?: string;
    responsible?: string;
    pillar?: string;
    platforms?: string[];
    copy?: string;
    hashtags?: string;
    cta?: string;
    visual_idea?: string;
    material_link?: string;
    published_link?: string;
    revision_count?: number;
    approved_at?: string;
    approved_by?: string;
    revision_history?: RevisionRecord[];
}

export interface PlannerTask {
    id: string;
    client_id: string;
    month: string;
    text: string;
    prio: number;
    date: string;
    done: boolean;
    created_at?: number;
}

export interface PlannerMilestone {
    id: string;
    client_id: string;
    title: string;
    date: string;
    recurring: boolean;
    emoji: string;
}

export type LeadStage = 'nuevo' | 'contactado' | 'calificado' | 'propuesta' | 'ganado' | 'perdido';

export interface SuiteLead {
    id: string;
    name: string;
    email?: string;
    whatsapp?: string;
    source: 'Instagram' | 'Web' | 'WhatsApp' | 'Referido' | 'Evento' | 'Otro';
    interest?: string;
    budget?: string;
    stage: LeadStage;
    estimated_value?: number;
    next_action?: string;
    followup_date?: string;
    loss_reason?: string;
    notes?: string;
    created_at?: string;
}

export interface SuiteMetric {
    id: string;
    client_id: string;
    platform: 'Instagram' | 'TikTok' | 'Facebook' | 'LinkedIn' | 'YouTube';
    period: string; // Ej: '2026-10' o 'Semana 43'
    followers?: number;
    reach?: number;
    impressions?: number;
    interactions?: number;
    clicks?: number;
    messages?: number;
    notes?: string;
    created_at?: string;
}
