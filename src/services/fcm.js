import { Platform, PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
    getMessaging, getToken, deleteToken, requestPermission, AuthorizationStatus,
} from '@react-native-firebase/messaging';
import api from './api';

const msg = () => getMessaging(getApp());

// Ask the OS for notification permission (Android 13+ runtime + iOS prompt).
export const requestPushPermission = async () => {
    try {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
                return res === PermissionsAndroid.RESULTS.GRANTED;
            }
            return true;
        }
        const status = await requestPermission(msg());
        return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
    } catch {
        return false;
    }
};

let lastToken = null;

export const getFcmToken = async () => {
    try { return await getToken(msg()); } catch { return null; }
};

// Register this device's token with the backend (idempotent server-side).
export const registerDeviceToken = async () => {
    const ok = await requestPushPermission();
    if (!ok) return null;
    const token = await getFcmToken();
    if (!token) return null;
    lastToken = token;
    try {
        await api.post('/device-tokens', { token, platform: Platform.OS });
    } catch {
        // backend not ready / offline — token re-registers next launch
    }
    return token;
};

// Remove this device's token (call on logout). Fires the backend delete
// synchronously with the cached token so it goes out before auth is cleared.
export const unregisterDeviceToken = () => {
    if (lastToken) api.delete('/device-tokens', { data: { token: lastToken } }).catch(() => {});
    lastToken = null;
    try { deleteToken(msg()); } catch { /* noop */ }
};

export { msg as messagingInstance };
