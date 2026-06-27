// Prisma Postgres uses Prisma Accelerate — no local query engine binary needed.
// The client is lazy-loaded so Next.js build-time evaluation doesn't fail.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma?: any };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPrisma(): any {
  if (!globalForPrisma.prisma) {
    // Dynamic requires prevent evaluation at module load time (build safety)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withAccelerate } = require('@prisma/extension-accelerate');
    globalForPrisma.prisma = new PrismaClient().$extends(withAccelerate());
  }
  return globalForPrisma.prisma;
}
