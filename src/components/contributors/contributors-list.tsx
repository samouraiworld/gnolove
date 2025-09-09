'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Users,
  TrendingUp,
  GitBranch,
  ExternalLink,
  Github,
  Twitter,
  Globe,
  MapPin,
  Calendar,
  Star,
} from 'lucide-react';

const contributors = [
  {
    id: 'alice-eth',
    name: 'Alice Johnson',
    username: 'alice.eth',
    avatar: '/placeholder.svg?height=64&width=64',
    bio: 'Core Ethereum developer focused on consensus mechanisms and protocol optimization',
    location: 'San Francisco, CA',
    joinDate: '2021-03-15',
    totalContributions: 1247,
    repositories: ['ethereum/go-ethereum', 'ethereum/consensus-specs'],
    specializations: ['Consensus', 'Protocol Design', 'Gas Optimization'],
    rank: 1,
    level: 'Core Contributor',
    onChainAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
    socialLinks: {
      github: 'alice-eth',
      twitter: 'alice_ethereum',
      website: 'https://alice.dev',
    },
    recentActivity: {
      commits: 45,
      prs: 12,
      reviews: 23,
      issues: 8,
    },
    teams: ['Ethereum Core', 'Protocol Research'],
  },
  {
    id: 'bob-dev',
    name: 'Bob Smith',
    username: 'bob_dev',
    avatar: '/placeholder.svg?height=64&width=64',
    bio: 'Full-stack blockchain developer with expertise in EVM and Layer 2 solutions',
    location: 'Berlin, Germany',
    joinDate: '2020-11-22',
    totalContributions: 892,
    repositories: ['polygon/bor', 'ethereum/go-ethereum'],
    specializations: ['EVM', 'Layer 2', 'Smart Contracts'],
    rank: 2,
    level: 'Senior Contributor',
    onChainAddress: '0x8ba1f109551bD432803012645Hac136c0532925a3',
    socialLinks: {
      github: 'bob-dev',
      twitter: 'bob_blockchain',
    },
    recentActivity: {
      commits: 38,
      prs: 9,
      reviews: 19,
      issues: 5,
    },
    teams: ['Polygon Validators', 'EVM Research'],
  },
  {
    id: 'charlie-sol',
    name: 'Charlie Brown',
    username: 'charlie.sol',
    avatar: '/placeholder.svg?height=64&width=64',
    bio: 'Solana ecosystem contributor specializing in runtime optimization and DeFi protocols',
    location: 'Austin, TX',
    joinDate: '2021-07-08',
    totalContributions: 734,
    repositories: ['solana/solana', 'solana/solana-program-library'],
    specializations: ['Runtime', 'DeFi', 'Performance'],
    rank: 3,
    level: 'Senior Contributor',
    onChainAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    socialLinks: {
      github: 'charlie-sol',
      twitter: 'charlie_solana',
      website: 'https://charlie.sol',
    },
    recentActivity: {
      commits: 42,
      prs: 15,
      reviews: 21,
      issues: 7,
    },
    teams: ['Solana Runtime', 'DeFi Working Group'],
  },
  {
    id: 'diana-crypto',
    name: 'Diana Prince',
    username: 'diana.crypto',
    avatar: '/placeholder.svg?height=64&width=64',
    bio: 'Cryptography researcher and blockchain security expert',
    location: 'London, UK',
    joinDate: '2022-01-12',
    totalContributions: 456,
    repositories: ['ethereum/go-ethereum', 'avalanche-network/avalanchego'],
    specializations: ['Cryptography', 'Security', 'Zero-Knowledge'],
    rank: 4,
    level: 'Contributor',
    onChainAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    socialLinks: {
      github: 'diana-crypto',
      twitter: 'diana_zk',
    },
    recentActivity: {
      commits: 28,
      prs: 8,
      reviews: 15,
      issues: 12,
    },
    teams: ['Security Research', 'ZK Working Group'],
  },
];

