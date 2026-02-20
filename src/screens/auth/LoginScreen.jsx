import React, { useState } from 'react';
import {
    View, Text, StyleSheet, StatusBar,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import Fonts from '../../constants/fonts';
import Button from '../../components/Button';
import Input from '../../components/Input';

const LoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Logo */}
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>EZRide</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
                <Text style={styles.title}>Login</Text>
                <Text style={styles.subtitle}>Enter your phone number to log in.</Text>

                <Input
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    placeholderTextColor="#202223"
                />

                <Button
                    title="Login"
                    onPress={() => navigation.navigate('OTP')}
                    style={styles.button}
                    textStyle={styles.buttonText}
                />

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Guest Mode */}
                <TouchableOpacity
                    style={styles.guestBtn}
                    onPress={() => navigation.navigate('Main')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.guestText}>Continue as Guest</Text>
                </TouchableOpacity>

                <View style={styles.linkRow}>
                    <Text style={styles.linkText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                        <Text style={styles.linkBold}>Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Need Help */}
            <TouchableOpacity style={styles.helpBtn}>
                <Text style={styles.helpText}>Need Help?</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    logoContainer: {
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 16,
    },
    logo: {
        fontSize: 36,
        fontFamily: Fonts.bold,
        color: '#1D3461',
        letterSpacing: 2,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingBottom: 20,
    },
    title: {
        fontSize: 26,
        fontFamily: Fonts.bold,
        color: '#07163B',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
        marginBottom: 28,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginBottom: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: '#111111',
        fontFamily: Fonts.semiBold,
        fontSize: 16,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    guestBtn: {
        borderWidth: 1.5,
        borderColor: '#EAEDEE',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#F9F9F9',
    },
    guestText: {
        fontSize: 15,
        fontFamily: Fonts.medium,
        color: '#5D5F62',
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    linkText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#5D5F62',
    },
    linkBold: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#1D3461',
    },
    helpBtn: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    helpText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: '#1D3461',
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;
