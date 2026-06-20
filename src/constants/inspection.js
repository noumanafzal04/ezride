// Inspection request status → label / colour / icon. Mirrors the backend
// InspectionRequest::STATUS_* lifecycle.
export const INSPECTION_STATUS_META = {
    pending:     { label: 'Submitted',   color: '#1D6AFF', bg: '#EEF4FF', icon: 'inbox-arrow-down-outline' },
    reviewing:   { label: 'Under Review', color: '#92600B', bg: '#FFF7ED', icon: 'magnify-scan' },
    scheduled:   { label: 'Scheduled',   color: '#6C63FF', bg: '#F0EEFF', icon: 'calendar-check-outline' },
    in_progress: { label: 'In Progress', color: '#0F8A8A', bg: '#E6F7F7', icon: 'progress-wrench' },
    completed:   { label: 'Completed',   color: '#109F2A', bg: '#E8F8EE', icon: 'check-decagram-outline' },
    cancelled:   { label: 'Cancelled',   color: '#D83F54', bg: '#FFF0F2', icon: 'close-octagon-outline' },
};

export const INSPECTION_DEFAULT_META = { label: 'Submitted', color: '#5D5F62', bg: '#F1F2F4', icon: 'help-circle-outline' };

// The happy-path progression shown as a stepper (cancelled is handled separately).
export const INSPECTION_FLOW = ['pending', 'reviewing', 'scheduled', 'in_progress', 'completed'];

export const metaFor = (status) => INSPECTION_STATUS_META[status] || INSPECTION_DEFAULT_META;

// Category report conditions (mirrors backend weights).
export const CONDITION_META = {
    excellent: { label: 'Excellent', color: '#109F2A', bg: '#E8F8EE' },
    good:      { label: 'Good',      color: '#3FA34D', bg: '#EEF8F0' },
    fair:      { label: 'Fair',      color: '#C98A00', bg: '#FFF7E6' },
    poor:      { label: 'Poor',      color: '#D83F54', bg: '#FFF0F2' },
    na:        { label: 'N/A',       color: '#9AA0A6', bg: '#F1F2F4' },
};
export const CONDITION_ORDER = ['excellent', 'good', 'fair', 'poor', 'na'];
export const conditionMeta = (c) => CONDITION_META[c] || CONDITION_META.na;
