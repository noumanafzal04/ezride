import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';

const arr = (n) => Array.from({ length: n });

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

// Chat thread — alternating incoming/outgoing bubbles.
export const ChatSkeleton = ({ count = 7 }) => (
    <View style={s.chat}>
        {arr(count).map((_, i) => {
            const mine = i % 2 === 1;
            const w = [`${55 + (i % 3) * 12}%`, '40%', '68%', '50%'][i % 4];
            return (
                <View key={i} style={[s.chatRow, mine && s.chatRowMine]}>
                    <Skeleton width={w} height={38} radius={16} />
                </View>
            );
        })}
    </View>
);

// Ride card list — matches AvailableRidesScreen card (driver row, price, route, actions).
export const RideCardSkeleton = ({ count = 4 }) => (
    <View style={s.rideWrap}>
        {arr(count).map((_, i) => (
            <View key={i} style={s.rideCard}>
                <View style={s.rideTop}>
                    <View style={s.rideDriver}>
                        <Skeleton width={40} height={40} radius={20} />
                        <View style={s.rideDriverText}>
                            <Skeleton width={110} height={12} />
                            <Skeleton width={70} height={10} />
                        </View>
                    </View>
                    <Skeleton width={88} height={58} radius={10} />
                </View>
                <View style={{ height: 12 }} />
                <Skeleton width="55%" height={14} />
                <View style={{ height: 12 }} />
                <Skeleton width="75%" height={12} />
                <View style={{ height: 8 }} />
                <Skeleton width="65%" height={12} />
                <View style={s.rideDivider} />
                <View style={s.rideActions}>
                    <Skeleton width={40} height={40} radius={10} />
                    <Skeleton width="72%" height={40} radius={10} />
                </View>
            </View>
        ))}
    </View>
);

// Generic page (no hero image) — a summary card + stacked rows.
// For detail/settings screens that aren't image-led.
export const PageSkeleton = ({ rows = 4 }) => (
    <View style={s.page}>
        <Skeleton width="100%" height={92} radius={16} />
        <View style={{ height: 18 }} />
        <Skeleton width="40%" height={14} />
        <View style={{ height: 12 }} />
        {arr(rows).map((_, i) => (
            <View key={i} style={s.pageRow}>
                <Skeleton width={38} height={38} radius={10} />
                <View style={s.pageRowText}>
                    <Skeleton width={`${60 + (i % 3) * 10}%`} height={12} />
                    <Skeleton width="40%" height={10} />
                </View>
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

    chat: { flex: 1, padding: 16, gap: 14, justifyContent: 'flex-end' },
    chatRow: { alignItems: 'flex-start' },
    chatRowMine: { alignItems: 'flex-end' },

    rentalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingTop: 2 },
    rentalCard: { width: '47.5%', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden' },
    rentalBody: { padding: 10, gap: 6 },

    rideWrap: { paddingHorizontal: 16, paddingTop: 16 },
    rideCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#EAEDEE', padding: 14, marginBottom: 14 },
    rideTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rideDriver: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    rideDriverText: { gap: 7 },
    rideDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
    rideActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

    page: { padding: 16 },
    pageRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F2F3F5' },
    pageRowText: { flex: 1, gap: 8 },
});

export default { RowListSkeleton, TilesSkeleton, DetailSkeleton, RideCardSkeleton, PageSkeleton };
