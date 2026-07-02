import React from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();
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
        const d = item.data || {};
        const ridePostId = d.ride_post_id;
        const bookingId = d.booking_id;
        const t = item.type || '';

        // ── Inspection ──
        if (t.startsWith('inspection') && d.inspection_request_id) {
            return navigation.navigate('InspectionDetail', { id: d.inspection_request_id });
        }
        // ── Services ──
        if (t === 'service_booking_requested' || t === 'service_booking_cancelled') {
            return navigation.navigate('ProviderServiceRequests');
        }
        if (t === 'service_provider_approved' || t === 'service_provider_rejected') {
            return navigation.navigate('ServiceProviderRegister');
        }
        if (t.startsWith('service_booking_')) {
            return navigation.navigate('MyServiceRequests');
        }
        // ── Rides ──
        if (t === 'booking_requested' || t === 'booking_cancelled') {
            return navigation.navigate('Main', { screen: 'Rides' });
        }
        if (t === 'ride_completed' && bookingId) {
            return navigation.navigate('Review', { bookingId, ridePostId });
        }
        if (ridePostId) {
            return navigation.navigate('RideDetail', { offer: { id: ridePostId } });
        }
        if (t === 'ride_alert') {
            return navigation.navigate('AvailableRides');
        }
        // ── Account ──
        if (t === 'driver_verified' || t === 'driver_rejected' || t === 'review_received') {
            return navigation.navigate('Profile');
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
                {navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#07163B" />
                    </TouchableOpacity>
                ) : <View style={{ width: 24 }} />}
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
                contentContainerStyle={items.length ? { paddingBottom: insets.bottom + 24 } : styles.emptyWrap}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                ListFooterComponent={
                    query.isFetchingNextPage ? (
                        <ActivityIndicator color="#FFD400" style={{ marginVertical: 16 }} />
                    ) : query.hasNextPage ? (
                        <TouchableOpacity style={styles.loadMore} onPress={() => query.fetchNextPage()} activeOpacity={0.85}>
                            <Icon name="chevron-down" size={18} color="#07163B" />
                            <Text style={styles.loadMoreText}>Load more</Text>
                        </TouchableOpacity>
                    ) : (items.length > 0 ? <Text style={styles.endText}>That’s everything</Text> : null)
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

    loadMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: 'center', marginVertical: 16, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 22, borderWidth: 1.5, borderColor: '#EAEDEE', backgroundColor: '#FFFFFF' },
    loadMoreText: { fontSize: 13.5, fontFamily: Fonts.semiBold, color: '#07163B' },
    endText: { textAlign: 'center', fontSize: 12, fontFamily: Fonts.regular, color: '#C4C9CF', marginVertical: 18 },

    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 90, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },
});

export default NotificationsScreen;
