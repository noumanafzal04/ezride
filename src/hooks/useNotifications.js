import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notificationService';

// Infinite list of the current user's notifications (paginated, scroll to load more)
export const useNotifications = (options = {}) =>
    useInfiniteQuery({
        queryKey: ['notifications'],
        queryFn: ({ pageParam = 1 }) =>
            notificationService.list({ page: pageParam, limit: 20 }).then(r => r.data?.data || {}),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const m = lastPage?.meta;
            return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
        },
        staleTime: 0,
        ...options,
    });

// Unread count (drives the tab badge)
export const useUnreadCount = (options = {}) =>
    useQuery({
        queryKey: ['notifications-unread'],
        queryFn: () => notificationService.unreadCount().then(r => r.data?.data?.unread_count || 0),
        staleTime: 0,
        ...options,
    });

const useInvalidateNotifications = () => {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ['notifications'] });
        qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    };
};

export const useMarkNotificationRead = () => {
    const invalidate = useInvalidateNotifications();
    return useMutation({
        mutationFn: (id) => notificationService.markRead(id),
        onSuccess: invalidate,
    });
};

export const useMarkAllNotificationsRead = () => {
    const invalidate = useInvalidateNotifications();
    return useMutation({
        mutationFn: () => notificationService.markAllRead(),
        onSuccess: invalidate,
    });
};

export default useNotifications;
