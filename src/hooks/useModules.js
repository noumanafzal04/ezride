import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// Until the flags load (or if the call fails), only the launch modules show —
// never accidentally reveal a module the admin has turned off.
const DEFAULT_ENABLED = { ride: true, inspection: true };

// Admin-controlled feature flags. Keys: ride, inspection, service.
export const useModules = () => {
    const q = useQuery({
        queryKey: ['app-modules'],
        queryFn: () => api.get('/modules').then(r => r.data?.data?.modules || []),
        staleTime: 5 * 60 * 1000,
    });

    const list = q.data || [];
    const map = list.length
        ? Object.fromEntries(list.map(m => [m.key, !!m.enabled]))
        : DEFAULT_ENABLED;

    return {
        ...q,
        modules: list,
        map,
        isEnabled: (key) => !!map[key],
    };
};

export default useModules;
