import api from './api';

export default {
    list: (params = {}) => api.get('/car-listings', { params }),
    mine: () => api.get('/car-listings/mine'),
    detail: (id) => api.get(`/car-listings/${id}`),
    create: (formData) => api.post('/car-listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, payload) => api.put(`/car-listings/${id}`, payload),
    markSold: (id) => api.patch(`/car-listings/${id}/sold`),
    remove: (id) => api.delete(`/car-listings/${id}`),
};
