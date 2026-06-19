import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Driver's own posted rides
export const useRidePosts = () =>
    useQuery({
        queryKey: ['driver-ride-posts'],
        queryFn: () => rideService.getRidePosts().then(r => r.data?.data),
        staleTime: 60 * 1000,
    });

// Cancel (delete) a posted ride
export const useCancelRidePost = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => rideService.cancelRidePost(id),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: ['driver-ride-posts'] });
            options.onSuccess?.(...args);
        },
        onError: options.onError,
    });
};

export default useRidePosts;
