import { useQuery, useMutation } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Rider: browse available rides (optional filters: from_city_id, to_city_id, date)
export const useAvailableRides = (filters = {}) =>
    useQuery({
        queryKey: ['available-rides', filters],
        queryFn: () => rideService.getAvailableRides(filters).then(r => r.data?.data?.ride_posts || []),
        staleTime: 0,
        refetchOnMount: 'always',   // opening the screen always shows the latest posts
    });

// Rider: book seats on a ride post
export const useBookSeat = (options = {}) =>
    useMutation({
        mutationFn: ({ ridePostId, seats, note }) =>
            rideService.bookSeat(ridePostId, { seats, note }),
        ...options,
    });

export default useAvailableRides;
