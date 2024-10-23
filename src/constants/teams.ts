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
      'sw360cab',
      'jaekwon',
      'ajnavarro',
      'albttx',
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
      'villaquiranm',
      'kouteki',
      'kristovatlas',
      'aeddi',
    ],
  },
  { name: 'Onbloc', color: 'purple', members: ['notJoon', 'r3v4s', 'adr-sk', 'jinoosss'] },
  { name: 'VarMeta', color: 'yellow', members: ['linhpn99', 'thinhnx-var', 'AnhVAR'] },
  { name: 'Teritori', color: 'red', members: ['n0izn0iz', 'omarsy', 'villaquiranm', 'hthieu1110', 'MikaelVallenet'] },
  { name: 'Berty', color: 'green', members: ['jefft0', 'D4ryl00'] },
  { name: 'DevX', color: 'brown', members: ['ilgooz', 'jeronimoalbi'] },
];

export default TEAMS;
