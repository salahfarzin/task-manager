import { create } from 'zustand';
import { httpClient } from '@/lib/http-client';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthStore {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    fetchUser: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    isLoading: false,
    error: null,
    refreshToken: async () => {
        try {
            // Attempt to refresh the token
            await httpClient.post<any>('/refresh');
            return true;
        } catch (error: any) {
            // Refresh failed
            return false;
        }
    },
    fetchUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await httpClient.get<any>('/me');
            // Assuming data structure based on typical API: { user: { ... } } or { data: { ... } }
            const userData = data.user || data.data || data;
            set({ user: userData, isLoading: false });
        } catch (error: any) {
            // Handle expected 401 as potentially expired token
            if (error.status === 401) {
                // Try to refresh the token
                const refreshSuccess = await get().refreshToken();

                if (refreshSuccess) {
                    // Retry fetching user after successful refresh
                    try {
                        const data = await httpClient.get<any>('/me');
                        const userData = data.user || data.data || data;
                        set({ user: userData, isLoading: false });
                        return;
                    } catch (retryError: any) {
                        // If retry fails, user is not authenticated
                        set({ user: null, isLoading: false });
                        return;
                    }
                } else {
                    // Refresh failed, user is not authenticated
                    set({ user: null, isLoading: false });
                    return;
                }
            }

            set({
                error: error.message || 'An unexpected error occurred',
                isLoading: false,
                user: null
            });
        }
    },
}));
