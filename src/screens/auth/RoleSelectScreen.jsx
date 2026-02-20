import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    StatusBar, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Fonts from '../../constants/fonts';
import { useApp } from '../../context/AppContext';

const { height } = Dimensions.get('window');

const ROLES = [
    {
        id: 'rider',
        label: "I'm a Rider",
        desc: 'Book rides and travel to your destination quickly and safely',
        icon: 'account-tie',
        iconBg: '#FFFBEA',
        iconBgActive: '#FFD400',
        iconColor: '#07163B',
    },
    {
        id: 'driver',
        label: "I'm a Driver",
        desc: 'Earn money on your schedule by giving rides in your city',
        icon: 'steering',
        iconBg: '#FFFBEA',
        iconBgActive: '#FFD400',
        iconColor: '#07163B',
    },
];

const RoleSelectScreen = ({ navigation }) => {
    const { setRole } = useApp();
    const [selected, setSelected] = useState(null);

    const handleContinue = () => {
        if (!selected) return;
        setRole(selected);
        navigation.navigate('Main', { role: selected });
    };

    return (
        <View style={styles.root}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>EZRide</Text>
                <Text style={styles.title}>How would you like{'\n'}to use EZRide?</Text>
                <Text style={styles.subtitle}>Choose your role to get started</Text>
            </View>

            {/* Cards */}
            <View style={styles.cardsContainer}>
                {ROLES.map(role => (
                    <TouchableOpacity
                        key={role.id}
                        style={[styles.card, selected === role.id && styles.cardSelected]}
                        onPress={() => setSelected(role.id)}
                        activeOpacity={0.85}
                    >
                        <View style={[
                            styles.iconContainer,
                            { backgroundColor: selected === role.id ? role.iconBgActive : role.iconBg },
                        ]}>
                            <Icon name={role.icon} size={28} color={role.iconColor} />
                        </View>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>{role.label}</Text>
                            <Text style={styles.cardDesc}>{role.desc}</Text>
                        </View>
                        <View style={[styles.radio, selected === role.id && styles.radioSelected]}>
                            {selected === role.id && <View style={styles.radioDot} />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Bottom */}
            <View style={styles.bottom}>
                <TouchableOpacity
                    style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    activeOpacity={selected ? 0.85 : 1}
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
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 28,
        marginBottom: 32,
    },
    logo: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        color: '#1D3461',
        letterSpacing: 2,
        marginBottom: 28,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        color: '#07163B',
        lineHeight: 38,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    cardsContainer: {
        flex: 1,
        paddingHorizontal: 28,
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#EAEDEE',
        borderRadius: 16,
        padding: 20,
        backgroundColor: '#FFFFFF',
        gap: 16,
    },
    cardSelected: {
        borderColor: '#FFD400',
        backgroundColor: '#FFFDF0',
        shadowColor: '#FFD400',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    iconContainer: {
        width: 58,
        height: 58,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: Fonts.semiBold,
        color: '#07163B',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        lineHeight: 18,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D7DBDE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: '#1D3461',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#1D3461',
    },
    bottom: {
        paddingHorizontal: 28,
        paddingBottom: 48,
        gap: 20,
    },
    continueBtn: {
        backgroundColor: '#FFD400',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    continueBtnDisabled: {
        backgroundColor: '#F5F5F5',
    },
    continueText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#111111',
    },
    continueTextDisabled: {
        color: '#AAAAAA',
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    loginLink: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#1D3461',
    },
});

export default RoleSelectScreen;
