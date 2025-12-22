import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Header } from '@/components/Header';
import { Board } from '@/components/Board';
import { useAuthStore } from '@/store/auth-store';
import { CONFIGS } from '@/config';
import '@/i18n';

const LanguageHandler = () => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const supportedLangs = ['en', 'fa'];
    if (lang && supportedLangs.includes(lang)) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    } else {
      // Default to English or current i18n language if invalid lang param
      const targetLang = i18n.language || 'en';
      navigate(`/${targetLang}${location.pathname === '/' ? '' : location.pathname}`, { replace: true });
    }
  }, [lang, i18n, navigate, location.pathname]);

  return null;
};

function TaskManager() {
  const [isLoading, setIsLoading] = useState(true);
  const { fetchUser, user, isLoading: isAuthLoading } = useAuthStore();

  useEffect(() => {
    // Fetch user and simulate initial loading
    const initialize = async () => {
      await fetchUser();
      setIsLoading(false);
    };
    initialize();
  }, [fetchUser]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="loading animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 animate-pulse">
            Loading Task Manager...
          </h2>
          {user && <p className="mt-2 text-slate-500">Welcome back, {user.name}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <Header />
      <div className="p-4">
        {user ? (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Logged in as <strong>{user.name}</strong> ({user.email})
          </div>
        ) : (
          <div className="mb-4 p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm flex items-center gap-1">
            Viewing as guest. Please{' '}
            <a 
              href="/login" 
              className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              sign in
            </a>{' '}
            to save changes.
          </div>
        )}
        <Board />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={CONFIGS.BASE_PATH}>
        <Routes>
          <Route path="/:lang/*" element={
            <>
              <LanguageHandler />
              <Routes>
                <Route path="/" element={<TaskManager />} />
              </Routes>
            </>
          } />
          <Route path="*" element={<Navigate to="/en" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;


