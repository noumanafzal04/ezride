import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, FlatList,
    Dimensions, Image, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import config from '../../config';
import useRideDetail from '../../hooks/useRideDetail';

const { width } = Dimensions.get('window');

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
        ? new Date(p.departure_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '';
    return {
        id: p.id,
        name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Driver',
        phone: d.phone_number,
        pricePerSeat: Number(p.price_per_seat) || 0,
        seatsLeft: isPrivate ? (v.seating_capacity || 1) : (p.available_seats ?? 0),
        from: [p.from?.city?.name, p.from?.address].filter(Boolean).join(' · '),
        to: [p.to?.city?.name, p.to?.address].filter(Boolean).join(' · '),
        date: fmt,
        vehicle: [v.model?.make, v.model?.name].filter(Boolean).join(' '),
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

const REVIEWS = [
    {
        id: '1',
        name: 'Kubra Malik',
        rating: 4.0,
        time: '2 weeks ago',
        text: 'Great experience! The driver was super friendly and the ride was smooth. Would definitely use again!',
        emojis: ['👍', '😊'],
    },
    {
        id: '2',
        name: 'Bilal Hassan',
        rating: 5.0,
        time: '1 month ago',
        text: 'Punctual, clean car, and very professional. Highly recommended for long routes.',
        emojis: ['⭐', '👌'],
    },
];

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
    const [activeTab, setActiveTab] = useState(0);
    const [activeImage, setActiveImage] = useState(0);

    // Fetch fresh detail by id; merge over the passed card (which acts as fallback)
    const passed = route?.params?.offer;
    const { data: detail } = useRideDetail(passed?.id);
    const offer = detail ? { ...passed, ...mapDetail(detail) } : passed;

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
                                        {offer?.rating || 4.9} · {offer?.rides || 120} Rides
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

                    {/* ── STATS ── */}
                    <View style={styles.statsRow}>
                        {[
                            { value: '98.5%', label: 'Completion' },
                            { value: '156',   label: 'Total Trips' },
                            { value: '4.9',   label: 'Rating' },
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

                    {/* ── PRICE CARD ── */}
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Your Request</Text>
                            <Text style={styles.priceValue}>PKR 2,000</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Price Offered</Text>
                            <Text style={styles.priceOffered}>PKR 2,450</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Per Seat</Text>
                            <Text style={styles.priceSeat}>PKR 2,450</Text>
                        </View>
                    </View>

                    {/* ── TABS ── */}
                    <View style={styles.tabsRow}>
                        {TABS.map((tab, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.tab, activeTab === i && styles.tabActive]}
                                onPress={() => setActiveTab(i)}
                            >
                                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                                    {tab}{i === 0 ? ` (${REVIEWS.length})` : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── REVIEWS ── */}
                    {activeTab === 0 && REVIEWS.map(r => (
                        <View key={r.id} style={styles.reviewCard}>
                            <View style={styles.reviewTop}>
                                <View style={styles.reviewAvatar}>
                                    <Icon name="account" size={18} color="#CCCCCC" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.reviewName}>{r.name}</Text>
                                    <View style={styles.reviewStarsRow}>
                                        <StarRating rating={r.rating} />
                                        <Text style={styles.reviewTime}>{r.time}</Text>
                                    </View>
                                </View>
                                <Text style={styles.reviewScore}>{r.rating}/5</Text>
                            </View>
                            <Text style={styles.reviewText}>{r.text}</Text>
                            <View style={styles.reviewEmojis}>
                                {r.emojis.map((e, i) => (
                                    <View key={i} style={styles.emojiChip}>
                                        <Text style={styles.emojiText}>{e}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}

                    {/* ── VEHICLE INFO ── */}
                    {activeTab === 1 && (
                        <View style={styles.card}>
                            {[
                                { icon: 'car-outline',          label: 'Model',       value: 'Toyota Corolla Altis 2022' },
                                { icon: 'palette-outline',      label: 'Color',       value: 'Pearl White'               },
                                { icon: 'card-text-outline',    label: 'Plate No.',   value: 'LEA-20-5184'               },
                                { icon: 'seat-passenger',       label: 'Capacity',    value: '4 Seats'                   },
                                { icon: 'air-conditioner',      label: 'AC',          value: 'Available'                 },
                                { icon: 'shield-check-outline', label: 'Verified',    value: 'Yes — docs checked'        },
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

                    {/* ── RECENT TRIPS ── */}
                    {activeTab === 2 && (
                        <View style={styles.emptyState}>
                            <Icon name="map-marker-off-outline" size={44} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No recent trips</Text>
                            <Text style={styles.emptyDesc}>This driver's trip history will appear here.</Text>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* ── BOTTOM ACTIONS ── */}
            <View style={styles.bottomBar}>
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
                <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.bookBtnText}>Book Seat</Text>
                </TouchableOpacity>
            </View>
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
});

export default RideDetailScreen;
