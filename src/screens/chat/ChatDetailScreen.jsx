import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar, TextInput,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const QUICK_REPLIES = ['Hi!', 'Where are you?', "I'm sharing my car's picture", 'Is the..'];

const MESSAGES = [
    { id: '1', text: 'Great! I will see you on Monday at 6:00 pm.', time: '12:48 am', mine: false },
    { id: '2', text: 'Great! I will see you on Monday at 6:00 pm.', time: '12:48 am', mine: true },
    { id: '3', text: "I'll be next to the shopping mall", time: '12:48 am', mine: true },
    { id: '4', text: 'Great! I will see you on Monday at 6:00 pm.', time: '12:48 am', mine: false },
];

const ChatDetailScreen = ({ navigation, route }) => {
    const chat = route?.params?.chat;
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(MESSAGES);

    const sendMessage = () => {
        if (!message.trim()) return;
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mine: true,
        }]);
        setMessage('');
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.msgRow, item.mine && styles.msgRowMine]}>
            <View style={[styles.msgBubble, item.mine ? styles.msgBubbleMine : styles.msgBubbleTheirs]}>
                <Text style={[styles.msgText, item.mine && styles.msgTextMine]}>{item.text}</Text>
                <Text style={[styles.msgTime, item.mine && styles.msgTimeMine]}>{item.time}</Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={22} color="#07163B" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Icon name="account" size={20} color="#CCCCCC" />
                    </View>
                    <View>
                        <Text style={styles.headerName}>{chat?.name || 'Amir Shehzad'}</Text>
                        <Text style={styles.headerStatus}>Active 4 mins ago</Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Icon name="phone-outline" size={22} color="#07163B" />
                </TouchableOpacity>
            </View>

            {/* Ride Info Bar */}
            <View style={styles.rideInfoBar}>
                <Text style={styles.rideRoute}>Lahore → Islamabad</Text>
                <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedText}>Confirmed</Text>
                </View>
                <Text style={styles.ridePrice}>Rs. 2500</Text>
            </View>

            {/* Messages */}
            <FlatList
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
            />

            {/* Quick Replies */}
            <View style={styles.quickRepliesRow}>
                {QUICK_REPLIES.map(reply => (
                    <TouchableOpacity
                        key={reply}
                        style={styles.quickReply}
                        onPress={() => setMessage(reply)}
                    >
                        <Text style={styles.quickReplyText}>{reply}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input Bar */}
            <View style={styles.inputBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Type Here"
                    placeholderTextColor="#AAAAAA"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                />
                <TouchableOpacity style={styles.attachBtn}>
                    <Icon name="link-variant" size={20} color="#9E9E9E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Icon name="send" size={18} color="#111111" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },

    // Header
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
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        paddingHorizontal: 12,
    },
    headerAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },
    headerStatus: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#109F2A',
    },

    // Ride Info
    rideInfoBar: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    rideRoute: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#202223',
    },
    confirmedBadge: {
        backgroundColor: '#109F2A0F',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#109F2A',
    },
    confirmedText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: '#109F2A',
    },
    ridePrice: {
        fontSize: 13,
        fontFamily: Fonts.bold,
        color: '#202223',
        marginLeft: 'auto',
    },

    // Messages
    messagesList: {
        padding: 16,
        gap: 10,
    },
    msgRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 8,
    },
    msgRowMine: {
        justifyContent: 'flex-end',
    },
    msgBubble: {
        maxWidth: '75%',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 4,
    },
    msgBubbleTheirs: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EAEDEE',
        borderBottomLeftRadius: 4,
    },
    msgBubbleMine: {
        backgroundColor: '#FFD40038',
        borderBottomRightRadius: 4,
    },
    msgText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#202223',
        lineHeight: 19,
    },
    msgTextMine: {
        color: '#202223',
    },
    msgTime: {
        fontSize: 10,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
        alignSelf: 'flex-end',
    },
    msgTimeMine: {
        color: '#9E9E9E',
    },

    // Quick Replies
    quickRepliesRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        backgroundColor: '#F5F5F7',
    },
    quickReply: {
        borderWidth: 1,
        borderColor: '#D7DBDE',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: '#FFFFFF',
    },
    quickReplyText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },

    // Input Bar
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: 28,
        borderTopWidth: 1,
        borderTopColor: '#EAEDEE',
        gap: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#202223',
        maxHeight: 100,
        backgroundColor: '#FFFFFF',
    },
    attachBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFD400',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ChatDetailScreen;
