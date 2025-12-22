/**
 * Application configuration
 * Values are primarily read from environment variables (.env)
 */

export const CONFIGS = {
    // The base path for the application routing (e.g., /dashboard/task-manager/)
    BASE_PATH: import.meta.env.VITE_APP_BASE_PATH || '/',

    // Base API URL
    API_URL: import.meta.env.VITE_API_URL || 'https://psychometrist.local/v1',

    // Environment mode
    MODE: import.meta.env.MODE,
    IS_DEV: import.meta.env.DEV,
    IS_PROD: import.meta.env.PROD,
};

// Remove trailing slash for comparison if needed, but keep it for basename if intended
export const getCleanBasePath = () => {
    const base = CONFIGS.BASE_PATH;
    if (base === '/') return '';
    return base.endsWith('/') ? base.slice(0, -1) : base;
};
