import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcho } from '../services/echo';
import useUserStore from '../store/userStore';

// Tracks whether the Reverb socket is connected. Screens poll ONLY while this is
// false, so live updates come over the socket when healthy and fall back to
// polling if it drops — the app never silently goes dark.
export const useRealtimeConnected = () => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let conn;
        const onState = (states) => setConnected(states?.current === 'connected');
        try {
            conn = getEcho().connector?.pusher?.connection;
            if (!conn) return undefined;
            setConnected(conn.state === 'connected');
            conn.bind('state_change', onState);
        } catch (e) {
            return undefined;
        }
        return () => { try { conn?.unbind('state_change', onState); } catch (e) { /* noop */ } };
    }, []);

    return connected;
};

// Subscribe to the current user's PRIVATE channel. Any notification the backend
// pushes (booking accepted/rejected, ride started/ended, ride alert, …) arrives
// live and we invalidate the affected queries → the whole app updates instantly,
// no polling. Mounted once for the authenticated session.
export const useUserRealtime = () => {
    const qc = useQueryClient();
    const userId = useUserStore(s => s.user?.id);

    useEffect(() => {
        if (!userId) return undefined;

        let channel;
        try {
            channel = getEcho().private(`user.${userId}`);
            channel.listen('.notification.created', () => {
                // Bump the badge instantly (no refetch round-trip), then reconcile.
                qc.setQueryData(['notifications-unread'], (n) => (Number(n) || 0) + 1);
                qc.invalidateQueries({ queryKey: ['notifications'] });
                qc.invalidateQueries({ queryKey: ['notifications-unread'] });
                qc.invalidateQueries({ queryKey: ['my-bookings'] });
                qc.invalidateQueries({ queryKey: ['driver-bookings'] });
                qc.invalidateQueries({ queryKey: ['driver-ride-posts'] });
            });
            // New chat message anywhere → bump the Messages badge optimistically
            // (no per-message refetch). The count reconciles on read/login; the
            // inbox refetches only while it's actually open.
            channel.listen('.message.sent', () => {
                qc.setQueryData(['chat-unread'], (n) => (Number(n) || 0) + 1);
                qc.invalidateQueries({ queryKey: ['conversations'] });
            });
        } catch (e) {
            // Reverb not reachable yet — app still works, just no live updates.
        }

        return () => {
            try { getEcho().leave(`user.${userId}`); } catch (e) { /* noop */ }
        };
    }, [userId, qc]);
};

// Subscribe to ONE conversation's private channel while the thread is open.
// Fires `onMessage(payload)` for each live message. Re-subscribes when the id
// changes; uses a ref so the callback can change without re-binding.
export const useConversationRealtime = (conversationId, onMessage) => {
    const cbRef = useRef(onMessage);
    useEffect(() => { cbRef.current = onMessage; }, [onMessage]);

    useEffect(() => {
        if (!conversationId) return undefined;

        try {
            const channel = getEcho().private(`conversation.${conversationId}`);
            channel.listen('.message.sent', (payload) => cbRef.current?.(payload));
        } catch (e) {
            /* noop — no live updates until Reverb is reachable */
        }

        return () => {
            try { getEcho().leave(`conversation.${conversationId}`); } catch (e) { /* noop */ }
        };
    }, [conversationId]);
};

// Subscribe to the public "rides" channel. Fires `onNewPost(payload)` whenever a
// driver posts a ride (the screen decides if it matches the current filter).
// Subscribes ONCE and calls the latest callback via a ref, so it never re-binds
// (re-binding on every render was dropping the subscription → no live updates).
export const useRidesRealtime = (onNewPost) => {
    const cbRef = useRef(onNewPost);
    useEffect(() => { cbRef.current = onNewPost; }, [onNewPost]);

    useEffect(() => {
        let channel;
        try {
            channel = getEcho().channel('rides');
            channel.listen('.ride.created', (payload) => cbRef.current?.(payload));
        } catch (e) {
            /* noop — no live updates until Reverb is reachable */
        }

        return () => {
            try { getEcho().leave('rides'); } catch (e) { /* noop */ }
        };
    }, []);
};
