import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

export default defineConfig({
  migrate: {
    adapter: async () => {
      const url = process.env.DATABASE_URL ?? '';
      const isRemote = !url.includes('localhost') && !url.includes('127.0.0.1');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
      });
      return new PrismaPg(pool);
    },
  },
});
