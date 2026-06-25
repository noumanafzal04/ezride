import api from './api';

const serviceService = {
    categories: () => api.get('/service-categories'),
    providerMe: () => api.get('/service-provider/me'),
    registerProvider: (payload) => api.post('/service-provider', payload),
    // Browse
    providers: (params) => api.get('/service-providers', { params }),
    provider: (id) => api.get(`/service-providers/${id}`),
    providerReviews: (id, params) => api.get(`/service-providers/${id}/reviews`, { params }),

    // Bookings — customer
    createBooking: (providerId, payload) => api.post(`/service-providers/${providerId}/bookings`, payload),
    myBookings: (params) => api.get('/service-bookings', { params }),
    cancelBooking: (id) => api.post(`/service-bookings/${id}/cancel`),
    rateBooking: (id, payload) => api.post(`/service-bookings/${id}/rate`, payload),

    // Bookings — provider
    providerBookings: (params) => api.get('/provider/service-bookings', { params }),
    bookingAction: (id, action) => api.post(`/service-bookings/${id}/${action}`), // accept|reject|start|complete
};

export default serviceService;
