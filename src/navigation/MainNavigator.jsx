import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import { useChatUnread } from '../hooks/useChat';
import { useUnreadCount } from '../hooks/useNotifications';
import { useDriverBookings } from '../hooks/useDriverBookings';
import { useModules } from '../hooks/useModules';
import { useUserRealtime, useRealtimeConnected } from '../hooks/useRealtime';
import { useLocationWatch } from '../hooks/useLocation';
import { useFcm } from '../hooks/useFcm';
import LocationPrompt from '../components/LocationPrompt';
// Home design: HomeScreen · V2 (navy hero) · V3 (light grid) · V4 (rich module cards, fills well with few modules).
import HomeScreen from '../screens/HomeScreenV4';
import ChatsScreen from '../screens/chat/ChatsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// Rides hub (Find Rides + My Rides for both roles)
import RidesHubScreen from '../screens/RidesHubScreen';
import PostRideScreen from "../screens/driver/PostRideScreen";


const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const { role } = useApp();
    const insets = useSafeAreaInsets();
    const isDriver = role === 'driver';
    // Live via Reverb; poll only as a fallback if the socket drops.
    const connected = useRealtimeConnected();
    const { data: unread = 0 } = useChatUnread({
        refetchInterval: connected ? false : 30000,
        refetchIntervalInBackground: false,
    });
    const { data: notifUnread = 0 } = useUnreadCount({
        refetchInterval: connected ? false : 30000,
        refetchIntervalInBackground: false,
    });
    // Driver: pending ride offers awaiting accept/reject → badge on the Offers tab.
    const { data: pendingOffers = [] } = useDriverBookings(
        { status: 'pending' },
        { enabled: isDriver, refetchInterval: connected ? false : 20000, refetchIntervalInBackground: false },
    );
    const offersCount = isDriver ? pendingOffers.length : 0;
    const { isEnabled } = useModules();
    // With only ride + inspection live, a full search hub is overkill — the
    // center button takes users straight to Find Rides instead.
    const hasExtraModules = isEnabled('service');

    const iconMap = {
        Home: (f) => (f ? 'home-variant' : 'home-variant-outline'),
        // Driver sees "Offers" (riders requesting seats) → people icon; rider sees rides.
        Rides: () => (isDriver ? 'account-multiple' : 'car-multiple'),
        Messages: (f) => (f ? 'message-text' : 'message-text-outline'),
        Notifications: (f) => (f ? 'bell' : 'bell-outline'),
    };
    const labelMap = { Home: 'Home', Rides: 'Rides', Messages: 'Messages', Notifications: 'Alerts' };

    return (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) + 9 }]}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const isCenter = route.name === 'Post';

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                };

                if (isCenter) {
                    // Driver → post a ride (+). User → search hub if multiple modules,
                    // else straight to Find Rides.
                    const goCenter = () => (
                        isDriver
                            ? navigation.navigate('Post')
                            : navigation.navigate(hasExtraModules ? 'Discover' : 'AvailableRides')
                    );
                    return (
                        <TouchableOpacity key={route.key} style={styles.centerBtn} onPress={goCenter} activeOpacity={0.85}>
                            <View style={styles.centerHalo}>
                                <View style={styles.centerCircle}>
                                    <Icon name={isDriver ? 'plus' : 'magnify'} size={28} color="#1D3461" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }

                const count = route.name === 'Messages' ? unread
                    : route.name === 'Notifications' ? notifUnread
                    : route.name === 'Rides' ? offersCount
                    : 0;

                return (
                    <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.8}>
                        {isFocused && <View style={styles.activeTopLine} />}
                        <View style={styles.iconWrap}>
                            <Icon name={iconMap[route.name](isFocused)} size={23} color={isFocused ? '#1D3461' : '#9AA0A6'} />
                            {count > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{count > 99 ? '99+' : count}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                            {route.name === 'Rides' && isDriver ? 'Offers' : labelMap[route.name]}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const MainNavigator = () => {
    const RidesScreen = RidesHubScreen;

    // Live updates for the whole authenticated session (booking status,
    // notifications, ride alerts) over the user's private WebSocket channel.
    useUserRealtime();
    // Detect current city; ask before switching if it changed.
    useLocationWatch();
    // Register for push notifications + handle foreground/taps.
    useFcm();

    return (
        <>
            <Tab.Navigator tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Rides" component={RidesScreen} />
                <Tab.Screen name="Post" component={PostRideScreen} />
                <Tab.Screen name="Messages" component={ChatsScreen} />
                <Tab.Screen name="Notifications" component={NotificationsScreen} />
            </Tab.Navigator>
            <LocationPrompt />
        </>
    );
};

const styles = StyleSheet.create({
    // Simple attached bar with a rounded top edge.
    tabBar: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 0,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    // Primary-colour line on the top edge of the active tab.
    activeTopLine: {
        position: 'absolute',
        top: 0,
        left: 14,
        right: 14,
        height: 3,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        backgroundColor: '#FFD400',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        gap: 4,
    },
    iconWrap: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    tabBadge: {
        position: 'absolute',
        top: -4,
        right: 6,
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
        color: '#07163B',
        fontFamily: 'Poppins-SemiBold',
    },
    centerBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -22,
    },
    // Soft light-yellow halo spreading around the button.
    centerHalo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,212,0,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#FFD400',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#FFD400',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.55,
        shadowRadius: 14,
    },
});

export default MainNavigator;
