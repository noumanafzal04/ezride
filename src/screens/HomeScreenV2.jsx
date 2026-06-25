import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, FlatList, Dimensions, Image,
    BackHandler, ToastAndroid, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import Sidebar from '../components/Sidebar';
import useUserStore from '../store/userStore';
import { useApp } from '../context/AppContext';
import { useUnreadCount } from '../hooks/useNotifications';
import { useServiceCategories } from '../hooks/useServices';
import { useAvailableRides } from '../hooks/useAvailableRides';
import { useCarListings } from '../hooks/useMarketplace';
import { useCurrentLocation } from '../hooks/useLocation';
import { fileUrl } from '../utils/media';
import { formatMoney } from '../utils/money';

const { width } = Dimensions.get('window');
const PROMO_W = width - 32;

const NAVY = '#07163B';
const YELLOW = '#FFD400';

// Every module, surfaced as a launcher tile. Rider + driver share most;
// the driver gets "Post Ride", the rider gets "History".
const MODULES_USER = [
    { key: 'find', icon: 'car-multiple', label: 'Find Ride', route: 'AvailableRides', tint: '#EEF4FF', ic: '#1D6AFF' },
    { key: 'rent', icon: 'car-key', label: 'Rent a Car', route: 'Rentals', tint: '#FFF1F2', ic: '#E11D48' },
    { key: 'services', icon: 'wrench-outline', label: 'Services', route: 'Services', tint: '#EDFFF4', ic: '#16A34A' },
    { key: 'buysell', icon: 'tag-outline', label: 'Buy / Sell', route: 'Marketplace', tint: '#FFF7ED', ic: '#EA580C' },
    { key: 'inspect', icon: 'clipboard-check-outline', label: 'Inspection', route: 'InspectionRequest', tint: '#F3EEFF', ic: '#7C3AED' },
    { key: 'history', icon: 'history', label: 'History', route: 'History', tint: '#EEF1F8', ic: '#07163B' },
];
const MODULES_DRIVER = [
    { key: 'post', icon: 'plus-circle-outline', label: 'Post Ride', route: 'PostRide', tint: '#FFF7DB', ic: '#92600B' },
    { key: 'find', icon: 'car-multiple', label: 'Find Ride', route: 'AvailableRides', tint: '#EEF4FF', ic: '#1D6AFF' },
    { key: 'rent', icon: 'car-key', label: 'Rent a Car', route: 'Rentals', tint: '#FFF1F2', ic: '#E11D48' },
    { key: 'services', icon: 'wrench-outline', label: 'Services', route: 'Services', tint: '#EDFFF4', ic: '#16A34A' },
    { key: 'buysell', icon: 'tag-outline', label: 'Buy / Sell', route: 'Marketplace', tint: '#FFF7ED', ic: '#EA580C' },
    { key: 'inspect', icon: 'clipboard-check-outline', label: 'Inspection', route: 'InspectionRequest', tint: '#F3EEFF', ic: '#7C3AED' },
];

// Brand promo cards — solid brand colours + a watermark icon (no external images,
// no fake listings). Each points to a real module.
const PROMOS = [
    { id: 'rent', bg: '#0B1F44', accent: YELLOW, icon: 'car-key', eyebrow: 'Rent a Car', title: 'Self-drive or with driver', sub: 'Daily rentals near you', route: 'Rentals' },
    { id: 'inspect', bg: '#10331F', accent: '#4ADE80', icon: 'clipboard-check-outline', eyebrow: 'Buying used?', title: '120-point inspection', sub: 'Certified report before you pay', route: 'InspectionRequest' },
    { id: 'sell', bg: '#2A1A40', accent: '#C4B5FD', icon: 'tag-outline', eyebrow: 'Buy / Sell', title: 'List your car free', sub: 'Reach buyers near you', route: 'Marketplace' },
];

const fmtRideTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const HomeScreenV2 = ({ navigation }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { role } = useApp();
    const isDriver = role === 'driver';
    const modules = isDriver ? MODULES_DRIVER : MODULES_USER;

    const user = useUserStore(s => s.user);
    const firstName = user?.first_name || 'there';
    const initial = (user?.first_name?.[0] || 'E').toUpperCase();
    const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();

    const { data: notifUnread = 0 } = useUnreadCount();
    const { data: serviceCats = [] } = useServiceCategories();
    const { city } = useCurrentLocation();

    const ridesQuery = useAvailableRides({});
    const nearbyRides = (ridesQuery.data?.pages?.[0]?.ride_posts || []).slice(0, 3);

    const listingsQuery = useCarListings({});
    const featuredCars = (listingsQuery.data?.pages?.[0]?.listings || []).slice(0, 6);

    const [activePromo, setActivePromo] = useState(0);
    const lastBack = useRef(0);

    useFocusEffect(
        useCallback(() => {
            const onBack = () => {
                const now = Date.now();
                if (now - lastBack.current < 2000) { BackHandler.exitApp(); return true; }
                lastBack.current = now;
                if (Platform.OS === 'android') ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
                return true;
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
            return () => sub.remove();
        }, [])
    );

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor={NAVY} barStyle="light-content" />

            {/* ── HERO ── */}
            <View style={styles.hero}>
                <View style={styles.heroTop}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={hit}>
                        <Icon name="menu" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.logo}>EZRide</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} hitSlop={hit} style={styles.bellBtn}>
                        <Icon name="bell-outline" size={22} color="#FFFFFF" />
                        {notifUnread > 0 && <View style={styles.bellDot} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.heroGreetRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.heroGreet}>{greeting},</Text>
                        <Text style={styles.heroName} numberOfLines={1}>{firstName} 👋</Text>
                    </View>
                    <TouchableOpacity style={styles.heroAvatar} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
                        <Text style={styles.heroAvatarTxt}>{initial}</Text>
                    </TouchableOpacity>
                </View>

                {/* Search bar — primary entry into the search hub */}
                <TouchableOpacity style={styles.searchBar} activeOpacity={0.9} onPress={() => navigation.navigate('Discover')}>
                    <Icon name="magnify" size={20} color="#9AA0A6" />
                    <Text style={styles.searchPlaceholder}>Search rides, services, cars…</Text>
                    {!!city?.name && (
                        <View style={styles.locChip}>
                            <Icon name="map-marker" size={12} color={NAVY} />
                            <Text style={styles.locChipTxt} numberOfLines={1}>{city.name}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* ── MODULE LAUNCHER (overlaps hero) ── */}
                <View style={styles.gridCard}>
                    {modules.map(m => (
                        <TouchableOpacity key={m.key} style={styles.gridTile} activeOpacity={0.75} onPress={() => navigation.navigate(m.route)}>
                            <View style={[styles.gridIcon, { backgroundColor: m.tint }]}>
                                <Icon name={m.icon} size={23} color={m.ic} />
                            </View>
                            <Text style={styles.gridLabel} numberOfLines={1}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── PROMO CAROUSEL ── */}
                <View style={styles.promoSection}>
                    <FlatList
                        data={PROMOS}
                        keyExtractor={p => p.id}
                        horizontal
                        pagingEnabled
                        snapToInterval={PROMO_W + 12}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.promoList}
                        onScroll={(e) => setActivePromo(Math.round(e.nativeEvent.contentOffset.x / (PROMO_W + 12)))}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.promoCard, { backgroundColor: item.bg }]} activeOpacity={0.9} onPress={() => navigation.navigate(item.route)}>
                                <Icon name={item.icon} size={120} color="rgba(255,255,255,0.06)" style={styles.promoWatermark} />
                                <Text style={styles.promoEyebrow}>{item.eyebrow}</Text>
                                <Text style={styles.promoTitle}>{item.title}</Text>
                                <Text style={styles.promoSub}>{item.sub}</Text>
                                <View style={[styles.promoBtn, { backgroundColor: item.accent }]}>
                                    <Text style={styles.promoBtnTxt}>Explore</Text>
                                    <Icon name="arrow-right" size={13} color={NAVY} />
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                    <View style={styles.dots}>
                        {PROMOS.map((_, i) => <View key={i} style={[styles.dot, i === activePromo && styles.dotActive]} />)}
                    </View>
                </View>

                {/* ── CAR SERVICES (compact chips) ── */}
                {serviceCats.length > 0 && (
                    <>
                        <SectionHead title="Car Services" actionLabel="See all" onAction={() => navigation.navigate('Services')} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                            {serviceCats.slice(0, 10).map(c => (
                                <TouchableOpacity key={c.id} style={styles.svcChip} activeOpacity={0.8} onPress={() => navigation.navigate('ServiceProviders', { category: c })}>
                                    <View style={styles.svcChipIcon}><Icon name={c.icon || 'wrench'} size={20} color={NAVY} /></View>
                                    <Text style={styles.svcChipTxt} numberOfLines={1}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                {/* ── RIDES NEAR YOU ── */}
                <SectionHead
                    title="Rides near you"
                    sub={city?.name ? `From ${city.name} & nearby` : 'Popular routes near you'}
                    actionLabel="View all"
                    onAction={() => navigation.navigate('AvailableRides')}
                />
                {ridesQuery.isLoading ? (
                    <View style={styles.softCard}><Text style={styles.muted}>Finding rides…</Text></View>
                ) : nearbyRides.length === 0 ? (
                    <View style={[styles.softCard, { alignItems: 'center', gap: 8 }]}>
                        <Icon name="car-off" size={28} color="#DDDDDD" />
                        <Text style={styles.muted}>No rides available right now.</Text>
                    </View>
                ) : (
                    <View style={styles.ridesWrap}>
                        {nearbyRides.map((ride) => {
                            const seats = ride.post_type === 'private' ? null : ride.available_seats;
                            return (
                                <TouchableOpacity key={ride.id} style={styles.rideCard} activeOpacity={0.85} onPress={() => navigation.navigate('AvailableRides')}>
                                    <View style={styles.rideRoute}>
                                        <View style={styles.dotGreen} />
                                        <View style={styles.rideLine} />
                                        <View style={styles.dotNavy} />
                                    </View>
                                    <View style={styles.rideCities}>
                                        <Text style={styles.rideCity} numberOfLines={1}>{ride.from?.city?.name || '—'}</Text>
                                        <Text style={styles.rideCity} numberOfLines={1}>{ride.to?.city?.name || '—'}</Text>
                                    </View>
                                    <View style={styles.rideRight}>
                                        <Text style={styles.ridePrice}>{formatMoney(ride.price_per_seat)}</Text>
                                        <Text style={styles.rideMetaTxt}>{seats != null ? `${seats} seats` : 'Private'}</Text>
                                        <Text style={styles.rideMetaTxt}>{fmtRideTime(ride.departure_at)}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── FEATURED CARS ── */}
                <SectionHead
                    title="Buy / Sell Cars"
                    sub={city?.name ? `Cars near ${city.name}` : 'Listings near you'}
                    actionLabel="See all"
                    onAction={() => navigation.navigate('Marketplace')}
                />
                {featuredCars.length === 0 ? (
                    <TouchableOpacity style={[styles.softCard, styles.rowCenter]} activeOpacity={0.85} onPress={() => navigation.navigate('Marketplace')}>
                        <Icon name="car-outline" size={22} color="#AAAAAA" />
                        <Text style={[styles.muted, { flex: 1 }]}>No cars listed yet — be the first to sell.</Text>
                    </TouchableOpacity>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carsRow}>
                        {featuredCars.map((car) => {
                            const img = fileUrl(car.primary_image);
                            const tag = car.is_managed ? 'EZRide' : car.is_inspected ? `Grade ${car.inspection?.grade}` : null;
                            return (
                                <TouchableOpacity key={car.id} style={styles.carCard} activeOpacity={0.85} onPress={() => navigation.navigate('CarDetail', { id: car.id })}>
                                    <View style={styles.carImageBox}>
                                        {img ? <Image source={{ uri: img }} style={styles.carImage} resizeMode="cover" /> : <Icon name="car" size={30} color="#CBD0D6" />}
                                        {tag && (
                                            <View style={[styles.carTag, car.is_inspected && !car.is_managed && { backgroundColor: '#109F2A' }]}>
                                                <Text style={[styles.carTagTxt, car.is_inspected && !car.is_managed && { color: '#FFFFFF' }]}>{tag}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.carInfo}>
                                        <Text style={styles.carName} numberOfLines={1}>{car.title}</Text>
                                        <Text style={styles.carKm}>{car.mileage ? `${Number(car.mileage).toLocaleString()} km` : (car.city?.name || '—')}</Text>
                                        <Text style={styles.carPrice}>{formatMoney(car.price, { fallback: 'On request' })}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {/* ── INSPECTION BAND ── */}
                <TouchableOpacity style={styles.inspectBand} activeOpacity={0.9} onPress={() => navigation.navigate('InspectionRequest')}>
                    <View style={styles.inspectIcon}><Icon name="shield-check" size={24} color="#FFFFFF" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inspectTitle}>Book a Car Inspection</Text>
                        <Text style={styles.inspectSub}>Certified 120-point report before you buy</Text>
                    </View>
                    <Icon name="arrow-right" size={18} color={NAVY} />
                </TouchableOpacity>
            </ScrollView>

            <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="Home" />
        </View>
    );
};

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

// Shared section header.
const SectionHead = ({ title, sub, actionLabel, onAction }) => (
    <View style={styles.sectionHead}>
        <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!!sub && <Text style={styles.sectionSub}>{sub}</Text>}
        </View>
        {!!actionLabel && (
            <TouchableOpacity onPress={onAction} hitSlop={hit}>
                <Text style={styles.seeAll}>{actionLabel}</Text>
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },

    // Hero
    hero: {
        backgroundColor: NAVY,
        paddingTop: 52,
        paddingHorizontal: 20,
        paddingBottom: 26,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logo: { fontSize: 17, fontFamily: Fonts.bold, color: '#FFFFFF', letterSpacing: 1 },
    bellBtn: { position: 'relative' },
    bellDot: { position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A5F', borderWidth: 1.5, borderColor: NAVY },

    heroGreetRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 16 },
    heroGreet: { fontSize: 13, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.6)' },
    heroName: { fontSize: 22, fontFamily: Fonts.bold, color: '#FFFFFF', marginTop: 1 },
    heroAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
    heroAvatarTxt: { fontSize: 18, fontFamily: Fonts.bold, color: NAVY },

    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    },
    searchPlaceholder: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9AA0A6' },
    locChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F5F6F8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 110 },
    locChipTxt: { fontSize: 11.5, fontFamily: Fonts.semiBold, color: NAVY },

    scroll: { paddingBottom: 36 },

    // Module launcher grid (overlaps hero)
    gridCard: {
        marginTop: -22, marginHorizontal: 16,
        backgroundColor: '#FFFFFF', borderRadius: 20,
        flexDirection: 'row', flexWrap: 'wrap',
        paddingVertical: 18, paddingHorizontal: 8,
        shadowColor: '#0B1F44', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
    },
    gridTile: { width: '33.33%', alignItems: 'center', gap: 8, paddingVertical: 10 },
    gridIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    gridLabel: { fontSize: 11.5, fontFamily: Fonts.medium, color: '#374151', textAlign: 'center' },

    // Promo
    promoSection: { marginTop: 22 },
    promoList: { paddingHorizontal: 16, gap: 12 },
    promoCard: { width: PROMO_W, borderRadius: 18, padding: 20, minHeight: 150, overflow: 'hidden', justifyContent: 'center' },
    promoWatermark: { position: 'absolute', right: -10, bottom: -18 },
    promoEyebrow: { fontSize: 11, fontFamily: Fonts.semiBold, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    promoTitle: { fontSize: 20, fontFamily: Fonts.bold, color: '#FFFFFF' },
    promoSub: { fontSize: 12.5, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.85)', marginTop: 4, marginBottom: 14 },
    promoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    promoBtnTxt: { fontSize: 13, fontFamily: Fonts.semiBold, color: NAVY },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D7DBDE' },
    dotActive: { width: 18, backgroundColor: NAVY },

    // Section header
    sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 26, marginBottom: 14, gap: 12 },
    sectionTitle: { fontSize: 16, fontFamily: Fonts.semiBold, color: NAVY },
    sectionSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 2 },
    seeAll: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D6AFF' },

    // Services chips
    chipsRow: { paddingHorizontal: 16, gap: 10 },
    svcChip: { width: 76, alignItems: 'center', gap: 7 },
    svcChipIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', alignItems: 'center', justifyContent: 'center' },
    svcChipTxt: { fontSize: 11, fontFamily: Fonts.medium, color: '#5B6472', textAlign: 'center' },

    // Generic
    softCard: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', paddingVertical: 22, paddingHorizontal: 16 },
    rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 18 },
    muted: { fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6' },

    // Rides
    ridesWrap: { paddingHorizontal: 16, gap: 10 },
    rideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, gap: 12 },
    rideRoute: { alignItems: 'center', width: 10, alignSelf: 'stretch', paddingVertical: 3 },
    dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#109F2A' },
    rideLine: { width: 1.5, flex: 1, backgroundColor: '#EAEDEE', marginVertical: 3, minHeight: 16 },
    dotNavy: { width: 8, height: 8, borderRadius: 4, backgroundColor: NAVY },
    rideCities: { flex: 1, gap: 16, justifyContent: 'center' },
    rideCity: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#202223' },
    rideRight: { alignItems: 'flex-end', gap: 3 },
    ridePrice: { fontSize: 14, fontFamily: Fonts.bold, color: NAVY },
    rideMetaTxt: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },

    // Cars
    carsRow: { paddingHorizontal: 16, gap: 12 },
    carCard: { width: 156, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden' },
    carImageBox: { height: 96, backgroundColor: '#F0F1F3', alignItems: 'center', justifyContent: 'center' },
    carImage: { width: '100%', height: '100%' },
    carTag: { position: 'absolute', top: 8, left: 8, backgroundColor: YELLOW, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    carTagTxt: { fontSize: 9, fontFamily: Fonts.bold, color: NAVY },
    carInfo: { padding: 11, gap: 2 },
    carName: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: NAVY },
    carKm: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },
    carPrice: { fontSize: 13.5, fontFamily: Fonts.bold, color: NAVY, marginTop: 3 },

    // Inspection band
    inspectBand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 26, backgroundColor: '#FFF9DB', borderWidth: 1, borderColor: '#F6E6A8', borderRadius: 18, padding: 16 },
    inspectIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    inspectTitle: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: NAVY },
    inspectSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#7A6A2F', marginTop: 2 },
});

export default HomeScreenV2;
