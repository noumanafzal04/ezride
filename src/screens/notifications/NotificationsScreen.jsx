import React from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';

const NOTIFICATIONS = [
    {
        id: '1',
        type: 'Seat Request',
        typeColor: '#6C63FF',
        typeBg: '#F0EEFF',
        title: 'Amir Shehzad',
        body: 'Has requested a seat for your ride to Lahore on 8th December, 2025.',
        time: '2m ago',
        icon: null,
    },
    {
        id: '2',
        type: null,
        typeColor: null,
        typeBg: null,
        title: 'Ride Confirmed',
        body: 'Your trip to Islamabad is set for 12th Dec, 2025.',
        time: '1d ago',
        icon: 'check-circle-outline',
        iconColor: '#109F2A',
        iconBg: '#E8F8EE',
    },
    {
        id: '3',
        type: 'Car Offer',
        typeColor: '#FF6B35',
        typeBg: '#FFF0EA',
        title: 'Malaika Shah',
        body: 'Has offered an amount of Rs. 25.4L on your car listing for the Honda City.',
        time: '1h ago',
        icon: null,
    },
    {
        id: '4',
        type: 'Seat Request',
        typeColor: '#6C63FF',
        typeBg: '#F0EEFF',
        title: 'Usman Hamid',
        body: 'Has requested a seat for your ride to Lahore on 8th December, 2025.',
        time: '1d ago',
        icon: null,
    },
];

const NotificationsScreen = ({ navigation }) => {

    const renderNotification = ({ item, index }) => (
        <TouchableOpacity
            style={[styles.notifCard, index < NOTIFICATIONS.length - 1 && styles.notifBorder]}
            activeOpacity={0.7}
        >
            {/* Left accent bar */}
            {item.type && (
                <View style={[styles.accentBar, { backgroundColor: item.typeColor }]} />
            )}

            {/* Icon or Avatar */}
            {item.icon ? (
                <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                    <Icon name={item.icon} size={22} color={item.iconColor} />
                </View>
            ) : (
                <View style={styles.avatarCircle}>
                    <Icon name="account" size={20} color="#CCCCCC" />
                </View>
            )}

            {/* Content */}
            <View style={styles.notifContent}>
                {item.type && (
                    <View style={[styles.typeBadge, { backgroundColor: item.typeBg }]}>
                        <Text style={[styles.typeText, { color: item.typeColor }]}>{item.type}</Text>
                    </View>
                )}
                <View style={styles.notifTitleRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifTime}>{item.time}</Text>
                </View>
                <Text style={styles.notifBody}>{item.body}</Text>
            </View>
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
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={NOTIFICATIONS}
                keyExtractor={item => item.id}
                renderItem={renderNotification}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
            />
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

    list: {
        padding: 16,
    },

    // Notification Card
    notifCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EAEDEE',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 10,
        overflow: 'hidden',
    },
    notifBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    notifContent: { flex: 1 },
    typeBadge: {
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 6,
    },
    typeText: {
        fontSize: 11,
        fontFamily: Fonts.semiBold,
    },
    notifTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#202223',
    },
    notifTime: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
    },
    notifBody: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        lineHeight: 18,
    },
});

export default NotificationsScreen;
