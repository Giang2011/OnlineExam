import React from 'react';
import AppProviders from './app/providers/AppProviders';
import AppRoutes from './app/routes/AppRoutes';

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
};

export default App;
