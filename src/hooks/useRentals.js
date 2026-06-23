import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rentalService from '../services/rentalService';
import useLocationStore from '../store/locationStore';

const pages = {
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
        const m = lastPage?.meta;
        return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
    },
};

// Browse active rentals, location-ranked when no city filter.
export const useRentals = (filters = {}, options = {}) => {
    const coords = useLocationStore((s) => s.coords);
    const useNear = !!coords && !filters.city_id;
    const near = useNear ? { near_lat: coords.lat, near_lng: coords.lng } : {};
    const nearKey = useNear ? `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}` : 'no-loc';
    return useInfiniteQuery({
        queryKey: ['rentals', filters, nearKey],
        queryFn: ({ pageParam = 1 }) =>
            rentalService.list({ ...filters, ...near, page: pageParam }).then(r => r.data?.data || {}),
        staleTime: 30 * 1000,
        ...pages,
        ...options,
    });
};

export const useRental = (id, options = {}) =>
    useQuery({
        queryKey: ['rental', id],
        queryFn: () => rentalService.detail(id).then(r => r.data?.data?.rental),
        enabled: !!id,
        ...options,
    });

export const useMyRentals = (options = {}) =>
    useInfiniteQuery({
        queryKey: ['rentals-mine'],
        queryFn: ({ pageParam = 1 }) => rentalService.mine({ page: pageParam }).then(r => r.data?.data || {}),
        ...pages,
        ...options,
    });

export const useMyRentalBookings = (options = {}) =>
    useInfiniteQuery({
        queryKey: ['rental-bookings-mine'],
        queryFn: ({ pageParam = 1 }) => rentalService.myBookings({ page: pageParam }).then(r => r.data?.data || {}),
        ...pages,
        ...options,
    });

// Bookings on the user's own listed cars (owner side).
export const useOwnerRentalBookings = (status, options = {}) =>
    useInfiniteQuery({
        queryKey: ['rental-bookings-owner', status || 'all'],
        queryFn: ({ pageParam = 1 }) =>
            rentalService.ownerBookings({ status: status || undefined, page: pageParam }).then(r => r.data?.data || {}),
        ...pages,
        ...options,
    });

const invalidate = (qc) => {
    qc.invalidateQueries({ queryKey: ['rentals'] });
    qc.invalidateQueries({ queryKey: ['rentals-mine'] });
    qc.invalidateQueries({ queryKey: ['rental-bookings-mine'] });
    qc.invalidateQueries({ queryKey: ['rental-bookings-owner'] });
};

export const useCreateRental = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (formData) => rentalService.create(formData).then(r => r.data?.data?.rental),
        onSuccess: (...a) => { invalidate(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useBookRental = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => rentalService.book(id, payload),
        onSuccess: (...a) => { invalidate(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useCancelRentalBooking = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => rentalService.cancelBooking(id),
        onSuccess: (...a) => { invalidate(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

// Owner transitions: accept | reject | start | complete
export const useRentalBookingAction = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, action }) => rentalService.bookingAction(id, action),
        onSuccess: (...a) => { invalidate(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useDeleteRental = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => rentalService.remove(id),
        onSuccess: (...a) => { invalidate(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};
