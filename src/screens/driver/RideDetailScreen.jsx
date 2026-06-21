import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, FlatList,
    Dimensions, Image, Linking, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fonts from '../../constants/fonts';
import config from '../../config';
import useRideDetail, { useDriverSummary, useDriverReviews, useDriverTrips } from '../../hooks/useRideDetail';
import { useMyBookings } from '../../hooks/useMyBookings';
import { useBookSeat } from '../../hooks/useAvailableRides';

const { width } = Dimensions.get('window');

// Derive the rider's current stage on this ride (for the status section)
const RIDE_STEPS = ['Requested', 'Accepted', 'Started', 'Completed'];
const deriveStatus = (booking, rideStatus) => {
    if (booking) {
        switch (booking.status) {
            case 'pending':   return { step: 0, label: 'Request pending', color: '#D97706', bg: '#FFF7ED' };
            case 'accepted':  return rideStatus === 'in_progress'
                ? { step: 2, label: 'Ride in progress', color: '#1D6AFF', bg: '#EEF4FF' }
                : { step: 1, label: 'Booking confirmed', color: '#109F2A', bg: '#E8F8EE' };
            case 'completed': return { step: 3, label: 'Ride completed', color: '#1D6AFF', bg: '#EEF4FF' };
            case 'rejected':  return { step: -1, label: 'Request declined', color: '#D83F54', bg: '#FFF0F2' };
            case 'cancelled': return { step: -1, label: 'Booking cancelled', color: '#5D5F62', bg: '#F1F2F4' };
            default: break;
        }
    }
    switch (rideStatus) {
        case 'completed':   return { step: 3, label: 'Ride completed', color: '#1D6AFF', bg: '#EEF4FF' };
        case 'in_progress': return { step: 2, label: 'Ride in progress', color: '#1D6AFF', bg: '#EEF4FF' };
        case 'full':        return { step: 1, label: 'Fully booked', color: '#D97706', bg: '#FFF7ED' };
        case 'active':      return { step: 0, label: 'Open for booking', color: '#109F2A', bg: '#E8F8EE' };
        default:            return null;
    }
};

// Build a full file URL from a storage path
const FILE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/');
const fileUrl = (p) => (p ? `${FILE_BASE}storage/${p}` : null);

