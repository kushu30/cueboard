import { useEffect, useState } from 'react';
import { Table, Title, Container, Button, Group, TextInput, Alert, List, ThemeIcon, Badge, ActionIcon } from '@mantine/core';
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';
import api from './api';
import type { Client } from './types';

interface Reminder {
  id: number; rule: string; client_name: string; client_id: number;
}
interface DashboardProps {
  clients: Client[];
  onClientSelect: (client: Client) => void;
  openAddClientModal: () => void;
  handleLogout: () => void;
}

export function Dashboard({ clients, onClientSelect, openAddClientModal, handleLogout }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    api.get('/api/reminders')
      .then(response => setReminders(response.data))
      .catch(error => console.error("Failed to fetch reminders:", error));
  }, []);

  const handleDismissReminder = async (reminderId: number) => {
    try {
      await api.put(`/api/reminders/${reminderId}`, { status: 'dismissed' });
      setReminders(reminders.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error("Failed to dismiss reminder:", error);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const rows = filteredClients.map((client) => {
    const tags = client.tags ? client.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    return (
      <Table.Tr key={client.id} onClick={() => onClientSelect(client)} style={{ cursor: 'pointer' }}>
        <Table.Td>{client.name}</Table.Td>
        <Table.Td>{client.company}</Table.Td>
        <Table.Td>
          {tags.length > 0 ? (
            <Group gap="xs">
              {tags.map(tag => <Badge key={tag} size="sm" variant="light">{tag}</Badge>)}
            </Group>
          ) : null}
        </Table.Td>
        <Table.Td>{client.owner}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="lg" pt="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Cueboard</Title>
        <Group>
          <Button onClick={openAddClientModal}>Add New Client</Button>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </Group>
      </Group>

      {reminders.length > 0 && (
        <Alert icon={<IconAlertTriangle size="1rem" />} title="Needs Attention" color="orange" mb="xl">
          <List spacing="xs">
            {reminders.map(r => (
              <List.Item key={r.id}>
                <Group justify="space-between">
                  <span>
                    <a href="#" onClick={(e) => { e.preventDefault(); const c = clients.find(cl => cl.id === r.client_id); if (c) onClientSelect(c); }}>
                      {r.client_name}
                    </a> - {r.rule}
                  </span>
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="gray"
                    leftSection={<IconCircleCheck size={14} />}
                    onClick={() => handleDismissReminder(r.id)}
                  >
                    Dismiss
                  </Button>
                </Group>
              </List.Item>
            ))}
          </List>
        </Alert>
      )}
      
      <Title order={2} size="h3" mb="md">All Clients</Title>
      <TextInput 
        placeholder="Search by name or company..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.currentTarget.value)}
        mb="xl"
      />
      
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Company</Table.Th>
            <Table.Th>Tags</Table.Th>
            <Table.Th>Owner</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={4}>{clients.length > 0 ? "No clients match your search." : "No clients yet."}</Table.Td></Table.Tr>}</Table.Tbody>
      </Table>
    </Container>
  );
}