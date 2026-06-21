import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, Alert, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import ReviewSheet from '../../components/ReviewSheet';
import { useMyServiceBookings, useCancelServiceBooking, useRateServiceBooking } from '../../hooks/useServices';
import { sbMeta, SB_CANCELLABLE } from '../../constants/serviceBooking';

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const MyServiceRequestsScreen = ({ navigation }) => {
    const query = useMyServiceBookings();
    const items = (query.data?.pages || []).flatMap(p => p.bookings || []);
    const [reviewing, setReviewing] = useState(null);

    const cancel = useCancelServiceBooking({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Request cancelled' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });
    const rate = useRateServiceBooking({
        onSuccess: () => { setReviewing(null); Toast.show({ type: 'success', text1: 'Review submitted' }); },
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });

    const confirmCancel = (id) => Alert.alert('Cancel request?', 'This cannot be undone.', [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => cancel.mutate(id) },
    ]);

    const renderItem = ({ item }) => {
        const meta = sbMeta(item.status);
        const canCancel = SB_CANCELLABLE.includes(item.status);
        const isCompleted = item.status === 'completed';
        const chattable = ['accepted', 'in_progress', 'completed'].includes(item.status);
        return (
            <View style={styles.card}>
                <View style={styles.topRow}>
                    <View style={styles.catWrap}>
                        <Icon name={item.category?.icon || 'wrench'} size={16} color="#07163B" />
                        <Text style={styles.catName}>{item.category?.name || 'Service'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                </View>

                <Text style={styles.provider}>{item.provider?.business_name}</Text>
                <View style={styles.metaRow}>
                    <Icon name={item.location_type === 'at_home' ? 'home-outline' : 'store-outline'} size={12} color="#9AA0A6" />
                    <Text style={styles.meta}>{item.location_type === 'at_home' ? 'At my location' : 'At the shop'}</Text>
                    {!!item.scheduled_at && <Text style={styles.meta}>· {fmtDate(item.scheduled_at)}</Text>}
                </View>
                {item.price != null && <Text style={styles.price}>Quote: Rs {Number(item.price).toLocaleString()}</Text>}
                {!!item.notes && <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>}

                {(canCancel || isCompleted || chattable || item.provider?.phone) && (
                    <View style={styles.actions}>
                        {chattable && (
                            <TouchableOpacity style={styles.callBtn} onPress={() => navigation.navigate('ChatDetail', { serviceBookingId: item.id })}>
                                <Icon name="message-outline" size={15} color="#07163B" />
                                <Text style={styles.callText}>Message</Text>
                            </TouchableOpacity>
                        )}
                        {!!item.provider?.phone && (
                            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.provider.phone}`)}>
                                <Icon name="phone" size={15} color="#07163B" />
                                <Text style={styles.callText}>Call</Text>
                            </TouchableOpacity>
                        )}
                        {canCancel && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item.id)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        {isCompleted && (
                            <TouchableOpacity style={styles.reviewBtn} onPress={() => setReviewing(item)}>
                                <Icon name="star-outline" size={15} color="#111111" />
                                <Text style={styles.reviewText}>Review</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Service Requests</Text>
                <View style={styles.headerSpacer} />
            </View>

            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={items.length ? { padding: 16, gap: 12 } : styles.emptyWrap}
                showsVerticalScrollIndicator={false}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                onEndReachedThreshold={0.5}
                onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
                ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : null}
                ListEmptyComponent={
                    query.isLoading ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : (
                        <View style={styles.empty}>
                            <Icon name="tools" size={46} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No service requests yet</Text>
                            <Text style={styles.emptySub}>Find a provider and request a service.</Text>
                        </View>
                    )
                }
            />

            <ReviewSheet
                visible={!!reviewing}
                onClose={() => setReviewing(null)}
                submitting={rate.isPending}
                title="Rate this service"
                subtitle={reviewing?.provider?.business_name}
                onSubmit={(rating, review) => rate.mutate({ id: reviewing.id, payload: { rating, review: review || null } })}
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
    headerSpacer: { width: 24 },

    card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, gap: 4 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    catWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    catName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 10.5, fontFamily: Fonts.semiBold },
    provider: { fontSize: 13, fontFamily: Fonts.medium, color: '#07163B', marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 2 },
    meta: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    price: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#07163B', marginTop: 2 },
    notes: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#5D5F62', marginTop: 2 },

    actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#D7DBDE', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
    callText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    cancelBtn: { borderWidth: 1.5, borderColor: '#D83F54', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
    cancelText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#D83F54' },
    reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFD400', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginLeft: 'auto' },
    reviewText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },

    spin: { marginVertical: 20 },
    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 90, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },
});

export default MyServiceRequestsScreen;
