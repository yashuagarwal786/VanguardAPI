import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_PATH: z.string().default('./data/sentinel.sqlite'),
  AUTHORIZED_TARGET_HOSTS: z.string().default(''),
  PUBLIC_DEMO_MODE: z.string().default('false'),
  MAX_REQUESTS_PER_SCAN: z.coerce.number().int().min(1).max(100).default(60),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(250).max(15000).default(5000),
});

const parsed = envSchema.parse(process.env);
export const env = {
  ...parsed,
  publicDemoMode: parsed.PUBLIC_DEMO_MODE === 'true',
  authorizedTargetHosts: new Set((parsed.PUBLIC_DEMO_MODE === 'true' ? [] : parsed.AUTHORIZED_TARGET_HOSTS.split(',')).map((h) => h.trim().toLowerCase()).filter(Boolean)),
};
