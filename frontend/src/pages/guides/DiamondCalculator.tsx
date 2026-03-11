import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput, type DateValue } from '@mantine/dates';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  IoAdd,
  IoCalendar,
  IoDiamond,
  IoInformationCircleOutline,
  IoTrashOutline,
  IoTrendingDown,
  IoTrendingUp,
  IoWallet,
} from 'react-icons/io5';
import StatCard from '@/components/ui/StatCard';
import GuideHeroCard from '@/components/guides/GuideHeroCard';
import {
  getCardHoverProps,
  getGuideSectionCardStyles,
} from '@/constants/styles';
import { useDarkMode, useGradientAccent } from '@/hooks';

type SourceType = 'gain' | 'spend';

type BaseSource = {
  id: string;
  label: string;
  defaultAmount: number;
  defaultCadenceDays: number;
};

type Option = {
  value: string;
  label: string;
};

type SourceRow = {
  id: string;
  label: string;
  amount: number | null;
  cadenceDays: number | null;
  isCustom: boolean;
  enabled: boolean;
};

type CalculatorState = {
  bank: number | null;
  targetDate: string;
  gainSources: SourceRow[];
  spendSources: SourceRow[];
  pointsLeagueRank: string;
  arenaDaily: string;
  colosseumBiweekly: string;
  wildHuntBiweekly: string;
  includeSupremeCard: boolean;
};

const LOCAL_STORAGE_KEY = 'diamond-calculator:v1';

const BASE_GAIN_SOURCES: BaseSource[] = [
  {
    id: 'storyChapterClear',
    label: 'Story chapter clear',
    defaultAmount: 7350,
    defaultCadenceDays: 4,
  },
  {
    id: 'wildHuntDailyQuest',
    label: 'Wild Hunt daily quest',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'maintenance',
    label: 'Maintenance rewards',
    defaultAmount: 300,
    defaultCadenceDays: 14,
  },
  {
    id: 'share',
    label: 'Share reward',
    defaultAmount: 100,
    defaultCadenceDays: 7,
  },
  {
    id: 'guildAuctionDividend',
    label: 'Guild auction house dividend',
    defaultAmount: 2000,
    defaultCadenceDays: 7,
  },
  {
    id: 'signInWeekly',
    label: 'Sign-in gift (weekly part)',
    defaultAmount: 100,
    defaultCadenceDays: 7,
  },
  {
    id: 'signInMonthly',
    label: 'Sign-in gift (monthly part)',
    defaultAmount: 500,
    defaultCadenceDays: 30,
  },
  {
    id: 'goldenLeafHuntRound',
    label: 'Golden Leaf Hunt round',
    defaultAmount: 1450,
    defaultCadenceDays: 7,
  },
  {
    id: 'guildGarrison',
    label: 'Guild garrison',
    defaultAmount: 2880,
    defaultCadenceDays: 7,
  },
  {
    id: 'trialByFire',
    label: 'Trial by Fire',
    defaultAmount: 4500,
    defaultCadenceDays: 14,
  },
  {
    id: 'realmClash',
    label: 'Realm Clash',
    defaultAmount: 1500,
    defaultCadenceDays: 7,
  },
  {
    id: 'dailyGift',
    label: 'Daily Gift',
    defaultAmount: 30,
    defaultCadenceDays: 1,
  },
  {
    id: 'guildExpedition',
    label: 'Guild Expedition',
    defaultAmount: 1000,
    defaultCadenceDays: 7,
  },
];

