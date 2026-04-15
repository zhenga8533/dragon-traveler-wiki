import { BrowserRouter } from 'react-router-dom';
import AppProviders from './AppProviders';
import RouteMeta from './components/common/RouteMeta';
import AppLayout from './components/layout/AppLayout';

export default function App() {
  return (
    <BrowserRouter>
      <RouteMeta />
      <AppProviders>
        <AppLayout />
      </AppProviders>
    </BrowserRouter>
  );
}
