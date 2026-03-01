import { HashRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import {
  ResourcesProvider,
  SearchDataProvider,
  TierListReferenceProvider,
} from './contexts';

export default function App() {
  return (
    <HashRouter>
      <SearchDataProvider>
        <ResourcesProvider>
          <TierListReferenceProvider>
            <AppLayout />
          </TierListReferenceProvider>
        </ResourcesProvider>
      </SearchDataProvider>
    </HashRouter>
  );
}
