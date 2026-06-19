import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserStore = create((set) => ({
    user: null,

    setUser: (user) => {
        AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },

    clearUser: () => {
        AsyncStorage.removeItem('user');
        set({ user: null });
    },

    restoreUser: async () => {
        try {
            const raw = await AsyncStorage.getItem('user');
            if (raw) set({ user: JSON.parse(raw) });
        } catch {
            // Corrupt payload — drop it so the app can still launch
            AsyncStorage.removeItem('user');
            set({ user: null });
        }
    },
}));

export default useUserStore;
