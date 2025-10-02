import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import MilestoneProgress from '@/features/milestone-progress';

import LayoutContainer from '@/layouts/layout-container';

import RadixMarkdown from '@/elements/radix-markdown';

import { MilestoneSchema } from '@/utils/schemas';

import MILESTONE from '@/constants/milestone';

import ENV from '@/env';
import MilestoneList from '@/features/milestone/milestone-list';
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
      <MilestoneProgress milestone={milestone} />

      <Heading as='h1' size='8' my='6'>
        {milestone.title}
      </Heading>

      <RadixMarkdown>{milestone.description}</RadixMarkdown>

      <MilestoneList issues={milestone.issues} />
    </LayoutContainer>
  );
};

export default MilestonePage;
