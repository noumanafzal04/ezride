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
    const key = ['messages', conversationId];
    return useMutation({
        mutationFn: (body) => chatService.send(conversationId, body).then(r => r.data?.data),

        // Optimistic: drop the bubble into the thread instantly with a "sending"
        // clock, so it feels immediate even on a slow network.
        onMutate: async (body) => {
            await qc.cancelQueries({ queryKey: key });
            const previous = qc.getQueryData(key);
            const tempId = `tmp-${Date.now()}`;
            const optimistic = {
                id: tempId, body, is_mine: true,
                created_at: new Date().toISOString(), _status: 'sending',
            };
            qc.setQueryData(key, (old) => {
                if (!old) return { pages: [{ messages: [optimistic], meta: {} }], pageParams: [1] };
                const pages = [...old.pages];
                pages[0] = { ...pages[0], messages: [optimistic, ...(pages[0].messages || [])] };
                return { ...old, pages };
            });
            return { previous, tempId };
        },

        // Swap the temp bubble for the saved message → its tick turns "sent".
        onSuccess: (real, body, ctx) => {
            qc.setQueryData(key, (old) => {
                if (!old) return old;
                const pages = old.pages.map(pg => ({
                    ...pg,
                    messages: (pg.messages || []).map(m =>
                        m.id === ctx?.tempId ? { ...real, is_mine: true } : m),
                }));
                return { ...old, pages };
            });
            qc.invalidateQueries({ queryKey: ['conversations'] });
            qc.invalidateQueries({ queryKey: ['chat-unread'] });
            options.onSuccess?.(real, body, ctx);
        },

        // Roll back the optimistic bubble; the screen restores the draft + toasts.
        onError: (err, body, ctx) => {
            if (ctx?.previous !== undefined) qc.setQueryData(key, ctx.previous);
            options.onError?.(err, body, ctx);
        },
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
