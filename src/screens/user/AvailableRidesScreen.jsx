import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, Modal, TextInput,
    Image, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import config from '../../config';
import { useAvailableRides, useBookSeat } from '../../hooks/useAvailableRides';
import { useCities } from '../../hooks/useLookup';
import SelectSheet from '../../components/SelectSheet';

const ymd = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Build a full file URL from a storage path (e.g. "vehicles/x.jpg")
const FILE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/');
const fileUrl = (path) => (path ? `${FILE_BASE}storage/${path}` : null);

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
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
        plate: '',
        type: isPrivate ? 'Private' : 'Shared',
        online: true,
        postedAgo: '',
        carImage: fileUrl(v.vehicle_image_path),
    };
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

const AvailableRidesScreen = ({ navigation }) => {
    // Filters that are actually applied to the query (empty = show all)
    const [appliedFilters, setAppliedFilters] = useState({});
    const ridesQuery = useAvailableRides(appliedFilters);
    const rides = (ridesQuery.data || []).map(mapRide);

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
        bookMutation.mutate({ ridePostId: bookingModal.id, seats: seatsRequested, note });
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
                            <View style={styles.avatar}>
                                <Icon name="account" size={20} color="#CCCCCC" />
                            </View>
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
                        <Image
                            source={{ uri: item.carImage }}
                            style={styles.carImage}
                            resizeMode="cover"
                        />
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
                    <TouchableOpacity style={styles.chatIconBtn}>
                        <Icon name="message-outline" size={16} color="#5D5F62" />
                    </TouchableOpacity>

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

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Static header — title only */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Available Rides</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Icon name="tune-variant" size={20} color="#07163B" />
                </TouchableOpacity>
            </View>

            {/* FlatList: search card scrolls as first item, then ride cards */}
            <FlatList
                data={rides}
                keyExtractor={item => String(item.id)}
                renderItem={renderRide}
                ListHeaderComponent={<ListHeader />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                refreshing={ridesQuery.isFetching}
                onRefresh={ridesQuery.refetch}
                ListEmptyComponent={
                    ridesQuery.isLoading ? (
                        <ActivityIndicator color="#FFD400" style={{ marginTop: 40 }} />
                    ) : (
                        <View style={styles.emptyState}>
                            <Icon name="car-off" size={46} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No rides available</Text>
                            <Text style={styles.emptySub}>Check back later or adjust your search.</Text>
                        </View>
                    )
                }
            />



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
                                <View style={styles.sheetAvatar}>
                                    <Icon name="account" size={20} color="#CCCCCC" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sheetDriverName}>{bookingModal.name}</Text>
                                    <Text style={styles.sheetDriverMeta}>
                                        {bookingModal.vehicle} · {bookingModal.plate}
                                    </Text>
                                </View>
                                <Image
                                    source={{ uri: bookingModal.carImage }}
                                    style={styles.sheetCarThumb}
                                    resizeMode="cover"
                                />
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

            {/* ── Date picker ───────────────────────────────────────────────── */}
            {showDate && (
                <DateTimePicker
                    value={dateObj || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selected) => {
                        setShowDate(false);
                        if (event.type !== 'dismissed' && selected) setDateObj(selected);
                    }}
                />
            )}
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },

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

    list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

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
