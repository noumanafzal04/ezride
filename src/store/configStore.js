import { create } from 'zustand';
import config from '../config';

// Extract the host (ip[:port]) from a base URL.
export const hostFromBaseUrl = (url) =>
    (url || '').replace(/^https?:\/\//i, '').split('/')[0];

// The API base URL comes straight from config.js — no runtime override and no
// local storage. To change the server, edit BASE_URL in src/config.js and reload.
const useConfigStore = create(() => ({
    baseUrl: config.BASE_URL,

    // Kept so existing callers (Splash) don't break — nothing to restore.
    restoreConfig: async () => {},
}));

export default useConfigStore;
