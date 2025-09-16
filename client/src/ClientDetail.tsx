import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Card, Stack, Textarea, Select, Group, Paper, Badge, Modal, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import api from './api';

interface Client {
  id: number; name: string; company: string; contact_email: string; owner: string;
}
interface Interaction {
  id: number; type: string; notes: string; date: string; user_email: string;
}
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

  const interactionForm = useForm({
    initialValues: { type: 'email', notes: '' },
    validate: { notes: (value) => (value.trim().length === 0 ? 'Notes cannot be empty' : null) },
  });

  const editForm = useForm({
    initialValues: { ...client },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name is required' : null),
      contact_email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  useEffect(() => {
    api.get(`/clients/${client.id}/interactions`)
      .then(response => setInteractions(response.data))
      .catch(error => console.error('Failed to fetch interactions:', error));
  }, [client.id]);

  const handleAddInteraction = async (values: typeof interactionForm.values) => {
    try {
      const response = await api.post(`/clients/${client.id}/interactions`, values);
      setInteractions([response.data, ...interactions]);
      interactionForm.reset();
    } catch (error) { console.error('Failed to add interaction:', error); }
  };

  const handleUpdateClient = async (values: typeof editForm.values) => {
    try {
        const response = await api.put(`/clients/${client.id}`, values);
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

  return (
    <>
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Client">
        <form onSubmit={editForm.onSubmit(handleUpdateClient)}>
          <Stack>
            <TextInput withAsterisk label="Name" {...editForm.getInputProps('name')} />
            <TextInput label="Company" {...editForm.getInputProps('company')} />
            <TextInput withAsterisk label="Contact Email" {...editForm.getInputProps('contact_email')} />
            <TextInput label="Owner" {...editForm.getInputProps('owner')} />
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

      <Container size="md" pt="xl">
        <Button onClick={onBack} mb="md">&larr; Back to Client List</Button>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Title order={2}>{client.name}</Title>
              <Text c="dimmed">{client.company}</Text>
            </div>
            <Group>
              <Button variant="light" onClick={openEdit}>Edit</Button>
              <Button variant="light" color="red" onClick={openDelete}>Delete</Button>
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
          <Stack mt="md">{interactions.map((i) => (<Paper key={i.id} p="md" shadow="xs" withBorder>{/* ... */}</Paper>))}</Stack>
        ) : (<Text mt="md">No interactions logged yet.</Text>)}
      </Container>
    </>
  );
}