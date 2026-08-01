import { Button, Group, Modal, Text } from '@mantine/core';
import type { useCodesPage } from '@/features/wiki/codes/hooks/use-codes-page';

export default function CodeBulkModals({
  page,
  accentColor,
}: {
  page: ReturnType<typeof useCodesPage>;
  accentColor: string;
}) {
  return (
    <>
      <Modal
        opened={page.markAllOpened}
        onClose={page.closeMarkAll}
        title="Mark all redeemed?"
        centered
        lockScroll={false}
      >
        <Text size="sm" mb="lg">
          This will mark {page.tabCodeCount} {page.tab} codes as redeemed.
        </Text>
        <Group justify="flex-end">
          <Button
            variant="outline"
            color={accentColor}
            onClick={page.closeMarkAll}
          >
            Cancel
          </Button>
          <Button
            color={accentColor}
            onClick={() => {
              page.markAllRedeemed();
              page.closeMarkAll();
            }}
          >
            Confirm
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={page.clearAllOpened}
        onClose={page.closeClearAll}
        title="Clear all redeemed?"
        centered
        lockScroll={false}
      >
        <Text size="sm" mb="lg">
          This will mark {page.tabCodeCount} {page.tab} codes as unredeemed.
        </Text>
        <Group justify="flex-end">
          <Button
            variant="outline"
            color={accentColor}
            onClick={page.closeClearAll}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              page.clearAllRedeemed();
              page.closeClearAll();
            }}
          >
            Confirm
          </Button>
        </Group>
      </Modal>
    </>
  );
}
