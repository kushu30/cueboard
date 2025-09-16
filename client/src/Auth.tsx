import { Tabs, TextInput, PasswordInput, Button, Stack, Container, Title, Paper, Notification } from '@mantine/core';
import { useForm } from '@mantine/form';
import axios from 'axios';
import { useState } from 'react';



interface AuthProps {
  onLoginSuccess: () => void;
}

export function Auth({ onLoginSuccess }: AuthProps) {
  const [error, setError] = useState<string | null>(null);

  const registerForm = useForm({
    initialValues: { team_name: '', email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password should include at least 6 characters' : null),
    },
  });

  const loginForm = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleRegister = async (values: typeof registerForm.values) => {
    setError(null);
    try {
      await axios.post('http://localhost:3001/api/auth/register', values);
      // Automatically log in after successful registration
      await handleLogin({ email: values.email, password: values.password });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleLogin = async (values: typeof loginForm.values) => {
    setError(null);
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', values);
      localStorage.setItem('token', response.data.token);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Welcome to Cueboard</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {error && <Notification color="red" onClose={() => setError(null)}>{error}</Notification>}
        <Tabs defaultValue="login">
          <Tabs.List grow>
            <Tabs.Tab value="login">Log In</Tabs.Tab>
            <Tabs.Tab value="register">Register</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login" pt="xs">
            <form onSubmit={loginForm.onSubmit(handleLogin)}>
              <Stack>
                <TextInput required label="Email" placeholder="you@company.com" {...loginForm.getInputProps('email')} />
                <PasswordInput required label="Password" placeholder="Your password" {...loginForm.getInputProps('password')} />
                <Button type="submit">Login</Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="register" pt="xs">
            <form onSubmit={registerForm.onSubmit(handleRegister)}>
              <Stack>
                <TextInput required label="Team Name" placeholder="Your Team (e.g., Flexype)" {...registerForm.getInputProps('team_name')} />
                <TextInput required label="Email" placeholder="you@company.com" {...registerForm.getInputProps('email')} />
                <PasswordInput required label="Password" placeholder="Your password" {...registerForm.getInputProps('password')} />
                <Button type="submit">Register</Button>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}