import { Container, Title, Text, Button, Group, Stack, SimpleGrid, ThemeIcon, Modal, Paper, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconTargetArrow, IconUsersGroup, IconListCheck } from '@tabler/icons-react';
import { Auth } from './Auth';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

export function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [authModalOpened, { open: openAuthModal, close: closeAuthModal }] = useDisclosure(false);

  const features = [
    {
      icon: IconTargetArrow,
      title: 'Know Who to Contact Next',
      description: 'Cueboard automatically surfaces clients due for a follow-up based on your custom contact cadence. The Priority Queue sorts them by importance, so you always focus on the right client at the right time.',
    },
    {
      icon: IconUsersGroup,
      title: 'A Single Source of Truth',
      description: 'Log every call, email, and meeting. With a shared interaction timeline and prep notes, your entire team has the context they need, instantly.',
    },
    {
      icon: IconListCheck,
      title: 'Walk Into Every Meeting Prepared',
      description: 'Use the Meeting Prep tool to jot down discussion points for any client. Access your notes right before a call to ensure you never miss a detail.',
    },
  ];

  return (
    <>
      <Modal opened={authModalOpened} onClose={closeAuthModal} title="Welcome to Cueboard" centered>
        <Auth onLoginSuccess={onLoginSuccess} />
      </Modal>

      <Box>
        <header>
          <Container size="lg">
            <Group justify="space-between" py="md">
              <Title order={3}>Cueboard</Title>
              <Group>
                <Button variant="default" onClick={openAuthModal}>Login</Button>
                <Button onClick={openAuthModal}>Get Started</Button>
              </Group>
            </Group>
          </Container>
        </header>

        <main>
          <Container size="md" py={90}>
            <Stack align="center" gap="md">
              <Title
                order={1}
                ta="center"
                variant="gradient"
                style={{ fontSize: '3.5rem' }}
              >
                Bring Clarity to Client Success
              </Title>
              <Text c="dimmed" ta="center" size="xl" maw={600}>
                Cueboard is the focused, open-source tracker that helps small teams build great client relationships without the clutter of a traditional CRM.
              </Text>
              <Button size="lg" mt="md" onClick={openAuthModal}>
                Get Started for Free
              </Button>
            </Stack>
          </Container>

          <Box bg="var(--mantine-color-body-light)">
            <Container size="lg" py={80}>
                <Title order={2} ta="center" mb="xl">Everything you need. Nothing you don't.</Title>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={{ base: 'xl', sm: '3xl' }}>
                {features.map((feature) => (
                    <Paper key={feature.title} p="lg" radius="md">
                        <Stack align="flex-start" gap="md">
                            <ThemeIcon variant="light" size={50} radius="md">
                                <feature.icon style={{ width: '1.8rem', height: '1.8rem' }} stroke={1.5} />
                            </ThemeIcon>
                            <Title order={4}>{feature.title}</Title>
                            <Text c="dimmed">{feature.description}</Text>
                        </Stack>
                    </Paper>
                ))}
                </SimpleGrid>
            </Container>
          </Box>
          
          <Container size="md" py={90}>
            <Stack align="center" gap="md">
                <Title order={2} ta="center">Ready to focus your outreach?</Title>
                <Button size="lg" mt="md" onClick={openAuthModal}>
                    Create Your Free Account
                </Button>
            </Stack>
          </Container>
        </main>

        <footer>
            <Container size="lg">
                <Group justify="center" py="xl" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text size="sm" c="dimmed">© 2025 Cueboard. All rights reserved.</Text>
                </Group>
            </Container>
        </footer>
      </Box>
    </>
  );
}