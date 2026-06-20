import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import config from '../config';
import useAuthStore from '../store/authStore';

// laravel-echo expects a global Pusher client (Reverb speaks the Pusher protocol)
global.Pusher = Pusher;

// Host is taken from BASE_URL so it always matches your server.
const host = config.BASE_URL.replace(/^https?:\/\//, '').split(/[:/]/)[0];

let echoInstance = null;
let echoToken = null;

// Lazily create a single Echo connection authenticated with the current token.
// Recreates itself when the token changes (login/logout) so private-channel
// auth always uses a fresh token.
export const getEcho = () => {
    const token = useAuthStore.getState().token;

    if (echoInstance && echoToken === token) return echoInstance;
    if (echoInstance) {
        try { echoInstance.disconnect(); } catch (e) { /* noop */ }
    }
    echoToken = token;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: config.REVERB_KEY,
        wsHost: host,
        wsPort: config.REVERB_PORT,
        wssPort: config.REVERB_PORT,
        forceTLS: config.REVERB_SCHEME === 'wss',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${config.BASE_URL}broadcasting/auth`,
        auth: { headers: { Authorization: token ? `Bearer ${token}` : '' } },
    });

    return echoInstance;
};

// Tear down on logout / token change so private channels re-auth with a fresh token.
export const resetEcho = () => {
    if (echoInstance) {
        try { echoInstance.disconnect(); } catch (e) { /* noop */ }
        echoInstance = null;
    }
};
