import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import chatService from '../services/chatService';

const pageParams = {
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
        const m = lastPage?.meta;
        return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
    },
};

// Inbox — conversations newest-activity first.
export const useConversations = (options = {}) =>
    useInfiniteQuery({
        queryKey: ['conversations'],
        queryFn: ({ pageParam = 1 }) => chatService.inbox({ page: pageParam }).then(r => r.data?.data || {}),
        staleTime: 15 * 1000,
        ...pageParams,
        ...options,
    });

// Footer badge — total unread across conversations.
export const useChatUnread = (options = {}) =>
    useQuery({
        queryKey: ['chat-unread'],
        queryFn: () => chatService.unreadCount().then(r => r.data?.data?.unread_count || 0),
        staleTime: 10 * 1000,
        ...options,
    });

// Thread messages (newest first; the screen inverts for display).
export const useMessages = (conversationId, options = {}) =>
    useInfiniteQuery({
        queryKey: ['messages', conversationId],
        queryFn: ({ pageParam = 1 }) => chatService.messages(conversationId, { page: pageParam }).then(r => r.data?.data || {}),
        enabled: !!conversationId,
        staleTime: 5 * 1000,
        ...pageParams,
        ...options,
    });

// Resolve a conversation from a booking id (entry from ride/booking screens).
export const useConversationForBooking = (bookingId, options = {}) =>
    useQuery({
        queryKey: ['conversation-by-booking', bookingId],
        queryFn: () => chatService.byBooking(bookingId).then(r => r.data?.data),
        enabled: !!bookingId,
        retry: false,
        ...options,
    });

// Resolve a conversation from a service booking id.
export const useConversationForServiceBooking = (serviceBookingId, options = {}) =>
    useQuery({
        queryKey: ['conversation-by-service-booking', serviceBookingId],
        queryFn: () => chatService.byServiceBooking(serviceBookingId).then(r => r.data?.data),
        enabled: !!serviceBookingId,
        retry: false,
        ...options,
    });

export const useSendMessage = (conversationId, options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body) => chatService.send(conversationId, body).then(r => r.data?.data),
        onSuccess: (...a) => {
            qc.invalidateQueries({ queryKey: ['messages', conversationId] });
            qc.invalidateQueries({ queryKey: ['conversations'] });
            options.onSuccess?.(...a);
        },
        onError: options.onError,
    });
};

export const useMarkConversationRead = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (conversationId) => chatService.markRead(conversationId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['conversations'] });
            qc.invalidateQueries({ queryKey: ['chat-unread'] });
        },
    });
};
