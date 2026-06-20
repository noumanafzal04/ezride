import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Driver's own posted rides
export const useRidePosts = () =>
    useQuery({
        queryKey: ['driver-ride-posts'],
        queryFn: () => rideService.getRidePosts().then(r => r.data?.data),
        staleTime: 60 * 1000,
    });

// Driver ride trip lifecycle: start → end (acts on the ride post, settles all bookings)
export const useRideLifecycle = (options = {}) => {
    const qc = useQueryClient();
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['driver-ride-posts'] });
        qc.invalidateQueries({ queryKey: ['driver-bookings'] });
        qc.invalidateQueries({ queryKey: ['my-bookings'] });
    };

    const start = useMutation({
        mutationFn: (ridePostId) => rideService.startRide(ridePostId),
        onSuccess: (...a) => { invalidate(); options.onStartSuccess?.(...a); },
        onError: options.onError,
    });
    const end = useMutation({
        mutationFn: (ridePostId) => rideService.endRide(ridePostId),
        onSuccess: (...a) => { invalidate(); options.onEndSuccess?.(...a); },
        onError: options.onError,
    });

    return { start, end };
};

// Cancel (delete) a posted ride
export const useCancelRidePost = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => rideService.cancelRidePost(id),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: ['driver-ride-posts'] });
            qc.invalidateQueries({ queryKey: ['driver-bookings'] });
            options.onSuccess?.(...args);
        },
        onError: options.onError,
    });
};

export default useRidePosts;
