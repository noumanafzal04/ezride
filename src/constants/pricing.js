// ─── Ride pricing config ──────────────────────────────────────────────────────
export const PER_KM_PRICE = 10; // RS charged per kilometre

// distance (km) → suggested price per seat
export const calcPricePerSeat = (distanceKm) =>
    distanceKm ? Math.round(distanceKm * PER_KM_PRICE) : 0;
