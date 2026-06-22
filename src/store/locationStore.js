import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'user_location';

// The user's current location used as a soft ranking signal across modules.
// `city` + `coords` are the CONFIRMED location. `pending` holds a freshly
// detected city that differs from the confirmed one, awaiting Yes/No.
const useLocationStore = create((set, get) => ({
    coords: null,    // { lat, lng }
    city: null,      // { id, name }
    pending: null,   // { coords, city } — drives the "city changed?" prompt
    hydrated: false,

    restore: async () => {
        try {
            const raw = await AsyncStorage.getItem(KEY);
            if (raw) {
                const s = JSON.parse(raw);
                set({ coords: s.coords || null, city: s.city || null });
            }
        } catch {
            // ignore corrupt payload
        }
        set({ hydrated: true });
    },

    _persist: () => {
        const { coords, city } = get();
        AsyncStorage.setItem(KEY, JSON.stringify({ coords, city }));
    },

    // Confirmed location (first detect, manual pick, or accepted prompt).
    setLocation: (coords, city) => { set({ coords, city, pending: null }); get()._persist(); },

    // Same city — just refresh the coordinates silently.
    refreshCoords: (coords) => { set({ coords }); get()._persist(); },

    // A different city was detected — ask the user before switching.
    propose: (coords, city) => set({ pending: { coords, city } }),
    confirmPending: () => {
        const p = get().pending;
        if (p) { set({ coords: p.coords, city: p.city, pending: null }); get()._persist(); }
    },
    dismissPending: () => set({ pending: null }),
}));

export default useLocationStore;