// Map backend ride-post detail → the card shape this screen renders (omit
// fields not in the detail response so the passed values stay as fallback)
const mapDetail = (p) => {
    const d = p.driver || {};
    const v = d.vehicle || {};
    const isPrivate = p.post_type === 'private';
    const fmt = p.departure_at
        ? new Date(p.departure_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
        : '';
    return {
        id: p.id,
        status: p.status,
        driverId: d.id,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Driver',
        phone: d.phone_number,
        pricePerSeat: Number(p.price_per_seat) || 0,
        seatsLeft: isPrivate ? (v.seating_capacity || 1) : (p.available_seats ?? 0),
        from: [p.from?.city?.name, p.from?.address].filter(Boolean).join(' · '),
        to: [p.to?.city?.name, p.to?.address].filter(Boolean).join(' · '),
        date: fmt,
        vehicle: [v.model?.make, v.model?.name].filter(Boolean).join(' '),
        color: v.color,
        plate: v.registration_number,
        capacity: v.seating_capacity,
        ac: v.has_air_conditioner,
        year: v.manufacture_year,
        type: isPrivate ? 'Private' : 'Shared',
        carImage: fileUrl(v.vehicle_image_path) || undefined,
    };
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CAR_IMAGES = [
    'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80',
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
];

const TABS = ['Reviews', 'Vehicle Info', 'Recent Trips'];

const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return '';
    const d = Math.floor(diff / 86400000);
    if (d < 1) return 'today';
    if (d < 7) return `${d}d ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    return `${Math.floor(d / 30)}mo ago`;
};

const tripDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const StarRating = ({ rating }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Icon
                key={i}
                name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half-full' : 'star-outline'}
                size={12}
                color="#F5A247"
            />
        ))}
    </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

const RideDetailScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState(0);
    const [activeImage, setActiveImage] = useState(0);

    // Fetch fresh detail by id; merge over the passed card (which acts as fallback)
    const passed = route?.params?.offer;
    const { data: detail } = useRideDetail(passed?.id);
    const offer = detail ? { ...passed, ...mapDetail(detail) } : passed;

    // The rider's live status on this ride (where they currently are in the flow)
    const myBookings = useMyBookings().data || [];
    const myBooking = myBookings.find(b => b.ride?.id === offer?.id);
    const status = deriveStatus(myBooking, offer?.status);

    // Only show "Book Seat" when the rider has no booking yet and the ride is open.
    // Otherwise the bar shows just Message + Call (the Call button flexes to fill).
    const canBook = !['pending', 'accepted', 'completed'].includes(myBooking?.status) && offer?.status === 'active';

    // ── Booking sheet (works from any entry point, incl. a notification) ──────
    const qc = useQueryClient();
    const [bookingOpen, setBookingOpen] = useState(false);
    const [seats, setSeats] = useState(1);
    const [note, setNote] = useState('');
    const maxSeats = Math.max(1, offer?.seatsLeft || 1);
    const total = (offer?.pricePerSeat || 0) * seats;

    const bookSeat = useBookSeat({
        onSuccess: () => {
            setBookingOpen(false);
            qc.invalidateQueries({ queryKey: ['my-bookings'] });
            qc.invalidateQueries({ queryKey: ['available-rides'] });
            Toast.show({ type: 'success', text1: 'Request sent', text2: 'You’ll be notified when the driver responds.' });
        },
        onError: (err) => Toast.show({ type: 'error', text1: 'Booking failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const openBooking = () => { setSeats(1); setNote(''); setBookingOpen(true); };
    const sendBooking = () => offer?.id && bookSeat.mutate({ ridePostId: offer.id, seats, note });

    // Driver's real aggregates + paginated reviews/trips
    const { data: summary } = useDriverSummary(offer?.driverId);
    const reviewsQ = useDriverReviews(offer?.driverId);
    const tripsQ = useDriverTrips(offer?.driverId, activeTab === 2);
    const reviews = (reviewsQ.data?.pages || []).flatMap(p => p.reviews || []);
    const recentTrips = (tripsQ.data?.pages || []).flatMap(p => p.trips || []);

    // Load more of the active tab when the page scrolls near the bottom
    const onScroll = (e) => {
        const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
        if (layoutMeasurement.height + contentOffset.y < contentSize.height - 400) return;
        if (activeTab === 0 && reviewsQ.hasNextPage && !reviewsQ.isFetchingNextPage) reviewsQ.fetchNextPage();
        if (activeTab === 2 && tripsQ.hasNextPage && !tripsQ.isFetchingNextPage) tripsQ.fetchNextPage();
    };

    // Real vehicle photo if we have one, otherwise the placeholder gallery
    const images = offer?.carImage ? [offer.carImage] : CAR_IMAGES;

    const onImageScroll = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveImage(index);
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 110 }}
                onScroll={onScroll}
                scrollEventThrottle={200}
            >
                {/* ── CAR IMAGE SWIPER ── */}
                <View style={styles.imageSection}>
                    <FlatList
                        data={images}
                        keyExtractor={(_, i) => String(i)}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={onImageScroll}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => (
                            <Image
                                source={{ uri: item }}
                                style={styles.carImage}
                                resizeMode="cover"
                            />
                        )}
                    />

                    {/* Back button overlay */}
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Image counter */}
                    <View style={styles.imageCounter}>
                        <Icon name="camera-outline" size={12} color="#FFFFFF" />
                        <Text style={styles.imageCounterText}>
                            {activeImage + 1}/{images.length}
                        </Text>
                    </View>

                    {/* Dot indicators */}
                    <View style={styles.imageDots}>
                        {images.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.imageDot,
                                    i === activeImage && styles.imageDotActive,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.body}>

                    {/* ── DRIVER + VEHICLE ── */}
                    <View style={styles.driverCard}>
                        <View style={styles.driverLeft}>
                            <View style={styles.avatar}>
                                <Icon name="account" size={28} color="#CCCCCC" />
                            </View>
                            <View>
                                <Text style={styles.driverName}>
                                    {offer?.name || 'Amir Shehzad'}
                                </Text>
                                <View style={styles.ratingRow}>
                                    <Icon name="star" size={13} color="#F5A247" />
                                    <Text style={styles.ratingText}>
                                        {summary?.rating_avg ? Number(summary.rating_avg).toFixed(1) : 'New'} · {summary?.total_trips ?? 0} trips
                                    </Text>
                                </View>
                                <View style={styles.onlineRow}>
                                    <View style={styles.onlineDot} />
                                    <Text style={styles.onlineText}>Online</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.vehicleBlock}>
                            <Text style={styles.vehicleName}>
                                {offer?.vehicle || 'Toyota Corolla Altis'}
                            </Text>
                            <View style={styles.platePill}>
                                <Text style={styles.plateText}>
                                    {offer?.plate || 'LEA-20-5184'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── STATS (real) ── */}
                    <View style={styles.statsRow}>
                        {[
                            { value: String(summary?.reviews_count ?? 0), label: 'Reviews' },
                            { value: String(summary?.total_trips ?? 0), label: 'Trips' },
                            { value: summary?.rating_avg ? Number(summary.rating_avg).toFixed(1) : '—', label: 'Rating' },
                        ].map((stat, i, arr) => (
                            <React.Fragment key={stat.label}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                </View>
                                {i < arr.length - 1 && <View style={styles.statDivider} />}
                            </React.Fragment>
                        ))}
                    </View>

                    {/* ── CURRENT STATUS ── */}
                    {status && (
                        <View style={styles.card}>
                            <View style={styles.statusTop}>
                                <Text style={styles.cardTitle}>Current Status</Text>
                                <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                                    <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
                                </View>
                            </View>

                            {status.step >= 0 && (
                                <>
                                    <View style={styles.stepperRow}>
                                        {RIDE_STEPS.map((s, i) => (
                                            <React.Fragment key={s}>
                                                {i > 0 && (
                                                    <View style={[styles.stepConnector, i <= status.step && styles.stepConnectorActive]} />
                                                )}
                                                <View style={[styles.stepDot, i <= status.step && styles.stepDotActive]}>
                                                    {i < status.step && <Icon name="check" size={11} color="#FFFFFF" />}
                                                </View>
                                            </React.Fragment>
                                        ))}
                                    </View>
                                    <View style={styles.stepLabelsRow}>
                                        {RIDE_STEPS.map((s, i) => (
                                            <Text
                                                key={s}
                                                style={[styles.stepLabel, i <= status.step && styles.stepLabelActive]}
                                            >
                                                {s}
                                            </Text>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* ── ROUTE CARD ── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Ride Details</Text>
                        <View style={styles.routeBlock}>
                            {/* From */}
                            <View style={styles.routeRow}>
                                <View style={styles.routeDotGreen} />
                                <View style={styles.routeTextBlock}>
                                    <Text style={styles.routeCity}>Lahore</Text>
                                    <Text style={styles.routeAddress} numberOfLines={1}>
                                        Valencia Housing Society, Defence Road
                                    </Text>
                                </View>
                            </View>
                            {/* Line */}
                            <View style={styles.routeLineWrap}>
                                <View style={styles.routeLine} />
                            </View>
                            {/* To */}
                            <View style={styles.routeRow}>
                                <View style={styles.routeDotNavy} />
                                <View style={styles.routeTextBlock}>
                                    <Text style={styles.routeCity}>Islamabad</Text>
                                    <Text style={styles.routeAddress} numberOfLines={1}>
                                        Satellite Town, City Center
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.cardDivider} />

                        {/* Date + seats + type */}
                        <View style={styles.rideMeta}>
                            <View style={styles.rideMetaChip}>
                                <Icon name="calendar-outline" size={13} color="#5D5F62" />
                                <Text style={styles.rideMetaText}>Jan 12, 2025 · Wed · 6:00 pm</Text>
                            </View>
                            <View style={styles.rideMetaChip}>
                                <Icon name="account-multiple-outline" size={13} color="#5D5F62" />
                                <Text style={styles.rideMetaText}>2 seats left of 4</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── FARE ── */}
                    {myBooking ? (
                        <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Per seat</Text>
                                <Text style={styles.priceValue}>Rs {Number(myBooking.price_per_seat || 0).toLocaleString()}</Text>
                            </View>
                            <View style={styles.priceDivider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Seats</Text>
                                <Text style={styles.priceValue}>{myBooking.seats_booked}</Text>
                            </View>
                            <View style={styles.priceDivider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Total fare</Text>
                                <Text style={styles.priceOffered}>Rs {Number(myBooking.total_amount || 0).toLocaleString()}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Fare · per seat</Text>
                                <Text style={styles.priceOffered}>Rs {Number(offer?.pricePerSeat || 0).toLocaleString()}</Text>
                            </View>
                        </View>
                    )}

                    {/* ── TABS ── */}
                    <View style={styles.tabsRow}>
                        {TABS.map((tab, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.tab, activeTab === i && styles.tabActive]}
                                onPress={() => setActiveTab(i)}
                            >
                                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                                    {tab}{i === 0 && reviews.length ? ` (${reviews.length})` : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── REVIEWS (real, paginated) ── */}
                    {activeTab === 0 && (
                        reviewsQ.isLoading ? (
                            <ActivityIndicator color="#FFD400" style={{ marginTop: 30 }} />
                        ) : reviews.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="star-outline" size={44} color="#DDDDDD" />
                                <Text style={styles.emptyTitle}>No reviews yet</Text>
                                <Text style={styles.emptyDesc}>Reviews from riders will appear here.</Text>
                            </View>
                        ) : (
                            <>
                                {reviews.map(r => (
                                    <View key={r.id} style={styles.reviewCard}>
                                        <View style={styles.reviewTop}>
                                            <View style={styles.reviewAvatar}>
                                                <Icon name="account" size={18} color="#CCCCCC" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.reviewName}>{r.from_name}</Text>
                                                <View style={styles.reviewStarsRow}>
                                                    <StarRating rating={r.rating} />
                                                    <Text style={styles.reviewTime}>{timeAgo(r.created_at)}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.reviewScore}>{r.rating}/5</Text>
                                        </View>
                                        {!!r.review && <Text style={styles.reviewText}>{r.review}</Text>}
                                    </View>
                                ))}
                                {reviewsQ.isFetchingNextPage && <ActivityIndicator color="#FFD400" style={{ marginVertical: 14 }} />}
                            </>
                        )
                    )}

                    {/* ── VEHICLE INFO (real) ── */}
                    {activeTab === 1 && (
                        <View style={styles.card}>
                            {[
                                { icon: 'car-outline',       label: 'Model',            value: [offer?.vehicle, offer?.year].filter(Boolean).join(' ') || '—' },
                                { icon: 'palette-outline',   label: 'Color',            value: offer?.color || '—' },
                                { icon: 'card-text-outline', label: 'Plate No.',        value: offer?.plate || '—' },
                                { icon: 'seat-passenger',    label: 'Capacity',         value: offer?.capacity ? `${offer.capacity} Seats` : '—' },
                                { icon: 'air-conditioner',   label: 'Air Conditioning', value: offer?.ac ? 'Available' : 'Not available' },
                            ].map((row, i, arr) => (
                                <React.Fragment key={row.label}>
                                    <View style={styles.vehicleRow}>
                                        <View style={styles.vehicleRowLeft}>
                                            <Icon name={row.icon} size={16} color="#9E9E9E" />
                                            <Text style={styles.vehicleRowLabel}>{row.label}</Text>
                                        </View>
                                        <Text style={styles.vehicleRowValue}>{row.value}</Text>
                                    </View>
                                    {i < arr.length - 1 && <View style={styles.cardDivider} />}
                                </React.Fragment>
                            ))}
                        </View>
                    )}

                    {/* ── RECENT TRIPS (real, paginated) ── */}
                    {activeTab === 2 && (
                        tripsQ.isLoading ? (
                            <ActivityIndicator color="#FFD400" style={{ marginTop: 30 }} />
                        ) : recentTrips.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="map-marker-off-outline" size={44} color="#DDDDDD" />
                                <Text style={styles.emptyTitle}>No recent trips</Text>
                                <Text style={styles.emptyDesc}>This driver's trip history will appear here.</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.card}>
                                    {recentTrips.map((t, i, arr) => (
                                        <React.Fragment key={t.id}>
                                            <View style={styles.tripRow}>
                                                <Icon name="map-marker-path" size={18} color="#9E9E9E" />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.tripRoute} numberOfLines={1}>
                                                        {t.from_city} → {t.to_city}
                                                    </Text>
                                                    <Text style={styles.tripDate}>{tripDate(t.departure_at)}</Text>
                                                </View>
                                                <View style={styles.tripTypePill}>
                                                    <Text style={styles.tripTypeText}>
                                                        {t.post_type === 'private' ? 'Private' : 'Shared'}
                                                    </Text>
                                                </View>
                                            </View>
                                            {i < arr.length - 1 && <View style={styles.cardDivider} />}
                                        </React.Fragment>
                                    ))}
                                </View>
                                {tripsQ.isFetchingNextPage && <ActivityIndicator color="#FFD400" style={{ marginVertical: 14 }} />}
                            </>
                        )
                    )}

                </View>
            </ScrollView>

            {/* ── BOTTOM ACTIONS ── */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity style={styles.chatBtn}>
                    <Icon name="message-outline" size={18} color="#07163B" />
                    <Text style={styles.chatBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => offer?.phone && Linking.openURL(`tel:${offer.phone}`)}
                >
                    <Icon name="phone" size={18} color="#07163B" />
                    <Text style={styles.callBtnText}>Call Driver</Text>
                </TouchableOpacity>
                {canBook && (
                    <TouchableOpacity style={styles.bookBtn} onPress={openBooking}>
                        <Text style={styles.bookBtnText}>Book Seat</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Booking sheet ── */}
            <Modal visible={bookingOpen} transparent animationType="slide" onRequestClose={() => setBookingOpen(false)}>
                <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setBookingOpen(false)} />
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>Book a Seat</Text>
                    <Text style={styles.sheetRoute} numberOfLines={1}>{offer?.from} → {offer?.to}</Text>

                    <View style={styles.seatRow}>
                        <Text style={styles.seatLabel}>Seats</Text>
                        <View style={styles.stepper}>
                            <TouchableOpacity
                                style={[styles.stepBtn, seats <= 1 && styles.stepBtnOff]}
                                onPress={() => setSeats(s => Math.max(1, s - 1))}
                                disabled={seats <= 1}
                            >
                                <Icon name="minus" size={18} color={seats <= 1 ? '#CCCCCC' : '#07163B'} />
                            </TouchableOpacity>
                            <Text style={styles.seatCount}>{seats}</Text>
                            <TouchableOpacity
                                style={[styles.stepBtn, seats >= maxSeats && styles.stepBtnOff]}
                                onPress={() => setSeats(s => Math.min(maxSeats, s + 1))}
                                disabled={seats >= maxSeats}
                            >
                                <Icon name="plus" size={18} color={seats >= maxSeats ? '#CCCCCC' : '#07163B'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TextInput
                        style={styles.noteInput}
                        placeholder="Add a note for the driver (optional)"
                        placeholderTextColor="#AAAAAA"
                        value={note}
                        onChangeText={setNote}
                        multiline
                    />

                    <TouchableOpacity style={styles.sendBtn} onPress={sendBooking} disabled={bookSeat.isPending} activeOpacity={0.85}>
                        <Text style={styles.sendBtnText}>
                            {bookSeat.isPending ? 'Sending…' : `Send Request · Rs ${Number(total).toLocaleString()}`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },

    // Image swiper
    imageSection: {
        width,
        height: 240,
        position: 'relative',
        backgroundColor: '#1A1A2E',
    },
    carImage: {
        width,
        height: 240,
    },
    backBtn: {
        position: 'absolute',
        top: 52,
        left: 16,
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center', justifyContent: 'center',
    },
    imageCounter: {
        position: 'absolute',
        top: 52, right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 8,
        paddingHorizontal: 9, paddingVertical: 4,
    },
    imageCounterText: {
        fontSize: 11,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    imageDots: {
        position: 'absolute',
        bottom: 12,
        alignSelf: 'center',
        left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    imageDot: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    imageDotActive: {
        width: 14,
        backgroundColor: '#FFFFFF',
    },

    body: { padding: 16 },

    // Driver card
    driverCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    driverLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: '#F0F0F0',
        alignItems: 'center', justifyContent: 'center',
    },
    driverName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 2,
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
    ratingText: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    onlineDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#109F2A',
    },
    onlineText: { fontSize: 11, fontFamily: Fonts.regular, color: '#109F2A' },
    vehicleBlock: { alignItems: 'flex-end', gap: 6 },
    vehicleName: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        textAlign: 'right',
    },
    platePill: {
        backgroundColor: '#F5F5F7',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    plateText: { fontSize: 11, fontFamily: Fonts.semiBold, color: '#5D5F62' },

    // Stats
    statsRow: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        flexDirection: 'row',
        marginBottom: 12,
        overflow: 'hidden',
    },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
    statDivider: { width: 1, backgroundColor: '#F0F0F0' },
    statValue: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B', marginBottom: 2 },
    statLabel: { fontSize: 11, fontFamily: Fonts.regular, color: '#9E9E9E' },

    // Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 14,
    },
    cardDivider: { height: 1, backgroundColor: '#F5F5F7', marginVertical: 10 },

    // ── Current status section ──
    statusTop: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
    },
    statusPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    statusPillText: { fontSize: 12, fontFamily: Fonts.semiBold },
    stepperRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
    stepDot: {
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    stepDotActive: { backgroundColor: '#109F2A' },
    stepConnector: { flex: 1, height: 3, backgroundColor: '#EAEDEE', marginHorizontal: 2 },
    stepConnectorActive: { backgroundColor: '#109F2A' },
    stepLabelsRow: { flexDirection: 'row', marginTop: 8 },
    stepLabel: { flex: 1, fontSize: 10, fontFamily: Fonts.regular, color: '#9AA0A6', textAlign: 'center' },
    stepLabelActive: { color: '#07163B', fontFamily: Fonts.medium },

    // ── Recent trips rows ──
    tripRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    tripRoute: { fontSize: 13.5, fontFamily: Fonts.semiBold, color: '#202223' },
    tripDate: { fontSize: 11.5, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 2 },
    tripTypePill: { borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
    tripTypeText: { fontSize: 11, fontFamily: Fonts.regular, color: '#5D5F62' },

    // Route block
    routeBlock: { gap: 0 },
    routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    routeDotGreen: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#109F2A', marginTop: 4,
    },
    routeDotNavy: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#07163B', marginTop: 4,
    },
    routeLineWrap: { paddingLeft: 4, paddingVertical: 3 },
    routeLine: {
        width: 1.5, height: 20,
        backgroundColor: '#EAEDEE',
    },
    routeTextBlock: { flex: 1, gap: 1 },
    routeCity: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    routeAddress: { fontSize: 12, fontFamily: Fonts.regular, color: '#9E9E9E' },

    // Ride meta chips
    rideMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    rideMetaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F5F5F7',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    rideMetaText: { fontSize: 12, fontFamily: Fonts.medium, color: '#5D5F62' },

    // Price card
    priceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    priceDivider: { height: 1, backgroundColor: '#F5F5F7' },
    priceLabel: { fontSize: 13, fontFamily: Fonts.regular, color: '#9E9E9E' },
    priceValue: { fontSize: 13, fontFamily: Fonts.medium, color: '#202223' },
    priceOffered: { fontSize: 15, fontFamily: Fonts.bold, color: '#07163B' },
    priceSeat: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#109F2A' },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
        marginBottom: 14,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#07163B' },
    tabText: { fontSize: 13, fontFamily: Fonts.medium, color: '#AAAAAA' },
    tabTextActive: { color: '#07163B', fontFamily: Fonts.semiBold },

    // Reviews
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        marginBottom: 10,
    },
    reviewTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    reviewAvatar: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: '#F0F0F0',
        alignItems: 'center', justifyContent: 'center',
    },
    reviewName: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 3 },
    reviewStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewTime: { fontSize: 10, fontFamily: Fonts.regular, color: '#CCCCCC' },
    reviewScore: { fontSize: 13, fontFamily: Fonts.bold, color: '#F5A247' },
    reviewText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        lineHeight: 18,
        marginBottom: 10,
    },
    reviewEmojis: { flexDirection: 'row', gap: 6 },
    emojiChip: {
        backgroundColor: '#F5F5F7',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    emojiText: { fontSize: 14 },

    // Vehicle info rows
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    vehicleRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    vehicleRowLabel: { fontSize: 13, fontFamily: Fonts.regular, color: '#9E9E9E' },
    vehicleRowValue: { fontSize: 13, fontFamily: Fonts.medium, color: '#202223' },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#CCCCCC' },
    emptyDesc: { fontSize: 12, fontFamily: Fonts.regular, color: '#DDDDDD' },

    // Bottom bar
    bottomBar: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 28,
    },
    chatBtn: {
        width: 48, height: 48, borderRadius: 12,
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    chatBtnText: { fontSize: 10, fontFamily: Fonts.medium, color: '#07163B' },
    callBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    callBtnText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },
    bookBtn: {
        flex: 1.4,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FFD400',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookBtnText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },

    // Booking sheet
    sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontFamily: Fonts.semiBold, color: '#07163B' },
    sheetRoute: { fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62', marginTop: 4, marginBottom: 18 },
    seatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    seatLabel: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    stepBtn: {
        width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
    },
    stepBtnOff: { borderColor: '#F0F0F0', backgroundColor: '#FAFAFA' },
    seatCount: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B', minWidth: 24, textAlign: 'center' },
    noteInput: {
        borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 10, padding: 12, minHeight: 56,
        fontSize: 13, fontFamily: Fonts.regular, color: '#202223', textAlignVertical: 'top', marginBottom: 18,
    },
    sendBtn: { backgroundColor: '#FFD400', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    sendBtnText: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default RideDetailScreen;
