import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import MilestoneProgress from '@/feature/milestone-progress';

import LayoutContainer from '@/layout/layout-container';

import RadixMarkdown from '@/element/radix-markdown';

import { MilestoneSchema } from '@/util/schemas';

import MILESTONE from '@/constant/milestone';

import ENV from '@/env';
import MilestoneList from '@/components/features/milestone/milestone-list';
import { Heading } from '@radix-ui/themes';

export const metadata: Metadata = {
  title: 'Top of Gnome',
};

const getMilestone = async () => {
  const url = new URL(`/milestones/${MILESTONE.number}`, ENV.NEXT_PUBLIC_API_URL);
  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();

  return MilestoneSchema.parse(data);
};

const MilestonePage = async () => {
  const milestone = await getMilestone();
  if (!milestone) return notFound();

  return (
    <LayoutContainer>
      <MilestoneProgress milestone={milestone} mt='5' />

      <Heading as='h1' size='8' my='4'>
        {milestone.title}
      </Heading>

      <RadixMarkdown>{milestone.description}</RadixMarkdown>

      <MilestoneList issues={milestone.issues} />
    </LayoutContainer>
  );
};

export default MilestonePage;
