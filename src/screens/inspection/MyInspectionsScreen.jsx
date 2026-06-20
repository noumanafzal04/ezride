import React from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import Skeleton from '../../components/Skeleton';
import { useMyInspections } from '../../hooks/useInspections';
import { metaFor } from '../../constants/inspection';

const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const StatusBadge = ({ status }) => {
    const meta = metaFor(status);
    return (
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <Icon name={meta.icon} size={12} color={meta.color} />
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
    );
};

const MyInspectionsScreen = ({ navigation }) => {
    const query = useMyInspections();
    const items = (query.data?.pages || []).flatMap(p => p.requests || []);

    const renderItem = ({ item }) => {
        const carLine = [item.car_year, item.car_make, item.car_model].filter(Boolean).join(' ');
        return (
            <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('InspectionDetail', { id: item.id })}
            >
                <View style={styles.iconWrap}>
                    <Icon name="car-wrench" size={20} color="#07163B" />
                </View>
                <View style={styles.rowBody}>
                    <Text style={styles.carTitle} numberOfLines={1}>{carLine || 'Car inspection'}</Text>
                    <View style={styles.metaRow}>
                        {!!item.city?.name && (
                            <View style={styles.metaItem}>
                                <Icon name="map-marker-outline" size={12} color="#9AA0A6" />
                                <Text style={styles.metaText}>{item.city.name}</Text>
                            </View>
                        )}
                        <Text style={styles.metaText}>· {fmtDate(item.created_at)}</Text>
                    </View>
                    <StatusBadge status={item.status} />
                </View>
                <Icon name="chevron-right" size={20} color="#C7CBD1" />
            </TouchableOpacity>
        );
    };

    const SkeletonRow = () => (
        <View style={styles.row}>
            <Skeleton width={42} height={42} radius={12} />
            <View style={styles.rowBody}>
                <Skeleton width="60%" height={13} radius={6} />
                <Skeleton width="40%" height={10} radius={6} style={{ marginTop: 8 }} />
                <Skeleton width={90} height={20} radius={10} style={{ marginTop: 8 }} />
            </View>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Inspections</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={items.length ? { paddingVertical: 8 } : styles.emptyWrap}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                onEndReachedThreshold={0.5}
                onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
                ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={{ marginVertical: 16 }} /> : null}
                ListEmptyComponent={
                    query.isLoading ? (
                        <View>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</View>
                    ) : (
                        <View style={styles.empty}>
                            <Icon name="car-wrench" size={48} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No inspection requests yet</Text>
                            <Text style={styles.emptySub}>Request a car inspection and track it here.</Text>
                        </View>
                    )
                }
            />

            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('InspectionRequest')}
            >
                <Icon name="plus" size={22} color="#111111" />
                <Text style={styles.fabText}>New Request</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingTop: 52, paddingBottom: 14,
        paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F2F3F5',
    },
    iconWrap: {
        width: 42, height: 42, borderRadius: 12, backgroundColor: '#F5F5F7',
        alignItems: 'center', justifyContent: 'center',
    },
    rowBody: { flex: 1, gap: 2 },
    carTitle: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#202223' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },

    badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
    badgeText: { fontSize: 11, fontFamily: Fonts.semiBold },

    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 100, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },

    fab: {
        position: 'absolute', right: 16, bottom: 28,
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFD400', borderRadius: 28, paddingHorizontal: 18, paddingVertical: 14,
        elevation: 6, shadowColor: '#FFD400', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    },
    fabText: { fontSize: 14, fontFamily: Fonts.semiBold, color: '#111111' },
});

export default MyInspectionsScreen;
