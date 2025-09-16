import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Card, Stack, Textarea, Select, Group, Paper, Badge, Modal, TextInput, NumberInput, Anchor, MultiSelect, Timeline } from '@mantine/core';
import { IconMail, IconPhone, IconUsers, IconMessageCircle } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import api from './api';
import type { Client, Interaction, ClientPriority } from './types';

const PREMADE_TAGS = ['premium', 'at-risk', 'new-lead', 'renewal-due', 'needs-onboarding'];

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
  onClientUpdate: (client: Client) => void;
  onClientDelete: (clientId: number) => void;
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

  const interactionForm = useForm({
    initialValues: { type: 'email', notes: '' },
    validate: { notes: (value) => (value.trim().length === 0 ? 'Notes cannot be empty' : null) },
  });

  const editForm = useForm({
    initialValues: {
      ...client,
      tags: client.tags ? client.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name is required' : null),
      contact_email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });
  
  useEffect(() => {
    api.get(`/clients/${client.id}/interactions`)
      .then(res => setInteractions(res.data))
      .catch(console.error);
    
    editForm.setValues({
      ...client,
      tags: client.tags ? client.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });

  }, [client]);

  const handleAddInteraction = async (values: typeof interactionForm.values) => {
    try {
      const response = await api.post(`/clients/${client.id}/interactions`, values);
      setInteractions([response.data, ...interactions]);
      interactionForm.reset();
    } catch (error) { console.error('Failed to add interaction:', error); }
  };

  const handleUpdateClient = async (values: any) => {
    try {
      const payload = { ...values, tags: values.tags.join(',') };
      const response = await api.put(`/clients/${client.id}`, payload);
      onClientUpdate(response.data);
      closeEdit();
    } catch (error) { console.error('Failed to update client:', error); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${client.id}`);
      onClientDelete(client.id);
    } catch (error) { console.error('Failed to delete client:', error); }
  };

  const clientTags = client.tags ? client.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const tagData = [...new Set([...PREMADE_TAGS, ...editForm.values.tags])];

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

      <Modal opened={notesOpened} onClose={closeNotes} title={`Prep Notes for ${client.name}`}>
        <Textarea value={client.prep_notes || 'No prep notes saved.'} readOnly minRows={10} autosize />
      </Modal>

      <Button onClick={onBack} mb="md" variant="light">&larr; Back to Dashboard</Button>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <div>
            <Title order={2}>{client.name}</Title>
            {client.website_url && 
              <Anchor href={client.website_url.startsWith('http') ? client.website_url : `https://${client.website_url}`} target="_blank" rel="noopener noreferrer" size="sm" c="dimmed">
                {client.website_url}
              </Anchor>
            }
          </div>
          <Group>
            {client.prep_notes && (
              <Button variant="outline" size="xs" onClick={openNotes}>View Prep Notes</Button>
            )}
            <Button variant="light" size="xs" onClick={openEdit}>Edit</Button>
            <Button variant="filled" color="red" size="xs" onClick={openDelete}>Delete</Button>
          </Group>
        </Group>
        <Group mt="md">
          <Badge variant="light" color="gray">Owner: {client.owner}</Badge>
          <Badge variant="light" color="gray">Cadence: {client.contact_cadence_days} days</Badge>
          <Badge variant="filled" color={{high: 'red', medium: 'orange', low: 'gray'}[client.priority]}>{client.priority} priority</Badge>
        </Group>
        {clientTags.length > 0 && (
          <Group gap="xs" mt="sm">{clientTags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}</Group>
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
                {interactions.map((item) => {
                    const Icon = interactionIcons[item.type as keyof typeof interactionIcons] || interactionIcons.default;
                    return (
                        <Timeline.Item key={item.id} bullet={<Icon size={14} />} title={item.type.charAt(0).toUpperCase() + item.type.slice(1)}>
                            <Text>{item.notes}</Text>
                            <Text size="xs" c="dimmed" mt={4}>
                                {new Date(item.date).toLocaleString()} by {item.user_email}
                            </Text>
                        </Timeline.Item>
                    )
                })}
              </Timeline>
            ) : (<Text c="dimmed" size="sm">No interactions logged yet.</Text>)}
        </Paper>
      </Group>
    </>
  );
}