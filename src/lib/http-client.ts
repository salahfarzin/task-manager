import { CONFIGS } from '@/config';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
}

class HttpClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { params, ...init } = options;

        // Construct URL with query parameters
        let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }

        // Set default headers and credentials
        const headers = new Headers(init.headers);
        if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(url, {
            ...init,
            headers,
            credentials: 'include', // Default for your HTTP-only cookie setup
        });

        // Special handling for 401
        if (response.status === 401) {
            // You might want to trigger a global logout or redirect here
            // For now, we'll return a rejection that the caller can handle
            const errorData = await response.json().catch(() => ({}));
            return Promise.reject({
                status: 401,
                message: 'Unauthorized',
                data: errorData,
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return Promise.reject({
                status: response.status,
                message: errorData.message || 'An error occurred',
                data: errorData,
            });
        }

        // Handle empty responses
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    get<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, body?: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    put<T>(endpoint: string, body?: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    patch<T>(endpoint: string, body?: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const httpClient = new HttpClient(CONFIGS.API_URL);
