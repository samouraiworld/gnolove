'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Flex, Grid, Select, Switch, Text, TextField } from '@radix-ui/themes';
import { z } from 'zod';
import { useToast } from '@/contexts/toast-context';
import { LeaderboardWebhookSchema, TLeaderboardWebhook } from '@/utils/schemas';
import { useCreateLeaderboardWebhook, useUpdateLeaderboardWebhook } from '@/hooks/use-leaderboard-webhooks';
import RepositoriesSelector from '@/components/modules/repositories-selector';
import useGetRepositories from '@/hooks/use-get-repositories';

const FormSchema = LeaderboardWebhookSchema.pick({ url: true, type: true, frequency: true, day: true, hour: true, minute: true, timezone: true, repositories: true, active: true });

type FormValues = z.infer<typeof FormSchema>;

export default function LeaderboardWebhookForm({ initial, onDone }: { initial?: TLeaderboardWebhook; onDone?: () => void }) {
  const isEdit = Boolean(initial?.id);
  const { addToast } = useToast();
  const create = useCreateLeaderboardWebhook();
  const update = useUpdateLeaderboardWebhook();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { data: repos = [] } = useGetRepositories();

  const defaultValues: FormValues = useMemo(() => ({
    url: initial?.url ?? '',
    type: (initial?.type as 'discord' | 'slack') ?? 'discord',
    frequency: (initial?.frequency as 'daily' | 'weekly') ?? 'weekly',
    day: initial?.day ?? 4,
    hour: initial?.hour ?? 15,
    minute: initial?.minute ?? 0,
    timezone: initial?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Paris',
    repositories: initial?.repositories ?? [],
    active: initial?.active ?? true,
  }), [initial]);

  const { register, handleSubmit, reset, control, formState, watch, setValue } = useForm<FormValues>({
    mode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
    if (initial && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [initial, reset, defaultValues]);

  const freq = watch('frequency');

  const onSubmit = async (values: FormValues) => {
    const payload = {
      url: values.url,
      type: values.type,
      frequency: values.frequency,
      day: values.day,
      hour: values.hour,
      minute: values.minute,
      timezone: values.timezone,
      repositories: values.repositories ?? [],
      active: values.active,
    } as const;

    try {
      if (isEdit && initial?.id) {
        await update.mutateAsync({ id: initial.id, userId: initial.userId, nextRunAt: initial.nextRunAt, createdAt: initial.createdAt, updatedAt: initial.updatedAt, ...payload });
        addToast({ title: 'Webhook updated', message: 'Leaderboard webhook updated', mode: 'positive' });
      } else {
        await create.mutateAsync(payload);
        addToast({ title: 'Webhook created', message: 'Leaderboard webhook created', mode: 'positive' });
      }
      onDone?.();
      if (!isEdit) reset(defaultValues);
    } catch (err: unknown) {
      addToast({ title: 'Error', message: String((err as any)?.message ?? err), mode: 'negative' });
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className={isEdit ? 'outline outline-[2px] outline-[var(--accent-a4)] rounded-md p-2 space-y-3' : 'space-y-3'}>
      {isEdit && (
        <Box className="rounded-md border bg-[var(--accent-a2)]" p="2">
          <Flex align="center" wrap="wrap" justify="between" gap="3">
            <Text size="2">Editing existing leaderboard webhook</Text>
            <Flex gap="3">
              <Button type="button" variant="soft" color="gray" onClick={() => reset(defaultValues)}>Cancel edit</Button>
            </Flex>
          </Flex>
        </Box>
      )}

      <Grid columns={{ initial: '1', sm: '2' }} gap={{ initial: '2', sm: '9' }} align="start">
        <Box>
          <Flex gap="2" direction={{ initial: 'column', sm: 'row' }} align={{ initial: 'start', sm: 'center' }}>
            <Text as="label" size="2" weight="medium">Webhook URL</Text>
            <TextField.Root className="flex-1 w-full" placeholder="https://example.com/webhook" {...register('url', { required: true })} />
          </Flex>
          {formState.errors.url && <Text size="2" color="red">{formState.errors.url.message ?? 'A valid URL is required'}</Text>}
        </Box>

        <Flex gap="3" direction={{ initial: 'column', sm: 'row' }} align={{ initial: 'start', sm: 'center' }}>
          <Text as="label" size="2" weight="medium">Type</Text>
          <Controller
            name="type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select.Root value={field.value} onValueChange={field.onChange}>
                <Select.Trigger placeholder="Select a platform" />
                <Select.Content>
                  <Select.Item value="discord">Discord</Select.Item>
                  <Select.Item value="slack">Slack</Select.Item>
                </Select.Content>
              </Select.Root>
            )}
          />
          {formState.errors.type && <Text size="2" color="red">{formState.errors.type.message ?? 'Type is required'}</Text>}
        </Flex>
      </Grid>

      <Grid columns={{ initial: '1', sm: '3' }} gap={{ initial: '2', sm: '6' }}>
        <Flex gap="3" align="center">
          <Text as="label" size="2" weight="medium">Frequency</Text>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <Select.Root value={field.value} onValueChange={field.onChange}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="daily">Daily</Select.Item>
                  <Select.Item value="weekly">Weekly</Select.Item>
                </Select.Content>
              </Select.Root>
            )}
          />
        </Flex>
        {freq === 'weekly' && (
          <Flex gap="3" align="center">
            <Text as="label" size="2" weight="medium">Day of week</Text>
            <Controller
              name="day"
              control={control}
              render={({ field }) => (
                <Select.Root value={String(field.value ?? '')} onValueChange={(v) => field.onChange(Number(v))}>
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="1">Monday</Select.Item>
                    <Select.Item value="2">Tuesday</Select.Item>
                    <Select.Item value="3">Wednesday</Select.Item>
                    <Select.Item value="4">Thursday</Select.Item>
                    <Select.Item value="5">Friday</Select.Item>
                    <Select.Item value="6">Saturday</Select.Item>
                    <Select.Item value="0">Sunday</Select.Item>
                  </Select.Content>
                </Select.Root>
              )}
            />
          </Flex>
        )}
        <Flex gap="2" align="center">
          <Text as="label" size="2" weight="medium">Time (hh:mm)</Text>
          <TextField.Root className='min-w-[50px]' type="number" min={0} max={23} {...register('hour', { valueAsNumber: true })} />
          <TextField.Root className='min-w-[50px]' type="number" min={0} max={59} {...register('minute', { valueAsNumber: true })} />
        </Flex>
      </Grid>

      <Flex gap="3" direction={{ initial: 'column', sm: 'row' }} align={{ initial: 'start', sm: 'center' }}>
        <Text as="label" size="2" weight="medium">Timezone</Text>
        <Controller
          name="timezone"
          control={control}
          render={({ field }) => (
            <Select.Root value={field.value} onValueChange={field.onChange}>
              <Select.Trigger />
              <Select.Content>
                {(Intl.supportedValuesOf('timeZone') as string[]).map((tz) => (
                  <Select.Item key={tz} value={tz}>{tz}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        />
      </Flex>

      <Flex gap="3" direction={{ initial: 'column', sm: 'row' }} align={{ initial: 'start', sm: 'center' }}>
        <Text as="label" size="2" weight="medium">Repositories</Text>
        <RepositoriesSelector
          repositories={repos}
          selectedRepositories={watch('repositories') ?? []}
          onSelectedRepositoriesChange={(selected) => setValue('repositories', selected, { shouldDirty: true, shouldValidate: true })}
        />
      </Flex>

      {isEdit && (
        <Flex gap="3" align="center">
          <Text as="label" size="2" weight="medium">Active</Text>
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Switch checked={!!field.value} onCheckedChange={field.onChange as any} />
            )}
          />
        </Flex>
      )}

      <Flex gap="3" align="center">
        <Button type="submit" disabled={create.isPending || update.isPending || !formState.isValid || !formState.isDirty} variant="solid">
          {isEdit ? 'Save changes' : 'Add webhook'}
        </Button>
        {formState.errors.url && (
          <Text size="2" color="red">Invalid URL</Text>
        )}
      </Flex>
    </form>
  );
}
