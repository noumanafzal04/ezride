import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, TextInput, Switch, Platform, ActivityIndicator, Alert,
    KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import { calcPricePerSeat } from '../../constants/pricing';
import { useCities } from '../../hooks/useLookup';
import useRideRoute from '../../hooks/useRideRoute';
import useCreateRidePost from '../../hooks/useCreateRidePost';
import useRidePosts, { useCancelRidePost } from '../../hooks/useRidePosts';
import PaywallSheet from '../../components/PaywallSheet';
import useMe from '../../hooks/useMe';
import { useMembership } from '../../hooks/useSubscription';
import { getCoords } from '../../services/osrmService';
import SelectSheet from '../../components/SelectSheet';

const fmtIso = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso
        : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const POST_TYPES = [
    { id: 'shared',  label: 'Shared',  icon: 'account-group', desc: 'Sell seats to multiple riders' },
    { id: 'private', label: 'Private', icon: 'car',           desc: 'One booking takes the ride' },
];


// Date → "YYYY-MM-DD HH:mm:ss"
const fmtDateTime = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};
const fmtDisplay = (d) =>
    d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

const PostRideScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    // A driver may only have one active post — if an OPEN one exists, show it
    // (read-only) + cancel. Completed/cancelled posts are ignored so the driver
    // can post again right after ending a ride.
    const postsQuery = useRidePosts();
    const existingPost = (postsQuery.data?.ride_posts || [])
        .find(p => ['active', 'full', 'in_progress'].includes(p.status)) || null;
    // Refresh on focus so an ended/cancelled ride clears immediately.
    const refetchPosts = postsQuery.refetch;
    useFocusEffect(useCallback(() => { refetchPosts(); }, [refetchPosts]));
    const cancelExisting = useCancelRidePost({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Ride Cancelled', text2: 'You can now post a new ride.' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });
    const confirmCancelExisting = () => {
        if (!existingPost) return;
        Alert.alert('Cancel this ride?', 'Riders will no longer see it. This cannot be undone.', [
            { text: 'Keep', style: 'cancel' },
            { text: 'Cancel Ride', style: 'destructive', onPress: () => cancelExisting.mutate(existingPost.id) },
        ]);
    };

    // ── Form state ────────────────────────────────────────────────────────────
    const [postType, setPostType]           = useState('shared');
    const [fromCity, setFromCity]           = useState(null);
    const [toCity, setToCity]               = useState(null);
    const [fromAddress, setFromAddress]     = useState('');
    const [toAddress, setToAddress]         = useState('');
    const [departureAt, setDepartureAt]     = useState(null);
    const [availableSeats, setAvailableSeats] = useState(2);

    // Seats the driver can offer = vehicle capacity − 1 (their own seat excluded)
    const { data: me } = useMe();
    const isVerified = me?.driver_profile?.verification_status === 'verified';

    // Billing status (known up-front) — so we tell the driver BEFORE they fill the
    // form that their free rides / pass are used, instead of blocking on submit.
    const { data: membership, refetch: refetchMembership } = useMembership();
    const rideBilling = membership?.modules?.find(m => m.module === 'ride');
    const billingLocked = !!rideBilling?.enforcement_enabled
        && (rideBilling?.free_left ?? 0) <= 0
        && !(rideBilling?.has_active_plan && (rideBilling?.posts_left ?? 0) > 0);
    const freeLeft = rideBilling?.enforcement_enabled ? (rideBilling?.free_left ?? 0) : null;
    const vehicleSeats = me?.vehicles?.[0]?.seating_capacity || 5;
    const maxSeats = Math.max(1, vehicleSeats - 1);
    const seatOptions = Array.from({ length: maxSeats }, (_, i) => i + 1);
    const [pricePerSeat, setPricePerSeat]   = useState('');
    const [luggageAllowed] = useState(true);   // default on; not shown in the form
    const [notes, setNotes]                 = useState('');
    const [errors, setErrors]               = useState({}); // border-on-error per field
    const [seatDropOpen, setSeatDropOpen]   = useState(false);

    // ── City picker (one sheet, shared between From / To) ──────────────────────
    const [cityField, setCityField]   = useState(null); // 'from' | 'to'
    const [citySearch, setCitySearch] = useState('');
    const citiesQuery = useCities(); // load all once; filter on the frontend

    const filteredCities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
    );

    const openCity  = (field) => { setCityField(field); setCitySearch(''); };
    const closeCity = () => { setCityField(null); setCitySearch(''); };
    const onCitySelect = (city) => {
        if (cityField === 'from') setFromCity(city);
        else setToCity(city);
        closeCity();
    };

    // ── Date/Time picker (date → then time) ────────────────────────────────────
    const [showPicker, setShowPicker] = useState(false);

    // ── OSRM route + auto price ────────────────────────────────────────────────
    const routeQuery = useRideRoute(fromCity, toCity);
    const distanceKm = routeQuery.data?.distanceKm;
    const durationMin = routeQuery.data?.durationMin;

    useEffect(() => {
        if (distanceKm) setPricePerSeat(String(calcPricePerSeat(distanceKm)));
    }, [distanceKm]);

    // ── Submit ──────────────────────────────────────────────────────────────--
    const [paywallOpen, setPaywallOpen] = useState(false);
    const lastPayloadRef = useRef(null);

    const createPost = useCreateRidePost({
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Ride Posted!', text2: 'Your ride is now live for riders.' });
            // Go straight to the requests screen so the driver sees the active ride immediately.
            navigation.navigate('Main', { screen: 'Rides' });
        },
        onError: (err) => {
            // 402 = free posts used up → show the 24h pass paywall instead of a toast.
            if (err.response?.status === 402) { setPaywallOpen(true); return; }
            const msg = err.response?.data?.message || 'Could not post the ride. Please try again.';
            Toast.show({ type: 'error', text1: 'Failed', text2: msg });
        },
    });

    const validate = () => {
        const e = {};
        if (!fromCity) e.fromCity = true;
        if (!toCity) e.toCity = true;
        if (fromCity && toCity && fromCity.id === toCity.id) e.toCity = true;
        if (!fromAddress.trim()) e.fromAddress = true;
        if (!toAddress.trim()) e.toAddress = true;
        if (!departureAt || departureAt.getTime() < Date.now()) e.departureAt = true;
        if (!availableSeats || availableSeats < 1 || availableSeats > maxSeats) e.seats = true;
        if (!Number(pricePerSeat)) e.price = true;
        setErrors(e);

        if (e.fromCity) return 'Please select the departure city.';
        if (e.toCity) return (fromCity && toCity && fromCity.id === toCity.id)
            ? 'Departure and destination must differ.' : 'Please select the destination city.';
        if (e.fromAddress) return 'Please enter the pickup address.';
        if (e.toAddress) return 'Please enter the drop-off address.';
        if (e.departureAt) return 'Please choose a valid departure date & time.';
        if (e.seats) return 'Please select the number of available seats.';
        if (e.price) return 'Price per seat is required.';
        return null;
    };
    const clearError = (k) => setErrors(p => (p[k] ? { ...p, [k]: false } : p));

    const handleSubmit = () => {
        if (!isVerified) {
            Toast.show({ type: 'info', text1: 'Pending verification', text2: 'You can post rides once your account is verified.' });
            return;
        }
        const error = validate();
        if (error) {
            Toast.show({ type: 'error', text1: 'Required', text2: error });
            return;
        }

        const from = getCoords(fromCity);
        const to   = getCoords(toCity);

        const payload = {
            from_city_id:  fromCity.id,
            to_city_id:    toCity.id,
            from_address:  fromAddress.trim(),
            to_address:    toAddress.trim(),
            from_latitude:  from?.lat ?? null,
            from_longitude: from?.lng ?? null,
            to_latitude:    to?.lat ?? null,
            to_longitude:   to?.lng ?? null,
            departure_at:   fmtDateTime(departureAt),
            price_per_seat: Number(pricePerSeat),
            available_seats: availableSeats,
            luggage_allowed: luggageAllowed,
            notes:          notes.trim(),
            post_type:      postType,
        };
        lastPayloadRef.current = payload;   // kept so we can retry after buying a pass
        createPost.mutate(payload);
    };

    const submitting = createPost.isPending;

    // ── While checking for an existing post ─────────────────────────────────
    if (postsQuery.isLoading) {
        return (
            <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color="#FFD400" />
            </View>
        );
    }

    // ── Driver already has an active post → show it, only allow cancel ──────
    if (existingPost) {
        return (
            <View style={styles.root}>
                <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#07163B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Your Active Ride</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                    <View style={styles.activeBanner}>
                        <Icon name="information-outline" size={16} color="#07163B" />
                        <Text style={styles.activeBannerText}>
                            You have an active ride. Cancel it to post a new one.
                        </Text>
                    </View>

                    <View style={styles.activeCard}>
                        <View style={styles.activeRouteRow}>
                            <Text style={styles.activeRoute} numberOfLines={1}>
                                {existingPost.from?.city?.name}
                                <Text style={styles.activeArrow}>  →  </Text>
                                {existingPost.to?.city?.name}
                            </Text>
                            <View style={styles.activeSeats}>
                                <Icon name="account-multiple-outline" size={13} color="#07163B" />
                                <Text style={styles.activeSeatsText}>{existingPost.available_seats ?? '—'}</Text>
                            </View>
                        </View>

                        {!!existingPost.from?.address && (
                            <View style={styles.activeAddrRow}>
                                <Icon name="map-marker-outline" size={13} color="#5D5F62" />
                                <Text style={styles.activeAddr} numberOfLines={1}>{existingPost.from.address}</Text>
                            </View>
                        )}
                        {!!existingPost.to?.address && (
                            <View style={styles.activeAddrRow}>
                                <Icon name="map-marker-check-outline" size={13} color="#5D5F62" />
                                <Text style={styles.activeAddr} numberOfLines={1}>{existingPost.to.address}</Text>
                            </View>
                        )}

                        <View style={styles.activeChips}>
                            <View style={styles.activeChip}>
                                <Icon name="calendar-clock" size={13} color="#5D5F62" />
                                <Text style={styles.activeChipText}>{fmtIso(existingPost.departure_at)}</Text>
                            </View>
                            <View style={styles.activeChip}>
                                <Icon name="cash" size={13} color="#5D5F62" />
                                <Text style={styles.activeChipText}>Rs {Math.round(Number(existingPost.price_per_seat)).toLocaleString()} / seat</Text>
                            </View>
                            <View style={styles.activeChip}>
                                <Icon name="car-outline" size={13} color="#5D5F62" />
                                <Text style={styles.activeChipText}>{existingPost.post_type === 'private' ? 'Private' : 'Shared'}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.viewRequestsBtn}
                        onPress={() => navigation.navigate('Main', { screen: 'Rides' })}
                        activeOpacity={0.85}
                    >
                        <Icon name="account-multiple-outline" size={18} color="#111111" />
                        <Text style={styles.viewRequestsText}>View Booking Requests</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelExistingBtn}
                        onPress={confirmCancelExisting}
                        disabled={cancelExisting.isPending}
                        activeOpacity={0.85}
                    >
                        <Icon name="close-circle-outline" size={18} color="#D83F54" />
                        <Text style={styles.cancelExistingText}>
                            {cancelExisting.isPending ? 'Cancelling…' : 'Cancel Ride'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post a Ride</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
            >
                <View style={styles.body}>
                    {!isVerified && (
                        <View style={styles.verifyBanner}>
                            <Icon name="shield-alert-outline" size={18} color="#92600B" />
                            <Text style={styles.verifyText}>
                                You’re not verified yet. Once your driver profile is verified, you can post rides.
                            </Text>
                        </View>
                    )}

                    {/* Billing gate — shown up-front so the driver knows before filling the form. */}
                    {isVerified && billingLocked && (
                        <TouchableOpacity style={styles.lockBanner} activeOpacity={0.9} onPress={() => setPaywallOpen(true)}>
                            <View style={styles.lockIcon}><Icon name="lock-open-variant-outline" size={20} color="#07163B" /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.lockTitle}>Unlock posting</Text>
                                <Text style={styles.lockSub}>Your free rides are used. Get a 24-hour pass to post.</Text>
                            </View>
                            <View style={styles.lockBtn}><Text style={styles.lockBtnTxt}>Unlock</Text></View>
                        </TouchableOpacity>
                    )}
                    {isVerified && !billingLocked && freeLeft != null && freeLeft <= 2 && freeLeft > 0 && (
                        <View style={styles.freeHint}>
                            <Icon name="gift-outline" size={15} color="#0B6B22" />
                            <Text style={styles.freeHintTxt}>{freeLeft} free ride{freeLeft > 1 ? 's' : ''} left, then a 24-hour pass.</Text>
                        </View>
                    )}

                    <View style={styles.mainCard}>

                        {/* From city */}
                        <Text style={styles.label}>From</Text>
                        <TouchableOpacity style={[styles.selectBox, errors.fromCity && styles.errorBorder]} onPress={() => { clearError('fromCity'); openCity('from'); }}>
                            <Icon name="map-marker-outline" size={18} color="#9CA3AF" />
                            <Text style={fromCity ? styles.selectVal : styles.selectPH}>
                                {fromCity?.name || 'Select departure city'}
                            </Text>
                            <Icon name="chevron-down" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        {fromCity && (
                            <TextInput
                                style={[styles.input, errors.fromAddress && styles.errorBorder]}
                                placeholder="Pickup address (area, street...)"
                                placeholderTextColor="#9CA3AF"
                                value={fromAddress}
                                onChangeText={(t) => { clearError('fromAddress'); setFromAddress(t); }}
                            />
                        )}

                        {/* To city */}
                        <Text style={styles.label}>To</Text>
                        <TouchableOpacity style={[styles.selectBox, errors.toCity && styles.errorBorder]} onPress={() => { clearError('toCity'); openCity('to'); }}>
                            <Icon name="map-marker-check-outline" size={18} color="#9CA3AF" />
                            <Text style={toCity ? styles.selectVal : styles.selectPH}>
                                {toCity?.name || 'Select destination city'}
                            </Text>
                            <Icon name="chevron-down" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        {toCity && (
                            <TextInput
                                style={[styles.input, errors.toAddress && styles.errorBorder]}
                                placeholder="Drop-off address (area, street...)"
                                placeholderTextColor="#9CA3AF"
                                value={toAddress}
                                onChangeText={(t) => { clearError('toAddress'); setToAddress(t); }}
                            />
                        )}

                        {/* Distance banner */}
                        {fromCity && toCity && (
                            <View style={styles.distanceBanner}>
                                {routeQuery.isLoading ? (
                                    <Text style={styles.distanceText}>Calculating route…</Text>
                                ) : routeQuery.isError ? (
                                    <Text style={[styles.distanceText, { color: '#DC2626' }]}>
                                        Could not calculate distance
                                    </Text>
                                ) : distanceKm ? (
                                    <Text style={styles.distanceText}>
                                        <Icon name="map-marker-distance" size={13} color="#07163B" />
                                        {'  '}{distanceKm.toFixed(1)} km
                                        {durationMin ? `  ·  ~${Math.round(durationMin)} min` : ''}
                                    </Text>
                                ) : null}
                            </View>
                        )}

                        {/* Departure (75%) + Seats dropdown (25%) */}
                        <View style={[styles.row, { zIndex: 20 }]}>
                            <View style={{ flex: 3 }}>
                                <Text style={styles.label}>Departure</Text>
                                <TouchableOpacity
                                    style={[styles.selectBox, errors.departureAt && styles.errorBorder]}
                                    onPress={() => { clearError('departureAt'); setShowPicker(true); }}
                                >
                                    <Icon name="calendar-clock" size={18} color="#9CA3AF" />
                                    <Text style={departureAt ? styles.selectVal : styles.selectPH} numberOfLines={1}>
                                        {departureAt ? fmtDisplay(departureAt) : 'Select date & time'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1, zIndex: 20 }}>
                                <Text style={styles.label}>Seats</Text>
                                <View>
                                    <TouchableOpacity
                                        style={[styles.selectBox, styles.seatsSelect, errors.seats && styles.errorBorder]}
                                        onPress={() => { clearError('seats'); setSeatDropOpen(o => !o); }}
                                    >
                                        <Text style={styles.selectVal}>{availableSeats}</Text>
                                        <Icon name={seatDropOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
                                    </TouchableOpacity>
                                    {seatDropOpen && (
                                        <View style={styles.seatDropdown}>
                                            {seatOptions.map(s => (
                                                <TouchableOpacity
                                                    key={s}
                                                    style={[styles.seatOption, availableSeats === s && styles.seatOptionActive]}
                                                    onPress={() => { setAvailableSeats(s); clearError('seats'); setSeatDropOpen(false); }}
                                                >
                                                    <Text style={[styles.seatOptionTxt, availableSeats === s && styles.seatOptionTxtActive]}>{s}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                        <DatePicker
                            modal
                            open={showPicker}
                            date={departureAt || new Date()}
                            mode="datetime"
                            minimumDate={new Date()}
                            locale="en-US"
                            theme="light"
                            onConfirm={(d) => { setShowPicker(false); clearError('departureAt'); setDepartureAt(d); }}
                            onCancel={() => setShowPicker(false)}
                        />

                        {/* Fare — auto-calculated from distance, total updates with seats */}
                        <View style={styles.fareCard}>
                            {pricePerSeat ? (
                                <>
                                    <View style={styles.fareRow}>
                                        <View style={styles.fareLeft}>
                                            <Icon name="seat-passenger" size={16} color="#5D5F62" />
                                            <Text style={styles.fareLabel}>Price per seat</Text>
                                        </View>
                                        <Text style={styles.farePerSeat}>
                                            Rs {Number(pricePerSeat).toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.fareDivider} />
                                    <View style={styles.fareRow}>
                                        <Text style={styles.fareTotalLabel}>
                                            Total · {availableSeats} {availableSeats > 1 ? 'seats' : 'seat'}
                                        </Text>
                                        <Text style={styles.fareTotal}>
                                            Rs {(Number(pricePerSeat) * availableSeats).toLocaleString()}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.fareRow}>
                                    <View style={styles.fareLeft}>
                                        <Icon name="cash-multiple" size={16} color="#9CA3AF" />
                                        <Text style={styles.fareLabel}>Fare</Text>
                                    </View>
                                    <Text style={styles.farePH}>Select both cities</Text>
                                </View>
                            )}
                        </View>

                        {/* Notes */}
                        <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="e.g. No smoking please"
                            placeholderTextColor="#9CA3AF"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Fixed bottom button — sibling of the ScrollView inside the KAV, so it
                stays pinned to the bottom AND rises above the keyboard when typing. */}
            <View style={[styles.bottomBtn, { paddingBottom: 14 }]}>
                <TouchableOpacity
                    style={[styles.createBtn, (submitting || !isVerified) && styles.createBtnDisabled]}
                    onPress={() => (billingLocked ? setPaywallOpen(true) : handleSubmit())}
                    disabled={submitting || !isVerified}
                    activeOpacity={0.85}
                >
                    {billingLocked && isVerified && <Icon name="lock-open-variant-outline" size={17} color="#07163B" style={{ marginRight: 8 }} />}
                    <Text style={styles.createBtnText}>
                        {submitting ? 'Posting…'
                            : !isVerified ? 'Verification pending'
                            : billingLocked ? 'Unlock 24-Hour Pass'
                            : 'Post Ride'}
                    </Text>
                </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>

            {/* City picker sheet */}
            <SelectSheet
                visible={!!cityField}
                onClose={closeCity}
                title={cityField === 'from' ? 'Departure City' : 'Destination City'}
                items={filteredCities}
                loading={citiesQuery.isLoading}
                searchable
                search={citySearch}
                onSearch={setCitySearch}
                selectedId={cityField === 'from' ? fromCity?.id : toCity?.id}
                onSelect={onCitySelect}
            />

            {/* 24h pass paywall — opens when free posts are used (HTTP 402) */}
            <PaywallSheet
                visible={paywallOpen}
                onClose={() => setPaywallOpen(false)}
                module="ride"
                title="You've used your free rides"
                subtitle="Get a 24-hour pass to post unlimited rides."
                onSubscribed={() => { refetchMembership(); if (lastPayloadRef.current) createPost.mutate(lastPayloadRef.current); }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },

    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    // Active post view
    activeBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,212,0,0.12)', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
    },
    activeBannerText: { flex: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#07163B', lineHeight: 18 },
    activeCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE',
        padding: 16, gap: 10,
    },
    activeRouteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    activeRoute: { flex: 1, fontSize: 16, fontFamily: Fonts.semiBold, color: '#202223' },
    activeArrow: { fontFamily: Fonts.regular, color: '#9E9E9E' },
    activeSeats: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#F5F5F7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    activeSeatsText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    activeAddrRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    activeAddr: { flex: 1, fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    activeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    activeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#F5F5F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    activeChipText: { fontSize: 12, fontFamily: Fonts.medium, color: '#5D5F62' },
    cancelExistingBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 16, paddingVertical: 15, borderRadius: 12,
        borderWidth: 1.5, borderColor: '#D83F54', backgroundColor: '#FFF0F2',
    },
    cancelExistingText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#D83F54' },
    viewRequestsBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 16, paddingVertical: 15, borderRadius: 12, backgroundColor: '#FFD400',
    },
    viewRequestsText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },

    body: { padding: 16 },
    verifyBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF7ED', borderColor: '#FCD9A8', borderWidth: 1,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
    },
    verifyText: { flex: 1, fontSize: 12.5, fontFamily: Fonts.medium, color: '#92600B', lineHeight: 17 },
    mainCard: {
        backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1,
        borderColor: '#EAEDEE', padding: 16, gap: 12,
    },

    // Post type (compact)
    typeRow:        { flexDirection: 'row', gap: 10 },
    typeBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10, paddingVertical: 11 },
    typeBtnActive:  { backgroundColor: 'rgba(245,214,50,0.12)', borderColor: 'rgba(245,214,50,0.7)' },
    typeLabel:      { fontSize: 14, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    typeLabelActive:{ color: '#07163B' },

    label:    { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 2, marginTop: 4 },
    optional: { fontSize: 12, fontFamily: Fonts.regular, color: '#9CA3AF' },

    // Clean filled fields — border shows ONLY on error (errorBorder).
    row: { flexDirection: 'row', gap: 10 },
    errorBorder: { borderWidth: 1.5, borderColor: '#DC2626', backgroundColor: '#FFF5F5' },
    selectBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent',
        paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#F5F6F8',
    },
    seatsSelect: { paddingHorizontal: 12, justifyContent: 'space-between' },
    // Inline seats dropdown (no modal) — floats above siblings via zIndex + elevation.
    seatDropdown: {
        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
        backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#EAEDEE',
        overflow: 'hidden', zIndex: 30, elevation: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8,
    },
    seatOption: { paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
    seatOptionActive: { backgroundColor: 'rgba(245,214,50,0.18)' },
    seatOptionTxt: { fontSize: 14, fontFamily: Fonts.medium, color: '#5D5F62' },
    seatOptionTxtActive: { color: '#07163B', fontFamily: Fonts.semiBold },
    selectVal: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#07163B' },
    selectPH:  { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9CA3AF' },

    input: {
        borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent',
        paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#F5F6F8',
        fontFamily: Fonts.regular, fontSize: 14, color: '#07163B',
    },
    textArea: { height: 88, paddingTop: 12 },

    distanceBanner: {
        backgroundColor: 'rgba(245,214,50,0.10)', borderRadius: 10,
        paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
    },
    distanceText: { fontSize: 13, fontFamily: Fonts.medium, color: '#07163B' },

    seatsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    seatBtn: {
        width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#D7DBDE',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
    },
    seatBtnActive: { backgroundColor: 'rgba(245,214,50,0.15)', borderColor: 'rgba(245,214,50,0.7)' },
    seatText:      { fontSize: 14, fontFamily: Fonts.medium, color: '#5D5F62' },
    seatTextActive:{ color: '#07163B', fontFamily: Fonts.semiBold },

    // Fare card
    fareCard: {
        borderWidth: 1, borderColor: 'rgba(245,214,50,0.7)', borderRadius: 14,
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: 'rgba(245,214,50,0.08)',
        marginTop: 4, gap: 10,
    },
    fareRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fareLeft:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fareLabel:      { fontSize: 13, fontFamily: Fonts.medium, color: '#5D5F62' },
    farePerSeat:    { fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B' },
    fareDivider:    { height: 1, backgroundColor: 'rgba(245,214,50,0.45)' },
    fareTotalLabel: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    fareTotal:      { fontSize: 22, fontFamily: Fonts.bold, color: '#07163B' },
    farePH:         { fontSize: 13, fontFamily: Fonts.regular, color: '#9CA3AF' },

    switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
    switchLabel: { fontSize: 14, fontFamily: Fonts.medium, color: '#07163B' },
    switchSub:   { fontSize: 11, fontFamily: Fonts.regular, color: '#9CA3AF', marginTop: 1 },

    bottomBtn: {
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    createBtn:        { flexDirection: 'row', backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    createBtnDisabled:{ backgroundColor: '#E5E7EB' },
    createBtnText:    { fontSize: 16, fontFamily: Fonts.semiBold, color: '#111111' },

    // Billing gate (up-front)
    lockBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF9DB', borderWidth: 1, borderColor: '#F6E6A8', borderRadius: 14, padding: 14, marginBottom: 14 },
    lockIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFE680', alignItems: 'center', justifyContent: 'center' },
    lockTitle: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },
    lockSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#7A6A2F', marginTop: 1 },
    lockBtn: { backgroundColor: '#07163B', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
    lockBtnTxt: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#FFD400' },
    freeHint: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#E8F8EE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14 },
    freeHintTxt: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#0B6B22' },
});

export default PostRideScreen;
