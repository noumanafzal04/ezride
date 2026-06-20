import api from './api';

const inspectionService = {
    // Public submit (token attached automatically when logged in)
    submit: (payload) => api.post('/inspection-requests', payload),
    // Current user's own requests
    list: (params) => api.get('/inspection-requests', { params }),
    detail: (id) => api.get(`/inspection-requests/${id}`),
    cancel: (id) => api.post(`/inspection-requests/${id}/cancel`),
    // Public status lookup by tracking code (no auth needed)
    track: (token) => api.get(`/inspection-requests/track/${token}`),

    // Admin / team (requires users.is_admin) — in-app testing tool until the web portal
    adminList: (params) => api.get('/admin/inspection-requests', { params }),
    adminDetail: (id) => api.get(`/admin/inspection-requests/${id}`),
    adminUpdateStatus: (id, payload) => api.post(`/admin/inspection-requests/${id}/status`, payload),
    adminAssign: (id, payload) => api.post(`/admin/inspection-requests/${id}/assign`, payload),
    adminCategories: () => api.get('/admin/inspection-categories'),
    adminSaveReport: (id, payload) => api.post(`/admin/inspection-requests/${id}/report`, payload),
};

export default inspectionService;
