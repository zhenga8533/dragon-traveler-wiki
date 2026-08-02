import {
  Alert,
  Button,
  Container,
  Group,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import {
  IoCheckmark,
  IoCloseCircleOutline,
  IoInformationCircleOutline,
  IoSearch,
} from 'react-icons/io5';
import LastUpdated from '@/components/common/LastUpdated';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import SuggestModal from '@/components/tools/SuggestModal';
import DataFetchError from '@/components/ui/DataFetchError';
import EmptyState from '@/components/ui/EmptyState';
import PaginationControl from '@/components/ui/PaginationControl';
import ViewToggle from '@/components/ui/ViewToggle';
import { IMAGE_SIZE } from '@/constants/ui';
import CodeBulkModals from '@/features/wiki/codes/components/CodeBulkModals';
import CodeCollection from '@/features/wiki/codes/components/CodeCollection';
import CodeRewardSummary from '@/features/wiki/codes/components/CodeRewardSummary';
import { useCodesPage } from '@/features/wiki/codes/hooks/use-codes-page';
import {
  buildCodeRewardFields,
  CODE_FIELDS,
} from '@/features/wiki/codes/suggestion-fields';
import { useGradientAccent, useMobileTooltip } from '@/hooks';
import type { Code } from '@/features/wiki/codes/types';
import type { Resource } from '@/features/wiki/resources/types';
import { useMemo } from 'react';

export default function CodesPageContent({
  codes,
  resources,
  loading,
  error,
  onRetry,
}: {
  codes: Code[];
  resources: Resource[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const page = useCodesPage(codes);
  const rewardFields = useMemo(
    () => buildCodeRewardFields(resources),
    [resources]
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm" align="baseline">
            <Title order={1}>Codes</Title>
            <LastUpdated timestamp={page.mostRecentUpdate} />
          </Group>
          <SuggestModal
            buttonLabel="Suggest a Code"
            modalTitle="Suggest a New Code"
            issueTitle="[Code] New code suggestion"
            fields={CODE_FIELDS}
            arrayFields={rewardFields}
            excludeFromJson={['source']}
          />
        </Group>

        <Alert
          icon={<IoInformationCircleOutline size={20} />}
          title="How to redeem"
          color={accent.primary}
          variant="light"
        >
          <Text size="sm">
            Codes are redeemed in-game via{' '}
            <strong>Settings &gt; Redeem Code</strong>. Each code can only be
            used once per account. Codes are case-sensitive and must be entered
            without leading or trailing spaces.
          </Text>
        </Alert>

        <TextInput
          placeholder="Search codes..."
          leftSection={<IoSearch size={IMAGE_SIZE.ICON_MD} />}
          value={page.search}
          onChange={(event) => page.setSearch(event.currentTarget.value)}
        />
        <Tabs value={page.tab} onChange={page.setTab}>
          <Tabs.List>
            <Tabs.Tab value="active">Active Codes</Tabs.Tab>
            <Tabs.Tab value="expired">Expired Codes</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs">
            <SegmentedControl
              value={page.view}
              onChange={(value) =>
                page.setView(value as typeof page.view)
              }
              data={[
                { label: 'Unredeemed', value: 'unredeemed' },
                { label: 'Redeemed', value: 'redeemed' },
                { label: 'All', value: 'all' },
              ]}
            />
            <ViewToggle viewMode={page.viewMode} onChange={page.setViewMode} />
          </Group>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              color={accent.primary}
              leftSection={<IoCheckmark size={14} />}
              onClick={page.openMarkAll}
            >
              Mark All Redeemed
            </Button>
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IoCloseCircleOutline size={14} />}
              onClick={page.openClearAll}
            >
              Clear All Redeemed
            </Button>
          </Group>
        </Group>

        {!loading && error ? (
          <DataFetchError
            title="Could not load codes"
            message={error.message}
            onRetry={onRetry}
          />
        ) : null}
        {!loading && !error ? (
          <CodeRewardSummary
            tab={page.tab}
            view={page.view}
            opened={page.rewardsOpen}
            onToggle={page.toggleRewards}
            unclaimedRewards={page.unclaimedRewards}
            claimedRewards={page.claimedRewards}
            accentColor={accent.primary}
          />
        ) : null}
        {loading ? (
          <ViewModeLoading
            viewMode={page.viewMode}
            cards={9}
            cardHeight={180}
            gridCols={{ base: 1, xs: 2, sm: 3 }}
            showPagination
            label="Loading codes"
          />
        ) : null}
        {!loading && !error && page.filtered.length === 0 ? (
          <EmptyState
            icon={<IoSearch size={32} />}
            title={page.emptyState.title}
            description={page.emptyState.message}
            color={accent.primary}
            action={
              <Group>
                <Button
                  size="xs"
                  variant="outline"
                  color={accent.primary}
                  onClick={() => page.setSearch('')}
                >
                  Clear search
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color={accent.primary}
                  onClick={() => page.setView('all')}
                >
                  Show all
                </Button>
              </Group>
            }
          />
        ) : null}
        {!loading && !error && page.pageItems.length > 0 ? (
          <CodeCollection
            codes={page.pageItems}
            viewMode={page.viewMode}
            redeemed={page.redeemed}
            onToggleRedeemed={page.toggleRedeemed}
            accentColor={accent.primary}
            tooltipProps={tooltipProps}
          />
        ) : null}
        {!loading && !error ? (
          <PaginationControl
            currentPage={page.page}
            totalPages={page.totalPages}
            onChange={page.setPage}
            totalItems={page.filtered.length}
            pageSize={page.pageSize}
            pageSizeOptions={page.pageSizeOptions}
            onPageSizeChange={page.setPageSize}
            scrollToTop
          />
        ) : null}
        <CodeBulkModals page={page} accentColor={accent.primary} />
      </Stack>
    </Container>
  );
}
