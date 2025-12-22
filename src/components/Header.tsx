import { Moon, Sun, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { BoardSelector } from './BoardSelector';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate, useLocation } from 'react-router-dom';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fa' : 'en';
    // Remove the current language prefix and add the new one
    const pathParts = location.pathname.split('/').filter(Boolean);
    // If the first part is a language code, replace it
    if (pathParts[0] === 'en' || pathParts[0] === 'fa') {
      pathParts[0] = newLang;
    } else {
      pathParts.unshift(newLang);
    }
    navigate(`/${pathParts.join('/')}`, { replace: true });
  };

  return (
    <header className="glass sticky top-0 z-50 shadow-lg animate-slide-in">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-100 dark:to-slate-200 bg-clip-text text-transparent hover:scale-105 transition-transform">
              {t('app.title')}
            </h1>
            <div className="ms-4">
              <BoardSelector />
            </div>
          </div>

          <div className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 me-2">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-tight uppercase tracking-wider">
                    {user.role}
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 group flex items-center gap-2 hover:scale-105 cursor-pointer"
              aria-label={t('language.toggle')}
            >
              <Languages className="w-5 h-5 text-neutral-900 dark:text-slate-300 group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">
                {i18n.language === 'en' ? 'FA' : 'EN'}
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 group hover:scale-110 hover:rotate-12 cursor-pointer"
              aria-label={t('theme.toggle')}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-neutral-900 dark:text-slate-300 group-hover:rotate-12 transition-transform" />
              ) : (
                <Sun className="w-5 h-5 text-neutral-900 dark:text-slate-300 group-hover:rotate-12 transition-transform" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
