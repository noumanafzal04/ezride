import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import rideService from '../services/rideService';

const PAGE_SIZE = 15;

// Rider: browse available rides with infinite scroll (filters: from_city_id, to_city_id, date).
// Loads one page at a time and fetches the next on scroll — scales to any volume.
export const useAvailableRides = (filters = {}, options = {}) =>
    useInfiniteQuery({
        queryKey: ['available-rides', filters],
        queryFn: ({ pageParam = 1 }) =>
            rideService
                .getAvailableRides({ ...filters, page: pageParam, limit: PAGE_SIZE })
                .then(r => r.data?.data || {}),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const m = lastPage?.meta;
            return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
        },
        // Reverb keeps the list live while on screen, so we don't refetch on every
        // navigation — cached for 60s (pull-to-refresh + live events keep it fresh).
        staleTime: 60 * 1000,
        ...options,
    });

// Rider: poll for newly posted rides (drives the "new rides available" banner).
// Cheap COUNT endpoint; polls every 25s only while the screen is focused and
// the rider already has rides loaded (afterId > 0), so it never spams the API.
export const useNewRidesCount = (filters = {}, afterId = 0, enabled = true) =>
    useQuery({
        queryKey: ['new-rides-count', filters, afterId],
        queryFn: () =>
            rideService
                .getNewRidesCount({ ...filters, after_id: afterId })
                .then(r => r.data?.data?.new_count || 0),
        enabled: enabled && afterId > 0,
        refetchInterval: enabled ? 25000 : false,
        refetchIntervalInBackground: false,
        staleTime: 0,
    });

// Rider: book seats on a ride post
export const useBookSeat = (options = {}) =>
    useMutation({
        mutationFn: ({ ridePostId, seats, note }) =>
            rideService.bookSeat(ridePostId, { seats, note }),
        ...options,
    });

export default useAvailableRides;
