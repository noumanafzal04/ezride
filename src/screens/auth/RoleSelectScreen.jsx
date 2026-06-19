import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import { useApp } from '../../context/AppContext';

const ROLES = [
    {
        id: 'rider',
        label: "I'm a Rider",
        desc: 'Book rides and reach your destination quickly and safely.',
        icon: 'map-marker-account',
    },
    {
        id: 'driver',
        label: "I'm a Driver",
        desc: 'Earn on your own schedule by giving rides in your city.',
        icon: 'steering',
    },
];

const RoleSelectScreen = ({ navigation }) => {
    const { setRole } = useApp();
    const [selected, setSelected] = useState(null);

    const handleContinue = () => {
        if (!selected) return;
        setRole(selected);
        navigation.navigate(selected === 'driver' ? 'DriverOnboarding' : 'Main');
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>EZRide</Text>
                <Text style={styles.title}>Let's get you started</Text>
                <Text style={styles.subtitle}>Choose how you'd like to use EZRide.</Text>
            </View>

            {/* Cards */}
            <View style={styles.cardsContainer}>
                {ROLES.map(role => {
                    const active = selected === role.id;
                    return (
                        <TouchableOpacity
                            key={role.id}
                            style={[styles.card, active && styles.cardSelected]}
                            onPress={() => setSelected(role.id)}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                                <Icon name={role.icon} size={26} color={active ? '#07163B' : '#9CA3AF'} />
                            </View>
                            <View style={styles.cardText}>
                                <Text style={styles.cardTitle}>{role.label}</Text>
                                <Text style={styles.cardDesc}>{role.desc}</Text>
                            </View>
                            <View style={[styles.radio, active && styles.radioSelected]}>
                                {active && <Icon name="check" size={14} color="#FFFFFF" />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Bottom */}
            <View style={styles.bottom}>
                <TouchableOpacity
                    style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    disabled={!selected}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.continueText, !selected && styles.continueTextDisabled]}>
                        Continue
                    </Text>
                </TouchableOpacity>

                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },

    header: {
        paddingTop: 72,
        paddingHorizontal: 28,
        marginBottom: 40,
    },
    logo: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        color: '#1D3461',
        letterSpacing: 2,
        marginBottom: 36,
    },
    title: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        color: '#07163B',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#6B7280',
        lineHeight: 20,
    },

    cardsContainer: {
        flex: 1,
        paddingHorizontal: 28,
        gap: 14,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#EDEFF2',
        borderRadius: 18,
        padding: 18,
        backgroundColor: '#FFFFFF',
        gap: 16,
    },
    cardSelected: {
        borderColor: '#FFD400',
        backgroundColor: '#FFFDF3',
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F6F8',
    },
    iconContainerActive: {
        backgroundColor: '#FFD400',
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 12.5,
        fontFamily: Fonts.regular,
        color: '#6B7280',
        lineHeight: 18,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D7DBDE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#1D3461',
        backgroundColor: '#1D3461',
    },

    bottom: {
        paddingHorizontal: 28,
        paddingBottom: 44,
        paddingTop: 16,
        gap: 18,
    },
    continueBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueBtnDisabled: {
        backgroundColor: '#F1F2F4',
    },
    continueText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
    continueTextDisabled: {
        color: '#AEB3B9',
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#6B7280',
    },
    loginLink: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#1D3461',
    },
});

export default RoleSelectScreen;
