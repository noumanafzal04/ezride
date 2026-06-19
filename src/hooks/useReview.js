import { useMutation, useQueryClient } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Refresh every list a completion/review can affect (rider + driver views)
const useInvalidateBookings = () => {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ['my-bookings'] });
        qc.invalidateQueries({ queryKey: ['driver-bookings'] });
        qc.invalidateQueries({ queryKey: ['driver-ride-posts'] });
    };
};

export const useCompleteBooking = (options = {}) => {
    const invalidate = useInvalidateBookings();
    return useMutation({
        mutationFn: (id) => rideService.completeBooking(id),
        onSuccess: (...a) => { invalidate(); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useRateBooking = (options = {}) => {
    const invalidate = useInvalidateBookings();
    return useMutation({
        mutationFn: ({ id, rating, review }) => rideService.rateBooking(id, { rating, review }),
        onSuccess: (...a) => { invalidate(); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};
