import { useEffect, useState } from 'react';
import { Title, Paper, Group, Text, Button, Badge, Stack } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import api from './api';
import type { Client, ClientPriority } from './types';

interface Reminder {
  id: number; rule: string; client_name: string; client_id: number; priority: ClientPriority;
}
interface PriorityQueueProps {
  clients: Client[];
  onClientSelect: (client: Client) => void;
}

const PriorityBadge = ({ priority }: { priority: ClientPriority }) => {
    const color = { high: 'red', medium: 'orange', low: 'gray' }[priority];
    return <Badge color={color} variant="filled">{priority} Priority</Badge>;
};

export function PriorityQueue({ clients, onClientSelect }: PriorityQueueProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const fetchReminders = () => {
    api.get('/api/reminders')
      .then(response => setReminders(response.data))
      .catch(error => console.error("Failed to fetch reminders:", error));
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDismissReminder = async (reminderId: number) => {
    try {
      await api.put(`/api/reminders/${reminderId}`, { status: 'dismissed' });
      fetchReminders();
    } catch (error) { console.error("Failed to dismiss reminder:", error); }
  };
  
  if (reminders.length === 0) {
    return null;
  }

  return (
    <Stack mb="xl">
      <Title order={2} size="h3">Priority Queue ({reminders.length})</Title>
      {reminders.map(reminder => (
        <Paper withBorder p="md" radius="md" key={reminder.id}>
            <Group justify="space-between">
                <div>
                    <Text 
                        fw={500} 
                        onClick={() => {
                            const client = clients.find(c => c.id === reminder.client_id);
                            if (client) onClientSelect(client);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {reminder.client_name}
                    </Text>
                    <Text size="sm" c="dimmed">{reminder.rule}</Text>
                </div>
                <Group>
                    <PriorityBadge priority={reminder.priority} />
                    <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconCircleCheck size={14} />}
                        onClick={() => handleDismissReminder(reminder.id)}
                    >
                        Dismiss
                    </Button>
                </Group>
            </Group>
        </Paper>
      ))}
    </Stack>
  );
}