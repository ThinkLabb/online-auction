import { PrismaClient } from '@prisma/client';

class Database {
  public static instance: Database;
  public prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      errorFormat: 'minimal',
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

export default new Database();
