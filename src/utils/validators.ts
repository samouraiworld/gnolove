import { monitoringMetricsSchema, TMonitoringMetrics } from './schemas';

export const parseValidatorMetrics = (metricsText: string): TMonitoringMetrics => {
  const lines = metricsText.split('\n');

  const validators: Record<string, any> = {};
  const server: Record<string, any> = {};

  lines.forEach((line) => {
    if (!line || line.startsWith('#')) return;

    // Validator metrics
    if (line.startsWith('gnoland_')) {
      const match = line.match(/(\w+){moniker="([^"]+)",validator_address="([^"]+)"} ([0-9.]+)/);
      if (!match) return;

      const [, metric, moniker, validator_address, value] = match;

      if (
        ![
          'gnoland_consecutive_missed_blocks',
          'gnoland_missed_blocks',
          'gnoland_validator_participation_rate',
        ].includes(metric)
      )
        return;

      if (!validators[validator_address]) validators[validator_address] = { moniker, validator_address };
      validators[validator_address][metric] = Number(value);
    }

    // Server / process metrics
    else if (line.startsWith('process_') || line.startsWith('go_')) {
      const match = line.match(/(\w+)\s([0-9.]+)/);
      if (!match) return;
      const [, metric, value] = match;
      server[metric] = Number(value);
    }
  });

  return monitoringMetricsSchema.parse({
    validators: Object.values(validators),
    server,
  });
};
