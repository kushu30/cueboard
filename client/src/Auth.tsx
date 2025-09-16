import { Tabs, TextInput, PasswordInput, Button, Stack, Paper, Notification, Group, Alert, CopyButton, Tooltip, ActionIcon, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import api from './api';
import { useState } from 'react';
import { IconCopy, IconCheck } from '@tabler/icons-react';

interface AuthProps {
  onLoginSuccess: () => void;
}

export function Auth({ onLoginSuccess }: AuthProps) {
  const [error, setError] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState<{ name: string, invite_code: string } | null>(null);

  const companyForm = useForm({
    initialValues: { team_name: '' },
    validate: { team_name: (val) => (val.trim().length < 2 ? 'Company name is required' : null) },
  });

  const registerForm = useForm({
    initialValues: { email: '', password: '', invite_code: '' },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) => (val.length < 6 ? 'Password must be at least 6 characters' : null),
      invite_code: (val) => (val.trim().length === 0 ? 'Invite code is required' : null),
    },
  });

  const loginForm = useForm({
    initialValues: { email: '', password: '' },
    validate: { email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email') },
  });

  const handleCreateCompany = async (values: typeof companyForm.values) => {
    setError(null);
    try {
      const response = await api.post('/api/auth/company', values);
      setNewTeam(response.data);
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to create company.'); }
  };
  
  const handleRegister = async (values: typeof registerForm.values) => {
    setError(null);
    try {
      await api.post('/api/auth/register', values);
      await handleLogin({ email: values.email, password: values.password });
    } catch (err: any) { setError(err.response?.data?.error || 'Registration failed.'); }
  };

  const handleLogin = async (values: typeof loginForm.values) => {
    setError(null);
    try {
      const response = await api.post('/api/auth/login', values);
      localStorage.setItem('token', response.data.token);
      onLoginSuccess();
    } catch (err: any) { setError(err.response?.data?.error || 'Login failed.'); }
  };

  if (newTeam) {
    return (
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title order={3} ta="center">Company Created!</Title>
        <Text ta="center" mt="md" c="dimmed">Share this invite code with your teammates so they can join.</Text>
        <Alert variant="light" color="blue" title="Your Invite Code" mt="lg">
          <Group justify="space-between">
            <Text ff="monospace" fz="lg">{newTeam.invite_code}</Text>
            <CopyButton value={newTeam.invite_code} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                  <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                    {copied ? <IconCheck /> : <IconCopy />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Alert>
        <Button fullWidth mt="xl" onClick={() => setNewTeam(null)}>Back to Login</Button>
      </Paper>
    );
  }

  return (
    <Paper withBorder shadow="md" p={30} mt={30} radius="md">
      {error && <Notification color="red" onClose={() => setError(null)} mb="md">{error}</Notification>}
      <Tabs defaultValue="login">
        <Tabs.List grow>
          <Tabs.Tab value="login">Log In</Tabs.Tab>
          <Tabs.Tab value="join">Join Company</Tabs.Tab>
          <Tabs.Tab value="create">Create Company</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="login" pt="xs">
          <form onSubmit={loginForm.onSubmit(handleLogin)}>
            <Stack>
                <TextInput required label="Email" placeholder="you@company.com" {...loginForm.getInputProps('email')} />
                <PasswordInput required label="Password" placeholder="Your password" {...loginForm.getInputProps('password')} />
                <Button type="submit" mt="md">Login</Button>
            </Stack>
          </form>
        </Tabs.Panel>
        <Tabs.Panel value="join" pt="xs">
          <form onSubmit={registerForm.onSubmit(handleRegister)}>
            <Stack>
                <TextInput required label="Company Invite Code" placeholder="Enter the code" {...registerForm.getInputProps('invite_code')} />
                <TextInput required label="Your Email" placeholder="you@company.com" {...registerForm.getInputProps('email')} />
                <PasswordInput required label="Password" placeholder="Create a password" {...registerForm.getInputProps('password')} />
                <Button type="submit" mt="md">Join and Login</Button>
            </Stack>
          </form>
        </Tabs.Panel>
        <Tabs.Panel value="create" pt="xs">
          <form onSubmit={companyForm.onSubmit(handleCreateCompany)}>
            <Stack>
                <TextInput required label="Company Name" placeholder="Your Company Inc." {...companyForm.getInputProps('team_name')} />
                <Button type="submit" mt="md">Create Company</Button>
            </Stack>
          </form>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
}