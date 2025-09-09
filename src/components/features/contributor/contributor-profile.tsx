import { Calendar, Copy, Github, Globe, MapPin, Twitter } from 'lucide-react';

import { TContributor } from '@/utils/schemas';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const ContributorProfile = ({ contributor }: { contributor: TContributor }) => {
  const websiteUrl = /^https?:\/\//i.test(contributor.websiteUrl ?? '')
    ? contributor.websiteUrl
    : `https://${contributor.websiteUrl}`;

  return (
    <div className="h-full overflow-auto">
      <div className="flex flex-col gap-4">
        <div className="rounded-md border p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full">
              <Avatar>
                <AvatarImage src={contributor.avatarUrl} alt={contributor.name} />
                <AvatarFallback>
                  {contributor.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-center text-xl font-semibold">{contributor.name}</h2>
              <span className="text-muted-foreground text-sm">@{contributor.login}</span>
              <span className="text-center text-sm">{contributor.bio}</span>
            </div>

            {contributor.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span className="text-muted-foreground text-sm">{contributor.location}</span>
              </div>
            )}

            {contributor.joinDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span className="text-muted-foreground text-sm">
                  Joined{' '}
                  {new Date(contributor.joinDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="icon" asChild>
                <a href={contributor.url} target="_blank" rel="noopener noreferrer">
                  <Github size={16} />
                </a>
              </Button>
              {contributor.twitterUsername && (
                <Button variant="outline" size="icon" asChild>
                  <a href={`https://x.com/${contributor.twitterUsername}`} target="_blank" rel="noopener noreferrer">
                    <Twitter size={16} />
                  </a>
                </Button>
              )}
              {contributor.websiteUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Globe size={16} />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {contributor.wallet && (
          <div className="rounded-md border p-4">
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold">On-Chain Profile</h3>
              <div>
                <div className="text-muted-foreground mb-1 text-xs">Wallet Address</div>
                <div className="flex items-center gap-2">
                  <div className="bg-muted flex-1 overflow-hidden rounded-md p-2 font-mono text-xs text-ellipsis">
                    {contributor.wallet}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(contributor.wallet)}>
                    <Copy size={12} />
                  </Button>
                </div>
              </div>

              <Separator className="my-2" />

              {contributor.gnoBalance && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">GNO Balance</span>
                    <span className="font-mono text-xs">{contributor.gnoBalance}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributorProfile;
