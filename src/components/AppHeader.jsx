import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import { useUnreadCount } from '../hooks/useNotifications';

/**
 * Shared top header: left (menu / back / spacer) · title · notification bell.
 * The bell always navigates to Notifications and shows a live unread badge —
 * so notifications work consistently on every screen that uses this.
 *
 * Props:
 *  - title           string
 *  - onMenu          () => void   (show hamburger; omit to show a back arrow when possible)
 *  - showBell        bool (default true)
 *  - rightAccessory  node (rendered left of the bell)
 */
const AppHeader = ({ title, onMenu, showBell = true, rightAccessory = null }) => {
    const navigation = useNavigation();
    const { data: unread = 0 } = useUnreadCount();
    const canBack = navigation.canGoBack?.();

    return (
        <View style={styles.header}>
            {onMenu ? (
                <TouchableOpacity onPress={onMenu} hitSlop={styles.hit}>
                    <Icon name="menu" size={24} color="#07163B" />
                </TouchableOpacity>
            ) : canBack ? (
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={styles.hit}>
                    <Icon name="arrow-left" size={24} color="#07163B" />
                </TouchableOpacity>
            ) : (
                <View style={styles.side} />
            )}

            <Text style={styles.title} numberOfLines={1}>{title}</Text>

            <View style={styles.right}>
                {rightAccessory}
                {showBell ? (
                    <TouchableOpacity
                        style={styles.bellBtn}
                        onPress={() => navigation.navigate('Notifications')}
                        hitSlop={styles.hit}
                    >
                        <Icon name="bell-outline" size={23} color="#07163B" />
                        {unread > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.side} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
    right: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 24, justifyContent: 'flex-end' },
    side: { width: 24 },
    bellBtn: { position: 'relative' },
    hit: { top: 10, bottom: 10, left: 10, right: 10 },
    badge: {
        position: 'absolute', top: -5, right: -6,
        minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
        backgroundColor: '#D83F54', alignItems: 'center', justifyContent: 'center',
    },
    badgeText: { fontSize: 9, fontFamily: Fonts.bold, color: '#FFFFFF' },
});

export default AppHeader;
