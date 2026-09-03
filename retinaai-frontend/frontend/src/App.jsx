import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineProvider } from './context/OfflineContext';
import AppRouter from './router';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <OfflineProvider>
            <AppRouter />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0f172a',
                  color: '#f8fafc',
                  borderRadius: '14px',
                  border: '1px solid #1e293b',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#0f172a' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
                },
              }}
            />
          </OfflineProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
