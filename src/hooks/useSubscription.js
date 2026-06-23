import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import subscriptionService from '../services/subscriptionService';

// The user's billing status across modules + active subscriptions.
export const useMembership = (options = {}) =>
    useQuery({
        queryKey: ['membership'],
        queryFn: () => subscriptionService.me().then(r => r.data?.data || { modules: [], subscriptions: [] }),
        staleTime: 30 * 1000,
        ...options,
    });

export const usePlans = (module, options = {}) =>
    useQuery({
        queryKey: ['plans', module || 'all'],
        queryFn: () => subscriptionService.plans(module).then(r => r.data?.data?.plans || []),
        staleTime: 60 * 60 * 1000,
        ...options,
    });

export const useSubscribe = (options = {}) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (planId) => subscriptionService.subscribe(planId),
        onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['membership'] }); options.onSuccess?.(...a); },
        onError: options.onError,
    });
};
