import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, Modal, TextInput,
    Image, ActivityIndicator, Linking, Alert, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { fileUrl } from '../../utils/media';
import { useAvailableRides, useBookSeat } from '../../hooks/useAvailableRides';
import { useMyBookings, useCancelBooking } from '../../hooks/useMyBookings';
import { useCompleteBooking, useRateBooking } from '../../hooks/useReview';
import { useRideAlerts, useCreateRideAlert, useDeleteRideAlert } from '../../hooks/useRideAlerts';
import { useRidesRealtime, useRealtimeConnected } from '../../hooks/useRealtime';
import { useCities } from '../../hooks/useLookup';
import SelectSheet from '../../components/SelectSheet';
import Avatar from '../../components/Avatar';
import { RideCardSkeleton } from '../../components/Skeletons';
import ReviewSheet from '../../components/ReviewSheet';
import { useBottomInset } from '../../hooks/useBottomInset';
import { useModules } from '../../hooks/useModules';
import useLocationStore from '../../store/locationStore';

const ymd = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

// "2026-06-18T..." → "3h ago" / "2d ago"
const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return '';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// Map a backend ride_post into the card shape this screen renders
const mapRide = (p) => {
    const driver = p.driver || {};
    const v = driver.vehicle || {};
    const isPrivate = p.post_type === 'private';
    const seatsLeft = isPrivate ? (v.seating_capacity || 1) : (p.available_seats ?? 0);
    return {
        id: p.id,
        name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Driver',
        rating: driver.rating_avg ?? null,
        rides: driver.total_trips ?? null,
        pricePerSeat: Number(p.price_per_seat) || 0,
        totalSeats: v.seating_capacity || seatsLeft,
        seatsLeft,
        from: [p.from?.city?.name, p.from?.address].filter(Boolean).join(' · ') || '—',
        to: [p.to?.city?.name, p.to?.address].filter(Boolean).join(' · ') || '—',
        date: fmtDate(p.departure_at),
        vehicle: [v.model?.make, v.model?.name].filter(Boolean).join(' ') || 'Vehicle',
        plate: v.registration_number || '',
        type: isPrivate ? 'Private' : 'Shared',
        online: true,
        postedAgo: timeAgo(p.created_at),
        photo: driver.profile_image || null,   // full URL from backend
        carImage: fileUrl(v.vehicle_image_path),
    };
};

// ─── Component ────────────────────────────────────────────────────────────────

