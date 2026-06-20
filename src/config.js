const config = {
    BASE_URL: 'http://192.168.18.19:8000/api/v1/', // iOS simulator
    // BASE_URL: 'http://10.0.2.2:8000/api/v1/',     // Android emulator ✅

    // Reverb (WebSockets). Host is derived from BASE_URL; keep key/port in sync
    // with the backend .env (REVERB_APP_KEY / REVERB_PORT). Use 'wss' in production.
    REVERB_KEY: '6yzfwgwpjsql1finaqaq',
    REVERB_PORT: 8090,
    REVERB_SCHEME: 'ws',
};

export default config;
