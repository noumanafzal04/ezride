import api from './api';

const authService = {
    signup: (payload) => {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            if (value) form.append(key, value);
        });
        return api.post('/auth/signup', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    verifyOtp: (email, otp) => {
        const form = new FormData();
        form.append('email', email);
        form.append('otp', otp);
        return api.post('/auth/verify-otp', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    resendOtp: (email) => {
        const form = new FormData();
        form.append('email', email);
        return api.post('/auth/resend-otp', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    login: (payload) => {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
            form.append(key, value);
        });
        return api.post('/auth/login', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    me:     () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};

export default authService;
