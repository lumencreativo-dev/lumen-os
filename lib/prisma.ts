// Dummy prisma object to prevent build errors in legacy API routes.
// We are migrating entirely to Supabase.
// These API routes will be rewritten or deleted in Phase 6.

const dummyModel = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async () => ({ id: 'dummy' }),
    update: async () => ({ id: 'dummy' }),
    delete: async () => ({ id: 'dummy' })
};

export const prisma = {
    lead: dummyModel,
    task: dummyModel,
    deliverable: dummyModel,
    pipeline: dummyModel,
    column: dummyModel,
    user: dummyModel
};
