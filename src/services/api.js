import axios from 'axios';
import useAuthStore from '../store/authStore';
import useUserStore from '../store/userStore';
import config from '../config';
import { resetToLogin } from '../navigation/navigationRef';

const api = axios.create({
    baseURL: config.BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Inject Bearer token on every request
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auto logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            useUserStore.getState().clearUser();
            resetToLogin();
        }
        return Promise.reject(error);
    }
);

export default api;
