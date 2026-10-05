import { PrismaClient } from "@prisma/client";

// One shared Prisma client. In dev, hot reloads re-run modules, so the client
// is kept on globalThis to avoid opening a new DB connection pool each reload
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
