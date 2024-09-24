import { loadEnvConfig } from '@next/env';

import { z } from 'zod';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const EnvSchema = z.object({
  GITHUB_TOKEN: z.string(),
});

const ENV = EnvSchema.parse({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
});

export default ENV;
