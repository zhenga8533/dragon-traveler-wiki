import { Center, Pagination } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '../../constants/ui';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function PaginationControl({
  currentPage,
  totalPages,
  onChange,
}: PaginationControlProps) {
  const isMobile = useMediaQuery(BREAKPOINTS.MOBILE);

  if (totalPages <= 1) return null;

  return (
    <Center mt="md">
      <Pagination
        value={currentPage}
        onChange={onChange}
        total={totalPages}
        size={isMobile ? 'md' : 'sm'}
        siblings={isMobile ? 0 : 1}
        boundaries={isMobile ? 1 : 2}
      />
    </Center>
  );
}
