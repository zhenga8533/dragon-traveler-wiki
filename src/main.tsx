import { localStorageColorSchemeManager, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { theme } from './theme';
import { STORAGE_KEY } from './constants/ui';

const colorSchemeManager = localStorageColorSchemeManager({
  key: STORAGE_KEY.COLOR_SCHEME,
});

if (import.meta.env.PROD) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = '{"token": "10bb7e19aaf14941b58333a277cb678a"}';
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      defaultColorScheme="auto"
      colorSchemeManager={colorSchemeManager}
    >
      <Notifications position="bottom-right" />
      <App />
    </MantineProvider>
  </StrictMode>
);
