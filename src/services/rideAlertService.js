import api from './api';

const rideAlertService = {
    list: () => api.get('/ride-alerts'),
    create: (payload) => api.post('/ride-alerts', payload),
    remove: (id) => api.delete(`/ride-alerts/${id}`),
};

export default rideAlertService;
