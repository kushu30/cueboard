import { Title, Container, Button, Group, SimpleGrid, Paper, Text, Badge } from '@mantine/core';
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
  return (
    <Container>
      <Group justify="space-between" mb="xl">
        <Title order={1}>Dashboard</Title>
        <Button onClick={openAddClientModal}>Add New Client</Button>
      </Group>

      <PriorityQueue clients={clients} onClientSelect={onClientSelect} />
      
      <MeetingPrep clients={clients} onUpdateClientInList={onUpdateClientInList} />

      <Title order={2} size="h3" mt="xl" mb="md">All Clients ({clients.length})</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {clients.map((client, idx) => {
            const idKey = client.id ?? `client-fallback-${idx}`;
            const tags = client.tags ? client.tags.split(',').map(t => t.trim()).filter(t => t) : [];
            return (
                <Paper 
                    key={idKey}
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
                            {tags.map((tag, tagIdx) => <Badge key={`${idKey}-tag-${tagIdx}`} size="sm" variant="outline">{tag}</Badge>)}
                        </Group>
                    )}
                </Paper>
            )
        })}
      </SimpleGrid>
    </Container>
  );
}
