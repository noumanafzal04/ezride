import { useQuery } from '@tanstack/react-query';
import rideService from '../services/rideService';

// Rider: full detail of a single ride post by id
export const useRideDetail = (id) =>
    useQuery({
        queryKey: ['ride-detail', id],
        queryFn: () => rideService.getRideDetail(id).then(r => r.data?.data),
        enabled: !!id,
        staleTime: 30 * 1000,
    });

export default useRideDetail;