export default function Contributors() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>Contributors</h1>
          <p className='text-muted-foreground'>Discover and explore blockchain open-source contributors</p>
        </div>
        <div className='flex items-center gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input placeholder='Search contributors...' className='w-64 pl-10' />
          </div>
          <Select defaultValue='all'>
            <SelectTrigger className='w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Contributors</SelectItem>
              <SelectItem value='core'>Core Contributors</SelectItem>
              <SelectItem value='senior'>Senior Contributors</SelectItem>
              <SelectItem value='active'>Active This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Contributors</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{contributors.length}</div>
            <p className='text-xs text-muted-foreground'>Across all repositories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Core Contributors</CardTitle>
            <Star className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {contributors.filter((c) => c.level === 'Core Contributor').length}
            </div>
            <p className='text-xs text-muted-foreground'>Top tier contributors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Contributions</CardTitle>
            <GitBranch className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {contributors.reduce((sum, c) => sum + c.totalContributions, 0).toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>All time contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg Contributions</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round(contributors.reduce((sum, c) => sum + c.totalContributions, 0) / contributors.length)}
            </div>
            <p className='text-xs text-muted-foreground'>Per contributor</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='grid' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='grid'>Grid View</TabsTrigger>
          <TabsTrigger value='list'>List View</TabsTrigger>
          <TabsTrigger value='leaderboard'>Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value='grid' className='space-y-4'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {contributors.map((contributor) => (
              <Card key={contributor.id} className='hover:shadow-lg transition-shadow'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={contributor.avatar || '/placeholder.svg'} />
                        <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className='text-lg'>{contributor.name}</CardTitle>
                        <p className='text-sm text-muted-foreground'>@{contributor.username}</p>
                      </div>
                    </div>
                    <Badge variant={contributor.level === 'Core Contributor' ? 'default' : 'secondary'}>
                      #{contributor.rank}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <p className='text-sm text-muted-foreground line-clamp-2'>{contributor.bio}</p>

                  <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <MapPin className='h-3 w-3' />
                      <span>{contributor.location}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      <span>Since {new Date(contributor.joinDate).getFullYear()}</span>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-1'>
                    {contributor.specializations.slice(0, 3).map((spec, i) => (
                      <Badge key={i} variant='outline' className='text-xs'>
                        {spec}
                      </Badge>
                    ))}
                  </div>

                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='font-medium'>{contributor.totalContributions}</p>
                      <p className='text-xs text-muted-foreground'>Total Contributions</p>
                    </div>
                    <div>
                      <p className='font-medium'>{contributor.repositories.length}</p>
                      <p className='text-xs text-muted-foreground'>Repositories</p>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {contributor.socialLinks.github && (
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                          <Github className='h-3 w-3' />
                        </Button>
                      )}
                      {contributor.socialLinks.twitter && (
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                          <Twitter className='h-3 w-3' />
                        </Button>
                      )}
                      {contributor.socialLinks.website && (
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                          <Globe className='h-3 w-3' />
                        </Button>
                      )}
                    </div>
                    <Button variant='outline' size='sm'>
                      <ExternalLink className='h-3 w-3 mr-2' />
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='list' className='space-y-4'>
          <Card>
            <CardContent className='p-0'>
              <div className='space-y-0'>
                {contributors.map((contributor) => (
                  <div key={contributor.id} className='flex items-center justify-between p-6 border-b last:border-b-0'>
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium'>
                        {contributor.rank}
                      </div>
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={contributor.avatar || '/placeholder.svg'} />
                        <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium'>{contributor.name}</p>
                          <Badge variant={contributor.level === 'Core Contributor' ? 'default' : 'secondary'}>
                            {contributor.level}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>@{contributor.username}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-8 text-sm'>
                      <div className='text-center'>
                        <p className='font-medium'>{contributor.totalContributions}</p>
                        <p className='text-xs text-muted-foreground'>Contributions</p>
                      </div>
                      <div className='text-center'>
                        <p className='font-medium'>{contributor.repositories.length}</p>
                        <p className='text-xs text-muted-foreground'>Repositories</p>
                      </div>
                      <div className='text-center'>
                        <p className='font-medium'>{contributor.teams.length}</p>
                        <p className='text-xs text-muted-foreground'>Teams</p>
                      </div>
                    </div>

                    <Button variant='outline' size='sm'>
                      <ExternalLink className='h-3 w-3 mr-2' />
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='leaderboard' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'>
            {contributors.slice(0, 3).map((contributor, i) => (
              <Card key={contributor.id} className={i === 0 ? 'border-primary' : ''}>
                <CardHeader className='text-center'>
                  <div className='flex justify-center mb-2'>
                    <Avatar className='h-16 w-16'>
                      <AvatarImage src={contributor.avatar || '/placeholder.svg'} />
                      <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className='text-lg'>{contributor.name}</CardTitle>
                  <CardDescription>@{contributor.username}</CardDescription>
                  <div className='flex justify-center'>
                    <Badge variant={i === 0 ? 'default' : 'secondary'} className='text-lg px-3 py-1'>
                      #{contributor.rank}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='text-center space-y-2'>
                  <div>
                    <p className='text-2xl font-bold'>{contributor.totalContributions}</p>
                    <p className='text-sm text-muted-foreground'>Total Contributions</p>
                  </div>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='font-medium'>{contributor.recentActivity.commits}</p>
                      <p className='text-xs text-muted-foreground'>Commits</p>
                    </div>
                    <div>
                      <p className='font-medium'>{contributor.recentActivity.prs}</p>
                      <p className='text-xs text-muted-foreground'>PRs</p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full bg-transparent'
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Full Leaderboard</CardTitle>
              <CardDescription>All contributors ranked by total contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {contributors.map((contributor) => (
                  <div
                    key={contributor.id}
                    className='flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium'>
                        {contributor.rank}
                      </div>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={contributor.avatar || '/placeholder.svg'} />
                        <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium text-sm'>{contributor.name}</p>
                        <p className='text-xs text-muted-foreground'>@{contributor.username}</p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium text-sm'>{contributor.totalContributions}</p>
                      <p className='text-xs text-muted-foreground'>contributions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
