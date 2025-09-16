import { useState, useEffect } from 'react';
import { Title, Paper, Group, Textarea, Button, ActionIcon, Autocomplete, Text, Box } from '@mantine/core';
import { IconMail, IconClipboardList, IconTrash } from '@tabler/icons-react';
import api from './api';
import type { Client } from './types';

interface AgendaItem {
  id: number;
  client_id: number;
  client_name: string;
  contact_email: string;
  discussion_points: string;
}
interface AgendaProps {
  clients: Client[];
  onClientSelect: (client: Client) => void;
}

export function Agenda({ clients, onClientSelect }: AgendaProps) {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [addClientValue, setAddClientValue] = useState('');

  const fetchAgenda = () => {
    api.get('/api/agenda')
      .then(res => setAgendaItems(res.data))
      .catch(console.error);
  };

  useEffect(() => { fetchAgenda(); }, []);

  const handleAddClientToAgenda = async (clientId: string) => {
    try {
      await api.post('/api/agenda', { client_id: clientId });
      fetchAgenda();
      setAddClientValue('');
    } catch (error) { console.error(error); }
  };

  const handleUpdateNotes = (id: number, notes: string) => {
    api.put(`/api/agenda/${id}`, { discussion_points: notes }).catch(console.error);
  };
  
  const handleComplete = (id: number, clientId: number) => {
      api.put(`/api/agenda/${id}`, { status: 'done' })
        .then(() => {
            fetchAgenda();
            const client = clients.find(c => c.id === clientId);
            if (client) onClientSelect(client);
        })
        .catch(console.error);
  };

  const clientOptions = clients.map(c => ({ value: c.id.toString(), label: c.name }));

  return (
    <Box mb="xl">
      <Title order={2} size="h3" mb="md">Today's Agenda</Title>
      <Autocomplete
        label="Add a client to your agenda"
        placeholder="Search for a client..."
        data={clientOptions}
        value={addClientValue}
        onChange={setAddClientValue}
        onOptionSubmit={handleAddClientToAgenda}
        limit={5}
      />
      
      {agendaItems.map(item => (
        <Paper withBorder p="md" mt="md" key={item.id}>
          <Group justify="space-between">
            <Text fw={500}>{item.client_name}</Text>
            <Group gap="xs">
              <Button 
                component="a"
                href={`mailto:${item.contact_email}?subject=Catching Up&body=${encodeURIComponent(item.discussion_points)}`}
                variant="subtle" 
                size="compact-xs" 
                leftSection={<IconMail size={14} />}
              >
                Email
              </Button>
              <Button 
                variant="subtle" 
                size="compact-xs" 
                leftSection={<IconClipboardList size={14} />}
                onClick={() => handleComplete(item.id, item.client_id)}
              >
                Log & Complete
              </Button>
            </Group>
          </Group>
          <Textarea
            placeholder="Things to discuss..."
            defaultValue={item.discussion_points}
            onBlur={(e) => handleUpdateNotes(item.id, e.currentTarget.value)}
            autosize
            minRows={2}
            mt="sm"
          />
        </Paper>
      ))}
    </Box>
  );
}