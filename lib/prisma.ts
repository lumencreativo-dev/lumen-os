export const prisma: any = new Proxy({}, { get: () => new Proxy({}, { get: () => () => [] }) });
