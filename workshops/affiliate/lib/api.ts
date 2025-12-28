const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('affiliate_token') : null;

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        if (res.status === 401) {
            // Handle unauthorized - maybe redirect to login
            console.error('Unauthorized access');
        }
        const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(error.message || 'Falha na requisição');
    }

    return res.json();
}

export const affiliateApi = {
    getStats: () => fetchWithAuth('/affiliate-portal/stats'),
    getLinks: () => fetchWithAuth('/affiliate-portal/links'),
    getProducts: () => fetchWithAuth('/affiliate-portal/products'),
    getProfile: () => fetchWithAuth('/affiliate-portal/profile'),
    updateProfile: (data: { name?: string; email?: string; pixKey?: string }) => fetchWithAuth('/affiliate-portal/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};
