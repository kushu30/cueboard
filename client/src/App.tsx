import { useEffect, useState } from 'react';
import { Modal, TextInput, Stack, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import api from './api';
import { ClientDetail } from './ClientDetail';
import { Auth } from './Auth';
import { Dashboard } from './Dashboard';

interface Client {
  id: number; name: string; company: string; contact_email: string; owner: string;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [clients, setClients] = useState<Client[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const form = useForm({
    initialValues: { name: '', company: '', contact_email: '', owner: '' },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name is required' : null),
      contact_email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  useEffect(() => {
    if (token) {
      api.get('/clients')
        .then(response => setClients(response.data))
        .catch((error: any) => { if (error.response?.status === 401) handleLogout(); });
    }
  }, [token]);

  const handleLoginSuccess = () => setToken(localStorage.getItem('token'));
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); setClients([]); };
  
  const handleAddClient = async (values: typeof form.values) => {
    try {
      const response = await api.post('/clients', values);
      setClients([response.data, ...clients]);
      close();
      form.reset();
    } catch (err) { console.error('Failed to add client:', err); }
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
  };

  const handleDeleteClient = (clientId: number) => {
    setClients(clients.filter(c => c.id !== clientId));
    setSelectedClient(null);
  };

  if (!token) { return <Auth onLoginSuccess={handleLoginSuccess} />; }
  if (selectedClient) { 
    return <ClientDetail 
              client={selectedClient} 
              onBack={() => setSelectedClient(null)}
              onClientUpdate={handleUpdateClient}
              onClientDelete={handleDeleteClient}
            />;
  }

  return (
    <>
      <Modal opened={opened} onClose={close} title="Add New Client">
        <form onSubmit={form.onSubmit(handleAddClient)}>
          <Stack>
            <TextInput withAsterisk label="Name" placeholder="Client Name" {...form.getInputProps('name')} />
            <TextInput label="Company" placeholder="Client's Company" {...form.getInputProps('company')} />
            <TextInput withAsterisk label="Contact Email" placeholder="contact@company.com" {...form.getInputProps('contact_email')} />
            <TextInput label="Owner" placeholder="Your Name" {...form.getInputProps('owner')} />
            <Button type="submit" mt="md">Create Client</Button>
          </Stack>
        </form>
      </Modal>

      <Dashboard 
        clients={clients}
        onClientSelect={setSelectedClient}
        openAddClientModal={open}
        handleLogout={handleLogout}
      />
    </>
  );
}

export default App;