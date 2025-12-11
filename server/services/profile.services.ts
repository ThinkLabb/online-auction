import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export interface StatusCardProps {
  name: string,
  value: number | string,
  extra: string
}

