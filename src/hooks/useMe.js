import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import useUserStore from '../store/userStore';

// Fetches the current user (/auth/me) and keeps the store in sync.
// Returns the full user: profile + (driver_profile + vehicles for drivers).
export const useMe = (options = {}) => {
    const setUser = useUserStore(s => s.setUser);
    return useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await authService.me();
            const user = res.data?.data;
            if (user) setUser(user);
            return user;
        },
        staleTime: 60 * 1000,
        ...options,
    });
};

export default useMe;
