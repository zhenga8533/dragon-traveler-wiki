import CodesPageContent from '@/features/wiki/codes/components/CodesPageContent';
import { useCodes, useResources } from '@/features/wiki/hooks/use-wiki-data';

export default function Codes() {
  const { data: codes, loading, error, retry } = useCodes();
  const { data: resources } = useResources();

  return (
    <CodesPageContent
      codes={codes}
      resources={resources}
      loading={loading}
      error={error}
      onRetry={retry}
    />
  );
}
