import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import { useUnreadCount } from '../hooks/useNotifications';
import { useUserRealtime, useRealtimeConnected } from '../hooks/useRealtime';
import HomeScreen from '../screens/HomeScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import MarketplaceScreen from '../screens/buysell/MarketplaceScreen';

// User
import MyBookingsScreen from '../screens/user/MyBookingsScreen';

// Driver
import RideRequestsScreen from '../screens/driver/RideRequestsScreen';
import PostRideScreen from "../screens/driver/PostRideScreen";


const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const { role } = useApp();
    const isDriver = role === 'driver';
    // Live via Reverb; poll only as a fallback if the socket drops.
    const connected = useRealtimeConnected();
    const { data: unread = 0 } = useUnreadCount({
        refetchInterval: connected ? false : 30000,
        refetchIntervalInBackground: false,
    });
    return (
        <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const isCenter = route.name === 'Post';

                const iconMap = {
                    Home: isFocused ? 'home' : 'home-outline',
                    Rides: isFocused ? 'car' : 'car-outline',
                    Post: 'plus',
                    BuySell: isFocused ? 'tag' : 'tag-outline',
                    Notifications: isFocused ? 'bell' : 'bell-outline',
                };

                const labelMap = {
                    Home: 'Home',
                    Rides: 'Rides',
                    Post: '',
                    BuySell: 'Buy/Sell',
                    Notifications: 'Notifications',
                };

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                };

                if (isCenter) {
                    // Driver → post a ride (+). Rider → find a ride (search).
                    const goCenter = () => (isDriver ? navigation.navigate('Post') : navigation.navigate('AvailableRides'));
                    return (
                        <TouchableOpacity key={route.key} style={styles.centerBtn} onPress={goCenter} activeOpacity={0.85}>
                            <View style={styles.centerCircle}>
                                <Icon name={isDriver ? 'plus' : 'magnify'} size={28} color="#1D3461" />
                            </View>
                        </TouchableOpacity>
                    );
                }

                const showBadge = route.name === 'Notifications' && unread > 0;

                return (
                    <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.85}>
                        <View>
                            <Icon name={iconMap[route.name]} size={22} color={isFocused ? '#FFD400' : '#8A8A8A'} />
                            {showBadge && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{unread > 99 ? '99+' : unread}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                            {labelMap[route.name]}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const MainNavigator = () => {
    const { role } = useApp();
    const RidesScreen = role === 'driver' ? RideRequestsScreen : MyBookingsScreen;

    // Live updates for the whole authenticated session (booking status,
    // notifications, ride alerts) over the user's private WebSocket channel.
    useUserRealtime();

    return (
        <Tab.Navigator tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Rides" component={RidesScreen} />
            <Tab.Screen name="Post" component={PostRideScreen} />
            <Tab.Screen name="BuySell" component={MarketplaceScreen} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 36, // ← add this
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    tabBadge: {
        position: 'absolute',
        top: -6,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#D83F54',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: {
        fontSize: 9,
        fontFamily: 'Poppins-Bold',
        color: '#FFFFFF',
    },
    tabLabel: {
        fontSize: 10,
        fontFamily: 'Poppins-Regular',
        color: '#8A8A8A',
    },
    tabLabelActive: {
        color: '#FFD400',
        fontFamily: 'Poppins-Medium',
    },
    centerBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    centerCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFD400',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#FFD400',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
});

export default MainNavigator;
