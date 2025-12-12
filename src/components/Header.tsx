import { Moon, Sun, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { BoardSelector } from './BoardSelector';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fa' : 'en';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
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
            <BoardSelector />
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 group hover:scale-110 hover:rotate-12 cursor-pointer"
              aria-label={t('language.toggle')}
            >
              <Languages className="w-5 h-5 text-neutral-900 dark:text-slate-300 group-hover:scale-110 transition-transform" />
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
