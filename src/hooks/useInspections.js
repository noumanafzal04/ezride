import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import inspectionService from '../services/inspectionService';

const invalidateInspections = (qc) => {
    qc.invalidateQueries({ queryKey: ['admin-inspections'] });
    qc.invalidateQueries({ queryKey: ['inspection'] });
    qc.invalidateQueries({ queryKey: ['inspections'] });
};

// Current user's inspection requests, with infinite scroll.
export const useMyInspections = (options = {}) =>
    useInfiniteQuery({
        queryKey: ['inspections'],
        queryFn: ({ pageParam = 1 }) =>
            inspectionService.list({ page: pageParam, limit: 15 }).then(r => r.data?.data || {}),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const m = lastPage?.meta;
            return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
        },
        staleTime: 30 * 1000,
        ...options,
    });

// A single request (status tracking + report).
export const useInspection = (id, options = {}) =>
    useQuery({
        queryKey: ['inspection', id],
        queryFn: () => inspectionService.detail(id).then(r => r.data?.data),
        enabled: !!id,
        staleTime: 15 * 1000,
        ...options,
    });

// ── Admin / team (requires is_admin) ──

// All requests, optional status filter, infinite scroll.
export const useAdminInspections = (status, options = {}) =>
    useInfiniteQuery({
        queryKey: ['admin-inspections', status || 'all'],
        queryFn: ({ pageParam = 1 }) =>
            inspectionService.adminList({ status: status || undefined, page: pageParam }).then(r => r.data?.data || {}),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const m = lastPage?.meta;
            return m && m.current_page < m.last_page ? m.current_page + 1 : undefined;
        },
        staleTime: 15 * 1000,
        ...options,
    });

export const useAdminUpdateStatus = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => inspectionService.adminUpdateStatus(id, payload),
        onSuccess: (...a) => { invalidateInspections(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

// Fixed category catalog for the report form.
export const useInspectionCategories = (options = {}) =>
    useQuery({
        queryKey: ['inspection-categories'],
        queryFn: () => inspectionService.adminCategories().then(r => r.data?.data?.categories || []),
        staleTime: 60 * 60 * 1000,
        ...options,
    });

export const useSaveReport = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => inspectionService.adminSaveReport(id, payload),
        onSuccess: (...a) => { invalidateInspections(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useSubmitInspection = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => inspectionService.submit(payload).then(r => r.data?.data),
        onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['inspections'] }); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useCancelInspection = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => inspectionService.cancel(id).then(r => r.data?.data),
        onSuccess: (...a) => { invalidateInspections(qc); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

// Public status lookup by tracking code (guests). `token` null = idle.
export const useTrackInspection = (token, options = {}) =>
    useQuery({
        queryKey: ['track-inspection', token],
        queryFn: () => inspectionService.track(token).then(r => r.data?.data),
        enabled: !!token,
        retry: false,
        staleTime: 15 * 1000,
        ...options,
    });

export default useMyInspections;
