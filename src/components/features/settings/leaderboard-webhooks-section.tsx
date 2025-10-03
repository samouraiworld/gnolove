'use client';

import { Button, Flex, Heading, Section, Separator, Table, Text, Box, AlertDialog, Link } from '@radix-ui/themes';
import { Check, Trash2, X } from 'lucide-react';
import { useDeleteLeaderboardWebhook, useLeaderboardWebhooks } from '@/hooks/use-leaderboard-webhooks';
import { useToast } from '@/contexts/toast-context';
import type { TLeaderboardWebhook as Webhook } from '@/utils/schemas';
import LeaderboardWebhookForm from './leaderboard-webhook-form';
import { useState } from 'react';

export default function LeaderboardWebhooksSection() {
  const { data, isLoading } = useLeaderboardWebhooks();
  const { addToast } = useToast();
  const [editItem, setEditItem] = useState<Webhook | undefined>(undefined);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  const del = useDeleteLeaderboardWebhook();
  const handleDelete = async (wh: Webhook) => {
    try {
      await del.mutateAsync(wh.id!);
      addToast({ title: 'Webhook deleted', message: '', mode: 'positive' });
    } catch (err: unknown) {
      addToast({ title: 'Error deleting webhook', message: String((err as any)?.message ?? err), mode: 'negative' });
    }
  };

  return (
    <Section>
      <Box p="4" className="rounded-lg border border-[var(--gray-a5)] bg-[var(--color-panel-solid)]">
        <Heading size="4" mb="2">Leaderboard webhooks</Heading>
        <Text size="2" color="gray">Configure periodic leaderboard notifications. Choose frequency, time and repositories.</Text>

        <Box mt="3">
          <LeaderboardWebhookForm onDone={() => setEditItem(undefined)} initial={editItem} />
        </Box>

        <Separator my="3" />

        {isLoading ? (
          <Text>Loading...</Text>
        ) : !data || data.length === 0 ? (
          <Box p="3" className="rounded-md bg-[var(--accent-a2)]">
            <Text color="gray">No webhooks yet. Add one above to start receiving notifications.</Text>
          </Box>
        ) : (
          <>
            <Box className="hidden md:block overflow-x-auto">
              <Table.Root variant="surface" className="min-w-[800px]">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Schedule</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Timezone</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Active</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.map((w) => (
                    <Table.Row key={`${w.id}-${w.url}`}>
                      <Table.Cell className="max-w-[420px]">
                        <Link href={w.url} target="_blank" title={w.url} rel="noopener" className="block max-w-full truncate overflow-hidden whitespace-normal">
                          {w.url}
                        </Link>
                      </Table.Cell>
                      <Table.Cell>{w.type}</Table.Cell>
                      <Table.Cell>
                        {w.frequency === 'daily' ? (
                          <Text>Daily at {String(w.hour).padStart(2, '0')}:{String(w.minute).padStart(2, '0')}</Text>
                        ) : (
                          <Text>Weekly on {dayNames[w.day || 0]} at {String(w.hour).padStart(2, '0')}:{String(w.minute).padStart(2, '0')}</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>{w.timezone}</Table.Cell>
                      <Table.Cell>{w.active ? <Check /> : <X />}</Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          <Button onClick={() => setEditItem(w)} variant="soft">Edit</Button>
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
                                This will remove the {w.type.toUpperCase()} webhook. This action cannot be undone.
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

            <Box className="space-y-3 md:hidden">
              {data.map((w) => (
                <Box key={`${w.id}-${w.url}`} className="rounded-md border p-3 space-y-2">
                  <div>
                    <Text weight="medium">URL</Text>
                    <Link href={w.url} target="_blank" rel="noopener" title={w.url} className="block word-break-break-all overflow-wrap-anywhere">
                      {w.url}
                    </Link>
                  </div>
                  <Flex gap="2">
                    <Text weight="medium">Type</Text>
                    <Text>{w.type}</Text>
                  </Flex>
                  <Flex gap="2">
                    <Text weight="medium">Schedule</Text>
                    <Text>
                      {w.frequency === 'daily'
                        ? `Daily at ${String(w.hour).padStart(2, '0')}:${String(w.minute).padStart(2, '0')}`
                        : `Weekly on ${dayNames[w.day || 0]} at ${String(w.hour).padStart(2, '0')}:${String(w.minute).padStart(2, '0')}`}
                    </Text>
                  </Flex>
                  <Flex gap="2">
                    <Text weight="medium">Timezone</Text>
                    <Text>{w.timezone}</Text>
                  </Flex>
                  <Flex gap="2">
                    <Text weight="medium">Active</Text>
                    <Text>{w.active ? <Check /> : <X />}</Text>
                  </Flex>
                  <Flex gap="2" pt="2">
                    <Button onClick={() => setEditItem(w)} variant="soft">Edit</Button>
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
                          This will remove the {w.type.toUpperCase()} webhook. This action cannot be undone.
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
