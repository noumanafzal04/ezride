import React, {useState} from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, StatusBar, Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import useUserStore from '../../store/userStore';

const SECTIONS = [
    {
        title: 'Account',
        items: [
            {icon: 'account-outline', label: 'Edit Profile', nav: 'EditProfile'},
            {icon: 'lock-outline', label: 'Change Password', nav: null},
            {icon: 'shield-outline', label: 'Privacy & Security', nav: null},
        ],
    },
    {
        title: 'Preferences',
        items: [
            {icon: 'bell-outline', label: 'Notifications', toggle: true, key: 'notifications'},
            {icon: 'map-marker-outline', label: 'Location Services', toggle: true, key: 'location'},
            {icon: 'translate', label: 'Language', value: 'English', nav: null},
        ],
    },
    {
        title: 'Payment',
        items: [
            {icon: 'star-circle-outline', label: 'Membership & Plans', nav: 'Membership'},
            {icon: 'wallet-outline', label: 'Wallet & Top Up', nav: 'TopUp'},
            {icon: 'history', label: 'Transaction History', nav: 'History'},
            {icon: 'credit-card-outline', label: 'Payment Methods', nav: null},
        ],
    },
    {
        title: 'Support',
        items: [
            {icon: 'help-circle-outline', label: 'Help & Support', nav: 'HelpSupport'},
            {icon: 'information-outline', label: 'About App', nav: null},
            {icon: 'star-outline', label: 'Rate the App', nav: null},
        ],
    },
];

const SettingsScreen = ({navigation}) => {
    const [toggles, setToggles] = useState({notifications: true, location: true});

    const toggle = (key) => setToggles(prev => ({...prev, [key]: !prev[key]}));

    const user = useUserStore(s => s.user);
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your profile';
    const phone = user?.phone_number || '—';

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content"/>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#07163B"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{width: 24}}/>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>

                {/* Profile Card */}
                <TouchableOpacity
                    style={styles.profileCard}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={styles.profileAvatar}>
                        <Icon name="account" size={28} color="#CCCCCC"/>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{fullName}</Text>
                        <Text style={styles.profilePhone}>{phone}</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#AAAAAA"/>
                </TouchableOpacity>

                {SECTIONS.map(section => (
                    <View key={section.title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionCard}>
                            {section.items.map((item, i) => (
                                <TouchableOpacity
                                    key={item.label}
                                    style={[styles.settingRow, i < section.items.length - 1 && styles.settingBorder]}
                                    onPress={() => item.nav && navigation.navigate(item.nav)}
                                    activeOpacity={item.toggle ? 1 : 0.7}
                                >
                                    <View style={styles.settingIconBox}>
                                        <Icon name={item.icon} size={18} color="#07163B"/>
                                    </View>
                                    <Text style={styles.settingLabel}>{item.label}</Text>
                                    {item.toggle ? (
                                        <Switch
                                            value={toggles[item.key]}
                                            onValueChange={() => toggle(item.key)}
                                            trackColor={{false: '#E0E0E0', true: '#FFD400'}}
                                            thumbColor="#FFFFFF"
                                            ios_backgroundColor="#E0E0E0"
                                            style={{transform: [{scaleX: 0.85}, {scaleY: 0.85}]}}
                                        />
                                    ) : item.value ? (
                                        <Text style={styles.settingValue}>{item.value}</Text>
                                    ) : (
                                        <Icon name="chevron-right" size={18} color="#AAAAAA"/>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout */}
                <View style={styles.section}>
                    <View style={styles.sectionCard}>
                        <TouchableOpacity style={styles.settingRow}>
                            <View style={[styles.settingIconBox, {
                                backgroundColor: '#FFF0F2',
                                borderColor: 'rgba(216,63,84,0.2)'
                            }]}>
                                <Icon name="power" size={18} color="#D83F54"/>
                            </View>
                            <Text style={[styles.settingLabel, {color: '#D83F54'}]}>Log Out</Text>
                            <Icon name="chevron-right" size={18} color="#D83F54"/>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.version}>v2.4.0 · Developed by Nouman Afzal</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1, backgroundColor: '#F5F5F7'},
    header: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#EAEDEE',
    },
    headerTitle: {fontSize: 17, fontFamily: Fonts.semiBold, color: '#07163B'},

    profileCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', padding: 16,
    },
    profileAvatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#EEEEEE', alignItems: 'center', justifyContent: 'center',
    },
    profileInfo: {flex: 1},
    profileName: {fontSize: 15, fontFamily: Fonts.semiBold, color: '#202223', marginBottom: 3},
    profilePhone: {fontSize: 13, fontFamily: Fonts.regular, color: '#5D5F62'},

    section: {paddingHorizontal: 16, marginBottom: 8},
    sectionTitle: {
        fontSize: 12, fontFamily: Fonts.semiBold,
        color: '#AAAAAA', textTransform: 'uppercase',
        letterSpacing: 0.8, marginBottom: 8,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#EAEDEE', overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
    },
    settingBorder: {borderBottomWidth: 1, borderBottomColor: '#F5F5F5'},
    settingIconBox: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#FFFBEA', borderWidth: 1,
        borderColor: '#FFE066', alignItems: 'center', justifyContent: 'center',
    },
    settingLabel: {flex: 1, fontSize: 14, fontFamily: Fonts.medium, color: '#202223'},
    settingValue: {fontSize: 13, fontFamily: Fonts.regular, color: '#AAAAAA'},

    serverBox: {padding: 16, gap: 10},
    serverLabel: {fontSize: 13, fontFamily: Fonts.semiBold, color: '#202223'},
    serverInput: {
        borderWidth: 1, borderColor: '#D7DBDE', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 11, backgroundColor: '#FFFFFF',
        fontFamily: Fonts.regular, fontSize: 13, color: '#07163B',
    },
    serverRow: {flexDirection: 'row', gap: 10},
    serverSave: {flex: 1, backgroundColor: '#FFD400', borderRadius: 10, paddingVertical: 12, alignItems: 'center'},
    serverSaveText: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#111111'},
    serverReset: {paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#D7DBDE', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center'},
    serverResetText: {fontSize: 14, fontFamily: Fonts.semiBold, color: '#5D5F62'},
    serverHint: {fontSize: 11.5, fontFamily: Fonts.regular, color: '#9AA0A6', lineHeight: 16},

    version: {
        textAlign: 'center', fontSize: 12,
        fontFamily: Fonts.regular, color: '#AAAAAA',
        marginTop: 8, marginBottom: 16,
    },
});

export default SettingsScreen;
