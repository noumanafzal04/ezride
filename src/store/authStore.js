import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set) => ({
    token: null,
    isFullyAuthenticated: false,

    setToken: (token) => {
        if (token) {
            AsyncStorage.setItem('token', token);
        } else {
            AsyncStorage.removeItem('token');
        }
        set({ token });
    },

    setFullyAuthenticated: () => {
        AsyncStorage.setItem('is_authenticated', 'true');
        set({ isFullyAuthenticated: true });
    },

    clearAuth: () => {
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('is_authenticated');
        set({ token: null, isFullyAuthenticated: false });
    },

    restoreAuth: async () => {
        const token  = await AsyncStorage.getItem('token');
        const isAuth = await AsyncStorage.getItem('is_authenticated');
        set({
            token: token || null,
            isFullyAuthenticated: isAuth === 'true',
        });
    },
}));

export default useAuthStore;
