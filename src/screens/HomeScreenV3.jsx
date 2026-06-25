import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, FlatList, Dimensions, ImageBackground, Image,
    BackHandler, ToastAndroid, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import Sidebar from '../components/Sidebar';
import SelectSheet from '../components/SelectSheet';
import { useApp } from '../context/AppContext';
import { useUnreadCount } from '../hooks/useNotifications';
import { useServiceCategories } from '../hooks/useServices';
import { useAvailableRides } from '../hooks/useAvailableRides';
import { useCarListings } from '../hooks/useMarketplace';
import { useCities } from '../hooks/useLookup';
import { useCurrentLocation } from '../hooks/useLocation';
import useLocationStore from '../store/locationStore';
import { fileUrl } from '../utils/media';
import { formatMoney } from '../utils/money';

const { width } = Dimensions.get('window');
const BANNER_W = width - 32;
const NAVY = '#07163B';
const YELLOW = '#FFD400';

// Real car photos — fallback only (listing has no image, or no listings yet),
// so the banner is never blank.
const STOCK = [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1000&q=80',
];

// 4 core modules per row. Services + History live elsewhere (Services has its
// own section below; History is in the sidebar).
const MODULES_USER = [
    { key: 'find', icon: 'car-multiple', label: 'Find Ride', route: 'AvailableRides' },
    { key: 'rent', icon: 'car-key', label: 'Rent a Car', route: 'Rentals' },
    { key: 'buysell', icon: 'tag', label: 'Buy / Sell', route: 'Marketplace' },
    { key: 'inspect', icon: 'clipboard-check', label: 'Inspection', route: 'InspectionRequest' },
];
const MODULES_DRIVER = [
    { key: 'post', icon: 'plus-circle', label: 'Post Ride', route: 'PostRide' },
    { key: 'find', icon: 'car-multiple', label: 'Find Ride', route: 'AvailableRides' },
    { key: 'rent', icon: 'car-key', label: 'Rent a Car', route: 'Rentals' },
    { key: 'buysell', icon: 'tag', label: 'Buy / Sell', route: 'Marketplace' },
];

const fmtRideTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const HomeScreenV3 = ({ navigation }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { role } = useApp();
    const isDriver = role === 'driver';
    const modules = isDriver ? MODULES_DRIVER : MODULES_USER;

    const { data: notifUnread = 0 } = useUnreadCount();
    const { data: serviceCats = [] } = useServiceCategories();
    const { city } = useCurrentLocation();
    const setLocation = useLocationStore(s => s.setLocation);

    // City picker
    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const citiesQuery = useCities();
    const cities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase()));
    const pickCity = (c) => {
        // Re-centres every location-ranked feed around the chosen city.
        // Cities API returns lat/lon as strings — coerce to numbers so the
        // ranking hooks (which call coords.lat.toFixed) don't blow up.
        const lat = Number(c.lat);
        const lng = Number(c.lon);
        const coords = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
        setLocation(coords, { id: c.id, name: c.name });
        setCityOpen(false);
        setCitySearch('');
    };

    const ridesQuery = useAvailableRides({});
    const nearbyRides = (ridesQuery.data?.pages?.[0]?.ride_posts || []).slice(0, 4);

    const listingsQuery = useCarListings({});
    const allListings = listingsQuery.data?.pages?.[0]?.listings || [];
    const featuredCars = allListings.slice(0, 6);

    // Banner = real featured listings; falls back to module promos over real photos.
    const banners = allListings.length
        ? allListings.slice(0, 5).map((c, i) => ({
            id: `c${c.id}`,
            image: fileUrl(c.primary_image) || STOCK[i % STOCK.length],
            eyebrow: c.is_managed ? 'EZRide Certified' : c.is_inspected ? `Grade ${c.inspection?.grade} · Inspected` : 'Featured',
            title: c.title,
            sub: formatMoney(c.price, { fallback: 'Price on request' }),
            cta: 'View car',
            onPress: () => navigation.navigate('CarDetail', { id: c.id }),
        }))
        : [
            { id: 'rent', image: STOCK[0], eyebrow: 'Rent a Car', title: 'Self-drive & with driver', sub: 'Daily rentals near you', cta: 'Browse', onPress: () => navigation.navigate('Rentals') },
            { id: 'inspect', image: STOCK[1], eyebrow: 'Buying used?', title: '120-point inspection', sub: 'Certified report before you pay', cta: 'Book now', onPress: () => navigation.navigate('InspectionRequest') },
            { id: 'sell', image: STOCK[2], eyebrow: 'Buy / Sell', title: 'List your car free', sub: 'Reach buyers near you', cta: 'Sell now', onPress: () => navigation.navigate('Marketplace') },
        ];

    const [activeBanner, setActiveBanner] = useState(0);
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
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* ── HEADER: logo (left) · city dropdown + bell (right) ── */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={styles.logoWrap}>
                        <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={hit}>
                            <Icon name="menu" size={24} color={NAVY} />
                        </TouchableOpacity>
                        <Text style={styles.logo}>EZRide</Text>
                    </View>

                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.cityChip} activeOpacity={0.7} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                            <Icon name="map-marker" size={15} color={YELLOW} />
                            <Text style={styles.cityTxt} numberOfLines={1}>{city?.name || 'Set city'}</Text>
                            <Icon name="chevron-down" size={16} color="#5B6472" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} hitSlop={hit} style={styles.bellBtn}>
                            <Icon name="bell-outline" size={22} color={NAVY} />
                            {notifUnread > 0 && <View style={styles.bellDot} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search on the bottom of the header */}
                <TouchableOpacity style={styles.searchBar} activeOpacity={0.85} onPress={() => navigation.navigate('Discover')}>
                    <Icon name="magnify" size={20} color="#9AA0A6" />
                    <Text style={styles.searchPlaceholder}>Search rides, services, cars…</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* ── MODULE GRID (4 in a row) ── */}
                <View style={styles.grid}>
                    {modules.map(m => (
                        <TouchableOpacity key={m.key} style={styles.tile} activeOpacity={0.7} onPress={() => navigation.navigate(m.route)}>
                            <View style={styles.tileIcon}><Icon name={m.icon} size={24} color={NAVY} /></View>
                            <Text style={styles.tileLabel} numberOfLines={1}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── BANNER (real images) ── */}
                <View style={styles.bannerSection}>
                    <FlatList
                        data={banners}
                        keyExtractor={b => b.id}
                        horizontal
                        pagingEnabled
                        snapToInterval={BANNER_W + 12}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.bannerList}
                        onScroll={(e) => setActiveBanner(Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12)))}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.bannerCard} activeOpacity={0.92} onPress={item.onPress}>
                                <ImageBackground source={{ uri: item.image }} style={styles.bannerImg} imageStyle={styles.bannerImgRadius}>
                                    <View style={styles.bannerScrim} />
                                    <View style={styles.bannerContent}>
                                        <Text style={styles.bannerEyebrow}>{item.eyebrow}</Text>
                                        <Text style={styles.bannerTitle} numberOfLines={1}>{item.title}</Text>
                                        <View style={styles.bannerFoot}>
                                            <Text style={styles.bannerSub} numberOfLines={1}>{item.sub}</Text>
                                            <View style={styles.bannerBtn}>
                                                <Text style={styles.bannerBtnTxt}>{item.cta}</Text>
                                                <Icon name="arrow-right" size={13} color={NAVY} />
                                            </View>
                                        </View>
                                    </View>
                                </ImageBackground>
                            </TouchableOpacity>
                        )}
                    />
                    <View style={styles.dots}>
                        {banners.map((_, i) => <View key={i} style={[styles.dot, i === activeBanner && styles.dotActive]} />)}
                    </View>
                </View>

                {/* ── CAR SERVICES (chips) ── */}
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

                {/* ── BOOK INSPECTION (after Car Services) ── */}
                <TouchableOpacity style={styles.inspectBand} activeOpacity={0.9} onPress={() => navigation.navigate('InspectionRequest')}>
                    <View style={styles.inspectIcon}><Icon name="shield-check" size={24} color="#FFFFFF" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inspectTitle}>Book a Car Inspection</Text>
                        <Text style={styles.inspectSub}>Certified 120-point report before you buy</Text>
                    </View>
                    <Icon name="arrow-right" size={18} color={NAVY} />
                </TouchableOpacity>

                {/* ── RIDES NEAR YOU (real + Book) ── */}
                <SectionHead
                    title="Rides for you"
                    sub={city?.name ? `From ${city.name} & nearby` : 'Available rides'}
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
                                        <Text style={styles.rideMetaTxt} numberOfLines={1}>
                                            {fmtRideTime(ride.departure_at)}{seats != null ? ` · ${seats} seats` : ' · Private'}
                                        </Text>
                                    </View>
                                    <View style={styles.rideRight}>
                                        <Text style={styles.ridePrice}>{formatMoney(ride.price_per_seat)}</Text>
                                        <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85} onPress={() => navigation.navigate('AvailableRides')}>
                                            <Text style={styles.bookBtnTxt}>Book</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── CARS FOR SALE (real, image-led 2-col) ── */}
                <SectionHead
                    title="Cars for sale"
                    sub={city?.name ? `Near ${city.name}` : 'Listings near you'}
                    actionLabel="See all"
                    onAction={() => navigation.navigate('Marketplace')}
                />
                {featuredCars.length === 0 ? (
                    <TouchableOpacity style={[styles.softCard, styles.rowCenter]} activeOpacity={0.85} onPress={() => navigation.navigate('Marketplace')}>
                        <Icon name="car-outline" size={22} color="#AAAAAA" />
                        <Text style={[styles.muted, { flex: 1 }]}>No cars listed yet — be the first to sell.</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.carGrid}>
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
                                        <Text style={styles.carPrice}>{formatMoney(car.price, { fallback: 'On request' })}</Text>
                                        <Text style={styles.carName} numberOfLines={1}>{car.title}</Text>
                                        <Text style={styles.carKm}>{[car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null, car.city?.name].filter(Boolean).join(' · ') || '—'}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

            </ScrollView>

            <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="Home" />

            <SelectSheet
                visible={cityOpen}
                onClose={() => setCityOpen(false)}
                title="Choose your city"
                items={cities}
                loading={citiesQuery.isLoading}
                searchable
                search={citySearch}
                onSearch={setCitySearch}
                selectedId={city?.id}
                onSelect={pickCity}
            />
        </View>
    );
};

