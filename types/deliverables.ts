export type DeliverableType = 'image' | 'video' | 'document' | 'link' | 'carousel';

export type DeliverableStatus = 'pending' | 'approved' | 'changes_requested' | 'in_revision' | 'published';

export type DeliverablePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface DeliverableFeedback {
    id: string;              // Unique feedback ID
    date: string;            // ISO date
    comment: string;
    author: 'client' | 'team';
    authorName?: string;     // Display name
    version?: number;        // Which version this feedback applies to
}

export interface DeliverableVersion {
    version: number;         // 1, 2, 3...
    url: string;             // Content URL for this version
    carouselUrls?: string[]; // For carousel type
    createdAt: string;       // When this version was uploaded
    createdBy?: string;      // Team member who uploaded
    notes?: string;          // Internal notes about changes
}

export interface Deliverable {
    id: string;
    title: string;
    clientName: string;      // Keeps name for legacy/display
    clientId?: string;       // Link to Real Client ID
    type: DeliverableType;
    url: string;             // Primary URL (current version)
    carouselUrls?: string[]; // Extra slides for carousel
    status: DeliverableStatus;
    createdAt: string;
    feedback?: DeliverableFeedback[];
    description?: string;

    // New fields for enhanced functionality
    currentVersion: number;           // Current version number
    versions?: DeliverableVersion[];  // History of all versions
    deadline?: string;                // ISO date - when client needs to approve by
    priority?: DeliverablePriority;   // Urgency level
    assignedTo?: string;              // Team member responsible
    tags?: string[];                  // Categorization
    lastViewedAt?: string;            // When client last viewed
    approvedAt?: string;              // When approved
    approvedVersion?: number;         // Which version was approved
}

export const MOCK_DELIVERABLES: Deliverable[] = [
    {
        id: 'del-001',
        title: 'Reel Lanzamiento: Semana Santa',
        clientName: 'Parroquia San José',
        type: 'video',
        url: 'https://cdn.pixabay.com/vimeo/328940142/catedral-21223.mp4?width=1280&hash=d3c0d6cfa9c206d884738596660f6439243764b8',
        status: 'pending',
        createdAt: '2025-12-10T10:00:00Z',
        description: 'Propuesta de edición para el reel de convocatoria.',
        currentVersion: 1,
        priority: 'high',
        deadline: '2025-12-15T23:59:59Z'
    },
    {
        id: 'del-002',
        title: 'Flyer Concierto Adoración',
        clientName: 'Grupo Joven',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop',
        status: 'approved',
        createdAt: '2025-12-08T15:30:00Z',
        description: 'Versión final con los colores corregidos.',
        currentVersion: 2,
        approvedAt: '2025-12-09T14:00:00Z',
        approvedVersion: 2
    }
];
