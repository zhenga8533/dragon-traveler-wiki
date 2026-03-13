import { STORAGE_KEY } from '@/constants/ui';
import { useSyncExternalStore } from 'react';

const MOBILE_NAV_PREFERENCE_EVENT = 'app:mobile-nav-preference-change';

function readMobileNavEnabled(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY.MOBILE_NAV_ENABLED);
  return stored === null ? true : stored !== 'false';
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY.MOBILE_NAV_ENABLED) {
      callback();
    }
  };

  const handlePreferenceChange = () => {
    callback();
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(MOBILE_NAV_PREFERENCE_EVENT, handlePreferenceChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(
      MOBILE_NAV_PREFERENCE_EVENT,
      handlePreferenceChange
    );
  };
}

export function setMobileNavEnabled(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY.MOBILE_NAV_ENABLED, String(enabled));
  window.dispatchEvent(new Event(MOBILE_NAV_PREFERENCE_EVENT));
}

export function useMobileNavEnabled() {
  const isMobileNavEnabled = useSyncExternalStore(
    subscribe,
    readMobileNavEnabled,
    () => true
  );

  return {
    isMobileNavEnabled,
    setMobileNavEnabled,
  };
}
