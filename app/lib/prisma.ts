// PrismaClient is instantiated lazily so Next.js build-time page evaluation
// doesn't crash when the generated client isn't available (e.g. CI/sandbox).
// On Vercel, `prisma generate` runs during `npm install` (postinstall), so
// the client is always available by the time requests arrive.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as { prisma?: any };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPrisma(): any {
  if (!globalForPrisma.prisma) {
    // Dynamic require avoids the import being evaluated at module load time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
