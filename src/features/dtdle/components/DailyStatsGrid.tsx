import StatCard from '@/components/ui/StatCard';
import { SimpleGrid } from '@mantine/core';
import { IoCheckmarkCircleOutline, IoFlame, IoTrophy } from 'react-icons/io5';
import type { DtdleStats } from '../types';

interface DailyStatsGridProps {
  stats: DtdleStats;
}

export default function DailyStatsGrid({ stats }: DailyStatsGridProps) {
  return (
    <SimpleGrid cols={{ base: 3 }} spacing="md">
      <StatCard
        icon={<IoCheckmarkCircleOutline size={20} />}
        title="Games Played"
        value={stats.gamesPlayed}
        color="blue"
      />
      <StatCard
        icon={<IoFlame size={20} />}
        title="Current Streak"
        value={stats.currentStreak}
        color="orange"
      />
      <StatCard
        icon={<IoTrophy size={20} />}
        title="Max Streak"
        value={stats.maxStreak}
        color="yellow"
      />
    </SimpleGrid>
  );
}
