import { useEffect, useState } from 'react';
import { Modal, TextInput, Stack, Button, NumberInput, Select, Loader, Center, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import api from './api';
import { ClientDetail } from './ClientDetail';
import { LandingPage } from './LandingPage';
import { Dashboard } from './Dashboard';
import { MainAppShell } from './AppShell';
import type { Client, ClientPriority } from './types';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const form = useForm({
    initialValues: { 
      name: '', company: '', contact_email: '', owner: '',
      website_url: '', contact_cadence_days: 7, priority: 'medium' as ClientPriority,
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name is required' : null),
      contact_email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      setError(null);
      api.get('/clients')
        .then(response => setClients(response.data))
        .catch((error: any) => {
          if (error.response?.status === 401) handleLogout();
          else setError('Failed to load client data. The server might be down.');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const handleLoginSuccess = () => setToken(localStorage.getItem('token'));
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); setClients([]); };
  
  const handleAddClient = async (values: any) => {
    try {
      const response = await api.post('/clients', values);
      setClients([response.data, ...clients]);
      close();
      form.reset();
    } catch (err) { console.error('Failed to add client:', err); }
  };

const handleUpdateClientInList = (updatedClient: Client) => {
  setClients(prev => prev.map(c => String(c.id ?? (c as any)?._id ?? '') === String(updatedClient.id ?? (updatedClient as any)?._id ?? '') ? updatedClient : c));
};


const handleDeleteClient = (clientId: string | number) => {
  setClients(prev => prev.filter(c => String(c.id ?? (c as any)?._id ?? '') !== String(clientId)));
  setSelectedClient(null);
};

  
  if (!token) { 
    return <LandingPage onLoginSuccess={handleLoginSuccess} />; 
  }
  
  if (isLoading) {
    return <Center style={{ height: '100vh' }}><Loader /></Center>;
  }
  if (error) {
    return <Center style={{ height: '100vh' }}><Alert color="red" title="Error">{error}</Alert></Center>;
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Add New Client">
        <form onSubmit={form.onSubmit(handleAddClient)}>
          <Stack>
            <TextInput withAsterisk label="Name" {...form.getInputProps('name')} />
            <TextInput label="Company" {...form.getInputProps('company')} />
            <TextInput withAsterisk label="Contact Email" {...form.getInputProps('contact_email')} />
            <TextInput label="Owner" {...form.getInputProps('owner')} />
            <TextInput label="Website URL" placeholder="https://example.com" {...form.getInputProps('website_url')} />
            <NumberInput label="Contact Cadence (Days)" placeholder="7" min={1} {...form.getInputProps('contact_cadence_days')} />
            <Select
              label="Priority"
              data={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]}
              {...form.getInputProps('priority')}
            />
            <Button type="submit" mt="md">Create Client</Button>
          </Stack>
        </form>
      </Modal>

      <MainAppShell handleLogout={handleLogout}>
        {selectedClient ? (
          <ClientDetail 
            client={selectedClient} 
            onBack={() => setSelectedClient(null)}
            onClientUpdate={(updatedClient) => {
              handleUpdateClientInList(updatedClient);
              setSelectedClient(updatedClient);
            }}
            onClientDelete={handleDeleteClient}
          />
        ) : (
          <Dashboard 
            clients={clients}
            onClientSelect={setSelectedClient}
            openAddClientModal={open}
            onUpdateClientInList={handleUpdateClientInList}
          />
        )}
      </MainAppShell>
    </>
  );
}

export default App;