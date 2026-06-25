import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator, ScrollView, Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import { useBottomInset } from '../../hooks/useBottomInset';
import { useProviderServiceBookings, useServiceBookingAction } from '../../hooks/useServices';
import { sbMeta, SB_STATUS_META } from '../../constants/serviceBooking';

const FILTERS = ['all', 'requested', 'accepted', 'in_progress', 'completed'];

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const ProviderServiceRequestsScreen = ({ navigation, embedded = false }) => {
    const pb = useBottomInset();
    const [filter, setFilter] = useState('all');
    const query = useProviderServiceBookings(filter === 'all' ? null : filter);
    const items = (query.data?.pages || []).flatMap(p => p.bookings || []);

    const act = useServiceBookingAction({
        onSuccess: () => Toast.show({ type: 'success', text1: 'Updated' }),
        onError: (err) => Toast.show({ type: 'error', text1: 'Failed', text2: err.response?.data?.message || 'Try again.' }),
    });
    const run = (id, action) => act.mutate({ id, action });

    const renderItem = ({ item }) => {
        const meta = sbMeta(item.status);
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

                <View style={styles.metaRow}>
                    <Icon name="account-outline" size={13} color="#9AA0A6" />
                    <Text style={styles.customer}>{item.customer?.name || 'Customer'}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Icon name={item.location_type === 'at_home' ? 'home-outline' : 'store-outline'} size={12} color="#9AA0A6" />
                    <Text style={styles.meta}>{item.location_type === 'at_home' ? (item.address || 'At customer location') : 'At the shop'}</Text>
                </View>
                {!!item.scheduled_at && (
                    <View style={styles.metaRow}><Icon name="calendar-clock" size={12} color="#9AA0A6" /><Text style={styles.meta}>{fmtDate(item.scheduled_at)}</Text></View>
                )}
                {!!item.car_info && <Text style={styles.meta}>🚗 {item.car_info}</Text>}
                {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}

                <View style={styles.actions}>
                    {['accepted', 'in_progress', 'completed'].includes(item.status) && (
                        <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('ChatDetail', { serviceBookingId: item.id })}>
                            <Icon name="message-outline" size={15} color="#07163B" />
                            <Text style={styles.ghostText}>Message</Text>
                        </TouchableOpacity>
                    )}
                    {!!item.customer?.phone && (
                        <TouchableOpacity style={styles.ghostBtn} onPress={() => Linking.openURL(`tel:${item.customer.phone}`)}>
                            <Icon name="phone" size={15} color="#07163B" />
                            <Text style={styles.ghostText}>Call</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'requested' && (
                        <>
                            <TouchableOpacity style={styles.dangerBtn} onPress={() => run(item.id, 'reject')} disabled={act.isPending}>
                                <Text style={styles.dangerText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.primaryBtn} onPress={() => run(item.id, 'accept')} disabled={act.isPending}>
                                <Text style={styles.primaryText}>Accept</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {item.status === 'accepted' && (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => run(item.id, 'start')} disabled={act.isPending}>
                            <Text style={styles.primaryText}>Start</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'in_progress' && (
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => run(item.id, 'complete')} disabled={act.isPending}>
                            <Text style={styles.primaryText}>Mark Complete</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            {!embedded && (
                <>
                    <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Icon name="arrow-left" size={24} color="#07163B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Service Requests</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </>
            )}

            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                    {FILTERS.map(f => {
                        const on = filter === f;
                        const label = f === 'all' ? 'All' : (SB_STATUS_META[f]?.label || f);
                        return (
                            <TouchableOpacity key={f} style={[styles.chip, on && styles.chipOn]} onPress={() => setFilter(f)}>
                                <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={items.length ? { padding: 16, gap: 12, paddingBottom: embedded ? 16 : pb } : styles.emptyWrap}
                showsVerticalScrollIndicator={false}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                onEndReachedThreshold={0.5}
                onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
                ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : null}
                ListEmptyComponent={
                    query.isLoading ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : (
                        <View style={styles.empty}>
                            <Icon name="clipboard-text-outline" size={46} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No requests</Text>
                        </View>
                    )
                }
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

    filters: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
    chipOn: { backgroundColor: '#07163B', borderColor: '#07163B' },
    chipText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#5D5F62' },
    chipTextOn: { color: '#FFFFFF' },

    card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, gap: 4 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    catWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    catName: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#202223' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 10.5, fontFamily: Fonts.semiBold },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 2 },
    customer: { fontSize: 13, fontFamily: Fonts.medium, color: '#07163B' },
    meta: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    notes: { fontSize: 12.5, fontFamily: Fonts.regular, color: '#5D5F62', marginTop: 2 },

    actions: { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' },
    ghostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#D7DBDE', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
    ghostText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#07163B' },
    dangerBtn: { borderWidth: 1.5, borderColor: '#D83F54', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
    dangerText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#D83F54' },
    primaryBtn: { backgroundColor: '#FFD400', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
    primaryText: { fontSize: 13, fontFamily: Fonts.semiBold, color: '#111111' },

    spin: { marginVertical: 20 },
    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 90, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
});

export default ProviderServiceRequestsScreen;
