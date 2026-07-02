import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Rider: their own bookings (optional status filter)
export const useMyBookings = (status, options = {}) =>
    useQuery({
        queryKey: ['my-bookings', status || 'all'],
        queryFn: () =>
            rideService.getMyBookings(status ? { status } : {})
                .then(r => r.data?.data?.bookings || []),
        staleTime: 15 * 1000,
        ...options,
    });

// Rider: cancel their own booking
export const useCancelBooking = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => rideService.cancelBooking(id),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: ['my-bookings'] });
            qc.invalidateQueries({ queryKey: ['available-rides'] });
            options.onSuccess?.(...args);
        },
        onError: options.onError,
    });
};

// Rider: confirm the ride is complete (after the driver has started it).
export const useCompleteBooking = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => rideService.completeBooking(id),
        onSuccess: (...args) => {
            qc.invalidateQueries({ queryKey: ['my-bookings'] });
            options.onSuccess?.(...args);
        },
        onError: options.onError,
    });
};

export default useMyBookings;
