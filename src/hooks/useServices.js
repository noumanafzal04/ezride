import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import serviceService from '../services/serviceService';

// Service categories catalog (for browse + provider registration).
export const useServiceCategories = (options = {}) =>
    useQuery({
        queryKey: ['service-categories'],
        queryFn: () => serviceService.categories().then(r => r.data?.data?.categories || []),
        staleTime: 60 * 60 * 1000,
        ...options,
    });

// The current user's provider profile (null if not registered).
export const useServiceProviderMe = (options = {}) =>
    useQuery({
        queryKey: ['service-provider-me'],
        queryFn: () => serviceService.providerMe().then(r => r.data?.data?.provider ?? null),
        staleTime: 30 * 1000,
        ...options,
    });

// Browse approved providers by category (+ optional city), infinite scroll.
export const useServiceProviders = (categoryId, cityId, options = {}) =>
    useInfiniteQuery({
        queryKey: ['service-providers', categoryId || 'all', cityId || 'all'],
        queryFn: ({ pageParam = 1 }) => serviceService.providers({
            category_id: categoryId || undefined,
            city_id: cityId || undefined,
            page: pageParam,
        }).then(r => r.data?.data || {}),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const m = lastPage?.meta;
            return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
        },
        staleTime: 30 * 1000,
        ...options,
    });

export const useServiceProvider = (id, options = {}) =>
    useQuery({
        queryKey: ['service-provider', id],
        queryFn: () => serviceService.provider(id).then(r => r.data?.data?.provider),
        enabled: !!id,
        ...options,
    });

export const useRegisterServiceProvider = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => serviceService.registerProvider(payload).then(r => r.data?.data?.provider),
        onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['service-provider-me'] }); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

// ── Service bookings ──
const bookingPages = {
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
        const m = lastPage?.meta;
        return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
    },
};

export const useMyServiceBookings = (options = {}) =>
    useInfiniteQuery({
        queryKey: ['service-bookings-mine'],
        queryFn: ({ pageParam = 1 }) => serviceService.myBookings({ page: pageParam }).then(r => r.data?.data || {}),
        staleTime: 20 * 1000,
        ...bookingPages,
        ...options,
    });

export const useProviderServiceBookings = (status, options = {}) =>
    useInfiniteQuery({
        queryKey: ['service-bookings-provider', status || 'all'],
        queryFn: ({ pageParam = 1 }) => serviceService.providerBookings({ status: status || undefined, page: pageParam }).then(r => r.data?.data || {}),
        staleTime: 15 * 1000,
        ...bookingPages,
        ...options,
    });

const invalidateBookings = (qc) => {
    qc.invalidateQueries({ queryKey: ['service-bookings-mine'] });
    qc.invalidateQueries({ queryKey: ['service-bookings-provider'] });
};

export const useCreateServiceBooking = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ providerId, payload }) => serviceService.createBooking(providerId, payload),
        onSuccess: (...a) => { invalidateBookings(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useCancelServiceBooking = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => serviceService.cancelBooking(id),
        onSuccess: (...a) => { invalidateBookings(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useRateServiceBooking = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => serviceService.rateBooking(id, payload),
        onSuccess: (...a) => { invalidateBookings(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

// action = accept | reject | start | complete
export const useServiceBookingAction = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, action }) => serviceService.bookingAction(id, action),
        onSuccess: (...a) => { invalidateBookings(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};
