import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/navigation/Navbar';
import AppRoutes from './routes';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <AppRoutes />
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4CAF50',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#E53E3E',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
};

export default App;
