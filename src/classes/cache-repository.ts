import { kv } from '@vercel/kv';
import { z } from 'zod';

import { TimeFilter } from '@/util/github';
import { UserWithStatsSchema } from '@/util/schemas';
import { snakeCase } from '@/util/string';

import { UserWithStats } from '@/type/github';

class CacheRepository {
  static getKey(dataKey: string, timeFilter: TimeFilter, kind: 'data' | 'timestamp') {
    return `${dataKey}:${snakeCase(timeFilter)}:${kind}`;
  }

  static async getContributors(timeFilter: TimeFilter) {
    const baseKey = CacheRepository.getKey.bind(null, 'contributors', timeFilter);

    const rawData = await kv.get(baseKey('data'));
    const rawTimestamp = await kv.get(baseKey('timestamp'));

    // eslint-disable-next-line
    console.log(`Key: ${baseKey('timestamp')}, Value: ${rawTimestamp}`);

    const { data: usersWithStats } = z.array(UserWithStatsSchema).safeParse(rawData);
    const { data: timestamp } = z.number().safeParse(rawTimestamp);

    if (!usersWithStats || !timestamp) return null;

    return { usersWithStats, lastUpdate: timestamp };
  }

  static async setContributors(timeFilter: TimeFilter, contributors: UserWithStats[]) {
    const baseKey = CacheRepository.getKey.bind(null, 'contributors', timeFilter);

    await kv.set(baseKey('data'), JSON.stringify(contributors));
    await kv.set(baseKey('timestamp'), Date.now().toString());
  }
}

export default CacheRepository;
