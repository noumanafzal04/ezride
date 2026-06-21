import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';
import config from '../config';
import useAuthStore from '../store/authStore';
import useConfigStore from '../store/configStore';

// laravel-echo expects a global Pusher client (Reverb speaks the Pusher protocol)
global.Pusher = Pusher;

let echoInstance = null;
let echoToken = null;
let echoHost = null;

// Lazily create a single Echo connection authenticated with the current token.
// Recreates itself when the token OR the server URL changes (login/logout /
// IP change) so it always points at the right host with a fresh token.
export const getEcho = () => {
    const token = useAuthStore.getState().token;
    const baseUrl = useConfigStore.getState().baseUrl;
    const host = baseUrl.replace(/^https?:\/\//, '').split(/[:/]/)[0];

    if (echoInstance && echoToken === token && echoHost === host) return echoInstance;
    if (echoInstance) {
        try { echoInstance.disconnect(); } catch (e) { /* noop */ }
    }
    echoToken = token;
    echoHost = host;

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: config.REVERB_KEY,
        wsHost: host,
        wsPort: config.REVERB_PORT,
        wssPort: config.REVERB_PORT,
        forceTLS: config.REVERB_SCHEME === 'wss',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${baseUrl}broadcasting/auth`,
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
