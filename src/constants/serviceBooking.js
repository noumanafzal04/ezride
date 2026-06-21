// Service booking status → label / colour / icon.
export const SB_STATUS_META = {
    requested:   { label: 'Requested',   color: '#1D6AFF', bg: '#EEF4FF', icon: 'clock-outline' },
    accepted:    { label: 'Accepted',    color: '#109F2A', bg: '#E8F8EE', icon: 'check-circle-outline' },
    in_progress: { label: 'In Progress', color: '#0F8A8A', bg: '#E6F7F7', icon: 'progress-wrench' },
    completed:   { label: 'Completed',   color: '#109F2A', bg: '#E8F8EE', icon: 'check-decagram-outline' },
    cancelled:   { label: 'Cancelled',   color: '#D83F54', bg: '#FFF0F2', icon: 'close-octagon-outline' },
    rejected:    { label: 'Declined',    color: '#D83F54', bg: '#FFF0F2', icon: 'close-circle-outline' },
};

export const sbMeta = (status) => SB_STATUS_META[status] || SB_STATUS_META.requested;

export const SB_CANCELLABLE = ['requested', 'accepted'];
