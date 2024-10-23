import { unstable_noStore as noStore } from 'next/cache';

import { kv } from '@vercel/kv';
import { z } from 'zod';

import { TimeFilter } from '@/util/github';
import { MilestoneSchema, UserWithStatsSchema } from '@/util/schemas';
import { snakeCase } from '@/util/string';

import { UserWithStats } from '@/type/github';

class CacheRepository {
  static getKey(dataKey: string, timeFilter: TimeFilter, kind: 'data' | 'timestamp') {
    return `${dataKey}:${snakeCase(timeFilter)}:${kind}`;
  }

  static async getContributors(timeFilter: TimeFilter) {
    noStore();

    const baseKey = CacheRepository.getKey.bind(null, 'contributors', timeFilter);

    const rawData = await kv.get(baseKey('data'));
    const rawTimestamp = await kv.get(baseKey('timestamp'));

    const { data: usersWithStats } = z.array(UserWithStatsSchema).safeParse(rawData);
    const { data: timestamp } = z.number().safeParse(rawTimestamp);

    if (!usersWithStats || !timestamp) return null;

    return { usersWithStats, lastUpdate: timestamp };
  }

  static async setContributors(timeFilter: TimeFilter, contributors: UserWithStats[]) {
    noStore();

    const baseKey = CacheRepository.getKey.bind(null, 'contributors', timeFilter);

    await kv.set(baseKey('data'), JSON.stringify(contributors));
    await kv.set(baseKey('timestamp'), Date.now().toString());
  }

  static async getMilestone(num: number) {
    noStore();

    const rawData = await kv.get(`milestone:${num}:data`);
    const rawTimestamp = await kv.get(`milestone:${num}:timestamp`);

    const { data: milestone } = MilestoneSchema.safeParse(rawData);
    const { data: timestamp } = z.number().safeParse(rawTimestamp);

    if (!milestone || !timestamp) return null;

    return { milestone, lastUpdate: timestamp };
  }

  static async setMilestone(num: number, milestone: any) {
    noStore();

    await kv.set(`milestone:${num}:data`, JSON.stringify(milestone));
    await kv.set(`milestone:${num}:timestamp`, Date.now().toString());
  }
}

export default CacheRepository;
