import { BrowserRouter } from 'react-router-dom';
import AppProviders from './AppProviders';
import RouteMeta from './components/common/RouteMeta';
import AppLayout from './components/layout/AppLayout';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <RouteMeta />
      <AppProviders>
        <AppLayout />
      </AppProviders>
    </BrowserRouter>
  );
}
