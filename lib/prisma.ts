import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // PgBouncer transaction mode requires prepared statements disabled
  if (url.includes('pgbouncer=true') && !url.includes('prepared_statements=false')) {
    return url.includes('?') ? `${url}&prepared_statements=false` : `${url}?prepared_statements=false`;
  }
  return url;
}

function createPrismaClient() {
  const datasourceUrl = buildDatasourceUrl();
  return datasourceUrl ? new PrismaClient({ datasourceUrl }) : new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
