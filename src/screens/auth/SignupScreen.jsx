import React, { useState } from 'react';
import {
    View, Text, StyleSheet, StatusBar,
    TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Fonts from '../../constants/fonts';
import Button from '../../components/Button';
import Input from '../../components/Input';

const SignupScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Logo - Top */}
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>EZRide</Text>
            </View>

            {/* Middle - Form centered */}
            <ScrollView
                contentContainerStyle={styles.formContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Sign Up</Text>
                <Text style={styles.subtitle}>Join us and start your journey today</Text>

                <Input
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholderTextColor="#202223"
                />
                <Input
                    placeholder="Email Address (Optional)"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    autoCapitalize="none"
                    placeholderTextColor="#202223"
                />
                <Input
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    placeholderTextColor="#202223"
                />

                <Button
                    title="Sign Up"
                    onPress={() => navigation.navigate('Onboarding')}
                    style={styles.button}
                    textStyle={styles.buttonText}
                />

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.linkRow}>
                    <Text style={styles.linkText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkBold}>Log In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Need Help - Pinned Bottom */}
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
        flexGrow: 1,
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
        marginBottom: 14,
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
        marginBottom: 20,
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

export default SignupScreen;
