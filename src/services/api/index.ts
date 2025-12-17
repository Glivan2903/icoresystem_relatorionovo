import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'https://api.beteltecnologia.com'),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = import.meta.env.VITE_ACCESS_TOKEN;
    const secret = import.meta.env.VITE_SECRET_ACCESS_TOKEN;

    if (token && secret) {
        config.headers['access-token'] = token;
        config.headers['secret-access-token'] = secret;
    }

    return config;
});

export default api;
