import { Center, Pagination } from '@mantine/core';

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
  if (totalPages <= 1) return null;

  return (
    <Center mt="md">
      <Pagination
        value={currentPage}
        onChange={onChange}
        total={totalPages}
      />
    </Center>
  );
}
