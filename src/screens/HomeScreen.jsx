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

const {width} = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20px margin each side

// ─── Data ─────────────────────────────────────────────────────────────────────

const ACTIONS = [
    {key: 'find', icon: 'magnify', label: 'Find Ride', route: 'AvailableRides'},
    {key: 'post', icon: 'plus-circle-outline', label: 'Post Ride', route: 'PostRide'},
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

const SERVICES = [
    {key: 's1', icon: 'wrench-outline', label: 'Mechanic', bg: '#EEF5FF', ic: '#2563EB'},
    {key: 's2', icon: 'car-wash', label: 'Car Wash', bg: '#EDFFF4', ic: '#16A34A'},
    {key: 's3', icon: 'tire', label: 'Tyre Shop', bg: '#FFFBEB', ic: '#D97706'},
    {key: 's4', icon: 'fuel', label: 'Fuel', bg: '#FFF1F2', ic: '#E11D48'},
    {key: 's5', icon: 'car-battery', label: 'Battery', bg: '#F3EEFF', ic: '#7C3AED'},
    {key: 's6', icon: 'tools', label: 'Detailing', bg: '#FFF7ED', ic: '#EA580C'},
];

const UPCOMING = [
    {from: 'Lahore', to: 'Islamabad', time: 'Today · 9:00 AM', price: 'Rs. 2,600', seats: 3},
    {from: 'Islamabad', to: 'Karachi', time: 'Tomorrow · 11:00 AM', price: 'Rs. 4,800', seats: 2},
];

// ─── Component ────────────────────────────────────────────────────────────────

const HomeScreen = ({navigation}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
                    onPress={() => navigation.navigate('Chats')}
                >
                    <Icon name="bell-outline" size={20} color="#07163B"/>
                    <View style={styles.notifDot}/>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* ── GREETING + WALLET ── */}
                <View style={styles.greetRow}>
                    <View>
                        <Text style={styles.greetSub}>Good morning 👋</Text>
                        <Text style={styles.greetName}>Nouman Afzal</Text>
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
                    {ACTIONS.map(a => (
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

                {/* ── CAR SERVICES ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Car Services</Text>
                        <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSub}>Find trusted pros near you</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.servicesRow}
                    >
                        {SERVICES.map(s => (
                            <TouchableOpacity key={s.key} style={styles.serviceItem} activeOpacity={0.75}>
                                <View style={[styles.serviceIcon, {backgroundColor: s.bg}]}>
                                    <Icon name={s.icon} size={23} color={s.ic}/>
                                </View>
                                <Text style={styles.serviceLabel}>{s.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.serviceItem} activeOpacity={0.75}>
                            <View style={styles.serviceIconAdd}>
                                <Icon name="plus" size={18} color="#CCCCCC"/>
                            </View>
                            <Text style={styles.serviceLabel}>{'Offer\nService'}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* ── BUY / SELL FEATURED ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Buy / Sell Cars</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
                            <Text style={styles.seeAll}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSub}>Featured listings near you</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carsRow}
                    >
                        {[
                            {name: 'Honda City 2021', price: 'Rs. 32 Lac', km: '45,000 km', tag: 'Verified', image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80'},
                            {name: 'Toyota Corolla 2020', price: 'Rs. 48 Lac', km: '38,000 km', tag: 'Featured', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&q=80'},
                            {name: 'Suzuki Alto 2022', price: 'Rs. 22 Lac', km: '12,000 km', tag: 'New', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80'},
                        ].map((car, i) => (
                            <TouchableOpacity key={i} style={styles.carCard} activeOpacity={0.85}>
                                <View style={styles.carImageBox}>
                                    <Image source={{uri: car.image}} style={styles.carImage} resizeMode="cover"/>
                                    <View style={styles.carTag}>
                                        <Text style={styles.carTagText}>{car.tag}</Text>
                                    </View>
                                </View>
                                <View style={styles.carInfo}>
                                    <Text style={styles.carName}>{car.name}</Text>
                                    <Text style={styles.carKm}>{car.km}</Text>
                                    <Text style={styles.carPrice}>{car.price}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── BOOK INSPECTION ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Car Inspection</Text>
                    </View>
                    <Text style={styles.sectionSub}>Know exactly what you're buying</Text>
                    <TouchableOpacity style={styles.inspectionCard} activeOpacity={0.85}>
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

                {/* ── UPCOMING RIDES ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Upcoming Rides</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('History')}>
                            <Text style={styles.seeAll}>View all</Text>
                        </TouchableOpacity>
                    </View>
                    {UPCOMING.map((ride, i) => (
                        <View key={i} style={styles.rideCard}>
                            <View style={styles.rideRoute}>
                                <View style={styles.rideDotGreen}/>
                                <View style={styles.rideLine}/>
                                <View style={styles.rideDotNavy}/>
                            </View>
                            <View style={styles.rideCities}>
                                <Text style={styles.rideCity}>{ride.from}</Text>
                                <Text style={styles.rideCity}>{ride.to}</Text>
                            </View>
                            <View style={styles.rideMeta}>
                                <Text style={styles.rideTime}>{ride.time}</Text>
                                <View style={styles.rideSeatsRow}>
                                    <Icon name="account-outline" size={11} color="#AAAAAA"/>
                                    <Text style={styles.rideSeats}>{ride.seats} seats</Text>
                                </View>
                            </View>
                            <View style={styles.rideRight}>
                                <Text style={styles.ridePrice}>{ride.price}</Text>
                                <TouchableOpacity style={styles.rideBookBtn}>
                                    <Text style={styles.rideBookText}>Book</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
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
    notifBtn: {position: 'relative'},
    notifDot: {
        position: 'absolute', top: 0, right: 0,
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
});

export default HomeScreen;
