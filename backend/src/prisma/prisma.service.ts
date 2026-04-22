import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const url = process.env.DATABASE_URL ?? '';
    const isRemote = !url.includes('localhost') && !url.includes('127.0.0.1');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...(isRemote && { ssl: { rejectUnauthorized: false } }),
    });
    super({ adapter: new PrismaPg(pool) });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
