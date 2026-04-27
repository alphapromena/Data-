import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  // Railway PostgreSQL — provided automatically as DATABASE_URL on Railway
  DATABASE_URL: z.string().url(),

  // JWT secret for auth middleware
  JWT_SECRET: z.string().min(32).default('change-me-in-production-must-be-32-chars!!'),

  // Python scan engine integration (path to script or worker URL)
  SCAN_ENGINE_CMD: z.string().default('python -m mizan_scan'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
