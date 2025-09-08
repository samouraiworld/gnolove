import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TContributor } from '@/utils/schemas';
import { Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const ContributorTopRepos = ({ contributor }: { contributor: TContributor }) => {
  return (
    <div className="h-full rounded-md border p-4">
      <div className='flex h-full flex-col gap-4 overflow-y-auto'>
        <h3 className='text-lg font-semibold'>Top Repositories</h3>
        {contributor.topRepositories.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Nothing to see here (for now ;))
          </p>
        ) : (
          <div className='flex flex-col gap-4'>
            {contributor.topRepositories.map((repo) => (
              <div key={repo.url} className='flex items-start justify-between'>
                <div className='flex flex-col gap-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>
                      {repo.nameWithOwner}
                    </span>
                    <Badge variant='outline' className='h-5 px-2 text-[11px]'>
                      {repo.primaryLanguage}
                    </Badge>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {repo.description}
                  </span>
                  <div className='flex items-center gap-1'>
                    <Star size={12} />
                    <span className='text-xs text-muted-foreground'>
                      {repo.stargazerCount}
                    </span>
                  </div>
                </div>
                <Link href={repo.url} target='_blank' rel='noopener noreferrer'>
                  <Button variant='ghost' size='icon'>
                    <ExternalLink size={12} />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributorTopRepos;