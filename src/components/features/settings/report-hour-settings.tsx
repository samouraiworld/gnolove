'use client';

import { useMemo } from 'react';
import { Box, Button, Flex, Heading, Select, Separator, Text, TextField } from '@radix-ui/themes';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetReportHour, useUpdateReportHour } from '@/hooks/use-monitoring-webhooks';
import { useToast } from '@/contexts/toast-context';

const schema = z.object({
  hour: z.number({ invalid_type_error: 'Hour must be a number' }).int('Hour must be an integer').min(0, 'Hour must be between 0 and 23').max(23, 'Hour must be between 0 and 23'),
  minute: z.number({ invalid_type_error: 'Minute must be a number' }).int('Minute must be an integer').min(0, 'Minute must be between 0 and 59').max(59, 'Minute must be between 0 and 59'),
  timezone: z.string().min(1, 'Timezone is required'),
});

type FormValues = z.infer<typeof schema>;

const ReportHourSettings = () => {
  const { addToast } = useToast();
  const { data: reportHour, isLoading: isReportHourLoading } = useGetReportHour();
  const updateReportHour = useUpdateReportHour();

  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';

  const timezones = useMemo<string[]>(() => {
    return Intl.supportedValuesOf('timeZone') as string[];
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { hour: reportHour?.daily_report_hour ?? 9, minute: reportHour?.daily_report_minute ?? 0, timezone: reportHour?.Timezone ?? defaultTimezone },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateReportHour.mutateAsync({
        hour: Math.max(0, Math.min(23, values.hour)),
        minute: Math.max(0, Math.min(59, values.minute)),
        timezone: values.timezone || defaultTimezone,
      });
      addToast({ title: 'Reporting time updated', message: 'This applies to all validator webhooks.', mode: 'positive' });
    } catch (err: unknown) {
      addToast({ title: 'Failed to update reporting time', message: String((err as Error)?.message ?? err), mode: 'negative' });
    }
  };

  return (
    <>
      <Separator my="3" />
      <Box p="3" className="rounded-md bg-[var(--accent-a2)]">
        <Heading size="3" mb="2">Daily reporting time</Heading>
        <Text size="2" color="gray">
          Set the time of day for validator reports. This updates the reporting hour for all your validator webhooks.
        </Text>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex gap="3" mt="3" wrap="wrap">
            <Box className="min-w-[200px]">
              <Text as="label" size="2">Hour (0–23)</Text>
              <Controller
                name="hour"
                control={control}
                render={({ field }) => (
                  <TextField.Root
                    type="text"
                    value={String(field.value ?? '')}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                )}
              />
              {errors.hour && (
                <Text color="red" size="1">{errors.hour.message}</Text>
              )}
            </Box>

            <Box className="min-w-[200px]">
              <Text as="label" size="2">Minute (0–59)</Text>
              <Controller
                name="minute"
                control={control}
                render={({ field }) => (
                  <TextField.Root
                    type="text"
                    value={String(field.value ?? '')}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                )}
              />
              {errors.minute && (
                <Text color="red" size="1">{errors.minute.message}</Text>
              )}
            </Box>

            <Box className="min-w-[240px]">
              <Text as="label" size="2">Timezone</Text>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Box>
                    {timezones.length > 0 ? (
                      <Select.Root value={field.value ?? ''} onValueChange={field.onChange}>
                        <Select.Trigger variant="soft" />
                        <Select.Content>
                          {timezones.map((tz) => (
                            <Select.Item key={tz} value={tz}>
                              {tz}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    ) : (
                      <TextField.Root
                        className="w-full"
                        placeholder="e.g. Europe/Paris"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                      />
                    )}
                  </Box>
                )}
              />
              {errors.timezone && (
                <Text color="red" size="1">{errors.timezone.message}</Text>
              )}
            </Box>
          </Flex>
          <Button className="mt-3" type="submit" disabled={updateReportHour.isPending || isReportHourLoading || isSubmitting || !isValid}>
            {updateReportHour.isPending || isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </form>

        {!isReportHourLoading && reportHour && (
          <Text size="1" color="gray" className="mt-2 block">
            Current: {String(reportHour.daily_report_hour).padStart(2, '0')}:{String(reportHour.daily_report_minute).padStart(2, '0')} ({reportHour.Timezone})
          </Text>
        )}
      </Box>
    </>
  );
};

export default ReportHourSettings;