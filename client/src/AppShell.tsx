import { AppShell, Burger, Group, Text, Button, ActionIcon, useMantineColorScheme, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSun, IconMoon } from '@tabler/icons-react';

interface MainAppShellProps {
  children: React.ReactNode;
  handleLogout: () => void;
}

export function MainAppShell({ children, handleLogout }: MainAppShellProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="lg">Cueboard</Text>
          <Group>
            <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
              <ActionIcon
                onClick={toggleColorScheme}
                variant="default"
                size="lg"
                aria-label="Toggle color scheme"
              >
                {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
              </ActionIcon>
            </Tooltip>
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}