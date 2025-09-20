// src/ClientDetail.tsx
import { useState, useEffect } from 'react';
import {
  Title, Text, Button, Card, Stack, Textarea, Select, Group,
  Paper, Badge, Modal, TextInput, NumberInput, Anchor, MultiSelect, Timeline
} from '@mantine/core';
import { IconMail, IconPhone, IconUsers, IconMessageCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import api from './api';
import type { Client, Interaction } from './types';

const PREMADE_TAGS = ['premium', 'at-risk', 'new-lead', 'renewal-due', 'needs-onboarding'];

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onClientUpdate: (client: Client) => void;
  // Accept string or number for id to match Mongo _id or numeric ids
  onClientDelete: (clientId: string | number) => void;
}

const interactionIcons = {
  email: IconMail,
  call: IconPhone,
  meeting: IconUsers,
  default: IconMessageCircle,
};

export function ClientDetail({ client, onBack, onClientUpdate, onClientDelete }: ClientDetailProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [notesOpened, { open: openNotes, close: closeNotes }] = useDisclosure(false);

  // interaction form
  const interactionForm = useForm({
    initialValues: { type: 'email', notes: '' },
    validate: { notes: (value) => (value.trim().length === 0 ? 'Notes cannot be empty' : null) },
  });

  // edit form - initialize with safe defaults
  const editForm = useForm({
    initialValues: {
      name: client?.name ?? '',
      company: client?.company ?? '',
      contact_email: client?.contact_email ?? '',
      owner: client?.owner ?? '',
      website_url: client?.website_url ?? '',
      contact_cadence_days: client?.contact_cadence_days ?? 7,
      priority: client?.priority ?? 'medium',
      tags: client?.tags ? client.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name is required' : null),
      contact_email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  // helper: get an id string suitable for API paths (works with number or string)
  const clientIdForApi = (c: Client) => {
    // prefer c.id, then c._id, and fallback to empty string (guarded in callers)
    return String(c?.id ?? (c as any)?._id ?? '');
  };

  useEffect(() => {
    // if client id missing, skip fetching
    const idForApi = clientIdForApi(client);
    if (!idForApi) return;

    api.get(`/clients/${encodeURIComponent(idForApi)}/interactions`)
      .then(res => setInteractions(res.data || []))
      .catch(err => {
        console.error('Failed to load interactions for client', idForApi, err);
        setInteractions([]);
      });

    // update edit form whenever client prop changes
    editForm.setValues({
      name: client?.name ?? '',
      company: client?.company ?? '',
      contact_email: client?.contact_email ?? '',
      owner: client?.owner ?? '',
      website_url: client?.website_url ?? '',
      contact_cadence_days: client?.contact_cadence_days ?? 7,
      priority: client?.priority ?? 'medium',
      tags: client?.tags ? client.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]); // intentionally only depend on client reference

  const handleAddInteraction = async (values: typeof interactionForm.values) => {
    const idForApi = clientIdForApi(client);
    if (!idForApi) {
      console.error('Cannot add interaction: client id missing', client);
      return;
    }
    try {
      const response = await api.post(`/clients/${encodeURIComponent(idForApi)}/interactions`, values);
      setInteractions(prev => [response.data, ...prev]);
      interactionForm.reset();
    } catch (error) {
      console.error('Failed to add interaction:', error);
    }
  };

  const handleUpdateClient = async (values: any) => {
    const idForApi = clientIdForApi(client);
    if (!idForApi) {
      console.error('Cannot update client: id missing', client);
      return;
    }
    try {
      const payload = { ...values, tags: (values.tags || []).join(',') };
      const response = await api.put(`/clients/${encodeURIComponent(idForApi)}`, payload);
      onClientUpdate(response.data);
      closeEdit();
    } catch (error) {
      console.error('Failed to update client:', error);
    }
  };

  const handleDelete = async () => {
    const idForApi = clientIdForApi(client);
    if (!idForApi) {
      console.error('Cannot delete client: id missing', client);
      return;
    }
    try {
      await api.delete(`/clients/${encodeURIComponent(idForApi)}`);
      // pass through original id type preference: prefer client.id if present else _id
      const outgoingId: string | number = client.id ?? (client as any)?._id ?? idForApi;
      onClientDelete(outgoingId);
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  // render helpers
  const clientTags = (client?.tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
  const tagData = Array.from(new Set([...PREMADE_TAGS, ...editForm.values.tags]));

  const priorityColorMap: Record<string, string> = { high: 'red', medium: 'orange', low: 'gray' };

  return (
    <>
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Client">
        <form onSubmit={editForm.onSubmit(handleUpdateClient)}>
          <Stack>
            <TextInput withAsterisk label="Name" {...editForm.getInputProps('name')} />
            <TextInput label="Company" {...editForm.getInputProps('company')} />
            <TextInput withAsterisk label="Contact Email" {...editForm.getInputProps('contact_email')} />
            <TextInput label="Owner" {...editForm.getInputProps('owner')} />
            <TextInput label="Website URL" placeholder="https://example.com" {...editForm.getInputProps('website_url')} />
            <NumberInput label="Contact Cadence (Days)" placeholder="7" min={1} {...editForm.getInputProps('contact_cadence_days')} />
            <Select
              label="Priority"
              data={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]}
              {...editForm.getInputProps('priority')}
            />
            <MultiSelect
              label="Tags"
              placeholder="Select tags"
              data={tagData}
              searchable
              {...editForm.getInputProps('tags')}
            />
            <Button type="submit" mt="md">Save Changes</Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deleteOpened} onClose={closeDelete} title="Confirm Deletion" centered size="sm">
        <Text>Are you sure you want to delete this client? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" onClick={handleDelete}>Delete Client</Button>
        </Group>
      </Modal>

      <Modal opened={notesOpened} onClose={closeNotes} title={`Prep Notes for ${client?.name ?? 'Client'}`}>
        <Textarea value={client?.prep_notes ?? 'No prep notes saved.'} readOnly minRows={10} autosize />
      </Modal>

      <Button onClick={onBack} mb="md" variant="light">&larr; Back to Dashboard</Button>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <div>
            <Title order={2}>{client?.name ?? 'Unnamed client'}</Title>
            {client?.website_url && (
              <Anchor
                href={client.website_url.startsWith('http') ? client.website_url : `https://${client.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                c="dimmed"
              >
                {client.website_url}
              </Anchor>
            )}
          </div>

          <Group>
            {client?.prep_notes && (
              <Button variant="outline" size="xs" onClick={openNotes}>View Prep Notes</Button>
            )}
            <Button variant="light" size="xs" onClick={openEdit}>Edit</Button>
            <Button variant="filled" color="red" size="xs" onClick={openDelete}>Delete</Button>
          </Group>
        </Group>

        <Group mt="md">
          <Badge variant="light" color="gray">Owner: {client?.owner ?? '—'}</Badge>
          <Badge variant="light" color="gray">Cadence: {client?.contact_cadence_days ?? '—'} days</Badge>
          <Badge variant="filled" color={priorityColorMap[client?.priority ?? 'medium']}>
            {(client?.priority ?? 'medium') + ' priority'}
          </Badge>
        </Group>

        {clientTags.length > 0 && (
          <Group gap="xs" mt="sm">
            {clientTags.map((tag, i) => <Badge key={`${String(client?.id ?? (client as any)?._id ?? 'noid')}-tag-${i}`} variant="outline">{tag}</Badge>)}
          </Group>
        )}
      </Card>

      <Group mt="xl" grow align="flex-start">
        <Paper withBorder p="lg" radius="md" style={{ flexBasis: '30%' }}>
          <Title order={4} mb="md">Log a New Interaction</Title>
          <form onSubmit={interactionForm.onSubmit(handleAddInteraction)}>
            <Stack>
              <Select data={['email', 'call', 'meeting']} {...interactionForm.getInputProps('type')} />
              <Textarea placeholder="Enter notes..." autosize minRows={4} {...interactionForm.getInputProps('notes')} />
              <Button type="submit">Log Interaction</Button>
            </Stack>
          </form>
        </Paper>

        <Paper p="lg" radius="md" style={{ flexBasis: '70%' }}>
          <Title order={4} mb="lg">Interaction History</Title>

          {interactions.length > 0 ? (
            <Timeline active={interactions.length} bulletSize={24} lineWidth={2}>
              {interactions.map((item, idx) => {
                const Icon = interactionIcons[(item.type as keyof typeof interactionIcons) ?? 'default'] || interactionIcons.default;
                const key = String((item as any)._id ?? item.id ?? `idx-${idx}`);
                return (
                  <Timeline.Item
                    key={key}
                    bullet={<Icon size={14} />}
                    title={(item.type ?? 'interaction').toString().charAt(0).toUpperCase() + (item.type ?? 'interaction').toString().slice(1)}
                  >
                    <Text>{item.notes}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {item.date ? new Date(item.date).toLocaleString() : 'Unknown date'} by {item.user_email ?? 'Unknown'}
                    </Text>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          ) : (
            <Text c="dimmed" size="sm">No interactions logged yet.</Text>
          )}
        </Paper>
      </Group>
    </>
  );
}

export default ClientDetail;
