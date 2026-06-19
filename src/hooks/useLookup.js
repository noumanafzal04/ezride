import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const useLookup = (key, endpoint, params = {}, options = {}) =>
    useQuery({
        queryKey:  [key, params],
        queryFn:   () => api.get(endpoint, { params }).then(r => r.data?.data),
        staleTime: 5 * 60 * 1000,
        ...options,
    });

export const useCities = (keyword = '') =>
    useLookup(
        'cities',
        '/cities',
        keyword.trim().length >= 2 ? { keywords: keyword.trim() } : {},
    );

export const useVehicleMakes = () =>
    useLookup('vehicle-makes', '/vehicle/makes');

export const useVehicleModels = (makeId) =>
    useLookup('vehicle-models', '/vehicle/models', { make_id: makeId }, { enabled: !!makeId });

export default useLookup;
