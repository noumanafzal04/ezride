import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const OFFERS = [
    { id: '1', name: 'Amir Shehzad', rating: 4.9, rides: 120, price: 'Rs. 2500', seats: 2, date: 'Jan 12, 2025 - Wednesday - 6:00 pm', vehicle: 'Grey Honda City', plate: 'LEB-2317', online: true },
    { id: '2', name: 'Amir Shehzad', rating: 4.9, rides: 120, price: 'Rs. 2500', seats: 2, date: 'Jan 12, 2025 - Wednesday - 6:00 pm', vehicle: 'Grey Honda City 2018', plate: 'LEB-2317', online: true },
    { id: '3', name: 'Amir Shehzad', rating: 4.9, rides: 120, price: 'Rs. 2500', seats: 2, date: 'Jan 12, 2025 - Wed - 6:00 pm', vehicle: 'Grey Honda City 2018', plate: 'LEB-2317', online: false },
];

const POSTED_RIDE = {
    from: 'Lahore',
    to: 'Islamabad',
    type: 'Private',
    seats: 2,
    date: 'Jan 12, 2025 - Wed - 6:00 pm',
};

const RideOffersScreen = ({ navigation }) => {
    const [confirmModal, setConfirmModal] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);

    const renderOffer = ({ item }) => (
        <TouchableOpacity
            style={styles.offerCard}
            onPress={() => navigation.navigate('DriverDetail', { offer: item })}
            activeOpacity={0.85}
        >
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

            <View style={styles.infoRow}>
                <Icon name="calendar-outline" size={13} color="#5D5F62" />
                <Text style={styles.infoText}>{item.date}</Text>
                <View style={[styles.badgeDot, { backgroundColor: item.online ? '#109F2A' : '#AAAAAA' }]} />
            </View>
            <View style={styles.infoRow}>
                <Icon name="car-outline" size={13} color="#5D5F62" />
                <Text style={styles.infoText}>{item.vehicle}</Text>
                <Text style={styles.plateText}>{item.plate}</Text>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.chatIconBtn}>
                    <Icon name="message-outline" size={16} color="#5D5F62" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn}>
                    <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => { setSelectedOffer(item); setConfirmModal(true); }}
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

            {/* Offer Cards */}
            <FlatList
                data={OFFERS}
                keyExtractor={item => item.id}
                renderItem={renderOffer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />

            {/* Posted Ride - Pinned Bottom */}
            <View style={styles.postedRideContainer}>
                <View style={styles.postedTopRow}>
                    <View style={styles.postedRouteLeft}>
                        <Text style={styles.postedRoute}>
                            {POSTED_RIDE.from}
                            <Text style={styles.postedDash}> — </Text>
                            {POSTED_RIDE.to}
                        </Text>
                        <Text style={styles.postedDate}>{POSTED_RIDE.date}</Text>
                    </View>
                    <View style={styles.postedMetaRight}>
                        <TouchableOpacity style={styles.privateTag}>
                            <Text style={styles.privateTagText}>{POSTED_RIDE.type}</Text>
                        </TouchableOpacity>
                        <View style={styles.seatsTag}>
                            <Icon name="account-multiple-outline" size={13} color="#202223" />
                            <Text style={styles.seatsTagText}>{POSTED_RIDE.seats}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.cancelRequestBtn}>
                    <Text style={styles.cancelRequestText}>Cancel Request</Text>
                </TouchableOpacity>
            </View>

            {/* Confirm Modal */}
            <Modal visible={confirmModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Confirmation</Text>
                        <Text style={styles.modalBody}>
                            M. Arif has changed the date & time for this ride to{' '}
                            <Text style={styles.modalBold}>Jan 16, 6:00 am.</Text> Are you sure you want to accept this offer with the updated time?
                        </Text>
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalAcceptBtn}
                                onPress={() => {
                                    setConfirmModal(false);
                                    navigation.navigate('DriverDetail', { offer: selectedOffer });
                                }}
                            >
                                <Text style={styles.modalAcceptText}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
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
    list: { padding: 16, paddingBottom: 160 },

    // Offer Card
    offerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    driverRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatarWrap: { position: 'relative', marginRight: 10 },
    avatar: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center',
    },
    onlineDot: {
        position: 'absolute', bottom: 1, right: 1,
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#109F2A', borderWidth: 1.5, borderColor: '#FFFFFF',
    },
    driverInfo: { flex: 1 },
    driverName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 3 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    priceCol: { alignItems: 'flex-end' },
    offerPrice: { fontSize: 15, fontFamily: Fonts.bold, color: '#202223' },
    offerSeats: { fontSize: 12, fontFamily: Fonts.medium, color: '#109F2A' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    infoText: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62', flex: 1 },
    plateText: { fontSize: 12, fontFamily: Fonts.medium, color: '#202223' },
    badgeDot: { width: 8, height: 8, borderRadius: 4 },
    actionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginTop: 10, paddingTop: 10,
        borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    chatIconBtn: {
        width: 38, height: 38, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE',
        alignItems: 'center', justifyContent: 'center',
    },
    declineBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D83F54',
        backgroundColor: '#F04B4B0F',
        alignItems: 'center',
    },
    declineText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#D83F54' },
    acceptBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        backgroundColor: '#FFD400', alignItems: 'center',
    },
    acceptText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },

    // Posted Ride Bottom
    postedRideContainer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 24,
        gap: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    postedTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    postedRouteLeft: { flex: 1, gap: 3 },
    postedRoute: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#202223',
    },
    postedDash: {
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    postedDate: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    postedMetaRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    privateTag: {
        borderBottomWidth: 1.5,
        borderBottomColor: '#109F2A',
        paddingBottom: 1,
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

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
    },
    modalCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%' },
    modalHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16,
    },
    modalTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B', marginBottom: 12 },
    modalBody: { fontSize: 14, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 22, marginBottom: 24 },
    modalBold: { fontFamily: Fonts.semiBold, color: '#202223' },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 10,
        borderWidth: 1, borderColor: '#EAEDEE', alignItems: 'center',
    },
    modalCancelText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#5D5F62' },
    modalAcceptBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 10,
        backgroundColor: '#FFD400', alignItems: 'center',
    },
    modalAcceptText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default RideOffersScreen;
