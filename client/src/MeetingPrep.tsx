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
  const [autocompleteValue, setAutocompleteValue] = useState(''); // show label in Autocomplete

  // Safe find: compare stringified ids, guard against undefined ids
  const selectedClient = clients.find(c => String(c?.id) === String(selectedClientId));

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => String(c?.id) === String(clientId));
    setNotes(client?.prep_notes ?? '');
    setShowSuccess(false);
    // set autocomplete label value to client name for UX
    setAutocompleteValue(client?.name ?? '');
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

  // Build options safely; exclude clients without id (or provide fallback)
  const clientOptions = clients
    .map(c => ({ value: String(c?.id ?? ''), label: c?.name ?? '' }))
    .filter(opt => opt.value !== '');

  return (
    <Box mb="xl">
      <Title order={2} size="h3" mb="md">Meeting Prep</Title>
      <Paper withBorder p="md">
        <Autocomplete
          label="Select a client to prep for"
          placeholder="Search..."
          data={clientOptions}
          onOptionSubmit={(val) => {
            // val is the value of the selected option
            handleSelectClient(val);
          }}
          limit={5}
          mb="md"
          // show the selected client's name in the input
          value={autocompleteValue}
          onChange={(v) => {
            setAutocompleteValue(v);
            // if user cleared input, clear selected client
            if (!v) {
              setSelectedClientId(null);
              setNotes('');
            }
          }}
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
