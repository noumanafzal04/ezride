import React, {useState, useRef, useCallback} from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, FlatList, Dimensions, ImageBackground, Image,
    BackHandler, ToastAndroid, Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
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

const {width} = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20px margin each side

// ─── Data ─────────────────────────────────────────────────────────────────────

// Quick actions differ by role — only drivers post rides.
const USER_ACTIONS = [
    {key: 'find', icon: 'magnify', label: 'Find Ride', route: 'AvailableRides'},
    {key: 'services', icon: 'wrench-outline', label: 'Services', route: 'Services'},
    {key: 'inspect', icon: 'car-wrench', label: 'Inspect', route: 'InspectionRequest'},
    {key: 'buysell', icon: 'tag-outline', label: 'Buy / Sell', route: 'Marketplace'},
    {key: 'history', icon: 'clock-outline', label: 'History', route: 'History'},
];
const DRIVER_ACTIONS = [
    {key: 'post', icon: 'plus-circle-outline', label: 'Post Ride', route: 'PostRide'},
    {key: 'find', icon: 'magnify', label: 'Find Ride', route: 'AvailableRides'},
    {key: 'inspect', icon: 'car-wrench', label: 'Inspect', route: 'InspectionRequest'},
    {key: 'buysell', icon: 'tag-outline', label: 'Buy / Sell', route: 'Marketplace'},
    {key: 'history', icon: 'clock-outline', label: 'History', route: 'History'},
];

const BANNERS = [
    {
        id: '1',
        eyebrow: 'Best route today',
        title: 'LHE → ISL',
        sub: 'Seats from Rs. 2,600',
        btnText: 'Book now',
        bg: '#1E3A5F',
        accent: '#FFD400',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80',
        route: 'AvailableRides',
    },
    {
        id: '2',
        eyebrow: 'Featured listing',
        title: 'Honda City 2021',
        sub: 'Just Rs. 32 Lac · 45,000 km',
        btnText: 'View car',
        bg: '#134E2A',
        accent: '#4ADE80',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&q=80',
        route: 'Marketplace',
    },
    {
        id: '3',
        eyebrow: 'Get your car checked',
        title: 'Book Inspection',
        sub: '120-point certified report',
        btnText: 'Book now',
        bg: '#1E1B4B',
        accent: '#818CF8',
        image: 'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da77?w=900&q=80',
        route: 'Marketplace',
    },
];

// Format a ride post's departure for the Home "rides near you" cards.
const fmtRideTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

// ─── Component ────────────────────────────────────────────────────────────────

