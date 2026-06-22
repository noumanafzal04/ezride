import { useEffect, useRef } from 'react';
import useLocationStore from '../store/locationStore';
import useUserStore from '../store/userStore';
import { requestLocationPermission, getCurrentCoords, nearestCity } from '../services/locationService';

// Detects the user's location once per app session and keeps the confirmed
// city in the store. First detection sets it silently; a later visit to a
// DIFFERENT city raises a `pending` prompt (handled by <LocationPrompt/>).
// Same city → refresh coordinates quietly. Failures are silent — the app
// works fine with no location (lists just fall back to default ordering).
export const useLocationWatch = () => {
    const userId = useUserStore((s) => s.user?.id);
    const ran = useRef(false);

    useEffect(() => {
        if (!userId || ran.current) return;
        ran.current = true;

        (async () => {
            const ok = await requestLocationPermission();
            if (!ok) return;

            let coords;
            try { coords = await getCurrentCoords(); } catch { return; }

            let city;
            try { city = await nearestCity(coords); } catch { return; }
            if (!city?.id) return;

            const detected = { id: city.id, name: city.name };
            const { city: saved, setLocation, refreshCoords, propose } = useLocationStore.getState();

            if (!saved) setLocation(coords, detected);
            else if (saved.id !== detected.id) propose(coords, detected);
            else refreshCoords(coords);
        })();
    }, [userId]);
};

// Convenience selector: current confirmed location for list ranking.
// Select each field separately — returning a new object from one selector
// breaks useSyncExternalStore's caching and causes an infinite render loop.
export const useCurrentLocation = () => {
    const coords = useLocationStore((s) => s.coords);
    const city = useLocationStore((s) => s.city);
    return { coords, city };
};

export default useLocationWatch;
