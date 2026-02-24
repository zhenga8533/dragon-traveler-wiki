import { Anchor, Blockquote, Box, Image, Modal, Stack, Text } from '@mantine/core';
import { useCallback } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useKonami } from '../hooks/use-konami';

export default function KonamiEasterEgg() {
  const [opened, { open, close }] = useDisclosure(false);

  const handleKonami = useCallback(() => {
    open();
  }, [open]);

  useKonami(handleKonami);

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={
        <Text fw={700} size="lg">
          You found a secret!
        </Text>
      }
      centered
      size="lg"
    >
      <Stack gap="md">
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/secret.png"
            alt="Secret"
            maw={420}
            fit="contain"
            radius="md"
          />
        </Box>

        <Stack gap="xs">
          <Text size="sm" c="dimmed" ta="center" fs="italic">
            Did you know?
          </Text>
          <Text size="sm" ta="center">
            This wiki was inspired by{' '}
            <Anchor
              href="https://dragon-traveler-guide.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              dragon-traveler-guide.vercel.app
            </Anchor>
            . When that site went end of service, development on this wiki began
            so the community wouldn't lose a valuable resource.
          </Text>
        </Stack>

        <Blockquote
          cite="— Greek mythology"
          mt="xs"
          p="md"
          style={{ fontSize: 'var(--mantine-font-size-sm)' }}
        >
          <Text fw={600} size="sm" mb={4}>
            Athena and Poseidon Had a Major Rivalry
          </Text>
          Athens is named after the goddess Athena, but it could have been
          called Poseidonia. According to myth, Athena and Poseidon competed to
          be the patron deity of the city. Poseidon offered a saltwater spring,
          while Athena gifted the olive tree, which was more valuable to the
          people. The citizens chose Athena, and the city was named in her
          honor.
        </Blockquote>
      </Stack>
    </Modal>
  );
}
