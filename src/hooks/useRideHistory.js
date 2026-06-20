import { useInfiniteQuery } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Completed rides for the current role, with infinite scroll.
export const useRideHistory = (isDriver, options = {}) =>
    useInfiniteQuery({
        queryKey: ['ride-history', isDriver ? 'driver' : 'rider'],
        queryFn: ({ pageParam = 1 }) => {
            const params = { status: 'completed', page: pageParam, limit: 15 };
            const req = isDriver
                ? rideService.getDriverBookings(params)
                : rideService.getMyBookings(params);
            return req.then(r => r.data?.data || {});
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const m = lastPage?.meta;
            return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
        },
        staleTime: 30 * 1000,
        ...options,
    });

export default useRideHistory;
