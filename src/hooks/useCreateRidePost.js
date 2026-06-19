import { useMutation, useQueryClient } from '@tanstack/react-query';
import rideService from '../services/rideService';

export const useCreateRidePost = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => rideService.createRidePost(payload),
        ...options,
        onSuccess: (...args) => {
            // refresh the driver's posts (peek/active) and rider browse
            qc.invalidateQueries({ queryKey: ['driver-ride-posts'] });
            qc.invalidateQueries({ queryKey: ['available-rides'] });
            options.onSuccess?.(...args);
        },
    });
};

export default useCreateRidePost;
