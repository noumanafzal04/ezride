import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import api from './api';

// Guarded: the native module only exists after an app rebuild. If it's missing
// (e.g. Metro reloaded without a rebuild), don't crash the bundle at import.
try {
    Geolocation.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: 'whenInUse',
    });
} catch {
    // native module not linked yet — location features no-op until rebuild
}

// Ask for location permission (Android runtime prompt; iOS handled by the lib).
export const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Use your location?',
                message: 'EZRide uses your location to show nearby rides and services first.',
                buttonPositive: 'Allow',
                buttonNegative: 'Not now',
            },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
        return false;
    }
};

// Resolve the current GPS coordinate (low-accuracy is enough for city matching).
export const getCurrentCoords = () =>
    new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
        );
    });

// Map a coordinate to the nearest known city (backend haversine lookup).
export const nearestCity = async ({ lat, lng }) => {
    const res = await api.get('/cities/nearest', { params: { lat, lng } });
    return res.data?.data?.city || null;
};
