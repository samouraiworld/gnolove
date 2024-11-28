import { loadEnvConfig } from '@next/env';

import { z } from 'zod';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const EnvSchema = z.object({
  GITHUB_TOKEN: z.string(),

  NEXT_PUBLIC_API_URL: z.string(),
});

const ENV = EnvSchema.parse({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,

  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

export default ENV;
