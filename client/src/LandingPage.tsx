import { Container, Title, Text, Button, Group, Stack, SimpleGrid, ThemeIcon, Modal } from '@mantine/core';
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
      title: 'Prioritized Reminders',
      description: 'Our smart engine tells you exactly who to contact next based on their priority and contact cadence.',
    },
    {
      icon: IconUsersGroup,
      title: 'Shared Client Context',
      description: 'Keep your team in sync with a central log of all interactions, notes, and tags for every client.',
    },
    {
      icon: IconListCheck,
      title: 'Actionable Meeting Prep',
      description: 'Jot down discussion points for any client on demand and access them right before your call.',
    },
  ];

  return (
    <>
      <Modal opened={authModalOpened} onClose={closeAuthModal} title="Welcome to Cueboard" centered>
        <Auth onLoginSuccess={onLoginSuccess} />
      </Modal>

      <Container size="lg">
        {/* Header */}
        <Group justify="space-between" py="md">
          <Title order={3}>Cueboard</Title>
          <Button variant="default" onClick={openAuthModal}>Login</Button>
        </Group>

        {/* Hero Section */}
        <Container size="md" py={80}>
          <Stack align="center" gap="md">
            <Title order={1} ta="center" style={{ fontSize: '3rem' }}>
              Stop Juggling. Start Connecting.
            </Title>
            <Text c="dimmed" ta="center" size="xl" maw={600}>
              Cueboard is the tiny, open-source tracker that helps small teams manage client relationships with clarity and focus.
            </Text>
            <Button size="lg" mt="md" onClick={openAuthModal}>
              Get Started for Free
            </Button>
          </Stack>
        </Container>

        {/* Features Section */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" py={80}>
          {features.map((feature) => (
            <Stack key={feature.title} align="center" ta="center">
              <ThemeIcon variant="light" size={60} radius="md">
                <feature.icon style={{ width: '2rem', height: '2rem' }} stroke={1.5} />
              </ThemeIcon>
              <Title order={4} mt="md">{feature.title}</Title>
              <Text c="dimmed">{feature.description}</Text>
            </Stack>
          ))}
        </SimpleGrid>

        {/* Footer */}
        <Group justify="center" py="xl" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Text size="sm" c="dimmed">© 2025 Cueboard. All rights reserved.</Text>
        </Group>
      </Container>
    </>
  );
}