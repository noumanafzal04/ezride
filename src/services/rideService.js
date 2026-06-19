import api from './api';

const rideService = {
    // Driver creates a city-to-city ride post
    createRidePost: (payload) => api.post('/driver/ride-posts', payload),

    // Driver's own posted rides
    getRidePosts: () => api.get('/driver/ride-posts'),
    cancelRidePost: (id) => api.delete(`/driver/ride-posts/${id}`),

    // ── Rider: browse + book ────────────────────────────────────
    getAvailableRides: (params = {}) => api.get('/ride-posts', { params }),
    getRideDetail: (id) => api.get(`/ride-posts/${id}`),
    bookSeat: (ridePostId, payload) => api.post(`/ride-posts/${ridePostId}/book`, payload),

    // ── Rider: own bookings ─────────────────────────────────────
    getMyBookings: (params = {}) => api.get('/bookings', { params }),
    cancelBooking: (id) => api.post(`/bookings/${id}/cancel`),

    // ── Completion + review (either party) ──────────────────────
    completeBooking: (id) => api.post(`/bookings/${id}/complete`),
    rateBooking: (id, payload) => api.post(`/bookings/${id}/rate`, payload),

    // ── Driver: bookings received ───────────────────────────────
    getDriverBookings: (params = {}) => api.get('/driver/bookings', { params }),
    acceptBooking: (id) => api.post(`/driver/bookings/${id}/accept`),
    rejectBooking: (id) => api.post(`/driver/bookings/${id}/reject`),
};

export default rideService;
