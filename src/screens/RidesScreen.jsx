import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';

const OFFERS = [
    {
        id: '1',
        name: 'Amir Shehzad',
        rating: 4.9,
        rides: 120,
        price: 'Rs. 2500',
        seats: 2,
        date: 'Jan 12, 2025 - Wed - 6:00 pm',
        vehicle: 'Grey Honda City 2018',
        plate: 'LEB-2317',
        online: true,
    },
    {
        id: '2',
        name: 'Amir Shehzad',
        rating: 4.9,
        rides: 120,
        price: 'Rs. 2500',
        seats: 2,
        date: 'Jan 12, 2025 - Wed - 6:00 pm',
        vehicle: 'Grey Honda City 2018',
        plate: 'LEB-2317',
        online: true,
    },
    {
        id: '3',
        name: 'Amir Shehzad',
        rating: 4.9,
        rides: 120,
        price: 'Rs. 2500',
        seats: 2,
        date: 'Jan 12, 2025 - Wed - 6:00 pm',
        vehicle: 'Grey Honda City 2018',
        plate: 'LEB-2317',
        online: false,
    },
    {
        id: '4',
        name: 'Ali Shehzad',
        rating: 4.9,
        rides: 120,
        price: 'Rs. 2500',
        seats: 2,
        date: 'Jan 12, 2025 - Wed - 6:00 pm',
        vehicle: 'Grey Honda City 2018',
        plate: 'LEB-2317',
        online: false,
    },
];

const POSTED_RIDE = {
    from: 'Lahore',
    to: 'Islamabad',
    type: 'Private',
    seats: 2,
    date: 'Jan 12, 2025 - Wed - 6:00 pm',
};

const RidesScreen = ({ navigation }) => {

    const renderOffer = ({ item }) => (
        <TouchableOpacity
            style={styles.offerCard}
            onPress={() => navigation.navigate('DriverDetail', { offer: item })}
            activeOpacity={0.85}
        >
            {/* Driver Info Row */}
            <View style={styles.driverRow}>
                <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                        <Icon name="account" size={22} color="#CCCCCC" />
                    </View>
                    {item.online && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{item.name}</Text>
                    <View style={styles.ratingRow}>
                        <Icon name="star" size={12} color="#F5A247" />
                        <Text style={styles.ratingText}>{item.rating} ({item.rides} Rides)</Text>
                    </View>
                </View>
                <View style={styles.priceCol}>
                    <Text style={styles.offerPrice}>{item.price}</Text>
                    <Text style={styles.offerSeats}>{item.seats} Seats</Text>
                </View>
            </View>

            {/* Date Row */}
            <View style={styles.infoRow}>
                <Icon name="calendar-outline" size={13} color="#5D5F62" />
                <Text style={styles.infoText}>{item.date}</Text>
                <View style={[styles.badgeDot, { backgroundColor: item.online ? '#109F2A' : '#AAAAAA' }]} />
            </View>

            {/* Vehicle Row */}
            <View style={styles.infoRow}>
                <Icon name="car-outline" size={13} color="#5D5F62" />
                <Text style={styles.infoText}>{item.vehicle}</Text>
                <Text style={styles.plateText}>{item.plate}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.chatIconBtn}>
                    <Icon name="message-outline" size={16} color="#5D5F62" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn}>
                    <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => navigation.navigate('DriverDetail', { offer: item })}
                >
                    <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ride Offers</Text>
            </View>

            {/* Offer Cards List */}
            <FlatList
                data={OFFERS}
                keyExtractor={item => item.id}
                renderItem={renderOffer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />

            {/* Posted Ride Card - Fixed Bottom */}
            <View style={styles.postedRideContainer}>
                <View style={styles.postedRideCard}>

                    {/* Route + Meta */}
                    <View style={styles.postedTop}>
                        <View style={styles.postedRouteRow}>
                            <Text style={styles.postedRoute}>
                                {POSTED_RIDE.from}
                                <Text style={styles.postedArrow}> — </Text>
                                {POSTED_RIDE.to}
                            </Text>
                            <View style={styles.postedMeta}>
                                <TouchableOpacity style={styles.privateTag}>
                                    <Text style={styles.privateTagText}>{POSTED_RIDE.type}</Text>
                                </TouchableOpacity>
                                <View style={styles.seatsTag}>
                                    <Icon name="account-multiple-outline" size={13} color="#202223" />
                                    <Text style={styles.seatsTagText}>{POSTED_RIDE.seats}</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.postedDate}>{POSTED_RIDE.date}</Text>
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity style={styles.cancelRequestBtn}>
                        <Text style={styles.cancelRequestText}>Cancel Request</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },

    // Header
    header: {
        backgroundColor: '#FFFFFF',
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
        textAlign: 'center',
    },

    list: {
        padding: 16,
        paddingBottom: 200,
    },

    // Offer Card
    offerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarWrap: {
        position: 'relative',
        marginRight: 10,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#109F2A',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    driverInfo: { flex: 1 },
    driverName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
        marginBottom: 3,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    priceCol: { alignItems: 'flex-end' },
    offerPrice: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        color: '#202223',
    },
    offerSeats: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#109F2A',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        flex: 1,
    },
    plateText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#202223',
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    chatIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D83F54',
        alignItems: 'center',
    },
    declineText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#D83F54',
    },
    acceptBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: '#FFD400',
        alignItems: 'center',
    },
    acceptText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },

    // Posted Ride Card - Fixed Bottom
    postedRideContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 10,
    },
    postedRideCard: {
        gap: 12,
    },
    postedTop: {
        gap: 4,
    },
    postedRouteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    postedRoute: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#202223',
    },
    postedArrow: {
        color: '#5D5F62',
        fontFamily: Fonts.regular,
    },
    postedMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    privateTag: {
        borderBottomWidth: 1,
        borderBottomColor: '#109F2A',
    },
    privateTagText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#109F2A',
    },
    seatsTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seatsTagText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#202223',
    },
    postedDate: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    cancelRequestBtn: {
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D83F54',
        alignItems: 'center',
    },
    cancelRequestText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#D83F54',
    },
});

export default RidesScreen;
