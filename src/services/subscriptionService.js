import api from './api';

export default {
    plans: (module) => api.get('/subscriptions/plans', { params: module ? { module } : {} }),
    me: () => api.get('/subscriptions/me'),
    subscribe: (planId) => api.post('/subscriptions/subscribe', { plan_id: planId }),
};
