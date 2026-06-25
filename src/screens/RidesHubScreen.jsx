import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import { useApp } from '../context/AppContext';
import TopTabs from '../components/TopTabs';
import Sidebar from '../components/Sidebar';
import AvailableRidesScreen from './user/AvailableRidesScreen';
import MyBookingsScreen from './user/MyBookingsScreen';
import RideRequestsScreen from './driver/RideRequestsScreen';

// Footer "Rides" tab: Find Rides (browse all, default) + My Rides (bookings/requests).
const RidesHubScreen = ({ navigation }) => {
    const { role } = useApp();
    const isDriver = role === 'driver';
    const [tab, setTab] = useState('find');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                    <Icon name="menu" size={24} color="#07163B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rides</Text>
                <View style={{ width: 24 }} />
            </View>

            <TopTabs
                tabs={[{ key: 'find', label: 'Find Rides' }, { key: 'mine', label: isDriver ? 'My Posted Rides' : 'My Rides' }]}
                active={tab}
                onChange={setTab}
            />

            {tab === 'find' ? (
                <AvailableRidesScreen navigation={navigation} embedded />
            ) : isDriver ? (
                <RideRequestsScreen navigation={navigation} embedded />
            ) : (
                <MyBookingsScreen navigation={navigation} embedded />
            )}

            <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={navigation} activeRoute="Rides" />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F5F7' },
    header: {
        backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: { fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B' },
});

export default RidesHubScreen;
