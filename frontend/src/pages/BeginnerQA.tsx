import {
  Alert,
  Anchor,
  Box,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { IoInformationCircleOutline } from 'react-icons/io5';
import CharacterTag from '../components/character/CharacterTag';
import ResourceBadge from '../components/common/ResourceBadge';
import {
  BRAND_TITLE_STYLE,
  getGuideSectionCardStyles,
} from '../constants/styles';

const FACTION_GIFTS: {
  faction: string;
  ssr: { name: string; pts: number };
  sr: { name: string; pts: number };
  r: { name: string; pts: number };
  n: { name: string; pts: number };
}[] = [
  {
    faction: 'Any',
    ssr: { name: 'Luxury Tea Set', pts: 150 },
    sr: { name: 'Grilled Steak', pts: 75 },
    r: { name: 'Banquet Cake', pts: 30 },
    n: { name: 'Apple', pts: 15 },
  },
  {
    faction: 'Elemental Echo',
    ssr: { name: 'Amber Necklace', pts: 100 },
    sr: { name: 'Obsidian Arrowhead', pts: 50 },
    r: { name: 'Coral Ornament', pts: 20 },
    n: { name: 'Dandelion', pts: 10 },
  },
  {
    faction: 'Illusion Veil',
    ssr: { name: 'Black Lotus', pts: 100 },
    sr: { name: 'Forbidden Scroll', pts: 50 },
    r: { name: 'Rotten Branch', pts: 20 },
    n: { name: 'Cave Mushroom', pts: 10 },
  },
  {
    faction: 'Arcane Wisdom',
    ssr: { name: 'Lilac and Gooseberry', pts: 100 },
    sr: { name: 'Potion Class Notes', pts: 50 },
    r: { name: 'Ink and Quill', pts: 20 },
    n: { name: 'Manna', pts: 10 },
  },
  {
    faction: 'Otherworld Return',
    ssr: { name: 'Soul Bell', pts: 100 },
    sr: { name: 'Graveyard Lily', pts: 50 },
    r: { name: 'Preservative', pts: 20 },
    n: { name: 'Ritual Candle', pts: 10 },
  },
  {
    faction: 'Sanctum Glory',
    ssr: { name: 'Stained Glass Window Decoration', pts: 100 },
    sr: { name: 'Griffin Doll', pts: 50 },
    r: { name: "A Knight's Tale", pts: 20 },
    n: { name: 'Wooden Training Sword', pts: 10 },
  },
  {
    faction: 'Wild Spirit',
    ssr: { name: 'Treant Sapling', pts: 100 },
    sr: { name: 'Ring Casting Mold', pts: 50 },
    r: { name: 'Fairy Dust', pts: 20 },
    n: { name: 'Elven Biscuit', pts: 10 },
  },
];

function QA({
  q,
  children,
  style,
}: {
  q: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Paper p="md" radius="md" withBorder style={style}>
      <Stack gap="xs">
        <Text fw={700}>Q: {q}</Text>
        <Text size="sm" c="dimmed" component="div">
          A: {children}
        </Text>
      </Stack>
    </Paper>
  );
}

export default function BeginnerQA() {
  const isDark = useComputedColorScheme('dark') === 'dark';

  const sectionCardStyle = getGuideSectionCardStyles(isDark);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Card
          withBorder
          radius="md"
          p="xl"
          style={{
            ...sectionCardStyle,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.2), transparent 55%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.2), transparent 50%)'
                : 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 55%), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.14), transparent 50%)',
              pointerEvents: 'none',
            }}
          />

          <Stack gap="md" style={{ position: 'relative', zIndex: 1 }}>
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size="xl" radius="md" variant="light" color="cyan">
                <IoInformationCircleOutline size={20} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={1} style={BRAND_TITLE_STYLE}>
                  Beginner Q&amp;A
                </Title>
                <Text size="sm" c="dimmed">
                  Fast answers for early progression, spending priorities, and
                  event planning.
                </Text>
              </Stack>
            </Group>

            <Alert
              variant="light"
              color="yellow"
              title="Translation note"
              icon={<IoInformationCircleOutline />}
            >
              This section is translated and adapted from a Chinese community
              guide on GameKee:{' '}
              <Anchor
                href="https://www.gamekee.com/lhlr/670682.html"
                target="_blank"
              >
                萌新Q&amp;A / Beginner Q&amp;A
              </Anchor>
              . Source terms may contain typos or naming differences.
            </Alert>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Summoning &amp; Characters</Title>

            <QA
              q="Which characters should I prioritize summoning?"
              style={sectionCardStyle}
            >
              Go for at least 8 copies of <CharacterTag name="Ifrit" /> (AoE
              attack, physical defense reduction) to reach Red 1★ for the
              powerful Level 4 passive. Then always summon for at least 1 copy
              of each limited character to unlock them in the Heart Trial.
            </QA>

            <QA
              q="How should I pull characters strategically?"
              style={sectionCardStyle}
            >
              Most characters need higher stars to become fully viable. For
              F2P/new players, save <ResourceBadge name="Diamond" /> and{' '}
              <ResourceBadge name="Fated Summoning Ticket" /> for strong
              universal cards or for your core team archetype (for example Angel
              in Sanctuary). Target Purple 6★ / Red 1★ to unlock Level 4
              passives.
            </QA>

            <QA q="How should I set my Wishlist?" style={sectionCardStyle}>
              Fill all 8 slots or it will not activate. For SSR+, take up to two{' '}
              <CharacterTag name="Titania" />, then switch to{' '}
              <CharacterTag name="Scheherazade" />;{' '}
              <CharacterTag name="Pan Junbao" />
              needs one copy. For SSR, prioritize{' '}
              <CharacterTag name="Atanith" />,
              <CharacterTag name="Caligula" />, and{' '}
              <CharacterTag name="Herman" />.
            </QA>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Economy &amp; Shopping</Title>

            <QA
              q="What is the best way to spend Diamonds?"
              style={sectionCardStyle}
            >
              Priority path: shop essentials &gt; sweeps (except Dragon Soul
              Stones) &gt; treasure hunt resources &gt; planned pulls &gt;
              patrols &gt; auctions (bidding). Avoid unplanned pulls or
              standard-pool pulls.
            </QA>

            <QA q="Which shops should I buy from?" style={sectionCardStyle}>
              • Mystery Shop: <ResourceBadge name="Exploration Guide" />{' '}
              (daily), <ResourceBadge name="Primal Amber" />
              (monthly).
              <br />• Arena Shop: discounted{' '}
              <ResourceBadge name="Mythic Summoning Ticket" /> &gt;{' '}
              <ResourceBadge name="Primal Amber" /> &gt; full-price{' '}
              <ResourceBadge name="Mythic Summoning Ticket" />.
              <br />• God Realm Shop: <ResourceBadge name="Fate Horn" />{' '}
              (weekly) &gt; <ResourceBadge name="Aurora Dust" /> (daily) &gt;{' '}
              <CharacterTag name="Medusa" /> (one copy first, then shards).
              <br />• Guild Shop: <ResourceBadge name="Dragonblood" /> (weekly)
              &gt; shards. Buy <ResourceBadge name="Leaf of the World Tree" />{' '}
              here if stuck on evolution.
            </QA>

            <QA
              q="How should I buy Treasure Hunt resources?"
              style={sectionCardStyle}
            >
              Prioritize daily purchases based on your Diamond reserve:
              <br />• 1–3 Purple Bottles (<ResourceBadge name="Soul Elixir" />)
              <br />• 1–5 Dragon Words (
              <ResourceBadge name="Legacy Dragon Crystal" />)
              <br />• 5–10 Horns (<ResourceBadge name="Fate Horn" />)
              <br />
              Save everything until the matching event starts.
            </QA>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Progression &amp; Mechanics</Title>

            <QA
              q="What is the level cap for Luminaries?"
              style={sectionCardStyle}
            >
              After level 100, the cap increases by 50 each stage (150, 200,
              250, 300), then continues to Peak level.
            </QA>

            <QA q="How do I evolve Dragons?" style={sectionCardStyle}>
              Dragon star-up uses Dragon Souls. If you lack the exact soul, you
              can substitute lower-tier souls or{' '}
              <ResourceBadge name="Dragonblood" />. Conversion: 3 Small = 1
              Medium, and 4 Medium = 1 Large.
            </QA>

            <QA
              q="What should I prioritize in Dispatch?"
              style={sectionCardStyle}
            >
              <ResourceBadge name="Luminary EXP" /> ≥{' '}
              <ResourceBadge name="Gold" /> &gt;{' '}
              <ResourceBadge name="Leaf of the World Tree" /> ≥{' '}
              <ResourceBadge name="Diamond" />.
            </QA>

            <QA
              q="What attributes are best for equipment?"
              style={sectionCardStyle}
            >
              • Frontline: Block ≥ HP &gt; Physical Defense &gt; Magic Defense.
              <br />• DPS: Independent Damage Boost &gt; CD Reduction ≥ Crit DMG
              &gt; Attack Speed &gt; Crit Rate.
              <br />• Healer: CD Reduction &gt; Healing Power &gt; HP.
            </QA>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Events &amp; Guilds</Title>

            <QA q="How do Golden Leaf events work?" style={sectionCardStyle}>
              Events rotate weekly (Howlkins → Wyrmspells → Artifacts).
              Typically aim to complete one full round (commonly 270 or 900
              pulls) to secure the core reward (12 Golden Leaves). If you cannot
              complete the round, skip and save.
            </QA>

            <QA
              q="What should I exchange Golden Leaves for?"
              style={sectionCardStyle}
            >
              Crit/ATK Howlkins ≥ Mythic Dragon Words &gt; HP Howlkins &gt;
              Mythic Artifacts. Avoid exchanging for Diamond-equivalent currency
              or generic shards.
            </QA>

            <QA q="What are the Guild priorities?" style={sectionCardStyle}>
              Always do Guild Wars (losses still give points). Always hit the
              Guild Dragon (primary{' '}
              <ResourceBadge name="Leaf of the World Tree" />
              source). In Exploration, prioritize Limited Resources &gt; Rune
              Crystals &gt; Dragon Soul Statues.
            </QA>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Affection Gifts</Title>
            <Text size="sm" c="dimmed">
              Each faction has one preferred gift per quality tier. Faction
              gifts give the listed affection points to Luminaries of that
              faction. Universal gifts (Any) work on all Luminaries but yield
              fewer points than a matched faction gift.
            </Text>
            <Table striped withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Faction</Table.Th>
                  <Table.Th>SSR</Table.Th>
                  <Table.Th>SR</Table.Th>
                  <Table.Th>R</Table.Th>
                  <Table.Th>N</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {FACTION_GIFTS.map(({ faction, ssr, sr, r, n }) => (
                  <Table.Tr key={faction}>
                    <Table.Td>
                      <Text size="sm" fw={faction === 'Any' ? 600 : undefined}>
                        {faction}
                      </Text>
                    </Table.Td>
                    {[ssr, sr, r, n].map((gift) => (
                      <Table.Td key={gift.name}>
                        <Group gap={4} wrap="nowrap">
                          <ResourceBadge name={gift.name} />
                          <Text
                            size="xs"
                            c="dimmed"
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            +{gift.pts}
                          </Text>
                        </Group>
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>

        <Card withBorder radius="md" p="lg" style={sectionCardStyle}>
          <Stack gap="sm">
            <Title order={2}>Combat Strategy</Title>

            <QA
              q="Why is Physical Defense usually prioritized over Magic Defense?"
              style={sectionCardStyle}
            >
              Most magic damage comes from Mages and Priests; Priests are
              commonly support-focused with lower output. Many meta Mages are
              currently utility-focused, with fewer high-damage exceptions (such
              as <CharacterTag name="Gabriele" /> or
              <CharacterTag name="Poseidon" />
              ), so physical pressure is often more common.
            </QA>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
