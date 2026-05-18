import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const envDbUrl = process.env.DATABASE_URL || 'postgresql://terrain_explorer:supersecretmountainpassword@localhost:5432/terrain_vault_dev';
const connectionString = envDbUrl.replace('?schema=public', '');

const globalForDrizzle = globalThis as unknown as {
  client: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  _lastConnectionStr: string | undefined;
};

// Force reconnect if the connection string changed (e.g. we removed ?schema=public)
if (globalForDrizzle._lastConnectionStr !== connectionString) {
  globalForDrizzle.client = undefined;
  globalForDrizzle.db = undefined;
  globalForDrizzle._lastConnectionStr = connectionString;
}

export const client =
  globalForDrizzle.client ?? postgres(connectionString, { prepare: false });

export const db =
  globalForDrizzle.db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDrizzle.client = client;
  globalForDrizzle.db = db;
}
