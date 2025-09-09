import { emojify } from 'node-emoji';

import { TLabel } from '@/utils/schemas';
import { hexToRGB } from '@/utils/style';

import { Badge } from '@/components/ui/badge';

export interface LabelProps {
  label: TLabel;
}

const Label = ({ label: { color: rawColor, name } }: LabelProps) => {
  const isWhite = rawColor === 'ffffff';

  const color = `#${rawColor}`;
  const rgbColor = hexToRGB(color);
  const background = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, .2)`;

  return (
    <Badge className="text-[11px] font-normal" style={!isWhite ? { background, color } : undefined}>
      {emojify(name)}
    </Badge>
  );
};

export default Label;
