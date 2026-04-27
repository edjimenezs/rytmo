import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Always disable prepared statements in production — required for PgBouncer transaction mode
  // (Supabase session pooler port 5432 also tolerates this safely)
  try {
    const u = new URL(url);
    u.searchParams.set('pgbouncer', 'true');
    u.searchParams.set('prepared_statements', 'false');
    return u.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const datasourceUrl = buildDatasourceUrl();
  return datasourceUrl ? new PrismaClient({ datasourceUrl }) : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
