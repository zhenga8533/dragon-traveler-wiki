import { useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEY } from '@/constants/ui';
import { SearchDataContext } from '@/contexts';
import { isCodeActive, readStoredStringSet } from '@/utils';
import { isGameEventActive } from '@/utils/event-utils';

/** Live counts of active, unredeemed codes and active events, for the Codes/Events nav badges. */
export function useNavBadgeCounts() {
  const { codes, events } = useContext(SearchDataContext);

  const [redeemedCodes, setRedeemedCodes] = useState<Set<string>>(() =>
    readStoredStringSet(STORAGE_KEY.REDEEMED_CODES),
  );

  useEffect(() => {
    const syncRedeemedCodes = () => {
      setRedeemedCodes(readStoredStringSet(STORAGE_KEY.REDEEMED_CODES));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY.REDEEMED_CODES) {
        syncRedeemedCodes();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('redeemed-codes-updated', syncRedeemedCodes);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('redeemed-codes-updated', syncRedeemedCodes);
    };
  }, []);

  const activeCodesCount = useMemo(
    () =>
      codes.filter(
        (code) => isCodeActive(code) && !redeemedCodes.has(code.code),
      ).length,
    [codes, redeemedCodes],
  );

  const activeEventsCount = useMemo(
    () => events.filter((event) => isGameEventActive(event)).length,
    [events],
  );

  return { activeCodesCount, activeEventsCount };
}
