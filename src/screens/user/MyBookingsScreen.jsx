import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, Alert, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import Sidebar from '../../components/Sidebar';
import ReviewSheet from '../../components/ReviewSheet';
import { RideCardSkeleton } from '../../components/Skeletons';
import { useMyBookings, useCancelBooking, useCompleteBooking } from '../../hooks/useMyBookings';
import { useRateBooking } from '../../hooks/useReview';

const TABS = ['Pending', 'Accepted', 'Completed', 'Cancelled'];
const TAB_STATUSES = {
    Pending:   ['pending'],
    Accepted:  ['accepted'],
    Completed: ['completed'],
    Cancelled: ['rejected', 'cancelled'],
};

const STATUS_BADGE = {
    pending:   { label: 'Pending',   color: '#D97706', bg: '#FFF7ED' },
    accepted:  { label: 'Accepted',  color: '#109F2A', bg: '#E8F8EE' },
    rejected:  { label: 'Rejected',  color: '#D83F54', bg: '#FFF0F2' },
    cancelled: { label: 'Cancelled', color: '#5D5F62', bg: '#F1F2F4' },
    completed: { label: 'Completed', color: '#1D6AFF', bg: '#EEF4FF' },
};

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso
        : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const MyBookingsScreen = ({ navigation, embedded = false }) => {
    const [activeTab, setActiveTab] = useState('Pending');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reviewFor, setReviewFor] = useState(null);

    const bookingsQuery = useMyBookings();
    const all = bookingsQuery.data || [];

    const cancelBooking = useCancelBooking({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Booking Cancelled' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const rate = useRateBooking({
        onSuccess: () => { setReviewFor(null); Toast.show({ type: 'success', text1: 'Thanks for your review!' }); },
        onError: (err) => Toast.show({ type: 'error', text1: 'Could not submit', text2: err.response?.data?.message || 'Try again.' }),
    });

    const completeRide = useCompleteBooking({
        onSuccess: (_r, id) => {
            const b = all.find(x => x.id === id);
            Toast.show({ type: 'success', text1: 'Ride completed', text2: 'Hope you had a great trip!' });
            if (b) setReviewFor(b); // straight into review, like the driver flow
        },
        onError: (err) => Toast.show({ type: 'error', text1: 'Could not complete', text2: err.response?.data?.message || 'Try again.' }),
    });

    const confirmComplete = (booking) => {
        Alert.alert('Complete this ride?', 'Mark the ride as finished and rate your driver.', [
            { text: 'Not yet', style: 'cancel' },
            { text: 'Complete', onPress: () => completeRide.mutate(booking.id) },
        ]);
    };

    const currentList = all.filter(b => TAB_STATUSES[activeTab].includes(b.status));
    const tabCount = (tab) => all.filter(b => TAB_STATUSES[tab].includes(b.status)).length;

    const confirmCancel = (booking) => {
        Alert.alert('Cancel booking?', 'Your seat request will be withdrawn.', [
            { text: 'Keep', style: 'cancel' },
            { text: 'Cancel Booking', style: 'destructive', onPress: () => cancelBooking.mutate(booking.id) },
        ]);
    };

    const callDriver = (phone) => phone && Linking.openURL(`tel:${phone}`);
    const goSearch = () => navigation.navigate('AvailableRides');
    const goChat = (booking) => navigation.navigate('ChatDetail', { bookingId: booking.id });

    const renderCard = ({ item }) => {
        const ride = item.ride || {};
        const driver = ride.driver || {};
        const isPending = item.status === 'pending';
        const isAccepted = item.status === 'accepted';
        const isClosed = ['rejected', 'cancelled'].includes(item.status);
        const inProgress = isAccepted && ride.status === 'in_progress';
        const badge = inProgress
            ? { label: 'In progress', color: '#1D6AFF', bg: '#EEF4FF' }
            : (STATUS_BADGE[item.status] || STATUS_BADGE.pending);

        return (
            <View style={styles.card}>
                {/* Route + status */}
                <View style={styles.topRow}>
                    <Text style={styles.route} numberOfLines={1}>
                        {ride.from_city}<Text style={styles.arrow}>  →  </Text>{ride.to_city}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <Icon name="calendar-clock" size={13} color="#5D5F62" />
                    <Text style={styles.metaText}>{fmtDate(ride.departure_at)}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Icon name="seat-passenger" size={13} color="#5D5F62" />
                    <Text style={styles.metaText}>
                        {item.seats_booked} seat{item.seats_booked > 1 ? 's' : ''} · Rs {Number(item.total_amount).toLocaleString()}
                    </Text>
                </View>

                {/* Accepted → driver contact */}
                {isAccepted && (
                    <View style={styles.driverBox}>
                        <View style={styles.driverAvatar}>
                            <Text style={styles.driverInitial}>{(driver.first_name?.[0] || 'D').toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.driverName}>
                                {[driver.first_name, driver.last_name].filter(Boolean).join(' ') || 'Driver'}
                            </Text>
                            <Text style={[styles.driverSub, inProgress && { color: '#1D6AFF' }]}>
                                {inProgress ? '🚗 Ride in progress' : 'Your ride is confirmed'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.msgBtn} onPress={() => goChat(item)}>
                            <Icon name="message-outline" size={16} color="#07163B" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callBtn} onPress={() => callDriver(driver.phone_number)}>
                            <Icon name="phone" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    {inProgress && (
                        <TouchableOpacity
                            style={styles.completeBtn}
                            onPress={() => confirmComplete(item)}
                            disabled={completeRide.isPending}
                        >
                            <Icon name="flag-checkered" size={16} color="#07163B" />
                            <Text style={styles.completeText}>{completeRide.isPending && completeRide.variables === item.id ? 'Completing…' : 'Complete Ride'}</Text>
                        </TouchableOpacity>
                    )}
                    {(item.can_cancel ?? (isPending || isAccepted)) && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => confirmCancel(item)}
                            disabled={cancelBooking.isPending}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                    {item.can_review && (
                        <TouchableOpacity style={styles.searchBtn} onPress={() => setReviewFor(item)}>
                            <Icon name="star" size={15} color="#111111" />
                            <Text style={styles.searchText}>Leave a Review</Text>
                        </TouchableOpacity>
                    )}
                    {item.my_review && (
                        <View style={styles.reviewedTag}>
                            <Icon name="star" size={13} color="#92600B" />
                            <Text style={styles.reviewedText}>Reviewed</Text>
                        </View>
                    )}
                    {isClosed && !item.can_review && !item.my_review && (
                        <TouchableOpacity style={styles.searchBtn} onPress={goSearch}>
                            <Icon name="magnify" size={15} color="#111111" />
                            <Text style={styles.searchText}>Search More Rides</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Icon name="ticket-confirmation-outline" size={50} color="#DDDDDD" />
            <Text style={styles.emptyTitle}>
                {activeTab === 'Pending' ? 'No pending bookings'
                    : activeTab === 'Accepted' ? 'No accepted rides yet'
                    : 'Nothing here yet'}
            </Text>
            <TouchableOpacity style={styles.searchBtn} onPress={goSearch}>
                <Icon name="magnify" size={15} color="#111111" />
                <Text style={styles.searchText}>Find a Ride</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.root}>
            {!embedded && (
                <>
                    <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                            <Icon name="menu" size={24} color="#07163B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Bookings</Text>
                        <TouchableOpacity onPress={goSearch}>
                            <Icon name="magnify" size={22} color="#07163B" />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <View style={styles.tabsRow}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        {tabCount(tab) > 0 && (
                            <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                                <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                                    {tabCount(tab)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={currentList}
                keyExtractor={item => String(item.id)}
                renderItem={renderCard}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshing={bookingsQuery.isFetching}
                onRefresh={bookingsQuery.refetch}
                ListEmptyComponent={
                    bookingsQuery.isLoading
                        ? <RideCardSkeleton count={3} />
                        : renderEmpty()
                }
            />

            <Sidebar
                visible={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                navigation={navigation}
                activeRoute="Rides"
            />

            <ReviewSheet
                visible={!!reviewFor}
                onClose={() => setReviewFor(null)}
                submitting={rate.isPending}
                title="Rate your ride"
                subtitle={reviewFor ? `${reviewFor.ride?.from_city || ''} → ${reviewFor.ride?.to_city || ''}` : ''}
                onSubmit={(rating, review) => reviewFor && rate.mutate({ id: reviewFor.id, rating, review })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    tabsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EAEDEE' },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
    tabActive: { borderBottomWidth: 2, borderBottomColor: '#07163B' },
    tabText: { fontSize: 13, fontFamily: Fonts.medium, color: '#AAAAAA' },
    tabTextActive: { fontFamily: Fonts.semiBold, color: '#07163B' },
    tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EAEDEE', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    tabBadgeActive: { backgroundColor: '#FFD400' },
    tabBadgeText: { fontSize: 10, fontFamily: Fonts.bold, color: '#5D5F62' },
    tabBadgeTextActive: { color: '#111111' },

    list: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE',
        padding: 16, marginBottom: 12, gap: 8,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    route: { flex: 1, fontSize: 15, fontFamily: Fonts.semiBold, color: '#202223' },
    arrow: { fontFamily: Fonts.regular, color: '#9E9E9E' },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontFamily: Fonts.semiBold },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },

    driverBox: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#F8FBF9', borderRadius: 12, padding: 12, marginTop: 4,
        borderWidth: 1, borderColor: '#E8F8EE',
    },
    driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD400', alignItems: 'center', justifyContent: 'center' },
    driverInitial: { fontSize: 17, fontFamily: Fonts.bold, color: '#07163B' },
    driverName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#07163B' },
    driverSub: { fontSize: 12, fontFamily: Fonts.regular, color: '#109F2A', marginTop: 1 },
    msgBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: '#EAEDEE', alignItems: 'center', justifyContent: 'center' },
    callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#109F2A', alignItems: 'center', justifyContent: 'center' },

    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#D83F54', backgroundColor: '#FFF0F2', alignItems: 'center' },
    cancelText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#D83F54' },
    completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: '#FFD400' },
    completeText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    searchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#FFD400' },
    reviewedTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF4C2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    reviewedText: { fontSize: 12.5, fontFamily: 'Poppins-SemiBold', color: '#92600B' },
    searchText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },

    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
});

export default MyBookingsScreen;
