import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

const arr = (n) => Array.from({ length: n });

// 2-column car grid (Marketplace, Home featured).
export const CarGridSkeleton = ({ count = 6 }) => (
    <View style={s.grid}>
        {arr(count).map((_, i) => (
            <View key={i} style={s.card}>
                <Skeleton width="100%" height={110} radius={0} />
                <View style={s.cardBody}>
                    <Skeleton width="75%" height={12} />
                    <Skeleton width="45%" height={15} />
                    <Skeleton width="85%" height={10} />
                </View>
            </View>
        ))}
    </View>
);

// Avatar + two lines rows (providers, bookings, generic lists).
export const RowListSkeleton = ({ count = 6 }) => (
    <View style={s.rows}>
        {arr(count).map((_, i) => (
            <View key={i} style={s.row}>
                <Skeleton width={46} height={46} radius={23} />
                <View style={s.rowText}>
                    <Skeleton width="55%" height={12} />
                    <Skeleton width="35%" height={10} />
                </View>
            </View>
        ))}
    </View>
);

// 3-column tile grid (service categories).
export const TilesSkeleton = ({ count = 9 }) => (
    <View style={s.tiles}>
        {arr(count).map((_, i) => (
            <View key={i} style={s.tile}>
                <Skeleton width={46} height={46} radius={13} />
                <Skeleton width="70%" height={11} />
                <Skeleton width="45%" height={9} />
            </View>
        ))}
    </View>
);

// Full detail page (car detail, etc.).
export const DetailSkeleton = () => (
    <View>
        <Skeleton width="100%" height={260} radius={0} />
        <View style={s.detail}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={22} />
            <View style={{ height: 10 }} />
            <Skeleton width="100%" height={64} radius={14} />
            <View style={{ height: 14 }} />
            <Skeleton width="35%" height={14} />
            <View style={s.detailGrid}>
                {arr(6).map((_, i) => <Skeleton key={i} width="46%" height={36} radius={10} />)}
            </View>
        </View>
    </View>
);

const s = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 6 },
    card: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EEF0F3', overflow: 'hidden' },
    cardBody: { padding: 10, gap: 7 },

    rows: { paddingHorizontal: 16, paddingTop: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F2F3F5' },
    rowText: { flex: 1, gap: 8 },

    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 14, paddingTop: 8 },
    tile: { width: '31%', alignItems: 'center', gap: 9, paddingVertical: 16, borderWidth: 1, borderColor: '#EEF0F3', borderRadius: 16, backgroundColor: '#FFFFFF' },

    detail: { padding: 18, gap: 10 },
    detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
});

export default { CarGridSkeleton, RowListSkeleton, TilesSkeleton, DetailSkeleton };
