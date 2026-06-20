import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rideAlertService from '../services/rideAlertService';

// Rider's active "notify me" alerts
export const useRideAlerts = (options = {}) =>
    useQuery({
        queryKey: ['ride-alerts'],
        queryFn: () => rideAlertService.list().then(r => r.data?.data?.alerts || []),
        staleTime: 0,
        ...options,
    });

export const useCreateRideAlert = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload) => rideAlertService.create(payload),
        onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['ride-alerts'] }); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};

export const useDeleteRideAlert = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => rideAlertService.remove(id),
        onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['ride-alerts'] }); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};
