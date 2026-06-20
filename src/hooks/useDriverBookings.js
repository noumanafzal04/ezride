import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Driver: bookings received on their posts.
// filters: { ride_post_id?, status? } — scope to one ride and/or a status.
export const useDriverBookings = (filters = {}, options = {}) =>
    useQuery({
        queryKey: ['driver-bookings', filters],
        queryFn: () =>
            rideService.getDriverBookings(filters)
                .then(r => r.data?.data?.bookings || []),
        staleTime: 15 * 1000,
        ...options,
    });

// Driver: accept / reject a booking, refreshing all booking lists after
export const useBookingActions = () => {
    const qc = useQueryClient();
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['driver-bookings'] });
        qc.invalidateQueries({ queryKey: ['driver-ride-posts'] }); // seats change on accept
    };

    const accept = useMutation({
        mutationFn: (id) => rideService.acceptBooking(id),
        onSuccess: invalidate,
    });
    const reject = useMutation({
        mutationFn: (id) => rideService.rejectBooking(id),
        onSuccess: invalidate,
    });

    return { accept, reject };
};

export default useDriverBookings;
