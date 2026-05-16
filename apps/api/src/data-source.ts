import { DataSource } from 'typeorm';

// Load .env when used via the CLI — silently ignored when absent (CI, production)
try {
  process.loadEnvFile();
} catch {
  /* no .env present */
}

// Paths resolve from workspace root (always invoke migration scripts from there)
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_POSTGRES_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_POSTGRES_PORT'] ?? '5432', 10),
  username: 'postgres',
  password: process.env['DB_POSTGRES_PASSWORD'],
  database: 'don',
  entities: ['apps/api/src/app/**/*.entity.ts'],
  migrations: ['apps/api/src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