const BASE_SPEND_SOURCES: BaseSource[] = [
  {
    id: 'quickPatrol',
    label: 'Quick patrol',
    defaultAmount: 180,
    defaultCadenceDays: 1,
  },
  {
    id: 'goldenHorns',
    label: 'Golden horns',
    defaultAmount: 0,
    defaultCadenceDays: 1,
  },
  {
    id: 'legacyDragonCrystal',
    label: 'Legacy dragon crystal',
    defaultAmount: 800,
    defaultCadenceDays: 1,
  },
  {
    id: 'soulElixir',
    label: 'Soul elixir',
    defaultAmount: 1200,
    defaultCadenceDays: 1,
  },
  {
    id: 'dispatchRerolls',
    label: 'Dispatch rerolls',
    defaultAmount: 100,
    defaultCadenceDays: 1,
  },
  {
    id: 'forestDefense',
    label: 'Forest defense',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'treasureHeist',
    label: 'Treasure heist',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'wildRally',
    label: 'Wild rally',
    defaultAmount: 50,
    defaultCadenceDays: 1,
  },
  {
    id: 'slimeShowdown',
    label: 'Slime showdown',
    defaultAmount: 150,
    defaultCadenceDays: 1,
  },
  {
    id: 'guildExpeditionActionPoints',
    label: 'Guild expedition action points',
    defaultAmount: 100,
    defaultCadenceDays: 1,
  },
  {
    id: 'explorerGuide',
    label: 'Explorer guide',
    defaultAmount: 200,
    defaultCadenceDays: 1,
  },
  {
    id: 'championExpedition',
    label: 'Champion expedition',
    defaultAmount: 400,
    defaultCadenceDays: 1,
  },
  {
    id: 'cloudClashChallenges',
    label: 'Cloud Clash challenge attempts',
    defaultAmount: 450,
    defaultCadenceDays: 7,
  },
  {
    id: 'cloudClashEnercore',
    label: 'Cloud Clash Enercore',
    defaultAmount: 300,
    defaultCadenceDays: 7,
  },
  {
    id: 'luminarySummoning',
    label: 'Luminary Summoning',
    defaultAmount: 0,
    defaultCadenceDays: 14,
  },
  {
    id: 'primalAmber',
    label: 'Primal Amber',
    defaultAmount: 1000,
    defaultCadenceDays: 30,
  },
];

const POINTS_LEAGUE_OPTIONS: Option[] = [
  { value: 'legend', label: 'Legend rank (300/day)' },
  { value: 'king', label: 'King rank (240/day)' },
  { value: 'champion', label: 'Champion rank (200/day)' },
  { value: 'grandmaster', label: 'Grandmaster rank (160/day)' },
  { value: 'master', label: 'Master rank (120/day)' },
  { value: 'expert', label: 'Expert rank (100/day)' },
  { value: 'elite', label: 'Elite rank (80/day)' },
  { value: 'apprentice', label: 'Apprentice rank (60/day)' },
  { value: 'novice', label: 'Novice rank (40/day)' },
];

const POINTS_LEAGUE_DAILY_BY_RANK: Record<string, number> = {
  legend: 300,
  king: 240,
  champion: 200,
  grandmaster: 160,
  master: 120,
  expert: 100,
  elite: 80,
  apprentice: 60,
  novice: 40,
};

const ARENA_OPTIONS: Option[] = [
  { value: '1000', label: 'Rank 1 (1000/day)' },
  { value: '800', label: 'Rank 2 (800/day)' },
  { value: '750', label: 'Rank 3 (750/day)' },
  { value: '700', label: 'Rank 4-5 (700/day)' },
  { value: '650', label: 'Rank 6-9 (650/day)' },
  { value: '600', label: 'Rank 10 (600/day)' },
  { value: '550', label: 'Rank 11-20 (550/day)' },
  { value: '500', label: 'Rank 21-50 (500/day)' },
  { value: '450', label: 'Rank 51-100 (450/day)' },
  { value: '400', label: 'Rank 101-200 (400/day)' },
  { value: '350', label: 'Rank 201-300 (350/day)' },
  { value: '300', label: 'Rank 301-400 (300/day)' },
  { value: '280', label: 'Rank 401-600 (280/day)' },
  { value: '260', label: 'Rank 601-800 (260/day)' },
  { value: '240', label: 'Rank 801-1000 (240/day)' },
  { value: '220', label: 'Rank 1001-1500 (220/day)' },
  { value: '200', label: 'Rank 1501-2000 (200/day)' },
  { value: '180', label: 'Rank 2001-2500 (180/day)' },
  { value: '160', label: 'Rank 2501-3000 (160/day)' },
  { value: '140', label: 'Rank 3001-4000 (140/day)' },
  { value: '130', label: 'Rank 4001-5000 (130/day)' },
  { value: '120', label: 'Rank 5001-6000 (120/day)' },
  { value: '110', label: 'Rank 6001-8000 (110/day)' },
  { value: '100', label: 'Rank 8001-10000 (100/day)' },
];

