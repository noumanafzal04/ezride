import React from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import Skeleton from '../../components/Skeleton';
import {
    useNotifications,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
} from '../../hooks/useNotifications';
import { useRealtimeConnected } from '../../hooks/useRealtime';

// Backend `type` → icon + colour
const TYPE_META = {
    booking_requested: { icon: 'account-clock-outline',  color: '#6C63FF', bg: '#F0EEFF' },
    booking_accepted:  { icon: 'check-circle-outline',   color: '#109F2A', bg: '#E8F8EE' },
    booking_rejected:  { icon: 'close-circle-outline',   color: '#D83F54', bg: '#FFF0F2' },
    booking_cancelled: { icon: 'account-cancel-outline', color: '#5D5F62', bg: '#F1F2F4' },
    ride_cancelled:    { icon: 'close-octagon-outline',  color: '#D83F54', bg: '#FFF0F2' },
    ride_started:      { icon: 'steering',               color: '#1D6AFF', bg: '#EEF4FF' },
    ride_completed:    { icon: 'flag-checkered',         color: '#1D6AFF', bg: '#EEF4FF' },
    ride_alert:        { icon: 'bell-ring-outline',      color: '#6C63FF', bg: '#F0EEFF' },
    review_received:   { icon: 'star-outline',           color: '#FFC107', bg: '#FFF8E1' },
    driver_verified:   { icon: 'shield-check-outline',   color: '#109F2A', bg: '#E8F8EE' },
    driver_rejected:   { icon: 'shield-alert-outline',   color: '#D83F54', bg: '#FFF0F2' },
    inspection_update: { icon: 'car-wrench',             color: '#1D6AFF', bg: '#EEF4FF' },
    service_provider_rejected: { icon: 'shield-alert-outline', color: '#D83F54', bg: '#FFF0F2' },
    service_booking_requested: { icon: 'tools',               color: '#1D6AFF', bg: '#EEF4FF' },
    service_booking_accepted:  { icon: 'check-circle-outline', color: '#109F2A', bg: '#E8F8EE' },
    service_booking_rejected:  { icon: 'close-circle-outline', color: '#D83F54', bg: '#FFF0F2' },
    service_booking_started:   { icon: 'progress-wrench',     color: '#0F8A8A', bg: '#E6F7F7' },
    service_booking_completed: { icon: 'check-decagram-outline', color: '#109F2A', bg: '#E8F8EE' },
    service_booking_cancelled: { icon: 'close-octagon-outline', color: '#D83F54', bg: '#FFF0F2' },
    service_provider_approved: { icon: 'shield-check-outline', color: '#109F2A', bg: '#E8F8EE' },
};
const DEFAULT_META = { icon: 'bell-outline', color: '#6C63FF', bg: '#F0EEFF' };

const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return '';
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return d < 7 ? `${d}d` : `${Math.floor(d / 7)}w`;
};

const NotificationsScreen = ({ navigation }) => {
    // Live via Reverb; poll only as a fallback if the socket drops.
    const connected = useRealtimeConnected();
    const query = useNotifications({
        refetchInterval: connected ? false : 20000,
        refetchIntervalInBackground: false,
    });
    const items = (query.data?.pages || []).flatMap(p => p.notifications || []);
    const markRead = useMarkNotificationRead();
    const markAll = useMarkAllNotificationsRead();

    const hasUnread = items.some(n => !n.is_read);

    const onPressItem = (item) => {
        if (!item.is_read) markRead.mutate(item.id);
        const { ride_post_id: ridePostId, booking_id: bookingId, inspection_request_id: inspectionId } = item.data || {};
        const t = item.type;

        if (t === 'inspection_update' && inspectionId) {
            navigation.navigate('InspectionDetail', { id: inspectionId });
        } else if (t === 'service_booking_requested' || t === 'service_booking_cancelled') {
            // Provider-facing → their incoming requests
            navigation.navigate('ProviderServiceRequests');
        } else if (t === 'service_provider_approved') {
            navigation.navigate('ServiceProviderRegister');
        } else if (t.startsWith('service_booking_')) {
            // Customer-facing updates → their requests
            navigation.navigate('MyServiceRequests');
        } else if (t === 'booking_requested' || t === 'booking_cancelled') {
            // Driver-facing → their Booking Requests screen (see who requested)
            navigation.navigate('Main', { screen: 'Rides' });
        } else if (t === 'ride_completed' && bookingId) {
            navigation.navigate('Review', { bookingId, ridePostId });
        } else if (ridePostId) {
            // booking_accepted / rejected / ride_started / ride_alert → ride detail
            navigation.navigate('RideDetail', { offer: { id: ridePostId } });
        }
    };

    const renderNotification = ({ item }) => {
        const meta = TYPE_META[item.type] || DEFAULT_META;
        return (
            <TouchableOpacity
                style={[styles.row, !item.is_read && styles.rowUnread]}
                activeOpacity={0.6}
                onPress={() => onPressItem(item)}
            >
                <View style={[styles.icon, { backgroundColor: meta.bg }]}>
                    <Icon name={meta.icon} size={18} color={meta.color} />
                </View>

                <View style={styles.body}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    {!!item.message && <Text style={styles.msg} numberOfLines={2}>{item.message}</Text>}
                </View>

                <View style={styles.right}>
                    <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                    {!item.is_read && <View style={styles.dot} />}
                </View>
            </TouchableOpacity>
        );
    };

    const SkeletonRow = () => (
        <View style={styles.row}>
            <Skeleton width={38} height={38} radius={19} />
            <View style={styles.body}>
                <Skeleton width="50%" height={12} radius={6} />
                <Skeleton width="85%" height={10} radius={6} style={{ marginTop: 7 }} />
            </View>
            <Skeleton width={26} height={9} radius={5} />
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {hasUnread ? (
                    <TouchableOpacity onPress={() => markAll.mutate()} disabled={markAll.isPending}>
                        <Text style={styles.markAll}>Mark all</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 56 }} />
                )}
            </View>

            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                renderItem={renderNotification}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={items.length ? null : styles.emptyWrap}
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
                    query.isLoading ? (
                        <View>
                            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
                        </View>
                    ) : (
                        <View style={styles.empty}>
                            <Icon name="bell-sleep-outline" size={48} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No notifications yet</Text>
                            <Text style={styles.emptySub}>You’ll see ride updates here.</Text>
                        </View>
                    )
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    markAll: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#1D6AFF' },

    // Compact, feed-style rows
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F3F5',
    },
    rowUnread: { backgroundColor: '#FFFDF3' },
    icon: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
    },
    body: { flex: 1 },
    title: { fontSize: 13.5, fontFamily: Fonts.semiBold, color: '#202223' },
    msg: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#5D5F62', lineHeight: 17, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 6, paddingTop: 1, minWidth: 30 },
    time: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#FFD400',
    },

    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 90, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },
});

export default NotificationsScreen;