const HomeScreen = ({navigation}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { role } = useApp();
    const isDriver = role === 'driver';
    const actions = isDriver ? DRIVER_ACTIONS : USER_ACTIONS;

    const user = useUserStore(s => s.user);
    const greetName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'there';
    const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; })();

    const { data: notifUnread = 0 } = useUnreadCount();
    const { data: serviceCats = [] } = useServiceCategories();
    const { city } = useCurrentLocation();

    // Rides near the user (location-ranked: their city first, else nearest).
    const ridesQuery = useAvailableRides({});
    const nearbyRides = (ridesQuery.data?.pages?.[0]?.ride_posts || []).slice(0, 3);

    // Featured car listings (location-ranked).
    const listingsQuery = useCarListings({});
    const featuredCars = (listingsQuery.data?.pages?.[0]?.listings || []).slice(0, 6);

    const [activeBanner, setActiveBanner] = useState(0);
    const bannerRef = useRef(null);
    const lastBack = useRef(0);

    // Home is the root tab → press back twice to exit (friendlier than instant exit)
    useFocusEffect(
        useCallback(() => {
            const onBack = () => {
                const now = Date.now();
                if (now - lastBack.current < 2000) {
                    BackHandler.exitApp();
                    return true;
                }
                lastBack.current = now;
                if (Platform.OS === 'android') ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
                return true;
            };
            const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
            return () => sub.remove();
        }, [])
    );

    const onBannerScroll = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
        setActiveBanner(index);
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content"/>

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                    <Icon name="menu" size={22} color="#07163B"/>
                </TouchableOpacity>
                <Text style={styles.logo}>EZRide</Text>
                <TouchableOpacity
                    style={styles.notifBtn}
                    onPress={() => navigation.navigate('Notifications')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Icon name="bell-outline" size={20} color="#07163B"/>
                    {notifUnread > 0 && <View style={styles.notifDot}/>}
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* ── GREETING + WALLET ── */}
                <View style={styles.greetRow}>
                    <View>
                        <Text style={styles.greetSub}>{greeting} 👋</Text>
                        <Text style={styles.greetName}>{greetName}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.walletChip}
                        onPress={() => navigation.navigate('TopUp')}
                    >
                        <Icon name="wallet-outline" size={14} color="#07163B"/>
                        <Text style={styles.walletAmt}>Rs. 2,50,000</Text>
                        <View style={styles.walletPlus}>
                            <Icon name="plus" size={10} color="#07163B"/>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── QUICK ACTIONS ── */}
                <View style={styles.actionsRow}>
                    {actions.map(a => (
                        <TouchableOpacity
                            key={a.key}
                            style={styles.actionItem}
                            onPress={() => navigation.navigate(a.route)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionIcon}>
                                <Icon name={a.icon} size={21} color="#07163B"/>
                            </View>
                            <Text style={styles.actionLabel}>{a.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── CAR SERVICES (clean 2-row grid of 8) ── */}
                {serviceCats.length > 0 && (
                    <View style={styles.svcSection}>
                        <View style={styles.svcHead}>
                            <Text style={styles.svcTitle}>Car Services</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
                                <Text style={styles.svcSeeAll}>See all</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.svcGrid}>
                            {serviceCats.slice(0, 8).map(c => (
                                <TouchableOpacity
                                    key={c.id}
                                    style={styles.svcTile}
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('ServiceProviders', { category: c })}
                                >
                                    <View style={styles.svcTileIcon}>
                                        <Icon name={c.icon || 'wrench'} size={21} color="#07163B" />
                                    </View>
                                    <Text style={styles.svcTileLabel} numberOfLines={1}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* ── SEARCH RIDE ── */}
                <View style={styles.searchCard}>
                    <Text style={styles.searchCardTitle}>Search a Ride</Text>
                    <View style={styles.searchFields}>
                        {/* From */}
                        <TouchableOpacity style={styles.searchField} onPress={() => navigation.navigate('AvailableRides')} activeOpacity={0.7}>
                            <View style={styles.searchDotGreen}/>
                            <Text style={[styles.searchFieldText, styles.searchPlaceholder]}>From city</Text>
                            <Icon name="chevron-right" size={16} color="#CCCCCC"/>
                        </TouchableOpacity>
                        {/* Connector */}
                        <View style={styles.searchConnectorRow}>
                            <View style={styles.searchConnectorLine}/>
                        </View>
                        {/* To */}
                        <TouchableOpacity style={styles.searchField} onPress={() => navigation.navigate('AvailableRides')} activeOpacity={0.7}>
                            <View style={styles.searchDotNavy}/>
                            <Text style={[styles.searchFieldText, styles.searchPlaceholder]}>To city</Text>
                            <Icon name="chevron-right" size={16} color="#CCCCCC"/>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.searchBtn}
                        onPress={() => navigation.navigate('AvailableRides')}
                    >
                        <Icon name="magnify" size={17} color="#07163B"/>
                        <Text style={styles.searchBtnText}>Search Rides</Text>
                    </TouchableOpacity>
                </View>

                {/* ── SWIPER BANNER ── */}
                <View style={styles.bannerSection}>
                    <FlatList
                        ref={bannerRef}
                        data={BANNERS}
                        keyExtractor={b => b.id}
                        horizontal
                        pagingEnabled
                        snapToInterval={CARD_WIDTH + 12}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        onScroll={onBannerScroll}
                        scrollEventThrottle={16}
                        contentContainerStyle={styles.bannerList}
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={[styles.bannerCard, {backgroundColor: item.bg}]}
                                onPress={() => navigation.navigate(item.route)}
                                activeOpacity={0.92}
                            >
                                <ImageBackground
                                    source={{uri: item.image}}
                                    style={styles.bannerImage}
                                    imageStyle={styles.bannerImageRadius}
                                >
                                    {/* Dark gradient-like overlay for text readability */}
                                    <View style={styles.bannerOverlay}/>

                                    {/* Content */}
                                    <View style={styles.bannerContent}>
                                        <Text style={styles.bannerEyebrow}>{item.eyebrow}</Text>
                                        <Text style={styles.bannerTitle}>{item.title}</Text>
                                        <Text style={styles.bannerSub}>{item.sub}</Text>
                                        <View style={[styles.bannerBtn, {backgroundColor: item.accent}]}>
                                            <Text style={[styles.bannerBtnText, {color: item.bg}]}>
                                                {item.btnText}
                                            </Text>
                                            <Icon name="arrow-right" size={13} color={item.bg}/>
                                        </View>
                                    </View>
                                </ImageBackground>
                            </TouchableOpacity>
                        )}
                    />

                    {/* Dot indicators */}
                    <View style={styles.bannerDots}>
                        {BANNERS.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.bannerDot,
                                    i === activeBanner && styles.bannerDotActive,
                                ]}
                            />
                        ))}
                    </View>
                </View>


                {/* ── BUY / SELL FEATURED ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Buy / Sell Cars</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSub}>{city?.name ? `Cars near ${city.name}` : 'Listings near you'}</Text>
                    {featuredCars.length === 0 ? (
                        <TouchableOpacity style={styles.carEmpty} activeOpacity={0.85} onPress={() => navigation.navigate('Marketplace')}>
                            <Icon name="car-outline" size={22} color="#AAAAAA" />
                            <Text style={styles.carEmptyText}>No cars listed yet — be the first to sell.</Text>
                        </TouchableOpacity>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carsRow}>
                            {featuredCars.map((car) => {
                                const img = fileUrl(car.primary_image);
                                const tag = car.is_managed ? 'EZRide' : car.is_inspected ? `Grade ${car.inspection?.grade}` : null;
                                return (
                                    <TouchableOpacity key={car.id} style={styles.carCard} activeOpacity={0.85}
                                        onPress={() => navigation.navigate('CarDetail', { id: car.id })}>
                                        <View style={styles.carImageBox}>
                                            {img ? <Image source={{uri: img}} style={styles.carImage} resizeMode="cover"/>
                                                : <Icon name="car" size={30} color="#CBD0D6" />}
                                            {tag && (
                                                <View style={[styles.carTag, car.is_inspected && !car.is_managed && {backgroundColor: '#109F2A'}]}>
                                                    <Text style={[styles.carTagText, car.is_inspected && !car.is_managed && {color: '#FFFFFF'}]}>{tag}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.carInfo}>
                                            <Text style={styles.carName} numberOfLines={1}>{car.title}</Text>
                                            <Text style={styles.carKm}>{car.mileage ? `${Number(car.mileage).toLocaleString()} km` : (car.city?.name || '—')}</Text>
                                            <Text style={styles.carPrice}>{car.price != null ? `Rs. ${Number(car.price).toLocaleString()}` : 'On request'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>

                {/* ── BOOK INSPECTION ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Car Inspection</Text>
                    </View>
                    <Text style={styles.sectionSub}>Know exactly what you're buying</Text>
                    <TouchableOpacity
                        style={styles.inspectionCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('InspectionRequest')}
                    >
                        <View style={styles.inspectionLeft}>
                            <View style={styles.inspectionIconWrap}>
                                <Icon name="clipboard-check-outline" size={26} color="#2563EB"/>
                            </View>
                            <View>
                                <Text style={styles.inspectionTitle}>Book an Inspection</Text>
                                <Text style={styles.inspectionDesc}>Certified · 120-point report</Text>
                            </View>
                        </View>
                        <View style={styles.inspectionArrow}>
                            <Icon name="arrow-right" size={15} color="#07163B"/>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── RIDES NEAR YOU (location-ranked) ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Rides near you</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AvailableRides')}>
                            <Text style={styles.seeAll}>View all</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSub}>
                        {city?.name ? `Departing from ${city.name} & nearby` : 'Popular routes near you'}
                    </Text>

                    {ridesQuery.isLoading ? (
                        <View style={styles.ridesEmpty}><Text style={styles.ridesEmptyText}>Finding rides…</Text></View>
                    ) : nearbyRides.length === 0 ? (
                        <View style={styles.ridesEmpty}>
                            <Icon name="car-off" size={28} color="#DDDDDD" />
                            <Text style={styles.ridesEmptyText}>No rides available right now.</Text>
                        </View>
                    ) : nearbyRides.map((ride) => {
                        const seats = ride.post_type === 'private' ? null : ride.available_seats;
                        return (
                            <TouchableOpacity key={ride.id} style={styles.rideCard} activeOpacity={0.85}
                                onPress={() => navigation.navigate('AvailableRides')}>
                                <View style={styles.rideRoute}>
                                    <View style={styles.rideDotGreen}/>
                                    <View style={styles.rideLine}/>
                                    <View style={styles.rideDotNavy}/>
                                </View>
                                <View style={styles.rideCities}>
                                    <Text style={styles.rideCity} numberOfLines={1}>{ride.from?.city?.name || '—'}</Text>
                                    <Text style={styles.rideCity} numberOfLines={1}>{ride.to?.city?.name || '—'}</Text>
                                </View>
                                <View style={styles.rideMeta}>
                                    <Text style={styles.rideTime}>{fmtRideTime(ride.departure_at)}</Text>
                                    <View style={styles.rideSeatsRow}>
                                        <Icon name="account-outline" size={11} color="#AAAAAA"/>
                                        <Text style={styles.rideSeats}>{seats != null ? `${seats} seats` : 'Private'}</Text>
                                    </View>
                                </View>
                                <View style={styles.rideRight}>
                                    <Text style={styles.ridePrice}>Rs. {Number(ride.price_per_seat || 0).toLocaleString()}</Text>
                                    <View style={styles.rideBookBtn}>
                                        <Text style={styles.rideBookText}>Book</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </ScrollView>

            <Sidebar
                visible={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                navigation={navigation}
                activeRoute="Home"
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#F5F5F7'},

    // Header
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    logo: {fontSize: 17, fontFamily: Fonts.bold, color: '#07163B', letterSpacing: 1},
    notifBtn: { position: 'relative', padding: 6, margin: -6 },
    notifDot: {
        position: 'absolute', top: 4, right: 4,
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: '#D83F54',
        borderWidth: 1.5, borderColor: '#FFFFFF',
    },

    scroll: {paddingBottom: 40},

    // Greeting
    greetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#FFFFFF',
    },
    greetSub: {fontSize: 12, fontFamily: Fonts.regular, color: '#AAAAAA', marginBottom: 2},
    greetName: {fontSize: 20, fontFamily: Fonts.bold, color: '#07163B'},
    walletChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F5F5F7',
        borderWidth: 1,
        borderColor: '#EAEDEE',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    walletAmt: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B'},
    walletPlus: {
        width: 17, height: 17, borderRadius: 9,
        backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center',
    },

    // Quick actions
    actionsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    actionItem: {flex: 1, alignItems: 'center', gap: 6},

    // Car services row
    svcSection: {marginTop: 18, marginBottom: 4},
    svcHead: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12},
    svcTitle: {fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B'},
    svcSeeAll: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D6AFF'},
    svcGrid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, rowGap: 16},
    svcTile: {width: '25%', alignItems: 'center', gap: 7, paddingHorizontal: 4},
    svcTileIcon: {
        width: 52, height: 52, borderRadius: 15,
        backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    svcTileLabel: {fontSize: 10.5, fontFamily: Fonts.medium, color: '#5D5F62', textAlign: 'center'},
    actionIcon: {
        width: 50, height: 50, borderRadius: 14,
        backgroundColor: '#F8F8F8',
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    actionLabel: {fontSize: 11, fontFamily: Fonts.medium, color: '#5D5F62', textAlign: 'center'},

    // Search card
    searchCard: {
        marginHorizontal: 16,
        marginTop: 18,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        marginBottom: 4,
    },
    searchCardTitle: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 12,
    },
    searchFields: {gap: 0},
    searchField: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 11,
    },
    searchDotGreen: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#109F2A',
    },
    searchDotNavy: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#07163B',
    },
    searchFieldText: {flex: 1, fontSize: 14, fontFamily: Fonts.medium, color: '#202223'},
    searchPlaceholder: {color: '#AAAAAA', fontFamily: Fonts.regular},
    searchConnectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
        marginVertical: -4,
        zIndex: 1,
    },
    searchConnectorLine: {
        width: 1.5,
        height: 18,
        backgroundColor: '#EAEDEE',
        marginLeft: 3.5,
    },
    swapBtn: {
        marginLeft: 'auto',
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: '#F5F5F7',
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    searchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        marginTop: 12,
        backgroundColor: '#FFD400',
        borderRadius: 10,
        paddingVertical: 12,
    },
    searchBtnText: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B'},

    // Banner swiper
    bannerSection: {marginTop: 20},
    bannerList: {paddingHorizontal: 20, gap: 12},
    bannerCard: {
        width: CARD_WIDTH,
        borderRadius: 18,
        overflow: 'hidden',
        minHeight: 170,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 4,
    },
    bannerImage: {
        flex: 1,
        minHeight: 170,
        justifyContent: 'flex-end',
        padding: 20,
    },
    bannerImageRadius: {borderRadius: 18},
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(7,22,59,0.55)',
    },
    bannerContent: {gap: 3},
    bannerEyebrow: {
        fontSize: 10,
        fontFamily: Fonts.semiBold,
        color: 'rgba(255,255,255,0.85)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 1,
    },
    bannerTitle: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 4,
    },
    bannerSub: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
    },
    bannerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        borderRadius: 9,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    bannerBtnText: {fontSize: 13, fontFamily: Fonts.semiBold},

    // Dots
    bannerDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
        marginTop: 12,
    },
    bannerDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: '#DDDDDD',
    },
    bannerDotActive: {
        width: 18,
        backgroundColor: '#07163B',
    },

    // Section
    section: {marginTop: 24},
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 2,
    },
    sectionTitle: {fontSize: 15, fontFamily: Fonts.semiBold, color: '#07163B'},
    seeAll: {fontSize: 12, fontFamily: Fonts.medium, color: '#FFD400'},
    sectionSub: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
        paddingHorizontal: 20,
        marginBottom: 14,
    },

    // Services
    servicesRow: {paddingHorizontal: 20, gap: 14},
    serviceItem: {alignItems: 'center', gap: 7, width: 62},
    serviceIcon: {
        width: 54, height: 54, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
    },
    serviceIconAdd: {
        width: 54, height: 54, borderRadius: 15,
        backgroundColor: '#F5F5F7',
        borderWidth: 1, borderColor: '#E8E8E8',
        alignItems: 'center', justifyContent: 'center',
    },
    serviceLabel: {
        fontSize: 10,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
        textAlign: 'center',
        lineHeight: 13,
    },

    // Cars
    carsRow: {paddingHorizontal: 20, gap: 12},
    carEmpty: {marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 18},
    carEmptyText: {flex: 1, fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6'},
    carCard: {
        width: 152,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        overflow: 'hidden',
    },
    carImageBox: {
        height: 90,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    carImage: {width: '100%', height: '100%'},
    carTag: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: '#FFD400',
        borderRadius: 5,
        paddingHorizontal: 7, paddingVertical: 2,
    },
    carTagText: {fontSize: 9, fontFamily: Fonts.semiBold, color: '#07163B'},
    carInfo: {padding: 10, gap: 2},
    carName: {fontSize: 12, fontFamily: Fonts.semiBold, color: '#07163B'},
    carKm: {fontSize: 11, fontFamily: Fonts.regular, color: '#AAAAAA'},
    carPrice: {fontSize: 13, fontFamily: Fonts.bold, color: '#07163B', marginTop: 3},

    // Inspection
    inspectionCard: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    inspectionLeft: {flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1},
    inspectionIconWrap: {
        width: 48, height: 48, borderRadius: 13,
        backgroundColor: '#EEF5FF',
        alignItems: 'center', justifyContent: 'center',
    },
    inspectionTitle: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 2},
    inspectionDesc: {fontSize: 12, fontFamily: Fonts.regular, color: '#AAAAAA'},
    inspectionArrow: {
        width: 30, height: 30, borderRadius: 9,
        backgroundColor: '#F5F5F7',
        alignItems: 'center', justifyContent: 'center',
    },

    // Rides
    rideCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        paddingVertical: 14,
        paddingHorizontal: 14,
        gap: 10,
    },
    rideRoute: {
        alignItems: 'center', width: 10,
        alignSelf: 'stretch', paddingVertical: 2,
    },
    rideDotGreen: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#109F2A'},
    rideLine: {width: 1.5, flex: 1, backgroundColor: '#EAEDEE', marginVertical: 3, minHeight: 16},
    rideDotNavy: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#07163B'},
    rideCities: {flex: 1, gap: 14},
    rideCity: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223'},
    rideMeta: {alignItems: 'flex-end', gap: 14},
    rideTime: {fontSize: 11, fontFamily: Fonts.regular, color: '#AAAAAA', textAlign: 'right'},
    rideSeatsRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
    rideSeats: {fontSize: 11, fontFamily: Fonts.regular, color: '#AAAAAA'},
    rideRight: {alignItems: 'flex-end', gap: 8},
    ridePrice: {fontSize: 13, fontFamily: Fonts.bold, color: '#07163B'},
    rideBookBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    rideBookText: {fontSize: 12, fontFamily: Fonts.semiBold, color: '#07163B'},
    ridesEmpty: {alignItems: 'center', gap: 8, paddingVertical: 24, marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE'},
    ridesEmptyText: {fontSize: 13, fontFamily: Fonts.regular, color: '#AAAAAA'},
});

export default HomeScreen;
