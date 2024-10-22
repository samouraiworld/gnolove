import { BadgeProps } from '@radix-ui/themes';

export interface Team {
  name: string;
  color: BadgeProps['color'];
  members: string[];
}

const TEAMS: Team[] = [
  {
    name: 'Core Team',
    color: 'blue',
    members: [
      'jaekwon',
      'ajnavarro',
      'albttx',
      'deelawn',
      'alexiscolin',
      'gfanton',
      'ltzmaxwell',
      'zivkovicmilos',
      'thehowl',
      'tbruyelle',
      'piux2',
      'petar-dambovaliev',
      'mvertes',
      'moul',
      'leohhhn',
      'dependabot',
    ],
  },
  { name: 'Onbloc', color: 'purple', members: ['notJoon', 'r3v4s', 'adr-sk', 'jinoosss'] },
  { name: 'VarMeta', color: 'yellow', members: ['linhpn99', 'thinhnx-var', 'AnhVAR'] },
  { name: 'Teritori', color: 'red', members: ['n0izn0iz', 'omarsy', 'villaquiranm', 'hthieu1110', 'MikaelVallenet'] },
  { name: 'Berty', color: 'green', members: ['jefft0', 'D4ryl00'] },
];

export default TEAMS;
