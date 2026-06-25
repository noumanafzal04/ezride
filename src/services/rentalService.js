import api from './api';

export default {
    list: (params = {}) => api.get('/rentals', { params }),
    models: () => api.get('/rentals/models'),
    mine: () => api.get('/rentals/mine'),
    detail: (id) => api.get(`/rentals/${id}`),
    create: (formData) => api.post('/rentals', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    setStatus: (id, status) => api.patch(`/rentals/${id}/status`, { status }),
    remove: (id) => api.delete(`/rentals/${id}`),

    book: (id, payload) => api.post(`/rentals/${id}/book`, payload),
    myBookings: () => api.get('/rentals/bookings/mine'),
    ownerBookings: (params = {}) => api.get('/rentals/bookings/owner', { params }),
    cancelBooking: (id) => api.patch(`/rentals/bookings/${id}/cancel`),
    rateBooking: (id, payload) => api.post(`/rentals/bookings/${id}/rate`, payload),
    bookingAction: (id, action) => api.patch(`/rentals/bookings/${id}/${action}`),
};
