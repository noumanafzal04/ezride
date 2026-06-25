import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, Dimensions, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../constants/fonts';
import {useApp} from '../context/AppContext';
import useAuth from "../hooks/useAuth";
import useUserStore from '../store/userStore';
import { useServiceProviderMe } from '../hooks/useServices';


const {width} = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.82;

const NAV_ITEMS = [
    {key: 'Rides', label: 'Rides', icon: 'car-outline'},
    {key: 'RideHistory', label: 'Ride History', icon: 'history'},
    {key: 'Services', label: 'Car Services', icon: 'wrench-outline'},
    {key: 'Rentals', label: 'Rent a Car', icon: 'car-key'},
    {key: 'Marketplace', label: 'Buy/Sell Cars', icon: 'tag-outline'},
    {key: 'Messages', label: 'Messages', icon: 'message-outline'},
];

const Sidebar = ({visible, onClose, navigation, activeRoute = 'Home'}) => {
    const {role, setRole} = useApp();
    const { logout } = useAuth();
    const user = useUserStore(s => s.user);
    const { data: spProfile } = useServiceProviderMe();

    const isDriver = role === 'driver';
    const isActualDriver = user?.user_type === 'driver';
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'EZRide User';
    const initial = (user?.first_name?.[0] || 'E').toUpperCase();

    const handleNav = (key) => {
        onClose();
        setTimeout(() => navigation.navigate(key), 200);
    };

    const switchRole = (r) => {
        setRole(r);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop */}
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}/>

                {/* Sidebar Panel */}
                <View style={styles.sidebar}>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* User Info */}
                        <View style={styles.userSection}>
                            <View style={styles.userAvatar}>
                                <Text style={styles.userInitial}>{initial}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
                                <TouchableOpacity
                                    style={styles.viewProfileRow}
                                    onPress={() => {
                                        onClose();
                                        setTimeout(() => navigation.navigate('Profile'), 200);
                                    }}
                                >
                                    <Text style={styles.viewProfileText}>View Profile</Text>
                                    <Icon name="chevron-right" size={14} color="#5D5F62"/>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Role Switcher — only for onboarded drivers (they can also ride) */}
                        {isActualDriver && (
                            <View style={styles.roleSwitcher}>
                                <TouchableOpacity
                                    style={[styles.roleBtn, !isDriver && styles.roleBtnInactive]}
                                    onPress={() => switchRole('driver')}
                                >
                                    <Text style={[styles.roleText, !isDriver && styles.roleTextInactive]}>Driver</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleBtn, isDriver && styles.roleBtnInactive]}
                                    onPress={() => switchRole('rider')}
                                >
                                    <Text style={[styles.roleText, isDriver && styles.roleTextInactive]}>User</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Nav Items */}
                        <View style={styles.navSection}>
                            {NAV_ITEMS.map(item => {
                                const isActive = activeRoute === item.key;
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.navItem, isActive && styles.navItemActive]}
                                        onPress={() => handleNav(item.key)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon
                                            name={item.icon}
                                            size={22}
                                            color={isActive ? '#07163B' : '#5D5F62'}
                                        />
                                        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                            {item.label}
                                        </Text>
                                        {item.badge ? (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{item.badge}</Text>
                                            </View>
                                        ) : null}
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Service provider — register (or view profile if already one) */}
                            <TouchableOpacity
                                style={styles.navItem}
                                onPress={() => handleNav('ServiceProviderRegister')}
                                activeOpacity={0.7}
                            >
                                <Icon name="tools" size={22} color="#5D5F62" />
                                <Text style={styles.navLabel}>
                                    {spProfile ? 'My Service Profile' : 'Become a Provider'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Section */}
                        <View style={styles.bottomSection}>
                            <TouchableOpacity style={styles.bottomItem} onPress={() => { onClose(); setTimeout(() => navigation.navigate('Settings'), 200); }}>
                                <Icon name="cog-outline" size={20} color="#5D5F62" />
                                <Text style={styles.bottomItemText}>Settings</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.bottomItem} onPress={() => { onClose(); setTimeout(() => navigation.navigate('HelpSupport'), 200); }}>
                                <Icon name="help-circle-outline" size={20} color="#5D5F62" />
                                <Text style={styles.bottomItemText}>Help & Support</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.bottomItem}
                                onPress={() => {
                                    onClose();
                                    logout();
                                    navigation.replace('Login');
                                }}
                            >
                                <Icon name="power" size={20} color="#D83F54" />
                                <Text style={[styles.bottomItemText, { color: '#D83F54' }]}>Log Out</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerVersion}>v2.4.0</Text>
                        </View>
                    </ScrollView>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        paddingTop: 40,
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 24 },

    // User
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 20,
    },
    userAvatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center',
    },
    userInitial: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        color: '#07163B',
    },
    userName: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 2,
    },
    userPhone: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#9AA0A6',
        marginBottom: 4,
    },
    viewProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewProfileText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },

    // Role Switcher
    roleSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F7',
        borderRadius: 12,
        padding: 4,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#EAEDEE',
    },
    roleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 9,
        backgroundColor: '#FFD400',
    },
    roleBtnInactive: {
        backgroundColor: 'transparent',
    },
    roleText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
    roleTextInactive: {
        color: '#5D5F62',
        fontFamily: Fonts.medium,
    },

    // Nav
    navSection: {
        gap: 4,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    navItemActive: {
        backgroundColor: 'rgba(245,214,50,0.15)',
    },
    navLabel: {
        flex: 1,
        fontSize: 15,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },
    navLabelActive: {
        color: '#07163B',
        fontFamily: Fonts.semiBold,
    },
    badge: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: '#FFD400',
        alignItems: 'center', justifyContent: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        color: '#111111',
    },

    // Bottom
    bottomSection: {
        gap: 2,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
        marginTop: 16,
    },
    bottomItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    bottomItemText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        marginTop: 8,
    },
    footerVersion: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
    },
    footerDesign: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#AAAAAA',
    },
    footerName: {
        fontFamily: Fonts.semiBold,
        color: '#1D6AFF',
        textDecorationLine: 'underline',
    },
});

export default Sidebar;
