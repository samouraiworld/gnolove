'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Flex, Grid, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { useToast } from '@/contexts/toast-context';
import { TMonitoringWebhook as Webhook, TMonitoringWebhookKind as WebhookKind } from '@/utils/schemas';
import { z } from 'zod';
import { useCreateMonitoringWebhook, useUpdateMonitoringWebhook } from '@/hooks/use-monitoring-webhooks';

export type WebhookFormValues = {
  url: string;
  type: 'discord' | 'slack';
  description?: string;
};

export default function WebhookFormClient({ kind, initial, onDone }: { kind: WebhookKind; initial?: Webhook; onDone?: () => void }) {
  const isEdit = Boolean(initial?.ID);
  const { addToast } = useToast();
  const create = useCreateMonitoringWebhook(kind);
  const update = useUpdateMonitoringWebhook(kind);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Local form schema matching form field names
  const FormSchema = useMemo(
    () =>
      z.object({
        url: z.string().url(),
        type: z.enum(['discord', 'slack']),
        description: z.string().optional(),
      }),
    [],
  );
  const { register, handleSubmit, reset, control, formState } = useForm<WebhookFormValues>({
    mode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: { url: initial?.URL ?? '', type: (initial?.Type as 'discord' | 'slack') ?? 'discord', description: initial?.Description ?? '' },
  });

  useEffect(() => {
    reset({ url: initial?.URL ?? '', type: (initial?.Type as 'discord' | 'slack') ?? 'discord', description: initial?.Description ?? '' });
    if (initial && formRef.current) {
      // Smoothly scroll the form into view when entering edit mode
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [initial, reset]);

  const onSubmit = async (values: WebhookFormValues) => {
    const payload = {
      URL: values.url,
      Type: values.type,
      Description: values.description,
    };
    try {
      if (isEdit && initial?.ID) {
        await update.mutateAsync({ ID: initial.ID, ...payload });
        const msg = `Updated ${values.type} webhook`;
        addToast({ title: 'Webhook updated', message: msg, mode: 'positive' });
      } else {
        await create.mutateAsync(payload);
        const msg = `Created ${values.type} webhook`;
        addToast({ title: 'Webhook created', message: msg, mode: 'positive' });
      }
      onDone?.();
      if (!isEdit) reset({ url: '', type: 'discord', description: '' });
    } catch (err: unknown) {
      addToast({ title: 'Error', message: String((err as any)?.message ?? err), mode: 'negative' });
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3"
      style={isEdit ? { outline: '2px solid var(--accent-a4)', borderRadius: 8, padding: 8 } : undefined}
    >
      {isEdit && (
        <Box className="rounded-md border" p="2" style={{ background: 'var(--accent-a2)' }}>
          <Flex align="center" wrap="wrap" justify="between" gap="3">
            <Text size="2">
              Editing existing webhook
            </Text>
            <Flex gap="4" align="center">
              <Button
                type="button"
                variant="ghost"
                color="gray"
                onClick={() =>
                  reset({
                    url: initial?.URL ?? '',
                    type: (initial?.Type as 'discord' | 'slack') ?? 'discord',
                    description: initial?.Description ?? '',
                  })
                }
              >
                Reset changes
              </Button>
              <Button type="button" variant="soft" color="gray" onClick={() => onDone?.()}>
                Cancel edit
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
      <Grid columns={{ initial: '1', sm: '2' }} gap={{ initial: '2', sm: '9' }} align="start">
        <Box>
          <Flex gap="2" direction={{ initial: 'column', sm: 'row' }} align={{ initial: 'start', sm: 'center' }}>
            <Text as="label" size="2" weight="medium">
              Webhook URL
            </Text>
            <TextField.Root className="flex-1 w-full" placeholder="https://example.com/webhook" {...register('url', { required: true })} />
          </Flex>
          <Text size="1" color="gray">Full HTTPS URL to your Discord/Slack webhook endpoint.</Text>
          {formState.errors.url && (
            <Text size="2" color="red">{formState.errors.url.message ?? 'A valid URL is required'} </Text>
          )}
        </Box>

        <Flex gap="3" direction={{ initial: 'column', sm: 'row' }} align={{ initial: 'start', sm: 'center' }}>
          <Text as="label" size="2" weight="medium">
            Type
          </Text>
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
          {formState.errors.type && (
            <Text size="2" color="red">{formState.errors.type.message ?? 'Type is required'}</Text>
          )}
        </Flex>
      </Grid>

      <Flex gap="3" direction={{ initial: 'column', sm: 'row' }} align="start">
        <Text as="label" size="2" weight="medium">
          Description (optional)
        </Text>
        <TextArea className="flex-1 w-full" placeholder="Short description for your team (e.g., channel purpose)" {...register('description')} />
      </Flex>

      <Flex gap="3" align="center">
        <Button
          type="submit"
          disabled={create.isPending || update.isPending || !formState.isValid || !formState.isDirty}
          variant="solid"
        >
          {isEdit ? 'Save changes' : 'Add webhook'}
        </Button>
        {formState.errors.url && (
          <Text size="2" color="red">
            Invalid URL
          </Text>
        )}
      </Flex>
    </form>
  );
}
