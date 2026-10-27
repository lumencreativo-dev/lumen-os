export interface PlannerClient {
    id: string;
    name: string;
    color: string;
    created_at?: string;
    avatar?: string;
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
