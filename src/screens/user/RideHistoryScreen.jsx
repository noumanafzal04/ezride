import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import ReviewSheet from '../../components/ReviewSheet';
import useUserStore from '../../store/userStore';
import { useRideHistory } from '../../hooks/useRideHistory';
import { useRateBooking } from '../../hooks/useReview';

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso
        : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

const RideHistoryScreen = ({ navigation }) => {
    const user = useUserStore(s => s.user);
    const isDriver = user?.user_type === 'driver';
    const [reviewItem, setReviewItem] = useState(null);

    // Completed rides with infinite scroll
    const query = useRideHistory(isDriver);
    const rides = (query.data?.pages || []).flatMap(p => p.bookings || []);

    const rate = useRateBooking({
        onSuccess: () => { setReviewItem(null); Toast.show({ type: 'success', text1: 'Thanks for your review!' }); },
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const renderCard = ({ item }) => {
        const ride = item.ride || {};
        // The person to review: rider reviews the driver; driver reviews the passenger
        const other = isDriver ? item.passenger : ride.driver;
        const otherName = [other?.first_name, other?.last_name].filter(Boolean).join(' ') || (isDriver ? 'Rider' : 'Driver');

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => ride.id && navigation.navigate('RideDetail', { offer: { id: ride.id } })}
            >
                <View style={styles.topRow}>
                    <Text style={styles.route} numberOfLines={1}>
                        {ride.from_city}<Text style={styles.arrow}>  →  </Text>{ride.to_city}
                    </Text>
                    <View style={styles.badge}>
                        <Icon name="check-decagram" size={12} color="#1D6AFF" />
                        <Text style={styles.badgeText}>Completed</Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <Icon name="calendar-clock" size={13} color="#5D5F62" />
                    <Text style={styles.metaText}>{fmtDate(ride.departure_at)}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Icon name={isDriver ? 'account-outline' : 'steering'} size={13} color="#5D5F62" />
                    <Text style={styles.metaText}>
                        {isDriver ? 'Rider' : 'Driver'}: {otherName} · {item.seats_booked} seat{item.seats_booked > 1 ? 's' : ''} · Rs {Number(item.total_amount).toLocaleString()}
                    </Text>
                </View>

                {/* Review */}
                {item.my_review ? (
                    <View style={styles.reviewedRow}>
                        <Icon name="star" size={14} color="#FFC107" />
                        <Text style={styles.reviewedText}>You rated {item.my_review.rating}/5</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.reviewBtn} onPress={() => setReviewItem(item)}>
                        <Icon name="star-outline" size={15} color="#07163B" />
                        <Text style={styles.reviewText}>Leave a Review</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ride History</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={rides}
                keyExtractor={item => String(item.id)}
                renderItem={renderCard}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                onEndReachedThreshold={0.5}
                onEndReached={() => {
                    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
                }}
                ListFooterComponent={
                    query.isFetchingNextPage
                        ? <ActivityIndicator color="#FFD400" style={{ marginVertical: 16 }} />
                        : null
                }
                ListEmptyComponent={
                    query.isLoading
                        ? <ActivityIndicator color="#FFD400" style={{ marginTop: 50 }} />
                        : (
                            <View style={styles.empty}>
                                <Icon name="history" size={48} color="#DDDDDD" />
                                <Text style={styles.emptyTitle}>No completed rides yet</Text>
                            </View>
                        )
                }
            />

            <ReviewSheet
                visible={!!reviewItem}
                onClose={() => setReviewItem(null)}
                submitting={rate.isPending}
                title={isDriver ? 'Rate the rider' : 'Rate your driver'}
                subtitle={reviewItem ? `${reviewItem.ride?.from_city} → ${reviewItem.ride?.to_city}` : ''}
                onSubmit={(rating, review) => rate.mutate({ id: reviewItem.id, rating, review })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 16,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    list: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 16, marginBottom: 12, gap: 8 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    route: { flex: 1, fontSize: 15, fontFamily: Fonts.semiBold, color: '#202223' },
    arrow: { fontFamily: Fonts.regular, color: '#9E9E9E' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF4FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontFamily: Fonts.semiBold, color: '#1D6AFF' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    reviewedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    reviewedText: { fontSize: 13, fontFamily: Fonts.medium, color: '#5D5F62' },
    reviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#EAEDEE', marginTop: 2 },
    reviewText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
});

export default RideHistoryScreen;