const AvailableRidesScreen = ({ navigation, embedded = false }) => {
    const pb = useBottomInset();
    const { isEnabled } = useModules();
    // Quick inspection access on the find-ride screen when there's no full search hub.
    const showInspectBtn = !embedded && isEnabled('inspection');
    // Live while the socket is up; poll only as a fallback if it drops.
    const liveConnected = useRealtimeConnected();
    const fallbackPoll = liveConnected ? false : 15000;

    // Filters that are actually applied to the query (empty = show all)
    const [appliedFilters, setAppliedFilters] = useState({});
    const ridesQuery = useAvailableRides(appliedFilters, {
        refetchInterval: fallbackPoll,
        refetchIntervalInBackground: false,
    });
    // Flatten the infinite-query pages into one list
    const rawRides = (ridesQuery.data?.pages || []).flatMap(p => p.ride_posts || []);
    const rides = rawRides.map(mapRide);

    // ── Rider's current ride (one active ride at a time) ──────────────────────
    // Live via Reverb's user channel; falls back to polling only if the socket drops.
    const myBookingsQuery = useMyBookings(undefined, {
        refetchInterval: fallbackPoll,
        refetchIntervalInBackground: false,
    });
    const myBookings = myBookingsQuery.data || [];
    // Only an ACCEPTED (confirmed) ride locks the screen. Pending requests keep the
    // rider browsing. Completed-ride reviews live in History / the ride-completed
    // notification (Review screen) — never as a takeover on the search screen.
    const activeBooking = myBookings.find(b => b.status === 'accepted');
    const currentRide = activeBooking || null;
    const pendingCount = myBookings.filter(b => b.status === 'pending').length;

    const cancelBooking = useCancelBooking({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Booking Cancelled' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    // Rider completes the ride → then the review form pops.
    const [reviewFor, setReviewFor] = useState(null);
    const completeBooking = useCompleteBooking({
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });
    const rate = useRateBooking({
        onSuccess: () => { setReviewFor(null); Toast.show({ type: 'success', text1: 'Thanks for your review!' }); },
        onError: (err) => Toast.show({ type: 'error', text1: 'Could not submit', text2: err.response?.data?.message || 'Try again.' }),
    });
    const completeRide = (booking) => {
        completeBooking.mutate(booking.id, { onSuccess: () => setReviewFor(booking) });
    };

    const confirmCancelRide = (booking) => {
        Alert.alert('Cancel booking?', 'Your seat request will be withdrawn.', [
            { text: 'Keep', style: 'cancel' },
            { text: 'Cancel Booking', style: 'destructive', onPress: () => cancelBooking.mutate(booking.id) },
        ]);
    };
    const callDriver = (phone) => phone && Linking.openURL(`tel:${phone}`);

    // New posts arrive live via Reverb → auto-refresh the list (no banner, no tap).
    // The match check keeps it to posts relevant to the current filter; React
    // Query de-dupes rapid refetches.
    const refetchRides = ridesQuery.refetch;
    const onLiveNewPost = useCallback((payload) => {
        const f = appliedFilters;
        if (f.from_city_id && payload?.from_city_id !== f.from_city_id) return;
        if (f.to_city_id && payload?.to_city_id !== f.to_city_id) return;
        if (f.date && payload?.date !== f.date) return;
        refetchRides();
    }, [appliedFilters, refetchRides]);
    useRidesRealtime(currentRide ? undefined : onLiveNewPost);

    const [bookingModal, setBookingModal]   = useState(null);
    const [seatsRequested, setSeatsRequested] = useState(1);
    const [note, setNote]                  = useState('');
    const [sentBookings, setSentBookings]  = useState({});
    const [successModal, setSuccessModal]  = useState(false);

    // ── Filter selection state ────────────────────────────────────────────────
    const [fromCity, setFromCity] = useState(null);
    const [toCity, setToCity]     = useState(null);
    const [dateObj, setDateObj]   = useState(null);
    const [cityField, setCityField]   = useState(null); // 'from' | 'to'
    const [citySearch, setCitySearch] = useState('');
    const [showDate, setShowDate]     = useState(false);

    const citiesQuery = useCities();
    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
    );

    const openCity  = (field) => { setCityField(field); setCitySearch(''); };
    const closeCity = () => { setCityField(null); setCitySearch(''); };
    const onCitySelect = (city) => {
        if (cityField === 'from') setFromCity(city); else setToCity(city);
        closeCity();
    };

    const applyFilters = () => {
        const f = {};
        if (fromCity) f.from_city_id = fromCity.id;
        if (toCity)   f.to_city_id   = toCity.id;
        if (dateObj)  f.date         = ymd(dateObj);
        setAppliedFilters(f);
    };

    const clearFilters = () => {
        setFromCity(null);
        setToCity(null);
        setDateObj(null);
        setAppliedFilters({});
    };

    const hasFilters = !!(fromCity || toCity || dateObj);

    // ── "Notify me" ride alert for the selected route (+ optional date) ───────
    const alertsQuery = useRideAlerts();
    const alerts = alertsQuery.data || [];
    const selectedDate = dateObj ? ymd(dateObj) : null;
    const matchingAlert = alerts.find(a =>
        a.from_city_id === fromCity?.id &&
        a.to_city_id === toCity?.id &&
        (a.alert_date || null) === selectedDate
    );
    const canAlert = !!(fromCity && toCity);
    // Optimistic toggle: flip instantly on tap, reconcile with the server result.
    const [pendingAlert, setPendingAlert] = useState(null);
    const alertOn = pendingAlert !== null ? pendingAlert : !!matchingAlert;

    const createAlert = useCreateRideAlert({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Alert on', text2: 'We’ll notify you when a matching ride is posted.' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
        onSettled: () => setPendingAlert(null),
    });
    const deleteAlert = useDeleteRideAlert({
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
        onSettled: () => setPendingAlert(null),
    });

    const toggleAlert = (val) => {
        if (!canAlert) {
            Toast.show({ type: 'info', text1: 'Select From and To cities to get alerts' });
            return;
        }
        setPendingAlert(val);
        if (val) {
            createAlert.mutate({ from_city_id: fromCity.id, to_city_id: toCity.id, alert_date: selectedDate });
        } else if (matchingAlert) {
            deleteAlert.mutate(matchingAlert.id);
        } else {
            setPendingAlert(null);
        }
    };

    const openBooking = (item) => {
        setSeatsRequested(1);
        setNote('');
        setBookingModal(item);
    };

    const bookMutation = useBookSeat({
        onSuccess: (_res, vars) => {
            setSentBookings(prev => ({ ...prev, [vars.ridePostId]: true }));
            setBookingModal(null);
            setSuccessModal(true);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Could not send the request. Please try again.';
            Toast.show({ type: 'error', text1: 'Booking Failed', text2: msg });
        },
    });

    const sendBooking = () => {
        if (!bookingModal) return;
        const coords = useLocationStore.getState().coords;
        bookMutation.mutate({
            ridePostId: bookingModal.id,
            seats: seatsRequested,
            note,
            pickup_lat: coords?.lat ?? null,
            pickup_lng: coords?.lng ?? null,
        });
    };

    const totalPrice = bookingModal ? bookingModal.pricePerSeat * seatsRequested : 0;

    // ── Seat Selector ─────────────────────────────────────────────────────────

    const SeatSelector = ({ max }) => (
        <View style={styles.seatSelector}>
            <TouchableOpacity
                style={[styles.seatStepBtn, seatsRequested <= 1 && styles.seatStepBtnDisabled]}
                onPress={() => setSeatsRequested(s => Math.max(1, s - 1))}
                disabled={seatsRequested <= 1}
            >
                <Icon name="minus" size={18} color={seatsRequested <= 1 ? '#CCCCCC' : '#07163B'} />
            </TouchableOpacity>
            <View style={styles.seatCountBlock}>
                <Text style={styles.seatCountNum}>{seatsRequested}</Text>
                <Text style={styles.seatCountLabel}>seat{seatsRequested > 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity
                style={[styles.seatStepBtn, seatsRequested >= max && styles.seatStepBtnDisabled]}
                onPress={() => setSeatsRequested(s => Math.min(max, s + 1))}
                disabled={seatsRequested >= max}
            >
                <Icon name="plus" size={18} color={seatsRequested >= max ? '#CCCCCC' : '#07163B'} />
            </TouchableOpacity>
        </View>
    );

    // ── Search Header (scrolls with list) ────────────────────────────────────

    const ListHeader = () => (
        <View style={styles.searchCard}>

            {/* From */}
            <TouchableOpacity style={styles.searchField} onPress={() => openCity('from')} activeOpacity={0.7}>
                <View style={styles.searchFieldIconWrap}>
                    <View style={styles.dotFrom} />
                </View>
                <Text style={[styles.searchFieldInput, !fromCity && styles.searchPlaceholder]}>
                    {fromCity?.name || 'From (any city)'}
                </Text>
                {fromCity
                    ? <TouchableOpacity onPress={() => setFromCity(null)}><Icon name="close-circle" size={16} color="#C4C9CF" /></TouchableOpacity>
                    : <Icon name="chevron-down" size={18} color="#9E9E9E" />}
            </TouchableOpacity>

            <View style={styles.searchConnector}><View style={styles.searchConnectorLine} /></View>

            {/* To */}
            <TouchableOpacity style={styles.searchField} onPress={() => openCity('to')} activeOpacity={0.7}>
                <View style={styles.searchFieldIconWrap}>
                    <View style={styles.dotTo} />
                </View>
                <Text style={[styles.searchFieldInput, !toCity && styles.searchPlaceholder]}>
                    {toCity?.name || 'To (any city)'}
                </Text>
                {toCity
                    ? <TouchableOpacity onPress={() => setToCity(null)}><Icon name="close-circle" size={16} color="#C4C9CF" /></TouchableOpacity>
                    : <Icon name="chevron-down" size={18} color="#9E9E9E" />}
            </TouchableOpacity>

            <View style={styles.searchDivider} />

            {/* Date */}
            <TouchableOpacity style={styles.searchField} onPress={() => setShowDate(true)} activeOpacity={0.7}>
                <View style={styles.searchFieldIconWrap}>
                    <Icon name="calendar-outline" size={18} color="#9E9E9E" />
                </View>
                <Text style={[styles.searchFieldInput, !dateObj && styles.searchPlaceholder]}>
                    {dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Any date'}
                </Text>
                {dateObj
                    ? <TouchableOpacity onPress={() => setDateObj(null)}><Icon name="close-circle" size={16} color="#C4C9CF" /></TouchableOpacity>
                    : <Icon name="chevron-down" size={18} color="#9E9E9E" />}
            </TouchableOpacity>

            <View style={styles.searchDivider} />

            {/* Notify me — alert when a ride matches this route (+ date) */}
            <TouchableOpacity
                style={styles.notifyRow}
                activeOpacity={canAlert ? 1 : 0.6}
                onPress={() => { if (!canAlert) Toast.show({ type: 'info', text1: 'Select From and To cities to get alerts' }); }}
            >
                <Icon name="bell-ring-outline" size={18} color={canAlert ? '#07163B' : '#C4C9CF'} />
                <Text style={[styles.notifyText, !canAlert && styles.searchPlaceholder]}>
                    {alertOn ? 'You’ll be notified for this route' : 'Notify me when a ride matches'}
                </Text>
                <Switch
                    value={alertOn}
                    onValueChange={toggleAlert}
                    disabled={!canAlert}
                    trackColor={{ true: '#FFD400', false: '#E0E0E0' }}
                    thumbColor="#FFFFFF"
                />
            </TouchableOpacity>

            <View style={styles.searchDivider} />

            {/* Actions */}
            <View style={styles.filterActions}>
                {hasFilters && (
                    <TouchableOpacity style={styles.clearBtn} onPress={clearFilters} activeOpacity={0.8}>
                        <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.searchBtn} onPress={applyFilters} activeOpacity={0.85}>
                    <Icon name="magnify" size={18} color="#111111" />
                    <Text style={styles.searchBtnText}>Search Rides</Text>
                </TouchableOpacity>
            </View>

        </View>
    );

    // ── Ride Card ─────────────────────────────────────────────────────────────

    const renderRide = ({ item }) => {
        const alreadySent = sentBookings[item.id];
        const isFull = item.seatsLeft === 0;

        return (
            <TouchableOpacity
                style={styles.rideCard}
                onPress={() => navigation.navigate('RideDetail', { offer: item })}
                activeOpacity={0.85}
            >
                {/* ── Top: driver info + car image ── */}
                <View style={styles.cardTopRow}>

                    {/* Left: avatar + driver */}
                    <View style={styles.driverRow}>
                        <View style={styles.avatarWrap}>
                            <Avatar uri={item.photo} name={item.name} size={40} bg="#EEEEEE" color="#9AA0A6" />
                            {item.online && <View style={styles.onlineDot} />}
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{item.name}</Text>
                            <View style={styles.ratingRow}>
                                <Icon name="star" size={12} color="#F5A247" />
                                <Text style={styles.ratingText}>
                                    {item.rating ? `${item.rating} · ${item.rides || 0} Trips` : 'New driver'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Right: car image thumbnail */}
                    <View style={styles.carImageWrap}>
                        {item.carImage ? (
                            <Image source={{ uri: item.carImage }} style={styles.carImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.carImagePh}><Icon name="car" size={26} color="#C7CBD1" /></View>
                        )}
                        {!!item.plate && (
                            <View style={styles.carImageOverlay}>
                                <Text style={styles.carPlateOverlay}>{item.plate}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Price per seat */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceText}>Rs. {item.pricePerSeat.toLocaleString()}</Text>
                    <Text style={styles.priceLabel}> / seat</Text>
                    <View style={styles.priceDot} />
                    <View style={[
                        styles.seatsPill,
                        isFull ? styles.seatsPillFull : styles.seatsPillAvail,
                    ]}>
                        <Icon
                            name="account-multiple-outline"
                            size={12}
                            color={isFull ? '#D83F54' : '#109F2A'}
                        />
                        <Text style={[styles.seatsPillText, { color: isFull ? '#D83F54' : '#109F2A' }]}>
                            {isFull ? 'Full' : `${item.seatsLeft} left`}
                        </Text>
                    </View>
                    <View style={styles.typePill}>
                        <Text style={styles.typePillText}>{item.type}</Text>
                    </View>
                </View>

                {/* Route */}
                <View style={styles.routeRow}>
                    <View style={styles.routeDots}>
                        <View style={styles.dotGreen} />
                        <View style={styles.routeLine} />
                        <View style={styles.dotNavy} />
                    </View>
                    <View style={styles.routeTexts}>
                        <Text style={styles.routeFrom} numberOfLines={1}>{item.from}</Text>
                        <Text style={styles.routeTo} numberOfLines={1}>{item.to}</Text>
                    </View>
                </View>

                {/* Date + posted ago */}
                <View style={styles.metaRow}>
                    <Icon name="calendar-outline" size={12} color="#AAAAAA" />
                    <Text style={styles.metaText}>{item.date}</Text>
                    <Text style={styles.postedAgo}>{item.postedAgo}</Text>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Actions */}
                <View style={styles.actionRow}>
                    {alreadySent ? (
                        <View style={styles.sentBtn}>
                            <Icon name="check-circle-outline" size={15} color="#109F2A" />
                            <Text style={styles.sentBtnText}>Request Sent</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.bookBtn, isFull && styles.bookBtnDisabled]}
                            onPress={() => !isFull && openBooking(item)}
                            disabled={isFull}
                            activeOpacity={0.85}
                        >
                            <Icon name="seat-passenger" size={15} color={isFull ? '#AAAAAA' : '#111111'} />
                            <Text style={[styles.bookBtnText, isFull && { color: '#AAAAAA' }]}>
                                {isFull ? 'Fully Booked' : 'Book a Seat'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // ── Rider's active-ride view (replaces browse while a ride is in progress) ─
    const renderActiveRide = () => {
        const b = currentRide;
        const ride = b.ride || {};
        const driver = ride.driver || {};
        const driverName = [driver.first_name, driver.last_name].filter(Boolean).join(' ') || 'Driver';

        const isAccepted  = b.status === 'accepted';
        const isStarted   = isAccepted && ride.status === 'in_progress';

        let icon = 'clock-outline', color = '#D97706', bg = '#FFF7ED';
        let label = 'Waiting for driver', sub = 'Your request has been sent. You’ll be confirmed once the driver accepts.';
        if (isAccepted && !isStarted) { icon = 'check-circle-outline'; color = '#109F2A'; bg = '#E8F8EE'; label = 'Booking confirmed'; sub = 'The driver accepted. You’ll see here when the ride starts.'; }
        if (isStarted)   { icon = 'steering';        color = '#1D6AFF'; bg = '#EEF4FF'; label = 'Ride started'; sub = 'Your driver has started the ride.'; }

        return (
            <View style={styles.activeWrap}>
                <View style={styles.rideCard}>
                    <View style={[styles.activeStatusPill, { backgroundColor: bg }]}>
                        <Icon name={icon} size={15} color={color} />
                        <Text style={[styles.activeStatusText, { color }]}>{label}</Text>
                    </View>
                    <Text style={styles.activeSub}>{sub}</Text>

                    <View style={styles.routeRow}>
                        <View style={styles.routeDots}>
                            <View style={styles.dotGreen} />
                            <View style={styles.routeLine} />
                            <View style={styles.dotNavy} />
                        </View>
                        <View style={styles.routeTexts}>
                            <Text style={styles.routeFrom} numberOfLines={1}>{ride.from_city || '—'}</Text>
                            <Text style={styles.routeTo} numberOfLines={1}>{ride.to_city || '—'}</Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <Icon name="calendar-clock" size={13} color="#5D5F62" />
                        <Text style={styles.metaText}>{fmtDate(ride.departure_at)}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Icon name="seat-passenger" size={13} color="#5D5F62" />
                        <Text style={styles.metaText}>
                            {b.seats_booked} seat{b.seats_booked > 1 ? 's' : ''} · Rs {Number(b.total_amount).toLocaleString()}
                        </Text>
                    </View>

                    {(isAccepted || isStarted) && (
                        <View style={styles.activeDriverRow}>
                            <View style={styles.activeAvatar}>
                                <Text style={styles.activeInitial}>{(driver.first_name?.[0] || 'D').toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.activeDriverName}>{driverName}</Text>
                                <Text style={styles.activeDriverSub}>Your driver</Text>
                            </View>
                            <TouchableOpacity style={styles.activeCallBtn} onPress={() => callDriver(driver.phone_number)}>
                                <Icon name="phone" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {(() => {
                        const departed = ride.departure_at && new Date(ride.departure_at).getTime() < Date.now();
                        // Once the ride has started or its time has passed → rider completes it.
                        if (isStarted || (isAccepted && departed)) {
                            return (
                                <TouchableOpacity
                                    style={styles.activeCompleteBtn}
                                    onPress={() => completeRide(b)}
                                    disabled={completeBooking.isPending}
                                >
                                    <Icon name="check-circle" size={17} color="#07163B" />
                                    <Text style={styles.activeCompleteText}>
                                        {completeBooking.isPending ? 'Completing…' : 'Complete Ride'}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }
                        return (
                            <TouchableOpacity
                                style={styles.activeCancelBtn}
                                onPress={() => confirmCancelRide(b)}
                                disabled={cancelBooking.isPending}
                            >
                                <Icon name="close-circle-outline" size={16} color="#D83F54" />
                                <Text style={styles.activeCancelText}>Cancel Booking</Text>
                            </TouchableOpacity>
                        );
                    })()}
                </View>

                <Text style={styles.activeHint}>You can book a new ride once this one is complete.</Text>
            </View>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            {!embedded && (
                <>
                    <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                    {/* Static header */}
                    <View style={styles.header}>
                        {navigation.canGoBack() ? (
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
                                <Icon name="arrow-left" size={24} color="#07163B" />
                            </TouchableOpacity>
                        ) : <View style={styles.headerBack} />}
                        <Text style={styles.headerTitle}>Available Rides</Text>
                        <View style={styles.headerBack} />
                    </View>
                </>
            )}

            {currentRide ? (
                renderActiveRide()
            ) : (
                <>
                    {/* Pending requests hint — rider may have several out at once */}
                    {pendingCount > 0 && (
                        <View style={styles.pendingBar}>
                            <Icon name="clock-outline" size={14} color="#D97706" />
                            <Text style={styles.pendingBarText}>
                                {pendingCount} request{pendingCount > 1 ? 's' : ''} sent · waiting for a driver to accept
                            </Text>
                        </View>
                    )}

                    {/* FlatList: search card scrolls as first item, then ride cards */}
                    <FlatList
                        data={rides}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderRide}
                        ListHeaderComponent={<ListHeader />}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.list, !embedded && { paddingBottom: pb }]}
                        keyboardShouldPersistTaps="handled"
                        refreshing={ridesQuery.isRefetching}
                        onRefresh={ridesQuery.refetch}
                        onEndReachedThreshold={0.5}
                        onEndReached={() => {
                            if (ridesQuery.hasNextPage && !ridesQuery.isFetchingNextPage) {
                                ridesQuery.fetchNextPage();
                            }
                        }}
                        ListFooterComponent={
                            ridesQuery.isFetchingNextPage
                                ? <ActivityIndicator color="#FFD400" style={{ marginVertical: 20 }} />
                                : null
                        }
                        ListEmptyComponent={
                            ridesQuery.isLoading ? (
                                <RideCardSkeleton />
                            ) : (
                                <View style={styles.emptyState}>
                                    <Icon name="car-off" size={46} color="#DDDDDD" />
                                    <Text style={styles.emptyTitle}>No rides available</Text>
                                    <Text style={styles.emptySub}>Check back later or adjust your search.</Text>
                                </View>
                            )
                        }
                    />
                </>
            )}

            {/* ── Booking Bottom Sheet ──────────────────────────────────────── */}
            <Modal visible={!!bookingModal} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.sheetBackdrop}
                    activeOpacity={1}
                    onPress={() => setBookingModal(null)}
                />
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Book a Seat</Text>

                    {bookingModal && (
                        <>
                            {/* Driver + car thumbnail */}
                            <View style={styles.sheetDriverRow}>
                                <Avatar uri={bookingModal.photo} name={bookingModal.name} size={40} bg="#EEEEEE" color="#9AA0A6" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sheetDriverName}>{bookingModal.name}</Text>
                                    <Text style={styles.sheetDriverMeta}>
                                        {bookingModal.vehicle} · {bookingModal.plate}
                                    </Text>
                                </View>
                                {bookingModal.carImage ? (
                                    <Image source={{ uri: bookingModal.carImage }} style={styles.sheetCarThumb} resizeMode="cover" />
                                ) : (
                                    <View style={[styles.sheetCarThumb, styles.sheetCarPh]}><Icon name="car" size={22} color="#C7CBD1" /></View>
                                )}
                            </View>

                            {/* Route */}
                            <View style={styles.sheetRouteCard}>
                                <View style={styles.sheetRouteRow}>
                                    <Icon name="map-marker-outline" size={15} color="#109F2A" />
                                    <Text style={styles.sheetRouteText} numberOfLines={1}>{bookingModal.from}</Text>
                                </View>
                                <View style={styles.sheetRouteDivider} />
                                <View style={styles.sheetRouteRow}>
                                    <Icon name="map-marker-check-outline" size={15} color="#07163B" />
                                    <Text style={styles.sheetRouteText} numberOfLines={1}>{bookingModal.to}</Text>
                                </View>
                            </View>

                            {/* Chips */}
                            <View style={styles.sheetInfoRow}>
                                <View style={styles.sheetInfoChip}>
                                    <Icon name="account-multiple-outline" size={14} color="#5D5F62" />
                                    <Text style={styles.sheetInfoChipText}>
                                        {bookingModal.seatsLeft} seat{bookingModal.seatsLeft > 1 ? 's' : ''} available
                                    </Text>
                                </View>
                                <View style={styles.sheetInfoChip}>
                                    <Icon name="calendar-outline" size={14} color="#5D5F62" />
                                    <Text style={styles.sheetInfoChipText}>
                                        {bookingModal.date.split('—')[0].trim()}
                                    </Text>
                                </View>
                            </View>

                            {/* Seats required */}
                            <View style={styles.sheetSection}>
                                <Text style={styles.sheetSectionLabel}>Seats Required</Text>
                                <SeatSelector max={bookingModal.seatsLeft} />
                            </View>

                            {/* Price */}
                            <View style={styles.sheetPriceCard}>
                                <View style={styles.sheetPriceRow}>
                                    <Text style={styles.sheetPriceLabel}>
                                        Rs. {bookingModal.pricePerSeat.toLocaleString()} × {seatsRequested} seat{seatsRequested > 1 ? 's' : ''}
                                    </Text>
                                    <Text style={styles.sheetPriceValue}>
                                        Rs. {totalPrice.toLocaleString()}
                                    </Text>
                                </View>
                            </View>

                            {/* Note */}
                            <View style={styles.sheetNoteInput}>
                                <Icon name="comment-text-outline" size={16} color="#9E9E9E" />
                                <TextInput
                                    placeholder="Add a note for the driver (optional)"
                                    placeholderTextColor="#AAAAAA"
                                    value={note}
                                    onChangeText={setNote}
                                    style={styles.sheetNoteText}
                                    multiline
                                />
                            </View>

                            {/* Send */}
                            <TouchableOpacity
                                style={styles.sendBookingBtn}
                                onPress={sendBooking}
                                disabled={bookMutation.isPending}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.sendBookingText}>
                                    {bookMutation.isPending
                                        ? 'Sending…'
                                        : `Send Booking Request · Rs. ${totalPrice.toLocaleString()}`}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </Modal>

            {/* ── Success Modal ─────────────────────────────────────────────── */}
            <Modal visible={successModal} transparent animationType="fade">
                <View style={styles.successOverlay}>
                    <View style={styles.successCard}>
                        <View style={styles.successIconWrap}>
                            <Icon name="check-circle" size={44} color="#109F2A" />
                        </View>
                        <Text style={styles.successTitle}>Request Sent!</Text>
                        <Text style={styles.successBody}>
                            Your booking request has been sent. You'll be notified once the driver accepts.
                        </Text>
                        <TouchableOpacity style={styles.successBtn} onPress={() => setSuccessModal(false)}>
                            <Text style={styles.successBtnText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── City filter picker ────────────────────────────────────────── */}
            <SelectSheet
                visible={!!cityField}
                onClose={closeCity}
                title={cityField === 'from' ? 'From City' : 'To City'}
                items={filteredCities}
                loading={citiesQuery.isLoading}
                searchable
                search={citySearch}
                onSearch={setCitySearch}
                selectedId={cityField === 'from' ? fromCity?.id : toCity?.id}
                onSelect={onCitySelect}
            />

            {/* ── Date picker (scroll-wheel modal) ──────────────────────────── */}
            <DatePicker
                modal
                open={showDate}
                date={dateObj || new Date()}
                mode="date"
                minimumDate={new Date()}
                locale="en-US"
                theme="light"
                onConfirm={(selected) => { setShowDate(false); setDateObj(selected); }}
                onCancel={() => setShowDate(false)}
            />

            {/* Quick "Request Inspection" footer button (find-ride screen, inspection module on) */}
            {showInspectBtn && (
                <TouchableOpacity
                    style={[styles.inspectFab, { paddingBottom: pb - 8 }]}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('InspectionRequest')}
                >
                    <Icon name="clipboard-check-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.inspectFabTxt}>Request Inspection</Text>
                </TouchableOpacity>
            )}

            {/* Review form after the rider completes the ride */}
            <ReviewSheet
                visible={!!reviewFor}
                onClose={() => setReviewFor(null)}
                submitting={rate.isPending}
                title="How was your ride?"
                subtitle={reviewFor ? `${reviewFor.ride?.from_city || ''} → ${reviewFor.ride?.to_city || ''}` : ''}
                onSubmit={(rating, review) => reviewFor && rate.mutate({ id: reviewFor.id, rating, review })}
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    inspectFab: {
        position: 'absolute', left: 16, right: 16, bottom: 0,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#07163B', borderRadius: 14, paddingTop: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
    },
    inspectFabTxt: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#FFFFFF' },

    // ── Header ────────────────────────────────────────────────────────────
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    filterBtn: {
        width: 38, height: 38, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    headerBack: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },

    list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

    // ── Active ride view ────────────────────────────────────────────────────
    activeWrap: { padding: 16 },
    activeStatusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10,
    },
    activeStatusText: { fontSize: 13, fontFamily: Fonts.semiBold },
    activeSub: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 19, marginBottom: 14 },
    activeDriverRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#F8FBF9', borderRadius: 12, padding: 12, marginTop: 6, marginBottom: 4,
        borderWidth: 1, borderColor: '#E8F8EE',
    },
    activeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD400', alignItems: 'center', justifyContent: 'center' },
    activeInitial: { fontSize: 17, fontFamily: Fonts.bold, color: '#07163B' },
    activeDriverName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },
    activeDriverSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#109F2A', marginTop: 1 },
    activeCallBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#109F2A', alignItems: 'center', justifyContent: 'center' },
    activeActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    activeSkipBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#EAEDEE', alignItems: 'center' },
    activeSkipText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    activePrimaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#FFD400' },
    activePrimaryText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },
    activeCancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: '#D83F54',
        backgroundColor: '#FFF0F2', marginTop: 12,
    },
    activeCancelText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#D83F54' },
    activeCompleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 10, backgroundColor: '#FFD400', marginTop: 12,
    },
    activeCompleteText: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#07163B' },
    activeHint: { fontSize: 12, fontFamily: Fonts.regular, color: '#9E9E9E', textAlign: 'center', marginTop: 14 },
    pendingBar: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: '#FFF7ED', borderColor: '#FCD9A8', borderWidth: 1,
        marginHorizontal: 16, marginTop: 12, borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10,
    },
    pendingBarText: { flex: 1, fontSize: 12, fontFamily: Fonts.medium, color: '#92600B' },

    emptyState: { alignItems: 'center', paddingTop: 50, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub:   { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },

    // ── Search Card (ListHeader) ───────────────────────────────────────────
    searchCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 16,

    },
    searchField: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        gap: 12,
    },
    searchFieldIconWrap: {
        width: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotFrom: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#109F2A',
    },
    dotTo: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#07163B',
    },
    searchFieldInput: {
        flex: 1,
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: '#202223',
        padding: 0,
    },
    searchPlaceholder: { color: '#AAAAAA', fontFamily: Fonts.regular },
    filterActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    clearBtn: {
        paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#EAEDEE',
    },
    clearBtnText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    searchConnector: {
        paddingLeft: 25,
        height: 4,
        justifyContent: 'center',
    },
    searchConnectorLine: {
        width: 1.5,
        height: 16,
        backgroundColor: '#EAEDEE',
        marginTop: -8,
    },
    searchDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: -16,
    },
    notifyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    notifyText: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#202223',
    },
    searchBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFD400',
        borderRadius: 10,
        paddingVertical: 13,
        marginBottom: 6,
    },
    searchBtnText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },

    // ── Ride Card ──────────────────────────────────────────────────────────
    rideCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        marginBottom: 14,

    },

    // Top row: driver left, car image right
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    avatarWrap: { position: 'relative', marginRight: 10 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#EEEEEE',
        alignItems: 'center', justifyContent: 'center',
    },
    onlineDot: {
        position: 'absolute', bottom: 1, right: 1,
        width: 9, height: 9, borderRadius: 5,
        backgroundColor: '#109F2A',
        borderWidth: 1.5, borderColor: '#FFFFFF',
    },
    driverInfo: { flex: 1 },
    driverName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 3 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },

    // Car image thumbnail
    carImageWrap: {
        width: 88,
        height: 58,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#EEEEEE',
    },
    carImage: {
        width: '100%',
        height: '100%',
    },
    carImagePh: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    carImageOverlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingVertical: 3,
        alignItems: 'center',
    },
    carPlateOverlay: {
        fontSize: 9,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    // Price row
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    priceText: { fontSize: 15, fontFamily: Fonts.bold, color: '#07163B' },
    priceLabel: { fontSize: 12, fontFamily: Fonts.regular, color: '#9E9E9E' },
    priceDot: {
        width: 3, height: 3, borderRadius: 2,
        backgroundColor: '#CCCCCC',
    },
    seatsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    seatsPillAvail: { backgroundColor: '#E8F8EE' },
    seatsPillFull:  { backgroundColor: '#FFF0F2' },
    seatsPillText:  { fontSize: 11, fontFamily: Fonts.semiBold },
    typePill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    typePillText: { fontSize: 11, fontFamily: Fonts.regular, color: '#5D5F62' },

    // Route
    routeRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 8,
        gap: 10,
    },
    routeDots: {
        alignItems: 'center',
        width: 12,
        paddingVertical: 2,
    },
    dotGreen: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#109F2A',
    },
    routeLine: {
        width: 1.5, flex: 1,
        backgroundColor: '#EAEDEE',
        marginVertical: 2,
        minHeight: 12,
    },
    dotNavy: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#07163B',
    },
    routeTexts: { flex: 1, gap: 7 },
    routeFrom: { fontSize: 13, fontFamily: Fonts.medium, color: '#202223', lineHeight: 17 },
    routeTo:   { fontSize: 13, fontFamily: Fonts.medium, color: '#202223', lineHeight: 17 },

    // Meta
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 2,
    },
    metaText: {
        flex: 1,
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
    },
    postedAgo: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#CCCCCC',
    },

    cardDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },

    // Actions
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    chatIconBtn: {
        width: 40, height: 40, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    bookBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingVertical: 11,
        borderRadius: 10,
        backgroundColor: '#FFD400',
    },
    bookBtnDisabled: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    bookBtnText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },
    sentBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 11,
        borderRadius: 10,
        backgroundColor: '#E8F8EE',
        borderWidth: 1,
        borderColor: '#B8EAC8',
    },
    sentBtnText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#109F2A' },



    // ── Booking Bottom Sheet ───────────────────────────────────────────────
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    sheetHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#E0E0E0',
        alignSelf: 'center',
        marginBottom: 18,
    },
    sheetTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 16,
    },
    sheetDriverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    sheetAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#EEEEEE',
        alignItems: 'center', justifyContent: 'center',
    },
    sheetDriverName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 2,
    },
    sheetDriverMeta: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    sheetCarThumb: {
        width: 70,
        height: 46,
        borderRadius: 8,
        backgroundColor: '#EEEEEE',
    },
    sheetCarPh: { alignItems: 'center', justifyContent: 'center' },
    sheetRouteCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        gap: 8,
    },
    sheetRouteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sheetRouteDivider: {
        height: 1,
        backgroundColor: '#EAEDEE',
        marginLeft: 22,
    },
    sheetRouteText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        flex: 1,
    },
    sheetInfoRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    sheetInfoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F5F5F7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    sheetInfoChipText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },
    sheetSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sheetSectionLabel: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
    },
    seatSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seatStepBtn: {
        width: 36, height: 36, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    seatStepBtnDisabled: {
        borderColor: '#F0F0F0',
        backgroundColor: '#FAFAFA',
    },
    seatCountBlock: {
        alignItems: 'center',
        minWidth: 48,
    },
    seatCountNum: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: '#07163B',
        lineHeight: 24,
    },
    seatCountLabel: {
        fontSize: 10,
        fontFamily: Fonts.regular,
        color: '#9E9E9E',
    },
    sheetPriceCard: {
        backgroundColor: 'rgba(255,212,0,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,212,0,0.4)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 14,
    },
    sheetPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sheetPriceLabel: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    sheetPriceValue: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: '#07163B',
    },
    sheetNoteInput: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 18,
        minHeight: 50,
    },
    sheetNoteText: {
        flex: 1,
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#202223',
        padding: 0,
    },
    sendBookingBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
    },
    sendBookingText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },

    // ── Success Modal ──────────────────────────────────────────────────────
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    successCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
    },
    successIconWrap: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#E8F8EE',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 10,
    },
    successBody: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    successBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    successBtnText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
});

export default AvailableRidesScreen;
