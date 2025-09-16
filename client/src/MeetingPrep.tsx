import { useState } from 'react';
import { Title, Autocomplete, Textarea, Button, Box, Paper, Alert } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import api from './api';
import type { Client } from './types';

interface PrepProps {
  clients: Client[];
  onUpdateClientInList: (client: Client) => void;
}

export function MeetingPrep({ clients, onUpdateClientInList }: PrepProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const selectedClient = clients.find(c => c.id.toString() === selectedClientId);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id.toString() === clientId);
    setNotes(client?.prep_notes || '');
    setShowSuccess(false);
  };
  
  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    try {
      const response = await api.put(`/clients/${selectedClient.id}`, { prep_notes: notes });
      onUpdateClientInList(response.data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) { console.error(error); }
  };

  const clientOptions = clients.map(c => ({ value: c.id.toString(), label: c.name }));

  return (
    <Box mb="xl">
      <Title order={2} size="h3" mb="md">Meeting Prep</Title>
      <Paper withBorder p="md">
        <Autocomplete
          label="Select a client to prep for"
          placeholder="Search..."
          data={clientOptions}
          onOptionSubmit={handleSelectClient}
          limit={5}
          mb="md"
        />
        {selectedClient && (
          <>
            <Textarea
              label={`Discussion points for ${selectedClient.name}`}
              placeholder="What do you want to cover in your next call?"
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              autosize
              minRows={4}
            />
            <Button 
              mt="sm" 
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSaveNotes}
            >
              Save Notes
            </Button>
            {showSuccess && <Alert color="green" title="Saved!" mt="sm" withCloseButton onClose={() => setShowSuccess(false)} />}
          </>
        )}
      </Paper>
    </Box>
  );
}