const hit = { top: 10, bottom: 10, left: 10, right: 10 };

const SectionHead = ({ title, sub, actionLabel, onAction }) => (
    <View style={styles.sectionHead}>
        <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {!!sub && <Text style={styles.sectionSub}>{sub}</Text>}
        </View>
        {!!actionLabel && (
            <TouchableOpacity onPress={onAction} hitSlop={hit}><Text style={styles.seeAll}>{actionLabel}</Text></TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },

    // Header
    header: { backgroundColor: '#FFFFFF', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logo: { fontSize: 19, fontFamily: Fonts.bold, color: NAVY, letterSpacing: 0.5 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F6F8', borderRadius: 20, paddingLeft: 10, paddingRight: 8, paddingVertical: 7, maxWidth: 150 },
    cityTxt: { flexShrink: 1, fontSize: 13, fontFamily: Fonts.semiBold, color: NAVY },
    bellBtn: { position: 'relative' },
    bellDot: { position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A5F', borderWidth: 1.5, borderColor: '#FFFFFF' },

    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F6F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginTop: 14 },
    searchPlaceholder: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9AA0A6' },

    scroll: { paddingBottom: 36 },

    // Module grid (4 per row)
    grid: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 18, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    tile: { width: '25%', alignItems: 'center', gap: 8 },
    tileIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F4F6F9', alignItems: 'center', justifyContent: 'center' },
    tileLabel: { fontSize: 11.5, fontFamily: Fonts.medium, color: '#374151', textAlign: 'center' },

    // Banner
    bannerSection: { marginTop: 18 },
    bannerList: { paddingHorizontal: 16, gap: 12 },
    bannerCard: { width: BANNER_W, height: 168, borderRadius: 18, overflow: 'hidden', backgroundColor: '#E9ECF1' },
    bannerImg: { flex: 1, justifyContent: 'flex-end' },
    bannerImgRadius: { borderRadius: 18 },
    bannerScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,22,59,0.42)' },
    bannerContent: { padding: 18 },
    bannerEyebrow: { fontSize: 10.5, fontFamily: Fonts.semiBold, color: YELLOW, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    bannerTitle: { fontSize: 21, fontFamily: Fonts.bold, color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    bannerFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    bannerSub: { flex: 1, fontSize: 14, fontFamily: Fonts.semiBold, color: '#FFFFFF' },
    bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: YELLOW, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
    bannerBtnTxt: { fontSize: 13, fontFamily: Fonts.semiBold, color: NAVY },
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
    rideLine: { width: 1.5, flex: 1, backgroundColor: '#EAEDEE', marginVertical: 3, minHeight: 14 },
    dotNavy: { width: 8, height: 8, borderRadius: 4, backgroundColor: NAVY },
    rideCities: { flex: 1, gap: 6, justifyContent: 'center' },
    rideCity: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#202223' },
    rideMetaTxt: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 2 },
    rideRight: { alignItems: 'flex-end', gap: 8 },
    ridePrice: { fontSize: 14, fontFamily: Fonts.bold, color: NAVY },
    bookBtn: { backgroundColor: YELLOW, borderRadius: 9, paddingHorizontal: 18, paddingVertical: 7 },
    bookBtnTxt: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: NAVY },

    // Car grid (2-col, image-led)
    carGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
    carCard: { width: (width - 44) / 2, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden' },
    carImageBox: { height: 110, backgroundColor: '#F0F1F3', alignItems: 'center', justifyContent: 'center' },
    carImage: { width: '100%', height: '100%' },
    carTag: { position: 'absolute', top: 8, left: 8, backgroundColor: YELLOW, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    carTagTxt: { fontSize: 9, fontFamily: Fonts.bold, color: NAVY },
    carInfo: { padding: 11, gap: 2 },
    carPrice: { fontSize: 14, fontFamily: Fonts.bold, color: NAVY },
    carName: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#202223' },
    carKm: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },

    // Inspection band
    inspectBand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 26, backgroundColor: '#FFF9DB', borderWidth: 1, borderColor: '#F6E6A8', borderRadius: 18, padding: 16 },
    inspectIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    inspectTitle: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: NAVY },
    inspectSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#7A6A2F', marginTop: 2 },
});

export default HomeScreenV3;
