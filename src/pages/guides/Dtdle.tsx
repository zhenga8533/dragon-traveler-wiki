import { Card, Container, Stack, Tabs } from '@mantine/core';
import { IoGameControllerOutline } from 'react-icons/io5';
import AbilityMode from '@/features/dtdle/components/AbilityMode';
import ClassicMode from '@/features/dtdle/components/ClassicMode';
import IllustrationMode from '@/features/dtdle/components/IllustrationMode';
import QuoteMode from '@/features/dtdle/components/QuoteMode';
import { useTabParam } from '@/hooks';
import GuideHeroCard from '@/features/guides/components/GuideHeroCard';

const VALID_MODES = ['classic', 'quote', 'ability', 'illustration'];

export default function Dtdle() {
  const [activeMode, setActiveMode] = useTabParam(
    'mode',
    'classic',
    VALID_MODES
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <GuideHeroCard
          icon={<IoGameControllerOutline size={24} />}
          title="DTdle"
          subtitle="Guess today's mystery character. One character a day, unlimited guesses."
        />

        <Tabs value={activeMode} onChange={setActiveMode}>
          <Tabs.List>
            <Tabs.Tab value="classic">Classic</Tabs.Tab>
            <Tabs.Tab value="quote">Quote</Tabs.Tab>
            <Tabs.Tab value="ability">Ability</Tabs.Tab>
            <Tabs.Tab value="illustration">Illustration</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="classic" pt="md">
            <Card withBorder radius="md" p="lg">
              <ClassicMode />
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="quote" pt="md">
            <Card withBorder radius="md" p="lg">
              <QuoteMode />
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="ability" pt="md">
            <Card withBorder radius="md" p="lg">
              <AbilityMode />
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="illustration" pt="md">
            <Card withBorder radius="md" p="lg">
              <IllustrationMode />
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
