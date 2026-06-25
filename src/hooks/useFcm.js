import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { getApp } from '@react-native-firebase/app';
import {
    getMessaging, onMessage, onTokenRefresh, onNotificationOpenedApp, getInitialNotification,
} from '@react-native-firebase/messaging';
import useUserStore from '../store/userStore';
import { registerDeviceToken } from '../services/fcm';
import { navigate } from '../navigation/navigationRef';

// Where a notification tap should land, by notification `type`.
const routeFor = (data = {}) => {
    const t = data.type || '';
    if (t === 'chat_message' || t.startsWith('chat')) {
        const id = Number(data.conversation_id);
        return id ? ['ChatDetail', { conversationId: id }] : ['Messages'];
    }
    if (t.startsWith('service_booking')) return ['MyServiceRequests'];
    if (t.startsWith('listing')) return ['Marketplace'];
    if (t.startsWith('inspection')) return ['MyInspections'];
    if (t.startsWith('booking') || t.startsWith('ride')) return ['Notifications'];
    return ['Notifications'];
};

// Registers the device token + wires foreground/tap handlers for the session.
export const useFcm = () => {
    const qc = useQueryClient();
    const userId = useUserStore((s) => s.user?.id);
    const ran = useRef(false);

    useEffect(() => {
        if (!userId) return undefined;
        let m;
        try { m = getMessaging(getApp()); } catch { return undefined; }

        if (!ran.current) { ran.current = true; registerDeviceToken(); }

        // Token rotates → re-register.
        const offRefresh = onTokenRefresh(m, () => registerDeviceToken());

        // Foreground push → toast + refresh badges (no OS banner while app is open).
        const offMessage = onMessage(m, (remote) => {
            const n = remote?.notification;
            const data = remote?.data || {};
            if (n?.title || n?.body) {
                Toast.show({ type: 'info', text1: n.title || 'Notification', text2: n.body || undefined, visibilityTime: 4000 });
            }
            if (data.type === 'chat_message' || String(data.type || '').startsWith('chat')) {
                // Chat push → refresh the unread badge, inbox, and the open thread.
                qc.invalidateQueries({ queryKey: ['chat-unread'] });
                qc.invalidateQueries({ queryKey: ['conversations'] });
                if (data.conversation_id) {
                    qc.invalidateQueries({ queryKey: ['messages', Number(data.conversation_id)] });
                }
            } else {
                qc.invalidateQueries({ queryKey: ['notifications'] });
                qc.invalidateQueries({ queryKey: ['notifications-unread'] });
            }
        });

        // Tap while backgrounded → route to the relevant screen.
        const offOpened = onNotificationOpenedApp(m, (remote) => {
            navigate(...routeFor(remote?.data));
        });

        // Tap that cold-started the app.
        getInitialNotification(m).then((remote) => {
            if (remote) setTimeout(() => navigate(...routeFor(remote?.data)), 600);
        }).catch(() => {});

        return () => { offRefresh?.(); offMessage?.(); offOpened?.(); };
    }, [userId, qc]);
};

export default useFcm;
