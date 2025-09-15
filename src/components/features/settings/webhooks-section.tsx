'use client';

import { useState } from 'react';
import { Button, Flex, Link, Heading, Section, Separator, Table, Text, Box, AlertDialog } from '@radix-ui/themes';
import { Trash2 } from 'lucide-react';
import { useDeleteMonitoringWebhook, useMonitoringWebhooks } from '@/hooks/use-monitoring-webhooks';
import { useToast } from '@/contexts/toast-context';
import type { TMonitoringWebhook as Webhook, TMonitoringWebhookKind as WebhookKind } from '@/utils/schemas';
import WebhookFormClient from './webhook-form';

export default function WebhooksSectionClient({ kind }: { kind: WebhookKind }) {
  const { data, isLoading } = useMonitoringWebhooks(kind);
  const { addToast } = useToast();
  const [editItem, setEditItem] = useState<Webhook | undefined>(undefined);
  const del = useDeleteMonitoringWebhook(kind);
  const handleDelete = async (wh: Webhook) => {
    try {
      await del.mutateAsync(wh.ID!);
      addToast({ title: 'Webhook deleted', message: `${wh.Type.toUpperCase()}`, mode: 'positive' });
    } catch (err: unknown) {
      addToast({ title: 'Error deleting webhook', message: String((err as any)?.message ?? err), mode: 'negative' });
    }
  };

  return (
    <Section>
      <Box p="4" className="rounded-lg border border-[var(--gray-a5)] bg-[var(--color-panel-solid)]">
        <Heading size="4" mb="2">
          {kind === 'govdao' ? 'GOVDAO webhooks' : 'Validators webhooks'}
        </Heading>
        <Text size="2" color="gray">
          Configure team notifications for {kind === 'govdao' ? 'GOVDAO proposals' : 'validator events'}. Add your Discord or Slack webhooks and an optional description.
        </Text>

        <Box mt="3">
          <WebhookFormClient kind={kind} onDone={() => setEditItem(undefined)} initial={editItem} />
        </Box>

        <Separator my="3" />

        {isLoading ? (
          <Text>Loading...</Text>
        ) : !data || data.length === 0 ? (
          <Box p="3" className="rounded-md" style={{ background: 'var(--accent-a2)' }}>
            <Text color="gray">No webhooks yet. Add one above to start receiving notifications.</Text>
          </Box>
        ) : (
          <>
            {/* Desktop/tablet (md+) */}
            <Box className="hidden md:block" style={{ overflowX: 'auto' }}>
              <Table.Root variant="surface" style={{ minWidth: 600 }}>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.map((w) => (
                    <Table.Row key={`${w.ID}-${w.URL}`}>
                      <Table.Cell style={{ maxWidth: 420 }}>
                        <Link
                          href={w.URL}
                          target="_blank"
                          title={w.URL}
                          style={{
                            display: 'block',
                            maxWidth: '100%',
                            wordBreak: 'break-all',
                            overflowWrap: 'anywhere',
                            whiteSpace: 'normal',
                          }}
                        >
                          {w.URL}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>{w.Type}</Table.Cell>
                      <Table.Cell>{w.Description}</Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          <Button onClick={() => setEditItem(w)} variant="soft">
                            Edit
                          </Button>
                          <AlertDialog.Root>
                            <AlertDialog.Trigger>
                              <Button color="red" variant="soft" disabled={del.isPending}>
                                <Trash2 size={16} />
                                Delete
                              </Button>
                            </AlertDialog.Trigger>
                            <AlertDialog.Content maxWidth="450px">
                              <AlertDialog.Title>Delete webhook?</AlertDialog.Title>
                              <AlertDialog.Description>
                                This will remove the {w.Type.toUpperCase()} webhook ({w.URL}). This action cannot be undone.
                              </AlertDialog.Description>
                              <Flex gap="3" mt="4" justify="end">
                                <AlertDialog.Cancel>
                                  <Button variant="soft" color="gray">Cancel</Button>
                                </AlertDialog.Cancel>
                                <AlertDialog.Action>
                                  <Button color="red" onClick={() => handleDelete(w)} disabled={del.isPending}>Delete</Button>
                                </AlertDialog.Action>
                              </Flex>
                            </AlertDialog.Content>
                          </AlertDialog.Root>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Mobile (below md): card list */}
            <Box className="space-y-3 md:hidden">
              {data.map((w) => (
                <Box key={`${w.ID}-${w.URL}`} className="rounded-md border p-3 space-y-2">
                  <div>
                    <Text weight="medium">URL</Text>
                    <Link
                      href={w.URL}
                      target="_blank"
                      title={w.URL}
                      style={{ display: 'block', wordBreak: 'break-all', overflowWrap: 'anywhere' }}
                    >
                      {w.URL}
                    </Link>
                  </div>
                  <Flex gap="2">
                    <Text weight="medium">Type</Text>
                    <Text>{w.Type}</Text>
                  </Flex>
                  {w.Description && (
                    <Flex gap="2">
                      <Text weight="medium">Description</Text>
                      <Text>{w.Description}</Text>
                    </Flex>
                  )}
                  <Flex gap="2" pt="2">
                    <Button onClick={() => setEditItem(w)} variant="soft">
                      Edit
                    </Button>
                    <AlertDialog.Root>
                      <AlertDialog.Trigger>
                        <Button color="red" variant="soft" disabled={del.isPending}>
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Content maxWidth="450px">
                        <AlertDialog.Title>Delete webhook?</AlertDialog.Title>
                        <AlertDialog.Description>
                          This will remove the {w.Type.toUpperCase()} webhook ({w.URL}). This action cannot be undone.
                        </AlertDialog.Description>
                        <Flex gap="3" mt="4" justify="end">
                          <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">Cancel</Button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action>
                            <Button color="red" onClick={() => handleDelete(w)} disabled={del.isPending}>Delete</Button>
                          </AlertDialog.Action>
                        </Flex>
                      </AlertDialog.Content>
                    </AlertDialog.Root>
                  </Flex>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Section>
  );
}