const COLOSSEUM_OPTIONS: Option[] = [
  { value: '3000', label: 'Rank 1 (3000 / 2 weeks)' },
  { value: '2700', label: 'Rank 2-3 (2700 / 2 weeks)' },
  { value: '2400', label: 'Rank 4-10 (2400 / 2 weeks)' },
  { value: '2100', label: 'Rank 11-20 (2100 / 2 weeks)' },
  { value: '1800', label: 'Rank 21-50 (1800 / 2 weeks)' },
  { value: '1680', label: 'Rank 51-100 (1680 / 2 weeks)' },
  { value: '1560', label: 'Rank 101-200 (1560 / 2 weeks)' },
  { value: '1440', label: 'Rank 201-500 (1440 / 2 weeks)' },
  { value: '1320', label: 'Rank 501-1000 (1320 / 2 weeks)' },
  { value: '1200', label: 'Rank 1000+ (1200 / 2 weeks)' },
];

const WILD_HUNT_OPTIONS: Option[] = [
  { value: '8888', label: 'Rank 1 (8888 / 2 weeks)' },
  { value: '5888', label: 'Rank 2 (5888 / 2 weeks)' },
  { value: '3888', label: 'Rank 3 (3888 / 2 weeks)' },
  { value: '2888', label: 'Rank 4-10 (2888 / 2 weeks)' },
  { value: '2288', label: 'Rank 11-20 (2288 / 2 weeks)' },
  { value: '1688', label: 'Rank 21-50 (1688 / 2 weeks)' },
  { value: '1488', label: 'Rank 51-100 (1488 / 2 weeks)' },
  { value: '1288', label: 'Top 5% (1288 / 2 weeks)' },
  { value: '1088', label: 'Top 10% (1088 / 2 weeks)' },
  { value: '888', label: 'Top 20% (888 / 2 weeks)' },
];

const SUPREME_MONTHLY_CARD = 10200;

function parseNumberInput(value: string | number): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDefaultRows(baseSources: BaseSource[]): SourceRow[] {
  return baseSources.map((source) => ({
    id: source.id,
    label: source.label,
    amount: source.defaultAmount,
    cadenceDays: source.defaultCadenceDays,
    isCustom: false,
    enabled: true,
  }));
}

function sumSourcesPerDay(sources: SourceRow[]): number {
  return sources.reduce((sum, source) => {
    if (!source.enabled) {
      return sum;
    }

    const amount = source.amount ?? 0;
    const cadenceDays = source.cadenceDays ?? 0;
    if (amount <= 0 || cadenceDays <= 0) {
      return sum;
    }

    return sum + amount / cadenceDays;
  }, 0);
}

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatSigned(value: number): string {
  const abs = formatNumber(Math.abs(value));
  if (value > 0) return `+${abs}`;
  if (value < 0) return `-${abs}`;
  return abs;
}

function dateToInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayIsoDate(): string {
  return dateToInputValue(new Date());
}

function isValidIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return dateToInputValue(parsed) === value;
}

function normalizeIsoDate(value: string, fallback: string): string {
  return isValidIsoDateString(value) ? value : fallback;
}

