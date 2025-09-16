import { useEffect, useState } from 'react';
import { Title, Container, Button, Group, SimpleGrid, Paper, Text, Badge, MultiSelect } from '@mantine/core';
import type { Client } from './types';
import { MeetingPrep } from './MeetingPrep';
import { PriorityQueue } from './PriorityQueue';

interface DashboardProps {
  clients: Client[];
  onClientSelect: (client: Client) => void;
  openAddClientModal: () => void;
  onUpdateClientInList: (client: Client) => void;
}

export function Dashboard({ clients, onClientSelect, openAddClientModal, onUpdateClientInList }: DashboardProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Create a unique list of all available tags from all clients
  const allTags = [...new Set(clients.flatMap(c => c.tags ? c.tags.split(',') : []).map(t => t.trim()).filter(Boolean))];

  const processedClients = clients
    .filter(client => {
      // If no tags are selected, show all clients
      if (selectedTags.length === 0) return true;
      const clientTags = client.tags ? client.tags.split(',').map(t => t.trim()) : [];
      // Show client if they have ALL of the selected tags
      return selectedTags.every(tag => clientTags.includes(tag));
    });
  
  return (
    <Container>
      <Group justify="space-between" mb="xl">
        <Title order={1}>Dashboard</Title>
        <Button onClick={openAddClientModal}>Add New Client</Button>
      </Group>

      <PriorityQueue clients={clients} onClientSelect={onClientSelect} />
      
      <MeetingPrep clients={clients} onUpdateClientInList={onUpdateClientInList} />

      <Title order={2} size="h3" mt="xl" mb="md">All Clients ({processedClients.length})</Title>
      <MultiSelect
          placeholder="Filter by tags..."
          data={allTags}
          value={selectedTags}
          onChange={setSelectedTags}
          clearable
          mb="xl"
        />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {processedClients.map(client => {
            const tags = client.tags ? client.tags.split(',').map(t => t.trim()).filter(t => t) : [];
            return (
                <Paper 
                    key={client.id} 
                    withBorder 
                    p="md" 
                    radius="md" 
                    onClick={() => onClientSelect(client)} 
                    style={{ cursor: 'pointer' }}
                    component="button"
                >
                    <Group justify="space-between" align="flex-start">
                        <Text fw={500}>{client.name}</Text>
                        <Badge variant="light" color="gray">{client.owner}</Badge>
                    </Group>
                    <Text size="sm" c="dimmed">{client.company}</Text>
                    {tags.length > 0 && (
                        <Group gap={4} mt="sm">
                            {tags.map(tag => <Badge key={tag} size="sm" variant="outline">{tag}</Badge>)}
                        </Group>
                    )}
                </Paper>
            )
        })}
      </SimpleGrid>
      {processedClients.length === 0 && <Text c="dimmed" mt="md">No clients match your filters.</Text>}
    </Container>
  );
}