import { unstable_noStore as noStore } from 'next/cache';

import { kv } from '@vercel/kv';
import { z } from 'zod';

import { TimeFilter } from '@/util/github';
import { MilestoneSchema, UserWithStatsSchema } from '@/util/schemas';
import { snakeCase } from '@/util/string';

import { UserWithStats } from '@/type/github';

class CacheRepository {
  static getKey(dataKey: string, timeFilter: TimeFilter, kind: 'data' | 'timestamp' | 'use-cache-until') {
    return `${dataKey}:${snakeCase(timeFilter)}:${kind}`;
  }

  static async getContributors(timeFilter: TimeFilter) {
    noStore();

    const baseKey = CacheRepository.getKey.bind(null, 'contributors', timeFilter);

    const rawData = await kv.get(baseKey('data'));
    const rawTimestamp = await kv.get(baseKey('timestamp'));
    const rawUseCacheUntil = await kv.get(baseKey('use-cache-until'));

    const { data: usersWithStats } = z.array(UserWithStatsSchema).safeParse(rawData);
    const { data: timestamp } = z.number().safeParse(rawTimestamp);
    const { data: useCacheUntil } = z.number().safeParse(rawUseCacheUntil);

    const useCache = useCacheUntil ? Date.now() - useCacheUntil <= 0 : false;

    if (!usersWithStats || !timestamp) return { usersWithStats: null, timestamp: null, useCache };

    return { usersWithStats, lastUpdate: timestamp, useCache };
  }

  static async setContributorsCacheUntil(timeFilter: TimeFilter, date: Date) {
    noStore();

    await kv.set(CacheRepository.getKey('contributors', timeFilter, 'use-cache-until'), date.getTime().toString());
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
    const rawUseCacheUntil = await kv.get(`milestone:${num}:use-cache-until`);

    const { data: milestone } = MilestoneSchema.safeParse(rawData);
    const { data: timestamp } = z.number().safeParse(rawTimestamp);
    const { data: useCacheUntil } = z.number().safeParse(rawUseCacheUntil);

    const useCache = useCacheUntil ? Date.now() - useCacheUntil <= 0 : false;

    if (!milestone || !timestamp) return { milestone: null, timestamp: null, useCache };

    return { milestone, lastUpdate: timestamp, useCache };
  }

  static async setMilestone(num: number, milestone: any) {
    noStore();

    const { data: milestoneData } = MilestoneSchema.safeParse(milestone);
    if (!milestoneData) return;

    await kv.set(`milestone:${num}:data`, JSON.stringify(milestoneData));
    await kv.set(`milestone:${num}:timestamp`, Date.now().toString());
  }

  static async setMilestoneCacheUntil(num: number, date: Date) {
    noStore();

    await kv.set(`milestone:${num}:use-cache-until`, date.getTime().toString());
  }
}

export default CacheRepository;
