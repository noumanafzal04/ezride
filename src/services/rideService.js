import api from './api';

const rideService = {
    // Driver creates a city-to-city ride post
    createRidePost: (payload) => api.post('/driver/ride-posts', payload),

    // Driver's own posted rides
    getRidePosts: () => api.get('/driver/ride-posts'),
    cancelRidePost: (id) => api.delete(`/driver/ride-posts/${id}`),

    // ── Rider: browse + book ────────────────────────────────────
    getAvailableRides: (params = {}) => api.get('/ride-posts', { params }),
    // Lightweight poll: how many new rides since `after_id` (for the "new rides" banner)
    getNewRidesCount: (params = {}) => api.get('/ride-posts/new-count', { params }),
    getRideDetail: (id) => api.get(`/ride-posts/${id}`),
    // Driver public data (ride-detail screen): aggregate stats + paginated reviews/trips
    getDriverSummary: (driverId) => api.get(`/drivers/${driverId}/summary`),
    getDriverReviews: (driverId, params = {}) => api.get(`/drivers/${driverId}/reviews`, { params }),
    getDriverTrips: (driverId, params = {}) => api.get(`/drivers/${driverId}/trips`, { params }),
    bookSeat: (ridePostId, payload) => api.post(`/ride-posts/${ridePostId}/book`, payload),

    // ── Rider: own bookings ─────────────────────────────────────
    getMyBookings: (params = {}) => api.get('/bookings', { params }),
    cancelBooking: (id) => api.post(`/bookings/${id}/cancel`),
    completeBooking: (id) => api.post(`/bookings/${id}/complete`),

    // ── Ride trip lifecycle (driver controls the whole ride) ────
    startRide: (ridePostId) => api.post(`/driver/ride-posts/${ridePostId}/start`),
    endRide: (ridePostId) => api.post(`/driver/ride-posts/${ridePostId}/end`),

    // ── Review (either party, after the ride is completed) ──────
    rateBooking: (id, payload) => api.post(`/bookings/${id}/rate`, payload),

    // ── Driver: bookings received ───────────────────────────────
    getDriverBookings: (params = {}) => api.get('/driver/bookings', { params }),
    acceptBooking: (id) => api.post(`/driver/bookings/${id}/accept`),
    rejectBooking: (id) => api.post(`/driver/bookings/${id}/reject`),
};

export default rideService;
