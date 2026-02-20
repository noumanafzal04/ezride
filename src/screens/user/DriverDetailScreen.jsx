import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const TABS = ['Reviews', 'Vehicle Info', 'Recent Trips'];

const REVIEWS = [
    { id: '1', name: 'Kubra Malik', rating: 4.0, text: 'Great experience! The driver was super friendly, and the ride was smooth. I got to my destination faster than expected. Would definitely use again!' },
    { id: '2', name: 'Kubra Malik', rating: 4.0, text: 'Great experience! The driver was super friendly, and the ride was smooth. I got to my destination faster than expected. Would definitely use again!' },
];

const StarRating = ({ rating }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Icon key={i} name={i <= Math.floor(rating) ? 'star' : 'star-outline'} size={12} color="#F5A247" />
        ))}
    </View>
);

const DriverDetailScreen = ({ navigation, route }) => {
    const [activeTab, setActiveTab] = useState(0);
    const offer = route?.params?.offer;

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Driver Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Car Image Banner */}
                <View style={styles.carBanner}>
                    <View style={styles.carImagePlaceholder}>
                        <Icon name="car" size={64} color="rgba(255,255,255,0.3)" />
                    </View>
                    <View style={styles.imageBadge}>
                        <Icon name="camera" size={12} color="#FFFFFF" />
                        <Text style={styles.imageBadgeText}>1/8</Text>
                    </View>
                </View>

                <View style={styles.body}>

                    {/* Driver + Vehicle Row */}
                    <View style={styles.driverVehicleRow}>
                        <View style={styles.driverLeft}>
                            <View style={styles.driverAvatar}>
                                <Icon name="account" size={28} color="#CCCCCC" />
                            </View>
                            <View>
                                <Text style={styles.driverName}>Amir Shehzad</Text>
                                <View style={styles.ratingRow}>
                                    <Icon name="star" size={13} color="#F5A247" />
                                    <Text style={styles.ratingText}>4.9 (120 Rides)</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.vehicleRight}>
                            <Text style={styles.vehicleName}>Toyota Corolla Altis</Text>
                            <Text style={styles.vehiclePlate}>LEA-20-5184</Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>98.5%</Text>
                            <Text style={styles.statLabel}>Completion</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>156</Text>
                            <Text style={styles.statLabel}>Total Trips</Text>
                        </View>
                    </View>

                    {/* Route Info */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Icon name="map-marker-outline" size={16} color="#5D5F62" />
                            <Text style={styles.infoText}>Valencia Housing Society, Defence Road, Lahore</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="map-marker-check-outline" size={16} color="#5D5F62" />
                            <Text style={styles.infoText}>Dulha House, City Center, Satellite Town, Islamabad</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Icon name="calendar-outline" size={16} color="#5D5F62" />
                            <Text style={styles.infoText}>Jan 12, 2025 - Wednesday · 6:00 pm</Text>
                        </View>
                    </View>

                    {/* Price Card */}
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Your Request</Text>
                            <Text style={styles.priceValue}>PKR 2,000</Text>
                        </View>
                        <View style={[styles.priceRow, { marginBottom: 0 }]}>
                            <Text style={styles.priceLabel}>Price Offered</Text>
                            <Text style={[styles.priceValue, styles.priceOffered]}>PKR 2,450</Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsRow}>
                        {TABS.map((tab, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.tab, activeTab === i && styles.tabActive]}
                                onPress={() => setActiveTab(i)}
                            >
                                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                                    {tab}{i === 0 ? ' (2)' : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Reviews */}
                    {activeTab === 0 && REVIEWS.map(review => (
                        <View key={review.id} style={styles.reviewCard}>
                            <View style={styles.reviewHeader}>
                                <View style={styles.reviewAvatar}>
                                    <Icon name="account" size={20} color="#CCCCCC" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.reviewName}>{review.name}</Text>
                                    <StarRating rating={review.rating} />
                                </View>
                                <Text style={styles.reviewRating}>{review.rating}/5.0</Text>
                            </View>
                            <Text style={styles.reviewText}>{review.text}</Text>
                            <View style={styles.reviewEmojis}>
                                <Text>👍</Text><Text>😊</Text>
                            </View>
                        </View>
                    ))}

                    {activeTab === 1 && (
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Icon name="car-outline" size={16} color="#5D5F62" />
                                <Text style={styles.infoText}>Toyota Corolla Altis 2022</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Icon name="palette-outline" size={16} color="#5D5F62" />
                                <Text style={styles.infoText}>Pearl White</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Icon name="card-text-outline" size={16} color="#5D5F62" />
                                <Text style={styles.infoText}>LEA-20-5184</Text>
                            </View>
                        </View>
                    )}

                    {activeTab === 2 && (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoText}>No recent trips available.</Text>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View style={styles.bottomBtns}>
                <TouchableOpacity style={styles.chatBtn}>
                    <Icon name="message-outline" size={20} color="#07163B" />
                    <Text style={styles.chatBtnText}>Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.callBtn}>
                    <Icon name="phone" size={20} color="#111111" />
                    <Text style={styles.callBtnText}>Call Driver</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },

    // Car Banner
    carBanner: {
        height: 200,
        backgroundColor: '#1A1A2E',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    carImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    imageBadgeText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: '#FFFFFF',
    },

    body: { padding: 16 },

    // Driver Vehicle Row
    driverVehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        marginBottom: 12,
    },
    driverLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    driverAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    vehicleRight: { alignItems: 'flex-end' },
    vehicleName: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 2,
    },
    vehiclePlate: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },

    // Stats
    statsRow: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        flexDirection: 'row',
        marginBottom: 12,
        overflow: 'hidden',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#EAEDEE',
    },
    statValue: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: '#07163B',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },

    // Info Card
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        marginBottom: 12,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    infoText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        flex: 1,
        lineHeight: 18,
    },

    // Price Card
    priceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceLabel: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    priceValue: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#202223',
    },
    priceOffered: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        color: '#07163B',
    },

    // Tabs
    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#07163B',
    },
    tabText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#AAAAAA',
    },
    tabTextActive: {
        color: '#07163B',
        fontFamily: Fonts.semiBold,
    },

    // Reviews
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    reviewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewName: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 3,
    },
    reviewRating: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#F5A247',
    },
    reviewText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        lineHeight: 18,
        marginBottom: 8,
    },
    reviewEmojis: {
        flexDirection: 'row',
        gap: 6,
    },

    // Bottom Buttons
    bottomBtns: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
    },
    chatBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    chatBtnText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    callBtn: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FFD400',
    },
    callBtnText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
});

export default DriverDetailScreen;
