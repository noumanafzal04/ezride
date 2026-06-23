import api from './api';

const chatService = {
    inbox: (params) => api.get('/conversations', { params }),
    unreadCount: () => api.get('/conversations/unread-count'),
    messages: (id, params) => api.get(`/conversations/${id}/messages`, { params }),
    send: (id, body) => api.post(`/conversations/${id}/messages`, { body }),
    markRead: (id) => api.post(`/conversations/${id}/read`),
    byBooking: (bookingId) => api.get(`/conversations/by-booking/${bookingId}`),
    byServiceBooking: (serviceBookingId) => api.get(`/conversations/by-service-booking/${serviceBookingId}`),
    byListing: (listingId) => api.get(`/conversations/by-listing/${listingId}`),
    byRentalBooking: (bookingId) => api.get(`/conversations/by-rental-booking/${bookingId}`),
};

export default chatService;
