import { TProposal, TVote } from '@/utils/schemas';

export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export type VoteTotals = { for: number; against: number; abstain: number; unknown: number; total: number };

export const aggregateVotes = (votes: TVote[] | undefined): VoteTotals => {
  return (votes || []).reduce<VoteTotals>((acc, v) => {
    const key = (v.vote || '').toLowerCase();
    if (key === 'yes') acc.for += 1;
    else if (key === 'no') acc.against += 1;
    else if (key === 'abstain') acc.abstain += 1;
    else acc.unknown += 1;
    acc.total += 1;
    return acc;
  }, { for: 0, against: 0, abstain: 0, unknown: 0, total: 0 });
};

export const percent = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

export const getStatusColor = (status?: string): 'green' | 'red' | 'violet' | 'gray' => {
  const s = (status || '').toLowerCase();
  if (s === 'executed') return 'green';
  if (s === 'rejected') return 'red';
  if (s === 'created') return 'violet';
  return 'gray';
};

export const getProposalTitle = (p: TProposal) => {
  if (p.title) return p.title;
  const file = p.files?.[0];
  if (!file) return p.path || p.id;
  if (file.name && file.name.trim().length > 0) return file.name.replace(/\.[^/.]+$/, '');
  const firstLine = (file.body || '').split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  return firstLine.length > 0 ? firstLine.slice(0, 100) : p.path || p.id;
};

export const guessLanguageFromFilename = (name?: string): string => {
  if (!name) return '';
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'gno':
    case 'go':
      return 'go';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'json':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'toml':
      return 'toml';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
      return 'bash';
    default:
      return '';
  }
};
