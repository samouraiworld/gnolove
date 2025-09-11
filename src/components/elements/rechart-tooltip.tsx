import React from 'react';

import { type TooltipProps } from 'recharts';

// @TODO remove the any typing when recharts allows for better typing. (unknown typing doesn't satisfy ValueType constraints)
interface RechartTooltipProps extends TooltipProps<any, string | number> {
  /**
   * Optional custom render function for entries.
   * If not provided, will render name, value, and color.
   */
  renderEntries?: (payload: unknown[], label?: string | number) => React.ReactNode;
  /** Optional: override label rendering */
  renderLabel?: (label?: string | number, payload?: unknown[]) => React.ReactNode;
}

const RechartTooltip = (props: RechartTooltipProps) => {
  const { active, payload, label, renderEntries, renderLabel } = props;
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-popover text-popover-foreground rounded-md border p-3 shadow-md">
      <div className="mb-2">
        {renderLabel ? renderLabel(label, payload) : <span className="text-sm font-bold">{label}</span>}
      </div>
      <div className="flex flex-col gap-2">
        {renderEntries
          ? renderEntries(payload, label)
          : payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-xs font-bold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RechartTooltip;
