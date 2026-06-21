import axios from 'axios';
import useAuthStore from '../store/authStore';
import useUserStore from '../store/userStore';
import useConfigStore from '../store/configStore';
import config from '../config';
import { resetToLogin } from '../navigation/navigationRef';

const api = axios.create({
    baseURL: config.BASE_URL,
    // Fail fast instead of hanging forever when the server is unreachable.
    timeout: 20000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Use the runtime server URL + inject Bearer token on every request.
api.interceptors.request.use(
    (cfg) => {
        cfg.baseURL = useConfigStore.getState().baseUrl;
        const token = useAuthStore.getState().token;
        if (token) {
            cfg.headers.Authorization = `Bearer ${token}`;
        }
        return cfg;
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
