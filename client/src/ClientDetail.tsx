import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Card, Stack, Textarea, Select, Group, Paper, Badge, Modal, TextInput, NumberInput, Anchor, MultiSelect } from '@mantine/core';
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

      <Container size="md" pt="xl">
        <Button onClick={onBack} mb="md">&larr; Back to Client List</Button>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Title order={2}>{client.name}</Title>
              {client.website_url && 
                <Anchor href={client.website_url.startsWith('http') ? client.website_url : `https://${client.website_url}`} target="_blank" rel="noopener noreferrer" size="xs">
                  {client.website_url}
                </Anchor>
              }
              {clientTags.length > 0 && (
                <Group gap="xs" mt="sm">{clientTags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}</Group>
              )}
            </div>
            <Group>
              {client.prep_notes && (
                <Button variant="outline" onClick={openNotes}>View Prep Notes</Button>
              )}
              <Button variant="light" onClick={openEdit}>Edit</Button>
            </Group>
          </Group>
          <Text mt="sm">Contact: {client.contact_email}</Text>
          <Text>Owner: {client.owner}</Text>
        </Card>
        
        <Title order={3} mt="xl">Log Interaction</Title>
        <Paper shadow="xs" p="md" withBorder mt="md">
          <form onSubmit={interactionForm.onSubmit(handleAddInteraction)}>
            <Stack>
              <Select label="Interaction Type" data={['email', 'call', 'meeting']} {...interactionForm.getInputProps('type')} />
              <Textarea label="Notes" placeholder="Enter notes..." withAsterisk autosize minRows={3} {...interactionForm.getInputProps('notes')} />
              <Button type="submit" style={{ alignSelf: 'flex-start' }}>Add Interaction</Button>
            </Stack>
          </form>
        </Paper>
        <Title order={3} mt="xl">Interaction History</Title>
        {interactions.length > 0 ? (
          <Stack mt="md">
            {interactions.map((interaction) => (
              <Paper key={interaction.id} p="md" shadow="xs" withBorder>
                <Group justify='space-between'>
                  <Badge>{interaction.type.toUpperCase()}</Badge>
                  <Text c="dimmed" size="xs">
                    {new Date(interaction.date).toLocaleString()} by {interaction.user_email}
                  </Text>
                </Group>
                <Text mt="sm">{interaction.notes}</Text>
              </Paper>
            ))}
          </Stack>
        ) : ( <Text mt="md">No interactions logged yet.</Text> )}
      </Container>
    </>
  );
}