import React from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import Skeleton from '../../components/Skeleton';
import { useConversations } from '../../hooks/useChat';
import { useRealtimeConnected } from '../../hooks/useRealtime';

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

const ChatsScreen = ({ navigation }) => {
    const connected = useRealtimeConnected();
    const query = useConversations({
        refetchInterval: connected ? false : 20000,
        refetchIntervalInBackground: false,
    });
    const items = (query.data?.pages || []).flatMap(p => p.conversations || []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ChatDetail', { conversationId: item.id, conversation: item })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>{(item.other_party?.name?.[0] || '?').toUpperCase()}</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>{item.other_party?.name || 'User'}</Text>
                    <Text style={styles.time}>{timeAgo(item.last_message_at || item.created_at)}</Text>
                </View>
                {!!item.route && <Text style={styles.route} numberOfLines={1}>{item.route}</Text>}
                <View style={styles.bottomRow}>
                    <Text style={[styles.lastMsg, item.unread_count > 0 && styles.lastMsgUnread]} numberOfLines={1}>
                        {item.last_message || 'Say hello 👋'}
                    </Text>
                    {item.unread_count > 0 && (
                        <View style={styles.badge}><Text style={styles.badgeText}>{item.unread_count}</Text></View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const SkeletonRow = () => (
        <View style={styles.row}>
            <Skeleton width={46} height={46} radius={23} />
            <View style={styles.content}>
                <Skeleton width="45%" height={13} radius={6} />
                <Skeleton width="65%" height={10} radius={6} style={styles.sk1} />
                <Skeleton width="80%" height={10} radius={6} style={styles.sk2} />
            </View>
        </View>
    );

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={items.length ? null : styles.emptyWrap}
                refreshing={query.isRefetching}
                onRefresh={query.refetch}
                onEndReachedThreshold={0.5}
                onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
                ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color="#FFD400" style={styles.spin} /> : null}
                ListEmptyComponent={
                    query.isLoading ? (
                        <View>{Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}</View>
                    ) : (
                        <View style={styles.empty}>
                            <Icon name="chat-outline" size={48} color="#DDDDDD" />
                            <Text style={styles.emptyTitle}>No conversations yet</Text>
                            <Text style={styles.emptySub}>Chat opens once a booking is accepted.</Text>
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
        backgroundColor: '#FFFFFF', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 19, fontFamily: Fonts.semiBold, color: '#07163B' },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 13,
        borderBottomWidth: 1, borderBottomColor: '#F2F3F5',
    },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 18, fontFamily: Fonts.bold, color: '#07163B' },
    content: { flex: 1, gap: 2 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    name: { flex: 1, fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#202223' },
    time: { fontSize: 11, fontFamily: Fonts.regular, color: '#9AA0A6' },
    route: { fontSize: 12, fontFamily: Fonts.regular, color: '#9AA0A6' },
    bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    lastMsg: { flex: 1, fontSize: 12.5, fontFamily: Fonts.regular, color: '#5D5F62' },
    lastMsgUnread: { color: '#202223', fontFamily: Fonts.medium },
    badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: '#FFD400', alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 11, fontFamily: Fonts.bold, color: '#111111' },

    sk1: { marginTop: 7 },
    sk2: { marginTop: 7 },
    spin: { marginVertical: 16 },
    emptyWrap: { flexGrow: 1 },
    empty: { alignItems: 'center', paddingTop: 100, gap: 8 },
    emptyTitle: { fontSize: 15, fontFamily: Fonts.semiBold, color: '#AAAAAA' },
    emptySub: { fontSize: 13, fontFamily: Fonts.regular, color: '#CCCCCC' },
});

export default ChatsScreen;
