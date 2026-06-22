import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import marketplaceService from '../services/marketplaceService';
import useLocationStore from '../store/locationStore';

const pages = {
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
        const m = lastPage?.meta;
        return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
    },
};

// Browse active listings. With no city filter, ranked by the user's location.
export const useCarListings = (filters = {}, options = {}) => {
    const coords = useLocationStore((s) => s.coords);
    const useNear = !!coords && !filters.city_id;
    const near = useNear ? { near_lat: coords.lat, near_lng: coords.lng } : {};
    const nearKey = useNear ? `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}` : 'no-loc';
    return useInfiniteQuery({
        queryKey: ['car-listings', filters, nearKey],
        queryFn: ({ pageParam = 1 }) =>
            marketplaceService.list({ ...filters, ...near, page: pageParam }).then(r => r.data?.data || {}),
        staleTime: 30 * 1000,
        ...pages,
        ...options,
    });
};

export const useMyListings = (options = {}) =>
    useInfiniteQuery({
        queryKey: ['car-listings-mine'],
        queryFn: ({ pageParam = 1 }) =>
            marketplaceService.mine({ page: pageParam }).then(r => r.data?.data || {}),
        staleTime: 15 * 1000,
        ...pages,
        ...options,
    });

export const useCarListing = (id, options = {}) =>
    useQuery({
        queryKey: ['car-listing', id],
        queryFn: () => marketplaceService.detail(id).then(r => r.data?.data?.listing),
        enabled: !!id,
        ...options,
    });

const invalidateLists = (qc) => {
    qc.invalidateQueries({ queryKey: ['car-listings'] });
    qc.invalidateQueries({ queryKey: ['car-listings-mine'] });
};

export const useCreateListing = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (formData) => marketplaceService.create(formData).then(r => r.data?.data?.listing),
        onSuccess: (...a) => { invalidateLists(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useMarkListingSold = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => marketplaceService.markSold(id),
        onSuccess: (...a) => { invalidateLists(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useDeleteListing = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => marketplaceService.remove(id),
        onSuccess: (...a) => { invalidateLists(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};
