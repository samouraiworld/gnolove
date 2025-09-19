import { loadEnvConfig } from '@next/env';

import { z } from 'zod';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const EnvSchema = z.object({
  GITHUB_API_TOKEN: z.string(),

  NEXT_PUBLIC_API_URL: z.string(),

  YOUTUBE_API_KEY: z.string().optional(),

  NEXT_PUBLIC_MONITORING_API_URL: z.string(),
});

const ENV = EnvSchema.parse({
  GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN,

  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,

  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,

  NEXT_PUBLIC_MONITORING_API_URL: process.env.NEXT_PUBLIC_MONITORING_API_URL,
});

export default ENV;
