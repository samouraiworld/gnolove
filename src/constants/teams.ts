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
      'kouteki',
      'kristovatlas',
      'aeddi',
      'wyhaines',
      'n2p5',
      'michelleellen',
    ],
  },
  {
    name: 'Onbloc',
    color: 'purple',
    members: ['notJoon', 'r3v4s', 'adr-sk', 'jinoosss'],
  },
  {
    name: 'VarMeta',
    color: 'yellow',
    members: ['linhpn99', 'thinhnx-var', 'AnhVAR'],
  },
  {
    name: 'Samourai.world',
    color: 'red',
    members: [
      'n0izn0iz',
      'omarsy',
      'villaquiranm',
      'hthieu1110',
      'MikaelVallenet',
      'villaquiranm',
      'WaDadidou',
      'dtczelo',
      'naim-ea',
      'louis14448',
      'pr0m3th3usEx',
    ],
  },
  {
    name: 'Berty',
    color: 'green',
    members: ['jefft0', 'D4ryl00', 'iuricmp'],
  },
  {
    name: 'DevX',
    color: 'brown',
    members: ['ilgooz', 'jeronimoalbi', 'salmad3'],
  },
];

export default TEAMS;
