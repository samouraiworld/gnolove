import { Badge } from '@radix-ui/themes';
import { emojify } from 'node-emoji';

import { hexToRGB } from '@/util/style';

import { Label as TLabel } from '@/type/github';

export interface LabelProps {
  label: TLabel;
}

const Label = ({ label: { color: rawColor, name } }: LabelProps) => {
  const isWhite = rawColor === 'ffffff';

  const color = `#${rawColor}`;
  const rgbColor = hexToRGB(color);
  const background = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, .2)`;

  return (
    <Badge size="1" color="gray" style={!isWhite ? { background, color } : undefined}>
      {emojify(name)}
    </Badge>
  );
};

export default Label;