function isoDateToDate(value: string): Date | null {
  if (!isValidIsoDateString(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00`);
}

function dayDiffFromToday(targetIsoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${targetIsoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return 0;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function createCustomSource(type: SourceType): SourceRow {
  const suffix = Math.random().toString(36).slice(2, 8);
  const prefix = type === 'gain' ? 'gain' : 'spend';
  return {
    id: `custom-${prefix}-${Date.now()}-${suffix}`,
    label: `Custom ${type === 'gain' ? 'gain' : 'spend'}`,
    amount: null,
    cadenceDays: 7,
    isCustom: true,
    enabled: true,
  };
}

function sanitizeSourceRow(input: unknown): SourceRow | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const source = input as Partial<SourceRow>;
  if (typeof source.id !== 'string' || typeof source.label !== 'string') {
    return null;
  }

  const amount =
    typeof source.amount === 'number' && Number.isFinite(source.amount)
      ? source.amount
      : null;
  const cadenceDays =
    typeof source.cadenceDays === 'number' &&
    Number.isFinite(source.cadenceDays)
      ? source.cadenceDays
      : null;

  return {
    id: source.id,
    label: source.label,
    amount,
    cadenceDays,
    isCustom: Boolean(source.isCustom),
    enabled: source.enabled !== false,
  };
}

function sanitizeSourceRows(
  input: unknown,
  fallback: SourceRow[]
): SourceRow[] {
  if (!Array.isArray(input)) {
    return fallback;
  }

  const sanitized = input
    .map((row) => sanitizeSourceRow(row))
    .filter((row): row is SourceRow => row !== null);

  if (input.length === 0) {
    return [];
  }

  return sanitized.length > 0 ? sanitized : fallback;
}

function sortSourcesByCadenceThenLabel(sources: SourceRow[]): SourceRow[] {
  return [...sources].sort((a, b) => {
    const cadenceA = a.cadenceDays ?? Number.POSITIVE_INFINITY;
    const cadenceB = b.cadenceDays ?? Number.POSITIVE_INFINITY;

    if (cadenceA !== cadenceB) {
      return cadenceA - cadenceB;
    }

    return a.label.localeCompare(b.label, undefined, {
      sensitivity: 'base',
    });
  });
}

function readStoredCalculatorState(): Partial<CalculatorState> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<CalculatorState>;
  } catch {
    return null;
  }
}

export default function DiamondCalculator() {
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const minDate = useMemo(() => getStartOfToday(), []);
  const storedState = useMemo(() => readStoredCalculatorState(), []);

  const [bank, setBank] = useState<number | null>(() =>
    typeof storedState?.bank === 'number' && Number.isFinite(storedState.bank)
      ? storedState.bank
      : 0
  );
  const [targetDate, setTargetDate] = useState<string>(() => getTodayIsoDate());
  const [gainSources, setGainSources] = useState<SourceRow[]>(
    sanitizeSourceRows(
      storedState?.gainSources,
      buildDefaultRows(BASE_GAIN_SOURCES)
    )
  );
  const [spendSources, setSpendSources] = useState<SourceRow[]>(
    sanitizeSourceRows(
      storedState?.spendSources,
      buildDefaultRows(BASE_SPEND_SOURCES)
    )
  );

  const [pointsLeagueDaily, setPointsLeagueDaily] = useState<string>(
    typeof storedState?.pointsLeagueRank === 'string'
      ? storedState.pointsLeagueRank
      : POINTS_LEAGUE_OPTIONS[0].value
  );
  const [arenaDaily, setArenaDaily] = useState<string>(
    typeof storedState?.arenaDaily === 'string'
      ? storedState.arenaDaily
      : ARENA_OPTIONS[7].value
  );
  const [colosseumBiweekly, setColosseumBiweekly] = useState<string>(
    typeof storedState?.colosseumBiweekly === 'string'
      ? storedState.colosseumBiweekly
      : COLOSSEUM_OPTIONS[4].value
  );
  const [wildHuntBiweekly, setWildHuntBiweekly] = useState<string>(
    typeof storedState?.wildHuntBiweekly === 'string'
      ? storedState.wildHuntBiweekly
      : WILD_HUNT_OPTIONS[7].value
  );
  const [includeSupremeCard, setIncludeSupremeCard] = useState<boolean>(
    Boolean(storedState?.includeSupremeCard)
  );

  useEffect(() => {
    const state: CalculatorState = {
      bank,
      targetDate,
      gainSources,
      spendSources,
      pointsLeagueRank: pointsLeagueDaily,
      arenaDaily,
      colosseumBiweekly,
      wildHuntBiweekly,
      includeSupremeCard,
    };

    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore local storage write failures.
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    arenaDaily,
    bank,
    colosseumBiweekly,
    gainSources,
    includeSupremeCard,
    pointsLeagueDaily,
    spendSources,
    targetDate,
    wildHuntBiweekly,
  ]);

  const selectedPointsLeagueDaily =
    POINTS_LEAGUE_DAILY_BY_RANK[pointsLeagueDaily] ?? 0;

  const selectedArenaDaily = Number(arenaDaily) || 0;
  const selectedColosseumDaily = (Number(colosseumBiweekly) || 0) / 14;
  const selectedWildHuntDaily = (Number(wildHuntBiweekly) || 0) / 14;
  const supremeCardDaily = includeSupremeCard ? SUPREME_MONTHLY_CARD / 30 : 0;

  const baseGainPerDay = useMemo(
    () => sumSourcesPerDay(gainSources),
    [gainSources]
  );
  const baseSpendPerDay = useMemo(
    () => sumSourcesPerDay(spendSources),
    [spendSources]
  );

  const totalGainPerDay =
    baseGainPerDay +
    selectedPointsLeagueDaily +
    selectedArenaDaily +
    selectedColosseumDaily +
    selectedWildHuntDaily +
    supremeCardDaily;

  const totalSpendPerDay = baseSpendPerDay;
  const netPerDay = totalGainPerDay - totalSpendPerDay;

  const netPerWeek = netPerDay * 7;
  const netPerMonth = netPerDay * 30;

  const safeBank = bank ?? 0;

  const daysUntilZero =
    netPerDay < 0 && safeBank > 0 ? safeBank / Math.abs(netPerDay) : null;

  const runOutDate = useMemo(() => {
    if (daysUntilZero === null) {
      return null;
    }

    const date = new Date();
    date.setDate(date.getDate() + Math.floor(daysUntilZero));
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [daysUntilZero]);

  const projectedBank = useMemo(() => {
    const diffDays = dayDiffFromToday(targetDate);
    return safeBank + netPerDay * diffDays;
  }, [safeBank, netPerDay, targetDate]);

  const targetDateLabel = useMemo(() => {
    const date = new Date(`${targetDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return targetDate;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [targetDate]);

  const sectionCardStyle = getGuideSectionCardStyles(isDark);
  const targetDateValue = useMemo(
    () => isoDateToDate(targetDate),
    [targetDate]
  );
  const customInputStyles = useMemo(
    () => ({
      input: {
        borderColor: `var(--mantine-color-${accent.primary}-6)`,
      },
    }),
    [accent.primary]
  );

  const deferredGainSources = useDeferredValue(gainSources);
  const deferredSpendSources = useDeferredValue(spendSources);

  const sortedGainSources = useMemo(
    () => sortSourcesByCadenceThenLabel(deferredGainSources),
    [deferredGainSources]
  );
  const sortedSpendSources = useMemo(
    () => sortSourcesByCadenceThenLabel(deferredSpendSources),
    [deferredSpendSources]
  );

  const updateSource = (
    type: SourceType,
    id: string,
    updater: (source: SourceRow) => SourceRow
  ) => {
    const setter = type === 'gain' ? setGainSources : setSpendSources;
    setter((prev) =>
      prev.map((source) => (source.id === id ? updater(source) : source))
    );
  };

  const addSource = (type: SourceType) => {
    const setter = type === 'gain' ? setGainSources : setSpendSources;
    setter((prev) => [...prev, createCustomSource(type)]);
  };

  const removeSource = (type: SourceType, id: string) => {
    const setter = type === 'gain' ? setGainSources : setSpendSources;
    setter((prev) => prev.filter((source) => source.id !== id));
  };

  const resetEverything = () => {
    setBank(0);
    setTargetDate(getTodayIsoDate());
    setGainSources(buildDefaultRows(BASE_GAIN_SOURCES));
    setSpendSources(buildDefaultRows(BASE_SPEND_SOURCES));
    setPointsLeagueDaily(POINTS_LEAGUE_OPTIONS[0].value);
    setArenaDaily(ARENA_OPTIONS[7].value);
    setColosseumBiweekly(COLOSSEUM_OPTIONS[4].value);
    setWildHuntBiweekly(WILD_HUNT_OPTIONS[7].value);
    setIncludeSupremeCard(false);

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore local storage write failures.
    }
  };

  const renderSourceRows = (type: SourceType, sources: SourceRow[]) =>
    sources.map((source) => (
      <Table.Tr
        key={source.id}
        style={{
          opacity: source.enabled ? 1 : 0.4,
          ...(source.isCustom
            ? {
                backgroundColor: `var(--mantine-color-${accent.primary}-light)`,
              }
            : undefined),
        }}
      >
        <Table.Td w={48}>
          <Switch
            size="xs"
            color={accent.primary}
            checked={source.enabled}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              updateSource(type, source.id, (prev) => ({
                ...prev,
                enabled: checked,
              }));
            }}
            aria-label={source.enabled ? 'Disable source' : 'Enable source'}
          />
        </Table.Td>
        <Table.Td>
          {source.isCustom ? (
            <TextInput
              value={source.label}
              onChange={(event) => {
                const nextLabel = event.currentTarget.value;
                updateSource(type, source.id, (prev) => ({
                  ...prev,
                  label: nextLabel,
                }));
              }}
              placeholder="Source name"
              size="xs"
              styles={customInputStyles}
            />
          ) : (
            source.label
          )}
        </Table.Td>
        <Table.Td>
          <NumberInput
            value={source.cadenceDays ?? ''}
            onChange={(value) =>
              updateSource(type, source.id, (prev) => ({
                ...prev,
                cadenceDays: parseNumberInput(value),
              }))
            }
            min={1}
            max={365}
            size="xs"
            placeholder="days"
            styles={source.isCustom ? customInputStyles : undefined}
          />
        </Table.Td>
        <Table.Td>
          <NumberInput
            value={source.amount ?? ''}
            onChange={(value) =>
              updateSource(type, source.id, (prev) => ({
                ...prev,
                amount: parseNumberInput(value),
              }))
            }
            min={0}
            max={999999999}
            size="xs"
            thousandSeparator=","
            styles={source.isCustom ? customInputStyles : undefined}
          />
        </Table.Td>
        <Table.Td>
          <ActionIcon
            color="red"
            variant="light"
            onClick={() => removeSource(type, source.id)}
            aria-label="Remove source"
          >
            <IoTrashOutline size={16} />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    ));

  return (
    <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <GuideHeroCard
          icon={<IoDiamond size={20} />}
          title="Diamond Calculator"
          subtitle="Estimate average gain, spend, runway, and projected balance by date."
        >
          <Alert
            variant="light"
            color="blue"
            title="How to use"
            icon={<IoInformationCircleOutline />}
          >
            This is an average-value planner based on recurring income and
            spending from your reference list. Set your current bank and cadence
            values, then use the date field for rough balance projection.
          </Alert>
        </GuideHeroCard>

        <Card
          withBorder
          radius="md"
          p="lg"
          {...getCardHoverProps({ style: sectionCardStyle })}
        >
          <Stack gap="md">
            <Title order={2} size="h3">
              <Group gap="xs">
                <IoWallet />
                Core Inputs
              </Group>
            </Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <NumberInput
                label="Current Diamond Bank"
                value={bank ?? ''}
                onChange={(value) => setBank(parseNumberInput(value))}
                min={0}
                max={999999999}
                thousandSeparator=","
              />
              <DateInput
                label="Projection Date"
                value={targetDateValue}
                onChange={(value: DateValue | string) => {
                  if (value instanceof Date && !Number.isNaN(value.getTime())) {
                    const selected = new Date(value);
                    selected.setHours(0, 0, 0, 0);
                    if (selected < minDate) {
                      setTargetDate(dateToInputValue(minDate));
                      return;
                    }

                    setTargetDate(dateToInputValue(value));
                    return;
                  }

                  if (typeof value === 'string') {
                    const normalized = normalizeIsoDate(
                      value,
                      getTodayIsoDate()
                    );
                    setTargetDate(normalized);
                  }
                }}
                leftSection={<IoCalendar />}
                valueFormat="YYYY-MM-DD"
                minDate={minDate}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Select
                label="Arena Rank"
                data={ARENA_OPTIONS}
                value={arenaDaily}
                onChange={(value) =>
                  setArenaDaily(value ?? ARENA_OPTIONS[0].value)
                }
                searchable
              />
              <Select
                label="Points League"
                data={POINTS_LEAGUE_OPTIONS}
                value={pointsLeagueDaily}
                onChange={(value) =>
                  setPointsLeagueDaily(value ?? POINTS_LEAGUE_OPTIONS[0].value)
                }
              />
              <Select
                label="Colosseum Rank"
                data={COLOSSEUM_OPTIONS}
                value={colosseumBiweekly}
                onChange={(value) =>
                  setColosseumBiweekly(value ?? COLOSSEUM_OPTIONS[0].value)
                }
                searchable
              />
              <Select
                label="Wild Hunt Rank"
                data={WILD_HUNT_OPTIONS}
                value={wildHuntBiweekly}
                onChange={(value) =>
                  setWildHuntBiweekly(value ?? WILD_HUNT_OPTIONS[0].value)
                }
                searchable
              />
            </SimpleGrid>

            <Group justify="space-between" align="end" wrap="wrap">
              <Switch
                label="Include Supreme Monthly Card (10,200 over 30 days)"
                color={accent.primary}
                checked={includeSupremeCard}
                onChange={(event) =>
                  setIncludeSupremeCard(event.currentTarget.checked)
                }
              />
              <Button color="red" variant="light" onClick={resetEverything}>
                Reset
              </Button>
            </Group>
          </Stack>
        </Card>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Card
            withBorder
            radius="md"
            p="lg"
            {...getCardHoverProps({ style: sectionCardStyle })}
          >
            <Stack gap="md">
              <Title order={2} size="h3">
                <Group gap="xs">
                  <IoTrendingUp />
                  Gains
                </Group>
              </Title>

              <Alert
                variant="light"
                color={accent.primary}
                title="Coverage Note"
                icon={<IoInformationCircleOutline />}
              >
                This calculator does not include every possible diamond income
                source by default. Common extras include Level 8 affection date,
                Luminary codex, Wyrmbone Ruins, Lifetime achievements, and World
                Tree Covenant. Add missing entries as custom sources.
              </Alert>

              <Box style={{ overflowX: 'auto' }}>
                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  style={{ minWidth: 480 }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={48} />
                      <Table.Th>Source</Table.Th>
                      <Table.Th w={110}>Every (days)</Table.Th>
                      <Table.Th w={110}>Amount</Table.Th>
                      <Table.Th w={56}>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {renderSourceRows('gain', sortedGainSources)}
                  </Table.Tbody>
                </Table>
              </Box>

              <Group justify="flex-end">
                <Button
                  size="xs"
                  color={accent.primary}
                  variant="light"
                  leftSection={<IoAdd size={14} />}
                  onClick={() => addSource('gain')}
                >
                  Add Gain Source
                </Button>
              </Group>
            </Stack>
          </Card>

          <Card
            withBorder
            radius="md"
            p="lg"
            {...getCardHoverProps({ style: sectionCardStyle })}
          >
            <Stack gap="md">
              <Title order={2} size="h3">
                <Group gap="xs">
                  <IoTrendingDown />
                  Spending
                </Group>
              </Title>

              <Alert
                variant="light"
                color={accent.primary}
                title="Coverage Note"
                icon={<IoInformationCircleOutline />}
              >
                This calculator does not include every possible diamond spend
                source by default. Common extras include Shovel event, Fate
                treasure hunt items, Aurora Crystal, and Auction House. Add
                missing entries as custom sources.
              </Alert>

              <Box style={{ overflowX: 'auto' }}>
                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  style={{ minWidth: 480 }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={48} />
                      <Table.Th>Source</Table.Th>
                      <Table.Th w={110}>Every (days)</Table.Th>
                      <Table.Th w={110}>Amount</Table.Th>
                      <Table.Th w={56}>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {renderSourceRows('spend', sortedSpendSources)}
                  </Table.Tbody>
                </Table>
              </Box>

              <Group justify="flex-end">
                <Button
                  size="xs"
                  color={accent.primary}
                  variant="light"
                  leftSection={<IoAdd size={14} />}
                  onClick={() => addSource('spend')}
                >
                  Add Spend Source
                </Button>
              </Group>
            </Stack>
          </Card>
        </SimpleGrid>

        <Card
          withBorder
          radius="md"
          p="lg"
          {...getCardHoverProps({ style: sectionCardStyle })}
        >
          <Stack gap="md">
            <Title order={2} size="h3">
              Results
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
              <StatCard
                icon={<IoTrendingUp size={16} />}
                title="Avg Gain / Day"
                value={formatNumber(totalGainPerDay)}
                color="teal"
              />
              <StatCard
                icon={<IoTrendingDown size={16} />}
                title="Avg Spend / Day"
                value={formatNumber(totalSpendPerDay)}
                color="red"
              />
              <StatCard
                icon={<IoDiamond size={16} />}
                title="Net / Week"
                value={formatSigned(netPerWeek)}
                color={netPerWeek >= 0 ? 'green' : 'red'}
              />
              <StatCard
                icon={<IoDiamond size={16} />}
                title="Net / Month"
                value={formatSigned(netPerMonth)}
                color={netPerMonth >= 0 ? 'green' : 'red'}
              />
            </SimpleGrid>

            <Table withTableBorder>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>Net per day</Table.Td>
                  <Table.Td>
                    <Text fw={700} c={netPerDay >= 0 ? 'green.7' : 'red.7'}>
                      {formatSigned(netPerDay)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Projection on {targetDateLabel}</Table.Td>
                  <Table.Td>
                    <Text fw={700} c={projectedBank >= 0 ? 'green.7' : 'red.7'}>
                      {formatNumber(projectedBank)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Runway status</Table.Td>
                  <Table.Td>
                    {netPerDay >= 0 ? (
                      <Text fw={700} c="green.7">
                        —
                      </Text>
                    ) : safeBank <= 0 ? (
                      <Text fw={700} c="red.7">
                        Already empty
                      </Text>
                    ) : (
                      <Stack gap={2}>
                        <Text fw={700} c="red.7">
                          Runs out in {formatNumber(daysUntilZero ?? 0)} days
                        </Text>
                        {runOutDate ? (
                          <Text size="sm" c="dimmed">
                            Approx. date: {runOutDate}
                          </Text>
                        ) : null}
                      </Stack>
                    )}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
