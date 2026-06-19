// OSRM public routing — NOT our API, so we use plain fetch (no auth header).
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// Pull lat/lng off a city object regardless of the exact field naming.
export const getCoords = (city) => {
    if (!city) return null;
    const lat = Number(city.latitude ?? city.lat);
    const lng = Number(city.longitude ?? city.lon ?? city.lng ?? city.long);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
};

// Returns { distanceKm, durationMin } between two coordinate pairs.
export const getRoute = async ({ fromLat, fromLng, toLat, toLng }) => {
    const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch route');

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) throw new Error('No route found');

    return {
        distanceKm:  route.distance / 1000, // metres → km
        durationMin: route.duration / 60,   // seconds → minutes
    };
};
