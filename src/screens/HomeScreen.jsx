import React, {useState} from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import Sidebar from "../components/Sidebar";

const {width} = Dimensions.get('window');

const HomeScreen = ({navigation}) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#1A1A2E" barStyle="light-content"/>

            {/* ── FIXED HEADER ── */}
            <View style={styles.headerSection}>

                {/* Top Bar - Fixed */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                        <Icon name="menu" size={26} color="#FFFFFF"/>
                    </TouchableOpacity>
                    <Text style={styles.headerLogo}>LOQO</Text>
                    <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chats')}>
                        <Icon name="message-outline" size={20} color="#FFFFFF"/>
                    </TouchableOpacity>
                </View>

                {/* Welcome Row */}
                <View style={styles.welcomeRow}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userName}>Nouman Afzal</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.avatarContainer}>
                            <Icon name="account" size={30} color="#FFD400"/>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Wallet Card */}
                <View style={styles.walletCard}>
                    <View>
                        <Text style={styles.walletLabel}>Wallet Balance</Text>
                        <Text style={styles.walletAmount}>RS 250,000</Text>
                    </View>
                    <View style={styles.walletActions}>
                        <TouchableOpacity style={styles.topUpBtn} onPress={() => navigation.navigate('TopUp')}
                        >
                            <Text style={styles.topUpText}>Top up</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.historyBtn} onPress={() => navigation.navigate('History')}>
                            <Text style={styles.historyText}>History</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ── SCROLLABLE BODY ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{paddingBottom: 32}}
            >
                <View style={styles.body}>

                    {/* Quick Actions */}
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
                            <View style={styles.actionIconBg}>
                                <Icon name="magnify" size={32} color="#FFD400"/>
                            </View>
                            <Text style={styles.actionTitle}>Find a Ride</Text>
                            <Text style={styles.actionDesc}>Book city-to-city</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreateRequest')}
                                          activeOpacity={0.8}>
                            <View style={styles.actionIconBg}>
                                <Icon name="plus-circle-outline" size={32} color="#FFD400"/>
                            </View>
                            <Text style={styles.actionTitle}>Post a Ride</Text>
                            <Text style={styles.actionDesc}>Share your seats</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.actionCardWide} activeOpacity={0.8}>
                        <View style={styles.actionIconBgSmall}>
                            <Icon name="car-outline" size={26} color="#FFD400"/>
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.actionTitle}>Buy/Sell Your Car</Text>
                            <Text style={styles.actionDesc}>Find the best deals near you</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#AAAAAA"/>
                    </TouchableOpacity>

                    {/* Featured Banner */}
                    <View style={styles.featuredBanner}>
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerRoute}>LHE → ISL</Text>
                            <Text style={styles.bannerFrom}>Starting From</Text>
                            <Text style={styles.bannerPrice}>Rs. 2600</Text>
                        </View>
                        <View style={styles.bannerRight}>
                            <View style={styles.bannerImagePlaceholder}>
                                <Icon name="account-circle" size={64} color="rgba(255,255,255,0.25)"/>
                            </View>
                        </View>
                        <View style={styles.smileyBadge}>
                            <Text style={styles.smiley}>😊</Text>
                        </View>
                    </View>

                    {/* Upcoming Rides */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Upcoming Rides</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAll}>View All →</Text>
                        </TouchableOpacity>
                    </View>

                    {[
                        {
                            from: 'Lahore',
                            to: 'Islamabad',
                            fromTime: '09:00 AM · Today',
                            toTime: '02:00 PM · Today',
                            price: 'Rs. 2,600',
                            seats: 3
                        },
                        {
                            from: 'Islamabad',
                            to: 'Karachi',
                            fromTime: '11:00 AM · Tomorrow',
                            toTime: '08:00 PM · Tomorrow',
                            price: 'Rs. 4,800',
                            seats: 2
                        },
                        {
                            from: 'Lahore',
                            to: 'Multan',
                            fromTime: '07:00 AM · Today',
                            toTime: '12:00 PM · Today',
                            price: 'Rs. 1,500',
                            seats: 4
                        },
                    ].map((ride, i) => (
                        <View key={i} style={styles.rideCard}>
                            <View style={styles.rideLeft}>
                                <View style={styles.routeIndicator}>
                                    <View style={styles.dotGreen}/>
                                    <View style={styles.routeLine}/>
                                    <View style={styles.dotRed}/>
                                </View>
                                <View style={styles.rideInfo}>
                                    <Text style={styles.rideCity}>{ride.from}</Text>
                                    <Text style={styles.rideTime}>{ride.fromTime}</Text>
                                    <View style={{height: 16}}/>
                                    <Text style={styles.rideCity}>{ride.to}</Text>
                                    <Text style={styles.rideTime}>{ride.toTime}</Text>
                                </View>
                            </View>
                            <View style={styles.rideRight}>
                                <Text style={styles.ridePrice}>{ride.price}</Text>
                                <View style={styles.seatsRow}>
                                    <Icon name="account-outline" size={13} color="#5D5F62"/>
                                    <Text style={styles.seatsText}>{ride.seats} seats</Text>
                                </View>
                                <TouchableOpacity style={styles.bookBtn}>
                                    <Text style={styles.bookBtnText}>Book</Text>
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

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },

    // ── Header ──
    headerSection: {
        backgroundColor: '#1A1A2E',
        paddingTop: 52,
        paddingHorizontal: 20,
        paddingBottom: 28,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        // No position absolute needed - sits above ScrollView naturally
        zIndex: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    headerLogo: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        color: '#FFD400',
        letterSpacing: 4,
    },
    chatBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcomeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: 'rgba(255,255,255,0.65)',
        marginBottom: 2,
    },
    userName: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFD400',
        backgroundColor: '#252545',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Wallet ──
    walletCard: {
        backgroundColor: '#252540',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    walletLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: 'rgba(255,255,255,0.55)',
        marginBottom: 5,
    },
    walletAmount: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
    walletActions: {
        flexDirection: 'row',
        gap: 10,
    },
    topUpBtn: {
        backgroundColor: '#FFD400',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    topUpText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#1A1A2E',
    },
    historyBtn: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    historyText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },

    // ── Body ──
    body: {
        paddingHorizontal: 16,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        marginTop: 4,
    },
    viewAll: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#FFD400',
    },

    // ── Quick Actions ──
    quickActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    actionCardWide: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    actionIconBg: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#FFFBEA',
        borderWidth: 1,
        borderColor: '#FFE066',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionIconBgSmall: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FFFBEA',
        borderWidth: 1,
        borderColor: '#FFE066',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTitle: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 3,
    },
    actionDesc: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },

    // ── Featured Banner ──
    featuredBanner: {
        backgroundColor: '#1A1A2E',
        borderRadius: 20,
        padding: 22,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 110,
        overflow: 'hidden',
    },
    bannerContent: {
        flex: 1,
    },
    bannerRoute: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        marginBottom: 6,
    },
    bannerFrom: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: 'rgba(255,255,255,0.55)',
        marginBottom: 3,
    },
    bannerPrice: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: '#FFD400',
    },
    bannerRight: {
        marginLeft: 12,
    },
    bannerImagePlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    smileyBadge: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFD400',
        alignItems: 'center',
        justifyContent: 'center',
    },
    smiley: {
        fontSize: 16,
    },

    // ── Ride Cards ──
    rideCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    rideLeft: {
        flexDirection: 'row',
        gap: 12,
        flex: 1,
    },
    routeIndicator: {
        alignItems: 'center',
        paddingTop: 3,
        width: 12,
    },
    dotGreen: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22C55E',
    },
    routeLine: {
        width: 2,
        flex: 1,
        minHeight: 30,
        backgroundColor: '#E0E0E0',
        marginVertical: 3,
    },
    dotRed: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
    },
    rideInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    rideCity: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    rideTime: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        marginTop: 1,
    },
    rideRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingLeft: 8,
    },
    ridePrice: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        color: '#07163B',
    },
    seatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    seatsText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    bookBtn: {
        backgroundColor: '#FFD400',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 8,
    },
    bookBtnText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        color: '#1A1A2E',
    },
});

export default HomeScreen;
