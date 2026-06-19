import { useQuery } from '@tanstack/react-query';
import { getRoute, getCoords } from '../services/osrmService';

// Computes driving distance/duration between two city objects via OSRM.
// Auto-runs once both cities (with valid coordinates) are selected.
export const useRideRoute = (fromCity, toCity) => {
    const from = getCoords(fromCity);
    const to   = getCoords(toCity);
    const enabled = !!from && !!to;

    return useQuery({
        queryKey: ['osrm-route', fromCity?.id, toCity?.id],
        queryFn: () => getRoute({
            fromLat: from.lat, fromLng: from.lng,
            toLat:   to.lat,   toLng:   to.lng,
        }),
        enabled,
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });
};

export default useRideRoute;
