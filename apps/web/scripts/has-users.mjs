import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const n = await prisma.user.count();
await prisma.$disconnect();
process.exit(n > 0 ? 0 : 2);
