import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, FlatList, Dimensions, ImageBackground,
    BackHandler, ToastAndroid, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import Sidebar from '../components/Sidebar';
import SelectSheet from '../components/SelectSheet';
import Skeleton from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { useUnreadCount } from '../hooks/useNotifications';
import { useServiceCategories } from '../hooks/useServices';
import { useAvailableRides } from '../hooks/useAvailableRides';
import { useCities } from '../hooks/useLookup';
import { useCurrentLocation } from '../hooks/useLocation';
import { useModules } from '../hooks/useModules';
import useLocationStore from '../store/locationStore';
import { formatMoney } from '../utils/money';

const { width } = Dimensions.get('window');
const BANNER_W = width - 32;
const NAVY = '#07163B';
const YELLOW = '#FFD400';

const STOCK = [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&q=80',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1000&q=80',
];

// Rich module cards — each carries a description + accent so the home feels
// full even with only 1–2 modules enabled. `flag` gates by the admin module key.
const MODULES_USER = [
    { key: 'find', icon: 'car-multiple', label: 'Find a Ride', desc: 'Book a seat, city to city', route: 'AvailableRides', flag: 'ride', color: '#1D6AFF', bg: '#EEF4FF' },
    { key: 'inspect', icon: 'clipboard-check', label: 'Car Inspection', desc: '120-point certified report', route: 'InspectionRequest', flag: 'inspection', color: '#109F2A', bg: '#E8F8EE' },
    { key: 'services', icon: 'wrench', label: 'Car Services', desc: 'Mechanic, wash, tyres & more', route: 'Services', flag: 'service', color: '#16A34A', bg: '#EDFFF4' },
];
const MODULES_DRIVER = [
    { key: 'post', icon: 'plus-circle', label: 'Post a Ride', desc: 'Fill your empty seats', route: 'PostRide', flag: 'ride', color: '#1D6AFF', bg: '#EEF4FF' },
    { key: 'inspect', icon: 'clipboard-check', label: 'Car Inspection', desc: '120-point certified report', route: 'InspectionRequest', flag: 'inspection', color: '#109F2A', bg: '#E8F8EE' },
    { key: 'services', icon: 'wrench', label: 'Car Services', desc: 'Mechanic, wash, tyres & more', route: 'Services', flag: 'service', color: '#16A34A', bg: '#EDFFF4' },
];

const TRUST = [
    { icon: 'shield-check', label: 'Verified drivers' },
    { icon: 'clipboard-check', label: 'Inspected cars' },
    { icon: 'lock-check', label: 'Secure & private' },
];

const fmtRideTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const HomeScreenV4 = ({ navigation }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { role } = useApp();
    const isDriver = role === 'driver';
    const { isEnabled, isLoading: modulesLoading } = useModules();
    const modules = (isDriver ? MODULES_DRIVER : MODULES_USER).filter(m => isEnabled(m.flag));
    const fewModules = modules.length <= 2; // full-width rows when few; 2-col grid when many

    const { data: notifUnread = 0 } = useUnreadCount();
    const { data: serviceCats = [] } = useServiceCategories();
    const { city } = useCurrentLocation();
    const setLocation = useLocationStore(s => s.setLocation);

    const [cityOpen, setCityOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const citiesQuery = useCities();
    const cities = (citiesQuery.data?.cities || []).filter(c =>
        !citySearch.trim() || c.name.toLowerCase().includes(citySearch.trim().toLowerCase()));
    const pickCity = (c) => {
        const lat = Number(c.lat);
        const lng = Number(c.lon);
        const coords = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
        setLocation(coords, { id: c.id, name: c.name });
        setCityOpen(false);
        setCitySearch('');
    };

    const ridesQuery = useAvailableRides({});
    const nearbyRides = (ridesQuery.data?.pages?.[0]?.ride_posts || []).slice(0, 4);

    const modulePromos = [
        { id: 'ride', flag: 'ride', image: STOCK[0], eyebrow: 'Find a Ride', title: 'Book a seat, city-to-city', sub: 'Available rides near you', cta: 'Find rides', onPress: () => navigation.navigate('AvailableRides') },
        { id: 'inspect', flag: 'inspection', image: STOCK[1], eyebrow: 'Buying used?', title: '120-point inspection', sub: 'Certified report before you pay', cta: 'Book now', onPress: () => navigation.navigate('InspectionRequest') },
        { id: 'services', flag: 'service', image: STOCK[2], eyebrow: 'Car Services', title: 'Mechanic, wash & more', sub: 'Verified providers near you', cta: 'Explore', onPress: () => navigation.navigate('Services') },
    ].filter(p => isEnabled(p.flag));

    const banners = modulePromos;

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

    const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={hit} style={styles.menuBtn}>
                        <Icon name="menu" size={24} color={NAVY} />
                    </TouchableOpacity>

                    <Text style={styles.logoCenter} pointerEvents="none">EZRide</Text>

                    <TouchableOpacity style={styles.cityChip} activeOpacity={0.7} onPress={() => { setCityOpen(true); setCitySearch(''); }}>
                        <Icon name="map-marker" size={15} color={YELLOW} />
                        <Text style={styles.cityTxt} numberOfLines={1}>{city?.name || 'Set city'}</Text>
                        <Icon name="chevron-down" size={15} color="#5B6472" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.searchBar} activeOpacity={0.85} onPress={() => navigation.navigate('Discover')}>
                    <Icon name="magnify" size={20} color="#9AA0A6" />
                    <Text style={styles.searchPlaceholder}>Search rides, services, cars…</Text>
                </TouchableOpacity>
            </View>

            {modulesLoading ? <HomeSkeleton /> : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* ── GREETING ── */}
                <Text style={styles.greeting}>{greeting} 👋</Text>
                <Text style={styles.greetingSub}>What would you like to do today?</Text>

                {/* ── MODULE FEATURE CARDS (adaptive: rows when few, 2-col when many) ── */}
                <View style={[styles.modWrap, !fewModules && styles.modGrid]}>
                    {modules.map(m => (
                        fewModules ? (
                            <TouchableOpacity key={m.key} style={styles.modRow} activeOpacity={0.85} onPress={() => navigation.navigate(m.route)}>
                                <View style={[styles.modIcon, { backgroundColor: m.bg }]}><Icon name={m.icon} size={26} color={m.color} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.modTitle}>{m.label}</Text>
                                    <Text style={styles.modDesc}>{m.desc}</Text>
                                </View>
                                <Icon name="chevron-right" size={22} color="#C4C9D0" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity key={m.key} style={styles.modCard} activeOpacity={0.85} onPress={() => navigation.navigate(m.route)}>
                                <View style={[styles.modIcon, { backgroundColor: m.bg }]}><Icon name={m.icon} size={26} color={m.color} /></View>
                                <Text style={styles.modTitle}>{m.label}</Text>
                                <Text style={styles.modDesc} numberOfLines={1}>{m.desc}</Text>
                            </TouchableOpacity>
                        )
                    ))}
                </View>

                {/* ── HERO BANNER ── */}
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

                {/* ── CAR SERVICES ── */}
                {isEnabled('service') && serviceCats.length > 0 && (
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

                {/* ── BOOK INSPECTION ── */}
                {isEnabled('inspection') && (
                <TouchableOpacity style={styles.inspectBand} activeOpacity={0.9} onPress={() => navigation.navigate('InspectionRequest')}>
                    <View style={styles.inspectIcon}><Icon name="shield-check" size={24} color="#FFFFFF" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inspectTitle}>Book a Car Inspection</Text>
                        <Text style={styles.inspectSub}>Certified 120-point report before you buy</Text>
                    </View>
                    <Icon name="arrow-right" size={18} color={NAVY} />
                </TouchableOpacity>
                )}

                {/* ── RIDES FOR YOU ── */}
                {isEnabled('ride') && (
                <>
                <SectionHead
                    title="Rides for you"
                    sub={city?.name ? `From ${city.name} & nearby` : 'Available rides'}
                    actionLabel="View all"
                    onAction={() => navigation.navigate('AvailableRides')}
                />
                {ridesQuery.isLoading ? (
                    <View style={styles.softCard}><Text style={styles.muted}>Finding rides…</Text></View>
                ) : nearbyRides.length === 0 ? (
                    <TouchableOpacity style={[styles.softCard, styles.emptyCta]} activeOpacity={0.85} onPress={() => navigation.navigate(isDriver ? 'PostRide' : 'AvailableRides')}>
                        <View style={styles.emptyIcon}><Icon name="car-multiple" size={22} color={NAVY} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.emptyTitle}>{isDriver ? 'Post your first ride' : 'No rides right now'}</Text>
                            <Text style={styles.muted}>{isDriver ? 'Fill your empty seats city-to-city.' : 'Check back soon or set a ride alert.'}</Text>
                        </View>
                        <Icon name="arrow-right" size={18} color={NAVY} />
                    </TouchableOpacity>
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
                                        <View style={styles.bookBtn}><Text style={styles.bookBtnTxt}>Book</Text></View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                </>
                )}

                {/* ── TRUST STRIP (always present — anchors the page) ── */}
                <View style={styles.trustRow}>
                    {TRUST.map(t => (
                        <View key={t.icon} style={styles.trustItem}>
                            <Icon name={t.icon} size={20} color={NAVY} />
                            <Text style={styles.trustLabel}>{t.label}</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.footerNote}>EZRide · your all-in-one car companion</Text>

            </ScrollView>
            )}

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

// Shown until the admin module flags load — avoids the "default modules then snap"
// flicker and the empty flash on cold start.
const HomeSkeleton = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Skeleton width={170} height={22} radius={7} />
            <Skeleton width={230} height={13} radius={6} style={{ marginTop: 9 }} />
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 12 }}>
            {[0, 1].map(i => <Skeleton key={i} width="100%" height={84} radius={18} />)}
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
            <Skeleton width="100%" height={168} radius={18} />
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
            <Skeleton width={150} height={16} radius={6} />
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 10 }}>
            {[0, 1, 2].map(i => <Skeleton key={i} width="100%" height={74} radius={16} />)}
        </View>
    </ScrollView>
);

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

    header: { backgroundColor: '#FFFFFF', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
    menuBtn: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center', zIndex: 2, elevation: 2 },
    logoCenter: { position: 'absolute', left: 44, right: 44, textAlign: 'center', fontSize: 19, fontFamily: Fonts.bold, color: NAVY, letterSpacing: 0.5, zIndex: 0 },
    cityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5F6F8', borderRadius: 20, paddingLeft: 10, paddingRight: 8, paddingVertical: 7, maxWidth: 150, zIndex: 1 },
    cityTxt: { flexShrink: 1, fontSize: 13, fontFamily: Fonts.semiBold, color: NAVY },

    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5F6F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginTop: 14 },
    searchPlaceholder: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: '#9AA0A6' },

    scroll: { paddingBottom: 36 },

    greeting: { fontSize: 20, fontFamily: Fonts.bold, color: NAVY, paddingHorizontal: 20, marginTop: 20 },
    greetingSub: { fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6', paddingHorizontal: 20, marginTop: 3, marginBottom: 16 },

    // Module feature cards
    modWrap: { paddingHorizontal: 16, gap: 12 },
    modGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    modRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAEDEE', padding: 16 },
    modCard: { width: (width - 44) / 2, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, gap: 8 },
    modIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    modTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: NAVY },
    modDesc: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 2 },

    // Banner
    bannerSection: { marginTop: 22 },
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

    sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 26, marginBottom: 14, gap: 12 },
    sectionTitle: { fontSize: 16, fontFamily: Fonts.semiBold, color: NAVY },
    sectionSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6', marginTop: 2 },
    seeAll: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D6AFF' },

    chipsRow: { paddingHorizontal: 16, gap: 10 },
    svcChip: { width: 76, alignItems: 'center', gap: 7 },
    svcChipIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', alignItems: 'center', justifyContent: 'center' },
    svcChipTxt: { fontSize: 11, fontFamily: Fonts.medium, color: '#5B6472', textAlign: 'center' },

    softCard: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', paddingVertical: 22, paddingHorizontal: 16 },
    rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 18 },
    emptyCta: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 },
    emptyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: NAVY, marginBottom: 2 },
    muted: { fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6' },

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

    inspectBand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 26, backgroundColor: '#FFF9DB', borderWidth: 1, borderColor: '#F6E6A8', borderRadius: 18, padding: 16 },
    inspectIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
    inspectTitle: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: NAVY },
    inspectSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#7A6A2F', marginTop: 2 },

    // Trust strip
    trustRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: 30, paddingVertical: 18, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#EAEDEE' },
    trustItem: { alignItems: 'center', gap: 6, flex: 1 },
    trustLabel: { fontSize: 11.5, fontFamily: Fonts.medium, color: '#5B6472', textAlign: 'center' },
    footerNote: { textAlign: 'center', fontSize: 11.5, fontFamily: Fonts.regular, color: '#C4C9D0', marginTop: 18 },
});

export default HomeScreenV4;
