import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const TABS = [
    { key: 'Total', count: 8 },
    { key: 'Unread', count: 2 },
    { key: 'Online', count: 15 },
];

const CHATS = [
    { id: '1', name: 'Amir Shehzad', route: 'Lahore → Islamabad', price: 'Rs. 2500', lastMsg: 'Great! I will see you on Monday at 6:00 pm.', unread: 2, online: false },
    { id: '2', name: 'Amir Shehzad', route: 'Lahore → Islamabad', price: 'Rs. 2500', lastMsg: 'Great! I will see you on Monday at 6:00 pm.', unread: 0, online: false },
    { id: '3', name: 'Amir Shehzad', route: 'Lahore → Islamabad', price: 'Rs. 2500', lastMsg: 'Great! I will see you on Monday at 6:00 pm.', unread: 0, online: true },
    { id: '4', name: 'Amir Shehzad', route: 'Lahore → Islamabad', price: 'Rs. 2500', lastMsg: 'Great! I will see you on Monday at 6:00 pm.', unread: 1, online: false },
    { id: '5', name: 'Amir Shehzad', route: 'Lahore → Islamabad', price: 'Rs. 2500', lastMsg: 'Great! I will see you on Monday at 6:00 pm.', unread: 0, online: false },
    { id: '6', name: 'Amir Shehzad', route: 'Lahore → Islamabad', price: 'Rs. 2500', lastMsg: 'Great! I will see you on Monday at 6:00 pm.', unread: 2, online: true },
];

const ChatsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Total');

    const filteredChats = CHATS.filter(c => {
        if (activeTab === 'Unread') return c.unread > 0;
        if (activeTab === 'Online') return c.online;
        return true;
    });

    const renderChat = ({ item, index }) => (
        <TouchableOpacity
            style={[styles.chatItem, index < filteredChats.length - 1 && styles.chatItemBorder]}
            onPress={() => navigation.navigate('ChatDetail', { chat: item })}
            activeOpacity={0.7}
        >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                    <Icon name="account" size={24} color="#CCCCCC" />
                </View>
                {item.online && <View style={styles.onlineDot} />}
            </View>

            {/* Content */}
            <View style={styles.chatContent}>
                <View style={styles.chatTopRow}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    {item.price ? <Text style={styles.chatPrice}>{item.price}</Text> : null}
                </View>
                <Text style={styles.chatRoute}>{item.route}</Text>
                <Text style={styles.chatLastMsg} numberOfLines={1}>{item.lastMsg}</Text>
            </View>

            {/* Unread Badge */}
            {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chats</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.key} ({tab.count})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Chat List */}
            <View style={styles.listCard}>
                <FlatList
                    data={filteredChats}
                    keyExtractor={item => item.id}
                    renderItem={renderChat}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    headerTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#EAEDEE',
    },
    tab: {
        paddingHorizontal: 4,
        paddingVertical: 13,
        marginRight: 24,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#07163B',
    },
    tabText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: '#AAAAAA',
    },
    tabTextActive: {
        color: '#07163B',
        fontFamily: Fonts.semiBold,
    },

    // List
    listCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginTop: 12,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        overflow: 'hidden',
    },

    // Chat Item
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    chatItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    avatarWrap: { position: 'relative' },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1, right: 1,
        width: 11, height: 11,
        borderRadius: 6,
        backgroundColor: '#109F2A',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    chatContent: { flex: 1 },
    chatTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    chatName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
    },
    chatPrice: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
    },
    chatRoute: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#3B3E40',
        marginBottom: 3,
    },
    chatLastMsg: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#3B3E40',
    },
    unreadBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFD400',
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        color: '#111111',
    },
});

export default ChatsScreen;
