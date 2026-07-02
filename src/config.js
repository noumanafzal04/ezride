// ── Environment switch ───────────────────────────────────────────────
// Flip ENV to 'dev' for local testing, 'prod' for the live server.
//  - Android emulator → host machine is 10.0.2.2 (NOT localhost).
//  - Physical device on the same Wi‑Fi → set DEV host to your Mac's LAN IP
//    (e.g. 192.168.x.x) instead of 10.0.2.2.
const ENV = 'dev'; // 'dev' | 'prod'

const ENVS = {
    dev: {
        BASE_URL: 'http://165.245.176.112/api/v1/', // local Laravel on LAN (php artisan serve --host=0.0.0.0)
        REVERB_HOST: '10.12.199.241',
        REVERB_SCHEME: 'ws',
    },
    prod: {
        BASE_URL: 'http://165.245.176.112/api/v1/', // DigitalOcean
        REVERB_HOST: '165.245.176.112',
        REVERB_SCHEME: 'ws',
    },
};
const active = ENVS[ENV];

const config = {
    ENV,
    BASE_URL: active.BASE_URL,

    CONFIG_VERSION: 4,

    REVERB_KEY: '6yzfwgwpjsql1finaqaq',
    REVERB_HOST: active.REVERB_HOST,
    REVERB_PORT: 8090,
    REVERB_SCHEME: active.REVERB_SCHEME,
};

export default config;
