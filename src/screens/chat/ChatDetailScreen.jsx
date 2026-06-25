import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, TextInput,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import Fonts from '../../constants/fonts';
import {
    useMessages, useSendMessage, useMarkConversationRead,
    useConversationForBooking, useConversationForServiceBooking,
} from '../../hooks/useChat';
import { useConversationRealtime, useRealtimeConnected } from '../../hooks/useRealtime';
import { ChatSkeleton } from '../../components/Skeletons';

const fmtTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Tap-to-send starters — shown only on an empty chat.
const QUICK_REPLIES = ['Hi 👋', 'Pickup location?'];

const ChatDetailScreen = ({ navigation, route }) => {
    const params = route?.params || {};
    const qc = useQueryClient();
    const insets = useSafeAreaInsets();

    // Resolve the conversation: passed directly, or looked up by ride/service booking id.
    const byBooking = useConversationForBooking(!params.conversationId && !params.serviceBookingId ? params.bookingId : null);
    const byService = useConversationForServiceBooking(!params.conversationId ? params.serviceBookingId : null);
    const conversation = params.conversation || byBooking.data || byService.data || null;
    const conversationId = params.conversationId || conversation?.id || null;

    const isClosed = conversation?.status === 'closed';
    const otherName = conversation?.other_party?.name || 'Chat';

    const [text, setText] = useState('');

    // Live via Reverb; poll the thread only as a fallback if the socket is down.
    const connected = useRealtimeConnected();
    const messagesQuery = useMessages(conversationId, {
        refetchInterval: connected ? false : 8000,
        refetchIntervalInBackground: false,
    });
    const messages = (messagesQuery.data?.pages || []).flatMap(p => p.messages || []); // newest first

    const send = useSendMessage(conversationId);
    const markRead = useMarkConversationRead();

    // Mark read on open (and again when new messages arrive, below).
    useEffect(() => {
        if (conversationId) markRead.mutate(conversationId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    const onLiveMessage = useCallback(() => {
        if (!conversationId) return;
        qc.invalidateQueries({ queryKey: ['messages', conversationId] });
        markRead.mutate(conversationId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId, qc]);
    useConversationRealtime(conversationId, onLiveMessage);

    const doSend = (body, onErr) => {
        if (!body || !conversationId) return;
        send.mutate(body, {
            onError: (err) => {
                onErr?.();
                Toast.show({ type: 'error', text1: 'Not sent', text2: err.response?.data?.message || 'Check your connection.' });
            },
        });
    };

    const handleSend = () => {
        const body = text.trim();
        if (!body) return;
        setText('');
        doSend(body, () => setText(body)); // restore on failure
    };

    const sendQuick = (q) => doSend(q);

    // Only on a fresh chat with no messages yet.
    const showQuick = !isClosed && !messagesQuery.isLoading && messages.length === 0;

    const renderMessage = ({ item }) => (
        <View style={[styles.msgRow, item.is_mine && styles.msgRowMine]}>
            <View style={[styles.bubble, item.is_mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={styles.msgText}>{item.body}</Text>
                <View style={styles.msgMeta}>
                    <Text style={styles.msgTime}>{fmtTime(item.created_at)}</Text>
                    {item.is_mine && (
                        item._status === 'sending'
                            ? <Icon name="clock-outline" size={11} color="#9AA0A6" />
                            : <Icon name="check" size={13} color="#1D9E4B" />
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={22} color="#07163B" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Text style={styles.headerInitial}>{(otherName?.[0] || '?').toUpperCase()}</Text>
                    </View>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
                        {!!conversation?.route && <Text style={styles.headerRoute} numberOfLines={1}>{conversation.route}</Text>}
                    </View>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Ride banner — which ride this chat is about; tap to view the post */}
            {!!conversation?.ride && (
                <TouchableOpacity
                    style={styles.rideBar}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('RideDetail', { offer: { id: conversation.ride.ride_post_id } })}
                >
                    <Icon name="car-outline" size={15} color="#07163B" />
                    <Text style={styles.rideRoute} numberOfLines={1}>{conversation.ride.route}</Text>
                    {!!conversation.ride.seats && (
                        <Text style={styles.rideMeta}>· {conversation.ride.seats} seat{conversation.ride.seats > 1 ? 's' : ''}</Text>
                    )}
                    {conversation.ride.fare != null && (
                        <Text style={styles.rideFare}>Rs {Number(conversation.ride.fare).toLocaleString()}</Text>
                    )}
                    <Icon name="chevron-right" size={16} color="#9AA0A6" />
                </TouchableOpacity>
            )}

            {/* Service banner — which service this chat is about */}
            {!conversation?.ride && !!conversation?.service && (
                <View style={styles.rideBar}>
                    <Icon name={conversation.service.icon || 'tools'} size={15} color="#07163B" />
                    <Text style={styles.rideRoute} numberOfLines={1}>{conversation.service.category || 'Service'}</Text>
                    {!!conversation.service.business_name && (
                        <Text style={styles.rideMeta} numberOfLines={1}>· {conversation.service.business_name}</Text>
                    )}
                </View>
            )}

            {messagesQuery.isLoading ? (
                <ChatSkeleton />
            ) : (
                <FlatList
                    data={messages}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderMessage}
                    inverted
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={() => { if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) messagesQuery.fetchNextPage(); }}
                    ListEmptyComponent={
                        <View style={styles.emptyInverted}>
                            <Text style={styles.emptyText}>No messages yet — say hello 👋</Text>
                        </View>
                    }
                />
            )}

            {isClosed ? (
                <View style={[styles.closedBar, { paddingBottom: insets.bottom + 14 }]}>
                    <Icon name="lock-outline" size={16} color="#9AA0A6" />
                    <Text style={styles.closedText}>This ride is complete. The conversation is closed.</Text>
                </View>
            ) : (
                <View>
                    {showQuick && (
                        <View style={styles.quickWrap}>
                            {QUICK_REPLIES.map(q => (
                                <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendQuick(q)} activeOpacity={0.8}>
                                    <Text style={styles.quickText}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message"
                            placeholderTextColor="#AAAAAA"
                            value={text}
                            onChangeText={setText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!text.trim()}
                        >
                            <Icon name="send" size={18} color="#111111" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center',
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingHorizontal: 12 },
    headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF4C2', alignItems: 'center', justifyContent: 'center' },
    headerInitial: { fontSize: 15, fontFamily: Fonts.bold, color: '#07163B' },
    headerTextWrap: { flex: 1 },

    // Ride banner
    rideBar: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    rideRoute: { fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#07163B', maxWidth: '46%' },
    rideMeta: { fontSize: 12, fontFamily: Fonts.regular, color: '#5D5F62' },
    rideFare: { marginLeft: 'auto', fontSize: 12.5, fontFamily: Fonts.semiBold, color: '#07163B' },
    headerName: { fontSize: 14.5, fontFamily: Fonts.semiBold, color: '#07163B' },
    headerRoute: { fontSize: 11.5, fontFamily: Fonts.regular, color: '#9AA0A6' },
    headerSpacer: { width: 22 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: 16, gap: 8, flexGrow: 1 },
    emptyInverted: { alignItems: 'center', paddingVertical: 40, transform: [{ scaleY: -1 }] },
    emptyText: { fontSize: 13, fontFamily: Fonts.regular, color: '#9AA0A6' },

    msgRow: { flexDirection: 'row', justifyContent: 'flex-start' },
    msgRowMine: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9, gap: 3 },
    bubbleTheirs: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDEE', borderBottomLeftRadius: 4 },
    bubbleMine: { backgroundColor: '#FFF4C2', borderBottomRightRadius: 4 },
    msgText: { fontSize: 13.5, fontFamily: Fonts.regular, color: '#202223', lineHeight: 19 },
    msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end' },
    msgTime: { fontSize: 10, fontFamily: Fonts.regular, color: '#9AA0A6' },

    // Quick starters — only on an empty chat, small pills above the input.
    quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
    quickChip: {
        borderWidth: 1, borderColor: '#E3E5E8', borderRadius: 18,
        paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFF',
    },
    quickText: { fontSize: 13, fontFamily: Fonts.medium, color: '#07163B' },

    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 28,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    input: {
        flex: 1, borderWidth: 1, borderColor: '#EAEDEE', borderRadius: 22,
        paddingHorizontal: 16, paddingVertical: 10, maxHeight: 110,
        fontSize: 14, fontFamily: Fonts.regular, color: '#202223', backgroundColor: '#FFFFFF',
    },
    sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFD400', alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { backgroundColor: '#E5E7EB' },

    closedBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#F1F2F4', paddingVertical: 16, paddingBottom: 30,
        borderTopWidth: 1, borderTopColor: '#EAEDEE',
    },
    closedText: { fontSize: 12.5, fontFamily: Fonts.medium, color: '#9AA0A6' },
});

export default ChatDetailScreen;
