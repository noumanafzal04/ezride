import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import rideService from '../services/rideService';

const nextPage = (lastPage) => {
    const m = lastPage?.meta;
    return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
};

// Rider: full detail of a single ride post by id
export const useRideDetail = (id) =>
    useQuery({
        queryKey: ['ride-detail', id],
        queryFn: () => rideService.getRideDetail(id).then(r => r.data?.data),
        enabled: !!id,
        staleTime: 30 * 1000,
    });

// Driver aggregate stats (rating, total trips, review count)
export const useDriverSummary = (driverId) =>
    useQuery({
        queryKey: ['driver-summary', driverId],
        queryFn: () => rideService.getDriverSummary(driverId).then(r => r.data?.data),
        enabled: !!driverId,
        staleTime: 60 * 1000,
    });

// Reviews received by the driver (infinite scroll)
export const useDriverReviews = (driverId, enabled = true) =>
    useInfiniteQuery({
        queryKey: ['driver-reviews', driverId],
        queryFn: ({ pageParam = 1 }) =>
            rideService.getDriverReviews(driverId, { page: pageParam, limit: 15 }).then(r => r.data?.data || {}),
        initialPageParam: 1,
        getNextPageParam: nextPage,
        enabled: !!driverId && enabled,
        staleTime: 60 * 1000,
    });

// Driver's completed trips (infinite scroll)
export const useDriverTrips = (driverId, enabled = true) =>
    useInfiniteQuery({
        queryKey: ['driver-trips', driverId],
        queryFn: ({ pageParam = 1 }) =>
            rideService.getDriverTrips(driverId, { page: pageParam, limit: 15 }).then(r => r.data?.data || {}),
        initialPageParam: 1,
        getNextPageParam: nextPage,
        enabled: !!driverId && enabled,
        staleTime: 60 * 1000,
    });

export default useRideDetail;
